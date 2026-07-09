import Foundation

/// The 3-way top IA (charter §3/§20, ratified 2026-07-08): Today · Workspace ·
/// Digital Me. This is the PURE contract the Wave 2 sidebar destination list +
/// the ⌘1/⌘2/⌘3 keymap render against — extracted first (Wave 2 STEP 0) so the
/// shell rewrite adopts a tested type instead of inventing one mid-rewrite.
/// No SwiftUI here; the view layer maps `systemImage`/`title` to rows.
enum WorkspaceDestination: String, CaseIterable, Identifiable, Codable {
    case today
    case workspace
    case digitalMe

    var id: String { rawValue }

    /// Sidebar order + ⌘-number order (Today = ⌘1, Workspace = ⌘2, Digital Me = ⌘3).
    static var ordered: [WorkspaceDestination] { [.today, .workspace, .digitalMe] }

    var title: String {
        switch self {
        case .today: return "Today"
        case .workspace: return "Workspace"
        case .digitalMe: return "You"
        }
    }

    var systemImage: String {
        switch self {
        case .today: return "sun.max"
        case .workspace: return "square.grid.2x2"
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
