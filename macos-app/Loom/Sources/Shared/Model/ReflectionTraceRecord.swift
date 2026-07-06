//
//  ReflectionTraceRecord.swift
//  Loom
//
//  Stage 1 (LoomDomain): the typed, versioned persistence unit for learning
//  traces. The rendered English input line remains stored verbatim in
//  `legacyItem` so migration is byte-faithful by construction; rendering and
//  parsing share the legacy logic in ReflectionLearningTrace until Stage 2
//  makes records the authoritative source the BOOK renders from.
//

import Foundation

struct ReflectionTraceEvidence: Codable, Equatable {
    let label: String
    let value: String
}

struct ReflectionTraceRecord: Identifiable, Codable, Equatable {
    var schemaVersion: Int
    let id: String
    var kind: String
    var traceType: String
    var sourceAnchor: String
    var focus: String
    var text: String
    var evidence: [ReflectionTraceEvidence]
    var createdAt: Date?
    var legacyItem: String

    /// Parses one persisted input line into a typed record. Returns nil for
    /// non-trace lines (synthesis narration) — identical exclusion behavior
    /// to the legacy string path.
    static func fromLegacyItem(
        _ item: String,
        sourceLabel: String,
        createdAt: Date? = nil
    ) -> ReflectionTraceRecord? {
        if let parsed = ReflectionLearningTrace.parseCaptured(item, version: 1) {
            return ReflectionTraceRecord(
                schemaVersion: 1,
                id: UUID().uuidString,
                kind: "captured",
                traceType: parsed.traceType,
                sourceAnchor: parsed.sourceAnchor,
                focus: parsed.focus,
                text: parsed.text,
                evidence: parsed.evidence.map { ReflectionTraceEvidence(label: $0.label, value: $0.value) },
                createdAt: createdAt,
                legacyItem: item
            )
        }
        if let parsed = ReflectionLearningTrace.parseLegacyManual(item, version: 1, sourceLabel: sourceLabel) {
            return ReflectionTraceRecord(
                schemaVersion: 1,
                id: UUID().uuidString,
                kind: "manual",
                traceType: parsed.traceType,
                sourceAnchor: parsed.sourceAnchor,
                focus: parsed.focus,
                text: parsed.text,
                evidence: [],
                createdAt: createdAt,
                legacyItem: item
            )
        }
        return nil
    }

    /// The exact rendered English input line — byte-faithful round trip.
    func renderLegacyItem() -> String {
        legacyItem
    }
}
