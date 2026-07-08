import XCTest
@testable import Loom

/// The backup blind spot (2026-07-08 partition audit, owner decision ④):
/// "Export Loom…" only backed up the LEGACY SwiftData store — the live
/// reflection workspace (reflection-workspace-snapshot.json) had no export
/// path at all. These tests pin the fix: the export bundle carries the live
/// workspace snapshot verbatim, loads it nil-safely from disk, and old
/// export files (without the field) still decode.
final class LoomExportWorkspaceSnapshotTests: XCTestCase {

    private func makeBundle(snapshot: String?) -> LoomExport.ExportBundle {
        LoomExport.ExportBundle(
            meta: LoomExport.Meta(exportedAt: 1_720_000_000, appVersion: "test"),
            pursuits: [],
            traces: [],
            soanCards: [],
            soanEdges: [],
            weaves: [],
            workspaceSnapshotJSON: snapshot
        )
    }

    func testBundleRoundTripsWorkspaceSnapshot() throws {
        let raw = #"{"cases":[{"title":"Week 1 Notes"}]}"#
        let bundle = makeBundle(snapshot: raw)
        let data = try JSONEncoder().encode(bundle)
        let decoded = try JSONDecoder().decode(LoomExport.ExportBundle.self, from: data)
        XCTAssertEqual(decoded.workspaceSnapshotJSON, raw)
    }

    func testMetaVersionBumpedForSnapshotField() {
        // Field additions bump the on-disk version (LoomExport contract).
        XCTAssertEqual(LoomExport.Meta(exportedAt: 0, appVersion: nil).version, "2")
    }

    func testOldExportWithoutSnapshotFieldStillDecodes() throws {
        let v1JSON = """
        {"meta":{"version":"1","exportedAt":0},"pursuits":[],"traces":[],
         "soanCards":[],"soanEdges":[],"weaves":[]}
        """
        let decoded = try JSONDecoder().decode(
            LoomExport.ExportBundle.self,
            from: Data(v1JSON.utf8)
        )
        XCTAssertNil(decoded.workspaceSnapshotJSON)
        XCTAssertEqual(decoded.meta.version, "1")
    }

    func testSnapshotLoaderReadsFileAndNilsOnMissing() throws {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("loom-export-tests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }

        let file = dir.appendingPathComponent("snapshot.json")
        try Data(#"{"cases":[]}"#.utf8).write(to: file)

        XCTAssertEqual(LoomExport.workspaceSnapshotJSON(at: file), #"{"cases":[]}"#)
        XCTAssertNil(LoomExport.workspaceSnapshotJSON(at: dir.appendingPathComponent("missing.json")))
        XCTAssertNil(LoomExport.workspaceSnapshotJSON(at: nil))
    }
}
