# Merge Draft into Digital Me — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the Draft editor into `/digital-me` as an `?edit=<id>` mode (mutually exclusive with the identity view), turn `/draft` into a redirect stub, fix by-id draft loading, and re-point every `/draft` entry.

**Architecture:** `DigitalMeGate` reads the `edit` search param (`useSearchParams`, wrapped in `Suspense`); when present it renders `DraftClient` full-screen (no cosmic field / nav), else the existing identity gate. `/draft/page.tsx` becomes a tiny client redirect to `/digital-me?edit=…`. Two pure helpers (`draftStubTarget`, `selectDraftById`) carry the routing + selection logic and are unit-tested.

**Tech Stack:** Next 16 / React 19 / TypeScript (static export). Tests: `node:test` + `tsx` (`npm run test:contracts`); render tests use `renderToStaticMarkup` + a CSS-module proxy.

**Spec:** `docs/superpowers/specs/2026-06-23-merge-draft-into-digital-me-design.md`

**Reference shapes (current code — do not re-derive):**
- `app/digital-me/DigitalMeGate.tsx` — `'use client'`; post-mount reads profile; `!mounted` → `<div className="loom-cosmic-field" aria-hidden />`; profile → `<BeginnerDigitalMe profile={profile} />`; else `<IdentityEmptyState section="Digital Me" activeHref="/digital-me" titleId="digital-me-title" exampleHref="/example/digital-me" />`.
- `app/digital-me/page.tsx` — server; `export const metadata`; returns `<DigitalMeGate />`.
- `app/draft/page.tsx` — server; reads `?draftType`; returns `<DraftClient initialDraftTypeId={draftType} />`.
- `app/draft/DraftClient.tsx:418-422` — `type DraftClientProps = { initialDraftTypeId?: string }`; `export function DraftClient({ initialDraftTypeId }: DraftClientProps = {})`.
- `app/draft/DraftClient.tsx:553` — `const existing = listDrafts(fallbackStorage)[0];` (the by-id bug; inside the load `useEffect` at 523-576). `referencesFromLocation()` (window.location.search) stays.
- `lib/new-loom/draft-storage.ts` — `NewLoomDraftRecord = { id; title; body; references; blocks?; createdAt; updatedAt }`; `listDrafts(adapter)`.
- Entry points to migrate (file → change), from exploration: `components/verified-dossier/LoomGlobalNav.tsx` (`LOOM_WORKSPACE_NAV` `{label:'Draft', href:'/draft'}`); `app/digital-me/BeginnerDocuments.tsx` (3 hrefs); `app/SystemClient.tsx`, `app/connections/ConnectionsClient.tsx`, `app/year/YearClient.tsx`, `app/hour/HourClient.tsx`, `app/help/page.tsx`, `app/drafts/DraftsClient.tsx`; alias `redirect('/draft')` routes: `app/atelier/page.tsx`, `app/coworks/page.tsx`, `app/palimpsest/page.tsx`, `app/diagrams/page.tsx`, `app/letter/page.tsx`, `app/workbench/page.tsx`, `app/soan/page.tsx` (`?view=board`); `lib/new-loom/draft-records.ts` default `draftUrl`.
- Tests to update: `tests/beginner-documents-render.tsx`, `tests/loom-personal-positioning.test.tsx`, `tests/phase3-cta-alignment.test.ts`, `tests/canonical-hotpaths.test.ts`, `tests/draft-records.test.ts`, `tests/draft-workspace-composition.test.ts`.

---

## Task 1: Pure routing helpers (`draftStubTarget` + `selectDraftById`)

**Files:**
- Create: `lib/new-loom/draft-routing.ts`
- Test: `tests/draft-routing.test.ts`
- Modify: `package.json` (register the test)

- [ ] **Step 1: Write the failing test** — `tests/draft-routing.test.ts`

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { draftStubTarget, selectDraftById } from '../lib/new-loom/draft-routing';

function parse(url: string) {
  const [path, query = ''] = url.split('?');
  return { path, params: new URLSearchParams(query) };
}

test('draftStubTarget maps ?d=<id> to /digital-me?edit=<id>', () => {
  const { path, params } = parse(draftStubTarget('?d=doc1'));
  assert.equal(path, '/digital-me');
  assert.equal(params.get('edit'), 'doc1');
  assert.equal(params.get('d'), null);
});

test('draftStubTarget defaults to edit=new when no d, preserving other params', () => {
  const { path, params } = parse(draftStubTarget('?draftType=ai-answer&ref=lecture'));
  assert.equal(path, '/digital-me');
  assert.equal(params.get('edit'), 'new');
  assert.equal(params.get('draftType'), 'ai-answer');
  assert.equal(params.get('ref'), 'lecture');
});

test('draftStubTarget handles empty search', () => {
  assert.equal(draftStubTarget(''), '/digital-me?edit=new');
});

test('selectDraftById finds by id, returns null for new/missing', () => {
  const recs = [
    { id: 'a', title: 'A', body: '', references: [], createdAt: '', updatedAt: '2' },
    { id: 'b', title: 'B', body: '', references: [], createdAt: '', updatedAt: '1' },
  ] as any;
  assert.equal(selectDraftById(recs, 'b')?.id, 'b');
  assert.equal(selectDraftById(recs, 'new'), null);
  assert.equal(selectDraftById(recs, 'missing'), null);
  assert.equal(selectDraftById([], 'a'), null);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/draft-routing.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `lib/new-loom/draft-routing.ts`

```ts
import { type NewLoomDraftRecord } from './draft-storage';

/**
 * Map a legacy /draft search string to the equivalent /digital-me editor URL.
 * `?d=<id>` → `edit=<id>`; absent → `edit=new`. All other params (draftType,
 * draftRecord, view, ref/label/quote/…) are preserved so deep links keep working.
 */
export function draftStubTarget(search: string): string {
  const params = new URLSearchParams(search);
  const d = params.get('d');
  params.delete('d');
  params.set('edit', d && d.trim() ? d.trim() : 'new');
  return `/digital-me?${params.toString()}`;
}

/**
 * Select the draft to edit. `new` (or absent) → null (a fresh document);
 * an id → that record, or null when it no longer exists (→ a fresh document).
 */
export function selectDraftById(
  records: NewLoomDraftRecord[],
  editId: string | undefined,
): NewLoomDraftRecord | null {
  if (!editId || editId === 'new') return null;
  return records.find((r) => r.id === editId) ?? null;
}
```

- [ ] **Step 4: Run to verify pass** — `npx tsx --test tests/draft-routing.test.ts` → PASS.
- [ ] **Step 5: Register the test** — append ` tests/draft-routing.test.ts` to the `test:contracts` list in `package.json`.
- [ ] **Step 6: Commit** — `git add lib/new-loom/draft-routing.ts tests/draft-routing.test.ts package.json && git commit -m "feat(merge): draft routing helpers (stub target + by-id select)"`

---

## Task 2: `DraftClient` — `editId` prop + by-id load

**Files:**
- Modify: `app/draft/DraftClient.tsx` (props at 418-422; load effect at 553)
- Test: covered by Task 1's `selectDraftById`; add a wiring assertion to `tests/draft-workspace-composition.test.ts`

- [ ] **Step 1: Add the assertion** — in `tests/draft-workspace-composition.test.ts`, near the back-link assertions:

```ts
// DraftClient accepts an editId so /digital-me can drive which doc opens.
assert.match(draftClient, /editId\??:\s*string/);
assert.match(draftClient, /selectDraftById\(/);
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/draft-workspace-composition.test.ts` → FAIL.

- [ ] **Step 3: Add the prop** — `app/draft/DraftClient.tsx:418-422`:

```tsx
type DraftClientProps = {
  initialDraftTypeId?: string;
  editId?: string;
};

export function DraftClient({ initialDraftTypeId, editId }: DraftClientProps = {}) {
```

- [ ] **Step 4: Import the helper + use by-id selection** — add the import (near the other `draft-storage`/`draft-blocks` imports):

```tsx
import { selectDraftById } from '../../lib/new-loom/draft-routing';
```

Replace line 553 (`const existing = listDrafts(fallbackStorage)[0];`) with:

```tsx
const existing = selectDraftById(listDrafts(fallbackStorage), editId);
```

(The surrounding create-vs-update logic at 554-560 already handles `existing == null` by creating a fresh draft — no other change needed. The native path above stays as-is.)

- [ ] **Step 5: Run to verify pass** — `npx tsx --test tests/draft-workspace-composition.test.ts` → PASS. `npm run typecheck` → exit 0; `git checkout -- tsconfig.json next-env.d.ts`.
- [ ] **Step 6: Commit** — `git add app/draft/DraftClient.tsx tests/draft-workspace-composition.test.ts && git commit -m "feat(merge): DraftClient editId prop + by-id load"`

---

## Task 3: `DigitalMeGate` edit mode + `Suspense`

**Files:**
- Modify: `app/digital-me/DigitalMeGate.tsx`, `app/digital-me/page.tsx`
- Test: `tests/digital-me-edit-mode.test.tsx` (new)

- [ ] **Step 1: Write the failing test** — `tests/digital-me-edit-mode.test.tsx`

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const gate = fs.readFileSync(path.join(repoRoot, 'app/digital-me/DigitalMeGate.tsx'), 'utf8');
const page = fs.readFileSync(path.join(repoRoot, 'app/digital-me/page.tsx'), 'utf8');

test('DigitalMeGate renders the editor in edit mode, identity otherwise', () => {
  assert.match(gate, /useSearchParams/);
  assert.match(gate, /\.has\(['"]edit['"]\)/);
  assert.match(gate, /<DraftClient\s+editId=/);
  // edit mode is mutually exclusive — it returns before the identity render path.
  assert.match(gate, /import \{ DraftClient \} from '\.\.\/draft\/DraftClient'/);
});

test('digital-me page wraps the gate in Suspense (useSearchParams requirement)', () => {
  assert.match(page, /Suspense/);
  assert.match(page, /loom-cosmic-field/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/digital-me-edit-mode.test.tsx` → FAIL.

- [ ] **Step 3: Implement the gate** — `app/digital-me/DigitalMeGate.tsx`: add imports + an edit-mode branch at the top of the render (before the mounted/profile logic):

```tsx
import { useSearchParams } from 'next/navigation';
import { DraftClient } from '../draft/DraftClient';
```

Inside `DigitalMeGate()`, after the existing hooks:

```tsx
const searchParams = useSearchParams();
// Edit mode: /digital-me?edit=<id|new> renders the Studio editor full-screen
// (no cosmic field, no nav) — mutually exclusive with the identity view.
if (searchParams.has('edit')) {
  return (
    <DraftClient
      editId={searchParams.get('edit') || 'new'}
      initialDraftTypeId={searchParams.get('draftType') ?? undefined}
    />
  );
}
```

(Leave the existing `!mounted` skeleton + profile/empty-state logic untouched below this branch.)

- [ ] **Step 4: Wrap the page in Suspense** — `app/digital-me/page.tsx`:

```tsx
import React, { Suspense } from 'react';
import { DigitalMeGate } from './DigitalMeGate';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  return (
    <Suspense fallback={<div className="loom-cosmic-field" aria-hidden />}>
      <DigitalMeGate />
    </Suspense>
  );
}
```

- [ ] **Step 5: Run to verify pass** — `npx tsx --test tests/digital-me-edit-mode.test.tsx` → PASS; register it in `package.json` test:contracts; `npm run typecheck` → 0; `git checkout -- tsconfig.json next-env.d.ts`.
- [ ] **Step 6: Commit** — `git add app/digital-me/DigitalMeGate.tsx app/digital-me/page.tsx tests/digital-me-edit-mode.test.tsx package.json && git commit -m "feat(merge): /digital-me ?edit mode renders the editor"`

---

## Task 4: `/draft` redirect stub

**Files:**
- Modify: `app/draft/page.tsx` (replace with a client redirect)
- Test: covered by `draftStubTarget` (Task 1); add a stub-shape assertion in `tests/draft-routing.test.ts`

- [ ] **Step 1: Add the assertion** — append to `tests/draft-routing.test.ts`:

```ts
import nodeFs from 'node:fs';
import nodePath from 'node:path';
test('/draft page.tsx is a client redirect stub using draftStubTarget', () => {
  const stub = nodeFs.readFileSync(nodePath.resolve(__dirname, '../app/draft/page.tsx'), 'utf8');
  assert.match(stub, /'use client'/);
  assert.match(stub, /draftStubTarget/);
  assert.doesNotMatch(stub, /DraftClient/);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/draft-routing.test.ts` → FAIL.

- [ ] **Step 3: Implement the stub** — replace `app/draft/page.tsx` entirely:

```tsx
'use client';

import { useEffect } from 'react';
import { draftStubTarget } from '../../lib/new-loom/draft-routing';

// /draft is no longer a surface — the Studio editor lives inside /digital-me.
// This stub forwards legacy links (bookmarks, the native app's remembered path,
// alias routes) to /digital-me?edit=… so nothing breaks.
export default function DraftRedirect() {
  useEffect(() => {
    window.location.replace(draftStubTarget(window.location.search));
  }, []);
  return <div className="loom-cosmic-field" aria-hidden />;
}
```

- [ ] **Step 4: Run to verify pass** — `npx tsx --test tests/draft-routing.test.ts` → PASS. `npm run typecheck` → 0; restore tsconfig/next-env.
- [ ] **Step 5: Commit** — `git add app/draft/page.tsx tests/draft-routing.test.ts && git commit -m "feat(merge): /draft becomes a redirect stub to /digital-me?edit"`

---

## Task 5: Migrate all `/draft` entry points

**Files (each a small edit):** see list below.
**Tests:** update `tests/beginner-documents-render.tsx`, `tests/loom-personal-positioning.test.tsx`, `tests/phase3-cta-alignment.test.ts`, `tests/canonical-hotpaths.test.ts`, `tests/draft-records.test.ts`.

- [ ] **Step 1: Update the tests first** (TDD — they encode the new targets):
  - `tests/beginner-documents-render.tsx`: change `href="/draft?d=d1"` → `href="/digital-me?edit=d1"`; the New/empty `href="/draft"` → `href="/digital-me?edit=new"`.
  - `tests/loom-personal-positioning.test.tsx`: the workspace-nav "Draft" expectation → `href="/digital-me?edit=new"` (or drop the Draft-nav assertion if the nav entry is removed — keep it, repointed).
  - `tests/phase3-cta-alignment.test.ts` + `tests/canonical-hotpaths.test.ts`: `redirect('/draft?view=board')` → `redirect('/digital-me?edit=new&view=board')`.
  - `tests/draft-records.test.ts`: expected default `draftUrl` `/draft?draftType=ai-answer&ref=lecture` → `/digital-me?edit=new&draftType=ai-answer&ref=lecture` (match the new `buildDraftRecord` default).

- [ ] **Step 2: Run to verify they fail** — `npm run test:contracts 2>&1 | grep -iE "fail|✖" | head`.

- [ ] **Step 3: Implement the migrations** (exact changes):
  - `components/verified-dossier/LoomGlobalNav.tsx` — `LOOM_WORKSPACE_NAV` `{ label: 'Draft', href: '/draft' }` → `href: '/digital-me?edit=new'`.
  - `app/digital-me/BeginnerDocuments.tsx` — line ~33 `href="/draft"` → `href="/digital-me?edit=new"`; line ~40 `href={`/draft?d=${doc.id}`}` → `href={`/digital-me?edit=${doc.id}`}`; line ~54 `href="/draft"` → `href="/digital-me?edit=new"`.
  - `app/SystemClient.tsx` (`href: '/draft'`), `app/connections/ConnectionsClient.tsx`, `app/year/YearClient.tsx`, `app/hour/HourClient.tsx`, `app/help/page.tsx` — each `'/draft'` → `'/digital-me?edit=new'`.
  - `app/drafts/DraftsClient.tsx` — `'/draft?draftType=ai-answer'` → `'/digital-me?edit=new&draftType=ai-answer'`.
  - `app/atelier/page.tsx`, `app/coworks/page.tsx`, `app/palimpsest/page.tsx`, `app/diagrams/page.tsx`, `app/letter/page.tsx`, `app/workbench/page.tsx` — `redirect('/draft')` → `redirect('/digital-me?edit=new')`.
  - `app/soan/page.tsx` — `redirect('/draft?view=board')` → `redirect('/digital-me?edit=new&view=board')`.
  - `lib/new-loom/draft-records.ts` — the default new-draft `draftUrl` that resolves to `/draft?...` → `/digital-me?edit=new&...` (keep the published-record `draftRecordDetailHref` `?draftRecord=` path unchanged).

- [ ] **Step 4: Run to verify pass** — `npm run test:contracts` green; `grep -rn '"/draft"\|=/draft\|(/draft' app/ components/ lib/ | grep -v draft-routing` → only the stub's own self-reference remains (audit). `npm run typecheck` → 0; restore tsconfig/next-env.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(merge): re-point all /draft entry points to /digital-me?edit"`

---

## Task 6: Full verify + preview + land

- [ ] **Step 1:** `npm run test:contracts` → all green (646 baseline + new). `npm run typecheck` → 0; restore tsconfig/next-env.
- [ ] **Step 2: Preview** — start preview; seed a beginner profile (`loom:beginner-profile`) + drafts (`loom.new.drafts.v1`). Verify: `/digital-me` = identity (Studio list); a Studio card → URL becomes `/digital-me?edit=<id>` and the editor loads THAT doc (by-id, not newest — seed ≥2 drafts to prove it); "← Digital Me" returns to identity; `/digital-me?edit=new` = fresh editor; visiting `/draft?d=<id>` redirects to `/digital-me?edit=<id>`. Screenshot identity + editor.
- [ ] **Step 3: Land** — branch `loom-merge-draft-into-digital-me` (off main), the commits, push, PR, squash-merge, sync main, `npm run app:user && npm run app:smoke` (restore tsconfig/next-env after). Update memory.

---

## Out of scope (do NOT build — per spec)
Documents → evidence/Ask flow; de-branding the editor identity rail; hard delete of `/draft` / native Swift changes; `/drafts` library overhaul; in-editor multi-draft switcher.
