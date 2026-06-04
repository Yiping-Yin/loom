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
