-- Migration: bup dosing tool anonymous analytics (run once in the Supabase SQL editor,
-- BEFORE deploying client code that logs events). Idempotent.

-- Anonymous tool-usage analytics (bup dosing tool)
-- Append-only event log. NO PII by design: session_id is a random per-visit
-- uuid (sessionStorage), never a user id; columns are length/enum-constrained;
-- no free-text fields. Anyone may INSERT constrained rows (the tool is
-- public); only admins can SELECT; no UPDATE/DELETE policies exist.
-- ---------------------------------------------------------------------------
create table if not exists public.tool_events (
  id uuid primary key default gen_random_uuid(),
  tool text not null check (char_length(tool) <= 40),
  tool_version text not null check (char_length(tool_version) <= 20),
  session_id uuid not null,
  event text not null check (event in
    ('terms_accepted','outcome_reached','protocol_viewed','summary_copied','summary_printed')),
  outcome_key text check (char_length(outcome_key) <= 60),
  answers jsonb check (pg_column_size(answers) <= 4096),
  environment text check (environment in ('production','preview','development')),
  created_at timestamptz not null default now()
);

create index if not exists tool_events_tool_created_idx
  on public.tool_events (tool, created_at desc);

alter table public.tool_events enable row level security;

drop policy if exists tool_events_insert on public.tool_events;
create policy tool_events_insert on public.tool_events
  for insert to anon, authenticated
  with check ( tool = 'bup' );  -- widen when a second tool ships

drop policy if exists tool_events_select on public.tool_events;
create policy tool_events_select on public.tool_events
  for select using ( public.is_admin() );
