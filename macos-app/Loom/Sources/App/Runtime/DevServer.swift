import Foundation

/// The static-bundle server state object.
///
/// This used to be an 843-line dev-server manager that could spawn a local
/// `next dev` process, scan ports, health-check and hot-reload the web side
/// (`LOOM_USE_DEV_SERVER=1`). That machinery was web-development-era tooling;
/// with the native workbench primary and the web bundle reduced to the You
/// dossier / CV surface, it was deleted in the 2026-07-08 partition follow-up
/// (owner-approved). Web-side iteration now happens in a browser via
/// `npm run dev`; the app always serves the shipped static export through the
/// always-on `loom://` scheme handler.
///
/// The published `status` survives because hosts gate their webview mount on
/// `.ready`; `start()`/`stop()` survive as the AppDelegate's lifecycle calls.
class DevServer: ObservableObject {
    enum Status: Equatable {
        case idle
        case starting
        case ready
        case failed(String)
    }

    @Published var status: Status = .idle

    /// Whether the app is running under the App Sandbox. Detected by
    /// checking if the container path is present in NSHomeDirectory —
    /// sandboxed apps get `~/Library/Containers/<bundle-id>/Data`.
    static var isSandboxed: Bool {
        NSHomeDirectory().contains("/Containers/")
    }

    /// URL the webview loads: the native `loom://` content channel, always.
    var webviewURL: URL {
        URL(string: "loom://bundle/index.html")!
    }

    init(projectPath: String? = nil) {}

    /// The `loom://` scheme handler is always live — there's nothing to
    /// boot — so publish `.ready` right away so webview hosts mount
    /// instead of sitting on a loading state forever.
    func markReadyForStaticBundle() {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in
                self?.markReadyForStaticBundle()
            }
            return
        }
        status = .ready
    }

    /// Legacy dev-mode entry point (`LOOM_USE_DEV_SERVER=1` used to launch a
    /// local next-dev process here). The static bundle is the only mode now.
    func start() {
        markReadyForStaticBundle()
    }

    func stop() {}

    /// Kept for the provider-settings panes: this used to restart the node
    /// dev process so a fresh child re-read API keys from the Keychain.
    /// There is no child process anymore — the native AI clients read the
    /// Keychain per call — so reloading is a deliberate no-op.
    func reloadFromKeychain() {}
}
