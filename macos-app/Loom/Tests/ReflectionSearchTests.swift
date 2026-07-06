import XCTest
@testable import Loom

/// The FTS5 query builder (P6 full-text search): raw user input → a safe MATCH
/// expression. These pin the injection/crash guarantees — punctuation and FTS5
/// operators must be split points, never syntax.
final class ReflectionSearchTests: XCTestCase {

    /// Nothing to search → nil, so callers skip an empty/invalid MATCH (an empty
    /// or all-punctuation query would otherwise throw in SQLite).
    func testEmptyOrPunctuationOnlyInputYieldsNil() {
        XCTAssertNil(ReflectionSearchQuery.ftsMatch(from: ""))
        XCTAssertNil(ReflectionSearchQuery.ftsMatch(from: "    "))
        XCTAssertNil(ReflectionSearchQuery.ftsMatch(from: "?! - ()"))
    }

    /// As-you-type: a single term becomes a lowercase prefix match.
    func testSingleTermIsPrefixMatched() {
        XCTAssertEqual(ReflectionSearchQuery.ftsMatch(from: "Orders"), "orders*")
    }

    /// Multiple terms are implicit-AND prefix matches.
    func testMultipleTermsAreImplicitAndPrefixes() {
        XCTAssertEqual(ReflectionSearchQuery.ftsMatch(from: "market orders"), "market* orders*")
    }

    /// FTS5 operators/punctuation are split points, never injected — "stop-loss?"
    /// must not turn "-" into a NOT operator or "?" into a syntax error, and
    /// quotes/parens must not open a phrase/group.
    func testPunctuationIsStrippedNotInjected() {
        XCTAssertEqual(ReflectionSearchQuery.ftsMatch(from: "stop-loss?"), "stop* loss*")
        XCTAssertEqual(ReflectionSearchQuery.ftsMatch(from: "a \"b\" (c)"), "a* b* c*")
    }

    // MARK: - Index (SQLite FTS5, in-memory)

    /// Index a note and find it by a word in its body — the base retrieval path.
    func testIndexAndSearchFindsNoteByBody() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        try index.replace(caseID: "c1", with: [
            .note(caseID: "c1", title: "Order types", body: "a market order buys speed")
        ])
        let hits = try index.search("market")
        XCTAssertEqual(hits.count, 1)
        XCTAssertEqual(hits.first?.caseID, "c1")
        XCTAssertEqual(hits.first?.kind, .note)
    }

    /// A title match must outrank a body-only match (bm25 weights title 10×) — so
    /// "search for the note titled X" surfaces X first.
    func testTitleHitOutranksBodyHit() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        try index.replace(caseID: "body", with: [
            .note(caseID: "body", title: "Something else", body: "this mentions orders in passing")
        ])
        try index.replace(caseID: "title", with: [
            .note(caseID: "title", title: "Orders", body: "unrelated body text")
        ])
        let hits = try index.search("orders")
        XCTAssertEqual(hits.count, 2)
        XCTAssertEqual(hits.first?.caseID, "title", "title match should rank first")
    }

    /// An anchor hit carries the jump payload the reader needs (sourceID/page/rect).
    func testAnchorHitCarriesJumpPayload() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        let rect = CGRect(x: 1, y: 2, width: 3, height: 4)
        try index.replace(caseID: "c1", with: [
            .anchor(caseID: "c1", quote: "a stop loss triggers at the level", sourceID: "s9", page: 7, rect: rect)
        ])
        let hit = try XCTUnwrap(try index.search("stop").first)
        XCTAssertEqual(hit.kind, .anchor)
        XCTAssertEqual(hit.sourceID, "s9")
        XCTAssertEqual(hit.page, 7)
        XCTAssertEqual(hit.rect, rect)
    }

    /// Re-indexing a case replaces its rows — a stale term from the old version is
    /// gone, the new term is found (no duplicate/orphan rows).
    func testReplaceRemovesStaleRows() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        try index.replace(caseID: "c1", with: [.note(caseID: "c1", title: "", body: "alpha content here")])
        try index.replace(caseID: "c1", with: [.note(caseID: "c1", title: "", body: "beta content here")])
        XCTAssertEqual(try index.search("alpha").count, 0, "stale rows must be gone")
        XCTAssertEqual(try index.search("beta").count, 1)
    }

    /// CJK is space-less, so `unicode61` treats a run as one token and a prefix
    /// match misses mid-word substrings. Per-char normalization must make an
    /// interior 2-char Chinese word findable — and the returned snippet must be
    /// the ORIGINAL text, not the space-isolated index form.
    func testChineseMidWordSubstringIsFound() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        try index.replace(caseID: "c1", with: [.note(caseID: "c1", title: "", body: "市场价格波动很大")])
        XCTAssertEqual(try index.search("价格").count, 1, "interior CJK word must be found")
        XCTAssertEqual(try index.search("波动").count, 1)
        XCTAssertEqual(try index.search("市场").count, 1, "leading CJK word too")
        XCTAssertEqual(try index.search("价格").first?.snippet, "市场价格波动很大",
                       "snippet must be the original text, not the spaced index form")
    }

    /// A negative limit must NOT become SQLite's "unbounded" (LIMIT -1) and dump
    /// every row; invalid → no rows. Positive limits still bound the result.
    func testNegativeLimitIsClampedNotUnbounded() throws {
        let index = try ReflectionSearchIndex(path: ":memory:")
        try index.replace(caseID: "a", with: [.note(caseID: "a", title: "", body: "orders one")])
        try index.replace(caseID: "b", with: [.note(caseID: "b", title: "", body: "orders two")])
        XCTAssertEqual(try index.search("orders", limit: -1).count, 0, "negative limit must not dump all rows")
        XCTAssertEqual(try index.search("orders", limit: 1).count, 1)
    }
}
