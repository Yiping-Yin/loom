import XCTest
import SwiftUI
import AppKit
@testable import Loom

/// Charter W1-1⑤ remainder (§10 — system text organs): ⌘F must work in the
/// center note editor. `usesFindBar` + `isIncrementalSearchingEnabled` are the
/// whole feature — NSTextView hosts the bar in its enclosing NSScrollView via
/// NSTextFinderBarContainer. These tests pin (a) that the REAL representable
/// (`GlassDocumentEditor.makeNSView`) turns the organ on, and (b) that the
/// find bar genuinely attaches in the editor's real habitat — inside a SwiftUI
/// `ScrollView` (the outer reading scroll), which is NSScrollView-backed.
@MainActor
final class GlassDocumentEditorFindBarTests: XCTestCase {

    /// Mount the real representable through SwiftUI so the actual
    /// `makeNSView` runs, then fish the produced editor out of the tree.
    private func mountEditor<Root: View>(
        _ root: Root
    ) -> (window: NSWindow, view: GlassDocumentEditor.GrowingGlassTextView)? {
        let hosting = NSHostingView(rootView: root)
        hosting.frame = NSRect(x: 0, y: 0, width: 480, height: 400)
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 400),
            styleMask: [.titled],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        hosting.layoutSubtreeIfNeeded()
        guard let editor = findEditor(in: hosting) else { return nil }
        return (window, editor)
    }

    private func findEditor(in view: NSView) -> GlassDocumentEditor.GrowingGlassTextView? {
        if let editor = view as? GlassDocumentEditor.GrowingGlassTextView { return editor }
        for sub in view.subviews {
            if let found = findEditor(in: sub) { return found }
        }
        return nil
    }

    private func makeRepresentable() -> GlassDocumentEditor {
        GlassDocumentEditor(
            caseID: "findbar-test-\(UUID().uuidString)",
            text: "Find me in the note.",
            focusRequest: 0,
            jumpTarget: .constant(nil),
            sources: [],
            onTextChange: { _ in },
            onImportFiles: { _ in [] },
            onOpenSource: { _ in }
        )
    }

    /// (a) The organ is ON: the view `makeNSView` produces has the find bar
    /// enabled with incremental (highlight-as-you-type) search.
    func testMakeNSViewEnablesFindBarWithIncrementalSearch() throws {
        let mounted = try XCTUnwrap(
            mountEditor(makeRepresentable()),
            "the representable must produce a GrowingGlassTextView when mounted")
        XCTAssertTrue(mounted.view.usesFindBar,
                      "⌘F is dead in the editor without usesFindBar (charter §10)")
        XCTAssertTrue(mounted.view.isIncrementalSearchingEnabled,
                      "the find bar should highlight incrementally like every macOS editor")
    }

    /// (b) The bar ATTACHES in the editor's real habitat: inside a SwiftUI
    /// ScrollView the editor has an NSScrollView ancestor, and asking for the
    /// find interface actually presents the bar there.
    func testFindBarAttachesInsideSwiftUIScrollView() throws {
        let mounted = try XCTUnwrap(
            mountEditor(ScrollView { makeRepresentable() }),
            "the representable must mount inside a SwiftUI ScrollView")
        let editor = mounted.view

        let scrollView = try XCTUnwrap(
            editor.enclosingScrollView,
            "SwiftUI's ScrollView is NSScrollView-backed — the editor must see it as its enclosing scroll view for the find bar to have a home")

        // Drive the find interface the way the Edit▸Find menu does.
        let item = NSMenuItem(title: "Find…", action: nil, keyEquivalent: "")
        item.tag = NSTextFinder.Action.showFindInterface.rawValue
        editor.performTextFinderAction(item)

        XCTAssertTrue(scrollView.isFindBarVisible,
                      "⌘F must present the find bar in the enclosing scroll view")
    }
}
