import SwiftUI
import AppKit

/// Sources — the primary source workbench. Shown when the user clicks
/// the sidebar's `Sources` row. Groups work into stable product lanes
/// (incoming material, read / review, draft queue) above the user's
/// source pages, with a compact status strip instead of dashboard
/// cards. The root shell owns the top body-start inset and toolbar;
/// this surface aligns to the same left reading edge as Draft.
struct LoomLibraryView: View {
    /// Public working mode masks private capture metadata (domains,
    /// timestamps) so the workbench can be shared on a call without
    /// mutating any data.
    let publicWorkingMode: Bool

    init(publicWorkingMode: Bool = false) {
        self.publicWorkingMode = publicWorkingMode
    }

    @State private var roots: [ContentRoot] = []
    @State private var captures: [CaptureEntry] = []
    @State private var pendingDelete: CaptureEntry? = nil
    @State private var deleteError: String? = nil

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DSSpace.lg.value) {
                Text("Sources")
                    .font(.system(size: 22, weight: .medium, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                metricsStrip
                if roots.isEmpty && captures.isEmpty {
                    emptyState
                } else {
                    workLanes
                }
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 28)
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .background(LoomTokens.dsPaperDeep)
        .onAppear { reload() }
        .onReceive(NotificationCenter.default.publisher(for: .loomContentRootsChanged)) { _ in
            reload()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureSaved)) { _ in
            reload()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomRefreshActivePage)) { _ in
            reload()
        }
        // The root chrome's "Add files" toolbar action — Sources owns
        // the local-file importer implementation; the chrome only posts.
        .onReceive(NotificationCenter.default.publisher(for: .loomSourcesAddFiles)) { _ in
            pickFilesForIngestion()
        }
        .alert(
            "Delete this capture?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            presenting: pendingDelete
        ) { entry in
            Button("Delete", role: .destructive) {
                deleteCapture(entry)
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { entry in
            Text("\(entry.title.isEmpty ? "(untitled)" : entry.title) — rewrites \(entry.fileURL.lastPathComponent) to remove this entry. The Loom.md keeps everything else.")
        }
        .alert(
            "Couldn't delete capture",
            isPresented: Binding(
                get: { deleteError != nil },
                set: { if !$0 { deleteError = nil } }
            ),
            presenting: deleteError
        ) { _ in
            Button("OK", role: .cancel) { deleteError = nil }
        } message: { message in
            Text(message)
        }
    }

    // MARK: - Status strip

    /// Compact inline metrics — a status strip, not dashboard cards.
    private var metricsStrip: some View {
        HStack(alignment: .firstTextBaseline, spacing: DSSpace.lg.value) {
            SourceMetric(label: "source pages", value: "\(roots.count)")
            SourceMetric(label: "captures", value: "\(captures.count)")
            SourceMetric(label: "in draft queue", value: "\(draftQueue.count)")
            Spacer(minLength: 0)
        }
    }

    // MARK: - Work lanes

    /// Stable product lanes instead of many independent cards spread
    /// across the desktop.
    private var workLanes: some View {
        VStack(alignment: .leading, spacing: DSSpace.lg.value + 4) {
            WorkColumn(title: "Incoming material") {
                WorkGroup(title: "Recent captures") {
                    if incomingCaptures.isEmpty {
                        laneEmptyText("Nothing waiting. Add files or capture from your browser.")
                    } else {
                        ForEach(incomingCaptures.prefix(8)) { entry in
                            captureRow(entry)
                        }
                    }
                }
            }
            WorkColumn(title: "Read / review") {
                if roots.isEmpty {
                    laneEmptyText("Add a folder of sources to start reading.")
                } else {
                    ForEach(roots, id: \.id) { root in
                        rootRowButton(root)
                    }
                }
            }
            WorkColumn(title: "Draft queue") {
                if draftQueue.isEmpty {
                    laneEmptyText("Save passages while reading to queue them for Draft.")
                } else {
                    ForEach(draftQueue.prefix(8)) { entry in
                        captureRow(entry)
                    }
                }
            }
        }
    }

    private var incomingCaptures: [CaptureEntry] {
        captures.filter { $0.kind == .inbox || $0.kind == .web }
    }

    private var draftQueue: [CaptureEntry] {
        captures.filter { $0.kind == .passage }
    }

    private func laneEmptyText(_ message: String) -> some View {
        Text(message)
            .font(.system(size: 12, design: .serif))
            .italic()
            .foregroundStyle(LoomTokens.dsInk3)
    }

    @ViewBuilder
    private func captureRow(_ entry: CaptureEntry) -> some View {
        let metadata = CaptureMetadataState(entry: entry, masked: publicWorkingMode)
        CaptureActionRow(
            title: metadata.title,
            detail: metadata.detail,
            primaryAction: {
                NSWorkspace.shared.activateFileViewerSelecting([entry.fileURL])
            },
            draftAction: { sendToDraft(entry) },
            destructiveLabel: publicWorkingMode ? nil : "Delete",
            destructiveHelp: publicWorkingMode ? nil : "Delete this capture from Loom.md",
            destructiveAction: publicWorkingMode ? nil : { pendingDelete = entry }
        )
    }

    @ViewBuilder
    private func rootRowButton(_ root: ContentRoot) -> some View {
        Button {
            open(root)
        } label: {
            HStack(spacing: DSSpace.sm.value - 2) {
                Image(systemName: root.externalFolderBookmark == nil ? "doc.text" : "folder")
                    .font(.system(size: 11))
                    .foregroundStyle(LoomTokens.dsInk3)
                Text(root.displayName)
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer(minLength: 0)
            }
            .padding(.vertical, 3)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var emptyState: some View {
        VStack(alignment: .leading, spacing: DSSpace.md.value) {
            Text("No sources yet.")
                .font(.system(size: 14, design: .serif))
                .foregroundStyle(LoomTokens.dsInk2)
            Button {
                pickFilesForIngestion()
            } label: {
                Label("Add files", systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(.vertical, DSSpace.lg.value)
    }

    // MARK: - Actions

    /// Sources owns local-file intake: "Add files" opens a real
    /// local-file importer instead of a static ingestion shortcut. The
    /// picked files ride through the same `IngestionContext` handoff as
    /// drag-to-import, so both entry points share one pipeline.
    private func pickFilesForIngestion() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowsMultipleSelection = true
        panel.allowedContentTypes = nativeFileImporterContentTypes()
        panel.prompt = "Add files"
        panel.title = "Add files to Sources"
        guard panel.runModal() == .OK, !panel.urls.isEmpty else { return }
        IngestionContext.shared.pendingFileURLs = panel.urls
        NotificationCenter.default.post(name: .loomIngestFileDropped, object: nil)
        NotificationCenter.default.post(
            name: .loomShowInspectorTab,
            object: nil,
            userInfo: ["surface": "ingestion"]
        )
    }

    /// Queue a capture for Draft: attach it to the most recent draft as
    /// a source reference, the same record the Draft reference rail reads.
    private func sendToDraft(_ entry: CaptureEntry) {
        let title = entry.title.isEmpty ? "(untitled)" : entry.title
        let reference = LoomDraftReference(
            label: title,
            href: entry.fileURL.absoluteString,
            kind: "capture",
            sourceTitle: title,
            sourcePath: entry.fileURL.path,
            excerpt: entry.snippet.isEmpty ? nil : entry.snippet
        )
        do {
            _ = try LoomDraftStore().attachReference(reference)
        } catch {
            NSLog("[Loom] Sources sendToDraft failed: \(error)")
        }
    }

    private func deleteCapture(_ entry: CaptureEntry) {
        do {
            try CapturesIndex.delete(entry)
            reload()
        } catch {
            deleteError = error.localizedDescription
        }
    }

    private func open(_ root: ContentRoot) {
        guard let target = URL(string: "loom://content/\(root.id.uuidString.lowercased())") else { return }
        NotificationCenter.default.post(
            name: .loomShowFolderHome,
            object: nil,
            userInfo: ["url": target]
        )
    }

    private func reload() {
        roots = ContentRootStore.loadAll()
        captures = CapturesIndex.loadAll()
    }
}

// MARK: - Lane primitives

/// Compact inline metric for the Sources status strip — reads as a
/// strip of numbers, never a dashboard card.
private struct SourceMetric: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DSSpace.xs.value) {
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Text(label)
                .font(.system(size: 11, design: .serif))
                .foregroundStyle(LoomTokens.dsInk3)
        }
    }
}

/// One stable work lane: a smallcaps eyebrow above a product list.
/// Lists, not separate rounded cards spread across the canvas.
private struct WorkColumn<Content: View>: View {
    let title: String
    private let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpace.sm.value - 2) {
            Text(title)
                .font(.custom("EB Garamond", size: DSType.eyebrow.size).weight(.medium).smallCaps())
                .tracking(DSType.eyebrow.tracking)
                .foregroundStyle(LoomTokens.dsInk3)
            content
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }
}

/// A named sub-group inside a work lane — a quieter eyebrow over a
/// short product list, e.g. "Recent captures" inside Incoming material.
private struct WorkGroup<Content: View>: View {
    let title: String
    private let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpace.xs.value + 2) {
            Text(title)
                .font(.system(size: 11, design: .serif).smallCaps())
                .foregroundStyle(LoomTokens.dsInk3)
            content
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }
}

/// One capture row: the primary button (title + metadata, opens the
/// capture) above a stable second-row action tray. Draft and Delete
/// stay visible in the tray — destructive controls are not hidden at
/// the trailing edge of the row.
private struct CaptureActionRow: View {
    let title: String
    let detail: String
    let primaryAction: () -> Void
    let draftAction: (() -> Void)?
    let destructiveLabel: String?
    let destructiveHelp: String?
    let destructiveAction: (() -> Void)?

    /// Leading inset that keeps the action tray on the same reading
    /// edge as the row title.
    private var actionIndent: CGFloat { 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            primaryButton
            actionControls
                .padding(.leading, actionIndent)
        }
        .padding(.vertical, 3)
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }

    private var primaryButton: some View {
        Button(action: primaryAction) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .foregroundStyle(LoomTokens.dsInk1)
                    .lineLimit(1)
                if !detail.isEmpty {
                    Text(detail)
                        .font(.system(size: 11, design: .serif))
                        .foregroundStyle(LoomTokens.dsInk3)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var actionControls: some View {
        HStack(spacing: DSSpace.sm.value) {
            if let draftAction {
                Button(action: draftAction) {
                    Label("Draft", systemImage: "square.and.pencil")
                        .font(.system(size: 11, design: .serif))
                }
                .buttonStyle(.plain)
                .foregroundStyle(LoomTokens.dsInk2)
                .help("Attach this capture to the current draft")
            }
            if let destructiveLabel, let destructiveAction {
                Button(role: .destructive, action: destructiveAction) {
                    Label(destructiveLabel, systemImage: "trash")
                        .font(.system(size: 11, design: .serif))
                }
                .buttonStyle(.plain)
                .foregroundStyle(LoomTokens.dsInk2)
                .help(destructiveHelp ?? "")
            }
            Spacer(minLength: 0)
        }
    }
}

/// Derived per-row capture metadata. Public working mode masks the
/// private detail line (domain + timestamp) without touching the
/// underlying capture data.
private struct CaptureMetadataState {
    let title: String
    let detail: String

    init(entry: CaptureEntry, masked: Bool) {
        self.title = entry.title.isEmpty ? "(untitled)" : entry.title
        if masked {
            self.detail = entry.kind.label
        } else {
            var parts: [String] = [entry.kind.label]
            if !entry.domain.isEmpty { parts.append(entry.domain) }
            if !entry.eyebrow.isEmpty { parts.append(entry.eyebrow) }
            self.detail = parts.joined(separator: " · ")
        }
    }
}

extension Notification.Name {
    /// Posted by sidebar's "Sources" / library-entry click so
    /// the root shell shows `LoomLibraryView` in the main pane.
    static let loomShowLibrary = Notification.Name("loomShowLibrary")
    /// Posted by legacy cold-start affordances to begin page creation.
    /// Subscribed by LoomMinimalRootView to invoke its existing
    /// startNewPage() helper without duplicating the create-page flow.
    static let loomBeginNewPage = Notification.Name("loomBeginNewPage")
}
