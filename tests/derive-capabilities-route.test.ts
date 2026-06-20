/**
 * T2 — LLM derivation route with evidence-ref validation.
 *
 * These tests cover the PLUMBING and the pure parse→validate seam, not LLM
 * output quality (which requires a live key and is out of scope here):
 *   - route returns {configured:false} when no API key is set,
 *   - rejects an oversize body with 413,
 *   - parseDerivedCapabilities(validJson, profile): returns normalized capabilities,
 *   - evidence refs to NON-existent entries (e.g. exp-99) are dropped,
 *   - status is recomputed after ref-dropping,
 *   - artifact refs by id resolve correctly,
 *   - parseDerivedCapabilities('not json', profile) → [].
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { POST, parseDerivedCapabilities } from '../app/api/derive-capabilities/route';
import { normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── Helpers ──────────────────────────────────────────────────────────────────

function postDerive(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/derive-capabilities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

/** Run `fn` with ANTHROPIC_API_KEY forced unset, restoring it afterwards. */
async function withoutApiKey(fn: () => Promise<void>) {
  const prev = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await fn();
  } finally {
    if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prev;
  }
}

// ── Sample profile ────────────────────────────────────────────────────────────

const sampleProfile: BeginnerProfile = normalizeBeginnerProfile({
  home: { name: 'Ada Lovelace', headline: 'Data Analyst' },
  about: { summary: 'Experienced in data analysis and Python.' },
  education: [
    { institution: 'UNSW', qualification: 'BSc Mathematics' },
  ],
  experience: [
    {
      role: 'Data Analyst',
      organization: 'Acme Corp',
      bullets: ['Built P&L dashboards in Python', 'Led market research initiatives'],
    },
  ],
  works: [
    {
      title: 'Options Visualiser',
      description: 'Interactive options-greeks visualisation using Python',
    },
  ],
  artifacts: [
    { id: 'art-xyz', name: 'analysis-report.pdf', kind: 'pdf', label: 'Data Analysis Report' },
  ],
});

// ── Route: no-key fallback ────────────────────────────────────────────────────

test('route returns {configured:false} when no API key is set', async () => {
  await withoutApiKey(async () => {
    const res = await postDerive({ profile: sampleProfile });
    assert.equal(res.status, 200);
    const data = (await res.json()) as Record<string, unknown>;
    assert.equal(data.configured, false);
    // No capabilities leak on the unconfigured path.
    assert.equal('capabilities' in data, false);
  });
});

// ── Route: input validation ───────────────────────────────────────────────────

test('route rejects an oversize body with 413 (before any model call)', async () => {
  await withoutApiKey(async () => {
    // Build a JSON body whose serialized length exceeds 256 KB.
    const hugeProfile = { profile: { about: { summary: 'x'.repeat(256 * 1024) } } };
    const hugeBody = JSON.stringify(hugeProfile);
    // Use raw Request with the large body string — the route reads request.text().
    const res = await POST(
      new Request('http://localhost/api/derive-capabilities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: hugeBody,
      }),
    );
    assert.equal(res.status, 413);
  });
});

test('route rejects an invalid JSON body with 400', async () => {
  const res = await POST(
    new Request('http://localhost/api/derive-capabilities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    }),
  );
  assert.equal(res.status, 400);
});

// ── parseDerivedCapabilities: valid model JSON → normalized capabilities ───────

test('parseDerivedCapabilities returns normalized capabilities for valid JSON', () => {
  const modelJson = JSON.stringify([
    {
      label: 'Python Programming',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme Corp' },
        { kind: 'work', refId: 'work-0', label: 'Options Visualiser' },
      ],
      note: 'Strong applied Python skills.',
      growth: 'Explore async patterns and packaging',
    },
    {
      label: 'Data Analysis',
      evidence: [
        { kind: 'education', refId: 'edu-0', label: 'BSc Mathematics at UNSW' },
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme Corp' },
      ],
    },
  ]);

  const caps = parseDerivedCapabilities(modelJson, sampleProfile);
  assert.ok(caps.length >= 1, `expected ≥1 capabilities, got ${caps.length}`);

  const pythonCap = caps.find((c) => c.label === 'Python Programming');
  assert.ok(pythonCap, 'Python Programming capability should be present');
  assert.equal(pythonCap!.evidence.length, 2);
  assert.equal(pythonCap!.growth, 'Explore async patterns and packaging');
  assert.equal(pythonCap!.note, 'Strong applied Python skills.');
  // Both evidence refs resolve: exp-0 and work-0 exist → status should be partial
  // (2 evidence but no artifact → partial by computeStatus rules)
  assert.equal(pythonCap!.status, 'partial');
});

// ── parseDerivedCapabilities: non-existent ref is DROPPED ────────────────────

test('parseDerivedCapabilities drops evidence with non-existent refId (e.g. exp-99)', () => {
  const modelJson = JSON.stringify([
    {
      label: 'Data Analysis',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme' },  // valid
        { kind: 'experience', refId: 'exp-99', label: 'Phantom Job' },           // invalid
        { kind: 'education', refId: 'edu-5', label: 'Phantom Degree' },          // invalid
        { kind: 'work', refId: 'work-99', label: 'Phantom Work' },               // invalid
      ],
    },
  ]);

  const caps = parseDerivedCapabilities(modelJson, sampleProfile);
  assert.equal(caps.length, 1);
  // Only the valid exp-0 evidence survives.
  assert.equal(caps[0].evidence.length, 1);
  assert.equal(caps[0].evidence[0].refId, 'exp-0');
});

// ── parseDerivedCapabilities: status is recomputed after ref-dropping ─────────

test('parseDerivedCapabilities recomputes status after evidence refs are dropped', () => {
  // The model claims 'strong' with 2 evidence items, but one is a hallucinated ref.
  // After dropping, we have 1 valid evidence → should recompute to 'partial'.
  const modelJson = JSON.stringify([
    {
      label: 'Research',
      status: 'strong',  // claimed strong by model
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme' },  // valid
        { kind: 'artifact', refId: 'art-FAKE', label: 'Fake Report' },            // invalid
      ],
    },
  ]);

  const caps = parseDerivedCapabilities(modelJson, sampleProfile);
  assert.equal(caps.length, 1);
  // After dropping the fake artifact ref, only 1 evidence remains → partial.
  assert.equal(caps[0].evidence.length, 1);
  assert.equal(caps[0].status, 'partial');
});

// ── parseDerivedCapabilities: forged 'artifact' kind cannot reach 'strong' ────

/**
 * The moat invariant (route docstring): "a capability never claims 'strong' on
 * hallucinated proof." A hallucinating/steered model can emit kind:'artifact' on
 * a refId that DOES resolve — but to a non-artifact entry (e.g. edu-0). Because
 * the refId is real, the evidence survives ref-validation, and computeStatus
 * would award 'strong' off the forged kind even though the profile has ZERO
 * uploaded artifacts. parseDerivedCapabilities must reconcile each evidence.kind
 * with what its refId actually points to, so 'strong' is un-forgeable.
 */
test("parseDerivedCapabilities overwrites a forged 'artifact' kind with the refId's real kind (no artifacts → partial, not strong)", () => {
  // A profile with TWO education entries and NO artifacts.
  const artifactlessProfile: BeginnerProfile = normalizeBeginnerProfile({
    home: { name: 'Grace Hopper', headline: 'Mathematician' },
    education: [
      { institution: 'Vassar College', qualification: 'BA Mathematics' },
      { institution: 'Yale', qualification: 'PhD Mathematics' },
    ],
    // no experience, no works, no artifacts
  });
  assert.equal(artifactlessProfile.artifacts?.length ?? 0, 0, 'precondition: zero artifacts');

  // Model forges kind:'artifact' on an edu-N refId (which resolves to education).
  const forgedJson = JSON.stringify([
    {
      label: 'Mathematics',
      status: 'strong', // model claims strong
      evidence: [
        { kind: 'artifact', refId: 'edu-0', label: 'Forged proof document' }, // resolves to EDUCATION, kind forged
        { kind: 'education', refId: 'edu-1', label: 'PhD Mathematics at Yale' },
      ],
    },
  ]);

  const caps = parseDerivedCapabilities(forgedJson, artifactlessProfile);
  assert.equal(caps.length, 1);
  // Both refIds resolve, so neither evidence entry is dropped.
  assert.equal(caps[0].evidence.length, 2);
  // The forged 'artifact' kind is corrected to the refId's authoritative kind.
  const edu0 = caps[0].evidence.find((e) => e.refId === 'edu-0');
  assert.ok(edu0, 'edu-0 evidence should survive');
  assert.equal(edu0!.kind, 'education');
  // With zero real artifacts, NO evidence may claim 'artifact'.
  assert.equal(caps[0].evidence.some((e) => e.kind === 'artifact'), false);
  // The moat invariant: 'strong' requires a refId genuinely pointing at an artifact.
  assert.equal(caps[0].status, 'partial');
});

// ── parseDerivedCapabilities: artifact ref by id resolves correctly ───────────

test('parseDerivedCapabilities: artifact ref by id resolves correctly', () => {
  const modelJson = JSON.stringify([
    {
      label: 'Data Analysis',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme' },
        { kind: 'artifact', refId: 'art-xyz', label: 'Data Analysis Report' },  // valid artifact id
      ],
    },
  ]);

  const caps = parseDerivedCapabilities(modelJson, sampleProfile);
  assert.equal(caps.length, 1);
  // Both refs valid: exp-0 + artifact art-xyz → 2 evidence with artifact → strong
  assert.equal(caps[0].evidence.length, 2);
  assert.equal(caps[0].status, 'strong');
  // Verify the artifact evidence entry is preserved.
  const artEv = caps[0].evidence.find((e) => e.kind === 'artifact');
  assert.ok(artEv, 'artifact evidence should be present');
  assert.equal(artEv!.refId, 'art-xyz');
});

// ── parseDerivedCapabilities: malformed input → [] ────────────────────────────

test('parseDerivedCapabilities returns [] on non-JSON input', () => {
  assert.deepEqual(parseDerivedCapabilities('not json', sampleProfile), []);
  assert.deepEqual(parseDerivedCapabilities('', sampleProfile), []);
  assert.deepEqual(parseDerivedCapabilities('```json\n{ broken: ,, }\n```', sampleProfile), []);
});

test('parseDerivedCapabilities returns [] when output is an object not an array', () => {
  // Model mistakenly emits an object instead of an array.
  const wrongShape = JSON.stringify({ capabilities: [] });
  assert.deepEqual(parseDerivedCapabilities(wrongShape, sampleProfile), []);
});

// ── parseDerivedCapabilities: empty sparse profile → [] is legitimate ─────────

test('parseDerivedCapabilities returns [] for empty array (sparse profile is OK)', () => {
  const emptyArray = JSON.stringify([]);
  const sparseProfile = normalizeBeginnerProfile({});
  const caps = parseDerivedCapabilities(emptyArray, sparseProfile);
  assert.deepEqual(caps, []);
});

// ── parseDerivedCapabilities: strips code fences ──────────────────────────────

test('parseDerivedCapabilities strips a ```json code fence around the array', () => {
  const fenced = '```json\n[{"label":"Python","evidence":[],"status":"direction"}]\n```';
  const caps = parseDerivedCapabilities(fenced, sampleProfile);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].label, 'Python');
});

// ── Moat hardening: duplicate evidence cannot inflate breadth to 'strong' ──────

test('parseDerivedCapabilities: the same artifact cited twice cannot forge strong', () => {
  // One real, resolvable artifact refId cited twice — every citation is real, but
  // it is a SINGLE document and must not count as two proofs.
  const modelJson = JSON.stringify([
    {
      label: 'Data Analysis',
      status: 'strong',
      evidence: [
        { kind: 'artifact', refId: 'art-xyz', label: 'Report' },
        { kind: 'artifact', refId: 'art-xyz', label: 'Report' },
      ],
    },
  ]);
  const caps = parseDerivedCapabilities(modelJson, sampleProfile);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].evidence.length, 1, 'the duplicate artifact ref is collapsed to one');
  assert.equal(caps[0].status, 'partial', 'a single document is not strong');
});
