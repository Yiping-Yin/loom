# Legacy Surface Migration Plan

**Date:** 2026-05-09
**Status:** Classification and compatibility redirects enforced; no legacy deletion yet
**Owner:** current Codex thread
**Purpose:** Turn the old route and surface sprawl into a controlled migration map for the current Sources / Studio / Digital Me Loom.

## Rule

Legacy surfaces are not first-level product concepts. They can remain as files and direct routes while they are useful for migration, comparison, or regression testing, but they must not compete with:

1. **Sources** - add files, capture web pages, review, and preserve source material with provenance.
2. **Studio** - shape source material into block documents, cited answers, proof artifacts, and process pages with durable references.
3. **Digital Me** - represent selected source-backed forms and answer from them with citations.

`Draft` remains a route/storage/test compatibility name for the Studio document engine. It is not the primary user-facing product noun.

## Surface Classes

| Class | Meaning | Product visibility |
|---|---|---|
| Primary | The new Loom default path | First-level sidebar/home |
| Runtime | Required implementation surface, not a product destination | Direct/internal only |
| Compatibility | Old route kept for inbound links or regression comparison | Direct/internal only |
| Migration source | Old experiment whose useful behavior should move into Sources / Studio / Digital Me | Direct/internal until replaced |
| Sample/content | Static content, demo, or docs route | Not product navigation |

## Route Migration Map

| Route / surface | Class | Target | Action |
|---|---|---|---|
| `/` / `HomeClient` | Primary | Sources / Studio / Digital Me | Keep as new shell. No legacy links. |
| `/collect` | Compatibility | Sources | Redirect to `/sources`; file intake, captures, source folders, and review now live in one Sources workbench. |
| Native `LoomMinimalRootView` | Migration source | Native shell strategy | Retain as old native workbench evidence until the app chooses web-first wrapper or native-first workbench. Do not let it define the current web product contract. |
| `/sources` | Primary/Sources | Sources | Keep. Align copy around one source workbench and collected captures. |
| `/studio` | Primary/Studio | Studio | Keep as the first-class source-grounded form workbench. Old Draft storage and route names remain compatibility internals only. |
| `/digital-me` | Primary/Digital Me + compatibility edit mode | Digital Me / Studio | Keep. Default view is source-backed representation; old `?edit=...` links still open Studio for compatibility, but new product entry points use `/studio`. |
| `/knowledge` | Compatibility | Sources | Redirect to `/sources` because Sources is the only primary source-material entry. Keep detail routes buildable for source-reader compatibility, but do not let the old top-level Atlas/Knowledge name compete with `/sources`. |
| `/draft` | Support | Studio compatibility | Keep as a compatibility redirect/stub into `/studio?edit=...`; do not promote as first-level product navigation. |
| `/loom-render/capture` | Runtime | Sources reader | Keep as reader runtime only. Never promote to nav. |
| `/loom-render/captures` | Runtime | Sources capture index | Keep while native/web capture list convergence is unfinished. |
| `/loom-render/snapshot` | Runtime | Capture evidence layer | Keep as snapshot/evidence runtime only. |
| `/atelier` | Compatibility | Studio | Redirect to `/studio?edit=new` because reference excerpts and provenance now live in Studio. |
| `/workbench` | Compatibility | Studio | Redirect to `/studio?edit=new` because simple prose editing, Workbench localStorage import, word count, and debounced saves now live in Studio. |
| `/coworks`, `/letter` | Compatibility | Studio | Redirect to `/studio?edit=new` because cowork rehearsal output and correspondence-style writing now belong inside Studio, not separate collaboration or letter chapters. |
| `/diagrams` | Compatibility | Studio | Redirect to `/studio?edit=new` because diagramming is a form-thinking aid, not a separate top-level thinking product. |
| `/soan` | Compatibility | Studio | Redirect to `/studio?edit=new` because Studio now owns the card/block board for draft cards and their relations. |
| `/patterns`, `/weaves` | Compatibility | Sources | Redirect to `/sources#reader-notes` because saved reader notes and Studio references now carry the user-facing panel/relation handoff. |
| `/panel`, `/panel/[id]`, `/panels/[id]` | Migration source | Sources + Studio references | Keep only as hidden direct/native/static-export detail fallbacks until remaining panel deep links stop depending on panel detail data. Their fallback and back links now use Reader notes instead of Patterns/Panel labels, the singular dynamic route keeps ordinary direct links buildable, the plural dynamic route is a compatibility alias, and static export shelves unbounded ids. |
| `/pursuits` | Compatibility | Sources | Redirect to `/sources` because source groups and source-state chips now carry project context without a first-level Pursuits product. |
| `/pursuit`, `/pursuit/[id]`, `/pursuits/[id]` | Migration source | Sources | Keep only as hidden direct/native/static-export detail fallbacks until remaining deep links stop depending on pursuit detail data. Their fallback returns to Sources and uses question / reader-note vocabulary instead of Pursuits / Panels, the singular dynamic route keeps ordinary direct links buildable, the plural dynamic route is a compatibility alias, and static export shelves unbounded ids. |
| `/collection` | Compatibility | Sources | Redirect to `/sources`; source-category detail browsing has been folded into the Sources workspace and source documents open through `/doc?href=...`. |
| `/constellation`, `/branching` | Compatibility | Sources | Redirect to `/sources#reader-notes` because visual panel/relation exploration now belongs under Reader notes instead of separate product chapters. |
| `/palimpsest` | Compatibility | Studio | Redirect to `/studio?edit=new` because revision and sentence-history work belongs in Studio rather than a separate chapter. |
| `/salon` | Compatibility | Sources | Redirect to `/sources` until real shared-reading sessions exist; do not expose Coworks as the empty-state escape hatch. |
| `/atlas`, `/atlas/shelf`, `/browse` | Compatibility | Sources | Redirect to `/sources`; do not pass old source-shelf aliases through Desk or expose "Atlas" as a product category. |
| `/notes`, `/highlights` | Compatibility | Sources | Fold trace-backed and capture-reader note/highlight review into Sources; redirect these old routes to `/sources#reader-notes` until compatibility deletion is safe. |
| `/today` | Compatibility | Sources | Live daily capture surface (quick jot + recent jots, localStorage-backed). Not a redirect. Route stays legacy-classified (not a sidebar primary) until promoted. |
| `/contents` | Compatibility | Sources | Redirect to `/sources` because the old table-of-contents surface map reintroduces hidden legacy concepts. |
| `/uploads` | Compatibility | Sources | Redirect to `/sources` because file intake now lives in Sources on web and native. |
| `/desk` | Compatibility | Sources | Redirect to `/sources` after shelf, today/current-work, and writing handoff jobs moved into Sources and Draft. |
| `/cover`, `/frontispiece` | Compatibility | Sources | Redirect to `/sources`; the retired Cover/Frontispiece clients and CSS are removed so these direct routes cannot preserve old opening-page product identity. |
| `/about`, `/help`, `/offline`, `/onboarding`, `/colophon`, `/system`, `/discipline` | Support | App support/settings | Keep outside core product loop. `/discipline` is the in-app six-refusals document linked from System and Help. |
| `/dev/*`, `/wiki/*`, `/demo`, `/llm-wiki`, `/graph`, `/quizzes`, `/kesi`, `/doc` | Sample/content/internal | Docs/demo/dev | Keep buildable if tests need them; not product navigation. `/doc` source reader fallback uses Sources breadcrumbs instead of Desk-era links, and `/llm-wiki` breadcrumbs return through Sources. |

## Migration Batches

### Batch 1: Default Path Lock

Goal: users entering Loom see only Sources, Studio, and Digital Me.

Evidence:

- `tests/new-loom-skeleton-contract.test.ts`
- `HomeClient.tsx`
- `LoomMinimalRootView.swift`
- `NEW_LOOM_ROUTE_CLASSIFICATION`, which classifies every current web
  `page.tsx` / `page.mdx` route as primary, runtime, legacy, support, or
  internal. New routes must enter the map before they can pass contracts.
- Primary product surfaces (`/`, `/sources`, `/studio`, `/digital-me`) cannot
  link users back into hidden legacy or internal destinations. The first
  enforced fixes were `/sources` writing continuation moving from `/workbench`
  to the Studio compatibility entry, the empty-state writing action moving from `/coworks` to
  Studio, and the source workspace copy moving away from old Archive,
  Collect, and Organize page names.
- Native product command surfaces should use the same literal vocabulary. The Shuttle
  command palette should expose Sources, Studio, and Digital Me as product commands; old
  route names remain only as hidden search keywords that resolve into those
  commands.
- Native Shuttle search-result sections also use literal new-Loom vocabulary:
  Questions, Reader notes, Draft cards, Note connections, and Sources. Row
  subtitles no longer surface Pursuit, Panel, Sōan, or Weave as user-facing
  categories.
- Native menu and keyboard-help surfaces no longer expose Sōan, Weaves, or
  Pursuits as user-facing product labels for the legacy thinking actions. The
  shortcuts now read as Add Question, Add Draft Card, Connect Draft Cards, and
  Connect Reader Notes while their old storage models remain migration
  internals.
- Native Settings > Data now labels the old storage buckets as Questions,
  Reader notes, Draft cards, and Note connections. Destructive row copy uses
  the same vocabulary while the old model names remain implementation details.
- Native Ingest fragment placement now uses Questions and Reader notes in
  its destination picker, rendered fragment chip, attach-error copy, and
  fallback titles. The old Pursuit/Panel words remain storage-route internals
  instead of capture-time user choices.
- `/collect` is now only a compatibility redirect into `/sources`; file intake,
  captures, source folders, and review live in one Sources workbench instead of
  a separate Collect page.
- Native Sources now owns local-file intake. `Add files` opens `NSOpenPanel`,
  supports multiple file selection, and stages selected local URLs into
  ingestion. Main-window file drops also stage dropped URLs into
  `IngestionContext` and open the Ingestion window, so Drag-to-import is a
  Sources behavior rather than a separate upload surface. The old `/uploads`
  route is only a compatibility redirect to `/sources`.
- `/sources` writing continuation now carries readable source context into
  Studio through paired `ref`, `label`, `kind=source`, and `source` query
  values; `/draft` remains the compatibility stub that forwards into
  `/studio?edit=...`.
- The public App Store submission surface should follow the same loop:
  `docs/app-store-copy.md`, `scripts/app-store-screenshots.mjs`, and
  `scripts/app-store-preflight.mjs` use Sources / Studio / Digital Me / Reader notes instead
  of Collect, Organize, Sōan, Patterns, Pursuits, or their legacy routes.
- Source reader and upload-derived source meta now use Sources labels:
  `/doc`, `/collection`, `/llm-wiki`, `UploadButton`, and `panelSourceMeta` no
  longer route users back through Desk, Intake, or the old upload route. The
  unimported `UploadsClient` fallback has been removed after `/uploads` became a
  compatibility redirect to `/sources`.
- Hidden static-export detail fallbacks now exit into the new Loom homes:
  `/panel` uses Reader notes wording, `/pursuit` returns to Sources and labels
  stored panel attachments as reader notes, and older sample fallback clients
  route to Reader notes or Draft instead of Patterns / Workbench.
- Unimported route clients for already-redirected retired surfaces have been
  deleted instead of kept as internal fallback UI: `UploadsClient`,
  `CoworksIndexClient`, `LetterClient`, `BranchingClient`, `PalimpsestClient`,
  `ConstellationClient`, `DiagramsClient`, and `SalonClient`. Their route files
  remain as compatibility redirects until release-cycle evidence clears route
  deletion.

Gate:

```bash
npm run test:contracts
```

### Batch 2: Draft Consolidation

Goal: Workbench, Atelier, and Sōan stop being separate writing products.

Required work:

- Define one native-backed `ThinkingDraft` model.
- Move Workbench prose persistence into Draft.
- Move Atelier synthesis/reference behavior into Draft references.
- Move the old Sōan card board into Draft as the draft-card board.
- First migration helper: `coworkToDraftSeed(cowork)` turns a Cowork's tidy
  markdown, scratch fallback, and materials into a Draft seed without invoking
  AI or exposing the `/coworks` route.
- Draft now absorbs the Workbench basics: it one-time imports
  `loom.workbench.current` when the active Draft body is empty, displays a
  word count, and debounces saves through the new Draft store.
- First Atelier migration step: Draft references can carry `sourceTitle` and
  `excerpt`; `/draft` can insert a referenced excerpt as a quote and render a
  provenance ledger when those excerpts appear in the draft body. Native
  `LoomDraftStore` preserves the same metadata so native saves do not strip
  web Draft context.
- Capture-reference migration step: Recent captures in Sources can attach
  their reader artifact to Draft with `kind=capture`, source label, and capture
  timestamp. Web Draft storage and native `LoomDraftStore` preserve that
  capture metadata so later native saves do not flatten capture references into
  generic URLs.
- Native Draft reference reopening step: Draft references expose an `Open
  reference` action. Capture references post `.loomOpenCapture` back into the
  saved reader artifact, `loom://content` references navigate through the
  native folder/file handlers, and external URLs open through the system.
- Native Continue writing step: Sources writing rows attach a
  `kind=source` reference to Draft before navigating there, so native Draft can
  reopen the source folder instead of losing the source context.
- Native writing classifier step: Sources only treats a source as
  writing-ready when `Loom.md` contains real user note/body lines. Generated
  resource inventories and markdown-linked document headings stay in Sources
  instead of creating false Continue writing rows. When real writing exists,
  the source reference carries a `draftExcerpt` into Draft.
- Draft-card board migration step: `/draft` renders the native-backed card
  board for draft cards and relations, while `/soan` redirects to
  `/studio?edit=new&view=board` instead of exposing a separate writing product.
- Native Draft board alignment step: installed-app `LoomDraftView` now reads
  `LoomSoanWriter.allCards()` / `allEdges()`, shows a Draft board panel beside
  references, listens for `.loomSoanChanged`, and exposes Add draft card /
  Connect draft cards actions. This keeps the installed Draft surface from
  depending on the retired Sōan route to see or add draft-card structure.
- Artifact-state quote migration step: Draft references can now carry
  `kind=artifact-state` plus target id, artifact kind, state label/state, and
  source excerpt metadata. Web Draft can ingest those query fields, insert a
  state-scoped quote, and render artifact-state provenance; native
  `LoomDraftStore` and `LoomDraftView` preserve and display the same metadata.
- Native-backed Draft bridge step: the static web `/draft` page now uses
  `window.webkit.messageHandlers.loomDrafts` inside the installed app for
  `list`, `create`, and `update`, so web Draft editing and native Draft
  editing share `LoomDraftStore` instead of splitting between WebView
  `localStorage` and the native JSON store. Plain browser/dev mode keeps the
  localStorage adapter as a fallback.
- Native Draft Markdown sidecar step: `LoomDraftStore` keeps
  `Drafts/drafts.json` as the authoritative native index and writes readable
  `Drafts/<draft-id>.md` sidecars for each saved draft. The sidecar preserves
  title, body, reference links, reference kind/source/capture timestamp,
  artifact-state summary, and quoted excerpts so Draft is not trapped inside a
  JSON-only store. If the JSON index is missing, native Draft falls back to
  UUID-named Markdown sidecars and reconstructs title, body, and reference
  metadata from the readable file. If a UUID-named Markdown sidecar is clearly
  newer than the JSON index, native Draft treats it as an external edit and
  merges the sidecar title, body, and references while preserving the draft id
  and creation date.
- Web Draft reference-open bridge step: web `/draft` reference and provenance
  links now post `openReference` through the installed-app navigation bridge
  before falling back to normal anchors. The Swift bridge mirrors native Draft
  reference opening for capture artifacts, `loom://content` source refs, other
  `loom://` refs, external URLs, and imported local-file `file://` refs.
- Draft AI composition step: web Draft now calls the installed-app
  `loomAIStream` bridge through `callAiPrompt('draft-compose', ...)`, while
  installed native `LoomDraftView` calls the shared Swift `LoomAI.sendStream`
  path. Both build the prompt from the current draft body and attached
  references, including capture timestamps as `capturedAt=...`, stream the
  proposed continuation into an `AI draft` preview, and only write it into the
  Draft body when the user chooses `Insert AI text`. The 20:03 AEST slice also
  gives Draft AI default corpus context before compose/inline edit: web Draft
  selects relevant entries from the staged search index while skipping attached
  references, and native Draft queries `LoomEmbeddingStore.similarAcrossAllRoots`
  through `LoomDraftCorpusContext`. The 20:13 AEST update also lets inline
  `@target` prompt lines resolve against those selected corpus hits when no
  attached Draft reference matches, preserving href/category/sourcePath in the
  prompt. The 20:48 AEST update adds the first visual `@` autocomplete/ranking
  slice on top of the explicit source insertion workflow. The 21:58 AEST update
  gives inline edit a reviewable line-level `Diff preview` on web Draft and
  native Draft before `Accept edit` mutates the saved body.
- ThinkingDraft block-structure and cross-block operation step: web Draft
  storage and native Draft now derive stable reviewable blocks from markdown
  before richer composer work. Blocks carry id, kind, source offsets, word
  count, matching reference hrefs, and guarded block-edit semantics; web and
  native Draft both expose a visible `Draft structure` panel. Cross-block
  operations now have web and native reviewable diff evidence before they can
  rewrite selected adjacent blocks. Live multi-block AI composition remains
  approval-bound until the provider-output Draft/Compile gate is explicitly
  approved and run.
- Question-container creation affordance step: native Sources now exposes
  `Add Question` directly inside the `QUESTION CONTAINERS` panel and the
  installed minimal root mounts the shared `HoldQuestionSheet`. Computer Use
  verified the relaunched installed app opens the sheet and Cancel returns to
  Sources without creating a record. Real row acceptance still requires
  explicit approval to create a temporary question container.
- Question-container body editor step: direct question detail now carries the
  durable container body from native payload to web editor and back through the
  `updatePursuitBody` bridge. `LoomPursuitWriter.updateBody(...)` rewrites
  `pursuits/<slug>/Loom.md`, and `phase7Body(...)` reads it back without the
  heading. Installed-app row acceptance still waits for explicit approval to
  create a temporary question container in user data.

Gate:

```bash
npm run test:contracts
LOOM_SKIP_WEB_STAGE=1 xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -destination 'platform=macOS,arch=arm64' -only-testing:LoomTests/LoomDraftStoreTests test
```

### Batch 3: Sources Consolidation

Goal: Sources, captures, folders, notes, highlights, and old panels become one organization surface.

Required work:

- Make captured web material visible from Sources. First enforced step:
  web Sources fetches `loom://native/captures-list.json` and renders a
  Recent captures work panel that opens the capture reader runtime directly.
- Surface capture state on each source row. Web Sources keeps the full
  capture list for per-root counts while visually capping the Recent captures
  work panel; native Sources groups `CapturesIndex.loadAll()` by root and
  shows each source's capture count beside resource/writing state.
- Surface reader state on each source row. Web Sources reads
  `loom://native/capture-metadata-all.json`; native Sources scans
  `Loom-metadata.json`; both paths expose per-source highlight and note counts
  so capture-reader work returns to Sources.
- Fold trace-backed reader work into Sources. Web Sources uses
  `useAllTraces()` and `fetchSearchIndex()` to render trace `thought-anchor`
  and `highlight` events as concrete Reader notes rows. Those rows carry
  source titles, summaries, timestamps, and source anchor ids into
  `openPanelReview`, so `/notes` and `/highlights` do not remain separate
  product concepts just to review a saved passage.
- Attach trace-backed Reader notes to Draft. Each concrete note/highlight row
  builds a `/draft` reference with `kind=source`, source title, and excerpt
  text so organized understanding can become draft material without opening a
  standalone notes or highlights product. Native Sources mirrors this
  handoff at the source-summary level: Reader notes rows expose `Draft`, attach
  a `loom://content/<source-id>#reader-notes` reference, and navigate to Draft.
- Keep source folders read-only.
- Treat pursuit/project/course grouping as tags or source states, not a new first-level entity.
- Add explicit source/capture states: connected, needs access, indexed, has notes, has draft, has loose captures.
- Attach captured reader artifacts to Draft from Recent captures, so Sources
  can hand off collected material to the writing surface without promoting the
  runtime capture route as a product destination.
- Keep the captures landing as plumbing, not a destination: runtime capture
  reader and snapshot back links return to `/sources` (web) and the native
  shell's shared toolbar returns capture readers to Sources instead of the
  captures landing.
- Attach source folders to Draft from native Continue writing rows, so
  "writing ready" source state carries concrete context into the writing
  surface.
- Surface local imported files as first-class Sources work. Native ingestion
  records local origin metadata for imported files, Sources renders those
  local-file entries, and both web/native paths can attach them to Draft or open
  the original local source file without mutating source folders. Web Source
  Sources must not create dead `#` links for local-file rows; when native trace
  metadata lacks `trace.source.href`, it falls back to `file://` built from
  `origin.originalPath` and otherwise skips the row.
- Recent captures must be deletable from Sources only through confirmed
  destructive action. Native rows show `DELETE` and open `Delete this capture?`;
  web rows use inline `Delete now` / `Cancel` state and do not call browser
  prompts.
- Do not mark source folders as writing ready just because Loom generated a
  resource inventory for indexed files.
- Keep that handoff bidirectional: once a capture is attached to Draft, the
  native Draft reference panel must reopen the reader artifact directly; once a
  source is attached, the panel must reopen the source folder directly.
- Pursuit/project grouping can now emit and explicitly persist a durable Phase
  7 container artifact through `buildPursuitContainer(...)`,
  `LoomPursuitContainerBuilder`, and `LoomPursuitContainerWriter.persist(...)`.
  Native pursuit create, season, weight, source attachment, panel attachment,
  and delete paths now best-effort sync or clean up that container. Web Sources
  now exposes these records as literal `Question containers` in current work by
  reading `loom.pursuits.v1` / `loom://native/pursuits.json`; native Sources
  mirrors the same panel through `LoomPursuitWriter.allPursuits()`
  and `PursuitHideStore.readAll()`. Do not re-promote `/pursuits` as a
  first-level product route. Cite enrichment now resolves source titles,
  excerpts, panel titles, and capture URLs from `LoomTrace` / `LoomPanel`
  context when present, while preserving stable ID fallbacks. Container metadata
  and cite sync now reads the existing `pursuits/<slug>/Loom.md` body first and
  rewrites the same body afterward, so external/deep-shelf edits are protected
  from weight/source/panel metadata updates. The direct question detail surface
  can now author that body intentionally through a `Question notes` editor and
  native `updatePursuitBody` bridge.

Gate:

```bash
npm run test:contracts
npm run test:captures-landing
```

Latest evidence for the local-file/delete slice: `npm run test:contracts`
passed 245/245, focused Sources tests passed 18/18, Debug Xcode build
passed, `npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`,
and Computer Use verified `DELETE` confirmation plus the native `Add files to
Loom` file panel without deleting or importing data during acceptance.

Latest Phase 7 question-container evidence: focused pursuit detail contract
passed 4/4, full Swift `PursuitSpawnerTests` passed 13/13, focused
new-Loom/source/pursuit contracts passed 89/89, `npm run typecheck` passed,
`npm run test:contracts` passed 466/466, and diff whitespace checks passed.
After reinstalling `/Users/yinyiping/Applications/Loom.app`, Computer Use read
Source Index with visible `DRAFT` / `Delete`, `QUESTION CONTAINERS`, and
`Add Question`; opening and canceling the Add Question sheet created no user
record. Real row/body-save acceptance still requires explicit approval to
create a temporary question.

Latest access-refresh evidence: `SecurityScopedFolderStoreTests` passed 10/10
after adding the launch notification regression, `npm run test:contracts`
passed 253/253, Debug Xcode build passed, `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`, and Computer Use verified the freshly
relaunched installed Source Index shows `DELETE` buttons plus `Connected` /
`Indexed` source rows without first navigating away from Organize.

Latest image-import evidence: native image import now uses Vision OCR and keeps
visual-provenance fallback text when no words are recognized. The focused OCR
tests passed 2/2 and full `TypedExtractorMatchTests` passed 5/5 after the
initial red failure on the missing helper. Focused new-Loom contract passed
46/46, full `npm run test:contracts` passed 254/254, Debug Xcode build passed,
`npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`, and
Computer Use verified the freshly relaunched installed app shows Organize
`DELETE` actions plus Collect `Add files` without deleting or importing data.

Latest scanned-PDF evidence: native PDF extraction now falls back from empty
PDFKit text to Vision OCR over rendered page thumbnails, then runs the same
clean-text and page-range pipeline. The focused fallback test first failed on
the missing overload, then passed 1/1 after implementation. Full
`CleanTextParityTests` passed 9 executed tests with 1 expected environment skip
and 0 failures; focused scanned-PDF new-Loom contract passed 1/1 and full
`tests/new-loom-skeleton-contract.test.ts` passed 47/47. Full
`npm run test:contracts` passed 255/255, and Debug `xcodebuild` passed.
`npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`,
`npm run app:smoke` passed, `npm run app:where` reported
`2026-05-09T02:18:09.259Z`, and Computer Use verified the relaunched installed
app as pid 96320 with Source Index, Collect / Organize / Draft, capture
`DELETE` buttons, and `Connected` / `Indexed` source rows intact.

Latest PPTX alt-text evidence: slide-deck extraction now reads embedded
PowerPoint `cNvPr` title and description attributes for shape/image alt text
alongside visible slide text and speaker notes. The focused alt-text test first
failed with only visible slide text returned, then passed 1/1 after
implementation. Full `SlideDeckExtractorTests` passed 10/10, focused
new-Loom alt-text contract passed 1/1, and full
`tests/new-loom-skeleton-contract.test.ts` passed 48/48. Full
`npm run test:contracts` passed 256/256, Debug `xcodebuild` passed,
`git diff --check` and `git diff --cached --check` passed, `npm run app:user`
installed `/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke`
passed, `npm run app:where` reported `2026-05-09T02:25:31.278Z`, and Computer
Use verified the freshly relaunched installed app as pid 2455 with Source
Index, Collect / Organize / Draft, capture `DELETE` buttons, and
`Connected` / `Indexed` source rows intact.

Latest Keynote / Pages iWork evidence: `.key` and `.pages` imports now fall
back to iWork archive parsing when PowerPoint slide XML is absent. The parser
reads document metadata from `Metadata/*.plist` and extracts
`QuickLook/Preview.pdf` through `PDFExtraction` when present. The focused iWork
tests first failed because `metadata.key` and `metadata.pages` returned nil,
then passed 2/2 after implementation. Full `SlideDeckExtractorTests` passed
12/12, focused iWork new-Loom contract passed 1/1, and full
`tests/new-loom-skeleton-contract.test.ts` passed 49/49. Full
`npm run test:contracts` passed 257/257, Debug `xcodebuild` passed, `npm run
app:user` installed `/Users/yinyiping/Applications/Loom.app`, `npm run
app:smoke` passed, `npm run app:where` reported
`2026-05-09T02:34:35.496Z`, and Computer Use verified the freshly relaunched
installed app as pid 10034 with Source Index, Collect / Organize / Draft, and
visible capture `DELETE` buttons intact.

Latest iWork body-text evidence: Keynote / Pages imports now scan `Index/*.iwa`
for best-effort Unicode UTF-8 and UTF-16LE text runs and append useful
strings under `iWork body text`. The focused body-text tests first failed
because `body.key` and `body.pages` returned only metadata, then passed 2/2
after implementation. Full `SlideDeckExtractorTests` passed 14/14, full
`tests/new-loom-skeleton-contract.test.ts` passed 50/50, full
`npm run test:contracts` passed 258/258, Debug `xcodebuild` passed, `npm run
app:user` installed `/Users/yinyiping/Applications/Loom.app`, `npm run
app:smoke` passed, `npm run app:where` reported
`2026-05-09T02:52:27.910Z`, and Computer Use verified the freshly relaunched
installed app as pid 24418 with Source Index, Collect / Organize / Draft,
visible capture `DELETE` buttons, `Add files`, and Draft references intact.
Full iWork protobuf/layout and body/slide/page reconstruction remains future
importer work.

Latest Unicode IWA evidence: the IWA scanner now handles Unicode UTF-8 scalars
and non-ASCII UTF-16LE code units. The focused Swift tests first failed because
Chinese strings in `body.key` and `body.pages` were omitted, then passed 2/2
after implementation; the focused new-Loom contract passed 50/50 and full
`SlideDeckExtractorTests` passed 14/14. This closes the ASCII-only text-run
gap, but still does not claim full iWork protobuf or layout reconstruction.
Release install verification then passed: `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`, `npm run app:smoke` passed,
`npm run app:where` reported `2026-05-09T03:03:31.704Z`, and Computer Use
verified the freshly relaunched installed app as pid 31026 with Source Index,
Collect / Organize / Draft, visible capture `DELETE` buttons, `Add files`, and
Draft references / AI draft / Draft board intact.

Latest image semantic-label evidence: native image import now adds
`VNClassifyImageRequest` labels beyond OCR and original-path / visual-provenance
fallback text. `LocalImageImportText.build(... visualDescriptions:)` normalizes
and deduplicates labels under `Visual description:`. The focused skeleton
contract first failed on the missing Vision-classification contract, and the
focused Swift test first failed on the missing builder argument; after
implementation, focused Swift passed 1/1 and full `TypedExtractorMatchTests`
passed 6/6. Full `tests/new-loom-skeleton-contract.test.ts` passed 50/50,
full `npm run test:contracts` passed 258/258, Debug `xcodebuild` passed,
`npm run app:user` installed `/Users/yinyiping/Applications/Loom.app`,
`npm run app:smoke` passed, `npm run app:where` reported
`2026-05-09T02:43:02.193Z`, and Computer Use verified the freshly relaunched
installed app as pid 16860 with Source Index, Collect / Draft, and visible
capture `DELETE` buttons intact. The 14:48 AEST real-file gate then moved this
from fixture-only to real-corpus evidence: `scripts/verify-real-file-importer.swift`
runs Vision OCR and classification over real images, and
`npm run verify:real-files-importer` reported OCR 29 plus visualDescriptions 12
across three UNSW image files. Higher-fidelity or domain-specific image
understanding remains future importer work.

The 14:56 AEST Draft AI pass tightened source context for writing continuity:
web `DraftClient` and native `LoomDraftAIPrompt` now include capture
`capturedAt` metadata in attached-reference prompt lines. Red/green evidence:
`tests/new-loom-skeleton-contract.test.ts` first failed on missing prompt
timestamp coverage, and
`LoomDraftStoreTests/testDraftAIPromptIncludesCaptureTimestampContext` first
failed on the missing Swift prompt field; after implementation the focused web
contract passed 51/51 and Swift selected test passed 1/1. Wider gates passed:
`npm run test:contracts` 427/427, `npm run typecheck`, full
`LoomDraftStoreTests` 10/10, and `git diff --check && git diff --cached
--check`.

The 15:03 AEST legacy-surface cleanup removed the orphaned
`app/AtlasHubClient.tsx` implementation after `/atlas` and `/atlas/shelf`
became direct redirects to `/sources`. The focused `atlas-hub-phase2` contract
first failed because that stale client still existed and carried `/atlas/shelf`
plus `/knowledge` compatibility links, then passed 6/6 after deletion. This is
not route deletion: the compatibility route files and deletion registry remain
in place until release-cycle evidence exists. Wider gates passed:
`npm run test:contracts` 428/428, `npm run typecheck`, and
`git diff --check && git diff --cached --check`.

The 17:50 AEST legacy-surface cleanup removed the remaining orphaned
`app/AtlasClient.tsx` shelf implementation after `/atlas` and `/atlas/shelf`
were already direct redirects to `/sources`. Its `.loom-atlas*` and
`data-atlas-empty-group` CSS were also removed from `app/globals.css`. Red/green
evidence: the focused Atlas / Desk / mirror-helper tests first failed because
`app/AtlasClient.tsx` and the dead shelf CSS still existed, then passed 15/15
after deletion. This is still not `/atlas` route deletion: `app/atlas/page.tsx`
and `app/atlas/shelf/page.tsx` remain compatibility redirects, and the legacy
deletion registry remains blocked until release-cycle evidence exists. Wider
verification then passed: `npm run test:contracts` 440/440, `npm run typecheck`,
both diff whitespace checks, `npm run app:user`, `npm run app:smoke`, and
`npm run app:where` at `2026-05-09T07:53:58.076Z`. Computer Use verified the
reinstalled Source Index as `pid 72840` with Collect / Organize / Draft and
visible capture `DRAFT` / `Delete` controls intact.

The 15:06 AEST legacy-surface cleanup removed the orphaned
`app/desk/DeskPage.tsx` implementation after `/desk` became a direct redirect
to `/sources`. The stale file still composed old Atlas and Today clients even
though no route imported it. Red/green evidence: `tests/desk-first-ia.test.ts`
first failed because the file still existed, then passed 3/3 after deletion.
This is not `/desk` route deletion: `app/desk/page.tsx` remains the compatibility
redirect and the deletion registry remains blocked pending release-cycle
evidence. Wider gates passed: `npm run test:contracts` 429/429,
`npm run typecheck`, and `git diff --check && git diff --cached --check`.

The 15:11 AEST legacy-surface cleanup removed the orphaned
`app/today/TodayClient.tsx` implementation after `/today` became a direct
redirect to `/sources`, then removed its now-dead `.loom-today*` CSS from
`app/globals.css`. Red/green evidence: the focused cleanup tests first failed
on the lingering client file, then passed 8/8 after deletion; the CSS cleanup
contract then failed on the dead selector and passed after the CSS block was
removed. This is not `/today` route deletion: `app/today/page.tsx` remains the
compatibility redirect and the deletion registry remains blocked pending
release-cycle evidence. Wider gates passed: focused cleanup 9/9,
`npm run test:contracts` 431/431, and `npm run typecheck`.

The 15:18 AEST legacy-surface cleanup removed the orphaned top-level
visual-source clients `app/PatternsClient.tsx`, `app/PursuitsClient.tsx`, and
`app/WeavesClient.tsx` after their routes became direct Organize redirects.
It also removed their dead route-only CSS from `app/globals.css` while keeping
`.loom-pursuit-detail*` for the hidden direct pursuit detail route. Red/green
evidence: the focused cleanup suite first failed on the lingering files and
selectors, then passed 76/76 after deletion. This is not route deletion:
`app/patterns/page.tsx`, `app/weaves/page.tsx`, and `app/pursuits/page.tsx`
remain compatibility redirects and the deletion registry remains blocked
pending release-cycle evidence. Wider gates passed: `npm run test:contracts`
433/433 and `npm run typecheck`.

The 15:21 AEST legacy-surface cleanup removed the orphaned
`app/WorkbenchClient.tsx` implementation after `/workbench` became a direct
redirect to `/draft`, then removed its dead `.loom-workbench*` CSS from
`app/globals.css`. Red/green evidence: `tests/new-loom-skeleton-contract.test.ts`
first failed on the lingering file, then passed 51/51 after deletion. This is
not `/workbench` route deletion: `app/workbench/page.tsx` remains the
compatibility redirect and the deletion registry remains blocked pending
release-cycle evidence. Wider gates passed: `npm run test:contracts` 433/433
and `npm run typecheck`.

The 15:23 AEST legacy-surface cleanup removed the orphaned
`app/ContentsClient.tsx` implementation after `/contents` became a direct
redirect to `/sources`, then removed its dead `.loom-contents*` CSS from
`app/globals.css`. Red/green evidence: `tests/new-loom-skeleton-contract.test.ts`
first failed on the lingering file, then passed 51/51 after deletion. This is
not `/contents` route deletion: `app/contents/page.tsx` remains the
compatibility redirect and the deletion registry remains blocked pending
release-cycle evidence. Wider gates passed: `npm run test:contracts` 433/433
and `npm run typecheck`.

The 16:15 AEST legacy-surface cleanup removed the orphaned
`app/AtelierClient.tsx` implementation after `/atelier` became a direct
redirect to `/draft`, then removed its dead `.loom-atelier*` CSS from
`app/globals.css`. Draft owns quote insertion, provenance, native-backed
storage, and AI continuation, so the old localStorage-backed composition
surface was implementation residue. Red/green evidence: focused tests first
failed because `app/AtelierClient.tsx` still existed, then passed 54/54 after
deletion. This is not `/atelier` route deletion: `app/atelier/page.tsx`
remains the compatibility redirect and the deletion registry remains blocked
pending release-cycle evidence.

### Batch 4: Runtime Boundary

Goal: reader/snapshot/capture runtime routes stay buildable but are not user-facing categories.

Required work:

- Keep `/loom-render/*` isolated.
- Ensure reader artifacts are addressable from Sources and Draft references.
- Keep legacy flat-frame fallback until old captures are migrated or recaptured.
- Keep reader and snapshot back links return to `/sources` / Sources,
  not the runtime `/loom-render/captures` landing.
- Keep installed native reader chrome wired to Sources, not just relabeled:
  the native Sources button must select Sources and clear the runtime
  reader state instead of revealing the hidden Captures list.

Gate:

```bash
npm run test:capture-interactive:export
npm run verify:flipdisc-live-handoff
```

Latest evidence for this runtime-boundary slice: `npx tsx --test
tests/captures-landing-refresh-contract.test.ts
tests/new-loom-skeleton-contract.test.ts` passed 55/55, `npm run
test:contracts` passed 252/252, `npm run typecheck` passed, Debug Xcode build
passed, `npm run app:user` installed
`/Users/yinyiping/Applications/Loom.app`, and Computer Use verified the
installed reader's native Source Index button returns to the real Organize
Source Index with visible `DELETE` actions instead of the hidden runtime
Captures list.

### Batch 5: Deletion Candidate Review

Goal: remove or archive compatibility routes only after their behavior is either replaced or intentionally retired.

Executable gate: `lib/new-loom/legacy-route-deletion.ts` exports
`NEW_LOOM_LEGACY_ROUTE_DELETION_REVIEWS`, `getLegacyRouteDeletionReview`, and
`listLegacyRoutesReadyForDeletion`. The registry must cover every
`NEW_LOOM_LEGACY_ROUTES` entry, and the current expected ready list is empty
because no route has shipped hidden for one release cycle yet.

Deletion candidates must pass this checklist:

- Not linked from `/`, native root, Source Index, Draft, or capture reader.
- Not required by tests, build, app store, or docs.
- Replacement behavior exists in Sources / Studio / Digital Me or is explicitly declared obsolete.
- One release cycle has shipped with the route hidden.

## Non-Negotiables

- Do not rename internal files just to make names look clean. Product language matters more than file names in Phase 1.
- Do not delete old routes while the current staged Phase 1 slice is still under verification.
- Do not treat passing static route tests as proof of product migration; installed app and real capture behavior still matter.
- Do not use screenshot fallback for the remaining Atlas UI/native gate unless the user explicitly authorizes it.

## Latest Evidence

2026-05-09 18:00 AEST:

- Source Index writing continuations now use literal state language in the
  Organize surface: non-tidied records render as `draft notes` instead of
  `scratch`, while tidy records still render as `draft ready`. This is a
  visible-language cleanup only; the Cowork migration store remains available
  as input data for Draft migration.
- Red/green evidence: `npx tsx --test
  tests/knowledge-home-source-library.test.tsx` first failed on the rendered
  `scratch` label, then passed 22/22 after the label changed. Wider gates also
  passed: `npm run test:contracts` 441/441, `npm run typecheck`, `git diff
  --check`, and `git diff --cached --check`.
- Installed gate also passed: `npm run app:user`, `npm run app:smoke`, and
  `npm run app:where` for `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T08:02:40.692Z`. Installed `sources.html` contains `draft notes`;
  after relaunch, Computer Use verified the app as `pid 76844` with Source
  Index and existing `DRAFT` / `Delete` capture actions intact. The current
  user dataset has no Continue writing row, so the literal label is verified by
  render contract and installed resource evidence.

2026-05-09 18:15 AEST:

- Native Keyboard Shortcuts help now follows the same literal Draft migration
  language. The old `Cowork (rehearsal)` help group is renamed to
  `Draft editing`, and the remaining visible `scratch` help labels are replaced
  with `draft notes` / `draft-note` wording.
- Red/green evidence: `tests/new-loom-skeleton-contract.test.ts` first failed
  on the old Keyboard Help group title, then passed 53/53 after the native help
  copy changed. Wider gates passed: `npm run test:contracts` 441/441,
  `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.
- Installed verification passed through `npm run app:user`, `npm run
  app:smoke`, and `npm run app:where` at `2026-05-09T08:08:09.945Z`. Installed
  binary string checks found the new screenshot/draft-note labels and did not
  find the retired help strings. The subsequent Computer Use window read was
  blocked by the macOS session locking again (`IOConsoleLocked=Yes`,
  `CGSessionScreenIsLocked=Yes`), so that retry is recorded as a session
  boundary rather than a product-language failure.

2026-05-09 18:40 AEST:

- Native Draft Markdown sidecars can now be external edit sources while the JSON
  index still exists. `LoomDraftStore.list()` compares UUID-named sidecar
  modification dates to `Drafts/drafts.json`; a clearly newer changed sidecar
  updates the draft title, body, and references, while preserving the draft id
  and creation date.
- Red/green evidence: the new focused
  `LoomDraftStoreTests/testDraftsReadNewerMarkdownSidecarEditsWhenIndexStillExists`
  first failed because JSON still overrode the edited sidecar, then passed after
  sidecar merging was added. Full `LoomDraftStoreTests` passed 13/13; `npm run
  test:contracts` passed 441/441; `npm run typecheck` and both diff whitespace
  checks passed.
- Installed verification: `npm run app:user`, `npm run app:smoke`, and `npm run
  app:where` passed for `/Users/yinyiping/Applications/Loom.app` at
  `2026-05-09T08:43:17.008Z`. The old running process was relaunched, and
  Computer Use read the new installed process `pid 97697` with Source Index
  `DRAFT` / `Delete` controls plus the Draft surface with saved content,
  References, AI draft, and Draft board.

2026-05-09 20:17 AEST:

- Phase 6 Draft AI prompt context now has corpus-resolved inline `@` references.
  Attached Draft references still win, but unmatched `@target` mentions can
  resolve against selected corpus hits by title/href/category/sourcePath and
  emit `source=Corpus: ...` lines into the AI prompt. Native Draft mirrors the
  same behavior for compose and inline edit.
- This does not yet remove any legacy routes and does not close the visual `@`
  autocomplete/search picker requirement.
- Verification passed: `npm run test:contracts` 452/452, full
  `LoomDraftStoreTests` 18/18, `npm run typecheck`, and both diff whitespace
  checks. Installed verification also passed via `npm run app:user`, `npm run
  app:smoke`, and `npm run app:where` at `2026-05-09T10:16:40.929Z`.
  Computer Use read the relaunched installed app process `pid 42206`, confirmed
  Organize Delete controls on Recent captures, and opened the Draft surface with
  Flipdisc references plus AI controls.

2026-05-09 20:26 AEST:

- Phase 6 `@` references now also have a first visible insertion workflow. Web
  Draft exposes an `@ Reference` search picker that inserts a stable `@token`
  and attaches the selected source reference; native Draft exposes a
  `Reference` sheet using the shared doc picker and matching
  `LoomDraftReferenceMention` mapping.
- This still does not justify deleting legacy reference/search surfaces on its
  own: the `@` flow now has explicit insertion plus first inline ranking, but
  the broader remaining gap is the future predicted-next-reference model and
  more installed-app UI acceptance after the next rebuild.
- Verification before install passed: focused TS draft-storage 18/18, skeleton
  contract 59/59, selected Swift insertion test 1/1, `npm run test:contracts`
  452/452, full `LoomDraftStoreTests` 19/19, `npm run typecheck`, and both
  diff whitespace checks.

2026-05-09 20:36 AEST:

- Installed-app Computer Use acceptance found the native Draft `Reference`
  sheet initially opened with an empty candidate list. Root cause: the shared
  `DocReferencePicker` was using `URLSession` for `loom://bundle/search-index.json`
  in native SwiftUI, instead of the native `LoomLocalResourceLoader` path.
- The native reference picker now loads candidates through
  `AskAIDocReferenceIndex` / `LoomLocalResourceLoader`. After reinstall,
  Computer Use verified installed process `pid 55498`: the sheet populated with
  search-index candidates, and selecting `15 · Multimodal` inserted
  `@multimodal` plus a visible `Source 15 · Multimodal` reference.
- This strengthens the Draft replacement evidence but still does not complete
  the broader predicted-next-reference model.

2026-05-09 20:48 AEST:

- Phase 6 `@` references now have the first inline autocomplete/ranking slice.
  Web Draft detects an active `@query` at the textarea cursor, opens the same
  source-index-backed candidate surface, ranks docs by stable token/title/href/
  category/sourcePath/excerpt, skips already-attached references, and replaces
  the active query with the selected stable `@token`.
- Native Draft mirrors the query detection and ranking in
  `LoomDraftReferenceMention.activeQuery(...)` / `.rank(...)`, preloads the
  bundle search index through `AskAIDocReferenceIndex`, and shows a ranked
  candidate panel directly under the editor while typing `@`.
- Red/green evidence: focused TS draft-storage first failed on missing
  `activeDraftReferenceMention` / `rankDraftReferenceCandidates`; selected
  Swift first failed on missing `activeQuery` / `rank`. After implementation,
  TS draft-storage passed 20/20, selected Swift passed 1/1, full
  `LoomDraftStoreTests` passed 21/21, `npm run typecheck` exited 0, and the
  skeleton contract passed 59/59 after matching the implementation call path.
- Installed-app evidence then passed through `npm run app:user`, `npm run
  app:smoke`, and `npm run app:where` at `2026-05-09T10:51:12.742Z`. The stale
  pre-install process was relaunched; Computer Use read installed process
  `pid 62626`, confirmed visible Organize `DELETE` buttons without clicking
  them, and verified Native Draft shows a `Reference autocomplete` panel with
  ranked candidates while typing a temporary `@fl` query. The temporary query
  was removed and the draft remained saved.
