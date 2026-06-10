# Web Capture Interactive Regression

Date: 2026-05-04
Status: active failure record
Owner: current Codex thread

## Summary

The current web-capture work is still not fixed.

The attempted path added snapshot targets, snapshot capabilities, Swift schema
fields, reader inline snapshot handling, and snapshot-route target isolation.
Those changes improved some static appearances but did not solve Loom's actual
product requirement: captured web knowledge must preserve the meaningful
interactive objects from the source page inside Loom's reader surface.

This is not a small CSS/layout bug. The repeated failures show that the current
implementation is still treating interactive web regions as screenshots with a
targeted snapshot link. That is insufficient for Loom as a personal knowledge
wiki, because the saved page loses the behavior that made the source object
knowledge-bearing.

## User-Visible Failures Still Present

Evidence from the 2026-05-04 installed app screenshots:

- `flipdisc.io` board wiring sections still render as static-looking panels.
  `Power` and `Data` states are visible, but the wire geometry is still wrong
  relative to the source. The controls are not proven as live source behavior.
- `Pixel Font Comparison` is still rendered as a clipped/static visual block.
  The source behavior is an editable sentence where deleting one character
  updates every font row. Loom does not preserve that interaction in the reader.
- `Floyd-Steinberg vs Bayer` still renders as a static image/card in the reader.
  The source behavior is an interactive comparison slider. Loom now labels the
  fallback as a source snapshot, but it still does not preserve the slider
  behavior inline.
- The lower set of animated scene canvases from the source page is still not
  accounted for as eight animated/interactive visual blocks in the reader.
- Reader scroll over these snapshot-backed regions can still jump or flicker.
- Several captures show black empty space, clipped left-only content, or
  oversized static blocks. These are symptoms of an unstable snapshot-target
  crop, not proof of interactive preservation.

## What Was Tried And Why It Is Not Enough

Files touched in the latest attempt:

- `macos-app/Loom/LoomWebExtension/Resources/content.js`
- `macos-app/Loom/Sources/CaptureSheet.swift`
- `app/loom-render/capture/page.tsx`
- `app/loom-render/snapshot/page.tsx`
- `tests/capture-media-contract.test.ts`

The attempt added:

- per-region `data-loom-snapshot-target`
- `snapshotCapabilities`
- `snapshotRenderMode`
- inline targeted snapshot iframes
- snapshot host selection and visual bounds measurement
- extension-side live-DOM visual block detection

The problem is that these additions still do not guarantee behavior. A
capability string and a cropped snapshot route can say "interactive" while the
reader still shows a static or incorrectly isolated version of the source
object. The tests passed because they mostly asserted that plumbing strings and
functions exist. They did not prove that the saved AST can replay or preserve
real input, comparison slider, canvas animation, or scene behavior.

## Root Cause

The missing abstraction is a durable interactive artifact contract.

2026-05-08 product framing update: this regression is not only a reader
rendering problem. It sits at the junction of Loom's three core capabilities:
information collection, information organization, and thinking draft. Web
capture is the coupled collection + organization path: it must bring source
material into Loom and organize it into a page/source structure that can later
support the user's own thinking. A screenshot-only or crop-only fix therefore
does not meet the product requirement unless it also proves source fidelity,
placement, addressability, and honest fallback behavior.

Current capture has three separate concepts that are not yet reconciled:

1. Reader content: searchable article text and local media.
2. Source snapshot: preserved source-page HTML evidence.
3. Interactive source object: a bounded, stateful region whose behavior is part
   of the knowledge.

The current implementation tries to bridge item 3 by cropping item 2 into item
1. That is fragile because:

- React/Astro islands can have `display: contents`, transforms, viewport-wide
  layout, relative offsets, and internal state.
- Canvas pixels and input state are not represented by static DOM markup.
- A source page can contain multiple independent interactive regions; a single
  page snapshot is not a reusable inline component.
- Snapshot crop geometry is not equivalent to the source object's semantic
  runtime boundary.
- Existing tests do not execute user interactions against captured artifacts.

## Non-Negotiable Correction

Do not continue with small host-selection or crop tweaks.

Before another product fix is attempted, the project needs a real contract that
fails on the current behavior and passes only when the interaction survives.

The next implementation must introduce a capture artifact shape such as:

```ts
type InteractiveArtifact =
  | { kind: "input-mirror"; targetId: string; controls: CapturedControl[]; outputs: CapturedOutput[] }
  | { kind: "comparison-slider"; targetId: string; assets: CapturedAsset[]; initialPosition: number }
  | { kind: "animated-canvas"; targetId: string; recording: CapturedRecording; poster: CapturedAsset }
  | { kind: "source-island"; targetId: string; isolatedHtml: string; assets: CapturedAsset[]; requiredScripts: CapturedScriptPolicy };
```

The exact type can change, but the contract cannot be a screenshot plus a label.
It must say what behavior is expected and how Loom will render or honestly
fallback.

The implementation posture must stay macro + micro:

- Macro: capture schema, sidecars, placement, source provenance, and fallback
  semantics must agree across extension, Swift writer, `LoomFileStore`, and
  reader.
- Micro: each user-visible artifact must still be tested as behavior, not as
  a string proxy — type in the input mirror, move the comparison slider, verify
  segment structure, verify animated-canvas/scene behavior when that slice
  lands.

## Required Acceptance Tests

Add behavioral tests before changing product code again:

- A fixture for a text-input visual module proves that one edit updates all
  derived rows in the reader artifact.
- A fixture for a comparison slider proves drag input changes the rendered
  split.
- A fixture for canvas animation proves a non-static frame changes over time or
  a recording is rendered with controls.
- A fixture for multi-scene canvas sections proves all expected scenes are
  emitted into AST, not only the first canvas.
- A fixture for `flipdisc.io` board layout proves `Frame`, `Board`, `Power`,
  and `Data` states render with source-correct wire endpoints.
- Reader tests must click/type/drag inside the rendered Loom reader, not only
  search source strings.
- Installed-app verification must use the rebuilt `/Applications/Loom.app` and
  a fresh browser re-capture with current extension diagnostics.

## Definition Of Done

This work is not done until all of these are true:

1. A fresh capture from `https://flipdisc.io/` records current extension
   diagnostics and a typed AST inventory.
2. The AST accounts for the board visual, pixel font comparison, dither
   comparison, Floyd/Bayer comparison, and the lower animated scene set.
3. In Reader, the pixel font comparison accepts text edits and updates rows.
4. In Reader, Floyd/Bayer has a working slider or is explicitly labeled as a
   non-interactive fallback.
5. In Reader, board `Power` and `Data` wiring lands on source-correct endpoints.
6. The lower animated scene canvases are present and animate or have a clearly
   labeled recording fallback.
7. Parent-page scrolling over these regions does not flicker, jump, or trap
   wheel events inside a broken iframe.
8. Old captures degrade honestly instead of pretending they are interactive.
9. Contract tests and installed-app visual checks both pass.

## Current State

The code may contain partial scaffolding for snapshot targets and capabilities,
but it must not be treated as a completed fix. The project should treat this
state as an active regression until the behavioral artifact contract exists.

2026-05-06 progress: the reader copy now calls these regions "Source snapshot"
and "Open source snapshot" instead of claiming "interactive snapshot" behavior.
That satisfies the honest fallback requirement for old/current captures, but it
does not satisfy the behavioral artifact contract above.

2026-05-07 progress: the first durable interactive artifact slice now exists for
`input-mirror` modules. The extension detects text-input mirror regions, Swift
preserves the artifact in `CaptureAST`, and the reader renders one editable
sentence with synchronized output rows. A behavioral Playwright test proves that
editing one input updates all five rows and that the artifact height stays stable
after scroll. This resolves the Pixel Font Comparison class of failure only; the
comparison slider, animated canvas, and flipdisc wire-endpoint precision classes
remain active.

2026-05-10 correction: the renderer-side `input-mirror` contract existed, but
the live `https://flipdisc.io/` Pixel Font module was still not being emitted as
an input mirror because the source page uses five synchronized text inputs
rather than one input plus ordinary text outputs. The live verifier now fails
when `inputMirrorCount < 1`, and the extension groups repeated same-value text
controls as mirror output rows. After staging the extension, the live Flipdisc
handoff verifier reports `interactiveArtifactCount: 3`, `inputMirrorCount: 1`,
`comparisonSliderCount: 1`, and `segmentDiagramCount: 1`. The remaining active
classes are comparison-slider behavior depth, animated canvas coverage, and
wire-endpoint precision.

2026-05-07 progress: the artifact contract now covers `comparison-slider` and
`segment-diagram` modules. The reader renders comparison sliders as native Loom
components with two captured assets and a stable range-controlled split, avoiding
the flickering targeted iframe path during page scroll. It also renders short
technical segment diagrams, such as the flipdisc `Frame Format` row, as a
structured strip instead of flattening `0x80 0x83 0x01 imageData 0x8F` into one
sentence. A Playwright live-DOM probe against `https://flipdisc.io/` verified
that the extension builder now detects `Floyd-Steinberg vs Bayer` with two
canvas assets and `Frame Format` with five preserved segments. Static contracts
cover extension, Swift sidecar, and reader fields; behavioral tests cover
input-mirror, comparison-slider, and segment-diagram rendering.

2026-05-07 platform note: installed-app verification also found that Launch
Services can present a running Loom process with no accessible main-window
surface. `LoomApp.swift` now has an AppDelegate-owned AppKit fallback window so
the app can materialize the same Loom root view when SwiftUI's default
`WindowGroup` launch path does not produce a usable room.

2026-05-07 capture index note: the Captures landing page now treats
`loom:capture-saved` as an eventually-consistent native handoff instead of a
single refetch. It refreshes immediately and then retries at 250ms, 1000ms, and
2500ms, so the newest saved capture can appear after the native writer finishes.
A Playwright behavior test mocks a delayed native `captures-list.json` update
and fails unless the new capture becomes visible at the top of the list.

2026-05-07 verification note: `npm run app:user` previously hung in the Xcode
build phase when the script left destination selection implicit. The install
script now pins `xcodebuild` to `-destination platform=macOS`, and the script
contract test asserts that target. The patched path built, installed
`~/Applications/Loom.app`, passed installed-app smoke, and was checked through
Computer Use on the real Captures window.

2026-05-07 precision note: flipdisc's board wiring module is scroll-driven. The
same visual root swaps `frame-active`, `board-active`, `power-active`, and
`data-active` as the page scrolls. The visible-tab screenshot path now freezes
the active state class before calling `scrollIntoView`, reapplies it after the
source page's scroll handler runs, disables transitions for that frozen root,
and only then crops the tab screenshot. This addresses the user-visible symptom
where Power/Data wire screenshots shifted to another state during capture.

2026-05-07 verification note: the current multi-angle gate is split into
source-page probing, exported reader behavior, static contract checks, installed
bundle smoke, Computer Use, and OS screenshot capture. The source-page probe
against `https://flipdisc.io/` found the expected `comparison-slider` and
`segment-diagram` artifacts. Exported reader tests proved the comparison slider
does not resize while the page scrolls and that `Frame Format` is inlined as a
structured strip. `node --check`, `npm run test:capture-interactive:export`,
`npm run test:contracts`, `npm run typecheck`, `npm run app:check-project --
--require-tracked`, `npm run app:stage-extension`, `npm run app:smoke`, and
`npm run app:user` all passed. The remaining verification gap is native window
visibility: the installed app launches and CoreGraphics sees a `1400x900` Loom
window object, but it is not reported as an on-screen current-space window;
Computer Use returns `cgWindowNotFound`, and OS screenshot capture is blocked
until Screen Recording permission is granted to the terminal/Codex host.

2026-05-07 placement note: partial web clips now have an in-page placement
contract. `CapturePlacement` enumerates viable destinations inside the chosen
Loom page, the capture sheet exposes a `Place in page` picker for selected web
clips, and `CaptureWriter.insertPartialEntry` inserts the captured block after
the chosen heading while falling back to `## Notes` if the placement is stale.
This is the first step toward the requested web-clipper workflow where a user
selects a page region and places it into the intended Loom location instead of
only saving a domain-level capture.

2026-05-07 verification tooling note: the validation process itself had to be
corrected. `npm run typecheck` was spending minutes deleting/scanning giant
Finder duplicate directories under `.next-build/standalone`, including
`node_modules 2`, before TypeScript ran. The typecheck script now limits
duplicate cleanup to type-relevant output (`.next`, `.next-build/types`, and
`.next-app-dev`) while build/package/smoke keep the full artifact hygiene gate.
The duplicate cleanup walker was also changed away from unbounded `Promise.all`
directory recursion to avoid opening large numbers of generated directories at
once.

2026-05-07 Swift note: the macOS app build passes with the new capture placement
code. The dedicated `CapturePlacementTests` file is included in the generated
Xcode project, but `xcodebuild ... test` and `test-without-building` both hang
inside the Xcode runner with no `xctest` child process and near-zero CPU. Treat
Swift unit-test execution as blocked by the local Xcode runner, not as passed.

2026-05-08 product reliability note: Captures no longer defaults to the Next.js
magazine webview. Installed-app verification showed that the webview landing can
stall as an empty surface even when the bundle smoke passes. `CapturesView` now
uses the native SwiftUI capture list by default and keeps the web magazine behind
the explicit `loom.captures.web-landing.enabled` dogfood flag. Computer Use
verified that the installed app opens Captures with six rows and the newest
`flipdisc.io` capture first, then opens the first capture reader detail.

2026-05-08 build hygiene note: the static export path moved to
`.next-export-current` across build scripts, Xcode staging, and Swift
`loom://bundle` resolution. This avoids touching old `.next` and `.next-export`
trees that can contain pathological Finder duplicate folders. The installed
bundle smoke found 631 static web files, correct `com.yinyiping.loom` bundle ID,
`AppIcon.icns`, `Assets.car`, and no stale generated web artifacts.

2026-05-08 installed-app note: a bad second Loom icon was traced to an incomplete
DerivedData `Debug/Loom.app` bundle with no `Info.plist` or icon resources, not
to the installed `~/Applications/Loom.app`. The cleanup script removed the
DerivedData bundle, and a follow-up search found only
`/Users/yinyiping/Applications/Loom.app`.

2026-05-08 launch crash note: real app launch exposed a macOS 26.5 startup crash
from `presentWindowOnActiveSpace`. AppKit rejects a window behavior containing
both `.canJoinAllSpaces` and `.moveToActiveSpace`; the fix removes
`.canJoinAllSpaces` before inserting `.moveToActiveSpace`. After reinstall,
`/Users/yinyiping/Applications/Loom.app` launched with a live process, no new
Loom crash report, and no matching assertion/fault log entries.

2026-05-08 verification note: current passing gate after the installed-app fixes
is `npm run typecheck`, `node scripts/build-static-export.mjs`,
`npx tsx --test tests/capture-interactive-artifacts.test.ts
tests/captures-landing-behavior.test.ts`, `npm run test:contracts` (161/161),
`npm run app:user`, `npm run app:smoke`, static bundle resource inspection,
DiagnosticReports/log checks, and Computer Use interaction on the real installed
app. OS-level screenshot capture remains blocked by macOS Screen Recording
permission for the terminal/Codex host.

2026-05-08 process durability note: user feedback must be summarized into a
durable project record before the session moves on. Do not rely on chat memory
alone for feedback that should survive network loss, shutdown, context
compaction, or a new agent session. If direct Codex memory writing is not
available, record the distilled rule in the relevant repo document and point to
the exact file in the handoff.

2026-05-08 verification sequencing note: do not run two commands that rebuild or
move `.next-export-current` in parallel. `npm run test:capture-interactive:export`
and `npm run test:captures-landing` both call `scripts/build-static-export.mjs`;
running them concurrently can move the export directory out from under a static
test server and produce a false `404 /loom-render/capture` failure. Run these
export-backed Playwright gates serially when using `.next-export-current`.

2026-05-08 flipdisc Frame Format diagnosis: the user-provided source URL was
`https://flipdisc.io/`. Live DOM inspection showed the source row is a real
structured flex/divider diagram:
`div.rounded-lg.divide-x.border-2...font-mono` with five child spans
`0x80`, `0x83`, `0x01`, `imageData`, `0x8F`. Injecting the current
`content.js` into that live page produced one `segment-diagram` artifact labeled
`Frame Format`, and the installed extension resource hash matched the repo
source. The saved 2026-05-05/2026-05-06 raw extension payloads and capture AST
sidecars, however, had `interactiveArtifacts: []` and no segment diagnostics,
so the user-visible failure was not "reader received a segment artifact but
failed to compile/render it." The current extension can collect this structure;
old/current saved captures still needed reader-side organization recovery.

2026-05-08 Frame Format repair: the capture reader now infers legacy flat
byte-frame rows into inline `segment-diagram` artifacts when no saved artifact
exists. The deterministic fallback recognizes standalone hex/payload token
rows, reconstructs the five cells, marks the payload cell as growable, and uses
`Frame Format` for the canonical flipdisc row. This is intentionally reader-side
organization recovery: it makes already-saved captures useful without pretending
their original extension payload contained the missing structure.

2026-05-08 gate update: `verify` now includes `test:contracts`,
`test:capture-interactive:export`, and `test:captures-landing`; `verify:product`
adds status buckets, app project hygiene, Atlas extension staging, installed app
build, and installed app smoke. CI installs Chromium for Playwright and runs the
export-backed capture behavior gates serially. New tests cover both sides:
extension DOM fixture detection for the flipdisc frame row, and installed-reader
style recovery of a legacy capture with `interactiveArtifacts: []`.

2026-05-08 verification note: after the repair, these gates passed:
`npm run test:capture-interactive` (5/5), `npm run test:capture-interactive:export`
(5/5), `npm run test:contracts` (170/170), `npm run test:captures-landing`
(12/12), `git diff --check` on the touched files, `npm run app:check-extension`,
`npm run app:user`, and `npm run app:smoke`. Computer Use verified the rebuilt
`/Users/yinyiping/Applications/Loom.app` on the actual old 2026-05-06 flipdisc
capture: under `Software > Board`, the reader now shows `Captured Structure`,
`Frame Format`, and five cells instead of a plain paragraph containing
`0x80 0x83 0x01 imageData 0x8F`.

2026-05-08 Source Index organization repair: the user feedback was not only
about the flipdisc visual artifact; it also exposed weak information collection
and organization. The native Source Index now loads `CapturesIndex.loadAll()`,
shows a `Captures` metric and `Recent captures` work column, refreshes when
`.loomCaptureSaved` fires, and routes each row through `.loomOpenCapture` so the
same native Capture Reader opens with the matching `captureAst` query. This
keeps collected web material visible inside the organization surface rather
than isolated in the Captures list.

2026-05-08 Source Index verification note: focused contracts passed with
`npx tsx --test tests/knowledge-home-source-library.test.tsx
tests/captures-landing-refresh-contract.test.ts` (19/19), and the full contract
suite passed with `npm run test:contracts` (170/170). `npm run typecheck`,
`git diff --check` on touched files, `npm run app:user`, `npm run app:smoke`,
and `npm run app:check-extension` also passed. Computer Use on the rebuilt
`/Users/yinyiping/Applications/Loom.app` verified Source Index shows
 `2 source groups · 4 indexed resources · 3 captures`, the `Recent captures`
column includes `Flipdisc Display Build and Software Guide`, and clicking that
row opens the flipdisc Capture Reader with `Captured Structure / Frame Format`.

2026-05-08 capture-reader metadata note: reader highlights, notes, read
progress, and last-visited state now route through the Loom-native capture
metadata sidecar instead of being localStorage-only UI state. The web reader
hydrates from `loom://native/capture-metadata.json`, mirrors compatible state to
localStorage, and writes updates back to the sidecar. `LoomURLSchemeHandler`
sanitizes persisted `highlights` and keeps them alongside existing progress
metadata in `Loom-metadata.json`. Contract coverage is in
`tests/capture-media-contract.test.ts` under "capture reader thinking notes
persist through native capture metadata".

2026-05-08 cleanup/update note: product updates must include generated-artifact
cleanup. `package.json` now has `clean:generated`, and `verify:product` ends
with that cleanup after app install and smoke verification. The cleanup script
removes retired `.next-export`, stale Finder/AppleDouble artifacts from build
outputs, and `${TMPDIR}/loom-build-trash`. A later cleanup pass removed tracked
public assets whose names looked like duplicates (`public/brand/loom_app_icon
2.svg`, `public/icon 2.svg`, `public/icon-mono 2.svg`) and added contract
coverage so only canonical icon files remain. A real cleanup run removed
`public/.DS_Store` and confirmed `.next-export-current`, `.next-build`, and
`.next` had no stale generated artifacts afterward.

2026-05-08 latest verification note: after cleanup wiring, these gates passed:
`npx tsx --test tests/loom-app-scripts.test.ts tests/ci-workflow.test.ts`
(30/30), `npm run test:contracts` (172/172), and `git diff --check`.

2026-05-08 signing hygiene note: a fresh `npm run app:smoke` caught that the
currently installed `~/Applications/Loom.app` had been signed with
`com.apple.security.app-sandbox` present but set to false. The entitlement file
was correct; the failure came from Xcode Release build settings leaving
`CODE_SIGN_INJECT_BASE_ENTITLEMENTS = YES` while signing locally with `-`.
`project.yml` now sets `CODE_SIGN_INJECT_BASE_ENTITLEMENTS: NO` for both Loom
and LoomWebExtension, the generated `.xcodeproj` carries the same setting, and
`tests/loom-app-scripts.test.ts` locks it. Rebuilding with `npm run app:user`
then produced an installed app whose entitlements show
`com.apple.security.app-sandbox => true`; `npm run app:smoke` and
`npm run app:check-extension` both passed.

Related records:

- `docs/process/WEB_CAPTURE_POSTMORTEM_2026-04-30.md`
- `docs/process/WEB_CAPTURE_GOLDEN_CASE_2026-04-29.md`
- `plans/web-capture-per-region-anchoring.md`
