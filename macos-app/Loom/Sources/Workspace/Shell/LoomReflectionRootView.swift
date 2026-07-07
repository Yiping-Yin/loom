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
private let reflectionSidebarTopClearance: CGFloat = 60
// The in-window reader sits FLUSH under the floating top bar (owner 2026-07-06:
// "空的太多"). Its own header row is gone, so it only needs to clear the bar's
// height — not the larger note-column clearance above. Kept separate so tuning
// the reader never disturbs the four note/thread call sites of the 60 constant.
private let reflectionReaderTopClearance: CGFloat = reflectionTopBarHeight
private let reflectionThreadMaxWidth: CGFloat = 720
private let reflectionTrafficLightClearance: CGFloat = 88
private let reflectionTitlebarControlSize: CGFloat = 16
private let reflectionTitlebarControlCenterY: CGFloat = 16
private let reflectionTitlebarContentTop: CGFloat = reflectionTitlebarControlCenterY - (reflectionTitlebarControlSize / 2)
private let reflectionThreadTopPadding: CGFloat = 76
private let reflectionInspectorTopPadding: CGFloat = 74
private let reflectionBridgePanelTopPadding: CGFloat = 116
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
    @State private var isSidebarPresented: Bool = true
    @State private var isSidebarPeeking: Bool = false
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

    private var shouldShowSidebar: Bool { isSidebarPresented || isSidebarPeeking }
    private var shouldOverlaySidebar: Bool { !isSidebarPresented && isSidebarPeeking }
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
    var body: some View {
        ZStack(alignment: .topLeading) {
            HStack(spacing: 0) {
                if isSidebarPresented {
                    ReflectionSidebar(
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
                        onRenameProject: renameProject,
                        onDeleteProject: deleteProject,
                        onNewChatInProject: createChat(inProject:),
                        onMoveChat: moveChat
                    )
                    .frame(width: reflectionSidebarWidth)
                    .transition(.move(edge: .leading).combined(with: .opacity))
                    .onHover { hovering in
                        updateSidebarPeek(hovering)
                    }

                    ReflectionDivider()
                }

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
                // the root matte below. Columns never stack their own
                // behind-window material on top of it.
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            ReflectionTopBar(
                reflectionCase: selectedCase,
                nativeSource: nativeSource,
                isWorkspaceEmpty: isWorkspaceEmpty,
                isSidebarPresented: isSidebarPresented,
                isInspectorPresented: isInspectorPresented,
                isReadingSource: anchorPreview != nil,
                isNoteCollapsed: isReadingNoteCollapsed,
                sourceCount: isWorkspaceEmpty ? 0 : selectedCase.sources.count,
                onToggleSidebar: toggleSidebar,
                onToggleInspector: toggleInspector,
                onOpenSourceInNativeApp: openSelectedSourceInNativeApp
            )
            .zIndex(1)

            if shouldOverlaySidebar {
                HStack(spacing: 0) {
                    ReflectionSidebar(
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
                        onRenameProject: renameProject,
                        onDeleteProject: deleteProject,
                        onNewChatInProject: createChat(inProject:),
                        onMoveChat: moveChat
                    )
                    .frame(width: reflectionSidebarWidth)
                    .background(ReflectionSidebarPeekBackdrop())

                    ReflectionDivider()
                }
                .frame(maxHeight: .infinity, alignment: .topLeading)
                .transition(.move(edge: .leading).combined(with: .opacity))
                .onHover { hovering in
                    updateSidebarPeek(hovering)
                }
                .zIndex(0.75)
            }

            if !shouldShowSidebar {
                ReflectionLeftEdgePeekZone()
                    .frame(width: 18)
                    .frame(maxHeight: .infinity)
                    .onHover { hovering in
                        if hovering {
                            updateSidebarPeek(true)
                        }
                    }
                    .zIndex(0.5)
            }

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
        .ignoresSafeArea(.container, edges: .top)
        .background(ReflectionMatteWorkbenchBackground().ignoresSafeArea())
        .background(
            WindowConfigurator(
                title: "Loom",
                isNight: colorScheme == .dark,
                contentExtendsUnderTitlebar: true,
                removesSystemToolbar: true,
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
            if normalizeUntouchedProductReflections() {
                persistWorkspace()
            }
            consumePendingCapture()
            consumePendingExternalFiles()
            consumePendingExternalSelection()
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
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureFromURL)) { note in
            let token = note.userInfo?["token"] as? UUID
            if let token, token == lastHandledCaptureToken { return }
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
        withAnimation(.easeInOut(duration: 0.18)) {
            isSidebarPresented.toggle()
            isSidebarPeeking = false
        }
    }

    private func updateSidebarPeek(_ shouldPeek: Bool) {
        guard !isSidebarPresented else { return }
        withAnimation(.easeInOut(duration: 0.18)) {
            isSidebarPeeking = shouldPeek
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

    private func renameProject(_ id: String, to name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let index = projects.firstIndex(where: { $0.id == id }) else { return }
        projects[index].name = trimmed
        persistWorkspace()
    }

    private func deleteProject(_ id: String) {
        // A project is a container, never an owner: deleting it only ungroups
        // its drafts — it never deletes a draft.
        for index in cases.indices where cases[index].projectID == id {
            cases[index].projectID = nil
        }
        projects.removeAll { $0.id == id }
        persistWorkspace()
        statusMessage = "Project removed — its drafts are now ungrouped"
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
        if openAfterImport {
            openSourcesInNativeApps(importedSources)
            statusMessage = importedSources.count == 1
                ? "Imported \(importedSources[0].label) and opened it in the native app"
                : "Imported \(importedSources.count) local sources and opened them in native apps"
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
              pending.token != lastHandledCaptureToken else { return }
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
        isSidebarPresented = false
        isSidebarPeeking = false
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
    @ViewBuilder
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
        statusMessage = precise
            ? "Noted passage from page \(page + 1)"
            : "Noted from page \(page + 1) — exact spot not found, will jump to the page"
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
            isSidebarPresented = false
            isSidebarPeeking = false
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
        isSidebarPresented = false
        isSidebarPeeking = false
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

private struct ReflectionTopBar: View {
    let reflectionCase: ReflectionCase
    let nativeSource: ReflectionSource?
    let isWorkspaceEmpty: Bool
    let isSidebarPresented: Bool
    let isInspectorPresented: Bool
    // While a source is open, the right-pane toggle drives the NOTE (which IS
    // the right pane then), not the hidden evidence pane (owner 2026-07-06).
    let isReadingSource: Bool
    let isNoteCollapsed: Bool
    let sourceCount: Int
    let onToggleSidebar: () -> Void
    let onToggleInspector: () -> Void
    let onOpenSourceInNativeApp: () -> Void
    // The Evidence strip tracks the resizable pane width live.
    @AppStorage(reflectionInspectorWidthKey) private var inspectorWidth: Double = Double(reflectionInspectorDefaultWidth)

    /// The top-bar title: the chat's real name once named; otherwise the SOURCE
    /// it's about (Week 1 Notes) — not the app brand "LOOM" (owner 2026-07-06:
    /// 这里不应该是 LOOM). The file-type badge already carries the kind, so the
    /// filename shows without its extension. "LOOM" only for a truly empty app.
    private var barTitle: String {
        if !isWorkspaceEmpty, reflectionCase.title != ReflectionCase.untitledPlaceholder {
            return reflectionCase.title
        }
        if let label = nativeSource?.label ?? reflectionCase.sources.first?.label, !label.isEmpty {
            return (label as NSString).deletingPathExtension
        }
        return "LOOM"
    }

    var body: some View {
        HStack(spacing: 0) {
            HStack(spacing: 8) {
                Spacer().frame(width: reflectionTrafficLightClearance)
                sidebarButton
                Spacer(minLength: 0)
            }
            .frame(width: isSidebarPresented ? reflectionSidebarWidth : reflectionTrafficLightClearance + 36)

            HStack(spacing: 9) {
                if isWorkspaceEmpty {
                    MoonAvatar(size: 16)
                        .frame(width: 18, height: 18)
                } else {
                    ReflectionFileTypeBadge(
                        kind: nativeSource?.kind ?? reflectionCase.sources.first?.kind ?? "document",
                        fallbackColor: LoomTokens.dsInk3
                    )
                    .scaleEffect(0.78)
                    .frame(width: 18, height: 18)
                }

                // An unnamed chat shows the SOURCE it's about (Week 1 Notes), not
                // the app brand "LOOM" and not the fake placeholder — the real
                // title appears once the user names it (owner 2026-07-06).
                Text(barTitle)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .lineLimit(1)

                if !isWorkspaceEmpty {
                    Circle()
                        .fill(reflectionCase.status == "Second pass ready" ? LoomTokens.dsSuccess : LoomTokens.dsInk3)
                        .frame(width: 6, height: 6)
                        .help(reflectionCase.status)

                    if sourceCount > 1 {
                        Label("\(sourceCount)", systemImage: "folder")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(LoomTokens.dsInk3)
                    }

                    if nativeSource?.fileURL != nil {
                        Button(action: onOpenSourceInNativeApp) {
                            Image(systemName: "arrow.up.forward.app")
                                .font(.system(size: 12, weight: .medium))
                                .frame(width: reflectionTitlebarControlSize, height: reflectionTitlebarControlSize)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(LoomTokens.dsInk3)
                        .contentShape(Rectangle())
                        .accessibilityLabel("Open Source")
                        .help("Open original file in the default native app")
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(.leading, isSidebarPresented ? 18 : 8)
            .padding(.trailing, 14)
            .frame(height: reflectionTitlebarControlSize)
            .frame(maxWidth: .infinity)

            // No pane title (owner 2026-07-03: 摘掉) — the launcher rows
            // speak for themselves; only the pane toggle remains.
            inspectorButton
                .padding(.trailing, 16)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, reflectionTitlebarContentTop)
        .frame(height: reflectionTopBarHeight, alignment: .topLeading)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .allowsHitTesting(true)
    }

    private var sidebarButton: some View {
        ReflectionTopBarButton(
            systemName: "sidebar.left",
            isActive: isSidebarPresented,
            help: isSidebarPresented ? "Hide sidebar" : "Show sidebar",
            action: onToggleSidebar
        )
    }

    private var inspectorButton: some View {
        ReflectionTopBarButton(
            systemName: "sidebar.right",
            isActive: isReadingSource ? !isNoteCollapsed : isInspectorPresented,
            help: isReadingSource
                ? (isNoteCollapsed ? "Show notes" : "Hide notes")
                : (isInspectorPresented ? "Hide evidence" : "Show evidence"),
            action: onToggleInspector
        )
    }
}

private struct ReflectionTopBarButton: View {
    let systemName: String
    let isActive: Bool
    let help: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 12, weight: .medium))
                .frame(width: reflectionTitlebarControlSize, height: reflectionTitlebarControlSize)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(
                            isActive ? Color.white.opacity(0.18) : Color.white.opacity(0.08),
                            lineWidth: 0.5
                        )
                )
        }
        .buttonStyle(.plain)
        .foregroundStyle(isActive ? LoomTokens.dsInk2 : LoomTokens.dsInk3)
        .contentShape(Rectangle())
        .help(help)
    }
}

// The Explorer (owner-directed left-rail redesign, 2026-07-03): a project
// explorer in the VSCode grammar — sticky uppercase sections with mono
// counts, dense two-line rows, hover-revealed actions — laid directly on
// the window's one pane of glass. Categorization is DERIVED (the
// "Learning pass" discriminator that already exists); store order is
// preserved (updatedAt is a display string, not a Date — never sort on it).
private struct ReflectionSidebar: View {
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
            ReflectionSidebarSearchField(text: $query, focus: $searchFocused)
                .padding(.top, reflectionSidebarTopClearance)
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
                            Section(header: SidebarSectionHeader(
                                title: "Projects",
                                count: projects.count,
                                onAdd: onCreateProject
                            )) {
                                ForEach(orderedProjects) { project in
                                    SidebarProjectHeader(
                                        project: project,
                                        count: chats(inProject: project.id).count,
                                        isExpanded: projectExpansion(project.id),
                                        forceExpanded: !queryIsEmpty,
                                        onNewChat: { onNewChatInProject(project.id) },
                                        onRename: { onRenameProject(project.id, $0) },
                                        onDelete: { onDeleteProject(project.id) }
                                    )
                                    if projectExpansion(project.id).wrappedValue || !queryIsEmpty {
                                        let grouped = chats(inProject: project.id)
                                        if grouped.isEmpty {
                                            Text("No drafts yet")
                                                .font(.system(size: 11))
                                                .foregroundStyle(.tertiary)
                                                .padding(.leading, 48)
                                                .padding(.vertical, 4)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                        } else {
                                            ForEach(grouped) { reflectionCase in
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

            Button(action: onCreateProject) {
                Image(systemName: "folder.badge.plus")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(width: 30, height: 34)
                    .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .buttonStyle(.plain)
            .help("New project")
            .accessibilityLabel("New project")
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
                                                .fill(LoomTokens.dsThread)
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

// The moon as GLASS RELIEF (owner 2026-07-04: 能否设计成玻璃浮雕?) — not
// a photograph laid on the pane but the pane itself shaped by light: a
// corona breathing out from behind the top limb, a grazing rim light, a
// settled shadow at the bottom edge, and a breath of depth inside the
// disc. Pure light and material — instrument-room legal, resolution
// independent, appearance-following.
private struct MoonGlassRelief: View {
    var size: CGFloat = 240

    var body: some View {
        ZStack {
            // The corona, UNEVENLY caught (2026-07-04 光影 reference:
            // light through material gathers in the folds — it is never a
            // lamp's even radial). Two off-axis blooms and two hand-drawn
            // caustic wisps stand in for the folds.
            Ellipse()
                .fill(Color.white.opacity(0.075))
                .frame(width: size * 1.18, height: size * 0.72)
                .rotationEffect(.degrees(-14))
                .offset(x: -size * 0.05, y: -size * 0.50)
                .blur(radius: size * 0.11)
            Ellipse()
                .fill(Color.white.opacity(0.05))
                .frame(width: size * 0.68, height: size * 0.40)
                .rotationEffect(.degrees(16))
                .offset(x: size * 0.20, y: -size * 0.44)
                .blur(radius: size * 0.085)
            MoonCausticWisp(variant: 0)
                .stroke(Color.white.opacity(0.10), style: StrokeStyle(lineWidth: size * 0.016, lineCap: .round))
                .frame(width: size * 1.5, height: size * 1.5)
                .blur(radius: size * 0.024)
            MoonCausticWisp(variant: 1)
                .stroke(Color.white.opacity(0.07), style: StrokeStyle(lineWidth: size * 0.010, lineCap: .round))
                .frame(width: size * 1.5, height: size * 1.5)
                .blur(radius: size * 0.030)

            // The caustic pool: the glass's signature written elsewhere —
            // light that passed THROUGH the carving, pooled on the pane
            // below. Energy hierarchy: limb > pool > field > shadow.
            Ellipse()
                .fill(Color.white.opacity(0.05))
                .frame(width: size * 0.72, height: size * 0.15)
                .offset(y: size * 0.64)
                .blur(radius: size * 0.045)
            Ellipse()
                .fill(Color.white.opacity(0.08))
                .frame(width: size * 0.30, height: size * 0.07)
                .offset(x: size * 0.06, y: size * 0.62)
                .blur(radius: size * 0.028)

            Circle()
                // FROST IS LIGHT (the research's master inversion), and
                // the mezzotint reference adds the vignette: the face's
                // centre sleeps dark while the frost brightens toward the
                // limb where the backlight grazes.
                .fill(
                    RadialGradient(
                        colors: [
                            Color.white.opacity(0.022),
                            Color.white.opacity(0.045),
                            Color.white.opacity(0.085),
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: size * 0.5
                    )
                )
                .overlay(
                    // Maria: the shallower frost — two quiet dimmer seas.
                    ZStack {
                        Ellipse()
                            .fill(Color.black.opacity(0.035))
                            .frame(width: size * 0.42, height: size * 0.34)
                            .offset(x: -size * 0.10, y: -size * 0.06)
                            .blur(radius: size * 0.055)
                        Ellipse()
                            .fill(Color.black.opacity(0.028))
                            .frame(width: size * 0.30, height: size * 0.24)
                            .offset(x: size * 0.14, y: size * 0.14)
                            .blur(radius: size * 0.05)
                    }
                    .clipShape(Circle())
                )
                .overlay(
                    // Craters: edges outshine fills — thin bright rim arcs
                    // facing the light, a faint paired shadow opposite
                    // (the brilliant-cut miter), fills left empty.
                    MoonCraterField(size: size)
                )
                .overlay(
                    // The Fresnel limb, full circumference (the mezzotint
                    // reference rings the WHOLE disc): a broad soft halo
                    // hugging the edge, a continuous thin ring, and
                    // brighter pools where the light gathers in folds.
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.10), style: StrokeStyle(lineWidth: 5))
                            .blur(radius: 4.5)
                        Circle()
                            .stroke(Color.white.opacity(0.20), style: StrokeStyle(lineWidth: 1.2))
                            .blur(radius: 0.7)
                        Circle()
                            .trim(from: 0.63, to: 0.78)
                            .stroke(Color.white.opacity(0.62), style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
                            .blur(radius: 0.5)
                        Circle()
                            .trim(from: 0.82, to: 0.90)
                            .stroke(Color.white.opacity(0.34), style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
                            .blur(radius: 0.7)
                        Circle()
                            .trim(from: 0.08, to: 0.22)
                            .stroke(Color.white.opacity(0.26), style: StrokeStyle(lineWidth: 1.2, lineCap: .round))
                            .blur(radius: 0.7)
                    }
                )
                .overlay(
                    // The relief lives UNDER the sheen: one unbroken
                    // specular veil across the upper face, laid over every
                    // carved feature so the moon floats INSIDE the glass.
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.white.opacity(0.075), .clear],
                                startPoint: UnitPoint(x: 0.30, y: 0.02),
                                endPoint: UnitPoint(x: 0.55, y: 0.58)
                            )
                        )
                )
                .overlay(
                    // The settled contact shadow — the quietest term.
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [.clear, Color.black.opacity(0.24)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 1.2
                        )
                        .blur(radius: 1.6)
                        .offset(y: 1.2)
                )
                .frame(width: size, height: size)
        }
        .accessibilityHidden(true)
        .allowsHitTesting(false)
    }
}

// Deterministic pseudo-random stream for the engraved field — fixed
// seed, so the moon is carved once, identically, forever.
private struct LunarSeededStream {
    private var state: UInt64
    init(seed: UInt64) { state = seed }
    mutating func nextUnit() -> CGFloat {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        z ^= z >> 31
        return CGFloat(z >> 11) / CGFloat(1 << 53)
    }
}

// The engraved lunar field (owner reference 2026-07-04, the mezzotint
// moon): TONE IS DENSITY — the surface is a field of packed grain and
// crater rims, dim at the face's centre and increasingly lit toward the
// limb where the backlight grazes. Every mark is a lit arc facing the
// light with a paired shadow wall; fills stay empty. Drawn procedurally
// in a Canvas from a fixed seed — no bitmap, no randomness at runtime.
private struct MoonCraterField: View {
    let size: CGFloat

    var body: some View {
        Canvas { context, canvasSize in
            var stream = LunarSeededStream(seed: 0x4C554E41)  // "LUNA"
            let radius = canvasSize.width / 2
            let center = CGPoint(x: radius, y: radius)

            // Stipple grain: hundreds of faint specks, densest brightness
            // near the limb, nearly asleep at the centre of the face.
            for _ in 0..<640 {
                let angle = stream.nextUnit() * 2 * .pi
                let r = sqrt(stream.nextUnit()) * radius * 0.97
                let point = CGPoint(x: center.x + cos(angle) * r, y: center.y + sin(angle) * r)
                let limbProximity = r / radius
                let topness = 0.5 - 0.5 * sin(angle)   // canvas y grows down: top of disc = 1
                let alpha = 0.012 + 0.075 * pow(limbProximity, 2.2) * (0.45 + 0.55 * topness)
                let dot = 0.5 + stream.nextUnit() * 0.9
                context.fill(
                    Path(ellipseIn: CGRect(x: point.x - dot / 2, y: point.y - dot / 2, width: dot, height: dot)),
                    with: .color(.white.opacity(alpha))
                )
            }

            // Crater rims: many small, few large (power-law sizes); each
            // rim is lit toward the upper light and shadowed opposite,
            // and the closer to the limb, the brighter it catches.
            for _ in 0..<96 {
                let angle = stream.nextUnit() * 2 * .pi
                let r = sqrt(stream.nextUnit()) * radius * 0.90
                let point = CGPoint(x: center.x + cos(angle) * r, y: center.y + sin(angle) * r)
                let craterRadius = (0.010 + pow(stream.nextUnit(), 2.9) * 0.052) * radius
                let limbProximity = r / radius
                let alpha = 0.032 + 0.34 * pow(limbProximity, 2.1)
                let lineWidth = max(0.5, craterRadius * 0.18)

                var lit = Path()
                lit.addArc(
                    center: point,
                    radius: craterRadius,
                    startAngle: .degrees(-165),
                    endAngle: .degrees(-15),
                    clockwise: false
                )
                context.stroke(
                    lit,
                    with: .color(.white.opacity(alpha)),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )

                var shadow = Path()
                shadow.addArc(
                    center: point,
                    radius: craterRadius,
                    startAngle: .degrees(25),
                    endAngle: .degrees(140),
                    clockwise: false
                )
                context.stroke(
                    shadow,
                    with: .color(.black.opacity(alpha * 0.5)),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}

// Hand-tuned flowing curves above the limb — the caustic trails the
// reference installation leaves where its folds concentrate the light.
// Fixed control points (no randomness): two quiet strands, not noise.
private struct MoonCausticWisp: Shape {
    let variant: Int

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        if variant == 0 {
            path.move(to: CGPoint(x: w * 0.26, y: h * 0.34))
            path.addCurve(
                to: CGPoint(x: w * 0.58, y: h * 0.18),
                control1: CGPoint(x: w * 0.34, y: h * 0.22),
                control2: CGPoint(x: w * 0.47, y: h * 0.15)
            )
            path.addCurve(
                to: CGPoint(x: w * 0.78, y: h * 0.30),
                control1: CGPoint(x: w * 0.68, y: h * 0.21),
                control2: CGPoint(x: w * 0.74, y: h * 0.24)
            )
        } else {
            path.move(to: CGPoint(x: w * 0.40, y: h * 0.12))
            path.addCurve(
                to: CGPoint(x: w * 0.66, y: h * 0.10),
                control1: CGPoint(x: w * 0.49, y: h * 0.05),
                control2: CGPoint(x: w * 0.58, y: h * 0.05)
            )
        }
        return path
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

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // form A — the quiet colophon signature: a STATIC, system-ink line
            // that honestly names the local corpus (sources + notes). No motion,
            // pull-only; the text is the source of truth and passes the mute-test.
            Text(ColophonStatus.text(sourceCount: sourceCount, noteCount: noteCount))
                .font(.system(size: 11))
                .foregroundStyle(.tertiary)
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.top, 8)

            HStack(spacing: 8) {
            // Bottom strip = identity + settings only. About lives in the App
            // menu (⌘ → About Loom, its macOS-standard home), NOT here — owner
            // 2026-07-07 dropped the strip glyph to keep the footer clean and
            // avoid duplicating the App-menu entry.
            // "You" — the evidenced-self dossier (Education · Experience ·
            // Digital Me). Same-stroke SF glyph, no accent tint.
            SidebarRailIcon(
                systemImage: "person.crop.circle",
                help: "You · your evidenced self — Local, on-device",
                tooltipAnchor: .leading
            ) {
                openWindow(id: DossierWindow.id)
            }

            Spacer(minLength: 0)

            SidebarRailIcon(
                systemImage: "gearshape",
                help: "Settings (⌘,)",
                tooltipAnchor: .trailing
            ) {
                openSettings()
            }
            }
            .padding(.horizontal, 12)
            .frame(height: 40)
        }
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

private struct SidebarNewProjectRow: View {
    let onCreate: () -> Void
    let onCreateLearning: () -> Void
    @State private var isHovering = false
    @State private var isPresenting = false

    var body: some View {
        // Plain Button + popover: Menu labels re-layout images with
        // menu-item metrics (breaking the shared left axis), and a
        // transparent-label Menu never receives clicks — both measured
        // live 2026-07-03. The popover is the reliable native chooser.
        Button {
            isPresenting = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "plus")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(isHovering ? .primary : .secondary)
                    .frame(width: 22)
                Text("New project")
                    .font(.system(size: 13))
                    .foregroundStyle(isHovering ? .primary : .secondary)
                Spacer(minLength: 0)
            }
            .padding(.leading, 8)
            .frame(height: 36)
            .background {
                if isHovering || isPresenting {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(.quinary)
                }
            }
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .popover(isPresented: $isPresenting, arrowEdge: .bottom) {
            VStack(alignment: .leading, spacing: 2) {
                NewProjectChoice(
                    systemImage: "rectangle.and.text.magnifyingglass",
                    title: "Product reflection"
                ) {
                    isPresenting = false
                    onCreate()
                }
                NewProjectChoice(systemImage: "book", title: "Learning project") {
                    isPresenting = false
                    onCreateLearning()
                }
            }
            .padding(6)
            .frame(width: 220)
        }
        .accessibilityLabel("New project")
    }
}

private struct NewProjectChoice: View {
    let systemImage: String
    let title: String
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(width: 18)
                Text(title)
                    .font(.system(size: 12.5))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .frame(height: 30)
            .background {
                if isHovering {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(.quaternary)
                }
            }
            .contentShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
    }
}

private struct SidebarCreateMenu: View {
    let onCreate: () -> Void
    let onCreateLearning: () -> Void
    @State private var isHovering = false

    var body: some View {
        Menu {
            Button {
                onCreate()
            } label: {
                Label("Product reflection", systemImage: "rectangle.and.text.magnifyingglass")
            }
            Button {
                onCreateLearning()
            } label: {
                Label("Learning project", systemImage: "book")
            }
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(isHovering ? .primary : .secondary)
                .frame(width: 28, height: 28)
                .background {
                    if isHovering {
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .fill(.quinary)
                    }
                }
                .contentShape(Rectangle())
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.hidden)
        .buttonStyle(.plain)
        .fixedSize()
        .onHover { isHovering = $0 }
        .accessibilityLabel("New project")
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

private struct SidebarIdentityFooter: View {
    // The utility strip (vertical-tabs bottom-bar grammar, owner-pointed
    // reference 2026-07-03): identity at left, machine count, Settings at
    // right. Every icon wires to something real.
    let projectCount: Int
    @Environment(\.openWindow) private var openWindow
    @Environment(\.openSettings) private var openSettings
    @State private var hoveringAvatar = false

    var body: some View {
        HStack(spacing: 10) {
            Button {
                openWindow(id: AboutWindow.id)
            } label: {
                MoonAvatar()
                    .opacity(hoveringAvatar ? 1.0 : 0.9)
            }
            .buttonStyle(.plain)
            .onHover { hoveringAvatar = $0 }
            .help("About Loom — local, on-device")
            .accessibilityLabel("About Loom")

            Spacer(minLength: 0)

            Text("\(projectCount) project\(projectCount == 1 ? "" : "s")")
                .font(.system(size: 10.5, design: .monospaced))
                .foregroundStyle(.tertiary)

            Button {
                // SettingsLink and the legacy showSettingsWindow: selector
                // both refuse to fire from this hosting context on macOS 27
                // (verified live 2026-07-03); the openSettings environment
                // action is the modern reliable route.
                openSettings()
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                    .frame(width: 24, height: 24)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .help("Settings")
            .accessibilityLabel("Settings")
        }
        .padding(.horizontal, 12)
        .frame(height: 44)
        .overlay(alignment: .top) {
            Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1)
        }
    }
}

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
                                    .fill(LoomTokens.dsThread)
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
                                            .foregroundStyle(LoomTokens.dsThread)
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
                                .fill(LoomTokens.dsThread)
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

@available(macOS 26.0, *)
private struct ReflectionLiquidGlassBackground: NSViewRepresentable {
    let style: NSGlassEffectView.Style

    func makeNSView(context: Context) -> NSGlassEffectView {
        let view = NSGlassEffectView()
        view.style = style
        view.cornerRadius = 0
        view.tintColor = nil
        return view
    }

    func updateNSView(_ view: NSGlassEffectView, context: Context) {
        view.style = style
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
                    .fill(LoomTokens.dsThread.opacity(0.18))
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

private struct SidebarRowActionButton: View {
    let systemImage: String
    let help: String
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 11))
                .foregroundStyle(isHovering ? .primary : .secondary)
                .frame(width: 22, height: 22)
                .background {
                    if isHovering {
                        RoundedRectangle(cornerRadius: 5, style: .continuous)
                            .fill(.quaternary)
                    }
                }
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .help(help)
        .accessibilityLabel(help)
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
                                            Text(provenanceLabel)
                                                .font(.system(size: 12, design: .serif))
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                    .padding(.top, 8)
                                }

                                if shouldShowSourceList {
                                    ProjectSourcesList(
                                        sources: reflectionCase.sources,
                                        selectedSourceID: selectedSourceID,
                                        onOpenSource: onOpenSourceID
                                    )
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

                                ForEach(traces) { trace in
                                    EvidencePaperCard(trace: trace) {
                                        onSelectTrace(trace)
                                    }
                                }

                                ForEach(contentSteps) { step in
                                    VStack(alignment: .leading, spacing: 10) {
                                        Text(step.title.uppercased())
                                            .font(.system(size: 11, weight: .semibold))
                                            .tracking(0.8)
                                            .foregroundStyle(.secondary)
                                        ForEach(step.items, id: \.self) { item in
                                            Text(item)
                                                .font(.system(size: 15, design: .serif))
                                                .lineSpacing(5)
                                                .foregroundStyle(.primary)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                    }
                                    .id(step.id)
                                }
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
                            if !isReadingSource, documentHeadings.count + contentSteps.count > 1 {
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
                                    ForEach(contentSteps) { step in
                                        Button {
                                            withAnimation { proxy.scrollTo(step.id, anchor: .top) }
                                        } label: {
                                            Text(step.title)
                                                .font(.system(size: 10.5))
                                                .foregroundStyle(.tertiary)
                                                .lineLimit(1)
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

private struct ProjectSourcesList: View {
    let sources: [ReflectionSource]
    let selectedSourceID: ReflectionSource.ID?
    let onOpenSource: (ReflectionSource.ID) -> Void

    private var title: String {
        sources.count == 1 ? "Source" : "Sources"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 10.5, weight: .semibold, design: .monospaced))
                    .tracking(0.8)
                    .textCase(.uppercase)
                    .foregroundStyle(.secondary)
                Text("\(sources.count)")
                    .font(.system(size: 10.5, weight: .medium, design: .monospaced))
                    .foregroundStyle(.tertiary)
                Spacer(minLength: 0)
            }

            VStack(spacing: 4) {
                ForEach(sources) { source in
                    ProjectSourceRow(
                        source: source,
                        isSelected: source.id == selectedSourceID,
                        onOpen: { onOpenSource(source.id) }
                    )
                }
            }
        }
        .accessibilityElement(children: .contain)
    }
}

private struct ProjectSourceRow: View {
    let source: ReflectionSource
    let isSelected: Bool
    let onOpen: () -> Void
    @State private var isHovering = false

    private var subtitle: String {
        [source.kind.uppercased(), source.meta]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    private var canOpen: Bool {
        source.fileURL != nil
    }

    var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 10) {
                ReflectionFileTypeBadge(kind: source.kind, fallbackColor: LoomTokens.dsInk3)
                    .scaleEffect(0.74)
                    .frame(width: 18, height: 18)

                VStack(alignment: .leading, spacing: 1) {
                    Text(source.label)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    if !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.system(size: 10.5))
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                if canOpen {
                    Label("Open", systemImage: "book")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(.secondary)
                        .labelStyle(.titleAndIcon)
                } else {
                    Text("Captured")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, 10)
            .frame(height: 38)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .background {
            if isSelected {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(LoomTokens.dsThread.opacity(isHovering ? 0.18 : 0.12))
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
        .help(canOpen ? "Open source in Loom" : "Captured source; original file is not available")
        .accessibilityLabel(source.label)
        .accessibilityValue(canOpen ? "Open source" : "Captured source")
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
    /// A `loom://anchor` link clicked in the reflection note asks the workbench
    /// to pop the source in an in-app PDF view jumped to its page + rect.
    static let loomReflectionAnchorJump = Notification.Name("loomReflectionAnchorJump")
    /// Hover-to-note: the reader captured a passage; the center note editor
    /// listens and inserts it as a clickable `loom://anchor` quote.
    static let loomReflectionInsertPassage = Notification.Name("loomReflectionInsertPassage")

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
private struct GlassDocumentEditor: NSViewRepresentable {
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
        storage.enumerateAttribute(.attachment, in: full) { value, range, _ in
            guard let attachment = value as? NSTextAttachment else { return }
            let wrapperName = attachment.fileWrapper?.preferredFilename
                ?? attachment.fileWrapper?.filename ?? ""
            if wrapperName.hasSuffix(".loomref") {
                if !(attachment.attachmentCell is PaperFileAttachmentCell) {
                    let payload = attachment.fileWrapper?.regularFileContents
                        .flatMap { String(data: $0, encoding: .utf8) } ?? ""
                    let parts = payload.split(separator: "\n", maxSplits: 1).map(String.init)
                    let sourceID = parts.first ?? ""
                    let source = sources.first { $0.id == sourceID }
                    let label = source?.label ?? (parts.count > 1 ? parts[1] : "Attached file")
                    attachment.attachmentCell = PaperFileAttachmentCell(label: label, sourceID: sourceID, fileURL: source?.fileURL)
                    if !sourceID.isEmpty {
                        storage.addAttribute(.link, value: "loom-source://\(sourceID)", range: range)
                    }
                }
            } else if !(attachment.attachmentCell is PaperImageAttachmentCell) {
                let image = attachment.image
                    ?? attachment.fileWrapper?.regularFileContents.flatMap(NSImage.init(data:))
                if let image {
                    attachment.attachmentCell = PaperImageAttachmentCell(imageCell: image)
                }
            }
        }
        let text = storage.string as NSString
        var location = 0
        while location < text.length {
            let paragraphRange = text.paragraphRange(for: NSRange(location: location, length: 0))
            if paragraphRange.length == 0 { break }
            let line = text.substring(with: paragraphRange)
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
            location = NSMaxRange(paragraphRange)
        }
        storage.endEditing()
        // A fresh line after a heading starts as body ink, not a bigger pen.
        view.typingAttributes = [
            .font: documentFont,
            .foregroundColor: NSColor.labelColor,
            .paragraphStyle: documentParagraphStyle,
        ]
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
        guard let manager = view.layoutManager,
              let container = view.textContainer,
              let scrollView = view.enclosingScrollView,
              let documentView = scrollView.documentView else { return }
        let length = (view.string as NSString).length
        guard length > 0 else { return }
        let safeTarget = min(max(0, target), length - 1)
        let glyphRange = manager.glyphRange(
            forCharacterRange: NSRange(location: safeTarget, length: 1),
            actualCharacterRange: nil
        )
        let rect = manager.boundingRect(forGlyphRange: glyphRange, in: container)
        let pointInDocument = view.convert(NSPoint(x: 0, y: rect.minY), to: documentView)
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

        func textDidChange(_ notification: Notification) {
            guard let view = notification.object as? NSTextView else { return }
            GlassDocumentEditor.normalizeDocument(view, sources: sources)
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
        /// to that passage. Returns true when it is an anchor link.
        @discardableResult
        private func routeAnchorLink(_ raw: String) -> Bool {
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

        /// Attachment-cell clicks route here (not through clickedOnLink): a file
        /// chip opens its source; an appshot card follows its loom://anchor link.
        func textView(
            _ textView: NSTextView,
            clickedOn cell: NSTextAttachmentCellProtocol,
            in cellFrame: NSRect,
            at charIndex: Int
        ) {
            if let chip = cell as? PaperFileAttachmentCell {
                onOpenSource(chip.sourceID)
                return
            }
            if let link = textView.textStorage?.attribute(.link, at: charIndex, effectiveRange: nil) {
                routeAnchorLink((link as? URL)?.absoluteString ?? (link as? String ?? ""))
            }
        }

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
            if let lm = layoutManager, let storage = textStorage, storage.length > 0 {
                lm.removeTemporaryAttribute(.backgroundColor,
                                            forCharacterRange: NSRange(location: 0, length: storage.length))
            }
        }

        override var intrinsicContentSize: NSSize {
            guard let container = textContainer, let manager = layoutManager else {
                return super.intrinsicContentSize
            }
            manager.ensureLayout(for: container)
            let used = manager.usedRect(for: container)
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

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
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
        }

        deinit {
            if let observer = passageObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            if let observer = passageImageObserver {
                NotificationCenter.default.removeObserver(observer)
            }
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

        // A click that lands on a file chip opens its source directly —
        // deterministic hit-testing instead of AppKit's legacy attachment
        // click plumbing.
        override func mouseDown(with event: NSEvent) {
            let point = convert(event.locationInWindow, from: nil)
            if let manager = layoutManager, let container = textContainer, let storage = textStorage {
                let glyphIndex = manager.glyphIndex(for: point, in: container)
                let charIndex = manager.characterIndexForGlyph(at: glyphIndex)
                if charIndex < storage.length,
                   let attachment = storage.attribute(.attachment, at: charIndex, effectiveRange: nil) as? NSTextAttachment,
                   let chip = attachment.attachmentCell as? PaperFileAttachmentCell {
                    let rect = manager.boundingRect(forGlyphRange: NSRange(location: glyphIndex, length: 1), in: container)
                    if rect.contains(point) {
                        (delegate as? GlassDocumentEditor.Coordinator)?.onOpenSource(chip.sourceID)
                        return
                    }
                }
            }
            super.mouseDown(with: event)
        }

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
            let attachment = NSTextAttachment(fileWrapper: wrapper)
            attachment.attachmentCell = PaperImageAttachmentCell(imageCell: image)

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
            let attachment = NSTextAttachment(fileWrapper: wrapper)
            attachment.attachmentCell = PaperFileAttachmentCell(label: label, sourceID: sourceID, fileURL: fileURL)

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
            // Confirm the landing (owner-audit 2026-07-05): flash the quote —
            // teal for an exact-rect anchor, amber for a page-only one — so the
            // owner sees WHERE it landed and how strong it is.
            flashAnchor(range: NSRange(location: quoteStart, length: quoteLine.length), precise: precise)
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
            guard let layoutManager, let storage = textStorage,
                  range.location >= 0, range.location + range.length <= storage.length else { return }
            // Supersede any prior flash: bump the generation (its queued frames
            // early-return) AND clear its tint so an overlapping capture never
            // orphans an earlier highlight at peak.
            cancelInFlightAnchorFlashes()
            let generation = flashGeneration
            let color = precise ? NSColor.systemTeal : NSColor.systemOrange
            let peak: CGFloat = 0.28
            layoutManager.addTemporaryAttributes([.backgroundColor: color.withAlphaComponent(peak)],
                                                 forCharacterRange: range)
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
                if let lm = layoutManager, let r = clampedTintRange(range) {
                    lm.removeTemporaryAttribute(.backgroundColor, forCharacterRange: r)
                }
                return
            }
            let steps = 12
            let interval = duration / Double(steps)
            for step in 1...steps {
                DispatchQueue.main.asyncAfter(deadline: .now() + interval * Double(step)) { [weak self] in
                    guard let self, self.flashGeneration == generation,
                          let lm = self.layoutManager, let r = self.clampedTintRange(range) else { return }
                    if let alpha = AnchorFlashFade.alpha(atStep: step, of: steps, peak: peak) {
                        lm.addTemporaryAttributes([.backgroundColor: color.withAlphaComponent(alpha)],
                                                  forCharacterRange: r)
                    } else {
                        lm.removeTemporaryAttribute(.backgroundColor, forCharacterRange: r)
                    }
                }
            }
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

// An image in the document flow is a piece of paper laid on the glass:
// solid white card, rounded corners, a real shadow — the same material
// honesty as EvidencePaperCard, drawn as a text attachment cell so it
// lives inside the editor's own layout, selection, and undo.
private final class PaperImageAttachmentCell: NSTextAttachmentCell {
    static let padding: CGFloat = 10
    static let cornerRadius: CGFloat = 10
    static let maxCardWidth: CGFloat = 560

    override func cellFrame(
        for textContainer: NSTextContainer,
        proposedLineFragment lineFrag: NSRect,
        glyphPosition position: NSPoint,
        characterIndex charIndex: Int
    ) -> NSRect {
        guard let image, image.size.width > 0 else {
            return super.cellFrame(
                for: textContainer,
                proposedLineFragment: lineFrag,
                glyphPosition: position,
                characterIndex: charIndex
            )
        }
        let available = min(lineFrag.width, Self.maxCardWidth) - Self.padding * 2
        let scale = min(1, available / image.size.width)
        let width = image.size.width * scale + Self.padding * 2
        let height = image.size.height * scale + Self.padding * 2
        return NSRect(x: 0, y: 0, width: width, height: height)
    }

    override func draw(withFrame cellFrame: NSRect, in controlView: NSView?) {
        guard let context = NSGraphicsContext.current else { return }
        context.saveGraphicsState()
        let card = NSBezierPath(
            roundedRect: cellFrame.insetBy(dx: 1, dy: 1),
            xRadius: Self.cornerRadius,
            yRadius: Self.cornerRadius
        )
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.28)
        shadow.shadowBlurRadius = 7
        shadow.shadowOffset = NSSize(width: 0, height: -2)
        shadow.set()
        NSColor.white.setFill()
        card.fill()
        context.restoreGraphicsState()

        if let image {
            let inset = cellFrame.insetBy(dx: Self.padding, dy: Self.padding)
            image.draw(
                in: inset,
                from: .zero,
                operation: .sourceOver,
                fraction: 1,
                respectFlipped: true,
                hints: [.interpolation: NSImageInterpolation.high]
            )
        }
    }
}

// A non-image file in the document flow: the same paper material as the
// image card, compressed to a chip — file icon and name on solid white
// with a real shadow. Clicking follows its loom-source:// link.
private final class PaperFileAttachmentCell: NSTextAttachmentCell {
    static let chipHeight: CGFloat = 30
    static let padding: CGFloat = 9
    static let maxLabelWidth: CGFloat = 240

    let label: String
    let sourceID: String
    let fileIcon: NSImage
    private let labelFont = NSFont.systemFont(ofSize: 12, weight: .medium)

    init(label: String, sourceID: String, fileURL: URL?) {
        self.label = label
        self.sourceID = sourceID
        if let path = fileURL?.path, FileManager.default.fileExists(atPath: path) {
            self.fileIcon = NSWorkspace.shared.icon(forFile: path)
        } else if let ext = label.split(separator: ".").last.map(String.init),
                  let type = UTType(filenameExtension: ext) {
            self.fileIcon = NSWorkspace.shared.icon(for: type)
        } else {
            self.fileIcon = NSWorkspace.shared.icon(for: .data)
        }
        super.init(textCell: "")
    }

    required init(coder: NSCoder) {
        fatalError("PaperFileAttachmentCell does not support NSCoding")
    }

    private var labelSize: NSSize {
        (label as NSString).size(withAttributes: [.font: labelFont])
    }

    override func cellSize() -> NSSize {
        let width = Self.padding + 16 + 6 + min(labelSize.width, Self.maxLabelWidth) + Self.padding
        return NSSize(width: width, height: Self.chipHeight)
    }

    override func cellBaselineOffset() -> NSPoint {
        NSPoint(x: 0, y: -8)
    }

    override func draw(withFrame cellFrame: NSRect, in controlView: NSView?) {
        guard let context = NSGraphicsContext.current else { return }
        context.saveGraphicsState()
        let card = NSBezierPath(
            roundedRect: cellFrame.insetBy(dx: 1, dy: 1),
            xRadius: 8,
            yRadius: 8
        )
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.25)
        shadow.shadowBlurRadius = 5
        shadow.shadowOffset = NSSize(width: 0, height: -1.5)
        shadow.set()
        NSColor.white.setFill()
        card.fill()
        context.restoreGraphicsState()

        let iconRect = NSRect(
            x: cellFrame.minX + Self.padding,
            y: cellFrame.midY - 8,
            width: 16,
            height: 16
        )
        fileIcon.draw(
            in: iconRect,
            from: .zero,
            operation: .sourceOver,
            fraction: 1,
            respectFlipped: true,
            hints: [.interpolation: NSImageInterpolation.high]
        )
        let size = labelSize
        let textRect = NSRect(
            x: iconRect.maxX + 6,
            y: cellFrame.midY - size.height / 2,
            width: min(size.width, Self.maxLabelWidth),
            height: size.height
        )
        (label as NSString).draw(in: textRect, withAttributes: [
            .font: labelFont,
            .foregroundColor: NSColor.black.withAlphaComponent(0.8),
        ])
    }
}

// Captured evidence as a piece of the original's paper: solid white card,
// dark ink, mono anchor — a content object on the glass.
private struct EvidencePaperCard: View {
    let trace: ReflectionLearningTrace
    let action: () -> Void
    @State private var isHovering = false

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Text(trace.displayText)
                    .font(.system(size: 14, design: .serif))
                    .lineSpacing(4)
                    .foregroundStyle(Color.black.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !trace.sourceAnchor.isEmpty {
                    Text(trace.sourceAnchor)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(Color.black.opacity(0.45))
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(isHovering ? 0.22 : 0.12), radius: isHovering ? 14 : 8, y: 3)
            )
            .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .onHover { isHovering = $0 }
        .accessibilityLabel(trace.displayText)
    }
}

private struct ReflectionThreadView: View {
    let reflectionCase: ReflectionCase
    @Binding var selectedLearningTraceID: ReflectionLearningTrace.ID?
    @Binding var draftText: String
    @Binding var commitFocus: ReflectionCommitFocus
    var topPadding: CGFloat = reflectionThreadTopPadding
    let onSelectTrace: (ReflectionLearningTrace) -> Void
    var onPromotePrinciple: ((String) -> Void)? = nil
    let onSubmit: () -> Void

    private var learningTraces: [ReflectionLearningTrace] {
        ReflectionLearningTrace.from(reflectionCase)
    }

    private var selectedLearningTrace: ReflectionLearningTrace? {
        learningTraces.first { $0.id == selectedLearningTraceID }
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if reflectionCase.project == "Learning pass" {
                        ReflectionLearningLedgerView(
                            reflectionCase: reflectionCase,
                            selectedTraceID: selectedLearningTraceID,
                            onSelectTrace: onSelectTrace,
                            onPromotePrinciple: onPromotePrinciple
                        )
                    } else {
                        ReflectionTraceList(steps: reflectionCase.steps)
                        ReflectionMessages(messages: reflectionCase.messages)
                    }
                }
                .frame(maxWidth: reflectionThreadMaxWidth, alignment: .leading)
                .padding(.horizontal, 28)
                .padding(.top, topPadding)
                .padding(.bottom, 22)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            ReflectionComposer(
                text: $draftText,
                commitFocus: $commitFocus,
                placeholder: composerPlaceholder,
                isLearningCase: reflectionCase.project == "Learning pass",
                onSubmit: onSubmit
            )
                .frame(maxWidth: reflectionThreadMaxWidth)
                .padding(.horizontal, 28)
                .padding(.top, 6)
                .padding(.bottom, 12)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private var composerPlaceholder: String {
        if reflectionCase.project == "Learning pass" {
            // The chip names the commit target; the placeholder teaches only
            // what a word cannot (canon: composer = commit affordance).
            switch commitFocus {
            case .meaning: return "Add your meaning..."
            case .question: return "What's unclear? Add “closes when: …” to set the open condition"
            case .correction: return "What did you get wrong — and what is right now?"
            case .principle: return "What holds beyond this file?"
            }
        }
        return "Add material..."
    }
}

private struct ReflectionLearningLedgerView: View {
    let reflectionCase: ReflectionCase
    let selectedTraceID: ReflectionLearningTrace.ID?
    let onSelectTrace: (ReflectionLearningTrace) -> Void
    var onPromotePrinciple: ((String) -> Void)? = nil
    @State private var showsTraceHistory = false

    private var traces: [ReflectionLearningTrace] {
        ReflectionLearningTrace.from(reflectionCase)
    }

    private var sourceLabel: String {
        reflectionCase.sources.first?.label ?? reflectionCase.title
    }

    private var activeTraceID: ReflectionLearningTrace.ID? {
        selectedTraceID ?? traces.last?.id
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if traces.isEmpty {
                ReflectionLearningEmptyLedger(sourceLabel: sourceLabel)
            } else {
                ReflectionLearningDigest(
                    reflectionCase: reflectionCase,
                    traces: traces,
                    activeTraceID: activeTraceID,
                    sourceFileURL: reflectionCase.sources.first?.fileURL,
                    onSelectTrace: onSelectTrace
                )

                DisclosureGroup(isExpanded: $showsTraceHistory) {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(traces) { trace in
                            ReflectionLearningTraceCard(
                                trace: trace,
                                isSelected: trace.id == activeTraceID,
                                onSelect: {
                                    onSelectTrace(trace)
                                }
                            )
                        }
                    }
                    .padding(.top, 10)
                } label: {
                    HStack(spacing: 8) {
                        Text("Capture trail")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(LoomTokens.dsInk2)
                        Text("\(traces.count) version\(traces.count == 1 ? "" : "s")")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .foregroundStyle(LoomTokens.dsInk3)
                    }
                }
                .tint(LoomTokens.dsInk3)
            }

            if let summary = ReflectionLearningReviewSummary.make(for: reflectionCase),
               let principle = summary.principle {
                ReflectionLearningPrincipleCandidate(
                    principle: principle,
                    onPromote: onPromotePrinciple.map { promote in { promote(principle) } }
                )
            }
        }
    }
}

private struct ReflectionLearningDigest: View {
    let reflectionCase: ReflectionCase
    let traces: [ReflectionLearningTrace]
    let activeTraceID: ReflectionLearningTrace.ID?
    let sourceFileURL: URL?
    let onSelectTrace: (ReflectionLearningTrace) -> Void

    private var sourceLabel: String {
        reflectionCase.sources.first?.label ?? reflectionCase.title
    }

    // The center is a learning DOCUMENT, not a capture inbox (owner north
    // star: the final presentation is still the book — a professional
    // document genre with clear structure and readable typesetting). The
    // title is the PROJECT (the user's initiation); legacy file-named cases
    // just lose their extension.
    private var documentTitle: String {
        let label = reflectionCase.title
        guard let dot = label.lastIndex(of: "."), dot != label.startIndex else { return label }
        let suffix = label[label.index(after: dot)...]
        guard suffix.count <= 4, suffix.allSatisfy({ $0.isLetter || $0.isNumber }) else { return label }
        return String(label[..<dot])
    }

    // Book order: entries follow the source's own structure (page ascending),
    // not capture time. Unanchored entries keep their capture order at the end.
    private var orderedTraces: [ReflectionLearningTrace] {
        traces.enumerated().sorted { lhs, rhs in
            let lhsPage = lhs.element.pageNumber ?? Int.max
            let rhsPage = rhs.element.pageNumber ?? Int.max
            if lhsPage != rhsPage { return lhsPage < rhsPage }
            return lhs.offset < rhs.offset
        }.map(\.element)
    }

    private var shouldShowStageSummary: Bool {
        traces.count > 1 || traces.contains { $0.isUserCommitted }
    }

    // Stage 2 (THE BOOK): a correction supersedes the latest earlier
    // user-committed entry sharing its source anchor — the pair renders as
    // ONE revision unit (struck first meaning above the corrected text),
    // never as two competing entries. Understanding diff, not chat history.
    private var revisions: (hidden: Set<ReflectionLearningTrace.ID>, superseded: [ReflectionLearningTrace.ID: ReflectionLearningTrace]) {
        var superseded: [ReflectionLearningTrace.ID: ReflectionLearningTrace] = [:]
        var hidden: Set<ReflectionLearningTrace.ID> = []
        for (index, trace) in traces.enumerated() where trace.focus == "correction" {
            if let prior = traces[..<index].last(where: {
                $0.isUserCommitted && $0.focus != "correction" && $0.sourceAnchor == trace.sourceAnchor && !hidden.contains($0.id)
            }) {
                superseded[trace.id] = prior
                hidden.insert(prior.id)
            }
        }
        return (hidden, superseded)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 7) {
                Text(documentTitle)
                    .font(.system(size: 23, weight: .semibold, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 10) {
                    Text("Learning record")
                        .font(.system(size: 9.5, weight: .semibold, design: .monospaced))
                        .tracking(1.2)
                        .textCase(.uppercase)
                        .foregroundStyle(LoomTokens.dsInk3)
                    Spacer(minLength: 0)
                    if shouldShowStageSummary {
                        HStack(spacing: 6) {
                            ReflectionLearningStagePill(title: "Collect", count: traces.filter { $0.isLanguageSelection || $0.isDataOrDocumentSelection }.count)
                            ReflectionLearningStagePill(title: "Explain", count: traces.filter { $0.isUserCommitted }.count)
                            ReflectionLearningStagePill(title: "Review", count: traces.filter { $0.focus == "question" || $0.focus == "correction" }.count)
                            ReflectionLearningStagePill(title: "Reuse", count: traces.filter { $0.focus == "principle" }.count)
                        }
                    }
                }
            }

            ReflectionLearningProvenanceBox(reflectionCase: reflectionCase, traces: traces)

            if let summary = ReflectionLearningReviewSummary.make(for: reflectionCase) {
                ReflectionLearningReview(summary: summary)
            }

            VStack(alignment: .leading, spacing: 0) {
                let revisionState = revisions
                ForEach(orderedTraces.filter { !revisionState.hidden.contains($0.id) }) { trace in
                    ReflectionLearningDocumentEntry(
                        trace: trace,
                        superseded: revisionState.superseded[trace.id],
                        isActive: trace.id == activeTraceID,
                        sourceFileURL: sourceFileURL,
                        onSelect: { onSelectTrace(trace) }
                    )
                }
            }
        }
        .padding(.vertical, 2)
    }
}

// Stage 2 (THE BOOK): the reader's chain of custody — one quiet head-matter
// line (RESEARCH_REPORT anatomy: provenance box + scope-first declaration).
// It states what was read and how well it is anchored; it never becomes a
// form or a dashboard.
private struct ReflectionLearningProvenanceBox: View {
    let reflectionCase: ReflectionCase
    let traces: [ReflectionLearningTrace]

    private var provenanceLine: String {
        let sourceCount = max(reflectionCase.sources.count, 1)
        let pageAnchored = traces.filter { $0.pageNumber != nil }.count
        let reviewEntries = traces.filter { ["question", "correction", "principle"].contains($0.focus) }.count
        var parts = [
            "\(sourceCount) source\(sourceCount == 1 ? "" : "s")",
            "\(traces.count) anchored trace\(traces.count == 1 ? "" : "s")",
        ]
        parts.append(pageAnchored > 0 ? "\(pageAnchored) page-anchored" : "page anchors pending")
        if reviewEntries > 0 {
            parts.append("\(reviewEntries) review entr\(reviewEntries == 1 ? "y" : "ies")")
        }
        parts.append("updated \(reflectionCase.updatedAt)")
        return parts.joined(separator: " · ")
    }

    private var scopeLine: String? {
        let pages = traces.compactMap(\.pageNumber)
        guard let low = pages.min(), let high = pages.max() else { return nil }
        let label = reflectionCase.sources.first?.label ?? reflectionCase.title
        let span = low == high ? "p.\(low)" : "p.\(low)–p.\(high)"
        return "Covers \(span) of \(label). Claims stay within the captured material."
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(provenanceLine)
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundStyle(LoomTokens.dsInk3)
            if let scopeLine {
                Text(scopeLine)
                    .font(.system(size: 11.5, design: .serif).italic())
                    .foregroundStyle(LoomTokens.dsInk3)
            }
        }
        .padding(.bottom, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair.opacity(0.8)).frame(height: 1)
        }
    }
}

private struct ReflectionLearningStagePill: View {
    let title: String
    let count: Int

    var body: some View {
        HStack(spacing: 5) {
            Text(title)
            Text("\(count)")
                .foregroundStyle(count > 0 ? LoomTokens.dsSuccess : LoomTokens.dsInk3)
        }
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(LoomTokens.dsInk2)
        .padding(.horizontal, 9)
        .frame(height: 26)
        .background(LoomTokens.dsPaperUp.opacity(0.74), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(LoomTokens.dsHair, lineWidth: 1)
        )
    }
}

private struct ReflectionLearningDocumentEntry: View {
    let trace: ReflectionLearningTrace
    var superseded: ReflectionLearningTrace? = nil
    let isActive: Bool
    let sourceFileURL: URL?
    let onSelect: () -> Void

    private var needsMeaning: Bool {
        trace.isLanguageSelection || trace.isDataOrDocumentSelection
    }

    private var entryTextFont: Font {
        trace.isShortLanguageTrace
            ? .system(size: 17, weight: .semibold, design: .serif)
            : .system(size: 14.5, design: .serif)
    }

    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .leading, spacing: 7) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(trace.displayLabel)
                        .font(.system(size: 9.5, weight: .semibold, design: .monospaced))
                        .tracking(1.1)
                        .textCase(.uppercase)
                        .foregroundStyle(LoomTokens.dsInk3)
                    if needsMeaning || trace.focus == "question" || trace.isWeakAnchor {
                        Circle()
                            .fill(trace.signalColor)
                            .frame(width: 6, height: 6)
                            .accessibilityLabel(trace.signalLabel)
                    }
                    Spacer(minLength: 0)
                    if let pageAnchor = trace.pageAnchorLabel {
                        if let sourceFileURL, let page = trace.pageNumber {
                            // The anchor jumps BACK into the original file at
                            // the captured page (anchor helper drives the
                            // native app's Go to Page; degrades to file-open).
                            Button {
                                LoomAnchorHelperClient.revealAnchor(documentURL: sourceFileURL, page: page)
                            } label: {
                                Text(pageAnchor)
                                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                                    .foregroundStyle(LoomTokens.dsInk3)
                                    .underline(false)
                            }
                            .buttonStyle(.plain)
                            .help("Open the original at page \(page)")
                        } else {
                            Text(pageAnchor)
                                .font(.system(size: 10, weight: .medium, design: .monospaced))
                                .foregroundStyle(LoomTokens.dsInk3)
                        }
                    }
                }

                if let superseded {
                    // The revision unit: the first understanding stays
                    // visible but struck — the diff IS the learning.
                    Text(superseded.displayText)
                        .font(.system(size: 13, design: .serif))
                        .strikethrough(true, color: LoomTokens.dsInk3.opacity(0.55))
                        .foregroundStyle(LoomTokens.dsInk3)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Text(trace.displayText)
                    .font(entryTextFont)
                    .lineSpacing(5)
                    .foregroundStyle(LoomTokens.dsInk1)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if needsMeaning || trace.focus == "question" {
                    // Recall texture, and for questions the OPEN CONDITION
                    // slot (owner's example: "needs confirmation ·
                    // Exercise 1.1") — a question stays open until the user
                    // commits what would close it.
                    VStack(alignment: .leading, spacing: 11) {
                        Text(trace.focus == "question"
                            ? (trace.openCondition.map { "Open — closes when: \($0)" }
                                ?? "Open — what would close this question?")
                            : "Explain it in your own words")
                            .font(.system(size: 11.5, design: .serif).italic())
                            .foregroundStyle(LoomTokens.dsInk3)
                        Rectangle()
                            .fill(LoomTokens.dsHair)
                            .frame(height: 1)
                            .padding(.trailing, 48)
                    }
                    .padding(.top, 3)
                }
            }
            .padding(.vertical, 13)
            .padding(.horizontal, isActive ? 10 : 0)
            .background(
                isActive ? LoomTokens.dsPaperUp.opacity(0.36) : Color.clear,
                in: RoundedRectangle(cornerRadius: 8, style: .continuous)
            )
            .overlay(alignment: .bottom) {
                Rectangle().fill(LoomTokens.dsHair.opacity(0.8)).frame(height: 1)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct ReflectionLearningEmptyLedger: View {
    let sourceLabel: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("No understanding versions yet.")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(LoomTokens.dsInk1)
            Text("Use \(sourceLabel) in its native app first. Capture only a selected word, phrase, question, correction, or principle that changes your understanding.")
                .font(.system(size: 12))
                .lineSpacing(3)
                .foregroundStyle(LoomTokens.dsInk2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 2)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }
}

private struct ReflectionLearningTraceCard: View {
    let trace: ReflectionLearningTrace
    let isSelected: Bool
    let onSelect: () -> Void
    @State private var showsProvenance = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(trace.version)
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(LoomTokens.dsInk3)
                    .frame(width: 34, alignment: .leading)

                Text(trace.versionTitle)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .lineLimit(1)

                ReflectionLearningSignal(label: trace.signalLabel, color: trace.signalColor)

                Spacer(minLength: 0)

                Text(trace.pass)
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundStyle(LoomTokens.dsInk3)
                    .lineLimit(1)

            }

            VStack(alignment: .leading, spacing: 4) {
                Text(trace.displayLabel)
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(0.8)
                    .foregroundStyle(LoomTokens.dsInk3)

                Text(trace.displayText)
                    .font(.system(size: trace.isShortLanguageTrace ? 18 : 14, weight: trace.isShortLanguageTrace ? .semibold : .regular))
                    .lineSpacing(4)
                    .foregroundStyle(LoomTokens.dsInk1)
                    .fixedSize(horizontal: false, vertical: true)
            }

            DisclosureGroup(isExpanded: $showsProvenance) {
                VStack(alignment: .leading, spacing: 5) {
                    ReflectionLearningProvenanceLine(label: "source", value: trace.sourceAnchor)
                    ReflectionLearningProvenanceLine(label: "type", value: trace.traceType)
                    ForEach(trace.evidence) { evidence in
                        ReflectionLearningProvenanceLine(label: evidence.label, value: evidence.value)
                    }
                    ReflectionLearningProvenanceLine(label: "raw", value: trace.raw)
                }
                .padding(.top, 6)
            } label: {
                Text("Audit trail")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(LoomTokens.dsInk3)
            }
            .tint(LoomTokens.dsInk3)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 10)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(isSelected ? LoomTokens.dsPaperCard.opacity(0.54) : Color.clear)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(isSelected ? LoomTokens.dsHair : Color.clear, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .onTapGesture(perform: onSelect)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }
}

private struct ReflectionLearningSignal: View {
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(color)
                .frame(width: 5, height: 5)
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(LoomTokens.dsInk3)
        }
    }
}

private struct ReflectionLearningProvenanceLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundStyle(LoomTokens.dsInk3)
                .frame(width: 44, alignment: .leading)
            Text(value)
                .font(.system(size: 11))
                .foregroundStyle(LoomTokens.dsInk2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}


private struct ReflectionLearningPrincipleCandidate: View {
    let principle: String
    var onPromote: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text("Principle")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.1)
                .foregroundStyle(LoomTokens.dsInk3)
                .frame(width: 72, alignment: .leading)

            Text(principle)
                .font(.system(size: 13, weight: .semibold))
                .lineSpacing(3)
                .foregroundStyle(LoomTokens.dsThread)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)

            if let onPromote {
                // Stage 4 (融会贯通): promotion is the user SIGNING the
                // conclusion — one quiet word, gated by anchor honesty.
                Button("Promote", action: onPromote)
                    .buttonStyle(.plain)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsThread)
                    .help("Promote into workspace memory (blocked while the anchor is weak)")
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 2)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }
}


private struct ReflectionLearningReviewSummary: Equatable {
    let sourceLabel: String
    let status: String
    let traceSummary: String
    let focusSummary: String
    let confirmations: [String]
    let principle: String?
    let hasCommittedMeanings: Bool

    static func make(for reflectionCase: ReflectionCase) -> ReflectionLearningReviewSummary? {
        guard reflectionCase.project == "Learning pass" else { return nil }

        // Stage 2 (THE BOOK): synthesis is Loom's marginal voice, computed on
        // read — merged with any legacy persisted items but never written back.
        let synthesis = ReflectionLearningSynthesis.make(for: reflectionCase)
        let outcomeItems = mergedUnique(stepItems(in: reflectionCase, id: "outcome"), synthesis.outcomes)
        let reflectionItems = mergedUnique(stepItems(in: reflectionCase, id: "reflection"), synthesis.reflections)
        let principleItems = mergedUnique(stepItems(in: reflectionCase, id: "memory"), synthesis.memories)
        let inputItems = stepItems(in: reflectionCase, id: "input")
        let outcome = outcomeItems.last { $0.contains("anchored learning trace") }
        let confirmations = Array(reflectionItems.filter { $0.contains(" to confirm:") }.prefix(4))
        let principle = principleItems.first { $0.contains("Principle candidate") } ?? principleItems.first

        guard reflectionCase.status == "Second pass ready"
            || !confirmations.isEmpty
            || principle != nil
        else { return nil }

        return ReflectionLearningReviewSummary(
            sourceLabel: reflectionCase.sources.first?.label ?? reflectionCase.title,
            status: reflectionCase.status,
            traceSummary: traceSummary(from: outcome, inputItems: inputItems),
            focusSummary: focusSummary(from: outcome),
            confirmations: confirmations,
            principle: principle,
            hasCommittedMeanings: inputItems.contains { $0.contains("[user meaning]") }
        )
    }

    private static func stepItems(in reflectionCase: ReflectionCase, id: String) -> [String] {
        reflectionCase.steps.first { $0.id == id }?.items ?? []
    }

    private static func mergedUnique(_ persisted: [String], _ computed: [String]) -> [String] {
        var seen = Set<String>()
        return (persisted + computed).filter { seen.insert($0).inserted }
    }

    private static func traceSummary(from outcome: String?, inputItems: [String]) -> String {
        if let outcome,
           let capturedRange = outcome.range(of: "Captured "),
           let fromRange = outcome.range(of: " from ", range: capturedRange.upperBound..<outcome.endIndex) {
            return String(outcome[capturedRange.upperBound..<fromRange.lowerBound])
        }

        let capturedCount = inputItems.filter { $0.hasPrefix("Captured ") }.count
        if capturedCount > 0 {
            return "\(capturedCount) captured trace\(capturedCount == 1 ? "" : "s")"
        }
        return "No focused captures yet"
    }

    private static func focusSummary(from outcome: String?) -> String {
        guard let outcome,
              let range = outcome.range(of: ": ") else {
            return "Waiting for anchored traces"
        }
        return String(outcome[range.upperBound...])
    }
}

private struct ReflectionLearningReview: View {
    let summary: ReflectionLearningReviewSummary

    private var cleanedConfirmations: [String] {
        summary.confirmations.map(Self.cleanReviewText)
    }

    private var cleanedPrinciple: String? {
        summary.principle.map(Self.cleanReviewText)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Label("Ready to review", systemImage: "checkmark.circle")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsSuccess)
                Spacer(minLength: 0)
            }

            VStack(alignment: .leading, spacing: 8) {
                if cleanedConfirmations.isEmpty {
                    // The guidance ladder advances with the reader: collect →
                    // explain → second pass. Once meanings are committed, the
                    // honest next step is the second pass, not more explaining.
                    ReflectionLearningReviewLine(
                        label: "Next",
                        value: summary.hasCommittedMeanings
                            ? "Second pass: re-read the source and confirm or correct each meaning. Open questions close here."
                            : "Write your own meaning for the captured source before turning it into memory."
                    )
                } else {
                    ReflectionLearningReviewList(label: "Check", values: cleanedConfirmations)
                }
                if let principle = cleanedPrinciple {
                    ReflectionLearningReviewLine(label: "Principle", value: principle, accent: true)
                }
            }
        }
        .padding(.horizontal, 2)
        .padding(.bottom, 16)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }

    private static func cleanReviewText(_ value: String) -> String {
        var cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let prefixes = [
            "Sentence meaning to confirm:",
            "Phrase meaning to confirm:",
            "Word meaning to confirm:",
            "Data meaning to confirm:",
            "Principle candidate:",
            "Reusable principle:"
        ]

        for prefix in prefixes where cleaned.localizedCaseInsensitiveContains(prefix) {
            cleaned = cleaned.replacingOccurrences(of: prefix, with: "", options: [.caseInsensitive])
        }

        return cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

private struct ReflectionLearningReviewLine: View {
    let label: String
    let value: String
    var accent: Bool = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.1)
                .foregroundStyle(LoomTokens.dsInk3)
                .frame(width: 104, alignment: .leading)

            Text(value)
                .font(.system(size: 13, weight: accent ? .semibold : .regular))
                .lineSpacing(3)
                .foregroundStyle(accent ? LoomTokens.dsThread : LoomTokens.dsInk1)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct ReflectionLearningReviewList: View {
    let label: String
    let values: [String]

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.1)
                .foregroundStyle(LoomTokens.dsInk3)
                .frame(width: 104, alignment: .leading)

            VStack(alignment: .leading, spacing: 5) {
                ForEach(values, id: \.self) { value in
                    Text(value)
                        .font(.system(size: 13))
                        .lineSpacing(3)
                        .foregroundStyle(LoomTokens.dsInk1)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// Colab-form register (owner directive 2026-07-03): collapsible sections
// with a chevron, entries as bordered cells with a left gutter, empty steps
// as ghost cells. Typography and spacing follow the Colab notebook document;
// color follows Loom ink (青芒 replaces Colab blue for focus/hover).
private struct ReflectionTraceList: View {
    let steps: [ReflectionStep]
    @State private var collapsedSteps: Set<String> = []
    @State private var hoveredCell: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                sectionView(index: index, step: step)
                    .id(step.id)
            }
        }
    }

    private func sectionView(index: Int, step: ReflectionStep) -> some View {
        let isCollapsed = collapsedSteps.contains(step.id)
        return VStack(alignment: .leading, spacing: 10) {
            Button {
                if isCollapsed {
                    collapsedSteps.remove(step.id)
                } else {
                    collapsedSteps.insert(step.id)
                }
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(LoomTokens.dsInk3)
                        .rotationEffect(.degrees(isCollapsed ? -90 : 0))
                        .frame(width: 12)
                    Text(String(format: "%02d", index + 1))
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(LoomTokens.dsInk3)
                    Text(step.title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(LoomTokens.dsInk1)
                    Text(step.subtitle)
                        .font(.system(size: 11.5))
                        .foregroundStyle(LoomTokens.dsInk3)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .help(isCollapsed ? "Expand section" : "Collapse section")

            if !isCollapsed {
                if step.items.isEmpty {
                    ghostCell
                        .padding(.leading, 22)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(Array(step.items.enumerated()), id: \.offset) { itemIndex, item in
                            entryCell(item, key: "\(step.id)-\(itemIndex)")
                        }
                    }
                    .padding(.leading, 22)
                }
            }
        }
        .padding(.vertical, 10)
    }

    // A committed entry as a Colab cell: left gutter marker + bordered
    // rounded card; the border wakes on hover (青芒, never Colab blue).
    private func entryCell(_ item: String, key: String) -> some View {
        let isHovered = hoveredCell == key
        return HStack(alignment: .top, spacing: 10) {
            Image(systemName: "circle")
                .font(.system(size: 11, weight: .regular))
                .foregroundStyle(isHovered ? LoomTokens.dsThread : LoomTokens.dsInk3.opacity(0.7))
                .padding(.top, 12)
            Text(item)
                .font(.system(size: 12.5))
                .lineSpacing(3)
                .foregroundStyle(LoomTokens.dsInk2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(LoomTokens.dsPaperUp.opacity(0.45))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(
                            isHovered ? LoomTokens.dsThread.opacity(0.55) : LoomTokens.dsHair,
                            lineWidth: 1
                        )
                )
        }
        .onHover { hovering in
            hoveredCell = hovering ? key : (hoveredCell == key ? nil : hoveredCell)
        }
    }

    // An empty step as a quiet ghost cell — the Colab empty-placeholder
    // grammar, telling the truth ("No entry yet.") instead of a prompt.
    private var ghostCell: some View {
        Text("No entry yet.")
            .font(.system(size: 12))
            .foregroundStyle(LoomTokens.dsInk3)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(LoomTokens.dsHairFaint, style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
            )
    }
}

private struct ReflectionMessages: View {
    let messages: [ReflectionMessage]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(messages) { message in
                HStack(alignment: .top, spacing: 14) {
                    Text(message.eyebrow)
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .tracking(1.1)
                        .foregroundStyle(LoomTokens.dsInk3)
                        .frame(width: 92, alignment: .leading)

                    Text(message.body)
                        .font(.system(size: 13))
                        .lineSpacing(3)
                        .foregroundStyle(message.role == .loom ? LoomTokens.dsThread : LoomTokens.dsInk1)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.vertical, 12)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(LoomTokens.dsHair.opacity(0.72)).frame(height: 1)
                }
            }
        }
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
                    title: "Files",
                    shortcut: "⌘P",
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

private struct ReflectionSourceInspector: View {
    let reflectionCase: ReflectionCase
    let sources: [ReflectionSource]
    let selectedSourceID: ReflectionSource.ID?
    let selectedSource: ReflectionSource?
    let selectedTrace: ReflectionLearningTrace?
    let onImport: () -> Void
    let onOpenSource: () -> Void
    let onSelect: (ReflectionSource) -> Void
    @State private var query: String = ""
    @State private var showsSourceList = false

    private var groupedSources: [(String, [ReflectionSource])] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let filtered = needle.isEmpty ? sources : sources.filter {
            [$0.label, $0.folder, $0.kind, $0.excerpt].contains { value in
                value.lowercased().contains(needle)
            }
        }
        let groups = Dictionary(grouping: filtered, by: \.folder)
        return groups.keys.sorted().map { ($0, groups[$0] ?? []) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Spacer(minLength: 0)
                    ReflectionImportButton(action: onImport)
                }

                ReflectionEvidenceInspector(
                    trace: selectedTrace,
                    source: selectedSource,
                    onOpenSource: selectedSource?.fileURL == nil ? nil : onOpenSource
                )

                if sources.count > 1 {
                    DisclosureGroup(isExpanded: $showsSourceList) {
                        VStack(alignment: .leading, spacing: 10) {
                            ReflectionSearchField(text: $query, placeholder: "Filter sources")
                            sourceList
                        }
                        .padding(.top, 8)
                    } label: {
                        Label("\(sources.count) sources", systemImage: "folder")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(LoomTokens.dsInk2)
                    }
                    .tint(LoomTokens.dsInk3)
                }
            }
            .padding(.top, reflectionInspectorTopPadding)
            .padding(.horizontal, 14)
            .padding(.bottom, 12)

            Spacer(minLength: 0)
        }
        .background(ReflectionFrostedInspectorBackground().ignoresSafeArea())
    }

    @ViewBuilder
    private var sourceList: some View {
        if groupedSources.isEmpty {
            VStack(spacing: 8) {
                Image(systemName: "tray")
                    .font(.system(size: 22))
                Text("No matching sources")
                    .font(.system(size: 12))
            }
            .foregroundStyle(LoomTokens.dsInk3)
            .frame(maxWidth: .infinity, minHeight: 96)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(groupedSources, id: \.0) { folder, folderSources in
                        VStack(alignment: .leading, spacing: 5) {
                            Label(folder, systemImage: "folder")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(LoomTokens.dsInk2)
                                .padding(.horizontal, 4)
                            ForEach(folderSources) { source in
                                Button {
                                    onSelect(source)
                                } label: {
                                    HStack(spacing: 8) {
                                        ReflectionFileTypeBadge(kind: source.kind, fallbackColor: source.iconColor)
                                        Text(source.label)
                                            .font(.system(size: 13))
                                            .foregroundStyle(LoomTokens.dsInk1)
                                            .lineLimit(1)
                                        Spacer(minLength: 0)
                                        Text(source.meta)
                                            .font(.system(size: 10))
                                            .foregroundStyle(LoomTokens.dsInk3)
                                            .lineLimit(1)
                                    }
                                    .padding(.horizontal, 8)
                                    .frame(height: 30)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .fill(source.id == selectedSourceID ? LoomTokens.dsPaperCard.opacity(0.72) : Color.clear)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .stroke(source.id == selectedSourceID ? LoomTokens.dsHair : Color.clear, lineWidth: 1)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(.bottom, 18)
            }
            .frame(maxHeight: 260)
            .scrollIndicators(.automatic)
        }
    }
}

private struct ReflectionEvidenceInspector: View {
    let trace: ReflectionLearningTrace?
    let source: ReflectionSource?
    let onOpenSource: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let trace {
                ReflectionEvidenceSourceLine(
                    kind: source?.kind ?? trace.traceType,
                    iconColor: source?.iconColor ?? LoomTokens.dsInk3,
                    title: source?.label ?? trace.sourceAnchor,
                    state: trace.signalLabel,
                    onOpenSource: onOpenSource
                )
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 5) {
                        ReflectionLearningProvenanceLine(label: "anchor", value: trace.sourceAnchor)
                        ReflectionLearningProvenanceLine(label: "pass", value: trace.pass)
                        ReflectionLearningProvenanceLine(label: "focus", value: trace.focus)
                        ReflectionLearningProvenanceLine(label: "type", value: trace.traceType)
                        ForEach(trace.evidence) { evidence in
                            ReflectionLearningProvenanceLine(label: evidence.label, value: evidence.value)
                        }
                    }
                    .padding(.top, 6)
                } label: {
                    Text("Details")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(LoomTokens.dsInk3)
                }
                .tint(LoomTokens.dsInk3)
            } else if let source {
                ReflectionEvidenceSourceLine(
                    kind: source.kind,
                    iconColor: source.iconColor,
                    title: source.label,
                    state: source.meta,
                    onOpenSource: onOpenSource
                )
            } else {
                Text("Select or capture a source-backed version.")
                    .font(.system(size: 12))
                    .foregroundStyle(LoomTokens.dsInk3)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LoomTokens.dsPaperUp.opacity(0.78), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(LoomTokens.dsHair, lineWidth: 1)
        )
    }
}

private struct ReflectionEvidenceSourceLine: View {
    let kind: String
    let iconColor: Color
    let title: String
    let state: String
    let onOpenSource: (() -> Void)?

    var body: some View {
        HStack(spacing: 8) {
            ReflectionFileTypeBadge(kind: kind, fallbackColor: iconColor)
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(LoomTokens.dsInk1)
                .lineLimit(1)
            Spacer(minLength: 0)
            Text(state)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(LoomTokens.dsInk3)
                .lineLimit(1)
            if let onOpenSource {
                Button(action: onOpenSource) {
                    Label("Open Source", systemImage: "arrow.up.forward.app")
                        .labelStyle(.iconOnly)
                        .font(.system(size: 11, weight: .semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.plain)
                .foregroundStyle(LoomTokens.dsInk3)
                .background(LoomTokens.dsPaperCard.opacity(0.54), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                .help("Open the original file in its native app")
            }
        }
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

private struct ReflectionImportButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "square.and.arrow.down")
                .font(.system(size: 12, weight: .semibold))
                .frame(width: 32, height: 32)
        }
        .buttonStyle(.plain)
        .foregroundStyle(LoomTokens.dsInk1)
        .background(LoomTokens.dsPaperUp.opacity(0.78), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(LoomTokens.dsHair, lineWidth: 1)
        )
        .help("Import local files")
    }
}

private struct ReflectionSourcePreview: View {
    let source: ReflectionSource?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let source {
                HStack(alignment: .top, spacing: 9) {
                    ReflectionFileTypeBadge(kind: source.kind, fallbackColor: source.iconColor)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(source.label)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(LoomTokens.dsInk1)
                        Text(source.kind)
                            .font(.system(size: 11))
                            .foregroundStyle(LoomTokens.dsInk3)
                    }
                }
                Text(source.excerpt)
                    .font(.system(size: 12))
                    .lineSpacing(3)
                    .foregroundStyle(LoomTokens.dsInk2)
                    .fixedSize(horizontal: false, vertical: true)
                Label("Linked to \(source.folder)", systemImage: "point.3.connected.trianglepath.dotted")
                    .font(.system(size: 11))
                    .foregroundStyle(LoomTokens.dsInk3)
            } else {
                VStack(spacing: 8) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 24))
                    Text("Open source")
                        .font(.system(size: 13, weight: .semibold))
                    Text("Select evidence from the source tree.")
                        .font(.system(size: 12))
                        .foregroundStyle(LoomTokens.dsInk3)
                }
                .frame(maxWidth: .infinity, minHeight: 138)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LoomTokens.dsPaperUp.opacity(0.86), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(LoomTokens.dsHair, lineWidth: 1)
        )
    }
}

private struct ReflectionSearchField: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        searchContent
            .frame(maxWidth: .infinity)
            .background(LoomTokens.dsPaperUp.opacity(0.78), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(LoomTokens.dsHair, lineWidth: 1)
            )
    }

    private var searchContent: some View {
        HStack(spacing: 7) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 12))
                .foregroundStyle(LoomTokens.dsInk3)
            TextField(placeholder, text: $text)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .foregroundStyle(LoomTokens.dsInk1)
        }
        .padding(.horizontal, 10)
        .frame(height: 32)
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

private struct ReflectionLearningSynthesis {
    var assumptions: [String]
    var decisions: [String]
    var outcomes: [String]
    var reflections: [String]
    var memories: [String]

    var isEmpty: Bool {
        assumptions.isEmpty
            && decisions.isEmpty
            && outcomes.isEmpty
            && reflections.isEmpty
            && memories.isEmpty
    }

    static func make(for reflectionCase: ReflectionCase) -> ReflectionLearningSynthesis {
        let traces = LearningTrace.from(reflectionCase)
        guard !traces.isEmpty else {
            return ReflectionLearningSynthesis(
                assumptions: [],
                decisions: [],
                outcomes: [],
                reflections: [],
                memories: []
            )
        }

        let sourceLabel = reflectionCase.sources.first?.label ?? reflectionCase.title
        let focusSummary = focusCounts(from: traces)
        let samples = sampleLines(from: traces)
        let confirmedPrinciple = traces.last { $0.focus == "principle" }

        var reflections = samples
        reflections.append("Second-pass synthesis: compare versions, correct meanings, then separate language understanding from domain knowledge.")

        return ReflectionLearningSynthesis(
            assumptions: [
                "First-pass learning is not final understanding; raw captures need review before they become reusable thinking."
            ],
            decisions: [
                "Kept the original file surface primary and used Loom only to commit anchored traces from \(sourceLabel)."
            ],
            outcomes: [
                "Captured \(traces.count) anchored learning trace\(traces.count == 1 ? "" : "s") from \(sourceLabel): \(focusSummary)."
            ],
            reflections: reflections,
            memories: confirmedPrinciple.map { ["Principle candidate: \($0.text)"] } ?? []
        )
    }

    private static func focusCounts(from traces: [LearningTrace]) -> String {
        let grouped = Dictionary(grouping: traces, by: \.focus)
        return grouped.keys.sorted().map { focus in
            let count = grouped[focus]?.count ?? 0
            return "\(count) \(focus)"
        }
        .joined(separator: ", ")
    }

    private static func sampleLines(from traces: [LearningTrace]) -> [String] {
        traces.prefix(4).map { trace in
            reviewLine(for: trace)
        }
    }

    private static func reviewLine(for trace: LearningTrace) -> String {
        switch trace.focus {
        case "user meaning":
            return "User-confirmed meaning: \(confirmedText(from: trace.text))"
        case "question":
            return "Question to resolve: \(trace.text)"
        case "correction":
            return "Correction applied: \(trace.text)"
        default:
            return "\(confirmationLabel(for: trace.focus)) to review: \(trace.text)"
        }
    }

    private static func confirmationLabel(for focus: String) -> String {
        guard let first = focus.first else { return focus }
        return first.uppercased() + focus.dropFirst()
    }

    private static func confirmedText(from text: String) -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        for prefix in ["Meaning confirmed:", "Meaning confirmed", "Confirmed:", "Confirmed"] {
            if trimmed.range(of: prefix, options: [.anchored, .caseInsensitive]) != nil {
                let index = trimmed.index(trimmed.startIndex, offsetBy: prefix.count)
                return String(trimmed[index...]).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        return trimmed
    }

    private struct LearningTrace {
        let focus: String
        let text: String

        static func from(_ reflectionCase: ReflectionCase) -> [LearningTrace] {
            let inputItems = reflectionCase.steps.first { $0.id == "input" }?.items ?? []
            return inputItems.compactMap(parse)
        }

        private static func parse(_ item: String) -> LearningTrace? {
            guard item.hasPrefix("Captured "),
                  let focusStart = item.firstIndex(of: "["),
                  let focusEnd = item[focusStart...].firstIndex(of: "]") else {
                return nil
            }

            let focus = String(item[item.index(after: focusStart)..<focusEnd])
                .trimmingCharacters(in: .whitespacesAndNewlines)
            guard !focus.isEmpty else { return nil }

            let afterFocus = item[item.index(after: focusEnd)...]
            let text: String
            if afterFocus.hasPrefix(":") {
                text = String(afterFocus.dropFirst())
            } else {
                text = String(afterFocus)
            }
            let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmedText.isEmpty else { return nil }

            return LearningTrace(
                focus: focus,
                text: LoomReflectionRootView.clippedSelectionText(trimmedText, maxLength: 180)
            )
        }
    }
}

// Stage 3 (workbench): open cases behave like editor tabs. A tab names the
// INITIATION; closing it never deletes the case. Quiet native chrome — no
// web-IDE skin.
// The VSCode-form IDE center, drawn natively (owner directive 2026-07-03:
// 不是嵌网页 — the QBook web embed is retired). Same skeleton as QBook's
// dev environment — activity bar · side panel · tab strip · document —
// with the reflection register as the document and Loom material as the
// panel content.
private enum IDEActivity: String, CaseIterable {
    case explorer, search, sources, run, layers

    var icon: String {
        switch self {
        case .explorer: return "doc.on.doc"
        case .search: return "magnifyingglass"
        case .sources: return "arrow.triangle.branch"
        case .run: return "play"
        case .layers: return "square.3.layers.3d"
        }
    }

    var panelTitle: String {
        switch self {
        case .explorer: return "EXPLORER"
        case .search: return "SEARCH"
        case .sources: return "SOURCE CONTROL"
        case .run: return "RUN"
        case .layers: return "LAYERS"
        }
    }
}

private struct LoomIDECenter: View {
    let cases: [ReflectionCase]
    let reflectionCase: ReflectionCase
    let openCaseIDs: [ReflectionCase.ID]
    let principles: [ReflectionPrincipleRecord]
    @Binding var selectedLearningTraceID: ReflectionLearningTrace.ID?
    @Binding var draftText: String
    @Binding var commitFocus: ReflectionCommitFocus
    let topClearance: CGFloat
    let onSelectTab: (ReflectionCase.ID) -> Void
    let onCloseTab: (ReflectionCase.ID) -> Void
    let onSelectTrace: (ReflectionLearningTrace) -> Void
    let onPromotePrinciple: (String) -> Void
    let onCitePrinciple: (ReflectionPrincipleRecord.ID) -> Void
    let onSelectSource: (ReflectionSource) -> Void
    let onSubmit: () -> Void

    @State private var activity: IDEActivity = .explorer
    @State private var isPanelVisible = true
    @State private var workspaceExpanded = true

    var body: some View {
        HStack(spacing: 0) {
            activityBar
            Rectangle().fill(LoomTokens.dsHairFaint).frame(width: 1)
            if isPanelVisible {
                sidePanel
                    .frame(width: 236)
                Rectangle().fill(LoomTokens.dsHairFaint).frame(width: 1)
            }
            VStack(spacing: 0) {
                WorkbenchCaseTabStrip(
                    cases: cases,
                    openCaseIDs: openCaseIDs,
                    selectedCaseID: reflectionCase.id,
                    onSelect: onSelectTab,
                    onClose: onCloseTab
                )
                .padding(.top, topClearance)
                Rectangle().fill(LoomTokens.dsHairFaint).frame(height: 1)
                ReflectionThreadView(
                    reflectionCase: reflectionCase,
                    selectedLearningTraceID: $selectedLearningTraceID,
                    draftText: $draftText,
                    commitFocus: $commitFocus,
                    topPadding: workbenchThreadTopPadding,
                    onSelectTrace: onSelectTrace,
                    onPromotePrinciple: onPromotePrinciple,
                    onSubmit: onSubmit
                )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var activityBar: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: topClearance)
            ForEach(IDEActivity.allCases, id: \.self) { item in
                activityButton(item)
            }
            Spacer(minLength: 0)
            Image(systemName: "person.crop.circle")
                .font(.system(size: 15))
                .foregroundStyle(LoomTokens.dsInk3.opacity(0.7))
                .frame(width: 46, height: 40)
            Image(systemName: "gearshape")
                .font(.system(size: 15))
                .foregroundStyle(LoomTokens.dsInk3.opacity(0.7))
                .frame(width: 46, height: 44)
        }
        .frame(width: 46)
        .frame(maxHeight: .infinity)
        .background(LoomTokens.dsPaperDeep.opacity(0.30))
    }

    private func activityButton(_ item: IDEActivity) -> some View {
        let isActive = item == activity && isPanelVisible
        return Button {
            if item == activity {
                isPanelVisible.toggle()
            } else {
                activity = item
                isPanelVisible = true
            }
        } label: {
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(isActive ? LoomTokens.dsThread : Color.clear)
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
                Image(systemName: item.icon)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(isActive ? LoomTokens.dsInk1 : LoomTokens.dsInk3)
                    .frame(maxWidth: .infinity)
            }
            .frame(width: 46, height: 42)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .help(item.panelTitle.capitalized)
    }

    private var sidePanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer().frame(height: topClearance)
            Text(activity.panelTitle)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.2)
                .foregroundStyle(LoomTokens.dsInk3)
                .padding(.horizontal, 20)
                .frame(height: 30, alignment: .leading)
            if activity == .explorer {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        workspaceSection
                        WorkbenchSidebarPanels(
                            reflectionCase: reflectionCase,
                            sectionText: LoomTokens.dsInk3,
                            rowText: LoomTokens.dsInk2,
                            subText: LoomTokens.dsInk3,
                            divider: LoomTokens.dsHairFaint,
                            onSelectTrace: onSelectTrace,
                            principles: principles,
                            onCitePrinciple: onCitePrinciple
                        )
                    }
                }
            } else {
                Text("Not wired yet.")
                    .font(.system(size: 11))
                    .foregroundStyle(LoomTokens.dsInk3)
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                Spacer(minLength: 0)
            }
        }
        .frame(maxHeight: .infinity, alignment: .top)
        .background(LoomTokens.dsPaperDeep.opacity(0.18))
    }

    private var workspaceSection: some View {
        DisclosureGroup(isExpanded: $workspaceExpanded) {
            VStack(alignment: .leading, spacing: 2) {
                ForEach(reflectionCase.sources, id: \.id) { source in
                    Button {
                        onSelectSource(source)
                    } label: {
                        HStack(spacing: 7) {
                            Image(systemName: "doc.text")
                                .font(.system(size: 10))
                                .foregroundStyle(LoomTokens.dsInk3)
                            Text(source.label)
                                .font(.system(size: 11.5))
                                .lineLimit(1)
                                .foregroundStyle(LoomTokens.dsInk2)
                            Spacer(minLength: 0)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .padding(.vertical, 3)
                }
                if reflectionCase.sources.isEmpty {
                    Text("No sources yet — capture with ⌘⇧U.")
                        .font(.system(size: 10.5))
                        .foregroundStyle(LoomTokens.dsInk3)
                }
            }
            .padding(.top, 4)
        } label: {
            Text("WORKSPACE")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .tracking(1.2)
                .foregroundStyle(LoomTokens.dsInk3)
        }
        .tint(LoomTokens.dsInk3)
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
    }
}

private struct WorkbenchCaseTabStrip: View {
    let cases: [ReflectionCase]
    let openCaseIDs: [ReflectionCase.ID]
    let selectedCaseID: ReflectionCase.ID
    let onSelect: (ReflectionCase.ID) -> Void
    let onClose: (ReflectionCase.ID) -> Void

    private var openCases: [ReflectionCase] {
        openCaseIDs.compactMap { id in cases.first { $0.id == id } }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(openCases) { openCase in
                    let isSelected = openCase.id == selectedCaseID
                    HStack(spacing: 6) {
                        Text(openCase.title)
                            .font(.system(size: 11.5, weight: isSelected ? .semibold : .regular))
                            .lineLimit(1)
                            .foregroundStyle(isSelected ? LoomTokens.dsInk1 : LoomTokens.dsInk3)
                        if openCases.count > 1 {
                            Button {
                                onClose(openCase.id)
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundStyle(LoomTokens.dsInk3)
                            }
                            .buttonStyle(.plain)
                            .help("Close tab")
                        }
                    }
                    .padding(.horizontal, 11)
                    .frame(height: 26)
                    .background(
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .fill(isSelected ? LoomTokens.dsPaperUp.opacity(0.78) : Color.clear)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .stroke(isSelected ? LoomTokens.dsHair : Color.clear, lineWidth: 1)
                    )
                    .contentShape(Rectangle())
                    .onTapGesture { onSelect(openCase.id) }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 24)
        }
        .frame(height: 34)
    }
}

// Stage 3 (workbench): the status bar is an instrument — it tells the truth
// about anchor quality and surfaces the (previously write-only) status
// message. One line, no decoration.
private struct WorkbenchStatusBar: View {
    let trace: ReflectionLearningTrace?
    let isLearningCase: Bool
    let message: String
    var onEnablePreciseAnchors: (() -> Void)? = nil

    private var anchorSummary: (label: String, isStrong: Bool)? {
        guard isLearningCase, let trace else { return nil }
        let precision = trace.evidence.first { item in
            item.label == "anchor precision" || item.label == "visual precision"
        }?.value
        if let precision {
            return ("anchor: \(precision)", !trace.isWeakAnchor)
        }
        return ("anchor: none", false)
    }

    var body: some View {
        HStack(spacing: 14) {
            if isLearningCase {
                Text("⌘⇧U captures from the frontmost file")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(LoomTokens.dsInk3)
            }
            if let anchorSummary {
                HStack(spacing: 5) {
                    Circle()
                        .fill(anchorSummary.isStrong ? LoomTokens.dsThread : Color(red: 0.72, green: 0.47, blue: 0.12))
                        .frame(width: 5, height: 5)
                    Text(anchorSummary.label)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(LoomTokens.dsInk3)
                }
                if !anchorSummary.isStrong, let onEnablePreciseAnchors {
                    // No silent degrade: the instrument names the fix.
                    Button("Enable page-precise anchors…", action: onEnablePreciseAnchors)
                        .buttonStyle(.plain)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(LoomTokens.dsThread)
                        .help("Grant Accessibility to LoomAnchorHelper so anchors reach file+page")
                }
            }
            Spacer(minLength: 0)
            Text(message)
                .font(.system(size: 10))
                .lineLimit(1)
                .foregroundStyle(LoomTokens.dsInk3)
        }
        .padding(.horizontal, 16)
        .frame(height: 24)
        .background(.bar)
        .overlay(alignment: .top) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }
}
