import AppKit

/// G8 — produce systematized knowledge (docs/canon/WHAT_IS_LOOM.md north star:
/// the workbench's output should read like the wiki's articles). These are
/// PURE, NO-AI helpers: they gather a note's own anchored evidence into the
/// scaffolding of a systematic article — its provenance. The user still writes
/// the prose; AI never distills for them (the generation-effect red line). The
/// "Shape into article" command composes these into an insert.
enum ReflectionArticle {
    struct ReadingEntry: Equatable {
        let anchorURL: String
        let quote: String
    }

    /// The unique anchored sources in the note, in first-appearance order — the
    /// article's provenance ("what I built this from"). Deduped by anchor URL.
    static func readingList(from document: NSAttributedString) -> [ReadingEntry] {
        let text = document.string as NSString
        var entries: [ReadingEntry] = []
        var seen = Set<String>()
        document.enumerateAttribute(.link, in: NSRange(location: 0, length: document.length)) { value, range, _ in
            let url = (value as? String) ?? (value as? URL)?.absoluteString ?? (value as? NSURL)?.absoluteString
            guard let url, url.hasPrefix("loom://anchor"), !seen.contains(url) else { return }
            seen.insert(url)
            let paragraph = text.paragraphRange(for: range)
            let quote = text.substring(with: paragraph)
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "\u{200A}\u{25C6}\u{25C7}"))
                .trimmingCharacters(in: .whitespacesAndNewlines)
            entries.append(ReadingEntry(anchorURL: url, quote: quote))
        }
        return entries
    }

    /// A markdown "## Reading" section listing the note's sources, or nil when
    /// the note has no anchors yet. Appended by "Shape into article" so a
    /// systematized note carries its provenance the way the wiki's do.
    static func readingSection(from document: NSAttributedString) -> String? {
        let list = readingList(from: document)
        guard !list.isEmpty else { return nil }
        return "## Reading\n" + list.map { "- \($0.quote)" }.joined(separator: "\n")
    }
}
