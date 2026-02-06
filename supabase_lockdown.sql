-- Immediate hardening (locks DB down)
-- This is the only "real" way to make your current setup safe without first migrating auth/backend:
-- remove public RLS policies so the browser (anon key) cannot read/write your tables.
--
-- WARNING: your current frontend will stop working until you move DB access to:
-- - Supabase Auth + strict RLS, OR
-- - a backend (Vercel/Edge Functions) using the service-role key.

-- Enable RLS on your tables (no policies => deny by default)
alter table if exists public.profiles enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.portfolio enable row level security;
alter table if exists public.requests enable row level security;

-- Drop ALL existing policies on these tables (so nothing remains public).
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'projects', 'portfolio', 'requests')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Same for storage.objects (optional but recommended)
alter table if exists storage.objects enable row level security;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- With RLS enabled and no policies, anon/authenticated clients cannot access data.
-- Your service role key (server-side only) still can, because service role bypasses RLS.

