# LOOM Backend — Phase 1: Auth + Profile Sync — Design

**Status:** approved (brainstorming) — 2026-06-24
**Owner:** Yiping Yin

## Goal

Stand up the real backend foundation and ship the smallest end-to-end vertical
slice that proves it: **sign in on one device, see your Digital Me on another.**
Phase 1 = Supabase project + `profiles` table (per-user RLS) + email/password
auth + a sign-in UI + **profile-only** cloud sync + migration of the existing
local profile. Everything is built so the schema is **multi-tenant from day one**
(per-user rows) while v1 only the owner logs in.

## Non-goals (explicitly deferred)

- **Phase 2** — artifact blobs (Supabase Storage). Not in Phase 1.
- **Phase 3** — Studio drafts sync.
- **Phase 4** — learning engine (traces/panels/weaves): needs the
  IndexedDB-vs-native-mirror reconciliation + append-only event merge.
- **Phase 5** — public multi-user signup (schema is already per-user, so this is
  mostly enabling signups + onboarding UI later).
- The Swift native bridge + Keychain token storage (a future hardening; v1 uses
  in-page `supabase-js`).

## Architecture

**Local-first; Supabase is an additive cloud layer.**

- IndexedDB/localStorage remains the **authoritative offline cache**. Signed-out,
  LOOM behaves exactly as today — 100% local, no network. This preserves the
  "your data stays local" stance: cloud is additive, opt-in.
- **Signing in turns on sync.** A signed-in user's profile is pushed to / pulled
  from Supabase; the local store stays the working copy.

**Transport — one code path on both targets.**

`@supabase/supabase-js` runs **in-page** on both the Vercel web build and the
macOS static app. The app's `loom://` CSP already allows `https:`
(`LoomURLSchemeHandler.swift:125-152`) and ATS allows valid-TLS hosts
(`Info.plist:36-40`), so the webview calls Supabase directly. No new Next API
route (they don't exist in the static app) and no new Swift bridge.

Config via **`NEXT_PUBLIC_SUPABASE_URL`** + **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**.
The anon key is public-safe by design — Row-Level Security is the actual
protection. `ANTHROPIC_*` secrets remain server-only and never enter the static
bundle (unchanged).

**Graceful degradation (critical).** When the two `NEXT_PUBLIC_SUPABASE_*` vars
are absent — today's builds, the test runner, any static export shipped without
config — the entire backend layer is **inert**: `getSupabaseClient()` returns
`null`, the sign-in UI renders a "cloud sync not configured" state, and LOOM runs
100% local exactly as now. This keeps the existing 730 contract tests green and
the static export building without a live backend.

## Owner prerequisites (you do these once — I cannot create accounts for you)

1. Create a Supabase project (free tier is fine).
2. Run the schema SQL (provided in this spec / the plan) in the SQL editor.
3. In Supabase Auth settings, **disable public signups** (owner-only).
4. Create your owner account (email/password) in the Supabase dashboard.
5. Put `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the web
   env (Vercel) and in the static-export build env so the app bundle carries
   them.

Until step 5 is done in a given build, that build runs in the inert local-only
mode above — so the code can land and be unit-tested before the project exists.

## Data model

```sql
-- profiles: one row per user; the BeginnerProfile JSON.
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "own profile - select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "own profile - insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile - update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- `data` holds the full `BeginnerProfile` (already a single canonical record).
- `updated_at` drives last-write-wins.
- RLS guarantees a user can only ever read/write their own row, even on a buggy
  query — this is what makes the multi-tenant foundation safe from day one.

## Components (file boundaries)

Each unit has one purpose, a clear interface, and is testable in isolation.

- **`lib/supabase/client.ts`** — `getSupabaseClient(): SupabaseClient | null`.
  SSR-safe singleton; returns `null` when the env vars are absent (inert mode).
  The ONLY place that reads `NEXT_PUBLIC_SUPABASE_*`.
- **`lib/auth/auth-client.ts`** — thin wrapper over `supabase.auth`:
  `signIn(email, password)`, `signOut()`, `getSession()`,
  `onAuthChange(cb)`. Null-safe: every method no-ops/returns a typed
  "unconfigured" result when the client is `null`.
- **`lib/sync/profile-mapper.ts`** — pure `rowToProfile(row)` /
  `profileToRow(profile, userId)`; `rowToProfile` runs `normalizeBeginnerProfile`
  as the trust boundary on every server→client ingest.
- **`lib/sync/merge.ts`** — pure `pickWinner(local, remote)` last-write-wins by
  `updated_at` (+ tie-break rules). No I/O. Fully unit-tested.
- **`lib/sync/profile-sync.ts`** — orchestration: `pull()`, `push()`,
  `syncOnce()`, status events (`idle|syncing|synced|offline|error`). Takes the
  client + a local-store port via constructor injection so tests pass a fake.
- **`lib/sync/local-store-port.ts`** — interface over the existing
  `read/writeBeginnerProfileLocal` + a `lastSyncedAt` marker, so the sync engine
  never imports localStorage directly (testable, and keeps `profile-storage.ts`
  unchanged/decoupled).
- **`app/account/`** — sign-in page (email + password) + a sync-status chip +
  sign-out. Uses `auth-client` + `profile-sync`. When unconfigured, shows the
  "cloud sync not configured" state.
- **Wiring into existing write seams** — profile writes already broadcast a
  `:changed` signal (recon: `pending-queue.ts`/`*:changed` pattern). The sync
  engine **subscribes** to that signal and debounces a push; we do NOT add a hard
  dependency from `profile-storage.ts` into the sync layer (one-way: sync depends
  on storage, not vice-versa).

## Data flow

1. **Sign in** → `auth-client.signIn` → on success, `profile-sync.syncOnce()`:
   - `pull()` the server row. If present and `remote.updated_at > local`, merge
     (LWW) into the local store via the port.
   - `push()` if the local profile is newer or the server row is absent
     (first-time **migration**: the existing local profile — including a profile
     loaded via `/me` — uploads as the user's first server row).
2. **Local change while signed in** → `:changed` signal → debounced `push()`
   (upsert `profiles` row, bump `updated_at`).
3. **App focus / periodic** while signed in → `pull()` to pick up edits from
   other devices.
4. **Sign out** → stop syncing; local store untouched (still usable offline).

## Migration (localStorage → server)

First successful sign-in on a device: if the server row is absent, the current
local `BeginnerProfile` is uploaded as-is (this is the migration — no separate
import step). If both exist, LWW by `updated_at` decides. No row-history/audit
table in v1 — acceptable because the profile is a single editable record and the
owner controls both devices. `/me`'s `OWNER_PROFILE` continues to seed the local
store offline; once signed in, the server copy is the cross-device truth.

## Error handling

- **Offline / push failure** — never blocks the UI (local-first). The dirty
  marker persists; the engine retries on the next focus/interval. Status chip
  shows `offline`/`error`.
- **Auth errors** (bad password, signups disabled) — surfaced inline in the
  sign-in UI; no console-only failures.
- **Cross-user safety** — RLS makes a mis-scoped query return zero rows rather
  than another user's data.
- **Malformed server data** — `rowToProfile` normalizes every ingest, so a
  tampered/old row can't inject unsafe hrefs or oversized fields.

## Security

- Anon key is public (RLS is the protection). No service-role key ever ships to
  the client.
- Public signups disabled → owner-only in practice even though the schema is
  multi-tenant.
- `normalizeBeginnerProfile` re-run on every server→client ingest.
- `ANTHROPIC_*` and any service secret remain server-only; never `NEXT_PUBLIC_*`.

## Testing

- **Fake Supabase client** implementing the narrow surface the sync layer uses
  (`from().select()/upsert()`, `auth.*`) → `profile-sync` tested end-to-end with
  no live DB.
- **Pure-unit**: `merge.pickWinner` (LWW + ties), `profile-mapper` round-trip
  (incl. normalize-on-ingest dropping an unsafe href), migration branch
  (server-empty → upload; both-present → LWW).
- **Inert-mode test**: with env vars absent, `getSupabaseClient()` is `null`, the
  account page renders the unconfigured state, and no sync runs — proving the
  static build/tests are unaffected.
- **Static export** must still build with `@supabase/supabase-js` added (it is
  client-safe / tree-shakeable). Keep the existing 730 contract tests green;
  register new tests in `test:contracts`.
- New route `/account` classified in `product-shell.ts` (internal) so the
  route-classification contract test passes.

## Open items resolved by assumption (revisit if wrong)

- Web deploy: Phase 1 talks client→Supabase directly, so it works whether or not
  the Vercel `/api` surface is live.
- No history/audit table in v1 (single-record profile; owner-controlled devices).
