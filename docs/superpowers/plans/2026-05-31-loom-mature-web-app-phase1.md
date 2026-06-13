# Loom Mature Web App Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first mature Loom personal knowledge platform shell across the Private Wiki root page, Loom web home, visible support copy, and focused verification.

**Architecture:** Add a typed personal-platform section model for the Next.js app, keep the static root page self-contained, and align both surfaces around five primary sections plus `Overview / Path / Sources / Process / Outputs`. Keep app operation centered on `Sources` and `Draft`, and remove the remote Google Fonts dependency that blocks local typecheck before TypeScript runs.

**Tech Stack:** Static HTML/CSS, Next.js App Router, React 18, TypeScript, Node test runner, SwiftUI copy-only shell alignment.

---

## File Structure

- Modify: `/Users/yinyiping/Desktop/Private Wiki/index.html` — mature static Private Wiki home.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/scripts/verify-private-wiki-home.mjs` — static home contract.
- Create: `/Users/yinyiping/Desktop/Private Wiki/LOOM/lib/new-loom/personal-platform.ts` — typed section, progress, process, and output data for the Loom web home.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/HomeClient.tsx` — render the mature personal platform dashboard from the shared data.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/globals.css` — replace the thin home layout with a mature operational dashboard layout.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/layout.tsx` — remove `next/font/google` so local verification does not fetch Google Fonts.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/about/AboutClient.tsx` — align About copy to the five-section platform and process model.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/help/page.tsx` — align Help copy to section templates and `Sources / Draft`.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/lib/new-loom/product-shell.ts` — make `Sources / Draft` descriptions explicitly serve the mature section model.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/macos-app/Loom/Sources/LoomMinimalRootView.swift` — copy-only native shell alignment.
- Create: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/loom-mature-platform-contract.test.tsx` — focused maturity contract.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/loom-personal-positioning.test.tsx` — extend existing personal positioning assertions.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/home-client-first-paint.test.tsx` — verify first paint includes mature dashboard modules.
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/package.json` — include the new focused contract test in `test:contracts`.

## Task 1: Write The Mature Platform Contract

**Files:**
- Create: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/loom-mature-platform-contract.test.tsx`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/home-client-first-paint.test.tsx`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Add a failing contract for the mature platform model**

Create a test that asserts:

```ts
const sectionLabels = ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude'];
const modelLabels = ['Overview', 'Path', 'Sources', 'Process', 'Outputs'];
```

The test must check `HomeClient`, `lib/new-loom/personal-platform.ts`, root `../index.html`, `product-shell.ts`, and `LoomMinimalRootView.swift`.

- [ ] **Step 2: Run the focused test to verify it fails before implementation**

Run:

```bash
npx tsx --test tests/loom-mature-platform-contract.test.tsx
```

Expected: failure because the new test file or mature data model does not exist yet.

- [ ] **Step 3: Extend existing tests**

Add assertions for these visible strings:

```ts
'Overview'
'Path'
'Recent progress'
'Process timeline'
'Output previews'
'Sources'
'Draft'
```

- [ ] **Step 4: Do not mark this task complete until the tests have failed for the missing implementation**

Record the failure mode in the working notes or command output.

## Task 2: Add The Personal Platform Data Model

**Files:**
- Create: `/Users/yinyiping/Desktop/Private Wiki/LOOM/lib/new-loom/personal-platform.ts`

- [ ] **Step 1: Define the section model**

Create exports for:

```ts
export type PersonalPlatformSectionId = 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';
export type PersonalPlatformModelLabel = 'Overview' | 'Path' | 'Sources' | 'Process' | 'Outputs';
export const PERSONAL_PLATFORM_MODEL: PersonalPlatformModelLabel[] = ['Overview', 'Path', 'Sources', 'Process', 'Outputs'];
```

- [ ] **Step 2: Define five section records**

Each record must include `id`, `label`, `href`, `summary`, `status`, `nextAction`, `pathSteps`, `sourceGroups`, `processItems`, and `outputs`.

- [ ] **Step 3: Define home modules**

Export:

```ts
export const PERSONAL_PLATFORM_PROGRESS = [
  { label: 'ECON3202', detail: 'UNSW course page is now represented inside the personal study library.' },
  { label: 'Claude', detail: 'Certificate evidence and AI workflow notes stay tied to source material.' },
  { label: 'Quantnet', detail: 'Quant practice is tracked as a path with project evidence.' },
];
export const PERSONAL_PLATFORM_PROCESS = [
  { step: 'Collect', text: 'Bring official pages, PDFs, notes, and captures into Sources.' },
  { step: 'Clarify', text: 'Record decisions, attempts, blockers, and useful references.' },
  { step: 'Publish', text: 'Move source-grounded work into Draft and portfolio outputs.' },
];
export const PERSONAL_PLATFORM_OUTPUTS = [
  { title: 'Study page', section: 'UNSW', text: 'Course summaries and weekly process evidence.' },
  { title: 'Portfolio note', section: 'Quantnet', text: 'Quant practice converted into explainable work.' },
  { title: 'Certificate record', section: 'Claude', text: 'Learning evidence with prompt and process notes.' },
];
```

Use concrete records for ECON3202, source review, Claude certificate evidence, Quantnet practice, WQU staging, and portfolio/process output.

## Task 3: Redesign The Static Private Wiki Home

**Files:**
- Modify: `/Users/yinyiping/Desktop/Private Wiki/index.html`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/scripts/verify-private-wiki-home.mjs`

- [ ] **Step 1: Replace the root home with a mature platform layout**

Keep exactly five primary navigation links:

```html
<a href="#about">About</a>
<a href="UNSW/UNSW.html">UNSW</a>
<a href="Quant/C++/quantnet.html">Quantnet</a>
<a href="WQU/index.html">WQU</a>
<a href="Claude%20Certificate/Claude%20Certificate.html">Claude</a>
```

- [ ] **Step 2: Add the section model to the visible page**

The root page must visibly include:

```text
Overview
Path
Sources
Process
Outputs
Recent progress
Process timeline
Output previews
```

- [ ] **Step 3: Update the static verifier**

Require all five section labels, the five model labels, mature platform modules, and the five expected links.

- [ ] **Step 4: Verify the static root**

Run:

```bash
node scripts/verify-private-wiki-home.mjs
```

Expected: `Private Wiki home verified.`

## Task 4: Redesign Loom Web Home

**Files:**
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/HomeClient.tsx`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/globals.css`

- [ ] **Step 1: Render from the shared data model**

Import:

```ts
import {
  PERSONAL_PLATFORM_MODEL,
  PERSONAL_PLATFORM_OUTPUTS,
  PERSONAL_PLATFORM_PROCESS,
  PERSONAL_PLATFORM_PROGRESS,
  PERSONAL_PLATFORM_SECTIONS,
} from '../lib/new-loom/personal-platform';
```

- [ ] **Step 2: Add mature dashboard modules**

Render these areas:

```text
section dashboard
Sources / Draft command surfaces
recent progress
process timeline
output previews
```

- [ ] **Step 3: Replace the thin home CSS**

Use a responsive layout with max width, stable cards, no nested card shells, no horizontal overflow, and no viewport-scaled font sizing.

- [ ] **Step 4: Verify focused render tests**

Run:

```bash
npx tsx --test tests/loom-mature-platform-contract.test.tsx tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected: all tests pass.

## Task 5: Align Support Copy And App Shell Copy

**Files:**
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/about/AboutClient.tsx`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/help/page.tsx`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/lib/new-loom/product-shell.ts`
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/macos-app/Loom/Sources/LoomMinimalRootView.swift`

- [ ] **Step 1: Keep `Sources / Draft` canonical**

The updated copy must use literal `Sources` and `Draft` wording.

- [ ] **Step 2: Add the mature section model to support copy**

Visible support copy should reference the five-section structure and the `Overview / Path / Sources / Process / Outputs` model.

- [ ] **Step 3: Keep native change copy-only**

Do not alter SwiftUI state, navigation, or bridge behavior in this phase.

## Task 6: Remove Remote Font Fetch From Local Verification

**Files:**
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/app/layout.tsx`

- [ ] **Step 1: Remove `next/font/google`**

Delete:

```ts
import { Cormorant_Garamond } from 'next/font/google';
```

Delete the `cormorant` constant and remove `className={cormorant.variable}` from `<html>`.

- [ ] **Step 2: Preserve typography fallback**

Keep CSS fallback stacks in `app/globals.css` so display typography still resolves locally.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript runs without Google Fonts fetch errors. If TypeScript exposes unrelated existing errors, report the exact errors instead of claiming success.

## Task 7: Wire Test Command And Run Verification

**Files:**
- Modify: `/Users/yinyiping/Desktop/Private Wiki/LOOM/package.json`

- [ ] **Step 1: Add the new contract test to `test:contracts`**

Insert:

```text
tests/loom-mature-platform-contract.test.tsx
```

near the other new-Loom and positioning tests.

- [ ] **Step 2: Run focused verification**

Run:

```bash
node /Users/yinyiping/Desktop/Private\ Wiki/scripts/verify-private-wiki-home.mjs
npx tsx --test tests/loom-mature-platform-contract.test.tsx tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx tests/new-loom-skeleton-contract.test.ts tests/app-store-assets.test.ts
git diff --check -- /Users/yinyiping/Desktop/Private\ Wiki/index.html /Users/yinyiping/Desktop/Private\ Wiki/scripts/verify-private-wiki-home.mjs app/HomeClient.tsx app/globals.css app/layout.tsx app/about/AboutClient.tsx app/help/page.tsx lib/new-loom/product-shell.ts lib/new-loom/personal-platform.ts macos-app/Loom/Sources/LoomMinimalRootView.swift tests/loom-mature-platform-contract.test.tsx tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx package.json
```

Expected: all commands exit 0.

- [ ] **Step 3: Browser verify the static root and web home**

Serve static root with a temporary local server and inspect desktop/mobile for no horizontal overflow. For Next home, use the dev server only if typecheck does not reveal a blocking implementation error.

- [ ] **Step 4: Stop all temporary servers**

Before final response, confirm no needed command session is still running.
