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

    // Chats-in-Projects (2026-07-05): the new grouping layer round-trips.
    func testProjectsAndProjectIDRoundTrip() {
        var chat = makeCase(titled: "Grouped Chat")
        chat.projectID = "proj-1"
        let project = ReflectionProject(
            id: "proj-1",
            name: "Trading course",
            order: 0,
            createdAt: Date(timeIntervalSince1970: 1)
        )
        ReflectionWorkspaceStore.save(
            cases: [chat],
            selectedCaseID: chat.id,
            selectedSourceID: nil,
            projects: [project],
            defaults: defaults,
            mirrorURL: mirrorURL
        )

        let restored = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        XCTAssertEqual(restored?.projects?.map(\.name), ["Trading course"])
        XCTAssertEqual(restored?.projects?.first?.id, "proj-1")
        XCTAssertEqual(restored?.cases.first?.projectID, "proj-1")
    }

    // A pre-Projects blob (no projectID on cases, no projects on the snapshot)
    // must decode cleanly as ungrouped — the whole point of the optional+LAST
    // change is zero migration.
    func testLegacyBlobWithoutProjectsDecodesAsUngrouped() {
        let legacy = """
        {"cases":[{"id":"c1","title":"Legacy Chat","project":"New product practice",\
        "status":"x","updatedAt":"now","summary":"s","tags":[],"sources":[],\
        "steps":[],"messages":[]}],"selectedCaseID":"c1"}
        """
        defaults.set(Data(legacy.utf8), forKey: "loom.reflectionWorkspaceSnapshot")

        let restored = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        XCTAssertEqual(restored?.cases.first?.title, "Legacy Chat")
        XCTAssertNil(restored?.cases.first?.projectID, "legacy chats decode as ungrouped")
        XCTAssertNil(restored?.projects, "a legacy snapshot has no projects array")
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
