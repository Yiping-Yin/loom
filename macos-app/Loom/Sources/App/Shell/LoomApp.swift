import SwiftUI
import AppKit
import ApplicationServices
import CoreGraphics
import UniformTypeIdentifiers

private let showDebugHUDDefaultsKey = "loom.showDebugHUD.v2"
private let loomWorkspaceMinimumSize = NSSize(width: 1184, height: 720)
private let loomExternalCompanionSize = NSSize(width: 276, height: 64)

@main
struct LoomApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate

    /// Hosted XCTest detection — when Loom.app is only the host process
    /// for a unit-test bundle, the product root view must not mount and
    /// create a second visible Loom room beside the tester's session.
    private var isRunningInXCTestHost: Bool {
        let env = ProcessInfo.processInfo.environment
        return env["XCTestConfigurationFilePath"] != nil
            || env["XCTestBundlePath"] != nil
    }

    var body: some Scene {
        Window("Loom", id: MainWindow.id) {
            Group {
                if isRunningInXCTestHost {
                    EmptyView()
                } else {
                    // The macOS app now starts as a native product
                    // reflection workspace. Legacy web and Sources/Draft
                    // surfaces remain in the codebase for compatibility,
                    // but the first screen is local judgment work.
                    LoomReflectionRootView()
                        .background(WindowOpener())
                }
            }
            .frame(minWidth: loomWorkspaceMinimumSize.width, minHeight: loomWorkspaceMinimumSize.height)
        }
        .defaultSize(width: 1320, height: 860)
        // macOS 15+ is the product floor. Do not let system state
        // restoration reopen Loom into the "all windows closed" state:
        // clicking the app icon should always present the room.
        .restorationBehavior(.disabled)
        .defaultLaunchBehavior(.presented)
        // Reflection owns one unified, minimal full-window shell:
        // traffic lights stay native, while the sidebar/detail/source
        // panes share a single content surface under them.
        .windowStyle(.hiddenTitleBar)

        Settings {
            TabView {
                AppearanceSettingsView()
                    .tabItem { Label("Appearance", systemImage: "paintbrush") }
                AIProviderSettingsView()
                    .environmentObject(delegate.server)
                    .tabItem { Label("AI", systemImage: "sparkles") }
                DataSettingsView()
                    .tabItem { Label("Data", systemImage: "externaldrive") }
                CaptureSettingsView()
                    .tabItem { Label("Capture", systemImage: "tray.and.arrow.down") }
            }
        }

        Window("Keyboard Shortcuts", id: KeyboardHelpWindow.id) {
            KeyboardHelpView()
                .paperChrome()
        }
        .windowResizability(.contentSize)
        .defaultSize(width: 460, height: 540)

        Window("Set up captures", id: CaptureHelpWindow.id) {
            CaptureHelpView()
                .paperChrome()
        }
        .windowResizability(.contentSize)
        .defaultSize(width: 560, height: 540)

        Window("About Loom", id: AboutWindow.id) {
            AboutView()
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)
        .defaultSize(width: 420, height: 540)

        Window("Shuttle", id: ShuttleWindow.id) {
            ShuttleView()
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)
        .defaultSize(width: 592, height: 472) // card 560×440 + 16pt shadow padding on each side
        .windowToolbarStyle(.unifiedCompact)

        Window("Ask AI", id: AskAIWindow.id) {
            AskAIView()
                .paperChrome()
        }
        .defaultSize(width: 560, height: 520)
        .windowToolbarStyle(.unifiedCompact)

        Window("Practice notes", id: ReconstructionsWindow.id) {
            ReconstructionsView()
                .paperChrome()
        }
        .defaultSize(width: 800, height: 520)
        .windowToolbarStyle(.unified)

        Window("Add files", id: IngestionWindow.id) {
            IngestionView()
                .paperChrome()
        }
        .defaultSize(width: 560, height: 540)
        .windowToolbarStyle(.unifiedCompact)

        Window("Source practice", id: RehearsalWindow.id) {
            RehearsalView()
                .paperChrome()
        }
        .defaultSize(width: 620, height: 560)
        .windowToolbarStyle(.unifiedCompact)

        Window("Source check", id: ExaminerWindow.id) {
            ExaminerView()
                .paperChrome()
        }
        .defaultSize(width: 620, height: 540)
        .windowToolbarStyle(.unifiedCompact)

        // Evening ritual — literary session-close surface. Opens via
        // App menu "Set Down the Shuttle…" (delegates through
        // `EveningMenuItem`). Hidden title bar, content-sized, centered.
        Window("Evening", id: EveningWindow.id) {
            EveningView()
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)
        .defaultSize(width: 640, height: 540)

        .commands {
            CommandGroup(after: .textEditing) {
                Button("Review") { NotificationCenter.default.post(name: .loomLearn, object: nil) }
                    .keyboardShortcut("e", modifiers: .command)
                AskAIMenuItem()
                AskAboutFileMenuItem()
                HoldQuestionMenuItem()
                AddSoanCardMenuItem()
                ConnectSoanCardsMenuItem()
                RehearsalMenuItem()
                ExaminerMenuItem()
                ReconstructionsMenuItem()
                IngestionMenuItem()
                ShuttleMenuItem()
                Button("Review") { NotificationCenter.default.post(name: .loomReview, object: nil) }
                    .keyboardShortcut("/", modifiers: .command)
                Button("Reload") { NotificationCenter.default.post(name: .loomReload, object: nil) }
                    .keyboardShortcut("r", modifiers: .command)
                Button("Open in Browser") { NotificationCenter.default.post(name: .loomOpenInBrowser, object: nil) }
                    .keyboardShortcut("o", modifiers: [.command, .shift])
            }
            CommandGroup(after: .toolbar) {
                Button("Back") { NotificationCenter.default.post(name: .loomGoBack, object: nil) }
                    .keyboardShortcut("[", modifiers: .command)
                Button("Forward") { NotificationCenter.default.post(name: .loomGoForward, object: nil) }
                    .keyboardShortcut("]", modifiers: .command)
            }
            // Workspace shortcuts for the native reflection surface and
            // compatibility routes that still exist behind it.
            CommandGroup(after: .sidebar) {
                Divider()
                WorkspaceShortcutsCommands()
                Divider()
            }
            // Standard Mac View menu zoom triplet — ⌘+ / ⌘- / ⌘0. Every
            // professional Mac app has these; bumps the webview's page
            // zoom so users with smaller displays / older eyes can scale.
            CommandGroup(after: .sidebar) {
                Button("Zoom In") {
                    NotificationCenter.default.post(name: .loomZoomIn, object: nil)
                }
                .keyboardShortcut("+", modifiers: .command)
                Button("Zoom Out") {
                    NotificationCenter.default.post(name: .loomZoomOut, object: nil)
                }
                .keyboardShortcut("-", modifiers: .command)
                Button("Actual Size") {
                    NotificationCenter.default.post(name: .loomZoomReset, object: nil)
                }
                .keyboardShortcut("0", modifiers: .command)
                Divider()
                Button("Reload Sources") {
                    NotificationCenter.default.post(name: .loomRescanLibrary, object: nil)
                }
                .keyboardShortcut("r", modifiers: [.command, .shift, .option])
            }
            CommandGroup(replacing: .appInfo) {
                AboutMenuItem()
                Divider()
                EveningMenuItem()
            }
            CommandGroup(replacing: .help) {
                KeyboardShortcutsMenuItem()
                CaptureHelpMenuItem()
            }
            #if DEBUG
            CommandGroup(after: .help) {
                Button("Toggle Debug HUD") {
                    let next = !UserDefaults.standard.bool(forKey: showDebugHUDDefaultsKey)
                    UserDefaults.standard.set(next, forKey: showDebugHUDDefaultsKey)
                }
                // ⌘⌥D — ⌘⇧D is reserved for "Add a Sōan Card…" in
                // every build, including DEBUG, so the shortcut doesn't
                // shift meaning between profiles.
                .keyboardShortcut("d", modifiers: [.command, .option])
            }
            #endif
            CommandGroup(replacing: .newItem) {
                NewTopicMenuItem()
                ExportLearningRecordMenuItem()
            }
            // File menu · Export / Import — flat-file JSON dump of the
            // user's pursuits, traces, Sōan cards + edges, weaves. Round
            // trips between installs and doubles as a backup format.
            CommandGroup(after: .saveItem) {
                Divider()
                Button("Export Loom…") {
                    LoomExport.exportToFile()
                }
                Button("Import Loom…") {
                    LoomExport.importFromFile()
                }
            }
        }
    }
}

final class LoomExternalCompanionModel: ObservableObject {
    @Published private(set) var iconSystemName: String = "rectangle.on.rectangle"
    @Published private(set) var title: String = "Native file"
    @Published private(set) var sourceActionLabel: String? = "Back to Source"
    @Published private(set) var actionLabel: String = "Review in Loom"

    func update(
        iconSystemName: String,
        title: String,
        sourceActionLabel: String?,
        actionLabel: String
    ) {
        self.iconSystemName = iconSystemName
        self.title = title
        self.sourceActionLabel = sourceActionLabel
        self.actionLabel = actionLabel
    }
}

final class LoomExternalCompanionPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

struct LoomExternalCompanionView: View {
    @ObservedObject var model: LoomExternalCompanionModel
    let onOpenSource: () -> Void
    let onOpenMain: () -> Void
    let onClose: () -> Void

    var body: some View {
        HStack(alignment: .center, spacing: 9) {
            Image(systemName: model.iconSystemName)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(width: 24, height: 24)
                .background(.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 7, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("Loom")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Saved")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.green)
                }

                Text(model.title)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(.primary.opacity(0.88))
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 3) {
                if model.sourceActionLabel != nil {
                    Button(action: onOpenSource) {
                        Image(systemName: "arrow.uturn.left")
                            .font(.system(size: 11.5, weight: .semibold))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .frame(width: 24, height: 24)
                    .accessibilityLabel(model.sourceActionLabel ?? "Back to Source")
                    .help(model.sourceActionLabel ?? "Back to Source")
                }

                Button(action: onOpenMain) {
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 11.5, weight: .semibold))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .frame(width: 24, height: 24)
                .accessibilityLabel(model.actionLabel)
                .help(model.actionLabel)

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11.5, weight: .bold))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .frame(width: 24, height: 24)
                .accessibilityLabel("Close")
                .help("Close")
            }
        }
        .padding(.top, 8)
        .padding(.horizontal, 12)
        .padding(.bottom, 7)
        .frame(width: loomExternalCompanionSize.width, height: loomExternalCompanionSize.height)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(.primary.opacity(0.10), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private enum LoomNativeDocumentKind {
    case pdf
    case word
    case spreadsheet
    case presentation
    case text
    case image
    case file

    var iconSystemName: String {
        switch self {
        case .pdf:
            return "doc.richtext"
        case .word:
            return "doc.text"
        case .spreadsheet:
            return "tablecells"
        case .presentation:
            return "rectangle.stack"
        case .text:
            return "text.document"
        case .image:
            return "photo"
        case .file:
            return "doc"
        }
    }

    static func infer(from urls: [URL]) -> LoomNativeDocumentKind {
        infer(fromExtension: urls.first?.pathExtension)
    }

    static func infer(from capture: LoomExternalSelectionCapture) -> LoomNativeDocumentKind {
        if let url = capture.fileURLs.first {
            return infer(fromExtension: url.pathExtension)
        }

        let appName = (capture.sourceApp ?? "").lowercased()
        if appName.contains("preview") { return .pdf }
        if appName.contains("word") { return .word }
        if appName.contains("excel") { return .spreadsheet }
        if appName.contains("powerpoint") || appName.contains("keynote") { return .presentation }
        return .file
    }

    private static func infer(fromExtension value: String?) -> LoomNativeDocumentKind {
        switch value?.lowercased() {
        case "pdf":
            return .pdf
        case "doc", "docx", "pages", "rtf", "rtfd":
            return .word
        case "xls", "xlsx", "csv", "tsv", "numbers":
            return .spreadsheet
        case "ppt", "pptx", "key":
            return .presentation
        case "txt", "md", "mdx", "markdown", "json", "xml", "html", "htm":
            return .text
        case "png", "jpg", "jpeg", "gif", "heic", "webp", "tiff":
            return .image
        default:
            return .file
        }
    }

}

class AppDelegate: NSObject, NSApplicationDelegate {
    let server = DevServer()
    private var fallbackMainWindow: NSWindow?
    private let externalCompanionModel = LoomExternalCompanionModel()
    private var externalCompanionWindow: NSPanel?
    private var externalCompanionKeepsMainParked = false
    private var externalCompanionDismissToken: UUID?
    private var externalCompanionSourceFileURLs: [URL] = []
    private var externalCompanionSourceBundleIdentifier: String?
    private var externalCompanionSourceProcessIdentifier: pid_t?
    private var launchConfigured = false
    private var servicesProviderRegistered = false
    private var sourceApplicationObserverRegistered = false
    private var companionMainWindowSuppressionObserver: NSObjectProtocol?
    private var lastExternalApplicationSnapshot: LoomExternalApplicationSnapshot?
    private var captureSpaceRestoreBehavior: NSWindow.CollectionBehavior?
    private var captureSpaceRestoreToken: UUID?
    private var fallbackMaterializationToken: UUID?

    /// Hosted XCTest detection — when the running process is only the
    /// host for a unit-test bundle, every main-window repair path must
    /// no-op so verification does not activate a second Loom.app room.
    private var isRunningInXCTestHost: Bool {
        let env = ProcessInfo.processInfo.environment
        return env["XCTestConfigurationFilePath"] != nil
            || env["XCTestBundlePath"] != nil
    }

    override init() {
        super.init()
        NSLog("[Loom] AppDelegate init")
        guard !isRunningInXCTestHost else { return }
        DispatchQueue.main.async { [weak self] in
            Task { @MainActor in
                self?.configureLaunchIfNeeded()
                self?.scheduleMainWindowRepair()
            }
        }
    }

    func applicationWillFinishLaunching(_ notification: Notification) {
        // The `loom://` AppleEvent handler MUST be registered
        // synchronously before launch finishes: macOS queues a
        // launch-delivered `kAEGetURL` event (extension/bookmarklet
        // click while Loom isn't running) and dispatches it as soon as
        // the run loop starts — if the handler isn't registered yet the
        // event is silently dropped. The deferred
        // `configureLaunchIfNeeded` hops (DispatchQueue/Task) lose that
        // race nondeterministically.
        guard !isRunningInXCTestHost else { return }
        registerSourceApplicationObserver()
        registerCompanionMainWindowSuppressionObserver()
        registerServicesProvider()
        registerURLSchemeHandler()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        Task { @MainActor in
            guard !isRunningInXCTestHost else { return }
            configureLaunchIfNeeded()
            scheduleMainWindowRepair()
        }
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        Task { @MainActor in
            guard !isRunningInXCTestHost else { return }
            configureLaunchIfNeeded()
            if externalCompanionKeepsMainParked {
                parkMainWindowForExternalCompanion()
                return
            }
            // Returning to Loom should repair any titlebar chrome macOS
            // restored while the app was inactive.
            if let window = existingMainWindow(includeHidden: false, requireActiveSpace: true) {
                configureMainWindowChrome(window)
            } else {
                ensureMainWindowVisible()
            }
        }
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        Task { @MainActor in
            openExternalFiles(urls)
        }
    }

    func application(_ sender: NSApplication, openFile filename: String) -> Bool {
        Task { @MainActor in
            openExternalFiles([URL(fileURLWithPath: filename)])
        }
        return true
    }

    @objc(captureSelectionInLoom:userData:error:)
    func captureSelectionInLoom(
        _ pasteboard: NSPasteboard,
        userData: String?,
        error: AutoreleasingUnsafeMutablePointer<NSString?>
    ) {
        NSLog("[Loom] captureSelectionInLoom service invoked")
        guard let capture = Self.externalSelectionCapture(
            from: pasteboard,
            fallbackSource: lastExternalApplicationSnapshot
        ) else {
            error.pointee = "No selected text or file URL was available for Loom." as NSString
            return
        }

        Task { @MainActor in
            self.captureExternalSelection(capture)
        }
    }

    /// Phase A3 — register the `loom://` URL handler. Bookmarklet
    /// navigates the browser to `loom://capture?payload=…` which
    /// bounces back to the app via this AppleEvent. We re-post as
    /// a Notification so the active root view can mount the
    /// CaptureSheet without the AppDelegate knowing SwiftUI state.
    /// Called synchronously from `applicationWillFinishLaunching` —
    /// see the comment there for why it must not be deferred.
    private var urlHandlerRegistered = false
    private func registerSourceApplicationObserver() {
        guard !sourceApplicationObserverRegistered else { return }
        sourceApplicationObserverRegistered = true
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(activeApplicationDidChange(_:)),
            name: NSWorkspace.didActivateApplicationNotification,
            object: nil
        )
        if let application = NSWorkspace.shared.frontmostApplication,
           !Self.isIgnoredSourceApplication(application) {
            lastExternalApplicationSnapshot = Self.sourceApplicationSnapshot(for: application)
        }
    }

    private func registerCompanionMainWindowSuppressionObserver() {
        guard companionMainWindowSuppressionObserver == nil else { return }
        companionMainWindowSuppressionObserver = NotificationCenter.default.addObserver(
            forName: NSApplication.didUpdateNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.externalCompanionKeepsMainParked else { return }
                self.fallbackMaterializationToken = nil
                self.parkMainWindowForExternalCompanion()
            }
        }
    }

    @objc private func activeApplicationDidChange(_ notification: Notification) {
        guard let application = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
              !Self.isIgnoredSourceApplication(application) else { return }
        lastExternalApplicationSnapshot = Self.sourceApplicationSnapshot(for: application)
    }

    private func registerServicesProvider() {
        guard !servicesProviderRegistered else { return }
        servicesProviderRegistered = true
        NSApp.servicesProvider = self
        NSRegisterServicesProvider(self, "Loom")
        NSUpdateDynamicServices()
        NSLog("[Loom] Services provider registered for port Loom")
    }

    private func registerURLSchemeHandler() {
        guard !urlHandlerRegistered else { return }
        urlHandlerRegistered = true
        NSAppleEventManager.shared().setEventHandler(
            self,
            andSelector: #selector(handleGetURLEvent(_:withReplyEvent:)),
            forEventClass: AEEventClass(kInternetEventClass),
            andEventID: AEEventID(kAEGetURL)
        )
    }

    @MainActor
    private func configureLaunchIfNeeded() {
        guard !launchConfigured else { return }
        launchConfigured = true
        NSWindow.allowsAutomaticWindowTabbing = false
        NSApp.setActivationPolicy(.regular)
        registerSourceApplicationObserver()
        registerCompanionMainWindowSuppressionObserver()
        registerServicesProvider()
        UserDefaults.standard.set(false, forKey: showDebugHUDDefaultsKey)
        // URL handler registration normally already happened in
        // applicationWillFinishLaunching; this is a belt-and-braces
        // repeat for exotic activation paths (idempotent).
        registerURLSchemeHandler()
        // Restore the security-scoped bookmark for the user's content
        // folder (if any) before ContentView's URL scheme handler
        // initializes — otherwise under sandbox it can't read user files.
        SecurityScopedFolderStore.restoreAtLaunch(
            fallbackPath: LoomRuntimePaths.resolveContentRoot()
        )
        // Only spawn the Next.js dev server when the user explicitly
        // opted into dev mode. Default launches use the static bundle
        // (`loom://bundle/*`) — no server needed, no stale `.next/`
        // cache to leak divergent renders into the webview.
        if ProcessInfo.processInfo.environment["LOOM_USE_DEV_SERVER"] == "1" {
            server.start()
        } else {
            // ContentView.detailColumn switches on `server.status`: only
            // `.ready` actually mounts the WKWebView. Without a dev
            // server we'd sit on the loading shimmer forever, because
            // nothing would flip the state. Mark it ready synchronously
            // — the static scheme handler is always-on, there's no
            // boot latency to wait for.
            server.markReadyForStaticBundle()
        }
    }

    @MainActor
    private func scheduleMainWindowRepair() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            Task { @MainActor in
                self?.ensureMainWindowVisible()
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            Task { @MainActor in
                self?.ensureMainWindowVisible()
            }
        }
    }

    /// SwiftUI's `Window(...).defaultLaunchBehavior(.presented)` is the
    /// desired primary path, but in local installed builds macOS can
    /// still start the process with zero scene windows after prior
    /// close/restore state. Keep a narrow AppKit fallback so clicking
    /// Loom, reopening from Dock, or receiving `loom://capture` never
    /// leaves the user with a running app and no room.
    @MainActor
    private func ensureMainWindowVisible() {
        guard !isRunningInXCTestHost else { return }
        if externalCompanionKeepsMainParked {
            parkMainWindowForExternalCompanion()
            return
        }
        reconcileDuplicateMainWindows()
        NSLog("[Loom] ensureMainWindowVisible windows=%d", NSApp.windows.count)
        if let window = existingMainWindow(includeHidden: false, requireActiveSpace: true) {
            NSLog("[Loom] ensureMainWindowVisible using visible window=%d", window.windowNumber)
            presentWindowOnActiveSpace(window)
            return
        }
        if let window = existingMainWindow(includeHidden: false) {
            // A window mid-Space-transition can transiently fail the
            // active-space check during launch. Repair by presenting and
            // moving it, never by closing a user-visible window.
            loomCaptureLog("ensureMainWindowVisible: promoting off-active window #\(window.windowNumber)")
            presentWindowOnActiveSpace(window)
            return
        }
        if let window = existingMainWindow(includeHidden: true) {
            loomCaptureLog("ensureMainWindowVisible: promoting hidden window #\(window.windowNumber)")
            presentWindowOnActiveSpace(window)
            return
        }
        requestMainWindowSceneOrFallback()
    }

    @MainActor
    private func requestMainWindowSceneOrFallback() {
        NotificationCenter.default.post(name: .loomOpenMainWindow, object: nil)

        let token = UUID()
        fallbackMaterializationToken = token
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { [weak self] in
            Task { @MainActor in
                guard let self, self.fallbackMaterializationToken == token else { return }
                self.fallbackMaterializationToken = nil
                self.reconcileDuplicateMainWindows()
                if let window = self.existingMainWindow(includeHidden: false, requireActiveSpace: true)
                    ?? self.existingMainWindow(includeHidden: false)
                    ?? self.existingMainWindow(includeHidden: true) {
                    self.presentWindowOnActiveSpace(window)
                    return
                }
                self.materializeFallbackMainWindow()
            }
        }
    }

    @MainActor
    private func scheduleDuplicateMainWindowReconciliation() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                if self.externalCompanionKeepsMainParked {
                    self.parkMainWindowForExternalCompanion()
                } else {
                    self.reconcileDuplicateMainWindows()
                }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                if self.externalCompanionKeepsMainParked {
                    self.parkMainWindowForExternalCompanion()
                } else {
                    self.reconcileDuplicateMainWindows()
                }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                if self.externalCompanionKeepsMainParked {
                    self.parkMainWindowForExternalCompanion()
                } else {
                    self.reconcileDuplicateMainWindows()
                }
            }
        }
    }

    @MainActor
    private func reconcileDuplicateMainWindows() {
        let windows = mainWindows(includeHidden: false)
        guard windows.count > 1 else { return }

        if let fallbackMainWindow,
           windows.contains(where: { $0 !== fallbackMainWindow }) {
            loomCaptureLog("reconcileDuplicateMainWindows: closing fallback window #\(fallbackMainWindow.windowNumber)")
            closeMainWindow(fallbackMainWindow)
            return
        }

        guard let keeper = windows.first(where: { $0.isKeyWindow || $0.isMainWindow }) ?? windows.first else {
            return
        }
        for window in windows where window !== keeper {
            loomCaptureLog("reconcileDuplicateMainWindows: closing duplicate main window #\(window.windowNumber)")
            closeMainWindow(window)
        }
    }

    @MainActor
    private func presentWindowOnActiveSpace(_ window: NSWindow) {
        window.alphaValue = 1
        window.ignoresMouseEvents = false
        configureMainWindowChrome(window)
        let originalSpaceBehavior = window.collectionBehavior
        var presentationBehavior = originalSpaceBehavior
        presentationBehavior.remove(.moveToActiveSpace)
        presentationBehavior.insert(.canJoinAllSpaces)
        window.collectionBehavior = presentationBehavior
        window.deminiaturize(nil)
        NSApp.unhide(nil)
        window.makeKeyAndOrderFront(nil)
        window.orderFrontRegardless()
        NSRunningApplication.current.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
        NSApp.activate(ignoringOtherApps: true)
        // Installed builds can otherwise restore the main SwiftUI scene
        // onto a different Space where AX/Computer Use cannot see it.
        // Keep the primary room joined to Spaces; a visible main window
        // is a stricter product invariant than desktop-local behavior.
        // Space transitions need a delayed repair after AppKit finishes
        // moving the window.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self, weak window] in
            guard let self, let window else { return }
            self.configureMainWindowChrome(window)
        }
    }

    /// Materialize a fallback main window, preferring promotion of any
    /// healthy existing window over replacement.
    @MainActor
    private func materializeFallbackMainWindow(ignoreHiddenWindow: Bool = false) {
        if let window = fallbackMainWindow, window.isVisible {
            presentWindowOnActiveSpace(window)
            return
        }
        if let window = existingMainWindow(includeHidden: false, requireActiveSpace: true) {
            presentWindowOnActiveSpace(window)
            return
        }
        if let window = existingMainWindow(includeHidden: false) {
            loomCaptureLog("materializeFallbackMainWindow: promoting off-active window #\(window.windowNumber)")
            presentWindowOnActiveSpace(window)
            return
        }
        if !ignoreHiddenWindow, let window = existingMainWindow(includeHidden: true) {
            loomCaptureLog("materializeFallbackMainWindow: promoting hidden window #\(window.windowNumber)")
            presentWindowOnActiveSpace(window)
            return
        }
        createFallbackMainWindow()
    }

    /// Fallback main window — same full-size hidden-titlebar chrome
    /// contract as the SwiftUI scene window, hosting the native reflection
    /// root instead of the retired web-first shell.
    @MainActor
    private func createFallbackMainWindow() {
        let rootView = LoomReflectionRootView()
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1320, height: 860),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.identifier = NSUserInterfaceItemIdentifier(MainWindow.id)
        window.title = "Loom"
        window.center()
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.toolbar = nil
        window.standardWindowButton(.toolbarButton)?.isHidden = true
        window.collectionBehavior.insert(.fullScreenPrimary)
        window.minSize = loomWorkspaceMinimumSize
        window.backgroundColor = NSColor.windowBackgroundColor
        window.isRestorable = false
        window.contentView = NSHostingView(rootView: rootView)
        window.isReleasedWhenClosed = false
        fallbackMainWindow = window
        presentWindowOnActiveSpace(window)
        NSLog("[Loom] createFallbackMainWindow window=%d", window.windowNumber)
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            Task { @MainActor in
                sender.activate(ignoringOtherApps: true)
                if externalCompanionKeepsMainParked {
                    externalCompanionWindow?.orderFrontRegardless()
                    parkMainWindowForExternalCompanion()
                    return
                }
                externalCompanionKeepsMainParked = false
                ensureMainWindowVisible()
                NotificationCenter.default.post(name: .loomOpenMainWindow, object: nil)
            }
        }
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        server.stop()
    }

    /// AppleEvent handler for the `loom://` URL scheme. Routes the
    /// `loom://capture?payload=<json>` shape (Phase A3) to the
    /// `.loomCaptureFromURL` notification, and `loom://bundle/<route>`
    /// to the installed support-route relay; other paths fall through
    /// (the existing in-webview scheme handler covers `loom://content`,
    /// `loom://anchor`, etc.).
    @objc func handleGetURLEvent(_ event: NSAppleEventDescriptor, withReplyEvent reply: NSAppleEventDescriptor) {
        guard
            let urlString = event.paramDescriptor(forKeyword: keyDirectObject)?.stringValue,
            let url = URL(string: urlString),
            url.scheme == "loom"
        else { return }
        // External capture entry point. Internal `loom://content/…` /
        // `loom://anchor?…` URLs are handled by `LoomURLSchemeHandler`
        // inside the webview; `loom://capture` and `loom://bundle`
        // arrive here from outside the app.
        if url.host == "capture" {
            loomCaptureLog("AppleEvent kAEGetURL: capture URL arrived (length \(urlString.count))")
            Task { @MainActor in
                handleCaptureURL(url)
            }
        } else if url.host == "bundle" {
            Task { @MainActor in
                handleBundleURL(url)
            }
        }
    }

    /// `loom://bundle/hour`, `loom://bundle/connections`, … — installed
    /// support routes open inside the product shell instead of leaving
    /// the user in a browser. The route is parked in the relay (in case
    /// the root view has not mounted yet) and posted on the navigation
    /// bus with delayed reposts so the shell catches it after the
    /// window settles.
    @MainActor
    private func handleBundleURL(_ url: URL) {
        guard let path = bundleRoutePath(from: url) else { return }
        NSApp.activate(ignoringOtherApps: true)
        LoomBundleRouteRelay.savePendingRoute(path)
        if existingMainWindow(includeHidden: false) == nil {
            createFallbackMainWindow()
        }
        ensureMainWindowVisible()
        postBundleNavigation(path)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            self?.postBundleNavigation(path)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.postBundleNavigation(path)
        }
    }

    /// `loom://bundle/<route>` → `/route` product path. Static-export
    /// pages arrive either as clean routes (`loom://bundle/hour`) or as
    /// exported documents (`loom://bundle/hour/index.html`).
    private func bundleRoutePath(from url: URL) -> String? {
        guard url.host == "bundle" else { return nil }
        var path = url.path
        if path.hasSuffix(".html") {
            path = (path as NSString).deletingLastPathComponent
        }
        let trimmed = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if trimmed.isEmpty { return "/" }
        return "/" + trimmed
    }

    private func postBundleNavigation(_ path: String) {
        NotificationCenter.default.post(
            name: .loomShuttleNavigate,
            object: nil,
            userInfo: ["path": path]
        )
    }

    @MainActor
    private func openExternalFiles(_ urls: [URL]) {
        let fileURLs = urls.filter { $0.isFileURL }
        guard !fileURLs.isEmpty else { return }

        let token = UUID()
        LoomExternalFileOpenRelay.savePending(fileURLs, token: token)
        externalCompanionKeepsMainParked = true

        postExternalFileOpen(fileURLs, token: token)
        presentExternalCompanion(for: fileURLs)
        parkMainWindowForExternalCompanion()
        scheduleDuplicateMainWindowReconciliation()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            self?.postExternalFileOpen(fileURLs, token: token)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.postExternalFileOpen(fileURLs, token: token)
        }
    }

    private func postExternalFileOpen(_ urls: [URL], token: UUID) {
        NotificationCenter.default.post(
            name: .loomOpenExternalFiles,
            object: nil,
            userInfo: ["urls": urls, "token": token]
        )
    }

    @MainActor
    private func captureExternalSelection(_ capture: LoomExternalSelectionCapture) {
        LoomExternalSelectionCaptureRelay.savePending(capture)

        // Quiet route (owner 2026-07-05: 简单容易 / 自动到 LOOM): a selection that
        // resolves to a passage in a registered PDF source lands straight in the
        // center note as a clickable anchor — no companion window, no parking, so
        // the owner stays in Preview and the still-mounted note picks it up.
        let session = ReflectionWorkspaceSession.shared
        let activeSources = session.cases.first(where: { $0.id == session.selectedCaseID })?.sources ?? []
        if ReflectionPassageAnchoring.matches(text: capture.text, sources: activeSources) {
            postExternalSelectionCapture(capture)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
                self?.postExternalSelectionCapture(capture)
            }
            return
        }

        externalCompanionKeepsMainParked = true

        postExternalSelectionCapture(capture)
        presentExternalCompanion(for: capture)
        parkMainWindowForExternalCompanion()
        restoreSourceFocusFromExternalCompanionSoon()
        scheduleDuplicateMainWindowReconciliation()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            self?.postExternalSelectionCapture(capture)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.postExternalSelectionCapture(capture)
        }
    }

    private func postExternalSelectionCapture(_ capture: LoomExternalSelectionCapture) {
        NotificationCenter.default.post(
            name: .loomCaptureExternalSelection,
            object: nil,
            userInfo: ["capture": capture]
        )
    }

    @MainActor
    private func presentExternalCompanion(for urls: [URL]) {
        let fileNames = urls.map(\.lastPathComponent)
        let kind = LoomNativeDocumentKind.infer(from: urls)
        let title = fileNames.first ?? "Native file"
        externalCompanionSourceFileURLs = urls
        externalCompanionSourceBundleIdentifier = nil
        externalCompanionSourceProcessIdentifier = nil
        externalCompanionModel.update(
            iconSystemName: kind.iconSystemName,
            title: title,
            sourceActionLabel: "Open Source",
            actionLabel: "Review in Loom"
        )
        presentExternalCompanionWindow()
    }

    @MainActor
    private func presentExternalCompanion(for capture: LoomExternalSelectionCapture) {
        let kind = LoomNativeDocumentKind.infer(from: capture)
        let source = capture.sourceWindowTitle
            ?? capture.fileURLs.first?.lastPathComponent
            ?? capture.sourceApp
            ?? "Native file"
        externalCompanionSourceFileURLs = capture.fileURLs
        externalCompanionSourceBundleIdentifier = capture.sourceBundleIdentifier
        externalCompanionSourceProcessIdentifier = capture.sourceProcessIdentifier
        externalCompanionModel.update(
            iconSystemName: kind.iconSystemName,
            title: source,
            sourceActionLabel: "Back to Source",
            actionLabel: "Review in Loom"
        )
        presentExternalCompanionWindow()
    }

    @MainActor
    private func presentExternalCompanionWindow() {
        let panel = externalCompanionWindow ?? createExternalCompanionWindow()
        externalCompanionWindow = panel
        externalCompanionKeepsMainParked = true
        positionExternalCompanionWindow(panel)
        panel.orderFrontRegardless()
        scheduleExternalCompanionAutoDismiss()
    }

    @MainActor
    private func openMainWindowFromExternalCompanion() {
        dismissExternalCompanionReceipt(clearParking: true)
        ensureMainWindowVisible()
    }

    @MainActor
    private func openSourceFromExternalCompanion() {
        externalCompanionKeepsMainParked = true

        if restoreSourceFocusFromExternalCompanion() {
            dismissExternalCompanionReceipt(clearParking: true)
            return
        }

        if let url = externalCompanionSourceFileURLs.first {
            Self.openURLInPreferredNativeApp(url)
            parkMainWindowForExternalCompanion()
            dismissExternalCompanionReceipt(clearParking: true)
        }
    }

    @MainActor
    private func scheduleExternalCompanionAutoDismiss() {
        let token = UUID()
        externalCompanionDismissToken = token
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.2) { [weak self] in
            Task { @MainActor in
                self?.dismissExternalCompanionReceipt(matching: token, clearParking: true)
            }
        }
    }

    @MainActor
    private func dismissExternalCompanionReceipt(matching token: UUID? = nil, clearParking: Bool) {
        if let token, token != externalCompanionDismissToken { return }
        externalCompanionDismissToken = nil
        if clearParking {
            externalCompanionKeepsMainParked = false
        }
        externalCompanionWindow?.orderOut(nil)
    }

    @MainActor
    @discardableResult
    private func restoreSourceFocusFromExternalCompanion() -> Bool {
        if let processIdentifier = externalCompanionSourceProcessIdentifier,
           let application = NSRunningApplication(processIdentifier: processIdentifier),
           !Self.isIgnoredSourceApplication(application) {
            application.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
            parkMainWindowForExternalCompanion()
            return true
        }

        if let bundleIdentifier = externalCompanionSourceBundleIdentifier,
           let application = NSWorkspace.shared.runningApplications.first(where: {
                $0.bundleIdentifier == bundleIdentifier && !Self.isIgnoredSourceApplication($0)
           }) {
            application.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
            parkMainWindowForExternalCompanion()
            return true
        }

        return false
    }

    @MainActor
    private func restoreSourceFocusFromExternalCompanionSoon() {
        for delay in [0.08, 0.35, 0.9] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                Task { @MainActor in
                    guard let self, self.externalCompanionKeepsMainParked else { return }
                    _ = self.restoreSourceFocusFromExternalCompanion()
                }
            }
        }
    }

    private static func openURLInPreferredNativeApp(_ url: URL) {
        guard let applicationURL = preferredNativeApplicationURL(for: url)
            ?? NSWorkspace.shared.urlForApplication(toOpen: url) else {
            NSWorkspace.shared.open(url)
            return
        }

        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = true
        NSWorkspace.shared.open([url], withApplicationAt: applicationURL, configuration: configuration) { _, error in
            guard error != nil else { return }
            NSWorkspace.shared.open(url)
        }
    }

    private static func preferredNativeApplicationURL(for url: URL) -> URL? {
        let applicationPath: String?
        switch url.pathExtension.lowercased() {
        case "pdf":
            applicationPath = "/System/Applications/Preview.app"
        case "doc", "docx", "rtf", "rtfd":
            applicationPath = "/Applications/Microsoft Word.app"
        case "xls", "xlsx", "csv", "tsv":
            applicationPath = "/Applications/Microsoft Excel.app"
        default:
            applicationPath = nil
        }

        guard let applicationPath else { return nil }
        let applicationURL = URL(fileURLWithPath: applicationPath)
        return FileManager.default.fileExists(atPath: applicationURL.path) ? applicationURL : nil
    }

    @MainActor
    private func createExternalCompanionWindow() -> NSPanel {
        let rootView = LoomExternalCompanionView(
            model: externalCompanionModel,
            onOpenSource: { [weak self] in
                Task { @MainActor in
                    self?.openSourceFromExternalCompanion()
                }
            },
            onOpenMain: { [weak self] in
                Task { @MainActor in
                    self?.openMainWindowFromExternalCompanion()
                }
            },
            onClose: { [weak self] in
                Task { @MainActor in
                    self?.dismissExternalCompanionReceipt(clearParking: true)
                }
            }
        )
        let panel = LoomExternalCompanionPanel(
            contentRect: NSRect(origin: .zero, size: loomExternalCompanionSize),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.identifier = NSUserInterfaceItemIdentifier("loom.externalCompanion")
        panel.title = "Loom Companion"
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true
        panel.toolbar = nil
        panel.standardWindowButton(.closeButton)?.isHidden = true
        panel.standardWindowButton(.miniaturizeButton)?.isHidden = true
        panel.standardWindowButton(.zoomButton)?.isHidden = true
        panel.standardWindowButton(.toolbarButton)?.isHidden = true
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.becomesKeyOnlyIfNeeded = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
        panel.minSize = loomExternalCompanionSize
        panel.maxSize = loomExternalCompanionSize
        panel.isReleasedWhenClosed = false
        panel.contentMinSize = loomExternalCompanionSize
        panel.contentMaxSize = loomExternalCompanionSize
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = true
        let hostingView = NSHostingView(rootView: rootView)
        hostingView.frame = NSRect(origin: .zero, size: loomExternalCompanionSize)
        hostingView.autoresizingMask = [.width, .height]
        panel.contentView = hostingView
        panel.setFrame(NSRect(origin: .zero, size: loomExternalCompanionSize), display: false)
        panel.setContentSize(loomExternalCompanionSize)
        return panel
    }

    @MainActor
    private func positionExternalCompanionWindow(_ panel: NSPanel) {
        guard let visibleFrame = (panel.screen ?? NSScreen.main)?.visibleFrame else { return }
        let width = loomExternalCompanionSize.width
        let height = loomExternalCompanionSize.height
        let frame = NSRect(
            x: visibleFrame.maxX - width - 24,
            y: visibleFrame.minY + max(36, (visibleFrame.height - height) / 2),
            width: width,
            height: height
        )
        panel.setFrame(frame, display: true, animate: false)
    }

    @MainActor
    private func parkMainWindowForExternalCompanion() {
        fallbackMaterializationToken = nil
        for window in mainWindows(includeHidden: true) {
            parkVisibleMainWindow(window)
        }
        for delay in [0.05, 0.2, 0.7, 1.4, 2.4] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                Task { @MainActor in
                    guard let self, self.externalCompanionKeepsMainParked else { return }
                    self.fallbackMaterializationToken = nil
                    for window in self.mainWindows(includeHidden: true) {
                        self.parkVisibleMainWindow(window)
                    }
                }
            }
        }
    }

    private static func externalSelectionCapture(
        from pasteboard: NSPasteboard,
        fallbackSource: LoomExternalApplicationSnapshot?
    ) -> LoomExternalSelectionCapture? {
        let objectText = (pasteboard.readObjects(
            forClasses: [NSString.self],
            options: nil
        ) as? [NSString])?.first.map { String($0) }
        let text = pasteboard.string(forType: .string) ?? objectText

        let urlObjects = pasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [NSURL] ?? []
        let urls = urlObjects.map { $0 as URL }

        let trimmedText = text?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !(trimmedText?.isEmpty ?? true) || !urls.isEmpty else { return nil }

        let activeSource = sourceApplicationSnapshot(for: NSWorkspace.shared.frontmostApplication)
        let refreshedFallbackSource = refreshedSourceApplicationSnapshot(from: fallbackSource)
        let source = activeSource ?? refreshedFallbackSource
        let contextualURLs = urls.isEmpty
            ? [source?.nativeContext?.documentURL].compactMap { $0 }
            : urls

        return LoomExternalSelectionCapture(
            token: UUID(),
            text: trimmedText ?? "",
            fileURLs: contextualURLs,
            sourceApp: source?.localizedName,
            sourceBundleIdentifier: source?.bundleIdentifier,
            sourceProcessIdentifier: source?.processIdentifier,
            sourceWindowTitle: source?.windowTitle,
            nativeContext: source?.nativeContext,
            capturedAt: Date()
        )
    }

    private static func sourceApplicationSnapshot(
        for application: NSRunningApplication?
    ) -> LoomExternalApplicationSnapshot? {
        guard let application, !isIgnoredSourceApplication(application) else { return nil }
        let windowTitle = frontmostWindowTitle(for: application)
        return LoomExternalApplicationSnapshot(
            localizedName: application.localizedName,
            bundleIdentifier: application.bundleIdentifier,
            processIdentifier: application.processIdentifier,
            windowTitle: windowTitle,
            nativeContext: accessibilitySourceContext(for: application, windowTitle: windowTitle)
        )
    }

    private static func refreshedSourceApplicationSnapshot(
        from snapshot: LoomExternalApplicationSnapshot?
    ) -> LoomExternalApplicationSnapshot? {
        guard let snapshot,
              let application = NSRunningApplication(processIdentifier: snapshot.processIdentifier),
              !isIgnoredSourceApplication(application) else { return snapshot }
        return sourceApplicationSnapshot(for: application) ?? snapshot
    }

    private static func isLoomApplication(_ application: NSRunningApplication) -> Bool {
        application.bundleIdentifier == Bundle.main.bundleIdentifier
    }

    private static func isIgnoredSourceApplication(_ application: NSRunningApplication) -> Bool {
        if isLoomApplication(application) { return true }
        switch application.bundleIdentifier {
        case "com.apple.loginwindow", "com.apple.systemuiserver", "com.apple.controlcenter":
            return true
        default:
            return false
        }
    }

    private static func frontmostWindowTitle(for application: NSRunningApplication?) -> String? {
        guard let application else { return nil }
        return accessibilityFocusedWindowTitle(for: application)
            ?? cgWindowTitle(for: application)
    }

    private static func accessibilitySourceContext(
        for application: NSRunningApplication,
        windowTitle: String?
    ) -> LoomNativeSourceContext? {
        let appElement = AXUIElementCreateApplication(application.processIdentifier)
        let focusedWindow = accessibilityElementAttribute(kAXFocusedWindowAttribute as String, from: appElement)
        let focusedElement = accessibilityElementAttribute(kAXFocusedUIElementAttribute as String, from: appElement)
        let elements = [focusedElement, focusedWindow, appElement].compactMap { $0 }

        // The sandbox blocks these cross-app AX reads inside the app, so the
        // non-sandboxed LoomAnchorHelper XPC service performs the same read
        // and its result fills whatever the in-app attempt could not
        // (docs/projects/active/2026-06-30-loom-anchor-precision-handoff.md).
        // In-app values win when present; the helper only upgrades precision.
        let helperAnchor = LoomAnchorHelperClient.resolveAnchor(forPID: application.processIdentifier)
        let mergedWindowTitle = windowTitle ?? helperAnchor?.windowTitle

        let documentURL = firstAccessibilityURLAttribute(
            ["AXDocument", "AXURL", "AXFilename"],
            from: elements
        ) ?? helperAnchor?.documentURL
        let documentTitle = documentURL?.lastPathComponent
            ?? firstAccessibilityStringAttribute(["AXTitle", "AXFilename", "AXDescription"], from: elements)
            ?? mergedWindowTitle
        let strings = orderedUniqueStrings(
            ([windowTitle, helperAnchor?.windowTitle] as [String?])
                + accessibilityStrings(["AXValue", "AXDescription", "AXTitle", "AXHelp", "AXIdentifier"], from: elements)
        )
        let pageContext = pageContext(from: strings)
        let pageNumber = pageContext.pageNumber ?? helperAnchor?.page
        let pageCount = pageContext.pageCount ?? helperAnchor?.pageCount
        let cellRange = spreadsheetCellRange(from: strings)
        let sheetName = spreadsheetSheetName(from: strings)
        let selectedRole = firstAccessibilityStringAttribute(["AXRoleDescription", "AXRole"], from: elements)

        let precision = anchorPrecision(
            documentURL: documentURL,
            pageNumber: pageNumber,
            cellRange: cellRange,
            windowTitle: mergedWindowTitle
        )

        guard documentURL != nil
                || pageNumber != nil
                || cellRange != nil
                || sheetName != nil
                || selectedRole != nil
                || mergedWindowTitle != nil else {
            return nil
        }

        return LoomNativeSourceContext(
            documentURL: documentURL,
            documentTitle: nonEmptyString(documentTitle),
            pageNumber: pageNumber,
            pageCount: pageCount,
            sheetName: sheetName,
            cellRange: cellRange,
            selectedRole: selectedRole,
            anchorPrecision: precision
        )
    }

    private static func accessibilityFocusedWindowTitle(for application: NSRunningApplication) -> String? {
        let appElement = AXUIElementCreateApplication(application.processIdentifier)
        var focusedWindow: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            appElement,
            kAXFocusedWindowAttribute as CFString,
            &focusedWindow
        ) == .success else { return nil }

        var title: CFTypeRef?
        guard let window = focusedWindow,
              AXUIElementCopyAttributeValue(
                window as! AXUIElement,
                kAXTitleAttribute as CFString,
                &title
              ) == .success else { return nil }

        return nonEmptyString(title as? String)
    }

    private static func accessibilityElementAttribute(_ attribute: String, from element: AXUIElement) -> AXUIElement? {
        guard let value = accessibilityAttribute(attribute, from: element),
              CFGetTypeID(value) == AXUIElementGetTypeID() else { return nil }
        return (value as! AXUIElement)
    }

    private static func firstAccessibilityStringAttribute(
        _ attributes: [String],
        from elements: [AXUIElement]
    ) -> String? {
        for element in elements {
            for attribute in attributes {
                if let value = accessibilityStringAttribute(attribute, from: element) {
                    return value
                }
            }
        }
        return nil
    }

    private static func accessibilityStrings(_ attributes: [String], from elements: [AXUIElement]) -> [String?] {
        elements.flatMap { element in
            attributes.map { accessibilityStringAttribute($0, from: element) }
        }
    }

    private static func accessibilityStringAttribute(_ attribute: String, from element: AXUIElement) -> String? {
        guard let value = accessibilityAttribute(attribute, from: element) else { return nil }
        if let string = value as? String {
            return nonEmptyString(string)
        }
        if let number = value as? NSNumber {
            return "\(number)"
        }
        return nil
    }

    private static func firstAccessibilityURLAttribute(
        _ attributes: [String],
        from elements: [AXUIElement]
    ) -> URL? {
        for element in elements {
            for attribute in attributes {
                if let value = accessibilityAttribute(attribute, from: element),
                   let url = documentURL(fromAccessibilityValue: value) {
                    return url
                }
            }
        }
        return nil
    }

    private static func accessibilityAttribute(_ attribute: String, from element: AXUIElement) -> CFTypeRef? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success else {
            return nil
        }
        return value
    }

    private static func documentURL(fromAccessibilityValue value: CFTypeRef) -> URL? {
        if CFGetTypeID(value) == CFURLGetTypeID() {
            return (value as! URL)
        }
        guard let string = nonEmptyString(value as? String) else { return nil }
        if string.hasPrefix("file://"), let url = URL(string: string) {
            return url
        }
        if string.hasPrefix("/") {
            return URL(fileURLWithPath: string)
        }
        return URL(string: string)?.isFileURL == true ? URL(string: string) : nil
    }

    private static func pageContext(from strings: [String]) -> (pageNumber: Int?, pageCount: Int?) {
        for string in strings {
            if let context = pageContext(from: string) {
                return context
            }
        }
        return (nil, nil)
    }

    private static func pageContext(from string: String) -> (pageNumber: Int?, pageCount: Int?)? {
        let patterns = [
            #"(?i)\bpage[\s\p{Zs}]+(\d+)[\s\p{Zs}]+of[\s\p{Zs}]+(\d+)\b"#,
            #"(?i)\bpage[\s\p{Zs}]+(\d+)\b"#
        ]
        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
            let range = NSRange(string.startIndex..<string.endIndex, in: string)
            guard let match = regex.firstMatch(in: string, range: range),
                  match.numberOfRanges > 1,
                  let pageRange = Range(match.range(at: 1), in: string) else { continue }
            let count: Int?
            if match.numberOfRanges > 2,
               let countRange = Range(match.range(at: 2), in: string) {
                count = Int(string[countRange])
            } else {
                count = nil
            }
            return (Int(string[pageRange]), count)
        }
        return nil
    }

    private static func spreadsheetCellRange(from strings: [String]) -> String? {
        let pattern = #"\$?[A-Z]{1,4}\$?\d{1,7}(?::\$?[A-Z]{1,4}\$?\d{1,7})?"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        for string in strings {
            let range = NSRange(string.startIndex..<string.endIndex, in: string)
            guard let match = regex.firstMatch(in: string, range: range),
                  let cellRange = Range(match.range, in: string) else { continue }
            return String(string[cellRange])
        }
        return nil
    }

    private static func spreadsheetSheetName(from strings: [String]) -> String? {
        let patterns = [
            #"(?i)\bsheet[\s\p{Zs}:]+([^,\n]+)"#,
            #"(?i)\bworksheet[\s\p{Zs}:]+([^,\n]+)"#
        ]
        for string in strings {
            for pattern in patterns {
                guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
                let range = NSRange(string.startIndex..<string.endIndex, in: string)
                guard let match = regex.firstMatch(in: string, range: range),
                      match.numberOfRanges > 1,
                      let sheetRange = Range(match.range(at: 1), in: string),
                      let sheet = nonEmptyString(String(string[sheetRange])) else { continue }
                return sheet
            }
        }
        return nil
    }

    private static func anchorPrecision(
        documentURL: URL?,
        pageNumber: Int?,
        cellRange: String?,
        windowTitle: String?
    ) -> String {
        if documentURL != nil, cellRange != nil { return "file+cell" }
        if documentURL != nil, pageNumber != nil { return "file+page" }
        if documentURL != nil { return "file" }
        if pageNumber != nil { return "window+page" }
        if windowTitle != nil { return "window" }
        return "app"
    }

    private static func orderedUniqueStrings(_ values: [String?]) -> [String] {
        var seen = Set<String>()
        var output: [String] = []
        for value in values {
            guard let cleaned = nonEmptyString(value),
                  !seen.contains(cleaned) else { continue }
            seen.insert(cleaned)
            output.append(cleaned)
        }
        return output
    }

    private static func cgWindowTitle(for application: NSRunningApplication) -> String? {
        let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
        guard let windowInfo = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
            return nil
        }

        for window in windowInfo {
            guard let ownerPID = window[kCGWindowOwnerPID as String] as? pid_t,
                  ownerPID == application.processIdentifier else { continue }
            return nonEmptyString(window[kCGWindowName as String] as? String)
        }
        return nil
    }

    private static func nonEmptyString(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    @MainActor
    private func handleCaptureURL(_ url: URL) {
        // Park the URL before any window work: on a cold launch this
        // handler runs before any root view has subscribed to
        // `.loomCaptureFromURL`, so the notification below would land on
        // zero listeners — and the window dance below can mount several
        // root-view instances over the next second. Each one picks the
        // parked URL up on appear (see `LoomCaptureURLRelay`); the entry
        // expires once the windows have settled so a much later mount
        // can't resurrect a stale capture.
        let captureToken = UUID()
        LoomCaptureURLRelay.savePending(url, token: captureToken)
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            Task { @MainActor in
                LoomCaptureURLRelay.clear(ifToken: captureToken)
            }
        }
        // URL-scheme handler activation is user-initiated (they
        // clicked L in the browser), so cross-space + cross-app
        // activation is legitimate. Use the deprecated
        // `activate(ignoringOtherApps:)` form anyway — it's still
        // the only API that reliably switches macOS Spaces when
        // Loom is fullscreen on a different Space than the
        // browser. Without it, the CaptureSheet pops up on Loom's
        // Space invisibly while the user stays on the browser.
        NSApp.activate(ignoringOtherApps: true)
        ensureMainWindowVisible()

        // Bring main window forward + force it onto the active
        // Space. `collectionBehavior += .canJoinAllSpaces`
        // temporarily lets the window appear on the user's
        // current Space; we revert after the activate so the
        // window doesn't permanently ride along.
        if let window = NSApp.windows.first(where: { $0.canBecomeKey && !$0.isMiniaturized }) {
            if captureSpaceRestoreBehavior == nil {
                var originalBehavior = window.collectionBehavior
                originalBehavior.remove(.canJoinAllSpaces)
                captureSpaceRestoreBehavior = originalBehavior
            }
            let token = UUID()
            captureSpaceRestoreToken = token
            window.collectionBehavior.insert(.canJoinAllSpaces)
            window.makeKeyAndOrderFront(nil)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self, weak window] in
                Task { @MainActor in
                    guard let self, self.captureSpaceRestoreToken == token else { return }
                    if let originalBehavior = self.captureSpaceRestoreBehavior {
                        window?.collectionBehavior = originalBehavior
                    }
                    self.captureSpaceRestoreBehavior = nil
                    self.captureSpaceRestoreToken = nil
                }
            }
        }
        NotificationCenter.default.post(
            name: .loomCaptureFromURL,
            object: nil,
            userInfo: ["url": url, "token": captureToken]
        )
    }

    @MainActor
    private func existingMainWindow(includeHidden: Bool, requireActiveSpace: Bool = false) -> NSWindow? {
        mainWindows(includeHidden: includeHidden).first { window in
            if requireActiveSpace && !window.isOnActiveSpace { return false }
            return true
        }
    }

    @MainActor
    private func mainWindows(includeHidden: Bool) -> [NSWindow] {
        NSApp.windows.filter { window in
            isMainWindowForParking(window, includeHidden: includeHidden)
        }
    }

    @MainActor
    private func isMainWindowForParking(_ window: NSWindow, includeHidden: Bool) -> Bool {
        if window.identifier?.rawValue == "loom.externalCompanion" { return false }
        let isMainWindow = window.identifier?.rawValue == MainWindow.id || window.title == "Loom"
        guard isMainWindow, !window.isMiniaturized else { return false }
        guard includeHidden || window.isVisible else { return false }
        return true
    }

    @MainActor
    private func closeMainWindow(_ window: NSWindow) {
        loomCaptureLog("closeMainWindow: #\(window.windowNumber) (sheet: \(window.attachedSheet != nil))")
        if window === fallbackMainWindow {
            fallbackMainWindow = nil
        }
        window.orderOut(nil)
        window.close()
    }

    @MainActor
    private func parkVisibleMainWindow(_ window: NSWindow) {
        loomCaptureLog("parkVisibleMainWindow: #\(window.windowNumber) (sheet: \(window.attachedSheet != nil))")
        window.ignoresMouseEvents = true
        window.alphaValue = 0
        window.orderOut(nil)
        if externalCompanionKeepsMainParked {
            closeMainWindow(window)
        }
    }

    /// Main-window chrome repair — macOS can restore titlebar/toolbar
    /// chrome during space transitions, fullscreen exits, and focus
    /// changes. This must not rely only on the SwiftUI WindowConfigurator
    /// background view, because reopen/URL-routing paths present windows
    /// before SwiftUI updates run.
    @MainActor
    private func configureMainWindowChrome(_ window: NSWindow) {
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.styleMask.insert(.fullSizeContentView)
        window.toolbar = nil
        clearTitlebarAccessories(window)
        window.standardWindowButton(.toolbarButton)?.isHidden = true
        window.collectionBehavior.insert(.fullScreenPrimary)
    }

    private func clearTitlebarAccessories(_ window: NSWindow) {
        let selector = Selector(("setTitlebarAccessoryViewControllers:"))
        guard window.responds(to: selector) else { return }
        window.perform(selector, with: [] as NSArray)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // A Mac document-like app should not become a terminated app
        // just because the main room was closed or restored as closed.
        // Reopen events below bring the main room back explicitly.
        false
    }
}

/// Replaces File > New without losing SwiftUI's `openWindow` bridge.
/// If the app is reopened from Dock/Finder with no visible window, the
/// AppDelegate posts `.loomOpenMainWindow` and this command-scoped view
/// owns the actual scene open.
// Stage 5 (呈现 outward): the Learning Record export is a product action,
// not a verification-harness artifact.
struct ExportLearningRecordMenuItem: View {
    var body: some View {
        Button("Export Learning Record…") {
            NotificationCenter.default.post(name: .loomExportLearningRecord, object: nil)
        }
        .keyboardShortcut("e", modifiers: [.command, .shift])
    }
}

struct NewTopicMenuItem: View {
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        Button("New Topic") {
            openMainWindow()
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .loomNewTopic, object: nil)
            }
        }
        .keyboardShortcut("n", modifiers: .command)
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenMainWindow)) { _ in
            openMainWindow()
        }
    }

    private func openMainWindow() {
        openWindow(id: MainWindow.id)
        NSApp.activate(ignoringOtherApps: true)
    }
}

/// App-menu item that opens the native About window, replacing the
/// default auto-generated panel.
struct AboutMenuItem: View {
    @Environment(\.openWindow) private var openWindow
    var body: some View {
        Button("About Loom") {
            openWindow(id: AboutWindow.id)
        }
    }
}

/// ⌘⇧E opens the native Ask AI window — Phase 4 ChatFocus first slice.
/// Streams from the user's configured provider, no webview hop.
///
/// Posts `.loomOpenAskAI` instead of calling `openWindow` directly so
/// ContentView's Coordinator can first capture any webview selection and
/// stash it into `AskAIContext.shared.pendingPrompt` before the window
/// opens. Coordinator forwards to `.loomOpenAskAIWindow`, which the
/// `WindowOpener` helper inside the main scene turns into an actual
/// `openWindow(id:)` call.
struct AskAIMenuItem: View {
    var body: some View {
        Button("Ask Selection") {
            NotificationCenter.default.post(name: .loomOpenAskAI, object: nil)
        }
        .keyboardShortcut("e", modifiers: [.command, .shift])
    }
}

/// ⌘⇧O · "Ask about a File…" — NSOpenPanel → read text → seed
/// AskAIContext as passage → open AskAI window. For situations where the
/// file isn't already open in the webview (e.g. drafts outside the
/// content root). Reuses the existing passage infra end-to-end.
struct AskAboutFileMenuItem: View {
    var body: some View {
        Button("Ask About a File…") {
            pickFile()
        }
        // No shortcut — ⌘⇧O is taken by Open-in-Browser; this stays
        // menu-only so ⌘⇧E (selection → Ask AI) remains the flagship
        // shortcut. Users who need a file asked-about discover via menu.
    }

    private func pickFile() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Ask About"
        panel.title = "Pick a file to ask AI about"
        // Markdown has no first-party UTType case; whitelist by extension.
        var types: [UTType] = [.plainText, .text, .utf8PlainText, .html]
        if let md = UTType(filenameExtension: "md") { types.append(md) }
        if let mdx = UTType(filenameExtension: "mdx") { types.append(mdx) }
        panel.allowedContentTypes = types
        guard panel.runModal() == .OK, let url = panel.url else { return }
        let maxBytes = 200_000
        guard let data = try? Data(contentsOf: url) else { return }
        guard data.count <= maxBytes, let text = String(data: data, encoding: .utf8) else {
            NSSound.beep()
            return
        }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        Task { @MainActor in
            AskAIContext.shared.pendingSelection = trimmed
            AskAIContext.shared.pendingSourceTitle = url.lastPathComponent
            AskAIContext.shared.pendingSourceURL = url.absoluteString
            NotificationCenter.default.post(name: .loomOpenAskAIWindow, object: nil)
        }
    }
}

/// App-menu "Set Down the Shuttle…" — opens the literary Evening ritual
/// surface. Phrased like the surface's own CTA ("Set down the shuttle")
/// so the menu item reads as what it is rather than an abstract noun.
/// No keyboard shortcut (ritual surfaces shouldn't collide with ⌘-layer
/// muscle memory); discoverable via menu only.
struct EveningMenuItem: View {
    @Environment(\.openWindow) private var openWindow
    var body: some View {
        Button("Set Down the Shuttle…") {
            openWindow(id: EveningWindow.id)
        }
    }
}

enum EveningWindow {
    static let id = "com.loom.window.evening"
}

/// ⌘⇧P — "Hold a Question…". Mints a top-level `LoomPursuit` via a
/// sheet dialog. Pursuits are the mind-room's primary object; the
/// shortcut lives on the Edit-menu group so it sits alongside the other
/// Loom-native capture shortcuts (⌘E, ⌘⇧E, ⌘⇧R). Posts
/// `.loomShowHoldQuestionDialog`; ContentView owns the `.sheet` binding.
struct HoldQuestionMenuItem: View {
    var body: some View {
        Button("Add Question…") {
            NotificationCenter.default.post(name: .loomShowHoldQuestionDialog, object: nil)
        }
        .keyboardShortcut("p", modifiers: [.command, .shift])
    }
}

/// ⌘⇧D — "Add a Sōan Card…". Mints a `LoomSoanCard` at a random-ish
/// position on the thinking-draft table via a sheet dialog. Sibling of
/// `HoldQuestionMenuItem` on the Edit menu; kind + body + optional
/// source are chosen in the sheet. Posts `.loomShowAddSoanCardDialog`;
/// ContentView owns the `.sheet` binding.
struct AddSoanCardMenuItem: View {
    var body: some View {
        Button("Add Draft Card…") {
            NotificationCenter.default.post(name: .loomShowAddSoanCardDialog, object: nil)
        }
        .keyboardShortcut("d", modifiers: [.command, .shift])
    }
}

/// ⌘⇧L — "Connect Sōan Cards…". Mints a `LoomSoanEdge` between two
/// existing cards via a sheet dialog. Sibling of `AddSoanCardMenuItem`
/// on the Edit menu; the sheet lists every card and lets the learner
/// pick `from` / `to` / relation kind. Posts
/// `.loomShowConnectSoanCardsDialog`; ContentView owns the `.sheet`
/// binding.
struct ConnectSoanCardsMenuItem: View {
    var body: some View {
        Button("Connect Draft Cards…") {
            NotificationCenter.default.post(name: .loomShowConnectSoanCardsDialog, object: nil)
        }
        .keyboardShortcut("l", modifiers: [.command, .shift])
    }
}

/// ⌘⇧X — opens Inspector to Examiner tab. Single-window consolidation.
struct ExaminerMenuItem: View {
    var body: some View {
        Button("Source check") {
            NotificationCenter.default.post(
                name: .loomShowInspectorTab,
                object: nil,
                userInfo: ["tab": "examiner"]
            )
        }
        .keyboardShortcut("x", modifiers: [.command, .shift])
    }
}

/// ⌘⇧R — opens the Inspector panel to the Rehearsal tab instead of a
/// separate window. Single-window consolidation. Coordinator still
/// seeds `RehearsalContext.pendingTopic` from webview title before
/// surfacing the panel.
struct RehearsalMenuItem: View {
    var body: some View {
        Button("Source practice") {
            NotificationCenter.default.post(name: .loomOpenRehearsal, object: nil)
        }
        .keyboardShortcut("r", modifiers: [.command, .shift])
    }
}

/// ⌘⇧I — opens Inspector to Ingestion tab.
struct IngestionMenuItem: View {
    var body: some View {
        Button("Add files") {
            NotificationCenter.default.post(
                name: .loomShowInspectorTab,
                object: nil,
                userInfo: ["tab": "ingestion"]
            )
        }
        .keyboardShortcut("i", modifiers: [.command, .shift])
    }
}

/// Menu-only — opens Inspector to Reconstructions tab.
struct ReconstructionsMenuItem: View {
    var body: some View {
        Button("Practice notes") {
            NotificationCenter.default.post(
                name: .loomShowInspectorTab,
                object: nil,
                userInfo: ["tab": "reconstructions"]
            )
        }
    }
}

/// ⌘K opens the native Shuttle palette. Replaces the web-side Shuttle
/// which used to be triggered via the `loomSearch` notification — the
/// palette is the primary quick-navigation surface so going native here
/// is a meaningful Phase 4 piece.
struct ShuttleMenuItem: View {
    @Environment(\.openWindow) private var openWindow
    var body: some View {
        Button("Shuttle") {
            openWindow(id: ShuttleWindow.id)
        }
        .keyboardShortcut("k", modifiers: .command)
    }
}

enum MainWindow {
    static let id = "com.loom.window.main"
}

struct LoomExternalSelectionCapture: Codable, Equatable {
    let token: UUID
    var text: String
    var fileURLs: [URL]
    var sourceApp: String?
    var sourceBundleIdentifier: String?
    var sourceProcessIdentifier: pid_t?
    var sourceWindowTitle: String?
    var nativeContext: LoomNativeSourceContext?
    var capturedAt: Date
}

struct LoomNativeSourceContext: Codable, Equatable {
    var documentURL: URL?
    var documentTitle: String?
    var pageNumber: Int?
    var pageCount: Int?
    var sheetName: String?
    var cellRange: String?
    var selectedRole: String?
    var anchorPrecision: String
}

private struct LoomExternalApplicationSnapshot {
    var localizedName: String?
    var bundleIdentifier: String?
    var processIdentifier: pid_t
    var windowTitle: String?
    var nativeContext: LoomNativeSourceContext?
}

/// Hands `loom://bundle/<route>` support-route navigations from the
/// AppDelegate URL handler to whichever minimal root view mounts next.
/// The route is parked in UserDefaults so a navigation arriving before
/// the SwiftUI scene exists is consumed on the root view's first appear
/// instead of being dropped.
enum LoomBundleRouteRelay {
    private static let pendingRouteDefaultsKey = "loom.pendingBundleRoute"

    static func savePendingRoute(_ path: String) {
        UserDefaults.standard.set(path, forKey: pendingRouteDefaultsKey)
    }

    static func consumePendingRoute() -> String? {
        UserDefaults.standard.string(forKey: pendingRouteDefaultsKey)
    }

    static func clearPendingRoute(_ path: String) {
        guard UserDefaults.standard.string(forKey: pendingRouteDefaultsKey) == path else { return }
        UserDefaults.standard.removeObject(forKey: pendingRouteDefaultsKey)
    }
}

struct LoomExternalFileOpenEntry: Codable, Equatable {
    var urls: [URL]
    var token: UUID
}

@MainActor
enum LoomExternalFileOpenRelay {
    private static let defaultsKey = "loom.pendingExternalFileOpenEntries"
    private static var parked: [LoomExternalFileOpenEntry] = load()

    static func savePending(_ urls: [URL], token: UUID) {
        var entries = pendingEntries()
        guard !entries.contains(where: { $0.token == token }) else { return }
        entries.append(LoomExternalFileOpenEntry(urls: urls, token: token))
        store(entries)
    }

    static func pending() -> (urls: [URL], token: UUID)? {
        pendingEntries().first.map { (urls: $0.urls, token: $0.token) }
    }

    static func pendingEntries() -> [LoomExternalFileOpenEntry] {
        parked
    }

    static func clear(ifToken token: UUID) {
        let next = pendingEntries().filter { $0.token != token }
        guard next != parked else { return }
        store(next)
    }

    private static func load() -> [LoomExternalFileOpenEntry] {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let entries = try? JSONDecoder().decode([LoomExternalFileOpenEntry].self, from: data) else {
            return []
        }
        return entries
    }

    private static func store(_ entries: [LoomExternalFileOpenEntry]) {
        parked = entries
        if entries.isEmpty {
            UserDefaults.standard.removeObject(forKey: defaultsKey)
            return
        }
        if let data = try? JSONEncoder().encode(entries) {
            UserDefaults.standard.set(data, forKey: defaultsKey)
        }
    }
}

@MainActor
enum LoomExternalSelectionCaptureRelay {
    private static let defaultsKey = "loom.pendingExternalSelectionCaptures"
    private static var parked: [LoomExternalSelectionCapture] = load()

    static func savePending(_ capture: LoomExternalSelectionCapture) {
        var captures = pendingCaptures()
        guard !captures.contains(where: { $0.token == capture.token }) else { return }
        captures.append(capture)
        store(captures)
    }

    static func pending() -> LoomExternalSelectionCapture? {
        pendingCaptures().first
    }

    static func pendingCaptures() -> [LoomExternalSelectionCapture] {
        parked
    }

    static func clear(ifToken token: UUID) {
        let next = pendingCaptures().filter { $0.token != token }
        guard next != parked else { return }
        store(next)
    }

    private static func load() -> [LoomExternalSelectionCapture] {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let captures = try? JSONDecoder().decode([LoomExternalSelectionCapture].self, from: data) else {
            return []
        }
        return captures
    }

    private static func store(_ captures: [LoomExternalSelectionCapture]) {
        parked = captures
        if captures.isEmpty {
            UserDefaults.standard.removeObject(forKey: defaultsKey)
            return
        }
        if let data = try? JSONEncoder().encode(captures) {
            UserDefaults.standard.set(data, forKey: defaultsKey)
        }
    }
}

/// Invisible helper that lives inside the main Window scene so it can use
/// `@Environment(\.openWindow)`. Listens to `loomOpen*` notifications
/// (posted from NavigationBridgeHandler) and opens the corresponding
/// SwiftUI Window scene. This is how web components like HomeClient.tsx
/// ask the shell to show native surfaces without touching AppKit directly.
/// Applies the Vellum-paper chrome stack to a secondary window —
/// `.containerBackground` paints the window bg; `.toolbarBackground`
/// tints the toolbar material; `.visible` forces it to render (default
/// `.automatic` leaves it glass-transparent). Pulled into a single
/// modifier so the 6 Window scenes don't have to repeat the stack.
extension View {
    @ViewBuilder
    func loomWindowBackground(_ color: Color) -> some View {
        if #available(macOS 15.0, *) {
            self.containerBackground(color, for: .window)
        } else {
            self.background(color)
        }
    }

    func paperChrome() -> some View {
        self
            .loomWindowBackground(LoomTokens.paper)
            .toolbarBackground(LoomTokens.paper, for: .windowToolbar)
            .toolbarBackground(.visible, for: .windowToolbar)
    }
}

struct WindowOpener: View {
    @Environment(\.openWindow) private var openWindow
    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenShuttle)) { _ in
                openWindow(id: ShuttleWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenAbout)) { _ in
                openWindow(id: AboutWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenKeyboardHelp)) { _ in
                openWindow(id: KeyboardHelpWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenAskAIWindow)) { _ in
                openWindow(id: AskAIWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomIngestFileDropped)) { _ in
                openWindow(id: IngestionWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenRehearsalWindow)) { _ in
                openWindow(id: RehearsalWindow.id)
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomOpenEveningWindow)) { _ in
                openWindow(id: EveningWindow.id)
            }
            // Shuttle action rows route Export / Import through the
            // notification bus so the palette dismisses cleanly before
            // the save/open panel shows.
            .onReceive(NotificationCenter.default.publisher(for: .loomExport)) { _ in
                LoomExport.exportToFile()
            }
            .onReceive(NotificationCenter.default.publisher(for: .loomImport)) { _ in
                LoomExport.importFromFile()
            }
    }
}

/// Help-menu item that opens the Capture setup window (CaptureHelpView).
/// Per docs/loom.md §VII.bis the instructional content for setting up
/// captures lives in this help window, not a sidebar surface.
struct CaptureHelpMenuItem: View {
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    var body: some View {
        Button("Set Up Captures…") {
            let existing = NSApp.windows.first {
                $0.identifier?.rawValue == CaptureHelpWindow.id && $0.isVisible
            }
            if existing != nil {
                dismissWindow(id: CaptureHelpWindow.id)
            } else {
                openWindow(id: CaptureHelpWindow.id)
            }
        }
    }
}

/// Help-menu item that opens the native Keyboard Shortcuts window. Wrapped
/// in its own view so it can use `@Environment(\.openWindow)` — only
/// available inside a `Scene.commands` body via a SwiftUI view.
struct KeyboardShortcutsMenuItem: View {
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    var body: some View {
        Button("Keyboard Shortcuts") {
            // KeyboardHelpView's own label reads "⌘⇧? toggle · Esc
            // close", so the shortcut has to actually toggle. Before
            // this (2026-04-23) it only opened — pressing ⌘⇧? a
            // second time no-op'd because SwiftUI dedups openWindow
            // on an already-present identifier. Now we check NSApp
            // for the window and dismiss if it's already visible.
            let existing = NSApp.windows.first {
                $0.identifier?.rawValue == KeyboardHelpWindow.id && $0.isVisible
            }
            if existing != nil {
                dismissWindow(id: KeyboardHelpWindow.id)
            } else {
                openWindow(id: KeyboardHelpWindow.id)
            }
        }
        .keyboardShortcut("?", modifiers: [.command, .shift])
    }
}

extension Notification.Name {
    /// Phase A3 — `loom://capture?payload=<json>` arrived via the URL
    /// scheme handler. UserInfo carries `["url": URL]`. Subscribed by
    /// `LoomMinimalRootView` to mount the CaptureSheet.
    static let loomCaptureFromURL = Notification.Name("loomCaptureFromURL")
    /// Posted by the toolbar's "Paste" button on a source-file surface.
    /// `SourceFileView` listens and runs `startCaptureFromClipboard()`
    /// (it owns the PDF selection state needed for the passage anchor).
    /// Replaces the previous hidden ⌘⇧V hotkey per user feedback that
    /// captures should use direct, visible affordances.
    static let loomTriggerCaptureFromClipboard = Notification.Name("loomTriggerCaptureFromClipboard")
    /// Posted after `CaptureWriter.save` completes. CaptureWebView bridges it
    /// into the captures landing as `window` event `loom:capture-saved` so
    /// the list can refetch without forcing a full WKWebView reload.
    static let loomCaptureSaved = Notification.Name("loomCaptureSaved")
    static let loomReview = Notification.Name("loomReview")
    static let loomReload = Notification.Name("loomReload")
    static let loomOpenInBrowser = Notification.Name("loomOpenInBrowser")
    static let loomGoBack = Notification.Name("loomGoBack")
    static let loomGoForward = Notification.Name("loomGoForward")
    static let loomOpenMainWindow = Notification.Name("loomOpenMainWindow")
    static let loomOpenExternalFiles = Notification.Name("loomOpenExternalFiles")
    static let loomCaptureExternalSelection = Notification.Name("loomCaptureExternalSelection")
    static let loomNewTopic = Notification.Name("loomNewTopic")
    static let loomExportLearningRecord = Notification.Name("loomExportLearningRecord")
    static let loomLearn = Notification.Name("loomLearn")
    static let loomZoomIn = Notification.Name("loomZoomIn")
    static let loomZoomOut = Notification.Name("loomZoomOut")
    static let loomZoomReset = Notification.Name("loomZoomReset")
    /// Legacy tab-switch notification kept for menu-item compatibility.
    /// ContentView maps the `"tab"` userInfo string to the matching
    /// `MainSurface` and swaps the detail column content in place.
    static let loomShowInspectorTab = Notification.Name("loomShowInspectorTab")
    /// Posted by the Edit-menu "Ask AI" item / ⌘⇧E shortcut. Coordinator
    /// intercepts, captures any webview selection into AskAIContext, then
    /// reposts as `.loomOpenAskAIWindow` for the main window's WindowOpener.
    static let loomOpenAskAI = Notification.Name("loomOpenAskAI")
    /// Posted by Coordinator once selection capture completes. The main
    /// window's `WindowOpener` owns `@Environment(\.openWindow)` and
    /// handles the actual scene open.
    static let loomOpenAskAIWindow = Notification.Name("loomOpenAskAIWindow")
    /// Posted by the Edit-menu "Rehearsal" item / ⌘⇧R shortcut so
    /// Coordinator can seed RehearsalContext with the webview's
    /// currently-open doc title before the window opens.
    static let loomOpenRehearsal = Notification.Name("loomOpenRehearsal")
    /// Posted by Coordinator after doc capture; WindowOpener opens the
    /// actual Rehearsal window scene.
    static let loomOpenRehearsalWindow = Notification.Name("loomOpenRehearsalWindow")
    /// Posted by the "Hold a Question…" menu item (⌘⇧P) and the
    /// matching Shuttle command. ContentView observes and flips a
    /// local @State binding to present the HoldQuestionSheet.
    static let loomShowHoldQuestionDialog = Notification.Name("loomShowHoldQuestionDialog")
    /// Posted by the "Add a Sōan Card…" menu item (⌘⇧D) and the
    /// matching Shuttle command. ContentView observes and flips a
    /// local @State binding to present the AddSoanCardSheet.
    static let loomShowAddSoanCardDialog = Notification.Name("loomShowAddSoanCardDialog")
    /// Posted by the "Connect Sōan Cards…" menu item (⌘⇧L) and the
    /// matching Shuttle command. ContentView observes and flips a
    /// local @State binding to present the ConnectSoanCardsSheet.
    static let loomShowConnectSoanCardsDialog = Notification.Name("loomShowConnectSoanCardsDialog")
    /// Posted by the Shuttle's "Export Loom" / "Import Loom" action
    /// rows. WindowOpener handles these by invoking LoomExport directly
    /// — no web surface to hop through.
    static let loomExport = Notification.Name("loomExport")
    static let loomImport = Notification.Name("loomImport")
}

/// Keyboard shortcuts for the native Reflection workspace and the remaining
/// compatibility routes.
struct WorkspaceShortcutsCommands: View {
    var body: some View {
        Group {
            Button("Reflection") {
                postNav("/reflection")
            }
            .keyboardShortcut("1", modifiers: .command)
            Button("Sources") {
                postNav("/sources")
            }
            .keyboardShortcut("2", modifiers: .command)
            Button("Draft") {
                postNav("/draft")
            }
            .keyboardShortcut("3", modifiers: .command)
        }
    }

    private func postNav(_ path: String) {
        NotificationCenter.default.post(
            name: .loomShuttleNavigate,
            object: nil,
            userInfo: ["path": path]
        )
    }
}
