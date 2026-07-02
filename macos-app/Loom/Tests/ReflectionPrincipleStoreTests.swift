import XCTest
@testable import Loom

/// Stage 4 (融会贯通): the promotion gate must inherit anchor honesty —
/// memory can never be more confident than its weakest citation — and the
/// reuse matcher must stay a pure, cross-case-only suggestion.
final class ReflectionPrincipleStoreTests: XCTestCase {
    private var fileURL: URL!

    override func setUp() {
        super.setUp()
        fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("loom-principle-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("reflection-principles.json")
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: fileURL.deletingLastPathComponent())
        super.tearDown()
    }

    private func trace(anchorPrecision: String, weak: Bool = false) -> ReflectionLearningTrace? {
        let line = "Captured selected word from Week 1 Notes.pdf, page 2 [principle]: Quote only when you know your out\nEvidence: app=Preview; anchor precision=\(anchorPrecision)\(weak ? "; fallback note=weak anchor" : "")"
        var learningCase = ReflectionCase.blank()
        learningCase.project = "Learning pass"
        learningCase.steps[0].items = [line]
        return ReflectionLearningTrace.from(learningCase).first
    }

    func testStrongAnchorPromotes() throws {
        var origin = ReflectionCase.blank()
        origin.title = "Market Making · FINS3666"
        let outcome = ReflectionPrincipleStore.promote(
            statement: "Quote only when you know your out.",
            holdsWithin: "single instrument, simulated exchange",
            from: origin,
            anchoringTrace: trace(anchorPrecision: "file+page")
        )
        guard case .promoted(let record) = outcome else {
            return XCTFail("strong anchor must promote, got \(outcome)")
        }
        XCTAssertEqual(record.anchorPrecision, "file+page")
        XCTAssertEqual(record.sourceCaseTitle, "Market Making · FINS3666")
        XCTAssertEqual(record.sourceAnchor, "Week 1 Notes.pdf, page 2")
    }

    func testWeakAnchorBlocksPromotion() {
        let outcome = ReflectionPrincipleStore.promote(
            statement: "A plausible-sounding rule.",
            holdsWithin: "",
            from: ReflectionCase.blank(),
            anchoringTrace: trace(anchorPrecision: "visual context only", weak: true)
        )
        guard case .blockedWeakAnchor = outcome else {
            return XCTFail("weak anchor must BLOCK promotion, got \(outcome)")
        }
    }

    func testEmptyStatementBlocks() {
        let outcome = ReflectionPrincipleStore.promote(
            statement: "   ",
            holdsWithin: "",
            from: ReflectionCase.blank(),
            anchoringTrace: nil
        )
        XCTAssertEqual(outcome, .blockedEmptyStatement)
    }

    func testPersistenceRoundTrip() throws {
        guard case .promoted(let record) = ReflectionPrincipleStore.promote(
            statement: "Distrust any edge that survives label shuffling.",
            holdsWithin: "daily bars, single asset",
            from: ReflectionCase.blank(),
            anchoringTrace: trace(anchorPrecision: "file+page")
        ) else { return XCTFail("setup promote failed") }

        ReflectionPrincipleStore.save([record], fileURL: fileURL)
        let loaded = ReflectionPrincipleStore.load(fileURL: fileURL)
        XCTAssertEqual(loaded, [record])
    }

    func testReuseMatchingIsCrossCaseOnlyAndTermBased() throws {
        var origin = ReflectionCase.blank()
        origin.title = "Origin case"
        guard case .promoted(let record) = ReflectionPrincipleStore.promote(
            statement: "For market making, the spread compensates adverse selection.",
            holdsWithin: "simulated exchange",
            from: origin,
            anchoringTrace: trace(anchorPrecision: "file+page")
        ) else { return XCTFail("setup promote failed") }

        var related = ReflectionCase.blank()
        related.title = "Adverse selection notes"
        related.summary = "Reading about market spread behavior."
        var unrelated = ReflectionCase.blank()
        unrelated.title = "Kitchen recipes"
        unrelated.summary = "Baking bread at home."
        unrelated.tags = []

        XCTAssertEqual(ReflectionPrincipleStore.reuseCandidates(for: related, in: [record]).map(\.id), [record.id])
        XCTAssertTrue(ReflectionPrincipleStore.reuseCandidates(for: unrelated, in: [record]).isEmpty)
        // Never suggests a principle back into its own origin case.
        XCTAssertTrue(ReflectionPrincipleStore.reuseCandidates(for: origin, in: [record]).isEmpty)
    }
}
