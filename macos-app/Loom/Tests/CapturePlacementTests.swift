import XCTest
@testable import Loom

// NOTE: This file once also covered "partial web clip placement" —
// `CaptureWriter.placementOptions(in:)` + `insertPartialEntry(entry:to:placementID:)`,
// which let a clip be inserted after a chosen heading (falling back to
// `## Notes` when the placement was stale). That feature was dropped in
// the minimal Loom shell rewrite (492c004); the only surviving insertion
// path is the unconditional, private `CaptureWriter.appendUnderNotes`.
// Those two tests were removed rather than ported because there is no
// current API to exercise. What remains is capture deletion, which still
// ships via `CapturesIndex.delete`.
final class CapturePlacementTests: XCTestCase {
    func testDeletingCaptureRemovesOnlyOwnedSidecarFiles() throws {
        let fileManager = FileManager.default
        let directory = fileManager.temporaryDirectory
            .appendingPathComponent("loom-capture-delete-\(UUID().uuidString)")
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: directory) }

        let markdownURL = directory.appendingPathComponent("Loom.md")
        let ownedAST = "Loom-capture-ast-20260509-195026-owned.json"
        let ownedSnapshot = "Loom-snapshot-20260509-195026-owned.html"
        let ownedMedia = "Loom-media-owned.jpg"
        let sharedMedia = "Loom-media-shared.jpg"
        let unrelatedSnapshot = "Loom-snapshot-20260509-195100-keep.html"

        let source = """
        ## Notes

        ### Flipdisc Display Build and Software Guide
        *clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)*

        <!-- loom-capture-ast: \(ownedAST) -->

        <img src="loom://content/root/sub/Web/flipdisc.io/\(ownedMedia)">
        <img src="loom://content/root/sub/Web/flipdisc.io/\(sharedMedia)">

        ### Later Capture
        *clipboard · 2026-05-09 19:51 · [↗](https://flipdisc.io/)*

        <img src="loom://content/root/sub/Web/flipdisc.io/\(sharedMedia)">
        """
        try source.write(to: markdownURL, atomically: true, encoding: .utf8)

        for name in [ownedAST, ownedSnapshot, ownedMedia, sharedMedia, unrelatedSnapshot] {
            try "sidecar".write(to: directory.appendingPathComponent(name), atomically: true, encoding: .utf8)
        }

        let entry = CaptureEntry(
            id: UUID(),
            rootID: UUID(),
            rootLabel: "Web Captures",
            kind: .web,
            subPath: "sub/Web/flipdisc.io",
            domain: "flipdisc.io",
            title: "Flipdisc Display Build and Software Guide",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            snippet: "Flipdiscs are a display type...",
            timestamp: nil,
            fileURL: markdownURL,
            snapshotFilename: ownedSnapshot
        )

        XCTAssertTrue(try CapturesIndex.delete(entry))

        let rewritten = try String(contentsOf: markdownURL, encoding: .utf8)
        XCTAssertFalse(rewritten.contains("Flipdisc Display Build and Software Guide"))
        XCTAssertTrue(rewritten.contains("Later Capture"))
        XCTAssertFalse(fileManager.fileExists(atPath: directory.appendingPathComponent(ownedAST).path))
        XCTAssertFalse(fileManager.fileExists(atPath: directory.appendingPathComponent(ownedSnapshot).path))
        XCTAssertFalse(fileManager.fileExists(atPath: directory.appendingPathComponent(ownedMedia).path))
        XCTAssertTrue(fileManager.fileExists(atPath: directory.appendingPathComponent(sharedMedia).path))
        XCTAssertTrue(fileManager.fileExists(atPath: directory.appendingPathComponent(unrelatedSnapshot).path))
    }
}
