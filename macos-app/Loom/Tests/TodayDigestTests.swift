import XCTest
@testable import Loom

/// Charter W0-11 — TodayDigest is a PURE aggregation over existing cases
/// (owner-ratified minimal Today, 2026-07-08). These tests pin the section
/// logic before the view is wired into the sidebar in Wave 2.
final class TodayDigestTests: XCTestCase {

    private func makeCase(
        id: String,
        title: String = "Case",
        project: String = "Project",
        sources: [ReflectionSource] = [],
        documentText: String? = nil,
        touchedAt: Date? = nil
    ) -> ReflectionCase {
        ReflectionCase(
            id: id,
            title: title,
            project: project,
            status: "active",
            updatedAt: "12:00",
            summary: "",
            tags: [],
            sources: sources,
            steps: [],
            messages: [],
            documentText: documentText,
            touchedAt: touchedAt
        )
    }

    private var sampleSource: ReflectionSource {
        ReflectionSource(folder: "Papers", label: "Paper.pdf", kind: "pdf", meta: "", excerpt: "")
    }

    func testReadingNowOnlyIncludesCasesWithSourcesNewestFirst() {
        let old = makeCase(id: "a", title: "Old read", sources: [sampleSource],
                           touchedAt: Date(timeIntervalSince1970: 100))
        let fresh = makeCase(id: "b", title: "Fresh read", sources: [sampleSource],
                             touchedAt: Date(timeIntervalSince1970: 200))
        let noSources = makeCase(id: "c", title: "Just notes",
                                 touchedAt: Date(timeIntervalSince1970: 300))

        let digest = TodayDigest.derive(from: [old, noSources, fresh])

        XCTAssertEqual(digest.readingNow.map(\.caseID), ["b", "a"])
    }

    func testOpenQuestionsPullEveryQuestionLineFromDocuments() {
        let doc = "Claim one.\n❓ Does DPO beat PPO here? \nBody.\n❓closes when: replicated"
        let c = makeCase(id: "a", title: "Alignment", documentText: doc,
                         touchedAt: Date(timeIntervalSince1970: 100))

        let digest = TodayDigest.derive(from: [c])

        XCTAssertEqual(digest.openQuestions.count, 2)
        XCTAssertEqual(digest.openQuestions[0].subtitle, "Does DPO beat PPO here?")
        XCTAssertEqual(digest.openQuestions[0].caseID, "a")
        XCTAssertTrue(digest.openQuestions.allSatisfy { $0.title == "Alignment" })
    }

    func testSubtitleResolvesProjectNameAndNeverLeaksLegacyCategoryStrings() {
        // The daily face's subtitle must be MEANINGFUL: the real project name
        // when the note belongs to one, and NOTHING when the only label is a
        // legacy category string ("New product practice" — blank()'s default)
        // that carries zero information.
        var inProject = makeCase(id: "a", title: "DPO note", touchedAt: Date(timeIntervalSince1970: 100))
        inProject.projectID = "p1"
        let loose = makeCase(id: "b", title: "Loose note", touchedAt: Date(timeIntervalSince1970: 90))
        var project = ReflectionProject(name: "MATH 2991", order: 0)
        project.id = "p1"

        let digest = TodayDigest.derive(from: [inProject, loose], projects: [project])

        XCTAssertEqual(digest.recent.first { $0.caseID == "a" }?.subtitle, "MATH 2991")
        XCTAssertEqual(digest.recent.first { $0.caseID == "b" }?.subtitle, "",
                       "the legacy 'New product practice' category must not leak into the daily face")
    }

    func testOpenQuestionsAreCappedSoTheDayIsNeverAPile() {
        // Many open questions across cases → the daily face shows a calm top-N
        // (newest case first), never a growing pile (anti-debt).
        let cases = (0..<4).map { i in
            makeCase(id: "c\(i)", title: "Case \(i)",
                     documentText: "❓ q\(i)a\n❓ q\(i)b\n❓ q\(i)c",
                     touchedAt: Date(timeIntervalSince1970: TimeInterval(1000 - i)))
        }
        let digest = TodayDigest.derive(from: cases)
        XCTAssertEqual(digest.openQuestions.count, TodayDigest.openQuestionsCap)
        XCTAssertEqual(digest.openQuestions.first?.caseID, "c0", "newest case's questions come first")
    }

    func testRecentCapsAtFiveAndUntitledPlaceholderReadsUntitled() {
        let cases = (0..<7).map { i in
            makeCase(id: "c\(i)",
                     title: i == 0 ? ReflectionCase.untitledPlaceholder : "Case \(i)",
                     touchedAt: Date(timeIntervalSince1970: TimeInterval(1000 - i)))
        }

        let digest = TodayDigest.derive(from: cases)

        XCTAssertEqual(digest.recent.count, 5)
        XCTAssertEqual(digest.recent.first?.title, "Untitled")
        XCTAssertTrue(digest.openQuestions.isEmpty)
    }

    func testSpotlightItemCarriesLoomNoteIdentifierAndBodyPrefix() {
        let c = makeCase(id: "note-1", title: "GRPO", documentText: String(repeating: "x", count: 500))

        let item = LoomSpotlightIndexer.searchableItem(for: c)

        XCTAssertEqual(item.uniqueIdentifier, "loom://note/note-1")
        XCTAssertEqual(item.domainIdentifier, LoomSpotlightIndexer.domainIdentifier)
        XCTAssertEqual(item.attributeSet.title, "GRPO")
        XCTAssertEqual(item.attributeSet.contentDescription?.count, 300)
    }

    func testPrintOperationBuildsWithJobTitleAndFallback() {
        let body = NSAttributedString(string: "A note body.")

        let op = LoomPrintBuilders.printOperation(noteTitle: "My note", body: body)
        XCTAssertEqual(op.jobTitle, "My note")

        let fallback = LoomPrintBuilders.printOperation(noteTitle: "", body: body)
        XCTAssertEqual(fallback.jobTitle, "Loom note")
    }
}
