import SwiftUI
import PDFKit
import QuickLookUI
import CoreImage
import Vision

/// Native viewer for a source file from the user's content root or a
/// directly imported local file.
/// Bypasses the webview entirely so PDFs (and other formats QuickLook
/// supports) render under the existing NavigationSplitView chrome —
/// sidebar stays, no Next.js routing involved.
///
/// `loomURL` is a `loom://content/<encoded path>` URL coming out of the
/// sidebar's disk-scan fallback. We resolve it to a filesystem path via
/// `LoomURLSchemeHandler.resolve`, then hand the file to PDFKit (for
/// `.pdf`) or QuickLook's `QLPreviewView` (everything else).
///
/// Onbackpress / close, the parent ContentView clears its
/// `activeSourceFileURL` state so the webview is shown again.
struct SourceFileView: View {
    let loomURL: URL?
    let directFileURL: URL?
    let onClose: () -> Void
    /// Hover-to-note: when set, the PDF surface floats a ❕ badge beside the
    /// line under the cursor; clicking it hands (pageIndex, rect, text) back
    /// so the parent can drop an anchored passage into its note. nil = off.
    var notePassageHandler: ((Int, CGRect, String, NSImage?) -> Void)? = nil
    /// Emits live PDF page state to the parent workspace. The trace rail belongs
    /// in the right column, so the source reader reports state instead of drawing
    /// navigation furniture beside the document.
    var readerPageStateHandler: ((Int, Int) -> Void)? = nil
    /// In-window reader chrome (owner 2026-07-06: "空的太多 · 去掉重复信息").
    /// The single-window reader used to stack its own header (filename + Done)
    /// ABOVE the toolbar, duplicating the global top bar and leaving a dead
    /// band. Instead the toolbar itself carries file identity + close, but ONLY
    /// in the split-reader context: `barSourceLabel` names the file at the
    /// toolbar's leading edge — and is left nil when the top bar ALREADY shows
    /// that name (so nothing is said twice); `showsReaderClose` adds a quiet ✕
    /// (Esc) at the trailing edge. Both default off, so the two standalone-window
    /// callers keep their window titlebar chrome unchanged.
    var barSourceLabel: String? = nil
    var showsReaderClose: Bool = false

    @State private var resolvedURL: URL?
    @State private var resolveError: String?
    @StateObject private var pdfHolder = PDFViewHolder()
    @State private var toast: String? = nil
    @State private var toastTask: Task<Void, Never>? = nil
    /// ⌘E note popover state.
    @State private var noteQuote: String = ""
    @State private var noteSelection: (pageIndex: Int, rect: CGRect, text: String)? = nil
    @State private var noteDraft: String = ""
    @State private var showNoteEditor: Bool = false
    @FocusState private var noteFieldFocused: Bool
    /// ⌘K ask-AI side panel state.
    @State private var askQuote: String = ""
    @State private var askSelection: (pageIndex: Int, rect: CGRect, text: String)? = nil
    @State private var askMessages: [AskMessage] = []
    @State private var askDraft: String = ""
    @State private var showAskPanel: Bool = false
    @State private var askIsThinking: Bool = false
    @State private var askError: String? = nil
    @FocusState private var askFieldFocused: Bool
    /// ⌘F in-document find bar focus.
    @FocusState private var findFieldFocused: Bool
    /// Left sidebar: page thumbnails / table of contents.
    @State private var sidebarMode: ReaderSidebar? = nil
    @State private var outline: [ReaderOutlineItem] = []
    @Environment(\.openSettings) private var openSettingsEnv

    /// Phase A2 — AI-paste capture state. ⌘⇧V parses the clipboard
    /// into turns (or freeform fallback), resolves the anchor from
    /// the current PDF selection, and opens the CaptureSheet.
    @State private var capturePayload: CapturePayload? = nil
    /// Most recently saved capture URL — surfaces a small "Captured ·
    /// Reveal · Open" capsule above the regular toast so the user can
    /// verify what landed where without leaving the PDF surface.
    @State private var lastCaptureURL: URL? = nil
    @State private var captureBannerTask: Task<Void, Never>? = nil

    // MARK: - Compile pipeline state (plans/compile-pipeline-mvp.md §5)
    /// The live/streamed compiled artifact markdown.
    @State private var compileDraft: String = ""
    /// True while a compile stream is in flight.
    @State private var isCompiling: Bool = false
    /// Set when a re-compile would overwrite hand-edited compiled output —
    /// the next Compile click confirms the replace.
    @State private var compileReplaceWarningPending: Bool = false
    /// First-compile onboarding pulse (§5.3) — once dismissed, never returns.
    @State private var compilePulseDismissed: Bool = false
    @State private var compilePulseActive: Bool = false
    /// Non-fatal eyebrow notice (source unavailable, truncation, …).
    @State private var compileContextNotice: String? = nil
    /// Banner error (rate limit, provider failure).
    @State private var compileError: String? = nil

    init(loomURL: URL, onClose: @escaping () -> Void) {
        self.loomURL = loomURL
        self.directFileURL = nil
        self.onClose = onClose
    }

    init(fileURL: URL, onClose: @escaping () -> Void) {
        self.loomURL = nil
        self.directFileURL = fileURL
        self.onClose = onClose
    }

    /// Opt into hover-to-note. Chainable so the pinned two-arg init stays
    /// intact for callers that only read.
    func onNotePassage(_ handler: @escaping (Int, CGRect, String, NSImage?) -> Void) -> SourceFileView {
        var copy = self
        copy.notePassageHandler = handler
        return copy
    }

    /// Report live page position to a parent-owned trace rail.
    func onReaderPageStateChange(_ handler: @escaping (Int, Int) -> Void) -> SourceFileView {
        var copy = self
        copy.readerPageStateHandler = handler
        return copy
    }

    /// Opt into the in-window split-reader chrome: a leading file label (nil to
    /// stay silent when the top bar already names it) and a trailing ✕ close.
    /// Chainable, like `onNotePassage`, so the standalone-window callers are
    /// untouched.
    func readerChrome(label: String?, showsClose: Bool) -> SourceFileView {
        var copy = self
        copy.barSourceLabel = label
        copy.showsReaderClose = showsClose
        return copy
    }

    struct AskMessage: Identifiable, Equatable {
        let id: UUID
        let role: Role
        let text: String
        enum Role { case user, ai }

        init(id: UUID = UUID(), role: Role, text: String) {
            self.id = id
            self.role = role
            self.text = text
        }
    }

    private var isPDF: Bool { resolvedURL?.pathExtension.lowercased() == "pdf" }

    /// Native reading controls (owner 2026-07-06): keep source navigation exposed,
    /// but fold view/scale details into one menu so the toolbar reads as a reader,
    /// not a PDF inspector.
    @ViewBuilder private var pdfToolbar: some View {
        HStack(spacing: 8) {
            // Leading file identity — the reader's ONE name (owner 2026-07-06),
            // shown only when the global top bar isn't already saying it (the
            // parent passes nil to stay silent). Capped + middle-truncated so a
            // long filename can't shove the page controls off-centre.
            if let barSourceLabel {
                Image(systemName: "doc.richtext")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                Text(barSourceLabel)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .frame(maxWidth: 200, alignment: .leading)
                    .layoutPriority(1)
                Divider().frame(height: 16)
            }
            Button { toggleSidebar() } label: { Image(systemName: "sidebar.left") }
                .help("Show pages & contents")
                .accessibilityLabel("Show pages & contents")
                .foregroundStyle(sidebarMode != nil ? AnyShapeStyle(Color.accentColor) : AnyShapeStyle(.secondary))
            Divider().frame(height: 16)
            HStack(spacing: 6) {
                Button { pdfHolder.goToFirstPage() } label: { Image(systemName: "arrow.up.to.line") }
                    .help("First page (⌘↑)").accessibilityLabel("First page").keyboardShortcut(.upArrow, modifiers: .command)
                Button { pdfHolder.goToPreviousPage() } label: { Image(systemName: "chevron.up") }
                    .help("Previous page").accessibilityLabel("Previous page")
                Text(pdfHolder.pageLabel.isEmpty ? "—" : pdfHolder.pageLabel)
                    .font(.system(size: 11.5, design: .monospaced))
                    .frame(minWidth: 52, alignment: .center)
                Button { pdfHolder.goToNextPage() } label: { Image(systemName: "chevron.down") }
                    .help("Next page").accessibilityLabel("Next page")
                Button { pdfHolder.goToLastPage() } label: { Image(systemName: "arrow.down.to.line") }
                    .help("Last page (⌘↓)").accessibilityLabel("Last page").keyboardShortcut(.downArrow, modifiers: .command)
            }
            .fixedSize()

            Spacer(minLength: 10)

            Menu {
                Text(pdfHolder.scaleLabel.isEmpty ? "Scale" : "Scale \(pdfHolder.scaleLabel)")
                Divider()
                Button {
                    pdfHolder.fitWidth()
                } label: {
                    Label("Fit Width", systemImage: "arrow.up.backward.and.arrow.down.forward")
                }
                .keyboardShortcut("9", modifiers: .command)
                Button {
                    pdfHolder.actualSize()
                } label: {
                    Label("Actual Size", systemImage: "1.magnifyingglass")
                }
                .keyboardShortcut("0", modifiers: .command)
                Divider()
                Button {
                    pdfHolder.zoomOut()
                } label: {
                    Label("Zoom Out", systemImage: "minus.magnifyingglass")
                }
                .disabled(!pdfHolder.canZoomOut)
                .keyboardShortcut("-", modifiers: .command)
                Button {
                    pdfHolder.zoomIn()
                } label: {
                    Label("Zoom In", systemImage: "plus.magnifyingglass")
                }
                .disabled(!pdfHolder.canZoomIn)
                .keyboardShortcut("+", modifiers: .command)
                Divider()
                Picker("Layout", selection: Binding(
                    get: { pdfHolder.displayModeRaw },
                    set: { pdfHolder.setDisplayMode(PDFDisplayMode(rawValue: $0) ?? .singlePageContinuous) })
                ) {
                    Text("Continuous").tag(PDFDisplayMode.singlePageContinuous.rawValue)
                    Text("Single Page").tag(PDFDisplayMode.singlePage.rawValue)
                    Text("Two Pages").tag(PDFDisplayMode.twoUpContinuous.rawValue)
                }
                .pickerStyle(.inline)
                Divider()
                Button {
                    pdfHolder.toggleNightMode()
                } label: {
                    Label(pdfHolder.isNightMode ? "Night Mode On" : "Night Mode", systemImage: pdfHolder.isNightMode ? "moon.fill" : "moon")
                }
            } label: {
                Image(systemName: "slider.horizontal.3")
            }
            .menuStyle(.borderlessButton)
            .menuIndicator(.hidden)
            .fixedSize()
            .help("View options")
            .accessibilityLabel("View options")
            .foregroundStyle(pdfHolder.isNightMode ? AnyShapeStyle(Color.accentColor) : AnyShapeStyle(.secondary))

            Button { openFind() } label: { Image(systemName: "magnifyingglass") }
                .help("Find in document (⌘F)").accessibilityLabel("Find in document").keyboardShortcut("f", modifiers: .command)
            Button { pdfHolder.toggleFullScreen() } label: { Image(systemName: "arrow.up.left.and.arrow.down.right") }
                .help("Full screen (⌃⌘F)").accessibilityLabel("Full screen").keyboardShortcut("f", modifiers: [.control, .command])

            // The reader's close (owner 2026-07-06): a quiet ✕ that reuses the
            // find bar's own close glyph — NOT a filled accent block (青芒 =
            // signal only). Replaces the deleted header's blue "Done". Esc yields
            // to the find bar first when it's open, then closes the reader.
            if showsReaderClose {
                Divider().frame(height: 16)
                Button { onClose() } label: { Image(systemName: "xmark") }
                    .help("Close reader (Esc)")
                    .accessibilityLabel("Close reader")
                    .keyboardShortcut(pdfHolder.isFindOpen ? nil : .cancelAction)
            }
        }
        .buttonStyle(.plain)
        .font(.system(size: 12.5))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 14)
        .frame(height: 34)
        .frame(maxWidth: .infinity)
    }

    /// ⌘F find bar — slides in under the toolbar. Live-searches on each
    /// keystroke, ⏎ / ⇧⏎ cycle matches, Esc closes and clears highlights.
    @ViewBuilder private var pdfFindBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 11.5)).foregroundStyle(.secondary)
            TextField("Find in document", text: $pdfHolder.findText)
                .textFieldStyle(.plain)
                .font(.system(size: 12.5))
                .focused($findFieldFocused)
                .frame(maxWidth: 280)
                .onChange(of: pdfHolder.findText) { _, new in pdfHolder.runFind(new) }
                .onSubmit { pdfHolder.findNext() }
            Text(pdfHolder.findMatchLabel)
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(.secondary)
                .frame(minWidth: 56, alignment: .leading)

            Spacer(minLength: 8)

            Button { pdfHolder.findPrevious() } label: { Image(systemName: "chevron.up") }
                .help("Previous match (⇧⏎)").disabled(pdfHolder.findMatchLabel.isEmpty || pdfHolder.findMatchLabel == "No results")
            Button { pdfHolder.findNext() } label: { Image(systemName: "chevron.down") }
                .help("Next match (⏎)").disabled(pdfHolder.findMatchLabel.isEmpty || pdfHolder.findMatchLabel == "No results")
            Button { pdfHolder.closeFind() } label: { Image(systemName: "xmark") }
                .help("Done (Esc)").keyboardShortcut(.cancelAction)
        }
        .buttonStyle(.plain)
        .font(.system(size: 12.5))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 14)
        .frame(height: 32)
        .frame(maxWidth: .infinity)
        .background(Color(nsColor: .textBackgroundColor).opacity(0.6))
    }

    private func openFind() {
        pdfHolder.openFind()
        findFieldFocused = true
    }

    private func toggleSidebar() {
        if sidebarMode == nil {
            outline = pdfHolder.outlineItems()
            sidebarMode = .pages
        } else {
            sidebarMode = nil
        }
    }

    /// Left sidebar: a Pages/Contents segmented switch over the page-thumbnail
    /// grid or the document's table of contents.
    @ViewBuilder private var readerSidebar: some View {
        VStack(spacing: 0) {
            Picker("", selection: Binding(
                get: { sidebarMode ?? .pages },
                set: { sidebarMode = $0 })
            ) {
                Text("Pages").tag(ReaderSidebar.pages)
                if pdfHolder.hasOutline { Text("Contents").tag(ReaderSidebar.contents) }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .padding(8)
            Divider()
            if sidebarMode == .contents && pdfHolder.hasOutline {
                readerOutlineList
            } else {
                LoomPDFThumbnailSidebar(holder: pdfHolder)
                    .padding(.vertical, 6)
            }
        }
        .frame(width: 194)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    @ViewBuilder private var readerOutlineList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(outline) { item in
                    Button {
                        if let dest = item.destination { pdfHolder.goToDestination(dest) }
                    } label: {
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text(item.label)
                                .font(.system(size: 11.5))
                                .lineLimit(2)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Text(item.pageLabel)
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundStyle(.tertiary)
                        }
                        .padding(.leading, CGFloat(item.depth) * 12 + 12)
                        .padding(.trailing, 10)
                        .padding(.vertical, 5)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)
        }
    }

    var body: some View {
        HStack(spacing: 0) {
            VStack(spacing: 0) {
                if isPDF {
                    pdfToolbar
                    if pdfHolder.isFindOpen {
                        Divider()
                        pdfFindBar
                    }
                    Divider()
                }
                HStack(spacing: 0) {
                    if isPDF, sidebarMode != nil, pdfHolder.hasPDF {
                        readerSidebar
                        Divider()
                    }
                    Group {
                        if let resolved = resolvedURL {
                            if resolved.pathExtension.lowercased() == "pdf" {
                                LoomPDFView(
                                    fileURL: resolved,
                                    holder: pdfHolder,
                                    onNote: startNote,
                                    onNotePassage: handleReaderPassage
                                )
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                            } else {
                                nonPDFReader(resolved)
                            }
                        } else if let resolveError {
                            VStack(spacing: 6) {
                                Text("Couldn't open this file")
                                    .font(.system(size: 13))
                                Text(resolveError)
                                    .font(.system(size: 11))
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                        } else {
                            ProgressView()
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                        }
                    }
                }
            }
            .background(Color(NSColor.windowBackgroundColor))
            .overlay(alignment: .bottom) {
                if let toast = toast {
                    Text(toast)
                        .font(.system(size: 12))
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(.regularMaterial, in: Capsule())
                        .shadow(color: .black.opacity(0.18), radius: 8, x: 0, y: 2)
                        .padding(.bottom, 32)
                        .transition(.opacity)
                }
            }
            .overlay(alignment: .bottom) {
                if let url = lastCaptureURL {
                    HStack(spacing: 10) {
                        Text("Captured · \(url.deletingLastPathComponent().lastPathComponent)")
                            .font(.system(size: 11, design: .serif))
                        Button {
                            NSWorkspace.shared.activateFileViewerSelecting([url])
                        } label: {
                            Label("Reveal", systemImage: "magnifyingglass")
                                .font(.system(size: 11, design: .serif))
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Color.accentColor)
                        Button {
                            NSWorkspace.shared.open(url)
                        } label: {
                            Label("Open", systemImage: "doc.text")
                                .font(.system(size: 11, design: .serif))
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(Color.accentColor)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(.regularMaterial, in: Capsule())
                    .shadow(color: .black.opacity(0.18), radius: 8, x: 0, y: 2)
                    .padding(.bottom, 80)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
            .overlay(alignment: .bottomTrailing) {
                if showNoteEditor {
                    noteEditorPanel
                        .padding(20)
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
            .overlay(alignment: .bottomLeading) {
                if shouldShowCompileActionPanel {
                    compileActionPanel
                        .padding(20)
                }
            }

            if showAskPanel {
                Divider()
                askAIPanel
                    .frame(width: 360)
                    .background(Color(NSColor.windowBackgroundColor))
                    .transition(.move(edge: .trailing))
            }
        }
        .sheet(isPresented: Binding<Bool>(
            get: { capturePayload != nil },
            set: { if !$0 { capturePayload = nil } }
        )) {
            CaptureSheet(payload: $capturePayload, onSaved: handleCaptureSaved)
        }
        .task(id: sourceIdentity) {
            await resolve()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomApplyPDFAnchor)) { note in
            guard let page = note.userInfo?["page"] as? Int,
                  let rectVal = note.userInfo?["rect"] as? NSValue else { return }
            let rect = rectVal.rectValue
            pdfHolder.go(toPage: page, rect: rect)
        }
        .onAppear {
            readerPageStateHandler?(pdfHolder.currentPageIndex, pdfHolder.pageCount)
        }
        .onChange(of: pdfHolder.currentPageIndex) { _, pageIndex in
            readerPageStateHandler?(pageIndex, pdfHolder.pageCount)
        }
        .onChange(of: pdfHolder.pageCount) { _, pageCount in
            readerPageStateHandler?(pdfHolder.currentPageIndex, pageCount)
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomTriggerNote)) { _ in
            startNote()
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomTriggerCaptureFromClipboard)) { _ in
            startCaptureFromClipboard()
        }
        // Filename rides up to the actual NSWindow titlebar via the
        // navigation title — replaces the old local header bar so we
        // don't double up vertical chrome (toolbar + header).
        .navigationTitle(displayName)
        .navigationSubtitle("")
    }

    // The local `header` view (filename row + divider) was removed —
    // the filename rides up to the NSWindow titlebar via
    // `.navigationTitle(displayName)`, eliminating the doubled-up
    // chrome the user flagged.

    private var displayName: String {
        if let directFileURL {
            return directFileURL.lastPathComponent
        }
        guard let loomURL else { return "Source file" }
        let path = loomURL.path
        guard let last = path.split(separator: "/").last else { return loomURL.absoluteString }
        return last.removingPercentEncoding ?? String(last)
    }

    private var sourceIdentity: URL? {
        directFileURL ?? loomURL
    }

    private func handleReaderPassage(page: Int, rect: CGRect, text: String, image: NSImage?) {
        notePassageHandler?(page, rect, text, image)
    }

    /// Non-PDF sources render through QuickLook, which has no passage capture.
    /// Extracted into its own builder so the big reader body stays inside
    /// SwiftUI's type-inference budget. Carries an honest "reading only" footer
    /// so the user isn't left wondering why capture does nothing here.
    @ViewBuilder
    private func nonPDFReader(_ resolved: URL) -> some View {
        VStack(spacing: 0) {
            LoomQuickLookView(fileURL: resolved)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            Divider()
            Text("Reading only — passage capture is available for PDF sources.")
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 7)
        }
    }

    // MARK: - Note panel (⌘E)

    @ViewBuilder
    private var noteEditorPanel: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("Note on \(displayName)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer(minLength: 8)
                if noteSelection != nil {
                    Button {
                        switchToAskAI()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "sparkle")
                                .font(.system(size: 11))
                            Text("Ask AI")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundStyle(.primary.opacity(0.8))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(
                            Capsule().fill(Color.accentColor.opacity(0.15))
                        )
                    }
                    .buttonStyle(.plain)
                    .help("Switch to AI conversation about this passage")
                }
                Button(action: cancelNote) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.tertiary)
                        .symbolRenderingMode(.hierarchical)
                }
                .buttonStyle(.plain)
            }
            if !noteQuote.isEmpty {
                Text(noteQuote)
                    .font(.system(size: 12, design: .serif))
                    .italic()
                    .foregroundStyle(.primary.opacity(0.85))
                    .lineLimit(3)
                    .padding(.leading, 10)
                    .padding(.vertical, 2)
                    .overlay(alignment: .leading) {
                        Rectangle()
                            .fill(Color.accentColor.opacity(0.5))
                            .frame(width: 2)
                    }
            }
            // TextEditor with explicit foreground + opaque text-area
            // background. `regularMaterial` outer + transparent
            // TextEditor background made the textarea render as a
            // black void in dark mode — fixed by giving the editor
            // its own opaque surface.
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color(NSColor.textBackgroundColor))
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                TextEditor(text: $noteDraft)
                    .font(.system(size: 13))
                    .foregroundStyle(.primary)
                    .focused($noteFieldFocused)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                if noteDraft.isEmpty {
                    Text("Type your thought, or press Save to keep just the quote…")
                        .font(.system(size: 12))
                        .foregroundStyle(.tertiary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 12)
                        .allowsHitTesting(false)
                }
            }
            .frame(height: 110)
            HStack(spacing: 10) {
                Spacer()
                Button("Cancel") { cancelNote() }
                    .keyboardShortcut(.cancelAction)
                Button("Save") { commitNote() }
                    .keyboardShortcut(.return, modifiers: .command)
                    .buttonStyle(.borderedProminent)
                    .disabled(noteSelection == nil
                              && noteDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .frame(width: 380)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(NSColor.windowBackgroundColor))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.secondary.opacity(0.18), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.25), radius: 16, x: 0, y: 6)
    }

    private func startNote() {
        guard let info = pdfHolder.currentSelectionInfo(), !info.text.isEmpty else {
            // Allow free-form notes when nothing is selected.
            noteSelection = nil
            noteQuote = ""
            noteDraft = ""
            showNoteEditor = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                noteFieldFocused = true
            }
            return
        }
        noteSelection = info
        noteQuote = info.text
        noteDraft = ""
        showNoteEditor = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            noteFieldFocused = true
        }
    }

    private func cancelNote() {
        showNoteEditor = false
        noteDraft = ""
        noteQuote = ""
        noteSelection = nil
    }

    private func commitNote() {
        let trimmed = noteDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        // Free-form notes (no selection) require a body. Anchored
        // notes accept an empty body — that means "just save the
        // quote", same outcome as the old Quote menu item.
        if noteSelection == nil && trimmed.isEmpty { return }
        guard let rootID = parentRootID else {
            // Docked reader (opened by fileURL — the live workbench path): there
            // is no loom://content Loom.md identity here, so the old code dead-
            // ended with "Couldn't find this file's page." Route an anchored note
            // to the SAME center-document sink the hover-❕ capture uses, so ⌘E /
            // right-click "Note this passage" actually lands instead of failing.
            if let info = noteSelection, let handler = notePassageHandler {
                handler(info.pageIndex, info.rect, info.text, nil)
                cancelNote()
                showToast(trimmed.isEmpty
                    ? "Quote noted into your document."
                    : "Quote noted — write your thought in the document.")
            } else {
                // Free-form thought with no passage can't anchor here; say so
                // honestly rather than pretend a page lookup failed.
                showToast("Select a passage to note it into your document.")
            }
            return
        }
        let target = LoomFileStore.loomMDURL(for: rootID)
        let entry: String
        if let info = noteSelection, trimmed.isEmpty {
            entry = buildQuoteEntry(info: info)
        } else {
            entry = buildNoteEntry(thought: trimmed, info: noteSelection)
        }
        do {
            try FileManager.default.createDirectory(
                at: target.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
            let updated = appendUnderNotes(entry: entry, file: displayName, to: existing)
            try updated.write(to: target, atomically: true, encoding: .utf8)
            cancelNote()
            let kind = trimmed.isEmpty ? "Quote" : "Note"
            showToast("\(kind) saved to \(parentRootName ?? "page").")
        } catch {
            showToast("Couldn't save: \(error.localizedDescription)")
        }
    }

    /// Switch from the Note popover to the existing Ask-AI side panel
    /// using the same selection. The popover dismisses without
    /// saving so we don't leave a stub note alongside the
    /// conversation.
    private func switchToAskAI() {
        // Capture the selection before we tear down the note state.
        let info = noteSelection
        cancelNote()
        guard let info = info else { return }
        askSelection = info
        askQuote = info.text
        askMessages = []
        askDraft = ""
        showAskPanel = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            askFieldFocused = true
        }
    }

    private func buildNoteEntry(thought: String, info: (pageIndex: Int, rect: CGRect, text: String)?) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let timestamp = formatter.string(from: Date())
        if let info = info {
            let pageDisplay = info.pageIndex + 1
            let quoted = Self.quoteLines(info.text)
            let anchor = anchorURL(for: info)
            return """
            *p.\(pageDisplay) · \(timestamp)*
            \(quoted)

            \(thought)

            [📍 Jump to passage](\(anchor))
            """
        } else {
            return """
            *\(timestamp)*
            \(thought)
            """
        }
    }

    // MARK: - Ask AI panel (⌘K)

    @ViewBuilder
    private var askAIPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Image(systemName: "sparkle")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.accentColor)
                Text("Ask about passage")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
                Button(action: archiveAndCloseAsk) {
                    Image(systemName: "tray.and.arrow.down")
                        .font(.system(size: 12))
                        .foregroundStyle(askMessages.isEmpty ? Color.secondary.opacity(0.4) : Color.primary.opacity(0.7))
                }
                .buttonStyle(.plain)
                .help("Save thread to page and close")
                .disabled(askMessages.isEmpty)
                Button(action: closeAsk) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.tertiary)
                        .symbolRenderingMode(.hierarchical)
                }
                .buttonStyle(.plain)
                .help("Close (discard if not saved)")
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 10)
            Divider()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if !askQuote.isEmpty {
                        Text(askQuote)
                            .font(.system(size: 12, design: .serif))
                            .italic()
                            .foregroundStyle(.primary.opacity(0.85))
                            .padding(.leading, 10)
                            .padding(.vertical, 2)
                            .overlay(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.accentColor.opacity(0.5))
                                    .frame(width: 2)
                            }
                    }
                    ForEach(askMessages) { msg in
                        askMessageRow(msg)
                    }
                    if askIsThinking {
                        HStack(spacing: 6) {
                            ProgressView().controlSize(.small)
                            Text("thinking…")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            Divider()
            VStack(alignment: .leading, spacing: 8) {
                if let askError = askError {
                    askErrorBanner(askError)
                }
                ZStack(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(NSColor.textBackgroundColor))
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                    ChatTextEditor(text: $askDraft, focused: $askFieldFocused) {
                        sendAsk()
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    if askDraft.isEmpty {
                        Text("Ask anything about the passage… ⏎ to send, ⇧⏎ for new line")
                            .font(.system(size: 12))
                            .foregroundStyle(.tertiary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 12)
                            .allowsHitTesting(false)
                    }
                }
                .frame(height: 70)
                HStack {
                    Spacer()
                    Button("Send") { sendAsk() }
                        .buttonStyle(.borderedProminent)
                        .disabled(askDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || askIsThinking)
                }
            }
            .padding(14)
        }
    }

    @ViewBuilder
    private func askErrorBanner(_ message: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 12))
                .foregroundStyle(.orange)
            VStack(alignment: .leading, spacing: 4) {
                Text(message)
                    .font(.system(size: 11))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                if message.contains("CLI binary") || message.contains("disabled") || message.contains("provider") || message.contains("Apple Intelligence") {
                    Button {
                        openSettingsEnv()
                    } label: {
                        Text("Open Settings")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Color.accentColor)
                    }
                    .buttonStyle(.plain)
                }
            }
            Spacer(minLength: 0)
            Button {
                askError = nil
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 9))
                    .foregroundStyle(.tertiary)
            }
            .buttonStyle(.plain)
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(LoomTokens.dsWarning.opacity(0.10))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(LoomTokens.dsWarning.opacity(0.3), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func askMessageRow(_ msg: AskMessage) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(msg.role == .user ? "You" : "AI")
                    .font(.system(size: 10, weight: .semibold))
                    .textCase(.uppercase)
                    .kerning(0.8)
                    .foregroundStyle(.tertiary)
                Spacer(minLength: 0)
                // Per-message "Save as note" — only on AI replies that
                // have actual content. The bridge from AI dialogue to a
                // durable, editable, anchored note. User reviews / edits
                // before commit so the saved note is theirs, not a raw
                // AI dump.
                if msg.role == .ai && !msg.text.isEmpty {
                    Button {
                        saveAIMessageAsNote(msg)
                    } label: {
                        HStack(spacing: 3) {
                            Image(systemName: "arrow.down.doc")
                                .font(.system(size: 10))
                            Text("Save as note")
                                .font(.system(size: 10, weight: .medium))
                        }
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            Capsule().fill(Color.secondary.opacity(0.10))
                        )
                    }
                    .buttonStyle(.plain)
                    .help("Pre-fill the Note popover with this AI reply + the original passage")
                }
            }
            Text(msg.text)
                .font(.system(size: 12))
                .foregroundStyle(.primary)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// Bridge from AI dialogue to a durable note. Closes the Ask
    /// panel and opens the Note popover pre-filled with the AI's
    /// reply as the body and the original passage as the quote.
    /// The user gets a chance to edit/refine before saving — keeps
    /// authorship in the user's hands (curiosity-led: AI helps draft,
    /// user owns the takeaway).
    private func saveAIMessageAsNote(_ msg: AskMessage) {
        let info = askSelection
        let quote = askQuote
        let draft = msg.text
        // Tear down the Ask panel state without writing anything.
        showAskPanel = false
        askSelection = nil
        askQuote = ""
        askMessages = []
        askDraft = ""
        askError = nil
        // Open the Note popover with the AI text as the editable body.
        noteSelection = info
        noteQuote = quote
        noteDraft = draft
        showNoteEditor = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            noteFieldFocused = true
        }
    }

    // MARK: - Capture from clipboard (Phase A2)

    /// ⌘⇧V handler. Reads clipboard, runs the AI-conversation parser,
    /// resolves the anchor (current PDF selection > containing folder
    /// > Inbox), opens the CaptureSheet pre-filled. The user reviews
    /// turns, edits, picks anchor, saves — all writes flow through
    /// `LoomFileStore`, never the source folder.
    private func startCaptureFromClipboard() {
        let selection = pdfHolder.currentSelectionInfo()
        guard let sourceIdentity else {
            showToast("Couldn't resolve an anchor for this capture.")
            return
        }
        let anchors = CaptureAnchorResolver.resolveForSourceFile(
            loomURL: sourceIdentity,
            selection: selection
        )
        guard let primary = anchors.first else {
            showToast("Couldn't resolve an anchor for this capture.")
            return
        }
        capturePayload = CapturePayload.makeFromClipboard(anchor: primary, available: anchors)
    }

    private func handleCaptureSaved(_ url: URL) {
        captureBannerTask?.cancel()
        withAnimation(.easeOut(duration: 0.18)) {
            lastCaptureURL = url
        }
        captureBannerTask = Task {
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            await MainActor.run {
                withAnimation(.easeIn(duration: 0.25)) {
                    lastCaptureURL = nil
                }
            }
        }
    }

    private func startAsk() {
        guard let info = pdfHolder.currentSelectionInfo(), !info.text.isEmpty else {
            showToast("Select text first to ask about it.")
            return
        }
        askSelection = info
        askQuote = info.text
        askMessages = []
        askDraft = ""
        showAskPanel = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            askFieldFocused = true
        }
    }

    private func sendAsk() {
        let userText = askDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !userText.isEmpty else { return }
        let userMsg = AskMessage(role: .user, text: userText)
        askMessages.append(userMsg)
        askDraft = ""
        askIsThinking = true
        askError = nil
        let quote = askQuote
        let history = askMessages
        let priorNotes = gatherPriorNotesFromPage()

        // Append an empty AI placeholder that we'll mutate as tokens
        // arrive. Streaming writes feel snappier than the old wait-
        // for-everything-then-paste behavior, especially with prior
        // notes context (which can lengthen response time).
        let placeholder = AskMessage(role: .ai, text: "")
        askMessages.append(placeholder)
        let placeholderID = placeholder.id

        Task {
            do {
                let prompt = Self.buildAskPrompt(
                    quote: quote,
                    history: history,
                    priorNotes: priorNotes
                )
                let firstResponse = try await LoomAI.sendStream(
                    prompt: prompt,
                    systemPrompt: Self.askSystemPrompt
                ) { chunk in
                    Task { @MainActor in
                        if let idx = askMessages.firstIndex(where: { $0.id == placeholderID }) {
                            askMessages[idx] = AskMessage(
                                id: placeholderID,
                                role: .ai,
                                text: askMessages[idx].text + chunk
                            )
                        }
                    }
                }
                // Output validation: small models (incl. Apple
                // Foundation) drift back to filler/restatement
                // patterns the few-shot prompt forbids. Catch it
                // and silently retry once with a reinforced prompt.
                let violations = Self.validateResponse(firstResponse, userQuestion: userText)
                if !violations.isEmpty {
                    let userLang = Self.detectAskLanguage(userText)
                    let wantsDepth = Self.detectDepthRequest(userText)
                    let langDirective: String = {
                        switch userLang {
                        case .cjk:    return "用中文回复，整段都用中文，不要英文。"
                        case .latin:  return "Reply in English."
                        case .unknown: return "Reply in the SAME language as the user's question."
                        }
                    }()
                    let depthDirective = wantsDepth
                        ? (userLang == .cjk
                            ? "用户要求拆细讲解，→ 行后必须有 4–6 句具体展开（逐符号解释、最小例子、隐含假设），不许只写一句。"
                            : "User asked for a detailed breakdown — give 4–6 sentences after the → line (define each symbol, minimal example, hidden assumption). Do NOT stop after one sentence.")
                        : "3–6 sentences total."
                    let reinforcement = """
                    Your previous reply broke these rules: \(violations.joined(separator: "; ")). \
                    Rewrite it. Start with → on the first line. The lines AFTER → must add NEW \
                    information (mechanism, concrete example, counterexample, hidden assumption, \
                    connection) — NEVER a paraphrase of the → line in different words. Cut filler. \
                    No restatement of the passage. \(langDirective) \(depthDirective)
                    """
                    let retryPrompt = prompt + "\n\nPREVIOUS ATTEMPT (bad):\n\(firstResponse)\n\n\(reinforcement)"
                    // Reset the placeholder text and stream the retry
                    // in over the bad reply.
                    await MainActor.run {
                        if let idx = askMessages.firstIndex(where: { $0.id == placeholderID }) {
                            askMessages[idx] = AskMessage(id: placeholderID, role: .ai, text: "")
                        }
                    }
                    _ = try await LoomAI.sendStream(
                        prompt: retryPrompt,
                        systemPrompt: Self.askSystemPrompt
                    ) { chunk in
                        Task { @MainActor in
                            if let idx = askMessages.firstIndex(where: { $0.id == placeholderID }) {
                                askMessages[idx] = AskMessage(
                                    id: placeholderID,
                                    role: .ai,
                                    text: askMessages[idx].text + chunk
                                )
                            }
                        }
                    }
                }
                await MainActor.run { askIsThinking = false }
            } catch {
                await MainActor.run {
                    askMessages.removeAll { $0.id == placeholderID }
                    askError = error.localizedDescription
                    askIsThinking = false
                    askDraft = userText
                }
            }
        }
    }

    /// Programmatic quality gate — checks an AI response for known
    /// filler patterns, missing template marker, restatement of the
    /// passage, and excessive length. Returns the list of violations
    /// (empty = passed). Used by `sendAsk` to auto-retry once with a
    /// reinforced prompt before showing the user — small models
    /// (Apple Foundation, light cloud models) regularly need this.
    static func validateResponse(_ response: String, userQuestion: String = "") -> [String] {
        var violations: [String] = []
        let trimmed = response.trimmingCharacters(in: .whitespacesAndNewlines)
        let lower = trimmed.lowercased()

        // 1. Template marker — every real response should start with →
        // unless it's the explicit "too brief" stop response.
        let isTooBriefResponse = lower.contains("too brief to unpack alone")
        if !trimmed.hasPrefix("→") && !isTooBriefResponse {
            violations.append("missing → template marker")
        }

        // 2. Forbidden filler phrases — explicit blocklist.
        let forbidden: [String] = [
            "this passage is about",
            "the passage suggests",
            "in this passage",
            "this passage",
            "fundamental concept",
            "comprehensive framework",
            "structured approach",
            "it is important to understand",
            "it is essential to",
            "in summary",
            "in conclusion",
            "overall,",
        ]
        let hits = forbidden.filter { lower.contains($0) }
        if !hits.isEmpty {
            violations.append("used filler phrase(s): \(hits.joined(separator: ", "))")
        }

        // 3. Length cap — over 8 sentences for a study-companion
        // reply almost certainly means padding.
        let sentenceCount = trimmed.components(separatedBy: CharacterSet(charactersIn: ".!?"))
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .count
        if sentenceCount > 8 {
            violations.append("too long (\(sentenceCount) sentences, cap is 6–8)")
        }

        // 4. Near-duplicate paragraphs — small models often paraphrase
        // the → answer line as a "second paragraph" instead of adding
        // new information (mechanism / example / counterexample). When
        // ≥70% of normalized tokens overlap, treat the second
        // paragraph as a restatement.
        let paragraphs = trimmed
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        if paragraphs.count >= 2 {
            let first = Self.normalizedTokens(paragraphs[0])
            let second = Self.normalizedTokens(paragraphs[1])
            if !first.isEmpty && !second.isEmpty {
                let shared = first.intersection(second).count
                let smaller = min(first.count, second.count)
                let overlap = Double(shared) / Double(smaller)
                if overlap >= 0.7 {
                    violations.append("second paragraph restates the → line (token overlap \(Int(overlap * 100))%)")
                }
            }
        }

        // 5. Language mismatch — when the user's question is clearly
        // CJK (or clearly Latin) and the reply is the opposite script,
        // the language-mirror rule was ignored. Most common failure on
        // small models / Apple Foundation.
        if !userQuestion.isEmpty && !isTooBriefResponse {
            let userLang = Self.detectAskLanguage(userQuestion)
            let replyLang = Self.detectAskLanguage(trimmed)
            if userLang != .unknown && replyLang != .unknown && userLang != replyLang {
                violations.append("language mismatch (user wrote \(userLang.rawValue), reply is \(replyLang.rawValue))")
            }
        }

        // 6. Insufficient unpacking — when the user explicitly asked
        // for a breakdown ("拆", "详细", "unpack", "explain", etc.)
        // but the reply is just the → line plus little to nothing,
        // the model refused the depth request. Floor: 3 sentences
        // total when depth was requested.
        if !userQuestion.isEmpty &&
           Self.detectDepthRequest(userQuestion) &&
           !isTooBriefResponse &&
           sentenceCount < 3 {
            violations.append("user asked for a breakdown but reply has only \(sentenceCount) sentence(s) — needs ≥3")
        }
        return violations
    }

    /// Lowercased, punctuation-stripped, arrow-stripped token set used
    /// by the duplicate-paragraph check. Treats CJK characters as
    /// individual tokens so the check works for Chinese replies too.
    static func normalizedTokens(_ text: String) -> Set<String> {
        let stripped = text
            .replacingOccurrences(of: "→", with: " ")
            .lowercased()
        let scalars = stripped.unicodeScalars.map { scalar -> Character in
            if CharacterSet.alphanumerics.contains(scalar) { return Character(scalar) }
            // Keep CJK ideographs as-is; collapse everything else to space.
            if (0x4E00...0x9FFF).contains(scalar.value) ||
               (0x3400...0x4DBF).contains(scalar.value) ||
               (0x3040...0x30FF).contains(scalar.value) {
                return Character(scalar)
            }
            return " "
        }
        let cleaned = String(scalars)
        var tokens = Set<String>()
        for word in cleaned.split(separator: " ") {
            let w = String(word)
            if w.count <= 1 && w.allSatisfy({ $0.isASCII }) { continue }
            tokens.insert(w)
        }
        // Add per-character CJK tokens so 中文 paragraphs compare meaningfully.
        for ch in cleaned where ch.unicodeScalars.first.map({
            (0x4E00...0x9FFF).contains($0.value) ||
            (0x3400...0x4DBF).contains($0.value) ||
            (0x3040...0x30FF).contains($0.value)
        }) ?? false {
            tokens.insert(String(ch))
        }
        return tokens
    }

    private func closeAsk() {
        showAskPanel = false
        askSelection = nil
        askQuote = ""
        askMessages = []
        askDraft = ""
    }

    private func archiveAndCloseAsk() {
        guard !askMessages.isEmpty else { closeAsk(); return }
        guard let rootID = parentRootID else {
            showToast("Couldn't find this file's page.")
            return
        }
        let target = LoomFileStore.loomMDURL(for: rootID)
        let entry = buildThreadEntry(quote: askQuote, info: askSelection, messages: askMessages)
        do {
            try FileManager.default.createDirectory(
                at: target.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
            let updated = appendUnderThreads(entry: entry, file: displayName, to: existing)
            try updated.write(to: target, atomically: true, encoding: .utf8)
            showToast("Thread saved to \(parentRootName ?? "page").")
            closeAsk()
        } catch {
            showToast("Couldn't save: \(error.localizedDescription)")
        }
    }

    private func buildThreadEntry(quote: String, info: (pageIndex: Int, rect: CGRect, text: String)?, messages: [AskMessage]) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let timestamp = formatter.string(from: Date())
        let pagePart: String = {
            guard let info = info else { return "" }
            return "p.\(info.pageIndex + 1) · "
        }()
        let quoted = Self.quoteLines(quote)
        var body = """
        *\(pagePart)\(timestamp)*
        \(quoted)

        """
        if let info = info {
            body += "[📍 Jump to passage](\(anchorURL(for: info)))\n\n"
        }
        for msg in messages {
            let speaker = msg.role == .user ? "**You:**" : "**AI:**"
            body += "\(speaker) \(msg.text)\n\n"
        }
        return body.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Heuristic: classify a passage as definition / claim / equation /
    /// general, then propose a first-message prompt the user can either
    /// send as-is or rewrite. Removes cold-start friction.
    static func suggestedAskPrompt(for passage: String) -> String {
        let trimmed = passage.trimmingCharacters(in: .whitespacesAndNewlines)
        let lower = trimmed.lowercased()
        // Equation-ish: has =, lots of digits/symbols, short
        let symbolCount = trimmed.filter { "=+-*/^∑∫≤≥≈".contains($0) }.count
        if symbolCount >= 2 || (trimmed.contains("=") && trimmed.count < 120) {
            return "What does this equation say, and when would I use it?"
        }
        // Definition-ish: starts with "X is", "X means", "X refers to"
        let defPatterns = [" is ", " means ", " refers to ", " is defined as "]
        if defPatterns.contains(where: { lower.contains($0) }) && trimmed.count < 240 {
            return "Can you unpack this definition with a simple example?"
        }
        // Claim-ish: contains argumentative words
        let claimWords = ["because", "therefore", "thus", "however", "implies", "suggests", "argues", "must", "should"]
        if claimWords.contains(where: { lower.contains($0) }) {
            return "Why does the author make this claim? What's the reasoning?"
        }
        return "What's the key idea here, in plain language?"
    }

    static let askSystemPrompt = """
    You are a terse study companion. When the user shares a passage and a question, give them what they CAN'T see by re-reading the passage. The user is literate; do not summarize what they just read.

    LANGUAGE: Reply in the SAME language as the user's latest question. If they write in Chinese, reply in Chinese; if English, reply in English. Keep technical notation in its original form (e.g. 集合 X, 选择规则 c: 𝒜 → 2^X). Mirror tone, not just script. Never switch languages mid-reply.

    OUTPUT TEMPLATE (use this exact two-line shape unless the user explicitly asks for more):
    → [direct answer in ONE sentence — the actual takeaway, not framing]
    [1–3 sentences that add NEW information — mechanism, concrete example, counterexample, unstated assumption, or connection. NEVER a paraphrase of the → line. If you can only paraphrase, you have nothing to add — stop after the → line.]

    NEVER write any of these — they signal you have nothing real to say:
    - "This passage is about…" / "The passage suggests…" / "In this passage…"
    - "fundamental concept" / "comprehensive framework" / "structured approach"
    - "It is important to understand…" / "It is essential to…"
    - "In summary" / "In conclusion" / "Overall"
    - Multi-paragraph essays unless explicitly requested
    - A second paragraph that just rewords the → line in different syntax

    If the passage is too thin to add real value, reply EXACTLY (in the user's language):
    → Too brief to unpack alone. What angle do you want — definition, mechanism, example, or connection to something else?

    When PRIOR NOTES are present and actually relevant, reference them by page ("extends your note on p.3…"). Never force it.

    ──────────── EXAMPLES ────────────

    PASSAGE: "Choice involves selecting from a set of alternatives X."
    QUESTION: "What does this mean in plain language?"
    BAD: "Choice is a fundamental concept in decision-making theory. The passage suggests there is a structured way to analyze choices…"
    GOOD:
    → X is just the menu of options you have — like {coffee, tea} when ordering.
    The passage starts here because every later step (preference, utility, ranking) needs a set to act on. X is the noun the whole model is built around.

    PASSAGE: "The model assumes decision-makers are rational."
    QUESTION: "Why this assumption?"
    BAD: "Rationality is a fundamental assumption in economic theory. It is essential to understand…"
    GOOD:
    → To make the math tractable, not because it's true.
    If you allow A>B, B>C, AND C>A at once, you can't fit a utility function. "Rational" really means "consistent enough to assign each option a single number". Real humans violate this routinely — see Allais paradox, framing effects.

    PASSAGE: "The integral of f(x) from a to b equals F(b) − F(a)."
    QUESTION: "Why does this work?"
    BAD: "The fundamental theorem of calculus is a comprehensive framework that…"
    GOOD:
    → Because adding up tiny rates of change recovers the total change.
    F is the antiderivative — the function whose slope is f. Summing f's contributions from a to b is the same as asking how much F grew, which is just F(b) − F(a). The integral doesn't care about the path; only the endpoints of F matter.

    PASSAGE: "A basic model of choice considers a set of alternatives X, a collection of nonempty subsets 𝒜 of X, and a choice rule c: 𝒜 → 2^X such that c(A) ⊆ A for all A ∈ 𝒜."
    QUESTION: "解释"
    BAD: "→ A basic model of choice involves a set of alternatives X, a collection of nonempty subsets A of X, and a choice rule c. A basic model of choice involves a set of alternatives X, a collection of nonempty subsets A of X, and a choice rule c."
    GOOD:
    → 选出来的东西必须本来就在菜单上 —— c(A) ⊆ A 是把抽象函数 c 钉死在现实约束上的那条线。
    X 是所有备选项的全集；𝒜 是"会出现的菜单组合"（不是 X 的全部子集，因为有的组合在现实里不会发生）；c 给每个菜单选出一个非空子集，⊆ 保证不会凭空选出菜单外的东西。后面所有理性公理（WARP、传递性等）都建立在这个最低限度的"封闭性"之上。

    ──────────────────────────────

    Now respond to the user's question, following the template exactly. Never invent facts beyond the passage or the prior notes.
    """

    /// Coarse script-family detector for the language-mirror rule.
    /// `.cjk` covers Chinese/Japanese/Korean Han/Kana glyphs; `.latin`
    /// covers ASCII-script European languages. We don't try to
    /// distinguish Simplified vs Traditional vs Japanese — the model
    /// handles that from the actual characters in the user's question.
    enum AskLanguage: String {
        case cjk
        case latin
        case unknown
    }
    static func detectAskLanguage(_ text: String) -> AskLanguage {
        var cjk = 0, latin = 0
        for scalar in text.unicodeScalars {
            let v = scalar.value
            if (0x4E00...0x9FFF).contains(v) ||      // CJK Unified
               (0x3400...0x4DBF).contains(v) ||      // CJK Ext A
               (0x3040...0x30FF).contains(v) ||      // Hiragana + Katakana
               (0xAC00...0xD7AF).contains(v) {       // Hangul
                cjk += 1
            } else if (UInt32(0x41)...UInt32(0x5A)).contains(v) ||
                      (UInt32(0x61)...UInt32(0x7A)).contains(v) {
                latin += 1
            }
        }
        if cjk == 0 && latin == 0 { return .unknown }
        if cjk >= max(2, latin / 2) { return .cjk }
        if latin > cjk { return .latin }
        return .unknown
    }
    /// Returns true when the user explicitly asks for a breakdown /
    /// detailed unpacking. Triggers a depth-floor in both the prompt
    /// and validator so the model can't get away with a one-liner.
    static func detectDepthRequest(_ text: String) -> Bool {
        let lower = text.lowercased()
        let cues = [
            "拆", "详细", "详解", "解释", "讲解", "讲讲", "细讲", "细说", "展开", "举例", "再具体",
            "unpack", "break down", "break it down", "in detail", "step by step", "elaborate", "walk me through", "explain in",
        ]
        return cues.contains(where: { lower.contains($0) })
    }

    static func buildAskPrompt(quote: String, history: [AskMessage], priorNotes: String? = nil) -> String {
        var s = ""
        if let priorNotes = priorNotes, !priorNotes.isEmpty {
            s += "PRIOR NOTES YOU'VE TAKEN ON THIS DOCUMENT (chronological):\n"
            s += priorNotes
            s += "\n\n---\n\n"
        }
        s += "CURRENT PASSAGE:\n\"\"\"\n\(quote)\n\"\"\"\n\n"
        s += "CONVERSATION SO FAR:\n"
        for msg in history {
            let role = msg.role == .user ? "User" : "Assistant"
            s += "\(role): \(msg.text)\n\n"
        }

        // Find the user's latest message and bake hard end-position
        // directives off it. Small models reliably ignore rules buried
        // in a long system prompt but follow the LAST instruction in
        // the user-side prompt — so language and depth go HERE, not
        // (only) in the system prompt.
        let lastUserText = history.reversed().first(where: { $0.role == .user })?.text ?? ""
        let lang = detectAskLanguage(lastUserText)
        let wantsDepth = detectDepthRequest(lastUserText)

        s += "Respond as Assistant to the latest User message.\n"
        switch lang {
        case .cjk:
            s += "\nCRITICAL: 用中文回复。整个回复必须是中文。技术符号（如 X、c(A)、𝒜、⊆）保持原样。不要用英文写句子。\n"
        case .latin:
            s += "\nCRITICAL: Reply in English. The entire reply must be in English.\n"
        case .unknown:
            break
        }
        if wantsDepth {
            switch lang {
            case .cjk:
                s += "\n用户明确要求拆细/详细讲解。→ 行后面必须给出 4–6 句具体展开：逐个解释符号的含义、给出最小例子、指出隐含假设。不要只写一句话就停。\n"
            default:
                s += "\nThe user explicitly asked for a detailed breakdown. After the → line, give 4–6 sentences: define each symbol, give a minimal concrete example, name the hidden assumption. Do NOT stop after one sentence.\n"
            }
        }
        return s
    }

    /// Read the parent root's Loom.md and extract the per-book
    /// section that holds notes for THIS PDF (matched by displayName).
    /// Returns the section's body trimmed for AI consumption — strips
    /// jump-link lines (irrelevant to LLM) and caps to the most
    /// recent N entries to stay within reasonable context budgets.
    /// Returns nil when no parent file exists or no per-book section
    /// found.
    private func gatherPriorNotesFromPage() -> String? {
        guard let parentID = parentRootID else { return nil }
        let parentMD = LoomFileStore.loomMDURL(for: parentID)
        guard let source = try? String(contentsOf: parentMD, encoding: .utf8) else { return nil }
        let lines = source.components(separatedBy: "\n")

        // Find the per-book section. Heading is `## <displayName>` or
        // `## [<displayName>](<url>)`. Match by extracted name.
        var sectionStart = -1
        for (i, line) in lines.enumerated() {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard trimmed.hasPrefix("## "), !trimmed.hasPrefix("### ") else { continue }
            let head = String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)
            let extracted: String = {
                if head.hasPrefix("["), let close = head.range(of: "](") {
                    return String(head[head.index(after: head.startIndex)..<close.lowerBound])
                }
                return head
            }()
            if extracted == displayName {
                sectionStart = i; break
            }
        }
        guard sectionStart >= 0 else { return nil }

        // Find section end (next `## ` or EOF).
        var sectionEnd = lines.count
        for i in (sectionStart + 1)..<lines.count {
            let trimmed = lines[i].trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("## ") && !trimmed.hasPrefix("### ") {
                sectionEnd = i; break
            }
        }

        // Strip jump-link lines (no value to AI), keep eyebrow + quote
        // + body. Trim leading/trailing blanks.
        let raw = Array(lines[(sectionStart + 1)..<sectionEnd])
        let cleaned = raw.filter { line in
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            return !trimmed.contains("loom://anchor") && !trimmed.hasPrefix("[📍")
        }
        var body = cleaned.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        if body.isEmpty { return nil }

        // Cap context size — a busy page can blow the model's window.
        // 8000 chars ≈ ~2000 tokens, leaves room for passage + chat.
        let cap = 8000
        if body.count > cap {
            // Keep the tail (most recent entries are most relevant).
            let startIdx = body.index(body.endIndex, offsetBy: -cap)
            body = "[…earlier notes truncated…]\n" + String(body[startIdx...])
        }
        return body
    }

    private func anchorURL(for info: (pageIndex: Int, rect: CGRect, text: String)) -> String {
        // `src` carries the full source loom:// URL so the parent can
        // navigate directly back to this PDF without name-based search.
        let src = sourceIdentity?.absoluteString ?? displayName
        let srcComponent = src
            .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? src
        let rectStr = String(
            format: "%.1f,%.1f,%.1f,%.1f",
            info.rect.minX, info.rect.minY, info.rect.width, info.rect.height
        )
        let excerpt = String(info.text.prefix(80))
        let textComponent = excerpt
            .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? excerpt
        return "loom://anchor?src=\(srcComponent)&page=\(info.pageIndex)&rect=\(rectStr)&text=\(textComponent)"
    }

    private func appendUnderThreads(entry: String, file: String, to source: String) -> String {
        Self.addEntryToBook(body: entry, file: file, sourceURL: sourceIdentity, in: source)
    }

    /// Insert `body` at the end of the `## <file>` section, healing
    /// the file structure on the way in (folds legacy `## Notes` /
    /// `## Threads` / `## Pursuits` content into per-book sections).
    /// Creates the section when missing. Notes, threads, and pursuit
    /// back-links all share this single insertion path.
    private static func addEntryToBook(
        body: String,
        file: String,
        sourceURL: URL?,
        in source: String
    ) -> String {
        let healed = restructure(source: source, sourceURL: sourceURL)
        var lines = healed.components(separatedBy: "\n")

        // Find `## <file>` (with or without an embedded link).
        var sectionStart = -1
        for (i, line) in lines.enumerated() {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard trimmed.hasPrefix("## "), !trimmed.hasPrefix("### ") else { continue }
            let head = String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)
            let extracted: String = {
                if head.hasPrefix("["), let close = head.range(of: "](") {
                    return String(head[head.index(after: head.startIndex)..<close.lowerBound])
                }
                return head
            }()
            if extracted == file {
                sectionStart = i
                break
            }
        }

        if sectionStart < 0 {
            // Create the per-file section at the end.
            if !lines.isEmpty && lines.last?.isEmpty == false { lines.append("") }
            lines.append("")
            let heading: String = {
                if let sourceURL = sourceURL {
                    return "## [\(file)](\(sourceURL.absoluteString))"
                }
                return "## \(file)"
            }()
            lines.append(heading)
            lines.append("")
            lines.append(contentsOf: body.components(separatedBy: "\n"))
            lines.append("")
            return lines.joined(separator: "\n")
        }

        // Locate end of the section (next `## ` or EOF).
        var sectionEnd = lines.count
        for i in (sectionStart + 1)..<lines.count {
            let trimmed = lines[i].trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("## ") && !trimmed.hasPrefix("### ") {
                sectionEnd = i
                break
            }
        }
        var insertAt = sectionEnd
        while insertAt > sectionStart + 1
            && lines[insertAt - 1].trimmingCharacters(in: .whitespaces).isEmpty {
            insertAt -= 1
        }
        let entryLines = body.components(separatedBy: "\n")
        lines.insert(contentsOf: [""] + entryLines + [""], at: insertAt)
        return lines.joined(separator: "\n")
    }

    /// Extract the visible filename from a `### name` or
    /// `### [name](url)` heading line. Returns nil for non-h3 lines.
    private static func extractedFileName(from line: String) -> String? {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard trimmed.hasPrefix("### ") else { return nil }
        let body = String(trimmed.dropFirst(4)).trimmingCharacters(in: .whitespaces)
        if body.hasPrefix("["), let close = body.range(of: "](") {
            let name = body[body.index(after: body.startIndex)..<close.lowerBound]
            return String(name)
        }
        return body
    }

    /// Public entry point so other surfaces (LoomFolderHomeView's
    /// reload path, future maintenance tools) can run the same heal
    /// pass on a Loom.md without going through a save.
    static func healLoomMD(_ source: String) -> String {
        restructure(source: source, sourceURL: nil)
    }

    // MARK: - Promote inline note → standalone page

    /// Promote an inline note (a slice of markdown from the parent
    /// page) into a brand new top-level page. The new page is seeded
    /// with the note's content; the inline slice in the parent is
    /// replaced with a single-line `→ <Title>` link to the new page.
    ///
    /// Returns the new page's `loom://content/<uuid>` URL on success,
    /// or nil on failure. The parent's Loom.md is rewritten on disk.
    static func promoteInlineNote(
        sliceText: String,
        title: String,
        parentMDURL: URL,
        parentMDSource: String,
        parentName: String?
    ) -> URL? {
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanTitle.isEmpty else { return nil }
        guard let newPage = ContentRootStore.addPage(displayName: cleanTitle) else { return nil }

        // Seed the new page with the note's content + a back-link to
        // the parent at top so the user knows where this thought
        // came from.
        let newPageMD = LoomFileStore.loomMDURL(for: newPage.id)
        let parentURL = "loom://content/\(parentMDURL.deletingLastPathComponent().lastPathComponent)"
        let backLink: String
        if let parentName = parentName {
            backLink = "*from [\(parentName)](\(parentURL))*"
        } else {
            backLink = "*from [parent page](\(parentURL))*"
        }
        let seed = "\(backLink)\n\n\(sliceText.trimmingCharacters(in: .whitespacesAndNewlines))\n"
        do {
            try FileManager.default.createDirectory(
                at: newPageMD.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try seed.write(to: newPageMD, atomically: true, encoding: .utf8)
        } catch {
            ContentRootStore.remove(id: newPage.id)
            return nil
        }

        // Replace the inline slice in the parent's Loom.md with a
        // one-line link.
        let subURL = "loom://content/\(newPage.id.uuidString.lowercased())"
        let replacement = "→ [\(cleanTitle)](\(subURL))"
        guard let updated = replaceSlice(
            slice: sliceText,
            with: replacement,
            in: parentMDSource
        ) else {
            // If we can't find the slice, leave the parent unchanged
            // — the new page exists either way and the user can still
            // navigate to it.
            return URL(string: subURL)
        }
        try? updated.write(to: parentMDURL, atomically: true, encoding: .utf8)
        return URL(string: subURL)
    }

    /// Find `slice` in `source` (matching by trimmed line equality so
    /// minor whitespace drift doesn't defeat the match) and replace
    /// it with `replacement`. Returns the new source on success.
    private static func replaceSlice(slice: String, with replacement: String, in source: String) -> String? {
        let sourceLines = source.components(separatedBy: "\n")
        let sliceLines = slice
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        guard !sliceLines.isEmpty else { return nil }
        let sourceTrimmed = sourceLines.map { $0.trimmingCharacters(in: .whitespaces) }
        // Find the first line of the slice; check the rest in order.
        var i = 0
        while i < sourceTrimmed.count {
            if sourceTrimmed[i] == sliceLines[0] {
                var j = 0
                var k = i
                var matched = true
                while j < sliceLines.count, k < sourceTrimmed.count {
                    if sourceTrimmed[k].isEmpty { k += 1; continue }
                    if sourceTrimmed[k] != sliceLines[j] { matched = false; break }
                    j += 1; k += 1
                }
                if matched && j == sliceLines.count {
                    var rebuilt = Array(sourceLines.prefix(i))
                    rebuilt.append(replacement)
                    rebuilt.append(contentsOf: sourceLines.suffix(from: k))
                    return rebuilt.joined(separator: "\n")
                }
            }
            i += 1
        }
        return nil
    }

    struct ParsedEntry {
        var file: String
        /// Body lines below the h3, including any pre-existing meta
        /// line (like the legacy heading split into `*p.N · ts*`).
        var body: [String]
    }

    struct ParsedSection {
        var title: String?  // nil = pre-section prelude
        var preamble: [String] = []  // non-h3 content (e.g. Pursuits list items)
        var entries: [ParsedEntry] = []
    }

    /// Read the markdown into a structured form, then re-emit it with
    /// **everything related to a single source clustered under one
    /// `## <filename>` section** — notes, AI threads, and pursuit
    /// back-links all live together. The user's mental model is
    /// "what have I done with this book?", not "what are all my notes
    /// across all books?".
    ///
    /// The Resources section (auto-folder listing) is preserved up
    /// top. Free-form notes with no source still land in a `## Notes`
    /// section.
    private static func restructure(source: String, sourceURL: URL?) -> String {
        let lines = source.components(separatedBy: "\n")
        var sections: [ParsedSection] = [ParsedSection(title: nil)]
        var currentEntry: ParsedEntry? = nil

        func flushEntry() {
            guard let e = currentEntry else { return }
            sections[sections.count - 1].entries.append(e)
            currentEntry = nil
        }

        for raw in lines {
            let trimmed = raw.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("## ") && !trimmed.hasPrefix("### ") {
                flushEntry()
                sections.append(ParsedSection(title: trimmed))
                continue
            }
            if trimmed.hasPrefix("### ") {
                flushEntry()
                let body = String(trimmed.dropFirst(4)).trimmingCharacters(in: .whitespaces)
                let file: String
                var initialBody: [String] = []
                if let parsed = parseLegacyEntryHeadingShared(body) {
                    file = parsed.file
                    initialBody.append("*p.\(parsed.page) · \(parsed.timestamp)*")
                } else if body.hasPrefix("["), let close = body.range(of: "](") {
                    file = String(body[body.index(after: body.startIndex)..<close.lowerBound])
                } else {
                    file = body
                }
                currentEntry = ParsedEntry(file: file, body: initialBody)
                continue
            }
            if currentEntry != nil {
                currentEntry!.body.append(raw)
            } else {
                sections[sections.count - 1].preamble.append(raw)
            }
        }
        flushEntry()

        // ── Categorize content ──────────────────────────────────────
        // Per-file "books": filename → ordered body lines
        var bookOrder: [String] = []
        var books: [String: [String]] = [:]

        // Auxiliary buckets
        var resourcesPreamble: [String] = []
        var freeFormNotes: [String] = []
        var prelude: [String] = []
        var unknownSections: [ParsedSection] = []

        func append(toFile file: String, lines: [String]) {
            let trimmed = trimmedTrailing(lines)
            guard !trimmed.isEmpty else { return }
            if books[file] == nil {
                books[file] = []
                bookOrder.append(file)
            }
            if !books[file]!.isEmpty { books[file]!.append("") }
            books[file]!.append(contentsOf: trimmed)
        }

        for sec in sections {
            switch sec.title {
            case nil:
                // Pre-section content. Entries here are orphans → route
                // to their book; any non-entry preamble stays as page
                // prelude.
                prelude.append(contentsOf: sec.preamble)
                for entry in sec.entries {
                    append(toFile: entry.file, lines: entry.body)
                }
            case "## Resources":
                // Folder listing. Preserved as-is at top of page.
                resourcesPreamble = sec.preamble
                for entry in sec.entries {
                    append(toFile: entry.file, lines: entry.body)
                }
            case "## Notes":
                for entry in sec.entries {
                    append(toFile: entry.file, lines: entry.body)
                }
                // Pursuit list items can end up here when a previous
                // heal mistakenly routed them to free-form. Catch them
                // and re-route to their per-book section.
                for line in sec.preamble {
                    let trimmedLine = line.trimmingCharacters(in: .whitespaces)
                    if let (file, normalized) = parsePursuitLine(trimmedLine) {
                        append(toFile: file, lines: [normalized])
                    } else {
                        freeFormNotes.append(line)
                    }
                }
            case "## Threads":
                for entry in sec.entries {
                    append(toFile: entry.file, lines: entry.body)
                }
                freeFormNotes.append(contentsOf: sec.preamble)
            case "## Pursuits":
                // Pursuits are list lines like
                //   `- [→ title](sub-url)  ·  filename.pdf p3`
                // Route each to the book named in the metadata tail.
                for line in sec.preamble {
                    let trimmedLine = line.trimmingCharacters(in: .whitespaces)
                    if let (file, normalized) = parsePursuitLine(trimmedLine) {
                        append(toFile: file, lines: [normalized])
                    } else if !trimmedLine.isEmpty {
                        // Preserve unrecognized lines as free-form
                        freeFormNotes.append(line)
                    }
                }
                for entry in sec.entries {
                    append(toFile: entry.file, lines: entry.body)
                }
            default:
                // Unknown user-authored section — preserve verbatim.
                unknownSections.append(sec)
            }
        }

        // Single-book pages: there's no ambiguity, so fold any
        // free-form Notes content into that book's section. The
        // user's mental model on a one-book page is "everything I've
        // done with this thing", not "this thing + a separate Notes
        // bucket".
        if bookOrder.count == 1 {
            let onlyBook = bookOrder[0]
            let trimmedFreeForm = trimmedTrailing(freeFormNotes)
            if !trimmedFreeForm.isEmpty, var bookBody = books[onlyBook] {
                if !bookBody.isEmpty { bookBody.append("") }
                bookBody.append(contentsOf: trimmedFreeForm)
                books[onlyBook] = bookBody
                freeFormNotes = []
            }
        }

        // ── Re-emit ────────────────────────────────────────────────
        var out: [String] = []
        for line in trimmedTrailing(prelude) { out.append(line) }

        if !resourcesPreamble.isEmpty {
            if !out.isEmpty && out.last?.isEmpty == false { out.append("") }
            out.append("## Resources")
            out.append("")
            for line in trimmedTrailing(resourcesPreamble) { out.append(line) }
        }

        for file in bookOrder {
            guard let body = books[file], !body.isEmpty else { continue }
            if !out.isEmpty && out.last?.isEmpty == false { out.append("") }
            out.append("")
            // Heading is a clickable link when this is the file the
            // user is currently saving from (we know its source URL).
            let heading: String = {
                if let sourceURL = sourceURL,
                   matchesFile(sourceURL: sourceURL, file: file) {
                    return "## [\(file)](\(sourceURL.absoluteString))"
                }
                return "## \(file)"
            }()
            out.append(heading)
            out.append("")
            for line in trimmedTrailing(body) { out.append(line) }
        }

        let trimmedFreeForm = trimmedTrailing(freeFormNotes)
        if !trimmedFreeForm.isEmpty {
            if !out.isEmpty && out.last?.isEmpty == false { out.append("") }
            out.append("")
            out.append("## Notes")
            out.append("")
            for line in trimmedFreeForm { out.append(line) }
        }

        for sec in unknownSections {
            if !out.isEmpty && out.last?.isEmpty == false { out.append("") }
            out.append("")
            if let title = sec.title { out.append(title); out.append("") }
            for line in trimmedTrailing(sec.preamble) { out.append(line) }
            for entry in sec.entries {
                out.append("### \(entry.file)")
                out.append("")
                for line in trimmedTrailing(entry.body) { out.append(line) }
                out.append("")
            }
        }
        return out.joined(separator: "\n")
    }

    /// Parse a Pursuits list item into (file, normalized line).
    /// Accepts the new format `- [→ title](url)  ·  filename.pdf p3`
    /// and the legacy long-tail format
    /// `- [→ title](url) — re: "..." · filename.pdf p3 · timestamp`.
    /// Returns nil if no filename can be extracted.
    private static func parsePursuitLine(_ line: String) -> (file: String, normalized: String)? {
        guard line.hasPrefix("- [→") || line.hasPrefix("- [\u{2192}") else { return nil }
        // Drop the long tail after ` — `, if any (legacy format).
        var head = line
        if let dash = head.range(of: " — ") {
            head = String(head[..<dash.lowerBound])
        }
        // Body after the link. Look for the metadata `· filename · ...`.
        // Find the substring "  ·  " or "·" to extract metadata.
        let separator = "  ·  "
        var fileName: String? = nil
        if let sep = line.range(of: separator) {
            // Tail like "Applied... p3" — split on " p" to drop page
            let tail = String(line[sep.upperBound...])
            if let pageMarker = tail.range(of: " p", options: .backwards) {
                fileName = String(tail[..<pageMarker.lowerBound]).trimmingCharacters(in: .whitespaces)
            } else {
                fileName = tail.trimmingCharacters(in: .whitespaces)
            }
        }
        guard let file = fileName, !file.isEmpty else { return nil }
        // Render as `→ [title](url)` only — file is implicit because
        // we're inside the per-file section.
        let normalizedHead: String = {
            // head currently `- [→ title](url)`. Drop leading `- ` to
            // make it a plain paragraph inside the book section.
            let dropped = head.hasPrefix("- ") ? String(head.dropFirst(2)) : head
            return dropped
        }()
        return (file, normalizedHead)
    }

    private static func matchesFile(sourceURL: URL, file: String) -> Bool {
        let last = sourceURL.lastPathComponent
        if last == file { return true }
        if let decoded = last.removingPercentEncoding, decoded == file { return true }
        return false
    }

    private static func trimmedTrailing(_ lines: [String]) -> [String] {
        var l = lines
        while let last = l.last, last.trimmingCharacters(in: .whitespaces).isEmpty {
            l.removeLast()
        }
        // Also trim leading blanks for cleanliness
        while let first = l.first, first.trimmingCharacters(in: .whitespaces).isEmpty {
            l.removeFirst()
        }
        return l
    }

    /// Shared with the renderer; same logic as `parseLegacyEntryHeading`
    /// in `LoomMarkdownView`. Kept private here for the save path.
    private static func parseLegacyEntryHeadingShared(_ text: String) -> (file: String, page: Int, timestamp: String)? {
        guard let pageMarker = text.range(of: ", page ") else { return nil }
        let file = String(text[..<pageMarker.lowerBound])
        let rest = text[pageMarker.upperBound...]
        guard let dash = rest.range(of: " — ") else { return nil }
        let pageStr = String(rest[..<dash.lowerBound])
        guard let page = Int(pageStr) else { return nil }
        let timestamp = String(rest[dash.upperBound...])
        return (file, page, timestamp)
    }

    // MARK: - Selection actions (right-click menu)

    /// Translation deliberately omitted: macOS already provides a
    /// "Translate…" item in the system right-click menu on any
    /// selected text via Services. Building our own would just
    /// duplicate it.

    // MARK: - Compile pipeline (plans/compile-pipeline-mvp.md)
    //
    // Compile reads the user's scratch (the prose region of this source's
    // `## <file>` section), bounds the source/notes context, streams a
    // typeset artifact from the configured provider through
    // `LoomAI.sendStream`, and writes it back as a `### Compiled · …`
    // subsection scoped to THIS source. The preview parser consumes reveal
    // markers and surfaces unsupported-claim / contradiction annotations
    // inline (no popups), per §5.5.

    /// Compile action panel: the Compile button + first-compile pulse +
    /// streamed preview + context/error banners. Anchored bottom-left of
    /// the source body.
    private var shouldShowCompileActionPanel: Bool {
        compileError != nil
            || compileContextNotice != nil
            || !compileDraft.isEmpty
            || isCompiling
            || compilePulseActive
            || hasCompilableScratch
    }

    private var compileActionPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let compileError {
                compileErrorBanner
                    .help(compileError)
            }
            if compileContextNotice != nil {
                compileContextNoticeBanner
            }
            if !compileDraft.isEmpty {
                compilePreviewSummary
            }
            HStack(spacing: 8) {
                Button("Compile") { startCompile() }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.accentColor)
                    .disabled(!hasCompilableScratch || isCompiling)
                    .help(hasCompilableScratch
                          ? "Compile your scratch into a typeset artifact"
                          : "Write a few thoughts, then compile.")
                if compilePulseActive {
                    compileFirstPulseDot
                }
            }
        }
        .frame(maxWidth: 360, alignment: .leading)
        .onAppear { refreshFirstCompilePulse() }
    }

    /// Re-evaluate whether the first-compile onboarding pulse should show
    /// (§5.3): ≥50 words written, no compiled section yet, never dismissed.
    private func refreshFirstCompilePulse() {
        guard let rootID = parentRootID else { return }
        let target = LoomFileStore.loomMDURL(for: rootID)
        let source = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
        let scratch = SourceFileView.scratchForSource(file: displayName, in: source)
        let hasCompiled = SourceFileView.hasCompiledSection(file: displayName, in: source)
        compilePulseActive = SourceFileView.shouldShowFirstCompilePulse(
            scratch: scratch,
            hasCompiledSection: hasCompiled,
            pulseDismissed: compilePulseDismissed
        )
    }

    /// Rendered preview of the streamed/compiled artifact: a plain-markdown
    /// render plus any unsupported/contradiction annotations the parser
    /// extracted.
    private var compilePreviewSummary: some View {
        let artifact = SourceFileView.compilePreviewArtifact(markdown: compileDraft)
        return VStack(alignment: .leading, spacing: 4) {
            if let notice = artifact.notice {
                Text(notice)
                    .font(LoomTokens.sans(size: 10))
                    .foregroundStyle(LoomTokens.dsInk3)
            }
            Text(artifact.body)
                .font(LoomTokens.serif(size: 12))
                .foregroundStyle(LoomTokens.dsInk1)
                .lineLimit(8)
                .textSelection(.enabled)
            ForEach(artifact.annotations, id: \.self) { note in
                Text(note)
                    .font(LoomTokens.sans(size: 10))
                    .foregroundStyle(LoomTokens.dsWarning)
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(LoomTokens.dsPaper)
        )
    }

    /// Rate-limit / provider-failure banner near the button (§5.5).
    private var compileErrorBanner: some View {
        Text(compileError ?? "")
            .font(LoomTokens.sans(size: 11))
            .foregroundStyle(LoomTokens.dsWarning)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(LoomTokens.dsWarning.opacity(0.10))
            )
    }

    /// Non-fatal eyebrow notice (source unavailable, truncation).
    private var compileContextNoticeBanner: some View {
        Text(compileContextNotice ?? "")
            .font(LoomTokens.sans(size: 10))
            .foregroundStyle(LoomTokens.dsInk3)
    }

    /// The single quiet pulsing dot (§5.3) — the only attention-grab in
    /// Loom, shown once before the user's first compile.
    private var compileFirstPulseDot: some View {
        Circle()
            .fill(LoomTokens.dsThread)
            .frame(width: 6, height: 6)
            .opacity(compilePulseActive ? 0.35 : 1.0)
            .animation(
                .easeInOut(duration: 0.9).repeatForever(autoreverses: true),
                value: compilePulseActive
            )
    }

    /// True when the scratch region has enough content to compile (§5.1:
    /// ≥30 chars).
    private var hasCompilableScratch: Bool {
        compileScratchText().count >= 30
    }

    /// Read the user's scratch (prose above the first `### subsection`) out
    /// of this source's `## <file>` section in Loom.md.
    private func compileScratchText() -> String {
        guard let rootID = parentRootID else { return "" }
        let target = LoomFileStore.loomMDURL(for: rootID)
        let source = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
        return SourceFileView.scratchForSource(file: displayName, in: source)
    }

    /// Drive a compile: read scratch, bound context, stream through
    /// `LoomAI.sendStream`, and write the artifact back per-source.
    private func startCompile() {
        guard !isCompiling else { return }
        compileError = nil
        compileContextNotice = nil

        let scratch = compileScratchText()
        guard scratch.count >= 30 else {
            showToast("Write a few thoughts, then compile.")
            return
        }
        guard let rootID = parentRootID else {
            showToast("Couldn't find this file's page.")
            return
        }

        // Replace-warning gate (§5.4): if a compiled section already exists
        // (which may carry hand edits), the first click warns; the next
        // click proceeds.
        let target = LoomFileStore.loomMDURL(for: rootID)
        let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
        if SourceFileView.hasCompiledSection(file: displayName, in: existing)
            && !compileReplaceWarningPending {
            showToast("Edits to the compiled section will be replaced. Compile anyway?")
            compileReplaceWarningPending = true
            return
        }
        compileReplaceWarningPending = false

        // Mark the first-compile pulse as dismissed once compile runs.
        compilePulseActive = false
        compilePulseDismissed = true

        let sourceExcerpt = compileSourceExcerpt()
        compileContextNotice = SourceFileView.compileSourceNotice(sourceExcerpt: sourceExcerpt)
        let priorNotes = gatherPriorNotesFromPage()
        let askHistory = SourceFileView.archivedAskHistory(file: displayName, in: existing)

        isCompiling = true
        compileDraft = ""

        Task {
            do {
                var compileStreamDraft = ""
                _ = try await LoomAI.sendStream(
                    prompt: LoomCompilePipeline.buildPrompt(
                        scratch: scratch,
                        sourceExcerpt: sourceExcerpt,
                        priorNotes: priorNotes,
                        askHistory: askHistory
                    ),
                    systemPrompt: LoomCompilePipeline.systemPrompt
                ) { chunk in
                    compileStreamDraft += chunk
                    Task { @MainActor in
                        compileDraft += chunk
                    }
                }
                await MainActor.run {
                    writeCompiledArtifact(
                        compileStreamDraft,
                        rootID: rootID,
                        partial: false
                    )
                    isCompiling = false
                }
            } catch {
                await MainActor.run {
                    // Save whatever streamed so far as a partial section so
                    // the user doesn't lose the output (§5.5).
                    if !compileDraft.isEmpty {
                        writeCompiledArtifact(compileDraft, rootID: rootID, partial: true)
                        showToast("Compile interrupted; partial output saved.")
                    }
                    compileError = SourceFileView.compileErrorMessage(error)
                    isCompiling = false
                }
            }
        }
    }

    /// Write the compiled artifact into this source's `## <file>` section,
    /// replacing any existing `### Compiled · …` subsection.
    private func writeCompiledArtifact(_ artifact: String, rootID: UUID, partial: Bool) {
        let target = LoomFileStore.loomMDURL(for: rootID)
        do {
            try FileManager.default.createDirectory(
                at: target.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let existing = (try? String(contentsOf: target, encoding: .utf8)) ?? ""
            let updated = SourceFileView.upsertCompiledSection(
                artifact: artifact,
                file: displayName,
                sourceURL: sourceIdentity,
                in: existing,
                partial: partial,
                now: Date()
            )
            try updated.write(to: target, atomically: true, encoding: .utf8)
            if !partial {
                showToast("Compiled to \(parentRootName ?? "page").")
            }
        } catch {
            showToast("Couldn't save: \(error.localizedDescription)")
        }
    }

    /// Excerpt of the source file for the compile envelope, or nil when the
    /// source can't be read (drives the "compiled from notes only" eyebrow).
    private func compileSourceExcerpt() -> String? {
        guard let resolved = resolvedURL else { return nil }
        if resolved.pathExtension.lowercased() == "pdf" {
            return (try? PDFExtraction.extract(url: resolved, maxChars: 6000))?.text
        }
        return try? String(contentsOf: resolved, encoding: .utf8)
    }

    // MARK: - Compile static helpers (pure; unit-tested in LoomDraftStoreTests)

    /// First-compile onboarding gate (§5.3): the pulse appears once the
    /// user has written ≥50 words in scratch but has never compiled.
    static func shouldShowFirstCompilePulse(
        scratch: String,
        hasCompiledSection: Bool,
        pulseDismissed: Bool
    ) -> Bool {
        if pulseDismissed || hasCompiledSection { return false }
        let words = scratch.split(whereSeparator: { $0 == " " || $0 == "\n" }).count
        return words >= 50
    }

    /// Source-unavailable eyebrow (§5.5): present only when the excerpt is
    /// missing. When a source excerpt exists, no notice.
    static func compileSourceNotice(sourceExcerpt: String?) -> String? {
        guard sourceExcerpt == nil else { return nil }
        return "Source file unavailable; compiled from notes only."
    }

    /// Normalize a thrown compile error into user-facing copy (§5.5):
    /// rate-limit gets the "try a different provider" banner; provider
    /// setup / configuration errors are passed through verbatim.
    static func compileErrorMessage(_ error: Error) -> String {
        let raw = (error as? LoomAI.Failure)?.errorDescription
            ?? error.localizedDescription
        let lower = raw.lowercased()
        if lower.contains("rate") || lower.contains("429") || lower.contains("quota") {
            return "AI provider rate-limited. Try a different provider in Settings, or wait."
        }
        return raw
    }

    /// True when this source's `## <file>` section already contains a
    /// `### Compiled · …` subsection (scoped — a compiled section under a
    /// DIFFERENT source must not count).
    static func hasCompiledSection(file: String, in source: String) -> Bool {
        let section = sectionLines(file: file, in: source)
        return section.contains { line in
            line.trimmingCharacters(in: .whitespaces).hasPrefix("### Compiled ·")
        }
    }

    /// Insert or replace the `### Compiled · …` subsection inside this
    /// source's `## <file>` section. Partial saves get a `(partial)` suffix.
    static func upsertCompiledSection(
        artifact: String,
        file: String,
        sourceURL: URL?,
        in source: String,
        partial: Bool,
        now: Date
    ) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let stamp = formatter.string(from: now)
        let heading = partial
            ? "### Compiled · \(stamp) (partial)"
            : "### Compiled · \(stamp)"
        let block = heading + "\n\n" + artifact.trimmingCharacters(in: .whitespacesAndNewlines)

        // Strip any existing compiled subsection scoped to this source,
        // then append the fresh one via the shared per-book inserter.
        let stripped = removingCompiledSection(file: file, in: source)
        return addEntryToBook(
            body: block,
            file: file,
            sourceURL: sourceURL,
            in: stripped
        )
    }

    /// Remove the `### Compiled · …` subsection (and its body up to the next
    /// `###`/`##`) from this source's section only.
    private static func removingCompiledSection(file: String, in source: String) -> String {
        var lines = source.components(separatedBy: "\n")
        guard let range = sectionRange(file: file, in: lines) else { return source }
        var compiledStart = -1
        var compiledEnd = range.upperBound
        for i in range {
            let trimmed = lines[i].trimmingCharacters(in: .whitespaces)
            if compiledStart < 0 {
                if trimmed.hasPrefix("### Compiled ·") { compiledStart = i }
            } else if trimmed.hasPrefix("### ") || trimmed.hasPrefix("## ") {
                compiledEnd = i
                break
            }
        }
        guard compiledStart >= 0 else { return source }
        lines.removeSubrange(compiledStart..<compiledEnd)
        return lines.joined(separator: "\n")
    }

    /// Lines inside the `## <file>` section (excluding the heading line).
    private static func sectionLines(file: String, in source: String) -> [String] {
        let lines = source.components(separatedBy: "\n")
        guard let range = sectionRange(file: file, in: lines) else { return [] }
        return Array(lines[range])
    }

    /// Half-open index range of the body of the `## <file>` section.
    private static func sectionRange(file: String, in lines: [String]) -> Range<Int>? {
        var start = -1
        for (i, line) in lines.enumerated() {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard trimmed.hasPrefix("## "), !trimmed.hasPrefix("### ") else { continue }
            let head = String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)
            let extracted: String = {
                if head.hasPrefix("["), let close = head.range(of: "](") {
                    return String(head[head.index(after: head.startIndex)..<close.lowerBound])
                }
                return head
            }()
            if extracted == file { start = i; break }
        }
        guard start >= 0 else { return nil }
        var end = lines.count
        for i in (start + 1)..<lines.count {
            let trimmed = lines[i].trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("## ") && !trimmed.hasPrefix("### ") { end = i; break }
        }
        return (start + 1)..<end
    }

    /// Extract the scratch prose for a source: everything in the `## <file>`
    /// section before the first `### subsection`.
    static func scratchForSource(file: String, in source: String) -> String {
        let section = sectionLines(file: file, in: source)
        var scratch: [String] = []
        for line in section {
            if line.trimmingCharacters(in: .whitespaces).hasPrefix("### ") { break }
            scratch.append(line)
        }
        return scratch.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Pull archived Ask AI conversations out of this source's section so
    /// the compile envelope can reference them (bounded later in the prompt).
    static func archivedAskHistory(file: String, in source: String) -> [String] {
        let section = sectionLines(file: file, in: source)
        var blocks: [String] = []
        var current: [String] = []
        var inAsk = false
        for line in section {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("### ") {
                if inAsk, !current.isEmpty {
                    blocks.append(current.joined(separator: "\n"))
                }
                current = []
                inAsk = trimmed.localizedCaseInsensitiveContains("ask")
                    || trimmed.localizedCaseInsensitiveContains("thread")
                continue
            }
            if inAsk { current.append(line) }
        }
        if inAsk, !current.isEmpty { blocks.append(current.joined(separator: "\n")) }
        return blocks
    }

    // MARK: - Compile preview parsing

    /// A parsed compile preview: cleaned plain-markdown body plus the count
    /// + text of unsupported-claim and contradiction annotations, and an
    /// optional eyebrow notice for malformed structured output.
    struct CompilePreviewArtifact: Equatable {
        let body: String
        let notice: String?
        let unsupportedCount: Int
        let contradictionCount: Int
        let annotations: [String]
    }

    /// Parse streamed compile markdown into a `CompilePreviewArtifact`:
    /// consume `[term:…]` reveal markers, lift `(unsupported)` and
    /// `[user noted both …]` markers into inline annotations, and fall back
    /// to a plain-markdown render when the structured output is malformed.
    static func compilePreviewArtifact(markdown: String) -> CompilePreviewArtifact {
        var annotations: [String] = []
        var unsupportedCount = 0
        var contradictionCount = 0

        // Contradiction markers: `[user noted both X and Z]`.
        let contradictionPattern = #"\[user noted both[^\]]*\]"#
        if let regex = try? NSRegularExpression(pattern: contradictionPattern, options: [.caseInsensitive]) {
            let ns = markdown as NSString
            let matches = regex.matches(in: markdown, range: NSRange(location: 0, length: ns.length))
            contradictionCount = matches.count
            for match in matches {
                let body = compilePreviewContradictionAnnotationBody(ns.substring(with: match.range))
                annotations.append("Contradictory thinking: \(body)")
            }
        }

        // Unsupported-claim markers: `(unsupported)`.
        let ns = markdown as NSString
        if let regex = try? NSRegularExpression(pattern: #"\(unsupported\)"#, options: [.caseInsensitive]) {
            unsupportedCount = regex.numberOfMatches(in: markdown, range: NSRange(location: 0, length: ns.length))
            for _ in 0..<unsupportedCount {
                annotations.append("Unsupported claim flagged in this artifact.")
            }
        }

        // Malformed structured output → plain-markdown fallback eyebrow.
        let notice = isMalformedStructuredOutput(markdown)
            ? "Output rendered without typesetting."
            : nil

        // Clean the body for a plain-markdown render: consume reveal markers
        // and strip markdown syntax to readable text.
        var body = consumeRevealMarkers(markdown)
        body = compilePreviewCleanMarkdownCodeFenceMarker(body)
        body = compilePreviewCleanInlineCode(body)
        body = compilePreviewCleanMarkdownLinks(body)
        body = compilePreviewCleanMarkdownEmphasis(body)
        body = compilePreviewCleanMarkdownListMarker(body)
        body = compilePreviewCleanMarkdownBlockquoteMarker(body)
        body = body.trimmingCharacters(in: .whitespacesAndNewlines)

        return CompilePreviewArtifact(
            body: body,
            notice: notice,
            unsupportedCount: unsupportedCount,
            contradictionCount: contradictionCount,
            annotations: annotations
        )
    }

    /// Strip the `[user noted both …]` wrapper down to the inner text.
    static func compilePreviewContradictionAnnotationBody(_ marker: String) -> String {
        var body = marker
        if body.hasPrefix("[") { body.removeFirst() }
        if body.hasSuffix("]") { body.removeLast() }
        if body.lowercased().hasPrefix("user noted both") {
            body = String(body.dropFirst("user noted both".count))
        }
        return body.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Consume `[term: explanation]` reveal markers — they don't appear in
    /// the streamed preview text (§5.2). Keeps the term, drops the marker.
    private static func consumeRevealMarkers(_ markdown: String) -> String {
        let pattern = #"\[term:\s*([^\]]*)\]"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return markdown }
        let ns = markdown as NSString
        let result = NSMutableString(string: markdown)
        let matches = regex.matches(in: markdown, range: NSRange(location: 0, length: ns.length)).reversed()
        for match in matches {
            let inner = match.numberOfRanges > 1
                ? ns.substring(with: match.range(at: 1))
                : ""
            let term = inner.split(separator: "|").first.map(String.init)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            result.replaceCharacters(in: match.range, with: term)
        }
        return String(result)
    }

    /// Detect malformed structured output: e.g. an unclosed math block or
    /// an unterminated frame fence. Triggers the plain-markdown fallback.
    private static func isMalformedStructuredOutput(_ markdown: String) -> Bool {
        let dollarRuns = markdown.components(separatedBy: "$$").count - 1
        if dollarRuns % 2 != 0 { return true }
        let fenceCount = markdown.components(separatedBy: "```").count - 1
        if fenceCount % 2 != 0 { return true }
        return false
    }

    /// Replace inline `` `code` `` with its inner text.
    static func compilePreviewCleanInlineCode(_ text: String) -> String {
        replacingRegex(text, pattern: "`([^`]*)`", template: "$1")
    }

    /// Replace `[label](href)` markdown links with the label.
    static func compilePreviewCleanMarkdownLinks(_ text: String) -> String {
        replacingRegex(text, pattern: #"\[([^\]]*)\]\(([^)]*)\)"#, template: "$1")
    }

    /// Strip `**bold**` / `*italic*` / `_emphasis_` markers.
    static func compilePreviewCleanMarkdownEmphasis(_ text: String) -> String {
        var out = replacingRegex(text, pattern: #"\*\*([^*]*)\*\*"#, template: "$1")
        out = replacingRegex(out, pattern: #"\*([^*]*)\*"#, template: "$1")
        out = replacingRegex(out, pattern: #"_([^_]*)_"#, template: "$1")
        return out
    }

    /// Strip leading list markers (`- `, `* `, `1. `).
    static func compilePreviewCleanMarkdownListMarker(_ text: String) -> String {
        replacingRegex(text, pattern: #"(?m)^\s*(?:[-*]|\d+\.)\s+"#, template: "")
    }

    /// Strip leading blockquote markers (`> `).
    static func compilePreviewCleanMarkdownBlockquoteMarker(_ text: String) -> String {
        replacingRegex(text, pattern: #"(?m)^\s*>\s?"#, template: "")
    }

    /// Strip code-fence lines (```` ``` ````).
    static func compilePreviewCleanMarkdownCodeFenceMarker(_ text: String) -> String {
        replacingRegex(text, pattern: #"(?m)^\s*```.*$"#, template: "")
    }

    private static func replacingRegex(_ text: String, pattern: String, template: String) -> String {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return text }
        let ns = text as NSString
        return regex.stringByReplacingMatches(
            in: text,
            range: NSRange(location: 0, length: ns.length),
            withTemplate: template
        )
    }

    /// UUID of the ContentRoot the current PDF lives under, derived
    /// from the `loom://content/<uuid>/...` URL.
    private var parentRootID: UUID? {
        guard let loomURL else { return nil }
        guard loomURL.scheme == "loom", loomURL.host == "content" else { return nil }
        let segs = loomURL.path
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            .split(separator: "/")
        guard let first = segs.first else { return nil }
        return UUID(uuidString: String(first))
    }

    private var parentRootName: String? {
        guard let id = parentRootID else { return nil }
        return ContentRootStore.loadAll().first(where: { $0.id == id })?.displayName
    }

    /// Build a markdown note entry for the captured PDF selection. The
    /// embedded `loom://anchor?...` URL carries page index, rect, and
    /// a text excerpt so the click-back can fall back to text search if
    /// the rect ever drifts (e.g. after the PDF is replaced).
    private func buildQuoteEntry(info: (pageIndex: Int, rect: CGRect, text: String)) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        let timestamp = formatter.string(from: Date())
        let pageDisplay = info.pageIndex + 1
        let quoted = Self.quoteLines(info.text)
        // No per-entry h3 anymore — the per-file h3 wrapping section
        // (added by `appendUnderNotes`) does that grouping. Each entry
        // is just an italic meta line + quote + jump link, so multiple
        // notes from the same PDF cluster cleanly under one heading.
        return """
        *p.\(pageDisplay) · \(timestamp)*
        \(quoted)

        [📍 Jump to passage](\(anchorURL(for: info)))
        """
    }

    /// Convert PDF selection text into clean blockquote markdown:
    /// trim trailing whitespace, drop trailing blank lines (PDFs often
    /// add several), and prefix each line with `> `.
    private static func quoteLines(_ text: String) -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { "> \($0)" }
            .joined(separator: "\n")
    }

    /// Append a note entry directly into the per-book `## <file>`
    /// section. Notes, AI threads, and pursuit back-links all share
    /// one section per book — the whole "what I've done with this
    /// PDF" lives in one place, matching the user's mental model.
    private func appendUnderNotes(entry: String, file: String, to source: String) -> String {
        Self.addEntryToBook(body: entry, file: file, sourceURL: sourceIdentity, in: source)
    }

    private func showToast(_ message: String) {
        toastTask?.cancel()
        withAnimation(.easeOut(duration: 0.15)) {
            toast = message
        }
        toastTask = Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await MainActor.run {
                withAnimation(.easeIn(duration: 0.25)) {
                    toast = nil
                }
            }
        }
    }

    private func resolve() async {
        if let directFileURL {
            let resolved = directFileURL.standardizedFileURL
            guard FileManager.default.fileExists(atPath: resolved.path) else {
                await MainActor.run {
                    resolvedURL = nil
                    resolveError = "Missing on disk: \(resolved.path)"
                }
                return
            }
            await MainActor.run {
                resolvedURL = resolved
                resolveError = nil
            }
            return
        }

        guard let loomURL else {
            await MainActor.run {
                resolvedURL = nil
                resolveError = "Missing source URL."
            }
            return
        }

        let hostRoots = LoomRuntimePaths.resolveHostRoots()
        let contentRoots = ContentRootStore.allActiveURLs
        guard let resolved = LoomURLSchemeHandler.resolve(loomURL, hostRoots: hostRoots, contentRoots: contentRoots) else {
            await MainActor.run {
                resolvedURL = nil
                resolveError = "File not under the active content root."
            }
            return
        }
        guard FileManager.default.fileExists(atPath: resolved.path) else {
            await MainActor.run {
                resolvedURL = nil
                resolveError = "Missing on disk: \(resolved.path)"
            }
            return
        }
        await MainActor.run {
            resolvedURL = resolved
            resolveError = nil
        }
    }
}

/// Compile pipeline prompt builder (plans/compile-pipeline-mvp.md §4.3).
/// Pure prompt assembly so the system prompt + context bounding can be
/// unit-tested without touching the provider stack.
enum LoomCompilePipeline {
    /// Context bounds (§6): source ~6k chars, prior notes ~2k, ask history
    /// ~2k. Keeps the envelope inside the privacy/latency budget.
    static let sourceCharBudget = 6000
    static let priorNotesCharBudget = 2000
    static let askHistoryCharBudget = 2000

    /// The typesetter system prompt (full §4.3 text, abridged in comments).
    static let systemPrompt = """
    You are a typesetter for a learning artifact. The user has been studying a \
    source and writing their thinking on it. Your job is to produce a \
    well-typeset structured artifact from the user's raw notes — NOT to think \
    for them.

    YOUR JOB:
    - Take the scratch and PRODUCE a typeset learning artifact.
    - Recognize the content shape (math derivation, definition cluster, \
      step-by-step process, conceptual explanation, Q&A reflection) and \
      structure the output for it.
    - DO NOT add information the user did not write. Only structure what's there.

    RULES:
    - Use $...$ for inline math, $$...$$ for blocks.
    - For step-by-step content separate frames with `---` on their own line.
    - For unfamiliar terms mark `[term: explanation]` for hover-reveal.
    - If the user wrote multiple contradictory statements, surface BOTH: \
      `[user noted both X and Z]`. Never silently choose.
    - If a claim is not supported by the source or scratch, mark it `(unsupported)`.

    LANGUAGE:
    - Respond in the SAME language the user wrote in. If the source is English \
      but the user wrote in Chinese, output Chinese (English source quotes \
      preserved as block quotes). Math/LaTeX/code symbols are language-neutral.

    LENGTH:
    - Match the depth of the scratch. Do NOT pad.

    Begin.
    """

    /// Build the compile prompt envelope: scratch (full) + bounded source +
    /// bounded prior notes + bounded ask history. Mirrors the user's
    /// language by passing scratch through verbatim (the system prompt does
    /// the mirroring).
    static func buildPrompt(
        scratch: String,
        sourceExcerpt: String?,
        priorNotes: String?,
        askHistory: [String]
    ) -> String {
        var sections: [String] = []
        sections.append("SCRATCH (the user's raw thinking — structure THIS):\n" + scratch)

        if let sourceExcerpt, !sourceExcerpt.isEmpty {
            sections.append("SOURCE EXCERPT:\n" + bounded(sourceExcerpt, to: sourceCharBudget))
        } else {
            sections.append("SOURCE EXCERPT: (source unavailable — compile from notes only)")
        }

        if let priorNotes, !priorNotes.isEmpty {
            sections.append("PRIOR NOTES:\n" + bounded(priorNotes, to: priorNotesCharBudget))
        }

        let joinedHistory = askHistory.joined(separator: "\n\n")
        if !joinedHistory.isEmpty {
            sections.append("ARCHIVED ASK AI HISTORY:\n" + bounded(joinedHistory, to: askHistoryCharBudget))
        }

        return sections.joined(separator: "\n\n---\n\n")
    }

    /// Clip `text` to `budget` UTF-16 chars (best effort; preserves head).
    private static func bounded(_ text: String, to budget: Int) -> String {
        guard text.count > budget else { return text }
        let end = text.index(text.startIndex, offsetBy: budget)
        return String(text[..<end])
    }
}

/// Reference container for a `PDFView` so SwiftUI parent code can query
/// the live PDFKit instance (current selection, jump-to-page) without
/// relying on private NSViewRepresentable internals.
@MainActor
/// The reader's left sidebar can show page thumbnails or the document's
/// table of contents (nil = hidden).
enum ReaderSidebar { case pages, contents }

/// One entry in the reader's Contents (outline) sidebar — a flattened
/// PDFOutline node with its nesting depth and destination page.
struct ReaderOutlineItem: Identifiable {
    let id = UUID()
    let label: String
    let depth: Int
    let pageLabel: String
    let destination: PDFDestination?
}

struct SourceTraceRailItem: Identifiable, Equatable {
    enum Kind: String, Equatable {
        case capture
        case question
        case draft
        case principle
        case transient
    }

    let id: String
    let pageIndex: Int
    let rect: CGRect
    let kind: Kind
    let title: String
    let excerpt: String

    static func sessionCapture(pageIndex: Int, rect: CGRect, text: String) -> SourceTraceRailItem {
        let rectKey = "\(Int(rect.origin.x)),\(Int(rect.origin.y)),\(Int(rect.size.width)),\(Int(rect.size.height))"
        let textKey = text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .prefix(48)
            .map { $0.isLetter || $0.isNumber ? String($0) : "-" }
            .joined()
        return SourceTraceRailItem(
            id: "session-capture-\(pageIndex)-\(rectKey)-\(textKey)",
            pageIndex: pageIndex,
            rect: rect,
            kind: .capture,
            title: "Captured · Page \(pageIndex + 1)",
            excerpt: String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(140))
        )
    }
}

final class PDFViewHolder: ObservableObject {
    weak var pdfView: PDFView?
    /// Set once the document is loaded — used to key per-file scroll memory.
    var documentURL: URL?

    // Live reading state for the reader toolbar (owner 2026-07-06: wire the
    // native PDFView controls LOOM wasn't surfacing). Updated off PDFKit's own
    // page/scale/document notifications.
    @Published var hasPDF = false
    @Published var pageLabel = ""   // "3 / 12"
    @Published var currentPageIndex = 0
    @Published var pageCount = 0
    @Published var scaleLabel = ""  // "120%"
    @Published var canZoomIn = false
    @Published var canZoomOut = false
    @Published var isFitting = true // autoScales on = fit-to-width

    // Display layout + night mode (owner 2026-07-06): let readers pick
    // continuous / single / two-up, and invert the page for dark reading —
    // capabilities PDFView has but LOOM never surfaced.
    @Published var displayModeRaw = PDFDisplayMode.singlePageContinuous.rawValue
    @Published var isNightMode = false

    // In-document search (⌘F) — owner 2026-07-06: LOOM was hiding PDFKit's own
    // find. Synchronous findString is plenty for reading-sized docs and avoids
    // the async delegate dance.
    @Published var isFindOpen = false
    @Published var findText = ""
    @Published var findMatchLabel = ""  // "3 / 27" · "No results" · ""
    private var findMatches: [PDFSelection] = []
    private var findIndex = 0
    private var findWorkItem: DispatchWorkItem?

    private var observers: [NSObjectProtocol] = []

    /// Bind the holder to a live PDFView + observe its native notifications so
    /// the toolbar's page/zoom readouts stay in sync.
    func attach(_ view: PDFView) {
        guard pdfView !== view else { return }
        pdfView = view
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        observers.removeAll()
        let nc = NotificationCenter.default
        for name: Notification.Name in [.PDFViewPageChanged, .PDFViewScaleChanged, .PDFViewDocumentChanged] {
            observers.append(nc.addObserver(forName: name, object: view, queue: .main) { [weak self] _ in
                self?.refresh()
            })
        }
        refresh()
    }

    func refresh() {
        guard let view = pdfView, let doc = view.document, doc.pageCount > 0 else {
            hasPDF = false; pageLabel = ""; scaleLabel = ""; canZoomIn = false; canZoomOut = false
            currentPageIndex = 0; pageCount = 0
            return
        }
        hasPDF = true
        let current = view.currentPage.map { doc.index(for: $0) + 1 } ?? 1
        currentPageIndex = max(0, current - 1)
        pageCount = doc.pageCount
        pageLabel = "\(current) / \(doc.pageCount)"
        scaleLabel = "\(Int((view.scaleFactor * 100).rounded()))%"
        canZoomIn = view.canZoomIn
        canZoomOut = view.canZoomOut
        isFitting = view.autoScales
        persistPosition()
    }

    // MARK: Per-file scroll memory (owner 2026-07-06: reopen a PDF where you
    // left off, not at page 1).

    private func positionKey(_ url: URL) -> String { "loom.pdf.page." + url.absoluteString }

    private func persistPosition() {
        guard let url = documentURL, let view = pdfView, let doc = view.document,
              let page = view.currentPage else { return }
        UserDefaults.standard.set(doc.index(for: page), forKey: positionKey(url))
    }

    /// Jump to the last page this file was left on (no-op the first time).
    func restorePosition(for url: URL) {
        documentURL = url
        guard let view = pdfView, let doc = view.document else { return }
        let saved = UserDefaults.standard.object(forKey: positionKey(url)) as? Int
        guard let idx = saved, idx > 0, idx < doc.pageCount, let page = doc.page(at: idx) else { return }
        view.go(to: page)
        refresh()
    }

    // MARK: Contents (outline) sidebar

    var hasOutline: Bool { (pdfView?.document?.outlineRoot?.numberOfChildren ?? 0) > 0 }

    /// Flatten the PDF's outline tree into an indented list for the sidebar.
    func outlineItems() -> [ReaderOutlineItem] {
        guard let doc = pdfView?.document, let root = doc.outlineRoot else { return [] }
        var out: [ReaderOutlineItem] = []
        func walk(_ node: PDFOutline, depth: Int) {
            for i in 0..<node.numberOfChildren {
                guard let child = node.child(at: i) else { continue }
                let dest = child.destination
                var pageLabel = ""
                if let page = dest?.page { pageLabel = "\(doc.index(for: page) + 1)" }
                out.append(ReaderOutlineItem(label: child.label ?? "", depth: depth,
                                             pageLabel: pageLabel, destination: dest))
                if child.numberOfChildren > 0 { walk(child, depth: depth + 1) }
            }
        }
        walk(root, depth: 0)
        return out
    }

    func goToDestination(_ dest: PDFDestination) { pdfView?.go(to: dest); refresh() }

    // MARK: Display layout + night mode

    func setDisplayMode(_ mode: PDFDisplayMode) {
        pdfView?.displayMode = mode
        displayModeRaw = mode.rawValue
        refresh()
    }

    func toggleNightMode() {
        isNightMode.toggle()
        applyNightMode()
    }

    /// PDFKit has no native invert. Composite a Core Image invert (+ a π hue
    /// rotate so colored figures keep roughly their hue) onto the view's layer.
    /// `layerUsesCoreImageFilters` is required for CIFilters on an NSView layer.
    func applyNightMode() {
        guard let view = pdfView else { return }
        view.wantsLayer = true
        view.layerUsesCoreImageFilters = true
        if isNightMode {
            let invert = CIFilter(name: "CIColorInvert")
            let hue = CIFilter(name: "CIHueAdjust")
            hue?.setValue(Double.pi, forKey: kCIInputAngleKey)
            view.layer?.filters = [invert, hue].compactMap { $0 }
        } else {
            view.layer?.filters = nil
        }
    }

    func zoomIn()  { pdfView?.autoScales = false; pdfView?.zoomIn(nil);  refresh() }
    func zoomOut() { pdfView?.autoScales = false; pdfView?.zoomOut(nil); refresh() }
    func fitWidth() { pdfView?.autoScales = true; refresh() }
    func actualSize() { pdfView?.autoScales = false; pdfView?.scaleFactor = 1; refresh() }
    func goToPreviousPage() { pdfView?.goToPreviousPage(nil); refresh() }
    func goToNextPage() { pdfView?.goToNextPage(nil); refresh() }
    func goToFirstPage() {
        if let p = pdfView?.document?.page(at: 0) { pdfView?.go(to: p); refresh() }
    }
    func goToLastPage() {
        guard let doc = pdfView?.document, doc.pageCount > 0,
              let p = doc.page(at: doc.pageCount - 1) else { return }
        pdfView?.go(to: p); refresh()
    }
    func goToPage(_ oneBased: Int) {
        guard let view = pdfView, let doc = view.document else { return }
        let idx = max(0, min(oneBased - 1, doc.pageCount - 1))
        if let page = doc.page(at: idx) { view.go(to: page); refresh() }
    }

    // MARK: In-document find

    func openFind() {
        isFindOpen = true
        if !findText.isEmpty { runFind(findText) }
    }

    func closeFind() {
        findWorkItem?.cancel()
        isFindOpen = false
        findText = ""
        findMatchLabel = ""
        findMatches = []
        findIndex = 0
        pdfView?.highlightedSelections = nil
    }

    /// Run a fresh search: highlight every hit, jump to the first.
    ///
    /// Debounced: the find bar re-fires this on every keystroke, and rapid
    /// re-assignment of `highlightedSelections` makes PDFKit keep the FIRST
    /// (single-character) set instead of the latest — so hits from "M" would
    /// stay lit while typing "Master". Coalescing to the settled query fixes it.
    func runFind(_ raw: String) {
        findWorkItem?.cancel()
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let doc = pdfView?.document, !text.isEmpty else {
            findMatches = []; findIndex = 0; findMatchLabel = ""
            pdfView?.highlightedSelections = nil
            return
        }
        let work = DispatchWorkItem { [weak self] in self?.performFind(text, in: doc) }
        findWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.16, execute: work)
    }

    private func performFind(_ text: String, in doc: PDFDocument) {
        let hits = doc.findString(text, withOptions: [.caseInsensitive, .diacriticInsensitive])
        findMatches = hits
        findIndex = 0
        for hit in hits { hit.color = NSColor.systemYellow.withAlphaComponent(0.42) }
        pdfView?.highlightedSelections = hits
        if hits.isEmpty {
            findMatchLabel = "No results"
        } else {
            focusMatch(0)
        }
    }

    func findNext() { advanceMatch(+1) }
    func findPrevious() { advanceMatch(-1) }

    private func advanceMatch(_ delta: Int) {
        guard !findMatches.isEmpty else { return }
        findIndex = (findIndex + delta + findMatches.count) % findMatches.count
        focusMatch(findIndex)
    }

    private func focusMatch(_ i: Int) {
        guard findMatches.indices.contains(i), let view = pdfView else { return }
        findIndex = i
        let sel = findMatches[i]
        view.setCurrentSelection(sel, animate: true)
        view.scrollSelectionToVisible(nil)
        findMatchLabel = "\(i + 1) / \(findMatches.count)"
    }

    /// Native macOS fullscreen (⌃⌘F). The reader fills the window, so toggle the
    /// reader's own (now main) window.
    func toggleFullScreen() {
        // The reader now fills the window (no longer a sheet), so its own window
        // IS the workbench window. Opt it into fullscreen (the window ships
        // without .fullScreenPrimary, so toggleFullScreen would otherwise no-op).
        let win = pdfView?.window ?? NSApp.mainWindow ?? NSApp.keyWindow
        win?.collectionBehavior.insert(.fullScreenPrimary)
        win?.toggleFullScreen(nil)
    }

    deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }

    /// Snapshot the current selection — page index (0-based), bounds in
    /// page coordinates, and the selected text — when the user has
    /// highlighted something in the PDF. Returns nil when no selection.
    func currentSelectionInfo() -> (pageIndex: Int, rect: CGRect, text: String)? {
        guard let view = pdfView, let selection = view.currentSelection,
              let page = selection.pages.first,
              let document = view.document else { return nil }
        let bounds = selection.bounds(for: page)
        guard !bounds.isEmpty else { return nil }
        let index = document.index(for: page)
        let text = selection.string ?? ""
        return (index, bounds, text)
    }

    /// Jump to a specific page + rect in the open PDF, used by the
    /// anchor links inside Loom.md note rendering.
    func go(toPage pageIndex: Int, rect: CGRect) {
        guard let view = pdfView, let document = view.document else { return }
        guard pageIndex >= 0, pageIndex < document.pageCount else { return }
        guard let page = document.page(at: pageIndex) else { return }
        // Page-only anchor (a Preview capture where no rect was recovered):
        // land at the TOP of the page, no highlight — never the bottom-left.
        if rect.isEmpty {
            let bounds = page.bounds(for: view.displayBox)
            view.go(to: PDFDestination(page: page, at: NSPoint(x: bounds.minX, y: bounds.maxY)))
            view.setCurrentSelection(nil, animate: false)
            return
        }
        // Center the rect in the visible viewport
        let dest = PDFDestination(page: page, at: NSPoint(x: rect.minX, y: rect.maxY))
        view.go(to: dest)
        // Re-create selection for visual highlight
        let selection = page.selection(for: rect)
        view.setCurrentSelection(selection, animate: true)
    }
}

private struct LoomPDFView: NSViewRepresentable {
    let fileURL: URL
    let holder: PDFViewHolder
    let onNote: () -> Void
    var onNotePassage: ((Int, CGRect, String, NSImage?) -> Void)? = nil

    func makeNSView(context: Context) -> LoomPDFKitView {
        let view = LoomPDFKitView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.backgroundColor = NSColor.windowBackgroundColor
        view.onNote = onNote
        view.onNotePassage = onNotePassage
        view.startSelectionObserverIfNeeded()
        loadDocument(into: view, from: fileURL)
        DispatchQueue.main.async {
            holder.attach(view)
            // Grab first responder so arrows / space / page-up-down scroll the
            // document immediately, without a click first.
            view.window?.makeFirstResponder(view)
        }
        return view
    }

    func updateNSView(_ nsView: LoomPDFKitView, context: Context) {
        nsView.onNote = onNote
        nsView.onNotePassage = onNotePassage
        if nsView.document?.documentURL != fileURL {
            loadDocument(into: nsView, from: fileURL)
        }
        DispatchQueue.main.async {
            holder.attach(nsView)
        }
    }

    /// Load PDFDocument off the main thread. `PDFDocument(url:)` for a
    /// 30MB lecture PDF synchronously freezes the UI for several
    /// hundred ms, during which clicks register but produce no visible
    /// effect. Detached + main-thread hand-back keeps the rest of the
    /// app responsive while the document is still parsing.
    ///
    /// Critically: do NOT clear `view.document` before loading the
    /// new one. Clearing causes a visible blank flash for the few
    /// hundred ms the new doc takes to parse. Letting the old doc
    /// stay visible until the new one is ready makes file→file
    /// switches (and initial open transitions) smooth.
    private func loadDocument(into view: PDFView, from url: URL) {
        Task.detached(priority: .userInitiated) {
            let doc = PDFDocument(url: url)
            await MainActor.run {
                // Set the document even if the view hasn't mounted yet: a fast
                // load (small PDF) often completes BEFORE SwiftUI attaches the
                // view, and the old mount-state guard bailed there, leaving the
                // reader permanently blank until reopened (owner 2026-07-06, hit
                // consistently once the reader became a docked column). Any
                // rapid-switch staleness is corrected by updateNSView's URL check.
                view.document = doc
                holder.restorePosition(for: url)
                holder.refresh()
            }
        }
    }
}

struct SourceTraceRail: View {
    let items: [SourceTraceRailItem]
    let currentPageIndex: Int
    let pageCount: Int
    let onJump: (SourceTraceRailItem) -> Void
    @State private var hoveredItemID: SourceTraceRailItem.ID?

    var body: some View {
        GeometryReader { proxy in
            let height = max(proxy.size.height, 1)
            let width = max(proxy.size.width, 1)
            ZStack(alignment: .topLeading) {
                Rectangle()
                    .fill(Color.primary.opacity(0.044))
                    .frame(width: 0.5, height: height)
                    .position(x: width - 4, y: height / 2)

                Circle()
                    .fill(LoomTokens.dsThread.opacity(0.58))
                    .frame(width: 4, height: 4)
                    .position(
                        x: width - 4,
                        y: yPosition(for: currentPageIndex, height: height)
                    )

                ForEach(items) { item in
                    let isHovered = hoveredItemID == item.id
                    Button {
                        onJump(item)
                    } label: {
                        Capsule()
                            .fill(tint(for: item.kind))
                            .frame(
                                width: tickWidth(for: item.kind) + (isHovered ? 5 : 0),
                                height: max(tickHeight(for: item.kind), isHovered ? 4 : 0)
                            )
                            .shadow(
                                color: tint(for: item.kind).opacity(isHovered ? 0.42 : 0.24),
                                radius: isHovered ? 3.5 : 1.8,
                                x: 0,
                                y: 0
                            )
                    }
                    .buttonStyle(.plain)
                    .help(helpText(for: item))
                    .accessibilityLabel(item.title)
                    .accessibilityValue(item.excerpt)
                    .onHover { hovering in
                        var transaction = Transaction()
                        transaction.disablesAnimations = true
                        withTransaction(transaction) {
                            hoveredItemID = hovering ? item.id : nil
                        }
                    }
                    .position(
                        x: xPosition(for: item.kind, width: width),
                        y: yPosition(for: item.pageIndex, height: height)
                    )
                }
            }
            .frame(width: width, height: height)
            .animation(.easeOut(duration: 0.12), value: hoveredItemID)
        }
        .frame(maxHeight: .infinity)
        .background(Color.clear)
        .accessibilityLabel("Evidence rail")
    }

    private func yPosition(for page: Int, height: CGFloat) -> CGFloat {
        let count = max(pageCount, 1)
        guard count > 1 else { return height / 2 }
        let usable = max(height - 16, 1)
        let bounded = min(max(page, 0), count - 1)
        return 8 + (CGFloat(bounded) / CGFloat(count - 1)) * usable
    }

    private func xPosition(for kind: SourceTraceRailItem.Kind, width: CGFloat) -> CGFloat {
        switch kind {
        case .capture, .transient:
            return width - 4
        case .question:
            return width - 3
        case .draft:
            return width - 5
        case .principle:
            return width - 6
        }
    }

    private func tickWidth(for kind: SourceTraceRailItem.Kind) -> CGFloat {
        switch kind {
        case .principle:
            return 5
        case .question:
            return 8
        case .draft:
            return 6
        default:
            return 7
        }
    }

    private func tickHeight(for kind: SourceTraceRailItem.Kind) -> CGFloat {
        kind == .principle ? 5 : 2.5
    }

    private func tint(for kind: SourceTraceRailItem.Kind) -> Color {
        switch kind {
        case .capture:
            return LoomTokens.dsThread
        case .question:
            return Color(red: 0.96, green: 0.56, blue: 0.22)
        case .draft:
            return Color(red: 0.46, green: 0.58, blue: 0.68)
        case .principle:
            return Color(red: 0.88, green: 0.62, blue: 0.20)
        case .transient:
            return LoomTokens.dsThread.opacity(0.52)
        }
    }

    private func helpText(for item: SourceTraceRailItem) -> String {
        let excerpt = item.excerpt.trimmingCharacters(in: .whitespacesAndNewlines)
        if excerpt.isEmpty { return item.title }
        return "\(item.title)\n\(excerpt)"
    }
}

/// PDFKit's own page-thumbnail grid, bound to the reader's live PDFView so
/// clicking a thumbnail navigates and the current page stays highlighted.
private struct LoomPDFThumbnailSidebar: NSViewRepresentable {
    let holder: PDFViewHolder

    func makeNSView(context: Context) -> PDFThumbnailView {
        let tv = PDFThumbnailView()
        tv.pdfView = holder.pdfView
        tv.thumbnailSize = NSSize(width: 118, height: 152)
        tv.backgroundColor = .clear
        return tv
    }

    func updateNSView(_ nsView: PDFThumbnailView, context: Context) {
        if nsView.pdfView !== holder.pdfView { nsView.pdfView = holder.pdfView }
    }
}

/// PDFView subclass that injects Loom's reading actions into the
/// system right-click menu when the user has selected text. The
/// existing system items (Look Up, Translate, Search With…, Copy,
/// Share, Speech) remain first-class; Loom appends a quiet sidecar
/// action after the native PDF actions instead of taking over the
/// menu.
final class LoomPDFKitView: PDFView {
    var onNote: (() -> Void)?
    /// Hover-to-note (owner 2026-07-05): as the cursor moves over the text,
    /// a ❕ badge tracks the line under it; a click hands the passage
    /// (pageIndex, rect, text) back so the note can anchor to it.
    var onNotePassage: ((Int, CGRect, String, NSImage?) -> Void)? {
        didSet { noteTick.isHidden = onNotePassage == nil }
    }

    private var pendingPassage: (page: Int, rect: CGRect, text: String)?
    private var hoverTracking: NSTrackingArea?
    /// The reader capture mark for hovered lines. A live text selection draws no
    /// extra mark: the native blue selection is already the target, and adding a
    /// cyan tick beside punctuation reads like a stray cursor.
    private lazy var noteTick: NoteHoverTick = {
        let tick = NoteHoverTick()
        tick.isHidden = true
        return tick
    }()

    // Region snip (owner 2026-07-06, appshot iteration 2): ⌥-drag draws a box;
    // on release the boxed region is rendered to an image and dropped into the
    // note — precise block / figure / table capture, beyond the hovered line.
    private var snipStart: CGPoint?
    private var snipRect: CGRect?
    private lazy var snipOverlay: SnipOverlayView = {
        let overlay = SnipOverlayView()
        overlay.isHidden = true
        return overlay
    }()

    // Hover-to-note reliability (owner 2026-07-06): highlight the WHOLE hovered
    // line so the target is obvious, pin the ❕ to the line's trailing edge
    // (fixed, not chasing the cursor), and let a click anywhere on the line
    // capture it — click vs drag distinguished in mouseUp so text drag-select
    // still works. A success flash confirms the grab in place.
    private var clickDownPoint: CGPoint?
    private var didDrag = false
    // "Grab what's lit" (owner 2026-07-06): a live text SELECTION wins the tick
    // over the hovered line, so you can grab part of a line — the whole-line wash
    // is gone. Armed at mouse-down (the text view collapses the selection on click,
    // so we capture it before that) when the press lands on the lit selection/tick.
    private var selectionObserver: NSObjectProtocol?
    private var armedSelection: (page: Int, rect: CGRect, text: String)?
    private var hadSelectionAtDown = false
    private lazy var lineHighlight: LineHoverHighlight = {
        let view = LineHoverHighlight()
        view.isHidden = true
        return view
    }()

    override func layout() {
        super.layout()
        // Keep the highlight + badge + snip marquee topmost — PDFView owns
        // internal document subviews. Highlight sits under the badge.
        if lineHighlight.superview !== self {
            addSubview(lineHighlight, positioned: .above, relativeTo: nil)
        }
        if noteTick.superview !== self {
            addSubview(noteTick, positioned: .above, relativeTo: nil)
        }
        if snipOverlay.superview !== self {
            addSubview(snipOverlay, positioned: .above, relativeTo: nil)
        }
        lineHighlight.frame = bounds
        snipOverlay.frame = bounds
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let existing = hoverTracking { removeTrackingArea(existing) }
        let area = NSTrackingArea(
            rect: bounds,
            options: [.mouseMoved, .mouseEnteredAndExited, .activeInKeyWindow, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(area)
        hoverTracking = area
    }

    override func mouseMoved(with event: NSEvent) {
        super.mouseMoved(with: event)
        guard onNotePassage != nil else { hideBadge(); return }
        // A live selection owns the target — hovering must not steal capture
        // away from the words you just selected. It draws no extra marker.
        if liveSelectionTarget() != nil { return }
        let viewPoint = convert(event.locationInWindow, from: nil)
        guard let document,
              let page = page(for: viewPoint, nearest: false) else { hideBadge(); return }
        let pagePoint = convert(viewPoint, to: page)
        guard let selection = page.selectionForLine(at: pagePoint),
              let raw = selection.string?.trimmingCharacters(in: .whitespacesAndNewlines),
              !raw.isEmpty else { hideBadge(); return }
        // Fallback target = the hovered line. The tick pins to its trailing edge
        // (relightMark), but no full-line wash is painted — that read as "take the
        // whole row" (owner 2026-07-06).
        pendingPassage = (document.index(for: page), selection.bounds(for: page), raw)
        relightMark()
    }

    override func mouseExited(with event: NSEvent) {
        super.mouseExited(with: event)
        hideBadge()
    }

    private func hideBadge() {
        noteTick.isHidden = true
        lineHighlight.isHidden = true
        pendingPassage = nil
    }

    // MARK: Grab-what's-lit target resolution

    /// The live text selection as a capture target (page index, page-space rect,
    /// text), or nil. A selection always WINS the tick over the hovered line, so
    /// you can grab a phrase — not just a whole row.
    private func liveSelectionTarget() -> (page: Int, rect: CGRect, text: String)? {
        guard let document, let sel = currentSelection, let page = sel.pages.first,
              let text = sel.string?.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty else { return nil }
        let b = sel.bounds(for: page)
        guard b.width > 1, b.height > 1 else { return nil }
        return (document.index(for: page), b, text)
    }

    /// The current selection's bounds in this view's space (for hit-testing a
    /// click that lands inside it).
    private func selectionViewRect() -> CGRect? {
        guard let sel = currentSelection, let page = sel.pages.first else { return nil }
        let b = sel.bounds(for: page)
        let c1 = convert(CGPoint(x: b.minX, y: b.minY), from: page)
        let c2 = convert(CGPoint(x: b.maxX, y: b.maxY), from: page)
        return CGRect(x: min(c1.x, c2.x), y: min(c1.y, c2.y), width: abs(c2.x - c1.x), height: abs(c2.y - c1.y))
    }

    /// Pin the capture mark to the hovered line. A live SELECTION wins the
    /// capture target but intentionally draws no extra mark; the blue highlight
    /// itself is enough, and the click target remains the selection rectangle.
    /// Never paints a full-line wash at rest (that read as "take the whole row");
    /// the wash survives only as the commit flash on the exact captured rect.
    private func relightMark() {
        guard onNotePassage != nil else { hideBadge(); return }
        if liveSelectionTarget() != nil {
            lineHighlight.isHidden = true
            noteTick.isHidden = true
            return
        }
        let v: CGRect?
        if let p = pendingPassage, let document, let page = document.page(at: p.page) {
            let c1 = convert(CGPoint(x: p.rect.minX, y: p.rect.minY), from: page)
            let c2 = convert(CGPoint(x: p.rect.maxX, y: p.rect.maxY), from: page)
            v = CGRect(x: min(c1.x, c2.x), y: min(c1.y, c2.y), width: abs(c2.x - c1.x), height: abs(c2.y - c1.y))
        } else {
            v = nil
        }
        guard let r = v else { noteTick.isHidden = true; lineHighlight.isHidden = true; return }
        lineHighlight.isHidden = true
        let tw: CGFloat = 12
        let tx = min(r.maxX + 6, bounds.maxX - tw - 2)
        noteTick.frame = NSRect(x: tx, y: r.minY - 2, width: tw, height: r.height + 4)
        noteTick.isHidden = false
    }

    /// Capture EXACTLY the given target (selection or line) — flash its exact
    /// rect as the receipt (never the whole row), clear the selection, and hand
    /// it to the note through the same sink as ⌘E / right-click.
    ///
    /// Owner 2026-07-06: linear text (a whole line or a drag-selection) lands as
    /// a CLEAN TEXT QUOTE at evidence altitude (image = nil → insertPassageAnchor
    /// → indented, searchable, editable, clickable). Only ⌥-drag (captureRegion)
    /// stays an image card, since a rectangular selection scrambles word order.
    private func commit(page: Int, rect: CGRect, text: String) {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { return }
        if let pg = document?.page(at: page) {
            let c1 = convert(CGPoint(x: rect.minX, y: rect.minY), from: pg)
            let c2 = convert(CGPoint(x: rect.maxX, y: rect.maxY), from: pg)
            lineHighlight.lineRect = CGRect(x: min(c1.x, c2.x), y: min(c1.y, c2.y),
                                            width: abs(c2.x - c1.x), height: abs(c2.y - c1.y))
            lineHighlight.flash()
        }
        noteTick.isHidden = true
        pendingPassage = nil
        clearSelection()
        onNotePassage?(page, rect, clean, nil)
    }

    /// Re-light the mark whenever the selection changes — covers keyboard
    /// (shift-arrow) and double-click-word selections, not just mouse drags.
    /// Registered from makeNSView (NOT viewDidMoveToWindow, to avoid touching
    /// PDFView's own window-move display setup).
    func startSelectionObserverIfNeeded() {
        guard selectionObserver == nil else { return }
        selectionObserver = NotificationCenter.default.addObserver(
            forName: .PDFViewSelectionChanged, object: self, queue: .main
        ) { [weak self] _ in
            guard let self, self.onNotePassage != nil else { return }
            self.relightMark()
        }
    }

    deinit { if let o = selectionObserver { NotificationCenter.default.removeObserver(o) } }

    // ⌥-drag = snip a rectangular region. We take the drag over from PDFView's
    // native marquee and draw our own cyan box, then appshot exactly it.
    override func mouseDown(with event: NSEvent) {
        if onNotePassage != nil, event.modifierFlags.contains(.option) {
            snipStart = convert(event.locationInWindow, from: nil)
            snipRect = nil
            hideBadge()
            NSCursor.crosshair.set()
            return
        }
        let down = convert(event.locationInWindow, from: nil)
        clickDownPoint = down
        didDrag = false
        // The text view collapses a selection on mouse-down, so decide NOW whether
        // this press grabs the lit selection: it does only if it lands inside the
        // native blue selection. Otherwise remember a selection stood (so a click
        // that collapses it doesn't fall through to grabbing the line).
        if let sel = liveSelectionTarget() {
            hadSelectionAtDown = true
            let onSelection = selectionViewRect()?.insetBy(dx: -6, dy: -4).contains(down) ?? false
            armedSelection = onSelection ? sel : nil
        } else {
            hadSelectionAtDown = false
            armedSelection = nil
        }
        super.mouseDown(with: event)
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start = snipStart else {
            didDrag = true
            super.mouseDragged(with: event)
            return
        }
        let point = convert(event.locationInWindow, from: nil)
        let rect = CGRect(
            x: min(start.x, point.x), y: min(start.y, point.y),
            width: abs(point.x - start.x), height: abs(point.y - start.y)
        )
        snipRect = rect
        snipOverlay.frame = bounds
        snipOverlay.selectionRect = rect
        snipOverlay.isHidden = false
    }

    override func mouseUp(with event: NSEvent) {
        if snipStart != nil {
            snipStart = nil
            snipOverlay.isHidden = true
            NSCursor.arrow.set()
            let rect = snipRect
            snipRect = nil
            if let rect, rect.width > 8, rect.height > 8 {
                captureRegion(viewRect: rect)
                // Confirm the grab: flash green over the box the user drew.
                lineHighlight.lineRect = rect
                lineHighlight.flash()
            }
            return
        }
        super.mouseUp(with: event)
        let up = convert(event.locationInWindow, from: nil)
        // Detect a drag by DISTANCE, not didDrag: PDFView tracks text drag-select
        // in its own internal loop, so mouseDragged (and didDrag) may never fire —
        // which made a drag-select fall through and auto-grab the whole line
        // (owner 2026-07-06: "selecting a sentence chooses it into notes directly").
        let moved = clickDownPoint.map { hypot(up.x - $0.x, up.y - $0.y) > 4 } ?? didDrag
        let armed = armedSelection
        clickDownPoint = nil
        didDrag = false
        armedSelection = nil
        hadSelectionAtDown = false
        guard onNotePassage != nil else { return }

        // 1. A real CLICK (no drag) on a standing selection or its tick → grab
        //    exactly those words.
        if let armed, !moved {
            commit(page: armed.page, rect: armed.rect, text: armed.text)
            return
        }
        // 2. Text is now selected (a drag just selected it, a double-click picked
        //    a word, or a selection stands) → NEVER auto-commit. Keep the blue
        //    native selection as the only marker; grab it by clicking inside it
        //    or using ⌘E.
        //    THIS is the fix: selecting no longer captures on its own.
        if liveSelectionTarget() != nil {
            relightMark()
            return
        }
        // 3. A drag that selected nothing → do nothing.
        if moved { return }
        // 4. A plain click on a hovered line, nothing selected → grab the line.
        if pendingPassage != nil { commitPendingPassage() }
    }

    /// Turn a view-space snip box into an appshot: find its page, map the box
    /// into page space, render exactly that rect, and drop the image (plus the
    /// text under it, if any) into the note.
    private func captureRegion(viewRect: CGRect) {
        let center = CGPoint(x: viewRect.midX, y: viewRect.midY)
        guard let document, let page = page(for: center, nearest: true) else { return }
        let a = convert(CGPoint(x: viewRect.minX, y: viewRect.minY), to: page)
        let b = convert(CGPoint(x: viewRect.maxX, y: viewRect.maxY), to: page)
        let pageRect = CGRect(
            x: min(a.x, b.x), y: min(a.y, b.y),
            width: abs(b.x - a.x), height: abs(b.y - a.y)
        )
        guard pageRect.width > 4, pageRect.height > 4,
              let image = Self.regionImage(from: page, pageRect: pageRect) else { return }
        // Give the appshot a real text layer: rectangular PDF selection returns
        // scrambled, out-of-order words, so read the rendered region back with
        // on-device Vision OCR (reading order preserved). It only seeds the
        // anchor's findString fallback + makes the card searchable — the note
        // still SHOWS the image, not a quote. Fall back to the raw selection if
        // OCR finds nothing (e.g. a pure diagram).
        let ocr = Self.ocrText(from: image)
        let text = ocr.isEmpty
            ? (page.selection(for: pageRect)?.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "")
            : ocr
        onNotePassage?(document.index(for: page), pageRect, text, image)
    }

    private func commitPendingPassage() {
        // The whole-line grab is just a commit whose target is the hovered line;
        // commit() renders the appshot, flashes the exact rect, and hands it to
        // the note (same path as a selection grab / ⌘E / right-click).
        guard let pending = pendingPassage else { return }
        commit(page: pending.page, rect: pending.rect, text: pending.text)
    }

    /// Rasterize a page-space rect to an image. Drawn from the PDF content
    /// stream via `PDFPage.draw` — no screen capture, no TCC permission.
    /// NSImage's lockFocus renders at the backing scale, so the card stays
    /// crisp on Retina. The caller decides padding.
    static func regionImage(from page: PDFPage, pageRect: CGRect) -> NSImage? {
        let box = PDFDisplayBox.cropBox
        let pageBounds = page.bounds(for: box)
        let region = pageRect.intersection(pageBounds).integral
        guard region.width >= 6, region.height >= 6 else { return nil }
        let image = NSImage(size: region.size)
        image.lockFocusFlipped(false)
        defer { image.unlockFocus() }
        guard let ctx = NSGraphicsContext.current?.cgContext else { return nil }
        ctx.setFillColor(NSColor.white.cgColor)
        ctx.fill(CGRect(origin: .zero, size: region.size))
        ctx.saveGState()
        // Map the region's origin to the image origin, then draw the page in its
        // own (bottom-left) coordinate space.
        ctx.translateBy(x: -region.origin.x, y: -region.origin.y)
        page.draw(with: box, to: ctx)
        ctx.restoreGState()
        return image
    }

    /// Read text out of a rendered region with on-device Vision OCR — reading
    /// order preserved, unlike a rectangular PDF selection. Runs locally (no
    /// network, no permission); returns "" if nothing legible is found.
    static func ocrText(from image: NSImage) -> String {
        guard let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return "" }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        let handler = VNImageRequestHandler(cgImage: cg, options: [:])
        guard (try? handler.perform([request])) != nil else { return "" }
        let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
        return lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    override func menu(for event: NSEvent) -> NSMenu? {
        let menu = super.menu(for: event) ?? NSMenu()
        let selectedText = currentSelection?.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !selectedText.isEmpty else { return menu }
        if let last = menu.items.last, !last.isSeparatorItem {
            menu.addItem(NSMenuItem.separator())
        }
        let item = NSMenuItem(
            title: "Note this passage…",
            action: #selector(loomNoteAction),
            keyEquivalent: ""
        )
        item.target = self
        menu.addItem(item)
        return menu
    }

    @objc private func loomNoteAction() { onNote?() }
}

/// The reader capture mark (owner 2026-07-06, refined 2026-07-07). Hovered lines
/// get the quote-spine hairline. Live selections draw no mark; their blue native
/// highlight is already the capture target. Non-interactive — the line owns the
/// click target, so the mark just points.
final class NoteHoverTick: NSView {
    override var isFlipped: Bool { true }

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func draw(_ dirtyRect: NSRect) {
        // 青芒 #4BC5DE — inlined as calibrated RGB, matching the existing idiom.
        // Fixed cyan (not the brighter dark pair) because the backdrop is the
        // white PDF page, not dark glass.
        let cyan = NSColor(calibratedRed: 0.294, green: 0.773, blue: 0.871, alpha: 1)
        let h = min(max(bounds.height, 11), 22)
        let bar = NSRect(x: bounds.midX - 1.25, y: (bounds.height - h) / 2, width: 2.5, height: h)
        let path = NSBezierPath(roundedRect: bar, xRadius: 1.25, yRadius: 1.25)
        NSGraphicsContext.saveGraphicsState()
        // Lit, not plated — a soft cyan glow so it reads as light on the page.
        let glow = NSShadow()
        glow.shadowColor = cyan.withAlphaComponent(0.36)
        glow.shadowBlurRadius = 2.5
        glow.shadowOffset = .zero
        glow.set()
        cyan.withAlphaComponent(0.95).setFill()
        path.fill()
        NSGraphicsContext.restoreGraphicsState()
    }
}

/// The cyan marquee drawn while ⌥-dragging an appshot region in the reader.
/// A translucent fill + dashed border; it never steals events (hitTest nil)
/// so the drag keeps reaching the PDF view.
final class SnipOverlayView: NSView {
    var selectionRect: CGRect = .zero { didSet { needsDisplay = true } }

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func draw(_ dirtyRect: NSRect) {
        guard selectionRect.width > 1, selectionRect.height > 1 else { return }
        let accent = NSColor(calibratedRed: 0.294, green: 0.773, blue: 0.871, alpha: 1)
        // Dim everything OUTSIDE the box — a macOS screenshot-style spotlight so
        // the region reads as precise. Even-odd = bounds minus the selection.
        let mask = NSBezierPath(rect: bounds)
        mask.append(NSBezierPath(rect: selectionRect))
        mask.windingRule = .evenOdd
        NSColor.black.withAlphaComponent(0.30).setFill()
        mask.fill()
        // The box: a whisper of accent wash + a crisp accent border.
        accent.withAlphaComponent(0.06).setFill()
        selectionRect.fill()
        let border = NSBezierPath(rect: selectionRect)
        border.lineWidth = 1.5
        accent.withAlphaComponent(0.95).setStroke()
        border.stroke()
        // Live dimensions readout, like the system region grab.
        let dims = "\(Int(selectionRect.width)) × \(Int(selectionRect.height))"
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedDigitSystemFont(ofSize: 11, weight: .medium),
            .foregroundColor: NSColor.white,
        ]
        let textSize = dims.size(withAttributes: attrs)
        let pad: CGFloat = 5
        let boxW = textSize.width + pad * 2
        let boxH = textSize.height + pad
        var lx = selectionRect.midX - boxW / 2
        var ly = selectionRect.minY - boxH - 6
        if ly < 4 { ly = selectionRect.maxY + 6 }
        lx = max(4, min(lx, bounds.maxX - boxW - 4))
        let labelRect = CGRect(x: lx, y: ly, width: boxW, height: boxH)
        NSColor.black.withAlphaComponent(0.72).setFill()
        NSBezierPath(roundedRect: labelRect, xRadius: 4, yRadius: 4).fill()
        dims.draw(at: CGPoint(x: labelRect.minX + pad, y: labelRect.minY + pad / 2), withAttributes: attrs)
    }
}

/// A calm lift over the line under the cursor in the reader — the capture
/// target made visible with light/ink, not a colour wash (owner 2026-07-06:
/// cyan no longer floods the row; it lives only on the trailing tick). `flash()`
/// gives a cyan receipt that slides toward the note, since the note itself lands
/// behind the reader.
final class LineHoverHighlight: NSView {
    var lineRect: CGRect = .zero {
        didSet {
            flashing = false
            alphaValue = 1
            needsDisplay = true
        }
    }
    private var flashing = false

    override func hitTest(_ point: NSPoint) -> NSView? { nil }

    override func draw(_ dirtyRect: NSRect) {
        guard lineRect.width > 1, lineRect.height > 1 else { return }
        let box = lineRect.insetBy(dx: -5, dy: -2.5)
        if flashing {
            // Receipt: a single soft cyan pulse across the row — cyan, never a
            // foreign green, so the instrument stays a two-colour (ink + cyan) tool.
            let cyan = NSColor(calibratedRed: 0.294, green: 0.773, blue: 0.871, alpha: 1)
            let pulse = NSBezierPath(roundedRect: box, xRadius: 4, yRadius: 4)
            cyan.withAlphaComponent(0.22).setFill()
            pulse.fill()
            return
        }
        // Achromatic lift — a hair of ink so the row reads "lifted" on white
        // paper (and inverts to a light lift under night mode). No cyan on content.
        let lift = NSBezierPath(roundedRect: box, xRadius: 4, yRadius: 4)
        NSColor.black.withAlphaComponent(0.05).setFill()
        lift.fill()
        // A 1pt baseline rule — the instrument's underline, made of ink.
        let baseY = box.minY + 1
        let under = NSBezierPath()
        under.move(to: NSPoint(x: box.minX + 2, y: baseY))
        under.line(to: NSPoint(x: box.maxX - 2, y: baseY))
        under.lineWidth = 1
        NSColor.black.withAlphaComponent(0.14).setStroke()
        under.stroke()
    }

    /// Cyan receipt: pulse the row, then carry it toward the note and fade —
    /// mirroring the passage flowing into the centre editor.
    func flash() {
        flashing = true
        isHidden = false
        alphaValue = 1
        needsDisplay = true
        let start = frame
        NSAnimationContext.runAnimationGroup({ context in
            context.duration = 0.4
            context.timingFunction = CAMediaTimingFunction(name: .easeOut)
            animator().alphaValue = 0
            animator().setFrameOrigin(NSPoint(x: start.origin.x + 14, y: start.origin.y))
        }, completionHandler: { [weak self] in
            guard let self else { return }
            self.isHidden = true
            self.setFrameOrigin(start.origin)
            self.alphaValue = 1
            self.flashing = false
        })
    }
}

private struct LoomQuickLookView: NSViewRepresentable {
    let fileURL: URL

    func makeNSView(context: Context) -> QLPreviewView {
        let view = QLPreviewView(frame: .zero, style: .normal) ?? QLPreviewView()
        view.previewItem = fileURL as QLPreviewItem
        view.autostarts = true
        return view
    }

    func updateNSView(_ nsView: QLPreviewView, context: Context) {
        nsView.previewItem = fileURL as QLPreviewItem
    }
}

extension Notification.Name {
    /// Posted by the parent toolbar's Note button. The active
    /// SourceFileView listens and triggers its existing startNote
    /// handler — Ask AI is reached from INSIDE the Note popover
    /// via the escape hatch (single primitive at the toolbar level).
    static let loomTriggerNote = Notification.Name("loomTriggerNote")
    /// Posted by `handleShuttleNavigate` when the sidebar emits a
    /// `loom://content/...` href for a source file. ContentView listens
    /// and swaps its main content area to `SourceFileView`.
    static let loomOpenSourceFile = Notification.Name("loomOpenSourceFile")
    /// Posted by `LoomMarkdownView` when the user clicks a
    /// `loom://anchor?doc=...&page=N&rect=x,y,w,h` link inside a note.
    /// ContentView resolves the doc within the current root, swaps to
    /// the source file viewer, and asks PDFViewHolder to scroll to
    /// the saved page+rect.
    static let loomJumpToPDFAnchor = Notification.Name("loomJumpToPDFAnchor")
    /// Posted by ContentView after a brief delay (so the new PDFView
    /// has time to mount + load) carrying the page index + rect to
    /// scroll to. SourceFileView listens and routes via PDFViewHolder.
    static let loomApplyPDFAnchor = Notification.Name("loomApplyPDFAnchor")
}

/// SwiftUI wrapper around NSTextView that maps plain Return → submit
/// (chat-app pattern). Shift+Return / Option+Return inserts a real
/// newline. Used by the Ask AI input where ⌘↩ alone wasn't intuitive
/// enough — the user expected Enter to send.
struct ChatTextEditor: NSViewRepresentable {
    @Binding var text: String
    var focused: FocusState<Bool>.Binding
    let onSubmit: () -> Void

    func makeNSView(context: Context) -> NSScrollView {
        let textView = SubmitOnReturnTextView()
        textView.delegate = context.coordinator
        textView.onSubmit = onSubmit
        textView.font = .systemFont(ofSize: 13)
        textView.textColor = NSColor.labelColor
        textView.isRichText = false
        textView.allowsUndo = true
        textView.drawsBackground = false
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.isAutomaticDashSubstitutionEnabled = false
        textView.isAutomaticTextReplacementEnabled = false
        textView.string = text

        let scroll = NSScrollView()
        scroll.documentView = textView
        scroll.drawsBackground = false
        scroll.hasVerticalScroller = true
        scroll.borderType = .noBorder
        scroll.autohidesScrollers = true
        return scroll
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? SubmitOnReturnTextView else { return }
        if textView.string != text {
            textView.string = text
        }
        textView.onSubmit = onSubmit
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, NSTextViewDelegate {
        var parent: ChatTextEditor
        init(_ parent: ChatTextEditor) {
            self.parent = parent
        }
        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.text = textView.string
        }
    }
}

final class SubmitOnReturnTextView: NSTextView {
    var onSubmit: (() -> Void)?

    override func keyDown(with event: NSEvent) {
        // keyCode 36 = Return. Plain Return → submit. Shift / Option /
        // Control / Command modifiers → fall through to default
        // (insert newline, etc.).
        if event.keyCode == 36 {
            let mods = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
            if mods.isEmpty {
                onSubmit?()
                return
            }
            // Shift+Return inserts a literal newline, matching chat
            // app convention.
            if mods == .shift {
                insertNewline(self)
                return
            }
        }
        super.keyDown(with: event)
    }
}
