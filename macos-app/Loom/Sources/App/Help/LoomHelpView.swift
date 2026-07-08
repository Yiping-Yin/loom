import SwiftUI

/// "Loom Help" — the app's getting-started guide, opened from the Help menu.
/// A calm, honest, one-screen orientation (not a manual): what Loom is for and
/// the three moves that make it work. Rendered as a standalone content-sized
/// Window with `.paperChrome()`, like Keyboard Shortcuts and Set up captures.
/// Opened via `@Environment(\.openWindow)` + `openWindow(id: LoomHelpWindow.id)`;
/// Esc closes it.
struct LoomHelpView: View {
    @Environment(\.dismissWindow) private var dismissWindow

    private struct Move: Identifiable {
        let id = UUID()
        let step: String
        let title: String
        let body: String
    }

    private let moves: [Move] = [
        Move(step: "1",
             title: "Read thick",
             body: "Bring a source in — drop a PDF, or capture a passage from Preview or the browser. The original file stays primary; Loom records anchored traces around it."),
        Move(step: "2",
             title: "Read thin",
             body: "Select in the source and save it as a note. Each note keeps a two-way anchor to the exact place it came from — click the note to jump back, click the source to see the note."),
        Move(step: "3",
             title: "Make it yours",
             body: "Your notes assemble into a record shaped like the source, not an inbox. Over time it becomes a self that can speak from what you've read."),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Getting started")
                        .font(.system(size: 20, weight: .semibold))
                    Text("Loom turns what you read into what you know.")
                        .font(.system(size: 13.5))
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 16) {
                    ForEach(moves) { move in
                        HStack(alignment: .top, spacing: 12) {
                            Text(move.step)
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(.secondary)
                                .frame(width: 20, height: 20)
                                .background(Circle().fill(.quinary))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(move.title)
                                    .font(.system(size: 13.5, weight: .semibold))
                                Text(move.body)
                                    .font(.system(size: 12.5))
                                    .foregroundStyle(.secondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Around the workspace")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.secondary)
                    helpRow("person.crop.circle", "You", "Your evidenced self — education, experience, and the knowledge you've built. Open it from the bottom-left of the sidebar.")
                    helpRow("info.circle", "About Loom", "What this app is, and its version.")
                    helpRow("gearshape", "Settings", "Providers, data, and capture — ⌘,")
                    helpRow("keyboard", "Keyboard Shortcuts", "The full list — ⌘⇧?")
                }

                Divider()

                // Capturing — folded in from the retired "Set up captures"
                // window (one Help window, Apple convention).
                VStack(alignment: .leading, spacing: 8) {
                    Text("Capturing from the web")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.secondary)
                    helpRow("cursorarrow.click.2", "Capture a page", "On any web page, click the L button — Loom comes forward with the capture sheet pre-filled (title, URL, content). Shift-L captures reader-only; ⌘L keeps scripts.")
                    helpRow("text.badge.checkmark", "Select first", "A selection always wins over auto-extraction when you only need a passage.")
                    helpRow("puzzlepiece.extension", "If the L is missing", "The extension isn't running on that tab — reload the extension, then refresh the page. Interactive setup lives in Settings → Capture.")
                }

                Text("Everything is local, on your device. No account, no sign-in.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(.tertiary)
                    .padding(.top, 2)
            }
            .padding(28)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(width: 460, height: 700)
        // Esc closes — registered as the window's cancel action (focus-independent,
        // unlike .onKeyPress which needs a focused responder this static guide lacks).
        .background {
            Button("Close") { dismissWindow(id: LoomHelpWindow.id) }
                .keyboardShortcut(.cancelAction)
                .opacity(0)
                .accessibilityHidden(true)
        }
    }

    @ViewBuilder
    private func helpRow(_ symbol: String, _ title: String, _ body: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 13))
                .foregroundStyle(.secondary)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 12.5, weight: .medium))
                Text(body).font(.system(size: 12)).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

enum LoomHelpWindow {
    static let id = "com.loom.window.help"
}
