-- Board agendas/minutes and Relay balances leave the public repo.
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Tables start empty. Load rows with scripts/seed-private-records.mjs
-- and a local JSON file that is not in git.
-- Requires 2026-10-08-committee-chair-subscriber-snapshots.sql
-- (is_committee_chair) so can_view_board_dashboard() compiles.

create or replace function public.can_view_board_dashboard()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' or is_board or is_committee_chair
       from public.profiles where id = auth.uid()),
    false);
$$;

create table if not exists public.board_meetings (
  slug                 text primary key,
  title                text not null,
  meeting_date         date,
  date_label           text,
  time_label           text,
  kind                 text not null default 'regular',
  format               text not null default 'virtual',
  location             text,
  era                  text,
  status               text not null default 'completed',
  summary              text,
  agenda_status        text not null default 'not_yet',
  agenda_label         text,
  agenda_html          text,
  agenda_pdf_url       text,
  minutes_status       text not null default 'not_yet',
  minutes_label        text,
  minutes_html         text,
  minutes_pdf_url      text,
  minutes_approved_on  date,
  sort_index           integer not null default 0,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references public.profiles(id)
);

create table if not exists public.relay_balances (
  id            uuid primary key default gen_random_uuid(),
  amount_cents  integer not null check (amount_cents >= 0),
  as_of         date not null,
  source        text not null default 'Relay',
  created_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles(id)
);

create or replace function public.stamp_board_meeting()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end; $$;

drop trigger if exists board_meetings_stamp on public.board_meetings;
create trigger board_meetings_stamp
  before insert or update on public.board_meetings
  for each row execute function public.stamp_board_meeting();

create or replace function public.stamp_relay_balance()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end; $$;

drop trigger if exists relay_balances_stamp on public.relay_balances;
create trigger relay_balances_stamp
  before insert on public.relay_balances
  for each row execute function public.stamp_relay_balance();

create or replace function public.log_board_meeting_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, actor_email, action, detail)
  values (
    auth.uid(),
    (select email from public.profiles where id = auth.uid()),
    case when tg_op = 'INSERT' then 'board_meeting_created' else 'board_meeting_updated' end,
    jsonb_build_object(
      'slug', new.slug,
      'status', new.status,
      'agenda_status', new.agenda_status,
      'minutes_status', new.minutes_status
    )
  );
  return new;
end; $$;

drop trigger if exists board_meetings_audit on public.board_meetings;
create trigger board_meetings_audit
  after insert or update on public.board_meetings
  for each row execute function public.log_board_meeting_change();

create or replace function public.log_relay_balance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, actor_email, action, detail)
  values (
    auth.uid(),
    (select email from public.profiles where id = auth.uid()),
    'relay_balance_recorded',
    jsonb_build_object('as_of', new.as_of, 'amount_cents', new.amount_cents)
  );
  return new;
end; $$;

drop trigger if exists relay_balances_audit on public.relay_balances;
create trigger relay_balances_audit
  after insert on public.relay_balances
  for each row execute function public.log_relay_balance();

alter table public.board_meetings enable row level security;
alter table public.relay_balances enable row level security;

drop policy if exists board_meetings_select on public.board_meetings;
create policy board_meetings_select on public.board_meetings
  for select using ( public.is_active_member() );

drop policy if exists board_meetings_insert on public.board_meetings;
create policy board_meetings_insert on public.board_meetings
  for insert with check ( public.is_admin() );

drop policy if exists board_meetings_update on public.board_meetings;
create policy board_meetings_update on public.board_meetings
  for update using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists board_meetings_delete on public.board_meetings;
create policy board_meetings_delete on public.board_meetings
  for delete using ( public.is_admin() );

drop policy if exists relay_balances_select on public.relay_balances;
create policy relay_balances_select on public.relay_balances
  for select using ( public.can_view_board_dashboard() );

drop policy if exists relay_balances_insert on public.relay_balances;
create policy relay_balances_insert on public.relay_balances
  for insert with check ( public.is_admin() );
