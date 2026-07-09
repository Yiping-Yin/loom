import XCTest
@testable import Loom

/// R2 (pure core) — turn a note document into ReviewItems. When you anchor a
/// quote and write your own sentence under it (docs/canon/WHAT_IS_LOOM.md §6),
/// that (anchored evidence paragraph → your claim paragraph) pairing IS a
/// review item. Extraction reads the pairing off the attributed string;
/// upsert merges it into the store WITHOUT losing scheduling state and never
/// deletes (orphan GC is a separate concern). Both pure and headless — the
/// shell just calls them on save.
final class ReviewExtractionTests: XCTestCase {

    // Build a note: for each pair, an evidence paragraph (quote + a locator
    // glyph carrying the loom://anchor link) then a claim paragraph.
    private func note(_ pairs: [(quote: String, anchor: String?, claim: String)]) -> NSAttributedString {
        let doc = NSMutableAttributedString()
        for (i, p) in pairs.enumerated() {
            if i > 0 { doc.append(NSAttributedString(string: "\n")) }
            // evidence line: quote text + a linked locator glyph
            doc.append(NSAttributedString(string: "\u{201C}\(p.quote)\u{201D}"))
            if let anchor = p.anchor {
                doc.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: anchor]))
            }
            doc.append(NSAttributedString(string: "\n"))
            // claim line (the user's own sentence)
            doc.append(NSAttributedString(string: p.claim))
        }
        return doc
    }

    func testExtractsAnchorQuoteAndTheClaimParagraphBeneathIt() {
        let doc = note([
            (quote: "The reward model disappears.", anchor: "loom://anchor?src=dpo&frag=key", claim: "DPO folds RLHF into one supervised loss."),
        ])
        let out = ReviewExtraction.extract(from: doc)
        XCTAssertEqual(out.count, 1)
        XCTAssertEqual(out[0].anchorURL, "loom://anchor?src=dpo&frag=key")
        XCTAssertTrue(out[0].sourceQuote.contains("reward model disappears"))
        XCTAssertEqual(out[0].userSentence, "DPO folds RLHF into one supervised loss.")
    }

    func testSkipsAnchoredQuotesWithNoClaimWritten() {
        // An anchored quote followed by nothing / an empty line is not yet a
        // review item — the user hasn't distilled it. (A quote with no claim
        // must LOOK unfinished; it also must not become a coverable card.)
        let doc = note([
            (quote: "Unclaimed quote.", anchor: "loom://anchor?src=x&frag=1", claim: ""),
        ])
        XCTAssertTrue(ReviewExtraction.extract(from: doc).isEmpty)
    }

    func testIgnoresPlainParagraphsWithNoAnchor() {
        let doc = NSAttributedString(string: "Just a plain note.\nNo anchors here.")
        XCTAssertTrue(ReviewExtraction.extract(from: doc).isEmpty)
    }

    func testTwoConsecutiveAnchorsDoNotStealEachOthersClaim() {
        // quote A, then quote B (no claim for A), then a claim. A gets no
        // claim (next paragraph is another anchor); B gets the claim.
        let doc = note([
            (quote: "Quote A.", anchor: "loom://anchor?a", claim: "\u{201C}Quote B.\u{201D}\u{200A}\u{25C6}"),
        ])
        // The above put B's evidence in A's "claim" slot; build it explicitly:
        let m = NSMutableAttributedString()
        m.append(NSAttributedString(string: "\u{201C}Quote A.\u{201D}"))
        m.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: "loom://anchor?a"]))
        m.append(NSAttributedString(string: "\n"))
        m.append(NSAttributedString(string: "\u{201C}Quote B.\u{201D}"))
        m.append(NSAttributedString(string: "\u{200A}\u{25C6}", attributes: [.link: "loom://anchor?b"]))
        m.append(NSAttributedString(string: "\n"))
        m.append(NSAttributedString(string: "My claim about B."))

        let out = ReviewExtraction.extract(from: m)
        XCTAssertEqual(out.map(\.anchorURL), ["loom://anchor?b"])
        XCTAssertEqual(out[0].userSentence, "My claim about B.")
    }

    // MARK: - upsert: merge without losing schedule, never delete

    private func existing(anchor: String, sentence: String, stability: Double, reviewed: Date?) -> ReviewItem {
        ReviewItem(id: "kept-\(anchor)", anchorURL: anchor, sourceQuote: "old quote",
                   userSentence: sentence, sourceTitle: "Old", createdAt: Date(timeIntervalSince1970: 1),
                   stabilityDays: stability, lastReviewedAt: reviewed)
    }

    func testUpsertUpdatesContentButPreservesScheduleAndId() {
        let now = Date(timeIntervalSince1970: 9_000)
        let prior = existing(anchor: "loom://anchor?a", sentence: "old words",
                             stability: 12, reviewed: Date(timeIntervalSince1970: 8_000))
        let extracted = [ExtractedReview(anchorURL: "loom://anchor?a", sourceQuote: "new quote", userSentence: "new words")]

        let merged = ReviewExtraction.upsert(extracted: extracted, into: [prior], sourceTitle: "DPO", now: now)

        XCTAssertEqual(merged.count, 1)
        XCTAssertEqual(merged[0].id, "kept-loom://anchor?a", "id preserved")
        XCTAssertEqual(merged[0].stabilityDays, 12, "schedule preserved")
        XCTAssertEqual(merged[0].lastReviewedAt, Date(timeIntervalSince1970: 8_000))
        XCTAssertEqual(merged[0].userSentence, "new words", "content refreshed")
        XCTAssertEqual(merged[0].sourceQuote, "new quote")
        XCTAssertEqual(merged[0].sourceTitle, "DPO")
    }

    func testUpsertAddsNewItemsWithInitialStability() {
        let now = Date(timeIntervalSince1970: 9_000)
        let extracted = [ExtractedReview(anchorURL: "loom://anchor?new", sourceQuote: "q", userSentence: "s")]
        let merged = ReviewExtraction.upsert(extracted: extracted, into: [], sourceTitle: "T", now: now)
        XCTAssertEqual(merged.count, 1)
        XCTAssertEqual(merged[0].anchorURL, "loom://anchor?new")
        XCTAssertEqual(merged[0].stabilityDays, ReviewScheduler.initialStabilityDays)
        XCTAssertNil(merged[0].lastReviewedAt)
        XCTAssertEqual(merged[0].createdAt, now)
    }

    func testUpsertNeverDeletesUnmentionedItems() {
        // An item from ANOTHER note (not in this extraction) must survive.
        let now = Date(timeIntervalSince1970: 9_000)
        let otherNote = existing(anchor: "loom://anchor?other", sentence: "keep me", stability: 30, reviewed: nil)
        let extracted = [ExtractedReview(anchorURL: "loom://anchor?a", sourceQuote: "q", userSentence: "s")]
        let merged = ReviewExtraction.upsert(extracted: extracted, into: [otherNote], sourceTitle: "T", now: now)
        XCTAssertEqual(merged.count, 2)
        XCTAssertTrue(merged.contains { $0.anchorURL == "loom://anchor?other" })
    }
}
