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
}
