//
//  ReflectionPrincipleStore.swift
//  Loom
//
//  Stage 4 (融会贯通): the workspace-level principle store — the Memory/Reuse
//  layer. A principle leaves its case only through a USER-SIGNED promotion
//  gate that inherits anchor honesty: memory can never be more confident
//  than its weakest citation. Machine matching only ever SUGGESTS reuse
//  (a quiet dot); it never promotes, never writes.
//

import Foundation
import os

struct ReflectionPrincipleReuseEvent: Codable, Equatable {
    let caseID: String
    let caseTitle: String
    let citedAt: Date
}

struct ReflectionPrincipleRecord: Identifiable, Codable, Equatable {
    var schemaVersion: Int
    let id: String
    var statement: String
    /// The constrained-conclusion clause: where this principle holds.
    var holdsWithin: String
    var sourceCaseID: String
    var sourceCaseTitle: String
    var sourceAnchor: String
    var anchorPrecision: String
    var promotedAt: Date
    var reuseEvents: [ReflectionPrincipleReuseEvent]
}

enum ReflectionPrinciplePromotionOutcome: Equatable {
    case promoted(ReflectionPrincipleRecord)
    case blockedWeakAnchor(String)
    case blockedEmptyStatement
}

enum ReflectionPrincipleStore {
    private static let logger = Logger(subsystem: "com.yinyiping.loom", category: "principle-store")

    static var defaultFileURL: URL? {
        FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("Loom", isDirectory: true)
            .appendingPathComponent("reflection-principles.json")
    }

    static func load(fileURL: URL? = ReflectionPrincipleStore.defaultFileURL) -> [ReflectionPrincipleRecord] {
        guard let fileURL, let data = try? Data(contentsOf: fileURL) else { return [] }
        do {
            return try JSONDecoder().decode([ReflectionPrincipleRecord].self, from: data)
        } catch {
            logger.error("principle store failed to decode: \(error.localizedDescription)")
            return []
        }
    }

    static func save(_ records: [ReflectionPrincipleRecord], fileURL: URL? = ReflectionPrincipleStore.defaultFileURL) {
        guard let fileURL else { return }
        do {
            try FileManager.default.createDirectory(
                at: fileURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            let data = try JSONEncoder().encode(records)
            try data.write(to: fileURL, options: [.atomic])
        } catch {
            logger.error("principle store failed to save: \(error.localizedDescription)")
        }
    }

    /// The user-signed promotion gate. The anchoring trace's honesty is
    /// inherited verbatim; a weak anchor BLOCKS promotion (negative path is
    /// part of the contract, not an edge case).
    static func promote(
        statement: String,
        holdsWithin: String,
        from reflectionCase: ReflectionCase,
        anchoringTrace: ReflectionLearningTrace?,
        promotedAt: Date = Date()
    ) -> ReflectionPrinciplePromotionOutcome {
        let trimmed = statement.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .blockedEmptyStatement }

        if let anchoringTrace, anchoringTrace.isWeakAnchor {
            return .blockedWeakAnchor(
                "Promotion blocked — the anchoring trace is below file precision. Confirm the source first."
            )
        }

        let precision = anchoringTrace?.evidence.first { item in
            item.label == "anchor precision" || item.label == "visual precision"
        }?.value ?? (anchoringTrace == nil ? "unanchored (user-signed)" : "file")

        return .promoted(
            ReflectionPrincipleRecord(
                schemaVersion: 1,
                id: UUID().uuidString,
                statement: trimmed,
                holdsWithin: holdsWithin.trimmingCharacters(in: .whitespacesAndNewlines),
                sourceCaseID: reflectionCase.id,
                sourceCaseTitle: reflectionCase.title,
                sourceAnchor: anchoringTrace?.sourceAnchor ?? (reflectionCase.sources.first?.label ?? reflectionCase.title),
                anchorPrecision: precision,
                promotedAt: promotedAt,
                reuseEvents: []
            )
        )
    }

    /// Quiet-dot reuse matching: does a promoted principle from ANOTHER case
    /// plausibly apply to this case's material? Term overlap first — semantic
    /// matching is a later enrichment, never a blocker. Pure function.
    static func reuseCandidates(
        for reflectionCase: ReflectionCase,
        in principles: [ReflectionPrincipleRecord]
    ) -> [ReflectionPrincipleRecord] {
        let caseTerms = meaningfulTerms(
            in: ([reflectionCase.title, reflectionCase.summary]
                + reflectionCase.tags
                + (reflectionCase.traceRecords ?? []).map(\.text)).joined(separator: " ")
        )
        guard !caseTerms.isEmpty else { return [] }
        return principles.filter { principle in
            guard principle.sourceCaseID != reflectionCase.id else { return false }
            let principleTerms = meaningfulTerms(in: principle.statement + " " + principle.holdsWithin)
            return principleTerms.intersection(caseTerms).count >= 2
        }
    }

    static func meaningfulTerms(in text: String) -> Set<String> {
        Set(
            text.lowercased()
                .components(separatedBy: CharacterSet.alphanumerics.inverted)
                .filter { $0.count >= 5 }
        )
    }
}
