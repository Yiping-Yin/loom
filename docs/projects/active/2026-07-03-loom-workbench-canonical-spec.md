# LOOM WORKBENCH — CANONICAL SPEC v1.0
## "The Reading Instrument" — VSCode's skeleton, Loom's body
### Final synthesis · base = loom-identity · grafts from shell-faithful + fusion-radical applied · all judge-flagged contradictions resolved
Plain CSS modules + React, no canvas/WebGL. English-only UI. Dark ink only in v1 (Appendix B is the sole lawful light-theme path). Target: `/Users/yinyiping/dev/LOOM/app/workbench/` (`WorkbenchClient.tsx`, `workbench.module.css`, `workbenchModel.ts`). This document supersedes the three input designs; it is complete on its own.

---

## 1. Design thesis

VSCode's maturity is not its colors — it is its **grammar**: fixed pixel bands that never content-size, one hairline weight everywhere, exactly one 2px accent rail meaning "here", 26–44px row rhythm, zero motion, instant state snaps, and a chrome where every pixel measures the working object. We keep that grammar wholesale — titleband with command center and jump history, tab band, activity rail, explorer, status instruments — and re-derive every surface from Loom's material law: the five-step ink scale replaces grey chrome, 青芒 `#4BC5DE` replaces selection-blue as the *only* accent, and — the inversion that makes this a new instrument, not a theme — **the editor is replaced by a book**. Where VSCode centers a mono buffer surrounded by file chrome, this workbench centers a serif manuscript surrounded by *evidence chrome*: a page-wide 52px anchor margin whose one asymmetry law (marks in the margin are the source's; a blank margin is yours) makes provenance legible with zero labels; a coverage ruler that makes 读厚 physical; an overview ruler that maps what is read, open, and weak instead of miniaturizing pixels; an explorer of derived learning states instead of files; a drawn time-travel instrument instead of a scrollback; six clickable truth instruments instead of counters; and a composer that is a commit dialog — the target, the kind, and the full commit sentence visible *before* the commit. The three-voice type law (serif = the human's words, mono = machine-checkable evidence, sans = chrome) runs through every zone, so any pixel can be read for *who is speaking*. Against Colab the center wins by refusing to be a cell list: no run buttons, no in/out ping-pong, and — Colab's honest-map failure — a chrome that always shows what you have *not* read.

---

## 2. Layout tree (exact px)

```
.workbench                       height:100vh; display:grid;
│                                grid-template-rows: 40px 38px minmax(0,1fr) 28px;
│                                grid-template-columns: 64px var(--explorer-w,304px)
│                                                       minmax(0,1fr) var(--evidence-w,0px);
│                                background:#080a0d; color:#aeb9c2;
│                                font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",
│                                     ui-sans-serif,system-ui,sans-serif;
│                                min-width:1120px  /* desktop floor: window scrolls, never reflows */
│                                /* evidence open: --evidence-w:320px. Explorer resizable 240–420px. */
│
├── header.titleband             row 1, grid-column 1/5; height:40px; display:grid;
│   │                            grid-template-columns: 78px 64px 1fr minmax(280px,560px) 1fr 96px;
│   │                            align-items:center; background:#080a0d;
│   │                            border-bottom:1px solid #1a2027;
│   │                            -webkit-app-region:drag (all buttons: no-drag)
│   ├── .trafficReserve          78px empty — native traffic lights float here; never place UI
│   ├── .history                 two 28×26 buttons ‹ › (§3.1 jump history, ⌘[ / ⌘])
│   ├── (1fr spacer)
│   ├── button.commandCenter     height:26px; width:min(560px,100%) centered (§3.1)
│   ├── (1fr spacer)
│   └── .layoutToggles           two 24×24 glyph buttons, right padding 14px (§3.1)
│
├── header.tabBand               row 2, grid-column 1/5; height:38px; display:flex;
│   │                            align-items:stretch; background:#080a0d;
│   │                            border-bottom:1px solid #1a2027;
│   │                            -webkit-app-region:drag (tabs: no-drag)
│   ├── div.tab × N              min-width:180px; max-width:240px (§5.1)
│   └── button.tabOverflow       32px wide, right-aligned; drawn "⋯" → palette pre-filled ">Tab:"
│
├── nav.stageRail                row 3, col 1; width:64px; display:grid;
│   │                            grid-template-rows: 56px repeat(3,60px) 1fr repeat(2,60px);
│   │                            justify-items:center; background:#080a0d;
│   │                            border-right:1px solid #1a2027
│   ├── .moonMark                (56px cell) 26px realistic-moon photo asset, centered, no glow
│   ├── Collect / Distill / Weave  3 lens buttons (radio group)  ⌃1 ⌃2 ⌃3
│   ├── .railSpacer              1fr, min-height:48px
│   └── Bind / Practice          2 action buttons  ⌃4 ⌃5; a 24px-wide 1px #1a2027 rule
│                                centered above Bind separates lenses from actions
│
├── aside.explorer               row 3, col 2; min-width:0; overflow:hidden;
│   │                            display:flex; flex-direction:column;
│   │                            background:#0c0f13; border-right:1px solid #1a2027
│   ├── .explorerHead            height:40px (§5.2)
│   ├── section.PROJECTS         sticky 28px header + body: flex:0 1 auto; max-height:38vh; own scroll
│   ├── section.OUTLINE          sticky 28px header + body: flex:1 1 auto; min-height:0; own scroll
│   ├── section.TIMELINE         sticky 28px header + 68px instrument (flex:0 0 auto)
│   ├── section.PRINCIPLES       sticky 28px header + body: flex:0 1 auto; max-height:38vh; own scroll
│   └── .explorerResizer         5px invisible drag strip on right edge; cursor:col-resize;
│                                while dragging: 1px #4bc5de line at the seam; range 240–420px
│
├── main.center                  row 3, col 3; min-width:0; display:grid;
│   │                            grid-template-rows: minmax(0,1fr) auto
│   ├── div.docWrap              position:relative; min-height:0
│   │   ├── div.docScroll        overflow-y:auto; height:100%; background:#0e1218
│   │   │   ├── div.docBand      position:sticky; top:0; height:36px; z-index:3;
│   │   │   │                    background:#0e1218 (EXPLICIT — fixes the QBook
│   │   │   │                    transparent-sticky bug); border-bottom:1px solid #1a2027 (§4.1)
│   │   │   └── article.manuscript   §4.0 geometry
│   │   ├── div.overviewRuler    position:absolute; top:36px; right:10px; bottom:0; width:12px;
│   │   │                        z-index:4 (§4.6 — overlay sibling of the scroller, NOT inside
│   │   │                        the scroll content; fixes the sticky/float hack)
│   │   ├── .findBar             position:absolute; top:44px; right:24px; z-index:5 (§4.8)
│   │   └── .filedPill           position:absolute; bottom:12px; left:50%;
│   │                            transform:translateX(-50%); z-index:4 (§4.7)
│   └── form.composer            border-top:1px solid #1a2027; background:#0c0f13;
│                                padding:10px 24px 12px (§6.3)
│
├── aside.evidencePane           row 3, col 4; width:320px (0 when closed — the grid column
│                                collapses instantly, no animation); background:#0c0f13;
│                                border-left:1px solid #1a2027 (§6.1)
│
└── footer.statusBar             row 4, grid-column 1/5; height:28px; display:flex;
                                 align-items:stretch; padding:0 8px; background:#080a0d;
                                 border-top:1px solid #1a2027;
                                 font:10.5px "SF Mono",ui-monospace,Menlo,monospace; color:#58636e (§5.3)

Overlays:
.paletteScrim    position:fixed; inset:40px 0 28px;   /* below titleband, above status bar,
                 covering the tab band — VSCode quick-open DNA */
                 z-index:80; background:rgba(4,6,8,.55);
                 display:flex; align-items:flex-start; justify-content:center; padding-top:12px
.palette         width:min(640px, calc(100vw - 80px)); background:#12161c;
                 border:1px solid #232b34; border-radius:8px; overflow:hidden;
                 box-shadow:0 18px 52px rgba(0,0,0,.5) (§6.2)
.sheet           position:fixed; inset:0; display:grid; place-items:center; z-index:90;
                 scrim rgba(4,6,8,.6); panel width:480px; background:#12161c;
                 border:1px solid #232b34; border-radius:8px; padding:24px;
                 box-shadow:0 24px 64px rgba(0,0,0,.55)  — ONE anatomy, four uses (§6.4)
.popover         background:#171c23; border:1px solid #232b34; border-radius:6px;
                 box-shadow:0 10px 28px rgba(0,0,0,.5) — status popovers, tooltips, title menu
```

**Ink assignment law (the stylesheet's enforcement contract — memorize):** `#080a0d` = outer chrome (titleband, tab band, rail, status). `#0c0f13` = panels (explorer, evidence pane, composer, resting tabs). `#0e1218` = the reading surface + its gutters. `#12161c` = raised objects on the reading surface (evidence cards, active tab, palette). `#171c23` = floating objects (popovers, pills, find bar, palette selection). **Hover = one ink step up from resting; active = two steps + a 2px cyan rail** (steps cap at the top of the scale — when a surface already rests at `#12161c`, active is `#171c23` + rail). Hairlines: `#1a2027` (zone borders) / `#232b34` (in-surface: cards, inputs, dividers). Text: `#e6edf3` / `#aeb9c2` / `#58636e`. **No hex outside this section and the two charters (§7) may appear in the stylesheet; alpha variants of these exact hexes are permitted.** No other backgrounds exist.

**Motion law:** zero `transition` rules anywhere. The only `@keyframes` in the file is the 240ms filing flash (§4.7), with a `prefers-reduced-motion` variant. State snaps.

---

## 3. Zone-by-zone chrome

### 3.1 Titleband (40px)
| Element | Spec | Law |
|---|---|---|
| Traffic reserve | 78px empty drag region | platform; never place UI here |
| History ‹ › | 28×26px, transparent, glyphs 18px sans `#58636e`, hover `#aeb9c2`, disabled ends `opacity:.35`. ‹ = ⌘[ back, › = ⌘] forward | navigation is through the *book*, not files |
| Command center | `height:26px; width:min(560px,100%); display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid #232b34; border-radius:6px; background:#0e1218; box-shadow:inset 0 1px 1px rgba(0,0,0,.25)`; content: 13px drawn search glyph `#58636e` + active project title sans 12px `#aeb9c2`; hover `background:#12161c`; click opens the palette (empty query) | the label is the project, never "workspace" |
| Layout toggles | two 24×24 grid-centered buttons; glyph = 16×16 CSS square `border:1.5px solid #58636e; border-radius:2px` with `border-left-width:5px` (Explorer, ⌘B) / `border-right-width:5px` (Evidence, ⌘⌥B); when the zone is visible the glyph border is `#aeb9c2`; click re-templates the grid instantly | exactly two toggles — no "Customize Layout" menu, ever |

**Reveal-jump history discipline (the ‹ › contract).** Every **in-manuscript** reveal pushes an entry `{tabId, blockId, scrollTop}`: OUTLINE row click, TIMELINE pass-tick jump, palette Enter on an entry/page/open-position, overview-ruler mark click, back-matter register row click, status-bar open-position cycle, MET `Closed by §N` jump, CHAIN node click, filed-pill click, doc-band chapter click, "Start second pass" scroll. Reveals that leave the app for the native source (gutter chips, coverage-ruler cells, gap rows, `:N`-into-source) do **not** push. Ring buffer of 64; consecutive duplicates collapse; ⌘[ / ⌘] and the ‹ › buttons walk it; walking restores tab + scroll + selection flash.

### 3.2 Stage rail (64px)
| | value |
|---|---|
| Button | 64×60; `display:grid; place-items:center; row-gap:3px; border:0; border-left:2px solid transparent; background:transparent; color:#58636e` |
| Icon | drawn SVG 20×20, `stroke:currentColor; stroke-width:1.5; fill:none`. **Collect** = open book (two facing pages) · **Distill** = pen nib over a line · **Weave** = three interlaced strands · **Bind** = book spine with two stitch bars · **Practice** = crossed foils. Emoji are banned product-wide |
| Label | sans 10px, uppercase not required, color inherits |
| Hover | `color:#aeb9c2` — ink step only, **no background** (VSCode activity-bar stillness; this is the rail's sanctioned exception to the hover law) |
| Active lens | `border-left-color:#4bc5de; color:#e6edf3; background:rgba(75,197,222,.05)` |
| Actions (Bind / Practice) | never take the cyan rail (verbs, not lenses); while `:active` → `background:#0e1218`; no pulse animation. Bind opens the Bind sheet (§6.4); Practice opens/focuses the project's practice tab |
| Bind badge | project state ≥ Bound: 5px `#4bc5de` dot at the Bind icon's top-right corner |
| Keyboard | ⌃1–⌃5 in rail order; `focus-visible: outline:1px solid rgba(75,197,222,.4); outline-offset:-2px` |

Lenses are an exclusive radio group filtering the manuscript (Collect → capture kinds · Distill → meaning/correction/question · Weave → principle kinds); pressing the active lens again clears to the unfiltered book. The moon mark is a 26px **photo asset** (canon: realistic moon; no CSS fake, no glow ring) — a brand anchor, not a button. The "Start second pass" affordance lives in the doc band (§4.1), never on the rail.

### 3.3 Pointers
Tab band — §5.1 · Explorer — §5.2 · Status bar — §5.3 · Manuscript — §4 · Evidence pane / palette / composer / sheets / practice — §6.

---

## 4. The manuscript center (the living book)

### 4.0 Page geometry + the asymmetry law
Scroll surface `#0e1218`. The article:

```
article.manuscript   width:min(732px, calc(100% - 48px)); margin:0 auto;
                     padding:40px 0 120px;
                     background:linear-gradient(90deg,
                       transparent 0 51px, #1a2027 51px 52px, transparent 52px);
                     /* the continuous anchor-gutter hairline, full page height,
                        painted on the ARTICLE so it survives virtualization */
```

Every block is a row repeating the page's two-column template: `display:grid; grid-template-columns:52px minmax(0,1fr); column-gap:16px` — because both the gutter (52px) and gap (16px) are fixed px, nested grids align by construction; **no subgrid required**. Column 1 = the anchor margin (chips); column 2 = the text column (664px at full width). Head-matter, chapter heads, owned prose, and back-matter leave column 1 empty. **The asymmetry law: marks in the margin are the source's; a blank margin is yours.** This is the page's deepest legibility device and needs no labels. Vertical rhythm: 8px grid; default gap between blocks 24px (`margin:24px 0` on rows, collapsing in flow); the quote–meaning spread gap is 8px inside one row (§4.4). No box around the page — the measure, the margin, and the three voices ARE the book. One foreground object: nothing in chrome may exceed the manuscript's text contrast.

### 4.1 Doc band (36px sticky)
Left→right, `padding:0 16px`, gap 12px:
- **Project**: sans 11.5px `#58636e` — `Market Making · FINS3666` · **derived state** mono 10.5px `#58636e` — `Reading — pass 2`.
- **Locus (scroll-spy)**: `›` separators `#58636e`; **chapter** sans 11.5px `#aeb9c2` (click → scroll to chapter head; pushes history) `›` **p.N** mono 10.5px `#58636e`, hover `#4bc5de` (click → reveal source at that page; no push). Both track the topmost visible block.
- **Recall toggle** (visible only while the Distill lens is active): 20px pill, mono 10px, `border:1px solid #232b34`; ON → `border-color:rgba(75,197,222,.55); color:#e6edf3`.
- **Start second pass →** ghost (visible when state = Reading and no pass-2 marker): mono 10.5px `#aeb9c2`, hover `#e6edf3`; commits a `pass` record, enables Recall, scrolls to §1.
- **Time-travel state**: when the TIMELINE playhead ≠ present, the band's border-bottom becomes `1px solid #d9a03f` and appends mono 10.5px `#d9a03f` `viewing as of 14 Jun` + link `Return to present` in `#4bc5de`. While travelled the composer is disabled (§6.3).
- Right: **⌘F affordance** — drawn magnifier 12px `#58636e`, hover `#aeb9c2`; opens the find bar (§4.8).

### 4.2 Head-matter
1. **Title**: Georgia 27px/600 `#e6edf3`, `margin:0 0 6px`. Hover: `border-bottom:1px dotted #58636e` + a 24×24 ghost `⋯` button 8px right → popover menu (rows 30px, sans 12px `#e6edf3`, hover `#12161c`): **Rename · Sources… · Bind & export**. Click title = inline edit (same serif metrics, caret cyan); ⏎ commits a signed `project-title` record.
2. **Provenance line**: mono 10.5px `#58636e`, `margin:0 0 4px`: `2 sources · 21 traces · 18/21 page-anchored · updated 21:40`. Machine-checkable → mono, always.
3. **Scope**: italic serif 12px `#aeb9c2`: `Covers p.2–p.17 of Week 1 Notes.pdf.`
4. **Coverage ruler** (读厚 made physical), one per source, `margin:18px 0`:
   - Label row: mono 10px `#58636e`: `Week 1 Notes.pdf · 20 pages` (total parsed from `source.meta`).
   - Track: `display:flex; gap:1px; height:10px; margin-top:5px`; each page = one cell `flex:1; min-width:3px; border-radius:1px`.
   - Captured page: `background:rgba(75,197,222,.55)`, hover `.9`. **Page currently visible in the viewport (scroll-synced): full `#4bc5de`.** Uncaptured: `background:transparent; box-shadow:inset 0 0 0 1px #232b34` — hollow, honest.
   - Every cell is a button: click → reveal that page **in the source** (native bridge; no history push); hover tooltip (`.popover` pill, mono 10px): `p.7 — unread` / `p.4 · 3 traces`.
   - **Degraded form** (total unparsable): a 1px `#232b34` line with 2×10px `#4bc5de` ticks evenly spaced per captured page; label `coverage unknown — 6 pages seen`. Never invent extent.
5. **Parts** (multi-source only): serif 20px/600 `#e6edf3` `Part I — Week 1 Notes.pdf`, `margin:40px 0 8px`; each Part carries its own ruler; the chapter list nests under its Part. Web sources: the label row shows the domain set in mono; no page track.
6. Closing rule: `border:0; border-top:1px solid #1a2027; margin:26px 0` (on-palette; the `#1f262e` drift is dead).

### 4.3 Chapter heads
`margin:40px 0 12px; display:flex; align-items:baseline; gap:10px`, in the text column:
- **§ numeral**: mono 11px `#4bc5de` (`§2` — a chartered cyan use).
- **Named chapter**: serif 17px/600 `#e6edf3` + trailing `· p.2–4` mono 10px `#58636e`.
- **Unnamed chapter**: the auto range in mono 12px `#aeb9c2` (`p.2–4`) — machine voice, honest that no one has named it. Hover either form: dotted underline; click → inline rename; ⏎ commits a signed `chapter-title` record (serif thereafter). Time-travel before the record reverts the name.

### 4.4 Block taxonomy — exact anatomy

**Selection model (all blocks).** Click, or `j`/`k` (roving tabindex), selects exactly one block. Selected = an absolutely positioned rule on the block row: `left:59px; top:2px; bottom:2px; width:2px; background:#4bc5de` — drawn in the 16px gap column, 9px left of the text column, clear of both the gutter hairline and card borders; no layout shift. Selection opens the Evidence pane (§6.1) and sets the composer anchor chip. `⏎` reveal · `⌘⏎` cite into composer · `c` pre-fills the composer as a Correction with this anchor · `Esc` peels (§6.6). The OUTLINE row of the selected block carries the same rail (bidirectional).

**EVIDENCE family** (bordered card in the text column + anchor chip in the margin):
Card: `background:#12161c; border:1px solid #232b34; border-radius:6px; padding:12px 16px`. **Anchor chip** (margin cell): mono 10px `#58636e`, `justify-self:end; text-align:right; padding:14px 8px 0 0; white-space:nowrap; cursor:pointer`; may stack two lines (10px + 9.5px). Hover: `color:#4bc5de` and appends `↗`; click reveals the original via the bridge (no push). **Weak anchor**: chip `#d9a03f` with second line `window` mono 9px; tooltip `window precision — visual context only`; the ONLY repair is reveal → re-capture. **Source missing**: chip reads `missing` in `#d9a03f`, card at 60% opacity, one action bottom-right mono 10px `Relocate…` (native bookmark picker).

| Block | Chip | Body |
|---|---|---|
| **Quote** | `p.4` | serif 14.5px/1.65 `#e6edf3`. ≤6 words → headword: serif 19px/600, `padding:14px 16px`. `focus:data` → mono 12.5px/1.55 `#aeb9c2` (the green `#cfe6da` is dead). No permanent captions: the whisper `Explain it in your own words.` appears ONLY when the project has zero owned blocks, once, under the first quote, italic serif 11px `#58636e` |
| **Table** | `⌗` / `B2:E14` | real `<table>`, `width:100%; border-collapse:collapse`; `th` mono 10px uppercase ls .06em `#58636e`, height 26px, `border-bottom:1px solid #232b34`; `td` height 26px, `border-bottom:1px solid #1a2027`; numerals mono 12px right-aligned `#aeb9c2`, text cells sans 12px. Max 8 sampled rows, then footer row mono 10px italic `#58636e`: `… 214 more rows`. Chip click reveals the selected range |
| **Code** | `{ }` / `L12–34` or `[cell 7]` | top-right language chip mono 9px uppercase `#58636e`, `border:1px solid #232b34; border-radius:3px; padding:1px 5px`; body `padding:10px 14px`, mono 12.5px/1.55 with a 28px right-aligned lineno column `#58636e` when line info exists; **monochrome ink syntax**: keywords `#e6edf3` w600, strings `#aeb9c2` italic, comments `#58636e`, everything else `#aeb9c2`. **No run button ever.** Hover: single action top-right, mono 10px `#4bc5de`: `Open in practice ↗` |
| **Figure / appshot** | `p.6` | top strip 24px inside the card (`padding:0 12px; border-bottom:1px solid #1a2027`): mono 10px `#58636e` `Fig. §2.1` — plus standing `· visual context only` in `#d9a03f` when window-precision. Image `max-width:620px; display:block; margin:12px auto; border-radius:3px`. Caption italic serif 11px `#aeb9c2`, `padding:0 16px 12px`; click to write → the owner's caption commits and renders non-italic serif 12px `#e6edf3` |
| **Translation receipt** | `p.4` | no card — a ledger line in the text column, min-height 32px, `border-bottom:1px solid #1a2027`, grid `auto 1fr`: term serif 15px/600 `#e6edf3` · gloss: machine gloss prefixed `≈`, mono 12px `#58636e` + tag mono 8.5px uppercase `machine`; owner-rewritten gloss serif 14px `#e6edf3` (the `≈` and tag disappear — the human took ownership) |
| **Practice outcome** | `run ↗` (reveals the sealed run tab) | two parts. Metrics strip (evidence): `background:#0e1218; border-bottom:1px solid #1a2027; padding:8px 14px`, mono 11px `#aeb9c2`: `run 2026-07-02T21:40 · spread 1.2bp · size 3 · PnL +14.2u`. Below: the **signed serif verdict** 15px/1.7 `#e6edf3` + signature mono 10px `#58636e` `— sealed 2 Jul, pass 2`. Enters the manuscript ONLY via the verdict sheet (§6.4) |

**OWNED family** (bare serif in the text column — no frame, blank margin):

| Block | Anatomy |
|---|---|
| **Meaning** | serif 15px/1.7 `#e6edf3`; trailing ` p.4 ↗` mono 10px `#58636e`, hover `#4bc5de`, click reveals. **Recall lens**: each text line becomes a hollow line (`border-bottom:1px dashed #232b34; height:1.7em`); the anchor stays visible; click un-blanks that block only |
| **Quote–meaning spread** (读薄's atomic unit) | ONE block row containing the quote card plus every meaning committed on the same anchor, stacked 8px apart beneath it. **Alignment law (load-bearing, verify optically): the owner's first character sits exactly under the quote's first character** — spread meanings get `padding-left:16px` (= the card's body padding; absolute x = 52 + 16 + 16 = 84px from the article's left edge). Attached meanings are bare serif, carry no chip and no trailing `p.N` (the anchor is inherited). Selection: the solid 2px cyan rule at `left:59px` spans the selected half; the remainder of the pair shows the same rule at `rgba(75,197,222,.35)` — one continuous spine reading "one thought" |
| **Revision** | `border-left:2px solid #4bc5de; padding-left:14px`. Struck original: serif 13px line-through `#58636e`, `margin:0 0 4px`. Corrected prose: serif 15px/1.7 `#e6edf3`. Inherits the superseded anchor as trailing `p.9 ↗`. **Model law: `pairRevisions()` runs AFTER `manuscriptAt()` time-filtering** — travelling before the correction must un-strike the original, never delete it |
| **Question — OPEN** | `border-left:2px solid #d9a03f; background:rgba(217,160,63,.05); border-radius:0 4px 4px 0; padding:10px 14px`. Label row mono 10px `#d9a03f`: `OPEN · 12d` (age from `createdAtMs`). Body serif 15px `#e6edf3`. Condition: italic serif 12px `#aeb9c2`: `Open — closes when: I can price the queue-jump risk.` |
| **Question — MET** | rule → `#232b34`, wash removed. Label mono 10px `#58636e`: 10px drawn check `#4bc5de` + `CLOSED · by §7` — the `§7` fragment underlines on hover and jumps (pushes history). Condition line-through `#58636e`. Requires the `closure` record |
| **Question — RETIRED** | everything `#58636e`, no rule, label `RETIRED` |

### 4.5 Back-matter (three registers, chapter-head styling, cyan § marks)
- **§ Conclusions**: `<ol>` reset; rows grid `36px 1fr`: marker mono 12px `#4bc5de` (`§1`); text serif 15px/1.7 `#e6edf3`. Promoted: 6px `#4bc5de` dot before the marker + trailing mono 10px `#58636e` `holds across 3 projects`. Row hover reveals `Promote ↑` at row end (ghost, mono 10.5px, `border:1px solid #232b34; border-radius:4px; padding:0 8px; height:22px`) → gate sheet (§6.4).
- **§ Open Positions**: one line per open question: amber 5px dot · serif 14px excerpt (1-line ellipsis) · mono 10px `12d · p.14 ↗`; click = scroll-reveal + flash (pushes). Empty state: italic serif 11px `#58636e` `No open positions.`
- **§ Bindings**: mono 11px rows `v1 · bound 28 Jun · 19 traces · export ↗` (numbered). Empty state: italic serif 11px `#58636e`: `Nothing bound yet — Bind freezes this book as evidence.`

### 4.6 Overview ruler (the honest long-document map — the minimap replacement)
A 12px transparent rail overlaying the manuscript's right edge: `position:absolute; top:36px; right:10px; bottom:0` inside `.docWrap` — an overlay **sibling** of `.docScroll`, left of its styled scrollbar, so it never scrolls with content. Marks are absolutely positioned by `offset/scrollHeight`:
- **Evidence anchors**: 6×2px `rgba(75,197,222,.55)`.
- **Open questions + weak anchors**: 6×2px `#d9a03f`.
- **Chapter starts**: 8×1px `#58636e`.
- **Viewport band**: `background:rgba(230,237,243,.04)` tracking `scrollTop → scrollTop+clientHeight`.
Each mark's hit target is 12×8px; hover → `.popover` tooltip mono 10px `p.9 · quote`; click → scroll there + flash (pushes history). **Measurement contract (resolves the flagged virtualization contradiction):** mark offsets come from the layout layer's **block-offset ledger** — filled from real DOM offsets after layout below the virtualization threshold, and from the virtualizer's measured/estimated offsets above it; the ruler never queries unmounted DOM. Recompute on ResizeObserver, on commit, and on time-travel. This is VSCode's overview ruler carrying *meaning* — what is read, open, and weak — instead of a miniature.

### 4.7 Filing flash + long documents
- On-screen: 240ms ring `box-shadow:0 0 0 2px rgba(75,197,222,.55) → transparent`, ease-out, once; the block's coverage cell and overview mark appear in the same frame.
- Off-screen: `.filedPill` (see tree — inside `.docWrap`, NOT the scroller): `height:28px; padding:0 14px; background:#171c23; border:1px solid #232b34; border-radius:14px; font:11px "SF Mono"; color:#aeb9c2`; content `↓ filed at p.12`; click scrolls + flashes (pushes); auto-removes after 4s.
- `prefers-reduced-motion`: no keyframes — the ring appears at full value and is removed after 1.2s; the pill appears/disappears statically.
- Sync budget: capture→flash < 500ms via the versioned `loomWorkbench` envelope + monotonic `seq` delta fetch (Appendix A); 8s poll is the fallback only.
- **Virtualize the article beyond ~200 blocks** (windowed rendering keyed by sequence). The gutter hairline is painted on the article, and OUTLINE + the two rulers are the long-document navigators, so windowing is invisible.

### 4.8 Find bar (⌘F — in-page find; the palette never owns ⌘F)
Floating card: `top:44px; right:24px; height:32px; width:280px; background:#171c23; border:1px solid #232b34; border-radius:6px; box-shadow:0 10px 28px rgba(0,0,0,.45); display:flex; align-items:center; gap:8px; padding:0 10px`. Input mono 12px `#e6edf3` (flex:1); match count mono 10px `#58636e` (`3 of 14`). Matches in the page: `background:rgba(75,197,222,.14)`; current match `rgba(75,197,222,.28)`. ⏎ next · ⇧⏎ previous · Esc closes (top of the peel stack).

---

## 5. Tab band · Explorer · Status bar (the mature affordances)

### 5.1 Tab band (38px)
- `.tab`: `min-width:180px; max-width:240px; height:38px; display:inline-flex; align-items:center; gap:8px; padding:0 10px 0 12px; background:#0c0f13; border-right:1px solid #1a2027; box-shadow:inset 0 2px 0 transparent; color:#aeb9c2; font:12.5px sans` — **square, flush, hairline-separated**; hover `background:#0e1218`.
- Active: `background:#12161c` (continuous with the raised-object ink — the tab *is* the page) + `box-shadow:inset 0 2px 0 #4bc5de` + `color:#e6edf3`.
- Anatomy: kind glyph 14px drawn (open book = manuscript · crossed foils = practice) → label, 1-line ellipsis (project title / ground name) → trailing 18×18 close button (drawn 10px ×, `#58636e`, hover `color:#e6edf3; background:#171c23; border-radius:3px`). Close is a real sibling `<button>` inside a `role="tab"` container — never nested interactives.
- **Trailing state slot — the re-aimed dirty dot**: a 6px `#d9a03f` dot means **this project has open positions** (manuscript tabs) or **this run is ARMED, unsealed** (practice tabs). On tab hover the dot swaps to the close ×. SEALED practice tabs show a 12px drawn lock glyph before the label and no dot. Uncommitted composer text never marks a tab.
- **The active project's manuscript tab is pinned: no close button**; its open-positions dot, when present, persists and never swaps.
- Keyboard: `⌘1–9` direct, `⌃Tab` MRU cycle, `⌘W` close (pinned tab refuses). Overflow: `overflow-x:auto` (native behavior, tabs shrink to min-width first) + the `⋯` button → palette `>Tab:`.

### 5.2 Explorer (default 304px, resizable 240–420px)
- **Head** (40px, `padding:0 12px 0 16px`): workspace glyph 14px + name sans 12.5px/600 `#e6edf3` left; right: drawn collapse-all 24×24, `#58636e` hover `#e6edf3`. (No search button here — the command center and ⌘P own search.)
- **Section headers** (all four): height 28px; `position:sticky; top:0; z-index:2; background:#0c0f13; display:flex; align-items:center; gap:6px; padding:0 12px; font:11px/700 sans; letter-spacing:.08em; color:#58636e; border-top:1px solid #1a2027`. Leading drawn chevron 8px (rotates −90° collapsed, no transition). **Trailing right-aligned count, mono 10px `#58636e`** (`4` · `21` · `2 passes` · `3`) — counts are machine truth. Collapsed sections become 28px stubs; empty OUTLINE/TIMELINE stubs pin to the panel bottom (`margin-top:auto` on the first stub).
- **Register sizing law (no register evicts another):** OUTLINE takes remaining space (`flex:1 1 auto; min-height:0`, own scroll); PROJECTS and PRINCIPLES are capped at `max-height:38vh`, own scroll; TIMELINE is fixed (28px header + 68px instrument). **No data truncation, ever** — every register renders all rows inside its own scroller; there is no `slice`, no "N more" expander.
- **PROJECTS rows**: height 44px; `padding:5px 12px 5px 14px; border-left:2px solid transparent`. Line 1: sans 12.5px/600 `#e6edf3` (ellipsis). Line 2: mono 10px — the **derived state machine** `#58636e` (`Empty · Reading · In Review · Settled · Bound · Bound+` — never the raw `case.project`/`case.status` strings) + `· 3 open` in `#d9a03f` when open positions exist. Bound/Bound+ lead with a 5px `#4bc5de` dot. Hover `background:#0e1218`; active `background:#12161c; border-left-color:#4bc5de`.
- **OUTLINE rows** (book order, from `bookOrder()`): height 26px; grid `1fr 36px`; text sans 12px `#aeb9c2` (ellipsis; chapter rows sans 12px/600 `#e6edf3`); page mono 10px `#58636e` right-aligned. Hover `#0e1218`; the row of the selected manuscript block carries the 2px cyan left rail. Click → scroll-reveal + flash (pushes history). **Gap rows** (from `pageGaps()` — model output, never inline arithmetic): height 24px; italic mono 10px `#58636e`: `p.5–8 unread`; click → reveal the source at p.5 (no push).
- **TIMELINE instrument** (68px body, `padding:12px 14px` — a drawn `role="slider"`, never `<input type=range>`):
  - Track: 2px `#232b34` bar, full width; elapsed portion (left of playhead) `#58636e`.
  - Pass-boundary ticks: 1×8px centered on the track; `#58636e`, turning `#4bc5de` once the playhead has passed them; mono 9px labels (`p1`, `p2`) 4px below.
  - Playhead: 10px circle `#e6edf3`, `box-shadow:0 0 0 3px #0c0f13`; while dragging `+ 0 0 0 4px rgba(75,197,222,.4)`. Drag or click-track travels; snaps to commit positions; `←`/`→` step one record when focused.
  - Readout, mono 10px `#58636e`, 8px below: `pass 2 · 14 of 21 · 30 Jun 21:40`. Not at present → readout `#d9a03f`, the doc-band banner engages, the composer disables. **Travelling re-derives via `manuscriptAt()` THEN `pairRevisions()`** (§4.4 law).
- **PRINCIPLES rows**: min-height 40px; `padding:6px 12px 6px 14px`. Text serif 12.5px/1.4 `#e6edf3`, 2-line clamp (owner voice, even inside chrome). Meta mono 10px `#58636e`: `p.17 · reused ×2`; promoted rows lead with the 6px cyan dot and meta gains `· holds across 2 projects`; in-manuscript candidates read `candidate`. Click reveals in its source manuscript (opening that tab if needed; pushes). Empty state: italic serif 11px `#58636e`: `Principles you promote gather here, across every project.`
- **Resizer**: 5px invisible strip on the right edge, `cursor:col-resize`; while dragging, a 1px `#4bc5de` line at the seam; clamps 240–420px; the manuscript re-centers instantly.
- Keyboard: full roving tabindex; `↑↓` rows, `←→` collapse/expand sections, `⇥` between sections, `⏎` activates.
- **Scrollbars** (all panels + docScroll): `::-webkit-scrollbar{width:10px}`; thumb `rgba(88,99,110,.35)`, `border-radius:5px`, hover `rgba(88,99,110,.55)`; track transparent. (Alpha variants of `#58636e` — the off-palette `#2d3742` is dead.)

### 5.3 Status bar (28px) — six instruments, all real `<button>`s
Shared: `height:28px; padding:0 10px; display:inline-flex; align-items:center; gap:6px; background:transparent; border:0; color:#58636e; font:inherit`; hover `background:#0e1218; color:#aeb9c2`; `focus-visible` inset 1px cyan outline. Dots are 6px circles. Left group:
1. **Capture health**: dot (`#4bc5de` ready / `#d9a03f` down) + `⌘⇧U ready` / `capture offline — repair`. Click → repair popover (`.popover`, 260px, `padding:10px`): helper status line mono 10.5px + `Restart helper` ghost button (28px, `border:1px solid #232b34; border-radius:4px`). Never a passive sentence.
2. **Anchor honesty**: dot (cyan at 100% page-precise, amber otherwise) + `18/21 page-precise`. Click toggles the **weak-anchor filter**: page-precise blocks dim to 45% opacity, weak-anchor blocks stay full with amber chips; while active the segment shows `box-shadow:inset 0 -2px 0 #4bc5de`. Click again or Esc clears.
3. **Heartbeat**: `today 4 captures · 2 meanings` (from `heartbeat()`). Click expands TIMELINE and focuses the playhead at now.
4. **Open positions**: `3 open` in `#d9a03f` (`0 open` grey). Click cycles: scroll-reveal + flash each open question in turn (each pushes history); the next click advances.
Then `flex:1` spacer. Right group:
5. **Store**: `demo store` / `mirrored`, mono. Click → popover (`.popover`, width 320px, `padding:10px`, anchored `bottom:34px`, right-aligned): full path mono 10px `#aeb9c2` (`word-break:break-all`) + a 32px row-button `Reveal in Finder` (sans 12px `#e6edf3`, hover `background:#12161c`, radius 3).
6. **Transient**: the latest action, right-aligned, `#58636e` — `filed at p.12 · meaning`, `Bound v1 · exported`. Replaced instantly by newer actions (no fade) and **self-clears after 6s**. The only non-interactive segment.

---

## 6. Evidence pane · Command palette · Composer · Sheets · Practice

### 6.1 Evidence pane (320px; opens on block selection or ⌘⌥B; × / Esc closes — the column collapses to 0 instantly)
- **Header (35px, `border-bottom:1px solid #1a2027`)**: channel tabs — `PROVENANCE · DETAILS · CHAIN` — each `min-height:34px; padding:0 10px; border:0; border-top:2px solid transparent; background:transparent; font:10px/600 sans uppercase; letter-spacing:.06em; color:#58636e`; active `color:#e6edf3; border-top-color:#4bc5de; background:#0e1218`. Right: 20×20 × close. Bottom-panel channel-tab grammar, verbatim — the pane reads shipped, not bespoke. **PROVENANCE is the default tab on every new selection; DETAILS is never first** (no debug dump as the first layer).
- **PROVENANCE** (`padding:16px`): the whole first layer is **one calm sentence**, serif 14px/1.6 `#e6edf3`: `Captured from Week 1 Notes.pdf, page 4, during pass 1 — anchored to the page.` Weak: `…anchored to the window only.` with `window only` in `#d9a03f`. Below, `margin:14px 0`, the **actions row**: ghost buttons 28px, mono 11px `#aeb9c2`, `border:1px solid #232b34; border-radius:4px; padding:0 10px; gap:8px`; hover `border-color:rgba(75,197,222,.5); color:#e6edf3` — `Reveal ⏎` · `Cite ⌘⏎` · `Revise c` · (questions only) `Close position` → close-position sheet (§6.4).
- **DETAILS**: label/value rows 24px — label mono 10px `#58636e` left, value mono 10.5px `#aeb9c2` right: `anchor precision · page` / `sequence · 14` / `committed · 30 Jun 21:40` / `pass · 1` / `focus` / raw `evidence[]` rows verbatim.
- **CHAIN**: the revision chain, newest first: a 2px `#232b34` spine at `left:3px`; nodes `padding-left:18px`: 6px dots (current `#4bc5de`, priors `#58636e`), serif 12px excerpts (2-line clamp, priors line-through) + mono 9.5px timestamps; click jumps (pushes).
- The pane refuses: syntax-highlighted dumps, a second scrollable reading surface, editing. Empty (opened with no selection): centered sans 12px `#58636e`: `Select a block to read its provenance.`

### 6.2 Command palette (⌘P; ⌘⇧P opens pre-scoped `>`; the command center click opens it empty)
- Input row 44px: `padding:0 14px; border-bottom:1px solid #232b34; background:#12161c`; drawn magnifier 16px `#58636e`; input sans 14px `#e6edf3`, caret cyan; placeholder shows the grammar: `Search — @ entries · # principles · > actions · :page · ? open`.
- Rows: height 40px; grid `44px 1fr auto`; **kind tag mono 9px uppercase `#58636e`** (`PRJ ENT PRI ACT PG OPEN` — tags are machine labels, not advancing thoughts; they are never cyan); title sans 12.5px `#e6edf3` (1-line); detail mono 10.5px `#58636e` right. Selected (hover AND keyboard share it): `background:#171c23` + 2px `#4bc5de` left rail — the house selection grammar; `#dbeafe` is dead. List `max-height:320px; overflow:auto; padding:6px`. Footer 24px, mono 10px `#58636e`: `@ entries · # principles · > actions · :page · ? open`.
- **Sigil scopes** (parsed on the first character):
  - *(none)* mixed best-match across projects, entries, pages, actions.
  - `@` entries in the active project.
  - `#` principles across ALL projects — promoted first, candidates labeled `candidate` in the detail cell.
  - `>` actions, the complete command surface: `Start second pass · Bind & export · New project · Rename project · Relocate source… · Toggle Explorer ⌘B · Toggle Evidence ⌘⌥B · Open practice · Return to now · Filter weak anchors · Find in manuscript ⌘F · Collapse all sections · Reveal store in Finder · Close tab ⌘W · Preferences`.
  - `:12` **go-to-page, gap-honest and actionable**: when p.12 is captured, one row (`PG · p.12 · 3 traces`, Enter = scroll-reveal + flash, pushes). When p.12 lies in an unread gap, the scope yields **three rows offering all three targets**: `p.12 — unread · reveal in source ↗` (Enter = bridge-reveal the source at p.12, no push) · `p.9 — nearest capture before` · `p.14 — nearest capture after` (Enter = manuscript reveal, pushes). Honesty made actionable.
  - `?` open positions across every project (age + project in the detail cell); Enter opens that project's tab and reveals + flashes.
- Enter executes; Esc closes (top of the peel stack).

### 6.3 Composer (a commit dialog at the document's edge — never a chat box)
Inner wrapper: `width:min(732px, calc(100% - 48px)); margin:0 auto`; **all three rows carry `padding-left:68px`** (gutter + gap) so the input aligns exactly with the text column — the blank owner's margin runs unbroken through the composer.
- **Row 1 — the target, visible before typing** (28px, gap 6px):
  - **Kind chips** `Meaning · Correction · Question · Principle` (⌥1–4): height 22px; `padding:0 9px; border-radius:11px; border:1px solid #232b34; background:transparent; font:10.5px "SF Mono"; color:#58636e`. The chip that WILL commit — from an explicit press or live inference (trailing `?`, `correction:` / `principle:` prefixes; extend the model's focus inference) — renders `color:#4bc5de; border-color:rgba(75,197,222,.55); background:rgba(75,197,222,.06)` and re-follows the text live. **Never white-inverted. Recall is not here** (it is a lens; it lives in the doc band).
  - **Anchor-context chip**: `⌁ p.4 · "iceberg order"` — height 22px, `background:#12161c; border:1px solid #232b34; border-radius:4px; font:10.5px "SF Mono"; color:#aeb9c2`, trailing 12px ×. Set by the last selection / reveal / ⌘⏎-cite / block-drag; × → chip becomes `unanchored` (`#58636e`, no border). **Commits send this anchor over the bridge — blind `sources[0]` anchoring is deleted.**
  - Right: `Promote ↑` (only while the Principle chip is lit): mono 10.5px `#4bc5de` ghost → gate sheet (§6.4).
- **Row 2 — input**: textarea `min-height:38px; max-height:120px; background:#12161c; border:1px solid #232b34; border-radius:6px; padding:8px 40px 8px 12px`; **text serif 14px/1.5 `#e6edf3`** (the owner's words are serif even while being written), caret cyan; placeholder sans 12px `#58636e`: `Note what this means — ⌘⏎ commits`; focus `border-color:rgba(75,197,222,.5)`. Commit button, absolute right 6px bottom 6px: 26×26, radius 5, transparent; drawn **arrow-into-page** glyph 14px (a down-arrow entering a horizontal rule — a filing gesture, never `➤`); `#58636e` empty → `#4bc5de` committable; `:active` `background:#0e1218`.
- **Row 3 — the microline (the live commit contract)**: height 16px; mono 10px `#58636e`; visible whenever the textarea is nonempty: `⌘⏎ files as meaning under p.9` — the kind word tracks the lit chip live; the target tracks the anchor chip (`· unanchored — end matter` when cleared). It states the commit sentence one line before the commit happens.
- Type-to-compose: any printable key with no other focus target focuses the textarea. Drag a manuscript block onto the composer → sets the anchor chip. **Disabled while time-travelled**: wrapper at 50% opacity, commit inert, microline hidden; the doc-band banner names the exit.

### 6.4 Sheets — one anatomy, four uses
Shared: the `.sheet` overlay (§2). Title serif 17px/600 `#e6edf3`. Footer right-aligned, gap 8px: `Cancel` ghost (28px, mono 11px, `border:1px solid #232b34; border-radius:4px`) + **primary** (`height:30px; border-radius:4px; background:rgba(75,197,222,.12); border:1px solid #4bc5de; color:#e6edf3`). Esc cancels (peel stack).
1. **Gate sheet — `Promote to principle`**: statement serif 15px, editable; `Holds within` labeled input (mono 12px, required); auto-listed citations (anchor context + cited blocks) mono 10.5px `#58636e`; primary `Sign & promote`. On success: principle enters the workspace store; conclusions row gains the cyan dot; transient `promoted · holds within market making`.
2. **Verdict sheet — `Seal this run`**: metrics strip read-only (mono 11px on a `#0e1218; border:1px solid #1a2027` card); serif verdict textarea (composer input style); primary `Seal verdict`. On seal: the practice-outcome block files into the manuscript (flash), the tab's ARMED dot clears and the lock glyph appears, and `outcomeEvents` append to every ARMED promoted principle.
3. **Bind sheet — `Bind this project`** (taken wholesale): body sans 13px `#aeb9c2` lh 1.5, one sentence: `Freezes the current manuscript as a numbered binding and exports a snapshot.` **Honesty line**, rendered whenever weak anchors exist, mono 11px `#d9a03f`: `1 anchor is window-precision — it will be labeled in the export.` (count live). Primary `Bind & export`. On success: a numbered binding record appears in § Bindings, the project state advances to Bound (explorer dot + rail badge), transient `Bound v1 · exported`.
4. **Close-position sheet — `Close this position`**: the question echoed serif 14px `#aeb9c2`; a picker list of candidate blocks (rows 32px: serif 12.5px excerpt + mono 10px anchor; the house selection grammar) plus a final row `closed without a specific block`; primary `Close — signed`. Commits a `closure` record → the question renders MET.

### 6.5 Practice tabs
Opened by the rail's Practice action or a code block's `Open in practice ↗`. Center anatomy:
- **ARMED strip** (42px; `background:#0c0f13; border-bottom:1px solid #1a2027; padding:0 16px; display:flex; align-items:center; gap:10px`): mono 10.5px `#58636e` `ARMED` + principle chips (serif 12px `#e6edf3`, `background:#12161c; border:1px solid #232b34; border-radius:4px; height:22px; padding:0 8px` — chosen up front via the palette `#` scope) + right: live metrics mono 10.5px `#aeb9c2` + `Seal run` ghost (mono 10.5px, `border:1px solid #232b34; border-radius:4px; height:26px`, hover `border-color:rgba(75,197,222,.5)`).
- **The ground** fills the remainder: the practice surface (e.g. the QBook order-entry route) in a webview fed by `loom://` bundle fixtures. **No terminal, no run-log panel** — machine output belongs to the ground; only the sealed outcome crosses into the book.
- ARMED = amber tab dot (§5.1). `Seal run` → verdict sheet. SEALED: lock glyph, ground read-only; the outcome block's `run ↗` chip reopens it.

### 6.6 Esc peel stack · keyboard map · empty states
**Esc peel stack** (global, one layer per press): sheet / palette / find / popover → composer blur → Evidence pane close → time-travel to present → weak-anchor filter off → stage lens back to Collect → Recall off.

**Keyboard map (complete):** `⌘P` palette · `⌘⇧P` palette `>` · `⌘F` find bar (never the palette) · `⌘[` / `⌘]` jump history (titleband ‹ ›) · `⌃1–⌃5` rail · `⌘B` Explorer · `⌘⌥B` Evidence · `⌘1–9` tabs · `⌃Tab` MRU · `⌘W` close tab · `j`/`k` block walk · `⏎` reveal · `⌘⏎` cite (selection) / commit (composer focused) · `c` correction on selection · `⌥1–4` kind chips · `←`/`→` timeline steps (playhead focused) · `Esc` peel.

**Empty states (hints live here and nowhere else):** empty manuscript — one italic serif 12px `#58636e` line centered at the page's first third: `Capture something with ⌘⇧U — it files here, at its page.` · first quote with zero owned blocks — the whisper (§4.4) · PRINCIPLES / Bindings / Open Positions — §5.2/§4.5 lines · Evidence pane unselected — §6.1 · empty OUTLINE/TIMELINE — bottom-pinned 28px stubs. **Honest-empty rule (build gate): until a record kind lands (Appendix A), its chrome renders this honest empty or derived state — never a fake.**

---

## 7. Typography table

Stacks — **Serif (the human)**: `Georgia, "Times New Roman", serif`. **Mono (machine-checkable)**: `"SF Mono", ui-monospace, Menlo, monospace`. **Sans (chrome)**: `-apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, system-ui, sans-serif`.

| Style | Family | Size/LH | Weight | Spacing | Color | Usage |
|---|---|---|---|---|---|---|
| Doc title | serif | 27/1.2 | 600 | — | #e6edf3 | manuscript title (renameable, signed) |
| Part head | serif | 20/1.25 | 600 | — | #e6edf3 | multi-source Parts |
| Chapter / sheet head | serif | 17/1.3 | 600 | — | #e6edf3 | named chapters, § registers, sheet titles |
| Headword | serif | 19/1.3 | 600 | — | #e6edf3 | ≤6-word captures; receipt terms 15/600 |
| Owned prose | serif | 15/1.7 | 400 | — | #e6edf3 | meanings, corrections, questions, conclusions, verdicts |
| Quote body | serif | 14.5/1.65 | 400 | — | #e6edf3 | evidence quotes |
| Composer input | serif | 14/1.5 | 400 | — | #e6edf3 | the words being committed (caret cyan) |
| Provenance sentence | serif | 14/1.6 | 400 | — | #e6edf3 | evidence-pane first layer |
| Struck original | serif | 13/1.5 | 400 line-through | — | #58636e | revisions, prior chain nodes |
| Principle row | serif | 12.5/1.4 | 400 | — | #e6edf3 | explorer PRINCIPLES, chain excerpts, close-picker rows |
| Scope / condition | serif italic | 12/1.5 | 400 | — | #aeb9c2 | "Covers p.X–Y…", question conditions |
| Caption / hint | serif italic | 11/1.5 | 400 | — | #aeb9c2 (hints #58636e) | figure captions; empty-state hints ONLY |
| Code | mono | 12.5/1.55 | 400 | — | ink syntax §4.4 | code blocks |
| Data quote / table numerals / gloss | mono | 12–12.5 | 400 | — | #aeb9c2 (≈-gloss #58636e) | data captures, td numerals, machine glosses |
| Chapter § numeral | mono | 11 (12 in conclusions) | 400 | — | #4bc5de | § marks, conclusion markers |
| Metrics / evidence values / bindings | mono | 11 | 400 | — | #aeb9c2 | practice metrics, actions row, filed pill, details values, honesty line (#d9a03f) |
| Anchor / provenance / status / readout | mono | 10–10.5 | 400 | — | #58636e (hover #4bc5de on anchors) | chips, trailing anchors, provenance line, row meta, status bar, timeline readout, microline, doc-band state |
| Micro labels | mono | 8.5–10 | 400 | .06em uppercase | #58636e (OPEN/RETIRED #d9a03f context) | th, language chips, palette kind tags, `machine`, block state labels, pass labels |
| Chrome heading / channel tabs | sans | 11 / 10 | 700 / 600 | .08em / .06em uppercase | #58636e (active #e6edf3) | explorer section headers, evidence channel tabs |
| Chrome row | sans | 12.5/1.3 | 400 (titles 600) | — | #e6edf3 / #aeb9c2 | tabs, project/outline/palette rows, menus, command center (12) |
| Chrome small | sans | 11.5/1.3 | 400 | — | #aeb9c2 / #58636e | doc-band locus fragments |
| Rail label | sans | 10/1 | 400 | — | #58636e → #e6edf3 active | stage rail |
| Placeholder | sans | 12/1.4 | 400 | — | #58636e | inputs only |

**Voice law (enforced cell-by-cell above):** if a value can be checked against the source or the store, it is mono. If a human wrote or will write it, it is serif. Sans exists only in chrome the user never "reads". Contrast floor: 10px mono `#58636e` on `#0e1218` is the dimmest pairing allowed; nothing dimmer ships.

**Cyan charter (exhaustive — anything else cyan is a bug):** active rails, 2px (stage lens + its `.05` wash · active tab top · active project row · evidence channel-tab top · block selection rule · OUTLINE bidirectional rail · palette selected-row rail · weak-anchor-filter segment underline) · spread pair spine at `.35` · § numerals + conclusion markers · promoted / Bound dots + rail Bind badge · the filing flash ring · anchor & jump-link hover (chips, trailing anchors, doc-band p.N, `Closed by §N`, `run ↗`, `Open in practice ↗`) · coverage-ruler captured cells + viewport cell + degraded ticks · overview-ruler evidence marks · timeline passed ticks + playhead drag ring · lit composer kind chip + armed commit glyph · Recall-ON pill border · MET check glyph · sheet primary actions · time-travel `Return to present` link · find-bar match highlights (`.14`/`.28`) · explorer-resizer drag seam · focused-input borders (`.5`) + focus-visible outlines (`.4`–`.5`) · text carets.

**Amber charter (attention only, never decorative):** open questions (rule, wash, OPEN/age label) · open-position counts (status segment, explorer meta, tab dots) · weak anchors (chips + `window` line, provenance `window only` fragment, honesty dot) · ARMED practice dots · capture-offline instrument · travelled-time state (doc-band border + readouts) · the Bind sheet honesty line · figure `visual context only` strips · `missing` source chips · RETIRED/OPEN state labels.

---

## 8. Deliberately NOT taken from VSCode

1. **The menu bar and "Customize Layout" surface** — the titleband carries exactly four organs (history, command center, two layout toggles); no layout menus, no drag-to-dock, no panel maximize.
2. **The activity-bar icon set** (Search / Git / Debug / Extensions / Accounts) — the rail is the five verbs of one learning loop; a file-tool vocabulary would reintroduce the file metaphor the explorer refuses.
3. **The bottom panel / live terminal** — machine output enters the book only as sealed practice-outcome blocks; the evidence pane borrows the panel's channel-tab *grammar*, never its stdout job.
4. **The file-tree Explorer and path breadcrumbs** — projects have derived learning states, OUTLINE is book-order, and the doc-band locus is a position in the book (chapter › page), not a filesystem path.
5. **Run buttons and runnable cells in the center** — the manuscript is a frozen record with provenance; execution lives only behind `Open in practice`, in its own tab. This is the anti-Colab line.
6. **Selection blue `#dbeafe`, remote-block blue, link blues, modified amber `#a36b00`** — one accent, one attention color; every second hue was culled.
7. **Split editor, tab drag-reorder, panel maximize** — one book, one foreground object; comparison across projects happens via tabs and the `#` principle scope.
8. **The pixel minimap** — replaced by two honest maps: the coverage ruler (what of the source you have and haven't read) and the overview ruler (where anchors, open positions, and chapters sit in the book). A thumbnail of serif prose is decoration.
9. **The Welcome/walkthrough surface** — onboarding is one italic line in an empty book; the front door is the manuscript itself, chrome covered: *does this read like the book?*
10. **A light theme in v1** — the ink scale is the identity; Appendix B is the only lawful route to light, so it can never ship as ad-hoc drift.
11. **Chrome sans for content** — the moment text becomes content (a principle row, a provenance sentence), it switches voice to serif, even inside chrome panels.

---

## Appendix A — Model/bridge obligations & build order (the engineering companion)

1. **`pairRevisions()` after `manuscriptAt()`** in every derivation path (time-travel un-strike). Gate: travelling before a correction shows the original unstruck.
2. **Anchor-carrying commit envelope**: single versioned bridge `loomWorkbench {v:1, id, op, payload}`; commits send `{caseID, text, kind, anchor}` — delete blind `sources[0]` anchoring. Ops: `commit · reveal · export · probeHealth · relocateSource · renameProject · renameChapter · pass · promote · closePosition · sealRun · bind`. Events: monotonic `seq` + `loom-native-event` push with delta fetch; capture→flash < 500ms; 8s poll fallback only.
3. **New record kinds**: `pass`, `closure`, `chapter-title`, `project-title`, `binding`, `promotion` (+ workspace principle store with `reuseEvents`/`outcomeEvents`), `practice.outcome`. **Honest-empty gate**: until a kind lands, its chrome renders the honest empty/derived state (§6.6) — never a fake; the state machine tops out at `Settled` until binding records exist.
4. **Source page-count field** (or `meta` parse) for coverage rulers; unparsable totals take the degraded form (§4.2.4).
5. **schemaVersion 2 payloads** (`table/code/figure/gloss/practice`) unlock the §4.4 evidence blocks; every block has a text-only degradation until then.
6. **Block-offset ledger** (real DOM offsets below the ~200-block virtualization threshold; virtualizer measurements above) — the overview ruler (§4.6) and filed-pill targeting read only this ledger. Ship the ledger with or before virtualization; the ruler lands on the ledger.
7. **Jump-history ring** (§3.1) — push discipline exactly as specified; source-bound reveals never push.
8. **CSS hygiene**: delete orphaned classes (`.entry*`, `.positionsBadge`, `.statusAction`, `.panelDot`, `.principle*`) and every off-palette hex (`#c9d1d9`, `#cfe6da`, `#dbe3ea`, `#1f262e`, `#2d3742`, and the remaining drifted values); the final stylesheet contains only §2-law + charter hexes and their alpha variants.

## Appendix B — Palette transposition table (the lawful mapping for any future light theme; light does not ship in v1)

| Role | QBook light | LOOM ink |
|---|---|---|
| Shell base bg / text | `#f8f8f8` / `#3b3b3b` | `#0c0f13` / `#aeb9c2` |
| Titlebar, panels, tab-strip, composer bg | `#f3f3f3` / `#f4f4f4` | `#0c0f13` (outer bands `#080a0d`) |
| Activity rail + status bar bg | `#f7f7f7` / `#f2f2f2` | `#080a0d` |
| Editor / active tab / reading field | `#ffffff` | `#0e1218` (raised objects `#12161c`) |
| Raised/hover surfaces | `#ececec` / `#e7e7e7` | `#171c23` |
| Structural hairlines `#d8d8d8`–`#dedede` | | `#1a2027` |
| In-surface hairlines `#c9c9c9`–`#eeeeee` | | `#232b34` |
| Active text `#1f1f1f` | | `#e6edf3` |
| Mid greys `#454545`–`#575757` | | `#aeb9c2` |
| Faint greys `#6b6b6b`–`#9a9a9a` | | `#58636e` |
| Accent rails/links `#4bc5de` | | `#4BC5DE` (unchanged) |
| Modified amber `#a36b00`, question dot `#d29922` | | `#d9a03f` |
| Selection blue `#dbeafe`, link blues, flash `#007fd4` | | **purged** → cyan grammar: selection `#171c23` + 2px cyan rail; flash `#4BC5DE` |
| Ink buttons `#1e242d` on white | | `#e6edf3` on `#171c23`, border `#232b34` |

Any future light theme must be derived by inverting THIS table — never by ad-hoc value picking.

## Appendix C — Resolved contradictions ledger (why the spec reads this way)

| Flagged conflict | Resolution |
|---|---|
| loom-identity deleted the titleband; two judges ordered it restored | 40px titleband restored above the tab band: history ‹ › (⌘[/⌘]), command center, two layout toggles; traffic lights move there; the palette scrim drops from y=40 |
| ⌘F: fusion-radical gave it to the palette | ⌘F is in-page find, always; the palette is ⌘P/⌘⇧P |
| Per-card gutter vs page-wide gutter | Page-wide 52px margin + continuous hairline at x=51–52 painted on the article; chips in the margin cell; the asymmetry law replaces per-card gutters |
| "Blocks span both columns" needed subgrid | Both columns are fixed px (52 + 16 gap), so each block row repeats the template as a plain nested grid — alignment by construction, no subgrid |
| Spread indent: full-measure (D2) vs 68px alignment (D1) | The alignment LAW wins: owner's first character exactly under the quote's first character = `padding-left:16px` in this geometry (absolute x = 84 from article left); pair spine on selection kept from D2 |
| Overview ruler: v1.1 (judge 2) vs verbatim-now-with-fix (judge 3); sticky/float hack; offsets vs virtualization | Fully specified in §4.6 as an absolute overlay sibling of the scroller; offsets read the block-offset ledger (works plain and virtualized); build order ties it to the ledger milestone |
| Tab dot semantics: uncommitted text (D2) vs open positions (grafted) | Dot = open positions (manuscript) / ARMED (practice); composer dirtiness never marks a tab; pinned tab's dot never swaps (no ×) |
| OUTLINE "N more" expander vs "no slice truncation ever" | No truncation, no expander: every register renders all rows inside its own scroller (OUTLINE flex:1; others max-height:38vh) |
| Evidence pane: disclosure rows (D2) vs channel tabs (grafted) | Channel tabs PROVENANCE · DETAILS · CHAIN; PROVENANCE always default, preserving "never a debug dump first" |
| 80ms rail pulse vs zero-motion law | No pulse; actions use the `:active` ink step; the filing flash remains the only keyframe |
| Fake measure claims ("78ch") | All measures stated in px only (text column ≤ 664px); no character-count claims |
| Base's own unchartered cyan (find highlights, resizer seam, return link, kind tags) | Charter made truly exhaustive (§7); palette kind tags demoted to `#58636e`; everything else listed |
| Scrollbar hover `#2d3742` off-palette | Thumb uses alpha variants of `#58636e` (`.35`/`.55`), per the no-other-hex clause |
| Sheet anatomies differed per design | One `.sheet` anatomy, four uses: gate, verdict, bind, close-position; one primary-button grammar |
| Explorer head magnifier duplicated the restored command center | Magnifier cut; search lives in the command center + ⌘P; collapse-all stays |
| Practice tab center unspecified in the base; D1's run-log panel vs D2's no-terminal refusal | ARMED strip + ground + Seal → verdict sheet; no run-log panel — the sealed outcome is the only machine output that enters the book |
