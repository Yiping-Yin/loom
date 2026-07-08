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
