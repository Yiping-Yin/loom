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

    /// Evidence Desk defaults to the cool-black identity; only an explicit
    /// "light" choice opts out.
    private var forcedTheme: String { theme == "light" ? "light" : "dark" }

    var body: some View {
        LoomWebView(url: server.webviewURL, debugState: webState, forcedTheme: forcedTheme)
            .ignoresSafeArea()
            .background(LoomTokens.dsPaperDeep.ignoresSafeArea())
    }
}
