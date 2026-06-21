import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRemote, validateAnswerRemote } from '../lib/onboarding/validate-answer-client';

// ── validateAnswerRemote: fail-open fetch ─────────────────────────────────────
// Mirrors the global.fetch override pattern in tests/anthropic-http.test.ts:
// save/restore globalThis.fetch in try/finally so the stub never leaks.

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function withFetch(stub: typeof globalThis.fetch, fn: () => Promise<void>) {
  const original = globalThis.fetch;
  try {
    (globalThis as any).fetch = stub;
    await fn();
  } finally {
    globalThis.fetch = original;
  }
}

test('validateAnswerRemote fails open to accept on a non-ok response (404)', async () => {
  await withFetch(async () => new Response('nope', { status: 404 }), async () => {
    assert.deepEqual(
      await validateAnswerRemote('name', "What's your name?", 'Lin Wei'),
      { verdict: 'accept' },
    );
  });
});

test('validateAnswerRemote fails open to accept on a 200 whose body is not JSON', async () => {
  await withFetch(
    async () => new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }),
    async () => {
      assert.deepEqual(
        await validateAnswerRemote('name', "What's your name?", 'Lin Wei'),
        { verdict: 'accept' },
      );
    },
  );
});

test('validateAnswerRemote fails open to accept when {configured:false}', async () => {
  await withFetch(async () => jsonResponse({ configured: false }), async () => {
    assert.deepEqual(
      await validateAnswerRemote('name', "What's your name?", 'Lin Wei'),
      { verdict: 'accept' },
    );
  });
});

test('validateAnswerRemote fails open to accept on a thrown fetch (network error)', async () => {
  await withFetch(async () => { throw new Error('network down'); }, async () => {
    assert.deepEqual(
      await validateAnswerRemote('name', "What's your name?", 'Lin Wei'),
      { verdict: 'accept' },
    );
  });
});

test('validateAnswerRemote passes through a clean verdict with cleaned value', async () => {
  await withFetch(async () => jsonResponse({ verdict: 'clean', cleaned: 'X' }), async () => {
    assert.deepEqual(
      await validateAnswerRemote('name', "What's your name?", 'x'),
      { verdict: 'clean', cleaned: 'X' },
    );
  });
});

test('validateAnswerRemote passes through a reask verdict with hint', async () => {
  await withFetch(async () => jsonResponse({ verdict: 'reask', hint: 'Y' }), async () => {
    assert.deepEqual(
      await validateAnswerRemote('name', "What's your name?", 'huh?'),
      { verdict: 'reask', hint: 'Y' },
    );
  });
});

// ── resolveRemote: pure verdict → advance/reask ───────────────────────────────

test('reask → nudge with key + hint', () => {
  assert.deepEqual(resolveRemote({ verdict: 'reask', hint: 'Just your name.' }, 'name', 'huh?'),
    { nudge: true, key: 'name', hint: 'Just your name.' });
});
test('clean with cleaned → advance with cleaned value', () => {
  assert.deepEqual(resolveRemote({ verdict: 'clean', cleaned: 'Lin Wei' }, 'name', 'lin wei'),
    { nudge: false, answer: 'Lin Wei' });
});
test('clean without cleaned → advance with original answer', () => {
  assert.deepEqual(resolveRemote({ verdict: 'clean' }, 'name', 'Lin Wei'),
    { nudge: false, answer: 'Lin Wei' });
});
test('accept → advance with original answer', () => {
  assert.deepEqual(resolveRemote({ verdict: 'accept' }, 'name', 'Lin Wei'),
    { nudge: false, answer: 'Lin Wei' });
});
