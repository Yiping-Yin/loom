# Loom Verified Dossier Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Verified Dossier / Artifact-first Loom Home direction while establishing reusable design primitives for the rest of the Loom web surface.

**Architecture:** Keep `app/HomeClient.tsx` as the client entry point because it owns native activity hydration and the native navigation bridge. Move approved Home content into `lib/new-loom/verified-dossier-home.ts`, move reusable visual primitives into `components/verified-dossier/`, and style the new surface with stable CSS classes in `app/globals.css` instead of expanding the current inline-style monolith. Update tests so the new product definition replaces older `personal knowledge display platform` phrasing while preserving `Sources` and `Draft` as canonical app vocabulary.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS in `app/globals.css`, Node test runner with `tsx`, server-side static render tests, Browser/IAB visual verification.

---

## Scope

This plan implements Phase 1A:

- shared Verified Dossier content model
- reusable file / institution / provenance components
- Home page redesign
- test updates for the new product definition
- desktop and mobile visual verification

This plan does not implement:

- live AI provider acceptance
- installed-app importer acceptance
- multi-user accounts
- cloud sync
- paid/public SaaS flows
- full redesign of every downstream page

Downstream pages are prepared through reusable primitives, then scoped explicitly in Task 7's follow-up note.

## File Structure

- Create `lib/new-loom/verified-dossier-home.ts`
  - Owns nav labels, profile identity, memberships, artifact data, featured UNSW / ECON3202 story, Ask this profile seed, and history.
- Create `components/verified-dossier/FileBadge.tsx`
  - Renders production-quality code-native file-type badges for PDF, Word, PowerPoint, Excel, Markdown, and text.
- Create `components/verified-dossier/InstitutionMark.tsx`
  - Renders controlled code-native marks for About, UNSW, QuantNet, WQU, and Claude until real licensed marks are available.
- Create `components/verified-dossier/VerifiedDossierHome.tsx`
  - Renders the Home composition from data and receives the native activity summary / handlers from `HomeClient`.
- Modify `app/HomeClient.tsx`
  - Keep hydration, bridge, `formatNativeActivitySummary`, `handleOpenSources`, and `handleOpenRecent`.
  - Delegate visible UI to `VerifiedDossierHome`.
  - Remove visible `Yiping's Loom` and old role-card grid.
- Modify `app/globals.css`
  - Add `.vd-*` classes for the new design system.
  - Keep mobile nav fixes already present for `.loom-app-home__*` only if still used.
- Modify `tests/home-client-first-paint.test.tsx`
  - Assert the new canonical copy, artifact names, file types, AI provenance, and no visible `Yiping's Loom` headline.
- Modify `tests/loom-mature-platform-contract.test.tsx`
  - Replace outdated `personal knowledge display platform` assertions for Home with the new inspectable knowledge identity language.
- Modify `tests/loom-personal-positioning.test.tsx`
  - Align support assertions with the approved Chinese/English product definition where the test touches Home.

## Task 1: Add Verified Dossier Home Data Contract

**Files:**
- Create: `lib/new-loom/verified-dossier-home.ts`
- Test: `tests/loom-verified-dossier-home-contract.test.ts`

- [ ] **Step 1: Write the failing data contract test**

Create `tests/loom-verified-dossier-home-contract.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
} from '../lib/new-loom/verified-dossier-home';

test('verified dossier home data preserves approved product definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.headline,
    'A knowledge profile people can inspect and ask.',
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.body,
    /Sources, drafts, projects, and conversations become a public record/i,
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.chineseBody,
    /资料、学习路径、作品、过程记录和 AI 对话/,
  );
});

test('verified dossier home keeps canonical navigation and profile identity', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.label),
    ['About', 'Sources', 'UNSW', 'Quantnet', 'WQU', 'Claude', 'History'],
  );
  assert.equal(VERIFIED_DOSSIER_PROFILE.name, 'Yiping Yin');
  assert.match(VERIFIED_DOSSIER_PROFILE.location, /Sydney/);
  assert.ok(VERIFIED_DOSSIER_PROFILE.links.some((link) => link.label === 'LinkedIn'));
  assert.ok(VERIFIED_DOSSIER_PROFILE.memberships.some((item) => item.label === 'UNSW Sydney'));
});

test('verified dossier home includes ECON3202 artifacts and file kinds', () => {
  const labels = VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.label);
  for (const label of [
    'ECON3202 Problem Set 2.pdf',
    'Lecture 8 Slides.pptx',
    'Tutorial 3 Solutions.pdf',
    'Lecture 8 Notes.pdf',
    'About me page.docx',
    'BHP Case Study.xlsx',
    'Prompt library.md',
  ]) {
    assert.ok(labels.includes(label), `${label} should be present`);
  }

  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'pdf'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'ppt'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'word'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'excel'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'markdown'));
});

test('verified dossier home keeps five sections and Loom history', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_SECTIONS.map((section) => section.label),
    ['About', 'UNSW / ECON3202', 'Quantnet', 'WQU', 'Claude'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_HISTORY.map((item) => item.title),
    ['Original Loom', 'Private Wiki', 'Knowledge identity', 'Platform for everyone'],
  );
});

test('verified dossier AI prompt is source-grounded and not generic chat', () => {
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.question, /Phillips Curve/);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /inflation and unemployment/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /expectations/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /supply shocks/i);
  assert.ok(VERIFIED_DOSSIER_AI_PROMPT.citations.length >= 3);
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: FAIL because `lib/new-loom/verified-dossier-home.ts` does not exist.

- [ ] **Step 3: Create the data module**

Create `lib/new-loom/verified-dossier-home.ts` with:

```ts
export type VerifiedDossierFileKind = 'pdf' | 'word' | 'ppt' | 'excel' | 'markdown' | 'text';

export type VerifiedDossierNavItem = {
  label: string;
  href: string;
};

export type VerifiedDossierProfileLink = {
  label: 'LinkedIn' | 'GitHub' | 'Website';
  href: string;
};

export type VerifiedDossierMembership = {
  label: string;
  kind: 'unsw' | 'wqu' | 'quantnet';
};

export type VerifiedDossierArtifact = {
  id: string;
  label: string;
  kind: VerifiedDossierFileKind;
  shelf: 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';
  role: string;
  href: string;
};

export type VerifiedDossierSection = {
  id: 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';
  label: string;
  href: string;
  summary: string;
  status: string;
  artifactIds: string[];
};

export type VerifiedDossierHistoryItem = {
  title: string;
  text: string;
  date: string;
};

export const VERIFIED_DOSSIER_TOP_NAV: VerifiedDossierNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Sources', href: '/knowledge' },
  { label: 'UNSW', href: '/knowledge/unsw' },
  { label: 'Quantnet', href: '/knowledge/quantnet' },
  { label: 'WQU', href: '/knowledge/wqu' },
  { label: 'Claude', href: '/knowledge/claude' },
  { label: 'History', href: '/product-history' },
];

export const VERIFIED_DOSSIER_HOME_COPY = {
  headline: 'A knowledge profile people can inspect and ask.',
  body: 'Sources, drafts, projects, and conversations become a public record with evidence behind every answer.',
  chineseHeadline: '一个可展示、可追溯、可交流的个人知识身份。',
  chineseBody:
    'Loom 将资料、学习路径、作品、过程记录和 AI 对话织成一个真实的个人知识档案。它既是作品集，也是知识库，最终也是一个基于本人知识的虚拟个人 AI。',
  shortDefinition:
    'Loom turns your sources, learning path, work, process records, and AI conversations into an inspectable personal knowledge identity.',
};

export const VERIFIED_DOSSIER_PROFILE = {
  name: 'Yiping Yin',
  roles: ['Student', 'Builder', 'Learner'],
  location: 'Sydney, Australia',
  photoSrc: '/profile/yiping-avatar.png',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'Website', href: 'https://fanpu.io' },
  ] satisfies VerifiedDossierProfileLink[],
  memberships: [
    { label: 'UNSW Sydney', kind: 'unsw' },
    { label: 'WorldQuant University', kind: 'wqu' },
    { label: 'QuantNet', kind: 'quantnet' },
  ] satisfies VerifiedDossierMembership[],
};

export const VERIFIED_DOSSIER_ARTIFACTS: VerifiedDossierArtifact[] = [
  {
    id: 'about-doc',
    label: 'About me page.docx',
    kind: 'word',
    shelf: 'about',
    role: 'Profile notes, values, direction',
    href: '/about',
  },
  {
    id: 'econ-ps2',
    label: 'ECON3202 Problem Set 2.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Problem-set evidence',
    href: '/knowledge/unsw/econ3202/problem-set-2',
  },
  {
    id: 'econ-slides',
    label: 'Lecture 8 Slides.pptx',
    kind: 'ppt',
    shelf: 'unsw',
    role: 'Lecture source',
    href: '/knowledge/unsw/econ3202',
  },
  {
    id: 'econ-tutorial',
    label: 'Tutorial 3 Solutions.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Tutorial solution source',
    href: '/knowledge/unsw/econ3202',
  },
  {
    id: 'econ-notes',
    label: 'Lecture 8 Notes.pdf',
    kind: 'pdf',
    shelf: 'unsw',
    role: 'Course notes',
    href: '/knowledge/unsw/econ3202',
  },
  {
    id: 'quant-market-making',
    label: 'Market Making Interview Notes.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Quant interview preparation',
    href: '/knowledge/quantnet',
  },
  {
    id: 'quant-python',
    label: 'Python Foundations.pdf',
    kind: 'pdf',
    shelf: 'quantnet',
    role: 'Programming path',
    href: '/knowledge/quantnet',
  },
  {
    id: 'wqu-bhp',
    label: 'BHP Case Study.xlsx',
    kind: 'excel',
    shelf: 'wqu',
    role: 'Case-study artifact',
    href: '/knowledge/wqu',
  },
  {
    id: 'claude-prompts',
    label: 'Prompt library.md',
    kind: 'markdown',
    shelf: 'claude',
    role: 'Prompt and conversation memory',
    href: '/knowledge/claude',
  },
  {
    id: 'claude-cert',
    label: 'Claude certificate.pdf',
    kind: 'pdf',
    shelf: 'claude',
    role: 'Certificate evidence',
    href: '/knowledge/claude',
  },
];

export const VERIFIED_DOSSIER_SECTIONS: VerifiedDossierSection[] = [
  {
    id: 'about',
    label: 'About',
    href: '/about',
    summary: 'Identity, values, current direction, and public context.',
    status: 'Profile layer',
    artifactIds: ['about-doc'],
  },
  {
    id: 'unsw',
    label: 'UNSW / ECON3202',
    href: '/knowledge/unsw',
    summary: 'Course sources, problem-set work, and learning evidence.',
    status: 'Featured evidence story',
    artifactIds: ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  },
  {
    id: 'quantnet',
    label: 'Quantnet',
    href: '/knowledge/quantnet',
    summary: 'Quant interviews, programming practice, and market reasoning.',
    status: 'Skill proof',
    artifactIds: ['quant-market-making', 'quant-python'],
  },
  {
    id: 'wqu',
    label: 'WQU',
    href: '/knowledge/wqu',
    summary: 'Credential work, case studies, and professional learning records.',
    status: 'Credential evidence',
    artifactIds: ['wqu-bhp'],
  },
  {
    id: 'claude',
    label: 'Claude',
    href: '/knowledge/claude',
    summary: 'AI conversations, prompts, certificates, and grounded persona memory.',
    status: 'AI memory',
    artifactIds: ['claude-prompts', 'claude-cert'],
  },
];

export const VERIFIED_DOSSIER_AI_PROMPT = {
  question: 'What is the Phillips Curve and how is it used in ECON3202?',
  answer:
    'In ECON3202, the Phillips Curve frames the short-run trade-off between inflation and unemployment. When aggregate demand rises, unemployment can fall while inflation rises. The course also uses expectations and supply shocks to explain why the curve shifts over time.',
  citations: ['econ-ps2', 'econ-slides', 'econ-tutorial'],
};

export const VERIFIED_DOSSIER_HISTORY: VerifiedDossierHistoryItem[] = [
  {
    title: 'Original Loom',
    text: 'The first idea: link knowledge, projects, and conversations.',
    date: 'Apr 2024',
  },
  {
    title: 'Private Wiki',
    text: 'Built the foundation for personal knowledge management.',
    date: 'Jun 2024',
  },
  {
    title: 'Knowledge identity',
    text: 'Sources, drafts, work, process, and AI conversations become inspectable.',
    date: 'Jun 2026',
  },
  {
    title: 'Platform for everyone',
    text: 'From one real instance toward Loom for everyone.',
    date: 'Next',
  },
];
```

- [ ] **Step 4: Run the data contract test**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add lib/new-loom/verified-dossier-home.ts tests/loom-verified-dossier-home-contract.test.ts
git commit -m "feat: add verified dossier home data"
```

## Task 2: Build Reusable Artifact Components

**Files:**
- Create: `components/verified-dossier/FileBadge.tsx`
- Create: `components/verified-dossier/InstitutionMark.tsx`
- Test: `tests/verified-dossier-components.test.tsx`

- [ ] **Step 1: Write failing component render tests**

Create `tests/verified-dossier-components.test.tsx`:

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { FileBadge } from '../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../components/verified-dossier/InstitutionMark';

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (element: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

test('FileBadge renders recognizable file type labels', () => {
  assert.match(render(<FileBadge kind="pdf" label="Lecture 8 Notes.pdf" />), /PDF/);
  assert.match(render(<FileBadge kind="word" label="About me page.docx" />), /DOCX/);
  assert.match(render(<FileBadge kind="ppt" label="Lecture 8 Slides.pptx" />), /PPTX/);
  assert.match(render(<FileBadge kind="excel" label="BHP Case Study.xlsx" />), /XLSX/);
  assert.match(render(<FileBadge kind="markdown" label="Prompt library.md" />), /MD/);
});

test('InstitutionMark renders accessible labels for each shelf mark', () => {
  for (const kind of ['about', 'unsw', 'quantnet', 'wqu', 'claude'] as const) {
    const html = render(<InstitutionMark kind={kind} />);
    assert.match(html, /aria-label=/);
  }
});
```

- [ ] **Step 2: Run component tests to verify failure**

Run:

```bash
npx tsx --test tests/verified-dossier-components.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Create `FileBadge`**

Create `components/verified-dossier/FileBadge.tsx`:

```tsx
import type { VerifiedDossierFileKind } from '../../lib/new-loom/verified-dossier-home';

const FILE_META: Record<VerifiedDossierFileKind, { ext: string; className: string }> = {
  pdf: { ext: 'PDF', className: 'vd-file-badge--pdf' },
  word: { ext: 'DOCX', className: 'vd-file-badge--word' },
  ppt: { ext: 'PPTX', className: 'vd-file-badge--ppt' },
  excel: { ext: 'XLSX', className: 'vd-file-badge--excel' },
  markdown: { ext: 'MD', className: 'vd-file-badge--markdown' },
  text: { ext: 'TXT', className: 'vd-file-badge--text' },
};

export function FileBadge({
  kind,
  label,
  compact = false,
}: {
  kind: VerifiedDossierFileKind;
  label: string;
  compact?: boolean;
}) {
  const meta = FILE_META[kind];
  return (
    <span className={`vd-file-badge ${meta.className}${compact ? ' vd-file-badge--compact' : ''}`}>
      <span className="vd-file-badge__icon" aria-hidden="true">
        <span>{meta.ext}</span>
      </span>
      <span className="vd-file-badge__label">{label}</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `InstitutionMark`**

Create `components/verified-dossier/InstitutionMark.tsx`:

```tsx
export type InstitutionMarkKind = 'about' | 'unsw' | 'quantnet' | 'wqu' | 'claude';

const LABELS: Record<InstitutionMarkKind, string> = {
  about: 'About',
  unsw: 'UNSW Sydney',
  quantnet: 'QuantNet',
  wqu: 'WorldQuant University',
  claude: 'Claude',
};

export function InstitutionMark({ kind }: { kind: InstitutionMarkKind }) {
  return (
    <span className={`vd-institution-mark vd-institution-mark--${kind}`} aria-label={LABELS[kind]}>
      <span aria-hidden="true">{kind === 'unsw' ? 'UNSW' : LABELS[kind].slice(0, 1)}</span>
    </span>
  );
}
```

- [ ] **Step 5: Run component tests**

Run:

```bash
npx tsx --test tests/verified-dossier-components.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add components/verified-dossier/FileBadge.tsx components/verified-dossier/InstitutionMark.tsx tests/verified-dossier-components.test.tsx
git commit -m "feat: add verified dossier artifact components"
```

## Task 3: Add Verified Dossier CSS System

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add design-system CSS classes**

Append this block near the existing Home CSS / responsive section in `app/globals.css`:

```css
.vd-home {
  min-height: 100vh;
  background: #ffffff;
  color: #111312;
  font-family: var(--sans);
}

.vd-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(14rem, 20rem) auto;
  align-items: center;
  gap: 1.25rem;
  min-height: 3.8rem;
  padding: 0.65rem clamp(1.25rem, 3vw, 2.6rem);
  border-bottom: 1px solid #e6e8e5;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: saturate(180%) blur(18px);
}

.vd-wordmark {
  color: #111312;
  font-family: var(--display);
  font-size: 1.75rem;
  line-height: 1;
  text-decoration: none;
}

.vd-nav__links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.75rem, 1.7vw, 1.45rem);
  min-width: 0;
  overflow-x: auto;
}

.vd-nav__links a,
.vd-profile-link,
.vd-text-link {
  color: #255f4d;
  text-decoration: none;
}

.vd-nav__links a {
  color: #242927;
  font-size: 0.82rem;
  font-weight: 760;
  white-space: nowrap;
}

.vd-search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.15rem;
  padding: 0 0.55rem;
  border: 1px solid #e1e4df;
  border-radius: 7px;
  color: #707773;
}

.vd-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
}

.vd-avatar,
.vd-profile-photo {
  overflow: hidden;
  border-radius: 999px;
  background: #edf0ec;
}

.vd-avatar {
  width: 2.2rem;
  height: 2.2rem;
}

.vd-profile-photo {
  width: 6.25rem;
  height: 6.25rem;
  box-shadow: 0 16px 40px rgba(17, 19, 18, 0.12);
}

.vd-avatar img,
.vd-profile-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 31%;
}

.vd-layout {
  display: grid;
  grid-template-columns: minmax(14.5rem, 17rem) minmax(0, 1fr) minmax(18rem, 22rem);
  min-height: calc(100vh - 3.8rem);
}

.vd-identity,
.vd-inspector {
  padding: clamp(1.35rem, 2.3vw, 2.2rem);
}

.vd-identity {
  border-right: 1px solid #e6e8e5;
}

.vd-inspector {
  border-left: 1px solid #e6e8e5;
}

.vd-main {
  min-width: 0;
  padding: clamp(1.6rem, 3vw, 3rem);
}

.vd-title {
  max-width: 11ch;
  margin: 0;
  font-family: var(--display);
  font-size: clamp(3rem, 5.2vw, 5.35rem);
  font-weight: 560;
  line-height: 0.94;
  letter-spacing: 0;
}

.vd-subtitle {
  max-width: 38rem;
  margin: 1rem 0 0;
  color: #4f5753;
  font-family: var(--serif);
  font-size: clamp(1rem, 1.4vw, 1.28rem);
  line-height: 1.48;
}

.vd-featured-story {
  display: grid;
  gap: 1rem;
  margin-top: clamp(1.8rem, 3vw, 2.8rem);
  padding-top: 1.2rem;
  border-top: 1px solid #e1e4df;
}

.vd-artifact-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(16rem, 0.9fr);
  gap: clamp(1rem, 2vw, 1.6rem);
  align-items: start;
}

.vd-file-stack,
.vd-section-lanes,
.vd-citation-list,
.vd-history {
  display: grid;
  gap: 0.55rem;
}

.vd-file-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  max-width: 100%;
  padding: 0.38rem 0.48rem;
  border: 1px solid #e1e4df;
  border-radius: 7px;
  background: #ffffff;
  color: #2a302d;
  font-size: 0.78rem;
  line-height: 1.2;
}

.vd-file-badge__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.45rem;
  height: 1.72rem;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.48rem;
  font-weight: 850;
  box-shadow: inset 0 -0.5px 0 rgba(0, 0, 0, 0.16);
}

.vd-file-badge__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd-file-badge--pdf .vd-file-badge__icon { background: #d93025; }
.vd-file-badge--word .vd-file-badge__icon { background: #2b579a; }
.vd-file-badge--ppt .vd-file-badge__icon { background: #d24726; }
.vd-file-badge--excel .vd-file-badge__icon { background: #217346; }
.vd-file-badge--markdown .vd-file-badge__icon,
.vd-file-badge--text .vd-file-badge__icon { background: #68716d; }

.vd-institution-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 999px;
  background: #111312;
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 850;
}

.vd-institution-mark--unsw {
  border-radius: 6px;
  background: #ffffff;
  color: #111312;
  border: 1px solid #cfd6d1;
  font-size: 0.48rem;
}

.vd-institution-mark--wqu { background: #1f4f82; }
.vd-institution-mark--quantnet { background: #050607; }
.vd-institution-mark--claude { background: #d86f32; }

.vd-section-row {
  display: grid;
  grid-template-columns: 2rem minmax(7rem, 0.85fr) minmax(0, 1.4fr);
  gap: 0.8rem;
  align-items: start;
  padding: 0.8rem 0;
  border-top: 1px solid #e8ebe6;
}

.vd-inspector-card {
  display: grid;
  gap: 0.95rem;
  padding: 1rem;
  border: 1px solid #e1e4df;
  border-radius: 8px;
  background: #ffffff;
}

.vd-history {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1.6rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e4df;
}

@media (max-width: 1180px) {
  .vd-layout {
    grid-template-columns: minmax(13rem, 15rem) minmax(0, 1fr);
  }

  .vd-inspector {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid #e6e8e5;
  }
}

@media (max-width: 820px) {
  .vd-nav {
    grid-template-columns: 1fr auto;
  }

  .vd-nav__links,
  .vd-search {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .vd-layout,
  .vd-artifact-stage,
  .vd-history {
    grid-template-columns: 1fr;
  }

  .vd-identity,
  .vd-inspector {
    border: 0;
    border-bottom: 1px solid #e6e8e5;
  }

  .vd-title {
    max-width: none;
    font-size: clamp(2.45rem, 14vw, 3.5rem);
  }
}
```

- [ ] **Step 2: Commit Task 3**

```bash
git add app/globals.css
git commit -m "style: add verified dossier web system"
```

## Task 4: Implement Verified Dossier Home Composition

**Files:**
- Create: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `app/HomeClient.tsx`
- Test: `tests/home-client-first-paint.test.tsx`

- [ ] **Step 1: Update Home first-paint test before implementation**

Replace the first test body in `tests/home-client-first-paint.test.tsx` with assertions that match the new spec:

```tsx
test('HomeClient first paint renders the verified dossier home', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const text = visibleText(html);

  assert.match(html, /A knowledge profile people can inspect and ask\./);
  assert.match(html, /Sources, drafts, projects, and conversations become a public record/i);
  assert.match(html, /一个可展示、可追溯、可交流的个人知识身份/);
  assert.match(html, /Yiping Yin/);
  assert.match(html, /Student/);
  assert.match(html, /Builder/);
  assert.match(html, /Learner/);
  assert.match(html, /Sydney, Australia/);

  for (const label of ['About', 'Sources', 'UNSW', 'Quantnet', 'WQU', 'Claude', 'History']) {
    assert.match(text, new RegExp(label));
  }

  for (const artifact of [
    'ECON3202 Problem Set 2.pdf',
    'Lecture 8 Slides.pptx',
    'Tutorial 3 Solutions.pdf',
    'Lecture 8 Notes.pdf',
    'About me page.docx',
    'BHP Case Study.xlsx',
    'Prompt library.md',
  ]) {
    assert.match(html, new RegExp(artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const fileType of ['PDF', 'PPTX', 'DOCX', 'XLSX', 'MD']) {
    assert.match(html, new RegExp(fileType));
  }

  assert.match(html, /Ask this profile/);
  assert.match(html, /Phillips Curve/);
  assert.match(html, /inflation and unemployment/i);
  assert.match(html, /expectations/i);
  assert.match(html, /supply shocks/i);
  assert.match(html, /Sources/);
  assert.match(html, /Draft/);
  assert.doesNotMatch(text, /Yiping's Loom/);
  assert.doesNotMatch(text, /\b(?:panel|panels|pursuit|pursuits|weave|weaves)\b/i);
  assert.doesNotMatch(html, />\s*&nbsp;\s*</i);
});
```

- [ ] **Step 2: Run the updated Home first-paint test to verify failure**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx
```

Expected: FAIL because the current Home still renders old visible copy and lacks the new artifact data.

- [ ] **Step 3: Create `VerifiedDossierHome`**

Create `components/verified-dossier/VerifiedDossierHome.tsx`:

```tsx
'use client';

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';
import { InstitutionMark } from './InstitutionMark';

type VerifiedDossierHomeProps = {
  activitySummary: string;
  ready: boolean;
  hasRecent: boolean;
  onOpenSources: () => void;
  onOpenRecent: () => void;
};

function artifactsFor(ids: string[]) {
  return ids
    .map((id) => VERIFIED_DOSSIER_ARTIFACTS.find((artifact) => artifact.id === id))
    .filter((artifact): artifact is (typeof VERIFIED_DOSSIER_ARTIFACTS)[number] => Boolean(artifact));
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VerifiedDossierHome({
  activitySummary,
  ready,
  hasRecent,
  onOpenSources,
  onOpenRecent,
}: VerifiedDossierHomeProps) {
  const featured = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw')!;
  const featuredArtifacts = artifactsFor(featured.artifactIds);
  const citationArtifacts = artifactsFor(VERIFIED_DOSSIER_AI_PROMPT.citations);

  return (
    <main className="vd-home" aria-labelledby="verified-dossier-title">
      <nav className="vd-nav" aria-label="Loom navigation">
        <a className="vd-wordmark" href="/">Loom</a>
        <div className="vd-nav__links">
          {VERIFIED_DOSSIER_TOP_NAV.map((item) => (
            <a href={item.href} key={item.label}>{item.label}</a>
          ))}
        </div>
        <label className="vd-search">
          <SearchIcon />
          <input aria-label="Search Loom" placeholder="Search Loom..." />
          <span>⌘K</span>
        </label>
        <a className="vd-avatar" href="/about" aria-label="Yiping profile">
          <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
        </a>
      </nav>

      <div className="vd-layout">
        <aside className="vd-identity" aria-label="Yiping identity dossier">
          <a className="vd-profile-photo" href="/about" aria-label="Open Yiping profile">
            <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="Yiping Yin" draggable={false} />
          </a>
          <h2>{VERIFIED_DOSSIER_PROFILE.name}</h2>
          <p>{VERIFIED_DOSSIER_PROFILE.roles.join(' · ')}</p>
          <p>{VERIFIED_DOSSIER_PROFILE.location}</p>
          <div>
            {VERIFIED_DOSSIER_PROFILE.links.map((link) => (
              <a className="vd-profile-link" href={link.href} key={link.label}>{link.label}</a>
            ))}
          </div>
          <div>
            {VERIFIED_DOSSIER_PROFILE.memberships.map((membership) => (
              <p key={membership.label}>
                <InstitutionMark kind={membership.kind} /> {membership.label}
              </p>
            ))}
          </div>
          <p>{ready ? activitySummary : 'Sources and Draft ready'}</p>
          <button type="button" onClick={onOpenSources}>Open Sources</button>
          <button type="button" onClick={onOpenRecent} disabled={!hasRecent}>Open latest</button>
        </aside>

        <section className="vd-main" aria-label="Verified knowledge evidence">
          <h1 id="verified-dossier-title" className="vd-title">{VERIFIED_DOSSIER_HOME_COPY.headline}</h1>
          <p className="vd-subtitle">{VERIFIED_DOSSIER_HOME_COPY.body}</p>
          <p className="sr-only">{VERIFIED_DOSSIER_HOME_COPY.chineseHeadline}</p>
          <p className="sr-only">{VERIFIED_DOSSIER_HOME_COPY.chineseBody}</p>
          <p className="sr-only">{VERIFIED_DOSSIER_HOME_COPY.shortDefinition}</p>

          <section className="vd-featured-story" aria-labelledby="featured-story-title">
            <div>
              <p>Featured evidence story</p>
              <h2 id="featured-story-title">{featured.label}</h2>
              <p>{featured.summary}</p>
            </div>
            <div className="vd-artifact-stage">
              <div className="vd-file-stack">
                {featuredArtifacts.map((artifact) => (
                  <a href={artifact.href} key={artifact.id}>
                    <FileBadge kind={artifact.kind} label={artifact.label} />
                    <span>{artifact.role}</span>
                  </a>
                ))}
              </div>
              <div>
                <h3>Sources → Draft → Answer</h3>
                <p>Course files become a draft trail, then a cited answer people can inspect.</p>
                <a className="vd-text-link" href="/knowledge/unsw/econ3202">
                  Open ECON3202 evidence <ArrowIcon />
                </a>
              </div>
            </div>
          </section>

          <section className="vd-section-lanes" aria-label="Knowledge evidence lanes">
            {VERIFIED_DOSSIER_SECTIONS.map((section) => (
              <a className="vd-section-row" href={section.href} key={section.id}>
                <InstitutionMark kind={section.id} />
                <span>
                  <strong>{section.label}</strong>
                  <span>{section.status}</span>
                </span>
                <span>
                  {artifactsFor(section.artifactIds).map((artifact) => (
                    <FileBadge compact key={artifact.id} kind={artifact.kind} label={artifact.label} />
                  ))}
                </span>
              </a>
            ))}
          </section>

          <ol className="vd-history" aria-label="Loom history">
            {VERIFIED_DOSSIER_HISTORY.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
                <span>{item.date}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="vd-inspector" aria-labelledby="ask-this-profile-title">
          <h2 id="ask-this-profile-title">Ask this profile</h2>
          <div className="vd-inspector-card">
            <strong>{VERIFIED_DOSSIER_AI_PROMPT.question}</strong>
            <p>{VERIFIED_DOSSIER_AI_PROMPT.answer}</p>
            <div className="vd-citation-list" aria-label="Cited sources">
              {citationArtifacts.map((artifact) => (
                <a href={artifact.href} key={artifact.id}>
                  <FileBadge kind={artifact.kind} label={artifact.label} />
                </a>
              ))}
            </div>
            <label className="vd-search">
              <input aria-label="Ask a follow-up" placeholder="Ask a follow-up..." />
              <ArrowIcon />
            </label>
          </div>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Modify `HomeClient` to delegate visible UI**

In `app/HomeClient.tsx`:

1. Add this import:

```ts
import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';
```

2. Replace the current large JSX return with:

```tsx
  return (
    <VerifiedDossierHome
      activitySummary={formatNativeActivitySummary({ panelCount, pursuitCount, weaveCount })}
      ready={ready}
      hasRecent={Boolean(recent)}
      onOpenSources={handleOpenSources}
      onOpenRecent={handleOpenRecent}
    />
  );
```

3. Keep these exports / helpers intact:

```ts
export function formatNativeActivitySummary(...)
export function HomeClient()
```

4. Remove old unused local components and inline style constants from `HomeClient.tsx` after the new return compiles. Do not remove state hydration or native bridge helpers.

- [ ] **Step 5: Run Home test and TypeScript**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx
npx tsc --noEmit --pretty false
```

Expected: both PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add app/HomeClient.tsx components/verified-dossier/VerifiedDossierHome.tsx tests/home-client-first-paint.test.tsx
git commit -m "feat: implement verified dossier home"
```

## Task 5: Align Positioning Contract Tests

**Files:**
- Modify: `tests/loom-mature-platform-contract.test.tsx`
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Update mature platform Home assertions**

In `tests/loom-mature-platform-contract.test.tsx`, update the Home first-paint test to assert:

```tsx
assert.match(html, /A knowledge profile people can inspect and ask\./);
assert.match(html, /Sources, drafts, projects, and conversations become a public record/i);
assert.match(html, /ECON3202 Problem Set 2\.pdf/);
assert.match(html, /Lecture 8 Slides\.pptx/);
assert.match(html, /Ask this profile/);
assert.match(html, /Original Loom/);
assert.match(html, /Knowledge identity/);
assert.match(html, /Sources/);
assert.match(html, /Draft/);
assert.doesNotMatch(html, /Yiping's Loom/);
```

Remove Home-specific assertions for `Recent progress`, `Product story`, `Process timeline`, and `Output previews` if those labels are no longer visible in the new Home. Keep data-model assertions for `PERSONAL_PLATFORM_*` unchanged unless the imported data changes.

- [ ] **Step 2: Update personal positioning Home assertions**

In `tests/loom-personal-positioning.test.tsx`, update the first test name and assertions:

```tsx
test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);

  assert.match(html, /A knowledge profile people can inspect and ask\./);
  assert.match(html, /Sources, drafts, projects, and conversations become a public record/i);
  assert.match(html, /Loom turns your sources, learning path, work, process records, and AI conversations/i);
  assert.match(html, /portfolio/i);
  assert.match(html, /process/i);
  assert.match(html, /AI/i);
  for (const shelf of ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.match(html, new RegExp(shelf));
  }
  assert.match(html, /ECON3202/);
  assert.match(html, /Sources/);
  assert.match(html, /Draft/);
  assert.doesNotMatch(html, /Yiping's Loom/);
});
```

- [ ] **Step 3: Run focused positioning tests**

Run:

```bash
npx tsx --test tests/loom-mature-platform-contract.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected: PASS, except for pre-existing static/support drift unrelated to Home. If unrelated failures appear in `index.html`, `privacy.html`, `support.html`, or docs, record them and do not hide them by weakening Home tests.

- [ ] **Step 4: Commit Task 5**

```bash
git add tests/loom-mature-platform-contract.test.tsx tests/loom-personal-positioning.test.tsx
git commit -m "test: align home positioning with verified dossier"
```

## Task 6: Browser Visual Verification And Responsive Repair

**Files:**
- Modify only files from Tasks 3-5 if verification finds visible drift.

- [ ] **Step 1: Start or reuse the dev server**

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Expected: Next.js serves `http://127.0.0.1:3000/`. If port 3000 is busy and already serving this app, reuse it. If another process owns it, use port 3001.

- [ ] **Step 2: Verify in Browser/IAB**

Open:

```text
http://127.0.0.1:3000/
```

Check:

- no compile error
- top nav is single-row on desktop
- no visible `Yiping's Loom`
- headline and artifact stage fit in first viewport
- profile photo loads
- file badges show PDF / PPTX / DOCX / XLSX / MD colors
- Ask this profile cites source artifacts
- Loom history is compact and visible

- [ ] **Step 3: Capture desktop and mobile screenshots**

Use Browser/IAB screenshots or Playwright only if Browser/IAB screenshot capture is unavailable. Save temporary screenshots under the repo root with dated names:

```text
loom-verified-dossier-home-desktop-20260602.png
loom-verified-dossier-home-mobile-20260602.png
```

Use `view_image` on:

- accepted concept image: `/Users/yinyiping/.codex/generated_images/019e7a4e-8992-7622-911b-b38bed66557e/ig_0ba7867c8dc3e2f0016a1eaf29b3308191ab28a01f050c9c77.png`
- latest desktop screenshot
- latest mobile screenshot

- [ ] **Step 4: Repair visible drift**

If screenshots show any of these, edit `app/globals.css` or `VerifiedDossierHome.tsx` and re-run checks:

- text overflow
- mobile horizontal scroll
- nav wrapping into incoherent rows
- profile image crop is poor
- file badges look toy-like or oversized
- right AI inspector overpowers the evidence canvas
- first viewport feels like a generic dashboard
- history is too dominant

- [ ] **Step 5: Run final focused checks**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts tests/verified-dossier-components.test.tsx tests/home-client-first-paint.test.tsx
npx tsc --noEmit --pretty false
```

Expected: PASS.

- [ ] **Step 6: Commit verification repairs**

```bash
git add app/globals.css components/verified-dossier/VerifiedDossierHome.tsx app/HomeClient.tsx tests
git commit -m "fix: polish verified dossier home responsive layout"
```

Only commit if verification required additional repairs. If no repairs were made, skip this commit.

## Task 7: Record Follow-up Scope For The Full Page System

**Files:**
- Create: `docs/superpowers/plans/2026-06-02-loom-verified-dossier-page-system-followup.md`

- [ ] **Step 1: Create the follow-up scope note**

Create `docs/superpowers/plans/2026-06-02-loom-verified-dossier-page-system-followup.md`:

```md
# Loom Verified Dossier Page System Follow-up

This follow-up extends the Home implementation to the rest of the web surface:

1. About: identity dossier, portfolio evidence, and product story.
2. Sources: source archive with file-type badges, document previews, and provenance rows.
3. UNSW: ECON3202 as a full source-to-answer learning path.
4. Quantnet: skill-proof lane with interview notes, Python artifacts, and market reasoning.
5. WQU: credential evidence and case-study outputs.
6. Claude: AI conversations, prompts, certificate evidence, and grounded persona memory.
7. History: product story explaining why Loom is called Loom and how the concept evolved.

The same primitives should carry across all pages:

- top navigation
- identity / section dossier header
- evidence lanes
- file badges
- document previews
- source rows
- process records
- AI provenance panels

The first Home phase should not be considered final product completion until this follow-up is implemented or deliberately re-scoped.
```

- [ ] **Step 2: Commit Task 7**

```bash
git add docs/superpowers/plans/2026-06-02-loom-verified-dossier-page-system-followup.md
git commit -m "docs: outline verified dossier page system follow-up"
```

## Self-Review Checklist

- Spec coverage:
  - Product definition: Task 1 and Task 4.
  - Verified Dossier design language: Task 2, Task 3, Task 4.
  - Home composition: Task 4.
  - Page-system consistency: Task 7.
  - Sources / Draft vocabulary: Task 4 and Task 5.
  - Browser/mobile verification: Task 6.
- Placeholder scan:
  - The plan contains no `TBD`, `TODO`, or unspecified implementation slots.
- Type consistency:
  - `VerifiedDossierFileKind` is used by `FileBadge`.
  - `VerifiedDossierArtifact.kind` values match `FILE_META`.
  - `VerifiedDossierSection.id` values match `InstitutionMarkKind`.
  - `VerifiedDossierHome` props are supplied by `HomeClient`.

## Execution Notes

- Keep unrelated dirty worktree changes intact.
- Do not revert user or prior-agent changes.
- Do not use AI-generated institutional marks as production logos. Code-native marks are acceptable temporary controlled marks; official assets require user-provided or licensed files.
- Keep the generated concept images as references only.
- Do not claim live AI provider acceptance or installed importer acceptance from this web Home work.
