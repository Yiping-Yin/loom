import XCTest
@testable import Loom

/// The workspace store is the only thing standing between a learning record
/// and silent data loss (see the 2026-07-02 preference-domain split). These
/// tests run against injected scratch stores — never the real defaults
/// domain or the real mirror file.
final class ReflectionWorkspaceStoreTests: XCTestCase {
    private var suiteName = ""
    private var defaults: UserDefaults!
    private var mirrorURL: URL!

    override func setUp() {
        super.setUp()
        suiteName = "loom.workspace-store-tests.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
        mirrorURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("loom-store-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("reflection-workspace-snapshot.json")
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        try? FileManager.default.removeItem(at: mirrorURL.deletingLastPathComponent())
        super.tearDown()
    }

    private func makeCase(titled title: String) -> ReflectionCase {
        var reflectionCase = ReflectionCase.blank()
        reflectionCase.title = title
        return reflectionCase
    }

    func testSaveThenLoadRoundTrips() {
        let saved = makeCase(titled: "Round Trip")
        ReflectionWorkspaceStore.save(
            cases: [saved],
            selectedCaseID: saved.id,
            selectedSourceID: nil,
            defaults: defaults,
            mirrorURL: mirrorURL
        )

        let restored = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        XCTAssertEqual(restored?.cases.map(\.title), ["Round Trip"])
        XCTAssertEqual(restored?.selectedCaseID, saved.id)
    }

    func testMirrorRecoversTheWorkspaceWhenDefaultsAreLost() {
        let saved = makeCase(titled: "Mirror Rescue")
        ReflectionWorkspaceStore.save(
            cases: [saved],
            selectedCaseID: saved.id,
            selectedSourceID: nil,
            defaults: defaults,
            mirrorURL: mirrorURL
        )

        // Simulate the defaults store vanishing (domain reset, corruption).
        defaults.removeObject(forKey: "loom.reflectionWorkspaceSnapshot")
        XCTAssertNil(defaults.data(forKey: "loom.reflectionWorkspaceSnapshot"))

        let restored = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        XCTAssertEqual(
            restored?.cases.map(\.title),
            ["Mirror Rescue"],
            "The mirror file must restore the workspace when defaults are lost — it is the data-loss safety net."
        )
    }

    func testMirrorFileIsActuallyWrittenOnSave() {
        let saved = makeCase(titled: "Mirror Exists")
        ReflectionWorkspaceStore.save(
            cases: [saved],
            selectedCaseID: saved.id,
            selectedSourceID: nil,
            defaults: defaults,
            mirrorURL: mirrorURL
        )

        XCTAssertTrue(
            FileManager.default.fileExists(atPath: mirrorURL.path),
            "save() must write the mirror file, not just defaults — a silently missing mirror means no safety net."
        )
    }
}
