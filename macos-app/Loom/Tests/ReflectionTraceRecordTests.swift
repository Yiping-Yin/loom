import XCTest
@testable import Loom

/// Stage 1 (LoomDomain): the typed trace record must round-trip the rendered
/// English input lines byte-faithfully and produce view-models identical to
/// the legacy string-parsing path, or migration would silently rewrite the
/// owner's learning history.
final class ReflectionTraceRecordTests: XCTestCase {
    private let capturedPDFLine = "Captured selected word from Week 1 Notes.pdf, page 2 [vocabulary]: trajectories\nEvidence: app=Preview; window=Week 1 Notes.pdf – Page 2 of 20; kind=pdf; file=Week 1 Notes.pdf; anchor precision=file+page; evidence rung=native selection"
    private let capturedExcelLine = "Captured selected data from Loom Excel Learning Table.csv [data]: Price History: AUDUSD\nEvidence: app=Microsoft Excel; kind=spreadsheet; anchor precision=file"
    private let manualCommitLine = "Captured user trace from Week 1 Notes.pdf [user meaning]: 做市商的价差补偿逆向选择风险"
    private let legacyManualLine = "Manual learning note: The spread compensates the maker for adverse selection."
    private let narrationLine = "First language pass: keep the original file surface primary and capture vocabulary as anchored traces."

    func testCapturedLineRoundTripsThroughRecord() {
        let record = ReflectionTraceRecord.fromLegacyItem(capturedPDFLine, sourceLabel: "Week 1 Notes.pdf")
        XCTAssertEqual(record?.kind, "captured")
        XCTAssertEqual(record?.traceType, "selected word")
        XCTAssertEqual(record?.sourceAnchor, "Week 1 Notes.pdf, page 2")
        XCTAssertEqual(record?.focus, "vocabulary")
        XCTAssertEqual(record?.text, "trajectories")
        XCTAssertEqual(record?.evidence.first?.label, "app")
        XCTAssertEqual(record?.evidence.first?.value, "Preview")
        XCTAssertEqual(record?.renderLegacyItem(), capturedPDFLine)
    }

    func testManualAndChineseLinesParse() {
        let manual = ReflectionTraceRecord.fromLegacyItem(manualCommitLine, sourceLabel: "Week 1 Notes.pdf")
        XCTAssertEqual(manual?.kind, "captured")
        XCTAssertEqual(manual?.text, "做市商的价差补偿逆向选择风险")

        let legacy = ReflectionTraceRecord.fromLegacyItem(legacyManualLine, sourceLabel: "Week 1 Notes.pdf")
        XCTAssertEqual(legacy?.kind, "manual")
        XCTAssertEqual(legacy?.sourceAnchor, "Week 1 Notes.pdf")
        XCTAssertEqual(legacy?.renderLegacyItem(), legacyManualLine)
    }

    func testNarrationLinesProduceNoRecord() {
        XCTAssertNil(ReflectionTraceRecord.fromLegacyItem(narrationLine, sourceLabel: "Week 1 Notes.pdf"))
    }

    func testEvidenceMarkerInsideUserTextBehavesLikeStringPath() {
        let hostile = "Captured user trace from Notes.pdf [user meaning]: my note\nEvidence: fake=1\nEvidence: app=Preview"
        let record = ReflectionTraceRecord.fromLegacyItem(hostile, sourceLabel: "Notes.pdf")
        let stringPath = ReflectionLearningTrace.parseCaptured(hostile, version: 1)
        XCTAssertEqual(record?.text, stringPath?.text)
        XCTAssertEqual(record?.evidence.map(\.label), stringPath?.evidence.map(\.label))
        XCTAssertEqual(record?.renderLegacyItem(), hostile)
    }

    func testViewModelEquivalenceBetweenRecordAndStringPaths() {
        let lines = [capturedPDFLine, capturedExcelLine, manualCommitLine, legacyManualLine, narrationLine]
        var learningCase = ReflectionCase.blank()
        learningCase.title = "Week 1 Notes.pdf"
        learningCase.project = "Learning pass"
        learningCase.steps[0].items = lines

        let fromStrings = ReflectionLearningTrace.from(learningCase)
        let records = lines.compactMap { ReflectionTraceRecord.fromLegacyItem($0, sourceLabel: "Week 1 Notes.pdf") }
        let fromRecords = ReflectionLearningTrace.from(records: records)

        XCTAssertEqual(fromStrings.count, 4)
        XCTAssertEqual(fromStrings, fromRecords)
    }

    func testCodableRoundTrip() throws {
        let record = try XCTUnwrap(ReflectionTraceRecord.fromLegacyItem(capturedPDFLine, sourceLabel: "Week 1 Notes.pdf", createdAt: Date(timeIntervalSince1970: 1_782_000_000)))
        let data = try JSONEncoder().encode(record)
        let decoded = try JSONDecoder().decode(ReflectionTraceRecord.self, from: data)
        XCTAssertEqual(decoded, record)
        XCTAssertEqual(decoded.schemaVersion, 1)
    }
}
