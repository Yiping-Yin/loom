import SwiftUI
import AppKit
import WebKit

// Extracted 2026-07-08 (partition batch 2) from CapturesView.swift: the
// drag-to-install bookmarklet pill the LIVE Capture settings pane shows.
// MARK: Drag-to-install pill

/// WKWebView wrapper that renders a single styled `<a draggable="true">`
/// with the bookmarklet's `javascript:` URL as href. Cross-app drag
/// from a WKWebView anchor IS interpreted by browsers as a bookmark
/// drop — this is the same mechanism Pocket / Instapaper / Pinboard
/// use to ship "drag this to your bookmarks bar" install affordances.
///
/// Rationale (2026-04-27): manual copy-paste install is ≥4 steps and
/// felt 1990s. True 1-click install is browser-architecturally
/// impossible (browsers don't let arbitrary apps write their bookmark
/// stores), so the universal "no extension" path is drag-to-bookmarks.
/// 1 gesture, all browsers with a visible bookmarks bar.
struct BookmarkletDragPill: NSViewRepresentable {
    let bookmarkletJS: String

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.setValue(false, forKey: "drawsBackground")
        webView.navigationDelegate = context.coordinator
        let escaped = bookmarkletJS
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
        let html = """
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          html, body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: transparent;
          }
          body {
            display: flex; align-items: center; justify-content: center;
            height: 100vh;
            padding: 8px;
            box-sizing: border-box;
          }
          a.pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 22px;
            background: linear-gradient(180deg, #4a7eff 0%, #335eea 100%);
            color: white;
            text-decoration: none;
            border-radius: 9px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.2px;
            box-shadow: 0 1px 4px rgba(60, 100, 220, 0.35), 0 0 0 1px rgba(255,255,255,0.08) inset;
            cursor: grab;
            user-select: none;
            -webkit-user-drag: element;
          }
          a.pill:active { cursor: grabbing; transform: scale(0.98); }
          a.pill::before {
            content: "🔗";
            font-size: 14px;
            filter: grayscale(100%) brightness(2.5);
          }
        </style></head>
        <body>
          <a href="\(escaped)" class="pill" draggable="true">Capture to Loom — drag me to your bookmarks bar</a>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator() }

    /// Cancel any navigation request — clicking the pill (vs dragging
    /// it) shouldn't navigate the WKWebView to `javascript:`. Drag is
    /// the only allowed gesture; clicks are no-ops.
    final class Coordinator: NSObject, WKNavigationDelegate {
        private var initialLoadDone = false
        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if !initialLoadDone {
                initialLoadDone = true
                decisionHandler(.allow)
                return
            }
            // Block clicks on the bookmarklet link from navigating
            // the WKWebView itself. Drag-out is handled by AppKit
            // independent of navigation policy.
            decisionHandler(.cancel)
        }
    }
}

