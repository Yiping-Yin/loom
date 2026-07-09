import XCTest
@testable import Loom

/// Charter W2-4 — the thin App Intents layer: Shortcuts / Spotlight can drive
/// LOOM's daily verbs (New Note · Open Today · Start Review · Open Wiki).
/// Each intent posts the same notification the in-app path uses, so there is
/// exactly one implementation per verb; these tests pin that wiring.
@MainActor
final class LoomAppIntentsTests: XCTestCase {

    private func expectNotification(_ name: Notification.Name, _ body: () async throws -> Void) async rethrows -> Notification? {
        var received: Notification?
        let token = NotificationCenter.default.addObserver(
            forName: name, object: nil, queue: nil) { note in received = note }
        defer { NotificationCenter.default.removeObserver(token) }
        try await body()
        return received
    }

    func testNewNoteIntentPostsTheNewTopicVerb() async throws {
        let note = try await expectNotification(.loomNewTopic) {
            _ = try await NewNoteIntent().perform()
        }
        XCTAssertNotNil(note)
    }

    func testOpenTodayIntentOpensTheTodayWindow() async throws {
        let note = try await expectNotification(.loomOpenTodayWindow) {
            _ = try await OpenTodayIntent().perform()
        }
        XCTAssertNotNil(note)
    }

    func testStartReviewIntentOpensTheReviewWindow() async throws {
        let note = try await expectNotification(.loomOpenReviewWindow) {
            _ = try await StartReviewIntent().perform()
        }
        XCTAssertNotNil(note)
    }

    func testOpenWikiIntentSelectsTheWikiDestination() async throws {
        let note = try await expectNotification(.loomSelectDestination) {
            _ = try await OpenWikiIntent().perform()
        }
        XCTAssertEqual(note?.userInfo?["number"] as? Int,
                       WorkspaceDestination.wiki.shortcutNumber)
    }
}
