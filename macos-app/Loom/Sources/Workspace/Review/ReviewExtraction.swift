import AppKit

/// One (anchored evidence → your claim) pairing lifted out of a note document.
/// It carries the CONTENT of a review item; the store turns it into a scheduled
/// `ReviewItem` (see `upsert`).
struct ExtractedReview: Equatable {
    let anchorURL: String
    let sourceQuote: String
    let userSentence: String
}

/// R2 pure core (docs/canon/WHAT_IS_LOOM.md §6). The Review wedge's INPUT.
/// When you anchor a quote and write your own sentence beneath it, that
/// pairing is a review item — extraction reads it off the attributed string,
/// `upsert` folds it into the store without losing scheduling state. Neither
/// touches UI or the shell.
enum ReviewExtraction {

    /// Walk the note's paragraphs. An evidence paragraph carries a
    /// `loom://anchor` link (the return-to-source locator); the review item's
    /// claim is the FIRST following non-empty paragraph that is not itself an
    /// anchor paragraph. A quote with no claim written yet is skipped — an
    /// undistilled quote is not a coverable card (it must LOOK unfinished).
    static func extract(from doc: NSAttributedString) -> [ExtractedReview] {
        let text = doc.string as NSString
        var paragraphs: [(range: NSRange, text: String, anchor: String?)] = []
        text.enumerateSubstrings(in: NSRange(location: 0, length: text.length),
                                 options: [.byParagraphs]) { sub, range, _, _ in
            let anchor = Self.anchorLink(in: doc, paragraph: range)
            let trimmed = (sub ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            paragraphs.append((range, trimmed, anchor))
        }

        var out: [ExtractedReview] = []
        for (i, para) in paragraphs.enumerated() {
            guard let anchor = para.anchor else { continue }
            // The claim is the next non-empty, non-anchor paragraph.
            guard let claim = paragraphs[(i + 1)...].first(where: { !$0.text.isEmpty }),
                  claim.anchor == nil, !claim.text.isEmpty else { continue }
            out.append(ExtractedReview(
                anchorURL: anchor,
                sourceQuote: Self.cleanedQuote(para.text),
                userSentence: claim.text
            ))
        }
        return out
    }

    /// Merge extracted content into the store. UPSERT by anchorURL: an existing
    /// item keeps its id + schedule (stabilityDays / lastReviewedAt / createdAt)
    /// and only refreshes its quote/claim/title; a new one starts at the initial
    /// stability. NEVER deletes items not mentioned (they may belong to other
    /// notes; orphan GC is a separate, later concern).
    static func upsert(
        extracted: [ExtractedReview],
        into existing: [ReviewItem],
        sourceTitle: String,
        now: Date
    ) -> [ReviewItem] {
        var byAnchor: [String: ReviewItem] = [:]
        var order: [String] = []
        for item in existing {
            if byAnchor[item.anchorURL] == nil { order.append(item.anchorURL) }
            byAnchor[item.anchorURL] = item
        }
        for e in extracted {
            if var found = byAnchor[e.anchorURL] {
                found.sourceQuote = e.sourceQuote
                found.userSentence = e.userSentence
                found.sourceTitle = sourceTitle
                byAnchor[e.anchorURL] = found
            } else {
                order.append(e.anchorURL)
                byAnchor[e.anchorURL] = ReviewItem(
                    id: UUID().uuidString,
                    anchorURL: e.anchorURL,
                    sourceQuote: e.sourceQuote,
                    userSentence: e.userSentence,
                    sourceTitle: sourceTitle,
                    createdAt: now,
                    stabilityDays: ReviewScheduler.initialStabilityDays,
                    lastReviewedAt: nil
                )
            }
        }
        return order.compactMap { byAnchor[$0] }
    }

    // MARK: - helpers

    /// The `loom://anchor` link carried by any run in this paragraph (the
    /// return-to-source locator glyph), or nil if the paragraph isn't evidence.
    private static func anchorLink(in doc: NSAttributedString, paragraph: NSRange) -> String? {
        guard paragraph.length > 0 else { return nil }
        var found: String?
        doc.enumerateAttribute(.link, in: paragraph) { value, _, stop in
            let s = (value as? String) ?? (value as? URL)?.absoluteString ?? (value as? NSURL)?.absoluteString ?? ""
            if s.hasPrefix("loom://anchor") {
                found = s
                stop.pointee = true
            }
        }
        return found
    }

    /// Strip the surrounding quote marks and the trailing locator glyph/hair
    /// space so the stored quote is the source's words alone.
    private static func cleanedQuote(_ raw: String) -> String {
        var s = raw
        for glyph in ["\u{200A}\u{25C6}", "\u{200A}\u{25C7}", "\u{25C6}", "\u{25C7}"] {
            if s.hasSuffix(glyph) { s = String(s.dropLast(glyph.count)) }
        }
        s = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("\u{201C}") && s.hasSuffix("\u{201D}") && s.count >= 2 {
            s = String(s.dropFirst().dropLast())
        }
        return s.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
