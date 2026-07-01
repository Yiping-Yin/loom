# Anchor-precision: PROVEN solution + integration spec (Claude → Codex)

## TL;DR
"Sandbox vs file+page anchor" is a FALSE dilemma. Keep the main Loom app
**fully sandboxed**; move the AX read into a tiny **non-sandboxed XPC helper**.
Proven live with an isolated probe (`scratchpad/anchor-probe/probe.swift`).

## Proof (non-sandboxed reader, run from the granted env, AXIsProcessTrusted=true)
| App | What AX gave us | precision |
|---|---|---|
| Preview / PDF | `AXDocument` = file URL **+** window `AXTitle` = `"Week 1 Notes.pdf – Page 2 of 20"` | **file+page ✅** |
| Word | `AXDocument` = `…/Loom Word Learning Notes.docx` | file ✅ (page = future, Word-specific AX) |
| Excel | `AXDocument` = `…/Loom Excel Learning Table.csv` | file ✅ (cell = future, Excel-specific AX) |

## Why it was failing before
Your `accessibilitySourceContext` (LoomApp.swift ~1296) is **logically correct** —
it reads `AXDocument` + page exactly right. It just runs **inside the sandboxed
main app**, where cross-app AX is blocked → returns nil → honest degrade to
app-level ("Preview"). The code is fine; only its **process** is wrong.

## Integration (do this)
1. **New target: `LoomAnchorHelper`** — a non-sandboxed XPC service (or non-sandboxed
   login-item helper). It has **NO** `com.apple.security.app-sandbox`. It is the bundle
   the user grants **Accessibility** to (separate from the main app's grant).
2. **Move the AX read into the helper.** It exposes one XPC method:
   `resolveAnchor(forPID: pid_t) -> AnchorContext?` returning
   `{ documentURL: URL?, page: Int?, pageCount: Int?, precision: "file+page"|"file"|"app" }`.
   Reuse the probe logic verbatim:
   - `AXUIElementCreateApplication(pid)` → `kAXFocusedWindowAttribute`
   - read `"AXDocument"` (file URL string) for the path
   - read `kAXTitleAttribute`, regex `Page (\d+) of (\d+)` for page / pageCount
3. **Main app calls the helper.** In `handleExternalSelectionCapture` /
   `captureSelectionInLoom`: resolve the source app PID (NSWorkspace frontmost /
   the service context), call the helper over XPC, and populate the trace's
   existing `documentURL / pageNumber / pageCount / anchorPrecision` fields from
   the helper result instead of the (blocked) in-app AX read.
4. **Precision policy (already your rule):** file+page → render "file · p.N";
   file-only → "file"; helper unavailable / AX denied → honest "app/window".
   Never fake file+page.

## Reference
- Probe (full reusable AX code): `scratchpad/anchor-probe/probe.swift`
  run: `./probe com.apple.Preview | com.microsoft.Word | com.microsoft.Excel`
- Net effect: main app keeps its sandbox; only a small auditable helper holds AX.
  PDF (the lead use case) = file+page fully solved.
