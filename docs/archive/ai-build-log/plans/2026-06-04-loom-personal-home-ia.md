# Loom Personal Home IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Loom homepage IA around `About / Education / Experience / Digital Me`, with Loom as the underlying trust mechanism and a lightweight non-blocking intro layer.

**Architecture:** Keep source-library routes and source/draft vocabulary intact underneath the personal presentation layer. Add a small presentation-category data model in `lib/new-loom/verified-dossier-home.ts`, render the new IA from `VerifiedDossierHome`, and add lightweight route entry points for Education, Experience, and Digital Me. The first implementation should reuse existing source assets and components rather than migrating files or rebuilding the whole visual system.

**Tech Stack:** Next.js App Router, React Server/Client Components, TypeScript, CSS in `app/globals.css` and route CSS modules, Node test runner with `tsx --test`, Browser/IAB verification at `http://localhost:3001/`.

---

## Scope

Implement the approved design spec:

- `docs/archive/ai-build-log/specs/2026-06-04-loom-personal-home-ia-design.md`

Do not migrate source files. Do not delete `/knowledge`, `/drafts`, `/knowledge/unsw`, or source-detail routes. This is a presentation-layer IA change.

## File Structure

Modify:

- `lib/new-loom/verified-dossier-home.ts`
  - Owns top-nav labels, personal presentation categories, Loom intro copy, and source artifacts.
- `components/verified-dossier/VerifiedDossierHome.tsx`
  - Renders homepage nav, Loom intro entry, first viewport, category cards, and existing evidence widgets.
- `components/verified-dossier/EvidenceWorkbench.tsx`
  - Reuse source cards where possible; add a presentation-category index component only if it keeps `VerifiedDossierHome` smaller.
- `app/HomeClient.tsx`
  - Update fallback activity wording and navigation target labels if needed.
- `app/about/AboutClient.tsx`
  - Update top nav and reduce product-intro burden from About.
- `app/globals.css`
  - Add styles for the personal nav, Loom intro panel, presentation category cards, and responsive behavior.
- `tests/loom-verified-dossier-home-contract.test.ts`
  - Update data contract for primary nav and intro layer.
- `tests/home-client-first-paint.test.tsx`
  - Update first-paint expectations for visitor-facing IA.
- `tests/loom-personal-positioning.test.tsx`
  - Update positioning tests to enforce About/Education/Experience/Digital Me and non-blocking Loom intro.
- `tests/verified-dossier-components.test.tsx`
  - Add/adjust component-level rendering expectations where needed.

Create:

- `app/education/page.tsx`
  - Education overview route.
- `app/experience/page.tsx`
  - Experience overview route.
- `app/digital-me/page.tsx`
  - Digital Me capability route.

Optional create only if the homepage component becomes too large:

- `components/verified-dossier/PersonalCategoryIndex.tsx`
  - Renders About/Education/Experience/Digital Me cards from shared data.
- `components/verified-dossier/LoomIntroPanel.tsx`
  - Renders the intro disclosure/panel from shared data.

## Task 1: Update Data Contracts For Personal IA

**Files:**
- Modify: `lib/new-loom/verified-dossier-home.ts`
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`

- [ ] **Step 1: Write failing tests for new top navigation**

In `tests/loom-verified-dossier-home-contract.test.ts`, update the navigation test to expect the new visitor-facing nav and safe route list.

```ts
const SAFE_INTERNAL_HREFS = new Set([
  '/about',
  '/education',
  '/experience',
  '/digital-me',
  '/knowledge',
  '/drafts',
  '/knowledge/unsw',
  '/knowledge/quantnet',
  '/knowledge/wqu',
  '/knowledge/claude',
  '/knowledge/unsw/econ3202',
  '/knowledge/unsw/econ3202/ps02',
  '/knowledge/quantnet/quantnet-online-cpp-course',
  '/knowledge/quantnet/python-foundations',
  '/knowledge/wqu/wqu-index',
  '/knowledge/claude/claude-certificate',
  '/product-history',
]);

test('verified dossier home uses personal presentation navigation', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.label),
    ['About', 'Education', 'Experience', 'Digital Me'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.href),
    ['/about', '/education', '/experience', '/digital-me'],
  );
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'Sources'));
  assert.ok(!VERIFIED_DOSSIER_TOP_NAV.some((item) => item.label === 'UNSW'));
});
```

- [ ] **Step 2: Write failing tests for Loom intro data**

Add imports and assertions for `VERIFIED_DOSSIER_LOOM_INTRO` and `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES`.

```ts
import {
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
} from '../lib/new-loom/verified-dossier-home';

test('Loom intro is lightweight and explains the trust mechanism', () => {
  assert.equal(VERIFIED_DOSSIER_LOOM_INTRO.title, 'Built with Loom');
  assert.match(VERIFIED_DOSSIER_LOOM_INTRO.summary, /underlying trust mechanism/i);
  assert.deepEqual(
    VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => step.label),
    ['Sources', 'Draft', 'Digital Me'],
  );
  assert.ok(!VERIFIED_DOSSIER_LOOM_INTRO.blocking);
});

test('presentation categories group existing source evidence without migration', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => category.label),
    ['About', 'Education', 'Experience', 'Digital Me'],
  );

  const education = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((category) => category.id === 'education');
  assert.ok(education);
  assert.ok(education.sourceSectionIds.includes('unsw'));
  assert.ok(education.sourceSectionIds.includes('quantnet'));
  assert.ok(education.sourceSectionIds.includes('wqu'));
  assert.ok(education.sourceSectionIds.includes('claude'));

  const digitalMe = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((category) => category.id === 'digital-me');
  assert.ok(digitalMe);
  assert.ok(digitalMe.capabilities.some((capability) => /citation/i.test(capability)));
  assert.ok(digitalMe.capabilities.some((capability) => /process/i.test(capability)));
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: FAIL because the new exports and nav values are not implemented.

- [ ] **Step 4: Add data types and constants**

In `lib/new-loom/verified-dossier-home.ts`, add these types after `VerifiedDossierNavItem`.

```ts
export type VerifiedDossierPresentationCategoryId = 'about' | 'education' | 'experience' | 'digital-me';

export type VerifiedDossierPresentationCategory = {
  id: VerifiedDossierPresentationCategoryId;
  label: string;
  href: string;
  summary: string;
  proof: string;
  sourceSectionIds: readonly VerifiedDossierSection['id'][];
  artifactIds: readonly VerifiedDossierArtifactId[];
  capabilities: readonly string[];
};

export type VerifiedDossierLoomIntroStep = {
  label: 'Sources' | 'Draft' | 'Digital Me';
  text: string;
};

export type VerifiedDossierLoomIntro = {
  title: string;
  summary: string;
  blocking: boolean;
  steps: readonly VerifiedDossierLoomIntroStep[];
};
```

Then replace `VERIFIED_DOSSIER_TOP_NAV` with:

```ts
export const VERIFIED_DOSSIER_TOP_NAV: VerifiedDossierNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Education', href: '/education' },
  { label: 'Experience', href: '/experience' },
  { label: 'Digital Me', href: '/digital-me' },
];
```

Add `VERIFIED_DOSSIER_LOOM_INTRO` and `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES` after `VERIFIED_DOSSIER_SECTIONS`.

```ts
export const VERIFIED_DOSSIER_LOOM_INTRO = {
  title: 'Built with Loom',
  summary:
    'Loom is the underlying trust mechanism for this profile: real sources become drafts, and Digital Me answers from the same archive.',
  blocking: false,
  steps: [
    { label: 'Sources', text: 'Real files, courses, credentials, projects, and evidence stay inspectable.' },
    { label: 'Draft', text: 'Source material turns into cited notes, answers, and portfolio-ready work.' },
    { label: 'Digital Me', text: 'The AI-facing layer answers, cites, explains process, and walks through evidence.' },
  ],
} as const satisfies VerifiedDossierLoomIntro;

export const VERIFIED_DOSSIER_PRESENTATION_CATEGORIES = [
  {
    id: 'about',
    label: 'About',
    href: '/about',
    summary: 'Self-introduction, direction, public links, and source-backed identity.',
    proof: 'Profile record',
    sourceSectionIds: ['about'],
    artifactIds: ['about-doc'],
    capabilities: ['Identity summary', 'Public context', 'Source-backed profile'],
  },
  {
    id: 'education',
    label: 'Education',
    href: '/education',
    summary: 'Courses, coursework, certificates, and learning outputs backed by real files.',
    proof: 'UNSW, QuantNet, WQU, Claude Certificate',
    sourceSectionIds: ['unsw', 'quantnet', 'wqu', 'claude'],
    artifactIds: ['econ-ps2', 'econ-slides', 'quantnet-cpp-course', 'wqu-index', 'claude-certificate'],
    capabilities: ['Course folders', 'Credential evidence', 'Learning process'],
  },
  {
    id: 'experience',
    label: 'Experience',
    href: '/experience',
    summary: 'Projects, work, competitions, and built systems shown with process evidence.',
    proof: 'Project and build records',
    sourceSectionIds: ['about', 'unsw', 'quantnet'],
    artifactIds: ['about-doc', 'quantnet-python-foundations', 'econ-notes'],
    capabilities: ['Project evidence', 'Competition records', 'Build process'],
  },
  {
    id: 'digital-me',
    label: 'Digital Me',
    href: '/digital-me',
    summary: 'A grounded digital-person layer that answers from sources, drafts, and process.',
    proof: 'Grounded cited answers',
    sourceSectionIds: ['about', 'unsw', 'quantnet', 'wqu', 'claude'],
    artifactIds: ['about-doc', 'econ-ps2', 'econ-slides', 'claude-certificate'],
    capabilities: ['Citation-backed answers', 'Source retrieval', 'Process replay', 'Draft generation'],
  },
] as const satisfies readonly VerifiedDossierPresentationCategory[];
```

- [ ] **Step 5: Run contract tests**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/new-loom/verified-dossier-home.ts tests/loom-verified-dossier-home-contract.test.ts
git commit -m "Update Loom homepage IA data contracts"
```

## Task 2: Update Homepage First Paint And Intro Expectations

**Files:**
- Modify: `tests/home-client-first-paint.test.tsx`
- Modify: `tests/loom-personal-positioning.test.tsx`
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `app/HomeClient.tsx`

- [ ] **Step 1: Write failing first-paint assertions**

In `tests/home-client-first-paint.test.tsx`, replace old nav/source expectations with:

```ts
for (const label of [
  'Yiping Yin',
  'Student',
  'Builder',
  'Learner',
  'Sydney, Australia',
  'About',
  'Education',
  'Experience',
  'Digital Me',
  'Built with Loom',
  'Sources',
  'Draft',
  'real sources',
  'Cited answer',
  'UNSW',
  'ECON 3202',
  'MATH 2991',
  'FINS 3666',
  'Problem Set 02.pdf',
  'W8 A Concave-Functions.pdf',
  'W8 C Suggested Exercises.pdf',
  'About me page.docx',
  'QuantNet Online C++ Course.pdf',
  'WQU index.html',
  'Claude Certificate.html',
  'concavity',
  'first-order conditions',
]) {
  assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

for (const oldPrimaryNav of ['Quantnet', 'WQU', 'Claude', 'History']) {
  const navPattern = new RegExp(`<a[^>]*>${oldPrimaryNav}</a>`);
  assert.doesNotMatch(html, navPattern);
}

assert.doesNotMatch(text, /Verified source workspace/);
assert.doesNotMatch(text, /Sources become cited work/);
assert.doesNotMatch(text, /Active source shelf/);
assert.doesNotMatch(text, /Source index/);
assert.doesNotMatch(text, /blocking onboarding/i);
```

Keep existing negative assertions for `Problem-set evidence`, `Lecture source`, `Exercise source`, `Problem context`, and `Concept source`.

- [ ] **Step 2: Update positioning tests**

In `tests/loom-personal-positioning.test.tsx`, update the home framing test:

```ts
test('home first paint frames Loom as a personal presentation surface with a lightweight product intro', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);

  assert.match(html, /About/);
  assert.match(html, /Education/);
  assert.match(html, /Experience/);
  assert.match(html, /Digital Me/);
  assert.match(html, /Built with Loom/);
  assert.match(html, /underlying trust mechanism|real sources/i);
  assert.match(html, /Cited answer/);
  assert.match(html, /proof|evidence/i);

  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /Sources become cited work/);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected: FAIL because the homepage still renders old copy and source-shelf nav.

- [ ] **Step 4: Update HomeClient fallback copy**

In `app/HomeClient.tsx`, change:

```ts
return 'Sources: UNSW courses, Draft: cited note';
```

to:

```ts
return 'Education: UNSW courses, Digital Me: cited answer';
```

- [ ] **Step 5: Render new homepage nav and Loom intro**

In `components/verified-dossier/VerifiedDossierHome.tsx`, import the new constants:

```ts
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
```

Replace the `vd-search` anchor with a lightweight intro link:

```tsx
<a className="vd-search vd-loom-intro-link" href="#loom-intro" aria-label="How this profile is built with Loom">
  <span>Built with Loom</span>
  <ArrowIcon />
</a>
```

Replace the old hero kicker and title copy:

```tsx
<p className="vd-section-kicker">Source-backed personal profile</p>
<div className="vd-title-lockup">
  <a className="vd-title-avatar" href="/about" aria-label="Open Yiping Yin profile">
    <img src={VERIFIED_DOSSIER_PROFILE.photoSrc} alt="" draggable={false} />
  </a>
  <h1 id="verified-dossier-title" className="vd-title">
    Yiping Yin
  </h1>
</div>
<p className="vd-hero-summary">
  About, education, experience, and Digital Me are backed by real sources, drafts, and cited outputs.
</p>
```

Change the hero link from `Open UNSW` to:

```tsx
<a className="vd-hero-link" href="/digital-me">
  Open Digital Me <ArrowIcon />
</a>
```

Add a non-blocking intro section after the hero header and before the workbench grid:

```tsx
<section id="loom-intro" className="vd-loom-intro" aria-labelledby="loom-intro-title">
  <div>
    <p className="vd-section-kicker">Loom layer</p>
    <h2 id="loom-intro-title">{VERIFIED_DOSSIER_LOOM_INTRO.title}</h2>
    <p>{VERIFIED_DOSSIER_LOOM_INTRO.summary}</p>
  </div>
  <ol>
    {VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => (
      <li key={step.label}>
        <strong>{step.label}</strong>
        <span>{step.text}</span>
      </li>
    ))}
  </ol>
</section>
```

Add a category index after the workbench grid and before `ProvenanceChain`:

```tsx
<section className="vd-personal-categories" aria-label="Personal presentation sections">
  {VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.map((category) => (
    <a key={category.id} className="vd-personal-category-card" href={category.href}>
      <span>{category.proof}</span>
      <strong>{category.label}</strong>
      <small>{category.summary}</small>
      <em>{category.capabilities.slice(0, 2).join(' / ')}</em>
    </a>
  ))}
</section>
```

- [ ] **Step 6: Keep existing source/draft proof visible but demote its labels**

In the same component, keep `ActiveEvidenceStory`, `SourceGraph`, `ProvenanceChain`, and `AnswerInspector` for now. Do not delete them in this task; the first implementation should change first-level IA without breaking the proof surface.

- [ ] **Step 7: Run tests**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/HomeClient.tsx components/verified-dossier/VerifiedDossierHome.tsx tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
git commit -m "Reframe Loom homepage around personal IA"
```

## Task 3: Add Education, Experience, And Digital Me Routes

**Files:**
- Create: `app/education/page.tsx`
- Create: `app/experience/page.tsx`
- Create: `app/digital-me/page.tsx`
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`

- [ ] **Step 1: Add route existence tests**

In `tests/loom-verified-dossier-home-contract.test.ts`, add:

```ts
test('personal IA routes exist as app pages', () => {
  for (const routePage of [
    'app/education/page.tsx',
    'app/experience/page.tsx',
    'app/digital-me/page.tsx',
  ]) {
    assert.ok(existsSync(join(repoRoot, routePage)), `${routePage} should exist`);
  }
});
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: FAIL because the route files do not exist.

- [ ] **Step 3: Create Education route**

Create `app/education/page.tsx`:

```tsx
import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_UNSW_COURSES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import { InstitutionMark } from '../../components/verified-dossier/InstitutionMark';

export const metadata = { title: 'Education · Loom' };

export default function EducationPage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'education');
  if (!category) throw new Error('Missing Education category');
  const sections = VERIFIED_DOSSIER_SECTIONS.filter((section) => category.sourceSectionIds.includes(section.id));
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="education-title">
      <nav className="vd-section-page__nav" aria-label="Education navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a aria-current="page" href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Education</p>
        <h1 id="education-title">Coursework, credentials, and learning evidence.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__grid" aria-label="Education shelves">
        {sections.map((section) => (
          <a key={section.id} className="vd-section-page__card" href={section.href}>
            <InstitutionMark kind={section.id} />
            <strong>{section.label}</strong>
            <small>{section.summary}</small>
          </a>
        ))}
      </section>
      <section className="vd-section-page__course-strip" aria-label="UNSW course folders">
        {VERIFIED_DOSSIER_UNSW_COURSES.slice(0, 8).map((course) => (
          <a key={course.id} href={course.href}>
            <strong>{course.code}</strong>
            <span>{course.status}</span>
          </a>
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Education evidence">
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Create Experience route**

Create `app/experience/page.tsx`:

```tsx
import {
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';

export const metadata = { title: 'Experience · Loom' };

export default function ExperiencePage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'experience');
  if (!category) throw new Error('Missing Experience category');
  const artifacts = category.artifactIds.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="experience-title">
      <nav className="vd-section-page__nav" aria-label="Experience navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a aria-current="page" href="/experience">Experience</a>
        <a href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Experience</p>
        <h1 id="experience-title">Projects, work, competitions, and build evidence.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__list" aria-label="Experience capabilities">
        {category.capabilities.map((capability) => (
          <article key={capability}>
            <strong>{capability}</strong>
            <span>Backed by source records and process artifacts.</span>
          </article>
        ))}
      </section>
      <section className="vd-section-page__artifact-strip" aria-label="Experience evidence">
        {artifacts.map((artifact) => (
          <a key={artifact.id} href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
          </a>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create Digital Me route**

Create `app/digital-me/page.tsx`:

```tsx
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_LOOM_INTRO,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
  resolveVerifiedDossierArtifact,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from '../../components/verified-dossier/FileBadge';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  const category = VERIFIED_DOSSIER_PRESENTATION_CATEGORIES.find((item) => item.id === 'digital-me');
  if (!category) throw new Error('Missing Digital Me category');
  const citations = VERIFIED_DOSSIER_AI_PROMPT.citations.map(resolveVerifiedDossierArtifact);

  return (
    <main className="vd-section-page" aria-labelledby="digital-me-title">
      <nav className="vd-section-page__nav" aria-label="Digital Me navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a aria-current="page" href="/digital-me">Digital Me</a>
      </nav>
      <header className="vd-section-page__hero">
        <p>Digital Me</p>
        <h1 id="digital-me-title">A grounded digital-person layer, not only an ask box.</h1>
        <span>{category.summary}</span>
      </header>
      <section className="vd-section-page__list" aria-label="Digital Me capabilities">
        {category.capabilities.map((capability) => (
          <article key={capability}>
            <strong>{capability}</strong>
            <span>Uses the same source archive and Draft layer behind the public profile.</span>
          </article>
        ))}
      </section>
      <section className="vd-section-page__answer" aria-labelledby="digital-me-answer-title">
        <h2 id="digital-me-answer-title">{VERIFIED_DOSSIER_AI_PROMPT.question}</h2>
        <p>{VERIFIED_DOSSIER_AI_PROMPT.answer}</p>
        <div>
          {citations.map((artifact) => (
            <a key={artifact.id} href={artifact.href}>
              <FileBadge kind={artifact.kind} label={artifact.label} compact />
            </a>
          ))}
        </div>
      </section>
      <section className="vd-section-page__loom-layer" aria-labelledby="digital-me-loom-title">
        <h2 id="digital-me-loom-title">{VERIFIED_DOSSIER_LOOM_INTRO.title}</h2>
        <ol>
          {VERIFIED_DOSSIER_LOOM_INTRO.steps.map((step) => (
            <li key={step.label}>
              <strong>{step.label}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Run route tests**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/education/page.tsx app/experience/page.tsx app/digital-me/page.tsx tests/loom-verified-dossier-home-contract.test.ts
git commit -m "Add personal IA section routes"
```

## Task 4: Style Personal IA And Section Routes

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/home-client-first-paint.test.tsx`

- [ ] **Step 1: Add DOM contract checks for intro/category classes**

In `tests/home-client-first-paint.test.tsx`, add:

```ts
assert.match(html, /class="vd-loom-intro/);
assert.match(html, /class="vd-personal-categories/);
assert.match(html, /class="vd-personal-category-card/);
assert.match(html, /href="\/digital-me"/);
```

- [ ] **Step 2: Run first-paint test and confirm it passes or fails only on missing classes**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx
```

Expected: FAIL if the implementation has not added the class names yet; PASS if Task 2 already added them.

- [ ] **Step 3: Add styles for intro and category cards**

Append to the verified dossier section of `app/globals.css`:

```css
.vd-hero-summary {
  max-width: 42rem;
  margin: 0.6rem 0 0;
  color: rgba(31, 37, 34, 0.68);
  font-size: 0.98rem;
  line-height: 1.55;
}

.vd-loom-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
  align-items: start;
  padding: 1rem 0;
  border-top: 1px solid rgba(32, 73, 59, 0.14);
  border-bottom: 1px solid rgba(32, 73, 59, 0.14);
}

.vd-loom-intro h2 {
  margin: 0.15rem 0 0.35rem;
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 2vw, 1.75rem);
  line-height: 1.05;
}

.vd-loom-intro p {
  max-width: 34rem;
  margin: 0;
  color: rgba(31, 37, 34, 0.68);
  line-height: 1.55;
}

.vd-loom-intro ol {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vd-loom-intro li {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(32, 73, 59, 0.1);
}

.vd-loom-intro li:last-child {
  border-bottom: 0;
}

.vd-loom-intro strong {
  color: var(--vd-ink);
  font-size: 0.82rem;
}

.vd-loom-intro span {
  color: rgba(31, 37, 34, 0.66);
  font-size: 0.86rem;
  line-height: 1.45;
}

.vd-personal-categories {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}

.vd-personal-category-card {
  min-height: 10rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem;
  border: 1px solid rgba(32, 73, 59, 0.16);
  border-radius: 0.5rem;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.68);
}

.vd-personal-category-card > span {
  color: var(--vd-green);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vd-personal-category-card strong {
  font-size: 1.02rem;
}

.vd-personal-category-card small,
.vd-personal-category-card em {
  color: rgba(31, 37, 34, 0.64);
  font-size: 0.78rem;
  font-style: normal;
  line-height: 1.42;
}

.vd-section-page {
  min-height: 100vh;
  padding: 1.4rem clamp(1rem, 4vw, 3rem) 4rem;
  background: var(--vd-paper);
  color: var(--vd-ink);
}

.vd-section-page__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: clamp(2rem, 6vw, 5rem);
}

.vd-section-page__nav a {
  color: inherit;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
}

.vd-section-page__nav a[aria-current='page'] {
  color: var(--vd-green);
}

.vd-section-page__hero {
  max-width: 64rem;
  margin-bottom: 2rem;
}

.vd-section-page__hero p {
  margin: 0 0 0.65rem;
  color: var(--vd-green);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vd-section-page__hero h1 {
  max-width: 58rem;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.35rem, 6vw, 5rem);
  line-height: 0.98;
}

.vd-section-page__hero span {
  display: block;
  max-width: 42rem;
  margin-top: 1rem;
  color: rgba(31, 37, 34, 0.68);
  line-height: 1.55;
}

.vd-section-page__grid,
.vd-section-page__list,
.vd-section-page__artifact-strip,
.vd-section-page__course-strip {
  display: grid;
  gap: 0.75rem;
  max-width: 76rem;
  margin-top: 1rem;
}

.vd-section-page__grid {
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}

.vd-section-page__card,
.vd-section-page__list article,
.vd-section-page__course-strip a,
.vd-section-page__artifact-strip a,
.vd-section-page__answer,
.vd-section-page__loom-layer {
  border: 1px solid rgba(32, 73, 59, 0.16);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.68);
  color: inherit;
  text-decoration: none;
}

.vd-section-page__card,
.vd-section-page__list article,
.vd-section-page__course-strip a,
.vd-section-page__artifact-strip a {
  padding: 0.85rem;
}

.vd-section-page__answer,
.vd-section-page__loom-layer {
  max-width: 76rem;
  margin-top: 1rem;
  padding: 1rem;
}
```

Add responsive rules inside the existing mobile media block or append:

```css
@media (max-width: 820px) {
  .vd-loom-intro {
    grid-template-columns: 1fr;
  }

  .vd-loom-intro li {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }

  .vd-personal-categories {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .vd-personal-categories {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run first-paint test**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/home-client-first-paint.test.tsx
git commit -m "Style Loom personal IA surfaces"
```

## Task 5: Update About Page Navigation And Product Burden

**Files:**
- Modify: `app/about/AboutClient.tsx`
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Write failing About assertions**

In `tests/loom-personal-positioning.test.tsx`, adjust `visible support surfaces use approved personal-identity and local-app positioning`:

```ts
assert.match(about, /personal knowledge postcard/i);
assert.match(about, /self-introduction|current direction|source-backed identity/i);
assert.match(about, /Education/);
assert.match(about, /Experience/);
assert.match(about, /Digital Me/);
assert.doesNotMatch(about, /Ask this profile/);
assert.doesNotMatch(about, /Product story/i);
```

- [ ] **Step 2: Run positioning test and confirm failure**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected: FAIL because About still includes product/story-heavy sections and old nav mapping.

- [ ] **Step 3: Update About navigation**

In `app/about/AboutClient.tsx`, keep using `VERIFIED_DOSSIER_TOP_NAV`. After Task 1, it will render `About / Education / Experience / Digital Me`. Ensure the active About link can be styled by giving it `className="is-active"`:

```tsx
{VERIFIED_DOSSIER_TOP_NAV.map((item) => (
  <a key={item.label} className={item.label === 'About' ? 'is-active' : undefined} href={item.href}>
    {item.label}
  </a>
))}
```

- [ ] **Step 4: Reduce About page product copy**

Replace the `heroCopy` heading/body with:

```tsx
<div className={styles.heroCopy}>
  <p className={styles.sectionLabel}>Personal knowledge postcard</p>
  <h2>Self-introduction, current direction, and source-backed identity.</h2>
  <p>
    I am a student, builder, and learner based in Sydney. This profile presents the
    learning, work, and process records behind my current direction.
  </p>
  <p>
    The page keeps biography close to evidence: education, experience, and Digital Me
    stay connected to real source material rather than detached claims.
  </p>
  <dl className={styles.factGrid}>
    {IDENTITY_FACTS.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ))}
  </dl>
</div>
```

Do not fully delete downstream About sections in this task unless tests require it. If `Ask this profile` remains in a lower section, rename that card to `Profile evidence` and remove ask-box language.

- [ ] **Step 5: Run positioning test**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/about/AboutClient.tsx tests/loom-personal-positioning.test.tsx
git commit -m "Align About page with personal IA"
```

## Task 6: Full Test And Browser Verification

**Files:**
- Modify only if verification reveals issues:
  - `app/globals.css`
  - `components/verified-dossier/VerifiedDossierHome.tsx`
  - route pages from Task 3

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npx tsx --test \
  tests/home-client-first-paint.test.tsx \
  tests/loom-personal-positioning.test.tsx \
  tests/loom-verified-dossier-home-contract.test.ts \
  tests/verified-dossier-components.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit --incremental false --pretty false
```

Expected: exit code 0.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: production build succeeds and includes `/education`, `/experience`, and `/digital-me` routes.

- [ ] **Step 4: Restart local production server**

If a server is listening on port 3001, stop it safely.

Run:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
npm run start -- -p 3001
```

Expected: Next starts at `http://localhost:3001`.

- [ ] **Step 5: Browser/IAB desktop verification**

Open `http://localhost:3001/` in the in-app browser and verify:

- top nav shows `About / Education / Experience / Digital Me`
- old primary nav labels `Sources / Draft / UNSW / Quantnet / WQU / Claude / History` do not appear as primary nav items
- `Built with Loom` is visible and non-blocking
- page still shows real profile image and evidence assets
- `Digital Me` link reaches `/digital-me`
- no horizontal overflow at desktop width
- console warnings/errors are empty

Save screenshot:

```text
/Users/yinyiping/Desktop/Private Wiki/LOOM/archive/screenshots/personal-home-ia-20260604/home-desktop.png
```

- [ ] **Step 6: Browser/IAB mobile verification**

Set a temporary mobile viewport around `390x844`, reload, and verify:

- nav wraps without overlap
- category cards stack cleanly
- intro panel does not block content
- no horizontal overflow
- images load

Save screenshot:

```text
/Users/yinyiping/Desktop/Private Wiki/LOOM/archive/screenshots/personal-home-ia-20260604/home-mobile.png
```

- [ ] **Step 7: Inspect screenshots with `view_image`**

Use `view_image` on both saved screenshots. Fix any visible issues before finishing.

- [ ] **Step 8: Commit verification fixes if any**

If verification required code changes:

```bash
git add \
  app/globals.css \
  components/verified-dossier/VerifiedDossierHome.tsx \
  app/education/page.tsx \
  app/experience/page.tsx \
  app/digital-me/page.tsx \
  tests/home-client-first-paint.test.tsx \
  tests/loom-personal-positioning.test.tsx \
  tests/loom-verified-dossier-home-contract.test.ts \
  tests/verified-dossier-components.test.tsx
git commit -m "Polish Loom personal IA verification issues"
```

If no code changes were needed, do not create an empty commit.

## Task 7: Final Review And Handoff

**Files:**
- No expected code changes.

- [ ] **Step 1: Run final status check**

Run:

```bash
git status --short
```

Expected: only unrelated pre-existing worktree changes remain, or clean if this worktree is isolated.

- [ ] **Step 2: Summarize implementation**

Prepare a short final handoff with:

- changed top navigation
- Loom intro behavior
- new route pages
- tests/build/browser verification commands
- screenshot paths
- any intentional deviations from the spec

- [ ] **Step 3: Invoke finishing workflow**

Use `superpowers:finishing-a-development-branch` before final response if this plan is executed through Superpowers.
