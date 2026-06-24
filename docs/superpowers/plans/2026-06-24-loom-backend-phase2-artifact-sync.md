# LOOM Backend Phase 2 — Artifact Blob Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Sync uploaded-artifact blob bytes via Supabase Storage so "Open" works on every signed-in device; metadata already syncs in the profile.

**Architecture:** Private `artifacts` bucket, path `{userId}/{artifactId}`. Push-on-upload + push-on-sign-in (reconcile local−remote); lazy-pull-on-open via a transparent fallback seam in `artifact-store`. Testable engine (`artifact-sync`) over an `ArtifactLocalPort` + `ArtifactBlobGateway`, both fakeable. Inert without env.

**Tech Stack:** TypeScript, `@supabase/supabase-js` Storage, IndexedDB, `tsx --test`, React.

**Spec:** `docs/superpowers/specs/2026-06-24-loom-backend-phase2-artifact-sync-design.md`

## Global Constraints
- Inert without env: `artifactBlobGateway()` returns `null` when `getSupabaseClient()` is null → all sync no-ops.
- Local-first / best-effort: sync functions swallow errors, never throw to UI, leave local untouched.
- Zero edits to any Phase 1 OR Phase 3 file, and none to the artifact UI call sites.
- English-only; SSR-safe (`typeof window` guards); run tests `npx tsx --test <files>` from `~/dev/LOOM`.
- `ArtifactRef` (profile) = `{id,name,kind,label?,thumbnailDataUri?,extractedText?}` at `profile.artifacts[]`. `ArtifactMeta`/`ArtifactKind` from `lib/artifact/artifact-store.ts`.

---

### Task 1: `artifact-blob-gateway.ts` (Supabase Storage wrapper)

**Files:** Create `lib/artifact/artifact-blob-gateway.ts`; Test `tests/artifact-blob-gateway.test.ts`.

**Interfaces produced:** `ArtifactBlobGateway` (`listRemoteIds/upload/download/remove`); `artifactBlobGateway(): ArtifactBlobGateway | null`.

- [ ] **Step 1: failing test**
```ts
// tests/artifact-blob-gateway.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactBlobGateway } from '../lib/artifact/artifact-blob-gateway';

test('gateway is null when Supabase is unconfigured', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(artifactBlobGateway(), null);
});
```
- [ ] **Step 2: run → FAIL** `npx tsx --test tests/artifact-blob-gateway.test.ts` (module missing)
- [ ] **Step 3: implement**
```ts
// lib/artifact/artifact-blob-gateway.ts
import { getSupabaseClient } from '../supabase/client';

const BUCKET = 'artifacts';

export interface ArtifactBlobGateway {
  listRemoteIds(userId: string): Promise<string[]>;
  upload(userId: string, id: string, blob: Blob): Promise<void>;
  download(userId: string, id: string): Promise<Blob | null>;
  remove(userId: string, id: string): Promise<void>;
}

export function artifactBlobGateway(): ArtifactBlobGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const path = (userId: string, id: string) => `${userId}/${id}`;
  return {
    async listRemoteIds(userId) {
      const { data, error } = await sb.storage.from(BUCKET).list(userId);
      if (error) throw error;
      return (data ?? []).map((o: { name: string }) => o.name);
    },
    async upload(userId, id, blob) {
      const { error } = await sb.storage.from(BUCKET).upload(path(userId, id), blob, { upsert: true });
      if (error) throw error;
    },
    async download(userId, id) {
      const { data, error } = await sb.storage.from(BUCKET).download(path(userId, id));
      if (error) return null;
      return data ?? null;
    },
    async remove(userId, id) {
      const { error } = await sb.storage.from(BUCKET).remove([path(userId, id)]);
      if (error) throw error;
    },
  };
}
```
- [ ] **Step 4: run → PASS**
- [ ] **Step 5: commit** `git add lib/artifact/artifact-blob-gateway.ts tests/artifact-blob-gateway.test.ts && git commit -m "feat(artifact): Supabase Storage blob gateway (inert when unconfigured)"`

---

### Task 2: `artifact-events.ts`

**Files:** Create `lib/artifact/artifact-events.ts`; Test `tests/artifact-events.test.ts`.

**Interfaces produced:** `notifyArtifactAdded(id)`, `onArtifactAdded(cb)`, `notifyArtifactDeleted(id)`, `onArtifactDeleted(cb)`.

- [ ] **Step 1: failing test**
```ts
// tests/artifact-events.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyArtifactAdded, onArtifactAdded, notifyArtifactDeleted, onArtifactDeleted } from '../lib/artifact/artifact-events';

function withWindow(fn: () => void) {
  const handlers: Record<string, ((e: unknown) => void) | undefined> = {};
  (globalThis as Record<string, unknown>).window = {
    dispatchEvent: (e: { type: string }) => { handlers[e.type]?.(e); return true; },
    addEventListener: (t: string, cb: (e: unknown) => void) => { handlers[t] = cb; },
    removeEventListener: (t: string) => { handlers[t] = undefined; },
  };
  try { fn(); } finally { delete (globalThis as Record<string, unknown>).window; }
}

test('added/deleted events fire and unsubscribe; distinct channels', () => {
  withWindow(() => {
    let added = 0, deleted = 0;
    const offA = onArtifactAdded(() => { added += 1; });
    const offD = onArtifactDeleted(() => { deleted += 1; });
    notifyArtifactAdded('a'); notifyArtifactDeleted('b');
    assert.equal(added, 1); assert.equal(deleted, 1);
    offA(); offD();
    notifyArtifactAdded('a'); notifyArtifactDeleted('b');
    assert.equal(added, 1); assert.equal(deleted, 1);
  });
});
test('SSR no-op', () => { assert.doesNotThrow(() => notifyArtifactAdded('a')); });
```
- [ ] **Step 2: run → FAIL**
- [ ] **Step 3: implement** (mirror draft-events; one Event type per channel)
```ts
// lib/artifact/artifact-events.ts
const ADDED = 'loom:artifact-added';
const DELETED = 'loom:artifact-deleted';
function emit(type: string) {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new Event(type)); } catch { /* ignore */ }
}
function on(type: string, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}
export function notifyArtifactAdded(_id: string): void { emit(ADDED); }
export function onArtifactAdded(cb: () => void): () => void { return on(ADDED, cb); }
export function notifyArtifactDeleted(_id: string): void { emit(DELETED); }
export function onArtifactDeleted(cb: () => void): () => void { return on(DELETED, cb); }
```
> The `id` arg is kept for call-site clarity/future use; the hook re-reads state on any event. (If per-id is needed later, switch to CustomEvent detail.)
- [ ] **Step 4: run → PASS**
- [ ] **Step 5: commit** `git commit -m "feat(artifact): add/delete change events"`

---

### Task 3: `artifact-sync.ts` engine (the core, fully unit-tested)

**Files:** Create `lib/artifact/artifact-sync.ts`; Test `tests/artifact-sync.test.ts`.

**Interfaces produced:** `ArtifactMetaHint`, `ArtifactLocalPort`, `pushAllArtifacts`, `pushArtifact`, `ensureArtifactLocal`.

- [ ] **Step 1: failing test**
```ts
// tests/artifact-sync.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushAllArtifacts, pushArtifact, ensureArtifactLocal, type ArtifactLocalPort } from '../lib/artifact/artifact-sync';
import type { ArtifactBlobGateway } from '../lib/artifact/artifact-blob-gateway';

const blob = (s: string) => new Blob([s]);

function fakePort(local: Record<string, Blob> = {}) {
  const store = new Map(Object.entries(local));
  const writes: string[] = [];
  return {
    store, writes,
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
    ids, uploads,
    listRemoteIds: async () => [...ids],
    upload: async (_u: string, id: string) => { if (opts.throwOnUpload) throw new Error('net'); ids.add(id); uploads.push(id); },
    download: async (_u: string, id: string) => opts.downloads?.[id] ?? null,
    remove: async (_u: string, id: string) => { ids.delete(id); },
  } satisfies ArtifactBlobGateway & { ids: Set<string>; uploads: string[] };
}

test('pushAll uploads only the local ids missing from remote', async () => {
  const port = fakePort({ a: blob('a'), b: blob('b') });
  const gw = fakeGateway(['a']); // 'a' already remote
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

test('error path: gateway throw is swallowed, local untouched', async () => {
  const port = fakePort({ a: blob('a') });
  const gw = fakeGateway([], { throwOnUpload: true });
  await assert.doesNotReject(() => pushAllArtifacts('u1', gw, port));
  assert.equal(port.store.has('a'), true);
});
```
- [ ] **Step 2: run → FAIL**
- [ ] **Step 3: implement**
```ts
// lib/artifact/artifact-sync.ts
import type { ArtifactBlobGateway } from './artifact-blob-gateway';
import type { ArtifactKind } from './artifact-store';

export type ArtifactMetaHint = {
  name: string;
  kind: ArtifactKind;
  thumbnailDataUri?: string;
  extractedText?: string;
};

export interface ArtifactLocalPort {
  listIds(): Promise<string[]>;
  has(id: string): Promise<boolean>;
  readBlob(id: string): Promise<Blob | null>;
  writeBlob(id: string, blob: Blob, metaHint: ArtifactMetaHint): Promise<void>;
}

/** Push every local blob whose id is not yet in Storage. Best-effort. */
export async function pushAllArtifacts(userId: string, gateway: ArtifactBlobGateway, port: ArtifactLocalPort): Promise<void> {
  try {
    const [localIds, remoteIds] = await Promise.all([port.listIds(), gateway.listRemoteIds(userId)]);
    const remote = new Set(remoteIds);
    for (const id of localIds) {
      if (remote.has(id)) continue;
      const blob = await port.readBlob(id);
      if (blob) await gateway.upload(userId, id, blob);
    }
  } catch { /* best-effort; retry next sync */ }
}

/** Push one local blob. Best-effort. */
export async function pushArtifact(userId: string, id: string, gateway: ArtifactBlobGateway, port: ArtifactLocalPort): Promise<void> {
  try {
    const blob = await port.readBlob(id);
    if (blob) await gateway.upload(userId, id, blob);
  } catch { /* best-effort */ }
}

/** Ensure a blob is cached locally; download+cache on a miss. Returns whether it pulled. */
export async function ensureArtifactLocal(
  userId: string, id: string, metaHint: ArtifactMetaHint,
  gateway: ArtifactBlobGateway, port: ArtifactLocalPort,
): Promise<boolean> {
  try {
    if (await port.has(id)) return false;
    const blob = await gateway.download(userId, id);
    if (!blob) return false;
    await port.writeBlob(id, blob, metaHint);
    return true;
  } catch { return false; }
}
```
- [ ] **Step 4: run → PASS** (6 tests)
- [ ] **Step 5: commit** `git commit -m "feat(artifact): blob sync engine (push reconcile + lazy ensure-local)"`

---

### Task 4: `artifact-store.ts` additive exports + fallback seam

**Files:** Modify `lib/artifact/artifact-store.ts`. (No new unit test — IndexedDB-coupled, like the rest of this file; verified by typecheck + inert build + the engine tests that exercise the port shape.)

**Interfaces produced:** `getArtifactBlob(id)`, `hasArtifact(id)`, `putArtifactRecord(meta, blob)`, `setArtifactRemoteFallback(fn)`; `getArtifactObjectUrl` consults the fallback on a miss; `putArtifact` emits `notifyArtifactAdded`; `deleteArtifact` emits `notifyArtifactDeleted`.

- [ ] **Step 1: add the import + fallback pointer** near the top (after the file's header/`ArtifactKind`):
```ts
import { notifyArtifactAdded, notifyArtifactDeleted } from './artifact-events';

let remoteFallback: ((id: string) => Promise<boolean>) | null = null;
/** Install/clear the remote lazy-pull fallback used by getArtifactObjectUrl on a local miss. */
export function setArtifactRemoteFallback(fn: ((id: string) => Promise<boolean>) | null): void {
  remoteFallback = fn;
}
```
- [ ] **Step 2: add the three IndexedDB helpers** (next to the existing public API, reusing `openDb`/`STORE`/`ArtifactRecord`):
```ts
export async function hasArtifact(id: string): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getKey(id);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => resolve(false);
    });
  } finally { db.close(); }
}

export async function getArtifactBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const record = await new Promise<ArtifactRecord | undefined>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as ArtifactRecord | undefined);
      req.onerror = () => resolve(undefined);
    });
    return record?.blob ?? null;
  } finally { db.close(); }
}

export async function putArtifactRecord(meta: ArtifactMeta, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...meta, blob } as ArtifactRecord);
    await txDone(tx);
  } catch { /* best-effort cache */ } finally { db.close(); }
}
```
- [ ] **Step 3: wire the fallback into `getArtifactObjectUrl`** — after the `if (!record?.blob)` miss, before returning null, try the fallback then re-read:
```ts
    if (!record?.blob) {
      // Lazy-pull: if a remote fallback is installed, let it download + cache, then retry once.
      if (remoteFallback) {
        let pulled = false;
        try { pulled = await remoteFallback(id); } catch { pulled = false; }
        if (pulled) {
          const again = await new Promise<ArtifactRecord | undefined>((resolve) => {
            const tx2 = db.transaction(STORE, 'readonly');
            const req2 = tx2.objectStore(STORE).get(id);
            req2.onsuccess = () => resolve(req2.result as ArtifactRecord | undefined);
            req2.onerror = () => resolve(undefined);
          });
          if (again?.blob) { try { return URL.createObjectURL(again.blob); } catch { return null; } }
        }
      }
      return null;
    }
```
> NOTE the existing `getArtifactObjectUrl` closes the db in a `finally`; keep all reads on the same open `db` (the fallback caches via its own `openDb`, which is fine — IndexedDB allows concurrent connections). Adjust the surrounding code so `db` stays open through the retry read.
- [ ] **Step 4: emit events** — at the end of `putArtifact` (before `return meta`): `notifyArtifactAdded(meta.id);`. At the end of `deleteArtifact` (after the tx): `notifyArtifactDeleted(id);`.
- [ ] **Step 5: typecheck** `npm run typecheck` → exit 0.
- [ ] **Step 6: commit** `git commit -m "feat(artifact): store exports (blob/has/putRecord) + remote-pull fallback seam + change events"`

---

### Task 5: `use-artifact-sync.ts` hook + real local port

**Files:** Create `lib/artifact/use-artifact-sync.ts`; Test `tests/use-artifact-sync.test.ts` (helper-level).

**Interfaces produced:** `artifactLocalPort(): ArtifactLocalPort`; `useArtifactSync(): { session: AuthSession }`.

- [ ] **Step 1: failing test** (the pure port-builder + a meta-hint resolver are testable; the React effect is integration)
```ts
// tests/use-artifact-sync.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactMetaHintFor } from '../lib/artifact/use-artifact-sync';

test('artifactMetaHintFor reads name/kind from a profile ArtifactRef', () => {
  const profile = { artifacts: [{ id: 'a', name: 'CV.pdf', kind: 'pdf', extractedText: 'x' }] } as never;
  assert.deepEqual(artifactMetaHintFor(profile, 'a'), { name: 'CV.pdf', kind: 'pdf', thumbnailDataUri: undefined, extractedText: 'x' });
});

test('artifactMetaHintFor falls back to a minimal hint when the ref is absent', () => {
  assert.deepEqual(artifactMetaHintFor({ artifacts: [] } as never, 'ghost'), { name: 'ghost', kind: 'other' });
});
```
- [ ] **Step 2: run → FAIL**
- [ ] **Step 3: implement**
```ts
// lib/artifact/use-artifact-sync.ts
'use client';
import { useEffect, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { readBeginnerProfileLocal } from '../profile/profile-storage';
import type { BeginnerProfile } from '../profile/beginner-profile';
import {
  listArtifactMeta, getArtifactBlob, hasArtifact, putArtifactRecord,
  setArtifactRemoteFallback, type ArtifactKind,
} from './artifact-store';
import { artifactBlobGateway } from './artifact-blob-gateway';
import { onArtifactAdded, onArtifactDeleted } from './artifact-events';
import {
  pushAllArtifacts, pushArtifact, ensureArtifactLocal,
  type ArtifactLocalPort, type ArtifactMetaHint,
} from './artifact-sync';

const ALLOWED_KINDS: ArtifactKind[] = ['pdf', 'image', 'doc', 'other'];
function coerceKind(kind: string): ArtifactKind {
  return (ALLOWED_KINDS as string[]).includes(kind) ? (kind as ArtifactKind) : 'other';
}

/** Build a meta hint for caching a pulled blob, from the synced profile ArtifactRef. */
export function artifactMetaHintFor(profile: BeginnerProfile | null, id: string): ArtifactMetaHint {
  const ref = profile?.artifacts?.find((a) => a.id === id);
  if (!ref) return { name: id, kind: 'other' };
  return {
    name: ref.name || id,
    kind: coerceKind(ref.kind),
    thumbnailDataUri: ref.thumbnailDataUri,
    extractedText: ref.extractedText,
  };
}

export function artifactLocalPort(): ArtifactLocalPort {
  return {
    listIds: async () => (await listArtifactMeta()).map((m) => m.id),
    has: (id) => hasArtifact(id),
    readBlob: (id) => getArtifactBlob(id),
    writeBlob: async (id, blob, metaHint) => {
      await putArtifactRecord(
        { id, name: metaHint.name, kind: metaHint.kind, size: blob.size, addedAt: Date.now(),
          thumbnailDataUri: metaHint.thumbnailDataUri, extractedText: metaHint.extractedText },
        blob,
      );
    },
  };
}

export function useArtifactSync(): { session: AuthSession } {
  const [session, setSession] = useState<AuthSession>(null);
  useEffect(() => {
    let active = true;
    const gateway = artifactBlobGateway();
    const port = artifactLocalPort();

    const run = (userId: string) => { if (gateway) void pushAllArtifacts(userId, gateway, port); };

    const install = (userId: string) => {
      if (!gateway) return;
      setArtifactRemoteFallback((id) =>
        ensureArtifactLocal(userId, id, artifactMetaHintFor(readBeginnerProfileLocal(), id), gateway, port));
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) { install(s.userId); run(s.userId); } } });
    const offAuth = onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      if (s) { install(s.userId); run(s.userId); } else setArtifactRemoteFallback(null);
    });
    const offAdd = onArtifactAdded(() => { getSession().then((s) => { if (s && gateway) void pushAllArtifacts(s.userId, gateway, port); }); });
    const offDel = onArtifactDeleted(() => { /* remote remove handled below */ });
    const offDel2 = onArtifactDeleted(() => {
      getSession().then(async (s) => {
        if (!s || !gateway) return;
        const remote = new Set(await gateway.listRemoteIds(s.userId).catch(() => []));
        const local = new Set((await listArtifactMeta()).map((m) => m.id));
        for (const id of remote) if (!local.has(id)) await gateway.remove(s.userId, id).catch(() => {});
      });
    });
    const onFocus = () => { getSession().then((s) => { if (s) run(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false; offAuth(); offAdd(); offDel(); offDel2();
      setArtifactRemoteFallback(null);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);
  return { session };
}
```
> The delete handler reconciles remote-minus-local and removes orphans (a delete removes the local meta+blob, so the remote object becomes an orphan that this prunes). Simpler than threading the deleted id through the event; correct for owner-only single-user.
- [ ] **Step 4: run → PASS** (2 helper tests); then `npm run typecheck` → exit 0.
- [ ] **Step 5: commit** `git commit -m "feat(artifact): use-artifact-sync hook + local port (push, lazy-pull fallback, delete prune)"`

---

### Task 6: bucket SQL in `docs/supabase-setup.md`

- [ ] **Step 1:** append an "Optional — Phase 2: artifact file sync" section with the bucket+RLS SQL from the spec's Storage model.
- [ ] **Step 2: commit** `git commit -m "docs: Phase 2 artifacts Storage bucket + RLS"`

---

### Task 7: verify

- [ ] **Step 1:** `npx tsx --test tests/artifact-blob-gateway.test.ts tests/artifact-events.test.ts tests/artifact-sync.test.ts tests/use-artifact-sync.test.ts tests/supabase-client.test.ts` → all PASS.
- [ ] **Step 2:** existing artifact-touching tests for regression: `npx tsx --test tests/artifact-profile.test.tsx tests/capability-graph.test.ts tests/beginner-ask-corpus.test.ts` → PASS.
- [ ] **Step 3:** `npm run typecheck` → exit 0.
- [ ] **Step 4:** confirm inert build: `rm -rf .next-build && npm run build` with empty Supabase env → succeeds.

## Self-Review
- **Spec coverage:** Storage gateway (T1), events (T2), engine push/pull (T3), store seam+exports+events (T4), hook+port+fallback+delete (T5), SQL (T6), verify (T7). Strategy push-eager/pull-lazy ✓ (T3+T4+T5). No table ✓. Inert ✓ (T1 null → hook no-op). No Phase 1/3 edits ✓.
- **Type consistency:** `ArtifactLocalPort`/`ArtifactBlobGateway`/`ArtifactMetaHint` consistent T1/T3/T5. `getArtifactObjectUrl` retry reuses the open `db` (T4 note). `ArtifactMeta` fields match artifact-store.
- **Placeholder scan:** the T4 db-stays-open note + the delete-prune note are real implementation guidance, not placeholders.
