import SwiftUI

/// Native root that presents the LATEST Loom — the web identity product
/// (Home · About · Education · Experience · Digital Me, plus the cool-black
/// working surfaces) — as a single full-window WebView.
///
/// This replaces the earlier `LoomMinimalRootView` Sources/Draft tool shell as
/// the app's primary surface so the macOS app and the shipped web product are
/// one and the same. The webview loads `DevServer.webviewURL` — the bundled
/// static export (`loom://bundle/index.html`) in a Release build, or the live
/// dev server when `LOOM_USE_DEV_SERVER=1`. The cool-black Evidence Desk theme
/// is injected via `LoomWebView`'s theme-sync script.
struct LoomDossierRootView: View {
    @EnvironmentObject var server: DevServer
    @StateObject private var webState = WebDebugState()
    @AppStorage("theme") private var theme: String = "dark"

    /// Phase A3 web capture — the extension/bookmarklet fires
    /// `loom://capture?…`, the AppleEvent handler posts
    /// `.loomCaptureFromURL`, and the MOUNTED root view must consume it.
    /// This shell is mounted by both the SwiftUI scene window and
    /// `AppDelegate.createFallbackMainWindow()`, so handling it here
    /// covers both. (The previous consumer lived in the unmounted
    /// `LoomMinimalRootView`, which silently dropped every capture.)
    @State private var capturePayload: CapturePayload?
    @State private var captureToast: String?
    @State private var lastCaptureURL: URL?
    /// Token of the last capture delivery this instance handled —
    /// several root-view instances can be mounted during the launch
    /// window dance, and each may see the same delivery via both the
    /// relay (on appear) and the notification. Gate on the token so one
    /// instance never double-presents, while a new capture (fresh
    /// token) still replaces an open sheet.
    @State private var lastHandledCaptureToken: UUID?

    /// Evidence Desk defaults to the cool-black identity; only an explicit
    /// "light" choice opts out.
    private var forcedTheme: String { theme == "light" ? "light" : "dark" }

    var body: some View {
        LoomWebView(url: server.webviewURL, debugState: webState, forcedTheme: forcedTheme)
            .ignoresSafeArea()
            .background(LoomTokens.dsPaperDeep.ignoresSafeArea())
            .sheet(isPresented: Binding<Bool>(
                get: { capturePayload != nil },
                set: { if !$0 { capturePayload = nil } }
            )) {
                CaptureSheet(payload: $capturePayload, onSaved: handleCaptureSaved)
            }
            .overlay(alignment: .bottom) { captureToastOverlay }
            .onAppear {
                // Cold launch: the AppleEvent handler ran before this view
                // subscribed and parked the capture URL in the relay.
                guard let pending = LoomCaptureURLRelay.pending(),
                      pending.token != lastHandledCaptureToken else { return }
                lastHandledCaptureToken = pending.token
                loomCaptureLog("Dossier root: picked up pending capture URL on appear")
                handleCaptureRoute(CaptureURLRouter.route(url: pending.url))
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomCaptureFromURL)) { note in
                let token = note.userInfo?["token"] as? UUID
                if let token, token == lastHandledCaptureToken { return }
                lastHandledCaptureToken = token
                loomCaptureLog("Dossier root: received capture notification")
                handleCaptureRoute(CaptureURLRouter.route(userInfo: note.userInfo))
            }
    }

    // MARK: - Capture from URL

    private func handleCaptureRoute(_ outcome: CaptureURLRouteOutcome) {
        switch outcome {
        case .openCapture(let payload):
            startWebCapture(payload)
        case .decodeFailed, .emptyPayload:
            loomCaptureLog("Dossier root: capture route failed — \(outcome.failureToast ?? "unknown")")
            showToast(outcome.failureToast ?? "Capture failed.")
        }
    }

    private func startWebCapture(_ payload: CaptureWebPayload) {
        let anchors = CaptureAnchorResolver.resolveForWebCapture(
            payload,
            preferredRootID: nil
        )
        guard let primary = anchors.first else {
            loomCaptureLog("Dossier root: no capture anchors (no content roots) — toast shown")
            showToast("Open a folder in Loom first to enable web capture.", duration: 2.5)
            return
        }
        let windows = NSApp.windows
            .map { "#\($0.windowNumber) \($0.identifier?.rawValue ?? $0.title) vis=\($0.isVisible) key=\($0.isKeyWindow)" }
            .joined(separator: " | ")
        loomCaptureLog("Dossier root: presenting capture sheet (anchor: \(primary.label)); windows: \(windows)")
        capturePayload = CapturePayload.makeFromWebPayload(payload, anchor: primary, available: anchors)
    }

    private func handleCaptureSaved(_ url: URL) {
        lastCaptureURL = url
        let folder = url.deletingLastPathComponent().lastPathComponent
        captureToast = "Captured to \(folder)"
        NotificationCenter.default.post(name: .loomCaptureSaved, object: nil)
        NotificationCenter.default.post(name: .loomRefreshActivePage, object: nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.5) {
            withAnimation {
                captureToast = nil
                lastCaptureURL = nil
            }
        }
    }

    private func showToast(_ message: String, duration: Double = 2.0) {
        captureToast = message
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            if captureToast == message { captureToast = nil }
        }
    }

    /// Same capsule confirmation the minimal shell shows — message plus
    /// Reveal/Open for the just-saved capture file.
    @ViewBuilder
    private var captureToastOverlay: some View {
        if let msg = captureToast {
            HStack(spacing: DSSpace.sm.value + 2) {
                Text(msg)
                    .font(.system(size: 12, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                if let url = lastCaptureURL {
                    Button {
                        NSWorkspace.shared.activateFileViewerSelecting([url])
                    } label: {
                        Label("Reveal", systemImage: "magnifyingglass")
                            .font(.system(size: DSType.eyebrow.size, design: .serif))
                            .labelStyle(.titleAndIcon)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(LoomTokens.dsThread)
                    Button {
                        NSWorkspace.shared.open(url)
                    } label: {
                        Label("Open", systemImage: "doc.text")
                            .font(.system(size: DSType.eyebrow.size, design: .serif))
                            .labelStyle(.titleAndIcon)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(LoomTokens.dsThread)
                }
            }
            .padding(.horizontal, DSSpace.md.value - 2)
            .padding(.vertical, DSSpace.sm.value - 1)
            .background(.ultraThinMaterial, in: Capsule())
            .padding(.bottom, DSSpace.lg.value)
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        }
    }
}
