import SwiftUI
import WebKit

struct ContentView: View {
    @EnvironmentObject var server: DevServer
    @StateObject private var webState = WebDebugState()
    // Evidence Desk default: the cool-black dark identity. "auto" (day/night
    // rhythm) and "light" remain available in Appearance settings.
    @AppStorage("theme") private var theme: String = "dark"
    @AppStorage("loom.showDebugHUD.v2") private var showDebugHUD = false
    // Central handle to open the Settings scene. The legacy
    // `showSettingsWindow:` selector is unreliable on macOS 14+, so
    // every surface (sidebar CTA, failed-view button, AppKit
    // NavigationBridge) funnels through `.loomOpenSettings` and we
    // invoke `openSettings()` here from the root SwiftUI view.
    @Environment(\.openSettings) private var openSettings

    private var windowTitle: String {
        switch server.status {
        case .ready:
            let title = webState.pageTitle.trimmingCharacters(in: .whitespacesAndNewlines)
            // Folder name already surfaces in the sidebar's Library
            // section header, so no need to append it here and end up
            // with "Coworks · Loom — INFS 3822" double-branded titles.
            return title.isEmpty ? "Loom" : title
        case .starting, .idle:
            return "Loom"
        case .failed:
            return "Loom · Offline"
        }
    }

    @State private var firstRunSheetVisible = false
    /// Presentation state for the "Hold a Question…" sheet (⌘⇧P or the
    /// matching Shuttle command). Observes `.loomShowHoldQuestionDialog`
    /// on the detail column so the sheet appears over the current main
    /// content regardless of which surface is foregrounded.
    @State private var holdQuestionSheetVisible = false
    /// Presentation state for the "Add a Sōan Card…" sheet (⌘⇧D or the
    /// matching Shuttle command). Same dispatch pattern as the hold-
    /// question sheet — observer on the detail column, notification
    /// broadcast from LoomApp / ShuttleView.
    @State private var addSoanCardSheetVisible = false
    /// Presentation state for the "Connect Sōan Cards…" sheet (⌘⇧L or
    /// the matching Shuttle command). Pairs with `AddSoanCardSheet` —
    /// add mints cards, connect mints the edges that relate them.
    @State private var connectSoanCardsSheetVisible = false
    // Bumped when the user re-picks the content folder in the first-run
    // wizard or Settings → Data. Used as a `.id()` on LoomWebView so the
    // NSViewRepresentable rebuilds with the freshly-activated host root
    // without requiring an app relaunch.
    @State private var webviewEpoch: Int = 0
    /// Drives the app-wide auto theme. Auto means Loom's day/night
    /// rhythm, not the current macOS appearance: day is paper, night is
    /// night, everywhere.
    @State private var themeClock: Date = Date()

    /// Source-file viewer state. When non-nil, the detail column shows
    /// a native `SourceFileView` (PDFKit / QuickLook) instead of the
    /// webview. Set by `.loomOpenSourceFile` notification (sidebar PDF
    /// click). Cleared when user clicks the back chevron in the viewer.
    @State private var activeSourceFileURL: URL? = nil

    /// Folder-home viewer state. When non-nil, the detail column shows
    /// a native `LoomFolderHomeView` (Loom.md + file listing) instead of
    /// the webview. Set by `.loomShowFolderHome` notification when the
    /// user clicks a root or sub-folder name in the sidebar. Mutually
    /// exclusive with `activeSourceFileURL`.
    @State private var activeFolderHomeURL: URL? = nil

    /// True when the user clicked sidebar's "Sources" entry — main
    /// pane shows `LoomLibraryView` (a list of all roots/pages).
    /// Mutually exclusive with source-file / folder-home overlays.
    @State private var showLibrary: Bool = false

    /// AI bar state. Open/closed, conversation history, current draft,
    /// in-flight flag. History persists across opens within the session
    /// — collapsing the bar keeps the conversation alive so re-opening
    /// continues the thread.
    @State private var aiBarOpen: Bool = false
    @State private var aiMessages: [LoomAIMessage] = []
    @State private var aiDraft: String = ""
    @State private var aiThinking: Bool = false

    // Native-sidebar visibility. M1 "source-sacred" default — sidebar
    // starts hidden so the doc fills the room on launch, matching the
    // reference design. Users reveal with the standard ⌃⌘S toggle, and
    // the choice persists via @AppStorage. Existing users who already
    // toggled have their preference stored and keep it.
    @AppStorage("loom.sidebar.visibility") private var sidebarVisibilityRaw: String = "detailOnly"
    @State private var columnVisibility: NavigationSplitViewVisibility = .detailOnly

    /// Single-slot main content. Sidebar clicks + ⌘⇧R/⌘⇧I/⌘⇧X switch
    /// this, which REPLACES the webview in the detail column rather
    /// than adding a right-side inspector panel. Arc / Xcode pattern:
    /// one content area, sidebar drives what's in it. Back to webview
    /// happens naturally when the learner clicks a doc in the sidebar
    /// (sets surface = .web + loads URL in one go).
    enum MainSurface: String, Equatable {
        case web
        case rehearsal
        case examiner
        case ingestion
        case reconstructions
    }
    @State private var activeSurface: MainSurface = .web

    /// Force the web-rendered Sidebar.tsx permanently hidden — the native
    /// sidebar is now the only sidebar. Runs on every `.onAppear` and on
    /// `.loomContentRootChanged` so newly-loaded webview instances see
    /// the hidden state before first paint.
    private static let webSidebarDefaultsKey = "wiki:sidebar:mode"
    private func forceHideWebSidebar() {
        UserDefaults.standard.set("hidden", forKey: Self.webSidebarDefaultsKey)
        NotificationCenter.default.post(
            name: .loomSetWebSidebarMode,
            object: nil,
            userInfo: ["mode": "hidden"]
        )
    }

    private func refreshFirstRunSheetVisibility() {
        let shouldPrompt = AIProviderKind.firstRunShouldPrompt
        if firstRunSheetVisible != shouldPrompt {
            firstRunSheetVisible = shouldPrompt
        }
    }

    private var firstRunSheetBinding: Binding<Bool> {
        Binding(
            get: { firstRunSheetVisible && AIProviderKind.firstRunShouldPrompt },
            set: { firstRunSheetVisible = $0 }
        )
    }

    /// Map legacy inspector-tab string names to the new `MainSurface`
    /// values. Lets old menu/notification callers still drive the
    /// switcher without re-plumbing every post site.
    static func surface(from name: String) -> MainSurface? {
        switch name {
        case "rehearsal":       return .rehearsal
        case "examiner":        return .examiner
        case "ingestion":       return .ingestion
        case "reconstructions": return .reconstructions
        case "web":             return .web
        default:                return nil
        }
    }

    /// Chrome background color — single source of truth, follows the
    /// resolved app theme (system or manual override). NO route-level
    /// overrides. Per user 2026-04-25: "白天的时候,所有页面都是浅色主题,
    /// 晚上都是深色主题。不搞特殊。" Day = paper everywhere, night = night
    /// everywhere. The previous per-route forcedNightChromePaths machinery
    /// (which flipped chrome on /weaves, /sources, /knowledge, etc.) was
    /// the root cause of sidebar flicker AND first-click eating on
    /// Weaves/Reference (the colorScheme env churn invalidated mid-press
    /// Buttons). Killed.
    private var chromeBackground: Color {
        usesDarkChrome ? LoomTokens.night : LoomTokens.paper
    }

    private var usesDarkChrome: Bool {
        sidebarColorScheme == .dark
    }

    private var chromeColorScheme: ColorScheme {
        sidebarColorScheme
    }

    private var sidebarColorScheme: ColorScheme {
        SidebarThemeResolution.resolvedColorScheme(
            theme: theme,
            systemIsDark: NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua,
            now: themeClock
        )
    }

    private var webThemeMode: String {
        chromeColorScheme == .dark ? "dark" : "light"
    }


    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            KnowledgeSidebarView(webState: webState)
                // Tightened from 200/240/360 → 180/208/300 on 2026-04-23
                // after user flagged the sidebar as visually wide. 208 is
                // the Finder / System Settings native default; prose
                // reads as the window's center of gravity instead of
                // sharing it with the nav column.
                .navigationSplitViewColumnWidth(min: 180, ideal: 208, max: 300)
                // Scoped colorScheme — pinned to the SYSTEM-following
                // sidebar scheme, NOT the route-aware chromeColorScheme.
                //
                // Why pinned (2026-04-25): when this flipped on every
                // committed nav into /weaves, SwiftUI invalidated the
                // entire sidebar subtree at commit time. A user's first
                // click on the Weaves link landed on a Button that was
                // mid-rerender; the click was eaten and a second click
                // was required to actually navigate. Decoupling the
                // sidebar's colorScheme from chrome keeps the sidebar
                // tree stable through navigation; the chrome (toolbar +
                // window background) still flips via the toolbar
                // modifiers below.
                .environment(\.colorScheme, sidebarColorScheme)
        } detail: {
            surfaceContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .toolbar {
                    // Populate the .unifiedCompact titlebar with the
                    // two pieces of chrome a mature Mac app expects:
                    // navigate-back and navigate-forward. The bindings
                    // mirror ⌘[ / ⌘] in the View menu. Without these,
                    // the titlebar strip read as dead space — just
                    // traffic lights and a blank band — which the user
                    // flagged as unprofessional on 2026-04-22 night.
                    ToolbarItemGroup(placement: .navigation) {
                        Button {
                            NotificationCenter.default.post(name: .loomGoBack, object: nil)
                        } label: {
                            Image(systemName: "chevron.backward")
                        }
                        .help("Back · ⌘[")
                        Button {
                            NotificationCenter.default.post(name: .loomGoForward, object: nil)
                        } label: {
                            Image(systemName: "chevron.forward")
                        }
                        .help("Forward · ⌘]")
                    }
                    // Title rendered as a SwiftUI ToolbarItem so it
                    // inherits `.toolbarColorScheme` — candle on night
                    // chrome, ink on paper. NSWindow's own title
                    // (which would otherwise render here) is hidden
                    // via WindowConfigurator because macOS 26 doesn't
                    // repaint that text when appearance flips.
                    ToolbarItem(placement: .principal) {
                        Text(windowTitle)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.primary)
                    }
                }
        }
        .onAppear {
            columnVisibility = sidebarVisibilityRaw == "detailOnly" ? .detailOnly : .doubleColumn
            // Native is the only sidebar now — kill the web one
            // unconditionally so a bad prior value doesn't leave both
            // rendering at once.
            forceHideWebSidebar()
        }
        .onChange(of: columnVisibility) { _, new in
            sidebarVisibilityRaw = (new == .detailOnly) ? "detailOnly" : "doubleColumn"
            // Mirror the native-sidebar column state into the web view
            // so the two don't render simultaneously. Native visible →
            // web sidebar hidden. Native hidden → restore "pinned" so
            // the legacy web Sidebar.tsx (used on routes that still
            // render it) can re-show if the user prefers that path.
            let mode = (new == .detailOnly) ? "pinned" : "hidden"
            UserDefaults.standard.set(mode, forKey: Self.webSidebarDefaultsKey)
            NotificationCenter.default.post(
                name: .loomSetWebSidebarMode,
                object: nil,
                userInfo: ["mode": mode]
            )
        }
        .onReceive(Timer.publish(every: 300, on: .main, in: .common).autoconnect()) { now in
            themeClock = now
        }
        // Dynamic chrome tint — paper on most surfaces, night on
        // Weaves / Constellation / Branching / Palimpsest / Evening.
        // Reacts to `webState.currentURL` so switching pages re-tints
        // the titlebar + toolbar strip live.
        .loomWindowBackground(chromeBackground)
        .toolbarBackground(chromeBackground, for: .windowToolbar)
        .toolbarBackground(.visible, for: .windowToolbar)
        // Flip the toolbar's foreground scheme to match the chrome
        // brightness so the sidebar toggle, ⟨ / ⟩ chevrons, and the
        // "Loom" breadcrumb render in the readable contrast — ink on
        // paper (light), candle on night (dark). Scoped to just the
        // toolbar region; the sidebar + rest of the SwiftUI tree
        // keeps the system color scheme so paper surfaces don't
        // accidentally stay dark when leaving Weaves (the
        // `.preferredColorScheme(.dark/nil)` experiment was sticky
        // across transitions on macOS 26 — user observed "everything
        // went dark" after visiting Weaves once).
        .toolbarColorScheme(usesDarkChrome ? .dark : .light, for: .windowToolbar)
    }

    /// Switch over the active surface. Webview stays mounted (hidden
    /// behind the Action surfaces) so navigating back to web keeps its
    /// scroll position + history. Native views re-render per switch.
    @ViewBuilder
    private var surfaceContent: some View {
        ZStack {
            // Webview is always in the tree; `opacity` hides it so its
            // WKWebView process doesn't get torn down every switch.
            detailColumn
                .opacity(activeSurface == .web ? 1 : 0)
                .allowsHitTesting(activeSurface == .web)
            Group {
                switch activeSurface {
                case .web:
                    EmptyView()
                case .rehearsal:
                    RehearsalView()
                case .examiner:
                    ExaminerView()
                case .ingestion:
                    IngestionView()
                case .reconstructions:
                    ReconstructionsView()
                }
            }
            .transition(.opacity)
        }
        // Shutter pattern (memory: feedback_shutter_pattern.md) —
        // surface crossfades on sidebar Action clicks instead of
        // snap-swapping. Duration matches the StartingView fade
        // (0.35s easeOut) so the two interactions feel coherent.
        .animation(.easeOut(duration: 0.35), value: activeSurface)
    }

    /// Handle a click on a `loom://anchor?...` link inside a rendered
    /// note. Resolves the doc by name within the current root, opens
    /// the source viewer, and asks the PDFViewHolder to scroll to the
    /// saved page+rect once the view has mounted.
    private func handleAnchorJump(_ note: Notification) {
        guard let anchorURL = note.userInfo?["url"] as? URL,
              let components = URLComponents(url: anchorURL, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else { return }
        let docName = queryItems.first(where: { $0.name == "doc" })?.value ?? ""
        let pageStr = queryItems.first(where: { $0.name == "page" })?.value ?? "0"
        let rectStr = queryItems.first(where: { $0.name == "rect" })?.value ?? ""
        guard let rootURL = currentAnchorRootURL() else { return }
        let fm = FileManager.default
        guard let enumerator = fm.enumerator(at: rootURL, includingPropertiesForKeys: nil) else { return }
        var match: URL? = nil
        for case let url as URL in enumerator {
            if url.lastPathComponent == docName { match = url; break }
        }
        guard let docURL = match else { return }
        guard let rootID = ContentRootStore.allActiveURLs.first(where: { $0.value == rootURL })?.key else { return }
        let rootPath = rootURL.standardizedFileURL.path
        let docPath = docURL.standardizedFileURL.path
        guard docPath.hasPrefix(rootPath + "/") else { return }
        let relative = String(docPath.dropFirst(rootPath.count + 1))
        let encoded = relative
            .split(separator: "/")
            .map { $0.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String($0) }
            .joined(separator: "/")
        guard let target = URL(string: "loom://content/\(rootID.uuidString.lowercased())/\(encoded)") else { return }
        activeSourceFileURL = target
        activeFolderHomeURL = nil
        let pageIndex = Int(pageStr) ?? 0
        let rectFields = rectStr.split(separator: ",").compactMap { Double($0) }
        guard rectFields.count == 4 else { return }
        let rect = CGRect(x: rectFields[0], y: rectFields[1], width: rectFields[2], height: rectFields[3])
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            NotificationCenter.default.post(
                name: .loomApplyPDFAnchor,
                object: nil,
                userInfo: ["page": pageIndex, "rect": NSValue(rect: rect)]
            )
        }
    }

    /// Returns true when a `loom://content/<uuid>/...` URL still points
    /// at a root that's currently active. Lets us preserve folder-home
    /// / source-file overlays across additive content-root changes
    /// (add a sibling root) while still clearing them on destructive
    /// changes (remove the root that the overlay referenced).
    static func urlPointsToActiveRoot(_ url: URL) -> Bool {
        guard url.scheme == LoomURLSchemeHandler.scheme, url.host == "content" else { return false }
        let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let firstSeg = path.split(separator: "/").first else { return false }
        guard let id = UUID(uuidString: String(firstSeg)) else { return false }
        return ContentRootStore.allActiveURLs[id] != nil
    }

    private func currentAnchorRootURL() -> URL? {
        if let folderHome = activeFolderHomeURL,
           let info = Self.resolveFolderHomeURL(folderHome),
           let id = info.rootID {
            return ContentRootStore.activeURL(for: id)
        }
        return ContentRootStore.allActiveURLs.values.first
    }

    /// Build a snapshot of the user's current location for the AI bar's
    /// breadcrumb display and (Phase B4) ancestor-Loom.md context
    /// injection. Source files override folder home, which overrides
    /// the webview's URL.
    private var currentAIContext: LoomAIContext {
        if let url = activeSourceFileURL {
            return resolveContext(for: url)
        }
        if let url = activeFolderHomeURL {
            return resolveContext(for: url)
        }
        return LoomAIContext(breadcrumb: "Loom", contentURL: nil, resolvedFileURL: nil)
    }

    private func resolveContext(for loomURL: URL) -> LoomAIContext {
        let hostRoots = LoomRuntimePaths.resolveHostRoots()
        let resolved = LoomURLSchemeHandler.resolve(loomURL, hostRoots: hostRoots, contentRoots: ContentRootStore.allActiveURLs)
        // Build breadcrumb from path segments, plus root display name when
        // the URL identifies a multi-root entry.
        let path = loomURL.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let segments = path.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
        var crumbs: [String] = []
        if let firstSeg = segments.first, let rootID = UUID(uuidString: firstSeg),
           let storedRoot = ContentRootStore.loadAll().first(where: { $0.id == rootID }) {
            crumbs.append(storedRoot.displayName)
            for seg in segments.dropFirst() {
                crumbs.append(seg.removingPercentEncoding ?? seg)
            }
        } else {
            for seg in segments {
                crumbs.append(seg.removingPercentEncoding ?? seg)
            }
        }
        let breadcrumb = crumbs.isEmpty ? "Loom" : crumbs.joined(separator: " › ")
        return LoomAIContext(breadcrumb: breadcrumb, contentURL: loomURL, resolvedFileURL: resolved)
    }

    /// Resolve the Loom.md target file for the current context. Folder
    /// home → that folder's Loom.md (mirrored under the file store).
    /// Source file → that file's parent folder's Loom.md (mirrored).
    /// Falls back to the first active root's Loom.md (file store).
    ///
    /// Source Fidelity rule (2026-04-27): never returns a URL inside
    /// the user's external folder. All AI-generated Loom.md writes go
    /// through `LoomFileStore`, keyed by `<rootID>/sub/<rel-path>`.
    /// The user's picked folder stays untouched.
    private func loomMDTarget(for context: LoomAIContext) -> URL? {
        if let resolved = context.resolvedFileURL {
            let folder = resolved.hasDirectoryPath ? resolved : resolved.deletingLastPathComponent()
            if let mapped = Self.fileStoreMDPath(forExternalFolder: folder) {
                return mapped
            }
        }
        if let firstID = ContentRootStore.allActiveURLs.keys.first {
            return LoomFileStore.loomMDURL(for: firstID)
        }
        return nil
    }

    /// Map an external folder URL back to its sandbox-stored Loom.md
    /// equivalent. Walks active roots to find the one containing the
    /// given folder, computes the relative sub-path, and routes through
    /// `LoomFileStore.loomMDURL(for:subPath:)`. Returns nil when no
    /// registered root contains the folder.
    private static func fileStoreMDPath(forExternalFolder folder: URL) -> URL? {
        let folderPath = folder.standardizedFileURL.path
        for (rootID, rootURL) in ContentRootStore.allActiveURLs {
            let rootPath = rootURL.standardizedFileURL.path
            if folderPath == rootPath {
                return LoomFileStore.loomMDURL(for: rootID)
            }
            if folderPath.hasPrefix(rootPath + "/") {
                let rel = String(folderPath.dropFirst(rootPath.count + 1))
                return LoomFileStore.loomMDURL(for: rootID, subPath: rel)
            }
        }
        return nil
    }

    /// Append an AI message to the target Loom.md's `## Notes` section
    /// as a timestamped entry. Creates the file + heading as needed.
    private func saveAIMessageAsNote(_ msg: LoomAIMessage) {
        let context = currentAIContext
        guard let target = loomMDTarget(for: context) else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let timestamp = formatter.string(from: Date())
        let entry = "### AI — \(timestamp)\n\(msg.content)\n"
        do {
            let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
            let updated = Self.appendNote(entry: entry, to: existing)
            try updated.write(to: target, atomically: true, encoding: .utf8)
        } catch {
            aiMessages.append(LoomAIMessage(role: .ai, content: "[error] couldn't save note: \(error.localizedDescription)"))
        }
    }

    /// Replace the description portion (everything before `## Notes`)
    /// of the target Loom.md with the AI message content. Preserves
    /// existing notes. Creates the file when missing.
    private func saveAIMessageAsDescription(_ msg: LoomAIMessage) {
        let context = currentAIContext
        guard let target = loomMDTarget(for: context) else { return }
        do {
            let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
            let split = LoomFolderHomeView.splitDescriptionAndNotes(existing)
            let combined = LoomFolderHomeView.rebuildMarkdown(description: msg.content, notes: split.notes)
            try combined.write(to: target, atomically: true, encoding: .utf8)
        } catch {
            aiMessages.append(LoomAIMessage(role: .ai, content: "[error] couldn't save description: \(error.localizedDescription)"))
        }
    }

    private static func appendNote(entry: String, to source: String) -> String {
        let needsLeadingNewline = !source.isEmpty && !source.hasSuffix("\n")
        var working = source + (needsLeadingNewline ? "\n" : "")
        if !source.contains("## Notes") {
            if !working.isEmpty && !working.hasSuffix("\n\n") {
                working += working.hasSuffix("\n") ? "\n" : "\n\n"
            }
            working += "## Notes\n\n"
        } else if !working.hasSuffix("\n\n") {
            working += working.hasSuffix("\n") ? "\n" : "\n\n"
        }
        working += entry
        return working
    }

    /// Send the current draft to the active AI provider with system
    /// prompt = ancestor Loom.md context (Phase B4). The response is
    /// appended to the chat; user explicitly chooses to save it via
    /// Save-as-note / Save-as-description buttons (Phase B3 — user is
    /// the classifier, no intent guessing).
    private func dispatchAIQuery() {
        let trimmed = aiDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !aiThinking else { return }
        aiMessages.append(LoomAIMessage(role: .user, content: trimmed))
        aiDraft = ""
        aiThinking = true
        let context = currentAIContext
        let prompt = trimmed
        Task {
            do {
                let systemPrompt = Self.buildSystemPrompt(context: context)
                let response = try await LoomAI.send(prompt: prompt, systemPrompt: systemPrompt)
                await MainActor.run {
                    aiMessages.append(LoomAIMessage(role: .ai, content: response))
                    aiThinking = false
                }
            } catch {
                await MainActor.run {
                    aiMessages.append(LoomAIMessage(role: .ai, content: "[error] \(error.localizedDescription)"))
                    aiThinking = false
                }
            }
        }
    }

    /// Compose the system prompt by walking up the current location's
    /// path and concatenating each ancestor folder's Loom.md description
    /// (the part before `## Notes`). Phase B4 deepens this; Phase B1+B2
    /// uses the most local description plus the breadcrumb.
    private static func buildSystemPrompt(context: LoomAIContext) -> String {
        var lines: [String] = []
        lines.append("You are an AI study assistant inside Loom, a learning tool.")
        lines.append("The user is working in: \(context.breadcrumb).")
        if let descriptions = ancestorDescriptions(for: context), !descriptions.isEmpty {
            lines.append("")
            lines.append("Context from the user's own folder descriptions:")
            for entry in descriptions {
                lines.append("• [\(entry.label)] \(entry.text)")
            }
        }
        lines.append("")
        lines.append("Treat the user's input as the primary task. When asked to write or restructure content, output markdown only, no commentary.")
        return lines.joined(separator: "\n")
    }

    private struct AncestorDescription {
        let label: String
        let text: String
    }

    private static func ancestorDescriptions(for context: LoomAIContext) -> [AncestorDescription]? {
        guard let resolved = context.resolvedFileURL else { return nil }
        // Walk up from `resolved` to its containing root.
        let allRoots = ContentRootStore.allActiveURLs
        guard let containingRoot = allRoots.first(where: { _, rootURL in
            let rp = rootURL.standardizedFileURL.path
            let fp = resolved.standardizedFileURL.path
            return fp == rp || fp.hasPrefix(rp + "/")
        }) else { return nil }
        let rootURL = containingRoot.value
        var collected: [AncestorDescription] = []
        // Build the ancestor chain from root → ... → containing folder
        var ancestors: [URL] = [rootURL]
        let resolvedDir = resolved.hasDirectoryPath ? resolved : resolved.deletingLastPathComponent()
        let rootPath = rootURL.standardizedFileURL.path
        let resolvedPath = resolvedDir.standardizedFileURL.path
        if resolvedPath.hasPrefix(rootPath + "/") {
            let relative = String(resolvedPath.dropFirst(rootPath.count + 1))
            var cumulative = rootURL
            for segment in relative.split(separator: "/") {
                cumulative = cumulative.appendingPathComponent(String(segment))
                ancestors.append(cumulative)
            }
        }
        let storedRoots = ContentRootStore.loadAll()
        let rootID = containingRoot.key
        for url in ancestors {
            // Read order (Source Fidelity, 2026-04-27): prefer the
            // sandbox-stored Loom.md (where new writes land); fall back
            // to a legacy external Loom.md for ancestors that still
            // hold pre-refactor user content. Never WRITE either side
            // here — this is a read-only AI-context walk.
            let urlPath = url.standardizedFileURL.path
            let storeURL: URL = {
                if urlPath == rootPath {
                    return LoomFileStore.loomMDURL(for: rootID)
                }
                let rel = urlPath.hasPrefix(rootPath + "/")
                    ? String(urlPath.dropFirst(rootPath.count + 1))
                    : ""
                return LoomFileStore.loomMDURL(for: rootID, subPath: rel)
            }()
            let externalURL = url.appendingPathComponent("Loom.md")
            let raw: String? = (try? String(contentsOf: storeURL, encoding: .utf8))
                ?? (try? String(contentsOf: externalURL, encoding: .utf8))
            guard let raw = raw else { continue }
            let descPart = LoomFolderHomeView.splitDescriptionAndNotes(raw).description
            guard !descPart.isEmpty else { continue }
            let label: String
            if url.standardizedFileURL.path == rootURL.standardizedFileURL.path,
               let storedRoot = storedRoots.first(where: { $0.id == containingRoot.key }) {
                label = storedRoot.displayName
            } else {
                label = url.lastPathComponent
            }
            collected.append(AncestorDescription(label: label, text: descPart))
        }
        return collected
    }

    /// Handler for files dropped onto the main window. Stashes the URLs
    /// in `IngestionContext` and pokes the ingestion sheet to consume.
    /// Extracted from the body to keep the SwiftUI compiler happy.
    private func handleDroppedFileURLs(_ providers: [NSItemProvider]) -> Bool {
        var urls: [URL] = []
        let group = DispatchGroup()
        for provider in providers {
            group.enter()
            _ = provider.loadObject(ofClass: URL.self) { url, _ in
                if let url = url { urls.append(url) }
                group.leave()
            }
        }
        group.notify(queue: .main) {
            guard !urls.isEmpty else { return }
            IngestionContext.shared.pendingFileURLs = urls
            NotificationCenter.default.post(name: .loomIngestFileDropped, object: nil)
        }
        return true
    }

    /// One of three mutually-exclusive native overlays on top of the
    /// webview: source file viewer, library overview, or folder home.
    /// Extracted from the detail-column body so the type-checker has a
    /// fighting chance against the rest of the long ContentView body.
    @ViewBuilder
    private var mainPaneOverlay: some View {
        if let activeURL = activeSourceFileURL {
            SourceFileView(loomURL: activeURL) {
                activeSourceFileURL = nil
            }
            .ignoresSafeArea()
            .transition(.opacity)
        } else if showLibrary {
            LoomLibraryView()
                .ignoresSafeArea()
                .transition(.opacity)
        } else if let folderURL = activeFolderHomeURL {
            folderHomeOverlay(for: folderURL)
                .ignoresSafeArea()
                .transition(.opacity)
        }
    }

    /// Resolve a `loom://content/<root-id?>/<path?>` URL to a
    /// (folderURL, displayName, rootID) triple for the folder-home
    /// overlay. Falls back gracefully when the URL is malformed or the
    /// referenced root has been removed.
    @ViewBuilder
    private func folderHomeOverlay(for loomURL: URL) -> some View {
        let resolved = Self.resolveFolderHomeURL(loomURL)
        if let resolved {
            LoomFolderHomeView(
                rootID: resolved.rootID,
                externalFolderURL: resolved.externalFolder,
                displayName: resolved.displayName
            )
        } else {
            VStack(spacing: 6) {
                Text("Couldn't open this folder.")
                    .font(.system(size: 13))
                Text(loomURL.absoluteString)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(NSColor.windowBackgroundColor))
        }
    }

    private struct ResolvedFolderHome {
        /// Sub-folder under the external root if the URL drilled into
        /// one, else the external root itself, else nil for pure pages.
        let externalFolder: URL?
        let displayName: String?
        let rootID: UUID?
    }

    private static func resolveFolderHomeURL(_ loomURL: URL) -> ResolvedFolderHome? {
        guard loomURL.scheme == LoomURLSchemeHandler.scheme,
              loomURL.host == "content" else { return nil }
        let relative = loomURL.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let segments = relative.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
        // Multi-root: <uuid>/<rest>. uuid identifies the page; rest
        // (when present) drills into the page's external folder.
        if let firstSeg = segments.first, let rootID = UUID(uuidString: firstSeg) {
            let rest = segments.dropFirst().joined(separator: "/")
            let storedRoot = ContentRootStore.loadAll().first { $0.id == rootID }
            // External folder may not exist (pure `+ Page` root) — that's fine.
            let externalRoot = ContentRootStore.activeURL(for: rootID)
            let externalSubfolder: URL? = {
                guard let externalRoot = externalRoot else { return nil }
                if rest.isEmpty { return externalRoot }
                return externalRoot.appendingPathComponent(rest).standardizedFileURL
            }()
            let displayName: String? = {
                if rest.isEmpty { return storedRoot?.displayName }
                return externalSubfolder?.lastPathComponent
            }()
            return ResolvedFolderHome(
                externalFolder: externalSubfolder,
                displayName: displayName,
                rootID: rootID
            )
        }
        // Legacy single-root fallback (URL without UUID prefix): use
        // first active root verbatim. Rare path; modern code always
        // emits UUID-prefixed URLs.
        guard let firstRootURL = ContentRootStore.allActiveURLs.values.first else { return nil }
        let folder = relative.isEmpty
            ? firstRootURL
            : firstRootURL.appendingPathComponent(relative).standardizedFileURL
        return ResolvedFolderHome(
            externalFolder: folder,
            displayName: folder.lastPathComponent,
            rootID: nil
        )
    }

    @ViewBuilder
    private var detailColumn: some View {
        ZStack {
            switch server.status {
            case .ready:
                ZStack {
                    LoomWebView(url: server.webviewURL, debugState: webState, forcedTheme: webThemeMode)
                        .id(webviewEpoch)
                        .ignoresSafeArea()
                    // Source-file viewer overlays the webview when the user
                    // clicks a PDF (or other source file) in the sidebar.
                    // Sits on top so we never re-route the webview itself —
                    // the webview keeps whatever route it was on (Home /
                    // Sources / Desk) underneath.
                    mainPaneOverlay

                    // AI bar trailing overlay — bronze strip when closed,
                    // 380pt panel when open. Sized to its content and
                    // pinned to the trailing edge via .frame alignment so
                    // the rest of the detail column stays click-through
                    // (SourceFileView's PDFKit, folder-home buttons,
                    // webview navigation are all underneath and must
                    // remain hit-testable).
                    LoomAIBar(
                        isOpen: $aiBarOpen,
                        context: currentAIContext,
                        messages: $aiMessages,
                        draft: $aiDraft,
                        isThinking: $aiThinking,
                        onSend: dispatchAIQuery,
                        onSaveAsNote: saveAIMessageAsNote,
                        onSaveAsDescription: saveAIMessageAsDescription
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
                    .allowsHitTesting(true)
                    // Keep the warp-shimmer on top until the webview reports
                    // its first `didFinish`. Without this mask the webview
                    // flashes white (Chromium default bg) for ~200–400ms
                    // before CSS variables from globals.css paint — jarring
                    // against the dark launch shimmer.
                    if !webState.didFirstLoad {
                        StartingView()
                            .ignoresSafeArea()
                            .transition(.opacity)
                    }
                }
                .animation(.easeOut(duration: 0.35), value: webState.didFirstLoad)
                .transition(.opacity)
            case .starting, .idle:
                StartingView()
            case .failed(let msg):
                FailedView(
                    message: msg,
                    targetURL: server.webviewURL,
                    onRetry: { server.start() }
                )
            }

            #if DEBUG
            if showDebugHUD {
                VStack {
                    HStack {
                        Spacer()
                        DevHUD(status: server.status, url: server.webviewURL, webState: webState, isVisible: $showDebugHUD)
                    }
                    Spacer()
                }
                .padding(.top, 14)
                .padding(.trailing, 16)
            }
            #endif
        }
        .animation(.easeInOut(duration: 0.3), value: server.status)
        .background(WindowConfigurator(title: windowTitle, isNight: usesDarkChrome))
        .onAppear {
            showDebugHUD = false
            refreshFirstRunSheetVisibility()
        }
        .onReceive(NotificationCenter.default.publisher(for: UserDefaults.didChangeNotification)) { _ in
            refreshFirstRunSheetVisibility()
        }
        .sheet(isPresented: firstRunSheetBinding) {
            FirstRunProviderSheet(isPresented: $firstRunSheetVisible)
        }
        .sheet(isPresented: $holdQuestionSheetVisible) {
            HoldQuestionSheet(isPresented: $holdQuestionSheetVisible)
        }
        .sheet(isPresented: $addSoanCardSheetVisible) {
            AddSoanCardSheet(isPresented: $addSoanCardSheetVisible)
        }
        .sheet(isPresented: $connectSoanCardsSheetVisible) {
            ConnectSoanCardsSheet(isPresented: $connectSoanCardsSheetVisible)
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowHoldQuestionDialog)) { _ in
            holdQuestionSheetVisible = true
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowAddSoanCardDialog)) { _ in
            addSoanCardSheetVisible = true
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowConnectSoanCardsDialog)) { _ in
            connectSoanCardsSheetVisible = true
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomContentRootChanged)) { _ in
            webState.didFirstLoad = false
            webviewEpoch &+= 1
            forceHideWebSidebar()
            activeSourceFileURL = nil
            activeFolderHomeURL = nil
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomContentRootsChanged)) { _ in
            // Multi-root list changed (add / remove / rename). Force
            // webview rebuild so its scheme handler picks up the new
            // contentRoots map. Clear overlays ONLY when the active
            // root they referenced is gone (removed). Adding a sibling
            // root shouldn't drop the user out of their current page.
            webState.didFirstLoad = false
            webviewEpoch &+= 1
            forceHideWebSidebar()
            if let url = activeSourceFileURL, !Self.urlPointsToActiveRoot(url) {
                activeSourceFileURL = nil
            }
            if let url = activeFolderHomeURL, !Self.urlPointsToActiveRoot(url) {
                activeFolderHomeURL = nil
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenSourceFile)) { note in
            if let url = note.userInfo?["url"] as? URL {
                activeSourceFileURL = url
                activeFolderHomeURL = nil
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowFolderHome)) { note in
            if let url = note.userInfo?["url"] as? URL {
                activeFolderHomeURL = url
                activeSourceFileURL = nil
                showLibrary = false
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowLibrary)) { _ in
            showLibrary = true
            activeSourceFileURL = nil
            activeFolderHomeURL = nil
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomJumpToPDFAnchor)) { note in
            handleAnchorJump(note)
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShowInspectorTab)) { note in
            // Legacy "inspector tab" notification — treat the tab name
            // as the surface to switch to. Single-slot model: replace
            // content instead of opening a side panel.
            if let raw = note.userInfo?["tab"] as? String,
               let surface = Self.surface(from: raw) {
                activeSurface = surface
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenRehearsalWindow)) { _ in
            activeSurface = .rehearsal
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenSettings)) { _ in
            openSettings()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShuttleNavigate)) { note in
            // Any sidebar / Shuttle doc navigation returns to the
            // webview surface automatically. CRITICAL: also clear any
            // PDF / folder-home overlay — otherwise the overlay keeps
            // painting on top of the freshly-navigated webview, and
            // every subsequent click lands on the phantom layer.
            // (User's "click has no effect" symptom from PDF flow.)
            // EXCEPTION: if the navigation target is a content URL
            // (loom://content/...) the overlay handlers will set the
            // appropriate URL — let them; just reset surface to .web.
            activeSurface = .web
            let path = (note.userInfo?["path"] as? String) ?? ""
            if !path.hasPrefix("loom://content/") {
                activeSourceFileURL = nil
                activeFolderHomeURL = nil
            }
        }
        // Drop-anywhere ingestion: files dropped onto the main window
        // stash into IngestionContext and open the native "Add files"
        // window, which auto-consumes on appear. The runner reads
        // Markdown, PDF, DOCX, slides, Pages, and images.
        .onDrop(of: [.fileURL], isTargeted: nil, perform: handleDroppedFileURLs)
        // No `.toolbar { }` — every former toolbar action has a keyboard
        // shortcut (⌘[ / ⌘] / ⌘R / ⌘K) or is reachable via sidebar.
        // Mac-native chrome is the window title bar only; Arc / Xcode /
        // Mail pattern. Former duplication + visual clutter gone.
    }
}

/// Minimal literary sheet for minting a `LoomPursuit`. Triggered via
/// ⌘⇧P / Edit-menu "Hold a Question…" / Shuttle. Three fields — the
/// question itself, its attentional weight, and a pair of Cancel/Hold
/// buttons. The saved pursuit lands in SwiftData and wakes
/// `PursuitsClient`, which re-fetches the native pursuit projection on
/// the next render pass without a reload.
struct HoldQuestionSheet: View {
    @Binding var isPresented: Bool
    @State private var question: String = ""
    @State private var weight: String = "secondary"

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Add Question")
                .font(.custom("Cormorant Garamond", size: 22).italic())

            TextField("What question is your mind holding?", text: $question, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
                .font(.custom("EB Garamond", size: 14))

            Picker("Weight", selection: $weight) {
                Text("Primary (close to the body)").tag("primary")
                Text("Secondary (in middle distance)").tag("secondary")
                Text("Tertiary (at the horizon)").tag("tertiary")
            }

            HStack {
                Spacer()
                Button("Cancel") { isPresented = false }
                Button("Hold") {
                    let trimmed = question.trimmingCharacters(in: .whitespaces)
                    _ = try? LoomPursuitWriter.createPursuit(question: trimmed, weight: weight)
                    isPresented = false
                }
                .disabled(question.trimmingCharacters(in: .whitespaces).isEmpty)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 480)
        .background(LoomTokens.paper)
    }
}

/// Sheet for adding a card to the Sōan thinking-draft table. Opened via
/// ⌘⇧D / Edit-menu "Add a Sōan Card…" / Shuttle. Three fields — kind
/// (thesis / instance / counter / question / fog / weft / sketch), body,
/// and an optional "Book · section" source. On save, mints a
/// `LoomSoanCard` at a random position inside a 600×400 spread so cards
/// don't stack when the learner adds a few in a row; the web surface
/// picks up the mirrored row immediately via `.loomSoanChanged`.
struct AddSoanCardSheet: View {
    @Binding var isPresented: Bool
    @State private var kind: String = "thesis"
    // `cardBody` rather than `body` — the latter collides with the
    // SwiftUI `View.body` computed-property requirement on this struct.
    @State private var cardBody: String = ""
    @State private var source: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Add a Draft Card")
                .font(.custom("Cormorant Garamond", size: 22).italic())

            Picker("Kind", selection: $kind) {
                Text("Thesis").tag("thesis")
                Text("Instance").tag("instance")
                Text("Counter").tag("counter")
                Text("Question").tag("question")
                Text("Unclear").tag("fog")
                Text("Connection").tag("weft")
                Text("Sketch").tag("sketch")
            }

            TextField("Body — what is this card holding?", text: $cardBody, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...8)
                .font(.custom("EB Garamond", size: 14))

            TextField("Source (optional) — 'Book · section'", text: $source)
                .textFieldStyle(.roundedBorder)
                .font(.custom("EB Garamond", size: 13))

            HStack {
                Spacer()
                Button("Cancel") { isPresented = false }
                Button("Add") {
                    // Random-ish position inside the initial viewport so
                    // the second card doesn't stack on the first. The
                    // 40pt floor keeps cards off the canvas header; 600×400
                    // matches the typical sheet's first-screen area.
                    let x = 40 + Double.random(in: 0..<600)
                    let y = 40 + Double.random(in: 0..<400)
                    let trimmedBody = cardBody.trimmingCharacters(in: .whitespaces)
                    let trimmedSource = source.trimmingCharacters(in: .whitespaces)
                    _ = try? LoomSoanWriter.createCard(
                        kind: kind,
                        body: trimmedBody,
                        x: x,
                        y: y,
                        source: trimmedSource
                    )
                    isPresented = false
                }
                .disabled(cardBody.trimmingCharacters(in: .whitespaces).isEmpty)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 520)
        .background(LoomTokens.paper)
    }
}

/// Sheet for creating a relation between two existing Sōan cards. Opened
/// via ⌘⇧L / Edit-menu "Connect Sōan Cards…" / Shuttle. Loads the full
/// card list on appear, lets the learner pick a `from` + `to` + relation
/// kind (support = solid bronze, echo = dashed muted), then mints a
/// `LoomSoanEdge` via `LoomSoanWriter.createEdge`. The coordinator
/// picks up `.loomSoanChanged` and wakes SoanClient so it re-fetches the
/// SVG overlay projection without a reload.
struct ConnectSoanCardsSheet: View {
    @Binding var isPresented: Bool
    @State private var fromCardId: String = ""
    @State private var toCardId: String = ""
    @State private var kind: String = "support"
    @State private var cards: [(id: String, label: String)] = []

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Connect Draft Cards")
                .font(.custom("Cormorant Garamond", size: 22).italic())

            if cards.count < 2 {
                Text("Draft needs at least two cards before you can connect them. Add a card with ⌘⇧D first.")
                    .font(.custom("EB Garamond", size: 13))
                    .foregroundStyle(LoomTokens.muted)
            } else {
                Picker("From", selection: $fromCardId) {
                    Text("(choose a card)").tag("")
                    ForEach(cards, id: \.id) { c in
                        Text(c.label).tag(c.id)
                    }
                }

                Picker("To", selection: $toCardId) {
                    Text("(choose a card)").tag("")
                    ForEach(cards, id: \.id) { c in
                        Text(c.label).tag(c.id)
                    }
                }

                Picker("Relation", selection: $kind) {
                    Text("Supports").tag("support")
                    Text("Related").tag("echo")
                }
            }

            HStack {
                Spacer()
                Button("Cancel") { isPresented = false }
                Button("Connect") {
                    _ = try? LoomSoanWriter.createEdge(fromCardId: fromCardId, toCardId: toCardId, kind: kind)
                    isPresented = false
                }
                .disabled(cards.count < 2 || fromCardId.isEmpty || toCardId.isEmpty || fromCardId == toCardId)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 480)
        .background(LoomTokens.paper)
        .onAppear {
            let all = (try? LoomSoanWriter.allCards()) ?? []
            cards = all.map { c in
                let snippet = c.body.prefix(40)
                let label = c.title.isEmpty ? "\(c.kind) · \(snippet)" : "\(c.kind) · \(c.title)"
                return (c.id, label)
            }
        }
    }
}

struct DevHUD: View {
    let status: DevServer.Status
    let url: URL
    @ObservedObject var webState: WebDebugState
    @Binding var isVisible: Bool

    private var statusLabel: String {
        switch status {
        case .ready: return "ready"
        case .starting, .idle: return "connecting"
        case .failed: return "failed"
        }
    }

    private var statusColor: Color {
        switch status {
        case .ready: return .green
        case .starting, .idle: return .orange
        case .failed: return .red
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                Label {
                    Text("\(statusLabel) · \(url.absoluteString)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                } icon: {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 8, height: 8)
                }

                Button("Reload") {
                    NotificationCenter.default.post(name: .loomReload, object: nil)
                }
                .buttonStyle(.borderless)
                .font(.system(size: 11, weight: .medium))

                Button("Browser") {
                    NotificationCenter.default.post(name: .loomOpenInBrowser, object: nil)
                }
                .buttonStyle(.borderless)
                .font(.system(size: 11, weight: .medium))

                Button {
                    isVisible = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }

            if !webState.currentURL.isEmpty || !webState.pageTitle.isEmpty || webState.isLoading || !webState.lastError.isEmpty || !webState.consoleMessage.isEmpty || !webState.recoveryMessage.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    if !webState.currentURL.isEmpty {
                        Text("webview: \(webState.currentURL)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                    }
                    if !webState.pageTitle.isEmpty {
                        Text("title: \(webState.pageTitle)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Text("loading: \(webState.isLoading ? "yes" : "no")")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.secondary)
                    if !webState.lastError.isEmpty {
                        Text("error: \(webState.lastError)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.red)
                            .lineLimit(2)
                    }
                    if !webState.consoleMessage.isEmpty {
                        Text("js: \(webState.consoleMessage)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.orange)
                            .lineLimit(3)
                    }
                    if !webState.recoveryMessage.isEmpty {
                        Text("recovery: \(webState.recoveryMessage)")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.blue)
                            .lineLimit(3)
                    }
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(
            Capsule()
                .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.06), radius: 8, y: 3)
    }
}

/// No text, no spinner, no "loading..." — §1/§21.
struct StartingView: View {
    @State private var phase: CGFloat = 0

    var body: some View {
        VStack(spacing: 16) {
            Canvas { context, size in
                let warps = 8
                let pad: CGFloat = size.width * 0.3
                let gap = (size.width - pad * 2) / CGFloat(warps - 1)
                let cy = size.height / 2

                for i in 0..<warps {
                    let x = pad + CGFloat(i) * gap
                    let t = phase + CGFloat(i) * 0.4
                    let brightness = 0.15 + 0.12 * sin(t)

                    var path = Path()
                    path.move(to: CGPoint(x: x, y: cy - 50))
                    path.addLine(to: CGPoint(x: x, y: cy + 50))

                    context.stroke(
                        path,
                        with: .color(.primary.opacity(brightness)),
                        lineWidth: 0.8
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            withAnimation(.linear(duration: 4).repeatForever(autoreverses: false)) {
                phase = .pi * 2
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        // LoomTokens.paper (dynamic) instead of `.background` (system
        // windowBackgroundColor). Without this the shimmer sat on a
        // slightly cooler system cream/gray than the webview's paper
        // tone, so the crossfade from shimmer → first-paint flashed
        // the seam by ~1 hex step. Matching both sides eliminates it.
        .background(LoomTokens.paper)
    }
}

/// Polished failure screen. Replaces the raw "Could not connect" + monospace
/// error block with warmer copy + actionable buttons; the raw details stay
/// available behind a disclosure so a curious user (or a support session)
/// can still see them.
struct FailedView: View {
    let message: String
    let targetURL: URL
    let onRetry: () -> Void
    @State private var detailsExpanded: Bool = false
    // See KnowledgeSidebarView for why this replaces the old selector.
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        VStack(spacing: 18) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 38, weight: .light))
                .foregroundStyle(LoomTokens.muted)

            VStack(spacing: 6) {
                // Cormorant italic display title — identity chrome, same
                // treatment as Frontispiece / KeyboardHelp / AskAI.
                Text("Loom couldn't load")
                    .font(LoomTokens.display(size: 22, italic: true))
                    .foregroundStyle(LoomTokens.ink)
                Text("Try again, or open Settings to pick your study folder.")
                    .font(LoomTokens.serif(size: 13, italic: true))
                    .foregroundStyle(LoomTokens.ink2)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: 10) {
                Button("Try Again") { onRetry() }
                    .buttonStyle(.borderedProminent)
                    .keyboardShortcut(.defaultAction)
                    .tint(Color.accentColor)
                Button("Open Settings") {
                    openSettings()
                }
                .buttonStyle(.bordered)
                .tint(Color.accentColor)
            }
            .padding(.top, 2)

            DisclosureGroup("Details", isExpanded: $detailsExpanded) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(targetURL.absoluteString)
                        .font(LoomTokens.mono(size: 10))
                        .foregroundStyle(LoomTokens.muted)
                    ScrollView {
                        Text(message)
                            .font(LoomTokens.mono(size: 10))
                            .foregroundStyle(LoomTokens.muted)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 140)
                }
                .padding(.top, 4)
            }
            .font(LoomTokens.serif(size: 11, italic: true))
            .foregroundStyle(LoomTokens.muted)
            .frame(maxWidth: 420)
            .padding(.top, 6)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(LoomTokens.paper)
    }
}

