//
//  ReflectionLearningRecordExporter.swift
//  Loom
//
//  Stage 5 (呈现 outward): the Learning Record leaves the app — lifted from
//  the verification harness into product. RESEARCH_REPORT anatomy: title +
//  provenance box, scope-first declaration, book-order entries, review
//  record, constrained conclusions (promoted principles) as back-matter.
//  Markdown is the interchange form; A4/PDF renders from it downstream.
//

import Foundation

enum ReflectionLearningRecordExporter {
    static func markdown(
        for reflectionCase: ReflectionCase,
        principles: [ReflectionPrincipleRecord],
        exportedAt: Date = Date()
    ) -> String {
        let traces = ReflectionLearningTrace.from(reflectionCase)
        let dateFormatter = ISO8601DateFormatter()
        var lines: [String] = []

        lines.append("# \(reflectionCase.title)")
        lines.append("")

        // Provenance box — the reader's chain of custody.
        let sourceLabels = reflectionCase.sources.map(\.label)
        let pageAnchored = traces.filter { $0.pageNumber != nil }.count
        lines.append("> Learning Record · exported \(dateFormatter.string(from: exportedAt))")
        lines.append("> Sources: \(sourceLabels.isEmpty ? reflectionCase.title : sourceLabels.joined(separator: ", "))")
        lines.append("> Anchored traces: \(traces.count) (\(pageAnchored) page-anchored) · status: \(reflectionCase.status)")
        lines.append("")

        // Scope first — no claims beyond the captured material.
        let pages = traces.compactMap(\.pageNumber)
        if let low = pages.min(), let high = pages.max() {
            let span = low == high ? "p.\(low)" : "p.\(low)–p.\(high)"
            lines.append("**Scope.** Covers \(span) of \(sourceLabels.first ?? reflectionCase.title). Claims stay within the captured material.")
        } else {
            lines.append("**Scope.** Claims stay within the captured material; no page anchors recorded yet.")
        }
        lines.append("")

        // Book-order entries (the source's structure, not capture time).
        lines.append("## Learning entries")
        lines.append("")
        let ordered = traces.enumerated().sorted { lhs, rhs in
            let lhsPage = lhs.element.pageNumber ?? Int.max
            let rhsPage = rhs.element.pageNumber ?? Int.max
            if lhsPage != rhsPage { return lhsPage < rhsPage }
            return lhs.offset < rhs.offset
        }.map(\.element)
        for trace in ordered {
            let anchor = trace.pageAnchorLabel.map { " (\($0))" } ?? ""
            let caveat = trace.isWeakAnchor ? " ⚠️ weak anchor — source not confirmed" : ""
            lines.append("- **\(trace.displayLabel)\(anchor):** \(trace.displayText)\(caveat)")
            if let openCondition = trace.openCondition {
                lines.append("  - Open — closes when: \(openCondition)")
            }
        }
        lines.append("")

        // Review record — corrections are the understanding diff.
        let corrections = traces.filter { $0.focus == "correction" }
        if !corrections.isEmpty {
            lines.append("## Review record")
            lines.append("")
            for correction in corrections {
                lines.append("- Corrected: \(correction.displayText)")
            }
            lines.append("")
        }

        // Constrained conclusions — promoted principles citing this case,
        // plus this case's own promotions.
        let related = principles.filter { principle in
            principle.sourceCaseID == reflectionCase.id
                || principle.reuseEvents.contains { $0.caseID == reflectionCase.id }
        }
        if !related.isEmpty {
            lines.append("## Conclusions (promoted principles)")
            lines.append("")
            for (index, principle) in related.enumerated() {
                lines.append("\(index + 1). \(principle.statement)")
                lines.append("   - Holds within: \(principle.holdsWithin.isEmpty ? principle.sourceCaseTitle : principle.holdsWithin)")
                lines.append("   - Citation: \(principle.sourceAnchor) · anchor precision: \(principle.anchorPrecision)")
            }
            lines.append("")
        }

        lines.append("---")
        lines.append("Reproducibility: every entry above is an anchored capture trail entry; open the original at the cited page to re-verify.")
        return lines.joined(separator: "\n")
    }
}
