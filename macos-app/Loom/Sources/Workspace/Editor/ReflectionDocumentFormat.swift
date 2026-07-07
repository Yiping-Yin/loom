import AppKit

/// One heading in the centre document's live outline — its character location
/// (for click-to-jump), nesting level (1…3), and title.
struct DocumentHeading: Identifiable, Equatable {
    let id: Int      // character location in the document
    let level: Int   // 1...3
    let title: String
}

/// The typographic law of THE BOOK's centre editor — the single serif ink,
/// heading scale, and the two reading-note altitudes (baseline authored text
/// vs indented source evidence). Extracted out of the ~8k-line workspace file
/// (owner 2026-07-06, build-order step ①) so this formatting logic is small,
/// focused, and — for the first time — unit-testable in isolation. Pure
/// functions over AppKit text primitives; no view or store dependencies.
enum ReflectionDocumentFormat {
    static func serifFont(size: CGFloat, weight: NSFont.Weight) -> NSFont {
        let base = NSFont.systemFont(ofSize: size, weight: weight)
        guard let descriptor = base.fontDescriptor.withDesign(.serif),
              let serif = NSFont(descriptor: descriptor, size: size) else { return base }
        return serif
    }

    static var documentFont: NSFont { serifFont(size: 15, weight: .regular) }

    static var documentParagraphStyle: NSParagraphStyle {
        let style = NSMutableParagraphStyle()
        style.lineSpacing = 5
        return style
    }

    /// Evidence altitude (the two-altitude reading-note form): a captured quote
    /// is the SOURCE's words, so it sits indented + quiet BELOW your own baseline
    /// claim. Indent-only via NSParagraphStyle so it survives RTFD; the quiet ink
    /// is a separate colour attribute.
    static var quoteParagraphStyle: NSParagraphStyle {
        let style = NSMutableParagraphStyle()
        style.lineSpacing = 5
        style.firstLineHeadIndent = 22
        style.headIndent = 22
        style.paragraphSpacingBefore = 2
        return style
    }

    /// A paragraph is EVIDENCE (a captured quote / image card) if it carries a
    /// `loom://anchor` link — a standard attribute that survives the RTFD round
    /// trip, so the altitude persists across reload without a custom marker.
    static func isAnchorParagraph(_ storage: NSTextStorage, at loc: Int) -> Bool {
        guard loc < storage.length else { return false }
        // Scan the WHOLE paragraph, not just `loc`: the anchor's loom://anchor
        // link now lives on a trailing locator glyph (so the quote text renders as
        // quiet evidence, not a hyperlink), which sits AFTER the first character.
        let paragraph = (storage.string as NSString).paragraphRange(for: NSRange(location: loc, length: 0))
        var found = false
        storage.enumerateAttribute(.link, in: paragraph) { value, _, stop in
            let s = (value as? String) ?? (value as? URL)?.absoluteString ?? (value as? NSURL)?.absoluteString ?? ""
            if s.hasPrefix("loom://anchor") {
                found = true
                stop.pointee = true
            }
        }
        return found
    }

    /// A captured quote renders as ONE evidence paragraph — the trailing locator
    /// glyph that carries its anchor must live in the same paragraph. Collapse
    /// internal newlines + whitespace runs (from a multi-line PDF selection) to
    /// single spaces so the quote never splits into paragraphs that lose the
    /// indent + quiet ink.
    static func collapsedQuote(_ raw: String) -> String {
        raw.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    }

    static func headingFont(level: Int) -> NSFont {
        switch level {
        case 1: return serifFont(size: 22, weight: .semibold)
        case 2: return serifFont(size: 18, weight: .semibold)
        default: return serifFont(size: 15.5, weight: .semibold)
        }
    }

    static var headingParagraphStyle: NSParagraphStyle {
        let style = NSMutableParagraphStyle()
        style.lineSpacing = 4
        style.paragraphSpacingBefore = 12
        style.paragraphSpacing = 4
        return style
    }

    /// `# ` / `## ` / `### ` at line start makes a heading. Returns the
    /// level and the marker length (hashes + space), or (0, 0).
    static func headingLevel(of line: String) -> (level: Int, markerLength: Int) {
        var hashes = 0
        var index = line.startIndex
        while index < line.endIndex, line[index] == "#", hashes < 3 {
            hashes += 1
            index = line.index(after: index)
        }
        guard hashes > 0, index < line.endIndex, line[index] == " " else { return (0, 0) }
        return (hashes, hashes + 1)
    }

    /// Block D of the reading-note form (owner 2026-07-06): a line beginning with
    /// ❓ is an OPEN QUESTION / to-confirm — the thing that pulls you back to the
    /// note (elaboration). Detected by the ❓ prefix (text, so it survives RTFD),
    /// the same way headings are detected.
    static func isOpenQuestionLine(_ line: String) -> Bool {
        line.trimmingCharacters(in: .whitespacesAndNewlines).hasPrefix("\u{2753}")
    }

    /// The four intents a reading-note paragraph can carry, expressed as leading
    /// TEXT tokens so they survive RTFD round-trips (the same trick as the ❓
    /// open-question prefix and #/## headings). The gutter type-namer STAMPS
    /// these; `normalizeDocument` renders each altitude from the token — so the
    /// namer and the renderer agree by construction, and the state lives in the
    /// book, not in chrome. This is the grammar that lets the composer dissolve.
    enum ParagraphIntent: String, CaseIterable {
        case meaning
        case question
        case correction
        case principle

        /// The leading token this intent writes (meaning writes none).
        var token: String {
            switch self {
            case .meaning: return ""
            case .question: return "\u{2753} "
            case .correction: return "correction: "
            case .principle: return "principle: "
            }
        }
    }

    /// Classify a paragraph by its leading token; meaning is the default. Pure.
    static func paragraphIntent(of paragraph: String) -> ParagraphIntent {
        let trimmed = paragraph.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("\u{2753}") { return .question }
        let lowered = trimmed.lowercased()
        if lowered.hasPrefix("principle:") { return .principle }
        if lowered.hasPrefix("correction:") { return .correction }
        return .meaning
    }

    /// Re-stamp a paragraph with an intent: strip its current intent token, then
    /// prefix the target's token (meaning strips to bare prose). Leading
    /// whitespace preserved; idempotent, so the gutter can toggle freely.
    static func stampParagraph(_ paragraph: String, as intent: ParagraphIntent) -> String {
        let leading = String(paragraph.prefix { $0 == " " || $0 == "\t" })
        var body = Substring(paragraph.dropFirst(leading.count))
        switch paragraphIntent(of: String(body)) {
        case .meaning:
            break
        case .question:
            body = body.drop(while: { $0 == "\u{2753}" })
            body = body.drop(while: { $0 == " " })
        case .correction, .principle:
            if let colon = body.firstIndex(of: ":") {
                body = body[body.index(after: colon)...]
                body = body.drop(while: { $0 == " " })
            }
        }
        return leading + intent.token + String(body)
    }

    /// The exact leading intent token as it appears at the START of a paragraph
    /// (casing preserved), so a stamp can replace ONLY the token region and keep
    /// the body's inline attributes — emphasis and loom://anchor links — intact.
    /// Assumes the paragraph begins at column 0 (editor lines do).
    static func leadingIntentToken(of paragraph: String) -> String {
        switch paragraphIntent(of: paragraph) {
        case .meaning:
            return ""
        case .question:
            var token = ""
            var seenMark = false
            for ch in paragraph {
                if ch == "\u{2753}" { token.append(ch); seenMark = true }
                else if ch == " " && seenMark { token.append(ch) }
                else { break }
            }
            return token
        case .correction, .principle:
            guard let colon = paragraph.firstIndex(of: ":") else { return "" }
            var token = String(paragraph[paragraph.startIndex...colon])
            var i = paragraph.index(after: colon)
            while i < paragraph.endIndex, paragraph[i] == " " {
                token.append(" ")
                i = paragraph.index(after: i)
            }
            return token
        }
    }

    /// The live outline is derived from the WRITTEN document — every heading
    /// line, with its character location for click-to-jump. Locations count
    /// UTF-16 units (+1 per newline) to match NSTextView's indexing.
    static func documentHeadings(in text: String) -> [DocumentHeading] {
        var headings: [DocumentHeading] = []
        var location = 0
        for line in text.components(separatedBy: "\n") {
            let (level, markerLength) = headingLevel(of: line)
            if level > 0 {
                let title = String(line.dropFirst(markerLength)).trimmingCharacters(in: .whitespaces)
                if !title.isEmpty {
                    headings.append(DocumentHeading(id: location, level: level, title: title))
                }
            }
            location += line.utf16.count + 1
        }
        return headings
    }
}
