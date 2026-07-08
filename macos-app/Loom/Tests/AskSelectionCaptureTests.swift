import XCTest
import PDFKit
@testable import Loom

/// Tests for AskSelectionCapture — the responder-chain selection reader
/// behind the Edit-menu "Ask Selection" (⌘⇧E) item. Covers the two live
/// Reflection surfaces (NSTextView editors, PDFView readers), the
/// walk-up from PDFKit's internal document view, and the empty-selection
/// cases that must return nil so the AskAI window opens blank instead of
/// carrying a stale passage.
@MainActor
final class AskSelectionCaptureTests: XCTestCase {

    // MARK: NSTextView (center document / notes)

    func testCapturesTextViewSelection() {
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: 300, height: 100))
        textView.string = "The loom weaves quietly at night."
        textView.setSelectedRange(NSRange(location: 4, length: 4)) // "loom"

        let captured = AskSelectionCapture.selection(from: textView, fallbackTitle: "My Notes")
        XCTAssertEqual(captured?.text, "loom")
        XCTAssertEqual(captured?.title, "My Notes")
        XCTAssertNil(captured?.url)
    }

    func testTextViewSelectionIsWhitespaceTrimmed() {
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: 300, height: 100))
        textView.string = "alpha  beta  gamma"
        textView.setSelectedRange(NSRange(location: 5, length: 8)) // "  beta  "

        let captured = AskSelectionCapture.selection(from: textView, fallbackTitle: nil)
        XCTAssertEqual(captured?.text, "beta")
        XCTAssertNil(captured?.title)
    }

    func testCollapsedTextViewSelectionReturnsNil() {
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: 300, height: 100))
        textView.string = "no selection here"
        textView.setSelectedRange(NSRange(location: 3, length: 0))

        XCTAssertNil(AskSelectionCapture.selection(from: textView, fallbackTitle: "Doc"))
    }

    func testWhitespaceOnlyTextViewSelectionReturnsNil() {
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: 300, height: 100))
        textView.string = "word   word"
        textView.setSelectedRange(NSRange(location: 4, length: 3)) // spaces only

        XCTAssertNil(AskSelectionCapture.selection(from: textView, fallbackTitle: "Doc"))
    }

    // MARK: PDFView (in-app reader)

    func testCapturesPDFViewSelection() throws {
        let (pdfView, page) = try makePDFView(text: "Hello selection world")
        let range = try XCTUnwrap(rangeOf("selection", in: page))
        pdfView.setCurrentSelection(page.selection(for: range), animate: false)

        let captured = AskSelectionCapture.selection(from: pdfView, fallbackTitle: "Window Title")
        XCTAssertEqual(captured?.text, "selection")
        // No documentURL on an in-memory PDF → falls back to window title.
        XCTAssertEqual(captured?.title, "Window Title")
        XCTAssertNil(captured?.url)
    }

    func testWalksUpFromPDFKitInternalViewToEnclosingPDFView() throws {
        let (pdfView, page) = try makePDFView(text: "Walk up the responder chain")
        let range = try XCTUnwrap(rangeOf("responder", in: page))
        pdfView.setCurrentSelection(page.selection(for: range), animate: false)

        // Drag-selection leaves PDFKit's internal document view (a
        // subview) as first responder, not the PDFView itself.
        let innerView = try XCTUnwrap(pdfView.documentView)
        let captured = AskSelectionCapture.selection(from: innerView, fallbackTitle: nil)
        XCTAssertEqual(captured?.text, "responder")
    }

    func testEmptyPDFSelectionReturnsNil() throws {
        let (pdfView, _) = try makePDFView(text: "Nothing selected")
        pdfView.setCurrentSelection(nil, animate: false)

        XCTAssertNil(AskSelectionCapture.selection(from: pdfView, fallbackTitle: "Doc"))
    }

    // MARK: Non-text responders

    func testUnrelatedResponderReturnsNil() {
        let plainView = NSView(frame: .zero)
        XCTAssertNil(AskSelectionCapture.selection(from: plainView, fallbackTitle: "Doc"))
        XCTAssertNil(AskSelectionCapture.selection(from: nil, fallbackTitle: "Doc"))
    }

    // MARK: Helpers

    /// Draws `text` into an in-memory one-page PDF and mounts it in a
    /// PDFView, so tests exercise real PDFKit selection machinery.
    private func makePDFView(text: String) throws -> (PDFView, PDFPage) {
        let pageRect = CGRect(x: 0, y: 0, width: 400, height: 200)
        let data = NSMutableData()
        let consumer = try XCTUnwrap(CGDataConsumer(data: data as CFMutableData))
        var mediaBox = pageRect
        let context = try XCTUnwrap(CGContext(consumer: consumer, mediaBox: &mediaBox, nil))
        context.beginPDFPage(nil)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
        (text as NSString).draw(
            at: NSPoint(x: 20, y: 100),
            withAttributes: [.font: NSFont.systemFont(ofSize: 14)]
        )
        NSGraphicsContext.restoreGraphicsState()
        context.endPDFPage()
        context.closePDF()

        let document = try XCTUnwrap(PDFDocument(data: data as Data))
        let page = try XCTUnwrap(document.page(at: 0))
        let pdfView = PDFView(frame: pageRect)
        pdfView.document = document
        return (pdfView, page)
    }

    private func rangeOf(_ needle: String, in page: PDFPage) -> NSRange? {
        guard let pageText = page.string else { return nil }
        let range = (pageText as NSString).range(of: needle)
        return range.location == NSNotFound ? nil : range
    }
}
