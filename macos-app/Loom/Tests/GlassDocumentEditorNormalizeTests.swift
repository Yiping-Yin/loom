import XCTest
import AppKit
@testable import Loom

/// S8 characterization. Restyling one paragraph per keystroke instead of the
/// whole note is only safe if the range-scoped pass (`normalizeEditedRange`)
/// produces BYTE-IDENTICAL styling to the full-document pass for the paragraphs
/// an edit touched. `normalizeParagraph` styles each paragraph purely from its
/// own text / role / anchor attributes (no cross-paragraph dependency) and sets
/// absolute attribute values (so it's idempotent) — therefore a scoped pass
/// over the edited paragraphs must equal a full pass. These tests pin that
/// equality down across the edit shapes S8 has to survive: editing body,
/// editing a heading, and a multi-paragraph paste.
@MainActor
final class GlassDocumentEditorNormalizeTests: XCTestCase {

    private func makeView(_ plain: String) -> NSTextView {
        let view = NSTextView(frame: NSRect(x: 0, y: 0, width: 400, height: 400))
        view.textStorage?.setAttributedString(NSAttributedString(string: plain))
        return view
    }

    /// Insert text into the body paragraph of an already-styled document (the
    /// common keystroke) → scoped pass equals a full re-normalize everywhere.
    func testScopedNormalizeMatchesFullPassForAnEditedBodyParagraph() {
        let doc = "# Heading\nThe body paragraph carries the claim.\n\u{2753} an open question to confirm"
        let full = makeView(doc)
        let scoped = makeView(doc)
        // A document you've been editing is already styled — normalize both.
        GlassDocumentEditor.normalizeDocument(full, sources: [])
        GlassDocumentEditor.normalizeDocument(scoped, sources: [])
        XCTAssertEqual(full.textStorage, scoped.textStorage, "precondition: identical after the full pass")

        // The SAME edit on both: insert " (edited)" inside the body line.
        let insertLoc = ("# Heading\nThe body paragraph" as NSString).length
        let insert = " (edited)"
        for v in [full, scoped] {
            v.textStorage?.replaceCharacters(in: NSRange(location: insertLoc, length: 0), with: insert)
        }

        GlassDocumentEditor.normalizeDocument(full, sources: [])                     // whole document
        GlassDocumentEditor.normalizeEditedRange(                                    // only the edit's paragraphs
            scoped, editedRange: NSRange(location: insertLoc, length: (insert as NSString).length))

        XCTAssertEqual(scoped.textStorage, full.textStorage,
                       "range-scoped normalize must equal the full pass for the edited body paragraph")
    }

    /// Editing a heading line (a different role) restyles identically — the
    /// scoped pass re-derives heading styling from that paragraph alone.
    func testScopedNormalizeMatchesFullPassWhenEditingAHeading() {
        let doc = "# Heading\nBody one.\n## Sub heading\nBody two."
        let full = makeView(doc)
        let scoped = makeView(doc)
        GlassDocumentEditor.normalizeDocument(full, sources: [])
        GlassDocumentEditor.normalizeDocument(scoped, sources: [])

        let insertLoc = ("# Head" as NSString).length   // mid-heading
        let insert = "ers"
        for v in [full, scoped] {
            v.textStorage?.replaceCharacters(in: NSRange(location: insertLoc, length: 0), with: insert)
        }
        GlassDocumentEditor.normalizeDocument(full, sources: [])
        GlassDocumentEditor.normalizeEditedRange(
            scoped, editedRange: NSRange(location: insertLoc, length: (insert as NSString).length))

        XCTAssertEqual(scoped.textStorage, full.textStorage,
                       "editing a heading restyles identically under the scoped pass")
    }

    /// A multi-paragraph paste (newlines in the replacement) must expand to
    /// every pasted paragraph — the scoped pass covers them all, like the full.
    func testScopedNormalizeMatchesFullPassForMultiParagraphPaste() {
        let doc = "# Heading\nBody one."
        let full = makeView(doc)
        let scoped = makeView(doc)
        GlassDocumentEditor.normalizeDocument(full, sources: [])
        GlassDocumentEditor.normalizeDocument(scoped, sources: [])

        let insertLoc = ("# Heading\nBody one." as NSString).length
        let paste = "\n## New section\nA pasted body line."
        for v in [full, scoped] {
            v.textStorage?.replaceCharacters(in: NSRange(location: insertLoc, length: 0), with: paste)
        }
        GlassDocumentEditor.normalizeDocument(full, sources: [])
        GlassDocumentEditor.normalizeEditedRange(
            scoped, editedRange: NSRange(location: insertLoc, length: (paste as NSString).length))

        XCTAssertEqual(scoped.textStorage, full.textStorage,
                       "a multi-paragraph paste restyles every pasted paragraph, matching the full pass")
    }

    // MARK: - TextKit 2 migration safety net (charter W2-3)
    //
    // The editor is still TextKit 1: intrinsicContentSize / mouseDown / the
    // anchor flash all touch `.layoutManager`, which one-way-downgrades the view
    // the moment they run. Flipping to TextKit 2 forces the custom
    // NSTextAttachmentCell cards (image / file chip) onto NSTextAttachmentViewProvider,
    // and that migration must NOT break the RTFD reload contract these tests pin.
    // They pass on TextKit 1 today and must keep passing after the migration —
    // the styling/link logic is pure `textStorage` work, TextKit-version-agnostic.

    /// The file chip's clickable source link is NOT stored in RTFD — only its
    /// `.loomref` file wrapper survives the round trip. `normalizeDocument`
    /// REBUILDS the `loom-source://` link (and the paper-chip cell) on load by
    /// detecting that wrapper. Any TextKit 2 attachment migration (cells →
    /// NSTextAttachmentViewProvider) must preserve this reload contract, so pin
    /// its observable half — the rebuilt link — here.
    func testNormalizeRebuildsFileChipSourceLinkFromLoomrefWrapper() {
        let sourceID = "src-abc123"
        let payload = "\(sourceID)\nReport.pdf"
        let wrapper = FileWrapper(regularFileWithContents: Data(payload.utf8))
        wrapper.preferredFilename = "loomsource-\(sourceID.prefix(8)).loomref"
        let attachment = NSTextAttachment(fileWrapper: wrapper)

        let doc = NSMutableAttributedString(string: "Body line\n")
        let chipStart = doc.length
        doc.append(NSAttributedString(attachment: attachment))
        doc.append(NSAttributedString(string: "\n"))

        let view = makeView("")
        view.textStorage?.setAttributedString(doc)
        // Precondition: RTFD reload dropped the link — the chip is link-less.
        XCTAssertNil(view.textStorage?.attribute(.link, at: chipStart, effectiveRange: nil),
                     "precondition: a freshly reloaded .loomref attachment carries no link yet")

        GlassDocumentEditor.normalizeDocument(view, sources: [])

        let rebuilt = view.textStorage?.attribute(.link, at: chipStart, effectiveRange: nil)
        let linkString = (rebuilt as? String) ?? (rebuilt as? URL)?.absoluteString
        XCTAssertEqual(linkString, "loom-source://\(sourceID)",
                       "normalize must rebuild the chip's source link from the .loomref wrapper on reload")
    }

    /// The reload rebuild is SPECIFIC to file chips: an image card (a plain
    /// image attachment, no `.loomref` wrapper) is not a source, so normalize
    /// must never stamp it with a `loom-source://` link. Pins that the chip
    /// detection can't misfire onto image cards after the view-provider swap.
    func testNormalizeDoesNotAddSourceLinkToAPlainImageAttachment() {
        let attachment = NSTextAttachment()
        attachment.image = NSImage(size: NSSize(width: 24, height: 24))

        let doc = NSMutableAttributedString(string: "Body\n")
        let imageStart = doc.length
        doc.append(NSAttributedString(attachment: attachment))
        doc.append(NSAttributedString(string: "\n"))

        let view = makeView("")
        view.textStorage?.setAttributedString(doc)
        GlassDocumentEditor.normalizeDocument(view, sources: [])

        XCTAssertNil(view.textStorage?.attribute(.link, at: imageStart, effectiveRange: nil),
                     "an image card is not a source chip — normalize must not give it a loom-source link")
    }
}
