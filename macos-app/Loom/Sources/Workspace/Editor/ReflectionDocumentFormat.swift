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

    // MARK: - W1-pre · editedRange-scoped normalization domain (charter §8)
    //
    // The pure half of the normalize rewrite: styling cost must be
    // proportional to the EDIT, not the document. The in-flight editor's
    // whole-document normalizeDocument pass adopts these when the shell
    // file lands (Wave 1) — per-keystroke work becomes "classify and
    // re-assert the touched paragraphs only".

    /// The paragraph role the editor re-asserts during normalization.
    enum ParagraphRole: Equatable {
        case heading(level: Int, markerLength: Int)
        case openQuestion
        case body
    }

    /// Expand one edit to the whole paragraph(s) it touched — the ONLY
    /// region a per-keystroke normalize pass may restyle. Clamps a
    /// past-the-end caret (typing at the document tail) to the last
    /// paragraph.
    static func normalizationRange(in text: NSString, editedRange: NSRange) -> NSRange {
        guard text.length > 0 else { return NSRange(location: 0, length: 0) }
        let location = min(editedRange.location, text.length)
        let length = min(editedRange.length, text.length - location)
        return text.paragraphRange(for: NSRange(location: location, length: length))
    }

    /// Classify one paragraph's text into the style bucket normalize
    /// asserts. (Evidence altitude is attribute-based, not text-based —
    /// use `isAnchorParagraph` for that check.)
    static func paragraphRole(of line: String) -> ParagraphRole {
        let (level, markerLength) = headingLevel(of: line)
        if level > 0 { return .heading(level: level, markerLength: markerLength) }
        if isOpenQuestionLine(line) { return .openQuestion }
        return .body
    }

    /// The attribute set normalize asserts for a paragraph of the given
    /// role — the write-side twin of `paragraphRole(of:)`. Evidence
    /// paragraphs are handled separately (quote style keyed off
    /// `isAnchorParagraph`); this covers the text-derived roles.
    static func attributes(for role: ParagraphRole) -> [NSAttributedString.Key: Any] {
        switch role {
        case .heading(let level, _):
            return [
                .font: headingFont(level: level),
                .paragraphStyle: headingParagraphStyle,
                .foregroundColor: NSColor.labelColor,
            ]
        case .openQuestion:
            return [
                .font: documentFont,
                .paragraphStyle: documentParagraphStyle,
                .foregroundColor: openQuestionColor,
            ]
        case .body:
            return [
                .font: documentFont,
                .paragraphStyle: documentParagraphStyle,
                .foregroundColor: NSColor.labelColor,
            ]
        }
    }

    /// Charter §8: typingAttributes are the system's cursor-carried style
    /// and the editor may override them ONLY at structural boundaries — a
    /// new line after a heading or an open question starts as body. After
    /// a body paragraph the answer is nil: leave the cursor's attributes
    /// alone, which is exactly what keeps a live ⌘B bold (or italic)
    /// running as the writer keeps typing. The old normalize pass reset
    /// typingAttributes unconditionally every keystroke — that is the bug
    /// this function exists to replace.
    static func typingAttributesAfterNewline(previousRole: ParagraphRole) -> [NSAttributedString.Key: Any]? {
        switch previousRole {
        case .heading, .openQuestion:
            return attributes(for: .body)
        case .body:
            return nil
        }
    }

    // MARK: - W1-pre · open-condition slot (north-star block D)

    /// Block D's open-condition slot: "❓ question · closes when: <condition>".
    /// Editor-side twin of `ReflectionLearningTrace.openCondition` — same
    /// text convention, pure function of the line, so the document path and
    /// the trace path stay equivalent by construction.
    static func openCondition(ofLine line: String) -> String? {
        guard isOpenQuestionLine(line) else { return nil }
        guard let range = line.range(of: "closes when:", options: .caseInsensitive) else { return nil }
        let value = line[range.upperBound...].trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }

    /// Block D open-question ink — the §6-sanctioned derivation (systemOrange
    /// blended toward labelColor): "unresolved" reads muted, not shouting,
    /// and adapts to appearance. Canonical home; the workspace shell's local
    /// copy becomes a forwarder when it lands (Wave 1).
    static var openQuestionColor: NSColor {
        NSColor.systemOrange.blended(withFraction: 0.34, of: .labelColor) ?? .systemOrange
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
