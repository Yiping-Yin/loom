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
}
