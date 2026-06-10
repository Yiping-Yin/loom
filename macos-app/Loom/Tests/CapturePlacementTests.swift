import XCTest
@testable import Loom

final class CapturePlacementTests: XCTestCase {
    func testPartialWebClipCanBeInsertedAfterChosenHeading() throws {
        let existing = """
        # Topic

        Intro.

        ## First

        Old first.

        ## Target

        Old target.

        ## Next

        Old next.
        """

        let target = try XCTUnwrap(
            CaptureWriter.placementOptions(in: existing).first { $0.label == "After Target" }
        )
        let updated = CaptureWriter.insertPartialEntry(
            entry: "### Clip\n\nCaptured block.",
            to: existing,
            placementID: target.id
        )

        XCTAssertTrue(updated.contains("## Target\n\nOld target.\n\n### Clip\n\nCaptured block.\n\n## Next"))
        XCTAssertFalse(updated.contains("## Notes\n\n### Clip\n\nCaptured block."))
    }

    func testPartialWebClipFallsBackToNotesWhenPlacementIsStale() {
        let existing = """
        # Topic

        Body.
        """

        let updated = CaptureWriter.insertPartialEntry(
            entry: "### Clip\n\nCaptured block.",
            to: existing,
            placementID: "after-heading:999"
        )

        XCTAssertTrue(updated.contains("## Notes\n\n### Clip\n\nCaptured block."))
    }

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
            snapshotFilename: ownedSnapshot,
            captureASTFilename: ownedAST
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
