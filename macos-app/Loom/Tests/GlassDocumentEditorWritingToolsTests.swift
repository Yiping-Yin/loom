import XCTest
import SwiftUI
import AppKit
@testable import Loom

/// Charter W1-1⑥ (§10) — Writing Tools session guard. TextKit 2 gives the
/// editor the FULL inline Writing Tools experience on macOS 27, which means
/// Apple's machinery rewrites the storage while animating. LOOM's own
/// per-keystroke machinery must stand down for the duration:
///
///  - while a session is active, `textDidChange` runs NO normalize (neither
///    the range-scoped nor the full pass) and schedules NO save — a
///    half-rewritten document must never be styled against or persisted;
///  - when the session ends, exactly ONE full normalize + ONE save land the
///    rewritten text styled and persisted atomically;
///  - `loom://` anchor locator glyphs (and `loom-source://` file chips) are
///    declared as ignored ranges so a rewrite can't eat a quote's way back
///    to its source.
///
/// The Coordinator is driven directly through its NSTextViewDelegate methods —
/// the same calls AppKit makes — with the save paths spied so no test ever
/// writes into the real CaseDocuments store.
@MainActor
final class GlassDocumentEditorWritingToolsTests: XCTestCase {

    /// Coordinator with the persistence side-doors stubbed: counts calls,
    /// never touches the real RTFD store or ReviewStore.
    private final class SpyCoordinator: GlassDocumentEditor.Coordinator {
        var scheduledSaves = 0
        var immediateSaves = 0
        override func scheduleDocumentSave(_ view: NSTextView) { scheduledSaves += 1 }
        override func saveDocumentNow(_ view: NSTextView) { immediateSaves += 1 }
    }

    private func makeSpy(onTextChange: @escaping (String) -> Void = { _ in }) -> SpyCoordinator {
        SpyCoordinator(
            caseID: "writing-tools-test-\(UUID().uuidString)",
            focusRequest: 0,
            sources: [],
            onTextChange: onTextChange,
            onImportFiles: { _ in [] },
            onOpenSource: { _ in }
        )
    }

    private func makeView(_ plain: String) -> NSTextView {
        let view = NSTextView(frame: NSRect(x: 0, y: 0, width: 400, height: 400))
        view.isRichText = true
        view.textStorage?.setAttributedString(NSAttributedString(string: plain))
        return view
    }

    private func didChangeNotification(_ view: NSTextView) -> Notification {
        Notification(name: NSText.didChangeNotification, object: view)
    }

    // MARK: - ① While a session is active, LOOM stands down

    func testActiveSessionSuspendsNormalizeAndSave() {
        let doc = "# Heading\nBody text."
        let view = makeView(doc)
        var lastText: String?
        let coordinator = makeSpy(onTextChange: { lastText = $0 })

        coordinator.textViewWritingToolsWillBegin(view)

        // Simulate Writing Tools rewriting the storage, then the view's
        // textDidChange reaching the delegate (as AppKit does). The control
        // view receives the IDENTICAL edit but no delegate call — the only
        // difference the assertion can see is whether normalize ran.
        let control = makeView(doc)
        for v in [view, control] {
            v.textStorage?.replaceCharacters(
                in: NSRange(location: (doc as NSString).length, length: 0),
                with: " Rewritten by Writing Tools.")
        }
        coordinator.textDidChange(didChangeNotification(view))

        // NOT normalized: byte-identical to the untouched control.
        XCTAssertEqual(view.textStorage, control.textStorage,
                       "normalize must not run against a mid-session Writing Tools rewrite")
        // NOT saved: neither the debounced nor the immediate path fired.
        XCTAssertEqual(coordinator.scheduledSaves, 0,
                       "a half-rewritten document must never be scheduled for persistence")
        XCTAssertEqual(coordinator.immediateSaves, 0)
        // The SwiftUI mirror stays in step (otherwise updateNSView would
        // stomp the rewrite with the stale document text).
        XCTAssertEqual(lastText, view.string)

        // Focus loss mid-session must not sneak a save in either.
        coordinator.textDidEndEditing(didChangeNotification(view))
        XCTAssertEqual(coordinator.immediateSaves, 0,
                       "textDidEndEditing must stand down during a Writing Tools session")
    }

    // MARK: - ② Session end lands ONE normalize + ONE save, atomically

    func testDidEndRunsExactlyOneNormalizeAndOneSave() {
        let doc = "# Heading\nBody rewritten by Writing Tools."
        let view = makeView(doc)
        var lastText: String?
        let coordinator = makeSpy(onTextChange: { lastText = $0 })

        coordinator.textViewWritingToolsWillBegin(view)
        coordinator.textDidChange(didChangeNotification(view))
        coordinator.textViewWritingToolsDidEnd(view)

        // Styled: the storage now equals a reference normalized once.
        let reference = makeView(doc)
        GlassDocumentEditor.normalizeDocument(reference, sources: [])
        XCTAssertEqual(view.textStorage, reference.textStorage,
                       "session end must run one full normalize over the rewritten text")
        // Persisted exactly once, immediately (not debounced).
        XCTAssertEqual(coordinator.immediateSaves, 1,
                       "session end must persist the rewritten document once, atomically")
        XCTAssertEqual(coordinator.scheduledSaves, 0)
        XCTAssertEqual(lastText, view.string)

        // And the machinery is back on: a normal keystroke normalizes and
        // schedules again.
        let insertAt = (view.string as NSString).length
        XCTAssertTrue(coordinator.textView(
            view, shouldChangeTextIn: NSRange(location: insertAt, length: 0),
            replacementString: "!"))
        view.textStorage?.replaceCharacters(in: NSRange(location: insertAt, length: 0), with: "!")
        coordinator.textDidChange(didChangeNotification(view))
        XCTAssertEqual(coordinator.scheduledSaves, 1,
                       "after DidEnd the normal debounced-save path must resume")
    }

    // MARK: - ③ The normal path is untouched when no session is active

    func testNormalTypingStillNormalizesAndSchedules() {
        let doc = "# Heading\nBody."
        let view = makeView(doc)
        // A document being edited is already styled (loadDocument normalizes).
        GlassDocumentEditor.normalizeDocument(view, sources: [])
        let coordinator = makeSpy()

        let insertAt = (doc as NSString).length
        XCTAssertTrue(coordinator.textView(
            view, shouldChangeTextIn: NSRange(location: insertAt, length: 0),
            replacementString: " More."))
        view.textStorage?.replaceCharacters(in: NSRange(location: insertAt, length: 0), with: " More.")
        coordinator.textDidChange(didChangeNotification(view))

        let reference = makeView(view.string)
        GlassDocumentEditor.normalizeDocument(reference, sources: [])
        XCTAssertEqual(view.textStorage, reference.textStorage,
                       "without a Writing Tools session, typing styles as before")
        XCTAssertEqual(coordinator.scheduledSaves, 1)
    }

    // MARK: - ④ Anchors are declared off-limits to the rewrite

    func testIgnoredRangesProtectLoomAnchorAndSourceLinks() throws {
        let text = "A claim about attention. \u{203B} p.3\nSee chip and web too."
        let view = makeView(text)
        let storage = try XCTUnwrap(view.textStorage)
        let ns = text as NSString

        let anchorRange = ns.range(of: "\u{203B} p.3")
        storage.addAttribute(
            .link,
            value: URL(string: "loom://anchor?src=abc&page=3&rect=1,2,3,4")!,
            range: anchorRange)
        let chipRange = ns.range(of: "chip")
        storage.addAttribute(.link, value: "loom-source://xyz", range: chipRange)
        let webRange = ns.range(of: "web")
        storage.addAttribute(.link, value: URL(string: "https://example.com")!, range: webRange)

        let coordinator = makeSpy()
        let ignored = coordinator.textView(
            view, writingToolsIgnoredRangesInEnclosingRange: NSRange(location: 0, length: ns.length))
        let ranges = ignored.map(\.rangeValue)

        XCTAssertTrue(ranges.contains(anchorRange),
                      "the loom://anchor locator glyph is the quote's way back to the source — a rewrite must not eat it")
        XCTAssertTrue(ranges.contains(chipRange),
                      "loom-source:// file chips are structural, not prose")
        XCTAssertFalse(ranges.contains(webRange),
                       "ordinary links are prose — Writing Tools may rewrite them")
    }

    // MARK: - ⑤ The editor declares its Writing Tools contract explicitly

    func testEditorDeclaresCompleteBehaviorAndHonestResultOptions() throws {
        let hosting = NSHostingView(rootView: GlassDocumentEditor(
            caseID: "writing-tools-config-\(UUID().uuidString)",
            text: "Config probe.",
            focusRequest: 0,
            jumpTarget: .constant(nil),
            sources: [],
            onTextChange: { _ in },
            onImportFiles: { _ in [] },
            onOpenSource: { _ in }
        ))
        hosting.frame = NSRect(x: 0, y: 0, width: 480, height: 400)
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 400),
            styleMask: [.titled], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        hosting.layoutSubtreeIfNeeded()

        func findEditor(in view: NSView) -> GlassDocumentEditor.GrowingGlassTextView? {
            if let editor = view as? GlassDocumentEditor.GrowingGlassTextView { return editor }
            for sub in view.subviews {
                if let found = findEditor(in: sub) { return found }
            }
            return nil
        }
        let editor = try XCTUnwrap(findEditor(in: hosting))

        XCTAssertEqual(editor.writingToolsBehavior, .complete,
                       "the note editor opts into the full inline experience explicitly (charter §10)")
        XCTAssertTrue(editor.allowedWritingToolsResultOptions.contains(.richText),
                      "bold/italic emphasis must survive a rewrite — rich text results are allowed")
        XCTAssertFalse(editor.allowedWritingToolsResultOptions.contains(.table),
                       "charter §7 bans NSTextTable in the storage — declaring .table would be a lie")
    }
}
