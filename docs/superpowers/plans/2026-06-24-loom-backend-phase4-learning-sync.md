# LOOM Backend Phase 4 — Learning Engine Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Sync traces/panels/weaves across devices — panels/weaves by LWW, traces by append-only event-union merge — via a new async engine. Inert without env; Phase 1/2/3 untouched.

**Spec:** `docs/superpowers/specs/2026-06-24-loom-backend-phase4-learning-sync-design.md`

## Global Constraints
- Inert without env (gateways return null → no-op); local-first (swallow errors, never throw to UI); zero edits to Phase 1/2/3 files; English-only; SSR-safe; `npx tsx --test` from `~/dev/LOOM`.
- `SyncStatus` from `lib/sync/profile-sync.ts`. `Trace`/`TraceEvent` from `lib/trace/types.ts`.

---

### Task 1: `stable-stringify.ts` (pure)
**Files:** Create `lib/sync/stable-stringify.ts`; Test `tests/stable-stringify.test.ts`.
**Produces:** `stableStringify(value: unknown): string` — JSON with recursively sorted object keys.

- [ ] Test:
```ts
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { stableStringify } from '../lib/sync/stable-stringify';
test('key order independent', () => {
  assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
});
test('nested + arrays stable; arrays stay ordered', () => {
  assert.equal(stableStringify({ x: [{ b: 1, a: 2 }] }), stableStringify({ x: [{ a: 2, b: 1 }] }));
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});
test('primitives + null', () => { assert.equal(stableStringify(null), 'null'); assert.equal(stableStringify(3), '3'); });
```
- [ ] Run → FAIL. Implement:
```ts
// lib/sync/stable-stringify.ts
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
```
- [ ] Run → PASS. Commit `feat(sync): stable-stringify for order-independent event keys`.

---

### Task 2: export `recomputeTrace` from `lib/trace/store.ts`
**Files:** Modify `lib/trace/store.ts`.
**Produces:** `export function recomputeTrace(t: Trace): Trace` — the existing private `recompute`, exported (rename the private fn to the exported one, update its 4 internal call sites: create/appendEvent/removeEvents/update).

- [ ] Change `function recompute(t: Trace): Trace {` → `export function recomputeTrace(t: Trace): Trace {`; replace the 4 internal `recompute(` calls with `recomputeTrace(`.
- [ ] `npm run typecheck` → 0. Commit `refactor(trace): export recomputeTrace for the sync merge`.

---

### Task 3: `trace-merge.ts` (pure — the core)
**Files:** Create `lib/sync/trace-merge.ts`; Test `tests/trace-merge.test.ts`.
**Produces:** `mergeTraceEvents(a, b): TraceEvent[]`; `mergeTrace(local: Trace, remote: Trace): Trace`.

- [ ] Test (the heart — full coverage):
```ts
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { mergeTrace, mergeTraceEvents } from '../lib/sync/trace-merge';
import type { Trace, TraceEvent } from '../lib/trace/types';

const ev = (at: number, content: string): TraceEvent => ({ kind: 'note', content, at });
const base = (over: Partial<Trace> = {}): Trace => ({
  id: 't1', kind: 'free', title: 'T', parentId: null, childIds: [], events: [],
  createdAt: 0, updatedAt: 0, visitCount: 0, totalDurationMs: 0, mastery: 0, ...over,
});

test('events: union dedups exact dupes, keeps disjoint, sorts by at', () => {
  const out = mergeTraceEvents([ev(2, 'a'), ev(1, 'b')], [ev(1, 'b'), ev(3, 'c')]);
  assert.deepEqual(out.map((e) => (e as { content: string }).content), ['b', 'a', 'c']);
  assert.equal(out.length, 3); // 'b' deduped
});
test('mergeTrace unions events from both devices', () => {
  const local = base({ events: [ev(1, 'a')], updatedAt: 10 });
  const remote = base({ events: [ev(2, 'b')], updatedAt: 5 });
  const m = mergeTrace(local, remote);
  assert.equal(m.events.length, 2);
});
test('metadata LWW by updatedAt (higher wins), tie -> local', () => {
  assert.equal(mergeTrace(base({ title: 'L', updatedAt: 5 }), base({ title: 'R', updatedAt: 9 })).title, 'R');
  assert.equal(mergeTrace(base({ title: 'L', updatedAt: 5 }), base({ title: 'R', updatedAt: 5 })).title, 'L');
});
test('childIds union', () => {
  const m = mergeTrace(base({ childIds: ['a', 'b'] }), base({ childIds: ['b', 'c'] }));
  assert.deepEqual([...m.childIds].sort(), ['a', 'b', 'c']);
});
test('derived recompute: updatedAt = max event at, createdAt = min', () => {
  const m = mergeTrace(base({ events: [ev(100, 'a')] }), base({ events: [ev(50, 'b'), ev(300, 'c')] }));
  assert.equal(m.updatedAt, 300); assert.equal(m.createdAt, 50);
});
test('idempotent: mergeTrace(a,a) ≡ a (events + counts stable)', () => {
  const a = mergeTrace(base({ events: [ev(1, 'x'), ev(2, 'y')], childIds: ['c'] }), base({ events: [ev(2, 'y')] }));
  const aa = mergeTrace(a, a);
  assert.deepEqual(aa.events, a.events); assert.deepEqual(aa.childIds, a.childIds);
});
test('commutative event set: order of args yields same event set', () => {
  const l = base({ events: [ev(1, 'a')] }); const r = base({ events: [ev(2, 'b')] });
  assert.deepEqual(mergeTrace(l, r).events.map((e)=>(e as {content:string}).content),
                   mergeTrace(r, l).events.map((e)=>(e as {content:string}).content));
});
```
- [ ] Run → FAIL. Implement:
```ts
// lib/sync/trace-merge.ts
import type { Trace, TraceEvent } from '../trace/types';
import { recomputeTrace } from '../trace/store';
import { stableStringify } from './stable-stringify';

export function mergeTraceEvents(a: TraceEvent[], b: TraceEvent[]): TraceEvent[] {
  const seen = new Set<string>();
  const out: TraceEvent[] = [];
  for (const e of [...a, ...b]) {
    const key = stableStringify(e);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  out.sort((x, y) => x.at - y.at);
  return out;
}

export function mergeTrace(local: Trace, remote: Trace): Trace {
  // Mutable metadata: LWW by updatedAt, tie -> local.
  const meta = remote.updatedAt > local.updatedAt ? remote : local;
  const merged: Trace = {
    ...meta,
    id: local.id,
    childIds: Array.from(new Set([...local.childIds, ...remote.childIds])),
    events: mergeTraceEvents(local.events, remote.events),
  };
  return recomputeTrace(merged); // derived fields from the merged events
}
```
- [ ] Run → PASS. Commit `feat(sync): trace event-union merge (mergeTrace) — the Phase 4 core`.

---

### Task 4: `async-collection-sync.ts` engine + `lwwMerge`
**Files:** Create `lib/sync/async-collection-sync.ts`; Test `tests/async-collection-sync.test.ts`.
**Produces:** `AsyncCollectionLocalPort<T>`, `AsyncCollectionGateway`, `AsyncCollectionMapper<T>`, `RecordMerge<T>`, `lwwMerge`, `class AsyncCollectionSync<T>`.

- [ ] Test (push/pull/merge/delete/error, async fakes):
```ts
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { AsyncCollectionSync, lwwMerge, type AsyncCollectionLocalPort, type AsyncCollectionGateway, type AsyncCollectionMapper } from '../lib/sync/async-collection-sync';
type Doc = { id: string; n: number };
const mapper: AsyncCollectionMapper<Doc> = { toData: (v) => v, fromData: (d) => (d && typeof (d as Doc).id === 'string' ? d as Doc : null) };
function port(seed: Array<{id:string;value:Doc;updatedAt:number}> = [], tombs: Array<{id:string;deletedAt:number}> = []) {
  const items = new Map(seed.map((i)=>[i.id,i])); const t = new Map(tombs.map((x)=>[x.id,x])); const writes:string[]=[];
  return { items, t, writes,
    list: async () => [...items.values()],
    upsert: async (id:string, value:Doc, updatedAt:number) => { items.set(id,{id,value,updatedAt}); writes.push(id); },
    remove: async (id:string) => { items.delete(id); },
    listTombstones: async () => [...t.values()],
    clearTombstone: async (id:string) => { t.delete(id); } } as AsyncCollectionLocalPort<Doc> & {items:Map<string,{id:string;value:Doc;updatedAt:number}>;t:Map<string,{id:string;deletedAt:number}>;writes:string[]};
}
function gw(seed: Array<{id:string;data:unknown;deleted:boolean;updatedAt:number}> = [], opts:{throwOnUpsert?:boolean}={}) {
  const rows = new Map(seed.map((r)=>[r.id,r])); const upserts:string[]=[];
  return { rows, upserts,
    fetchAll: async () => [...rows.values()],
    upsert: async (_u:string,id:string,data:unknown,deleted:boolean,updatedAt:number) => { if(opts.throwOnUpsert) throw new Error('net'); rows.set(id,{id,data,deleted,updatedAt}); upserts.push(id); } } as AsyncCollectionGateway & {rows:Map<string,{id:string;data:unknown;deleted:boolean;updatedAt:number}>;upserts:string[]};
}
const lww = lwwMerge<Doc>();
test('push local-only', async () => { const p=port([{id:'a',value:{id:'a',n:1},updatedAt:5}]); const g=gw(); await new AsyncCollectionSync(g,p,mapper,lww).syncOnce('u'); assert.equal(g.rows.get('a')?.deleted,false); });
test('pull remote-only', async () => { const p=port(); const g=gw([{id:'b',data:{id:'b',n:2},deleted:false,updatedAt:3}]); await new AsyncCollectionSync(g,p,mapper,lww).syncOnce('u'); assert.equal(p.items.get('b')?.value.n,2); });
test('lww newer wins', async () => { const p=port([{id:'a',value:{id:'a',n:1},updatedAt:1}]); const g=gw([{id:'a',data:{id:'a',n:9},deleted:false,updatedAt:9}]); await new AsyncCollectionSync(g,p,mapper,lww).syncOnce('u'); assert.equal(p.items.get('a')?.value.n,9); });
test('custom merge applied on present∧present', async () => {
  const sumMerge = (l:{value:Doc;updatedAt:number}|null,r:{value:Doc;updatedAt:number}|null) => {
    if(l&&r) return {value:{id:l.value.id,n:l.value.n+r.value.n},updatedAt:Math.max(l.updatedAt,r.updatedAt)}; return l??r; };
  const p=port([{id:'a',value:{id:'a',n:1},updatedAt:5}]); const g=gw([{id:'a',data:{id:'a',n:10},deleted:false,updatedAt:6}]);
  await new AsyncCollectionSync(g,p,mapper,sumMerge).syncOnce('u');
  assert.equal(p.items.get('a')?.value.n, 11); });
test('local tombstone pushes remote tombstone', async () => { const p=port([],[{id:'a',deletedAt:30}]); const g=gw([{id:'a',data:{id:'a',n:1},deleted:false,updatedAt:10}]); await new AsyncCollectionSync(g,p,mapper,lww).syncOnce('u'); assert.equal(g.rows.get('a')?.deleted,true); });
test('error path: upsert throw -> local untouched', async () => { const p=port([{id:'a',value:{id:'a',n:1},updatedAt:5}]); const g=gw([],{throwOnUpsert:true}); const s=await new AsyncCollectionSync(g,p,mapper,lww).syncOnce('u'); assert.equal(s,'error'); assert.equal(p.items.get('a')?.value.n,1); });
```
- [ ] Run → FAIL. Implement (mirror Phase 3 `collection-sync.ts` but async + pluggable merge on present∧present; reuse `pickWinner` from `merge.ts` for the present/deleted/absent Side resolution and inside `lwwMerge`):
```ts
// lib/sync/async-collection-sync.ts
import { pickWinner, type Stamped } from './merge';
import type { SyncStatus } from './profile-sync';
export type { SyncStatus } from './profile-sync';

export interface AsyncCollectionItem<T> { id: string; value: T; updatedAt: number; }
export interface AsyncCollectionTombstone { id: string; deletedAt: number; }
export interface AsyncCollectionLocalPort<T> {
  list(): Promise<AsyncCollectionItem<T>[]>;
  upsert(id: string, value: T, updatedAt: number): Promise<void>;
  remove(id: string): Promise<void>;
  listTombstones(): Promise<AsyncCollectionTombstone[]>;
  clearTombstone(id: string): Promise<void>;
}
export interface AsyncCollectionRow { id: string; data: unknown; deleted: boolean; updatedAt: number; }
export interface AsyncCollectionGateway {
  fetchAll(userId: string): Promise<AsyncCollectionRow[]>;
  upsert(userId: string, id: string, data: unknown, deleted: boolean, updatedAt: number): Promise<void>;
}
export interface AsyncCollectionMapper<T> { toData(value: T): unknown; fromData(data: unknown): T | null; }
export type RecordMerge<T> = (
  local: { value: T; updatedAt: number } | null,
  remote: { value: T; updatedAt: number } | null,
) => { value: T; updatedAt: number } | null;

export function lwwMerge<T>(): RecordMerge<T> {
  return (local, remote) => {
    const w = pickWinner(local as Stamped<T> | null, remote as Stamped<T> | null);
    return w ? { value: w.value, updatedAt: w.updatedAt } : null;
  };
}

type Side<T> = { kind: 'present'; value: T; updatedAt: number } | { kind: 'deleted'; updatedAt: number } | { kind: 'absent' };

export class AsyncCollectionSync<T> {
  constructor(private gateway: AsyncCollectionGateway, private port: AsyncCollectionLocalPort<T>, private mapper: AsyncCollectionMapper<T>, private mergeRecord: RecordMerge<T>) {}
  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const rows = await this.gateway.fetchAll(userId);
      const local = new Map<string, AsyncCollectionItem<T>>(); for (const i of await this.port.list()) local.set(i.id, i);
      const tombs = new Map<string, AsyncCollectionTombstone>(); for (const t of await this.port.listTombstones()) tombs.set(t.id, t);
      const remote = new Map<string, AsyncCollectionRow>(); for (const r of rows) remote.set(r.id, r);
      for (const id of new Set<string>([...local.keys(), ...tombs.keys(), ...remote.keys()])) {
        await this.reconcile(userId, id, this.localSide(id, local, tombs), this.remoteSide(id, remote));
      }
      return 'synced';
    } catch { return 'error'; }
  }
  private localSide(id: string, local: Map<string, AsyncCollectionItem<T>>, tombs: Map<string, AsyncCollectionTombstone>): Side<T> {
    const item = local.get(id); const tomb = tombs.get(id);
    if (tomb && item) return tomb.deletedAt >= item.updatedAt ? { kind: 'deleted', updatedAt: tomb.deletedAt } : { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    if (tomb) return { kind: 'deleted', updatedAt: tomb.deletedAt };
    if (item) return { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    return { kind: 'absent' };
  }
  private remoteSide(id: string, remote: Map<string, AsyncCollectionRow>): Side<T> {
    const row = remote.get(id); if (!row) return { kind: 'absent' };
    if (row.deleted) return { kind: 'deleted', updatedAt: row.updatedAt };
    const value = this.mapper.fromData(row.data); if (value === null) return { kind: 'absent' };
    return { kind: 'present', value, updatedAt: row.updatedAt };
  }
  private async reconcile(userId: string, id: string, local: Side<T>, remote: Side<T>): Promise<void> {
    // present ∧ present -> custom merge (event-union for traces, LWW for panels/weaves)
    if (local.kind === 'present' && remote.kind === 'present') {
      const merged = this.mergeRecord({ value: local.value, updatedAt: local.updatedAt }, { value: remote.value, updatedAt: remote.updatedAt });
      if (!merged) return;
      // push if remote differs from merged
      if (remote.updatedAt !== merged.updatedAt || this.toKey(remote.value) !== this.toKey(merged.value)) {
        await this.gateway.upsert(userId, id, this.mapper.toData(merged.value), false, merged.updatedAt);
      }
      if (local.updatedAt !== merged.updatedAt || this.toKey(local.value) !== this.toKey(merged.value)) {
        await this.port.upsert(id, merged.value, merged.updatedAt);
      }
      await this.port.clearTombstone(id);
      return;
    }
    // otherwise tombstone-LWW (identical to Phase 3)
    const ls: Stamped<Side<T>> | null = local.kind === 'absent' ? null : { value: local, updatedAt: local.updatedAt };
    const rs: Stamped<Side<T>> | null = remote.kind === 'absent' ? null : { value: remote, updatedAt: remote.updatedAt };
    const winner = pickWinner(ls, rs); if (!winner) return; const truth = winner.value;
    const remoteMatches = (truth.kind === 'present' && remote.kind === 'present' && remote.updatedAt === truth.updatedAt) || (truth.kind === 'deleted' && remote.kind === 'deleted' && remote.updatedAt === truth.updatedAt);
    if (!remoteMatches) {
      if (truth.kind === 'present') await this.gateway.upsert(userId, id, this.mapper.toData(truth.value), false, truth.updatedAt);
      else if (truth.kind === 'deleted') await this.gateway.upsert(userId, id, null, true, truth.updatedAt);
    }
    if (truth.kind === 'present') { if (!(local.kind === 'present' && local.updatedAt === truth.updatedAt)) await this.port.upsert(id, truth.value, truth.updatedAt); }
    else if (truth.kind === 'deleted') { await this.port.remove(id); }
    await this.port.clearTombstone(id);
  }
  private toKey(v: T): string { try { return JSON.stringify(v); } catch { return ''; } }
}
```
- [ ] Run → PASS. Commit `feat(sync): async per-record collection sync with pluggable merge (LWW + event-union)`.

> NOTE: `toKey` uses JSON.stringify only for a cheap dirty-check (avoid redundant writes); not security-sensitive. For traces the merged result differs from a stale side, so it writes; once converged both keys match and it no-ops.

---

### Task 5: gateways (traces/panels/weaves) + mappers
**Files:** Create `lib/sync/traces-gateway.ts`, `panels-gateway.ts`, `weaves-gateway.ts`, `learning-mappers.ts`; Test `tests/learning-gateways.test.ts`.
Mirror Phase 3 `drafts-gateway.ts` exactly, table/id per store (`traces`/`trace_id`, `panels`/`panel_id`, `weaves`/`weave_id`); each returns `null` when unconfigured. Mappers: `traceMapper`/`panelMapper`/`weaveMapper` validate the record has a string `id` + numeric `updatedAt`, else `fromData` → null. Test asserts the 3 gateways are null with no env. Commit.

---

### Task 6: async IndexedDB ports + tombstone logs
**Files:** Create `lib/sync/trace-local-port.ts`, `panel-local-port.ts`, `weave-local-port.ts`. (Integration glue over `traceStore`/`panelStore`/`weaveStore`; verified by typecheck + the engine tests via fakes — IndexedDB isn't unit-testable in node, consistent with Phase 2's store glue.)
Each implements `AsyncCollectionLocalPort<T>`: `list()` maps store.getAll() → `{id, value, updatedAt}`; `upsert` calls the store's put/create (silent — no learning-event emit); `remove` calls the store delete (traces: `deleteTree`); tombstone log in a companion localStorage key (`loom.<store>.tombstones.v1`) read/written SSR-safe. Commit.

---

### Task 7: `learning-events.ts` + emit from stores
**Files:** Create `lib/sync/learning-events.ts` (`notifyLearningChanged`/`onLearningChange`, CustomEvent, SSR-safe); Test `tests/learning-events.test.ts`. Emit `notifyLearningChanged()` from user-facing write paths in `traceStore` (create/appendEvent/update/removeEvents/deleteTree), `panelStore` (put/update*), `weaveStore` (put/update*/delete). The sync ports write silently (they call store puts directly but must NOT loop — guard: ports use a silent write that does not emit, OR accept the bounded one-extra-sync like Phase 3; simplest: ports call store methods, and the hook debounces, and merge is idempotent so it converges). Test fires/u/unsubscribes. Commit.

---

### Task 8: `use-learning-sync.ts` hook + `LearningSyncInstaller` + layout mount
**Files:** Create `lib/sync/use-learning-sync.ts` + `components/LearningSyncInstaller.tsx`; Modify `app/layout.tsx`. Test `tests/use-learning-sync.test.ts` (the pure `syncAllLearning(userId, engines)` helper, like Phase 3's `syncAllCollections`). Hook builds 3 engines (traces with `mergeTrace`-based `RecordMerge`, panels/weaves with `lwwMerge`) when gateways exist; full sync on sign-in/focus; debounced push on `onLearningChange`. Installer mounts `useLearningSync()` globally (after `<InterlaceInstaller />`). Commit.

---

### Task 9: docs SQL + verify
**Files:** Modify `docs/supabase-setup.md` (append "Phase 4: learning sync" with the 3 `create table` + RLS blocks).
- [ ] Run all new Phase 4 tests + `tests/supabase-client.test.ts` → PASS.
- [ ] Regression: `tests/digital-me-role-os.test.ts` + any trace/panel/weave tests → PASS.
- [ ] `npm run typecheck` → 0; `rm -rf .next-build && npm run build` (empty env) → inert build succeeds.
- [ ] Commit.

## Self-Review
- Spec coverage: stable-stringify(T1), recomputeTrace(T2), trace-merge(T3), async engine+LWW(T4), gateways(T5), ports(T6), events(T7), hook+mount(T8), SQL+verify(T9). Delete-vs-merge precedence → engine present∧present-only merge (T4). Inert ✓. No Phase 1/2/3 edits ✓.
- Type consistency: `AsyncCollection*`, `RecordMerge`, `mergeTrace`, `recomputeTrace`, `SyncStatus` consistent across T1-T8.
- Placeholder scan: T6/T7 carry real implementation notes (silent-write/loop guidance), not placeholders.
