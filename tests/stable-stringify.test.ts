import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stableStringify } from '../lib/sync/stable-stringify';

test('key order independent', () => {
  assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
});

test('nested + arrays stable; arrays stay ordered', () => {
  assert.equal(stableStringify({ x: [{ b: 1, a: 2 }] }), stableStringify({ x: [{ a: 2, b: 1 }] }));
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test('primitives + null', () => {
  assert.equal(stableStringify(null), 'null');
  assert.equal(stableStringify(3), '3');
  assert.equal(stableStringify('x'), '"x"');
});
