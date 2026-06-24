# Supabase setup (owner sync)

LOOM's Digital Me lives in `localStorage` on each device. The optional Supabase
backend lets the **owner** sign in and sync that profile across devices (the
macOS app, the web build, a second laptop). It is owner-only by design: public
sign-ups are disabled, and a stranger who opens `/account` sees an inert
"cloud off / not configured" state until the env vars are set.

This is a one-time owner setup. Nothing here changes the product for visitors.

## Steps

1. **Create a Supabase project.** Sign in at <https://supabase.com>, create a
   new project, and pick a region close to you. Wait for it to finish
   provisioning.

2. **Run the schema SQL.** Open the project's **SQL editor**, paste the schema
   below, and run it. This creates the `profiles` table and the row-level
   security policies that scope every row to its owner.

   ```sql
   create table public.profiles (
     user_id    uuid primary key references auth.users(id) on delete cascade,
     data       jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.profiles enable row level security;
   create policy "own profile - select" on public.profiles for select using (auth.uid() = user_id);
   create policy "own profile - insert" on public.profiles for insert with check (auth.uid() = user_id);
   create policy "own profile - update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   -- RLS filters rows, but the signed-in role still needs table-level grants.
   -- Supabase cloud auto-grants via default privileges; this is explicit so a
   -- self-hosted / raw-migration setup doesn't 403 ("permission denied for table").
   grant select, insert, update, delete on public.profiles to authenticated;
   ```

3. **Enable Email auth + DISABLE public sign-ups.** Under
   **Authentication → Providers**, enable the **Email** provider. Then under
   **Authentication → settings** (sign-up / user-signups), **disable public
   sign-ups** so the project is owner-only — no stranger can create an account.

4. **Create the owner user.** Still under **Authentication → Users**, click
   **Add user** and create your owner account with an **email + password**.
   Because sign-ups are disabled, this dashboard step is the only way an account
   comes into existence.

5. **Copy the credentials.** Open **Project settings → API** and copy:
   - the **Project URL**, and
   - the **anon public** key.

   Both are safe to expose in client builds — RLS is what protects the data, not
   secrecy of the anon key. Do **not** use the `service_role` key here.

6. **Set the env vars on BOTH builds.** The same two variables must be present
   wherever LOOM is built, because the values are inlined at build time:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<your Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon public key>
   ```

   - **Web / Vercel build:** add them to the Vercel project's Environment
     Variables (Production + Preview as needed).
   - **Static-export build (macOS app):** export them in the shell / build
     environment that runs the static export, so they are inlined into the
     exported bundle the app ships.

7. **Rebuild, then sign in.** Rebuild both targets so the env values are baked
   in. Open **`/account`**, sign in with the owner email + password from step 4.
   On the **first sync** your local Digital Me uploads to the `profiles` row; on
   **other devices** it pulls down so every device converges on the same
   profile.

## Notes

- With the env vars **unset**, `/account` stays inert ("cloud off") and the rest
  of the product is unchanged — sync is purely additive.
- `@supabase/supabase-js` is client-safe and works in the static export; no
  server runtime is required.

## Optional — Phase 2: artifact file sync (run once, owner)

Run this to sync uploaded proof files (the *bytes*) across devices via Supabase
Storage; the artifact metadata already syncs inside your profile. Until the bucket
exists, files stay local and "Open" only works on the device that uploaded them.

```sql
-- private bucket; one folder per user
insert into storage.buckets (id, name, public) values ('artifacts', 'artifacts', false)
  on conflict (id) do nothing;
-- RLS: a user may only touch objects under their own {userId}/ folder
create policy "own artifact objects - select" on storage.objects
  for select using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - insert" on storage.objects
  for insert with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - update" on storage.objects
  for update using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own artifact objects - delete" on storage.objects
  for delete using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);
```

## Optional — Phase 3: Studio drafts sync (run once, owner)

Run this in the SQL editor to also sync your Studio drafts and AI answer records
across devices. Until the tables exist, drafts simply stay local — the rest of
LOOM is unaffected. Same per-user RLS model as `profiles`.

```sql
-- Studio block documents (loom.new.drafts.v1): one soft-deletable row per draft.
create table public.drafts (
  user_id    uuid not null references auth.users(id) on delete cascade,
  draft_id   text not null,
  data       jsonb,
  deleted    boolean not null default false,
  updated_at timestamptz not null,
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
grant select, insert, update, delete on public.drafts, public.draft_records to authenticated;
```

## Optional — Phase 4: learning engine sync (run once, owner)

Run this to sync your learning corpus — traces (reading sessions), panels
(thought judgments), and weaves (connections) — across devices. Traces merge by
append-only event union; panels/weaves by last-write-wins. Same per-user RLS model.

```sql
create table public.traces (
  user_id uuid not null references auth.users(id) on delete cascade,
  trace_id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null, primary key (user_id, trace_id));
create table public.panels (
  user_id uuid not null references auth.users(id) on delete cascade,
  panel_id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null, primary key (user_id, panel_id));
create table public.weaves (
  user_id uuid not null references auth.users(id) on delete cascade,
  weave_id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null, primary key (user_id, weave_id));
-- Per-user RLS on each (repeat the 4 policies per table, swapping the table name):
alter table public.traces enable row level security;
create policy "own traces - select" on public.traces for select using (auth.uid() = user_id);
create policy "own traces - insert" on public.traces for insert with check (auth.uid() = user_id);
create policy "own traces - update" on public.traces for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own traces - delete" on public.traces for delete using (auth.uid() = user_id);
alter table public.panels enable row level security;
create policy "own panels - select" on public.panels for select using (auth.uid() = user_id);
create policy "own panels - insert" on public.panels for insert with check (auth.uid() = user_id);
create policy "own panels - update" on public.panels for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own panels - delete" on public.panels for delete using (auth.uid() = user_id);
alter table public.weaves enable row level security;
create policy "own weaves - select" on public.weaves for select using (auth.uid() = user_id);
create policy "own weaves - insert" on public.weaves for insert with check (auth.uid() = user_id);
create policy "own weaves - update" on public.weaves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own weaves - delete" on public.weaves for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.traces, public.panels, public.weaves to authenticated;
```
