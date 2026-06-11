import XCTest
@testable import Loom

final class CapturesIndexDeleteTests: XCTestCase {
    private var directory: URL!

    override func setUpWithError() throws {
        directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("loom-capture-delete-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: directory)
    }

    private func writeLoomMD(_ source: String) throws -> URL {
        let url = directory.appendingPathComponent("Loom.md")
        try source.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private func entry(
        title: String,
        eyebrow: String,
        fileURL: URL,
        snapshotFilename: String? = nil
    ) -> CaptureEntry {
        CaptureEntry(
            id: UUID(),
            rootID: UUID(),
            rootLabel: "Web Captures",
            kind: .web,
            subPath: "sub/Web/flipdisc.io",
            domain: "flipdisc.io",
            title: title,
            eyebrow: eyebrow,
            snippet: "",
            timestamp: nil,
            fileURL: fileURL,
            snapshotFilename: snapshotFilename
        )
    }

    func testDeleteRemovesOnlyTargetedEntryBlock() throws {
        let url = try writeLoomMD("""
        ## Notes

        ### Flipdisc Display Build and Software Guide
        *clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)*

        Flipdiscs are a display type.

        ### Later Capture
        *clipboard · 2026-05-09 19:51 · [↗](https://flipdisc.io/)*

        Second body.
        """)

        let target = entry(
            title: "Flipdisc Display Build and Software Guide",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            fileURL: url
        )
        XCTAssertTrue(try CapturesIndex.delete(target))

        let rewritten = try String(contentsOf: url, encoding: .utf8)
        XCTAssertFalse(rewritten.contains("Flipdisc Display Build and Software Guide"))
        XCTAssertFalse(rewritten.contains("Flipdiscs are a display type."))
        XCTAssertTrue(rewritten.contains("### Later Capture"))
        XCTAssertTrue(rewritten.contains("Second body."))
    }

    func testDeleteDisambiguatesByEyebrowWhenTitlesCollide() throws {
        let url = try writeLoomMD("""
        ## Notes

        ### Same Page Twice
        *clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)*

        First capture body.

        ### Same Page Twice
        *clipboard · 2026-05-09 19:51 · [↗](https://flipdisc.io/)*

        Second capture body.
        """)

        let second = entry(
            title: "Same Page Twice",
            eyebrow: "clipboard · 2026-05-09 19:51 · [↗](https://flipdisc.io/)",
            fileURL: url
        )
        XCTAssertTrue(try CapturesIndex.delete(second))

        let rewritten = try String(contentsOf: url, encoding: .utf8)
        XCTAssertTrue(rewritten.contains("19:50"))
        XCTAssertTrue(rewritten.contains("First capture body."))
        XCTAssertFalse(rewritten.contains("19:51"))
        XCTAssertFalse(rewritten.contains("Second capture body."))
    }

    /// Writes the two-capture fixture used by the sidecar-cleanup tests:
    /// the first capture owns an AST sidecar, a timestamp-matched
    /// snapshot, and one media file; a second media file is shared with
    /// the surviving second capture; one snapshot belongs to a
    /// different capture (different timestamp).
    private struct SidecarFixture {
        let markdownURL: URL
        let ownedAST = "Loom-capture-ast-20260509-195026-owned.json"
        let ownedSnapshot = "Loom-snapshot-20260509-195026-owned.html"
        let ownedMedia = "Loom-media-owned.jpg"
        let sharedMedia = "Loom-media-shared.jpg"
        let unrelatedSnapshot = "Loom-snapshot-20260509-195100-keep.html"

        func path(_ name: String) -> String {
            markdownURL.deletingLastPathComponent().appendingPathComponent(name).path
        }
    }

    private func writeSidecarFixture() throws -> SidecarFixture {
        let fixture = SidecarFixture(markdownURL: directory.appendingPathComponent("Loom.md"))
        let source = """
        ## Notes

        ### Flipdisc Display Build and Software Guide
        *clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)*

        <!-- loom-capture-ast: \(fixture.ownedAST) -->

        <img src="loom://content/root/sub/Web/flipdisc.io/\(fixture.ownedMedia)">
        <img src="loom://content/root/sub/Web/flipdisc.io/\(fixture.sharedMedia)">

        ### Later Capture
        *clipboard · 2026-05-09 19:51 · [↗](https://flipdisc.io/)*

        <img src="loom://content/root/sub/Web/flipdisc.io/\(fixture.sharedMedia)">
        """
        try source.write(to: fixture.markdownURL, atomically: true, encoding: .utf8)
        for name in [
            fixture.ownedAST,
            fixture.ownedSnapshot,
            fixture.ownedMedia,
            fixture.sharedMedia,
            fixture.unrelatedSnapshot,
        ] {
            try "sidecar".write(
                to: directory.appendingPathComponent(name),
                atomically: true,
                encoding: .utf8
            )
        }
        return fixture
    }

    func testDeleteRemovesOwnedASTSnapshotAndMediaFiles() throws {
        let fixture = try writeSidecarFixture()
        let target = entry(
            title: "Flipdisc Display Build and Software Guide",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            fileURL: fixture.markdownURL
        )

        XCTAssertTrue(try CapturesIndex.delete(target))

        let rewritten = try String(contentsOf: fixture.markdownURL, encoding: .utf8)
        XCTAssertFalse(rewritten.contains("Flipdisc Display Build and Software Guide"))
        XCTAssertTrue(rewritten.contains("### Later Capture"))
        let fm = FileManager.default
        XCTAssertFalse(fm.fileExists(atPath: fixture.path(fixture.ownedAST)))
        XCTAssertFalse(fm.fileExists(atPath: fixture.path(fixture.ownedSnapshot)))
        XCTAssertFalse(fm.fileExists(atPath: fixture.path(fixture.ownedMedia)))
    }

    func testDeleteKeepsMediaStillReferencedByOtherEntries() throws {
        let fixture = try writeSidecarFixture()
        let target = entry(
            title: "Flipdisc Display Build and Software Guide",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            fileURL: fixture.markdownURL
        )

        XCTAssertTrue(try CapturesIndex.delete(target))

        XCTAssertTrue(FileManager.default.fileExists(atPath: fixture.path(fixture.sharedMedia)))
    }

    func testDeleteKeepsSnapshotsBelongingToOtherCaptures() throws {
        let fixture = try writeSidecarFixture()
        // scanRoot assigns the directory's newest snapshot to every
        // entry, so the entry can arrive pointing at a snapshot it does
        // not own. Ownership is decided by the AST timestamp, never by
        // this field.
        let target = entry(
            title: "Flipdisc Display Build and Software Guide",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            fileURL: fixture.markdownURL,
            snapshotFilename: fixture.unrelatedSnapshot
        )

        XCTAssertTrue(try CapturesIndex.delete(target))

        XCTAssertTrue(FileManager.default.fileExists(atPath: fixture.path(fixture.unrelatedSnapshot)))
        XCTAssertFalse(FileManager.default.fileExists(atPath: fixture.path(fixture.ownedSnapshot)))
    }

    func testDeleteReturnsFalseWhenEntryNotFound() throws {
        let source = """
        ## Notes

        ### Existing Capture
        *clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)*

        Body.
        """
        let url = try writeLoomMD(source)

        let stale = entry(
            title: "Never Saved",
            eyebrow: "clipboard · 2026-05-09 19:50 · [↗](https://flipdisc.io/)",
            fileURL: url
        )
        XCTAssertFalse(try CapturesIndex.delete(stale))
        XCTAssertEqual(try String(contentsOf: url, encoding: .utf8), source)
    }
}
