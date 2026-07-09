import Foundation

/// The 3-way top IA — owner-defined trio (2026-07-10): opening LOOM gives
/// **Workspace · Wiki · You**.
/// - Workspace: where your organized/uploaded knowledge and materials live
///   (reading, notes, courses — the input plane).
/// - Wiki: your personal knowledge encyclopedia (inputs + online content
///   organized into a knowledge base).
/// - You: the professional self — your judgment trace, supplemented by your
///   online presence, growing toward the simulated professional companion.
/// (Today is a daily FACE, not a product — it stays a window on ⌘⇧T.)
/// This is the PURE contract the sidebar destination list + the ⌘1/⌘2/⌘3
/// keymap render against. No SwiftUI here; the view layer maps
/// `systemImage`/`title` to rows.
enum WorkspaceDestination: String, CaseIterable, Identifiable, Codable {
    case workspace
    case wiki
    case digitalMe

    var id: String { rawValue }

    /// Sidebar order + ⌘-number order (Workspace = ⌘1, Wiki = ⌘2, You = ⌘3).
    static var ordered: [WorkspaceDestination] { [.workspace, .wiki, .digitalMe] }

    var title: String {
        switch self {
        case .workspace: return "Workspace"
        case .wiki: return "Wiki"
        case .digitalMe: return "You"
        }
    }

    var systemImage: String {
        switch self {
        case .workspace: return "square.grid.2x2"
        case .wiki: return "books.vertical"
        case .digitalMe: return "person.crop.circle"
        }
    }

    /// The ⌘-number that selects this destination (1-based, in `ordered`).
    var shortcutNumber: Int { (Self.ordered.firstIndex(of: self) ?? 0) + 1 }

    /// The destination for a ⌘-number, or nil when out of range — so ⌘1/⌘2/⌘3
    /// map cleanly and a stray ⌘4 does nothing.
    static func forShortcutNumber(_ number: Int) -> WorkspaceDestination? {
        let index = number - 1
        return ordered.indices.contains(index) ? ordered[index] : nil
    }
}
