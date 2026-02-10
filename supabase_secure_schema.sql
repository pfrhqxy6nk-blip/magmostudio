-- Safer Supabase schema (RLS + Supabase Auth)
-- Apply in Supabase SQL editor (run as a migration).
--
-- IMPORTANT:
-- - This assumes you use Supabase Auth (auth.users) for login/password.
-- - If you currently store plaintext passwords in public.profiles.password, migrate away and then DROP that column.
-- - Service Role bypasses RLS (keep it secret).

-- Extensions
create extension if not exists pgcrypto;

-- Helper: admin check (uses profiles row for current auth user)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

-- ==========================================================
-- Profiles (1:1 with auth.users)
-- ==========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  phone text,
  company text,
  role text,
  avatar text,
  is_admin boolean not null default false,
  is_root boolean not null default false,
  notifications jsonb not null default '{"email": true, "push": true, "browser": false}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Anyone can create a profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Profiles: read own or admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "Profiles: insert own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "Profiles: update own or admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.email
    )
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ==========================================================
-- Projects
-- ==========================================================
-- If you already have `public.projects` from an older schema, this adds the missing column
-- so the policies below can be created without failing.
alter table if exists public.projects
  add column if not exists owner_id uuid;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  budget text,
  description text,
  contact text,
  status text not null default 'PENDING',
  progress integer not null default 0,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  -- Maintenance (optional, after delivery)
  maintenance_status text not null default 'NONE', -- NONE | REQUESTED | ACTIVE | CANCELED
  maintenance_plan_id text,
  maintenance_plan_name text,
  maintenance_plan_price text,
  maintenance_started_at timestamptz,
  maintenance_ended_at timestamptz,
  maintenance_requested_plan_id text,
  maintenance_requested_plan_name text,
  maintenance_requested_plan_price text,
  maintenance_requested_at timestamptz,
  roadmap jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  tech_log jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  visuals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Projects are viewable by everyone" on public.projects;
drop policy if exists "Anyone can create a project" on public.projects;
drop policy if exists "Anyone can update projects" on public.projects;
drop policy if exists "Anyone can delete projects" on public.projects;

create policy "Projects: read own or admin"
on public.projects
for select
using (owner_id = auth.uid() or public.is_admin());

create policy "Projects: insert own or admin"
on public.projects
for insert
with check (owner_id = auth.uid() or public.is_admin());

create policy "Projects: update own or admin"
on public.projects
for update
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "Projects: delete own or admin"
on public.projects
for delete
using (owner_id = auth.uid() or public.is_admin());

-- ==========================================================
-- Portfolio (public read, admin write)
-- ==========================================================
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  image text,
  description text,
  tags jsonb not null default '[]'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio enable row level security;

drop policy if exists "Portfolio is viewable by everyone" on public.portfolio;
drop policy if exists "Anyone can modify portfolio" on public.portfolio;

create policy "Portfolio: public read"
on public.portfolio
for select
using (true);

create policy "Portfolio: admin write"
on public.portfolio
for all
using (public.is_admin())
with check (public.is_admin());

-- ==========================================================
-- Requests (public insert, admin manage)
-- ==========================================================
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  telegram text,
  details text,
  category text,
  budget text,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;

drop policy if exists "Requests are manageable" on public.requests;

create policy "Requests: public create"
on public.requests
for insert
with check (true);

create policy "Requests: admin read"
on public.requests
for select
using (public.is_admin());

create policy "Requests: admin update"
on public.requests
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Requests: admin delete"
on public.requests
for delete
using (public.is_admin());

-- ==========================================================
-- Storage (videos bucket: private, per-user folder)
-- ==========================================================
-- Make bucket private (optional; recommended)
update storage.buckets set public = false where id = 'videos';

-- Enforce path: "<uid>/<filename>"
drop policy if exists "Public Videos" on storage.objects;
drop policy if exists "Allow Video Uploads" on storage.objects;

create policy "Videos: read own or admin"
on storage.objects
for select
using (
  bucket_id = 'videos'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "Videos: upload to own folder"
on storage.objects
for insert
with check (
  bucket_id = 'videos'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Videos: update own or admin"
on storage.objects
for update
using (
  bucket_id = 'videos'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'videos'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy "Videos: delete own or admin"
on storage.objects
for delete
using (
  bucket_id = 'videos'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);
