# Digital Me Role Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first `/digital-me` Role Operating System slice: a Quant Researcher / Trader lens that turns real Loom evidence into claim nodes, artifact modes, boundaries, and next growth actions.

**Architecture:** Add a deterministic role OS data module under `lib/new-loom`, then replace the current generic Digital Me section page with a focused client component that renders one active proof path and local interactions. Keep existing verified dossier data as the source of truth and preserve the `#digital-me-answer-title` anchor used by Draft handoff links.

**Tech Stack:** Next.js App Router, React client state, TypeScript, CSS Modules, existing `FileBadge`, Node `tsx --test`, Playwright browser verification.

---

## File Structure

- Create `lib/new-loom/digital-me-role-os.ts`: typed role lens, evidence node, claim node, proof path, artifact state, selectors, and deterministic Quant Role Lens data.
- Create `tests/digital-me-role-os.test.ts`: contract coverage for role lens, evidence statuses, real artifact ids, artifact modes, selectors, and anti-chatbox positioning.
- Modify `tests/loom-verified-dossier-home-contract.test.ts`: replace old Digital Me page expectations with Role Operating System expectations while preserving existing navigation and Draft answer anchor requirements.
- Create `app/digital-me/DigitalMeRoleOSClient.tsx`: client component with selected claim and artifact mode state.
- Create `app/digital-me/DigitalMeRoleOS.module.css`: scoped visual system for the Role Lens proof path, evidence rail, artifact runtime, and mobile behavior.
- Modify `app/digital-me/page.tsx`: server wrapper that imports role OS data and renders the client component.
- Modify `package.json`: add `tests/digital-me-role-os.test.ts` to `test:contracts`.

## Task 1: Role OS Data Model

**Files:**
- Create: `tests/digital-me-role-os.test.ts`
- Create: `lib/new-loom/digital-me-role-os.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing data model test**

Create `tests/digital-me-role-os.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DIGITAL_ME_ARTIFACT_MODES,
  DIGITAL_ME_PROOF_PATH,
  DIGITAL_ME_ROLE_LENSES,
  DIGITAL_ME_QUANT_ROLE_LENS,
  getDigitalMeClaimById,
  getDigitalMeEvidenceForClaim,
} from '../lib/new-loom/digital-me-role-os';
import { VERIFIED_DOSSIER_ARTIFACTS } from '../lib/new-loom/verified-dossier-home';

test('Digital Me defaults to the Quant Researcher / Trader role lens', () => {
  assert.equal(DIGITAL_ME_QUANT_ROLE_LENS.id, 'quant-researcher-trader');
  assert.equal(DIGITAL_ME_QUANT_ROLE_LENS.label, 'Quant Researcher / Trader');
  assert.match(DIGITAL_ME_QUANT_ROLE_LENS.thesis, /Quant Researcher \/ Trader/);
  assert.ok(DIGITAL_ME_QUANT_ROLE_LENS.criteria.includes('mathematical reasoning'));
  assert.ok(DIGITAL_ME_QUANT_ROLE_LENS.criteria.includes('Python and C++ implementation'));
  assert.deepEqual(DIGITAL_ME_ROLE_LENSES.map((lens) => lens.id), ['quant-researcher-trader']);
});

test('Digital Me proof path has evidence-backed claims with honest statuses', () => {
  assert.equal(DIGITAL_ME_PROOF_PATH.roleLensId, 'quant-researcher-trader');
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.length >= 5);

  const statuses = new Set(DIGITAL_ME_PROOF_PATH.claims.map((claim) => claim.evidenceStatus));
  assert.ok(statuses.has('strong'));
  assert.ok(statuses.has('partial'));
  assert.ok(statuses.has('direction'));
  assert.ok(statuses.has('missing'));

  for (const claim of DIGITAL_ME_PROOF_PATH.claims) {
    assert.ok(claim.text.length > 30, `${claim.id} should be a real claim`);
    assert.ok(claim.roleRelevance.length > 20, `${claim.id} should explain role relevance`);
    assert.ok(claim.artifactActions.length > 0, `${claim.id} should expose artifact actions`);
    if (claim.evidenceStatus !== 'missing') {
      assert.ok(claim.evidenceIds.length > 0, `${claim.id} should connect to evidence`);
    }
  }
});

test('Digital Me claim evidence uses real verified dossier artifacts', () => {
  const verifiedIds = new Set(VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.id));

  for (const evidence of DIGITAL_ME_PROOF_PATH.evidence) {
    assert.ok(verifiedIds.has(evidence.artifactId), `${evidence.artifactId} should be real`);
    assert.ok(evidence.supportedCapability.length > 3);
    assert.ok(evidence.roleUse.length > 12);
  }

  const mathClaim = getDigitalMeClaimById('mathematical-reasoning');
  assert.equal(mathClaim?.evidenceStatus, 'strong');
  assert.ok(getDigitalMeEvidenceForClaim('mathematical-reasoning').some((item) => item.artifactId === 'econ-ps2'));
  assert.ok(getDigitalMeEvidenceForClaim('optimisation-thinking').some((item) => item.artifactId === 'econ-slides'));
  assert.ok(getDigitalMeEvidenceForClaim('programming-foundations').some((item) => item.artifactId === 'quantnet-python-foundations'));
});

test('Digital Me artifact runtime exposes distinct role-specific outputs', () => {
  assert.deepEqual(
    DIGITAL_ME_ARTIFACT_MODES.map((mode) => mode.id),
    ['capability-map', 'interview-answer', 'gap-roadmap', 'source-graph', 'portfolio-case'],
  );

  for (const mode of DIGITAL_ME_ARTIFACT_MODES) {
    assert.ok(mode.label.length > 4);
    assert.ok(mode.summary.length > 24);
  }

  assert.equal(DIGITAL_ME_PROOF_PATH.activeArtifactMode, 'capability-map');
  assert.ok(DIGITAL_ME_PROOF_PATH.nextGrowthActions.some((action) => /project/i.test(action)));
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npx tsx --test tests/digital-me-role-os.test.ts
```

Expected: FAIL because `../lib/new-loom/digital-me-role-os` does not exist.

- [ ] **Step 3: Implement the deterministic role OS data module**

Create `lib/new-loom/digital-me-role-os.ts`:

```ts
import {
  VERIFIED_DOSSIER_ARTIFACTS_BY_ID,
  type VerifiedDossierArtifact,
  type VerifiedDossierArtifactId,
} from './verified-dossier-home';

export type DigitalMeEvidenceStatus = 'strong' | 'partial' | 'direction' | 'missing';

export type DigitalMeArtifactModeId =
  | 'capability-map'
  | 'interview-answer'
  | 'gap-roadmap'
  | 'source-graph'
  | 'portfolio-case';

export type DigitalMeRoleLens = {
  id: 'quant-researcher-trader';
  label: string;
  thesis: string;
  criteria: readonly string[];
  prompts: readonly string[];
};

export type DigitalMeEvidenceNode = {
  id: string;
  artifactId: VerifiedDossierArtifactId;
  supportedCapability: string;
  roleUse: string;
};

export type DigitalMeClaimNode = {
  id: string;
  text: string;
  roleRelevance: string;
  evidenceStatus: DigitalMeEvidenceStatus;
  evidenceIds: readonly string[];
  gapNote: string;
  artifactActions: readonly DigitalMeArtifactModeId[];
};

export type DigitalMeArtifactMode = {
  id: DigitalMeArtifactModeId;
  label: string;
  summary: string;
};

export type DigitalMeProofPath = {
  roleLensId: DigitalMeRoleLens['id'];
  thesis: string;
  claims: readonly DigitalMeClaimNode[];
  evidence: readonly DigitalMeEvidenceNode[];
  activeArtifactMode: DigitalMeArtifactModeId;
  boundarySummary: string;
  nextGrowthActions: readonly string[];
};

export const DIGITAL_ME_QUANT_ROLE_LENS: DigitalMeRoleLens = {
  id: 'quant-researcher-trader',
  label: 'Quant Researcher / Trader',
  thesis:
    'Yiping is building toward Quant Research / Trading through mathematical economics, programming practice, market-structure learning, and source-backed project work.',
  criteria: [
    'mathematical reasoning',
    'optimisation thinking',
    'probability and statistics',
    'Python and C++ implementation',
    'market structure understanding',
    'trading logic',
    'risk thinking',
    'research process',
    'execution discipline',
  ],
  prompts: [
    'Show why Yiping is becoming a Quant Researcher / Trader.',
    'Only show evidence related to trading.',
    'Expand the C++ proof.',
    'Turn this into a recruiter version.',
    'Which claims are weak?',
    'Generate a portfolio case from this path.',
  ],
} as const;

export const DIGITAL_ME_ROLE_LENSES = [DIGITAL_ME_QUANT_ROLE_LENS] as const;

export const DIGITAL_ME_ARTIFACT_MODES: readonly DigitalMeArtifactMode[] = [
  {
    id: 'capability-map',
    label: 'Capability Map',
    summary: 'Shows role claims, evidence strength, and capability gaps in one proof surface.',
  },
  {
    id: 'interview-answer',
    label: 'Interview Answer',
    summary: 'Turns the selected proof path into a concise role-specific answer with citations.',
  },
  {
    id: 'gap-roadmap',
    label: 'Gap Roadmap',
    summary: 'Identifies missing proof and recommends the next artifact or project to create.',
  },
  {
    id: 'source-graph',
    label: 'Source Graph',
    summary: 'Connects each claim back to source files, courses, certificates, and drafts.',
  },
  {
    id: 'portfolio-case',
    label: 'Portfolio Case',
    summary: 'Converts the proof path into a presentable case study for recruiters or collaborators.',
  },
] as const;

const evidence = [
  {
    id: 'evidence-econ-ps2',
    artifactId: 'econ-ps2',
    supportedCapability: 'mathematical reasoning',
    roleUse: 'Problem-set work gives concrete proof of reasoning under formal economic constraints.',
  },
  {
    id: 'evidence-econ-slides',
    artifactId: 'econ-slides',
    supportedCapability: 'optimisation thinking',
    roleUse: 'Concavity material supports optimisation language used in economic and trading reasoning.',
  },
  {
    id: 'evidence-econ-notes',
    artifactId: 'econ-notes',
    supportedCapability: 'worked answer production',
    roleUse: 'A private answer artifact shows movement from source material into produced work.',
  },
  {
    id: 'evidence-quantnet-python',
    artifactId: 'quantnet-python-foundations',
    supportedCapability: 'programming foundations',
    roleUse: 'Python learning material supports a future quant research implementation path.',
  },
  {
    id: 'evidence-quantnet-cpp',
    artifactId: 'quantnet-cpp-course',
    supportedCapability: 'C++ financial engineering exposure',
    roleUse: 'The C++ course source supports direction toward performance-oriented financial engineering.',
  },
  {
    id: 'evidence-wqu',
    artifactId: 'wqu-index',
    supportedCapability: 'finance learning direction',
    roleUse: 'WQU material supports finance context but needs stronger project output to become proof.',
  },
  {
    id: 'evidence-about',
    artifactId: 'about-doc',
    supportedCapability: 'role identity',
    roleUse: 'The About document gives the current personal direction that the role lens organizes.',
  },
] as const satisfies readonly DigitalMeEvidenceNode[];

export const DIGITAL_ME_PROOF_PATH: DigitalMeProofPath = {
  roleLensId: DIGITAL_ME_QUANT_ROLE_LENS.id,
  thesis: DIGITAL_ME_QUANT_ROLE_LENS.thesis,
  activeArtifactMode: 'capability-map',
  evidence,
  claims: [
    {
      id: 'mathematical-reasoning',
      text: 'Yiping has strong early evidence of mathematical reasoning through UNSW economic problem work.',
      roleRelevance: 'Quant research and trading both require precise reasoning from formal constraints.',
      evidenceStatus: 'strong',
      evidenceIds: ['evidence-econ-ps2', 'evidence-econ-notes'],
      gapNote: 'The next proof should connect this reasoning to market or portfolio data.',
      artifactActions: ['capability-map', 'interview-answer', 'portfolio-case'],
    },
    {
      id: 'optimisation-thinking',
      text: 'Yiping has developing optimisation language through concavity and mathematical economics material.',
      roleRelevance: 'Optimisation is central to economic choice, portfolio construction, and strategy design.',
      evidenceStatus: 'strong',
      evidenceIds: ['evidence-econ-slides', 'evidence-econ-ps2'],
      gapNote: 'The archive should add an applied optimisation project or notebook.',
      artifactActions: ['source-graph', 'interview-answer', 'gap-roadmap'],
    },
    {
      id: 'programming-foundations',
      text: 'Yiping has partial programming evidence through Python and C++ learning sources for quant work.',
      roleRelevance: 'Quant roles need implementation fluency, research tooling, and production discipline.',
      evidenceStatus: 'partial',
      evidenceIds: ['evidence-quantnet-python', 'evidence-quantnet-cpp'],
      gapNote: 'The proof is stronger after a code artifact, backtest, or research notebook is attached.',
      artifactActions: ['capability-map', 'gap-roadmap', 'portfolio-case'],
    },
    {
      id: 'market-structure-direction',
      text: 'Yiping has a finance and market-structure direction, but the current proof is still directional.',
      roleRelevance: 'Trading requires market mechanics, liquidity, risk, and execution judgment.',
      evidenceStatus: 'direction',
      evidenceIds: ['evidence-wqu', 'evidence-about'],
      gapNote: 'Add FINS3666 source files, trading notes, or market-making work to make this claim inspectable.',
      artifactActions: ['gap-roadmap', 'source-graph'],
    },
    {
      id: 'research-output-gap',
      text: 'Yiping still needs a stronger public quant research output to prove repeatable research process.',
      roleRelevance: 'A Quant Researcher / Trader lens needs at least one inspectable strategy or research case.',
      evidenceStatus: 'missing',
      evidenceIds: [],
      gapNote: 'Create a source-backed research memo, notebook, or portfolio case from current learning material.',
      artifactActions: ['gap-roadmap', 'portfolio-case'],
    },
  ],
  boundarySummary:
    'Digital Me can support claims about mathematical economics, optimisation language, and programming study. It should not claim complete quant trading readiness until project and research-output evidence exists.',
  nextGrowthActions: [
    'Create a small quant research project that connects ECON3202 optimisation concepts to a market example.',
    'Attach a Python notebook or backtest artifact to strengthen programming proof.',
    'Add FINS3666 and trading-study sources to make market-structure claims inspectable.',
  ],
} as const;

export function getDigitalMeClaimById(id: string) {
  return DIGITAL_ME_PROOF_PATH.claims.find((claim) => claim.id === id);
}

export function getDigitalMeEvidenceForClaim(claimId: string) {
  const claim = getDigitalMeClaimById(claimId);
  if (!claim) return [];
  const ids = new Set(claim.evidenceIds);
  return DIGITAL_ME_PROOF_PATH.evidence.filter((node) => ids.has(node.id));
}

export function resolveDigitalMeEvidenceArtifact(node: DigitalMeEvidenceNode): VerifiedDossierArtifact {
  return VERIFIED_DOSSIER_ARTIFACTS_BY_ID[node.artifactId];
}
```

- [ ] **Step 4: Run the data model test and verify GREEN**

Run:

```bash
npx tsx --test tests/digital-me-role-os.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add the new test to `test:contracts`**

Modify `package.json` so the `test:contracts` script includes the new file near other Loom contract tests. Run:

```bash
node -e "const fs=require('node:fs'); const path='package.json'; const pkg=JSON.parse(fs.readFileSync(path,'utf8')); const needle='tests/home-client-first-paint.test.tsx tests/loom-verified-dossier-home-contract.test.ts'; const replacement='tests/home-client-first-paint.test.tsx tests/digital-me-role-os.test.ts tests/loom-verified-dossier-home-contract.test.ts'; if (!pkg.scripts['test:contracts'].includes('tests/digital-me-role-os.test.ts')) { if (!pkg.scripts['test:contracts'].includes(needle)) throw new Error('test:contracts insertion point not found'); pkg.scripts['test:contracts']=pkg.scripts['test:contracts'].replace(needle,replacement); fs.writeFileSync(path, JSON.stringify(pkg,null,2)+'\n'); }"
```

Do not change unrelated scripts.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add lib/new-loom/digital-me-role-os.ts tests/digital-me-role-os.test.ts package.json
git commit -m "test: add Digital Me role OS data contract"
```

## Task 2: Page Contract And Anti-Old-UI Tests

**Files:**
- Modify: `tests/loom-verified-dossier-home-contract.test.ts`
- Modify: `tests/reference-citation-consumers.test.ts`

- [ ] **Step 1: Update the Digital Me foundation test to expect Role OS positioning**

In `tests/loom-verified-dossier-home-contract.test.ts`, replace the old assertions inside `Digital Me is based on About, Education, and Experience layers` after `html` is rendered:

```ts
  assert.match(html, /Quant Researcher \/ Trader/);
  assert.match(html, /Role Lens/);
  assert.match(html, /Evidence Graph/);
  assert.match(html, /Claim Engine/);
  assert.match(html, /Artifact Runtime/);
  assert.match(html, /Boundary/);
  assert.match(html, /Next Growth Action/);
  assert.match(html, /Built from About, Education, and Experience/);
  assert.match(html, /About foundation/);
  assert.match(html, /Education foundation/);
  assert.match(html, /Experience foundation/);
  assert.doesNotMatch(html, /A living personal interface/);
  assert.doesNotMatch(html, /interactive representation of a person/i);
```

- [ ] **Step 2: Replace the old modes test with artifact runtime expectations**

Replace the body of `Digital Me exposes answer, canvas, portfolio, process, and action modes`:

```ts
test('Digital Me exposes role-lens artifact runtime actions', async () => {
  const {
    DIGITAL_ME_ARTIFACT_MODES,
    DIGITAL_ME_PROOF_PATH,
  } = await import('../lib/new-loom/digital-me-role-os');

  assert.deepEqual(
    DIGITAL_ME_ARTIFACT_MODES.map((mode) => mode.label),
    ['Capability Map', 'Interview Answer', 'Gap Roadmap', 'Source Graph', 'Portfolio Case'],
  );
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.length >= 5);

  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(DigitalMePage));

  for (const mode of DIGITAL_ME_ARTIFACT_MODES) {
    assert.match(html, new RegExp(mode.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /Capability Map/);
  assert.match(html, /Interview Answer/);
  assert.match(html, /Gap Roadmap/);
});
```

- [ ] **Step 3: Replace the old trading canvas test with proof path expectations**

Replace `Digital Me can route an ask into a topic presentation canvas` with:

```ts
test('Digital Me renders the Quant proof path with evidence statuses and gaps', async () => {
  const {
    DIGITAL_ME_PROOF_PATH,
    getDigitalMeEvidenceForClaim,
  } = await import('../lib/new-loom/digital-me-role-os');

  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'strong'));
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'partial'));
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'direction'));
  assert.ok(DIGITAL_ME_PROOF_PATH.claims.some((claim) => claim.evidenceStatus === 'missing'));
  assert.ok(getDigitalMeEvidenceForClaim('mathematical-reasoning').length > 0);

  const { default: DigitalMePage } = await import('../app/digital-me/page');
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const html = renderToStaticMarkup(React.createElement(DigitalMePage));

  assert.match(html, /Mathematical reasoning/);
  assert.match(html, /Optimisation thinking/);
  assert.match(html, /Programming foundations/);
  assert.match(html, /Market structure/);
  assert.match(html, /Research output gap/);
  assert.match(html, /Strong evidence/);
  assert.match(html, /Partial evidence/);
  assert.match(html, /Direction only/);
  assert.match(html, /Missing proof/);
  assert.match(html, /Create a small quant research project/);
});
```

- [ ] **Step 4: Update the Digital Me style selector contract**

In `Digital Me page ships professional section-page layout styles`, add selectors for the new CSS module by reading `app/digital-me/DigitalMeRoleOS.module.css`:

```ts
  const roleCssPath = join(repoRoot, 'app/digital-me/DigitalMeRoleOS.module.css');
  const roleCss = existsSync(roleCssPath)
    ? (require('node:fs').readFileSync(roleCssPath, 'utf8') as string)
    : '';

  for (const selector of [
    '.roleOsPage',
    '.roleLens',
    '.proofPath',
    '.claimRail',
    '.artifactStage',
    '.evidencePanel',
    '.boundaryPanel',
  ]) {
    assert.match(roleCss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
```

- [ ] **Step 5: Preserve source-grounded citation expectations**

In `tests/reference-citation-consumers.test.ts`, change only the Digital Me source expectations:

```ts
  assert.match(digitalMePage, /DIGITAL_ME_PROOF_PATH/);
  assert.match(digitalMePage, /DigitalMeRoleOSClient/);
  assert.match(digitalMePage, /digital-me-answer-title/);
```

Remove old expectations that require `VERIFIED_DOSSIER_AI_PROMPT`, `resolveVerifiedDossierArtifact`, or `FileBadge` in `app/digital-me/page.tsx`; those will move into the client/data layer.

- [ ] **Step 6: Run the page contract tests and verify RED**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
```

Expected: FAIL because `/digital-me` still renders the old living-interface page and the new CSS module does not exist.

- [ ] **Step 7: Commit Task 2 tests**

Run:

```bash
git add tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
git commit -m "test: specify Digital Me role OS page"
```

## Task 3: Digital Me Role OS Client

**Files:**
- Create: `app/digital-me/DigitalMeRoleOSClient.tsx`
- Modify: `app/digital-me/page.tsx`

- [ ] **Step 1: Create the client component**

Create `app/digital-me/DigitalMeRoleOSClient.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';

import { FileBadge } from '../../components/verified-dossier/FileBadge';
import {
  DIGITAL_ME_ARTIFACT_MODES,
  DIGITAL_ME_PROOF_PATH,
  DIGITAL_ME_QUANT_ROLE_LENS,
  getDigitalMeClaimById,
  getDigitalMeEvidenceForClaim,
  resolveDigitalMeEvidenceArtifact,
  type DigitalMeArtifactModeId,
  type DigitalMeClaimNode,
  type DigitalMeEvidenceStatus,
} from '../../lib/new-loom/digital-me-role-os';
import styles from './DigitalMeRoleOS.module.css';

const STATUS_LABELS: Record<DigitalMeEvidenceStatus, string> = {
  strong: 'Strong evidence',
  partial: 'Partial evidence',
  direction: 'Direction only',
  missing: 'Missing proof',
};

function getClaimTitle(claim: DigitalMeClaimNode) {
  return claim.id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ArtifactOutput({
  mode,
  selectedClaim,
}: {
  mode: DigitalMeArtifactModeId;
  selectedClaim: DigitalMeClaimNode;
}) {
  if (mode === 'interview-answer') {
    return (
      <div className={styles.answerArtifact} id="digital-me-answer-title">
        <span>Interview Answer</span>
        <p>
          I am building toward Quant Research / Trading through source-backed mathematical
          economics, programming foundations, and a developing market-structure direction.
          The strongest current proof is {getClaimTitle(selectedClaim).toLowerCase()}, while
          the archive still marks clear gaps before claiming full trading readiness.
        </p>
      </div>
    );
  }

  if (mode === 'gap-roadmap') {
    return (
      <ol className={styles.roadmapArtifact}>
        {DIGITAL_ME_PROOF_PATH.nextGrowthActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ol>
    );
  }

  if (mode === 'source-graph') {
    return (
      <div className={styles.sourceGraphArtifact}>
        {getDigitalMeEvidenceForClaim(selectedClaim.id).map((node) => {
          const artifact = resolveDigitalMeEvidenceArtifact(node);
          return (
            <a key={node.id} href={artifact.href}>
              <FileBadge kind={artifact.kind} label={artifact.label} compact />
              <span>{node.supportedCapability}</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (mode === 'portfolio-case') {
    return (
      <div className={styles.caseArtifact}>
        <strong>{getClaimTitle(selectedClaim)}</strong>
        <p>{selectedClaim.text}</p>
        <p>{selectedClaim.roleRelevance}</p>
      </div>
    );
  }

  return (
    <div className={styles.capabilityArtifact}>
      {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
        <div key={claim.id} data-active={claim.id === selectedClaim.id}>
          <strong>{getClaimTitle(claim)}</strong>
          <span>{STATUS_LABELS[claim.evidenceStatus]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DigitalMeRoleOSClient() {
  const [selectedClaimId, setSelectedClaimId] = useState(DIGITAL_ME_PROOF_PATH.claims[0].id);
  const [activeArtifactMode, setActiveArtifactMode] = useState<DigitalMeArtifactModeId>(
    DIGITAL_ME_PROOF_PATH.activeArtifactMode,
  );

  const selectedClaim = getDigitalMeClaimById(selectedClaimId) ?? DIGITAL_ME_PROOF_PATH.claims[0];
  const selectedEvidence = useMemo(
    () => getDigitalMeEvidenceForClaim(selectedClaim.id),
    [selectedClaim.id],
  );
  const activeMode = DIGITAL_ME_ARTIFACT_MODES.find((mode) => mode.id === activeArtifactMode)
    ?? DIGITAL_ME_ARTIFACT_MODES[0];

  return (
    <main className={styles.roleOsPage} aria-labelledby="digital-me-title">
      <nav className={styles.nav} aria-label="Digital Me navigation">
        <a href="/">Loom</a>
        <a href="/about">About</a>
        <a href="/education">Education</a>
        <a href="/experience">Experience</a>
        <a aria-current="page" href="/digital-me">Digital Me</a>
      </nav>

      <header className={styles.roleLens}>
        <p>Role Lens</p>
        <h1 id="digital-me-title">{DIGITAL_ME_QUANT_ROLE_LENS.label}</h1>
        <span>{DIGITAL_ME_QUANT_ROLE_LENS.thesis}</span>
      </header>

      <section className={styles.proofPath} aria-label="Digital Me proof path">
        <aside className={styles.claimRail} aria-label="Claim Engine">
          <p>Claim Engine</p>
          {DIGITAL_ME_PROOF_PATH.claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              aria-pressed={claim.id === selectedClaim.id}
              onClick={() => setSelectedClaimId(claim.id)}
            >
              <strong>{getClaimTitle(claim)}</strong>
              <span>{STATUS_LABELS[claim.evidenceStatus]}</span>
            </button>
          ))}
        </aside>

        <section className={styles.artifactStage} aria-label="Artifact Runtime">
          <div className={styles.stageHeader}>
            <p>Artifact Runtime</p>
            <h2>{activeMode.label}</h2>
            <span>{activeMode.summary}</span>
          </div>
          <div className={styles.artifactActions}>
            {DIGITAL_ME_ARTIFACT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={mode.id === activeArtifactMode}
                onClick={() => setActiveArtifactMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <ArtifactOutput mode={activeArtifactMode} selectedClaim={selectedClaim} />
        </section>

        <aside className={styles.evidencePanel} aria-label="Evidence Graph">
          <p>Evidence Graph</p>
          <h2>{getClaimTitle(selectedClaim)}</h2>
          <span>{selectedClaim.text}</span>
          <div>
            {selectedEvidence.length > 0 ? (
              selectedEvidence.map((node) => {
                const artifact = resolveDigitalMeEvidenceArtifact(node);
                return (
                  <a key={node.id} href={artifact.href}>
                    <FileBadge kind={artifact.kind} label={artifact.label} compact />
                    <small>{node.roleUse}</small>
                  </a>
                );
              })
            ) : (
              <div className={styles.emptyEvidence}>No attached source yet.</div>
            )}
          </div>
          <section className={styles.boundaryPanel} aria-label="Boundary and Next Growth Action">
            <strong>Boundary</strong>
            <p>{selectedClaim.gapNote}</p>
            <strong>Next Growth Action</strong>
            <p>{DIGITAL_ME_PROOF_PATH.nextGrowthActions[0]}</p>
          </section>
        </aside>
      </section>

      <section className={styles.foundationStrip} aria-label="Built from About, Education, and Experience">
        <strong>Built from About, Education, and Experience</strong>
        <span>About foundation</span>
        <span>Education foundation</span>
        <span>Experience foundation</span>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Replace the server page wrapper**

Replace `app/digital-me/page.tsx` with:

```tsx
import React from 'react';

import DigitalMeRoleOSClient from './DigitalMeRoleOSClient';
import { DIGITAL_ME_PROOF_PATH } from '../../lib/new-loom/digital-me-role-os';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  if (!DIGITAL_ME_PROOF_PATH.claims.length) {
    throw new Error('Missing Digital Me proof path claims');
  }

  return <DigitalMeRoleOSClient />;
}
```

- [ ] **Step 3: Run page contract tests and verify they still fail only on CSS selectors**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
```

Expected: FAIL because `DigitalMeRoleOS.module.css` does not exist or lacks required selectors. If failures mention missing role strings, fix the client before continuing.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add app/digital-me/page.tsx app/digital-me/DigitalMeRoleOSClient.tsx
git commit -m "feat: add Digital Me role OS client"
```

## Task 4: Role OS Styling

**Files:**
- Create: `app/digital-me/DigitalMeRoleOS.module.css`

- [ ] **Step 1: Add scoped CSS module**

Create `app/digital-me/DigitalMeRoleOS.module.css`:

```css
.roleOsPage {
  --dm-ink: #151917;
  --dm-muted: #68716c;
  --dm-border: #dfe6df;
  --dm-accent: #15513f;
  --dm-soft: #f7f9f6;
  min-height: 100vh;
  overflow-x: clip;
  background: #fff;
  color: var(--dm-ink);
  font-family: var(--sans);
}

.nav {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  gap: clamp(1rem, 2vw, 1.8rem);
  align-items: center;
  min-height: 4.25rem;
  padding: 0 clamp(1.1rem, 3vw, 3rem);
  border-bottom: 1px solid var(--dm-border);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: saturate(180%) blur(18px);
}

.nav a {
  color: #303633;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.nav a:first-child {
  margin-right: auto;
  font-family: var(--display);
  font-size: 1.9rem;
  font-weight: 560;
}

.nav a[aria-current="page"] {
  color: var(--dm-accent);
}

.roleLens {
  display: grid;
  gap: 0.85rem;
  width: min(100%, 96rem);
  margin: 0 auto;
  padding: clamp(2.6rem, 6vw, 5rem) clamp(1.1rem, 3vw, 3rem) clamp(1.8rem, 4vw, 3rem);
  border-bottom: 1px solid var(--dm-border);
}

.roleLens p,
.claimRail > p,
.stageHeader p,
.evidencePanel > p {
  margin: 0;
  color: var(--dm-accent);
  font-size: 0.76rem;
  font-weight: 820;
  letter-spacing: 0;
  text-transform: uppercase;
}

.roleLens h1 {
  max-width: 60rem;
  margin: 0;
  font-family: var(--display);
  font-size: clamp(3rem, 7vw, 6.7rem);
  font-weight: 540;
  line-height: 0.92;
  letter-spacing: 0;
}

.roleLens span {
  max-width: 58rem;
  color: var(--dm-muted);
  font-family: var(--serif);
  font-size: clamp(1.08rem, 1.65vw, 1.45rem);
  line-height: 1.42;
}

.proofPath {
  display: grid;
  grid-template-columns: minmax(15rem, 0.7fr) minmax(28rem, 1.45fr) minmax(18rem, 0.85fr);
  width: min(100%, 96rem);
  margin: 0 auto;
  padding: 0 clamp(1.1rem, 3vw, 3rem) clamp(2.8rem, 5vw, 5rem);
}

.claimRail,
.artifactStage,
.evidencePanel {
  min-width: 0;
  padding-top: clamp(1.6rem, 3vw, 2.6rem);
}

.claimRail {
  display: grid;
  align-content: start;
  gap: 0;
  padding-right: clamp(1rem, 2vw, 1.8rem);
  border-right: 1px solid var(--dm-border);
}

.claimRail button {
  display: grid;
  gap: 0.35rem;
  width: 100%;
  padding: 0.95rem 0;
  border: 0;
  border-bottom: 1px solid var(--dm-border);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.claimRail button[aria-pressed="true"] strong,
.claimRail button:hover strong {
  color: var(--dm-accent);
}

.claimRail strong {
  font-size: 0.95rem;
  line-height: 1.22;
}

.claimRail span {
  color: var(--dm-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.artifactStage {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding-right: clamp(1.2rem, 3vw, 2.2rem);
  padding-left: clamp(1.2rem, 3vw, 2.2rem);
}

.stageHeader {
  display: grid;
  gap: 0.7rem;
}

.stageHeader h2,
.evidencePanel h2 {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(1.8rem, 3.5vw, 3rem);
  font-weight: 540;
  line-height: 1.02;
}

.stageHeader span,
.evidencePanel > span {
  color: var(--dm-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.artifactActions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.2rem 0 0.8rem;
  border-bottom: 1px solid var(--dm-border);
}

.artifactActions button {
  border: 1px solid var(--dm-border);
  background: #fff;
  color: var(--dm-accent);
  padding: 0.55rem 0.68rem;
  font-size: 0.76rem;
  font-weight: 800;
}

.artifactActions button[aria-pressed="true"] {
  background: var(--dm-accent);
  color: #fff;
}

.capabilityArtifact,
.sourceGraphArtifact,
.caseArtifact,
.answerArtifact,
.roadmapArtifact {
  margin: 0;
  padding: 1rem 0;
}

.capabilityArtifact {
  display: grid;
  gap: 0;
}

.capabilityArtifact > div,
.sourceGraphArtifact a {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--dm-border);
}

.capabilityArtifact > div[data-active="true"] {
  color: var(--dm-accent);
}

.capabilityArtifact span,
.sourceGraphArtifact span,
.caseArtifact p,
.answerArtifact p,
.roadmapArtifact li {
  color: var(--dm-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.answerArtifact span {
  color: var(--dm-accent);
  font-size: 0.78rem;
  font-weight: 820;
  text-transform: uppercase;
}

.evidencePanel {
  display: grid;
  align-content: start;
  gap: 0.9rem;
  padding-left: clamp(1rem, 2vw, 1.8rem);
  border-left: 1px solid var(--dm-border);
}

.evidencePanel a {
  display: grid;
  gap: 0.42rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--dm-border);
  color: inherit;
  text-decoration: none;
}

.evidencePanel small,
.emptyEvidence {
  color: var(--dm-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.boundaryPanel {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--dm-border);
}

.boundaryPanel strong {
  color: var(--dm-accent);
  font-size: 0.78rem;
  font-weight: 820;
  text-transform: uppercase;
}

.boundaryPanel p {
  margin: 0;
  color: var(--dm-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.foundationStrip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.2rem;
  width: min(100%, 96rem);
  margin: 0 auto;
  padding: 1rem clamp(1.1rem, 3vw, 3rem) 2.2rem;
  border-top: 1px solid var(--dm-border);
  color: var(--dm-muted);
  font-size: 0.86rem;
}

.foundationStrip strong {
  color: var(--dm-accent);
}

@media (max-width: 1020px) {
  .proofPath {
    grid-template-columns: minmax(0, 1fr);
  }

  .claimRail,
  .evidencePanel {
    border-right: 0;
    border-left: 0;
    padding-right: 0;
    padding-left: 0;
  }
}

@media (max-width: 700px) {
  .nav {
    overflow-x: auto;
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .nav a:first-child {
    margin-right: 0.6rem;
  }

  .roleLens h1 {
    font-size: clamp(2.5rem, 13vw, 4rem);
  }
}
```

- [ ] **Step 2: Run the page contract tests and verify GREEN**

Run:

```bash
npx tsx --test tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit Task 4**

Run:

```bash
git add app/digital-me/DigitalMeRoleOS.module.css
git commit -m "style: shape Digital Me role OS"
```

## Task 5: Targeted Suite And Browser Verification

**Files:**
- No production file changes expected unless verification finds visible issues.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npx tsx --test tests/digital-me-role-os.test.ts tests/loom-verified-dossier-home-contract.test.ts tests/reference-citation-consumers.test.ts tests/draft-answer-preview.test.ts tests/loom-personal-positioning.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Start or reuse the dev server**

If `http://localhost:3000/digital-me` is not available, run:

```bash
npm run dev
```

Expected: Next dev server available on port 3000 or the repo's existing fallback port.

- [ ] **Step 4: Verify browser behavior with Playwright**

Run:

```bash
node --input-type=module -e "import { chromium } from 'playwright'; const browser=await chromium.launch(); const checks=[{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]; const results=[]; for (const cfg of checks){ const page=await browser.newPage({viewport:{width:cfg.width,height:cfg.height}}); const errors=[]; const bad=[]; page.on('console', msg=>{ if(msg.type()==='error') errors.push(msg.text()); }); page.on('response', res=>{ if(res.status()>=400) bad.push(res.status()+' '+res.url()); }); await page.goto('http://localhost:3000/digital-me',{waitUntil:'networkidle'}); await page.getByRole('button', { name: /Programming Foundations/i }).click().catch(()=>{}); await page.getByRole('button', { name: /Gap Roadmap/i }).click().catch(()=>{}); const metrics=await page.evaluate(()=>({title:document.title, scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, hasQuant:/Quant Researcher \\/ Trader/.test(document.body.innerText), hasGap:/Gap Roadmap/.test(document.body.innerText), hasAnchor:!!document.getElementById('digital-me-answer-title')})); results.push({name:cfg.name,...metrics, errors, bad}); await page.close(); } await browser.close(); console.log(JSON.stringify(results,null,2));"
```

Expected:

- `title` is `Digital Me · Loom`
- `scrollWidth === clientWidth` for desktop and mobile
- `hasQuant === true`
- `hasGap === true`
- `hasAnchor === true`
- `errors` is empty
- `bad` is empty

- [ ] **Step 5: Capture temporary screenshots only if visual inspection is needed**

If the DOM check suggests a layout issue, capture screenshots to `/tmp`:

```bash
npx playwright screenshot --viewport-size=1440,1000 http://localhost:3000/digital-me /tmp/digital-me-role-os-desktop.png
npx playwright screenshot --viewport-size=390,844 http://localhost:3000/digital-me /tmp/digital-me-role-os-mobile.png
```

Inspect with `view_image`, then delete:

```bash
rm -f /tmp/digital-me-role-os-desktop.png /tmp/digital-me-role-os-mobile.png
```

- [ ] **Step 6: Commit any verification fixes**

If verification required fixes, commit only touched files:

```bash
git add app/digital-me tests lib/new-loom package.json
git commit -m "fix: verify Digital Me role OS"
```

If no fixes were needed, do not create an empty commit.

## Self-Review Checklist

- Spec coverage: role lens, evidence graph, claim engine, artifact runtime, boundary, next growth action, deterministic first slice, real evidence assets, no live provider requirement, no Google Maps requirement.
- TDD order: each production change has a failing test step first.
- Existing contracts: `digital-me-answer-title` remains for Draft handoff.
- Scope boundary: no redesign of About, Education, or Experience.
- Visual boundary: no card-grid main page, no generic dashboard, no plain ask box.
