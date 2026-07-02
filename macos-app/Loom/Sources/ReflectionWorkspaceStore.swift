//
//  ReflectionWorkspaceStore.swift
//  Loom
//
//  Extracted from LoomReflectionRootView.swift (Stage 1 — LoomDomain).
//  Behavior-preserving move; see docs/superpowers/plans/2026-07-02-stage1-loomdomain.md.
//

import Foundation
import os

enum ReflectionWorkspaceStore {
    private static let defaultsKey = "loom.reflectionWorkspaceSnapshot"
    private static let backupKey = "loom.reflectionWorkspaceSnapshot.backup-v1"
    private static let logger = Logger(subsystem: "com.yinyiping.loom", category: "workspace-store")
    static let currentSchemaVersion = 2

    static func load(
        defaults: UserDefaults = .standard,
        mirrorURL: URL? = ReflectionWorkspaceStore.defaultMirrorURL
    ) -> ReflectionWorkspaceSnapshot? {
        let defaultsRaw = defaults.data(forKey: defaultsKey)
        let mirrorRaw = mirrorURL.flatMap { try? Data(contentsOf: $0) }
        let defaultsSnapshot = loadFromDefaults(defaults)
        let mirrorSnapshot = loadFromMirror(mirrorURL)
        if defaultsRaw != nil, defaultsSnapshot == nil {
            logger.error("workspace defaults blob failed to decode; falling back to the mirror replica")
        }
        if mirrorRaw != nil, mirrorSnapshot == nil {
            logger.error("workspace mirror file failed to decode")
        }

        // Newer replica wins: the two stores can diverge across binary flips
        // (the 2026-07-02 preference-domain split). Missing savedAt (legacy
        // v1 blobs) counts as distantPast, preserving the historical
        // defaults-first order on ties.
        let chosen: (snapshot: ReflectionWorkspaceSnapshot, raw: Data?)?
        switch (defaultsSnapshot, mirrorSnapshot) {
        case (nil, nil):
            chosen = nil
        case (let fromDefaults?, nil):
            chosen = (fromDefaults, defaultsRaw)
        case (nil, let fromMirror?):
            chosen = (fromMirror, mirrorRaw)
        case (let fromDefaults?, let fromMirror?):
            let defaultsDate = fromDefaults.savedAt ?? .distantPast
            let mirrorDate = fromMirror.savedAt ?? .distantPast
            chosen = mirrorDate > defaultsDate ? (fromMirror, mirrorRaw) : (fromDefaults, defaultsRaw)
        }
        guard let (snapshot, originalRaw) = chosen else { return nil }

        let normalized = normalize(snapshot)
        let migration = migrateToTypedRecords(normalized)
        if migration.didMigrate {
            writeBackupOnce(originalRaw, defaults: defaults, mirrorURL: mirrorURL)
        }
        let result = migration.snapshot
        if result != snapshot {
            save(
                cases: result.cases,
                selectedCaseID: result.selectedCaseID,
                selectedSourceID: result.selectedSourceID,
                defaults: defaults,
                mirrorURL: mirrorURL
            )
        } else {
            writeMirror(result, mirrorURL: mirrorURL)
        }
        return result
    }

    static func save(
        cases: [ReflectionCase],
        selectedCaseID: ReflectionCase.ID,
        selectedSourceID: ReflectionSource.ID?,
        defaults: UserDefaults = .standard,
        mirrorURL: URL? = ReflectionWorkspaceStore.defaultMirrorURL
    ) {
        var snapshot = ReflectionWorkspaceSnapshot(
            cases: cases,
            selectedCaseID: selectedCaseID,
            selectedSourceID: selectedSourceID
        )
        snapshot.schemaVersion = currentSchemaVersion
        snapshot.savedAt = Date()
        let data: Data
        do {
            data = try JSONEncoder().encode(snapshot)
        } catch {
            logger.error("workspace snapshot failed to encode — save dropped: \(error.localizedDescription)")
            return
        }
        if data.count > 512 * 1024 {
            logger.warning("workspace snapshot is \(data.count) bytes in UserDefaults — approaching platform limits")
        }
        defaults.set(data, forKey: defaultsKey)
        writeMirror(snapshot, encodedData: data, mirrorURL: mirrorURL)
    }

    /// Stage 1 (LoomDomain) one-time v1→v2 migration: derive typed trace
    /// records from parseable input items. Items are never rewritten.
    private static func migrateToTypedRecords(
        _ snapshot: ReflectionWorkspaceSnapshot
    ) -> (snapshot: ReflectionWorkspaceSnapshot, didMigrate: Bool) {
        var next = snapshot
        var didMigrate = false
        next.cases = snapshot.cases.map { reflectionCase in
            guard (reflectionCase.traceRecords ?? []).isEmpty else { return reflectionCase }
            let sourceLabel = reflectionCase.sources.first?.label ?? reflectionCase.title
            let items = reflectionCase.steps.first { $0.id == "input" }?.items ?? []
            let records = items.compactMap { ReflectionTraceRecord.fromLegacyItem($0, sourceLabel: sourceLabel) }
            guard !records.isEmpty else { return reflectionCase }
            var migratedCase = reflectionCase
            migratedCase.traceRecords = records
            didMigrate = true
            return migratedCase
        }
        return (next, didMigrate)
    }

    /// The pre-migration blob is preserved byte-identically, once, in BOTH
    /// domains — rollback is a documented guarantee, not a hope.
    private static func writeBackupOnce(_ raw: Data?, defaults: UserDefaults, mirrorURL: URL?) {
        guard let raw else { return }
        if defaults.data(forKey: backupKey) == nil {
            defaults.set(raw, forKey: backupKey)
        }
        guard let mirrorURL else { return }
        let backupURL = mirrorURL.deletingPathExtension().appendingPathExtension("backup-v1.json")
        guard !FileManager.default.fileExists(atPath: backupURL.path) else { return }
        do {
            try FileManager.default.createDirectory(
                at: backupURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try raw.write(to: backupURL, options: [.atomic])
        } catch {
            logger.error("pre-migration mirror backup failed: \(error.localizedDescription)")
        }
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
            // UserDefaults remains the in-app source of truth when the mirror
            // cannot be written — but a silently dead safety net is a data-loss
            // hazard, so the failure is logged.
            logger.error("workspace mirror write failed: \(error.localizedDescription)")
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
