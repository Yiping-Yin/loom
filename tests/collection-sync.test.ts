import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CollectionSync,
  type CollectionLocalPort,
  type CollectionGateway,
  type CollectionMapper,
  type CollectionItem,
  type CollectionTombstone,
  type CollectionRow,
} from '../lib/sync/collection-sync';

type Doc = { id: string; text: string };

function fakePort(seed: CollectionItem<Doc>[] = [], tombs: CollectionTombstone[] = []) {
  const items = new Map(seed.map((i) => [i.id, i]));
  const tombstones = new Map(tombs.map((t) => [t.id, t]));
  return {
    items,
    tombstones,
    list: () => [...items.values()],
    upsert: (id: string, value: Doc, updatedAt: number) => { items.set(id, { id, value, updatedAt }); },
    remove: (id: string) => { items.delete(id); },
    listTombstones: () => [...tombstones.values()],
    clearTombstone: (id: string) => { tombstones.delete(id); },
  } satisfies CollectionLocalPort<Doc> & {
    items: Map<string, CollectionItem<Doc>>;
    tombstones: Map<string, CollectionTombstone>;
  };
}

function fakeGateway(seed: CollectionRow[] = [], opts: { throwOnUpsert?: boolean } = {}) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const upserts: CollectionRow[] = [];
  return {
    rows,
    upserts,
    fetchAll: async () => [...rows.values()],
    upsert: async (_u: string, id: string, data: unknown, deleted: boolean, updatedAt: number) => {
      if (opts.throwOnUpsert) throw new Error('network');
      const row = { id, data, deleted, updatedAt };
      rows.set(id, row);
      upserts.push(row);
    },
  } satisfies CollectionGateway & { rows: Map<string, CollectionRow>; upserts: CollectionRow[] };
}

const mapper: CollectionMapper<Doc> = {
  toData: (v) => v,
  fromData: (d) => (d && typeof d === 'object' && typeof (d as Doc).id === 'string' ? (d as Doc) : null),
};

test('push: local-only doc is upserted to remote', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'hi' }, updatedAt: 10 }]);
  const gw = fakeGateway();
  const status = await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(status, 'synced');
  assert.equal(gw.rows.get('a')?.deleted, false);
  assert.deepEqual(gw.rows.get('a')?.data, { id: 'a', text: 'hi' });
});

test('pull: remote-only doc is written locally', async () => {
  const port = fakePort();
  const gw = fakeGateway([{ id: 'b', data: { id: 'b', text: 'remote' }, deleted: false, updatedAt: 5 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.deepEqual(port.items.get('b')?.value, { id: 'b', text: 'remote' });
});

test('per-doc LWW: each doc resolved independently, no clobber', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'localA' }, updatedAt: 20 }]);
  const gw = fakeGateway([{ id: 'b', data: { id: 'b', text: 'remoteB' }, deleted: false, updatedAt: 7 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.get('a')?.value.text, 'localA');
  assert.equal(port.items.get('b')?.value.text, 'remoteB');
  assert.equal((gw.rows.get('a')?.data as Doc).text, 'localA');
});

test('newer remote edit wins over older local', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'old' }, updatedAt: 1 }]);
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'new' }, deleted: false, updatedAt: 9 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.get('a')?.value.text, 'new');
});

test('tie prefers local', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'local' }, updatedAt: 5 }]);
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'remote' }, deleted: false, updatedAt: 5 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.get('a')?.value.text, 'local');
});

test('delete: local tombstone pushes a remote tombstone and clears local tombstone', async () => {
  const port = fakePort([], [{ id: 'a', deletedAt: 30 }]);
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'x' }, deleted: false, updatedAt: 10 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(gw.rows.get('a')?.deleted, true);
  assert.equal(port.tombstones.has('a'), false);
  assert.equal(port.items.has('a'), false);
});

test('resurrect: remote edit newer than local delete wins', async () => {
  const port = fakePort([], [{ id: 'a', deletedAt: 10 }]);
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'back' }, deleted: false, updatedAt: 99 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.get('a')?.value.text, 'back');
  assert.equal(port.tombstones.has('a'), false);
});

test('remote tombstone removes a stale local doc', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'stale' }, updatedAt: 2 }]);
  const gw = fakeGateway([{ id: 'a', data: null, deleted: true, updatedAt: 50 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.has('a'), false);
});

test('no-op when both sides equal (no redundant upsert)', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'same' }, updatedAt: 5 }]);
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'same' }, deleted: false, updatedAt: 5 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(gw.upserts.length, 0);
});

test('error path: gateway upsert throws -> status error, local untouched, tombstone kept', async () => {
  const port = fakePort(
    [{ id: 'a', value: { id: 'a', text: 'local' }, updatedAt: 9 }],
    [{ id: 'z', deletedAt: 9 }],
  );
  const gw = fakeGateway([], { throwOnUpsert: true });
  const status = await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(status, 'error');
  assert.equal(port.items.get('a')?.value.text, 'local');
  assert.equal(port.tombstones.has('z'), true);
});

test('garbage remote row (maps to null) is treated as absent', async () => {
  const port = fakePort();
  const gw = fakeGateway([{ id: 'a', data: { nope: true }, deleted: false, updatedAt: 5 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.has('a'), false);
});

test('dominant tombstone over a present local item removes it and never resurrects', async () => {
  // id 'a' has BOTH a live local item (updatedAt=10) and a tombstone (deletedAt=30).
  const port = fakePort(
    [{ id: 'a', value: { id: 'a', text: 'x' }, updatedAt: 10 }],
    [{ id: 'a', deletedAt: 30 }],
  );
  const gw = fakeGateway([{ id: 'a', data: { id: 'a', text: 'x' }, deleted: false, updatedAt: 10 }]);
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.has('a'), false); // underlying item actually removed
  assert.equal(port.tombstones.has('a'), false);
  assert.equal(gw.rows.get('a')?.deleted, true); // remote tombstoned
  // A second sync must NOT resurrect the draft.
  await new CollectionSync<Doc>(gw, port, mapper).syncOnce('u1');
  assert.equal(port.items.has('a'), false);
  assert.equal(gw.rows.get('a')?.deleted, true);
});
