import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DIGITAL_ME_ARTIFACT_MODES,
  DIGITAL_ME_PROOF_PATH,
  DIGITAL_ME_ROLE_LENSES,
  DIGITAL_ME_QUANT_ROLE_LENS,
  getDigitalMeClaimById,
  getDigitalMeEvidenceForClaim,
} from '../lib/new-loom/digital-me-role-os';
import { VERIFIED_DOSSIER_ARTIFACTS } from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

  for (const claim of DIGITAL_ME_PROOF_PATH.claims) {
    assert.ok(claim.text.length > 30, `${claim.id} should be a real claim`);
    assert.ok(claim.roleRelevance.length > 20, `${claim.id} should explain role relevance`);
    assert.ok(claim.artifactActions.length > 0, `${claim.id} should expose artifact actions`);
    assert.ok(claim.evidenceIds.length > 0, `${claim.id} should connect to evidence`);
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

test('live market proof claim is partially evidenced by the Optibook replica artifact', () => {
  const liveMarketClaim = getDigitalMeClaimById('live-market-project-proof');
  assert.equal(liveMarketClaim?.evidenceStatus, 'partial');
  assert.ok(liveMarketClaim?.evidenceIds.length, 'live market claim should carry evidence');

  const liveMarketEvidence = getDigitalMeEvidenceForClaim('live-market-project-proof');
  const optibookEvidence = liveMarketEvidence.find(
    (item) => item.artifactId === 'optibook-market-lens',
  );
  assert.ok(optibookEvidence, 'Optibook screenshot should evidence the live market claim');
  assert.ok(optibookEvidence.roleUse.length > 12);
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

  for (const claim of DIGITAL_ME_PROOF_PATH.claims) {
    const action = DIGITAL_ME_PROOF_PATH.nextGrowthActions[claim.id];
    assert.ok(action && action.length > 20, `${claim.id} needs a claim-specific next growth action`);
  }
  assert.ok(
    Object.values(DIGITAL_ME_PROOF_PATH.nextGrowthActions).some((action) => /project/i.test(action)),
  );
});

test('Digital Me reveal animation cannot blank SSR or slow-hydration first paint', () => {
  const css = fs.readFileSync(
    path.join(repoRoot, 'app', 'digital-me', 'DigitalMeRoleOS.module.css'),
    'utf8',
  );
  const client = fs.readFileSync(
    path.join(repoRoot, 'app', 'digital-me', 'DigitalMeRoleOSClient.tsx'),
    'utf8',
  );

  assert.doesNotMatch(
    css,
    /\.roleOsPage\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/s,
    'bare [data-reveal] must not hide server-rendered content',
  );
  assert.match(css, /\.roleOsPage\[data-reveal-ready="true"\]\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/s);
  assert.match(client, /getBoundingClientRect\(\)/);
  assert.match(client, /window\.innerHeight \* 0\.96/);
  assert.match(client, /root\.setAttribute\('data-reveal-ready', 'true'\)/);
  assert.match(client, /const revealVisibleTargets = \(\) => \{/);
  assert.match(client, /window\.addEventListener\('scroll', revealVisibleTargets, \{ passive: true \}\)/);
  assert.match(client, /window\.addEventListener\('resize', revealVisibleTargets\)/);
  assert.match(client, /window\.removeEventListener\('scroll', revealVisibleTargets\)/);
  assert.match(client, /window\.removeEventListener\('resize', revealVisibleTargets\)/);
});

test('Digital Me keeps the role lens and Ask console compact enough for early proof flow', () => {
  const roleCss = fs.readFileSync(
    path.join(repoRoot, 'app', 'digital-me', 'DigitalMeRoleOS.module.css'),
    'utf8',
  );
  const askCss = fs.readFileSync(
    path.join(repoRoot, 'components', 'verified-dossier', 'AskYiping.module.css'),
    'utf8',
  );

  assert.match(
    roleCss,
    /--role-nav-clearance:\s*clamp\(5\.85rem,\s*7vw,\s*6\.4rem\)/,
    'Digital Me needs an explicit route-level nav clearance so the global floating nav does not sit on the role lens glass',
  );
  assert.match(
    roleCss,
    /\.roleLens\s*\{[^}]*margin-top:\s*var\(--role-nav-clearance\)/s,
    'Digital Me hero should reserve only the global nav clearance instead of ad hoc top spacing',
  );
  assert.match(
    roleCss,
    /\.roleOsPage :global\(\.loom-global-nav-slot\)\s*\{[^}]*min-height:\s*0/s,
    'Digital Me should not stack the mobile nav slot spacer on top of its route-level nav clearance',
  );
  assert.match(
    roleCss,
    /@media\s*\(max-width:\s*520px\)\s*\{[\s\S]*\.roleLens\s*\{[^}]*margin-top:\s*clamp\(5\.1rem,\s*18vw,\s*5\.8rem\)/s,
    'Digital Me mobile hero should also clear the compact floating nav without creating a large empty masthead',
  );
  assert.match(
    roleCss,
    /\.roleLens h1\s*\{[^}]*font-size:\s*clamp\(2\.45rem,\s*4\.35vw,\s*4\.7rem\)/s,
    'Digital Me hero title should stay below the old oversized card scale',
  );
  assert.match(
    askCss,
    /\.askYiping\s*\{[^}]*grid-template-columns:\s*minmax\(20rem,\s*0\.88fr\)\s*minmax\(0,\s*1\.12fr\)/s,
    'Ask Yiping should render as a two-column knowledge console on desktop',
  );
  assert.match(
    askCss,
    /\.answerArea\s*\{[^}]*max-height:\s*clamp\(23rem,\s*45vw,\s*32rem\)/s,
    'Ask answer transcript should be height-bounded so the proof path appears earlier',
  );
  assert.match(
    askCss,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.askYiping\s*\{[^}]*grid-template-columns:\s*1fr/s,
    'Ask Yiping should collapse cleanly to one mobile column',
  );
  assert.match(
    askCss,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*\.answerArea\s*\{[^}]*max-height:\s*min\(22rem,\s*48vh\)/s,
    'Ask answer transcript should remain bounded on mobile',
  );
});
