# Loom Workbench — The Complete Design

**Date:** 2026-07-03
**Status:** Proposed to owner (the complete 方案 requested after the course
correction; supersedes the piecemeal workbench notes in the framework doc §8)
**Method:** 4-dimension design panel (learning loop · document system ·
interaction model · platform architecture) + completeness critic; 11
contradictions resolved, 13 holes triaged. Full panel outputs archived in the
session task store; this document is the synthesis and the single source of
truth.

---

## 0. Soul, skeleton, center

**Loom is a lab notebook with an IDE's skeleton and a manuscript at its
center.** The native apps (Preview, Word, Excel, browser, editors) are the
runtime where reading and writing happen; the workbench is where
understanding is filed, revised, signed, reused, bound, and tested.

Not a VSCode clone, not a Colab clone. Taken from VSCode: the five-zone
skeleton, density, quick-open. Taken from Colab: a living, growing document
as the center. Loom-only, which neither has: anchors that reveal the original
page, corrections as struck revisions, questions as open positions with
close conditions, a signed promotion gate into cross-project memory,
anchor-honesty instrumentation, and a capture key that files the world
directly into the book.

The learning arc the workbench serves end-to-end:
**文字 → 代码 → 可视化 → 实战** inside **读厚 → 读薄 → 融会贯通 → 装订**.

## 1. The ten load-bearing decisions

1. **The web manuscript is the ONE center.** The SwiftUI book demotes to a
   flagged fallback at M3 and is culled at M5. Native keeps everything below
   the glass (stores, capture chain, XPC reveal, exports, window chrome); the
   web workbench owns everything visible. No feature ships in the SwiftUI
   book from now on.
2. **One append-only record stream; all state derived on read; only
   user-signed writes persist** — and the bridge exposes no operation that
   could violate this. Project status, pass boundaries, open positions,
   revision pairing: all projections of the log, never fields.
3. **Capture routes by file identity + a capture-time HUD; no inbox exists
   anywhere.** A claimed file auto-files; an unclaimed file asks at capture
   (Enter = create project named after the file, ↑↓ = pick). Nothing lands
   unfiled; nothing is dropped.
4. **Two block families with one visual law.** EVIDENCE (the world's words):
   bordered card + 52px mono anchor gutter; clicking the gutter always
   reveals the original. OWNED (the owner's words): bare serif prose, no
   card. The manuscript is non-runnable; code hands off to practice.
5. **Promotion is a two-layer signed gate.** Principle-chip commit = case
   CANDIDATE (Conclusions). `Promote ↑` opens the gate sheet: editable
   statement, REQUIRED holdsWithin, anchoring trace + precision badge, one
   signed button. `blockedWeakAnchor` is a first-class state whose only
   repair is reveal → re-capture at file+page. **No override.**
6. **Practice closes the loop with signed verdicts.** A run's metrics are
   evidence; a practice-outcome block enters the book only when the user
   signs a verdict sentence, citing the principles it tested. Verdicts append
   `outcomeEvents` to those principles — memory accrues a track record.
7. **Capture-to-flash < 500ms.** Store bumps a monotonic `seq` on every
   mutation and pushes a `loom-native-event`; the web fetches a delta and the
   quote block materializes at its book position with a 240ms filing flash
   (bottom-edge pill "↓ filed at p.12" when off-screen; reduced-motion
   variant: no animation, pill only).
8. **One document, three lenses.** Recall blanks only owned text; time travel
   filters by sequence AND reverts later state (corrections un-strike,
   renamed chapters revert); stage filter hides kinds. Lenses transform the
   same document — never rebuild it.
9. **schemaVersion 2 typed payloads, no side stores.** `ReflectionTraceRecord`
   gains optional `payload.table/code/figure/gloss/practice` — additive; v1
   records render unchanged.
10. **Questions close only by signed closure records** (MET with cited
    evidence, or RETIRED with a reason; REOPEN allowed). Machine may only
    suggest "possibly met by #N — close?" computed on read.

## 2. Information architecture

```
Workspace
├─ Projects (user-INITIATED; born from a capture HUD or Import — never ⌘N,
│  never a file tree, never an inbox)
│  ├─ Sources (files claimed by the project; ONE primary claim per file
│  │  routes captures; secondary attachments render a Part but do not route)
│  ├─ Manuscript = the record stream rendered as a book
│  │  ├─ Parts (one per source, multi-source projects)
│  │  ├─ Chapters (page clusters; >2-page jump splits; titles upgrade
│  │  │  p.X–Y → user-signed names via click-to-rename)
│  │  └─ Entries: evidence blocks + owned blocks (see §4)
│  └─ Practice tabs (⚔ prefixed; simulation state persists per project)
├─ Principles (workspace-level store; candidates live in manuscripts,
│  promoted records carry citations + reuse/outcome track record)
└─ Bindings (装订 snapshots pinned at sequence N; exports)
```

**Project state is derived, never set:** Empty → Reading (≥1 trace) →
In Review (≥1 review-kind commit or explicit pass marker) → Settled (0 open
positions AND ≥1 conclusion) → Bound (a binding exists) → Bound+ (new commits
after binding). The old free-string `status` becomes a display projection.

## 3. The five zones (+ Evidence pane)

| Zone | Job | Refuses |
|---|---|---|
| **Stage rail** (52px) | The arc as navigation: 读厚/读薄/融会/装订/实战. Click = lens (thick=captures, thin=meanings/revisions/questions, weave=principles), 装订 = bind, 实战 = practice tab. 读薄 in Reading state offers "Start second pass" (turns on Recall, jumps §1, stamps a pass marker). | Becoming a feature drawer; badges/notification counts |
| **Explorer** (288px) | Initiated projects with derived-state meta + open-position counts; OUTLINE (book order, unread gaps inline); TIMELINE (time-travel slider with pass boundaries); PRINCIPLES (own + quiet-dot reuse suggestions). | File trees; inboxes; source rows (sources live in Evidence/doc actions) |
| **Tabs** | The working set. Kind-aware (manuscript \| ⚔practice), MRU cycle ⌃Tab, ⌘1–9 jump, ⌘W close (last never closes), pin = title-only. | Unbounded tab sprawl (working set, not history) |
| **Center** | The manuscript (§4). | Chat transcripts; version lists; runnable cells; machine text speaking as the user |
| **Status bar** (26px) | Six live instruments, each clickable: ⌘⇧U health (amber "offline — repair"), anchor-honesty dot+ratio (click filters weak anchors), today heartbeat (opens TIMELINE), open positions (cycles questions), store mode (path popover), transient status. | Decoration; passive text that lies about health |
| **Evidence pane** (300px, right; opens on selection) | One calm provenance sentence; folded Details (raw evidence rows, sequence, timestamps); actions row (Reveal · Cite · Revise · Close position); the revision chain. | Debug dumps; a second reader; being open by default |

## 4. The manuscript document system

**Head-matter:** serif title (renameable, signed) · mono provenance line
(sources · traces · anchored share · updated) · italic scope sentence ·
**coverage ruler** per source — a thin track of the source's pages, captured
pages as cyan ticks, gaps hollow; click a gap = reveal the original there
(读厚 progress made physical).

**Block taxonomy** (all records in the one stream; payloads schemaVersion 2):

| Block | Family | Gutter / form |
|---|---|---|
| Quote (text capture) | EVIDENCE | `p.N ↗`; serif body; ≤6 words renders as a 19px headword; data-focus renders mono. The next meaning on the same anchor attaches 8px below — the quote–meaning **spread** is 读薄's atomic unit |
| Table (Excel/CSV range) | EVIDENCE | `⌗ B2:E14`; a real `<table>` from structured payload (≤8 rows sampled at capture), right-aligned mono numerals, honest `… 214 more rows in the original`; reveal selects the range |
| Code (notebook/IDE capture) | EVIDENCE | `{ } L12–34` or `[cell 7]` + language badge; restrained ink-tinted syntax; **no run button** — one action: `Open in practice` (seeds the ⚔ tab); reveal opens the file at those lines |
| Figure/appshot | EVIDENCE | top-strip `Fig. §2.1` + anchor; max 620px; user-ownable italic caption; window-precision keeps the standing ⚠ *visual context only* |
| Translation receipt | EVIDENCE | slim ledger line: term serif-bold → gloss; machine gloss prefixed `≈`, dimmed, labeled evidence (persisted as the world's words, never as the user's) |
| Meaning | OWNED | bare serif prose + trailing `p.N ↗`; recall-blankable |
| Revision (correction) | OWNED | struck first understanding + corrected prose, cyan left rule; inherits the superseded entry's anchor |
| Question | OWNED | amber callout + `Open — closes when: …` + age in days; MET renders settled (tick, struck condition, "Closed by #N"); RETIRED renders grey |
| Conclusion (principle candidate) | OWNED | numbered in back-matter; promoted ones carry the quiet dot + "holds across N projects" |
| Practice outcome | OWNED+EVIDENCE | mono metrics strip (run id, params, PnL/error) + signed serif verdict + `run ↗`; enters the book ONLY via the verdict sheet |
| Source-missing state | — | gutter goes amber `source missing`; reveal offers relocate-via-bookmark; exports say "source no longer verifiable" |

**Back-matter, fixed order:** § Conclusions · § Open Positions (with close
conditions and ages; closed struck with their closers) · § Bindings (list of
snapshots).

**Typography — three voices, one grid:** Serif = the owner's/book voice
(title 27 / chapter 17 / prose 15/1.7 / captions 11 italic). Mono = the
evidence voice (anchors 10 / code 12.5 / cells 12) — *anything mono is
machine-checkable; anything serif is human*. Sans = chrome only. 8px vertical
grid; 760px measure.

**Document actions (three only, title-hover ⋯):** Rename project (signed) ·
Sources… (attach; removing archives the Part, traces retained) · Bind & export.

## 5. The learning loop (state machine)

1. **Capture** (⌘⇧U / Import / palette `:N` reveal-then-capture): claimed
   file → auto-files; unclaimed → capture HUD (Enter creates, ↑↓ picks).
2. **Catch:** filing flash at book position (<500ms); wrong book? — inline
   "Move…" for ~10s, or entry menu → Move to project (record ID + anchor
   preserved verbatim; `refiled` note appended).
3. **Meaning:** composer carries a visible **anchor-context chip**
   (last revealed/clicked quote; click to clear). Precedence: explicit
   @-token > context chip > unanchored. Chips vs grammar: prefix
   (`principle:` etc.) > trailing `?` > active chip; the chip row
   live-highlights what WILL be committed.
4. **Review (读薄):** implicit at first review-kind commit, or explicit via
   the rail's "Start second pass" (Recall on, pass marker stamped).
   Corrections inherit anchors and strike their targets.
5. **Positions:** questions age visibly; closure only by signed record
   (MET cites evidence / RETIRED gives a reason / REOPEN allowed); machine
   only suggests.
6. **Promotion (融会):** candidate → gate sheet → workspace store (§1.5).
7. **Re-fire:** quiet cyan dot at chapter margins and beside the send button
   when terms overlap a FOREIGN promoted principle; click → card (statement,
   holdsWithin, source, track record) → `Cite here` (dual-write: reuse block
   in this manuscript + reuseEvent on the principle) or `Open the thread`
   (two hops to the origin conclusion, then p.N ↗ to the original page).
8. **Binding (装订):** a snapshot pinned at sequence N via the Learning
   Record exporter — corrections render clean with a revision endnote;
   questions split MET / OPEN / RETIRED; conclusions carry citations and
   precision. Bind again later = Bound+ diff.
9. **Practice (实战):** ⚔ tab (QBook grounds as routes inside the same
   webview; client-side sim; fixture data from loom://bundle). A run is
   ARMED (which principles it tests, chosen up front) → executed → SEALED
   only by the signed verdict sheet → outcome block files into the book and
   `outcomeEvents` accrue to the tested principles.

**Empty states:** no projects → "Capture from any file with ⌘⇧U" + permission
ladder on first use (H1); empty project → coverage ruler of the claimed
source, all hollow; no anchors → status bar names the repair; all questions
closed → Open Positions register celebrates quietly ("all positions closed").

## 6. Interaction & input model (essentials)

- **Type-to-compose:** any printable key with no modifier focuses the
  composer. ⏎ = newline, **⌘⏎ = commit** (opens the gate sheet only from
  `Promote ↑`, per C3). ⌥1–4 set chips.
- **⌘P palette, sigil scopes:** none = mixed · `@` entries (current
  manuscript) · `#` principles (all projects) · `>` actions · `:12` go to
  page (honest about unread gaps) · `?` open positions everywhere.
- **⌘F find-in-document** (H5): highlights across both families; honest
  about matches hidden by the current lens.
- **Selection:** click/j-k selects one entry (cyan left rule) and opens the
  Evidence pane; ⏎ reveals; **⌘⏎ = cite-and-reply everywhere** (code block's
  open-in-practice is a click/dedicated key, per C8); `c` starts a correction.
- **Drags, exactly three:** entry→composer (cite token) · Finder
  file→explorer (attach source, native only) · tab reorder/pin.
- **Undo:** ⌘Z retracts the last mutation within 10 minutes as an appended
  `retracted` record (time travel keeps the arc). After the window:
  revise-only. Promotion withdrawal only while reuse/outcome events = 0;
  afterwards Retire/Amend.
- **Esc peels one layer:** overlay → composer blur (draft kept) → Evidence
  close → time travel to now → stage filter clear → Recall off.
- **⌘1–9 = tabs; ⌃1–⌃5 = stage rail** (C4); the native menu forwards the
  keymap generated from this section verbatim — one source of truth.

## 7. Platform architecture

- **Hosting:** `WorkbenchRootView.swift` = full-window WKWebView at
  `loom://bundle/workbench`; flag `LoomCenterMode ∈ {web, native-legacy}`;
  rollback = flip + reopen, no migration (stores shared). Debug loads the
  dev server. **Zero dynamic route segments** (static-export law); all state
  in query/hash.
- **Window chrome:** transparent titlebar + fullSizeContentView; traffic
  lights float over the tab band (web reserves ~78px left); native
  drag-strip over the tab band; `underPageBackgroundColor` = ink (no white
  flash); no vibrancy (settled); context menu only on text selection;
  frame autosave.
- **Bridge:** ONE versioned handler `loomWorkbench`, envelope
  `{v:1, id, op, payload}`; replies + native events as CustomEvents. READS
  stay on `loom://native/*` (snapshot, `…-delta.json?since=seq`, artifacts
  for figure payloads — new endpoint). WRITE vocabulary generated from §5's
  record kinds (C5): commit kinds incl. `closure`, `reuse`, `pass`,
  `chapter-title`, `project-title`, `refile`, `retracted`,
  `practice.outcome` (one name, C11), plus `principles.promote/amend/retire`,
  `source.attach/archive`, `project.create` (HUD). The bridge shape enforces
  the canon: no op can write machine text as the user.
- **Eventing:** monotonic `seq`; capture-while-open lands via event → delta
  fetch → filing flash. Optimistic commits reconcile on the next delta.
- **Budgets:** boot→interactive p95 < 800ms; snapshot ≤1.5MB @500 entries,
  parse+build <150ms; delta path mandatory >512KB; manuscript virtualizes
  >~200 blocks with anchor-stable scroll restoration.
- **Persistence:** canonical data native-only (records, principles, exports,
  bookmarks, keys). Web keeps only cosmetic prefs; boots fine without them.
- **Browser mode:** explicit demo sandbox ("Demo — nothing is saved");
  bridge-less actions disabled-with-explanation.
- **Boot/degraded (H8):** snapshot failure → boot-error surface naming the
  store path + retry; writes-fail → read-only banner mode.
- **Security:** only loom:// (+ localhost in Debug) load in-view; external
  links open in the default browser; path-traversal-guarded bundle serving;
  payload validation at the bridge.

## 8. Visual system

Ink scale `#080a0d → #0c0f13 → #0e1218 → #12161c → #171c23` with hairlines
`#1a2027/#232b34`; text `#e6edf3 / #aeb9c2 / #58636e`. **青芒 #4BC5DE is the
single signature accent** — reserved for: selection rules, § numerals,
promoted-principle dots, filing flash, anchor hovers. Amber `#d9a03f` = open
/ weak / attention only. Serif/mono/sans per §4. Contrast pass required at
the 10px mono sizes (H10) + reduced-motion variants for flash/animations.

## 9. Milestones & acceptance

| M | Scope | Acceptance |
|---|---|---|
| **M1** | Root flip behind flag (default native-legacy); migration mapping for the existing record corpus (H4) | Workbench loads in-app from bundle; existing projects render; rollback flips clean |
| **M2** | Bridge v1 complete (full §7 vocabulary) incl. capture-while-open eventing + Evidence pane + selection model | ⌘⇧U with workbench open → filing flash <500ms; commit/closure/promotion round-trip on real data |
| **M3** | Default flips to web; SwiftUI book behind debug flag; **one-week owner daily-driver soak**; first-run permission ladder (H1) | Owner lives in it; zero data anomalies; weak-anchor repair loop exercised live |
| **M4** | Practice grounds (QBook route) + ARMED→SEALED verdicts + outcome blocks; block payloads v2 (table/code/figure) | A principle promoted from reading is tested in sim and its outcome files into the book |
| **M5** | Cull: LoomReflectionRootView + SwiftUI book surfaces (per the packaged cull plan); ⌘F; settings pane (H6); data-safety surface (H9) | Suite green through the cull; keep-list contract intact; export-everything works |

**Standing smell tests:** Explorer "a list of things I set out to learn" ·
Manuscript "a professor could read this — with receipts" · Composer "a
commit dialog, not a chat box" · Evidence "one calm line, details folded" ·
Status bar "an instrument that tells the truth" · Binding "hand it over with
zero explanation" · Practice "the book sent me here; the results report back
to the book".

## 10. Owner decisions required

1. **Stage-rail language (H12):** 读厚/读薄/融会/装订/实战 as sanctioned brand
   glyphs (write the canon exception) — or English (Thicken/Thin/Weave/
   Bind/Practice)? The product is otherwise English-only.
2. **Shared-source policy default (H2):** primary-claim routing with HUD
   override — confirm.
3. **Browser/URL capture grammar (H3):** URL anchors (reveal = open URL +
   text fragment; precision grade below file+page) — v1 in scope or defer?
4. **`#` palette scope on ⏎ with a draft present:** insert cite token vs
   navigate — pick one.
5. **Single window (H13):** confirm refusing multi-window/split for v1
   (thread-hops instead).
