# LOOM Backend Phase 3 — Studio Drafts Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloud-sync the two Studio draft collections (`loom.new.drafts.v1`, `loom.new.draft-records.v1`) per-document via a new generic collection-sync engine, leaving Phase 1 profile sync untouched.

**Architecture:** New generic `CollectionSync<T>` (gateway + local-port + mapper) reverse-reuses `pickWinner` from `merge.ts`. Per-document rows with soft-delete tombstones. In-page `supabase-js` on web + macOS static app; inert without `NEXT_PUBLIC_SUPABASE_*`. A `use-drafts-sync` hook mirrors `useProfileSync` (sign-in / focus / debounced change-push).

**Tech Stack:** TypeScript, Next 16, `@supabase/supabase-js`, `tsx --test` (node:test), React.

**Spec:** `docs/superpowers/specs/2026-06-24-loom-backend-phase3-drafts-sync-design.md`

## Global Constraints

- **Inert without env:** every gateway returns `null` when `getSupabaseClient()` is `null`; sync no-ops; LOOM stays 100% local. Existing contract tests stay green.
- **Zero edits to Phase 1 sync/auth files:** `lib/sync/{merge,profile-sync,profile-gateway,profile-mapper,local-store-port,use-profile-sync,pending-queue}.ts`, `lib/auth/*`, `lib/profile/profile-events.ts`, `lib/supabase/client.ts` — read/import only.
- **Local-first:** any failure leaves local untouched and returns `'error'`; never throw to UI.
- **Tie → local** in all LWW (matches `pickWinner`).
- **Product is English-only:** no CJK in any source/string.
- **Run tests with:** `npx tsx --test <files>` from `~/dev/LOOM`.
- **SyncStatus** type is imported from `./profile-sync` (`'idle'|'syncing'|'synced'|'offline'|'error'`).

---

### Task 1: Generic `collection-sync.ts` engine

**Files:**
- Create: `lib/sync/collection-sync.ts`
- Test: `tests/collection-sync.test.ts`

**Interfaces:**
- Consumes: `pickWinner`, `Stamped<T>` from `lib/sync/merge.ts`; `SyncStatus` from `lib/sync/profile-sync.ts`.
- Produces: `CollectionItem<T>`, `CollectionTombstone`, `CollectionLocalPort<T>`, `CollectionRow`, `CollectionGateway`, `CollectionMapper<T>`, `class CollectionSync<T> { constructor(gateway, port, mapper); syncOnce(userId): Promise<SyncStatus> }`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/collection-sync.test.ts
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
    items, tombstones,
    list: () => [...items.values()],
    upsert: (id: string, value: Doc, updatedAt: number) => { items.set(id, { id, value, updatedAt }); },
    remove: (id: string) => { items.delete(id); },
    listTombstones: () => [...tombstones.values()],
    clearTombstone: (id: string) => { tombstones.delete(id); },
  } satisfies CollectionLocalPort<Doc> & { items: Map<string, CollectionItem<Doc>>; tombstones: Map<string, CollectionTombstone> };
}

function fakeGateway(seed: CollectionRow[] = [], opts: { throwOnUpsert?: boolean } = {}) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const upserts: CollectionRow[] = [];
  return {
    rows, upserts,
    fetchAll: async () => [...rows.values()],
    upsert: async (_u: string, id: string, data: unknown, deleted: boolean, updatedAt: number) => {
      if (opts.throwOnUpsert) throw new Error('network');
      const row = { id, data, deleted, updatedAt };
      rows.set(id, row); upserts.push(row);
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
  assert.equal(port.items.get('a')?.value.text, 'localA'); // kept
  assert.equal(port.items.get('b')?.value.text, 'remoteB'); // pulled
  assert.equal(gw.rows.get('a')?.data && (gw.rows.get('a')!.data as Doc).text, 'localA'); // pushed
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

test('error path: gateway upsert throws → status error, local untouched, tombstone kept', async () => {
  const port = fakePort([{ id: 'a', value: { id: 'a', text: 'local' }, updatedAt: 9 }], [{ id: 'z', deletedAt: 9 }]);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/collection-sync.test.ts`
Expected: FAIL — cannot find module `../lib/sync/collection-sync`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/sync/collection-sync.ts
import { pickWinner, type Stamped } from './merge';
import type { SyncStatus } from './profile-sync';

export interface CollectionItem<T> { id: string; value: T; updatedAt: number; }
export interface CollectionTombstone { id: string; deletedAt: number; }

export interface CollectionLocalPort<T> {
  list(): CollectionItem<T>[];
  upsert(id: string, value: T, updatedAt: number): void;
  remove(id: string): void;
  listTombstones(): CollectionTombstone[];
  clearTombstone(id: string): void;
}

export interface CollectionRow { id: string; data: unknown; deleted: boolean; updatedAt: number; }

export interface CollectionGateway {
  fetchAll(userId: string): Promise<CollectionRow[]>;
  upsert(userId: string, id: string, data: unknown, deleted: boolean, updatedAt: number): Promise<void>;
}

export interface CollectionMapper<T> { toData(value: T): unknown; fromData(data: unknown): T | null; }

type Side<T> =
  | { kind: 'present'; value: T; updatedAt: number }
  | { kind: 'deleted'; updatedAt: number }
  | { kind: 'absent' };

export class CollectionSync<T> {
  constructor(
    private gateway: CollectionGateway,
    private port: CollectionLocalPort<T>,
    private mapper: CollectionMapper<T>,
  ) {}

  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const remoteRows = await this.gateway.fetchAll(userId);
      const local = new Map<string, CollectionItem<T>>();
      for (const it of this.port.list()) local.set(it.id, it);
      const tombs = new Map<string, CollectionTombstone>();
      for (const t of this.port.listTombstones()) tombs.set(t.id, t);
      const remote = new Map<string, CollectionRow>();
      for (const r of remoteRows) remote.set(r.id, r);

      const ids = new Set<string>([...local.keys(), ...tombs.keys(), ...remote.keys()]);
      for (const id of ids) {
        await this.reconcile(userId, id, this.localSide(id, local, tombs), this.remoteSide(id, remote));
      }
      return 'synced';
    } catch {
      return 'error';
    }
  }

  private localSide(id: string, local: Map<string, CollectionItem<T>>, tombs: Map<string, CollectionTombstone>): Side<T> {
    const item = local.get(id);
    const tomb = tombs.get(id);
    if (tomb && item) {
      return tomb.deletedAt >= item.updatedAt
        ? { kind: 'deleted', updatedAt: tomb.deletedAt }
        : { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    }
    if (tomb) return { kind: 'deleted', updatedAt: tomb.deletedAt };
    if (item) return { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    return { kind: 'absent' };
  }

  private remoteSide(id: string, remote: Map<string, CollectionRow>): Side<T> {
    const row = remote.get(id);
    if (!row) return { kind: 'absent' };
    if (row.deleted) return { kind: 'deleted', updatedAt: row.updatedAt };
    const value = this.mapper.fromData(row.data);
    if (value === null) return { kind: 'absent' };
    return { kind: 'present', value, updatedAt: row.updatedAt };
  }

  private async reconcile(userId: string, id: string, local: Side<T>, remote: Side<T>): Promise<void> {
    const ls: Stamped<Side<T>> | null = local.kind === 'absent' ? null : { value: local, updatedAt: local.updatedAt };
    const rs: Stamped<Side<T>> | null = remote.kind === 'absent' ? null : { value: remote, updatedAt: remote.updatedAt };
    const winner = pickWinner(ls, rs);
    if (!winner) return;
    const truth = winner.value;

    const remoteMatches =
      (truth.kind === 'present' && remote.kind === 'present' && remote.updatedAt === truth.updatedAt) ||
      (truth.kind === 'deleted' && remote.kind === 'deleted' && remote.updatedAt === truth.updatedAt);
    if (!remoteMatches) {
      if (truth.kind === 'present') {
        await this.gateway.upsert(userId, id, this.mapper.toData(truth.value), false, truth.updatedAt);
      } else if (truth.kind === 'deleted') {
        await this.gateway.upsert(userId, id, null, true, truth.updatedAt);
      }
    }

    if (truth.kind === 'present') {
      const localMatches = local.kind === 'present' && local.updatedAt === truth.updatedAt;
      if (!localMatches) this.port.upsert(id, truth.value, truth.updatedAt);
    } else if (truth.kind === 'deleted') {
      if (local.kind === 'present') this.port.remove(id);
    }
    this.port.clearTombstone(id);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/collection-sync.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/collection-sync.ts tests/collection-sync.test.ts
git commit -m "feat(sync): generic per-document CollectionSync engine (Phase 3)"
```

---

### Task 2: Export `isDraftRecord` guards + low-level mutators from storage

Pure refactor exposing what the ports/mappers need. No behavior change.

**Files:**
- Modify: `lib/new-loom/draft-storage.ts` (export `isDraftRecord`; add `upsertDraftRecordById`, `removeDraftById`)
- Modify: `lib/new-loom/draft-records.ts` (export its `isDraftRecord` as `isDraftAnswerRecord`; add `removeDraftRecordById`)
- Test: `tests/draft-storage-mutators.test.ts`

**Interfaces:**
- Produces (draft-storage.ts): `export function isDraftRecord(value): value is NewLoomDraftRecord`; `export function upsertDraftRecordById(record: NewLoomDraftRecord, opts?: { adapter?: DraftStorageAdapter; key?: string }): void`; `export function removeDraftById(id: string, opts?: { adapter?: DraftStorageAdapter; key?: string }): void`.
- Produces (draft-records.ts): `export function isDraftAnswerRecord(value): value is NewLoomDraftRecord`; `export function removeDraftRecordById(id: string, opts?: { storage?: BrowserStorageAdapter | null }): void`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/draft-storage-mutators.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  upsertDraftRecordById, removeDraftById, listDrafts, isDraftRecord,
  NEW_LOOM_DRAFTS_KEY, type DraftStorageAdapter,
} from '../lib/new-loom/draft-storage';

function memAdapter(): DraftStorageAdapter {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
}
const rec = (id: string, title: string) => ({
  id, title, body: 'b', references: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
});

test('isDraftRecord validates shape', () => {
  assert.equal(isDraftRecord(rec('a', 'A')), true);
  assert.equal(isDraftRecord({ id: 1 }), false);
});

test('upsertDraftRecordById inserts then replaces by id', () => {
  const adapter = memAdapter();
  upsertDraftRecordById(rec('a', 'A'), { adapter });
  upsertDraftRecordById(rec('a', 'A2'), { adapter });
  upsertDraftRecordById(rec('b', 'B'), { adapter });
  const drafts = listDrafts(adapter, NEW_LOOM_DRAFTS_KEY);
  assert.equal(drafts.length, 2);
  assert.equal(drafts.find((d) => d.id === 'a')?.title, 'A2');
});

test('removeDraftById removes one', () => {
  const adapter = memAdapter();
  upsertDraftRecordById(rec('a', 'A'), { adapter });
  upsertDraftRecordById(rec('b', 'B'), { adapter });
  removeDraftById('a', { adapter });
  const drafts = listDrafts(adapter, NEW_LOOM_DRAFTS_KEY);
  assert.deepEqual(drafts.map((d) => d.id), ['b']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-storage-mutators.test.ts`
Expected: FAIL — `upsertDraftRecordById` is not exported.

- [ ] **Step 3: Implement**

In `lib/new-loom/draft-storage.ts`, change `function isDraftRecord` (line ~386) to `export function isDraftRecord`. Then append near the other exported draft mutators (after `updateDraft`):

```ts
export function upsertDraftRecordById(
  record: NewLoomDraftRecord,
  options: { adapter?: DraftStorageAdapter; key?: string } = {},
): void {
  const adapter = options.adapter ?? browserDraftStorage();
  if (!adapter) return;
  const key = options.key ?? NEW_LOOM_DRAFTS_KEY;
  if (!isDraftRecord(record)) return;
  const rest = readDrafts(adapter, key).filter((d) => d.id !== record.id);
  writeDrafts(adapter, [record, ...rest], key);
}

export function removeDraftById(
  id: string,
  options: { adapter?: DraftStorageAdapter; key?: string } = {},
): void {
  const adapter = options.adapter ?? browserDraftStorage();
  if (!adapter) return;
  const key = options.key ?? NEW_LOOM_DRAFTS_KEY;
  writeDrafts(adapter, readDrafts(adapter, key).filter((d) => d.id !== id), key);
}
```

In `lib/new-loom/draft-records.ts`: change `function isDraftRecord` to `export function isDraftAnswerRecord` (update its internal call sites in that file from `isDraftRecord` → `isDraftAnswerRecord`), and add:

```ts
export function removeDraftRecordById(
  id: string,
  input: { storage?: BrowserStorageAdapter | null } = {},
): void {
  const storage = input.storage ?? browserLocalStorage();
  const cleanId = (id ?? '').replace(/\s+/g, ' ').trim();
  if (!cleanId) return;
  const records = loadDraftRecords({ storage }).filter((r) => r.id !== cleanId);
  safeStorageSetItem(storage, NEW_LOOM_DRAFT_RECORDS_KEY, JSON.stringify(records));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/draft-storage-mutators.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/new-loom/draft-storage.ts lib/new-loom/draft-records.ts tests/draft-storage-mutators.test.ts
git commit -m "refactor(drafts): export isDraftRecord guards + by-id upsert/remove mutators"
```

---

### Task 3: `draft-mapper.ts` + `draft-record-mapper.ts`

**Files:**
- Create: `lib/sync/draft-mapper.ts`, `lib/sync/draft-record-mapper.ts`
- Test: `tests/draft-mappers.test.ts`

**Interfaces:**
- Consumes: `CollectionMapper<T>` from `collection-sync.ts`; `isDraftRecord` from `draft-storage.ts`; `isDraftAnswerRecord` from `draft-records.ts`; `isSafeHref` from `lib/profile/safe-href`; record types from each storage module.
- Produces: `export const draftMapper: CollectionMapper<StudioDraft>`; `export const draftRecordMapper: CollectionMapper<AnswerRecord>` (type aliases re-exported).

- [ ] **Step 1: Write the failing test**

```ts
// tests/draft-mappers.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftMapper } from '../lib/sync/draft-mapper';
import { draftRecordMapper } from '../lib/sync/draft-record-mapper';

const studio = (over = {}) => ({
  id: 'a', title: 'A', body: 'b', references: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', ...over,
});

test('studio mapper round-trips a valid record', () => {
  const r = studio();
  assert.deepEqual(draftMapper.fromData(draftMapper.toData(r)), r);
});

test('studio mapper drops an unsafe reference href on ingest', () => {
  const dirty = studio({ references: [{ label: 'x', href: 'javascript:alert(1)' }, { label: 'ok', href: '/docs/a' }] });
  const out = draftMapper.fromData(dirty)!;
  assert.equal(out.references.length, 1);
  assert.equal(out.references[0]?.href, '/docs/a');
});

test('studio mapper returns null for garbage', () => {
  assert.equal(draftMapper.fromData({ nope: true }), null);
  assert.equal(draftMapper.fromData(null), null);
});

test('answer-record mapper round-trips and rejects garbage', () => {
  const r = { id: 'r1', title: 'T', answer: 'A', sourceLabels: [], sourceHrefs: [], draftUrl: '/digital-me', status: 'drafting', updatedAt: '2026-01-02T00:00:00.000Z' };
  assert.deepEqual(draftRecordMapper.fromData(draftRecordMapper.toData(r)), r);
  assert.equal(draftRecordMapper.fromData({ bad: 1 }), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-mappers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/sync/draft-mapper.ts
import type { CollectionMapper } from './collection-sync';
import { isDraftRecord } from '../new-loom/draft-storage';
import { isSafeHref } from '../profile/safe-href';
import type { NewLoomDraftRecord } from '../new-loom/draft-storage';

export type StudioDraft = NewLoomDraftRecord;

export const draftMapper: CollectionMapper<StudioDraft> = {
  toData: (value) => value,
  fromData: (data) => {
    if (!isDraftRecord(data)) return null;
    const safe: StudioDraft = {
      ...data,
      references: data.references.filter((r) => isSafeHref(r.href)),
    };
    return safe;
  },
};
```

```ts
// lib/sync/draft-record-mapper.ts
import type { CollectionMapper } from './collection-sync';
import { isDraftAnswerRecord, type NewLoomDraftRecord as AnswerRecord } from '../new-loom/draft-records';
import { isSafeHref } from '../profile/safe-href';

export type { AnswerRecord };

export const draftRecordMapper: CollectionMapper<AnswerRecord> = {
  toData: (value) => value,
  fromData: (data) => {
    if (!isDraftAnswerRecord(data)) return null;
    return { ...data, sourceHrefs: data.sourceHrefs.filter((h) => isSafeHref(h)) };
  },
};
```

> Note: verify `isSafeHref` is the exported name in `lib/profile/safe-href.ts`; if it differs (e.g. `isSafeHref`/`safeHref`), use the actual export. Confirm during implementation.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/draft-mappers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/draft-mapper.ts lib/sync/draft-record-mapper.ts tests/draft-mappers.test.ts
git commit -m "feat(sync): draft + answer-record mappers with safe-href hardening"
```

---

### Task 4: `drafts-local-port.ts` + `draft-records-local-port.ts` (with tombstone log)

**Files:**
- Create: `lib/sync/drafts-local-port.ts`, `lib/sync/draft-records-local-port.ts`
- Test: `tests/drafts-local-port.test.ts`

**Interfaces:**
- Consumes: `CollectionLocalPort<T>`, `CollectionItem`, `CollectionTombstone` from `collection-sync.ts`; `listDrafts`, `upsertDraftRecordById`, `removeDraftById` from `draft-storage.ts`; `loadDraftRecords`, `saveDraftRecord`, `removeDraftRecordById` from `draft-records.ts`.
- Produces: `export function draftsLocalPort(): CollectionLocalPort<StudioDraft>`; `export function draftRecordsLocalPort(): CollectionLocalPort<AnswerRecord>`; `export const DRAFTS_TOMBSTONES_KEY`, `DRAFT_RECORDS_TOMBSTONES_KEY`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/drafts-local-port.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftsLocalPort, DRAFTS_TOMBSTONES_KEY } from '../lib/sync/drafts-local-port';

// jsdom-free: stub a localStorage on globalThis.window
function withWindow(fn: () => void) {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  };
  try { fn(); } finally { delete (globalThis as any).window; }
}

const draft = (id: string) => ({ id, title: id, body: 'b', references: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' });

test('list/upsert/remove round-trip on the v1 store', () => {
  withWindow(() => {
    const port = draftsLocalPort();
    assert.deepEqual(port.list(), []);
    port.upsert('a', draft('a'), Date.parse('2026-01-02T00:00:00.000Z'));
    assert.equal(port.list().length, 1);
    assert.equal(port.list()[0]?.id, 'a');
    port.remove('a');
    assert.deepEqual(port.list(), []);
  });
});

test('tombstone log round-trips and clears', () => {
  withWindow(() => {
    const port = draftsLocalPort();
    (globalThis as any).window.localStorage.setItem(DRAFTS_TOMBSTONES_KEY, JSON.stringify([{ id: 'a', deletedAt: 9 }]));
    assert.deepEqual(port.listTombstones(), [{ id: 'a', deletedAt: 9 }]);
    port.clearTombstone('a');
    assert.deepEqual(port.listTombstones(), []);
  });
});

test('SSR-safe: no window → empty + no throw', () => {
  const port = draftsLocalPort();
  assert.deepEqual(port.list(), []);
  assert.deepEqual(port.listTombstones(), []);
  port.upsert('a', draft('a'), 1); // no throw
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/drafts-local-port.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/sync/drafts-local-port.ts
import type { CollectionLocalPort, CollectionItem, CollectionTombstone } from './collection-sync';
import {
  listDrafts, upsertDraftRecordById, removeDraftById, browserDraftStorage,
} from '../new-loom/draft-storage';
import type { StudioDraft } from './draft-mapper';

export const DRAFTS_TOMBSTONES_KEY = 'loom.new.drafts.tombstones.v1';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}
function readTombstones(key: string): CollectionTombstone[] {
  try {
    const raw = ls()?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is CollectionTombstone =>
      !!t && typeof (t as any).id === 'string' && Number.isFinite((t as any).deletedAt));
  } catch { return []; }
}
function writeTombstones(key: string, tombs: CollectionTombstone[]): void {
  try { ls()?.setItem(key, JSON.stringify(tombs)); } catch { /* quota */ }
}

export function draftsLocalPort(): CollectionLocalPort<StudioDraft> {
  return {
    list: (): CollectionItem<StudioDraft>[] => {
      const adapter = browserDraftStorage();
      if (!adapter) return [];
      return listDrafts(adapter).map((d) => ({ id: d.id, value: d, updatedAt: Date.parse(d.updatedAt) || 0 }));
    },
    upsert: (_id, value) => { upsertDraftRecordById(value); },
    remove: (id) => { removeDraftById(id); },
    listTombstones: () => readTombstones(DRAFTS_TOMBSTONES_KEY),
    clearTombstone: (id) => writeTombstones(DRAFTS_TOMBSTONES_KEY, readTombstones(DRAFTS_TOMBSTONES_KEY).filter((t) => t.id !== id)),
  };
}
```

```ts
// lib/sync/draft-records-local-port.ts
import type { CollectionLocalPort, CollectionItem, CollectionTombstone } from './collection-sync';
import { loadDraftRecords, saveDraftRecord, removeDraftRecordById } from '../new-loom/draft-records';
import type { AnswerRecord } from './draft-record-mapper';

export const DRAFT_RECORDS_TOMBSTONES_KEY = 'loom.new.draft-records.tombstones.v1';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}
function readTombstones(key: string): CollectionTombstone[] {
  try {
    const raw = ls()?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is CollectionTombstone =>
      !!t && typeof (t as any).id === 'string' && Number.isFinite((t as any).deletedAt));
  } catch { return []; }
}
function writeTombstones(key: string, tombs: CollectionTombstone[]): void {
  try { ls()?.setItem(key, JSON.stringify(tombs)); } catch { /* quota */ }
}

export function draftRecordsLocalPort(): CollectionLocalPort<AnswerRecord> {
  return {
    list: (): CollectionItem<AnswerRecord>[] =>
      loadDraftRecords().map((r) => ({ id: r.id, value: r, updatedAt: Date.parse(r.updatedAt) || 0 })),
    upsert: (_id, value) => { saveDraftRecord(value); },
    remove: (id) => { removeDraftRecordById(id); },
    listTombstones: () => readTombstones(DRAFT_RECORDS_TOMBSTONES_KEY),
    clearTombstone: (id) => writeTombstones(DRAFT_RECORDS_TOMBSTONES_KEY, readTombstones(DRAFT_RECORDS_TOMBSTONES_KEY).filter((t) => t.id !== id)),
  };
}
```

> The tombstone-log helpers are duplicated across both port files intentionally (two keys, no shared-mutable-state coupling). If a third collection arrives in Phase 2/4, extract a `tombstone-log.ts` then.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/drafts-local-port.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/drafts-local-port.ts lib/sync/draft-records-local-port.ts tests/drafts-local-port.test.ts
git commit -m "feat(sync): localStorage collection ports for drafts + answer-records (tombstone log)"
```

---

### Task 5: `drafts-gateway.ts` + `draft-records-gateway.ts`

**Files:**
- Create: `lib/sync/drafts-gateway.ts`, `lib/sync/draft-records-gateway.ts`
- Test: `tests/drafts-gateway.test.ts`

**Interfaces:**
- Consumes: `getSupabaseClient` from `lib/supabase/client.ts`; `CollectionGateway`, `CollectionRow` from `collection-sync.ts`.
- Produces: `export function draftsGateway(): CollectionGateway | null`; `export function draftRecordsGateway(): CollectionGateway | null`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/drafts-gateway.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftsGateway } from '../lib/sync/drafts-gateway';
import { draftRecordsGateway } from '../lib/sync/draft-records-gateway';

test('gateways are null when Supabase is unconfigured (no env)', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(draftsGateway(), null);
  assert.equal(draftRecordsGateway(), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/drafts-gateway.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/sync/drafts-gateway.ts
import { getSupabaseClient } from '../supabase/client';
import type { CollectionGateway, CollectionRow } from './collection-sync';

export function draftsGateway(): CollectionGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetchAll(userId): Promise<CollectionRow[]> {
      const { data, error } = await sb.from('drafts').select('draft_id, data, deleted, updated_at').eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ id: r.draft_id, data: r.data, deleted: !!r.deleted, updatedAt: Date.parse(r.updated_at) || 0 }));
    },
    async upsert(userId, id, data, deleted, updatedAt): Promise<void> {
      const { error } = await sb.from('drafts').upsert(
        { user_id: userId, draft_id: id, data, deleted, updated_at: new Date(updatedAt).toISOString() },
        { onConflict: 'user_id,draft_id' },
      );
      if (error) throw error;
    },
  };
}
```

```ts
// lib/sync/draft-records-gateway.ts
import { getSupabaseClient } from '../supabase/client';
import type { CollectionGateway, CollectionRow } from './collection-sync';

export function draftRecordsGateway(): CollectionGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetchAll(userId): Promise<CollectionRow[]> {
      const { data, error } = await sb.from('draft_records').select('record_id, data, deleted, updated_at').eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ id: r.record_id, data: r.data, deleted: !!r.deleted, updatedAt: Date.parse(r.updated_at) || 0 }));
    },
    async upsert(userId, id, data, deleted, updatedAt): Promise<void> {
      const { error } = await sb.from('draft_records').upsert(
        { user_id: userId, record_id: id, data, deleted, updated_at: new Date(updatedAt).toISOString() },
        { onConflict: 'user_id,record_id' },
      );
      if (error) throw error;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/drafts-gateway.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/drafts-gateway.ts lib/sync/draft-records-gateway.ts tests/drafts-gateway.test.ts
git commit -m "feat(sync): Supabase gateways for drafts + draft_records (inert when unconfigured)"
```

---

### Task 6: `draft-events.ts` + fire from create/update/save call sites

**Files:**
- Create: `lib/sync/draft-events.ts`
- Modify: `lib/new-loom/draft-storage.ts` (call `notifyDraftsChanged()` at the end of `createDraft` and `updateDraft`)
- Modify: `lib/new-loom/draft-records.ts` (call `notifyDraftsChanged()` at the end of `saveDraftRecord`)
- Test: `tests/draft-events.test.ts`

**Interfaces:**
- Produces: `export function notifyDraftsChanged(): void`; `export function onDraftsChange(cb: () => void): () => void`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/draft-events.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyDraftsChanged, onDraftsChange } from '../lib/sync/draft-events';

test('onDraftsChange fires on notify and unsubscribes', () => {
  (globalThis as any).window = { dispatchEvent(e: any) { (this as any)._cb?.(e); }, addEventListener(_t: string, cb: any) { (this as any)._cb = cb; }, removeEventListener() { (this as any)._cb = undefined; } };
  let n = 0;
  const off = onDraftsChange(() => { n += 1; });
  notifyDraftsChanged();
  assert.equal(n, 1);
  off();
  notifyDraftsChanged();
  assert.equal(n, 1);
  delete (globalThis as any).window;
});

test('notify is a no-op under SSR (no window)', () => {
  assert.doesNotThrow(() => notifyDraftsChanged());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/draft-events.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/sync/draft-events.ts
const DRAFTS_CHANGED_EVENT = 'loom:drafts-changed';

export function notifyDraftsChanged(): void {
  if (typeof window === 'undefined') return;
  try { window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT)); } catch { /* ignore */ }
}

export function onDraftsChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(DRAFTS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DRAFTS_CHANGED_EVENT, handler);
}
```

Then add `import { notifyDraftsChanged } from '../sync/draft-events';` to both storage files and call `notifyDraftsChanged();` as the last statement of `createDraft`, `updateDraft` (draft-storage.ts) and `saveDraftRecord` (draft-records.ts). These run client-side; SSR guard makes them safe.

> The test stub for `Event` uses the global `Event`; node 20+ provides it. If absent in the runner, the SSR-guard path still passes; adjust the stub to a plain object if needed.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/draft-events.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/draft-events.ts lib/new-loom/draft-storage.ts lib/new-loom/draft-records.ts tests/draft-events.test.ts
git commit -m "feat(sync): draft-change events fired from create/update/save"
```

---

### Task 7: `use-drafts-sync.ts` hook

**Files:**
- Create: `lib/sync/use-drafts-sync.ts`
- Test: `tests/use-drafts-sync.test.ts`

**Interfaces:**
- Consumes: `onAuthChange`, `getSession`, `AuthSession` from `lib/auth/auth-client`; `onDraftsChange` from `draft-events.ts`; the two ports, two gateways, two mappers; `CollectionSync`; `createPendingSyncQueue` from `pending-queue.ts`; `SyncStatus` from `profile-sync.ts`.
- Produces: `export function useDraftsSync(): { session: AuthSession; status: SyncStatus }`.

- [ ] **Step 1: Write the failing test** (logic-only: a pure `syncAllCollections` helper the hook wraps)

```ts
// tests/use-drafts-sync.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncAllCollections } from '../lib/sync/use-drafts-sync';

test('syncAllCollections returns synced when all engines succeed', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  assert.equal(await syncAllCollections('u1', [ok, ok]), 'synced');
});

test('syncAllCollections returns error if any engine errors', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  const bad = { syncOnce: async () => 'error' as const };
  assert.equal(await syncAllCollections('u1', [ok, bad]), 'error');
});

test('syncAllCollections with no engines (unconfigured) is synced/no-op', async () => {
  assert.equal(await syncAllCollections('u1', []), 'synced');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/use-drafts-sync.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// lib/sync/use-drafts-sync.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthChange, getSession, type AuthSession } from '../auth/auth-client';
import { onDraftsChange } from './draft-events';
import { CollectionSync, type SyncStatus } from './collection-sync';
import { draftsLocalPort } from './drafts-local-port';
import { draftRecordsLocalPort } from './draft-records-local-port';
import { draftsGateway } from './drafts-gateway';
import { draftRecordsGateway } from './draft-records-gateway';
import { draftMapper } from './draft-mapper';
import { draftRecordMapper } from './draft-record-mapper';

type Engine = { syncOnce(userId: string): Promise<SyncStatus> };

export async function syncAllCollections(userId: string, engines: Engine[]): Promise<SyncStatus> {
  if (engines.length === 0) return 'synced';
  const results = await Promise.all(engines.map((e) => e.syncOnce(userId)));
  return results.some((r) => r === 'error') ? 'error' : 'synced';
}

function buildEngines(): Engine[] {
  const dg = draftsGateway();
  const rg = draftRecordsGateway();
  const engines: Engine[] = [];
  if (dg) engines.push(new CollectionSync(dg, draftsLocalPort(), draftMapper));
  if (rg) engines.push(new CollectionSync(rg, draftRecordsLocalPort(), draftRecordMapper));
  return engines;
}

export function useDraftsSync(): { session: AuthSession; status: SyncStatus } {
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const engines = buildEngines();

    const run = async (userId: string) => {
      if (engines.length === 0) return;
      setStatus('syncing');
      const s = await syncAllCollections(userId, engines);
      if (active) setStatus(s);
    };

    getSession().then((s) => { if (active) { setSession(s); if (s) run(s.userId); } });
    const offAuth = onAuthChange((s) => { if (!active) return; setSession(s); if (s) run(s.userId); else setStatus('idle'); });
    const offChange = onDraftsChange(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => { getSession().then((s) => { if (s) run(s.userId); }); }, 1200);
    });
    const onFocus = () => { getSession().then((s) => { if (s) run(s.userId); }); };
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);

    return () => {
      active = false; offAuth(); offChange();
      if (debounce.current) clearTimeout(debounce.current);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { session, status };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/use-drafts-sync.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sync/use-drafts-sync.ts tests/use-drafts-sync.test.ts
git commit -m "feat(sync): use-drafts-sync hook (sign-in/focus/debounced-change, inert)"
```

---

### Task 8: Document the Phase 3 SQL in `docs/supabase-setup.md`

**Files:**
- Modify: `docs/supabase-setup.md` (append an optional "Phase 3 — drafts sync" SQL section)

- [ ] **Step 1: Append the section** (copy the two `create table` + RLS blocks from the spec's Data model section verbatim, under a heading:)

```markdown
## Optional — Phase 3 drafts sync (run once, owner)

Run this in the SQL editor to enable Studio drafts sync across devices. Absent
tables just mean drafts stay local; the rest of LOOM is unaffected.

<the two CREATE TABLE + RLS blocks from the Phase 3 spec>
```

- [ ] **Step 2: Commit**

```bash
git add docs/supabase-setup.md
git commit -m "docs: Phase 3 drafts/draft_records SQL in supabase setup"
```

---

### Task 9: Full-suite + typecheck + inert static-export verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend + draft test suite**

Run: `npx tsx --test tests/collection-sync.test.ts tests/draft-storage-mutators.test.ts tests/draft-mappers.test.ts tests/drafts-local-port.test.ts tests/drafts-gateway.test.ts tests/draft-events.test.ts tests/use-drafts-sync.test.ts tests/supabase-client.test.ts tests/profile-sync.test.ts tests/sync-merge.test.ts`
Expected: all PASS.

- [ ] **Step 2: Run the existing draft contract tests to confirm no regression**

Run: `npx tsx --test tests/draft-routing.test.ts tests/draft-doc-blocks.test.ts tests/draft-doc-blocks-storage.test.ts tests/draft-included-in-digital-me.test.tsx tests/draft-artifacts.test.ts`
Expected: all PASS (no regression from the storage-mutator exports/events).

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck`
Expected: exit 0, zero TS errors.

- [ ] **Step 4: Confirm inert static export still builds with no env**

Run: `rm -rf .next-build && npm run build`  (with `.env.local` Supabase vars empty)
Expected: build succeeds; the new gateways are inert; no runtime use of Supabase.

- [ ] **Step 5: Commit any fixups, then final commit**

```bash
git add -A && git commit -m "test(sync): Phase 3 full-suite + typecheck green, inert build verified" --allow-empty
```

---

## Self-Review

- **Spec coverage:** scope (2 collections) → Tasks 1–7; per-doc LWW + tombstones → Task 1; safe-href → Task 3; inert → Tasks 5,7,9; SQL doc → Task 8; events → Task 6; no Phase 1 edits → respected (only `draft-storage.ts`/`draft-records.ts`/`supabase-setup.md`/`.env.example` touched). Deletes "engine-ready, wiring deferred" → Task 1 tombstones + Task 4 tombstone log, no delete-event wiring (correct).
- **Type consistency:** `CollectionSync`/`CollectionLocalPort`/`CollectionGateway`/`CollectionMapper`/`CollectionRow` consistent across Tasks 1,3,4,5,7. `SyncStatus` imported from `profile-sync` (re-exported via `collection-sync`'s import is NOT done — Task 7 imports `SyncStatus` from `./collection-sync`; ensure `collection-sync.ts` re-exports it: add `export type { SyncStatus } from './profile-sync';`). **Fix applied below.**
- **Placeholder scan:** two "confirm during implementation" notes (the `isSafeHref` export name, the `Event` global in the test stub) — these are real verification points, not placeholders; resolve at implementation.

**Fix:** `collection-sync.ts` must re-export `SyncStatus` so Task 7's `import { CollectionSync, type SyncStatus } from './collection-sync'` resolves. Add to Task 1 Step 3, after the imports:
```ts
export type { SyncStatus } from './profile-sync';
```
