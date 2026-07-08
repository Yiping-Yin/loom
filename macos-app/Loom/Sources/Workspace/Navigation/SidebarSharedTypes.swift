import SwiftUI

// Extracted 2026-07-08 (partition batch 2) from KnowledgeSidebarView.swift +
// LoomFolderHomeView.swift: the types + notification names that LIVE code
// (LoomWebView's Recents MRU, LoomApp's window opener, the You dossier's
// refresh, LoomRuntimePathsTests) still compile against. Pure move.

enum SidebarThemeResolution {
    static func resolvedColorScheme(
        theme: String,
        systemIsDark: Bool = false,
        now: Date = Date(),
        calendar: Calendar = .current
    ) -> ColorScheme {
        switch theme {
        case "dark":
            return .dark
        case "light":
            return .light
        case "auto", "":
            return isNightTime(now: now, calendar: calendar) ? .dark : .light
        default:
            return systemIsDark ? .dark : .light
        }
    }

    static func isNightTime(now: Date = Date(), calendar: Calendar = .current) -> Bool {
        let hour = calendar.component(.hour, from: now)
        return hour < 6 || hour >= 21
    }

    static func usesNightPalette(colorScheme: ColorScheme) -> Bool {
        colorScheme == .dark
    }
}

enum LibraryReloadFeedback: Equatable, Sendable {
    case idle
    case loading
    case success
    case missingFolder
    case missingManifest
    case failed(String)

    var actionLabel: String {
        switch self {
        case .loading:
            return "Reloading…"
        case .success:
            return "Reloaded"
        case .failed:
            return "Reload failed"
        default:
            return "Reload sources"
        }
    }

    var statusMessage: String? {
        switch self {
        case .idle:
            return nil
        case .loading:
            return nil
        case .success:
            return nil
        case .missingFolder:
            return "Choose a source folder in Settings -> Data."
        case .missingManifest:
            return "No source manifest yet. Add sources to build one."
        case .failed(let message):
            return message
        }
    }

    var isTransient: Bool {
        switch self {
        case .loading, .success, .failed:
            return true
        default:
            return false
        }
    }
}

/// Recent-doc MRU record. Stored as JSON in UserDefaults by the
/// webview Coordinator every time navigation finishes — retains the
/// title seen at capture time so user-picked docs (not in the bundle
/// search-index) still surface with a human name in the sidebar.
struct RecentDocRecord: Codable, Identifiable, Equatable {
    let href: String
    let title: String?
    let at: Double
    var id: String { href }
}

extension Notification.Name {
    /// Posted by ContentView when the native sidebar toggles. Coordinator
    /// picks it up and pokes the webview's own Sidebar via a custom event
    /// + localStorage write, so the two don't render simultaneously.
    static let loomSetWebSidebarMode = Notification.Name("loomSetWebSidebarMode")

    /// Posted by the webview Coordinator after it appends a new URL to
    /// the sidebar Recents MRU list.
    static let loomRecentsChanged = Notification.Name("loomRecentsChanged")

    /// Posted when a file is dropped onto the main window. Carries a
    /// `URL` in `userInfo["url"]`.
    static let loomIngestFileDropped = Notification.Name("loomIngestFileDropped")

    /// Posted by the View menu → Rescan Library command. Sidebar listens
    /// and re-fetches both bundle and user-knowledge-nav manifests.
    static let loomRescanLibrary = Notification.Name("loomRescanLibrary")
}

extension Notification.Name {
    /// Posted by sidebar (clicking a folder name) or LoomFolderHomeView
    /// (clicking a sub-folder in the Files listing). Carries `userInfo`
    /// `["url": loom://content/<root-id>/<sub-path>]`. ContentView
    /// listens and swaps the main pane to `LoomFolderHomeView` for that
    /// folder.
    static let loomShowFolderHome = Notification.Name("loomShowFolderHome")
    /// Posted by the toolbar refresh button / ⌘R / app-became-active.
    /// LoomFolderHomeView listens to re-scan its source folder so
    /// changes the user made in Finder appear without restarting.
    static let loomRefreshActivePage = Notification.Name("loomRefreshActivePage")
}
