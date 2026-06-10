# New Loom Phase 1: Skeleton and Legacy Isolation

**Date:** 2026-05-08
**Status:** Phase 1 skeleton implemented; installed-app verification passed; live flipdisc extension extraction and native clipboard handoff parsing passed; Atlas UI/native handoff recapture still pending
**Owner:** current Codex thread
**Target surface:** installed macOS app first, exported web runtime second
**Decision:** build the new Loom skeleton inside the existing repository and isolate legacy surfaces instead of deleting them in the first pass.

> **Current vocabulary note (2026-05-15):** This is a historical Phase 1 plan.
> Do not implement `Collect` or `Organize` as first-level product destinations
> from this file. The current first-level product model is `Sources` and
> `Draft`; `/collect` remains compatibility into Sources.

## 1. Objective

Phase 1 originally separated the product into Collect / Organize / Draft.
That model has been superseded. The current first-run product has two primary
capabilities:

1. **资料工作台 / Sources** - add web pages, local files, snippets, screenshots,
   reader notes, and source state into one addressable workspace.
2. **思维草稿 / Draft** - give the user a durable writing surface that cites and
   reopens source material without forcing tool-heavy organization work.

The first phase is not a full rewrite. It creates a new product skeleton, moves old surfaces behind a legacy boundary, and fixes only the legacy bugs that break trust in the new flow.

## 2. Product Law

- The main navigation exposes only Sources and Draft as first-level workspaces,
  with clearly separated support/internal entries when needed.
- User-facing labels must be literal. Names such as Atelier, Weaves, Patterns, Pursuits, Sōan, Workbench, Constellation, and Atlas can remain as internal file or route names, but they must not be first-level product labels in the new shell.
- Adding and organizing material are one Sources loop. A capture or import is
  not successful until the user can find where it landed, open it, and carry a
  reference into Draft.
- Draft is a real saved surface, not browser `localStorage` only. Local storage can be a fallback during exported web preview, but the installed app must have a durable path.
- Legacy routes stay reachable for regression comparison and migration. They are hidden from the default user path.

## 3. Retained Assets

These parts remain valuable and should be reused:

| Area | Retained asset | Phase 1 use |
|---|---|---|
| Web capture | Safari/Atlas extension resources in `macos-app/Loom/LoomWebExtension/Resources` | Sources entry for rich web pages and selected blocks |
| Capture persistence | `CaptureSheet.swift`, capture sidecars, media sidecars, snapshots, diagnostics | Sources write path and provenance record |
| Capture reader | `app/loom-render/capture/page.tsx`, `app/loom-render/captures/page.tsx`, `LoomURLSchemeHandler.swift` | Runtime reader opened from Sources and Draft references |
| Source organization | `ContentRootStore.swift`, `LoomFileStore.swift`, `LoomLibraryView.swift`, `SourceFileView.swift`, `/sources` | Sources foundation |
| Local ingest | `macos-app/Loom/Sources/Ingest/*` | Sources local-file entry for already wired paths; unavailable formats must show an explicit disabled state |
| Draft experiments | `WorkbenchClient.tsx`, `AtelierClient.tsx`, `SoanClient.tsx`, `AskAIWindow.swift`, source notes | Internal raw material for the new Draft surface |
| Build/release gates | app install scripts, extension staging, smoke scripts, cleanup script | Phase 1 acceptance checks |

## 4. Legacy Isolation

Phase 1 must not delete old routes. It must classify and hide them.

| Current surface | Phase 1 disposition |
|---|---|
| `/`, `app/HomeClient.tsx` | Reframe as new Loom shell or redirect into it after onboarding |
| `/sources`, `KnowledgeHomeClient` | Keep as the primary Sources surface; align copy and navigation with Sources/Draft |
| `/loom-render/capture`, `/loom-render/captures`, `/loom-render/snapshot` | Keep as capture runtime. Mark as internal runtime routes, never a primary nav category |
| `LoomMinimalRootView.swift` | Make it the product root for Sources / Draft |
| `ContentView.swift`, `KnowledgeSidebarView.swift` | Freeze behind a legacy flag or internal route until replaced |
| `/atlas`, `/weaves`, `/patterns`, `/pursuits`, `/workbench`, `/atelier`, `/collection`, `/constellation`, `/soan`, `/panel`, `/salon`, `/palimpsest`, `/branching` | Hide from default navigation; keep reachable through Legacy/Internal for migration and comparison |
| Tests and docs for old surfaces | Keep if they guard retained behavior; annotate stale product-language assumptions |

## 5. New Skeleton

### Native Shell

`LoomMinimalRootView.swift` becomes the first product surface. Its sidebar
should have two stable workspaces:

- **Sources**: web capture, local file import, paste/drop, recent captures,
  source folders, reader notes, provenance, and placement state.
- **Draft**: a durable writing surface with a reference rail or citation picker pointed at organized material.

Browser-style back, forward, refresh, and capture controls can remain, but they
must support these two workspaces instead of introducing extra first-level
categories.

### Web Runtime

The exported web runtime should mirror the same two-workspace model:

- `/` presents Sources and Draft as the app structure when onboarding has a configured root.
- `/sources` is the primary Sources workspace.
- Legacy routes remain buildable but are not linked from the main shell.
- `/loom-render/*` stays a runtime namespace, not a user-facing product area.

### Draft MVP

The first Draft surface can be simple, but it must be durable:

- title
- body
- created and updated timestamps
- optional references to source/capture IDs or file paths
- explicit save state

It does not need full AI editing in Phase 1. AI can stay in existing AskAI and source-note flows until the Draft model is stable.

## 6. Data Flow

Phase 1 introduces a shared product vocabulary even before all storage is unified:

```text
Source input
  -> Source record
  -> Source state and reader notes
  -> Reader or source view
  -> Draft reference
```

Minimum records:

- **Source record:** source kind, title, origin, created date, file path or capture path, diagnostics.
- **Source state:** inbox, source root, page, heading, web domain bucket, or loose/unreviewed state.
- **Draft reference:** source/capture path plus human-readable label; exact quote/artifact-state support can extend after the MVP.

The implementation can map these records onto current files and sidecars first. A larger registry can come later, but the UI must already speak in this vocabulary.

## 7. Known Trust Bugs To Fix In Phase 1

The flipdisc evidence is a product trust failure, not a cosmetic detail. If
Sources opens an existing capture reader, the reader must not show a flattened
`0x80 0x83 0x01 imageData 0x8F` paragraph while pretending the structure was
preserved.

Phase 1 must include one of these outcomes:

- reconstruct the segment diagram from the legacy flattened text when the pattern is deterministic, or
- show an honest legacy fallback with recapture/open-snapshot guidance.

The specific current risk is that `segmentDiagramArtifactHtml()` emits a class named `inline`; global utility styles can make the diagram section `display: inline`, causing visual overlap. This needs a regression test before or with the fix.

## 8. Implementation Order

1. **Contracts and route inventory**
   - Add tests that classify default, runtime, and legacy routes.
   - Assert the main product surface exposes Sources / Draft.

2. **Web shell**
   - Reframe `/` around the three capabilities.
   - Remove first-level links to legacy product names from the main shell.
   - Keep direct route availability for regression and migration.

3. **Native shell**
   - Refactor `LoomMinimalRootView.swift` selection into Sources / Draft.
   - Keep existing source, capture, folder, and file views behind those destinations.

4. **Sources aggregation**
   - Show recent captures inside Sources, not only as a separate capture silo.
   - Preserve source file access and capture reader deep links.

5. **Draft MVP**
   - Add a durable draft record path.
   - Provide a basic editor and reference list.
   - Do not add a new AI feature pile in this phase.

6. **Legacy reader hygiene**
   - Add the flipdisc segment fallback/overlap regression.
   - Fix the display and old-capture behavior.

7. **Verification and cleanup**
   - Run contracts, typecheck, build/static export, app build/install smoke, extension staging where available, and generated-artifact cleanup.
   - Use Computer Use for installed-app visual verification when macOS Automation permissions allow it.

## 9. Acceptance Checks

Phase 1 is acceptable only when all of these are true:

- Fresh installed app opens to a surface organized around Sources / Draft.
- The default sidebar or top-level navigation does not expose legacy names as primary product categories.
- A web capture can be saved into Sources, opened in the reader, and traced to its saved files.
- A local source or page can be opened through Sources without writing into the user's source folder.
- A Draft can be created, saved, reopened, and display at least one reference to organized material.
- Legacy routes still build and can be opened manually for comparison.
- The flipdisc segment evidence no longer reproduces as a flattened or overlapping reader artifact.
- Verification commands pass or any failure is documented with exact command, exact failure, and the next repair.

Recommended gate set:

```bash
npm run status:buckets
npm run typecheck
npm run test:contracts
npm run test:capture-interactive:export
npm run test:captures-landing
npm run build
npm run smoke
git diff --check
npm run app:check-project -- --require-tracked
npm run app:stage-extension
npm run app:user
npm run app:smoke
npm run clean:generated
```

If a command does not exist or is intentionally not part of the final gate, the implementation plan must update `package.json`, CI, or this spec so the gate map is honest.

## 10. Non-Goals

- No deletion of legacy routes in Phase 1.
- No full capture-reader rewrite before the new skeleton is visible.
- No new broad AI surface before Draft persistence exists.
- No metaphor-heavy public labels for the main product navigation.
- No claim that Loom is rebuilt until installed-app verification confirms the new
  first screen, real Sources intake, and source-grounded Draft loop.

## 11. Risks

- The repo already has many uncommitted changes across Swift, web, scripts, tests, and docs. Implementation must use narrow commits or clearly scoped file batches.
- Existing tests can pass while installed capture still fails. Real-product verification must include the saved file, sidecar, reader DOM, and installed app.
- Draft storage is fragmented across `localStorage`, SwiftData, UserDefaults, and markdown. Phase 1 must pick one durable MVP path instead of adding a fifth silent store.
- Web `/sources` and native `LoomLibraryView.swift` duplicate organization logic. The first implementation can keep both, but tests must prevent divergent product labels and empty-state behavior.

## 12. User Feedback Recorded

- The current product is too mixed. The goal is a new Loom, not another round of isolated patches.
- Phase 1 should happen inside the existing repo as a new skeleton plus legacy isolation.
- The flipdisc screenshots prove a capture/organization failure: source structure exists on `https://flipdisc.io`, but Loom can still show flattened or visually broken structure.
- The implementation must distinguish whether a failure comes from the browser extension, capture persistence, static/exported build, native URL scheme, or reader rendering.
- Feedback should be summarized and recorded as the project evolves so later sessions do not lose the product reasoning.
- Desktop visual verification must prioritize `@computer-use` / `.codex/computer-use` because it does not steal the user's active desktop.
- System screenshots are not the default fallback. Use them only when the user explicitly allows a screenshot-based verification pass for that step.

## 13. Phase 1 Verification Log

Verified on 2026-05-08 and 2026-05-09:

- `npm run verify` passed: typecheck, contract tests, export-backed capture behavior, captures landing behavior, production build, and web smoke.
- `npm run status:buckets`, `git diff --check`, `npm run app:check-project -- --require-tracked`, `npm run app:stage-extension`, `npm run app:user`, `npm run app:smoke`, and `npm run clean:generated` passed as the installed-product tail gate. `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` confirmed bundle id `com.yinyiping.loom` and 635 static web files.
- `npm run verify:product` passed on 2026-05-09 00:53 AEST as a single serial gate: status buckets, typecheck, 181/181 contracts at that time, export-backed capture interactive tests 5/5, captures landing behavior 12/12, production build, web smoke, whitespace check, Xcode project reference check, extension staging, Release app install to `/Users/yinyiping/Applications/Loom.app`, installed app smoke, and generated-artifact cleanup.
- `npm run app:stage-extension` passed and staged Loom extension Resources to `~/Library/Application Support/Loom/Atlas-Extension/extension` at version 1.4.9.
- `npm run app:check-extension` passed: Atlas is loading extension id `inbkhpkanpedgiolkngbpnkhbohpkbjh`, version 1.4.9, from the staged extension path.
- `npm run verify:flipdisc-live` passed without taking over the desktop. It loaded the live `https://flipdisc.io/` page in a headless browser, injected the staged Atlas extension `content.js`, and verified `Frame Format` became one `segment-diagram` artifact with segments `0x80`, `0x83`, `0x01`, `imageData`, `0x8F`.
- `npm run verify:flipdisc-live` was re-run on 2026-05-09 00:49 AEST after app/extension staging. It passed again with staged `content.js` SHA `2599c49ac46b3707064a881c962ccb6ee284c20b8759e07f3c163179f640eca9`, 2 interactive artifacts, and 1 segment diagram. A later verifier correction showed the raw markdown body still contains the source fallback frame row; the important pass condition is the sidecar-backed segment diagram plus reader replacement/fallback behavior, not the absence of source fallback text in raw markdown.
- `npm run verify:flipdisc-live-handoff` passed on 2026-05-09 01:03 AEST without taking over the desktop. It loads the live `https://flipdisc.io/`, injects the staged extension, writes a temporary Loom saved-capture fixture (`Loom.md` plus CaptureAST sidecar), and runs `scripts/verify-capture-handoff.mjs` against that fixture. The verified sidecar contains the `Frame Format` segment diagram and a reader URL with the matching `captureAst` parameter. The report now honestly shows `bodyHasFlatFrameLine: true`: the raw markdown can still contain the source fallback row, so reader correctness depends on the sidecar or legacy reconstruction replacing that row during rendering. This command is not a replacement for the real Atlas UI/native click-to-save path.
- `npx tsx --test tests/capture-handoff-verifier.test.ts` passed 2/2. The new non-UI verifier proves that a saved `Loom.md` plus CaptureAST sidecar can be checked for the expected segment-diagram tokens, timestamp-matched snapshot, and reader URL.
- `npm run verify:capture-handoff` was then run against the current installed app container. It failed against the newest existing `flipdisc.io` saved capture because that historical sidecar has no `interactiveArtifacts` array and the saved markdown still contains the flat frame line. This narrows the remaining risk: old saved captures need reader fallback, while a fresh recapture through the staged extension should produce the segment-diagram sidecar proven by `verify:flipdisc-live`.
- `npm run test:contracts` passed 182/182 on 2026-05-09 after adding the live flipdisc saved-capture handoff fixture contract.
- `npm run typecheck` passed against the current working tree.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/CaptureWebPayloadURLTests test` passed 3/3. The tests use named pasteboards to verify `loom://capture?via=clipboard` decodes the structured `segment-diagram` CaptureAST, rejects malformed clipboard JSON without falling back to a URL payload, writes the CaptureAST sidecar, returns a reader URL with `captureAst=...`, and proves the native reader bridge can reload that sidecar while stripping capture metadata/source boilerplate from the rendered body.
- `npm run app:check-project -- --require-tracked` passed after staging the new Swift Draft and capture-handoff test files referenced by the Xcode project.
- `npm run app:user` passed and installed `/Users/yinyiping/Applications/Loom.app`.
- `npm run app:smoke` passed against the installed app: bundle id `com.yinyiping.loom`, 635 static web files.
- Computer Use was attempted first for installed-app visual verification but macOS rejected it with `Apple event error -10000: Sender process is not authenticated`.
- Historical terminal screenshot fallback verified the then-current installed
  app sidebar. This evidence is superseded for current acceptance: fresh visual
  verification must use Computer Use where possible and confirm Sources / Draft,
  not Collect / Organize / Draft.
- Installed Draft was opened, edited through accessibility automation, saved, app relaunched, and the saved body was reloaded from `Drafts/drafts.json`.
- Follow-up feedback: do not repeat the screenshot fallback by default. The current Computer Use issue is a tooling/authentication blocker to resolve, not permission to take over the desktop with screenshots.
- Follow-up attempt: duplicate `SkyComputerUseClient mcp` helpers were killed and `.codex/computer-use/Codex Computer Use.app` was relaunched as a background app. The service process started, but the Codex `@computer-use` tool still returned `Transport closed`; real Atlas UI/native handoff remains blocked on that MCP transport, not on the headless extraction or native parser.
- Follow-up diagnosis: `SkyComputerUseService` can be launched from `.codex/computer-use/Codex Computer Use.app`, and `/Applications/Codex.app/Contents/Resources/codex app-server` is running, but `@computer-use` still returns `Transport closed`. The bundled `SkyComputerUseClient` binary contains an explicit version-mismatch message that says to relaunch the Codex app so the Computer Use client can be updated. Treat the remaining Computer Use blocker as Codex app-server/client handshake state until Codex is relaunched or updated.
- Follow-up attempt on 2026-05-09 00:49 AEST: `@computer-use` / `computer-use.list_apps` still returned `Transport closed`. Do not switch back to desktop screenshots by default; keep fresh Atlas UI/native handoff marked blocked until Computer Use transport is healthy or the user explicitly authorizes a screenshot-based pass.
- Follow-up attempt after the 2026-05-09 `npm run verify:product` pass: `@computer-use` / `computer-use.list_apps` still returned `Transport closed`. The single product gate proves the packaged app/runtime path; it still does not prove the real Atlas click-to-native-save chain.
- Atlas was opened to `https://flipdisc.io`; Atlas debug logging showed the Loom content script injected the floating capture button on the page. Automated clicking of Atlas was blocked by macOS assistive-access permissions, and `@computer-use` later returned `Transport closed`, so this is not counted as a completed Atlas UI/native handoff recapture.
- `npm run clean:generated` removed build trash while preserving tracked public artifact names.
- Index hygiene on the current Phase 1 slice: 78 changed files staged, no unstaged diff, and `git diff --cached --check` passed.

Still pending before calling the whole new Loom complete:

- Fresh capture `https://flipdisc.io` through the currently staged browser extension, then inspect saved capture body, CaptureAST sidecar, reader DOM, and installed app reader rendering.
- The remaining unknown is the real Atlas UI/native trigger path: Atlas click or shortcut -> clipboard payload -> `loom://capture?via=clipboard` sheet/save -> `npm run verify:capture-handoff` on the fresh saved capture -> installed-app reader reopen. Headless extraction, temporary saved-capture fixture verification, and native parser/writer/reader-bridge tests now narrow the risk to that UI/handoff integration.
- Full migration plan for remaining legacy surfaces after Phase 1; legacy routes intentionally remain buildable and hidden from the default path.
