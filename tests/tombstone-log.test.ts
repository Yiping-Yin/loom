import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendTombstone, readTombstones, clearTombstone, TRACE_TOMBSTONES_KEY } from '../lib/sync/tombstone-log';

function withWindow(fn: () => void) {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  };
  try { fn(); } finally { delete (globalThis as Record<string, unknown>).window; }
}

test('append then read; dedup by id keeps the latest deletedAt; clear removes', () => {
  withWindow(() => {
    appendTombstone(TRACE_TOMBSTONES_KEY, 'a', 10);
    appendTombstone(TRACE_TOMBSTONES_KEY, 'b', 20);
    appendTombstone(TRACE_TOMBSTONES_KEY, 'a', 30); // same id -> dedup, keep latest
    const t = readTombstones(TRACE_TOMBSTONES_KEY);
    assert.equal(t.length, 2);
    assert.equal(t.find((x) => x.id === 'a')?.deletedAt, 30);
    clearTombstone(TRACE_TOMBSTONES_KEY, 'a');
    assert.deepEqual(readTombstones(TRACE_TOMBSTONES_KEY).map((x) => x.id), ['b']);
  });
});

test('append is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => appendTombstone(TRACE_TOMBSTONES_KEY, 'a', 1));
  assert.deepEqual(readTombstones(TRACE_TOMBSTONES_KEY), []);
});
