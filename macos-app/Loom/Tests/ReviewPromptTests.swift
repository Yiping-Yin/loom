import XCTest
@testable import Loom

/// U1 — the review prompt escalates with mastery (docs/canon/WHAT_IS_LOOM.md
/// §6, the transfer caveat). Covering your own sentence risks training
/// verbatim recall of that sentence; to fight the illusion of competence, a
/// well-known item stops asking "what did you understand" and starts asking
/// you to APPLY it in a new context — the only hard signal of real
/// understanding vs memorizing your line. Pure, keyed off the existing
/// stability (no model change, no migration).
final class ReviewPromptTests: XCTestCase {

    func testNewItemGetsPlainRecallPrompt() {
        let p = ReviewPrompt.coverPrompt(stabilityDays: ReviewScheduler.initialStabilityDays)
        XCTAssertEqual(p.tier, .recall)
        XCTAssertFalse(p.text.isEmpty)
    }

    func testSettlingItemGetsElaborativePrompt() {
        let p = ReviewPrompt.coverPrompt(stabilityDays: 4)
        XCTAssertEqual(p.tier, .elaborate)
    }

    func testWellKnownItemGetsTransferPrompt() {
        let p = ReviewPrompt.coverPrompt(stabilityDays: 30)
        XCTAssertEqual(p.tier, .transfer)
    }

    func testTierIsMonotonicInStability() {
        let tiers = [0.5, 1, 3, 6, 10, 40].map { ReviewPrompt.coverPrompt(stabilityDays: $0).tier.rawValue }
        XCTAssertEqual(tiers, tiers.sorted(), "prompt only ever escalates with mastery")
    }

    func testEveryTierHasDistinctNonEmptyText() {
        let texts = Set([0.5, 4, 30].map { ReviewPrompt.coverPrompt(stabilityDays: $0).text })
        XCTAssertEqual(texts.count, 3, "each tier reads differently")
        XCTAssertFalse(texts.contains(""))
    }
}
