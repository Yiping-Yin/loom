import XCTest
@testable import Loom

/// Wave 2 STEP 0 — the 3-way IA contract (Today · Workspace · Digital Me) the
/// sidebar destinations + ⌘1/⌘2/⌘3 keymap render against. Pinned before the
/// shell rewrite so the migration adopts a tested type.
final class WorkspaceDestinationTests: XCTestCase {

    func testOrderIsTodayWorkspaceDigitalMe() {
        XCTAssertEqual(WorkspaceDestination.ordered, [.today, .workspace, .digitalMe])
    }

    func testShortcutNumbersAreOneBasedInOrder() {
        XCTAssertEqual(WorkspaceDestination.today.shortcutNumber, 1)
        XCTAssertEqual(WorkspaceDestination.workspace.shortcutNumber, 2)
        XCTAssertEqual(WorkspaceDestination.digitalMe.shortcutNumber, 3)
    }

    func testForShortcutNumberMapsOneToThreeAndRejectsOthers() {
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(1), .today)
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(2), .workspace)
        XCTAssertEqual(WorkspaceDestination.forShortcutNumber(3), .digitalMe)
        XCTAssertNil(WorkspaceDestination.forShortcutNumber(0))
        XCTAssertNil(WorkspaceDestination.forShortcutNumber(4))
    }

    func testEveryDestinationHasTitleAndSymbol() {
        for destination in WorkspaceDestination.allCases {
            XCTAssertFalse(destination.title.isEmpty)
            XCTAssertFalse(destination.systemImage.isEmpty)
        }
    }

    func testCodableRoundTripForLastDestinationRestore() throws {
        // Cold start restores the last destination (charter): it must persist.
        let data = try JSONEncoder().encode(WorkspaceDestination.digitalMe)
        XCTAssertEqual(try JSONDecoder().decode(WorkspaceDestination.self, from: data), .digitalMe)
    }
}
