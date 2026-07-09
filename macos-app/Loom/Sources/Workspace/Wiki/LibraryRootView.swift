import SwiftUI

/// The Library window — the owner's LLM wiki (THE BOOK exemplar) read inside
/// LOOM (docs/canon/WHAT_IS_LOOM.md; the wiki-migration Phase-2 mount). Its own
/// window for now, a v1 that doesn't wait on the 3-way IA rebuild; it folds
/// into the left-rail LIBRARY group + reader slot when that lands. Reading
/// works today; selecting a passage posts captureWikiSelection, which the
/// hosting WikiReaderColumn turns into a CaptureSheet (section-level anchor)
/// when a content root exists.
struct LibraryRootView: View {
    @Environment(\.dismissWindow) private var dismissWindow
    private let manifest: WikiManifest? = WikiCurriculum.loadBundled()

    var body: some View {
        if let manifest, let first = manifest.chapters.first {
            WikiReaderColumn(
                manifest: manifest,
                currentSlug: first.slug,
                onClose: { dismissWindow(id: LibraryWindow.id) }
            )
        } else {
            VStack(spacing: 8) {
                Image(systemName: "books.vertical")
                    .font(.system(size: 26))
                    .foregroundStyle(.tertiary)
                Text("The library isn't staged in this build.")
                    .font(.system(size: 14, design: .serif))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

enum LibraryWindow {
    static let id = "com.loom.window.library"
}
