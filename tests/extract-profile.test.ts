/**
 * M1 moat slice — résumé → structured, citeable profile.
 *
 * The LLM output itself needs a real API key, so these tests cover the PLUMBING,
 * not extraction quality:
 *   - the route returns {configured:false} with no key (client falls back),
 *   - rejects an oversize body with 413,
 *   - rejects a missing/empty `text` with 400,
 *   - the parse→normalize seam (parseExtractedProfile) turns valid model JSON
 *     into a sanitized, capped BeginnerProfile (incl. code fences / stray prose),
 *     and returns null on malformed output (→ route answers {ok:false}),
 *   - mergeExtractedProfile enriches without clobbering the user's own input and
 *     normalizes the result.
 *
 * Extraction QUALITY (faithfulness — no invented entries, correct section
 * mapping) requires a keyed manual run and is out of scope for unit tests.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { POST, parseExtractedProfile } from '../app/api/extract-profile/route';
import { mergeExtractedProfile } from '../lib/profile/merge-extracted-profile';
import {
  emptyBeginnerProfile,
  normalizeBeginnerProfile,
} from '../lib/profile/beginner-profile';

function postExtract(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/extract-profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

/**
 * Run `fn` with BOTH Anthropic credentials forced unset (key + OAuth token),
 * restoring them afterwards — so the unconfigured path is deterministic even when
 * an ANTHROPIC_AUTH_TOKEN is present in the shell (e.g. after `ant auth login`).
 */
async function withoutApiKey(fn: () => Promise<void>) {
  const prevKey = process.env.ANTHROPIC_API_KEY;
  const prevToken = process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    await fn();
  } finally {
    if (prevKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevKey;
    if (prevToken === undefined) delete process.env.ANTHROPIC_AUTH_TOKEN;
    else process.env.ANTHROPIC_AUTH_TOKEN = prevToken;
  }
}

// ── Route: no-key fallback ───────────────────────────────────────────────────

test('route returns {configured:false} when no API key is set', async () => {
  await withoutApiKey(async () => {
    const res = await postExtract({ text: 'Ada Lovelace — analyst at Acme.' });
    assert.equal(res.status, 200);
    const data = (await res.json()) as Record<string, unknown>;
    assert.equal(data.configured, false);
    // No profile leaks on the unconfigured path.
    assert.equal('profile' in data, false);
  });
});

// ── Route: input validation ──────────────────────────────────────────────────

test('route rejects an oversize body with 413 (before any model call)', async () => {
  // Force the no-key state too, to prove the size cap trips FIRST (a real key
  // must never be hit by a 64KB+ payload).
  await withoutApiKey(async () => {
    const huge = 'x'.repeat(64 * 1024 + 1);
    const res = await postExtract({ text: huge });
    assert.equal(res.status, 413);
  });
});

test('route rejects a missing/empty text field with 400', async () => {
  await withoutApiKey(async () => {
    assert.equal((await postExtract({})).status, 400);
    assert.equal((await postExtract({ text: '   ' })).status, 400);
    assert.equal((await postExtract({ text: 42 })).status, 400);
  });
});

test('route rejects an invalid JSON body with 400', async () => {
  const res = await POST(
    new Request('http://localhost/api/extract-profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    }),
  );
  assert.equal(res.status, 400);
});

// ── parseExtractedProfile: valid model JSON → normalized profile ──────────────

test('parseExtractedProfile turns valid model JSON into a normalized profile', () => {
  const modelJson = JSON.stringify({
    home: { name: 'Ada Lovelace', headline: 'Analyst · London' },
    about: { summary: 'Mathematician and writer.' },
    education: [{ institution: 'Self-taught', qualification: 'Mathematics' }],
    experience: [
      { role: 'Analyst', organization: 'Babbage Lab', bullets: ['Wrote the first algorithm'] },
    ],
    works: [{ title: 'Notes on the Analytical Engine', link: 'https://example.com/notes' }],
  });

  const profile = parseExtractedProfile(modelJson);
  assert.ok(profile, 'parse should succeed');
  assert.equal(profile!.version, 1);
  assert.equal(profile!.home.name, 'Ada Lovelace');
  assert.equal(profile!.home.headline, 'Analyst · London');
  assert.equal(profile!.education.length, 1);
  assert.equal(profile!.experience.length, 1);
  assert.deepEqual(profile!.experience[0].bullets, ['Wrote the first algorithm']);
  assert.equal(profile!.works.length, 1);
  assert.equal(profile!.works[0].link, 'https://example.com/notes');
});

test('parseExtractedProfile strips a ```json code fence around the object', () => {
  const fenced = '```json\n{"home":{"name":"Bo","headline":"Dev"}}\n```';
  const profile = parseExtractedProfile(fenced);
  assert.ok(profile);
  assert.equal(profile!.home.name, 'Bo');
});

test('parseExtractedProfile locates the JSON object inside stray prose', () => {
  const messy = 'Sure! Here is the profile:\n{"home":{"name":"Cy","headline":""}}\nHope that helps.';
  const profile = parseExtractedProfile(messy);
  assert.ok(profile);
  assert.equal(profile!.home.name, 'Cy');
});

test('parseExtractedProfile sanitizes the model output through normalize (unsafe href dropped)', () => {
  const modelJson = JSON.stringify({
    home: { name: 'Eve' },
    works: [{ title: 'Sneaky', link: 'javascript:alert(1)' }],
  });
  const profile = parseExtractedProfile(modelJson);
  assert.ok(profile);
  // The work survives (it has a title) but the dangerous-scheme link is dropped.
  assert.equal(profile!.works.length, 1);
  assert.equal(profile!.works[0].link, undefined);
});

// ── parseExtractedProfile: malformed model output → null (route → {ok:false}) ──

test('parseExtractedProfile returns null on malformed model output', () => {
  assert.equal(parseExtractedProfile('not json at all, sorry'), null);
  assert.equal(parseExtractedProfile(''), null);
  assert.equal(parseExtractedProfile('```json\n{ broken: ,, }\n```'), null);
  // No object delimiters at all.
  assert.equal(parseExtractedProfile('[1, 2, 3]'), null);
});

// ── mergeExtractedProfile ────────────────────────────────────────────────────

test('mergeExtractedProfile fills blank scalar fields from extraction', () => {
  const current = emptyBeginnerProfile();
  const extracted = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Analyst' },
    about: { summary: 'Bio.' },
  });
  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.home.name, 'Ada');
  assert.equal(merged.home.headline, 'Analyst');
  assert.equal(merged.about.summary, 'Bio.');
});

test("mergeExtractedProfile does not clobber the user's own scalar input", () => {
  const current = normalizeBeginnerProfile({
    home: { name: 'My Real Name', headline: 'My headline' },
    about: { summary: 'My own bio.' },
  });
  const extracted = normalizeBeginnerProfile({
    home: { name: 'Model Guess', headline: 'Model headline' },
    about: { summary: 'Model bio.' },
  });
  const merged = mergeExtractedProfile(current, extracted);
  // The user's typed values win; extraction never overwrites them.
  assert.equal(merged.home.name, 'My Real Name');
  assert.equal(merged.home.headline, 'My headline');
  assert.equal(merged.about.summary, 'My own bio.');
});

test('mergeExtractedProfile appends extracted list entries after existing ones', () => {
  const current = normalizeBeginnerProfile({
    home: { name: 'Ada' },
    education: [{ institution: 'UNSW', qualification: 'BSc' }],
    experience: [{ role: 'Intern', organization: 'Acme', bullets: [] }],
    works: [{ title: 'Existing Project' }],
  });
  const extracted = normalizeBeginnerProfile({
    education: [{ institution: 'MIT', qualification: 'MSc' }],
    experience: [{ role: 'Engineer', organization: 'Globex', bullets: ['Shipped X'] }],
    works: [{ title: 'New Project' }],
  });
  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.education.length, 2);
  assert.equal(merged.education[0].institution, 'UNSW');
  assert.equal(merged.education[1].institution, 'MIT');
  assert.equal(merged.experience.length, 2);
  assert.equal(merged.works.length, 2);
  assert.deepEqual(merged.works.map((w) => w.title), ['Existing Project', 'New Project']);
});

test('mergeExtractedProfile unions about links and dedupes by href', () => {
  const current = normalizeBeginnerProfile({
    home: { name: 'Ada' },
    about: {
      summary: 'hi',
      links: [{ label: 'GitHub', href: 'https://github.com/ada' }],
    },
  });
  const extracted = normalizeBeginnerProfile({
    about: {
      summary: '',
      links: [
        { label: 'GitHub (dup)', href: 'https://github.com/ada' },
        { label: 'Site', href: 'https://ada.dev' },
      ],
    },
  });
  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.about.links.length, 2);
  assert.deepEqual(
    merged.about.links.map((l) => l.href).sort(),
    ['https://ada.dev', 'https://github.com/ada'],
  );
});

test('mergeExtractedProfile normalizes the result (unsafe extracted href dropped)', () => {
  const current = emptyBeginnerProfile();
  // Pass an un-normalized extracted object straight through the merge to prove
  // the final normalize pass runs even on the merge output.
  const extracted = {
    version: 1 as const,
    home: { name: 'Ada', headline: '' },
    about: { summary: '', links: [{ label: 'Evil', href: 'javascript:alert(1)' }] },
    education: [],
    experience: [],
    works: [],
  };
  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.about.links.length, 0, 'dangerous-scheme link dropped at the seam');
});

test("mergeExtractedProfile preserves the user's uploaded artifacts (the grounded-cited moat)", () => {
  // Regression: the merged literal used to omit `artifacts`, so the trailing
  // normalize defaulted it to [] — silently wiping an uploaded résumé's citeable
  // ArtifactRef on the primary upload→extract→merge path.
  const current = normalizeBeginnerProfile({
    home: { name: 'Ada' },
    artifacts: [
      {
        id: 'art-cv',
        name: 'cv.pdf',
        kind: 'pdf',
        label: 'CV / Résumé',
        extractedText: 'Ada Lovelace — analyst at Babbage Lab.',
      },
    ],
  });
  assert.equal(current.artifacts?.length, 1, 'precondition: current carries the artifact');

  // A typical extracted profile carries structured fields but no artifacts.
  const extracted = normalizeBeginnerProfile({
    home: { name: 'Ada Lovelace' },
    experience: [{ role: 'Analyst', organization: 'Babbage Lab', bullets: [] }],
  });

  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.artifacts?.length, 1, 'the uploaded artifact must survive the merge');
  assert.equal(merged.artifacts?.[0].id, 'art-cv');
  assert.equal(merged.artifacts?.[0].extractedText, 'Ada Lovelace — analyst at Babbage Lab.');
});

test("mergeExtractedProfile preserves the user's existing capabilities", () => {
  const current = normalizeBeginnerProfile({
    home: { name: 'Ada' },
    capabilities: [
      {
        id: 'cap-data',
        label: 'Data Analysis',
        status: 'partial',
        evidence: [{ kind: 'experience', refId: 'exp-0', label: 'Analyst' }],
      },
    ],
  });
  assert.equal(current.capabilities?.length, 1, 'precondition: current carries the capability');

  const extracted = normalizeBeginnerProfile({ home: { name: 'Ada Lovelace' } });
  const merged = mergeExtractedProfile(current, extracted);
  assert.equal(merged.capabilities?.length, 1, 'existing capabilities must survive the merge');
  assert.equal(merged.capabilities?.[0].label, 'Data Analysis');
});
