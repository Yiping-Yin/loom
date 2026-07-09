import XCTest
@testable import Loom

/// The 3-way top IA contract — owner-defined trio (2026-07-10): opening LOOM
/// gives **Workspace · Wiki · You**. Workspace = where your organized/uploaded
/// knowledge and materials live; Wiki = your personal knowledge encyclopedia;
/// You = the online-supplemented professional self. (Today stays a window on
/// ⌘⇧T — it is a daily face, not a product.) The sidebar destination list +
/// ⌘1/⌘2/⌘3 keymap render against this tested type.
final class WorkspaceDestinationTests: XCTestCase {

    func testOrderIsWorkspaceWikiYou() {
        XCTAssertEqual(WorkspaceDestination.ordered, [.workspace, .wiki, .digitalMe])
    }

    func testShortcutNumbersAreOneBasedInOrder() {
        XCTAssertEqual(WorkspaceDestination.workspace.shortcutNumber, 1)
        XCTAssertEqual(WorkspaceDestination.wiki.shortcutNumber, 2)
        XCTAssertEqual(WorkspaceDestination.digitalMe.shortcutNumber, 3)
    }

    func testForShortcutNumberMapsOneToThreeAndRejectsOthers() {
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(1), .workspace)
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(2), .wiki)
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(3), .digitalMe)
        XCTAssertNil(WorkspaceDestination.forShortcutNumber(0))
        XCTAssertNil(WorkspaceDestination.forShortcutNumber(4))
    }

    func testTitlesMatchTheOwnersTrio() {
        XCTAssertEqual(WorkspaceDestination.workspace.title, "Workspace")
        XCTAssertEqual(WorkspaceDestination.wiki.title, "Wiki")
        XCTAssertEqual(WorkspaceDestination.digitalMe.title, "You")
    }

    func testEveryDestinationHasTitleAndSymbol() {
        for destination in WorkspaceDestination.allCases {
            XCTAssertFalse(destination.title.isEmpty)
            XCTAssertFalse(destination.systemImage.isEmpty)
        }
    }

    func testCodableRoundTripForLastDestinationRestore() throws {
        // Cold start restores the last destination (charter): it must persist.
        let data = try JSONEncoder().encode(WorkspaceDestination.wiki)
        XCTAssertEqual(try JSONDecoder().decode(WorkspaceDestination.self, from: data), .wiki)
    }
}
