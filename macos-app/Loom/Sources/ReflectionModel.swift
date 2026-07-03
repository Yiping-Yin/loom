//
//  ReflectionModel.swift
//  Loom
//
//  Extracted from LoomReflectionRootView.swift (Stage 1 — LoomDomain).
//  Behavior-preserving move; see docs/superpowers/plans/2026-07-02-stage1-loomdomain.md.
//

import Foundation
import SwiftUI

let reflectionLearningEvidenceMarker = "\nEvidence:"

func reflectionLearningInputFingerprint(_ value: String) -> String {
    var normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if let evidenceRange = normalized.range(of: reflectionLearningEvidenceMarker) {
        normalized = String(normalized[..<evidenceRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    while let pageRange = normalized.range(of: #", page \d+"#, options: .regularExpression) {
        normalized.removeSubrange(pageRange)
    }
    return normalized
        .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
        .lowercased()
}

struct ReflectionLearningEvidence: Identifiable, Equatable {
    let label: String
    let value: String

    var id: String {
        "\(label)=\(value)"
    }
}

struct ReflectionWorkspaceSnapshot: Codable, Equatable {
    var cases: [ReflectionCase]
    var selectedCaseID: ReflectionCase.ID
    var selectedSourceID: ReflectionSource.ID?
    // Stage 1 (LoomDomain): optional so legacy v1 blobs keep decoding.
    var schemaVersion: Int? = nil
    var savedAt: Date? = nil
}

struct ReflectionCase: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var project: String
    var status: String
    var updatedAt: String
    var summary: String
    var tags: [String]
    var sources: [ReflectionSource]
    var steps: [ReflectionStep]
    var messages: [ReflectionMessage]
    // Stage 1 (LoomDomain): typed twin of the parseable input items.
    // Optional + declared LAST so legacy blobs decode and the synthesized
    // memberwise init keeps every existing call site compiling.
    var traceRecords: [ReflectionTraceRecord]? = nil
    // Center document: the owner's own writing surface for this case.
    // Optional + LAST for the same legacy-decoding reason as above.
    var documentText: String? = nil

    static func blank() -> ReflectionCase {
        ReflectionCase(
            id: UUID().uuidString,
            title: "Untitled product reflection",
            project: "New product practice",
            status: "Collecting input",
            updatedAt: "now",
            summary: "Start with a real product event, decision, result, or user reaction.",
            tags: ["new"],
            sources: [],
            steps: ReflectionStep.blankWorkflow(),
            messages: [
                ReflectionMessage(
                    role: .loom,
                    eyebrow: "Loom reflection",
                    body: "Start with the concrete material. A decision, a user reaction, a metric change, or a launch result is enough."
                )
            ]
        )
    }

    static let samples: [ReflectionCase] = [
        ReflectionCase(
            id: "activation-empty-state",
            title: "Onboarding empty-state drop",
            project: "LOOM / first session",
            status: "In reflection",
            updatedAt: "18:41",
            summary: "A first-run user reached Sources, added nothing, and left before opening Studio.",
            tags: ["activation", "first-run", "evidence"],
            sources: [
                ReflectionSource(folder: "Input", label: "User feedback note", kind: "feedback", meta: "2 quotes", excerpt: "The user understood that files could be added, but did not understand what a good first file should be."),
                ReflectionSource(folder: "Input", label: "First session path", kind: "trace", meta: "4 events", excerpt: "Open app, Sources, empty shelf, Help, quit. No source imported."),
                ReflectionSource(folder: "Decision Trace", label: "Entry copy decision", kind: "decision", meta: "1 note", excerpt: "We chose to keep the first screen minimal, assuming the user already had a file in mind."),
                ReflectionSource(folder: "Outcome", label: "Activation result", kind: "metric", meta: "local sample", excerpt: "Three test sessions reached Sources. Only one imported a file without prompting."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["The real material is a failed first session, not a feature request.", "The user reached the correct surface but did not know what action had value."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["If the product exposes Add files clearly, the next step will be obvious.", "A sparse interface reduces confusion for a first-run user."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We removed explanatory onboarding and made Sources the first working surface.", "Evidence: repeated complaints about heavy first-run copy in earlier builds."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["The screen looked cleaner, but the first useful action was still underspecified."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Clean UI was not the same as clear intent. The first action needs a concrete example from the user context."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For first-run product surfaces, reduce chrome only after the primary action has a meaningful object."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Material", body: "User entered Sources, saw an empty shelf, opened Help, then quit. The UI was clean but did not create momentum."),
                ReflectionMessage(role: .loom, eyebrow: "Loom reflection", body: "The failure is not missing explanation. The hidden assumption is that an empty source shelf still communicates a useful first move."),
            ]
        ),
        ReflectionCase(
            id: "pricing-trust",
            title: "Pricing page trust test",
            project: "Public site",
            status: "Needs outcome",
            updatedAt: "16:12",
            summary: "A simplified pricing page increased clicks but reduced qualified conversations.",
            tags: ["pricing", "trust", "conversion"],
            sources: [
                ReflectionSource(folder: "Input", label: "Pricing screenshot", kind: "screenshot", meta: "before / after", excerpt: "The simplified page made the price visible earlier and removed most qualifying detail."),
                ReflectionSource(folder: "Outcome", label: "Sales feedback", kind: "feedback", meta: "3 notes", excerpt: "More visitors clicked the call-to-action, but the conversations started with lower understanding."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["The pricing page was shortened to make the offer easier to scan."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["Less detail would reduce anxiety and increase qualified intent."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We prioritized CTA clarity over qualification detail."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["Clicks rose, but qualified conversations weakened."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Reducing friction also removed useful self-selection."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For high-trust products, compression must preserve qualification cues."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Decision", body: "We removed the comparison table because it made the page feel heavy."),
                ReflectionMessage(role: .loom, eyebrow: "Judgment check", body: "The decision optimized for click clarity, but the outcome should be judged against conversation quality."),
            ]
        ),
        ReflectionCase(
            id: "answer-grounding",
            title: "Cited answer grounding",
            project: "AI answer surface",
            status: "Memory ready",
            updatedAt: "11:05",
            summary: "A polished generated answer looked convincing until source attribution was visible.",
            tags: ["attribution", "answer", "trust"],
            sources: [
                ReflectionSource(folder: "Input", label: "Generated answer draft", kind: "draft", meta: "1 answer", excerpt: "The answer made three confident claims, but only one claim had a direct source."),
                ReflectionSource(folder: "Reflection", label: "Citation review", kind: "review", meta: "3 claims", excerpt: "Attribution changed the evaluation from fluent to inspectable."),
            ],
            steps: [
                ReflectionStep(title: "Input", subtitle: "What actually happened", items: ["A generated answer sounded ready before citation review."]),
                ReflectionStep(title: "Assumption", subtitle: "What had to be true", items: ["Fluency would roughly correlate with source support."]),
                ReflectionStep(title: "Decision Trace", subtitle: "Why this path won", items: ["We kept the answer but exposed source coverage beside it."]),
                ReflectionStep(title: "Outcome", subtitle: "What reality returned", items: ["Unsupported claims became obvious immediately."]),
                ReflectionStep(title: "Reflection", subtitle: "What changed in judgment", items: ["Trust improved when answer quality became inspectable, not when copy became smoother."]),
                ReflectionStep(title: "Judgment Memory", subtitle: "What should be reused", items: ["For AI output, the minimum viable unit is claim plus source, not answer text."]),
            ],
            messages: [
                ReflectionMessage(role: .human, eyebrow: "Observation", body: "The answer was good prose, but I could not tell which parts were earned."),
                ReflectionMessage(role: .loom, eyebrow: "Judgment memory", body: "Do not evaluate generated work as text alone. Evaluate the claim-source pair."),
            ]
        ),
    ]
}

struct ReflectionStep: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var subtitle: String
    var items: [String]

    init(id: String = UUID().uuidString, title: String, subtitle: String, items: [String]) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.items = items
    }

    static func blankWorkflow() -> [ReflectionStep] {
        [
            ReflectionStep(id: "input", title: "Input", subtitle: "What actually happened", items: []),
            ReflectionStep(id: "assumption", title: "Assumption", subtitle: "What had to be true", items: []),
            ReflectionStep(id: "decision", title: "Decision Trace", subtitle: "Why this path won", items: []),
            ReflectionStep(id: "outcome", title: "Outcome", subtitle: "What reality returned", items: []),
            ReflectionStep(id: "reflection", title: "Reflection", subtitle: "What changed in judgment", items: []),
            ReflectionStep(id: "memory", title: "Judgment Memory", subtitle: "What should be reused", items: []),
        ]
    }
}

struct ReflectionSource: Identifiable, Codable, Equatable {
    let id: String
    var folder: String
    var label: String
    var kind: String
    var meta: String
    var excerpt: String
    var fileURL: URL?
    // Security-scoped bookmark minted at import time, so the sandboxed app
    // can reopen the file in later sessions (a bare fileURL loses its
    // access grant when the session that imported it ends). Optional +
    // last so legacy blobs keep decoding.
    var bookmarkData: Data?

    init(
        id: String = UUID().uuidString,
        folder: String,
        label: String,
        kind: String,
        meta: String,
        excerpt: String,
        fileURL: URL? = nil,
        bookmarkData: Data? = nil
    ) {
        self.id = id
        self.folder = folder
        self.label = label
        self.kind = kind
        self.meta = meta
        self.excerpt = excerpt
        self.fileURL = fileURL
        self.bookmarkData = bookmarkData
    }

    var symbol: String {
        switch kind {
        case "feedback": return "quote.bubble"
        case "trace": return "point.3.connected.trianglepath.dotted"
        case "decision": return "arrow.triangle.branch"
        case "metric": return "chart.line.uptrend.xyaxis"
        case "screenshot": return "rectangle.dashed"
        case "review": return "checkmark.seal"
        case "pdf": return "doc.richtext"
        case "png", "jpg", "jpeg", "heic", "gif", "tiff", "webp": return "photo"
        case "md", "markdown", "txt", "rtf": return "doc.plaintext"
        case "doc", "docx", "pages": return "doc.text"
        case "xls", "xlsx", "csv", "tsv", "numbers": return "tablecells"
        case "ppt", "pptx", "key": return "rectangle.on.rectangle"
        default: return "doc.text"
        }
    }

    var iconColor: Color {
        switch kind {
        case "pdf":
            return Color(red: 0.86, green: 0.20, blue: 0.18)
        case "doc", "docx", "pages", "rtf":
            return Color(red: 0.18, green: 0.42, blue: 0.82)
        case "xls", "xlsx", "csv", "tsv", "numbers":
            return Color(red: 0.16, green: 0.58, blue: 0.34)
        case "ppt", "pptx", "key":
            return Color(red: 0.83, green: 0.42, blue: 0.12)
        default:
            return LoomTokens.dsInk3
        }
    }
}

struct ReflectionSourceAnchor {
    let label: String
    let sourceID: ReflectionSource.ID
    let fileName: String?
    let pageNumber: Int?
    let precision: String
    let method: String
}

struct ReflectionMessage: Identifiable, Codable, Equatable {
    enum Role: Codable, Equatable {
        case human
        case loom
    }

    let id: String
    var role: Role
    var eyebrow: String
    var body: String

    init(id: String = UUID().uuidString, role: Role, eyebrow: String, body: String) {
        self.id = id
        self.role = role
        self.eyebrow = eyebrow
        self.body = body
    }
}

// MARK: - Stage 1 (LoomDomain) dual-write helpers

extension ReflectionCase {
    /// Appends the typed twin of a newly rendered input line. No-ops for
    /// non-trace lines so records always mirror the PARSEABLE items exactly.
    mutating func appendTraceRecord(
        forLegacyItem item: String,
        sourceLabel: String,
        createdAt: Date = Date()
    ) {
        guard let record = ReflectionTraceRecord.fromLegacyItem(item, sourceLabel: sourceLabel, createdAt: createdAt) else { return }
        traceRecords = (traceRecords ?? []) + [record]
    }

    /// Keeps records in lockstep when the anchor-promotion path replaces an
    /// existing input line in place (better-anchored duplicate capture).
    mutating func replaceTraceRecord(
        forLegacyItem previousItem: String,
        with newItem: String,
        sourceLabel: String,
        createdAt: Date = Date()
    ) {
        guard var records = traceRecords, !records.isEmpty else { return }
        guard let newRecord = ReflectionTraceRecord.fromLegacyItem(newItem, sourceLabel: sourceLabel, createdAt: createdAt) else { return }
        guard let index = records.firstIndex(where: { $0.legacyItem == previousItem }) else { return }
        records[index] = newRecord
        traceRecords = records
    }
}
