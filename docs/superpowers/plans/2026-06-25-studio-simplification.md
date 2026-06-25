# Studio simplification — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-chrome the Studio (`app/draft/DraftClient.tsx`, opened at `/digital-me?edit=…`) into a calm one-column "Add to your Digital Me" surface with power features behind a closed-by-default Details drawer — reusing the existing engine, changing only presentation.

**Architecture:** Add a new empty-state entry component (`StudioStarters`); collapse the always-on left rail + dense header + OUTPUT chip rail + proof strip into a slim top bar (back · Saved · Details) + a quiet grounding line + a soft "Help me write" button; wrap the existing Inspector (`new-loom-draft__inspector`) in an off-canvas Details drawer toggled by `detailsOpen` (default false). The three-column CSS grid becomes a single centered column. No engine handlers/state change behaviour — they are relocated/re-presented.

**Tech Stack:** Next 16 / React 19 / TypeScript / CSS modules + `app/globals.css`. Tests: `node:test` source-contract assertions run via `npm run test:contracts`.

## Global Constraints

- Product UI is **English-only** — no CJK in any rendered string. (verbatim from spec)
- Dark **evidence-desk** skin preserved — no light theme.
- **Reuse the engine** — do not change behaviour of: blocks (`DraftBlockEditor`, `blocks`/`handleBlocksChange`), sources (`sourceTiles`, `references`, reference picker), grounding (`provenanceMatches`, `displayReferences`), AI (`continueWithAI`, `startInlineEdit`, `startTaggedDraft`, `publishAnswerPreview`), drafts store (`selectDraftById`, `createDraft`, save/sync). Relocate/re-present only.
- The visually-hidden `<h1 className="new-loom-draft__sr-title">Studio</h1>` (a11y) stays.
- Pre-push gate: `npm run typecheck` (exit 0) **and** full `npm run test:contracts` (0 fail) before every push. Browser-verify on a **clean** `.next` build (a corrupted `.next` masks the `.surface` CSS module — `preview_stop` → `rm -rf .next-app-dev` → `preview_start` if visuals look wrong).
- Output types live in `lib/new-loom/draft-storage.ts` → `NEW_LOOM_DRAFT_OUTPUT_TYPES` (ids: `course-note`, `portfolio-case-study`, `product-story`, `ai-answer`, `about-section`); default `course-note`. `selectedOutputTypeId` is the active id; `setSelectedOutputTypeId` sets it.

---

### Task 1: `StudioStarters` empty-state entry component

**Files:**
- Create: `app/draft/StudioStarters.tsx`
- Test: `tests/studio-starters.test.tsx`

**Interfaces:**
- Produces: `export function StudioStarters(props: StudioStartersProps)` where
  ```ts
  type StudioStarterChoice = { outputTypeId: NewLoomDraftOutputTypeId; blank?: boolean };
  type StudioStartersProps = {
    userInitial: string;            // single uppercase letter for the avatar
    onStart: (choice: StudioStarterChoice) => void;  // a starter or "just start writing"
  };
  export const STUDIO_STARTERS: ReadonlyArray<{ id: string; label: string; icon: string; outputTypeId: NewLoomDraftOutputTypeId }>;
  ```
- The four starters (icon = lucide name string used by the existing icon convention in the file; if the file has no icon system, use a short inline SVG or text glyph — match what `DraftClient` already does):
  - `A piece of experience` → `portfolio-case-study`
  - `A project` → `product-story`
  - `An idea` → `course-note`
  - `Something else` → `about-section`
  - plus a text link **"or just start writing →"** → `{ outputTypeId: 'course-note', blank: true }`

- [ ] **Step 1: Write the failing test**

```tsx
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('StudioStarters is the calm empty-state entry to the Studio', () => {
  const src = read('app/draft/StudioStarters.tsx');
  // Headline + single guidance hint (clean, minimal copy).
  assert.match(src, /Add to your Digital Me/);
  assert.match(src, /Pick a place to start/);
  // Four friendly starters, no jargon type names.
  assert.match(src, /A piece of experience/);
  assert.match(src, /A project/);
  assert.match(src, /An idea/);
  assert.match(src, /Something else/);
  assert.doesNotMatch(src, /Course Note|Portfolio Case Study|Product Story|About Section|OUTPUT/);
  // "just start writing" escape hatch + the start callback.
  assert.match(src, /just start writing/);
  assert.match(src, /onStart\(/);
  // Keyboard-operable starters (buttons, not bare divs).
  assert.match(src, /<button/);
  // Maps starters to real output types behind the scenes.
  assert.match(src, /portfolio-case-study/);
  assert.match(src, /product-story/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/studio-starters.test.tsx`
Expected: FAIL — `ENOENT` (file does not exist).

- [ ] **Step 3: Write `StudioStarters.tsx`**

Create a client component rendering the headline, the hint, a 2×2 grid of `<button>` starters (each calls `onStart({ outputTypeId })`), and the "just start writing" link (calls `onStart({ outputTypeId: 'course-note', blank: true })`). Use the `new-loom-draft__*` class namespace for styling continuity (e.g. `new-loom-draft__starters`, `new-loom-draft__starter`). Import `NewLoomDraftOutputTypeId` from `../../lib/new-loom/draft-storage`. Each starter button must be keyboard-operable (native `<button type="button">`). Keep copy to the headline + one hint + the four labels + the link (no descriptive prose).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/studio-starters.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/draft/StudioStarters.tsx tests/studio-starters.test.tsx
git commit -m "feat(studio): StudioStarters calm empty-state entry"
```

---

### Task 2: Show `StudioStarters` when the draft is empty

**Files:**
- Modify: `app/draft/DraftClient.tsx` (component body — add an `isEmptyDraft` derivation + early branch in the returned JSX; import `StudioStarters`)
- Test: `tests/draft-workspace-composition.test.ts` (add assertions; full rewrite is Task 6)

**Interfaces:**
- Consumes: `StudioStarters` (Task 1), `selectedOutputTypeId`/`setSelectedOutputTypeId`, the draft create/select flow.
- Produces: an `isEmptyDraft` boolean (true when the draft has no title beyond the default, empty `body`, and no authored `blocks`), and an `onStartFromStarter(choice)` handler that sets the output type (and, when not `blank`, applies that type's `starterBody`/`starterTitle`) then lets the editor render.

- [ ] **Step 1: Write the failing test (append to draft-workspace-composition.test.ts)**

```ts
assert.match(draftClient, /import \{ StudioStarters \} from '\.\/StudioStarters'/);
assert.match(draftClient, /isEmptyDraft/);
assert.match(draftClient, /<StudioStarters\b/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts`
Expected: FAIL — `StudioStarters` not imported/rendered yet.

- [ ] **Step 3: Implement in DraftClient.tsx**

Add near the other `useMemo` derivations:
```tsx
const isEmptyDraft = useMemo(
  () =>
    body.trim().length === 0 &&
    blocks.every((b) => !('text' in b) || !String((b as { text?: string }).text ?? '').trim()) &&
    (title.trim().length === 0 || title.trim() === 'Untitled draft'),
  [body, blocks, title],
);
```
Add the handler:
```tsx
const onStartFromStarter = (choice: { outputTypeId: NewLoomDraftOutputTypeId; blank?: boolean }) => {
  setSelectedOutputTypeId(choice.outputTypeId);
  if (!choice.blank) {
    const ot = NEW_LOOM_DRAFT_OUTPUT_TYPES.find((t) => t.id === choice.outputTypeId);
    if (ot) {
      setTitle(ot.starterTitle);
      setBody(ot.starterBody);
      setBlocks(syncBlocksFromBody(ot.starterBody));
      setSaveState('idle');
      scheduleSave(ot.starterTitle, ot.starterBody, syncBlocksFromBody(ot.starterBody));
    }
  }
};
```
In the returned JSX, immediately inside `<main className={...}>`, before the rail/main, branch:
```tsx
{isEmptyDraft ? (
  <StudioStarters
    userInitial={(identityProfile?.home.name?.trim() || 'You').charAt(0).toUpperCase()}
    onStart={onStartFromStarter}
  />
) : (
  <>{/* existing rail + main + inspector tree (refined in later tasks) */}</>
)}
```
Import `StudioStarters` at the top. Keep the hidden `sr-title` h1 rendered in both branches.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts`
Expected: PASS (the three new assertions). Run `npm run typecheck` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/draft/DraftClient.tsx tests/draft-workspace-composition.test.ts
git commit -m "feat(studio): show StudioStarters when the draft is empty"
```

---

### Task 3: Details drawer — wrap the Inspector, closed by default

**Files:**
- Modify: `app/draft/DraftClient.tsx` (add `detailsOpen` state; wrap the existing `<aside className="new-loom-draft__inspector">` (lines ~1433–1944) in a drawer container; add a `⋯ Details` toggle)
- Modify: `app/draft/draft-evidence-desk.module.css` (drawer off-canvas styles)
- Test: `tests/draft-workspace-composition.test.ts`

**Interfaces:**
- Produces: `detailsOpen: boolean` (default `false`), `setDetailsOpen`; the inspector is rendered inside `new-loom-draft__details` with `data-open={detailsOpen}`; a toggle button with `aria-expanded={detailsOpen}` and `aria-controls`.

- [ ] **Step 1: Write the failing test**

```ts
assert.match(draftClient, /const \[detailsOpen, setDetailsOpen\] = useState\(false\)/);
assert.match(draftClient, /new-loom-draft__details/);
assert.match(draftClient, /aria-expanded=\{detailsOpen\}/);
assert.match(draftDeskCss, /\.surface :global\(\.new-loom-draft__details\)/);
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add `const [detailsOpen, setDetailsOpen] = useState(false);`. Wrap the existing inspector `<aside …>` in:
```tsx
<div
  id="new-loom-draft-details"
  className="new-loom-draft__details"
  data-open={detailsOpen}
  aria-hidden={!detailsOpen}
>
  {/* existing <aside className="new-loom-draft__inspector"> … </aside> unchanged */}
</div>
```
Add the toggle (used by Task 4's top bar):
```tsx
<button
  type="button"
  className="new-loom-draft__details-toggle"
  aria-expanded={detailsOpen}
  aria-controls="new-loom-draft-details"
  onClick={() => setDetailsOpen((v) => !v)}
>
  Details
</button>
```
In the CSS module, add off-canvas styles: `.surface :global(.new-loom-draft__details)` positioned as a right slide-over, `transform: translateX(100%)` by default, `[data-open='true']` → `translateX(0)`, with a width clamp; honor `prefers-reduced-motion`.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts` → PASS. `npm run typecheck` → 0.

- [ ] **Step 5: Commit**

```bash
git add app/draft/DraftClient.tsx app/draft/draft-evidence-desk.module.css tests/draft-workspace-composition.test.ts
git commit -m "feat(studio): move Inspector into a closed-by-default Details drawer"
```

---

### Task 4: Slim top bar + quiet grounding line + "Help me write"

**Files:**
- Modify: `app/draft/DraftClient.tsx` (replace the dense header: `document-header` proof strip + `type-rail` OUTPUT chips removed from the default flow; add a slim top bar with back · Saved · Details; add a quiet grounding line; add a soft "Help me write" button calling `continueWithAI`)
- Modify: `app/draft/draft-evidence-desk.module.css` + `app/globals.css` (top-bar + grounding-line styles; drop now-unused header rules)
- Test: `tests/draft-workspace-composition.test.ts`

**Interfaces:**
- Consumes: `continueWithAI()` (AI), `sourceTiles`/`provenanceMatches`/`displayReferences` (grounding data), `detailsOpen` toggle (Task 3), `saveState`.
- Produces: a top bar (`new-loom-draft__topbar`) with the existing `← Digital Me` link, a `Saved` status, and the `Details` toggle; a quiet grounding line `new-loom-draft__grounding` shown only when `sourceTiles.length > 0`; a `Help me write` button (`new-loom-draft__help`) → `continueWithAI()`.

- [ ] **Step 1: Write the failing test**

```ts
// Calm header: no jargon, no OUTPUT chips, no proof strip on the default surface.
assert.doesNotMatch(draftClient, /Source-grounded writing/);
assert.doesNotMatch(draftClient, /new-loom-draft__type-rail/);
assert.doesNotMatch(draftClient, /provenance match/);
assert.doesNotMatch(draftClient, /Continue with AI/);
// New calm affordances.
assert.match(draftClient, /new-loom-draft__topbar/);
assert.match(draftClient, /Help me write/);
assert.match(draftClient, /new-loom-draft__grounding/);
assert.match(draftClient, /Backed by/);
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Remove the `type-rail` section (lines ~1251–1274) and the proof strip (lines ~1238–1249) from the default JSX (the OUTPUT chips + provenance counters now live only in Details/Task 6 copy).
- Replace the dense `document-header` with a slim top bar:
  ```tsx
  <div className="new-loom-draft__topbar">
    <a className="new-loom-draft__home" href="/digital-me">← Digital Me</a>
    <div className="new-loom-draft__topbar-right">
      <span className="new-loom-draft__save">{saveState === 'saved' ? 'Saved' : saveState === 'unavailable' ? 'Storage unavailable' : 'Unsaved'}</span>
      {/* the Details toggle button from Task 3 */}
    </div>
  </div>
  ```
- Keep the title input (`new-loom-draft__title`).
- Add the quiet grounding line near the editor:
  ```tsx
  {sourceTiles.length > 0 ? (
    <button
      type="button"
      className="new-loom-draft__grounding"
      onClick={() => { setInspectorMode('sources'); setDetailsOpen(true); }}
    >
      Backed by {sourceTiles.length} of your source{sourceTiles.length === 1 ? '' : 's'}
    </button>
  ) : null}
  ```
- Add the soft AI button near the editor toolbar:
  ```tsx
  <button type="button" className="new-loom-draft__help" onClick={() => void continueWithAI()}>
    Help me write
  </button>
  ```
- Relabel the editor toolbar: remove the `Source-grounded writing` label text (keep the action buttons). Add top-bar + grounding + help styles to the CSS module; remove the now-dead `type-rail`/`proof-strip` rules from `globals.css` and the module.

- [ ] **Step 4: Run tests + typecheck**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts` → PASS. `npm run typecheck` → 0.

- [ ] **Step 5: Commit**

```bash
git add app/draft/DraftClient.tsx app/draft/draft-evidence-desk.module.css app/globals.css tests/draft-workspace-composition.test.ts
git commit -m "feat(studio): slim top bar, quiet grounding line, Help me write"
```

---

### Task 5: Single-column layout + remove the always-on identity rail

**Files:**
- Modify: `app/draft/DraftClient.tsx` (move the back link + avatar from `identity-rail` into the top bar; relocate the rail's Workspace counters into the Details drawer; remove the always-on `<aside className="new-loom-draft__identity-rail">`)
- Modify: `app/globals.css` (the `.new-loom-draft` grid → single centered column) + `app/draft/draft-evidence-desk.module.css` (rail rules removed/repurposed)
- Test: `tests/draft-workspace-composition.test.ts`

**Interfaces:**
- Consumes: the top bar (Task 4), the Details drawer (Task 3).
- Produces: a single-column `.new-loom-draft` (no 3-column grid); the avatar + Workspace counters relocated (top bar + Details); `identity-rail` no longer always-on.

- [ ] **Step 1: Write the failing test**

```ts
assert.doesNotMatch(draftClient, /new-loom-draft__identity-rail/);
assert.doesNotMatch(globals, /\.new-loom-draft\s*\{[\s\S]{0,400}grid-template-columns:\s*minmax\(14rem/);
assert.match(globals, /\.new-loom-draft\s*\{/);
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Delete the `<aside className="new-loom-draft__identity-rail">` block; relocate: the `← Digital Me` link is already in the top bar; render the avatar in the top bar; move the Workspace `Sources/Words/Provenance` counters into a small section inside the Details drawer (`new-loom-draft__details`), keeping their values (`sourceTiles.length`, `wordCount`, `provenanceMatches.length`).
- In `globals.css`, change `.new-loom-draft` from the 3-column grid to a single centered column (e.g. `display: block; max-width: 60rem; margin-inline: auto;` — mirror the module's `__main` centring) and remove the rail/inspector column tracks. Remove dead `identity-rail` rules from the module (or repurpose minimal ones).

- [ ] **Step 4: Run tests + typecheck**

Run: `npx tsx --test tests/draft-workspace-composition.test.ts` → PASS. `npm run typecheck` → 0.

- [ ] **Step 5: Commit**

```bash
git add app/draft/DraftClient.tsx app/globals.css app/draft/draft-evidence-desk.module.css tests/draft-workspace-composition.test.ts
git commit -m "feat(studio): single calm column; rail counters into Details"
```

---

### Task 6: Rewrite the composition contract + full verification

**Files:**
- Modify: `tests/draft-workspace-composition.test.ts` (consolidate into one coherent assertion of the NEW calm contract; remove stale pins of the old structure)
- Check/modify: `tests/loom-personal-positioning.test.ts` and any other suite pinning `.new-loom-draft*` structure/grid; update in lockstep
- Modify: copy strings across `DraftClient.tsx` per the spec's jargon table (final pass)

**Interfaces:** none new — this task makes the suite green against the redesigned surface.

- [ ] **Step 1: Rewrite draft-workspace-composition.test.ts to the calm contract**

Replace the body of the existing `test('Draft page is composed …')` so it asserts (keep what still holds — redirect stub, no `LoomGlobalNav`, `← Digital Me` link, `editId`, `selectDraftById`, no `Yiping Yin`, `Your name`, hidden `sr-title`, `DraftBlockEditor` mount) **and** the new structure:
```ts
// Calm entry + progressive disclosure.
assert.match(draftClient, /<StudioStarters\b/);
assert.match(draftClient, /Add to your Digital Me/);
assert.match(draftClient, /new-loom-draft__topbar/);
assert.match(draftClient, /new-loom-draft__details/);
assert.match(draftClient, /aria-expanded=\{detailsOpen\}/);
assert.match(draftClient, /Help me write/);
assert.match(draftClient, /Backed by/);
// Jargon + always-on density removed from the default surface.
assert.doesNotMatch(draftClient, /new-loom-draft__identity-rail/);
assert.doesNotMatch(draftClient, /new-loom-draft__type-rail/);
assert.doesNotMatch(draftClient, /Source-grounded writing/);
assert.doesNotMatch(draftClient, /provenance match/);
assert.doesNotMatch(draftClient, /Continue with AI/);
assert.doesNotMatch(draftClient, /Inspector/);
// Single-column layout.
assert.doesNotMatch(globals, /grid-template-columns:\s*minmax\(14rem,\s*17rem\)/);
// Engine preserved.
assert.match(draftClient, /DraftBlockEditor/);
assert.match(draftClient, /selectDraftById/);
```
Delete obsolete pins (3-col grid, `identity-rail`, `workspace`, `document-header`, `editor-shell`/`editor-toolbar` as *default* requirements, `proof-strip`, `Publish answer preview` if it moved into Details — assert those inside the Details subtree instead if still present).

- [ ] **Step 2: Reconcile other suites**

Run the full suite and fix any other file pinning removed structure:
Run: `npm run test:contracts 2>&1 | grep -E "not ok|AssertionError" | head`
Update `tests/loom-personal-positioning.test.ts` (and any other) in lockstep — re-point or remove pins of `.new-loom-draft` grid / rail / inspector that no longer exist on the default surface.

- [ ] **Step 3: Full gate**

Run: `npm run typecheck` → exit 0.
Run: `npm run test:contracts` → `ℹ fail 0`.

- [ ] **Step 4: Clean-build browser verification**

`preview_stop` the LOOM server, `rm -rf .next-app-dev`, `preview_start LOOM`. Open `/digital-me?edit=new`:
- empty state shows "Add to your Digital Me" + 4 starters + "just start writing"; pick one → editor;
- writing state: slim top bar (back · Saved · Details), title, `DraftBlockEditor`, quiet "Help me write", and (with sources) the quiet grounding line; **no** rail / OUTPUT chips / proof strip / Inspector column;
- `Details` opens the drawer with sources/provenance/board/type/counters;
- dark evidence-desk theme intact, no console errors. Screenshot for the record.

- [ ] **Step 5: Commit + open PR**

```bash
git add tests/ app/draft/DraftClient.tsx
git commit -m "test(studio): rewrite composition contract to the calm structure"
git push -u origin loom-studio-simplify
gh pr create --base main --head loom-studio-simplify --title "Studio simplification: calm one-column build surface" --body "Implements docs/superpowers/specs/2026-06-25-studio-simplification-design.md. Engine reused; presentation re-chromed. typecheck + test:contracts green; clean-build browser verified."
```
Watch CI green, then merge.

---

## Self-review

- **Spec coverage:** ① default starters → Task 1+2; ② writing state (top bar, title, editor, Help me write, grounding) → Task 4; ③ Details drawer → Task 3 (+ counters in Task 5); ④ copy/jargon → Tasks 4 + 6; ⑤ structural mapping (rail/inspector/header/grid) → Tasks 3–5; contract-test lockstep → Task 6; clean-build verify → Task 6 Step 4. All covered.
- **Placeholder scan:** none (all steps carry concrete code/commands).
- **Type consistency:** `StudioStartersProps.onStart` ↔ `onStartFromStarter` shape (`{ outputTypeId, blank? }`) matches across Tasks 1–2; `detailsOpen`/`setDetailsOpen` consistent Tasks 3–6; `NewLoomDraftOutputTypeId` from `draft-storage` used throughout.
- **Risk note:** Task 4/5 touch the largest part of `DraftClient.tsx`; keep each commit small and re-run `test:contracts` before moving on. AI surface ("Help me write") reuses `continueWithAI`; the AI suggestion + insert/discard UI currently lives in the inspector Sources tab — it remains reachable via Details, so no AI capability is lost.
