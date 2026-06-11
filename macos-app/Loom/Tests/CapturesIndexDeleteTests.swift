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

    private func entry(title: String, eyebrow: String, fileURL: URL) -> CaptureEntry {
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
            fileURL: fileURL
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
