import XCTest
@testable import Loom

/// Stage 1 (LoomDomain): the shared session must reproduce the root view's
/// historical restore/selection-repair behavior exactly — it replaced the
/// per-mount @State initialization.
@MainActor
final class ReflectionWorkspaceSessionTests: XCTestCase {
    func testRestoredSelectionIsKeptWhenValid() {
        var learningCase = ReflectionCase.blank()
        learningCase.title = "Kept"
        let snapshot = ReflectionWorkspaceSnapshot(
            cases: [learningCase],
            selectedCaseID: learningCase.id,
            selectedSourceID: nil
        )

        let session = ReflectionWorkspaceSession(restored: snapshot)

        XCTAssertEqual(session.cases.map(\.title), ["Kept"])
        XCTAssertEqual(session.selectedCaseID, learningCase.id)
        XCTAssertNil(session.selectedLearningTraceID)
    }

    func testStaleSelectionFallsBackToFirstCase() {
        let reflectionCase = ReflectionCase.blank()
        let snapshot = ReflectionWorkspaceSnapshot(
            cases: [reflectionCase],
            selectedCaseID: "deleted-case-id",
            selectedSourceID: "deleted-source-id"
        )

        let session = ReflectionWorkspaceSession(restored: snapshot)

        XCTAssertEqual(session.selectedCaseID, reflectionCase.id)
        XCTAssertEqual(session.selectedSourceID, reflectionCase.sources.first?.id)
    }

    func testEmptyRestoreFallsBackToSamples() {
        let session = ReflectionWorkspaceSession(restored: nil)

        XCTAssertEqual(session.cases.map(\.id), ReflectionCase.samples.map(\.id))
        XCTAssertEqual(session.selectedCaseID, ReflectionCase.samples[0].id)
    }

    // NOTE deliberately absent: no test may touch ReflectionWorkspaceSession
    // .shared — its initializer loads the REAL store with default parameters,
    // and a test doing so migrated the owner's real global-domain workspace
    // on 2026-07-02 (backup verified intact, but tests must never reach the
    // real domain; see the web-side source-library-metadata lesson).
}
