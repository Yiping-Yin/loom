# Loom Home Picture Asset Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Loom homepage from a text-marked personal IA into a picture-first presentation surface where About, Education, Experience, and Digital Me each show real visual evidence or UI assets before short labels.

**Architecture:** Extend the verified dossier homepage data contract with visual asset metadata, render those assets inside the existing `VerifiedDossierHome` category modules, then replace the current text-card CSS with stable media-first cards and compact proof strips. Keep this pass scoped to the homepage and directly supporting data/tests.

**Tech Stack:** Next.js App Router, React client components, CSS in `app/globals.css`, static assets under `public/`, Node test runner with `tsx`, in-app Browser plus Playwright screenshots for visual verification.

---

### Task 1: Homepage Visual Asset Data Contract

**Files:**
- Modify: `lib/new-loom/verified-dossier-home.ts`
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Write the failing contract test**

Add a test that requires every homepage presentation category to have real visual asset metadata and public asset files where `src` or `srcs` are declared.

```ts
test('presentation categories expose real homepage visual assets', () => {
  for (const category of VERIFIED_DOSSIER_PRESENTATION_CATEGORIES) {
    assert.ok(category.visualAsset, `${category.id} should expose a visual asset`);
    assert.match(category.visualAsset.label, /\S/);
    assert.match(category.visualAsset.caption, /\S/);

    const assetPaths = [
      category.visualAsset.src,
      ...(category.visualAsset.srcs ?? []),
    ].filter((src): src is string => Boolean(src));

    assert.ok(assetPaths.length > 0, `${category.id} should bind to at least one image or logo`);

    for (const src of assetPaths) {
      assert.match(src, /^\//, `${src} should be a public asset path`);
      assert.ok(existsSync(join(repoRoot, 'public', src)), `${src} should exist under public/`);
    }
  }
});
```

Add first-paint assertions so the rendered homepage includes picture-first classes and no longer depends on long category explanations:

```ts
assert.match(html, /class="vd-category-visual/);
assert.match(html, /class="vd-category-visual__media/);
assert.match(html, /Course shelves/);
assert.match(html, /Answer canvas/);
assert.doesNotMatch(html, /Self-introduction, direction, public links, and source-backed identity\./);
assert.doesNotMatch(html, /Courses, coursework, certificates, and learning outputs backed by real files\./);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts tests/loom-personal-positioning.test.tsx
```

Expected result: fail because `visualAsset` and the new homepage visual classes are not implemented.

- [ ] **Step 3: Add the data type and category assets**

Add a visual asset type near `VerifiedDossierPresentationCategory`:

```ts
export type VerifiedDossierHomeVisualAsset = {
  kind: 'profile-photo' | 'document-preview' | 'logo-strip' | 'source-thumbnails' | 'ui-preview';
  label: string;
  caption: string;
  src?: string;
  srcs?: readonly string[];
  artifactIds?: readonly VerifiedDossierArtifactId[];
};
```

Extend `VerifiedDossierPresentationCategory`:

```ts
visualAsset: VerifiedDossierHomeVisualAsset;
```

Set these exact first-pass assets:

```ts
visualAsset: {
  kind: 'profile-photo',
  label: 'Profile source',
  caption: 'Portrait, role, and public identity record',
  src: '/profile/yiping-profile-photo.png',
  artifactIds: ['about-doc'],
}
```

```ts
visualAsset: {
  kind: 'logo-strip',
  label: 'Course shelves',
  caption: 'UNSW, WQU, QuantNet, and Claude learning evidence',
  srcs: [
    '/brand/unsw/unsw-crest.png',
    '/brand/wqu/wqu-logo.svg',
    '/brand/quantnet/quantnet-logo.png',
    '/verified-sources/claude/claude-certificate.png',
  ],
  artifactIds: ['econ-ps2', 'econ-slides', 'quantnet-cpp-course', 'wqu-index', 'claude-certificate'],
}
```

```ts
visualAsset: {
  kind: 'source-thumbnails',
  label: 'Project proof',
  caption: 'Programming and worked-output evidence',
  srcs: [
    '/verified-sources/quantnet/python-foundations.png',
    '/verified-sources/econ3202/problem2-answer.png',
  ],
  artifactIds: ['quantnet-python-foundations', 'econ-notes'],
}
```

```ts
visualAsset: {
  kind: 'ui-preview',
  label: 'Answer canvas',
  caption: 'Cited answer routed into a personal interface',
  srcs: [
    '/verified-sources/econ3202/problem-set-02.png',
    '/verified-sources/econ3202/w8-a-concave-functions.png',
  ],
  artifactIds: ['econ-ps2', 'econ-slides', 'claude-certificate'],
}
```

- [ ] **Step 4: Run tests to verify the data contract passes**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected result: the new data contract passes and every referenced image exists under `public/`.

### Task 2: Homepage Picture-First Components

**Files:**
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Write the failing render test**

Add or update assertions that category cards render the media asset before long copy and keep filenames out of the first viewport category cards:

```ts
const categorySectionHtml = html.match(/<section class="vd-personal-categories"[\s\S]*?<\/section>/)?.[0] ?? '';

assert.match(categorySectionHtml, /vd-category-visual__media/);
assert.match(categorySectionHtml, /alt="Profile source"/);
assert.match(categorySectionHtml, /alt="Course shelves"/);
assert.match(categorySectionHtml, /alt="Project proof"/);
assert.match(categorySectionHtml, /Answer canvas/);
assert.doesNotMatch(categorySectionHtml, /Problem Set 02\.pdf/);
assert.doesNotMatch(categorySectionHtml, /W8 A Concave-Functions\.pdf/);
assert.doesNotMatch(categorySectionHtml, /UNSW, QuantNet, WQU, Claude Certificate/);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected result: fail because homepage category cards still render text-first markup.

- [ ] **Step 3: Implement visual helpers in the existing component**

Keep the helper functions inside `VerifiedDossierHome.tsx` for this pass. Import the category type:

```ts
import type { VerifiedDossierPresentationCategory } from '../../lib/new-loom/verified-dossier-home';
```

Add the visual renderer:

```tsx
function CategoryVisualAsset({ category }: { category: VerifiedDossierPresentationCategory }) {
  const asset = category.visualAsset;
  const assetPaths = asset.src ? [asset.src] : asset.srcs ?? [];

  return (
    <div className={`vd-category-visual vd-category-visual--${asset.kind}`} aria-label={asset.label}>
      <div className="vd-category-visual__media">
        {assetPaths.slice(0, 4).map((src) => (
          <img key={src} src={src} alt={asset.label} draggable={false} />
        ))}
      </div>
      <div className="vd-category-visual__caption">
        <strong>{asset.label}</strong>
        <span>{asset.caption}</span>
      </div>
    </div>
  );
}
```

Replace each category card body with the visual first:

```tsx
<a key={category.id} className="vd-personal-category-card" href={category.href}>
  <CategoryVisualAsset category={category} />
  <div className="vd-personal-category-card__body">
    <p>{category.proof}</p>
    <h2>{category.label}</h2>
    <span>{category.capabilities.slice(0, 2).join(' / ')}</span>
    <small>{formatCategoryEvidence(category.artifactIds.length, category.sourceSectionIds.length)}</small>
  </div>
</a>
```

- [ ] **Step 4: Run component tests**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx tests/home-client-first-paint.test.tsx
```

Expected result: render tests pass and the homepage markup contains the visual asset classes.

### Task 3: Picture-First Homepage CSS

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/loom-mature-platform-contract.test.tsx`
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Write CSS contract checks**

Add CSS assertions that protect stable media frames, compact body copy, and mobile wrapping:

```ts
assert.match(css, /\.vd-category-visual\s*{[\s\S]*aspect-ratio/);
assert.match(css, /\.vd-category-visual__media\s*{[\s\S]*grid-template-columns/);
assert.match(css, /\.vd-category-visual__media img\s*{[\s\S]*object-fit:\s*cover/);
assert.match(css, /\.vd-personal-category-card__body\s*{[\s\S]*grid-template-rows/);
assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.vd-category-visual/);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx tsx --test tests/loom-mature-platform-contract.test.tsx tests/loom-personal-positioning.test.tsx
```

Expected result: fail because the new CSS selectors are not present.

- [ ] **Step 3: Replace text-card CSS with media-card CSS**

Update the existing `.vd-personal-category-card` block and add these selectors:

```css
.vd-personal-category-card {
  display: grid;
  grid-template-rows: minmax(7.2rem, auto) minmax(0, 1fr);
  gap: 0.62rem;
  min-width: 0;
  min-height: clamp(13rem, 16vw, 15.4rem);
  padding: clamp(0.62rem, 1vw, 0.78rem);
}

.vd-category-visual {
  display: grid;
  gap: 0.46rem;
  min-width: 0;
  aspect-ratio: 1.58;
  padding: 0.48rem;
  border: 1px solid rgba(31, 58, 47, 0.13);
  border-radius: 7px;
  background: #f9fbf8;
}

.vd-category-visual__media {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem;
  min-height: 0;
}

.vd-category-visual__media img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(31, 58, 47, 0.1);
  border-radius: 6px;
  background: #ffffff;
  object-fit: cover;
  object-position: top center;
}

.vd-category-visual--profile-photo .vd-category-visual__media,
.vd-category-visual--document-preview .vd-category-visual__media {
  grid-template-columns: minmax(0, 1fr);
}

.vd-category-visual--logo-strip .vd-category-visual__media img {
  padding: 0.34rem;
  object-fit: contain;
}

.vd-category-visual__caption {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.vd-category-visual__caption strong,
.vd-category-visual__caption span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd-personal-category-card__body {
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 0.28rem;
  min-width: 0;
}
```

Remove the visible category summary paragraph from cards. Keep `summary` in data for section pages and future detail surfaces.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx tsx --test tests/loom-mature-platform-contract.test.tsx tests/loom-personal-positioning.test.tsx tests/home-client-first-paint.test.tsx
```

Expected result: tests pass and category cards are protected by media-frame CSS.

### Task 4: Browser Verification and File Hygiene

**Files:**
- Verify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Verify: `app/globals.css`
- Verify: `lib/new-loom/verified-dossier-home.ts`
- Verify: `tests/`
- Capture under: `archive/screenshots/verification-20260604/`

- [ ] **Step 1: Run all focused homepage tests**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx tests/loom-mature-platform-contract.test.tsx tests/loom-verified-dossier-home-contract.test.ts
```

Expected result: all focused homepage tests pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck -- --pretty false
```

Expected result: pass.

- [ ] **Step 3: Verify in the in-app Browser**

Open `http://localhost:3000/` in the in-app Browser and inspect:

- first viewport shows real images or UI assets in all four category modules
- category cards do not show long explanatory paragraphs
- Loom appears as the wordmark and compact trust layer
- mobile width has no horizontal overflow
- no category text is clipped in a way that hides the meaning

- [ ] **Step 4: Capture desktop and mobile QA screenshots inside Loom archive**

Use Playwright only for fixed-size verification output. Save to:

```text
archive/screenshots/verification-20260604/loom-home-picture-pass-desktop-20260604.png
archive/screenshots/verification-20260604/loom-home-picture-pass-mobile-20260604.png
```

Then inspect dimensions:

```ts
const metrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
```

Expected result: `scrollWidth === clientWidth` at `1200x1050` and `390x844`.

- [ ] **Step 5: Confirm root cleanup**

Run:

```bash
find /Users/yinyiping/Desktop/Private\ Wiki -maxdepth 1 -type f \( -iname 'loom*.png' -o -iname 'loom*.jpg' -o -iname 'loom*.jpeg' -o -iname 'loom*.md' -o -iname 'loom*.html' \) -print
```

Expected result: no output. QA screenshots stay under the ignored Loom archive folder.

- [ ] **Step 6: Commit only the picture-pass implementation files**

Stage exact files from this pass:

```bash
git add lib/new-loom/verified-dossier-home.ts components/verified-dossier/VerifiedDossierHome.tsx app/globals.css tests/loom-verified-dossier-home-contract.test.ts tests/loom-personal-positioning.test.tsx tests/loom-mature-platform-contract.test.tsx tests/home-client-first-paint.test.tsx
```

Check staged files:

```bash
git diff --cached --name-only
```

Expected staged set: only files touched by this picture asset pass. Do not stage unrelated dirty files already present in the checkout.
