//
//  ReflectionLearningTrace.swift
//  Loom
//
//  Extracted from LoomReflectionRootView.swift (Stage 1 — LoomDomain).
//  Behavior-preserving move; see docs/superpowers/plans/2026-07-02-stage1-loomdomain.md.
//

import Foundation
import SwiftUI

struct ReflectionLearningTrace: Identifiable, Equatable {
    let id: String
    let version: String
    let traceType: String
    let sourceAnchor: String
    let focus: String
    let pass: String
    let text: String
    let evidence: [ReflectionLearningEvidence]
    let raw: String

    var displayText: String {
        let cleaned = Self.cleanUserPrefix(text)
        return cleaned.isEmpty ? traceType : cleaned
    }

    var displayLabel: String {
        if isLanguageSelection {
            return "Original selection"
        }
        if focus == "correction" {
            return "Correction"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Principle candidate"
        }
        if isDataOrDocumentSelection {
            return "Source material"
        }
        return "Committed meaning"
    }

    var versionTitle: String {
        if focus.contains("vocabulary") {
            return "Selected word"
        }
        if focus.contains("phrase") {
            return "Selected phrase"
        }
        if focus.contains("sentence") {
            return "Selected sentence"
        }
        if focus.contains("passage") {
            return "Selected passage"
        }
        if focus.contains("data") {
            return "Selected data"
        }
        if focus.contains("document") {
            return "Document point"
        }
        if focus.contains("slide") {
            return "Slide point"
        }
        if focus == "correction" {
            return "Correction"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Principle"
        }
        return "User meaning"
    }

    var statusLabel: String {
        if isLanguageSelection {
            return "needs meaning"
        }
        if focus == "correction" {
            return "corrected"
        }
        if focus == "question" {
            return "open question"
        }
        if focus == "principle" {
            return "memory candidate"
        }
        if isDataOrDocumentSelection {
            return "needs interpretation"
        }
        return "committed"
    }

    var signalLabel: String {
        if isWeakAnchor {
            return "Confirm source"
        }
        if isLanguageSelection || isDataOrDocumentSelection {
            return "Needs meaning"
        }
        if focus == "question" {
            return "Question"
        }
        if focus == "principle" {
            return "Reusable"
        }
        return "Grounded"
    }

    var signalColor: Color {
        if isWeakAnchor || isLanguageSelection || isDataOrDocumentSelection || focus == "question" {
            return Color(red: 0.72, green: 0.47, blue: 0.12)
        }
        return LoomTokens.dsThread
    }

    var isWeakAnchor: Bool {
        let precision = evidence.first { item in
            item.label == "anchor precision" || item.label == "visual precision"
        }?.value.lowercased() ?? ""
        let fallback = evidence.first { $0.label == "fallback note" }?.value.lowercased() ?? ""
        return precision.contains("visual context only") || precision.contains("window") || fallback.contains("weak")
    }

    /// Page parsed from the source anchor ("…, page 9") — the learning
    /// document orders entries by the source's own structure, not capture time.
    var pageNumber: Int? {
        guard let range = sourceAnchor.range(of: #"page (\d+)"#, options: [.regularExpression, .caseInsensitive]) else {
            return nil
        }
        let digits = sourceAnchor[range].compactMap { $0.isNumber ? $0 : nil }
        return Int(String(digits))
    }

    var pageAnchorLabel: String? {
        pageNumber.map { "p.\($0)" }
    }

    var isUserCommitted: Bool {
        !(isLanguageSelection || isDataOrDocumentSelection || focus == "question")
    }

    var isShortLanguageTrace: Bool {
        let words = displayText.split(whereSeparator: { $0.isWhitespace })
        return (focus.contains("vocabulary") || focus.contains("phrase")) && words.count <= 6
    }

    var isLanguageSelection: Bool {
        focus.contains("vocabulary") || focus.contains("phrase") || focus.contains("sentence") || focus.contains("passage")
    }

    var isDataOrDocumentSelection: Bool {
        focus.contains("data") || focus.contains("document") || focus.contains("slide") || focus.contains("text") || focus.contains("file")
    }

    func matches(source: ReflectionSource) -> Bool {
        sourceAnchor == source.label
            || sourceAnchor.hasPrefix("\(source.label),")
            || sourceAnchor.contains(source.label)
    }

    static func from(_ reflectionCase: ReflectionCase) -> [ReflectionLearningTrace] {
        if let records = reflectionCase.traceRecords, !records.isEmpty {
            return from(records: records)
        }
        let inputItems = reflectionCase.steps.first { $0.id == "input" }?.items ?? []
        var traces: [ReflectionLearningTrace] = []
        var version = 1

        for item in inputItems {
            if let capturedTrace = parseCaptured(item, version: version) {
                traces.append(capturedTrace)
                version += 1
            } else if let manualTrace = parseLegacyManual(item, version: version, sourceLabel: reflectionCase.sources.first?.label ?? reflectionCase.title) {
                traces.append(manualTrace)
                version += 1
            }
        }
        return traces
    }

    /// Stage 1 (LoomDomain): build the same view-models from typed records.
    /// Must stay behaviorally identical to the string-parsing path above —
    /// ReflectionTraceRecordTests pins the equivalence.
    static func from(records: [ReflectionTraceRecord]) -> [ReflectionLearningTrace] {
        var version = 1
        return records.map { record in
            let trace = ReflectionLearningTrace(
                id: "\(version)-\(record.legacyItem)",
                version: "v\(version)",
                traceType: record.traceType,
                sourceAnchor: record.sourceAnchor,
                focus: record.focus,
                pass: passLabel(for: record.focus),
                text: record.text,
                evidence: record.evidence.map { ReflectionLearningEvidence(label: $0.label, value: $0.value) },
                raw: record.legacyItem
            )
            version += 1
            return trace
        }
    }

    private static func cleanUserPrefix(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let prefixes = [
            "principle:", "principle：",
            "memory:", "memory：",
            "correction:", "correction：",
            "correct:", "correct：",
            "question:", "question：",
            "meaning:", "meaning：",
            "translation:", "translation：",
            "意思:", "意思：",
            "含义:", "含义：",
            "翻译:", "翻译："
        ]

        for prefix in prefixes {
            if trimmed.lowercased().hasPrefix(prefix) {
                let start = trimmed.index(trimmed.startIndex, offsetBy: prefix.count)
                return String(trimmed[start...]).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        return trimmed
    }

    static func parseCaptured(_ item: String, version: Int) -> ReflectionLearningTrace? {
        let prefix = "Captured "
        guard item.hasPrefix(prefix),
              let fromRange = item.range(of: " from "),
              let focusStart = item.range(of: "[", range: fromRange.upperBound..<item.endIndex),
              let focusEnd = item.range(of: "]", range: focusStart.upperBound..<item.endIndex)
        else { return nil }

        let typeStart = item.index(item.startIndex, offsetBy: prefix.count)
        let traceType = String(item[typeStart..<fromRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let sourceAnchor = String(item[fromRange.upperBound..<focusStart.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let focus = String(item[focusStart.upperBound..<focusEnd.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let split = splitEvidence(from: String(item[focusEnd.upperBound...]))
        var remainder = split.content
        if remainder.hasPrefix(":") || remainder.hasPrefix(".") {
            remainder.removeFirst()
        }
        let text = remainder.trimmingCharacters(in: .whitespacesAndNewlines)
        let evidence = parseEvidence(split.evidence)

        return ReflectionLearningTrace(
            id: "\(version)-\(item)",
            version: "v\(version)",
            traceType: traceType.isEmpty ? "learning trace" : traceType,
            sourceAnchor: sourceAnchor.isEmpty ? "Original file" : sourceAnchor,
            focus: focus.isEmpty ? "user meaning" : focus,
            pass: passLabel(for: focus),
            text: text,
            evidence: evidence,
            raw: item
        )
    }

    private static func splitEvidence(from value: String) -> (content: String, evidence: String?) {
        guard let evidenceRange = value.range(of: reflectionLearningEvidenceMarker) else {
            return (value, nil)
        }

        let content = String(value[..<evidenceRange.lowerBound])
        let evidence = String(value[evidenceRange.upperBound...])
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (content, evidence.isEmpty ? nil : evidence)
    }

    private static func parseEvidence(_ value: String?) -> [ReflectionLearningEvidence] {
        guard let value else { return [] }
        return value
            .split(separator: ";")
            .compactMap { segment -> ReflectionLearningEvidence? in
                let parts = segment.split(separator: "=", maxSplits: 1)
                guard parts.count == 2 else { return nil }
                let label = parts[0]
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    .lowercased()
                let evidenceValue = parts[1]
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                guard !label.isEmpty, !evidenceValue.isEmpty else { return nil }
                return ReflectionLearningEvidence(label: label, value: evidenceValue)
            }
    }

    static func parseLegacyManual(_ item: String, version: Int, sourceLabel: String) -> ReflectionLearningTrace? {
        let prefix = "Manual learning note: "
        guard item.hasPrefix(prefix) else { return nil }
        let textStart = item.index(item.startIndex, offsetBy: prefix.count)
        let text = String(item[textStart...]).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }

        return ReflectionLearningTrace(
            id: "\(version)-\(item)",
            version: "v\(version)",
            traceType: "user trace",
            sourceAnchor: sourceLabel,
            focus: "user meaning",
            pass: "second pass",
            text: text,
            evidence: [],
            raw: item
        )
    }

    private static func passLabel(for focus: String) -> String {
        if focus.contains("vocabulary") || focus.contains("phrase") || focus.contains("sentence") || focus.contains("passage") {
            return "first language pass"
        }
        if focus.contains("data") {
            return "data pass"
        }
        if focus.contains("user") || focus.contains("question") || focus.contains("correction") || focus.contains("principle") {
            return "second pass"
        }
        return "source pass"
    }
}
