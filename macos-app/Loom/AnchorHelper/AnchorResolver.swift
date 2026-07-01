import Cocoa
import ApplicationServices

/// Performs the cross-app Accessibility read the sandboxed main app cannot.
/// Logic mirrors the proven probe in
/// docs/projects/active/2026-06-30-loom-anchor-probe.reference.swift:
/// focused window -> AXDocument (file) + AXTitle ("… — Page N of M").
final class AnchorResolver: NSObject, LoomAnchorHelperProtocol {
    func resolveAnchor(forPID pid: Int32, reply: @escaping ([String: String]) -> Void) {
        var result: [String: String] = [:]
        result["axTrusted"] = AXIsProcessTrusted() ? "1" : "0"

        let appElement = AXUIElementCreateApplication(pid)
        guard let window = copyElement(kAXFocusedWindowAttribute as String, from: appElement) else {
            reply(result)
            return
        }

        if let title = copyString(kAXTitleAttribute as String, from: window) {
            result["windowTitle"] = title
            if let range = title.range(of: #"Page (\d+) of (\d+)"#, options: .regularExpression) {
                let numbers = title[range]
                    .split(whereSeparator: { !$0.isNumber })
                    .compactMap { Int($0) }
                if numbers.count == 2 {
                    result["page"] = String(numbers[0])
                    result["pageCount"] = String(numbers[1])
                }
            }
        }
        if let document = copyString("AXDocument", from: window) {
            result["document"] = document
        }

        reply(result)
    }

    func revealAnchor(documentPath: String, page: Int32, reply: @escaping ([String: String]) -> Void) {
        var result: [String: String] = [:]
        result["axTrusted"] = AXIsProcessTrusted() ? "1" : "0"

        let url = URL(fileURLWithPath: documentPath)
        guard FileManager.default.fileExists(atPath: url.path) else {
            result["opened"] = "0"
            result["pageJump"] = "0"
            reply(result)
            return
        }

        NSWorkspace.shared.open(url)
        result["opened"] = "1"

        guard page > 0, AXIsProcessTrusted() else {
            result["pageJump"] = "0"
            reply(result)
            return
        }

        // Give the document app a moment to open/focus the file, then drive
        // its "Go to Page…" menu item via Accessibility. Preview names it
        // exactly that; if the frontmost app has no such item, degrade to
        // file-open only.
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.2) { [weak self] in
            let jumped = self?.driveGoToPage(page: Int(page)) ?? false
            result["pageJump"] = jumped ? "1" : "0"
            reply(result)
        }
    }

    private func driveGoToPage(page: Int) -> Bool {
        guard let frontmost = NSWorkspace.shared.frontmostApplication else { return false }
        let appElement = AXUIElementCreateApplication(frontmost.processIdentifier)

        guard let menuBar = copyElement(kAXMenuBarAttribute as String, from: appElement),
              let goToPageItem = findMenuItem(titled: "Go to Page", under: menuBar, depth: 0) else {
            return false
        }
        guard AXUIElementPerformAction(goToPageItem, kAXPressAction as CFString) == .success else {
            return false
        }

        // The page sheet focuses a text field; set its value and confirm.
        usleep(450_000)
        guard let focused = copyElement(kAXFocusedUIElementAttribute as String, from: appElement) else {
            return false
        }
        guard AXUIElementSetAttributeValue(focused, kAXValueAttribute as CFString, String(page) as CFTypeRef) == .success else {
            return false
        }
        if AXUIElementPerformAction(focused, kAXConfirmAction as CFString) == .success {
            return true
        }
        // Fallback: press the sheet's default button if confirm isn't exposed.
        if let window = copyElement(kAXFocusedWindowAttribute as String, from: appElement),
           let defaultButton = copyElement(kAXDefaultButtonAttribute as String, from: window),
           AXUIElementPerformAction(defaultButton, kAXPressAction as CFString) == .success {
            return true
        }
        return false
    }

    private func findMenuItem(titled fragment: String, under element: AXUIElement, depth: Int) -> AXUIElement? {
        guard depth < 5 else { return nil }
        var childrenRef: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef) == .success,
              let children = childrenRef as? [AXUIElement] else { return nil }
        for child in children {
            if let title = copyString(kAXTitleAttribute as String, from: child),
               title.localizedCaseInsensitiveContains(fragment) {
                return child
            }
            if let found = findMenuItem(titled: fragment, under: child, depth: depth + 1) {
                return found
            }
        }
        return nil
    }

    private func copyElement(_ attribute: String, from element: AXUIElement) -> AXUIElement? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success,
              let value, CFGetTypeID(value) == AXUIElementGetTypeID() else { return nil }
        return (value as! AXUIElement)
    }

    private func copyString(_ attribute: String, from element: AXUIElement) -> String? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success,
              let string = value as? String, !string.isEmpty else { return nil }
        return string
    }
}
