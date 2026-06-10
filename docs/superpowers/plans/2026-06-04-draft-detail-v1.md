# Draft Detail v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each Draft Record into a shareable local artifact page with full answer text, source trail, status, and an editor return path.

**Architecture:** Keep Draft Records in browser localStorage. Add small helpers for detail hrefs and record lookup, then add a client-driven `/drafts/[recordId]` route that reads the selected record locally. Update Draft Library cards and record entrypoints to point at detail pages while preserving `Open Draft` for the editor.

**Tech Stack:** Next.js App Router dynamic route, React client components, localStorage-backed browser storage, Node test runner with `tsx`.

---

### Task 1: Draft Record Detail Helpers

**Files:**
- Modify: `lib/new-loom/draft-records.ts`
- Test: `tests/draft-records.test.ts`

- [ ] **Step 1: Write failing helper test**

```ts
assert.equal(records.draftRecordDetailHref!(latestRecord), `/drafts/${latestRecord.id}`);
assert.deepEqual(records.loadDraftRecordById!(latestRecord.id, { storage }), latestRecord);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-records.test.ts`

Expected: fail because `draftRecordDetailHref` and `loadDraftRecordById` do not exist.

- [ ] **Step 3: Implement helpers**

Add `draftRecordDetailHref(record)` and `loadDraftRecordById(recordId, input)` to `lib/new-loom/draft-records.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/draft-records.test.ts`

Expected: pass.

### Task 2: Draft Detail Route

**Files:**
- Create: `app/drafts/[recordId]/page.tsx`
- Create: `app/drafts/[recordId]/DraftDetailClient.tsx`
- Modify: `tests/draft-library.test.ts`

- [ ] **Step 1: Write failing route test**

Assert the dynamic route renders `DraftDetailClient`, and the client reads `loadDraftRecordById`, renders `Published Artifact`, `Source trail`, `Open Draft`, and `Back to Draft Library`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-library.test.ts`

Expected: fail because detail route files do not exist.

- [ ] **Step 3: Implement detail route**

Add a server route that decodes `recordId` and passes it to a client component. The client loads the record, shows empty/not-found state when missing, and renders full answer plus source links when found.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/draft-library.test.ts`

Expected: pass.

### Task 3: Detail Entrypoints

**Files:**
- Modify: `app/drafts/DraftsClient.tsx`
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `components/verified-dossier/AnswerInspector.tsx`
- Modify: `components/verified-dossier/EvidenceWorkbench.tsx`
- Modify: `tests/draft-library.test.ts`
- Modify: `tests/source-to-draft-chain.test.ts`

- [ ] **Step 1: Write failing link tests**

Assert library cards and record entrypoints call `draftRecordDetailHref(record)`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/draft-library.test.ts tests/source-to-draft-chain.test.ts`

Expected: fail until links route through detail helpers.

- [ ] **Step 3: Implement entrypoint updates**

Use `draftRecordDetailHref(record)` for record title links in `/drafts`, Home recent Draft, Answer inspector, and Sources story. Keep `Open Draft` linked to `record.draftUrl`.

- [ ] **Step 4: Run tests and browser verification**

Run: `npx tsx --test tests/draft-records.test.ts tests/draft-library.test.ts tests/draft-answer-preview.test.ts tests/source-to-draft-chain.test.ts`

Expected: pass, then verify `/drafts/[recordId]` on port `3000` with seeded localStorage.
