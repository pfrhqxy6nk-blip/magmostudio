-- Maintenance subscription fields (projects table)
-- Run this in Supabase SQL editor (public schema) to enable maintenance plan tracking in the admin dashboard.

alter table if exists public.projects
  add column if not exists maintenance_status text default 'NONE',
  add column if not exists maintenance_plan_id text,
  add column if not exists maintenance_plan_name text,
  add column if not exists maintenance_plan_price text,
  add column if not exists maintenance_started_at timestamptz,
  add column if not exists maintenance_ended_at timestamptz,
  add column if not exists maintenance_requested_plan_id text,
  add column if not exists maintenance_requested_plan_name text,
  add column if not exists maintenance_requested_plan_price text,
  add column if not exists maintenance_requested_at timestamptz;

