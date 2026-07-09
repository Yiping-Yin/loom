import XCTest
@testable import Loom

/// Digital Me v0 — inject the user's OWN judgment-trace into the assistant
/// (docs/canon/WHAT_IS_LOOM.md: the moat is the judgment trace, not the agent).
/// A signed principle is a scoped conclusion the user promoted from their own
/// evidence; `DigitalMePrompt` assembles them into a system preamble that makes
/// the in-app companion reflect how THIS user thinks — honestly, as the user's
/// scoped stances, never as outside authority (the anti-oracle red line).
final class DigitalMePromptTests: XCTestCase {

    private func principle(_ statement: String, holds: String,
                           title: String = "Case", at t: TimeInterval) -> ReflectionPrincipleRecord {
        ReflectionPrincipleRecord(
            schemaVersion: 1, id: UUID().uuidString, statement: statement,
            holdsWithin: holds, sourceCaseID: "c", sourceCaseTitle: title,
            sourceAnchor: "loom://anchor?src=x", anchorPrecision: "exact",
            promotedAt: Date(timeIntervalSince1970: t), reuseEvents: [])
    }

    func testNoPrinciplesYieldsNoPreamble() {
        // Nothing recorded yet → no injection at all (the assistant stays plain).
        XCTAssertNil(DigitalMePrompt.systemPrompt(from: []))
    }

    func testPreambleCarriesStatementScopeAndProvenance() {
        let p = principle("Prefer supervised objectives when the reward model is noisy.",
                          holds: "offline preference data", title: "DPO", at: 100)
        let out = DigitalMePrompt.systemPrompt(from: [p])
        XCTAssertNotNil(out)
        XCTAssertTrue(out!.contains("Prefer supervised objectives"), "the judgment itself")
        XCTAssertTrue(out!.contains("offline preference data"), "its scope clause (holdsWithin)")
        XCTAssertTrue(out!.contains("DPO"), "its provenance (source case)")
    }

    func testFramesPrinciplesAsTheUsersOwnScopedStancesNotAuthority() {
        // Anti-oracle red line: the model must be told these are the USER's
        // scoped judgments to apply within scope, not universal truth to cite.
        let out = DigitalMePrompt.systemPrompt(from: [principle("X.", holds: "Y", at: 1)])!
        let lower = out.lowercased()
        XCTAssertTrue(lower.contains("user"), "must attribute the principles to the user")
        XCTAssertTrue(lower.contains("scope") || lower.contains("holds"),
                      "must tell the model to respect each principle's scope")
        XCTAssertFalse(lower.contains("authority") && !lower.contains("never"),
                       "if it mentions authority at all, it must forbid citing them as such")
    }

    func testMostRecentlyPromotedComeFirst() {
        let older = principle("OLDER judgment.", holds: "a", at: 10)
        let newer = principle("NEWER judgment.", holds: "b", at: 999)
        let out = DigitalMePrompt.systemPrompt(from: [older, newer])!
        XCTAssertLessThan(out.range(of: "NEWER judgment")!.lowerBound,
                          out.range(of: "OLDER judgment")!.lowerBound,
                          "the most-recently-promoted principle is listed first")
    }

    func testRelevantPrincipleOutranksANewerIrrelevantOne() {
        // An OLD principle that shares terms with the question must rank above a
        // NEWER one that doesn't — relevance beats recency (v0.5 policy).
        let relevant = principle("Prefer supervised objectives when the reward model is noisy.",
                                 holds: "offline preference data", title: "DPO", at: 10)
        let newerButOffTopic = principle("Warm up the learning rate for stability.",
                                         holds: "large-batch pretraining", title: "Optim", at: 999)
        let out = DigitalMePrompt.systemPrompt(
            from: [relevant, newerButOffTopic],
            relevantTo: "does the reward model matter for offline preference data?")!
        XCTAssertLessThan(out.range(of: "supervised objectives")!.lowerBound,
                          out.range(of: "learning rate")!.lowerBound,
                          "the term-overlapping principle ranks first despite being older")
    }

    func testEmptyContextStillFallsBackToRecency() {
        let older = principle("OLDER.", holds: "a", at: 10)
        let newer = principle("NEWER.", holds: "b", at: 999)
        let out = DigitalMePrompt.systemPrompt(from: [older, newer], relevantTo: "")!
        XCTAssertLessThan(out.range(of: "NEWER")!.lowerBound, out.range(of: "OLDER")!.lowerBound)
    }

    func testBudgetCapsSizeAndKeepsOnlyWholePrinciples() {
        // Many principles, tiny budget → the assembled text stays within budget
        // and keeps only the newest that fit WHOLE (never a half line).
        let many = (0..<50).map {
            principle("Judgment number \($0) with a little length.", holds: "scope \($0)", at: TimeInterval($0))
        }
        let budget = 600
        let out = DigitalMePrompt.systemPrompt(from: many, budgetChars: budget)!
        XCTAssertLessThanOrEqual(out.count, budget, "never exceeds the budget")
        XCTAssertTrue(out.contains("Judgment number 49"), "the newest is kept")
        XCTAssertFalse(out.contains("Judgment number 0 "), "the oldest is dropped, not truncated in")
    }
}
