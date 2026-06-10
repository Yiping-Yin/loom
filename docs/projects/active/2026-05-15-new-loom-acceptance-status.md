# New Loom acceptance status

Status date: 2026-05-15

Objective: complete the new Loom product, not only phase 1.

## Verified product shape

- Primary information architecture is `Sources` and `Draft`.
- `Collect` and `Organize` are absorbed into `Sources`; `/collect` remains only as a compatibility entry into Sources.
- `docs/canon/LOOM.md` now opens with a current operating definition for Sources / Draft
  and marks older weaving/substrate language as historical context, not feature
  naming guidance.
- `docs/canon/LOOM_RULES.md` now says AI is summoned without metaphor framing, and old
  model names such as weave, panel, pursuit, and rehearsal may remain only as
  internal or compatibility names while default-visible labels stay literal.
- Source intake is exposed as `Add files`, not the internal `Ingestion` label, on default menu, Shuttle, help, and sidebar paths.
- The installed native app exposes a compact product switcher instead of a duplicate source browser in the global sidebar.
- The native root shell uses one shared toolbar and one continuous app canvas background.
- Draft owns the writing surface and an action-first inspector with separate `Sources`, `Edit`, and `Board` modes.
- Draft provider prompts now bound title, body, selected text, attached
  references, inline references, and corpus context before sending, for both
  Continue writing and Cmd-K inline edit, so multi-source Drafts do not silently
  exceed small local provider context windows.
- Compile provider prompts now bound scratch, active-source excerpt, prior notes,
  Ask history, attached references, and the final instruction before sending, so
  source-grounded Compile cannot silently drop provider context or exceed small
  local provider windows.
- Capture artifact states now flow from native CaptureAST sidecars through
  `captures-list.json`, Sources Draft handoff links, native capture-to-Draft
  attach, and Draft/Compile prompt reference metadata, so structured diagrams
  such as the flipdisc frame format are not reduced to flat token snippets
  before provider review.
- Sources owns file intake, recent captures, source groups, reading/review queues, and draft queues.
- Default discovery surfaces do not promote retired Rehearsal/Examiner quiz modes.
- The native `⌘E` selection path no longer falls back to Rehearsal when no text is selected; it opens plain Ask AI instead.
- The native `⌘E` menu label is literal (`Ask Selection`), not the vague legacy `Learn`.
- Ask AI message actions no longer hand assistant output into Rehearsal.
- The legacy Reconstructions loop is no longer promoted through default sidebar, Shuttle, or Edit-menu discovery.
- Keyboard Help uses literal source/draft actions and no longer advertises old thought-anchor, warp-thread, weave, or panel-memory language.
- Shuttle note-connection results land directly in `Sources#reader-notes` instead of reopening the legacy `/weaves` compatibility route.
- Default-visible product copy uses literal source/draft language across metadata, support/privacy pages, shortcuts, source review buttons, first-run copy, and reader-note surfaces.
- The web root layout no longer mounts retired Rehearsal, Examiner, or Reconstructions overlays; revision and refresh actions route to Draft or Sources reader notes.
- The unused `lib/view` preset experiment and the `appendRehearsal` note-store write path are removed so the old Questioning/Producing/Examiner model cannot silently re-enter the new shell.
- Learning-status copy now says `Noted`, `Written`, `Reviewed`, and `Current`, and refresh/target prompts use reader-note/source wording instead of `Woven`, `Ask`, `panel`, or `verify` labels.
- About page copy is grounded in the Sources / Review / Draft workflow instead of Vellum-era panel/weave brand language.
- App Store copy and screenshot defaults now use product surfaces (`Sources`, `Add source`, `Draft`, `Reader notes`, `Connections`) instead of `collect` wording or the old `/frontispiece` identity page.
- Direct `/cover` and `/frontispiece` visits now redirect into `Sources`; the retired cover/front-matter clients and CSS are removed from the product tree, and both routes are classified as legacy compatibility routes covered by the deletion-review registry.
- Finder-numbered duplicate product artifacts are not allowed to remain in the product tree.
- Release-quality docs now treat `npm run verify:product` as the safe
  non-approval product gate, not as proof that real user-file import or live
  provider output has been accepted.
- Knowledge-data docs now define current Sources / Draft data responsibilities,
  including provider-output persistence and approval-bound real-file/provider
  paths.
- `tests/ci-workflow.test.ts` now protects the safe `verify:product` gate shape:
  it requires the new Loom audit, approval readiness, fixture importer,
  compile-quality, provider-stub, native-provider-stub, installed Draft chrome,
  and cleanup gates while excluding the real-file importer.
- `docs/projects/active/README.md` now defines the continuation reading order
  for new Loom work: current acceptance status first, completion audit second,
  legacy-surface migration map third. The older 2026-05-08 skeleton docs are
  historical reference only and old Phase 1 / `Collect` / `Organize` snippets
  must be translated into the current `Sources` / `Draft` model before acting.

## Fresh verification evidence

- `node scripts/build-static-export.mjs`
  - Result: successful static export into `.next-export-current`.
- `npm run test:contracts`
  - Result: 586 tests, 586 pass, 0 fail.
- `node scripts/verify-new-loom-completion-audit.mjs`
  - Result: audit passes, with two approval-bound gates still open. Latest rerun also verifies retired `lib/view`/`appendRehearsal` removal, literal learning-status copy, `/cover` and `/frontispiece` redirects into Sources, retired Cover/Frontispiece client/CSS removal, legacy-compatibility classification for both routes, the current `docs/canon/LOOM.md` / `docs/canon/LOOM_RULES.md` Sources/Draft literal-naming guardrails, the active README continuation reading order, the release-quality full-product gate map, the knowledge-data current responsibility boundary, and the CI contract for the safe `verify:product` gate.
- `npx tsx --test tests/loom-app-scripts.test.ts --test-name-pattern "new Loom completion audit verifier keeps approval-bound gates explicit"`
  - Result: 38 tests passed; this now includes the active README reading-order
    contract and verifies the completion audit keeps both approval-bound gates
    explicit.
- `node scripts/verify-approval-gates-ready.mjs`
  - Result: approval-bound gates are ready, but require explicit approval.
- `node scripts/verify-approval-gates-ready.mjs --json`
  - Result: returns a machine-readable evidence checklist for both remaining
    gates, including approved file/provider, Computer Use UI evidence,
    original-file untouched proof, provider-visible context review, single
    approved provider call result, rendered artifact, source provenance, and
    forbidden pre-approval actions.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts tests/mirror-contract-adoption.test.ts --test-name-pattern "retired cover|default-visible product copy|native-backed web surfaces|recent-record consumers|retired compatibility clients|Help explains Sources|compatibility alias"`
  - Result: 101 tests passed, including the retired Cover/Frontispiece redirect/removal, mirror-helper cleanup, and literal default-visible copy contracts.
- `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern "Draft AI prompt bounds attached source context"`
  - Result: 37 tests passed; `buildBoundedDraftAIPrompt` keeps a repeated
    multi-source prompt at or below 6000 characters while preserving attached
    source labels and marking truncated provider context.
- `npx tsx --test tests/new-loom-draft-storage.test.ts --test-name-pattern "Draft AI prompt bounds attached source context|Draft inline edit prompt bounds selected source context"`
  - Result: 38 tests passed; `buildBoundedDraftAIPrompt` and
    `buildBoundedDraftInlineEditPrompt` cover both Continue writing and Cmd-K
    inline edit.
- `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' -only-testing:LoomTests/LoomDraftStoreTests/testDraftAIPromptBoundsAttachedSourceContextForSmallLocalProviders`
  - Result: passed for the native `LoomDraftAIPrompt` budget path. Xcode still
    printed the current CoreSimulator version warning, but the macOS-only test
    exited 0.
- `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' -only-testing:LoomTests/LoomDraftStoreTests/testDraftInlineEditPromptBoundsSourceContextForSmallLocalProviders`
  - Result: passed for the native `LoomDraftInlineEdit` budget path, with the
    same local CoreSimulator warning and macOS test exit 0.
- `npx tsx --test tests/new-loom-compile-pipeline.test.ts --test-name-pattern "Compile prompt builds|Compile prompt bounds oversized|Compile prompt pins mixed scratch|Compile privacy inspection"`
  - Result: 37 tests passed; web `buildCompilePrompt` keeps oversized scratch,
    source excerpt, prior notes, Ask history, attached references, and privacy
    omissions at or below 8000 characters while preserving the final instruction.
- `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' -only-testing:LoomTests/LoomDraftStoreTests/testCompilePromptBoundsOversizedScratchAndSourceContextForSmallLocalProviders`
  - Result: passed for the native `LoomCompilePipeline` budget path, with the
    same local CoreSimulator warning and macOS test exit 0.
- `npx tsx --test tests/overlay-wiring.test.ts tests/surface-actions.test.ts tests/new-loom-webview-storage-safety.test.ts`
  - Result: 7 tests passed for retired overlay wiring and WKWebView storage guards.
- `npx tsx --test tests/ai-stage-primitives.test.tsx tests/new-loom-compile-pipeline.test.ts tests/new-loom-source-connections.test.ts`
  - Result: 41 tests passed for AI stage labels, Compile/Draft deterministic pipeline, and source-connection Draft handoff.
- `npx tsx --test tests/app-store-assets.test.ts --test-name-pattern "app store copy|screenshot|preflight"`
  - Result: 11 tests passed for current App Store copy, screenshot defaults, preflight expectations, and manual screenshot audit surfaces.
- `node scripts/installed-app-smoke.mjs`
  - Result: installed app smoke passed for `/Users/yinyiping/Applications/Loom.app`.
- `node scripts/verify-flipdisc-live-extension.mjs --source-extension --verify-handoff-fixture`
  - Result: current repo extension source captures `https://flipdisc.io/` with the frame-format segment diagram, no flat frame line, one animated-canvas replay, and a passing saved-capture handoff fixture.
- `node scripts/verify-flipdisc-live-extension.mjs --staged-extension --verify-handoff-fixture`
  - Result: staged extension content script SHA matches repo source and passes the same live flipdisc handoff check.
- `npx tsx --test tests/capture-interactive-artifacts.test.ts --test-name-pattern "segment-diagram artifact preserves frame-format structure|animated-canvas and source-island"`
  - Result: reader contracts pass for segment-diagram inline placement and animated-canvas/source-island rendering.
- `npx tsx --test tests/knowledge-home-source-library.test.tsx --test-name-pattern "Recent captures can be attached to Draft as capture references|reader notes|Sources surfaces local imported files"`
  - Result: 27 tests passed; Sources capture Draft links now preserve
    CaptureAST filenames and primary artifact-state query fields for Draft
    references.
- `npx tsx --test tests/capture-media-contract.test.ts --test-name-pattern "web capture persists CaptureAST sidecar data into the native reader payload"`
  - Result: 49 tests passed; CaptureAST sidecars now feed native capture index
    artifact states and `captures-list.json` payloads.
- `xcodebuild -quiet test -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS' -only-testing:LoomTests/CapturePlacementTests/testDeletingCaptureRemovesOnlyOwnedSidecarFiles`
  - Result: passed after the native `CaptureEntry` artifact-state extension, with
    the same local CoreSimulator warning and macOS test exit 0.
- `npx tsx --test tests/new-loom-skeleton-contract.test.ts --test-name-pattern "new Loom product copy keeps literal Sources/Draft vocabulary"`
  - Result: 96 tests passed; the source-add panel now says `ADDED` and
    `No files added yet.` instead of leaking ingestion vocabulary into visible
    UI.
- Computer Use / AX readiness check on 2026-05-15 13:27 AEST:
  - Result: `mcp__computer_use__.list_apps` works and sees the running installed
    `/Users/yinyiping/Applications/Loom.app`, but `get_app_state` for that app
    returns `cgWindowNotFound`.
  - Non-screenshot diagnosis: CoreGraphics lists two visible Loom windows for
    pid `95686`, while `AXUIElementCopyAttributeValue(..., kAXWindowsAttribute)`
    returns success with zero windows and only the menu bar under
    `AXChildren`. Treat this as a Loom/AX window exposure blocker for
    Computer Use acceptance, not as a missing Screen Recording permission.
  - Do not use desktop screenshot capture as the replacement path unless the
    user explicitly approves it; keep working through non-UI gates, logs,
    app smoke, and AX/window diagnostics.

## Flipdisc diagnosis

- Current extension source and staged extension are not the active failure; both produce a valid live handoff for `https://flipdisc.io/`.
- The installed container still contains an older saved `flipdisc.io` capture whose `Loom.md` has the flat frame text and whose CaptureAST has no animated-canvas replay. That older saved capture is stale evidence, not proof that the current capture source is broken.
- Remaining flipdisc work should focus on installed-app recapture or reader behavior against stale saved captures, not on re-debugging the current extension extractor from scratch.

## Open gates

These gates are intentionally not marked complete because they require explicit user approval:

1. Real user-file installed-app importer acceptance.
2. Live provider-output Compile/Draft acceptance.

## Runbook after approval

When the user explicitly approves the remaining gates, collect fresh evidence in this order:

1. Confirm the installed app path and running bundle before touching user material.
   - Expected evidence: `/Users/yinyiping/Applications/Loom.app`, bundle id `com.yinyiping.loom`.
2. Run the real user-file importer acceptance with a user-approved sample file.
   - Expected evidence: imported file appears in Sources with local origin metadata, original file stays untouched, and Draft can attach the imported source.
3. Run the live provider-output Draft/Compile acceptance.
   - Expected evidence: provider-visible context is auditable, Draft/Compile receives a real provider result, and writeback preserves source provenance.
4. Re-run the non-destructive readiness and completion audit.
   - Expected evidence: completion audit no longer reports approval-bound gates as open.
5. Re-run installed-app smoke and the focused chrome verifier.
   - Expected evidence: installed app smoke passes and Sources/Draft chrome remains compact and non-overlapping.

## Completion rule

Do not mark the new Loom objective complete until both approval-bound gates have current evidence, or the user explicitly removes those gates from the objective.
