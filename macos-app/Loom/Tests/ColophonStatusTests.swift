import XCTest
@testable import Loom

final class ColophonStatusTests: XCTestCase {
    func testEmptyWorkspaceShowsOnlyOnDeviceReassurance() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 0, noteCount: 0), "Local · on-device")
    }

    func testSingularSource() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 1, noteCount: 0), "Local · 1 source")
    }

    func testPluralSources() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 3, noteCount: 0), "Local · 3 sources")
    }

    func testSourcesAndNotes() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 3, noteCount: 12), "Local · 3 sources · 12 notes")
    }

    func testSingularNoteAndSource() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 1, noteCount: 1), "Local · 1 source · 1 note")
    }

    func testNotesWithoutSources() {
        XCTAssertEqual(ColophonStatus.text(sourceCount: 0, noteCount: 5), "Local · 5 notes")
    }
}
