import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pushAllArtifacts, pushArtifact, ensureArtifactLocal, type ArtifactLocalPort,
} from '../lib/artifact/artifact-sync';
import type { ArtifactBlobGateway } from '../lib/artifact/artifact-blob-gateway';

const blob = (s: string) => new Blob([s]);

function fakePort(local: Record<string, Blob> = {}) {
  const store = new Map(Object.entries(local));
  const writes: string[] = [];
  return {
    store,
    writes,
    listIds: async () => [...store.keys()],
    has: async (id: string) => store.has(id),
    readBlob: async (id: string) => store.get(id) ?? null,
    writeBlob: async (id: string, b: Blob) => { store.set(id, b); writes.push(id); },
  } satisfies ArtifactLocalPort & { store: Map<string, Blob>; writes: string[] };
}

function fakeGateway(remote: string[] = [], opts: { throwOnUpload?: boolean; downloads?: Record<string, Blob> } = {}) {
  const ids = new Set(remote);
  const uploads: string[] = [];
  return {
    ids,
    uploads,
    listRemoteIds: async () => [...ids],
    upload: async (_u: string, id: string) => {
      if (opts.throwOnUpload) throw new Error('net');
      ids.add(id);
      uploads.push(id);
    },
    download: async (_u: string, id: string) => opts.downloads?.[id] ?? null,
    remove: async (_u: string, id: string) => { ids.delete(id); },
  } satisfies ArtifactBlobGateway & { ids: Set<string>; uploads: string[] };
}

test('pushAll uploads only the local ids missing from remote', async () => {
  const port = fakePort({ a: blob('a'), b: blob('b') });
  const gw = fakeGateway(['a']);
  await pushAllArtifacts('u1', gw, port);
  assert.deepEqual(gw.uploads, ['b']);
});

test('pushArtifact uploads one blob', async () => {
  const port = fakePort({ a: blob('a') });
  const gw = fakeGateway();
  await pushArtifact('u1', 'a', gw, port);
  assert.deepEqual(gw.uploads, ['a']);
});

test('pushArtifact no-ops when the local blob is missing', async () => {
  const port = fakePort();
  const gw = fakeGateway();
  await pushArtifact('u1', 'ghost', gw, port);
  assert.deepEqual(gw.uploads, []);
});

test('ensureArtifactLocal downloads + caches on a miss, returns true', async () => {
  const port = fakePort();
  const gw = fakeGateway([], { downloads: { a: blob('remote-a') } });
  const ok = await ensureArtifactLocal('u1', 'a', { name: 'A', kind: 'pdf' }, gw, port);
  assert.equal(ok, true);
  assert.deepEqual(port.writes, ['a']);
  assert.equal(port.store.has('a'), true);
});

test('ensureArtifactLocal no-ops on a hit, returns false, no download', async () => {
  const port = fakePort({ a: blob('local-a') });
  const gw = fakeGateway([], { downloads: { a: blob('remote-a') } });
  const ok = await ensureArtifactLocal('u1', 'a', { name: 'A', kind: 'pdf' }, gw, port);
  assert.equal(ok, false);
  assert.deepEqual(port.writes, []);
});

test('ensureArtifactLocal returns false when remote has no blob', async () => {
  const port = fakePort();
  const gw = fakeGateway();
  const ok = await ensureArtifactLocal('u1', 'missing', { name: 'M', kind: 'other' }, gw, port);
  assert.equal(ok, false);
  assert.deepEqual(port.writes, []);
});

test('error path: gateway throw is swallowed, local untouched', async () => {
  const port = fakePort({ a: blob('a') });
  const gw = fakeGateway([], { throwOnUpload: true });
  await assert.doesNotReject(() => pushAllArtifacts('u1', gw, port));
  assert.equal(port.store.has('a'), true);
});
