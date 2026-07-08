import Foundation
import WebKit

/// Streaming companion to `AIBridgeHandler`. The non-streaming handler is
/// reply-based (`WKScriptMessageHandlerWithReply`), which can't push
/// incremental deltas. This handler uses the push model:
///
///   JS: `window.webkit.messageHandlers.loomAIStream.postMessage({ streamId, prompt, model?, maxTokens? })`
///   Swift: for each SSE text delta, call `webView.evaluateJavaScript("window.__loomAI.onChunk('<id>', '<text>')")`
///   Swift: on completion, call `window.__loomAI.onDone('<id>')`
///   Swift: on error, call `window.__loomAI.onError('<id>', '<message>')`
///
/// The JS side (lib/ai-stream-bridge.ts) maintains a Map of pending streams
/// keyed by streamId, and translates the callbacks into an AsyncIterable.
///
/// Cancellation: JS can cancel by posting `{ streamId, cancel: true }`.
/// Swift then cancels the in-flight URLSession.bytes task for that stream.
@MainActor
final class AIStreamBridgeHandler: NSObject, WKScriptMessageHandler {
    static let name = "loomAIStream"

    private var tasks: [String: Task<Void, Never>] = [:]

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let payload = message.body as? [String: Any],
              let streamId = payload["streamId"] as? String else {
            return
        }

        if let cancel = payload["cancel"] as? Bool, cancel {
            tasks[streamId]?.cancel()
            tasks.removeValue(forKey: streamId)
            return
        }

        guard let prompt = payload["prompt"] as? String,
              let webView = message.webView else { return }

        let modelOverride = payload["model"] as? String
        let maxTokensOverride = payload["maxTokens"] as? Int
        let provider = AIProviderKind.current

        // Audit the provider body before dispatch: the web AI stream surface
        // can post arbitrary prompts, so record which provider handled the
        // request and the prompt size for the on-device privacy/usage log.
        LoomAIRequestAudit.record(
            surface: "web-ai-stream",
            provider: provider,
            promptLength: prompt.count
        )

        let onChunkClosure: (String) -> Void = { [weak webView] chunk in
            Task { @MainActor [weak webView] in
                guard let webView else { return }
                let escaped = escapeForJS(chunk)
                let escapedId = escapeForJS(streamId)
                await Self.evaluateJavaScript(
                    "window.__loomAI && window.__loomAI.onChunk('\(escapedId)', '\(escaped)')",
                    in: webView
                )
            }
        }

        let task = Self.makeStreamTask(
            owner: self,
            streamId: streamId,
            prompt: prompt,
            provider: provider,
            modelOverride: modelOverride,
            maxTokensOverride: maxTokensOverride,
            onChunk: onChunkClosure,
            webView: webView
        )
        tasks[streamId] = task
    }

    private nonisolated static func makeStreamTask(
        owner: AIStreamBridgeHandler,
        streamId: String,
        prompt: String,
        provider: AIProviderKind,
        modelOverride: String?,
        maxTokensOverride: Int?,
        onChunk: @escaping (String) -> Void,
        webView: WKWebView
    ) -> Task<Void, Never> {
        Task.detached(priority: .userInitiated) { [weak owner, weak webView] in
            await Self.runStreamRequest(
                streamId: streamId,
                prompt: prompt,
                provider: provider,
                modelOverride: modelOverride,
                maxTokensOverride: maxTokensOverride,
                onChunk: onChunk,
                webView: webView
            )
            let ownerForCleanup = owner
            await MainActor.run {
                _ = ownerForCleanup?.tasks.removeValue(forKey: streamId)
            }
        }
    }

    private nonisolated static func runStreamRequest(
        streamId: String,
        prompt: String,
        provider: AIProviderKind,
        modelOverride: String?,
        maxTokensOverride: Int?,
        onChunk: @escaping (String) -> Void,
        webView: WKWebView?
    ) async {
        do {
            try await sendPrompt(
                prompt,
                provider: provider,
                modelOverride: modelOverride,
                maxTokensOverride: maxTokensOverride,
                onChunk: onChunk
            )
            await postDone(streamId: streamId, webView: webView)
        } catch is CancellationError {
            await postError(streamId: streamId, message: "cancelled", webView: webView)
        } catch {
            await postError(streamId: streamId, message: streamErrorMessage(error), webView: webView)
        }
    }

    private nonisolated static func sendPrompt(
        _ prompt: String,
        provider: AIProviderKind,
        modelOverride: String?,
        maxTokensOverride: Int?,
        onChunk: @escaping (String) -> Void
    ) async throws {
        switch provider {
        case .appleFoundation:
            // Route the on-device provider explicitly rather than letting it
            // fall through to the Anthropic default — Apple Intelligence is the
            // out-of-the-box default, so a stream request must reach the local
            // model instead of silently calling a cloud API.
            var opts = AppleFoundationClient.Options()
            opts.onChunk = onChunk
            _ = try await AppleFoundationClient.send(prompt: prompt, options: opts)
        case .openai:
            var opts = OpenAIClient.Options()
            if let m = modelOverride, !m.isEmpty { opts.model = m }
            if let t = maxTokensOverride, t > 0 { opts.maxTokens = t }
            opts.onChunk = onChunk
            _ = try await OpenAIClient.send(prompt: prompt, options: opts)
        case .customEndpoint:
            var opts = CustomEndpointClient.Options()
            if let t = maxTokensOverride, t > 0 { opts.maxTokens = t }
            opts.onChunk = onChunk
            _ = try await CustomEndpointClient.send(prompt: prompt, options: opts)
        case .ollama:
            var opts = OllamaClient.Options()
            opts.onChunk = onChunk
            _ = try await OllamaClient.send(prompt: prompt, options: opts)
        case .codexCli:
            var opts = CLIRuntimeClient.Options()
            opts.flavor = .codex
            opts.onChunk = onChunk
            _ = try await CLIRuntimeClient.send(prompt: prompt, options: opts)
        case .disabled:
            throw NSError(
                domain: "LoomAI", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "AI is disabled in Settings."]
            )
        case .anthropic:
            var opts = AnthropicClient.Options()
            if let m = modelOverride, !m.isEmpty { opts.model = m }
            if let t = maxTokensOverride, t > 0 { opts.maxTokens = t }
            opts.onChunk = onChunk
            _ = try await AnthropicClient.send(prompt: prompt, options: opts)
        }
    }

    private nonisolated static func postDone(streamId: String, webView: WKWebView?) async {
        let escapedId = escapeForJS(streamId)
        await Self.evaluateJavaScript(
            "window.__loomAI && window.__loomAI.onDone('\(escapedId)')",
            in: webView
        )
    }

    private nonisolated static func postError(streamId: String, message: String, webView: WKWebView?) async {
        let escapedId = escapeForJS(streamId)
        let escapedMsg = escapeForJS(message)
        await Self.evaluateJavaScript(
            "window.__loomAI && window.__loomAI.onError('\(escapedId)', '\(escapedMsg)')",
            in: webView
        )
    }

    private nonisolated static func streamErrorMessage(_ error: Error) -> String {
        (error as? AnthropicClient.Failure)?.errorDescription
            ?? (error as? OpenAIClient.Failure)?.errorDescription
            ?? (error as? CustomEndpointClient.Failure)?.errorDescription
            ?? (error as? OllamaClient.Failure)?.errorDescription
            ?? (error as? CLIRuntimeClient.Failure)?.errorDescription
            ?? error.localizedDescription
    }

    private static func evaluateJavaScript(_ script: String, in webView: WKWebView?) async {
        guard let webView else { return }
        _ = try? await webView.evaluateJavaScript(script)
    }
}

/// Lightweight on-device audit log for AI requests routed through the native
/// bridges. Records which surface initiated the request, the active provider,
/// and the prompt size so the installed app keeps a local privacy/usage trail
/// without sending anything off-device. Writes are best-effort and never block
/// or fail the request — the audit is a side channel, not a gate.
enum LoomAIRequestAudit {
    /// Record a single AI request. `surface` identifies the caller (e.g.
    /// `"web-ai-stream"` for the WebView stream bridge); `provider` is the
    /// active `AIProviderKind`; `promptLength` is the character count of the
    /// outbound prompt (the prompt text itself is not stored).
    static func record(surface: String, provider: AIProviderKind, promptLength: Int) {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let line = "[\(timestamp)] surface=\(surface) provider=\(provider.rawValue) promptChars=\(promptLength)\n"
        NSLog("[LoomAIRequestAudit] %@", line.trimmingCharacters(in: .whitespacesAndNewlines))
        appendToLog(line)
    }

    private static var logURL: URL {
        URL(fileURLWithPath: LoomRuntimePaths.userDataRoot())
            .appendingPathComponent("Logs", isDirectory: true)
            .appendingPathComponent("ai-request-audit.log", isDirectory: false)
    }

    private static func appendToLog(_ line: String) {
        let url = logURL
        let fm = FileManager.default
        do {
            try fm.createDirectory(
                at: url.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            guard let data = line.data(using: .utf8) else { return }
            if let handle = try? FileHandle(forWritingTo: url) {
                defer { try? handle.close() }
                try handle.seekToEnd()
                try handle.write(contentsOf: data)
            } else {
                try data.write(to: url, options: .atomic)
            }
        } catch {
            // Audit is best-effort; never surface a failure to the caller.
            NSLog("[LoomAIRequestAudit] append failed: \(error)")
        }
    }
}

/// Escape a string for embedding inside single-quoted JS. Order matters:
/// backslashes first, then quotes, then line breaks.
private func escapeForJS(_ s: String) -> String {
    s.replacingOccurrences(of: "\\", with: "\\\\")
     .replacingOccurrences(of: "'", with: "\\'")
     .replacingOccurrences(of: "\n", with: "\\n")
     .replacingOccurrences(of: "\r", with: "\\r")
     .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
     .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
}
