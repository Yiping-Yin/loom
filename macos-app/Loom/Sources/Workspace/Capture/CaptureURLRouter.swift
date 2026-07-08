import Foundation

/// Outcome of routing a `.loomCaptureFromURL` notification. The
/// AppleEvent handler (`AppDelegate.handleCaptureURL`) posts the raw
/// URL; the mounted root view routes it through here and either opens
/// the CaptureSheet or surfaces the failure toast. Keeping the decision
/// in one place means the consumer can move between root shells
/// (minimal → dossier) without re-deriving — or silently dropping —
/// the decode contract.
enum CaptureURLRouteOutcome {
    case openCapture(CaptureWebPayload)
    case decodeFailed
    case emptyPayload

    /// User-facing toast for the failure outcomes; nil when the
    /// capture sheet should open instead.
    var failureToast: String? {
        switch self {
        case .openCapture:
            return nil
        case .decodeFailed:
            return "Couldn't decode capture payload."
        case .emptyPayload:
            return "Capture payload was empty. Re-capture from the page."
        }
    }
}

enum CaptureURLRouter {
    /// Route a `.loomCaptureFromURL` notification's userInfo. Expects a
    /// `"url"` entry holding the original `loom://capture?…` URL —
    /// payload-in-URL and `via=clipboard` transports are both handled
    /// by `CaptureWebPayload.from(url:)`.
    static func route(userInfo: [AnyHashable: Any]?) -> CaptureURLRouteOutcome {
        route(url: userInfo?["url"] as? URL)
    }

    /// Route a raw capture URL — the relay/`onAppear` path, where there
    /// is no notification wrapper.
    static func route(url: URL?) -> CaptureURLRouteOutcome {
        guard let url, let payload = CaptureWebPayload.from(url: url) else {
            return .decodeFailed
        }
        guard payload.hasSubstantiveCaptureContent else {
            return .emptyPayload
        }
        return .openCapture(payload)
    }
}

/// Parks a capture URL that arrived before the root views settled — on
/// a cold launch the AppleEvent lands during app startup, ahead of the
/// SwiftUI scene mounting, and the AppDelegate's window-repair dance can
/// mount SEVERAL root-view instances (AppKit fallback first, SwiftUI
/// scene moments later) with no way to know which window ends up
/// frontmost. So `pending()` is non-destructive: every instance that
/// appears during the settling window presents the sheet, and whichever
/// window the user actually sees has it. The `token` identifies one
/// delivery — each view instance tracks the last token it handled so it
/// never double-presents, while a NEW capture (which can carry the
/// byte-identical `loom://capture?via=clipboard` URL) gets a fresh
/// token and legitimately replaces an open sheet.
///
/// Deliberately in-memory, not UserDefaults (unlike
/// `LoomBundleRouteRelay`): a capture URL must not survive the process
/// and re-open a stale sheet on a later launch — with `via=clipboard`
/// transport the pasteboard would re-decode to whatever the user copied
/// since. The AppleEvent handler expires the parked entry shortly after
/// posting for the same reason.
///
/// The settle-dance semantics above only cover instances of the SAME
/// shell. Two DIFFERENT live shells can also subscribe at once — the
/// reflection workspace (primary; the main window and the AppKit
/// fallback window both mount it) and the "You" dossier window
/// (secondary) — and per-instance token gating alone let both present
/// a CaptureSheet for one capture. The shell-arbitration members below
/// make delivery single-consumer across shells: primaries register
/// while mounted and keep presenting exactly as before; a secondary
/// consumes a delivery only when NO primary is mounted, and its claim
/// is recorded so a primary mounting moments later (the capture
/// handler re-opens the main window) skips the already-presented
/// delivery.
@MainActor
enum LoomCaptureURLRelay {
    private static var parked: (url: URL, token: UUID)?
    private static var mountedPrimaryShells = 0
    private static var secondaryClaimedTokens: Set<UUID> = []

    static func savePending(_ url: URL, token: UUID) {
        parked = (url, token)
    }

    /// Non-destructive read — see type comment for why every settling
    /// root-view instance gets to see the same delivery.
    static func pending() -> (url: URL, token: UUID)? {
        parked
    }

    static func clear() {
        parked = nil
    }

    /// Expiry guarded by token: a timer from an earlier capture must not
    /// clear a newer one parked in the meantime.
    static func clear(ifToken token: UUID) {
        guard parked?.token == token else { return }
        parked = nil
    }

    // MARK: - Cross-shell arbitration

    /// The reflection workspace calls these from onAppear/onDisappear.
    /// A count, not a flag: the launch settle dance can mount several
    /// primary instances at once.
    static func registerPrimaryShell() {
        mountedPrimaryShells += 1
    }

    static func unregisterPrimaryShell() {
        mountedPrimaryShells = max(0, mountedPrimaryShells - 1)
    }

    /// A secondary shell (the dossier window) asks before presenting a
    /// delivery — from either the notification or the parked-URL pickup
    /// on appear. Grants only when no primary shell is mounted, at most
    /// once per token; a tokenless delivery can't be deduped across
    /// shells, so it is granted without being recorded.
    static func claimForSecondaryShell(token: UUID?) -> Bool {
        guard mountedPrimaryShells == 0 else { return false }
        guard let token else { return true }
        return secondaryClaimedTokens.insert(token).inserted
    }

    /// Primary shells skip deliveries a secondary already presented —
    /// the dossier-only capture path re-opens the main window, and the
    /// primary mounting into it must not show a second sheet.
    static func claimedBySecondaryShell(token: UUID?) -> Bool {
        guard let token else { return false }
        return secondaryClaimedTokens.contains(token)
    }
}
