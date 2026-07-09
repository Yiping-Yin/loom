import SwiftUI

/// Native Keyboard Shortcuts reference, Phase 4 of architecture inversion.
/// Replaces `components/unified/KeyboardHelpOverlay.tsx` — same content,
/// rendered as a standalone macOS Window instead of a webview-modal.
///
/// Opened via the Help menu's "Keyboard Shortcuts" item (⌘⇧?) or via
/// `@Environment(\.openWindow)` + `openWindow(id: KeyboardHelpWindow.id)`.
///
/// Content is declared once in the `groups` array; adding a new shortcut
/// is one entry, same as the React original.
struct KeyboardHelpView: View {
    // The header reads "⌘⇧? toggle · Esc close"; the Esc half was
    // aspirational until 2026-04-23 (no handler wired). Now both work.
    @Environment(\.dismissWindow) private var dismissWindow

    struct Shortcut: Identifiable {
        let id = UUID()
        let keys: String
        let label: String
    }

    struct Group: Identifiable {
        let id = UUID()
        let title: String
        let items: [Shortcut]
    }

    // Regenerated 2026-07-08 from the LIVE command set — the old list
    // documented the retired web shell (~60% of its shortcuts were dead).
    let groups: [Group] = [
        Group(title: "Workspace", items: [
            // ⌘1/⌘2/⌘3 select the three destinations (W2-2, Mail idiom);
            // the old column-toggle rows described the pre-split shell.
            .init(keys: "⌘1", label: "Workspace"),
            .init(keys: "⌘2", label: "Wiki"),
            .init(keys: "⌘3", label: "You"),
            .init(keys: "⌃⌘S", label: "Show or hide the sidebar"),
            .init(keys: "⌘N", label: "New draft"),
            .init(keys: "⌘⇧N", label: "New learning project"),
            .init(keys: "⌘K", label: "Search — projects, notes, and traces"),
        ]),
        Group(title: "Document", items: [
            .init(keys: "⌘B", label: "Bold the selection"),
            .init(keys: "⌘I", label: "Italicize the selection"),
            .init(keys: "⌘U", label: "Underline the selection"),
            .init(keys: "# ␣", label: "Heading (## and ### for deeper levels)"),
            .init(keys: "❓", label: "Start a line with ❓ for an open question"),
        ]),
        Group(title: "Sources & reader", items: [
            .init(keys: "⌘O", label: "Open — import sources, read them in Loom"),
            .init(keys: "⌘F", label: "Find in the open source"),
            .init(keys: "⌘↑ / ⌘↓", label: "First / last page"),
            .init(keys: "⌘9 / ⌘0", label: "Fit width / actual size"),
            .init(keys: "⇧⌘F", label: "Reader full screen"),
            .init(keys: "Esc", label: "Close the reader (or the find bar first)"),
        ]),
        Group(title: "AI & review", items: [
            .init(keys: "⌘⇧E", label: "Ask Selection — quick question in a native window"),
            .init(keys: "⌃⇧G", label: "Review — second pass over the open draft"),
        ]),
        Group(title: "Help", items: [
            .init(keys: "⌘⇧?", label: "Toggle this window"),
            .init(keys: "Esc", label: "Close any open panel"),
        ]),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack(alignment: .firstTextBaseline) {
                    // Cormorant-italic display title instead of sans
                    // semibold — matches the Vellum chrome rule for
                    // chapter / section headings.
                    Text("Shortcuts")
                        .font(.custom("Cormorant Garamond", size: 22).italic())
                        .foregroundStyle(LoomTokens.ink)
                    Spacer()
                    Text("⌘⇧? toggle · Esc close")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(LoomTokens.muted)
                }
                .padding(.bottom, 6)
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(LoomTokens.hair)
                        .frame(height: 0.5)
                }

                ForEach(groups) { group in
                    VStack(alignment: .leading, spacing: 10) {
                        // Group header — serif small-caps, bronze,
                        // minimal tracking. Replaces the sans
                        // uppercase + kerning dashboard style.
                        Text(group.title)
                            .font(.system(size: 11, design: .serif).smallCaps())
                            .fontWeight(.medium)
                            .tracking(0.5)
                            .foregroundStyle(.secondary)
                        ForEach(group.items) { item in
                            HStack(alignment: .firstTextBaseline, spacing: 16) {
                                Text(item.keys)
                                    .font(.system(size: 11, design: .monospaced))
                                    .frame(minWidth: 108, alignment: .trailing)
                                    .foregroundStyle(LoomTokens.ink)
                                Text(item.label)
                                    .font(Font.system(size: 13, design: .serif))
                                    .foregroundStyle(LoomTokens.ink2)
                                Spacer(minLength: 0)
                            }
                        }
                    }
                }
            }
            .padding(28)
            .frame(maxWidth: 540, alignment: .leading)
        }
        // Vellum paper with the ambient foxing stacked on top — keeps
        // the window visually connected to the reading surfaces in
        // the main webview.
        .background(LoomTokens.paper)
        .frame(minWidth: 440, idealWidth: 480, minHeight: 420, idealHeight: 600)
        .onKeyPress(.escape) {
            dismissWindow(id: KeyboardHelpWindow.id)
            return .handled
        }
    }
}

enum KeyboardHelpWindow {
    static let id = "com.loom.window.keyboard-help"
}
