import XCTest
import AppKit
@testable import Loom

/// Charter W1-2 (§11/§12) — the menu bar is the ONLY shortcut registry: every
/// combo has exactly one owner, visible in a menu (that's also what System
/// Settings ▸ Keyboard remapping sees). These run against the HOSTED app's
/// real main menu — LoomTests' TEST_HOST is Loom.app, so `NSApp.mainMenu` is
/// the actual SwiftUI-built product menu, not a fixture.
@MainActor
final class MenuCommandsTests: XCTestCase {

    /// All menu items (recursively) whose key equivalent is `key` with
    /// exactly `modifiers` — the app-wide owners of that combo.
    private func owners(
        of key: String,
        modifiers: NSEvent.ModifierFlags
    ) throws -> [NSMenuItem] {
        let menu = try XCTUnwrap(NSApp.mainMenu, "hosted app must have a main menu")
        var found: [NSMenuItem] = []
        func walk(_ menu: NSMenu) {
            for item in menu.items {
                if item.keyEquivalent == key, item.keyEquivalentModifierMask == modifiers {
                    found.append(item)
                }
                if let sub = item.submenu { walk(sub) }
            }
        }
        walk(menu)
        return found
    }

    private func soleOwner(
        of key: String,
        modifiers: NSEvent.ModifierFlags,
        file: StaticString = #filePath,
        line: UInt = #line
    ) throws -> NSMenuItem {
        let found = try owners(of: key, modifiers: modifiers)
        XCTAssertEqual(
            found.count, 1,
            "⌘-combo '\(key)' must have exactly ONE menu owner (charter §11); found: \(found.map(\.title))",
            file: file, line: line)
        return try XCTUnwrap(found.first, file: file, line: line)
    }

    // MARK: - Format menu owns ⌘B/⌘I/⌘U through the responder chain

    func testFormatMenuOwnsBoldItalicUnderline() throws {
        let bold = try soleOwner(of: "b", modifiers: .command)
        XCTAssertEqual(bold.title, "Bold")
        XCTAssertEqual(bold.action, #selector(NSFontManager.addFontTrait(_:)),
                       "Bold must drive the font manager's addFontTrait: → changeFont:, which NSTextView answers natively and undoably")

        let italic = try soleOwner(of: "i", modifiers: .command)
        XCTAssertEqual(italic.title, "Italic")
        XCTAssertEqual(italic.action, #selector(NSFontManager.addFontTrait(_:)))

        let underline = try soleOwner(of: "u", modifiers: .command)
        XCTAssertEqual(underline.title, "Underline")
        XCTAssertEqual(underline.action, #selector(NSText.underline(_:)),
                       "Underline must be the nil-targeted responder-chain underline(_:)")
        XCTAssertNil(underline.target)
    }

    /// The editor must NOT beat those menu items to the keys: the old
    /// performKeyEquivalent interception is gone, so a ⌘B reaching the view
    /// hierarchy falls through to the menu (AppKit consults the key window's
    /// views BEFORE the menu bar — an intercepting view starves the menu).
    func testEditorDoesNotInterceptFormatKeysAnymore() throws {
        let editor = GlassDocumentEditor.GrowingGlassTextView()
        for (key, code) in [("b", UInt16(11)), ("i", UInt16(34)), ("u", UInt16(32))] {
            let event = try XCTUnwrap(NSEvent.keyEvent(
                with: .keyDown, location: .zero, modifierFlags: .command,
                timestamp: 0, windowNumber: 0, context: nil,
                characters: key, charactersIgnoringModifiers: key,
                isARepeat: false, keyCode: code))
            XCTAssertFalse(editor.performKeyEquivalent(with: event),
                           "⌘\(key.uppercased()) must fall through to the Format menu, not be swallowed by the view")
        }
    }

    // MARK: - Edit menu carries the text organs (⌘F for the find bar)

    func testEditMenuProvidesFind() throws {
        let find = try soleOwner(of: "f", modifiers: .command)
        XCTAssertEqual(find.action, #selector(NSTextView.performFindPanelAction(_:)),
                       "⌘F must be the standard responder-chain find action — the editor's usesFindBar turns it into the find bar")
        XCTAssertNil(find.target)
    }

    // MARK: - The three ex-hidden shortcuts + ⌘O are real, single-owner items

    func testWorkspaceShortcutsAreSingleOwnerMenuItems() throws {
        let newDraft = try soleOwner(of: "n", modifiers: .command)
        XCTAssertEqual(newDraft.title, "New Draft",
                       "⌘N speaks the trio's vocabulary (the sidebar's create action), not the stale 'New Topic'")

        let newLearning = try soleOwner(of: "n", modifiers: [.command, .shift])
        XCTAssertEqual(newLearning.title, "New Learning Project",
                       "⌘⇧N graduates from the opacity-0 sidebar button to a real File-menu item")

        let search = try soleOwner(of: "k", modifiers: .command)
        XCTAssertEqual(search.title, "Search",
                       "⌘K's single owner is the navigator search; Shuttle is menu-only now")

        let open = try soleOwner(of: "o", modifiers: .command)
        XCTAssertEqual(open.title, "Open…",
                       "⌘O = File ▸ Open… driving the import flow (⌘P is released toward Print, charter §12)")
    }

    /// Shuttle keeps its menu item (discoverability) but no longer competes
    /// for ⌘K.
    func testShuttleIsMenuOnlyNow() throws {
        let menu = try XCTUnwrap(NSApp.mainMenu)
        var shuttle: NSMenuItem?
        func walk(_ menu: NSMenu) {
            for item in menu.items {
                if item.title == "Shuttle" { shuttle = item }
                if let sub = item.submenu { walk(sub) }
            }
        }
        walk(menu)
        let item = try XCTUnwrap(shuttle, "the Shuttle palette stays reachable from the Edit menu")
        XCTAssertEqual(item.keyEquivalent, "", "Shuttle must not double-register ⌘K (charter §11)")
    }
}
