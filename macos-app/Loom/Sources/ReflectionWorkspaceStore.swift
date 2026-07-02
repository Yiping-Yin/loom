//
//  ReflectionWorkspaceStore.swift
//  Loom
//
//  Extracted from LoomReflectionRootView.swift (Stage 1 — LoomDomain).
//  Behavior-preserving move; see docs/superpowers/plans/2026-07-02-stage1-loomdomain.md.
//

import Foundation

enum ReflectionWorkspaceStore {
    private static let defaultsKey = "loom.reflectionWorkspaceSnapshot"

    static func load(
        defaults: UserDefaults = .standard,
        mirrorURL: URL? = ReflectionWorkspaceStore.defaultMirrorURL
    ) -> ReflectionWorkspaceSnapshot? {
        guard let snapshot = loadFromDefaults(defaults) ?? loadFromMirror(mirrorURL) else { return nil }
        let normalized = normalize(snapshot)
        if normalized != snapshot {
            save(
                cases: normalized.cases,
                selectedCaseID: normalized.selectedCaseID,
                selectedSourceID: normalized.selectedSourceID,
                defaults: defaults,
                mirrorURL: mirrorURL
            )
        } else {
            writeMirror(normalized, mirrorURL: mirrorURL)
        }
        return normalized
    }

    static func save(
        cases: [ReflectionCase],
        selectedCaseID: ReflectionCase.ID,
        selectedSourceID: ReflectionSource.ID?,
        defaults: UserDefaults = .standard,
        mirrorURL: URL? = ReflectionWorkspaceStore.defaultMirrorURL
    ) {
        let snapshot = ReflectionWorkspaceSnapshot(
            cases: cases,
            selectedCaseID: selectedCaseID,
            selectedSourceID: selectedSourceID
        )
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: defaultsKey)
        writeMirror(snapshot, encodedData: data, mirrorURL: mirrorURL)
    }

    private static func loadFromDefaults(_ defaults: UserDefaults) -> ReflectionWorkspaceSnapshot? {
        guard let data = defaults.data(forKey: defaultsKey) else { return nil }
        return try? JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: data)
    }

    private static func loadFromMirror(_ mirrorURL: URL?) -> ReflectionWorkspaceSnapshot? {
        guard let url = mirrorURL,
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(ReflectionWorkspaceSnapshot.self, from: data)
    }

    private static func writeMirror(
        _ snapshot: ReflectionWorkspaceSnapshot,
        encodedData: Data? = nil,
        mirrorURL: URL?
    ) {
        guard let url = mirrorURL else { return }
        let data = encodedData ?? (try? JSONEncoder().encode(snapshot))
        guard let data else { return }
        do {
            try FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try data.write(to: url, options: [.atomic])
        } catch {
            // UserDefaults remains the in-app source of truth when the mirror cannot be written.
        }
    }

    static var defaultMirrorURL: URL? {
        FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("Loom", isDirectory: true)
            .appendingPathComponent("reflection-workspace-snapshot.json")
    }

    private static func normalize(_ snapshot: ReflectionWorkspaceSnapshot) -> ReflectionWorkspaceSnapshot {
        var next = snapshot
        next.cases = snapshot.cases.map { reflectionCase in
            var normalizedCase = reflectionCase
            if reflectionCase.project == "Learning pass" {
                normalizedCase.messages = orderedUniqueLearningMessages(
                    reflectionCase.messages.map(normalizeLearningMessage)
                )
            }
            normalizedCase.steps = reflectionCase.steps.map { step in
                var normalizedStep = step
                let items = reflectionCase.project == "Learning pass"
                    ? normalizeLearningStepItems(step)
                    : step.items
                normalizedStep.items = orderedUnique(items)
                if reflectionCase.project == "Learning pass", normalizedStep.id == "memory" {
                    normalizedStep.title = "Principle"
                    normalizedStep.subtitle = "What can become reusable thinking"
                }
                return normalizedStep
            }
            return normalizedCase
        }
        return next
    }

    private static func orderedUnique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { value in
            if seen.contains(value) { return false }
            seen.insert(value)
            return true
        }
    }

    private static func orderedUniqueLearningMessages(_ messages: [ReflectionMessage]) -> [ReflectionMessage] {
        var seen = Set<String>()
        return messages.filter { message in
            let key = "\(message.eyebrow)\n\(message.body)"
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }
    }

    private static func normalizeLearningStepItems(_ step: ReflectionStep) -> [String] {
        let items = step.items.map(normalizeLearningInputItem)

        if step.id == "input" {
            return orderedUniqueLearningInputs(items)
        }

        if step.id == "decision" {
            return items.map {
                $0.replacingOccurrences(
                    of: "used Loom only to save anchored traces",
                    with: "used Loom only to commit anchored traces"
                )
            }
        }

        if step.id == "memory" {
            return items.filter { $0.contains("Principle candidate") }
        }

        return items
    }

    private static func orderedUniqueLearningInputs(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { value in
            let key = reflectionLearningInputFingerprint(value)
            if seen.contains(key) { return false }
            seen.insert(key)
            return true
        }
    }

    private static func normalizeLearningMessage(_ message: ReflectionMessage) -> ReflectionMessage {
        var next = message
        if next.eyebrow == "Learning note" {
            next.eyebrow = "Understanding version"
        }
        if next.eyebrow == "Understanding commit" {
            next.eyebrow = "Understanding version"
        }
        next.body = next.body
            .replacingOccurrences(
                of: "Second-pass synthesis prepared from anchored learning traces. Review the meaning before turning it into reusable memory.",
                with: "Second-pass synthesis prepared from understanding versions. Review the changes before promoting any confirmed principle into memory."
            )
            .replacingOccurrences(
                of: "Second-pass synthesis prepared from anchored learning commits. Review the meaning before promoting any confirmed principle into memory.",
                with: "Second-pass synthesis prepared from understanding versions. Review the changes before promoting any confirmed principle into memory."
            )
            .replacingOccurrences(
                of: "Added to the understanding ledger. Keep the original file as the source of truth, then confirm the meaning before turning it into memory.",
                with: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
            )
            .replacingOccurrences(
                of: "Added to the understanding ledger. Keep the original file as the source of truth; promote only confirmed principles into memory.",
                with: "Committed as a thinking version. Native file stays the source of truth; only confirmed principles become reusable memory."
            )
        return next
    }

    private static func normalizeLearningInputItem(_ value: String) -> String {
        if value == "First pass: preserve the original file surface and capture language, concepts, questions, page meaning, and useful passages as anchored traces." {
            return "First language pass: keep the original file surface primary and capture vocabulary, pronunciation, phrases, sentence meaning, grammar, questions, concepts, and page context as anchored traces."
        }
        return value
    }
}
