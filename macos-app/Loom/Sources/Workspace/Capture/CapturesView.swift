import SwiftUI
import AppKit
import WebKit

// MARK: Phase A3 follow-up — Captures browser + bookmarklet setup
//
// Solves the "captures go in but never come out" failure mode every
// PKM tool dies of. After Phase A1+A2+A3, the user has a stream of
// captures landing in `LoomFileStore/<rootID>/sub/{Inbox,Web/*}/`,
// but no in-app surface to browse them. CapturesView fills that gap.
//
// The view scans the file store for every `Loom.md` under any active
// root and parses the entries inside. Each entry surfaces as a row
// with its anchor type (Inbox / Web / Page / Passage), title,
// timestamp, and snippet. Rows are clickable — they reveal the
// underlying Loom.md in Finder for now (in-app rendering is Phase C).
//
// Forward-compat note: when Phase C lands (cluster surfacing + wiki
// distillation), this view's data shape feeds directly into the
// "ripening clusters" view. Don't add UI cruft that tightens to the
// flat-list shape; everything filterable should also be groupable.

// MARK: CapturesView

struct CapturesView: View {
    let refreshToken: Int
    private let themeMode: String
    /// Runtime readers return to Sources — the shared root toolbar owns
    /// the back affordance, so the reader's own chrome row is optional.
    private let onBackToSources: () -> Void
    private let showReaderChrome: Bool

    init(refreshToken: Int = 0, themeMode: String = "light") {
        self.init(
            refreshToken: refreshToken,
            themeMode: themeMode,
            showReaderChrome: true,
            onBackToSources: {}
        )
    }

    init(
        refreshToken: Int,
        themeMode: String,
        showReaderChrome: Bool,
        onBackToSources: @escaping () -> Void
    ) {
        self.refreshToken = refreshToken
        self.themeMode = themeMode
        self.showReaderChrome = showReaderChrome
        self.onBackToSources = onBackToSources
    }

    @State private var entries: [CaptureEntry] = []
    @State private var query: String = ""
    @State private var kindFilter: CaptureEntry.Kind? = nil
    @State private var refreshTick: Int = 0
    @State private var pendingDelete: CaptureEntry? = nil
    @State private var deleteError: String? = nil
    @State private var presentingCapture: CaptureEntry? = nil

    /// Phase C M2 toggle. When false, CapturesView hosts the Next.js
    /// magazine landing in a webview. When true, falls back to the
    /// native SwiftUI flat list (kept until delete + reveal parity
    /// is wired back through a webview message bridge).
    private let useNativeList: Bool = false

    private var capturesLandingURL: URL? {
        URL(string: "loom://bundle/loom-render/captures/?refresh=\(refreshToken)")
    }

    var body: some View {
        // Phase C M2 magazine landing — render the captures index
        // through Next.js at /loom-render/captures (PageFrame +
        // pivot bar + CollapseSection per-time-bucket). Row clicks
        // navigate within the same webview to /loom-render/capture/
        // for detail. Browser-style back returns to the magazine.
        //
        // The native SwiftUI list path (header + filters + delete +
        // reveal-in-Finder) is preserved as a fallback hidden behind
        // a `useNativeList` toggle below — keep its codepath alive
        // until the magazine view gets parity for delete / reveal.
        Group {
            if useNativeList, let entry = presentingCapture {
                CaptureReaderView(entry: entry, themeMode: themeMode, showChrome: showReaderChrome) {
                    onBackToSources()
                    presentingCapture = nil
                }
            } else if useNativeList {
                VStack(alignment: .leading, spacing: 0) {
                    header
                    Divider()
                    if entries.isEmpty {
                        emptyState
                    } else {
                        content
                    }
                }
            } else if let url = capturesLandingURL {
                CaptureWebView(url: url, themeMode: themeMode)
            } else {
                Text("Couldn't construct captures URL")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .padding(24)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(NSColor.windowBackgroundColor))
        .onAppear { reload() }
        // Removed onReceive of .loomRefreshActivePage — when in webview
        // mode this triggers `reload()` which mutates @State `entries`,
        // causing SwiftUI to re-evaluate body + re-diff CaptureWebView,
        // which in turn can interrupt the webview's running scroll /
        // hydration. The webview fetches its own data via
        // `loom://native/captures-list.json` on mount, so refreshing
        // SwiftUI-side entries is redundant + harmful here.
        .alert(
            "Delete this capture?",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            presenting: pendingDelete
        ) { e in
            Button("Delete", role: .destructive) {
                do {
                    try CapturesIndex.delete(e)
                    reload()
                } catch {
                    deleteError = error.localizedDescription
                }
                pendingDelete = nil
            }
            Button("Cancel", role: .cancel) { pendingDelete = nil }
        } message: { e in
            Text("\(e.title.isEmpty ? "(untitled)" : e.title) — rewrites \(e.fileURL.lastPathComponent) to remove this entry. The Loom.md keeps everything else.")
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
        } message: { msg in
            Text(msg)
        }
    }

    private func reload() {
        entries = CapturesIndex.loadAll()
        refreshTick &+= 1
    }

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text("Captures")
                    .font(.system(size: 24, weight: .semibold, design: .serif))
                Text("\(filtered.count)")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    reload()
                } label: {
                    Label("Reload", systemImage: "arrow.clockwise")
                        .font(.system(size: 11, design: .serif))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
            }
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.tertiary)
                    .font(.system(size: 11))
                TextField("Filter by title or snippet…", text: $query)
                    .textFieldStyle(.plain)
                    .font(.system(size: 12, design: .serif))
                if !query.isEmpty {
                    Button { query = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.tertiary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.secondary.opacity(0.08))
            )
            HStack(spacing: 4) {
                kindChip(label: "All", isSelected: kindFilter == nil) { kindFilter = nil }
                ForEach(CaptureEntry.Kind.allCases) { k in
                    let count = entries.filter { $0.kind == k }.count
                    if count > 0 {
                        kindChip(
                            label: "\(k.label) · \(count)",
                            isSelected: kindFilter == k
                        ) {
                            kindFilter = (kindFilter == k) ? nil : k
                        }
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
        .padding(.bottom, 12)
    }

    @ViewBuilder
    private func kindChip(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 10, design: .serif).smallCaps())
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule().fill(
                        isSelected ? Color.accentColor.opacity(0.18) : Color.secondary.opacity(0.08)
                    )
                )
                .overlay(
                    Capsule().stroke(
                        isSelected ? Color.accentColor.opacity(0.45) : Color.secondary.opacity(0.2),
                        lineWidth: 1
                    )
                )
        }
        .buttonStyle(.plain)
    }

    private var filtered: [CaptureEntry] {
        let q = query.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        return entries.filter { e in
            if let k = kindFilter, e.kind != k { return false }
            if q.isEmpty { return true }
            return e.title.lowercased().contains(q)
                || e.snippet.lowercased().contains(q)
                || e.domain.lowercased().contains(q)
                || e.rootLabel.lowercased().contains(q)
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "tray")
                .font(.system(size: 32))
                .foregroundStyle(.tertiary)
            Text("No captures yet.")
                .font(.system(size: 14, design: .serif))
                .foregroundStyle(.secondary)
            Text("⌘⇧L for a quick note · ⌘⇧V on a PDF selection · install the Web Capture bookmarklet to clip from any browser.")
                .font(.system(size: 11, design: .serif))
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 60)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private var content: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(filtered) { e in
                    captureRow(e)
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 16)
        }
    }

    @ViewBuilder
    private func captureRow(_ e: CaptureEntry) -> some View {
        // Don't use a Button as the outer container: nested Buttons on
        // macOS forward the click to the outermost Button, so the trash
        // / reveal icons fire row-open instead. Use a tappable shape.
        return HStack(alignment: .top, spacing: 10) {
                Image(systemName: e.kind.icon)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(width: 18, alignment: .center)
                    .padding(.top, 2)
                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(e.title.isEmpty ? "(untitled)" : e.title)
                            .font(.system(size: 13, weight: .semibold, design: .serif))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                        Text(secondaryLabel(e))
                            .font(.system(size: 9, design: .serif).smallCaps())
                            .foregroundStyle(.tertiary)
                        Spacer(minLength: 0)
                    }
                    if !e.snippet.isEmpty {
                        Text(e.snippet)
                            .font(.system(size: 11, design: .serif))
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                    if !e.eyebrow.isEmpty {
                        Text(e.eyebrow)
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                HStack(spacing: 4) {
                    Button {
                        NSWorkspace.shared.activateFileViewerSelecting([e.fileURL])
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .padding(4)
                    }
                    .buttonStyle(.plain)
                    .help("Reveal in Finder")
                    Button {
                        pendingDelete = e
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                            .padding(4)
                    }
                    .buttonStyle(.plain)
                    .help("Delete this capture from Loom.md")
                }
        }
        .padding(10)
        .contentShape(Rectangle())
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(Color.secondary.opacity(0.05))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(Color.secondary.opacity(0.12), lineWidth: 1)
        )
        .onTapGesture {
            // Open inside Loom using the existing markdown renderer
            // that other notes use (LoomMarkdownView). Same in-app
            // viewing experience as a Page — no system default app
            // routing, no Xcode / iA Writer source view. Phase C will
            // upgrade this to shape-aware rendering (list grid /
            // article / passage / etc.). For now: vellum-styled
            // markdown via the existing renderer.
            presentingCapture = e
        }
    }

    private func secondaryLabel(_ e: CaptureEntry) -> String {
        switch e.kind {
        case .web:     return e.domain.isEmpty ? "Web" : "Web · \(e.domain)"
        case .inbox:   return "Inbox · \(e.rootLabel)"
        case .page:    return "Page · \(e.rootLabel)"
        case .passage: return "Passage · \(e.rootLabel)"
        case .other:   return e.rootLabel
        }
    }
}

// MARK: In-Loom capture reader (inline navigation)

/// Opens a Loom.md inside the main Loom window — same renderer
/// (LoomMarkdownView / ListGridView) that every other note uses.
/// Solves both "opens in Xcode / iA Writer" AND "sheet too small,
/// not draggable" — the reader inherits the parent Loom window so
/// it's full-size and behaves like every other route.
///
/// Phase C M1: dispatches by detected shape (list / article).
/// Future M2-M3 add passage / conversation / syllabus shapes.
struct CaptureReaderView: View {
    let entry: CaptureEntry
    var themeMode: String = "light"
    /// The minimal shell's shared root toolbar already carries the
    /// Sources back affordance; readers mounted there hide this row so
    /// the installed app never shows a second back strip.
    var showChrome: Bool = true
    var onBack: () -> Void

    @State private var source: String = ""
    @State private var loadError: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Minimal SwiftUI chrome — title / eyebrow / source URL all
            // live inside the webview's PageFrame now. Native bar
            // carries only the back-to-Sources button + reveal-in-Finder
            // so the visual hierarchy isn't doubled.
            if showChrome {
                HStack(spacing: 10) {
                    Button {
                        onBack()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 11, weight: .medium))
                            Text("Sources")
                                .font(.system(size: 12, design: .serif))
                        }
                        .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut(.cancelAction)
                    .help("Back to Sources (Esc)")
                    Spacer()
                    Button {
                        NSWorkspace.shared.activateFileViewerSelecting([entry.fileURL])
                    } label: {
                        Image(systemName: "folder")
                            .font(.system(size: 12))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .help("Reveal Loom.md in Finder")
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 10)
                Divider()
            }
            // Phase C M1 / Path B: render through the Next.js
            // /loom-render/capture route (PageFrame + WorkSurface +
            // NoteRenderer with KaTeX/marked) instead of native
            // SwiftUI markdown. WKWebView resolves loom://bundle/
            // (static export) and loom://native/capture-content.json
            // (entry data) via the same scheme handler the main app
            // uses. Visual parity with /llm-wiki etc., gained for
            // free; one source of truth for Vellum styling.
            if let captureURL = renderURL {
                CaptureWebView(url: captureURL, themeMode: themeMode)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text("Couldn't construct capture URL")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .padding(24)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(NSColor.windowBackgroundColor))
    }

    /// Builds the `loom://bundle/loom-render/capture/?root=…&sub=…&title=…&eyebrow=…`
    /// URL the WKWebView loads. The Next.js page reads these query
    /// params and fetches the entry payload from
    /// `loom://native/capture-content.json?` — same params, native
    /// JSON bridge slices the Loom.md and returns the body.
    private var renderURL: URL? {
        // entry.subPath stores the raw relative path under the root —
        // includes the leading `sub/` segment because the file store
        // physically nests pages under `<rootID>/sub/<…>/Loom.md`.
        // LoomFileStore.loomMDURL(for:subPath:) adds the `sub/` segment
        // itself, so the value passed to the native bridge must NOT
        // include it (otherwise the bridge tries `sub/sub/…/Loom.md`).
        let raw = entry.subPath
        let cleanSub: String
        if raw.hasPrefix("sub/") {
            cleanSub = String(raw.dropFirst(4))
        } else if raw == "sub" {
            cleanSub = ""
        } else {
            cleanSub = raw
        }

        var components = URLComponents()
        components.scheme = "loom"
        components.host = "bundle"
        components.path = "/loom-render/capture/"
        components.queryItems = [
            URLQueryItem(name: "root", value: entry.rootID.uuidString.lowercased()),
            URLQueryItem(name: "sub", value: cleanSub),
            URLQueryItem(name: "title", value: entry.title),
            URLQueryItem(name: "eyebrow", value: entry.eyebrow),
        ]
        return components.url
    }

    private var secondaryLabel: String {
        switch entry.kind {
        case .web:     return entry.domain.isEmpty ? "Web" : "Web · \(entry.domain)"
        case .inbox:   return "Inbox · \(entry.rootLabel)"
        case .page:    return "Page · \(entry.rootLabel)"
        case .passage: return "Passage · \(entry.rootLabel)"
        case .other:   return entry.rootLabel
        }
    }

    /// Extract just this entry's `### heading` block from the file.
    /// Captures live as siblings inside one Loom.md; rendering the
    /// whole file would dump every entry on top of each other. Match
    /// by heading title + nearby eyebrow line, same logic as delete.
    ///
    /// Also strips the redundant header lines (title heading, eyebrow,
    /// `From [title](url)` source line) since the reader's chrome
    /// header already shows those — leaving them in the body produced
    /// "title shown 3 times" stacked at the top of every capture.
    private func entrySlice(in full: String) -> String {
        let lines = full.components(separatedBy: "\n")
        let headingNeedle = "### " + entry.title
        let eyebrowNeedle = entry.eyebrow.isEmpty ? nil : "*\(entry.eyebrow)*"

        var startIdx: Int? = nil
        var i = 0
        while i < lines.count {
            if lines[i] == headingNeedle {
                if let needle = eyebrowNeedle {
                    var matched = false
                    let lookahead = min(i + 6, lines.count)
                    for j in (i + 1)..<lookahead {
                        if lines[j].trimmingCharacters(in: .whitespaces) == needle {
                            matched = true
                            break
                        }
                    }
                    if !matched { i += 1; continue }
                }
                startIdx = i
                break
            }
            i += 1
        }
        guard let start = startIdx else {
            return ""
        }
        var end = lines.count
        for k in (start + 1)..<lines.count {
            if CapturesIndex.isCaptureHeadingLine(lines, at: k) { end = k; break }
        }

        // Trim redundant header chrome from the body. The reader view's
        // own header already shows title + eyebrow + source URL.
        var bodyLines = Array(lines[start..<end])
        // Drop the heading line itself.
        if let first = bodyLines.first, first == headingNeedle {
            bodyLines.removeFirst()
        }
        // Drop the eyebrow line + any blank lines around it.
        while let line = bodyLines.first {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty {
                bodyLines.removeFirst()
                continue
            }
            if let needle = eyebrowNeedle, trimmed == needle {
                bodyLines.removeFirst()
                continue
            }
            // Drop the writer-emitted "From [title](url)" source line.
            if trimmed.range(of: #"^From \[[^\]]+\]\([^)]+\)\s*$"#, options: .regularExpression) != nil {
                bodyLines.removeFirst()
                continue
            }
            break
        }
        return bodyLines.joined(separator: "\n")
    }
}

// MARK: - Capture setup workbench

/// Capture-tools workbench: one continuous product surface with a
/// primary tool lane (local file intake, browser extension, and
/// bookmarklet install) and an inspector status lane describing how
/// captures flow into Sources. The root shell owns the top body-start
/// inset; this view keeps only its bottom breathing room. It shares
/// the root app canvas background so the desktop never splits into a
/// grid of independent cards.
struct WebCaptureSetupView: View {
    /// Hairline between the primary tool lane and the inspector lane.
    private var toolColumnDivider: some View {
        Rectangle()
            .fill(LoomTokens.dsInk3.opacity(0.18))
            .frame(width: 1)
    }

    var body: some View {
        ScrollView {
            HStack(alignment: .top, spacing: 0) {
                VStack(alignment: .leading, spacing: DSSpace.lg.value) {
                    fileIntakeCard
                    extensionInstallCard
                    installCard
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .padding(.trailing, DSSpace.lg.value)
                toolColumnDivider
                VStack(alignment: .leading, spacing: DSSpace.lg.value) {
                    captureFlowCard
                }
                .frame(width: 280, alignment: .topLeading)
                .padding(.leading, DSSpace.lg.value)
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 28)
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .background(LoomTokens.dsPaperDeep)
    }

    /// Local files are the primary intake: drop or pick PDFs, DOCX,
    /// slides, Pages, Markdown, and images straight into Sources.
    private var fileIntakeCard: some View {
        VStack(alignment: .leading, spacing: DSSpace.sm.value) {
            Text("Add files")
                .font(.system(size: 14, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Text("Drop files anywhere in the Loom window, or use Add files in the Sources toolbar. PDFs, DOCX, slides, Pages, Markdown, and images land in Sources with their text extracted.")
                .font(.system(size: 12, design: .serif))
                .foregroundStyle(LoomTokens.dsInk2)
            Button {
                NotificationCenter.default.post(name: .loomSourcesAddFiles, object: nil)
            } label: {
                Label("Add files", systemImage: "plus")
                    .font(.system(size: 12, design: .serif))
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }

    /// Browser-extension capture path.
    private var extensionInstallCard: some View {
        VStack(alignment: .leading, spacing: DSSpace.sm.value) {
            Text("Browser extension")
                .font(.system(size: 14, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Text("Install the Loom capture extension to clip pages and selections from your browser. Settings > Capture has the install steps.")
                .font(.system(size: 12, design: .serif))
                .foregroundStyle(LoomTokens.dsInk2)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }

    /// Bookmarklet install path — the universal no-extension fallback.
    private var installCard: some View {
        VStack(alignment: .leading, spacing: DSSpace.sm.value) {
            Text("Bookmarklet")
                .font(.system(size: 14, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Text("No extension? Drag the capture bookmarklet to your bookmarks bar from Help > Set Up Captures…. One click sends the page back to Loom.")
                .font(.system(size: 12, design: .serif))
                .foregroundStyle(LoomTokens.dsInk2)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }

    /// Inspector status lane: where captures land and how to read them.
    private var captureFlowCard: some View {
        VStack(alignment: .leading, spacing: DSSpace.sm.value) {
            Text("How captures flow")
                .font(.system(size: 12, weight: .semibold, design: .serif))
                .foregroundStyle(LoomTokens.dsInk1)
            Text("Captures land in your source folders as Loom.md entries. Recent captures surface on the Sources workbench; open one to read it inside Loom and send passages into Draft.")
                .font(.system(size: 11, design: .serif))
                .foregroundStyle(LoomTokens.dsInk2)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
    }
}
