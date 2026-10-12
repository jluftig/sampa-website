-- ============================================================================
-- Committee chair flag + Brevo subscriber snapshots (2026-10-08)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of supabase/schema.sql.
-- Do NOT apply from CI / Vercel preview. Operator applies when ready.
--
-- is_committee_chair is admin-set (People & permissions checkbox).
-- With role = admin and is_board, it opens /board/dashboard including finances.
-- Default off. Do not self-grant (guard_profile_role). Changes are audited.
--
-- subscriber_snapshots stores one row per Brevo list per UTC day.
-- The Vercel cron writes it with the service role. No client policies.
-- ============================================================================

alter table public.profiles
  add column if not exists is_committee_chair boolean not null default false;

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
  if new.is_membership_committee is distinct from old.is_membership_committee then
    changes := changes || jsonb_build_object('is_membership_committee', jsonb_build_array(old.is_membership_committee, new.is_membership_committee));
  end if;
  if new.is_committee_chair is distinct from old.is_committee_chair then
    changes := changes || jsonb_build_object('is_committee_chair', jsonb_build_array(old.is_committee_chair, new.is_committee_chair));
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
    or new.patron             is distinct from old.patron
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

create table if not exists public.subscriber_snapshots (
  snapshot_date       date not null,
  list_id             integer not null,
  total_subscribers   integer not null,
  unique_subscribers  integer not null,
  primary key (snapshot_date, list_id)
);

alter table public.subscriber_snapshots enable row level security;
