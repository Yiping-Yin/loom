import XCTest
@testable import Loom

/// R1 — the Review wedge's pure engine (docs/canon/WHAT_IS_LOOM.md §6). The
/// scheduling is a forgetting-curve model, not a calendar of due dates, so
/// review debt is mathematically impossible: an item is a candidate only when
/// its predicted recall has decayed past a threshold, and the daily session
/// is a hard-capped constant. Everything here is pure and headless — the
/// capture integration, the cover→rebuild→reveal card, and the TodayView
/// surface all sit on top of this.
final class ReviewSchedulerTests: XCTestCase {

    // MARK: - recallProbability: the forgetting curve

    func testRecallProbabilityIsOneAtZeroElapsedAndHalfAtOneHalfLife() {
        XCTAssertEqual(ReviewScheduler.recallProbability(stabilityDays: 4, elapsedDays: 0), 1.0, accuracy: 1e-9)
        XCTAssertEqual(ReviewScheduler.recallProbability(stabilityDays: 4, elapsedDays: 4), 0.5, accuracy: 1e-9)
        XCTAssertEqual(ReviewScheduler.recallProbability(stabilityDays: 4, elapsedDays: 8), 0.25, accuracy: 1e-9)
    }

    func testRecallProbabilityIsMonotonicallyDecreasingAndClamped() {
        let p1 = ReviewScheduler.recallProbability(stabilityDays: 2, elapsedDays: 1)
        let p2 = ReviewScheduler.recallProbability(stabilityDays: 2, elapsedDays: 3)
        XCTAssertGreaterThan(p1, p2)
        // Negative elapsed (clock skew) never exceeds 1.
        XCTAssertEqual(ReviewScheduler.recallProbability(stabilityDays: 2, elapsedDays: -5), 1.0, accuracy: 1e-9)
        XCTAssertGreaterThanOrEqual(ReviewScheduler.recallProbability(stabilityDays: 2, elapsedDays: 1000), 0)
    }

    // MARK: - updatedStability: ratings grow or reset the half-life

    func testForgotResetsStabilitySolidExpandsFuzzyInBetween() {
        let current = 10.0
        let afterForgot = ReviewScheduler.updatedStability(current: current, rating: .forgot)
        let afterFuzzy = ReviewScheduler.updatedStability(current: current, rating: .fuzzy)
        let afterSolid = ReviewScheduler.updatedStability(current: current, rating: .solid)

        // Forgot resets to (at most) the initial small stability — the item
        // comes back fast (canon: aggressively resurface missed items).
        XCTAssertLessThanOrEqual(afterForgot, ReviewScheduler.initialStabilityDays)
        // Solid expands the most; fuzzy grows but less; strictly ordered.
        XCTAssertGreaterThan(afterSolid, afterFuzzy)
        XCTAssertGreaterThan(afterFuzzy, afterForgot)
        XCTAssertGreaterThan(afterSolid, current)
    }

    func testStabilityNeverCollapsesBelowInitialFloor() {
        let tiny = ReviewScheduler.updatedStability(current: 0.1, rating: .forgot)
        XCTAssertGreaterThan(tiny, 0)
    }

    // MARK: - todaysSession: constant serving, no debt

    private func item(id: String, stability: Double, lastReviewed: Date?, created: Date) -> ReviewItem {
        ReviewItem(
            id: id,
            anchorURL: "loom://anchor?src=doc&frag=\(id)",
            sourceQuote: "quote \(id)",
            userSentence: "my words \(id)",
            sourceTitle: "Doc",
            createdAt: created,
            stabilityDays: stability,
            lastReviewedAt: lastReviewed
        )
    }

    func testSessionOnlyIncludesItemsBelowThresholdMostAtRiskFirst() {
        let now = Date(timeIntervalSince1970: 1_000_000)
        let day = 86_400.0
        // fresh: reviewed today, high recall → not a candidate.
        let fresh = item(id: "fresh", stability: 8, lastReviewed: now, created: now)
        // due: reviewed 8 days ago, stability 4 → recall 0.25, well below 0.5.
        let due = item(id: "due", stability: 4, lastReviewed: now.addingTimeInterval(-8 * day), created: now)
        // borderline: reviewed 2 days ago, stability 4 → recall ~0.71, above 0.5.
        let borderline = item(id: "borderline", stability: 4, lastReviewed: now.addingTimeInterval(-2 * day), created: now)
        // ancient: reviewed 20 days ago, stability 4 → recall ~0.03, most at risk.
        let ancient = item(id: "ancient", stability: 4, lastReviewed: now.addingTimeInterval(-20 * day), created: now)

        let session = ReviewScheduler.todaysSession(
            items: [fresh, due, borderline, ancient],
            now: now, dailyCap: 10, candidateThreshold: 0.5)

        XCTAssertEqual(session.map(\.id), ["ancient", "due"], "only sub-threshold items, most-forgotten first")
        XCTAssertFalse(session.contains { $0.id == "fresh" || $0.id == "borderline" })
    }

    func testNewItemBecomesACandidateAfterAboutOneDay() {
        let now = Date(timeIntervalSince1970: 2_000_000)
        let day = 86_400.0
        // Never reviewed; created just over a day ago; initial stability 1 →
        // recall at ~1.2 days ≈ 0.435, below 0.5 → surfaces.
        let brandNew = item(id: "new", stability: ReviewScheduler.initialStabilityDays,
                            lastReviewed: nil, created: now.addingTimeInterval(-1.2 * day))
        let session = ReviewScheduler.todaysSession(
            items: [brandNew], now: now, dailyCap: 10, candidateThreshold: 0.5)
        XCTAssertEqual(session.map(\.id), ["new"])
    }

    func testHardCapMakesDebtSpikeImpossible() {
        let now = Date(timeIntervalSince1970: 3_000_000)
        let day = 86_400.0
        // 100 items all badly overdue — a classic Anki debt cliff.
        let overdue = (0..<100).map {
            item(id: "o\($0)", stability: 2, lastReviewed: now.addingTimeInterval(-30 * day), created: now)
        }
        let session = ReviewScheduler.todaysSession(
            items: overdue, now: now, dailyCap: 7, candidateThreshold: 0.5)
        // Exactly the cap — not 100. No "you owe 100" pile-up ever exists.
        XCTAssertEqual(session.count, 7)
    }

    func testEmptyAndAllFreshSessionsAreEmpty() {
        let now = Date(timeIntervalSince1970: 4_000_000)
        XCTAssertTrue(ReviewScheduler.todaysSession(items: [], now: now, dailyCap: 7, candidateThreshold: 0.5).isEmpty)
        let fresh = item(id: "f", stability: 30, lastReviewed: now, created: now)
        XCTAssertTrue(ReviewScheduler.todaysSession(items: [fresh], now: now, dailyCap: 7, candidateThreshold: 0.5).isEmpty)
    }

    // MARK: - ReviewItem model round-trips (it will be persisted)

    func testReviewItemCodableRoundTrip() throws {
        let original = item(id: "x", stability: 5.5, lastReviewed: Date(timeIntervalSince1970: 123), created: Date(timeIntervalSince1970: 100))
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(ReviewItem.self, from: data)
        XCTAssertEqual(decoded, original)
    }

    func testApplyRatingUpdatesStabilityAndStampsReview() {
        let now = Date(timeIntervalSince1970: 5_000_000)
        var it = item(id: "a", stability: 4, lastReviewed: nil, created: now.addingTimeInterval(-100))
        let before = it.stabilityDays
        it.apply(rating: .solid, at: now)
        XCTAssertGreaterThan(it.stabilityDays, before)
        XCTAssertEqual(it.lastReviewedAt, now)
    }
}
