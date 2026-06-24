# LOOM Backend — Phase 2: Artifact Blob Sync — Design

**Status:** approved (brainstorming) — 2026-06-24
**Owner:** Yiping Yin
**Builds on:** [Phase 1 — Auth + Profile Sync](2026-06-24-loom-backend-phase1-auth-profile-sync-design.md)

## Goal

Make uploaded proof files **openable on every signed-in device**. The artifact
*metadata* (the citeable `ArtifactRef`: id/name/kind/thumbnail/excerpt) already
rides inside the `BeginnerProfile`, so **Phase 1 already syncs it**. The gap is the
**blob bytes**: they live only in device-local IndexedDB (`loom-artifacts`, keyed by
`af_*` id, see `lib/artifact/artifact-store.ts`), so on a second device the profile
shows the artifact but "Open" (`getArtifactObjectUrl(id)`) finds no blob and fails.

Phase 2 syncs the bytes via Supabase **Storage**. Same stance as Phase 1/3:
local-first, additive, **inert without `NEXT_PUBLIC_SUPABASE_*`**. Phase 1 + Phase 3
code untouched.

## Decisions (owner, 2026-06-24)

- **Strategy: push-on-upload (eager) + lazy-pull-on-open.** Blobs are large; only
  download what you actually open. On upload the blob is pushed; on sign-in any
  local blob not yet in Storage is pushed; on "Open" a locally-missing blob is
  pulled from Storage and cached.
- **No metadata table.** Storage holds only the raw blob at `{userId}/{artifactId}`.
  Meta on pull comes from the profile's synced `ArtifactRef`. The push-dedup index is
  Storage's own object `list()`; the pull-discovery index is the profile's
  `ArtifactRef`s.

## Storage model — one private bucket, per-user RLS

Bucket **`artifacts`** (private, `public = false`). Object path
**`{userId}/{artifactId}`**, raw bytes only. RLS on `storage.objects` scopes every
object to its owner's folder:

```sql
insert into storage.buckets (id, name, public) values ('artifacts', 'artifacts', false)
  on conflict (id) do nothing;
create policy "own artifact objects - select" on storage.objects
  for select using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - insert" on storage.objects
  for insert with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - update" on storage.objects
  for update using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - delete" on storage.objects
  for delete using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
```

The anon key stays public-safe; Storage RLS is the protection. Appended to
`docs/supabase-setup.md` as the optional Phase 2 step. Until the bucket exists, the
gateway's calls error → sync swallows → artifacts stay local-only.

## Components (new files + minimal additive edits)

### `lib/artifact/artifact-blob-gateway.ts`
Supabase Storage wrapper; returns `null` when `getSupabaseClient()` is null (inert),
mirroring `profile-gateway`.
```ts
export interface ArtifactBlobGateway {
  listRemoteIds(userId: string): Promise<string[]>;          // object names under {userId}/
  upload(userId: string, id: string, blob: Blob): Promise<void>;
  download(userId: string, id: string): Promise<Blob | null>;
  remove(userId: string, id: string): Promise<void>;
}
export function artifactBlobGateway(): ArtifactBlobGateway | null;
```
`upload` uses `storage.from('artifacts').upload(`${userId}/${id}`, blob, { upsert: true })`;
`download` uses `.download(...)`; `listRemoteIds` uses `.list(userId)` and strips to ids.

### `artifact-store.ts` — additive exports (no behavior change to existing API)
- `getArtifactBlob(id): Promise<Blob | null>` — raw blob for upload.
- `hasArtifact(id): Promise<boolean>` — local presence.
- `putArtifactRecord(meta: ArtifactMeta, blob: Blob): Promise<void>` — cache a record
  verbatim (NO thumbnail/excerpt recompute), used when caching a pulled blob.
- `setArtifactRemoteFallback(fn: ((id: string) => Promise<boolean>) | null)` — a single
  module-level pointer (NO supabase/profile import — just a function). `getArtifactObjectUrl(id)`,
  on a local miss, awaits the fallback (which downloads + caches), then re-reads and
  returns the URL. This makes lazy-pull transparent to the 3 existing Open call sites
  (`VerifiedArtifactCard`, `CapabilityMap`, `AskYiping`) — zero edits to them.
- `putArtifact` emits `notifyArtifactAdded(meta.id)` after a successful store.

### `lib/artifact/artifact-sync.ts` — the engine (testable with fakes)
```ts
export interface ArtifactLocalPort {
  listIds(): Promise<string[]>;
  has(id: string): Promise<boolean>;
  readBlob(id: string): Promise<Blob | null>;
  writeBlob(id: string, blob: Blob, metaHint: ArtifactMetaHint): Promise<void>;
}
export type ArtifactMetaHint = { name: string; kind: ArtifactKind; size?: number };
export async function pushAllArtifacts(userId, gateway, port): Promise<void>;   // upload local ids - remote ids
export async function pushArtifact(userId, id, gateway, port): Promise<void>;   // one blob
export async function ensureArtifactLocal(userId, id, metaHint, gateway, port): Promise<boolean>; // miss->download+cache
```
Local-first: every function swallows errors (best-effort), never throws to UI; a
failed push/pull just leaves state as-is for the next attempt. `pushAll` reconciles
`port.listIds()` minus `gateway.listRemoteIds(userId)` and uploads the difference.
`ensureArtifactLocal` returns false (and no-ops) when already local or unconfigured.

### `lib/artifact/artifact-events.ts`
`notifyArtifactAdded(id)` / `onArtifactAdded(cb)` and `notifyArtifactDeleted(id)` /
`onArtifactDeleted(cb)`, mirroring `profile-events`/`draft-events`. SSR-safe. Fired
from `putArtifact` / `deleteArtifact` respectively.

### `lib/artifact/use-artifact-sync.ts` — the hook
Mirrors the Phase 1/3 hooks. On sign-in (+ window focus) → `pushAllArtifacts`. Installs
the `setArtifactRemoteFallback` closure (captures `session.userId` + reads the current
profile's `ArtifactRef` for the meta hint) so Open lazily pulls. Listens to
`onArtifactAdded` → `pushArtifact`. On unmount, clears the fallback. Inert (no gateway)
→ no-op; signed out → no fallback installed.

### Delete propagation
`deleteArtifact` emits `notifyArtifactDeleted(id)`; the hook listens and calls
`gateway.remove(userId, id)` best-effort, so a delete removes the remote object too —
zero edits to the UI call sites (consistent with the add path).

## Data flow
- **Upload** → `putArtifact` stores locally + emits `artifactAdded` → hook `pushArtifact`.
- **Sign-in / focus** → `pushAllArtifacts` (push local blobs missing from Storage).
- **Open on device B** → `getArtifactObjectUrl(id)` local-miss → fallback
  `ensureArtifactLocal(userId, id, ref)` downloads `{userId}/{id}` + caches via
  `putArtifactRecord` → URL returned, file opens.
- **Delete** → local `deleteArtifact` + `gateway.remove`.

## Testing (TDD, in-memory fakes — mirrors Phase 1/3)
- `artifact-sync`: `pushAll` uploads exactly the local-minus-remote diff (no re-upload
  of already-remote ids); `ensureArtifactLocal` downloads+writes on miss, no-ops on hit
  and returns false; `pushArtifact` uploads one; error path (gateway throws) is
  swallowed, no throw, local untouched.
- `artifact-blob-gateway`: returns `null` when unconfigured.
- `artifact-events`: fires on notify, unsubscribes, SSR no-op.
- fallback seam: `getArtifactObjectUrl` invokes the registered fallback on a miss and
  not on a hit (tested at the engine/port seam with fakes; the IndexedDB internals
  stay browser-only).
- **Gate:** full suite + typecheck green; static export builds inert.

## Non-goals (Phase 2)
- No metadata table; no thumbnail/excerpt recompute on pull (meta from the ref).
- No eager full pull (pull is lazy on Open).
- No public sharing of blobs; no cross-user access (RLS forbids it).
- macOS native artifact mirror reconciliation; Phase 4 (learning); Phase 5 (signup).

## File plan
New: `lib/artifact/artifact-blob-gateway.ts`, `artifact-sync.ts`, `artifact-events.ts`,
`use-artifact-sync.ts` (+ tests). Edited (additive, non-Phase-1): `artifact-store.ts`
(3 new exports + fallback seam + emit `artifactAdded`/`artifactDeleted` from
`putArtifact`/`deleteArtifact`); `docs/supabase-setup.md` (bucket SQL). **No edits to
any Phase 1 or Phase 3 file, and no edits to the artifact UI call sites.**
