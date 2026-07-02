# LOOM Workbench Upgrade — Master Framework

**Date:** 2026-07-02
**Status:** Proposed to owner (this is the "更高框架的升级设计" requested before any implementation)
**Inputs:** 8-area code audit + 3-lens planning panel (system-architecture / product-frame / migration-governance), 2026-07-02 workflow run; design canon (`docs/canon/LOOM_DESIGN_DISCIPLINE.md`); owner directives of 2026-07-02 (workbench = IDE grammar = app root, native SwiftUI first); QBook reference prototype (`optibook-replica` branch `qbook-reflection-notebook`).

## 1. Thesis

**LOOM becomes an IDE for understanding.** The native file apps (Preview, Word,
Excel, browser) are the "runtime"; LOOM is the development environment wrapped
around them, where understanding is captured, versioned, reviewed, integrated,
and published. The VSCode shell grammar carries the workbench; the center
document is THE BOOK (读厚→读薄→融会贯通→呈现).

**The audit's verdict: comprehensively upgradable, and cheaper than it looks.**
The debt is concentrated — one 4,288-line file and one persistence format —
while the genuinely hard native plumbing (sandboxed app + entitlement-free XPC
anchor helper, 0.9s hard timeouts, launch-race relays, ⌘⇧U Service, JSON
mirror safety net) is correctly designed and gets treated as a **frozen
boundary**, not a rebuild target.

All three planning lenses independently converged on the same highest-leverage
move: **replace the rendered-English-sentence store with a typed, versioned
domain model.** Every ambition downstream — THE BOOK, OUTLINE/TIMELINE,
correction-as-revision, open-conditions, the principle store, the Learning
Record export, web parity — is a *query over typed traces*, and none of those
queries can be written against sentences re-parsed by substring scanning.

## 2. Six-layer architecture

Each layer depends only on layers below it.

| Layer | Name | Status | Content |
| --- | --- | --- | --- |
| L0 | Native integration | **Built + verified — FROZEN** | ⌘⇧U Services capture chain · loom:// AppleEvent relays with token dedup · LoomAnchorHelper XPC (sandboxed app / non-sandboxed helper, 0.9s timeout) · revealAnchor round-trip |
| L1 | Domain model (`LoomDomain`) | **New — the load-bearing move** | Typed, schemaVersion-stamped Codable entities (§3). English copy becomes a render function, never data. |
| L2 | Versioned persistence | New | File-primary atomic store (App Support JSON), defaults demoted to bootstrap pointer; newer-wins conflict rule closes the preference-domain split; lossless one-time migration with pre-migration backup; every failure logged + surfaced (no more silent `try?`). |
| L3 | Workbench shell | New (grammar proven in QBook prototype) | Native SwiftUI, app root: Explorer = initiations · tabs = open cases · center = THE BOOK · OUTLINE = book structure · TIMELINE = passes, folded · right = Evidence · status bar = anchor/capture honesty · palette = LOOM actions. |
| L4 | Presentation & export | Partial (generator exists in a verify script) | Notebook-register document (Colab benchmark + surpass layer); Learning Record export (RESEARCH_REPORT anatomy) lifted into product. |
| L5 | 融会贯通 (Memory/Reuse) | **Does not exist — designed here, not retrofitted** | Cross-project Principle store with user-confirmed promotion gate, constrained conclusions, citations, and quiet re-fire during later reading. |

## 3. Domain model (L1 entity schema)

All Codable, `schemaVersion`-stamped. This vocabulary IS the product's stage
vocabulary:

- **LearningProject** `{id, title, kind: .learningPass | .productReflection, createdAt/updatedAt, sourceIDs, documentIDs, isSample}` — kills the 27-occurrence `"Learning pass"` magic string.
- **LearningDocument** (case/tab) `{id, projectID, title, status: CaseStatus enum, entries ordered, passIDs, dates}` — kills free-string status ("Second pass ready" …).
- **Entry** (cell) `{id, documentID, sectionRef (chapter/page ordinal → OUTLINE), order, content: .capture(CaptureTrace) | .authored(String), passID, createdAt}`.
- **CaptureTrace** `{material verbatim, sourceID, anchor, evidence[], capturedAt, appName, honesty {weakAnchor, fallbackNote}}`.
- **Anchor** `{precision: .fileCell > .filePage > .file > .windowPage > .window > .none, sourceID, page?, cell?, documentTitle, axTrusted, mismatch?}` — the existing honesty ladder as an ordered enum; wrong-window downgrade is a typed field.
- **Annotation** `{entryID, kind: .meaning | .correction | .question | .principle, body, passID, supersedes? (correction-as-revision chain), openCondition {text, state: .open|.met|.retired}?}`.
- **Pass** `{documentID, index, kind: .firstRead|.review|.synthesis, userInitiated}` — **machine synthesis may never create or auto-advance a Pass** (kills auto-"Second pass ready"; suggestions are computed on read, rendered as Loom's marginal voice, never persisted as the user).
- **Principle** (workspace-level, case-independent) `{statement, constraints[], sourceAnnotationID, citations[{documentID, entryID, anchor}], promotedAt, status: .candidate|.promoted|.retired, reuseEvents[]}` — the 融会贯通 substrate. Invariant: **a principle can never be more confident than its weakest citation's anchor rung.**

The same schema is exported once (generated JSON Schema / TS types) and
consumed by BOTH Swift and web — no second parser, ever. A contract test pins
schema + bridge-handler names across the seam.

## 4. The upgrade arc — six stages, each independently landable

> 地基 → 骨架 → 血肉 → 灵魂 → 大扫除贯穿其间;学习环路(⌘⇧U → meaning → review)在每一阶段结束时都在真实数据上可用。

### Stage 0 — Governance floor(测试说真话)*~2 days, zero product change*
Glob-based test runner replaces the hand-maintained 89-of-176-file list (+
zero-orphan guard test); triage the 14 rotting orphaned failures; resurrect
lint (eslint flat config — `next lint` was removed in Next 16.2.9); add
LoomTests (`xcodebuild test`, 351 tests) + lint + `tsc --noEmit` to CI, all
keyed on exit codes.
**Exit:** CI runs ~1,036 web + 351 native tests + lint + typecheck, all green, on every push. Rollback = revert infra commits.
**Why first:** every later stage's exit criteria must be machine-checkable; today 87 test files (14 already failing) run nowhere — reordering this ships the data migration blind.
**LANDED 2026-07-02:** commits `0070c64…48f9405`, CI run 28585997522 green
(verify: lint + fast typecheck + 1,027 contract tests; macos-app-smoke: now
RUNS LoomTests). Field notes: two orphaned concurrency tests were silently
writing into the real user-data root (quarantine decision pending with owner)
and carried a setImmediate-spin waitFor that starved on the CI runner — both
deflaked with real-time polling + hermetic teardown.

### Stage 1 — LoomDomain(领域模型 + 迁移,像素不变)
Extract model/store/parser/ingest out of the 4,288-line file into
`LoomDomain` (AppKit-free, shared into app + tests); implement §3 schema;
file-primary persistence; **one-time migration reuses the existing parsers**
to convert the owner's real snapshot (verified against a scratch copy of the
live container data, never the live domain); legacy blob renamed to a
timestamped backup key; single `@MainActor` workspace object injected into
both mount paths (ends dual-instance last-writer-wins).
**Exit:** migration round-trips real-data fixtures losslessly (counts identical, zero parser fallbacks); old binary + backup still loads (rollback proven); grep proves no substring parsing in any persistence path; UI pixel-identical; owner lives on the migrated store with ⌘⇧U all day.

### Stage 2 — THE BOOK(中心先于外壳成为诚实的文档)
The center passes cover-the-chrome for EVERY case kind before any shell
chrome: RESEARCH_REPORT anatomy (provenance box, scope-first, honest inline
caveats, constrained conclusions) derived from typed traces; corrections
render as revisions; open-conditions persist and render; composer = commit
affordance with four type chips (Meaning · Question · Correction ·
Principle) driving `ReflectionCommitFocus`; machine self-narration killed.
**Exit:** computer-use screenshot review shows no "N versions" header anywhere by default; document-assembly logic table-driven-tested; owner does a real second pass in it.

### Stage 3 — Workbench root flip(骨架,带回滚旗)+ Cull tranche 1
Native SwiftUI shell per L3 grammar reading ONLY LoomDomain; root flip behind
a persisted flag (old Reflection root mountable for one release cycle, both
roots share the one store — flipping back loses nothing); capture relay
contract-tested against the new mount path so ⌘⇧U cannot silently drop.
In parallel once the **keep-list contract test** lands (Info.plist NSServices
⌘⇧U · loom:// CFBundleURLTypes · document types · XPC target): cull the
~9,000+ lines of never-mounted native web-era UI (ContentView 3,675 lines,
LoomDossierRootView, LoomMinimalRootView, DevServer construction) + first web
legacy tranche + dead CSS (~346 orphaned globals.css selectors), tests culled
in the same commits.
**Exit:** cover-the-chrome on a real multi-source project in the workbench (owner-judged); flag-off restores the old root on identical data (tested); full CI matrix green after every cull commit; sidecar preflight still passes all 10 static checks.

### Stage 4 — 融会贯通(唯一还不存在的产品层)
Cross-project Principle store per §3; promotion is a user-signed gate that
inherits anchor honesty (weak-anchor candidates blocked — negative path
tested); quiet-dot re-fire on capture ingest / case open (source + term
overlap first; semantic matching later, never a blocker); OUTLINE grows a
Principles back-matter section; TIMELINE records promote/revise/retire.
**Exit:** E2E on real data — promote in project A, see the quiet dot in project B, cite it into B's document, origin trace one click away.

### Stage 5 — 呈现 outward + live E2E closure
Learning Record export lifted from `verify-native-sidecar.mjs` into product
(menu/palette action → Markdown + A4 PDF, full anatomy, ⚠️ rows deep-link back
to traces); web /reflection becomes a true mirror of the same typed store via
the native JSON bridge (hardcoded demo demoted behind an explicit flag; regex
parsers deleted); helper Accessibility grant UX ("Page-precise anchors: off"
status row + Privacy deep link — no more silent degrade); wrong-window guard
unit-tested; fresh post-helper computer-use verification artifact asserting
`file+page` precision (replacing the stale pre-helper claim).
**Exit:** a real study pass exports a Learning Record that passes the hand-to-a-professor test; a native ⌘⇧U capture appears on web with zero sentence parsing; post-helper GUI artifact green.

## 5. Frozen boundary (consolidated DO-NOT-TOUCH)

- ⌘⇧U Services entry, synchronous `kAEGetURL` registration in
  `applicationWillFinishLaunching`, persisted relays + token dedup,
  CaptureURLRouter payload — pinned by 13+ tests; behavior-preserving
  refactors only, re-verified E2E after any phase touching call sites.
- LoomAnchorHelper architecture: app sandboxed, helper entitlement-free,
  `[String:String]` XPC contract, 0.9s hard timeout. The sandbox split is
  correct — do not "fix" it.
- Anchor-precision honesty semantics: the ladder, weak-anchor disclosure, and
  never promoting a claim beyond its evidence rung — carried verbatim into the
  typed model and inherited by the principle gate.
- Anti-pollution rules: LOOM never writes into original files; verification
  artifacts stay in gitignored `.codex/`.
- Real user data: the existing defaults blob and App Support mirror are
  read-and-backup-only during migration — never deleted, never rewritten in
  place.

## 6. Reorder hazards (why this sequence)

- Migration before governance floor → real trace data rewritten against a
  harness that silently skips already-red capture-reader/native-mirror tests.
- Shell before model → the workbench regex-parses sentences; every copy edit
  keeps being a data migration; TIMELINE/OUTLINE have no typed substrate.
- Shell before BOOK → chrome around a version list; fails the owner's
  cover-the-chrome test at root-flip acceptance.
- Cull before keep-list pin → risks the load-bearing plist/Service/scheme
  registrations (silent breakage class: fresh installs lose extension capture).
- 融会贯通 before typed citations → principles can't cite stable trace IDs.

## 7. Standing acceptance instruments

Per-surface smell tests (written into the design handoff as the acceptance
instrument, judged with chrome covered): CENTER "a professor could read
this" · COMPOSER "a commit dialog, not a chat box" · EVIDENCE "one calm line,
details folded" · EXPLORER "a list of things I set out to learn" · OUTLINE
"the book's table of contents with my understanding woven in" · TIMELINE "a
study log, closed until asked" · STATUS BAR "an instrument, it tells me the
truth about anchor quality" · EXPORT "hand it to a professor with zero
explanation".

## 8. Landing record (2026-07-02 → 03 all-stages sprint)

- **Stage 0 LANDED** `0070c64…48f9405`, CI 28585997522 green.
- **Stage 1 LANDED** `9508fbe…1ae7337`, CI 28592502347 green. Real-data
  migration verified (global-domain mirror migrated with byte-identical
  backup; container migrates on next app launch, same machinery).
- **Stage 2 LANDED** `406050d` — provenance box + scope line,
  corrections-as-revisions, composer type chips, open-condition rendering,
  machine self-narration killed (synthesis computed on read; pass advances
  only on user review commits).
- **Stage 3 shell LANDED** `eb11f2a` — tab strip, OUTLINE/TIMELINE at the
  Explorer's foot, WorkbenchStatusBar (anchor honesty + visible status),
  rollback flag `loom.workbench.chrome`; keep-list contract test landed.
  **Cull tranche DEFERRED-PACKAGED**: docs/superpowers/plans/
  2026-07-03-cull-tranche-1-package.md (agent-verified, 3 vetoes corrected,
  extract-first list, LoomApp prune map) — execute as its own focused
  session; the keep-list guard already protects it.
- **Stage 4 LANDED** `162080d`+`ad50459` — ReflectionPrincipleStore with
  user-signed promotion gate (weak anchor BLOCKS, tested), quiet-dot reuse
  suggestions, Cite events, PRINCIPLES sidebar section.
- **Stage 5 LANDED** `83f03a6` — live typed-snapshot endpoint + web mirror
  hydration (no second parser on the mirror path), web commit grammar
  parity, Export Learning Record… (⌘⇧E, full report anatomy), weak-anchor
  grant UX deep-linking Privacy › Accessibility.
- **Deferred with eyes open:** cull tranche execution (packaged);
  full reflectionModel.ts regex-parser deletion (web mirror bypasses it in
  the app; fate table in the Stage-5 parity package);
  post-helper GUI E2E artifact — needs the owner's unlocked session:
  1. Grant Accessibility to LoomAnchorHelper (status bar now deep-links).
  2. `npm run verify:native-sidecar -- --screenshots`
  3. Confirm the report asserts anchor precision=file+page on the PDF trace.

## 9. Open items feeding this framework

- Native legacy cull inventory: standalone audit in flight (file-level
  reachability from the mounted root); its output finalizes the Stage 3 cull
  list. Preliminary figure: ~9,000+ never-mounted lines.
- Spec hygiene (fold into Stage 0/3 commits): PRD acceptance list numbers 11
  and 18 duplicated; five 2026-05-* pre-pivot docs to move to archive.
