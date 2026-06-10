# Loom Product System Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/loom` and `/product-history` from a history-led page into the deep Loom Product System page approved in `docs/archive/ai-build-log/specs/2026-06-05-loom-product-system-page-design.md`.

**Architecture:** Keep the existing route and CSS module. Replace the page's hierarchy with page-local product-system data arrays plus existing verified dossier assets. Preserve the personal-first homepage; `/loom` carries the deeper product explanation.

**Tech Stack:** Next.js App Router, React server component, CSS Modules, Node test runner with React static render and source-string contract tests.

---

## File Structure

- Modify `tests/loom-personal-positioning.test.tsx`
  - Add Product System contract assertions for `/loom` source.
  - Preserve existing homepage assertions that Home does not absorb product explanation.
- Modify `app/product-history/page.tsx`
  - Replace history-first copy with Product System framing.
  - Add page-local arrays for thesis, Library/Eyes/Memory, role split, growth loop, product layers, functional reuse, and updated evolution.
  - Continue using `VERIFIED_DOSSIER_TOP_NAV` and `resolveVerifiedDossierArtifact`.
- Modify `app/product-history/HistoryDossier.module.css`
  - Add layouts for system hero, thesis object, time structure, role split, source principle, growth loop, product layers, function ledger, and final evidence.
  - Keep responsive behavior simple; no nested cards.
- Optional cleanup after verification
  - Remove generated `.next-build/`, `public/pagefind/`, `tsconfig*.tsbuildinfo`, and `.loom-typecheck.tsconfig.json` if commands regenerate them.

## Task 1: Add Product System Contract Tests

**Files:**
- Modify: `tests/loom-personal-positioning.test.tsx`

- [ ] **Step 1: Add failing assertions to the product-history test**

In `test('visible support surfaces use approved personal-identity and local-app positioning', ...)`, replace the existing productHistory assertions beginning at:

```ts
  assert.match(productHistory, /Why Loom is called Loom/i);
```

through:

```ts
  assert.match(productHistory, /AI persona/i);
```

with:

```ts
  assert.match(productHistory, /Loom is a cognitive growth system/i);
  assert.match(productHistory, /source-backed thinking into personal growth/i);
  assert.match(productHistory, /Library \/ Eyes \/ Memory/i);
  assert.match(productHistory, /past material reaches the present/i);
  assert.match(productHistory, /present attention becomes judgment/i);
  assert.match(productHistory, /judged understanding reaches the future/i);
  assert.match(productHistory, /Human \/ System \/ AI/i);
  assert.match(productHistory, /attention, questions, judgment, and relation choices/i);
  assert.match(productHistory, /anchoring, organization, connection, and preservation/i);
  assert.match(productHistory, /AI accelerates inference/i);
  assert.match(productHistory, /Source is sacred/i);
  assert.match(productHistory, /Personal growth loop/i);
  assert.match(productHistory, /Source/);
  assert.match(productHistory, /Attention/);
  assert.match(productHistory, /Question/);
  assert.match(productHistory, /Judgment/);
  assert.match(productHistory, /Practice/);
  assert.match(productHistory, /Draft/);
  assert.match(productHistory, /Output/);
  assert.match(productHistory, /Identity/);
  assert.match(productHistory, /Next source/);
  assert.match(productHistory, /Five product layers/i);
  assert.match(productHistory, /Public identity surface/);
  assert.match(productHistory, /Evidence and source layer/);
  assert.match(productHistory, /Growth and capability layer/);
  assert.match(productHistory, /Cognitive structuring layer/);
  assert.match(productHistory, /AI and production layer/);
  assert.match(productHistory, /Functional reuse and innovation/i);
  assert.match(productHistory, /source shelf/);
  assert.match(productHistory, /citation-backed Digital Me answers/i);
  assert.match(productHistory, /process replay and output production/i);
  assert.match(productHistory, /Product evolution/i);
  assert.match(productHistory, /what was learned/i);
  assert.match(productHistory, /Real evidence assets/i);
```

Keep the existing history asset assertions:

```ts
  assert.match(productHistory, /\/loom\/history\/early-version\/01-reading-thinking-environment\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/02-name-mark-library-eyes-memory\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/05-weaver-vocabulary\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/08-paper-reading-source\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-17-wordmark-structure\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-24-frontispiece-vellum\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-02-profile-home\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-03-source-dossier\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-evidence-workbench\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-current-home\.png/);
```

Add these negative assertions near the end of the productHistory block:

```ts
  assert.doesNotMatch(productHistory, /generic SaaS landing page/i);
  assert.doesNotMatch(productHistory, /always-visible AI assistant/i);
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected: FAIL because the current page still contains `Why Loom is called Loom` and does not contain the new Product System strings.

- [ ] **Step 3: Commit RED test**

Run:

```bash
git add tests/loom-personal-positioning.test.tsx
git commit -m "test: specify Loom product system page"
```

Expected: commit contains only the test file.

## Task 2: Implement Product System Page Structure

**Files:**
- Modify: `app/product-history/page.tsx`

- [ ] **Step 1: Replace product-history page data with Product System data**

In `app/product-history/page.tsx`, keep these imports:

```ts
import { FileBadge } from '../../components/verified-dossier/FileBadge';
import {
  VERIFIED_DOSSIER_TOP_NAV,
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from '../../lib/new-loom/verified-dossier-home';
import styles from './HistoryDossier.module.css';
```

Remove imports from `personal-platform` unless still used.

Define these page-local constants after `FEATURED_SOURCE_IDS`:

```ts
const HERO_STATEMENT =
  'Loom is a cognitive growth system: source-backed thinking becomes personal growth, evidence, output, and Digital Me.';

const THESIS_POINTS = [
  'The person sees, compares, judges, and chooses.',
  'The system anchors, organizes, connects, and preserves.',
  'AI accelerates inference without replacing judgment.',
  'The lasting output is structured understanding, not a chat log.',
] as const;

const TIME_STRUCTURE = [
  {
    title: 'Library',
    text: 'Past material reaches the present through documents, courses, archives, and source files.',
  },
  {
    title: 'Eyes',
    text: 'Present attention becomes judgment through reading, comparison, question, and decision.',
  },
  {
    title: 'Memory',
    text: 'Judged understanding reaches the future as drafts, outputs, capability, and Digital Me.',
  },
] as const;

const ROLE_SPLIT = [
  {
    title: 'Human',
    text: 'Attention, questions, judgment, and relation choices remain with the person.',
  },
  {
    title: 'System',
    text: 'Anchoring, organization, connection, and preservation remove the burden of arranging thought.',
  },
  {
    title: 'AI',
    text: 'AI accelerates inference, explanation, draft assistance, and process replay without becoming the protagonist.',
  },
] as const;

const GROWTH_LOOP = [
  'Source',
  'Attention',
  'Question',
  'Judgment',
  'Practice',
  'Draft',
  'Output',
  'Identity',
  'Next source',
] as const;

const PRODUCT_LAYERS = [
  {
    title: 'Public identity surface',
    text: 'About, Education, Experience, and Digital Me introduce the person and point into deeper proof.',
  },
  {
    title: 'Evidence and source layer',
    text: 'Files, institution marks, document previews, source paths, dates, and citations make claims inspectable.',
  },
  {
    title: 'Growth and capability layer',
    text: 'Learning paths, projects, practice artifacts, and judgment changes show how capability forms over time.',
  },
  {
    title: 'Cognitive structuring layer',
    text: 'Source, anchor, judgment, relation, panel, weave, pattern, and Thought Map describe how understanding forms.',
  },
  {
    title: 'AI and production layer',
    text: 'Grounded answers, source retrieval, draft generation, process replay, and capability canvases turn evidence into output.',
  },
] as const;

const FUNCTION_REUSE = [
  {
    old: 'source shelf',
    current: 'Education and Experience evidence',
  },
  {
    old: 'anchors',
    current: 'citation-backed Digital Me answers',
  },
  {
    old: 'Ask AI on passages',
    current: 'grounded answer mode',
  },
  {
    old: 'Sources to Draft',
    current: 'process replay and output production',
  },
  {
    old: 'panel / weave / pattern',
    current: 'internal cognitive ontology',
  },
  {
    old: 'web capture and native importer',
    current: 'future source acquisition layer',
  },
  {
    old: 'command palette role split',
    current: 'long-term AI interaction architecture',
  },
] as const;
```

- [ ] **Step 2: Replace the rendered section order**

Replace the `<section className={styles.hero}>` through the current narrative section with this order:

```tsx
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.label}>Loom product system</p>
          <h1 id="history-title">Loom is a cognitive growth system.</h1>
          <p className={styles.lead}>{HERO_STATEMENT}</p>
          <div className={styles.thesisList}>
            {THESIS_POINTS.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </div>
        <figure className={styles.heroMedia}>
          <img
            src="/loom/history/early-version/02-name-mark-library-eyes-memory.jpg"
            alt="Early Loom wordmark blueprint showing Library, Eyes, and Memory"
          />
          <figcaption>Early Loom mark study, reinterpreted as product ontology</figcaption>
        </figure>
      </section>

      <section className={styles.timeStructure} aria-labelledby="time-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Library / Eyes / Memory</p>
          <h2 id="time-title">Knowledge moves through time.</h2>
        </header>
        <div className={styles.timeGrid}>
          {TIME_STRUCTURE.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.roleSplit} aria-labelledby="role-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Human / System / AI</p>
          <h2 id="role-title">The product keeps judgment human.</h2>
        </header>
        <div className={styles.roleGrid}>
          {ROLE_SPLIT.map((item) => (
            <article key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sourcePrinciple} aria-labelledby="source-sacred-title">
        <div>
          <p className={styles.label}>Source is sacred</p>
          <h2 id="source-sacred-title">The source stays foreground.</h2>
          <p>
            Notes, controls, and AI should appear when needed and recede when not
            needed. Source authority comes before system self-display.
          </p>
        </div>
        <div className={styles.sourcePlate}>
          {featuredSources.slice(0, 2).map((source) => (
            <a key={source.id} href={source.href}>
              <span>
                {source.thumbnailSrc ? <img src={source.thumbnailSrc} alt="" /> : source.kind.toUpperCase()}
              </span>
              <strong>{source.preview?.title ?? source.label}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.growthLoop} aria-labelledby="growth-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Personal growth loop</p>
          <h2 id="growth-title">A person changes through source-backed practice.</h2>
        </header>
        <ol className={styles.growthRail}>
          {GROWTH_LOOP.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
```

Then keep the existing early archive and evolution sections, but change the evolution header text to:

```tsx
          <p className={styles.label}>Product evolution</p>
          <h2 id="evolution-title">Old versions became product learning.</h2>
...
            Each stage records what was learned, what was kept, and what was changed.
```

After evolution, replace architecture/sources/narrative with:

```tsx
      <section className={styles.productLayers} aria-labelledby="layers-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Five product layers</p>
          <h2 id="layers-title">Not a showcase. A product system.</h2>
        </header>
        <div className={styles.layerRows}>
          {PRODUCT_LAYERS.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.functionReuse} aria-labelledby="function-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Functional reuse and innovation</p>
          <h2 id="function-title">Old concepts become current capabilities.</h2>
        </header>
        <div className={styles.functionRows}>
          {FUNCTION_REUSE.map((item) => (
            <article key={item.old}>
              <strong>{item.old}</strong>
              <span>{item.current}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sources} aria-labelledby="source-title">
        <header className={styles.sectionHeader}>
          <p className={styles.label}>Real evidence assets</p>
          <h2 id="source-title">The philosophy is attached to visible files.</h2>
        </header>
        <div className={styles.sourceRows}>
          {featuredSources.map((source) => (
            <a key={source.id} className={styles.sourceRow} href={source.href}>
              <span className={styles.sourceThumb}>
                {source.thumbnailSrc ? (
                  <img src={source.thumbnailSrc} alt={`${source.label} thumbnail`} />
                ) : (
                  <span>{source.kind.toUpperCase()}</span>
                )}
              </span>
              <span className={styles.sourceCopy}>
                <FileBadge kind={source.kind} label={source.label} compact />
                <strong>{source.preview?.title ?? source.label}</strong>
                <span>{source.sourcePath ?? source.preview?.metadata ?? source.role}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
```

- [ ] **Step 3: Run test to verify page strings pass or expose CSS-only failures**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected: Product System string assertions pass. Any failure should be due to old text still present or missing section text; fix `page.tsx` before CSS.

- [ ] **Step 4: Commit page structure**

Run:

```bash
git add app/product-history/page.tsx tests/loom-personal-positioning.test.tsx
git commit -m "feat: frame Loom as product system"
```

Expected: commit includes page structure and RED/GREEN test update.

## Task 3: Implement Product System Styling

**Files:**
- Modify: `app/product-history/HistoryDossier.module.css`

- [ ] **Step 1: Add CSS selectors for new sections**

In the grouped width rule, replace:

```css
.hero,
.origin,
.evolutionSection,
.ledgerSection,
.architecture,
.sources,
.narrative {
```

with:

```css
.hero,
.timeStructure,
.roleSplit,
.sourcePrinciple,
.growthLoop,
.evolutionSection,
.productLayers,
.functionReuse,
.sources {
```

Add new section styles after `.heroMedia figcaption`:

```css
.thesisList {
  display: grid;
  gap: 0.45rem;
  max-width: 46rem;
  padding-top: 0.4rem;
}

.thesisList span {
  display: block;
  padding-top: 0.55rem;
  border-top: 1px solid var(--history-border);
  color: var(--history-muted);
  font-size: 0.92rem;
  line-height: 1.38;
}

.timeStructure,
.roleSplit,
.sourcePrinciple,
.growthLoop,
.productLayers,
.functionReuse,
.sources {
  border-top: 1px solid var(--history-border);
}

.timeStructure,
.roleSplit,
.growthLoop,
.productLayers,
.functionReuse,
.sources {
  display: grid;
  grid-template-columns: minmax(17rem, 0.35fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  padding-top: clamp(2.3rem, 4vw, 4rem);
  padding-bottom: clamp(2.3rem, 4vw, 4rem);
}

.timeGrid,
.roleGrid,
.layerRows,
.functionRows,
.sourceRows {
  display: grid;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--history-border);
}

.timeGrid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.4rem);
  border-top: 0;
}

.timeGrid article,
.roleGrid article {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding-top: 0.9rem;
  border-top: 1px solid var(--history-border);
}

.timeGrid strong,
.roleGrid span,
.functionRows strong {
  color: var(--history-ink);
  font-family: var(--serif);
  font-size: clamp(1.08rem, 1.35vw, 1.25rem);
  line-height: 1.16;
}

.timeGrid p,
.roleGrid p,
.sourcePrinciple p,
.layerRows p {
  margin: 0;
  color: var(--history-muted);
  font-size: clamp(0.94rem, 1vw, 1.04rem);
  line-height: 1.52;
}

.roleGrid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.4rem);
  border-top: 0;
}

.sourcePrinciple {
  display: grid;
  grid-template-columns: minmax(17rem, 0.42fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  padding-top: clamp(2.8rem, 5vw, 5rem);
  padding-bottom: clamp(2.8rem, 5vw, 5rem);
  background: #f6f5ef;
}

.sourcePrinciple > div:first-child {
  display: grid;
  align-content: center;
  gap: 0.8rem;
}

.sourcePrinciple h2 {
  max-width: 14ch;
  margin: 0;
  color: var(--history-ink);
  font-family: var(--display);
  font-size: clamp(2.4rem, 5vw, 5.8rem);
  font-weight: 560;
  letter-spacing: 0;
  line-height: 0.92;
}

.sourcePlate {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.9rem, 2vw, 1.35rem);
}

.sourcePlate a {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.sourcePlate a > span {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid rgba(34, 50, 43, 0.18);
  background: #ffffff;
}

.sourcePlate img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.sourcePlate strong {
  color: var(--history-ink);
  font-family: var(--serif);
  font-size: 1.05rem;
  line-height: 1.18;
}

.growthRail {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 0;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--history-border);
  border-left: 1px solid var(--history-border);
}

.growthRail li {
  display: grid;
  align-content: space-between;
  min-height: clamp(8rem, 15vw, 13rem);
  padding: 0.82rem;
  border-right: 1px solid var(--history-border);
  border-bottom: 1px solid var(--history-border);
}

.growthRail span,
.layerRows article > span {
  color: var(--history-accent);
  font-size: 0.72rem;
  font-weight: 820;
  line-height: 1.25;
}

.growthRail strong {
  color: var(--history-ink);
  font-family: var(--serif);
  font-size: clamp(0.98rem, 1.2vw, 1.14rem);
  line-height: 1.12;
}

.layerRows article,
.functionRows article {
  display: grid;
  min-width: 0;
  border-bottom: 1px solid var(--history-border);
}

.layerRows article {
  grid-template-columns: 3.2rem minmax(12rem, 0.28fr) minmax(0, 1fr);
  gap: clamp(0.9rem, 2vw, 1.6rem);
  align-items: baseline;
  padding: 1.04rem 0;
}

.layerRows h3 {
  margin: 0;
  color: var(--history-ink);
  font-family: var(--serif);
  font-size: 1.08rem;
  line-height: 1.2;
}

.functionRows article {
  grid-template-columns: minmax(12rem, 0.3fr) minmax(0, 1fr);
  gap: clamp(0.9rem, 2vw, 1.6rem);
  align-items: baseline;
  padding: 1rem 0;
}

.functionRows span {
  color: var(--history-muted);
  font-size: 0.96rem;
  line-height: 1.4;
}
```

- [ ] **Step 2: Remove or leave unused old selectors safely**

Remove old `.origin`, `.originThreads`, `.ledgerSection`, `.ledger`, `.ledgerRow`, `.architecture`, `.architectureRows`, and `.narrative` selectors only if they are no longer referenced in `page.tsx`. Do not remove `.earlyArchive`, `.earlyHeader`, `.earlyGrid`, `.evolutionSection`, `.sourceRows`, `.sourceRow`, `.sourceThumb`, or `.sourceCopy`.

- [ ] **Step 3: Update responsive selector groups**

In the `@media (max-width: 980px)` block, replace old section names with:

```css
  .hero,
  .timeStructure,
  .roleSplit,
  .sourcePrinciple,
  .growthLoop,
  .productLayers,
  .functionReuse,
  .sources,
  .evolutionIntro {
    grid-template-columns: 1fr;
  }

  .timeGrid,
  .roleGrid,
  .sourcePlate,
  .growthRail {
    grid-template-columns: 1fr;
  }
```

In the `@media (max-width: 680px)` block, replace old section names with:

```css
  .hero,
  .timeStructure,
  .roleSplit,
  .sourcePrinciple,
  .growthLoop,
  .evolutionSection,
  .productLayers,
  .functionReuse,
  .sources,
  .earlyHeader,
  .earlyGrid {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .layerRows article,
  .functionRows article,
  .sourceRow {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 4: Run tests and CSS contract**

Run:

```bash
npx tsx --test tests/loom-personal-positioning.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit styling**

Run:

```bash
git add app/product-history/HistoryDossier.module.css
git commit -m "style: shape Loom product system page"
```

Expected: commit contains only CSS module changes.

## Task 4: Verify Page, Browser, And Cleanup

**Files:**
- No production edits expected unless verification exposes a specific defect.

- [ ] **Step 1: Run targeted test suite**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx tests/loom-asset-led-upgrade.test.tsx tests/loom-mature-platform-contract.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run diff check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Browser check `/loom`**

Open `http://localhost:3000/loom`.

Expected:

- first viewport says `Loom is a cognitive growth system.`
- nav still shows About, Education, Experience, Digital Me
- hero uses the early Library / Eyes / Memory visual
- sections appear in the planned order
- no obvious text overlap at desktop width

- [ ] **Step 4: Mobile browser check**

Resize to mobile width around 390px.

Expected:

- nav wraps without overflow
- growth loop stacks into one column
- source plate and evidence rows do not overflow
- long source paths wrap or truncate cleanly

- [ ] **Step 5: Clean generated output**

Run:

```bash
rm -rf .next-build public/pagefind .loom-typecheck.tsconfig.json tsconfig.tsbuildinfo
find . \( -path './.git' -o -path './node_modules' -o -path './.next' -o -path './archive/backups' \) -prune -o \( -name '.DS_Store' -o -name '*tsbuildinfo' -o -name '* 2.*' -o -name '* 3.*' -o -name '* 4.*' -o -name '* 5.*' -o -path './public/pagefind' -o -path './tmp' -o -path './.next-build' \) -print | sort
```

Expected: no output from the `find` command.

- [ ] **Step 6: Final commit if verification fixes were needed**

If Task 4 required fixes, commit them:

```bash
git add app/product-history/page.tsx app/product-history/HistoryDossier.module.css tests/loom-personal-positioning.test.tsx
git commit -m "fix: verify Loom product system page"
```

Expected: commit only if a verification edit was made.

## Spec Coverage Self-Review

- Opening Thesis: Task 2 hero and `HERO_STATEMENT`.
- Library / Eyes / Memory: Task 2 `TIME_STRUCTURE` and section.
- Human / System / AI: Task 2 `ROLE_SPLIT` and section.
- Source is sacred: Task 2 source principle section with verified assets.
- Personal Growth Loop: Task 2 `GROWTH_LOOP` and section.
- Five Product Layers: Task 2 `PRODUCT_LAYERS` and section.
- Functional Reuse And Innovation: Task 2 `FUNCTION_REUSE` and section.
- Product Evolution: Task 2 keeps evolution assets and changes framing.
- Real Evidence Assets: Task 2 final source section reuses verified dossier assets.
- Visual Direction: Task 3 CSS uses editorial rails, plates, rows, and restrained sections.
- Testing: Task 1 and Task 4 cover source contract, targeted tests, diff check, and browser checks.

## Plan Self-Review

- Placeholder scan: no TBD/TODO/fill-later placeholders.
- Scope check: one route and its tests/CSS only; homepage stays out of scope.
- Type consistency: constants referenced in Task 2 match JSX section names and Task 3 selectors.
- Risk: full `npm run typecheck` recently stalled at idle `tsc --noEmit`; this plan uses targeted tests and records typecheck isolation as separate work if it recurs.
