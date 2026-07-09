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
    static func systemPrompt(from principles: [ReflectionPrincipleRecord],
                             budgetChars: Int = 1800) -> String? {
        let header = """
        The user has recorded these principles from their own study — their own \
        scoped judgments, not universal truth. Treat them as how THIS user thinks: \
        apply one only when the question falls within the scope it holds within, \
        and if the user's question runs against a recorded principle, say so plainly \
        rather than overriding it silently. Never cite them as outside authority.
        """
        let ordered = principles.sorted { $0.promotedAt > $1.promotedAt }
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
}
