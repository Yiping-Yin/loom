# LOOM Backend — Phase 4: Learning Engine Sync — Design

**Status:** approved (brainstorming) — 2026-06-24
**Owner:** Yiping Yin
**Builds on:** [Phase 1 — Auth + Profile Sync](2026-06-24-loom-backend-phase1-auth-profile-sync-design.md)

## Goal

Sync the learning corpus — **traces, panels, weaves** — across devices, so a
signed-in user's reading sessions, thought panels, and connections converge. Same
stance as Phases 1–3: **local-first, additive, inert** without `NEXT_PUBLIC_SUPABASE_*`.
Phase 1/2/3 code untouched. Syncs the **web IndexedDB** stores via in-page
`supabase-js` (the macOS webview reads those same DBs).

## Decisions (owner, 2026-06-24)

- **Trace merge = event-union** (the correct, hard model), not whole-record LWW.
- Weaves + panels = **per-record LWW**.
- New **async** engine (the stores are async IndexedDB, so Phase 3's *synchronous*
  `CollectionSync` cannot be reused as-is). Phase 4 is **independent off `main`**.

## Data-layer facts (from exploration)

- **Traces** — IndexedDB DB `loom`, store `traces` (keyPath `id`). A `Trace` is a
  record wrapping an **append-only `events: TraceEvent[]`** (`traceStore.appendEvent`
  only grows it; `update()` refuses to touch events) plus mutable metadata (title,
  `problem`, `concept`, tree `parentId`/`childIds`, `pinnedAt`) and **derived** fields
  (`createdAt`/`updatedAt`/`visitCount`/`totalDurationMs`/`crystallized*`/`mastery`)
  recomputed by the store's private `recompute()`. `TraceEvent` has **no stable id**
  (a union keyed by `at` + kind-specific payload). Real delete path: `deleteTree`.
- **Panels** — DB `loom`, store `panels` (keyPath `id`), mutable record + `updatedAt`.
- **Weaves** — DB `loom-weaves`, store `weaves` (keyPath `id`), mutable record +
  `updatedAt`; real delete path: `delete`/`deleteMany`.

## Architecture

### One async engine, pluggable per-record merge
`lib/sync/async-collection-sync.ts` — the Phase 3 union-of-ids reconciliation, but
**async** (ports return Promises, IndexedDB) and parameterized by a
`mergeRecord(local, remote)` resolver:
```ts
export interface AsyncCollectionLocalPort<T> {
  list(): Promise<Array<{ id: string; value: T; updatedAt: number }>>;
  upsert(id: string, value: T): Promise<void>;
  remove(id: string): Promise<void>;
  listTombstones(): Promise<Array<{ id: string; deletedAt: number }>>;
  clearTombstone(id: string): Promise<void>;
}
export type RecordMerge<T> = (
  local: { value: T; updatedAt: number } | null,
  remote: { value: T; updatedAt: number } | null,
) => { value: T; updatedAt: number } | null;   // null ⇒ no record (deleted/absent both sides)
export class AsyncCollectionSync<T> { constructor(gateway, port, mapper, mergeRecord); syncOnce(userId): Promise<SyncStatus>; }
```
- **`lwwMerge`** (weaves, panels): higher `updatedAt` wins, tie→local (wraps `pickWinner`).
- **`traceMerge`** (traces): the event-union merge below — note it is order-independent
  and idempotent, so the engine can call it on every sync without a timestamp gate.

Tombstones + soft-delete identical to Phase 3 (a local tombstone log per store; a
`deleted` column remotely). Local-first: any throw → `'error'`, local untouched.

**Delete vs merge precedence (per id):** the engine first resolves the
present/deleted/absent `Side`s by timestamp (tombstone-LWW, exactly like Phase 3) —
a delete at `deletedAt` beats a present side with a smaller stamp and loses to a newer
one. `mergeRecord` is invoked **only when BOTH sides are present** (non-deleted); a
winning delete is a delete (no event-union resurrection). So `traceMerge` runs only
for the present∧present case; otherwise the row is pulled/pushed/removed as in Phase 3.

### Trace event-union merge (the core)
Pure `mergeTrace(local: Trace, remote: Trace): Trace` in `lib/sync/trace-merge.ts`:
1. **events:** concat `local.events` + `remote.events`, **dedup** by a stable event key
   `stableStringify(event)` (events are small; identical `at`+kind+payload ⇒ same
   event), then **sort by `at` ascending**. Preserves every event from both devices.
2. **mutable metadata** (`title`, `problem`, `concept`, `parentId`, `pinnedAt`): take
   from the record with the higher `updatedAt` (tie→local).
3. **`childIds`:** **union** (not LWW) so a child branch created on either device
   survives; de-duped, order-stable.
4. **derived fields:** **recompute** from the merged events via `recomputeTrace()` —
   extracted as a pure exported helper from `traceStore.recompute()` (small additive
   edit to `lib/trace/store.ts`) so merge and live store agree exactly.
`mergeTrace` is commutative-enough and **idempotent** (`mergeTrace(a,a) ≡ a` after
sort/dedup), the property the engine relies on.

`stableStringify` (in `lib/sync/stable-stringify.ts`): JSON with recursively sorted
object keys, so event equality is field-order-independent.

## Data model — 3 jsonb tables, per-user RLS (mirrors `profiles`/Phase 3)
`traces`, `panels`, `weaves`, each:
```sql
create table public.<t> (
  user_id uuid not null references auth.users(id) on delete cascade,
  <id>    text not null,           -- trace_id / panel_id / weave_id
  data    jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null,
  primary key (user_id, <id>)
);
-- + the 4 own-row RLS policies (select/insert/update/delete on auth.uid() = user_id)
```
Appended to `docs/supabase-setup.md` as the optional Phase 4 step. For traces the
engine always fetch+merges (event-union), so a stale `updated_at` never loses events;
`updated_at` is still stored for ordering/debug.

## Components (new files, off `main`)
- `lib/sync/async-collection-sync.ts` (engine + `lwwMerge`), `lib/sync/stable-stringify.ts`,
  `lib/sync/trace-merge.ts` (`mergeTrace`), and an exported `recomputeTrace` from
  `lib/trace/store.ts`.
- Async ports: `trace-local-port.ts`, `panel-local-port.ts`, `weave-local-port.ts`
  (over `traceStore`/`panelStore`/`weaveStore` + tombstone-log keys), mappers (validate
  shape, drop nothing exotic), gateways `traces-gateway.ts`/`panels-gateway.ts`/
  `weaves-gateway.ts` (inert when unconfigured).
- `lib/sync/learning-events.ts` (`notifyLearningChanged`/`onLearningChange`), fired from
  the stores' write paths (additive edits to trace/panel/weave stores).
- `lib/sync/use-learning-sync.ts` hook + `components/LearningSyncInstaller.tsx`
  (global mount in `app/layout.tsx`, mirrors Phase 2's `ArtifactSyncInstaller`; named
  to NOT collide with the existing local `PanelSync`/`WeaveSync` installers).

## Testing (TDD — heaviest on the merge)
- `mergeTrace`: dedups exact-duplicate events; keeps disjoint events from both sides;
  sorts by `at`; metadata LWW by `updatedAt` (tie→local); `childIds` union; derived
  recompute correctness (createdAt=min, updatedAt=max event, visitCount, mastery);
  **idempotence** `mergeTrace(a,a) ≡ a`; **commutativity of events** (same event set
  regardless of arg order).
- `stableStringify`: key-order independence.
- `lwwMerge`: higher updatedAt wins, tie→local.
- `AsyncCollectionSync`: push-only, pull-only, per-record merge applied, delete
  tombstone propagation, error path leaves local untouched (async fakes).
- gateways inert; ports round-trip (async fakes).
- **Gate:** full suite + typecheck + inert build green; then adversarial review.

## Non-goals (Phase 4)
- **macOS native store reconciliation** (consistent with Phases 1–3 — web store only).
- **Embeddings / vectors** (`lib/trace/embedding.ts`, `lib/note/embeddings.ts`):
  derived, recomputed locally — not synced.
- Real-time/multiplayer; Phase 5 public signup.

## Adversarial review (2026-06-25) — all findings resolved

Review confirmed the merge is structurally sound and found 5 distinct gaps where the
event-union model collided with the **existing** trace store's behavior. All are now
fixed (hardening round):

1. **Mastery-drift non-convergence** — `recomputeTrace`'s `Date.now()` mastery decay
   made every sync look dirty. Fixed: the engine takes a pluggable `keyOf`; traces use
   `traceSyncKey`, which excludes wall-clock-derived fields. Default `keyOf` =
   `stableStringify` (also kills key-order false positives).
2. **`childIds` resurrection** — blind union re-added a removed child. Fixed: `childIds`
   now follows the LWW winner (mutable membership), not a union.
3. **Event resurrection via `removeEvents`** — destructive `removeEvents` had no
   per-event tombstone. Fixed: `Trace.deletedEventKeys` (a `stableStringify`-keyed set)
   is recorded by `removeEvents`, unioned across devices in `mergeTrace`, and subtracted
   after the event union — so a deleted event stays deleted.
4. **Metadata-only edits invisible to LWW** — `updatedAt` is event-derived. Fixed:
   `Trace.metaUpdatedAt` is stamped by `traceStore.update()`; `mergeTrace` LWWs metadata
   on `max(updatedAt, metaUpdatedAt)`, and `traceSyncKey` includes it (a metadata edit is
   a real change, but it's edit-triggered so it still converges).
5. **Record tombstones never written** — `tombstone-log` had no writer. Fixed:
   `appendTombstone` is called from the user-facing deletes (`traceStore.deleteTree`,
   `panelStore.delete`, `weaveStore.delete`); the engine applies remote deletes through
   **silent** methods (`traceStore.deleteOne`, `panel/weaveStore.deleteSilent`) that
   neither tombstone nor emit, so there's no resurrection and no self-trigger loop.

## File plan
New: `lib/sync/{async-collection-sync,stable-stringify,trace-merge,trace-local-port,
panel-local-port,weave-local-port,traces-gateway,panels-gateway,weaves-gateway,
learning-events,use-learning-sync}.ts` + `components/LearningSyncInstaller.tsx` (+ tests).
Edited (additive, non-Phase-1/2/3): `lib/trace/store.ts` (export `recomputeTrace` +
emit `learning-changed`), `lib/panel/store.ts` + `lib/weave/store.ts` (emit on writes),
`app/layout.tsx` (mount installer), `docs/supabase-setup.md` (3-table SQL). **No edits
to Phase 1/2/3 files.**
