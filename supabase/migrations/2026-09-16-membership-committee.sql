-- ============================================================================
-- Membership Committee capability (2026-09-16)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of supabase/schema.sql.
-- Do NOT apply from CI / Vercel preview. Operator applies when ready.
--
-- is_membership_committee is admin-set (People & permissions checkbox).
-- Together with is_board it gates the /dashboard Site traffic card.
-- Default off. Do not self-grant (guard_profile_role).
--
-- After apply: People & permissions → check Membership Committee for
-- Clarissa Peterson (chair), Kelsy Babbitt Ruggiero, Megan Zawacki,
-- Lamont Scott. Optional: Jonathan Baker (Membership advisor).
-- Josh is Membership chair and already is_board — no extra flag required.
-- ============================================================================

alter table public.profiles
  add column if not exists is_membership_committee boolean not null default false;

-- Log committee-flag changes with the other permission columns.
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

-- Block self-grant of the committee flag (same rule as is_board).
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
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;
