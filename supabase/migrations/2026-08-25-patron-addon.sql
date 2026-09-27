-- ============================================================================
-- Patron add-on flag (2026-08-25)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of supabase/schema.sql.
-- Do NOT apply from CI / Vercel preview. Operator applies when ready.
--
-- Patron is extra support on top of a real membership_tier (fellow / sustaining
-- / …). It is NEVER stored as membership_tier. Default off.
-- There is no AAPA column on profiles — do not infer AAPA from this flag.
-- ============================================================================

alter table public.profiles
  add column if not exists patron boolean not null default false;

-- Block self-grant of patron (same rule as other membership/billing columns).
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
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;
