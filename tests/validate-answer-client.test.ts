import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRemote } from '../lib/onboarding/validate-answer-client';

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
