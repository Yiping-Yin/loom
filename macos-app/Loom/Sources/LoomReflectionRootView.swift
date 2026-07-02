import SwiftUI
import AppKit
import PDFKit

private let reflectionSidebarWidth: CGFloat = 240
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
private let reflectionTopBarHeight: CGFloat = 52
private let reflectionSidebarTopClearance: CGFloat = 72
private let reflectionThreadMaxWidth: CGFloat = 720
private let reflectionTrafficLightClearance: CGFloat = 88
private let reflectionTitlebarControlSize: CGFloat = 16
private let reflectionTitlebarControlCenterY: CGFloat = 16
private let reflectionTitlebarContentTop: CGFloat = reflectionTitlebarControlCenterY - (reflectionTitlebarControlSize / 2)
private let reflectionThreadTopPadding: CGFloat = 76
private let reflectionInspectorTopPadding: CGFloat = 74
private let reflectionLearningEvidenceMarker = "\nEvidence:"

private func reflectionLearningInputFingerprint(_ value: String) -> String {
    var normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if let evidenceRange = normalized.range(of: reflectionLearningEvidenceMarker) {
        normalized = String(normalized[..<evidenceRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    while let pageRange = normalized.range(of: #", page \d+"#, options: .regularExpression) {
        normalized.removeSubrange(pageRange)
    }
    return normalized
        .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
        .lowercased()
}

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

struct LoomReflectionRootView: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var cases: [ReflectionCase]
    @State private var selectedCaseID: ReflectionCase.ID
    @State private var selectedSourceID: ReflectionSource.ID?
    @State private var selectedLearningTraceID: ReflectionLearningTrace.ID?
    @State private var draftText: String = ""
    @State private var statusMessage: String = "Local reflection workspace"
    @State private var isSidebarPresented: Bool = true
    @State private var isSidebarPeeking: Bool = false
    @State private var isInspectorPresented: Bool = true
    @AppStorage(reflectionInspectorWidthKey) private var inspectorWidth: Double = Double(reflectionInspectorDefaultWidth)

    @State private var capturePayload: CapturePayload?
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

    init() {
        let restored = ReflectionWorkspaceStore.load()
        let initialCases = restored?.cases.isEmpty == false ? restored!.cases : ReflectionCase.samples
        let initialSelectedCaseID: ReflectionCase.ID
        if let restoredSelectedCaseID = restored?.selectedCaseID,
           initialCases.contains(where: { $0.id == restoredSelectedCaseID }) {
            initialSelectedCaseID = restoredSelectedCaseID
        } else {
            initialSelectedCaseID = initialCases[0].id
        }
        let initialSelectedCase = initialCases.first { $0.id == initialSelectedCaseID } ?? initialCases[0]
        let initialSelectedSourceID: ReflectionSource.ID?
        if let restoredSelectedSourceID = restored?.selectedSourceID,
           initialSelectedCase.sources.contains(where: { $0.id == restoredSelectedSourceID }) {
            initialSelectedSourceID = restoredSelectedSourceID
        } else {
            initialSelectedSourceID = initialSelectedCase.sources.first?.id
        }

        _cases = State(initialValue: initialCases)
        _selectedCaseID = State(initialValue: initialSelectedCaseID)
        _selectedSourceID = State(initialValue: initialSelectedSourceID)
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            HStack(spacing: 0) {
                if isSidebarPresented {
                    ReflectionSidebar(
                        cases: cases,
                        selectedCaseID: selectedCaseID,
                        onSelect: selectCase,
                        onCreate: createReflection,
                        onCreateLearning: createLearningProject,
                        onDelete: deleteReflection,
                        onRename: renameReflection
                    )
                    .frame(width: reflectionSidebarWidth)
                    .transition(.move(edge: .leading).combined(with: .opacity))
                    .onHover { hovering in
                        updateSidebarPeek(hovering)
                    }

                    ReflectionDivider()
                }

                HStack(spacing: 0) {
                    ReflectionThreadView(
                        reflectionCase: selectedCase,
                        selectedLearningTraceID: $selectedLearningTraceID,
                        draftText: $draftText,
                        onSelectTrace: selectLearningTrace,
                        onSubmit: submitMaterial
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                    if isInspectorPresented {
                        ReflectionPaneResizer(width: $inspectorWidth)
                        ReflectionSourceInspector(
                            reflectionCase: selectedCase,
                            sources: selectedCase.sources,
                            selectedSourceID: selectedSourceID,
                            selectedSource: selectedSource,
                            selectedTrace: selectedLearningTrace,
                            onImport: importLocalSources,
                            onOpenSource: openSelectedSourceInNativeApp,
                            onSelect: { source in
                                selectedSourceID = source.id
                                if source.fileURL != nil {
                                    openSourceInNativeApp(source)
                                } else {
                                    statusMessage = "Opened \(source.label)"
                                }
                            }
                        )
                        .frame(width: clampedInspectorWidth(inspectorWidth))
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                }
                .background(ReflectionMatteWorkbenchBackground().ignoresSafeArea())
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            ReflectionTopBar(
                reflectionCase: selectedCase,
                nativeSource: nativeSource,
                isSidebarPresented: isSidebarPresented,
                isInspectorPresented: isInspectorPresented,
                sourceCount: selectedCase.sources.count,
                onToggleSidebar: toggleSidebar,
                onToggleInspector: toggleInspector,
                onOpenSourceInNativeApp: openSelectedSourceInNativeApp
            )
            .zIndex(1)

            if shouldOverlaySidebar {
                HStack(spacing: 0) {
                    ReflectionSidebar(
                        cases: cases,
                        selectedCaseID: selectedCaseID,
                        material: .centerOverlay,
                        onSelect: selectCase,
                        onCreate: createReflection,
                        onCreateLearning: createLearningProject,
                        onDelete: deleteReflection,
                        onRename: renameReflection
                    )
                    .frame(width: reflectionSidebarWidth)

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
        }
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
        .onAppear {
            consumePendingCapture()
            consumePendingExternalFiles()
            consumePendingExternalSelection()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomNewTopic)) { _ in createReflection() }
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
            handleExternalSelectionCapture(capture)
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
        selectedCaseID = reflectionCase.id
        selectedSourceID = reflectionCase.sources.first?.id
        selectedLearningTraceID = nil
        statusMessage = "Opened \(reflectionCase.title)"
        persistWorkspace()
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

    private func toggleInspector() {
        withAnimation(.easeInOut(duration: 0.18)) {
            isInspectorPresented.toggle()
        }
    }

    private func createReflection() {
        let next = ReflectionCase.blank()
        cases.insert(next, at: 0)
        selectedCaseID = next.id
        selectedSourceID = nil
        selectedLearningTraceID = nil
        draftText = ""
        statusMessage = "New reflection created"
        persistWorkspace()
    }

    /// An INITIATION the user starts before touching any file: an empty
    /// learning project. Captures (⌘⇧L) then join it as the active project
    /// and its files accumulate under Sources.
    private func createLearningProject() {
        let next = Self.learningCase(from: [])
        cases.insert(next, at: 0)
        selectedCaseID = next.id
        selectedSourceID = nil
        selectedLearningTraceID = nil
        draftText = ""
        statusMessage = "New learning project started"
        persistWorkspace()
    }

    private func renameReflection(_ reflectionCase: ReflectionCase, to title: String) {
        guard let index = cases.firstIndex(where: { $0.id == reflectionCase.id }) else { return }
        cases[index].title = title
        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
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

        let importedSources = panel.urls.map(Self.localSource)
        guard !importedSources.isEmpty else { return }

        let index = selectedIndex
        let inputLines = importedSources.map { source in
            "Imported local source: \(source.label). \(source.excerpt)"
        }

        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
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
        openSourcesInNativeApps(importedSources)
        statusMessage = importedSources.count == 1
            ? "Imported \(importedSources[0].label) and opened it in the native app"
            : "Imported \(importedSources.count) local sources and opened them in native apps"
        persistWorkspace()
    }

    private func submitMaterial() {
        let material = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !material.isEmpty else { return }

        let index = selectedIndex
        if cases[index].project == "Learning pass" {
            let sourceLabel = selectedLearningTrace?.sourceAnchor
                ?? Self.latestLearningAnchor(in: cases[index])
                ?? cases[index].sources.first?.label
                ?? cases[index].title
            cases[index].status = "Reading"
            cases[index].updatedAt = Self.timeFormatter.string(from: Date())
            cases[index].steps[0].items.append(Self.manualLearningInputLine(material, sourceLabel: sourceLabel, focus: .meaning))
            cases[index].messages.append(ReflectionMessage(role: .human, eyebrow: "Understanding version", body: material))
            cases[index].messages.append(
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Version committed",
                    body: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
                )
            )
            refreshLearningSynthesis(for: index)
            selectedLearningTraceID = ReflectionLearningTrace.from(cases[index]).last?.id
            draftText = ""
            statusMessage = "Committed thinking version"
            persistWorkspace()
            return
        }

        cases[index].status = "In reflection"
        cases[index].updatedAt = Self.timeFormatter.string(from: Date())
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
            handleExternalSelectionCapture(pending)
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
        Self.openURLInPreferredNativeApp(url)
        statusMessage = "Opened \(source.label) in the native app"
    }

    private func openSelectedSourceInNativeApp() {
        guard let nativeSource else { return }
        openSourceInNativeApp(nativeSource)
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
            refreshLearningSynthesis(for: index)
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
        cases[index].steps[0].items.append(inputLine)
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
        refreshLearningSynthesis(for: index)
        selectedLearningTraceID = ReflectionLearningTrace.from(cases[index]).last?.id
        draftText = ""
        isSidebarPresented = false
        isSidebarPeeking = false
        isInspectorPresented = false
        statusMessage = "Captured selected text from the native app"
        persistWorkspace()
    }

    private func refreshLearningSynthesis(for index: Int) {
        guard cases.indices.contains(index),
              cases[index].project == "Learning pass" else { return }

        let synthesis = ReflectionLearningSynthesis.make(for: cases[index])
        guard !synthesis.isEmpty else { return }

        appendUniqueStepItems(synthesis.assumptions, to: "assumption", caseIndex: index)
        appendUniqueStepItems(synthesis.decisions, to: "decision", caseIndex: index)
        appendUniqueStepItems(synthesis.outcomes, to: "outcome", caseIndex: index)
        appendUniqueStepItems(synthesis.reflections, to: "reflection", caseIndex: index)
        appendUniqueStepItems(synthesis.memories, to: "memory", caseIndex: index)

        cases[index].status = "Second pass ready"
        if !cases[index].messages.contains(where: { $0.body.contains("Second-pass synthesis prepared") }) {
            cases[index].messages.append(
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Second pass",
                    body: "Second-pass synthesis prepared from understanding versions. Review the changes before promoting any confirmed principle into memory."
                )
            )
        }
    }

    private func appendUniqueStepItems(_ items: [String], to stepID: String, caseIndex: Int) {
        guard let stepIndex = cases[caseIndex].steps.firstIndex(where: { $0.id == stepID }) else { return }
        for item in items where !cases[caseIndex].steps[stepIndex].items.contains(item) {
            cases[caseIndex].steps[stepIndex].items.append(item)
        }
    }

    private func persistWorkspace() {
        ReflectionWorkspaceStore.save(
            cases: cases,
            selectedCaseID: selectedCaseID,
            selectedSourceID: selectedSourceID
        )
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

        return ReflectionSource(
            folder: "Input",
            label: url.lastPathComponent,
            kind: kind,
            meta: size,
            excerpt: excerpt,
            fileURL: url
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
            fileOpeningLine = "Learning project started. Capture from any native file (⌘⇧L) to attach it as a source."
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
            ]
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

    private static func clippedSelectionText(_ text: String, maxLength: Int = 900) -> String {
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
    let isSidebarPresented: Bool
    let isInspectorPresented: Bool
    let sourceCount: Int
    let onToggleSidebar: () -> Void
    let onToggleInspector: () -> Void
    let onOpenSourceInNativeApp: () -> Void
    // The Evidence strip tracks the resizable pane width live.
    @AppStorage(reflectionInspectorWidthKey) private var inspectorWidth: Double = Double(reflectionInspectorDefaultWidth)

    var body: some View {
        HStack(spacing: 0) {
            HStack(spacing: 8) {
                Spacer().frame(width: reflectionTrafficLightClearance)
                sidebarButton
                Spacer(minLength: 0)
            }
            .frame(width: isSidebarPresented ? reflectionSidebarWidth : reflectionTrafficLightClearance + 36)

            HStack(spacing: 9) {
                ReflectionFileTypeBadge(
                    kind: nativeSource?.kind ?? reflectionCase.sources.first?.kind ?? "document",
                    fallbackColor: LoomTokens.dsInk3
                )
                .scaleEffect(0.78)
                .frame(width: 18, height: 18)

                Text(reflectionCase.title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .lineLimit(1)

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

                Spacer(minLength: 0)
            }
            .padding(.leading, isSidebarPresented ? 18 : 8)
            .padding(.trailing, 14)
            .frame(height: reflectionTitlebarControlSize)
            .frame(maxWidth: .infinity)

            if isInspectorPresented {
                HStack(spacing: 10) {
                    Text("Evidence")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(LoomTokens.dsInk1)
                    Spacer(minLength: 0)
                    inspectorButton
                }
                .padding(.horizontal, 14)
                .frame(height: reflectionTitlebarControlSize)
                .frame(width: clampedInspectorWidth(inspectorWidth))
            } else {
                inspectorButton
                    .padding(.trailing, 16)
            }
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
            isActive: isInspectorPresented,
            help: isInspectorPresented ? "Hide evidence" : "Show evidence",
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

private struct ReflectionSidebar: View {
    let cases: [ReflectionCase]
    let selectedCaseID: ReflectionCase.ID
    var material: ReflectionSidebarMaterial = .rail
    let onSelect: (ReflectionCase) -> Void
    let onCreate: () -> Void
    let onCreateLearning: () -> Void
    let onDelete: (ReflectionCase) -> Void
    let onRename: (ReflectionCase, String) -> Void
    @Environment(\.colorScheme) private var colorScheme
    @State private var query: String = ""

    private var usesCenterOverlay: Bool { material == .centerOverlay }
    private var usesLightChrome: Bool { usesCenterOverlay || colorScheme == .light }
    private var primaryText: Color { usesLightChrome ? LoomTokens.dsInk1 : .white.opacity(0.90) }
    private var sectionText: Color { usesLightChrome ? LoomTokens.dsInk3 : .white.opacity(0.42) }
    private var localPrimaryText: Color { usesLightChrome ? LoomTokens.dsInk1 : .white.opacity(0.86) }
    private var localSecondaryText: Color { usesLightChrome ? LoomTokens.dsInk3 : .white.opacity(0.48) }
    private var localDivider: Color { usesLightChrome ? LoomTokens.dsHair : .white.opacity(0.08) }

    private var visibleCases: [ReflectionCase] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !needle.isEmpty else { return cases }
        return cases.filter { item in
            ([item.title, item.project, item.summary] + item.tags)
                .contains { $0.lowercased().contains(needle) }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 14) {
                Menu {
                    Button("Learning project", action: onCreateLearning)
                    Button("Product reflection", action: onCreate)
                } label: {
                    Label("New reflection", systemImage: "square.and.pencil")
                        .font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                }
                .menuStyle(.borderlessButton)
                .menuIndicator(.hidden)
                .buttonStyle(.plain)
                .foregroundStyle(primaryText)

                ReflectionSidebarSearchField(text: $query, material: material)
            }
            .padding(.top, reflectionSidebarTopClearance)
            .padding(.horizontal, 20)
            .padding(.bottom, 18)

            Text("Reflections")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(sectionText)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(visibleCases) { reflectionCase in
                        ReflectionSidebarRow(
                            reflectionCase: reflectionCase,
                            isSelected: reflectionCase.id == selectedCaseID,
                            material: material,
                            onSelect: { onSelect(reflectionCase) },
                            onDelete: { onDelete(reflectionCase) },
                            onRename: { onRename(reflectionCase, $0) }
                        )
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 20)
            }

            Spacer(minLength: 0)

            HStack(spacing: 10) {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.26, green: 0.54, blue: 0.72),
                                Color(red: 0.09, green: 0.13, blue: 0.18)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 30, height: 30)
                    .overlay(Circle().stroke(Color.white.opacity(0.18), lineWidth: 1))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Local")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(localPrimaryText)
                    Text("On-device memory")
                        .font(.system(size: 11))
                        .foregroundStyle(localSecondaryText)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 20)
            .frame(height: 64)
            .overlay(alignment: .top) {
                Rectangle().fill(localDivider).frame(height: 1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(ReflectionSidebarBackground(material: material))
    }
}

private enum ReflectionSidebarMaterial: Equatable {
    case rail
    case centerOverlay
}

private struct ReflectionSidebarBackground: View {
    let material: ReflectionSidebarMaterial
    @Environment(\.colorScheme) private var colorScheme

    private var liquidGlassMaterial: NSVisualEffectView.Material {
        switch material {
        case .rail:
            return .sidebar
        case .centerOverlay:
            return .popover
        }
    }

    private var liquidGlassBlendingMode: NSVisualEffectView.BlendingMode {
        material == .rail ? .behindWindow : .withinWindow
    }

    private var glassTint: Color {
        switch (material, colorScheme) {
        case (.rail, .light):
            return Color.white.opacity(0.08)
        case (.rail, .dark):
            return Color.black.opacity(0.05)
        case (.centerOverlay, .light):
            return LoomTokens.dsPaper.opacity(0.16)
        case (.centerOverlay, .dark):
            return LoomTokens.dsPaperDeep.opacity(0.18)
        }
    }

    private var glassHairline: Color {
        colorScheme == .light ? Color.white.opacity(0.62) : Color.white.opacity(0.11)
    }

    private var glassShadow: Color {
        colorScheme == .light ? Color.black.opacity(0.07) : Color.black.opacity(0.22)
    }

    var body: some View {
        ZStack {
            ReflectionVisualEffectBackground(
                material: liquidGlassMaterial,
                blendingMode: liquidGlassBlendingMode
            )
            Rectangle().fill(glassTint)
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
                .fill(glassHairline)
                .frame(width: 0.5)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .shadow(color: glassShadow, radius: material == .rail ? 24 : 34, x: material == .rail ? 10 : 18, y: 0)
    }
}

private struct ReflectionMatteWorkbenchBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    private var paperTint: Color {
        colorScheme == .light ? LoomTokens.dsPaperDeep.opacity(0.68) : LoomTokens.dsPaperDeep.opacity(0.78)
    }

    private var fogTint: Color {
        colorScheme == .light ? Color.white.opacity(0.16) : Color.white.opacity(0.025)
    }

    var body: some View {
        ZStack {
            ReflectionVisualEffectBackground(
                material: .contentBackground,
                blendingMode: .withinWindow
            )
            Rectangle().fill(paperTint)
            Rectangle().fill(fogTint).blendMode(.plusLighter)
        }
    }
}

private struct ReflectionFrostedInspectorBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    private var frostTint: Color {
        colorScheme == .light ? LoomTokens.dsPaper.opacity(0.42) : LoomTokens.dsPaper.opacity(0.58)
    }

    private var edgeTint: Color {
        colorScheme == .light ? Color.white.opacity(0.34) : Color.white.opacity(0.075)
    }

    var body: some View {
        ZStack {
            ReflectionVisualEffectBackground(
                material: .underPageBackground,
                blendingMode: .withinWindow
            )
            Rectangle().fill(frostTint)
            Rectangle()
                .fill(edgeTint)
                .frame(width: 0.5)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
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
    let material: ReflectionSidebarMaterial
    @Environment(\.colorScheme) private var colorScheme

    private var usesCenterOverlay: Bool { material == .centerOverlay }
    private var usesLightChrome: Bool { usesCenterOverlay || colorScheme == .light }
    private var iconColor: Color { usesLightChrome ? LoomTokens.dsInk3 : .white.opacity(0.50) }
    private var textColor: Color { usesLightChrome ? LoomTokens.dsInk1 : .white.opacity(0.88) }
    private var fillColor: Color {
        if usesCenterOverlay {
            return LoomTokens.dsPaper.opacity(colorScheme == .light ? 0.18 : 0.14)
        }
        return usesLightChrome ? Color.white.opacity(0.15) : .white.opacity(0.055)
    }
    private var strokeColor: Color { usesLightChrome ? Color.white.opacity(0.32) : .white.opacity(0.10) }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 12))
                .foregroundStyle(iconColor)
            TextField("Search", text: $text)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .foregroundStyle(textColor)
        }
        .padding(.horizontal, 10)
        .frame(height: 32)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .background(fillColor, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(strokeColor, lineWidth: 1)
        )
    }
}

private struct ReflectionSidebarRow: View {
    let reflectionCase: ReflectionCase
    let isSelected: Bool
    let material: ReflectionSidebarMaterial
    let onSelect: () -> Void
    let onDelete: () -> Void
    let onRename: (String) -> Void
    @Environment(\.colorScheme) private var colorScheme
    @State private var isHovering = false
    @State private var isEditingTitle = false
    @State private var titleDraft = ""
    @FocusState private var titleFieldFocused: Bool

    private func beginRename() {
        titleDraft = reflectionCase.title
        isEditingTitle = true
        titleFieldFocused = true
    }

    private func commitRename() {
        isEditingTitle = false
        let trimmed = titleDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed != reflectionCase.title else { return }
        onRename(trimmed)
    }

    private var usesCenterOverlay: Bool { material == .centerOverlay }
    private var usesLightChrome: Bool { usesCenterOverlay || colorScheme == .light }

    private var iconColor: Color {
        usesLightChrome
            ? (isSelected ? LoomTokens.dsInk2 : LoomTokens.dsInk3)
            : (isSelected ? .white.opacity(0.90) : .white.opacity(0.56))
    }

    private var titleColor: Color {
        usesLightChrome
            ? (isSelected ? LoomTokens.dsInk1 : LoomTokens.dsInk2)
            : (isSelected ? .white.opacity(0.96) : .white.opacity(0.78))
    }

    private var metaColor: Color {
        usesLightChrome
            ? (isSelected ? LoomTokens.dsInk2 : LoomTokens.dsInk3)
            : .white.opacity(isSelected ? 0.62 : 0.44)
    }

    private var timeColor: Color {
        usesLightChrome
            ? LoomTokens.dsInk3
            : .white.opacity(isSelected ? 0.58 : 0.38)
    }

    private var deleteColor: Color {
        guard isHovering || isSelected else { return .clear }
        return usesLightChrome ? LoomTokens.dsInk3 : .white.opacity(0.62)
    }

    private var deleteFill: Color {
        guard isHovering else { return .clear }
        return usesLightChrome ? LoomTokens.dsPaper.opacity(0.34) : .white.opacity(0.08)
    }

    private var selectedFill: Color {
        guard isSelected else { return .clear }
        if usesLightChrome {
            return usesCenterOverlay ? LoomTokens.dsThread.opacity(0.07) : Color.white.opacity(0.18)
        }
        return .white.opacity(0.09)
    }

    private var selectedStroke: Color {
        guard isSelected else { return .clear }
        return usesLightChrome ? Color.white.opacity(0.34) : .white.opacity(0.10)
    }

    var body: some View {
        HStack(alignment: .center, spacing: 4) {
            Button(action: onSelect) {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "bubble.left")
                        .font(.system(size: 13))
                        .foregroundStyle(iconColor)
                        .frame(width: 16, height: 18)
                        .padding(.top, 1)

                    VStack(alignment: .leading, spacing: 4) {
                        if isEditingTitle {
                            // Projects are named for the initiation — rename
                            // them to the real endeavor (double-click or the
                            // context menu).
                            TextField("Project name", text: $titleDraft)
                                .textFieldStyle(.plain)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(titleColor)
                                .focused($titleFieldFocused)
                                .onSubmit { commitRename() }
                                .onExitCommand { isEditingTitle = false }
                        } else {
                            Text(reflectionCase.title)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(titleColor)
                                .lineLimit(1)
                                .onTapGesture(count: 2) { beginRename() }
                        }
                        HStack(spacing: 6) {
                            Text(reflectionCase.project)
                                .font(.system(size: 11))
                                .foregroundStyle(metaColor)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            Text(reflectionCase.updatedAt)
                                .font(.system(size: 10, weight: .regular, design: .monospaced))
                                .foregroundStyle(timeColor)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.system(size: 11, weight: .medium))
                    .frame(width: 22, height: 22)
            }
            .buttonStyle(.plain)
            .foregroundStyle(deleteColor)
            .background(
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(deleteFill)
            )
            .help("Delete reflection")
        }
        .onHover { isHovering = $0 }
        .contextMenu {
            Button("Rename") { beginRename() }
            Button("Delete", role: .destructive, action: onDelete)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            if isSelected {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(.thinMaterial)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(selectedFill)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(selectedStroke, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .help(reflectionCase.summary)
    }
}
private struct ReflectionThreadView: View {
    let reflectionCase: ReflectionCase
    @Binding var selectedLearningTraceID: ReflectionLearningTrace.ID?
    @Binding var draftText: String
    let onSelectTrace: (ReflectionLearningTrace) -> Void
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
                            onSelectTrace: onSelectTrace
                        )
                    } else {
                        ReflectionTraceList(steps: reflectionCase.steps)
                        ReflectionMessages(messages: reflectionCase.messages)
                    }
                }
                .frame(maxWidth: reflectionThreadMaxWidth, alignment: .leading)
                .padding(.horizontal, 28)
                .padding(.top, reflectionThreadTopPadding)
                .padding(.bottom, 22)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            ReflectionComposer(
                text: $draftText,
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
        .background(ReflectionMatteWorkbenchBackground())
    }

    private var composerPlaceholder: String {
        if reflectionCase.project == "Learning pass" {
            return "Margin note..."
        }
        return "Paste a product event, user reaction, decision, or launch result..."
    }
}

private struct ReflectionLearningLedgerView: View {
    let reflectionCase: ReflectionCase
    let selectedTraceID: ReflectionLearningTrace.ID?
    let onSelectTrace: (ReflectionLearningTrace) -> Void
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
                ReflectionLearningPrincipleCandidate(principle: principle)
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

            if let summary = ReflectionLearningReviewSummary.make(for: reflectionCase) {
                ReflectionLearningReview(summary: summary)
            }

            VStack(alignment: .leading, spacing: 0) {
                ForEach(orderedTraces) { trace in
                    ReflectionLearningDocumentEntry(
                        trace: trace,
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
                            ? "Open — what would close this question?"
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

private struct ReflectionLearningEvidence: Identifiable, Equatable {
    let label: String
    let value: String

    var id: String {
        "\(label)=\(value)"
    }
}

private struct ReflectionLearningPrincipleCandidate: View {
    let principle: String

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
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 2)
        .overlay(alignment: .bottom) {
            Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
        }
    }
}

private struct ReflectionLearningTrace: Identifiable, Equatable {
    let id: String
    let version: String
    let traceType: String
    let sourceAnchor: String
    let focus: String
    let pass: String
    let text: String
    let evidence: [ReflectionLearningEvidence]
    let raw: String

    var displayText: String {
        let cleaned = Self.cleanUserPrefix(text)
        return cleaned.isEmpty ? traceType : cleaned
    }

    var displayLabel: String {
        if isLanguageSelection {
            return "Original selection"
        }
        if focus == "correction" {
            return "Correction"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Principle candidate"
        }
        if isDataOrDocumentSelection {
            return "Source material"
        }
        return "Committed meaning"
    }

    var versionTitle: String {
        if focus.contains("vocabulary") {
            return "Selected word"
        }
        if focus.contains("phrase") {
            return "Selected phrase"
        }
        if focus.contains("sentence") {
            return "Selected sentence"
        }
        if focus.contains("passage") {
            return "Selected passage"
        }
        if focus.contains("data") {
            return "Selected data"
        }
        if focus.contains("document") {
            return "Document point"
        }
        if focus.contains("slide") {
            return "Slide point"
        }
        if focus == "correction" {
            return "Correction"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Principle"
        }
        return "User meaning"
    }

    var statusLabel: String {
        if isLanguageSelection {
            return "needs meaning"
        }
        if focus == "correction" {
            return "corrected"
        }
        if focus == "question" {
            return "open question"
        }
        if focus == "principle" {
            return "memory candidate"
        }
        if isDataOrDocumentSelection {
            return "needs interpretation"
        }
        return "committed"
    }

    var signalLabel: String {
        if isWeakAnchor {
            return "Confirm source"
        }
        if isLanguageSelection || isDataOrDocumentSelection {
            return "Needs meaning"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Reusable"
        }
        return "Grounded"
    }

    var signalColor: Color {
        if isWeakAnchor || isLanguageSelection || isDataOrDocumentSelection || focus == "question" {
            return Color(red: 0.72, green: 0.47, blue: 0.12)
        }
        return LoomTokens.dsThread
    }

    var isWeakAnchor: Bool {
        let precision = evidence.first { item in
            item.label == "anchor precision" || item.label == "visual precision"
        }?.value.lowercased() ?? ""
        let fallback = evidence.first { $0.label == "fallback note" }?.value.lowercased() ?? ""
        return precision.contains("visual context only") || precision.contains("window") || fallback.contains("weak")
    }

    /// Page parsed from the source anchor ("…, page 9") — the learning
    /// document orders entries by the source's own structure, not capture time.
    var pageNumber: Int? {
        guard let range = sourceAnchor.range(of: #"page (\d+)"#, options: [.regularExpression, .caseInsensitive]) else {
            return nil
        }
        let digits = sourceAnchor[range].compactMap { $0.isNumber ? $0 : nil }
        return Int(String(digits))
    }

    var pageAnchorLabel: String? {
        pageNumber.map { "p.\($0)" }
    }

    var isUserCommitted: Bool {
        !(isLanguageSelection || isDataOrDocumentSelection || focus == "question")
    }

    var isShortLanguageTrace: Bool {
        let words = displayText.split(whereSeparator: { $0.isWhitespace })
        return (focus.contains("vocabulary") || focus.contains("phrase")) && words.count <= 6
    }

    var isLanguageSelection: Bool {
        focus.contains("vocabulary") || focus.contains("phrase") || focus.contains("sentence") || focus.contains("passage")
    }

    var isDataOrDocumentSelection: Bool {
        focus.contains("data") || focus.contains("document") || focus.contains("slide") || focus.contains("text") || focus.contains("file")
    }

    func matches(source: ReflectionSource) -> Bool {
        sourceAnchor == source.label
            || sourceAnchor.hasPrefix("\(source.label),")
            || sourceAnchor.contains(source.label)
    }

    static func from(_ reflectionCase: ReflectionCase) -> [ReflectionLearningTrace] {
        let inputItems = reflectionCase.steps.first { $0.id == "input" }?.items ?? []
        var traces: [ReflectionLearningTrace] = []
        var version = 1

        for item in inputItems {
            if let capturedTrace = parseCaptured(item, version: version) {
                traces.append(capturedTrace)
                version += 1
            } else if let manualTrace = parseLegacyManual(item, version: version, sourceLabel: reflectionCase.sources.first?.label ?? reflectionCase.title) {
                traces.append(manualTrace)
                version += 1
            }
        }
        return traces
    }

    private static func cleanUserPrefix(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let prefixes = [
            "principle:", "principle：",
            "memory:", "memory：",
            "correction:", "correction：",
            "correct:", "correct：",
            "question:", "question：",
            "meaning:", "meaning：",
            "translation:", "translation：",
            "意思:", "意思：",
            "含义:", "含义：",
            "翻译:", "翻译："
        ]

        for prefix in prefixes {
            if trimmed.lowercased().hasPrefix(prefix) {
                let start = trimmed.index(trimmed.startIndex, offsetBy: prefix.count)
                return String(trimmed[start...]).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        return trimmed
    }

    private static func parseCaptured(_ item: String, version: Int) -> ReflectionLearningTrace? {
        let prefix = "Captured "
        guard item.hasPrefix(prefix),
              let fromRange = item.range(of: " from "),
              let focusStart = item.range(of: "[", range: fromRange.upperBound..<item.endIndex),
              let focusEnd = item.range(of: "]", range: focusStart.upperBound..<item.endIndex)
        else { return nil }

        let typeStart = item.index(item.startIndex, offsetBy: prefix.count)
        let traceType = String(item[typeStart..<fromRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let sourceAnchor = String(item[fromRange.upperBound..<focusStart.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let focus = String(item[focusStart.upperBound..<focusEnd.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let split = splitEvidence(from: String(item[focusEnd.upperBound...]))
        var remainder = split.content
        if remainder.hasPrefix(":") || remainder.hasPrefix(".") {
            remainder.removeFirst()
        }
        let text = remainder.trimmingCharacters(in: .whitespacesAndNewlines)
        let evidence = parseEvidence(split.evidence)

        return ReflectionLearningTrace(
            id: "\(version)-\(item)",
            version: "v\(version)",
            traceType: traceType.isEmpty ? "learning trace" : traceType,
            sourceAnchor: sourceAnchor.isEmpty ? "Original file" : sourceAnchor,
            focus: focus.isEmpty ? "user meaning" : focus,
            pass: passLabel(for: focus),
            text: text,
            evidence: evidence,
            raw: item
        )
    }

    private static func splitEvidence(from value: String) -> (content: String, evidence: String?) {
        guard let evidenceRange = value.range(of: reflectionLearningEvidenceMarker) else {
            return (value, nil)
        }

        let content = String(value[..<evidenceRange.lowerBound])
        let evidence = String(value[evidenceRange.upperBound...])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (content, evidence.isEmpty ? nil : evidence)
    }

    private static func parseEvidence(_ value: String?) -> [ReflectionLearningEvidence] {
        guard let value else { return [] }
        return value
            .split(separator: ";")
            .compactMap { segment -> ReflectionLearningEvidence? in
                let parts = segment.split(separator: "=", maxSplits: 1)
                guard parts.count == 2 else { return nil }
                let label = parts[0]
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    .lowercased()
                let evidenceValue = parts[1]
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                guard !label.isEmpty, !evidenceValue.isEmpty else { return nil }
                return ReflectionLearningEvidence(label: label, value: evidenceValue)
            }
    }

    private static func parseLegacyManual(_ item: String, version: Int, sourceLabel: String) -> ReflectionLearningTrace? {
        let prefix = "Manual learning note: "
        guard item.hasPrefix(prefix) else { return nil }
        let textStart = item.index(item.startIndex, offsetBy: prefix.count)
        let text = String(item[textStart...]).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }

        return ReflectionLearningTrace(
            id: "\(version)-\(item)",
            version: "v\(version)",
            traceType: "user trace",
            sourceAnchor: sourceLabel,
            focus: "user meaning",
            pass: "second pass",
            text: text,
            evidence: [],
            raw: item
        )
    }

    private static func passLabel(for focus: String) -> String {
        if focus.contains("vocabulary") || focus.contains("phrase") || focus.contains("sentence") || focus.contains("passage") {
            return "first language pass"
        }
        if focus.contains("data") {
            return "data pass"
        }
        if focus.contains("user") || focus.contains("question") || focus.contains("correction") || focus.contains("principle") {
            return "second pass"
        }
        return "source pass"
    }
}

private struct ReflectionLearningReviewSummary: Equatable {
    let sourceLabel: String
    let status: String
    let traceSummary: String
    let focusSummary: String
    let confirmations: [String]
    let principle: String?

    static func make(for reflectionCase: ReflectionCase) -> ReflectionLearningReviewSummary? {
        guard reflectionCase.project == "Learning pass" else { return nil }

        let outcomeItems = stepItems(in: reflectionCase, id: "outcome")
        let reflectionItems = stepItems(in: reflectionCase, id: "reflection")
        let principleItems = stepItems(in: reflectionCase, id: "memory")
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
            principle: principle
        )
    }

    private static func stepItems(in reflectionCase: ReflectionCase, id: String) -> [String] {
        reflectionCase.steps.first { $0.id == id }?.items ?? []
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
                    ReflectionLearningReviewLine(
                        label: "Next",
                        value: "Write your own meaning for the captured source before turning it into memory."
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

private struct ReflectionTraceList: View {
    let steps: [ReflectionStep]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                HStack(alignment: .top, spacing: 14) {
                    Text(String(format: "%02d", index + 1))
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(LoomTokens.dsInk3)
                        .frame(width: 24, alignment: .leading)

                    VStack(alignment: .leading, spacing: 7) {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(step.title)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(LoomTokens.dsInk1)
                            Text(step.subtitle)
                                .font(.system(size: 11))
                                .foregroundStyle(LoomTokens.dsInk3)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                        }

                        if step.items.isEmpty {
                            Text("No entry yet.")
                                .font(.system(size: 12))
                                .foregroundStyle(LoomTokens.dsInk3)
                        } else {
                            VStack(alignment: .leading, spacing: 5) {
                                ForEach(step.items, id: \.self) { item in
                                    Text(item)
                                        .font(.system(size: 12))
                                        .lineSpacing(2)
                                        .foregroundStyle(LoomTokens.dsInk2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                }
                .padding(.vertical, 12)
                .overlay(alignment: .bottom) {
                    if index < steps.count - 1 {
                        Rectangle().fill(LoomTokens.dsHair).frame(height: 1)
                    }
                }
            }
        }
        .padding(.horizontal, 2)
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
    let placeholder: String
    let isLearningCase: Bool
    let onSubmit: () -> Void

    private var hasCommitText: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
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
        Rectangle()
            .fill(LoomTokens.dsHair)
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

    var body: some View {
        ZStack {
            Rectangle()
                .fill(LoomTokens.dsHair)
                .frame(width: 1)
            ReflectionResizeHandle(width: $width)
        }
        .frame(width: 9)
        .accessibilityLabel("Resize sources inspector")
    }
}

private struct ReflectionResizeHandle: NSViewRepresentable {
    @Binding var width: Double

    func makeNSView(context: Context) -> ReflectionResizeHandleNSView {
        let view = ReflectionResizeHandleNSView()
        view.onDragBegan = { clampedInspectorWidth(width) }
        view.onDragChanged = { startWidth, deltaX in
            // The pane sits right of the seam: dragging left grows it.
            width = Double(clampedInspectorWidth(Double(startWidth - deltaX)))
        }
        return view
    }

    func updateNSView(_ nsView: ReflectionResizeHandleNSView, context: Context) {
        nsView.onDragBegan = { clampedInspectorWidth(width) }
        nsView.onDragChanged = { startWidth, deltaX in
            width = Double(clampedInspectorWidth(Double(startWidth - deltaX)))
        }
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

private struct ReflectionWorkspaceSnapshot: Codable, Equatable {
    var cases: [ReflectionCase]
    var selectedCaseID: ReflectionCase.ID
    var selectedSourceID: ReflectionSource.ID?
}

private enum ReflectionWorkspaceStore {
    private static let defaultsKey = "loom.reflectionWorkspaceSnapshot"

    static func load() -> ReflectionWorkspaceSnapshot? {
        guard let snapshot = loadFromDefaults() ?? loadFromMirror() else { return nil }
        let normalized = normalize(snapshot)
        if normalized != snapshot {
            save(
                cases: normalized.cases,
                selectedCaseID: normalized.selectedCaseID,
                selectedSourceID: normalized.selectedSourceID
            )
        } else {
            writeMirror(normalized)
        }
        return normalized
    }

    static func save(
        cases: [ReflectionCase],
        selectedCaseID: ReflectionCase.ID,
        selectedSourceID: ReflectionSource.ID?
    ) {
        let snapshot = ReflectionWorkspaceSnapshot(
            cases: cases,
            selectedCaseID: selectedCaseID,
            selectedSourceID: selectedSourceID
        )
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
        writeMirror(snapshot, encodedData: data)
    }

    private static func loadFromDefaults() -> ReflectionWorkspaceSnapshot? {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey) else { return nil }
        return try? JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: data)
    }

    private static func loadFromMirror() -> ReflectionWorkspaceSnapshot? {
        guard let url = mirrorURL,
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: data)
    }

    private static func writeMirror(_ snapshot: ReflectionWorkspaceSnapshot, encodedData: Data? = nil) {
        guard let url = mirrorURL else { return }
        let data = encodedData ?? (try? JSONEncoder().encode(snapshot))
        guard let data else { return }
        do {
            try FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try data.write(to: url, options: [.atomic])
        } catch {
            // UserDefaults remains the in-app source of truth when the mirror cannot be written.
        }
    }

    private static var mirrorURL: URL? {
        FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("Loom", isDirectory: true)
            .appendingPathComponent("reflection-workspace-snapshot.json")
    }

    private static func normalize(_ snapshot: ReflectionWorkspaceSnapshot) -> ReflectionWorkspaceSnapshot {
        var next = snapshot
        next.cases = snapshot.cases.map { reflectionCase in
            var normalizedCase = reflectionCase
            if reflectionCase.project == "Learning pass" {
                normalizedCase.messages = orderedUniqueLearningMessages(
                    reflectionCase.messages.map(normalizeLearningMessage)
                )
            }
            normalizedCase.steps = reflectionCase.steps.map { step in
                var normalizedStep = step
                let items = reflectionCase.project == "Learning pass"
                    ? normalizeLearningStepItems(step)
                    : step.items
                normalizedStep.items = orderedUnique(items)
                if reflectionCase.project == "Learning pass", normalizedStep.id == "memory" {
                    normalizedStep.title = "Principle"
                    normalizedStep.subtitle = "What can become reusable thinking"
                }
                return normalizedStep
            }
            return normalizedCase
        }
        return next
    }

    private static func orderedUnique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { value in
            if seen.contains(value) { return false }
            seen.insert(value)
            return true
        }
    }

    private static func orderedUniqueLearningMessages(_ messages: [ReflectionMessage]) -> [ReflectionMessage] {
        var seen = Set<String>()
        return messages.filter { message in
            let key = "\(message.eyebrow)\n\(message.body)"
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }
    }

    private static func normalizeLearningStepItems(_ step: ReflectionStep) -> [String] {
        let items = step.items.map(normalizeLearningInputItem)

        if step.id == "input" {
            return orderedUniqueLearningInputs(items)
        }

        if step.id == "decision" {
            return items.map {
                $0.replacingOccurrences(
                    of: "used Loom only to save anchored traces",
                    with: "used Loom only to commit anchored traces"
                )
            }
        }

        if step.id == "memory" {
            return items.filter { $0.contains("Principle candidate") }
        }

        return items
    }

    private static func orderedUniqueLearningInputs(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { value in
            let key = reflectionLearningInputFingerprint(value)
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }
    }

    private static func normalizeLearningMessage(_ message: ReflectionMessage) -> ReflectionMessage {
        var next = message
        if next.eyebrow == "Learning note" {
            next.eyebrow = "Understanding version"
        }
        if next.eyebrow == "Understanding commit" {
            next.eyebrow = "Understanding version"
        }
        next.body = next.body
            .replacingOccurrences(
                of: "Second-pass synthesis prepared from anchored learning traces. Review the meaning before turning it into reusable memory.",
                with: "Second-pass synthesis prepared from understanding versions. Review the changes before promoting any confirmed principle into memory."
            )
            .replacingOccurrences(
                of: "Second-pass synthesis prepared from anchored learning commits. Review the meaning before promoting any confirmed principle into memory.",
                with: "Second-pass synthesis prepared from understanding versions. Review the changes before promoting any confirmed principle into memory."
            )
            .replacingOccurrences(
                of: "Added to the understanding ledger. Keep the original file as the source of truth, then confirm the meaning before turning it into memory.",
                with: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
            )
            .replacingOccurrences(
                of: "Added to the understanding ledger. Keep the original file as the source of truth; promote only confirmed principles into memory.",
                with: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
            )
        return next
    }

    private static func normalizeLearningInputItem(_ value: String) -> String {
        if value == "First pass: preserve the original file surface and capture language, concepts, questions, page meaning, and useful passages as anchored traces." {
            return "First language pass: keep the original file surface primary and capture vocabulary, pronunciation, phrases, sentence meaning, grammar, questions, concepts, and page context as anchored traces."
        }
        return value
    }
}

private struct ReflectionCase: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var project: String
    var status: String
    var updatedAt: String
    var summary: String
    var tags: [String]
    var sources: [ReflectionSource]
    var steps: [ReflectionStep]
    var messages: [ReflectionMessage]

    static func blank() -> ReflectionCase {
        ReflectionCase(
            id: UUID().uuidString,
            title: "Untitled product reflection",
            project: "New product practice",
            status: "Collecting input",
            updatedAt: "now",
            summary: "Start with a real product event, decision, result, or user reaction.",
            tags: ["new"],
            sources: [],
            steps: ReflectionStep.blankWorkflow(),
            messages: [
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Loom reflection",
                    body: "Start with the concrete material. A decision, a user reaction, a metric change, or a launch result is enough."
                )
            ]
        )
    }

    static let samples: [ReflectionCase] = [
        ReflectionCase(
            id: "activation-empty-state",
            title: "Onboarding empty-state drop",
            project: "LOOM / first session",
            status: "In reflection",
            updatedAt: "18:41",
            summary: "A first-run user reached Sources, added nothing, and left before opening Studio.",
            tags: ["activation", "first-run", "evidence"],
            sources: [
                ReflectionSource(folder: "Input", label: "User feedback note", kind: "feedback", meta: "2 quotes", excerpt: "The user understood that files could be added, but did not understand what a good first file should be."),
                ReflectionSource(folder: "Input", label: "First session path", kind: "trace", meta: "4 events", excerpt: "Open app, Sources, empty shelf, Help, quit. No source imported."),
                ReflectionSource(folder: "Decision Trace", label: "Entry copy decision", kind: "decision", meta: "1 note", excerpt: "We chose to keep the first screen minimal, assuming the user already had a file in mind."),
                ReflectionSource(folder: "Outcome", label: "Activation result", kind: "metric", meta: "local sample", excerpt: "Three test sessions reached Sources. Only one imported a file without prompting."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["The real material is a failed first session, not a feature request.", "The user reached the correct surface but did not know what action had value."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["If the product exposes Add files clearly, the next step will be obvious.", "A sparse interface reduces confusion for a first-run user."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We removed explanatory onboarding and made Sources the first working surface.", "Evidence: repeated complaints about heavy first-run copy in earlier builds."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["The screen looked cleaner, but the first useful action was still underspecified."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Clean UI was not the same as clear intent. The first action needs a concrete example from the user context."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For first-run product surfaces, reduce chrome only after the primary action has a meaningful object."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Material", body: "User entered Sources, saw an empty shelf, opened Help, then quit. The UI was clean but did not create momentum."),
                ReflectionMessage(role: .loom, eyebrow: "Loom reflection", body: "The failure is not missing explanation. The hidden assumption is that an empty source shelf still communicates a useful first move."),
            ]
        ),
        ReflectionCase(
            id: "pricing-trust",
            title: "Pricing page trust test",
            project: "Public site",
            status: "Needs outcome",
            updatedAt: "16:12",
            summary: "A simplified pricing page increased clicks but reduced qualified conversations.",
            tags: ["pricing", "trust", "conversion"],
            sources: [
                ReflectionSource(folder: "Input", label: "Pricing screenshot", kind: "screenshot", meta: "before / after", excerpt: "The simplified page made the price visible earlier and removed most qualifying detail."),
                ReflectionSource(folder: "Outcome", label: "Sales feedback", kind: "feedback", meta: "3 notes", excerpt: "More visitors clicked the call-to-action, but the conversations started with lower understanding."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["The pricing page was shortened to make the offer easier to scan."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["Less detail would reduce anxiety and increase qualified intent."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We prioritized CTA clarity over qualification detail."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["Clicks rose, but qualified conversations weakened."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Reducing friction also removed useful self-selection."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For high-trust products, compression must preserve qualification cues."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Decision", body: "We removed the comparison table because it made the page feel heavy."),
                ReflectionMessage(role: .loom, eyebrow: "Judgment check", body: "The decision optimized for click clarity, but the outcome should be judged against conversation quality."),
            ]
        ),
        ReflectionCase(
            id: "answer-grounding",
            title: "Cited answer grounding",
            project: "AI answer surface",
            status: "Memory ready",
            updatedAt: "11:05",
            summary: "A polished generated answer looked convincing until source attribution was visible.",
            tags: ["attribution", "answer", "trust"],
            sources: [
                ReflectionSource(folder: "Input", label: "Generated answer draft", kind: "draft", meta: "1 answer", excerpt: "The answer made three confident claims, but only one claim had a direct source."),
                ReflectionSource(folder: "Reflection", label: "Citation review", kind: "review", meta: "3 claims", excerpt: "Attribution changed the evaluation from fluent to inspectable."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["A generated answer sounded ready before citation review."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["Fluency would roughly correlate with source support."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We kept the answer but exposed source coverage beside it."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["Unsupported claims became obvious immediately."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Trust improved when answer quality became inspectable, not when copy became smoother."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For AI output, the minimum viable unit is claim plus source, not answer text."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Observation", body: "The answer was good prose, but I could not tell which parts were earned."),
                ReflectionMessage(role: .loom, eyebrow: "Judgment memory", body: "Do not evaluate generated work as text alone. Evaluate the claim-source pair."),
            ]
        ),
    ]
}

private struct ReflectionStep: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var subtitle: String
    var items: [String]

    init(id: String = UUID().uuidString, title: String, subtitle: String, items: [String]) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.items = items
    }

    static func blankWorkflow() -> [ReflectionStep] {
        [
            ReflectionStep(id: "input", title: "Input", subtitle: "What actually happened", items: []),
            ReflectionStep(id: "assumption", title: "Assumption", subtitle: "What had to be true", items: []),
            ReflectionStep(id: "decision", title: "Decision Trace", subtitle: "Why this path won", items: []),
            ReflectionStep(id: "outcome", title: "Outcome", subtitle: "What reality returned", items: []),
            ReflectionStep(id: "reflection", title: "Reflection", subtitle: "What changed in judgment", items: []),
            ReflectionStep(id: "memory", title: "Judgment Memory", subtitle: "What should be reused", items: []),
        ]
    }
}

private struct ReflectionSource: Identifiable, Codable, Equatable {
    let id: String
    var folder: String
    var label: String
    var kind: String
    var meta: String
    var excerpt: String
    var fileURL: URL?

    init(
        id: String = UUID().uuidString,
        folder: String,
        label: String,
        kind: String,
        meta: String,
        excerpt: String,
        fileURL: URL? = nil
    ) {
        self.id = id
        self.folder = folder
        self.label = label
        self.kind = kind
        self.meta = meta
        self.excerpt = excerpt
        self.fileURL = fileURL
    }

    var symbol: String {
        switch kind {
        case "feedback": return "quote.bubble"
        case "trace": return "point.3.connected.trianglepath.dotted"
        case "decision": return "arrow.triangle.branch"
        case "metric": return "chart.line.uptrend.xyaxis"
        case "screenshot": return "rectangle.dashed"
        case "review": return "checkmark.seal"
        case "pdf": return "doc.richtext"
        case "png", "jpg", "jpeg", "heic", "gif", "tiff", "webp": return "photo"
        case "md", "markdown", "txt", "rtf": return "doc.plaintext"
        case "doc", "docx", "pages": return "doc.text"
        case "xls", "xlsx", "csv", "tsv", "numbers": return "tablecells"
        case "ppt", "pptx", "key": return "rectangle.on.rectangle"
        default: return "doc.text"
        }
    }

    var iconColor: Color {
        switch kind {
        case "pdf":
            return Color(red: 0.86, green: 0.20, blue: 0.18)
        case "doc", "docx", "pages", "rtf":
            return Color(red: 0.18, green: 0.42, blue: 0.82)
        case "xls", "xlsx", "csv", "tsv", "numbers":
            return Color(red: 0.16, green: 0.58, blue: 0.34)
        case "ppt", "pptx", "key":
            return Color(red: 0.83, green: 0.42, blue: 0.12)
        default:
            return LoomTokens.dsInk3
        }
    }
}

private struct ReflectionSourceAnchor {
    let label: String
    let sourceID: ReflectionSource.ID
    let fileName: String?
    let pageNumber: Int?
    let precision: String
    let method: String
}

private struct ReflectionMessage: Identifiable, Codable, Equatable {
    enum Role: Codable, Equatable {
        case human
        case loom
    }

    let id: String
    var role: Role
    var eyebrow: String
    var body: String

    init(id: String = UUID().uuidString, role: Role, eyebrow: String, body: String) {
        self.id = id
        self.role = role
        self.eyebrow = eyebrow
        self.body = body
    }
}
