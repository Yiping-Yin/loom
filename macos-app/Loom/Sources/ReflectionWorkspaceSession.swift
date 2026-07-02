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

    /// The snapshot parameter is injectable for tests; production uses the
    /// hardened store (newer-wins replicas + v1→v2 migration).
    init(restored: ReflectionWorkspaceSnapshot? = ReflectionWorkspaceStore.load()) {
        let initialCases = restored?.cases.isEmpty == false ? restored!.cases : ReflectionCase.samples
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
}
