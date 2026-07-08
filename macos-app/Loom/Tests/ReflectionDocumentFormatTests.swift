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

    func testCollapsedQuoteFlattensNewlinesToOneParagraph() {
        // A captured quote must be ONE paragraph so the trailing locator glyph
        // shares it (else the earlier lines lose the evidence altitude). Internal
        // newlines + whitespace runs from a multi-line PDF selection collapse to
        // single spaces, trimmed at the edges.
        XCTAssertEqual(ReflectionDocumentFormat.collapsedQuote("a market\norder\nbuys speed"),
                       "a market order buys speed")
        XCTAssertEqual(ReflectionDocumentFormat.collapsedQuote("  spaced   out \n line "),
                       "spaced out line")
        XCTAssertEqual(ReflectionDocumentFormat.collapsedQuote("single"), "single")
    }

    func testAnchorDetectedWhenLinkIsATrailingLocatorNotAtParagraphStart() {
        // New anchor form: the quote TEXT carries no link; a trailing superscript
        // locator glyph does. The whole paragraph must still read as evidence, or
        // normalize would flatten its indent/quiet-ink back to authored baseline.
        let storage = NSTextStorage(string: "\u{201C}a captured quote\u{201D} \u{25C6}\nmy own claim\n")
        let glyphLoc = (storage.string as NSString).range(of: "\u{25C6}").location
        storage.addAttribute(.link, value: "loom://anchor?src=abc&page=2",
                             range: NSRange(location: glyphLoc, length: 1))
        // The paragraph START (the opening quote) has NO link, but the paragraph
        // CONTAINS the anchor locator → still detected as evidence.
        XCTAssertTrue(ReflectionDocumentFormat.isAnchorParagraph(storage, at: 0))
        // The other paragraph carries no anchor → not evidence.
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

    func testDocumentHeadingsDerivesOutlineWithLocations() {
        let text = "# Order types\nsome prose\n## Market orders\nmore prose\n### Edge case\n"
        let outline = ReflectionDocumentFormat.documentHeadings(in: text)
        XCTAssertEqual(outline.map(\.title), ["Order types", "Market orders", "Edge case"])
        XCTAssertEqual(outline.map(\.level), [1, 2, 3])
        // Locations are UTF-16 offsets (+1 per newline) so click-to-jump lands.
        XCTAssertEqual(outline[0].id, 0)
        XCTAssertEqual(outline[1].id, ("# Order types\nsome prose\n" as NSString).length)
    }

    func testDocumentHeadingsSkipsEmptyTitlesAndNonHeadings() {
        let outline = ReflectionDocumentFormat.documentHeadings(in: "##   \nplain\n#\n")
        XCTAssertTrue(outline.isEmpty)
    }

    func testOpenQuestionLineDetection() {
        XCTAssertTrue(ReflectionDocumentFormat.isOpenQuestionLine("\u{2753} Open — does a stop-loss behave like a market order?"))
        XCTAssertTrue(ReflectionDocumentFormat.isOpenQuestionLine("   \u{2753} to confirm: check week 2"))
        XCTAssertFalse(ReflectionDocumentFormat.isOpenQuestionLine("A market order buys speed."))
        XCTAssertFalse(ReflectionDocumentFormat.isOpenQuestionLine("Is this a question?"))
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

    // MARK: - W1-pre · editedRange-scoped normalization domain (charter §8)

    func testNormalizationRangeExpandsEditToWholeParagraphs() {
        let text = "First paragraph.\nSecond paragraph here.\nThird." as NSString
        let edit = NSRange(location: 20, length: 2) // inside "Second…"
        let range = ReflectionDocumentFormat.normalizationRange(in: text, editedRange: edit)
        XCTAssertEqual(range, NSRange(location: 17, length: ("Second paragraph here.\n" as NSString).length))
    }

    func testNormalizationRangeSpanningTwoParagraphsCoversBoth() {
        let text = "Alpha.\nBeta.\nGamma." as NSString
        let edit = NSRange(location: 3, length: 6) // crosses Alpha → Beta
        let range = ReflectionDocumentFormat.normalizationRange(in: text, editedRange: edit)
        XCTAssertEqual(range, NSRange(location: 0, length: ("Alpha.\nBeta.\n" as NSString).length))
    }

    func testNormalizationRangeClampsAtDocumentTail() {
        let text = "One.\nTwo." as NSString
        let caretAtEnd = NSRange(location: text.length, length: 0)
        let range = ReflectionDocumentFormat.normalizationRange(in: text, editedRange: caretAtEnd)
        XCTAssertEqual(range, NSRange(location: 5, length: 4)) // "Two."
    }

    func testParagraphRoleClassification() {
        XCTAssertEqual(ReflectionDocumentFormat.paragraphRole(of: "## Section"),
                       .heading(level: 2, markerLength: 3))
        XCTAssertEqual(ReflectionDocumentFormat.paragraphRole(of: "❓ Open — verify DPO"), .openQuestion)
        XCTAssertEqual(ReflectionDocumentFormat.paragraphRole(of: "Plain claim."), .body)
    }

    // MARK: - W1-pre · open-condition slot (north-star block D)

    func testOpenConditionParsesClosesWhenSlot() {
        XCTAssertEqual(
            ReflectionDocumentFormat.openCondition(ofLine: "❓ Does DPO beat PPO? · closes when: replicated on Tulu"),
            "replicated on Tulu")
        XCTAssertNil(ReflectionDocumentFormat.openCondition(ofLine: "❓ Just a question"))
        XCTAssertNil(ReflectionDocumentFormat.openCondition(ofLine: "Body with closes when: red herring"))
        XCTAssertNil(ReflectionDocumentFormat.openCondition(ofLine: "❓ q · closes when:   "))
    }

    func testOpenConditionMarkerIsCaseInsensitive() {
        XCTAssertEqual(ReflectionDocumentFormat.openCondition(ofLine: "❓ q · Closes When: owner confirms"),
                       "owner confirms")
    }

    func testOpenQuestionColorDerivesFromSystemPalette() {
        let expected = NSColor.systemOrange.blended(withFraction: 0.34, of: .labelColor) ?? .systemOrange
        XCTAssertEqual(ReflectionDocumentFormat.openQuestionColor, expected)
    }
}
