import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftsLocalPort, DRAFTS_TOMBSTONES_KEY } from '../lib/sync/drafts-local-port';
import { draftRecordsLocalPort, DRAFT_RECORDS_TOMBSTONES_KEY } from '../lib/sync/draft-records-local-port';

function withWindow(fn: (store: Map<string, string>) => void) {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  };
  try { fn(store); } finally { delete (globalThis as Record<string, unknown>).window; }
}

const draft = (id: string) => ({
  id,
  title: id,
  body: 'b',
  references: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
});

test('drafts port: list/upsert/remove round-trip on the v1 store', () => {
  withWindow(() => {
    const port = draftsLocalPort();
    assert.deepEqual(port.list(), []);
    port.upsert('a', draft('a'), Date.parse('2026-01-02T00:00:00.000Z'));
    assert.equal(port.list().length, 1);
    assert.equal(port.list()[0]?.id, 'a');
    assert.equal(port.list()[0]?.updatedAt, Date.parse('2026-01-02T00:00:00.000Z'));
    port.remove('a');
    assert.deepEqual(port.list(), []);
  });
});

test('drafts port: tombstone log round-trips and clears', () => {
  withWindow((store) => {
    const port = draftsLocalPort();
    store.set(DRAFTS_TOMBSTONES_KEY, JSON.stringify([{ id: 'a', deletedAt: 9 }]));
    assert.deepEqual(port.listTombstones(), [{ id: 'a', deletedAt: 9 }]);
    port.clearTombstone('a');
    assert.deepEqual(port.listTombstones(), []);
  });
});

test('drafts port: upsert persists the engine-supplied timestamp (no dual-source drift)', () => {
  withWindow(() => {
    const port = draftsLocalPort();
    const engineMs = Date.parse('2026-06-01T00:00:00.000Z');
    port.upsert('a', draft('a'), engineMs); // draft('a') has embedded updatedAt 2026-01-02
    assert.equal(port.list()[0]?.updatedAt, engineMs);
  });
});

test('drafts port: SSR-safe (no window) — empty + no throw', () => {
  const port = draftsLocalPort();
  assert.deepEqual(port.list(), []);
  assert.deepEqual(port.listTombstones(), []);
  port.upsert('a', draft('a'), 1);
  port.remove('a');
});

test('answer-records port: list/upsert/remove + tombstones', () => {
  withWindow((store) => {
    const port = draftRecordsLocalPort();
    const rec = {
      id: 'r1', title: 'T', answer: 'A', sourceLabels: [], sourceHrefs: [],
      draftUrl: '/digital-me', status: 'drafting' as const, updatedAt: '2026-01-02T00:00:00.000Z',
    };
    port.upsert('r1', rec, Date.parse(rec.updatedAt));
    assert.equal(port.list().length, 1);
    assert.equal(port.list()[0]?.id, 'r1');
    port.remove('r1');
    assert.deepEqual(port.list(), []);
    store.set(DRAFT_RECORDS_TOMBSTONES_KEY, JSON.stringify([{ id: 'r1', deletedAt: 3 }]));
    assert.deepEqual(port.listTombstones(), [{ id: 'r1', deletedAt: 3 }]);
  });
});
