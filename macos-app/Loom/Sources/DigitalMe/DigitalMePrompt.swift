import Foundation

/// Digital Me v0 — inject the user's OWN judgment-trace into the assistant.
///
/// docs/canon/WHAT_IS_LOOM.md: LOOM's moat is the *judgment trace*, not the
/// agent. A signed principle (`ReflectionPrincipleRecord`) is a scoped
/// conclusion the user promoted from their own evidence — a stance with a
/// boundary (`holdsWithin`) and provenance (the source case + anchor). Assemble
/// those into a system preamble so the in-app companion reflects how THIS user
/// thinks, HONESTLY: as the user's own scoped stances, applied only within
/// scope, never cited as outside authority (the anti-oracle red line), and
/// never silently overriding a question that runs against one.
///
/// The SELECTION policy — which principles, ranked by what relevance, under
/// what budget — is a design the owner reserved. This ships a deliberately
/// simple, isolated v0 (`selected`): newest-first, whole principles until a
/// character budget. Swap `selected` when the real relevance model lands; the
/// assembly + honest framing below stay put.
enum DigitalMePrompt {

    /// The principle preamble to prepend to a companion's system prompt, or
    /// `nil` when the user has recorded nothing (then the assistant stays plain).
    /// `relevantTo` (the current question + quote) ranks principles that share
    /// its terms first, so a small budget spends on what's relevant now, not
    /// merely what's newest. Empty context ⇒ pure recency (backward compatible).
    static func systemPrompt(from principles: [ReflectionPrincipleRecord],
                             relevantTo context: String = "",
                             budgetChars: Int = 1800) -> String? {
        let header = """
        The user has recorded these principles from their own study — their own \
        scoped judgments, not universal truth. Treat them as how THIS user thinks: \
        apply one only when the question falls within the scope it holds within, \
        and if the user's question runs against a recorded principle, say so plainly \
        rather than overriding it silently. Never cite them as outside authority.
        """
        let ordered = ranked(principles, relevantTo: context)
        var lines: [String] = []
        var used = header.count + 2                 // header + the "\n\n" that follows it
        for p in ordered {
            let scope = p.holdsWithin.isEmpty ? "" : " — holds within: \(p.holdsWithin)"
            let from = p.sourceCaseTitle.isEmpty ? "" : " (from \(p.sourceCaseTitle))"
            let line = "- \(p.statement)\(scope)\(from)"
            let add = line.count + (lines.isEmpty ? 0 : 1)   // + the joining newline
            if used + add > budgetChars { break }            // keep only WHOLE principles
            used += add
            lines.append(line)
        }
        guard !lines.isEmpty else { return nil }
        return header + "\n\n" + lines.joined(separator: "\n")
    }

    /// The PORTABLE judgment context — Digital Me across desktops. The owner
    /// copies this and pastes it into ANY AI model (ChatGPT / Claude / Gemini /
    /// a system-prompt slot) so that model acts WITH the owner's judgment:
    /// every principle travels (no budget cut — exporting is deliberate), each
    /// with its scope clause and provenance, wrapped in the same anti-oracle
    /// honesty framing the in-app companion gets. nil when nothing is recorded.
    static func portableContext(
        from principles: [ReflectionPrincipleRecord],
        profession: String = "",
        presenceLines: [String] = []
    ) -> String? {
        guard !principles.isEmpty else { return nil }
        var identity: [String] = []
        let trimmedProfession = profession.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedProfession.isEmpty {
            identity.append("They work as: \(trimmedProfession).")
        }
        if !presenceLines.isEmpty {
            identity.append("Their online presence: " + presenceLines.joined(separator: " · "))
        }
        let header = """
        You are assisting a specific person. Below are principles they have \
        recorded from their own study — their own scoped judgments, not \
        universal truth. Work WITH this judgment: apply a principle only when \
        the question falls within the scope it holds within; if their request \
        runs against one of their recorded principles, say so plainly instead \
        of silently overriding it; never cite these as outside authority. The \
        final judgment is always theirs.
        """ + (identity.isEmpty ? "" : "\n\n" + identity.joined(separator: "\n"))
        let lines = principles
            .sorted { $0.promotedAt > $1.promotedAt }
            .map { p -> String in
                let scope = p.holdsWithin.isEmpty ? "" : " — holds within: \(p.holdsWithin)"
                let from = p.sourceCaseTitle.isEmpty ? "" : " (from \(p.sourceCaseTitle))"
                return "- \(p.statement)\(scope)\(from)"
            }
        return header + "\n\n" + lines.joined(separator: "\n")
    }

    /// v0.5 selection policy (isolated + swappable — the owner reserved the full
    /// design): principles sharing meaningful terms with the current question
    /// rank first (relevance), ties and no-overlap fall back to newest. Reuses
    /// the principle store's own term extractor so "relevance" means the same
    /// thing here as in cross-case reuse.
    static func ranked(_ principles: [ReflectionPrincipleRecord],
                       relevantTo context: String) -> [ReflectionPrincipleRecord] {
        let contextTerms = ReflectionPrincipleStore.meaningfulTerms(in: context)
        guard !contextTerms.isEmpty else {
            return principles.sorted { $0.promotedAt > $1.promotedAt }
        }
        return principles
            .map { p -> (record: ReflectionPrincipleRecord, overlap: Int) in
                let terms = ReflectionPrincipleStore.meaningfulTerms(in: p.statement + " " + p.holdsWithin)
                return (p, contextTerms.intersection(terms).count)
            }
            .sorted { lhs, rhs in
                lhs.overlap != rhs.overlap
                    ? lhs.overlap > rhs.overlap
                    : lhs.record.promotedAt > rhs.record.promotedAt
            }
            .map(\.record)
    }
}
