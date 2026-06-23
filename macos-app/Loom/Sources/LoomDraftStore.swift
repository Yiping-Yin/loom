import Foundation

struct LoomDraftArtifactState: Codable, Equatable, Hashable {
    let targetId: String
    let kind: String?
    let label: String?
    let state: String?
    let stateLabel: String?
}

struct LoomDraftReference: Codable, Equatable, Identifiable {
    var id: String { href }
    let label: String
    let href: String
    let kind: String?
    let sourceTitle: String?
    let category: String?
    let sourcePath: String?
    let excerpt: String?
    let capturedAt: String?
    let artifactState: LoomDraftArtifactState?

    init(
        label: String,
        href: String,
        kind: String? = nil,
        sourceTitle: String? = nil,
        category: String? = nil,
        sourcePath: String? = nil,
        excerpt: String? = nil,
        capturedAt: String? = nil,
        artifactState: LoomDraftArtifactState? = nil
    ) {
        self.label = label
        self.href = href
        self.kind = kind
        self.sourceTitle = sourceTitle
        self.category = category
        self.sourcePath = sourcePath
        self.excerpt = excerpt
        self.capturedAt = capturedAt
        self.artifactState = artifactState
    }
}

struct LoomDraftRecord: Codable, Equatable, Identifiable {
    let id: UUID
    var title: String
    var body: String
    var references: [LoomDraftReference]
    let createdAt: Date
    var updatedAt: Date
    // Curation flag for the web "Include in Digital Me" toggle. Optional with a
    // default so existing drafts.json (without the key) decodes cleanly and the
    // memberwise init stays backward-compatible.
    var includedInDigitalMe: Bool? = nil
}

final class LoomDraftStore {
    private static let externalSidecarEditThreshold: TimeInterval = 1

    private let fileURL: URL
    private let fileManager: FileManager
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(
        rootURL: URL = URL(fileURLWithPath: LoomRuntimePaths.userDataRoot()),
        fileManager: FileManager = .default
    ) {
        self.fileURL = rootURL
            .appendingPathComponent("Drafts", isDirectory: true)
            .appendingPathComponent("drafts.json", isDirectory: false)
        self.fileManager = fileManager
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }

    func list() throws -> [LoomDraftRecord] {
        guard fileManager.fileExists(atPath: fileURL.path) else {
            return try recoverMarkdownSidecars()
        }
        do {
            let data = try Data(contentsOf: fileURL)
            let drafts = try decoder.decode([LoomDraftRecord].self, from: data)
                .sorted { $0.updatedAt > $1.updatedAt }
            return try mergeNewerMarkdownSidecars(into: drafts)
        } catch {
            let recovered = try recoverMarkdownSidecars()
            if !recovered.isEmpty { return recovered }
            throw error
        }
    }

    func create(
        title: String = "Untitled draft",
        body: String = "",
        references: [LoomDraftReference] = [],
        now: Date = Date()
    ) throws -> LoomDraftRecord {
        var drafts = try list()
        let draft = LoomDraftRecord(
            id: UUID(),
            title: normalizedTitle(title),
            body: body,
            references: references,
            createdAt: now,
            updatedAt: now
        )
        drafts.insert(draft, at: 0)
        try saveAll(drafts)
        return draft
    }

    func update(
        _ draft: LoomDraftRecord,
        title: String,
        body: String,
        references: [LoomDraftReference]? = nil,
        includedInDigitalMe: Bool? = nil,
        now: Date = Date()
    ) throws -> LoomDraftRecord {
        var drafts = try list()
        guard let index = drafts.firstIndex(where: { $0.id == draft.id }) else {
            throw CocoaError(.fileNoSuchFile)
        }
        var next = draft
        next.title = normalizedTitle(title)
        next.body = body
        next.references = references ?? draft.references
        next.includedInDigitalMe = includedInDigitalMe ?? draft.includedInDigitalMe
        next.updatedAt = now
        drafts[index] = next
        try saveAll(drafts)
        return next
    }

    func attachReference(
        _ reference: LoomDraftReference,
        now: Date = Date()
    ) throws -> LoomDraftRecord {
        var drafts = try list()
        guard var draft = drafts.first else {
            return try create(references: [reference], now: now)
        }

        draft.references = Self.mergedReferences(draft.references, adding: reference)
        draft.updatedAt = now
        if let index = drafts.firstIndex(where: { $0.id == draft.id }) {
            drafts[index] = draft
        } else {
            drafts.insert(draft, at: 0)
        }
        try saveAll(drafts)
        return draft
    }

    func removeReference(
        href: String,
        from draft: LoomDraftRecord,
        now: Date = Date()
    ) throws -> LoomDraftRecord {
        var drafts = try list()
        guard let index = drafts.firstIndex(where: { $0.id == draft.id }) else {
            throw CocoaError(.fileNoSuchFile)
        }
        var next = drafts[index]
        let originalCount = next.references.count
        next.references.removeAll { $0.href == href }
        guard next.references.count != originalCount else {
            return next
        }
        next.updatedAt = now
        drafts[index] = next
        try saveAll(drafts)
        return next
    }

    private func saveAll(_ drafts: [LoomDraftRecord]) throws {
        try fileManager.createDirectory(
            at: fileURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let sortedDrafts = drafts.sorted { $0.updatedAt > $1.updatedAt }
        let data = try encoder.encode(sortedDrafts)
        try data.write(to: fileURL, options: [.atomic])
        try saveMarkdownSidecars(for: sortedDrafts)
    }

    private func saveMarkdownSidecars(for drafts: [LoomDraftRecord]) throws {
        for draft in drafts {
            try markdown(for: draft).write(to: markdownURL(for: draft.id), atomically: true, encoding: .utf8)
        }
    }

    private func recoverMarkdownSidecars() throws -> [LoomDraftRecord] {
        try markdownSidecarURLs()
            .compactMap { markdownURL -> LoomDraftRecord? in
                guard let id = UUID(uuidString: markdownURL.deletingPathExtension().lastPathComponent) else {
                    return nil
                }
                return try? draftRecord(fromMarkdownSidecar: markdownURL, id: id)
            }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    private func mergeNewerMarkdownSidecars(into drafts: [LoomDraftRecord]) throws -> [LoomDraftRecord] {
        guard let indexModifiedAt = try? fileURL.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate else {
            return drafts
        }

        var knownDraftIDs = Set(drafts.map(\.id))
        var mergedDrafts = try drafts.map { draft in
            try draftMergedWithNewerSidecar(draft, indexModifiedAt: indexModifiedAt)
        }

        let sidecarOnlyDrafts = try markdownSidecarURLs().compactMap { markdownURL -> LoomDraftRecord? in
            guard let id = UUID(uuidString: markdownURL.deletingPathExtension().lastPathComponent),
                  !knownDraftIDs.contains(id),
                  sidecarModifiedAfterIndex(markdownURL, indexModifiedAt: indexModifiedAt) != nil,
                  let draft = try? draftRecord(fromMarkdownSidecar: markdownURL, id: id) else {
                return nil
            }
            knownDraftIDs.insert(id)
            return draft
        }

        mergedDrafts.append(contentsOf: sidecarOnlyDrafts)
        return mergedDrafts.sorted { $0.updatedAt > $1.updatedAt }
    }

    private func draftMergedWithNewerSidecar(
        _ draft: LoomDraftRecord,
        indexModifiedAt: Date
    ) throws -> LoomDraftRecord {
        let markdownURL = markdownURL(for: draft.id)
        guard fileManager.fileExists(atPath: markdownURL.path),
              let sidecarModifiedAt = sidecarModifiedAfterIndex(markdownURL, indexModifiedAt: indexModifiedAt) else {
            return draft
        }

        let sidecarDraft = try draftRecord(fromMarkdownSidecar: markdownURL, id: draft.id)
        guard sidecarDraft.title != draft.title
            || sidecarDraft.body != draft.body
            || sidecarDraft.references != draft.references else {
            return draft
        }

        return LoomDraftRecord(
            id: draft.id,
            title: sidecarDraft.title,
            body: sidecarDraft.body,
            references: sidecarDraft.references,
            createdAt: draft.createdAt,
            updatedAt: max(draft.updatedAt, sidecarModifiedAt)
        )
    }

    private func sidecarModifiedAfterIndex(_ markdownURL: URL, indexModifiedAt: Date) -> Date? {
        guard let sidecarModifiedAt = try? markdownURL
            .resourceValues(forKeys: [.contentModificationDateKey])
            .contentModificationDate,
              sidecarModifiedAt.timeIntervalSince(indexModifiedAt) > Self.externalSidecarEditThreshold else {
            return nil
        }
        return sidecarModifiedAt
    }

    private func markdownSidecarURLs() throws -> [URL] {
        let draftsDirectory = fileURL.deletingLastPathComponent()
        guard fileManager.fileExists(atPath: draftsDirectory.path) else { return [] }
        return try fileManager.contentsOfDirectory(
            at: draftsDirectory,
            includingPropertiesForKeys: [.contentModificationDateKey],
            options: [.skipsHiddenFiles]
        )
            .filter { $0.pathExtension == "md" }
    }

    private func markdownURL(for draftID: UUID) -> URL {
        fileURL
            .deletingLastPathComponent()
            .appendingPathComponent("\(draftID.uuidString).md", isDirectory: false)
    }

    private func draftRecord(fromMarkdownSidecar markdownURL: URL, id: UUID) throws -> LoomDraftRecord {
        let markdown = try String(contentsOf: markdownURL, encoding: .utf8)
        let lines = markdown.components(separatedBy: .newlines)
        let titleLine = lines.first(where: { $0.hasPrefix("# ") }) ?? "# Untitled draft"
        let title = normalizedTitle(String(titleLine.dropFirst(2)))

        let bodyStart = lines.firstIndex(where: { $0.hasPrefix("# ") }).map { $0 + 1 } ?? 0
        let referencesIndex = lines[bodyStart...].firstIndex(where: { $0 == "## References" })
        let bodyEnd = referencesIndex ?? lines.endIndex
        let body = lines[bodyStart..<bodyEnd]
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let references = referencesIndex.map { referenceMarkdownRecords(from: lines, startIndex: $0 + 1) } ?? []
        let modifiedAt = (try? markdownURL.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate)
            ?? Date.distantPast

        return LoomDraftRecord(
            id: id,
            title: title,
            body: body,
            references: references,
            createdAt: modifiedAt,
            updatedAt: modifiedAt
        )
    }

    private func referenceMarkdownRecords(from lines: [String], startIndex: Int) -> [LoomDraftReference] {
        var references: [LoomDraftReference] = []
        var index = startIndex

        while index < lines.count {
            guard let link = Self.markdownReferenceLink(lines[index]) else {
                index += 1
                continue
            }

            var kind: String?
            var sourceTitle: String?
            var category: String?
            var sourcePath: String?
            var capturedAt: String?
            var excerpt: String?
            var artifactState: LoomDraftArtifactState?
            index += 1

            while index < lines.count, !lines[index].hasPrefix("- [") {
                let line = lines[index]
                if let value = Self.metadataValue(line, prefix: "Kind:") {
                    kind = value
                } else if let value = Self.metadataValue(line, prefix: "Source:") {
                    sourceTitle = value
                } else if let value = Self.metadataValue(line, prefix: "Category:") {
                    category = value
                } else if let value = Self.metadataValue(line, prefix: "Source path:") {
                    sourcePath = value
                } else if let value = Self.metadataValue(line, prefix: "Captured:") {
                    capturedAt = value
                } else if let value = Self.metadataValue(line, prefix: "Artifact state:") {
                    artifactState = Self.artifactState(fromMarkdown: value)
                } else if let value = Self.metadataValue(line, prefix: ">") {
                    excerpt = value
                }
                index += 1
            }

            references.append(
                LoomDraftReference(
                    label: link.label,
                    href: link.href,
                    kind: kind,
                    sourceTitle: sourceTitle,
                    category: category,
                    sourcePath: sourcePath,
                    excerpt: excerpt,
                    capturedAt: capturedAt,
                    artifactState: artifactState
                )
            )
        }

        return references
    }

    private static func markdownReferenceLink(_ line: String) -> (label: String, href: String)? {
        guard line.hasPrefix("- ["),
              let labelEnd = line.range(of: "]("),
              let hrefEnd = line.range(of: ")", range: labelEnd.upperBound..<line.endIndex) else {
            return nil
        }
        let labelStart = line.index(line.startIndex, offsetBy: 3)
        let label = String(line[labelStart..<labelEnd.lowerBound])
        let href = String(line[labelEnd.upperBound..<hrefEnd.lowerBound])
        guard let cleanLabel = clean(label), let cleanHref = clean(href) else { return nil }
        return (cleanLabel, cleanHref)
    }

    private static func metadataValue(_ line: String, prefix: String) -> String? {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard trimmed.hasPrefix(prefix) else { return nil }
        return clean(String(trimmed.dropFirst(prefix.count)))
    }

    private static func artifactState(fromMarkdown value: String) -> LoomDraftArtifactState? {
        let parts = value
            .components(separatedBy: " · ")
            .compactMap { clean($0) }
        guard !parts.isEmpty else { return nil }
        return LoomDraftArtifactState(
            targetId: parts.count >= 3 ? parts[2] : parts[0],
            kind: parts.count >= 2 ? parts[1] : nil,
            label: parts.first,
            state: nil,
            stateLabel: parts.count >= 4 ? parts[3] : nil
        )
    }

    private func markdown(for draft: LoomDraftRecord) -> String {
        var sections: [String] = ["# \(draft.title)", draft.body.trimmingCharacters(in: .whitespacesAndNewlines)]
        if !draft.references.isEmpty {
            sections.append(referenceMarkdown(for: draft.references))
        }
        return sections
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .joined(separator: "\n\n")
            + "\n"
    }

    private func referenceMarkdown(for references: [LoomDraftReference]) -> String {
        var lines = ["## References"]
        for reference in references {
            lines.append("- [\(reference.label)](\(reference.href))")
            if let kind = Self.clean(reference.kind) {
                lines.append("  Kind: \(kind)")
            }
            if let sourceTitle = Self.clean(reference.sourceTitle) {
                lines.append("  Source: \(sourceTitle)")
            }
            if let category = Self.clean(reference.category) {
                lines.append("  Category: \(category)")
            }
            if let sourcePath = Self.clean(reference.sourcePath) {
                lines.append("  Source path: \(sourcePath)")
            }
            if let capturedAt = Self.clean(reference.capturedAt) {
                lines.append("  Captured: \(capturedAt)")
            }
            if let artifactState = Self.cleanArtifactState(reference.artifactState) {
                lines.append("  Artifact state: \(artifactStateMarkdown(artifactState))")
            }
            if let excerpt = Self.clean(reference.excerpt) {
                lines.append("  > \(excerpt)")
            }
        }
        return lines.joined(separator: "\n")
    }

    private func artifactStateMarkdown(_ artifactState: LoomDraftArtifactState) -> String {
        [
            Self.clean(artifactState.label),
            Self.clean(artifactState.kind),
            Self.clean(artifactState.targetId),
            Self.clean(artifactState.stateLabel),
            Self.clean(artifactState.state)
        ]
            .compactMap { $0 }
            .joined(separator: " · ")
    }

    private func normalizedTitle(_ title: String) -> String {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Untitled draft" : trimmed
    }

    private static func mergedReferences(
        _ references: [LoomDraftReference],
        adding reference: LoomDraftReference
    ) -> [LoomDraftReference] {
        guard let index = references.firstIndex(where: { $0.href == reference.href }) else {
            return references + [reference]
        }

        var next = references
        next[index] = mergeReference(next[index], with: reference)
        return next
    }

    private static func mergeReference(
        _ existing: LoomDraftReference,
        with incoming: LoomDraftReference
    ) -> LoomDraftReference {
        LoomDraftReference(
            label: clean(existing.label) ?? clean(incoming.label) ?? existing.label,
            href: existing.href,
            kind: clean(existing.kind) ?? clean(incoming.kind),
            sourceTitle: clean(existing.sourceTitle) ?? clean(incoming.sourceTitle),
            category: clean(existing.category) ?? clean(incoming.category),
            sourcePath: clean(existing.sourcePath) ?? clean(incoming.sourcePath),
            excerpt: clean(existing.excerpt) ?? clean(incoming.excerpt),
            capturedAt: clean(existing.capturedAt) ?? clean(incoming.capturedAt),
            artifactState: mergeArtifactState(existing.artifactState, with: incoming.artifactState)
        )
    }

    private static func clean(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func cleanArtifactState(_ value: LoomDraftArtifactState?) -> LoomDraftArtifactState? {
        guard let value, let targetId = clean(value.targetId) else { return nil }
        return LoomDraftArtifactState(
            targetId: targetId,
            kind: clean(value.kind),
            label: clean(value.label),
            state: clean(value.state),
            stateLabel: clean(value.stateLabel)
        )
    }

    private static func mergeArtifactState(
        _ existing: LoomDraftArtifactState?,
        with incoming: LoomDraftArtifactState?
    ) -> LoomDraftArtifactState? {
        let current = cleanArtifactState(existing)
        let next = cleanArtifactState(incoming)
        guard let current else { return next }
        guard let next else { return current }
        return LoomDraftArtifactState(
            targetId: current.targetId,
            kind: clean(current.kind) ?? clean(next.kind),
            label: clean(current.label) ?? clean(next.label),
            state: clean(current.state) ?? clean(next.state),
            stateLabel: clean(current.stateLabel) ?? clean(next.stateLabel)
        )
    }
}
