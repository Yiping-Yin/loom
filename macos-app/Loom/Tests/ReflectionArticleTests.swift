import XCTest
@testable import Loom

/// G8 (produce systematized knowledge) — the pure, no-AI provenance gatherer.
/// Turning a note into a wiki-shaped article starts with its own sources; the
/// user writes the prose (generation-effect red line), the workbench gathers
/// the "Reading" the way the wiki's articles carry theirs.
final class ReflectionArticleTests: XCTestCase {

    /// A note the editor writes: quote text + a linked locator glyph per anchor.
    private func note(_ pairs: [(quote: String, anchor: String)]) -> NSAttributedString {
        let doc = NSMutableAttributedString()
        for (i, p) in pairs.enumerated() {
            if i > 0 { doc.append(NSAttributedString(string: "\n")) }
            doc.append(NSAttributedString(string: "\u{201C}\(p.quote)\u{201D}"))
            doc.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: p.anchor]))
        }
        return doc
    }

    func testReadingListGathersUniqueAnchorsInOrderWithTheirQuotes() {
        let doc = note([
            (quote: "The reward model disappears.", anchor: "loom://anchor?src=dpo"),
            (quote: "Clip the ratio.", anchor: "loom://anchor?src=ppo"),
        ])
        let list = ReflectionArticle.readingList(from: doc)
        XCTAssertEqual(list.count, 2)
        XCTAssertEqual(list[0].anchorURL, "loom://anchor?src=dpo")
        XCTAssertTrue(list[0].quote.contains("reward model disappears"))
        XCTAssertFalse(list[0].quote.contains("\u{25C6}"), "the locator glyph is stripped from the quote")
        XCTAssertEqual(list[1].anchorURL, "loom://anchor?src=ppo")
    }

    func testReadingListDedupesRepeatedAnchors() {
        let doc = note([
            (quote: "First mention.", anchor: "loom://anchor?src=dpo"),
            (quote: "Second mention, same source.", anchor: "loom://anchor?src=dpo"),
        ])
        XCTAssertEqual(ReflectionArticle.readingList(from: doc).count, 1)
    }

    func testReadingSectionIsNilWithoutAnchors() {
        let doc = NSAttributedString(string: "Just prose, no anchors.")
        XCTAssertNil(ReflectionArticle.readingSection(from: doc))
    }

    func testReadingSectionRendersMarkdownList() {
        let doc = note([(quote: "Key claim.", anchor: "loom://anchor?src=x")])
        let section = ReflectionArticle.readingSection(from: doc)
        XCTAssertNotNil(section)
        XCTAssertTrue(section!.hasPrefix("## Reading"))
        XCTAssertTrue(section!.contains("Key claim"))
    }
}
