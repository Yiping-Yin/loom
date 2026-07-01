import Foundation

/// App-side client for the non-sandboxed LoomAnchorHelper XPC service.
/// The main app stays fully sandboxed; only the tiny helper holds the
/// cross-app Accessibility capability (and needs its own Accessibility
/// grant in System Settings, separate from the app's).
enum LoomAnchorHelperClient {
    struct HelperAnchor {
        let documentURL: URL?
        let page: Int?
        let pageCount: Int?
        let windowTitle: String?
        let axTrusted: Bool
    }

    static let serviceName = "com.yinyiping.loom.AnchorHelper"

    /// Synchronous resolve with a hard timeout so the Services capture path
    /// can never hang on a wedged helper. Replies arrive on an XPC queue,
    /// so waiting briefly here is safe even from the main thread.
    static func resolveAnchor(forPID pid: pid_t, timeout: TimeInterval = 0.9) -> HelperAnchor? {
        let connection = NSXPCConnection(serviceName: serviceName)
        connection.remoteObjectInterface = NSXPCInterface(with: LoomAnchorHelperProtocol.self)
        connection.resume()
        defer { connection.invalidate() }

        let semaphore = DispatchSemaphore(value: 0)
        var payload: [String: String]?
        let proxy = connection.remoteObjectProxyWithErrorHandler { _ in
            semaphore.signal()
        } as? LoomAnchorHelperProtocol
        guard let proxy else { return nil }

        proxy.resolveAnchor(forPID: Int32(pid)) { reply in
            payload = reply
            semaphore.signal()
        }
        guard semaphore.wait(timeout: .now() + timeout) == .success, let payload else { return nil }

        return HelperAnchor(
            documentURL: documentURL(from: payload["document"]),
            page: payload["page"].flatMap(Int.init),
            pageCount: payload["pageCount"].flatMap(Int.init),
            windowTitle: payload["windowTitle"],
            axTrusted: payload["axTrusted"] == "1"
        )
    }

    private static func documentURL(from raw: String?) -> URL? {
        guard let raw, !raw.isEmpty else { return nil }
        if raw.hasPrefix("file://"), let url = URL(string: raw) { return url }
        if raw.hasPrefix("/") { return URL(fileURLWithPath: raw) }
        return URL(string: raw)
    }
}
