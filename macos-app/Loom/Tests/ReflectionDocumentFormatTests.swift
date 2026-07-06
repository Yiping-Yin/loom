import XCTest
import AppKit
@testable import Loom

/// Covers the typographic law extracted from the ~8k-line workspace file
/// (build-order step ①) — including the evidence-altitude detection the
/// two-altitude reading-note form depends on, which had no test before the
/// extraction because it lived inside a `private` view type.
final class ReflectionDocumentFormatTests: XCTestCase {

    func testEvidenceAltitudeIsIndentedAndBaselineIsFlush() {
        let quote = ReflectionDocumentFormat.quoteParagraphStyle
        XCTAssertEqual(quote.firstLineHeadIndent, 22, accuracy: 0.001)
        XCTAssertEqual(quote.headIndent, 22, accuracy: 0.001)
        // Authored text stays flush-left — the altitude gap between your voice
        // and the source's words is the whole point of the form.
        let body = ReflectionDocumentFormat.documentParagraphStyle
        XCTAssertEqual(body.firstLineHeadIndent, 0, accuracy: 0.001)
        XCTAssertEqual(body.headIndent, 0, accuracy: 0.001)
    }

    func testAnchorParagraphDetectionDrivesTheAltitude() {
        let storage = NSTextStorage(string: "\u{201C}a captured quote\u{201D}\nmy own claim\n")
        let quoteLen = ("\u{201C}a captured quote\u{201D}" as NSString).length
        storage.addAttribute(.link, value: "loom://anchor?src=abc&page=2",
                             range: NSRange(location: 0, length: quoteLen))
        // The quote paragraph is EVIDENCE (carries a loom://anchor link)…
        XCTAssertTrue(ReflectionDocumentFormat.isAnchorParagraph(storage, at: 0))
        // …the authored line is NOT — so normalize leaves it at baseline.
        let claimStart = (storage.string as NSString).range(of: "my own claim").location
        XCTAssertFalse(ReflectionDocumentFormat.isAnchorParagraph(storage, at: claimStart))
    }

    func testAnchorDetectionAcceptsURLValuesAndRejectsOtherSchemes() {
        let urlLink = NSTextStorage(string: "x")
        urlLink.addAttribute(.link, value: URL(string: "loom://anchor?x")!,
                             range: NSRange(location: 0, length: 1))
        XCTAssertTrue(ReflectionDocumentFormat.isAnchorParagraph(urlLink, at: 0))

        // A source-chip link is not an evidence quote.
        let sourceLink = NSTextStorage(string: "y")
        sourceLink.addAttribute(.link, value: "loom-source://abc",
                                range: NSRange(location: 0, length: 1))
        XCTAssertFalse(ReflectionDocumentFormat.isAnchorParagraph(sourceLink, at: 0))

        // No link, and out-of-range, are both safely "not evidence".
        XCTAssertFalse(ReflectionDocumentFormat.isAnchorParagraph(NSTextStorage(string: "z"), at: 0))
        XCTAssertFalse(ReflectionDocumentFormat.isAnchorParagraph(sourceLink, at: 99))
    }

    func testHeadingLevelParsing() {
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "# Title").level, 1)
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "## Sub").level, 2)
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "### Deep").level, 3)
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "## Sub").markerLength, 3)
        // Four hashes isn't a level-4 heading (capped at 3, needs a trailing space).
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "#### Nope").level, 0)
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "#NoSpace").level, 0)
        XCTAssertEqual(ReflectionDocumentFormat.headingLevel(of: "plain text").level, 0)
    }
}
