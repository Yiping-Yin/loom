// Recovered 2026-07-08 (partition 3a): the pure draft logic + models that
// LoomDraftStoreTests cover (prompt builder, quote formatter, source tiles,
// provenance matching, inline-reference parsing). The LoomDraftView UI shell
// they lived under was retired with the minimal-root era; this logic is the
// data plane of the draft store and stays.
import Foundation
import AppKit
import SwiftUI

struct LoomDraftProvenanceMatch: Equatable, Identifiable {
    let n: Int
    let phrase: String
    let label: String
    let href: String
    let artifactState: LoomDraftArtifactState?

    var id: String { "\(href):\(n)" }

    init(
        n: Int,
        phrase: String,
        label: String,
        href: String,
        artifactState: LoomDraftArtifactState? = nil
    ) {
        self.n = n
        self.phrase = phrase
        self.label = label
        self.href = href
        self.artifactState = artifactState
    }
}

struct LoomDraftSourceTile: Equatable, Identifiable {
    let label: String
    let href: String
    let kindLabel: String
    let detail: String
    let excerpt: String?
    let canInsertQuote: Bool
    let reference: LoomDraftReference

    var id: String { "\(href):\(label)" }
}

enum LoomDraftSourceTiles {
    static func tiles(from references: [LoomDraftReference], limit: Int = 4) -> [LoomDraftSourceTile] {
        guard limit > 0 else { return [] }
        return references.compactMap { reference -> LoomDraftSourceTile? in
            guard let href = clean(reference.href) else { return nil }
            let label = clean(reference.label) ?? href
            let kindLabel = referenceKindLabel(reference)
            let excerpt = clean(reference.excerpt)?.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
            let tileReference = LoomDraftReference(
                label: label,
                href: href,
                kind: clean(reference.kind),
                sourceTitle: clean(reference.sourceTitle),
                category: clean(reference.category),
                sourcePath: clean(reference.sourcePath),
                excerpt: excerpt,
                capturedAt: clean(reference.capturedAt),
                artifactState: reference.artifactState
            )
            return LoomDraftSourceTile(
                label: label,
                href: href,
                kindLabel: kindLabel,
                detail: detail(reference, kindLabel: kindLabel),
                excerpt: excerpt,
                canInsertQuote: excerpt != nil,
                reference: tileReference
            )
        }
        .prefix(limit)
        .map { $0 }
    }

    private static func detail(_ reference: LoomDraftReference, kindLabel: String) -> String {
        var parts = [kindLabel]
        if let artifactState = LoomDraftQuoteFormatter.artifactStateLabel(reference.artifactState) {
            parts.append(artifactState)
        } else if let sourceTitle = clean(reference.sourceTitle) {
            parts.append(sourceTitle)
        }
        if let capturedAt = clean(reference.capturedAt) {
            parts.append(capturedAt)
        }
        return parts.joined(separator: " · ")
    }

    private static func referenceKindLabel(_ reference: LoomDraftReference) -> String {
        if reference.kind == "capture" { return "Capture" }
        if reference.kind == "artifact-state" { return "Artifact state" }
        if reference.kind == "url" { return "URL" }
        if let localFileKind = localFileKindLabel(for: reference.href) {
            return localFileKind
        }
        return "Source"
    }

    private static func localFileKindLabel(for href: String) -> String? {
        let ext: String
        if let url = URL(string: href) {
            ext = url.pathExtension.lowercased()
        } else {
            ext = URL(fileURLWithPath: href.components(separatedBy: CharacterSet(charactersIn: "?#")).first ?? href)
                .pathExtension
                .lowercased()
        }

        switch ext {
        case "ppt", "pptx", "key":
            return "Slide deck"
        case "pdf":
            return "PDF"
        case "md", "mdx", "markdown":
            return "Markdown"
        case "png", "jpg", "jpeg", "gif", "heic", "webp":
            return "Image"
        case "doc", "docx", "rtf", "rtfd", "pages":
            return "Document"
        case "txt", "text":
            return "Text"
        default:
            return nil
        }
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }
}

enum LoomDraftQuoteFormatter {
    static func appendReferenceExcerpt(
        to body: String,
        reference: LoomDraftReference
    ) -> String {
        guard let excerpt = clean(reference.excerpt) else { return body }
        let source = clean(reference.sourceTitle) ?? clean(reference.label) ?? reference.href
        let artifactState = artifactStateLabel(reference.artifactState)
        let block: String
        if let artifactState {
            block = "> \(excerpt)\n\nSource: \(source)\nArtifact state: \(artifactState)"
        } else {
            block = "> \(excerpt)\n\nSource: \(source)"
        }
        let prefix = trimmingTrailingWhitespaceAndNewlines(body)
        return prefix.isEmpty ? block : "\(prefix)\n\n\(block)"
    }

    static func provenanceMatches(
        body: String,
        references: [LoomDraftReference]
    ) -> [LoomDraftProvenanceMatch] {
        let haystack = normalizeSearch(body)
        guard !haystack.isEmpty else { return [] }

        var seen = Set<String>()
        var matches: [LoomDraftProvenanceMatch] = []
        for reference in references {
            guard let excerpt = clean(reference.excerpt), !seen.contains(reference.href) else { continue }
            let needle = normalizeSearch(excerpt)
            guard !needle.isEmpty, haystack.contains(needle) else { continue }
            seen.insert(reference.href)
            matches.append(
                LoomDraftProvenanceMatch(
                    n: matches.count + 1,
                    phrase: excerpt,
                    label: clean(reference.sourceTitle) ?? clean(reference.label) ?? reference.href,
                    href: reference.href,
                    artifactState: cleanArtifactState(reference.artifactState)
                )
            )
        }
        return matches
    }

    static func clean(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    static func artifactStateLabel(_ value: LoomDraftArtifactState?) -> String? {
        guard let artifactState = cleanArtifactState(value) else { return nil }
        return [
            artifactState.label,
            artifactState.kind,
            artifactState.targetId,
            artifactState.stateLabel ?? artifactState.state
        ]
        .compactMap { $0 }
        .joined(separator: " · ")
    }

    static func artifactStatePromptData(_ value: LoomDraftArtifactState?) -> String? {
        guard let state = clean(cleanArtifactState(value)?.state) else { return nil }
        return state.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
    }

    static func cleanArtifactState(_ value: LoomDraftArtifactState?) -> LoomDraftArtifactState? {
        guard let value, let targetId = clean(value.targetId) else { return nil }
        return LoomDraftArtifactState(
            targetId: targetId,
            kind: clean(value.kind),
            label: clean(value.label),
            state: clean(value.state),
            stateLabel: clean(value.stateLabel)
        )
    }

    private static func normalizeSearch(_ value: String) -> String {
        value
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
            .lowercased()
    }

    private static func trimmingTrailingWhitespaceAndNewlines(_ value: String) -> String {
        var end = value.endIndex
        while end > value.startIndex {
            let previous = value.index(before: end)
            let isWhitespace = value[previous].unicodeScalars.allSatisfy {
                CharacterSet.whitespacesAndNewlines.contains($0)
            }
            if !isWhitespace { break }
            end = previous
        }
        return String(value[..<end])
    }
}

struct LoomThinkingDraftBlock: Equatable, Identifiable {
    let id: String
    let kind: String
    let text: String
    let range: NSRange
    let wordCount: Int
    let referenceHrefs: [String]
}

enum LoomThinkingDraft {
    static func blocks(body: String, references: [LoomDraftReference] = []) -> [LoomThinkingDraftBlock] {
        let source = body.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
        let lines = source.components(separatedBy: "\n")
        var rawBlocks: [(kind: String, text: String, range: NSRange, wordCount: Int, referenceHrefs: [String])] = []
        var currentLines: [String] = []
        var currentStart = 0
        var currentEnd = 0
        var offset = 0
        var insideFence = false

        func flush() {
            guard !currentLines.isEmpty else { return }
            let text = currentLines.joined(separator: "\n")
            let kind = blockKind(text)
            rawBlocks.append((
                kind: kind,
                text: text,
                range: NSRange(location: currentStart, length: max(0, currentEnd - currentStart)),
                wordCount: wordCount(text),
                referenceHrefs: referenceHrefs(in: text, references: references)
            ))
            currentLines = []
        }

        for (index, line) in lines.enumerated() {
            let lineStart = offset
            let lineEnd = lineStart + (line as NSString).length
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            let isFence = trimmed.hasPrefix("```")
            let isBlank = trimmed.isEmpty
            if isBlank && !insideFence {
                flush()
            } else {
                if currentLines.isEmpty {
                    currentStart = lineStart
                }
                currentLines.append(line)
                currentEnd = lineEnd
            }
            if isFence {
                insideFence.toggle()
            }
            offset = lineEnd + (index < lines.count - 1 ? 1 : 0)
        }
        flush()

        var used: [String: Int] = [:]
        return rawBlocks.map { block in
            let baseID = "\(block.kind)-\(slug(for: block.text, kind: block.kind))"
            let count = used[baseID, default: 0]
            used[baseID] = count + 1
            return LoomThinkingDraftBlock(
                id: count == 0 ? baseID : "\(baseID)-\(count + 1)",
                kind: block.kind,
                text: block.text,
                range: block.range,
                wordCount: block.wordCount,
                referenceHrefs: block.referenceHrefs
            )
        }
    }

    static func referenceLabels(for block: LoomThinkingDraftBlock, references: [LoomDraftReference]) -> [String] {
        let byHref = Dictionary(uniqueKeysWithValues: references.compactMap { reference -> (String, LoomDraftReference)? in
            guard let href = clean(reference.href) else { return nil }
            return (href, reference)
        })
        var labels: [String] = []
        var seen = Set<String>()

        for href in block.referenceHrefs {
            guard let cleanHref = clean(href), !seen.contains(cleanHref) else { continue }
            labels.append(referenceLabel(for: byHref[cleanHref], fallback: cleanHref))
            seen.insert(cleanHref)
        }

        return labels
    }

    static func applyBlockEdit(
        body: String,
        blockID: String,
        original: String,
        replacement: String
    ) -> String {
        let next = clean(replacement)
        guard let next else { return body }
        guard let block = blocks(body: body).first(where: { $0.id == blockID }) else { return body }
        guard block.text == original else { return body }
        return (body as NSString).replacingCharacters(in: block.range, with: next)
    }

    static func applyBlockOperation(
        body: String,
        blockIDs: [String],
        originals: [String],
        replacement: String
    ) -> String {
        guard let next = clean(replacement) else { return body }
        guard !blockIDs.isEmpty, blockIDs.count == originals.count else { return body }
        guard Set(blockIDs).count == blockIDs.count else { return body }

        let currentBlocks = blocks(body: body)
        let selected = blockIDs.compactMap { blockID -> (index: Int, block: LoomThinkingDraftBlock)? in
            guard let index = currentBlocks.firstIndex(where: { $0.id == blockID }) else { return nil }
            return (index, currentBlocks[index])
        }
        guard selected.count == blockIDs.count, let first = selected.first, let last = selected.last else { return body }
        for (offset, entry) in selected.enumerated() where entry.index != first.index + offset {
            return body
        }
        for (offset, entry) in selected.enumerated() where entry.block.text != originals[offset] {
            return body
        }

        let source = body as NSString
        let start = first.block.range.location
        let end = last.block.range.location + last.block.range.length
        guard start >= 0, end >= start, end <= source.length else { return body }
        return source.replacingCharacters(in: NSRange(location: start, length: end - start), with: next)
    }

    static func operationDiffHunks(
        blocks: [LoomThinkingDraftBlock],
        replacement: String
    ) -> [LoomDraftInlineEditDiffHunk] {
        guard !blocks.isEmpty else { return [] }
        return LoomDraftInlineEdit.diffHunks(
            original: blocks.map(\.text).joined(separator: "\n\n"),
            replacement: replacement
        )
        .filter { !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    private static func blockKind(_ text: String) -> String {
        let lines = text
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        guard let first = lines.first else { return "paragraph" }
        if first.hasPrefix("```") { return "code" }
        if first.range(of: #"^#{1,6}\s+"#, options: .regularExpression) != nil { return "heading" }
        if !lines.isEmpty && lines.allSatisfy({ $0.hasPrefix(">") }) { return "quote" }
        if !lines.isEmpty && lines.allSatisfy({ $0.range(of: #"^([-*+]\s+|\d+[.)]\s+)"#, options: .regularExpression) != nil }) {
            return "list"
        }
        return "paragraph"
    }

    private static func wordCount(_ text: String) -> Int {
        let cleaned = text
            .components(separatedBy: "\n")
            .map(stripBlockSyntax)
            .joined(separator: " ")
        return cleaned
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { $0.rangeOfCharacter(from: .alphanumerics) != nil }
            .count
    }

    private static func referenceLabel(for reference: LoomDraftReference?, fallback: String) -> String {
        guard let reference else { return fallback }
        if reference.kind == "artifact-state" {
            return "\(reference.artifactState?.label ?? reference.label) · artifact state"
        }
        return reference.sourceTitle ?? reference.label
    }

    private static func referenceHrefs(in text: String, references: [LoomDraftReference]) -> [String] {
        let haystack = normalize(text)
        var hrefs: [String] = []
        var seen = Set<String>()
        for reference in references {
            guard let href = clean(reference.href), !seen.contains(href) else { continue }
            let excerptNeedle = clean(reference.excerpt).map(normalize) ?? ""
            let labelNeedle = normalize(reference.sourceTitle ?? reference.label)
            if (!excerptNeedle.isEmpty && haystack.contains(excerptNeedle))
                || (!labelNeedle.isEmpty && haystack.contains(labelNeedle))
                || containsReferenceMention(in: haystack, token: referenceMentionToken(for: reference)) {
                hrefs.append(href)
                seen.insert(href)
            }
        }
        return hrefs
    }

    private static func referenceMentionToken(for reference: LoomDraftReference) -> String {
        let doc = AskAIDocRef(
            id: reference.href,
            title: reference.sourceTitle ?? reference.label,
            href: reference.href,
            category: reference.category ?? reference.kind ?? "Draft reference",
            sourcePath: reference.sourcePath,
            artifactState: reference.artifactState
        )
        return LoomDraftReferenceMention.token(for: doc)
    }

    private static func containsReferenceMention(in normalizedText: String, token: String) -> Bool {
        let needle = normalize(token)
        guard !needle.isEmpty else { return false }
        let pattern = "(^|[^A-Za-z0-9._#:-])\(NSRegularExpression.escapedPattern(for: needle))(?=$|[^A-Za-z0-9._#:-])"
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return false }
        return regex.firstMatch(
            in: normalizedText,
            range: NSRange(location: 0, length: (normalizedText as NSString).length)
        ) != nil
    }

    private static func slug(for text: String, kind: String) -> String {
        let firstLine = text
            .components(separatedBy: "\n")
            .first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) ?? "block"
        let words = stripBlockSyntax(firstLine)
            .lowercased()
            .replacingOccurrences(of: #"[^a-z0-9]+"#, with: " ", options: .regularExpression)
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .prefix(kind == "paragraph" ? 7 : 6)
        let slug = words.joined(separator: "-")
        return slug.isEmpty ? "block" : slug
    }

    private static func stripBlockSyntax(_ line: String) -> String {
        line
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: #"^#{1,6}\s+"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"^>\s?"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"^([-*+]\s+|\d+[.)]\s+)"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"^\[[ xX]\]\s+"#, with: "", options: .regularExpression)
    }

    private static func clean(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func normalize(_ value: String) -> String {
        value
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
            .lowercased()
    }
}

enum LoomDraftAIState {
    case idle
    case streaming
    case ready
    case error
}

private enum LoomDraftInspectorMode: String, CaseIterable, Identifiable {
    case context = "Sources"
    case edit = "Edit"
    case board = "Board"

    var id: String { rawValue }
}

struct LoomDraftInlineReferenceAnchor: Equatable {
    let kind: String
    let label: String
    let start: Int?
    let end: Int?
    let value: String?
}

struct LoomDraftInlineReference: Equatable {
    let token: String
    let target: String
    let anchor: LoomDraftInlineReferenceAnchor?
}

enum LoomDraftInlineReferenceParser {
    static func parse(_ body: String) -> [LoomDraftInlineReference] {
        let pattern = #"(^|[^A-Za-z0-9_.])@([A-Za-z0-9][A-Za-z0-9._-]*)(?:(:p([0-9]+)(?:-([0-9]+))?)|#([A-Za-z0-9._:-]+))?"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let source = body as NSString
        let range = NSRange(location: 0, length: source.length)

        return regex.matches(in: body, range: range).compactMap { match in
            guard match.range(at: 2).location != NSNotFound else { return nil }
            let target = trimInlineReferenceTargetPunctuation(source.substring(with: match.range(at: 2)))
            guard !target.isEmpty else { return nil }
            var suffix = ""
            var anchor: LoomDraftInlineReferenceAnchor?

            if match.range(at: 4).location != NSNotFound {
                let start = Int(source.substring(with: match.range(at: 4))) ?? 0
                let end = match.range(at: 5).location == NSNotFound
                    ? start
                    : Int(source.substring(with: match.range(at: 5))) ?? start
                guard start > 0, end > 0 else { return nil }
                let kind = inferPageOrSlideKind(target)
                let label = start == end
                    ? "\(kind) \(start)"
                    : "\(kind)s \(start)-\(end)"
                anchor = LoomDraftInlineReferenceAnchor(
                    kind: kind,
                    label: label,
                    start: start,
                    end: end,
                    value: nil
                )
                suffix = ":p\(start)\(end == start ? "" : "-\(end)")"
            } else if match.range(at: 6).location != NSNotFound {
                let fragment = trimInlineReferencePunctuation(source.substring(with: match.range(at: 6)))
                guard !fragment.isEmpty else { return nil }
                let kind = fragment.contains(":") ? "artifact-state" : "heading"
                anchor = LoomDraftInlineReferenceAnchor(
                    kind: kind,
                    label: kind == "artifact-state" ? "artifact-state \(fragment)" : "heading \(fragment)",
                    start: nil,
                    end: nil,
                    value: fragment
                )
                suffix = "#\(fragment)"
            }

            return LoomDraftInlineReference(
                token: "@\(target)\(suffix)",
                target: target,
                anchor: anchor
            )
        }
    }

    static func promptLines(
        body: String,
        references: [LoomDraftReference],
        corpusHits: [LoomDraftCorpusHit] = []
    ) -> [String] {
        parse(body).enumerated().map { index, mention in
            let artifactReference = findArtifactStateMatch(for: mention, references: references)
            let reference = artifactReference ?? findMatch(for: mention, references: references)
            let corpusHit = reference == nil ? findCorpusMatch(for: mention, corpusHits: corpusHits) : nil
            let artifactState = inlinePromptArtifactState(
                mention: mention,
                referenceState: reference?.artifactState,
                corpusState: corpusHit?.artifactState
            )
            let parts: [String?] = [
                "\(index + 1). \(mention.token)",
                "target=\(mention.target)",
                mention.anchor.map { "anchor=\($0.label)" },
                reference.map { "source=\(sourceLabel($0))" }
                    ?? corpusHit.map { "source=Corpus: \($0.title)" }
                    ?? "source=unattached",
                reference.flatMap { clean($0.href).map { "href=\($0)" } }
                    ?? corpusHit.flatMap { clean($0.href).map { "href=\($0)" } },
                reference == nil ? corpusHit.flatMap { clean($0.category).map { "category=\($0)" } } : nil,
                reference == nil ? corpusHit.flatMap { clean($0.sourcePath).map { "sourcePath=\($0)" } } : nil,
                LoomDraftQuoteFormatter.artifactStateLabel(artifactState).map { "artifactState=\($0)" },
                LoomDraftQuoteFormatter.artifactStatePromptData(artifactState).map { "artifactStateData=\($0)" }
            ]
            return parts.compactMap { $0 }.joined(separator: " | ")
        }
    }

    private static func inlinePromptArtifactState(
        mention: LoomDraftInlineReference,
        referenceState: LoomDraftArtifactState?,
        corpusState: LoomDraftArtifactState?
    ) -> LoomDraftArtifactState? {
        guard let artifactState = LoomDraftQuoteFormatter.cleanArtifactState(referenceState ?? corpusState) else {
            return nil
        }
        guard mention.anchor?.kind == "artifact-state",
              let anchorValue = clean(mention.anchor?.value) else {
            return artifactState
        }
        return artifactStateMatchesAnchor(artifactState, anchorValue: anchorValue) ? artifactState : nil
    }

    private static func findMatch(
        for mention: LoomDraftInlineReference,
        references: [LoomDraftReference]
    ) -> LoomDraftReference? {
        let target = normalize(mention.target)
        let slug = slugify(mention.target)
        let exactMatch = references.first { reference in
            let keys = referenceKeys(reference)
            return keys.contains(target) || keys.contains(slug)
        }
        if let exactMatch { return exactMatch }
        return uniqueScoredReferenceMatch(for: mention.target, references: references)
    }

    private static func findArtifactStateMatch(
        for mention: LoomDraftInlineReference,
        references: [LoomDraftReference]
    ) -> LoomDraftReference? {
        guard mention.anchor?.kind == "artifact-state",
              let anchorValue = clean(mention.anchor?.value) else {
            return nil
        }
        return references.first { reference in
            guard let artifactState = reference.artifactState else { return false }
            return artifactStateMatchesAnchor(artifactState, anchorValue: anchorValue)
        }
    }

    private static func artifactStateMatchesAnchor(
        _ artifactState: LoomDraftArtifactState,
        anchorValue: String
    ) -> Bool {
        let anchorBase = anchorValue.components(separatedBy: ":").first ?? anchorValue
        let anchorKey = normalize(anchorBase)
        let anchorSlug = slugify(anchorBase)
        return [artifactState.targetId, artifactState.label].contains { value in
            let key = normalize(value)
            let slug = slugify(value)
            return (!key.isEmpty && key == anchorKey) || (!slug.isEmpty && slug == anchorSlug)
        }
    }

    private static func findCorpusMatch(
        for mention: LoomDraftInlineReference,
        corpusHits: [LoomDraftCorpusHit]
    ) -> LoomDraftCorpusHit? {
        let target = normalize(mention.target)
        let slug = slugify(mention.target)
        let exactMatch = corpusHits.first { hit in
            let keys = corpusKeys(hit)
            return keys.contains(target) || keys.contains(slug)
        }
        if let exactMatch { return exactMatch }
        return uniqueScoredCorpusMatch(for: mention.target, corpusHits: corpusHits)
    }

    private static func referenceKeys(_ reference: LoomDraftReference) -> Set<String> {
        var keys = Set<String>()
        func add(_ value: String?) {
            let normalized = normalize(value)
            let slug = slugify(value)
            if !normalized.isEmpty { keys.insert(normalized) }
            if !slug.isEmpty { keys.insert(slug) }
        }

        add(reference.label)
        add(reference.sourceTitle)
        add(reference.category)
        add(reference.sourcePath)
        add(reference.href)
        add(reference.artifactState?.targetId)
        add(reference.artifactState?.label)

        let basename = hrefBasename(reference.href)
        add(basename)
        add(stripKnownExtension(basename))

        return keys
    }

    private static func corpusKeys(_ hit: LoomDraftCorpusHit) -> Set<String> {
        var keys = Set<String>()
        func add(_ value: String?) {
            let normalized = normalize(value)
            let slug = slugify(value)
            if !normalized.isEmpty { keys.insert(normalized) }
            if !slug.isEmpty { keys.insert(slug) }
        }

        add(hit.title)
        add(hit.href)
        add(hit.category)
        add(hit.sourcePath)
        add(hit.artifactState?.targetId)
        add(hit.artifactState?.label)

        let basename = hrefBasename(hit.href)
        add(basename)
        add(stripKnownExtension(basename))

        return keys
    }

    private static func uniqueScoredReferenceMatch(
        for target: String,
        references: [LoomDraftReference]
    ) -> LoomDraftReference? {
        let qText = normalize(target)
        let qSlug = slugify(target)
        let scored = references
            .map { reference in
                (reference: reference, score: referenceAliasScore(reference, qText: qText, qSlug: qSlug))
            }
            .filter { $0.score > 0 }
            .sorted {
                if $0.score != $1.score { return $0.score > $1.score }
                return $0.reference.label.localizedCaseInsensitiveCompare($1.reference.label) == .orderedAscending
            }

        guard let top = scored.first else { return nil }
        if scored.dropFirst().first?.score == top.score { return nil }
        return top.reference
    }

    private static func referenceAliasScore(
        _ reference: LoomDraftReference,
        qText: String,
        qSlug: String
    ) -> Int {
        let basename = hrefBasename(reference.href)
        return candidateFieldScore(reference.label, qText: qText, qSlug: qSlug, exact: 80, prefix: 56, contains: 28) +
            candidateFieldScore(reference.sourceTitle, qText: qText, qSlug: qSlug, exact: 80, prefix: 56, contains: 28) +
            candidateFieldScore(reference.category, qText: qText, qSlug: qSlug, exact: 36, prefix: 24, contains: 16) +
            candidateFieldScore(reference.sourcePath, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(reference.href, qText: qText, qSlug: qSlug, exact: 24, prefix: 16, contains: 8) +
            candidateFieldScore(basename, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(stripKnownExtension(basename), qText: qText, qSlug: qSlug, exact: 56, prefix: 40, contains: 22) +
            candidateFieldScore(reference.artifactState?.targetId, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(reference.artifactState?.label, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18)
    }

    private static func uniqueScoredCorpusMatch(
        for target: String,
        corpusHits: [LoomDraftCorpusHit]
    ) -> LoomDraftCorpusHit? {
        let qText = normalize(target)
        let qSlug = slugify(target)
        let scored = corpusHits
            .map { hit in
                (hit: hit, score: corpusAliasScore(hit, qText: qText, qSlug: qSlug))
            }
            .filter { $0.score > 0 }
            .sorted {
                if $0.score != $1.score { return $0.score > $1.score }
                return $0.hit.title.localizedCaseInsensitiveCompare($1.hit.title) == .orderedAscending
            }

        guard let top = scored.first else { return nil }
        if scored.dropFirst().first?.score == top.score { return nil }
        return top.hit
    }

    private static func corpusAliasScore(
        _ hit: LoomDraftCorpusHit,
        qText: String,
        qSlug: String
    ) -> Int {
        let basename = hrefBasename(hit.href)
        let sourceBasename = hrefBasename(hit.sourcePath)
        return candidateFieldScore(hit.title, qText: qText, qSlug: qSlug, exact: 80, prefix: 56, contains: 28) +
            candidateFieldScore(hit.href, qText: qText, qSlug: qSlug, exact: 24, prefix: 16, contains: 8) +
            candidateFieldScore(hit.category, qText: qText, qSlug: qSlug, exact: 36, prefix: 24, contains: 12) +
            candidateFieldScore(hit.sourcePath, qText: qText, qSlug: qSlug, exact: 24, prefix: 16, contains: 8) +
            candidateFieldScore(basename, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(stripKnownExtension(basename), qText: qText, qSlug: qSlug, exact: 56, prefix: 40, contains: 22) +
            candidateFieldScore(sourceBasename, qText: qText, qSlug: qSlug, exact: 40, prefix: 28, contains: 14) +
            candidateFieldScore(stripKnownExtension(sourceBasename), qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(hit.artifactState?.targetId, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18) +
            candidateFieldScore(hit.artifactState?.label, qText: qText, qSlug: qSlug, exact: 48, prefix: 34, contains: 18)
    }

    private static func candidateFieldScore(
        _ value: String?,
        qText: String,
        qSlug: String,
        exact: Int,
        prefix: Int,
        contains: Int
    ) -> Int {
        let normalized = normalize(value)
        let slug = slugify(value)
        guard !normalized.isEmpty || !slug.isEmpty else { return 0 }

        var score = 0
        if !qText.isEmpty, normalized == qText { score += exact }
        if !qSlug.isEmpty, slug == qSlug { score += exact }
        if !qText.isEmpty, normalized.hasPrefix(qText) { score += prefix }
        if !qSlug.isEmpty, slug.hasPrefix(qSlug) { score += prefix }
        if !qText.isEmpty, normalized.contains(qText) { score += contains }
        if !qSlug.isEmpty, slug.contains(qSlug) { score += contains }

        let terms = qText
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.count >= 2 }
        if terms.count > 1, terms.allSatisfy({ normalized.contains($0) || slug.contains($0) }) {
            score += contains * terms.count
        }

        return score
    }

    private static func sourceLabel(_ reference: LoomDraftReference) -> String {
        clean(reference.sourceTitle) ?? clean(reference.label) ?? reference.href
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }

    private static func trimInlineReferencePunctuation(_ value: String) -> String {
        value.trimmingCharacters(in: CharacterSet(charactersIn: ".,!?;)"))
    }

    private static func trimInlineReferenceTargetPunctuation(_ value: String) -> String {
        value.trimmingCharacters(in: CharacterSet(charactersIn: ".,!?;)"))
    }

    private static func inferPageOrSlideKind(_ target: String) -> String {
        let normalized = target.lowercased()
        let pattern = #"(^|[-_.])(slides?|pptx?|keynote|key)([-_.]|$)"#
        return normalized.range(of: pattern, options: .regularExpression) == nil ? "page" : "slide"
    }

    private static func normalize(_ value: String?) -> String {
        (value?.removingPercentEncoding ?? value ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
    }

    private static func slugify(_ value: String?) -> String {
        normalize(value)
            .replacingOccurrences(of: #"[^a-z0-9]+"#, with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }

    private static func hrefBasename(_ href: String?) -> String {
        guard let href = clean(href) else { return "" }
        let withoutQuery = href.components(separatedBy: CharacterSet(charactersIn: "?#")).first ?? href
        return withoutQuery.split(separator: "/").last.map(String.init) ?? ""
    }

    private static func stripKnownExtension(_ value: String?) -> String {
        normalize(value)
            .replacingOccurrences(
                of: #"\.(pdf|pptx?|key|pages|mdx?|markdown|txt|docx?|rtfd?)$"#,
                with: "",
                options: .regularExpression
            )
    }
}

struct LoomDraftCorpusHit: Equatable {
    let title: String
    let href: String
    var category: String? = nil
    var sourcePath: String? = nil
    var excerpt: String? = nil
    var score: Double? = nil
    var artifactState: LoomDraftArtifactState? = nil
}

enum LoomDraftCorpusContext {
    static func similarHits(for body: String, limit: Int = 5) -> [LoomDraftCorpusHit] {
        LoomEmbeddingStore.similarAcrossAllRoots(to: body, limit: limit).map { hit in
            LoomDraftCorpusHit(
                title: hit.record.anchorLabel,
                href: hit.record.targetPath,
                category: "Capture memory",
                sourcePath: hit.record.targetPath,
                excerpt: hit.record.snippet,
                score: hit.similarity,
                artifactState: hit.record.artifactStates?.first
            )
        }
    }
}

enum LoomDraftReferenceMention {
    struct ActiveQuery: Equatable {
        let range: NSRange
        let query: String
    }

    static func token(for doc: AskAIDocRef) -> String {
        let hrefBase = stripKnownExtension(hrefBasename(doc.href))
        let titleBase = slugify(doc.title)
        let slug = slugify(hrefBase).isEmpty ? titleBase : slugify(hrefBase)
        return "@\(slug.isEmpty ? "source" : slug)\(artifactStateMentionSuffix(for: doc))"
    }

    private static func artifactStateMentionSuffix(for doc: AskAIDocRef) -> String {
        guard let artifactState = LoomDraftQuoteFormatter.cleanArtifactState(doc.artifactState) else {
            return ""
        }
        let anchor = slugify(artifactState.targetId).isEmpty
            ? slugify(artifactState.label ?? "")
            : slugify(artifactState.targetId)
        return anchor.isEmpty ? "" : "#\(anchor):state"
    }

    static func activeQuery(in body: String, selectedRange: NSRange) -> ActiveQuery? {
        guard selectedRange.length == 0 else { return nil }
        let source = body as NSString
        let location = max(0, min(selectedRange.location == NSNotFound ? source.length : selectedRange.location, source.length))
        let prefix = source.substring(to: location)
        let pattern = #"(^|[\s(\[{])@([A-Za-z0-9._-]*)$"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: prefix, range: NSRange(location: 0, length: (prefix as NSString).length)) else {
            return nil
        }
        let queryRange = match.range(at: 2)
        guard queryRange.location != NSNotFound else { return nil }
        let atLocation = queryRange.location - 1
        guard atLocation >= 0 else { return nil }
        let query = (prefix as NSString).substring(with: queryRange)
        if atLocation > 0 {
            let previous = (prefix as NSString).substring(with: NSRange(location: atLocation - 1, length: 1))
            if previous.range(of: #"[A-Za-z0-9._-]"#, options: .regularExpression) != nil {
                return nil
            }
        }
        return ActiveQuery(range: NSRange(location: atLocation, length: location - atLocation), query: query)
    }

    static func rank(
        query: String,
        docs: [AskAIDocRef],
        alreadyReferenced: Set<String> = []
    ) -> [AskAIDocRef] {
        let referenced = Set(alreadyReferenced.map(normalizeKey))
        let unreferenced = docs.filter { !referenced.contains(normalizeKey($0.href)) }
        let qText = normalizeKey(query)
        let qSlug = slugify(query)
        guard !qText.isEmpty || !qSlug.isEmpty else {
            return unreferenced.sorted {
                $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
            }
        }
        return unreferenced
            .map { doc in (doc: doc, score: candidateScore(doc: doc, qText: qText, qSlug: qSlug)) }
            .filter { $0.score > 0 }
            .sorted {
                if $0.score != $1.score { return $0.score > $1.score }
                return $0.doc.title.localizedCaseInsensitiveCompare($1.doc.title) == .orderedAscending
            }
            .map(\.doc)
    }

    static func predictNext(
        title: String,
        body: String,
        docs: [AskAIDocRef],
        alreadyReferenced: Set<String> = [],
        limit: Int = 3
    ) -> [AskAIDocRef] {
        let tokens = contextTokens("\(title)\n\(body)")
        guard !tokens.isEmpty else { return [] }
        let referenced = Set(alreadyReferenced.map(normalizeKey))
        return docs
            .filter { !referenced.contains(normalizeKey($0.href)) }
            .map { doc in (doc: doc, score: contextScore(doc: doc, tokens: tokens)) }
            .filter { $0.score > 0 }
            .sorted {
                if $0.score != $1.score { return $0.score > $1.score }
                return $0.doc.title.localizedCaseInsensitiveCompare($1.doc.title) == .orderedAscending
            }
            .prefix(limit)
            .map(\.doc)
    }

    static func reference(for doc: AskAIDocRef) -> LoomDraftReference {
        LoomDraftReference(
            label: clean(doc.title) ?? doc.href,
            href: doc.href,
            kind: referenceKind(for: doc),
            sourceTitle: clean(doc.title) ?? doc.href,
            category: clean(doc.category),
            sourcePath: clean(doc.sourcePath),
            artifactState: LoomDraftQuoteFormatter.cleanArtifactState(doc.artifactState)
        )
    }

    static func insert(into body: String, selectedRange: NSRange, doc: AskAIDocRef) -> String {
        let source = body as NSString
        let location = max(0, min(selectedRange.location == NSNotFound ? source.length : selectedRange.location, source.length))
        let length = max(0, min(selectedRange.length, source.length - location))
        let end = location + length
        let before = source.substring(to: location)
        let after = source.substring(from: end)
        let token = token(for: doc)
        let left = before.isEmpty || before.range(of: #"\s$"#, options: .regularExpression) != nil ? "" : " "
        let right = after.isEmpty
            ? " "
            : (after.range(of: #"^[\s.,!?;:)\]}]"#, options: .regularExpression) != nil ? "" : " ")
        return "\(before)\(left)\(token)\(right)\(after)"
    }

    private static func referenceKind(for doc: AskAIDocRef) -> String {
        if LoomDraftQuoteFormatter.cleanArtifactState(doc.artifactState) != nil { return "artifact-state" }
        let category = doc.category.lowercased()
        let href = doc.href.lowercased()
        if category.contains("capture") || href.contains("/loom-render/capture") { return "capture" }
        if href.hasPrefix("http://") || href.hasPrefix("https://") { return "url" }
        return "source"
    }

    private static func candidateScore(doc: AskAIDocRef, qText: String, qSlug: String) -> Int {
        let token = String(token(for: doc).dropFirst())
        return fieldScore(token, qText: qText, qSlug: qSlug, exact: 120, prefix: 90, contains: 45) +
            fieldScore(doc.title, qText: qText, qSlug: qSlug, exact: 80, prefix: 60, contains: 30) +
            fieldScore(doc.href, qText: qText, qSlug: qSlug, exact: 42, prefix: 28, contains: 18) +
            fieldScore(doc.category, qText: qText, qSlug: qSlug, exact: 36, prefix: 24, contains: 16) +
            fieldScore(doc.artifactState?.targetId ?? "", qText: qText, qSlug: qSlug, exact: 64, prefix: 44, contains: 28) +
            fieldScore(doc.artifactState?.label ?? "", qText: qText, qSlug: qSlug, exact: 56, prefix: 38, contains: 24) +
            fieldScore(doc.artifactState?.stateLabel ?? "", qText: qText, qSlug: qSlug, exact: 48, prefix: 32, contains: 22) +
            fieldScore(doc.artifactState?.state ?? "", qText: qText, qSlug: qSlug, exact: 40, prefix: 26, contains: 18) +
            fieldScore(doc.artifactState?.kind ?? "", qText: qText, qSlug: qSlug, exact: 24, prefix: 16, contains: 10)
    }

    private static func contextScore(doc: AskAIDocRef, tokens: [String]) -> Int {
        contextFieldScore(doc.title, tokens: tokens, weight: 4) +
            contextFieldScore(doc.category, tokens: tokens, weight: 2) +
            contextFieldScore(doc.href, tokens: tokens, weight: 1) +
            contextFieldScore(doc.artifactState?.targetId ?? "", tokens: tokens, weight: 2) +
            contextFieldScore(doc.artifactState?.label ?? "", tokens: tokens, weight: 2) +
            contextFieldScore(doc.artifactState?.stateLabel ?? "", tokens: tokens, weight: 4) +
            contextFieldScore(doc.artifactState?.state ?? "", tokens: tokens, weight: 4) +
            contextFieldScore(doc.artifactState?.kind ?? "", tokens: tokens, weight: 2)
    }

    private static func contextFieldScore(_ value: String, tokens: [String], weight: Int) -> Int {
        let haystack = normalizeKey(value)
        guard !haystack.isEmpty else { return 0 }
        return tokens.reduce(0) { score, token in
            haystack.contains(token) ? score + weight : score
        }
    }

    private static func contextTokens(_ value: String) -> [String] {
        let stop = Set([
            "about",
            "after",
            "again",
            "also",
            "and",
            "are",
            "before",
            "compare",
            "draft",
            "for",
            "from",
            "into",
            "notes",
            "the",
            "this",
            "with"
        ])
        var seen = Set<String>()
        return normalizeKey(value)
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { token in
                guard token.count >= 3, !stop.contains(token), !seen.contains(token) else { return false }
                seen.insert(token)
                return true
            }
    }

    private static func fieldScore(
        _ value: String,
        qText: String,
        qSlug: String,
        exact: Int,
        prefix: Int,
        contains: Int
    ) -> Int {
        let normalized = normalizeKey(value)
        let slug = slugify(value)
        var score = 0
        if !qText.isEmpty, normalized == qText { score += exact }
        if !qSlug.isEmpty, slug == qSlug { score += exact }
        if !qText.isEmpty, normalized.hasPrefix(qText) { score += prefix }
        if !qSlug.isEmpty, slug.hasPrefix(qSlug) { score += prefix }
        if !qText.isEmpty, normalized.contains(qText) { score += contains }
        if !qSlug.isEmpty, slug.contains(qSlug) { score += contains }

        let terms = qText
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.count >= 2 }
        if terms.count > 1, terms.allSatisfy({ normalized.contains($0) || slug.contains($0) }) {
            score += contains * terms.count
        }
        return score
    }

    private static func normalizeKey(_ value: String) -> String {
        (value.removingPercentEncoding ?? value)
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
    }

    private static func hrefBasename(_ href: String) -> String {
        let withoutQuery = href.components(separatedBy: CharacterSet(charactersIn: "?#")).first ?? href
        return withoutQuery.split(separator: "/").last.map(String.init) ?? ""
    }

    private static func stripKnownExtension(_ value: String) -> String {
        value.replacingOccurrences(
            of: #"\.(pdf|pptx?|key|pages|mdx?|markdown|txt|docx?|rtfd?)$"#,
            with: "",
            options: .regularExpression
        )
    }

    private static func slugify(_ value: String) -> String {
        value
            .removingPercentEncoding?
            .lowercased()
            .replacingOccurrences(of: #"[^a-z0-9]+"#, with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
            ?? ""
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }
}

enum LoomDraftAIPrompt {
    private static let truncationMarker = "[truncated for provider context]"
    private static let maxPromptCharacters = 6000
    private static let titleCharacterLimit = 240
    private static let bodyCharacterLimit = 1800
    private static let referenceLineCharacterLimit = 700
    private static let referenceTotalCharacterLimit = 1800
    private static let inlineLineCharacterLimit = 500
    private static let inlineTotalCharacterLimit = 1000
    private static let corpusLineCharacterLimit = 500
    private static let corpusTotalCharacterLimit = 1000

    static func buildDraftAIPrompt(
        title: String,
        body: String,
        references: [LoomDraftReference],
        corpusHits: [LoomDraftCorpusHit] = []
    ) -> String {
        let cleanedTitle = boundedPromptText(clean(title) ?? "Untitled draft", characterLimit: titleCharacterLimit)
        let cleanedBody = boundedPromptText(clean(body) ?? "(empty draft)", characterLimit: bodyCharacterLimit)
        let referenceText = references.isEmpty
            ? "No references attached."
            : boundedPromptLines(
                references.enumerated().map { index, reference in
                    referencePromptLine(reference, index: index)
                },
                lineLimit: referenceLineCharacterLimit,
                totalLimit: referenceTotalCharacterLimit
            )
        let inlineReferenceLines = LoomDraftInlineReferenceParser.promptLines(
            body: body,
            references: references,
            corpusHits: corpusHits
        )
        let inlineReferenceText = inlineReferenceLines.isEmpty
            ? "No inline @references in the draft."
            : boundedPromptLines(
                inlineReferenceLines,
                lineLimit: inlineLineCharacterLimit,
                totalLimit: inlineTotalCharacterLimit
            )
        let corpusText = corpusHits.isEmpty
            ? "No corpus context selected."
            : boundedPromptLines(
                corpusHits.enumerated().map { index, hit in
                    corpusPromptLine(hit, index: index)
                },
                lineLimit: corpusLineCharacterLimit,
                totalLimit: corpusTotalCharacterLimit
            )

        return boundedPromptWithFinalInstruction(
            sections: [
                "You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.",
                "Continue the current draft in the user's voice. Use attached references and corpus context only when they are relevant. Do not invent source claims.",
                "Title:\n\(cleanedTitle)",
                "Current draft:\n\(cleanedBody)",
                "Attached references:\n\(referenceText)",
                "Inline @references:\n\(inlineReferenceText)",
                "Corpus context:\n\(corpusText)"
            ],
            finalInstruction: "Return only draft text that can be inserted into the body.",
            maxCharacters: maxPromptCharacters
        )
    }

    static func appendAISuggestionToBody(_ body: String, suggestion: String) -> String {
        guard let next = clean(suggestion) else { return body }
        let prefix = trimmingTrailingWhitespaceAndNewlines(body)
        return prefix.isEmpty ? next : "\(prefix)\n\n\(next)"
    }

    private static func referencePromptLine(_ reference: LoomDraftReference, index: Int) -> String {
        [
            "\(index + 1). \(referenceKindLabel(reference)): \(reference.label)",
            clean(reference.sourceTitle).map { "source=\($0)" },
            clean(reference.href).map { "href=\($0)" },
            clean(reference.category).map { "category=\($0)" },
            clean(reference.sourcePath).map { "sourcePath=\($0)" },
            clean(reference.capturedAt).map { "capturedAt=\($0)" },
            clean(reference.excerpt).map { "excerpt=\($0)" },
            LoomDraftQuoteFormatter.artifactStateLabel(reference.artifactState).map { "artifactState=\($0)" },
            LoomDraftQuoteFormatter.artifactStatePromptData(reference.artifactState).map { "artifactStateData=\($0)" }
        ]
        .compactMap { $0 }
        .joined(separator: " | ")
    }

    private static func corpusPromptLine(_ hit: LoomDraftCorpusHit, index: Int) -> String {
        [
            "\(index + 1). Corpus: \(hit.title)",
            clean(hit.category).map { "category=\($0)" },
            clean(hit.href).map { "href=\($0)" },
            clean(hit.sourcePath).map { "sourcePath=\($0)" },
            clean(hit.excerpt).map { "excerpt=\($0.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression))" },
            LoomDraftQuoteFormatter.artifactStateLabel(hit.artifactState).map { "artifactState=\($0)" },
            LoomDraftQuoteFormatter.artifactStatePromptData(hit.artifactState).map { "artifactStateData=\($0)" },
            hit.score.map { "score=\(String(format: "%.2f", $0))" }
        ]
        .compactMap { $0 }
        .joined(separator: " | ")
    }

    private static func referenceKindLabel(_ reference: LoomDraftReference) -> String {
        if reference.kind == "capture" { return "Capture" }
        if reference.kind == "artifact-state" { return "Artifact state" }
        if reference.kind == "url" { return "URL" }
        return "Source"
    }

    private static func boundedPromptLines(
        _ lines: [String],
        lineLimit: Int,
        totalLimit: Int
    ) -> String {
        var selected: [String] = []
        var used = 0
        var omitted = false

        for line in lines {
            let compactLine = line.replacingOccurrences(
                of: #"\s+"#,
                with: " ",
                options: .regularExpression
            )
            let next = boundedPromptText(compactLine, characterLimit: lineLimit)
            let separator = selected.isEmpty ? 0 : 1
            if used + separator + next.count > totalLimit {
                let remaining = totalLimit - used - separator
                if remaining > truncationMarker.count + 16 {
                    let bounded = boundedPromptText(next, characterLimit: remaining)
                    selected.append(bounded)
                    used += separator + bounded.count
                }
                omitted = true
                break
            }
            selected.append(next)
            used += separator + next.count
        }

        if omitted && !selected.joined(separator: "\n").contains(truncationMarker) {
            let separator = selected.isEmpty ? 0 : 1
            if used + separator + truncationMarker.count <= totalLimit {
                selected.append(truncationMarker)
            }
        }

        return selected.joined(separator: "\n")
    }

    private static func boundedPromptWithFinalInstruction(
        sections: [String],
        finalInstruction: String,
        maxCharacters: Int
    ) -> String {
        let prompt = (sections + [finalInstruction]).joined(separator: "\n\n")
        if prompt.count <= maxCharacters { return prompt }

        let suffix = "\n\n\(finalInstruction)"
        let headBudget = maxCharacters - suffix.count
        if headBudget <= truncationMarker.count + 16 {
            return boundedPromptText(prompt, characterLimit: maxCharacters)
        }

        let head = sections.joined(separator: "\n\n")
        return "\(boundedPromptText(head, characterLimit: headBudget))\(suffix)"
    }

    private static func boundedPromptText(_ value: String, characterLimit: Int) -> String {
        let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.count <= characterLimit { return text }
        if characterLimit <= truncationMarker.count {
            return String(truncationMarker.prefix(max(0, characterLimit)))
        }

        let marker = "\n\(truncationMarker)"
        let keepCount = max(0, characterLimit - marker.count)
        let prefix = String(text.prefix(keepCount))
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return "\(prefix)\(marker)"
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }

    private static func trimmingTrailingWhitespaceAndNewlines(_ value: String) -> String {
        var end = value.endIndex
        while end > value.startIndex {
            let previous = value.index(before: end)
            let isWhitespace = value[previous].unicodeScalars.allSatisfy {
                CharacterSet.whitespacesAndNewlines.contains($0)
            }
            if !isWhitespace { break }
            end = previous
        }
        return String(value[..<end])
    }
}

enum LoomDraftFromTag {
    struct Command: Equatable {
        let token: String
        let tag: String
        let label: String
        let kind: String?
    }

    struct TaggedCard: Equatable {
        let kind: String?
        let title: String?
        let body: String
        let source: String?
    }

    static func parseCommand(body: String) -> Command? {
        let pattern = #"(?im)(?:^|\n)\s*(/draft\s+from\s+#([A-Za-z0-9_-]+))"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(body.startIndex..<body.endIndex, in: body)
        guard
            let match = regex.firstMatch(in: body, range: range),
            let tokenRange = Range(match.range(at: 1), in: body),
            let tagRange = Range(match.range(at: 2), in: body)
        else { return nil }

        let tag = normalize(String(body[tagRange]))
        guard !tag.isEmpty else { return nil }
        let mapped = mappedKind(tag)
        return Command(
            token: String(body[tokenRange]),
            tag: tag,
            label: mapped?.label ?? "#\(tag)",
            kind: mapped?.kind
        )
    }

    static func promptLines(command: Command, cards: [TaggedCard]) -> [String] {
        cards
            .filter { matches($0, command: command) }
            .enumerated()
            .map { index, card in
                [
                    "\(index + 1). \(kindLabel(card.kind)): \(compact(card.title, maxLength: 80) ?? compact(card.body, maxLength: 80) ?? "Untitled card")",
                    compact(card.source).map { "source=\($0)" },
                    compact(card.body).map { "body=\($0)" }
                ]
                .compactMap { $0 }
                .joined(separator: " | ")
            }
    }

    static func buildPrompt(
        title: String,
        body: String,
        command: Command,
        cards: [TaggedCard]
    ) -> String {
        let cleanedTitle = clean(title) ?? "Untitled draft"
        let cleanedBody = clean(body) ?? "(empty draft)"
        let lines = promptLines(command: command, cards: cards)
        let taggedCards = lines.isEmpty
            ? "No draft cards matched \(command.label)."
            : lines.joined(separator: "\n")

        return [
            "You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.",
            "Draft from tag: \(command.label)",
            "Use the tagged draft cards as source material. Preserve the user voice. Do not invent source claims.",
            "Title:\n\(cleanedTitle)",
            "Current draft:\n\(cleanedBody)",
            "Tagged draft cards:\n\(taggedCards)",
            "Return only draft text that can be inserted into the body."
        ].joined(separator: "\n\n")
    }

    private static func matches(_ card: TaggedCard, command: Command) -> Bool {
        if let kind = command.kind, normalize(card.kind) == kind {
            return true
        }
        return hasHashtag(card.title, tag: command.tag) ||
            hasHashtag(card.body, tag: command.tag) ||
            hasHashtag(card.source, tag: command.tag)
    }

    private static func hasHashtag(_ value: String?, tag: String) -> Bool {
        guard let value else { return false }
        let escaped = NSRegularExpression.escapedPattern(for: tag)
        let pattern = #"(^|[^A-Za-z0-9_-])#\#(escaped)(?=$|[^A-Za-z0-9_-])"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return false
        }
        return regex.firstMatch(
            in: value,
            range: NSRange(value.startIndex..<value.endIndex, in: value)
        ) != nil
    }

    private static func mappedKind(_ tag: String) -> (kind: String, label: String)? {
        switch tag {
        case "thesis": return (kind: "thesis", label: "Thesis")
        case "counter": return (kind: "counter", label: "Counter")
        case "instance": return (kind: "instance", label: "Instance")
        case "question": return (kind: "question", label: "Question")
        case "unclear": return (kind: "fog", label: "Unclear")
        case "fog": return (kind: "fog", label: "Unclear")
        case "connection": return (kind: "weft", label: "Connection")
        case "weft": return (kind: "weft", label: "Connection")
        case "sketch": return (kind: "sketch", label: "Sketch")
        default: return nil
        }
    }

    private static func kindLabel(_ kind: String?) -> String {
        switch kind {
        case "thesis": return "Thesis"
        case "counter": return "Counter"
        case "instance": return "Instance"
        case "question": return "Question"
        case "fog": return "Unclear"
        case "weft": return "Connection"
        case "sketch": return "Sketch"
        default: return "Card"
        }
    }

    private static func compact(_ value: String?, maxLength: Int = 600) -> String? {
        guard let cleaned = clean(value) else { return nil }
        let compacted = cleaned.replacingOccurrences(
            of: #"\s+"#,
            with: " ",
            options: .regularExpression
        )
        return compacted.count > maxLength
            ? "\(compacted.prefix(maxLength - 1))..."
            : compacted
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }

    private static func normalize(_ value: String?) -> String {
        (value ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "^#", with: "", options: .regularExpression)
            .lowercased()
    }
}

struct LoomDraftInlineEditDiffHunk: Equatable {
    let kind: String
    let text: String
}

enum LoomDraftInlineEdit {
    private static let truncationMarker = "[truncated for provider context]"
    private static let maxPromptCharacters = 6000
    private static let titleCharacterLimit = 240
    private static let bodyCharacterLimit = 1800
    private static let selectedTextCharacterLimit = 1000
    private static let referenceLineCharacterLimit = 700
    private static let referenceTotalCharacterLimit = 1800
    private static let inlineLineCharacterLimit = 500
    private static let inlineTotalCharacterLimit = 1000
    private static let corpusLineCharacterLimit = 500
    private static let corpusTotalCharacterLimit = 1000

    static func buildPrompt(
        title: String,
        body: String,
        selectedText: String,
        references: [LoomDraftReference],
        corpusHits: [LoomDraftCorpusHit] = []
    ) -> String {
        let cleanedTitle = boundedPromptText(clean(title) ?? "Untitled draft", characterLimit: titleCharacterLimit)
        let cleanedBody = boundedPromptText(clean(body) ?? "(empty draft)", characterLimit: bodyCharacterLimit)
        let cleanedSelectedText = boundedPromptText(clean(selectedText) ?? "(empty selection)", characterLimit: selectedTextCharacterLimit)
        let referenceText = references.isEmpty
            ? "No references attached."
            : boundedPromptLines(
                references.enumerated().map { index, reference in
                    referencePromptLine(reference, index: index)
                },
                lineLimit: referenceLineCharacterLimit,
                totalLimit: referenceTotalCharacterLimit
            )
        let inlineReferenceLines = LoomDraftInlineReferenceParser.promptLines(
            body: body,
            references: references,
            corpusHits: corpusHits
        )
        let inlineReferenceText = inlineReferenceLines.isEmpty
            ? "No inline @references in the draft."
            : boundedPromptLines(
                inlineReferenceLines,
                lineLimit: inlineLineCharacterLimit,
                totalLimit: inlineTotalCharacterLimit
            )
        let corpusText = corpusHits.isEmpty
            ? "No corpus context selected."
            : boundedPromptLines(
                corpusHits.enumerated().map { index, hit in
                    corpusPromptLine(hit, index: index)
                },
                lineLimit: corpusLineCharacterLimit,
                totalLimit: corpusTotalCharacterLimit
            )

        return boundedPromptWithFinalInstruction(
            sections: [
                "You are Loom Draft, a writing partner inside a personal source-grounded drafting surface.",
                "Inline edit request:",
                "Rewrite only the selected passage. Preserve the user voice. Use attached references and corpus context only when relevant. Do not invent source claims.",
                "Title:\n\(cleanedTitle)",
                "Current draft:\n\(cleanedBody)",
                "Selected passage:\n\(cleanedSelectedText)",
                "Attached references:\n\(referenceText)",
                "Inline @references:\n\(inlineReferenceText)",
                "Corpus context:\n\(corpusText)"
            ],
            finalInstruction: "Return only the replacement text for the selected passage.",
            maxCharacters: maxPromptCharacters
        )
    }

    static func apply(
        body: String,
        range: NSRange,
        original: String,
        replacement: String
    ) -> String {
        guard let next = clean(replacement) else { return body }
        guard range.location != NSNotFound, range.location >= 0, range.length > 0 else { return body }
        let source = body as NSString
        guard NSMaxRange(range) <= source.length else { return body }
        guard source.substring(with: range) == original else { return body }
        return source.replacingCharacters(in: range, with: next)
    }

    static func diffHunks(original: String, replacement: String) -> [LoomDraftInlineEditDiffHunk] {
        guard let next = clean(replacement) else { return [] }
        let originalLines = diffLines(original)
        let replacementLines = diffLines(next)
        if originalLines.isEmpty && replacementLines.isEmpty { return [] }

        var table = Array(
            repeating: Array(repeating: 0, count: replacementLines.count + 1),
            count: originalLines.count + 1
        )

        if !originalLines.isEmpty && !replacementLines.isEmpty {
            for i in stride(from: originalLines.count - 1, through: 0, by: -1) {
                for j in stride(from: replacementLines.count - 1, through: 0, by: -1) {
                    if originalLines[i] == replacementLines[j] {
                        table[i][j] = table[i + 1][j + 1] + 1
                    } else {
                        table[i][j] = max(table[i + 1][j], table[i][j + 1])
                    }
                }
            }
        }

        var hunks: [LoomDraftInlineEditDiffHunk] = []
        var i = 0
        var j = 0
        while i < originalLines.count && j < replacementLines.count {
            if originalLines[i] == replacementLines[j] {
                hunks.append(LoomDraftInlineEditDiffHunk(kind: "unchanged", text: originalLines[i]))
                i += 1
                j += 1
            } else if table[i + 1][j] >= table[i][j + 1] {
                hunks.append(LoomDraftInlineEditDiffHunk(kind: "removed", text: originalLines[i]))
                i += 1
            } else {
                hunks.append(LoomDraftInlineEditDiffHunk(kind: "added", text: replacementLines[j]))
                j += 1
            }
        }
        while i < originalLines.count {
            hunks.append(LoomDraftInlineEditDiffHunk(kind: "removed", text: originalLines[i]))
            i += 1
        }
        while j < replacementLines.count {
            hunks.append(LoomDraftInlineEditDiffHunk(kind: "added", text: replacementLines[j]))
            j += 1
        }
        return hunks
    }

    private static func referencePromptLine(_ reference: LoomDraftReference, index: Int) -> String {
        [
            "\(index + 1). \(referenceKindLabel(reference)): \(reference.label)",
            clean(reference.sourceTitle).map { "source=\($0)" },
            clean(reference.href).map { "href=\($0)" },
            clean(reference.category).map { "category=\($0)" },
            clean(reference.sourcePath).map { "sourcePath=\($0)" },
            clean(reference.capturedAt).map { "capturedAt=\($0)" },
            clean(reference.excerpt).map { "excerpt=\($0)" },
            LoomDraftQuoteFormatter.artifactStateLabel(reference.artifactState).map { "artifactState=\($0)" },
            LoomDraftQuoteFormatter.artifactStatePromptData(reference.artifactState).map { "artifactStateData=\($0)" }
        ]
        .compactMap { $0 }
        .joined(separator: " | ")
    }

    private static func corpusPromptLine(_ hit: LoomDraftCorpusHit, index: Int) -> String {
        [
            "\(index + 1). Corpus: \(hit.title)",
            clean(hit.category).map { "category=\($0)" },
            clean(hit.href).map { "href=\($0)" },
            clean(hit.sourcePath).map { "sourcePath=\($0)" },
            clean(hit.excerpt).map { "excerpt=\($0.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression))" },
            LoomDraftQuoteFormatter.artifactStateLabel(hit.artifactState).map { "artifactState=\($0)" },
            LoomDraftQuoteFormatter.artifactStatePromptData(hit.artifactState).map { "artifactStateData=\($0)" },
            hit.score.map { "score=\(String(format: "%.2f", $0))" }
        ]
        .compactMap { $0 }
        .joined(separator: " | ")
    }

    private static func referenceKindLabel(_ reference: LoomDraftReference) -> String {
        if reference.kind == "capture" { return "Capture" }
        if reference.kind == "artifact-state" { return "Artifact state" }
        if reference.kind == "url" { return "URL" }
        return "Source"
    }

    private static func boundedPromptLines(
        _ lines: [String],
        lineLimit: Int,
        totalLimit: Int
    ) -> String {
        var selected: [String] = []
        var used = 0
        var omitted = false

        for line in lines {
            let compactLine = line.replacingOccurrences(
                of: #"\s+"#,
                with: " ",
                options: .regularExpression
            )
            let next = boundedPromptText(compactLine, characterLimit: lineLimit)
            let separator = selected.isEmpty ? 0 : 1
            if used + separator + next.count > totalLimit {
                let remaining = totalLimit - used - separator
                if remaining > truncationMarker.count + 16 {
                    let bounded = boundedPromptText(next, characterLimit: remaining)
                    selected.append(bounded)
                    used += separator + bounded.count
                }
                omitted = true
                break
            }
            selected.append(next)
            used += separator + next.count
        }

        if omitted && !selected.joined(separator: "\n").contains(truncationMarker) {
            let separator = selected.isEmpty ? 0 : 1
            if used + separator + truncationMarker.count <= totalLimit {
                selected.append(truncationMarker)
            }
        }

        return selected.joined(separator: "\n")
    }

    private static func boundedPromptWithFinalInstruction(
        sections: [String],
        finalInstruction: String,
        maxCharacters: Int
    ) -> String {
        let prompt = (sections + [finalInstruction]).joined(separator: "\n\n")
        if prompt.count <= maxCharacters { return prompt }

        let suffix = "\n\n\(finalInstruction)"
        let headBudget = maxCharacters - suffix.count
        if headBudget <= truncationMarker.count + 16 {
            return boundedPromptText(prompt, characterLimit: maxCharacters)
        }

        let head = sections.joined(separator: "\n\n")
        return "\(boundedPromptText(head, characterLimit: headBudget))\(suffix)"
    }

    private static func boundedPromptText(_ value: String, characterLimit: Int) -> String {
        let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.count <= characterLimit { return text }
        if characterLimit <= truncationMarker.count {
            return String(truncationMarker.prefix(max(0, characterLimit)))
        }

        let marker = "\n\(truncationMarker)"
        let keepCount = max(0, characterLimit - marker.count)
        let prefix = String(text.prefix(keepCount))
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return "\(prefix)\(marker)"
    }

    private static func clean(_ value: String?) -> String? {
        LoomDraftQuoteFormatter.clean(value)
    }

    private static func diffLines(_ value: String) -> [String] {
        let normalized = value
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return normalized.isEmpty ? [] : normalized.components(separatedBy: "\n")
    }
}

