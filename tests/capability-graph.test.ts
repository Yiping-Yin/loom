import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeStatus,
  deriveCapabilitiesHeuristic,
  normalizeCapabilities,
  type CapabilityEvidence,
} from '../lib/capability/capability-graph';
import { emptyBeginnerProfile, normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── computeStatus ────────────────────────────────────────────────────────────

test('computeStatus: [] → direction', () => {
  assert.equal(computeStatus([]), 'direction');
});

test('computeStatus: one experience evidence → partial', () => {
  const ev: CapabilityEvidence[] = [
    { kind: 'experience', refId: 'exp-0', label: 'Analyst' },
  ];
  assert.equal(computeStatus(ev), 'partial');
});

test('computeStatus: experience + work (no artifact) → partial', () => {
  const ev: CapabilityEvidence[] = [
    { kind: 'experience', refId: 'exp-0', label: 'Analyst' },
    { kind: 'work', refId: 'work-0', label: 'P&L Dashboard' },
  ];
  assert.equal(computeStatus(ev), 'partial');
});

test('computeStatus: experience + artifact → strong', () => {
  const ev: CapabilityEvidence[] = [
    { kind: 'experience', refId: 'exp-0', label: 'Analyst' },
    { kind: 'artifact', refId: 'art-1', label: 'Options report' },
  ];
  assert.equal(computeStatus(ev), 'strong');
});

// ── deriveCapabilitiesHeuristic ──────────────────────────────────────────────

const sampleProfile: BeginnerProfile = {
  version: 1,
  home: { name: 'Ada', headline: 'Data Analyst' },
  about: { summary: 'Experienced in data analysis and research', links: [] },
  education: [
    { institution: 'UNSW', qualification: 'BSc Mathematics', bullets: [] } as BeginnerProfile['education'][number],
  ],
  experience: [
    {
      role: 'Data Analyst',
      organization: 'Acme Corp',
      bullets: ['Built a P&L dashboard in Python', 'Conducted market research and analysis'],
    },
  ],
  works: [
    {
      title: 'Options Greeks Visualiser',
      description: 'Interactive visualisation of options greeks using Python',
    },
  ],
  artifacts: [
    { id: 'art-1', name: 'analysis-report.pdf', kind: 'pdf', label: 'Data Analysis Report' },
  ],
};

test('deriveCapabilitiesHeuristic returns ≥1 capability for a populated profile', () => {
  const caps = deriveCapabilitiesHeuristic(sampleProfile);
  assert.ok(caps.length >= 1, `expected ≥1 capabilities, got ${caps.length}`);
});

test('deriveCapabilitiesHeuristic: every evidence refId resolves to a real profile entry', () => {
  const caps = deriveCapabilitiesHeuristic(sampleProfile);
  for (const cap of caps) {
    for (const ev of cap.evidence) {
      if (ev.kind === 'education') {
        const idx = parseInt(ev.refId.replace('edu-', ''), 10);
        assert.ok(
          !isNaN(idx) && sampleProfile.education[idx] !== undefined,
          `edu refId ${ev.refId} must resolve to an education entry`,
        );
      } else if (ev.kind === 'experience') {
        const idx = parseInt(ev.refId.replace('exp-', ''), 10);
        assert.ok(
          !isNaN(idx) && sampleProfile.experience[idx] !== undefined,
          `exp refId ${ev.refId} must resolve to an experience entry`,
        );
      } else if (ev.kind === 'work') {
        const idx = parseInt(ev.refId.replace('work-', ''), 10);
        assert.ok(
          !isNaN(idx) && sampleProfile.works[idx] !== undefined,
          `work refId ${ev.refId} must resolve to a work entry`,
        );
      } else if (ev.kind === 'artifact') {
        const artifact = (sampleProfile.artifacts ?? []).find((a) => a.id === ev.refId);
        assert.ok(artifact !== undefined, `artifact refId ${ev.refId} must resolve to an artifact`);
      }
    }
  }
});

test('deriveCapabilitiesHeuristic: each capability has a status', () => {
  const caps = deriveCapabilitiesHeuristic(sampleProfile);
  const validStatuses = new Set(['strong', 'partial', 'direction']);
  for (const cap of caps) {
    assert.ok(validStatuses.has(cap.status), `expected valid status, got ${cap.status}`);
  }
});

test('deriveCapabilitiesHeuristic: ids are unique', () => {
  const caps = deriveCapabilitiesHeuristic(sampleProfile);
  const ids = caps.map((c) => c.id);
  assert.equal(ids.length, new Set(ids).size, 'capability ids must be unique');
});

test('deriveCapabilitiesHeuristic: count ≤ 8', () => {
  const caps = deriveCapabilitiesHeuristic(sampleProfile);
  assert.ok(caps.length <= 8, `expected ≤8 capabilities, got ${caps.length}`);
});

// ── normalizeCapabilities ────────────────────────────────────────────────────

test('normalizeCapabilities: drops entry with no label', () => {
  const raw = [
    { id: 'cap-1', label: 'Data Analysis', status: 'partial', evidence: [] },
    { id: 'cap-2', label: '', status: 'direction', evidence: [] },  // no label
    { id: 'cap-3', status: 'direction', evidence: [] },             // missing label
  ];
  const caps = normalizeCapabilities(raw);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].label, 'Data Analysis');
});

test('normalizeCapabilities: caps count at 12', () => {
  const raw = Array.from({ length: 20 }, (_, i) => ({
    id: `cap-${i}`,
    label: `Capability ${i}`,
    status: 'direction',
    evidence: [],
  }));
  const caps = normalizeCapabilities(raw);
  assert.equal(caps.length, 12);
});

test('normalizeCapabilities: clamps invalid status to direction', () => {
  const raw = [
    { id: 'cap-1', label: 'Valid', status: 'bogus', evidence: [] },
  ];
  const caps = normalizeCapabilities(raw);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].status, 'direction');
});

test('normalizeCapabilities: drops invalid evidence entries', () => {
  const raw = [
    {
      id: 'cap-1',
      label: 'Analysis',
      status: 'partial',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Analyst' },  // valid
        { kind: 'bogus', refId: 'exp-1', label: 'Bad kind' },       // invalid kind
        { kind: 'work', refId: 123, label: 'Bad refId type' },      // invalid refId
        { kind: 'artifact', refId: 'art-1' },                       // missing label
      ],
    },
  ];
  const caps = normalizeCapabilities(raw);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].evidence.length, 1);
  assert.equal(caps[0].evidence[0].refId, 'exp-0');
});

test('normalizeCapabilities: non-array input returns []', () => {
  assert.deepEqual(normalizeCapabilities(null), []);
  assert.deepEqual(normalizeCapabilities('string'), []);
  assert.deepEqual(normalizeCapabilities(42), []);
  assert.deepEqual(normalizeCapabilities(undefined), []);
});

// ── Profile integration ──────────────────────────────────────────────────────

test('emptyBeginnerProfile().capabilities deep-equals []', () => {
  const p = emptyBeginnerProfile();
  assert.deepEqual(p.capabilities, []);
});

test('normalizeBeginnerProfile with non-array capabilities → capabilities: []', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Eng' },
    capabilities: 'not-an-array',
  });
  assert.deepEqual(p.capabilities, []);
});

test('normalizeBeginnerProfile with valid capabilities array survives normalize', () => {
  const validCaps = [
    {
      id: 'cap-data',
      label: 'Data Analysis',
      status: 'partial',
      evidence: [{ kind: 'experience', refId: 'exp-0', label: 'Analyst' }],
    },
  ];
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Eng' },
    experience: [{ role: 'Analyst', organization: 'Acme', bullets: [] }],
    capabilities: validCaps,
  });
  assert.equal(p.capabilities?.length, 1);
  assert.equal(p.capabilities?.[0].label, 'Data Analysis');
  assert.equal(p.capabilities?.[0].status, 'partial');
});

// ── Non-Latin (CJK) labels: stable, unique ids (no silent drop / key collision) ─

test('deriveCapabilitiesHeuristic: distinct CJK roles get distinct, non-empty ids', () => {
  const profile = normalizeBeginnerProfile({
    home: { name: '小明' },
    experience: [
      { role: '数据分析', organization: '甲公司', bullets: [] },
      { role: '机器学习', organization: '乙公司', bullets: [] },
    ],
  });
  const caps = deriveCapabilitiesHeuristic(profile);
  assert.ok(caps.length >= 2, `expected ≥2 capabilities for two distinct CJK roles, got ${caps.length}`);
  const ids = caps.map((c) => c.id);
  assert.equal(ids.length, new Set(ids).size, 'ids must be unique (no cap- collision)');
  for (const id of ids) {
    assert.notEqual(id, 'cap-', "id must not collapse to bare 'cap-'");
    assert.ok(id.length > 'cap-'.length, `id ${id} must carry a stable token`);
  }
});

test('normalizeCapabilities: identical CJK labels without ids get unique ids', () => {
  const caps = normalizeCapabilities([
    { label: '数据分析', status: 'partial', evidence: [] },
    { label: '数据分析', status: 'partial', evidence: [] },
  ]);
  assert.equal(caps.length, 2);
  assert.notEqual(caps[0].id, caps[1].id, 'duplicate labels must not share an id');
  assert.notEqual(caps[0].id, 'cap-');
});

test('normalizeCapabilities: dedupes evidence by kind+refId', () => {
  const caps = normalizeCapabilities([
    {
      id: 'cap-x',
      label: 'Analysis',
      status: 'partial',
      evidence: [
        { kind: 'artifact', refId: 'art-1', label: 'Report' },
        { kind: 'artifact', refId: 'art-1', label: 'Report' }, // duplicate
        { kind: 'experience', refId: 'exp-0', label: 'Analyst' },
      ],
    },
  ]);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].evidence.length, 2, 'the duplicate artifact ref is collapsed');
});
