import XCTest

@testable import Loom

/// Routing decisions for `.loomCaptureFromURL` notifications — the
/// AppleEvent handler posts them, the mounted root view consumes them.
/// These tests pin the decode/route contract so the consumer can move
/// between root shells (minimal → dossier) without silently dropping
/// captures again.
final class CaptureURLRouterTests: XCTestCase {

    private func captureURL(json: String) -> URL {
        let encoded = json.addingPercentEncoding(withAllowedCharacters: .alphanumerics)!
        return URL(string: "loom://capture?payload=\(encoded)")!
    }

    func testSubstantivePayloadRoutesToCaptureSheet() {
        let url = captureURL(json: #"{"url":"https://example.com/a","title":"Title","body":"Body text"}"#)
        let outcome = CaptureURLRouter.route(userInfo: ["url": url])
        guard case .openCapture(let payload) = outcome else {
            XCTFail("expected openCapture, got \(outcome)")
            return
        }
        XCTAssertEqual(payload.title, "Title")
        XCTAssertEqual(payload.body, "Body text")
        XCTAssertEqual(payload.url, "https://example.com/a")
        XCTAssertNil(outcome.failureToast)
    }

    func testSelectionOnlyPayloadStillOpensCapture() {
        let url = captureURL(json: #"{"url":"https://example.com/a","title":"T","selection":"picked text"}"#)
        guard case .openCapture(let payload) = CaptureURLRouter.route(userInfo: ["url": url]) else {
            XCTFail("selection-only payload should open the capture sheet")
            return
        }
        XCTAssertEqual(payload.selection, "picked text")
    }

    func testMalformedJSONRoutesToDecodeFailure() {
        let url = captureURL(json: #"{"title": <not json>"#)
        let outcome = CaptureURLRouter.route(userInfo: ["url": url])
        guard case .decodeFailed = outcome else {
            XCTFail("expected decodeFailed, got \(outcome)")
            return
        }
        XCTAssertNotNil(outcome.failureToast)
    }

    func testMetadataOnlyPayloadRoutesToEmptyPayload() {
        // Valid JSON, but no body / selection / snapshot / media / AST —
        // nothing substantive to capture.
        let url = captureURL(json: #"{"url":"https://example.com/a","title":"Only metadata"}"#)
        let outcome = CaptureURLRouter.route(userInfo: ["url": url])
        guard case .emptyPayload = outcome else {
            XCTFail("expected emptyPayload, got \(outcome)")
            return
        }
        XCTAssertNotNil(outcome.failureToast)
    }

    func testWhitespaceOnlyBodyRoutesToEmptyPayload() {
        let url = captureURL(json: #"{"url":"https://example.com/a","title":"T","body":"  \n  "}"#)
        guard case .emptyPayload = CaptureURLRouter.route(userInfo: ["url": url]) else {
            XCTFail("whitespace-only body should route to emptyPayload")
            return
        }
    }

    func testMissingUserInfoRoutesToDecodeFailure() {
        guard case .decodeFailed = CaptureURLRouter.route(userInfo: nil) else {
            XCTFail("nil userInfo should route to decodeFailed")
            return
        }
    }

    func testWrongTypedURLEntryRoutesToDecodeFailure() {
        guard case .decodeFailed = CaptureURLRouter.route(userInfo: ["url": "loom://capture?payload=x"]) else {
            XCTFail("String (non-URL) userInfo entry should route to decodeFailed")
            return
        }
    }

    func testRouteByURLMatchesRouteByUserInfo() {
        let url = captureURL(json: #"{"url":"https://example.com/a","title":"T","body":"Body"}"#)
        guard case .openCapture(let payload) = CaptureURLRouter.route(url: url) else {
            XCTFail("route(url:) should decode the same payload as route(userInfo:)")
            return
        }
        XCTAssertEqual(payload.body, "Body")
        guard case .decodeFailed = CaptureURLRouter.route(url: nil) else {
            XCTFail("nil URL should route to decodeFailed")
            return
        }
    }
}

/// Cold-launch handoff: the AppleEvent can arrive before any root view
/// has subscribed to `.loomCaptureFromURL`. The relay parks the URL —
/// with the delivery token that dedupes the delayed reposts — so a root
/// view appearing later can pick it up instead of the capture being
/// dropped. Reading is non-destructive: several root-view instances may
/// mount during the launch window-settling dance (SwiftUI scene +
/// AppKit fallback), and EACH must present the sheet so the one that
/// ends up frontmost shows it; per-instance token tracking prevents
/// double handling within one instance.
@MainActor
final class LoomCaptureURLRelayTests: XCTestCase {

    override func setUp() {
        super.setUp()
        LoomCaptureURLRelay.clear()
    }

    func testPendingReturnsParkedURLAndToken() {
        let url = URL(string: "loom://capture?via=clipboard")!
        let token = UUID()
        LoomCaptureURLRelay.savePending(url, token: token)
        XCTAssertEqual(LoomCaptureURLRelay.pending()?.url, url)
        XCTAssertEqual(LoomCaptureURLRelay.pending()?.token, token)
        // Non-destructive: a second root-view instance must also see it.
        XCTAssertNotNil(LoomCaptureURLRelay.pending())
    }

    func testPendingWithoutParkReturnsNil() {
        XCTAssertNil(LoomCaptureURLRelay.pending())
    }

    func testLaterParkReplacesEarlierOne() {
        let first = URL(string: "loom://capture?payload=a")!
        let second = URL(string: "loom://capture?payload=b")!
        LoomCaptureURLRelay.savePending(first, token: UUID())
        let secondToken = UUID()
        LoomCaptureURLRelay.savePending(second, token: secondToken)
        XCTAssertEqual(LoomCaptureURLRelay.pending()?.url, second)
        XCTAssertEqual(LoomCaptureURLRelay.pending()?.token, secondToken)
    }

    func testClearRemovesPending() {
        LoomCaptureURLRelay.savePending(URL(string: "loom://capture?payload=a")!, token: UUID())
        LoomCaptureURLRelay.clear()
        XCTAssertNil(LoomCaptureURLRelay.pending())
    }

    func testClearIfTokenOnlyRemovesMatchingDelivery() {
        let staleToken = UUID()
        LoomCaptureURLRelay.savePending(URL(string: "loom://capture?payload=a")!, token: staleToken)
        let freshToken = UUID()
        LoomCaptureURLRelay.savePending(URL(string: "loom://capture?payload=b")!, token: freshToken)
        // An expiry timer from the FIRST capture must not clear the second.
        LoomCaptureURLRelay.clear(ifToken: staleToken)
        XCTAssertEqual(LoomCaptureURLRelay.pending()?.token, freshToken)
        LoomCaptureURLRelay.clear(ifToken: freshToken)
        XCTAssertNil(LoomCaptureURLRelay.pending())
    }
}

/// Cross-shell arbitration: two DIFFERENT live shells can subscribe to
/// `.loomCaptureFromURL` at once — the reflection workspace (primary;
/// main window and the AppKit fallback window both mount it) and the
/// "You" dossier window (secondary). Per-instance token gating alone
/// let BOTH present a CaptureSheet for the same capture. The relay
/// arbitrates: primaries keep the settle-dance semantics (every
/// mounting instance may present), while a secondary only consumes a
/// delivery when no primary shell is mounted — and its claim is
/// recorded so a primary that mounts moments later (the capture
/// handler re-opens the main window) does not re-present.
@MainActor
final class LoomCaptureShellArbitrationTests: XCTestCase {

    func testSecondaryClaimSucceedsWhenNoPrimaryShellMounted() {
        let token = UUID()
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        XCTAssertTrue(LoomCaptureURLRelay.claimedBySecondaryShell(token: token))
    }

    func testSecondaryDefersWhilePrimaryShellMountedThenClaimsAfterUnregister() {
        let token = UUID()
        LoomCaptureURLRelay.registerPrimaryShell()
        XCTAssertFalse(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        XCTAssertFalse(LoomCaptureURLRelay.claimedBySecondaryShell(token: token))
        LoomCaptureURLRelay.unregisterPrimaryShell()
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
    }

    func testSecondaryDefersUntilEveryLaunchDancePrimaryUnmounts() {
        // The launch window-settling dance can mount SEVERAL primary
        // instances (SwiftUI scene + AppKit fallback); the secondary
        // must defer while ANY of them is still alive.
        let token = UUID()
        LoomCaptureURLRelay.registerPrimaryShell()
        LoomCaptureURLRelay.registerPrimaryShell()
        LoomCaptureURLRelay.unregisterPrimaryShell()
        XCTAssertFalse(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        LoomCaptureURLRelay.unregisterPrimaryShell()
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
    }

    func testSecondaryClaimIsSingleUsePerToken() {
        // The dossier sees the same delivery twice (relay pickup on
        // appear + the notification); the second sighting must not
        // re-present.
        let token = UUID()
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        XCTAssertFalse(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        // A NEW capture (fresh token) is a separate delivery.
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: UUID()))
    }

    func testPrimarySkipsTokenAlreadyClaimedBySecondary() {
        // Dossier-only capture re-opens the main window; the primary
        // that mounts afterwards must not present the same delivery.
        let token = UUID()
        XCTAssertFalse(LoomCaptureURLRelay.claimedBySecondaryShell(token: token))
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: token))
        XCTAssertTrue(LoomCaptureURLRelay.claimedBySecondaryShell(token: token))
    }

    func testTokenlessDeliveryClaimsWithoutRecording() {
        // A delivery with no token can't be deduped across shells —
        // allow it when no primary is mounted, but record nothing.
        XCTAssertTrue(LoomCaptureURLRelay.claimForSecondaryShell(token: nil))
        XCTAssertFalse(LoomCaptureURLRelay.claimedBySecondaryShell(token: nil))
        LoomCaptureURLRelay.registerPrimaryShell()
        XCTAssertFalse(LoomCaptureURLRelay.claimForSecondaryShell(token: nil))
        LoomCaptureURLRelay.unregisterPrimaryShell()
    }
}
