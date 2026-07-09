import Foundation

/// The Today destination's data — owner decision 2026-07-08 (charter §20,
/// ratified question ②): the MINIMAL version. Three sections, each a PURE
/// aggregation over the existing workspace cases — no new data model, no
/// persistence of its own. Cold start restores the last destination (the
/// system convention); Today never steals the launch.
struct TodayDigest: Equatable {
    struct Item: Identifiable, Equatable {
        /// Stable identity for the row (case id, or case id + line index for
        /// question rows pulled out of a document).
        let id: String
        let caseID: String
        let title: String
        /// One quiet line under the title — the project name for cases, the
        /// question text for open questions.
        let subtitle: String
    }

    var readingNow: [Item]
    var openQuestions: [Item]
    var recent: [Item]

    /// The day is a calm portion, never a pile (anti-debt, WHAT_IS_LOOM §6):
    /// open questions surface a top-N to return to, not every ❓ you ever wrote.
    static let openQuestionsCap = 5

    /// Derive the digest from the live case list. Pure — same inputs, same
    /// digest — so the section logic is unit-testable without a store.
    ///
    /// - readingNow: the most recently touched cases that actually have
    ///   reading material attached (sources) — "what am I in the middle of".
    /// - openQuestions: every `❓` line in every case document (the editor's
    ///   own open-question convention), newest case first.
    /// - recent: the most recently touched cases, full stop.
    static func derive(from cases: [ReflectionCase], projects: [ReflectionProject] = [], now: Date = Date()) -> TodayDigest {
        let projectNames = Dictionary(uniqueKeysWithValues: projects.map { ($0.id, $0.displayName) })
        let byRecency = cases.sorted { lhs, rhs in
            (lhs.touchedAt ?? .distantPast) > (rhs.touchedAt ?? .distantPast)
        }

        let readingNow = byRecency
            .filter { !$0.sources.isEmpty }
            .prefix(3)
            .map { item(for: $0, projectNames: projectNames) }

        var openQuestions: [Item] = []
        outer: for reflectionCase in byRecency {
            guard let document = reflectionCase.documentText, !document.isEmpty else { continue }
            for (index, line) in document.components(separatedBy: .newlines).enumerated() {
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                guard trimmed.hasPrefix("❓") else { continue }
                let question = trimmed.dropFirst().trimmingCharacters(in: .whitespaces)
                guard !question.isEmpty else { continue }
                openQuestions.append(Item(
                    id: "\(reflectionCase.id)#q\(index)",
                    caseID: reflectionCase.id,
                    title: displayTitle(of: reflectionCase),
                    subtitle: question
                ))
                // Calm portion, newest case first — stop at the cap so the day
                // is a top-N to return to, never a growing pile.
                if openQuestions.count >= openQuestionsCap { break outer }
            }
        }

        let recent = byRecency.prefix(5).map { item(for: $0, projectNames: projectNames) }

        return TodayDigest(readingNow: Array(readingNow),
                           openQuestions: openQuestions,
                           recent: Array(recent))
    }

    private static func item(for reflectionCase: ReflectionCase, projectNames: [String: String]) -> Item {
        // The subtitle must be MEANINGFUL: the real project name when the note
        // belongs to one, nothing otherwise. The legacy `project` category
        // string ("New product practice" — blank()'s default) carries zero
        // information and never leaks into the daily face.
        let subtitle = reflectionCase.projectID.flatMap { projectNames[$0] } ?? ""
        return Item(id: reflectionCase.id,
                    caseID: reflectionCase.id,
                    title: displayTitle(of: reflectionCase),
                    subtitle: subtitle)
    }

    private static func displayTitle(of reflectionCase: ReflectionCase) -> String {
        reflectionCase.title == ReflectionCase.untitledPlaceholder
            ? "Untitled"
            : reflectionCase.title
    }
}
