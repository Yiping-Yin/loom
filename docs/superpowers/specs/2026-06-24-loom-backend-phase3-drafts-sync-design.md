# LOOM Backend — Phase 3: Studio Drafts Sync — Design

**Status:** approved (brainstorming) — 2026-06-24
**Owner:** Yiping Yin
**Builds on:** [Phase 1 — Auth + Profile Sync](2026-06-24-loom-backend-phase1-auth-profile-sync-design.md)

## Goal

Sign in on one device → your Studio drafts appear on another. Phase 3 extends the
Phase 1 backend foundation from a single profile blob to the **draft collections**,
proving the per-document collection-sync model the later phases (2 artifacts, 4
learning) will also use.

Same stance as Phase 1: **local-first, additive cloud.** Signed-out or with
`NEXT_PUBLIC_SUPABASE_*` absent, LOOM behaves exactly as today — 100% local, no
network, all existing contract tests green. Signing in turns on draft sync.

## Scope — what syncs (owner decision 2026-06-24)

All three local draft stores:

1. **`loom.new.drafts.v1`** — canonical Studio block documents (`NewLoomDraftRecord`
   with `id/title/body/blocks/references/includedInDigitalMe?/createdAt/updatedAt`).
   A **collection**.
2. **`loom.new.draft-records.v1`** — lighter "AI answer" records
   (`id/title/answer/sourceLabels/sourceHrefs/draftUrl/status/updatedAt`). A
   **collection**.
3. **`loom.workbench.current`** — the "current open draft" pointer. A **singleton**
   per user (last device to set it wins — used to resume on another device).

## Conflict model (owner decision 2026-06-24)

- **Collections → per-document rows.** Each draft is an independent row with its own
  last-write-wins timestamp. Editing draft A on device 1 and draft B on device 2 does
  not clobber either. Each record already carries its own ISO `updatedAt`, which is
  the LWW stamp — no separate per-doc clock needed.
- **Deletes → soft-delete tombstones.** A delete writes a tombstone (`deleted=true` +
  the delete's timestamp) so the removal propagates across devices and only resurrects
  if the other device has a strictly newer edit.
- **Singleton (workbench pointer) → whole-value LWW**, identical to the Phase 1
  profile model.
- Tie → prefer **local** (never clobber a just-made local edit), matching
  `pickWinner`.

## Architecture

**Independent of profile sync.** Drafts sync runs as its own pass against its own
tables; it does not touch `profiles` or the Phase 1 `ProfileSync`. The
`includedInDigitalMe` flag lives inside each draft record, so curation state syncs
for free as part of the row `data`.

**Transport — unchanged from Phase 1.** `@supabase/supabase-js` in-page on both the
Vercel web build and the macOS static app. No new Next API route, no new Swift
bridge. Config via the same two `NEXT_PUBLIC_SUPABASE_*` vars.

**New generic engine, Phase 1 untouched (owner decision 2026-06-24).** The
per-document reconciliation is new logic (Phase 1 only did a singleton). It lands as
a new generic `lib/sync/collection-sync.ts` that reverse-reuses the already-generic
`pickWinner`. The singleton `ProfileSync` is left exactly as-is; the workbench
pointer reuses the singleton shape. Phase 2 (artifacts) and Phase 4 (learning) reuse
`collection-sync`.

**Graceful degradation (critical, same as Phase 1).** When the two
`NEXT_PUBLIC_SUPABASE_*` vars are absent, every gateway returns `null`, the
`use-drafts-sync` hook no-ops, and LOOM is 100% local. Keeps the existing contract
tests green and the static export building without a live backend.

## Data model — 3 tables, per-user RLS (mirrors `profiles`)

```sql
-- Studio block documents (loom.new.drafts.v1): one soft-deletable row per draft.
create table public.drafts (
  user_id    uuid not null references auth.users(id) on delete cascade,
  draft_id   text not null,
  data       jsonb,                       -- full record; may be retained on tombstone
  deleted    boolean not null default false,
  updated_at timestamptz not null,        -- mirrors the record's own updatedAt / delete time
  primary key (user_id, draft_id)
);
alter table public.drafts enable row level security;
create policy "own drafts - select" on public.drafts for select using (auth.uid() = user_id);
create policy "own drafts - insert" on public.drafts for insert with check (auth.uid() = user_id);
create policy "own drafts - update" on public.drafts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drafts - delete" on public.drafts for delete using (auth.uid() = user_id);

-- AI answer records (loom.new.draft-records.v1): same shape, separate collection.
create table public.draft_records (
  user_id    uuid not null references auth.users(id) on delete cascade,
  record_id  text not null,
  data       jsonb,
  deleted    boolean not null default false,
  updated_at timestamptz not null,
  primary key (user_id, record_id)
);
alter table public.draft_records enable row level security;
create policy "own draft_records - select" on public.draft_records for select using (auth.uid() = user_id);
create policy "own draft_records - insert" on public.draft_records for insert with check (auth.uid() = user_id);
create policy "own draft_records - update" on public.draft_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own draft_records - delete" on public.draft_records for delete using (auth.uid() = user_id);

-- Workbench pointer (loom.workbench.current): singleton per user.
create table public.workbench_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null
);
alter table public.workbench_state enable row level security;
create policy "own workbench - select" on public.workbench_state for select using (auth.uid() = user_id);
create policy "own workbench - insert" on public.workbench_state for insert with check (auth.uid() = user_id);
create policy "own workbench - update" on public.workbench_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

The anon key remains public-safe; RLS is the protection. This SQL appends to
`docs/supabase-setup.md` as an optional Phase 3 step (owner runs it once; absent
tables just mean drafts don't sync — the rest is unaffected because the gateway
treats a missing table the same as an error → local-only).

## Components (all new files — zero Phase 1 edits)

### `lib/sync/collection-sync.ts` — the reusable engine
Pure-ish orchestrator parameterized over a local port + gateway + mapper.

```
type Stamped<T> = { value: T; updatedAt: number };  // reuses merge.ts
interface CollectionLocalPort<T> {
  list(): Array<{ id: string; value: T; updatedAt: number }>;
  upsert(id: string, value: T, updatedAt: number): void;
  remove(id: string): void;
  listTombstones(): Array<{ id: string; deletedAt: number }>;
  clearTombstone(id: string): void;
}
interface CollectionGateway {
  fetchAll(userId: string): Promise<Array<{ id: string; data: unknown; deleted: boolean; updatedAt: number }>>;
  upsert(userId: string, id: string, data: unknown, deleted: boolean, updatedAt: number): Promise<void>;
}
class CollectionSync<T> {
  constructor(gateway, port, mapper);
  syncOnce(userId): Promise<SyncStatus>;  // 'synced' | 'error' | ...
}
```

**Reconciliation algorithm.** Build the union of ids from `port.list()`,
`gateway.fetchAll()`, and `port.listTombstones()`. For each id:
- **local state**: a local tombstone → `{ deleted:true, ts:deletedAt }`; else present
  locally → `{ value, ts:updatedAt }`; else absent.
- **remote state**: the row → `{ value/deleted, ts:updatedAt }`; else absent.
- `pickWinner(local, remote)` by ts (tie→local).
- **apply only to the stale side**:
  - winner deleted → ensure local removed + remote upserted as tombstone; clear the
    local tombstone once the remote write confirms.
  - winner has value → ensure local has it (`upsert`) + remote upserted.
  - if both sides already equal (same ts/state) → no write.
- Local-first: any throw leaves local untouched and returns `'error'` (never throws to
  UI), exactly like `ProfileSync`.

### Local ports — `drafts-local-port.ts`, `draft-records-local-port.ts`
Implement `CollectionLocalPort<T>` over the existing localStorage keys, reusing the
existing read/write/validation helpers in `lib/new-loom/draft-storage.ts` and
`lib/new-loom/draft-records.ts`. The **tombstone log** is a small companion key
(`loom.new.drafts.tombstones.v1`, `loom.new.draft-records.tombstones.v1`) holding
`{ id, deletedAt }[]`. SSR-safe (`window` guards), quota-safe (try/catch), mirroring
`local-store-port.ts`.

### Singleton port — `workbench-local-port.ts`
Reuses the `ProfileLocalPort` shape (read / write / getLocalUpdatedAt /
setLocalUpdatedAt) over `loom.workbench.current` with its own version-clock key.

### Mappers — `draft-mapper.ts`, `draft-record-mapper.ts`
`recordToRow(record, userId) → { id, data, deleted:false, updatedAt }` and
`rowToRecord(row) → { value, updatedAt } | null`. **Reuse the existing `isDraftRecord`
type guards** for validation and **`lib/profile/safe-href`** to drop unsafe reference
hrefs on ingest (drafts carry reference hrefs — same hardening `rowToProfile` does for
the profile). A garbage or malformed row is **skipped** (`rowToRecord` returns
`null`), never throws — unlike the singleton profile mapper, a collection must never
materialize a bogus draft from bad data. Deleted rows (`deleted=true`) bypass
`rowToRecord` entirely; the engine handles them by tombstone state, so `data` content
is irrelevant once `deleted` is set.

### Gateways — `drafts-gateway.ts`, `draft-records-gateway.ts`, `workbench-gateway.ts`
Thin wrappers over `getSupabaseClient()`; each returns `null` when unconfigured.
`fetchAll` selects `(<id>, data, deleted, updated_at)`; `upsert` does
`upsert(..., { onConflict: 'user_id,<id>' })`. The singleton workbench gateway mirrors
`profile-gateway`.

### Hook — `use-drafts-sync.ts`
Mirrors `useProfileSync`: full sync of all three stores on **sign-in** (`getSession` +
`onAuthChange`) and on **window focus**; **debounced push** (1200ms) on local
draft-change events; **reuses `createPendingSyncQueue`** (its `{full, docIds}` mode is
exactly per-draft dirty tracking) for retry. Returns `{ session, status }` for the UI.
Inert when no engine. Never throws.

### Events — `draft-events.ts`
A tiny emitter (`notifyDraftChanged` / `onDraftChange`) mirroring `profile-events.ts`,
fired from the existing draft save/delete code paths so the hook knows to push and so
a delete records its tombstone.

## Testing strategy (TDD — mirrors Phase 1's 35 tests)

In-memory fakes, no live Supabase. New tests:
- `collection-sync`: per-doc LWW, add (one side only), delete/tombstone propagation,
  tie→local, **resurrect-on-newer-edit** (remote edit newer than local delete wins),
  delete-beats-older-edit, no-op when equal, error path leaves local untouched.
- ports: list/upsert/remove + tombstone round-trip; SSR no-op; quota-safe.
- mappers: normalize, **drop unsafe href**, garbage → skipped.
- workbench singleton: push/pull/tie, version-clock monotonicity.
- gateways: inert (`null`) when unconfigured.
- `use-drafts-sync`: status transitions, inert when signed out / unconfigured.

**Gate:** the full existing suite + the new tests + typecheck all green. The static
export must still build with no env (inert path).

## Non-goals (Phase 3)

- **macOS native `LoomDraftStore` reconciliation** — Phase 3 syncs the web
  localStorage stores via in-page `supabase-js` (same scope as Phase 1). Reconciling
  the Swift-side native mirror is the "IndexedDB-vs-native-mirror reconciliation" the
  roadmap assigns to **Phase 4**.
- **Artifact blobs** (Phase 2), **learning engine** (Phase 4), **public signup**
  (Phase 5).
- **Real-time / multiplayer.** This is LWW pull-on-sign-in + push-on-change, not live
  collaboration.

## File plan

New: `lib/sync/collection-sync.ts`, `drafts-local-port.ts`,
`draft-records-local-port.ts`, `workbench-local-port.ts`, `draft-mapper.ts`,
`draft-record-mapper.ts`, `drafts-gateway.ts`, `draft-records-gateway.ts`,
`workbench-gateway.ts`, `draft-events.ts`, `use-drafts-sync.ts` (+ their tests).
Edited (minimal): the existing draft save/delete code paths to fire `draft-events`
and record tombstones; `docs/supabase-setup.md` gains the optional Phase 3 SQL.
**No edits to any Phase 1 sync/auth file.**
