-- ============================================================================
-- Member networking directory + Board capability (2026-07-10)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of the sections added to
-- supabase/schema.sql (source of truth). Run BEFORE deploying code that
-- depends on these columns / RPCs.
--
--   1. profiles: is_board (admin-set), directory_visible / share_email /
--      share_phone (self-editable privacy for the peer directory)
--   2. guard_profile_role + log_permission_change cover is_board
--   3. RPCs (SECURITY DEFINER, column allowlist — do NOT open profiles SELECT):
--        member_directory(search, state_filter)
--        member_directory_profile(member_id)
-- ============================================================================

-- ----- 1. Columns --------------------------------------------------------------
alter table public.profiles add column if not exists is_board         boolean not null default false;
alter table public.profiles add column if not exists directory_visible boolean not null default true;
alter table public.profiles add column if not exists share_email       boolean not null default true;
alter table public.profiles add column if not exists share_phone       boolean not null default false;

-- ----- 2. Permission audit + guard (is_board is admin-only) --------------------
create or replace function public.log_permission_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare changes jsonb := '{}'::jsonb;
begin
  if new.role is distinct from old.role then
    changes := changes || jsonb_build_object('role', jsonb_build_array(old.role, new.role));
  end if;
  if new.can_edit_news is distinct from old.can_edit_news then
    changes := changes || jsonb_build_object('can_edit_news', jsonb_build_array(old.can_edit_news, new.can_edit_news));
  end if;
  if new.can_view_members is distinct from old.can_view_members then
    changes := changes || jsonb_build_object('can_view_members', jsonb_build_array(old.can_view_members, new.can_view_members));
  end if;
  if new.is_board is distinct from old.is_board then
    changes := changes || jsonb_build_object('is_board', jsonb_build_array(old.is_board, new.is_board));
  end if;
  if changes <> '{}'::jsonb then
    insert into public.audit_log (actor_id, actor_email, action, target_email, detail)
    values (
      auth.uid(),
      (select email from public.profiles where id = auth.uid()),
      'permissions_changed',
      new.email,
      changes
    );
  end if;
  return new;
end; $$;

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
    or new.can_edit_news      is distinct from old.can_edit_news
    or new.can_view_members   is distinct from old.can_view_members
    or new.is_board           is distinct from old.is_board
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;

-- ----- 3. Directory RPCs -------------------------------------------------------
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
  state text,
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
    p.state,
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
      or p.state ilike '%' || q || '%'
      or (p.share_email and p.email ilike '%' || q || '%')
    )
    and (st is null or p.state = st)
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
  state text,
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
    p.state,
    p.is_board,
    case when p.share_email then p.email else null end,
    case when p.share_phone then p.phone else null end
  from public.profiles p
  where p.id = member_id
    and p.directory_visible
    and p.membership_status = 'active';
end;
$$;
