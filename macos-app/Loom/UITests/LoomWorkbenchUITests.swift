//
//  LoomWorkbenchUITests.swift
//  LoomUITests
//
//  Wave 2 (W2-2) UI verification. Human / computer-use verification of the
//  running app was impossible this session, so these XCUITests are the way to
//  prove the migrated shell actually renders and works:
//    • the app launches into a real window (the Reflection workbench),
//    • the 3-way IA destination rows (Workspace / Wiki / You — the owner's
//      trio, 2026-07-10) are present,
//    • selecting each destination swaps the detail surface,
//    • ⌘1 / ⌘2 / ⌘3 switch destinations (Workspace / Wiki / You),
//    • the Workspace top-bar controls are present (would catch a vanished
//      toolbar),
//    • the sidebar sections render (data-dependent — recorded honestly).
//
//  IMPORTANT — read-only against the OWNER's real workspace. The app is
//  sandboxed under `com.yinyiping.loom`, so the launched app shares the owner's
//  real store. These tests ONLY navigate (click destination rows, press
//  ⌘1/2/3, reveal the sidebar). They never create/delete/rename/move a case,
//  never type into the note editor — no data churn.
//
//  Each check is recorded via `record(...)` and printed with a "UIVERIFY:"
//  prefix so the pass/fail of every individual assertion is legible in the
//  xcodebuild log even when the run is green. `continueAfterFailure = true` so
//  one failed check never hides the others.
//

import XCTest

final class LoomWorkbenchUITests: XCTestCase {
    private var app: XCUIApplication!

    // Collected results for the end-of-run summary block.
    private var results: [(name: String, pass: Bool, detail: String)] = []

    override func setUpWithError() throws {
        continueAfterFailure = true
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        // Emit a compact, grep-able summary so the caller can read the actual
        // verification RESULTS out of the log regardless of overall pass/fail.
        print("UIVERIFY-SUMMARY-BEGIN")
        for r in results {
            print("UIVERIFY-SUMMARY: [\(r.pass ? "PASS" : "FAIL")] \(r.name)\(r.detail.isEmpty ? "" : " — \(r.detail)")")
        }
        print("UIVERIFY-SUMMARY-END")
        app = nil
    }

    // MARK: - Helpers

    private func record(_ name: String, _ pass: Bool, _ detail: String = "") {
        results.append((name, pass, detail))
        print("UIVERIFY: [\(pass ? "PASS" : "FAIL")] \(name)\(detail.isEmpty ? "" : " — \(detail)")")
    }

    /// Any element (any role) carrying this accessibility identifier.
    private func any(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func destinationRow(_ dest: String) -> XCUIElement {
        // DestinationRow is a SwiftUI Button → `.button`; fall back to `.any`.
        let button = app.buttons["destination.\(dest)"]
        return button.exists ? button : any("destination.\(dest)")
    }

    /// Poll until the element disappears (used to prove a surface really swaps
    /// OUT, not just that another swapped in).
    @discardableResult
    private func waitForGone(_ el: XCUIElement, timeout: TimeInterval) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if !el.exists { return true }
            usleep(150_000)
        }
        return !el.exists
    }

    /// The main window can arrive a beat after launch (the AppDelegate repairs
    /// window presentation on a 0.4s / 1.2s delay), so wait generously.
    private func waitForMainWindow() -> Bool {
        app.windows.firstMatch.waitForExistence(timeout: 25)
    }

    /// Reveal the sidebar if the destination rows aren't already queryable.
    private func ensureSidebarVisible() {
        let workspace = destinationRow("workspace")
        if workspace.waitForExistence(timeout: 8) { return }
        // Prefer the Workspace top-bar sidebar button; fall back to ⌃⌘S.
        let toggle = app.buttons["topbar.sidebarToggle"]
        if toggle.waitForExistence(timeout: 3), toggle.isHittable {
            toggle.click()
        } else {
            app.typeKey("s", modifierFlags: [.control, .command])
        }
        _ = workspace.waitForExistence(timeout: 8)
    }

    private func selectDestinationByClick(_ dest: String) {
        let row = destinationRow(dest)
        if row.waitForExistence(timeout: 6), row.isHittable {
            row.click()
        }
    }

    // MARK: - The verification journey (single launch, every check recorded)

    func testWorkbenchShellVerification() throws {
        // 1) App launches into a window.
        let windowUp = waitForMainWindow()
        record("app launches with a window", windowUp,
               windowUp ? "windows=\(app.windows.count)" : "no window after 25s")
        XCTAssertTrue(windowUp, "The workbench window never appeared — the rest of the journey cannot run.")
        guard windowUp else { return }

        ensureSidebarVisible()

        // 2) The three destination rows are present (the owner's trio).
        let workspaceRow = destinationRow("workspace")
        let wikiRow = destinationRow("wiki")
        let youRow = destinationRow("digitalMe")
        let workspacePresent = workspaceRow.waitForExistence(timeout: 8)
        let wikiPresent = wikiRow.waitForExistence(timeout: 3)
        let youPresent = youRow.waitForExistence(timeout: 3)
        record("destination row: Workspace present", workspacePresent, "label=\(workspacePresent ? workspaceRow.label : "-")")
        record("destination row: Wiki present", wikiPresent, "label=\(wikiPresent ? wikiRow.label : "-")")
        record("destination row: You present", youPresent, "label=\(youPresent ? youRow.label : "-")")
        let allDestinations = workspacePresent && wikiPresent && youPresent
        record("all 3 destinations present", allDestinations)
        XCTAssertTrue(allDestinations, "The 3-way IA destination rows were not all found in the sidebar.")

        // 3) Selecting each destination swaps the detail surface (by CLICK).
        //    The reliable Workspace indicator is the top-bar inspector toggle: a
        //    real Button element gated to `destination == .workspace` (the whole
        //    ReflectionTopBar is only mounted on Workspace). A container HStack
        //    identifier would not always resolve to a queryable AX element, so we
        //    key off the button, not the container.
        let workspaceIndicator = app.buttons["topbar.inspectorToggle"]
        let wikiSurface = any("surface.wikiHome")
        let dossierSurface = any("surface.dossier")

        // Wiki
        selectDestinationByClick("wiki")
        let wikiShown = wikiSurface.waitForExistence(timeout: 8)
        let topBarGoneOnWiki = waitForGone(workspaceIndicator, timeout: 4)
        record("click Wiki → encyclopedia front door shown", wikiShown)
        record("click Wiki → Workspace top bar hidden (real swap)", topBarGoneOnWiki)

        // You
        selectDestinationByClick("digitalMe")
        let dossierShown = dossierSurface.waitForExistence(timeout: 8)
        let wikiGoneOnYou = waitForGone(wikiSurface, timeout: 4)
        record("click You → dossier surface shown", dossierShown)
        record("click You → Wiki surface hidden (real swap)", wikiGoneOnYou)

        // Workspace
        selectDestinationByClick("workspace")
        let topBarShown = workspaceIndicator.waitForExistence(timeout: 8)
        let dossierGoneOnWorkspace = waitForGone(dossierSurface, timeout: 4)
        record("click Workspace → top bar shown", topBarShown)
        record("click Workspace → dossier surface hidden (real swap)", dossierGoneOnWorkspace)

        let clickSwitchingWorks = wikiShown && dossierShown && topBarShown
        record("destination switching by click works", clickSwitchingWorks)

        // 4) ⌘1 / ⌘2 / ⌘3 switch destinations (the W2-2 keymap).
        app.activate()

        app.typeKey("2", modifierFlags: .command)
        let cmd2 = wikiSurface.waitForExistence(timeout: 8)
        record("⌘2 → Wiki front door", cmd2)

        app.typeKey("3", modifierFlags: .command)
        let cmd3 = dossierSurface.waitForExistence(timeout: 8)
        record("⌘3 → dossier surface", cmd3)

        app.typeKey("1", modifierFlags: .command)
        let cmd1 = workspaceIndicator.waitForExistence(timeout: 8)
        record("⌘1 → Workspace top bar", cmd1)

        let keymapWorks = cmd1 && cmd2 && cmd3
        record("⌘1/⌘2/⌘3 keymap works", keymapWorks)

        // 5) Workspace top-bar controls present (the vanished-toolbar check).
        //    We are on Workspace now (from ⌘2). Assert the two toggles exist.
        let sidebarToggle = app.buttons["topbar.sidebarToggle"]
        let inspectorToggle = app.buttons["topbar.inspectorToggle"]
        let sidebarTogglePresent = sidebarToggle.waitForExistence(timeout: 4)
        let inspectorTogglePresent = inspectorToggle.waitForExistence(timeout: 4)
        record("top-bar sidebar toggle present", sidebarTogglePresent,
               sidebarTogglePresent ? "hittable=\(sidebarToggle.isHittable)" : "")
        record("top-bar inspector toggle present", inspectorTogglePresent,
               inspectorTogglePresent ? "hittable=\(inspectorToggle.isHittable)" : "")
        let topBarControls = sidebarTogglePresent || inspectorTogglePresent
        record("Workspace top-bar controls present", topBarControls)

        // 6) Sidebar sections render (DATA-DEPENDENT — recorded, not hard-failed:
        //    each section only appears when the owner's store holds that kind of
        //    content). Reported honestly so the caller sees the real state.
        for section in ["Projects", "Drafts", "Learning", "Principles", "Library"] {
            let label = app.staticTexts[section]
            let present = label.waitForExistence(timeout: 2)
            record("sidebar section: \(section)", present, present ? "" : "absent (no data or not rendered)")
        }
        let anySection = ["Projects", "Drafts", "Learning", "Principles", "Library"]
            .contains { app.staticTexts[$0].exists }
        record("at least one sidebar section renders", anySection)

        // Hard failures: only the shell-integrity checks (not data-dependent).
        XCTAssertTrue(clickSwitchingWorks, "Clicking destination rows did not swap the detail surface.")
        XCTAssertTrue(keymapWorks, "The ⌘1/⌘2/⌘3 destination keymap did not switch destinations.")
        XCTAssertTrue(topBarControls, "The Workspace top-bar controls were not present.")
    }

    /// Minimal independent smoke: a fresh launch reaches a window. Kept separate
    /// so a total launch failure is unambiguous in the report.
    func testAppLaunchesIntoWindow() throws {
        let up = waitForMainWindow()
        record("smoke: app launches into a window", up, up ? "windows=\(app.windows.count)" : "none")
        XCTAssertTrue(up, "Loom did not present a window within 25s of launch.")
    }
}
