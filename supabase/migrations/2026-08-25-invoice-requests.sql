-- ============================================================================
-- Employer invoice requests (2026-08-25, T38)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Mirror of supabase/schema.sql.
-- Do NOT apply from CI / Vercel preview. Operator applies when ready.
--
-- Quiet /join side door. Submit does NOT charge a card and does NOT activate
-- membership. Service role writes the row; staff may read. No client writes.
-- ============================================================================

create table if not exists public.membership_invoice_requests (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  user_id                  uuid references public.profiles(id) on delete set null,
  invoice_number           text not null unique,
  member_name              text not null,
  member_email             text not null,
  credentials              text,
  employer                 text not null,
  ap_name                  text not null,
  ap_email                 text not null,
  billing_address          text not null,
  po_number                text,
  tier                     text not null,
  duration                 text not null,
  aapa_member              boolean,
  patron                   boolean not null default false,
  amount_cents             integer not null,
  stripe_payment_link_id   text,
  stripe_payment_url       text,
  status                   text not null default 'requested'
);

create index if not exists membership_invoice_requests_user_id_idx
  on public.membership_invoice_requests (user_id);
create index if not exists membership_invoice_requests_created_at_idx
  on public.membership_invoice_requests (created_at desc);

alter table public.membership_invoice_requests enable row level security;

drop policy if exists membership_invoice_requests_select on public.membership_invoice_requests;
create policy membership_invoice_requests_select on public.membership_invoice_requests
  for select using ( public.is_admin() or public.is_member_viewer() );
