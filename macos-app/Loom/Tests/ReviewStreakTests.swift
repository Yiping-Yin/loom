import XCTest
@testable import Loom

/// U2 — the forgiving review streak (docs/canon/WHAT_IS_LOOM.md §6). Duolingo's
/// "come back tomorrow" lever, done the honest way: it only advances on a REAL
/// recall (a rating recorded today), it auto-freezes a single missed day so
/// one slip doesn't erase the habit, and it's a quiet number — no guilt-owl,
/// no confetti. Pure day-granularity logic so the forgiving/freeze cases are
/// deterministically testable.
final class ReviewStreakTests: XCTestCase {

    private func day(_ n: Int) -> Date { Date(timeIntervalSince1970: TimeInterval(n) * 86_400) }

    func testFirstActivityStartsAtOne() {
        let s = ReviewStreak.advance(.empty, day: day(10))
        XCTAssertEqual(s.current, 1)
        XCTAssertEqual(s.lastActiveDay, day(10))
    }

    func testSameDayDoesNotDoubleCount() {
        var s = ReviewStreak.advance(.empty, day: day(10))
        s = ReviewStreak.advance(s, day: day(10))
        XCTAssertEqual(s.current, 1)
    }

    func testConsecutiveDaysIncrement() {
        var s = ReviewStreak.advance(.empty, day: day(10))
        s = ReviewStreak.advance(s, day: day(11))
        s = ReviewStreak.advance(s, day: day(12))
        XCTAssertEqual(s.current, 3)
    }

    func testOneMissedDayIsAutoFrozenNotBroken() {
        var s = ReviewStreak.advance(.empty, day: day(10)) // 1
        s = ReviewStreak.advance(s, day: day(11))          // 2
        // skip day 12
        s = ReviewStreak.advance(s, day: day(13))          // bridged → 3, not reset
        XCTAssertEqual(s.current, 3)
        XCTAssertEqual(s.lastActiveDay, day(13))
    }

    func testTwoOrMoreMissedDaysResetsToOne() {
        var s = ReviewStreak.advance(.empty, day: day(10)) // 1
        s = ReviewStreak.advance(s, day: day(11))          // 2
        // skip days 12 and 13
        s = ReviewStreak.advance(s, day: day(14))          // gap of 3 → reset
        XCTAssertEqual(s.current, 1)
        XCTAssertEqual(s.lastActiveDay, day(14))
    }

    // MARK: - store integration (only a real recall advances it)

    func testRecordReviewAdvancesStreakOncePerDay() {
        let d = UserDefaults(suiteName: "loom.streak.tests.\(UUID().uuidString)")!
        let now = Date(timeIntervalSince1970: 100 * 86_400 + 3_600) // some time on day 100
        ReviewStore.saveAll([ReviewItem(id: "x", anchorURL: "a", sourceQuote: "q", userSentence: "s",
                                        sourceTitle: "T", createdAt: now, stabilityDays: 4)], defaults: d)
        ReviewStore.recordReview(itemID: "x", rating: .solid, at: now, defaults: d)
        XCTAssertEqual(ReviewStore.currentStreak(defaults: d), 1)
        // second review same day → still 1
        ReviewStore.recordReview(itemID: "x", rating: .fuzzy, at: now, defaults: d)
        XCTAssertEqual(ReviewStore.currentStreak(defaults: d), 1)
    }
}
