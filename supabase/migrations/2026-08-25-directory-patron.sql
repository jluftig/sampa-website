-- ============================================================================
-- Directory Patron badge (2026-08-25)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of the member_directory*
-- sections in supabase/schema.sql (source of truth). Run BEFORE deploying
-- code that reads `patron` from those RPCs.
--
-- profiles.patron already exists (T35 / 2026-08-25-patron-addon.sql). This
-- only adds it to the peer-directory allowlist so /members can show a Patron
-- badge. Patron is never a membership_tier.
-- ============================================================================

-- Drop first: create or replace cannot add OUT columns.
drop function if exists public.member_directory(text, text);
drop function if exists public.member_directory(text, text, text[]);
drop function if exists public.member_directory_profile(uuid);

create or replace function public.member_directory(
  search text default null,
  state_filter text default null,
  settings_filter text[] default null
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
  patron boolean,
  email text,
  phone text
)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := nullif(btrim(coalesce(search, '')), '');
  st text := nullif(btrim(coalesce(state_filter, '')), '');
  sf text[] := nullif(settings_filter, '{}'::text[]);
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
    p.patron,
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
      or p.practice_setting ilike '%' || q || '%'
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        where o->>'name' ilike '%' || q || '%'
           or o->>'role' ilike '%' || q || '%'
           or o->>'city' ilike '%' || q || '%'
           or o->>'state' ilike '%' || q || '%'
           or o->>'practice_setting' ilike '%' || q || '%'
           or o->>'practice_setting_other' ilike '%' || q || '%'
           or o->>'website' ilike '%' || q || '%'
           or exists (
             select 1
             from jsonb_array_elements_text(coalesce(o->'practice_settings', '[]'::jsonb)) s(slug)
             where s.slug ilike '%' || q || '%'
           )
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
    and (
      sf is null
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        cross join lateral jsonb_array_elements_text(
          coalesce(o->'practice_settings', '[]'::jsonb)
        ) s(slug)
        where s.slug = any(sf)
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
  patron boolean,
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
    p.patron,
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
