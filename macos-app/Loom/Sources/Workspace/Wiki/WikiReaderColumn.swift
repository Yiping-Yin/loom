import SwiftUI

/// The wiki reading surface — hosts a bundled wiki chapter in LoomWebView
/// (the page's own perfect rendering: KaTeX math baked at build time,
/// pre-rendered diagrams). CHROME lives in the workbench's ONE native
/// toolbar (owner 2026-07-10: 统一 — the same toolbar carries every
/// destination's title and controls), so this column is purely the page on
/// its binding. The corpus ships dark-only CSS (zero `.light` rules; canon:
/// cosmic pages stay dark), so the page keeps its designed dark binding —
/// a dark book open beside the system-appearance sidebar, Books.app-style.
struct WikiReaderColumn: View {
    let manifest: WikiManifest
    @State var currentSlug: String
    var onClose: () -> Void = {}

    @StateObject private var webState = WebDebugState()

    private var pageURL: URL? {
        URL(string: "loom://bundle/wiki/\(currentSlug).html")
    }

    /// THE BOOK's binding colour (dsPaperDeep dark) behind the page.
    private let bookBinding = Color(red: 7 / 255, green: 9 / 255, blue: 12 / 255)

    var body: some View {
        Group {
            if let pageURL {
                LoomWebView(url: pageURL, debugState: webState, forcedTheme: "dark")
                    .id(currentSlug) // remount per chapter — bundle pages are static documents
            } else {
                Text("Chapter not staged in this build.")
                    .font(.system(size: 13, design: .serif))
                    .italic()
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(bookBinding)
        // The wedge loop, wiki edition (owner trio 2026-07-10): a selected
        // passage lands in the CURRENT NOTE as an anchored quote — exactly like
        // the PDF flow — carrying a loom://anchor?wiki= back-link to this
        // chapter. Write your own sentence under it and it comes back in
        // Review; clicking the quote jumps back here. (The workspace subtree
        // stays mounted behind the Wiki destination, so the editor's insert
        // observer is alive to receive this.)
        .onReceive(NotificationCenter.default.publisher(for: .loomCaptureWikiSelection)) { note in
            guard let webPayload = note.userInfo?["webPayload"] as? CaptureWebPayload else { return }
            let quote = webPayload.selection.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !quote.isEmpty else { return }
            let slug = (note.userInfo?["slug"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? currentSlug
            let fragment = note.userInfo?["fragment"] as? String
            NotificationCenter.default.post(
                name: .loomReflectionInsertPassage,
                object: nil,
                userInfo: [
                    "quote": quote,
                    "url": WikiCurriculum.wikiAnchorURL(slug: slug, fragment: fragment),
                    "precise": true,
                ]
            )
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Wiki reader")
    }
}
