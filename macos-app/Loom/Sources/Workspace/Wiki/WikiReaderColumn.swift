import SwiftUI

/// The wiki reading surface — hosts a bundled wiki chapter in LoomWebView
/// (the page's own perfect rendering: KaTeX math baked at build time,
/// pre-rendered diagrams) with the same quiet reader chrome grammar the
/// PDF reader uses: title row, spine prev/next, a quiet ✕.
///
/// Built unmounted in wiki-migration step 4; Phase 2 (after the in-flight
/// shell file lands) docks it in the reader column slot next to the note.
/// Capture: the in-page WikiCaptureChip posts `captureWikiSelection`
/// through NavigationBridgeHandler; THIS view presents the CaptureSheet
/// (section-level anchor, lands in Web/wiki/ — "the wiki is the map,
/// the papers are the territory").
struct WikiReaderColumn: View {
    let manifest: WikiManifest
    @State var currentSlug: String
    var onClose: () -> Void = {}

    @StateObject private var webState = WebDebugState()
    @AppStorage("theme") private var theme: String = "dark"
    @State private var capturePayload: CapturePayload?

    private var chapter: WikiChapter? {
        manifest.chapters.first { $0.slug == currentSlug }
    }

    private var pageURL: URL? {
        URL(string: "loom://bundle/wiki/\(currentSlug).html")
    }

    var body: some View {
        VStack(spacing: 0) {
            chromeRow
            Divider()
            if let pageURL {
                LoomWebView(url: pageURL, debugState: webState, forcedTheme: theme == "light" ? "light" : "dark")
                    .id(currentSlug) // remount per chapter — bundle pages are static documents
            } else {
                Text("Chapter not staged in this build.")
                    .font(.system(size: 13, design: .serif))
                    .italic()
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .sheet(isPresented: Binding<Bool>(
            get: { capturePayload != nil },
            set: { if !$0 { capturePayload = nil } }
        )) {
            CaptureSheet(payload: $capturePayload, onSaved: { _ in })
        }
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureWikiSelection)) { note in
            guard let webPayload = note.userInfo?["webPayload"] as? CaptureWebPayload else { return }
            let anchors = CaptureAnchorResolver.resolveForWebCapture(webPayload, preferredRootID: nil)
            guard let primary = anchors.first else { return }
            capturePayload = CapturePayload.makeFromWebPayload(webPayload, anchor: primary, available: anchors)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Wiki reader")
    }

    private var chromeRow: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text(chapter?.title ?? currentSlug)
                    .font(.system(size: 12.5, design: .serif))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                if let chapter {
                    Text(WikiCurriculum.folioLine(for: chapter))
                        .font(.system(size: 10, design: .serif))
                        .italic()
                        .foregroundStyle(.tertiary)
                }
            }
            Spacer()
            let neighbors = WikiCurriculum.neighbors(of: currentSlug, in: manifest)
            Button { if let p = neighbors.prev { currentSlug = p.slug } } label: {
                Image(systemName: "chevron.left")
            }
            .disabled(neighbors.prev == nil)
            .help(neighbors.prev.map { "Previous: \($0.title)" } ?? "First chapter")
            .accessibilityLabel("Previous chapter")
            Button { if let n = neighbors.next { currentSlug = n.slug } } label: {
                Image(systemName: "chevron.right")
            }
            .disabled(neighbors.next == nil)
            .help(neighbors.next.map { "Next: \($0.title)" } ?? "Last chapter")
            .accessibilityLabel("Next chapter")
            Divider().frame(height: 14)
            Button { onClose() } label: { Image(systemName: "xmark") }
                .help("Close reader")
                .accessibilityLabel("Close wiki reader")
        }
        .buttonStyle(.plain)
        .font(.system(size: 12))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
}
