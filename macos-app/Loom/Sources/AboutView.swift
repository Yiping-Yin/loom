import SwiftUI

/// Native "About Loom" window, replacing the default NSApp auto-generated
/// one. A STAGE surface: self-luminous cool-black canvas, the bare moon
/// disc as the brand mark, 青芒 cyan as the only signal colour, system
/// serif throughout (custom fonts are never bundled here — .custom would
/// silently fall back and lie).
///
/// Opens via the App menu's "About Loom" item (standard macOS position).
/// The menu item is registered via `CommandGroup(replacing: .appInfo)` in
/// LoomApp; the window itself is a SwiftUI Window scene with hidden title
/// bar and a fixed 420×540 content size.
struct AboutView: View {
    @Environment(\.openWindow) private var openWindow
    // Esc closes — matches KeyboardHelpView's "Esc · Close any open
    // panel" convention (2026-04-23 audit). Previously the About
    // window could only be dismissed via the title-bar close button.
    @Environment(\.dismissWindow) private var dismissWindow

    // MARK: Stage palette — direct sRGB values so the window reads the
    // same regardless of macOS appearance. About is a STAGE surface
    // (self-luminous, black canvas); it does not flip with light/dark.
    // Accent = 青芒 signature cyan (#4BC5DE) with the brighter data cyan
    // (#6CE7F2) for link text — the gold era is over.
    private let paper       = Color(.sRGB, red: 0x07/255.0, green: 0x09/255.0, blue: 0x0C/255.0, opacity: 1.0)
    private let ink         = Color(.sRGB, red: 0xE6/255.0, green: 0xE9/255.0, blue: 0xEE/255.0, opacity: 1.0)
    private let muted       = Color(.sRGB, red: 0x9B/255.0, green: 0xA3/255.0, blue: 0xAE/255.0, opacity: 1.0)
    private let signalText  = Color(.sRGB, red: 0x6C/255.0, green: 0xE7/255.0, blue: 0xF2/255.0, opacity: 1.0)

    var body: some View {
        ZStack {
            paper.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 40)

                // The brand mark IS the moon — the bare disc, not the app
                // icon's squircle container. applicationIconImage carries
                // system margin (the disc is ~57% of its canvas), so draw
                // it oversized inside a smaller frame and let the circular
                // clip cut everything but the moon and its 青芒 arc.
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .interpolation(.high)
                    .scaledToFill()
                    .frame(width: 231, height: 231)
                    .frame(width: 132, height: 132)
                    .clipShape(Circle())
                    .accessibilityHidden(true)

                Text("Loom")
                    .font(.system(size: 32, weight: .semibold, design: .serif))
                    .foregroundStyle(ink)
                    .padding(.top, 4)

                // Version line — monospaced, muted.
                Text(versionString)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(muted)
                    .padding(.top, 10)

                // ONE tagline. (The platform restatement said the same
                // thing twice; clean copy keeps the living line only.)
                Text("A living knowledge identity.")
                    .font(.system(size: 17, design: .serif).italic())
                    .foregroundStyle(ink.opacity(0.88))
                    .padding(.top, 22)

                hairRule
                    .padding(.top, 22)

                // "Made by" block — small-caps eyebrow + body line.
                VStack(spacing: 6) {
                    Text("Made by")
                        .font(.system(size: 10, weight: .medium))
                        .kerning(3.2)
                        .textCase(.uppercase)
                        .foregroundStyle(muted)

                    Text("One person, with care.")
                        .font(.system(size: 14, design: .serif))
                        .foregroundStyle(ink.opacity(0.82))
                }
                .padding(.top, 16)

                hairRule
                    .padding(.top, 18)

                // Text links — Privacy + Help + History + Colophon, in the
                // data cyan. Colophon is the book's back matter (type,
                // palette, hand); it opens at /colophon so it stays
                // consistent with the other reading surfaces.
                HStack(spacing: 28) {
                    linkButton("Privacy") {
                        if let url = URL(string: "https://loom.app/privacy") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    linkButton("Help") {
                        openWindow(id: KeyboardHelpWindow.id)
                    }
                    linkButton("History") {
                        // History renders ON the main window's glass
                        // (owner 2026-07-04: one pane, not two pages).
                        NotificationCenter.default.post(name: .loomShowHistoryOnGlass, object: nil)
                        dismissWindow(id: AboutWindow.id)
                    }
                    linkButton("Colophon") {
                        NotificationCenter.default.post(
                            name: .loomShuttleNavigate,
                            object: nil,
                            userInfo: ["path": "/colophon"]
                        )
                    }
                }
                .padding(.top, 16)

                Spacer(minLength: 20)

                // Footer — serif italic, muted.
                Text("© 2026 · All rights respected")
                    .font(.system(size: 12, design: .serif).italic())
                    .foregroundStyle(muted)
                    .padding(.bottom, 26)
            }
            .frame(maxWidth: .infinity)
        }
        .frame(width: 420, height: 540)
        .onKeyPress(.escape) {
            dismissWindow(id: AboutWindow.id)
            return .handled
        }
    }

    // MARK: - Components

    /// Hair-rule divider — a 1px line, ~88pt wide, muted. Never full-width:
    /// stage rules breathe.
    private var hairRule: some View {
        Rectangle()
            .fill(muted.opacity(0.35))
            .frame(width: 88, height: 0.5)
            .accessibilityHidden(true)
    }

    /// Text link in the data cyan — 青芒 is the only signal colour on the
    /// stage. Plain button so it never takes the system accent.
    private func linkButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, design: .serif))
                .foregroundStyle(signalText)
                .underline(false)
        }
        .buttonStyle(.plain)
        .pointerStyleLink()
    }

    // MARK: - Strings

    private var versionString: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(short) · build \(build)"
    }
}

/// Tiny cross-version helper so the link buttons show the pointing-hand
/// cursor on hover without requiring macOS 15's `.pointerStyle` API.
private extension View {
    @ViewBuilder
    func pointerStyleLink() -> some View {
        self.onHover { inside in
            if inside { NSCursor.pointingHand.push() } else { NSCursor.pop() }
        }
    }
}

enum AboutWindow {
    static let id = "com.loom.window.about"
}

extension Notification.Name {
    /// About's History link asks the main window to show the history
    /// surface on its own glass — one pane, not a second page.
    static let loomShowHistoryOnGlass = Notification.Name("loomShowHistoryOnGlass")
}
