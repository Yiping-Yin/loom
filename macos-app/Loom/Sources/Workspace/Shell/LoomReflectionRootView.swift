import SwiftUI
import AppKit
import PDFKit
import UniformTypeIdentifiers

private let reflectionSidebarWidth: CGFloat = 248
// The right pane is drag-resizable between the bounds below; 400 pt stays the
// contract default. The width persists via AppStorage under
// "loom.reflection.inspectorWidth" and the top-bar Evidence strip tracks it.
private let reflectionInspectorDefaultWidth: CGFloat = 400
private let reflectionInspectorMinWidth: CGFloat = 320
private let reflectionInspectorMaxWidth: CGFloat = 560
private let reflectionInspectorWidthKey = "loom.reflection.inspectorWidth"

private func clampedInspectorWidth(_ value: Double) -> CGFloat {
    min(max(CGFloat(value), reflectionInspectorMinWidth), reflectionInspectorMaxWidth)
}

// The in-window reader column's width (owner 2026-07-06): draggable + persisted,
// bounded so the note beside it always keeps a usable measure.
private let reflectionReaderDefaultWidth: CGFloat = 560
private let reflectionReaderMinWidth: CGFloat = 380
private let reflectionReaderMaxWidth: CGFloat = 760
private let reflectionReaderWidthKey = "loom.reflection.readerWidth"

private func clampedReaderWidth(_ value: Double) -> CGFloat {
    min(max(CGFloat(value), reflectionReaderMinWidth), reflectionReaderMaxWidth)
}

// The reader column is a FRACTION of the available width (owner 2026-07-06), so
// the read-beside-write split stays balanced at ANY window size — including
// fullscreen, where a fixed max-width reader left the note a huge empty pane.
// Draggable 30–68%; the note always keeps ≥32%.
private let reflectionReaderFractionKey = "loom.reflection.readerFraction"
private func clampedReaderFraction(_ f: Double) -> Double { min(max(f, 0.30), 0.68) }
private let reflectionTopBarHeight: CGFloat = 52
// Windowed/fullscreen correctness (2026-07-10): content now RESPECTS the top
// safe area — the system insets it under the titlebar/toolbar strip in
// windowed mode and reclaims the space in fullscreen. These constants are
// therefore pure BREATHING ROOM inside the content, no longer strip-dodging;
// each old value carried ~52pt of manual strip clearance that the safe area
// now provides (60→8, 52→0, 76→24, 116→64).
private let reflectionSidebarTopClearance: CGFloat = 8
private let reflectionReaderTopClearance: CGFloat = 0
private let reflectionThreadMaxWidth: CGFloat = 720
private let reflectionTrafficLightClearance: CGFloat = 88
private let reflectionTitlebarControlSize: CGFloat = 16
private let reflectionTitlebarControlCenterY: CGFloat = 16
private let reflectionTitlebarContentTop: CGFloat = reflectionTitlebarControlCenterY - (reflectionTitlebarControlSize / 2)
private let reflectionThreadTopPadding: CGFloat = 24
private let reflectionInspectorTopPadding: CGFloat = 74
private let reflectionBridgePanelTopPadding: CGFloat = 64
private let reflectionReadingNoteRailLeading: CGFloat = 20
private let reflectionReadingNoteRailWidth: CGFloat = 18
private let reflectionReadingNoteContentLeading: CGFloat = 60
private let reflectionReadingNoteContentTrailing: CGFloat = 18
private let reflectionReadingNoteContentMaxWidth: CGFloat = 400
// Stage 3 (workbench): tab strip clears the overlay top bar; the thread's
// own clearance shrinks to this when the strip is present.
private let workbenchTabStripTopClearance: CGFloat = 56
private let workbenchThreadTopPadding: CGFloat = 16


private enum ReflectionCommitFocus: String {
    case meaning
    case question
    case correction
    case principle

    var captureLabel: String {
        switch self {
        case .meaning:
            return "user meaning"
        case .question:
            return "question"
        case .correction:
            return "correction"
        case .principle:
            return "principle"
        }
    }
}

private extension ReflectionCase {
    var hasWorkbenchMaterial: Bool {
        if !sources.isEmpty { return true }
        if steps.contains(where: { step in
            step.items.contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        }) {
            return true
        }
        if let traceRecords, !traceRecords.isEmpty { return true }
        if let documentText,
           !documentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return true
        }
        return false
    }

    var isUntouchedProductReflection: Bool {
        title == ReflectionCase.untitledPlaceholder
            && project == "New product practice"
            && !hasWorkbenchMaterial
    }
}

struct LoomReflectionRootView: View {
    @Environment(\.colorScheme) private var colorScheme
    // Stage 1 (LoomDomain): both mount paths (SwiftUI scene + AppKit
    // fallback window) share ONE workspace object — no more dual-@State
    // last-writer-wins races. The computed proxies keep the 100+ existing
    // reference sites compiling unchanged.
    @StateObject private var workspace = ReflectionWorkspaceSession.shared

    private var cases: [ReflectionCase] {
        get { workspace.cases }
        nonmutating set { workspace.cases = newValue }
    }
    private var selectedCaseID: ReflectionCase.ID {
        get { workspace.selectedCaseID }
        nonmutating set { workspace.selectedCaseID = newValue }
    }
    private var selectedSourceID: ReflectionSource.ID? {
        get { workspace.selectedSourceID }
        nonmutating set { workspace.selectedSourceID = newValue }
    }
    private var selectedLearningTraceID: ReflectionLearningTrace.ID? {
        get { workspace.selectedLearningTraceID }
        nonmutating set { workspace.selectedLearningTraceID = newValue }
    }
    @State private var draftText: String = ""
    @State private var documentPersistWork: DispatchWorkItem?
    @State private var isPresentingHistory = false
    @State private var composerFocus: ReflectionCommitFocus = .meaning
    @State private var statusMessage: String = "Local reflection workspace"
    @State private var emptyWorkbenchDismissed = false
    // Stage 3 (workbench): the IDE-grammar chrome (tabs, OUTLINE/TIMELINE,
    // status bar) ships ON with a persisted rollback flag — flipping it off
    // restores the previous shell against identical data.
    @AppStorage("loom.workbench.chrome") private var workbenchChrome: Bool = true
    // Wave 2 Cut A: the outer sidebar/detail split is now a system
    // NavigationSplitView; this binding is its column-visibility source of
    // truth (⌃⌘S via SidebarCommands and the top-bar toggle drive it; W2-2
    // reassigned ⌘1 from the sidebar toggle to the Today destination).
    @State private var sidebarColumnVisibility: NavigationSplitViewVisibility = .all
    // Wave 2 W2-2: the 3-way top IA (Today · Workspace · You). The sidebar
    // picker + ⌘1/⌘2/⌘3 drive this; the detail switches on it. Defaults to
    // Workspace so the workbench keeps owning cold start (charter answer ②).
    @State private var destination: WorkspaceDestination = .workspace
    // Wiki destination: the chapter the reader shows (LIBRARY rail rows and
    // .loomOpenWikiChapter deep-links set it); nil ⇒ the spine's first chapter.
    @State private var wikiSlug: String?
    @State private var isInspectorPresented: Bool = true
    // While a source is open, the right pane IS the note. This collapses it so
    // the PDF reads full-width in-window (owner 2026-07-06: 右栏要能收展). Session
    // state, not persisted — reopening a source starts with the note visible.
    @State private var isReadingNoteCollapsed: Bool = false
    @AppStorage(reflectionInspectorWidthKey) private var inspectorWidth: Double = Double(reflectionInspectorDefaultWidth)
    @AppStorage(reflectionReaderWidthKey) private var readerWidth: Double = Double(reflectionReaderDefaultWidth)
    @AppStorage(reflectionReaderFractionKey) private var readerFraction: Double = 0.52

    @State private var capturePayload: CapturePayload?
    // Source↔note anchor: clicking a `loom://anchor` link in the note pops the
    // source in an IN-APP PDF view jumped to its page+rect (owner 2026-07-05:
    // 保持外部打开为主 — this overlay appears only on an anchor click; the right
    // column and default external-open are untouched).
    @State private var anchorPreview: AnchorPreviewTarget?
    @State private var readerPageStateSourceID: ReflectionSource.ID?
    @State private var readerCurrentPageIndex: Int = 0
    @State private var readerPageCount: Int = 0
    @State private var sessionTraceRailItemsBySourceID: [ReflectionSource.ID: [SourceTraceRailItem]] = [:]
    @State private var lastHandledCaptureToken: UUID?
    @State private var lastHandledExternalFileToken: UUID?
    @State private var lastHandledExternalSelectionToken: UUID?

    private var isSidebarShown: Bool { sidebarColumnVisibility != .detailOnly }
    private var selectedIndex: Int { cases.firstIndex { $0.id == selectedCaseID } ?? 0 }
    private var selectedCase: ReflectionCase { cases[selectedIndex] }
    private var selectedSource: ReflectionSource? {
        selectedCase.sources.first { $0.id == selectedSourceID } ?? selectedCase.sources.first
    }
    private var nativeSource: ReflectionSource? {
        selectedCase.sources.first { $0.id == selectedSourceID && $0.fileURL != nil }
    }
    private var selectedLearningTrace: ReflectionLearningTrace? {
        let traces = ReflectionLearningTrace.from(selectedCase)
        return traces.first { $0.id == selectedLearningTraceID } ?? traces.last
    }
    private var hasPendingDraftMaterial: Bool {
        !draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    private var isWorkspaceEmpty: Bool {
        !emptyWorkbenchDismissed
            && !cases.isEmpty
            && cases.allSatisfy { !$0.hasWorkbenchMaterial }
            && workspace.principles.isEmpty
            && !hasPendingDraftMaterial
    }
    private var sidebarCases: [ReflectionCase] {
        isWorkspaceEmpty ? [] : cases
    }

    // MARK: - Wave 2 Cut B — native workbench toolbar
    //
    // These mirror the retired ReflectionTopBar exactly: same title logic, same
    // reader/inspector-toggle label, same open affordances — moved into native
    // `ToolbarItem`s. All items are gated to `destination == .workspace` inside
    // `workbenchToolbar`, so Today / You never surface workbench chrome. The
    // hand-drawn top bar's a11y identifiers ride along onto the native items:
    // `workspace.topBar` on the principal group, `topbar.inspectorToggle` on the
    // right-pane toggle. `topbar.sidebarToggle` is NOT re-created — the sidebar
    // toggle is now NavigationSplitView's OWN native button (+ ⌃⌘S via
    // SidebarCommands); we don't draw or duplicate one.

    /// The toolbar title: the chat's real name once named; otherwise the SOURCE
    /// it's about (Week 1 Notes); "LOOM" only for a truly empty app. (Same rule
    /// as the old ReflectionTopBar.barTitle — owner 2026-07-06: 这里不应该是 LOOM.)
    private var workbenchBarTitle: String {
        if !isWorkspaceEmpty, selectedCase.title != ReflectionCase.untitledPlaceholder {
            return selectedCase.title
        }
        if let label = nativeSource?.label ?? selectedCase.sources.first?.label, !label.isEmpty {
            return (label as NSString).deletingPathExtension
        }
        return "LOOM"
    }

    /// The right-pane toggle's help/label. While a source is open the right pane
    /// IS the note, so the button collapses/expands it; otherwise it toggles the
    /// evidence pane (owner 2026-07-06). Identical text to the old inspectorButton.
    private var inspectorToggleHelp: String {
        anchorPreview != nil
            ? (isReadingNoteCollapsed ? "Show notes" : "Hide notes")
            : (isInspectorPresented ? "Hide evidence" : "Show evidence")
    }

    @ViewBuilder
    private var workbenchTitleLabel: some View {
        HStack(spacing: 8) {
            if isWorkspaceEmpty {
                MoonAvatar(size: 14)
                    .frame(width: 16, height: 16)
            } else {
                ReflectionFileTypeBadge(
                    kind: nativeSource?.kind ?? selectedCase.sources.first?.kind ?? "document",
                    fallbackColor: LoomTokens.dsInk3
                )
                .scaleEffect(0.72)
                .frame(width: 16, height: 16)
            }

            Text(workbenchBarTitle)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(LoomTokens.dsInk1)
                .lineLimit(1)

            if !isWorkspaceEmpty {
                Circle()
                    .fill(selectedCase.status == "Second pass ready" ? LoomTokens.dsSuccess : LoomTokens.dsInk3)
                    .frame(width: 6, height: 6)
                    .help(selectedCase.status)

                if selectedCase.sources.count > 1 {
                    Label("\(selectedCase.sources.count)", systemImage: "folder")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(LoomTokens.dsInk3)
                }
            }
        }
        // UI-verification handle carried over from the retired ReflectionTopBar:
        // the Workspace-only top-bar group (the control that would catch a
        // vanished toolbar). Non-behavioral.
        .accessibilityIdentifier("workspace.topBar")
    }

    @ToolbarContentBuilder
    private var workbenchToolbar: some ToolbarContent {
        if destination == .workspace {
            ToolbarItem(placement: .principal) {
                workbenchTitleLabel
            }

            // Open affordances — only for a real, file-backed source (nativeSource
            // already implies fileURL != nil). Preserves the old top bar's two
            // buttons: reopen INSIDE Loom's reader (hidden while already reading),
            // and open the original file in the default native app.
            if !isWorkspaceEmpty, let native = nativeSource {
                if anchorPreview == nil {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            openSourceInReader(native)
                        } label: {
                            Image(systemName: "book")
                        }
                        .help("Open this source in Loom's reader")
                        .accessibilityLabel("Open in Loom")
                    }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(action: openSelectedSourceInNativeApp) {
                        Image(systemName: "arrow.up.forward.app")
                    }
                    .help("Open original file in the default native app")
                    .accessibilityLabel("Open Source")
                }
            }

            // The right-pane toggle: the SAME single action as the old bar —
            // `toggleInspector` branches on whether a source is open, so this one
            // button preserves BOTH the evidence-pane toggle and the reading-note
            // collapse. The hand-drawn bar's `topbar.inspectorToggle` id rides on.
            ToolbarItem(placement: .primaryAction) {
                Button(action: toggleInspector) {
                    Image(systemName: "sidebar.right")
                }
                .help(inspectorToggleHelp)
                .accessibilityLabel(inspectorToggleHelp)
                .accessibilityIdentifier("topbar.inspectorToggle")
            }
        }
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            NavigationSplitView(columnVisibility: $sidebarColumnVisibility) {
                ReflectionSidebar(
                        destination: destination,
                        onSelectDestination: { destination = $0 },
                        cases: sidebarCases,
                        selectedCaseID: selectedCaseID,
                        panelsCase: nil,
                        onSelectTrace: selectLearningTrace,
                        panelPrinciples: workspace.principles,
                        onCitePrinciple: citePrincipleIntoSelectedCase,
                        onOpenPrinciple: { record in
                            if let sourceCase = cases.first(where: { $0.id == record.sourceCaseID }) {
                                selectCase(sourceCase)
                            }
                        },
                        onSelect: selectCase,
                        onCreate: createReflection,
                        onCreateLearning: createLearningProject,
                        onNewChat: createReflection,
                        onDelete: deleteReflection,
                        onRename: renameReflection,
                        projects: projects,
                        onCreateProject: createProject,
                        onCreateCourse: createCourseFromFolder,
                        onAutoOrganizeCourse: autoOrganizeCourse,
                        onRenameProject: renameProject,
                        onDeleteProject: deleteProject,
                        onNewChatInProject: createChat(inProject:),
                        onMoveChat: moveChat
                )
                // System split divider replaces the old fixed 248pt column +
                // hand-drawn ReflectionDivider (charter §2): draggable, double-
                // click-collapsible, autosaved, AX-adjustable — all for free.
                .navigationSplitViewColumnWidth(min: 216, ideal: reflectionSidebarWidth, max: 360)
            } detail: {
                // W2-2 (3-way IA): the detail switches on `destination`. The
                // Workspace subtree below stays MOUNTED across switches (hidden
                // via opacity, never rebuilt) so the center note editor keeps a
                // stable SwiftUI identity and its capture observers survive a
                // round-trip to Today / You.
                ZStack {
                GeometryReader { geo in
                HStack(spacing: 0) {
                    // In-window reader (owner 2026-07-06): a COLUMN to the LEFT of
                    // the note — read beside write, both visible; the editor never
                    // unmounts (capture observer stays alive). Its width is a
                    // FRACTION of the window so the split stays balanced at ANY
                    // size (fullscreen included), draggable; the note keeps ≥32%.
                    if let target = anchorPreview {
                        readerColumn(target)
                            // Collapsed note (owner 2026-07-06): the reader fills
                            // the whole in-window area for a distraction-free read;
                            // otherwise it's its usual draggable fraction.
                            .frame(width: isReadingNoteCollapsed
                                   ? geo.size.width
                                   : geo.size.width * CGFloat(clampedReaderFraction(readerFraction)))
                            .transition(.move(edge: .leading).combined(with: .opacity))
                        if !isReadingNoteCollapsed {
                            ReflectionPaneResizer(
                                width: Binding(
                                    get: { Double(geo.size.width) * clampedReaderFraction(readerFraction) },
                                    set: { readerFraction = clampedReaderFraction($0 / Double(max(geo.size.width, 1))) }
                                ),
                                growsRightward: true,
                                clamp: { min(max($0, Double(geo.size.width) * 0.30), Double(geo.size.width) * 0.68) },
                                label: "Resize reader"
                            )
                        }
                    }
                    // The center: a reading document ON the glass once the
                    // user has material; before that it becomes a restrained
                    // start surface instead of a fake project/document.
                    // Hidden only while a source is open AND the note is
                    // collapsed (owner 2026-07-06) — then the reader fills.
                    if !(anchorPreview != nil && isReadingNoteCollapsed) {
                        ZStack(alignment: .leading) {
                            if anchorPreview != nil {
                                ReflectionReadingNoteBackdrop()
                            }

                            GlassReadingCenter(
                                reflectionCase: selectedCase,
                                selectedSourceID: selectedSourceID,
                                isReadingSource: anchorPreview != nil,
                                isWorkspaceEmpty: isWorkspaceEmpty,
                                draftText: $draftText,
                                commitFocus: $composerFocus,
                                onSelectTrace: selectLearningTrace,
                                onPromotePrinciple: promoteCandidatePrinciple,
                                onSubmit: submitMaterial,
                                onDocumentTextChange: updateCaseDocumentText,
                                onImportFiles: { urls in
                                    importSources(from: urls, openAfterImport: false)
                                },
                                onImportLocalSources: importLocalSources,
                                onCreateReflection: createReflection,
                                onCreateLearningProject: createLearningProject,
                                onOpenSourceID: { sourceID in
                                    guard let source = selectedCase.sources.first(where: { $0.id == sourceID }) else {
                                        statusMessage = "That file is no longer in this case's sources"
                                        return
                                    }
                                    selectedSourceID = source.id
                                    openSourceInReader(source)
                                }
                            )

                            if let target = anchorPreview {
                                rightColumnTraceRail(target)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }

                    if isInspectorPresented && anchorPreview == nil {
                        ReflectionPaneResizer(width: $inspectorWidth)
                        // Owner directive 2026-07-03: the right pane wears the
                        // launcher design — Review / Terminal / Browser /
                        // Files rows (the bridge to local files and browser).
                        // The old ReflectionSourceInspector face stays
                        // defined below for the machinery it still owns.
                        ReflectionBridgePanel(
                            status: statusMessage,
                            onFiles: importLocalSources,
                            onReview: reviewSelectedCase,
                            onUnwired: { statusMessage = $0 }
                        )
                        .frame(width: clampedInspectorWidth(inspectorWidth))
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                }
                }
                // Glass law (2026-07-03): exactly ONE glass pane per window —
                // the root matte below (ReflectionMatteWorkbenchBackground).
                // The system split columns stay transparent so that single
                // material shows through; no column stacks its own behind-
                // window material on top of it.
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .opacity(destination == .workspace ? 1 : 0)
                .allowsHitTesting(destination == .workspace)
                .accessibilityHidden(destination != .workspace)

                // Wiki — the personal knowledge encyclopedia, read IN the
                // workbench (owner trio 2026-07-10). No chapter selected ⇒ the
                // encyclopedia's table of contents (staged book + YOUR pages —
                // the workspace→wiki flow); a chapter ⇒ the reader; the
                // reader's ✕ returns to the table of contents.
                if destination == .wiki {
                    if let slug = wikiSlug, let manifest = WikiCurriculum.loadBundled() {
                        WikiReaderColumn(
                            manifest: manifest,
                            currentSlug: slug,
                            onClose: { wikiSlug = nil }
                        )
                        // Remount when the rail deep-links a chapter so the
                        // reader jumps there even while already open.
                        .id(slug)
                    } else {
                        WikiHomeView(
                            manifest: WikiCurriculum.loadBundled(),
                            ownPages: WikiHome.ownPages(from: cases),
                            onOpenChapter: { wikiSlug = $0 },
                            onOpenOwnPage: { id in
                                selectCaseTab(id)
                                destination = .workspace
                            }
                        )
                    }
                }
                // You — the native dossier (judgment trace made visible).
                if destination == .digitalMe {
                    NativeDossierView()
                }
                }
            }
            .navigationSplitViewStyle(.balanced)
            // Wave 2 Cut B (charter §4): the hand-drawn ReflectionTopBar overlay
            // is retired for a native SwiftUI `.toolbar`. NavigationSplitView now
            // owns the sidebar toggle (its native button + SidebarCommands ⌃⌘S),
            // so we no longer strip it with `.toolbar(removing:)`. The workbench
            // controls (source title, open-in-reader, open-in-native-app, and the
            // reader/inspector toggle) are Workspace chrome — the toolbar content
            // is gated to the Workspace destination so Today / You surface none of
            // the workbench items (only the shell's native sidebar toggle +
            // traffic lights remain there).
            .toolbar { workbenchToolbar }
            // One-window-one-glass (charter §1): the single root matte
            // (ReflectionMatteWorkbenchBackground — one underWindowBackground /
            // behindWindow material) already extends under the titlebar strip via
            // `.ignoresSafeArea(.container, edges: .top)`. A VISIBLE toolbar
            // background would stack a SECOND behind-window material in that strip
            // (glass on glass). So the toolbar paints no material of its own; the
            // one root matte shows through it as the chrome surface. (If the owner
            // later wants a visible toolbar separator, the matte must first stop
            // extending under the strip so it stays a single glass.)
            .toolbarBackground(.hidden, for: .windowToolbar)

            // Wave 2 Cut A: the left-edge hover-peek sidebar + its second
            // (withinWindow) material are retired — the system NavigationSplitView
            // now owns show/hide/animation of the sidebar column (charter §2 +
            // ratified answer ③a). ⌃⌘S and the top-bar toggle drive it.

            // Bottom status bar removed 2026-07-03 (owner directive):
            // the workspace ends at the composer; no chrome strip below it.

            // History ON the glass (owner 2026-07-04: one pane, not two
            // pages) — a quiet native timeline surface over the columns,
            // backed by a withinWindow material (the peek-backdrop law),
            // dismissed by Esc or the close glyph.
            if isPresentingHistory {
                HistoryGlassSurface {
                    isPresentingHistory = false
                }
                .transition(.opacity)
                .zIndex(2)
            }
        }
        .animation(.easeOut(duration: 0.22), value: isPresentingHistory)
        .onReceive(NotificationCenter.default.publisher(for: .loomShowHistoryOnGlass)) { _ in
            isPresentingHistory = true
        }
        .preferredColorScheme(isWorkspaceEmpty ? .dark : nil)
        // Windowed vs fullscreen correctness (owner report 2026-07-10: "有些
        // 情况只有在全屏能看到"): CONTENT respects the top safe area, so the
        // system insets it under the titlebar/toolbar strip in windowed mode
        // and reclaims the space when fullscreen hides that strip — the two
        // modes can no longer diverge. Only the MATTE below ignores the safe
        // area, so the single glass still extends under the strip.
        .background(ReflectionMatteWorkbenchBackground().ignoresSafeArea())
        .background(
            WindowConfigurator(
                title: "Loom",
                isNight: colorScheme == .dark,
                contentExtendsUnderTitlebar: true,
                // Wave 2 Cut B: the shell now carries a native SwiftUI `.toolbar`
                // (workbenchToolbar). WindowConfigurator must NOT strip it — with
                // `removesSystemToolbar` true it set `window.toolbar = nil` on
                // every mount AND on each fullscreen/resize/key notification,
                // which would null out (and flicker) the SwiftUI toolbar so the
                // Workspace controls vanish. Keeping the toolbar IS the charter §4
                // move ("工具栏回归原生"); the empty-strip concern that motivated
                // the nil is moot now that the toolbar is populated. The hidden-
                // titlebar chrome (transparent titlebar, hidden title, full-size
                // content view) is still driven by `contentExtendsUnderTitlebar`.
                removesSystemToolbar: false,
                contentCornerRadius: 0,
                usesFrameAutosave: false
            )
        )
        .sheet(isPresented: Binding<Bool>(
            get: { capturePayload != nil },
            set: { if !$0 { capturePayload = nil } }
        )) {
            CaptureSheet(payload: $capturePayload, onSaved: handleCaptureSaved)
        }
        // Reader is an in-window COLUMN beside the note now (owner 2026-07-06),
        // not a full-window overlay — see the center HStack above. Read-beside-
        // write: the note editor stays mounted the whole time, so its capture
        // observer never drops. The animation drives the column sliding in.
        .animation(.easeOut(duration: 0.16), value: anchorPreview != nil)
        .onReceive(NotificationCenter.default.publisher(for: .loomReflectionAnchorJump)) { note in
            guard let sourceID = note.userInfo?["sourceID"] as? String else { return }
            let page = note.userInfo?["page"] as? Int ?? 0
            let rect = (note.userInfo?["rect"] as? NSValue)?.rectValue ?? .zero
            jumpToAnchor(sourceID: sourceID, page: page, rect: rect)
        }
        .onAppear {
            // Primary capture shell: while any instance is mounted, the
            // dossier window defers capture presentation to us (see
            // `LoomCaptureURLRelay` cross-shell arbitration).
            LoomCaptureURLRelay.registerPrimaryShell()
            if normalizeUntouchedProductReflections() {
                persistWorkspace()
            }
            consumePendingCapture()
            consumePendingExternalFiles()
            consumePendingExternalSelection()
        }
        .onDisappear {
            LoomCaptureURLRelay.unregisterPrimaryShell()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenCase)) { note in
            if let id = note.userInfo?["caseID"] as? String {
                selectCaseTab(id)
                destination = .workspace
            }
        }
        // LIBRARY rail rows + any wiki deep-link land in the Wiki destination.
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenWikiChapter)) { note in
            if let slug = note.userInfo?["slug"] as? String {
                wikiSlug = slug
                destination = .wiki
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomNewTopic)) { _ in createReflection() }
        .onReceive(NotificationCenter.default.publisher(for: .loomExportLearningRecord)) { _ in exportLearningRecord() }
        .onReceive(NotificationCenter.default.publisher(for: .loomOpenExternalFiles)) { note in
            let token = note.userInfo?["token"] as? UUID
            if let token, token == lastHandledExternalFileToken {
                LoomExternalFileOpenRelay.clear(ifToken: token)
                return
            }
            guard let urls = note.userInfo?["urls"] as? [URL] else { return }
            lastHandledExternalFileToken = token
            openExternalFiles(urls)
            if let token {
                LoomExternalFileOpenRelay.clear(ifToken: token)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureExternalSelection)) { note in
            guard let capture = note.userInfo?["capture"] as? LoomExternalSelectionCapture else { return }
            if capture.token == lastHandledExternalSelectionToken {
                LoomExternalSelectionCaptureRelay.clear(ifToken: capture.token)
                return
            }
            lastHandledExternalSelectionToken = capture.token
            if !handlePreviewPassageCapture(capture) {
                handleExternalSelectionCapture(capture)
            }
            LoomExternalSelectionCaptureRelay.clear(ifToken: capture.token)
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomShuttleNavigate)) { note in
            let path = note.userInfo?["path"] as? String
            if path == nil || path == "/" || path == "/reflection" {
                statusMessage = "Reflection workspace"
            } else if path == "/sources" {
                statusMessage = "Sources are visible in the right pane"
            } else if path == "/draft" || path == "/studio" {
                statusMessage = "Drafting is downstream of reflection"
            }
        }
        // ⌘1 / ⌘3 — the real three columns (three-column charter).
        .onReceive(NotificationCenter.default.publisher(for: .loomToggleSidebar)) { _ in
            toggleSidebar()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomToggleInspector)) { _ in
            toggleInspector()
        }
        // ⌘1 / ⌘2 / ⌘3 — select the three destinations (W2-2). The number maps
        // through the tested `WorkspaceDestination.forShortcutNumber` contract.
        .onReceive(NotificationCenter.default.publisher(for: .loomSelectDestination)) { note in
            guard let number = note.userInfo?["number"] as? Int,
                  let target = WorkspaceDestination.forShortcutNumber(number) else { return }
            destination = target
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureFromURL)) { note in
            let token = note.userInfo?["token"] as? UUID
            if let token, token == lastHandledCaptureToken { return }
            if LoomCaptureURLRelay.claimedBySecondaryShell(token: token) { return }
            lastHandledCaptureToken = token
            handleCaptureRoute(CaptureURLRouter.route(userInfo: note.userInfo))
        }
    }

    private func selectCase(_ reflectionCase: ReflectionCase) {
        // Stage 3 (workbench): selecting from the Explorer opens a tab.
        emptyWorkbenchDismissed = true
        workspace.openCase(reflectionCase.id)
        selectedSourceID = reflectionCase.sources.first?.id
        selectedLearningTraceID = nil
        statusMessage = "Opened \(reflectionCase.title)"
        persistWorkspace()
    }

    private func selectCaseTab(_ id: ReflectionCase.ID) {
        guard let target = cases.first(where: { $0.id == id }) else { return }
        selectCase(target)
    }

    private func closeCaseTab(_ id: ReflectionCase.ID) {
        workspace.closeCase(id)
        selectedLearningTraceID = nil
        statusMessage = "Closed tab"
    }

    /// Stage 5 (呈现 outward): export the open project as a Learning Record
    /// (Markdown, RESEARCH_REPORT anatomy). The save panel grants the
    /// sandboxed write; nothing touches the original files.
    private func openAccessibilityPreferences() {
        guard let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") else { return }
        NSWorkspace.shared.open(url)
        statusMessage = "Grant Accessibility to LoomAnchorHelper, then capture again"
    }

    private func exportLearningRecord() {
        let markdown = ReflectionLearningRecordExporter.markdown(
            for: selectedCase,
            principles: workspace.principles
        )
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "\(selectedCase.title) — Learning Record.md"
        panel.canCreateDirectories = true
        guard panel.runModal() == .OK, let url = panel.url else {
            statusMessage = "Export cancelled"
            return
        }
        do {
            try markdown.data(using: .utf8)?.write(to: url, options: [.atomic])
            statusMessage = "Learning Record exported"
        } catch {
            statusMessage = "Export failed: \(error.localizedDescription)"
        }
    }

    private func citePrincipleIntoSelectedCase(_ principleID: ReflectionPrincipleRecord.ID) {
        workspace.citePrinciple(principleID, into: selectedCase)
        statusMessage = "Principle cited into \(selectedCase.title)"
        persistWorkspace()
    }

    /// Stage 4 (融会贯通): the user signs a principle out of its case. The
    /// gate inherits anchor honesty — a weak anchor blocks with an honest
    /// status-bar message, never a silent success.
    private func promoteCandidatePrinciple(_ candidate: String) {
        let statement = candidate
            .replacingOccurrences(of: "Principle candidate: ", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let anchoringTrace = ReflectionLearningTrace.from(selectedCase).last { $0.focus == "principle" }
            ?? selectedLearningTrace
        let outcome = workspace.promotePrinciple(
            statement: statement,
            holdsWithin: selectedCase.sources.first?.label ?? selectedCase.title,
            from: selectedCase,
            anchoringTrace: anchoringTrace
        )
        switch outcome {
        case .promoted:
            statusMessage = "Principle promoted to workspace memory"
        case .blockedWeakAnchor(let reason):
            statusMessage = reason
        case .blockedEmptyStatement:
            statusMessage = "Nothing to promote"
        }
    }

    private func toggleSidebar() {
        // Drives the system NavigationSplitView column (⌘1 + top-bar button);
        // ⌃⌘S goes through SidebarCommands, which updates the same binding.
        withAnimation(.easeInOut(duration: 0.18)) {
            sidebarColumnVisibility = isSidebarShown ? .detailOnly : .all
        }
    }

    private func selectLearningTrace(_ trace: ReflectionLearningTrace) {
        selectedLearningTraceID = trace.id
        if let matchingSource = selectedCase.sources.first(where: { trace.matches(source: $0) }) {
            selectedSourceID = matchingSource.id
        }
        statusMessage = "Inspecting \(trace.version) \(trace.versionTitle.lowercased())"
    }

    private func reviewSelectedCase() {
        guard selectedCase.project == "Learning pass" else {
            statusMessage = "Review is available after a source has learning traces"
            return
        }

        let traces = ReflectionLearningTrace.from(selectedCase)
        guard !traces.isEmpty else {
            composerFocus = .question
            statusMessage = "Add a question, correction, or principle to start review"
            return
        }

        let reviewTrace = traces.first { trace in
            trace.focus == "question" || trace.focus == "correction" || trace.focus == "principle"
        } ?? traces.last

        guard let reviewTrace else { return }
        switch reviewTrace.focus {
        case "question":
            composerFocus = .question
        case "correction":
            composerFocus = .correction
        case "principle":
            composerFocus = .principle
        default:
            composerFocus = .question
        }
        selectLearningTrace(reviewTrace)
        statusMessage = "Reviewing \(reviewTrace.version) \(reviewTrace.versionTitle.lowercased())"
    }

    private func toggleInspector() {
        withAnimation(.easeInOut(duration: 0.18)) {
            // While a source is open the right pane IS the note, so this button
            // (the top bar's right-pane toggle) collapses/expands it — read the
            // PDF full-width, or bring the note back. With no reader open it
            // toggles the evidence pane as before (owner 2026-07-06).
            if anchorPreview != nil {
                isReadingNoteCollapsed.toggle()
            } else {
                isInspectorPresented.toggle()
            }
        }
    }

    private func createReflection() {
        normalizeUntouchedProductReflections()
        if let existingIndex = cases.firstIndex(where: { $0.isUntouchedProductReflection }) {
            let existing = cases.remove(at: existingIndex)
            cases.insert(existing, at: 0)
            selectedCaseID = existing.id
            selectedSourceID = nil
            selectedLearningTraceID = nil
            draftText = ""
            emptyWorkbenchDismissed = true
            statusMessage = "Blank reflection ready"
            persistWorkspace()
            return
        }

        let next = ReflectionCase.blank()
        cases.insert(next, at: 0)
        selectedCaseID = next.id
        selectedSourceID = nil
        selectedLearningTraceID = nil
        draftText = ""
        emptyWorkbenchDismissed = true
        statusMessage = "New reflection created"
        persistWorkspace()
    }

    // MARK: - Chats-in-Projects (2026-07-05)

    private var projects: [ReflectionProject] {
        get { workspace.projects }
        nonmutating set { workspace.projects = newValue }
    }

    private func createProject() {
        let order = (projects.map(\.order).max() ?? -1) + 1
        projects.append(ReflectionProject(name: ReflectionProject.untitledName, order: order))
        persistWorkspace()
        statusMessage = "Project created"
    }

    /// Auto Organize (three-column division): re-run the folder→groups diff for
    /// a course and fold the result in — new subfolders become PROPOSED group
    /// children, groups whose folder vanished are reported. Proposal-only: never
    /// deletes, never writes the owner's disk (reading the bound folder only).
    private func autoOrganizeCourse(_ courseID: String) {
        guard let course = projects.first(where: { $0.id == courseID }),
              let rootID = course.contentRootID, let uuid = UUID(uuidString: rootID),
              let folderURL = ContentRootStore.activeURL(for: uuid) else {
            statusMessage = "That course's folder isn't available — re-add it"
            return
        }
        let excluded = course.organizeTemplate?.excludedSubfolders ?? []
        let existingGroups = projects.filter { $0.parentID == courseID }
        do {
            let diff = try OrganizeDiffPlanner.diff(
                courseFolder: folderURL, existingGroups: existingGroups, excluding: excluded)
            let nextOrder = (existingGroups.map(\.order).max() ?? -1) + 1
            let result = CourseOrganize.applyDiff(
                diff, into: projects, courseID: courseID, startOrder: nextOrder)
            projects = result.projects
            persistWorkspace()
            let added = diff.proposedNewGroups.count
            let dangling = result.danglingGroupIDs.count
            statusMessage = added == 0 && dangling == 0
                ? "Auto Organize: already up to date"
                : "Auto Organize: +\(added) group\(added == 1 ? "" : "s")\(dangling > 0 ? ", \(dangling) folder\(dangling == 1 ? "" : "s") missing" : "")"
        } catch {
            statusMessage = "Couldn't read that course's folder"
        }
    }

    /// "New course from folder…" (three-column division): pick a real folder,
    /// mint its read-only ContentRoot, and mirror its first-level subfolders as
    /// the course's groups — organization paid for once in Finder, never paid
    /// twice. LOOM only READS the folder (ruling ③); nothing is written to disk.
    private func createCourseFromFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Add course"
        panel.message = "Choose a course folder — its subfolders become the course's groups."
        guard panel.runModal() == .OK, let folderURL = panel.url else { return }
        guard let root = ContentRootStore.addFolder(url: folderURL) else {
            statusMessage = "Couldn't add that folder"
            return
        }
        do {
            let plan = try CourseImportPlanner.plan(courseFolder: folderURL, excluding: [])
            let nextOrder = (projects.map(\.order).max() ?? -1) + 1
            projects.append(contentsOf: CourseOrganize.makeCourse(
                from: plan, contentRootID: root.id.uuidString, courseOrder: nextOrder))
            persistWorkspace()
            statusMessage = plan.groups.isEmpty
                ? "Course “\(plan.courseName)” added"
                : "Course “\(plan.courseName)” added — \(plan.groups.count) groups"
        } catch {
            statusMessage = "Couldn't read that folder's groups"
        }
    }

    private func renameProject(_ id: String, to name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let index = projects.firstIndex(where: { $0.id == id }) else { return }
        projects[index].name = trimmed
        persistWorkspace()
    }

    private func deleteProject(_ id: String) {
        // A project is a container, never an owner: deleting it only re-homes
        // its drafts — it never deletes a draft. Node-aware (three-column
        // division): deleting a GROUP returns its chats to the course; deleting
        // a COURSE cascades its group entities and returns ALL chats to
        // unfiled. A plain project = a course with no groups → ungroup to nil.
        let isGroup = projects.first(where: { $0.id == id })?.parentID != nil
        let result = isGroup
            ? CourseOrganize.deleteGroup(id, from: projects, cases: cases)
            : CourseOrganize.deleteCourse(id, from: projects, cases: cases)
        projects = result.projects
        cases = result.cases
        persistWorkspace()
        statusMessage = isGroup
            ? "Group removed — its drafts returned to the course"
            : "Removed — its drafts are now ungrouped"
    }

    private func moveChat(_ reflectionCase: ReflectionCase, toProjectID projectID: String?) {
        guard let index = cases.firstIndex(where: { $0.id == reflectionCase.id }) else { return }
        cases[index].projectID = projectID
        persistWorkspace()
        statusMessage = projectID == nil ? "Moved to Drafts" : "Moved into project"
    }

    private func createChat(inProject projectID: String) {
        var next = ReflectionCase.blank()
        next.projectID = projectID
        cases.insert(next, at: 0)
        selectedCaseID = next.id
        selectedSourceID = nil
        selectedLearningTraceID = nil
        draftText = ""
        emptyWorkbenchDismissed = true
        statusMessage = "New draft in project"
        persistWorkspace()
    }

    @discardableResult
    private func normalizeUntouchedProductReflections() -> Bool {
        var keptPlaceholder = false
        var changed = false
        let normalizedCases = cases.filter { reflectionCase in
            guard reflectionCase.isUntouchedProductReflection else { return true }
            if keptPlaceholder {
                changed = true
                return false
            }
            keptPlaceholder = true
            return true
        }

        if changed {
            cases = normalizedCases.isEmpty ? [ReflectionCase.blank()] : normalizedCases
            if !cases.contains(where: { $0.id == selectedCaseID }) {
                selectedCaseID = cases[0].id
                selectedSourceID = cases[0].sources.first?.id
                selectedLearningTraceID = nil
            }
        }

        return changed
    }

    /// An INITIATION the user starts before touching any file: an empty
    /// learning project. Captures (⌘⇧U) then join it as the active project
    /// and its files accumulate under Sources.
    private func createLearningProject() {
        let next = Self.learningCase(from: [])
        cases.insert(next, at: 0)
        selectedCaseID = next.id
        selectedSourceID = nil
        selectedLearningTraceID = nil
        draftText = ""
        emptyWorkbenchDismissed = true
        statusMessage = "New learning project started"
        persistWorkspace()
    }

    private func renameReflection(_ reflectionCase: ReflectionCase, to title: String) {
        guard let index = cases.firstIndex(where: { $0.id == reflectionCase.id }) else { return }
        cases[index].title = title
        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
        cases[index].touchedAt = Date()
        statusMessage = "Renamed to \(title)"
        persistWorkspace()
    }

    private func deleteReflection(_ reflectionCase: ReflectionCase) {
        guard let index = cases.firstIndex(where: { $0.id == reflectionCase.id }) else { return }

        let wasSelected = selectedCaseID == reflectionCase.id
        withAnimation(.easeInOut(duration: 0.16)) {
            cases.remove(at: index)
            if cases.isEmpty {
                cases = [ReflectionCase.blank()]
            }
        }

        if wasSelected {
            let nextIndex = min(index, cases.count - 1)
            let nextCase = cases[nextIndex]
            selectedCaseID = nextCase.id
            selectedSourceID = nextCase.sources.first?.id
            selectedLearningTraceID = nil
            draftText = ""
        }

        // The case's rich document (RTFD package) leaves with the case.
        try? FileManager.default.removeItem(at: GlassDocumentEditor.documentURL(for: reflectionCase.id))

        if cases.allSatisfy({ !$0.hasWorkbenchMaterial }) {
            emptyWorkbenchDismissed = false
        }
        statusMessage = "Deleted \(reflectionCase.title)"
        persistWorkspace()
    }

    private func importLocalSources() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowsMultipleSelection = true
        panel.prompt = "Import"
        panel.title = "Import local sources"
        panel.allowedContentTypes = nativeFileImporterContentTypes()

        guard panel.runModal() == .OK else { return }
        importSources(from: panel.urls, openAfterImport: true)
    }


    /// The URL core of source import, shared by the Files panel and by
    /// files dropped/pasted into the case document. Dropping into the
    /// document should NOT bounce the user into another app, so opening
    /// is the panel path's privilege only.
    @discardableResult
    private func importSources(from urls: [URL], openAfterImport: Bool) -> [ReflectionSource] {
        let importedSources = urls.map(Self.localSource)
        guard !importedSources.isEmpty else { return [] }

        emptyWorkbenchDismissed = true
        let index = selectedIndex
        let inputLines = importedSources.map { source in
            "Imported local source: \(source.label). \(source.excerpt)"
        }

        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
        cases[index].touchedAt = Date()
        if cases[index].status != "Memory ready" {
            cases[index].status = "In reflection"
        }
        cases[index].sources.insert(contentsOf: importedSources, at: 0)
        cases[index].steps[0].items.append(contentsOf: inputLines)
        cases[index].messages.append(
            ReflectionMessage(
                role: .human,
                eyebrow: "Imported source",
                body: importedSources.count == 1
                    ? "Imported \(importedSources[0].label) into Sources."
                    : "Imported \(importedSources.count) local files into Sources."
            )
        )

        selectedSourceID = importedSources[0].id
        if openAfterImport, let first = importedSources.first {
            // Read the added file INSIDE Loom (owner 2026-07-08: 加的文件要能在
            // Loom 里也能打开). The in-app reader — SourceFileView: PDFKit for
            // PDFs, QuickLook for everything else — is where the note's
            // anchor-capture loop lives; popping the file out to Preview broke
            // "read beside write". The separate "record beside the native app"
            // flow still opens Preview/Word deliberately, and the reader chrome
            // keeps an "open in native app" affordance — so external stays
            // reachable. Only the first of a multi-file add opens; the rest wait
            // in Sources.
            openSourceInReader(first)
            // Only claim "reading in Loom" when the reader ACTUALLY opened this
            // source. openSourceInReader returns early — leaving anchorPreview
            // untouched — and sets its own honest "can't be found" / "moved —
            // re-add it" status when the first file is missing or its bookmark
            // is stale; don't clobber that honest failure (owner-audit
            // 2026-07-05). For a single-file add, openSourceInReader's own
            // "Reading …" (or honest-failure) status stands as-is.
            if importedSources.count > 1, anchorPreview?.sourceID == first.id {
                statusMessage = "Imported \(importedSources.count) local sources — reading \(first.label) in Loom"
            }
        } else {
            statusMessage = importedSources.count == 1
                ? "Imported \(importedSources[0].label) into Sources"
                : "Imported \(importedSources.count) local files into Sources"
        }
        persistWorkspace()
        return importedSources
    }

    /// Explicit commit grammar, matching the web model's cleanVersionMaterial
    /// prefixes — no keyword guessing. A trailing question mark opens a
    /// question (it stays open until the user commits what closes it);
    /// "principle:"/"correction:"/"question:" prefixes declare intent.
    // Stage 2 (THE BOOK): the composer's explicit type chip is the fallback —
    // the commit type is never guessed-only. Prefix/suffix grammar still wins
    // so muscle-memory commits keep working.
    private static func commitFocus(for material: String, fallback: ReflectionCommitFocus) -> ReflectionCommitFocus {
        let trimmed = material.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasSuffix("?") || trimmed.hasSuffix("？") { return .question }
        let lowered = trimmed.lowercased()
        if lowered.hasPrefix("principle:") { return .principle }
        if lowered.hasPrefix("correction:") { return .correction }
        if lowered.hasPrefix("question:") { return .question }
        return fallback
    }

    private func submitMaterial() {
        let material = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !material.isEmpty else { return }

        emptyWorkbenchDismissed = true
        let index = selectedIndex
        if cases[index].project == "Learning pass" {
            let sourceLabel = selectedLearningTrace?.sourceAnchor
                ?? Self.latestLearningAnchor(in: cases[index])
                ?? cases[index].sources.first?.label
                ?? cases[index].title
            cases[index].status = "Reading"
            cases[index].updatedAt = Self.timeFormatter.string(from: Date())
            cases[index].touchedAt = Date()
            let focus = Self.commitFocus(for: material, fallback: composerFocus)
            let manualLine = Self.manualLearningInputLine(material, sourceLabel: sourceLabel, focus: focus)
            cases[index].steps[0].items.append(manualLine)
            // Stage 1 (LoomDomain): dual-write the typed record alongside the
            // rendered line so new commits never depend on string re-parsing.
            cases[index].appendTraceRecord(forLegacyItem: manualLine, sourceLabel: sourceLabel)
            cases[index].messages.append(ReflectionMessage(
                role: .human,
                eyebrow: focus == .question ? "Open question" : "Understanding version",
                body: material
            ))
            cases[index].messages.append(
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Version committed",
                    body: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
                )
            )
            advancePassOnUserReview(for: index, focus: focus)
            selectedLearningTraceID = ReflectionLearningTrace.from(cases[index]).last?.id
            draftText = ""
            composerFocus = .meaning
            statusMessage = "Committed thinking version"
            persistWorkspace()
            return
        }

        cases[index].status = "In reflection"
        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
        cases[index].touchedAt = Date()
        cases[index].steps[0].items.append(material)
        cases[index].messages.append(ReflectionMessage(role: .human, eyebrow: "New material", body: material))
        cases[index].messages.append(
            ReflectionMessage(
                role: .loom,
                eyebrow: "Loom reflection",
                body: "Captured as input. Next useful move: name the assumption this material challenges."
            )
        )
        draftText = ""
        statusMessage = "Captured input"
        persistWorkspace()
    }

    private func consumePendingCapture() {
        guard let pending = LoomCaptureURLRelay.pending(),
              pending.token != lastHandledCaptureToken,
              !LoomCaptureURLRelay.claimedBySecondaryShell(token: pending.token) else { return }
        lastHandledCaptureToken = pending.token
        handleCaptureRoute(CaptureURLRouter.route(url: pending.url))
    }

    private func consumePendingExternalFiles() {
        for pending in LoomExternalFileOpenRelay.pendingEntries() {
            if pending.token == lastHandledExternalFileToken {
                LoomExternalFileOpenRelay.clear(ifToken: pending.token)
                continue
            }
            lastHandledExternalFileToken = pending.token
            openExternalFiles(pending.urls)
            LoomExternalFileOpenRelay.clear(ifToken: pending.token)
        }
    }

    private func consumePendingExternalSelection() {
        for pending in LoomExternalSelectionCaptureRelay.pendingCaptures() {
            if pending.token == lastHandledExternalSelectionToken {
                LoomExternalSelectionCaptureRelay.clear(ifToken: pending.token)
                continue
            }
            lastHandledExternalSelectionToken = pending.token
            if !handlePreviewPassageCapture(pending) {
                handleExternalSelectionCapture(pending)
            }
            LoomExternalSelectionCaptureRelay.clear(ifToken: pending.token)
        }
    }

    private func openExternalFiles(_ urls: [URL]) {
        let importedSources = urls
            .filter { $0.isFileURL }
            .map(Self.localSource)
        guard !importedSources.isEmpty else { return }

        let next = Self.learningCase(from: importedSources)
        withAnimation(.easeInOut(duration: 0.16)) {
            cases.insert(next, at: 0)
        }
        selectedCaseID = next.id
        selectedSourceID = importedSources[0].id
        selectedLearningTraceID = nil
        draftText = ""
        emptyWorkbenchDismissed = true
        sidebarColumnVisibility = .detailOnly
        isInspectorPresented = false
        openSourcesInNativeApps(importedSources)
        statusMessage = importedSources.count == 1
            ? "Opened \(importedSources[0].label) in the native app; Loom is recording beside it"
            : "Opened \(importedSources[0].label) and \(importedSources.count - 1) more files in native apps"
        persistWorkspace()
    }

    private func openSourceInNativeApp(_ source: ReflectionSource) {
        guard let url = source.fileURL else { return }
        // A bare fileURL loses its sandbox grant when the importing
        // session ends; the security-scoped bookmark minted at import
        // time buys the access back.
        if let bookmark = source.bookmarkData {
            var isStale = false
            if let scoped = try? URL(
                resolvingBookmarkData: bookmark,
                options: .withSecurityScope,
                relativeTo: nil,
                bookmarkDataIsStale: &isStale
            ) {
                _ = scoped.startAccessingSecurityScopedResource()
                Self.openURLInPreferredNativeApp(scoped)
                statusMessage = "Opened \(source.label) in the native app"
                DispatchQueue.main.asyncAfter(deadline: .now() + 15) {
                    scoped.stopAccessingSecurityScopedResource()
                }
                return
            }
        }
        Self.openURLInPreferredNativeApp(url)
        statusMessage = "Opened \(source.label) in the native app"
    }

    private func openSourceInReader(_ source: ReflectionSource) {
        guard let fileURL = source.fileURL else {
            statusMessage = "\(source.label) has no local file to open"
            return
        }

        var resolved = fileURL
        var wasStale = false
        if let bookmark = source.bookmarkData {
            var isStale = false
            if let scoped = try? URL(
                resolvingBookmarkData: bookmark,
                options: .withSecurityScope,
                relativeTo: nil,
                bookmarkDataIsStale: &isStale
            ) {
                _ = scoped.startAccessingSecurityScopedResource()
                resolved = scoped
                wasStale = isStale
            }
        }

        guard FileManager.default.fileExists(atPath: resolved.path) else {
            statusMessage = "\(source.label) can't be found — it may have moved or been deleted"
            return
        }

        selectedSourceID = source.id
        readerPageStateSourceID = source.id
        readerCurrentPageIndex = 0
        readerPageCount = 0
        if anchorPreview == nil {
            isReadingNoteCollapsed = false
        }
        anchorPreview = AnchorPreviewTarget(sourceID: source.id, fileURL: resolved, page: 0, rect: .zero)
        statusMessage = wasStale
            ? "\(source.label) moved — re-add it to Sources so jumps stay reliable"
            : "Reading \(source.label)"
    }

    private func openSelectedSourceInNativeApp() {
        guard let nativeSource else { return }
        openSourceInNativeApp(nativeSource)
    }

    /// Pop a source in an IN-APP PDF view jumped to an anchored page + rect (the
    /// note-anchor destination). External-open stays the default; this is only
    /// the anchor-click path. The security-scoped bookmark buys back sandbox
    /// access the same way the native-app open does.
    private func jumpToAnchor(sourceID: String, page: Int, rect: CGRect) {
        guard let source = selectedCase.sources.first(where: { $0.id == sourceID })
            ?? cases.flatMap(\.sources).first(where: { $0.id == sourceID }) else {
            statusMessage = "That source is no longer in this project"
            return
        }
        guard let fileURL = source.fileURL else {
            statusMessage = "Opened \(source.label)"
            return
        }
        var resolved = fileURL
        var wasStale = false
        if let bookmark = source.bookmarkData {
            var isStale = false
            if let scoped = try? URL(
                resolvingBookmarkData: bookmark,
                options: .withSecurityScope,
                relativeTo: nil,
                bookmarkDataIsStale: &isStale
            ) {
                _ = scoped.startAccessingSecurityScopedResource()
                resolved = scoped
                wasStale = isStale
            }
        }
        // Honest failure (owner-audit 2026-07-05): a moved/deleted file used to
        // open a blank reader silently. Tell the owner instead of pretending.
        guard FileManager.default.fileExists(atPath: resolved.path) else {
            statusMessage = "\(source.label) can't be found — it may have moved or been deleted"
            return
        }
        if wasStale {
            statusMessage = "\(source.label) moved — re-add it to Sources so jumps stay reliable"
        }
        selectedSourceID = source.id
        readerPageStateSourceID = source.id
        readerCurrentPageIndex = max(0, page)
        readerPageCount = 0
        // Opening a source from a CLOSED reader starts with the note visible —
        // a stale collapse from a previous reading session shouldn't hide the
        // note of a freshly-opened source (owner 2026-07-06). Jumping between
        // passages within an already-open reader preserves the collapse.
        if anchorPreview == nil { isReadingNoteCollapsed = false }
        anchorPreview = AnchorPreviewTarget(sourceID: source.id, fileURL: resolved, page: page, rect: rect)
    }

    /// Hover-to-note lands here: the reader captured a passage. Turn it into a
    /// clickable `loom://anchor` quote in the center note (so a later click
    /// jumps back to the exact page + rect), close the reader, and let the
    /// note take focus. One hover, one click, one note.
    /// `precise` = the rect was recovered (reader will highlight the exact
    /// passage). false = page-only fallback: the status + landing flash say so
    /// honestly rather than pretending the anchor is exact.
    /// The reader as an in-window COLUMN beside the note (owner 2026-07-06 —
    /// read beside write). Slim header + Done; the reader's own toolbar carries
    /// zoom / page / ⌃⌘F fullscreen. Stays open across captures so you watch each
    /// quote land in the note to the right.
    private func readerColumn(_ target: AnchorPreviewTarget) -> some View {
        // Don't say the filename twice (owner 2026-07-06: 去掉重复信息). The
        // global top bar shows the chat's name, or — when the chat is unnamed —
        // the source's own name. Only when the top bar isn't ALREADY showing
        // THIS file's name does the reader toolbar carry it (a named week, or a
        // 2nd source in the week); otherwise it stays silent (barLabel = nil).
        let topTitle = selectedCase.title != ReflectionCase.untitledPlaceholder
            ? selectedCase.title
            : (((nativeSource?.label ?? selectedCase.sources.first?.label) as NSString?)?.deletingPathExtension ?? "")
        let readerBase = (target.fileURL.lastPathComponent as NSString).deletingPathExtension
        let barLabel: String? = (readerBase == topTitle) ? nil : target.fileURL.lastPathComponent
        return SourceFileView(fileURL: target.fileURL) { anchorPreview = nil }
            .onNotePassage { page, rect, text, image in
                rememberTraceRailCapture(sourceID: target.sourceID, page: page, rect: rect, text: text)
                noteFromPassage(sourceID: target.sourceID, page: page, rect: rect, text: text, image: image)
            }
            .onReaderPageStateChange { pageIndex, pageCount in
                guard anchorPreview?.sourceID == target.sourceID else { return }
                readerPageStateSourceID = target.sourceID
                readerCurrentPageIndex = pageIndex
                readerPageCount = pageCount
            }
            .readerChrome(label: barLabel, showsClose: true)
            .padding(.top, reflectionReaderTopClearance)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(nsColor: .windowBackgroundColor))
        .task(id: "\(target.page):\(target.rect.origin.x),\(target.rect.origin.y),\(target.rect.width),\(target.rect.height)") {
            // Scroll to the anchor on open AND on every jump to a new passage
            // while the reader stays open — onAppear alone misses same-file jumps
            // (clicking a second quote while the reader column is already up).
            // But a PLAIN open (page 0, empty rect — openSourceInReader, the
            // "read this source" path, not an anchor jump) must NOT post: doing
            // so force-scrolled the reader to page 1 and clobbered its own
            // per-file scroll memory (SourceFileView restorePosition). Only a
            // real anchor (a later page, or a rect to highlight) re-applies.
            guard target.page > 0 || !target.rect.isEmpty else { return }
            try? await Task.sleep(nanoseconds: 450_000_000)
            guard !Task.isCancelled else { return }
            NotificationCenter.default.post(
                name: .loomApplyPDFAnchor,
                object: nil,
                userInfo: ["page": target.page, "rect": NSValue(rect: target.rect)]
            )
        }
    }

    @ViewBuilder
    private func rightColumnTraceRail(_ target: AnchorPreviewTarget) -> some View {
        let items = traceRailItems(for: target.sourceID)
        if !items.isEmpty {
            SourceTraceRail(
                items: items,
                currentPageIndex: traceRailCurrentPage(for: target),
                pageCount: traceRailPageCount(for: items),
                onJump: { item in
                    readerPageStateSourceID = target.sourceID
                    readerCurrentPageIndex = item.pageIndex
                    NotificationCenter.default.post(
                        name: .loomApplyPDFAnchor,
                        object: nil,
                        userInfo: ["page": item.pageIndex, "rect": NSValue(rect: item.rect)]
                    )
                }
            )
            .frame(width: reflectionReadingNoteRailWidth)
            .padding(.top, reflectionThreadTopPadding)
            .padding(.bottom, 28)
            .padding(.leading, reflectionReadingNoteRailLeading)
            .transition(.opacity)
        }
    }

    private func traceRailCurrentPage(for target: AnchorPreviewTarget) -> Int {
        readerPageStateSourceID == target.sourceID ? readerCurrentPageIndex : max(0, target.page)
    }

    private func traceRailPageCount(for items: [SourceTraceRailItem]) -> Int {
        let estimated = (items.map(\.pageIndex).max() ?? 0) + 1
        return max(readerPageCount, estimated, 1)
    }

    private func rememberTraceRailCapture(sourceID: String, page: Int, rect: CGRect, text: String) {
        let item = SourceTraceRailItem.sessionCapture(pageIndex: page, rect: rect, text: text)
        var items = sessionTraceRailItemsBySourceID[sourceID] ?? []
        items.removeAll { $0.id == item.id }
        items.append(item)
        if items.count > 80 {
            items.removeFirst(items.count - 80)
        }
        sessionTraceRailItemsBySourceID[sourceID] = items
    }

    private func traceRailItems(for sourceID: String) -> [SourceTraceRailItem] {
        guard let source = selectedCase.sources.first(where: { $0.id == sourceID }) else { return [] }
        let persisted: [SourceTraceRailItem] = ReflectionLearningTrace.from(selectedCase).compactMap { trace in
            guard trace.matches(source: source), let pageNumber = trace.pageNumber else { return nil }
            let pageIndex = max(0, pageNumber - 1)
            let kind = traceRailKind(for: trace)
            let title = "\(traceRailTitle(for: kind)) · Page \(pageNumber)"
            return SourceTraceRailItem(
                id: "trace-\(trace.id)",
                pageIndex: pageIndex,
                rect: .zero,
                kind: kind,
                title: title,
                excerpt: String(trace.displayText.prefix(140))
            )
        }
        return mergedTraceRailItems(
            persisted
                + documentAnchorTraceRailItems(for: sourceID)
                + (sessionTraceRailItemsBySourceID[sourceID] ?? [])
        )
    }

    private func documentAnchorTraceRailItems(for sourceID: String) -> [SourceTraceRailItem] {
        let url = GlassDocumentEditor.documentURL(for: selectedCase.id)
        guard let attributed = try? NSAttributedString(
            url: url,
            options: [.documentType: NSAttributedString.DocumentType.rtfd],
            documentAttributes: nil
        ), attributed.length > 0 else { return [] }
        let text = attributed.string as NSString
        let full = NSRange(location: 0, length: attributed.length)
        var items: [SourceTraceRailItem] = []
        attributed.enumerateAttribute(.link, in: full) { value, range, _ in
            let raw = (value as? URL)?.absoluteString
                ?? (value as? NSURL)?.absoluteString
                ?? (value as? String)
                ?? ""
            guard raw.hasPrefix("loom://anchor"),
                  let comps = URLComponents(string: raw),
                  comps.queryItems?.first(where: { $0.name == "src" })?.value == sourceID else { return }
            let pageIndex = max(0, Int(comps.queryItems?.first(where: { $0.name == "page" })?.value ?? "") ?? 0)
            let rect = traceRailRect(from: comps.queryItems?.first(where: { $0.name == "rect" })?.value)
            let paragraph = text.paragraphRange(for: NSRange(location: min(range.location, max(text.length - 1, 0)), length: 0))
            let excerpt = text.substring(with: paragraph)
                .replacingOccurrences(of: "\u{25C6}", with: "")
                .replacingOccurrences(of: "\u{25C7}", with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            let rectKey = "\(Int(rect.origin.x)),\(Int(rect.origin.y)),\(Int(rect.width)),\(Int(rect.height))"
            items.append(SourceTraceRailItem(
                id: "document-anchor-\(sourceID)-\(pageIndex)-\(rectKey)-\(range.location)",
                pageIndex: pageIndex,
                rect: rect,
                kind: .draft,
                title: "Note anchor · Page \(pageIndex + 1)",
                excerpt: String(excerpt.prefix(140))
            ))
        }
        return items
    }

    private func traceRailRect(from value: String?) -> CGRect {
        guard let parts = value?.split(separator: ",").compactMap({ Double($0) }), parts.count == 4 else {
            return .zero
        }
        return CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
    }

    private func mergedTraceRailItems(_ items: [SourceTraceRailItem]) -> [SourceTraceRailItem] {
        var seen: Set<String> = []
        var merged: [SourceTraceRailItem] = []
        for item in items {
            let key = traceRailDedupeKey(for: item)
            guard !seen.contains(key) else { continue }
            seen.insert(key)
            merged.append(item)
        }
        return merged.sorted {
            if $0.pageIndex != $1.pageIndex { return $0.pageIndex < $1.pageIndex }
            return $0.kind.rawValue < $1.kind.rawValue
        }
    }

    private func traceRailDedupeKey(for item: SourceTraceRailItem) -> String {
        let excerpt = item.excerpt
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .prefix(48)
        let rect = item.rect
        return "\(item.pageIndex)|\(Int(rect.origin.x)),\(Int(rect.origin.y)),\(Int(rect.width)),\(Int(rect.height))|\(excerpt)"
    }

    private func traceRailKind(for trace: ReflectionLearningTrace) -> SourceTraceRailItem.Kind {
        if trace.focus == "question" { return .question }
        if trace.focus == "principle" { return .principle }
        return .capture
    }

    private func traceRailTitle(for kind: SourceTraceRailItem.Kind) -> String {
        switch kind {
        case .question:
            return "Question"
        case .principle:
            return "Principle"
        case .draft:
            return "Draft reference"
        case .transient:
            return "Unsaved"
        case .capture:
            return "Captured"
        }
    }

    private func noteFromPassage(sourceID: String, page: Int, rect: CGRect, text: String, image: NSImage? = nil, precise: Bool = true) {
        let quote = text.trimmingCharacters(in: .whitespacesAndNewlines)
        // The appshot image IS the excerpt — it needs no matchable text; a
        // text-only (⌘U) capture still requires a quote.
        guard image != nil || !quote.isEmpty else { return }
        let rectValue = "\(Int(rect.origin.x)),\(Int(rect.origin.y)),\(Int(rect.size.width)),\(Int(rect.size.height))"
        var comps = URLComponents()
        comps.scheme = "loom"
        comps.host = "anchor"
        comps.queryItems = [
            URLQueryItem(name: "src", value: sourceID),
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "rect", value: rectValue),
            URLQueryItem(name: "text", value: String(quote.prefix(120))),
        ]
        let anchorURL = comps.string ?? "loom://anchor?src=\(sourceID)&page=\(page)"
        // Honesty (owner-audit): while the note is collapsed the reader fills the
        // window and the center editor (with the insert observer) is UNMOUNTED —
        // a posted passage would vanish into the void yet still report "Noted".
        // Un-collapse first so the observer is mounted before the post fires, and
        // you watch the quote land beside the reader (read-beside-write).
        if isReadingNoteCollapsed {
            withAnimation(.easeInOut(duration: 0.16)) { isReadingNoteCollapsed = false }
        }
        // Keep the reader open — it's a column beside the note now, so you watch
        // the quote land to the right and keep reading (read-beside-write).
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            if let image {
                // In-app appshot: ONE clean clickable card, no scrambled quote
                // (owner 2026-07-06). The card carries the anchor so a click
                // still jumps back to the exact page + rect.
                NotificationCenter.default.post(
                    name: .loomReflectionInsertPassageImage,
                    object: nil,
                    userInfo: ["image": image, "url": anchorURL]
                )
            } else {
                // Text-only (⌘U from Preview): the clickable quote as before.
                NotificationCenter.default.post(
                    name: .loomReflectionInsertPassage,
                    object: nil,
                    userInfo: ["quote": quote, "url": anchorURL, "precise": precise]
                )
            }
        }
        // Invite the read-thin move (docs/canon/WHAT_IS_LOOM.md §6): the quote
        // is just evidence; your OWN sentence under it is the distillation, and
        // it's what comes back in Review. The nudge teaches the loop without a
        // modal or a forced field — it reuses the existing status line.
        let landed = precise
            ? "Noted p.\(page + 1)"
            : "Noted p.\(page + 1) — exact spot not found, will jump to the page"
        statusMessage = "\(landed) — now say it in your own words; it comes back in Review."
    }

    /// External capture (⌘U from Preview): resolve the selection against the
    /// registered PDF sources and land it as the SAME clickable anchor quote as
    /// an in-app hover ❕. Honest about precision. Returns false only when the
    /// passage isn't in any source (caller falls back to the learning-trace path).
    private func handlePreviewPassageCapture(_ capture: LoomExternalSelectionCapture) -> Bool {
        let text = capture.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return false }
        switch ReflectionPassageAnchoring.resolve(
            text: text,
            sources: selectedCase.sources,
            pageHint: capture.nativeContext?.pageNumber
        ) {
        case let .exact(sourceID, page, rect):
            emptyWorkbenchDismissed = true
            selectedSourceID = sourceID
            noteFromPassage(sourceID: sourceID, page: page, rect: rect, text: text, precise: true)
            return true
        case let .pageOnly(sourceID, page):
            emptyWorkbenchDismissed = true
            selectedSourceID = sourceID
            noteFromPassage(sourceID: sourceID, page: page, rect: .zero, text: text, precise: false)
            return true
        case .notFound:
            return false
        }
    }

    private func openSourcesInNativeApps(_ sources: [ReflectionSource]) {
        for source in sources {
            openSourceInNativeApp(source)
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

    private func handleExternalSelectionCapture(_ capture: LoomExternalSelectionCapture) {
        let importedSources = capture.fileURLs
            .filter { $0.isFileURL }
            .map(Self.localSource)
        let sessionSources = importedSources.isEmpty
            ? [Self.nativeSessionSource(from: capture)].compactMap { $0 }
            : []
        let candidateSources = importedSources + sessionSources

        if let primarySource = candidateSources.first {
            // Sidebar rows are user-initiated PROJECTS, never files (owner:
            // 左边就应该是一个发起的). A capture joins the ACTIVE learning
            // project — its file becomes one of the project's sources —
            // instead of creating a file-named case per document.
            if let activeIndex = Self.activeLearningCaseIndex(
                in: cases,
                selectedCaseID: selectedCaseID,
                containing: primarySource
            ) {
                selectedCaseID = cases[activeIndex].id
                if let matchingSource = cases[activeIndex].sources.first(where: { source in
                    Self.sourceDeduplicationKey(source) == Self.sourceDeduplicationKey(primarySource)
                }) {
                    selectedSourceID = matchingSource.id
                }
            } else {
                let next = Self.learningCase(from: candidateSources)
                withAnimation(.easeInOut(duration: 0.16)) {
                    cases.insert(next, at: 0)
                }
                selectedCaseID = next.id
                selectedSourceID = candidateSources[0].id
                selectedLearningTraceID = nil
            }
        } else if selectedCase.sources.isEmpty, !candidateSources.isEmpty {
            let next = Self.learningCase(from: candidateSources)
            withAnimation(.easeInOut(duration: 0.16)) {
                cases.insert(next, at: 0)
            }
            selectedCaseID = next.id
            selectedSourceID = candidateSources[0].id
            selectedLearningTraceID = nil
        }

        let index = selectedIndex
        let existingSourceKeys = Set(cases[index].sources.map(Self.sourceDeduplicationKey))
        let newSources = candidateSources.filter { source in
            !existingSourceKeys.contains(Self.sourceDeduplicationKey(source))
        }
        if !newSources.isEmpty {
            cases[index].sources.insert(contentsOf: newSources, at: 0)
            selectedSourceID = newSources[0].id
        }

        let captureKind = Self.captureKind(for: capture)
        let inferredAnchor = Self.inferPDFAnchor(
            for: capture,
            sources: cases[index].sources + newSources
        )
        if let inferredSourceID = inferredAnchor?.sourceID {
            selectedSourceID = inferredSourceID
        }

        let captureHasFileEvidence = !capture.fileURLs.filter(\.isFileURL).isEmpty
            || capture.nativeContext?.documentURL != nil
        let sourceLabel = inferredAnchor?.label
            ?? Self.nativeContextAnchoredSourceLabel(for: capture, kind: captureKind)
            ?? Self.windowAnchoredSourceLabel(
                for: capture,
                kind: captureKind,
                includeWindowPage: !captureHasFileEvidence
            )
            ?? nativeSource?.label
            ?? newSources.first?.label
            ?? capture.sourceApp
            ?? "native file"
        let learningFocus = Self.learningFocus(for: capture, kind: captureKind)
        let inputLine = Self.selectionInputLine(
            capture: capture,
            sourceLabel: sourceLabel,
            kind: captureKind,
            focus: learningFocus,
            inferredAnchor: inferredAnchor
        )

        let inputFingerprint = reflectionLearningInputFingerprint(inputLine)
        if let existingInputIndex = cases[index].steps[0].items.firstIndex(where: {
            reflectionLearningInputFingerprint($0) == inputFingerprint
        }) {
            let existingInputLine = cases[index].steps[0].items[existingInputIndex]
            if Self.shouldPromoteLearningInputAnchor(existingInputLine, candidate: inputLine) {
                cases[index].steps[0].items[existingInputIndex] = inputLine
                // Stage 1 (LoomDomain): keep the typed twin in lockstep with
                // the in-place anchor promotion.
                cases[index].replaceTraceRecord(forLegacyItem: existingInputLine, with: inputLine, sourceLabel: sourceLabel)
                cases[index].messages.append(
                    ReflectionMessage(
                        role: .human,
                        eyebrow: "Learning trace",
                        body: Self.selectionMessageBody(
                            capture: capture,
                            sourceLabel: sourceLabel,
                            kind: captureKind,
                            focus: learningFocus,
                            inferredAnchor: inferredAnchor
                        )
                    )
                )
            }
            cases[index].status = "Reading"
            cases[index].updatedAt = Self.timeFormatter.string(from: Date())
            cases[index].touchedAt = Date()
            selectedLearningTraceID = ReflectionLearningTrace.from(cases[index]).last?.id
            draftText = ""
            sidebarColumnVisibility = .detailOnly
            isInspectorPresented = false
            statusMessage = "Captured selected text from the native app"
            persistWorkspace()
            return
        }

        cases[index].status = "Reading"
        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
        cases[index].touchedAt = Date()
        cases[index].steps[0].items.append(inputLine)
        // Stage 1 (LoomDomain): dual-write the typed record for new captures.
        cases[index].appendTraceRecord(forLegacyItem: inputLine, sourceLabel: sourceLabel)
        cases[index].messages.append(
            ReflectionMessage(
                role: .human,
                eyebrow: "Learning trace",
                body: Self.selectionMessageBody(
                    capture: capture,
                    sourceLabel: sourceLabel,
                    kind: captureKind,
                    focus: learningFocus,
                    inferredAnchor: inferredAnchor
                )
            )
        )
        selectedLearningTraceID = ReflectionLearningTrace.from(cases[index]).last?.id
        draftText = ""
        sidebarColumnVisibility = .detailOnly
        isInspectorPresented = false
        statusMessage = "Captured selected text from the native app"
        persistWorkspace()
    }

    /// Stage 2 (THE BOOK): machine synthesis is computed ON READ and rendered
    /// as Loom's marginal voice (ReflectionLearningReviewSummary) — it never
    /// writes into the user's steps, never appends messages, and never
    /// advances the pass. Only the user's own review actions (question /
    /// correction / principle commits) advance the pass state.
    private func advancePassOnUserReview(for index: Int, focus: ReflectionCommitFocus) {
        guard cases.indices.contains(index),
              cases[index].project == "Learning pass" else { return }
        if focus == .question || focus == .correction || focus == .principle {
            cases[index].status = "Second pass ready"
        }
    }

    private func persistWorkspace() {
        workspace.persist()
    }

    /// Center document edits land in the case immediately; the disk write is
    /// debounced so continuous typing does not thrash the store.
    private func updateCaseDocumentText(_ text: String) {
        guard let index = cases.firstIndex(where: { $0.id == selectedCaseID }) else { return }
        if (cases[index].documentText ?? "") == text { return }
        cases[index].documentText = text
        if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            emptyWorkbenchDismissed = true
        }
        documentPersistWork?.cancel()
        let work = DispatchWorkItem { persistWorkspace() }
        documentPersistWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: work)
    }

    private func handleCaptureRoute(_ outcome: CaptureURLRouteOutcome) {
        switch outcome {
        case .openCapture(let payload):
            startWebCapture(payload)
        case .decodeFailed, .emptyPayload:
            statusMessage = outcome.failureToast ?? "Capture failed"
        }
    }

    private func startWebCapture(_ payload: CaptureWebPayload) {
        let anchors = CaptureAnchorResolver.resolveForWebCapture(payload, preferredRootID: nil)
        guard let primary = anchors.first else {
            statusMessage = "Open a local source folder before capture"
            return
        }
        capturePayload = CapturePayload.makeFromWebPayload(payload, anchor: primary, available: anchors)
        statusMessage = "Capture ready"
    }

    private func handleCaptureSaved(_ url: URL) {
        let folder = url.deletingLastPathComponent().lastPathComponent
        statusMessage = "Captured to \(folder)"
        NotificationCenter.default.post(name: .loomCaptureSaved, object: nil)
        NotificationCenter.default.post(name: .loomRefreshActivePage, object: nil)
    }

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    private static func localSource(from url: URL) -> ReflectionSource {
        let ext = url.pathExtension.lowercased()
        let kind = ext.isEmpty ? "local file" : ext
        let size = localFileSize(url: url)
        let excerpt = localFileExcerpt(url: url, kind: kind, size: size)
        // Mint the security-scoped bookmark NOW, while the import grant
        // (panel / pasteboard / drag) is still alive — it is the only
        // moment the sandbox will let us.
        let bookmark = try? url.bookmarkData(
            options: .withSecurityScope,
            includingResourceValuesForKeys: nil,
            relativeTo: nil
        )

        return ReflectionSource(
            folder: "Input",
            label: url.lastPathComponent,
            kind: kind,
            meta: size,
            excerpt: excerpt,
            fileURL: url,
            bookmarkData: bookmark
        )
    }

    private static func nativeSessionSource(from capture: LoomExternalSelectionCapture) -> ReflectionSource? {
        let kind = captureKind(for: capture)
        let label = nativeContextSourceTitle(for: capture)
            ?? nativeSessionLabel(from: capture.sourceWindowTitle, kind: kind)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let fallbackLabel = capture.sourceApp.map { "\($0) selection" }
        let sourceLabel = [label, fallbackLabel]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first { !$0.isEmpty }
        guard let sourceLabel else { return nil }

        let appName = capture.sourceApp ?? "native app"
        return ReflectionSource(
            folder: "Input",
            label: sourceLabel,
            kind: kind.sourceKind,
            meta: appName,
            excerpt: "Native selection captured from \(appName). Original file remains in the source app.",
            fileURL: nil
        )
    }

    /// The capture destination, in priority order: the SELECTED learning
    /// project (the user's active initiation) → any learning project that
    /// already holds this source → the most recent learning project. Nil
    /// means "start a new project".
    private static func activeLearningCaseIndex(
        in cases: [ReflectionCase],
        selectedCaseID: String?,
        containing source: ReflectionSource
    ) -> Int? {
        if let selectedCaseID,
           let index = cases.firstIndex(where: { $0.id == selectedCaseID }),
           cases[index].project == "Learning pass" {
            return index
        }
        if let index = existingLearningCaseIndex(for: source, in: cases) {
            return index
        }
        return cases.firstIndex { $0.project == "Learning pass" }
    }

    private static func existingLearningCaseIndex(
        for source: ReflectionSource,
        in cases: [ReflectionCase]
    ) -> Int? {
        let sourceKey = sourceDeduplicationKey(source)
        return cases.firstIndex { reflectionCase in
            reflectionCase.title == source.label
                || reflectionCase.sources.contains { candidate in
                    sourceDeduplicationKey(candidate) == sourceKey
                }
        }
    }

    private static func sourceDeduplicationKey(_ source: ReflectionSource) -> String {
        if let path = source.fileURL?.standardizedFileURL.path {
            return "file:\(path)"
        }
        return "session:\(source.kind):\(source.label.lowercased())"
    }

    private static func learningProjectTitle(date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMM d"
        return "Learning · \(formatter.string(from: date))"
    }

    private static func learningCase(from sources: [ReflectionSource]) -> ReflectionCase {
        let fileOpeningLine: String
        if let primary = sources.first {
            let extraCount = max(0, sources.count - 1)
            fileOpeningLine = extraCount == 0
                ? "Opened original file for learning: \(primary.label)."
                : "Opened original file for learning: \(primary.label), plus \(extraCount) related files."
        } else {
            fileOpeningLine = "Learning project started. Capture from any native file (⌘⇧U) to attach it as a source."
        }
        var steps = ReflectionStep.blankWorkflow()
        steps[0].items = [
            fileOpeningLine,
            "First language pass: keep the original file surface primary and capture vocabulary, pronunciation, phrases, sentence meaning, grammar, questions, concepts, and page context as anchored traces."
        ]
        steps[5].title = "Principle"
        steps[5].subtitle = "What can become reusable thinking"

        return ReflectionCase(
            id: UUID().uuidString,
            // A project is named for the INITIATION, not the file — files are
            // sources inside it. The user can rename it to the real endeavor.
            title: Self.learningProjectTitle(),
            project: "Learning pass",
            status: "Reading",
            updatedAt: Self.timeFormatter.string(from: Date()),
            summary: "Original file remains primary. Loom records anchored learning traces around this document.",
            tags: ["learning", "sidecar"] + (sources.first.map { [$0.kind] } ?? []),
            sources: sources,
            steps: steps,
            messages: [
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Loom sidecar",
                    body: "Use native file tools first. Capture only selected words, phrases, questions, corrections, or principles that change your understanding."
                )
            ],
            touchedAt: Date()
        )
    }

    private static func selectionInputLine(
        capture: LoomExternalSelectionCapture,
        sourceLabel: String,
        kind: ReflectionCaptureKind,
        focus: ReflectionLearningFocus,
        inferredAnchor: ReflectionSourceAnchor?
    ) -> String {
        let selectedText = clippedSelectionText(capture.text)
        let evidence = selectionEvidenceLine(capture: capture, kind: kind, inferredAnchor: inferredAnchor)
        if selectedText.isEmpty {
            return "Captured \(kind.emptyInputNoun) from \(sourceLabel) [\(focus.label)].\n\(evidence)"
        }
        return "Captured \(kind.inputNoun(for: capture.text)) from \(sourceLabel) [\(focus.label)]: \(selectedText)\n\(evidence)"
    }

    private static func selectionEvidenceLine(
        capture: LoomExternalSelectionCapture,
        kind: ReflectionCaptureKind,
        inferredAnchor: ReflectionSourceAnchor?
    ) -> String {
        let fileNames = capture.fileURLs
            .filter { $0.isFileURL }
            .map(\.lastPathComponent)
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let evidenceFileName = fileNames.isEmpty ? inferredAnchor?.fileName : fileNames
        let anchorPrecision = selectionAnchorPrecision(capture: capture, kind: kind, inferredAnchor: inferredAnchor)
        let pairs: [(String, String?)] = [
            ("app", capture.sourceApp ?? "native macOS app"),
            ("window", capture.sourceWindowTitle),
            ("kind", kind.sourceKind),
            ("file", evidenceFileName?.isEmpty == false ? evidenceFileName : nil),
            ("bundle", capture.sourceBundleIdentifier),
            ("anchor precision", anchorPrecision),
            ("evidence rung", selectionEvidenceRung(for: anchorPrecision)),
            ("anchor note", selectionAnchorNote(for: anchorPrecision)),
            ("fallback note", selectionFallbackNote(for: anchorPrecision)),
            ("captured at", ISO8601DateFormatter().string(from: capture.capturedAt))
        ] + nativeContextEvidencePairs(capture.nativeContext)
            + inferredAnchorEvidencePairs(inferredAnchor)

        let body = pairs.compactMap { label, value -> String? in
            guard let cleaned = value?
                .replacingOccurrences(of: "\n", with: " ")
                .replacingOccurrences(of: ";", with: ",")
                .trimmingCharacters(in: .whitespacesAndNewlines),
                  !cleaned.isEmpty else {
                return nil
            }
            return "\(label)=\(cleaned)"
        }
        .joined(separator: "; ")

        return "Evidence: \(body)"
    }

    private static func selectionAnchorPrecision(
        capture: LoomExternalSelectionCapture,
        kind: ReflectionCaptureKind,
        inferredAnchor: ReflectionSourceAnchor?
    ) -> String {
        if let precision = capture.nativeContext?.anchorPrecision,
           !precision.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return precision
        }
        if let precision = inferredAnchor?.precision,
           !precision.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return precision
        }
        if !capture.fileURLs.filter(\.isFileURL).isEmpty {
            return "file"
        }
        if kind == .pdf,
           let windowTitle = capture.sourceWindowTitle,
           pdfPageNumber(from: windowTitle) != nil {
            return "window+page"
        }
        if capture.sourceWindowTitle != nil {
            return "window+time"
        }
        if capture.sourceApp != nil || capture.sourceBundleIdentifier != nil {
            return "app+time"
        }
        return "unknown"
    }

    private static func selectionAnchorNote(for precision: String) -> String? {
        switch precision.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "window+page":
            return "medium: page inferred from window title"
        case "window+time", "app+time":
            return "weak: precise file, page, or cell unavailable"
        case "unknown":
            return "weak: source app unavailable"
        default:
            return nil
        }
    }

    private static func selectionEvidenceRung(for precision: String) -> String {
        switch precision.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "file+cell":
            return "selected text + file + cell"
        case "file+page":
            return "selected text + file + page"
        case "file":
            return "selected text + file"
        case "window+page":
            return "selected text + window + page"
        case "window", "window+time":
            return "selected text + window + time"
        case "app", "app+time":
            return "selected text + app + time"
        default:
            return "selected text only"
        }
    }

    private static func selectionFallbackNote(for precision: String) -> String? {
        switch precision.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "file+cell", "file+page", "file":
            return nil
        case "window+page":
            return "verify source file before promoting this capture"
        case "window", "window+time", "app", "app+time", "unknown":
            return "use appshot, OCR, Vision, or manual confirmation before promoting"
        default:
            return "label precision before promoting"
        }
    }

    private static func shouldPromoteLearningInputAnchor(_ existing: String, candidate: String) -> Bool {
        candidate.range(of: #", page \d+"#, options: .regularExpression) != nil
            && existing.range(of: #", page \d+"#, options: .regularExpression) == nil
    }

    private static func nativeSessionLabel(from windowTitle: String?, kind: ReflectionCaptureKind) -> String? {
        guard let windowTitle else { return nil }
        if kind == .pdf, let documentTitle = pdfDocumentTitle(from: windowTitle) {
            return documentTitle
        }
        return windowTitle
    }

    private static func nativeContextSourceTitle(for capture: LoomExternalSelectionCapture) -> String? {
        capture.nativeContext?.documentURL?.lastPathComponent
            ?? capture.nativeContext?.documentTitle?.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func nativeContextAnchoredSourceLabel(
        for capture: LoomExternalSelectionCapture,
        kind: ReflectionCaptureKind
    ) -> String? {
        guard let context = capture.nativeContext else { return nil }
        let title = nativeContextSourceTitle(for: capture)
            ?? nativeSessionLabel(from: capture.sourceWindowTitle, kind: kind)
            ?? capture.sourceApp
        guard let title, !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }

        if kind == .spreadsheet {
            let sheetPrefix = context.sheetName.map { "\($0)!" } ?? ""
            if let cellRange = context.cellRange {
                return "\(title), \(sheetPrefix)\(cellRange)"
            }
        }

        if let page = context.pageNumber {
            return "\(title), page \(page)"
        }

        return title
    }

    private static func windowAnchoredSourceLabel(
        for capture: LoomExternalSelectionCapture,
        kind: ReflectionCaptureKind,
        includeWindowPage: Bool
    ) -> String? {
        guard kind == .pdf else { return capture.sourceWindowTitle }
        guard let windowTitle = capture.sourceWindowTitle,
              let documentTitle = pdfDocumentTitle(from: windowTitle) else {
            return capture.sourceWindowTitle
        }
        guard includeWindowPage else { return documentTitle }
        guard let page = pdfPageNumber(from: windowTitle) else {
            return documentTitle
        }
        return "\(documentTitle), page \(page)"
    }

    private static func inferredAnchorEvidencePairs(_ anchor: ReflectionSourceAnchor?) -> [(String, String?)] {
        guard let anchor else { return [] }
        return [
            ("page", anchor.pageNumber.map(String.init)),
            ("anchor method", anchor.method)
        ]
    }

    private static func nativeContextEvidencePairs(_ context: LoomNativeSourceContext?) -> [(String, String?)] {
        guard let context else { return [] }
        let page = context.pageNumber.map { pageNumber in
            if let pageCount = context.pageCount {
                return "\(pageNumber) of \(pageCount)"
            }
            return "\(pageNumber)"
        }

        return [
            ("path", context.documentURL?.path),
            ("page", page),
            ("sheet", context.sheetName),
            ("cell", context.cellRange),
            ("role", context.selectedRole)
        ]
    }

    private static func manualLearningInputLine(_ material: String, sourceLabel: String, focus: ReflectionCommitFocus) -> String {
        "Captured user trace from \(sourceLabel) [\(focus.captureLabel)]: \(clippedSelectionText(material))"
    }

    private static func latestLearningAnchor(in reflectionCase: ReflectionCase) -> String? {
        ReflectionLearningTrace.from(reflectionCase)
            .reversed()
            .first { trace in
                trace.isLanguageSelection || trace.isDataOrDocumentSelection
            }?
            .sourceAnchor
    }

    private static func selectionMessageBody(
        capture: LoomExternalSelectionCapture,
        sourceLabel: String,
        kind: ReflectionCaptureKind,
        focus: ReflectionLearningFocus,
        inferredAnchor: ReflectionSourceAnchor?
    ) -> String {
        let selectedText = clippedSelectionText(capture.text)
        let appLine = capture.sourceApp.map { "Source app: \($0)" } ?? "Source app: native macOS app"
        let windowLine = capture.sourceWindowTitle.map { "Window: \($0)" }
        let traceLine = "Trace type: \(kind.traceType(for: capture.text))"
        let passLine = "Pass: \(focus.passLabel)"
        let focusLine = "Learning focus: \(focus.label)"
        let precisionLine = "Anchor precision: \(selectionAnchorPrecision(capture: capture, kind: kind, inferredAnchor: inferredAnchor))"
        let statusLine = "Meaning status: needs user confirmation"
        let secondPassLine = "Second pass: not synthesized yet"
        let contextLines = ([appLine, windowLine, "Source: \(sourceLabel)", passLine, focusLine, precisionLine, statusLine, secondPassLine, traceLine] as [String?])
            .compactMap { $0 }
            .joined(separator: "\n")
        if selectedText.isEmpty {
            return contextLines
        }
        return "\(contextLines)\n\n\(selectedText)"
    }

    private static func learningFocus(
        for capture: LoomExternalSelectionCapture,
        kind: ReflectionCaptureKind
    ) -> ReflectionLearningFocus {
        ReflectionLearningFocus.infer(kind: kind, text: capture.text)
    }

    private enum ReflectionLearningFocus {
        case vocabulary
        case phrase
        case sentence
        case passage
        case data
        case document
        case slide
        case text
        case file

        var label: String {
            switch self {
            case .vocabulary:
                return "vocabulary / term"
            case .phrase:
                return "phrase meaning"
            case .sentence:
                return "sentence meaning"
            case .passage:
                return "passage meaning"
            case .data:
                return "data meaning"
            case .document:
                return "document meaning"
            case .slide:
                return "slide meaning"
            case .text:
                return "text meaning"
            case .file:
                return "file context"
            }
        }

        var passLabel: String {
            switch self {
            case .vocabulary, .phrase, .sentence, .passage:
                return "first language pass"
            case .data:
                return "data reading pass"
            case .document, .slide, .text, .file:
                return "source comprehension pass"
            }
        }

        static func infer(kind: ReflectionCaptureKind, text: String) -> ReflectionLearningFocus {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                return .file
            }

            switch kind {
            case .pdf:
                return inferPDFTextFocus(trimmed)
            case .spreadsheet:
                return .data
            case .document:
                return .document
            case .presentation:
                return .slide
            case .text:
                return .text
            case .file:
                return .text
            }
        }

        private static func inferPDFTextFocus(_ text: String) -> ReflectionLearningFocus {
            let words = text.split(whereSeparator: { $0.isWhitespace })
            let hasSentencePunctuation = text.rangeOfCharacter(from: CharacterSet(charactersIn: ".!?;:。！？；：")) != nil

            if words.count <= 1 {
                return .vocabulary
            }
            if words.count <= 5, !hasSentencePunctuation {
                return .phrase
            }
            if words.count <= 35 {
                return .sentence
            }
            return .passage
        }
    }


    private enum ReflectionCaptureKind: Equatable {
        case pdf
        case document
        case spreadsheet
        case presentation
        case text
        case file

        var sourceKind: String {
            switch self {
            case .pdf:
                return "pdf"
            case .document:
                return "document"
            case .spreadsheet:
                return "spreadsheet"
            case .presentation:
                return "presentation"
            case .text:
                return "text"
            case .file:
                return "native"
            }
        }

        func inputNoun(for text: String) -> String {
            switch self {
            case .pdf:
                return "PDF passage"
            case .document:
                return "document selection"
            case .spreadsheet:
                return Self.hasTabularSelection(text) ? "spreadsheet cells" : "spreadsheet selection"
            case .presentation:
                return "slide selection"
            case .text:
                return "text selection"
            case .file:
                return "native selection"
            }
        }

        var emptyInputNoun: String {
            switch self {
            case .pdf:
                return "PDF context"
            case .document:
                return "document context"
            case .spreadsheet:
                return "spreadsheet context"
            case .presentation:
                return "slide context"
            case .text:
                return "text file context"
            case .file:
                return "native file context"
            }
        }

        func traceType(for text: String) -> String {
            switch self {
            case .pdf:
                return "PDF passage"
            case .document:
                return "document selection"
            case .spreadsheet:
                return Self.hasTabularSelection(text) ? "spreadsheet cells" : "spreadsheet selection"
            case .presentation:
                return "slide selection"
            case .text:
                return "text selection"
            case .file:
                return text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "file context" : "native selection"
            }
        }

        static func infer(from capture: LoomExternalSelectionCapture) -> ReflectionCaptureKind {
            if let url = capture.fileURLs.first {
                return infer(fromExtension: url.pathExtension)
            }

            let appName = (capture.sourceApp ?? "").lowercased()
            if appName.contains("preview") { return .pdf }
            if appName.contains("word") || appName.contains("pages") { return .document }
            if appName.contains("excel") || appName.contains("numbers") { return .spreadsheet }
            if appName.contains("powerpoint") || appName.contains("keynote") { return .presentation }
            return .file
        }

        private static func infer(fromExtension value: String?) -> ReflectionCaptureKind {
            switch value?.lowercased() {
            case "pdf":
                return .pdf
            case "doc", "docx", "pages", "rtf", "rtfd":
                return .document
            case "xls", "xlsx", "csv", "tsv", "numbers":
                return .spreadsheet
            case "ppt", "pptx", "key":
                return .presentation
            case "txt", "md", "mdx", "markdown", "json", "xml", "html", "htm":
                return .text
            default:
                return .file
            }
        }

        private static func hasTabularSelection(_ text: String) -> Bool {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.contains("\t") || trimmed.split(whereSeparator: \.isNewline).count > 1
        }
    }

    private static func captureKind(for capture: LoomExternalSelectionCapture) -> ReflectionCaptureKind {
        ReflectionCaptureKind.infer(from: capture)
    }

    static func clippedSelectionText(_ text: String, maxLength: Int = 900) -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count > maxLength else { return trimmed }
        let end = trimmed.index(trimmed.startIndex, offsetBy: maxLength)
        return String(trimmed[..<end]) + "..."
    }

    private static func inferPDFAnchor(
        for capture: LoomExternalSelectionCapture,
        sources: [ReflectionSource]
    ) -> ReflectionSourceAnchor? {
        let query = normalizedAnchorText(capture.text)
        guard !query.isEmpty else { return nil }

        var matches: [(source: ReflectionSource, page: Int)] = []
        for source in sources {
            guard let url = source.fileURL,
                  url.pathExtension.lowercased() == "pdf",
                  let document = PDFDocument(url: url) else { continue }

            for pageIndex in 0..<document.pageCount {
                guard let pageText = document.page(at: pageIndex)?.string else { continue }
                if normalizedAnchorText(pageText).contains(query) {
                    matches.append((source, pageIndex + 1))
                }
            }
        }
        guard matches.count == 1, let match = matches.first else { return nil }
        return ReflectionSourceAnchor(
            label: "\(match.source.label), page \(match.page)",
            sourceID: match.source.id,
            fileName: match.source.label,
            pageNumber: match.page,
            precision: "file+page",
            method: "selected text matched one PDF page"
        )
    }

    private static func pdfDocumentTitle(from windowTitle: String) -> String? {
        var title = windowTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return nil }
        let pageSuffixPatterns = [
            #"[\s\p{Zs}]+[–—-][\s\p{Zs}]+Page[\s\p{Zs}]+\d+[\s\p{Zs}]+of[\s\p{Zs}]+\d+.*$"#,
            #"[\s\p{Zs}]+Page[\s\p{Zs}]+\d+[\s\p{Zs}]+of[\s\p{Zs}]+\d+.*$"#
        ]
        for pattern in pageSuffixPatterns {
            title = title.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
        }
        return title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? nil
            : title.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func pdfPageNumber(from windowTitle: String) -> Int? {
        let pattern = #"Page[\s\p{Zs}]+(\d+)[\s\p{Zs}]+of[\s\p{Zs}]+\d+"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(windowTitle.startIndex..<windowTitle.endIndex, in: windowTitle)
        guard let match = regex.firstMatch(in: windowTitle, range: range),
              match.numberOfRanges > 1,
              let pageRange = Range(match.range(at: 1), in: windowTitle) else {
            return nil
        }
        return Int(windowTitle[pageRange])
    }

    private static func normalizedAnchorText(_ text: String) -> String {
        let normalized = text
            .lowercased()
            .unicodeScalars
            .compactMap { scalar -> Character? in
                CharacterSet.alphanumerics.contains(scalar) ? Character(scalar) : nil
            }
        return String(normalized)
    }

    private static func localFileSize(url: URL) -> String {
        guard let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size]) as? NSNumber else {
            return "local"
        }

        let bytes = size.doubleValue
        if bytes < 1024 {
            return "\(Int(bytes)) B"
        }
        if bytes < 1024 * 1024 {
            return "\(Double(round((bytes / 1024) * 10) / 10)) KB"
        }
        return "\(Double(round((bytes / 1024 / 1024) * 10) / 10)) MB"
    }

    private static func localFileExcerpt(url: URL, kind: String, size: String) -> String {
        let textKinds: Set<String> = [
            "txt", "md", "mdx", "markdown", "csv", "json", "html", "htm", "css",
            "js", "jsx", "ts", "tsx", "swift", "py", "rb", "java", "c", "cpp",
            "h", "hpp", "go", "rs", "sql", "yaml", "yml", "xml", "rtf"
        ]

        if textKinds.contains(kind),
           let data = readPreviewBytes(from: url),
           let text = String(data: data.prefix(48_000), encoding: .utf8) {
            let excerpt = text
                .components(separatedBy: .whitespacesAndNewlines)
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            if !excerpt.isEmpty {
                return String(excerpt.prefix(520))
            }
        }

        return "Imported local file. Type: \(kind); size: \(size)."
    }

    private static func readPreviewBytes(from url: URL) -> Data? {
        guard let handle = try? FileHandle(forReadingFrom: url) else { return nil }
        defer { try? handle.close() }
        return try? handle.read(upToCount: 48_000)
    }
}

private struct ReflectionLeftEdgePeekZone: View {
    var body: some View {
        Rectangle()
            .fill(Color.white.opacity(0.001))
            .contentShape(Rectangle())
            .help("Hover to peek sidebar")
    }
}

// The Explorer (owner-directed left-rail redesign, 2026-07-03): a project
// explorer in the VSCode grammar — sticky uppercase sections with mono
// counts, dense two-line rows, hover-revealed actions — laid directly on
// the window's one pane of glass. Categorization is DERIVED (the
// "Learning pass" discriminator that already exists); store order is
// preserved (updatedAt is a display string, not a Date — never sort on it).
private struct ReflectionSidebar: View {
    @Environment(\.openWindow) private var openWindow
    /// The wiki (THE BOOK) grouped for the LIBRARY section, or nil when the
    /// wiki isn't staged in this build (then the section doesn't appear).
    private var wikiRail: [WikiRailSection]? {
        WikiCurriculum.loadBundled().map { WikiCurriculum.railSections(in: $0) }
    }
    // W2-2 (3-way IA): the destination picker at the top of the sidebar. The
    // current value drives the row highlight; selecting a row routes up so the
    // main-window detail switches.
    var destination: WorkspaceDestination = .workspace
    var onSelectDestination: (WorkspaceDestination) -> Void = { _ in }
    let cases: [ReflectionCase]
    let selectedCaseID: ReflectionCase.ID
    var panelsCase: ReflectionCase? = nil
    var onSelectTrace: ((ReflectionLearningTrace) -> Void)? = nil
    var panelPrinciples: [ReflectionPrincipleRecord] = []
    var onCitePrinciple: ((ReflectionPrincipleRecord.ID) -> Void)? = nil
    var onOpenPrinciple: ((ReflectionPrincipleRecord) -> Void)? = nil
    let onSelect: (ReflectionCase) -> Void
    let onCreate: () -> Void
    let onCreateLearning: () -> Void
    let onNewChat: () -> Void
    let onDelete: (ReflectionCase) -> Void
    let onRename: (ReflectionCase, String) -> Void
    // Chats-in-Projects (2026-07-05).
    var projects: [ReflectionProject] = []
    var onCreateProject: () -> Void = {}
    var onCreateCourse: () -> Void = {}
    var onAutoOrganizeCourse: (String) -> Void = { _ in }
    var onRenameProject: (String, String) -> Void = { _, _ in }
    var onDeleteProject: (String) -> Void = { _ in }
    var onNewChatInProject: (String) -> Void = { _ in }
    var onMoveChat: (ReflectionCase, String?) -> Void = { _, _ in }
    @State private var query: String = ""
    // Top-level sections are non-collapsible furniture now (owner 2026-07-05);
    // only projects nest + collapse (collapsedProjectIDs above).
    @State private var newChatHovering = false
    // Per-project collapse persists across relaunch (owner-audit 2026-07-05:
    // collapsing = "done with this for now"; @State lost it every launch).
    // @AppStorage can't hold a Set, so it rides as a JSON-array string.
    @AppStorage("loom.sidebar.collapsedProjectIDs") private var collapsedProjectIDsRaw: String = "[]"
    private var collapsedProjectIDs: Set<String> {
        get { Set((try? JSONDecoder().decode([String].self, from: Data(collapsedProjectIDsRaw.utf8))) ?? []) }
        nonmutating set {
            let data = (try? JSONEncoder().encode(Array(newValue).sorted())) ?? Data("[]".utf8)
            collapsedProjectIDsRaw = String(data: data, encoding: .utf8) ?? "[]"
        }
    }
    @FocusState private var searchFocused: Bool

    private var orderedProjects: [ReflectionProject] {
        projects.sorted { $0.order < $1.order }
    }

    private var projectIDSet: Set<String> { Set(projects.map(\.id)) }

    /// A chat's grouping key — nil (ungrouped) if it has no projectID or points
    /// at a project that no longer exists (defensive against dangling refs).
    private func groupID(for reflectionCase: ReflectionCase) -> String? {
        guard let id = reflectionCase.projectID, projectIDSet.contains(id) else { return nil }
        return id
    }

    private var visibleCases: [ReflectionCase] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !needle.isEmpty else { return cases }
        let matchingProjectIDs = Set(projects.filter { $0.name.lowercased().contains(needle) }.map(\.id))
        return cases.filter { item in
            ([item.title, item.project, item.summary] + item.tags)
                .contains { $0.lowercased().contains(needle) }
                || (item.projectID.map { matchingProjectIDs.contains($0) } ?? false)
        }
    }

    private func chats(inProject id: String) -> [ReflectionCase] {
        // Study index (2026-07-06): weeks inside a course read in STUDY order,
        // not recency — W 1, W 2, … W 10 (Finder-style numeric collation, so
        // "W 10" sorts after "W 2", not between "W 1" and "W 2"). Ungrouped
        // chats keep their recency order elsewhere.
        visibleCases
            .filter { groupID(for: $0) == id }
            .sorted { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
    }

    // CHATS + LEARNING sections show only UNGROUPED chats; a grouped chat lives
    // under its project instead (so it never appears twice).
    private var reflectionCases: [ReflectionCase] {
        visibleCases.filter { groupID(for: $0) == nil && $0.project != "Learning pass" }
    }

    private var learningCases: [ReflectionCase] {
        visibleCases.filter { groupID(for: $0) == nil && $0.project == "Learning pass" }
    }

    private var queryIsEmpty: Bool {
        query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    // Progressive disclosure (owner 2026-07-03: 这个设计是不行的 — the
    // scaffolding outweighed the content): chrome grows with content.
    // Sections exist only when their KIND exists in the workspace.
    private var hasLearningProjects: Bool {
        cases.contains { $0.project == "Learning pass" }
    }

    private var showsSectionHeaders: Bool {
        !projects.isEmpty || hasLearningProjects || !panelPrinciples.isEmpty
    }

    private func projectExpansion(_ id: String) -> Binding<Bool> {
        Binding(
            get: { !collapsedProjectIDs.contains(id) },
            set: { expanded in
                if expanded { collapsedProjectIDs.remove(id) } else { collapsedProjectIDs.insert(id) }
            }
        )
    }

    private var visiblePrinciples: [ReflectionPrincipleRecord] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !needle.isEmpty else { return panelPrinciples }
        return panelPrinciples.filter {
            $0.statement.lowercased().contains(needle)
                || $0.holdsWithin.lowercased().contains(needle)
                || $0.sourceCaseTitle.lowercased().contains(needle)
        }
    }

    var body: some View {
        // Judged 2026-07-03: a vertical rail for 3 icons spends 18% of the
        // rail's width on air and will collide with the center's future
        // activity bar. The distilled lesson (icons + tooltips over text
        // rows) lives in the bottom strip instead; the strip graduates to
        // a vertical rail only when workspace actions reach five.
        VStack(alignment: .leading, spacing: 0) {
            // W2-2: the 3-way top IA sits above the workspace navigator; it owns
            // the traffic-light top clearance now.
            destinationPicker
                .padding(.top, reflectionSidebarTopClearance)
                .padding(.bottom, 6)

            Divider()
                .padding(.horizontal, 12)
                .padding(.bottom, 6)

            ReflectionSidebarSearchField(text: $query, focus: $searchFocused)
                .padding(.horizontal, 10)
                .padding(.bottom, 6)

            newChatRow
                .padding(.horizontal, 8)
                .padding(.bottom, 8)

            ScrollView {
                LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
                    if !showsSectionHeaders {
                        // One kind of content, no ceremony: just the rows.
                        ForEach(reflectionCases) { reflectionCase in
                            sidebarRow(reflectionCase)
                        }
                    } else {
                        if !projects.isEmpty {
                            // Three-column division: the Projects section renders
                            // the pure rail tree — top-level projects (plain, OR a
                            // COURSE with one level of groups). A plain project has
                            // no groups and renders exactly as before (parity).
                            let tree = CourseOrganize.railTree(projects: projects, cases: cases)
                            Section(header: SidebarSectionHeader(
                                title: "Projects",
                                count: tree.count,
                                onAdd: onCreateProject
                            )) {
                                ForEach(tree, id: \.project.id) { node in
                                    let courseChats = chats(inProject: node.project.id)
                                    let groupChatTotal = node.groups.reduce(0) { $0 + chats(inProject: $1.group.id).count }
                                    SidebarProjectHeader(
                                        project: node.project,
                                        count: courseChats.count + groupChatTotal,
                                        isExpanded: projectExpansion(node.project.id),
                                        forceExpanded: !queryIsEmpty,
                                        onNewChat: { onNewChatInProject(node.project.id) },
                                        onRename: { onRenameProject(node.project.id, $0) },
                                        onDelete: { onDeleteProject(node.project.id) },
                                        onAutoOrganize: node.project.contentRootID != nil
                                            ? { onAutoOrganizeCourse(node.project.id) } : nil
                                    )
                                    if projectExpansion(node.project.id).wrappedValue || !queryIsEmpty {
                                        // A course's groups (e.g. weeks), each with
                                        // its chats — indented one level under the course.
                                        ForEach(node.groups, id: \.group.id) { groupNode in
                                            SidebarProjectHeader(
                                                project: groupNode.group,
                                                count: chats(inProject: groupNode.group.id).count,
                                                isExpanded: projectExpansion(groupNode.group.id),
                                                forceExpanded: !queryIsEmpty,
                                                onNewChat: { onNewChatInProject(groupNode.group.id) },
                                                onRename: { onRenameProject(groupNode.group.id, $0) },
                                                onDelete: { onDeleteProject(groupNode.group.id) }
                                            )
                                            .padding(.leading, 18)
                                            if projectExpansion(groupNode.group.id).wrappedValue || !queryIsEmpty {
                                                ForEach(chats(inProject: groupNode.group.id)) { reflectionCase in
                                                    sidebarRow(reflectionCase, indented: true)
                                                        .padding(.leading, 18)
                                                }
                                            }
                                        }
                                        // Chats directly under this project (a plain
                                        // project's drafts, or a chat returned to the course).
                                        if node.groups.isEmpty && courseChats.isEmpty {
                                            Text("No drafts yet")
                                                .font(.system(size: 11))
                                                .foregroundStyle(.tertiary)
                                                .padding(.leading, 48)
                                                .padding(.vertical, 4)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                        } else {
                                            ForEach(courseChats) { reflectionCase in
                                                sidebarRow(reflectionCase, indented: true)
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(.bottom, 2)
                        }
                        if !reflectionCases.isEmpty || !queryIsEmpty {
                            Section(header: SidebarSectionHeader(
                                title: "Drafts",
                                count: reflectionCases.count,
                                onAdd: onCreate
                            )) {
                                ForEach(reflectionCases) { reflectionCase in
                                    sidebarRow(reflectionCase)
                                }
                            }
                        }
                        if hasLearningProjects {
                            Section(header: SidebarSectionHeader(
                                title: "Learning",
                                count: learningCases.count,
                                onAdd: onCreateLearning
                            )
                            .padding(.top, 8)) {
                                ForEach(learningCases) { reflectionCase in
                                    sidebarRow(reflectionCase)
                                }
                            }
                        }
                        if !panelPrinciples.isEmpty {
                            // The workspace's ARCHITECTURE frame — appears
                            // with the first promoted principle.
                            Section(header: SidebarSectionHeader(
                                title: "Principles",
                                count: visiblePrinciples.count
                            )
                            .padding(.top, 8)) {
                                ForEach(visiblePrinciples) { record in
                                    SidebarPrincipleRow(record: record) {
                                        onOpenPrinciple?(record)
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.bottom, 1)
                                }
                            }
                        }
                        // LIBRARY — the owner's wiki (THE BOOK) brought into the
                        // workbench itself. A row per chapter-group; tapping one
                        // opens the reader at that group's first chapter (the
                        // reader's spine prev/next walks from there).
                        if let wikiRail, !wikiRail.isEmpty {
                            Section(header: SidebarSectionHeader(
                                title: "Library",
                                count: wikiRail.reduce(0) { $0 + $1.chapters.count }
                            )
                            .padding(.top, 8)) {
                                ForEach(wikiRail) { group in
                                    Button {
                                        guard let first = group.chapters.first else { return }
                                        // Routes to the Wiki DESTINATION (owner trio
                                        // 2026-07-10) — the root view observes and
                                        // switches the detail; no separate window.
                                        NotificationCenter.default.post(
                                            name: .loomOpenWikiChapter, object: nil,
                                            userInfo: ["slug": first.slug])
                                    } label: {
                                        HStack(spacing: 10) {
                                            Image(systemName: "book")
                                                .font(.system(size: 12))
                                                .foregroundStyle(.secondary)
                                                .frame(width: 22)
                                            Text(group.section)
                                                .font(.system(size: 13))
                                                .foregroundStyle(.primary)
                                                .lineLimit(1)
                                            Spacer(minLength: 0)
                                            Text("\(group.chapters.count)")
                                                .font(.system(size: 11, design: .monospaced))
                                                .foregroundStyle(.tertiary)
                                        }
                                        .padding(.leading, 8)
                                        .frame(height: 30)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    .padding(.horizontal, 8)
                                }
                            }
                            .padding(.bottom, 2)
                        }
                    }
                }
                .padding(.bottom, 8)
            }
            .overlay(alignment: .center) {
                if cases.isEmpty {
                    VStack(spacing: 0) {
                        Image(systemName: "tray")
                            .font(.system(size: 15))
                            .foregroundStyle(.tertiary)
                        Text("No files")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                            .padding(.top, 8)
                    }
                } else if !queryIsEmpty && visibleCases.isEmpty {
                    Text("No matches")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer(minLength: 0)

            if let panelsCase, panelsCase.project == "Learning pass" {
                WorkbenchSidebarPanels(
                    reflectionCase: panelsCase,
                    sectionText: LoomTokens.dsInk3,
                    rowText: LoomTokens.dsInk1,
                    subText: LoomTokens.dsInk3,
                    divider: LoomTokens.dsHair,
                    onSelectTrace: onSelectTrace,
                    principles: panelPrinciples,
                    onCitePrinciple: onCitePrinciple
                )
            }

            SidebarUtilityStrip(
                sourceCount: cases.reduce(0) { $0 + $1.sources.count },
                noteCount: cases.reduce(0) { $0 + $1.messages.filter { $0.role == .human }.count }
            )
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.clear)
        .background { hiddenShortcutButtons }
    }

    // SwiftUI caches a row's Menu/contextMenu content by identity, so a reused
    // ForEach row keeps a STALE "Move to" list when projects change in-session
    // (it only refreshed on relaunch). Fold the projects + this chat's own
    // membership into the row identity so the menu rebuilds when either changes.
    private var projectMenuFingerprint: String {
        projects.map { "\($0.id):\($0.name)" }.joined(separator: "|")
    }

    private func sidebarRow(_ reflectionCase: ReflectionCase, indented: Bool = false) -> some View {
        ReflectionSidebarRow(
            reflectionCase: reflectionCase,
            isSelected: reflectionCase.id == selectedCaseID,
            showsLeafIcon: !indented,
            projects: projects,
            onSelect: { onSelect(reflectionCase) },
            onDelete: { onDelete(reflectionCase) },
            onRename: { onRename(reflectionCase, $0) },
            onMoveToProject: { onMoveChat(reflectionCase, $0) }
        )
        .id("\(reflectionCase.id)#\(reflectionCase.projectID ?? "-")#\(projectMenuFingerprint)")
        // Inset the row 8pt so its selection/hover wash reads as a rounded pill
        // with an even margin — one grammar with New Draft + the project +
        // section rows (owner 2026-07-06: unify every wash to the inset pill).
        // The row's own internal leading-8 then lands the icon at the 16pt
        // column and the title at the 48pt name column, matching New Draft.
        .padding(.horizontal, 8)
        .padding(.bottom, 1)
    }

    // W2-2 (charter §3/§20): the 3-way top IA — Today · Workspace · You —
    // rendered as a small source-list group above the workspace navigator.
    // Selecting a row switches the main-window detail; ⌘1/⌘2/⌘3 do the same.
    private var destinationPicker: some View {
        VStack(spacing: 1) {
            ForEach(WorkspaceDestination.ordered) { dest in
                DestinationRow(
                    destination: dest,
                    isSelected: dest == destination,
                    onSelect: { onSelectDestination(dest) }
                )
            }
        }
        .padding(.horizontal, 8)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Destinations")
    }

    /// The primary create action (owner 2026-07-05), moved out of the bottom
    /// strip so there is exactly one draft entry. A trailing folder+ makes the
    /// first project before the Projects section exists.
    private var newChatRow: some View {
        HStack(spacing: 4) {
            Button(action: onNewChat) {
                HStack(spacing: 10) {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                        .frame(width: 22)
                    Text("New Draft")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.primary)
                    Spacer(minLength: 0)
                }
                .padding(.leading, 8)
                .frame(height: 34)
                .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .buttonStyle(.plain)
            .help("New draft")
            .background {
                // Hover-only .quinary — the one-pane glass law: no resting
                // opaque fills; the draft entry matches its neighbours.
                if newChatHovering {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(.quinary)
                }
            }
            .onHover { newChatHovering = $0 }
            .accessibilityLabel("New Draft")

            Menu {
                Button("New project", action: onCreateProject)
                Button("New course from folder…", action: onCreateCourse)
            } label: {
                Image(systemName: "folder.badge.plus")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(width: 30, height: 34)
                    .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.plain)
            .fixedSize()
            .help("New project or course")
            .accessibilityLabel("New project or course")
        }
    }

    // View-local shortcuts — zero new data, zero new callbacks. Docked and
    // peek sidebars are mutually exclusive, so these never double-register.
    private var hiddenShortcutButtons: some View {
        Group {
            Button("") { searchFocused = true }
                .keyboardShortcut("k", modifiers: .command)
            Button("", action: onCreate)
                .keyboardShortcut("n", modifiers: .command)
            Button("", action: onCreateLearning)
                .keyboardShortcut("n", modifiers: [.command, .shift])
        }
        .buttonStyle(.plain)
        .opacity(0)
        .frame(width: 0, height: 0)
        .accessibilityHidden(true)
    }
}

/// One row of the 3-way destination picker (W2-2). Matches the sidebar row
/// grammar — icon + title, plain button, the accent-wash selection pill, a
/// quinary hover — so the picker reads as one furniture with the navigator.
private struct DestinationRow: View {
    let destination: WorkspaceDestination
    let isSelected: Bool
    let onSelect: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 10) {
                Image(systemName: destination.systemImage)
                    .font(.system(size: 13))
                    .foregroundStyle(isSelected ? AnyShapeStyle(.primary) : AnyShapeStyle(.secondary))
                    .frame(width: 22)
                Text(destination.title)
                    .font(.system(size: 13, weight: isSelected ? .medium : .regular))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
            }
            .padding(.leading, 8)
            .frame(height: 30)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .background {
            // Same selection grammar as ReflectionSidebarRow: the accent wash
            // for selection, quinary for hover — Apple-tuned for every material.
            if isSelected {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.accentColor.opacity(0.18))
            } else if isHovering {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(.quinary)
            }
        }
        .onHover { hovering in
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { isHovering = hovering }
        }
        .help(destination.title)
        .accessibilityLabel(destination.title)
        // Stable, collision-free query handle for UI verification (the label
        // "Today"/"You" also appears on the surfaces themselves). Non-behavioral.
        .accessibilityIdentifier("destination.\(destination.rawValue)")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct SidebarSectionHeader: View {
    let title: String
    let count: Int
    // The section header exposes its own create action on hover — the mono
    // count yields to a quiet plus.
    var onAdd: (() -> Void)? = nil
    @State private var isHovering = false

    var body: some View {
        // Pure furniture (owner 2026-07-05: 图标语言优先 + drop the disclosure
        // chevron): no leading control, no collapse — the label just names the
        // group. Its text aligns to the same 40pt column as the row NAMES (a
        // 22pt leading spacer mirrors the icon column) so the left edge is one
        // clean grid; the folder/doc icons carry all the hierarchy.
        HStack(spacing: 10) {
            // Left-margin group header (owner reference 2026-07-05): the label
            // sits at the same left column as the project folder icons below,
            // names indent from there — one clean left edge, no mid-float.
            Text(title)
                .font(.system(size: 10.5))
                .foregroundStyle(.secondary)
                .padding(.leading, 6)
            Spacer(minLength: 0)
            if isHovering, let onAdd {
                Button(action: onAdd) {
                    Image(systemName: "plus")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("New in \(title)")
            } else {
                Text("\(count)")
                    .font(.system(size: 10.5, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.leading, 8)
        .padding(.trailing, 12)
        .frame(height: 26)
        .contentShape(Rectangle())
        .background {
            if isHovering, onAdd != nil {
                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(.quinary)
            }
        }
        .onHover { hovering in
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { isHovering = hovering }
        }
        // Match the row pills' 8pt margin so the section's hover pill and the
        // rows below it share one inset grid (owner 2026-07-06).
        .padding(.horizontal, 8)
    }
}

/// A collapsible Project group header — chevron + name + child-count, with a
/// hover "+" (new draft here) and a "···" overflow (new draft / rename / delete).
/// Reuses the SidebarSectionHeader grammar so the two-level hierarchy stays one
/// visual family on the glass. Delete never deletes chats — it ungroups them.
private struct SidebarProjectHeader: View {
    let project: ReflectionProject
    let count: Int
    @Binding var isExpanded: Bool
    let forceExpanded: Bool
    let onNewChat: () -> Void
    let onRename: (String) -> Void
    let onDelete: () -> Void
    /// Course-only: re-run Auto Organize against the bound folder. nil for
    /// groups and plain projects (the item then doesn't appear).
    var onAutoOrganize: (() -> Void)? = nil
    @State private var isHovering = false
    @State private var isEditing = false
    @State private var draft = ""
    @State private var confirmingDelete = false
    @FocusState private var fieldFocused: Bool

    private var showsExpanded: Bool { forceExpanded || isExpanded }

    private func beginRename() {
        draft = project.displayName
        isEditing = true
        fieldFocused = true
    }

    private func commitRename() {
        isEditing = false
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        // Only commit a REAL change — so a reverted/empty draft (e.g. after
        // Escape) can never silently rename the project (owner 2026-07-06).
        guard !trimmed.isEmpty, trimmed != project.displayName else { return }
        onRename(trimmed)
    }

    private func cancelRename() {
        draft = project.displayName   // discard edits so nothing can commit them
        isEditing = false
    }

    var body: some View {
        HStack(spacing: 10) {
            // No chevron (owner reference 2026-07-05): the folder glyph itself
            // carries open/closed — filled when showing its chats, hollow when
            // collapsed — and the whole row toggles. One clean left column.
            Image(systemName: showsExpanded ? "folder.fill" : "folder")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .frame(width: 22)

            if isEditing {
                TextField("Project name", text: $draft)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, weight: .medium))
                    .focused($fieldFocused)
                    .onSubmit { commitRename() }
                    .onExitCommand { cancelRename() }
                    // Focus RELIABLY once the field is actually in the tree —
                    // setting @FocusState in beginRename (before the field exists,
                    // esp. from the menu) silently failed, so rename never took
                    // keyboard focus and looked broken (owner 2026-07-06).
                    .onAppear { DispatchQueue.main.async { fieldFocused = true } }
            } else {
                Text(project.displayName)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }

            Spacer(minLength: 0)

            if isHovering {
                // Study index (2026-07-06): the week-count surfaces ONLY on
                // hover, beside the actions. A course at rest is just its name —
                // its weeks are the list right below it, so a resting "3" is
                // furniture the reader doesn't need.
                Text("\(count)")
                    .font(.system(size: 10.5, design: .monospaced))
                    .foregroundStyle(.tertiary)
                Button(action: onNewChat) {
                    Image(systemName: "plus")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help("New draft in this project")

                Menu {
                    Button("New draft here", action: onNewChat)
                    Button("Rename", action: beginRename)
                    if let onAutoOrganize {
                        Divider()
                        Button("Auto Organize", action: onAutoOrganize)
                    }
                    Divider()
                    Button("Delete project", role: .destructive) { confirmingDelete = true }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle())
                }
                .menuStyle(.borderlessButton)
                .menuIndicator(.hidden)
                .fixedSize()
            }
        }
        .padding(.leading, 8)
        .padding(.trailing, 12)
        .frame(height: 28)
        .contentShape(Rectangle())
        .onTapGesture(count: 2) { if !isEditing { beginRename() } }
        .onTapGesture { if !isEditing { isExpanded.toggle() } }
        .background {
            if isHovering {
                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(.quinary)
            }
        }
        .onHover { hovering in
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { isHovering = hovering }
        }
        // 8pt margin so the folder row's hover pill matches New Draft + the
        // chat rows — one inset-pill grammar (owner 2026-07-06).
        .padding(.horizontal, 8)
        .contextMenu {
            Button("New draft here", action: onNewChat)
            Button("Rename", action: beginRename)
            if let onAutoOrganize {
                Divider()
                Button("Auto Organize", action: onAutoOrganize)
            }
            Divider()
            Button("Delete project", role: .destructive) { confirmingDelete = true }
        }
        .confirmationDialog(
            "Delete project \u{201C}\(project.displayName)\u{201D}? Its drafts stay — they just become ungrouped.",
            isPresented: $confirmingDelete
        ) {
            Button("Delete project", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) {}
        }
    }
}

// The workspace action rail: vertical, icon-only, tooltips over text
// (owner-pointed reference 2026-07-03). Top: create. Bottom: identity
// (About) and Settings. Every icon wires real; the project count lives
// in the moon's tooltip.
// The utility strip (the reference's own horizontal bottom-bar form,
// distilled 2026-07-03): icon-only with tooltips, no explanatory text.
// Left: create. Right: identity (About, count in its tooltip), Settings.
// History ON the glass: the product-history timeline translated into the
// instrument room's own language — serif ink on the pane, a mono date
// rail, the tagline lineage as sediment. Content mirrors the web stage
// page (components/product-history/ProductHistoryPage.tsx); the stage
// keeps its cosmos, the instrument keeps its quiet.
private struct HistoryGlassSurface: View {
    let onClose: () -> Void

    private struct Stage {
        let display: String
        let title: String
        let note: String
    }

    private struct Tagline {
        let date: String
        let line: String
        let note: String
        var current: Bool = false
    }

    private let stages: [Stage] = [
        Stage(display: "2024 · 04", title: "Original Loom", note: "A private wiki connecting sources to insight."),
        Stage(display: "2026 · 04 · 15", title: "Source-bound system", note: "Source before interface."),
        Stage(display: "2026 · 04 · 17", title: "Structural mark", note: "The mark carries logic."),
        Stage(display: "2026 · 04 · 24", title: "Frontispiece", note: "Atmosphere needed proof."),
        Stage(display: "2026 · 06 · 02", title: "Personal Loom", note: "A real person, not a demo."),
        Stage(display: "2026 · 06 · 03", title: "Verified dossier", note: "Trust needs visible files."),
        Stage(display: "2026 · 06 · 04", title: "Evidence workspace", note: "Workflow became concrete."),
        Stage(display: "2026 · 06 · 04", title: "Reference instance", note: "Person first. System beneath."),
    ]

    private let taglines: [Tagline] = [
        Tagline(date: "2026 · 04 · 15", line: "A screen that replaces paper.", note: "Reading surface."),
        Tagline(date: "2026 · 04 · 17", line: "A reading and thinking environment.", note: "Thinking room."),
        Tagline(date: "2026 · 04 · 24", line: "A small room for slow reading.", note: "Slow atmosphere."),
        Tagline(date: "2026 · 06 · 02", line: "A personal knowledge display platform.", note: "Proof appears."),
        Tagline(date: "2026 · 06 · 11", line: "A living knowledge identity that can answer for you.", note: "Source-backed self. Living archive.", current: true),
    ]

    var body: some View {
        ZStack(alignment: .topTrailing) {
            ReflectionVisualEffectBackground(
                material: .popover,
                blendingMode: .withinWindow
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("History")
                            .font(.system(size: 26, weight: .semibold, design: .serif))
                            .foregroundStyle(.primary)
                        Text("2024 — PRESENT")
                            .font(.system(size: 10, design: .monospaced))
                            .tracking(2.0)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 18) {
                        ForEach(Array(stages.enumerated()), id: \.offset) { _, stage in
                            HStack(alignment: .firstTextBaseline, spacing: 18) {
                                Text(stage.display)
                                    .font(.system(size: 10.5, design: .monospaced))
                                    .foregroundStyle(.tertiary)
                                    .frame(width: 96, alignment: .trailing)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(stage.title)
                                        .font(.system(size: 16, weight: .semibold, design: .serif))
                                        .foregroundStyle(.primary)
                                    Text(stage.note)
                                        .font(.system(size: 13.5, design: .serif))
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        Text("Taglines")
                            .font(.system(size: 10, weight: .medium))
                            .kerning(2.6)
                            .textCase(.uppercase)
                            .foregroundStyle(.tertiary)
                        ForEach(Array(taglines.enumerated()), id: \.offset) { _, tagline in
                            HStack(alignment: .firstTextBaseline, spacing: 18) {
                                Text(tagline.date)
                                    .font(.system(size: 10.5, design: .monospaced))
                                    .foregroundStyle(.tertiary)
                                    .frame(width: 96, alignment: .trailing)
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 7) {
                                        Text(tagline.line)
                                            .font(.system(size: 14, design: .serif).italic())
                                            .foregroundStyle(tagline.current ? AnyShapeStyle(.primary) : AnyShapeStyle(.secondary))
                                        if tagline.current {
                                            Circle()
                                                .fill(Color.accentColor)
                                                .frame(width: 5, height: 5)
                                                .accessibilityLabel("Current")
                                        }
                                    }
                                    Text(tagline.note)
                                        .font(.system(size: 12, design: .serif))
                                        .foregroundStyle(.tertiary)
                                }
                            }
                        }
                    }
                    .padding(.bottom, 40)
                }
                .frame(maxWidth: 640, alignment: .leading)
                .padding(.horizontal, 48)
                .padding(.top, reflectionSidebarTopClearance)
                .frame(maxWidth: .infinity)
            }

            Button {
                onClose()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
                    .frame(width: 28, height: 28)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .help("Close (Esc)")
            .padding(.top, reflectionTitlebarContentTop + 4)
            .padding(.trailing, 14)
        }
        // Esc closes no matter where keyboard focus sits. Neither
        // onKeyPress nor keyboardShortcut(.cancelAction) fires here —
        // the document editor's NSTextView keeps first responder under
        // the glass and consumes Escape at the AppKit level — so trap
        // the event before dispatch (SelectableTextEditor ⌘K precedent).
        // The monitor's lifetime is the surface's: mounted with it,
        // removed with it.
        .background(EscapeKeyTrap(action: onClose))
        .accessibilityLabel("Product history")
    }
}

private struct EscapeKeyTrap: NSViewRepresentable {
    let action: () -> Void

    func makeNSView(context: Context) -> NSView {
        let view = EscapeTrapView()
        view.action = action
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        (nsView as? EscapeTrapView)?.action = action
    }

    private final class EscapeTrapView: NSView {
        var action: (() -> Void)?
        private var monitor: Any?

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            guard monitor == nil, window != nil else { return }
            monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
                guard let self, let window = self.window, event.window === window else { return event }
                // Escape = key code 53.
                if event.keyCode == 53 {
                    self.action?()
                    return nil
                }
                return event
            }
        }

        override func removeFromSuperview() {
            if let monitor { NSEvent.removeMonitor(monitor) }
            monitor = nil
            super.removeFromSuperview()
        }
    }
}

// The strip's moon avatar shows the BARE disc: applicationIconImage
// carries system margin around the squircle, so at 22pt the un-cropped
// canvas reads as a black blob. Overdraw past the margin (disc ≈ 57% of
// the canvas) and let the circle clip keep only the moon.
private struct MoonAvatar: View {
    var size: CGFloat = 22

    var body: some View {
        Image(nsImage: NSApp.applicationIconImage)
            .resizable()
            .interpolation(.high)
            .scaledToFill()
            .frame(width: size * 1.75, height: size * 1.75)
            .frame(width: size, height: size)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color(nsColor: .separatorColor), lineWidth: 1))
    }
}


private struct SidebarUtilityStrip: View {
    let sourceCount: Int
    let noteCount: Int
    @Environment(\.openWindow) private var openWindow
    @Environment(\.openSettings) private var openSettings
    @State private var identityHovering = false

    var body: some View {
        HStack(spacing: 8) {
            // Identity row — the bottom-left "self" entry, borrowing the
            // Codex/Claude/Atlas avatar→row pattern but ACCOUNT-FREE (LOOM is
            // local-first, no login). The whole left cluster is the door to your
            // evidenced self (dossier). "You" is literal — there is no account
            // name; person.crop.circle, never a photo/initials/brand moon. The
            // form A colophon is promoted to the honest subtitle (sources + notes).
            Button {
                openWindow(id: DossierWindow.id)
            } label: {
                HStack(spacing: 9) {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundStyle(.secondary)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("You")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.primary)
                        Text(ColophonStatus.text(sourceCount: sourceCount, noteCount: noteCount))
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                            .truncationMode(.tail)
                    }
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 5)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background {
                    if identityHovering {
                        RoundedRectangle(cornerRadius: 8, style: .continuous).fill(.quinary)
                    }
                }
                .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .buttonStyle(.plain)
            .onHover { identityHovering = $0 }
            .glassTooltip("You · your evidenced self — Local, on-device", anchor: .leading)

            // Settings stays a first-class, one-click entry (⌘, also global).
            // Distinct control from the identity door — VS Code's Accounts vs
            // Manage split. About lives in the App menu (macOS-standard home).
            SidebarRailIcon(
                systemImage: "gearshape",
                help: "Settings (⌘,)",
                tooltipAnchor: .trailing
            ) {
                openSettings()
            }
        }
        .padding(.horizontal, 8)
        .frame(minHeight: 50)
        .overlay(alignment: .top) {
            Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1)
        }
    }
}

private struct SidebarRailIcon: View {
    let systemImage: String
    let help: String
    var tooltipAnchor: TooltipNotch = .center
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(isHovering ? .primary : .secondary)
                .frame(width: 30, height: 30)
                .background {
                    if isHovering {
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .fill(.quinary)
                    }
                }
                .contentShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .glassTooltip(help, anchor: tooltipAnchor)
    }
}

// A macOS Dock–style tooltip: a glass bubble with a small downward pointer,
// shown above the element on hover (owner 2026-07-06: 被选中的玻璃提示要和系统
// 对齐 — match the Dock's "Loom" bubble instead of the plain .help() tooltip).
// .accessibilityLabel still carries the text for VoiceOver.
private enum TooltipNotch { case leading, center, trailing }

private struct GlassTooltipShape: Shape {
    var notch: TooltipNotch = .center
    var cornerRadius: CGFloat = 8
    var notchWidth: CGFloat = 13
    var notchHeight: CGFloat = 6

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let body = CGRect(
            x: rect.minX, y: rect.minY,
            width: rect.width, height: max(0, rect.height - notchHeight)
        )
        path.addRoundedRect(in: body, cornerSize: CGSize(width: cornerRadius, height: cornerRadius))
        // Keep the pointer under the icon: near the edge for a leading/trailing
        // anchor (an icon at the window's corner), centered otherwise.
        let inset = cornerRadius + notchWidth / 2 + 2
        let notchX: CGFloat
        switch notch {
        case .leading:  notchX = min(rect.minX + inset, rect.midX)
        case .center:   notchX = rect.midX
        case .trailing: notchX = max(rect.maxX - inset, rect.midX)
        }
        var tip = Path()
        tip.move(to: CGPoint(x: notchX - notchWidth / 2, y: body.maxY - 0.5))
        tip.addLine(to: CGPoint(x: notchX, y: rect.maxY))
        tip.addLine(to: CGPoint(x: notchX + notchWidth / 2, y: body.maxY - 0.5))
        tip.closeSubpath()
        path.addPath(tip)
        return path
    }
}

private struct GlassTooltipModifier: ViewModifier {
    let text: String
    let anchor: TooltipNotch
    @State private var isVisible = false
    @State private var pending: DispatchWorkItem?

    private var overlayAlignment: Alignment {
        switch anchor {
        case .leading:  return .topLeading
        case .center:   return .top
        case .trailing: return .topTrailing
        }
    }

    func body(content: Content) -> some View {
        content
            .onHover { hovering in
                pending?.cancel()
                if hovering {
                    let work = DispatchWorkItem {
                        withAnimation(.easeOut(duration: 0.12)) { isVisible = true }
                    }
                    pending = work
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.55, execute: work)
                } else {
                    withAnimation(.easeOut(duration: 0.1)) { isVisible = false }
                }
            }
            .overlay(alignment: overlayAlignment) {
                if isVisible {
                    Text(text)
                        .font(.system(size: 12))
                        .foregroundStyle(.primary)
                        .fixedSize()
                        .padding(.horizontal, 10)
                        .padding(.top, 5)
                        .padding(.bottom, 5 + 6) // room for the pointer
                        .background(.regularMaterial, in: GlassTooltipShape(notch: anchor))
                        .overlay {
                            GlassTooltipShape(notch: anchor)
                                .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
                        }
                        .shadow(color: .black.opacity(0.22), radius: 7, y: 3)
                        .fixedSize()
                        .alignmentGuide(.top) { $0[.bottom] }
                        .offset(y: -6)
                        .transition(.opacity)
                        .allowsHitTesting(false)
                }
            }
            .accessibilityLabel(text)
    }
}

private extension View {
    /// Dock-style glass tooltip on hover (replaces the plain `.help()` bubble).
    /// `anchor` keeps a corner icon's bubble inside the window: `.leading` for
    /// a left-edge icon, `.trailing` for a right-edge one, `.center` otherwise.
    func glassTooltip(_ text: String, anchor: TooltipNotch = .center) -> some View {
        modifier(GlassTooltipModifier(text: text, anchor: anchor))
    }
}

// The colophon: no account, no card — a hairline, the word "Local", and a
// machine count.
// A promoted principle in the workspace architecture: the owner's words
// (serif, even inside chrome) + machine meta; click jumps to its source
// project.
private struct SidebarPrincipleRow: View {
    let record: ReflectionPrincipleRecord
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 3) {
                Text(record.statement)
                    .font(.system(size: 12, design: .serif))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(record.holdsWithin.isEmpty ? record.sourceCaseTitle : record.holdsWithin)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .background {
                if isHovering {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(.quinary)
                }
            }
            .contentShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .help(record.sourceCaseTitle)
        .accessibilityLabel(record.statement)
    }
}

// (Removed SidebarIdentityFooter — the pre-decision bottom-left identity strip
// that was fully superseded by SidebarUtilityStrip's "You" row + gear. It had
// zero references. MoonAvatar stays; it's still used by the empty-workspace
// title badge.)

private struct WorkbenchSidebarPanels: View {
    let reflectionCase: ReflectionCase
    let sectionText: Color
    let rowText: Color
    let subText: Color
    let divider: Color
    let onSelectTrace: ((ReflectionLearningTrace) -> Void)?
    var principles: [ReflectionPrincipleRecord] = []
    var onCitePrinciple: ((ReflectionPrincipleRecord.ID) -> Void)? = nil
    @State private var outlineExpanded = true
    @State private var timelineExpanded = false
    @State private var principlesExpanded = false

    private var ownPrinciples: [ReflectionPrincipleRecord] {
        principles.filter { $0.sourceCaseID == reflectionCase.id }
    }

    private var reuseSuggestions: [ReflectionPrincipleRecord] {
        ReflectionPrincipleStore.reuseCandidates(for: reflectionCase, in: principles)
    }

    private var traces: [ReflectionLearningTrace] {
        ReflectionLearningTrace.from(reflectionCase)
    }

    private var orderedTraces: [ReflectionLearningTrace] {
        traces.enumerated().sorted { lhs, rhs in
            let lhsPage = lhs.element.pageNumber ?? Int.max
            let rhsPage = rhs.element.pageNumber ?? Int.max
            if lhsPage != rhsPage { return lhsPage < rhsPage }
            return lhs.offset < rhs.offset
        }.map(\.element)
    }

    private var timelineRows: [(label: String, detail: String)] {
        let captures = traces.filter { $0.isLanguageSelection || $0.isDataOrDocumentSelection }.count
        let meanings = traces.filter { $0.isUserCommitted && !["question", "correction", "principle"].contains($0.focus) }.count
        let corrections = traces.filter { $0.focus == "correction" }.count
        let questions = traces.filter { $0.focus == "question" }.count
        let principles = traces.filter { $0.focus == "principle" }.count
        var rows: [(String, String)] = []
        if captures + meanings > 0 {
            rows.append(("First pass", "\(captures) capture\(captures == 1 ? "" : "s") · \(meanings) meaning\(meanings == 1 ? "" : "s")"))
        }
        if corrections + questions + principles > 0 {
            rows.append(("Review pass", "\(corrections) correction\(corrections == 1 ? "" : "s") · \(questions) open · \(principles) principle\(principles == 1 ? "" : "s")"))
        }
        return rows
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            DisclosureGroup(isExpanded: $outlineExpanded) {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(orderedTraces.prefix(24)) { trace in
                        Button {
                            onSelectTrace?(trace)
                        } label: {
                            HStack(spacing: 7) {
                                Text(trace.pageAnchorLabel ?? "·")
                                    .font(.system(size: 9.5, weight: .medium, design: .monospaced))
                                    .foregroundStyle(subText)
                                    .frame(width: 30, alignment: .trailing)
                                Text(trace.displayText)
                                    .font(.system(size: 11.5))
                                    .lineLimit(1)
                                    .foregroundStyle(rowText)
                                Spacer(minLength: 0)
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .padding(.vertical, 3)
                    }
                }
                .padding(.top, 4)
            } label: {
                Text("OUTLINE")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(sectionText)
            }
            .tint(sectionText)
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
            .overlay(alignment: .top) {
                Rectangle().fill(divider).frame(height: 1)
            }

            DisclosureGroup(isExpanded: $timelineExpanded) {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(timelineRows, id: \.label) { row in
                        VStack(alignment: .leading, spacing: 1) {
                            Text(row.label)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(rowText)
                            Text(row.detail)
                                .font(.system(size: 10.5))
                                .foregroundStyle(subText)
                        }
                    }
                    if timelineRows.isEmpty {
                        Text("No passes yet")
                            .font(.system(size: 10.5))
                            .foregroundStyle(subText)
                    }
                }
                .padding(.top, 4)
            } label: {
                Text("TIMELINE")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(sectionText)
            }
            .tint(sectionText)
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
            .overlay(alignment: .top) {
                Rectangle().fill(divider).frame(height: 1)
            }

            if !ownPrinciples.isEmpty || !reuseSuggestions.isEmpty {
                // Stage 4 (融会贯通): the conclusions chapter of MY book across
                // all projects — constrained, cited, dated. A reuse suggestion
                // from another case is a QUIET DOT, never an interruption.
                DisclosureGroup(isExpanded: $principlesExpanded) {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(ownPrinciples) { principle in
                            VStack(alignment: .leading, spacing: 1) {
                                Text(principle.statement)
                                    .font(.system(size: 11))
                                    .lineLimit(2)
                                    .foregroundStyle(rowText)
                                Text("Holds within: \(principle.holdsWithin.isEmpty ? principle.sourceCaseTitle : principle.holdsWithin)")
                                    .font(.system(size: 10))
                                    .foregroundStyle(subText)
                            }
                        }
                        ForEach(reuseSuggestions) { principle in
                            HStack(alignment: .firstTextBaseline, spacing: 6) {
                                Circle()
                                    .fill(Color.accentColor)
                                    .frame(width: 5, height: 5)
                                    .padding(.top, 3)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(principle.statement)
                                        .font(.system(size: 11))
                                        .lineLimit(2)
                                        .foregroundStyle(rowText)
                                    HStack(spacing: 8) {
                                        Text("from \(principle.sourceCaseTitle)")
                                            .font(.system(size: 10))
                                            .foregroundStyle(subText)
                                        if let onCitePrinciple {
                                            Button("Cite") {
                                                onCitePrinciple(principle.id)
                                            }
                                            .buttonStyle(.plain)
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundStyle(Color.accentColor)
                                            .help("Cite this principle into the open project")
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.top, 4)
                } label: {
                    HStack(spacing: 6) {
                        Text("PRINCIPLES")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .tracking(1.2)
                            .foregroundStyle(sectionText)
                        if !reuseSuggestions.isEmpty {
                            Circle()
                                .fill(Color.accentColor)
                                .frame(width: 5, height: 5)
                                .accessibilityLabel("Reusable principles match this project")
                        }
                    }
                }
                .tint(sectionText)
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .overlay(alignment: .top) {
                    Rectangle().fill(divider).frame(height: 1)
                }
            }
        }
    }
}

// The floating edge-peek panel renders OVER center content (zIndex 0.75),
// so unlike the docked rail it keeps a painted backdrop — floating chrome
// may carry material; the glass law's "no column material" governs the
// docked rail only.
private struct ReflectionSidebarPeekBackdrop: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            ReflectionVisualEffectBackground(
                material: .popover,
                blendingMode: .withinWindow
            )
            Rectangle().fill(
                colorScheme == .light
                    ? LoomTokens.dsPaper.opacity(0.16)
                    : LoomTokens.dsPaperDeep.opacity(0.18)
            )
            LinearGradient(
                colors: [
                    Color.white.opacity(colorScheme == .light ? 0.28 : 0.09),
                    Color.clear
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .blendMode(.plusLighter)
            Rectangle()
                .fill(colorScheme == .light ? Color.white.opacity(0.62) : Color.white.opacity(0.11))
                .frame(width: 0.5)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .shadow(
            color: colorScheme == .light ? Color.black.opacity(0.07) : Color.black.opacity(0.22),
            radius: 34, x: 18, y: 0
        )
    }
}

private struct ReflectionReadingNoteBackdrop: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack(alignment: .leading) {
            Rectangle()
                .fill(
                    colorScheme == .dark
                        ? LoomTokens.dsPaperDeep.opacity(0.18)
                        : LoomTokens.dsPaper.opacity(0.36)
                )
            LinearGradient(
                colors: [
                    LoomTokens.dsPaperDeep.opacity(colorScheme == .dark ? 0.28 : 0.12),
                    Color.clear,
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(width: 124)
            Rectangle()
                .fill(LoomTokens.dsHair)
                .frame(width: 0.5)
        }
        .allowsHitTesting(false)
    }
}

private struct ReflectionMatteWorkbenchBackground: View {
    // Glass has nothing to transmit in fullscreen (only the space wallpaper
    // sits behind the window), so the material degrades into a muddy slab
    // (owner 2026-07-03: 这个设计在这里很廉价). The law: glass when there is
    // a world behind the window, deliberate ink when there is not.
    @State private var isFullScreen = false

    var body: some View {
        Group {
            if isFullScreen {
                // Fullscreen glass RETEST (owner 2026-07-03 night): the
                // fullscreen-specific material verdict was reached while
                // the window appearance was still pinned; under true
                // system-follow it renders a flat slate slab (廉价 again).
                // The same window material now reads correctly here too.
                ReflectionVisualEffectBackground(
                    material: .underWindowBackground,
                    blendingMode: .behindWindow
                )
            } else {
                // Glass law v2 (owner 2026-07-03): NO tint washes — the
                // window is the system glass itself, nothing added.
                // NSGlassEffectView as a full-window backing renders
                // near-solid (in-window lens, verified live) — window glass
                // stays on the material; Liquid Glass is reserved for
                // floating chrome above the workbench content.
                ReflectionVisualEffectBackground(
                    material: .underWindowBackground,
                    blendingMode: .behindWindow
                )
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSWindow.didEnterFullScreenNotification)) { _ in
            isFullScreen = true
        }
        .onReceive(NotificationCenter.default.publisher(for: NSWindow.didExitFullScreenNotification)) { _ in
            isFullScreen = false
        }
        .onAppear {
            isFullScreen = NSApp.windows.contains {
                $0.isKeyWindow && $0.styleMask.contains(.fullScreen)
            }
        }
    }
}

private struct ReflectionFrostedInspectorBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    private var frostTint: Color {
        colorScheme == .light ? LoomTokens.dsPaper.opacity(0.22) : LoomTokens.dsPaper.opacity(0.28)
    }

    var body: some View {
        // Glass law: transparent over the window's one root glass; the pane
        // resizer is the only seam line.
        Color.clear
    }
}

private struct ReflectionVisualEffectBackground: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        view.isEmphasized = true
        return view
    }

    func updateNSView(_ view: NSVisualEffectView, context: Context) {
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        view.isEmphasized = true
    }
}

private struct ReflectionSidebarSearchField: View {
    @Binding var text: String
    var focus: FocusState<Bool>.Binding

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .frame(width: 14)
            TextField("Search", text: $text)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .focused(focus)
            if !text.isEmpty {
                Button {
                    text = ""
                    focus.wrappedValue = true
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .help("Clear search")
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 28)
        // System semantics: hierarchical fill + system separator; the
        // system tunes both for every appearance and material.
        .background(.quinary, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .stroke(Color(nsColor: .separatorColor), lineWidth: 1)
        )
        // A window-mode change (fullscreen enter/exit) must never leave the
        // field holding first responder (caught live via computer-use).
        .onReceive(NotificationCenter.default.publisher(for: NSWindow.didEnterFullScreenNotification)) { _ in
            focus.wrappedValue = false
        }
        .onReceive(NotificationCenter.default.publisher(for: NSWindow.didExitFullScreenNotification)) { _ in
            focus.wrappedValue = false
        }
    }
}

private struct ReflectionSidebarRow: View {
    let reflectionCase: ReflectionCase
    let isSelected: Bool
    var showsLeafIcon: Bool = true
    var projects: [ReflectionProject] = []
    let onSelect: () -> Void
    let onDelete: () -> Void
    let onRename: (String) -> Void
    var onMoveToProject: (String?) -> Void = { _ in }
    @State private var isHovering = false
    @State private var isEditingTitle = false
    @State private var titleDraft = ""
    @State private var confirmingDelete = false
    @FocusState private var titleFieldFocused: Bool

    private func beginRename() {
        titleDraft = displayTitle
        isEditingTitle = true
        titleFieldFocused = true
    }

    private func commitRename() {
        isEditingTitle = false
        let trimmed = titleDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed != reflectionCase.title else { return }
        onRename(trimmed)
    }

    private func cancelRename() {
        titleDraft = displayTitle   // discard edits — Escape never commits
        isEditingTitle = false
    }

    private var isLearning: Bool { reflectionCase.project == "Learning pass" }

    private var displayTitle: String {
        guard reflectionCase.title == ReflectionCase.untitledPlaceholder else {
            return reflectionCase.title
        }
        if let sourceTitle = reflectionCase.sources.first?.label, !sourceTitle.isEmpty {
            return (sourceTitle as NSString).deletingPathExtension
        }
        return "Untitled draft"
    }

    // Built fresh each time the menu opens (unlike a reused row's cached
    // contextMenu), so the project list is always current.
    @ViewBuilder
    private var rowMoveToMenu: some View {
        if !projects.isEmpty || reflectionCase.projectID != nil {
            Menu("Move to") {
                ForEach(projects) { project in
                    Button(project.displayName) { onMoveToProject(project.id) }
                }
                if reflectionCase.projectID != nil {
                    Divider()
                    Button("Unfiled drafts") { onMoveToProject(nil) }
                }
            }
        }
    }

    private var openQuestionCount: Int {
        ReflectionLearningTrace.from(reflectionCase).filter { $0.focus == "question" }.count
    }

    // Study index (2026-07-06): the ONE resting study cue. Not a count — a
    // numberless amber mark meaning "an open question still lives here, come
    // back". Everything else (source count, timestamp) hides until hover.
    private var hasOpenQuestion: Bool { openQuestionCount > 0 }

    // Date-aware relative stamp — the core fix. `updatedAt` is a pre-formatted
    // "HH:mm" String that threw the day away; `touchedAt` is a real Date, so we
    // can say now / Today / Yesterday / Mon / Jul 3 / Jul '25. Legacy cases with
    // no touchedAt fall back to the old string until next touched.
    private var relativeStamp: String {
        guard let t = reflectionCase.touchedAt else { return reflectionCase.updatedAt }
        let cal = Calendar.current
        let now = Date()
        if now.timeIntervalSince(t) < 60 { return "now" }
        if cal.isDateInToday(t) { return "Today" }
        if cal.isDateInYesterday(t) { return "Yesterday" }
        if let days = cal.dateComponents([.day], from: t, to: now).day, days < 7 {
            return t.formatted(.dateTime.weekday(.abbreviated))
        }
        if cal.isDate(t, equalTo: now, toGranularity: .year) {
            return t.formatted(.dateTime.month(.abbreviated).day())
        }
        return t.formatted(.dateTime.month(.abbreviated).year(.twoDigits))
    }

    var body: some View {
        Button(action: onSelect) {
            HStack(alignment: .center, spacing: 10) {
                // Consistent left icon column: a top-level draft leads with a
                // subtle document/book glyph aligned to the project-icon column;
                // a draft nested under a project stays icon-less because the
                // folder above it carries the grouping signal.
                if showsLeafIcon {
                    Image(systemName: isLearning ? "book" : "doc.text")
                        .font(.system(size: 12))
                        .foregroundStyle(isSelected ? AnyShapeStyle(.primary) : AnyShapeStyle(.secondary))
                        .frame(width: 22)
                } else {
                    Color.clear.frame(width: 22, height: 1)
                }

                HStack(spacing: 8) {
                    if isEditingTitle {
                        TextField("Draft name", text: $titleDraft)
                            .textFieldStyle(.plain)
                            .font(.system(size: 13, weight: .medium))
                            .focused($titleFieldFocused)
                            .onSubmit { commitRename() }
                            .onExitCommand { cancelRename() }
                            // Focus reliably once the field exists (see the
                            // project row) — the synchronous focus in
                            // beginRename silently failed, esp. from the menu.
                            .onAppear { DispatchQueue.main.async { titleFieldFocused = true } }
                    } else {
                        Text(displayTitle)
                            .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .truncationMode(.tail)
                            .onTapGesture(count: 2) { beginRename() }
                    }
                    Spacer(minLength: 0)
                    // The study index (2026-07-06): a week is one 30pt line —
                    // its name. At rest the ONLY mark is a numberless amber
                    // question cue when an open question remains (no doc/HH:mm
                    // counts). On hover the metadata slot reveals `source ·
                    // relative-date`; the ⋯ menu overlays the reserved trailing.
                    if isHovering {
                        // Just the date at hover (owner 2026-07-06: "时间显示效果不好").
                        // The source name over-truncated to "W...s" in this narrow
                        // rail and the stamp wrapped mid-digit — so the source is
                        // dropped (it belongs in the reader, not the index) and the
                        // stamp is pinned to ONE non-wrapping line.
                        Text(relativeStamp)
                            .font(.system(size: 10.5, design: .monospaced))
                            .foregroundStyle(isSelected ? AnyShapeStyle(.secondary) : AnyShapeStyle(.tertiary))
                            .lineLimit(1)
                            .fixedSize()
                    } else if hasOpenQuestion {
                        Image(systemName: "questionmark.circle")
                            .font(.system(size: 10))
                            .foregroundStyle(LoomTokens.dsWarning)
                    }
                }
                // When the ⋯ menu appears at the trailing edge on hover, the
                // text column yields to it (VSCode label behavior). Resting
                // trailing 12 matches the project + section-count inset.
                .padding(.trailing, isHovering ? 34 : 12)
            }
            .padding(.leading, 8)
            // Study index: every week is one constant single line — the
            // two-line facts form (📄 N / ❓ N / HH:mm) is gone.
            .frame(height: 30)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .overlay(alignment: .trailing) {
            if isHovering {
                Menu {
                    Button("Rename") { beginRename() }
                    rowMoveToMenu
                    Button("Delete", role: .destructive) { confirmingDelete = true }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle())
                }
                .menuStyle(.borderlessButton)
                .menuIndicator(.hidden)
                .fixedSize()
                .padding(.trailing, 8)
            }
        }
        .background {
            // System semantics: selection is the system's unemphasized
            // sidebar-selection color; hover is the quinary fill. Both are
            // Apple-tuned for every appearance and material.
            if isSelected {
                // Glass-language selection (owner 2026-07-03): a translucent
                // wash of the system accent — alive like the emphasized
                // selection, transparent like glass. (.selection material
                // emphasized renders opaque accent — measured live.)
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.accentColor.opacity(0.18))
            } else if isHovering {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(.quinary)
            }
        }
        .onHover { hovering in
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) { isHovering = hovering }
        }
        .contextMenu {
            Button("Rename") { beginRename() }
            rowMoveToMenu
            Button("Delete", role: .destructive) { confirmingDelete = true }
        }
        .confirmationDialog(
            "Delete \u{201C}\(displayTitle)\u{201D}?",
            isPresented: $confirmingDelete
        ) {
            Button("Delete", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) {}
        }
        .help(reflectionCase.summary.isEmpty ? displayTitle : reflectionCase.summary)
        .accessibilityLabel(displayTitle)
        .accessibilityValue(openQuestionCount > 0 ? "\(openQuestionCount) open questions" : "")
    }
}

// The glass reading document (owner-approved synthesis 2026-07-03):
// the owner's words flow directly on the glass in the system serif;
// captured evidence rides as solid paper cards (the original's material);
// the true no-material workspace uses a separate launcher surface.
private struct GlassReadingCenter: View {
    let reflectionCase: ReflectionCase
    let selectedSourceID: ReflectionSource.ID?
    let isReadingSource: Bool
    let isWorkspaceEmpty: Bool
    @Binding var draftText: String
    @Binding var commitFocus: ReflectionCommitFocus
    let onSelectTrace: (ReflectionLearningTrace) -> Void
    var onPromotePrinciple: ((String) -> Void)? = nil
    let onSubmit: () -> Void
    let onDocumentTextChange: (String) -> Void
    let onImportFiles: ([URL]) -> [ReflectionSource]
    let onImportLocalSources: () -> Void
    let onCreateReflection: () -> Void
    let onCreateLearningProject: () -> Void
    let onOpenSourceID: (ReflectionSource.ID) -> Void
    @State private var editorFocusRequest = 0
    @State private var headingJumpTarget: Int?

    private var contentSteps: [ReflectionStep] {
        // Machine import logs ("Imported local source: … Type: pdf; size: …")
        // are chrome, not the book (owner 2026-07-06 — cover the chrome test).
        // Drop them at render; the source lives quietly in the provenance line +
        // the right rail. Steps that are ONLY import logs disappear entirely.
        reflectionCase.steps.compactMap { step in
            let kept = step.items.filter { !$0.hasPrefix("Imported local source:") }
            guard !kept.isEmpty else { return nil }
            guard kept.count != step.items.count else { return step }
            return ReflectionStep(id: step.id, title: step.title, subtitle: step.subtitle, items: kept)
        }
    }

    /// Block A provenance: the source(s) this note is about, as a whisper-quiet
    /// one-liner under the title — not a machine "INPUT" import log.
    private var provenanceLabel: String? {
        let labels = reflectionCase.sources.map(\.label).filter { !$0.isEmpty }
        return labels.isEmpty ? nil : labels.joined(separator: " · ")
    }

    private var traces: [ReflectionLearningTrace] {
        ReflectionLearningTrace.from(reflectionCase)
    }

    /// The-book ordering (owner north star): captured evidence reads in the
    /// SOURCE's own order — by page — not in capture (clock) order, so the note
    /// re-presents the source's structure. Stable: same-page captures keep their
    /// capture order; page-less traces sink to the end. Mirrors the existing
    /// page comparator used by the (dead) digest surface — now on the LIVE center.
    private var orderedTraces: [ReflectionLearningTrace] {
        traces.enumerated().sorted { lhs, rhs in
            let lhsPage = lhs.element.pageNumber ?? Int.max
            let rhsPage = rhs.element.pageNumber ?? Int.max
            if lhsPage != rhsPage { return lhsPage < rhsPage }
            return lhs.offset < rhs.offset
        }.map(\.element)
    }

    private var isLearningCase: Bool {
        reflectionCase.project == "Learning pass"
    }

    private var documentText: String {
        reflectionCase.documentText ?? ""
    }

    /// The live outline mirrors the WRITTEN document's heading structure.
    private var documentHeadings: [DocumentHeading] {
        GlassDocumentEditor.documentHeadings(in: documentText)
    }

    /// A case with nothing in it yet — the editor takes focus so the
    /// blinking insertion point is the whole invitation. No emblem, no words.
    private var isBlankCase: Bool {
        contentSteps.isEmpty && traces.isEmpty && documentText.isEmpty
    }

    private var contentMaxWidth: CGFloat {
        isReadingSource ? reflectionReadingNoteContentMaxWidth : 640
    }

    private var contentLeadingPadding: CGFloat {
        isReadingSource ? reflectionReadingNoteContentLeading : 48
    }

    private var contentTrailingPadding: CGFloat {
        isReadingSource ? reflectionReadingNoteContentTrailing : 48
    }

    private var contentOuterAlignment: Alignment {
        isReadingSource ? .leading : .center
    }

    private var shouldShowSourceList: Bool {
        !reflectionCase.sources.isEmpty
    }

    var body: some View {
        ZStack {
            if isWorkspaceEmpty {
                WorkbenchEmptyLauncher(
                    onImportFiles: onImportLocalSources,
                    onCreateReflection: onCreateReflection,
                    onCreateLearningProject: onCreateLearningProject
                )
            } else {
                VStack(spacing: 0) {
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 28) {
                                // The heading shows the case's REAL title. While
                                // it is still the untouched "Untitled product
                                // reflection" placeholder, show nothing — the
                                // blank case is an invitation, not a stage (owner
                                // 2026-07-06: 初始不要这个文字). The title appears
                                // once the user names the chat.
                                // Title + Block A provenance, tight (owner 2026-07-06):
                                // the source is a whisper-quiet one-liner under the
                                // title, replacing the machine "INPUT: Imported local
                                // file. Type: pdf; size…" log. Empty for a blank,
                                // unnamed case — the invitation is the cursor.
                                // NAMED case only: the note shows its title and a
                                // whisper-quiet source line under it. UNNAMED →
                                // NOTHING: the top bar already shows the source
                                // name, so a provenance line here just repeats it
                                // (owner 2026-07-06: 去掉重复信息), and a blank case
                                // is an invitation — the cursor is the whole of it.
                                if reflectionCase.title != ReflectionCase.untitledPlaceholder {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(reflectionCase.title)
                                            .font(.system(size: 26, weight: .semibold, design: .serif))
                                            .foregroundStyle(.primary)
                                        if let provenanceLabel {
                                            // The source is a whisper-quiet one-liner under the
                                            // title, and it now carries the Open affordance: the
                                            // SOURCE card is gone (owner 2026-07-07 — it just
                                            // repeated the main bar + this line and put a source
                                            // list in the center). The right pane stays a
                                            // project↔world bridge, NOT a source list (owner
                                            // 2026-07-03 scope law), so the source's reader home is
                                            // Open, not a right-rail list.
                                            let provenanceGlyph = HStack(spacing: 5) {
                                                Image(systemName: "book")
                                                    .font(.system(size: 10))
                                                Text(provenanceLabel)
                                                    .font(.system(size: 12, design: .serif))
                                            }
                                            .foregroundStyle(.tertiary)
                                            if reflectionCase.sources.count > 1 {
                                                // Multiple sources: the line named them all but
                                                // used to open only one (:4790 audit). A quiet menu
                                                // lets each source open its own reader.
                                                Menu {
                                                    ForEach(reflectionCase.sources) { source in
                                                        Button(source.label) { onOpenSourceID(source.id) }
                                                    }
                                                } label: {
                                                    provenanceGlyph
                                                }
                                                .buttonStyle(.plain)
                                                .menuIndicator(.hidden)
                                                .fixedSize()
                                                .help("Open a source")
                                            } else {
                                                Button {
                                                    if let sourceID = selectedSourceID ?? reflectionCase.sources.first?.id {
                                                        onOpenSourceID(sourceID)
                                                    }
                                                } label: {
                                                    provenanceGlyph
                                                }
                                                .buttonStyle(.plain)
                                                .help("Open source")
                                            }
                                        }
                                    }
                                    .padding(.top, 8)
                                }

                                // The document IS the input: writing happens
                                // directly on the glass, not in a box below.
                                GlassDocumentEditor(
                                    caseID: reflectionCase.id,
                                    text: documentText,
                                    focusRequest: editorFocusRequest,
                                    jumpTarget: $headingJumpTarget,
                                    sources: reflectionCase.sources,
                                    onTextChange: onDocumentTextChange,
                                    onImportFiles: onImportFiles,
                                    onOpenSource: onOpenSourceID
                                )

                                // Book order, not clock order (owner north star):
                                // evidence reads by the source's own page sequence.
                                ForEach(orderedTraces) { trace in
                                    EvidencePaperCard(trace: trace) {
                                        onSelectTrace(trace)
                                    }
                                }

                                // The raw INPUT step log is gone (owner 2026-07-07): captured
                                // passages + manual entries already surface as EvidencePaperCards
                                // above (ReflectionLearningTrace.from parses them); only the
                                // non-parsing machine process lines lived here, and those are
                                // chrome, not the book. (evidence→document is a later transform.)
                            }
                            .frame(maxWidth: contentMaxWidth, alignment: .leading)
                            .padding(.leading, contentLeadingPadding)
                            .padding(.trailing, contentTrailingPadding)
                            .padding(.top, reflectionSidebarTopClearance)
                            .padding(.bottom, 32)
                            .frame(maxWidth: .infinity, alignment: contentOuterAlignment)
                        }
                        // Scrolled content dissolves before it reaches the top
                        // chrome: an alpha mask, not a painted scrim — nothing
                        // is drawn ON the glass, the ink itself fades.
                        .mask(
                            VStack(spacing: 0) {
                                LinearGradient(
                                    colors: [Color.black.opacity(0), .black],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                                // 52 (≈ top chrome), not 72: resting content clears
                                // the bar by 60, so it stays fully opaque and a
                                // capture card at the document top no longer looks
                                // clipped; only scrolled ink dissolves (owner 2026-07-06).
                                .frame(height: 52)
                                Rectangle().fill(Color.black)
                            }
                        )
                        .overlay(alignment: .topTrailing) {
                            // The quiet right-edge outline: the WRITTEN
                            // document's headings first (click scrolls the
                            // reading pane to the line), then any structured
                            // step sections below the editor.
                            if !isReadingSource, documentHeadings.count > 1 {
                                VStack(alignment: .trailing, spacing: 8) {
                                    ForEach(documentHeadings) { heading in
                                        Button {
                                            headingJumpTarget = heading.id
                                        } label: {
                                            Text(heading.title)
                                                .font(.system(
                                                    size: heading.level == 1 ? 10.5 : 10,
                                                    weight: heading.level == 1 ? .medium : .regular
                                                ))
                                                .foregroundStyle(.tertiary)
                                                .lineLimit(1)
                                                .padding(.trailing, CGFloat(heading.level - 1) * 8)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.top, reflectionSidebarTopClearance + 8)
                                .padding(.trailing, 14)
                                .frame(width: 132, alignment: .trailing)
                            }
                        }
                    }

                    // Owner directive 2026-07-03: the reflection composer box is
                    // gone — the document is the writing surface. Learning keeps
                    // its typed-trace commit strip (a different function).
                    if isLearningCase {
                        ReflectionComposer(
                            text: $draftText,
                            commitFocus: $commitFocus,
                            placeholder: composerPlaceholder,
                            isLearningCase: true,
                            onSubmit: onSubmit
                        )
                        .frame(maxWidth: 640)
                        .padding(.horizontal, 32)
                        .padding(.top, 6)
                        .padding(.bottom, 14)
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
        // The editor is a quiet writing surface. The woven glass moon belongs
        // only to the true no-files launcher, never under a blank document.
        .contentShape(Rectangle())
        .onTapGesture {
            if !isWorkspaceEmpty { editorFocusRequest += 1 }
        }
        .onAppear {
            if isBlankCase && !isWorkspaceEmpty { editorFocusRequest += 1 }
        }
        .onChange(of: reflectionCase.id) {
            if isBlankCase && !isWorkspaceEmpty { editorFocusRequest += 1 }
        }
        // ⌘2 — focus the document column (three-column charter).
        .onReceive(NotificationCenter.default.publisher(for: .loomFocusDocument)) { _ in
            if !isWorkspaceEmpty { editorFocusRequest += 1 }
        }
    }

    private var composerPlaceholder: String {
        switch commitFocus {
        case .meaning: return "Add your meaning..."
        case .question: return "What's unclear? Add \u{201C}closes when: ...\u{201D} to set the open condition"
        case .correction: return "What did you get wrong — and what is right now?"
        case .principle: return "What holds beyond this file?"
        }
    }
}

/// The destination of a clicked note-anchor: a source file + the page/rect to
/// scroll the in-app PDF viewer to.
/// Locates a captured text passage inside a registered PDF source and returns
/// its 0-based page + rect — the SAME PDFKit coordinate the in-app reader jumps
/// with, so a Preview capture highlights exactly like an in-app hover ❕.
/// System Preview never vends a selection rect; we recover it here by searching
/// LOOM's own copy of the file. Shared by the AppDelegate (quiet-route
/// decision) and the workbench root (the actual landing).
enum ReflectionPassageAnchoring {
    /// 0-based page + rect of `text` within one of `sources`, or nil.
    /// Pass 1 — exact `findString` (case/diacritic-insensitive) → page + rect.
    /// Pass 2 — normalized substring page match → page, rect `.zero`.
    /// `pageHint` is 1-based (from a "Page N of M" title) to disambiguate
    /// duplicate matches.
    /// Opens the source's PDF, resolving the security-scoped bookmark first —
    /// under sandbox the bare fileURL is unreadable unless we re-enter the
    /// bookmark's access scope (same pattern jumpToAnchor uses).
    static func openDocument(for source: ReflectionSource) -> PDFDocument? {
        guard let baseURL = source.fileURL,
              baseURL.pathExtension.lowercased() == "pdf" else { return nil }
        var url = baseURL
        if let bookmark = source.bookmarkData {
            var isStale = false
            if let scoped = try? URL(
                resolvingBookmarkData: bookmark,
                options: .withSecurityScope,
                relativeTo: nil,
                bookmarkDataIsStale: &isStale
            ) {
                _ = scoped.startAccessingSecurityScopedResource()
                url = scoped
            }
        }
        return PDFDocument(url: url)
    }

    /// Honest, typed result (owner-audit 2026-07-05): the loop must never
    /// overclaim. `.exact` = findString gave a real rect the reader can
    /// highlight; `.pageOnly` = only a fuzzy/normalized page match (rect
    /// unknown, reader lands at page top); `.notFound` = no registered PDF
    /// contains it (caller falls back to the generic capture path).
    static func resolve(
        text: String,
        sources: [ReflectionSource],
        pageHint: Int?
    ) -> AnchorResolution {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else { return .notFound }
        let pdfs: [(source: ReflectionSource, doc: PDFDocument)] = sources.compactMap { source in
            guard let doc = openDocument(for: source) else { return nil }
            return (source, doc)
        }
        guard !pdfs.isEmpty else { return .notFound }

        for (source, doc) in pdfs {
            let hits = doc.findString(trimmed, withOptions: [.caseInsensitive, .diacriticInsensitive])
            guard !hits.isEmpty else { continue }
            let chosen: PDFSelection
            if let hint = pageHint,
               let hinted = hits.first(where: { sel in
                   guard let page = sel.pages.first else { return false }
                   return doc.index(for: page) == hint - 1
               }) {
                chosen = hinted
            } else {
                chosen = hits[0]
            }
            if let page = chosen.pages.first {
                return .exact(sourceID: source.id, page: doc.index(for: page), rect: chosen.bounds(for: page))
            }
        }

        // Ligature/hyphenation-tolerant page fallback (normalize decomposes
        // ﬁ→fi and strips soft hyphens + line-break hyphens).
        let query = normalize(trimmed)
        guard !query.isEmpty else { return .notFound }
        for (source, doc) in pdfs {
            for pageIndex in 0..<doc.pageCount {
                guard let pageText = doc.page(at: pageIndex)?.string else { continue }
                if normalize(pageText).contains(query) {
                    return .pageOnly(sourceID: source.id, page: pageIndex)
                }
            }
        }
        return .notFound
    }

    /// Fast yes/no for the AppDelegate quiet-route decision — consistent with
    /// resolve() so the companion is skipped exactly when the passage anchors.
    static func matches(text: String, sources: [ReflectionSource]) -> Bool {
        if case .notFound = resolve(text: text, sources: sources, pageHint: nil) { return false }
        return true
    }

    static func normalize(_ text: String) -> String {
        // Compatibility mapping (NFKC) decomposes Latin ligatures (ﬁ→fi, ﬂ→fl)
        // so a copied "efficient" matches a rendered "eﬃcient".
        String(text.precomposedStringWithCompatibilityMapping.lowercased().unicodeScalars.compactMap {
            CharacterSet.alphanumerics.contains($0) ? Character($0) : nil
        })
    }
}

enum AnchorResolution {
    case exact(sourceID: String, page: Int, rect: CGRect)
    case pageOnly(sourceID: String, page: Int)
    case notFound
}

private struct AnchorPreviewTarget: Identifiable {
    let sourceID: String
    let fileURL: URL
    let page: Int
    let rect: CGRect
    var id: String { "\(fileURL.path)#\(page)" }
}

extension Notification.Name {
    /// The Today window asks the workbench to open a case by id (a row tap in
    /// the daily face routes back into the main workspace).
    static let loomOpenCase = Notification.Name("loomOpenCase")
    /// The sidebar LIBRARY section asks the Library reader to open a specific
    /// wiki chapter by slug (userInfo["slug"]).
    static let loomOpenWikiChapter = Notification.Name("loomOpenWikiChapter")
    /// A `loom://anchor` link clicked in the reflection note asks the workbench
    /// to pop the source in an in-app PDF view jumped to its page + rect.
    static let loomReflectionAnchorJump = Notification.Name("loomReflectionAnchorJump")
    /// Hover-to-note: the reader captured a passage; the center note editor
    /// listens and inserts it as a clickable `loom://anchor` quote.
    static let loomReflectionInsertPassage = Notification.Name("loomReflectionInsertPassage")
    /// Shape into article (G8): append the note's gathered "## Reading" provenance.
    static let loomShapeIntoArticle = Notification.Name("loomShapeIntoArticle")

    /// Appshot (owner 2026-07-06): the reader rendered the captured region to
    /// an image; the center note editor drops it in as a paper card next to the
    /// quote. userInfo["image"] is an NSImage. Rendered from the PDF page — no
    /// screen-recording permission.
    static let loomReflectionInsertPassageImage = Notification.Name("loomReflectionInsertPassageImage")
}

private struct WorkbenchEmptyLauncher: View {
    let onImportFiles: () -> Void
    let onCreateReflection: () -> Void
    let onCreateLearningProject: () -> Void
    @State private var promptHovering = false

    var body: some View {
        GeometryReader { geometry in
            let width = min(680, max(320, geometry.size.width * 0.68))
            let rowWidth = min(620, max(300, geometry.size.width * 0.60))

            // No hero object — the empty state is an INVITATION, not a stage
            // (owner 2026-07-04, again: 直接拿掉). The centre belongs to the
            // composer and the three ways in; 空即是风格. The glass-debris /
            // moon craft is preserved in design/blender for meaningful positions
            // (loading, About, progress), never idle in the void.
            VStack(spacing: 18) {
                Spacer(minLength: 0)

                Button(action: onImportFiles) {
                    HStack(spacing: 14) {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .medium))
                            .frame(width: 22, height: 22)

                        Text("Add files or start a reflection")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(LoomTokens.dsInk2)
                            .lineLimit(1)

                        Spacer(minLength: 18)

                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(LoomTokens.dsInk3)
                    }
                    .padding(.horizontal, 22)
                    .frame(width: width, height: 56)
                    .background(
                        Capsule(style: .continuous)
                            .fill(promptHovering ? Color.white.opacity(0.075) : Color.white.opacity(0.052))
                    )
                    .overlay(
                        Capsule(style: .continuous)
                            .stroke(Color.white.opacity(promptHovering ? 0.12 : 0.075), lineWidth: 0.5)
                    )
                    .shadow(color: Color.black.opacity(0.18), radius: 18, y: 12)
                    .contentShape(Capsule(style: .continuous))
                }
                .buttonStyle(.plain)
                .onHover { promptHovering = $0 }
                .accessibilityLabel("Import local files")
                .help("Import local files")

                VStack(spacing: 8) {
                    WorkbenchEmptyActionRow(
                        symbol: "doc.badge.plus",
                        title: "Import local files",
                        detail: "PDF, Word, Markdown, images",
                        action: onImportFiles
                    )
                    WorkbenchEmptyActionRow(
                        symbol: "rectangle.and.text.magnifyingglass",
                        title: "New product reflection",
                        detail: "Blank workbench",
                        action: onCreateReflection
                    )
                    WorkbenchEmptyActionRow(
                        symbol: "book",
                        title: "New learning project",
                        detail: "Capture thinking versions",
                        action: onCreateLearningProject
                    )
                }
                .frame(width: rowWidth, alignment: .leading)

                Spacer(minLength: 0)
            }
            .padding(.top, reflectionSidebarTopClearance)
            .padding(.bottom, max(56, geometry.size.height * 0.18))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

private struct WorkbenchEmptyActionRow: View {
    let symbol: String
    let title: String
    let detail: String
    let action: () -> Void
    @State private var hovering = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(LoomTokens.dsInk3)
                    .frame(width: 18, height: 18)

                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsInk2)
                    .lineLimit(1)

                Text(detail)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(LoomTokens.dsInk3)
                    .lineLimit(1)

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .frame(height: 32)
            .background {
                if hovering {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(Color.white.opacity(0.045))
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .accessibilityLabel(title)
    }
}

// A heading line of the written document — the unit of the live outline.
// The writing surface of the center document: a borderless, transparent
// NSTextView that draws its ink directly on the glass and grows with its
// content inside the outer reading scroll (no nested scroller). Pasted or
// dropped images ride the flow as solid white paper cards; the rich
// document persists as an RTFD package per case while the workspace store
// keeps only a plain-text mirror.
// Internal (not private) so the S8 characterization test can prove the
// range-scoped normalize produces byte-identical styling to the full pass.
struct GlassDocumentEditor: NSViewRepresentable {
    let caseID: ReflectionCase.ID
    let text: String
    let focusRequest: Int
    @Binding var jumpTarget: Int?
    let sources: [ReflectionSource]
    let onTextChange: (String) -> Void
    let onImportFiles: ([URL]) -> [ReflectionSource]
    let onOpenSource: (ReflectionSource.ID) -> Void

    // The typographic law moved to ReflectionDocumentFormat (build-order step ①,
    // 2026-07-06) so it is small, focused, and unit-testable in isolation. These
    // thin forwarders keep every existing call site byte-identical; the logic and
    // its tests now live in that enum. (Forwarders retire as call sites migrate.)
    static func serifFont(size: CGFloat, weight: NSFont.Weight) -> NSFont {
        ReflectionDocumentFormat.serifFont(size: size, weight: weight)
    }
    static var documentFont: NSFont { ReflectionDocumentFormat.documentFont }
    /// Block D open-question tint — LOOM's page-only/partial amber, muted toward
    /// ink so an open thread reads as "unresolved" without shouting; adapts to
    /// appearance via labelColor.
    static var openQuestionColor: NSColor {
        NSColor.systemOrange.blended(withFraction: 0.34, of: .labelColor) ?? .systemOrange
    }
    static var documentParagraphStyle: NSParagraphStyle { ReflectionDocumentFormat.documentParagraphStyle }
    static var quoteParagraphStyle: NSParagraphStyle { ReflectionDocumentFormat.quoteParagraphStyle }
    static func isAnchorParagraph(_ storage: NSTextStorage, at loc: Int) -> Bool {
        ReflectionDocumentFormat.isAnchorParagraph(storage, at: loc)
    }
    static func headingFont(level: Int) -> NSFont { ReflectionDocumentFormat.headingFont(level: level) }
    static var headingParagraphStyle: NSParagraphStyle { ReflectionDocumentFormat.headingParagraphStyle }
    static func headingLevel(of line: String) -> (level: Int, markerLength: Int) {
        ReflectionDocumentFormat.headingLevel(of: line)
    }

    /// The live outline is derived from the WRITTEN document — every
    /// heading line, with its character location for click-to-jump.
    static func documentHeadings(in text: String) -> [DocumentHeading] {
        ReflectionDocumentFormat.documentHeadings(in: text)
    }

    static var documentsDirectory: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Loom/CaseDocuments", isDirectory: true)
    }

    static func documentURL(for caseID: ReflectionCase.ID) -> URL {
        documentsDirectory.appendingPathComponent("\(caseID).rtfd", isDirectory: true)
    }

    /// One discipline pass over the whole document: body text keeps the
    /// uniform serif ink, heading lines (`#`/`##`/`###` + space) wear
    /// their level's serif weight with the markers faded to tertiary ink,
    /// image attachments wear the white paper-card cell, and file chips
    /// (.loomref payloads) rebuild their card + source link — including
    /// everything arriving via RTFD load, paste, or drag.
    static func normalizeDocument(_ view: NSTextView, sources: [ReflectionSource]) {
        guard let storage = view.textStorage, storage.length > 0 else { return }
        let full = NSRange(location: 0, length: storage.length)
        storage.beginEditing()
        // TextKit 2 attachment rebuild: an RTFD reload hands back PLAIN
        // NSTextAttachments (cells and typed subclasses don't survive the
        // round trip — only the file wrapper does). Replace each with its
        // typed paper attachment, which vends the card/chip view under
        // TextKit 2 and doubles as the detection marker. Collected first,
        // applied after — never mutate .attachment mid-enumerate.
        var rebuilds: [(range: NSRange, attachment: NSTextAttachment, link: String?)] = []
        storage.enumerateAttribute(.attachment, in: full) { value, range, _ in
            guard let attachment = value as? NSTextAttachment else { return }
            let wrapperName = attachment.fileWrapper?.preferredFilename
                ?? attachment.fileWrapper?.filename ?? ""
            if wrapperName.hasSuffix(".loomref") {
                guard !(attachment is PaperFileAttachment),
                      let wrapper = attachment.fileWrapper else { return }
                let payload = wrapper.regularFileContents
                    .flatMap { String(data: $0, encoding: .utf8) } ?? ""
                let parts = payload.split(separator: "\n", maxSplits: 1).map(String.init)
                let sourceID = parts.first ?? ""
                let source = sources.first { $0.id == sourceID }
                let label = source?.label ?? (parts.count > 1 ? parts[1] : "Attached file")
                let chip = PaperFileAttachment(
                    label: label, sourceID: sourceID,
                    fileURL: source?.fileURL, fileWrapper: wrapper
                )
                rebuilds.append((range, chip, sourceID.isEmpty ? nil : "loom-source://\(sourceID)"))
            } else if !(attachment is PaperImageAttachment) {
                let card = PaperImageAttachment(data: nil, ofType: nil)
                card.fileWrapper = attachment.fileWrapper
                card.image = attachment.image
                guard card.cardImage != nil else { return }
                // An appshot card's return link rides the .link attribute
                // through RTFD; restore the card's own copy so its view can
                // route the click.
                let existingLink = storage.attribute(.link, at: range.location, effectiveRange: nil)
                let raw = (existingLink as? URL)?.absoluteString ?? (existingLink as? String ?? "")
                if raw.hasPrefix("loom://anchor") { card.anchorURL = raw }
                rebuilds.append((range, card, nil))
            }
        }
        for rebuild in rebuilds {
            storage.addAttribute(.attachment, value: rebuild.attachment, range: rebuild.range)
            if let link = rebuild.link {
                storage.addAttribute(.link, value: link, range: rebuild.range)
            }
        }
        let text = storage.string as NSString
        var location = 0
        while location < text.length {
            let paragraphRange = text.paragraphRange(for: NSRange(location: location, length: 0))
            if paragraphRange.length == 0 { break }
            normalizeParagraph(storage, paragraphRange: paragraphRange)
            location = NSMaxRange(paragraphRange)
        }
        storage.endEditing()
        applyBoundaryTypingAttributes(view)
    }

    /// Restyle ONLY the paragraphs an edit touched (S8: styling cost ∝ edit,
    /// not document length). Expands the edited range to whole paragraphs via
    /// the tested `normalizationRange` and normalizes each with the same
    /// `normalizeParagraph` the full pass uses — so a keystroke in a long note
    /// restyles one paragraph, not the whole book. (Attachment-cell rebuild is
    /// skipped: freshly inserted cards arrive with their cell set; only
    /// RTFD-loaded attachments need rebuilding, and those come in via the full
    /// pass on load.)
    static func normalizeEditedRange(_ view: NSTextView, editedRange: NSRange) {
        guard let storage = view.textStorage, storage.length > 0 else { return }
        let text = storage.string as NSString
        let scope = ReflectionDocumentFormat.normalizationRange(in: text, editedRange: editedRange)
        storage.beginEditing()
        var location = scope.location
        let end = min(NSMaxRange(scope), text.length)
        while location < end {
            let paragraphRange = text.paragraphRange(for: NSRange(location: location, length: 0))
            if paragraphRange.length == 0 { break }
            normalizeParagraph(storage, paragraphRange: paragraphRange)
            location = NSMaxRange(paragraphRange)
        }
        storage.endEditing()
        applyBoundaryTypingAttributes(view)
    }

    /// typingAttributes carry the caret's active style. Charter §8: override
    /// them ONLY at a structural boundary — a fresh (empty) line after a
    /// heading or open question types as body. Otherwise LEAVE them alone, so
    /// a live ⌘B / ⌘I keeps running as you type (the old unconditional reset
    /// reverted an empty-selection bold on the very next keystroke).
    static func applyBoundaryTypingAttributes(_ view: NSTextView) {
        guard let storage = view.textStorage else { return }
        let text = storage.string as NSString
        let caret = min(view.selectedRange().location, text.length)
        let currentPara = text.paragraphRange(for: NSRange(location: caret, length: 0))
        let currentLine = text.substring(with: currentPara).trimmingCharacters(in: .whitespacesAndNewlines)
        if currentLine.isEmpty, currentPara.location > 0 {
            let prevPara = text.paragraphRange(for: NSRange(location: currentPara.location - 1, length: 0))
            let prevRole = ReflectionDocumentFormat.paragraphRole(of: text.substring(with: prevPara))
            if let boundary = ReflectionDocumentFormat.typingAttributesAfterNewline(previousRole: prevRole) {
                view.typingAttributes = boundary
            }
        }
    }

    /// Restyle ONE paragraph to its altitude (heading / open question /
    /// evidence quote / body). Extracted verbatim from normalizeDocument's loop
    /// (behaviour-identical) so a per-keystroke path can restyle only the
    /// edited paragraph(s) instead of the whole document (S8: cost ∝ edit).
    /// Assumes the caller has begun/will end a storage editing transaction.
    static func normalizeParagraph(_ storage: NSTextStorage, paragraphRange: NSRange) {
        let line = (storage.string as NSString).substring(with: paragraphRange)
        let (level, markerLength) = headingLevel(of: line)
        if level > 0 {
            storage.addAttributes([
                .font: headingFont(level: level),
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: headingParagraphStyle,
            ], range: paragraphRange)
            storage.addAttribute(
                .foregroundColor,
                value: NSColor.tertiaryLabelColor,
                range: NSRange(location: paragraphRange.location, length: markerLength)
            )
        } else if ReflectionDocumentFormat.isOpenQuestionLine(line) {
            // Block D — an open question / to-confirm (line starts with ❓). A
            // warm "unresolved" amber (LOOM's page-only/partial signal) so it
            // reads as a thread to return to, not settled prose. Authored
            // altitude (baseline), emphasis preserved.
            storage.addAttributes([
                .foregroundColor: openQuestionColor,
                .paragraphStyle: documentParagraphStyle,
            ], range: paragraphRange)
            applyBodySerifPreservingEmphasis(storage, range: paragraphRange)
        } else if isAnchorParagraph(storage, at: paragraphRange.location) {
            // Evidence altitude — a captured quote. Preserve its indent +
            // quiet ink instead of flattening it to baseline authored text,
            // so the source's words read as evidence below your own claim.
            storage.addAttributes([
                .foregroundColor: NSColor.secondaryLabelColor,
                .paragraphStyle: quoteParagraphStyle,
            ], range: paragraphRange)
            applyBodySerifPreservingEmphasis(storage, range: paragraphRange)
            // Restore the trailing locator glyph's footnote size + raised
            // baseline (the body-serif pass above reset it to 15pt baseline).
            // Its cyan is painted by linkTextAttributes at display time.
            storage.enumerateAttribute(.link, in: paragraphRange) { value, subRange, _ in
                let s = (value as? String) ?? (value as? URL)?.absoluteString
                    ?? (value as? NSURL)?.absoluteString ?? ""
                guard s.hasPrefix("loom://anchor") else { return }
                // Only the locator run (hair-space + one diamond, ≤ 2 chars) —
                // never an OLD note whose whole quote text still carries the link,
                // even if that quote happens to contain a ◆ (that would shrink
                // the entire quote). Guard on BOTH length and the diamond.
                let sub = (storage.string as NSString).substring(with: subRange)
                guard subRange.length <= 2, sub.contains("\u{25C6}") || sub.contains("\u{25C7}") else { return }
                storage.addAttributes([
                    .font: serifFont(size: 9.5, weight: .regular),
                    .baselineOffset: 4.0,
                ], range: subRange)
            }
        } else {
            storage.addAttributes([
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: documentParagraphStyle,
            ], range: paragraphRange)
            applyBodySerifPreservingEmphasis(storage, range: paragraphRange)
        }
    }

    /// Enforce the one serif family + body size on a paragraph while PRESERVING
    /// the bold/italic emphasis the owner applied (⌘B/⌘I) — so the single-ink
    /// discipline holds for family/size/colour, but Word-class emphasis lives.
    /// Underline + links are separate attributes normalize never touches.
    private static func applyBodySerifPreservingEmphasis(_ storage: NSTextStorage, range: NSRange) {
        // Flatten the baseline across the paragraph so a raised offset (leaked
        // from typing right after the superscript locator) heals like font/size
        // does — the anchor branch re-raises only the locator glyph afterwards.
        storage.removeAttribute(.baselineOffset, range: range)
        let manager = NSFontManager.shared
        storage.enumerateAttribute(.font, in: range) { value, subRange, _ in
            let symbolic = (value as? NSFont)?.fontDescriptor.symbolicTraits ?? []
            var font = serifFont(size: 15, weight: .regular)
            if symbolic.contains(.bold) { font = manager.convert(font, toHaveTrait: .boldFontMask) }
            if symbolic.contains(.italic) { font = manager.convert(font, toHaveTrait: .italicFontMask) }
            storage.addAttribute(.font, value: font, range: subRange)
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(
            caseID: caseID,
            focusRequest: focusRequest,
            sources: sources,
            onTextChange: onTextChange,
            onImportFiles: onImportFiles,
            onOpenSource: onOpenSource
        )
    }

    func makeNSView(context: Context) -> GrowingGlassTextView {
        let view = GrowingGlassTextView()
        view.drawsBackground = false
        // Rich text so image attachments can live in the flow; the paste
        // override and normalizeDocument keep body text plain and uniform.
        view.isRichText = true
        view.importsGraphics = true
        view.allowsUndo = true
        // System writing aids (Charter W1-1⑤): flag misspellings + grammar the
        // way every macOS editor does — but NEVER silently rewrite the owner's
        // text. Auto-correction and text replacement would corrupt technical
        // terms (PPO, DPO, RLHF) mid-distillation, so they stay OFF while
        // checking stays on. Spell underlines are temporary layout attributes,
        // so they never touch the stored document or fight normalize.
        view.isContinuousSpellCheckingEnabled = true
        view.isGrammarCheckingEnabled = true
        view.isAutomaticSpellingCorrectionEnabled = false
        view.isAutomaticTextReplacementEnabled = false
        view.isVerticallyResizable = true
        view.isHorizontallyResizable = false
        view.textContainer?.widthTracksTextView = true
        view.textContainer?.lineFragmentPadding = 0
        view.textContainerInset = .zero
        view.font = Self.documentFont
        view.textColor = .labelColor
        view.defaultParagraphStyle = Self.documentParagraphStyle
        view.typingAttributes = [
            .font: Self.documentFont,
            .foregroundColor: NSColor.labelColor,
            .paragraphStyle: Self.documentParagraphStyle,
        ]
        // Anchor links must NOT read as web hyperlinks — no blue, no underline.
        // Their only colour is the dynamic 青芒 cyan (dark #4BC5DE / light #2F8CA0,
        // mirroring LoomTokens.indigo), and it lands only on the small locator glyph
        // that now carries the link. Set once, globally, for every loom:// link.
        view.linkTextAttributes = [
            .foregroundColor: NSColor(name: nil) { appearance in
                let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
                // 青芒 #4BC5DE (dark) / #2F8CA0 (light), inlined as calibrated sRGB —
                // matching the existing idiom (fromHex is fileprivate to the tokens).
                return isDark
                    ? NSColor(srgbRed: 75 / 255, green: 197 / 255, blue: 222 / 255, alpha: 0.85)
                    : NSColor(srgbRed: 47 / 255, green: 140 / 255, blue: 160 / 255, alpha: 0.85)
            },
            .underlineStyle: 0,
            .cursor: NSCursor.pointingHand,
        ]
        view.delegate = context.coordinator
        context.coordinator.loadDocument(into: view, fallback: text)
        view.setAccessibilityLabel("Case document")
        // Stable UI-verification handle for the Workspace note editor.
        view.setAccessibilityIdentifier("surface.caseDocument")
        return view
    }

    func updateNSView(_ view: GrowingGlassTextView, context: Context) {
        let coordinator = context.coordinator
        coordinator.onTextChange = onTextChange
        coordinator.onImportFiles = onImportFiles
        coordinator.onOpenSource = onOpenSource
        coordinator.sources = sources
        if coordinator.caseID != caseID {
            coordinator.saveDocumentNow(view)
            coordinator.caseID = caseID
            coordinator.loadDocument(into: view, fallback: text)
        } else if view.string != text, !Self.hasAttachments(view) {
            view.string = text
            view.invalidateIntrinsicContentSize()
        }
        if coordinator.focusRequest != focusRequest {
            coordinator.focusRequest = focusRequest
            DispatchQueue.main.async {
                view.window?.makeFirstResponder(view)
            }
        }
        if let target = jumpTarget {
            DispatchQueue.main.async {
                Self.scroll(view, toCharacter: target)
                jumpTarget = nil
            }
        }
    }

    static func hasAttachments(_ view: NSTextView) -> Bool {
        guard let storage = view.textStorage else { return false }
        return storage.string.contains("\u{FFFC}")
    }

    /// Outline click-to-jump: the editor lives inside the outer reading
    /// scroll, so the jump animates that enclosing scroll view to the
    /// heading's line, leaving breathing room under the top chrome.
    static func scroll(_ view: NSTextView, toCharacter target: Int) {
        // TextKit 2 (charter W2-3): resolve the character's line rect through
        // textLayoutManager — .layoutManager would one-way-downgrade the view.
        guard let textLayoutManager = view.textLayoutManager,
              let contentManager = textLayoutManager.textContentManager,
              let scrollView = view.enclosingScrollView,
              let documentView = scrollView.documentView else { return }
        let length = (view.string as NSString).length
        guard length > 0 else { return }
        let safeTarget = min(max(0, target), length - 1)
        textLayoutManager.ensureLayout(for: textLayoutManager.documentRange)
        guard let location = contentManager.location(
                contentManager.documentRange.location, offsetBy: safeTarget),
              let fragment = textLayoutManager.textLayoutFragment(for: location) else { return }
        // The fragment covers the whole paragraph; refine to the LINE holding
        // the target (matches the old one-glyph boundingRect for mid-paragraph
        // jumps — headings are paragraph starts either way).
        let fragmentFrame = fragment.layoutFragmentFrame
        var lineY = fragmentFrame.minY
        let offsetInFragment = contentManager.offset(from: fragment.rangeInElement.location, to: location)
        for line in fragment.textLineFragments where NSLocationInRange(offsetInFragment, line.characterRange) {
            lineY = fragmentFrame.minY + line.typographicBounds.minY
            break
        }
        let pointInDocument = view.convert(NSPoint(x: 0, y: lineY), to: documentView)
        let maxY = max(0, documentView.frame.height - scrollView.contentView.bounds.height)
        let targetY = min(max(0, pointInDocument.y - 84), maxY)
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.25
            context.allowsImplicitAnimation = true
            scrollView.contentView.animator().setBoundsOrigin(NSPoint(x: 0, y: targetY))
        }
        scrollView.reflectScrolledClipView(scrollView.contentView)
    }

    final class Coordinator: NSObject, NSTextViewDelegate {
        var caseID: ReflectionCase.ID
        var focusRequest: Int
        var sources: [ReflectionSource]
        var onTextChange: (String) -> Void
        var onImportFiles: ([URL]) -> [ReflectionSource]
        var onOpenSource: (ReflectionSource.ID) -> Void
        private var saveWork: DispatchWorkItem?
        /// The range an about-to-happen edit will occupy, captured in
        /// `shouldChangeTextIn` (which fires BEFORE the mutation). textDidChange
        /// uses it to restyle only the touched paragraphs (S8). nil ⇒ the edit
        /// didn't come through the user-edit path (programmatic) ⇒ full pass.
        private var pendingEditedRange: NSRange?

        init(
            caseID: ReflectionCase.ID,
            focusRequest: Int,
            sources: [ReflectionSource],
            onTextChange: @escaping (String) -> Void,
            onImportFiles: @escaping ([URL]) -> [ReflectionSource],
            onOpenSource: @escaping (ReflectionSource.ID) -> Void
        ) {
            self.caseID = caseID
            self.focusRequest = focusRequest
            self.sources = sources
            self.onTextChange = onTextChange
            self.onImportFiles = onImportFiles
            self.onOpenSource = onOpenSource
        }

        /// Fires BEFORE each user edit with the range it will affect. Record the
        /// post-edit range (same location, replacement length) so textDidChange
        /// can scope styling to it. Always returns true — this only observes.
        func textView(_ textView: NSTextView, shouldChangeTextIn affectedCharRange: NSRange, replacementString: String?) -> Bool {
            let insertedLength = (replacementString as NSString?)?.length ?? 0
            pendingEditedRange = NSRange(location: affectedCharRange.location, length: insertedLength)
            return true
        }

        func textDidChange(_ notification: Notification) {
            guard let view = notification.object as? NSTextView else { return }
            // S8: restyle only the paragraphs the edit touched. A keystroke in a
            // long note now costs one paragraph, not the whole book. Programmatic
            // edits (no shouldChangeTextIn) fall back to the full pass.
            if let edited = pendingEditedRange {
                pendingEditedRange = nil
                GlassDocumentEditor.normalizeEditedRange(view, editedRange: edited)
            } else {
                GlassDocumentEditor.normalizeDocument(view, sources: sources)
            }
            onTextChange(view.string)
            scheduleDocumentSave(view)
        }

        /// A file chip carries a loom-source:// link; clicking it opens
        /// the source through the workspace's own open path.
        // Discoverable formatting: when text is selected, append Bold / Italic /
        // Underline (with ⌘ hints) to the editor's right-click menu.
        func textView(_ view: NSTextView, menu: NSMenu, for event: NSEvent, at charIndex: Int) -> NSMenu? {
            guard view.selectedRange().length > 0, let editor = view as? GrowingGlassTextView else { return menu }
            menu.addItem(.separator())
            let formats: [(String, String, Selector)] = [
                ("Bold", "b", #selector(GrowingGlassTextView.loomToggleBold)),
                ("Italic", "i", #selector(GrowingGlassTextView.loomToggleItalic)),
                ("Underline", "u", #selector(GrowingGlassTextView.loomToggleUnderline)),
            ]
            for (title, key, action) in formats {
                let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
                item.keyEquivalentModifierMask = .command
                item.target = editor
                menu.addItem(item)
            }
            return menu
        }

        func textView(_ textView: NSTextView, clickedOnLink link: Any, at charIndex: Int) -> Bool {
            let raw = (link as? URL)?.absoluteString ?? (link as? String ?? "")
            if raw.hasPrefix("loom-source://") {
                onOpenSource(String(raw.dropFirst("loom-source://".count)))
                return true
            }
            return routeAnchorLink(raw)
        }

        /// Route a `loom://anchor?src=<sourceID>&page=N&rect=x,y,w,h` link — from
        /// a quote OR an appshot card — to pop the source in an in-app PDF jumped
        /// to that passage. Returns true when it is an anchor link. Internal so
        /// the TextKit 2 attachment views (a card owns its own clicks now) can
        /// route through the same door as clickedOnLink.
        @discardableResult
        func routeAnchorLink(_ raw: String) -> Bool {
            guard raw.hasPrefix("loom://anchor"), let comps = URLComponents(string: raw) else { return false }
            let q = comps.queryItems ?? []
            guard let sourceID = q.first(where: { $0.name == "src" })?.value, !sourceID.isEmpty else { return true }
            let page = Int(q.first(where: { $0.name == "page" })?.value ?? "") ?? 0
            var rect = CGRect.zero
            if let parts = q.first(where: { $0.name == "rect" })?.value?
                .split(separator: ",").compactMap({ Double($0) }), parts.count == 4 {
                rect = CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
            }
            NotificationCenter.default.post(
                name: .loomReflectionAnchorJump,
                object: nil,
                userInfo: ["sourceID": sourceID, "page": page, "rect": NSValue(rect: rect)]
            )
            return true
        }

        // Attachment clicks no longer route through the clickedOn-cell
        // delegate: TextKit 2 ignores cells, so the paper card / file chip
        // views (PaperImageCardView / PaperFileChipView) own their own
        // mouseDown and call back through this same Coordinator.

        func textDidEndEditing(_ notification: Notification) {
            guard let view = notification.object as? NSTextView else { return }
            saveDocumentNow(view)
        }

        func loadDocument(into view: NSTextView, fallback: String) {
            let url = GlassDocumentEditor.documentURL(for: caseID)
            if let attributed = try? NSAttributedString(
                url: url,
                options: [.documentType: NSAttributedString.DocumentType.rtfd],
                documentAttributes: nil
            ) {
                view.textStorage?.setAttributedString(attributed)
            } else {
                view.string = fallback
            }
            // The text view is reused across documents — cancel any in-flight
            // anchor-flash fade so its queued frames don't paint onto this one.
            (view as? GrowingGlassTextView)?.cancelInFlightAnchorFlashes()
            // Clear the undo stack across the document swap (charter §9): the
            // view is reused, so without this a ⌘Z after switching cases would
            // replay the PREVIOUS document's edits onto this one.
            view.undoManager?.removeAllActions()
            GlassDocumentEditor.normalizeDocument(view, sources: sources)
            view.invalidateIntrinsicContentSize()
        }

        func scheduleDocumentSave(_ view: NSTextView) {
            saveWork?.cancel()
            let work = DispatchWorkItem { [weak self, weak view] in
                guard let self, let view else { return }
                self.saveDocumentNow(view)
            }
            saveWork = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: work)
        }

        func saveDocumentNow(_ view: NSTextView) {
            saveWork?.cancel()
            guard let storage = view.textStorage else { return }
            let url = GlassDocumentEditor.documentURL(for: caseID)
            let trimmed = storage.string.trimmingCharacters(in: .whitespacesAndNewlines)
            if storage.length == 0 || (trimmed.isEmpty && !storage.string.contains("\u{FFFC}")) {
                try? FileManager.default.removeItem(at: url)
                return
            }
            // Review wedge (docs/canon/WHAT_IS_LOOM.md §6): the persisted note
            // is the wedge's INPUT. Each (anchored quote → your own claim
            // beneath it) pairing becomes a ReviewItem, upserted while
            // preserving its review schedule. Runs on the debounced save (not
            // per keystroke), reads the .link anchors off the live storage.
            // Provenance = the note's own first heading (fallback first line).
            let reviewTitle = ReflectionDocumentFormat.documentHeadings(in: storage.string).first?.title
                ?? storage.string.split(separator: "\n").first.map { $0.trimmingCharacters(in: .whitespaces) }
                ?? ""
            ReviewStore.syncNote(document: storage, sourceTitle: reviewTitle)
            let full = NSRange(location: 0, length: storage.length)
            guard let wrapper = storage.rtfdFileWrapper(
                from: full,
                documentAttributes: [.documentType: NSAttributedString.DocumentType.rtfd]
            ) else { return }
            try? FileManager.default.createDirectory(
                at: GlassDocumentEditor.documentsDirectory,
                withIntermediateDirectories: true
            )
            try? wrapper.write(to: url, options: .atomic, originalContentsURL: nil)
        }
    }

    final class GrowingGlassTextView: NSTextView {
        /// Bumped when a new anchor flash starts or the document is swapped, so a
        /// stale fade frame (a superseded flash, a moved range, or the previous
        /// document — this view is reused across documents) early-returns instead
        /// of painting the wrong characters.
        private var flashGeneration = 0

        /// Cancel any in-flight anchor-flash fade and clear its tint — called when
        /// the document content is replaced, so queued fade frames don't paint
        /// onto the incoming document's text.
        func cancelInFlightAnchorFlashes() {
            flashGeneration += 1
            guard let textLayoutManager else { return }
            textLayoutManager.removeRenderingAttribute(
                .backgroundColor, for: textLayoutManager.documentRange)
        }

        override var intrinsicContentSize: NSSize {
            // TextKit 2 (charter W2-3): this runs on EVERY layout pass, so it
            // must never touch .layoutManager — that was the downgrade that
            // kept the editor on TextKit 1 its whole life.
            // usageBoundsForTextContainer is .zero before layout: ensure first.
            guard let textLayoutManager else { return super.intrinsicContentSize }
            textLayoutManager.ensureLayout(for: textLayoutManager.documentRange)
            let used = textLayoutManager.usageBoundsForTextContainer
            return NSSize(width: NSView.noIntrinsicMetric, height: max(used.height + 8, 72))
        }

        override func didChangeText() {
            super.didChangeText()
            invalidateIntrinsicContentSize()
        }

        override func setFrameSize(_ newSize: NSSize) {
            super.setFrameSize(newSize)
            invalidateIntrinsicContentSize()
        }

        /// The reader's hover-to-note badge posts a captured passage here; the
        /// mounted center editor inserts it as a clickable anchored quote.
        private var passageObserver: NSObjectProtocol?
        private var passageImageObserver: NSObjectProtocol?
        private var shapeObserver: NSObjectProtocol?
        #if DEBUG
        /// Charter W2-3 tripwire: TextKit 2 is a one-way contract. AppKit
        /// posts willSwitchToNSLayoutManagerNotification the instant ANY code
        /// touches `.layoutManager` on this view — the silent permanent
        /// downgrade this migration removed. Installed once; screams in DEBUG
        /// so a regression can't hide behind a working-but-TextKit-1 editor.
        private var tk1DowngradeTripwire: NSObjectProtocol?
        #endif

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            #if DEBUG
            if tk1DowngradeTripwire == nil {
                tk1DowngradeTripwire = NotificationCenter.default.addObserver(
                    forName: NSTextView.willSwitchToNSLayoutManagerNotification,
                    object: self,
                    queue: .main
                ) { _ in
                    assertionFailure("""
                    GrowingGlassTextView is downgrading to TextKit 1 — some code \
                    touched .layoutManager on the center editor. Find it and use \
                    textLayoutManager instead (charter W2-3: the downgrade is \
                    one-way and silent in Release).
                    """)
                }
            }
            #endif
            if window != nil, passageObserver == nil {
                passageObserver = NotificationCenter.default.addObserver(
                    forName: .loomReflectionInsertPassage,
                    object: nil,
                    queue: .main
                ) { [weak self] note in
                    guard let self,
                          let quote = note.userInfo?["quote"] as? String,
                          let url = note.userInfo?["url"] as? String else { return }
                    let precise = note.userInfo?["precise"] as? Bool ?? true
                    self.window?.makeFirstResponder(self)
                    self.insertPassageAnchor(quote: quote, anchorURL: url, precise: precise)
                }
            } else if window == nil, let observer = passageObserver {
                NotificationCenter.default.removeObserver(observer)
                passageObserver = nil
            }
            // Appshot: the reader posts the rendered region image; drop it into
            // the note as a paper card. It is enqueued BEFORE the quote note, so
            // the card lands above its quote.
            if window != nil, passageImageObserver == nil {
                passageImageObserver = NotificationCenter.default.addObserver(
                    forName: .loomReflectionInsertPassageImage,
                    object: nil,
                    queue: .main
                ) { [weak self] note in
                    guard let self, let image = note.userInfo?["image"] as? NSImage else { return }
                    let url = note.userInfo?["url"] as? String
                    self.window?.makeFirstResponder(self)
                    self.insertPaperImage(image, anchorURL: url)
                }
            } else if window == nil, let observer = passageImageObserver {
                NotificationCenter.default.removeObserver(observer)
                passageImageObserver = nil
            }
            // Shape into article (G8): append the note's gathered provenance.
            if window != nil, shapeObserver == nil {
                shapeObserver = NotificationCenter.default.addObserver(
                    forName: .loomShapeIntoArticle,
                    object: nil,
                    queue: .main
                ) { [weak self] _ in
                    guard let self else { return }
                    self.window?.makeFirstResponder(self)
                    self.shapeIntoArticle()
                }
            } else if window == nil, let observer = shapeObserver {
                NotificationCenter.default.removeObserver(observer)
                shapeObserver = nil
            }
        }

        deinit {
            if let observer = passageObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            if let observer = passageImageObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            if let observer = shapeObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            #if DEBUG
            if let observer = tk1DowngradeTripwire {
                NotificationCenter.default.removeObserver(observer)
            }
            #endif
        }

        // Word-class emphasis with no permanent chrome: the standard ⌘B/⌘I/⌘U
        // toggle bold/italic/underline on the selection. normalizeDocument
        // preserves them; the single-ink discipline still governs family/size.
        override func performKeyEquivalent(with event: NSEvent) -> Bool {
            if event.modifierFlags.intersection(.deviceIndependentFlagsMask) == .command,
               let key = event.charactersIgnoringModifiers?.lowercased() {
                switch key {
                case "b": toggleEmphasis(.boldFontMask); return true
                case "i": toggleEmphasis(.italicFontMask); return true
                case "u": toggleUnderline(); return true
                default: break
                }
            }
            return super.performKeyEquivalent(with: event)
        }

        private func toggleEmphasis(_ trait: NSFontTraitMask) {
            let range = selectedRange()
            guard range.length > 0, let storage = textStorage else { return }
            // Register the attribute change with the undo manager (charter §9):
            // shouldChangeText(in:replacementString:nil) is the documented way to
            // make an attribute-only edit undoable — without it ⌘Z can't revert
            // a ⌘B. Skips cleanly if the system vetoes the edit.
            guard shouldChangeText(in: range, replacementString: nil) else { return }
            let manager = NSFontManager.shared
            let existing = storage.attribute(.font, at: range.location, effectiveRange: nil) as? NSFont
            let symbolic = existing?.fontDescriptor.symbolicTraits ?? []
            let isOn = trait == .boldFontMask ? symbolic.contains(.bold) : symbolic.contains(.italic)
            storage.beginEditing()
            storage.enumerateAttribute(.font, in: range) { value, subRange, _ in
                let base = (value as? NSFont) ?? GlassDocumentEditor.documentFont
                let font = isOn
                    ? manager.convert(base, toNotHaveTrait: trait)
                    : manager.convert(base, toHaveTrait: trait)
                storage.addAttribute(.font, value: font, range: subRange)
            }
            storage.endEditing()
            didChangeText()
        }

        private func toggleUnderline() {
            let range = selectedRange()
            guard range.length > 0, let storage = textStorage else { return }
            // Undoable attribute change (charter §9) — see toggleEmphasis.
            guard shouldChangeText(in: range, replacementString: nil) else { return }
            let current = storage.attribute(.underlineStyle, at: range.location, effectiveRange: nil) as? Int ?? 0
            storage.beginEditing()
            if current == 0 {
                storage.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: range)
            } else {
                storage.removeAttribute(.underlineStyle, range: range)
            }
            storage.endEditing()
            didChangeText()
        }

        // Discoverability (owner-audit 2026-07-05): the ⌘B/⌘I/⌘U shortcuts were
        // invisible. The Coordinator's textView(_:menu:for:at:) delegate appends
        // Bold / Italic / Underline (with ⌘ hints) when text is selected — the
        // canonical NSTextView way (menu(for:) additions get dropped).
        @objc func loomToggleBold() { toggleEmphasis(.boldFontMask) }
        @objc func loomToggleItalic() { toggleEmphasis(.italicFontMask) }
        @objc func loomToggleUnderline() { toggleUnderline() }

        // Chip clicks: under TextKit 2 the file chip is a REAL view
        // (PaperFileChipView) that owns its own mouseDown, so the old
        // glyph-hit-test mouseDown override is gone — no .layoutManager,
        // no downgrade.

        // Files route by kind (images → paper cards, documents → source
        // chips); everything textual pastes PLAIN so the document keeps
        // one uniform ink.
        override func paste(_ sender: Any?) {
            let pasteboard = NSPasteboard.general
            if routeFiles(from: pasteboard) { return }
            // TEXT WINS. Rich-text sources (Word, browsers, chat apps) stamp BOTH
            // the string AND a rendered IMAGE of it onto the pasteboard; without
            // this guard the image hijacked the paste and the pasted words landed
            // as a non-editable paper card (owner 2026-07-05: 复制粘贴过来的不能编辑).
            // Only a genuine image copy — one with no text at all (a screenshot,
            // a copied photo) — becomes a paper image card.
            if pasteboard.canReadObject(forClasses: [NSString.self], options: [:]) {
                pasteAsPlainText(sender)
                return
            }
            let images = Self.pasteboardImages(pasteboard)
            if images.isEmpty {
                pasteAsPlainText(sender)
            } else {
                for image in images {
                    insertPaperImage(image)
                }
            }
        }

        // Dropped files land at the drop point with the same routing.
        override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
            let pasteboard = sender.draggingPasteboard
            if !Self.fileURLs(from: pasteboard).isEmpty {
                let point = convert(sender.draggingLocation, from: nil)
                setSelectedRange(NSRange(location: characterIndexForInsertion(at: point), length: 0))
                routeFiles(from: pasteboard)
                return true
            }
            return super.performDragOperation(sender)
        }

        /// Images become paper cards in the flow; every other file
        /// registers as a case SOURCE (the bridge panel's resource list)
        /// and lands in the flow as a clickable file chip.
        @discardableResult
        func routeFiles(from pasteboard: NSPasteboard) -> Bool {
            let urls = Self.fileURLs(from: pasteboard)
            guard !urls.isEmpty else { return false }
            var documents: [URL] = []
            for url in urls {
                if let type = UTType(filenameExtension: url.pathExtension),
                   type.conforms(to: .image),
                   let image = NSImage(contentsOf: url) {
                    insertPaperImage(image)
                } else {
                    documents.append(url)
                }
            }
            if !documents.isEmpty,
               let coordinator = delegate as? GlassDocumentEditor.Coordinator {
                let imported = coordinator.onImportFiles(documents)
                for source in imported {
                    insertFileChip(label: source.label, fileURL: source.fileURL, sourceID: source.id)
                }
            }
            return true
        }

        static func fileURLs(from pasteboard: NSPasteboard) -> [URL] {
            let options: [NSPasteboard.ReadingOptionKey: Any] = [.urlReadingFileURLsOnly: true]
            return (pasteboard.readObjects(forClasses: [NSURL.self], options: options) as? [URL]) ?? []
        }

        static func pasteboardImages(_ pasteboard: NSPasteboard) -> [NSImage] {
            (pasteboard.readObjects(forClasses: [NSImage.self], options: [:]) as? [NSImage]) ?? []
        }

        /// The image lands on its own paragraph as a solid white paper
        /// card — the same material language as captured evidence.
        func insertPaperImage(_ image: NSImage, anchorURL: String? = nil) {
            guard let tiff = image.tiffRepresentation,
                  let bitmap = NSBitmapImageRep(data: tiff),
                  let png = bitmap.representation(using: .png, properties: [:]) else { return }
            let wrapper = FileWrapper(regularFileWithContents: png)
            wrapper.preferredFilename = "image-\(UUID().uuidString.prefix(8)).png"
            // Typed paper attachment (TextKit 2): vends the white-card view
            // itself; an appshot card keeps its return link for click routing.
            let attachment = PaperImageAttachment(data: nil, ofType: nil)
            attachment.fileWrapper = wrapper
            attachment.anchorURL = anchorURL

            let insertion = NSMutableAttributedString()
            let bodyAttributes: [NSAttributedString.Key: Any] = [
                .font: GlassDocumentEditor.documentFont,
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: GlassDocumentEditor.documentParagraphStyle,
            ]
            let location = selectedRange().location
            let text = string as NSString
            if location > 0, text.character(at: location - 1) != 0x0A {
                insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            }
            let card = NSMutableAttributedString(attributedString: NSAttributedString(attachment: attachment))
            if let anchorURL {
                // Click the appshot card to jump back to its source passage.
                // Attachment clicks bypass clickedOnLink, so the link is read
                // back in `clickedOn cell:` and routed there.
                card.addAttribute(.link, value: anchorURL, range: NSRange(location: 0, length: card.length))
            }
            insertion.append(card)
            insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            insertText(insertion, replacementRange: NSRange(location: location, length: 0))
        }

        /// A non-image file in the flow: a compact white paper chip
        /// (icon + name) linked to the case source it registered as.
        /// The .loomref payload keeps the chip rebuildable after RTFD
        /// round-trips.
        func insertFileChip(label: String, fileURL: URL?, sourceID: String) {
            let payload = "\(sourceID)\n\(label)"
            let wrapper = FileWrapper(regularFileWithContents: Data(payload.utf8))
            wrapper.preferredFilename = "loomsource-\(sourceID.prefix(8)).loomref"
            // Typed paper attachment (TextKit 2): the chip view it vends owns
            // the click; the .loomref wrapper keeps it rebuildable on reload.
            let attachment = PaperFileAttachment(label: label, sourceID: sourceID, fileURL: fileURL, fileWrapper: wrapper)

            let bodyAttributes: [NSAttributedString.Key: Any] = [
                .font: GlassDocumentEditor.documentFont,
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: GlassDocumentEditor.documentParagraphStyle,
            ]
            let insertion = NSMutableAttributedString()
            // Land the capture where the cursor is — but if it was never placed
            // (still at the very start), append at the end so captures accumulate
            // in reading order and land fully in view, not stacked above the note.
            let location = selectedRange().location == 0 ? (string as NSString).length : selectedRange().location
            let text = string as NSString
            if location > 0, text.character(at: location - 1) != 0x0A {
                insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            }
            let chip = NSMutableAttributedString(attributedString: NSAttributedString(attachment: attachment))
            chip.addAttribute(.link, value: "loom-source://\(sourceID)", range: NSRange(location: 0, length: chip.length))
            insertion.append(chip)
            insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            insertText(insertion, replacementRange: selectedRange())
        }

        /// A passage captured by the reader's hover ❕: a quoted line that
        /// links back to its exact page + rect via `loom://anchor`. Clicking
        /// it later reopens the reader at that passage.
        func insertPassageAnchor(quote: String, anchorURL: String, precise: Bool = true) {
            let bodyAttributes: [NSAttributedString.Key: Any] = [
                .font: GlassDocumentEditor.documentFont,
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: GlassDocumentEditor.documentParagraphStyle,
            ]
            let insertion = NSMutableAttributedString()
            // Land at the cursor, or append at the end if it was never placed
            // (so captures accumulate in reading order, fully in view).
            let location = selectedRange().location == 0 ? (string as NSString).length : selectedRange().location
            let text = string as NSString
            let leadingNewline = location > 0 && text.character(at: location - 1) != 0x0A
            if leadingNewline {
                insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            }
            var quoteAttributes = bodyAttributes
            // The quote is EVIDENCE — quiet serif ink, indented, and NOT a link, so
            // it never renders as a hyperlink. Land at evidence altitude immediately;
            // normalize keeps it there via the loom://anchor on the locator below.
            quoteAttributes[.paragraphStyle] = GlassDocumentEditor.quoteParagraphStyle
            quoteAttributes[.foregroundColor] = NSColor.secondaryLabelColor
            // One evidence paragraph — collapse a multi-line selection so the
            // trailing locator shares the quote's paragraph (else earlier lines
            // lose the evidence altitude).
            let quoteText = ReflectionDocumentFormat.collapsedQuote(quote)
            let quoteLine = NSAttributedString(string: "\u{201C}\(quoteText)\u{201D}", attributes: quoteAttributes)
            insertion.append(quoteLine)
            // The return-to-source locator: a hair-space + a small superscript
            // diamond carrying the loom://anchor — filled ◆ = exact-rect anchor,
            // hollow ◇ = page-only. Its cyan comes from linkTextAttributes; here we
            // set only the footnote size + raised baseline (normalize restores them).
            var locatorAttributes = quoteAttributes
            locatorAttributes[.link] = anchorURL
            locatorAttributes[.font] = GlassDocumentEditor.serifFont(size: 9.5, weight: .regular)
            locatorAttributes[.baselineOffset] = 4.0
            locatorAttributes[.toolTip] = precise ? "Return to source — exact passage" : "Return to source — page"
            let locatorGlyph = precise ? "\u{25C6}" : "\u{25C7}"
            insertion.append(NSAttributedString(string: "\u{200A}\(locatorGlyph)", attributes: locatorAttributes))
            // Leave the cursor on a fresh line under the quote, ready to write.
            insertion.append(NSAttributedString(string: "\n", attributes: bodyAttributes))
            let quoteStart = location + (leadingNewline ? 1 : 0)
            insertText(insertion, replacementRange: selectedRange())
            insertPassageAnchorFlash(quoteStart: quoteStart, quoteLength: quoteLine.length, precise: precise)
        }

        /// G8 "Shape into article": append the note's own gathered provenance as
        /// a "## Reading" section (ReflectionArticle — no AI, the user's prose
        /// stays theirs). Inserted as plain text so normalize styles the heading
        /// + list; undoable via the standard insertText path. Beeps when the
        /// note has no anchors yet (nothing to gather).
        func shapeIntoArticle() {
            guard let storage = textStorage,
                  let section = ReflectionArticle.readingSection(from: storage) else {
                NSSound.beep()
                return
            }
            let bodyAttributes: [NSAttributedString.Key: Any] = [
                .font: GlassDocumentEditor.documentFont,
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: GlassDocumentEditor.documentParagraphStyle,
            ]
            let end = (string as NSString).length
            let prefix = end > 0 ? "\n\n" : ""
            setSelectedRange(NSRange(location: end, length: 0))
            insertText(NSAttributedString(string: prefix + section, attributes: bodyAttributes),
                       replacementRange: NSRange(location: end, length: 0))
        }

        private func insertPassageAnchorFlash(quoteStart: Int, quoteLength: Int, precise: Bool) {
            // Confirm the landing (owner-audit 2026-07-05): flash the quote —
            // teal for an exact-rect anchor, amber for a page-only one — so the
            // owner sees WHERE it landed and how strong it is.
            flashAnchor(range: NSRange(location: quoteStart, length: quoteLength), precise: precise)
        }

        /// A highlight on the just-landed quote — teal for an exact-rect anchor,
        /// amber for a page-only one — so you see WHERE it landed and how strong
        /// it is. It appears at once (the confirmation), holds ~1.2s, then FADES
        /// OUT over the `.effect` motion token: the anchor landing is the
        /// meaningful arrival that earns the 10% of motion LOOM spends. Display-
        /// only TEMPORARY attributes — never enters textStorage, so it isn't
        /// saved to RTFD and normalizeDocument never sees it. Under Reduce Motion
        /// the fade collapses to today's instant removal.
        private func flashAnchor(range: NSRange, precise: Bool) {
            guard let storage = textStorage,
                  range.location >= 0, range.location + range.length <= storage.length else { return }
            // Supersede any prior flash: bump the generation (its queued frames
            // early-return) AND clear its tint so an overlapping capture never
            // orphans an earlier highlight at peak.
            cancelInFlightAnchorFlashes()
            let generation = flashGeneration
            let color = precise ? NSColor.systemTeal : NSColor.systemOrange
            let peak: CGFloat = 0.28
            // TextKit 2 rendering attributes: display-only, never enter
            // textStorage — the TK2 twin of the old temporary attributes.
            guard let textLayoutManager, let flashRange = textKit2Range(from: range) else { return }
            textLayoutManager.addRenderingAttribute(
                .backgroundColor, value: color.withAlphaComponent(peak), for: flashRange)
            let spec = MotionTokens.spec(for: .effect, reduceMotion: Self.prefersReducedMotion)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
                self?.fadeOutAnchorTint(range: range, color: color, from: peak,
                                        over: spec.duration, generation: generation)
            }
        }

        /// Ramp the flash tint's alpha to zero over `duration`, then remove it.
        /// `duration == 0` (Reduce Motion) removes in a single step. The range is
        /// re-clamped every frame because the text may have changed during the
        /// hold or the fade.
        private func fadeOutAnchorTint(range: NSRange, color: NSColor, from peak: CGFloat,
                                       over duration: Double, generation: Int) {
            guard generation == flashGeneration else { return }  // superseded by a newer flash / doc swap
            guard duration > 0 else {
                if let tlm = textLayoutManager,
                   let r = clampedTintRange(range).flatMap(textKit2Range(from:)) {
                    tlm.removeRenderingAttribute(.backgroundColor, for: r)
                }
                return
            }
            let steps = 12
            let interval = duration / Double(steps)
            for step in 1...steps {
                DispatchQueue.main.asyncAfter(deadline: .now() + interval * Double(step)) { [weak self] in
                    guard let self, self.flashGeneration == generation,
                          let tlm = self.textLayoutManager,
                          let r = self.clampedTintRange(range).flatMap(self.textKit2Range(from:)) else { return }
                    if let alpha = AnchorFlashFade.alpha(atStep: step, of: steps, peak: peak) {
                        tlm.addRenderingAttribute(
                            .backgroundColor, value: color.withAlphaComponent(alpha), for: r)
                    } else {
                        tlm.removeRenderingAttribute(.backgroundColor, for: r)
                    }
                }
            }
        }

        /// NSRange → NSTextRange through the content manager's location
        /// arithmetic — the bridge every rendering-attribute call needs.
        private func textKit2Range(from range: NSRange) -> NSTextRange? {
            guard let textLayoutManager,
                  let contentManager = textLayoutManager.textContentManager else { return nil }
            let document = contentManager.documentRange
            guard let start = contentManager.location(document.location, offsetBy: range.location),
                  let end = contentManager.location(start, offsetBy: range.length) else { return nil }
            return NSTextRange(location: start, end: end)
        }

        /// The still-valid intersection of `range` with the current text, or nil
        /// if the text shrank past it — so a late fade frame never touches an
        /// out-of-bounds range.
        private func clampedTintRange(_ range: NSRange) -> NSRange? {
            guard let storage = textStorage else { return nil }
            let end = min(range.location + range.length, storage.length)
            guard range.location >= 0, end > range.location else { return nil }
            return NSRange(location: range.location, length: end - range.location)
        }

        /// Reduce Motion — the app's own toggle OR the system setting. The
        /// central gate: when on, motion collapses to instant.
        private static var prefersReducedMotion: Bool {
            UserDefaults.standard.string(forKey: "wiki:reduce-motion") == "1"
                || NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        }
    }
}

// MARK: - TextKit 2 paper attachments (charter W2-3)
//
// TextKit 2 ignores NSTextAttachmentCell entirely, so the paper cards are
// typed NSTextAttachment subclasses vending REAL NSViews through
// NSTextAttachmentViewProvider — the same paper drawing, now live views that
// own their own clicks. The typed subclass doubles as normalizeDocument's
// detection marker (type-based, replacing the old `is …Cell` checks).
// Internal (not private) so the migration tests can assert the types.

/// An image in the document flow is a piece of paper laid on the glass:
/// solid white card, rounded corners, a real shadow — the same material
/// honesty as EvidencePaperCard. An appshot card additionally carries its
/// loom://anchor URL so clicking it jumps back to the source passage.
final class PaperImageAttachment: NSTextAttachment {
    /// The appshot return link. Persistence rides the `.link` attribute
    /// (RTFD keeps it); normalizeDocument restores this copy on reload so
    /// the card's view can route the click itself.
    var anchorURL: String?

    /// The paper card's picture: the live image if set, else decoded from
    /// the RTFD file wrapper's bytes.
    var cardImage: NSImage? {
        image ?? fileWrapper?.regularFileContents.flatMap(NSImage.init(data:))
    }

    override func viewProvider(
        for parentView: NSView?,
        location: NSTextLocation,
        textContainer: NSTextContainer?
    ) -> NSTextAttachmentViewProvider? {
        PaperImageAttachmentViewProvider(
            textAttachment: self,
            parentView: parentView,
            textLayoutManager: textContainer?.textLayoutManager,
            location: location
        )
    }
}

final class PaperImageAttachmentViewProvider: NSTextAttachmentViewProvider {
    override init(
        textAttachment: NSTextAttachment,
        parentView: NSView?,
        textLayoutManager: NSTextLayoutManager?,
        location: NSTextLocation
    ) {
        super.init(textAttachment: textAttachment, parentView: parentView,
                   textLayoutManager: textLayoutManager, location: location)
        // The card is sized by attachmentBounds(for:…) below (width follows
        // the line fragment), not by the vended view's own size.
        tracksTextAttachmentViewBounds = true
    }

    override func loadView() {
        let attachment = textAttachment as? PaperImageAttachment
        view = PaperImageCardView(image: attachment?.cardImage, anchorURL: attachment?.anchorURL)
    }

    override func attachmentBounds(
        for attributes: [NSAttributedString.Key: Any],
        location: NSTextLocation,
        textContainer: NSTextContainer?,
        proposedLineFragment: CGRect,
        position: CGPoint
    ) -> CGRect {
        guard let image = (textAttachment as? PaperImageAttachment)?.cardImage,
              image.size.width > 0 else {
            return CGRect(x: 0, y: 0, width: 24, height: 24)
        }
        let padding = PaperImageCardView.padding
        let available = max(1, min(proposedLineFragment.width, PaperImageCardView.maxCardWidth) - padding * 2)
        let scale = min(1, available / image.size.width)
        return CGRect(
            x: 0, y: 0,
            width: image.size.width * scale + padding * 2,
            height: image.size.height * scale + padding * 2
        )
    }
}

/// The image card's live view: white paper, rounded corners, a real layer
/// shadow (a view's draw() is clipped to its backing store, so the old
/// cell's NSShadow moves onto the layer, which may paint outside bounds).
final class PaperImageCardView: NSView {
    static let padding: CGFloat = 10
    static let cornerRadius: CGFloat = 10
    static let maxCardWidth: CGFloat = 560

    private let image: NSImage?
    private let anchorURL: String?

    init(image: NSImage?, anchorURL: String?) {
        self.image = image
        self.anchorURL = anchorURL
        super.init(frame: .zero)
        wantsLayer = true
        if anchorURL != nil {
            toolTip = "Return to source — exact passage"
        }
    }

    required init?(coder: NSCoder) {
        fatalError("PaperImageCardView does not support NSCoding")
    }

    override var isFlipped: Bool { true }

    override func layout() {
        super.layout()
        guard let layer else { return }
        layer.masksToBounds = false
        layer.shadowColor = NSColor.black.withAlphaComponent(0.28).cgColor
        layer.shadowOpacity = 1
        // NSShadow blur 7 ≈ layer radius 3.5; offset -2 keeps the old
        // downward drop.
        layer.shadowRadius = 3.5
        layer.shadowOffset = CGSize(width: 0, height: -2)
        layer.shadowPath = CGPath(
            roundedRect: bounds.insetBy(dx: 1, dy: 1),
            cornerWidth: Self.cornerRadius, cornerHeight: Self.cornerRadius,
            transform: nil
        )
    }

    override func draw(_ dirtyRect: NSRect) {
        NSColor.white.setFill()
        NSBezierPath(
            roundedRect: bounds.insetBy(dx: 1, dy: 1),
            xRadius: Self.cornerRadius, yRadius: Self.cornerRadius
        ).fill()
        if let image {
            image.draw(
                in: bounds.insetBy(dx: Self.padding, dy: Self.padding),
                from: .zero, operation: .sourceOver, fraction: 1,
                respectFlipped: true,
                hints: [.interpolation: NSImageInterpolation.high]
            )
        }
    }

    override func mouseDown(with event: NSEvent) {
        // An appshot card follows its loom://anchor back to the passage —
        // the routing that lived in textView(_:clickedOn:…) under TextKit 1.
        if let anchorURL, let coordinator = loomEditorCoordinator {
            coordinator.routeAnchorLink(anchorURL)
            return
        }
        super.mouseDown(with: event)
    }

    override func resetCursorRects() {
        if anchorURL != nil { addCursorRect(bounds, cursor: .pointingHand) }
    }
}

/// A non-image file in the document flow: the same paper material as the
/// image card, compressed to a chip — file icon and name on solid white.
/// Carries its sourceID so the chip's own view opens the source on click,
/// and keeps the .loomref wrapper so the chip survives RTFD round trips.
final class PaperFileAttachment: NSTextAttachment {
    let chipLabel: String
    let sourceID: String
    let chipFileURL: URL?

    init(label: String, sourceID: String, fileURL: URL?, fileWrapper: FileWrapper) {
        self.chipLabel = label
        self.sourceID = sourceID
        self.chipFileURL = fileURL
        super.init(data: nil, ofType: nil)
        self.fileWrapper = fileWrapper
    }

    required init?(coder: NSCoder) {
        fatalError("PaperFileAttachment does not support NSCoding")
    }

    var fileIcon: NSImage {
        if let path = chipFileURL?.path, FileManager.default.fileExists(atPath: path) {
            return NSWorkspace.shared.icon(forFile: path)
        }
        if let ext = chipLabel.split(separator: ".").last.map(String.init),
           let type = UTType(filenameExtension: ext) {
            return NSWorkspace.shared.icon(for: type)
        }
        return NSWorkspace.shared.icon(for: .data)
    }

    override func viewProvider(
        for parentView: NSView?,
        location: NSTextLocation,
        textContainer: NSTextContainer?
    ) -> NSTextAttachmentViewProvider? {
        PaperFileAttachmentViewProvider(
            textAttachment: self,
            parentView: parentView,
            textLayoutManager: textContainer?.textLayoutManager,
            location: location
        )
    }
}

final class PaperFileAttachmentViewProvider: NSTextAttachmentViewProvider {
    override init(
        textAttachment: NSTextAttachment,
        parentView: NSView?,
        textLayoutManager: NSTextLayoutManager?,
        location: NSTextLocation
    ) {
        super.init(textAttachment: textAttachment, parentView: parentView,
                   textLayoutManager: textLayoutManager, location: location)
        tracksTextAttachmentViewBounds = true
    }

    override func loadView() {
        guard let chip = textAttachment as? PaperFileAttachment else {
            view = NSView()
            return
        }
        view = PaperFileChipView(label: chip.chipLabel, sourceID: chip.sourceID, fileIcon: chip.fileIcon)
    }

    override func attachmentBounds(
        for attributes: [NSAttributedString.Key: Any],
        location: NSTextLocation,
        textContainer: NSTextContainer?,
        proposedLineFragment: CGRect,
        position: CGPoint
    ) -> CGRect {
        guard let chip = textAttachment as? PaperFileAttachment else { return .zero }
        let size = PaperFileChipView.chipSize(label: chip.chipLabel)
        // Same geometry as the old cellBaselineOffset: the chip's bottom
        // sits 8pt below the baseline.
        return CGRect(x: 0, y: -8, width: size.width, height: size.height)
    }
}

/// The file chip's live view — and the new home of the chip click: it opens
/// its source directly, replacing the text view's TextKit 1 glyph hit-test.
final class PaperFileChipView: NSView {
    static let chipHeight: CGFloat = 30
    static let padding: CGFloat = 9
    static let maxLabelWidth: CGFloat = 240
    private static let labelFont = NSFont.systemFont(ofSize: 12, weight: .medium)

    let sourceID: String
    private let label: String
    private let fileIcon: NSImage

    static func chipSize(label: String) -> NSSize {
        let labelWidth = (label as NSString).size(withAttributes: [.font: labelFont]).width
        return NSSize(
            width: padding + 16 + 6 + min(labelWidth, maxLabelWidth) + padding,
            height: chipHeight
        )
    }

    init(label: String, sourceID: String, fileIcon: NSImage) {
        self.label = label
        self.sourceID = sourceID
        self.fileIcon = fileIcon
        super.init(frame: .zero)
        wantsLayer = true
        toolTip = label
    }

    required init?(coder: NSCoder) {
        fatalError("PaperFileChipView does not support NSCoding")
    }

    override var isFlipped: Bool { true }

    override func layout() {
        super.layout()
        guard let layer else { return }
        layer.masksToBounds = false
        layer.shadowColor = NSColor.black.withAlphaComponent(0.25).cgColor
        layer.shadowOpacity = 1
        layer.shadowRadius = 2.5
        layer.shadowOffset = CGSize(width: 0, height: -1.5)
        layer.shadowPath = CGPath(
            roundedRect: bounds.insetBy(dx: 1, dy: 1),
            cornerWidth: 8, cornerHeight: 8,
            transform: nil
        )
    }

    override func draw(_ dirtyRect: NSRect) {
        NSColor.white.setFill()
        NSBezierPath(
            roundedRect: bounds.insetBy(dx: 1, dy: 1),
            xRadius: 8, yRadius: 8
        ).fill()

        let iconRect = NSRect(
            x: Self.padding,
            y: bounds.midY - 8,
            width: 16,
            height: 16
        )
        fileIcon.draw(
            in: iconRect,
            from: .zero, operation: .sourceOver, fraction: 1,
            respectFlipped: true,
            hints: [.interpolation: NSImageInterpolation.high]
        )
        let size = (label as NSString).size(withAttributes: [.font: Self.labelFont])
        let textRect = NSRect(
            x: iconRect.maxX + 6,
            y: bounds.midY - size.height / 2,
            width: min(size.width, Self.maxLabelWidth),
            height: size.height
        )
        (label as NSString).draw(in: textRect, withAttributes: [
            .font: Self.labelFont,
            .foregroundColor: NSColor.black.withAlphaComponent(0.8),
        ])
    }

    override func mouseDown(with event: NSEvent) {
        // The chip opens its source — the routing that used to live in the
        // text view's mouseDown glyph hit-test and clickedOn-cell delegate.
        if !sourceID.isEmpty, let coordinator = loomEditorCoordinator {
            coordinator.onOpenSource(sourceID)
            return
        }
        super.mouseDown(with: event)
    }

    override func resetCursorRects() {
        addCursorRect(bounds, cursor: .pointingHand)
    }
}

/// Walk up to the enclosing editor and hand back its Coordinator — the
/// attachment views route clicks through the same delegate the link path
/// uses, so a chip click and a loom-source:// link click stay one behaviour.
private extension NSView {
    var loomEditorCoordinator: GlassDocumentEditor.Coordinator? {
        var ancestor = superview
        while let view = ancestor {
            if let textView = view as? NSTextView {
                return textView.delegate as? GlassDocumentEditor.Coordinator
            }
            ancestor = view.superview
        }
        return nil
    }
}

// Captured evidence as a piece of the original's paper: solid white card,
// dark ink, mono anchor — a content object on the glass.
private struct EvidencePaperCard: View {
    let trace: ReflectionLearningTrace
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        // The captured source quote at the SOURCE altitude (owner 2026-07-07:
        // the white card read as an inbox item; now it is indented book prose
        // behind a quote-spine hairline, the way a quotation sits in a research
        // note). The ◆ (precise rect) / ◇ (page-only) locator is the one
        // sanctioned cyan on the page — signal, not decoration; click opens the
        // source. Data unchanged: still the parsed trace, only the rendering.
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Rectangle()
                    .fill(isHovering ? AnyShapeStyle(LoomTokens.dsAnchor.opacity(0.55)) : AnyShapeStyle(.quaternary))
                    .frame(width: 1.5)
                    .frame(maxHeight: .infinity)
                let traceText = Text(trace.displayText)
                    .font(.system(size: 14.5, design: .serif))
                    .foregroundStyle(.secondary)
                let locatorText = Text(locatorSuffix)
                    .font(.system(size: 10))
                    .foregroundStyle(LoomTokens.dsAnchor)
                    .baselineOffset(3)
                Text("\(traceText)\(locatorText)")
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, 3)
            .padding(.leading, 8)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .accessibilityLabel(trace.displayText)
    }

    /// The trailing anchor locator: ◆ = precise rect, ◇ = page-only (weak),
    /// with the page label when known. The one place cyan lives in the body.
    private var locatorSuffix: String {
        let mark = trace.isWeakAnchor ? "◇" : "◆"
        if let page = trace.pageAnchorLabel {
            return "  \(mark) \(page)"
        }
        return "  \(mark)"
    }
}

private struct ReflectionComposer: View {
    @Binding var text: String
    @Binding var commitFocus: ReflectionCommitFocus
    let placeholder: String
    let isLearningCase: Bool
    let onSubmit: () -> Void

    private var hasCommitText: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if isLearningCase {
                // The type chips ARE the choice (design handoff §1): the user
                // sees what the text will become before typing. Words stay —
                // they carry the commit semantics, not chrome.
                HStack(spacing: 6) {
                    ForEach([ReflectionCommitFocus.meaning, .question, .correction, .principle], id: \.rawValue) { focus in
                        Button {
                            commitFocus = focus
                        } label: {
                            Text(focus.rawValue.capitalized)
                                .font(.system(size: 10.5, weight: .semibold))
                                .foregroundStyle(commitFocus == focus ? LoomTokens.dsPaperUp : LoomTokens.dsInk3)
                                .padding(.horizontal, 9)
                                .frame(height: 22)
                                .background(
                                    Capsule().fill(commitFocus == focus ? LoomTokens.dsInk1 : LoomTokens.dsPaperCard.opacity(0.7))
                                )
                                .overlay(
                                    Capsule().stroke(LoomTokens.dsHair, lineWidth: commitFocus == focus ? 0 : 1)
                                )
                        }
                        .buttonStyle(.plain)
                        .help("Commit the next entry as a \(focus.rawValue)")
                    }
                    Spacer(minLength: 0)
                }
                .padding(.bottom, 7)
            }
            HStack(alignment: .bottom, spacing: 9) {
                ZStack(alignment: .topLeading) {
                    TextEditor(text: $text)
                        .font(.system(size: 13))
                        .foregroundStyle(LoomTokens.dsInk1)
                        .scrollContentBackground(.hidden)
                        .frame(minHeight: isLearningCase ? 24 : 44, maxHeight: isLearningCase ? 34 : 84)
                        .padding(.leading, 10)
                        .padding(.trailing, isLearningCase ? 38 : 10)
                        .padding(.vertical, isLearningCase ? 3 : 8)
                    if text.isEmpty {
                        Text(placeholder)
                            .font(.system(size: 13))
                            .foregroundStyle(LoomTokens.dsInk3)
                            .padding(.horizontal, 15)
                            .padding(.vertical, isLearningCase ? 8 : 16)
                            .allowsHitTesting(false)
                    }

                    if isLearningCase && hasCommitText {
                        LinearGradient(
                            colors: [
                                Color.clear,
                                Color.white.opacity(0.32),
                                Color(red: 1.0, green: 0.24, blue: 0.34).opacity(0.10),
                                Color(red: 1.0, green: 0.84, blue: 0.28).opacity(0.08),
                                Color(red: 0.28, green: 0.66, blue: 1.0).opacity(0.12),
                                Color.clear
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        .blendMode(.plusLighter)
                        .frame(width: 120)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
                        .allowsHitTesting(false)
                    }

                    if isLearningCase {
                        Button(action: onSubmit) {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 12, weight: .semibold))
                                .frame(width: 24, height: 24)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(hasCommitText ? LoomTokens.dsPaperUp : LoomTokens.dsInk3)
                        .background(
                            Circle()
                                .fill(hasCommitText ? LoomTokens.dsInk1 : LoomTokens.dsPaperCard.opacity(0.85))
                        )
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(hasCommitText ? 0.28 : 0), lineWidth: 1)
                        )
                        .shadow(color: Color(red: 0.28, green: 0.66, blue: 1.0).opacity(hasCommitText ? 0.18 : 0), radius: 8, x: 0, y: 0)
                        .disabled(!hasCommitText)
                        .help("Save margin note")
                        .padding(.top, 6)
                        .padding(.trailing, 7)
                        .frame(maxWidth: .infinity, alignment: .topTrailing)
                    }
                }
                .background {
                    if !isLearningCase {
                        RoundedRectangle(cornerRadius: 9, style: .continuous)
                            .fill(LoomTokens.dsPaper.opacity(0.88))
                    }
                }
                .overlay {
                    if isLearningCase {
                        VStack(spacing: 0) {
                            Spacer(minLength: 0)
                            Rectangle()
                                .fill(LoomTokens.dsHair.opacity(0.78))
                                .frame(height: 1)
                        }
                    } else {
                        RoundedRectangle(cornerRadius: 9, style: .continuous)
                            .stroke(LoomTokens.dsHair, lineWidth: 1)
                    }
                }

                if !isLearningCase {
                    Button(action: onSubmit) {
                        Image(systemName: "paperplane")
                            .font(.system(size: 14, weight: .semibold))
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(LoomTokens.dsPaperDeep)
                    .background(LoomTokens.dsInk1, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    .disabled(!hasCommitText)
                    .opacity(hasCommitText ? 1 : 0.58)
                }
            }
        }
    }
}

// The right pane as a material panel (owner-pointed reference design,
// 2026-07-03): top-aligned system actions, then a light status footer.
// System semantics throughout — quinary row fill, quaternary hover/chips,
// secondary icons.
private struct ReflectionBridgePanel: View {
    // Scope law v2 (owner 2026-07-03): the pane is PROJECT-scoped — the
    // bridge between THIS project and the world. It is not a source list; the
    // selected file identity already lives in the main bar and the project list.
    let status: String
    let onFiles: () -> Void
    let onReview: () -> Void
    let onUnwired: (String) -> Void

    var body: some View {
        VStack(spacing: 12) {
            VStack(spacing: 8) {
                BridgeRow(
                    systemImage: "folder.badge.plus",
                    title: "Add files",
                    shortcut: "⌘P",
                    help: "Import local files as sources for this draft (or drag a file onto the document)",
                    action: onFiles
                )
                .keyboardShortcut("p", modifiers: .command)
                BridgeRow(
                    systemImage: "checklist",
                    title: "Review",
                    shortcut: "⌃⇧G",
                    help: "Review the current learning record",
                    action: onReview
                )
                .keyboardShortcut("g", modifiers: [.control, .shift])
                BridgeRow(
                    systemImage: "globe",
                    title: "Browser",
                    shortcut: "⌘T",
                    action: { onUnwired("Browser bridge arrives next") }
                )
                .keyboardShortcut("t", modifiers: .command)
                BridgeRow(
                    systemImage: "apple.terminal",
                    title: "Terminal",
                    shortcut: nil,
                    action: { onUnwired("Terminal arrives with the practice ground") }
                )
            }

            Spacer(minLength: 0)

            BridgeStatusFooter(
                status: status
            )
        }
        .padding(.top, reflectionBridgePanelTopPadding)
        .padding(.bottom, 18)
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct BridgeStatusFooter: View {
    let status: String

    private var trimmedStatus: String {
        status.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var displayStatus: String {
        trimmedStatus == "Local reflection workspace" ? "Ready" : trimmedStatus
    }

    var body: some View {
        HStack(spacing: 7) {
            if !displayStatus.isEmpty {
                Text(displayStatus)
                    .font(.system(size: 11.5))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 24)
        .accessibilityElement(children: .combine)
    }
}

private struct BridgeRow: View {
    let systemImage: String
    let title: String
    let shortcut: String?
    var help: String? = nil
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
                    .frame(width: 20)
                Text(title)
                    .font(.system(size: 14))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
                if let shortcut {
                    Text(shortcut)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(.quaternary, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                }
            }
            .padding(.horizontal, 14)
            .frame(height: 38)
            .background(
                isHovering ? AnyShapeStyle(.quaternary) : AnyShapeStyle(.quinary),
                in: RoundedRectangle(cornerRadius: 8, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .help(help ?? title)
        .accessibilityLabel(title)
    }
}

private struct ReflectionFileTypeBadge: View {
    let kind: String
    var fallbackColor: Color = LoomTokens.dsThread

    private var normalizedKind: String {
        kind.lowercased()
    }

    private var label: String {
        if normalizedKind.contains("pdf") {
            return "PDF"
        }
        if normalizedKind.contains("spreadsheet") || normalizedKind.contains("csv") || normalizedKind.contains("excel") || normalizedKind.contains("cell") {
            return "XLS"
        }
        if normalizedKind.contains("presentation") || normalizedKind.contains("slide") || normalizedKind.contains("powerpoint") {
            return "PPT"
        }
        if normalizedKind.contains("document") || normalizedKind.contains("word") || normalizedKind.contains("text") {
            return "DOC"
        }
        return "FILE"
    }

    private var fillColor: Color {
        switch label {
        case "PDF":
            return Color(red: 1.0, green: 0.36, blue: 0.39)
        case "XLS":
            return Color(red: 0.34, green: 0.66, blue: 0.39)
        case "PPT":
            return Color(red: 0.93, green: 0.61, blue: 0.30)
        case "DOC":
            return Color(red: 0.35, green: 0.56, blue: 0.96)
        default:
            return fallbackColor
        }
    }

    private var symbolName: String {
        switch label {
        case "XLS":
            return "tablecells.fill"
        case "PPT":
            return "rectangle.on.rectangle.angled.fill"
        case "DOC":
            return "doc.text.fill"
        case "PDF":
            return "doc.richtext.fill"
        default:
            return "doc.fill"
        }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Image(systemName: symbolName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(fillColor)
                .frame(width: 22, height: 22)

            if label != "FILE" {
                Text(label)
                    .font(.system(size: 5.5, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 2)
                    .frame(height: 8)
                    .background(fillColor, in: RoundedRectangle(cornerRadius: 2, style: .continuous))
                    .offset(x: 2, y: 1)
            }
        }
        .frame(width: 24, height: 24)
        .accessibilityLabel("\(label) file")
    }
}

private struct ReflectionDivider: View {
    var body: some View {
        // System semantics (owner 2026-07-03): the seam is the system's
        // separator color, tuned by Apple for every appearance/material.
        Rectangle()
            .fill(Color(nsColor: .separatorColor))
            .frame(width: 1)
    }
}

/// The seam between the center workspace and the Evidence pane: visually the
/// same hairline as ReflectionDivider, but with a wider hit area that drags
/// to resize the pane (clamped, persisted via AppStorage). Implemented on an
/// NSView because the workbench window is movable by background — a plain
/// SwiftUI gesture loses to AppKit's window drag, so the handle must return
/// mouseDownCanMoveWindow = false.
private struct ReflectionPaneResizer: View {
    @Binding var width: Double
    /// The reader sits LEFT of its seam (drag right grows it); the inspector
    /// sits RIGHT of its seam (drag left grows it — the default).
    var growsRightward: Bool = false
    var clamp: (Double) -> CGFloat = { clampedInspectorWidth($0) }
    var label: String = "Resize sources inspector"
    // The 1pt hairline was too faint to find (owner 2026-07-06: 右栏"无法调整" =
    // 没看见拖区). On hover it thickens, but stays at tertiary contrast so it
    // doesn't read like a selected border beside the inspector.
    @State private var isHovering = false

    private var seamColor: Color {
        Color(nsColor: isHovering ? .tertiaryLabelColor : .separatorColor)
            .opacity(isHovering ? 0.72 : 0.42)
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 1.25, style: .continuous)
                .fill(seamColor)
                .frame(width: isHovering ? 2 : 1)
                .animation(.easeOut(duration: 0.12), value: isHovering)
            ReflectionResizeHandle(width: $width, growsRightward: growsRightward, clamp: clamp)
        }
        .frame(width: 9)
        .contentShape(Rectangle())
        .onHover { isHovering = $0 }
        .accessibilityLabel(label)
    }
}

private struct ReflectionResizeHandle: NSViewRepresentable {
    @Binding var width: Double
    var growsRightward: Bool = false
    var clamp: (Double) -> CGFloat = { clampedInspectorWidth($0) }

    private func apply(_ view: ReflectionResizeHandleNSView) {
        view.onDragBegan = { clamp(width) }
        view.onDragChanged = { startWidth, deltaX in
            // Right-of-seam panes grow when dragged left; left-of-seam panes grow
            // when dragged right.
            let raw = growsRightward ? Double(startWidth) + Double(deltaX)
                                     : Double(startWidth) - Double(deltaX)
            width = Double(clamp(raw))
        }
    }

    func makeNSView(context: Context) -> ReflectionResizeHandleNSView {
        let view = ReflectionResizeHandleNSView()
        apply(view)
        return view
    }

    func updateNSView(_ nsView: ReflectionResizeHandleNSView, context: Context) {
        apply(nsView)
    }
}

final class ReflectionResizeHandleNSView: NSView {
    var onDragBegan: (() -> CGFloat)?
    var onDragChanged: ((CGFloat, CGFloat) -> Void)?
    private var dragStartX: CGFloat?
    private var dragStartWidth: CGFloat?

    override var mouseDownCanMoveWindow: Bool { false }

    override func resetCursorRects() {
        addCursorRect(bounds, cursor: .resizeLeftRight)
    }

    override func mouseDown(with event: NSEvent) {
        dragStartX = event.locationInWindow.x
        dragStartWidth = onDragBegan?()
    }

    override func mouseDragged(with event: NSEvent) {
        guard let startX = dragStartX, let startWidth = dragStartWidth else { return }
        onDragChanged?(startWidth, event.locationInWindow.x - startX)
    }

    override func mouseUp(with event: NSEvent) {
        dragStartX = nil
        dragStartWidth = nil
    }
}
