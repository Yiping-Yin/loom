import AppIntents
import Foundation

/// Charter W2-4 — the thin App Intents layer. LOOM's daily verbs become
/// system verbs: Shortcuts, Spotlight, and (on macOS 26+) Apple Intelligence
/// can run them. Each intent opens the app and posts the SAME notification
/// the in-app path uses — one implementation per verb, no parallel logic.

struct NewNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "New Note"
    static let description = IntentDescription("Start a new note in the LOOM workspace.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .loomNewTopic, object: nil)
        return .result()
    }
}

struct OpenTodayIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Today"
    static let description = IntentDescription("Open LOOM's daily face — reading now, open questions, recent notes.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .loomOpenTodayWindow, object: nil)
        return .result()
    }
}

struct StartReviewIntent: AppIntent {
    static let title: LocalizedStringResource = "Start Review"
    static let description = IntentDescription("Open today's review session — rebuild your own sentences.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .loomOpenReviewWindow, object: nil)
        return .result()
    }
}

struct OpenWikiIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Wiki"
    static let description = IntentDescription("Open your personal knowledge encyclopedia.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(
            name: .loomSelectDestination, object: nil,
            userInfo: ["number": WorkspaceDestination.wiki.shortcutNumber])
        return .result()
    }
}

/// Surfaces the verbs in Shortcuts' gallery + Spotlight with natural phrases.
struct LoomShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: NewNoteIntent(),
            phrases: ["New note in \(.applicationName)"],
            shortTitle: "New Note",
            systemImageName: "square.and.pencil")
        AppShortcut(
            intent: OpenTodayIntent(),
            phrases: ["Open today in \(.applicationName)"],
            shortTitle: "Today",
            systemImageName: "sun.max")
        AppShortcut(
            intent: StartReviewIntent(),
            phrases: ["Start review in \(.applicationName)"],
            shortTitle: "Review",
            systemImageName: "rectangle.stack")
        AppShortcut(
            intent: OpenWikiIntent(),
            phrases: ["Open wiki in \(.applicationName)"],
            shortTitle: "Wiki",
            systemImageName: "books.vertical")
    }
}

extension Notification.Name {
    /// Window-open verbs the App Intents post; WindowOpener (which holds the
    /// openWindow environment) observes and opens the real windows.
    static let loomOpenTodayWindow = Notification.Name("loomOpenTodayWindow")
    static let loomOpenReviewWindow = Notification.Name("loomOpenReviewWindow")
}
