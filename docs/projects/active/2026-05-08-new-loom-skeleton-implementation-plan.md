# New Loom Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Current vocabulary note (2026-05-15):** This is a historical Phase 1
> implementation plan. Do not implement `Collect` or `Organize` as first-level
> product destinations from this file. The current first-level product model is
> `Sources` and `Draft`; `/collect` remains compatibility into Sources.

**Goal:** Build Phase 1 of the new Loom inside the existing repo: a Sources / Draft
product skeleton with legacy surfaces isolated from the default user path.

**Architecture:** Keep existing capture, source, and reader assets, but route them
through a two-workspace shell. Sources owns adding files, web capture, review,
reader notes, provenance, and source state. Draft owns durable writing and
source references. Web and native surfaces share literal product vocabulary;
legacy names remain buildable but no longer appear as primary navigation.

**Tech Stack:** Next.js app router, React 18, TypeScript node tests, SwiftUI macOS app, existing Loom file/native bridge infrastructure, existing app build/smoke scripts.

**Current execution status (2026-05-15 AEST):** The old 2026-05-09
Collect / Organize / Draft sidebar evidence is historical and superseded.
Current acceptance is Sources / Draft: `/sources` owns intake/review/state,
`/draft` owns writing and references, and `/collect` is compatibility into
Sources. The dedicated completion audit still keeps the broader new Loom goal
open because two approval-bound gates remain: real user-file installed-app
importer acceptance and live provider-output Compile/Draft acceptance.

---

## File Structure

- Maintain `tests/new-loom-skeleton-contract.test.ts`: static contract tests for
  the Sources / Draft shell and legacy isolation.
- Maintain `lib/new-loom/product-shell.ts`: shared web vocabulary for Sources /
  Draft and route classification.
- Modify `app/HomeClient.tsx`: keep the default entry aligned with literal
  Sources / Draft workspaces.
- Modify `app/sources/page.tsx` and `app/knowledge/KnowledgeHomeClient.tsx`
  only if copy or links still expose legacy names as primary navigation.
- Modify `macos-app/Loom/Sources/LoomMinimalRootView.swift`: keep native root
  selection on Sources / Draft while retaining existing file/capture/source
  views under Sources.
- Create `macos-app/Loom/Sources/LoomDraftStore.swift`: durable draft MVP storage under Loom-managed app support.
- Create or modify `macos-app/Loom/Tests/LoomDraftStoreTests.swift`: Swift tests for create/save/reopen draft records.
- Modify `app/loom-render/capture/page.tsx`: fix the segment diagram `inline` class collision and add honest legacy fallback where deterministic reconstruction is unavailable.
- Modify `tests/capture-interactive-artifacts.test.ts`: add regression coverage for legacy flattened segment text and display mode.
- Modify `package.json` only if the new contract test is not included in `test:contracts`.

> **Superseded task archive:** The detailed task snippets below were written
> for the old 2026-05-08 Collect / Organize / Draft model. Do not execute them
> verbatim. Translate every current implementation or test change to Sources /
> Draft before using the historical steps as reference material.

## Task 1: Contract Tests For New Shell

**Files:**
- Create: `tests/new-loom-skeleton-contract.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing contract test**

Create `tests/new-loom-skeleton-contract.test.ts` with this content:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('new Loom web home exposes only the three primary capabilities', () => {
  const home = read('app/HomeClient.tsx');

  for (const label of ['Collect', 'Organize', 'Draft']) {
    assert.match(home, new RegExp(`>${label}<|[\"']${label}[\"']`));
  }

  for (const legacy of ['Atelier', 'Weaves', 'Patterns', 'Pursuits', 'Sōan', 'Workbench', 'Constellation', 'Atlas']) {
    assert.doesNotMatch(home, new RegExp(`>${legacy}<|[\"']${legacy}[\"']`));
  }
});

test('new Loom native root exposes Collect Organize Draft as first-level destinations', () => {
  const source = read('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(source, /case collect/);
  assert.match(source, /case organize/);
  assert.match(source, /case draft/);

  for (const label of ['Collect', 'Organize', 'Draft']) {
    assert.match(source, new RegExp(`title:\\s*"${label}"`));
  }

  assert.doesNotMatch(source, /sectionEyebrow\("Workspaces"/);
  assert.doesNotMatch(source, /title:\s*"Sources"[\s\S]{0,220}rowID:\s*"__pages"/);
  assert.doesNotMatch(source, /title:\s*"Captures"[\s\S]{0,220}rowID:\s*"__captures"/);
  assert.doesNotMatch(source, /title:\s*"Web Capture"[\s\S]{0,220}rowID:\s*"__webcapture"/);
});

test('legacy top-level routes remain files but are not primary home links', () => {
  const home = read('app/HomeClient.tsx');
  const legacyRoutes = [
    'app/atlas/page.tsx',
    'app/weaves/page.tsx',
    'app/patterns/page.tsx',
    'app/pursuits/page.tsx',
    'app/workbench/page.tsx',
    'app/atelier/page.tsx',
    'app/collection/page.tsx',
    'app/constellation/page.tsx',
    'app/soan/page.tsx',
  ];

  for (const route of legacyRoutes) {
    assert.ok(fs.existsSync(path.join(repoRoot, route)), `${route} should remain available for legacy/internal access`);
  }

  for (const href of ['/atlas', '/weaves', '/patterns', '/pursuits', '/workbench', '/atelier', '/collection', '/constellation', '/soan']) {
    assert.doesNotMatch(home, new RegExp(`href=["']${href}["']|window\\.location\\.href\\s*=\\s*["']${href}["']`));
  }
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
tsx --test tests/new-loom-skeleton-contract.test.ts
```

Expected: FAIL because `HomeClient.tsx` and `LoomMinimalRootView.swift` still expose the old first-level product structure.

- [ ] **Step 3: Add the contract test to `test:contracts`**

In `package.json`, insert `tests/new-loom-skeleton-contract.test.ts` into the `test:contracts` command after `tests/night-chrome-theme.test.ts`.

- [ ] **Step 4: Run the full contract command and verify this new test is included**

Run:

```bash
npm run test:contracts
```

Expected before implementation: FAIL with the same new shell assertions, proving the gate covers the work.

## Task 2: Shared Web Product Shell Vocabulary

**Files:**
- Create: `lib/new-loom/product-shell.ts`
- Modify: `app/HomeClient.tsx`

- [ ] **Step 1: Create product shell constants**

Create `lib/new-loom/product-shell.ts`:

```ts
export type NewLoomCapabilityId = 'collect' | 'organize' | 'draft';

export type NewLoomCapability = {
  id: NewLoomCapabilityId;
  label: 'Collect' | 'Organize' | 'Draft';
  chineseLabel: '信息收集' | '信息整理' | '思维草稿';
  href: string;
  description: string;
  primaryAction: string;
};

export const NEW_LOOM_CAPABILITIES: NewLoomCapability[] = [
  {
    id: 'collect',
    label: 'Collect',
    chineseLabel: '信息收集',
    href: '#collect',
    description: 'Capture web pages, files, snippets, and images with provenance.',
    primaryAction: 'Add material',
  },
  {
    id: 'organize',
    label: 'Organize',
    chineseLabel: '信息整理',
    href: '/sources',
    description: 'Find collected material, see where it landed, and open the reader or source view.',
    primaryAction: 'Open source index',
  },
  {
    id: 'draft',
    label: 'Draft',
    chineseLabel: '思维草稿',
    href: '/draft',
    description: 'Write from collected material with references kept close to the page.',
    primaryAction: 'Start draft',
  },
];

export const NEW_LOOM_LEGACY_ROUTES = [
  '/atlas',
  '/weaves',
  '/patterns',
  '/pursuits',
  '/workbench',
  '/atelier',
  '/collection',
  '/constellation',
  '/soan',
  '/panel',
  '/salon',
  '/palimpsest',
  '/branching',
] as const;
```

- [ ] **Step 2: Replace `HomeClient.tsx` first screen**

Replace the current HomeClient render path with a simple operational shell that imports `NEW_LOOM_CAPABILITIES`. Keep native bridge navigation support. Use literal labels and link Organize to `/sources`, Draft to `/draft`, and Collect to a bridge action that opens capture when native is available.

- [ ] **Step 3: Run the web shell contract**

Run:

```bash
tsx --test tests/new-loom-skeleton-contract.test.ts
```

Expected: web home assertions pass; native assertions still fail until Task 4.

## Task 3: Web Draft MVP Route

**Files:**
- Create: `app/draft/page.tsx`
- Create: `app/draft/DraftClient.tsx`
- Create: `lib/new-loom/draft-storage.ts`
- Create: `tests/new-loom-draft-storage.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write draft storage tests**

Create `tests/new-loom-draft-storage.test.ts` with tests for `createDraft`, `updateDraft`, and `listDrafts` using an injected memory storage adapter. Expected draft fields: `id`, `title`, `body`, `references`, `createdAt`, `updatedAt`.

- [ ] **Step 2: Implement browser fallback storage**

Create `lib/new-loom/draft-storage.ts` with an adapter interface and a localStorage-backed default. The default key is `loom.new.drafts.v1`. This is a web preview fallback only; native durable storage is Task 5.

- [ ] **Step 3: Add `/draft` route**

Create `app/draft/page.tsx` that renders `DraftClient`. Create `DraftClient.tsx` with title input, body textarea, save state, and a references list seeded from query params `?ref=`.

- [ ] **Step 4: Add test command coverage**

Add `tests/new-loom-draft-storage.test.ts` to `test:contracts`.

- [ ] **Step 5: Verify web draft MVP**

Run:

```bash
tsx --test tests/new-loom-draft-storage.test.ts
npm run typecheck
```

Expected: PASS. If typecheck fails on unrelated existing files, record exact failures before changing scope.

## Task 4: Native Shell Three-Destination Refactor

**Files:**
- Modify: `macos-app/Loom/Sources/LoomMinimalRootView.swift`
- Modify: `macos-app/Loom/Tests/CapturePlacementTests.swift` only if existing capture navigation assertions need updated labels.

- [ ] **Step 1: Extend `DetailSurface`**

Replace the top-level `DetailSurface` cases with first-level capability cases and nested existing surfaces:

```swift
enum DetailSurface: Equatable {
    case collect
    case organize
    case draft
    case folderHome(URL)
    case sourceFile(URL)
    case captureReader
    case webCaptureSetup
}
```

- [ ] **Step 2: Make `.organize` the default selection**

Set:

```swift
@State private var selection: DetailSurface = .organize
```

- [ ] **Step 3: Replace the sidebar first-level rows**

Change the Workspaces rows to:

```swift
sectionEyebrow("Loom", topPadding: DSSpace.xs.value)
collectRow
organizeRow
draftRow
```

Keep folders and creation tools below Organize-related content, or move them into the Organize detail if the sidebar becomes crowded.

- [ ] **Step 4: Map detail views**

Use existing views:

- `.collect` shows `WebCaptureSetupView()` plus visible actions for quick capture and local folder/page import.
- `.organize` shows `LoomLibraryView()`.
- `.draft` shows a native Draft MVP view backed by Task 5 storage.
- `.captureReader` keeps `CapturesView(...)`.
- `.folderHome` and `.sourceFile` remain unchanged.

- [ ] **Step 5: Preserve capture save behavior**

When a web capture auto-saves, navigate to `.captureReader` or `.organize` with a pending open URL. Do not navigate back to a first-level `Captures` row because that row no longer exists.

- [ ] **Step 6: Run the new shell contract**

Run:

```bash
tsx --test tests/new-loom-skeleton-contract.test.ts
```

Expected: PASS for native and web shell assertions after Task 2 and Task 4.

## Task 5: Native Draft Persistence

**Files:**
- Create: `macos-app/Loom/Sources/LoomDraftStore.swift`
- Create: `macos-app/Loom/Tests/LoomDraftStoreTests.swift`
- Modify: `macos-app/Loom/project.yml`
- Modify: `macos-app/Loom/Loom.xcodeproj/project.pbxproj` through the existing project generation/build path if required by repo convention.

- [ ] **Step 1: Add Swift draft model**

Create `LoomDraftRecord` with `id`, `title`, `body`, `references`, `createdAt`, `updatedAt`.

- [ ] **Step 2: Store drafts under Loom-managed app support**

Implement `LoomDraftStore` that reads and writes JSON at `LoomRuntimePaths.userDataDirectory()/Drafts/drafts.json` or the existing equivalent user-data path in this checkout.

- [ ] **Step 3: Add Swift tests**

Tests must create a temporary store root, save a draft, reopen the store, and assert the title/body/reference survive.

- [ ] **Step 4: Connect native Draft detail**

Add a small SwiftUI Draft view in `LoomMinimalRootView.swift` or a focused new `LoomDraftView.swift` if the code becomes large. It must create, edit, save, and reopen the latest draft through `LoomDraftStore`.

- [ ] **Step 5: Run targeted app tests**

Run:

```bash
xcodebuild -project macos-app/Loom/Loom.xcodeproj -scheme Loom -configuration Debug -only-testing:LoomTests/LoomDraftStoreTests test
```

Expected: PASS. If the scheme uses generated project state, run the repo's project generation step first and record it in this plan.

## Task 6: Organize Aggregates Captures

**Files:**
- Modify: `macos-app/Loom/Sources/LoomLibraryView.swift`
- Modify: `macos-app/Loom/Sources/CapturesView.swift` only for deep-link reuse, not visual redesign
- Modify: `tests/captures-landing-refresh-contract.test.ts` only if navigation names changed

- [ ] **Step 1: Add recent captures section under Organize**

Use existing capture index scanning logic from `CapturesView.swift`. Do not duplicate parsing if there is an existing helper that can be moved safely.

- [ ] **Step 2: Keep capture reader deep links**

Each recent capture row in Organize opens the existing capture reader path through the current `pendingCaptureReaderURL` mechanism or a small shared opener.

- [ ] **Step 3: Verify collection-to-organization**

Run:

```bash
npm run test:captures-landing
```

Expected: PASS after any necessary label updates.

## Task 7: Legacy Reader Segment Bug

**Files:**
- Modify: `app/loom-render/capture/page.tsx`
- Modify: `tests/capture-interactive-artifacts.test.ts`

- [ ] **Step 1: Add the failing regression**

Add a test fixture where the body contains:

```text
# Software

## Board

0x80 0x83 0x01 imageData 0x8F
```

and `captureAst.interactiveArtifacts` is empty or missing. Expected: the rendered output does not leave the frame bytes as a normal paragraph and the segment diagram container is not computed as `display: inline`.

- [ ] **Step 2: Fix the `inline` class collision**

In `segmentDiagramArtifactHtml()`, replace the literal class token `inline` with a namespaced value such as `loom-segment-diagram--inline-artifact`, and ensure CSS sets the diagram container to `display: block`.

- [ ] **Step 3: Add honest legacy fallback**

If deterministic reconstruction is unavailable, render a reader-visible legacy notice with actions or links for recapture/open snapshot. Do not silently show flattened structure as normal prose.

- [ ] **Step 4: Verify capture behavior**

Run:

```bash
npm run test:capture-interactive:export
```

Expected: PASS and no overlap for the flipdisc frame-format fixture.

## Task 8: Verification Gate And Final Audit

**Files:**
- Modify: `docs/projects/active/2026-05-08-new-loom-skeleton.md` only if implementation changes the promised gates.
- Modify: `package.json` only if the gate map changes.

- [ ] **Step 1: Run product verification**

Run:

```bash
npm run verify:product
```

Expected: PASS. If this fails because a command is missing or too strict for the current repo state, update the gate map instead of ignoring the failure.

- [ ] **Step 2: Verify installed first screen**

Use `@computer-use` / `.codex/computer-use` as the first desktop visual verification path. Do not silently fall back to OS screenshots when Computer Use returns an Apple Event authentication error, because screenshots can steal the user's active desktop. If Computer Use is blocked, keep working with non-UI logs, saved files, app smoke commands, browser-extension artifacts, and explicit blocker notes until the user permits screenshot verification or fixes the Computer Use permission path.

- [ ] **Step 3: Completion audit**

Map every Phase 1 acceptance check from `docs/projects/active/2026-05-08-new-loom-skeleton.md` to concrete evidence:

- file path and line for implemented code,
- command output for tests,
- installed-app visual verification result,
- remaining legacy routes still present,
- flipdisc reader regression result,
- dirty-state summary showing only intended changes or documented unrelated changes.

- [ ] **Step 4: Report**

Report exact commands run, exact pass/fail state, and any remaining uncovered requirement. Do not claim “new Loom complete” unless the audit passes every acceptance check.
