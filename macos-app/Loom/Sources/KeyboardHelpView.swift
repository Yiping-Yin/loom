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

    let groups: [Group] = [
        Group(title: "Reading", items: [
            .init(keys: "✦ click", label: "Ask AI about the selection"),
            .init(keys: "⌘⇧A", label: "Save the selection as a reader note"),
            .init(keys: "⌘ click", label: "Save directly from the source line"),
            .init(keys: "⌥ click", label: "Highlight the selection"),
            .init(keys: "⌘/", label: "Open reader notes for the current source"),
            .init(keys: "⌘⇧.", label: "Correct a typo / mis-extraction in the source"),
        ]),
        Group(title: "AI", items: [
            .init(keys: "Write", label: "Draft from your sources · ⌘K shape · ⌘S save"),
            .init(keys: "Ask", label: "Check a reader note · ⌘↩ submit"),
            .init(keys: "Add source", label: "Drop files into Sources"),
            .init(keys: "Export", label: "Download notes as JSON or Markdown"),
        ]),
        Group(title: "Navigation", items: [
            .init(keys: "⌘K", label: "Open Shuttle — search everything"),
            .init(keys: "⌘E", label: "Review — ask AI about the selection"),
            .init(keys: "⌘⇧E", label: "Ask Selection — quick question in a native window"),
            .init(keys: "⌘⇧R", label: "Source practice — write from memory"),
            .init(keys: "⌘⇧X", label: "Source check — AI reviews your answer"),
            .init(keys: "⌘⇧I", label: "Add files — drop or pick PDFs, DOCX, slides, Pages, Markdown, and images"),
            .init(keys: "⌘N", label: "New topic"),
            .init(keys: "⌘[", label: "Back"),
            .init(keys: "⌘]", label: "Forward"),
            .init(keys: "⌘R", label: "Reload"),
            .init(keys: "⌘⇧O", label: "Open current page in default browser"),
            .init(keys: "Esc", label: "Close any open panel"),
            .init(keys: "⌘⇧?", label: "Toggle this help"),
        ]),
        Group(title: "View", items: [
            .init(keys: "⌘+", label: "Zoom in"),
            .init(keys: "⌘-", label: "Zoom out"),
            .init(keys: "⌘0", label: "Actual size"),
            .init(keys: "⌃⌘S", label: "Toggle Sidebar"),
            .init(keys: "⌘⇧⌥R", label: "Reload sources"),
        ]),
        Group(title: "Workspaces", items: [
            .init(keys: "⌘1", label: "Home"),
            .init(keys: "⌘2", label: "Sources"),
            .init(keys: "⌘3", label: "Draft"),
        ]),
        Group(title: "Draft and notes", items: [
            .init(keys: "⌘⇧P", label: "Add question — add a question you're holding"),
            .init(keys: "⌘⇧D", label: "Add draft card — place a thesis / counter / question"),
            .init(keys: "⌘⇧L", label: "Connect draft cards — draw support or related edge"),
            .init(keys: "⌘⇧W", label: "Connect reader notes — add explicit relation between notes"),
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
                            .foregroundStyle(LoomTokens.thread)
                        ForEach(group.items) { item in
                            HStack(alignment: .firstTextBaseline, spacing: 16) {
                                Text(item.keys)
                                    .font(.system(size: 11, design: .monospaced))
                                    .frame(minWidth: 108, alignment: .trailing)
                                    .foregroundStyle(LoomTokens.ink)
                                Text(item.label)
                                    .font(Font.custom("EB Garamond", size: 13))
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
