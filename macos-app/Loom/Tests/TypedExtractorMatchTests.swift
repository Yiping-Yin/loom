import XCTest
@testable import Loom

final class TypedExtractorMatchTests: XCTestCase {
    func testSlideDeckMatchScoreTable() {
        XCTAssertEqual(SlideDeckExtractor.match(filename: "deck.pptx", parentPath: "Week 1", sample: ""), 0.9)
        XCTAssertEqual(SlideDeckExtractor.match(filename: "slides.key", parentPath: "Week 1", sample: ""), 0.9)
        XCTAssertEqual(
            SlideDeckExtractor.match(
                filename: "deck.pdf",
                parentPath: "Week 1",
                sample: Array(repeating: "Short line\n", count: 60).joined()
            ),
            0.7
        )
        XCTAssertEqual(SlideDeckExtractor.match(filename: "article.pdf", parentPath: "Week 1", sample: String(repeating: "long prose paragraph ", count: 80)), 0.0)
        XCTAssertEqual(SlideDeckExtractor.match(filename: "notes.md", parentPath: "Desk", sample: "# Notes"), 0.0)
    }

    func testTextbookMatchScoreTable() {
        XCTAssertEqual(TextbookChapterExtractor.match(filename: "Chapter 03.pdf", parentPath: "Book", sample: ""), 0.85)
        XCTAssertEqual(TextbookChapterExtractor.match(filename: "ch_04-notes.pdf", parentPath: "Book", sample: ""), 0.85)
        XCTAssertEqual(TextbookChapterExtractor.match(filename: "Section 2 reading.pdf", parentPath: "Book", sample: ""), 0.85)
        XCTAssertEqual(
            TextbookChapterExtractor.match(
                filename: "reading.pdf",
                parentPath: "Book",
                sample: "ISBN " + String(repeating: "long reference text ", count: 120)
            ),
            0.7
        )
        XCTAssertEqual(TextbookChapterExtractor.match(filename: "lecture-notes.pdf", parentPath: "Week 1", sample: "short"), 0.0)
    }

    func testRegistryRoutesRepresentativeInputs() {
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "Course Overview_FINS3640.pdf", parentPath: "Week 0", sample: "").extractorId,
            SyllabusPDFExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "lecture.vtt", parentPath: "Week 1", sample: "").extractorId,
            TranscriptExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "grades.csv", parentPath: "Term", sample: "Name,Score").extractorId,
            SpreadsheetExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "deck.pptx", parentPath: "Week 1", sample: "").extractorId,
            SlideDeckExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "chapter-2.pdf", parentPath: "Readings", sample: "").extractorId,
            TextbookChapterExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "notes.md", parentPath: "Desk", sample: "# Notes").extractorId,
            MarkdownNotesExtractor.extractorId
        )
        XCTAssertEqual(
            ExtractorRegistry.bestMatch(filename: "archive.bin", parentPath: "Desk", sample: "opaque").extractorId,
            GenericDocExtractor.extractorId
        )
    }

    // MARK: - Local image import (Vision OCR + semantic labels)
    //
    // `LocalImageImportText.build` runs Vision OCR + classification at
    // call time, which is not hermetic, so these tests exercise the pure
    // composition helpers (`imageSummary`) with fixed inputs instead of
    // shelling out to the live Vision stack.

    func testLocalImageImportTextIncludesRecognizedOCRTextWhenAvailable() {
        let summary = LocalImageImportText.imageSummary(
            recognizedText: "Quarterly revenue grew 12%",
            visualDescriptions: ["chart", "document"]
        )
        XCTAssertTrue(summary.contains("words of recognized text"),
                      "summary should report recognized OCR word count; got: \(summary)")
        XCTAssertTrue(summary.contains("chart"))
    }

    func testLocalImageImportTextKeepsVisualFallbackWhenOCRFindsNoText() {
        let summary = LocalImageImportText.imageSummary(
            recognizedText: "",
            visualDescriptions: ["photograph", "outdoor"]
        )
        XCTAssertTrue(summary.contains("no recognized text"),
                      "no-OCR images keep a visual provenance fallback; got: \(summary)")
        XCTAssertTrue(summary.contains("photograph"))
    }

    func testLocalImageImportTextIncludesSemanticVisualDescriptionsBeyondOCR() {
        let visualDescriptions: [String] = ["diagram", "flowchart", "text"]
        let summary = LocalImageImportText.imageSummary(
            recognizedText: "",
            visualDescriptions: visualDescriptions
        )
        // Semantic labels appear even when OCR produced nothing.
        XCTAssertTrue(summary.contains("diagram"))
        XCTAssertTrue(summary.contains("flowchart"))
    }

    func testLocalImageImportTextAddsReadableImageSummary() {
        let withLabels = LocalImageImportText.imageSummary(
            recognizedText: "hello world",
            visualDescriptions: ["screenshot"]
        )
        XCTAssertTrue(withLabels.contains("·"),
                      "summary should be a readable one-liner; got: \(withLabels)")

        let withoutLabels = LocalImageImportText.imageSummary(
            recognizedText: "",
            visualDescriptions: []
        )
        XCTAssertTrue(withoutLabels.contains("no semantic labels"),
                      "summary should note absent labels; got: \(withoutLabels)")
    }
}
