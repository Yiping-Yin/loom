import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AsyncCollectionSync, lwwMerge,
  type AsyncCollectionLocalPort, type AsyncCollectionGateway, type AsyncCollectionMapper, type RecordMerge,
} from '../lib/sync/async-collection-sync';

type Doc = { id: string; n: number };
const mapper: AsyncCollectionMapper<Doc> = {
  toData: (v) => v,
  fromData: (d) => (d && typeof d === 'object' && typeof (d as Doc).id === 'string' ? (d as Doc) : null),
};

function fakePort(seed: Array<{ id: string; value: Doc; updatedAt: number }> = [], tombs: Array<{ id: string; deletedAt: number }> = []) {
  const items = new Map(seed.map((i) => [i.id, i]));
  const t = new Map(tombs.map((x) => [x.id, x]));
  const writes: string[] = [];
  return {
    items, t, writes,
    list: async () => [...items.values()],
    upsert: async (id: string, value: Doc, updatedAt: number) => { items.set(id, { id, value, updatedAt }); writes.push(id); },
    remove: async (id: string) => { items.delete(id); },
    listTombstones: async () => [...t.values()],
    clearTombstone: async (id: string) => { t.delete(id); },
  } as AsyncCollectionLocalPort<Doc> & { items: Map<string, { id: string; value: Doc; updatedAt: number }>; t: Map<string, { id: string; deletedAt: number }>; writes: string[] };
}

function fakeGw(seed: Array<{ id: string; data: unknown; deleted: boolean; updatedAt: number }> = [], opts: { throwOnUpsert?: boolean } = {}) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const upserts: string[] = [];
  return {
    rows, upserts,
    fetchAll: async () => [...rows.values()],
    upsert: async (_u: string, id: string, data: unknown, deleted: boolean, updatedAt: number) => {
      if (opts.throwOnUpsert) throw new Error('net');
      rows.set(id, { id, data, deleted, updatedAt }); upserts.push(id);
    },
  } as AsyncCollectionGateway & { rows: Map<string, { id: string; data: unknown; deleted: boolean; updatedAt: number }>; upserts: string[] };
}

const lww = lwwMerge<Doc>();

test('push local-only', async () => {
  const p = fakePort([{ id: 'a', value: { id: 'a', n: 1 }, updatedAt: 5 }]); const g = fakeGw();
  await new AsyncCollectionSync(g, p, mapper, lww).syncOnce('u');
  assert.equal(g.rows.get('a')?.deleted, false);
});

test('pull remote-only', async () => {
  const p = fakePort(); const g = fakeGw([{ id: 'b', data: { id: 'b', n: 2 }, deleted: false, updatedAt: 3 }]);
  await new AsyncCollectionSync(g, p, mapper, lww).syncOnce('u');
  assert.equal(p.items.get('b')?.value.n, 2);
});

test('lww newer wins', async () => {
  const p = fakePort([{ id: 'a', value: { id: 'a', n: 1 }, updatedAt: 1 }]);
  const g = fakeGw([{ id: 'a', data: { id: 'a', n: 9 }, deleted: false, updatedAt: 9 }]);
  await new AsyncCollectionSync(g, p, mapper, lww).syncOnce('u');
  assert.equal(p.items.get('a')?.value.n, 9);
});

test('custom merge applied on present∧present', async () => {
  const sumMerge: RecordMerge<Doc> = (l, r) => (l && r ? { value: { id: l.value.id, n: l.value.n + r.value.n }, updatedAt: Math.max(l.updatedAt, r.updatedAt) } : (l ?? r));
  const p = fakePort([{ id: 'a', value: { id: 'a', n: 1 }, updatedAt: 5 }]);
  const g = fakeGw([{ id: 'a', data: { id: 'a', n: 10 }, deleted: false, updatedAt: 6 }]);
  await new AsyncCollectionSync(g, p, mapper, sumMerge).syncOnce('u');
  assert.equal(p.items.get('a')?.value.n, 11);
});

test('local tombstone pushes remote tombstone', async () => {
  const p = fakePort([], [{ id: 'a', deletedAt: 30 }]);
  const g = fakeGw([{ id: 'a', data: { id: 'a', n: 1 }, deleted: false, updatedAt: 10 }]);
  await new AsyncCollectionSync(g, p, mapper, lww).syncOnce('u');
  assert.equal(g.rows.get('a')?.deleted, true);
});

test('error path: upsert throw -> status error, local untouched', async () => {
  const p = fakePort([{ id: 'a', value: { id: 'a', n: 1 }, updatedAt: 5 }]);
  const g = fakeGw([], { throwOnUpsert: true });
  const s = await new AsyncCollectionSync(g, p, mapper, lww).syncOnce('u');
  assert.equal(s, 'error');
  assert.equal(p.items.get('a')?.value.n, 1);
});
