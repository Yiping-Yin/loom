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
  await withEnv('ANTHROPIC_API_KEY', undefined, async () => {
    const response = await ask({ question: 'What are your Python and C++ foundations?' });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as { configured?: boolean; citations?: unknown[] };
    // Identical to the pre-change owner contract: configured:false + real sources.
    assert.equal(payload.configured, false);
    assert.ok(Array.isArray(payload.citations) && payload.citations.length > 0);
  });
});

test('about-only beginner with NO key still degrades to configured:false (no confident answer)', async () => {
  await withEnv('ANTHROPIC_API_KEY', undefined, async () => {
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
