import XCTest
@testable import Loom

/// R3 — the cover→rebuild→reveal→rate state machine behind the review card.
/// The valuable act is the RECALL (canon §6): the card must force
/// hide → retrieve → reveal, never let you passively re-read. So a rating
/// only counts after a reveal, and each rating advances to the next card.
final class ReviewSessionTests: XCTestCase {

    private func items(_ n: Int) -> [ReviewItem] {
        (0..<n).map {
            ReviewItem(id: "i\($0)", anchorURL: "a\($0)", sourceQuote: "q\($0)",
                       userSentence: "s\($0)", sourceTitle: "T", createdAt: Date(timeIntervalSince1970: 0),
                       stabilityDays: 1)
        }
    }

    func testStartsCoveredOnFirstCard() {
        let s = ReviewSession(items: items(3), onRate: { _, _, _ in })
        XCTAssertEqual(s.current?.id, "i0")
        XCTAssertFalse(s.isRevealed)
        XCTAssertFalse(s.isComplete)
        XCTAssertEqual(s.completedCount, 0)
        XCTAssertEqual(s.total, 3)
    }

    func testRatingBeforeRevealIsIgnored() {
        var calls = 0
        let s = ReviewSession(items: items(2), onRate: { _, _, _ in calls += 1 })
        s.rate(.solid)   // no reveal yet → must be a no-op (no passive rating)
        XCTAssertEqual(calls, 0)
        XCTAssertEqual(s.current?.id, "i0")
        XCTAssertEqual(s.completedCount, 0)
    }

    func testRevealThenRateRecordsAndAdvancesResettingCover() {
        var recorded: [(String, ReviewRating)] = []
        let now = Date(timeIntervalSince1970: 555)
        let s = ReviewSession(items: items(2), now: { now }, onRate: { id, r, d in
            XCTAssertEqual(d, now)
            recorded.append((id, r))
        })
        s.reveal()
        XCTAssertTrue(s.isRevealed)
        s.rate(.fuzzy)
        XCTAssertEqual(recorded.map(\.0), ["i0"])
        XCTAssertEqual(recorded.map(\.1), [.fuzzy])
        // advanced to card 2, re-covered
        XCTAssertEqual(s.current?.id, "i1")
        XCTAssertFalse(s.isRevealed)
        XCTAssertEqual(s.completedCount, 1)
    }

    func testCompletingAllCardsEndsTheSession() {
        let s = ReviewSession(items: items(2), onRate: { _, _, _ in })
        s.reveal(); s.rate(.solid)
        s.reveal(); s.rate(.forgot)
        XCTAssertTrue(s.isComplete)
        XCTAssertNil(s.current)
        XCTAssertEqual(s.completedCount, 2)
    }

    func testReloadReplacesQueueAndRecoversFromTheTop() {
        let s = ReviewSession(items: items(2), onRate: { _, _, _ in })
        s.reveal(); s.rate(.solid)     // advanced + revealed toggled
        s.reload(items: items(3))
        XCTAssertEqual(s.current?.id, "i0")
        XCTAssertFalse(s.isRevealed)
        XCTAssertEqual(s.total, 3)
        XCTAssertEqual(s.completedCount, 0)
        XCTAssertFalse(s.isComplete)
    }

    func testReturnToSourceParsesAnchorAndPostsJump() {
        var received: [String: Any]?
        let token = NotificationCenter.default.addObserver(
            forName: .loomReflectionAnchorJump, object: nil, queue: nil) { note in
            received = note.userInfo as? [String: Any]
        }
        defer { NotificationCenter.default.removeObserver(token) }

        ReviewSessionView.returnToSource(anchorURL: "loom://anchor?src=doc42&page=3&rect=1,2,3,4")
        XCTAssertEqual(received?["sourceID"] as? String, "doc42")
        XCTAssertEqual(received?["page"] as? Int, 3)

        received = nil
        ReviewSessionView.returnToSource(anchorURL: "not-an-anchor")
        XCTAssertNil(received, "non-anchor strings post nothing")
    }

    func testEmptySessionIsImmediatelyComplete() {
        let s = ReviewSession(items: [], onRate: { _, _, _ in })
        XCTAssertTrue(s.isComplete)
        XCTAssertNil(s.current)
        s.reveal()          // guarded — no crash
        s.rate(.solid)      // guarded — no crash
        XCTAssertTrue(s.isComplete)
    }
}
