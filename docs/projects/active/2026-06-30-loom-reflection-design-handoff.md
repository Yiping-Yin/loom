# Reflection workspace — design handoff (Claude → Codex)

Owner-reviewed direction for the Reflection/learning surface. The whole screen
currently reads as an **explanatory demo** because it narrates its own model.

## Owner north star (2026-07-02, owner's own words)

> 先把书读厚，再把书读薄。最后跨知识融会贯通。
> 最后的呈现还是一个书的内容。不是乱七八糟。

Read the book THICK (first pass: anchored captures, meanings, questions grow on
the book) → read it THIN (second pass: your own meaning, corrections, synthesis;
only confirmed understanding is promoted) → integrate ACROSS knowledge (reusable
principles that fire in later reading) → and the final presentation is still
**the book itself** — organized by the source's own structure (sections, pages,
narrative order) with understanding woven in. NOT a capture inbox, NOT
type-bucketed cards, NOT a dashboard.

Acceptance smell-test for the center pane and every export: cover the chrome and
ask "does this read like that book?" If it reads like an inbox, it fails.
Maps onto the product stages: thick = Capture/Collect · thin = Meaning/Review ·
integrate = Memory/Reuse · presentation = the learning document / packet shaped
by the source's structure.

Refinement (owner, 2026-07-02): "书" means a PROFESSIONAL DOCUMENT GENRE, not
one literal format — 论文 (paper), 报告 (report), 创业设计 (startup design doc),
严谨的学术纪录 (rigorous academic record) are all valid final forms. The two
invariants: 结构清晰 (clear structure) + 专业可读的排版 (professional, readable
typesetting). Genre follows the case's nature: course PDF learning pass →
academic record / paper form (loom-notes / FINS3666 packet register);
product-reflection case → report / design-doc form. The failure mode stays the
same: a UI-shaped list (inbox, type buckets, card sea) is not a document.

## Core principle (apply everywhere)
**Show the work, not the scaffolding.** If an icon, the filename, or the context
already conveys something, DELETE the text. Every text element must carry info
the icon/filename/context does NOT already give, or it is removed. Matches canon
`LOOM_DESIGN_DISCIPLINE` ("one foreground object beats a control room").

Apply to BOTH the native canonical surface (`macos-app/Loom/Sources/LoomReflectionRootView.swift`)
and the web parity (`app/reflection/ReflectionWorkspaceClient.tsx`, `UnderstandingSpine.tsx`,
`reflectionModel.ts`, `ReflectionWorkspace.module.css`). Native first; mirror to web.

## 1. Composer (the commit input — the product's core action surface)
Today: a plain text field that makes the user write prose, and the version TYPE
is GUESSED from keywords (`formatLearningCommit`).
- **Add explicit type chips**: `Meaning · Question · Correction · Principle` —
  one selected (default Meaning). Selecting one sets the commit's focus EXPLICITLY
  (stop guessing) and adapts the placeholder ("What does this data mean?" /
  "What don't you understand?" / …) and intent.
- **One AI assist**: a quiet `✨ Help me interpret` action that drafts an
  interpretation FROM the source material. One button, summoned — not a panel.
  (Honors PRD "AI is summoned, not resident.")
- **`@ reference`**: anchor the meaning to a specific row/cell/line (sources like
  the Excel table have multiple rows).
- **Commit → a send-arrow icon** (arrow-up / paper-plane) in the field corner,
  like a chat composer. The placeholder explains; the arrow sends. Drop the word
  "Commit".
- KEEP worded: the type chips (they ARE the choice, not chrome).

## 2. Left sidebar — light, adaptive glass
Today: `ReflectionSidebarBackground` paints a FIXED dark blue-grey `LinearGradient`
over `.regularMaterial`, so it never adapts → a heavy dark slab in daylight.
- Drive it off `@Environment(\.colorScheme)`: **light/near-clear glass in light mode**
  (warm white `#edeae3` family), dark only in dark mode. Liquid glass tracks the
  environment; remove the fixed dark gradient.
- **Foreground also adapts**: text, icons, the search field, the case-row card are
  currently hardcoded light-on-dark — they must flip to dark-on-light in light mode.
- Principle: working surfaces follow the system theme (center pane already does);
  cosmic dark stays ONLY on the art/cosmic surfaces.

## 3. De-demo the layout (kill self-narration)
- **Right "Evidence Inspector" debug dump → one calm line.** Today it dumps 11
  internal fields (anchor/pass/focus/type/app/kind/file/bundle/anchorPrecision/
  evidence/capturedAt). Replace with: source icon + filename + an `↗` Open-source
  icon + a collapsed `Details` disclosure that holds the rest. Do NOT show bundle
  id, ISO timestamp, anchorPrecision, evidence-type in the default view.
- **De-duplicate.** The captured data (Activation 42% / Retention 31%) appears 3×
  (center version card + Inspector + Source Collection card). Show it ONCE — the
  center version card. Remove the "Source Collection" block (filename is already
  at the top + in the source line).
- **Delete model-name labels (chrome):** "Understanding Version Flow", "Source
  material", "Evidence Inspector", "Source Collection". The titlebar already names
  the file.

## 4. Labels → icons (+ the show-don't-tell cut list)
- Labeled secondary controls → **icon + hover tooltip + aria-label**: New reflection
  (✎), Import (↑), Open source (↗), Audit trail (history glyph).
- **Show-don't-tell deletions** (icon/context already says it):
  - source card subtitle "Microsoft Excel · cells" → delete (the spreadsheet icon says it)
  - sidebar "Learning pass" subtitle → a small pass glyph, or nothing
  - "data pass" / "needs interpretation" status labels → a single coloured dot
    (amber = needs meaning, green = committed) — not worded chips
  - composer placeholder, once type chips exist → shrink to "Add your meaning…"
- KEEP: the type chips' words; first-run empty-state guidance; one primary intent
  where a word genuinely removes ambiguity.
- RULE: every icon-only control needs a tooltip + aria-label — icons replace
  labels, they don't delete meaning.

## Acceptance smell-test
Cover every label on the screen. If the remaining icons + filename + content still
read as "a captured Excel table, from this file, awaiting your meaning" — the
labels were scaffolding and should go. Anything whose removal loses no info = cut.

## Addendum — Be Native

Owner pointed at the native macOS Preview right-click context menu as the quality
bar. Study it: Liquid Glass material, SF Symbols, tight density, zero explanatory
prose. Three binding rules follow.

### 1. Glass is a material, not a color

The native context menu is genuinely translucent — you see the document beneath
it, and a coral-tinted highlight bleeds through. The glass samples and tints the
local environment, so it reads light over light content automatically. This is
not a painted gradient.

For every panel or sidebar described in this handoff (including #2): use the real
system material — NSVisualEffectView / SwiftUI .regularMaterial / macOS 26 Liquid
Glass — NOT a hand-painted LinearGradient faking translucency. The correct recipe
is: soft pale fill, large rounded corners, hairline (0.5 pt, separator-color)
border, no heavy drop shadow. Hover state = translucent micro-fill, not a solid
block.

### 2. Icons = SF Symbols, consistently

One family, one weight, one optical size. Monochrome (inherit text color). Outline
style. Fixed-width icon gutter so labels align. Use Image(systemName:) everywhere.
Do not mix bespoke or third-party icon sets with SF Symbols — Loom is a native
macOS app and must use the native icon vocabulary.

### 3. Meta-rule: inherit Apple's craft

By using real materials, SF Symbols, Apple's menu density, and Apple's menu
grammar, Loom gets Apple's years of refinement for free and instantly feels
native. The Preview context menu is also the purest demonstration of "show, don't
tell": icons + glass + short labels, zero explanatory prose. That is the maturity
bar every surface in Loom should clear.

## Correction — you have the FUNCTION; make the PRESENTATION minimal

Written 2026-06-30 after seeing the current build: center = "Trace Ledger /
理解账本" showing **stage + anchor precision + evidence tier on every record**;
right pane keeps "Evidence Inspector". The anchor ARCHITECTURE you absorbed is
correct and stays (sandbox limits, wrong-window risk, weak-anchor honesty,
evidence tiers, never fake file+page, native apps primary) — those are FUNCTIONS,
keep every one. But the owner's design verdict is that the screen reads as an
explanatory DEMO. So surface those functions MINIMALLY; do NOT label them on
every record:
- anchor precision / evidence tier per record → ONE quiet dot or one short word
  (amber = needs meaning / weak anchor, green = grounded), NOT a labeled
  "stage · anchor precision · evidence tier" row. The honesty stays; the labels go.
- "Evidence Inspector" → collapse the 11-field dump to ONE calm line (source icon
  + filename + Open-source icon + folded "Details"). Data stays reachable, not in
  your face. Drop the name "Evidence Inspector".
- "Trace Ledger" / "Understanding Version Flow" heading → drop it; the titlebar
  already names the file. The records ARE the ledger — don't label the ledger.
Net: the center gets QUIETER as it gets more correct, not busier.

## Chat-only refinements (were in no file until now)
1. Colored file-type icons: PDF red / Word blue / Excel green / slides orange —
   recognizable by COLOR, matches OS convention. Not one generic icon for all.
2. Subtitles — delete the REDUNDANT, keep the EARNED. "Microsoft Excel · cells"
   repeats the icon → delete. A subtitle that adds an affordance the icon can't
   ("Read, create, verify…") earns its place → keep. NOT "delete every subtitle".
3. Recall is the learning payoff + the missing operation: a quiet "?" affords
   recall-on-demand → surfaces the knowledge-point card → opens the knowledge
   module. Recall is a SEPARATE review pass, NOT a commit action — keep it OUT of
   the composer.
4. Rich by REFERENCE, not re-hosting: cards link back to the original (open PDF at
   page p, jump to the cell) + hold the user's synthesized meaning. Do NOT rebuild
   a Notion-style media editor that re-hosts PDF/video/audio inside Loom — that
   breaks "Loom is a sidecar, native stays primary". "Rich" = one-click jumps to
   real sources + previews/thumbnails, never embeds.
5. Scope: nailing the four file types (Documents / PDF / Spreadsheets /
   Presentations) on the INPUT side (capture + precise anchor + learn) is already
   a complete, powerful v1. Output-back-to-formats is v2; a rich media editor is
   out of scope.

## Codex implementation note — 2026-06-30

Applied the handoff to the native surface first:

- Left rail uses `NSVisualEffectView` through `ReflectionVisualEffectBackground`.
  Light mode now keeps the glass pale and see-through instead of painting a dark
  slab; selected rows get a light glass fill that remains readable.
- The center defaults to the current learning object. Single-capture cases hide
  stage counters; multi-version or reviewed cases can still reveal `Capture trail`
  for provenance. The capture remains selectable, but the process is not the
  default headline.
- The composer is a compact commit control, not a chat box: `Meaning`,
  `Question`, `Correction`, and `Principle` are explicit commit types, and the
  send icon commits the selected type.
- The right pane is evidence, not a second source reader. It shows one source
  line by default, keeps raw metadata behind `Details`, and avoids duplicating the
  captured source content.

Refusal preserved: do not rebuild Preview, Word, Excel, or PowerPoint functions.
Loom only records the user's anchored understanding and keeps source tools
primary.
