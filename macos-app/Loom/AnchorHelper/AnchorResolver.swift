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
