import SwiftUI
import AppKit

// Extracted 2026-07-08 (partition batch 2) from CapturesView.swift: the
// capture-index model that the LIVE loom:// scheme handler (and its green
// tests) parse Loom.md '## Notes' blocks with. Pure move, no changes.
// MARK: Model

/// One parsed capture entry from a per-folder Loom.md `## Notes` block.
struct CaptureEntry: Identifiable, Hashable {
    enum Kind: String, CaseIterable, Identifiable {
        case inbox, web, page, passage, other
        var id: String { rawValue }
        var label: String {
            switch self {
            case .inbox:   return "Inbox"
            case .web:     return "Web"
            case .page:    return "Page"
            case .passage: return "Passage"
            case .other:   return "Other"
            }
        }
        var icon: String {
            switch self {
            case .inbox:   return "tray"
            case .web:     return "globe"
            case .page:    return "doc.text"
            case .passage: return "quote.bubble"
            case .other:   return "doc"
            }
        }
    }
    let id: UUID
    let rootID: UUID
    let rootLabel: String
    let kind: Kind
    let subPath: String
    /// Best-effort domain extracted from a `Web/<domain>/` sub-path,
    /// or empty string for non-web captures.
    let domain: String
    let title: String
    let eyebrow: String
    let snippet: String
    let timestamp: Date?
    /// File URL of the Loom.md the entry lives in. Reveal/open uses
    /// this directly; we intentionally don't index entry-line offsets
    /// (a fragile thing to maintain across edits).
    let fileURL: URL
    /// Phase D — newest `Loom-snapshot-*.html` filename in the same
    /// directory as `fileURL`, if any. nil when the directory has no
    /// snapshot. Surfaces as a "Snapshot" affordance in the captures
    /// landing alongside the Reader link.
    var snapshotFilename: String? = nil
}

/// Reads every `Loom.md` under every active root and produces a
/// flat list of `CaptureEntry`. Synchronous — file counts are small
/// (one Loom.md per anchor folder), and the view triggers reload on
/// demand rather than on every render.
enum CapturesIndex {
    static func loadAll() -> [CaptureEntry] {
        let roots = rootsForCaptureScan()
        var entries: [CaptureEntry] = []
        for root in roots {
            entries.append(contentsOf: scanRoot(root))
        }
        // Newest first. Entries with no parsable timestamp sink to
        // the bottom — better than scrambling the top with unknowns.
        entries.sort { lhs, rhs in
            switch (lhs.timestamp, rhs.timestamp) {
            case let (l?, r?): return l > r
            case (_?, nil):    return true
            case (nil, _?):    return false
            case (nil, nil):   return false
            }
        }
        return entries
    }

    /// Prefer registered roots, but never let the captures surface go
    /// blank just because the native shell temporarily cannot read the
    /// root registry. The fallback scans only Loom's managed file store,
    /// never the user's authoritative source folders.
    static func rootsForCaptureScan(fileManager: FileManager = .default) -> [ContentRoot] {
        let stored = ContentRootStore.loadAll()
        if !stored.isEmpty { return stored }
        return storeOnlyFallbackRoots(fileManager: fileManager)
    }

    private static func storeOnlyFallbackRoots(fileManager: FileManager) -> [ContentRoot] {
        let storeRoot = LoomFileStore.rootURL
        guard let contents = try? fileManager.contentsOfDirectory(
            at: storeRoot,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else { return [] }

        return contents.compactMap { dir -> ContentRoot? in
            guard (try? dir.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true,
                  let id = UUID(uuidString: dir.lastPathComponent),
                  containsLoomMarkdown(in: dir, fileManager: fileManager)
            else { return nil }
            let now = Date()
            return ContentRoot(
                id: id,
                displayName: fallbackRootDisplayName(for: dir, id: id),
                description: "",
                externalFolderBookmark: nil,
                addedAt: now,
                updatedAt: now
            )
        }
    }

    private static func containsLoomMarkdown(in dir: URL, fileManager: FileManager) -> Bool {
        if fileManager.fileExists(atPath: dir.appendingPathComponent("Loom.md").path) {
            return true
        }
        guard let walker = fileManager.enumerator(
            at: dir,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else { return false }
        for case let url as URL in walker where url.lastPathComponent == "Loom.md" {
            return true
        }
        return false
    }

    private static func fallbackRootDisplayName(for dir: URL, id: UUID) -> String {
        let loomMD = dir.appendingPathComponent("Loom.md")
        if let raw = try? String(contentsOf: loomMD, encoding: .utf8),
           let title = raw
            .components(separatedBy: "\n")
            .first(where: { $0.hasPrefix("# ") })?
            .dropFirst(2)
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !title.isEmpty {
            return title
        }
        return "Loom Data \(id.uuidString.prefix(8))"
    }

    private static func scanRoot(_ root: ContentRoot) -> [CaptureEntry] {
        let pageDir = LoomFileStore.pageDirectoryURL(for: root.id)
        let fm = FileManager.default
        guard let enumerator = fm.enumerator(
            at: pageDir,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else { return [] }

        var out: [CaptureEntry] = []
        for case let url as URL in enumerator {
            guard url.lastPathComponent == "Loom.md" else { continue }
            guard let raw = try? String(contentsOf: url, encoding: .utf8) else { continue }
            let subPath = relativeSubPath(of: url, under: pageDir)
            let kind = inferKind(subPath: subPath)
            let domain = inferDomain(subPath: subPath, kind: kind)
            let snapshotFilename = newestSnapshotFilename(in: url.deletingLastPathComponent())
            var parsed = parseEntries(
                from: raw,
                rootID: root.id,
                rootLabel: root.displayName,
                kind: kind,
                subPath: subPath,
                domain: domain,
                fileURL: url
            )
            if let snap = snapshotFilename {
                for i in parsed.indices {
                    parsed[i].snapshotFilename = snap
                }
            }
            out.append(contentsOf: parsed)
        }
        return out
    }

    /// Newest `Loom-snapshot-*.html` filename in a directory, or nil.
    /// Matches `LoomURLSchemeHandler.newestSnapshotFilename` — keeping
    /// both copies parallel for now to avoid introducing a cross-file
    /// dependency just for this helper.
    private static func newestSnapshotFilename(in dir: URL) -> String? {
        let fm = FileManager.default
        guard let contents = try? fm.contentsOfDirectory(atPath: dir.path) else {
            return nil
        }
        let snaps = contents
            .filter { $0.hasPrefix("Loom-snapshot-") && $0.hasSuffix(".html") }
            .sorted()
        return snaps.last
    }

    private static func relativeSubPath(of file: URL, under base: URL) -> String {
        let filePath = file.standardizedFileURL.path
        let basePath = base.standardizedFileURL.path
        guard filePath.hasPrefix(basePath) else { return "" }
        let stripped = String(filePath.dropFirst(basePath.count))
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        // Drop trailing "/Loom.md".
        if stripped.hasSuffix("/Loom.md") {
            return String(stripped.dropLast("/Loom.md".count))
        }
        if stripped == "Loom.md" { return "" }
        return stripped
    }

    /// Sub-path layout (set by `LoomFileStore` + `CaptureWriter`):
    ///   - `""`               → root page Loom.md
    ///   - `"sub/Inbox"`      → quick-capture inbox
    ///   - `"sub/Web/<host>"` → web bookmarklet capture
    ///   - `"sub/<other>"`    → folder page (typically a folder home Loom.md)
    private static func inferKind(subPath: String) -> CaptureEntry.Kind {
        if subPath == "sub/Inbox" || subPath == "Inbox" { return .inbox }
        if subPath.hasPrefix("sub/Web/") { return .web }
        if subPath.hasPrefix("sub/") { return .page }
        if subPath.isEmpty { return .page }
        return .other
    }

    private static func inferDomain(subPath: String, kind: CaptureEntry.Kind) -> String {
        guard kind == .web else { return "" }
        // `sub/Web/<host>` → `<host>`
        let parts = subPath.split(separator: "/").map(String.init)
        return parts.count >= 3 ? parts[2] : ""
    }

    /// Parse the `## Notes` block of a Loom.md into individual entries.
    /// Each entry begins with `### <heading>` and runs until the next
    /// `### ` or end of section. We extract heading, eyebrow line (the
    /// `*…*` italic line right after), and a snippet of body.
    private static func parseEntries(
        from source: String,
        rootID: UUID,
        rootLabel: String,
        kind: CaptureEntry.Kind,
        subPath: String,
        domain: String,
        fileURL: URL
    ) -> [CaptureEntry] {
        // Locate `## Notes` body span.
        guard let notesRange = source.range(of: "\n## Notes")
            ?? (source.hasPrefix("## Notes") ? source.range(of: "## Notes") : nil)
        else { return [] }
        let body = source[notesRange.upperBound...]

        // Split on `### ` headings.
        let lines = body.components(separatedBy: "\n")
        var entries: [CaptureEntry] = []
        var currentHeading: String? = nil
        var currentBody: [String] = []
        let tsRegex = try? NSRegularExpression(pattern: #"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}"#)
        let formatter: DateFormatter = {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd HH:mm"; return f
        }()

        func flush() {
            guard let heading = currentHeading else {
                currentBody.removeAll()
                return
            }
            let blob = currentBody.joined(separator: "\n")
              let trimmed = blob.trimmingCharacters(in: .whitespacesAndNewlines)
              guard !trimmed.isEmpty else {
                  currentBody.removeAll()
                  return
              }
            // Extract eyebrow (first `*…*` line).
            var eyebrow = ""
            for line in trimmed.split(separator: "\n", maxSplits: 4, omittingEmptySubsequences: true) {
                let l = String(line).trimmingCharacters(in: .whitespaces)
                if l.hasPrefix("*") && l.hasSuffix("*") {
                    eyebrow = String(l.dropFirst().dropLast())
                    break
                }
            }
            // Snippet: strip eyebrow + leading blank lines, take ~200 chars.
            var snippetSrc = trimmed
            if !eyebrow.isEmpty {
                let eyebrowLine = "*\(eyebrow)*"
                if let r = snippetSrc.range(of: eyebrowLine) {
                    snippetSrc = String(snippetSrc[r.upperBound...])
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }
            let snippet: String = {
                // Strip markdown syntax for the row preview — the list
                // is a glance surface, not a code view. Render-fidelity
                // is what the in-Loom reader sheet (Phase C M1) is for.
                let plain = stripMarkdownChrome(snippetSrc)
                let collapsed = plain
                    .replacingOccurrences(of: "\n", with: " ")
                    .replacingOccurrences(of: "  ", with: " ")
                    .trimmingCharacters(in: .whitespaces)
                if collapsed.count <= 220 { return collapsed }
                let cut = collapsed.index(collapsed.startIndex, offsetBy: 220)
                return String(collapsed[..<cut]) + "…"
            }()
            // Pull a timestamp out of eyebrow if present.
            var ts: Date? = nil
            if let regex = tsRegex {
                let ns = eyebrow as NSString
                if let m = regex.firstMatch(in: eyebrow, range: NSRange(location: 0, length: ns.length)) {
                    ts = formatter.date(from: ns.substring(with: m.range))
                }
            }
            entries.append(CaptureEntry(
                id: UUID(),
                rootID: rootID,
                rootLabel: rootLabel,
                kind: kind,
                subPath: subPath,
                domain: domain,
                title: heading,
                eyebrow: eyebrow,
                snippet: snippet,
                timestamp: ts,
                fileURL: fileURL
            ))
            currentBody.removeAll()
        }

        for (idx, line) in lines.enumerated() {
            if isCaptureHeadingLine(lines, at: idx) {
                flush()
                currentHeading = String(line.dropFirst(4)).trimmingCharacters(in: .whitespaces)
            } else if currentHeading != nil {
                currentBody.append(line)
            }
        }
        flush()
        return entries
    }

    static func isCaptureHeadingLine(_ lines: [String], at index: Int) -> Bool {
        guard index >= 0, index < lines.count, lines[index].hasPrefix("### ") else {
            return false
        }
        let lookahead = min(index + 6, lines.count)
        guard index + 1 < lookahead else { return false }
        for j in (index + 1)..<lookahead {
            let trimmed = lines[j].trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty { continue }
            return looksLikeCaptureEyebrow(trimmed)
        }
        return false
    }

    static func looksLikeCaptureEyebrow(_ line: String) -> Bool {
        guard line.hasPrefix("*"), line.hasSuffix("*") else { return false }
        let inner = String(line.dropFirst().dropLast())
        return inner.range(
            of: #"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}"#,
            options: .regularExpression
        ) != nil
    }

    /// Convert markdown source to plain-text for the captures list
    /// snippet. Drops link/emphasis/code syntax but preserves the
    /// readable words. Conservative — only strips what we know.
    static func stripMarkdownChrome(_ s: String) -> String {
        var t = s
        // Hidden Loom-owned metadata belongs to the capture file, never to
        // the glance preview. This catches diagnostics, CaptureAST sidecar
        // pointers, and provider markers before markdown flattening.
        t = t.replacingOccurrences(
            of: #"(?s)<!--.*?-->"#,
            with: "",
            options: .regularExpression
        )
        // Drop the writer-injected "From [title](url)" prefix that
        // every web capture starts with. The title is already the
        // row heading; repeating it as a sentence is just chrome.
        if let m = t.range(of: #"^From \[[^\]]+\]\([^)]+\)\s*"#, options: [.regularExpression, .anchored]) {
            t.removeSubrange(m)
        }
        // `[text](url)` → `text`
        t = t.replacingOccurrences(
            of: #"\[([^\]]+)\]\(([^)]+)\)"#,
            with: "$1",
            options: .regularExpression
        )
        // `_text_` (italic / domain wrap) → `text`. Avoid touching `__bold__`
        // by requiring single underscore + non-space neighbors.
        t = t.replacingOccurrences(
            of: #"(?<!\w)_([^_\n]+?)_(?!\w)"#,
            with: "$1",
            options: .regularExpression
        )
        // `**bold**` / `*italic*` → strip wrappers
        t = t.replacingOccurrences(
            of: #"\*\*([^*\n]+?)\*\*"#,
            with: "$1",
            options: .regularExpression
        )
        t = t.replacingOccurrences(
            of: #"(?<!\*)\*([^*\n]+?)\*(?!\*)"#,
            with: "$1",
            options: .regularExpression
        )
        // Inline code: `code` → code
        t = t.replacingOccurrences(
            of: #"`([^`\n]+?)`"#,
            with: "$1",
            options: .regularExpression
        )
        // Heading prefixes at line start.
        t = t.replacingOccurrences(
            of: #"^#+\s+"#,
            with: "",
            options: [.regularExpression, .anchored]
        )
        return t
    }

    /// Removes a `### heading` block (heading + body until next `### `
    /// or EOF) from the entry's Loom.md. Match key is heading title +
    /// nearby eyebrow line — heading alone may collide if the same
    /// page was captured twice; the eyebrow's clipboard timestamp
    /// dedupes. Returns true iff the file was modified.
    @discardableResult
    static func delete(_ entry: CaptureEntry) throws -> Bool {
        let url = entry.fileURL
        let source = try String(contentsOf: url, encoding: .utf8)
        var lines = source.components(separatedBy: "\n")
        let headingNeedle = "### " + entry.title
        let eyebrowNeedle = entry.eyebrow.isEmpty ? nil : "*\(entry.eyebrow)*"

        var startIdx: Int? = nil
        var i = 0
        while i < lines.count {
            if lines[i] == headingNeedle, Self.isCaptureHeadingLine(lines, at: i) {
                if let needle = eyebrowNeedle {
                    var matched = false
                    let lookahead = min(i + 6, lines.count)
                    for j in (i + 1)..<lookahead {
                        if lines[j].trimmingCharacters(in: .whitespaces) == needle {
                            matched = true
                            break
                        }
                    }
                    if !matched { i += 1; continue }
                }
                startIdx = i
                break
            }
            i += 1
        }
        guard let start = startIdx else { return false }

        var end = lines.count
        for k in (start + 1)..<lines.count {
            if Self.isCaptureHeadingLine(lines, at: k) { end = k; break }
        }
        // Trim trailing blank lines so we don't leave a widening gap
        // each time a delete happens.
        while end > start + 1 && lines[end - 1].isEmpty { end -= 1 }

        let removedBlock = lines[start..<end].joined(separator: "\n")
        lines.removeSubrange(start..<end)
        let rewritten = lines.joined(separator: "\n")
        try rewritten.write(to: url, atomically: true, encoding: .utf8)
        try cleanupOwnedSidecars(
            removedBlock: removedBlock,
            remainingSource: rewritten,
            directoryURL: url.deletingLastPathComponent()
        )
        return true
    }

    /// Deletes the sidecar files the removed block owned — its CaptureAST
    /// JSON, the snapshot(s) sharing that AST's timestamp, and media it
    /// referenced — but never a file the remaining markdown still
    /// mentions. Snapshot ownership comes from the AST timestamp alone:
    /// `CaptureEntry.snapshotFilename` is "newest in directory" and may
    /// point at another capture's snapshot.
    private static func cleanupOwnedSidecars(
        removedBlock: String,
        remainingSource: String,
        directoryURL: URL,
        fileManager: FileManager = .default
    ) throws {
        let filenames = captureSidecarFilenames(
            removedBlock: removedBlock,
            directoryURL: directoryURL,
            fileManager: fileManager
        )
        for filename in filenames where !remainingSource.contains(filename) {
            let url = directoryURL.appendingPathComponent(filename)
            if fileManager.fileExists(atPath: url.path) {
                try fileManager.removeItem(at: url)
            }
        }
    }

    private static func captureSidecarFilenames(
        removedBlock: String,
        directoryURL: URL,
        fileManager: FileManager
    ) -> Set<String> {
        var filenames = Set<String>()

        for pattern in [
            #"\bLoom-media-[A-Za-z0-9._-]+\.[A-Za-z0-9]+\b"#,
            #"\bLoom-capture-ast-[A-Za-z0-9._-]+\.json\b"#,
            #"\bLoom-snapshot-[A-Za-z0-9._-]+\.html\b"#,
        ] {
            filenames.formUnion(captureSidecarMatches(in: removedBlock, pattern: pattern))
        }

        if let astFilename = extractCaptureASTFilename(from: removedBlock),
           isSafeCaptureSidecarFilename(astFilename) {
            filenames.insert(astFilename)
            filenames.formUnion(snapshotFilenames(
                matchingCaptureASTFilename: astFilename,
                in: directoryURL,
                fileManager: fileManager
            ))
        }

        return Set(filenames.filter(isSafeCaptureSidecarFilename))
    }

    private static func captureSidecarMatches(in source: String, pattern: String) -> Set<String> {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let ns = source as NSString
        return Set(regex.matches(in: source, range: NSRange(location: 0, length: ns.length)).map {
            ns.substring(with: $0.range)
        })
    }

    private static func extractCaptureASTFilename(from body: String) -> String? {
        let pattern = #"<!--\s*loom-capture-ast:\s*([^<>\s]+)\s*-->"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let ns = body as NSString
        let range = NSRange(location: 0, length: ns.length)
        guard let match = regex.firstMatch(in: body, range: range),
              match.numberOfRanges >= 2 else {
            return nil
        }
        let filename = ns.substring(with: match.range(at: 1))
        guard filename.hasPrefix("Loom-capture-ast-"),
              filename.hasSuffix(".json"),
              !filename.contains("/") else {
            return nil
        }
        return filename
    }

    /// Snapshots written for a capture share the AST filename's
    /// `YYYYMMDD-HHMMSS` stamp, so the stamp is the ownership key.
    private static func snapshotFilenames(
        matchingCaptureASTFilename filename: String,
        in dir: URL,
        fileManager: FileManager
    ) -> [String] {
        let pattern = #"^Loom-capture-ast-(\d{8}-\d{6})-"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let ns = filename as NSString
        guard let match = regex.firstMatch(in: filename, range: NSRange(location: 0, length: ns.length)),
              match.numberOfRanges >= 2 else {
            return []
        }
        let prefix = "Loom-snapshot-\(ns.substring(with: match.range(at: 1)))-"
        guard let contents = try? fileManager.contentsOfDirectory(atPath: dir.path) else {
            return []
        }
        return contents
            .filter { $0.hasPrefix(prefix) && $0.hasSuffix(".html") }
            .sorted()
    }

    private static func isSafeCaptureSidecarFilename(_ filename: String) -> Bool {
        guard !filename.contains("/"), !filename.contains("..") else { return false }
        return (
            (filename.hasPrefix("Loom-media-") && filename.range(of: #"\.[A-Za-z0-9]+$"#, options: .regularExpression) != nil) ||
            (filename.hasPrefix("Loom-capture-ast-") && filename.hasSuffix(".json")) ||
            (filename.hasPrefix("Loom-snapshot-") && filename.hasSuffix(".html"))
        )
    }
}
