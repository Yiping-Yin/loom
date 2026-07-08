import SwiftUI
import AppKit

// Extracted 2026-07-08 (partition batch 2) from ContentView.swift — the live
// main-window chrome styler (LoomReflectionRootView uses it). Pure move.

/// Makes the title bar transparent and lets the web surface occupy the full content view.
struct WindowConfigurator: NSViewRepresentable {
    let title: String
    let isNight: Bool
    /// Minimal mode extends the root canvas under the hidden titlebar so
    /// the shell owns every pixel of top chrome.
    var contentExtendsUnderTitlebar: Bool = false
    /// Legacy ContentView may keep its toolbar, but minimal mode must be
    /// able to opt out of the scene-managed NSWindow toolbar entirely —
    /// macOS otherwise re-inserts an empty toolbar strip above Draft in
    /// fullscreen/windowed transitions.
    var removesSystemToolbar: Bool = false
    /// Optional hard clip for custom full-window shells that must align
    /// their visual rounded corners with the actual NSWindow content.
    var contentCornerRadius: CGFloat = 0
    /// Some full-window product shells own a strict screenshot baseline
    /// and must not inherit old restored window sizes.
    var usesFrameAutosave: Bool = true

    private func configure(_ window: NSWindow) {
        window.tabbingMode = .disallowed
        if window.tabGroup?.isTabBarVisible == true {
            window.toggleTabBar(nil)
        }
        // Glass law (2026-07-03): the window INHERITS the system appearance
        // — never pinned. The old isNight pin created a lock-in loop (pinned
        // window -> colorScheme stays dark -> isNight stays true), so the
        // workbench ignored the system's day/night switch.
        window.appearance = nil
        window.titlebarAppearsTransparent = contentExtendsUnderTitlebar
        // Hide the NSWindow-rendered title entirely. macOS draws
        // that text using a mechanism that doesn't follow our
        // `.toolbarColorScheme`/`containerBackground` stack on
        // current macOS — we saw "Loom" stay dark on night chrome even
        // with window.appearance = .darkAqua set. The title is
        // re-rendered in-window so it inherits the chrome's color
        // scheme cleanly.
        window.titleVisibility = .hidden
        if contentExtendsUnderTitlebar {
            window.styleMask.insert(.fullSizeContentView)
        } else {
            window.styleMask.remove(.fullSizeContentView)
        }
        if removesSystemToolbar {
            window.toolbar = nil
            clearTitlebarAccessories(window)
            window.standardWindowButton(.toolbarButton)?.isHidden = true
        }
        if contentCornerRadius > 0 {
            window.isOpaque = false
            window.backgroundColor = .clear
            window.contentView?.wantsLayer = true
            window.contentView?.layer?.cornerRadius = contentCornerRadius
            window.contentView?.layer?.cornerCurve = .continuous
            window.contentView?.layer?.masksToBounds = true
        } else {
            window.backgroundColor = NSColor.windowBackgroundColor
        }
        // Custom chrome must not opt the window out of macOS fullscreen;
        // Window > Enter Full Screen stays available for Draft.
        window.collectionBehavior.insert(.fullScreenPrimary)
        window.isMovableByWindowBackground = true
        window.title = "Loom"  // keep the system window title stable; page title stays in the chrome
        if usesFrameAutosave {
            // Remember window size and position across launches.
            window.setFrameAutosaveName("LoomMainWindow")
        }
    }

    /// macOS can restore accessory titlebar chrome separately from
    /// `window.toolbar`. Clear it through the guarded runtime selector —
    /// SwiftUI's AppKitWindow subclass may not implement the setter, and
    /// direct assignment crashes in the installed app.
    private func clearTitlebarAccessories(_ window: NSWindow) {
        let selector = Selector(("setTitlebarAccessoryViewControllers:"))
        guard window.responds(to: selector) else { return }
        window.perform(selector, with: [] as NSArray)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        configureWhenAttached(to: view, coordinator: context.coordinator)
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        configureWhenAttached(to: nsView, coordinator: context.coordinator)
    }

    /// Applies the chrome contract to the attached window and refreshes
    /// the coordinator's notification observers so fullscreen/space
    /// transitions keep the currently attached main window in contract.
    private func configureWhenAttached(to view: NSView, coordinator: Coordinator) {
        DispatchQueue.main.async {
            guard let window = view.window else { return }
            configure(window)
            coordinator.observe(window: window) { [weak window] in
                guard let window else { return }
                configure(window)
            }
        }
    }

    /// Keeps fullscreen window chrome in contract after the initial
    /// mount. macOS can restore toolbar/titlebar chrome during
    /// fullscreen entry/exit, focus changes, Tahoe Fill resizes, and
    /// display/space moves — each notification reasserts the contract
    /// immediately and again after the window-management animations
    /// settle.
    final class Coordinator {
        private var observers: [NSObjectProtocol] = []
        private weak var observedWindow: NSWindow?
        private var reapply: (() -> Void)?

        func observe(window: NSWindow, reapply: @escaping () -> Void) {
            self.reapply = reapply
            guard observedWindow !== window else { return }
            detach()
            observedWindow = window
            let names: [Notification.Name] = [
                NSWindow.didEnterFullScreenNotification,
                NSWindow.didExitFullScreenNotification,
                NSWindow.didBecomeKeyNotification,
                NSWindow.didResizeNotification,
                NSWindow.didChangeScreenNotification,
            ]
            for name in names {
                let token = NotificationCenter.default.addObserver(
                    forName: name,
                    object: window,
                    queue: .main
                ) { [weak self] _ in
                    self?.reapplyNowAndAfterAnimations()
                }
                observers.append(token)
            }
        }

        private func reapplyNowAndAfterAnimations() {
            reapply?()
            // Window-management animations can reinsert chrome after the
            // current 0.75s repair window; sweep again at 2s.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) { [weak self] in
                self?.reapply?()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                self?.reapply?()
            }
        }

        private func detach() {
            for token in observers {
                NotificationCenter.default.removeObserver(token)
            }
            observers.removeAll()
        }

        deinit {
            detach()
        }
    }
}
