-- ============================================================================
-- Directory contact separate from account contact (2026-07-10)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent. Run AFTER member-directory (+ profile-organizations if used).
--
-- Members often sign in with a personal email but want peers to reach a work
-- inbox. Account email/phone stay for SAMPA ops; directory can reuse those or
-- use directory_email / directory_phone instead.
--
--   1. profiles.directory_use_account_contact (default true)
--   2. profiles.directory_email, profiles.directory_phone (nullable overrides)
--   3. member_directory* RPCs return the effective shared contact
-- ============================================================================

alter table public.profiles
  add column if not exists directory_use_account_contact boolean not null default true;
alter table public.profiles
  add column if not exists directory_email text;
alter table public.profiles
  add column if not exists directory_phone text;

-- Recreate directory RPCs (return shape unchanged; email/phone resolution changes).
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
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end
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
           or o->>'role' ilike '%' || q || '%'
           or o->>'city' ilike '%' || q || '%'
           or o->>'state' ilike '%' || q || '%'
           or o->>'practice_setting' ilike '%' || q || '%'
           or o->>'website' ilike '%' || q || '%'
      )
      or (
        p.share_email
        and (
          case
            when coalesce(p.directory_use_account_contact, true) then p.email
            else nullif(btrim(p.directory_email), '')
          end
        ) ilike '%' || q || '%'
      )
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
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end
  from public.profiles p
  where p.id = member_id
    and p.directory_visible
    and p.membership_status = 'active';
end;
$$;
