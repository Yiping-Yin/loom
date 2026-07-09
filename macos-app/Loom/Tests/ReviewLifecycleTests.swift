import XCTest
@testable import Loom

/// The Review wedge's END-TO-END promise (docs/canon/WHAT_IS_LOOM.md §6),
/// walked across simulated days: you anchor a quote and write your OWN
/// sentence → it comes back → you rebuild it → each solid recall pushes its
/// next return further out (the spacing that makes review compound), while a
/// lapse brings it back soon and then re-expands. Every unit is proven in
/// isolation elsewhere (extraction, scheduler, streak, store); THIS proves the
/// composition actually delivers the promise — the one thing a pile of unit
/// tests can leave unverified. Injectable UserDefaults: never touches the
/// owner's real store.
final class ReviewLifecycleTests: XCTestCase {

    private func freshDefaults() -> UserDefaults {
        UserDefaults(suiteName: "loom.review.lifecycle.\(UUID().uuidString)")!
    }

    /// A note the way the editor writes it: an evidence paragraph (quote + the
    /// linked locator glyph carrying loom://anchor) then your claim paragraph.
    private func note(quote: String, anchor: String, claim: String) -> NSAttributedString {
        let m = NSMutableAttributedString()
        m.append(NSAttributedString(string: "\u{201C}\(quote)\u{201D}"))
        m.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: anchor]))
        m.append(NSAttributedString(string: "\n"))
        m.append(NSAttributedString(string: claim))
        return m
    }

    private func day(_ base: Date, _ n: Double) -> Date { base.addingTimeInterval(n * 86_400.0) }

    private func isDue(_ anchor: String, on date: Date, _ d: UserDefaults) -> Bool {
        ReviewStore.dueToday(now: date, defaults: d).contains { $0.anchorURL == anchor }
    }

    private func itemID(_ anchor: String, _ d: UserDefaults) -> String {
        ReviewStore.loadAll(defaults: d).first { $0.anchorURL == anchor }!.id
    }

    /// The compounding promise. A freshly written card is not a chore the same
    /// day; it surfaces after ~1 half-life; each solid recall roughly doubles
    /// the wait before it next surfaces (×2.4 stability). The gap must WIDEN
    /// with each successful recall — that is what makes review pay off.
    func testSolidRecallsCompoundTheReturnInterval() {
        let d = freshDefaults()
        let anchor = "loom://anchor?src=dpo"
        let t0 = Date(timeIntervalSince1970: 1_000_000)

        // Day 0: write it. Fresh (recall = 1) → NOT due yet.
        _ = ReviewStore.syncNote(
            document: note(quote: "The reward model disappears.",
                           anchor: anchor, claim: "DPO folds RLHF into one supervised loss."),
            sourceTitle: "DPO", now: t0, defaults: d)
        XCTAssertFalse(isDue(anchor, on: t0, d), "a card you just wrote is not due the same minute")

        // ~1 day on, recall has decayed to the threshold → it comes back.
        XCTAssertTrue(isDue(anchor, on: day(t0, 1.1), d), "after ~1 half-life it returns for its first recall")

        // First solid recall → stability grows (1.0 × 2.4 ≈ 2.4 days).
        let id = itemID(anchor, d)
        ReviewStore.recordReview(itemID: id, rating: .solid, at: day(t0, 1.1), defaults: d)

        // The very next day it must NOT be due — the interval expanded past 1 day.
        XCTAssertFalse(isDue(anchor, on: day(t0, 2.2), d), "one solid recall pushes the next return out")
        // It surfaces again only once the wider (~2.4d) interval has elapsed.
        XCTAssertTrue(isDue(anchor, on: day(t0, 4.0), d), "it returns once the longer interval elapses")

        // Second solid recall → stability grows again (≈ 5.8 days).
        ReviewStore.recordReview(itemID: id, rating: .solid, at: day(t0, 4.0), defaults: d)
        // The gap is now clearly wider than the first: still not due 2 days on…
        XCTAssertFalse(isDue(anchor, on: day(t0, 6.0), d), "the second recall widens the interval further")
        // …but due once ~5.8 days have passed. Spacing compounds.
        XCTAssertTrue(isDue(anchor, on: day(t0, 10.5), d), "each recall widens the gap — review compounds")
    }

    /// A lapse is forgiving, not punishing. Forgetting resets the card to the
    /// short initial interval (it comes back SOON so you can relearn it) — never
    /// below the floor, never a permanent penalty, never a growing debt.
    func testForgettingBringsItBackSoonNotAsDebt() {
        let d = freshDefaults()
        let anchor = "loom://anchor?src=ppo"
        let t0 = Date(timeIntervalSince1970: 2_000_000)
        _ = ReviewStore.syncNote(
            document: note(quote: "Clip the probability ratio.",
                           anchor: anchor, claim: "PPO trusts only small policy steps."),
            sourceTitle: "PPO", now: t0, defaults: d)
        let id = itemID(anchor, d)

        // Grow its interval with a solid recall so the reset is observable.
        ReviewStore.recordReview(itemID: id, rating: .solid, at: day(t0, 1.1), defaults: d)
        let wide = ReviewStore.loadAll(defaults: d)[0].stabilityDays
        XCTAssertGreaterThan(wide, ReviewScheduler.initialStabilityDays)

        // Then forget it → stability collapses back to the initial floor.
        ReviewStore.recordReview(itemID: id, rating: .forgot, at: day(t0, 5.0), defaults: d)
        let reset = ReviewStore.loadAll(defaults: d)[0].stabilityDays
        XCTAssertLessThan(reset, wide, "forgetting shrinks the interval back down")
        XCTAssertEqual(reset, ReviewScheduler.initialStabilityDays, accuracy: 0.0001,
                       "a lapse returns to the short initial interval, never below the floor")

        // So it returns SOON (about a day later) to be relearned — not weeks out.
        XCTAssertTrue(isDue(anchor, on: day(t0, 6.2), d), "a forgotten card comes back soon, not as a chore later")
    }

    /// No-debt under neglect: skip for a long time and you still get exactly the
    /// daily cap of the most-forgotten items — never a pile. Ten cards all long
    /// overdue → dueToday hands back the cap, not ten.
    func testLongNeglectStillHandsBackOnlyTheDailyCap() {
        let d = freshDefaults()
        let t0 = Date(timeIntervalSince1970: 3_000_000)
        for i in 0..<10 {
            _ = ReviewStore.syncNote(
                document: note(quote: "Quote \(i).", anchor: "loom://anchor?src=n\(i)",
                               claim: "My distillation number \(i)."),
                sourceTitle: "N\(i)", now: t0, defaults: d)
        }
        // A month later every card is deeply forgotten…
        let session = ReviewStore.dueToday(now: day(t0, 30), defaults: d)
        // …yet the session is capped, so debt can't spike.
        XCTAssertEqual(session.count, ReviewStore.defaultDailyCap,
                       "long neglect surfaces the cap of most-forgotten items, never the whole pile")
        XCTAssertLessThan(session.count, 10)
    }
}
