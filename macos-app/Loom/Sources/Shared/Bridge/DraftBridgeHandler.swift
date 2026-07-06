import Foundation
import WebKit

/// Reply bridge backing web `/draft` with the native `LoomDraftStore` inside
/// the installed app. The shipped Loom app has no Next.js API server and the
/// static WebView would otherwise keep its drafts in `localStorage`, splitting
/// them from the native JSON store at `Drafts/drafts.json`. Routing web Draft
/// `list` / `create` / `update` through here means web Draft editing and native
/// Draft editing share one on-disk store.
///
/// JS (`lib/new-loom/native-draft-client.ts`):
///   `window.webkit.messageHandlers.loomDrafts.postMessage({ action, ... })`
///     - `{ action: "list" }`   -> `[NewLoomDraftRecord]`
///     - `{ action: "create", title?, body?, references? }` -> `NewLoomDraftRecord`
///     - `{ action: "update", id, title?, body?, references? }` -> `NewLoomDraftRecord`
///
/// Records are serialized to the web `NewLoomDraftRecord` shape: `id` is the
/// lowercased UUID string, `createdAt` / `updatedAt` are ISO-8601 strings, and
/// references carry the same href / label / kind / capture / artifact-state
/// metadata the web type expects.
@MainActor
final class DraftBridgeHandler: NSObject, WKScriptMessageHandlerWithReply {
    static let name = "loomDrafts"

    private let store: LoomDraftStore
    private let isoFormatter: ISO8601DateFormatter

    init(store: LoomDraftStore = LoomDraftStore()) {
        self.store = store
        self.isoFormatter = ISO8601DateFormatter()
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage,
        replyHandler: @escaping (Any?, String?) -> Void
    ) {
        guard let payload = message.body as? [String: Any],
              let action = payload["action"] as? String else {
            replyHandler(nil, "missing action")
            return
        }

        do {
            switch action {
            case "list":
                let drafts = try store.list()
                replyHandler(drafts.map(encode), nil)
            case "create":
                let created = try store.create(
                    title: cleanTitle(payload["title"]),
                    body: payload["body"] as? String ?? "",
                    references: decodeReferences(payload["references"])
                )
                replyHandler(encode(created), nil)
            case "update":
                let updated = try applyUpdate(payload)
                replyHandler(encode(updated), nil)
            default:
                replyHandler(nil, "unknown action: \(action)")
            }
        } catch {
            replyHandler(nil, error.localizedDescription)
        }
    }

    /// `update` carries a patch: only the supplied fields change. Title / body
    /// default to the stored draft's current values so a references-only patch
    /// doesn't blank the body and vice versa.
    ///
    /// Internal (not private) so `LoomDraftStoreTests` can verify the inbound
    /// `includedInDigitalMe` decode without constructing a `WKScriptMessage`.
    func applyUpdate(_ payload: [String: Any]) throws -> LoomDraftRecord {
        guard let id = payload["id"] as? String, let uuid = UUID(uuidString: id) else {
            throw error("update missing draft id")
        }
        let drafts = try store.list()
        guard let current = drafts.first(where: { $0.id == uuid }) else {
            throw error("unknown draft id")
        }
        let nextTitle = (payload["title"] as? String).map(normalizedTitleInput) ?? current.title
        let nextBody = payload["body"] as? String ?? current.body
        let nextReferences = payload.keys.contains("references")
            ? decodeReferences(payload["references"])
            : current.references
        let nextIncluded = payload["includedInDigitalMe"] as? Bool ?? current.includedInDigitalMe
        return try store.update(
            current,
            title: nextTitle,
            body: nextBody,
            references: nextReferences,
            includedInDigitalMe: nextIncluded
        )
    }

    private func cleanTitle(_ raw: Any?) -> String {
        guard let title = (raw as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
              !title.isEmpty else {
            return "Untitled draft"
        }
        return title
    }

    private func normalizedTitleInput(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Untitled draft" : trimmed
    }

    private func error(_ message: String) -> NSError {
        NSError(domain: "LoomDrafts", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

    // MARK: - Serialization to the web NewLoomDraftRecord shape

    /// Internal (not private) so `LoomDraftStoreTests` can verify that the reply
    /// record echoes `includedInDigitalMe` back to the web bridge.
    func encode(_ record: LoomDraftRecord) -> [String: Any] {
        var dict: [String: Any] = [
            "id": record.id.uuidString.lowercased(),
            "title": record.title,
            "body": record.body,
            "references": record.references.map(encode),
            "createdAt": isoFormatter.string(from: record.createdAt),
            "updatedAt": isoFormatter.string(from: record.updatedAt),
        ]
        if let included = record.includedInDigitalMe { dict["includedInDigitalMe"] = included }
        return dict
    }

    private func encode(_ reference: LoomDraftReference) -> [String: Any] {
        var dict: [String: Any] = [
            "label": reference.label,
            "href": reference.href,
        ]
        if let kind = reference.kind { dict["kind"] = kind }
        if let sourceTitle = reference.sourceTitle { dict["sourceTitle"] = sourceTitle }
        if let category = reference.category { dict["category"] = category }
        if let sourcePath = reference.sourcePath { dict["sourcePath"] = sourcePath }
        if let excerpt = reference.excerpt { dict["excerpt"] = excerpt }
        if let capturedAt = reference.capturedAt { dict["capturedAt"] = capturedAt }
        if let artifactState = reference.artifactState {
            dict["artifactState"] = encode(artifactState)
        }
        return dict
    }

    private func encode(_ state: LoomDraftArtifactState) -> [String: Any] {
        var dict: [String: Any] = ["targetId": state.targetId]
        if let kind = state.kind { dict["kind"] = kind }
        if let label = state.label { dict["label"] = label }
        if let value = state.state { dict["state"] = value }
        if let stateLabel = state.stateLabel { dict["stateLabel"] = stateLabel }
        return dict
    }

    // MARK: - Decoding inbound references

    private func decodeReferences(_ raw: Any?) -> [LoomDraftReference] {
        guard let array = raw as? [[String: Any]] else { return [] }
        return array.compactMap(decodeReference)
    }

    private func decodeReference(_ dict: [String: Any]) -> LoomDraftReference? {
        guard let href = dict["href"] as? String, !href.isEmpty else { return nil }
        let label = (dict["label"] as? String) ?? href
        return LoomDraftReference(
            label: label,
            href: href,
            kind: dict["kind"] as? String,
            sourceTitle: dict["sourceTitle"] as? String,
            category: dict["category"] as? String,
            sourcePath: dict["sourcePath"] as? String,
            excerpt: dict["excerpt"] as? String,
            capturedAt: dict["capturedAt"] as? String,
            artifactState: decodeArtifactState(dict["artifactState"])
        )
    }

    private func decodeArtifactState(_ raw: Any?) -> LoomDraftArtifactState? {
        guard let dict = raw as? [String: Any],
              let targetId = dict["targetId"] as? String, !targetId.isEmpty else {
            return nil
        }
        return LoomDraftArtifactState(
            targetId: targetId,
            kind: dict["kind"] as? String,
            label: dict["label"] as? String,
            state: dict["state"] as? String,
            stateLabel: dict["stateLabel"] as? String
        )
    }
}
