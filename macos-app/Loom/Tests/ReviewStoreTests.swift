import XCTest
@testable import Loom

/// R2 persistence — the Review wedge's store. Thin policy layer over the pure
/// engine: sync a note's items on save, record a self-rating, and serve
/// today's capped no-debt session. Injectable UserDefaults so it's testable
/// without touching the owner's real store.
final class ReviewStoreTests: XCTestCase {

    private func freshDefaults() -> UserDefaults {
        let d = UserDefaults(suiteName: "loom.review.tests.\(UUID().uuidString)")!
        return d
    }

    private func note(quote: String, anchor: String, claim: String) -> NSAttributedString {
        let m = NSMutableAttributedString()
        m.append(NSAttributedString(string: "\u{201C}\(quote)\u{201D}"))
        m.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: anchor]))
        m.append(NSAttributedString(string: "\n"))
        m.append(NSAttributedString(string: claim))
        return m
    }

    func testSaveLoadRoundTrip() {
        let d = freshDefaults()
        XCTAssertTrue(ReviewStore.loadAll(defaults: d).isEmpty)
        let items = [ReviewItem(id: "a", anchorURL: "loom://anchor?a", sourceQuote: "q",
                                userSentence: "s", sourceTitle: "T",
                                createdAt: Date(timeIntervalSince1970: 1), stabilityDays: 3)]
        ReviewStore.saveAll(items, defaults: d)
        XCTAssertEqual(ReviewStore.loadAll(defaults: d), items)
    }

    func testSyncNoteCreatesItemsAndIsIdempotent() {
        let d = freshDefaults()
        let now = Date(timeIntervalSince1970: 10_000)
        let doc = note(quote: "The reward model disappears.",
                       anchor: "loom://anchor?src=dpo", claim: "DPO is one supervised loss.")

        let first = ReviewStore.syncNote(document: doc, sourceTitle: "DPO", now: now, defaults: d)
        XCTAssertEqual(first.count, 1)
        XCTAssertEqual(first[0].userSentence, "DPO is one supervised loss.")

        // Re-syncing the same note must not duplicate.
        let again = ReviewStore.syncNote(document: doc, sourceTitle: "DPO", now: now, defaults: d)
        XCTAssertEqual(again.count, 1)
        XCTAssertEqual(ReviewStore.loadAll(defaults: d).count, 1)
    }

    func testSyncNotePreservesScheduleWhenClaimEdited() {
        let d = freshDefaults()
        let now = Date(timeIntervalSince1970: 10_000)
        let anchor = "loom://anchor?src=dpo"
        _ = ReviewStore.syncNote(document: note(quote: "q", anchor: anchor, claim: "old"), sourceTitle: "DPO", now: now, defaults: d)
        // Review it → schedule advances.
        let id = ReviewStore.loadAll(defaults: d)[0].id
        ReviewStore.recordReview(itemID: id, rating: .solid, at: now, defaults: d)
        let advanced = ReviewStore.loadAll(defaults: d)[0].stabilityDays
        XCTAssertGreaterThan(advanced, ReviewScheduler.initialStabilityDays)

        // Edit the claim and re-sync → content updates, schedule survives.
        _ = ReviewStore.syncNote(document: note(quote: "q", anchor: anchor, claim: "new words"), sourceTitle: "DPO", now: now, defaults: d)
        let after = ReviewStore.loadAll(defaults: d)[0]
        XCTAssertEqual(after.userSentence, "new words")
        XCTAssertEqual(after.stabilityDays, advanced, "review schedule not lost on edit")
    }

    func testRecordReviewStampsAndPersists() {
        let d = freshDefaults()
        let now = Date(timeIntervalSince1970: 20_000)
        ReviewStore.saveAll([ReviewItem(id: "x", anchorURL: "a", sourceQuote: "q", userSentence: "s",
                                        sourceTitle: "T", createdAt: now, stabilityDays: 4)], defaults: d)
        ReviewStore.recordReview(itemID: "x", rating: .forgot, at: now, defaults: d)
        let item = ReviewStore.loadAll(defaults: d)[0]
        XCTAssertEqual(item.lastReviewedAt, now)
        XCTAssertLessThanOrEqual(item.stabilityDays, ReviewScheduler.initialStabilityDays, "forgot resets")
    }

    func testDueTodayAppliesCapAndNoDebt() {
        let d = freshDefaults()
        let now = Date(timeIntervalSince1970: 30_000)
        let day = 86_400.0
        // 50 badly-overdue items → still capped, never a pile.
        let items = (0..<50).map {
            ReviewItem(id: "o\($0)", anchorURL: "a\($0)", sourceQuote: "q", userSentence: "s",
                       sourceTitle: "T", createdAt: now.addingTimeInterval(-40 * day),
                       stabilityDays: 2, lastReviewedAt: now.addingTimeInterval(-40 * day))
        }
        ReviewStore.saveAll(items, defaults: d)
        let due = ReviewStore.dueToday(now: now, defaults: d)
        XCTAssertEqual(due.count, ReviewStore.defaultDailyCap)
        XCTAssertLessThan(due.count, 50, "no debt pile")
    }
}
