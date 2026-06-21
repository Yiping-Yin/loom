/**
 * T3 — /api/validate-answer (the optional LLM smart layer).
 *
 * These tests cover the PLUMBING and the pure parseValidation seam, not LLM
 * output quality (which needs a live key and is out of scope here):
 *   - no credential → {configured:false} (200),
 *   - oversize body (> 8 KB) → 413 (before creds matter),
 *   - invalid JSON body → 400; missing/empty answer → 400,
 *   - parseValidation(...) accept / clean / reask / fail-open cases.
 *
 * Run via: npm run test:contracts
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { POST, parseValidation } from '../app/api/validate-answer/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

function postValidate(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/validate-answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

/**
 * Run `fn` with EVERY Anthropic credential forced unset — the static API key,
 * the OAuth token, AND the LOOM_LLM_BACKEND=cli switch — restoring them
 * afterwards. isAnthropicConfigured() returns true for any of the three, so all
 * three must be cleared for the unconfigured path to be deterministic (e.g. after
 * `ant auth login` or with the CLI backend selected). Mirrors the cred-clearing
 * helper in tests/derive-capabilities-route.test.ts, extended for the cli backend.
 */
async function withoutApiKey(fn: () => Promise<void>) {
  const prevKey = process.env.ANTHROPIC_API_KEY;
  const prevToken = process.env.ANTHROPIC_AUTH_TOKEN;
  const prevBackend = process.env.LOOM_LLM_BACKEND;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.LOOM_LLM_BACKEND;
  try {
    await fn();
  } finally {
    if (prevKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevKey;
    if (prevToken === undefined) delete process.env.ANTHROPIC_AUTH_TOKEN;
    else process.env.ANTHROPIC_AUTH_TOKEN = prevToken;
    if (prevBackend === undefined) delete process.env.LOOM_LLM_BACKEND;
    else process.env.LOOM_LLM_BACKEND = prevBackend;
  }
}

// ── Route: no-credential fallback ─────────────────────────────────────────────

test('route returns {configured:false} when no credential is set', async () => {
  await withoutApiKey(async () => {
    const res = await postValidate({ field: 'name', question: "What's your name?", answer: 'Lin Wei' });
    assert.equal(res.status, 200);
    const data = (await res.json()) as Record<string, unknown>;
    assert.equal(data.configured, false);
    // No verdict leaks on the unconfigured path.
    assert.equal('verdict' in data, false);
  });
});

// ── Route: input validation ───────────────────────────────────────────────────

test('route rejects an oversize body with 413 (before any credential check)', async () => {
  await withoutApiKey(async () => {
    // A JSON body whose serialized length exceeds 8 KB.
    const hugeBody = JSON.stringify({ field: 'name', question: 'q', answer: 'x'.repeat(8 * 1024) });
    const res = await POST(
      new Request('http://localhost/api/validate-answer', {
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
    new Request('http://localhost/api/validate-answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    }),
  );
  assert.equal(res.status, 400);
});

test('route rejects a missing/empty answer with 400', async () => {
  const resMissing = await postValidate({ field: 'name', question: "What's your name?" });
  assert.equal(resMissing.status, 400);
  const resEmpty = await postValidate({ field: 'name', question: "What's your name?", answer: '   ' });
  assert.equal(resEmpty.status, 400);
});

// ── parseValidation: accept ──────────────────────────────────────────────────

test('parseValidation: a bare accept verdict → accept', () => {
  assert.deepEqual(parseValidation('{"verdict":"accept"}'), { verdict: 'accept' });
});

// ── parseValidation: clean ───────────────────────────────────────────────────

test('parseValidation: a fenced clean verdict → {clean, cleaned}', () => {
  const fenced = '```json\n{"verdict":"clean","cleaned":"Lin Wei"}\n```';
  assert.deepEqual(parseValidation(fenced), { verdict: 'clean', cleaned: 'Lin Wei' });
});

test('parseValidation: a clean verdict with NO cleaned value fails open to accept', () => {
  assert.deepEqual(parseValidation('{"verdict":"clean"}'), { verdict: 'accept' });
});

// ── parseValidation: reask ───────────────────────────────────────────────────

test('parseValidation: a reask verdict carries the hint', () => {
  const result = parseValidation('{"verdict":"reask","hint":"Just your name."}');
  assert.equal(result.verdict, 'reask');
  assert.equal(result.hint, 'Just your name.');
});

test('parseValidation: a reask verdict with no hint → {verdict:reask}', () => {
  // The route emits an explicit hint:undefined when no hint is present; under
  // node:assert/strict that key is significant, so assert the real shape.
  assert.deepEqual(parseValidation('{"verdict":"reask"}'), { verdict: 'reask', hint: undefined });
});

test('parseValidation: an unknown verdict fails open to accept', () => {
  assert.deepEqual(parseValidation('{"verdict":"banana"}'), { verdict: 'accept' });
});

// ── parseValidation: fail-open ───────────────────────────────────────────────

test('parseValidation: non-JSON input fails open to accept', () => {
  assert.deepEqual(parseValidation('not json'), { verdict: 'accept' });
});
