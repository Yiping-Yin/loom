# New Loom Completion Audit

**Date:** 2026-05-09
**Status:** Not complete as a full product; Phase 1 skeleton, real Atlas UI/native capture handoff, substantial Sources / Draft consolidation, compact installed shell, unified app canvas, productized Draft inspector, native local-file importer baseline, CaptureAST artifact-state handoff into Draft references, artifact-state-aware Draft prompt context, bounded Draft provider prompt context for Continue writing and Cmd-K inline edit, bounded Compile provider prompt context, ThinkingDraft block-reference grounding with concrete structure labels, first Compile artifact rendering, no-provider Compile quality verification, local web and native provider-stub verification, installed Source detail Delete visibility, installed Draft chrome acceptance with fullscreen-transition hardening, and approval-bound gate readiness are verified in focused gates.
**Purpose:** Keep the prompt-to-artifact checklist explicit so future sessions do not confuse automated gates with full product completion.

## Objective Restated

The user objective is **完整彻底实现新 Loom，而不只是 phase 1**. The current evidence proves important product slices, but it must not be treated as full completion.

Full-product acceptance means these surfaces must work together as one installed product loop:

1. **Sources / 资料工作台**: capture web pages, import local files, organize source folders, preserve provenance, expose current reading/writing state, and route notes/highlights back into source context without corrupting the original files.
2. **Draft / 思维草稿**: compose from attached references, keep citations openable, support structured block edits, and preserve user writing as the primary surface.
3. **Compile / AI output**: transform selected draft/source context through provider-backed output paths only when privacy boundaries and artifact parsing are verified.

Legacy surfaces can remain, but they must be hidden from the default path. Capture trust bugs, especially the flipdisc frame-format failure, must be diagnosed by layer rather than visually patched.

## Prompt-To-Artifact Checklist

| Requirement / feedback | Evidence | Status |
|---|---|---|
| Build the new Loom inside the existing repo as "new skeleton + legacy isolation." | `docs/projects/active/2026-05-08-new-loom-skeleton.md`; `lib/new-loom/product-shell.ts`; `app/HomeClient.tsx`; `LoomMinimalRootView.swift`; `tests/new-loom-skeleton-contract.test.ts` | Covered for Phase 1 |
| Do not expose legacy names as primary product navigation. | `tests/new-loom-skeleton-contract.test.ts`; `npm run test:contracts` 572/572 latest pass | Covered |
| First-run completion and native shortcuts must enter the new product loop. | `app/onboarding/OnboardingClient.tsx` routes to `/sources`; `app/collect/page.tsx` is a compatibility redirect into `/sources`; `WorkspaceShortcutsCommands` exposes Sources and Draft; `LoomMinimalRootView.navigateProductPath` maps those capability tokens to native surfaces; `NavigationBridgeHandler` forwards web-shell navigation/start-capture actions; `KeyboardHelpView`; `tests/new-loom-skeleton-contract.test.ts` | Covered |
| Provide a real Draft MVP, not only a legacy localStorage experiment. | `lib/new-loom/draft-storage.ts`; `lib/new-loom/cowork-draft-seed.ts`; `app/draft/*`; `LoomDraftStore.swift`; `LoomDraftView.swift`; `LoomDraftStoreTests.swift`; installed Draft save/reopen previously verified; ThinkingDraft blocks now count explicit stable `@reference` tokens as block references on web/native, with token-boundary checks so base source tokens do not match artifact-state tokens by prefix; Draft structure panels now show concrete block reference labels such as source titles and `Frame Format · artifact state` instead of only opaque `N refs` counts; reviewable cross-block operations have web/native diff evidence before rewriting selected blocks; web `buildBoundedDraftAIPrompt` / `buildBoundedDraftInlineEditPrompt` and native `LoomDraftAIPrompt` / `LoomDraftInlineEdit` now cap provider-visible Draft context at 6000 characters while preserving attached source labels and marking `[truncated for provider context]` | Covered for MVP, first ThinkingDraft block-reference grounding, reviewable cross-block operation mechanics, and bounded prompt context; live provider-backed multi-block composition remains approval-bound |
| Move useful Atelier writing behavior into Draft instead of keeping it as a separate writing product. | Draft references preserve `sourceTitle`, `category`, `sourcePath`, `excerpt`, capture `kind`, `capturedAt`, and `kind=artifact-state` metadata; metadata-only reference upgrades persist; `/draft` inserts referenced excerpts as quotes and renders source/artifact-state provenance; native `LoomDraftStore` preserves the same reference metadata in JSON and Markdown sidecars; inline `@references` now resolve unique short aliases across attached references and selected corpus hits on web/native prompt paths without choosing ambiguous matches | Covered for reference/provenance migration and deterministic attached/corpus alias resolution; not evidence for full corpus chat/search/autocomplete |
| Capture and organization must be one Sources loop, not separate silos. | `/sources` owns capture review, file intake, source folders, Reader notes, source-state counts, and Draft handoff links; `/collect`, `/uploads`, `/notes`, and `/highlights` are compatibility redirects into `/sources`; `KnowledgeHomeClient.tsx` fetches `loom://native/captures-list.json`, `loom://native/capture-metadata-all.json`, `useAllTraces()`, and `fetchSearchIndex()`; `KnowledgeHomeStatic.tsx` renders Recent captures, Reader notes, trace-backed note/highlight entries, and per-source capture/highlight/note counts; Recent captures can attach the capture reader artifact to Draft as a `kind=capture` reference; `LoomLibraryView.swift` groups captures and scans `Loom-metadata.json` for native source rows; capture placement tests and captures landing behavior tests | Covered for Sources consolidation; old route names remain compatibility redirects until deletion is safe |
| Draft references must remain connected to source artifacts, not become a dead-end citation list. | `LoomDraftView.swift` renders an `Open reference` action; capture references post `.loomOpenCapture`; `loom://content` references post folder/file navigation; external URLs open through `NSWorkspace`; native Continue writing rows attach source references before navigating to Draft; CaptureAST sidecar artifact states now flow into `CaptureEntry`, `captures-list.json`, web Sources Draft links, native capture-to-Draft attach, and Draft/Compile reference prompt fields; `tests/knowledge-home-source-library.test.tsx`; `tests/capture-media-contract.test.ts`; Computer Use previously verified installed Draft -> Open reference -> Flipdisc capture reader and Sources -> Continue writing -> Draft source reference -> ECON 3202 Resources | Covered for native capture/source artifact reopening and structured capture artifact-state handoff |
| Web Continue writing must carry readable Draft reference metadata. | `/sources` builds Draft links with paired `ref`, `label`, `kind=source`, and `source` query values for both collection and writing references; `/draft` already merges those fields into existing Draft references; `tests/knowledge-home-source-library.test.tsx` | Covered for web source-context handoff |
| Continue writing must mean actual user writing, not generated source inventory. | `LoomSourceWritingClassifier` ignores generated `## Resources`, resource links, source anchor links, and markdown-linked document headings; source references can carry a `draftExcerpt` only when real note/body lines exist; `LoomSourceWritingClassifierTests`; Computer Use previously verified installed Sources no longer marks the current resource-only ECON/INFS folders as writing-ready | Covered for native false-positive cleanup |
| Diagnose whether flipdisc failure is extension, persistence, build, native handoff, or reader rendering. | `scripts/verify-flipdisc-live-extension.mjs`; `scripts/verify-capture-handoff.mjs`; `CaptureWebPayloadURLTests.swift`; `tests/capture-interactive-artifacts.test.ts`; Computer Use direct installed-app handoff at 03:45 AEST and real Atlas UI handoff at 03:58 AEST on 2026-05-09 | Covered for Phase 1 |
| Source page is `https://flipdisc.io`. | `npm run verify:flipdisc-live`; `npm run verify:flipdisc-live-handoff` | Covered headlessly |
| `/Users/yinyiping/Desktop/LOOM/docs/loom.md` must record product understanding and feedback. | `docs/loom.md` current process note and product spec | Covered |
| Continue updating and cleaning the Loom project while modifying it. | `npm run clean:generated`; staged docs/gate updates; generated-artifact cleanup docs | Covered |
| Prioritize `@computer-use`; do not use desktop screenshots because they disturb the user's computer. | `docs/canon/LOOM_RULES.md` V13 and Phase 1 note record screenshot fallback is forbidden without explicit approval; Computer Use verified installed Loom reader and media playback on 2026-05-09 03:45 AEST; later CUA rechecked the installed Sources surface, Delete confirmation, and Add files flow after the desktop became inspectable; on 2026-05-10 CUA read the visible installed Source detail and confirmed `Delete capture` is an accessible button. Source detail delete action is visible but destructive delete was not clicked. | Honored |
| Use multiple agents for broad Loom audit. | Four read-only agents audited capture, organization, draft, and verification surfaces; results informed current gates | Covered in this thread |
| The final goal is a new Loom, not the current confused product. | Phase 1 skeleton and docs are in place; legacy still exists behind hidden/default boundaries | In progress, not complete |
| Remaining legacy surface sprawl needs a durable migration map. | `docs/projects/active/2026-05-09-legacy-surface-migration-plan.md`; `NEW_LOOM_ROUTE_CLASSIFICATION`; full route-classification contract; primary surfaces cannot link to legacy/internal routes | Covered as enforced classification and compatibility redirect execution; deletion remains blocked by legacy-route deletion review |
| Phase 9 needs the six product refusals as an in-app support document. | `app/discipline/page.tsx`; `NEW_LOOM_SUPPORT_ROUTES`; `/system` and `/help` links; `tests/new-loom-skeleton-contract.test.ts` | Covered for first support-page slice |
| Strict latest-binary installed Draft chrome acceptance. | `LoomMinimalRootView.swift` now owns the shell with `HStack(spacing: 0)` and `rootSplitHairline` instead of system `NavigationSplitView` or `HSplitView`, removes SwiftUI `.toolbar` ownership from Draft chrome, keeps `contentExtendsUnderTitlebar: true`, hides the main-window system titlebar via `.windowStyle(.hiddenTitleBar)` and fallback `window.toolbar = nil`, draws the toolbar bottom rule once through `rootToolbarHairline`, and uses one compact sidebar + 28pt root chrome rhythm: `minimalSidebarWidth: 136`, `rootToolbarHeight: 28`; The root shell now owns one 28pt toolbar and one 8pt body-start rhythm, while Draft mounts in the same post-chrome detail slot as Sources, no longer nests its own native `HSplitView`, and uses a bounded `HStack(alignment: .top, spacing: 0)` with a fixed 320pt inspector rail plus `draftRailHairline` inside the shared detail slot, so it cannot drift into a separate page rhythm, clip its right inspector heading, or draw a hard system divider seam; the sidebar now starts directly with Sources / Draft through the same `sidebarSurfaceSlot` rhythm as the primary pages, Page/Folder no longer appear as unexplained sidebar-toolbar icons, and Sources owns `Add files`, `Add Folder`, plus `Add Question` in the active root toolbar, so Draft cannot scroll the primary nav under the traffic lights and fixing the left rail does not push Sources downward; `WindowConfigurator.configure(_:)` and the fallback main-window creation path both insert `.fullScreenPrimary` into `window.collectionBehavior`, minimal mode passes `removesSystemToolbar: true` so scene-managed main windows clear `window.toolbar = nil` and hide `standardWindowButton(.toolbarButton)` like the fallback path, and `WindowConfigurator` now observes `NSWindow.didEnterFullScreenNotification` / `NSWindow.didExitFullScreenNotification`, `NSWindow.didResizeNotification`, `NSWindow.didChangeScreenNotification`, and `NSWindow.didBecomeKeyNotification` to reapply hidden titlebar/toolbar chrome after fullscreen, Fill, display, resize, and focus transitions; the titlebar accessory cleanup is guarded through `clearTitlebarAccessories(window)` / `clearMainWindowTitlebarAccessories(window)`, `Selector(("setTitlebarAccessoryViewControllers:"))`, and `window.responds(to: selector)`, because direct `window.titlebarAccessoryViewControllers = []` raised `NSInvalidArgumentException` on SwiftUI `AppKitWindow` in the installed app; `scripts/verify-installed-draft-chrome.mjs` now opens and scans `loom://bundle/sources` and `loom://bundle/draft`, rejects foreground text in the left, detail, and center titlebar regions plus residual standard macOS sidebar-toggle glyphs, includes the `sidebarToggleSafeX0` / `sidebarToggleGlyphTopPt` scan, compares primary surfaces with `evaluatePrimaryChromeScans`, auto-relaunches stale installed processes before strict UI acceptance, and scans without mistaking window background for text; `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639 static web files; Computer Use verified the live installed app across Sources and Draft after the rebuild. Fresh strict screenshot evidence at 2026-05-12 00:02 AEST: `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` passed against installed pid `81620`, window `48190`; kept screenshots are `loom-installed-draft-chrome-sources-81603.png` and `loom-installed-draft-chrome-draft-81603.png`; measured positions were Sources `sidebarTopPt=72.0` / `detailTopPt=71.0` and Draft `sidebarTopPt=90.0` / `detailTopPt=96.5`. | Covered for the current primary-page chrome regression |
| Default product verification must run repeatable new-Loom gates. | `verify:product` now runs `verify:approval-gates-ready`, `verify:fixture-files-importer`, `verify:compile-quality`, `verify:compile-provider-stub`, `verify:native-provider-stub`, and after `app:user` / `app:smoke` also runs `verify:installed-draft-chrome`; `verify:fixture-files-importer` generates a temporary non-sensitive corpus, reuses `scripts/verify-real-file-importer.mjs --root <temp>`, and deletes the fixture root afterward, so default product verification proves the importer primitives without scanning user files or pretending the installed-app UI import approval gate is closed; `verify:native-provider-stub` runs through `scripts/verify-native-provider-stub.mjs`, which calls `clean-loom-app-bundles.mjs` in `finally` so Xcode Debug `Loom.app` bundles do not remain registered beside the installed app; product-gate tooling avoids Desktop/FileProvider hangs because static export publishes with in-place `rsync --delete`, native provider stub verification runs Xcode from a temporary rsynced workspace that excludes the ignored nested `LOOM/` archive, and regular production builds plus smoke/start use `.next-build-current` instead of the corrupted historical `.next-build` tree; latest full `npm run verify:product` completed with exit code 0 at 2026-05-14 23:20 AEST, including the approval-gate readiness check, fixture importer, typecheck, contracts, compile quality/provider stubs, native provider stub, capture interactive export tests, captures landing tests, build, web smoke, whitespace check, macOS project check, extension staging, installed user app build, installed app smoke, installed Draft chrome verification, and generated cleanup; it deliberately does not run `verify:real-files-importer` or live provider acceptance because those gates remain approval-bound. | Covered for non-approval gates; approval-bound gates remain opt-in |
| Real user-file installed-app importer acceptance. | `npm run verify:real-files-importer` exists and covers representative real-file importer extraction non-interactively; it now refuses to run unless `--root PATH` or `LOOM_REAL_FILE_ROOT` is supplied, so the repeatable gates cannot silently scan a real-file corpus; fresh 2026-05-11 09:06 AEST run passed against `/Users/yinyiping/Desktop/Knowledge System/UNSW` with coverage `pdfs=391`, `images=2827`, `attributedDocuments=14`, `decks=1`, `iwork=0`, including 3 PDFs, 3 images, 1 DOCX, and a 43-slide PPTX; no real user files were dragged or opened in the installed app in the latest slices. | Open; requires explicit user approval to import real files through UI |
| Live provider-output Compile/Draft acceptance. | Draft and Compile prompt/render contracts cover provider-visible context and safe artifact output; `npm run verify:compile-provider-stub` now runs a local OpenAI-compatible provider stub through prompt sending, response extraction, artifact parsing, safe HTML rendering, and privacy leakage checks; `npm run verify:native-provider-stub` runs native `CustomEndpointClientTests` against a local `URLProtocol` stub for OpenAI-compatible request bodies and SSE chunks; focused `tests/new-loom-draft-storage.test.ts` prompt-budget cases plus targeted native `LoomDraftAIPrompt` and `LoomDraftInlineEdit` XCTest cases now prove the web/native Draft prompt builders bound repeated multi-source context before provider send; focused `tests/new-loom-compile-pipeline.test.ts` plus native `LoomCompilePipeline` XCTest coverage now prove web/native Compile prompt builders bound oversized scratch, active-source excerpt, prior notes, Ask history, attached references, and final instruction before provider send. No real provider/AI call was made in the latest slices. | Open; requires explicit approval before a real provider call |

Do not mark the full new Loom goal complete until these gates are closed.

## Approval-Bound Gate Runbook

Do not run either acceptance gate without a fresh user approval in the current
conversation. Passing this runbook or `npm run verify:approval-gates-ready`
only proves the final gates are explicit and ready; it does not close them.

1. Real user-file UI import:
   - Required approval: the user explicitly approves importing one or more real
     local files through the installed Loom UI.
   - Preparation allowed before approval: run `npm run app:user`,
     `npm run app:smoke`, and `npm run verify:approval-gates-ready`.
   - Acceptance path after approval: relaunch the installed
     `/Users/yinyiping/Applications/Loom.app`, use Computer Use on Sources
     `Add files`, select only the user-approved files, verify they land in
     Sources with original files untouched, then record the exact imported
     filenames and installed-app UI evidence.
   - Boundary: `npm run verify:real-files-importer` is useful noninteractive
     extraction evidence, but it runs native importer primitives without
     launching Loom.app and therefore does not satisfy installed-app UI import
     acceptance by itself.

2. Live provider-output:
   - Required approval: the user explicitly approves a real provider call and
     names the provider/model or confirms the currently configured provider.
   - Preparation allowed before approval: run `npm run verify:compile-quality`,
     `npm run verify:compile-provider-stub`, `npm run
     verify:native-provider-stub`, and `npm run verify:approval-gates-ready`.
   - Acceptance path after approval: use a small non-sensitive Draft/Compile
     prompt in the installed app, confirm the provider-visible context before
     sending, make one real provider call, verify the returned artifact renders
     through the Compile/Draft surface, and record the provider/model plus
     visible artifact evidence.
   - Boundary: current evidence states `No real provider/AI call was made`;
     local provider stubs and privacy checks do not close live provider-output
     acceptance.

## Current Evidence

- Update at 2026-05-15 13:18 AEST:
  - `macos-app/Loom/Sources/CapturesView.swift` now reads `CaptureAST`
    sidecars into `CaptureEntry.artifactStates` and exposes a
    `primaryArtifactState`, preferring `segment-diagram`.
  - `macos-app/Loom/Sources/LoomURLSchemeHandler.swift` now includes
    `captureASTFilename` and serialized `artifactStates` in
    `loom://native/captures-list.json`.
  - `app/knowledge/KnowledgeHomeStatic.tsx` now carries `captureAst` in the
    reader URL and emits `artifactTargetId`, `artifactKind`, `artifactLabel`,
    `artifactState`, and `artifactStateLabel` into Draft capture-reference links.
  - `macos-app/Loom/Sources/LoomLibraryView.swift` now attaches the native
    capture `primaryArtifactState` to the Draft reference when the user sends a
    capture to Draft.
  - Focused web tests passed: `tests/knowledge-home-source-library.test.tsx`
    and `tests/capture-media-contract.test.ts`.
  - Focused native test passed:
    `LoomTests/CapturePlacementTests/testDeletingCaptureRemovesOnlyOwnedSidecarFiles`.
  - This directly addresses the flipdisc failure mode where structured frame
    diagrams could reach Draft/Compile as only flat `0x80 0x83 0x01 imageData
    0x8F` text. It does not replace the still-needed installed-app recapture
    acceptance.

- Update at 2026-05-15 13:08 AEST:
  - `lib/new-loom/compile-pipeline.ts` now bounds Compile provider-visible
    title, scratch, active-source excerpt, prior notes, Ask history, attached
    references, and the final instruction with an 8000-character default prompt
    budget and `[truncated for provider context]` marker.
  - `macos-app/Loom/Sources/SourceFileView.swift` applies the same compact
    provider budget inside native `LoomCompilePipeline.buildPrompt`.
  - `npx tsx --test tests/new-loom-compile-pipeline.test.ts --test-name-pattern
    "Compile prompt builds|Compile prompt bounds oversized|Compile prompt pins
    mixed scratch|Compile privacy inspection"` passed 37/37.
  - `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme
    Loom -configuration Debug -destination 'platform=macOS'
    -only-testing:LoomTests/LoomDraftStoreTests/testCompilePromptBoundsOversizedScratchAndSourceContextForSmallLocalProviders`
    passed. The command still prints a CoreSimulator version warning from the
    local Xcode install, but the targeted macOS test exited 0.
  - This closes another pre-approval context-window hole. It does not close live
    provider-output acceptance because no real provider call was made.

- Update at 2026-05-15 12:45 AEST:
  - `lib/new-loom/draft-storage.ts` now exports `buildBoundedDraftAIPrompt`,
    which bounds title, body, attached reference lines, inline @reference lines,
    and selected corpus context with a 6000-character default provider budget and
    `[truncated for provider context]` marker.
  - `app/draft/DraftClient.tsx` keeps its existing `buildDraftAIPrompt` wrapper
    but routes Continue writing through the bounded shared helper, so existing
    Draft contracts stay stable while provider-visible context is capped.
  - `macos-app/Loom/Sources/LoomDraftView.swift` now applies the same 6000
    character budget inside native `LoomDraftAIPrompt`.
  - `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern
    "Draft AI prompt bounds attached source context"` passed 37/37.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern
    "Draft AI"` passed 96/96.
  - `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme
    Loom -configuration Debug -destination 'platform=macOS'
    -only-testing:LoomTests/LoomDraftStoreTests/testDraftAIPromptBoundsAttachedSourceContextForSmallLocalProviders`
    passed. The command still prints a CoreSimulator version warning from the
    local Xcode install, but the targeted macOS test exited 0.
  - This reduces the known live-provider risk from multi-source Draft prompts
    exceeding small local provider windows; it does not close live
    provider-output acceptance because no real provider call was made.

- Update at 2026-05-15 12:55 AEST:
  - `lib/new-loom/draft-storage.ts` now also exports
    `buildBoundedDraftInlineEditPrompt`, including a bounded selected-passage
    budget, so Cmd-K inline edit cannot bypass the provider context cap.
  - `app/draft/DraftClient.tsx` keeps its existing
    `buildDraftInlineEditPrompt` wrapper but routes it through the bounded
    shared helper.
  - `macos-app/Loom/Sources/LoomDraftView.swift` now applies the same 6000
    character provider budget inside native `LoomDraftInlineEdit`.
  - `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern
    "Draft AI prompt bounds attached source context|Draft inline edit prompt
    bounds selected source context"` passed 38/38.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern
    "Draft composes with AI|Draft AI prompt carries inline @references|Draft AI
    uses whole-corpus context|Draft exposes Cmd-K inline edit"` passed 96/96.
  - `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme
    Loom -configuration Debug -destination 'platform=macOS'
    -only-testing:LoomTests/LoomDraftStoreTests/testDraftInlineEditPromptBoundsSourceContextForSmallLocalProviders`
    passed. The command still prints a CoreSimulator version warning from the
    local Xcode install, but the targeted macOS test exited 0.
  - This closes another pre-approval context-window hole. It does not close live
    provider-output acceptance because no real provider call was made.

- Update at 2026-05-15 12:30 AEST:
  - `docs/projects/active/README.md` now starts new Loom continuation threads
    from the current acceptance status, then the completion audit, then the
    legacy-surface migration map. The older 2026-05-08 skeleton docs are
    explicitly historical reference only, and old Phase 1 / Collect / Organize
    snippets must now be translated into the current Sources / Studio / Digital Me
    model before acting.
  - `scripts/verify-new-loom-completion-audit.mjs` now reads that active README
    and fails if the continuation reading order, historical skeleton boundary,
    Sources / Studio / Digital Me translation rule, or either approval-bound gate name is
    missing.
  - `scripts/verify-approval-gates-ready.mjs --json` now emits a
    machine-readable evidence checklist for the two approval-bound gates. It
    lists allowed pre-approval commands, post-approval acceptance actions,
    required evidence fields, and forbidden pre-approval actions. The checklist
    requires Computer Use accessibility evidence for real-file UI import,
    forbids desktop screenshots without explicit approval, requires the
    provider-visible context summary before send, and constrains live-provider
    acceptance to exactly one approved real provider call.
  - Focused verification passed:
    `node scripts/verify-new-loom-completion-audit.mjs`;
    `node scripts/verify-approval-gates-ready.mjs --json`;
    `npx tsx --test tests/loom-app-scripts.test.ts --test-name-pattern "new Loom completion audit verifier keeps approval-bound gates explicit"`;
    and `git diff --check docs/projects/active/README.md
    scripts/verify-new-loom-completion-audit.mjs tests/loom-app-scripts.test.ts`.
  - The two approval-bound gates remain open and must not be collapsed into
    automated verification: real user-file installed-app import acceptance and
    live provider-output Compile/Draft acceptance.
- Update at 2026-05-15 03:00 AEST:
  - `npm run verify:flipdisc-live-handoff` passed again against live `https://flipdisc.io/` using the staged Atlas extension content script and a temporary native handoff fixture.
  - The live verifier now counts video attachments from both web-side `mimeType` payloads and native `mime` payloads, matching the fixture writer's current native `tmpId` / `mime` / `base64` media attachment shape.
  - The fresh handoff evidence was `bodyStartsWithCanvasReplay=true`, `mediaAttachmentVideoCount=1`, `animatedCanvas.replayCount=1`, and `unresolvedMediaReferences=[]`; the saved fixture verifier also returned `ok: true` for the generated `Loom.md` sidecar.
  - `scripts/verify-new-loom-completion-audit.mjs` now fails unless the audit explicitly records the `https://flipdisc.io` gate, both `verify:flipdisc-live` and `verify:flipdisc-live-handoff`, the native media attachment shape, the canvas replay signal, the single video attachment, and no unresolved media references.
  - Focused TDD verification passed after the hardening: `npx tsx --test tests/capture-handoff-verifier.test.ts --test-name-pattern "live flipdisc verifier can write"`, `npx tsx --test tests/loom-app-scripts.test.ts --test-name-pattern "new Loom completion audit verifier"`, and `node scripts/verify-new-loom-completion-audit.mjs`.
  - The two approval-bound gates remain open and must not be collapsed into automated verification: real user-file installed-app import acceptance and live provider-output Compile/Draft acceptance.
- Update at 2026-05-15 02:21 AEST:
  - `npm run verify:flipdisc-live-handoff` was rerun after the Playwright-browser-cache gap exposed that the live verifier needed a local Google Chrome fallback; `scripts/verify-flipdisc-live-extension.mjs` now uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or an installed local Chrome before falling back to Playwright's bundled Chromium cache.
  - The first rerun reproduced a real fixture-writer bug: the live capture payload contained native `tmpId` / `mime` / `base64` media attachments, but `writeFixtureMediaAttachments` still read the older `src` / `mimeType` / `data` shape. That left six temporary `loom://media/...` references unresolved in the generated saved-capture fixture even though the live extractor had captured the flipdisc structure.
  - `writeFixtureMediaAttachments` now accepts the native payload shape, writes media files with MIME-derived extensions, strips data-URL prefixes when present, and substitutes `loom://media/<tmpId>` in both Markdown and CaptureAST. `npx tsx --test tests/capture-handoff-verifier.test.ts --test-name-pattern "live flipdisc verifier"` passed 7/7.
  - The final `npm run verify:flipdisc-live-handoff` passed with `ok: true`: `Frame Format` was preserved as a segment diagram with `0x80 0x83 0x01 imageData 0x8F`, the CaptureAST reported `interactiveArtifactCount=9`, `segmentDiagramCount=1`, `animatedCanvasCount=3`, the handoff verifier reported `animatedCanvas.replayCount=1`, and `unresolvedMediaReferences=[]`.
- Update at 2026-05-15 01:33 AEST:
  - `npm run verify:installed-draft-chrome` was retried and still stopped at the preflight guard because macOS reported `IOConsoleLocked/CGSessionScreenIsLocked`. Treat the latest installed-app visual gate as environment-blocked until the desktop is unlocked; it is still not a fresh pass.
  - Safe generated-artifact cleanup was deepened after a disk-usage pass showed `.next-export-quarantine` at 376M and `.next-typecheck-build` at 233M. `scripts/clean-generated-artifacts.mjs` now removes those ignored disposable directories during `npm run clean:generated`, while preserving tracked public duplicate-named assets and leaving `node_modules` plus the current product build alone.
  - `npx tsx --test tests/loom-app-scripts.test.ts --test-name-pattern "generated cleanup"` passed 38/38, then `npm run clean:generated` passed and removed stale generated `public/pagefind/* 2` files. A follow-up `du` check showed the repo dropped from roughly 1.9G to 1.3G, with `.next-export-quarantine` and `.next-typecheck-build` gone. `npm run app:smoke` still passed afterward against `/Users/yinyiping/Applications/Loom.app`, bundle id `com.yinyiping.loom`, with 333 static web files.
- Update at 2026-05-15 00:00 AEST:
  - Current user-facing terminology scan across `app`, `lib`, `macos-app/Loom/Sources`, `scripts`, and `docs/app-store-copy.md` found no active Loom UI use of the old `Collect` / `Organize` / `Source Index` product vocabulary. The only remaining match was the unrelated RLHF teaching phrase `Collect comparison data`.
  - Release-tracking hygiene improved: new Loom product-critical files under `app`, `lib/new-loom`, `scripts/verify-*`, and `tests/new-loom-*` are now added to the git index, so the local verification chain no longer depends on purely untracked product files. The standalone root prototype `sidebar-nav-prototype.html` was removed after confirming it was not referenced by product code or package scripts.
  - WKWebView storage safety was tightened after `tests/new-loom-webview-storage-safety.test.ts` caught direct `sessionStorage` / `localStorage` access in root shell overlays. `AiKeyMissingBanner`, `RehearsalOverlay`, `ExaminerOverlay`, and `CrystallizeListener` now use `browserSessionStorage`, `browserLocalStorage`, and `safeStorage*` helpers so storage getter `SecurityError`s do not break the installed static bundle.
  - Focused gates passed after tracking cleanup and storage hardening: `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 129/129; `npx tsx --test tests/new-loom-*.test.ts` passed 187/187; `npm run verify:fixture-files-importer`, `npm run verify:compile-quality`, and `npm run verify:compile-provider-stub` passed; `npm run typecheck` completed with a 103-route static build; `node scripts/verify-new-loom-completion-audit.mjs` passed and still reported 2 approval-bound gates; `node scripts/verify-approval-gates-ready.mjs` passed; `git diff --check` passed for the touched audit, script, test, and storage-safety component files.
  - Full `npm run verify:product` was rerun after the storage hardening. It passed through `app:smoke`, including audit, approval-gate readiness, fixture importer, typecheck, 585 contract tests, compile quality/provider stubs, native provider stub, capture export, captures landing, production build, web smoke, project check, extension staging, user app build, and installed-app smoke. The final `verify:installed-draft-chrome` step did not run because macOS reported `IOConsoleLocked/CGSessionScreenIsLocked`; this is an environment acceptance blocker, not a product-code pass. `npm run clean:generated` was run manually afterward.
  - The two approval-bound gates remain open and must not be collapsed into automated verification: real user-file installed-app import acceptance and live provider-output Compile/Draft acceptance.
- Update at 2026-05-14 23:20 AEST:
  - Full `npm run verify:product` completed with exit code 0 after the 2026-05-14 verification fixes.
  - The gate covered `status:buckets`, `verify:new-loom-audit`, `verify:approval-gates-ready`, `verify:fixture-files-importer`, `typecheck`, `test:contracts`, `verify:compile-quality`, `verify:compile-provider-stub`, `verify:native-provider-stub`, `test:capture-interactive:export`, `test:captures-landing`, `build`, `smoke`, `git diff --check`, `app:check-project -- --require-tracked`, `app:stage-extension`, `app:user`, `app:smoke`, `verify:installed-draft-chrome`, and `clean:generated`.
  - `verify:native-provider-stub` now excludes the ignored nested `LOOM/` archive when it rsyncs a temporary Xcode workspace, avoiding stalls from old local checkout generations.
  - `tests/capture-interactive-artifacts.test.ts` launches Playwright with a local Google Chrome fallback when the Playwright Chromium cache is absent, matching the existing captures-landing behavior tests.
  - `scripts/smoke.mjs` and `scripts/start.mjs` now use `LOOM_BUILD_DIST_DIR` with `.next-build-current` as the default production build directory, so web smoke/start verify the same build output that `scripts/build.mjs` writes.
  - Installed app verification passed: `app:smoke` reported `/Users/yinyiping/Applications/Loom.app`, bundle id `com.yinyiping.loom`, and 333 static web files; `verify:installed-draft-chrome` reported installed primary chrome ok with Sources and Draft scans.
  - The two approval-bound gates remain open: real user-file installed-app import acceptance and live provider-output Compile/Draft acceptance.

Current terminology note: updates below this line are a historical evidence log.
Older entries may quote then-current UI labels such as Collect, Organize, or
Source Index; the current product contract is Sources / Studio / Digital Me.
`Draft` remains a route/storage/test compatibility name for the Studio document
engine, and old routes are kept only as compatibility aliases.

- Update at 2026-05-12 23:25 AEST:
  - `npm run app:user` rebuilt the static export and installed the latest native app to `/Users/yinyiping/Applications/Loom.app`.
  - After quitting the stale installed process and reopening the installed app, `npm run app:smoke` passed with no stale-process warning, bundle id `com.yinyiping.loom`, and 639 static web files.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 124/124.
  - `git diff --check -- macos-app/Loom/Sources/LoomMinimalRootView.swift macos-app/Loom/Sources/LoomDraftView.swift macos-app/Loom/Sources/CapturesView.swift tests/new-loom-skeleton-contract.test.ts` passed.
  - Computer Use inspected the fresh installed app as pid `72283` across Organize, Collect, and Draft. The left rail is compact with one fixed icon/text grid, the large sidebar/detail/toolbar backgrounds are unified on one app canvas, Collect and Organize use the same shell rhythm, and Draft's inspector is reduced to `Sources` / `Edit` / `Board` with one next action and compact source rows.
  - `npm run verify:new-loom-audit` and `npm run verify:approval-gates-ready` passed and still reported exactly two approval-bound gates: real user-file installed-app importer acceptance and live provider-output Compile/Draft acceptance.
- Update at 2026-05-12 22:13 AEST:
  - `npm run verify:new-loom-audit` passed and still reports exactly two approval-bound gates: real user-file installed-app importer acceptance and live provider-output Compile/Draft acceptance.
  - `npm run verify:approval-gates-ready` passed and confirmed those two gates still require explicit approval before running.
  - Safe non-approval gate refresh passed: `npm run verify:fixture-files-importer` used a temporary synthetic root and reported `pdfs=3`, `images=1`, `attributedDocuments=0`, `decks=0`, `iwork=0`; `npm run verify:compile-quality` passed all five no-provider quality cases; `npm run verify:compile-provider-stub` passed with 2 frames, 1 term, and 2 math expressions; `npm run verify:native-provider-stub` passed 11/11 selected `CustomEndpointClientTests` with 0 failures.
  - `npm run verify:installed-draft-chrome` could not rerun because the macOS console is locked (`IOConsoleLocked/CGSessionScreenIsLocked`). Treat this as an environment blocker for visible UI inspection, not as a Loom code regression; strict latest-binary visual acceptance still needs an unlocked desktop before the gate can rerun.
- Update at 2026-05-12 21:45 AEST:
  - The latest sidebar alignment fix makes `Collect`, `Organize`, `Draft`, folder rows, collapse toggles, and sidebar creation rows share one SwiftUI row grid through `sidebarNavigationRow(...)`, with `sidebarIconSlotWidth` plus `sidebarIconTextGap` owning the icon/text columns.
  - Native Draft's right inspector is now action-first: `Sources`, `Edit`, and `Board` modes separate reference context, block editing, and draft-card work instead of leaving several tool cards under the writing surface.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern "minimal sidebar|Collect Organize and Draft align|native primary surfaces"` passed 87/87 after first failing on the missing shared sidebar row renderer.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 123/123.
  - `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639 static web files.
  - The stale running installed process was quit, and the latest installed app was relaunched as pid `60572` from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
  - Computer Use inspected the fresh installed app across Organize, Draft, and Collect. The left rail is compact, there is a single centered `Loom` wordmark, folder rows are rendered on the same icon/text grid as the main navigation, Collect is a two-lane capture tool surface rather than a row of loose cards, Organize is a source index work surface, and Draft's source actions now live in the right inspector instead of as bottom tool cards.
- Update at 2026-05-12 07:45 AEST:
  - Static compact-shell evidence is still current: `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 118/118, `npm run verify:new-loom-audit` passed and reported the same 2 approval-bound gates, `npm run typecheck` exited 0, and `npm run test:contracts` passed 572/572.
  - `npm run verify:approval-gates-ready` passed and still reports exactly the two explicit approval-bound gates. `npm run app:smoke` passed against `/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom` and 639 static web files, but warned that running installed Loom process `90082` started before the installed executable.
  - After `npm run clean:generated` removed stale `public/pagefind/...` generated artifacts, `npm run app:check-project -- --require-tracked` passed for 109 source Swift files and 37 test Swift files, `npm run build` passed with 103 generated app routes and a fresh Pagefind index, and `npm run smoke` passed `/`, `/offline`, `/sources`, plus the knowledge manifest sample.
  - Latest installed-app visual acceptance is still blocked by the locked macOS console. `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` stopped at its preflight guard with `IOConsoleLocked/CGSessionScreenIsLocked`, so no current Computer Use / CGWindow / screenshot inspection can honestly accept or reject the visible Collect, Organize, Draft chrome.
  - Do not treat this as a Loom product-window regression. Unlock the Mac, relaunch the latest installed `/Users/yinyiping/Applications/Loom.app` so the visible process is not stale, then rerun `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` and Computer Use acceptance across Collect, Organize, Draft before closing the latest visual-shell gate.
- Update at 2026-05-12 05:43 AEST:
  - Latest compact sidebar polish narrowed the native shell left rail to `minimalSidebarWidth: 136`, reduced row height to `sidebarRowHeight: 24`, tightened icon slots to `sidebarIconSlotWidth: 14`, and moved sidebar labels to small system chrome typography through `sidebarLabelFont(isSelected:)` and `sidebarEyebrowFont()`.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 118/118.
  - `npm run test:contracts` passed 572/572.
  - `npm run typecheck`, `npm run verify:new-loom-audit`, `npm run verify:approval-gates-ready`, `npm run verify:fixture-files-importer`, `npm run verify:compile-quality`, `npm run verify:compile-provider-stub`, and `npm run verify:native-provider-stub` passed.
  - `npm run app:smoke` passed against `/Users/yinyiping/Applications/Loom.app` with 639 static web files, but reported the visible installed Loom process was started before the latest installed executable.
  - `npm run verify:installed-draft-chrome` could not run because the macOS console is locked (`IOConsoleLocked/CGSessionScreenIsLocked`). The prior strict screenshot and Computer Use evidence does not close visual acceptance for this latest compact-sidebar polish; unlock the Mac, relaunch the installed app, and rerun `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` before treating the latest visual shell as accepted.
- Update at 2026-05-12 00:11 AEST:
  - `LoomMinimalRootView.swift` now draws the toolbar bottom hairline once at the root through `rootToolbarHairline`, and both `sidebarChrome` and `detailChrome` are forbidden from drawing independent bottom rules. This directly addresses the non-fullscreen sidebar/detail horizontal-rule drift.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 82/82, including the new root-level toolbar hairline contract.
  - `npx tsx --test tests/loom-app-scripts.test.ts` passed 36/36.
  - `npx tsx --test tests/capture-media-contract.test.ts` passed 49/49.
  - `npm run verify:new-loom-audit` passed with the same two approval-bound gates still open.
  - `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639 static web files.
  - `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` passed against installed pid `81620`, window `48190`; kept screenshots are `loom-installed-draft-chrome-collect-81603.png`, `loom-installed-draft-chrome-organize-81603.png`, and `loom-installed-draft-chrome-draft-81603.png`.
  - Computer Use inspected the live installed app in non-fullscreen dark mode on Collect, Organize, and Draft. The sidebar/detail toolbar divider is now a single continuous line; surface-specific actions remain in the shared toolbar (`Add files`, `Add Question`, `Reference`, `AI`, `Save`), and Draft no longer clips the `DRAFT` eyebrow or right inspector heading.
- Update at 2026-05-11 20:15 AEST:
  - `scripts/verify-installed-draft-chrome.mjs` now captures window screenshots with `screencapture -o -l` so macOS window shadows are not treated as product top gutter during pixel scans.
  - `npx tsx --test tests/loom-app-scripts.test.ts` passed 36/36 after first failing on the missing no-shadow window capture assertion.
  - `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` passed against installed `/Users/yinyiping/Applications/Loom.app` before the full gate, with Collect `sidebarTopPt=122.5` / `detailTopPt=52.0`, Organize `sidebarTopPt=120.0` / `detailTopPt=52.0`, and Draft `sidebarTopPt=120.0` / `detailTopPt=52.0`.
  - Full `npm run verify:product` completed with exit code 0 after rebuilding and reinstalling the app. Its installed chrome gate passed against pid `34354`, window `45612`, with the same three primary surfaces aligned at detail top `52.0pt`.
  - Computer Use inspected the installed app in windowed and fullscreen states across Collect, Organize, and Draft. The surface-specific actions are in the shared toolbar (`Add files`, `Add Question`, `Reference` / `AI` / `Save`) and the main content starts directly below that toolbar without the previous blank top gutter.
- Refresh check at 2026-05-09 03:17 AEST:
  - `git diff --check` passed.
  - `git diff --cached --check` passed.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/new-loom-draft-storage.test.ts` passed 19/19.
  - `npm run test:contracts` passed 200/200.
  - `npm run typecheck` passed after rebuilding missing build artifacts.
  - `npm run verify:flipdisc-live-handoff` passed with `ok: true`, `segmentDiagramCount: 1`, and a temporary saved-capture fixture whose verifier returned `ok: true`.
  - `npm run verify:capture-handoff` still failed against the stale installed-container 2026-05-06 flipdisc capture because `segmentDiagram` is null and the sidecar lacks the expected segment-diagram frame.
  - `npm run clean:generated` passed after typecheck and removed the temporary `loom-build-trash`.
- Update at 2026-05-09 03:45 AEST:
  - Root cause for the direct native handoff crash was `NSInternalInconsistencyException`: the main window behavior briefly had both `.canJoinAllSpaces` and `.moveToActiveSpace` during capture URL activation.
  - `LoomApp.swift` now removes `.moveToActiveSpace`, inserts `.canJoinAllSpaces`, and assigns the sanitized collection behavior atomically before opening the capture sheet.
  - `scripts/verify-flipdisc-live-extension.mjs --write-payload-json` now exports a native clipboard payload with URL, capture mode, and media attachments.
  - Computer Use verified installed `/Users/yinyiping/Applications/Loom.app` saved the fresh direct handoff, opened the reader, showed `flipdisc.io`, enabled `Open original` and `Re-capture`, rendered the `CAPTURED STRUCTURE` segment diagram, and played inline media from `loom://content/.../Loom-media-...mp4`.
  - `npm run verify:capture-handoff` passed against the fresh saved capture at `/Users/yinyiping/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/b5ccf3fe-835b-4d5b-a5d2-ed9c228ee684/sub/Web/flipdisc.io/Loom.md`, sidecar `Loom-capture-ast-20260509-034508-dfe258f60630.json`, with `segmentDiagramCount: 1`.
  - `npx tsx --test tests/capture-handoff-verifier.test.ts tests/captures-landing-refresh-contract.test.ts` passed 15/15.
  - `npm run verify:flipdisc-live-handoff` passed.
  - `npm run app:smoke` passed for the installed app.
  - `git diff --check` and `git diff --cached --check` passed.
- Update at 2026-05-09 03:58 AEST:
  - Computer Use clicked the visible floating Loom button inside ChatGPT Atlas on `https://flipdisc.io`.
  - Atlas logs showed one capture chain: `[Loom] floating button clicked`, media preparation, recording, remote media saving, payload capture, and `Launched external handler for 'loom://capture?via=clipboard'.`
  - Installed Loom switched to the UI-triggered capture `clipboard · 2026-05-09 03:58`.
  - Reader showed `Open original`, `Re-capture`, `CAPTURED STRUCTURE`, and the expected frame tokens `0x80`, `0x83`, `0x01`, `imageData`, `0x8F`.
  - Clicking `Play recorded animation inline` mounted a real video control backed by `loom://content/.../Loom-media-6084b51b9edb.mp4`.
  - `npm run verify:capture-handoff` passed against `Loom-capture-ast-20260509-035854-8844637cd908.json` with `segmentDiagramCount: 1`, snapshot `Loom-snapshot-20260509-035854-6a49.html`, and `unresolvedMediaReferences: []`.
  - The transient-media verifier was tightened so saved captures fail if the selected entry still contains unresolved `loom://media/...` references. Synthetic pre-native-save fixtures must opt in with `--allow-transient-media`.
  - A floating-button in-flight guard was added and staged so repeated Atlas activations cannot corrupt shared capture media queues.
  - `npx tsx --test tests/capture-media-contract.test.ts` passed 47/47.
  - `npx tsx --test tests/capture-handoff-verifier.test.ts` passed 5/5.
- Update at 2026-05-09 04:14 AEST:
  - Computer Use re-ran the real Atlas UI path after reinstalling the app.
  - Clicking the visible Loom button on `https://flipdisc.io` generated `clipboard · 2026-05-09 04:14`.
  - The installed reader showed `SOURCE SNAPSHOT`, structured media, `CAPTURED STRUCTURE`, and the frame tokens.
  - Clicking `Play recorded animation inline` mounted a real video control backed by `loom://content/.../Loom-media-a4d187883532.mp4`.
  - `npm run verify:capture-handoff` passed on the fresh 04:14 capture with `unresolvedMediaReferences: []`.
  - `npm run app:check-extension` confirmed Atlas extension version `1.4.9` loaded from the staged Loom extension mirror.
- Update at 2026-05-09 04:21 AEST:
  - Recent captures in Source Index now expose a Draft action that creates `/draft` references to the capture reader artifact with `kind=capture`, source label, and capture timestamp.
  - Web Draft storage and native `LoomDraftStore` preserve capture reference metadata (`kind`, `capturedAt`) across dedupe, save, and reopen.
  - Draft reference panels now label capture references distinctly from source references.
  - `npx tsx --test tests/new-loom-draft-storage.test.ts tests/knowledge-home-source-library.test.tsx` passed 23/23.
  - `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test` passed 5/5.
  - `npm run test:contracts` passed 206/206.
  - `npm run typecheck` passed after rebuilding missing build artifacts.
- Update at 2026-05-09 04:39 AEST:
  - Native Draft references now expose `Open reference`.
  - Capture references reopen through `.loomOpenCapture`, so Draft can return to the saved reader artifact instead of becoming a dead-end citation panel.
  - Computer Use verified installed `/Users/yinyiping/Applications/Loom.app`: Draft showed `Open reference: Flipdisc Display Build and Software Guide`; clicking it opened the Flipdisc capture reader with `SOURCE SNAPSHOT`, `CAPTURED STRUCTURE`, and the expected frame tokens.
  - `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 14/14 after first failing on the missing native open action.
  - `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test` passed 6/6.
  - `npm run test:contracts` passed 207/207.
  - `npm run typecheck` passed after rebuilding missing build artifacts.
  - `npm run app:user`, `npm run app:smoke`, `npm run verify:capture-handoff`, `npm run app:check-extension`, `npm run clean:generated`, `git diff --check`, and `git diff --cached --check` passed.
- Update at 2026-05-09 04:44 AEST:
  - Native Source Index Continue writing rows now attach a `kind=source` Draft reference before navigating to Draft.
  - Computer Use verified installed `/Users/yinyiping/Applications/Loom.app`: clicking `ECON 3202, draft surface` opened Draft with `Source ECON 3202` in the References panel.
  - Clicking `Open reference: ECON 3202` returned to the native `ECON 3202 Resources` folder view, including `Guide`, `Problem Set Submission`, `Week`, and `W1 A Elements Logic.pdf`.
  - `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 15/15 after first failing on the missing native Continue writing source handoff.
  - `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test` passed 6/6.
  - `npm run test:contracts` passed 208/208.
  - `npm run typecheck` passed after rebuilding missing build artifacts.
  - `npm run app:user` reinstalled `/Users/yinyiping/Applications/Loom.app` before the Computer Use check.
- Update at 2026-05-09 04:51 AEST:
  - Native Source Index now classifies writing-ready state through `LoomSourceWritingClassifier`.
  - Generated resource inventories no longer count as writing surfaces: `## Resources`, resource links, `loom://anchor` source links, and markdown-linked document headings are ignored.
  - Source Draft references can now carry a `draftExcerpt`, but only when real user note/body lines exist.
  - Computer Use verified installed `/Users/yinyiping/Applications/Loom.app`: the current resource-only `ECON 3202` and `INFS 3822` rows show `writing empty`, and the Continue writing panel says `No writing surface is waiting.`
  - `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests -only-testing:LoomTests/LoomSourceWritingClassifierTests test` passed 8/8 after first failing on the missing classifier.
  - `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 15/15.
  - `npm run test:contracts` passed 208/208.
  - `npm run app:user` reinstalled `/Users/yinyiping/Applications/Loom.app` before the Computer Use check.
- Update at 2026-05-09 04:52 AEST:
  - Web `/sources` Continue writing links now send readable Draft reference metadata instead of only bare internal refs.
  - Each writing entry adds collection and writing references with paired `ref`, `label`, `kind=source`, and `source` query values, so `/draft` can render user-facing reference labels.
  - `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 15/15 after first failing on the missing metadata helper.
- Update at 2026-05-09 05:34 AEST:
  - Current Computer Use acceptance is blocked by the macOS console session being locked: `CGSessionScreenIsLocked = 1`.
  - In this state Computer Use returns `cgWindowNotFound` for Loom because the active UI surface is `loginwindow`, not the installed app. Do not treat this specific failure as a Loom product-window regression without rerunning after unlocking the session.
  - The installed `/Users/yinyiping/Applications/Loom.app` was rebuilt from Release, reinstalled, code-signed, and still contains 635 static web files.
  - Current non-UI gates passed: focused new-Loom/source/app-store tests 35/35, `npm run test:contracts` 208/208, `npm run typecheck`, `npm run app:smoke`, and `npm run app:check-extension`.
- Update at 2026-05-09 05:41 AEST:
  - Computer Use was retried against both `Loom` and `com.yinyiping.loom`. `list_apps` reported Loom running from the installed bundle, but `get_app_state` returned `connectionInvalid` / `cgWindowNotFound`.
  - `ioreg -n Root -d1` confirmed `CGSSessionScreenIsLocked=Yes`, and System Events reported zero Loom windows while locked. This remains a CUA-session blocker; rerun after unlocking before accepting or rejecting the installed visual surface.
- Update at 2026-05-09 05:55 AEST:
  - `/collect` is now a concrete first-level web route instead of a shell hash or native-only route token. The page gives Collect actions for web capture setup, capture review, and Source Index return without linking to legacy product concepts.
  - The new-Loom product shell now treats `/collect` as a primary route, and the primary-surface contract covers `/`, `/collect`, `/sources`, and `/draft` for legacy/internal link leakage. The old top-level `/knowledge` route is now treated as a `/sources` compatibility alias instead of a second primary Organize entry.
  - `NavigationBridgeHandler` now forwards web-shell `navigate` and `startCapture` actions to `.loomShuttleNavigate` instead of swallowing them.
  - `LoomApp.handleCaptureURL` now removes `.moveToActiveSpace` before inserting `.canJoinAllSpaces`, preserving the guard against the capture URL activation crash.
  - Latest non-UI gates passed: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` 12/12, `npm run test:contracts` 210/210, `npm run typecheck`, and `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' build`.
  - A direct temporary Next build with `LOOM_DIST_DIR=.next-route-check LOOM_NEXT_OUTPUT=standalone LOOM_NEXT_BUILD_LOCK_HELD=1 node node_modules/next/dist/bin/next build` emitted `○ /collect`. The normal `npm run build` wrapper was blocked during stale `.next-build` rename cleanup, not by route compilation.
  - Computer Use acceptance was retried again after the user explicitly requested it. `get_app_state("Loom")` still returned `cgWindowNotFound`, `list_apps` still saw `Loom - com.yinyiping.loom [running]`, `ioreg` still reported `CGSSessionScreenIsLocked=Yes`, and System Events reported zero Loom windows. Installed visual acceptance remains blocked until the Mac is unlocked.
- Update at 2026-05-09 05:59 AEST:
  - `/collect` now uses `CollectClient` instead of a static action list. It hydrates recent capture entries from `loom://native/captures-list.json`, opens the real capture reader artifact with `loom://bundle/loom-render/capture`, and creates `/draft` links carrying `ref`, `label`, `kind=capture`, `source`, and `capturedAt` metadata.
  - The first-level Collect page no longer links to the runtime captures landing `/loom-render/captures`; that runtime surface remains buildable but is not promoted as a product destination.
  - The primary-surface contract now includes `app/collect/CollectClient.tsx` in the legacy/internal leakage check.
  - Red/green evidence: the new skeleton contract first failed on missing `CollectClient.tsx`, then passed after implementation.
  - Latest gates passed after this Collect deepening: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` 13/13, `npm run test:contracts` 211/211, `npm run typecheck`, `git diff --check`, and a direct temporary Next build that emitted `○ /collect`.
- Update at 2026-05-09 06:02 AEST:
  - Source Index now has a `Reader notes` current-work panel built from per-source capture reader note/highlight counts, so note and highlight review appears inside Organize instead of depending only on the legacy `/notes` and `/highlights` routes.
  - The migration map now splits `/notes` and `/highlights` into an explicit Organize migration-source row: fold reader note/highlight review into Source Index, then keep the old routes direct/internal until trace-backed notes are migrated or deleted.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first failed on missing `readerStateItems`, then passed 16/16 after implementation.
  - Latest gates passed after this Organize deepening: `npm run test:contracts` 212/212, `npm run typecheck`, `git diff --check`, and a direct temporary Next build that emitted `○ /sources`.
- Update at 2026-05-09 06:04 AEST:
  - Native Source Index now mirrors the web Reader notes current-work panel. `LoomLibraryView` derives `readerStateEntries` from source note, capture highlight, and capture note counts; the panel opens the matching source group.
  - `SourceRootSummary.readerStateDetail` gives the native row an explicit summary of capture highlights, capture notes, and source notes, matching the Organize-first migration away from standalone `/notes` and `/highlights` as product concepts.
  - Red/green evidence: the native source-library contract first failed on missing `Reader notes`, then passed 16/16 after implementation.
  - Latest native/web gates passed after this native alignment: `npm run test:contracts` 212/212 and `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' build` with `** BUILD SUCCEEDED **`.
- Update at 2026-05-09 06:08 AEST:
  - Trace-backed `/notes` and `/highlights` review is now folded into Source Index through `useAllTraces()` and `fetchSearchIndex()`. `traceReaderEntriesFromTraces()` counts `thought-anchor` and `highlight` events and resolves readable source labels from the search index before the static Organize view renders them in Reader notes.
  - The `/notes` and `/highlights` migration map now records that trace-backed and capture-reader note/highlight review belong in Source Index while the old routes stay direct/internal until compatibility deletion is safe.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first failed on the missing trace imports/functions, then passed 16/16 after implementation.
  - Latest gates passed after this trace-backed migration: `npx tsx --test tests/knowledge-home-source-library.test.tsx` 16/16, `npm run typecheck`, `npm run test:contracts` 212/212, `git diff --check`, and a direct temporary Next build that emitted `○ /sources`.
- Update at 2026-05-09 06:09 AEST:
  - Computer Use acceptance was retried because the user explicitly requested CUA verification.
  - `get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`; `list_apps` still saw `Loom - com.yinyiping.loom [running]`.
  - `ioreg -n Root -d1` reported `CGSessionScreenIsLocked=Yes`, System Events reported zero Loom windows, and the installed process was still running from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
  - Treat this as a macOS locked-session CUA blocker. It is not installed visual acceptance and should be rerun after the session is unlocked.
- Update at 2026-05-09 06:12 AEST:
  - Trace-backed Reader notes in Source Index now preserve concrete note/highlight entries instead of only per-source counts.
  - `traceReaderEntriesFromTraces()` emits `kind: 'note'` and `kind: 'highlight'` rows with summaries, source titles, timestamps, and anchor ids where available.
  - `KnowledgeHomeStatic` opens those rows with `openPanelReview(router, { href, anchorId })`, preserving the old `/notes` ability to jump back to the reviewed source anchor from inside Organize.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first failed on the missing detailed trace entry/open-review contract, then passed 16/16 after implementation.
  - The first full `npm run test:contracts` retry exposed a server-render compatibility regression in `tests/quiet-horizon-layout.test.tsx`: direct `useRouter()` usage in `KnowledgeHomeStatic` required App Router context.
  - Root cause fix: the review action now keeps the anchor `href` fallback and uses a small `pushViaLocation` router-like adapter only when the user clicks a Reader notes row, so server rendering remains context-free.
  - Latest gates passed after this Organize detail migration: `npx tsx --test tests/knowledge-home-source-library.test.tsx` 16/16, `npx tsx --test tests/quiet-horizon-layout.test.tsx` 5/5, `npm run test:contracts` 212/212, `npm run typecheck`, `git diff --check`, and a direct temporary Next build that emitted `○ /sources`.
- Update at 2026-05-09 06:15 AEST:
  - Computer Use acceptance was retried after the Organize detail migration.
  - `get_app_state("Loom")` still returned `cgWindowNotFound`; `ioreg -n Root -d1` still reported `CGSessionScreenIsLocked=Yes`; System Events still reported zero Loom windows; the installed app process was still running from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
  - Installed visual acceptance remains blocked by the locked macOS session and must be rerun after unlock.
- Update at 2026-05-09 06:16 AEST:
  - Trace-backed Reader notes now hand off to Draft, not only source review. `traceReaderDraftHref()` builds `/draft` references with `kind=source`, source title, and the note/highlight summary as `excerpt`.
  - This preserves the old `/notes` and `/highlights` value of collecting saved understanding while moving the next action into the Collect / Organize / Draft loop.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first failed on the missing Reader notes Draft handoff, then passed 16/16 after implementation.
- Update at 2026-05-09 06:17 AEST:
  - Gates after the Reader notes Draft handoff passed: `npm run test:contracts` 212/212, `npm run typecheck`, `npx tsx --test tests/quiet-horizon-layout.test.tsx tests/new-loom-draft-storage.test.ts` 15/15, `git diff --check`, and a direct temporary Next build that emitted `○ /sources`.
  - Computer Use acceptance was retried and remains blocked: `get_app_state("Loom")` returned `cgWindowNotFound`, `CGSessionScreenIsLocked=Yes`, System Events reported zero Loom windows, and the installed app process still existed at `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
- Update at 2026-05-09 06:19 AEST:
  - `/notes` and `/highlights` are now compatibility redirects to `/sources#reader-notes`.
  - `KnowledgeHomeStatic` gives the Reader notes panel the stable `reader-notes` anchor, so old note/highlight URLs land in Organize instead of reviving standalone product concepts.
  - Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed on the old `/notes` page loading trace/search/review code, then passed 14/14 after the redirects and Source Index anchor were added.
- Update at 2026-05-09 06:21 AEST:
  - Gates after the `/notes` and `/highlights` compatibility redirect passed: focused new-Loom/source/quiet tests 35/35, `npm run typecheck`, `npm run test:contracts` 213/213, `git diff --check`, and a direct temporary Next build that emitted lightweight `○ /notes`, `○ /highlights`, and the full `○ /sources`.
  - Computer Use acceptance was retried again and remains blocked by the locked session: `get_app_state("Loom")` returned `cgWindowNotFound`, `CGSessionScreenIsLocked=Yes`, System Events reported zero Loom windows, and the installed app process was still running from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
- Update at 2026-05-09 06:24 AEST:
  - `/today` is now a compatibility redirect to `/sources`, so "current work" enters Organize rather than reviving the legacy Desk route.
  - The legacy migration map now splits `/today` into its own Organize compatibility row; `/desk`, `/contents`, and `/uploads` remain migration sources pending concrete job-by-job replacement.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/today` still redirected to `/desk`.
  - Green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 15/15 after the redirect and migration-map update.
  - Wider gates passed: `npm run typecheck`, `npm run test:contracts` 214/214, and a direct temporary Next build that emitted lightweight `○ /today` plus the full `○ /sources`.
- Update at 2026-05-09 06:26 AEST:
  - `/contents` is now a compatibility redirect to `/sources`, so the old table-of-contents surface map no longer exposes hidden legacy product concepts.
  - The legacy migration map now splits `/contents` into its own Organize compatibility row; `/desk` and `/uploads` remain migration sources pending safer job-specific replacement.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/contents` still loaded `ContentsClient`.
  - Green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 16/16 after the redirect and migration-map update.
  - Wider gates passed: `npm run typecheck`, `npm run test:contracts` 215/215, and a direct temporary Next build that emitted lightweight `○ /contents`, `○ /today`, `○ /notes`, and `○ /highlights` redirects plus the full `○ /sources`.
  - Computer Use acceptance was retried and remains blocked by the locked macOS session: `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, System Events reported zero Loom windows, the installed process still existed, and `ioreg` reported `CGSessionScreenIsLocked=Yes`.
- Update at 2026-05-09 06:28 AEST:
  - `/atlas`, `/atlas/shelf`, and `/browse` are now compatibility redirects to `/sources`, so old source-shelf aliases no longer pass through the legacy Desk route.
  - The legacy migration map now groups those aliases under an explicit Organize compatibility row instead of leaving `/browse` in internal/demo surfaces.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/atlas` still redirected to `/desk`.
  - Green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 17/17 after the redirects and migration-map update.
  - Stale legacy assertions were realigned with the new product path: `npx tsx --test tests/legacy-top-level-aliases.test.ts tests/browse-compatibility-surface.test.ts tests/atlas-hub-phase2.test.ts tests/desk-first-ia.test.ts tests/canonical-hotpaths.test.ts` passed 10/10.
  - Wider gates passed: `npm run typecheck`, `npm run test:contracts` 216/216, and a direct temporary Next build that emitted lightweight `○ /atlas`, `○ /atlas/shelf`, `○ /browse`, `○ /contents`, and `○ /today` compatibility pages plus the full `○ /sources`.
- Update at 2026-05-09 06:33 AEST:
  - Native Shuttle command palette now exposes Collect, Organize, and Draft as the product commands. Old route names such as Desk, Workbench, Patterns, Weaves, Notes, Highlights, and Contents are no longer visible command labels; useful aliases remain as search keywords that resolve to the new commands.
  - `tests/shuttle-canonical-ia.test.ts` is now part of `npm run test:contracts`, so this native product-language gate runs with the main contract suite.
  - Red evidence: `tests/shuttle-canonical-ia.test.ts` first failed because the Shuttle command list still showed Desk-era command labels.
  - Green evidence: `npx tsx --test tests/shuttle-canonical-ia.test.ts` passed 2/2 after the command-list migration.
  - Wider gates passed: `npm run typecheck`, `npm run test:contracts` 218/218, and `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' build` with `** BUILD SUCCEEDED **`.
  - Computer Use acceptance was retried and remains blocked by the locked macOS session: `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, System Events reported zero Loom windows, the installed process still existed, and `ioreg` reported `CGSessionScreenIsLocked=Yes`.
- Update at 2026-05-09 06:41 AEST:
  - `/uploads` is now a compatibility redirect to `/collect`, so file intake starts from Collect instead of a separate Intake product page.
  - Web Collect now exposes an `Add files` action through the existing upload button, and native Collect now exposes an `Add files` action that opens the Ingestion surface.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because Collect did not yet import `UploadButton` or own `data-capability="collect-file"`.
  - Green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 18/18 after the Collect file-intake migration, and `npx tsx --test tests/source-authority-contract.test.ts` passed 5/5 after updating the stale `/uploads` source-root assertion.
  - Wider gates passed: `npm run typecheck`, `npm run test:contracts` 219/219, `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' build` with `** BUILD SUCCEEDED **`, and a direct temporary Next build emitted `○ /collect` plus lightweight `○ /uploads`.
  - Installed-app gate passed after removing the stale generated `.next-build` directory that had blocked the install wrapper's rename cleanup path: `npm run app:user` rebuilt Release, installed `/Users/yinyiping/Applications/Loom.app`, and `npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 635 static web files.
  - Computer Use acceptance was retried at the user's request after install and remains blocked by the locked macOS session: `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` returned `cgWindowNotFound`, `list_apps` still saw `Loom - com.yinyiping.loom [running]`, `ioreg` reported `CGSessionScreenIsLocked=Yes`, System Events reported zero Loom windows, and the process still ran from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
- Update at 2026-05-09 06:48 AEST:
  - `/desk` is now a compatibility redirect to `/sources`, so the old combined Desk page no longer owns a user-facing product route.
  - App Store screenshot capture now uses `/sources` for the first source-library screenshot instead of `/desk`.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/desk/page.tsx` still exported `DeskPage`.
- Update at 2026-05-09 06:52 AEST:
  - `/workbench` is now a compatibility redirect to `/draft`, because Draft already owns Workbench prose import, word count, and debounced saves.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/workbench/page.tsx` still loaded `WorkbenchClient`.
- Update at 2026-05-09 06:54 AEST:
  - `/atelier` is now a compatibility redirect to `/draft`, because Draft already owns the first reference-excerpt and provenance behavior migrated from Atelier.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/atelier/page.tsx` still loaded `AtelierClient`.
	- Update after Help cleanup:
	  - `/help` now explains the product through Sources and Draft and links to `/sources` and `/draft`.
  - The Help page no longer revives user-facing legacy labels such as Desk, Workbench, Atelier, Patterns, Weaves, or the old metaphor-heavy shortcut copy.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/help` still omitted Collect and exposed old product language.
- Update after installed-app recheck:
  - `npm run test:contracts` passed 223/223 after the Help cleanup.
  - `npm run typecheck` passed.
  - A temporary production build to `.next-route-check` passed and showed `/atelier`, `/desk`, `/uploads`, and `/workbench` as lightweight redirect pages; the generated `.next-route-check` directory and temporary `tsconfig.json` include were removed after the check.
  - `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 632 static web files.
  - Computer Use acceptance was retried against `com.yinyiping.loom` after reinstall and remains blocked by the locked macOS session: `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` returned `cgWindowNotFound`, `list_apps` saw `Loom - com.yinyiping.loom [running]`, `ioreg` reported `CGSessionScreenIsLocked=Yes`, System Events reported zero Loom windows, and the process path was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
- Update at 2026-05-09 06:56 AEST:
  - `/pursuits` is now a compatibility redirect to `/sources`, because Source Index groups and source-state chips carry project context without reviving Pursuits as a first-level product.
  - `/pursuit` remains a hidden migration-source fallback for native/static-export detail deep links until those dependencies are removed.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/pursuits` still loaded `PursuitsClient` and the old top-level mind-object route copy.
- Update at 2026-05-09 06:58 AEST:
  - `/patterns`, `/weaves`, `/kesi`, and `/graph` now redirect to `/sources#reader-notes`.
  - Reader-side settled-note actions in `ReviewThoughtMap` and `RefreshCoach` now open Reader notes instead of routing users back to Patterns or Weaves.
  - `/panel` remains a hidden migration-source fallback for native/static-export detail deep links until those dependencies are removed.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/patterns` still loaded `PatternsClient` and the old habitat route copy.
- Update at 2026-05-09 07:02 AEST:
  - The legacy `ContentView` fallback sidebar now uses Collect / Organize / Draft instead of Home / Desk / Coworks / Patterns / Weaves.
  - Its source folder tree is mounted under Organize, and query mode now exposes the Organize section instead of the old Desk section.
  - Red evidence: `tests/native-sidebar-source-row-fallback.test.ts` first failed because `KnowledgeSidebarView` still declared the old workspace list.
- Update at 2026-05-09 07:06 AEST:
  - `npm run app:user` passed and reinstalled `/Users/yinyiping/Applications/Loom.app` from the current tree. The release build route table shows `/patterns`, `/weaves`, `/pursuits`, `/graph`, `/kesi`, `/today`, `/uploads`, `/desk`, `/workbench`, and `/atelier` as 183 B compatibility redirect pages.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 629 bundled static web files.
  - Computer Use validation is blocked at the visible-window layer: `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` both returned `Apple event error -10005: cgWindowNotFound`. `list_apps` still sees `Loom - com.yinyiping.loom [running]`.
  - Local system evidence matches the Computer Use blocker: `ioreg` reports `CGSessionScreenIsLocked=Yes`, the installed app process is `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, and System Events reports 0 Loom windows. Treat this as a blocked GUI acceptance, not a passed GUI acceptance.
	- Update at 2026-05-09 07:09 AEST; superseded 2026-05-15:
	  - App Store public copy now describes Sources, Add source, Draft, Reader notes, and Connections instead of Sōan, Patterns, Pursuits, or the old shortcut vocabulary.
	  - App Store screenshot capture now uses `/sources`, the Add source flow, `/draft`, `/sources#reader-notes`, and `/connections`; `/frontispiece`, `/soan`, and `/patterns` are no longer default screenshot targets.
	  - App Store preflight now expects `01-sources.jpg`, `02-add-source.jpg`, `03-draft.jpg`, `04-reader-notes.jpg`, and `05-connections.jpg`.
  - Red evidence: `tests/app-store-assets.test.ts` first failed because `docs/app-store-copy.md`, `scripts/app-store-screenshots.mjs`, and `scripts/app-store-preflight.mjs` still expected the old public screenshot and copy surface.
- Update at 2026-05-09 07:12 AEST:
  - Native menu, keyboard-help, and sheet labels for legacy thinking actions now use literal new-Loom labels: Add Question, Add Draft Card, Connect Draft Cards, and Connect Reader Notes.
  - The old storage-backed actions remain available as migration internals, but user-visible strings no longer say Hold a Question, Sōan Card, Connect Sōan Cards, or Weave Two Panels.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `LoomApp.swift`, `KeyboardHelpView.swift`, and `ContentView.swift` still exposed those old native labels.
- Update at 2026-05-09 07:15 AEST:
  - Native Settings > Data no longer exposes the old storage buckets as Pursuits, Panels, Sōan, or Weaves. The visible labels now read Questions, Reader notes, Draft cards, and Note connections.
  - Destructive Settings > Data row copy now says question, reader note, draft card, and note connection instead of the old storage-model names.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `DataSettingsView.swift` and `DataSettingsRows.swift` still exposed those old Settings > Data labels.
- Update at 2026-05-09 07:17 AEST:
  - Native Shuttle search results now label old stored objects as Questions, Reader notes, Draft cards, Note connections, and Sources.
  - Result row subtitles no longer expose Pursuit, Panel, Sōan, or Weave as visible categories in the command palette.
  - Red evidence: `tests/shuttle-canonical-ia.test.ts` first failed because `ShuttleView.swift` still rendered the old search-result section labels.
- Update at 2026-05-09 07:19 AEST:
  - `npm run app:user` passed and reinstalled the current Release build to `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 629 bundled static web files.
  - Computer Use still cannot perform visible-window acceptance in the current locked session: `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` both returned `Apple event error -10005: cgWindowNotFound`.
  - Computer Use `list_apps` sees `Loom — com.yinyiping.loom [running]`; shell evidence shows the process path is `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, `CGSessionScreenIsLocked=Yes`, and System Events reports 0 Loom windows.
- Update at 2026-05-09 07:20 AEST:
  - Native Ingest fragment placement now labels old destination objects as Questions and Reader notes in the picker.
  - Rendered fragment destination chips now say Attached to Question, Attached to Reader note, or New question instead of Pursuit or Panel.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `FragmentDestinationPicker.swift` and `FragmentSchemaView.swift` still exposed the old capture-time destination labels.
- Update at 2026-05-09 07:23 AEST:
  - Native IngestionView attach-error copy and fallback titles now use Reader note wording when an old panel destination is missing source document metadata.
  - The old Panel wording remains a storage-route implementation detail instead of surfacing in capture-time destination failures.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `IngestionView.swift` still rendered Panel in the attach error and fallback title.
- Update at 2026-05-09 07:46 AEST:
  - The current tree was rebuilt and installed to `/Users/yinyiping/Applications/Loom.app` for Computer Use acceptance after the IngestionView label migration.
  - The default `npm run app:user` path hit filesystem stalls while renaming stale generated `.next-build` and `.next-export-current` directories; `.next-build` was removed, and the Release build used a fresh temporary `LOOM_STATIC_EXPORT_DIR=.next-export-cua` static export to avoid the damaged old export directory.
  - `node scripts/install-loom-app.mjs user` installed the resulting Release app, and the temporary `.next-export-cua` directory was removed after install. The old ignored `.next-export-current` directory remains partially cleaned and should be treated as a generated-artifact cleanup issue, not source state.
  - Computer Use acceptance was retried after relaunching the installed app. `list_apps` saw `Loom - com.yinyiping.loom [running]`, but `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` both returned `Apple event error -10005: cgWindowNotFound`.
  - Local evidence matched the CUA blocker: the running process path was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, `ioreg` reported `CGSessionScreenIsLocked=Yes`, and System Events reported 0 Loom windows. This is still a blocked visible-window acceptance, not a passed GUI acceptance.
- Update at 2026-05-09 07:57 AEST:
  - Source-reader fallbacks now avoid old source desks: `/collection` uses Organize breadcrumbs, `/doc` uses Organize / Collect breadcrumbs, `/llm-wiki` returns through Organize, and upload-derived source metadata labels uploaded sources as Collect.
  - Compatibility upload surfaces now use Collect wording: `UploadButton` still defaults to "Add files"; the old `UploadsClient` fallback was later removed after `/uploads` became a redirect to Collect.
  - Hidden sample/detail fallbacks now exit to new Loom homes: branching / letter / panel-detail / weaves fallbacks route to Reader notes, palimpsest / atelier fallbacks route to Draft, and `/pursuit` returns to Organize while labeling old panel attachments as reader notes.
  - Red evidence was captured before each fix in `tests/new-loom-skeleton-contract.test.ts`, `tests/chapter-surface-honesty.test.ts`, and `tests/phase3-cta-alignment.test.ts`; the failures were stale Panel assertions, old `/pursuits` / `/patterns` exits, `Intake` upload labels, and `panelSourceMeta` returning Intake.
- Update at 2026-05-09 08:03 AEST:
  - The current tree was rebuilt and reinstalled to `/Users/yinyiping/Applications/Loom.app` with `LOOM_STATIC_EXPORT_DIR=.next-export-cua npm run app:user`; the fresh export avoided the old `.next-export-current` cleanup stall, staged 629 web files, and the temporary `.next-export-cua` directory was removed after smoke.
  - `npm run app:smoke` passed against the installed bundle with bundle id `com.yinyiping.loom` and 629 bundled static web files.
  - Computer Use acceptance was retried against the freshly relaunched app. `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` still returned `Apple event error -10005: cgWindowNotFound`.
  - The blocked CUA result is explained by local state, not by a missing install: process `43989` was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, `CGSessionScreenIsLocked=Yes`, and System Events reported 0 Loom windows.
- Update at 2026-05-09 08:28 AEST:
  - `/soan` is now a compatibility redirect to `/draft?view=board`.
  - Draft owns the old card-board surface under `aria-label="Draft card board"` and scrolls to it when `view=board` is present.
  - The board's visible labels now say Draft board instead of Sōan, while the native-backed Soan storage key remains an implementation detail for this migration step.
  - Native Shuttle card hits now route to `/draft?view=board&focusCardId=...`, preserving the focus hint without exposing `/soan`.
  - A direct-link scan across `app`, `components`, `lib`, `macos-app/Loom/Sources`, and `tests` found no remaining first-party direct `/soan` navigation links after the migration.
  - `LOOM_STATIC_EXPORT_DIR=.next-export-cua node scripts/build-static-export.mjs` passed and generated 629 static web files.
  - `LOOM_STATIC_EXPORT_DIR=.next-export-cua xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed after restarting the wedged `fileproviderd` process; the build staged 629 static web files into the Debug app bundle.
  - The rebuilt Debug app was installed to `/Users/yinyiping/Applications/Loom.app`, relaunched, and `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 629 bundled static web files.
  - Installed-bundle inspection confirmed `/draft.html` contains `Draft card board`, `Draft card index`, `Draft board · thinking draft`, `Draft board.`, and `Draft board shortcuts`; `/soan.txt` contains `NEXT_REDIRECT;replace;/draft?view=board;307;`.
  - Computer Use acceptance was retried against the freshly relaunched app. `list_apps` saw `Loom - com.yinyiping.loom [running]`, but `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` still returned `Apple event error -10005: cgWindowNotFound`.
  - Local evidence still shows a locked desktop, not a missing install: process `55669` was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, and `ioreg` reported `CGSessionScreenIsLocked=Yes`.
  - A fresh `npm run typecheck` attempt did not reach `tsc`: the wrapper and direct `tsc --noEmit` both blocked while scanning stale generated `.next-build/types/app/*` route-type directories. `fileproviderd` repeatedly restarted with its working directory inside `.next-build`, and bulk `mv` / `rm -rf` cleanup of `.next-build` blocked in kernel file operations. Treat this as a local generated-artifact / file-provider blockage, not a TypeScript error, until `.next-build` can be cleaned from an unlocked or restarted desktop session.
  - The temporary `.next-export-cua` directory and stale `.next-build.lock` from interrupted typecheck attempts were removed after installation and smoke verification.
- Update at 2026-05-09 08:32 AEST:
  - `/constellation` and `/branching` are now compatibility redirects to `/sources#reader-notes`, so old visual panel/relation chapters no longer render as direct product surfaces.
  - `/palimpsest` is now a compatibility redirect to `/draft`, keeping sentence-history work inside Draft.
  - `/salon` is now a compatibility redirect to `/sources` until real shared-reading sessions exist; the gated `SalonClient` fallback was later removed after the redirect became the only runtime path.
  - The migration plan now splits `/collection` from those retired routes: `/collection` remains only as the direct source-category fallback with Organize breadcrumbs, while the other old visual/social routes are explicit redirects.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed on `/constellation/page.tsx` still importing `ConstellationClient`, then passed after the redirect implementation.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/chapter-surface-honesty.test.ts tests/phase3-cta-alignment.test.ts tests/native-detail-endpoints.test.ts` passed 42/42.
  - `npm run test:contracts` passed 235/235.
  - `git diff --check` and `git diff --cached --check` passed.
- Update at 2026-05-09 08:35 AEST:
  - `/coworks` and `/letter` moved from internal/sample classification to legacy compatibility and now redirect to `/draft`.
  - The old Coworks index client was later removed after `/coworks` became a Draft redirect and no runtime path imported the client.
  - The migration plan now records cowork rehearsal output and correspondence-style writing as Draft-owned work instead of separate product chapters.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/coworks` was still classified as internal and rendered `CoworksIndexClient`.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/chapter-surface-honesty.test.ts tests/phase3-cta-alignment.test.ts tests/canonical-hotpaths.test.ts tests/native-detail-endpoints.test.ts tests/static-doc-entry.test.ts tests/native-sidebar-source-row-fallback.test.ts` passed 55/55.
  - `npm run test:contracts` passed 236/236.
- Update at 2026-05-09 08:37 AEST:
  - Weave learning targets now route relation work to `/sources#reader-notes` instead of constructing `/graph?focus=...` URLs.
  - The relation secondary action now says `Open reader notes` instead of `Open graph`.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `lib/learning-targets.ts` still generated `/graph?focus=...` and `Open graph`.
  - A stale `tests/desk-derive.test.ts` hidden-today fixture was refreshed from fixed `2026-04-18` to the current local day key after the adjacent learning-target test sweep exposed the stale assertion.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/canonical-hotpaths.test.ts tests/desk-derive.test.ts tests/work-session.test.ts tests/desk-actions.test.ts tests/desk-first-ia.test.ts tests/shared-store-sync.test.ts tests/desk-presenters.test.ts` passed 52/52.
  - `npm run test:contracts` passed 237/237.
- Update at 2026-05-09 08:38 AEST:
  - `/diagrams` moved from internal/sample classification to legacy compatibility and now redirects to `/draft`.
  - The `/diagrams` route page no longer carries the old `DiagramsClient`, `Diagrams · Loom`, or "Five ways to draw a thought" page-level product story.
  - The matching global CSS block was later deleted with the orphan client instead of kept as retired internal regression styling.
  - Red evidence: `tests/new-loom-skeleton-contract.test.ts` first failed because `/diagrams` was still classified as internal; it then failed again until the stale page comments were removed.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/globals-compatibility.test.ts` passed 37/37 after the CSS comment cleanup.
  - `npm run test:contracts` passed 238/238 after the final CSS cleanup.
- Update at 2026-05-09 15:29 AEST:
  - Removed orphan client implementations for already-redirected retired surfaces without deleting the compatibility route files: `app/uploads/UploadsClient.tsx`, `app/coworks/CoworksIndexClient.tsx`, `app/LetterClient.tsx`, `app/BranchingClient.tsx`, `app/PalimpsestClient.tsx`, `app/ConstellationClient.tsx`, `app/DiagramsClient.tsx`, and `app/SalonClient.tsx`.
  - Cleaned old M13/M16 design-story comments out of the redirect-only `letter`, `branching`, `palimpsest`, `constellation`, and `salon` route pages.
  - Removed the matching dead `.loom-uploads*`, `.loom-coworks*`, `.loom-letter*`, `.loom-branching*`, `.loom-palimpsest*`, `.loom-constellation*`, `.loom-diagrams*`, and `.loom-salon*` CSS expectations from the active app surface. Active Draft board, panel detail, and pursuit detail surfaces were left in place at that point; the orphaned Atelier client was removed in the later 16:15 pass and the Draft board moved under `app/draft` in the later 16:20 pass.
  - Red evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/phase3-cta-alignment.test.ts tests/mirror-contract-adoption.test.ts tests/chapter-surface-honesty.test.ts tests/canonical-hotpaths.test.ts tests/native-detail-endpoints.test.ts` first failed 9 tests because the orphan files still existed.
  - Green evidence: the same focused suite passed 66/66 after deleting the orphan clients and CSS.
  - Wider gates: `npm run test:contracts` passed 434/434 and `npm run typecheck` exited 0.
- `npm run test:contracts` passed 226/226 on 2026-05-09 07:06 AEST after the `/pursuits`, `/patterns`, `/weaves`, and legacy native sidebar fallback migration slices.
- `npx tsx --test tests/app-store-assets.test.ts` passed 10/10 on 2026-05-09 07:09 AEST after the App Store public-surface migration.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/app-store-assets.test.ts` passed 34/34 on 2026-05-09 07:09 AEST after updating the route contract for the then-current App Store screenshot set; current 2026-05-15 contracts expect `01-sources`, `02-add-source`, `03-draft`, `04-reader-notes`, and `05-connections`.
- `npm run test:contracts` passed 226/226 on 2026-05-09 07:09 AEST after the App Store public-surface migration.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 25/25 on 2026-05-09 07:12 AEST after the native visible-label migration.
- `npm run test:contracts` passed 227/227 on 2026-05-09 07:12 AEST after the native visible-label migration.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 07:12 AEST after the Swift label edits.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 26/26 on 2026-05-09 07:14 AEST after the native Settings > Data label migration.
- `npm run test:contracts` passed 228/228 on 2026-05-09 07:14 AEST after the native Settings > Data label migration.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 07:15 AEST after the Settings > Data Swift label edits.
- `npx tsx --test tests/shuttle-canonical-ia.test.ts` passed 2/2 on 2026-05-09 07:16 AEST after the Shuttle search-result label migration.
- `npm run test:contracts` passed 228/228 on 2026-05-09 07:16 AEST after the Shuttle search-result label migration.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 07:17 AEST after the Shuttle Swift label edits.
- `npm run app:user` passed on 2026-05-09 07:19 AEST and reinstalled `/Users/yinyiping/Applications/Loom.app`.
- `npm run app:smoke` passed on 2026-05-09 07:19 AEST for bundle id `com.yinyiping.loom` with 629 bundled static web files.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 27/27 on 2026-05-09 07:20 AEST after the native Ingest destination label migration.
- `npm run test:contracts` passed 229/229 on 2026-05-09 07:20 AEST after the native Ingest destination label migration.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 07:20 AEST after the Ingest Swift label edits.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 27/27 on 2026-05-09 07:22 AEST after the IngestionView fallback/error label migration.
- `npm run test:contracts` passed 229/229 on 2026-05-09 07:22 AEST after the IngestionView fallback/error label migration.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 07:22 AEST after the IngestionView Swift label edits.
- `LOOM_STATIC_EXPORT_DIR=.next-export-cua node scripts/build-static-export.mjs` passed on 2026-05-09 07:44 AEST after stale generated export cleanup blocked the default install path.
- `LOOM_STATIC_EXPORT_DIR=.next-export-cua xcodebuild -project Loom.xcodeproj -scheme Loom -configuration Release -destination 'platform=macOS' build` passed on 2026-05-09 07:45 AEST and staged 629 static web files into the app bundle.
- `node scripts/install-loom-app.mjs user` passed on 2026-05-09 07:46 AEST and installed `/Users/yinyiping/Applications/Loom.app`.
- `npm run app:smoke` passed on 2026-05-09 07:46 AEST for bundle id `com.yinyiping.loom` with 629 bundled static web files.
- `git diff --check` passed on 2026-05-09 07:47 AEST, and `.next-route-check` / `.next-build.lock` were absent.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/chapter-surface-honesty.test.ts` passed 36/36 on 2026-05-09 07:55 AEST after the internal fallback route cleanup.
- `npx tsx --test tests/phase3-cta-alignment.test.ts` passed 2/2 on 2026-05-09 07:57 AEST after upload-derived panel source metadata moved from Intake to Collect.
- `npx tsx --test tests/atelier-honesty.test.ts tests/chapter-surface-honesty.test.ts tests/atlas-hub-phase2.test.ts tests/static-doc-entry.test.ts tests/phase3-cta-alignment.test.ts` passed 19/19 on 2026-05-09 07:59 AEST.
- `npm run test:contracts` passed 233/233 on 2026-05-09 08:00 AEST after the source-reader fallback, detail fallback, and upload-source-label cleanup.
- `npm run typecheck` passed on 2026-05-09 08:01 AEST; it first regenerated `.next-build` because build artifacts were missing.
- `LOOM_STATIC_EXPORT_DIR=.next-export-cua npm run app:user` passed on 2026-05-09 08:02 AEST and reinstalled `/Users/yinyiping/Applications/Loom.app`.
- `npm run app:smoke` passed on 2026-05-09 08:03 AEST for bundle id `com.yinyiping.loom` with 629 bundled static web files.
- `git diff --check` passed on 2026-05-09 08:03 AEST.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/shuttle-canonical-ia.test.ts` passed 34/34 on 2026-05-09 08:09 AEST after moving `/soan` into Draft board compatibility.
- `npx tsx --test tests/canonical-hotpaths.test.ts tests/native-detail-endpoints.test.ts tests/chapter-surface-honesty.test.ts tests/new-loom-skeleton-contract.test.ts` passed 40/40 on 2026-05-09 08:10 AEST after fixing stale native-detail assertions.
- `npm run test:contracts` passed 234/234 on 2026-05-09 08:11 AEST.
- `LOOM_STATIC_EXPORT_DIR=.next-export-cua node scripts/build-static-export.mjs` passed on 2026-05-09 08:20 AEST and generated 629 static web files.
- `LOOM_STATIC_EXPORT_DIR=.next-export-cua xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build` passed on 2026-05-09 08:22 AEST and staged 629 web files into the app bundle.
- `npm run app:smoke` passed on 2026-05-09 08:23 AEST for the manually installed Debug app at `/Users/yinyiping/Applications/Loom.app`, bundle id `com.yinyiping.loom`, with 629 bundled static web files.
- `npm run typecheck` is currently blocked by stale generated `.next-build/types` directories plus `fileproviderd` reacquiring `.next-build`; the latest attempts were interrupted after sampling showed kernel directory-scan/file-operation stalls and no TypeScript diagnostic output.
- `npm run test:contracts` passed 200/200 on 2026-05-09 02:52 AEST after adding first-run/native-shortcut legacy-isolation coverage and Draft provenance coverage.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/new-loom-draft-storage.test.ts` passed 19/19 on 2026-05-09 02:51 AEST.
- `npm run typecheck` passed on 2026-05-09 02:52 AEST.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test` passed on 2026-05-09 02:44 AEST. `LoomDraftStoreTests` executed 4 tests with 0 failures.
- `npm run verify:flipdisc-live-handoff` passed on 2026-05-09 02:44 AEST using the staged Atlas extension. The current extension/build extracts the flipdisc frame as one `segment-diagram` artifact and the temporary handoff fixture verifier returned `ok: true`.
- `npm run verify:capture-handoff` failed on 2026-05-09 02:44 AEST against the installed app container. It inspected `/Users/yinyiping/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/6722ada4-504e-400f-97ab-dfa8c20518d7/sub/Web/flipdisc.io/Loom.md` and its 2026-05-06 CaptureAST sidecar, which has no segment diagram. This historical failure is superseded by the fresh 2026-05-09 03:45 AEST direct handoff, which saved a new `flipdisc.io` capture and passed `npm run verify:capture-handoff`.
- Earlier `npm run verify:product` passed on 2026-05-09 01:21 AEST after the full route-classification contract was added.
- `npm run build && npm run smoke && npm run clean:generated` passed after the latest Source Index and Draft changes.
- `npm run test:capture-interactive:export` passed 5/5 after the latest changes.
- `npm run test:captures-landing` passed 12/12 after the latest changes.
- `npm run app:check-project -- --require-tracked`, `npm run app:stage-extension`, `npm run app:user`, and `npm run app:smoke` passed after the latest changes. On 2026-05-09 02:55 AEST, `npm run app:stage-extension && npm run app:user` restaged Atlas extension version 1.4.9 and reinstalled `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed on 2026-05-09 02:56 AEST.
- `git diff --check` and `git diff --cached --check` passed on 2026-05-09 02:51 AEST.
- `npm run app:check-project -- --require-tracked` passed on 2026-05-09 02:52 AEST with 107 source Swift files, 36 test Swift files, macOS 15.0, and the expected bundle IDs.
- Current index hygiene is not a commit-ready state: the repo still contains
  broad staged work from this thread and several `MM` entries from later
  capture-handoff fixes and documentation updates. Do not assume everything is
  staged or ready to push without a fresh `git status --short` review.
- `/sources` "Continue writing" entries now route to `/draft?ref=...`, not the legacy `/workbench`; the empty-state writing action also defaults to `/draft`, not the internal `/coworks`.
- `/draft` merges incoming `ref` query values into an existing draft instead of dropping the source context when a draft already exists.
- `coworkToDraftSeed(cowork)` preserves usable Cowork output for Draft migration: tidy markdown wins over scratch text, scratch text remains fallback, and Cowork materials become Draft references.
- `/draft` absorbs the legacy Workbench basics: it one-time imports `loom.workbench.current` when the active Draft body is empty, displays a word count, and debounces saves through the Draft store.
- Web Source Index now has a Recent captures work panel fed by `loom://native/captures-list.json`, so captured web material is visible from Organize without promoting the `/loom-render/captures` runtime route.
- Web Source Index collection rows now show per-source capture state by matching native capture `rootID` values against source-category slugs. They also fold native capture-reader metadata from `capture-metadata-all.json` into highlight and note counts. Native Source Index rows show per-root capture counts plus highlight and note counts by scanning each capture's `Loom-metadata.json`.
- Web and native Source Index use the explicit "Organize Work Surface" label instead of the older "Archive Work Surface" copy.
- First-run onboarding now sets `ONBOARDING_DONE_ROUTE = '/sources'` and displays "All set — opening Organize…".
- Native product shortcuts now expose Collect / Organize / Draft and no longer expose Desk / Coworks / Patterns / Weaves as command-menu buttons. `LoomMinimalRootView` maps `/collect`, `/sources`, and `/draft` route tokens to native surfaces.

## 2026-05-09 08:50 AEST Update

- `/coworks`, `/letter`, and `/diagrams` now behave as Draft compatibility
  redirects instead of owning separate product surfaces. `lib/new-loom/product-shell.ts`
  classifies them as legacy compatibility routes, and the new-Loom skeleton
  contract covers the redirects.
- Relation-work learning targets now enter Organize reader notes via
  `/sources#reader-notes`, not the retired `/graph?focus=...` flow.
- `scripts/typecheck.mjs` no longer scans or removes stale `.next`, `.next-build`,
  or `.next-app-dev` type directories during the supported typecheck command.
  It builds and reuses route types in `.next-typecheck-build`, writes a temporary
  `.loom-typecheck.tsconfig.json` that excludes the stale generated build dirs,
  and removes the temporary tsconfig after `tsc` exits.
- `tsconfig.json` now includes `.next-typecheck-build/types/**/*.ts` intentionally
  so Next does not keep rewriting the base config when route types are generated
  for typecheck.
- `.next-typecheck-build/` and `.loom-typecheck.tsconfig.json` are ignored as
  generated tooling artifacts.
- Verification after this update:
  - `npx tsx --test tests/typecheck-script.test.ts` passed 3/3.
  - `npm run typecheck` passed.
  - `npm run test:contracts` passed 238/238.
  - `git diff --check` and `git diff --cached --check` passed.
- Computer Use acceptance is blocked at the OS window layer. `list_apps` sees
  `Loom — com.yinyiping.loom` as running, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both return `Apple event error -10005:
  cgWindowNotFound`; `get_app_state("Finder")` also timed out. System session
  state shows `CGSessionScreenIsLocked=Yes`, so this is a lock-screen/window
  service blocker rather than a confirmed Loom UI result. Re-run Computer Use
  acceptance after the desktop is unlocked.

## 2026-05-09 08:57 AEST Update

- Native Draft now includes the Draft board in `LoomDraftView` instead of
  leaving draft-card structure only on the web `/draft` / retired `/soan`
  migration surface. It reads `LoomSoanWriter.allCards()` and
  `LoomSoanWriter.allEdges()`, shows card/relation counts and recent draft
  cards, listens for `.loomSoanChanged`, and exposes Add draft card / Connect
  draft cards actions through the existing native dialogs.
- Red/green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts`
  first failed because native `LoomDraftView` did not expose Draft board
  state or actions, then passed 36/36 after the SwiftUI surface was added.
- Swift verification: the first Xcode test attempt was interrupted because
  the build phase blocked on `find .next-export-current`; rerunning with
  `LOOM_SKIP_WEB_STAGE=1` avoided the stale generated export scan and
  `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom
  -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test`
  passed 6/6.
- Wider gates after the native Draft board slice: `npm run test:contracts`
  passed 238/238, `npm run typecheck` passed, and `git diff --check` plus
  `git diff --cached --check` passed.
- Installed app was not rebuilt after this source change in this slice, and
  Computer Use visible acceptance remains blocked until the Mac is unlocked.

## 2026-05-09 09:19 AEST Update

- Static export packaging was unblocked without touching the broken generated
  `.next` / `.next-build` trees. `scripts/build-static-export.mjs` now stages
  a clean `/tmp` shadow workspace with rsync excludes for `.next*`,
  `.next-export*`, local worktrees, Playwright/App Store artifacts, Finder
  duplicates, and `*.tsbuildinfo`; Next then builds from that clean workspace
  using `.loom-static-export.tsconfig.json`.
- `next.config.mjs` now honors `LOOM_NEXT_TSCONFIG_PATH`, letting static export
  and typecheck use dedicated tsconfig files instead of forcing the base
  `tsconfig.json` to scan stale generated dirs.
- Red/green evidence: `npx tsx --test tests/typecheck-script.test.ts` first
  failed on the missing static-export workspace contract, then passed 3/3 after
  the script/config updates.
- Real export evidence: `LOOM_STATIC_EXPORT_DIR=.next-export-ship node
  scripts/build-static-export.mjs` passed. Next used
  `.loom-static-export.tsconfig.json`, compiled successfully in 8.8s, generated
  99 static pages, exported 2 asset groups, and produced `.next-export-ship`.
- A direct Xcode Release build with web staging is still blocked before target
  compilation: `xcodebuild` hangs in Xcode's project/device coordinated-read
  path even with `generic/platform=macOS`. Cleaning stale `Loom 2.xcodeproj`
  and `Loom 3.xcodeproj` did not unblock that Xcode initialization path, and
  rerunning from `macos-app/Loom` with `xcodebuild -project Loom.xcodeproj`
  hung the same way before target build output.
- Root-cause isolation: `xcodebuild -list -project
  macos-app/Loom/Loom.xcodeproj -json` hangs in the original repo path, but the
  same project copied to `/tmp/loom-xcode-probe.VNPptk/macos-app/Loom` lists
  configurations, schemes, and targets immediately. This points to local
  working-tree/file-service state around the original checkout rather than a
  malformed Xcode project.
- Full Xcode staging evidence: copying `.next-export-ship/` into the clean
  `/tmp/loom-xcode-probe.VNPptk` repo shape and running
  `LOOM_STATIC_EXPORT_DIR=.next-export-ship xcodebuild -project
  /tmp/loom-xcode-probe.VNPptk/macos-app/Loom/Loom.xcodeproj -scheme Loom
  -configuration Release -destination 'platform=macOS' -derivedDataPath
  /tmp/loom-xcode-probe.VNPptk/DerivedData build` passed with `** BUILD
  SUCCEEDED **`. The Xcode build executed the "Stage Next.js static export into
  bundle Resources" phase.
- The Xcode-built temporary app also passes installed-app smoke:
  `LOOM_APP_PATH=/tmp/loom-xcode-probe.VNPptk/DerivedData/Build/Products/Release/Loom.app
  npm run app:smoke` reports bundle id `com.yinyiping.loom` and `static web
  files: 630`.
- To continue installed-app verification, the already-built Release
  `Loom.app` was staged manually with `.next-export-ship/` into
  `Contents/Resources/web`, re-signed with `macos-app/Loom/Loom.entitlements`,
  and installed to `/Users/yinyiping/Applications/Loom.app` through
  `installLoomApp({ mode: "user" })` with post-install generated cleanup
  disabled.
- Installed app smoke now passes: `npm run app:smoke` reports
  `installed app smoke ok: /Users/yinyiping/Applications/Loom.app`,
  bundle id `com.yinyiping.loom`, and `static web files: 630`.
- Computer Use acceptance was rerun after the desktop became inspectable. At
  2026-05-09 09:30 AEST, `get_app_state("Loom")` read the installed
  `com.yinyiping.loom` window. CUA verified Collect, Organize, Draft, Draft
  reference -> Flipdisc capture reader, Captures list -> capture detail, source
  snapshot, and the `ECON 3202` / `INFS 3822` folder surfaces. The current
  installed UI is no longer blocked at the visible-window layer.
- One visual caveat from the same CUA pass: opening the Flipdisc capture through
  the Draft reference produced a transient blank WebView screenshot while the AX
  tree already contained the capture detail. Navigating back to Captures and
  reopening the same capture rendered the detail normally. Treat this as a
  recoverable route/paint issue to keep watching, not as a completed polish
  gate.
- Default install packaging is now durable instead of manual. At 2026-05-09
  09:35 AEST, `npm run app:user` succeeded with no
  `LOOM_STATIC_EXPORT_DIR` override: it built `.next-export-install-${pid}` in
  a clean static-export workspace, copied `macos-app/Loom` and that export into
  a temporary `/tmp/loom-xcode-build-*` project root, ran Release `xcodebuild`
  with `-derivedDataPath` inside that temp root, installed the resulting app to
  `/Users/yinyiping/Applications/Loom.app`, and cleaned both the repo export and
  temp Xcode workspace afterward.
- `npm run app:smoke` passed immediately after that default install with bundle
  id `com.yinyiping.loom` and `static web files: 630`.
- The freshly installed app was relaunched from
  `/Users/yinyiping/Applications/Loom.app` and Computer Use read the new
  `com.yinyiping.loom` process (`pid 97871`). After one transient
  ScreenCaptureKit stream error, CUA verified the window tree again and the
  visible Collect surface rendered `Web Capture`, `Add files`, the exact
  extension Resources path, bookmarklet fallback, and capture pipeline status.
- Artifact-state quote schema is now covered in Draft. Web Draft references
  support `kind=artifact-state` with target id, artifact kind, label, state,
  and state label; quote insertion writes an `Artifact state:` line and
  provenance carries the same metadata. Native `LoomDraftStore` persists the
  same schema and `LoomDraftView` displays state-scoped references and
  provenance. Focused evidence: `npx tsx --test
  tests/new-loom-draft-storage.test.ts` passed 13/13, and
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild -quiet -project
  macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug
  -destination 'platform=macOS,arch=arm64'
  -only-testing:LoomTests/LoomDraftStoreTests test` exited 0 on 2026-05-09.
- Post-change installation and Computer Use acceptance passed on 2026-05-09:
  `npm run typecheck`, `npm run test:contracts` 241/241, `git diff --check`,
  `git diff --cached --check`, `npm run app:user`, and `npm run app:smoke`
  all passed. CUA read the installed `/Users/yinyiping/Applications/Loom.app`
  process and verified the native Draft artifact-state fixture rendered
  `Artifact state` in References, the body quote, and Provenance. The temporary
  Draft fixture was then removed and CUA re-read the Collect surface with Web
  Capture, Add files, extension path, bookmarklet fallback, and pipeline status.
- Update at 2026-05-09 10:20 AEST:
  - Source Index recent captures now expose a visible `DELETE` action in the
    installed native app and a no-browser-prompt confirmed delete action on the
    web Source Index. The native action opens a destructive confirmation sheet
    before removing the entry from `CapturesIndex`; the web action uses inline
    `Delete now` / `Cancel` state and posts to `loomCaptureDelete`.
  - Computer Use verified the installed `/Users/yinyiping/Applications/Loom.app`
    after relaunch: Source Index showed `DELETE` next to recent captures, clicking
    it opened `Delete this capture?`, and clicking Cancel left the capture list
    intact. No capture was deleted during acceptance.
  - Native Collect `Add files` now opens an `NSOpenPanel` titled `Add files to
    Loom`, allows multiple selection, and stages selected URLs into the ingestion
    context instead of only opening the static Ingestion surface. Computer Use
    verified the installed app opened that panel and then canceled it without
    importing files.
  - Native ingestion now persists local-file origin metadata for PDFs, slide
    decks, text/markdown/docs, and images; Source Index surfaces local imported
    files as first-class Organize work with Draft handoff and native source-file
    reopening.
  - Verification for this slice passed: `npx tsx --test
    tests/knowledge-home-source-library.test.tsx` 18/18, `npx tsx --test
    tests/new-loom-skeleton-contract.test.ts` 38/38, `npm run typecheck`,
    Debug `xcodebuild`, `npm run app:user`, `npm run app:smoke`,
    `npm run app:where`, `git diff --check`, and the refreshed
    `npm run test:contracts` gate passed 245/245.
- Update at 2026-05-09 10:31 AEST:
  - Static web `/draft` now uses the installed-app `loomDrafts` reply bridge
    for `list`, `create`, and `update`, backed by native `LoomDraftStore`.
    Browser/dev mode keeps the existing localStorage Draft adapter.
  - Native `DraftBridgeHandler` is registered in `ContentView` and compiled
    into the Release install path. The installed bundle's `/draft` web chunk
    contains `window.webkit.messageHandlers.loomDrafts`, `postMessage({action:
    "list"})`, `create`, and `update`.
  - Computer Use acceptance used a freshly relaunched process from
    `/Users/yinyiping/Applications/Loom.app` (`pid 35675`, started after
    install). Source Index showed visible `DELETE` buttons beside recent
    captures. Draft loaded the saved body, references, and Draft board from the
    native sandbox store at `Containers/com.yinyiping.loom/.../Drafts/drafts.json`.
  - Verification for this slice passed: `npm run app:user`, `npm run
    app:where`, `npm run app:smoke`, `npx tsx --test
    tests/new-loom-skeleton-contract.test.ts` 39/39, `npm run typecheck`, `git
    diff --check`, and `npm run test:contracts` 246/246.
- Update at 2026-05-09 10:37 AEST:
  - Route classification now treats `/knowledge` as a `/sources` compatibility
    alias instead of a second primary Organize entry. The only primary product
    routes are `/`, `/collect`, `/sources`, and `/draft`.
  - A new route-classification contract checks that every migration-plan row
    marked `Compatibility` or `Migration source` is actually classified under
    `NEW_LOOM_LEGACY_ROUTES`, so future route-map drift cannot silently re-enter
    the default product path.
  - The same contract caught `/browse`: the migration plan had it as an
    Organize compatibility alias, while `product-shell` still classified it as
    internal. `/browse` now lives in legacy compatibility with `/atlas` and
    `/atlas/shelf`.
  - Verification for this slice passed: `npx tsx --test
    tests/new-loom-skeleton-contract.test.ts` 41/41, `npm run typecheck`, `git
    diff --check`, `git diff --cached --check`, and the refreshed `npm run
    test:contracts` gate passed 248/248.
- Update at 2026-05-09 10:43 AEST:
  - Source Index now treats active native-backed Draft references as source
    state, not only old writing/cowork surfaces. Web native mode reads
    `nativeDraftStorage().list()` and folds `loom://source/collection/...` and
    `loom://content/...` references into Source Index `Has draft` state.
  - Native `LoomLibraryView` loads `LoomDraftStore().list()` and passes the
    derived Draft source keys into `SourceRootSummary`. Rows referenced by the
    active Draft now surface `Has draft` / `attached to draft` and are not
    counted as unorganized just because they lack a legacy writing surface.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
    failed on the missing native Draft reference contract, then passed 19/19
    after implementation.
  - Verification for this slice passed: `npm run typecheck`, `npm run
    test:contracts` 249/249, `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project
    macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug
    -destination 'platform=macOS' build` with `** BUILD SUCCEEDED **`, `git
    diff --check`, and `git diff --cached --check`.
- Installed-app verification at 2026-05-09 10:46 AEST:
  - `npm run app:user` rebuilt and installed the current Release app to
    `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files, and `npm run app:where` reported the same installed path.
  - The stale pre-install Loom process was exited and the installed app was
    relaunched from `/Users/yinyiping/Applications/Loom.app` as pid 44225.
  - Computer Use verified the live installed Source Index: recent captures show
    visible `DELETE` buttons; clicking `DELETE` opens `Delete this capture?`;
    pressing Escape closes the sheet without deleting anything; the Source list
    shows `ECON 3202 ... Has draft`, proving the native Draft-reference state
    is visible in the installed product surface.
- Update at 2026-05-09 10:58 AEST:
  - The first Draft AI implementation was web-only: the installed native Draft
    surface still rendered only the editor, references, and Draft board. CUA
    exposed that gap before acceptance.
  - Native `LoomDraftView` now has the same source-grounded AI composition
    step as web Draft: `LoomDraftAIPrompt.buildDraftAIPrompt(...)`,
    `LoomAI.sendStream`, an `AI draft` preview, and explicit `Insert AI text`
    / `Discard` controls so generated text is never inserted automatically.
  - Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
    on missing native Draft AI coverage, then passed 42/42 after the SwiftUI
    implementation. The full `npm run test:contracts` gate passed 250/250,
    `npm run typecheck` passed, and
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
    -scheme Loom -configuration Debug -destination 'platform=macOS,arch=arm64'
    build` passed with `** BUILD SUCCEEDED **`.
  - Release install verification passed: `npm run app:user` rebuilt and
    installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`
    passed for bundle id `com.yinyiping.loom` with 630 static web files; and
    `npm run app:where` reported the same installed path at
    `2026-05-09T00:58:06.751Z`.
  - The stale pre-install process was exited and the installed app relaunched
    from `/Users/yinyiping/Applications/Loom.app` as pid 51238. Computer Use
    verified the live installed Draft page exposes `AI draft`, `Continue with
    AI`, and `No AI text yet.` beside the saved draft body and references. The
    `Continue with AI` button was not clicked during acceptance to avoid
    starting a real provider call.
- Update at 2026-05-09 11:04 AEST:
  - Added a legacy route deletion review registry in
    `lib/new-loom/legacy-route-deletion.ts` so deletion readiness is no longer
    prose-only. The registry covers every `NEW_LOOM_LEGACY_ROUTES` entry,
    records replacement evidence for Collect / Organize / Draft, and derives
    `readyForDeletion` from the checklist plus blockers.
  - The current ready list intentionally remains empty because compatibility
    routes are still required by tests/docs and no release cycle has shipped
    with them hidden.
- Update at 2026-05-09 11:09 AEST:
  - Tightened the Batch 4 runtime boundary: the capture reader and snapshot
    runtime pages now return to `/sources` / Source Index instead of promoting
    the runtime `/loom-render/captures` landing as a user-facing category.
  - Red/green evidence: the skeleton contract first failed on
    `loom://bundle/loom-render/captures/` and visible `Captures` back labels,
    then passed 44/44 after the reader and snapshot back links moved to
    Organize.
  - Verification passed: `npm run typecheck`, `npm run test:contracts` 252/252,
    `npm run test:capture-interactive:export` 5/5, and
    `npm run verify:flipdisc-live-handoff` returned `ok: true`.
    The live verifier still warns that its temporary saved markdown can contain
    unresolved `loom://media/...` placeholders and the flat frame text; that is
    acceptable only because the handoff sidecar verifies the segment diagram.
- Update at 2026-05-09 11:23 AEST:
  - Computer Use caught a second runtime-boundary bug after the 11:09 pass: the
    installed native reader displayed the new `Source Index` label, but clicking
    it still returned to a hidden native `Captures` list.
  - `CapturesView` now receives an `onBackToOrganize` callback from
    `LoomMinimalRootView`; the callback selects Organize, clears the pending
    capture reader URL, and removes the transient runtime history entry.
  - Red/green evidence: the skeleton contract first failed on the missing
    native return-to-Organize action, then passed 44/44 after the Swift changes.
    The focused runtime contracts passed 55/55, `npm run typecheck` passed,
    `npm run test:contracts` passed 252/252, and Debug `xcodebuild` passed with
    `** BUILD SUCCEEDED **`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported the installed path at `2026-05-09T01:21:01.732Z`.
  - Computer Use verified the installed app as pid 66334: Source Index shows
    visible `DELETE` buttons beside both recent captures; opening a capture
    shows the native `Source Index` button and page `‹ Source Index` link; the
    page link targets `loom://bundle/sources`; and the native button returns to
    the real Organize Source Index with `ORGANIZE WORK SURFACE Source Index`
    and visible `DELETE` actions, not to the hidden runtime `Captures` list.
  - No destructive delete was executed in this pass.
- Update at 2026-05-09 11:26 AEST:
  - Deepened the local-file part of the Organize loop: web Source Index no
    longer turns imported local-file work items into `#` links when a trace has
    origin metadata but no `trace.source.href`.
  - `KnowledgeHomeClient.localFileHrefFromTrace()` now prefers the trace source
    href and falls back to `file://` built from `origin.originalPath`; if neither
    exists, it skips the row instead of producing a dead link or Draft
    reference.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
    failed on the missing `localFileHrefFromTrace()` fallback contract, then
    passed 19/19 after implementation.
- Update at 2026-05-09 11:28 AEST:
  - Deepened the installed native Reader notes loop: native Source Index Reader
    notes rows now expose a `Draft` action, matching the web Source Index
    behavior that turns saved understanding into Draft references.
  - `LoomLibraryView.attachReaderStateToDraft()` now writes a
    `LoomDraftReference` labelled `<source> Reader notes`, points it at
    `loom://content/<source-id>#reader-notes`, carries `kind=source`, and uses
    `summary.readerStateDetail` as the Draft excerpt before navigating to
    `/draft`.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
    failed on missing native Reader notes Draft handoff, then passed 19/19
    after the Swift implementation.
  - Verification passed after the web local-file and native Reader notes
    changes: `npm run typecheck`, `npm run test:contracts` 252/252,
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
    -scheme Loom -configuration Debug -destination 'platform=macOS,arch=arm64'
    build` with `** BUILD SUCCEEDED **`, and diff hygiene.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `/Users/yinyiping/Applications/Loom.app` at
    `2026-05-09T01:30:55.582Z`.
- Update at 2026-05-09 11:36 AEST:
  - Web Draft reference links now use the installed-app navigation bridge
    instead of remaining raw anchors when the page runs inside the macOS app.
  - `DraftClient.openDraftReference()` posts `openReference` with href, label,
    and kind; `NavigationBridgeHandler.handleOpenReference()` mirrors native
    Draft behavior for capture artifacts, `loom://content` source folders/files,
    other `loom://` refs, and external or local file URLs.
  - Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
    on the missing web Draft reference bridge, then passed 45/45 after the
    web and Swift implementation.
  - Wider verification passed: `npm run typecheck` exited 0 and
    `npm run test:contracts` passed 253/253.
- Update at 2026-05-09 11:58 AEST:
  - Computer Use acceptance was rerun on the freshly installed app because the
    user reported the Source Index had no delete key.
  - Root cause for the separate fresh-launch `Needs access` display was that
    `ContentRootStore.activateAtLaunch()` restored active folder URLs after the
    SwiftUI Source Index could already render, but did not post
    `.loomContentRootsChanged` after `_activeURLs` changed.
  - `ContentRootStore` now resolves older plain bookmarks as a compatibility
    fallback, writes the restored active URL map, and posts
    `.loomContentRootsChanged` after the restored state changes so Organize
    reloads without requiring a Draft -> Organize navigation round trip.
  - Red/green evidence: the new
    `testActivateAtLaunchNotifiesAfterRestoringBookmarks` first failed on the
    missing notification, then passed 1/1 after the fix. Full
    `SecurityScopedFolderStoreTests` passed 10/10.
  - Wider verification passed: `npm run test:contracts` 253/253,
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` with `** BUILD SUCCEEDED **`,
    and `git diff --check && git diff --cached --check`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported the installed path at `2026-05-09T01:58:13.451Z`.
  - Computer Use verified the freshly relaunched installed app as pid 84817:
    Source Index shows visible `DELETE` buttons beside both recent captures;
    `INFS 3822` and `ECON 3202` rows show `Connected` and `Indexed` on the
    initial Organize surface; no `Needs access` stale state appeared. No
    destructive delete was executed.
- Update at 2026-05-09 12:04 AEST:
  - Local image import now uses macOS Vision OCR instead of the previous
    "OCR is not available yet" placeholder while preserving original-path and
    visual-provenance fallback text when no words are recognized.
  - `LocalImageImportText` centralizes the imported-image text summary so
    OCR-present and OCR-empty cases are both testable without selecting a user
    file.
  - Red/green evidence: the focused `TypedExtractorMatchTests` image-import
    tests first failed because `LocalImageImportText` did not exist, then
    passed 2/2 after implementation. Full `TypedExtractorMatchTests` passed
    5/5.
  - Wider verification passed: focused
    `tests/new-loom-skeleton-contract.test.ts` passed 46/46,
    `npm run test:contracts` passed 254/254, and
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` succeeded.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported the installed path at `2026-05-09T02:06:41.927Z`.
  - Computer Use verified the freshly relaunched installed app as pid 89341:
    Organize still shows visible `DELETE` buttons beside recent captures and
    `Connected` / `Indexed` source rows, and Collect shows the `Add files`
    local-file entry point. No destructive delete or user-file import was
    executed.
- Update at 2026-05-09 12:15 AEST:
  - Native PDF extraction now falls back to macOS Vision OCR when PDFKit
    returns empty page text, so scanned PDFs can still produce cleaned text and
    best-effort page ranges.
  - `PDFExtraction.extract(pageTexts:ocrPageTexts:maxChars:)` makes the
    fallback testable without selecting a user file; the production path
    renders each page thumbnail and runs `VNRecognizeTextRequest` only after
    the normal PDFKit text path throws `PDFExtractionError.empty`.
  - Red/green evidence: the focused
    `testPDFExtractionFallsBackToOCRPageTextWhenPDFKitTextIsEmpty` first
    failed on the missing overload, then passed 1/1 after implementation.
    Full `CleanTextParityTests` passed 9 executed tests with 1 expected
    environment skip and 0 failures.
  - Wider contract evidence: the focused scanned-PDF OCR contract passed 1/1,
    full `tests/new-loom-skeleton-contract.test.ts` passed 47/47,
    full `npm run test:contracts` passed 255/255, and
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` succeeded.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported the installed path at `2026-05-09T02:18:09.259Z`.
  - Computer Use verified the freshly relaunched installed app as pid 96320:
    Source Index opens, Collect / Organize / Draft are present, recent
    captures still expose visible `DELETE` buttons, and source rows remain
    `Connected` / `Indexed`. No destructive delete or user-file import was
    executed.
- Update at 2026-05-09 12:22 AEST:
  - PPTX extraction now preserves PowerPoint shape/image alt text by collecting
    `cNvPr` `title` and `descr` attributes alongside `<a:t>` text runs and
    speaker notes.
  - A deterministic `alt-text.pptx` fixture now covers an image title, image
    description, and shape description; the fixture generator writes it with
    the other slide-deck fixtures.
  - Red/green evidence: the focused
    `testParsePPTXIncludesShapeAndImageAltText` first failed with only the
    visible slide body returned, then passed 1/1 after the parser collected
    `cNvPr` attributes. Full `SlideDeckExtractorTests` passed 10/10.
  - Wider contract evidence: focused PPTX alt-text new-Loom contract passed
    1/1, full `tests/new-loom-skeleton-contract.test.ts` passed 48/48,
    full `npm run test:contracts` passed 256/256, and
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` succeeded.
  - Release install verification passed: `git diff --check` and
    `git diff --cached --check` passed, `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files, and `npm run
    app:where` reported the installed path at `2026-05-09T02:25:31.278Z`.
  - Computer Use verified the freshly relaunched installed app as pid 2455
    from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`: Source
    Index opens, Collect / Organize / Draft are present, recent captures expose
    visible `DELETE` buttons, and source rows remain `Connected` / `Indexed`.
    No destructive delete or user-file import was executed.
- Update at 2026-05-09 12:36 AEST:
  - Keynote and Pages imports now use the shared slide-deck archive reader
    when no PowerPoint slide/notes XML is present.
  - The iWork fallback preserves document metadata from `Metadata/*.plist`
    including title, author, subject, comments, and keywords, and extracts
    `QuickLook/Preview.pdf` text through `PDFExtraction` when present.
  - Native Collect allows `.pages`, and imported `.key` / `.pages` files keep
    distinct `local-key` / `local-pages` origin kinds instead of being flattened
    into the generic PowerPoint bucket.
  - Red/green evidence: focused iWork tests first failed because
    `metadata.key` and `metadata.pages` returned nil, then passed 2/2 after the
    parser fallback. Full `SlideDeckExtractorTests` passed 12/12.
  - Wider contract/build evidence: focused iWork new-Loom contract passed 1/1,
    full `tests/new-loom-skeleton-contract.test.ts` passed 49/49,
    full `npm run test:contracts` passed 257/257, and
    `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` succeeded.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported the installed app at `2026-05-09T02:34:35.496Z`.
  - Computer Use verified the freshly relaunched installed app as pid 10034:
    Source Index opens, recent captures expose visible `DELETE` buttons,
    Collect opens, Draft opens with saved content/references, and the app was
    returned to Organize. No destructive delete or user-file import was
    executed.
- Update at 2026-05-09 12:43 AEST:
  - Native image import now adds macOS Vision classification labels on top of
    OCR and original-path / visual-provenance fallback text.
  - `LocalImageImportText.build(... visualDescriptions:)` normalizes and
    deduplicates labels under a `Visual description:` section, so the summary
    can still carry semantic hints when OCR finds no words.
  - Red/green evidence: the focused skeleton contract first failed on the
    missing `VNClassifyImageRequest` contract, and the focused Swift test first
    failed because `LocalImageImportText.build` did not accept
    `visualDescriptions:`. After implementation, the focused Swift test passed
    1/1 and full `TypedExtractorMatchTests` passed 6/6.
  - Wider evidence passed: full
    `tests/new-loom-skeleton-contract.test.ts` passed 50/50,
    `npm run test:contracts` passed 258/258, and Debug Xcode build passed with
    `LOOM_SKIP_WEB_STAGE=1`.
  - Release install verification passed: `npm run app:user` rebuilt and
    installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`
    passed for bundle id `com.yinyiping.loom` with 630 static web files; `npm
    run app:where` reported `2026-05-09T02:52:27.910Z`.
  - The installed app was relaunched from
    `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` as pid 24418.
    Computer Use verified Source Index still shows visible `DELETE` buttons,
    Collect shows `Add files`, Draft shows saved body/references/AI draft/Draft
    board, and the app returned to Organize. No destructive delete, user-file
    import, or AI call was executed.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `2026-05-09T02:43:02.193Z`.
  - Computer Use verified the freshly relaunched installed app as pid 16860
    from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`: Source
    Index opens with visible `DELETE` buttons for both recent captures,
    Collect opens with `Add files`, Draft opens with saved content and
    references, and the app was returned to Organize. No destructive delete or
    user-file import was executed.
- Update at 2026-05-09 12:49 AEST:
  - Keynote and Pages iWork imports now scan `Index/*.iwa` for best-effort
    printable UTF-8 and UTF-16LE text runs in addition to metadata and
    QuickLook preview text.
  - The recovered runs are emitted under an `iWork body text` section with
    duplicate and low-signal binary strings filtered out. This is deliberately
    not a full iWork protobuf, layout, page, or slide reconstruction.
  - Red/green evidence: the focused Swift tests first failed because
    `body.key` and `body.pages` returned only metadata and did not contain
    `iWork body text`; after implementation the two focused iWork body tests
    passed 2/2. Full `SlideDeckExtractorTests` passed 14/14.
  - Wider evidence passed: full
    `tests/new-loom-skeleton-contract.test.ts` passed 50/50,
    `npm run test:contracts` passed 258/258, and Debug Xcode build passed with
    `LOOM_SKIP_WEB_STAGE=1`.
- Update at 2026-05-09 13:00 AEST:
  - The iWork IWA text-run scanner now handles Unicode UTF-8 scalars and
    non-ASCII UTF-16LE code units, so Chinese Keynote / Pages body strings are
    not dropped by the earlier ASCII-only scan.
  - Red/green evidence: focused Swift tests first failed because `body.key`
    and `body.pages` contained only English IWA body strings and missed
    `第 3 页：机制设计例子` / `第 3 页：先理解再自测`; the focused tests then passed
    2/2 after implementation. The focused new-Loom contract also first failed
    on the missing `extractUTF8TextRuns` contract, then passed 50/50.
  - Full `SlideDeckExtractorTests` passed 14/14 after the Unicode parser
    change.
  - Release install verification passed immediately after the parser change:
    `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`;
    `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the same installed path at
    `2026-05-09T03:03:31.704Z`.
  - The installed app was relaunched from
    `/Users/yinyiping/Applications/Loom.app` as pid 31026. Computer Use read
    the live `com.yinyiping.loom` window and verified Source Index shows
    visible `DELETE` buttons, Collect shows `Add files`, Draft shows the saved
    body/references/AI draft/Draft board, and navigation returned to Organize.
    No destructive delete, file import, or AI call was executed.

## Phase 1 Handoff Status

The Phase 1 Atlas capture handoff gate is now closed:

```text
Atlas UI click or shortcut
  -> staged extension payload
  -> clipboard / loom://capture?via=clipboard
  -> native CaptureSheet save
  -> saved Loom.md + CaptureAST sidecar
  -> npm run verify:capture-handoff on the fresh saved capture
  -> installed app reader opens from Organize and renders the segment diagram
```

Computer Use completed this exact chain at 2026-05-09 03:58 AEST. The older
03:50 attempt exposed a real concurrent-capture media corruption risk; that is
now covered by the in-flight guard and by the verifier's unresolved temporary
media check.

## Remaining Missing Requirement

Do not mark the full user objective complete. The broad new-Loom target still
extends beyond Phase 1: most legacy behavior now exits through Collect /
Organize / Draft, but compatibility-route deletion still needs a release-cycle
review, and the Collect / Organize / Draft loop still needs deeper product work
beyond the verified skeleton, source-index state, local-file intake, and Draft
MVP.

The importer gap is narrower but still not closed: Keynote / Pages metadata,
best-effort Unicode IWA UTF-8 / UTF-16LE text runs, and QuickLook preview text
are covered, and images now carry Vision OCR plus basic Vision
classification labels, while full iWork protobuf/layout and body/slide/page
reconstruction, higher-fidelity or domain-specific image descriptions beyond
Vision labels / OCR / embedded metadata, and release-cycle evidence on real
user files remain open.

New real-file importer gate: `npm run verify:real-files-importer` compiles a
standalone Swift verifier with the native `PDFExtraction`, `CleanText`, and
`PageRange` sources against an explicitly supplied `--root PATH` or
`LOOM_REAL_FILE_ROOT`, with no implicit real-file corpus default, so importer
evidence is no longer limited to synthetic fixtures and repeatable gates cannot
silently scan user files. The gate checks real PDFs through `PDFExtraction`, real
images through AppKit loading, optional Word/RTF extraction through
`NSAttributedString`, and optional slide-package candidates through the real
manifest.

Update at 2026-05-09 13:25 AEST:
- Red/green evidence: the focused new-Loom contract first failed because
  `scripts/verify-real-file-importer.mjs` did not exist, then passed 51/51
  after adding the standalone Swift verifier.
- `npm run verify:real-files-importer` passed against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW`. Real-file evidence:
  `Course Overview_FINS3640.pdf` (4000 chars, 13 pages),
  `INFS3822 Assessment Guide T1 2026.pdf` (4000 chars, 37 pages),
  `COMM3030 Assessment Handbook ST, 2026.pdf` (4000 chars, 22 pages),
  `Framework_for_Innovation_transparent.png`, and
  `business-model-canvas (1).docx` (3904 chars).
- Implementation nuance: the verifier deliberately does not launch Loom.app or
  an app-hosted XCTest, because the sandboxed test host can couple this
  importer smoke to unrelated app startup and capture-index scanning.

Update at 2026-05-09 13:29 AEST:
- The same real-file gate now includes real PPTX package evidence:
  `FINS3616 Week 2_Updated.pptx` produced 43757 chars from 43
  `ppt/slides/slide*.xml` files. This is standalone OOXML package evidence for
  the real source tree; native `SlideDeckExtractor` remains separately covered
  by fixture-level ZIPFoundation tests.

Update at 2026-05-09 14:01 AEST:
- The real-file verifier now always scans the selected corpus and prints format
  coverage before the per-file smoke evidence. Latest pass against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW`: 391 supported-size PDFs,
  2827 supported images, 14 supported attributed documents, 1 PPTX deck, and 0
  `.key` / `.pages` packages.
- The verifier now reports `iwork: none found in real corpus` when the real
  source tree has no Keynote / Pages files, instead of silently implying that
  fixture-level iWork evidence was real-user-file evidence. If future real
  `.key` / `.pages` files appear under `LOOM_REAL_FILE_ROOT`, the same Swift
  verifier attempts ZIP-package metadata, IWA body-string, and QuickLook preview
  extraction before reporting success.
- Current Computer Use acceptance retry is blocked by the macOS session state,
  not by a missing Loom window: `CGSessionScreenIsLocked=Yes`; Computer Use
  `get_app_state("Loom")` returns `cgWindowNotFound`; the Loom process still
  exists at `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`. This
  pass should remain an open visual-acceptance blocker until the desktop is
  unlocked and CUA can see the app accessibility tree again.

Update at 2026-05-09 14:05 AEST:
- Hidden panel/question detail deep links are buildable again without
  promoting them into the default product path: `app/panel/[id]/page.tsx` and
  `app/pursuit/[id]/page.tsx` wrap the same detail clients used by the
  static-export fallback pages, while `app/panels/[id]/page.tsx` and
  `app/pursuits/[id]/page.tsx` preserve older plural aliases as redirects to
  the singular dynamic routes.
- The migration map and executable deletion registry now classify
  `/panel/[id]`, `/panels/[id]`, `/pursuit/[id]`, and `/pursuits/[id]` as
  legacy migration-source routes. They stay blocked from deletion until their
  remaining hidden callers are retired, while `scripts/build-static-export.mjs`
  continues shelving unbounded dynamic ids during static export.
- Red/green evidence: `tests/canonical-detail-routes.test.ts` first failed
  because `app/panel/[id]/page.tsx` did not exist; `tests/legacy-detail-aliases.test.ts`
  then failed because `app/panels/[id]/page.tsx` did not exist. After adding
  the dynamic wrappers, plural aliases, and registry rows, `npx tsx --test
  tests/legacy-detail-aliases.test.ts tests/canonical-detail-routes.test.ts
  tests/new-loom-skeleton-contract.test.ts tests/static-doc-entry.test.ts`
  passed 60/60.
- The direct-route/detail compatibility contracts, including plural alias
  coverage, are now part of `npm run test:contracts`, so the main gate can
  catch this class of broken hidden deep link instead of leaving it to an
  out-of-band test.

Update at 2026-05-09 14:20 AEST:
- The screenshot-reported missing Source Index capture delete affordance is
  covered in the installed bundle: `/Users/yinyiping/Applications/Loom.app`
  contains the `Delete` / `Delete now` Source Index code, the
  `loomCaptureDelete` bridge, and the danger-action styling.
- `npm run app:smoke` passed for the installed app at
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 630 static web files.
- Focused delete-surface contracts passed 30/30 with
  `npx tsx --test tests/knowledge-home-source-library.test.tsx
  tests/captures-landing-refresh-contract.test.ts`; this covers the Source
  Index two-step delete UI, native bridge wiring, and visible delete-failure
  handling.
- A local HTTP render of the installed `sources.html` bundle, with native
  capture-list and `loomCaptureDelete` bridge mocks, produced two visible
  `Delete` buttons in Recent captures. Clicking the first non-destructively
  changed it to `Delete now` plus `Cancel`, without sending a real delete.
- Computer Use acceptance is still not complete: a second
  `get_app_state("Loom")` returned `cgWindowNotFound`, and the macOS session
  still reports `CGSessionScreenIsLocked=Yes`. Treat this as an environment
  blocker for actual window-level CUA verification, not a product pass.

Update at 2026-05-09 14:25 AEST:
- Product/route contract coverage was tightened by moving these previously
  out-of-band tests into `npm run test:contracts`:
  `tests/sidebar-source-library-ia.test.tsx`,
  `tests/knowledge-top-level-compatibility.test.ts`,
  `tests/native-detail-endpoints.test.ts`,
  `tests/pursuit-detail-contract.test.ts`,
  `tests/chapter-surface-honesty.test.ts`, and
  `tests/atelier-honesty.test.ts`.
- Focused preflight evidence passed 14/14 with `npx tsx --test
  tests/chapter-surface-honesty.test.ts tests/atelier-honesty.test.ts
  tests/knowledge-top-level-compatibility.test.ts
  tests/pursuit-detail-contract.test.ts tests/native-detail-endpoints.test.ts
  tests/sidebar-source-library-ia.test.tsx`.
- The expanded main gate then passed 294/294 with `npm run test:contracts`.
  This means the default contract gate now covers hidden detail endpoints,
  native detail payloads, pursuit attachments, sidebar source-library
  behavior, `/knowledge` aliasing, and placeholder/fabrication cleanup instead
  of relying on a separate manual test list.
- Native storage/mirror coverage then found two stale assertions: one expected
  `CollectionClient` to use the old mirror-store keys even though
  `tests/static-doc-entry.test.ts` now requires direct derived native manifest
  reads, and another still treated `HomeClient` as a native record consumer
  even though the new Loom home is capability-only. The tests were updated to
  lock the current boundary: collection detail reads
  `loom://derived/knowledge/.cache/manifest/{knowledge-nav,knowledge-manifest}.json`,
  and Home must keep `NEW_LOOM_CAPABILITIES` / `loomNavigate` without
  re-adopting panel, pursuit, or mirror record helpers.
- Focused evidence for this storage/native/mirror slice passed 27/27 with
  `npx tsx --test tests/is-native-mode.test.ts tests/loom-mirror-store.test.ts
  tests/mirror-contract-adoption.test.ts tests/native-mirror-authority.test.ts
  tests/native-web-theme-sync.test.ts tests/schema-bridge.test.ts
  tests/shared-store-sync.test.ts tests/collection-native-mirror.test.ts`.
  After adding the slice to `npm run test:contracts`, the expanded main gate
  passed 321/321.

Update at 2026-05-09 14:27 AEST:
- First-paint and state-interaction contracts were added to the default
  contract gate after a focused 27/27 pass:
  `tests/home-client-first-paint.test.tsx`,
  `tests/sidebar-accessibility.test.ts`, `tests/sidebar-mode.test.ts`,
  `tests/surface-actions.test.ts`, `tests/settings-panel-events.test.ts`,
  `tests/selection-edit-client.test.ts`, `tests/support-primitives.test.ts`,
  `tests/trace-events.test.ts`, `tests/work-session.test.ts`, and
  `tests/window-titlebar-tabbing.test.ts`.
- `npm run test:contracts` then passed 348/348. The main gate now covers the
  new Loom home first paint, sidebar persistence and accessibility, settings
  event dispatch, selection/support primitives, trace events, work-session
  advancement, and the native titlebar tabbing guard.

Update at 2026-05-09 14:29 AEST:
- Lightweight capture and empty-doc contracts were added to the default gate:
  `tests/capture-save-substitution-contract.test.ts`,
  `tests/captures-landing-behavior.test.ts`,
  `tests/empty-doc-capture-contract.test.tsx`, and
  `tests/knowledge-doc-state.test.ts`. The export-backed
  `tests/capture-interactive-artifacts.test.ts` remains in the dedicated
  `test:capture-interactive:export` gate because it depends on a static export.
- The empty-doc capture contract had gone stale by reading the deleted
  `app/knowledge/[category]/[slug]/page.tsx`. It now locks the current
  static-export-safe `/doc?href=` path by checking `app/DocClient.tsx` for
  `isEligibleCaptureDoc`, `EmptyDocCaptureSurface`, and the show-capture branch.
- Focused evidence passed 13/13, then `npm run test:contracts` passed 361/361.

Update at 2026-05-09 14:31 AEST:
- AI/CLI contracts were added to the default gate after a focused 21/21 pass:
  `tests/ai-cli.test.ts`, `tests/ai-stage-primitives.test.tsx`,
  `tests/anthropic-http.test.ts`, and
  `tests/codex-default-cli-contract.test.ts`.
- `npm run test:contracts` then passed 382/382. The main contract gate now
  covers Codex as the local CLI default, stale legacy CLI preference migration,
  inline AI notice action rendering, Anthropic SSE parsing/recoverability, and
  native/research/e2e CLI defaults.

Update at 2026-05-09 14:32 AEST:
- Chat focus contracts were added to the default gate after a focused 27/27
  pass: history, layout mode, layout positioning, pinning, source excerpt
  rendering, spacer sizing, stage selection, view selection, and provider
  waiting-state copy.
- `npm run test:contracts` then passed 409/409. The main gate now covers the
  AI clarification/history/source/waiting states that Draft and reader-side AI
  flows depend on.

Update at 2026-05-09 14:33 AEST:
- Legacy compatibility/helper contracts were added to the default gate after a
  focused 17/17 pass: desk action derivation/presenters, eslint runtime
  compatibility dependency presence, overlay resume/root wiring, and weave
  contract status sync.
- `npm run test:contracts` then passed 426/426. At this point every lightweight
  `tests/*.test.{ts,tsx}` file is in the main contract gate except
  `tests/capture-interactive-artifacts.test.ts`, which intentionally remains in
  the export-backed `test:capture-interactive:export` gate.

Update at 2026-05-09 14:40 AEST:
- The Source Index delete affordance was rechecked after the installed app
  screenshot showed only Draft pills. `tests/knowledge-home-source-library.test.tsx`
  now includes a render-level assertion for `KnowledgeHomeStatic`: a Recent
  captures row renders the visible `Draft` action and visible `Delete` button,
  and the confirmation state renders `Delete now` plus `Cancel`.
- Focused evidence passed 20/20, then `npm run test:contracts` passed 427/427.
  `npm run typecheck` and `git diff --check && git diff --cached --check`
  also passed.
- Computer Use cannot complete a live Loom window acceptance while the macOS
  session is locked: `get_app_state` for both `Loom` and `com.yinyiping.loom`
  returns `cgWindowNotFound`, and `ioreg` reports
  `CGSessionScreenIsLocked=Yes`.
- `npm run app:user` rebuilt and reinstalled the current Release app to
  `~/Applications/Loom.app`, then `npm run app:smoke` passed
  (`bundle id: com.yinyiping.loom`, 630 static web files). A second Computer
  Use read after reinstall is still blocked by the same locked-session
  `cgWindowNotFound` condition.

Update at 2026-05-09 14:48 AEST:
- The real-file importer gate now exercises Vision on real user images instead
  of only proving they open through AppKit. `scripts/verify-real-file-importer.swift`
  runs `VNRecognizeTextRequest` and `VNClassifyImageRequest` for up to three
  real images and prints OCR plus visual-description counts in its evidence
  line.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because the verifier had no Vision import or image OCR/classification
  evidence, then passed 51/51 after the verifier update.
- `npm run verify:real-files-importer` passed cleanly against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW`: corpus coverage was 391
  supported-size PDFs, 2827 images, 14 attributed documents, 1 PPTX deck, and
  0 real iWork packages. Real image evidence now reports OCR 29 and visual
  descriptions 12 across `Framework_for_Innovation_transparent.png`,
  `Derivation.jpeg`, and `output.png`.
- Wider gates passed: `npm run test:contracts` 427/427 and
  `npm run typecheck`.

Update at 2026-05-09 14:56 AEST:
- Draft AI prompt context now carries capture timestamps end-to-end for both
  web and native Draft. Web `referencePromptLine` and Swift
  `LoomDraftAIPrompt.referencePromptLine` include `capturedAt=...` alongside
  source, href, excerpt, and artifact-state context.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because the prompt contract had no capturedAt coverage, and
  `xcodebuild ... -only-testing:LoomTests/LoomDraftStoreTests/testDraftAIPromptIncludesCaptureTimestampContext`
  first failed because native prompt output omitted the timestamp. After the
  implementation, the focused web contract passed 51/51 and the selected Swift
  test passed 1/1.
- Wider gates passed: `npm run test:contracts` 427/427, `npm run typecheck`,
  full `LoomDraftStoreTests` 10/10, and
  `git diff --check && git diff --cached --check`.
- This closes one richer-source-resolution gap for Draft AI, but it does not
  complete the broader new-Loom objective; deeper ThinkingDraft modelling,
  compatibility-route release evidence, and higher-fidelity importer work
  remain open.

Update at 2026-05-09 15:03 AEST:
- Removed the orphaned `app/AtlasHubClient.tsx` implementation. `/atlas` and
  `/atlas/shelf` already redirect to `/sources`; the stale unimported client
  still carried old `/atlas/shelf`, `/knowledge`, and "Compatibility routes
  stay live" UI copy, so leaving it in the tree weakened legacy-route deletion
  evidence.
- Red/green evidence: `tests/atlas-hub-phase2.test.ts` first failed because
  `app/AtlasHubClient.tsx` still existed, then passed 6/6 after the file was
  deleted.
- Wider gates passed: `npm run test:contracts` 428/428, `npm run typecheck`,
  and `git diff --check && git diff --cached --check`.
- This is only orphaned implementation cleanup. The `/atlas` and
  `/atlas/shelf` compatibility route files and legacy deletion registry remain
  intact until release-cycle evidence exists.

Update at 2026-05-09 15:06 AEST:
- Removed the orphaned `app/desk/DeskPage.tsx` implementation. `/desk` already
  redirects to `/sources`; the stale unimported file still composed old Atlas
  and Today clients, so it was legacy implementation residue rather than active
  compatibility behavior.
- Red/green evidence: `tests/desk-first-ia.test.ts` first failed because
  `app/desk/DeskPage.tsx` still existed, then passed 3/3 after the file was
  deleted.
- Wider gates passed: `npm run test:contracts` 429/429, `npm run typecheck`,
  and `git diff --check && git diff --cached --check`.
- This does not delete the `/desk` compatibility route. `app/desk/page.tsx`
  remains the redirect to `/sources`, and the legacy deletion registry stays
  blocked until release-cycle evidence exists.

Update at 2026-05-09 15:11 AEST:
- Removed the orphaned `app/today/TodayClient.tsx` implementation and the
  dead `.loom-today*` CSS block from `app/globals.css`. `/today` remains a
  lightweight compatibility redirect to `/sources`, so the old client and its
  route-only styles were no longer reachable product code.
- Red/green evidence: the focused route cleanup tests first failed because
  `app/today/TodayClient.tsx` still existed, then passed 8/8 after deletion.
  A second focused cleanup contract first failed on the remaining
  `.loom-today` CSS, then passed after removing the dead styles.
- Wider gates passed: `npx tsx --test
  tests/legacy-top-level-aliases.test.ts tests/quiet-horizon-layout.test.tsx
  tests/canonical-hotpaths.test.ts` 9/9, `npm run test:contracts` 431/431,
  and `npm run typecheck`.
- This is still compatibility-route cleanup, not `/today` route deletion.
  `app/today/page.tsx` stays as the `/sources` redirect and the legacy
  deletion registry remains blocked until release-cycle evidence exists.

Update at 2026-05-09 15:18 AEST:
- Removed the orphaned top-level visual-source clients
  `app/PatternsClient.tsx`, `app/PursuitsClient.tsx`, and
  `app/WeavesClient.tsx`. Their top-level routes already redirect to
  `/sources` or `/sources#reader-notes`, and no runtime source imported these
  clients; only tests were still keeping them alive.
- Removed the matching dead top-level CSS from `app/globals.css`:
  `.loom-patterns*`, `.loom-panel-tile*`, `.loom-weaves*`,
  `.loom-pursuits*`, and the list-route `.loom-pursuit*` styles. The active
  `.loom-pursuit-detail*` styles remain because `PursuitDetailClient` still
  owns the hidden direct detail route.
- Red/green evidence: the focused cleanup suite first failed because those
  client files and selectors still existed, then passed 76/76 after deletion.
- Wider gates passed: `npm run test:contracts` 433/433 and
  `npm run typecheck`.
- This is still implementation residue cleanup, not route deletion:
  `app/patterns/page.tsx`, `app/weaves/page.tsx`, and
  `app/pursuits/page.tsx` remain compatibility redirects, and the legacy
  deletion registry remains blocked until release-cycle evidence exists.

Update at 2026-05-09 15:21 AEST:
- Removed the orphaned `app/WorkbenchClient.tsx` implementation. `/workbench`
  already redirects to `/draft`, and Draft now owns the imported Workbench
  body, debounced saves, word count, and reference insertion behavior.
- Removed the matching dead `.loom-workbench*` CSS block from
  `app/globals.css`.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because `app/WorkbenchClient.tsx` still existed, then passed 51/51 after the
  file and dead CSS were removed.
- Wider gates passed: `npm run test:contracts` 433/433 and
  `npm run typecheck`.
- This is still implementation residue cleanup, not `/workbench` route
  deletion. `app/workbench/page.tsx` remains the `/draft` compatibility
  redirect and the legacy deletion registry remains blocked until release-cycle
  evidence exists.

Update at 2026-05-09 15:23 AEST:
- Removed the orphaned `app/ContentsClient.tsx` implementation. `/contents`
  already redirects to `/sources`, and the old table-of-contents client still
  carried the retired chapter map plus links back to old surfaces.
- Removed the matching dead `.loom-contents*` CSS from `app/globals.css`.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because `app/ContentsClient.tsx` still existed, then passed 51/51 after the
  file and dead CSS were removed.
- Wider gates passed: `npm run test:contracts` 433/433 and
  `npm run typecheck`.
- This is still implementation residue cleanup, not `/contents` route
  deletion. `app/contents/page.tsx` remains the `/sources` compatibility
  redirect and the legacy deletion registry remains blocked until release-cycle
  evidence exists.

Update at 2026-05-09 16:15 AEST:
- Removed the orphaned `app/AtelierClient.tsx` implementation after `/atelier`
  had already become a direct redirect to `/draft`.
- Removed the dead `.loom-atelier*` CSS block from `app/globals.css`. Draft now
  owns reference excerpts, quote insertion, provenance, native-backed storage,
  and AI continuation, so the old localStorage-backed Atelier composition
  surface was implementation residue rather than active compatibility behavior.
- Red/green evidence: focused tests first failed because
  `app/AtelierClient.tsx` still existed, then passed 54/54 after deleting the
  file and dead CSS.
- This is still implementation cleanup, not `/atelier` route deletion.
  `app/atelier/page.tsx` remains the `/draft` compatibility redirect and the
  legacy deletion registry remains blocked until release-cycle evidence exists.

Update at 2026-05-09 16:20 AEST:
- Moved the active web Draft board runtime from the legacy top-level
  `app/SoanClient.tsx` file to `app/draft/DraftBoardClient.tsx`.
- `/draft` now imports `DraftBoardClient` directly, while `/soan` remains only
  the `/draft?view=board` compatibility redirect.
- The SwiftData model and `loom://native/soan.json` endpoint remain internal
  migration names for existing draft-card storage, but the active web component
  is now Draft-scoped instead of a separate Sōan product surface.
- Red/green evidence: the focused suite first failed because
  `DraftBoardClient.tsx` was missing, then passed 61/61 after the move and
  import/comment updates.

Update at 2026-05-09 16:25 AEST:
- Renamed the web Draft board DOM/CSS namespace from `.loom-soan*` to
  `.draft-board*` after moving the component under `app/draft`.
- Kept the existing native storage and invalidation names
  (`loom://native/soan.json`, `loom.soan.v1`, `loom-soan-updated`) as internal
  migration compatibility, but removed the old route-product name from the
  active board's rendered class names and CSS selectors.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because `DraftBoardClient` still rendered `className="loom-soan"` and
  `app/globals.css` still had `.loom-soan*` selectors, then passed 51/51 after
  the namespace migration.

Update at 2026-05-09 16:33 AEST:
- Hidden question detail deletion no longer uses a browser prompt. The direct
  `PursuitDetailClient` fallback now has inline `Delete now` / `Cancel`
  confirmation state before posting `deletePursuit` to the native bridge.
- Red/green evidence: `tests/pursuit-detail-contract.test.ts` first failed on
  `window.confirm`, then passed 3/3 after the inline confirmation implementation.
- Related focused route/detail gates passed 59/59, `npm run typecheck` passed,
  and `npm run test:contracts` passed 437/437.
- Release install verification passed: `npm run app:user` installed
  `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed with 630
  static web files, and `npm run app:where` reported
  `2026-05-09T06:35:33.996Z`.
- Computer Use remains blocked at the visible-window layer because the macOS
  session is locked: `get_app_state("com.yinyiping.loom")` returned
  `cgWindowNotFound`, System Events reported 0 Loom windows, the installed Loom
  process exists at `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`,
  and `ioreg` reported `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-09 16:46 AEST:
- Re-validated the screenshot complaint that Source Index showed no visible
  delete affordance. The current Source Index implementation already exposes
  confirmed `Delete` / `Delete now` capture actions in both the web Source
  Index and the native `LoomLibraryView`; the installed app was rebuilt and
  reinstalled so the user-facing bundle is no longer older than that
  implementation.
- Tightened the hidden `PanelDetailClient` fallback so it no longer exposes
  old visible `held panel`, `Wefts`, or `source provenance still gated`
  language. The direct panel detail route still exists as a migration/source
  deep link, but its fallback copy now uses Reader note and Source context
  vocabulary.
- Red/green evidence: `tests/chapter-surface-honesty.test.ts` first failed on
  `This held panel exists`, then passed 5/5 after the wording migration.
- Related focused gates passed 36/36:
  `tests/chapter-surface-honesty.test.ts`,
  `tests/native-detail-endpoints.test.ts`,
  `tests/mirror-contract-adoption.test.ts`,
  `tests/knowledge-home-source-library.test.tsx`, and
  `tests/pursuit-detail-contract.test.ts`.
- Wider gates passed: `npm run typecheck`, `npm run test:contracts` 437/437,
  and `git diff --check && git diff --cached --check`.
- Release install verification passed after the final code change:
  `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`,
  `npm run app:smoke` passed with 630 static web files, and `npm run
  app:where` reported `2026-05-09T06:45:38.557Z`. The installed binary contains
  the capture deletion strings (`Delete this capture?`, `Couldn't delete
  capture`, and `Delete this capture from Loom.md`).
- Computer Use acceptance was attempted again, but the visible-window layer is
  still blocked by the locked macOS session: `get_app_state("com.yinyiping.loom")`
  returned `cgWindowNotFound`, System Events reported 0 Loom windows, the Loom
  process exists at `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`,
  and `ioreg` reported `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-09 16:56 AEST:
- Tightened the Source Index screenshot fix after the user confirmed the
  visible native surface still had no obvious delete key: native Recent captures
  now render a dedicated trash icon button next to `Draft`, using the canonical
  destructive `dsAlert` token and a `Delete this capture from Loom.md` help
  string before opening the existing confirmed delete alert.
- Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
  failed because `LoomLibraryView.WorkRow` had no `Image(systemName: "trash")`
  or capture-specific delete help, then passed 21/21 after the icon affordance
  was added.
- Related focused gates passed 83/83:
  `tests/knowledge-home-source-library.test.tsx`,
  `tests/new-loom-skeleton-contract.test.ts`, and
  `tests/captures-landing-refresh-contract.test.ts`.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  437/437, `git diff --check && git diff --cached --check`, `npm run
  app:user`, `npm run app:smoke` with 630 static web files, and `npm run
  app:where` reported
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T06:54:47.724Z`.
  The installed binary contains `Delete this capture?` and
  `Delete this capture from Loom.md`.
- Computer Use acceptance was attempted again after reinstall, but the macOS
  session is still locked: `get_app_state("com.yinyiping.loom")` returned
  `cgWindowNotFound`, `list_apps` showed Loom running, and `ioreg` reported
  `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-09 17:08 AEST:
- Migrated `/system` out of the retired SystemAtlas/product-map vocabulary.
  `app/SystemAtlasClient.tsx` was replaced by `app/SystemClient.tsx`, and
  `app/system/page.tsx` now mounts the new Collect / Organize / Draft system
  explanation. The visible support page now names `Source Index`, `Reader
  notes`, `Draft references`, and `Original files stay read-only` instead of
  Book Room, Workbench, Sōan, Weft engine, Pattern detector, Panel ledger, or
  Letter outbox.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because `SystemAtlasClient` still existed, then passed 52/52 after the
  migration. The focused compatibility gate also passed 62/62 across
  `tests/new-loom-skeleton-contract.test.ts`,
  `tests/atlas-hub-phase2.test.ts`, `tests/desk-first-ia.test.ts`, and
  `tests/browse-compatibility-surface.test.ts`.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  438/438, `git diff --check`, and `git diff --cached --check`.
- Release install verification passed after the `/system` migration:
  `npm run app:user`, `npm run app:smoke` with 630 static web files, and
  `npm run app:where` reported `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T07:07:46.254Z`. The installed `/system` chunk contains
  `Collect, Organize, Draft`, `Source Index`, `Draft references`, and
  `Original files stay read-only`; it has no `SystemAtlas`, `Book Room`,
  `Sōan`, `ATLAS · OF THE LOOM`, `Weft engine`, `Panel ledger`, or
  `Letter outbox` matches.
- Computer Use acceptance remains blocked by the locked macOS session after
  reinstall: `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")`
  both returned `cgWindowNotFound`; `list_apps` showed Loom running; `pgrep`
  located `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`; and
  `ioreg` reported `IOConsoleLocked=Yes` and `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-09 17:18 AEST:
- Tightened the active Draft board vocabulary so visible card and relation
  labels no longer expose old metaphor/storage names. Web Draft board labels
  now show `Unclear` and `Connection`; the empty state says `unclear note,
  connection, sketch`; native add/connect sheets show `Unclear`,
  `Connection`, and `Related`.
- Internal compatibility names stay internal: `fog`, `weft`, `echo`,
  `LoomSoanCard`, `LoomSoanEdge`, `loom://native/soan.json`, and
  `loom.soan.v1` remain storage and migration identifiers rather than visible
  product vocabulary.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  because `DraftBoardClient` still lacked literal `Unclear` / `Connection`
  labels, then passed 53/53 after the visible-label migration.
- Wider verification passed: `npm run typecheck`, Debug
  `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom
  -configuration Debug -destination 'platform=macOS' build`,
  `npm run test:contracts` 439/439, and `npm run app:user`.
- Release install verification passed after reinstall: `npm run app:smoke`
  reported `/Users/yinyiping/Applications/Loom.app`, bundle id
  `com.yinyiping.loom`, and 630 static web files; `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T07:15:54.565Z`.
  Installed bundle checks found `Delete this capture from Loom.md` and the
  minified Draft chunk contains `label:"Unclear"`,
  `label:"Connection"`, and `unclear note, connection, sketch`.
- Computer Use acceptance was attempted with both `com.yinyiping.loom` and
  `Loom` after reinstall/opening the app. `list_apps` showed Loom running, but
  `get_app_state` still returned `cgWindowNotFound`; `ioreg` reported
  `IOConsoleLocked=Yes`. Visual Computer Use acceptance remains blocked until
  the macOS session is unlocked.

Update at 2026-05-09 17:21 AEST:
- Computer Use acceptance succeeded after the macOS session unlocked
  (`IOConsoleLocked=No`). `get_app_state("com.yinyiping.loom")` read the
  installed Loom window at `Source Index`; Recent captures exposed visible
  per-row `DRAFT` and `DELETE` buttons for both capture rows.
- The delete button itself was not clicked during acceptance because that
  would enter a destructive delete flow. The code and installed-binary checks
  already verify the button opens the confirmed delete path and includes
  `Delete this capture?` plus `Delete this capture from Loom.md`.
- Computer Use then navigated to `Draft` and read the installed native Draft
  surface with references, `AI draft`, `Save draft`, and the `Draft board`
  panel. The Draft card label migration is covered by contract tests and
  installed web chunk string checks; the current runtime had no draft cards, so
  there were no existing card labels to inspect visually.

Update at 2026-05-09 17:27 AEST:
- Native Shuttle Draft-card result subtitles now use literal learner-facing
  labels instead of storage names: `fog` renders as `Unclear`, `weft` renders
  as `Connection`, and other kinds fall back to capitalized text. The internal
  storage identifiers remain unchanged.
- Red/green evidence: `tests/shuttle-canonical-ia.test.ts` first failed because
  `ShuttleHit.display` still used `c.kind` directly; it then passed 2/2 after
  `draftCardKindLabel(c.kind)` was added.
- Wider verification passed: `npm run test:contracts` 439/439, `npm run
  typecheck`, Debug `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme
  Loom -configuration Debug -destination 'platform=macOS' build`,
  `git diff --check`, and `git diff --cached --check`.
- Release install verification passed: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 630 static web files; `npm run app:where`
  reported `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T07:26:45.962Z`.
- Computer Use verified the installed Source Index again after reinstall:
  Recent captures expose visible per-row `DRAFT` and `DELETE` buttons. Shuttle
  opened with `super+k` and accepted searches, but the current runtime has no
  draft-card results for `draft`, `unclear`, or `connection`; therefore the
  new Shuttle card subtitle labels are verified by contract/source/build
  evidence rather than by a live card instance in this dataset.

Update at 2026-05-09 17:32 AEST:
- Native note-connection surfaces now translate relation storage kinds before
  showing them to the learner: `supports` -> `Supports`, `contradicts` ->
  `Contradicts`, `elaborates` -> `Adds detail`, and `echoes` -> `Related`.
  The underlying `LoomWeave.kind` values remain unchanged for compatibility.
- Covered visible surfaces in this slice: Shuttle note-connection result
  titles/subtitles, the `Connect Reader Notes` relation picker, and Settings >
  Data note-connection row titles.
- Red/green evidence: `tests/shuttle-canonical-ia.test.ts` first failed on
  direct `w.kind` display in Shuttle, and
  `tests/new-loom-skeleton-contract.test.ts` first failed on lower-case picker
  labels plus direct Data Settings row formatting; both focused tests then
  passed after helper-based label mapping was added.
- Wider and installed verification passed after this slice: `npm run
  test:contracts` 439/439, `npm run typecheck`, Debug Xcode build, `git diff
  --check`, `git diff --cached --check`, `npm run app:user`, `npm run
  app:smoke`, and `npm run app:where` for
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T07:36:05.454Z`.
- The running installed process was confirmed as
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`. Computer Use
  verified the installed Source Index still shows per-row `DRAFT` and `DELETE`
  buttons. Shuttle opened and searched successfully, but the current runtime
  has no note-connection rows for `connection` or `Related`, so the new
  note-connection labels are accepted through contract/source/build evidence
  rather than a live relation-row visual instance.

Update at 2026-05-09 17:46 AEST:
- Rechecked the user's Source Index screenshot complaint with Computer Use
  against the current installed app, not a stale screenshot. Computer Use read
  `pid 66489` from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`
  and saw visible per-row `DRAFT` controls plus `Delete` trash-icon buttons in
  Recent captures, with `Delete this capture from Loom.md` help text.
- The delete action was not clicked because it is destructive. Supporting
  evidence remains live: `npm run app:where` reported the installed bundle at
  `2026-05-09T07:43:40.071Z`; installed strings include
  `Delete this capture?` and `Delete this capture from Loom.md`; and
  `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 21/21.

Update at 2026-05-09 17:50 AEST:
- Removed the remaining orphaned Atlas shelf implementation. `/atlas` and
  `/atlas/shelf` already redirect to `/sources`, so `app/AtlasClient.tsx` was
  dead legacy UI, and its `.loom-atlas*` / `data-atlas-empty-group` CSS in
  `app/globals.css` was no longer owned by any route.
- Red/green evidence: `npx tsx --test tests/atlas-hub-phase2.test.ts
  tests/desk-first-ia.test.ts tests/mirror-contract-adoption.test.ts` first
  failed on the lingering `app/AtlasClient.tsx` file and dead shelf CSS, then
  passed 15/15 after deletion. This is not route deletion; the `/atlas` and
  `/atlas/shelf` compatibility redirect files stay in place until release-cycle
  evidence exists.
- Wider and installed verification passed: `npm run test:contracts` passed
  440/440, `npm run typecheck` passed, both diff whitespace checks passed, and
  `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`
  with the usual preexisting `activateIgnoringOtherApps` deprecation warnings.
  `npm run app:smoke` passed with 630 static web files, `npm run app:where`
  reported `2026-05-09T07:53:58.076Z`, and installed resources no longer
  contain `loom-atlas`, `data-atlas-empty-group`, or `AtlasClient`. Computer
  Use then verified the relaunched installed app as `pid 72840` with Source
  Index, Collect / Organize / Draft, and visible per-row `DRAFT` / `Delete`
  controls intact.

Update at 2026-05-09 18:00 AEST:
- Tightened the Source Index writing-continuation language. The web Organize
  surface no longer labels non-tidied writing records as `scratch`; it now uses
  the literal `draft notes` state while preserving `draft ready` for tidy
  records and keeping the old Cowork-derived migration data untouched.
- Red/green evidence: `npx tsx --test
  tests/knowledge-home-source-library.test.tsx` first failed on rendered
  `ECON 3202 · scratch · 2 sources · now`, then passed 22/22 after
  `KnowledgeHomeStatic.writingMeta` changed the visible label. Wider evidence
  also passed: `npm run test:contracts` 441/441, `npm run typecheck`, `git
  diff --check`, and `git diff --cached --check`.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app` with the usual preexisting
  `activateIgnoringOtherApps` deprecation warnings, `npm run app:smoke` passed
  with 630 static web files, `npm run app:where` reported
  `2026-05-09T08:02:40.692Z`, and installed `sources.html` contains
  `draft notes`. After relaunch, Computer Use verified the installed app as
  `pid 76844` on Source Index with Collect / Organize / Draft and per-row
  `DRAFT` / `Delete` controls intact. The current user data has no active
  Continue writing row, so the `draft notes` visual instance is covered by
  installed-resource and render-contract evidence rather than live CUA text.

Update at 2026-05-09 18:15 AEST:
- Tightened native Keyboard Shortcuts help language so the learner-facing
  help window no longer exposes the retired `Cowork (rehearsal)` grouping or
  `scratch` labels. The group now reads `Draft editing`, the tidy action reads
  `Tidy draft`, image paste reads `Attach screenshot to draft notes`, and undo
  language reads `Undo / redo draft-note changes`.
- Red/green evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts`
  first failed on the old `Group(title: "Cowork (rehearsal)")` text, then
  passed 53/53 after the Keyboard Help copy changed. Wider evidence also
  passed: `npm run test:contracts` 441/441, `npm run typecheck`, `git diff
  --check`, and `git diff --cached --check`.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed with
  630 static web files, and `npm run app:where` reported
  `2026-05-09T08:08:09.945Z`. Installed binary strings contain the new
  screenshot/draft-note labels and no old `Cowork (rehearsal)` / scratch-help
  strings. A later Computer Use retry was blocked because macOS locked again:
  `IOConsoleLocked=Yes` and `CGSessionScreenIsLocked=Yes`; this is a CUA
  session boundary, not a failed delete-button acceptance.

Update at 2026-05-09 18:24 AEST:
- Native Draft storage now writes readable Markdown sidecars beside the JSON
  index. Each saved draft still uses `Drafts/drafts.json` as the authoritative
  native store, and also writes `Drafts/<draft-id>.md` with the draft title,
  body, and reference ledger including `kind`, source title, capture timestamp,
  artifact-state summary, and quoted excerpt when present.
- Red/green evidence: the focused
  `LoomDraftStoreTests/testDraftsPersistReadableMarkdownSidecars` first failed
  because `Drafts/<draft-id>.md` did not exist, then passed after sidecar
  persistence was added. Full `LoomDraftStoreTests` passed 11/11, `npm run
  test:contracts` passed 441/441, `npm run typecheck` passed, and both
  `git diff --check` / `git diff --cached --check` passed before install.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 630 bundled static web files; `npm run
  app:where` reported `2026-05-09T08:22:37.311Z`.
- Computer Use was rerun against the installed app after the user's screenshot
  showed no delete key. `get_app_state("Loom")` read the live
  `com.yinyiping.loom` window at Source Index: Collect / Organize / Draft were
  present, and each current Recent captures row exposed both a `DRAFT` action
  and a `Delete` trash button with help text `Delete this capture from Loom.md`.
  No destructive delete action was clicked.

Update at 2026-05-09 18:30 AEST:
- Native Draft storage can now recover from readable Markdown sidecars when the
  JSON index is missing. `Drafts/drafts.json` remains the normal authoritative
  index, but `LoomDraftStore.list()` falls back to `Drafts/<draft-id>.md` files
  and reconstructs the draft title, body, and reference metadata instead of
  returning an empty Draft list.
- Red/green evidence: the focused
  `LoomDraftStoreTests/testDraftsRecoverFromReadableMarkdownSidecarsWhenIndexIsMissing`
  first failed with zero recovered drafts after deleting `drafts.json`, then
  passed after sidecar recovery parsing was added. Full `LoomDraftStoreTests`
  passed 12/12, `npm run test:contracts` passed 441/441, `npm run typecheck`
  passed, and both `git diff --check` / `git diff --cached --check` passed.
- Installed evidence at 2026-05-09 18:34 AEST: `npm run app:user` rebuilt and
  installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`
  passed for bundle id `com.yinyiping.loom` with 630 bundled static web files;
  `npm run app:where` reported `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T08:33:23.493Z`. Computer Use read the installed app's main Loom
  window and saw Source Index with current Recent captures exposing both `DRAFT`
  and `Delete` controls. Delete was not clicked because it is destructive.

Update at 2026-05-09 18:40 AEST:
- Native Draft storage now also recognizes newer external edits to readable
  Markdown sidecars while the JSON index still exists. `Drafts/drafts.json`
  remains the normal native index, but when a UUID-named `Drafts/<draft-id>.md`
  file is clearly newer than the JSON index and its parsed title, body, or
  references differ, `LoomDraftStore.list()` merges that sidecar as the current
  draft content while preserving the draft id and creation date.
- Red/green evidence: the focused
  `LoomDraftStoreTests/testDraftsReadNewerMarkdownSidecarEditsWhenIndexStillExists`
  first failed because the old JSON record still won over an edited Markdown
  sidecar, then passed after newer-sidecar merging was added. Full
  `LoomDraftStoreTests` passed 13/13. Wider gates passed afterward:
  `npm run test:contracts` 441/441, `npm run typecheck`, and both
  `git diff --check` / `git diff --cached --check`.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app` with the existing macOS 14
  `activateIgnoringOtherApps` deprecation warnings. `npm run app:smoke` passed
  for bundle id `com.yinyiping.loom` with 630 bundled static web files; `npm run
  app:where` reported `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T08:43:17.008Z`. The old running process from 18:14 AEST was then
  quit and relaunched so Computer Use read the new installed process `pid 97697`.
  CUA verified Source Index with Collect / Organize / Draft, Recent captures
  exposing both `DRAFT` and `Delete` controls with help text `Delete this capture
  from Loom.md`, then opened Draft and saw saved content, References, AI draft,
  and Draft board. Delete was not clicked because it is destructive.

Update at 2026-05-09 18:53 AEST:
- Native Collect Drag-to-import is now explicitly locked as a main-window path:
  files dropped onto the main Loom window route into `IngestionContext`, trigger
  `.loomIngestFileDropped`, open the Ingestion window, and are consumed by the
  same importer used by Collect `Add files`.
- The user-facing help copy now says `Drop files into Collect` and
  `Collect files — drop or pick PDFs, slides, Markdown, and images`, removing
  the stale `.md/.txt` and `AI summary` wording.
- `docs/loom.md` now records the Phase 6 Drag-to-import evidence: main Loom
  window file drops, Collect `Add files`, and PDF/PPTX/Keynote/Pages/Markdown/
  text/DOCX/RTF/image coverage through the shared importer with extracted-text
  caps before schema extraction.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  on the stale `Plain text only` main-window-drop comment, then passed 55/55
  after the Collect/Ingestion wording and docs were updated.
- Installed-app evidence at 2026-05-09 18:58 AEST: `npm run app:user`
  reinstalled `/Users/yinyiping/Applications/Loom.app`,
  `npm run app:smoke` passed, `npm run app:where` reported
  `2026-05-09T08:56:13.371Z`, and the installed process was relaunched as
  pid 4627. Computer Use verified Source Index shows visible `DELETE` buttons
  beside recent captures, then opened Help -> Keyboard Shortcuts and read
  `Drop files into Collect` plus
  `Collect files — drop or pick PDFs, slides, Markdown, and images` from the
  live installed window.

Update at 2026-05-09 19:04 AEST:
- Draft AI prompt context now includes inline `@` references from the draft
  body for both web and native Draft. `parseDraftInlineReferences()` recognizes
  `@target`, `@target:p7`, `@target:p23-25`, `@target#heading`, and
  `@target#artifact-state:0.4`; `draftInlineReferencePromptLines()` resolves
  those mentions against attached Draft references by label, source title, href,
  and href basename before emitting anchor/source/href prompt lines.
- Native `LoomDraftInlineReferenceParser` mirrors the same page / slide /
  heading / artifact-state anchor prompt context inside
  `LoomDraftAIPrompt.buildDraftAIPrompt(...)`.
- Red/green evidence: `tests/new-loom-draft-storage.test.ts` first failed
  because the inline-reference parser did not exist, and
  `LoomDraftStoreTests/testDraftAIPromptIncludesInlineReferenceAnchors` first
  failed because native prompt output omitted `Inline @references`. After
  implementation, the focused TS suite passed 14/14 and the selected Swift test
  passed 1/1.
- This closes the prompt-context slice of Phase 6 `@` references. It does not
  close corpus-wide `@` autocomplete/search, embedding-backed whole-corpus AI,
  inline diff acceptance, or `/draft from #tag` streaming.
- Installed evidence at 2026-05-09 19:15 AEST: `npm run app:user` rebuilt and
  installed `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke`
  passed with bundle id `com.yinyiping.loom` and 630 static web files, and
  `npm run app:where` reported `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T09:07:46.238Z`. The installed binary contains the new
  `Inline @references:` and `No inline @references in the draft.` prompt
  strings.
- Computer Use acceptance is not complete for this 19:15 reinstall because the
  macOS console is locked: `IOConsoleLocked=Yes`,
  `CGSessionScreenIsLocked=Yes`, and `get_app_state("Loom")` /
  `get_app_state("com.yinyiping.loom")` return `cgWindowNotFound`. A direct run
  of the installed executable created a visible CG window from the current
  bundle, but AX/System Events still reports zero Loom windows while locked, so
  this is a locked-session CUA blocker rather than a passed installed UI
  acceptance.

Update at 2026-05-09 19:29 AEST:
- Phase 6 `⌘K inline edit` now has a first web/native Draft slice. Web Draft
  reads the selected textarea passage, sends an inline edit prompt through the
  existing `draft-compose` stream path, shows the replacement in an `AI edit`
  panel, and calls `applyDraftInlineEdit(...)` only when `Accept edit` is
  clicked. The storage helper refuses blank replacements, invalid ranges, and
  stale selections where the original selected text no longer matches.
- Native Draft now uses `SelectableTextEditor` for the body, tracks
  `draftSelectionRange`, traps Command-K through `CommandKTrap`, streams an
  inline replacement with `LoomDraftInlineEdit.buildPrompt(...)`, and applies
  the replacement only through `Accept edit`. `Discard edit` and cancellation
  keep the original body unchanged.
- This is the explicit accept/discard replacement slice, not the full rich
  multi-hunk diff-review UI and not whole-corpus embedding-backed AI.
- Verification: `npx tsx --test tests/new-loom-draft-storage.test.ts` passed
  15/15; `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed
  57/57; the selected Swift inline-edit test passed 1/1; full
  `LoomDraftStoreTests` passed 15/15; `npm run test:contracts` passed 447/447;
  `npm run typecheck` exited 0; `git diff --check` and
  `git diff --cached --check` exited 0.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 630 static web files, and
  `npm run app:where` reported `2026-05-09T09:28:55.794Z`. The installed
  binary contains `Inline edit request:` and
  `Return only the replacement text for the selected passage.`
- Computer Use was retried against the installed app. First
  `get_app_state("Loom")` returned `connectionInvalid`; after launching the
  installed app and killing the stale Xcode Debug Loom process, the installed
  process was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
  `get_app_state("Loom")` then returned `cgWindowNotFound` while
  `IOConsoleLocked=Yes`. This remains a locked-session CUA blocker; rerun after
  unlocking before claiming live UI acceptance for the inline-edit slice.

Update at 2026-05-09 19:57 AEST:
- The live flipdisc handoff verifier now writes a closer native-save fixture
  instead of accepting a pre-native payload. `writeHandoffFixture(...)` persists
  extension `mediaAttachments` as sibling `Loom-media-*` files, rewrites
  `loom://media/<tmpId>` references in both Markdown and CaptureAST to durable
  `loom://content/...` URLs, writes the JS-preserved snapshot from
  `captureReaderWithSnapshotPayload(...)`, and verifies the fixture without
  `--allow-transient-media`.
- Red/green evidence: `tests/capture-handoff-verifier.test.ts` first failed
  because the live verifier still allowed transient media and did not expose
  fixture media rewriting, then passed 5/5 after the fixture writer was
  tightened.
- Live evidence: `npm run verify:flipdisc-live-handoff` passed against
  `https://flipdisc.io/` with `segmentDiagramCount: 1`, a timestamp-matched
  `Loom-snapshot-20260509-095702-c2b6a86a54ba.html`, seven
  `Loom-media-*` sidecars, and `unresolvedMediaReferences: []`. The only
  remaining warning is the intentional flat frame fallback in Markdown; the
  CaptureAST sidecar still carries the structured segment diagram.

## Important Nuance

`npm run verify:flipdisc-live-handoff` shows that the raw markdown body can still contain:

```text
0x80 0x83 0x01 imageData 0x8F
```

That is acceptable only when the CaptureAST sidecar is present and the reader replaces that source fallback row with the segment diagram. The user-visible reader must not present the flat row as if structure was preserved.

## Next Action

Continue with the post-Phase-1 new-Loom work: run the compatibility-route
deletion-candidate review only when replacement evidence is complete, and deepen
the Collect / Organize / Draft loop without regressing the verified capture
handoff, local-file intake, or confirmed capture deletion.

Update at 2026-05-09 20:03 AEST:
- Phase 6 whole-corpus Draft AI now has a first retrieval-backed prompt-context
  slice. Web Draft loads `fetchSearchIndex()` before compose and inline edit,
  maps stored index fields into corpus docs, skips references already attached
  to the draft, scores relevant source titles/categories/paths/body text, and
  passes selected lines through `Corpus context:`. Native Draft adds
  `LoomDraftCorpusContext`, queries `LoomEmbeddingStore.similarAcrossAllRoots`,
  and passes similar hits into `LoomDraftAIPrompt.buildDraftAIPrompt(...)`.
- This is not full corpus-wide `@` autocomplete, general `⌘L` corpus chat, or
  rich artifact-state retrieval. It is the minimum real default corpus context
  needed before Draft AI composes.
- Red/green evidence: the focused TypeScript draft-storage test first failed on
  missing `selectDraftCorpusHits`, the skeleton contract first failed on
  missing `NewLoomDraftCorpusHit`, and the selected Swift prompt test first
  failed because `LoomDraftCorpusHit` / `corpusHits` did not exist. After the
  change, `tests/new-loom-draft-storage.test.ts` passed 18/18,
  `tests/new-loom-skeleton-contract.test.ts` passed 59/59, and the selected
  Swift corpus prompt test passed 1/1.
- Wider verification after the docs update: `npm run test:contracts` passed
  452/452, full `LoomDraftStoreTests` passed 17/17, `npm run typecheck` exited
  0, and `git diff --check && git diff --cached --check` exited 0.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  630 bundled static web files; `npm run app:where` reported
  `2026-05-09T10:06:28.427Z`; installed native binary strings include
  `Corpus context:` and `No corpus context selected.`; the installed web Draft
  chunk also contains the corpus-context prompt path.
- Computer Use acceptance at 2026-05-09 20:07 AEST read the installed
  `com.yinyiping.loom` process from `/Users/yinyiping/Applications/Loom.app`.
  It first saw the native Draft surface with `Continue with AI`, `Edit
  selection`, and the existing Flipdisc/ECON references, then navigated to
  Organize and saw Recent captures with visible `DRAFT` plus red `DELETE`
  controls for each capture row. No destructive delete action was clicked.
- Flipdisc recheck after install: `npm run verify:capture-handoff` passed
  against the saved installed-container `flipdisc.io` capture
  `Loom-capture-ast-20260509-195026-2c01fa19e547.json`, with
  `segmentDiagramCount: 1`, `interactiveArtifactCount: 2`, and
  `unresolvedMediaReferences: []`. `npm run verify:flipdisc-live-handoff`
  passed against `https://flipdisc.io/`, produced a fresh handoff fixture with
  seven `Loom-media-*` sidecars, `segmentDiagramCount: 1`, and
  `unresolvedMediaReferences: []`. The remaining warning is still the raw
  Markdown flat-frame fallback; reader correctness depends on the CaptureAST
  sidecar rendering the structured `Frame Format` segment diagram.

Update at 2026-05-09 20:13 AEST:
- Phase 6 `@` references now resolve beyond manually attached Draft
  references. Web `draftInlineReferencePromptLines(...)` accepts selected corpus
  hits and, after attached-reference matching fails, resolves `@target` against
  corpus title/href/category/sourcePath aliases. Prompt lines now carry
  `source=Corpus: ...`, href, category, and sourcePath. Native
  `LoomDraftInlineReferenceParser.promptLines(...)` mirrors the same behavior,
  and native inline edit now passes `LoomDraftCorpusContext.similarHits(...)`
  into the inline-reference prompt path.
- This closes one prompt-context part of corpus-wide `@` search. It still does
  not provide the visual `@` autocomplete picker, ranking UI, or explicit
  source insertion workflow.
- Red/green evidence: `tests/new-loom-draft-storage.test.ts` first failed
  because `@flipdisc-tutorial` and `@moodle-econ-w4-slides` stayed
  `source=unattached`; `tests/new-loom-skeleton-contract.test.ts` first failed
  on missing `findInlineReferenceCorpusMatch`; the selected Swift test first
  failed because `LoomDraftCorpusHit` had no `sourcePath` and inline references
  did not resolve corpus hits. After implementation, the focused TS draft
  storage suite passed 18/18, the skeleton contract passed 59/59, and the
  selected Swift corpus-inline-reference test passed 1/1.
- Wider verification after the implementation: `npm run test:contracts` passed
  452/452, full `LoomDraftStoreTests` passed 18/18, `npm run typecheck` exited
  0, and `git diff --check && git diff --cached --check` exited 0.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 630 bundled static web files; `npm run
  app:where` reported `2026-05-09T10:16:40.929Z`. Installed native strings
  contain `Corpus context:` and `corpus-resolved inline references`; the
  installed web Draft chunk contains `Corpus context:`, `corpusHits`,
  `source=Corpus`, and `sourcePath=`.
- The previously running Loom process was older than the install, so it was
  relaunched before UI acceptance. Computer Use then read the new installed
  process `pid 42206`, started at `2026-05-09 20:17:29 AEST`, with Organize
  showing the latest Flipdisc capture and visible Delete buttons for Recent
  captures, and Draft opening with the Flipdisc reference plus AI draft/edit
  controls. No destructive delete action was clicked.

Update at 2026-05-09 20:26 AEST:
- Phase 6 `@` references now have a first visible insertion workflow instead of
  only prompt-context resolution. Web Draft exposes an `@ Reference` search
  picker backed by the staged source index, inserts a stable token such as
  `@flipdisc-tutorial` at the current selection, and attaches the selected
  source reference. Native Draft mirrors the same token/reference mapping with a
  `Reference` sheet that reuses `DocReferencePicker`.
- This closes the first explicit source-insertion gap, but it is still not the
  full inline autocomplete/ranking UI that opens automatically while typing
  `@`.
- Red/green evidence: the focused TS draft-storage test first failed because
  `draftReferenceMentionToken(...)` did not exist, the skeleton contract first
  failed on the missing picker/search symbols, and the selected Swift test first
  failed because `LoomDraftReferenceMention` did not exist. After
  implementation, `tests/new-loom-draft-storage.test.ts` passed 18/18,
  `tests/new-loom-skeleton-contract.test.ts` passed 59/59, and the selected
  Swift insertion test passed 1/1.
- Wider verification before install: `npm run test:contracts` passed 452/452,
  full `LoomDraftStoreTests` passed 19/19, `npm run typecheck` exited 0, and
  both diff whitespace checks exited 0.

Update at 2026-05-09 20:36 AEST:
- Computer Use acceptance found a real native gap after the 20:29 install:
  Draft showed the `Reference` button and sheet, but the candidate list was
  empty because `DocReferencePicker` used `URLSession` to load
  `loom://bundle/search-index.json`. That scheme is a WKWebView route, not the
  correct native SwiftUI file-loading path.
- The native picker now loads the bundle index through `LoomLocalResourceLoader`
  via `AskAIDocReferenceIndex`. A new Swift regression test first failed on the
  missing `AskAIDocReferenceIndex`, then passed once the picker used the native
  resource loader.
- Verification after the fix: selected Swift regression 1/1,
  `npm run test:contracts` 452/452, `npm run typecheck`, full
  `LoomDraftStoreTests` 20/20, and diff whitespace checks all passed.
- Installed evidence after reinstall: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T10:35:07.503Z`; installed strings include
  `LoomLocalResourceLoader` and `Search docs to reference`.
- Computer Use then read the relaunched installed app process `pid 55498`,
  started at `2026-05-09 20:35:40 AEST`. Draft opened with the `Reference`
  button; the sheet loaded search-index candidates; selecting `15 · Multimodal`
  inserted `@multimodal` into the draft body and added `Source 15 · Multimodal`
  to the References column. No delete action was clicked.

Update at 2026-05-09 20:48 AEST:
- Phase 6 `@` references now have the first inline autocomplete/ranking slice
  beyond explicit search-and-insert. Web Draft detects an active `@query` at
  the textarea cursor, opens the ranked candidate surface, filters out
  already-attached references, and replaces the active query span with the
  selected stable `@token` while attaching the selected source reference.
- Native Draft mirrors the behavior with `LoomDraftReferenceMention.activeQuery`
  and `rank`, preloads the bundle search index through
  `AskAIDocReferenceIndex`, and renders a ranked inline candidate panel under
  the editor while typing `@`.
- Red/green evidence: focused TS draft-storage first failed on missing
  `activeDraftReferenceMention` / `rankDraftReferenceCandidates`; selected
  Swift first failed on missing `activeQuery` / `rank`. After implementation,
  `tests/new-loom-draft-storage.test.ts` passed 20/20, selected Swift passed
  1/1, full `LoomDraftStoreTests` passed 21/21, `npm run typecheck` exited 0,
  and `tests/new-loom-skeleton-contract.test.ts` passed 59/59 after the
  contract matched the actual wrapper call path.

Update at 2026-05-09 20:53 AEST:
- Installed-app verification for the inline `@` autocomplete/ranking slice
  passed after rebuild. `npm run app:user` installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 630 bundled static web files; `npm run
  app:where` reported `2026-05-09T10:51:12.742Z`; and diff whitespace checks
  still passed.
- The stale pre-install Loom process was relaunched before UI acceptance.
  Computer Use read installed process `pid 62626`, started at
  `2026-05-09 20:51:44 AEST`. Organize showed visible `DELETE` buttons on
  Recent captures; no delete action was clicked.
- Native Draft acceptance passed: typing a temporary `@fl` query surfaced the
  `Reference autocomplete` panel with ranked candidates including
  `FlashAttention`, `FSDP & ZeRO`, and `Reflexion`. The temporary query was
  removed afterward and the draft returned to the original saved body.

Update at 2026-05-09 21:11 AEST:
- Fresh flipdisc acceptance found the captured content itself is usable, but the
  local source folder had accumulated stale capture sidecars from repeated
  recaptures. `CapturesIndex.delete(_:)` now removes only sidecars owned by the
  deleted markdown block: safe `Loom-capture-ast-*.json`,
  timestamp-matched `Loom-snapshot-*.html`, and `Loom-media-*` files that are
  no longer referenced by the remaining markdown. Shared media references and
  unrelated snapshots are preserved.
- Red/green evidence: the selected Swift regression
  `testDeletingCaptureRemovesOnlyOwnedSidecarFiles` first failed because the
  owned AST, snapshot, and media files still existed after delete; after the
  cleanup implementation the selected test passed 1/1.
- Wider verification after the cleanup: `tests/new-loom-skeleton-contract` 59/59,
  `tests/knowledge-home-source-library` 22/22,
  `tests/captures-landing-refresh-contract` 11/11,
  `tests/capture-media-contract` 47/47, full `CapturePlacementTests` 3/3,
  `npm run test:contracts` 455/455, `npm run typecheck`, and both diff
  whitespace checks passed.
- No destructive installed-app delete was clicked during acceptance. The UI can
  show Delete controls, but real deletion of user captures still requires an
  explicit user-confirmed action.
- Installed evidence after reinstall: `npm run app:user` installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T11:14:46.284Z`; the stale process was relaunched and Computer Use
  read installed process `pid 72096`. Source Index showed 4 captures and visible
  Delete controls. Opening the Flipdisc capture showed 2,245 words / 10m read,
  article structure, media, video placeholders, and the `Frame Format` captured
  structure. Opening Source Snapshot loaded the saved snapshot DOM/AX tree with
  JS-preserved status, though the visual iframe still needs follow-up if
  snapshot display fidelity is part of the next acceptance gate.
- Live handoff evidence after that install: `npm run verify:flipdisc-live-handoff`
  passed at `2026-05-09T11:17:41.918Z` with 70 blocks,
  `interactiveArtifactCount: 2`, `comparisonSliderCount: 1`,
  `segmentDiagramCount: 1`, 7 persisted media sidecars, and
  `unresolvedMediaReferences: []`.

Update at 2026-05-09 21:29 AEST:
- Flipdisc source snapshot acceptance moved one step further. The snapshot
  renderer now injects a viewer-owned cleanup style into full-source snapshots
  so saved pages cannot expose the extension's `Capture this page to Loom`
  floating control inside the evidence layer. JS-preserved snapshots also get a
  conservative iframe height fallback when parent-side measurement is blocked by
  the sandbox.
- Red/green evidence: the new snapshot renderer regression in
  `tests/capture-render-debug-artifacts.test.ts` first covered preserved-JS
  inspectability without host DOM access. After implementation,
  `tests/capture-render-debug-artifacts.test.ts` passed 10/10,
  `tests/capture-media-contract.test.ts` passed 47/47, `npm run typecheck`
  exited 0, both diff whitespace checks passed, and `npm run test:contracts`
  passed 456/456.
- Installed-app evidence after rebuild: `npm run app:user` installed
  `/Users/yinyiping/Applications/Loom.app`; post-install `npm run app:smoke`
  passed with 630 bundled static web files; `npm run app:where` reported
  `2026-05-09T11:27:56.014Z`. The stale process was quit and the installed app
  relaunched as `pid 76683`. Computer Use read Source Index with visible Delete
  buttons, opened the Flipdisc reader with 2,245 words / 10m read and the
  structured `Frame Format`, then opened Source Snapshot with the full DOM/AX
  content and no leftover `Capture this page to Loom` button.
- Live handoff recheck passed at `2026-05-09T11:28:19.536Z`: 70 blocks,
  `interactiveArtifactCount: 2`, `comparisonSliderCount: 1`,
  `segmentDiagramCount: 1`, 7 media sidecars, and
  `unresolvedMediaReferences: []`. Remaining follow-up: the first visual
  viewport of this dynamic WebGL/canvas page can still look dark in snapshot
  screenshots; full visual fidelity needs an extension-side bitmap fallback for
  the initial dynamic canvas/hero, not just reader/snapshot DOM cleanup.

Update at 2026-05-09 21:39 AEST:
- Root cause for the remaining Flipdisc snapshot visual gap was extension-side:
  the live first hero canvas can return a successful but blank direct
  `canvas.toDataURL()` readback, so the previous snapshot fallback skipped the
  most important dynamic canvas frame.
- The extension snapshot path now keeps the direct canvas bitmap fallback first
  and then falls back to a visible-tab crop when the direct canvas bitmap is
  blank or unavailable. The visible-tab fallback scrolls the canvas into view,
  waits for paint/dynamic canvas activity, asks the background script for
  `capture-visible-tab`, crops the current viewport image to the canvas rect,
  and bakes the JPEG crop into the cloned snapshot canvas.
- Red/green evidence: `tests/capture-media-contract.test.ts` first failed on
  the missing async visible-tab canvas fallback contract, then passed after the
  implementation. Focused gates passed:
  `tests/capture-media-contract.test.ts` 48/48 and
  `tests/capture-render-debug-artifacts.test.ts` 10/10.
- Live verification passed with the source extension:
  `npm run verify:flipdisc-live-handoff -- --source-extension
  --verify-handoff-fixture` passed at `2026-05-09T11:36:14.924Z`, and the
  fixture verifier passed at `2026-05-09T11:36:27.897Z` with 70 blocks, 2
  interactive artifacts, 1 comparison slider, 1 segment diagram, 7 media
  sidecars, and `unresolvedMediaReferences: []`. The expected headless warning
  remains because that canary deliberately disables browser visible-tab capture.
- A one-off Playwright proof wired `chrome.runtime.sendMessage({
  type: 'capture-visible-tab' })` to `page.screenshot()` on live
  `https://flipdisc.io/`; real DOM canvas fallback coverage increased from 3
  direct canvas bitmaps to all 5 live canvases, including the first hero canvas
  through the new JPEG crop fallback.
- Wider gates passed after the fix: `npm run typecheck`, `npm run
  test:contracts` 457/457, `git diff --check`, `git diff --cached --check`,
  `npm run app:user`, `npm run app:smoke`, `npm run app:where`, and
  `npm run app:check-extension`. The installed app is
  `/Users/yinyiping/Applications/Loom.app`, and Atlas reports extension version
  `1.4.9` loaded from `/Users/yinyiping/Library/Application
  Support/Loom/Atlas-Extension/extension`.
- Computer Use acceptance read the installed app process and opened the saved
  Flipdisc snapshot: the AX tree exposes the title, `flipdisc.io`, JS-preserved
  snapshot status, article body, YouTube iframe, contents list, Build/Software/
  Design sections, interactive text fields, slider, media/image placeholders,
  and source links. Returning to Source Index showed 4 captures and visible
  `DELETE` buttons on each Recent capture row. No destructive delete action was
  clicked. The snapshot detail view itself still does not expose a primary
  delete button, so delete remains an Organize-row operation for now.

Update at 2026-05-09 21:50 AEST:
- The remaining delete affordance gap from the Flipdisc acceptance screenshots
  is now closed for snapshot detail pages as well as Source Index rows.
  `app/loom-render/snapshot/page.tsx` now exposes a destructive `Delete`
  action in the snapshot toolbar, uses two-step inline confirmation (`Delete`
  -> `Delete now` + `Cancel`), posts the same `rootID`, `subPath`, `title`, and
  `eyebrow` payload to the existing `loomCaptureDelete` native bridge, and
  returns to `/sources` after confirmation. It does not use `window.confirm`.
- Red/green evidence: `tests/capture-render-debug-artifacts.test.ts` first
  failed on the missing snapshot-detail delete state and bridge call, then
  passed after implementation. Focused verification passed:
  `tests/capture-render-debug-artifacts.test.ts` 11/11 and the combined
  new-Loom/source/snapshot slice 92/92.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  458/458, `git diff --check`, and `git diff --cached --check`.
- Installed evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T11:48:16.532Z`; `npm run app:check-extension` passed for Atlas
  extension version `1.4.9`.
- Computer Use acceptance relaunched the installed app as pid `82868` from
  `/Users/yinyiping/Applications/Loom.app`. Source Index still showed 4
  captures. Opening the Flipdisc reader and then `Open source snapshot` showed
  the snapshot toolbar with `Delete capture`; clicking it changed the controls
  to `Delete capture now` and `Cancel`. `Cancel` restored the normal `Delete
  capture` state. Returning to Source Index still showed 4 captures, proving no
  destructive delete was clicked.

Update at 2026-05-09 21:58 AEST:
- Phase 6 `⌘K inline edit` now has a reviewable line-level diff preview before
  acceptance. Web Draft exports `draftInlineEditDiffHunks(...)`, renders a
  `Diff preview` with removed / added / unchanged rows in the `AI edit` panel,
  and still mutates the body only after `Accept edit`. Native Draft mirrors the
  same `LoomDraftInlineEdit.diffHunks(...)` contract and renders the preview in
  the Swift `AI edit` surface.
- Red/green evidence: `tests/new-loom-draft-storage.test.ts` first failed
  because `draftInlineEditDiffHunks` did not exist; the skeleton contract first
  failed on the missing exported diff type/function; and the selected Swift
  test first failed because `LoomDraftInlineEdit.diffHunks` /
  `LoomDraftInlineEditDiffHunk` did not exist. After implementation, focused
  gates passed: `tests/new-loom-draft-storage.test.ts` 22/22,
  `tests/new-loom-skeleton-contract.test.ts` 59/59, selected Swift diff test
  1/1, full `LoomDraftStoreTests` 23/23, `npm run test:contracts` 459/459,
  `npm run typecheck`, and both diff whitespace checks.
- This closes the immediate "AI suggestion has no diff review" gap for the
  current inline-edit slice. It does not complete full ThinkingDraft composer
  modelling, multi-block operations, or the broader new-Loom objective.

Installed-app evidence at 2026-05-09 22:02 AEST:
- `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T12:00:42.116Z`; `npm run app:check-extension` passed for Atlas
  extension version `1.4.9`.
- Installed bundle checks found the new web Draft chunk containing
  `Diff preview` / inline diff code and the Swift binary containing
  `LoomDraftInlineEditDiffHunk`, proving both web and native diff-preview code
  shipped into the installed app.
- The stale pre-install process was quit, and `/Users/yinyiping/Applications/Loom.app`
  was relaunched as pid `89060`. Computer Use read the installed Source Index
  with 4 captures and visible Delete controls, then opened Draft and read the
  native Draft surface with references, `AI edit`, `Edit selection`, `AI draft`,
  `Reference`, `Save draft`, and `Draft board`. Clicking `Edit selection`
  without a selection produced the local `Select text first.` validation. A live
  AI-generated `Diff preview` was not forced because that would send selected
  draft text to the configured AI provider; the preview itself is covered by the
  red/green tests and installed bundle string evidence above.

Update at 2026-05-09 22:15 AEST:
- Phase 6 Draft now has the first `ThinkingDraft` block model instead of only a
  single undifferentiated body string. Web `lib/new-loom/draft-storage.ts`
  exports `NewLoomDraftBlockKind`, `NewLoomDraftBlock`,
  `draftBlocksFromBody(...)`, and `applyDraftBlockEdit(...)`. The splitter
  produces stable reviewable block ids, classifies heading / paragraph / quote /
  list / fenced-code blocks, records source offsets and word counts, attaches
  matching reference hrefs, and applies a block edit only when the reviewed
  original block still matches.
- Web `/draft` renders a `Draft structure` panel from those blocks. Native
  Draft mirrors the same model with `LoomThinkingDraftBlock` and
  `LoomThinkingDraft.blocks(...)` / `.applyBlockEdit(...)`, and renders a
  native `Draft structure` side panel before References. This is a structural
  review layer for current Draft content, not the full future multi-block
  composer or cross-block AI operation system.
- Red/green evidence: the TS storage test first failed because
  `draftBlocksFromBody` / `applyDraftBlockEdit` did not exist; the skeleton
  contract first failed on the missing exported ThinkingDraft model; and the
  selected Swift test first failed because `LoomThinkingDraft` did not exist.
  After implementation, focused gates passed: `tests/new-loom-draft-storage.test.ts`
  24/24, `tests/new-loom-skeleton-contract.test.ts` 60/60, selected Swift
  ThinkingDraft tests 2/2, full `LoomDraftStoreTests` 25/25, `npm run
  test:contracts` 462/462, `npm run typecheck`, and both diff whitespace
  checks.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T12:18:06.797Z`; and `npm run app:check-extension` passed for
  Atlas extension version `1.4.9`. The stale process was quit and the installed
  app relaunched as pid `95992`. Computer Use verified Source Index first, then
  opened Draft and read the native right panel: `Draft structure`, a
  `PARAGRAPH` block for the saved draft body, `6 words`, References, and Draft
  board are visible in the installed app.

Update at 2026-05-09 22:25 AEST:
- Phase 7 now has the first durable Pursuit container data layer. Web
  `lib/new-loom/pursuit-container.ts` exports the `pursuits/<slug>/` artifact
  builder, stable slugging, and literal weight mapping. Native
  `LoomPursuitContainerBuilder` mirrors the same contract from a
  `LoomPursuit`, producing `Loom.md`, `Loom-cites.json`, and
  `Loom-meta.json` files.
- The builder preserves the current draft body, stores reference targets in
  cites JSON, and maps old `season` values into Phase 7 weights:
  `held -> wintering`, `retired -> archived`, and active/waiting/contradicted
  states into `active`. This is a durable artifact shape, not yet the real
  persisted write path or visible shelf UI.
- Red/green evidence: `tests/new-loom-pursuit-container.test.ts` first failed
  because `lib/new-loom/pursuit-container` did not exist, and the selected
  Swift test first failed because `LoomPursuitContainerBuilder` did not exist.
  After implementation, the focused TS pursuit test passed 2/2, the focused
  skeleton + pursuit run passed 62/62, the selected Swift container test
  passed 1/1, and full `PursuitSpawnerTests` passed 8/8.

Update at 2026-05-09 22:30 AEST:
- Phase 7 pursuit containers now have an explicit native persisted write path.
  `LoomPursuitContainerWriter.persist(...)` writes the built container under a
  provided user-data root, creates `pursuits/<slug>/`, and atomically writes
  `Loom.md`, `Loom-cites.json`, and `Loom-meta.json` as UTF-8 files. It rejects
  absolute, empty, `.` and `..` relative path components before writing.
- Red/green evidence: `PursuitSpawnerTests.testPursuitContainerWriterPersistsPhase7FilesUnderUserDataRoot`
  first failed because `LoomPursuitContainerWriter` did not exist. After the
  writer was added, the same selected Swift test passed 1/1 and read the three
  files back from a temporary root.
- This moves Phase 7 from in-memory artifact shape to a real native file write
  primitive. It still does not complete visible shelf UI or automatic
  synchronization from every existing `LoomPursuitWriter` mutation.

Update at 2026-05-09 22:32 AEST:
- Native pursuit create and season changes now best-effort sync the Phase 7
  container files under the user-data root. `LoomPursuitWriter.createPursuit`
  writes the initial `pursuits/<slug>/Loom.md`, `Loom-cites.json`, and
  `Loom-meta.json` after the SwiftData save succeeds; `updateSeason` rewrites
  the same container so `held` becomes `wintering` in meta.
- Red/green evidence: `PursuitSpawnerTests.testPursuitWriterSyncsPhase7ContainerOnCreateAndSeasonChange`
  first failed because `createPursuit` and `updateSeason` did not accept a
  `containerRootURL`. After implementation, the selected Swift test passed 1/1
  and read the created and season-updated meta files from a temporary root.
- This is still not full mutation sync: `updateWeight`, `attachSource`,
  `attachPanel`, and delete cleanup remain open, and there is still no visible
  "deep shelf" UI.

Verification after the 22:32 slice:
- Full Swift `PursuitSpawnerTests` passed 10/10 with
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... -only-testing:LoomTests/PursuitSpawnerTests test`.
- Focused TS pursuit + skeleton contracts passed 62/62.
- `npm run test:contracts` passed 464/464.
- `npm run typecheck`, `git diff --check`, and `git diff --cached --check`
  passed.

Update at 2026-05-09 22:38 AEST:
- Phase 7 native container sync now covers the rest of the current
  `LoomPursuitWriter` mutation surface: `updateWeight`, `attachSource`,
  `attachPanel`, and `delete`. Weight changes rewrite the container, source
  attachments add stable ID-based `source` references to `Loom-cites.json`,
  panel attachments add stable `artifact-state` references, and delete removes
  the matching `pursuits/<slug>/` directory.
- Red/green evidence:
  `PursuitSpawnerTests.testPursuitWriterSyncsPhase7ContainerOnWeightAttachmentsAndDelete`
  first failed because those writer methods did not accept `containerRootURL`.
  After implementation, the selected test passed 1/1 and verified meta rewrite,
  source cite, artifact-state cite, and container-directory cleanup.
- Phase 7 now has a first visible web Organize surface. `KnowledgeHomeClient`
  reads `loadPursuitRecords()`, subscribes to
  `subscribeLoomMirror(PURSUIT_RECORDS_KEY, 'loom-pursuits-updated', ...)`,
  filters hidden records, maps seasons into literal
  `active / wintering / archived` state, and passes `pursuitContainers` into
  Source Index. `KnowledgeHomeStatic` renders a `Question containers` current
  work panel linking to `/pursuit/<id>` without re-promoting `/pursuits` as a
  primary route.
- Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
  failed on the missing pursuit-record import, Source Index panel, and rendered
  question-container row; after implementation the same file passed 23/23.
- Remaining Phase 7 gap is now primarily enrichment/acceptance level:
  attachment cite enrichment still uses stable IDs rather than fully resolved
  source/panel titles and open URLs, and the visible question-container panel
  has not yet been reinstalled and checked in the live installed app.

Update at 2026-05-09 22:55 AEST:
- Phase 7 visible Organize work is now present in the installed native app, not
  only the web `/sources` route. `LoomLibraryView` reads
  `LoomPursuitWriter.allPursuits()`, filters `PursuitHideStore.readAll()`, maps
  old pursuit seasons into `active / wintering / archived`, and renders a
  literal `Question containers` work column that routes rows to
  `/pursuit/<id>`.
- Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
  failed on the missing native state, loader, notification subscription, and
  panel strings. After implementation the file passed 23/23.
- Wider verification passed: `npm run typecheck`; focused
  `tests/new-loom-skeleton-contract.test.ts` +
  `tests/knowledge-home-source-library.test.tsx` passed 83/83;
  `npm run test:contracts` passed 465/465; Debug macOS
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` passed; Release
  `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T12:54:19.373Z`.
- Installed-app Computer Use acceptance passed after quitting stale pid `9884`
  and relaunching the installed app as pid `13703`. The Source Index showed
  Collect / Organize / Draft, Recent captures with visible `DRAFT` and
  `Delete` controls, Local files, Reader notes, and the new
  `QUESTION CONTAINERS` panel with `No question containers yet.` for the
  current empty user data.
- Remaining Phase 7 gap: cite enrichment still uses stable source/panel ids
  rather than fully resolved source titles, panel titles, and open URLs inside
  `Loom-cites.json`.

Update at 2026-05-09 23:02 AEST:
- Phase 7 cite enrichment now resolves attached sources and panels into
  readable/openable `Loom-cites.json` entries when context exists. Source cites
  read `LoomTrace` context for `sourceTitle`, `sourceHref`, and
  `currentSummary`; panel cites read `LoomPanel` titles and use the linked
  source capture URL with a panel fragment. Stable ID-based source and
  `loom://artifact-state/<id>` hrefs remain the fallback when trace/panel
  context is unavailable.
- Red/green evidence:
  `PursuitSpawnerTests.testPursuitWriterSyncsPhase7ContainerOnWeightAttachmentsAndDelete`
  first failed on the new readable Flipdisc source title, excerpt, capture URL,
  panel title, and `#frame-format` panel href assertions. After implementation,
  the selected test passed 1/1.
- Wider verification passed after the cite enrichment: full Swift
  `PursuitSpawnerTests` 11/11; focused new-Loom/source contracts 85/85;
  `npm run typecheck`; `npm run test:contracts` 465/465; and Debug macOS
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` with `** BUILD SUCCEEDED **`.
  Release `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
  bundled static web files; `npm run app:where` reported
  `2026-05-09T13:04:19.199Z`.
- Installed-app Computer Use acceptance was rerun after quitting the stale
  installed process and reopening `/Users/yinyiping/Applications/Loom.app` as
  pid `18592`. Source Index loaded in Organize with Recent captures
  `DRAFT/Delete` controls and the visible `QUESTION CONTAINERS` panel. Current
  user data still has no visible question containers, so the panel reads
  `No question containers yet.`.
- Remaining Phase 7 risk is no longer ID-only cites. The open work is broader:
  real user-data pursuit rows need product acceptance when records exist, and
  the future deep shelf/body editing path still has to decide how
  `pursuits/<slug>/Loom.md` receives the user's evolving draft content.

Update at 2026-05-09 23:14 AEST:
- Phase 7 container sync now preserves an existing durable
  `pursuits/<slug>/Loom.md` body during metadata and cite rewrites. Before this
  slice, `syncPhase7Container(...)` rebuilt the markdown with an empty body, so
  a user-authored/deep-shelf body could be erased by `updateWeight`,
  `attachSource`, or `attachPanel`. `LoomPursuitWriter` now reads the existing
  markdown, removes the top-level title via
  `LoomPursuitContainerBuilder.body(fromMarkdown:)`, and passes that body into
  the rebuilt container.
- Red/green evidence:
  `PursuitSpawnerTests.testPursuitWriterPreservesEditedPhase7MarkdownBodyWhenSyncingMetadata`
  first failed with actual markdown `# 2026 Flipdisc Display\n` after a weight
  update. After implementation and the explicit trailing-newline expectation
  fix, the selected test passed 1/1 and full Swift `PursuitSpawnerTests`
  passed 12/12.
- Wider verification for this slice passed so far: focused new-Loom/source
  contracts 85/85, `npm run typecheck`, and `npm run test:contracts` 465/465.
- Remaining Phase 7 risk is now narrower: real user-data question-container
  rows still need installed-app/product acceptance when records exist, and the
  future editor/deep-shelf surface must intentionally author the body. Metadata
  sync no longer clobbers an existing `Loom.md` body.

Update at 2026-05-09 23:32 AEST:
- The installed Source Index question-container empty state now has a direct
  in-panel `Add Question` affordance. `LoomLibraryView` posts the shared
  `.loomShowHoldQuestionDialog` notification from the `QUESTION CONTAINERS`
  work column, and `LoomMinimalRootView` owns the matching
  `HoldQuestionSheet` state so the current installed root responds to that
  notification.
- Computer Use first caught the stale-process risk: pid `25128` was started
  before the latest install and clicking `Add Question` did not open a sheet.
  After quitting that stale process and relaunching
  `/Users/yinyiping/Applications/Loom.app` as pid `28088`, Computer Use
  verified the installed app opens the native `Add Question` sheet with the
  question text field, Weight picker, Cancel, and disabled Save button. Cancel
  returned to Source Index with `No question containers yet.`, so no user
  record was created.
- Earlier red/green for this slice: `tests/knowledge-home-source-library.test.tsx`
  first failed on the missing native Add Question affordance and then on the
  missing minimal-root sheet wiring; after implementation the focused source
  library contract passed 23/23, focused new-Loom/source/pursuit contracts
  passed 85/85, `npm run typecheck`, `npm run test:contracts` 465/465, Debug
  macOS build, `npm run app:user`, `npm run app:smoke`, `npm run app:where`,
  and `npm run app:check-extension` all passed before the installed CUA check.
- Remaining Phase 7 work is now the real product row/editor path: create or
  accept a question container only with explicit user approval, then verify the
  visible row and deep shelf/body editing behavior against user data.

Update at 2026-05-09 23:40 AEST:
- Phase 7 now has the first intentional detail/deep-shelf body editor path for
  durable question containers. Native pursuit payloads include
  `containerBody` and `containerPath`; the direct `PursuitDetailClient`
  fallback renders a `Question notes` editor and `Save question notes` action;
  and the native bridge handles `updatePursuitBody` by calling
  `LoomPursuitWriter.updateBody(...)`. The writer rewrites
  `pursuits/<slug>/Loom.md` with the existing top-level title plus the edited
  body, and `phase7Body(...)` reads the durable body back without the heading.
- Red/green evidence: `tests/pursuit-detail-contract.test.ts` first failed on
  missing `containerBody` support, and the selected Swift test first failed
  because `LoomPursuitWriter.updateBody` / `phase7Body` did not exist. After
  implementation, `npx tsx --test tests/pursuit-detail-contract.test.ts`
  passed 4/4, the selected Swift body-update test passed 1/1, full Swift
  `PursuitSpawnerTests` passed 13/13, focused
  pursuit/source/new-Loom contracts passed 89/89, `npm run typecheck` exited
  0, `npm run test:contracts` passed 466/466, and both diff whitespace checks
  passed.
- Installed-app row acceptance is still intentionally not claimed for this
  editor path because the current user data has no visible question-container
  row, and creating a temporary user-data record requires explicit approval.
  The non-mutating installed acceptance for the empty-state `Add Question`
  sheet remains the latest live CUA evidence.

Update at 2026-05-09 23:44 AEST:
- The current checkout was rebuilt and installed after the detail-editor and
  documentation updates. `npm run app:user` completed with `** BUILD SUCCEEDED
  **` and installed `~/Applications/Loom.app`; `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 630 static web files; `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app 2026-05-09T13:43:10.013Z`; and
  `npm run app:check-extension` passed with Atlas extension version `1.4.9`.
- The installed app was quit and relaunched from that bundle as pid `33233`.
  Computer Use read the live installed Source Index with 4 captures, visible
  per-row `DRAFT` and `Delete` controls, Local files, Reader notes,
  `QUESTION CONTAINERS`, `Add Question`, and `No question containers yet.`
- Computer Use clicked `Add Question`, verified the native sheet with question
  text field, Weight picker, Cancel, and disabled Save, then clicked Cancel.
  Source Index returned to `No question containers yet.`, so this acceptance
  did not create or delete user data. The real row/body-save installed
  acceptance remains gated on explicit approval to create a temporary question.

Update at 2026-05-09 23:52 AEST:
- Phase 9 `Discipline.md` now has a first in-app support surface at
  `/discipline`. The route is classified as support, not primary or legacy,
  and the page records the six literal product refusals: no telemetry, no
  notifications, AI only appears when asked, no home feed, flow can fade, and
  no automatic full-file upload.
- `/system` and `/help` now link to `/discipline`, so the support document is
  reachable from the current product explanation path without promoting it as
  a first-level Collect / Organize / Draft destination.
- Red/green evidence: the new skeleton contract first failed on
  `/discipline should be a support route`; after adding the route, page, and
  links, `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  --test-name-pattern "discipline"` passed the full file, 61/61.
- Final verification for this slice: `npx tsx --test
  tests/new-loom-skeleton-contract.test.ts` passed 61/61; `npm run
  typecheck` exited 0; `npm run test:contracts` passed 467/467; and both
  `git diff --check` and `git diff --cached --check` passed.

Update at 2026-05-10 00:15 AEST:
- Current `https://flipdisc.io/` status: the installed Source Index lists the
  latest Flipdisc capture with readable `Origin: Web`, `DRAFT`, and `Delete`
  controls. Computer Use opened that capture in the installed app and the
  reader showed source `flipdisc.io`, `Open original`, `Re-capture`,
  `SOURCE SNAPSHOT`, YouTube/Vimeo provider entries, code sections, visual
  modules, `CAPTURED STRUCTURE`, and the expected frame tokens.
- The existing installed saved capture from `2026-05-09 19:50` passes
  `scripts/verify-capture-handoff.mjs` with `segmentDiagramCount: 1`,
  `comparisonSliderCount: 1`, 7 media attachments in diagnostics, no unresolved
  media references, and the full section spine through `Conclusion` /
  `Inspiration`. It still warns that saved markdown contains the old flat frame
  token line, so it is acceptable for current reading but not the desired shape
  for new exports.
- That strict gap is now fixed for new captures. The extension writes a
  `loom-interactive-artifact kind="segment-diagram"` marker instead of the flat
  `0x80 0x83 0x01 imageData 0x8F` markdown line; the reader inlines the
  matching CaptureAST artifact at that marker; and the live Flipdisc verifier
  now calls `verify-capture-handoff.mjs --strict-no-flat-frame`.
- Red/green evidence: `tests/capture-handoff-verifier.test.ts` first failed
  until the live verifier required `--strict-no-flat-frame`, and
  `tests/capture-media-contract.test.ts` first failed until the extension and
  reader marker path existed. After implementation, focused capture tests
  passed 53/53, `npm run typecheck` exited 0, and
  `node scripts/verify-flipdisc-live-extension.mjs --source-extension
  --verify-handoff-fixture` returned `ok: true`, `bodyHasFlatFrameLine: false`,
  `segmentDiagramCount: 1`, no handoff warnings, and no errors.

Update at 2026-05-10 00:25 AEST:
- Phase 9 `The Year` now has a first in-app support surface at `/year`. It is
  classified as support, not primary or legacy, so it does not disturb the
  Collect / Organize / Draft first-level route layer. The page renders a
  literal twelve-month strip plus a `wintering ribbon` for material that should
  rest without becoming a feed, score, or notification queue.
- `/system` and `/help` now link to `/year`, and `docs/loom.md` records this as
  the first The Year support-surface slice rather than the complete future
  calendar/state-machine implementation.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  on `/year should be a support route`; after adding the route classification,
  page, links, and docs status, the file passed 62/62.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  469/469, `git diff --check`, `git diff --cached --check`, a dev-server
  `curl http://localhost:3100/year` 200 check, Playwright text verification
  (`title: The Year · Loom`, 12 months, wintering ribbon, Question containers),
  and `npm run build` with `/year` statically generated among 101 pages.
- Installed-app verification also passed: `npm run app:user` rebuilt and
  installed `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke`
  passed with 629 static web files, `npm run app:where` reported
  `2026-05-09T14:28:23.150Z`, `npm run app:check-extension` passed with Atlas
  extension version `1.4.9`, the installed bundle contained
  `Contents/Resources/web/year.html` with `The Year` / `wintering ribbon`, and
  Computer Use confirmed the relaunched installed app opens to Source Index as
  pid `53282`.

Update at 2026-05-10 00:39 AEST:
- The Flipdisc Pixel Font Comparison live-capture gap was tightened. The
  renderer already supported `input-mirror` artifacts, but the live source page
  uses five synchronized text inputs instead of one input plus text output rows,
  so the staged extension still emitted `inputMirrorCount: 0`.
- The live Flipdisc verifier now treats that as a hard failure. Red evidence:
  `npm run verify:flipdisc-live-handoff` failed with `expected at least 1
  input-mirror artifact, got 0`.
- The extension now groups repeated same-value visible text controls as
  input-mirror output rows, preserving each row's label/style while rendering a
  single editable Loom control. After `npm run app:stage-extension`, Atlas still
  reports extension version `1.4.9` from the staged path.
- Green evidence: `node scripts/verify-flipdisc-live-extension.mjs
  --source-extension --verify-handoff-fixture` passed with
  `interactiveArtifactCount: 3`, `inputMirrorCount: 1`,
  `comparisonSliderCount: 1`, and `segmentDiagramCount: 1`; the default
  `npm run verify:flipdisc-live-handoff` also passed from
  `/Users/yinyiping/Library/Application Support/Loom/Atlas-Extension/extension/content.js`.
- Installed-app evidence followed: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`, `npm run
  app:where`, and `npm run app:check-extension` passed. Both the staged
  extension and installed bundle extension contain `inputMirrorControlOutputs`.
- Focused contracts also passed: `npx tsx --test
  tests/capture-media-contract.test.ts --test-name-pattern "structured
  interactive artifacts"` passed 48/48, and `npx tsx --test
  tests/capture-interactive-artifacts.test.ts --test-name-pattern
  "input-mirror"` passed 5/5.

Update at 2026-05-10 00:55 AEST:
- Phase 9 Wintering now has the first non-destructive state-machine slice
  instead of only `/year` prose. `lib/new-loom/wintering-state.ts` defines
  literal `active / wintering / archived` states for captures, local files, and
  question containers. Explicit state aliases such as `held` and `retired` win;
  otherwise captures/local files become `wintering` after 45 quiet days and
  `archived` after 365 quiet days.
- Web and native Source Index rows now surface non-active inferred states in
  capture/local-file metadata, and `/year` imports
  `NEW_LOOM_WINTERING_THRESHOLDS_DAYS` so the support page reflects the same
  rule instead of a disconnected copy block. This does not move, hide, or
  delete user files.
- Red/green evidence: `tests/new-loom-wintering-state.test.ts` first failed on
  missing `../lib/new-loom/wintering-state`; the Source Index contract then
  failed because stale capture/local-file rows did not show `wintering` /
  `archived`, and the Year contract failed because `/year` did not import the
  shared thresholds. After implementation, focused new-Loom/source contracts
  passed 90/90 and Debug macOS build passed with
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build`.
- Release install evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
  bundle id `com.yinyiping.loom` with 629 static web files; `npm run
  app:where` reported `2026-05-09T14:55:21.662Z`; and `npm run
  app:check-extension` passed with Atlas extension version `1.4.9`.
- Computer Use acceptance then quit the stale pre-install process and relaunched
  `/Users/yinyiping/Applications/Loom.app` as pid `64911`. The installed Source
  Index was readable with 4 captures, 0 local files, empty question containers,
  and visible capture `DRAFT` / `DELETE` controls. The current real records are
  not old enough to visibly exercise `wintering` / `archived` suffixes, so that
  state display remains covered by the render and native contracts above.

Update at 2026-05-10 01:06 AEST:
- Phase 10 `Working mode（公开版屏蔽私密）` now has a first web Source Index
  privacy slice. `lib/new-loom/public-working-mode.ts` resolves public working
  mode from `/sources?public=1`, `/sources?loom-public=1`,
  `/sources?working=public`, or `localStorage["loom.publicWorkingMode"] =
  "1"`.
- In that mode, `KnowledgeHomeStatic` projects Source Index data through public
  labels: source groups, source rows, captures, local files, reader notes,
  drafts, and question containers preserve counts/status/origin class but no
  longer render private labels, local paths, capture domains, note excerpts, or
  question text. Row-level Draft/Delete/group mutation actions are disabled.
- Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
  failed because public mode still rendered `UNSW Courses`, private capture
  titles, `file:///Users/...`, Draft links, and Delete buttons; the new public
  mode resolver test first failed on the missing
  `../lib/new-loom/public-working-mode` module. After implementation, the
  focused public/source contract passed 28/28.

Update at 2026-05-10 01:11 AEST:
- Full verification for the public-working slice passed: `npm run typecheck`,
  `npm run test:contracts` (476/476), and `git diff --check && git diff
  --cached --check`.
- Release install evidence also passed: `npm run app:user` rebuilt and
  installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`
  passed for bundle id `com.yinyiping.loom` with 629 static web files; `npm run
  app:where` reported `2026-05-09T15:10:39.712Z`; and `npm run
  app:check-extension` passed with Atlas extension version `1.4.9`.
- Computer Use acceptance read the installed Loom Source Index after install.
  The real native surface remains in normal/private mode and shows `flipdisc.io`
  plus visible capture `DRAFT` / `DELETE` controls. That confirms the installed
  app still opens the real Source Index, but it also marks the current boundary:
  the new public-working mask is web `/sources` presentation behavior only, not
  native Source Index masking yet.

Update at 2026-05-10 01:27 AEST:
- Phase 10 `Working mode（公开版屏蔽私密）` now extends into the installed native
  Source Index and minimal sidebar. `NewLoomPublicWorkingMode.swift` resolves
  `loom.publicWorkingMode` from `UserDefaults` or `LOOM_PUBLIC_WORKING_MODE`.
  `LoomLibraryView` accepts `publicWorkingMode`, projects recent captures,
  reading rows, local files, reader notes, question containers, drafts, and all
  source rows through generic labels, hides source paths/descriptions and
  capture domains, and removes row `Draft` / `Delete` / `Add Question` actions
  while public mode is active. `LoomMinimalRootView` rereads the flag, resets
  private detail selections when public mode turns on, masks sidebar folder
  names as `Source group N` / `Source N`, hides Tools/Page/Folder, and removes
  rename/remove context actions.
- Red/green evidence: `tests/new-loom-public-working-mode.test.ts` first
  failed on the missing native public-working helper. After the Swift and
  contract updates, the focused public/source/native skeleton set passed 91/91,
  and the focused public/source set passed 29/29.
- Full verification passed after fixing one stale skeleton assertion that still
  expected unconditional `destructiveLabel: "Delete"`: `npm run typecheck`,
  `npm run test:contracts` 477/477, `npm run app:smoke`, `npm run app:where`
  (`2026-05-09T15:23:38.170Z`), and `npm run app:check-extension` with Atlas
  extension version `1.4.9`. The previous `npm run app:user` Release install
  rebuilt `/Users/yinyiping/Applications/Loom.app` and compiled
  `NewLoomPublicWorkingMode.swift`.
- Computer Use acceptance toggled `loom.publicWorkingMode` on, relaunched the
  installed app as `pid 76049`, and read the real Source Index. It showed
  `PUBLIC WORKING MODE`, sidebar `Source group 1` / `Source group 2` instead of
  `ECON 3202` / `INFS 3822`, capture rows `Web capture 1...4` instead of
  `flipdisc.io` / Moodle / Hacker News private labels, no Tools/Page/Folder,
  and no content-row `DRAFT` / `DELETE` buttons. The default was then restored
  by deleting `loom.publicWorkingMode`, relaunching as `pid 76210`, and Computer
  Use verified normal/private mode again shows `flipdisc.io`, `ECON 3202`,
  `INFS 3822`, Tools/Page/Folder, and visible per-row `DRAFT` / `DELETE`
  controls.
- Boundary remains: this is a public-demo presentation shield for Source Index
  and the native minimal sidebar. It is not export redaction, not source-file
  mutation, and not a full app-wide privacy mode.

Update at 2026-05-10 01:41 AEST:
- Phase 10 `The Hour, ticking` now has a first support surface at `/hour`.
  It is classified as a support route, not a primary route or legacy route.
  The page shows the current hour, second-level current time, minute progress,
  a literal breath bar, and links back to Source Index, Draft, The Year, and
  Discipline. It is intentionally not a timer, streak, alert, notification
  loop, or fourth primary product destination.
- Red/green evidence: the new skeleton contract first failed because `/hour`
  was not in `NEW_LOOM_SUPPORT_ROUTES`. A later Playwright pass caught a real
  hydration mismatch from server-rendered time; the contract was tightened to
  require `useState<Date | null>(null)` plus `setNow(currentDate())` before
  rendering live time. After the fix, the focused `/hour` contract passed
  63/63.
- Full web verification passed: `npm run typecheck`, `npm run test:contracts`
  478/478, and `npm run build`. The build generated 102 static pages and
  emitted `/hour`.
- Browser acceptance on `http://127.0.0.1:3100/hour` verified title
  `The Hour · Loom`, current time ticking from one second to the next, minute
  progress text, `Current hour`, `breath bar`, `No alerts`, and links to
  `/sources`, `/draft`, `/year`, and `/discipline`.
- Release install evidence passed: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` found bundle id
  `com.yinyiping.loom` with 633 static web files, `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app`, and `npm run app:check-extension`
  passed with Atlas extension version `1.4.9`. The installed bundle contains
  `Contents/Resources/web/hour.html` and the `/hour` client chunk.
- Computer Use acceptance read the installed app after install and confirmed
  the real normal-mode Source Index is visible. It then opened the current
  `flipdisc.io` capture reader: the capture contains the title, 2,245 word
  count, links, table of contents, images/canvas captures, code structure,
  source snapshot entries, YouTube/Vimeo placeholders, and end-of-article
  sections. A current source-page check against `https://flipdisc.io/` matched
  the major source structure. This capture quality is acceptable; no new
  extraction repair is required from this check.
- Native boundary: opening external `loom://bundle/hour` or
  `loom://bundle/hour.html` did not navigate the current minimal native
  window away from the capture reader. The route is present in the installed
  static bundle and works in browser/static export, but arbitrary external
  bundle-route deep links are still ignored by `LoomApp.handleGetURLEvent`.
  Treat native generic support-route deep linking as a later shell task, not
  as a flipdisc capture regression.

Update at 2026-05-10 02:57 AEST:
- The native generic support-route deep-link gap was tightened. External
  `loom://bundle/<route>` activation no longer depends only on an in-memory
  `.loomShuttleNavigate` notification that the SwiftUI root can miss during
  launch/reopen timing. `LoomApp.handleBundleURL` now stores the normalized
  bundle route in `LoomBundleRouteRelay` before presenting the main window and
  posting the navigation notification; `LoomMinimalRootView` consumes that
  pending route on appear / app activation and clears it when the matching
  live navigation notification is handled.
- Red/green evidence: the new native shell contract first failed on missing
  `LoomBundleRouteRelay.savePendingRoute(path)` / root consumption calls, and
  the new Swift relay test first failed to compile because
  `LoomBundleRouteRelay` did not exist. After implementation, the focused
  skeleton contract passed 64/64 and
  `LoomBundleRouteRelayTests` passed 2/2.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  479/479, `git diff --check && git diff --cached --check`, and
  `node scripts/check-loom-macos-project-files.mjs`. The project checker now
  confirms 37 Swift test files are referenced; it still warns that several
  project paths are untracked in the current large worktree.
- Release install evidence passed: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  635 static web files; `npm run app:where` reported
  `2026-05-09T16:56:53.848Z`; `npm run app:check-extension` passed with Atlas
  extension version `1.4.9`; and the installed bundle contains
  `Contents/Resources/web/hour.html` plus the new
  `loom.pendingBundleRoutePath` relay key in the app binary.
- Computer Use visible acceptance is still blocked by the locked macOS
  session, not by an installed-app absence: `get_app_state("Loom")` returned
  `cgWindowNotFound`, `CGSSessionScreenIsLocked=1`, and the frontmost process
  is still `com.apple.loginwindow` pid `398`. Rerun live URL-scheme navigation
  acceptance after unlock.

Update at 2026-05-10 03:08 AEST:
- Draft ThinkingDraft gained its first multi-block operation slice on web and
  native. Users can select contiguous draft blocks, review the original block
  text, and apply one replacement only if every selected original still matches
  the current draft body. Stale edits, empty replacements, missing blocks, and
  non-contiguous selections leave the draft unchanged.
- Red/green evidence: the focused Draft storage test first failed because
  `applyDraftBlockOperation` did not exist; the skeleton contract first failed
  on the missing `NewLoomDraftBlockOperation` / UI / native coverage; and the
  Swift Draft test first failed because `LoomThinkingDraft.applyBlockOperation`
  did not exist. After implementation, the focused Draft storage test passed
  25/25, the focused skeleton block-operation contract passed 65/65, and
  `LoomDraftStoreTests` passed 26/26.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  481/481, `git diff --check && git diff --cached --check`, and release
  install via `npm run app:user`.
- Installed-app evidence passed after release install: `npm run app:smoke`
  found bundle id `com.yinyiping.loom` with 635 static web files, `npm run
  app:where` reported `/Users/yinyiping/Applications/Loom.app`, `npm run
  app:check-extension` passed with Atlas extension version `1.4.9`, and the
  installed web/native bundles contain `Block operation`, `Block replacement`,
  and `Apply block edit`.
- Computer Use visible acceptance is still blocked by the locked macOS
  session: the installed Loom process is running from
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, but
  `get_app_state("Loom")` returns `cgWindowNotFound` while
  `CGSessionScreenIsLocked=1`. Treat this as a GUI-session blocker, not a
  Draft product regression.

Update at 2026-05-10 03:35 AEST:
- Phase 10 gained the first `Connections / Correspondents` support surface at
  `/connections`. It derives source nodes from trace events with `source.href`,
  parses markdown links inside reader notes / thought anchors / messages,
  resolves only links to already collected sources, dedupes repeated
  source-to-source links while keeping evidence counts, and groups
  correspondents by URL host or local-source bucket.
- The page is support-only, not a primary work route. It renders connection
  summary metrics, correspondents, source connections, and return paths to
  Source Index and Draft without moving files, creating feeds, or writing new
  records.
- Red/green evidence: the new source-connections test first failed because
  `lib/new-loom/source-connections.ts` did not exist; the skeleton route test
  first failed because `/connections` was not classified as a support route;
  and the native shell contract first failed because `/connections` was not in
  the installed support-route whitelist. After implementation, the focused
  source-connections tests passed 2/2 and the focused native/skeleton
  connections coverage passed.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  484/484, `git diff --check`, `git diff --cached --check`, direct static Next
  route build emitted `○ /connections`, Release install via `npm run
  app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom` and 638
  static web files, `npm run app:where`, and `npm run app:check-extension`
  with Atlas extension version `1.4.9`.
- Installed bundle evidence passed: `Contents/Resources/web/connections.html`
  exists, the installed web resources contain `Connections / Correspondents`,
  `Source connections`, `Correspondents`, and `cross-origin`, and the installed
  app binary contains the `/connections` route string.
- Computer Use acceptance passed after terminating the stale pre-install
  process and relaunching `/Users/yinyiping/Applications/Loom.app`. The fresh
  installed app showed Source Index capture rows with visible `DRAFT` and
  `Delete` controls, opened `loom://bundle/connections.html` with summary
  metrics (`3 Sources`, `1 Correspondents`, `0 Connections`, `0 cross-origin`),
  and opened the current `flipdisc.io` reader.
- Current `https://flipdisc.io` capture quality is acceptable for reading and
  writing: the installed reader shows source `flipdisc.io`, title, timestamp,
  `Open original`, `Re-capture`, `Source snapshot`, 2,245 words / 10m read,
  external links, contents, images, canvas captures, code sections, media
  placeholders, and end-of-article sections. Further improvement should focus
  on richer media/interactive replay and source-snapshot inspection, not on
  basic article extraction.

Update at 2026-05-10 03:58 AEST:
- Phase 10 `Atelier 多 source 平铺` now has its first Draft-owned web/native
  slice. Draft derives up to four `Source tiles` from attached references,
  labels capture/source/artifact-state/url origins, keeps source and capture
  metadata visible, and exposes `Open` plus `Insert quote` where an excerpt is
  available. `/atelier` remains a compatibility redirect into `/draft`.
- Red/green evidence: the focused Draft storage test first failed because
  `draftSourceTilesFromReferences` did not exist; the skeleton contract first
  failed on the missing web tile surface; the native skeleton contract then
  failed on missing `LoomDraftSourceTile` / native panel coverage. After
  implementation, focused Draft storage passed 26/26, focused skeleton
  Atelier coverage passed 67/67, and the focused Swift test
  `testDraftSourceTilesPrepareFourSourceNativeSurface` passed 1/1.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  486/486, `git diff --check`, `git diff --cached --check`, `npm run
  app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom` and 638
  static web files, `npm run app:where` reporting
  `/Users/yinyiping/Applications/Loom.app 2026-05-09T17:51:19.242Z`, and
  `npm run app:check-extension` with Atlas extension version `1.4.9`.
- Installed-app visual acceptance found the first native implementation gap:
  web `/draft` had source tiles, but the installed sidebar `Draft` is the
  native `LoomDraftView()` and initially lacked them. Native Draft was then
  updated and reinstalled.
- After reinstall, strict Computer Use accessibility-tree acceptance is
  blocked by macOS reporting `cgWindowNotFound` while the Loom log shows a
  visible main window and AppKit reports `Accessibility: Not vending elements
  because elementWindow(0) is lower than shield(2001)`. Treat this as a CUA
  tooling/shield limitation for this pass, not proof that the native surface
  failed to render.
- A temporary single-window inspection of installed Loom confirmed the visible
  native Draft right rail shows `Source tiles 3/4` with the Flipdisc capture,
  `ECON 3202`, and `15 · Multimodal`, each with `Open` actions. This is visual
  fallback evidence only; rerun strict Computer Use tree inspection if the
  macOS shield clears.

Update at 2026-05-10 04:15 AEST:
- Phase 8 `InteractiveArtifact` capture gained the first
  `animated-canvas` and `source-island` containers. The extension now detects
  visible non-slider canvas regions as `animated-canvas` artifacts with a
  captured current-frame asset, and embedded/source-island regions as
  `source-island` artifacts with href, label, and short description metadata.
- Native CaptureAST sidecars preserve the new optional artifact metadata
  (`href`, `description`) and diagnostics counts
  (`animatedCanvasCount`, `sourceIslandCount`).
- The capture reader renders both new kinds as stable reference cards:
  `animated-canvas` shows the captured frame with
  `data-loom-animated-canvas-frame="true"`, while `source-island` shows the
  embedded source description and an `Open source island` link with
  `data-loom-source-island-link="true"`.
- Red/green evidence: the structured-artifact contract first failed because
  `buildAnimatedCanvasArtifacts` / `buildSourceIslandArtifacts` and the reader
  renderers did not exist. The Playwright reader test first failed because the
  static capture bundle had not been rebuilt and then passed after
  `node scripts/build-static-export.mjs` regenerated `/loom-render/capture`.
- Focused verification passed: `npx tsx --test
  tests/capture-media-contract.test.ts --test-name-pattern "structured
  interactive artifacts"` passed 48/48; `npx tsx --test
  tests/capture-interactive-artifacts.test.ts --test-name-pattern "animated
  canvas|source-island"` passed 7/7; and static export regenerated 103 pages
  with `/loom-render/capture` at 43.8 kB.
- This is a stable capture/reference-container slice, not a full animation
  replay engine or LMS import API.

Update at 2026-05-10 real-file importer refresh:
- `npm run verify:real-files-importer` passed against the default real corpus
  root `/Users/yinyiping/Desktop/Knowledge System/UNSW`.
- Evidence was not synthetic-only: the manifest found 391 PDFs, 2827 images,
  14 attributed documents, 1 deck package, and 0 iWork packages. The verifier
  sampled three PDFs (`Course Overview_FINS3640.pdf`,
  `INFS3822 Assessment Guide T1 2026.pdf`, and
  `COMM3030 Assessment Handbook ST, 2026.pdf`), each producing 4000 chars plus
  page ranges.
- Real image evidence reported OCR 29 and visualDescriptions 12 across
  `Framework_for_Innovation_transparent.png`, `Derivation.jpeg`, and
  `output.png`; real DOCX evidence came from `business-model-canvas (1).docx`
  with 3904 chars; real PPTX evidence came from
  `FINS3616 Week 2_Updated.pptx` with 43757 chars across 43 slides.
- Because this real corpus currently has 0 iWork packages, iWork remains
  covered by fixture/unit evidence rather than live user-file evidence.
  Remaining importer work is fidelity, not baseline availability: full iWork
  protobuf/layout reconstruction, richer domain-specific image descriptions,
  and broader release-cycle installed-app evidence across more user files.

Update at 2026-05-10 Moodle/source-tile refresh:
- Draft source tiles now distinguish local file origins instead of labeling all
  imported files as generic `Source`. Web Draft and native Draft both classify
  attached local references by extension: Moodle `.pptx` / `.ppt` / `.key`
  show `Slide deck`, `.pdf` shows `PDF`, Markdown files show `Markdown`,
  images show `Image`, documents show `Document`, and text files show `Text`.
- This tightens the Moodle/heterogeneous-source writing surface without adding
  a new user-visible concept: a Moodle slide deck and a problem-set PDF still
  remain ordinary Draft references, but their source tiles now expose the
  origin type the writer needs while composing.
- Red/green evidence: the new web test first failed with
  `['Source', 'Source', 'Source', 'Source']` instead of
  `['Slide deck', 'PDF', 'Markdown', 'Image']`; the new native Swift test
  covered the same Moodle slide/PDF/notes/image set. After implementation,
  `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern
  "local Moodle file origins|four-source writing surface"` passed 27/27, full
  `LoomDraftStoreTests` passed 28/28, `npm run typecheck` passed, `npm run
  test:contracts` passed 487/487, and whitespace checks passed.

Update at 2026-05-10 Moodle/course-bundle Source Index refresh:
- Source Index rows now surface existing collection metadata from
  `knowledge/.cache/manifest/collection-metadata.json` instead of making
  Moodle/local course folders look like anonymous file buckets. Web `/sources`
  reads `getCollectionMetadata(category.slug)` and renders course name, term,
  course code, and up to three folder-topic labels. Native `LoomLibraryView`
  mirrors the same metadata by matching `ContentRoot` display names / active
  folder paths to collection slugs such as `unsw-infs-3822`.
- This is intentionally still ordinary source metadata, not a new public
  `course` or `dossier` entity. Public working mode masks these private course
  names, terms, paths, and folder topics.
- Red/green evidence: the new Source Index test first failed because only the
  web row rendered `INFS 3822` / `Recent: Week 4 Tutorial` while native had no
  collection metadata structs or loader. After implementation,
  `npx tsx --test tests/knowledge-home-source-library.test.tsx --test-name-pattern
  "Moodle-style course bundle metadata"` passed 27/27. Wider verification
  passed: `npm run typecheck`, `npm run test:contracts` 488/488, `git diff
  --check`, `git diff --cached --check`, `LOOM_SKIP_WEB_STAGE=1 xcodebuild
  -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug
  build`, `npm run app:user`, `npm run app:smoke` with bundle id
  `com.yinyiping.loom` and 638 static web files, `npm run app:where` reporting
  `/Users/yinyiping/Applications/Loom.app 2026-05-09T18:40:27.894Z`, `npm run
  app:check-extension` with Atlas extension version `1.4.9`, and fresh
  `npm run verify:real-files-importer` against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW`.
- A normal xcodebuild without `LOOM_SKIP_WEB_STAGE=1` was interrupted after the
  bundle staging script spent over a minute scanning `.next-export-current`;
  that is a generated-artifact staging issue, not a Swift compile failure.
  After `app:user`, runtime derived data currently contains the repo corpus
  search index but no `collection-metadata.json`; the new row metadata path is
  therefore empty until a real knowledge ingest writes collection metadata.
  Computer Use still cannot inspect the installed Loom window: after restarting
  the post-install process, `get_app_state("com.yinyiping.loom")` and
  `get_app_state("Loom")` both return `cgWindowNotFound`.

Update at 2026-05-10 Moodle metadata quality refresh:
- The real UNSW ingest path was run after the Source Index metadata reader was
  added. `npm run ingest` now writes
  `/Users/yinyiping/Library/Application Support/Loom/derived/knowledge/.cache/manifest/collection-metadata.json`
  for 14 source collections. The latest run found 648 docs across 14
  categories and wrote 53 folder topics.
- That real run exposed noisy folder-topic titles from source PDF front
  matter: role labels (`Lecturer`), emails, page headers, exam candidate-name
  blanks, formula fragments, and OCR-split `Week N S eminar` prefixes. The
  ingest folder-topic extractor now filters those generic lines and strips the
  leading week/seminar marker before writing metadata.
- Red/green evidence: the focused ingest test first failed because
  `extractFolderTopic` was not exported, then failed because `Email:
  linh-nguyen@unsw.edu.au 1: Canvas...` was accepted as a topic. After the
  filter cleanup, `npx tsx --test tests/knowledge-ingest.test.ts --test-name-pattern
  "folder topic extraction"` passed, full `tests/knowledge-ingest.test.ts`
  passed 6/6, `npm run ingest` regenerated the real UNSW metadata with zero
  matches for the explicit noise patterns, `npm run typecheck` passed, `npm
  run test:contracts` passed 489/489, and diff whitespace checks passed.
- Current strict Computer Use acceptance remains blocked by the same
  `cgWindowNotFound` window-layer failure, so this slice is verified by
  generated runtime metadata and test gates rather than AX-tree inspection.

Update at 2026-05-10 image importer readable summary refresh:
- Imported image source text now includes a deterministic `Image summary:`
  line before the detailed OCR and Vision-label sections. The summary combines
  the top semantic visual labels (`visual signals: ...`) with the first OCR
  snippets (`recognized text: ...`) so image imports are readable in Draft and
  Source Index without forcing the user to inspect raw bullet metadata first.
- The opt-in real-file importer verifier now computes the same readable image
  summary for real user images and prints it as `summary=...` beside the
  `ocr=` and `visualDescriptions=` evidence. This keeps the gate aligned with
  the user-visible import text instead of merely proving that Vision APIs ran.
- Evidence: `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  --test-name-pattern "native image import adds semantic Vision labels"` passed
  67/67; `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project
  macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug
  -only-testing:LoomTests/TypedExtractorMatchTests/testLocalImageImportTextAddsReadableImageSummary
  test` passed 1/1; full `TypedExtractorMatchTests` passed 7/7; `npm run
  verify:real-files-importer` passed against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW` with 391 PDFs, 2827 images,
  14 attributed documents, 1 deck, and 0 iWork packages; `npm run typecheck`
  passed; `npm run test:contracts` passed 489/489; whitespace checks passed.
  The image evidence now includes summaries such as `visual signals: document,
  chart, diagram; recognized text: ...`.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`, `npm run app:where` reported
  timestamp `2026-05-09T19:03:24.562Z`, and `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 638 static web files. Strict Computer Use
  acceptance is still blocked at the AX/window layer: after `npm run app:open`
  and confirming the process was running, `get_app_state` for both
  `com.yinyiping.loom` and `Loom` returned `cgWindowNotFound`.
- Remaining importer work is still higher-fidelity interpretation: full iWork
  protobuf/layout reconstruction and domain-specific image understanding beyond
  deterministic OCR plus Vision labels and their readable summary.

Update at 2026-05-10 Draft AI artifact-state prompt refresh:
- Draft AI attached-reference prompt lines now preserve raw artifact-state data
  beside the readable artifact-state label. Web Draft uses the shared
  `draftReferencePromptLines(...)` helper for attached references, so compose
  and inline-edit prompts inherit the same `artifactState=` and
  `artifactStateData=` fields. Native Draft mirrors this in both
  `LoomDraftAIPrompt` compose prompts and `LoomDraftInlineEdit` prompts through
  `LoomDraftQuoteFormatter.artifactStatePromptData(...)`.
- This closes a narrow attached-reference part of the rich artifact-state gap:
  when a flipdisc frame diagram or other interactive artifact is already
  attached to a Draft, AI sees the raw state string such as
  `0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F`, not only the prose
  summary. It is not yet corpus-wide artifact-state retrieval or interactive
  replay.
- Red/green evidence: the new web test first failed because
  `draftReferencePromptLines` was undefined, and the new native compose test
  first failed because the prompt omitted `artifactStateData=...`. After the
  helper and native formatter update, `npx tsx --test
  tests/new-loom-draft-storage.test.ts --test-name-pattern
  "raw artifact-state data"` passed, the selected Swift compose test passed,
  focused Draft storage passed 28/28, focused skeleton contract passed 67/67,
  the selected native compose plus inline-edit artifact-state prompt tests
  passed 2/2, full `LoomDraftStoreTests` passed 30/30, `npm run typecheck`
  passed, `npm run test:contracts` passed 490/490, and targeted whitespace
  checks passed.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 650 static web files; `npm run app:where`
  reported timestamp `2026-05-09T19:19:08.736Z`. Strict Computer Use still
  cannot inspect the window: `list_apps` sees `Loom — com.yinyiping.loom`
  running, but `get_app_state("com.yinyiping.loom")` and
  `get_app_state("Loom")` return `cgWindowNotFound`; `ioreg` reports
  `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-10 inline Draft artifact-state prompt refresh:
- Draft AI inline `@...#artifact-state` prompt lines now resolve matching
  attached artifact-state references by target id, not only by source title /
  href aliases. Web `draftInlineReferencePromptLines(...)` first checks the
  inline artifact-state anchor against attached `artifactState.targetId`; native
  `LoomDraftInlineReferenceParser.promptLines(...)` mirrors this with
  `findArtifactStateMatch(...)`.
- The resulting inline prompt line now carries the same readable
  `artifactState=` and raw `artifactStateData=` fields as attached-reference
  prompt lines. This means a body mention such as
  `@flipdisc-tutorial#frame-format:0.4` can give AI the raw byte-state string
  from an attached `loom://capture#frame-format` reference instead of degrading
  to `source=unattached`.
- Red/green evidence: the web inline-reference test first failed with
  `source=unattached` for `@flipdisc-tutorial#frame-format:0.4`; the native
  selected test first had no implementation path until the matching helper was
  added. After implementation, the focused Draft storage test passed 28/28,
  the focused skeleton contract passed 67/67, the selected native inline
  artifact-state test passed 1/1, full `LoomDraftStoreTests` passed 31/31,
  `npm run typecheck` passed, `npm run test:contracts` passed 490/490, and
  whitespace checks passed.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 655 static web files; `npm run app:where`
  reported timestamp `2026-05-09T19:31:44.129Z`; installed binary strings
  include `Inline @references:` and `artifactStateData=`.
- Computer Use acceptance was attempted against the installed app. `list_apps`
  sees `Loom — com.yinyiping.loom` running and `pgrep` confirms
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, but
  `get_app_state("com.yinyiping.loom")` still returns `cgWindowNotFound`.
  `ioreg` confirms the current console session is locked with
  `CGSessionScreenIsLocked=Yes`, so AX/window-tree inspection remains blocked
  by the OS session state.

Update at 2026-05-10 corpus-wide Draft artifact-state prompt refresh:
- Draft AI corpus context now preserves artifact-state prompt data when the
  selected corpus hit carries it. Web `NewLoomDraftCorpusDoc` accepts
  `artifactState`, `selectDraftCorpusHits(...)` scores target id / label /
  state text, `draftCorpusPromptLines(...)` emits readable `artifactState=`
  and raw `artifactStateData=`, and inline `@...#artifact-state` prompt lines
  inherit matching corpus-hit artifact-state data when the reference is not
  already attached.
- The web search index can now store `artifactState` beside title/href/category
  and body fields, and `DraftClient` hydrates either nested or flat
  artifact-state fields into Draft corpus docs. Native `EmbeddingRecord`
  sidecars now store optional `[LoomDraftArtifactState]`; Capture saves map
  `CaptureAST.interactiveArtifacts` into those states; and
  `LoomDraftCorpusContext` passes the first artifact state into native Draft AI
  corpus prompt lines.
- Red/green evidence: the web focused test first failed because corpus-resolved
  inline mentions and corpus context omitted `artifactState=` /
  `artifactStateData=`. The selected native test was started as the RED step
  and had to be interrupted after a stale no-output xcodebuild process; after
  implementation the selected native corpus artifact-state test passed 1/1.
  Focused Draft storage passed 28/28, focused skeleton contract passed 67/67,
  `npm run typecheck` passed, `npm run test:contracts` passed 490/490, and full
  `LoomDraftStoreTests` passed 32/32.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 655 static web files; `npm run app:where`
  reported timestamp `2026-05-09T19:48:30.845Z`; installed binary strings
  include `Inline @references:`, `Corpus context:`, and `artifactStateData=`.
  Computer Use acceptance remains blocked by the OS window layer:
  `list_apps` sees `Loom — com.yinyiping.loom` running, but
  `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
  `cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`. The
  currently running Loom process started at `2026-05-10 04:41:47 +1000`, before
  the new install, so the user should reopen Loom after unlocking for live UI
  inspection of this installed bundle.

Update at 2026-05-10 Compile output-bounding pass:
- Oversized Compile artifacts are now bounded before writeback. The shared
  TypeScript helper `boundCompileOutput(...)` and native
  `SourceFileView.boundCompileOutput(..., limit:)` truncate over-limit output,
  append an ellipsis within the configured character limit, and surface
  `Output truncated; consider splitting your scratch into focused sections.`
  as a visible notice. Short outputs are left unchanged.
- `SourceFileView.startCompile` now applies the bounder to both successful
  streaming output and partial output saved after provider interruption before
  calling `upsertCompiledSection(...)`. This prevents an overlong Compile
  response from being written directly into `Loom.md` while preserving the
  existing partial-write recovery path.
- Red/green evidence: the new TypeScript test first failed because
  `boundCompileOutput` was undefined, and the new selected Swift test first
  failed because `SourceFileView` had no `boundCompileOutput` member. After
  implementation, `npx tsx --test tests/new-loom-compile-pipeline.test.ts`
  passed 5/5, the selected Swift output-bounding test passed 1/1, full
  `LoomDraftStoreTests` passed 40/40, `npm run typecheck` passed,
  `npm run test:contracts` passed 500/500, and whitespace checks passed.
- This closes the "Compile output exceeds reasonable size" edge case. Compile
  MVP still remains open for true rich typography/KaTeX or native math
  rendering, live provider-request body acceptance, manual quality cases, and
  strict installed-app click acceptance once Computer Use can read the Loom
  window again.

Update at 2026-05-10 Compile native preview block-render pass:
- The native Compile preview no longer treats streamed Compile markdown as one
  raw text blob. `CompilePreviewArtifact` now carries structured
  `frames -> blocks`, with block kinds for headings, prose paragraphs, and
  native-styled math blocks. The visible preview uses those blocks to render
  frame labels, serif text hierarchy, and monospaced math blocks instead of only
  displaying raw markdown.
- Reveal markers and inline math delimiters are consumed for the preview model:
  `[imageData: payload bytes]` becomes `imageData`, `$0x80$` becomes `0x80`,
  and `$$ ... $$` becomes a math block. The existing summary still reports
  frame/reveal/math shape for compact scanning.
- Red/green evidence: the new selected Swift test first failed because
  `SourceFileView.CompilePreviewArtifact` had no `frames` member. After adding
  the render frame/block model and wiring the preview UI to it, the selected
  native render-block test passed 1/1 and the focused pair of preview tests
  passed 2/2.
- This narrows the Compile render-polish gap from raw streamed text to a first
  native render model. Compile MVP still remains open for higher-fidelity math
  typesetting/KaTeX or equivalent, live provider-request body acceptance, manual
  quality cases, and strict installed-app click acceptance once Computer Use can
  read the Loom window.

Update at 2026-05-10 08:34 AEST:
- The native render-block pass was rebuilt into the installed app. `npm run
  app:user` succeeded and installed `/Users/yinyiping/Applications/Loom.app`;
  `npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 637 static
  web files; `npm run app:where` reported timestamp
  `2026-05-09T22:32:10.197Z`; and `git diff --check` passed.
- Current `flipdisc.io` capture evidence remains good after the reinstall.
  `npm run verify:capture-handoff` passed against
  `/Users/yinyiping/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/b5ccf3fe-835b-4d5b-a5d2-ed9c228ee684/sub/Web/flipdisc.io/Loom.md`
  with sidecar `Loom-capture-ast-20260509-195026-2c01fa19e547.json`, matching
  snapshot `Loom-snapshot-20260509-195026-ac79.html`, 69 AST blocks, 31 media
  nodes, 25 visual assemblies, 10 code blocks, 91 links, 1 comparison slider,
  1 segment diagram, and 0 unresolved media references. The warning remains
  that saved markdown still contains the flat frame text, so the reader must
  use CaptureAST or fallback reconstruction.
- `npm run verify:flipdisc-live` also passed against live `https://flipdisc.io/`
  using the staged Atlas extension content script
  `62241fc751cf6feb64059c38094d3755b21b0b8526a297d73331dcfea58abba2`. Live
  extraction produced 70 blocks, 31 media nodes, 9 interactive artifacts, 1
  input mirror, 1 comparison slider, 1 segment diagram, 3 animated canvases,
  and the expected Frame Format tokens `0x80`, `0x83`, `0x01`, `imageData`,
  `0x8F`.
- Strict installed-window acceptance remains blocked by the macOS session:
  `list_apps` sees `Loom — com.yinyiping.loom` running and `pgrep` shows the
  installed binary process, but `get_app_state("com.yinyiping.loom")` and
  `get_app_state("Loom")` both return `cgWindowNotFound`; `ioreg` reports
  `CGSessionScreenIsLocked=Yes`. No destructive UI action was taken.

Update at 2026-05-10 Compile lightweight math-display pass:
- Compile preview math blocks now keep both the raw LaTeX text and a native
  display string. The raw `text` remains available for copy/accessibility and
  later writeback, while `renderedText` maps common LaTeX symbols, Greek
  letters, arrows, comparison operators, and simple subscript/superscript
  notation into a typographic SwiftUI preview string.
- The native preview UI now displays math blocks from `renderedText` in a serif
  math block instead of showing only raw monospaced LaTeX. Example coverage:
  `L(\theta) = \alpha_1^2 + \beta \rightarrow x_{t+1}` displays as
  `L(θ) = α₁² + β → xₜ₊₁` while preserving the original LaTeX source.
- Red/green evidence: the selected Swift test first failed because
  `SourceFileView.CompilePreviewBlock` had no `renderedText` member. After
  adding the lightweight renderer and wiring the math-block UI to it, the
  selected math-display test passed 1/1 and full `LoomDraftStoreTests` passed
  42/42.
- This is a meaningful render-polish step, but it is still not full
  KaTeX/iosMath-equivalent rendering. Compile MVP remains open for full
  high-fidelity math/layout, live provider-request body acceptance, manual
  quality cases, and strict installed-app click acceptance once Computer Use can
  read the Loom window.

Update at 2026-05-10 08:43 AEST:
- The lightweight math-display pass was rebuilt into the installed user app.
  `npm run app:user` succeeded and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
  reported timestamp `2026-05-09T22:42:20.229Z`; and `git diff --check`
  passed.
- Computer Use acceptance is still blocked by the macOS session lock, not by a
  known Loom crash. `list_apps` reports `Loom - com.yinyiping.loom` running,
  `pgrep` shows `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`,
  but `get_app_state("com.yinyiping.loom")` still returns `cgWindowNotFound`.
  `ioreg` reports `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-10 08:50 AEST:
- The native Compile provider path now has a default-off request-body audit hook.
  Setting `LOOM_AI_REQUEST_AUDIT_LOG=/path/to/file.jsonl` records JSONL entries
  with `timestamp`, `provider`, `surface`, and the provider-visible
  `requestBody`; Compile calls pass `surface: "compile"`. The entry contains
  the prompt/messages and streaming flag, but not authorization headers or API
  keys.
- Red/green evidence: the selected Swift test first failed because
  `LoomAIRequestAudit` did not exist. After adding the audit helper and wiring
  `LoomAI.send` / `sendStream`, the selected audit test passed 1/1; full
  `LoomDraftStoreTests` passed 43/43; `npm run test:contracts` passed 500/500;
  and `git diff --check` passed.
- The provider-audit pass was rebuilt into the installed user app. `npm run
  app:user` succeeded and installed `/Users/yinyiping/Applications/Loom.app`;
  `npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 637 static
  web files; `npm run app:where` reported timestamp
  `2026-05-09T22:48:57.189Z`.
- Computer Use acceptance is still blocked by the macOS session lock. Computer
  Use `list_apps` sees `Loom - com.yinyiping.loom` running, but
  `get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
  `cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`, and `ps`
  shows the running installed binary at
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
- This closes the code-level audit-hook gap, but not the strict live acceptance
  gap. A real unlocked Compile click with `LOOM_AI_REQUEST_AUDIT_LOG` set still
  needs to confirm the logged provider body from the installed app.

Update at 2026-05-10 08:54 AEST:
- Compile's five manual quality cases now exist as executable review fixtures in
  `lib/new-loom/compile-pipeline.ts` via `compileManualQualityCases()`. The
  registry covers the §9.3 cases: math derivation, definition cluster,
  step-by-step algorithm, conceptual reflection, and mixed scratch dispatch.
- Each fixture carries reviewable scratch, a named expected output shape,
  visible required signals, and acceptance criteria. The mixed case explicitly
  requires contradictions to be surfaced instead of silently resolved.
- Red/green evidence: `tests/new-loom-compile-pipeline.test.ts` first failed
  because `compileManualQualityCases` was not exported. After adding the
  registry, the focused Compile pipeline test passed 6/6.
- Wider gates passed after this slice: `npm run typecheck`, `npm run
  test:contracts` 501/501, and `git diff --check`.
- This closes the documentation/fixture part of the manual-quality gap. It does
  not close live Compile quality acceptance: the five cases still need real
  provider output and product-owner review before the Compile MVP can be called
  shipped.

Update at 2026-05-10 09:01 AEST:
- The Compile prompt now explicitly preserves contradictory scratch statements
  in both the TypeScript and Swift prompt builders: providers are told to
  surface both sides rather than silently choosing one. Red/green evidence:
  `tests/new-loom-compile-pipeline.test.ts` first failed on the missing prompt
  rule, then passed 6/6; the selected Swift prompt test first failed on the
  same missing rule, then passed 1/1; full `LoomDraftStoreTests` passed 43/43.
- Wider gates passed after the prompt slice: `npm run typecheck`, `npm run
  test:contracts` 501/501, and `git diff --check`.
- The slice was rebuilt into the installed user app. `npm run app:user`
  succeeded and installed `/Users/yinyiping/Applications/Loom.app`; `npm run
  app:smoke` passed with bundle id `com.yinyiping.loom` and 637 static web
  files; `npm run app:where` reported timestamp
  `2026-05-09T22:58:08.594Z`; and `git diff --check` passed.
- Computer Use acceptance was attempted again but remains blocked by the Mac
  session lock. `get_app_state("com.yinyiping.loom")` returned
  `cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`. The
  running Loom process started at 08:12 while the new bundle was installed at
  08:58, so the visible window may still be using pre-install resources until
  the app is relaunched in an unlocked session.
- The flipdisc capture gates passed after the data spot-check. `npm run
  verify:capture-handoff` passed against the saved `flipdisc.io` Loom data with
  sidecar `Loom-capture-ast-20260509-195026-2c01fa19e547.json`, snapshot
  `Loom-snapshot-20260509-195026-ac79.html`, 1 `Frame Format` segment diagram,
  1 comparison slider, 31 media nodes, and 0 unresolved media references. `npm
  run verify:flipdisc-live` passed against live `https://flipdisc.io/` with the
  staged Atlas extension script, producing 70 blocks, 9 interactive artifacts,
  1 input mirror, 1 comparison slider, 1 segment diagram, and the expected frame
  tokens.
- The saved `https://flipdisc.io/` capture is therefore structurally good: the
  live/saved checks preserve the page headings, code blocks, media structure,
  `Frame Format` artifact, and tail `Inspiration` section. Remaining quality
  gaps are experience-level, not basic extraction failure: the saved Markdown
  still carries a flat frame-text fallback warning, headless live canary logs
  expected visible-tab/canvas screenshot fallbacks, some visual blocks still have
  generic alt labels, and the screenshot-reported missing Delete control cannot
  be re-accepted through Computer Use until the session is unlocked and the
  installed app is relaunched.

Update at 2026-05-10 09:06 AEST:
- Native Compile preview math display now handles more common LaTeX structures
  in the lightweight renderer. In addition to Greek letters, arrows, comparison
  operators, and simple subscript/superscript notation, it now displays
  `\frac{}`, `\sqrt{}`, `\sum`, `\prod`, `\int`, `\partial`, `\nabla`,
  `\infty`, and `\pm` as clearer typographic forms. Example coverage:
  `\frac{\partial L}{\partial \theta} = \sqrt{x^2 + y^2} + \sum_{i=1}^{n} x_i`
  displays as `∂ L⁄∂ θ = √(x² + y²) + ∑ᵢ₌₁ⁿ xᵢ`.
- Red/green evidence: the selected Swift test first failed because the preview
  still emitted raw `\frac`, `\sqrt`, and `\sum`; after adding the lightweight
  command renderer, the selected test passed 1/1. Full `LoomDraftStoreTests`
  passed 44/44.
- Wider gates passed after this slice: `npm run typecheck`, `npm run
  test:contracts` 501/501, and `git diff --check`.
- This narrows the high-fidelity math gap but does not close it completely:
  this is still a lightweight native preview renderer, not full KaTeX/iosMath
  layout.

Update at 2026-05-10 09:08 AEST:
- The latest build was installed to `/Users/yinyiping/Applications/Loom.app`.
  `npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 637 static
  web files; `npm run app:where` reported timestamp `2026-05-09T23:08:19.012Z`;
  `git diff --check` passed.
- Computer Use acceptance remains blocked by the locked macOS console session,
  not by a missing app install. `get_app_state("com.yinyiping.loom")` returned
  `cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`; and
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` is running.
  Relaunch and re-run visual acceptance after unlocking before treating the
  visible window as confirmed current.

Update at 2026-05-10 09:10 AEST:
- The flipdisc capture verifiers were rerun. `npm run verify:capture-handoff`
  passed against the saved `flipdisc.io` capture with 69 blocks, 31 media nodes,
  1 comparison slider, 1 `Frame Format` segment diagram, and 0 unresolved media
  references. `npm run verify:flipdisc-live` passed against
  `https://flipdisc.io/` with 70 blocks, 31 media nodes, 9 interactive artifacts,
  1 input mirror, 1 comparison slider, 1 segment diagram, and expected frame
  tokens `0x80`, `0x83`, `0x01`, `imageData`, and `0x8F`.
- Remaining warnings are still quality/acceptance issues rather than extraction
  failure: the saved Markdown includes a flat frame-text fallback warning, and
  the headless live canary still logs expected visible-tab/canvas screenshot
  fallbacks.

Update at 2026-05-10 09:14 AEST:
- Compile's lightweight native math preview now handles nested command/script
  arguments before fraction rendering. The regression case
  `\frac{1}{\sqrt{n}} + \frac{x_i}{y_{i+1}}` now displays as
  `1⁄√(n) + xᵢ⁄yᵢ₊₁` instead of leaking raw `\frac{...}` text.
- Red/green evidence: the new selected Swift test first failed with raw
  `\frac{1}{√(n)} + \frac{xᵢ}{yᵢ₊₁}`, then passed after the renderer consumed
  scripts before resolving fractions. Full `LoomDraftStoreTests` passed 45/45.
  Wider gates passed: `npm run typecheck`, `npm run test:contracts` 501/501,
  and `git diff --check`.
- This further narrows the Compile math-render polish gap, but it is still a
  lightweight native display string rather than full KaTeX/iosMath-equivalent
  layout.

Update at 2026-05-10 09:19 AEST:
- Computer Use acceptance is now possible after the desktop unlocked. In the
  installed app, Draft showed the saved body
  `Phase 1 installed-app draft verification @multimodal`, source tiles for the
  `Flipdisc Display Build and Software Guide` capture, `ECON 3202`, and
  `15 · Multimodal`, plus matching `Open reference` entries.
- Opening the flipdisc reference in the installed app showed the capture reader
  with title, source metadata, reader controls, and a visible `Delete capture`
  button. The button was not clicked because it is a destructive local-data
  action. The reader content preserved the main article text, links, YouTube
  embed placeholder, image/canvas capture entries, source-snapshot links, the
  `Frame Format` segment diagram with `0x80`, `0x83`, `0x01`, `imageData`,
  `0x8F`, and tail sections through `Inspiration`.
- Opening `Source snapshot` from the installed app loaded the saved
  `Loom-snapshot-20260509-195026-ac79.html` in the snapshot route. The snapshot
  toolbar also exposed `Delete capture`, kept JS in a sandboxed iframe, reported
  a 519 KB snapshot, and preserved interactive evidence including the pixel-font
  input mirrors and the dithering comparison slider.
- Verification rerun after Computer Use: `npm run verify:capture-handoff`
  passed against the saved capture with 69 blocks, 31 media nodes, 1 comparison
  slider, 1 `Frame Format` segment diagram, and 0 unresolved media references;
  `npm run verify:flipdisc-live` passed against `https://flipdisc.io/` with 70
  blocks, 31 media nodes, 9 interactive artifacts, 1 input mirror, 1 comparison
  slider, 1 segment diagram, and the expected frame tokens. `npm run app:smoke`
  passed for `/Users/yinyiping/Applications/Loom.app`, `npm run app:where`
  reported timestamp `2026-05-09T23:16:18.913Z`, and `git diff --check`
  passed.
- Current verdict for `https://flipdisc.io/`: capture quality is good enough for
  Loom's present reader/snapshot workflow and does not need urgent extraction
  work. Remaining improvements are polish: reduce the saved-Markdown flat-frame
  fallback warning, improve generic visual alt labels, and eventually reduce
  headless canary visible-tab/canvas fallback warnings.

Update at 2026-05-10 09:24 AEST:
- Compile's malformed structured-output fallback from `plans/compile-pipeline-mvp.md
  §5.5` was narrowed without making a live provider call. The TypeScript parser
  and native preview now detect unbalanced math delimiters or malformed
  `[term: explanation]` reveal markers and fall back to plain Markdown with the
  visible eyebrow `Output rendered without typesetting.` instead of silently
  trying to typeset broken structure.
- Red/green evidence: `tests/new-loom-compile-pipeline.test.ts` first failed
  because `parseCompileArtifact` had no `malformed` / `notice` contract and
  still returned structured frames for malformed input; the static skeleton
  contract first failed because `SourceFileView` lacked the visible notice; the
  selected Swift test first failed because `CompilePreviewArtifact` had no
  `notice` member. After implementation, the focused Compile pipeline test
  passed 7/7, the focused skeleton contract passed 68/68, and the selected
  Swift malformed-preview test passed 1/1.
- This narrows another Compile error-UX row, but Compile MVP remains open for
  live provider-request body acceptance, true high-fidelity math/layout, real
  AI output review, strict installed-app Compile click acceptance, and
  product-owner quality acceptance.

Update at 2026-05-10 09:27 AEST:
- The edited native/web bundle was rebuilt and installed with `npm run
  app:user`. The install completed successfully to
  `/Users/yinyiping/Applications/Loom.app`; Xcode emitted only the existing
  macOS 14 `activateIgnoringOtherApps` deprecation warnings.
- Installed bundle checks passed: `npm run app:smoke` reported bundle id
  `com.yinyiping.loom` and 637 static web files, `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T23:26:13.183Z`, and
  `git diff --check` passed.
- Computer Use read the current Loom window from
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` and saw the
  flipdisc snapshot route with sandboxed JS, `Delete capture`, reader/snapshot
  controls, the main article body, contents links, embedded YouTube iframe,
  code/text blocks, input mirrors, a comparison slider, and tail sections
  through `Inspiration`. No destructive control was clicked.
- Important acceptance caveat: the visible Loom process started at
  `2026-05-10 08:12:47 AEST`, before the newly installed binary timestamp
  `2026-05-10 09:26:13 AEST`. The current UI observation validates the running
  installed-app surface, but it does not prove the just-built binary has been
  relaunched. Relaunch Loom before claiming strict installed-app acceptance of
  the latest Swift change.

Update at 2026-05-10 09:34 AEST:
- Compile's hallucination/unsupported-marker error UX from
  `plans/compile-pipeline-mvp.md §5.5` was narrowed without making a live
  provider call. The TypeScript parser now exposes
  `unsupportedClaims`/`unsupportedCount`; the native preview consumes raw
  `(unsupported)` markers, adds an inline `Unsupported claim` annotation to the
  affected paragraph, and includes unsupported-claim count in the preview
  summary.
- Red/green evidence: the focused TypeScript test first failed because
  `unsupportedCount` was undefined; the static skeleton contract first failed
  because `CompilePreviewArtifact` lacked `unsupportedCount`; and the selected
  Swift test first failed because native preview blocks lacked annotations.
  After implementation, `tests/new-loom-compile-pipeline.test.ts` passed 8/8,
  `tests/new-loom-skeleton-contract.test.ts` passed 68/68, their combined run
  passed 76/76, and full `LoomDraftStoreTests` passed 47/47.
- Wider gates passed after this slice: `npm run typecheck` and `npm run
  test:contracts` 503/503. Compile remains open for live provider-request body
  acceptance, true high-fidelity math/layout, real AI output review, strict
  installed-app Compile click acceptance, and product-owner quality acceptance.

Update at 2026-05-10 09:37 AEST:
- The edited native/web bundle was rebuilt and installed again with `npm run
  app:user`. The install succeeded to `/Users/yinyiping/Applications/Loom.app`;
  Xcode emitted only the existing macOS 14 `activateIgnoringOtherApps`
  deprecation warnings and an AppIntents metadata skip warning.
- Installed bundle checks passed: `npm run app:smoke` reported bundle id
  `com.yinyiping.loom` and 637 static web files, `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T23:36:26.191Z`, and
  `git diff --check` passed.
- Computer Use read the current Loom window from
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` and still saw
  the flipdisc snapshot route with sandboxed JS, `Delete capture`, article
  text, contents links, embedded YouTube iframe, frame-format code tokens,
  pixel-font inputs, the dithering slider, and tail `Inspiration` links. No
  destructive control was clicked.
- Important acceptance caveat: the visible Loom process started at
  `2026-05-10 08:12:47 AEST`, before the newly installed binary timestamp
  `2026-05-10 09:36:26 AEST`. This proves the current bundle is installed and
  smoke-checks clean, but strict UI acceptance of the latest native Compile
  change still requires relaunching Loom.

Update at 2026-05-10 09:41 AEST:
- Compile's high-fidelity math/layout gap was narrowed again without making a
  live provider call. The TypeScript parser now exposes ordered inline/block
  `mathExpressions` with lightweight display strings, and native paragraph
  preview now renders inline LaTeX through the same lightweight math display
  path instead of leaking raw commands such as `\theta` or `\nabla` into the
  visible paragraph text.
- Red/green evidence: `tests/new-loom-compile-pipeline.test.ts` first failed
  because `mathExpressions` was undefined; the selected Swift test first failed
  because paragraph text still contained raw `\theta`/`\nabla`. After
  implementation, the focused Compile pipeline test passed 9/9, the combined
  Compile/skeleton run passed 77/77, selected Swift inline-math preview passed
  1/1, full `LoomDraftStoreTests` passed 48/48, `npm run typecheck` passed,
  and `git diff --check` passed.
- This is still lightweight math display, not full KaTeX/iosMath-equivalent
  layout. Compile remains open for live provider-request body acceptance, true
  high-fidelity math/layout, real AI output review, strict installed-app
  Compile click acceptance, and product-owner quality acceptance.

Update at 2026-05-10 09:50 AEST:
- Compile's `[term: explanation]` reveal renderer is no longer only a parser
  count. Native preview paragraph blocks now carry `CompilePreviewReveal`
  entries, the visible marker text remains consumed from the paragraph body,
  and the preview UI renders compact reveal chips with hover help plus
  accessibility labels containing the explanation.
- Red/green evidence: the selected Swift test first failed because
  `CompilePreviewBlock` had no `reveals` member and `SourceFileView` had no
  `CompilePreviewReveal` type. After implementation, the selected reveal test
  passed 1/1, full `LoomDraftStoreTests` passed 49/49, the combined
  Compile/skeleton TypeScript run passed 77/77, `npm run typecheck` passed,
  and `npm run test:contracts` passed 504/504.
- This closes the first native hover/accessibility reveal slice, but Compile
  remains open for live provider-request body acceptance, true high-fidelity
  math/layout, real AI output review, strict installed-app Compile click
  acceptance, and product-owner quality acceptance.

Update at 2026-05-10 09:52 AEST:
- The edited native/web bundle was rebuilt and installed with `npm run
  app:user`. The install succeeded to `/Users/yinyiping/Applications/Loom.app`;
  Xcode emitted only the existing `activateIgnoringOtherApps` deprecation
  warnings and AppIntents metadata warnings.
- Installed bundle checks passed: `npm run app:smoke` reported bundle id
  `com.yinyiping.loom` and 637 static web files, `npm run app:where` reported
  `/Users/yinyiping/Applications/Loom.app` at `2026-05-09T23:52:04.796Z`,
  `stat` showed the local bundle and executable modified at
  `2026-05-10 09:52:04 +1000`, and `git diff --check` passed.
- Computer Use still cannot inspect the visible window: `get_app_state` for
  `com.yinyiping.loom` returned `cgWindowNotFound`, while `list_apps` saw
  `Loom - com.yinyiping.loom [running]`. The current process remains pid
  `38106`, started at `2026-05-10 08:12:47 AEST`, so strict latest-binary UI
  acceptance still requires relaunching Loom.

Update at 2026-05-10 10:00 AEST:
- The Draft-side "no delete key" gap was narrowed for attached references.
  Draft now exposes visible `Remove reference` controls in both the detailed
  References list and each Source tile. The action detaches the reference from
  the draft and preserves the original source/capture file.
- Storage now has `LoomDraftStore.removeReference(href:from:now:)`; removing a
  reference updates `drafts.json` and the readable Markdown sidecar while
  preserving the draft title/body and other references.
- Red/green evidence: the selected Swift test first failed because
  `LoomDraftStore` had no `removeReference` member; the skeleton contract first
  failed because `LoomDraftView` had no `Remove reference` UI. After
  implementation, the selected Swift test passed 1/1, full
  `LoomDraftStoreTests` passed 50/50, full `tests/new-loom-skeleton-contract`
  passed 69/69, `npm run typecheck` passed, and `git diff --check` passed.
- This is a draft-reference detach operation, not destructive deletion of the
  underlying source/capture. Strict installed-app UI acceptance still requires
  installing this bundle and relaunching Loom.

Update at 2026-05-10 10:03 AEST:
- The Draft reference-detach build was installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the same app at `2026-05-10T00:02:06.948Z`; `stat`
  showed both the bundle and executable modified at
  `2026-05-10 10:02:06 +1000`.
- Computer Use still cannot inspect the visible window:
  `get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")` both
  returned `cgWindowNotFound`, although `list_apps` sees
  `Loom - com.yinyiping.loom [running]`.
- The current visible/running process is still pid `38106`, started at
  `2026-05-10 08:12:47 AEST`. The latest bundle is installed and smoke-checks
  clean, but strict UI acceptance of the latest Draft delete controls requires
  relaunching Loom.

Update at 2026-05-10 10:13 AEST:
- Compile's lightweight math/layout path now handles common multiline LaTeX
  environments instead of leaking raw `\begin` blocks. The TypeScript parser
  and native preview consume `aligned`, `align`, `align*`, and `cases` into
  readable multiline display strings, remove raw alignment markers such as
  `&`, and native preview body summaries use rendered math text for math
  blocks while preserving the original LaTeX for copy/writeback paths.
- Red/green evidence: the focused TypeScript Compile test first failed because
  rendered output still contained raw `\begin{aligned}`, `\begin{cases}`, and
  `&`; the selected Swift test failed on the same raw environment leakage.
  After implementation, the focused TS run passed, the focused Swift run
  passed, combined Compile/skeleton TypeScript tests passed 79/79, full
  `LoomDraftStoreTests` passed 51/51, `npm run typecheck` passed,
  `npm run test:contracts` passed 506/506, and `git diff --check` passed.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:12:53.346Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:12:53 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process is still pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:12 bundle.
  Therefore this is installed-bundle verification, not strict latest-binary UI
  acceptance. Strict UI acceptance still requires explicit permission to
  relaunch Loom.

Update at 2026-05-10 10:21 AEST:
- Compile's lightweight math/layout path now also handles common matrix LaTeX
  environments. The TypeScript parser and native preview consume `bmatrix`,
  `pmatrix`, and `matrix` into readable multiline display strings, removing
  raw `\begin` blocks and `&` alignment markers from visible math summaries.
- Red/green evidence: the new TypeScript matrix test first failed because
  displays still contained raw `\begin{bmatrix}`, `\begin{pmatrix}`, `&`, and
  row separators; the selected Swift test failed on the same raw matrix output.
  After implementation, the focused TS matrix run passed 11/11, selected Swift
  matrix preview passed 1/1, combined Compile/skeleton TypeScript tests passed
  80/80, full `LoomDraftStoreTests` passed 52/52, `npm run typecheck` passed,
  `npm run test:contracts` passed 507/507, and `git diff --check` passed.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:21:24.294Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:21:24 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` still returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:21 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 10:28 AEST:
- Compile's lightweight math/layout path now also handles LaTeX `array`
  environments without leaking column specs. The TypeScript parser and native
  preview consume `\begin{array}{...}` as a matrix-style multiline display,
  remove the leading column specification such as `{cc}`, and keep raw
  `\begin` blocks plus `&` alignment markers out of visible math summaries.
- Red/green evidence: the focused TypeScript test first failed because output
  still contained raw `\begin{array}{cc}`, `{cc}`, and `&`; the selected Swift
  test failed on the same array environment leakage. After implementation, the
  focused TS array run passed 12/12, selected Swift array preview passed 1/1,
  combined Compile/skeleton TypeScript tests passed 81/81, full
  `LoomDraftStoreTests` passed 53/53, `npm run typecheck` passed,
  `npm run test:contracts` passed 508/508, and `git diff --check` passed.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:28:10.292Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:28:10 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:28 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 10:36 AEST:
- Compile's lightweight math/layout path now also handles common limit and
  operator commands inside scripted expressions. The TypeScript parser and
  native preview render expressions such as `\lim_{n \to \infty} 1/n
  \sum_{i=1}^n \log p_\theta(x_i)` as readable text like `limₙ → ∞ 1⁄n
  ∑ᵢ₌₁ⁿ log p_θ(xᵢ)` instead of leaking raw commands or garbled command
  bodies.
- Red/green evidence: the focused TypeScript test first failed because output
  contained raw/garbled `\limₙ \ₜₒ \ᵢₙfₜy ... \log`; the selected Swift test
  failed on the same raw command leakage. After implementation, the focused
  TypeScript run passed 13/13, selected Swift limit/operator preview passed
  1/1, combined Compile/skeleton TypeScript tests passed 82/82, full
  `LoomDraftStoreTests` passed 54/54, `npm run typecheck` passed,
  `npm run test:contracts` passed 509/509, `git diff --check` passed, and
  `git diff --cached --check` passed.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:35:52.690Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:35:52 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:35 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 10:44 AEST:
- Compile's lightweight math/layout path now unwraps common LaTeX text/font
  formatting commands in both the TypeScript parser and native preview:
  `\operatorname{}`, `\mathrm{}`, `\text{}`, `\mathbb{}`, plus the same
  one-argument path for `\mathbf{}` and `\mathcal{}`. The expression
  `\operatorname{softmax}(z_i) = \mathrm{prob}(y_i), \quad \text{where } z_i
  \in \mathbb{R}` now renders as readable native text like
  `softmax(zᵢ) = prob(yᵢ), where zᵢ ∈ R`.
- Red/green evidence: the focused TypeScript test first failed because the
  visible display still leaked raw `\operatorname`, `\mathrm`, `\text`,
  `\mathbb`, and `\in`; the selected Swift test failed on the same leakage.
  The first implementation exposed a real token-order regression where
  replacing `\in` before `\infty` rendered infinity as `infty`; Swift also
  needed per-line spacing normalization after unwrap. After fixing both, the
  focused TS run passed 14/14, the selected Swift limit/operator plus
  formatting run passed 2/2, combined Compile/skeleton TypeScript tests passed
  83/83, full `LoomDraftStoreTests` passed 55/55, `npm run typecheck` passed,
  and `npm run test:contracts` passed 510/510.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:43:56.681Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:43:56 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:43 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 10:46 AEST:
- The current saved `https://flipdisc.io/` handoff still verifies cleanly.
  `npm run verify:capture-handoff` passed against the installed sandbox capture
  at `Web/flipdisc.io/Loom.md`, sidecar
  `Loom-capture-ast-20260509-195026-2c01fa19e547.json`, with the expected
  segment diagram `0x80 -> 0x83 -> 0x01 -> imageData -> 0x8F`,
  `segmentDiagramCount: 1`, `blockCount: 69`, 31 media nodes, 10 code blocks,
  91 links, and `unresolvedMediaReferences: []`.
- `npm run verify:flipdisc-live-handoff` also passed against the live page.
  The live fixture produced 70 blocks, 9 interactive artifacts, 1 comparison
  slider, 1 input mirror, 1 segment diagram, 3 animated canvases, 3 source
  islands, 31 media nodes, and a verifier result with
  `unresolvedMediaReferences: []`.
- Remaining capture-quality note: the saved Markdown still contains the flat
  frame text. This is acceptable only because the reader has the CaptureAST
  sidecar/fallback and must keep presenting the segment diagram as the primary
  structure instead of relying on the flat Markdown row.

Update at 2026-05-10 10:52 AEST:
- Compile's lightweight math/layout path now also handles set-builder
  delimiters and membership operators in both the TypeScript parser and native
  preview. The expression
  `\left\{ x \in \mathbb{R} \mid x \ge 0, x \notin \mathbb{Z} \right\}` now
  renders as `{ x ∈ R | x ≥ 0, x ∉ Z }` instead of leaking raw delimiter and
  membership commands.
- Red/green evidence: the focused TypeScript and selected Swift tests first
  failed because output still leaked `\{`, `\mid`, `\ge`, `\notin`, and `\}`.
  The first implementation exposed a token-order regression where `\le`
  replaced the prefix of `\left`, producing `≤ft{...}`. After consuming
  `\left`/`\right` before the shorter `\le`/`\ge` tokens, the focused TS run
  passed 15/15, the selected Swift run passed 3/3, combined Compile/skeleton
  TypeScript tests passed 84/84, full `LoomDraftStoreTests` passed 56/56,
  `npm run typecheck` passed, and `npm run test:contracts` passed 511/511.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:52:01.727Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:52:01 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:52 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 10:59 AEST:
- Compile's lightweight math/layout path now also handles common set and
  probability-logic symbols in both the TypeScript parser and native preview.
  The expression
  `\forall x \in A \subseteq B, A \cap B \neq \emptyset \Rightarrow x \sim p(x)`
  now renders as `∀ x ∈ A ⊆ B, A ∩ B ≠ ∅ ⇒ x ∼ p(x)` instead of leaking raw
  commands such as `\forall`, `\subseteq`, `\cap`, `\emptyset`, and `\sim`.
- Red/green evidence: the focused TypeScript test first failed with
  `\forall x ∈ A \subseteq B, A \cap B ≠ \emptyset ⇒ x \sim p(x)`; the
  selected Swift test failed on the same raw command leakage. After adding the
  shared token mappings, the focused TS run passed 16/16, the selected Swift
  run passed 1/1, combined Compile/skeleton TypeScript tests passed 85/85,
  full `LoomDraftStoreTests` passed 57/57, `npm run typecheck` passed, and
  `npm run test:contracts` passed 512/512.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T00:59:15.263Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 10:59:15 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 10:59 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 11:05 AEST:
- TypeScript Compile math expressions now expose KaTeX HTML/MathML strings per
  parsed expression while preserving the lightweight `display` text used for
  native preview, accessibility, copy, and writeback.
- Inline math HTML includes `class="katex"` plus the original TeX annotation;
  block math HTML includes `class="katex-display"` and MathML
  `display="block"`. This narrows the web rendering gap without changing the
  native lightweight display path.
- Red/green evidence: the new focused test first failed because
  `mathExpressions[].html` was `undefined`. After wiring
  `katex.renderToString(...)`, the focused KaTeX HTML run passed 17/17, the
  full Compile parser test passed 17/17, combined Compile/skeleton TypeScript
  tests passed 86/86, `npm run typecheck` passed, and
  `npm run test:contracts` passed 513/513.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T01:05:16.584Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 11:05:16 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 11:05 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 11:12 AEST:
- TypeScript Compile now has a reusable safe web artifact renderer:
  `renderCompileArtifactHtml(markdown)` emits a `loom-compile-artifact` article
  with frame sections, KaTeX inline/block math, reveal chips, unsupported-claim
  labels, and escaped ordinary text. This moves the KaTeX work from a detached
  parsed field toward a renderable web artifact surface.
- Red/green evidence: the focused renderer test first failed because
  `renderCompileArtifactHtml` was not exported. After implementation, it passed
  and verified two frame sections, KaTeX inline/display HTML, original TeX
  annotations, reveal output, `Unsupported claim`, escaped `<script>` text, and
  no raw `$...$` math delimiter leakage.
- Latest gates after this renderer slice passed: focused renderer/Compile run
  18/18, combined Compile/skeleton TypeScript tests 87/87,
  `npm run typecheck`, and `npm run test:contracts` 514/514.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T01:12:05.715Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 11:12:05 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 11:12 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 11:19 AEST:
- TypeScript Compile now has a React entry point for the safe web renderer.
  `components/CompileArtifactRenderer.tsx` wraps
  `renderCompileArtifactHtml(markdown)` in a `loom-compile-artifact-shell`
  surface and returns `null` for empty input, so React pages can expose the
  renderer without duplicating sanitizer/rendering logic.
- Global styling now covers the web Compile artifact surface:
  `loom-compile-artifact-shell`, `loom-compile-artifact`, frame sections,
  math blocks, reveal chips, unsupported-claim labels, and fallback notices.
  This is the first styled React/web surface for compiled artifacts; it does
  not close native iosMath-grade rendering or real provider-output acceptance.
- Red/green evidence: the new focused React renderer test first failed because
  `components/CompileArtifactRenderer` did not exist; the CSS contract first
  failed because `.loom-compile-artifact-shell` was missing; the first green
  retry exposed a `ReferenceError: React is not defined`, then passed after
  importing React. Latest gates passed: focused Compile renderer run 19/19,
  CSS contract 1/1, combined Compile/CSS/skeleton TypeScript tests 89/89,
  `npm run typecheck`, and `npm run test:contracts` 515/515.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`
  with bundle id `com.yinyiping.loom` and 637 static web files; `npm run
  app:where` reported the installed app at `2026-05-10T01:19:01.101Z`; and
  `stat` showed both the app bundle and executable modified at
  `2026-05-10 11:19:01 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`.
  The running process remains pid `38106`, started at
  `2026-05-10 08:12:47 AEST`, before the newly installed 11:19 bundle.
  Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 11:24 AEST:
- Web source reading now consumes the Compile artifact renderer instead of
  leaving it as an isolated component. `DocViewer` splits text/Markdown source
  bodies on `### Compiled · YYYY-MM-DD HH:MM` sections, renders those sections
  through `CompileArtifactRenderer`, and keeps surrounding ordinary source text
  on the existing paragraph path.
- Red/green evidence: the new focused DocViewer test first failed because the
  compiled section was still rendered as a raw paragraph containing
  `### Compiled · ...`, raw `$\\theta_t$`, and no
  `loom-compile-artifact-shell`. After implementation, the focused Compile run
  passed 20/20, combined Compile/CSS/skeleton TypeScript tests passed 90/90,
  and `npm run typecheck` passed.
- This makes compiled artifacts visible on the web source-reading path for
  text/Markdown bodies. It still does not close live provider-output
  acceptance, strict latest-binary installed-app UI acceptance, or native
  iosMath-grade rendering.

Update at 2026-05-10 11:27 AEST:
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T01:26:56.110Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 11:26:56 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")`,
  `get_app_state("com.yinyiping.loom")`, and `get_app_state("Loom.app")` all
  returned `cgWindowNotFound`. The running process remains pid `38106`,
  started at `2026-05-10 08:12:47 AEST`, before the newly installed 11:26
  bundle. Therefore this remains installed-bundle verification, not strict
  latest-binary UI acceptance.

Update at 2026-05-10 11:30 AEST:
- The current `https://flipdisc.io/` live capture verifier passed again with
  `bodyHasFlatFrameLine: false`, 70 blocks, 9 interactive artifacts, 31 media
  nodes, 10 code blocks, 91 links, 1 input mirror, 1 comparison slider,
  1 segment diagram, 3 animated canvases, and 3 source islands. The frame
  artifact still resolves as `0x80 -> 0x83 -> 0x01 -> imageData -> 0x8F`
  instead of flat reader text.
- The generated handoff fixture also verified cleanly with no unresolved media
  references, warnings, or errors. Remaining improvement is product/UI
  acceptance through the installed app window after a relaunch/fresh Computer
  Use session, not core flipdisc extraction quality.

Update at 2026-05-10 11:34 AEST:
- Compile's safe web artifact renderer now preserves ordered and unordered
  Markdown lists as list structure instead of collapsing algorithm steps and
  glossary bullets into paragraphs with line breaks. List items still pass
  through the same inline renderer, so KaTeX math, reveal chips, unsupported
  labels, and HTML escaping continue to apply inside each item.
- Red/green evidence: the new focused renderer test first failed because
  `1.` and `-` lines rendered inside `<p>` tags. After implementation, the
  Compile pipeline test file passed 21/21 and the global CSS contract passed
  1/1.
- Latest gates after the list-rendering slice passed: combined
  Compile/CSS/skeleton TypeScript tests 91/91, `npm run typecheck`,
  `npm run test:contracts` 517/517, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T01:37:03.935Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 11:37:03 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the newly installed 11:37 bundle. Therefore this remains
  installed-bundle verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 11:40 AEST:
- Compile's safe web artifact renderer now preserves fenced Markdown code
  blocks as safe `<pre><code>` artifact structure instead of folding the fence
  markers into paragraphs. Code block content is escaped and does not pass
  through inline reveal/math parsing; ordinary prose after the fence still
  receives inline KaTeX rendering.
- Red/green evidence: the new focused renderer test first failed because the
  code fence rendered inside a paragraph. After implementation, the Compile
  pipeline test file passed 22/22 and the global CSS contract passed 1/1.
- Latest gates after the fenced-code slice passed: combined Compile/CSS/skeleton
  TypeScript tests 92/92, `npm run typecheck`, `npm run test:contracts` 518/518,
  `git diff --check`, and `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T01:42:24.756Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 11:42:24 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the newly installed 11:42 bundle. Therefore this remains
  installed-bundle verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 11:46 AEST:
- Compile's safe web artifact renderer now preserves simple Markdown tables as
  table structure instead of collapsing glossary/comparison cards into
  paragraph line breaks. Table cells still pass through the inline renderer, so
  KaTeX math, reveal chips, unsupported labels, and HTML escaping continue to
  apply inside cells.
- Red/green evidence: the new focused renderer test first failed because the
  table rendered as a paragraph beginning `| Term | Meaning | Signal |`; the
  global CSS contract also failed on the missing table selector. After
  implementation, the Compile pipeline test file passed 23/23 and the global
  CSS contract passed 1/1.
- Latest gates after the table slice passed: combined Compile/CSS/skeleton
  TypeScript tests 93/93, `npm run typecheck`, `npm run test:contracts` 519/519,
  `git diff --check`, and `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T01:49:34.091Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 11:49:34 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the newly installed 11:49 bundle. Therefore this remains
  installed-bundle verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 11:56 AEST:
- Compile's safe web artifact renderer now preserves Markdown blockquotes as
  quote structure instead of collapsing quoted source claims into paragraphs
  with escaped `>` markers. Quote content still passes through the inline
  renderer, so KaTeX math, reveal chips, unsupported labels, and HTML escaping
  continue to apply inside quoted lines.
- Red/green evidence: the new focused renderer test first failed because the
  quote rendered as `<p>&gt; Source claim...`; the global CSS contract also
  failed on the missing blockquote selector. After implementation, the Compile
  pipeline test file passed 24/24 and the global CSS contract passed 1/1.
- Latest gates after the blockquote slice passed: combined
  Compile/CSS/skeleton TypeScript tests 94/94, `npm run typecheck`,
  `npm run test:contracts` 520/520, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T01:56:14.156Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 11:56:14 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 11:56 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:02 AEST:
- Compile's safe web artifact renderer now preserves Markdown strong/emphasis
  inline text as `strong`/`em` structure instead of leaving `**...**` and
  `*...*` markers in compiled paragraphs. Decorated text is still escaped
  before insertion, and math/reveal/unsupported inline markers continue to use
  their existing render paths.
- Red/green evidence: the new focused renderer test first failed because
  `**Loss surface**` and `*curved*` remained raw text; the global CSS contract
  also failed on the missing Compile emphasis selector. After implementation,
  the Compile pipeline test file passed 25/25 and the global CSS contract
  passed 1/1.
- Latest gates after the emphasis slice passed: combined
  Compile/CSS/skeleton TypeScript tests 95/95, `npm run typecheck`,
  `npm run test:contracts` 521/521, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:01:44.968Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:01:44 +1000`.
- Computer Use was retried after install. `list_apps` returned
  `connectionInvalid`, and `get_app_state("Loom")` /
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:01 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:09 AEST:
- Compile's parser now supports the stored-example reveal marker form
  `[term: label | explanation]` in addition to the normal
  `[label: explanation]` form. This keeps the term label visible as the reveal
  chip instead of incorrectly treating the literal word `term` as the concept.
- Red/green evidence: the new focused parser test first failed because
  `[term: gradient | The vector ...]` parsed as term `term` with the label and
  explanation merged into the body. After implementation, the Compile pipeline
  test file passed 26/26.
- Latest gates after the pipe-form reveal marker slice passed: combined
  Compile/CSS/skeleton TypeScript tests 96/96, `npm run typecheck`,
  `npm run test:contracts` 522/522, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:08:47.225Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:08:47 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:08 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:16 AEST:
- Compile's safe web artifact renderer now preserves safe Markdown links
  instead of leaking `[label](href)` syntax into compiled paragraphs. It emits
  `loom-compile-link` anchors only for `http:`, `https:`, and `mailto:` targets;
  unsafe schemes such as `javascript:` and `data:` are stripped to readable
  escaped label text.
- Red/green evidence: the new focused renderer test first failed because the
  link syntax stayed raw, and the global CSS contract first failed because the
  Compile link selector was missing. After implementation, the Compile pipeline
  test file passed 27/27 and the global CSS contract passed 1/1.
- Latest gates after the link-render slice passed: combined
  Compile/CSS/skeleton TypeScript tests 97/97, `npm run typecheck`,
  `npm run test:contracts` 523/523, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:15:43.420Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:15:43 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:15 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:23 AEST:
- Compile's safe web artifact renderer now preserves Markdown inline code
  spans as safe `loom-compile-inline-code` structure instead of leaving
  backticks in compiled paragraphs. Inline code content is escaped before
  insertion, so script text remains inert.
- Red/green evidence: the new focused renderer test first failed because
  `0x80` and `imageData` stayed wrapped in raw backticks; the global CSS
  contract first failed because the inline-code selector was missing. After
  implementation, the Compile pipeline test file passed 28/28 and the global
  CSS contract passed 1/1.
- Latest gates after the inline-code slice passed: combined
  Compile/CSS/skeleton TypeScript tests 98/98, `npm run typecheck`,
  `npm run test:contracts` 524/524, `git diff --check`, and
  `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:21:58.228Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:21:58 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:21 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:30 AEST:
- Native Compile preview now normalizes Markdown inline code markers in
  paragraph previews. `SourceFileView.compilePreviewArtifact` keeps inline code
  content visible, including literal script text, but no longer surfaces raw
  backticks such as `` `0x80` `` or `` `imageData` `` in the preview body.
- Red/green evidence: the new selected Swift test first failed because the
  preview paragraph still contained raw backticks; the new skeleton contract
  first failed because `compilePreviewCleanInlineCode` did not exist. After
  implementation, the selected Swift test passed 1/1 and the skeleton contract
  passed 69/69.
- Wider gates after the native inline-code preview slice passed: full
  `LoomDraftStoreTests` 58/58, `npm run typecheck`, `npm run test:contracts`
  524/524, `git diff --check`, and `git diff --cached --check`.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:29:30.238Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:29:30 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:29 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:39 AEST:
- Native Compile preview now normalizes Markdown links in paragraph previews.
  `SourceFileView.compilePreviewArtifact` keeps the readable link label while
  removing raw `[label](href)` markers and href text, including unsafe examples
  such as `javascript:alert(1)`.
- Red/green evidence: the selected Swift test first failed because the preview
  paragraph still contained raw Markdown link syntax and the unsafe href; the
  skeleton contract first failed because `compilePreviewCleanMarkdownLinks` did
  not exist. The first implementation pass exposed an additional bracket-depth
  edge case for hrefs containing parentheses, which was fixed before green.
  After implementation, the selected Swift test passed 1/1 and the skeleton
  contract passed 69/69.
- Wider gates after the native Markdown-link preview slice passed: full
  `LoomDraftStoreTests` 59/59, `npm run typecheck`, `npm run test:contracts`
  524/524.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:38:02.635Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:38:02 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:38 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance.

Update at 2026-05-10 12:47 AEST:
- Native Compile preview now normalizes Markdown emphasis markers in paragraph
  previews. `SourceFileView.compilePreviewArtifact` converts `**strong**`,
  `*emphasis*`, `__strong__`, and `_emphasis_` into readable text before
  displaying the native preview, so streamed provider Markdown no longer leaks
  raw emphasis syntax into the lightweight installed-app surface.
- Red/green evidence: the selected Swift test first failed because the preview
  paragraph still displayed `**strong signal**`, `*quiet note*`,
  `__primary claim__`, and `_secondary clue_`; the skeleton contract first
  failed because `compilePreviewCleanMarkdownEmphasis` did not exist. After
  implementation, the selected Swift test passed 1/1 and the skeleton contract
  passed 69/69.
- Wider gates after the native Markdown-emphasis preview slice passed: full
  `LoomDraftStoreTests` 60/60, `npm run typecheck`, and
  `npm run test:contracts` 524/524.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:46:17.924Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:46:17 +1000`.
- Computer Use was retried in this conversation and through a fresh
  `codex exec` fallback. Both saw `Loom - com.yinyiping.loom [running]`, but
  both `get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")`
  returned `cgWindowNotFound`. The running process remains pid `38106`, started
  at `2026-05-10 08:12:47 AEST`, before the installed 12:46 binary. Therefore
  this remains installed-bundle verification, not strict latest-binary UI
  acceptance, until the visible app is explicitly restarted/reopened.

Update at 2026-05-10 12:51 AEST:
- Native Compile preview now normalizes line-start Markdown list markers in
  paragraph previews. `SourceFileView.compilePreviewArtifact` removes unordered
  bullets such as `- First claim` and ordered markers such as `1. Calibrate`
  before the existing inline emphasis/math cleanup, so provider-produced list
  steps no longer show raw Markdown prefixes in the lightweight native preview.
- Red/green evidence: the selected Swift test first failed because the preview
  paragraph was `- First claim - Second signal 1. Calibrate θ 2. Export result`;
  the skeleton contract first failed because
  `compilePreviewCleanMarkdownListMarker` did not exist. After implementation,
  the selected Swift test passed 1/1 and the skeleton contract passed 69/69.
- Wider gates after the native Markdown-list preview slice passed: full
  `LoomDraftStoreTests` 61/61, `npm run typecheck`, and
  `npm run test:contracts` 524/524.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T02:53:56.067Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 12:53:56 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 12:53 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance, until the visible app is
  explicitly restarted/reopened.
- Final hygiene was rerun at `2026-05-10 12:56 AEST`: full
  `LoomDraftStoreTests` passed 61/61, `npm run typecheck` exited 0,
  `npm run test:contracts` passed 524/524, `npm run app:smoke` passed, and
  `git diff --check` / `git diff --cached --check` reported no whitespace
  errors.

Update at 2026-05-10 13:00 AEST:
- Native Compile preview now normalizes line-start Markdown blockquote markers
  in paragraph previews. `SourceFileView.compilePreviewArtifact` removes `>`
  prefixes before the existing list/link/emphasis/math cleanup, so quoted
  provider output no longer leaks raw Markdown quote markers into the
  lightweight native preview.
- Red/green evidence: the selected Swift test first failed because the preview
  paragraph was `> Key claim from source. > - Supporting θ detail`; the
  skeleton contract first failed because
  `compilePreviewCleanMarkdownBlockquoteMarker` did not exist. After
  implementation, the selected Swift test passed 1/1 and the skeleton contract
  passed 69/69.
- Wider gates after the native Markdown-blockquote preview slice passed: full
  `LoomDraftStoreTests` 62/62, `npm run typecheck`, and
  `npm run test:contracts` 524/524.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T03:02:36.200Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 13:02:36 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 13:02 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance, until the visible app is
  explicitly restarted/reopened.

Update at 2026-05-10 13:08 AEST:
- Native Compile preview now normalizes fenced-code marker lines in paragraph
  previews. `SourceFileView.compilePreviewArtifact` drops line-start
  triple-backtick and triple-tilde fence markers after optional blockquote
  stripping but before list/link/emphasis/math cleanup, so streamed provider
  output no longer shows raw code-fence syntax while preserving the code body.
- Red/green evidence: the selected Swift test first failed because the preview
  paragraph was `` `swift let frame = 0x80 ` Then explain theta.`` and the
  skeleton contract first failed because
  `compilePreviewCleanMarkdownCodeFenceMarker` did not exist. After
  implementation, the selected Swift test passed 1/1 and the skeleton contract
  passed 69/69.
- Wider gates after the native Markdown fenced-code preview slice passed: full
  `LoomDraftStoreTests` 63/63, `npm run typecheck`, and
  `npm run test:contracts` 524/524.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T03:08:23.132Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 13:08:23 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 13:08 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance, until the visible app is
  explicitly restarted/reopened.

Update at 2026-05-10 13:17 AEST:
- Compile prompts now pin mixed-language scratch to the latest natural-language
  segment in both TypeScript and native Swift prompt paths. The directive is
  provider-visible as `Scratch language directive`, with Chinese or English
  selected from the last sentence-like segment that contains natural-language
  CJK or Latin words. This narrows the plan's mixed-language requirement
  without making a live provider call.
- Red/green evidence: the new TS focused test first failed because the prompt
  did not include `Latest natural-language scratch segment: Chinese`; the new
  Swift focused test first failed with two missing directive assertions. After
  implementation, both focused tests passed.
- Wider gates after the mixed-language prompt slice passed: Compile TS suite
  29/29, full `LoomDraftStoreTests` 64/64, `npm run typecheck`, and
  `npm run test:contracts` 525/525. `npm run typecheck` initially caught
  `lib/new-loom/compile-pipeline.ts(235,10): error TS2532: Object is possibly
  'undefined'`; after changing the helper to use an empty-string fallback,
  typecheck exited 0 and `npm run test:contracts` was rerun successfully.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T03:16:45.099Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 13:16:45 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, started at `2026-05-10 08:12:47 AEST`,
  before the installed 13:16 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance, until the visible app is
  explicitly restarted/reopened.

Update at 2026-05-10 13:28 AEST:
- Compile's contradictory-thinking error UX from
  `plans/compile-pipeline-mvp.md §5.5` now has concrete parser/renderer and
  native-preview behavior. Both TypeScript and Swift prompt paths now instruct
  the provider to mark contradictions inline as `[user noted both: ...]`. The
  TypeScript parser exposes `contradictionAnnotations` / `contradictionCount`,
  the safe web renderer emits a `loom-compile-contradiction` inline annotation,
  and native `SourceFileView.compilePreviewArtifact` consumes the marker as a
  `Contradictory thinking` annotation instead of a reveal chip or unsupported
  claim.
- Red/green evidence: the TypeScript prompt/parser focused run first failed on
  the missing `[user noted both: ...]` prompt directive and missing
  `contradictionCount`; the selected Swift test first failed because
  `CompilePreviewArtifact` had no `contradictionCount`; and the skeleton
  contract first failed on missing native contradiction state. After the first
  implementation, Swift exposed a real ordering bug where Markdown-link cleanup
  swallowed the non-link marker close bracket; moving contradiction extraction
  before link cleanup made the selected Swift test pass.
- Wider gates after the contradiction-annotation slice passed: Compile TS suite
  30/30, full `LoomDraftStoreTests` 65/65, `npm run typecheck`, and
  `npm run test:contracts` 526/526.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id
  `com.yinyiping.loom` and 638 static web files; `npm run app:where` reported
  the installed app at `2026-05-10T03:27:55.181Z`; and `stat` showed both the
  app bundle and executable modified at `2026-05-10 13:27:55 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, command
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, started before
  this installed 13:27 binary. Therefore this remains installed-bundle
  verification, not strict latest-binary UI acceptance, until the visible app is
  explicitly restarted/reopened.

Update at 2026-05-10 13:39 AEST:
- Web Draft now exposes non-destructive attached-reference removal in both
  Source tiles and the References list. The new `Remove` controls detach the
  matching reference from the current draft and persist through the native-backed
  Draft bridge/browser fallback without deleting the original capture, source,
  or file.
- Red/green evidence: the focused skeleton contract first failed because
  `removeDraftReference` was absent. After implementation, the focused Draft
  tiling contract passed 1/1, the selected Draft streaming plus tiling contract
  passed 2/2, and full `tests/new-loom-skeleton-contract.test.ts` passed 69/69.
- Wider gates after the Draft reference-remove slice passed: `npm run typecheck`,
  `npm run test:contracts` 526/526, and `git diff --check` for the edited
  code/test files.
- The edited bundle was rebuilt and installed with `npm run app:user`.
  Post-install `npm run app:smoke` passed for
  `/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
  and 638 static web files; `npm run app:where` reported the installed app at
  `2026-05-10T03:38:58.315Z`; and `stat` showed both the app bundle and
  executable modified at `2026-05-10 13:38:58 +1000`.
- Computer Use was retried after install. `list_apps` sees
  `Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
  `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The
  running process remains pid `38106`, command
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, started at
  `2026-05-10 08:12:47 AEST`, before this installed 13:38 binary. Therefore
  this remains installed-bundle verification, not strict latest-binary UI
  acceptance, until the visible app is explicitly restarted/reopened.

Update at 2026-05-10 13:55 AEST:
- Phase 9 `The Year` now has the first live read-only annual material
  projection instead of only static explanatory copy. `lib/new-loom/year-surface.ts`
  builds a tested overview from captures, local files, and Question containers,
  grouping resolved items into 12 month columns and the shared
  `active / wintering / archived` buckets.
- Web `/year` now imports `YearClient`. The client hydrates installed-app
  captures through `loom://native/captures-list.json` only when `isNativeMode()`
  is true, derives local files from ingestion traces via `useAllTraces`, and
  subscribes to pursuit records through `loadPursuitRecords` and
  `loom-pursuits-updated`. The surface is read-only; it does not move, hide,
  archive, delete, or create user files.
- Red/green evidence: `tests/new-loom-wintering-state.test.ts` first failed
  because `lib/new-loom/year-surface.ts` was missing, and the focused skeleton
  contract first failed because `app/year/YearClient.tsx` was missing. After
  implementation, focused Year/wintering plus skeleton contracts passed 73/73
  and `npm run typecheck` exited 0.
- Browser acceptance: local dev `/year` opened with page title `The Year ·
  Loom`, 12 month columns, 3 state buckets (`active`, `wintering`, `archived`),
  the read-only warning, and corrected `365 quiet days` copy. Browser console
  still reported existing app-shell 404 probes for `/api/ai-key-status`,
  `/api/search-index`, and `/api/knowledge-nav`; no Year-specific `loom://`
  fetch was attempted in plain browser mode.

Update at 2026-05-10 14:02 AEST:
- Phase 10 `Working mode（公开版屏蔽私密）` now covers support surfaces that
  summarize user material, not only Source Index. `publicWorkingYearOverview`
  preserves `/year` month counts and `active / wintering / archived` buckets
  while replacing private capture/file/question titles and hrefs with generic
  `Web capture N`, `Local file N`, and `Question N` labels.
- `publicWorkingSourceConnections` preserves `/connections` graph counts,
  connection counts, and cross-origin counts while replacing source titles,
  domains, hrefs, correspondent labels, and anchor ids with generic `Source N`
  and `Correspondent N` labels.
- Web `/year` and `/connections` now read public working mode from the same
  query/localStorage helper as Source Index (`public=1`, `loom-public=1`,
  `working=public`, or `loom.publicWorkingMode`).
- Red/green evidence: focused Year public-mode test first failed because
  `publicWorkingYearOverview` was missing; focused Connections public-mode test
  first failed because `publicWorkingSourceConnections` was missing; and
  support-surface public-mode contract first failed because the clients did not
  read public working mode. After implementation the focused tests passed 5/5,
  3/3, and 4/4.
- Wider verification passed: `npm run typecheck` exited 0 and
  `npm run test:contracts` passed 530/530.
- Browser validation seeded temporary localhost IndexedDB/localStorage data
  with private file names, private question text, private domains, source
  titles, and anchor ids. `/year?public=1` rendered public labels (`Local file
  1`, `Question 1`) with no private string leaks; `/connections?public=1`
  rendered `Source 1`, `Source 2`, `Correspondent 1`, and `Correspondent 2`
  with no private domain/title/anchor leaks. The temporary browser data was
  removed afterward.

Update at 2026-05-10 14:10 AEST:
- `/connections` now has a concrete Draft handoff instead of being only a
  support visualization. `NewLoomSourceConnectionLink` keeps `fromHref` and
  `toHref`, and `sourceConnectionDraftHref(...)` creates a `/draft` URL with
  the two connected source references attached as `kind=source` entries.
- The generated excerpts preserve connection evidence (`Connection to ...`,
  reader-note count, and anchor ids), so Draft receives usable source context
  without creating a new connection entity or writing to the source files.
- Web `/connections` renders `Draft this connection` only outside public
  working mode. Public mode keeps the masked graph visible but prevents a
  private write/action handoff.
- Red/green evidence: `tests/new-loom-source-connections.test.ts` first failed
  on missing `fromHref` / `toHref`, missing `sourceConnectionDraftHref`, and
  unmasked public hrefs. `tests/new-loom-skeleton-contract.test.ts` first
  failed because `/connections` did not expose the Draft handoff. After
  implementation, focused source-connections passed 4/4 and the full skeleton
  contract passed 69/69.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  531/531, and `git diff --check`. Browser validation seeded temporary
  localhost traces, confirmed private `/connections` shows `Draft this
  connection` with both connected refs in the `/draft` URL, then confirmed
  `/connections?public=1` has the public banner, zero Draft connection actions,
  and no private title/domain/anchor leaks.
- Installed-bundle verification passed: `npm run app:user` rebuilt and
  installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`
  passed with 638 static web files; `npm run app:where` and `stat` showed the
  app bundle and executable at `2026-05-10 14:14:24 AEST`.
- Computer Use can read the current visible app window, but it remains pid
  `38106`, started at `2026-05-10 08:12:47 AEST`, before this installed
  bundle. Therefore this remains installed-bundle plus browser verification,
  not strict latest-binary installed UI acceptance until the visible app is
  explicitly restarted.

Update at 2026-05-10 14:25 AEST:
- Phase 9 `The Year` now returns annual material to Draft. `yearItemDraftHref`
  creates a `/draft` handoff for a resolved Year item with `ref`, `label`,
  `kind=capture|source`, `source`, and an excerpt containing the item class,
  wintering state, and month.
- Web `/year` renders `Draft this item` only when public working mode is off.
  Public mode keeps masked annual material visible while suppressing the Draft
  action, so demo surfaces do not expose private source refs.
- Red/green evidence: focused wintering/year first failed on missing
  `yearItemDraftHref`, and the skeleton contract first failed because
  `YearClient` did not expose the handoff. After implementation,
  `tests/new-loom-wintering-state.test.ts` passed 6/6 and
  `tests/new-loom-skeleton-contract.test.ts` passed 69/69.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  532/532, and `git diff --check`.
- Browser acceptance seeded a temporary localhost IndexedDB ingestion trace for
  `Year Private PDF`. Private `/year` showed `Draft this item` with
  `/draft?ref=file:///tmp/year-private.pdf&kind=source...` and `Year item:
  Local file` evidence; `/year?public=1` showed zero Draft item actions,
  masked the row as `Local file 1`, and did not leak the private title/path.
- Installed-bundle verification passed: `npm run app:user`, `npm run
  app:smoke` with bundle id `com.yinyiping.loom` and 638 static web files,
  `npm run app:where` reporting `2026-05-10T04:25:13.930Z`, and `stat`
  showing both `/Users/yinyiping/Applications/Loom.app` and its executable at
  `2026-05-10 14:25:13 +1000`.
- Computer Use read the current visible Loom window after install and saw the
  app running as pid `38106`, but that process started at
  `2026-05-10 08:12:47 AEST`, before the 14:25 installed bundle. Therefore
  latest-bundle verification is complete, while strict latest-binary installed
  UI acceptance still requires an explicit visible-app restart/reopen.

Update at 2026-05-10 15:35 AEST:
- Phase 10 `The Hour` now shows active current material instead of being only
  a timer-like support page. It derives current items from the same real
  material classes as `/year`: native captures, local-file ingestion traces,
  and Phase 7 question containers. The newest active items render in a
  `current material` section.
- `/hour` now returns current material to Draft. `hourItemDraftHref` creates a
  `/draft` handoff with `ref`, `label`, `kind=capture|source`, `source`, and
  an excerpt containing the item class, wintering state, and month.
- Public working mode is enforced on `/hour`: the current-material section is
  still visible, but private labels/hrefs are masked and
  `Draft this current item` is hidden.
- Red/green evidence: focused wintering/hour first failed because
  `lib/new-loom/hour-surface` was missing, and the skeleton contract first
  failed because `HourClient` did not read traces/material or expose the Draft
  handoff. After implementation, `tests/new-loom-wintering-state.test.ts`
  passed 7/7 and `tests/new-loom-skeleton-contract.test.ts` passed 69/69.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  533/533, and `git diff --check`.
- Browser acceptance seeded a temporary localhost IndexedDB ingestion trace for
  `Hour Private PDF`. Private `/hour` showed `Draft this current item` with a
  `/draft?ref=file:///tmp/hour-private.pdf&kind=source...` URL and `Current
  hour item: Local file` evidence; `/hour?public=1` showed zero Draft
  current-item actions, masked the row as `Local file 1`, and did not leak the
  private title/path.
- Installed-bundle verification passed: `npm run app:user`, `npm run
  app:smoke` with bundle id `com.yinyiping.loom` and 639 static web files,
  `npm run app:where` reporting `2026-05-10T05:32:39.839Z`, `stat` showing
  both `/Users/yinyiping/Applications/Loom.app` and its executable at
  `2026-05-10 15:32:39 +1000`, and a filesystem check showing
  `Contents/Resources/web/hour.html` plus `hour.txt`.
- Computer Use read the current visible Loom window after install and saw the
  app running as pid `38106`, but that process started at
  `2026-05-10 08:12:47 AEST`, before the 15:32 installed bundle. Shell
  `open 'loom://bundle/hour'` and `open 'loom://bundle/hour.html'` did not move
  the stale process off the existing flipdisc snapshot. Therefore latest-bundle
  verification is complete, while strict latest-binary installed UI acceptance
  still requires an explicit visible-app restart/reopen.

Update at 2026-05-10 15:45 AEST:
- Phase 10 public working mode now covers web Draft reference surfaces.
  `/draft?public=1` keeps the user's draft title/body visible but masks
  attached material as `Source reference N`, `Capture reference N`, `URL
  reference N`, or `Artifact state reference N`.
- Draft public mode hides affordances that would reveal private corpus state:
  `@ Reference`, source-tile open links, quote insertion, reference removal,
  and suggested references. Saved draft references are not mutated.
- Red/green evidence: focused Draft storage first failed because
  `publicWorkingDraftReferences` did not exist, and the skeleton contract first
  failed because `DraftClient` did not read public working mode. After
  implementation, `tests/new-loom-draft-storage.test.ts` passed 29/29 and
  `tests/new-loom-skeleton-contract.test.ts` passed 70/70.
- Wider verification passed: `npm run typecheck`, `npm run test:contracts`
  535/535, and `git diff --check`.
- Browser acceptance seeded a temporary localStorage draft with private capture,
  local-file, and artifact-state references. Private `/draft` showed the real
  labels, private excerpt, three `Remove reference` controls, and one
  `@ Reference` button. Public `/draft?public=1` showed generic reference
  labels, leaked none of the private labels, file URLs, excerpts, capture
  timestamps, source titles, or artifact-state labels, and exposed zero
  `@ Reference`, remove, insert-quote, or suggested-reference controls.
- Installed-bundle verification passed: `npm run app:user`, `npm run
  app:smoke` with bundle id `com.yinyiping.loom` and 639 static web files,
  `npm run app:where` reporting `2026-05-10T05:48:13.619Z`, `stat` showing
  both `/Users/yinyiping/Applications/Loom.app` and its executable at
  `2026-05-10 15:48:13 +1000`, and a filesystem check showing
  `Contents/Resources/web/draft.html` plus `draft.txt`.
- Computer Use read the current visible Loom window after install and saw the
  app running as pid `38106`, but that process started at
  `2026-05-10 08:12:47 AEST`, before the 15:48 installed bundle, and it remains
  on the older flipdisc snapshot. Therefore latest-bundle verification is
  complete, while strict latest-binary installed UI acceptance still requires
  an explicit visible-app restart/reopen.

Update at 2026-05-10 15:58 AEST:
- The iWork importer fidelity gap was narrowed without touching real user
  files or the installed app. `SlideDeckExtractor` now first reads framed IWA
  text payloads (`00 03 ... 00 00 04`) when present, decodes each payload as
  clean UTF-8 or UTF-16LE, preserves original payload order, and reconstructs
  Keynote output as `iWork slide reconstruction` and Pages output as
  `iWork page reconstruction`.
- This fixes the previous flat `iWork body text` behavior for recoverable
  framed payloads, where UTF-8 and UTF-16 scans could reorder body lines or
  include false UTF-16 noise. The generic text-run scan remains as a fallback
  when framed payloads are unavailable.
- Red/green evidence: the new selected Swift tests first failed because the
  importer still emitted a flat `iWork body text` section and mixed noisy /
  reordered runs. After implementation,
  `testParseKeynoteIWorkArchiveReconstructsSlideSequenceFromIWAStrings` and
  `testParsePagesIWorkArchiveReconstructsPageSequenceFromIWAStrings` passed
  2/2.
- Wider verification passed: full `SlideDeckExtractorTests` 16/16 with
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
  -scheme Loom -configuration Debug -destination 'platform=macOS,arch=arm64'
  -only-testing:LoomTests/SlideDeckExtractorTests test`.
- This is still not full iWork protobuf/layout reconstruction, QuickLook visual
  layout acceptance, or real-user-file installed-app acceptance.

Update at 2026-05-10 16:10 AEST:
- The installed-app smoke gate now separates bundle verification from strict
  latest-binary UI acceptance. `scripts/installed-app-smoke.mjs` reports
  running `Loom.app` processes, warns when the installed app process started
  before the current installed executable, and warns when a non-installed
  `Loom.app` process is also running.
- Two opt-in strict modes were added for acceptance gates:
  `LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1` fails if the running installed process
  is older than the installed executable, and
  `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1` fails if a DerivedData or other
  non-installed `Loom.app` process is still running.
- Red/green evidence: `tests/loom-app-scripts.test.ts` first failed because
  `inspectRunningLoomProcesses` did not exist, then passed 31/31 after the
  process inspection was added.
- Live local evidence after the user-reported duplicate icon cleanup:
  `npm run app:smoke` passed and printed the stale-process warning for pid
  `38106`; `LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm run app:smoke` failed with
  `running installed Loom process 38106 is older than
  /Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`; and
  `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1 npm run app:smoke` passed, confirming
  no non-installed `Loom.app` process remains after cleaning the DerivedData
  debug process and Launch Services registrations.

Update at 2026-05-10 16:14 AEST:
- Computer Use acceptance on the visible installed app
  `com.yinyiping.loom` pid `38106` verified the real UI, not just screenshots.
  Source Index now shows `4` captures and each Recent Captures row exposes a
  visible, accessible `Delete` control. Opening the first flipdisc capture
  shows the capture detail toolbar with `Print`, `Markdown`, `Edit`,
  `Distill`, `Source snapshot`, `Open original`, `Re-capture`, and `Delete`.
- The Delete control was not clicked because capture deletion is destructive;
  this pass verifies presence and accessibility only.
- Fresh verification passed after the Computer Use check:
  `npx tsx --test tests/loom-app-scripts.test.ts` 31/31,
  `npm run typecheck`, `npm run test:contracts` 536/536,
  `git diff --check`, and `git diff --cached --check`.
- Fresh app smoke matched the acceptance boundary: normal `npm run app:smoke`
  passed with the stale-process warning; `LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1`
  failed as expected because pid `38106` predates the installed executable; and
  `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1` passed, confirming the duplicate
  non-installed `Loom.app` process remains cleared.

Update at 2026-05-10 16:24 AEST:
- Compile/Draft output quality was deepened without touching live user data,
  relaunching the visible installed app, or making any provider calls. The web
  Compile renderer now preserves Markdown task lists as read-only checklist
  structure instead of rendering raw `[x]` / `[ ]` markers inside ordinary
  unordered lists. The renderer still sanitizes scripts and continues to render
  inline math and reveal markers inside task text.
- Native Compile preview now preserves task lists, blockquotes, and fenced code
  as distinct preview blocks. Task items are normalized to `Done:` / `Open:`
  lines for the native review surface, blockquotes render with their own kind,
  and fenced code keeps literal code content, including inline backticks.
  Existing regular-list preview behavior remains covered by the older test.
- Red/green evidence: the new TypeScript task-list test first failed because
  the renderer emitted `loom-compile-list--unordered` with visible raw checklist
  markers. The new Swift selected test first failed because
  `CompilePreviewBlock.Kind` had no `list`, `quote`, or `code` cases. After
  implementation, focused task-list TS passed 31/31, the selected Swift test
  passed 1/1, full Compile TS passed 31/31, full `LoomDraftStoreTests` passed
  66/66, `npm run typecheck` passed, and `npm run test:contracts` passed
  537/537.
- This slice has not been rebuilt into the installed app or accepted through
  Computer Use. Strict latest-binary installed UI acceptance still requires an
  explicit visible-app restart/reopen because pid `38106` remains older than
  the latest installed bundle.
- Final hygiene rerun at 2026-05-10 16:26 AEST passed: `git diff --check`,
  `git diff --cached --check`, full Compile TS 31/31, `npm run typecheck`,
  `npm run test:contracts` 537/537, and full `LoomDraftStoreTests` 66/66.
  A process check after the Xcode run found only the stale installed
  `/Users/yinyiping/Applications/Loom.app` pid `38106`; no DerivedData/debug
  `Loom.app` process remained.

Update at 2026-05-10 16:31 AEST:
- Native Compile preview now preserves simple Markdown tables as their own
  `table` block instead of flattening raw pipe rows into paragraphs. Header and
  row cells are normalized into a readable monospaced preview, inline math and
  reveal markers are still cleaned inside cells, and the raw separator row
  (`| --- |`) no longer appears in the rendered preview body.
- Red/green evidence: the new selected Swift test first failed because
  `CompilePreviewBlock.Kind` had no `table` case; the first implementation pass
  then caught an ambiguous Swift `prefix` call before runtime. After the parser
  and preview block rendering were fixed, the selected table test passed 1/1,
  full `LoomDraftStoreTests` passed 67/67, `npm run typecheck` passed, and
  `npm run test:contracts` passed 537/537.
- This slice was not rebuilt into the installed app and did not relaunch the
  visible stale pid `38106`. It is code/test acceptance for native Compile
  rendering, not strict latest-binary installed UI acceptance.

Update at 2026-05-10 16:38 AEST:
- Computer Use re-read the visible installed app before this code slice and
  confirmed the flipdisc capture detail toolbar exposes an accessible
  `Delete capture` button. The destructive Delete action was not clicked.
- Compile table parsing now accepts common Markdown tables without outer pipes,
  e.g. `Term | Meaning` plus `--- | ---`, on both web Compile artifact
  rendering and native Compile preview. This closes the gap where provider or
  LLM markdown could render as one paragraph with raw separator rows unless it
  used the stricter `| Term | Meaning |` shape.
- Red/green evidence: the new TypeScript table test first failed because the
  web renderer produced a paragraph instead of `<table
  class="loom-compile-table">`; the new Swift selected test first failed
  because native preview emitted `[.heading, .paragraph]` instead of
  `[.heading, .table]`. After the parser updates, focused tests passed, full
  Compile TS passed 32/32, full `LoomDraftStoreTests` passed 68/68,
  `npm run typecheck` passed, and `npm run test:contracts` passed 538/538.
- Process acceptance remains honest: the Xcode test run left no extra
  DerivedData/debug `Loom.app`; process check still found only the stale
  installed `/Users/yinyiping/Applications/Loom.app` pid `38106`. This slice
  was not rebuilt into the installed app and did not relaunch that visible
  process, so strict latest-binary installed UI acceptance remains open.

Update at 2026-05-10 16:41 AEST:
- Web Compile rendering now accepts tilde fenced code blocks (`~~~js`) in
  addition to backtick fences. This matches native preview behavior and keeps
  LLM/provider Markdown from leaking `~~~` markers into ordinary paragraphs.
- Red/green evidence: the new TypeScript test first failed because the web
  renderer emitted a paragraph containing `~~~js`; after the fence parser was
  widened, focused Compile TS passed 33/33, full Compile TS passed 33/33,
  `npm run typecheck` passed, and `npm run test:contracts` passed 539/539.
- No installed-app rebuild, visible-app relaunch, destructive action, or
  provider call happened in this slice.

Update at 2026-05-10 20:57 AEST:
- Native `.pages` imports now route through the typed iWork/slide-deck
  extractor instead of falling back to `generic-doc`. The parser already
  handled `.pages` ZIP package metadata and IWA body recovery; this closes the
  registry matcher gap so Pages packages are selected at the same high score as
  `.pptx` and `.key`.
- Red evidence: the new `SlideDeckExtractorTests` assertion first failed with
  `.pages` scoring `0.0` instead of `0.9`; the `TypedExtractorMatchTests`
  registry assertion also failed because `brief.pages` routed to `generic-doc`
  instead of `slide-deck`.
- Green evidence after the matcher update: focused Swift checks passed for the
  `.pages` score and registry route, full `SlideDeckExtractorTests` passed
  16/16, full `TypedExtractorMatchTests` passed 7/7, `npm run typecheck`
  passed, and `npm run test:contracts` passed 539/539.
- This was a code/test-only iWork importer slice: no real user files were
  imported, no provider calls were made, no destructive actions were taken, and
  the visible installed app was not relaunched.

Update at 2026-05-10 21:02 AEST:
- Native Collect's local-file drop zone now names the importer surface more
  honestly: Markdown, PDF, DOCX, slides, Pages, and images. The secondary hint
  now also says PPTX/Keynote/Pages preserve metadata/text and images keep OCR,
  semantic labels, and visual provenance, matching the implemented importer
  behavior instead of advertising only `.pptx`.
- Red/green evidence: the updated new-Loom contract first failed because
  `IngestionView` still rendered the old `.md / .txt / .pdf / .docx / .pptx /
  images` copy. After the native text update and related assertion cleanup,
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 70/70 and a
  selected Swift `xcodebuild` test rebuilt the native target successfully.
- This slice changed user-visible native copy and registry comments only. No
  real user files, provider calls, destructive actions, installed-app rebuild,
  or visible-app relaunch happened.

Update at 2026-05-10 21:06 AEST:
- Native Keyboard Help now uses the same expanded Collect file-support copy as
  the Collect surface: PDFs, DOCX, slides, Pages, Markdown, and images. This
  closes the second visible stale-file-support hint after the importer grew
  beyond `.pptx` and images.
- Red/green evidence: the new contract expectation first failed because
  `KeyboardHelpView` still said `PDFs, slides, Markdown, and images`; after
  updating both shortcut-help entries, the focused new-Loom contract passed
  70/70 and a selected Swift `xcodebuild` test rebuilt the native target. The
  Swift run emitted only pre-existing macOS `activateIgnoringOtherApps`
  deprecation warnings.
- This was copy/test alignment only. No real user files, provider calls,
  destructive actions, installed-app rebuild, or visible-app relaunch happened.

Update at 2026-05-10 21:09 AEST:
- `docs/loom.md` now carries the same expanded local-file importer scope in
  its top "MISSING / NEXT" summary: PDF / PPTX / Keynote / Pages / Markdown /
  text / DOCX / RTF / image. The Phase 6 Drag-to-import line also names slides,
  Pages, DOCX, Markdown, and images instead of the old narrower PDF/PPT/MD
  shorthand.
- Red/green evidence: the new contract assertion first failed because
  `docs/loom.md` still summarized the active checkout as only `PDF / PPTX /
  Markdown / DOCX / image`; after the doc update and newline-tolerant assertion
  fix, the focused new-Loom contract passed 70/70.
- This was documentation/test alignment only. No real user files, provider
  calls, destructive actions, installed-app rebuild, or visible-app relaunch
  happened.

Update at 2026-05-10 21:13 AEST:
- `docs/loom.md` now also fixes the Plate II local-file support table. The
  table no longer describes `DOCX / Pages` as a Pandoc placeholder; it lists
  `PPTX / Keynote / Pages` as the P0 iWork/native path with page or slide
  grouping, metadata, IWA body text, and original-file preservation. DOCX, RTF,
  and text are now described separately as text extraction plus origin metadata.
- Red/green evidence: the new contract assertion first failed on the stale
  `PPTX / Keynote` and `DOCX / Pages | Pandoc 转 MD` rows. After the doc table
  update, `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  --test-name-pattern 'native iWork import preserves Keynote and Pages package
  metadata'` passed 70/70.
- Post-slice gates: `npm run typecheck` passed, `npm run test:contracts`
  passed 539/539, `git diff --check` passed, `git diff --cached --check`
  passed, and the process check still found only the stale installed
  `/Users/yinyiping/Applications/Loom.app` pid `38106`.
- This was documentation/test alignment only. No real user files, provider
  calls, destructive actions, installed-app rebuild, or visible-app relaunch
  happened.

Update at 2026-05-10 21:18 AEST:
- The prompt-to-artifact checklist itself is now contract-covered so it cannot
  silently drift behind the implementation evidence. The checklist explicitly
  names the current covered state plus the still-open product gates: strict
  latest-binary installed-app UI acceptance, real user-file installed-app
  importer acceptance, and live provider-output Compile/Draft acceptance.
- Red/green evidence: the new checklist contract first failed because the audit
  still referenced the old `npm run test:contracts` 212/212 era and did not
  name the latest open gates in one checklist. After the checklist refresh,
  focused `tests/new-loom-skeleton-contract.test.ts` passed 71/71.
- Post-slice gates: `npm run typecheck` passed, `npm run test:contracts`
  passed 540/540, `git diff --check` passed, `git diff --cached --check`
  passed, and the process check still found only the stale installed
  `/Users/yinyiping/Applications/Loom.app` pid `38106`.
- No installed-app rebuild, visible-app relaunch, real user-file import, real
  provider call, or destructive delete click happened.

Update at 2026-05-10 21:22 AEST:
- The Hour now treats "current material" as active material only. If Source
  Index material has rested into `wintering` or `archived`, `/hour` now shows
  the empty current-material state instead of reviving rested items as current
  work.
- Red/green evidence: the new `new Loom Hour does not revive rested material
  when there is no active item` test first failed because
  `currentHourItemsFromYearOverview(...)` returned a wintering question and an
  archived capture when the active bucket was empty. After the function stopped
  falling back to `overview.items`, `npx tsx --test
  tests/new-loom-wintering-state.test.ts --test-name-pattern 'new Loom Hour'`
  passed 8/8, and the focused `/hour` new-Loom contract passed 71/71.
- Post-slice gates: `npm run typecheck` passed, `npm run test:contracts`
  passed 541/541, `git diff --check` passed, `git diff --cached --check`
  passed, and the process check still found only the stale installed
  `/Users/yinyiping/Applications/Loom.app` pid `38106`.
- No installed-app rebuild, visible-app relaunch, real user-file import, real
  provider call, or destructive delete click happened.

Update at 2026-05-10 21:31 AEST:
- Computer Use can read the visible installed app again. It still reports
  `/Users/yinyiping/Applications/Loom.app` pid `38106`, command
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, on the
  Flipdisc Source detail. The visible reader exposes `Print`, `Markdown`,
  `Edit`, `Distill`, `Source snapshot`, `Open original`, `Re-capture`, and
  `Delete capture`; the destructive delete action was not clicked.
- The post-Hour verification was rerun after the docs/test count update:
  `npx tsx --test tests/new-loom-wintering-state.test.ts` passed 8/8,
  the focused prompt-to-artifact skeleton contract passed 71/71,
  `npm run typecheck` exited 0, and `npm run test:contracts` passed 541/541.
- This remains latest-source and visible-stale-process acceptance. The current
  source slices have not been rebuilt into or relaunched as the visible
  installed process, no real user files were imported, no provider calls were
  made, and no destructive action was taken.

Update at 2026-05-10 21:49 AEST:
- The iWork body reconstruction gap is narrower again. `SlideDeckExtractor`
  now preserves standalone `Slide N` / `Page N` marker rows emitted from IWA
  text runs and treats the next useful row as that slide or page title instead
  of dropping the short marker and flattening the following rows into `iWork
  body text`.
- Red/green evidence: the new Keynote fixture test first failed with a flat
  `iWork body text` section containing `Market design overview` and `Matching
  markets allocate scarce seats` instead of `Slide 1: Market design overview`.
  After preserving standalone markers and adding the same Pages fixture shape,
  the two focused Swift tests passed, and full `SlideDeckExtractorTests`
  passed 18/18.
- The duplicate Loom icon symptom was traced to a generated
  `DerivedData/.../Build/Products/Debug/Loom.app` produced by Xcode test runs,
  not a second installed app. The generated Debug bundle was unregistered from
  LaunchServices and removed. `mdfind 'kMDItemCFBundleIdentifier ==
  "com.yinyiping.loom"'` now returns only
  `/Users/yinyiping/Applications/Loom.app`, the process check finds only pid
  `38106` from that installed bundle, and Computer Use reads that same visible
  installed app. The destructive `Delete capture` control remains visible but
  was not clicked.
- Post-slice gates passed: `npm run typecheck`, `npm run test:contracts`
  541/541, `git diff --check`, and `git diff --cached --check`.
- This slice did not rebuild or relaunch the visible installed app, did not
  import real user files, did not call a provider, and did not click a
  destructive action. Strict latest-binary UI acceptance, real user-file UI
  importer acceptance, and live provider-output acceptance remain open.

Update at 2026-05-10 21:58 AEST:
- The iWork reconstruction state machine now also dedupes repeated standalone
  and labeled markers for the same slide or page. A run sequence like `Slide
  1`, then `Slide 1: Market design overview`, now emits only `Slide 1: Market
  design overview` instead of inserting a stray standalone `Slide 1` line
  before the real title. The same rule applies to Pages `Page N` markers.
- Red evidence: the two new Swift tests first failed exactly on the duplicate
  marker output: `iWork slide reconstruction\nSlide 1\nSlide 1: Market design
  overview...` and `iWork page reconstruction\nPage 1\nPage 1: Learning loop
  overview...`.
- Green evidence: after dropping a pending standalone marker when the following
  labeled marker has the same number, the two focused duplicate-marker tests
  passed, and full `SlideDeckExtractorTests` passed 20/20.
- Post-slice gates passed: `npm run typecheck`, `npm run test:contracts`
  541/541, `git diff --check`, and `git diff --cached --check`. After the
  Xcode run, the generated DerivedData Debug `Loom.app` was unregistered and
  removed again; `mdfind` lists only `/Users/yinyiping/Applications/Loom.app`,
  the process check finds only installed pid `38106`, and Computer Use reads
  that same visible installed app.
- No installed-app rebuild, visible-app relaunch, real user-file import,
  provider call, or destructive action happened in this slice.

Update at 2026-05-10 22:04 AEST:
- The production iWork QuickLook preview lookup now matches the real-file
  verifier. `SlideDeckExtractor` accepts the canonical `QuickLook/Preview.pdf`
  path and nested `.../preview.pdf` entries instead of only the exact root
  location. This keeps `.key` / `.pages` parsing from silently dropping preview
  PDF text in packages whose preview is nested below another directory.
- Red evidence: the new `preview-nested.pages` fixture first parsed only iWork
  metadata and failed to include `iWork QuickLook preview` or `Nested QuickLook
  preview evidence`.
- Green evidence: after widening the preview-entry match, the focused nested
  QuickLook test passed, and full `SlideDeckExtractorTests` passed 21/21.
- Post-slice gates passed: `npm run typecheck`, `npm run test:contracts`
  541/541, `git diff --check`, and `git diff --cached --check`. The generated
  DerivedData Debug `Loom.app` was unregistered and removed after Xcode tests;
  `mdfind` lists only `/Users/yinyiping/Applications/Loom.app`, and the process
  check finds only installed pid `38106`.
- This was a fixture/test plus local parser parity slice. No installed-app
  rebuild, visible-app relaunch, real user-file import, provider call, or
  destructive action happened.

Update at 2026-05-10 22:22 AEST:
- The new iWork importer fidelity is now covered by the new-Loom skeleton
  contract, not only by `SlideDeckExtractorTests`. The contract now requires
  the duplicate standalone-marker tests, nested QuickLook fixture/test, nested
  `.../preview.pdf` production match, and the product matrix row that names
  QuickLook preview text plus marker dedupe.
- Red/green evidence: the tightened contract first failed because the local
  file support matrix still summarized `PPTX / Keynote / Pages` as metadata
  plus IWA body text only. After updating the matrix row, the focused contract
  passed and full `npm run test:contracts` reports 542/542.
- The visible installed Draft screenshot exposed a real minimal-mode layout
  bug: `LoomDraftView` is a native `HSplitView` mounted under a transparent
  `fullSizeContentView` titlebar, so at narrow widths the `Untitled draft`
  field could collide with the toolbar. `LoomMinimalRootView` now gives the
  Draft detail pane a 44pt top clearance under the titlebar.
- Red/green evidence: the new contract `native Draft leaves top clearance under
  transparent titlebar chrome` first failed because Draft mounted as a bare
  `LoomDraftView()`, then passed after adding
  `minimalDetailToolbarClearance` and applying it to the Draft pane.
- Swift build evidence: `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project
  macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug build
  -quiet` exited 0 with only pre-existing `activateIgnoringOtherApps`
  deprecation warnings. The generated DerivedData Debug app was unregistered
  and removed; `mdfind` lists only `/Users/yinyiping/Applications/Loom.app`,
  and the process check still shows only installed pid `38106`.
- This fixed source and verified build/contracts, but did not replace or
  relaunch the visible installed app. Strict latest-binary UI acceptance, real
  user-file installed-app importer acceptance, and live provider-output
  Compile/Draft acceptance remain open.

Update at 2026-05-10 22:28 AEST:
- Post-compaction verification was rerun from scratch. `npm run typecheck`
  exited 0, full `npm run test:contracts` reports 542/542, `git diff --check`
  and `git diff --cached --check` exited 0, and `LOOM_SKIP_WEB_STAGE=1
  xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom
  -configuration Debug build -quiet` exited 0 with only the existing
  `activateIgnoringOtherApps` deprecation warnings.
- Computer Use acceptance reattached to the currently running installed app at
  pid `38106` (`/Users/yinyiping/Applications/Loom.app`) and confirmed the
  user-reported Draft overlap is still visible there: `Untitled draft` is
  selected under the floating toolbar. This is expected because the fixed
  source has not been installed or relaunched into that running app.
- The Xcode-generated DerivedData Debug app was unregistered and removed after
  build verification. `mdfind` lists only `/Users/yinyiping/Applications/Loom.app`
  for bundle id `com.yinyiping.loom`.
- Remaining explicit-approval gates are unchanged: replace/relaunch the visible
  installed app and re-run strict UI acceptance, import real user files through
  the installed UI, and run live provider-output Compile/Draft acceptance.

Update at 2026-05-10 22:33 AEST:
- Compile quality acceptance was tightened without making a provider call.
  `compileManualQualityCases()` now gives each of the five manual review cases
  a provider-like exemplar output, and
  `evaluateCompileManualQualityCaseOutput(...)` checks the deterministic
  visible signals through the normal Compile parser.
- Red/green evidence: the new focused test first failed because the evaluator
  was not exported. After adding exemplar outputs and signal evaluation, `npx
  tsx --test tests/new-loom-compile-pipeline.test.ts --test-name-pattern
  'Compile manual quality case exemplars satisfy their deterministic visible
  signals'` passed 34/34.
- Post-slice gates passed: `npx tsx --test
  tests/new-loom-compile-pipeline.test.ts` 34/34, `npm run
  test:contracts` 543/543, `npm run typecheck`, `git diff --check`, and
  `git diff --cached --check`.
- This closes only the local shape-flattening gap for the manual quality cases:
  frames, block math, reveal markers, ordered steps, article paragraphs, and
  contradiction annotations are now checked before a live run. It still does
  not close real AI output review, product-owner quality acceptance, live
  provider-request body acceptance, real user-file UI acceptance, or strict
  latest-binary installed UI acceptance.

Update at 2026-05-10 22:42 AEST:
- Compile quality cases now have a repeatable no-provider command gate:
  `npm run verify:compile-quality` passed all five manual quality case
  exemplars.
- Fresh local evidence after adding the standalone verifier: `npx tsx --test
  tests/new-loom-compile-pipeline.test.ts` passed 35/35, `npm run
  test:contracts` passed 544/544, and `npm run typecheck` exited 0.
- This still does not close the approval-bound gates: latest-binary installed
  UI acceptance after replacing/relaunching the visible app, real user-file
  importer acceptance through the installed UI, live provider-output
  Compile/Draft acceptance, or product-owner quality acceptance.

Update at 2026-05-10 22:45 AEST:
- Computer Use read the visible installed app without clicking or typing. The
  app is still `com.yinyiping.loom` pid `38106`, showing the Draft surface with
  `Untitled draft` visually under the floating toolbar.
- Treat the Draft titlebar fix as source/test verified but not strict
  latest-binary UI accepted. The visible app was not replaced, quit, relaunched,
  or otherwise disturbed in this check.

Update at 2026-05-10 22:50 AEST:
- Draft inline reference resolution gained a small source-grounding slice.
  `@flipdisc` now resolves to an attached `Flipdisc Display Build and Software
  Guide` reference when that alias is unique, while ambiguous aliases such as
  `@econ` across multiple ECON sources remain `source=unattached`.
- The inline parser also strips sentence-ending punctuation from the target, so
  `@econ.` is treated as `@econ`.
- Red/green evidence: the focused test first failed with `source=unattached`
  for `@flipdisc`; after the resolver change,
  `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern
  'Draft inline @references resolve short source aliases only when unambiguous'`
  passed 30/30.

Update at 2026-05-10 22:54 AEST:
- The same short-alias rule now covers selected corpus hits too. A unique
  corpus-supplied `Flipdisc Display Build and Software Guide` can resolve from
  `@flipdisc`, while multiple ECON corpus hits keep `@econ` unattached.
- Red/green evidence: the focused corpus-alias test first failed with
  `source=unattached` for `@flipdisc`; after extending the unique scored match
  to corpus hits, `npx tsx --test tests/new-loom-draft-storage.test.ts
  --test-name-pattern 'Draft inline @references resolve short corpus aliases
  only when unambiguous'` passed 31/31.

Update at 2026-05-10 23:09 AEST:
- Draft references now preserve corpus location metadata instead of reducing a
  corpus hit to title/href. Web Draft references can carry `category` and
  `sourcePath` through `draftReferenceFromCorpusDoc`, de-duplication upgrades,
  metadata-change detection, attached-reference prompt lines, and short-alias
  matching.
- Native Draft mirrors the same contract: `LoomDraftReference` carries
  `category` and `sourcePath`, JSON/Markdown sidecars preserve `Category:` and
  `Source path:`, `LoomDraftAIPrompt` and native inline edit prompts include
  the fields, and `AskAIDocRef`-backed `@reference` insertion passes them into
  attached references when available.
- Red/green evidence: the new web test first failed because
  `draftReferenceFromCorpusDoc` omitted `category/sourcePath`; the first native
  focused run failed because `LoomDraftReference` and `AskAIDocRef` had no such
  fields. After the fix, `npx tsx --test tests/new-loom-draft-storage.test.ts`
  passed 32/32, focused native `LoomDraftStoreTests` passed 4/4, full
  `LoomDraftStoreTests` passed 70/70, `npm run test:contracts` passed 547/547,
  and `npm run typecheck` exited 0.

Update at 2026-05-10 23:14 AEST:
- Computer Use could list the running `Loom — com.yinyiping.loom` app, but
  `get_app_state` returned `cgWindowNotFound`, so no fresh installed-app window
  tree was captured for this metadata slice.
- Read-only process checks show the visible installed process is still pid
  `38106`, launched from `/Users/yinyiping/Applications/Loom.app` at
  2026-05-10 08:12:47. The Xcode test-created DerivedData Debug app was
  unregistered and removed afterward; `mdfind` again lists only the user
  installed app for bundle id `com.yinyiping.loom`.

Update at 2026-05-10 23:25 AEST:
- Native Draft prompt resolution now matches the web short-alias rule. The
  Swift `LoomDraftInlineReferenceParser` first exact-matches attached
  references/corpus hits, then allows a unique scored alias such as
  `@flipdisc`, while ambiguous aliases such as `@econ` remain
  `source=unattached`. Sentence-ending punctuation is trimmed from native
  targets too, so `@econ.` is parsed as `@econ`.
- Red/green evidence: the focused native short-alias tests first failed with
  `source=unattached` for `@flipdisc`; after the native resolver change,
  focused `xcodebuild ... -only-testing:LoomTests/LoomDraftStoreTests/testDraftAIPromptResolvesShortInlineReferenceAliasesWhenUnambiguous
  -only-testing:LoomTests/LoomDraftStoreTests/testDraftAIPromptResolvesShortCorpusAliasesWhenUnambiguous`
  passed 2/2, and full `xcodebuild ... -only-testing:LoomTests/LoomDraftStoreTests`
  passed 72/72.
- To satisfy the user's "统一到一个" request after Xcode tests, the generated
  DerivedData Debug `Loom.app` was unregistered and deleted. `mdfind` now lists
  only `/Users/yinyiping/Applications/Loom.app` for bundle id
  `com.yinyiping.loom`, and `pgrep -fl Loom` shows only installed pid `38106`.
  Computer Use then read `com.yinyiping.loom` at pid `38106` and `list_apps`
  showed a single running `Loom — com.yinyiping.loom`. The visible installed
  app was not replaced or relaunched in this slice.

Update at 2026-05-10 23:37 AEST:
- ThinkingDraft block operations now show a reviewable diff before Apply on web
  and native Draft. The shared web helper
  `draftBlockOperationDiffHunks(...)` and native
  `LoomThinkingDraft.operationDiffHunks(...)` reuse the inline-edit hunk model
  while filtering blank separator hunks, so multi-block rewrites expose removed
  and added lines before the body changes.
- Red/green evidence: the new web storage test first failed because
  `draftBlockOperationDiffHunks` did not exist; the new native focused test
  first failed because `LoomThinkingDraft.operationDiffHunks` did not exist;
  and the skeleton contract first failed on the missing exported helper. After
  implementation, focused web storage passed 33/33, focused skeleton passed
  72/72, focused native passed 1/1, full
  `tests/new-loom-draft-storage.test.ts` passed 33/33, full
  `tests/new-loom-skeleton-contract.test.ts` passed 72/72, and full
  `LoomDraftStoreTests` passed 73/73.
- This was source/test verified only. The visible installed app was not
  replaced or relaunched, so strict latest-binary UI acceptance remains open.

Update at 2026-05-10 23:48 AEST:
- Compile prompt source-grounding was tightened without making a provider call.
  The TypeScript `buildCompilePrompt(...)` and native Swift
  `LoomCompilePipeline.buildPrompt(...)` now both explicitly tell providers not
  to add information the user did not write and to mark claims that are not
  grounded in scratch, source, notes, or attached references as `(unsupported)`.
- Red/green evidence: the focused web Compile test first failed because the
  prompt lacked `Do NOT add information the user did not write`; the focused
  native test first failed with two new assertion failures for the missing
  boundary text. After implementation, the focused web Compile run passed
  35/35, the focused native run passed 1/1, full
  `tests/new-loom-compile-pipeline.test.ts` passed 35/35, and full
  `LoomDraftStoreTests` passed 73/73.
- This remains no-provider source/test acceptance. Live provider-output
  Compile/Draft acceptance and strict latest-binary installed-app UI acceptance
  still require explicit approval.
- Wider gates after this slice passed: `npm run test:contracts` 548/548,
  `npm run typecheck`, and `git diff --check && git diff --cached --check`.
  After the Xcode test-created Debug app was unregistered and removed, `mdfind`
  listed only `/Users/yinyiping/Applications/Loom.app`, `pgrep -fl Loom` showed
  only installed pid `38106`, and Computer Use read `com.yinyiping.loom` at pid
  `38106`; `list_apps` showed a single running `Loom — com.yinyiping.loom`.

Update at 2026-05-10 23:56 AEST:
- Phase 7 question-container detail now shows richer resolved attachment
  context without creating or mutating real user-data rows. The native pursuit
  payload adds source `excerpt` values from trace summaries and panel
  `sourceTitle` / `sourceHref` context; `PursuitDetailClient` renders those
  details below attached source and reader-note titles instead of showing
  title-only rows.
- Red/green evidence: the new pursuit-detail contract first failed because the
  model had no `excerpt`, `sourceTitle`, or `sourceHref` fields. After
  implementation, `npx tsx --test tests/pursuit-detail-contract.test.ts`
  passed 5/5, and the focused pursuit/source/skeleton run passed 104/104.
  `LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` also completed with
  `** BUILD SUCCEEDED **`.
- This is source/build verified only. Real installed-app acceptance for actual
  question-container rows remains open until such rows exist or the user
  approves creating temporary user data.
- Wider gates after this slice passed: `npm run test:contracts` 549/549,
  `npm run typecheck`, and `git diff --check && git diff --cached --check`.
  After removing the Xcode-generated Debug app again, `mdfind` listed only
  `/Users/yinyiping/Applications/Loom.app`, `pgrep -fl Loom` showed only
  installed pid `38106`, and Computer Use read `com.yinyiping.loom` at pid
  `38106`; `list_apps` showed a single running `Loom — com.yinyiping.loom`.

Update at 2026-05-11 00:02 AEST:
- Phase 7 question-container detail now returns to Draft instead of ending at a
  standalone detail page. `PursuitDetailClient` adds a `Draft this question`
  action that builds `/draft?ref=...` with `kind=source`, `source=<question>`,
  and an excerpt from the current question notes. When `containerPath` is
  available, the Draft reference targets the durable
  `loom://content/<containerPath>/Loom.md` file.
- Red/green evidence: the new pursuit-detail contract first failed because
  there was no `pursuitDraftHref(...)`, no `loom://content` question-container
  reference, and no `Draft this question` action. After implementation,
  `npx tsx --test tests/pursuit-detail-contract.test.ts` passed 6/6; the
  focused pursuit/source/skeleton run passed 105/105; `npm run typecheck`
  exited 0.
- This is source/test verified only. Installed-app row acceptance still depends
  on a real or explicitly approved temporary question-container record.

Update at 2026-05-11 00:08 AEST:
- Strict latest-binary installed-app acceptance was refreshed for the current
  working tree. `npm run app:user` completed a fresh static export, Release
  Xcode build, and install, ending with `✓ Loom.app installed to
  ~/Applications`.
- The previous installed process was pid `38106`; after a graceful quit and
  reopen, `pgrep -fl Loom` showed only pid `4237` running from
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`. The installed
  executable mtime was `May 11 00:08:05 2026`.
- Strict smoke passed with
  `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1 LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm
  run app:smoke`: installed app smoke ok for
  `/Users/yinyiping/Applications/Loom.app`, bundle id `com.yinyiping.loom`,
  and `639` static web files.
- Computer Use then read `com.yinyiping.loom` at pid `4237` and showed the real
  Source Index window, including Delete buttons in Recent Captures, local-file
  and question-container sections, and the updated installed app surface.

Update at 2026-05-11 00:11 AEST:
- The real-file importer primitive gate was refreshed against the default UNSW
  corpus with `npm run verify:real-files-importer`. It passed and reported
  coverage of `391` PDFs, `2827` images, `14` attributed documents, `1` deck,
  and `0` iWork packages. Sample evidence included three real PDFs with 4000
  chars plus page counts, image OCR / Vision labels, one DOCX with 3904 chars,
  and one PPTX with 43757 chars across 43 slides.
- Installed-app UI entry was checked non-destructively. Computer Use opened
  Collect, verified the visible `Add files` control, clicked it, and saw the
  native `Add files to Loom` open panel with the `Add` button disabled until a
  file is selected. No user file was selected or imported.
- Because no real file was selected through the installed app, this still does
  not close real user-file installed-app importer acceptance. It narrows the
  remaining gap to explicit approval for selecting/importing a real file in the
  UI and then confirming it appears in Organize/Draft references.
- After cancelling/restarting the app to recover the open-panel AX session,
  `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1 LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm
  run app:smoke` still passed for `/Users/yinyiping/Applications/Loom.app` with
  `639` static web files, and Computer Use read `com.yinyiping.loom` at pid
  `5319`.

Update at 2026-05-11 03:08 AEST:
- Strict latest-binary installed Draft chrome acceptance now has a repeatable
  gate. `scripts/verify-installed-draft-chrome.mjs` opens
  `loom://bundle/draft`, requires a single fresh installed Loom process, captures
  only the visible Loom window by CGWindow id, and rejects titlebar overlap or
  excessive Draft top gutter through `evaluateDraftChromeScan(...)`. The scan
  ignores the titlebar separator and broad chrome/background rows, and only
  counts localized text/icon strokes as content.
- Red/green evidence: the new `tests/loom-app-scripts.test.ts` contract first
  failed because `scripts/verify-installed-draft-chrome.mjs` did not exist.
  After adding the verifier and `npm run verify:installed-draft-chrome`, the
  focused installed-Draft-chrome verifier test passed.
- Root-cause follow-up: sidebar `ScrollView.safeAreaInset`, an outer
  `Color.clear` spacer, fixed siblings above the `ScrollView`, `LazyVStack` top
  padding, and transparent or scrollable guard rows were not reliable under
  direct-route launches through the transparent titlebar. The sidebar now keeps
  the traffic-light guard on the first real content row with
  `sectionEyebrow("Loom", topPadding: minimalSidebarTopClearance)`, and the
  contract rejects `safeAreaInset` regressions.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; after relaunch, strict smoke passed
  with `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1
  LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm run app:smoke`; and `npm run
  verify:installed-draft-chrome` passed with `sidebarTopPt: 33.9` and
  `detailTopPt: 61.3` on fresh installed pid `96208`.
- Computer Use note: after the relaunch, CUA returned `cgWindowNotFound`, so the
  repeatable verifier uses CGWindow/screencapture against the Loom window only.
  It does not use desktop screenshots.
- Remaining approval-bound gates: real user-file installed-app importer
  acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 03:20 AEST:
- Compile provider integration now has a local, repeatable provider-stub gate.
  `scripts/verify-compile-provider-stub.ts` starts a loopback
  `/v1/chat/completions` server, sends the real `buildCompilePrompt(...)`
  output through an OpenAI-compatible request body, extracts
  `choices?.[0]?.message?.content`, and runs the returned artifact through
  `parseCompileArtifact(...)` plus `renderCompileArtifactHtml(...)`.
- The stub gate asserts provider-visible privacy boundaries: source excerpts,
  scratch, prior notes, Ask history, and attached references are visible, while
  full source body and cross-source corpus excerpts are omitted.
- The returned artifact must include frame separators, a reveal marker, inline
  and block math, an `(unsupported)` marker, and a `[user noted both: ...]`
  contradiction annotation, and the rendered HTML must expose the expected safe
  Compile artifact classes.
- Red/green evidence: the focused Compile contract first failed because
  `scripts/verify-compile-provider-stub.ts` did not exist. After adding the
  verifier and `npm run verify:compile-provider-stub`, the focused Compile run
  passed 36/36 and the verifier itself passed with `2` frames, `1` term, and
  `2` math expressions.
- This is still not live-provider acceptance. The live provider-output
  Compile/Draft gate remains open until the user explicitly approves a real
  provider call.

Update at 2026-05-11 03:31 AEST:
- Native OpenAI-compatible provider transport now has a local, repeatable
  provider-stub gate. `npm run verify:native-provider-stub` runs only
  `CustomEndpointClientTests` with `LOOM_SKIP_WEB_STAGE=1`.
- `CustomEndpointClientTests` now uses `CustomEndpointStubProtocol` to capture
  native custom-endpoint requests without network access. The tests verify that
  non-streaming sends post the expected chat-completions body, omit
  Authorization for local endpoints without a key, and decode
  `choices[0].message.content`.
- The same stub gate verifies streaming SSE chunks through the OpenAI-compatible
  `choices[0].delta.content` shape and confirms accumulated text plus per-chunk
  callbacks.
- Red/green evidence: the new app-script contract first failed because
  `verify:native-provider-stub` did not exist. After adding the package script
  and Swift stub tests, the focused app-script run passed 34/34 and
  `npm run verify:native-provider-stub` passed 11/11 selected Swift tests.
- Xcode generated and registered a Debug `Loom.app` during the test run. It was
  unregistered and removed afterward; `mdfind` now lists only
  `/Users/yinyiping/Applications/Loom.app`, and `pgrep -fl Loom` shows only the
  installed process at pid `96208`.
- This still does not close live provider-output acceptance. No real provider
  endpoint was called.

Update at 2026-05-11 03:41 AEST:
- The completion audit now has a repeatable guard against accidentally
  downscoping the objective back to Phase 1 or marking the broad new-Loom goal
  complete while approval-bound gates remain open.
- `npm run verify:new-loom-audit` runs
  `scripts/verify-new-loom-completion-audit.mjs`, which reads this audit file,
  requires the objective text `完整彻底实现新 Loom，而不只是 phase 1`, rejects the
  old Phase 1-only objective phrasing, and requires the full-product
  acceptance definition.
- The verifier also requires the two approval-bound gates to stay explicit:
  real user-file installed-app importer acceptance must remain open until the
  user approves UI import of real files, and live provider-output
  Compile/Draft acceptance must remain open until the user approves a real
  provider call.
- Red/green evidence: the focused app-script contract first failed because
  `scripts/verify-new-loom-completion-audit.mjs` did not exist. After adding the
  package script and verifier, the focused app-script run passed 35/35 and
  `npm run verify:new-loom-audit` reported `2 approval-bound gates remain
  open`.
- Follow-up red/green evidence: the same focused contract then failed because
  `verify:product` did not run `verify:new-loom-audit`. `verify:product` now
  runs the audit guard immediately after `status:buckets`, before the expensive
  typecheck/build/app install chain, so the product gate cannot bypass the
  full-objective completion hold.
- Current-evidence sync: the top checklist now records the latest
  `npm run test:contracts` 559/559 pass instead of the older 547/547 count.

Update at 2026-05-11 04:08 AEST:
- Draft chrome follow-up for the user-reported fullscreen/windowed bug:
  root-cause analysis found that `NavigationSplitView` was still adding a
  system sidebar shell, rounded card, and sidebar-toggle chrome around Loom's
  own sidebar. `LoomMinimalRootView.swift` now uses a top-level `HSplitView` and
  places the toolbar on the owned root shell, so the sidebar and detail pane no
  longer sit under an extra system split-view card.
- Red/green evidence: the new contract in
  `tests/new-loom-skeleton-contract.test.ts` first failed because
  `LoomMinimalRootView.swift` still mounted `NavigationSplitView`. After the
  root shell change, the focused command
  `npm run test:contracts -- --test-name-pattern "minimal sidebar keeps content|native Draft leaves top clearance"`
  passed with `559` pass / `0` fail and asserts both owned `HSplitView` and no
  `NavigationSplitView` regression.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; after killing the stale process,
  `npm run verify:installed-draft-chrome` launched fresh installed pid `21430`
  and passed with `sidebarTopPt: 34.4` and `detailTopPt: 31.6`. `npm run
  app:smoke`, `npm run typecheck`, and `git diff --check -- macos-app/Loom/Sources/LoomMinimalRootView.swift tests/new-loom-skeleton-contract.test.ts`
  also passed after this change.
- Computer Use still returned `cgWindowNotFound` for the installed Loom app in
  this environment, so the accepted evidence here remains the strict installed
  app CGWindow verifier rather than CUA-read visual confirmation.
- The standalone `verify:new-loom-audit` command now also reads `package.json`
  and fails unless `verify:product` runs `npm run verify:new-loom-audit`
  immediately after `status:buckets`. This keeps the guard executable even when
  someone runs it without the contract suite.

Update at 2026-05-11 04:36 AEST:
- Product-gate hardening after the Draft chrome fix: `verify:product` now runs
  the safe repeatable new-Loom gates instead of relying on the audit document as
  a proxy for them.
- Added to the default product gate: `npm run verify:compile-quality`,
  `npm run verify:compile-provider-stub`, `npm run verify:native-provider-stub`,
  and `npm run verify:installed-draft-chrome` after `app:user` / `app:smoke`.
- The product gate deliberately still does not run `verify:real-files-importer`.
  That script reads the user's real corpus and is not the same as installed-app
  UI import acceptance, so the real user-file installed-app gate remains
  approval-bound.
- Red evidence: the focused app-script contract first failed because
  `verify:product` lacked `verify:compile-quality`. The follow-up change wires
  the safe gates into `package.json` and makes
  `scripts/verify-new-loom-completion-audit.mjs` reject future product gates
  that omit them.
- Green evidence in this slice: the focused app-script contract passed with
  `559` pass / `0` fail; `npm run verify:new-loom-audit` passed and still
  reported exactly two approval-bound gates; `npm run verify:compile-quality`
  passed all five manual quality cases; `npm run verify:compile-provider-stub`
  passed; `npm run verify:native-provider-stub` passed 11 selected Swift tests
  with 0 failures; `npm run verify:installed-draft-chrome` passed with
  `sidebarTopPt: 34.4` and `detailTopPt: 31.6`; `npm run typecheck`,
  `npm run app:smoke`, and scoped `git diff --check` also passed.
- The Xcode provider-stub run generated a temporary Debug `Loom.app`; after the
  run, LaunchServices listed only `/Users/yinyiping/Applications/Loom.app`, the
  only running Loom process was that installed app, and the generated Debug app
  bundle was removed.

Update at 2026-05-11 04:23 AEST:
- Added a non-destructive final-gate readiness verifier:
  `npm run verify:approval-gates-ready`. It reads the completion audit,
  package scripts, real-file importer verifier, web provider stub, and native
  provider stub tests; it does not import real files and does not make provider
  calls.
- `verify:product` now runs `verify:approval-gates-ready` immediately after
  `verify:new-loom-audit`, so the default product gate checks that the final
  approval-bound gates are explicit before it spends time on the heavier build
  and installed-app chain.
- The runbook section above documents the two exact remaining approval paths:
  real user-file UI import through the installed app, and one live
  provider-output Compile/Draft acceptance. Both remain open until the user
  explicitly approves them.
- Red/green evidence: the new app-script contract first failed because
  `scripts/verify-approval-gates-ready.mjs` did not exist. After adding the
  script, package entry, product-gate wiring, and runbook, the focused
  app-script file passed 36/36.
- `npm run verify:approval-gates-ready` passed and reported two gates requiring
  explicit approval. `npm run verify:new-loom-audit` passed with the same two
  open gates. A first aggregate `npm run test:contracts -- --test-name-pattern
  "approval-bound final gates have a non-destructive readiness verifier|new
  Loom completion audit verifier keeps approval-bound gates explicit"` run hit
  an unrelated `source-library metadata writes never expose a truncated file`
  timeout; the source-library file passed 6/6 when rerun directly, and the same
  aggregate command then passed with `560` pass / `0` fail. `npm run typecheck`
  and scoped `git diff --check` also passed.

Update at 2026-05-11 05:12 AEST:
- Draft chrome acceptance was refreshed after the user reported the Draft page
  still overlapped titlebar controls in fullscreen and non-fullscreen windows.
  `LoomMinimalRootView.swift` now avoids SwiftUI `.toolbar` ownership for Draft
  chrome, keeps the window on the full-size transparent titlebar contract, and
  uses one explicit top clearance pair: `minimalSidebarTitlebarClearance: 132` /
  `minimalDetailToolbarClearance: 88`. Collect and Organize render under the
  same 88pt detail chrome band with the same 28pt body-start rhythm, while
  Draft's nested split view now explicitly yields to that 88pt band before its
  matching 28pt editor/inspector inset so it no longer covers the chrome or
  clips the `DRAFT` eyebrow/right inspector heading.
- `ContentView.WindowConfigurator` now exposes `contentExtendsUnderTitlebar`
  while defaulting to the full-size titlebar contract, and the fallback main
  window in `LoomApp.swift` uses the same `.fullSizeContentView` style mask as
  the normal scene window.
- Installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run
  verify:installed-draft-chrome` passed against installed pid `63598`, window
  `36023`, with `sidebarTopPt: 80.8` and `detailTopPt: 44.6`. The kept target
  CGWindow screenshot `loom-installed-draft-chrome-67894.png` was visually
  checked at `2936x1910` pixels, showing the traffic-light area, sidebar,
  Draft title, editor, and right-panel content separated without overlap.
- Computer Use could not attach to Loom in this environment and returned
  `cgWindowNotFound`; the visual acceptance evidence for this slice is the
  installed app process check plus the target CGWindow screenshot, not a
  desktop screenshot.
- Green evidence after refreshing the audit: `npx tsx --test
  tests/night-chrome-theme.test.ts`, `npx tsx --test
  tests/new-loom-skeleton-contract.test.ts`, and `npx tsx --test
  tests/loom-app-scripts.test.ts` passed. `npm run verify:new-loom-audit` must
  now require the current 80.8/44.6 installed-app evidence instead of the older
  34.4/31.6 record.

Update at 2026-05-11 05:28 AEST:
- The native provider-stub gate no longer leaves a second Debug `Loom.app`
  bundle behind after Xcode test runs. `verify:native-provider-stub` now runs
  `scripts/verify-native-provider-stub.mjs`, which invokes the same
  `CustomEndpointClientTests` with `LOOM_SKIP_WEB_STAGE=1` and then calls
  `clean-loom-app-bundles.mjs` from a `finally` block.
- Before the wrapper, a focused `npm run verify:native-provider-stub` left
  `/Users/yinyiping/Library/Developer/Xcode/DerivedData/.../Build/Products/Debug/Loom.app`
  on disk even though Spotlight only indexed the installed app. After the
  wrapper, the verifier passed 11/11 selected Swift tests and removed the Debug
  app automatically.
- Post-run duplicate-app check: `find "$HOME/Library/Developer/Xcode/DerivedData"
  -path "*/Build/Products/*/Loom.app"` returned no app bundles; `mdfind
  "kMDItemCFBundleIdentifier == 'com.yinyiping.loom'"` returned only
  `/Users/yinyiping/Applications/Loom.app`; `pgrep -fl "Loom"` showed only the
  installed app process at pid `63598`.
- Green evidence after the wrapper: focused app-script contracts passed 36/36,
  `npm run verify:approval-gates-ready` passed with the same two explicit
  approval-bound gates, `npm run verify:new-loom-audit` passed, the combined
  app-script / skeleton / night-chrome run passed 113/113, and `npm run
  verify:installed-draft-chrome` still passed with `sidebarTopPt: 80.8` and
  `detailTopPt: 44.6`.

Update at 2026-05-11 05:36 AEST:
- A wider `npm run verify:product` run exposed a release hygiene failure rather
  than a runtime failure: `app:check-project -- --require-tracked` rejected 13
  macOS project paths that were referenced by `Loom.xcodeproj` or Swift tests
  but still untracked. The 13 paths were staged exactly: `DraftBridgeHandler`,
  `NewLoomPublicWorkingMode`, `LoomBundleRouteRelayTests`, and the referenced
  slide-deck fixtures.
- A stale zero-byte `.git/index.lock` from 2026-05-09 blocked staging. `lsof`
  showed no holder and no active git process, so the stale lock was removed
  before staging the 13 project-required files.
- After staging, `npm run app:check-project -- --require-tracked` passed and
  reported 109 source Swift files, 37 test Swift files, macOS 15.0, and bundle
  IDs `com.yinyiping.loom`, `com.yinyiping.loom.LoomWebExtension`, and
  `com.yinyiping.loomTests`.
- `npm run app:user` rebuilt and installed a new `/Users/yinyiping/Applications/Loom.app`.
  The existing installed process `63598` was older than the new executable, so
  strict UI acceptance correctly failed until the app was relaunched. After
  relaunch, the installed app ran as pid `80711`.
- Latest strict installed-app evidence after relaunch: `npm run app:smoke`
  passed with 639 static web files; `npm run verify:installed-draft-chrome`
  passed twice against pid `80711`, window `36160`, with `sidebarTopPt: 37.2`
  and `detailTopPt: 74.3`; and a DerivedData app scan returned no lingering
  `Loom.app` bundles.

Update at 2026-05-11 05:50 AEST:
- The user reported the Draft chrome bug still appeared in fullscreen. The
  immediate installed verifier was strengthened first: with the old installed
  app it failed on `left titlebar region has foreground text at 37.2pt`, proving
  the system titlebar/toolbar title was still visible above Loom-owned Draft
  chrome.
- The main SwiftUI `Window("Loom")` now uses `.windowStyle(.hiddenTitleBar)`,
  and fallback main windows set `titlebarAppearsTransparent = true`,
  `titleVisibility = .hidden`, `toolbar = nil`, and
  `isMovableByWindowBackground = true`, so Draft has one chrome owner in both
  scene and fallback paths.
- `npm run app:user` rebuilt and installed the app; the old installed process
  was killed and `/Users/yinyiping/Applications/Loom.app` was relaunched as pid
  `99375`.
- Latest strict installed-app evidence: `npm run app:smoke` passed with 639
  static web files; `npm run verify:installed-draft-chrome` passed against pid
  `99375`, window `36173`, with `sidebarTopPt: 80.8` and `detailTopPt: 44.6`;
  the kept screenshot `loom-installed-draft-chrome-99682.png` was visually
  checked at `2936x1910` pixels, and the strengthened verifier no longer found
  left-titlebar foreground text.

Update at 2026-05-11 06:05 AEST:
- A wider `npm run verify:product` reached the final installed Draft chrome
  gate after passing `typecheck`, `test:contracts` 562/562,
  `verify:compile-quality`, `verify:compile-provider-stub`,
  `verify:native-provider-stub`, capture export checks, captures landing
  checks, build, smoke, project tracking, extension staging, and `app:user`.
- The final installed Draft chrome gate exposed two verifier issues, not a
  UI regression: stale-process relaunch used the invalid Node signal name
  `TERM` instead of `SIGTERM`, and the screenshot scanner treated light window
  background pixels as foreground text in light theme.
- `scripts/verify-installed-draft-chrome.mjs` now relaunches stale installed
  processes with `SIGTERM`, then scans each row by background brightness so it
  looks for dark ink on light backgrounds and light ink on dark backgrounds.
- Latest strict installed-app evidence: `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1
  npm run verify:installed-draft-chrome` passed against installed pid `11451`,
  window `36184`, with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`; the kept
  screenshot `loom-installed-draft-chrome-14683.png` was visually checked at
  `2936x1910` pixels and shows Draft without system titlebar text, traffic-light
  overlap, or right-panel overlap.

Update at 2026-05-11 06:23 AEST:
- The full `npm run verify:product` command completed with exit code 0 after
  the temporary build-trash cleanup path was hardened.
- The final installed-app gate rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`, passed `app:smoke` with 639 static
  web files, auto-relaunched the stale installed process before strict UI
  acceptance, and passed `npm run verify:installed-draft-chrome` against pid
  `39945`, window `36200`, with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`.
- `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
  kept `loom-installed-draft-chrome-42484.png` at `2936x1910` pixels for the
  same installed pid/window evidence.
- `npm run clean:generated` removed
  `/var/folders/m8/yqv12__d7136t8dx2fnf5qx00000gn/T/loom-build-trash`. A later
  cleanup pass removed the tracked Finder-numbered public artifacts
  `public/brand/loom_app_icon 2.svg`, `public/icon 2.svg`, and
  `public/icon-mono 2.svg` so only canonical icon files remain.

Update at 2026-05-11 06:54 AEST:
- A follow-up fullscreen acceptance pass found that Computer Use still cannot
  attach to the installed Loom accessibility tree in this session:
  `get_app_state` for both `Loom` and `com.yinyiping.loom` returned
  `cgWindowNotFound`, and System Events reported zero AX windows even while
  CGWindow saw the visible Loom window. The UI verification therefore stayed on
  the existing CGWindow/screenshot strict gate.
- The fullscreen root cause was narrowed to a missing explicit AppKit
  fullscreen eligibility contract. `WindowConfigurator.configure(_:)` and the
  fallback main-window creation path now both insert `.fullScreenPrimary` into
  `window.collectionBehavior`; the new skeleton contract first failed on that
  absence, then passed after the Swift fix.
- `npm run app:user` rebuilt and installed the updated app, and a focused
  `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
  passed against pid `78181`, window `36409`, with `sidebarTopPt: 80.8` and
  `detailTopPt: 74.3`; the kept screenshot
  `loom-installed-draft-chrome-78155.png` is `2936x1910`.
- The full `npm run verify:product` command then completed with exit code 0.
  Its final installed Draft chrome gate auto-relaunched the stale installed
  process and passed against pid `86664`, window `36551`, with
  `sidebarTopPt: 80.8` and `detailTopPt: 74.3`, followed by generated cleanup.

Update at 2026-05-11 07:08 AEST:
- The remaining flipdisc visual-label cleanup gap was narrowed to the direct
  canvas JPEG fallback in the Atlas extension. The queued async screenshot path
  already called `elementScreenshotAlt(...)`, but the direct canvas branch still
  emitted generic alt text such as `${kind} capture`.
- The direct canvas branch now computes `const alt =
  elementScreenshotAlt(node, kind)` and writes `alt="${escapeAttr(alt)}"` for
  the generated `<img>`, so static canvas fallbacks keep the same semantic label
  path as async element screenshots.
- Red/green evidence: the focused capture-media contract first failed on the
  hard-coded direct canvas alt label. After the extension fix,
  `npx tsx --test tests/capture-media-contract.test.ts --test-name-pattern
  "direct canvas fallback keeps semantic screenshot alt text"` passed; Node ran
  the full file and reported 49/49 passing.
- `npm run app:stage-extension` refreshed
  `/Users/yinyiping/Library/Application Support/Loom/Atlas-Extension/extension`;
  the staged `content.js` SHA matched the source SHA
  `b26bcdd131e2f8626dbb55955de297c97e0dcbdc3a1612f916093dd4736718ad`.
- Fresh live handoff evidence after staging:
  `npm run verify:flipdisc-live-handoff` passed against
  `https://flipdisc.io/` using that staged content script SHA. It produced
  `bodyHasFlatFrameLine: false`, 70 blocks, 31 media nodes, 9 interactive
  artifacts, `segmentDiagramCount: 1`, 3 animated canvases, 3 source islands,
  no unresolved media references, and a generated handoff fixture whose nested
  verifier returned `ok: true` with no warnings or errors.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 13:05 AEST:
- The Collect / Organize / Draft layout unification fix was narrowed after the
  user reported that Draft and the other two primary pages no longer shared the
  same page rhythm. Root cause: `detailColumn` already reserves the shared
  88pt in-window chrome band, but the Draft case still added a second
  `minimalDetailTopClearance` at the page boundary.
- `LoomMinimalRootView` now mounts `LoomDraftView()` in the same post-chrome
  detail slot as Collect and Organize. Draft keeps only its internal 28pt
  editor/inspector body inset, matching the Collect and Organize body-start
  rhythm under the shared chrome band.
- Focused contract verification passed:
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern
  "native Draft owns its top chrome|Collect Organize and Draft align|minimal
  sidebar keeps content"` reported 80/80 passing.
- `npm run app:user` rebuilt and installed the Release app to
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and 639 static web files. The smoke run
  warned that the already-running installed Loom process started before the
  new executable, so strict latest-binary UI acceptance still needs a relaunch
  once the desktop can be inspected.
- Computer Use was retried but remains blocked by the locked macOS console:
  `get_app_state("com.yinyiping.loom")` returns `cgWindowNotFound` while
  `IOConsoleLocked=Yes` / `CGSessionScreenIsLocked=Yes`.

Update at 2026-05-11 11:36 AEST:
- The installed Draft chrome fix was corrected after the first fullscreen
  hardening pass introduced a runtime crash. Root cause: Swift compilation
  accepted direct `window.titlebarAccessoryViewControllers = []`, but the
  installed SwiftUI `AppKitWindow` did not implement
  `setTitlebarAccessoryViewControllers:` and raised
  `NSInvalidArgumentException` during main-window presentation.
- The fix now clears titlebar accessories only through guarded helpers:
  `clearTitlebarAccessories(window)` in `WindowConfigurator` and
  `clearMainWindowTitlebarAccessories(window)` in `AppDelegate`. Both use
  `Selector(("setTitlebarAccessoryViewControllers:"))` plus
  `window.responds(to: selector)` before calling KVC, so unsupported SwiftUI
  window classes are skipped instead of crashing.
- Red/green evidence: `npm run verify:new-loom-audit` first failed after the
  audit verifier was tightened to require guarded accessory-cleanup evidence.
  The Draft chrome contract also first failed on the missing guarded helper;
  after implementation, `npx tsx --test
  tests/new-loom-skeleton-contract.test.ts` passed 79/79.
- Fresh installed-app evidence: `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
  bundle id `com.yinyiping.loom` and `639` static web files; strict
  `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
  passed against installed pid `45176`, window `37035`, with
  `sidebarTopPt: 73.8` and `detailTopPt: 67.3`. The kept screenshot
  `loom-installed-draft-chrome-49905.png` is `2936x1910`.
- Runtime log check for the latest installed process found no
  `titlebarAccessory`, `NSInvalidArgumentException`, or `unrecognized selector`
  events in the recent Loom log window after the guarded-helper fix.
- Computer Use was retried. `list_apps` sees `Loom - com.yinyiping.loom`
  running, but `get_app_state` for both `Loom` and `com.yinyiping.loom` still
  returns `Apple event error -10005: cgWindowNotFound`, so the current
  installed visual evidence comes from CGWindow-bound screenshot scanning and
  logs rather than an AX tree.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 09:26 AEST:
- The user-reported Draft chrome overlap was rechecked against a kept installed
  screenshot after the previous gate passed. The screenshot showed the earlier
  verifier was still too weak for one class of system chrome: residual standard
  macOS toolbar/sidebar glyphs near the left titlebar area were not represented
  in `evaluateDraftChromeScan(...)`.
- `WindowConfigurator` now hides `standardWindowButton(.toolbarButton)` whenever
  it removes the system toolbar, and the fallback main-window path applies the
  same rule. This keeps both scene-managed and fallback installed windows under
  a single Loom-owned sidebar chrome.
- `scripts/verify-installed-draft-chrome.mjs` now scans a dedicated
  `sidebarToggleSafeX0` / `sidebarToggleGlyphTopPt` region and fails if a
  standard sidebar-toggle glyph remains. The source contract in
  `tests/loom-app-scripts.test.ts` first failed on the missing scan, then
  passed after the verifier update.
- Fresh evidence after rebuild: `npx tsx --test tests/night-chrome-theme.test.ts
  tests/loom-app-scripts.test.ts --test-name-pattern "auto theme follows local
  day and night|window chrome follows|installed Draft chrome verifier rejects"`
  passed 38/38; `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639
  static web files; `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
  verify:installed-draft-chrome` auto-relaunched stale pid `37980` and passed
  against pid `89972`, window `36886`, with `sidebarTopPt: 73.8` and
  `detailTopPt: 67.3`; kept screenshot:
  `loom-installed-draft-chrome-89916.png`.
- Computer Use was retried in the same slice: `list_apps` saw Loom running, but
  `get_app_state(app: "com.yinyiping.loom")` still returned
  `cgWindowNotFound`; `CGSessionScreenIsLocked=Yes` and System Events still
  reports 0 Loom windows. Treat that as a locked-session CUA blocker, not a
  current Draft chrome failure.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 08:55 AEST:
- Fresh full `npm run verify:product` was rerun after the Draft chrome
  fullscreen-transition hardening and after the stale `night-chrome-theme`
  assertion was aligned with `removesSystemToolbar: true`.
- The first full run exposed that stale test assertion: it expected
  `WindowConfigurator(title: "Loom", isNight: usesNightPalette,
  contentExtendsUnderTitlebar: true)` even though the current installed-app
  chrome contract requires `removesSystemToolbar: true`. The focused
  `npx tsx --test tests/night-chrome-theme.test.ts` check then passed 2/2
  after the contract was updated.
- The second full `npm run verify:product` completed with exit code 0. It
  covered status buckets, completion audit, approval-gate readiness,
  typecheck, full contract tests, compile quality, web provider stub, native
  provider stub, capture interactive export, captures landing, production
  build, smoke, `git diff --check`, macOS project tracking, extension staging,
  Release build/install, installed app smoke, strict installed Draft chrome,
  and generated cleanup.
- Notable counts from this run: `test:capture-interactive` passed 9/9,
  `test:captures-landing` passed 12/12, and native `CustomEndpointClientTests`
  passed 11/11 inside `verify:native-provider-stub`.
- The final installed Draft chrome gate passed against pid `37980`, window
  `36871`, with `sidebarTopPt: 73.8` and `detailTopPt: 67.3`; `app:smoke`
  reported the installed app at `/Users/yinyiping/Applications/Loom.app`,
  bundle id `com.yinyiping.loom`, and 639 static web files.
- The completion-audit verifier was hardened after this run so it still
  requires installed Draft chrome pid/window/top/screenshot evidence, but no
  longer binds the audit to one transient pid/window number.
- This does not close the two approval-bound gates: real user-file installed
  app importer acceptance and live provider-output Compile/Draft acceptance
  still require explicit user approval.

Update at 2026-05-11 09:06 AEST:
- The noninteractive real-file importer verifier was rerun to keep the
  approval-bound file-import gate ready. The first run exposed a robustness
  issue in the verifier harness: a sampled `.pptx` could fail `unzip` and raise
  a top-level Swift fatal error, causing one bad or temporarily unavailable
  Office package to abort the whole corpus check.
- The manifest now samples up to five deck and iWork candidates, and the Swift
  verifier records `skippedDeckEvidence` / `skippedIWorkEvidence` while
  continuing to the next candidate. Required PDF/image evidence still fails
  loudly when missing or unreadable.
- Red/green evidence: the focused skeleton contract first failed on the missing
  multi-candidate and skip-evidence clauses, then passed 78/78 after the
  verifier update.
- Fresh `npm run verify:real-files-importer` then passed against
  `/Users/yinyiping/Desktop/Knowledge System/UNSW`: coverage `pdfs=391`,
  `images=2827`, `attributedDocuments=14`, `decks=1`, `iwork=0`; extracted 3
  PDFs, 3 images with OCR/visual descriptions, `business-model-canvas (1).docx`
  with 3904 chars, and `FINS3616 Week 2_Updated.pptx` with 43757 chars across
  43 slides.
- This still does not close real user-file installed-app importer acceptance:
  no file was selected through the installed Loom UI in this slice.

Update at 2026-05-11 09:08 AEST:
- Computer Use was retried against `com.yinyiping.loom` after the fresh product
  and real-file verifier runs. It still returned
  `Apple event error -10005: cgWindowNotFound`.
- Local system checks explain the CUA failure mode: `ioreg -n Root -d1` reports
  `CGSessionScreenIsLocked=Yes`, System Events reports 0 Loom windows, and the
  running installed process is
  `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` at pid `37980`.
- Treat this as a locked-session / AX-window enumeration blocker. It does not
  close or fail installed-app UI import acceptance; that gate still requires a
  fresh approval plus an unlocked Computer Use session.

Update at 2026-05-11 08:45 AEST:
- The user reported that Draft chrome still showed the fullscreen top-bar bug.
  Root cause hypothesis for this slice: macOS can recreate or expose titlebar /
  toolbar chrome during fullscreen transitions after the initial
  `WindowConfigurator` delayed cleanup has already run. `WindowConfigurator`
  now owns a coordinator and observes `NSWindow.didEnterFullScreenNotification`
  plus `NSWindow.didExitFullScreenNotification`, then reapplies the hidden
  titlebar / nil-toolbar contract immediately and on two short post-transition
  delays.
- Draft structure panels now show concrete block grounding labels instead of
  only opaque counts. Web `draftBlockReferenceLabels(...)` and native
  `LoomThinkingDraft.referenceLabels(for:references:)` map each block's
  `referenceHrefs` to source titles or `artifact state` labels, and both web
  and native structure panels render `Refs: ...` lines.
- Red/green evidence: the focused skeleton contract first failed on missing
  fullscreen reconfiguration observers, and the focused Draft structure
  contracts first failed on missing block-reference label helpers. After the
  fix, `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 78/78,
  `npx tsx --test tests/new-loom-draft-storage.test.ts` passed 36/36,
  `npx tsx --test tests/loom-app-scripts.test.ts --test-name-pattern
  "installed Draft chrome verifier rejects titlebar overlap and excessive top
  gutter"` passed, and full `xcodebuild ... -only-testing:LoomTests/LoomDraftStoreTests
  test` passed 75/75.
- Fresh installed evidence: `npm run typecheck` and focused `git diff --check`
  exited 0; `npm run app:user` rebuilt and installed
  `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639
  static web files; strict `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
  verify:installed-draft-chrome` auto-relaunched stale pid `4201` and passed
  against pid `27662`, window `36859`, with `sidebarTopPt: 73.8` and
  `detailTopPt: 67.3`; the kept screenshot is
  `loom-installed-draft-chrome-27600.png` at `2936x1910`.
- Computer Use was retried after reinstall. `get_app_state(app:
  "com.yinyiping.loom")` still returned `cgWindowNotFound`, so current visual
  installed-app acceptance remains CGWindow-backed instead of AX-tree-backed.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 07:37 AEST:
- A fresh full `npm run verify:product` was run after the 07:20 verifier/docs
  update and before this current-evidence refresh. It passed end to end: status
  buckets, completion audit, approval-gate readiness, typecheck, full contract
  tests, compile quality, provider stubs, capture interactive export, captures
  landing, production build, smoke, `git diff --check`, project tracking,
  extension staging, installed app build/install, installed app smoke, strict
  installed Draft chrome, and generated cleanup.
- The final strict Draft chrome gate auto-relaunched the stale installed
  process and passed against pid `57628`, window `36571`, with
  `sidebarTopPt: 80.8` and `detailTopPt: 74.3`. This supersedes the earlier
  pid `86664` / window `36551` run as current latest-binary evidence; the
  completion-audit verifier and source-level tests were then refreshed to
  require the new pid/window pair.
- Computer Use was retried after the fresh install, but
  `get_app_state(app: "com.yinyiping.loom")` still returned
  `cgWindowNotFound`, and System Events still reported zero accessible Loom
  windows. The installed-app visual proof for this slice therefore remains the
  CGWindow-backed strict verifier, not AX tree inspection.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 07:14 AEST:
- The flipdisc live verifier now suppresses canary-only visible-tab fallback
  diagnostics caused by its own headless runtime stub. Root cause: the script
  deliberately returns `captureVisibleTab disabled in headless live canary` for
  `capture-visible-tab`; the content script correctly falls back, but the
  verifier previously printed that expected limitation as a normal
  `console:warning`, making later acceptance noisy.
- `scripts/verify-flipdisc-live-extension.mjs` now filters diagnostics matching
  that expected headless canary error through `reportDiagnostics(...)`, including
  the downstream tainted-canvas serializer warnings that only appear because the
  headless stub disables visible-tab capture. It reports
  `expectedDiagnosticsSuppressed` so the suppression is auditable. Real
  extension/runtime warnings that do not match those canary-only markers still
  stay in `diagnostics`.
- Red/green evidence: the focused
  `tests/capture-handoff-verifier.test.ts` contract first failed because
  `isExpectedHeadlessCanaryDiagnostic(...)` and `reportDiagnostics(...)` did not
  exist. After the verifier change,
  `npx tsx --test tests/capture-handoff-verifier.test.ts --test-name-pattern
  "live flipdisc verifier suppresses expected headless visible-tab fallback
  diagnostics"` passed with 6/6 tests in the file.
- Fresh live evidence: `npm run verify:flipdisc-live-handoff` passed against
  `https://flipdisc.io/` using staged content script SHA
  `b26bcdd131e2f8626dbb55955de297c97e0dcbdc3a1612f916093dd4736718ad`.
  The report kept `bodyHasFlatFrameLine: false`, 70 blocks, 31 media nodes, 9
  interactive artifacts, `segmentDiagramCount: 1`, 3 animated canvases, 3 source
  islands, no unresolved media references, a handoff fixture verifier result
  of `ok: true` with no warnings/errors, and `expectedDiagnosticsSuppressed: 4`.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 07:20 AEST:
- The completion audit verifier was tightened so it no longer accepts the older
  Draft chrome evidence from pid `39945` / window `36200` as the current latest
  proof. Root cause: later fullscreen acceptance and full product verification
  had superseded that evidence, but the prompt-to-artifact checklist and
  `scripts/verify-new-loom-completion-audit.mjs` were still anchored to the
  earlier run.
- The strict Draft chrome checklist row now names the fullscreen eligibility
  contract (`.fullScreenPrimary` in `window.collectionBehavior`), the focused
  fullscreen screenshot `loom-installed-draft-chrome-78155.png`, and the final
  `npm run verify:product` installed Draft chrome gate at pid `86664`, window
  `36551`, with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`.
- `scripts/verify-new-loom-completion-audit.mjs` now requires the same latest
  fullscreen / pid / window / screenshot evidence, and the source-level contract
  tests were updated to reject stale audit evidence.
- Red/green evidence: the focused skeleton/app-scripts run first failed because
  the audit verifier still lacked `fullScreenPrimary` and still required pid
  `39945`. After updating the verifier and checklist,
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  tests/loom-app-scripts.test.ts --test-name-pattern "prompt-to-artifact
  completion checklist names current evidence|new Loom completion audit verifier
  keeps approval-bound gates explicit"` passed with 113/113 tests in those
  files.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 08:10 AEST:
- The Draft block-reference model now counts explicit stable `@reference`
  tokens as block references instead of only matching reference labels or
  excerpts inside block text. Before this slice, a block like
  `Use @flipdisc-tutorial` could appear unreferenced even though the Draft had
  the matching source attached.
- Web `draftBlocksFromBody(...)` now tests each reference's generated mention
  token with a token-boundary helper, and native `LoomThinkingDraft` mirrors the
  same boundary-aware matching. This prevents a base source token such as
  `@flipdisc-tutorial` from accidentally matching the longer artifact-state
  token `@flipdisc-tutorial#frame-format:state`.
- Red/green evidence: the new web test first failed with empty
  `referenceHrefs`, and the new Swift test first failed the same way. After
  implementation, the first fix exposed the prefix-match regression; after the
  boundary fix, `npx tsx --test tests/new-loom-draft-storage.test.ts` passed
  35/35 and full `LoomDraftStoreTests` passed 74/74 through `xcodebuild`.
  `npm run typecheck` also completed with exit code 0.
- Computer Use was retried for installed Loom in this same slice. `list_apps`
  saw `Loom - com.yinyiping.loom` running, but
  `get_app_state(app: "com.yinyiping.loom")` returned `connectionInvalid`
  during relaunch and then `cgWindowNotFound`, so AX-tree installed-app
  inspection remains blocked in this session.
- The current checkout was rebuilt and reinstalled with `npm run app:user`
  after the Draft block-reference change. `npm run app:smoke` passed with 639
  static web files, and strict `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
  verify:installed-draft-chrome` auto-relaunched the stale installed process
  and passed against pid `4201`, window `36718`, with `sidebarTopPt: 80.8` and
  `detailTopPt: 74.3`; the kept screenshot is
  `loom-installed-draft-chrome-4153.png`.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-11 10:20 AEST:
- The final Draft chrome overlap class was fixed at the AppKit chrome layer:
  scene-managed and fallback main windows now hide
  `standardWindowButton(.toolbarButton)` whenever Loom removes the system
  toolbar. This removes the residual macOS sidebar/toolbar glyph the user
  reported in both windowed and fullscreen Draft.
- The strict installed Draft chrome verifier now scans the left titlebar
  sidebar-toggle region (`sidebarToggleSafeX0` /
  `sidebarToggleGlyphTopPt`) in addition to the left/detail/center titlebar
  text regions, so the old duplicate system chrome cannot pass unnoticed.
- Product-gate tooling was hardened after the final fullscreen checks:
  static export now publishes with in-place `rsync --delete`, native provider
  stub verification runs Xcode from a temporary rsynced workspace to avoid
  Desktop/FileProvider coordination hangs, and regular production builds use
  `.next-build-current` instead of the corrupted historical `.next-build`
  output tree.
- Fresh full `npm run verify:product` completed with exit code 0. It covered
  status buckets, completion audit, approval-gate readiness, typecheck, full
  contract tests, compile quality, web/native provider stubs, capture
  interactive export, captures landing, production build, smoke, project
  tracking, extension staging, Release build/install, installed app smoke,
  strict installed Draft chrome, and generated cleanup.
- The final strict installed Draft chrome gate passed against installed pid
  `69380`, window `36905`, with `sidebarTopPt: 73.8` and `detailTopPt: 67.3`.
  `npm run app:smoke` reported bundle id `com.yinyiping.loom` and 639 static
  web files.
- Post-gate checks passed: `git diff --check` and
  `npm run verify:new-loom-audit`, which still reports exactly two
  approval-bound gates.
- Computer Use was retried after the fresh install. `list_apps` sees
  `Loom - com.yinyiping.loom` running, but `get_app_state` for both
  `com.yinyiping.loom` and `Loom` still returns `Apple event error -10005:
  cgWindowNotFound`. Local system checks show `IOConsoleLocked=Yes` /
  `CGSessionScreenIsLocked=Yes`, System Events reports 0 Loom windows, and the
  installed process is `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`
  at pid `69380`. Treat this as a locked-session CUA blocker, not a current
  Draft chrome failure.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-12 08:15 AEST:
- The native provider-stub gate was rerun after the compact-sidebar work:
  `npm run verify:native-provider-stub` passed. The underlying Xcode run
  executed `CustomEndpointClientTests` 11/11 with 0 failures, covering
  OpenAI-compatible request bodies, missing endpoint/model errors, HTTP
  recoverability, and SSE chunk parsing against a local `URLProtocol` stub.
  No live provider call was made.
- The compact-sidebar contract now explicitly guards the user's latest
  side-navigation feedback: the sidebar slice of `rootChrome` must remain a
  quiet blank titlebar field, and page/folder/action buttons are forbidden
  there. Focused evidence: `npx tsx --test
  tests/new-loom-skeleton-contract.test.ts --test-name-pattern "minimal
  sidebar participates"` passed 82/82.
- The macOS console is still locked (`IOConsoleLocked=Yes`), so strict
  Computer Use / visible installed-app acceptance remains blocked. Do not
  treat the latest compact sidebar and toolbar redesign as visually accepted
  until Loom is relaunched in an unlocked desktop session and
  `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
  passes, followed by Collect / Organize / Draft inspection through Computer
  Use.
- Remaining approval-bound gates are unchanged: real user-file installed-app
  importer acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-12 08:51 AEST:
- The Mac was unlocked and the compact root-shell redesign was checked against
  the real installed `/Users/yinyiping/Applications/Loom.app` instead of only
  source contracts. `npm run app:smoke` passed for bundle id
  `com.yinyiping.loom` with 639 static web files, after reporting and
  auto-correcting a stale installed-app process in the strict chrome verifier.
- `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
  verify:installed-draft-chrome` passed against installed pid `14460`, window
  `52148`. Kept screenshots:
  `loom-installed-draft-chrome-collect-14443.png`,
  `loom-installed-draft-chrome-organize-14443.png`, and
  `loom-installed-draft-chrome-draft-14443.png`. Measured positions are now
  aligned across the three primary pages: Collect `sidebarTopPt=45.5` /
  `detailTopPt=43.5`, Organize `sidebarTopPt=45.5` / `detailTopPt=44.0`, Draft
  `sidebarTopPt=45.5` / `detailTopPt=43.5`.
- Computer Use inspected the live installed app across Draft, Collect,
  Organize, and the Flipdisc capture reader. Evidence: Draft toolbar exposes
  `Reference`, `AI`, `Save`, and `Capture`; Collect exposes `Add files` and
  `Capture`; Organize exposes `Add Folder`, `Add Question`, and `Capture`; the
  left sidebar contains only Collect / Organize / Draft plus source folders;
  capture reader exposes `Source Index` in the native toolbar and no longer
  renders a second Source Index row inside web content.
- This closes the latest compact-sidebar / shared-toolbar regression class for
  the installed app. It does not close the two explicit approval-bound gates:
  real user-file installed-app importer acceptance and live provider-output
  Compile/Draft acceptance. Flipdisc opening-animation completeness remains a
  separate capture-quality follow-up from the side-navigation/chrome layout
  gate.

Update at 2026-05-12 09:30 AEST:
- The side-navigation shell was tightened again after the user's latest
  feedback that the toolbar and rail still felt too wide. `LoomMinimalRootView`
  now uses `rootToolbarHeight: 28`, `minimalSidebarWidth: 136`,
  `primarySurfaceTopInset: 8`, `sidebarRowHeight: 24`,
  `sidebarIconSlotWidth: 14`, `rootChromeHorizontalInset: 8`, and
  `chromeButtonSize: 24`.
- The left toolbar slice remains a blank titlebar field, not a tool strip.
  `Add files`, `Add Folder`, `Add Question`, `Reference`, `AI`, `Save`, and
  capture actions still belong to the active root toolbar. This keeps Collect,
  Organize, Draft, and the capture reader on one chrome system instead of
  separate pane-specific toolbar bands.
- Focused contract evidence was updated before reinstalling the app:
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  tests/loom-app-scripts.test.ts` is the gate for the compact shell constants,
  shared toolbar, sidebar rail ownership, and installed-app verifier contracts.

Update at 2026-05-12 09:49 AEST:
- The tightened shell was verified against the real installed
  `/Users/yinyiping/Applications/Loom.app` after relaunch. Strict evidence:
  `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
  verify:installed-draft-chrome` passed against installed pid `23388`, window
  `52787`; kept screenshots are
  `loom-installed-draft-chrome-collect-23862.png`,
  `loom-installed-draft-chrome-organize-23862.png`, and
  `loom-installed-draft-chrome-draft-23862.png`.
- Computer Use then inspected the live installed app across Draft, Collect,
  and Organize. The left rail is now a compact navigation surface only:
  Collect / Organize / Draft plus folders, with no Tools section and no Page /
  Folder action rows. Draft exposes `Reference`, `AI`, `Save`, and `Capture` in
  the active toolbar; Collect exposes `Add files` and `Capture`; Organize
  exposes `Add Folder`, `Add Question`, and `Capture`.
- Fresh gates after the installed verification: `npm run verify:new-loom-audit`
  passed with the same 2 approval-bound gates, `npm run
  verify:approval-gates-ready` passed with the same 2 approval-bound gates,
  focused shell/script contracts passed 118/118, and `git diff --check`
  passed. The remaining gates are still real user-file installed-app importer
  acceptance and live provider-output Compile/Draft acceptance.

Update at 2026-05-12 10:21 AEST:
- Flipdisc opening-animation preservation is now a strict capture-quality
  gate, not a visual guess. `scripts/verify-flipdisc-live-extension.mjs` now
  fails unless the live `https://flipdisc.io/` extraction starts the saved body
  with a captured canvas replay video, includes at least one video media
  attachment, keeps at least one `animated-canvas` replay artifact, and still
  preserves the `0x80 0x83 0x01 imageData 0x8F` frame as a segment diagram.
- The saved handoff verifier now supports
  `--require-animated-canvas-replay`, so the temporary saved-capture fixture
  must keep the opening replay after media sidecar substitution. Focused
  evidence: `npx tsx --test tests/capture-handoff-verifier.test.ts
  tests/capture-interactive-artifacts.test.ts tests/capture-media-contract.test.ts`
  passed 65/65.
- Live evidence:
  `node scripts/verify-flipdisc-live-extension.mjs --verify-handoff-fixture
  --write-payload-json /tmp/loom-flipdisc-live-payload.json` passed against
  staged content script sha
  `3d1277e6233cae4d0027bcfadb376cc005f1f53c2a674eb3a61750625f561190`.
  The report had `bodyStartsWithCanvasReplay=true`,
  `animatedCanvasReplayCount=1`, `mediaAttachmentVideoCount=1`, and the
  strict saved fixture verifier passed with `animatedCanvas.replayCount=1`,
  no unresolved media references, and no warnings.
- This closes the safe non-UI flipdisc opening-animation regression gate. It
  still does not close the two explicit approval-bound gates: real user-file
  installed-app importer acceptance and live provider-output Compile/Draft
  acceptance.

Update at 2026-05-12 10:31 AEST:
- Rechecked the installed app after the flipdisc verifier changes, which did
  not modify SwiftUI layout. Computer Use saw the live installed app on
  Collect, Draft, and Organize with the same compact shared chrome: Collect
  toolbar `Add files` / `Capture`, Draft toolbar `Reference` / `AI` / `Save` /
  `Capture`, and Organize toolbar `Add Folder` / `Add Question` / `Capture`.
- `npm run verify:installed-draft-chrome` passed against installed pid `23388`,
  window `52787`, with aligned measured starts: Collect
  `sidebarTopPt=44.5` / `detailTopPt=43.5`, Organize
  `sidebarTopPt=44.5` / `detailTopPt=44.0`, Draft
  `sidebarTopPt=44.5` / `detailTopPt=43.5`.

Update at 2026-05-12 11:29 AEST:
- The shell was reworked as a larger layout correction instead of another
  local spacer patch. `LoomMinimalRootView` now owns an independent left
  navigation rail and a separate detail-side toolbar/content stack:
  `sidebar -> rootSplitHairline -> VStack(rootChrome, rootToolbarHairline,
  detailContent)`. The detail toolbar no longer allocates a fake sidebar
  slice, and sidebar content clears the compact toolbar through
  `sidebarTopInset` rather than carrying page-local top padding.
- Draft's right rail was redesigned as a compact 300pt inspector. Structure,
  Sources, References, Suggested, Provenance, and Board are sectioned as
  inspector rows; destructive/open actions are icon buttons with explicit
  accessibility labels; the old document-like `Block operation`, two-column
  source tile grid, and large Draft board controls no longer dominate the rail.
- Focused contracts passed:
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts
  tests/loom-app-scripts.test.ts` passed 118/118. `npm run app:user` rebuilt
  and installed `/Users/yinyiping/Applications/Loom.app`. `npm run app:smoke`
  passed for bundle id `com.yinyiping.loom` with 639 static web files. Strict
  installed chrome verification passed against pid `31851`, window `53495`:
  Collect `sidebarTopPt=32.0` / `detailTopPt=41.0`, Organize
  `sidebarTopPt=44.0` / `detailTopPt=44.0`, Draft `sidebarTopPt=44.0` /
  `detailTopPt=43.5`.
- Computer Use inspected the installed app after the rebuild. Collect exposes
  `Add files` in the root toolbar; Organize exposes `Add Folder` and
  `Add Question`; Draft exposes `Reference`, `AI`, and `Save`. The sidebar
  contains only Collect / Organize / Draft plus folders. Draft's inspector
  reports compact `STRUCTURE`, `SOURCES`, `REFERENCES`, `SUGGESTED`, and
  `BOARD` sections, with source/reference delete actions still reachable by
  accessibility labels.

Update at 2026-05-12 14:00 AEST:
- Draft's right rail was tightened again so context, block operations, and
  board controls are no longer visible all at once. The inspector now defaults
  to `Context` and exposes `Blocks` and `Board` as compact segmented modes;
  `Context` contains Sources / References / Suggested / Provenance, `Blocks`
  owns structure and block editing, and `Board` owns draft-card controls.
- Focused shell/script contracts passed 119/119, including the new segmented
  inspector contract. A direct Release Xcode build passed after fixing the new
  control to use the existing `DSRadius.sm` design token instead of an
  unregistered radius token.

Update at 2026-05-12 14:24 AEST:
- `npm run app:user` rebuilt and installed `~/Applications/Loom.app`; after
  relaunch, `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with
  639 static web files. `npm run verify:new-loom-audit` and
  `npm run verify:approval-gates-ready` also passed, with the two explicit
  approval-bound gates still open: real user-file importer acceptance and live
  provider-output Compile/Draft acceptance.
- Computer Use inspected the installed app at pid `63387`. Collect, Organize,
  and Draft now share the same root shell: a compact navigation/folder sidebar,
  page actions in the top toolbar, and content starting directly below the
  toolbar without the previous large blank band. Collect exposes `Add files`;
  Organize exposes `Add Folder` and `Add Question`; Draft exposes `Reference`,
  `AI`, and `Save`.
- Draft's inspector was exercised in the installed app. `Context` shows Sources,
  References, and Suggested references only; `Blocks` switches to Structure and
  `Edit blocks`; `Board` switches to draft-card controls. This verifies the
  right rail is no longer a single stacked list of every tool.
- `npm run verify:installed-draft-chrome` could not complete in this desktop
  session because `/usr/sbin/screencapture` was terminated with return code
  137 while Safe Exam Browser was active. That is an environment screenshot
  blocker; it is not an observed installed-app UI assertion failure. Computer
  Use AX inspection and window screenshots were used for installed-app visual
  acceptance instead.

Update at 2026-05-12 14:44 AEST:
- The non-approval readiness gates were refreshed after the installed UI pass.
  `npm run verify:approval-gates-ready` passed and again reported exactly two
  gates requiring explicit approval: real user-file installed-app importer
  acceptance and live provider-output Compile/Draft acceptance. `npm run
  verify:new-loom-audit` passed with the same two gates open.
- `npm run verify:fixture-files-importer` passed against a temporary synthetic
  root under `/var/folders/.../loom-fixture-file-importer-*`; it explicitly
  reported that it does not import real user files, then exercised the real
  importer primitives on 3 fixture PDFs and 1 fixture image before cleaning the
  fixture root.
- `npm run verify:compile-quality` passed all five no-provider quality cases,
  and `npm run verify:compile-provider-stub` passed with 2 frames, 1 term, and
  2 math expressions parsed from the local provider stub output.
- `npm run verify:native-provider-stub` passed `CustomEndpointClientTests`
  11/11 through Xcode against a local URLProtocol stub and removed the temporary
  Debug `Loom.app` bundle afterward. The run still emitted the existing SwiftUI
  runtime warning about publishing from background threads; that warning should
  stay visible as a product-quality follow-up, but it did not indicate a failed
  provider-stub gate.

Update at 2026-05-15 13:27 AEST:
- Computer Use status was checked without using screenshot capture. The MCP
  tool layer is alive enough for `list_apps`: it sees the running installed
  `/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`.
  However `get_app_state` against the installed app still returns
  `cgWindowNotFound`.
- The failure is now narrowed to Loom window exposure rather than a missing app
  bundle or missing Screen Recording toggle. CoreGraphics lists two visible
  Loom windows for pid `95686`, but AX inspection returns success with zero
  `kAXWindowsAttribute` windows and only the menu bar under `AXChildren`. That
  explains why Computer Use cannot inspect or click the installed Loom window
  even though the app is running.
- Product-copy cleanup continued in the same slice: the native file-add history
  now says `ADDED` and `No files added yet.` instead of visible ingestion
  vocabulary. Focused evidence:
  `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern
  "new Loom product copy keeps literal Sources/Draft vocabulary"` passed 96/96,
  and targeted `git diff --check` passed for the touched files.
- This does not close the two explicit approval-bound gates. The next
  installed-app work should fix or bypass the AX window exposure blocker before
  asking for real user-file UI import acceptance through Computer Use. Do not
  substitute desktop screenshot capture unless the user explicitly approves it.
