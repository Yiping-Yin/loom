# Loom Evidence Workbench Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Loom homepage from a source-card gallery into an evidence workbench that shows real sources becoming Draft output and cited answers.

**Architecture:** Keep `app/HomeClient.tsx` as the native-bridge client entry and keep `VerifiedDossierHome` as the page composer. Move the new workbench units into focused `components/verified-dossier/` files, add a small source-graph/workbench data contract in `lib/new-loom/verified-dossier-home.ts`, and update `app/globals.css` with `.vd-workbench-*` classes that replace the top `.vd-shelf-strip` as the first-viewport proof surface.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS in `app/globals.css`, Node test runner with `tsx`, static React render tests, production build via `npm run build`, isolated Playwright screenshot audit if Browser/IAB remains profile-locked.

---

## Scope

This plan implements the approved spec:

`docs/superpowers/specs/2026-06-03-loom-evidence-workbench-homepage-design.md`

Included:

- headline becomes `Sources become cited work`
- label becomes `Verified source workspace`
- UNSW / ECON3202 becomes the active evidence story
- source graph appears beside the active story
- `Sources -> Draft -> Answer` chain is extracted and tightened
- right panel visible title becomes `Answer inspector`
- lower `Source index` stays compact
- mobile order presents evidence before identity/sidebar content
- real About / UNSW / QuantNet / WQU / Claude assets remain visible

Excluded:

- live provider-output acceptance
- installed-app importer acceptance
- new backend data sources
- generated image concept assets
- full redesign of downstream category pages
- `Recent Drafts` section

## File Structure

- Modify `lib/new-loom/verified-dossier-home.ts`
  - Update home copy to the approved workbench framing.
  - Add `VERIFIED_DOSSIER_WORKBENCH` with active story, source graph, and provenance step data.

- Create `components/verified-dossier/EvidenceWorkbench.tsx`
  - Exports `ActiveEvidenceStory`, `SourceGraph`, `ProvenanceChain`, and `SourceIndex`.
  - Reuses `DocumentPreviewCard`, `FileBadge`, `InstitutionMark`, and `resolveVerifiedDossierArtifact`.

- Create `components/verified-dossier/AnswerInspector.tsx`
  - Exports `AnswerInspector`.
  - Reuses `ArtifactCitationCard`.
  - Keeps citation registry behavior as an inspector footer.

- Modify `components/verified-dossier/VerifiedDossierHome.tsx`
  - Compose the new workbench components.
  - Remove top `FIRST_VIEWPORT_SHELVES` rendering from the first viewport.
  - Keep the left identity rail, nav, activity, and native action handlers.

- Modify `app/globals.css`
  - Add `.vd-workbench-*`, `.vd-active-story-*`, `.vd-source-graph-*`, `.vd-answer-inspector-*`.
  - Keep `.vd-area-*` source index styles but tune mobile order.
  - Leave existing `.vd-shelf-*` styles until no component references them; then remove only if the final grep confirms they are unused.

- Modify tests:
  - `tests/loom-verified-dossier-home-contract.test.ts`
  - `tests/home-client-first-paint.test.tsx`
  - `tests/verified-dossier-components.test.tsx`

## Task 1: Update Workbench Data Contract

**Files:**
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`
- Modify: `lib/new-loom/verified-dossier-home.ts`

- [ ] **Step 1: Write failing workbench contract assertions**

In `tests/loom-verified-dossier-home-contract.test.ts`, update the first test and import `VERIFIED_DOSSIER_WORKBENCH`.

Replace the current import block with this block:

```ts
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_ARTIFACTS_BY_ID,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
  VERIFIED_DOSSIER_WORKBENCH,
  resolveVerifiedDossierArtifact,
} from '../lib/new-loom/verified-dossier-home';
```

Replace `verified dossier home data preserves approved product definition` with:

```ts
test('verified dossier home data preserves approved evidence workbench definition', () => {
  assert.equal(VERIFIED_DOSSIER_HOME_COPY.headline, 'Sources become cited work');
  assert.equal(VERIFIED_DOSSIER_HOME_COPY.body, 'Verified source workspace');
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    /Sources stay inspectable\. Draft turns them into cited answers\./,
  );
  assert.equal(VERIFIED_DOSSIER_WORKBENCH.activeSectionId, 'unsw');
  assert.deepEqual(
    VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds,
    ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_WORKBENCH.provenanceSteps.map((step) => step.title),
    ['Sources', 'Draft', 'Answer'],
  );
  assert.ok(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes.length >= 4);
  assert.ok(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.edges.length >= 3);
});
```

Add this test after `verified dossier sections and AI citations resolve to known artifacts`:

```ts
test('verified dossier workbench graph binds relationships to real artifact ids', () => {
  const artifactIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));

  for (const artifactId of VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds) {
    assert.ok(artifactIds.has(artifactId), `active story references missing artifact ${artifactId}`);
  }

  for (const node of VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes) {
    if (node.artifactId) {
      assert.ok(artifactIds.has(node.artifactId), `graph node references missing artifact ${node.artifactId}`);
    }
  }

  const nodeIds = new Set(VERIFIED_DOSSIER_WORKBENCH.sourceGraph.nodes.map((node) => node.id));
  for (const edge of VERIFIED_DOSSIER_WORKBENCH.sourceGraph.edges) {
    assert.ok(nodeIds.has(edge.from), `graph edge references missing from-node ${edge.from}`);
    assert.ok(nodeIds.has(edge.to), `graph edge references missing to-node ${edge.to}`);
  }
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: FAIL with an export error for `VERIFIED_DOSSIER_WORKBENCH`, or FAIL because the current headline is `Source Dossier`.

- [ ] **Step 3: Add workbench types and data**

In `lib/new-loom/verified-dossier-home.ts`, add these types after `VerifiedDossierAiPrompt`:

```ts
export type VerifiedDossierWorkbenchStep = {
  number: string;
  title: 'Sources' | 'Draft' | 'Answer';
  summary: string;
  detail: string;
};

export type VerifiedDossierGraphNode = {
  id: string;
  label: string;
  eyebrow: string;
  kind: 'source' | 'draft' | 'answer';
  artifactId?: VerifiedDossierArtifactId;
};

export type VerifiedDossierGraphEdge = {
  from: string;
  to: string;
  label: string;
};

export type VerifiedDossierWorkbench = {
  activeSectionId: 'unsw';
  activeArtifactIds: readonly VerifiedDossierArtifactId[];
  sourceGraph: {
    nodes: readonly VerifiedDossierGraphNode[];
    edges: readonly VerifiedDossierGraphEdge[];
  };
  provenanceSteps: readonly VerifiedDossierWorkbenchStep[];
};
```

Change `VERIFIED_DOSSIER_HOME_COPY` to:

```ts
export const VERIFIED_DOSSIER_HOME_COPY = {
  headline: 'Sources become cited work',
  body: 'Verified source workspace',
  shortDefinition: 'Sources stay inspectable. Draft turns them into cited answers.',
};
```

Add this export after `VERIFIED_DOSSIER_AI_PROMPT`:

```ts
export const VERIFIED_DOSSIER_WORKBENCH = {
  activeSectionId: 'unsw',
  activeArtifactIds: ['econ-ps2', 'econ-slides', 'econ-tutorial', 'econ-notes'],
  sourceGraph: {
    nodes: [
      {
        id: 'problem-set-source',
        label: 'Problem Set 02.pdf',
        eyebrow: 'Source PDF',
        kind: 'source',
        artifactId: 'econ-ps2',
      },
      {
        id: 'lecture-source',
        label: 'W8 A Concave-Functions.pdf',
        eyebrow: 'Lecture source',
        kind: 'source',
        artifactId: 'econ-slides',
      },
      {
        id: 'draft-summary',
        label: 'Concavity and optimisation summary.md',
        eyebrow: 'Draft',
        kind: 'draft',
      },
      {
        id: 'grounded-answer',
        label: 'Grounded explanation',
        eyebrow: 'Answer',
        kind: 'answer',
        artifactId: 'econ-notes',
      },
    ],
    edges: [
      { from: 'problem-set-source', to: 'draft-summary', label: 'Problem context' },
      { from: 'lecture-source', to: 'draft-summary', label: 'Concept source' },
      { from: 'draft-summary', to: 'grounded-answer', label: 'Cited output' },
    ],
  },
  provenanceSteps: [
    {
      number: '01',
      title: 'Sources',
      summary: '4 ECON3202 files',
      detail: 'Course materials, weekly PDFs, exercises, and problem-set work.',
    },
    {
      number: '02',
      title: 'Draft',
      summary: 'Concavity and optimisation summary.md',
      detail: 'A working note created from lecture, exercise, and answer evidence.',
    },
    {
      number: '03',
      title: 'Answer',
      summary: 'Grounded explanation',
      detail: 'Cited back to source artifacts people can inspect from this shelf.',
    },
  ],
} as const satisfies VerifiedDossierWorkbench;
```

- [ ] **Step 4: Run the contract test and verify it passes**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts
```

Expected: PASS for all tests in this file.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add lib/new-loom/verified-dossier-home.ts tests/loom-verified-dossier-home-contract.test.ts
git commit -m "Add Loom evidence workbench data contract"
```

Expected: commit includes only the data contract and its test.

## Task 2: Add Evidence Workbench Component Tests

**Files:**
- Modify: `tests/verified-dossier-components.test.tsx`
- Create: `components/verified-dossier/EvidenceWorkbench.tsx`
- Create: `components/verified-dossier/AnswerInspector.tsx`

- [ ] **Step 1: Write failing component tests**

In `tests/verified-dossier-components.test.tsx`, add these imports:

```ts
import { AnswerInspector } from '../components/verified-dossier/AnswerInspector';
import {
  ActiveEvidenceStory,
  ProvenanceChain,
  SourceGraph,
  SourceIndex,
} from '../components/verified-dossier/EvidenceWorkbench';
import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_WORKBENCH,
} from '../lib/new-loom/verified-dossier-home';
```

Add these tests after `ArtifactCitationCard keeps cited source thumbnails visible`:

```ts
test('ActiveEvidenceStory renders the UNSW workbench proof case', () => {
  const unswSection = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');
  assert.ok(unswSection, 'UNSW section should exist');

  const html = render(
    <ActiveEvidenceStory
      section={unswSection}
      artifactIds={VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds}
    />,
  );

  assert.match(html, /vd-active-story/);
  assert.match(html, /Active evidence story/);
  assert.match(html, /UNSW \/ ECON3202/);
  assert.match(html, /4 files/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /W8 C Suggested Exercises\.pdf/);
  assert.match(html, /Problem2\.pdf/);
});

test('SourceGraph renders semantic source relationships from real artifacts', () => {
  const html = render(<SourceGraph graph={VERIFIED_DOSSIER_WORKBENCH.sourceGraph} />);

  assert.match(html, /vd-source-graph/);
  assert.match(html, /aria-label="Source relationship graph"/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /W8 A Concave-Functions\.pdf/);
  assert.match(html, /Concavity and optimisation summary\.md/);
  assert.match(html, /Grounded explanation/);
  assert.match(html, /Problem context/);
  assert.match(html, /Concept source/);
  assert.match(html, /Cited output/);
});

test('ProvenanceChain renders Sources to Draft to Answer as the product explanation', () => {
  const html = render(<ProvenanceChain steps={VERIFIED_DOSSIER_WORKBENCH.provenanceSteps} />);

  assert.match(html, /vd-provenance-chain/);
  assert.match(html, /Sources/);
  assert.match(html, /Draft/);
  assert.match(html, /Answer/);
  assert.match(html, /4 ECON3202 files/);
  assert.match(html, /Concavity and optimisation summary\.md/);
  assert.match(html, /Grounded explanation/);
});

test('AnswerInspector is citation-first and no longer titled as a chatbot', () => {
  const html = render(
    <AnswerInspector
      prompt={VERIFIED_DOSSIER_AI_PROMPT}
      citationRegistryCount={12}
      citationRegistryLabels={['UNSW', 'Quantnet', 'Claude']}
    />,
  );

  assert.match(html, /vd-answer-inspector/);
  assert.match(html, />Answer inspector</);
  assert.match(html, />Grounded</);
  assert.match(html, /Cited sources/);
  assert.match(html, /Problem Set 02\.pdf/);
  assert.match(html, /12 registry sources available/);
  assert.doesNotMatch(html, />Ask this profile</);
});

test('SourceIndex keeps secondary shelves compact and excludes the active UNSW story', () => {
  const html = render(<SourceIndex sections={VERIFIED_DOSSIER_SECTIONS.filter((section) => section.id !== 'unsw')} />);

  assert.match(html, /vd-source-index/);
  assert.match(html, /Source index/);
  assert.match(html, /About/);
  assert.match(html, /Quantnet/);
  assert.match(html, /WQU/);
  assert.match(html, /Claude/);
  assert.doesNotMatch(html, /UNSW \/ ECON3202/);
});
```

- [ ] **Step 2: Run component tests and verify they fail**

Run:

```bash
npx tsx --test tests/verified-dossier-components.test.tsx
```

Expected: FAIL because `EvidenceWorkbench.tsx` and `AnswerInspector.tsx` do not exist.

- [ ] **Step 3: Create `EvidenceWorkbench.tsx`**

Create `components/verified-dossier/EvidenceWorkbench.tsx`:

```tsx
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
  type VerifiedDossierGraphEdge,
  type VerifiedDossierGraphNode,
  type VerifiedDossierSection,
  type VerifiedDossierWorkbenchStep,
} from '../../lib/new-loom/verified-dossier-home';
import { DocumentPreviewCard } from './DocumentPreviewCard';
import { FileBadge } from './FileBadge';
import { InstitutionMark } from './InstitutionMark';

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepArrow() {
  return (
    <svg width="31" height="20" viewBox="0 0 31 20" fill="none" aria-hidden="true">
      <path d="M1 10h25M20 4l6 6-6 6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function ActiveEvidenceStory({
  section,
  artifactIds,
}: {
  section: VerifiedDossierSection;
  artifactIds: readonly VerifiedDossierArtifactId[];
}) {
  const artifacts = artifactIds.map(resolveVerifiedDossierArtifact);
  const featuredArtifacts = artifacts.slice(0, 2);
  const supportArtifacts = artifacts.slice(2);

  return (
    <article className="vd-active-story" aria-labelledby="active-evidence-story-title">
      <div className="vd-active-story__header">
        <InstitutionMark kind={section.id} />
        <span>
          <small>Active evidence story</small>
          <h2 id="active-evidence-story-title">{section.label}</h2>
        </span>
        <strong>{artifacts.length} files</strong>
      </div>
      <div className="vd-active-story__featured">
        {featuredArtifacts.map((artifact) => (
          <DocumentPreviewCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
      <div className="vd-active-story__support">
        {supportArtifacts.map((artifact) => (
          <a key={artifact.id} className="vd-active-story__support-row" href={artifact.href}>
            <FileBadge kind={artifact.kind} label={artifact.label} compact />
            <span>{artifact.role}</span>
          </a>
        ))}
      </div>
      <a className="vd-active-story__link" href={section.href}>
        Open UNSW shelf <ArrowIcon />
      </a>
    </article>
  );
}

export function SourceGraph({
  graph,
}: {
  graph: {
    nodes: readonly VerifiedDossierGraphNode[];
    edges: readonly VerifiedDossierGraphEdge[];
  };
}) {
  return (
    <section className="vd-source-graph" aria-label="Source relationship graph">
      <div className="vd-source-graph__header">
        <span>Source graph</span>
        <strong>{graph.nodes.length} nodes</strong>
      </div>
      <div className="vd-source-graph__canvas">
        {graph.nodes.map((node) => (
          <article key={node.id} className={`vd-source-graph__node vd-source-graph__node--${node.kind}`}>
            <small>{node.eyebrow}</small>
            <strong>{node.label}</strong>
          </article>
        ))}
      </div>
      <div className="vd-source-graph__edges">
        {graph.edges.map((edge) => (
          <span key={`${edge.from}-${edge.to}`}>
            {edge.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ProvenanceChain({ steps }: { steps: readonly VerifiedDossierWorkbenchStep[] }) {
  return (
    <section className="vd-provenance-section" aria-labelledby="provenance-title">
      <h2 id="provenance-title">Sources <span>→</span> Draft <span>→</span> Answer</h2>
      <div className="vd-provenance-chain" aria-label="Sources to Draft to Answer chain">
        {steps.map((step, index) => (
          <div key={step.number} className="vd-provenance-chain__item">
            <article className="vd-provenance-step">
              <span className="vd-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <strong>{step.summary}</strong>
              <p>{step.detail}</p>
            </article>
            {index < steps.length - 1 ? <StepArrow /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourceIndex({ sections }: { sections: readonly VerifiedDossierSection[] }) {
  return (
    <section className="vd-source-index" aria-labelledby="source-index-title">
      <h2 id="source-index-title">Source index</h2>
      <div className="vd-source-index__grid">
        {sections.map((section) => {
          const sectionArtifacts = section.artifactIds.map(resolveVerifiedDossierArtifact);
          const thumbnailArtifact = sectionArtifacts.find((artifact) => artifact.thumbnailSrc);

          return (
            <a key={section.id} className="vd-source-index__card" href={section.href}>
              <InstitutionMark kind={section.id} />
              <span>
                <strong>{section.label}</strong>
                <small>{section.status}</small>
              </span>
              {thumbnailArtifact?.thumbnailSrc ? (
                <img src={thumbnailArtifact.thumbnailSrc} alt="" draggable={false} />
              ) : null}
              <span className="vd-source-index__files">
                {sectionArtifacts.map((artifact) => (
                  <FileBadge key={artifact.id} kind={artifact.kind} label={artifact.label} compact />
                ))}
              </span>
              <ArrowIcon />
            </a>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `AnswerInspector.tsx`**

Create `components/verified-dossier/AnswerInspector.tsx`:

```tsx
import {
  resolveVerifiedDossierArtifact,
  type VerifiedDossierAiPrompt,
} from '../../lib/new-loom/verified-dossier-home';
import { ArtifactCitationCard } from './DocumentPreviewCard';

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AnswerInspector({
  prompt,
  citationRegistryCount,
  citationRegistryLabels,
}: {
  prompt: VerifiedDossierAiPrompt;
  citationRegistryCount: number;
  citationRegistryLabels: readonly string[];
}) {
  return (
    <section className="vd-answer-inspector" aria-labelledby="answer-inspector-title">
      <div className="vd-answer-inspector__header">
        <h2 id="answer-inspector-title">Answer inspector</h2>
        <span>Grounded</span>
      </div>
      <div className="vd-question-card">
        <strong>{prompt.question}</strong>
      </div>
      <div className="vd-answer-block">
        <h3>Answer</h3>
        <p>{prompt.answer}</p>
      </div>
      <h3 className="vd-citation-heading">Cited sources</h3>
      <div className="vd-citation-list" aria-label="Cited artifacts">
        {prompt.citations.map((artifactId) => {
          const artifact = resolveVerifiedDossierArtifact(artifactId);
          return <ArtifactCitationCard key={artifact.id} artifact={artifact} />;
        })}
      </div>
      <div className="vd-citation-registry" aria-label="Reference citation registry">
        <span>Citation registry</span>
        <strong>{citationRegistryCount} registry sources available</strong>
        <small>
          {citationRegistryLabels.length > 0
            ? citationRegistryLabels.join(' / ')
            : 'Waiting for registry'}
        </small>
      </div>
      <label className="vd-followup">
        <input type="text" placeholder="Ask a follow-up..." aria-label="Ask a follow-up" />
        <button type="button" aria-label="Send follow-up">
          <ArrowIcon />
        </button>
      </label>
    </section>
  );
}
```

- [ ] **Step 5: Run component tests and verify they pass**

Run:

```bash
npx tsx --test tests/verified-dossier-components.test.tsx
```

Expected: PASS for all component tests.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add components/verified-dossier/EvidenceWorkbench.tsx components/verified-dossier/AnswerInspector.tsx tests/verified-dossier-components.test.tsx
git commit -m "Add Loom evidence workbench components"
```

Expected: commit includes only new component files and component tests.

## Task 3: Integrate Workbench Components Into Home

**Files:**
- Modify: `components/verified-dossier/VerifiedDossierHome.tsx`
- Modify: `tests/home-client-first-paint.test.tsx`

- [ ] **Step 1: Update first-paint test expectations**

In `tests/home-client-first-paint.test.tsx`:

Replace:

```ts
  assert.match(text, /Verified sources/);
  assert.match(text, /Source Dossier/);
```

With:

```ts
  assert.match(text, /Verified source workspace/);
  assert.match(text, /Sources become cited work/);
```

In the label array, replace:

```ts
    'Source Dossier',
    'Ask this profile',
    'Verified sources',
```

With:

```ts
    'Sources become cited work',
    'Answer inspector',
    'Verified source workspace',
    'Active evidence story',
    'Source graph',
```

Replace:

```ts
  assert.equal(text.match(/Ask this profile/g)?.length ?? 0, 1);
  assert.match(html, /class="vd-home/);
  assert.match(html, /class="vd-shelf-strip"/);
```

With:

```ts
  assert.equal(text.match(/Answer inspector/g)?.length ?? 0, 1);
  assert.match(html, /class="vd-home/);
  assert.match(html, /class="vd-workbench-grid"/);
  assert.match(html, /class="vd-active-story/);
  assert.match(html, /class="vd-source-graph/);
  assert.doesNotMatch(text, /Source Dossier/);
  assert.doesNotMatch(text, /Ask this profile/);
```

- [ ] **Step 2: Run first-paint test and verify it fails**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx
```

Expected: FAIL because the current home still renders `Source Dossier`, `Ask this profile`, and `.vd-shelf-strip`.

- [ ] **Step 3: Replace top source board with workbench components**

In `components/verified-dossier/VerifiedDossierHome.tsx`, add imports:

```ts
import { AnswerInspector } from './AnswerInspector';
import {
  ActiveEvidenceStory,
  ProvenanceChain,
  SourceGraph,
  SourceIndex,
} from './EvidenceWorkbench';
```

Add `VERIFIED_DOSSIER_WORKBENCH` to the existing data import:

```ts
  VERIFIED_DOSSIER_WORKBENCH,
```

Remove these constants:

```ts
const FEATURED_UNSW_ARTIFACTS: VerifiedDossierArtifactId[] = [
  'econ-ps2',
  'econ-slides',
  'econ-tutorial',
  'econ-notes',
];

const FIRST_VIEWPORT_SHELVES = VERIFIED_DOSSIER_SECTIONS;
```

Keep:

```ts
const FEATURED_UNSW_SECTION = VERIFIED_DOSSIER_SECTIONS.find((section) => section.id === 'unsw');
const KNOWLEDGE_AREA_SECTIONS = VERIFIED_DOSSIER_SECTIONS.filter((section) => section.id !== 'unsw');
```

Delete local `AnswerIcon`, `ShieldIcon`, and `StepArrow` functions if no code references them after the replacement.

Replace the `<div className="vd-shelf-strip" ...>` block and the following `.vd-document-grid--featured` block with:

```tsx
            <div className="vd-workbench-grid">
              {FEATURED_UNSW_SECTION ? (
                <ActiveEvidenceStory
                  section={FEATURED_UNSW_SECTION}
                  artifactIds={VERIFIED_DOSSIER_WORKBENCH.activeArtifactIds}
                />
              ) : null}
              <SourceGraph graph={VERIFIED_DOSSIER_WORKBENCH.sourceGraph} />
            </div>
```

Replace the inline provenance section with:

```tsx
            <ProvenanceChain steps={VERIFIED_DOSSIER_WORKBENCH.provenanceSteps} />
```

Delete the `.vd-evidence-quality` block from first viewport. The workbench graph and inspector carry the proof; keeping that extra banner adds explanatory repetition.

Replace the lower source index section:

```tsx
          <section className="vd-areas" aria-labelledby="source-index-title">
            ...
          </section>
```

With:

```tsx
          <SourceIndex sections={KNOWLEDGE_AREA_SECTIONS} />
```

Replace the right inspector `<section className="vd-inspector-card">...</section>` with:

```tsx
          <AnswerInspector
            prompt={VERIFIED_DOSSIER_AI_PROMPT}
            citationRegistryCount={citationCandidates.length}
            citationRegistryLabels={citationRegistryLabels}
          />
```

Keep the surrounding:

```tsx
        <aside id="ask-this-profile" className="vd-inspector" aria-label="Answer inspector">
```

- [ ] **Step 4: Run first-paint test and component test**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/verified-dossier-components.test.tsx
```

Expected: PASS for both files.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add components/verified-dossier/VerifiedDossierHome.tsx tests/home-client-first-paint.test.tsx
git commit -m "Integrate Loom evidence workbench homepage"
```

Expected: commit includes Home integration and first-paint test updates.

## Task 4: Add Evidence Workbench CSS And Mobile Order

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add workbench layout CSS**

In `app/globals.css`, add this block after `.vd-hero-link:hover, .vd-text-link:hover`:

```css
.vd-workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(16rem, 0.92fr);
  gap: 0.95rem;
  align-items: stretch;
}

.vd-active-story,
.vd-source-graph,
.vd-answer-inspector,
.vd-source-index__card {
  border: 1px solid var(--vd-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 1px 0 rgba(18, 22, 21, 0.03);
}

.vd-active-story {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 0.78rem;
  min-width: 0;
  padding: 0.82rem;
}

.vd-active-story__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.72rem;
}

.vd-active-story__header small,
.vd-source-graph__header span {
  display: block;
  color: var(--vd-subtle);
  font-size: 0.66rem;
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1.15;
  text-transform: uppercase;
}

.vd-active-story__header h2 {
  margin: 0.16rem 0 0;
  font-family: var(--serif);
  font-size: 1.22rem;
  font-weight: 560;
  line-height: 1.16;
}

.vd-active-story__header > strong,
.vd-source-graph__header strong {
  color: var(--vd-accent);
  font-size: 0.72rem;
  font-weight: 760;
  line-height: 1.15;
  white-space: nowrap;
}

.vd-active-story__featured {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.72rem;
  min-width: 0;
}

.vd-active-story__support {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.vd-active-story__support-row,
.vd-active-story__link {
  color: inherit;
  text-decoration: none;
}

.vd-active-story__support-row {
  display: grid;
  gap: 0.38rem;
  min-width: 0;
  padding: 0.52rem;
  border: 1px solid var(--vd-border);
  border-radius: 7px;
  background: #ffffff;
}

.vd-active-story__support-row > span:last-child {
  overflow: hidden;
  color: var(--vd-muted);
  font-size: 0.7rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd-active-story__link {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 0.42rem;
  color: var(--vd-accent);
  font-size: 0.78rem;
  font-weight: 720;
}

.vd-source-graph {
  display: grid;
  grid-template-rows: auto minmax(13rem, 1fr) auto;
  gap: 0.72rem;
  min-width: 0;
  padding: 0.82rem;
}

.vd-source-graph__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.vd-source-graph__canvas {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(5.8rem, 1fr));
  gap: 0.72rem;
  min-height: 13rem;
  padding: 0.72rem;
  overflow: hidden;
  border: 1px solid var(--vd-border);
  border-radius: 7px;
  background:
    radial-gradient(circle at 48% 45%, rgba(21, 81, 63, 0.09), transparent 54%),
    #fbfcfa;
}

.vd-source-graph__canvas::before,
.vd-source-graph__canvas::after {
  content: "";
  position: absolute;
  left: 24%;
  right: 24%;
  height: 1px;
  background: rgba(101, 112, 106, 0.36);
  transform-origin: center;
}

.vd-source-graph__canvas::before {
  top: 42%;
  transform: rotate(22deg);
}

.vd-source-graph__canvas::after {
  top: 58%;
  transform: rotate(-18deg);
}

.vd-source-graph__node {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.62rem;
  border: 1px solid var(--vd-border);
  border-radius: 7px;
  background: #ffffff;
}

.vd-source-graph__node--draft {
  border-color: rgba(21, 81, 63, 0.34);
  background: var(--vd-accent-soft);
}

.vd-source-graph__node--answer {
  border-color: rgba(21, 81, 63, 0.42);
}

.vd-source-graph__node small {
  color: var(--vd-subtle);
  font-size: 0.58rem;
  font-weight: 760;
  line-height: 1.1;
  text-transform: uppercase;
}

.vd-source-graph__node strong {
  overflow: hidden;
  font-size: 0.76rem;
  line-height: 1.18;
  text-overflow: ellipsis;
}

.vd-source-graph__edges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.vd-source-graph__edges span {
  padding: 0.22rem 0.38rem;
  border: 1px solid var(--vd-border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--vd-muted);
  font-size: 0.62rem;
  line-height: 1.1;
}
```

- [ ] **Step 2: Add answer inspector CSS**

Add this block before the existing `.vd-question-card` rule:

```css
.vd-answer-inspector {
  display: grid;
  gap: 1rem;
  padding: 1.35rem;
}

.vd-inspector .vd-answer-inspector {
  position: sticky;
  top: 5.6rem;
  max-height: calc(100vh - 6.4rem);
  overflow-y: auto;
}

.vd-answer-inspector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.vd-answer-inspector__header h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.32rem;
  font-weight: 560;
  line-height: 1.2;
}

.vd-answer-inspector__header span {
  padding: 0.22rem 0.46rem;
  border: 1px solid rgba(21, 81, 63, 0.24);
  border-radius: 6px;
  background: var(--vd-accent-soft);
  color: var(--vd-accent);
  font-size: 0.68rem;
  font-weight: 720;
}
```

If `.vd-inspector-card` is no longer referenced by grep after Task 3, remove the `.vd-inspector-card`, `.vd-inspector .vd-inspector-card`, and `.vd-inspector-card__header*` blocks. If grep still finds references outside this homepage, keep them.

- [ ] **Step 3: Add compact source index CSS**

Add this block near the current `.vd-areas` styles:

```css
.vd-source-index {
  display: grid;
  gap: 0.95rem;
  margin-top: clamp(1.4rem, 2.2vw, 2rem);
  padding-top: 1rem;
  border-top: 1px solid var(--vd-border);
}

.vd-source-index h2 {
  margin: 0;
  color: var(--vd-ink);
  font-family: var(--serif);
  font-size: 1.22rem;
  font-weight: 560;
  line-height: 1.25;
}

.vd-source-index__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.82rem;
}

.vd-source-index__card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(4.4rem, 5.4rem) auto;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  min-height: 6.6rem;
  padding: 0.78rem;
  color: inherit;
  text-decoration: none;
}

.vd-source-index__card > span:first-of-type {
  min-width: 0;
}

.vd-source-index__card strong,
.vd-source-index__card small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vd-source-index__card strong {
  font-size: 0.92rem;
  line-height: 1.2;
}

.vd-source-index__card small {
  margin-top: 0.22rem;
  color: var(--vd-muted);
  font-size: 0.72rem;
  line-height: 1.2;
}

.vd-source-index__card > img {
  width: 100%;
  height: 4.1rem;
  overflow: hidden;
  border: 1px solid var(--vd-border);
  border-radius: 7px;
  background: #ffffff;
  object-fit: cover;
  object-position: top center;
}

.vd-source-index__files {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}
```

After adding this, grep for `.vd-areas` and `.vd-area-`. If no JSX references remain, remove the `.vd-areas`, `.vd-area-grid`, `.vd-area-card`, `.vd-area-card__thumbs`, and `.vd-area-card__files` CSS blocks.

- [ ] **Step 4: Add mobile workbench order**

Inside `@media (max-width: 760px)`, add:

```css
  .vd-main {
    display: grid;
  }

  .vd-workbench-grid {
    grid-template-columns: 1fr;
  }

  .vd-active-story__featured,
  .vd-active-story__support,
  .vd-source-index__grid {
    grid-template-columns: 1fr;
  }

  .vd-source-graph {
    grid-template-rows: auto auto auto;
  }

  .vd-source-graph__canvas {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    min-height: 0;
  }

  .vd-source-graph__canvas::before,
  .vd-source-graph__canvas::after {
    display: none;
  }

  .vd-source-index__card {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .vd-source-index__card > img {
    grid-column: 1 / -1;
    height: 5.8rem;
  }

  .vd-inspector .vd-answer-inspector {
    position: static;
    max-height: none;
  }
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-verified-dossier-home-contract.test.ts tests/verified-dossier-components.test.tsx
npm run typecheck
```

Expected: all tests PASS and typecheck exits with code 0.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add app/globals.css
git commit -m "Style Loom evidence workbench homepage"
```

Expected: commit includes only CSS changes.

## Task 5: Run Full Verification And Capture Final Screenshots

**Files:**
- Modify only if a test reveals a defect in the files from Tasks 1-4.
- Screenshot output: `archive/screenshots/home-redesign-20260603/`

- [ ] **Step 1: Run focused homepage verification**

Run:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/loom-personal-positioning.test.tsx tests/loom-mature-platform-contract.test.tsx tests/loom-verified-dossier-home-contract.test.ts tests/verified-dossier-components.test.tsx tests/reference-shelf-dossier.test.ts
```

Expected: all tests PASS.

- [ ] **Step 2: Run typecheck, diff check, and build**

Run:

```bash
npm run typecheck
git diff --check
npm run build
```

Expected:

- typecheck exits 0
- `git diff --check` prints no whitespace errors
- build completes and Pagefind index finishes

- [ ] **Step 3: Verify the dev server**

Run:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001
```

Expected:

```text
200
```

If the response is not 200, start the dev server:

```bash
npm run dev -- --port 3001
```

Expected: server listens on `http://localhost:3001`.

- [ ] **Step 4: Capture desktop and mobile screenshots with image-load and overflow audit**

Run this exact script:

```bash
node <<'NODE'
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve('archive/screenshots/home-redesign-20260603');
fs.mkdirSync(outDir, { recursive: true });

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const shots = [
  { name: 'desktop', width: 1440, height: 1800, file: 'loom-home-desktop-evidence-workbench-20260603.png', mobile: false },
  { name: 'mobile', width: 390, height: 1600, file: 'loom-home-mobile-evidence-workbench-20260603.png', mobile: true },
];

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const results = [];

  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: shot.mobile ? 2 : 1,
      isMobile: shot.mobile,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.vd-workbench-grid', { timeout: 15000 });
    await page.waitForTimeout(750);
    await page.screenshot({ path: path.join(outDir, shot.file), fullPage: true });

    const audit = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img')).map((img) => ({
        src: img.getAttribute('src'),
        complete: img.complete,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
      return {
        h1: document.querySelector('h1')?.textContent?.trim(),
        inspectorTitle: document.querySelector('#answer-inspector-title')?.textContent?.trim(),
        workbenchCount: document.querySelectorAll('.vd-workbench-grid').length,
        activeStoryCount: document.querySelectorAll('.vd-active-story').length,
        graphCount: document.querySelectorAll('.vd-source-graph').length,
        sourceIndexTitle: document.querySelector('#source-index-title')?.textContent?.trim(),
        documentScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        unloadedImages: images.filter((img) => !img.complete || !img.width || !img.height).map((img) => img.src),
      };
    });

    results.push({ viewport: shot.name, file: path.join(outDir, shot.file), audit });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
```

Expected JSON:

- desktop `audit.h1` is `Sources become cited work`
- mobile `audit.h1` is `Sources become cited work`
- `audit.inspectorTitle` is `Answer inspector`
- `audit.workbenchCount` is `1`
- `audit.activeStoryCount` is `1`
- `audit.graphCount` is `1`
- `audit.unloadedImages` is `[]`
- `audit.documentScrollWidth` is less than or equal to `audit.viewportWidth` for both viewports

- [ ] **Step 5: Inspect screenshots with `view_image`**

Open both screenshots:

- `archive/screenshots/home-redesign-20260603/loom-home-desktop-evidence-workbench-20260603.png`
- `archive/screenshots/home-redesign-20260603/loom-home-mobile-evidence-workbench-20260603.png`

Visual acceptance checklist:

- first viewport reads as a workbench, not a source-card directory
- active story and source graph are both visible on desktop
- answer inspector is citation-first
- no large blank area appears in the active story
- mobile shows active evidence before identity/sidebar
- file labels do not overlap or break buttons
- real images look framed and loaded

- [ ] **Step 6: Fix screenshot defects if present**

If screenshot inspection finds a defect, fix only the defect file and rerun:

```bash
npx tsx --test tests/home-client-first-paint.test.tsx tests/verified-dossier-components.test.tsx
npm run typecheck
npm run build
```

Then rerun the screenshot script from Step 4.

Expected: screenshot checklist passes.

- [ ] **Step 7: Commit verification-ready implementation**

Run:

```bash
git status --short
git add lib/new-loom/verified-dossier-home.ts components/verified-dossier/EvidenceWorkbench.tsx components/verified-dossier/AnswerInspector.tsx components/verified-dossier/VerifiedDossierHome.tsx app/globals.css tests/loom-verified-dossier-home-contract.test.ts tests/home-client-first-paint.test.tsx tests/verified-dossier-components.test.tsx
git commit -m "Implement Loom evidence workbench homepage"
```

Expected: commit includes only the implementation and test files from this plan. Screenshot files under `archive/screenshots/` remain ignored.

## Plan Self-Review

Spec coverage:

- `Sources become cited work`: Task 1 data, Task 3 integration, Task 5 screenshot audit.
- Active evidence story: Task 2 component, Task 3 integration, Task 4 CSS.
- Source graph: Task 1 data, Task 2 component, Task 4 responsive CSS.
- `Sources -> Draft -> Answer`: Task 1 data and Task 2 `ProvenanceChain`.
- `Answer inspector`: Task 2 component and Task 3 right panel integration.
- Compact `Source index`: Task 2 `SourceIndex`, Task 3 replacement, Task 4 CSS.
- Mobile evidence-first behavior: Task 4 responsive CSS and Task 5 screenshot checklist.
- Verification: Task 5 includes focused tests, typecheck, build, whitespace check, screenshots, image-load audit, and overflow audit.

Type consistency:

- `VerifiedDossierWorkbench` owns `activeArtifactIds`, `sourceGraph`, and `provenanceSteps`.
- Component props use existing exported types and `VerifiedDossierArtifactId`.
- `AnswerInspector` accepts existing `VerifiedDossierAiPrompt`.
- `SourceIndex` accepts existing `VerifiedDossierSection`.

Implementation risk:

- `app/globals.css` currently contains older `.vd-*` sections. The CSS task explicitly keeps old styles until grep proves they are unused.
- Existing dirty worktree may contain unrelated files. Each commit step stages explicit paths only.
