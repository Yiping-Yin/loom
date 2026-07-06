import SwiftUI
import AppKit

// MARK: - Root shell metrics
//
// One compact chrome scale for the whole minimal shell. File-scope so
// derived insets (`sidebarTopInset`) can be computed from the same
// constants the root toolbar uses.

/// Height of the single root-owned toolbar shared by Sources and Draft.
private let rootToolbarHeight: CGFloat = 28
/// One compact body-start inset owned by the app shell so Sources and
/// Draft cannot drift independently or open a blank band under the
/// toolbar.
private let primarySurfaceTopInset: CGFloat = 8
/// The sidebar clears the same compact toolbar height without inheriting
/// the detail toolbar as a visible sidebar band.
private let sidebarTopInset: CGFloat = rootToolbarHeight + primarySurfaceTopInset
/// Compact product-switcher rail. Source folders live inside Sources
/// now, so the rail stays narrow.
private let minimalSidebarWidth: CGFloat = 112
/// The left rail is a compact navigation rail, not a wide document column.
private let sidebarRowHeight: CGFloat = 24
/// Sidebar icons align in a tight fixed slot so labels do not drift.
private let sidebarIconSlotWidth: CGFloat = 14
/// Fixed icon-to-text gap shared by every sidebar row.
private let sidebarIconTextGap: CGFloat = 6
/// Toolbar controls sit in a compact app-chrome lane instead of a wide
/// titlebar band.
private let rootChromeHorizontalInset: CGFloat = 8
/// Toolbar icon buttons stay compact to avoid a heavy top strip.
private let chromeButtonSize: CGFloat = 24

/// Minimal Loom root shell. Sources and Draft are the two primary
/// workspaces; everything else (captures runtime readers, folder homes,
/// source files, installed support routes) mounts behind the same shared
/// root toolbar and primary-surface rhythm. The shell owns one continuous
/// app canvas background, one 28pt root toolbar, and one 8pt body-start
/// inset — pages never carry their own top clearance.
struct LoomMinimalRootView: View {
    enum DetailSurface: Equatable {
        case sources
        case draft
        case folderHome(URL)   // loom://content/<root-id>(/sub-path)
        case sourceFile(URL)   // loom://content/<root-id>/<file>
        case captures          // runtime captures landing (webview)
        case captureReader     // runtime capture/snapshot reader
        case webCaptureSetup   // legacy capture-setup deep link → Sources
        case supportRoute(String) // installed support bundle route, e.g. "/hour"
    }

    @State private var roots: [ContentRoot] = []
    @State private var selection: DetailSurface = .sources
    @AppStorage("theme") private var theme: String = "dark"
    /// Public working mode masks private capture metadata on the Sources
    /// workbench (mirrors DraftClient's web-side toggle).
    @AppStorage("loom.publicWorkingMode") private var publicWorkingMode: Bool = false
    @State private var themeClock: Date = Date()
    @State private var isCreatingPage: Bool = false
    @State private var pageDraft: String = ""
    /// Browser-style navigation history. Every navigation pushes the
    /// previous selection here so `goBack()` can pop it.
    @State private var history: [DetailSurface] = []
    /// Forward stack — populated when goBack pops history. Cleared on
    /// any fresh navigation (standard browser semantics).
    @State private var forwardStack: [DetailSurface] = []

    /// Phase A1 quick-capture: when non-nil, the CaptureSheet renders.
    @State private var capturePayload: CapturePayload? = nil
    /// Toast surface for capture-saved feedback.
    @State private var captureToast: String? = nil
    /// Last successfully-saved capture URL — used by the toast's
    /// "Reveal" affordance.
    @State private var lastCaptureURL: URL? = nil
    /// Token of the last `.loomCaptureFromURL` delivery this instance
    /// handled — gates the relay/notification double-delivery (see
    /// `LoomCaptureURLRelay`).
    @State private var lastHandledCaptureToken: UUID? = nil
    /// Bumped after a capture save or manual refresh. CapturesView uses
    /// this as a URL token so an already-mounted capture detail webview
    /// is forced back to the landing list and refetches native data.
    @State private var capturesRefreshToken: Int = 0

    /// Hover state for sidebar rows — keyed by a stable string id.
    @State private var hoveredSidebarRow: String? = nil
    /// Detail pane opacity — §IV.C settle-fade on selection change.
    @State private var detailOpacity: Double = 1.0

    private var resolvedColorScheme: ColorScheme {
        SidebarThemeResolution.resolvedColorScheme(theme: theme, now: themeClock)
    }

    private var usesNightPalette: Bool {
        SidebarThemeResolution.usesNightPalette(colorScheme: resolvedColorScheme)
    }

    private var webThemeMode: String {
        usesNightPalette ? "dark" : "light"
    }

    /// The shared toolbar owns exactly the toolbar height — no extra
    /// pane-specific titlebar offsets.
    private var rootToolbarClearance: CGFloat {
        rootToolbarHeight
    }

    /// One named canvas background for the whole installed shell —
    /// sidebar, toolbar, and detail all sit on the same paper.
    private var rootCanvasBackground: Color {
        LoomTokens.dsPaperDeep
    }

    var body: some View {
        HStack(spacing: 0) {
            sidebar
                .frame(width: minimalSidebarWidth, alignment: .topLeading)
                .frame(maxHeight: .infinity, alignment: .topLeading)
                .background(rootCanvasBackground.ignoresSafeArea(.container, edges: .top))
            rootSplitHairline
            VStack(spacing: 0) {
                rootChrome
                    .frame(height: rootToolbarClearance)
                rootToolbarHairline
                detailContent
                    .opacity(detailOpacity)
                    .background(rootCanvasBackground)
                    .background(
                        SwipeNavigation(
                            onBack: { goBack() },
                            onForward: { goForward() }
                        )
                    )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        // The split shell itself enters the full-size titlebar; otherwise
        // macOS adds a hidden safe-area band above Sources and Draft.
        .ignoresSafeArea(.container, edges: .top)
        .background(rootCanvasBackground.ignoresSafeArea())
        .environment(\.colorScheme, resolvedColorScheme)
        .preferredColorScheme(resolvedColorScheme)
        // NSWindow-level chrome: transparent titlebar + fullSizeContentView
        // and no scene-managed toolbar — the root chrome row above is the
        // only chrome owner.
        .background(WindowConfigurator(title: "Loom", isNight: usesNightPalette, contentExtendsUnderTitlebar: true, removesSystemToolbar: true))
        .background(
            // Hidden ⌘[ / ⌘] / ⌘R shortcuts for back / forward / refresh.
            ZStack {
                Button("Back") { goBack() }
                    .keyboardShortcut("[", modifiers: .command)
                Button("Forward") { goForward() }
                    .keyboardShortcut("]", modifiers: .command)
                Button("Refresh") { refreshActive() }
                    .keyboardShortcut("r", modifiers: .command)
            }
            .opacity(0)
            .frame(width: 0, height: 0)
        )
        .sheet(isPresented: Binding<Bool>(
            get: { capturePayload != nil },
            set: { if !$0 { capturePayload = nil } }
        )) {
            CaptureSheet(payload: $capturePayload, onSaved: handleCaptureSaved)
        }
        .overlay(alignment: .bottom) {
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
        .onAppear {
            reload()
            consumePendingBundleRoute()
            // Cold launch: the AppleEvent handler ran before this view
            // subscribed and parked the capture URL in the relay.
            if let pending = LoomCaptureURLRelay.pending(),
               pending.token != lastHandledCaptureToken {
                lastHandledCaptureToken = pending.token
                handleCaptureRoute(CaptureURLRouter.route(url: pending.url))
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomContentRootsChanged)) { _ in
            reload()
        }
        .onReceive(Timer.publish(every: 300, on: .main, in: .common).autoconnect()) { now in
            themeClock = now
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowFolderHome)) { note in
            if let url = note.userInfo?["url"] as? URL {
                navigate(.folderHome(url))
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureFromURL)) { note in
            // Phase A3 — bookmarklet -> `loom://capture?payload=…` ->
            // AppDelegate -> here. Decode, resolve a `web` anchor,
            // open the sheet with the extracted markdown.
            let token = note.userInfo?["token"] as? UUID
            if let token, token == lastHandledCaptureToken { return }
            lastHandledCaptureToken = token
            handleCaptureRoute(CaptureURLRouter.route(userInfo: note.userInfo))
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowLibrary)) { _ in
            navigate(.sources)
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomBeginNewPage)) { _ in
            startNewPage()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenSourceFile)) { note in
            if let url = note.userInfo?["url"] as? URL {
                navigate(.sourceFile(url))
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShuttleNavigate)) { note in
            if let path = note.userInfo?["path"] as? String {
                navigateProductPath(path)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomJumpToPDFAnchor)) { note in
            handleAnchorJump(note)
        }
    }

    /// `loom://anchor?src=<source-loomURL>&page=N&rect=x,y,w,h&text=...`
    /// — fired when the user clicks a "📍 Jump to passage" link inside
    /// a saved note. Navigate to the source PDF, then post the
    /// page+rect to PDFViewHolder once the new view has had a chance
    /// to mount and load.
    private func handleAnchorJump(_ note: Notification) {
        guard let url = note.userInfo?["url"] as? URL,
              let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let items = comps.queryItems else { return }
        guard let pageStr = items.first(where: { $0.name == "page" })?.value,
              let pageIdx = Int(pageStr),
              let rectStr = items.first(where: { $0.name == "rect" })?.value else { return }
        let parts = rectStr.split(separator: ",").compactMap { Double($0) }
        guard parts.count == 4 else { return }
        let rect = CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])

        // Prefer the modern `src=<full loom URL>` form; fall back to
        // legacy `doc=<filename>` by searching active roots for a
        // matching basename. Notes saved before the schema change
        // still resolve.
        let srcURL: URL? = {
            if let s = items.first(where: { $0.name == "src" })?.value,
               let u = URL(string: s) {
                return u
            }
            guard let docName = items.first(where: { $0.name == "doc" })?.value,
                  let resolved = Self.resolveDocByName(docName) else { return nil }
            return resolved
        }()
        guard let srcURL = srcURL else { return }

        navigate(.sourceFile(srcURL))
        // PDFView needs a moment to mount + load before it can scroll
        // to a destination.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            NotificationCenter.default.post(
                name: .loomApplyPDFAnchor,
                object: nil,
                userInfo: ["page": pageIdx, "rect": NSValue(rect: rect)]
            )
        }
    }

    /// Walk every active root looking for a file whose last path
    /// component matches `name` (case-insensitive).
    private static func resolveDocByName(_ name: String) -> URL? {
        let target = name.lowercased()
        let fm = FileManager.default
        for (rootID, rootURL) in ContentRootStore.allActiveURLs {
            let enumerator = fm.enumerator(
                at: rootURL,
                includingPropertiesForKeys: [.isRegularFileKey],
                options: [.skipsHiddenFiles]
            )
            while let item = enumerator?.nextObject() as? URL {
                if item.lastPathComponent.lowercased() == target {
                    let rootPath = rootURL.standardizedFileURL.path
                    let itemPath = item.standardizedFileURL.path
                    guard itemPath.hasPrefix(rootPath + "/") else { continue }
                    let rel = String(itemPath.dropFirst(rootPath.count + 1))
                    let encoded = rel
                        .split(separator: "/")
                        .map { $0.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String($0) }
                        .joined(separator: "/")
                    return URL(string: "loom://content/\(rootID.uuidString.lowercased())/\(encoded)")
                }
            }
        }
        return nil
    }

    // MARK: - Navigation

    /// Always go through this when changing pane selection.
    private func navigate(_ next: DetailSurface) {
        guard next != selection else { return }
        history.append(selection)
        forwardStack.removeAll()
        selection = next
        fadeInDetail()
    }

    /// §IV.C settle-fade: brief 0.6 → 1.0 fade on the detail pane when
    /// its content swaps.
    private func fadeInDetail() {
        detailOpacity = 0.6
        withAnimation(.easeOut(duration: 0.15)) {
            detailOpacity = 1.0
        }
    }

    private func goBack() {
        guard let previous = history.popLast() else { return }
        forwardStack.append(selection)
        selection = previous
        fadeInDetail()
    }

    private func goForward() {
        guard let next = forwardStack.popLast() else { return }
        history.append(selection)
        selection = next
        fadeInDetail()
    }

    /// Trigger a refresh: reload content roots and ping the active page
    /// to re-scan its source folder. Cheap; safe to call repeatedly.
    private func refreshActive() {
        reload()
        if selection == .captures || selection == .captureReader {
            capturesRefreshToken += 1
        }
        NotificationCenter.default.post(name: .loomRefreshActivePage, object: nil)
    }

    /// Runtime readers (captures landing, capture/snapshot detail) return
    /// to Sources — the captures landing is plumbing, not a destination.
    private func returnToSourcesFromRuntime() {
        guard selection != .sources else { return }
        if history.last == .sources {
            goBack()
            return
        }
        history.append(selection)
        forwardStack.removeAll()
        selection = .sources
        fadeInDetail()
    }

    /// Map product paths from the web bridge / installed bundle routes
    /// onto the two primary surfaces. `/collect`, `/sources`, and
    /// `/knowledge` are all Sources; legacy thinking surfaces are gone.
    private func navigateProductPath(_ path: String) {
        let normalized = normalizeProductPath(path)
        if normalized.hasPrefix("/loom-render/capture/") || normalized.hasPrefix("/loom-render/snapshot/") {
            navigate(.captureReader)
            return
        }
        if normalized == "/captures" || normalized.hasPrefix("/loom-render/captures") {
            navigate(.captures)
            return
        }
        switch normalized {
        case "/", "/collect", "/sources", "/knowledge":
            navigate(.sources)
        case "/draft":
            navigate(.draft)
        case "/hour", "/connections", "/year", "/discipline", "/system", "/help":
            let normalizedSupportPath = normalized
            navigate(.supportRoute(normalizedSupportPath))
        default:
            navigate(.sources)
        }
    }

    /// Strip query/fragment, exported `.html` suffixes, and trailing
    /// slashes so bundle routes compare as clean product paths.
    private func normalizeProductPath(_ path: String) -> String {
        var p = path
        if let cut = p.firstIndex(where: { $0 == "?" || $0 == "#" }) {
            p = String(p[..<cut])
        }
        if p.hasSuffix(".html") {
            p = (p as NSString).deletingLastPathComponent
        }
        while p.count > 1 && p.hasSuffix("/") { p.removeLast() }
        if p.isEmpty { p = "/" }
        if !p.hasPrefix("/") { p = "/" + p }
        return p
    }

    /// `loom://bundle/<route>` URLs that arrive before the root view is
    /// mounted are parked in `LoomBundleRouteRelay`; consume on appear.
    private func consumePendingBundleRoute() {
        guard let path = LoomBundleRouteRelay.consumePendingRoute() else { return }
        LoomBundleRouteRelay.clearPendingRoute(path)
        navigateProductPath(path)
    }

    /// Installed support routes render through the static bundle, same
    /// channel as the runtime readers.
    private func supportBundleURL(for path: String) -> URL? {
        let trimmed = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !trimmed.isEmpty else { return nil }
        return URL(string: "loom://bundle/\(trimmed)/")
    }

    // MARK: - Capture (Phase A1)

    /// Quick-capture entry point. Resolves the best anchor list for
    /// whatever surface is currently active.
    private func startQuickCapture() {
        let anchors: [CaptureAnchor]
        switch selection {
        case .folderHome(let url):
            anchors = CaptureAnchorResolver.resolveForFolderHome(loomURL: url)
        case .sourceFile(let url):
            anchors = CaptureAnchorResolver.resolveForSourceFile(loomURL: url, selection: nil)
        default:
            anchors = CaptureAnchorResolver.resolveDefault()
        }
        guard let primary = anchors.first else {
            captureToast = "Open a folder first to enable Quick Capture."
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { captureToast = nil }
            return
        }
        capturePayload = CapturePayload.makeQuickCapture(anchor: primary, available: anchors)
    }

    private func handleCaptureRoute(_ outcome: CaptureURLRouteOutcome) {
        switch outcome {
        case .openCapture(let payload):
            startWebCapture(payload)
        case .decodeFailed, .emptyPayload:
            captureToast = outcome.failureToast
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { captureToast = nil }
        }
    }

    private func startWebCapture(_ payload: CaptureWebPayload) {
        let anchors = CaptureAnchorResolver.resolveForWebCapture(
            payload,
            preferredRootID: preferredWebCaptureRootID()
        )
        guard let primary = anchors.first else {
            captureToast = "Open a folder in Loom first to enable web capture."
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { captureToast = nil }
            return
        }
        capturePayload = CapturePayload.makeFromWebPayload(payload, anchor: primary, available: anchors)
    }

    private func handleCaptureSaved(_ url: URL) {
        lastCaptureURL = url
        let loc = url.deletingLastPathComponent().lastPathComponent
        captureToast = "Captured to \(loc)"
        DispatchQueue.main.async {
            capturesRefreshToken += 1
            navigate(.captures)
            NotificationCenter.default.post(name: .loomCaptureSaved, object: nil)
            NotificationCenter.default.post(name: .loomRefreshActivePage, object: nil)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.5) {
            withAnimation { captureToast = nil; lastCaptureURL = nil }
        }
    }

    private func preferredWebCaptureRootID() -> UUID? {
        switch selection {
        case .folderHome(let url), .sourceFile(let url):
            return Self.rootID(from: url)
        default:
            return nil
        }
    }

    // MARK: - Sidebar

    /// Compact product switcher: Sources and Draft, nothing else. Source
    /// folders and capture queues live inside the Sources workbench.
    private var sidebar: some View {
        sidebarSurfaceSlot {
            VStack(alignment: .leading, spacing: 0) {
                sourcesRow
                draftRow
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    /// Small system chrome font for sidebar rows — navigation chrome,
    /// not reading-surface serif type.
    private func sidebarLabelFont(isSelected: Bool) -> Font {
        .system(size: 11, weight: isSelected ? .semibold : .regular)
    }

    /// Bronze hover + active chrome recipe shared by every sidebar row.
    @ViewBuilder
    private func rowChrome(rowID: String, isSelected: Bool) -> some View {
        let isHovered = hoveredSidebarRow == rowID
        let borderWidth: CGFloat = isSelected ? 2.5 : (isHovered ? 2 : 0)
        let fill: Color = {
            if isSelected { return LoomTokens.dsThread.opacity(0.18) }
            if isHovered { return LoomTokens.dsThread.opacity(0.06) }
            return Color.clear
        }()
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: DSRadius.sm.value)
                .fill(fill)
            if borderWidth > 0 {
                Rectangle()
                    .fill(LoomTokens.dsThread)
                    .frame(width: borderWidth)
                    .clipShape(RoundedRectangle(cornerRadius: 1))
            }
        }
        .animation(.easeOut(duration: DSMotion.fast.duration), value: isHovered)
    }

    /// One fixed row renderer for the primary navigation rows. A real
    /// SwiftUI Button so installed-app accessibility clicks navigate
    /// reliably; one fixed icon slot and one fixed icon-to-text gap.
    private func sidebarNavigationRow(
        rowID: String,
        icon: String,
        title: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 0) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(isSelected ? LoomTokens.dsInk1 : LoomTokens.dsInk3)
                    .frame(width: sidebarIconSlotWidth, height: sidebarIconSlotWidth, alignment: .center)
                Text(title)
                    .font(sidebarLabelFont(isSelected: isSelected))
                    .foregroundStyle(isSelected ? LoomTokens.dsThread : LoomTokens.dsInk1)
                    .lineLimit(1)
                    .padding(.leading, sidebarIconTextGap)
                Spacer(minLength: 0)
            }
            .contentShape(Rectangle())
            .padding(.horizontal, DSSpace.sm.value)
            .frame(height: sidebarRowHeight)
            .background(rowChrome(rowID: rowID, isSelected: isSelected))
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            hoveredSidebarRow = hovering ? rowID : nil
        }
    }

    /// Sources and Draft delegate to the shared sidebar row grid.
    private func sidebarButton(
        rowID: String,
        icon: String,
        title: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        sidebarNavigationRow(
            rowID: rowID,
            icon: icon,
            title: title,
            isSelected: isSelected,
            action: action
        )
    }

    private var sourcesRow: some View {
        sidebarButton(
            rowID: "__sources",
            icon: "folder",
            title: "Sources",
            isSelected: selection == .sources || selection == .webCaptureSetup,
            action: { navigate(.sources) }
        )
    }

    private var draftRow: some View {
        sidebarButton(
            rowID: "__draft",
            icon: "square.and.pencil",
            title: "Draft",
            isSelected: selection == .draft,
            action: { navigate(.draft) }
        )
    }

    // MARK: - Root chrome

    /// The single shared toolbar above the detail pane. Navigation on
    /// the left, the wordmark in the middle, page-specific actions on
    /// the right. The toolbar never allocates a fake sidebar slice —
    /// the sidebar is an independent column to its left.
    private var rootChrome: some View {
        HStack(spacing: DSSpace.xs.value) {
            chromeIconButton(
                systemName: "chevron.left",
                help: "Back · ⌘[",
                isEnabled: !history.isEmpty,
                action: goBack
            )
            chromeIconButton(
                systemName: "chevron.right",
                help: "Forward · ⌘]",
                isEnabled: !forwardStack.isEmpty,
                action: goForward
            )
            chromeIconButton(
                systemName: "arrow.clockwise",
                help: "Refresh · ⌘R",
                isEnabled: true,
                action: refreshActive
            )
            Spacer(minLength: 0)
            Text("Loom")
                .font(.system(size: DSType.caption.size, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Spacer(minLength: 0)
            surfaceChromeActions
        }
        .padding(.horizontal, rootChromeHorizontalInset)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(rootCanvasBackground)
    }

    private func chromeIconButton(
        systemName: String,
        help: String,
        isEnabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: DSType.caption.size, weight: .medium))
                .foregroundStyle(isEnabled ? LoomTokens.dsInk1 : LoomTokens.dsInk3)
                .frame(width: chromeButtonSize, height: chromeButtonSize)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .help(help)
    }

    private func chromeTextButton(
        title: String,
        help: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: DSType.caption.size, weight: .medium))
                .foregroundStyle(LoomTokens.dsInk1)
                .padding(.horizontal, DSSpace.xs.value + 2)
                .frame(height: chromeButtonSize)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .help(help)
    }

    /// Page-specific actions in the shared toolbar — the surfaces keep
    /// the implementations, the chrome owns the affordances.
    @ViewBuilder
    private var surfaceChromeActions: some View {
        switch selection {
        case .sources, .webCaptureSetup:
            chromeTextButton(
                title: "Add files",
                help: "Add files — pick local source files"
            ) {
                NotificationCenter.default.post(name: .loomSourcesAddFiles, object: nil)
            }
            chromeTextButton(
                title: "Add Question",
                help: "Hold a question beside your sources"
            ) {
                NotificationCenter.default.post(name: .loomShowHoldQuestionDialog, object: nil)
            }
            chromeTextButton(
                title: "Add Folder",
                help: "Add a folder of sources"
            ) {
                pickFolder()
            }
        case .draft:
            chromeTextButton(
                title: "Add source",
                help: "Attach a source reference to this draft"
            ) {
                NotificationCenter.default.post(name: .loomDraftShowReferencePicker, object: nil)
            }
            chromeTextButton(
                title: "Continue",
                help: "Continue writing with AI"
            ) {
                NotificationCenter.default.post(name: .loomDraftContinueWithAI, object: nil)
            }
            chromeTextButton(
                title: "Save",
                help: "Save this draft"
            ) {
                NotificationCenter.default.post(name: .loomDraftSave, object: nil)
            }
        case .captureReader:
            chromeTextButton(
                title: "Sources",
                help: "Back to Sources (Esc)"
            ) {
                returnToSourcesFromRuntime()
            }
        case .captures:
            chromeTextButton(
                title: "Sources",
                help: "Back to Sources"
            ) {
                returnToSourcesFromRuntime()
            }
        case .supportRoute:
            chromeTextButton(
                title: "Sources",
                help: "Back to Sources"
            ) {
                returnToSourcesFromRuntime()
            }
        case .sourceFile:
            chromeTextButton(
                title: "Paste",
                help: "Capture from clipboard, anchored to the current selection"
            ) {
                NotificationCenter.default.post(name: .loomTriggerCaptureFromClipboard, object: nil)
            }
            chromeTextButton(
                title: "Note",
                help: "Write a thought, save the quote, or summon AI"
            ) {
                NotificationCenter.default.post(name: .loomTriggerNote, object: nil)
            }
        case .folderHome:
            chromeTextButton(
                title: "Capture",
                help: "Capture a quick note into this folder"
            ) {
                startQuickCapture()
            }
        }
    }

    private var rootSplitHairline: some View {
        Rectangle()
            .fill(LoomTokens.dsInk3.opacity(0.18))
            .frame(width: 1)
    }

    private var rootToolbarHairline: some View {
        Rectangle()
            .fill(LoomTokens.dsInk3.opacity(0.18))
            .frame(height: 1)
    }

    // MARK: - Primary surface rhythm

    /// Primary pages mount through one shell-owned slot instead of
    /// carrying page-local top clearance.
    private func primarySurfaceSlot<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(.top, primarySurfaceTopInset)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    /// The sidebar uses the same root-owned body rhythm instead of a
    /// separate toolbar spacer.
    private func sidebarSurfaceSlot<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(.top, sidebarTopInset)
    }

    // MARK: - Detail pane

    /// Raw destination switching, separate from the in-window chrome
    /// wrapper above it.
    @ViewBuilder
    private var detailContent: some View {
        switch selection {
        case .sources:
            primarySurfaceSlot {
                LoomLibraryView(publicWorkingMode: publicWorkingMode)
            }
        case .webCaptureSetup:
            primarySurfaceSlot {
                LoomLibraryView(publicWorkingMode: publicWorkingMode)
            }
        case .draft:
            primarySurfaceSlot {
                LoomDraftView()
            }
        case .folderHome(let url):
            primarySurfaceSlot {
                folderHome(for: url)
            }
        case .sourceFile(let url):
            primarySurfaceSlot {
                SourceFileView(loomURL: url) {
                    goBack()
                }
            }
        case .captures:
            primarySurfaceSlot {
                CapturesView(refreshToken: capturesRefreshToken, themeMode: webThemeMode)
            }
        case .captureReader:
            primarySurfaceSlot {
                CapturesView(
                    refreshToken: capturesRefreshToken,
                    themeMode: webThemeMode,
                    showReaderChrome: false,
                    onBackToSources: {
                        returnToSourcesFromRuntime()
                    }
                )
            }
        case .supportRoute(let path):
            supportRouteSurface(path)
        }
    }

    @ViewBuilder
    private func supportRouteSurface(_ path: String) -> some View {
        if let supportURL = supportBundleURL(for: path) {
            CaptureWebView(url: supportURL, themeMode: webThemeMode)
        } else {
            VStack(spacing: DSSpace.sm.value - 2) {
                Text("Couldn't open this support page.")
                    .font(.system(size: DSType.caption.size, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                Text(path)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(LoomTokens.dsInk2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private func folderHome(for loomURL: URL) -> some View {
        if let resolved = Self.resolveFolderHome(loomURL) {
            LoomFolderHomeView(
                rootID: resolved.rootID,
                externalFolderURL: resolved.externalFolder,
                displayName: resolved.displayName
            )
            .id(loomURL)
        } else {
            VStack(spacing: DSSpace.sm.value - 2) {
                Text("Couldn't open this page.")
                    .font(.system(size: DSType.caption.size, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                Text(loomURL.absoluteString)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(LoomTokens.dsInk2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private struct ResolvedFolderHome {
        let externalFolder: URL?
        let displayName: String?
        let rootID: UUID?
    }

    private static func rootID(from loomURL: URL) -> UUID? {
        guard loomURL.scheme == "loom", loomURL.host == "content" else { return nil }
        let segs = loomURL.path.trimmingCharacters(in: CharacterSet(charactersIn: "/")).split(separator: "/")
        guard let first = segs.first else { return nil }
        return UUID(uuidString: String(first))
    }

    private static func resolveFolderHome(_ loomURL: URL) -> ResolvedFolderHome? {
        guard let rootID = rootID(from: loomURL) else { return nil }
        let segs = loomURL.path.trimmingCharacters(in: CharacterSet(charactersIn: "/")).split(separator: "/").map(String.init)
        let rest = segs.dropFirst().joined(separator: "/")
        let stored = ContentRootStore.loadAll().first { $0.id == rootID }
        let external = ContentRootStore.activeURL(for: rootID)
        let externalSubfolder: URL? = {
            guard let external = external else { return nil }
            if rest.isEmpty { return external }
            return external.appendingPathComponent(rest).standardizedFileURL
        }()
        let label: String? = {
            if rest.isEmpty { return stored?.displayName }
            return externalSubfolder?.lastPathComponent
        }()
        return ResolvedFolderHome(externalFolder: externalSubfolder, displayName: label, rootID: rootID)
    }

    // MARK: - Actions

    private func reload() {
        roots = ContentRootStore.loadAll()
    }

    private func startNewPage() {
        pageDraft = ""
        isCreatingPage = true
    }

    private func cancelNewPage() {
        isCreatingPage = false
        pageDraft = ""
    }

    private func commitNewPage() {
        let trimmed = pageDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { cancelNewPage(); return }
        guard let added = ContentRootStore.addPage(displayName: trimmed) else {
            cancelNewPage(); return
        }
        let mdURL = LoomFileStore.loomMDURL(for: added.id)
        try? "# \(trimmed)\n".write(to: mdURL, atomically: true, encoding: .utf8)
        cancelNewPage()
        if let target = URL(string: "loom://content/\(added.id.uuidString.lowercased())") {
            navigate(.folderHome(target))
        }
    }

    private func pickFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose Folder"
        panel.title = "Add a folder of sources"
        guard panel.runModal() == .OK, let url = panel.url else { return }
        guard let added = ContentRootStore.addFolder(url: url) else { return }
        if let target = URL(string: "loom://content/\(added.id.uuidString.lowercased())") {
            navigate(.folderHome(target))
        }
    }
}

extension Notification.Name {
    /// Posted by the shared Sources toolbar "Add files" action. The
    /// Sources surface owns the local-file importer implementation and
    /// subscribes to this name.
    static let loomSourcesAddFiles = Notification.Name("loomSourcesAddFiles")
}

/// Bridges native macOS two-finger horizontal trackpad swipes into
/// SwiftUI back/forward callbacks. Listens via a local NSEvent monitor
/// so the gesture works no matter which subview the cursor sits over,
/// and uses `NSEvent.trackSwipeEvent` so the swipe feels native (the
/// rubber-banding/threshold matches Safari/Finder behavior).
///
/// Convention (matches Safari + Finder with natural scrolling):
///   • swipe right (fingers move right, scrollingDeltaX > 0)  → back
///   • swipe left  (fingers move left,  scrollingDeltaX < 0)  → forward
struct SwipeNavigation: NSViewRepresentable {
    let onBack: () -> Void
    let onForward: () -> Void

    func makeNSView(context: Context) -> NSView {
        context.coordinator.attach(onBack: onBack, onForward: onForward)
        return NSView()
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        context.coordinator.onBack = onBack
        context.coordinator.onForward = onForward
    }

    static func dismantleNSView(_ nsView: NSView, coordinator: Coordinator) {
        coordinator.detach()
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        var monitor: Any?
        var onBack: (() -> Void)?
        var onForward: (() -> Void)?
        private var tracking = false

        func attach(onBack: @escaping () -> Void, onForward: @escaping () -> Void) {
            self.onBack = onBack
            self.onForward = onForward
            // Local monitor sees scroll events before any view processes
            // them. We always return the event so normal scrolling is
            // unaffected — only `.began` events with a clearly horizontal
            // bias spawn a swipe-tracking session.
            self.monitor = NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
                self?.handle(event)
                return event
            }
        }

        func detach() {
            if let monitor = monitor {
                NSEvent.removeMonitor(monitor)
                self.monitor = nil
            }
        }

        private func handle(_ event: NSEvent) {
            guard !tracking,
                  event.phase == .began,
                  event.hasPreciseScrollingDeltas,
                  event.scrollingDeltaX != 0,
                  abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY) * 2 else {
                return
            }
            let goingBack = event.scrollingDeltaX > 0
            tracking = true
            var fired = false
            event.trackSwipeEvent(
                options: .clampGestureAmount,
                dampenAmountThresholdMin: -1,
                max: 1
            ) { [weak self] gestureAmount, _, isComplete, _ in
                if isComplete {
                    if !fired, abs(gestureAmount) > 0.4 {
                        fired = true
                        DispatchQueue.main.async {
                            if goingBack {
                                self?.onBack?()
                            } else {
                                self?.onForward?()
                            }
                        }
                    }
                    self?.tracking = false
                }
            }
        }
    }
}
