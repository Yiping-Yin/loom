import XCTest

@testable import Loom

final class LoomRuntimePathsTests: XCTestCase {
    func testResolveInstalledRuntimeRootPrefersActivationRecord() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let runtimeDir = root.appendingPathComponent("Library/Application Support/Loom/runtime", isDirectory: true)
        try fm.createDirectory(at: runtimeDir, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: root) }

        let activeRoot = runtimeDir.appendingPathComponent("build-123", isDirectory: true)
        try fm.createDirectory(at: activeRoot, withIntermediateDirectories: true)
        try Data(#"{"buildId":"build-123","runtimeRoot":"\#(activeRoot.path)"}"#.utf8)
            .write(to: runtimeDir.appendingPathComponent("current.json"))

        XCTAssertEqual(
            LoomRuntimePaths.resolveInstalledRuntimeRoot(homeDirectory: root.path),
            activeRoot.path
        )
    }

    func testResolveContentRootPrefersEnvOverrideThenPersistedConfig() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let appSupport = root.appendingPathComponent("Library/Application Support/Loom", isDirectory: true)
        try fm.createDirectory(at: appSupport, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: root) }

        try Data(#"{"contentRoot":"/persisted/wiki"}"#.utf8)
            .write(to: appSupport.appendingPathComponent("content-root.json"))

        XCTAssertEqual(
            LoomRuntimePaths.resolveContentRoot(
                env: ["LOOM_CONTENT_ROOT": "/env/wiki"],
                homeDirectory: root.path
            ),
            "/env/wiki"
        )

        XCTAssertEqual(
            LoomRuntimePaths.resolveContentRoot(
                env: [:],
                homeDirectory: root.path
            ),
            "/persisted/wiki"
        )
    }

    func testSourcesReloadFeedbackStringsMatchSidebarContract() {
        XCTAssertEqual(LibraryReloadFeedback.idle.actionLabel, "Reload sources")
        XCTAssertEqual(LibraryReloadFeedback.loading.actionLabel, "Reloading…")
        XCTAssertNil(LibraryReloadFeedback.loading.statusMessage)
        XCTAssertEqual(LibraryReloadFeedback.success.actionLabel, "Reloaded")
        XCTAssertNil(LibraryReloadFeedback.success.statusMessage)
        XCTAssertEqual(
            LibraryReloadFeedback.missingFolder.statusMessage,
            "Choose a source folder in Settings -> Data."
        )
        XCTAssertEqual(
            LibraryReloadFeedback.missingManifest.statusMessage,
            "No source manifest yet. Add sources to build one."
        )
    }

    func testSidebarThemeResolutionUsesSingleResolvedColorSchemeSource() {
        XCTAssertEqual(
            SidebarThemeResolution.resolvedColorScheme(theme: "dark", systemIsDark: false),
            .dark
        )
        XCTAssertEqual(
            SidebarThemeResolution.resolvedColorScheme(theme: "light", systemIsDark: true),
            .light
        )
        // "auto" resolves by local time-of-day (night = before 6, from 21),
        // not by system appearance — pin the clock so the test is stable.
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let noon = DateComponents(
            calendar: calendar, year: 2026, month: 6, day: 12, hour: 12
        ).date!
        let lateNight = DateComponents(
            calendar: calendar, year: 2026, month: 6, day: 12, hour: 23
        ).date!
        XCTAssertEqual(
            SidebarThemeResolution.resolvedColorScheme(
                theme: "auto", systemIsDark: true, now: noon, calendar: calendar
            ),
            .light
        )
        XCTAssertEqual(
            SidebarThemeResolution.resolvedColorScheme(
                theme: "auto", systemIsDark: false, now: lateNight, calendar: calendar
            ),
            .dark
        )
    }
}
