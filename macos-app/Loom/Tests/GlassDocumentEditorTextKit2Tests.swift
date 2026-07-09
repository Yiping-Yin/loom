import XCTest
import AppKit
@testable import Loom

/// Charter W2-3 — the FULL TextKit 2 migration of the center note editor.
///
/// AppKit births every plain NSTextView as TextKit 2, but the FIRST access to
/// `.layoutManager` silently one-way-downgrades it to TextKit 1 (AppKit posts
/// willSwitchToNSLayoutManagerNotification and the view never comes back).
/// The editor's intrinsicContentSize / mouseDown / anchor flash all touched
/// `.layoutManager`, so the editor spent its whole life downgraded. These
/// tests pin the migrated contract:
///
///  1. the editor SURVIVES its own layout + flash paths on TextKit 2
///     (`textLayoutManager` stays non-nil — the downgrade never fires),
///  2. the intrinsic-height behaviour the outer reading scroll depends on
///     still works (positive, grows with content),
///  3. the RTFD reload contract now lands on TYPED paper attachments
///     (TextKit 2 ignores NSTextAttachmentCell, so the chip/card must be a
///     typed NSTextAttachment subclass vending its NSView through
///     NSTextAttachmentViewProvider — detection is type-based).
///
/// These run against the REAL GrowingGlassTextView inside a real NSWindow —
/// the unit-test host runs in the live Aqua session, so AppKit layout works.
@MainActor
final class GlassDocumentEditorTextKit2Tests: XCTestCase {

    /// The real editor view, hosted in a real (unshown) window, sized so
    /// layout produces genuine line fragments.
    private func makeHostedEditor(_ text: String) -> (window: NSWindow, view: GlassDocumentEditor.GrowingGlassTextView) {
        let view = GlassDocumentEditor.GrowingGlassTextView()
        view.frame = NSRect(x: 0, y: 0, width: 400, height: 300)
        view.isRichText = true
        view.isVerticallyResizable = true
        view.isHorizontallyResizable = false
        view.textContainer?.widthTracksTextView = true
        view.textContainer?.lineFragmentPadding = 0
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 400),
            styleMask: [.titled],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        window.contentView?.addSubview(view)
        view.string = text
        return (window, view)
    }

    // MARK: - ① The one-way downgrade must never fire

    /// THE migration test. A plain NSTextView is born TextKit 2; the moment
    /// any code path touches `.layoutManager` it downgrades forever. The
    /// editor's `intrinsicContentSize` runs on EVERY layout pass, so on the
    /// old code the editor is TextKit 1 within milliseconds of mounting.
    /// After the migration the same passes must leave `textLayoutManager`
    /// alive.
    func testEditorStaysTextKit2AfterLayoutPasses() {
        let (window, view) = makeHostedEditor("First paragraph.\nSecond paragraph.\nThird paragraph.")
        XCTAssertNotNil(view.textLayoutManager,
                        "precondition: a freshly created editor is TextKit 2")

        // The passes the view runs constantly while mounted:
        _ = view.intrinsicContentSize
        window.contentView?.layoutSubtreeIfNeeded()
        _ = view.intrinsicContentSize

        XCTAssertNotNil(view.textLayoutManager,
                        "intrinsicContentSize/layout must not touch .layoutManager — that one-way-downgrades the editor to TextKit 1")
    }

    /// The anchor-flash confirmation (insertPassageAnchor → flashAnchor →
    /// cancelInFlightAnchorFlashes) used TextKit 1 temporary attributes.
    /// Migrated to TextKit 2 rendering attributes it must leave the view on
    /// TextKit 2.
    func testAnchorFlashUsesRenderingAttributesWithoutDowngrading() {
        let (_, view) = makeHostedEditor("Existing note line\n")
        XCTAssertNotNil(view.textLayoutManager,
                        "precondition: a freshly created editor is TextKit 2")

        view.insertPassageAnchor(
            quote: "the passage worth keeping",
            anchorURL: "loom://anchor?src=src-1&page=3&rect=1,2,3,4",
            precise: true
        )
        // The document-swap cancel path runs the same tint-clearing code.
        view.cancelInFlightAnchorFlashes()

        XCTAssertTrue(view.string.contains("the passage worth keeping"),
                      "precondition: the anchored quote landed in the document")
        XCTAssertNotNil(view.textLayoutManager,
                        "the anchor flash must use TextKit 2 rendering attributes, not layoutManager temporary attributes")
    }

    // MARK: - ② The intrinsic-height contract the outer scroll depends on

    /// The editor grows with its content inside the outer reading scroll —
    /// intrinsic height must be positive and increase as paragraphs are
    /// added. (Guards the usageBoundsForTextContainer swap: it returns .zero
    /// before layout, so the migrated code must ensureLayout first.)
    func testIntrinsicHeightIsPositiveAndGrowsWithContent() {
        let (window, view) = makeHostedEditor("Paragraph one.")
        window.contentView?.layoutSubtreeIfNeeded()
        let short = view.intrinsicContentSize.height
        XCTAssertGreaterThan(short, 0, "a one-line document still has real height")

        view.string = (1...30).map { "Paragraph \($0) of a longer working note." }
            .joined(separator: "\n")
        view.invalidateIntrinsicContentSize()
        let tall = view.intrinsicContentSize.height
        XCTAssertGreaterThan(tall, short, "intrinsic height must grow with content")
    }

    // MARK: - ③ RTFD reload lands on TYPED paper attachments

    /// TextKit 2 ignores NSTextAttachmentCell, so after an RTFD reload the
    /// normalize pass must REPLACE the plain NSTextAttachment carrying a
    /// .loomref wrapper with the typed PaperFileAttachment (which vends the
    /// chip view) — and still rebuild the loom-source:// link. The .loomref
    /// wrapper must survive the swap, or the chip dies on the NEXT save.
    func testFileChipAttachmentGetsTypedSubclassAndLinkOnReload() {
        let sourceID = "src-abc123"
        let payload = "\(sourceID)\nReport.pdf"
        let wrapper = FileWrapper(regularFileWithContents: Data(payload.utf8))
        wrapper.preferredFilename = "loomsource-\(sourceID.prefix(8)).loomref"
        // What an RTFD reload hands back: a PLAIN attachment, no cell, no link.
        let reloaded = NSTextAttachment(fileWrapper: wrapper)

        let doc = NSMutableAttributedString(string: "Body line\n")
        let chipStart = doc.length
        doc.append(NSAttributedString(attachment: reloaded))
        doc.append(NSAttributedString(string: "\n"))

        let (_, view) = makeHostedEditor("")
        view.textStorage?.setAttributedString(doc)

        GlassDocumentEditor.normalizeDocument(view, sources: [])

        let normalized = view.textStorage?.attribute(.attachment, at: chipStart, effectiveRange: nil)
        let chip = normalized as? PaperFileAttachment
        XCTAssertNotNil(chip,
                        "after reload-normalize the chip must be the typed PaperFileAttachment (TextKit 2 ignores cells), got \(String(describing: normalized.map { type(of: $0) }))")
        XCTAssertEqual(chip?.sourceID, sourceID, "the chip carries its source ID for click routing")
        XCTAssertEqual(chip?.chipLabel, "Report.pdf", "the chip label survives via the .loomref payload")
        XCTAssertEqual(chip?.fileWrapper?.preferredFilename, wrapper.preferredFilename,
                       "the .loomref wrapper must ride the typed replacement — it is the chip's persistence")

        let rebuilt = view.textStorage?.attribute(.link, at: chipStart, effectiveRange: nil)
        let linkString = (rebuilt as? String) ?? (rebuilt as? URL)?.absoluteString
        XCTAssertEqual(linkString, "loom-source://\(sourceID)",
                       "normalize still rebuilds the chip's source link from the .loomref wrapper")
    }

    /// Same reload story for images: a plain image attachment (an RTFD-
    /// reloaded paper card) becomes the typed PaperImageAttachment so the
    /// paper-card view renders under TextKit 2 — and it must NOT be mistaken
    /// for a source chip (no loom-source link).
    func testImageAttachmentGetsTypedSubclassWithoutSourceLinkOnReload() {
        let reloaded = NSTextAttachment()
        reloaded.image = NSImage(size: NSSize(width: 24, height: 24))

        let doc = NSMutableAttributedString(string: "Body\n")
        let imageStart = doc.length
        doc.append(NSAttributedString(attachment: reloaded))
        doc.append(NSAttributedString(string: "\n"))

        let (_, view) = makeHostedEditor("")
        view.textStorage?.setAttributedString(doc)

        GlassDocumentEditor.normalizeDocument(view, sources: [])

        let normalized = view.textStorage?.attribute(.attachment, at: imageStart, effectiveRange: nil)
        XCTAssertTrue(normalized is PaperImageAttachment,
                      "a reloaded image card must become the typed PaperImageAttachment, got \(String(describing: normalized.map { type(of: $0) }))")
        XCTAssertNil(view.textStorage?.attribute(.link, at: imageStart, effectiveRange: nil),
                     "an image card is not a source chip — normalize must not give it a loom-source link")
    }
}
