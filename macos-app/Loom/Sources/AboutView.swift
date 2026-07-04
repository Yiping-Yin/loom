import SwiftUI

/// Native "About Loom" window, replacing the default NSApp auto-generated
/// one. The surface follows the 2026 lunar-crystal app icon: a cold navy
/// field, a full squircle icon, and compact desktop controls instead of the
/// older book-frontispiece treatment.
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

    // MARK: Icon-era palette — direct sRGB values so the window reads the
    // same regardless of macOS appearance. About is an intentional brand
    // surface; it does not flip with light/dark mode.
    private let stageTop    = Color(.sRGB, red: 0x05/255.0, green: 0x0A/255.0, blue: 0x12/255.0, opacity: 1.0)
    private let stageBottom = Color(.sRGB, red: 0x0B/255.0, green: 0x17/255.0, blue: 0x27/255.0, opacity: 1.0)
    private let panel       = Color(.sRGB, red: 0x0D/255.0, green: 0x17/255.0, blue: 0x24/255.0, opacity: 1.0)
    private let ink         = Color(.sRGB, red: 0xF2/255.0, green: 0xF7/255.0, blue: 0xFF/255.0, opacity: 1.0)
    private let muted       = Color(.sRGB, red: 0x91/255.0, green: 0xA0/255.0, blue: 0xB2/255.0, opacity: 1.0)
    private let signalText  = Color(.sRGB, red: 0x87/255.0, green: 0xDE/255.0, blue: 0xFF/255.0, opacity: 1.0)
    private let rim         = Color(.sRGB, red: 0x41/255.0, green: 0x75/255.0, blue: 0xB1/255.0, opacity: 1.0)

    var body: some View {
        ZStack {
            iconEraBackground

            VStack(spacing: 0) {
                Spacer(minLength: 30)

                brandIcon

                Text("Loom")
                    .font(.system(size: 38, weight: .semibold, design: .rounded))
                    .foregroundStyle(ink)
                    .tracking(0)
                    .padding(.top, 18)

                Text("Sources become clear drafts.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(ink.opacity(0.82))
                    .padding(.top, 7)

                versionBadge
                    .padding(.top, 16)

                HStack(spacing: 8) {
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
                .padding(.top, 26)

                Spacer(minLength: 20)

                HStack(spacing: 8) {
                    Circle()
                        .fill(signalText)
                        .frame(width: 5, height: 5)
                        .shadow(color: signalText.opacity(0.75), radius: 6)
                    Text("Local first · one archive · © 2026")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(muted)
                }
                .padding(.bottom, 24)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 28)
        }
        .frame(width: 420, height: 540)
        .onKeyPress(.escape) {
            dismissWindow(id: AboutWindow.id)
            return .handled
        }
    }

    // MARK: - Components

    private var iconEraBackground: some View {
        ZStack {
            LinearGradient(
                colors: [stageTop, stageBottom],
                startPoint: .top,
                endPoint: .bottom
            )
            RadialGradient(
                colors: [signalText.opacity(0.22), .clear],
                center: UnitPoint(x: 0.52, y: 0.40),
                startRadius: 12,
                endRadius: 260
            )
            RadialGradient(
                colors: [rim.opacity(0.28), .clear],
                center: .bottom,
                startRadius: 20,
                endRadius: 320
            )
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(
                    LinearGradient(
                        colors: [Color.white.opacity(0.22), rim.opacity(0.40), Color.black.opacity(0.32)],
                        startPoint: .top,
                        endPoint: .bottom
                    ),
                    lineWidth: 1
                )
                .padding(1)
        }
        .ignoresSafeArea()
    }

    private var brandIcon: some View {
        Image(nsImage: NSApp.applicationIconImage)
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(width: 174, height: 174)
            .clipShape(RoundedRectangle(cornerRadius: 36, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 36, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.14), lineWidth: 1)
            }
            .shadow(color: signalText.opacity(0.34), radius: 28, x: 0, y: 18)
            .shadow(color: Color.black.opacity(0.62), radius: 22, x: 0, y: 16)
            .accessibilityHidden(true)
    }

    private var versionBadge: some View {
        Text(versionString)
            .font(.system(size: 11, weight: .medium, design: .monospaced))
            .foregroundStyle(muted)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background {
                Capsule()
                    .fill(panel.opacity(0.72))
                    .overlay {
                        Capsule()
                            .strokeBorder(rim.opacity(0.35), lineWidth: 0.8)
                    }
            }
    }

    private func linkButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(signalText)
                .frame(minWidth: 64)
                .padding(.vertical, 8)
                .background {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(panel.opacity(0.70))
                        .overlay {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .strokeBorder(rim.opacity(0.32), lineWidth: 0.8)
                        }
                }
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
