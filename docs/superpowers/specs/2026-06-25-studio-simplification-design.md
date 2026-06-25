# Studio simplification — design

Date: 2026-06-25
Status: approved (brainstorming), pending spec review → implementation plan
Surface: the Studio / draft editor — `app/draft/DraftClient.tsx`, opened at
`/digital-me?edit=<id|new>` (the `/draft` route redirects here).

## Context & problem

Owner feedback: the Studio is **too complex**. A normal user who opens it sees a
three-panel control panel — a profile rail, Workspace counters (Sources / Words /
Provenance), a proof strip ("Answer grounded by N sources · 0 provenance matches"),
an OUTPUT type taxonomy (Course Note / Portfolio Case Study / Product Story / AI
Answer / About Section / Use outline), a "SOURCE-GROUNDED WRITING" toolbar, and a
three-tab Inspector (Sources / Edit / Board) — all at once, before writing a word.
It reads as a tool for the makers, not for the user. The verdict: "正常使用当中看到
这些，是不会继续用的" (seeing this in normal use, people won't keep using it).

This is a presentation problem, not a capability problem. The underlying engine
(block editor, sources, grounding, AI drafting) is fine and is the moat. The job is
to change **what is shown**, not what it can do.

## Goals

- A calm, approachable first impression: a normal user lands on something they
  immediately understand and want to use.
- Progressive disclosure: power features exist but are hidden until asked for.
- Cut jargon. Product UI stays English-only.
- Preserve the moat: content is grounded in the user's own sources — kept, but
  presented quietly.

## Non-goals

- Changing the grounding/AI/blocks engine behaviour (reuse as-is).
- Redesigning the Digital Me listing page, onboarding, or backend.
- A light theme. The dark "evidence-desk" skin stays.

## Decisions locked (from brainstorming)

1. **Core purpose:** the Studio is for *building your Digital Me* — producing pieces
   of you. The outcome leads; the machinery recedes.
2. **Grounding:** a *quiet trust marker*. No provenance dashboard. A light "Backed by
   N of your sources" line, expandable on demand. Machinery hidden, trust kept.
3. **Output types:** replaced by *friendly starters* (not jargon chips); picking one
   leads into the editor.
4. **Shape:** Approach A — *one calm centered column with progressive disclosure*.

## The design

### ① Default state — "Add to your Digital Me" (empty/new draft)

A single centered column (~720px). No left rail, no right inspector.

- A quiet `← Digital Me` back link (top-left) and a small user avatar (top-right).
- Serif headline: **"Add to your Digital Me"**.
- One guidance hint: *"Pick a place to start — or just write."*
- Four warm starter cards (2×2): **A piece of experience · A project · An idea ·
  Something else**. Each is an icon + short label; picking one opens the editor
  pre-set to that intent (maps to an output type behind the scenes).
- A quiet text link: `or just start writing →` (opens a blank editor).

Nothing else: no chips, counters, proof strip, or inspector on this screen.

### ② Writing state (a draft is open / has content)

Same single column.

- Top bar: `← Digital Me` (left); right side: a quiet `Saved` status + a single
  **`⋯ Details`** button.
- A large title field (`Untitled` placeholder) → a hairline divider → the body,
  which is the existing `DraftBlockEditor` (the canonical block surface) framed by
  far less chrome. Placeholder `Start writing…`.
- One quiet action row at the bottom: a soft **`✦ Help me write`** affordance (the
  AI entry — replaces "Continue with AI" / "Draft from tag"), and — *only when the
  draft has sources* — a quiet **`Backed by N of your sources ⌄`** line that expands
  to show which sources (replaces the proof strip + provenance counters).

### ③ Progressive disclosure — the `Details` panel

A slide-over / drawer, **closed by default**, opened by the single `⋯ Details`
button. It holds everything currently shouting on screen:

- Sources list + "Add source".
- Provenance detail (grounded-by, matches) — the full version of the quiet line.
- Board / Edit views.
- Output type (re-classify, for users who care).
- Word count and other stats.

A normal user never opens it; a power user has it one click away. The current
Inspector content moves here largely intact — relocated, not rebuilt.

### ④ Copy / jargon pass (English-only)

| Now | Becomes |
| --- | --- |
| `SOURCE-GROUNDED WRITING` toolbar label | removed (the page *is* the writing) |
| `provenance matches`, `attached references` | "Backed by N of your sources" |
| `INSPECTOR` · `Sources / Edit / Board` | "Details" |
| `OUTPUT` + 6 type chips | the four starters (on open) |
| `Continue with AI` / `Draft from tag` | "Help me write" |
| Workspace counters `Sources / Words / Provenance` | removed from view (live in Details) |
| "STUDIO" eyebrow (the meta-row dupe was already removed in PR #100) | dropped — the `← Digital Me` link + title carry context |

### ⑤ Structural mapping (what happens in the code)

`DraftClient.tsx` is a large file; this is a re-chrome of its presentation layer:

- **Identity rail** (`new-loom-draft__identity-rail`) — removed from the always-on
  layout. The back link + avatar move into the slim top bar; the rail's counters
  move into Details.
- **Inspector** — becomes the `Details` drawer (on-demand), not an always-on column.
- **Header** (`document-header`, `proof-strip`, `type-rail`/OUTPUT chips) — collapses
  to: title + quiet `Saved` + `Details`. The proof strip becomes the quiet grounding
  line. The type rail becomes the starters (shown only in the empty state).
- **Block editor** (`DraftBlockEditor`) — unchanged; it is the writing surface.
- **New:** a lightweight "starter" entry state, shown when the draft is empty/new.
- **Layout:** the `.new-loom-draft` three-column grid (`minmax(14rem,17rem)
  minmax(0,1fr) minmax(21rem,27rem)`) becomes a single centered column; rail +
  inspector become drawers.
- **Preserved:** all engine logic — blocks, sources, grounding/provenance
  computation, AI drafting, save/sync. Only presentation changes.

## Components & boundaries

- `StudioStarters` (new): the empty-state entry — headline + four starters + "just
  start writing". One job: choose how to begin → set intent/output-type → reveal the
  editor. Depends on the output-type list + the create-draft action.
- `StudioEditor` (refactor of the current center): top bar (back, Saved, Details) +
  title + `DraftBlockEditor` + the quiet action row (Help me write, grounding line).
- `StudioDetails` (new drawer; mostly relocated Inspector): sources, provenance,
  board, type, stats. Closed by default.
- Engine modules (sources, grounding, AI, drafts store): unchanged interfaces.

## Impact on existing tests

`tests/draft-workspace-composition.test.ts` is a source-contract test that pins the
**current** complex structure: the 3-column grid template, `identity-rail`,
`workspace`, `document-header`, `editor-shell`, `editor-toolbar`, `proof-strip`,
always-on inspector, etc. This redesign intentionally changes that structure, so the
test will be **rewritten in lockstep** to assert the new calm contract:

- single centered column (no always-on rail/inspector grid);
- empty-state starters present ("Add to your Digital Me" + the four starters + "just
  start writing");
- writing state: title + `DraftBlockEditor` + `Details` disclosure + the quiet
  grounding line;
- jargon removed (no "SOURCE-GROUNDED WRITING", "provenance matches", "INSPECTOR",
  OUTPUT chips on the default surface);
- the moat preserved (grounding line + Details still expose sources/provenance);
- a11y: the hidden `sr-title` stays; starters and Details are keyboard-operable.

Other suites that touch draft styles/structure (e.g. `loom-personal-positioning`,
any globals `.new-loom-draft*` pins) will be checked and updated as needed. The
**full `npm run test:contracts`** is the pre-push gate (see process memory).

## Testing & verification

- Rewrite the draft composition contract test to the new structure (TDD: red → green).
- Keyboard + a11y checks on starters and the Details drawer.
- Browser verification on a **clean** dev build (the `.surface` module must apply —
  a corrupted `.next` masks module CSS; restart before judging visuals): confirm the
  empty state, the writing state, and that Details holds the relocated power features.
- typecheck + full `test:contracts` green; CI green; merge via PR.

## Risks

- Large-file re-chrome: `DraftClient.tsx` is big; isolate the new pieces
  (`StudioStarters`, `StudioDetails`) as their own components to keep edits reliable.
- Contract-test lockstep: the structure change WILL break the current pins; rewriting
  them is expected work, not a regression — but must be done deliberately.
- Don't sever the moat: grounding computation and source wiring must stay connected
  through the quiet line + Details.

## Out of scope

Digital Me listing page, onboarding, backend/sync, AI generation logic, light theme.
