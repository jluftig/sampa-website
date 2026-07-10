-- ============================================================================
-- Multi-organization profile + city per employer (2026-07-10)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of the sections added to
-- supabase/schema.sql (source of truth). Run BEFORE deploying code that
-- depends on organizations / city.
--
--   1. profiles.city (denormalized primary city, from organizations[0])
--   2. profiles.organizations jsonb — array of
--        { name, city, state, practice_setting }
--   3. Backfill organizations from legacy organization/city/practice_setting
--      (does NOT copy personal profiles.state into org entries — that field is
--      home/membership state, often from member_import)
--   4. member_directory* RPCs return organizations + city; search/filter
--      across personal state AND every listed employer
-- ============================================================================

-- ----- 1. Columns --------------------------------------------------------------
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists organizations jsonb not null default '[]'::jsonb;

-- ----- 2. Backfill from legacy single-org columns ------------------------------
-- Only when organizations is still empty and at least one org-related field is
-- set. Leave personal profiles.state alone (do not copy it into the org object).
update public.profiles
set organizations = jsonb_build_array(
  jsonb_strip_nulls(jsonb_build_object(
    'name', nullif(btrim(organization), ''),
    'city', nullif(btrim(city), ''),
    'practice_setting', nullif(btrim(practice_setting), '')
  ))
)
where organizations = '[]'::jsonb
  and (
    nullif(btrim(organization), '') is not null
    or nullif(btrim(city), '') is not null
    or nullif(btrim(practice_setting), '') is not null
  );

-- ----- 3. Directory RPCs (drop + recreate — return shape changed) --------------
drop function if exists public.member_directory(text, text);
drop function if exists public.member_directory_profile(uuid);

create or replace function public.member_directory(
  search text default null,
  state_filter text default null
)
returns table (
  id uuid,
  full_name text,
  credentials text,
  organization text,
  practice_setting text,
  city text,
  state text,
  organizations jsonb,
  is_board boolean,
  email text,
  phone text
)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := nullif(btrim(coalesce(search, '')), '');
  st text := nullif(btrim(coalesce(state_filter, '')), '');
begin
  if not public.is_active_member() then
    return;
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.credentials,
    p.organization,
    p.practice_setting,
    p.city,
    p.state,
    p.organizations,
    p.is_board,
    case when p.share_email then p.email else null end,
    case when p.share_phone then p.phone else null end
  from public.profiles p
  where p.directory_visible
    and p.membership_status = 'active'
    and (
      q is null
      or p.full_name ilike '%' || q || '%'
      or p.organization ilike '%' || q || '%'
      or p.credentials ilike '%' || q || '%'
      or p.city ilike '%' || q || '%'
      or p.state ilike '%' || q || '%'
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        where o->>'name' ilike '%' || q || '%'
           or o->>'city' ilike '%' || q || '%'
           or o->>'state' ilike '%' || q || '%'
           or o->>'practice_setting' ilike '%' || q || '%'
      )
      or (p.share_email and p.email ilike '%' || q || '%')
    )
    and (
      st is null
      or p.state = st
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        where o->>'state' = st
      )
    )
  order by p.full_name nulls last, p.email nulls last;
end;
$$;

create or replace function public.member_directory_profile(member_id uuid)
returns table (
  id uuid,
  full_name text,
  credentials text,
  organization text,
  practice_setting text,
  city text,
  state text,
  organizations jsonb,
  is_board boolean,
  email text,
  phone text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active_member() then
    return;
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.credentials,
    p.organization,
    p.practice_setting,
    p.city,
    p.state,
    p.organizations,
    p.is_board,
    case when p.share_email then p.email else null end,
    case when p.share_phone then p.phone else null end
  from public.profiles p
  where p.id = member_id
    and p.directory_visible
    and p.membership_status = 'active';
end;
$$;
