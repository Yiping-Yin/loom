# House the Studio in Digital Me — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the block-document Studio as a first-class "Studio" section inside the live `/digital-me` (listing the user's working documents), and give the `/draft` editor a quiet "← Digital Me" home link.

**Architecture:** A new pure presentational `BeginnerDocuments` component renders a list of `StudioDocumentSummary` cards (parent owns the data read so the component is SSR-test-friendly). `BeginnerDigitalMe` reads working drafts via `listDrafts()` after mount, maps them to summaries, and places the section after Proof / before Ask. `DraftClient` gains a back link inside its identity rail (keeping the 3-col grid intact). No new storage, no document-data-flow (next slice).

**Tech Stack:** Next 16 / React 19 / TypeScript. Tests: `node:test` + `tsx` (`npm run test:contracts`); render tests use `renderToStaticMarkup` + a CSS-module proxy (see `tests/beginner-digital-me-render.test.tsx`).

**Spec:** `docs/superpowers/specs/2026-06-23-loom-studio-in-digital-me-design.md`

**Reference shapes (current code — do not re-derive):**
- `lib/new-loom/draft-storage.ts:404` `listDrafts(adapter, key?): NewLoomDraftRecord[]` (already sorted by `updatedAt` desc).
- `lib/new-loom/draft-storage.ts:395` `browserDraftStorage(): DraftStorageAdapter | null`.
- `lib/new-loom/draft-storage.ts:1442` `draftWordCount(value: string): number`.
- `NewLoomDraftRecord = { id; title; body; references; blocks?; createdAt; updatedAt }`.
- `app/digital-me/BeginnerDigitalMe.tsx` — client component `BeginnerDigitalMe({ profile })`; uses `LandingNav`; sections render inside `<div className={...shell}>`; Proof block at lines 278-282, Ask block at 291-308 (insert the Studio section between them). Existing localStorage-read effect pattern at line 124.
- `app/draft/DraftClient.tsx:~1144` — `return ( <main className={`new-loom-draft ${draftDeskStyles.surface}`}> <aside className="new-loom-draft__identity-rail" …> <section className="new-loom-draft__profile-card" …>`. (`.new-loom-draft` is a 3-col CSS grid — the home link MUST go *inside* the identity-rail aside, not as a direct child of `<main>`.)
- `DraftClient` loads a draft by `?d=<id>` (verified in preview).
- `package.json` `test:contracts` is an **explicit file list** (not a glob) — new test files must be appended to it.

---

## Task 1: `BeginnerDocuments` component (pure) + summary mapper + CSS

**Files:**
- Create: `app/digital-me/BeginnerDocuments.tsx`
- Create: `app/digital-me/BeginnerDocuments.module.css`
- Test: `tests/beginner-documents-render.tsx`
- Modify: `package.json` (register the test)

- [ ] **Step 1: Write the failing test** — `tests/beginner-documents-render.tsx`

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const cssProxy = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : '') });
require.extensions['.css'] = (m: { exports: unknown }) => { m.exports = { __esModule: true, default: cssProxy }; };

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(node) as string;
}
function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

test('toStudioDocumentSummary maps a draft record, defaulting an empty title', () => {
  const { toStudioDocumentSummary } = require('../app/digital-me/BeginnerDocuments');
  const s = toStudioDocumentSummary({
    id: 'd1', title: '  ', body: 'one two three', references: [{ href: 'loom://s', label: 'S' }],
    createdAt: '2026-06-22T00:00:00.000Z', updatedAt: '2026-06-22T10:00:00.000Z',
  });
  assert.equal(s.id, 'd1');
  assert.equal(s.title, 'Untitled document');
  assert.equal(s.sourceCount, 1);
  assert.equal(s.wordCount, 3);
  assert.equal(s.updatedAt, '2026-06-22T10:00:00.000Z');
});

test('BeginnerDocuments renders document cards that open /draft?d=<id>', () => {
  const { BeginnerDocuments } = require('../app/digital-me/BeginnerDocuments');
  const html = render(
    <BeginnerDocuments
      documents={[
        { id: 'd1', title: 'Quant note', sourceCount: 2, wordCount: 120, updatedAt: '2026-06-22T10:00:00.000Z' },
      ]}
    />,
  );
  assert.match(html, /href="\/draft\?d=d1"/);
  assert.match(html, /href="\/draft"/);            // the "New document" header action
  const text = visibleText(html);
  assert.match(text, /Studio/);
  assert.match(text, /Quant note/);
  assert.match(text, /Grounded by 2 sources/);
  assert.match(text, /120 words/);
});

test('BeginnerDocuments shows an empty-state CTA when there are no documents', () => {
  const { BeginnerDocuments } = require('../app/digital-me/BeginnerDocuments');
  const html = render(<BeginnerDocuments documents={[]} />);
  assert.match(html, /href="\/draft"/);
  assert.match(visibleText(html), /Start a document/);
});
```

- [ ] **Step 2: Run it to verify it fails** — `npm run test:contracts 2>&1 | grep beginner-documents` → FAIL (module not found / not registered). (If unregistered, run directly: `npx tsx --test tests/beginner-documents-render.tsx` → FAIL.)

- [ ] **Step 3: Implement** — `app/digital-me/BeginnerDocuments.tsx`

```tsx
'use client';

import React from 'react';
import { draftWordCount, type NewLoomDraftRecord } from '../../lib/new-loom/draft-storage';
import styles from './BeginnerDocuments.module.css';

export type StudioDocumentSummary = {
  id: string;
  title: string;
  sourceCount: number;
  wordCount: number;
  updatedAt: string;
};

export function toStudioDocumentSummary(record: NewLoomDraftRecord): StudioDocumentSummary {
  return {
    id: record.id,
    title: record.title?.trim() || 'Untitled document',
    sourceCount: record.references?.length ?? 0,
    wordCount: draftWordCount(record.body ?? ''),
    updatedAt: record.updatedAt,
  };
}

export function BeginnerDocuments({ documents }: { documents: StudioDocumentSummary[] }) {
  return (
    <section className={styles.section} aria-labelledby="beginner-documents-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Studio</p>
          <h2 id="beginner-documents-title" className={styles.title}>Your documents</h2>
        </div>
        <a className={styles.newAction} href="/draft">New document</a>
      </header>

      {documents.length > 0 ? (
        <ul className={styles.list}>
          {documents.map((doc) => (
            <li key={doc.id}>
              <a className={styles.card} href={`/draft?d=${doc.id}`}>
                <span className={styles.cardTitle}>{doc.title}</span>
                <span className={styles.cardMeta}>
                  Grounded by {doc.sourceCount} {doc.sourceCount === 1 ? 'source' : 'sources'}
                  {' · '}{doc.wordCount} {doc.wordCount === 1 ? 'word' : 'words'}
                  {' · '}Updated {doc.updatedAt.slice(0, 10)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <a className={styles.empty} href="/draft">
          <span className={styles.emptyTitle}>Turn your work into a grounded document.</span>
          <span className={styles.emptyCta}>Start a document →</span>
        </a>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Add CSS** — `app/digital-me/BeginnerDocuments.module.css` (reuse existing global tokens; mirror the glass/card register used elsewhere in Digital Me):

```css
.section { display: grid; gap: 1rem; }
.header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.eyebrow {
  margin: 0; font-family: var(--mono); font-size: 0.72rem; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-3, #8a9099);
}
.title { margin: 0.15rem 0 0; font-family: var(--serif, Georgia, serif); font-weight: 600; font-size: 1.3rem; color: var(--text-1, #f3f5f7); }
.newAction {
  flex: none; padding: 0.45rem 0.85rem; border: 1px solid var(--line, rgba(255,255,255,0.14));
  border-radius: 999px; font-size: 0.82rem; color: var(--text-1, #f3f5f7);
  background: var(--loom-glass-bg, rgba(255,255,255,0.04));
  -webkit-backdrop-filter: var(--loom-glass-blur, blur(20px)); backdrop-filter: var(--loom-glass-blur, blur(20px));
  transition: border-color 200ms ease, background 200ms ease;
}
.newAction:hover, .newAction:focus-visible { border-color: var(--signature-cyan, #4BC5DE); }
.list { display: grid; gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
.card {
  display: grid; gap: 0.3rem; padding: 0.9rem 1.05rem;
  border: 1px solid var(--line, rgba(255,255,255,0.12)); border-radius: 14px;
  background: var(--loom-glass-bg, rgba(255,255,255,0.04));
  box-shadow: var(--loom-glass-shadow, 0 1px 0 rgba(255,255,255,0.06) inset);
  transition: border-color 200ms ease, transform 200ms ease;
}
.card:hover, .card:focus-visible { border-color: var(--signature-cyan, #4BC5DE); transform: translateY(-1px); }
.cardTitle { color: var(--text-1, #f3f5f7); font-weight: 600; font-size: 1rem; }
.cardMeta { color: var(--text-3, #8a9099); font-family: var(--mono); font-size: 0.76rem; letter-spacing: 0.02em; }
.empty {
  display: grid; gap: 0.4rem; padding: 1.4rem 1.2rem; text-align: left;
  border: 1px dashed var(--line, rgba(255,255,255,0.16)); border-radius: 14px;
  background: var(--loom-glass-bg, rgba(255,255,255,0.03));
  transition: border-color 200ms ease;
}
.empty:hover, .empty:focus-visible { border-color: var(--signature-cyan, #4BC5DE); }
.emptyTitle { color: var(--text-1, #f3f5f7); font-size: 0.98rem; }
.emptyCta { color: var(--signature-cyan, #4BC5DE); font-family: var(--mono); font-size: 0.82rem; letter-spacing: 0.04em; }
@media (prefers-reduced-motion: reduce) {
  .card, .newAction, .empty { transition: none; }
  .card:hover, .card:focus-visible { transform: none; }
}
```

- [ ] **Step 5: Register the test** — in `package.json`, append ` tests/beginner-documents-render.tsx` to the end of the `test:contracts` file list (same style as the other entries).

- [ ] **Step 6: Run to verify pass** — `npm run test:contracts 2>&1 | grep -E "beginner-documents|ℹ (pass|fail)"` → the 3 new tests pass; suite still green.

- [ ] **Step 7: Commit** — `git add app/digital-me/BeginnerDocuments.tsx app/digital-me/BeginnerDocuments.module.css tests/beginner-documents-render.tsx package.json && git commit -m "feat(studio): BeginnerDocuments section component + summary mapper"`

---

## Task 2: Wire the Studio section into `BeginnerDigitalMe`

**Files:**
- Modify: `app/digital-me/BeginnerDigitalMe.tsx` (imports; new state + effect; place the section between Proof and Ask)
- Test: `tests/beginner-digital-me-render.test.tsx` (extend)

- [ ] **Step 1: Write the failing test** — append to `tests/beginner-digital-me-render.test.tsx`:

```tsx
test('BeginnerDigitalMe mounts the Studio section (empty state in SSR)', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  // SSR render: the listDrafts effect does not run, so the section shows its
  // header + empty-state CTA. This pins that the Studio section is mounted.
  const html = render(<BeginnerDigitalMe profile={ESTABLISHED_PROFILE} />);
  const text = visibleText(html);
  assert.match(text, /Studio/);
  assert.match(text, /Start a document/);
  assert.match(html, /href="\/draft"/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/beginner-digital-me-render.test.tsx 2>&1 | grep -E "Studio|fail"` → FAIL (no Studio section yet).

- [ ] **Step 3: Add imports** — near the existing imports in `app/digital-me/BeginnerDigitalMe.tsx`:

```tsx
import { BeginnerDocuments, toStudioDocumentSummary, type StudioDocumentSummary } from './BeginnerDocuments';
import { browserDraftStorage, listDrafts } from '../../lib/new-loom/draft-storage';
```

- [ ] **Step 4: Add state + read effect** — alongside the component's other `useState`/`useEffect` hooks (e.g. just after the existing state declarations near the top of the component body):

```tsx
const [studioDocuments, setStudioDocuments] = useState<StudioDocumentSummary[]>([]);
useEffect(() => {
  const adapter = browserDraftStorage();
  if (!adapter) return;
  // listDrafts is already sorted newest-first; cap the rendered list (the rest
  // remain openable from the Studio itself).
  setStudioDocuments(listDrafts(adapter).slice(0, 6).map(toStudioDocumentSummary));
}, []);
```

- [ ] **Step 5: Place the section** — in the JSX, insert between the Proof block (ends ~line 282) and the Ask block (starts ~line 291). The section is **not** gated by `established` — it is always an entry point:

```tsx
{/* Studio — the user's working documents; always present as an entry point. */}
<div data-reveal="">
  <BeginnerDocuments documents={studioDocuments} />
</div>
```

- [ ] **Step 6: Run to verify pass** — `npx tsx --test tests/beginner-digital-me-render.test.tsx 2>&1 | grep -E "ℹ (pass|fail)"` → pass. Then `npm run typecheck` → exit 0; `git checkout -- tsconfig.json next-env.d.ts`.

- [ ] **Step 7: Commit** — `git add app/digital-me/BeginnerDigitalMe.tsx tests/beginner-digital-me-render.test.tsx && git commit -m "feat(studio): surface the Studio section in /digital-me"`

---

## Task 3: `/draft` "← Digital Me" home link

**Files:**
- Modify: `app/draft/DraftClient.tsx` (add the link as the first child of the identity-rail `<aside>`)
- Modify: `app/draft/draft-evidence-desk.module.css` (style `.new-loom-draft__home`)
- Test: `tests/draft-workspace-composition.test.ts` (extend)

- [ ] **Step 1: Write the failing assertion** — add to `tests/draft-workspace-composition.test.ts` (near the existing `doesNotMatch(/LoomGlobalNav/)` line):

```ts
// The editor lost its nav (focused workbench) but must still offer a way home.
assert.match(draftClient, /<a className="new-loom-draft__home" href="\/digital-me">/);
assert.match(draftDeskCss, /\.surface :global\(\.new-loom-draft__home\)/);
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/draft-workspace-composition.test.ts 2>&1 | grep -E "fail|home"` → FAIL.

- [ ] **Step 3: Add the link** — in `app/draft/DraftClient.tsx`, make it the first child of the identity-rail aside (keeps the `.new-loom-draft` 3-col grid intact — do NOT add it as a direct child of `<main>`):

```tsx
<aside className="new-loom-draft__identity-rail" aria-label="Profile and workflow">
  <a className="new-loom-draft__home" href="/digital-me">← Digital Me</a>
  <section className="new-loom-draft__profile-card" aria-label="Profile">
```

- [ ] **Step 4: Style it** — append to `app/draft/draft-evidence-desk.module.css`:

```css
.surface :global(.new-loom-draft__home) {
  align-self: start;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
  transition: color var(--dur-1) var(--ease);
}
.surface :global(.new-loom-draft__home:hover) { color: var(--text-1); }
.surface :global(.new-loom-draft__home:focus-visible) {
  outline: 2px solid var(--signature-cyan);
  outline-offset: 3px;
  border-radius: var(--r-1);
}
```

- [ ] **Step 5: Run to verify pass** — `npx tsx --test tests/draft-workspace-composition.test.ts 2>&1 | grep -E "ℹ (pass|fail)"` → pass.

- [ ] **Step 6: Commit** — `git add app/draft/DraftClient.tsx app/draft/draft-evidence-desk.module.css tests/draft-workspace-composition.test.ts && git commit -m "feat(studio): /draft home link back to Digital Me"`

---

## Task 4: Full verify + preview + land

- [ ] **Step 1:** `npm run test:contracts` → all green (642 baseline + 4 new tests). Investigate any non-green before proceeding.
- [ ] **Step 2:** `npm run typecheck` → exit 0; then `git checkout -- tsconfig.json next-env.d.ts`.
- [ ] **Step 3: Preview** — start the LOOM preview; on `/digital-me` (seed a `localStorage` beginner profile so `BeginnerDigitalMe` renders, and seed `loom.new.drafts.v1` with a draft): confirm the **Studio** section appears with a document card whose link is `/draft?d=<id>`, and the empty state shows "Start a document" when no drafts. Click into `/draft`, confirm the "← Digital Me" link returns to `/digital-me`. Screenshot both.
- [ ] **Step 4: Land** — branch `loom-studio-in-digital-me` (off main), the four commits, push, PR "Studio in Digital Me (Phase 3 slice 1)", squash-merge, sync main, then `npm run app:user && npm run app:smoke` (restore `tsconfig.json`/`next-env.d.ts` after). Update memory.

---

## Out of scope (do NOT build — per spec)
Documents → evidence/Ask flow; changes to `/drafts` (published records); owner Role-OS showcase; internal Digital-Me tabs; in-editor draft switcher; server persistence.
