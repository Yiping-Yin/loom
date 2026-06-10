# Loom Asset-Led Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Home and Digital Me from text-marker layouts into asset-led product surfaces grounded in real profile, institution, document, course, and process assets.

**Architecture:** Keep the verified dossier data as the source of truth, add a focused asset manifest contract beside it, and introduce reusable asset primitives under `components/verified-dossier`. Home and Digital Me should consume the same asset data so real files, logos, thumbnails, and process states replace repeated explanatory copy.

**Tech Stack:** Next.js App Router, React server/client components, TypeScript, `node:test`, `react-dom/server`, CSS in `app/globals.css`, in-app Browser verification on `http://127.0.0.1:3000/`.

---

## File Structure

- Modify: `lib/new-loom/verified-dossier-home.ts`
  - Add `VerifiedDossierVisualAsset`, `VerifiedDossierAssetManifest`, `VerifiedDossierProcessAsset`, and `VERIFIED_DOSSIER_ASSET_MANIFEST`.
  - Add `visualAsset` to every `VERIFIED_DOSSIER_PRESENTATION_CATEGORIES` item.
  - Add `assetIds` to Digital Me canvas items where real document proof exists.
- Create: `components/verified-dossier/AssetPrimitives.tsx`
  - Export `ProfileAsset`, `InstitutionBadge`, `DocumentPreviewAsset`, `CourseAssetRow`, `KnowledgeCanvasNode`, `ProcessStepAsset`, and `CitationAssetStrip`.
  - Reuse `FileBadge`, `InstitutionMark`, and verified dossier artifact resolution.
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
  - Replace text-heavy category cards with asset-backed proof sections.
  - Keep recent Draft as a production state only, not top-level navigation.
- Modify: `app/digital-me/page.tsx`
  - Replace paragraph-first sections with mode rail, visual Trading canvas, evidence strip, and cited source assets.
- Modify: `app/globals.css`
  - Add styles for the new asset primitives and responsive Home/Digital Me layouts.
- Create: `tests/loom-asset-led-upgrade.test.tsx`
  - Test asset manifest, asset primitives, Home composition, and Digital Me composition.
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`
  - Extend existing data contract checks for asset manifest and visual assets.
- Modify: `tests/home-client-first-paint.test.tsx`
  - Assert first paint includes asset-led Home surface and no top-level Draft nav.

---

### Task 1: Asset Manifest Contract

**Files:**
- Modify: `lib/new-loom/verified-dossier-home.ts`
- Test: `tests/loom-asset-led-upgrade.test.tsx`
- Test: `tests/loom-verified-dossier-home-contract.test.ts`

- [ ] **Step 1: Write the failing asset manifest test**

Create `tests/loom-asset-led-upgrade.test.tsx` with this initial content:

```tsx
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';

import {
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_ASSET_MANIFEST,
  VERIFIED_DOSSIER_DIGITAL_ME_CANVASES,
  VERIFIED_DOSSIER_PRESENTATION_CATEGORIES,
} from '../lib/new-loom/verified-dossier-home';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function assertPublicAsset(src: string) {
  assert.match(src, /^\//, `${src} should be a public asset path`);
  assert.ok(existsSync(join(repoRoot, 'public', src)), `${src} should exist under public/`);
}

test('asset manifest exposes real profile, institution, document, course, and process assets', () => {
  assertPublicAsset(VERIFIED_DOSSIER_ASSET_MANIFEST.profile.photoSrc);

  for (const institution of VERIFIED_DOSSIER_ASSET_MANIFEST.institutions) {
    assert.match(institution.label, /\S/);
    assertPublicAsset(institution.imageSrc);
  }

  assert.ok(VERIFIED_DOSSIER_ASSET_MANIFEST.documents.length >= 5);
  for (const documentAsset of VERIFIED_DOSSIER_ASSET_MANIFEST.documents) {
    assert.match(documentAsset.id, /\S/);
    assert.match(documentAsset.label, /\S/);
    assert.match(documentAsset.href, /^\//);
    assert.match(documentAsset.kind, /pdf|word|ppt|excel|markdown|html|text/);
    assert.ok(documentAsset.thumbnailSrc || documentAsset.sourcePath);
  }

  assert.ok(VERIFIED_DOSSIER_ASSET_MANIFEST.courses.some((course) => course.code === 'ECON 3202'));
  assert.ok(VERIFIED_DOSSIER_ASSET_MANIFEST.courses.some((course) => course.code === 'FINS 3666'));
  assert.ok(VERIFIED_DOSSIER_ASSET_MANIFEST.courses.some((course) => course.code === 'MATH 2991'));
  assert.deepEqual(
    VERIFIED_DOSSIER_ASSET_MANIFEST.process.map((step) => step.label),
    ['Sources', 'Draft', 'Answer', 'Digital Me'],
  );
});

test('presentation categories bind to visual assets instead of text-only markers', () => {
  for (const category of VERIFIED_DOSSIER_PRESENTATION_CATEGORIES) {
    assert.ok(category.visualAsset, `${category.id} should expose a visual asset`);
    assert.match(category.visualAsset.label, /\S/);
    assert.match(category.visualAsset.caption, /\S/);
    const paths = [category.visualAsset.src, ...(category.visualAsset.srcs ?? [])].filter(Boolean);
    assert.ok(paths.length > 0, `${category.id} should include at least one visual path`);
    for (const src of paths) assertPublicAsset(src);
  }
});

test('Digital Me Trading canvas carries document asset ids for proof nodes', () => {
  const tradingCanvas = VERIFIED_DOSSIER_DIGITAL_ME_CANVASES.find((canvas) => canvas.id === 'trading');
  assert.ok(tradingCanvas, 'Trading canvas should exist');
  const artifactIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));
  const canvasAssetIds = tradingCanvas.columns.flatMap((column) =>
    column.items.flatMap((item) => item.assetIds ?? []),
  );
  assert.ok(canvasAssetIds.includes('econ-slides'));
  assert.ok(canvasAssetIds.includes('quantnet-python-foundations'));
  for (const assetId of canvasAssetIds) {
    assert.ok(artifactIds.has(assetId), `${assetId} should resolve to a verified dossier artifact`);
  }
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx
```

Expected: FAIL because `VERIFIED_DOSSIER_ASSET_MANIFEST` and `assetIds` are not defined.

- [ ] **Step 3: Add asset manifest types and constants**

In `lib/new-loom/verified-dossier-home.ts`, add these types after `VerifiedDossierArtifactId`:

```ts
export type VerifiedDossierVisualAsset = {
  label: string;
  caption: string;
  src?: string;
  srcs?: readonly string[];
  artifactIds?: readonly VerifiedDossierArtifactId[];
};

export type VerifiedDossierProcessAsset = {
  label: 'Sources' | 'Draft' | 'Answer' | 'Digital Me';
  state: 'ready' | 'active' | 'output';
  summary: string;
};

export type VerifiedDossierAssetManifest = {
  profile: {
    name: string;
    photoSrc: string;
    role: string;
    location: string;
  };
  institutions: readonly {
    id: VerifiedDossierSection['id'];
    label: string;
    imageSrc: string;
  }[];
  documents: readonly VerifiedDossierArtifact[];
  courses: readonly VerifiedDossierCourseFolder[];
  process: readonly VerifiedDossierProcessAsset[];
};
```

Update `VerifiedDossierPresentationCategory` to include:

```ts
visualAsset: VerifiedDossierVisualAsset;
```

Update `VerifiedDossierDigitalMeCanvas` item shape to include:

```ts
assetIds?: readonly VerifiedDossierArtifactId[];
```

Add `visualAsset` to each presentation category:

```ts
visualAsset: {
  label: 'About me page.docx',
  caption: 'Profile source and identity brief',
  src: '/profile/yiping-avatar.png',
  artifactIds: ['about-doc'],
},
```

Use these category-specific values:

```ts
// About
{ label: 'About me page.docx', caption: 'Profile source and identity brief', src: '/profile/yiping-avatar.png', artifactIds: ['about-doc'] }

// Education
{ label: 'UNSW / WQU / QuantNet / Claude', caption: 'Institution and course evidence', srcs: ['/brand/unsw/unsw-crest.png', '/brand/wqu/wqu-icon.png', '/brand/quantnet/quantnet-icon.png', '/brand/claude/claude-icon.png'], artifactIds: ['econ-ps2', 'econ-slides', 'wqu-index', 'claude-certificate'] }

// Experience
{ label: 'Python Foundations.pdf', caption: 'Project and build process proof', src: '/verified-sources/quantnet/python-foundations.png', artifactIds: ['quantnet-python-foundations', 'econ-notes'] }

// Digital Me
{ label: 'Trading Knowledge Canvas', caption: 'Topic canvas grounded in education and experience assets', srcs: ['/verified-sources/econ3202/w8-a-concave-functions.png', '/verified-sources/quantnet/python-foundations.png'], artifactIds: ['econ-slides', 'quantnet-python-foundations'] }
```

Add this manifest after `VERIFIED_DOSSIER_UNSW_COURSES`:

```ts
export const VERIFIED_DOSSIER_ASSET_MANIFEST = {
  profile: {
    name: VERIFIED_DOSSIER_PROFILE.name,
    photoSrc: VERIFIED_DOSSIER_PROFILE.photoSrc,
    role: VERIFIED_DOSSIER_PROFILE.roles.join(' · '),
    location: VERIFIED_DOSSIER_PROFILE.location,
  },
  institutions: [
    { id: 'unsw', label: 'UNSW Sydney', imageSrc: '/brand/unsw/unsw-crest.png' },
    { id: 'wqu', label: 'WorldQuant University', imageSrc: '/brand/wqu/wqu-icon.png' },
    { id: 'quantnet', label: 'QuantNet', imageSrc: '/brand/quantnet/quantnet-icon.png' },
    { id: 'claude', label: 'Claude', imageSrc: '/brand/claude/claude-icon.png' },
  ],
  documents: VERIFIED_DOSSIER_ARTIFACTS,
  courses: VERIFIED_DOSSIER_UNSW_COURSES,
  process: [
    { label: 'Sources', state: 'ready', summary: 'Real files and course folders stay inspectable.' },
    { label: 'Draft', state: 'active', summary: 'Source material becomes cited notes and outputs.' },
    { label: 'Answer', state: 'output', summary: 'Published answers point back to source assets.' },
    { label: 'Digital Me', state: 'output', summary: 'Topics become canvases and portfolio-ready explanations.' },
  ],
} as const satisfies VerifiedDossierAssetManifest;
```

In `VERIFIED_DOSSIER_DIGITAL_ME_CANVASES`, add `assetIds` to items that currently use `artifactIds`. Keep `artifactIds` for compatibility during this pass:

```ts
artifactIds: ['econ-slides', 'econ-ps2'],
assetIds: ['econ-slides', 'econ-ps2'],
```

- [ ] **Step 4: Run the asset manifest test and verify it passes**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx
```

Expected: PASS for the three asset manifest tests.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add lib/new-loom/verified-dossier-home.ts tests/loom-asset-led-upgrade.test.tsx
git commit -m "feat: add Loom verified asset manifest"
```

---

### Task 2: Reusable Asset Primitives

**Files:**
- Create: `components/verified-dossier/AssetPrimitives.tsx`
- Modify: `app/globals.css`
- Test: `tests/loom-asset-led-upgrade.test.tsx`

- [ ] **Step 1: Add failing component rendering tests**

Append to `tests/loom-asset-led-upgrade.test.tsx`:

```tsx
import {
  CitationAssetStrip,
  CourseAssetRow,
  DocumentPreviewAsset,
  InstitutionBadge,
  KnowledgeCanvasNode,
  ProcessStepAsset,
  ProfileAsset,
} from '../components/verified-dossier/AssetPrimitives';
import {
  resolveVerifiedDossierArtifact,
  VERIFIED_DOSSIER_UNSW_COURSES,
} from '../lib/new-loom/verified-dossier-home';

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

test('asset primitives render real visual assets and file badges', () => {
  const profileHtml = render(<ProfileAsset profile={VERIFIED_DOSSIER_ASSET_MANIFEST.profile} />);
  assert.match(profileHtml, /vd-profile-asset/);
  assert.match(profileHtml, /<img/);
  assert.match(profileHtml, /Yiping Yin/);

  const institutionHtml = render(<InstitutionBadge institution={VERIFIED_DOSSIER_ASSET_MANIFEST.institutions[0]} />);
  assert.match(institutionHtml, /vd-institution-badge/);
  assert.match(institutionHtml, /UNSW Sydney/);
  assert.match(institutionHtml, /<img/);

  const documentHtml = render(<DocumentPreviewAsset artifact={resolveVerifiedDossierArtifact('econ-slides')} />);
  assert.match(documentHtml, /vd-document-preview-asset/);
  assert.match(documentHtml, /W8 A Concave-Functions\.pdf/);
  assert.match(documentHtml, />PDF</);
  assert.match(documentHtml, /UNSW\/ECON 3202\/02_Week\/W08/);

  const courseHtml = render(<CourseAssetRow course={VERIFIED_DOSSIER_UNSW_COURSES[0]} />);
  assert.match(courseHtml, /vd-course-asset-row/);
  assert.match(courseHtml, /ECON 3202/);

  const processHtml = render(<ProcessStepAsset step={VERIFIED_DOSSIER_ASSET_MANIFEST.process[0]} />);
  assert.match(processHtml, /vd-process-step-asset/);
  assert.match(processHtml, /Sources/);
});

test('canvas and citation primitives keep evidence visible', () => {
  const canvasHtml = render(
    <KnowledgeCanvasNode
      label="ECON 3202"
      detail="Optimisation and concavity source proof."
      href="/knowledge/unsw/econ3202"
      artifacts={[resolveVerifiedDossierArtifact('econ-slides'), resolveVerifiedDossierArtifact('econ-ps2')]}
    />,
  );
  assert.match(canvasHtml, /vd-knowledge-canvas-node/);
  assert.match(canvasHtml, /ECON 3202/);
  assert.match(canvasHtml, /W8 A Concave-Functions\.pdf/);
  assert.match(canvasHtml, /Problem Set 02\.pdf/);

  const citationHtml = render(
    <CitationAssetStrip
      artifacts={[resolveVerifiedDossierArtifact('econ-slides'), resolveVerifiedDossierArtifact('quantnet-python-foundations')]}
    />,
  );
  assert.match(citationHtml, /vd-citation-asset-strip/);
  assert.match(citationHtml, /W8 A Concave-Functions\.pdf/);
  assert.match(citationHtml, /Python Foundations\.pdf/);
});
```

- [ ] **Step 2: Run the component tests and verify they fail**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx
```

Expected: FAIL because `components/verified-dossier/AssetPrimitives.tsx` does not exist.

- [ ] **Step 3: Create asset primitive components**

Create `components/verified-dossier/AssetPrimitives.tsx`:

```tsx
import React from 'react';

import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifact,
  type VerifiedDossierAssetManifest,
  type VerifiedDossierCourseFolder,
  type VerifiedDossierProcessAsset,
} from '../../lib/new-loom/verified-dossier-home';
import { FileBadge } from './FileBadge';
import { InstitutionMark } from './InstitutionMark';

type InstitutionAsset = VerifiedDossierAssetManifest['institutions'][number];

export function ProfileAsset({ profile }: { profile: VerifiedDossierAssetManifest['profile'] }) {
  return (
    <section className="vd-profile-asset" aria-label={`${profile.name} profile asset`}>
      <img src={profile.photoSrc} alt={profile.name} draggable={false} />
      <div>
        <strong>{profile.name}</strong>
        <span>{profile.role}</span>
        <small>{profile.location}</small>
      </div>
    </section>
  );
}

export function InstitutionBadge({ institution }: { institution: InstitutionAsset }) {
  return (
    <span className="vd-institution-badge" aria-label={institution.label}>
      <img src={institution.imageSrc} alt="" draggable={false} />
      <span>{institution.label}</span>
    </span>
  );
}

export function DocumentPreviewAsset({ artifact }: { artifact: VerifiedDossierArtifact }) {
  return (
    <a className="vd-document-preview-asset" href={artifact.href}>
      <span className="vd-document-preview-asset__thumb" aria-hidden="true">
        {artifact.thumbnailSrc ? <img src={artifact.thumbnailSrc} alt="" draggable={false} /> : null}
      </span>
      <span className="vd-document-preview-asset__body">
        <FileBadge kind={artifact.kind} label={artifact.label} compact />
        <strong>{artifact.preview?.title ?? artifact.label}</strong>
        <small>{artifact.sourcePath ?? artifact.href}</small>
        <em>{[artifact.pageCount ? `${artifact.pageCount} pages` : null, artifact.fileSize, artifact.modifiedAt].filter(Boolean).join(' · ')}</em>
      </span>
    </a>
  );
}

export function CourseAssetRow({ course }: { course: VerifiedDossierCourseFolder }) {
  const sampleArtifact = course.sampleArtifactId ? resolveVerifiedDossierArtifact(course.sampleArtifactId) : null;
  return (
    <a className="vd-course-asset-row" href={course.href}>
      <InstitutionMark kind="unsw" />
      <span>
        <strong>{course.code}</strong>
        <small>{course.folder}</small>
      </span>
      <em>{course.fileCount} files</em>
      {sampleArtifact ? <FileBadge kind={sampleArtifact.kind} label={sampleArtifact.label} compact /> : null}
    </a>
  );
}

export function ProcessStepAsset({ step }: { step: VerifiedDossierProcessAsset }) {
  return (
    <span className={`vd-process-step-asset vd-process-step-asset--${step.state}`}>
      <strong>{step.label}</strong>
      <small>{step.summary}</small>
    </span>
  );
}

export function KnowledgeCanvasNode({
  label,
  detail,
  href,
  artifacts = [],
}: {
  label: string;
  detail: string;
  href?: string;
  artifacts?: readonly VerifiedDossierArtifact[];
}) {
  const content = (
    <>
      <strong>{label}</strong>
      <span>{detail}</span>
      {artifacts.length > 0 ? (
        <small>{artifacts.map((artifact) => artifact.label).join(' / ')}</small>
      ) : null}
    </>
  );

  return href ? (
    <a className="vd-knowledge-canvas-node" href={href}>
      {content}
    </a>
  ) : (
    <span className="vd-knowledge-canvas-node">{content}</span>
  );
}

export function CitationAssetStrip({ artifacts }: { artifacts: readonly VerifiedDossierArtifact[] }) {
  return (
    <div className="vd-citation-asset-strip" aria-label="Cited source assets">
      {artifacts.map((artifact) => (
        <DocumentPreviewAsset key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add CSS for asset primitives**

Append to `app/globals.css`:

```css
.vd-profile-asset,
.vd-document-preview-asset,
.vd-course-asset-row,
.vd-process-step-asset,
.vd-knowledge-canvas-node {
  border: 1px solid rgba(32, 38, 34, 0.14);
  background: rgba(255, 255, 252, 0.78);
}

.vd-profile-asset {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 1rem;
  align-items: center;
}

.vd-profile-asset img {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.vd-institution-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
}

.vd-institution-badge img {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
}

.vd-document-preview-asset {
  display: grid;
  grid-template-columns: minmax(5rem, 7rem) 1fr;
  gap: 0.9rem;
  padding: 0.75rem;
  color: inherit;
  text-decoration: none;
}

.vd-document-preview-asset__thumb {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: rgba(32, 38, 34, 0.05);
}

.vd-document-preview-asset__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vd-document-preview-asset__body,
.vd-course-asset-row span,
.vd-knowledge-canvas-node {
  display: grid;
  gap: 0.35rem;
}

.vd-course-asset-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  color: inherit;
  text-decoration: none;
}

.vd-process-step-asset {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem;
}

.vd-knowledge-canvas-node {
  padding: 0.85rem;
  color: inherit;
  text-decoration: none;
}

.vd-citation-asset-strip {
  display: grid;
  gap: 0.75rem;
}
```

- [ ] **Step 5: Run component tests and typecheck**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx && npm run typecheck
```

Expected: PASS and no TypeScript errors.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add components/verified-dossier/AssetPrimitives.tsx app/globals.css tests/loom-asset-led-upgrade.test.tsx
git commit -m "feat: add verified dossier asset primitives"
```

---

### Task 3: Asset-Led Home Composition

**Files:**
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `app/globals.css`
- Test: `tests/loom-asset-led-upgrade.test.tsx`
- Test: `tests/home-client-first-paint.test.tsx`

- [ ] **Step 1: Add failing Home composition test**

Append to `tests/loom-asset-led-upgrade.test.tsx`:

```tsx
import { VerifiedDossierHome } from '../components/verified-dossier/VerifiedDossierHome';

test('Home renders an asset-led proof composition instead of text-only category cards', () => {
  const html = render(
    <VerifiedDossierHome
      activitySummary="Draft: 0 items, Sources: 0 links"
      ready
      hasRecent={false}
      onOpenSources={() => {}}
      onOpenRecent={() => {}}
    />,
  );

  assert.match(html, /vd-home-asset-grid/);
  assert.match(html, /vd-document-preview-asset/);
  assert.match(html, /vd-course-asset-row/);
  assert.match(html, /vd-process-step-asset/);
  assert.match(html, /About me page\.docx/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /Python Foundations\.pdf/);
  assert.match(html, /Claude Certificate\.html|WQU index\.html/);
  assert.doesNotMatch(html, /class="vd-personal-category-card"/);
  assert.doesNotMatch(html, />Draft<\/a>/);
});
```

- [ ] **Step 2: Run Home test and verify it fails**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx
```

Expected: FAIL because `vd-home-asset-grid` and the new asset primitives are not rendered by Home yet.

- [ ] **Step 3: Replace Home category cards with asset composition**

In `components/verified-dossier/VerifiedDossierHome.tsx`, add imports:

```tsx
import {
  CourseAssetRow,
  DocumentPreviewAsset,
  ProcessStepAsset,
  ProfileAsset,
} from './AssetPrimitives';
```

Also import `VERIFIED_DOSSIER_ASSET_MANIFEST` from `verified-dossier-home`.

Inside `VerifiedDossierHome`, define:

```tsx
const featuredProofAssets = [
  resolveVerifiedDossierArtifact('about-doc'),
  resolveVerifiedDossierArtifact('econ-ps2'),
  resolveVerifiedDossierArtifact('econ-slides'),
  resolveVerifiedDossierArtifact('quantnet-python-foundations'),
  resolveVerifiedDossierArtifact('claude-certificate'),
];
```

Replace the `vd-personal-categories` section with:

```tsx
<section className="vd-home-asset-grid" aria-label="Verified profile assets">
  <ProfileAsset profile={VERIFIED_DOSSIER_ASSET_MANIFEST.profile} />
  <div className="vd-home-asset-grid__documents" aria-label="Featured proof documents">
    {featuredProofAssets.map((artifact) => (
      <DocumentPreviewAsset key={artifact.id} artifact={artifact} />
    ))}
  </div>
  <div className="vd-home-asset-grid__courses" aria-label="Course proof assets">
    {VERIFIED_DOSSIER_UNSW_COURSES.slice(0, 3).map((course) => (
      <CourseAssetRow key={course.id} course={course} />
    ))}
  </div>
  <div className="vd-home-asset-grid__process" aria-label="Loom process assets">
    {VERIFIED_DOSSIER_ASSET_MANIFEST.process.map((step) => (
      <ProcessStepAsset key={step.label} step={step} />
    ))}
  </div>
</section>
```

Keep the existing `Open Digital Me`, `Open Sources`, and recent Draft action logic.

- [ ] **Step 4: Add Home asset grid CSS**

Append to `app/globals.css`:

```css
.vd-home-asset-grid {
  display: grid;
  grid-template-columns: minmax(16rem, 0.9fr) minmax(0, 1.4fr);
  gap: 1rem;
  align-items: start;
}

.vd-home-asset-grid__documents,
.vd-home-asset-grid__courses,
.vd-home-asset-grid__process {
  display: grid;
  gap: 0.75rem;
}

.vd-home-asset-grid__documents {
  grid-column: 2;
  grid-row: span 3;
}

@media (max-width: 880px) {
  .vd-home-asset-grid {
    grid-template-columns: 1fr;
  }

  .vd-home-asset-grid__documents {
    grid-column: auto;
    grid-row: auto;
  }
}
```

- [ ] **Step 5: Run Home-related tests**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected: PASS. If `home-client-first-paint` still expects old category card classes, update it to expect `vd-home-asset-grid`, `vd-document-preview-asset`, and `vd-process-step-asset`.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add components/verified-dossier/VerifiedDossierHome.tsx app/globals.css tests/loom-asset-led-upgrade.test.tsx tests/home-client-first-paint.test.tsx
git commit -m "feat: make Loom home asset-led"
```

---

### Task 4: Asset-Led Digital Me Composition

**Files:**
- Modify: `app/digital-me/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/loom-asset-led-upgrade.test.tsx`
- Test: `tests/loom-verified-dossier-home-contract.test.ts`

- [ ] **Step 1: Add failing Digital Me asset composition test**

Append to `tests/loom-asset-led-upgrade.test.tsx`:

```tsx
test('Digital Me renders mode, canvas, evidence, and citation assets as a product surface', async () => {
  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const html = render(React.createElement(DigitalMePage));

  assert.match(html, /vd-digital-me-shell/);
  assert.match(html, /vd-digital-me-mode-rail/);
  assert.match(html, /vd-digital-me-canvas/);
  assert.match(html, /vd-knowledge-canvas-node/);
  assert.match(html, /vd-citation-asset-strip/);
  assert.match(html, /Trading Knowledge/);
  assert.match(html, /FINS 3666/);
  assert.match(html, /MATH 2991/);
  assert.match(html, /ECON 3202/);
  assert.match(html, /Python/);
  assert.match(html, /C\+\+/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /Python Foundations\.pdf/);
  assert.doesNotMatch(html, /<section class="vd-section-page__list"/);
});
```

- [ ] **Step 2: Run Digital Me test and verify it fails**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx
```

Expected: FAIL because Digital Me still uses the old text section classes.

- [ ] **Step 3: Refactor Digital Me page to asset-led shell**

In `app/digital-me/page.tsx`, import:

```tsx
import {
  CitationAssetStrip,
  DocumentPreviewAsset,
  KnowledgeCanvasNode,
  ProcessStepAsset,
} from '../../components/verified-dossier/AssetPrimitives';
```

Also import `VERIFIED_DOSSIER_ASSET_MANIFEST`.

Inside the page component, add:

```tsx
const canvasArtifactsById = new Map(
  topicCanvas.columns
    .flatMap((column) => column.items)
    .flatMap((item) => item.assetIds ?? item.artifactIds ?? [])
    .map((artifactId) => {
      const artifact = resolveVerifiedDossierArtifact(artifactId);
      return [artifact.id, artifact] as const;
    }),
);
const canvasArtifacts = Array.from(canvasArtifactsById.values());
```

Replace the existing `<main className="vd-section-page"...>` contents with this structure while preserving the nav:

```tsx
<main className="vd-section-page vd-digital-me-shell" aria-labelledby="digital-me-title">
  <nav className="vd-section-page__nav" aria-label="Digital Me navigation">
    <a href="/">Loom</a>
    <a href="/about">About</a>
    <a href="/education">Education</a>
    <a href="/experience">Experience</a>
    <a aria-current="page" href="/digital-me">Digital Me</a>
  </nav>

  <header className="vd-digital-me-hero">
    <p>Digital Me</p>
    <h1 id="digital-me-title">A living personal interface.</h1>
    <span>{category.summary}</span>
  </header>

  <section className="vd-digital-me-mode-rail" aria-label="Digital Me modes">
    {VERIFIED_DOSSIER_DIGITAL_ME_MODES.map((mode) => (
      <article key={mode.label}>
        <strong>{mode.label}</strong>
        <span>{mode.summary}</span>
      </article>
    ))}
  </section>

  <section className="vd-digital-me-canvas" aria-labelledby="digital-me-canvas-title">
    <div className="vd-digital-me-canvas__header">
      <p>From ask to canvas</p>
      <h2 id="digital-me-canvas-title">{topicCanvas.topic} Knowledge Canvas</h2>
      <span>{topicCanvas.description}</span>
    </div>
    <div className="vd-digital-me-canvas__grid">
      {topicCanvas.columns.map((column) => (
        <article key={column.label}>
          <strong>{column.label}</strong>
          <p>{column.summary}</p>
          <div>
            {column.items.map((item) => (
              <KnowledgeCanvasNode
                key={item.label}
                label={item.label}
                detail={item.detail}
                href={'href' in item ? item.href : undefined}
                artifacts={(item.assetIds ?? item.artifactIds ?? []).map(resolveVerifiedDossierArtifact)}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  </section>

  <section className="vd-digital-me-evidence" aria-label="Digital Me evidence assets">
    <div>
      <h2>Evidence behind this canvas</h2>
      <CitationAssetStrip artifacts={canvasArtifacts} />
    </div>
    <div>
      <h2>Process state</h2>
      {VERIFIED_DOSSIER_ASSET_MANIFEST.process.map((step) => (
        <ProcessStepAsset key={step.label} step={step} />
      ))}
    </div>
  </section>

  <section className="vd-section-page__answer" aria-labelledby="digital-me-answer-title">
    <h2 id="digital-me-answer-title">{VERIFIED_DOSSIER_AI_PROMPT.question}</h2>
    <p>{VERIFIED_DOSSIER_AI_PROMPT.answer}</p>
    <CitationAssetStrip artifacts={citations} />
  </section>
</main>
```

Remove old `vd-section-page__modes`, `vd-section-page__list`, `vd-section-page__foundations`, `vd-section-page__canvas`, and `vd-section-page__loom-layer` blocks from this page.

- [ ] **Step 4: Add Digital Me shell CSS**

Append to `app/globals.css`:

```css
.vd-digital-me-shell {
  --vd-digital-me-grid-gap: clamp(1rem, 2vw, 1.5rem);
}

.vd-digital-me-hero {
  display: grid;
  gap: 0.9rem;
  padding: clamp(2rem, 5vw, 4rem) 0;
  border-bottom: 1px solid rgba(32, 38, 34, 0.14);
}

.vd-digital-me-mode-rail {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid rgba(32, 38, 34, 0.14);
}

.vd-digital-me-mode-rail article {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border-right: 1px solid rgba(32, 38, 34, 0.12);
}

.vd-digital-me-mode-rail article:last-child {
  border-right: 0;
}

.vd-digital-me-canvas,
.vd-digital-me-evidence {
  display: grid;
  gap: var(--vd-digital-me-grid-gap);
}

.vd-digital-me-canvas__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--vd-digital-me-grid-gap);
}

.vd-digital-me-canvas__grid article,
.vd-digital-me-evidence > div {
  display: grid;
  gap: 0.9rem;
}

.vd-digital-me-canvas__grid article > div {
  display: grid;
  gap: 0.75rem;
}

.vd-digital-me-evidence {
  grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 0.6fr);
}

@media (max-width: 980px) {
  .vd-digital-me-mode-rail,
  .vd-digital-me-canvas__grid,
  .vd-digital-me-evidence {
    grid-template-columns: 1fr;
  }

  .vd-digital-me-mode-rail article {
    border-right: 0;
    border-bottom: 1px solid rgba(32, 38, 34, 0.12);
  }
}
```

- [ ] **Step 5: Run Digital Me and contract tests**

Run:

```bash
npx tsx --test tests/loom-asset-led-upgrade.test.tsx tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
```

Expected: PASS. If old tests assert the removed `vd-section-page__list` or `vd-section-page__canvas` classes, update them to assert `vd-digital-me-mode-rail` and `vd-digital-me-canvas`.

Apply this exact assertion migration when a test still names the removed Digital Me classes:

```ts
assert.match(html, /vd-digital-me-mode-rail/);
assert.match(html, /vd-digital-me-canvas/);
assert.doesNotMatch(html, /vd-section-page__list/);
assert.doesNotMatch(html, /vd-section-page__canvas/);
```

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add app/digital-me/page.tsx app/globals.css tests/loom-asset-led-upgrade.test.tsx tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
git commit -m "feat: make Digital Me asset-led"
```

---

### Task 5: Final Verification and Browser QA

**Files:**
- Modify: `tests/home-client-first-paint.test.tsx` only if final assertions need updated class names.
- Modify: `tests/loom-personal-positioning.test.tsx` only if final assertions need updated class names.

- [ ] **Step 1: Run full targeted regression**

Run:

```bash
npx tsx --test \
  tests/loom-asset-led-upgrade.test.tsx \
  tests/home-client-first-paint.test.tsx \
  tests/loom-personal-positioning.test.tsx \
  tests/loom-verified-dossier-home-contract.test.ts \
  tests/verified-dossier-components.test.tsx \
  tests/draft-answer-preview.test.ts \
  tests/draft-library.test.ts \
  tests/reference-citation-consumers.test.ts \
  tests/reference-source-citations.test.ts \
  tests/source-to-draft-chain.test.ts \
  tests/draft-workspace-composition.test.ts \
  tests/next-dev-config.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Verify only port 3000 is active**

Run:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
lsof -nP -iTCP:3003 -sTCP:LISTEN
```

Expected: port `3000` has the Next server; ports `3001`, `3002`, and `3003` have no listener.

- [ ] **Step 4: Browser verify Home**

Use the in-app Browser on `http://127.0.0.1:3000/`.

Check:

```js
({
  hasAssetGrid: Boolean(document.querySelector('.vd-home-asset-grid')),
  hasDocumentAssets: document.querySelectorAll('.vd-document-preview-asset').length >= 3,
  hasProcessAssets: document.querySelectorAll('.vd-process-step-asset').length >= 4,
  hasDraftTopNav: Array.from(document.querySelectorAll('.vd-nav__links a')).some((a) => a.textContent?.trim() === 'Draft'),
  hasChinese: /[\u3400-\u9fff]/.test(document.body.textContent || ''),
})
```

Expected:

```json
{
  "hasAssetGrid": true,
  "hasDocumentAssets": true,
  "hasProcessAssets": true,
  "hasDraftTopNav": false,
  "hasChinese": false
}
```

- [ ] **Step 5: Browser verify Digital Me**

Use the in-app Browser on `http://127.0.0.1:3000/digital-me`.

Check:

```js
({
  hasDigitalShell: Boolean(document.querySelector('.vd-digital-me-shell')),
  hasModeRail: Boolean(document.querySelector('.vd-digital-me-mode-rail')),
  hasCanvas: Boolean(document.querySelector('.vd-digital-me-canvas')),
  hasCanvasNodes: document.querySelectorAll('.vd-knowledge-canvas-node').length >= 6,
  hasCitationAssets: document.querySelectorAll('.vd-citation-asset-strip .vd-document-preview-asset').length >= 2,
  hasChinese: /[\u3400-\u9fff]/.test(document.body.textContent || ''),
})
```

Expected:

```json
{
  "hasDigitalShell": true,
  "hasModeRail": true,
  "hasCanvas": true,
  "hasCanvasNodes": true,
  "hasCitationAssets": true,
  "hasChinese": false
}
```

- [ ] **Step 6: Check Browser console health**

For both Home and Digital Me, read warning/error logs.

Expected: no relevant app warnings or errors. An empty `nextjs-portal` with zero width and height is acceptable in dev mode.

- [ ] **Step 7: Commit final assertion updates if needed**

Check whether Step 1 changed final assertion files:

```bash
git diff --name-only tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
```

When that command prints one or both files, run:

```bash
git add tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx
git commit -m "test: verify asset-led Loom surfaces"
```

If no files changed after Task 4, skip this commit.

---

## Final Handoff

After all tasks are complete:

1. Use `superpowers:finishing-a-development-branch`.
2. Run the targeted regression and `npm run typecheck` again.
3. Report browser-verified Home and Digital Me results.
4. State explicitly that this pass improves the web prototype and does not close the separate approval-bound Loom completion gates.
