/**
 * Grounding floor (MOAT-CRITICAL).
 *
 * The product promise is "Verified answers. Cited sources." A sparse beginner
 * profile (name + headline + summary, nothing citeable) must NOT yield a
 * confident, uncited answer. These tests prove:
 *   - countResolvableSources is the decision: owner > 0, about-only beginner = 0,
 *     beginner with a citeable section > 0.
 *   - the route refuses (grounded:false, reason:no-sources, empty citations) for
 *     the about-only case instead of streaming an answer.
 *   - the OWNER path is unchanged.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countResolvableSources,
  retrieveAskYipingSources,
} from '../lib/new-loom/ask-yiping';
import { beginnerCorpusContext } from '../lib/new-loom/beginner-ask-corpus';
import { normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import { POST } from '../app/api/ask/route';

// ── Decision logic: countResolvableSources ──────────────────────────────────

const aboutOnlyProfile = normalizeBeginnerProfile({
  home: { name: 'Sparse Sam', headline: 'Aspiring builder' },
  about: { summary: 'I am just getting started and have not added anything yet.' },
});

const citeableProfile = normalizeBeginnerProfile({
  home: { name: 'Ada Lovelace', headline: 'Software engineer' },
  about: { summary: 'Builder of analytical engines.' },
  experience: [
    {
      role: 'Quantitative Developer',
      organization: 'Optiver',
      bullets: ['Built market-making algorithms in Python.'],
    },
  ],
});

// M2b: a profile whose ONLY citeable proof is an uploaded artifact (+ a name).
// Before M2b this was "born refusing" — its only retrievable source was the
// non-citeable me-about block. The artifact source now counts toward the floor.
const artifactOnlyProfile = normalizeBeginnerProfile({
  home: { name: 'Grace Hopper', headline: '' },
  artifacts: [
    {
      id: 'af_blob_xyz',
      name: 'transcript.pdf',
      kind: 'pdf',
      label: 'Transcript',
      extractedText:
        'University academic transcript. COMP2511 Object-Oriented Design High Distinction.',
    },
  ],
});

test('owner retrieval always has resolvable sources (floor never trips)', () => {
  const sources = retrieveAskYipingSources('What are your C++ and Python foundations?');
  assert.ok(
    countResolvableSources(sources) > 0,
    'owner corpus must always yield ≥1 citeable source',
  );
});

test('about-only beginner profile yields ZERO resolvable sources', () => {
  const context = beginnerCorpusContext(aboutOnlyProfile);
  const sources = retrieveAskYipingSources('What have you worked on?', 6, context);
  assert.equal(
    countResolvableSources(sources, context.resolveCitation),
    0,
    'an about-only profile must have no citeable sources',
  );
  // The only retrieved source is the non-citeable me-about block.
  assert.ok(sources.length >= 1);
  assert.ok(sources.every((s) => context.resolveCitation(s.id) === null));
});

test('beginner with a citeable section yields > 0 resolvable sources', () => {
  const context = beginnerCorpusContext(citeableProfile);
  const sources = retrieveAskYipingSources('Tell me about your trading work.', 6, context);
  assert.ok(
    countResolvableSources(sources, context.resolveCitation) > 0,
    'a profile with an experience section must have ≥1 citeable source',
  );
});

test('M2b: an artifact-only profile is no longer born refusing — the floor counts it', () => {
  const context = beginnerCorpusContext(artifactOnlyProfile);
  const sources = retrieveAskYipingSources(
    'What does the transcript say about COMP2511?',
    6,
    context,
  );
  assert.ok(
    countResolvableSources(sources, context.resolveCitation) > 0,
    'an uploaded artifact must count toward the grounding floor',
  );
  // The resolvable source is the artifact, citing the real blob id.
  const cite = sources
    .map((s) => context.resolveCitation(s.id))
    .find((c) => c !== null);
  assert.ok(cite, 'a resolvable artifact citation exists');
  assert.equal(cite!.artifactId, 'af_blob_xyz');
});

// ── Route behavior: refuse for about-only, stream-eligible otherwise ─────────

function withEnv(key: string, value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const prev = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  return fn().finally(() => {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  });
}

/**
 * Run `fn` with BOTH Anthropic credentials cleared (key + OAuth token), so the
 * unconfigured path is deterministic even when an ANTHROPIC_AUTH_TOKEN is in the
 * shell (e.g. after `ant auth login`).
 */
function withoutCreds(fn: () => Promise<void>): Promise<void> {
  return withEnv('ANTHROPIC_API_KEY', undefined, () =>
    withEnv('ANTHROPIC_AUTH_TOKEN', undefined, fn),
  );
}

function ask(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

test('route returns grounded:false no-sources for an about-only beginner profile', async () => {
  // A key is set so we reach the configured path; the grounding floor returns
  // BEFORE any network call, so no real Anthropic request is made.
  await withEnv('ANTHROPIC_API_KEY', 'test-key', async () => {
    const response = await ask({
      question: 'What have you worked on?',
      profile: aboutOnlyProfile,
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
    const payload = (await response.json()) as {
      grounded?: boolean;
      reason?: string;
      citations?: unknown[];
    };
    assert.equal(payload.grounded, false, 'must signal not grounded');
    assert.equal(payload.reason, 'no-sources', 'must report the no-sources reason');
    assert.deepEqual(payload.citations, [], 'must carry empty citations');
  });
});

test('OWNER path is unchanged: no-key deploy still returns configured:false with citations', async () => {
  await withoutCreds(async () => {
    const response = await ask({ question: 'What are your Python and C++ foundations?' });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as { configured?: boolean; citations?: unknown[] };
    // Identical to the pre-change owner contract: configured:false + real sources.
    assert.equal(payload.configured, false);
    assert.ok(Array.isArray(payload.citations) && payload.citations.length > 0);
  });
});

test('about-only beginner with NO key still degrades to configured:false (no confident answer)', async () => {
  await withoutCreds(async () => {
    const response = await ask({
      question: 'What have you worked on?',
      profile: aboutOnlyProfile,
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as { configured?: boolean; citations?: unknown[] };
    // No key short-circuits to configured:false with empty (no citeable) sources —
    // still never a confident, uncited answer.
    assert.equal(payload.configured, false);
    assert.deepEqual(payload.citations, []);
  });
});

test('M2b: artifact-only profile with NO key surfaces the artifact citation (would-ground sources)', async () => {
  await withoutCreds(async () => {
    const response = await ask({
      question: 'What does the transcript say about COMP2511?',
      profile: artifactOnlyProfile,
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      configured?: boolean;
      citations?: { artifactId?: string; kind?: string }[];
    };
    assert.equal(payload.configured, false);
    // The would-ground sources include the artifact, carrying the real blob id +
    // its kind so the client can open the document — NOT empty as for about-only.
    assert.ok(Array.isArray(payload.citations) && payload.citations.length > 0);
    assert.ok(
      payload.citations!.some((c) => c.artifactId === 'af_blob_xyz' && c.kind === 'pdf'),
      'artifact citation present with blob id + kind',
    );
  });
});
