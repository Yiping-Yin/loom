import Cocoa
import ApplicationServices

// Anchor-precision prototype: can a NON-sandboxed reader get a real
// file + page anchor from the frontmost document app via Accessibility,
// so the main (sandboxed) Loom app could receive it from a tiny helper?

func attr(_ el: AXUIElement, _ a: String) -> CFTypeRef? {
    var v: CFTypeRef?
    return AXUIElementCopyAttributeValue(el, a as CFString, &v) == .success ? v : nil
}
func attrNames(_ el: AXUIElement) -> [String] {
    var names: CFArray?
    guard AXUIElementCopyAttributeNames(el, &names) == .success,
          let arr = names as? [String] else { return [] }
    return arr
}

let trusted = AXIsProcessTrusted()
print("AXIsProcessTrusted:", trusted)
if !trusted {
    print("=> this process lacks Accessibility permission; AX reads will fail.")
}

let target = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "com.apple.Preview"
guard let app = NSWorkspace.shared.runningApplications.first(where: { $0.bundleIdentifier == target }) else {
    print("Target app \(target) not running."); exit(1)
}
print("target pid:", app.processIdentifier, "name:", app.localizedName ?? "?")
let appEl = AXUIElementCreateApplication(app.processIdentifier)

guard let winRef = attr(appEl, kAXFocusedWindowAttribute as String) else {
    print("no focused window (AX blocked or none)"); exit(0)
}
let win = winRef as! AXUIElement
print("\n--- focused window attributes ---")
print("attr names:", attrNames(win))
print("AXTitle:", attr(win, kAXTitleAttribute as String) as? String ?? "nil")
// AXDocument = the file path/URL of the document in the window (the prize)
print("AXDocument:", attr(win, "AXDocument") as? String ?? "nil")
print("AXURL:", String(describing: attr(win, "AXURL")))
print("AXFilename:", attr(win, "AXFilename") as? String ?? "nil")

// Page number: scan the focused UI element + look for page-ish values
print("\n--- focused element (page hints) ---")
if let feRef = attr(appEl, kAXFocusedUIElementAttribute as String) {
    let fe = feRef as! AXUIElement
    print("focused role:", attr(fe, kAXRoleAttribute as String) as? String ?? "nil")
    print("focused value:", String(describing: attr(fe, kAXValueAttribute as String)))
    print("focused attr names:", attrNames(fe))
}
// === Resolve a clean anchor from what AX gave us (the deliverable) ===
print("\n=== RESOLVED ANCHOR (what a non-sandboxed helper would hand the sandboxed app) ===")
let title = attr(win, kAXTitleAttribute as String) as? String ?? ""
let doc = attr(win, "AXDocument") as? String
var page: Int? = nil, pageCount: Int? = nil
if let r = title.range(of: #"Page (\d+) of (\d+)"#, options: .regularExpression) {
    let nums = title[r].split(whereSeparator: { !$0.isNumber }).compactMap { Int($0) }
    if nums.count == 2 { page = nums[0]; pageCount = nums[1] }
}
let fileURL = doc.flatMap { URL(string: $0) }
let fileName = fileURL?.lastPathComponent.removingPercentEncoding
let precision = (doc != nil && page != nil) ? "file+page"
              : (doc != nil ? "file" : "app/window")
print("file:      ", fileName ?? "nil")
print("path:      ", fileURL?.path ?? "nil")
print("page:      ", page.map(String.init) ?? "nil")
print("pageCount: ", pageCount.map(String.init) ?? "nil")
print("precision: ", precision, precision == "file+page" ? "  ✅ PROVEN" : "")
