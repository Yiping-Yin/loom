import test from 'node:test';
import assert from 'node:assert/strict';
import { pickWinner } from '../lib/sync/merge';

const L = { value: 'local', updatedAt: 100 };
const R = { value: 'remote', updatedAt: 200 };

test('higher updatedAt wins', () => {
  assert.deepEqual(pickWinner(L, R), { value: 'remote', updatedAt: 200, source: 'remote' });
  assert.deepEqual(pickWinner(R, L), { value: 'remote', updatedAt: 200, source: 'local' });
});

test('tie prefers local (do not clobber a fresh local edit)', () => {
  const a = { value: 'local', updatedAt: 100 };
  const b = { value: 'remote', updatedAt: 100 };
  assert.equal(pickWinner(a, b)!.source, 'local');
});

test('null sides', () => {
  assert.deepEqual(pickWinner(L, null), { value: 'local', updatedAt: 100, source: 'local' });
  assert.deepEqual(pickWinner(null, R), { value: 'remote', updatedAt: 200, source: 'remote' });
  assert.equal(pickWinner(null, null), null);
});
