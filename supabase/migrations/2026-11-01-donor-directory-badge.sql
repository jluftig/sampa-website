-- Donor directory badge. Paste into the Supabase SQL editor. Idempotent.
--
-- Paste order (project xbzzawjnphpnexwfjtif):
--   1. supabase/migrations/2026-11-01-join-flow-profile.sql  (PR #162)
--   2. this file
-- PR #162 is merged. Its SQL may still be unapplied. This file drops the
-- directory functions that file creates and recreates them with a donor
-- column. The rest of those function bodies is unchanged. Do not paste
-- this file first.
--
-- profiles.donated_at is the latest successful /donate gift matched to the
-- profile. The directory RPCs return donor (true for the last 12 months)
-- and do not return the timestamp or the amount.
-- Backfill uses donations rows only. A user id wins. Otherwise a Stripe
-- customer or email matches only when exactly one profile has it.

alter table public.profiles add column if not exists donated_at timestamptz;

alter table public.donations add column if not exists stripe_charge_id text;
create unique index if not exists donations_charge_uidx on public.donations (stripe_charge_id);

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
       new.role               is distinct from old.role
    or new.membership_status  is distinct from old.membership_status
    or new.membership_tier    is distinct from old.membership_tier
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.renews_on          is distinct from old.renews_on
    or new.cancel_at_period_end is distinct from old.cancel_at_period_end
    or new.membership_years   is distinct from old.membership_years
    or new.patron             is distinct from old.patron
    or new.donated_at         is distinct from old.donated_at
    or new.can_edit_news      is distinct from old.can_edit_news
    or new.can_view_members   is distinct from old.can_view_members
    or new.is_board           is distinct from old.is_board
    or new.is_membership_committee is distinct from old.is_membership_committee
    or new.is_committee_chair is distinct from old.is_committee_chair
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;


-- Gifts already tied to a profile.
update public.profiles p
set donated_at = g.latest
from (
  select d.user_id as profile_id, max(d.created_at) as latest
  from public.donations d
  where d.status = 'succeeded'
    and d.amount > 0
    and d.user_id is not null
  group by d.user_id
) g
where p.id = g.profile_id
  and (p.donated_at is null or p.donated_at < g.latest);

-- No user id, and exactly one profile owns this Stripe customer.
update public.profiles p
set donated_at = g.latest
from (
  select d.stripe_customer_id, max(d.created_at) as latest
  from public.donations d
  where d.status = 'succeeded'
    and d.amount > 0
    and d.user_id is null
    and nullif(btrim(d.stripe_customer_id), '') is not null
  group by d.stripe_customer_id
) g
where p.stripe_customer_id = g.stripe_customer_id
  and (
    select count(*) from public.profiles p2
    where p2.stripe_customer_id = g.stripe_customer_id
  ) = 1
  and (p.donated_at is null or p.donated_at < g.latest);

-- No user id, customer missing or not unique, and exactly one profile has this email.
update public.profiles p
set donated_at = g.latest
from (
  select lower(btrim(d.donor_email)) as email, max(d.created_at) as latest
  from public.donations d
  where d.status = 'succeeded'
    and d.amount > 0
    and d.user_id is null
    and nullif(btrim(d.donor_email), '') is not null
    and (
      nullif(btrim(d.stripe_customer_id), '') is null
      or (
        select count(*) from public.profiles p2
        where p2.stripe_customer_id = d.stripe_customer_id
      ) is distinct from 1
    )
  group by lower(btrim(d.donor_email))
) g
where lower(btrim(p.email)) = g.email
  and (
    select count(*) from public.profiles p2
    where lower(btrim(p2.email)) = g.email
  ) = 1
  and (p.donated_at is null or p.donated_at < g.latest);

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
  donor boolean,
  email text,
  phone text,
  primary_practice_setting text,
  focus_areas text[],
  mentor_open boolean
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
    (p.donated_at is not null and p.donated_at >= (now() - interval '12 months')),
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end,
    p.primary_practice_setting,
    p.focus_areas,
    case when p.mentor_visible then p.mentor_open else null end
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
  donor boolean,
  email text,
  phone text,
  primary_practice_setting text,
  focus_areas text[],
  mentor_open boolean
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
    (p.donated_at is not null and p.donated_at >= (now() - interval '12 months')),
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end,
    p.primary_practice_setting,
    p.focus_areas,
    case when p.mentor_visible then p.mentor_open else null end
  from public.profiles p
  where p.id = member_id
    and p.directory_visible
    and p.membership_status = 'active';
end;
$$;
