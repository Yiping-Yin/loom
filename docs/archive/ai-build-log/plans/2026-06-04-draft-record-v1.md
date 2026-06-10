# Draft Record v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a published AI Answer preview into a persistent local Draft record that Home, Sources, and Draft can all reference.

**Architecture:** Add a focused browser-storage module for Draft records. Draft writes a record when the answer preview is published; Home reads the latest record for the sidebar and inspector; the active Sources evidence story exposes linked Draft records.

**Tech Stack:** Next.js App Router, React client components, localStorage-backed browser storage, Node test runner with `tsx`.

---

### Task 1: Draft Record Storage

**Files:**
- Create: `lib/new-loom/draft-records.ts`
- Test: `tests/draft-records.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('Draft records save and load the latest published answer record', () => {
  const storage = createMemoryStorage();
  const record = buildDraftRecord({
    title: 'Concavity answer draft',
    answer: 'Concavity gives the optimisation answer a stable interpretation.',
    sourceLabels: ['Problem Set 02.pdf'],
    sourceHrefs: ['/knowledge/unsw/econ3202/ps02'],
    draftUrl: '/draft?draftType=ai-answer',
    status: 'previewed',
    now: () => '2026-06-04T00:00:00.000Z',
  });

  saveDraftRecord(record, { storage });

  assert.equal(loadLatestDraftRecord({ storage })?.title, 'Concavity answer draft');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-records.test.ts`

Expected: fail because `lib/new-loom/draft-records.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `DraftRecord`, `buildDraftRecord`, `saveDraftRecord`, `loadDraftRecords`, and `loadLatestDraftRecord`. Use localStorage key `loom.new.draft-records.v1`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/draft-records.test.ts`

Expected: pass.

### Task 2: Draft Publish Writes Record

**Files:**
- Modify: `app/draft/DraftClient.tsx`
- Test: `tests/draft-answer-preview.test.ts`

- [ ] **Step 1: Write the failing test**

Assert that Draft imports and calls `saveDraftRecord` when publishing the AI Answer preview.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-answer-preview.test.ts`

Expected: fail because Draft does not yet save records.

- [ ] **Step 3: Write minimal implementation**

After `saveDraftAnswerPreview(preview)`, build a Draft record from the same preview, current Draft title, source labels, source hrefs, and current URL.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/draft-answer-preview.test.ts`

Expected: pass.

### Task 3: Home and Sources Consume Records

**Files:**
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `components/verified-dossier/AnswerInspector.tsx`
- Modify: `components/verified-dossier/EvidenceWorkbench.tsx`
- Test: `tests/draft-answer-preview.test.ts`
- Test: `tests/source-to-draft-chain.test.ts`

- [ ] **Step 1: Write failing tests**

Assert Home loads `loadLatestDraftRecord`, sidebar copy is record-aware, Answer inspector accepts `draftRecord`, and Evidence Workbench contains `Draft records`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/draft-answer-preview.test.ts tests/source-to-draft-chain.test.ts`

Expected: fail because consumers are not wired yet.

- [ ] **Step 3: Write minimal implementation**

Load the latest record on Home, pass it to the inspector, replace `No recent Draft` when a record exists, and add a record-aware Draft row to the active evidence story.

- [ ] **Step 4: Run tests and browser check**

Run: `npx tsx --test tests/draft-records.test.ts tests/draft-answer-preview.test.ts tests/source-to-draft-chain.test.ts`

Expected: pass, then verify `/` and `/draft` on port 3000 with Playwright.
