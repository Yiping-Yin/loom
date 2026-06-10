# New Loom Handoff

**Date:** 2026-05-10 03:35 AEST
**Status:** Phase 1 capture handoff, major Sources / Draft consolidation with
old Collect / Organize routes retained only as compatibility, confirmed capture
delete, local-file intake, iWork metadata plus best-effort IWA body text import,
image OCR plus Vision semantic labels, installed app smoke, Source Index
Draft-reference state, native Reader notes-to-Draft handoff, web Draft
reference-open bridge, native Draft AI composition with capture timestamp
context, native Draft readable Markdown sidecars plus recovery fallback and
newer-sidecar external edit merge, executable legacy deletion review, runtime
reader back-link boundary, native reader return-to-Sources behavior, orphan
retired-route client cleanup, literal Draft card labels, literal note-connection
labels, the first Phase 7 question-container body editor bridge, Phase 9
Discipline, Phase 10 Hour with current-material-to-Draft handoff, native
bundle-route relay, ThinkingDraft multi-block edits, and the first Connections /
Correspondents support surface are verified by focused gates. Computer Use now
reads the installed `~/Applications/Loom.app` Source Index and sees per-row
`DRAFT` plus `Delete` controls for capture rows; actual deletion was not clicked
because it is destructive. The broader "complete new Loom" objective still
remains open.

> **Current vocabulary note (2026-05-15):** This handoff preserves historical
> installed-app evidence that used `Collect` / `Organize`. Do not treat those
> labels as current product evidence. The current first-level product model is
> `Sources` and `Draft`; `/collect` remains compatibility into Sources.

**Latest compact-shell status at 2026-05-12 08:05 AEST:** the source-level shell constraints are current and green (`npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` 118/118, `npm run typecheck` exit 0, `npm run test:contracts` 572/572, `npm run verify:new-loom-audit` still reporting exactly two approval-bound gates, and `npm run verify:approval-gates-ready` passed). `npm run app:smoke` passed against `/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom` and 639 static web files, but warned that running process `90082` is stale relative to the installed executable. `npm run app:check-project -- --require-tracked`, `npm run clean:generated`, `npm run build`, and `npm run smoke` also passed after generated-artifact cleanup, so the non-UI packaging/build path is current. The installed-app visual gate is not closed for the latest compact-sidebar polish because the macOS console is locked; `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome` stops at `IOConsoleLocked/CGSessionScreenIsLocked`. After unlock, relaunch the latest installed app so the visible process is fresh, rerun that strict verifier, then inspect Sources and Draft through Computer Use before accepting the shell visually.

**Latest installed-app UI status at 2026-05-12 21:45 AEST:** sidebar alignment and Draft inspector productization were refreshed in the installed app. `LoomMinimalRootView.swift` now routes primary nav rows, folder rows, collapse toggles, and sidebar creation rows through one fixed `sidebarNavigationRow(...)` grid with one icon slot and one icon-to-text gap. `LoomDraftView.swift` now keeps source actions, edit tools, and the board behind `Sources` / `Edit` / `Board` inspector modes, with one obvious next action first. Verification passed: the focused sidebar/surface contract first failed on the missing shared row renderer, then passed 87/87; `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 123/123; `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 639 static web files. The stale running process was quit and the fresh installed app relaunched as pid `60572`; Computer Use then inspected the live installed Sources and Draft surfaces.

**Latest final-gate prep at 2026-05-12 22:13 AEST:** `npm run verify:new-loom-audit` and `npm run verify:approval-gates-ready` still pass and still report exactly two gates that require explicit approval: real user-file installed-app importer acceptance and live provider-output Compile/Draft acceptance. The safe no-approval prep gates were refreshed: `npm run verify:fixture-files-importer` passed with a temporary synthetic root (`pdfs=3`, `images=1`, no real user files), `npm run verify:compile-quality` passed all five cases, `npm run verify:compile-provider-stub` passed, and `npm run verify:native-provider-stub` passed 11/11 selected `CustomEndpointClientTests`. A strict `npm run verify:installed-draft-chrome` rerun is currently blocked by `IOConsoleLocked/CGSessionScreenIsLocked`; unlock the Mac before using that as current visual evidence again.

**Latest installed-app shell status at 2026-05-12 23:25 AEST:** the compact sidebar, unified app canvas, and Draft inspector productization are now verified in the fresh installed app, not only source-level tests. `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; the stale visible process was quit, the app was reopened, and `npm run app:smoke` then passed without a stale-process warning. `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/loom-app-scripts.test.ts` passed 124/124 and targeted `git diff --check` passed. Computer Use inspected the installed app as pid `72283`: the left rail uses one compact icon/text grid, the large shell background is unified, the toolbar is no longer a tall separate band, Sources and Draft share the same shell rhythm, and Draft's right rail defaults to a compact `Sources` inspector with `Edit` and `Board` available as explicit modes. The broader goal remains open because the two approval-bound gates still require fresh user approval.

## Goal

Complete the new Loom inside the existing repo as a new skeleton plus legacy isolation:

- Loom should let a person connect information collection, organization,
  understanding, and writing into one clear thinking process without operating
  a complex tool.
- Historical Phase 1 used Collect / Organize / Draft language; the current
  first-level product loop is Sources / Draft.
- Legacy surfaces stay classified and hidden from the default path.
- Capture, source organization, and Draft must connect as one loop.
- Flipdisc capture must preserve the frame structure, not flatten it into text.

The product should be judged by whether it reduces tool friction and improves
clarity of thought. It should not be judged by the number of modes, panels, or
legacy surfaces still available.

## What Was Completed

- Added and enforced the new product skeleton around Sources and Draft.
- Moved first-run onboarding completion from legacy `/desk` to `/sources`.
- Replaced native command shortcuts with `⌘1 Sources` and `⌘2 Draft`.
- Mapped native route tokens `/sources` and `/draft` inside `LoomMinimalRootView`; `/collect` remains a compatibility alias into Sources.
- Added Draft storage and UI on web and native.
- Migrated first Atelier behavior into Draft:
  - references carry `sourceTitle` and `excerpt`;
  - metadata-only reference upgrades are detected;
  - Draft can insert referenced excerpts as quotes;
  - Draft renders a provenance ledger;
  - native Draft preserves the same reference metadata.
- Connected Source Index with capture state:
  - recent captures;
  - per-source capture counts;
  - highlight and note counts from capture metadata.
- Connected Source Index with active Draft state:
  - web native mode reads the native Draft bridge;
  - native Source Index reads `LoomDraftStore`;
  - sources referenced by Draft show `Has draft` / `attached to draft` even when
    no legacy writing surface exists.
- Connected Reader notes more directly to Draft:
  - web Source Index sends trace-backed notes/highlights to Draft with source
    labels and excerpts;
  - native Source Index Reader notes rows now expose `Draft` and attach a
    `loom://content/<source-id>#reader-notes` reference before navigating to
    Draft.
- Added source-grounded Draft AI composition on both web Draft and installed
  native Draft:
  - builds the prompt from the active draft body plus attached references;
  - streams into an `AI draft` preview;
  - only inserts the proposed text when the user chooses `Insert AI text`.
- Added readable native Draft Markdown sidecars:
  - `Drafts/drafts.json` remains the authoritative native draft index;
  - each saved draft also writes `Drafts/<draft-id>.md`;
  - sidecars include title, body, reference links, source/capture metadata,
    artifact-state summaries, and quoted excerpts for external reading or
    backup;
  - if the JSON index is missing, native Draft can recover the draft title,
    body, and reference metadata from those readable sidecars;
  - if a UUID-named Markdown sidecar is clearly newer than the JSON index,
    native Draft treats it as an external edit and merges title, body, and
    references while preserving the draft id and creation date.
- Added confirmed deletion for recent captures in Source Index:
  - native rows show `DELETE` and require a destructive confirmation sheet;
  - web rows use inline `Delete now` / `Cancel` state and avoid browser prompts.
- Added the first Phase 7 question-container body editor path:
  - native pursuit payloads expose `containerBody` and `containerPath`;
  - direct question detail renders `Question notes` and `Save question notes`;
  - `updatePursuitBody` rewrites `pursuits/<slug>/Loom.md` through
    `LoomPursuitWriter.updateBody(...)`.
- Added the first Phase 9 Discipline support document:
  - `/discipline` is classified as a support route, not a primary destination;
  - the page writes the six product refusals in app-visible copy;
  - `/system` and `/help` link to it.
- Made Collect `Add files` a real native local-file importer:
  - opens an `NSOpenPanel`;
  - supports multiple selected files;
  - stages local PDFs, slide decks, text/doc files, and images into ingestion;
  - preserves local origin metadata and shows imported local files in Organize.
- Extended slide-deck/iWork ingestion:
  - PowerPoint import preserves embedded shape/image title and description alt
    text;
  - Keynote and Pages archives preserve iWork document metadata and use
    best-effort Unicode UTF-8 / UTF-16LE text runs from `Index/*.iwa`,
    including Chinese body text, plus QuickLook preview PDF text when present;
  - `.key` and `.pages` imports preserve distinct local origin kinds.
- Added a durable route classification contract so primary surfaces cannot link back into legacy/internal routes.
- Added an executable legacy deletion review registry so every hidden legacy
  route has replacement evidence and an explicit deletion blocker until a
  release cycle ships with it hidden.
- Removed orphan client implementations and dead CSS for retired routes that now
  only exist as compatibility redirects: uploads, coworks, letter, branching,
  palimpsest, constellation, diagrams, and salon.
- Tightened the runtime capture boundary so capture reader and snapshot pages
  return to Organize / Source Index instead of promoting the
  `/loom-render/captures` runtime landing.
- Fixed the native capture reader's Source Index action so it returns to the
  real Organize Source Index instead of the hidden runtime Captures list.
- Fixed the installed Source Index fresh-launch access race:
  - launch restoration now posts `.loomContentRootsChanged` after restored
    folder URLs are active;
  - older plain bookmarks still resolve as a compatibility fallback;
  - Organize no longer needs a Draft -> Organize navigation round trip before
    showing source rows as connected.
- Added flipdisc live extension and saved-capture handoff verifiers.
- Fixed the native `loom://capture?via=clipboard` crash caused by applying
  `.canJoinAllSpaces` while the window still had `.moveToActiveSpace`.
- Extended the live Flipdisc verifier so it can export the exact native
  clipboard payload, including URL, capture mode, and media attachments.
- Added a floating-capture in-flight guard so repeated Atlas button
  activations cannot corrupt shared media queues.
- Tightened `verify:capture-handoff` so a saved capture fails if the selected
  entry still contains unresolved temporary `loom://media/...` references.
- Updated `docs/loom.md`, `docs/canon/LOOM_RULES.md`, and the active completion audit.
- Diagnosed Computer Use:
  - direct installed-app verification now works in this conversation;
  - Atlas page content is mostly opaque in the AX tree, but coordinate click on
    the visible floating Loom button successfully triggers capture;
  - no desktop screenshots should be used by default.

## Verification Passed

- Refresh check at 2026-05-09 03:17 AEST:
  - `git diff --check` passed.
  - `git diff --cached --check` passed.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/new-loom-draft-storage.test.ts` passed 19/19.
  - `npm run test:contracts` passed 200/200.
  - `npm run typecheck` passed after rebuilding missing build artifacts.
  - `npm run verify:flipdisc-live-handoff` passed; the live `https://flipdisc.io/` extraction produced `segmentDiagramCount: 1`, and the temporary saved-capture fixture verifier returned `ok: true`.
  - `npm run verify:capture-handoff` originally failed against the stale installed-container May 6 flipdisc capture because that saved CaptureAST had no segment diagram.
  - `npm run clean:generated` passed after typecheck and removed the temporary `loom-build-trash`.
- Computer Use direct installed-app verification at 2026-05-09 03:45 AEST:
  - generated a fresh live `https://flipdisc.io/` payload from the staged Atlas extension;
  - copied it to the pasteboard and opened `loom://capture?via=clipboard`;
  - installed `/Users/yinyiping/Applications/Loom.app` saved and opened the capture without crashing;
  - reader showed source `flipdisc.io`, enabled `Open original` and `Re-capture`, rendered `CAPTURED STRUCTURE`, and showed `0x80`, `0x83`, `0x01`, `imageData`, `0x8F` as the segment diagram;
  - inline media played from `loom://content/.../Loom-media-...mp4`.
- `npm run verify:capture-handoff` passed after the fresh direct native handoff:
  - saved file: `/Users/yinyiping/Library/Containers/com.yinyiping.loom/Data/Documents/Loom Data/b5ccf3fe-835b-4d5b-a5d2-ed9c228ee684/sub/Web/flipdisc.io/Loom.md`;
  - sidecar: `Loom-capture-ast-20260509-034508-dfe258f60630.json`;
  - `segmentDiagramCount: 1`;
  - expected frame tokens matched.
- `npx tsx --test tests/capture-handoff-verifier.test.ts tests/captures-landing-refresh-contract.test.ts` passed 15/15.
- `npm run app:smoke` passed for `/Users/yinyiping/Applications/Loom.app`.
- `git diff --check` and `git diff --cached --check` passed.
- Computer Use real Atlas UI verification at 2026-05-09 03:58 AEST:
  - clicked the visible floating Loom button in ChatGPT Atlas on `https://flipdisc.io`;
  - Atlas logs showed `[Loom] floating button clicked`, media preparation,
    recording, remote media saving, payload capture, and
    `Launched external handler for 'loom://capture?via=clipboard'.`;
  - installed Loom switched to `clipboard · 2026-05-09 03:58`;
  - reader showed `Open original`, `Re-capture`, `CAPTURED STRUCTURE`, and the
    expected frame tokens `0x80`, `0x83`, `0x01`, `imageData`, `0x8F`;
  - the first recorded animation opened as a real video control backed by
    `loom://content/.../Loom-media-6084b51b9edb.mp4`;
  - no `RECORDING WAS NOT SAVED` / temporary media warning appeared in the UI.
- `npm run verify:capture-handoff` passed against the 03:58 UI-triggered capture:
  - sidecar: `Loom-capture-ast-20260509-035854-8844637cd908.json`;
  - snapshot: `Loom-snapshot-20260509-035854-6a49.html`;
  - `segmentDiagramCount: 1`;
  - `unresolvedMediaReferences: []`.
- `npx tsx --test tests/capture-media-contract.test.ts` passed 47/47 after
  the concurrent-click guard.
- `npx tsx --test tests/capture-handoff-verifier.test.ts` passed 5/5 after
  adding unresolved temporary media coverage.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/new-loom-draft-storage.test.ts` passed 19/19.
- `npm run test:contracts` passed 200/200.
- `npm run typecheck` passed.
- `xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test` passed 4/4.
- `npm run verify:flipdisc-live-handoff` passed using the staged Atlas extension.
- `npm run app:check-project -- --require-tracked` passed.
- `npm run app:stage-extension` staged Atlas extension version 1.4.9.
- `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`.
- `npm run app:smoke` passed for the installed app.
- `git diff --check` and `git diff --cached --check` passed.
- Current post-consolidation verification at 2026-05-09 10:20 AEST:
  - `npm run test:contracts` passed 245/245.
  - `npm run typecheck` passed.
  - `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' build` passed.
  - `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom`.
  - `npm run app:where` reported `/Users/yinyiping/Applications/Loom.app`.
  - `git diff --check` passed.
- Computer Use installed-app acceptance after the delete/local-file slice:
  - Source Index showed `DELETE` next to recent captures.
  - Clicking `DELETE` opened `Delete this capture?`; clicking Cancel preserved the list.
  - Collect showed `Add files`.
  - Clicking `Add files` opened the native `Add files to Loom` file panel; the panel was canceled without importing.
- Current native-backed Draft bridge verification at 2026-05-09 10:31 AEST:
  - Web `/draft` now uses `window.webkit.messageHandlers.loomDrafts` in the
    installed app for `list`, `create`, and `update`, sharing native
    `LoomDraftStore` with the Swift Draft surface.
  - `npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`.
  - The stale 10:16 Loom process was terminated and the newly installed app was
    relaunched from `/Users/yinyiping/Applications/Loom.app`; Computer Use read
    the fresh process `pid 35675`.
  - Computer Use verified Source Index still exposes `DELETE` buttons and Draft
    loads the saved body, references, and Draft board from the native sandbox
    Draft store.
  - `npm run app:where` reported `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630 static web files.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 39/39.
  - `npm run typecheck`, `git diff --check`, and `npm run test:contracts` passed; the full contract gate is now 246/246.
- Route-classification tightening at 2026-05-09 10:37 AEST:
  - `/knowledge` is now classified as a `/sources` compatibility alias, not a
    second primary Organize route. Primary routes are `/`, `/collect`,
    `/sources`, and `/draft`.
  - The skeleton contract now parses the migration table and requires every
    `Compatibility` / `Migration source` route row to appear in
    `NEW_LOOM_LEGACY_ROUTES`.
  - That contract also caught and fixed `/browse`, which was documented as
    Organize compatibility but still classified as internal.
  - Focused verification passed: `npx tsx --test
    tests/new-loom-skeleton-contract.test.ts` 41/41, `npm run typecheck`, `git
    diff --check`, `git diff --cached --check`, and `npm run test:contracts`
    248/248.
- Source Index Draft-reference state at 2026-05-09 10:43 AEST:
  - web `/sources` native mode now reads `nativeDraftStorage().list()` and
    folds `loom://source/collection/...` and `loom://content/...` references
    into Source Index `Has draft` state;
  - native `LoomLibraryView` reads `LoomDraftStore().list()` and marks matching
    source rows as `Has draft` / `attached to draft`;
  - `npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 19/19;
  - `npm run typecheck` passed;
  - `npm run test:contracts` passed 249/249;
  - `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
    -scheme Loom -configuration Debug -destination 'platform=macOS' build`
    passed with `** BUILD SUCCEEDED **`;
  - `git diff --check` and `git diff --cached --check` passed.
- Installed-app Computer Use acceptance at 2026-05-09 10:46 AEST:
  - `npm run app:user` rebuilt and installed
    `/Users/yinyiping/Applications/Loom.app`;
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files;
  - `npm run app:where` reported
    `/Users/yinyiping/Applications/Loom.app`;
  - the stale pre-install process was exited and the installed app relaunched
    from that bundle as pid 44225;
  - Computer Use verified visible `DELETE` buttons in Source Index, the
    destructive `Delete this capture?` sheet, Escape cancel without deletion,
    and the installed Source row `ECON 3202 ... Has draft`.
- Native Draft AI composition verification at 2026-05-09 10:58 AEST:
  - CUA first showed the installed native Draft still lacked the web-only AI
    panel; the fix moved the same composition affordance into
    `LoomDraftView.swift`.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 42/42
    after first failing on the missing native contract.
  - `npm run typecheck`, `npm run test:contracts` 250/250, and Debug
    `xcodebuild` passed.
  - `npm run app:user` rebuilt and installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
    630 static web files; `npm run app:where` reported the same installed path.
  - The stale process was exited and the freshly installed app relaunched as
    pid 51238. Computer Use verified the live installed Draft page contains
    `AI draft`, `Continue with AI`, and `No AI text yet.` The AI button was not
    clicked during acceptance to avoid starting a real provider call.
- Legacy deletion review gate at 2026-05-09 11:04 AEST:
  - `lib/new-loom/legacy-route-deletion.ts` now exports
    `NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS`,
    `getLegacyRouteDeletionReview`, and `listLegacyRoutesReadyForDeletion`.
  - The focused skeleton contract first failed on the missing executable
    registry, then passed 43/43 after the registry and docs update.
  - `npm run test:contracts` passed 251/251, `npm run typecheck` exited 0,
    `git diff --check` passed, and `git diff --cached --check` passed.
  - Computer Use re-checked the installed Source Index and saw visible
    `DELETE` buttons beside both Recent captures. The button was not clicked in
    this pass because GUI deletion is destructive.
- Runtime boundary back-link pass at 2026-05-09 11:09 AEST:
  - `app/loom-render/capture/page.tsx` now labels its breadcrumb as Source
    Index and links back to `/sources`.
  - `app/loom-render/snapshot/page.tsx` uses `/sources` for back/error/toolbar
    links and shortcut copy says Back to Organize.
  - `npx tsx --test tests/new-loom-skeleton-contract.test.ts` passed 44/44
    after first failing on the old runtime captures landing link.
  - `npm run typecheck` exited 0, `npm run test:contracts` passed 252/252,
    `npm run test:capture-interactive:export` passed 5/5, and
    `npm run verify:flipdisc-live-handoff` returned `ok: true`.
- Native reader return-to-Organize fix at 2026-05-09 11:23 AEST:
  - Computer Use initially caught that the native reader button had the new
    Source Index label but still returned to a hidden `Captures` list.
  - `CapturesView` now accepts `onBackToOrganize`, and
    `LoomMinimalRootView.returnToOrganizeFromRuntime()` switches selection to
    Organize, clears the pending capture reader URL, and removes the transient
    runtime history entry.
  - `npx tsx --test tests/captures-landing-refresh-contract.test.ts
    tests/new-loom-skeleton-contract.test.ts` passed 55/55.
  - `npm run typecheck` exited 0, `npm run test:contracts` passed 252/252, and
    Release `npm run app:user` rebuilt and installed
    `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the installed app at
    `2026-05-09T01:21:01.732Z`.
  - The installed app was relaunched from
    `/Users/yinyiping/Applications/Loom.app` as pid 66334.
  - Computer Use verified Source Index shows visible `DELETE` buttons for
    recent captures, opening a capture shows both native `Source Index` and
    web `‹ Source Index` return affordances, the web return link loads
    `loom://bundle/sources`, and the native Source Index button returns to the
    real Organize Source Index with `ORGANIZE WORK SURFACE Source Index` plus
    `DELETE` actions, not the hidden runtime `Captures` list.
  - No destructive delete was executed during this pass.
- Organize loop deepening at 2026-05-09 11:31 AEST:
  - web Source Index local imported files now fall back to `file://` from
    `origin.originalPath` instead of creating `#` links when
    `trace.source.href` is missing.
  - native Source Index Reader notes rows now expose `Draft` and attach a
    Reader notes source reference to Draft.
  - Red/green evidence: `tests/knowledge-home-source-library.test.tsx` first
    failed on each missing contract, then passed 19/19 after implementation.
  - Verification passed: `npm run typecheck`, `npm run test:contracts` 252/252,
    Debug `xcodebuild` with `LOOM_SKIP_WEB_STAGE=1`, `git diff --check`, and
    `git diff --cached --check`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
    630 static web files; `npm run app:where` reported the same installed path
    at `2026-05-09T01:30:55.582Z`.
- Web Draft reference-open bridge at 2026-05-09 11:36 AEST:
  - web `/draft` reference and provenance links now call
    `openDraftReference()` and post `openReference` through
    `window.webkit.messageHandlers.loomNavigate` inside the installed app.
  - `NavigationBridgeHandler.handleOpenReference()` mirrors native Draft
    reference opening: capture artifacts reopen the saved reader, content refs
    enter native source-folder/file surfaces, other `loom://` refs return to
    Source Index, and external or local-file URLs open through `NSWorkspace`.
  - Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
    on the missing bridge contract, then passed 45/45. `npm run typecheck`
    exited 0 and `npm run test:contracts` passed 253/253.
- Source Index delete/access acceptance at 2026-05-09 11:58 AEST:
  - `testActivateAtLaunchNotifiesAfterRestoringBookmarks` first failed on the
    missing restored-root notification, then passed 1/1 after the fix.
  - `SecurityScopedFolderStoreTests` passed 10/10.
  - `npm run test:contracts` passed 253/253.
  - Debug `xcodebuild` with `LOOM_SKIP_WEB_STAGE=1` passed.
  - `git diff --check && git diff --cached --check` passed.
  - `npm run app:user` rebuilt Release and installed
    `/Users/yinyiping/Applications/Loom.app`.
  - `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the same installed path at
    `2026-05-09T01:58:13.451Z`.
  - The freshly installed app was relaunched from that bundle as pid 84817.
    Computer Use verified Source Index shows visible `DELETE` buttons beside
    both recent captures, and both `INFS 3822` and `ECON 3202` show
    `Connected` / `Indexed` on the initial Organize surface. No destructive
    delete was executed.
- Local image OCR at 2026-05-09 12:04 AEST:
  - Native image import now calls Vision OCR and stores recognized text in the
    imported source summary while retaining original-path and visual-provenance
    fallback text.
  - The old "OCR is not available yet" placeholder was removed.
  - Focused OCR tests passed 2/2, and full `TypedExtractorMatchTests` passed
    5/5.
  - Focused new-Loom contract passed 46/46; full `npm run test:contracts`
    passed 254/254; Debug `xcodebuild` passed.
  - `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`;
    `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the installed app at
    `2026-05-09T02:06:41.927Z`.
  - Computer Use verified the freshly relaunched installed app as pid 89341:
    Organize shows visible `DELETE` actions and `Connected` / `Indexed` source
    rows; Collect shows `Add files`. No destructive delete or user-file import
    was executed.
- Scanned PDF OCR fallback at 2026-05-09 12:15 AEST:
  - Native PDF import now tries the normal PDFKit text path first, then renders
    scanned pages and runs Vision OCR only if PDFKit produces empty cleaned
    text.
  - The fallback keeps downstream `CleanText` and page-range behavior in the
    same `PDFExtraction` pipeline instead of creating a separate scanner-only
    import mode.
  - Red/green evidence: the focused scanned-PDF fallback test first failed on
    the missing overload, then passed 1/1 after implementation. Full
    `CleanTextParityTests` passed 9 executed tests with 1 expected skip and 0
    failures.
  - Focused scanned-PDF new-Loom contract passed 1/1; full
    `tests/new-loom-skeleton-contract.test.ts` passed 47/47; full
    `npm run test:contracts` passed 255/255; Debug `xcodebuild` passed.
  - `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`;
    `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the installed app at
    `2026-05-09T02:18:09.259Z`.
  - Computer Use verified the freshly relaunched installed app as pid 96320:
    Source Index, Collect / Organize / Draft, visible capture `DELETE`
    buttons, and `Connected` / `Indexed` source rows are intact. No
    destructive delete or user-file import was executed.
- PPTX embedded alt text at 2026-05-09 12:22 AEST:
  - Slide-deck import now includes embedded PowerPoint shape/image title and
    description metadata from `cNvPr` while preserving existing slide text and
    speaker-note parsing.
  - Red/green evidence: the focused alt-text test first failed with only the
    visible slide text returned, then passed 1/1 after implementation. Full
    `SlideDeckExtractorTests` passed 10/10.
  - Focused PPTX alt-text new-Loom contract passed 1/1; full
    `tests/new-loom-skeleton-contract.test.ts` passed 48/48; full
    `npm run test:contracts` passed 256/256; Debug `xcodebuild` passed.
  - `git diff --check` and `git diff --cached --check` passed.
  - `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`;
    `npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630
    static web files; `npm run app:where` reported the installed app at
    `2026-05-09T02:25:31.278Z`.
  - Computer Use verified the freshly relaunched installed app as pid 2455:
    Source Index, Collect / Organize / Draft, visible capture `DELETE`
    buttons, and `Connected` / `Indexed` source rows are intact. No
    destructive delete or user-file import was executed.
- Keynote / Pages iWork metadata import at 2026-05-09 12:36 AEST:
  - `SlideDeckExtractor.parsePPTXText(at:)` now falls back from PowerPoint
    slide/notes XML to iWork archive parsing for `.key` and `.pages` files.
  - The iWork path reads `Metadata/*.plist` for title, author, subject,
    comments, and keywords, and extracts text from `QuickLook/Preview.pdf`
    through the existing `PDFExtraction` pipeline when present.
  - Native Collect allows `.pages`, and imported `.key` / `.pages` files keep
    distinct `local-key` / `local-pages` origin kinds.
  - Red/green evidence: focused iWork tests first failed because
    `metadata.key` and `metadata.pages` returned nil, then passed 2/2 after the
    iWork parser was added. Full `SlideDeckExtractorTests` passed 12/12.
  - Wider gates passed: `tests/new-loom-skeleton-contract.test.ts` 49/49,
    `npm run test:contracts` 257/257, and Debug Xcode build succeeded with
    `LOOM_SKIP_WEB_STAGE=1`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `2026-05-09T02:34:35.496Z`.
  - Computer Use verified the freshly relaunched installed app as pid 10034:
    Source Index opens, recent captures expose visible `DELETE` buttons,
    Collect opens, Draft opens with saved content/references, and the app was
    returned to Organize. No destructive delete or user-file import was
    executed.
- Image semantic labels at 2026-05-09 12:43 AEST:
  - Native image import now calls `VNClassifyImageRequest` in addition to
    Vision OCR, then stores normalized and deduplicated labels under
    `Visual description:` in the imported source summary.
  - Red/green evidence: the focused native contract first failed on missing
    `VNClassifyImageRequest`; the focused Swift test first failed on the
    missing `visualDescriptions:` builder argument. After implementation,
    focused Swift passed 1/1 and full `TypedExtractorMatchTests` passed 6/6.
  - Wider gates passed: `tests/new-loom-skeleton-contract.test.ts` 50/50,
    `npm run test:contracts` 258/258, and Debug Xcode build succeeded with
    `LOOM_SKIP_WEB_STAGE=1`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `2026-05-09T02:43:02.193Z`.
  - Computer Use verified the freshly relaunched installed app as pid 16860:
    Source Index opens with visible `DELETE` buttons, Collect opens with
    `Add files`, Draft opens with saved content/references, and the app was
    returned to Organize. No destructive delete or user-file import was
    executed.
- iWork body text runs at 2026-05-09 12:49 AEST:
  - Keynote / Pages imports now scan `Index/*.iwa` for best-effort printable
    UTF-8 and UTF-16LE text runs and append useful strings under
    `iWork body text`.
  - Red/green evidence: focused Swift tests first failed because `body.key`
    and `body.pages` returned only metadata, then passed 2/2 after
    implementation. Full `SlideDeckExtractorTests` passed 14/14.
  - Wider gates passed before reinstall: `tests/new-loom-skeleton-contract.test.ts`
    50/50, `npm run test:contracts` 258/258, and Debug `xcodebuild` with
    `LOOM_SKIP_WEB_STAGE=1`.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `2026-05-09T02:52:27.910Z`.
  - Computer Use verified the freshly relaunched installed app as pid 24418:
    Source Index opens with visible `DELETE` buttons, Collect opens with
    `Add files`, Draft opens with saved body/references/AI draft/Draft board,
    and the app returned to Organize. No destructive delete, user-file import,
    or AI call was executed.
- iWork Unicode body text at 2026-05-09 13:00 AEST:
  - The IWA scanner now handles Unicode UTF-8 scalars and non-ASCII UTF-16LE
    code units, so Chinese Keynote / Pages strings are preserved instead of
    being filtered out by the original ASCII-only scan.
  - Red/green evidence: focused Swift tests first failed on missing
    `第 3 页：机制设计例子` and `第 3 页：先理解再自测`; after implementation the
    focused tests passed 2/2, the focused new-Loom contract passed 50/50, and
    full `SlideDeckExtractorTests` passed 14/14.
  - Release install verification passed: `npm run app:user` installed
    `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for
    bundle id `com.yinyiping.loom` with 630 static web files; `npm run
    app:where` reported `2026-05-09T03:03:31.704Z`.
  - Computer Use verified the freshly relaunched installed app as pid 31026:
    Source Index opens with visible `DELETE` buttons, Collect opens with
    `Add files`, Draft opens with saved body/references/AI draft/Draft board,
    and the app returned to Organize. No destructive delete, user-file import,
    or AI call was executed.

## Closed Phase 1 Handoff Gate

This Phase 1 gate is now closed:

```text
Atlas opens https://flipdisc.io
  -> user-visible floating button or context-menu capture action
  -> extension writes payload / clipboard
  -> loom://capture?via=clipboard opens native CaptureSheet
  -> Save
  -> saved Loom.md + CaptureAST sidecar
  -> npm run verify:capture-handoff
  -> installed reader opens from Organize and renders the segment diagram
```

Computer Use completed this path at 2026-05-09 03:58 AEST by clicking the
visible floating Loom button in Atlas and validating the installed Loom reader.

## Remaining Product Work

Do not mark the full objective complete yet. The major migration path is
verified, but the larger "new Loom" goal still needs compatibility-route
deletion review and deeper Collect / Organize / Draft product completion
tracked in the completion audit.

Importer work is improved but not finished: Keynote / Pages metadata,
best-effort Unicode IWA UTF-8 / UTF-16LE text runs, QuickLook preview text,
image OCR, and basic Vision labels are covered, while full iWork
protobuf/layout and body/slide/page reconstruction, higher-fidelity image
understanding, and release-cycle evidence across real user files remain open.
Use `npm run verify:real-files-importer` for the new opt-in real-file gate; it
requires an explicit `--root PATH` or `LOOM_REAL_FILE_ROOT`, uses no implicit
real-file corpus default, compiles the native Swift PDF extraction path outside
the app sandbox, and checks real PDFs/images plus optional document and
slide-package candidates.
Latest pass at 2026-05-09 13:25 AEST: the gate verified
`Course Overview_FINS3640.pdf`, `INFS3822 Assessment Guide T1 2026.pdf`,
`COMM3030 Assessment Handbook ST, 2026.pdf`,
`Framework_for_Innovation_transparent.png`, and
`business-model-canvas (1).docx` from the real UNSW source tree.
The 13:29 AEST update added real PPTX package evidence:
`FINS3616 Week 2_Updated.pptx` yielded 43757 chars across 43 slide XML files
without launching the installed app.
The 14:01 AEST update made this gate explicit about real corpus coverage:
latest pass found 391 supported-size PDFs, 2827 supported images, 14 supported
attributed documents, 1 PPTX deck, and 0 real `.key` / `.pages` packages. The
verifier now prints `iwork: none found in real corpus` when no real iWork files
exist, and will attempt ZIP metadata, IWA body-string, and QuickLook preview
extraction if future real `.key` / `.pages` files are added under
`LOOM_REAL_FILE_ROOT`.

Current Computer Use retry at 2026-05-09 14:01 AEST is blocked by macOS lock
state: `CGSessionScreenIsLocked=Yes`, and `get_app_state("Loom")` returns
`cgWindowNotFound` even though the installed Loom process is running. Do not
treat this as a Loom UI pass or use desktop screenshots as a substitute.

The 14:20 AEST retry for the screenshot-reported missing delete key found the
installed bundle does contain the Source Index `Delete` / `Delete now` UI,
`loomCaptureDelete` bridge, and danger styling. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with 630 static web files, and
`npx tsx --test tests/knowledge-home-source-library.test.tsx
tests/captures-landing-refresh-contract.test.ts` passed 30/30. A local HTTP
render of the installed `sources.html` bundle with mocked native capture data
showed two visible Recent captures `Delete` buttons; clicking the first changed
it to `Delete now` plus `Cancel` without executing a real delete. The actual
Computer Use app-window check is still blocked by `CGSessionScreenIsLocked=Yes`
and `cgWindowNotFound`.

The 14:25 AEST gate expansion moved the remaining focused product/route
contracts into `npm run test:contracts`: sidebar source-library IA,
`/knowledge` top-level aliasing, native detail endpoints, pursuit detail
attachments, chapter placeholder cleanup, and Atelier honesty. Focused preflight
passed 14/14, then the expanded main contract gate passed 294/294.

The same 14:25 AEST pass also fixed two stale native storage/mirror tests before
adding that slice to the main gate. `CollectionClient` is now tested against the
current direct `loom://derived/knowledge/.cache/manifest/...` native manifest
boundary, not old `loom.knowledge.*` mirror keys, and `HomeClient` is tested as
a capability-only new Loom shell using `NEW_LOOM_CAPABILITIES` plus
`loomNavigate`, not native panel/pursuit/mirror record helpers. Focused
storage/native/mirror evidence passed 27/27, then `npm run test:contracts`
passed 321/321.

The 14:27 AEST pass added first-paint and state-interaction contracts to the
main gate: Home first paint, sidebar accessibility/mode persistence, surface
actions, settings events, selection/support primitives, trace events,
work-session advancement, and native window titlebar tabbing. Focused evidence
passed 27/27, then `npm run test:contracts` passed 348/348.

The 14:29 AEST pass added lightweight capture and empty-doc contracts to the
main gate. The stale `empty-doc-capture` test was migrated from the deleted
`app/knowledge/[category]/[slug]/page.tsx` route to the current
`app/DocClient.tsx` `/doc?href=` entry, where `isEligibleCaptureDoc` selects
`EmptyDocCaptureSurface`. Focused evidence passed 13/13, then
`npm run test:contracts` passed 361/361. Keep
`tests/capture-interactive-artifacts.test.ts` in the dedicated
`test:capture-interactive:export` gate.

The 14:31 AEST pass added AI/CLI contracts to the main gate: Codex default CLI
preference and stale legacy migration, inline AI notice actions, Anthropic HTTP
SSE/recoverability, and native/research/e2e CLI defaults. Focused evidence
passed 21/21, then `npm run test:contracts` passed 382/382.

The 14:32 AEST pass added chat-focus contracts to the main gate: clarification
history, layout mode and positioning, pinning, source excerpt rendering, spacer
sizing, stage/view selection, and provider waiting state. Focused evidence
passed 27/27, then `npm run test:contracts` passed 409/409.

The 14:33 AEST pass added legacy compatibility/helper contracts to the main
gate: desk action derivation/presenters, eslint runtime compatibility, overlay
resume/root wiring, and weave contract status sync. Focused evidence passed
17/17, then `npm run test:contracts` passed 426/426. The only remaining
`tests/*.test.{ts,tsx}` file outside the main gate is
`tests/capture-interactive-artifacts.test.ts`, intentionally kept in
`test:capture-interactive:export`.

The 14:40 AEST pass responded to the installed-app screenshot where Source
Index Recent captures showed only Draft pills. Added a render-level
`KnowledgeHomeStatic` contract proving Recent captures now emit visible
`Draft` and `Delete` controls, and that the confirmation state emits
`Delete now` plus `Cancel`. Focused evidence passed 20/20, the main contract
gate passed 427/427, `npm run typecheck` passed, and
`git diff --check && git diff --cached --check` passed. Live Computer Use
acceptance is still blocked until the Mac session is unlocked:
`get_app_state` returns `cgWindowNotFound` and `ioreg` reports
`CGSessionScreenIsLocked=Yes`. The same pass rebuilt and reinstalled the
current Release app with `npm run app:user`; `npm run app:smoke` passed against
`~/Applications/Loom.app` (`bundle id: com.yinyiping.loom`, 630 static web
files). A second Computer Use read after reinstall still returned
`cgWindowNotFound` because the session remained locked.

The 14:48 AEST pass tightened the real-file importer gate for images. The
standalone Swift verifier now runs `VNRecognizeTextRequest` and
`VNClassifyImageRequest` against real images from
`~/Desktop/Knowledge System/UNSW` and reports OCR plus visual-description
counts, rather than only checking `NSImage(contentsOf:)`. Red/green evidence:
`tests/new-loom-skeleton-contract.test.ts` first failed on missing Vision
coverage, then passed 51/51 after the verifier update. `npm run
verify:real-files-importer` passed cleanly with 391 PDFs, 2827 images, 14
attributed documents, 1 PPTX deck, 0 iWork packages, and image evidence of
OCR 29 plus visualDescriptions 12 across three real images. `npm run
test:contracts` passed 427/427 and `npm run typecheck` passed.

The 14:56 AEST pass tightened Draft AI source context. Web Draft and native
`LoomDraftAIPrompt` now include capture `capturedAt` metadata in the attached
reference prompt lines that feed `draft-compose`. Red/green evidence: the web
skeleton contract first failed on missing capturedAt prompt coverage, and the
new Swift selected test first failed because native prompt output omitted the
timestamp. After implementation, focused web passed 51/51, selected Swift
passed 1/1, `npm run test:contracts` passed 427/427, `npm run typecheck`
passed, full `LoomDraftStoreTests` passed 10/10, and `git diff --check &&
git diff --cached --check` passed.

The 15:03 AEST pass removed stale Atlas implementation residue without deleting
the compatibility routes. `app/AtlasHubClient.tsx` was unimported after
`/atlas` and `/atlas/shelf` became redirects to `/sources`, but it still
contained old `/atlas/shelf`, `/knowledge`, and "Compatibility routes stay
live" UI copy. `tests/atlas-hub-phase2.test.ts` first failed on the lingering
file, then passed 6/6 after deletion. `npm run test:contracts` passed 428/428,
`npm run typecheck` passed, and `git diff --check && git diff --cached
--check` passed. The route files and deletion registry stay in place until
release-cycle evidence exists.

The 15:06 AEST pass removed stale Desk implementation residue without deleting
the `/desk` compatibility route. `app/desk/DeskPage.tsx` was unimported after
`/desk` became a redirect to `/sources`, but it still composed old Atlas and
Today clients. `tests/desk-first-ia.test.ts` first failed on the lingering
file, then passed 3/3 after deletion. `npm run test:contracts` passed 429/429,
`npm run typecheck` passed, and `git diff --check && git diff --cached
--check` passed. `app/desk/page.tsx` and the deletion registry remain in place
until release-cycle evidence exists.

The 15:11 AEST pass removed stale Today implementation residue without deleting
the `/today` compatibility route. `app/today/TodayClient.tsx` was unimported
after `/today` became a direct redirect to `/sources`, and its `.loom-today*`
CSS in `app/globals.css` had no remaining runtime owner. Red/green evidence:
the focused route cleanup tests first failed on the lingering client file, then
passed 8/8 after deletion; the follow-up CSS cleanup contract first failed on
the dead `.loom-today` selector, then passed after removing that block. The
combined focused gate passed 9/9, `npm run test:contracts` passed 431/431, and
`npm run typecheck` passed. `app/today/page.tsx` and the deletion registry
remain in place until release-cycle evidence exists.

The 15:18 AEST pass removed stale top-level visual-source implementation
residue without deleting the compatibility routes. `app/PatternsClient.tsx`,
`app/PursuitsClient.tsx`, and `app/WeavesClient.tsx` had no runtime imports
after `/patterns`, `/weaves`, and `/pursuits` became Organize redirects, but
tests still read those files. Their dead route-only CSS was removed from
`app/globals.css` while retaining active `.loom-pursuit-detail*` styles for the
hidden direct pursuit detail route. Red/green evidence: the focused cleanup
suite first failed on the lingering files and selectors, then passed 76/76
after deletion. `npm run test:contracts` passed 433/433 and `npm run
typecheck` passed. The route files and deletion registry remain in place until
release-cycle evidence exists.

The 15:21 AEST pass removed stale Workbench implementation residue without
deleting the `/workbench` compatibility route. `app/WorkbenchClient.tsx` had no
runtime imports after `/workbench` became a redirect to `/draft`; Draft owns the
old Workbench body import and save/word-count behavior now. The dead
`.loom-workbench*` CSS block was removed from `app/globals.css`. Red/green
evidence: `tests/new-loom-skeleton-contract.test.ts` first failed on the
lingering file, then passed 51/51 after deletion. `npm run test:contracts`
passed 433/433 and `npm run typecheck` passed. `app/workbench/page.tsx` and the
deletion registry remain in place until release-cycle evidence exists.

The 15:23 AEST pass removed stale Contents implementation residue without
deleting the `/contents` compatibility route. `app/ContentsClient.tsx` had no
runtime imports after `/contents` became a redirect to `/sources`, but it still
held the old chapter map and links back to retired surfaces. The dead
`.loom-contents*` CSS block was removed from `app/globals.css`. Red/green
evidence: `tests/new-loom-skeleton-contract.test.ts` first failed on the
lingering file, then passed 51/51 after deletion. `npm run test:contracts`
passed 433/433 and `npm run typecheck` passed. `app/contents/page.tsx` and the
deletion registry remain in place until release-cycle evidence exists.

The 15:29 AEST pass removed the next orphan retired-route clients without
deleting their compatibility route files: `app/uploads/UploadsClient.tsx`,
`app/coworks/CoworksIndexClient.tsx`, `app/LetterClient.tsx`,
`app/BranchingClient.tsx`, `app/PalimpsestClient.tsx`,
`app/ConstellationClient.tsx`, `app/DiagramsClient.tsx`, and
`app/SalonClient.tsx`. The matching dead CSS was removed from
`app/globals.css`, while active Draft board, panel detail, and pursuit detail
code stayed in place. The Draft board was later moved from the legacy
`app/SoanClient.tsx` file into `app/draft/DraftBoardClient.tsx`. A follow-up red/green assertion also
removed old M13/M16 design-story comments from the redirect-only `letter`,
`branching`, `palimpsest`, `constellation`, and `salon` pages. Red/green
evidence: the focused cleanup suite first failed 9 tests because the files still
existed, then passed 66/66 after deletion; the route-comment assertion then
failed on the stale comments and passed after cleanup. `npm run test:contracts`
passed 434/434 and `npm run typecheck` exited 0. Route files and the deletion
registry remain in place until release-cycle evidence exists.

The 16:15 AEST pass removed stale Atelier implementation residue without
deleting the `/atelier` compatibility route. `app/AtelierClient.tsx` had no
runtime imports after `/atelier` became a redirect to `/draft`; Draft owns quote
insertion, provenance, native-backed storage, and AI continuation. The dead
`.loom-atelier*` CSS block was removed from `app/globals.css`. Red/green
evidence: focused tests first failed because `app/AtelierClient.tsx` still
existed, then passed 54/54 after deletion. `app/atelier/page.tsx` remains the
compatibility redirect and the deletion registry remains blocked until
release-cycle evidence exists.

The 16:20 AEST pass moved the active web Draft board runtime from
`app/SoanClient.tsx` to `app/draft/DraftBoardClient.tsx`. `/draft` now imports
`DraftBoardClient` directly, and `app/SoanClient.tsx` no longer exists. The old
`/soan` route still redirects to `/draft?view=board`; route deletion remains
blocked by the same release-cycle evidence gate. Red/green evidence: the
focused suite first failed because `DraftBoardClient.tsx` was missing, then
passed 61/61 after the migration.

The 16:25 AEST pass renamed the active web Draft board DOM/CSS namespace from
`.loom-soan*` to `.draft-board*`. The native storage and invalidation names
(`loom://native/soan.json`, `loom.soan.v1`, `loom-soan-updated`) remain internal
compatibility names for existing draft-card data; the rendered board classes and
global CSS no longer carry the old product namespace. Red/green evidence:
`tests/new-loom-skeleton-contract.test.ts` first failed on the old class
namespace, then passed 51/51 after the rename.

The 16:33 AEST pass removed a browser-prompt deletion remnant from the hidden
question detail fallback. `PursuitDetailClient` now uses inline `Delete now` /
`Cancel` confirmation state before posting `deletePursuit` to the native bridge,
matching the no-browser-prompt direction already used by Source Index capture
deletion. Red/green evidence: `tests/pursuit-detail-contract.test.ts` first
failed on `window.confirm`, then passed 3/3 after the inline confirmation
change. Related focused route/detail contracts passed 59/59, `npm run
typecheck` passed, and `npm run test:contracts` passed 437/437. Release
install also passed: `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed with 630
static web files, and `npm run app:where` reported the same installed app at
`2026-05-09T06:35:33.996Z`. Computer Use still cannot read the visible window
while the macOS session is locked: `get_app_state("com.yinyiping.loom")`
returned `cgWindowNotFound`, System Events reported 0 Loom windows, and `ioreg`
reported `CGSessionScreenIsLocked=Yes`.

The 16:46 AEST pass re-checked the user's Source Index screenshot complaint
that there was no delete key. The current Source Index implementation has
visible confirmed capture deletion in the web Source Index and native
`LoomLibraryView`; the installed app was rebuilt and reinstalled to refresh the
bundle. `tests/knowledge-home-source-library.test.tsx` continues to cover
`Delete` / `Delete now`, the native destructive action, and visible action-row
layout. The installed binary also contains the capture deletion strings:
`Delete this capture?`, `Couldn't delete capture`, and
`Delete this capture from Loom.md`.

The same pass removed old visible wording from the hidden panel detail fallback:
`PanelDetailClient` no longer renders `This held panel exists`, `status: 'held
panel'`, `Wefts · pending`, `source-level wefts`, or `source provenance still
gated`; it now uses Reader note and Source context copy. Red/green evidence:
`tests/chapter-surface-honesty.test.ts` first failed on the old held-panel copy,
then passed 5/5 after the migration. Related focused gates passed 36/36;
`npm run typecheck` passed; `npm run test:contracts` passed 437/437; `git diff
--check && git diff --cached --check` passed. Release install passed after the
final change: `npm run app:user`, `npm run app:smoke` with 630 static web files,
and `npm run app:where` at `2026-05-09T06:45:38.557Z`.

Computer Use was attempted again after installation, but visible-window
acceptance remains blocked by the locked macOS session:
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, System Events
reported 0 Loom windows, the process still runs from
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, and `ioreg`
reported `CGSessionScreenIsLocked=Yes`.

The 16:56 AEST pass tightened the user's Source Index screenshot complaint into
an explicit native affordance fix: Recent captures now render a dedicated
`trash` icon button beside `Draft`, using `LoomTokens.dsAlert` and
`Delete this capture from Loom.md` help text, then open the existing confirmed
delete alert. Red/green evidence: `tests/knowledge-home-source-library.test.tsx`
first failed because `LoomLibraryView.WorkRow` had no
`Image(systemName: "trash")` or capture-specific delete help, then passed 21/21.
Focused gates passed 83/83 across
`tests/knowledge-home-source-library.test.tsx`,
`tests/new-loom-skeleton-contract.test.ts`, and
`tests/captures-landing-refresh-contract.test.ts`; `npm run typecheck`,
`npm run test:contracts` 437/437,
`git diff --check && git diff --cached --check`, `npm run app:user`,
`npm run app:smoke`, and `npm run app:where` also passed. The installed app is
`/Users/yinyiping/Applications/Loom.app` at `2026-05-09T06:54:47.724Z`, and the
binary contains `Delete this capture?` plus `Delete this capture from Loom.md`.
Computer Use still cannot capture the Loom window while the macOS session is
locked: `get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`,
`list_apps` showed Loom running, and `ioreg` reported
`CGSessionScreenIsLocked=Yes`.

The 17:08 AEST pass migrated the `/system` support page out of the retired
SystemAtlas vocabulary. `app/SystemAtlasClient.tsx` is replaced by
`app/SystemClient.tsx`, and `app/system/page.tsx` mounts `SystemClient`.
Visible copy now explains the Collect / Organize / Draft loop with `Source
Index`, `Reader notes`, `Draft references`, and `Original files stay read-only`;
old terms such as `Book Room`, `Workbench`, `Sōan`, `Weft engine`, `Panel
ledger`, and `Letter outbox` are contract-banned for that page. Red/green
evidence: `tests/new-loom-skeleton-contract.test.ts` first failed on lingering
`SystemAtlasClient`, then passed 52/52. The focused route/product-language gate
passed 62/62, `npm run typecheck` passed, `npm run test:contracts` passed
438/438, and both diff whitespace checks passed.

Release install also passed after the `/system` change: `npm run app:user`,
`npm run app:smoke` with 630 static web files, and `npm run app:where` at
`2026-05-09T07:07:46.254Z`. The installed `/system` chunk contains the new
Collect / Organize / Draft wording and has no old SystemAtlas/Product-map term
matches. Computer Use acceptance was retried with both bundle id and app name,
but remains blocked by the locked macOS session: `get_app_state` returned
`cgWindowNotFound`, `list_apps` showed Loom running, `pgrep` found the
installed app binary, and `ioreg` reported `IOConsoleLocked=Yes` plus
`CGSessionScreenIsLocked=Yes`.

The 17:18 AEST pass tightened Draft board visible labels without changing
storage compatibility. Web and native Draft board surfaces now show literal
labels `Unclear`, `Connection`, and `Related` instead of exposing `Fog`,
`Weft (echo)`, or `echo (dashed muted)` to the learner. Internal identifiers
such as `fog`, `weft`, `echo`, `LoomSoanCard`, `LoomSoanEdge`,
`loom://native/soan.json`, and `loom.soan.v1` remain compatibility/storage
names only. Red/green evidence: `tests/new-loom-skeleton-contract.test.ts`
first failed on the missing literal labels, then passed 53/53. Wider
verification passed: `npm run typecheck`, Debug Xcode build,
`npm run test:contracts` 439/439, `npm run app:user`, `npm run app:smoke`
with 630 static web files, and `npm run app:where` at
`2026-05-09T07:15:54.565Z`. Installed bundle checks found
`Delete this capture from Loom.md`; the installed Draft chunk contains
`label:"Unclear"`, `label:"Connection"`, and `unclear note, connection,
sketch`. Computer Use was retried after reinstall/opening the app, but still
cannot read the visible Loom window while the macOS session is locked:
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` returned
`cgWindowNotFound`, `list_apps` showed Loom running, and `ioreg` reported
`IOConsoleLocked=Yes`.

At 17:21 AEST, Computer Use acceptance succeeded after the macOS session
unlocked (`IOConsoleLocked=No`). `get_app_state("com.yinyiping.loom")` read the
installed Loom Source Index window and showed visible per-row `DRAFT` and
`DELETE` buttons for both Recent captures. The delete action was not clicked
because that would enter a destructive flow; the installed binary still carries
the confirmed delete strings `Delete this capture?` and
`Delete this capture from Loom.md`. Computer Use also navigated to `Draft` and
read the installed native Draft surface with references, `AI draft`, `Save
draft`, and the `Draft board` panel. There were no existing draft cards in that
runtime, so visible card-label inspection remains covered by contract tests and
installed bundle string checks rather than live card instances.

The 17:27 AEST pass tightened native Shuttle Draft-card subtitles to match the
literal Draft board vocabulary. `ShuttleHit.display` now renders Draft-card
kind `fog` as `Unclear` and `weft` as `Connection`, while preserving those
values as internal storage identifiers. Red/green evidence:
`tests/shuttle-canonical-ia.test.ts` first failed on the direct `c.kind`
subtitle, then passed 2/2 after `draftCardKindLabel(c.kind)` was added. Wider
verification passed: `npm run test:contracts` 439/439, `npm run typecheck`,
Debug Xcode build, both diff whitespace checks, `npm run app:user`,
`npm run app:smoke`, and `npm run app:where` for
`/Users/yinyiping/Applications/Loom.app` at `2026-05-09T07:26:45.962Z`.
Computer Use verified the installed Source Index still shows per-row `DRAFT`
and `DELETE` buttons after reinstall, and Shuttle opens/searches. The current
runtime has no draft-card results for `draft`, `unclear`, or `connection`, so
the Shuttle subtitle migration is accepted through contract/source/build
evidence rather than a live card-row visual instance.

The 17:32 AEST pass tightened native note-connection labels across Shuttle,
the `Connect Reader Notes` sheet, and Settings > Data. Storage kinds remain
`supports`, `contradicts`, `elaborates`, and `echoes`, but visible labels now
render as `Supports`, `Contradicts`, `Adds detail`, and `Related`. Red/green
evidence: `tests/shuttle-canonical-ia.test.ts` first failed on direct `w.kind`
display, while `tests/new-loom-skeleton-contract.test.ts` first failed on the
lower-case relation picker and direct Data Settings row title; both focused
tests passed after helper-based label mapping.

Installed verification for that pass also completed: `npm run test:contracts`
passed 439/439, `npm run typecheck` passed, Debug Xcode build passed, both
diff whitespace checks passed, and `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`. `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 630 static web files; `npm run app:where`
reported the installed app at `2026-05-09T07:36:05.454Z`. The running process
path was `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
Computer Use verified the installed Source Index still exposes per-row `DRAFT`
and `DELETE` buttons. Shuttle opened and accepted searches for `connection`
and `Related`, but the current runtime has no note-connection rows, so the
visible relation-label change is accepted through contract/source/build
evidence rather than a live relation-row instance in this dataset.

The 14:05 AEST update restored hidden panel/question direct detail routes
without making them product navigation: `app/panel/[id]/page.tsx` and
`app/pursuit/[id]/page.tsx` wrap the same detail clients as the flat
static-export fallbacks, while `app/panels/[id]/page.tsx` and
`app/pursuits/[id]/page.tsx` keep older plural aliases redirecting to the
singular dynamic routes. `/panel/[id]`, `/panels/[id]`, `/pursuit/[id]`, and
`/pursuits/[id]` are recorded as legacy migration-source routes in the
migration map and deletion registry. `tests/canonical-detail-routes.test.ts`
first failed on the missing dynamic panel route, then
`tests/legacy-detail-aliases.test.ts` failed on the missing plural alias; both
now pass, and those detail-route contracts are included in
`npm run test:contracts`.

At 17:46 AEST, the user supplied screenshots that appeared to show no delete
button in Source Index Recent captures. Computer Use was rerun against the
current installed Loom process (`pid 66489`) from
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` and read visible
per-row `DRAFT` controls plus `Delete` trash-icon buttons with
`Delete this capture from Loom.md` help text. The live screenshot also showed
the red trash icon beside each `DRAFT` pill. The destructive delete action was
not clicked. Fresh supporting checks passed: `npm run app:where` reported
`/Users/yinyiping/Applications/Loom.app` at `2026-05-09T07:43:40.071Z`; the
installed binary contains `Delete this capture?` and
`Delete this capture from Loom.md`; and
`npx tsx --test tests/knowledge-home-source-library.test.tsx` passed 21/21.

The 17:50 AEST cleanup removed the remaining orphaned Atlas shelf client:
`app/AtlasClient.tsx`. `/atlas` and `/atlas/shelf` already redirect to
`/sources`, so that client and its `.loom-atlas*` / `data-atlas-empty-group`
CSS in `app/globals.css` were dead legacy implementation residue. Red/green
evidence: the focused Atlas / Desk / mirror-helper tests first failed on the
lingering client and CSS, then passed 15/15 after deletion. The route files
remain compatibility redirects; this was not `/atlas` route deletion. Wider
verification passed: `npm run test:contracts` 440/440, `npm run typecheck`,
both diff whitespace checks, `npm run app:user`, `npm run app:smoke`, and
`npm run app:where` at `2026-05-09T07:53:58.076Z`. Installed resources no
longer contain `loom-atlas`, `data-atlas-empty-group`, or `AtlasClient`.
Computer Use verified the relaunched installed app as `pid 72840`; Source Index,
Collect / Organize / Draft, and per-row `DRAFT` / `Delete` controls still load.

At 18:00 AEST, the Source Index writing-continuation meta language was tightened
from `scratch` to the literal `draft notes` for non-tidied writing records,
while keeping `draft ready` for tidy records and leaving the Cowork migration
data path intact. Red/green evidence: the focused
`tests/knowledge-home-source-library.test.tsx` run first failed on rendered
`ECON 3202 · scratch · 2 sources · now`, then passed 22/22 after the
`KnowledgeHomeStatic.writingMeta` label change. Wider checks passed:
`npm run test:contracts` 441/441, `npm run typecheck`, `git diff --check`, and
`git diff --cached --check`. Installed verification also passed: `npm run
app:user`, `npm run app:smoke`, `npm run app:where` at
`2026-05-09T08:02:40.692Z`, and installed `sources.html` contains
`draft notes`. After relaunch, Computer Use verified the installed app as
`pid 76844`; Source Index, Collect / Organize / Draft, and per-row `DRAFT` /
`Delete` controls still load. The current user data has no Continue writing
row, so the live CUA pass covers shell stability while the label itself is
covered by render-contract plus installed-resource evidence.

At 18:15 AEST, native Keyboard Shortcuts help was tightened to remove retired
learner-facing language. `Cowork (rehearsal)` is now `Draft editing`;
`Drop screenshots straight into scratch` is now
`Attach screenshot to draft notes`; and the undo/redo label now says
`Undo / redo draft-note changes`. Red/green evidence:
`tests/new-loom-skeleton-contract.test.ts` first failed on the old Keyboard
Help group title, then passed 53/53. Wider checks passed: `npm run
test:contracts` 441/441, `npm run typecheck`, both diff whitespace checks,
`npm run app:user`, `npm run app:smoke`, and `npm run app:where` at
`2026-05-09T08:08:09.945Z`. Installed binary strings contain the new
draft-note labels and no retired Keyboard Help strings. A later Computer Use
retry was blocked because the macOS session locked again
(`IOConsoleLocked=Yes`, `CGSessionScreenIsLocked=Yes`); the earlier same-turn
Computer Use acceptance had already verified Source Index `DRAFT` / `Delete`
controls in the installed app, and no destructive delete action was clicked.

At 18:24 AEST, native Draft persistence was deepened so the installed app writes
readable Markdown sidecars beside the native JSON draft index. The new focused
test first failed because `Drafts/<draft-id>.md` was missing, then passed after
`LoomDraftStore` began writing the sidecar with title, body, references,
capture metadata, artifact-state metadata, and quoted excerpts. Full
`LoomDraftStoreTests` passed 11/11, `npm run test:contracts` passed 441/441,
`npm run typecheck` passed, and both diff whitespace checks passed. `npm run
app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`;
`npm run app:smoke` passed with bundle id `com.yinyiping.loom` and 630 static
web files; `npm run app:where` reported `2026-05-09T08:22:37.311Z`. Computer
Use then read the installed `Loom` window at Source Index as pid 82285 and
confirmed each current Recent captures row exposes `DRAFT` plus a `Delete`
trash button with `Delete this capture from Loom.md` help text. Delete was not
clicked.

At 18:30 AEST, native Draft storage was deepened again so those readable
sidecars are not only backup files but a recovery fallback. If `Drafts/drafts.json`
is missing, `LoomDraftStore.list()` now reads UUID-named `Drafts/*.md` files and
reconstructs the draft title, body, and reference metadata. Red/green evidence:
`LoomDraftStoreTests/testDraftsRecoverFromReadableMarkdownSidecarsWhenIndexIsMissing`
first failed with zero recovered drafts after deleting the JSON index, then
passed after recovery parsing was added. Full `LoomDraftStoreTests` passed 12/12;
`npm run test:contracts` passed 441/441; `npm run typecheck` and both diff
whitespace checks passed.

At 18:34 AEST, the current tree was rebuilt and reinstalled to
`/Users/yinyiping/Applications/Loom.app`. `npm run app:smoke` passed for bundle
id `com.yinyiping.loom` with 630 static web files, and `npm run app:where`
reported `2026-05-09T08:33:23.493Z`. Computer Use read the installed main Loom
window after closing the Keyboard Shortcuts window: Source Index was visible,
Collect / Organize / Draft were present, and both current Recent captures exposed
`DRAFT` plus a red `Delete` button with help text
`Delete this capture from Loom.md`. Delete was not clicked.

At 18:40 AEST, native Draft storage was deepened again so readable Markdown
sidecars are not only written and recovered when JSON is missing: when
`Drafts/<draft-id>.md` is clearly newer than `Drafts/drafts.json`,
`LoomDraftStore.list()` now parses and merges the sidecar title, body, and
references while preserving the original draft id and creation date. Red/green
evidence: `LoomDraftStoreTests/testDraftsReadNewerMarkdownSidecarEditsWhenIndexStillExists`
first failed because the JSON record still won, then passed after newer-sidecar
merging was added. Full `LoomDraftStoreTests` passed 13/13; `npm run
test:contracts` passed 441/441; `npm run typecheck` and both diff whitespace
checks passed. `npm run app:user` rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed for bundle
id `com.yinyiping.loom` with 630 static web files; `npm run app:where` reported
`2026-05-09T08:43:17.008Z`. The preexisting 18:14 AEST Loom process was quit
and relaunched so Computer Use read the new installed process as `pid 97697`.
CUA verified Source Index still exposes Collect / Organize / Draft and Recent
captures with both `DRAFT` and `Delete` controls, then opened Draft and saw the
saved body, References, AI draft panel, and Draft board.

At 18:53 AEST, native Collect Drag-to-import was locked as a main-window path.
`ContentView` now documents dropped files as routing into the Collect/Ingestion
pipeline rather than plaintext-only ingest; `KeyboardHelpView` says `Drop files
into Collect` and `Collect files — drop or pick PDFs, slides, Markdown, and
images`; `docs/loom.md` records that main Loom window drops and Collect
`Add files` use the same importer for PDF/PPTX/Keynote/Pages/Markdown/text/
DOCX/RTF/images. Red/green evidence: `tests/new-loom-skeleton-contract.test.ts`
first failed on the stale `Plain text only` comment, then passed 55/55 after
the wording/doc updates.

Installed-app acceptance followed at 18:58 AEST. `npm run app:user`
reinstalled `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke`
passed, and `npm run app:where` reported `2026-05-09T08:56:13.371Z`. After
relaunch, Computer Use read the installed process as `pid 4627`: Source Index
showed visible `DELETE` buttons beside recent captures, and Help -> Keyboard
Shortcuts showed `Drop files into Collect` plus
`Collect files — drop or pick PDFs, slides, Markdown, and images`.

At 19:04 AEST, the Phase 6 `@` reference prompt-context slice was added.
Web Draft now parses inline `@target`, `@target:p7`, `@target:p23-25`,
`@target#heading`, and `@target#artifact-state:0.4` mentions in the draft body,
resolves them against attached references by label/source/href basename, and
adds anchor/source/href lines to the Draft AI prompt. Native
`LoomDraftInlineReferenceParser` mirrors the same behavior in
`LoomDraftAIPrompt`. Red/green evidence: the focused TS draft-storage test
first failed because the parser did not exist, and the selected Swift prompt
test first failed because native prompt output omitted `Inline @references`;
after implementation the focused TS suite passed 14/14 and the Swift selected
test passed 1/1. This is prompt-context coverage, not full corpus-wide
autocomplete/search.

Installed verification after that slice: `npm run app:user` rebuilt and
installed `/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed
for bundle id `com.yinyiping.loom` with 630 static web files; `npm run
app:where` reported `/Users/yinyiping/Applications/Loom.app` at
`2026-05-09T09:07:46.238Z`; and the installed binary contains
`Inline @references:` plus `No inline @references in the draft.` Computer Use
was retried but is currently blocked by the locked macOS console:
`IOConsoleLocked=Yes`, `CGSessionScreenIsLocked=Yes`, and
`get_app_state("Loom")` / `get_app_state("com.yinyiping.loom")` return
`cgWindowNotFound`. A direct run of the installed executable created an
onscreen CG window from the current bundle, but AX/System Events still reports
zero Loom windows while locked. Rerun CUA after unlock before claiming installed
UI acceptance for this exact `@` slice.

At 19:29 AEST, the Phase 6 `⌘K inline edit` first slice was added for web and
native Draft. Web Draft now captures the selected textarea passage, streams an
inline replacement through `draft-compose`, shows it in an `AI edit` panel, and
only mutates the body when `Accept edit` calls `applyDraftInlineEdit(...)`; that
helper rejects blank replacements, invalid ranges, and stale selections. Native
Draft now uses `SelectableTextEditor`, tracks `draftSelectionRange`, traps
Command-K through `CommandKTrap`, streams the same inline edit prompt via
`LoomDraftInlineEdit`, and exposes `Accept edit` / `Discard edit`. This is
explicit accept/discard replacement, not rich multi-hunk diff review.

Verification for that slice: focused TS draft-storage passed 15/15, skeleton
contract passed 57/57, selected Swift inline-edit passed 1/1, full
`LoomDraftStoreTests` passed 15/15, `npm run test:contracts` passed 447/447,
`npm run typecheck` exited 0, and both diff whitespace checks exited 0.
`npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`;
`npm run app:smoke` passed for bundle id `com.yinyiping.loom` with 630 static
web files; `npm run app:where` reported `2026-05-09T09:28:55.794Z`; installed
strings include `Inline edit request:` and `Return only the replacement text for
the selected passage.` Computer Use was retried against the installed app, but
the macOS console is still locked: after launching the installed app and killing
the stale Xcode Debug process, `get_app_state("Loom")` returned
`cgWindowNotFound` while `IOConsoleLocked=Yes`. Rerun CUA after unlock before
claiming live installed UI acceptance for the inline-edit slice.

At 19:57 AEST, the live flipdisc non-UI handoff verifier was tightened so its
temporary saved-capture fixture behaves like a native save instead of a raw
extension payload. The fixture writer now persists media attachments as
`Loom-media-*` sidecars, rewrites `loom://media/<tmpId>` in Markdown and
CaptureAST to durable `loom://content/...` URLs, captures a JS-preserved
snapshot through `captureReaderWithSnapshotPayload(...)`, and verifies without
`--allow-transient-media`. Red/green evidence: the focused handoff-verifier test
first failed on the missing media rewrite / stricter verifier contract, then
passed 5/5. Live evidence: `npm run verify:flipdisc-live-handoff` passed with
`unresolvedMediaReferences: []`, seven media sidecars, a timestamp-matched
snapshot, and the expected `Frame Format` segment diagram.

At 20:03 AEST, Phase 6 whole-corpus Draft AI got its first retrieval-backed
prompt-context slice. Web Draft now loads the staged search index before compose
and inline edit, selects relevant corpus entries while skipping already-attached
references, and adds them to `Corpus context:`. Native Draft mirrors the prompt
shape with `LoomEmbeddingStore.similarAcrossAllRoots(to:)` via
`LoomDraftCorpusContext`. This is default corpus context for Draft AI, not yet
the richer corpus chat/search/autocomplete or artifact-state retrieval layer.
Verification after install: `npm run test:contracts` passed 452/452, full
`LoomDraftStoreTests` passed 17/17, `npm run typecheck` passed,
`npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`, and
`npm run app:smoke` passed with 630 static web files. Computer Use read the
installed app, confirmed the Draft AI surface is present, then navigated to
Organize and saw `DRAFT` plus `DELETE` controls on the Recent captures rows.
The latest `verify:capture-handoff` and `verify:flipdisc-live-handoff` runs
both passed for `flipdisc.io`; unresolved media references are empty, and the
only remaining warning is the expected raw Markdown flat-frame fallback that the
CaptureAST reader must replace with the structured `Frame Format` diagram.

At 20:13 AEST, the `@` prompt-context path was deepened from attached-reference
only to corpus-resolved. Web Draft now lets `draftInlineReferencePromptLines`
resolve unmatched `@target` mentions against selected corpus hits, emitting
`source=Corpus: ...` plus href/category/sourcePath. Native Draft mirrors this
in `LoomDraftInlineReferenceParser`, and native inline edit passes
`LoomDraftCorpusContext.similarHits(...)` into that same path. This is still
not the visual `@` autocomplete picker.

Final verification for this `@` slice: `npm run test:contracts` passed
452/452, full `LoomDraftStoreTests` passed 18/18, `npm run typecheck` exited 0,
and both diff whitespace checks exited 0. `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
static web files; `npm run app:where` reported `2026-05-09T10:16:40.929Z`.
Installed native/web bundle checks found the corpus-context and corpus-resolved
inline-reference prompt strings. The stale pre-install Loom process was
restarted, and Computer Use read the new installed process `pid 42206` with
Organize Delete controls visible on Recent captures and the Draft surface
opening with Flipdisc references plus AI controls.

At 20:26 AEST, the first visible `@` reference insertion workflow was added.
Web Draft now has an `@ Reference` search picker backed by staged source-index
docs; selecting a result inserts a stable token such as `@flipdisc-tutorial`
into the draft and attaches the matching source reference. Native Draft now has
a `Reference` sheet using `DocReferencePicker` and the same
`LoomDraftReferenceMention` token/reference mapping. Verification before the
next install pass: focused TS draft-storage 18/18, skeleton contract 59/59,
selected Swift insertion test 1/1, `npm run test:contracts` 452/452, full
`LoomDraftStoreTests` 19/19, `npm run typecheck`, and diff whitespace checks.
This is explicit search-and-insert, not automatic inline autocomplete while
typing `@`.

At 20:36 AEST, installed-app Computer Use acceptance caught and fixed a native
picker data-loading bug. The Draft `Reference` sheet opened but was empty
because `DocReferencePicker` tried to fetch `loom://bundle/search-index.json`
through `URLSession`; native SwiftUI code needs `LoomLocalResourceLoader`.
`AskAIDocReferenceIndex` now loads and parses the bundle search index through
that native loader. Red/green: new Swift regression first failed on missing
`AskAIDocReferenceIndex`, then passed 1/1; wider gates passed
`npm run test:contracts` 452/452, `npm run typecheck`, full
`LoomDraftStoreTests` 20/20, and diff whitespace checks. After reinstall,
`npm run app:smoke` passed with 630 bundled static web files and `app:where`
reported `2026-05-09T10:35:07.503Z`. Computer Use read installed process
`pid 55498` from `/Users/yinyiping/Applications/Loom.app`; the Reference sheet
loaded candidates, and picking `15 · Multimodal` inserted `@multimodal` and
added `Source 15 · Multimodal` to the Draft references. No delete action was
clicked.

At 20:48 AEST, the first inline `@` autocomplete/ranking slice was added. Web
Draft now detects an active `@query` at the textarea cursor, opens the same
source-index-backed candidate surface, ranks docs by stable token/title/href/
category/sourcePath/excerpt, skips already-attached references, and replaces
the active query with the selected stable `@token`. Native Draft mirrors the
active-query/ranking helpers in `LoomDraftReferenceMention`, preloads the bundle
search index through `AskAIDocReferenceIndex`, and shows a ranked candidate
panel under the editor while typing `@`. Red/green: focused TS first failed on
missing `activeDraftReferenceMention` / `rankDraftReferenceCandidates`;
selected Swift first failed on missing `activeQuery` / `rank`; after
implementation TS draft-storage passed 20/20, selected Swift passed 1/1, full
`LoomDraftStoreTests` passed 21/21, `npm run typecheck` exited 0, and the
skeleton contract passed 59/59 after the contract matched the wrapper call
path.

Installed-app acceptance after the 20:48 slice also passed. `npm run app:user`
rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm run
app:smoke` passed for bundle id `com.yinyiping.loom` with 630 bundled static
web files; `npm run app:where` reported `2026-05-09T10:51:12.742Z`; both git
diff whitespace checks exited 0. The previously running Loom process was older
than the install, so it was relaunched. Computer Use then read installed
process `pid 62626`, started at `2026-05-09 20:51:44 AEST`, with Organize
showing visible `DELETE` buttons on Recent captures. In Draft, typing a
temporary `@fl` query showed the native `Reference autocomplete` panel with
ranked candidates including `FlashAttention` and `Reflexion`; the temporary
query was deleted and the draft returned to `Saved`.

At 21:11 AEST, the flipdisc capture cleanup gap was tightened. The installed
content was readable, but repeated captures had left old sidecars in the source
folder. `CapturesIndex.delete(_:)` now removes the deleted block's owned
CaptureAST, timestamp-matched snapshot, and unshared `Loom-media-*` files while
preserving files still referenced by remaining markdown. Red/green: the new
Swift sidecar deletion regression first failed on orphaned owned sidecars, then
passed 1/1. Wider verification passed: skeleton 59/59, source library 22/22,
captures landing 11/11, capture media 47/47, `CapturePlacementTests` 3/3,
`npm run test:contracts` 455/455, `npm run typecheck`, and diff whitespace
checks. No real installed-app capture delete was clicked.

Installed acceptance followed after reinstall. `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
bundled web files; `npm run app:where` reported
`2026-05-09T11:14:46.284Z`. Computer Use read the relaunched installed process
`pid 72096`: Source Index showed 4 captures with visible Delete controls, the
Flipdisc reader opened with 2,245 words / 10m read, media, video placeholders,
and the `Frame Format` captured structure. Source Snapshot loaded the saved
snapshot DOM/AX tree with JS-preserved status; the visual iframe still needs a
follow-up pass if snapshot display fidelity is the next gate. The live handoff
verifier then passed at `2026-05-09T11:17:41.918Z` with 70 blocks,
`interactiveArtifactCount: 2`, `comparisonSliderCount: 1`,
`segmentDiagramCount: 1`, seven media sidecars, and
`unresolvedMediaReferences: []`.

At 21:29 AEST, the flipdisc source snapshot viewer gap was tightened. Full
source snapshots now inject viewer-owned cleanup CSS to hide leftover Loom
extension controls such as `Capture this page to Loom`, and JS-preserved
snapshots get a conservative height fallback when sandbox isolation prevents
parent DOM measurement. Focused verification passed:
`tests/capture-render-debug-artifacts.test.ts` 10/10,
`tests/capture-media-contract.test.ts` 47/47, `npm run typecheck`, both diff
whitespace checks, and `npm run test:contracts` 456/456. Reinstall then passed:
`npm run app:user`, post-install `npm run app:smoke` with 630 bundled static
web files, and `npm run app:where` at `2026-05-09T11:27:56.014Z`. Computer Use
read the relaunched installed process `pid 76683`; Source Index showed visible
Delete buttons, the Flipdisc reader still showed 2,245 words / 10m read and
the structured `Frame Format`, and Source Snapshot loaded full DOM/AX content
without the floating capture button. The live handoff recheck passed at
`2026-05-09T11:28:19.536Z` with 70 blocks, 2 interactive artifacts, 1
comparison slider, 1 segment diagram, seven media sidecars, and no unresolved
media references. Remaining risk: first-viewport visual fidelity for the
dynamic WebGL/canvas hero still needs extension-side canvas bitmap fallback.

At 21:39 AEST, the extension-side canvas snapshot fallback was added for
Flipdisc's dynamic hero/WebGL canvas case. Root cause: the live first hero
canvas can produce a successful but visually blank direct `toDataURL()` result,
so the old direct bitmap fallback skipped that canvas. The new snapshot path
tries direct canvas readback first, then scrolls the source canvas into view,
waits for paint/dynamic canvas activity, requests `capture-visible-tab` from
the background script, crops the visible screenshot to the canvas rect, and
bakes the JPEG crop into the cloned snapshot canvas. Red/green evidence: the
focused media contract first failed on the missing visible-tab fallback, then
passed 48/48 after implementation; snapshot renderer debug artifacts passed
10/10. The broader gates passed: `npm run typecheck`, `npm run test:contracts`
457/457, both diff whitespace checks, `npm run app:user`, `npm run app:smoke`,
`npm run app:where`, and `npm run app:check-extension`. Live source-extension
handoff passed at `2026-05-09T11:36:14.924Z`, with the fixture verifier passing
at `2026-05-09T11:36:27.897Z`: 70 blocks, 2 interactive artifacts, 1 comparison
slider, 1 segment diagram, 7 media sidecars, and no unresolved media
references. A one-off Playwright proof wired visible-tab capture to
`page.screenshot()` and showed all 5 live DOM canvases receiving fallback
coverage, including the first hero canvas via JPEG crop. Computer Use then read
the installed app: the Flipdisc snapshot details expose the full DOM/AX article
content, iframe, sections, interactive controls, and links; returning to Source
Index showed 4 captures with visible `DELETE` buttons. No destructive delete
was clicked. The detail snapshot page still has no primary delete button; delete
is currently only exposed from Source Index rows.

At 21:50 AEST, the snapshot-detail delete gap was closed. The Source Index rows
already had Delete, but the saved source snapshot toolbar did not. The snapshot
route now exposes `Delete` next to Reader, uses an inline two-step confirmation
(`Delete` -> `Delete now` plus `Cancel`), sends the same `rootID`, `subPath`,
`title`, and `eyebrow` payload through the existing `loomCaptureDelete` native
bridge, and returns to `/sources` after a confirmed delete. It does not use
`window.confirm`. Red/green evidence: the snapshot renderer contract first
failed on missing `confirmingDelete`, `deleteError`, and bridge payload, then
passed 11/11 after implementation. Focused new-Loom/source/snapshot tests
passed 92/92; `npm run typecheck`, `npm run test:contracts` 458/458, and both
diff whitespace checks passed. `npm run app:user` rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
bundled static web files; `npm run app:where` reported
`2026-05-09T11:48:16.532Z`; `npm run app:check-extension` passed. The stale
pre-install process was killed, and Computer Use read the freshly launched
installed process `pid 82868`. Opening Flipdisc -> `Open source snapshot`
showed `Delete capture`; clicking it changed to `Delete capture now` plus
`Cancel`. `Cancel` was clicked, no destructive delete was executed, and Source
Index still showed 4 captures afterward.

At 21:58 AEST, the next Phase 6 Draft slice added reviewable diff feedback to
inline edit. Web Draft now computes `draftInlineEditDiffHunks(...)` and renders
`Diff preview` rows inside the `AI edit` panel; native Draft mirrors the same
line-level hunk logic with `LoomDraftInlineEdit.diffHunks(...)`. Accept still
checks the original selected passage before mutating the body. Red/green
evidence was captured in TS storage, skeleton contract, and Swift Draft store
tests; focused gates passed afterward: `tests/new-loom-draft-storage.test.ts`
22/22, `tests/new-loom-skeleton-contract.test.ts` 59/59, selected Swift diff
test 1/1, full `LoomDraftStoreTests` 23/23, `npm run test:contracts` 459/459,
`npm run typecheck`, and both diff whitespace checks. Installed-app acceptance
then passed the bounded gate: `npm run app:user`, `npm run app:smoke` with 630
bundled static web files, `npm run app:where` at `2026-05-09T12:00:42.116Z`,
`npm run app:check-extension`, installed web chunk string evidence for
`Diff preview`, Swift binary string evidence for `LoomDraftInlineEditDiffHunk`,
and Computer Use on relaunched installed pid `89060`. CUA verified Source Index
and native Draft with `AI edit` / `Edit selection`; no live AI-generated diff
was forced because that would call the configured AI provider.

At 22:15 AEST, the next Phase 6 Draft slice added the first ThinkingDraft block
structure model. Web Draft storage now exports typed blocks plus
`draftBlocksFromBody(...)` and `applyDraftBlockEdit(...)`; web `/draft` renders
the `Draft structure` panel. Native Draft mirrors the same model through
`LoomThinkingDraftBlock` / `LoomThinkingDraft` and shows a native `Draft
structure` panel before References. The model provides stable block ids, kind,
source offsets, word counts, matched reference hrefs, and guarded block edits.
It is the first reviewable block layer, not the finished multi-block composer.
Fresh verification passed: `tests/new-loom-draft-storage.test.ts` 24/24,
`tests/new-loom-skeleton-contract.test.ts` 60/60, selected Swift ThinkingDraft
tests 2/2, full `LoomDraftStoreTests` 25/25, `npm run test:contracts` 462/462,
`npm run typecheck`, and both diff whitespace checks. Installed-app acceptance
then passed: `npm run app:user`, `npm run app:smoke` with 630 bundled static web
files, `npm run app:where` at `2026-05-09T12:18:06.797Z`, and
`npm run app:check-extension`. The stale process was quit, the installed app was
relaunched as pid `95992`, and Computer Use opened Draft and read the native
right panel with `Draft structure`, a `PARAGRAPH` block, `6 words`, References,
and Draft board.

Next chat should continue from the post-consolidation audit rather than
re-opening the Atlas handoff, delete confirmation, local-file panel, or runtime
reader back-link boundary unless a regression appears.

At 22:25 AEST, the next Phase 7 slice added the first durable Pursuit container
data layer. Web `lib/new-loom/pursuit-container.ts` now builds a stable
`pursuits/<slug>/` artifact set with `Loom.md`, `Loom-cites.json`, and
`Loom-meta.json`, and native `LoomPursuitContainerBuilder` mirrors the same
contract from `LoomPursuit`. The weight mapping is now literal for Phase 7:
held pursuits become `wintering`, retired pursuits become `archived`, and
active/waiting/contradicted states become `active`. Verification passed:
`tests/new-loom-pursuit-container.test.ts` 2/2, focused pursuit + skeleton
contract run 62/62, selected Swift container test 1/1, and full
`PursuitSpawnerTests` 8/8. This is only the artifact builder; the actual saved
write path and visible shelf UI remain open.

At 22:30 AEST, Phase 7 gained the first explicit native persisted write path.
`LoomPursuitContainerWriter.persist(...)` writes a built container into a
user-data root, creates the `pursuits/<slug>/` directory, and writes
`Loom.md`, `Loom-cites.json`, and `Loom-meta.json` atomically as UTF-8 after
rejecting unsafe relative paths. Red/green evidence: the selected writer test
first failed on missing `LoomPursuitContainerWriter`, then passed 1/1 and read
the three files back from a temporary root. The visible shelf UI and automatic
sync from all existing pursuit mutations are still open.

At 22:32 AEST, native pursuit create and season changes gained best-effort
Phase 7 container sync. `LoomPursuitWriter.createPursuit` now persists the
initial `pursuits/<slug>/` artifact set after the SwiftData save, and
`updateSeason` rewrites `Loom-meta.json` so `held` maps to `wintering`. The
selected sync test first failed on the missing `containerRootURL` seam, then
passed 1/1 against a temporary root. Final verification for this slice passed:
full Swift `PursuitSpawnerTests` 10/10, focused TS pursuit + skeleton contracts
62/62, full `npm run test:contracts` 464/464, `npm run typecheck`, and diff
whitespace checks. Remaining Phase 7 gaps: `updateWeight`, `attachSource`,
`attachPanel`, delete cleanup, and the visible shelf UI.

At 22:38 AEST, the remaining native `LoomPursuitWriter` mutations gained Phase
7 container sync/cleanup. `updateWeight` rewrites the container, `attachSource`
adds an ID-based `source` cite, `attachPanel` adds an ID-based
`artifact-state` cite, and `delete` removes the matching `pursuits/<slug>/`
directory. The new selected test first failed on missing `containerRootURL`
arguments for those four methods, then passed 1/1. Remaining Phase 7 gaps:
visible shelf UI and richer cite enrichment from resolved source/panel context.

At 22:44 AEST, Phase 7 gained its first visible web Organize surface without
reviving `/pursuits` as a primary product route. `KnowledgeHomeClient` reads
`loom.pursuits.v1` through `loadPursuitRecords()`, subscribes to the native
`loom-pursuits-updated` mirror event, filters hidden records, maps seasons into
literal `active / wintering / archived` state, and passes entries into Source
Index. `KnowledgeHomeStatic` now renders those entries in a `Question
containers` current-work panel with links to `/pursuit/<id>`. Red/green
evidence: `tests/knowledge-home-source-library.test.tsx` first failed on the
missing pursuit import, panel, and rendered row, then passed 23/23. Remaining
Phase 7 gaps: richer cite enrichment and installed-app visual acceptance for
the new panel.

At 22:55 AEST, the `Question containers` panel was added to the native
installed Source Index as well. `LoomLibraryView` now loads visible pursuits
through `LoomPursuitWriter.allPursuits()` plus `PursuitHideStore.readAll()`,
maps season state into `active / wintering / archived`, subscribes to
`.loomPursuitChanged`, and opens rows through `/pursuit/<id>`. Red/green
evidence: the native Source Index contract first failed on the missing state,
loader, subscription, and panel, then `tests/knowledge-home-source-library.test.tsx`
passed 23/23. Wider verification passed: `npm run typecheck`, focused skeleton
+ Source Index contracts 83/83, `npm run test:contracts` 465/465, Debug
macOS build, `npm run app:user`, `npm run app:smoke`, and `npm run app:where`
at `2026-05-09T12:54:19.373Z`. The stale app pid `9884` was quit, the
installed app relaunched as pid `13703`, and Computer Use verified Source
Index shows the `QUESTION CONTAINERS` panel. Current user data has no visible
question containers, so the panel correctly reads `No question containers yet.`
Remaining Phase 7 gap: richer cite enrichment from resolved source/panel
context.

At 23:02 AEST, that cite-enrichment gap was narrowed. `LoomPursuitWriter` now
builds Phase 7 `Loom-cites.json` entries from available `LoomTrace` and
`LoomPanel` context: attached sources can carry readable source titles, capture
URLs, and summaries; attached panels can carry panel titles and source capture
URLs with `#panel-id` fragments. Missing context still falls back to stable
source ids and `loom://artifact-state/<id>` links. Red/green evidence: the
selected pursuit sync test first failed on the new Flipdisc title, excerpt,
capture URL, panel title, and fragment-link assertions, then passed 1/1. Wider
verification passed: full Swift `PursuitSpawnerTests` 11/11, focused
new-Loom/source contracts 85/85, `npm run typecheck`, `npm run test:contracts`
465/465, Debug macOS build, `npm run app:user`, `npm run app:smoke` with 630
bundled static web files, and `npm run app:where` at
`2026-05-09T13:04:19.199Z`. The stale installed process was quit, the app was
reopened as pid `18592`, and Computer Use verified Source Index still shows
Recent captures with `DRAFT/Delete` plus the visible `QUESTION CONTAINERS`
panel. Current user data has no visible question containers, so the panel reads
`No question containers yet.` Next Phase 7 risk is real user-data pursuit
acceptance when records exist and deciding how the durable `Loom.md` body syncs
with the future deep shelf/editor.

At 23:14 AEST, the durable Phase 7 body-sync risk was narrowed. Before this
slice, every `syncPhase7Container(...)` rewrite rebuilt `pursuits/<slug>/Loom.md`
from an empty body, so user/deep-shelf edits could be erased by ordinary
metadata changes such as `updateWeight`. `LoomPursuitWriter` now reads the
existing container markdown, strips the top-level title, and passes the
preserved body back into `LoomPursuitContainerBuilder.build(...)` before
rewriting meta/cites. Red/green evidence: the new
`testPursuitWriterPreservesEditedPhase7MarkdownBodyWhenSyncingMetadata` first
failed because the file collapsed to only `# 2026 Flipdisc Display`, then
passed 1/1 after the preservation path. Wider verification so far passed: full
Swift `PursuitSpawnerTests` 12/12, focused new-Loom/source contracts 85/85,
`npm run typecheck`, and `npm run test:contracts` 465/465. Remaining Phase 7
work is now visible product acceptance for real user-data question-container
rows and the intentional editor/deep-shelf UI, not accidental body clobbering
from metadata sync.

At 23:32 AEST, the Source Index empty-state path for question containers was
accepted in the installed app. The `QUESTION CONTAINERS` panel has an
`Add Question` action; after relaunching the latest installed bundle as pid
`28088`, Computer Use clicked it and verified the native `Add Question` sheet
opens with the question field, Weight picker, Cancel, and disabled Save. Cancel
returned to Source Index and left `No question containers yet.`, so no user
data was created. Important nuance: the stale pid `25128` had been started
before the latest install, so the first no-sheet click was a stale-process
check, not the current installed result.

At 23:44 AEST, the detail/deep-shelf body editor bridge was added and verified
without mutating user data. Native pursuit payloads now expose `containerBody`
and `containerPath`; direct question detail renders `Question notes` plus
`Save question notes`; and `updatePursuitBody` rewrites
`pursuits/<slug>/Loom.md` through `LoomPursuitWriter.updateBody(...)`.
Red/green evidence: the pursuit detail contract first failed on missing
`containerBody`, and the selected Swift body-update test first failed on
missing `updateBody` / `phase7Body`. After implementation, the focused detail
contract passed 4/4, full Swift `PursuitSpawnerTests` passed 13/13, focused
new-Loom/source/pursuit contracts passed 89/89, `npm run typecheck` passed,
`npm run test:contracts` passed 466/466, and diff whitespace checks passed.
The current checkout was then installed: `npm run app:user` built and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 630
static web files; `npm run app:where` reported
`2026-05-09T13:43:10.013Z`; and `npm run app:check-extension` passed for
Atlas extension `1.4.9`. The installed app was relaunched as pid `33233`.
Computer Use read Source Index with 4 captures, visible `DRAFT` / `Delete`
controls, `QUESTION CONTAINERS`, and `Add Question`; clicking `Add Question`
opened the sheet, and Cancel returned to `No question containers yet.`

At 23:52 AEST, Phase 9 Discipline became an in-app support page. `/discipline`
is now part of `NEW_LOOM_SUPPORT_ROUTES`, with literal copy for the six product
refusals and links back to `/system` and `/sources`; `/system` and `/help`
both link to it. Red/green evidence: the new skeleton contract first failed on
the missing support-route classification, then passed 61/61 after the route,
page, and links were added. Final verification for this slice: full
`tests/new-loom-skeleton-contract.test.ts` passed 61/61, `npm run typecheck`
exited 0, `npm run test:contracts` passed 467/467, and both diff whitespace
checks passed.

At 00:15 AEST on 2026-05-10, the Flipdisc web-capture status was rechecked and
one strict export-quality gap was closed. The installed app's Source Index now
shows the Flipdisc row with readable `Origin: Web`, `DRAFT`, and `Delete`
controls; Computer Use opened it and verified the reader has source
`flipdisc.io`, `Open original`, `Re-capture`, `SOURCE SNAPSHOT`, provider video
entries, visual modules, `CAPTURED STRUCTURE`, and the expected frame tokens.
The existing installed saved capture passes normal
`scripts/verify-capture-handoff.mjs` with `segmentDiagramCount: 1` and no
unresolved media references, but still warns under `--strict-no-flat-frame`
because that older `Loom.md` contains the flat frame token line. New captures no
longer do this: the extension now writes a segment-diagram artifact marker into
Markdown, the reader replaces that marker with the CaptureAST diagram, and the
live Flipdisc handoff verifier now runs strict. Red/green evidence: the
handoff-verifier and capture-media contracts first failed on the missing strict
path/marker handling, then passed 53/53. The source-extension live canary
returned `ok: true`, `bodyHasFlatFrameLine: false`, `segmentDiagramCount: 1`,
and no handoff warnings.

At 00:25 AEST on 2026-05-10, Phase 9 `The Year` gained the first support
surface. `/year` is now in `NEW_LOOM_SUPPORT_ROUTES`, not primary or legacy,
and renders a literal twelve-month strip plus a `wintering ribbon` for resting
captures, local files, and Question containers. `/system` and `/help` link to
it, and `docs/loom.md` marks this as the first support-surface slice, not the
full future calendar/state-machine implementation. Red/green evidence:
`tests/new-loom-skeleton-contract.test.ts` first failed on the missing support
route, then passed 62/62. Wider verification passed: `npm run typecheck`,
`npm run test:contracts` 469/469, both diff whitespace checks, dev-server
`curl` 200 for `/year`, Playwright text verification with 12 months and
wintering ribbon, and `npm run build` with `/year` statically generated among
101 pages. Installed-app evidence also passed: `npm run app:user`,
`npm run app:smoke` with 629 static web files, `npm run app:where` at
`2026-05-09T14:28:23.150Z`, `npm run app:check-extension`, installed bundle
  string evidence for `Contents/Resources/web/year.html`, and Computer Use on
  relaunched pid `53282` opening Source Index.

At 00:39 AEST on 2026-05-10, the live Flipdisc Pixel Font Comparison capture
gap was tightened. The previous reader artifact contract was not enough for the
real page because `https://flipdisc.io/` renders the five pixel-font rows as
five synchronized text inputs, so live extraction still reported
`inputMirrorCount: 0`. The verifier now fails that condition, and the extension
groups repeated same-value text controls into one `input-mirror` artifact with
styled output rows. Red/green evidence: `npm run verify:flipdisc-live-handoff`
first failed with `expected at least 1 input-mirror artifact, got 0`; after the
extension fix, `node scripts/verify-flipdisc-live-extension.mjs
--source-extension --verify-handoff-fixture` passed, `npm run
app:stage-extension` staged version `1.4.9`, `npm run app:check-extension`
passed, and the default staged `npm run verify:flipdisc-live-handoff` passed
with `interactiveArtifactCount: 3`, `inputMirrorCount: 1`,
`comparisonSliderCount: 1`, and `segmentDiagramCount: 1`. Focused contracts
also passed: capture media 48/48 and capture interactive artifacts 5/5.
Installed acceptance followed: `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke`, `npm run
app:where`, and `npm run app:check-extension` passed, and both staged/installed
extension files contain `inputMirrorControlOutputs`.

At 00:55 AEST on 2026-05-10, Phase 9 Wintering gained its first
non-destructive state-machine slice. `lib/new-loom/wintering-state.ts` defines
`active / wintering / archived` for captures, local files, and Question
containers: explicit states win, otherwise captures/local files become
`wintering` after 45 quiet days and `archived` after 365 quiet days. Web and
native Source Index row metadata now surfaces non-active inferred states, and
`/year` imports the same threshold constants. Red/green evidence: the new
wintering test first failed on the missing module, the Source Index contract
failed on missing `wintering` / `archived` row text, and the Year contract
failed on missing shared thresholds; after implementation, focused
new-Loom/source contracts passed 90/90 and Debug macOS build passed. Release
install evidence also passed: `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` found 629 static
web files, `npm run app:where` reported `2026-05-09T14:55:21.662Z`, and
`npm run app:check-extension` passed for Atlas extension version `1.4.9`.
Computer Use then relaunched the installed app as pid `64911` and read the
Source Index with 4 captures, 0 local files, empty question containers, and
visible capture `DRAFT` / `DELETE` controls. The real records are not old
enough to visibly show `wintering` / `archived`, so suffix behavior is covered
by the render/native contracts. This slice does not move, hide, or delete user
files.

At 01:06 AEST on 2026-05-10, Phase 10 Working mode gained its first public
privacy slice for the web Source Index. `lib/new-loom/public-working-mode.ts`
resolves public mode from `/sources?public=1`, `/sources?loom-public=1`,
`/sources?working=public`, or `localStorage["loom.publicWorkingMode"] = "1"`.
When active, `KnowledgeHomeStatic` masks source group names, source rows,
capture titles/domains, local file names/paths, reader-note excerpts, draft
titles, and question titles while preserving counts/status/origin class. It
also disables row Draft/Delete/group mutation actions. Red/green evidence:
the Source Index public-mode test first failed on visible private strings and
actions, and the resolver test first failed on the missing module; after
implementation, the focused public/source contract passed 28/28. This is web
Source Index presentation masking only, not native Source Index masking or
export redaction.

At 01:11 AEST on 2026-05-10, the public-working slice completed verification:
`npm run typecheck`, `npm run test:contracts` (476/476), and `git diff --check
&& git diff --cached --check` all passed. Release install evidence also passed:
`npm run app:user` rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` found bundle id
`com.yinyiping.loom` with 629 static web files; `npm run app:where` reported
`2026-05-09T15:10:39.712Z`; and `npm run app:check-extension` passed with
Atlas extension version `1.4.9`. Computer Use read the installed Source Index:
it still shows the real native normal-mode data, including `flipdisc.io` and
visible capture `DRAFT` / `DELETE` controls. Do not claim native Source Index
public masking from this slice.

At 01:27 AEST on 2026-05-10, native Source Index public masking was added and
verified. `NewLoomPublicWorkingMode.swift` resolves
`loom.publicWorkingMode` from `UserDefaults` or `LOOM_PUBLIC_WORKING_MODE`;
`LoomLibraryView` masks native Source Index labels/details and removes
row-level Draft/Delete/Add Question actions in public mode; and
`LoomMinimalRootView` masks sidebar folder names, hides Tools/Page/Folder, and
removes rename/remove context actions while the flag is enabled. Red/green
evidence: the native public-working test first failed on the missing helper;
after implementation, focused public/source/native skeleton coverage passed
91/91 and the public/source focused set passed 29/29. Full verification passed:
`npm run typecheck`, `npm run test:contracts` 477/477, `npm run app:smoke`,
`npm run app:where` at `2026-05-09T15:23:38.170Z`, and
`npm run app:check-extension` with Atlas extension `1.4.9`. Computer Use then
temporarily enabled the preference, relaunched the installed app as pid
`76049`, and saw `PUBLIC WORKING MODE`, `Source group 1/2`, generic
`Web capture` / `Recent source` / `Source` rows, no Tools/Page/Folder, and no
content-row `DRAFT` / `DELETE` buttons. The preference was deleted and the app
was relaunched as pid `76210`; Computer Use verified normal/private mode again
shows `flipdisc.io`, real course folders, Tools/Page/Folder, and visible
per-row `DRAFT` / `DELETE`.

At 01:41 AEST on 2026-05-10, Phase 10 `The Hour, ticking` shipped as the first
literal current-window support surface at `/hour`. It is support-only, not a
primary route, timer, streak, alert, notification loop, or work queue. The page
shows current hour, ticking seconds, minute progress, a literal breath bar, and
links to Source Index, Draft, The Year, and Discipline. Red/green evidence:
the skeleton contract first failed on the missing support route, then
Playwright found a real hydration mismatch from SSR time; the contract was
tightened to require null-first client time before live ticking. Verification
passed: focused `/hour` contract 63/63, `npm run typecheck`, `npm run
test:contracts` 478/478, `npm run build` with 102 static pages and `/hour`,
browser acceptance on `http://127.0.0.1:3100/hour`, `npm run app:user`, `npm
run app:smoke` with 633 static web files, `npm run app:where`, and `npm run
app:check-extension`. The installed bundle contains `web/hour.html` and the
`/hour` client chunk.

Computer Use also rechecked the installed normal-mode Source Index and opened
the current `flipdisc.io` capture reader. The capture is acceptable: title,
2,245 word count, links, contents, images/canvas captures, code structure,
source snapshot entries, video placeholders, and article end sections are
present, and a current source-page check against `https://flipdisc.io/`
matched the major structure. No new extraction repair is required from this
check. Native boundary: external `loom://bundle/hour` and
`loom://bundle/hour.html` did not navigate the current minimal native window;
generic external bundle-route deep linking is still ignored by
`LoomApp.handleGetURLEvent`, so do not claim native deep-link acceptance for
`/hour` yet.

At 02:57 AEST on 2026-05-10, the generic native bundle-route deep-link gap was
tightened. `LoomApp.handleBundleURL` now saves the normalized route into
`LoomBundleRouteRelay` before presenting the main window and posting
`.loomShuttleNavigate`; `LoomMinimalRootView` consumes the pending route on
appear / app activation and clears it when the matching live notification is
handled. Red/green evidence: the focused native shell contract first failed on
the missing relay save/consume calls, and the new Swift relay test first failed
to compile because `LoomBundleRouteRelay` did not exist; after implementation,
the focused skeleton contract passed 64/64 and `LoomBundleRouteRelayTests`
passed 2/2. Wider gates passed: `npm run typecheck`, `npm run test:contracts`
479/479, whitespace checks, and `node scripts/check-loom-macos-project-files.mjs`
with 37 referenced Swift tests. Release install also passed: `npm run app:user`,
`npm run app:smoke` with 635 static web files, `npm run app:where` at
`2026-05-09T16:56:53.848Z`, and `npm run app:check-extension`. The installed
bundle contains `web/hour.html` and the new `loom.pendingBundleRoutePath`
binary key. Computer Use visible acceptance is still blocked by the locked
macOS session (`CGSessionScreenIsLocked=1`, frontmost
`com.apple.loginwindow` pid `398`), so rerun live URL-scheme navigation after
unlock before claiming GUI acceptance.

At 03:08 AEST on 2026-05-10, Draft ThinkingDraft gained its first multi-block
operation slice. Web Draft and native Draft can select contiguous draft blocks,
review their original text, and replace the selected range only when all
original blocks still match. Empty replacements, stale originals, missing
blocks, and non-contiguous selections do not mutate the draft. Red/green
evidence: focused Draft storage first failed on missing
`applyDraftBlockOperation`, the skeleton contract first failed on missing
block-operation contract surfaces, and Swift first failed on missing
`LoomThinkingDraft.applyBlockOperation`; after implementation, focused Draft
storage passed 25/25, the focused skeleton block-operation contract passed
65/65, full `LoomDraftStoreTests` passed 26/26, `npm run typecheck` passed,
`npm run test:contracts` passed 481/481, whitespace checks passed, and `npm
run app:user` reinstalled `/Users/yinyiping/Applications/Loom.app`. Installed
evidence passed: `npm run app:smoke` with 635 static web files, `npm run
app:where`, `npm run app:check-extension`, and installed bundle string checks
for `Block operation`, `Block replacement`, and `Apply block edit`. Computer
Use visible acceptance remains blocked by the locked macOS session:
`get_app_state("Loom")` returns `cgWindowNotFound` while
`CGSessionScreenIsLocked=1`, even though the installed Loom process is running.

At 03:35 AEST on 2026-05-10, Phase 10 gained the first `/connections` support
surface for `Connections / Correspondents`. `lib/new-loom/source-connections.ts`
derives source nodes from trace events with `source.href`, parses markdown links
inside reader notes / thought anchors / messages, resolves only links to already
collected sources, dedupes source-to-source links with evidence counts, and
groups correspondents by URL host or local-source bucket. The page is
support-only, with summary metrics, correspondents, source connections, and
links back to Source Index and Draft. Red/green evidence: the new source test
first failed on the missing module; the skeleton test first failed because
`/connections` was not a support route; the native shell contract first failed
because `/connections` was missing from the installed support-route whitelist.
Current verification passed: focused source-connections tests 2/2,
`npm run typecheck`, `npm run test:contracts` 484/484, `git diff --check`,
`git diff --cached --check`, direct static Next build emitted `○ /connections`,
`npm run app:user`, `npm run app:smoke` with 638 static web files, `npm run
app:where`, and `npm run app:check-extension` with Atlas extension version
`1.4.9`.

Computer Use acceptance passed after terminating the stale pre-install Loom
process and relaunching `/Users/yinyiping/Applications/Loom.app` as pid
`31013`. Source Index showed the current normal-mode data and visible `DRAFT`
plus `Delete` controls on capture rows. Opening `loom://bundle/connections`
showed the installed page at `loom://bundle/connections.html` with
`Connections / Correspondents`, `3 Sources`, `1 Correspondents`,
`0 Connections`, and `0 cross-origin`. Opening the current `flipdisc.io` reader
showed source `flipdisc.io`, title, timestamp, `Open original`, `Re-capture`,
`Source snapshot`, 2,245 words / 10m read, links, contents, images, canvas
captures, code sections, media placeholders, and end-of-article sections. The
capture is acceptable for reading/writing; remaining improvement should target
richer media and interactive replay fidelity, not basic article extraction.

At 03:58 AEST on 2026-05-10, Phase 10 `Atelier 多 source 平铺` gained its first
Draft-owned web/native slice. Web Draft and native Draft now derive up to four
`Source tiles` from attached references, show source/capture/artifact-state/url
metadata, and expose `Open` plus `Insert quote` where excerpts exist. Red/green
evidence: focused Draft storage first failed on missing
`draftSourceTilesFromReferences`, the skeleton contract first failed on the
missing web tile surface, and the native skeleton contract first failed on
missing `LoomDraftSourceTile` / panel coverage. After implementation, focused
Draft storage passed 26/26, focused Atelier skeleton coverage passed 67/67,
the focused Swift test
`testDraftSourceTilesPrepareFourSourceNativeSurface` passed 1/1, `npm run
typecheck` passed, `npm run test:contracts` passed 486/486, whitespace checks
passed, `npm run app:user` reinstalled `/Users/yinyiping/Applications/Loom.app`,
`npm run app:smoke` passed with 638 static web files, `npm run app:where`
reported `2026-05-09T17:51:19.242Z`, and `npm run app:check-extension` passed.

Installed acceptance found and fixed a real native gap: the installed sidebar
`Draft` is `LoomDraftView()`, so the first web-only source-tile implementation
was not visible there. After the native fix, strict Computer Use AX-tree
inspection is blocked by macOS `cgWindowNotFound` while the Loom process and
logs show a visible main window and AppKit reports an accessibility shield
(`elementWindow(0) is lower than shield(2001)`). A temporary single-window
visual inspection confirmed installed native Draft now shows `Source tiles
3/4` with the Flipdisc capture, `ECON 3202`, and `15 · Multimodal`, each with
`Open` actions. Treat that as fallback visual evidence only; rerun strict
Computer Use tree inspection when the shield clears.

At 04:15 AEST on 2026-05-10, Phase 8 `InteractiveArtifact` capture gained the
first `animated-canvas` and `source-island` containers. The extension detects
visible non-slider canvas regions as `animated-canvas` artifacts with a
captured current-frame asset, and embedded/source-island regions as
`source-island` artifacts with href, label, and short description metadata.
Native CaptureAST sidecars preserve `href`, `description`,
`animatedCanvasCount`, and `sourceIslandCount`. The reader renders
`animated-canvas` as a stable captured-frame card and `source-island` as a
source card with an `Open source island` link. Red/green evidence: the contract
first failed on missing extension builders / reader renderers; the Playwright
reader test first failed against stale static export, then passed after
`node scripts/build-static-export.mjs` regenerated `/loom-render/capture`.
Focused verification passed: capture-media contract 48/48, interactive-artifact
Playwright tests 7/7, and static export regenerated 103 pages.

Later on 2026-05-10, `animated-canvas` became replay-aware: successful canvas
recordings are attached to the artifact as `role: replay` video assets, the
poster frame remains available as an image asset, Swift media substitution
rewrites those AST asset URLs to stable content files, and the reader renders
the replay video before falling back to the static frame. This is still not a
full DOM animation engine or LMS import API.

At 06:44 AEST on 2026-05-10, the capture reader Distill surface stopped
shipping placeholder fallback copy. `loom://native/distill.json` remains the
only Distill data path; empty native summaries now report that Distill returned
no summary, and absent older native runtimes report that Distill is unavailable
instead of fabricating provider-wiring placeholder text. Red/green evidence:
the new capture-reader Distill contract first failed on the existing
`placeholder · wire` / stub-copy fallback, then passed after implementation.
Focused capture-render contracts passed 13/13; wider verification passed
`npm run typecheck` and `npm run test:contracts` 492/492.

At the 2026-05-10 real-file importer refresh, `npm run
verify:real-files-importer` passed against
`/Users/yinyiping/Desktop/Knowledge System/UNSW`. The manifest found 391 PDFs,
2827 images, 14 attributed documents, 1 deck package, and 0 iWork packages.
Sampled real-file evidence: three PDFs each produced 4000 chars plus page
ranges, real images reported OCR 29 and visualDescriptions 12, `business-model-
canvas (1).docx` produced 3904 chars, and `FINS3616 Week 2_Updated.pptx`
produced 43757 chars across 43 slides. Treat the native importer baseline as
real-file verified for PDF/image/DOCX/PPTX; iWork still has fixture/unit
coverage only because this corpus has no real `.key` or `.pages` packages.

At the 2026-05-10 Moodle/source-tile refresh, Draft source tiles stopped
labeling imported Moodle/local files as generic `Source`. Web Draft and native
Draft now classify attached local references by extension: slide decks show
`Slide deck`, PDFs show `PDF`, Markdown shows `Markdown`, images show `Image`,
documents show `Document`, and text files show `Text`. The new web test first
failed with four `Source` labels for a Moodle slide deck, problem-set PDF,
notes markdown, and image; after implementation the focused web Draft storage
set passed 27/27 and full native `LoomDraftStoreTests` passed 28/28. Wider
verification also passed: `npm run typecheck`, `npm run test:contracts`
487/487, and whitespace checks.

At the 2026-05-10 Moodle/course-bundle Source Index refresh, web `/sources` and
native `LoomLibraryView` both started surfacing existing collection metadata
from `knowledge/.cache/manifest/collection-metadata.json`: course name, term,
course code, and up to three folder-topic labels on source rows. Native matches
`ContentRoot` display names / active folder paths to collection slugs such as
`unsw-infs-3822`. This remains ordinary source metadata, not a new course/dossier
entity, and public working mode masks private course names, terms, paths, and
folder topics. Red/green evidence: the Source Index Moodle metadata test first
failed on missing native metadata structs/loaders and then passed 27/27. Wider
verification passed: `npm run typecheck`, `npm run test:contracts` 488/488,
`git diff --check`, `git diff --cached --check`, and
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug build`. Release install also passed:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, `npm run app:where` reporting
`/Users/yinyiping/Applications/Loom.app 2026-05-09T18:40:27.894Z`,
`npm run app:check-extension` with Atlas extension version `1.4.9`, and fresh
`npm run verify:real-files-importer` against
`/Users/yinyiping/Desktop/Knowledge System/UNSW`. A normal xcodebuild without
the skip flag was interrupted while its bundle stage spent over a minute
scanning `.next-export-current`; treat that as generated artifact staging
cleanup, not a Swift compile failure. After `app:user`, runtime derived data
contains the repo corpus search index but no `collection-metadata.json`, so
the new row metadata path is empty until a real knowledge ingest writes
collection metadata. Computer Use still cannot inspect the installed Loom
window: after restarting the post-install process, `get_app_state` for both
`com.yinyiping.loom` and `Loom` returned `cgWindowNotFound`.

At the 2026-05-10 Moodle metadata quality refresh, the real UNSW ingest path
was run instead of relying only on fixture contracts. `npm run ingest` wrote
runtime `collection-metadata.json` for 14 source collections, with 648 docs
across 14 categories and 53 folder topics. The first real metadata pass exposed
topic noise from source PDF front matter (`Lecturer`, emails, page headers,
exam candidate blanks, formula fragments, and OCR-split `Week N S eminar`
prefixes). `extractFolderTopic` now filters those generic lines and strips the
week/seminar prefix before writing folder-topic labels. Red/green evidence:
the focused ingest test first failed because `extractFolderTopic` was not
exported, then failed because an email plus `1: Canvas...` was accepted as a
topic; after cleanup, the focused ingest test passed, full
`tests/knowledge-ingest.test.ts` passed 6/6, `npm run ingest` regenerated the
real UNSW metadata with zero matches for the explicit noise patterns, `npm run
typecheck` passed, `npm run test:contracts` passed 489/489, and whitespace
checks passed. Strict Computer Use still returns `cgWindowNotFound`, so this
slice is verified by runtime metadata plus test gates, not AX-tree inspection.

At the 2026-05-10 image importer readable summary refresh, image imports gained
a deterministic `Image summary:` line before raw OCR and Vision-label details.
`LocalImageImportText` now combines the top visual signals with the first OCR
snippets, and `scripts/verify-real-file-importer.swift` prints the same
`summary=...` evidence for real user images. Verification passed:
`npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern
"native image import adds semantic Vision labels"` 67/67,
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug
-only-testing:LoomTests/TypedExtractorMatchTests/testLocalImageImportTextAddsReadableImageSummary
test` 1/1, and `npm run verify:real-files-importer` against the UNSW corpus
with 391 PDFs, 2827 images, 14 attributed documents, 1 deck, and 0 iWork
packages. The verifier output now includes image summaries such as
`visual signals: document, chart, diagram; recognized text: ...`. Remaining
wide gates also passed: full `TypedExtractorMatchTests` 7/7, `npm run
typecheck`, `npm run test:contracts` 489/489, and whitespace checks. Installed
app evidence also passed: `npm run app:user`, `npm run app:where` reporting
`/Users/yinyiping/Applications/Loom.app 2026-05-09T19:03:24.562Z`, and
`npm run app:smoke` with bundle id `com.yinyiping.loom` and 638 static web
files. Strict Computer Use remains blocked after launch: `get_app_state` for
both `com.yinyiping.loom` and `Loom` returns `cgWindowNotFound`. Remaining
image work is domain-specific understanding beyond deterministic OCR plus
Vision labels and this readable summary.

At the 2026-05-10 Draft AI artifact-state prompt refresh, attached
artifact-state references started carrying raw state data into the AI prompt,
not only readable summaries. Web Draft now uses
`draftReferencePromptLines(...)` for attached-reference prompt lines, adding
`artifactState=` and `artifactStateData=` for both compose and inline-edit
prompt paths. Native Draft mirrors the same shape in compose and `Cmd-K`
inline edit via `LoomDraftQuoteFormatter.artifactStatePromptData(...)`.
Red/green evidence: the web test first failed because
`draftReferencePromptLines` was undefined, and the native compose test first
failed because `artifactStateData=...` was absent. After implementation,
focused Draft storage passed 28/28, focused skeleton contract passed 67/67,
selected native compose plus inline-edit prompt tests passed 2/2, full
`LoomDraftStoreTests` passed 30/30, `npm run typecheck` passed, `npm run
test:contracts` passed 490/490, and whitespace checks passed. Installed-app
evidence also passed: `npm run app:user`, `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 650 static web files, and `npm run app:where`
reporting `/Users/yinyiping/Applications/Loom.app
2026-05-09T19:19:08.736Z`. Strict Computer Use remains blocked at the
AX/window layer: `list_apps` sees `Loom — com.yinyiping.loom` running, but
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
`cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`. This closes
the attached-reference prompt-data slice, not corpus-wide artifact-state
retrieval or replay.

At the 2026-05-10 inline Draft artifact-state prompt refresh, inline
`@...#artifact-state` prompt lines started resolving attached artifact-state
references by target id. Web `draftInlineReferencePromptLines(...)` now checks
the inline artifact anchor against attached `artifactState.targetId` before
falling back to normal source/corpus matching; native
`LoomDraftInlineReferenceParser.promptLines(...)` mirrors this via
`findArtifactStateMatch(...)`. Prompt lines now include both
`artifactState=` and raw `artifactStateData=` for inline mentions like
`@flipdisc-tutorial#frame-format:0.4`. Red/green evidence: the web test first
failed with `source=unattached`; after implementation, focused Draft storage
passed 28/28, focused skeleton contract passed 67/67, the selected native
inline artifact-state test passed 1/1, full `LoomDraftStoreTests` passed
31/31, `npm run typecheck` passed, `npm run test:contracts` passed 490/490,
and whitespace checks passed. Installed evidence also passed: `npm run
app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom` and 655
static web files, `npm run app:where` reporting
`/Users/yinyiping/Applications/Loom.app 2026-05-09T19:31:44.129Z`, and
installed binary strings include `Inline @references:` plus
`artifactStateData=`. Computer Use remains blocked by the OS window layer:
`list_apps` sees `Loom — com.yinyiping.loom` and `pgrep` confirms the installed
binary path, but `get_app_state("com.yinyiping.loom")` returns
`cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`.

At the 2026-05-10 corpus-wide Draft artifact-state prompt refresh, selected
corpus hits started carrying artifact-state prompt data. Web corpus docs now
accept and score `artifactState`, `draftCorpusPromptLines(...)` emits readable
`artifactState=` and raw `artifactStateData=`, corpus-resolved inline
`@...#artifact-state` prompt lines inherit matching corpus-hit state data, and
`DraftClient` hydrates nested or flat artifact-state fields from the search
index. Native `EmbeddingRecord` sidecars now store optional
`[LoomDraftArtifactState]`, capture saves map `CaptureAST.interactiveArtifacts`
into those sidecar states, and `LoomDraftCorpusContext` passes the first state
into native Draft AI corpus prompt lines. Red/green evidence: web focused tests
first failed because corpus prompt lines omitted artifact-state fields; after
implementation focused Draft storage passed 28/28, focused skeleton contract
passed 67/67, the selected native corpus artifact-state test passed 1/1, full
`LoomDraftStoreTests` passed 32/32, `npm run typecheck` passed, and
`npm run test:contracts` passed 490/490. Installed evidence also passed:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 655 static web files, `npm run app:where` reporting
`/Users/yinyiping/Applications/Loom.app 2026-05-09T19:48:30.845Z`, and
installed binary strings include `Inline @references:`, `Corpus context:`,
and `artifactStateData=`. Computer Use remains blocked by the OS window layer:
`list_apps` sees `Loom — com.yinyiping.loom`, but
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
`cgWindowNotFound`; `ioreg` reports `CGSessionScreenIsLocked=Yes`. The running
Loom process still predates the install, so reopen Loom after unlocking before
live UI inspection.

At the 2026-05-10 Compile foundation pass, the Tier 2 Compile plan moved from
"not started" to a pure TypeScript contract slice. `lib/new-loom/compile-pipeline.ts`
now builds a bounded source-aware Compile prompt from scratch, active source
excerpt, prior notes, Ask history, attached references, and selected corpus
hits; the prompt explicitly mirrors the user's scratch language, including the
Chinese-scratch/English-source case. The same module parses compiled markdown
for `---` frames, `[term: explanation]` reveal markers, and LaTeX math tokens,
and it can insert or replace the latest `### Compiled · YYYY-MM-DD HH:MM`
section while preserving raw scratch and later notes. Red/green evidence:
`tests/new-loom-compile-pipeline.test.ts` first failed because the Compile
exports were absent; after implementation, the focused Compile test passed 3/3,
`npm run typecheck` passed, `npm run test:contracts` passed 495/495, and
targeted whitespace checks passed. Computer Use still cannot inspect the Loom
window: `list_apps` sees `Loom — com.yinyiping.loom`, but
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
`cgWindowNotFound`. This is not the Compile MVP yet: UI/native button wiring,
streaming through the configured AI provider, render polish, error UX, and
manual quality cases remain.

At the 2026-05-10 SourceFileView Compile wiring pass, the first Page-level native
Compile UI is now connected. `SourceFileView` shows a bottom-right `Compile`
panel when page scratch is substantive, streams through
`LoomAI.sendStream(prompt: LoomCompilePipeline.buildPrompt(...))`, previews
chunks while streaming, and writes the result back into the active page's
`Loom.md` as a per-source `### Compiled · YYYY-MM-DD HH:MM` subsection. The
writeback deliberately preserves unrelated source sections verbatim instead of
running a whole-document restructure pass. Red/green evidence: the static
contract first failed on the missing native Compile wiring, and the Swift tests
first failed because `LoomCompilePipeline` / `upsertCompiledSection` did not
exist; after implementation, the focused static contract passed 68/68, the
focused Swift Compile tests passed 2/2, `tests/new-loom-compile-pipeline.test.ts`
passed 3/3, `npm run typecheck` exited 0, `npm run test:contracts` passed
496/496, and `LOOM_SKIP_WEB_STAGE=1 xcodebuild -project
macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination
'platform=macOS' build` succeeded. Computer Use still cannot inspect the Loom
window in this pass: `list_apps` sees `Loom — com.yinyiping.loom`, but
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
`Apple event error -10005: cgWindowNotFound`. This was still not the full
Compile MVP: first-compile pulse, interruption/partial-save UX, user-edited
compiled section warning, richer rendered preview, and manual quality cases
remained at that point.

At the 2026-05-10 Compile partial-save pass, the first Compile error-UX gap from
`plans/compile-pipeline-mvp.md §5.5` was narrowed. `SourceFileView.startCompile`
now keeps a local stream accumulator; if `LoomAI.sendStream` throws after chunks
have arrived, it writes those chunks back to the active page as
`### Compiled · YYYY-MM-DD HH:MM (partial)` and shows
`Compile interrupted; partial output saved. Click Compile to retry.` The empty
failure path still keeps scratch unchanged and hides the preview. Red/green
evidence: the focused skeleton contract first failed on missing
`compileStreamDraft`, `partial: true`, and the partial-save toast, then passed
68/68 after implementation. Focused Swift Compile tests passed 2/2,
`tests/new-loom-compile-pipeline.test.ts` passed 3/3, `npm run typecheck`
exited 0, `npm run test:contracts` passed 496/496, and
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug -destination 'platform=macOS' build`
succeeded. This still leaves the rest of Compile MVP open: first-compile pulse,
rate-limit/provider-specific copy, user-edited compiled-section warning, richer
rendered preview, provider request-body privacy inspection, and manual quality
cases.

At the 2026-05-10 Compile recompile-warning pass, the user-edited compiled
section warning from `plans/compile-pipeline-mvp.md §5.4` was narrowed.
`SourceFileView.startCompile` now checks only the active source section for an
existing `### Compiled · ...` subsection. The first subsequent Compile shows
`Edits to the compiled section will be replaced. Compile anyway?` and stores a
pending confirmation; the next Compile proceeds and clears the pending state.
`SourceFileView.hasCompiledSection(file:in:)` is tested to avoid leaking a
different source's compiled section into the active source. Red/green evidence:
the focused skeleton contract first failed on the missing
`compileReplaceWarningPending` state and recompile-warning toast, and the Swift
focused test first failed because `SourceFileView.hasCompiledSection` did not
exist. After implementation, the focused static contract passed 68/68, focused
Swift Compile tests passed 3/3, `tests/new-loom-compile-pipeline.test.ts`
passed 3/3, `npm run typecheck` exited 0, `npm run test:contracts` passed
496/496, targeted `git diff --check` passed, and
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug -destination 'platform=macOS' build`
succeeded. Computer Use acceptance was retried after build, but
`get_app_state("com.yinyiping.loom")` still returned
`Apple event error -10005: cgWindowNotFound`. This still leaves Compile MVP open:
first-compile pulse, rate-limit/provider-specific copy, richer rendered preview,
provider request-body privacy inspection, manual quality cases, and strict
installed-app click acceptance once the window layer is readable.

At the 2026-05-10 Compile provider-error banner pass, the rate-limit/API-quota
row from `plans/compile-pipeline-mvp.md §5.5` was narrowed.
`SourceFileView.compileErrorMessage(_:)` now normalizes 429, 529, quota,
overloaded, and rate-limit provider failures to
`AI provider rate-limited. Try a different provider in Settings, or wait.`
while preserving setup errors such as missing API keys. `SourceFileView` also
shows that message in a standalone `compileErrorBanner` near the Compile button,
instead of burying the raw failure inside the streaming preview. Red/green
evidence: the focused skeleton contract first failed on the missing
`compileErrorBanner` / normalized copy assertions, and the Swift focused test
first failed because `SourceFileView.compileErrorMessage` did not exist. After
implementation, the focused static contract passed 68/68, the focused provider
error Swift test passed 1/1, `tests/new-loom-compile-pipeline.test.ts` passed
3/3, `npm run typecheck` exited 0, `npm run test:contracts` passed 496/496,
the focused Swift Compile tests passed 4/4, and `LOOM_SKIP_WEB_STAGE=1
xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration
Debug -destination 'platform=macOS' build` succeeded. This still leaves Compile
MVP open: first-compile pulse, richer rendered preview, provider request-body
privacy inspection, manual quality cases, remaining edge/error UX, and strict
installed-app click acceptance once Computer Use can read the Loom window.

At the 2026-05-10 Compile first-pulse pass, the onboarding pulse from
`docs/canon/LOOM.md §13.5` / `plans/compile-pipeline-mvp.md §5.3` was narrowed.
`SourceFileView.shouldShowFirstCompilePulse(...)` now shows the pulse only when
the active source scratch has at least 50 whitespace-delimited words, the active
source section has no `### Compiled · ...` subsection, Compile is not already
running, and the pulse has not been dismissed by a Compile attempt in the
current view. The visible UI is a single quiet bronze dot next to the Compile
button using `LoomTokens.dsThread` and a subtle repeating opacity/shadow pulse;
no extra label or tutorial copy was added. Red/green evidence: the focused
skeleton contract first failed on the missing pulse state/view/helper, and the
Swift focused test first failed because `SourceFileView.shouldShowFirstCompilePulse`
did not exist. After implementation, the focused static contract passed 68/68,
the focused pulse Swift test passed 1/1, `tests/new-loom-compile-pipeline.test.ts`
passed 3/3, `npm run typecheck` exited 0, `npm run test:contracts` passed
496/496, the focused Swift Compile tests passed 5/5, and `LOOM_SKIP_WEB_STAGE=1
xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration
Debug -destination 'platform=macOS' build` succeeded. This still leaves Compile
MVP open: richer rendered preview, provider request-body privacy inspection,
manual quality cases, remaining edge/error UX, and strict installed-app click
acceptance once Computer Use can read the Loom window.

At the 2026-05-10 Compile source-unavailable notice pass, the notes-only
fallback row from `plans/compile-pipeline-mvp.md §5.5` was narrowed.
`SourceFileView.compileSourceNotice(sourceExcerpt:)` now returns
`Source file unavailable; compiled from notes only.` when Compile cannot gather
readable source text, and `compileContextNoticeBanner` surfaces that copy near
the Compile button without blocking notes-only compilation. Red/green evidence:
the focused skeleton contract first failed on the missing notice state/banner
and copy, and the Swift focused test first failed because
`SourceFileView.compileSourceNotice` did not exist. After implementation, the
focused static contract passed 68/68, the focused source-notice Swift test
passed 1/1, `tests/new-loom-compile-pipeline.test.ts` passed 3/3,
`npm run typecheck` exited 0, `npm run test:contracts` passed 496/496, the
focused Swift Compile tests passed 6/6, and `LOOM_SKIP_WEB_STAGE=1 xcodebuild
-project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug
-destination 'platform=macOS' build` succeeded. This still leaves Compile MVP
open: richer rendered preview, provider request-body privacy inspection, manual
quality cases, remaining edge/error UX, and strict installed-app click
acceptance once Computer Use can read the Loom window.

At the 2026-05-10 Compile preview-shape pass, the first native render-polish
gap from `plans/compile-pipeline-mvp.md §5.2` was narrowed.
`SourceFileView.compilePreviewArtifact(markdown:)` now parses streamed Compile
markdown for `---` frames, `[term: explanation]` reveal markers, and LaTeX math
spans. The preview consumes reveal markers in the displayed body, labels
multi-frame output as `Frame 1`, `Frame 2`, and shows a compact shape summary
such as `2 frames · 1 reveal · 2 math` above the streamed text. Red/green
evidence: the focused skeleton contract first failed on the missing preview
helper/summary/shape model, and the Swift focused test first failed because
`SourceFileView.compilePreviewArtifact` did not exist. After implementation,
the focused static contract passed 68/68 and the focused preview Swift test
passed 1/1. This still leaves Compile MVP open: true rich typography/KaTeX or
native math rendering, live provider-request log acceptance, manual quality
cases, remaining edge/error UX, and strict installed-app click acceptance once
Computer Use can read the Loom window.

At the 2026-05-10 Compile provider-envelope privacy pass, the TypeScript prompt
path from `plans/compile-pipeline-mvp.md §6` was narrowed. `buildCompilePrompt`
now treats `corpusHits` as sandbox-only by default: if cross-source corpus hits
are accidentally supplied to Compile, the provider prompt says
`Corpus context: Omitted for Compile privacy.` and does not include corpus
titles or excerpts. The new `inspectCompilePromptPrivacy(...)` helper reports
provider-visible sections (`systemPrompt`, `scratch`, `activeSource`,
`priorNotes`, `askHistory`, plus `attachedReferences` when supplied), marks
`crossSourceCorpus` as omitted, and returns the warning
`Corpus context omitted for Compile privacy.` Red/green evidence: the focused
Compile pipeline test first failed because the prompt still included
`Corpus: RS485 wiring` and because `inspectCompilePromptPrivacy` was not
exported. After implementation, `npx tsx --test
tests/new-loom-compile-pipeline.test.ts` passed 4/4. This covers static
prompt-construction privacy; final Compile MVP still needs one live
provider-request body acceptance against the installed app, plus true rich
typography/KaTeX or native math rendering, manual quality cases, remaining
edge/error UX, and strict installed-app click acceptance once Computer Use can
read the Loom window.

At the 2026-05-10 Flipdisc reader-delete acceptance pass, the visible user
complaint was narrowed to installed/static bundle drift rather than missing
source UI. `app/loom-render/capture/page.tsx`,
`.next-export-current/_next/static/chunks/app/loom-render/capture/...`, and the
installed `/Users/yinyiping/Applications/Loom.app/Contents/Resources/web`
capture chunk all contain `Delete capture`, `Delete capture now`, and the
`loomCaptureDelete` bridge, while the stale repo `.next-build` capture chunk
from 01:37 did not. `scripts/installed-app-smoke.mjs` now fails if the installed
web bundle's capture reader route/chunk lacks the confirmed Delete action, and
`tests/loom-app-scripts.test.ts` includes a fake installed app that has
`Re-capture` but no `Delete capture` to prove the gate. Red/green evidence: the
new test first failed with `Missing expected rejection`; after the smoke gate it
passed. Verification passed: focused `tests/loom-app-scripts.test.ts` 29/29,
`LOOM_SMOKE_SKIP_CODESIGN=1 npm run app:smoke` against
`/Users/yinyiping/Applications/Loom.app` with 655 static web files,
`tests/capture-interactive-artifacts.test.ts` 9/9, `npm run typecheck`, `npm run
test:contracts` 498/498, and targeted `git diff --check`. Strict Computer Use
was retried, but still returned `cgWindowNotFound` for `com.yinyiping.loom`; the
remaining acceptance gap is direct installed-window AX/click verification, not
the installed bundle content. A follow-up `npm run build` attempt initially
hung before spawning `next build`; the root cause was the unbounded stale
Finder-duplicate scan/removal over `.next/server/app/...`. The duplicate cleanup
helper now accepts `maxDepth`, `scripts/build.mjs` bounds `.next` duplicate
cleanup to depth 3, and the focused script tests cover the bounded behavior.
After the shallow stale `.next` duplicates were cleared, `npm run build` passed,
regenerated `.next-build`, and Pagefind indexed 71 pages. Current verification
passed: focused script tests 33/33, `LOOM_SMOKE_SKIP_CODESIGN=1 npm run
app:smoke` with 655 static web files, `npm run typecheck`, `npm run
test:contracts` 499/499, `tests/capture-interactive-artifacts.test.ts` 9/9,
and `git diff --check`. The latest installed flipdisc capture sidecar
`Loom-capture-ast-20260509-195026-2c01fa19e547.json` has 69 AST blocks,
including provider embeds, visual assemblies, images, code, and headings, has
the frame tokens, has 0 unresolved `loom://media` references, and has saved
`loom://content` media refs.

At the 2026-05-10 Compile output-bounding pass, the "Compile output exceeds
reasonable size" edge case was narrowed. `boundCompileOutput(...)` now exists in
the TypeScript Compile pipeline and `SourceFileView.boundCompileOutput(...,
limit:)` mirrors it natively. Oversized Compile output is truncated within the
configured limit with an ellipsis and the visible notice `Output truncated;
consider splitting your scratch into focused sections.`; short output is left
unchanged. `SourceFileView.startCompile` applies the bounder before writing both
successful and partial compiled sections to `Loom.md`. Red/green evidence: the
TypeScript test first failed on the missing helper, and the selected Swift test
first failed on the missing native member. After implementation,
`tests/new-loom-compile-pipeline.test.ts` passed 5/5, the selected native test
passed 1/1, full `LoomDraftStoreTests` passed 40/40, `npm run typecheck`
passed, `npm run test:contracts` passed 500/500, and whitespace checks passed.
Compile MVP still remains open for true rich typography/KaTeX or native math
rendering, live provider-request body acceptance, manual quality cases, and
strict installed-app click acceptance once Computer Use can read the Loom
window.

At the 2026-05-10 Compile native preview block-render pass, the first render
polish gap was narrowed again. `CompilePreviewArtifact` now carries structured
`frames -> blocks` for headings, paragraphs, and math blocks. The native
Compile preview renders those blocks with frame labels, serif text hierarchy,
and monospaced math blocks instead of treating the stream as one raw markdown
blob. Reveal markers and inline math delimiters are consumed in the preview
model: `[imageData: payload bytes]` previews as `imageData`, `$0x80$` previews
as `0x80`, and `$$ ... $$` previews as a math block. Red/green evidence: the
selected Swift test first failed because `CompilePreviewArtifact` had no
`frames` member; after implementation the selected render-block test passed
1/1, and the focused preview pair passed 2/2. Compile MVP still remains open for
higher-fidelity math typesetting/KaTeX or equivalent, live provider-request body
acceptance, manual quality cases, and strict installed-app click acceptance once
Computer Use can read the Loom window.

At 2026-05-10 08:34 AEST, the installed-app and flipdisc capture checks were
rerun after the render-block pass. `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T22:32:10.197Z`; and `git diff --check` passed.
`npm run verify:capture-handoff` passed against the current saved
`flipdisc.io` capture with sidecar
`Loom-capture-ast-20260509-195026-2c01fa19e547.json`, matching snapshot
`Loom-snapshot-20260509-195026-ac79.html`, 1 segment diagram, 1 comparison
slider, 31 media nodes, and 0 unresolved media references. `npm run
verify:flipdisc-live` passed against live `https://flipdisc.io/` using staged
Atlas extension content script
`62241fc751cf6feb64059c38094d3755b21b0b8526a297d73331dcfea58abba2`, producing
70 blocks, 9 interactive artifacts, 1 input mirror, 1 comparison slider, 1
segment diagram, and the expected Frame Format tokens. Computer Use still could
not read the installed Loom window because `get_app_state` returned
`cgWindowNotFound` for both bundle id and app name while `ioreg` reported
`CGSessionScreenIsLocked=Yes`; no destructive UI action was taken.

At the 2026-05-10 Compile lightweight math-display pass, native Compile preview
math blocks gained a dual representation: raw LaTeX stays in `text` for
copy/accessibility/writeback, while `renderedText` maps common LaTeX symbols,
Greek letters, arrows, comparison operators, and simple subscript/superscript
notation into a typographic SwiftUI display string. The preview UI now renders
math blocks from `renderedText` with a serif math block. Red/green evidence:
the selected Swift test first failed because `CompilePreviewBlock` had no
`renderedText` member; after implementation, the selected math-display test
passed 1/1 and full `LoomDraftStoreTests` passed 42/42. This narrows Compile
render polish but does not yet equal full KaTeX/iosMath rendering.

At 2026-05-10 08:43 AEST, the lightweight math-display pass was rebuilt into
the installed user app. `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T22:42:20.229Z`; and `git diff --check` passed.
Computer Use still could not read the installed Loom window because
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound` while
`list_apps` and `pgrep` showed the installed Loom process running and `ioreg`
reported `CGSessionScreenIsLocked=Yes`.

At 2026-05-10 08:50 AEST, the native Compile provider path gained a
default-off request-body audit hook. Setting `LOOM_AI_REQUEST_AUDIT_LOG` to a
JSONL path records provider-visible request bodies with `provider`, `surface`,
`requestBody.messages`, and `requestBody.stream`; Compile passes
`surface: "compile"`, and the audit entry intentionally excludes
authorization/API-key material. Red/green evidence: the selected Swift audit
test first failed because `LoomAIRequestAudit` did not exist; after
implementation the selected audit test passed 1/1, full `LoomDraftStoreTests`
passed 43/43, `npm run test:contracts` passed 500/500, and `git diff --check`
passed. `npm run app:user` then installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T22:48:57.189Z`. Computer Use still cannot read
the installed Loom window while the Mac session is locked:
`get_app_state("com.yinyiping.loom")` and `get_app_state("Loom")` return
`cgWindowNotFound`, `list_apps` sees Loom running, `ps` shows the installed app
binary, and `ioreg` reports `CGSessionScreenIsLocked=Yes`. The next strict
Compile provider-body acceptance still requires an unlocked installed-app run
with `LOOM_AI_REQUEST_AUDIT_LOG` set.

At 2026-05-10 08:54 AEST, the Compile manual-quality target was made
executable instead of prose-only. `compileManualQualityCases()` now exports the
five §9.3 review fixtures: math derivation, definition cluster, step-by-step
algorithm, conceptual reflection, and mixed scratch dispatch. Each fixture has
reviewable scratch, an expected output shape, visible required signals, and
acceptance criteria; the mixed case requires contradictions to be surfaced
rather than silently resolved. Red/green evidence: the focused Compile pipeline
test first failed because the helper was missing, then passed 6/6 after the
registry was added. Wider gates passed: `npm run typecheck`, `npm run
test:contracts` 501/501, and `git diff --check`. This narrows the manual
quality gap to real provider output plus product-owner review; it does not make
Compile MVP shipped.

At 2026-05-10 09:01 AEST, the contradiction-preservation rule was promoted
from fixture acceptance text into the actual Compile prompts. Both the
TypeScript and Swift prompt builders now instruct the provider to surface
contradictory scratch statements rather than silently choosing one. Red/green
evidence: the TS focused test first failed on the missing prompt rule and then
passed 6/6; the selected Swift prompt test first failed and then passed 1/1;
full `LoomDraftStoreTests` passed 43/43. Wider gates passed: `npm run
typecheck`, `npm run test:contracts` 501/501, and `git diff --check`.
`npm run app:user` then rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T22:58:08.594Z`.

The 09:01 AEST flipdisc acceptance pass found the saved
`https://flipdisc.io/` capture is structurally good. `npm run
verify:capture-handoff` passed against saved Loom data with sidecar
`Loom-capture-ast-20260509-195026-2c01fa19e547.json`, snapshot
`Loom-snapshot-20260509-195026-ac79.html`, 1 `Frame Format` segment diagram, 1
comparison slider, 31 media nodes, and 0 unresolved media references. `npm run
verify:flipdisc-live` passed against live `https://flipdisc.io/`, producing 70
blocks, 9 interactive artifacts, 1 input mirror, 1 comparison slider, 1 segment
diagram, and the expected frame tokens. It still needs experience polish before
calling the web-capture surface done: saved Markdown still carries the flat
frame-text fallback warning, headless live canary logs expected
visible-tab/canvas screenshot fallbacks, some visual blocks still have generic
alt labels, and the screenshot-reported missing Delete button could not be
clicked through Computer Use because the Mac session is locked.
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, `ioreg`
reports `CGSessionScreenIsLocked=Yes`, and the currently running Loom process
started at 08:12 while the new installed bundle was written at 08:58. Relaunch
the app after unlocking before claiming the visible window reflects the latest
bundle.

At 2026-05-10 09:06 AEST, Compile native preview math display was improved
again without adding a large math dependency. The lightweight renderer now
handles `\frac{}`, `\sqrt{}`, `\sum`, `\prod`, `\int`, `\partial`, `\nabla`,
`\infty`, and `\pm` in addition to the earlier Greek-letter, arrow, comparison,
subscript, and superscript replacements. Red/green evidence: the selected Swift
test first failed because raw `\frac`, `\sqrt`, and `\sum` remained visible;
after implementation, the selected test passed 1/1 and full
`LoomDraftStoreTests` passed 44/44. Wider gates passed: `npm run typecheck`,
`npm run test:contracts` 501/501, and `git diff --check`. This narrows but does
not fully close the KaTeX/iosMath-level render-polish gap.

At 2026-05-10 09:08 AEST, the latest build was installed to
`/Users/yinyiping/Applications/Loom.app`. `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T23:08:19.012Z`; and `git diff --check` passed.
Computer Use still cannot complete visible acceptance because the macOS console
session is locked: `get_app_state("com.yinyiping.loom")` returned
`cgWindowNotFound`, `ioreg` reports `CGSessionScreenIsLocked=Yes`, and the Loom
binary is running from `/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`.
After unlocking, relaunch Loom and rerun the Source Index / capture reader
visual acceptance before claiming the current visible app reflects this bundle.

At 2026-05-10 09:10 AEST, the flipdisc verifiers were rerun and stayed green.
`npm run verify:capture-handoff` passed against the saved `flipdisc.io` capture
with 69 blocks, 31 media nodes, 1 comparison slider, 1 `Frame Format` segment
diagram, and 0 unresolved media references. `npm run verify:flipdisc-live`
passed against `https://flipdisc.io/` with 70 blocks, 31 media nodes, 9
interactive artifacts, 1 input mirror, 1 comparison slider, 1 segment diagram,
and the expected `0x80`, `0x83`, `0x01`, `imageData`, `0x8F` frame tokens.
Remaining issues are polish and visible acceptance: saved Markdown still carries
a flat frame-text fallback warning, headless live still logs expected
visible-tab/canvas screenshot fallbacks, and the missing Delete control cannot
be accepted through Computer Use until the session is unlocked.

At 2026-05-10 09:14 AEST, Compile's native preview math renderer was tightened
for nested lightweight LaTeX arguments. The new regression case
`\frac{1}{\sqrt{n}} + \frac{x_i}{y_{i+1}}` first failed by leaking raw
`\frac{...}` text; after the renderer now consumes scripts before resolving
fractions, it displays as `1⁄√(n) + xᵢ⁄yᵢ₊₁`. Full `LoomDraftStoreTests`
passed 45/45, `npm run typecheck` passed, `npm run test:contracts` passed
501/501, and `git diff --check` passed. This narrows the render-polish gap but
still does not replace full KaTeX/iosMath layout or live provider acceptance.

At 2026-05-10 09:19 AEST, Computer Use acceptance was completed after the
desktop unlocked. Installed Loom Draft showed the saved verification draft with
source tiles and references for the flipdisc capture, `ECON 3202`, and
`15 · Multimodal`. Opening the flipdisc reference showed the capture reader with
title/source metadata, reader controls, and a visible `Delete capture` button;
the destructive button was not clicked. The reader preserved the main article,
links, YouTube placeholder, image/canvas capture entries, source-snapshot links,
the `Frame Format` segment diagram, and tail `Inspiration` content. Opening
`Source snapshot` loaded the saved snapshot route with sandboxed JS, a 519 KB
snapshot, pixel-font input mirrors, and the dithering comparison slider. Fresh
checks also passed: `npm run verify:capture-handoff`, `npm run
verify:flipdisc-live`, `npm run app:smoke`, `npm run app:where`, and
`git diff --check`. Current verdict: `https://flipdisc.io/` capture quality is
good enough for the current reader/snapshot workflow; remaining work is polish
around the saved-Markdown flat-frame fallback warning, generic visual alt
labels, and headless canary screenshot fallback noise.

At 2026-05-10 09:24 AEST, Compile's malformed structured-output fallback was
added without sending user data to any AI provider. The TypeScript Compile
parser and native `SourceFileView` preview now treat unbalanced math delimiters
or malformed `[term: explanation]` reveal markers as plain-Markdown fallback
cases and show `Output rendered without typesetting.` Red/green evidence:
`tests/new-loom-compile-pipeline.test.ts` first failed on missing
`malformed` / `notice` output and structured frames still being returned for
malformed input; the skeleton contract first failed on the missing visible
notice; and the selected Swift test first failed because
`CompilePreviewArtifact` had no `notice`. After implementation, the focused TS
Compile test passed 7/7, the skeleton contract passed 68/68, and the selected
Swift malformed-preview test passed 1/1. Compile remains open for live provider
body acceptance, true high-fidelity math/layout, real AI output review, strict
installed-app Compile click acceptance, and product-owner quality acceptance.

At 2026-05-10 09:27 AEST, the edited native/web bundle was rebuilt and
installed with `npm run app:user`. The install succeeded to
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files, `npm run app:where`
reported timestamp `2026-05-09T23:26:13.183Z`, and `git diff --check` passed.
Computer Use read the current Loom window from
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` and confirmed the
flipdisc snapshot route exposes sandboxed JS, `Delete capture`, reader/snapshot
controls, article text, contents links, embedded YouTube iframe, code/text
blocks, input mirrors, comparison slider, and tail sections through
`Inspiration`; no destructive control was clicked. Caveat: the visible process
started at `2026-05-10 08:12:47 AEST`, before the newly installed binary
timestamp `2026-05-10 09:26:13 AEST`, so relaunch Loom before claiming strict
installed-app acceptance for the latest Swift changes.

At 2026-05-10 09:34 AEST, Compile's `(unsupported)` provider-marker handling
was implemented as a typed parser/native-preview path instead of leaving raw
marker text in the artifact. `parseCompileArtifact` now returns
`unsupportedClaims` and `unsupportedCount`; native preview paragraphs consume
the marker, attach an `Unsupported claim` annotation, surface the annotation in
the preview body, and summarize it as an unsupported-claim count. Red/green
evidence: the focused TS test, skeleton contract, and selected Swift test each
failed before implementation on the missing contract; after implementation the
Compile pipeline test passed 8/8, the skeleton contract passed 68/68, the
combined focused TS run passed 76/76, full `LoomDraftStoreTests` passed 47/47,
`npm run typecheck` passed, and `npm run test:contracts` passed 503/503.
Compile still needs live provider-request body acceptance, true
high-fidelity math/layout, real AI output review, strict latest-binary
installed-app Compile click acceptance, and product-owner quality acceptance.

At 2026-05-10 09:37 AEST, the edited native/web bundle was rebuilt and
installed again with `npm run app:user`. The install succeeded to
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files; `npm run app:where`
reported timestamp `2026-05-09T23:36:26.191Z`; and `git diff --check` passed.
Computer Use read the current Loom window from the installed app path and saw
the flipdisc snapshot route with sandboxed JS, `Delete capture`, reader/snapshot
controls, article text, contents links, embedded YouTube iframe, code/text
blocks, input mirrors, comparison slider, and tail sections through
`Inspiration`; no destructive control was clicked. Caveat: the visible process
started at `2026-05-10 08:12:47 AEST`, before the 09:36 installed binary, so
strict UI acceptance of the latest native Compile change still requires
relaunching Loom.

At 2026-05-10 09:41 AEST, Compile math preview was tightened again without a
live provider call. The TS parser now returns ordered inline/block
`mathExpressions` with lightweight display strings, and native paragraph
preview renders inline LaTeX through the existing lightweight math renderer
instead of showing raw commands like `\theta` / `\nabla`. Red/green evidence:
the focused TS test failed on missing `mathExpressions`, and the selected Swift
test failed on raw inline LaTeX in paragraph text; after implementation the
Compile pipeline test passed 9/9, the combined Compile/skeleton run passed
77/77, the selected Swift test passed 1/1, full `LoomDraftStoreTests` passed
48/48, `npm run typecheck` passed, and `git diff --check` passed. This narrows
but does not close the full KaTeX/iosMath-level render gap.

At 2026-05-10 09:50 AEST, Compile reveal markers were promoted from parser
metadata to native preview UI. Paragraph blocks now carry
`CompilePreviewReveal` entries; `[term: explanation]` markers are still removed
from paragraph prose, but the preview renders compact term chips with hover
help and accessibility labels for the explanations. Red/green evidence: the
selected Swift test first failed on the missing `reveals` member and missing
`CompilePreviewReveal` type; after implementation the selected reveal test
passed 1/1, full `LoomDraftStoreTests` passed 49/49, the combined
Compile/skeleton TS run passed 77/77, `npm run typecheck` passed, and
`npm run test:contracts` passed 504/504. Compile still needs live provider
body acceptance, true high-fidelity math/layout, real AI output review, strict
latest-binary installed-app Compile click acceptance, and product-owner quality
acceptance.

At 2026-05-10 09:52 AEST, the edited native/web bundle was rebuilt and
installed with `npm run app:user`. The install succeeded to
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 637 static web files, `npm run app:where`
reported timestamp `2026-05-09T23:52:04.796Z`, `stat` showed the local app and
executable at `2026-05-10 09:52:04 +1000`, and `git diff --check` passed.
Computer Use still cannot inspect the visible Loom window:
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, although
`list_apps` sees Loom running. The running installed process is still pid
`38106`, started `2026-05-10 08:12:47 AEST`, so strict UI acceptance for the
latest native Compile reveal work requires relaunching Loom.

At 2026-05-10 10:00 AEST, the Draft-side attached-reference delete gap was
narrowed. Native Draft now renders `Remove reference` controls in both
References and Source tiles; the action detaches that reference from the draft
without deleting the original source/capture. Storage support lives in
`LoomDraftStore.removeReference(href:from:now:)` and updates both `drafts.json`
and the readable Markdown sidecar. Red/green evidence: selected Swift first
failed on missing `removeReference`, skeleton contract first failed on missing
Draft remove UI; after implementation the selected Swift test passed 1/1, full
`LoomDraftStoreTests` passed 50/50, full `tests/new-loom-skeleton-contract`
passed 69/69, `npm run typecheck` passed, and `git diff --check` passed.

At 2026-05-10 10:03 AEST, that Draft reference-detach build was installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:02:06.948Z`, and `stat` showed the app bundle and executable at
`2026-05-10 10:02:06 +1000`. Computer Use still cannot inspect the visible
Loom window: both `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`, although
`list_apps` sees Loom running. The visible process is still pid `38106`,
started `2026-05-10 08:12:47 AEST`; strict UI acceptance of the latest Draft
delete controls still requires relaunching Loom.

At 2026-05-10 10:13 AEST, Compile's lightweight math/layout path was narrowed
again. TypeScript and native preview now consume common multiline LaTeX
environments (`aligned`, `align`, `align*`, `cases`) into readable multiline
display strings instead of showing raw `\begin...` blocks or `&` alignment
markers, and native preview body summaries now use rendered math text for math
blocks while preserving raw LaTeX for copy/writeback. Red/green evidence: the
focused TS and selected Swift tests first failed on raw environment leakage;
after implementation the focused runs passed, combined Compile/skeleton
TypeScript tests passed 79/79, full `LoomDraftStoreTests` passed 51/51,
`npm run typecheck` passed, `npm run test:contracts` passed 506/506, and
`git diff --check` passed.

At 2026-05-10 10:13 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:12:53.346Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:12:53 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:12 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance. Relaunch Loom before claiming UI
acceptance of the newest Compile/Draft changes.

At 2026-05-10 10:21 AEST, Compile's lightweight math/layout path was narrowed
again for common matrix environments. TypeScript and native preview now consume
`bmatrix`, `pmatrix`, and `matrix` into readable multiline display strings
instead of showing raw `\begin...` blocks or `&` alignment markers. Red/green
evidence: the focused TS and selected Swift tests first failed on raw matrix
environment leakage; after implementation the focused TS matrix run passed
11/11, the selected Swift matrix test passed 1/1, combined Compile/skeleton
TypeScript tests passed 80/80, full `LoomDraftStoreTests` passed 52/52,
`npm run typecheck` passed, `npm run test:contracts` passed 507/507, and
`git diff --check` passed.

At 2026-05-10 10:21 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:21:24.294Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:21:24 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:21 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 10:28 AEST, Compile's lightweight math/layout path was narrowed
again for LaTeX `array` environments. TypeScript and native preview now
consume `\begin{array}{...}` as a matrix-style multiline display, strip the
leading column spec such as `{cc}`, and avoid showing raw `\begin...` blocks or
`&` alignment markers. Red/green evidence: the focused TS and selected Swift
tests first failed on raw array environment leakage; after implementation the
focused TS array run passed 12/12, the selected Swift array test passed 1/1,
combined Compile/skeleton TypeScript tests passed 81/81, full
`LoomDraftStoreTests` passed 53/53, `npm run typecheck` passed,
`npm run test:contracts` passed 508/508, and `git diff --check` passed.

At 2026-05-10 10:28 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:28:10.292Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:28:10 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:28 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 10:36 AEST, Compile's lightweight math/layout path was narrowed
again for common limit and operator commands inside scripted expressions.
TypeScript and native preview now render expressions such as
`\lim_{n \to \infty} 1/n \sum_{i=1}^n \log p_\theta(x_i)` as readable text
like `limₙ → ∞ 1⁄n ∑ᵢ₌₁ⁿ log p_θ(xᵢ)` instead of showing raw command leakage.
Red/green evidence: the focused TS and selected Swift tests first failed on
raw/garbled `\limₙ \ₜₒ \ᵢₙfₜy ... \log`; after implementation the focused TS
run passed 13/13, the selected Swift test passed 1/1, combined
Compile/skeleton TypeScript tests passed 82/82, full `LoomDraftStoreTests`
passed 54/54, `npm run typecheck` passed, `npm run test:contracts` passed
509/509, `git diff --check` passed, and `git diff --cached --check` passed.

At 2026-05-10 10:36 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:35:52.690Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:35:52 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:35 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 10:44 AEST, Compile's lightweight math/layout path was narrowed
again for common LaTeX text/font formatting wrappers. TypeScript and native
preview now unwrap `\operatorname{}`, `\mathrm{}`, `\text{}`, `\mathbb{}`,
plus the same one-argument path for `\mathbf{}` and `\mathcal{}`, while also
rendering `\in` without breaking the existing `\infty` token. Red/green
evidence: the focused TS and selected Swift tests first failed on raw wrapper
leakage; the first implementation exposed a token-order regression where
`\infty` became `infty`, and Swift needed spacing normalization after unwrap.
After implementation the focused TS run passed 14/14, the selected Swift
limit/operator plus formatting run passed 2/2, combined Compile/skeleton
TypeScript tests passed 83/83, full `LoomDraftStoreTests` passed 55/55,
`npm run typecheck` passed, and `npm run test:contracts` passed 510/510.

At 2026-05-10 10:44 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:43:56.681Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:43:56 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:43 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 10:46 AEST, the saved and live `https://flipdisc.io/` capture
paths were rechecked. `npm run verify:capture-handoff` passed against the
installed sandbox capture with the expected segment diagram
`0x80 -> 0x83 -> 0x01 -> imageData -> 0x8F`, `segmentDiagramCount: 1`, 31 media
nodes, 10 code blocks, 91 links, and `unresolvedMediaReferences: []`.
`npm run verify:flipdisc-live-handoff` also passed against the live page; the
fixture produced 70 blocks, 9 interactive artifacts, 1 comparison slider, 1
input mirror, 1 segment diagram, 3 animated canvases, 3 source islands, 31 media
nodes, and no unresolved media references. Remaining note: the saved Markdown
still contains the flat frame text, so the reader must keep prioritizing
CaptureAST/fallback structure for the segment diagram.

At 2026-05-10 10:52 AEST, Compile's lightweight math/layout path was narrowed
again for set-builder delimiters and membership operators. TypeScript and
native preview now render
`\left\{ x \in \mathbb{R} \mid x \ge 0, x \notin \mathbb{Z} \right\}` as
`{ x ∈ R | x ≥ 0, x ∉ Z }` instead of leaking raw delimiter/membership
commands. Red/green evidence: the focused TS and selected Swift tests first
failed on raw `\{`, `\mid`, `\ge`, `\notin`, and `\}` leakage; the first
implementation exposed a token-order regression where `\le` replaced the
prefix of `\left`, producing `≤ft{...}`. After implementation the focused TS
run passed 15/15, the selected Swift run passed 3/3, combined Compile/skeleton
TypeScript tests passed 84/84, full `LoomDraftStoreTests` passed 56/56,
`npm run typecheck` passed, and `npm run test:contracts` passed 511/511.

At 2026-05-10 10:52 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:52:01.727Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:52:01 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:52 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 10:59 AEST, Compile's lightweight math/layout path was narrowed
again for common set and probability-logic symbols. TypeScript and native
preview now render
`\forall x \in A \subseteq B, A \cap B \neq \emptyset \Rightarrow x \sim p(x)`
as `∀ x ∈ A ⊆ B, A ∩ B ≠ ∅ ⇒ x ∼ p(x)` instead of leaking raw symbol commands.
Red/green evidence: the focused TS and selected Swift tests first failed on raw
`\forall`, `\subseteq`, `\cap`, `\emptyset`, and `\sim` leakage. After
implementation the focused TS run passed 16/16, the selected Swift run passed
1/1, combined Compile/skeleton TypeScript tests passed 85/85, full
`LoomDraftStoreTests` passed 57/57, `npm run typecheck` passed, and
`npm run test:contracts` passed 512/512.

At 2026-05-10 10:59 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T00:59:15.263Z`; `stat` showed the app bundle and executable at
`2026-05-10 10:59:15 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 10:59 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 11:05 AEST, the TypeScript Compile parser gained web-renderable
KaTeX output while preserving the existing lightweight display strings.
`mathExpressions[].html` now contains KaTeX HTML/MathML from
`katex.renderToString(...)`; inline expressions include `class="katex"` and
the original TeX annotation, while block expressions include
`class="katex-display"` plus MathML `display="block"`. Red/green evidence: the
focused test first failed because the `html` field was undefined; after
implementation the focused KaTeX HTML run passed 17/17, full Compile parser
tests passed 17/17, combined Compile/skeleton TypeScript tests passed 86/86,
`npm run typecheck` passed, and `npm run test:contracts` passed 513/513.

At 2026-05-10 11:05 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T01:05:16.584Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:05:16 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 11:05 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 11:12 AEST, TypeScript Compile gained a reusable safe web
artifact renderer. `renderCompileArtifactHtml(markdown)` emits a
`loom-compile-artifact` article with frame sections, KaTeX inline/block math,
reveal chips, unsupported-claim labels, and escaped ordinary text, so the
KaTeX output is no longer only a detached `mathExpressions[].html` field.
Red/green evidence: the focused renderer test first failed because the function
was not exported; after implementation it passed and verified two frame
sections, KaTeX inline/display HTML, original TeX annotations, reveal output,
`Unsupported claim`, escaped `<script>` text, and no raw `$...$` delimiter
leakage. Latest gates passed: full Compile parser 18/18, combined
Compile/skeleton TypeScript tests 87/87, `npm run typecheck`, and
`npm run test:contracts` 514/514.

At 2026-05-10 11:12 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T01:12:05.715Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:12:05 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 11:12 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 11:19 AEST, Compile's safe web renderer gained its first React
surface and global styling. `components/CompileArtifactRenderer.tsx` wraps
`renderCompileArtifactHtml(markdown)` in a `loom-compile-artifact-shell` and
returns `null` for empty input; `app/globals.css` now styles the shell, artifact
article, frame sections, math blocks, reveal chips, unsupported-claim labels,
and fallback notices. Red/green evidence: the focused React test first failed
because the component did not exist; the CSS contract first failed because the
shell selector was absent; the first retry then exposed a missing React import.
After implementation the focused Compile run passed 19/19, the CSS contract
passed 1/1, combined Compile/CSS/skeleton TypeScript tests passed 89/89,
`npm run typecheck` passed, and `npm run test:contracts` passed 515/515.

At 2026-05-10 11:19 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 637 static web files; `npm run app:where` reported timestamp
`2026-05-10T01:19:01.101Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:19:01 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` both returned `cgWindowNotFound`. The
running process remains pid `38106`, started `2026-05-10 08:12:47 AEST`,
before the installed 11:19 binary, so this is installed-bundle verification,
not strict latest-binary UI acceptance.

At 2026-05-10 11:24 AEST, Compile's web artifact surface was connected to the
actual source-reading path. `DocViewer` now splits text/Markdown source bodies
on `### Compiled · YYYY-MM-DD HH:MM` sections, renders those sections through
`CompileArtifactRenderer`, and keeps surrounding ordinary source text on the
existing paragraph renderer. Red/green evidence: the focused DocViewer test
first failed because the compiled section still appeared as a raw paragraph
with no `loom-compile-artifact-shell`; after implementation the focused
Compile run passed 20/20, combined Compile/CSS/skeleton TypeScript tests passed
90/90, and `npm run typecheck` passed.

At 2026-05-10 11:27 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. Post-install `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 638 static web files; `npm run app:where` reported timestamp
`2026-05-10T01:26:56.110Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:26:56 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")`,
`get_app_state("com.yinyiping.loom")`, and `get_app_state("Loom.app")` all
returned `cgWindowNotFound`. The running process remains pid `38106`, started
`2026-05-10 08:12:47 AEST`, before the installed 11:26 binary, so this is
installed-bundle verification, not strict latest-binary UI acceptance.

At 2026-05-10 11:30 AEST, the current `https://flipdisc.io/` live capture
verifier passed again. The payload reported `bodyHasFlatFrameLine: false`, 70
blocks, 9 interactive artifacts, 31 media nodes, 10 code blocks, 91 links,
1 input mirror, 1 comparison slider, 1 segment diagram, 3 animated canvases,
and 3 source islands. The generated handoff fixture verified the frame diagram
`0x80 -> 0x83 -> 0x01 -> imageData -> 0x8F` with no unresolved media
references, warnings, or errors. Treat remaining work here as installed-window
UI acceptance after relaunch/fresh Computer Use, not core flipdisc extraction.

At 2026-05-10 11:34 AEST, Compile's safe web artifact renderer gained
structured ordered and unordered Markdown list output. The renderer now emits
`ol/ul/li` with `loom-compile-list` classes instead of collapsing algorithm
steps and bullets into paragraph line breaks, while still applying inline math,
reveal chips, unsupported labels, and escaping inside list items. Red/green
evidence: the focused renderer test first failed on paragraph output; after
implementation `tests/new-loom-compile-pipeline.test.ts` passed 21/21 and the
global CSS contract passed 1/1. Latest gates after this slice passed: combined
Compile/CSS/skeleton TypeScript tests 91/91, `npm run typecheck`,
`npm run test:contracts` 517/517, `git diff --check`, and
`git diff --cached --check`.

At 2026-05-10 11:37 AEST, the edited bundle was rebuilt and installed with
`npm run app:user`. Post-install `npm run app:smoke` passed for
`/Users/yinyiping/Applications/Loom.app` with bundle id `com.yinyiping.loom`
and 638 static web files; `npm run app:where` reported timestamp
`2026-05-10T01:37:03.935Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:37:03 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 11:37 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 11:40 AEST, Compile's safe web artifact renderer gained fenced
Markdown code block output. The renderer now emits safe `<pre><code>` blocks
instead of folding fence markers into paragraphs; code content is escaped and
does not pass through inline reveal/math parsing, while prose after the fence
still receives inline KaTeX rendering. Red/green evidence: the focused renderer
test first failed on paragraph output; after implementation
`tests/new-loom-compile-pipeline.test.ts` passed 22/22 and the global CSS
contract passed 1/1.

Latest verification after the fenced-code slice passed: combined
Compile/CSS/skeleton TypeScript tests 92/92, `npm run typecheck`,
`npm run test:contracts` 518/518, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T01:42:24.756Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:42:24 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 11:42 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 11:46 AEST, Compile's safe web artifact renderer gained simple
Markdown table output for glossary/comparison artifacts. Tables now render as a
`loom-compile-table` with safe `thead`/`tbody` structure instead of paragraph
line breaks; cell content still supports inline KaTeX math, reveal chips,
unsupported labels, and HTML escaping. Red/green evidence: the focused renderer
test first failed on paragraph output, and the CSS contract failed on the
missing table selector; after implementation `tests/new-loom-compile-pipeline.test.ts`
passed 23/23 and the global CSS contract passed 1/1.

Latest verification after the table slice passed: combined Compile/CSS/skeleton
TypeScript tests 93/93, `npm run typecheck`, `npm run test:contracts` 519/519,
`git diff --check`, cached diff whitespace check, `npm run app:user`, and
`npm run app:smoke` with bundle id `com.yinyiping.loom` and 638 static web
files. `npm run app:where` reported `2026-05-10T01:49:34.091Z`; `stat` showed
the app bundle and executable at `2026-05-10 11:49:34 +1000`. Computer Use was
retried: `list_apps` sees `Loom - com.yinyiping.loom [running]`, but
`get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")` returned
`cgWindowNotFound`. The running process remains pid `38106`, started
`2026-05-10 08:12:47 AEST`, before the installed 11:49 binary, so this is
installed-bundle verification, not strict latest-binary UI acceptance.

At 2026-05-10 11:56 AEST, Compile's safe web artifact renderer gained Markdown
blockquote output for source-claim quotation. Blockquotes now render as
`loom-compile-quote` instead of paragraphs with escaped `>` markers; quote
content still supports inline KaTeX math, reveal chips, unsupported labels, and
HTML escaping. Red/green evidence: the focused renderer test first failed on
paragraph output, and the CSS contract failed on the missing quote selector;
after implementation `tests/new-loom-compile-pipeline.test.ts` passed 24/24 and
the global CSS contract passed 1/1.

Latest verification after the blockquote slice passed: combined
Compile/CSS/skeleton TypeScript tests 94/94, `npm run typecheck`,
`npm run test:contracts` 520/520, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T01:56:14.156Z`; `stat` showed the app bundle and executable at
`2026-05-10 11:56:14 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 11:56 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:02 AEST, Compile's safe web artifact renderer gained Markdown
strong/emphasis inline output. `**...**` and `*...*` now render as `strong` and
`em` inside compiled paragraphs instead of leaking raw stars; decorated text is
escaped before insertion, while inline KaTeX math, reveal chips, and unsupported
labels keep their existing render paths. Red/green evidence: the focused
renderer test first failed on raw marker output, and the CSS contract failed on
the missing emphasis selector; after implementation
`tests/new-loom-compile-pipeline.test.ts` passed 25/25 and the global CSS
contract passed 1/1.

Latest verification after the emphasis slice passed: combined
Compile/CSS/skeleton TypeScript tests 95/95, `npm run typecheck`,
`npm run test:contracts` 521/521, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:01:44.968Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:01:44 +1000`. Computer Use was retried: `list_apps` returned
`connectionInvalid`, and `get_app_state("Loom")` /
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:01 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:09 AEST, Compile's parser gained support for the stored
example reveal marker form `[term: label | explanation]`. The parser now
normalizes that form so the left side of the pipe becomes the visible reveal
term and the right side becomes the explanation, while ordinary
`[label: explanation]` markers continue to parse unchanged. Red/green evidence:
the focused parser test first failed because `[term: gradient | The vector ...]`
parsed as term `term`; after implementation
`tests/new-loom-compile-pipeline.test.ts` passed 26/26.

Latest verification after the pipe-form reveal marker slice passed: combined
Compile/CSS/skeleton TypeScript tests 96/96, `npm run typecheck`,
`npm run test:contracts` 522/522, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:08:47.225Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:08:47 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:08 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:16 AEST, Compile's safe web artifact renderer gained safe
Markdown link output. `renderCompileArtifactHtml` now turns safe
`[label](href)` links into `loom-compile-link` anchors for `http:`, `https:`,
and `mailto:` targets, while unsafe schemes such as `javascript:` and `data:`
are stripped to readable escaped label text. Red/green evidence: the focused
renderer test first failed because the Markdown link syntax stayed raw, and the
CSS contract failed on the missing link selector; after implementation
`tests/new-loom-compile-pipeline.test.ts` passed 27/27 and the global CSS
contract passed 1/1.

Latest verification after the link-render slice passed: combined
Compile/CSS/skeleton TypeScript tests 97/97, `npm run typecheck`,
`npm run test:contracts` 523/523, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:15:43.420Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:15:43 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:15 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:23 AEST, Compile's safe web artifact renderer gained safe
Markdown inline code output. `renderCompileArtifactHtml` now turns backtick
inline code spans into escaped `loom-compile-inline-code` nodes instead of
leaving Markdown backticks in compiled paragraphs. Red/green evidence: the
focused renderer test first failed because `0x80` and `imageData` stayed
wrapped in raw backticks, and the CSS contract failed on the missing inline
code selector; after implementation
`tests/new-loom-compile-pipeline.test.ts` passed 28/28 and the global CSS
contract passed 1/1.

Latest verification after the inline-code slice passed: combined
Compile/CSS/skeleton TypeScript tests 98/98, `npm run typecheck`,
`npm run test:contracts` 524/524, `git diff --check`, cached diff whitespace
check, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:21:58.228Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:21:58 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:21 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:30 AEST, native Compile preview gained Markdown inline-code
normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now keeps inline code content visible while removing raw backtick markers, so
native streaming previews no longer show `` `0x80` `` or `` `imageData` `` in
the paragraph body. Red/green evidence: the selected Swift test first failed
because backticks leaked into the preview text, and the skeleton contract first
failed because `compilePreviewCleanInlineCode` did not exist; after
implementation the selected Swift test passed 1/1 and the skeleton contract
passed 69/69.

Latest verification after the native inline-code preview slice passed: full
`LoomDraftStoreTests` 58/58, `npm run typecheck`, `npm run test:contracts`
524/524, `git diff --check`, cached diff whitespace check, `npm run app:user`,
and `npm run app:smoke` with bundle id `com.yinyiping.loom` and 638 static web
files. `npm run app:where` reported `2026-05-10T02:29:30.238Z`; `stat` showed
the app bundle and executable at `2026-05-10 12:29:30 +1000`. Computer Use was
retried: `list_apps` sees `Loom - com.yinyiping.loom [running]`, but
`get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")` returned
`cgWindowNotFound`. The running process remains pid `38106`, started
`2026-05-10 08:12:47 AEST`, before the installed 12:29 binary, so this is
installed-bundle verification, not strict latest-binary UI acceptance.

Next chat should continue with real user-data question-container row/body-save
acceptance only if the user explicitly approves creating a temporary question.
Otherwise, continue into the next incomplete new-Loom surface without
re-opening flipdisc capture, Source Index origin/delete controls, local file
import, Moodle/course-bundle Source Index metadata or its current ingest
quality filter, image importer readable summaries, Draft AI attached-reference
artifact-state prompt data, Draft AI inline artifact-state prompt data,
Draft AI corpus-wide artifact-state prompt data, Add Question sheet wiring, the detail-editor
bridge, Discipline support page, first `/year` support-route slice, first
Wintering state inference, web/native Source Index public-working privacy
masks, the first `/hour` support-route slice, or the generic bundle-route relay
unless a regression appears.

At 2026-05-10 12:39 AEST, native Compile preview gained Markdown-link
normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now keeps readable link labels while removing raw `[label](href)` syntax and
href text, including unsafe hrefs such as `javascript:alert(1)`. Red/green
evidence: the selected Swift test first failed because raw link syntax and the
unsafe href leaked into the preview body, and the skeleton contract first
failed because `compilePreviewCleanMarkdownLinks` did not exist; the first
implementation also caught a real href-parenthesis edge case before the final
green run.

Latest verification after the native Markdown-link preview slice passed: full
`LoomDraftStoreTests` 59/59, `npm run typecheck`, `npm run test:contracts`
524/524, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:38:02.635Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:38:02 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:38 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:47 AEST, native Compile preview gained Markdown-emphasis
normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now removes `**...**`, `*...*`, `__...__`, and `_..._` emphasis markers while
preserving the readable text. Red/green evidence: the selected Swift test first
failed because raw emphasis markers leaked into the preview, and the skeleton
contract first failed because `compilePreviewCleanMarkdownEmphasis` did not
exist; after implementation, the selected Swift test passed 1/1 and the
skeleton contract passed 69/69.

Latest verification after the native Markdown-emphasis preview slice passed:
full `LoomDraftStoreTests` 60/60, `npm run typecheck`, `npm run test:contracts`
524/524, `npm run app:user`, and `npm run app:smoke` with bundle id
`com.yinyiping.loom` and 638 static web files. `npm run app:where` reported
`2026-05-10T02:46:17.924Z`; `stat` showed the app bundle and executable at
`2026-05-10 12:46:17 +1000`. Computer Use was retried in this conversation and
through a fresh `codex exec` fallback: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:46 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 12:51 AEST, native Compile preview gained Markdown-list marker
normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now strips line-start unordered bullets and ordered markers before the existing
inline Markdown/math cleanup, so list-like provider output no longer appears as
raw `- item` or `1. item` prefixes in the lightweight native preview.

Latest verification after the native Markdown-list preview slice passed: the
selected Swift test first failed 3 assertions, the skeleton contract first
failed on missing `compilePreviewCleanMarkdownListMarker`, then both turned
green. Wider gates passed: full `LoomDraftStoreTests` 61/61,
`npm run typecheck`, and `npm run test:contracts` 524/524.

Post-install verification also passed for the list-marker slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T02:53:56.067Z`. `stat` showed the app bundle and executable at
`2026-05-10 12:53:56 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 12:53 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

Final hygiene at `2026-05-10 12:56 AEST`: full `LoomDraftStoreTests` passed
61/61, `npm run typecheck` exited 0, `npm run test:contracts` passed 524/524,
`npm run app:smoke` passed, and `git diff --check` / `git diff --cached --check`
reported no whitespace errors.

At 2026-05-10 13:00 AEST, native Compile preview gained Markdown-blockquote
marker normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now strips line-start `>` quote prefixes before list/link/emphasis/math cleanup,
so quoted provider output no longer appears with raw Markdown markers in the
lightweight native preview.

Latest verification after the native Markdown-blockquote preview slice passed:
the selected Swift test first failed 2 assertions, the skeleton contract first
failed on missing `compilePreviewCleanMarkdownBlockquoteMarker`, then both
turned green. Wider gates passed: full `LoomDraftStoreTests` 62/62,
`npm run typecheck`, and `npm run test:contracts` 524/524.

Post-install verification also passed for the blockquote-marker slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T03:02:36.200Z`. `stat` showed the app bundle and executable at
`2026-05-10 13:02:36 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 13:02 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 13:08 AEST, native Compile preview gained fenced-code marker
normalization for paragraph previews. `SourceFileView.compilePreviewArtifact`
now drops line-start triple-backtick and triple-tilde fence marker lines after
optional blockquote stripping but before list/link/emphasis/math cleanup, so
provider output no longer leaks raw Markdown fence syntax in the lightweight
native preview while keeping code text visible.

Latest verification after the native Markdown fenced-code preview slice passed:
the selected Swift test first failed because raw fence markers leaked into the
paragraph preview, the skeleton contract first failed on missing
`compilePreviewCleanMarkdownCodeFenceMarker`, then both turned green. Wider
gates passed: full `LoomDraftStoreTests` 63/63, `npm run typecheck`, and
`npm run test:contracts` 524/524.

Post-install verification also passed for the fenced-code marker slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T03:08:23.132Z`. `stat` showed the app bundle and executable at
`2026-05-10 13:08:23 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 13:08 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 13:17 AEST, Compile prompts gained an explicit mixed-language
directive in both TypeScript and native Swift prompt paths. The prompt now
adds `Scratch language directive` and selects Chinese or English from the
latest sentence-like scratch segment that contains natural-language CJK or
Latin words. This is static prompt-contract coverage for the plan's
mixed-scratch requirement; it does not replace live provider output review.

Latest verification after the mixed-language prompt slice passed: the new TS
focused test first failed because the prompt did not include
`Latest natural-language scratch segment: Chinese`, and the new Swift focused
test first failed with two missing directive assertions. After implementation,
focused TS and Swift tests passed. Wider gates passed: Compile TS suite 29/29,
full `LoomDraftStoreTests` 64/64, `npm run typecheck`, and
`npm run test:contracts` 525/525. Typecheck initially caught
`lib/new-loom/compile-pipeline.ts(235,10): error TS2532`; after adding the
empty-string fallback, typecheck exited 0 and full contracts were rerun green.

Post-install verification also passed for the mixed-language prompt slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T03:16:45.099Z`. `stat` showed the app bundle and executable at
`2026-05-10 13:16:45 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, started `2026-05-10 08:12:47 AEST`, before the
installed 13:16 binary, so this is installed-bundle verification, not strict
latest-binary UI acceptance.

At 2026-05-10 13:28 AEST, Compile gained a concrete contradictory-thinking
annotation path. TypeScript and Swift prompts now tell providers to mark
contradictions inline as `[user noted both: ...]`. The TypeScript parser now
exposes `contradictionAnnotations` / `contradictionCount`, the web renderer
emits a `loom-compile-contradiction` inline annotation, and the native preview
turns the marker into `Contradictory thinking` instead of a reveal chip. The
native extraction intentionally runs before Markdown-link cleanup because the
link cleaner treats non-link bracket markers as plain text and drops the close
bracket.

Latest verification after the contradiction-annotation slice passed: TS focused
tests first failed on the missing prompt directive and missing
`contradictionCount`; the selected Swift test first failed because
`CompilePreviewArtifact` lacked `contradictionCount`; and the skeleton contract
first failed on missing native contradiction state. After implementation, the
first Swift run exposed the link-cleanup ordering bug; after reordering marker
extraction, focused TS, Swift, and skeleton tests passed. Wider gates passed:
Compile TS suite 30/30, full `LoomDraftStoreTests` 65/65,
`npm run typecheck`, and `npm run test:contracts` 526/526.

Post-install verification also passed for the contradiction-annotation slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T03:27:55.181Z`. `stat` showed the app bundle and executable at
`2026-05-10 13:27:55 +1000`. Computer Use was retried: `list_apps` sees
`Loom - com.yinyiping.loom [running]`, but `get_app_state("Loom")` and
`get_app_state("com.yinyiping.loom")` returned `cgWindowNotFound`. The running
process remains pid `38106`, command
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, started before
the installed 13:27 binary, so this is installed-bundle verification, not
strict latest-binary UI acceptance.

At 2026-05-10 13:39 AEST, web Draft gained parity for attached-reference
detachment. Source tiles and the References list now expose visible `Remove`
controls beside `Open` / `Insert quote`; the action removes the matching
reference from the current Draft and persists through the Draft bridge/browser
fallback without deleting the original capture, source, or file.

Latest verification after the Draft reference-remove slice passed: the focused
skeleton contract first failed on missing `removeDraftReference`; after
implementation it passed 1/1, the selected Draft streaming plus tiling contract
passed 2/2, and full `tests/new-loom-skeleton-contract.test.ts` passed 69/69.
Wider gates passed: `npm run typecheck`, `npm run test:contracts` 526/526, and
`git diff --check` for the edited code/test files.

Post-install verification also passed for the Draft reference-remove slice:
`npm run app:user`, `npm run app:smoke` with bundle id `com.yinyiping.loom`
and 638 static web files, plus `npm run app:where` reporting
`2026-05-10T03:38:58.315Z`. `stat` showed the app bundle and executable at
`2026-05-10 13:38:58 +1000`. Computer Use was retried after install:
`list_apps` sees `Loom - com.yinyiping.loom [running]`, but
`get_app_state("Loom")` and `get_app_state("com.yinyiping.loom")` returned
`cgWindowNotFound`. The running process remains pid `38106`, command
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`, started at
`2026-05-10 08:12:47 AEST`, before the installed 13:38 binary, so this is
installed-bundle verification, not strict latest-binary UI acceptance until the
visible app is explicitly restarted/reopened.

At 2026-05-10 13:55 AEST, Phase 9 The Year moved beyond a static support page
into the first live read-only annual material projection. `lib/new-loom/year-surface.ts`
now builds a tested Year overview from captures, local files, and Question
containers, grouping resolved items into month columns and shared
`active / wintering / archived` buckets. `app/year/YearClient.tsx` hydrates
installed-app captures through `loom://native/captures-list.json` only in native
mode, reads local-file ingestion traces through `useAllTraces`, and subscribes
to pursuit records through `loadPursuitRecords` / `loom-pursuits-updated`. The
surface is read-only; it does not move, hide, archive, delete, or create user
files.

Red/green evidence for the Year live-overview slice: the new wintering-state
test first failed because `lib/new-loom/year-surface.ts` was missing, and the
skeleton contract first failed because `app/year/YearClient.tsx` was missing.
After implementation, focused Year/wintering plus skeleton contracts passed
73/73 and `npm run typecheck` exited 0. Playwright opened
`http://localhost:3000/year` and verified title `The Year · Loom`, 12 month
columns, 3 state buckets (`active`, `wintering`, `archived`), the read-only
warning, and corrected `365 quiet days` copy. The only browser 404s observed
were pre-existing app-shell API probes for `/api/ai-key-status`,
`/api/search-index`, and `/api/knowledge-nav`, not Year-specific data requests.

At 2026-05-10 14:02 AEST, public working mode was extended beyond Source Index
into the two support surfaces that summarize user material. `/year?public=1`
now uses `publicWorkingYearOverview(...)` so annual material preserves month and
wintering counts while masking private capture/file/question labels and hrefs.
`/connections?public=1` now uses `publicWorkingSourceConnections(...)` so source
titles, domains, hrefs, and reader-note anchor ids become generic `Source N` /
`Correspondent N` labels while connection and cross-origin counts remain.

Red/green evidence for this public-support slice: `tests/new-loom-wintering-state.test.ts`
first failed because `publicWorkingYearOverview` was missing,
`tests/new-loom-source-connections.test.ts` first failed because
`publicWorkingSourceConnections` was missing, and
`tests/new-loom-public-working-mode.test.ts` first failed because `/year` and
`/connections` did not read public working mode. After implementation the
focused tests passed 5/5, 3/3, and 4/4; `npm run typecheck` exited 0; and
`npm run test:contracts` passed 530/530. Browser validation seeded temporary
local dev IndexedDB/localStorage data with private file names, question text,
domains, and anchor ids; `/year?public=1` showed `Local file 1` / `Question 1`,
`/connections?public=1` showed `Source 1` / `Source 2` and `Correspondent 1` /
`Correspondent 2`, and none of the private strings appeared. The temporary
browser data was removed afterward.

At 2026-05-10 14:10 AEST, `/connections` was tightened so the support graph
returns to Draft instead of staying read-only. `NewLoomSourceConnectionLink`
now preserves `fromHref` / `toHref`, and `sourceConnectionDraftHref(...)`
builds a `/draft` URL with both connected sources attached as `kind=source`
references plus connection evidence in the excerpts. The visible web surface
shows `Draft this connection` for private working mode only; public working
mode keeps the graph masked and hides the write action. Red/green evidence:
`tests/new-loom-source-connections.test.ts` first failed on missing
`fromHref` / `toHref` and missing `sourceConnectionDraftHref`; the skeleton
contract first failed because `/connections` did not import or render the Draft
handoff. After implementation, focused source-connections passed 4/4 and the
full skeleton contract passed 69/69.

Wider verification for the same 14:10 slice passed: `npm run typecheck`,
`npm run test:contracts` 531/531, and `git diff --check`. Playwright seeded a
temporary localhost trace graph and verified `/connections` shows `Draft this
connection` with a `/draft?...` URL carrying both connected refs; the same
seed under `/connections?public=1` showed the public banner, zero Draft
connection actions, and no private source/domain/anchor leaks. `npm run
app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm
run app:smoke` passed with 638 static web files; `npm run app:where` and
`stat` showed the installed bundle and executable at `2026-05-10 14:14:24
AEST`. Computer Use can read the current visible app window, but it remains
pid `38106`, started `2026-05-10 08:12:47 AEST`, before the new bundle. Treat
this as installed-bundle plus browser verification, not strict latest-binary
installed UI acceptance until the visible app is explicitly restarted.

At 2026-05-10 14:25 AEST, Phase 9 `The Year` gained a concrete Draft handoff
for each annual material item. `yearItemDraftHref(...)` now turns a resolved
capture/local-file/question-container item into a `/draft` URL with one
`ref`, the item label, `kind=capture` or `kind=source`, and a concise excerpt
such as `Year item: Local file · state wintering · month Mar.` The web
`/year` surface renders `Draft this item` beside material items only outside
public working mode; `/year?public=1` keeps masked annual counts visible and
hides the write action.

Red/green evidence: `tests/new-loom-wintering-state.test.ts` first failed with
`TypeError: yearItemDraftHref is not a function`, and
`tests/new-loom-skeleton-contract.test.ts` first failed because `YearClient`
did not import or render the handoff. After implementation, focused
wintering/year tests passed 6/6 and the skeleton contract passed 69/69. Wider
verification passed: `npm run typecheck`, `npm run test:contracts` 532/532,
and `git diff --check`.

Browser validation seeded a temporary localhost IndexedDB ingestion trace for
`Year Private PDF`. `/year` rendered `Draft this item` actions with a
`/draft?...` URL carrying `ref=file:///tmp/year-private.pdf`, `kind=source`,
and `Year item: Local file` evidence; `/year?public=1` rendered zero Draft
item actions, masked the item as `Local file 1`, and did not leak the private
title or file path. `npm run app:user` then rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with 638
static web files; `npm run app:where` reported `2026-05-10T04:25:13.930Z`;
and `stat` showed both the app bundle and executable at `2026-05-10 14:25:13
AEST`. Computer Use read the visible Loom window and confirmed the app is
running as pid `38106`, but that process started at `2026-05-10 08:12:47
AEST`, before this installed bundle. This remains latest-bundle plus browser
verification, not strict latest-binary installed UI acceptance until the
visible app is restarted.

At 2026-05-10 15:35 AEST, Phase 10 `The Hour` gained the same return-to-Draft
discipline for active material. `/hour` now reads native captures, local-file
ingestion traces, and Phase 7 question containers through the shared Year
overview rules, selects the newest active items, and renders
`Draft this current item` only outside public working mode. Public working mode
keeps the current-material section visible with generic labels and no Draft
handoff, so `/hour` can be shown in a public demo without leaking private file
paths or source names.

Red/green evidence: `tests/new-loom-wintering-state.test.ts` first failed on
missing `lib/new-loom/hour-surface`, and the skeleton contract first failed
because `/hour` did not read traces/material or expose a Draft handoff. After
implementation, focused wintering/hour tests passed 7/7 and the skeleton
contract passed 69/69. Wider verification passed: `npm run typecheck`,
`npm run test:contracts` 533/533, and `git diff --check`.

Browser validation seeded a temporary localhost IndexedDB ingestion trace for
`Hour Private PDF`. Private `/hour` showed `Draft this current item` with a
`/draft?...` URL carrying `ref=file:///tmp/hour-private.pdf`, `kind=source`,
`label=Hour Private PDF`, and `Current hour item: Local file` evidence;
`/hour?public=1` showed zero Draft current-item actions, masked the row as
`Local file 1`, and did not leak the private title or file path.

Installed-bundle verification passed: `npm run app:user` rebuilt and installed
`/Users/yinyiping/Applications/Loom.app`; `npm run app:smoke` passed with
bundle id `com.yinyiping.loom` and 639 static web files; `npm run app:where`
reported `2026-05-10T05:32:39.839Z`; `stat` showed the app bundle and
executable at `2026-05-10 15:32:39 AEST`; and the installed resources contain
`web/hour.html` plus `web/hour.txt`. Computer Use still reads the visible Loom
process as pid `38106`, started `2026-05-10 08:12:47 AEST`; attempts to route
that stale process to `loom://bundle/hour` and `loom://bundle/hour.html` left
it on the existing flipdisc snapshot. Treat this slice as latest-bundle plus
browser verification, not strict latest-binary installed UI acceptance until
the visible app is explicitly restarted.

At 2026-05-10 15:45 AEST, public working mode was extended to web Draft
reference surfaces. `/draft?public=1` now keeps the draft title/body intact but
masks attached reference labels and hrefs as `Source reference N`, `Capture
reference N`, `URL reference N`, and `Artifact state reference N`. Public mode
hides the `@ Reference` picker, source-tile open actions, quote insertion,
reference removal, and suggested references so private corpus titles, URLs,
excerpts, timestamps, and artifact-state labels are not exposed in a demo. This
is a presentation shield only; saved draft data remains unchanged.

Red/green evidence: focused Draft storage first failed because
`publicWorkingDraftReferences` was missing, and the skeleton contract first
failed because `DraftClient` did not read public working mode or mask
references. After implementation, `tests/new-loom-draft-storage.test.ts`
passed 29/29 and `tests/new-loom-skeleton-contract.test.ts` passed 70/70.
Wider verification passed: `npm run typecheck`, `npm run test:contracts`
535/535, and `git diff --check`.

Browser validation seeded a temporary localStorage draft with private capture,
local-file, and artifact-state references. Private `/draft` showed
`Private Flipdisc Capture`, `Hour Private PDF`, the private excerpt, three
`Remove reference` buttons, and one `@ Reference` button. Public
`/draft?public=1` showed the generic reference labels, leaked none of the
private labels, file URLs, excerpts, capture timestamps, source titles, or
artifact-state labels, and exposed zero `@ Reference`, remove, insert-quote, or
suggested-reference controls.

Installed-bundle verification followed at 2026-05-10 15:48 AEST:
`npm run app:user` built 103 static pages including `/draft` and installed
`~/Applications/Loom.app`; `npm run app:smoke` passed with bundle id
`com.yinyiping.loom` and 639 static web files; `npm run app:where` reported
`2026-05-10T05:48:13.619Z`; `stat` showed the app bundle and executable at
`2026-05-10 15:48:13 AEST`, and `Contents/Resources/web` contains
`draft.html` plus `draft.txt`. Computer Use still reads the visible Loom
process as pid `38106`, started `2026-05-10 08:12:47 AEST`, and still on the
older flipdisc snapshot. Treat this as latest-bundle plus browser verification,
not strict latest-binary installed UI acceptance until the visible app is
explicitly restarted.

At 2026-05-10 15:58 AEST, the iWork importer fidelity gap was narrowed one
step further. `SlideDeckExtractor` now reads recoverable framed IWA text
payloads before falling back to the broader binary scanner, decodes each frame
as clean UTF-8 or UTF-16LE, preserves original payload order, and reconstructs
Keynote text as `iWork slide reconstruction` / Pages text as
`iWork page reconstruction`. This closes the flat unordered `iWork body text`
behavior for the deterministic body fixtures while keeping generic text-run
fallback for archives without framed payloads.

Red/green evidence: the new selected Swift tests first failed because the
importer emitted flat body text with noisy / reordered mixed-encoding runs.
After implementation, the selected Keynote + Pages reconstruction tests passed
2/2, and full `SlideDeckExtractorTests` passed 16/16 via
`LOOM_SKIP_WEB_STAGE=1 xcodebuild ... -only-testing:LoomTests/SlideDeckExtractorTests
test`. Remaining importer work is still full iWork protobuf/layout
reconstruction, richer visual semantics, and installed-app evidence across more
real user files.

At 2026-05-10 16:10 AEST, installed-app smoke gained an explicit process
freshness boundary. `scripts/installed-app-smoke.mjs` now inspects running
`Loom.app` processes after bundle checks and reports whether the visible
installed process started before the current installed executable, plus whether
any non-installed `Loom.app` process is still running from DerivedData or
another path. The default `npm run app:smoke` still verifies the installed
bundle and prints warnings only; strict acceptance can opt in with
`LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1` and
`LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1`.

Red/green evidence: `tests/loom-app-scripts.test.ts` first failed because
`inspectRunningLoomProcesses` was missing, then passed 31/31. Live local checks
matched the earlier duplicate-icon cleanup: normal `npm run app:smoke` passed
and warned that pid `38106` predates the current installed executable;
`LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm run app:smoke` failed as expected for
that stale installed process; and `LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1 npm run
app:smoke` passed, meaning the extra DerivedData/debug `Loom.app` process is no
longer running. This improves acceptance truth without relaunching or closing
the user's visible Loom window.

At 2026-05-10 16:14 AEST, Computer Use acceptance verified the visible
installed app UI directly. Source Index now reports 4 captures and every Recent
Captures row has an accessible Delete control; opening the first flipdisc
capture shows the detail toolbar with `Delete capture` alongside Print,
Markdown, Edit, Distill, Source snapshot, Open original, and Re-capture. Delete
was not clicked because capture deletion is destructive. Fresh verification
after this UI check passed: focused app-script tests 31/31, `npm run
typecheck`, `npm run test:contracts` 536/536, `git diff --check`, and `git
diff --cached --check`. Normal app smoke passed; strict fresh-process smoke
still fails as expected until the visible installed app is restarted, while
strict single-process smoke passes.

At 2026-05-10 16:24 AEST, Compile/Draft rendering quality was deepened without
touching live user data, relaunching the visible installed app, or making
provider calls. The web Compile renderer now turns Markdown task lists into a
read-only checklist structure instead of exposing raw `[x]` / `[ ]` text in
ordinary unordered lists, while still preserving inline math, reveal markers,
and script escaping. Native Compile preview now keeps task lists, blockquotes,
and fenced code as separate block kinds; task items are normalized to `Done:` /
`Open:` lines, blockquotes use the quote kind, and fenced code preserves the
literal code body.

Red/green evidence: the new task-list TS test first failed on an unordered list
with raw checklist markers, and the new Swift selected test first failed
because `CompilePreviewBlock.Kind` lacked `list`, `quote`, and `code`. After
implementation, focused task-list TS passed 31/31, the selected Swift test
passed 1/1, full Compile TS passed 31/31, full `LoomDraftStoreTests` passed
66/66, `npm run typecheck` passed, and `npm run test:contracts` passed 537/537.
Final hygiene rerun also passed `git diff --check` and `git diff --cached
--check`; a process check after the Xcode run found only the stale installed
pid `38106`, with no DerivedData/debug `Loom.app` process left behind. This has
not yet been rebuilt into the installed app or accepted with Computer Use;
strict latest-binary installed UI acceptance still requires restarting the
visible stale pid `38106`.

At 2026-05-10 16:31 AEST, native Compile preview gained table parity with the
web Compile renderer. Simple Markdown tables now become a distinct `table`
block instead of leaking raw pipe rows and separator lines into paragraph text;
cell content still gets inline math cleanup and reveal extraction. Red/green
evidence: the new selected Swift test first failed because `.table` did not
exist, and the first implementation caught an ambiguous Swift `prefix` call.
After the parser/rendering fix, the selected table test passed 1/1, full
`LoomDraftStoreTests` passed 67/67, `npm run typecheck` passed, and `npm run
test:contracts` passed 537/537. This was not rebuilt into the installed app and
did not relaunch the visible stale pid `38106`.

At 2026-05-10 16:38 AEST, Compile table parsing gained the common no-outer-pipe
Markdown table shape across web and native. Tables such as `Term | Meaning`
plus `--- | ---` now render as real Compile tables instead of paragraphs with
raw separator lines. Before editing, Computer Use re-read the visible installed
flipdisc capture detail and confirmed the `Delete capture` button is
accessible; it was not clicked because deletion is destructive.

Red/green evidence: the new web test first failed because no `<table
class="loom-compile-table">` was emitted, and the new Swift selected test first
failed with `[.heading, .paragraph]` instead of `[.heading, .table]`. After the
parser updates, focused tests passed, full Compile TS passed 32/32, full
`LoomDraftStoreTests` passed 68/68, `npm run typecheck` passed, and `npm run
test:contracts` passed 538/538. A process check still found only the stale
installed pid `38106`, with no DerivedData/debug `Loom.app` process left behind.
This was not rebuilt into the installed app and did not relaunch the visible
stale pid.

At 2026-05-10 16:41 AEST, web Compile rendering also accepted tilde fenced
code blocks (`~~~js`) in addition to backtick fences, matching native preview
behavior. Red/green evidence: the new TypeScript test first failed because
`~~~js` rendered as paragraph text; after the fence parser update, focused
Compile TS passed 33/33, full Compile TS passed 33/33, `npm run typecheck`
passed, and `npm run test:contracts` passed 539/539. This was another
code/test-only slice: no installed-app rebuild, visible-app relaunch,
destructive action, or provider call.

At 2026-05-10 20:57 AEST, the native iWork importer closed a typed-routing gap
for `.pages` packages. `SlideDeckExtractor` already parsed Pages metadata and
IWA body strings, but registry matching scored `.pages` as `0.0`, which sent
representative Pages files to `generic-doc`. Red tests captured both the direct
score failure and the registry fallback; after adding `.pages` to the high-score
iWork match set, focused Swift checks passed, full `SlideDeckExtractorTests`
passed 16/16, full `TypedExtractorMatchTests` passed 7/7, `npm run typecheck`
passed, and `npm run test:contracts` passed 539/539. No real user files,
provider calls, destructive actions, installed-app rebuild, or visible-app
relaunch happened in this slice.

At 2026-05-10 21:02 AEST, native Collect's local-file drop zone was brought in
line with the importer that now exists. The primary copy now lists Markdown,
PDF, DOCX, slides, Pages, and images; the secondary hint names
PPTX/Keynote/Pages metadata/text preservation and image OCR/semantic-label/
visual-provenance handling. The new-Loom contract first failed on the old
`.pptx`-only copy, then passed 70/70 after the Swift UI text and assertions
were updated; a selected Swift `xcodebuild` test rebuilt the native target. No
real files, provider calls, destructive actions, installed-app rebuild, or
visible-app relaunch happened.

At 2026-05-10 21:06 AEST, native Keyboard Help was synchronized with the same
local-file support message. Both `⌘⇧I` shortcut entries now say Collect can
drop or pick PDFs, DOCX, slides, Pages, Markdown, and images. The focused
new-Loom contract first failed on the old shortcut copy, then passed 70/70
after the Swift text update; a selected Swift `xcodebuild` test rebuilt the
native target with only the existing `activateIgnoringOtherApps` deprecation
warnings. No real files, provider calls, destructive actions, installed-app
rebuild, or visible-app relaunch happened.

At 2026-05-10 21:09 AEST, `docs/loom.md` was brought into the same importer
scope. Its top "MISSING / NEXT" summary now lists PDF / PPTX / Keynote / Pages
/ Markdown / text / DOCX / RTF / image, and the Phase 6 Drag-to-import line
names slides, Pages, DOCX, Markdown, and images rather than the old
PDF/PPT/MD shorthand. The new contract assertion first failed on the stale
summary, then passed 70/70 after the doc update and a newline-tolerant regex
fix. No real files, provider calls, destructive actions, installed-app rebuild,
or visible-app relaunch happened.

At 2026-05-10 21:13 AEST, the Plate II local-file support table in
`docs/loom.md` was aligned with the current importer instead of preserving the
old Pandoc placeholder. It now treats `PPTX / Keynote / Pages` as the P0
iWork/native path with page or slide grouping, metadata, IWA body text, and
original-file preservation; `DOCX / RTF / text` are listed separately as text
extraction plus origin metadata. The new contract assertion first failed on the
stale table rows, then passed 70/70 after the doc table update. No real files,
provider calls, destructive actions, installed-app rebuild, or visible-app
relaunch happened. Post-slice gates also passed: `npm run typecheck`,
`npm run test:contracts` 539/539, `git diff --check`, and
`git diff --cached --check`. Process check still found only the stale installed
`/Users/yinyiping/Applications/Loom.app` pid `38106`.

At 2026-05-10 21:18 AEST, the prompt-to-artifact checklist in the completion
audit was made contract-covered and refreshed to the current state. It now names
the latest covered evidence plus the three open product gates: strict
latest-binary installed-app UI acceptance, real user-file installed-app importer
acceptance, and live provider-output Compile/Draft acceptance. The focused
new-Loom contract passed 71/71 after first failing on the stale checklist, then
`npm run typecheck`, `npm run test:contracts` 540/540, `git diff --check`, and
`git diff --cached --check` passed. The visible installed app was not rebuilt or
relaunched; process check still found only stale pid `38106`.

At 2026-05-10 21:22 AEST, `/hour` stopped reviving rested material. The Hour now
draws current material only from the active bucket; if everything is wintering or
archived, it shows the empty current-material state instead of treating old
material as current work. Red/green evidence: the new wintering-state test first
failed because `currentHourItemsFromYearOverview(...)` returned a wintering
question plus archived capture, then passed after the fallback to `overview.items`
was removed. Focused Hour checks passed: `tests/new-loom-wintering-state.test.ts`
8/8 and the `/hour` skeleton contract 71/71. Full gates also passed:
`npm run typecheck`, `npm run test:contracts` 541/541, `git diff --check`, and
`git diff --cached --check`. No installed-app rebuild, visible app relaunch,
real user-file import, provider call, or destructive delete click happened.

At 2026-05-10 21:31 AEST, Computer Use could read the visible installed app
again. It is still the stale installed process pid `38106` on the Flipdisc
Source detail, and the detail exposes `Delete capture` along with Print,
Markdown, Edit, Distill, Source snapshot, Open original, and Re-capture. Delete
was not clicked. Post-Hour verification was rerun: `tests/new-loom-wintering-state.test.ts`
passed 8/8, the focused prompt-to-artifact skeleton contract passed 71/71,
`npm run typecheck` exited 0, and `npm run test:contracts` passed 541/541. This
is latest-source verification plus visible-stale-process observation, not strict
latest-binary UI acceptance.

At 2026-05-10 21:49 AEST, iWork reconstruction was tightened for another real
package shape. Keynote and Pages fixtures now cover standalone `Slide N` /
`Page N` rows followed by separate title/body rows; `SlideDeckExtractor`
preserves those short markers and rebuilds ordered slide/page sections instead
of losing the marker and falling back to flat `iWork body text`. Red evidence
first showed the Keynote fixture flattened `Market design overview`; after the
fix, the two focused tests passed and full `SlideDeckExtractorTests` passed
18/18. Post-slice gates also passed: `npm run typecheck`,
`npm run test:contracts` 541/541, `git diff --check`, and
`git diff --cached --check`.

The duplicate Loom icon report was also checked. The extra app was the generated
DerivedData Debug `Loom.app` left by Xcode tests, not a second installed copy.
It was unregistered and removed; `mdfind` now lists only
`/Users/yinyiping/Applications/Loom.app`, and the process list shows only the
installed pid `38106`. Computer Use reads that same visible installed app. This
did not relaunch the user's visible app and did not click the destructive
`Delete capture` control.

At 2026-05-10 21:58 AEST, the same iWork reconstruction path was tightened for
duplicate standalone plus labeled markers. If IWA rows contain `Slide 1`
followed by `Slide 1: Market design overview`, or `Page 1` followed by `Page
1: Learning loop overview`, the standalone marker is now treated as pending
state and suppressed when the labeled marker arrives. Red evidence first showed
the stray `Slide 1` / `Page 1` lines; after the state-machine fix, the focused
duplicate-marker tests passed and full `SlideDeckExtractorTests` passed 20/20.
Post-slice gates passed: `npm run typecheck`, `npm run test:contracts` 541/541,
`git diff --check`, and `git diff --cached --check`. After the Xcode run, the
generated DerivedData Debug `Loom.app` was unregistered and removed again;
`mdfind` lists only `/Users/yinyiping/Applications/Loom.app`, and Computer Use
reads that same visible installed app. No installed-app rebuild, visible-app
relaunch, real user-file import, provider call, or destructive action happened.

At 2026-05-10 22:04 AEST, production iWork QuickLook lookup was aligned with the
real-file verifier. `SlideDeckExtractor` now accepts both canonical
`QuickLook/Preview.pdf` and nested `.../preview.pdf` entries. Red evidence first
showed `preview-nested.pages` parsing only metadata, with no `iWork QuickLook
preview` section; after widening the entry match, the focused test passed and
full `SlideDeckExtractorTests` passed 21/21. Post-slice gates passed:
`npm run typecheck`, `npm run test:contracts` 541/541, `git diff --check`, and
`git diff --cached --check`. The generated DerivedData Debug app was cleaned
again, leaving only `/Users/yinyiping/Applications/Loom.app` in `mdfind` and
only installed pid `38106` in the process check. This was local parser/test work
only: no installed-app rebuild, visible-app relaunch, real user-file import,
provider call, or destructive action happened.

At 2026-05-10 22:22 AEST, the latest iWork importer work was pulled into the
new-Loom skeleton contract and the user-reported Draft titlebar collision was
addressed in source. The skeleton contract now checks for duplicate
standalone-marker fixtures/tests, nested QuickLook preview fixture/test,
nested `.../preview.pdf` production matching, and the updated local-file
support matrix row naming QuickLook preview text and marker dedupe. Red
evidence first failed on the stale matrix row; after the doc/test update,
`npm run test:contracts -- --test-name-pattern 'native iWork import preserves
Keynote and Pages package metadata'` passed and full `npm run test:contracts`
now reports 542/542.

The Draft screenshot showed a real minimal-mode chrome bug: `LoomDraftView`
mounted as a bare `HSplitView` under the transparent `fullSizeContentView`
titlebar, so narrow windows could put `Untitled draft` under the toolbar.
`LoomMinimalRootView` now applies a 44pt `minimalDetailToolbarClearance` to
the Draft detail pane. Red evidence first failed the new contract `native Draft
leaves top clearance under transparent titlebar chrome`; after the source fix,
that contract passed. Swift build also passed with
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug build -quiet`, with only existing
`activateIgnoringOtherApps` deprecation warnings. The generated DerivedData
Debug app was unregistered and removed afterward, leaving only
`/Users/yinyiping/Applications/Loom.app` registered and only installed pid
`38106` running. This source fix has not been installed or relaunched into the
visible app yet.

At 2026-05-10 22:28 AEST, post-compaction verification was rerun cleanly:
`npm run typecheck` exited 0, full `npm run test:contracts` reports 542/542,
`git diff --check` and `git diff --cached --check` exited 0, and
`LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj
-scheme Loom -configuration Debug build -quiet` exited 0 with only the existing
`activateIgnoringOtherApps` deprecation warnings. Computer Use was able to
reattach after activating the already-running installed app and confirmed the
visible installed Draft window still shows the titlebar overlap: `Untitled
draft` sits under the floating toolbar. Treat this as a stale-installed-binary
finding, not a source failure. The fixed source is built but not installed or
restarted into pid `38106`. The generated DerivedData Debug app was
unregistered and removed afterward; `mdfind` lists only
`/Users/yinyiping/Applications/Loom.app` for bundle id `com.yinyiping.loom`.

At 2026-05-10 22:33 AEST, Compile manual quality acceptance was tightened
without a provider call. `compileManualQualityCases()` now includes a
provider-like exemplar output for each of the five manual review cases, and
`evaluateCompileManualQualityCaseOutput(...)` checks deterministic visible
signals through the normal Compile parser. The new focused test first failed
because the evaluator was missing; after adding exemplar outputs and signal
evaluation, `npx tsx --test tests/new-loom-compile-pipeline.test.ts
--test-name-pattern 'Compile manual quality case exemplars satisfy their
deterministic visible signals'` passed 34/34. Wider gates also passed:
`npx tsx --test tests/new-loom-compile-pipeline.test.ts` 34/34,
`npm run test:contracts` 543/543, `npm run typecheck`, `git diff --check`,
and `git diff --cached --check`. This is local shape coverage only; real AI
output review, product-owner quality acceptance, live provider-request body
acceptance, real user-file UI acceptance, and strict latest-binary installed UI
acceptance remain open.

At 2026-05-10 22:42 AEST, the manual Compile quality cases gained a repeatable
no-provider verifier command. `npm run verify:compile-quality` passed all five
case exemplars; `npx tsx --test tests/new-loom-compile-pipeline.test.ts`
passed 35/35; `npm run test:contracts` passed 544/544; and `npm run
typecheck` exited 0. This is still local shape verification only. The same
approval-bound gates remain open: replace/relaunch the visible installed app
before strict latest-binary UI acceptance, import real user files through the
installed UI, run live provider-output Compile/Draft acceptance, and complete
product-owner quality acceptance.

At 2026-05-10 22:45 AEST, Computer Use re-read the visible installed app
without clicking or typing. It is still `com.yinyiping.loom` pid `38106`, and
the Draft title `Untitled draft` still sits under the floating toolbar in that
running process. The source/test fix for Draft top clearance is not strict
latest-binary UI accepted until the visible installed app is replaced/relaunched
with explicit approval.

At 2026-05-10 22:50 AEST, Draft inline `@reference` resolution gained a safe
source-grounding slice. `@flipdisc` now resolves to an already attached
`Flipdisc Display Build and Software Guide` reference when that short alias is
unique; ambiguous short aliases such as `@econ` across multiple ECON sources
stay unattached instead of choosing one. Sentence-ending punctuation is also
trimmed from inline-reference targets, so `@econ.` is parsed as `@econ`. The
focused test first failed with `source=unattached` for `@flipdisc`; after the
resolver change, `npx tsx --test tests/new-loom-draft-storage.test.ts
--test-name-pattern 'Draft inline @references resolve short source aliases
only when unambiguous'` passed 30/30.

At 2026-05-10 22:54 AEST, the same unique short-alias rule was extended to
selected corpus hits. `@flipdisc` can now resolve to a corpus-supplied
`Flipdisc Display Build and Software Guide`, while multiple ECON corpus hits
keep `@econ` unattached. The focused corpus-alias test first failed with
`source=unattached`; after the resolver change, `npx tsx --test
tests/new-loom-draft-storage.test.ts --test-name-pattern 'Draft inline
@references resolve short corpus aliases only when unambiguous'` passed 31/31.

At 2026-05-10 23:09 AEST, Draft references stopped dropping corpus location
metadata. Web `draftReferenceFromCorpusDoc`, reference de-duplication,
metadata-change detection, attached-reference prompt lines, and alias matching
now preserve `category` and `sourcePath`; native `LoomDraftReference`,
JSON/Markdown sidecars, `LoomDraftAIPrompt`, native inline edit prompts, and
`AskAIDocRef` insertion mirror the same fields. Red/green evidence: the web
test first failed because `category/sourcePath` were omitted; the native
focused test first failed because the structs had no fields. After the fix,
`npx tsx --test tests/new-loom-draft-storage.test.ts` passed 32/32, focused
`LoomDraftStoreTests` passed 4/4, full `LoomDraftStoreTests` passed 70/70,
`npm run test:contracts` passed 547/547, and `npm run typecheck` exited 0.
Computer Use could list the running `Loom — com.yinyiping.loom`, but
`get_app_state` returned `cgWindowNotFound`, so there is no fresh installed
window tree for this slice. Read-only process checks still show pid `38106`
from `/Users/yinyiping/Applications/Loom.app`, launched 2026-05-10 08:12:47.
The Xcode test-created DerivedData Debug app was unregistered and removed;
`mdfind` again lists only the user installed app for bundle id
`com.yinyiping.loom`.

At 2026-05-10 23:25 AEST, native Draft prompt resolution was brought into
parity with the web short-alias rule. `LoomDraftInlineReferenceParser` now
first exact-matches attached references and corpus hits, then accepts only a
unique scored alias such as `@flipdisc`; ambiguous aliases such as `@econ`
stay unattached. Native inline-reference target parsing also strips
sentence-ending punctuation, so `@econ.` is parsed as `@econ`. The focused
native alias tests first failed with `source=unattached` for `@flipdisc`;
after the fix, the focused `xcodebuild` run passed 2/2 and full
`LoomDraftStoreTests` passed 72/72. After each Xcode run, the generated
DerivedData Debug `Loom.app` was unregistered and deleted. `mdfind` now lists
only `/Users/yinyiping/Applications/Loom.app` for bundle id
`com.yinyiping.loom`, and `pgrep -fl Loom` shows only installed pid `38106`.
Computer Use then read `com.yinyiping.loom` at pid `38106`, and `list_apps`
showed a single running `Loom — com.yinyiping.loom`. The installed app was not
replaced or relaunched.

At 2026-05-10 23:37 AEST, ThinkingDraft block operations gained the same
review-before-apply shape as inline edit. Web `draftBlockOperationDiffHunks`
and native `LoomThinkingDraft.operationDiffHunks` build removed / added /
unchanged hunks from the selected contiguous blocks plus the pending
replacement, and both web/native Draft render a `Block operation diff preview`
before the user clicks Apply. Red/green evidence: focused web storage first
failed on the missing helper, focused native first failed on the missing
`operationDiffHunks`, and the skeleton contract first failed on the missing
export. After implementation, focused web storage passed 33/33, focused
skeleton passed 72/72, focused native passed 1/1, full web storage passed
33/33, full skeleton passed 72/72, and full `LoomDraftStoreTests` passed
73/73. This slice was not installed or relaunched into the visible app.

At 2026-05-10 23:48 AEST, Compile prompt grounding was hardened in both the web
pipeline and native Swift prompt path. `buildCompilePrompt(...)` and
`LoomCompilePipeline.buildPrompt(...)` now explicitly forbid providers from
adding information the user did not write and require claims not grounded in
scratch, source, notes, or attached references to be marked `(unsupported)`.
Red/green evidence: the focused web Compile test first failed on the missing
`Do NOT add information the user did not write` prompt text, and the focused
native Compile prompt test first failed with two assertion failures for the
missing boundary rules. After implementation, focused web Compile passed 35/35,
focused native Compile passed 1/1, full `tests/new-loom-compile-pipeline.test.ts`
passed 35/35, and full `LoomDraftStoreTests` passed 73/73. This is still
no-provider source/test acceptance; live provider-output Compile/Draft
acceptance and strict latest-binary installed-app UI acceptance remain open.
Wider gates also passed: `npm run test:contracts` 548/548, `npm run typecheck`,
and `git diff --check && git diff --cached --check`. After the Xcode-generated
Debug `Loom.app` was removed again, `mdfind` listed only the user-installed app,
`pgrep -fl Loom` showed only installed pid `38106`, and Computer Use saw a
single running `Loom — com.yinyiping.loom`.

At 2026-05-10 23:56 AEST, Phase 7 question-container detail gained resolved
attachment context. Native pursuit payloads now include source excerpts from
trace summaries plus panel `sourceTitle` / `sourceHref` context, and
`PursuitDetailClient` renders that secondary context below attached source and
reader-note rows instead of leaving detail attachments as title-only links.
Red/green evidence: the new pursuit-detail contract first failed on missing
`excerpt`, `sourceTitle`, and `sourceHref` fields. After implementation,
`tests/pursuit-detail-contract.test.ts` passed 5/5, focused
pursuit/source/skeleton contracts passed 104/104, and
`LOOM_SKIP_WEB_STAGE=1 xcodebuild ... build` succeeded. This is not installed
row acceptance; real question-container UI acceptance still needs an existing
row or explicit approval to create temporary user data.
Wider gates passed: `npm run test:contracts` 549/549, `npm run typecheck`, and
`git diff --check && git diff --cached --check`. The generated Debug app was
unregistered/removed again; `mdfind` lists only the installed app, `pgrep -fl
Loom` shows only installed pid `38106`, and Computer Use sees one running
`Loom — com.yinyiping.loom`.

At 2026-05-11 00:02 AEST, question-container detail gained a direct Draft
return path. `PursuitDetailClient` now renders `Draft this question`, building a
`/draft?ref=...` URL with the question as the source label and the current
question notes as the reference excerpt. When `containerPath` is present, the
reference href is `loom://content/<containerPath>/Loom.md`, so native Draft can
open the durable question-container file instead of a dead title-only citation.
Red/green evidence: the new pursuit-detail contract first failed on missing
`pursuitDraftHref(...)`, `loom://content` reference construction, and the visible
Draft action. After implementation, `tests/pursuit-detail-contract.test.ts`
passed 6/6, focused pursuit/source/skeleton contracts passed 105/105, and
`npm run typecheck` passed. This was not installed row acceptance.

At 2026-05-11 00:08 AEST, strict latest-binary installed-app acceptance was
refreshed. `npm run app:user` completed a fresh static export, Release Xcode
build, and install to `~/Applications`. The previously running installed app
pid `38106` was quit, the app was reopened, and `pgrep -fl Loom` showed only
pid `4237` running from
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`; the installed
executable mtime was `May 11 00:08:05 2026`. Strict smoke passed with
`LOOM_SMOKE_REQUIRE_SINGLE_PROCESS=1 LOOM_SMOKE_REQUIRE_FRESH_PROCESS=1 npm run
app:smoke`, reporting bundle id `com.yinyiping.loom` and `639` static web
files. Computer Use then read the actual `com.yinyiping.loom` window at pid
`4237` and showed Source Index with Recent Captures Delete buttons plus the
local-file and question-container sections.

At 2026-05-11 00:11 AEST, the real-file importer primitive gate was refreshed
with `npm run verify:real-files-importer` against
`/Users/yinyiping/Desktop/Knowledge System/UNSW`. It passed with coverage of
391 PDFs, 2827 images, 14 attributed documents, 1 deck, and 0 iWork packages;
sample output included three PDFs at 4000 chars with page ranges, image OCR /
Vision labels, one DOCX at 3904 chars, and one PPTX at 43757 chars across 43
slides. Installed-app UI was checked non-destructively: Computer Use opened
Collect, verified `Add files`, clicked it, and saw the native `Add files to
Loom` open panel with `Add` disabled until a file is selected. No real user file
was selected or imported, so installed-app importer acceptance remains open.
After restarting to recover the open-panel AX session, strict app smoke still
passed and Computer Use read `com.yinyiping.loom` at pid `5319`.

At 2026-05-11 06:23 AEST, the full product verifier completed with exit code
0. The run passed `verify:new-loom-audit`, `verify:approval-gates-ready`,
`typecheck`, `test:contracts` 562/562, compile quality and provider-stub gates,
capture export and captures landing gates, build/smoke, project tracking,
extension staging, `app:user`, `app:smoke`, strict installed Draft chrome, and
final generated cleanup. The installed Draft chrome gate passed against
`/Users/yinyiping/Applications/Loom.app` pid `39945`, window `36200`, with
`sidebarTopPt: 80.8` and `detailTopPt: 74.3`; the kept screenshot
`loom-installed-draft-chrome-42484.png` is `2936x1910`. The final
`clean:generated` removed `loom-build-trash` via the hardened cleanup path.
`npm run verify:new-loom-audit` and `npm run verify:approval-gates-ready` still
report exactly two open approval-bound gates: real user-file installed-app
importer acceptance and live provider-output Compile/Draft acceptance.

At 2026-05-11 06:54 AEST, the Draft chrome fullscreen follow-up added an
explicit AppKit fullscreen eligibility contract. `WindowConfigurator` and the
fallback main window both now insert `.fullScreenPrimary` into
`window.collectionBehavior`; the new skeleton contract failed before the Swift
fix and passed after it. Computer Use still could not attach to Loom in this
session (`get_app_state` returned `cgWindowNotFound`, and AX reported zero Loom
windows), so installed-app visual acceptance used the existing CGWindow strict
gate. Focused installed evidence passed against pid `78181`, window `36409`,
with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`; the kept screenshot
`loom-installed-draft-chrome-78155.png` is `2936x1910`. A fresh full
`npm run verify:product` then completed with exit code 0; its final strict
Draft chrome gate passed against installed pid `86664`, window `36551`, with
`sidebarTopPt: 80.8` and `detailTopPt: 74.3`, followed by generated cleanup.

At 2026-05-11 07:08 AEST, the flipdisc visual-label cleanup tightened the Atlas
extension direct canvas fallback. Root cause: the async element-screenshot path
already used `elementScreenshotAlt(...)`, but the direct canvas JPEG fallback
hard-coded generic alt text like `${kind} capture`. The direct branch now uses
the shared semantic alt helper before writing the generated `<img>`.
Red/green evidence: the new capture-media contract first failed on the hard-coded
alt string; after the content-script fix,
`npx tsx --test tests/capture-media-contract.test.ts --test-name-pattern
"direct canvas fallback keeps semantic screenshot alt text"` passed with the
full file reporting 49/49 passing. `npm run app:stage-extension` refreshed the
Atlas extension staging directory and the staged/source content-script SHA
matched
`b26bcdd131e2f8626dbb55955de297c97e0dcbdc3a1612f916093dd4736718ad`. A fresh
`npm run verify:flipdisc-live-handoff` then passed against `https://flipdisc.io/`
using that staged SHA, with `bodyHasFlatFrameLine: false`, 70 blocks, 31 media
nodes, 9 interactive artifacts, `segmentDiagramCount: 1`, 3 animated canvases,
3 source islands, no unresolved media references, and a nested handoff-fixture
verifier returning `ok: true` with no warnings or errors. The two approval-bound
gates remain real user-file installed-app importer acceptance and live
provider-output Compile/Draft acceptance.

At 2026-05-11 07:14 AEST, the flipdisc live verifier's headless-canary noise was
reduced without hiding real product diagnostics. Root cause: the verifier's own
runtime stub intentionally returns `captureVisibleTab disabled in headless live
canary`, and the content script correctly degrades from visible-tab screenshots
to serializer fallbacks; the verifier was still printing that expected canary
limitation as a normal warning. `scripts/verify-flipdisc-live-extension.mjs`
now filters diagnostics containing that canary marker plus the downstream
tainted-canvas serializer warnings that only happen because visible-tab capture
is disabled in the headless stub, and reports `expectedDiagnosticsSuppressed`
for auditability. Red/green evidence: the new
capture-handoff verifier contract first failed on the missing suppression
helpers; after the script change,
`npx tsx --test tests/capture-handoff-verifier.test.ts --test-name-pattern
"live flipdisc verifier suppresses expected headless visible-tab fallback
diagnostics"` passed with 6/6 tests in the file. Fresh
`npm run verify:flipdisc-live-handoff` then passed against `https://flipdisc.io/`
using staged content script SHA
`b26bcdd131e2f8626dbb55955de297c97e0dcbdc3a1612f916093dd4736718ad`; the report
kept `bodyHasFlatFrameLine: false`, 70 blocks, 31 media nodes, 9 interactive
artifacts, `segmentDiagramCount: 1`, 3 animated canvases, 3 source islands, no
unresolved media references, a handoff fixture verifier `ok: true` with no
warnings/errors, and `expectedDiagnosticsSuppressed: 4`. The two approval-bound
gates remain unchanged.

At 2026-05-11 07:20 AEST, the new-Loom completion audit verifier was tightened
against stale Draft chrome evidence. The checklist and
`scripts/verify-new-loom-completion-audit.mjs` now require the later fullscreen
eligibility evidence (`.fullScreenPrimary` in `window.collectionBehavior`), the
focused fullscreen screenshot `loom-installed-draft-chrome-78155.png`, and the
final `npm run verify:product` installed Draft chrome gate at pid `86664`,
window `36551`, with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`. Red/green
evidence: the focused skeleton/app-scripts test run first failed because the
verifier still expected the older pid `39945`; after the verifier and checklist
refresh, `npx tsx --test tests/new-loom-skeleton-contract.test.ts
tests/loom-app-scripts.test.ts --test-name-pattern "prompt-to-artifact
completion checklist names current evidence|new Loom completion audit verifier
keeps approval-bound gates explicit"` passed with 113/113 tests in those files.
The two approval-bound gates remain unchanged.

At 2026-05-11 07:37 AEST, a fresh full `npm run verify:product` was run after
the 07:20 verifier/docs update and before this current-evidence refresh. It
passed all non-approval gates: status buckets, completion audit,
approval-gate readiness, typecheck, contract tests, compile quality, provider
stubs, capture interactive export, captures landing, production build, smoke,
`git diff --check`, project tracking, extension staging, installed app
build/install, installed app smoke, strict installed Draft chrome, and generated
cleanup. The final installed Draft chrome gate auto-relaunched the stale
installed process and passed against pid `57628`, window `36571`, with
`sidebarTopPt: 80.8` and `detailTopPt: 74.3`, superseding the earlier pid
`86664` / window `36551` evidence; the completion-audit verifier and focused
tests were then refreshed to require the new pid/window pair. Computer Use was
retried after reinstall but still returned `cgWindowNotFound`, while System
Events reported zero accessible Loom windows; current visual acceptance
therefore rests on the CGWindow-backed strict verifier rather than AX tree
inspection. The two approval-bound gates remain real user-file installed-app
importer acceptance and live provider-output Compile/Draft acceptance.

At 2026-05-11 07:56 AEST, the user-reported Draft fullscreen/windowed chrome
bug was hardened again. Root cause: the fallback main window already cleared
`window.toolbar = nil`, but the normal scene-managed `Window("Loom")` path only
relied on `.windowStyle(.hiddenTitleBar)`, so macOS could still expose system
toolbar/titlebar glyphs above Draft in some window states. `WindowConfigurator`
now has a minimal-mode opt-in `removesSystemToolbar` flag, and
`LoomMinimalRootView` passes `removesSystemToolbar: true`. The installed Draft
chrome verifier now scans the left, detail, and center titlebar regions, so it
rejects both sidebar-toggle/back-control glyphs and a centered system "Loom"
title. Red/green evidence: focused `tests/loom-app-scripts.test.ts` and
`tests/new-loom-skeleton-contract.test.ts` first failed on the missing verifier
fields and missing `removesSystemToolbar`; after the fix they passed. `npm run
typecheck`, `git diff --check`, `npm run app:user`, `npm run app:smoke`, and
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
then passed against the freshly installed app. The strict verifier
auto-relaunched stale pid `57628` and passed against pid `77899`, window
`36583`, with `sidebarTopPt: 80.8` and `detailTopPt: 74.3`; the kept screenshot
is `loom-installed-draft-chrome-77856.png` at `2936x1910`.

At 2026-05-11 08:10 AEST, Draft ThinkingDraft block references gained explicit
`@reference` token grounding. Previously block `referenceHrefs` only matched
attached-reference labels/excerpts, so a block that intentionally cited
`@flipdisc-tutorial` could look unreferenced. Web `draftBlocksFromBody(...)`
now matches generated mention tokens with a token-boundary helper, and native
`LoomThinkingDraft` mirrors that regex boundary so base source tokens do not
mistakenly match longer artifact-state tokens such as
`@flipdisc-tutorial#frame-format:state`. Red/green evidence: the new web and
Swift tests first failed with empty block references, then the first fix exposed
the prefix false positive, and after the boundary fix
`npx tsx --test tests/new-loom-draft-storage.test.ts` passed 35/35,
`xcodebuild ... -only-testing:LoomTests/LoomDraftStoreTests test` passed 74/74,
and `npm run typecheck` exited 0. The current checkout was then reinstalled with
`npm run app:user`; `npm run app:smoke` passed with 639 static web files, and
strict `LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run
verify:installed-draft-chrome` auto-relaunched the stale installed process and
passed against pid `4201`, window `36718`, with `sidebarTopPt: 80.8` and
`detailTopPt: 74.3`; the kept screenshot is
`loom-installed-draft-chrome-4153.png`. Computer Use was retried: `list_apps`
saw Loom running, but `get_app_state(app: "com.yinyiping.loom")` returned
`connectionInvalid` during relaunch and then `cgWindowNotFound`, so AX-tree
installed-app inspection remains blocked in this session.

At 2026-05-11 08:45 AEST, the user-reported Draft fullscreen chrome bug was
hardened at the window configurator layer. `WindowConfigurator` now has a
coordinator that observes `NSWindow.didEnterFullScreenNotification` and
`NSWindow.didExitFullScreenNotification`, then reapplies the hidden-titlebar /
nil-toolbar contract after fullscreen transitions. This is specifically for
the case where macOS re-exposes top chrome after the initial delayed cleanup.
The same slice made Draft structure panels show concrete block reference labels
instead of only `N refs`: web uses `draftBlockReferenceLabels(...)`, native uses
`LoomThinkingDraft.referenceLabels(for:references:)`, and the UI renders
`Refs: ...` lines such as `15 · Multimodal` or `Frame Format · artifact state`.
Evidence: focused red/green tests passed, full `LoomDraftStoreTests` passed
75/75, `npm run typecheck` exited 0, focused `git diff --check` exited 0,
`npm run app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`,
`npm run app:smoke` passed with 639 static web files, and strict
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
auto-relaunched stale pid `4201` and passed against pid `27662`, window
`36859`, with `sidebarTopPt: 73.8` and `detailTopPt: 67.3`; kept screenshot:
`loom-installed-draft-chrome-27600.png` at `2936x1910`. Computer Use was
retried after reinstall and still returned `cgWindowNotFound`, so current
installed visual acceptance remains CGWindow-backed. The two approval-bound
gates remain unchanged.

At 2026-05-11 08:55 AEST, a fresh full `npm run verify:product` was rerun after
the Draft fullscreen hardening. The first attempt exposed one stale source
contract in `tests/night-chrome-theme.test.ts`: it still expected the old
`WindowConfigurator` argument list and did not include the new
`removesSystemToolbar: true` contract. After that focused assertion was updated,
`npx tsx --test tests/night-chrome-theme.test.ts` passed 2/2 and the full
`npm run verify:product` completed with exit code 0. The run covered completion
audit, approval-gate readiness, typecheck, full contracts, compile quality,
web/native provider stubs, capture interactive export, captures landing,
production build/smoke, `git diff --check`, macOS project tracking, extension
staging, Release build/install, installed app smoke, strict installed Draft
chrome, and generated cleanup. The final installed Draft chrome gate passed
against pid `37980`, window `36871`, with `sidebarTopPt: 73.8` and
`detailTopPt: 67.3`; installed app smoke reported bundle id
`com.yinyiping.loom` and 639 static web files. The completion-audit verifier was
then hardened to require pid/window/top/screenshot evidence without binding to
one transient pid/window value. The two approval-bound gates remain unchanged.

At 2026-05-11 09:06 AEST, the allowed noninteractive real-file importer check
was refreshed. The first `npm run verify:real-files-importer` run exposed a
verifier-harness robustness bug: one sampled `.pptx` unzip failure raised a
top-level Swift fatal error and blocked the whole corpus check. The Node
manifest now samples up to five deck/iWork candidates, and the Swift verifier
records skipped deck/iWork evidence while trying the next candidate. The focused
new-Loom skeleton contract passed 78/78 after the change, and
`npm run verify:real-files-importer` then passed against
`/Users/yinyiping/Desktop/Knowledge System/UNSW`: coverage `pdfs=391`,
`images=2827`, `attributedDocuments=14`, `decks=1`, `iwork=0`; evidence covered
3 PDFs, 3 images, one DOCX, and `FINS3616 Week 2_Updated.pptx` with 43757 chars
across 43 slides. This is still noninteractive importer evidence only; the
installed-app UI import gate remains approval-bound.

At 2026-05-11 09:08 AEST, Computer Use was retried against the installed Loom
process and still returned `Apple event error -10005: cgWindowNotFound`.
System checks show this is the same locked-session blocker, not a new Loom UI
failure: `CGSessionScreenIsLocked=Yes`, System Events reports 0 Loom windows,
and pid `37980` is running from
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom`. Do not count this
as installed-app UI import acceptance; rerun only after user approval and an
unlocked CUA session.

At 2026-05-11 09:26 AEST, the Draft chrome verifier was tightened for the
remaining user-visible overlap class. A kept installed screenshot showed that
the previous gate could pass while residual standard macOS toolbar/sidebar
glyphs were still not represented in `evaluateDraftChromeScan(...)`.
`WindowConfigurator` now hides `standardWindowButton(.toolbarButton)` whenever it
removes the system toolbar, and the fallback main-window path applies the same
rule. `scripts/verify-installed-draft-chrome.mjs` now scans
`sidebarToggleSafeX0` / `sidebarToggleGlyphTopPt` and fails if that standard
glyph remains. Evidence: the focused chrome tests passed 38/38; `npm run
app:user` rebuilt and installed `/Users/yinyiping/Applications/Loom.app`; `npm
run app:smoke` passed with 639 static web files; strict
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
auto-relaunched stale pid `37980` and passed against pid `89972`, window
`36886`, with `sidebarTopPt: 73.8` and `detailTopPt: 67.3`; kept screenshot:
`loom-installed-draft-chrome-89916.png`. Computer Use was retried and is still
blocked by the locked-session condition (`CGSessionScreenIsLocked=Yes`,
`cgWindowNotFound`, System Events 0 Loom windows), so this slice's installed
visual acceptance is CGWindow-backed rather than AX-tree-backed.

At 2026-05-11 10:20 AEST, the final Draft chrome fix was run through the full
non-approval product gate. The AppKit fix now hides
`standardWindowButton(.toolbarButton)` on both scene-managed and fallback main
windows whenever Loom removes the system toolbar, and
`scripts/verify-installed-draft-chrome.mjs` now fails if the residual standard
macOS sidebar-toggle glyph appears in the left titlebar region. The full
`npm run verify:product` completed with exit code 0 after also hardening the
release tooling around FileProvider-prone build paths: static export publishes
with in-place `rsync --delete`, native provider-stub tests run Xcode from a
temporary rsynced workspace, and normal production builds use
`.next-build-current` instead of the corrupted historical `.next-build`
output tree. The final installed Draft chrome gate passed against pid `69380`,
window `36905`, with `sidebarTopPt: 73.8` and `detailTopPt: 67.3`; installed
app smoke reported bundle id `com.yinyiping.loom` and 639 static web files.
Post-gate `git diff --check` and `npm run verify:new-loom-audit` passed, with
the same two approval-bound gates still open.

Computer Use was retried after the final install. `list_apps` sees
`Loom - com.yinyiping.loom` running, but `get_app_state` for both the bundle id
and app name still returns `Apple event error -10005: cgWindowNotFound`.
System checks confirm this is the locked-session blocker:
`IOConsoleLocked=Yes`, `CGSessionScreenIsLocked=Yes`, System Events reports 0
Loom windows, and the installed process is
`/Users/yinyiping/Applications/Loom.app/Contents/MacOS/Loom` at pid `69380`.
Do not count this as failed Draft chrome acceptance; rerun CUA only after the
Mac session is unlocked. Do not run the real file-import UI gate or real
provider-output gate without fresh user approval.

At 2026-05-12 05:43-06:00 AEST, the latest compact-sidebar polish narrowed the
native shell left rail to `minimalSidebarWidth: 136`, tightened rows to
`sidebarRowHeight: 24`, moved the left rail onto explicit small system chrome
typography, and kept Collect / Organize / Draft actions in the shared root
toolbar. Current non-approval evidence passed: focused shell/script contracts
118/118, full `npm run test:contracts` 572/572, `npm run typecheck`, `npm run
build`, `npm run smoke`, `npm run verify:new-loom-audit`, `npm run
verify:approval-gates-ready`, `npm run verify:fixture-files-importer`, `npm run
verify:compile-quality`, `npm run verify:compile-provider-stub`, `npm run
verify:native-provider-stub`, `npm run app:check-project -- --require-tracked`,
`npm run app:stage-extension`, `npm run app:smoke`, `git diff --check`, and
`git diff --cached --check`. The visible installed app process is still stale
relative to the latest installed bundle, and
`npm run verify:installed-draft-chrome` cannot run because the macOS console is
locked (`IOConsoleLocked=Yes`).
Do not treat the latest compact-sidebar visual shell as accepted until the Mac
is unlocked, Loom is relaunched, and
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
passes.

At 2026-05-12 08:15 AEST, `npm run verify:native-provider-stub` was rerun after
the compact-sidebar redesign and passed. The Xcode run executed
`CustomEndpointClientTests` 11/11 with 0 failures against the local provider
stub, covering OpenAI-compatible request bodies and SSE parsing without making
a real provider call. The compact-sidebar contract was also tightened so the
left slice of `rootChrome` cannot regain page/folder/action buttons; focused
evidence passed 82/82 for the `minimal sidebar participates` contract. The
console remains locked (`IOConsoleLocked=Yes`), so Computer Use / real visible
installed-app acceptance is still blocked; rerun the strict installed Draft
chrome verifier and inspect Collect / Organize / Draft only after the desktop
is unlocked and Loom is relaunched.

At 2026-05-12 08:51 AEST, the desktop was unlocked and the installed-app visual
gate was rerun on the current compact root-shell build. `npm run app:smoke`
passed for `/Users/yinyiping/Applications/Loom.app`, bundle id
`com.yinyiping.loom`, with 639 static web files. Strict
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
auto-relaunched the stale installed process and passed against pid `14460`,
window `52148`, keeping screenshots for Collect, Organize, and Draft. The
measured top positions are consistent across the three primary pages:
Collect `sidebarTopPt=45.5` / `detailTopPt=43.5`, Organize
`sidebarTopPt=45.5` / `detailTopPt=44.0`, Draft `sidebarTopPt=45.5` /
`detailTopPt=43.5`.

Computer Use then inspected the live installed app. Draft shows toolbar actions
`Reference`, `AI`, `Save`, and `Capture`; Collect shows `Add files` and
`Capture`; Organize shows `Add Folder`, `Add Question`, and `Capture`. The left
sidebar is now only Collect / Organize / Draft plus folders, with no Page /
Folder tool section or hidden sidebar action strip. Opening the Flipdisc capture
reader from Organize showed `Source Index` as a native toolbar button and no
second web-content Source Index row. Keep the remaining distinction clear:
side-navigation / chrome layout is visually accepted in the installed app, but
real user-file UI import and live provider-output Compile/Draft are still
approval-bound gates; Flipdisc opening-animation completeness is a separate
capture-quality follow-up.

At 2026-05-12 09:30 AEST, the shell was tightened again after side-navigation
feedback that the toolbar and rail still felt too wide. `LoomMinimalRootView`
now uses `rootToolbarHeight: 28`, `minimalSidebarWidth: 136`,
`primarySurfaceTopInset: 8`, `sidebarRowHeight: 24`,
`sidebarIconSlotWidth: 14`, `rootChromeHorizontalInset: 8`, and
`chromeButtonSize: 24`. The left toolbar slice remains a quiet blank rail
field; page actions still live only in the active toolbar. Focused source
contracts were updated before installed-app verification.

At 2026-05-12 09:49 AEST, the tightened shell was verified on the real
installed `/Users/yinyiping/Applications/Loom.app`. Strict
`LOOM_DRAFT_CHROME_KEEP_SCREENSHOT=1 npm run verify:installed-draft-chrome`
passed against installed pid `23388`, window `52787`, with kept screenshots
`loom-installed-draft-chrome-collect-23862.png`,
`loom-installed-draft-chrome-organize-23862.png`, and
`loom-installed-draft-chrome-draft-23862.png`. Computer Use inspected the live
app on Draft, Collect, and Organize: the left rail is only Collect / Organize /
Draft plus folders; active page actions live in the root toolbar (`Reference`,
`AI`, `Save`, `Add files`, `Add Folder`, `Add Question`, and `Capture` by
surface). Fresh post-install gates passed: `npm run verify:new-loom-audit`,
`npm run verify:approval-gates-ready`, focused shell/script contracts 118/118,
and `git diff --check`. The only remaining explicit approval-bound gates are
real user-file installed-app importer acceptance and live provider-output
Compile/Draft acceptance.

At 2026-05-12 10:21 AEST, the safe flipdisc capture-quality follow-up was
converted into a strict gate. `scripts/verify-flipdisc-live-extension.mjs` now
requires the live `https://flipdisc.io/` payload to keep the opening canvas as
a replay video at the start of the saved body, include a video media
attachment, expose an `animated-canvas` replay artifact, and still preserve the
frame format as a segment diagram. `scripts/verify-capture-handoff.mjs` now has
`--require-animated-canvas-replay` so the saved fixture must keep that replay
after media sidecar substitution. Evidence passed:
`npx tsx --test tests/capture-handoff-verifier.test.ts
tests/capture-interactive-artifacts.test.ts tests/capture-media-contract.test.ts`
passed 65/65, and `node scripts/verify-flipdisc-live-extension.mjs
--verify-handoff-fixture --write-payload-json
/tmp/loom-flipdisc-live-payload.json` passed with
`bodyStartsWithCanvasReplay=true`, `animatedCanvasReplayCount=1`,
`mediaAttachmentVideoCount=1`, strict fixture
`animatedCanvas.replayCount=1`, no unresolved media references, and no
warnings.

At 2026-05-12 10:31 AEST, the installed app was rechecked after the verifier
changes. Computer Use inspected Collect, Draft, and Organize on installed pid
`23388`, and `npm run verify:installed-draft-chrome` passed against window
`52787` with aligned starts: Collect `sidebarTopPt=44.5` /
`detailTopPt=43.5`, Organize `sidebarTopPt=44.5` / `detailTopPt=44.0`, Draft
`sidebarTopPt=44.5` / `detailTopPt=43.5`.

At 2026-05-12 11:29 AEST, the shell/inspector layout was rewritten more
decisively after the sidebar and Draft right-rail feedback. The root shell is
now an independent left navigation rail plus a detail-side
`rootChrome`/hairline/content stack; the detail toolbar no longer reserves a
fake left sidebar slice. Draft's right rail is a 300pt compact inspector:
Structure, Sources, References, Suggested, Provenance, and Board are compact
sections; source/reference delete actions are icon buttons with explicit
accessibility labels; Board actions are compact `Card` / `Link` controls.
Evidence: focused shell/script contracts passed 118/118; `npm run app:user`
rebuilt and installed `~/Applications/Loom.app`; `npm run app:smoke` passed
for bundle id `com.yinyiping.loom` with 639 static web files; and
`npm run verify:installed-draft-chrome` passed on installed pid `31851`,
window `53495` with Collect `32.0/41.0`, Organize `44.0/44.0`, and Draft
`44.0/43.5` sidebar/detail top measurements. Computer Use inspected Collect,
Organize, and Draft after install: page actions are in the root toolbar and
the sidebar is navigation plus folders only.

At 2026-05-12 14:00 AEST, Draft's right inspector was split into segmented
`Context`, `Blocks`, and `Board` modes. The default rail is now context-only:
Sources, References, Suggested, and Provenance. Block structure/editing and
draft-board actions are available through their own compact modes instead of
being stacked below the context list. Focused shell/script contracts passed
119/119, and a direct Release Xcode build passed after aligning the segmented
control with the existing `DSRadius.sm` token.

At 2026-05-12 14:24 AEST, the installed app was rebuilt, relaunched, and
checked with Computer Use at pid `63387`. Collect, Organize, and Draft now use
the same compact shell: left navigation/folders only, root-toolbar actions, and
main content directly below the toolbar. Draft's inspector was clicked through
all three modes: `Context` shows Sources/References/Suggested, `Blocks` shows
Structure/Edit blocks, and `Board` shows draft-card controls. `npm run app:user`,
`npm run app:smoke`, `npm run verify:new-loom-audit`, and
`npm run verify:approval-gates-ready` passed. The only blocked checker was
`npm run verify:installed-draft-chrome`, because local `screencapture` is being
terminated with return code 137 while Safe Exam Browser is active; use Computer
Use or rerun that checker after the screenshot blocker is gone.

At 2026-05-12 14:44 AEST, the safe non-approval gates were refreshed without
touching real user files or calling a real provider. `npm run
verify:approval-gates-ready`, `npm run verify:new-loom-audit`, `npm run
verify:fixture-files-importer`, `npm run verify:compile-quality`, `npm run
verify:compile-provider-stub`, and `npm run verify:native-provider-stub` all
passed. The native provider stub covered `CustomEndpointClientTests` 11/11 and
cleaned the temporary Debug app bundle; it still prints the existing SwiftUI
background-publish warning, so keep that as a quality follow-up separate from
the two approval-bound gates.

## Files To Read First

- `docs/projects/active/2026-05-09-new-loom-completion-audit.md`
- `docs/loom.md`
- `docs/canon/LOOM_RULES.md`
- `/Users/yinyiping/.codex/computer-use/HEALTH.md`

## Important Constraint

Do not use desktop/system screenshot verification unless the user explicitly authorizes it. Prefer `@computer-use`; if Atlas page content is opaque in the AX tree, coordinate-click the visible floating Loom button once and verify through installed Loom plus `npm run verify:capture-handoff`.
