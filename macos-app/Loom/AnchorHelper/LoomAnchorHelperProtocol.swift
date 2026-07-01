import Foundation

/// XPC contract between the sandboxed Loom app and the non-sandboxed
/// LoomAnchorHelper service. The sandbox blocks cross-app Accessibility
/// reads inside the app, so the helper performs the read and hands back a
/// plain string map (property-list-safe across XPC).
///
/// Keys in the reply dictionary (absent = unavailable):
///   axTrusted   "1"/"0" — AXIsProcessTrusted() inside the helper
///   windowTitle focused window AXTitle
///   document    focused window AXDocument (file URL string or path)
///   page        current page parsed from the title ("Page N of M")
///   pageCount   total pages parsed from the title
@objc(LoomAnchorHelperProtocol) public protocol LoomAnchorHelperProtocol {
    func resolveAnchor(forPID pid: Int32, reply: @escaping ([String: String]) -> Void)

    /// Reveal the anchor back in the native app: open the document with the
    /// system-default app and, when a page is known and Accessibility is
    /// granted, drive the PDF app's "Go to Page…" so the user lands on the
    /// captured page instead of page 1. Degrades honestly: reply carries
    ///   opened    "1"/"0" — the file open succeeded
    ///   pageJump  "1"/"0" — the page navigation succeeded
    ///   axTrusted "1"/"0"
    func revealAnchor(documentPath: String, page: Int32, reply: @escaping ([String: String]) -> Void)
}
