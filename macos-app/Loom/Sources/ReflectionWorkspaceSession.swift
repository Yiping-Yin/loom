//
//  ReflectionWorkspaceSession.swift
//  Loom
//
//  Stage 1 (LoomDomain): the single shared workspace state. The SwiftUI
//  scene window and the AppKit fallback window both mount
//  LoomReflectionRootView; before this object existed each mount held its
//  own @State copy and the two raced last-writer-wins into one defaults
//  blob. Both mounts now observe this one @MainActor object.
//

import Foundation
import SwiftUI

@MainActor
final class ReflectionWorkspaceSession: ObservableObject {
    static let shared = ReflectionWorkspaceSession()

    @Published var cases: [ReflectionCase]
    @Published var selectedCaseID: ReflectionCase.ID
    @Published var selectedSourceID: ReflectionSource.ID?
    @Published var selectedLearningTraceID: ReflectionLearningTrace.ID?
    // Stage 3 (workbench): open cases behave like editor tabs — session-local,
    // never persisted; closing a tab never deletes the case.
    @Published var openCaseIDs: [ReflectionCase.ID] = []
    // Stage 4 (融会贯通): the cross-case principle store — file-primary,
    // loaded once, mutated only through the user-signed gate below.
    @Published var principles: [ReflectionPrincipleRecord] = []

    /// The snapshot parameter is injectable for tests; production uses the
    /// hardened store (newer-wins replicas + v1→v2 migration).
    init(restored: ReflectionWorkspaceSnapshot? = ReflectionWorkspaceStore.load()) {
        let initialCases = restored?.cases.isEmpty == false ? restored!.cases : [ReflectionCase.blank()]
        let initialSelectedCaseID: ReflectionCase.ID
        if let restoredSelectedCaseID = restored?.selectedCaseID,
           initialCases.contains(where: { $0.id == restoredSelectedCaseID }) {
            initialSelectedCaseID = restoredSelectedCaseID
        } else {
            initialSelectedCaseID = initialCases[0].id
        }
        let initialSelectedCase = initialCases.first { $0.id == initialSelectedCaseID } ?? initialCases[0]
        let initialSelectedSourceID: ReflectionSource.ID?
        if let restoredSelectedSourceID = restored?.selectedSourceID,
           initialSelectedCase.sources.contains(where: { $0.id == restoredSelectedSourceID }) {
            initialSelectedSourceID = restoredSelectedSourceID
        } else {
            initialSelectedSourceID = initialSelectedCase.sources.first?.id
        }

        cases = initialCases
        selectedCaseID = initialSelectedCaseID
        selectedSourceID = initialSelectedSourceID
        selectedLearningTraceID = nil
        openCaseIDs = [initialSelectedCaseID]
        principles = ReflectionPrincipleStore.load()
    }

    func openCase(_ id: ReflectionCase.ID) {
        if !openCaseIDs.contains(id) {
            openCaseIDs.append(id)
        }
        selectedCaseID = id
    }

    func closeCase(_ id: ReflectionCase.ID) {
        openCaseIDs.removeAll { $0 == id }
        if selectedCaseID == id {
            selectedCaseID = openCaseIDs.last ?? cases.first?.id ?? selectedCaseID
        }
    }

    func persist() {
        ReflectionWorkspaceStore.save(
            cases: cases,
            selectedCaseID: selectedCaseID,
            selectedSourceID: selectedSourceID
        )
    }

    /// Stage 4 (融会贯通): user-signed promotion through the honesty gate.
    func promotePrinciple(
        statement: String,
        holdsWithin: String,
        from reflectionCase: ReflectionCase,
        anchoringTrace: ReflectionLearningTrace?
    ) -> ReflectionPrinciplePromotionOutcome {
        let outcome = ReflectionPrincipleStore.promote(
            statement: statement,
            holdsWithin: holdsWithin,
            from: reflectionCase,
            anchoringTrace: anchoringTrace
        )
        if case .promoted(let record) = outcome {
            principles.append(record)
            ReflectionPrincipleStore.save(principles)
        }
        return outcome
    }

    /// Citing a reused principle into another case records the reuse event
    /// and leaves the origin one click away (the record keeps its citation).
    func citePrinciple(_ principleID: ReflectionPrincipleRecord.ID, into reflectionCase: ReflectionCase) {
        guard let index = principles.firstIndex(where: { $0.id == principleID }) else { return }
        guard principles[index].sourceCaseID != reflectionCase.id else { return }
        guard !principles[index].reuseEvents.contains(where: { $0.caseID == reflectionCase.id }) else { return }
        principles[index].reuseEvents.append(
            ReflectionPrincipleReuseEvent(caseID: reflectionCase.id, caseTitle: reflectionCase.title, citedAt: Date())
        )
        ReflectionPrincipleStore.save(principles)
    }
}
