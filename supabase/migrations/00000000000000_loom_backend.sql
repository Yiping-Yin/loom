-- LOOM backend schema (local dev) — Phases 1–4, mirrors docs/supabase-setup.md.

-- Phase 1: profiles
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile - select" on public.profiles for select using (auth.uid() = user_id);
create policy "own profile - insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile - update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Phase 3: Studio drafts + AI answer records
create table public.drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null, primary key (user_id, draft_id));
alter table public.drafts enable row level security;
create policy "own drafts - select" on public.drafts for select using (auth.uid() = user_id);
create policy "own drafts - insert" on public.drafts for insert with check (auth.uid() = user_id);
create policy "own drafts - update" on public.drafts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drafts - delete" on public.drafts for delete using (auth.uid() = user_id);

create table public.draft_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null, data jsonb, deleted boolean not null default false,
  updated_at timestamptz not null, primary key (user_id, record_id));
alter table public.draft_records enable row level security;
create policy "own draft_records - select" on public.draft_records for select using (auth.uid() = user_id);
create policy "own draft_records - insert" on public.draft_records for insert with check (auth.uid() = user_id);
create policy "own draft_records - update" on public.draft_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own draft_records - delete" on public.draft_records for delete using (auth.uid() = user_id);

-- Phase 4: learning engine (traces / panels / weaves)
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

-- Phase 2: artifact blobs (Storage)
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

-- Table-level privileges for the signed-in (authenticated) role. RLS filters ROWS,
-- but the role still needs base table grants — without this, every request 403s
-- ("permission denied for table ..."). Supabase cloud auto-grants via default
-- privileges, but a raw migration / self-hosted stack needs this explicitly.
grant select, insert, update, delete on
  public.profiles, public.drafts, public.draft_records,
  public.traces, public.panels, public.weaves
  to authenticated;
