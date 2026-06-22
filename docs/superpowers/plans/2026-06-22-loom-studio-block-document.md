# LOOM Studio Phase 1 — Draft becomes a block document — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve `/draft` from a single-`<textarea>` writer into an authored block document (text / code-as-evidence / source-cite) that ingests + grounds real work, while preserving all existing Draft behaviour.

**Architecture:** Authored blocks (`NewLoomDraftDocBlock[]`) become the canonical edit model; the existing `body: string` is kept as a **synced markdown serialization** so all body-based machinery (references, provenance, AI compose/inline-edit, answer-preview, native save) is untouched. A new `DraftBlockEditor` replaces the textarea *inside* the existing `new-loom-draft__editor-shell`; everything else in `DraftClient.tsx` stays.

**Tech Stack:** Next 16 / React 19 / TypeScript. Tests: `node:test` + `tsx` (run via `npm run test:contracts`). Render tests use `react-dom/server` `renderToStaticMarkup` with a CSS-module proxy (see `tests/digital-postcard-render.tsx` for the established pattern). No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-06-22-loom-studio-block-document-design.md`

**Reference shapes (current code, do not re-derive):**
- `lib/new-loom/draft-storage.ts:293` `NewLoomDraftRecord = { id; title; body; references; createdAt; updatedAt }`
- `lib/new-loom/draft-storage.ts:11` `NewLoomDraftReference` (has `label`, `href`, `kind?`, `excerpt?`, …)
- `lib/new-loom/draft-storage.ts:2024` `createDraft(adapter, input, options)` · `:2053` `updateDraft(adapter, id, patch, options)` — `patch: Partial<Pick<…,'title'|'body'|'references'>>`
- `lib/new-loom/draft-storage.ts:310` `NEW_LOOM_DRAFTS_KEY = 'loom.new.drafts.v1'`
- `app/draft/DraftClient.tsx:1164-1192` the `<textarea className="new-loom-draft__body" value={body} onChange=…>` to replace; it lives inside `new-loom-draft__editor-shell`.
- Contract test `tests/draft-workspace-composition.test.ts` pins `editor-shell` / `editor-toolbar` / `proof-strip` / the 3-col grid / copy — it does **not** pin `new-loom-draft__body`.

---

## Task 1: Doc-block model + body⇄blocks serialization (the load-bearing core)

**Files:**
- Create: `lib/new-loom/draft-blocks.ts`
- Test: `tests/draft-doc-blocks.test.ts`
- Register: `package.json` test:contracts glob already picks up `tests/*.test.ts` — verify it matches (it does); no change expected.

- [ ] **Step 1: Write the failing test** — `tests/draft-doc-blocks.test.ts`

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type NewLoomDraftDocBlock,
  blocksToBody,
  bodyToBlocks,
  newDocBlock,
} from '../lib/new-loom/draft-blocks';

const idSeq = () => { let n = 0; return () => `b${++n}`; };

test('blocksToBody serializes text, code (fenced + attributed), and cite', () => {
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Intro paragraph.' },
    { id: 'b2', kind: 'code', text: 'print(1)', lang: 'python', source: 'repo/strat.py' },
    { id: 'b3', kind: 'cite', href: 'loom://s/econ', label: 'ECON3202 notes', excerpt: 'concavity' },
  ];
  const body = blocksToBody(blocks);
  assert.match(body, /Intro paragraph\./);
  assert.match(body, /```python repo\/strat\.py\nprint\(1\)\n```/);
  assert.match(body, /> concavity/);            // cite renders a quote so provenance still matches
  assert.match(body, /ECON3202 notes/);
});

test('bodyToBlocks round-trips: blocks -> body -> blocks is idempotent', () => {
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Para one.\n\nPara two.' },
    { id: 'b2', kind: 'code', text: 'const x = 1;', lang: 'ts' },
  ];
  const body = blocksToBody(blocks);
  const round = bodyToBlocks(body, [], idSeq());
  assert.equal(blocksToBody(round), body);      // serialization is stable
});

test('bodyToBlocks migrates a legacy body-only draft into text + code blocks', () => {
  const body = 'Heading line\n\nA paragraph.\n\n```js\nrun();\n```';
  const blocks = bodyToBlocks(body, [], idSeq());
  assert.ok(blocks.some((b) => b.kind === 'text'));
  assert.ok(blocks.some((b) => b.kind === 'code' && b.text.includes('run()')));
});

test('newDocBlock makes a stable empty block of each kind', () => {
  assert.equal(newDocBlock('text', () => 'x').kind, 'text');
  assert.equal(newDocBlock('code', () => 'x').kind, 'code');
});
```

- [ ] **Step 2: Run it to verify it fails** — `npm run test:contracts 2>&1 | grep draft-doc-blocks` → FAIL (module not found).

- [ ] **Step 3: Implement** — `lib/new-loom/draft-blocks.ts`

```ts
import {
  draftBlocksFromBody,
  type NewLoomDraftReference,
} from './draft-storage';

export type NewLoomDraftDocBlock =
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'code'; text: string; lang?: string; source?: string }
  | { id: string; kind: 'cite'; href: string; label: string; excerpt?: string };

export type DocBlockKind = NewLoomDraftDocBlock['kind'];

export function newDocBlock(kind: DocBlockKind, createId: () => string): NewLoomDraftDocBlock {
  const id = createId();
  if (kind === 'code') return { id, kind: 'code', text: '' };
  if (kind === 'cite') return { id, kind: 'cite', href: '', label: '' };
  return { id, kind: 'text', text: '' };
}

export function blocksToBody(blocks: NewLoomDraftDocBlock[]): string {
  return blocks
    .map((b) => {
      if (b.kind === 'code') {
        const fence = ['```' + [b.lang, b.source].filter(Boolean).join(' ')].join('');
        return `${fence}\n${b.text}\n\`\`\``;
      }
      if (b.kind === 'cite') {
        const quote = (b.excerpt ?? '').trim();
        const cite = `[${b.label}](${b.href})`;
        return quote ? `> ${quote}\n> — ${cite}` : `— ${cite}`;
      }
      return b.text;
    })
    .join('\n\n')
    .trim();
}

export function bodyToBlocks(
  body: string,
  references: NewLoomDraftReference[],
  createId: () => string,
): NewLoomDraftDocBlock[] {
  const derived = draftBlocksFromBody(body, references); // existing parser (draft-storage.ts:1445)
  if (derived.length === 0) {
    return body.trim() ? [{ id: createId(), kind: 'text', text: body }] : [];
  }
  return derived.map((d) => {
    if (d.kind === 'code') {
      const lines = d.text.split('\n');
      const fence = lines[0]?.startsWith('```') ? lines[0].slice(3).trim() : '';
      const [lang, source] = fence.split(/\s+/);
      const inner = lines
        .filter((l, i) => !(i === 0 && l.startsWith('```')) && l.trim() !== '```')
        .join('\n');
      return { id: createId(), kind: 'code', text: inner, lang: lang || undefined, source: source || undefined };
    }
    return { id: createId(), kind: 'text', text: d.text };
  });
}
```

> Note: `cite` blocks are *authored* additions; `bodyToBlocks` migrates legacy content to text/code only (cite is created via the reference picker, Task 6). Round-trip stability is the tested invariant — `blocksToBody(bodyToBlocks(x))` must equal `blocksToBody` of the canonical blocks, not necessarily `x` byte-for-byte.

- [ ] **Step 4: Run to verify pass** — `npm run test:contracts 2>&1 | grep draft-doc-blocks` → PASS.

- [ ] **Step 5: Commit** — `git add lib/new-loom/draft-blocks.ts tests/draft-doc-blocks.test.ts && git commit -m "feat(studio): doc-block model + body<->blocks serialization"`

---

## Task 2: Persist blocks on the draft record (blocks canonical, body synced)

**Files:**
- Modify: `lib/new-loom/draft-storage.ts` (`NewLoomDraftRecord` :293, `createDraft` :2024, `updateDraft` :2053; import from `./draft-blocks`)
- Test: `tests/draft-doc-blocks-storage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createDraft, updateDraft, type DraftStorageAdapter } from '../lib/new-loom/draft-storage';
import { type NewLoomDraftDocBlock } from '../lib/new-loom/draft-blocks';

function mem(): DraftStorageAdapter {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}
const opts = { now: () => '2026-06-22T00:00:00.000Z', createId: () => 'd1' };

test('createDraft + updateDraft persist blocks and keep body synced from them', () => {
  const a = mem();
  const d = createDraft(a, {}, opts);
  const blocks: NewLoomDraftDocBlock[] = [
    { id: 'b1', kind: 'text', text: 'Hello.' },
    { id: 'b2', kind: 'code', text: 'x=1', lang: 'python' },
  ];
  const next = updateDraft(a, d.id, { blocks }, { now: opts.now });
  assert.deepEqual(next.blocks, blocks);
  assert.match(next.body, /Hello\./);
  assert.match(next.body, /```python\nx=1\n```/);  // body recomputed from blocks
});
```

- [ ] **Step 2: Run to verify it fails** — `npm run test:contracts 2>&1 | grep draft-doc-blocks-storage` → FAIL (blocks not on type / not persisted).

- [ ] **Step 3: Implement** — in `lib/new-loom/draft-storage.ts`:
  1. Add import near the top: `import { type NewLoomDraftDocBlock, blocksToBody } from './draft-blocks';` (place it AFTER the existing type declarations it does not depend on; `draft-blocks` imports `draftBlocksFromBody` from this file — that is fine, the cycle is type+function level and resolves at runtime because both are function declarations, but to be safe import `blocksToBody` lazily is NOT needed; a normal import works since `draftBlocksFromBody` is hoisted. If a circular-import runtime error appears, move `blocksToBody`/`bodyToBlocks` to accept the parser as a param — but default path: normal import.)
  2. Extend the record (`:293`): add `blocks?: NewLoomDraftDocBlock[];`
  3. `createDraft` input (`:2026`): add `blocks?: NewLoomDraftDocBlock[];`; in the draft literal add `blocks: input.blocks,` and if `input.blocks` set `body: input.body ?? blocksToBody(input.blocks)`.
  4. `updateDraft` patch type (`:2056`): change to `Partial<Pick<NewLoomDraftRecord, 'title' | 'body' | 'references' | 'blocks'>>`; in the `next` literal add:
     ```ts
     blocks: patch.blocks ?? existing.blocks,
     body: patch.blocks ? blocksToBody(patch.blocks) : (patch.body ?? existing.body),
     ```

- [ ] **Step 4: Run to verify pass** — `npm run test:contracts 2>&1 | grep draft-doc-blocks-storage` → PASS. Also run full `npm run test:contracts` — existing draft tests must stay green (body still present + synced).

- [ ] **Step 5: Commit** — `git add lib/new-loom/draft-storage.ts tests/draft-doc-blocks-storage.test.ts && git commit -m "feat(studio): persist blocks on the draft record, body synced"`

---

## Task 3: `DraftBlockEditor` component (the block surface)

**Files:**
- Create: `app/draft/DraftBlockEditor.tsx`
- Test: `tests/draft-block-editor-render.tsx`

- [ ] **Step 1: Write the failing test**

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

test('DraftBlockEditor renders text + code + cite blocks in order', () => {
  const { DraftBlockEditor } = require('../app/draft/DraftBlockEditor');
  const html = render(
    <DraftBlockEditor
      blocks={[
        { id: 'b1', kind: 'text', text: 'Hello world' },
        { id: 'b2', kind: 'code', text: 'print(1)', lang: 'python', source: 'strat.py' },
        { id: 'b3', kind: 'cite', href: '/s', label: 'Source A', excerpt: 'quote' },
      ]}
      onChange={() => {}}
    />,
  );
  assert.match(html, /Hello world/);
  assert.match(html, /print\(1\)/);
  assert.match(html, /Source A/);
  assert.match(html, /new-loom-draft__block/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npm run test:contracts 2>&1 | grep draft-block-editor` → FAIL.

- [ ] **Step 3: Implement** — `app/draft/DraftBlockEditor.tsx` (a controlled component; parent owns `blocks`):

```tsx
'use client';

import React from 'react';
import {
  type NewLoomDraftDocBlock,
  type DocBlockKind,
  newDocBlock,
} from '../../lib/new-loom/draft-blocks';

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `b-${Math.round(performance?.now?.() ?? 0)}-${Math.floor(Math.random() * 1e6)}`;
}

export function DraftBlockEditor({
  blocks,
  onChange,
}: {
  blocks: NewLoomDraftDocBlock[];
  onChange: (next: NewLoomDraftDocBlock[]) => void;
}) {
  const replace = (id: string, patch: Partial<NewLoomDraftDocBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as NewLoomDraftDocBlock) : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = blocks.slice();
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    onChange(copy);
  };
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const addAfter = (i: number, kind: DocBlockKind) => {
    const copy = blocks.slice();
    copy.splice(i + 1, 0, newDocBlock(kind, makeId));
    onChange(copy);
  };

  return (
    <div className="new-loom-draft__blocks" role="list" aria-label="Document blocks">
      {blocks.map((b, i) => (
        <article key={b.id} className={`new-loom-draft__block new-loom-draft__block--${b.kind}`} role="listitem">
          <div className="new-loom-draft__block-rail" aria-hidden="true">{b.kind}</div>
          <div className="new-loom-draft__block-body">
            {b.kind === 'text' && (
              <textarea
                className="new-loom-draft__block-text"
                aria-label="Text block"
                value={b.text}
                onChange={(e) => replace(b.id, { text: e.target.value })}
              />
            )}
            {b.kind === 'code' && (
              <>
                <div className="new-loom-draft__block-codemeta">
                  <input
                    className="new-loom-draft__block-lang"
                    aria-label="Code language"
                    placeholder="lang"
                    value={b.lang ?? ''}
                    onChange={(e) => replace(b.id, { lang: e.target.value })}
                  />
                  <input
                    className="new-loom-draft__block-source"
                    aria-label="Code source"
                    placeholder="source (repo / path)"
                    value={b.source ?? ''}
                    onChange={(e) => replace(b.id, { source: e.target.value })}
                  />
                </div>
                <textarea
                  className="new-loom-draft__block-code"
                  aria-label="Code block"
                  value={b.text}
                  spellCheck={false}
                  onChange={(e) => replace(b.id, { text: e.target.value })}
                />
              </>
            )}
            {b.kind === 'cite' && (
              <a className="new-loom-draft__block-cite" href={b.href || undefined}>
                <span className="new-loom-draft__block-cite-label">{b.label || 'Untitled source'}</span>
                {b.excerpt ? <span className="new-loom-draft__block-cite-excerpt">{b.excerpt}</span> : null}
              </a>
            )}
          </div>
          <div className="new-loom-draft__block-tools">
            <button type="button" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
            <button type="button" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
            <button type="button" aria-label="Delete block" onClick={() => remove(b.id)}>✕</button>
          </div>
          <div className="new-loom-draft__block-add">
            <button type="button" onClick={() => addAfter(i, 'text')}>+ Text</button>
            <button type="button" onClick={() => addAfter(i, 'code')}>+ Code</button>
          </div>
        </article>
      ))}
      {blocks.length === 0 && (
        <button type="button" className="new-loom-draft__block-add" onClick={() => onChange([newDocBlock('text', makeId)])}>
          + Start writing
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test:contracts 2>&1 | grep draft-block-editor` → PASS.
- [ ] **Step 5: Add styles** — append to `app/draft/draft-evidence-desk.module.css` under the existing `.surface :global(...)` pattern: `.new-loom-draft__blocks` (flex column, gap var(--space-3)), `.new-loom-draft__block` (grid: rail | body | tools), `.new-loom-draft__block-text`/`-code` (reuse the body serif/measure: text uses var(--serif) + `max-width: min(72ch,100%)`; code uses var(--mono)), `.new-loom-draft__block-cite` (the cyan cite chip), hover-revealed `-tools`/`-add`, `:focus-visible` rings, `@media (prefers-reduced-motion: reduce)`. Mirror tokens already used in this file. (No contract pins these names; keep them additive.)
- [ ] **Step 6: Commit** — `git add app/draft/DraftBlockEditor.tsx app/draft/draft-evidence-desk.module.css tests/draft-block-editor-render.tsx && git commit -m "feat(studio): DraftBlockEditor component + styles"`

---

## Task 4: Wire DraftClient to blocks (replace the textarea inside editor-shell)

**Files:**
- Modify: `app/draft/DraftClient.tsx` (state ~404-456; textarea region 1164-1192)
- Modify: `tests/draft-workspace-composition.test.ts` (only if an assertion references the removed textarea — it does NOT today, so likely no change; verify)

- [ ] **Step 1:** Add block state + derivation. Near the existing `body` state, add:
  ```ts
  const [blocks, setBlocks] = React.useState<NewLoomDraftDocBlock[]>([]);
  ```
  On draft load (where `setBody(draft.body)` happens), also seed blocks: `setBlocks(draft.blocks ?? bodyToBlocks(draft.body, draft.references ?? [], makeId));` (import `bodyToBlocks` + a local `makeId` like the editor's, or export `makeId` from `draft-blocks.ts` and reuse — prefer exporting `makeId` from `draft-blocks.ts` to keep one source).
- [ ] **Step 2:** Add a change handler that keeps body synced:
  ```ts
  function handleBlocksChange(next: NewLoomDraftDocBlock[]) {
    setBlocks(next);
    const nextBody = blocksToBody(next);
    setBody(nextBody);
    setSaveState('idle');
    scheduleSave(title, nextBody);
  }
  ```
  (`scheduleSave` should also persist blocks: update its `updateDraft(...)` call site to pass `{ title, body, blocks }`. Find the persist call inside `commitDraft`/`persistDraft` and add `blocks` to the patch.)
- [ ] **Step 3:** Replace the `<textarea className="new-loom-draft__body" …>` (lines 1164-1192) with:
  ```tsx
  <DraftBlockEditor blocks={blocks} onChange={handleBlocksChange} />
  ```
  Import `DraftBlockEditor` at the top. Keep the surrounding `new-loom-draft__editor-shell` + the `new-loom-draft__editor-toolbar` div (the @ Reference / Save draft buttons at 1145-1162) intact. Remove `bodyTextareaRef`-only logic that no longer applies (the `syncReferencePickerWithMention` from textarea events) — the reference picker is re-wired in Task 6; for now keep the `@ Reference` button working (it calls the existing manual-open path).
- [ ] **Step 4: Run** — `npm run test:contracts` (workspace-composition must stay green — it asserts editor-shell/toolbar/proof-strip, not the textarea) + `npm run typecheck`. If any OTHER test asserts `new-loom-draft__body`, update it to the block editor intentionally (grep first: `grep -rn "new-loom-draft__body" tests/`). Restore `tsconfig.json`/`next-env.d.ts` after typecheck (`git checkout --`).
- [ ] **Step 5: Preview-verify** — start the LOOM preview, seed a draft in `localStorage['loom.new.drafts.v1']`, open `/draft`: edit a text block, add a code block, reorder, confirm "Saved", reload → blocks persist. (Screenshot for the report.)
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(studio): /draft renders the block editor; body kept synced"`

---

## Task 5: Import path (paste / upload a file → block)

**Files:**
- Modify: `app/draft/DraftClient.tsx` (add an "Import" control in the `new-loom-draft__editor-toolbar`)
- Test: `tests/draft-import.test.ts` (pure helper)

- [ ] **Step 1: Write the failing test** — a pure helper `fileToDocBlock(name, text, makeId)` in `lib/new-loom/draft-blocks.ts`:
  ```ts
  test('fileToDocBlock makes a code block for code files (attributed), text for prose', () => {
    assert.deepEqual(fileToDocBlock('strat.py', 'print(1)', () => 'b1'),
      { id: 'b1', kind: 'code', text: 'print(1)', lang: 'python', source: 'strat.py' });
    assert.equal(fileToDocBlock('notes.md', '# hi', () => 'b1').kind, 'text');
  });
  ```
- [ ] **Step 2: Run → fail.**
- [ ] **Step 3: Implement** `fileToDocBlock` in `draft-blocks.ts`:
  ```ts
  const LANG_BY_EXT: Record<string, string> = {
    py: 'python', ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', go: 'go',
    rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', sql: 'sql', sh: 'bash', json: 'json', css: 'css', html: 'html',
  };
  const PROSE_EXT = new Set(['md', 'markdown', 'txt', '']);
  export function fileToDocBlock(name: string, text: string, createId: () => string): NewLoomDraftDocBlock {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (PROSE_EXT.has(ext)) return { id: createId(), kind: 'text', text };
    return { id: createId(), kind: 'code', text, lang: LANG_BY_EXT[ext], source: name };
  }
  ```
- [ ] **Step 4: Run → pass.**
- [ ] **Step 5:** In `DraftClient.tsx` add a hidden `<input type="file" accept=".py,.ts,.tsx,.js,.jsx,.go,.rs,.java,.c,.cpp,.sql,.sh,.json,.css,.html,.md,.markdown,.txt" />` opened by a new `new-loom-shell__action` button "Import" in the editor-toolbar; on change read the file (`await file.text()`), call `handleBlocksChange([...blocks, fileToDocBlock(file.name, text, makeId)])`, reset the input value. (Paste already works inside any block textarea.)
- [ ] **Step 6: Verify + commit** — `npm run test:contracts` + `typecheck`; preview: import a `.py` → an attributed code block appears. `git commit -m "feat(studio): import a file as an attributed block"`

---

## Task 6: Cite block via the existing reference picker

**Files:**
- Modify: `app/draft/DraftClient.tsx` (the reference-picker result handler)
- Test: covered by `tests/draft-block-editor-render.tsx` (cite render) + a wiring assertion

- [ ] **Step 1:** Find where the reference picker inserts a candidate (it calls `insertDraftReferenceCandidateIntoDraft` and updates `body`). Add a parallel "insert as citation" action: on choosing a reference, append a cite block:
  ```ts
  function insertCiteBlock(ref: NewLoomDraftReference) {
    handleBlocksChange([...blocks, { id: makeId(), kind: 'cite', href: ref.href, label: ref.label, excerpt: ref.excerpt }]);
    closeReferencePicker();
  }
  ```
  Wire the picker's primary result click to `insertCiteBlock` (keep inline `@`-mention into a focused text block as a secondary path if a text block is focused; otherwise default to a cite block).
- [ ] **Step 2:** Add a render assertion to `tests/draft-block-editor-render.tsx` (or a new `tests/draft-cite.test.ts`) that a cite block serializes to a quote+link via `blocksToBody` (already covered in Task 1 — verify it asserts the cite link form).
- [ ] **Step 3: Verify + commit** — `npm run test:contracts` + `typecheck`; preview: pick a source → a cite block appears + links to the source. `git commit -m "feat(studio): insert source citations as cite blocks"`

---

## Task 7: Full verify + contract reconciliation + rebuild

- [ ] **Step 1:** `grep -rn "new-loom-draft__body" tests/ app/` — update any remaining test/code that depended on the single textarea to the block editor (intentional). Keep `editor-shell`/`editor-toolbar`/`proof-strip`/grid/copy assertions intact.
- [ ] **Step 2:** `npm run test:contracts` → all green (baseline was 623; new tests add to it). Investigate any non-green before proceeding.
- [ ] **Step 3:** `npm run typecheck` → exit 0; then `git checkout -- tsconfig.json next-env.d.ts`.
- [ ] **Step 4: Preview** `/draft` end-to-end: seed draft → add text/code/cite → import a file → reorder → save → reload (persists) → confirm provenance/proof-strip + the @ Reference + Save still work. Screenshot.
- [ ] **Step 5:** Branch + commit + PR + squash-merge (the project's flow), then `npm run app:user && npm run app:smoke` to rebuild `Loom.app`; restore `tsconfig.json`/`next-env.d.ts` after.

---

## Out of scope (do NOT build — later phases per spec)
Deeper ingest (repo/notebook/QBook reference), `artifact` embed block (QBook iframe), live code execution, Digital-Me housing, drag-and-drop reorder, per-block AI.
