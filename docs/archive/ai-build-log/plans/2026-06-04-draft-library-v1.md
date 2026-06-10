# Draft Library v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/drafts` page where local Draft Records can be browsed as a real output library.

**Architecture:** Reuse the existing `draft-records` browser-storage module. Add a client page that loads all records, renders an empty state when none exist, and exposes each record's source trail plus an `Open Draft` action. Update Home, Answer inspector, and Sources story record links to route through `/drafts`.

**Tech Stack:** Next.js App Router, React client components, localStorage-backed browser storage, Node test runner with `tsx`.

---

### Task 1: Draft Library Route Contract

**Files:**
- Create: `app/drafts/page.tsx`
- Create: `app/drafts/DraftsClient.tsx`
- Test: `tests/draft-library.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('Draft Library route loads persistent Draft Records', () => {
  const page = read('app/drafts/page.tsx');
  const client = read('app/drafts/DraftsClient.tsx');

  assert.match(page, /DraftsClient/);
  assert.match(client, /loadDraftRecords/);
  assert.match(client, /Draft Library/);
  assert.match(client, /No Draft records yet/);
  assert.match(client, /Open Draft/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-library.test.ts`

Expected: fail because the `/drafts` files do not exist.

- [ ] **Step 3: Write minimal implementation**

Create `DraftsClient` as a client component, load records from `loadDraftRecords()`, and render a library page with empty and populated states.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/draft-library.test.ts`

Expected: pass.

### Task 2: Unified Draft Library Entrypoints

**Files:**
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `components/verified-dossier/AnswerInspector.tsx`
- Modify: `components/verified-dossier/EvidenceWorkbench.tsx`
- Modify: `lib/new-loom/verified-dossier-home.ts`
- Test: `tests/draft-library.test.ts`
- Test: `tests/draft-answer-preview.test.ts`
- Test: `tests/source-to-draft-chain.test.ts`

- [ ] **Step 1: Write failing tests**

Assert top navigation includes `Drafts`, recent Draft record links route to `/drafts`, Answer inspector Draft record links route to `/drafts`, and active source story record links route to `/drafts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/draft-library.test.ts tests/draft-answer-preview.test.ts tests/source-to-draft-chain.test.ts`

Expected: fail before entrypoints are updated.

- [ ] **Step 3: Write minimal implementation**

Add `Drafts` to the top nav and change Home/inspector/source story record links to point to `/drafts`.

- [ ] **Step 4: Run tests and browser check**

Run: `npx tsx --test tests/draft-library.test.ts tests/draft-records.test.ts tests/draft-answer-preview.test.ts tests/source-to-draft-chain.test.ts`

Expected: pass, then verify `/drafts` on port `3000` with a seeded localStorage record.
