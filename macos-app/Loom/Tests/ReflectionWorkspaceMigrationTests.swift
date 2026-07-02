import XCTest
@testable import Loom

/// Stage 1 (LoomDomain): the v1→v2 migration must be lossless and reversible.
/// A legacy sentence-store blob gains typed traceRecords; the original bytes
/// are backed up once in BOTH domains before anything is rewritten; two
/// diverged replicas resolve by newest savedAt instead of defaults-always-wins.
final class ReflectionWorkspaceMigrationTests: XCTestCase {
    private let capturedLine = "Captured selected word from Week 1 Notes.pdf, page 2 [vocabulary]: trajectories\nEvidence: app=Preview; kind=pdf; file=Week 1 Notes.pdf; anchor precision=file+page"
    private let narrationLine = "First language pass: keep the original file surface primary and capture vocabulary as anchored traces."

    private var suiteName = ""
    private var defaults: UserDefaults!
    private var mirrorURL: URL!

    override func setUp() {
        super.setUp()
        suiteName = "loom.workspace-migration-tests.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
        mirrorURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("loom-migration-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("reflection-workspace-snapshot.json")
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        try? FileManager.default.removeItem(at: mirrorURL.deletingLastPathComponent())
        super.tearDown()
    }

    private func legacyLearningSnapshotData() throws -> Data {
        var learningCase = ReflectionCase.blank()
        learningCase.title = "Week 1 Notes.pdf"
        learningCase.project = "Learning pass"
        learningCase.steps[0].items = [capturedLine, narrationLine]
        let snapshot = ReflectionWorkspaceSnapshot(
            cases: [learningCase],
            selectedCaseID: learningCase.id,
            selectedSourceID: nil
        )
        return try JSONEncoder().encode(snapshot)
    }

    func testLegacyBlobMigratesToTypedRecordsWithBackupInBothDomains() throws {
        let legacyData = try legacyLearningSnapshotData()
        defaults.set(legacyData, forKey: "loom.reflectionWorkspaceSnapshot")

        let restored = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        let migratedCase = try XCTUnwrap(restored?.cases.first)
        XCTAssertEqual(migratedCase.traceRecords?.count, 1, "one parseable input line becomes one record; narration is excluded")
        XCTAssertEqual(migratedCase.traceRecords?.first?.legacyItem, capturedLine)
        XCTAssertEqual(migratedCase.steps[0].items, [capturedLine, narrationLine], "migration never rewrites the legacy items")

        XCTAssertEqual(
            defaults.data(forKey: "loom.reflectionWorkspaceSnapshot.backup-v1"),
            legacyData,
            "the pre-migration blob must be backed up byte-identically before any rewrite"
        )
        let mirrorBackupURL = mirrorURL.deletingPathExtension().appendingPathExtension("backup-v1.json")
        XCTAssertEqual(try Data(contentsOf: mirrorBackupURL), legacyData)
    }

    func testMigrationRunsOnceAndBackupIsNeverOverwritten() throws {
        let legacyData = try legacyLearningSnapshotData()
        defaults.set(legacyData, forKey: "loom.reflectionWorkspaceSnapshot")

        _ = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)
        let secondLoad = ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)

        XCTAssertEqual(secondLoad?.cases.first?.traceRecords?.count, 1, "records are not duplicated on reload")
        XCTAssertEqual(
            defaults.data(forKey: "loom.reflectionWorkspaceSnapshot.backup-v1"),
            legacyData,
            "the backup keeps the ORIGINAL bytes even after the store re-saves migrated data"
        )
    }

    func testNewerReplicaWinsInEitherDirection() throws {
        var older = ReflectionCase.blank()
        older.title = "Older"
        var newer = ReflectionCase.blank()
        newer.title = "Newer"

        var olderSnapshot = ReflectionWorkspaceSnapshot(cases: [older], selectedCaseID: older.id, selectedSourceID: nil)
        olderSnapshot.schemaVersion = 2
        olderSnapshot.savedAt = Date(timeIntervalSince1970: 1_000)
        var newerSnapshot = ReflectionWorkspaceSnapshot(cases: [newer], selectedCaseID: newer.id, selectedSourceID: nil)
        newerSnapshot.schemaVersion = 2
        newerSnapshot.savedAt = Date(timeIntervalSince1970: 2_000)

        // Direction 1: mirror is newer than defaults.
        defaults.set(try JSONEncoder().encode(olderSnapshot), forKey: "loom.reflectionWorkspaceSnapshot")
        try FileManager.default.createDirectory(at: mirrorURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(newerSnapshot).write(to: mirrorURL)
        XCTAssertEqual(ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)?.cases.first?.title, "Newer")

        // Direction 2: defaults is newer than mirror.
        defaults.set(try JSONEncoder().encode(newerSnapshot), forKey: "loom.reflectionWorkspaceSnapshot")
        try JSONEncoder().encode(olderSnapshot).write(to: mirrorURL)
        XCTAssertEqual(ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)?.cases.first?.title, "Newer")
    }

    func testCorruptedDefaultsFallBackToHealthyMirror() throws {
        var healthy = ReflectionCase.blank()
        healthy.title = "Healthy Mirror"
        var snapshot = ReflectionWorkspaceSnapshot(cases: [healthy], selectedCaseID: healthy.id, selectedSourceID: nil)
        snapshot.schemaVersion = 2
        snapshot.savedAt = Date()

        defaults.set(Data("not json".utf8), forKey: "loom.reflectionWorkspaceSnapshot")
        try FileManager.default.createDirectory(at: mirrorURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(snapshot).write(to: mirrorURL)

        XCTAssertEqual(ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL)?.cases.first?.title, "Healthy Mirror")
    }

    func testSaveStampsSchemaVersionAndSavedAt() throws {
        let saved = ReflectionCase.blank()
        ReflectionWorkspaceStore.save(
            cases: [saved],
            selectedCaseID: saved.id,
            selectedSourceID: nil,
            defaults: defaults,
            mirrorURL: mirrorURL
        )

        let raw = try XCTUnwrap(defaults.data(forKey: "loom.reflectionWorkspaceSnapshot"))
        let decoded = try JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: raw)
        XCTAssertEqual(decoded.schemaVersion, 2)
        let savedAt = try XCTUnwrap(decoded.savedAt)
        XCTAssertLessThan(abs(savedAt.timeIntervalSinceNow), 30)
    }
}

extension ReflectionWorkspaceMigrationTests {
    /// Runs only when the gitignored real-snapshot fixture is present
    /// (harvested from the owner's pre-migration backup). Asserts the v1→v2
    /// migration is lossless on REAL data: counts identical, items untouched,
    /// records mirror exactly the parseable input lines.
    func testRealSnapshotFixtureMigratesLosslessly() throws {
        let fixtureURL = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("fixtures/real-workspace-snapshot.json")
        guard let raw = try? Data(contentsOf: fixtureURL) else {
            throw XCTSkip("real-workspace-snapshot.json fixture not present (gitignored, local-only)")
        }

        let original = try JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: raw)
        defaults.set(raw, forKey: "loom.reflectionWorkspaceSnapshot")

        let migrated = try XCTUnwrap(ReflectionWorkspaceStore.load(defaults: defaults, mirrorURL: mirrorURL))

        XCTAssertEqual(migrated.cases.count, original.cases.count)
        for (migratedCase, originalCase) in zip(migrated.cases, original.cases) {
            XCTAssertEqual(migratedCase.id, originalCase.id)
            XCTAssertEqual(migratedCase.messages.count, originalCase.messages.count)
            let originalItems = originalCase.steps.first { $0.id == "input" }?.items ?? []
            let migratedItems = migratedCase.steps.first { $0.id == "input" }?.items ?? []
            XCTAssertEqual(migratedItems, originalItems, "migration must never rewrite input items")
            let sourceLabel = originalCase.sources.first?.label ?? originalCase.title
            let expectedRecords = originalItems.compactMap {
                ReflectionTraceRecord.fromLegacyItem($0, sourceLabel: sourceLabel)
            }
            XCTAssertEqual(migratedCase.traceRecords?.count, expectedRecords.isEmpty ? originalCase.traceRecords?.count : expectedRecords.count)
            if let records = migratedCase.traceRecords {
                XCTAssertEqual(records.map(\.legacyItem), expectedRecords.map(\.legacyItem))
            }
        }
        XCTAssertEqual(
            defaults.data(forKey: "loom.reflectionWorkspaceSnapshot.backup-v1"),
            raw,
            "the real pre-migration bytes must be preserved"
        )
    }
}
