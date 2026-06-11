import XCTest
@testable import Loom

final class LoomCommandScriptsTests: XCTestCase {
    func testLearnSelectionScriptTriesInterlaceFirstOnDocPages() {
        let script = LoomCommandScripts.learnSelectionScript()

        // The Interlace margin overlay is attempted first on /wiki/* and
        // /knowledge/* pages when text is selected.
        XCTAssertTrue(script.contains("__loomInterlace"))
        XCTAssertTrue(script.contains("wiki|knowledge"))
        XCTAssertTrue(script.contains(".open("))
    }

    func testLearnSelectionScriptFallsBackToPassageChat() {
        let script = LoomCommandScripts.learnSelectionScript()

        // When Interlace isn't mounted (non-doc pages, or before the module
        // has loaded), ⌘E with selection still opens passage chat.
        XCTAssertTrue(script.contains("loom:chat:focus"))
        XCTAssertTrue(script.contains("detail: { text }"))
        XCTAssertFalse(script.contains("loom:capture-prompt"))
    }

    func testLearnSelectionScriptReportsEmptySelectionToNativeShell() {
        let script = LoomCommandScripts.learnSelectionScript()

        // No text in hand — the script reports back so the native shell
        // decides what to do (Source practice). The old rehearsal-overlay
        // fallback is gone.
        XCTAssertTrue(script.contains("'empty-selection'"))
        XCTAssertFalse(script.contains("loom:overlay:open"))
    }
}
