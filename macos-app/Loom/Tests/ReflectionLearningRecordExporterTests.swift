import XCTest
@testable import Loom

/// Stage 5 (呈现 outward): the exported Learning Record must carry the full
/// RESEARCH_REPORT anatomy — provenance, scope-first, book-order entries,
/// honest inline caveats, review record, constrained conclusions.
final class ReflectionLearningRecordExporterTests: XCTestCase {
    private func learningCase() -> ReflectionCase {
        var reflectionCase = ReflectionCase.blank()
        reflectionCase.title = "Market Making · FINS3666"
        reflectionCase.project = "Learning pass"
        reflectionCase.sources = [
            ReflectionSource(folder: "Input", label: "Week 1 Notes.pdf", kind: "pdf", meta: "20 pages", excerpt: "")
        ]
        reflectionCase.steps[0].items = [
            "Captured selected word from Week 1 Notes.pdf, page 4 [vocabulary]: trajectories\nEvidence: app=Preview; anchor precision=file+page",
            "Captured user trace from Week 1 Notes.pdf, page 2 [question]: Why does the spread widen at open? closes when: I reproduce it from tick history\nEvidence: app=Preview; anchor precision=file+page",
            "Captured user trace from Week 1 Notes.pdf [correction]: correction: an IOC never rests in the book\nEvidence: app=Preview; anchor precision=window; fallback note=weak anchor",
        ]
        return reflectionCase
    }

    func testMarkdownCarriesTheReportAnatomy() throws {
        let reflectionCase = learningCase()
        guard case .promoted(let principle) = ReflectionPrincipleStore.promote(
            statement: "Quote only when you know your out.",
            holdsWithin: "simulated exchange",
            from: reflectionCase,
            anchoringTrace: ReflectionLearningTrace.from(reflectionCase).first,
            promotedAt: Date(timeIntervalSince1970: 1_782_000_000)
        ) else { return XCTFail("setup promotion failed") }

        let markdown = ReflectionLearningRecordExporter.markdown(
            for: reflectionCase,
            principles: [principle],
            exportedAt: Date(timeIntervalSince1970: 1_782_000_000)
        )

        XCTAssertTrue(markdown.hasPrefix("# Market Making · FINS3666"))
        XCTAssertTrue(markdown.contains("> Learning Record · exported"))
        XCTAssertTrue(markdown.contains("> Sources: Week 1 Notes.pdf"))
        XCTAssertTrue(markdown.contains("**Scope.** Covers p.2–p.4 of Week 1 Notes.pdf"))
        // Book order: the page-2 question precedes the page-4 vocabulary entry.
        let questionIndex = try XCTUnwrap(markdown.range(of: "Why does the spread widen at open?")).lowerBound
        let vocabularyIndex = try XCTUnwrap(markdown.range(of: "trajectories")).lowerBound
        XCTAssertLessThan(questionIndex, vocabularyIndex)
        XCTAssertTrue(markdown.contains("Open — closes when: I reproduce it from tick history"))
        XCTAssertTrue(markdown.contains("⚠️ weak anchor — source not confirmed"))
        XCTAssertTrue(markdown.contains("## Review record"))
        XCTAssertTrue(markdown.contains("## Conclusions (promoted principles)"))
        XCTAssertTrue(markdown.contains("Holds within: simulated exchange"))
        XCTAssertTrue(markdown.contains("anchor precision: file+page"))
        XCTAssertTrue(markdown.contains("Reproducibility:"))
    }
}
