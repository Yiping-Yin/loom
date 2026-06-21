/**
 * T3 — Client derivation orchestration with heuristic fallback.
 *
 * Stubs global `fetch` per test case to exercise every branch of
 * buildCapabilities without any network or server dependency:
 *   - {ok:true, capabilities:[...]} (200) → returns the server capabilities.
 *   - {configured:false} (200)            → heuristic fallback.
 *   - 404 response                        → heuristic fallback.
 *   - fetch throws (offline)              → heuristic fallback.
 *   - {ok:false} (200)                   → heuristic fallback.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCapabilities } from '../lib/capability/derive-capabilities';
import {
  deriveCapabilitiesHeuristic,
  type BeginnerCapability,
} from '../lib/capability/capability-graph';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

// ── Sample profile rich enough that the heuristic returns ≥1 capability ──────

const sampleProfile: BeginnerProfile = {
  version: 1,
  home: { name: 'Ada Lovelace', headline: 'Data Analyst & Python Developer' },
  about: {
    summary: 'Experienced in data analysis, Python programming and research.',
    links: [],
  },
  education: [
    {
      institution: 'UNSW',
      qualification: 'BSc Mathematics',
      field: 'Statistics',
      bullets: [],
    } as BeginnerProfile['education'][number],
  ],
  experience: [
    {
      role: 'Data Analyst',
      organization: 'Acme Corp',
      bullets: [
        'Built a P&L dashboard in Python',
        'Conducted market research and analysis',
      ],
    },
  ],
  works: [
    {
      title: 'Options Greeks Visualiser',
      description: 'Interactive visualisation of options greeks using Python',
    },
  ],
  artifacts: [
    {
      id: 'art-1',
      name: 'analysis-report.pdf',
      kind: 'pdf',
      label: 'Data Analysis Report',
    },
  ],
};

// Verify the heuristic gives us ≥1 capability for this profile.
const heuristicResult = deriveCapabilitiesHeuristic(sampleProfile);
assert.ok(
  heuristicResult.length >= 1,
  `sample profile must yield ≥1 heuristic capabilities (got ${heuristicResult.length})`,
);

// ── Helpers ──────────────────────────────────────────────────────────────────

type FetchStub = (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function installFetch(stub: FetchStub): void {
  (globalThis as unknown as Record<string, unknown>).fetch = stub;
}

function restoreFetch(original: typeof fetch | undefined): void {
  if (original === undefined) {
    delete (globalThis as unknown as Record<string, unknown>).fetch;
  } else {
    (globalThis as unknown as Record<string, unknown>).fetch = original;
  }
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('{ok:true, capabilities:[...]} (200) → returns those capabilities (normalized)', async () => {
  const serverCapabilities: BeginnerCapability[] = [
    {
      id: 'cap-python-programming',
      label: 'Python Programming',
      status: 'strong',
      evidence: [
        { kind: 'experience', refId: 'exp-0', label: 'Data Analyst at Acme Corp' },
        { kind: 'artifact', refId: 'art-1', label: 'Data Analysis Report' },
      ],
      note: 'Core language used in most projects',
    },
  ];

  const originalFetch = (globalThis as unknown as Record<string, unknown>).fetch as typeof fetch | undefined;
  installFetch(async () => makeJsonResponse({ ok: true, capabilities: serverCapabilities }));

  try {
    const result = await buildCapabilities(sampleProfile);
    assert.equal(result.length, 1, 'should return exactly 1 capability from server');
    assert.equal(result[0].id, 'cap-python-programming');
    assert.equal(result[0].label, 'Python Programming');
    assert.equal(result[0].status, 'strong');
  } finally {
    restoreFetch(originalFetch);
  }
});

test('{configured:false} (200) → returns deriveCapabilitiesHeuristic(profile)', async () => {
  const originalFetch = (globalThis as unknown as Record<string, unknown>).fetch as typeof fetch | undefined;
  installFetch(async () => makeJsonResponse({ configured: false }));

  try {
    const result = await buildCapabilities(sampleProfile);
    const expected = deriveCapabilitiesHeuristic(sampleProfile);
    assert.deepEqual(result, expected, '{configured:false} should return heuristic result');
    assert.ok(result.length >= 1, 'fallback should yield ≥1 capability');
  } finally {
    restoreFetch(originalFetch);
  }
});

test('404 response → returns deriveCapabilitiesHeuristic(profile)', async () => {
  const originalFetch = (globalThis as unknown as Record<string, unknown>).fetch as typeof fetch | undefined;
  installFetch(async () => new Response('Not Found', { status: 404 }));

  try {
    const result = await buildCapabilities(sampleProfile);
    const expected = deriveCapabilitiesHeuristic(sampleProfile);
    assert.deepEqual(result, expected, '404 should return heuristic result');
    assert.ok(result.length >= 1, 'fallback should yield ≥1 capability');
  } finally {
    restoreFetch(originalFetch);
  }
});

test('fetch throws (offline) → returns deriveCapabilitiesHeuristic(profile)', async () => {
  const originalFetch = (globalThis as unknown as Record<string, unknown>).fetch as typeof fetch | undefined;
  installFetch(async () => {
    throw new TypeError('Failed to fetch');
  });

  try {
    const result = await buildCapabilities(sampleProfile);
    const expected = deriveCapabilitiesHeuristic(sampleProfile);
    assert.deepEqual(result, expected, 'thrown fetch should return heuristic result');
    assert.ok(result.length >= 1, 'fallback should yield ≥1 capability');
  } finally {
    restoreFetch(originalFetch);
  }
});

test('{ok:false} (200) → returns deriveCapabilitiesHeuristic(profile)', async () => {
  const originalFetch = (globalThis as unknown as Record<string, unknown>).fetch as typeof fetch | undefined;
  installFetch(async () => makeJsonResponse({ ok: false }));

  try {
    const result = await buildCapabilities(sampleProfile);
    const expected = deriveCapabilitiesHeuristic(sampleProfile);
    assert.deepEqual(result, expected, '{ok:false} should return heuristic result');
    assert.ok(result.length >= 1, 'fallback should yield ≥1 capability');
  } finally {
    restoreFetch(originalFetch);
  }
});
