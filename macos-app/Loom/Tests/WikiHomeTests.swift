import XCTest
@testable import Loom

/// The Wiki destination's front door (owner trio 2026-07-10: Wiki = inputs +
/// online content organized into a knowledge base). The encyclopedia holds two
/// corpora: the 47 staged chapters AND the owner's OWN article-shaped notes —
/// the workspace→wiki flow. `ownPages` is the pure gate deciding which notes
/// qualify: an explicit top-level `# ` heading plus a non-trivial body — the
/// user SHAPED it (auditable, their judgment), not every scratch note.
final class WikiHomeTests: XCTestCase {

    private func makeCase(id: String, document: String?, touched: TimeInterval? = nil) -> ReflectionCase {
        ReflectionCase(
            id: id, title: "Case \(id)", project: "P", status: "active",
            updatedAt: "12:00", summary: "", tags: [], sources: [], steps: [],
            messages: [], documentText: document,
            touchedAt: touched.map { Date(timeIntervalSince1970: $0) })
    }

    func testArticleShapedNoteQualifiesWithHeadingAsTitle() {
        let doc = "# Attention Is Cheap\n\nThe claim body goes here with real substance beyond a stub."
        let pages = WikiHome.ownPages(from: [makeCase(id: "a", document: doc)])
        XCTAssertEqual(pages.count, 1)
        XCTAssertEqual(pages[0].caseID, "a")
        XCTAssertEqual(pages[0].title, "Attention Is Cheap")
    }

    func testScratchNotesDoNotQualify() {
        // No heading → not an article, however long.
        let noHeading = makeCase(id: "a", document: String(repeating: "prose ", count: 50))
        // Heading but a stub body → not yet a page.
        let stub = makeCase(id: "b", document: "# Title\n\ntiny")
        // Empty / nil documents.
        let empty = makeCase(id: "c", document: "")
        let none = makeCase(id: "d", document: nil)
        XCTAssertTrue(WikiHome.ownPages(from: [noHeading, stub, empty, none]).isEmpty)
    }

    func testPagesOrderNewestFirstByTouchedAt() {
        let old = makeCase(id: "old", document: "# Old page\n\nSubstantial body content for the old article page.", touched: 100)
        let fresh = makeCase(id: "fresh", document: "# Fresh page\n\nSubstantial body content for the fresh article page.", touched: 900)
        let pages = WikiHome.ownPages(from: [old, fresh])
        XCTAssertEqual(pages.map(\.caseID), ["fresh", "old"])
    }
}
