import Foundation
import os

/// App-side client for the non-sandboxed LoomAnchorHelper XPC service.
/// The main app stays fully sandboxed; only the tiny helper holds the
/// cross-app Accessibility capability (and needs its own Accessibility
/// grant in System Settings, separate from the app's).
enum LoomAnchorHelperClient {
    private static let log = Logger(subsystem: "com.yinyiping.loom", category: "anchor-helper")
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

        log.info("anchor-helper: connecting for pid \(pid, privacy: .public)")
        let semaphore = DispatchSemaphore(value: 0)
        var payload: [String: String]?
        let proxy = connection.remoteObjectProxyWithErrorHandler { error in
            Self.log.error("anchor-helper: xpc error \(String(describing: error), privacy: .public)")
            semaphore.signal()
        } as? LoomAnchorHelperProtocol
        guard let proxy else {
            log.error("anchor-helper: proxy cast failed")
            return nil
        }

        proxy.resolveAnchor(forPID: Int32(pid)) { reply in
            payload = reply
            semaphore.signal()
        }
        let waited = semaphore.wait(timeout: .now() + timeout)
        guard waited == .success, let payload else {
            log.error("anchor-helper: \(waited == .success ? "nil payload" : "timeout", privacy: .public)")
            return nil
        }
        log.info("anchor-helper: reply keys \(payload.keys.sorted().joined(separator: ","), privacy: .public) trusted=\(payload["axTrusted"] ?? "?", privacy: .public)")

        return HelperAnchor(
            documentURL: documentURL(from: payload["document"]),
            page: payload["page"].flatMap(Int.init),
            pageCount: payload["pageCount"].flatMap(Int.init),
            windowTitle: payload["windowTitle"],
            axTrusted: payload["axTrusted"] == "1"
        )
    }

    /// Fire-and-forget reveal: open the document and, when the helper is
    /// AX-trusted, land on the captured page. The UI never waits on this —
    /// the file open itself happens in the helper either way.
    static func revealAnchor(documentURL: URL, page: Int?) {
        let connection = NSXPCConnection(serviceName: serviceName)
        connection.remoteObjectInterface = NSXPCInterface(with: LoomAnchorHelperProtocol.self)
        connection.resume()
        guard let proxy = connection.remoteObjectProxyWithErrorHandler({ error in
            Self.log.error("anchor-helper: reveal xpc error \(String(describing: error), privacy: .public)")
            connection.invalidate()
        }) as? LoomAnchorHelperProtocol else {
            connection.invalidate()
            return
        }
        proxy.revealAnchor(documentPath: documentURL.path, page: Int32(page ?? 0)) { reply in
            Self.log.info("anchor-helper: reveal opened=\(reply["opened"] ?? "?", privacy: .public) pageJump=\(reply["pageJump"] ?? "?", privacy: .public) trusted=\(reply["axTrusted"] ?? "?", privacy: .public)")
            connection.invalidate()
        }
    }

    private static func documentURL(from raw: String?) -> URL? {
        guard let raw, !raw.isEmpty else { return nil }
        if raw.hasPrefix("file://"), let url = URL(string: raw) { return url }
        if raw.hasPrefix("/") { return URL(fileURLWithPath: raw) }
        return URL(string: raw)
    }
}
