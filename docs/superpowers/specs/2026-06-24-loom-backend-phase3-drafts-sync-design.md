# LOOM Backend — Phase 3: Studio Drafts Sync — Design

**Status:** approved (brainstorming) — 2026-06-24
**Owner:** Yiping Yin
**Builds on:** [Phase 1 — Auth + Profile Sync](2026-06-24-loom-backend-phase1-auth-profile-sync-design.md)

## Goal

Sign in on one device → your Studio drafts appear on another. Phase 3 extends the
Phase 1 backend from a single profile blob to the **draft collections**, proving the
per-document collection-sync model the later phases (2 artifacts, 4 learning) reuse.

Same stance as Phase 1: **local-first, additive cloud.** Signed-out or with
`NEXT_PUBLIC_SUPABASE_*` absent, LOOM behaves exactly as today — 100% local, no
network, all existing contract tests green. Signing in turns on draft sync.

## Scope — what syncs (owner decisions 2026-06-24)

Two **collection** stores:

1. **`loom.new.drafts.v1`** — canonical Studio block documents (`NewLoomDraftRecord`
   in `lib/new-loom/draft-storage.ts`: `id/title/body/blocks?/references/
   includedInDigitalMe?/createdAt/updatedAt`). Written today by `createDraft` /
   `updateDraft`.
2. **`loom.new.draft-records.v1`** — lighter "AI answer" records (`NewLoomDraftRecord`
   in `lib/new-loom/draft-records.ts`: `id/title/answer/sourceLabels/sourceHrefs/
   draftUrl/status/updatedAt`). Written today by `saveDraftRecord` (an upsert-by-id).

**Dropped from scope:** `loom.workbench.current`. Grounding the plan found it is a
**dead/legacy key** — only ever *read* once as a legacy-body migration
(`DraftClient.tsx:355`, `draft-storage.ts:2114`); nothing writes it. There is no live
"current draft" pointer, so syncing it would add a table + engine for zero value.

## Conflict model (owner decisions 2026-06-24)

- **Per-document rows.** Each draft is an independent row with its own LWW timestamp.
  Editing draft A on device 1 and draft B on device 2 never clobbers either. Each
  record already carries its own ISO `updatedAt` — that is the LWW stamp; no separate
  per-doc clock.
- **Soft-delete tombstones, built into the engine.** The collection engine + ports
  carry full tombstone support (a `deleted=true` row + the delete's timestamp), so a
  delete propagates and only resurrects if the other side has a strictly newer edit.
  This is the correct collection model and is kept even though **no delete path exists
  yet** (see Deletes below) — the cost is one extra column + a small reconcile branch,
  and it future-proofs the chosen model.
- Tie → prefer **local** (never clobber a just-made local edit), matching `pickWinner`.

### Deletes — engine-ready, wiring deferred

Today neither store has a delete API (`draft-storage.ts` exposes create/update only;
`draft-records.ts` exposes save only). So the local **tombstone log is empty in
practice** until a delete feature lands. Phase 3 builds the engine/port tombstone
support and tests it with fakes, but wires only **create/update** change-events. When
a delete UI is added later, it records a tombstone via the port and sync handles it —
no engine change needed.

## Architecture

**Independent of profile sync.** Drafts sync runs as its own pass against its own
tables; it does not touch `profiles` or the Phase 1 `ProfileSync`. The
`includedInDigitalMe` flag lives inside each draft record, so curation state syncs for
free as part of the row `data`.

**Transport — unchanged from Phase 1.** `@supabase/supabase-js` in-page on both the
Vercel web build and the macOS static app. No new Next API route, no new Swift bridge.
Config via the same two `NEXT_PUBLIC_SUPABASE_*` vars.

**New generic engine, Phase 1 untouched (owner decision 2026-06-24).** The
per-document reconciliation lands as a new generic `lib/sync/collection-sync.ts` that
reverse-reuses the already-generic `pickWinner` from `merge.ts`. The singleton
`ProfileSync` is left exactly as-is. Phase 2 (artifacts) and Phase 4 (learning) reuse
`collection-sync`.

**Graceful degradation (critical, same as Phase 1).** With the two
`NEXT_PUBLIC_SUPABASE_*` vars absent, the gateways return `null`, the `use-drafts-sync`
hook no-ops, and LOOM is 100% local. Keeps the existing contract tests green and the
static export building without a live backend.

## Data model — 2 tables, per-user RLS (mirrors `profiles`)

```sql
-- Studio block documents (loom.new.drafts.v1): one soft-deletable row per draft.
create table public.drafts (
  user_id    uuid not null references auth.users(id) on delete cascade,
  draft_id   text not null,
  data       jsonb,                       -- full record; ignored when deleted=true
  deleted    boolean not null default false,
  updated_at timestamptz not null,        -- mirrors the record's updatedAt / delete time
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
```

The anon key remains public-safe; RLS is the protection. This SQL appends to
`docs/supabase-setup.md` as an optional Phase 3 step. Absent tables → the gateway's
fetch errors → sync returns `error` and leaves local untouched (degrades to local-only).

## Components (new files — zero Phase 1 edits)

### `lib/sync/collection-sync.ts` — the reusable engine
Orchestrator parameterized over a local port + gateway + mapper. Reuses `Stamped<T>` /
`pickWinner` from `merge.ts`.

```ts
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
export class CollectionSync<T> {
  constructor(gateway: CollectionGateway, port: CollectionLocalPort<T>, mapper: CollectionMapper<T>);
  syncOnce(userId: string): Promise<SyncStatus>;   // SyncStatus from profile-sync.ts
}
```

**Reconciliation.** Build the union of ids from `port.list()`, `gateway.fetchAll()`,
and `port.listTombstones()`. For each id, derive a local `Side` (present | deleted |
absent — a local tombstone newer-or-equal than a present item wins) and a remote
`Side` (deleted row → deleted; non-deleted row whose `data` maps to `null` → treated
as absent; else present). `pickWinner` by timestamp (tie→local). Then:
1. **Push remote to the winner first** (so a thrown gateway error leaves local
   untouched — local-first): if remote differs, `gateway.upsert(...)` with
   value-or-tombstone.
2. **Bring local to the winner**: present & local differs → `port.upsert`; deleted &
   local present → `port.remove`.
3. `port.clearTombstone(id)` (by now local+remote are consistent for this id).

Any throw → `syncOnce` returns `'error'`, local untouched, tombstone retained for retry.

### `lib/sync/drafts-local-port.ts`, `draft-records-local-port.ts`
Implement `CollectionLocalPort<T>` over the existing localStorage keys. Reading reuses
`listDrafts` / `loadDraftRecords`. Writing needs a low-level by-id upsert/remove:
- **Minimal edit to `draft-storage.ts`:** export `upsertDraftRecordById(record, opts?)`
  and `removeDraftById(id, opts?)` (thin wrappers over the existing private
  `readDrafts`/`writeDrafts`). `draft-records.ts`: reuse `saveDraftRecord` for upsert;
  add `removeDraftRecordById(id, opts?)`.
- Tombstone log: a companion key per store (`loom.new.drafts.tombstones.v1`,
  `loom.new.draft-records.tombstones.v1`) holding `{ id, deletedAt }[]`. SSR-safe
  (`window` guards) and quota-safe (try/catch), mirroring `local-store-port.ts`.

### `lib/sync/draft-mapper.ts`, `draft-record-mapper.ts`
`toData(record) → record` (identity-ish; the jsonb stores the record) and
`fromData(data) → record | null`. **Reuse the existing `isDraftRecord` type guards**
(export them) for validation and **`lib/profile/safe-href`** to drop unsafe reference
hrefs on ingest. A garbage/malformed row is **skipped** (`fromData` returns `null`),
never throws — a collection must never materialize a bogus draft from bad data.

### `lib/sync/drafts-gateway.ts`, `draft-records-gateway.ts`
Thin wrappers over `getSupabaseClient()`; each returns `null` when unconfigured.
`fetchAll` selects `(<id> as id, data, deleted, updated_at)` and maps `updated_at`
ISO→ms; `upsert` does `from('<table>').upsert(row, { onConflict: 'user_id,<id>' })`,
storing `updated_at` as an ISO string. Mirrors `profile-gateway.ts`.

### `lib/sync/draft-events.ts`
A tiny emitter (`notifyDraftsChanged` / `onDraftsChange`) mirroring `profile-events.ts`,
fired from the existing `createDraft` / `updateDraft` / `saveDraftRecord` call sites so
the hook knows to push.

### `lib/sync/use-drafts-sync.ts`
Mirrors `useProfileSync`: full sync of **both** collections on **sign-in**
(`getSession` + `onAuthChange`) and on **window focus**; **debounced push** (1200ms) on
`onDraftsChange`; **reuses `createPendingSyncQueue`** for retry. Returns
`{ session, status }`. Inert when no engine. Never throws.

## Testing strategy (TDD — mirrors Phase 1's 35 tests)

In-memory fakes, no live Supabase:
- `collection-sync`: per-doc LWW, add (one side only), delete/tombstone propagation,
  tie→local, **resurrect-on-newer-edit** (remote edit newer than local delete wins),
  delete-beats-older-edit, no-op when equal, error path leaves local untouched.
- ports: list/upsert/remove + tombstone round-trip; SSR no-op; quota-safe.
- mappers: normalize, **drop unsafe href**, garbage → `null`.
- gateways: inert (`null`) when unconfigured.
- `use-drafts-sync`: status transitions, inert when signed out / unconfigured.

**Gate:** full existing suite + new tests + typecheck all green; static export still
builds with no env (inert path).

## Non-goals (Phase 3)

- **Workbench pointer sync** — dead legacy key (see Scope).
- **Delete UI / delete-event wiring** — no delete path exists; tombstone support is
  engine-only future-proofing.
- **macOS native `LoomDraftStore` reconciliation** — Phase 3 syncs the web
  localStorage stores via in-page `supabase-js` (same scope as Phase 1); native-mirror
  reconciliation is **Phase 4**.
- **Artifact blobs** (Phase 2), **learning engine** (Phase 4), **public signup**
  (Phase 5), **real-time / multiplayer**.

## File plan

New: `lib/sync/collection-sync.ts`, `drafts-local-port.ts`,
`draft-records-local-port.ts`, `draft-mapper.ts`, `draft-record-mapper.ts`,
`drafts-gateway.ts`, `draft-records-gateway.ts`, `draft-events.ts`,
`use-drafts-sync.ts` (+ their tests).
Edited (minimal, non-Phase-1): `draft-storage.ts` (export `isDraftRecord` +
`upsertDraftRecordById` + `removeDraftById`, fire `notifyDraftsChanged` in
`createDraft`/`updateDraft`); `draft-records.ts` (export its `isDraftRecord` + add
`removeDraftRecordById`, fire `notifyDraftsChanged` in `saveDraftRecord`);
`docs/supabase-setup.md` (optional Phase 3 SQL). **No edits to any Phase 1 sync/auth
file.**
