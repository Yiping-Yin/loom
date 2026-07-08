import AppKit
import PDFKit

/// Reads the current text selection off a window's responder chain so the
/// Edit-menu "Ask Selection" (⌘⇧E) item can seed `AskAIContext` before the
/// AskAI window opens. Replaces the legacy webview-JS capture that lived in
/// ContentView's Coordinator (never mounted since the Reflection pivot).
///
/// Two live surfaces are covered:
/// - `NSTextView` — the center document editor, notes, any focused field
///   editor. The selected substring is the passage.
/// - `PDFView` — the in-app reader. Drag-selection leaves PDFKit's internal
///   document view as first responder, so we walk superviews up to the
///   enclosing `PDFView` and read `currentSelection`.
///
/// Best-effort by design: no selection (or an unrecognized responder)
/// returns nil and the AskAI window opens blank — an honest empty open,
/// never a stale or fabricated passage.
enum AskSelectionCapture {
    struct Captured: Equatable {
        let text: String
        let title: String?
        let url: String?
    }

    @MainActor
    static func selection(from responder: NSResponder?, fallbackTitle: String?) -> Captured? {
        if let textView = responder as? NSTextView {
            let range = textView.selectedRange()
            guard range.length > 0 else { return nil }
            let text = (textView.string as NSString).substring(with: range)
                .trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { return nil }
            return Captured(text: text, title: fallbackTitle, url: nil)
        }

        var view = responder as? NSView
        while let current = view {
            if let pdfView = current as? PDFView {
                let text = (pdfView.currentSelection?.string ?? "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                guard !text.isEmpty else { return nil }
                let documentURL = pdfView.document?.documentURL
                return Captured(
                    text: text,
                    title: documentURL?.lastPathComponent ?? fallbackTitle,
                    url: documentURL?.absoluteString
                )
            }
            view = current.superview
        }
        return nil
    }

    /// Menu-item entry point: captures from the key window's first
    /// responder and stashes into `AskAIContext.shared`. Skips the AskAI
    /// window itself so re-invoking ⌘⇧E there can't seed the prompt draft
    /// back in as a passage.
    @MainActor
    static func seedFromKeyWindow() {
        guard let window = NSApp.keyWindow,
              window.identifier?.rawValue.contains(AskAIWindow.id) != true else { return }
        let title = window.title
        let fallbackTitle = (title.isEmpty || title == "Loom") ? nil : title
        guard let captured = selection(from: window.firstResponder, fallbackTitle: fallbackTitle) else {
            return
        }
        AskAIContext.shared.pendingSelection = captured.text
        AskAIContext.shared.pendingSourceTitle = captured.title
        AskAIContext.shared.pendingSourceURL = captured.url
    }
}
