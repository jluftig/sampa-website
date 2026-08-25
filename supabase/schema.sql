-- ============================================================================
-- SAMPA News Blog — Database schema, security rules, and seed data (Phase 2)
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query ->
--             paste this whole file -> Run.  Safe to re-run (idempotent).
--
-- What this creates:
--   profiles    - one row per signed-in person; role + (future) membership fields
--   posts       - blog articles (draft/published)
--   tags        - controlled tag vocabulary (admin-managed)
--   items       - "Key Points": first-class, taggable bullets that power tag search
--   item_tags   - many-to-many link between items and tags
--   + Row-Level Security so the public can only READ published content, and only
--     editors/admins can WRITE. Role changes are admin-only.
-- ============================================================================

-- ----- Enum types -------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('member', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- ----- Tables -----------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  phone              text,
  role               public.user_role not null default 'member',
  -- Membership/billing: empty for now; populated later by the Stripe webhook.
  stripe_customer_id text,
  membership_tier    text,
  membership_status  text,
  renews_on          timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at         timestamptz not null default now()
);

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  body_html       text,
  cover_image_url text,
  cover_image_caption text,                    -- optional caption/citation for the cover image
  author_id       uuid references public.profiles(id) on delete set null,  -- primary = first in post_authors
  author_name     text,                       -- denormalized byline (joined names); public reads never touch profiles
  status          public.post_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Co-authors for a post (ordered). Source of truth for who wrote it; posts.author_id
-- / author_name are denormalized from this list on save (primary = sort_order 0,
-- author_name = formatted join of display names). Only news editors may be linked.
-- display_name is denormalized so the editor can hydrate without joining profiles.
create table if not exists public.post_authors (
  post_id      uuid not null references public.posts(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  sort_order   int  not null default 0,
  display_name text,
  primary key (post_id, profile_id)
);
alter table public.post_authors add column if not exists display_name text;

-- Add cover_image_caption if the table already existed from an earlier run.
alter table public.posts add column if not exists cover_image_caption text;

-- Professional profile fields (member-editable via the dashboard onboarding
-- form; these replace the old Google Form). Membership/billing columns above
-- stay locked down by guard_profile_role().
alter table public.profiles add column if not exists credentials       text;
alter table public.profiles add column if not exists npi               text;
alter table public.profiles add column if not exists organization      text;
alter table public.profiles add column if not exists practice_setting  text;
alter table public.profiles add column if not exists city              text;
alter table public.profiles add column if not exists state             text;
-- Multi-employer list: [{name, role, city, state, practice_settings[],
-- practice_setting_other, practice_setting (legacy), website}, ...].
-- org.role = job title at that employer (not profiles.role).
-- practice_settings = curated slugs (src/lib/practiceSettings.js).
-- organization / city / practice_setting stay denormalized from
-- organizations[0] for admin roster/CSV. profiles.state is PERSONAL
-- (home/membership — often from member_import), never overwritten from an org.
-- Dashboard is the writer; see src/lib/organizations.js.
alter table public.profiles add column if not exists organizations     jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists newsletter_opt_in boolean not null default true;
alter table public.profiles add column if not exists sms_opt_in        boolean not null default false;
alter table public.profiles add column if not exists onboarded_at      timestamptz;

-- Capability flags (checkbox permissions — people can wear multiple hats).
-- can_edit_news = write news posts (the old 'editor' role, which is kept as a
-- legacy value and honored by is_editor()); can_view_members = READ-ONLY
-- access to the member roster + pledge tracker (/editor/members) for the
-- membership committee, treasurer, etc. is_board = SAMPA board member (badge
-- in the member directory; future board privileges TBD). Admins implicitly have
-- news + member-viewer capabilities; Board is independent (admin ≠ board).
-- Flags are admin-set only (guarded by guard_profile_role).
alter table public.profiles add column if not exists can_edit_news    boolean not null default false;
alter table public.profiles add column if not exists can_view_members boolean not null default false;
alter table public.profiles add column if not exists is_board         boolean not null default false;

-- Member networking directory privacy (self-editable). Opt-out model:
-- directory_visible defaults true so active members appear unless they hide.
-- share_email defaults true (reachable for networking); share_phone defaults
-- false (more sensitive). Never broaden profiles SELECT RLS for this — peer
-- data is exposed only via member_directory* SECURITY DEFINER RPCs.
alter table public.profiles add column if not exists directory_visible boolean not null default true;
alter table public.profiles add column if not exists share_email       boolean not null default true;
alter table public.profiles add column if not exists share_phone       boolean not null default false;
-- Directory contact can reuse account email/phone (default) or use separate
-- directory_email / directory_phone (e.g. work inbox for peers, personal Gmail for sign-in).
alter table public.profiles add column if not exists directory_use_account_contact boolean not null default true;
alter table public.profiles add column if not exists directory_email text;
alter table public.profiles add column if not exists directory_phone text;

-- When this person click-accepted the Confidentiality & Acceptable Use
-- Agreement for privileged access to member data. The members page refuses to
-- render until it's set; the timestamp IS the signature record. Deliberately
-- self-settable (accepting grants nothing — access still requires a flag).
alter table public.profiles add column if not exists privileged_terms_accepted_at timestamptz;

-- One-time backfill: existing editors keep their news permission as a flag.
update public.profiles set can_edit_news = true where role = 'editor' and not can_edit_news;
-- True when a member canceled but their paid term hasn't ended yet: the
-- membership stays active and renews_on becomes the END date, not a renewal.
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;
-- Purchased term length in years (1/2/3; null = lifetime or pre-term data).
-- Webhook-written from the subscription's price interval, shown on the roster.
alter table public.profiles add column if not exists membership_years int;
-- Optional extra support on top of a real membership_tier (fellow / sustaining / …).
-- Never a tier key. Webhook-written from checkout metadata.patron. Default off.
alter table public.profiles add column if not exists patron boolean not null default false;
-- Honor-system AAPA membership (nullable). Self-writable — not in guard_profile_role.
-- We do not verify with AAPA. aapa_member_id is NOT in this change.
alter table public.profiles add column if not exists aapa_member boolean;

create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- full name, e.g. "Opioid Use Disorder"
  short_label text,                       -- compact chip shown inside posts, e.g. "OUD"
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- Add short_label if the table already existed from an earlier run.
alter table public.tags add column if not exists short_label text;

create table if not exists public.items (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  content    text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.item_tags (
  item_id uuid not null references public.items(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (item_id, tag_id)
);

-- Saved/favorite news posts for signed-in members ("My saved items").
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id)    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Donations (separate from membership dues). PUBLIC can give — signed in or
-- not — so user_id is nullable (null = anonymous/non-member gift). Written ONLY
-- server-side by the Stripe webhook (service role); there are no client write
-- policies, same as member_import. One row per successful gift: a one-time gift
-- is keyed by stripe_session_id; each monthly cycle is keyed by its
-- stripe_invoice_id (both unique → the webhook is safe to retry).
create table if not exists public.donations (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references public.profiles(id) on delete set null,
  donor_email              text,
  donor_name               text,
  amount                   integer not null,            -- cents
  currency                 text not null default 'usd',
  frequency                text not null default 'once', -- 'once' | 'monthly'
  status                   text not null default 'succeeded',
  stripe_customer_id       text,
  stripe_session_id        text,                         -- one-time gifts
  stripe_subscription_id   text,                         -- recurring gifts
  stripe_invoice_id        text,                         -- recurring gift cycles
  stripe_payment_intent_id text,
  created_at               timestamptz not null default now()
);
-- NULLs are distinct in a Postgres unique index, so many rows may leave the
-- unused id column null while non-null Stripe ids stay unique (idempotency).
create unique index if not exists donations_session_uidx on public.donations (stripe_session_id);
create unique index if not exists donations_invoice_uidx on public.donations (stripe_invoice_id);
create index if not exists donations_user_id_idx    on public.donations (user_id);
create index if not exists donations_created_at_idx on public.donations (created_at desc);

-- One-time staging for members who signed up via the pre-Stripe Google Form.
-- Rows are matched by email at first login (see claim_member_import) to
-- pre-fill the profile and grandfather paid memberships. Data is inserted
-- manually via the SQL editor and MUST NOT be committed to this public repo.
create table if not exists public.member_import (
  email            text primary key,          -- lowercase; the match key
  first_name       text,
  last_name        text,
  state            text,
  credentials      text,
  phone            text,
  sms_opt_in       boolean not null default false,
  membership_tier  text,                      -- tier key from src/lib/membership.js
  membership_years int,                       -- 1 | 2 | 3 (term they PLEDGED — reference only)
  member_since     timestamptz,               -- original form submission time
  -- The 2026 form sign-ups are unpaid pledges, so importing NEVER grants a
  -- membership by default. Set true (before first login) only for someone
  -- whose payment is confirmed outside Stripe.
  activate         boolean not null default false,
  claimed_at       timestamptz,               -- set once a login consumes the row
  created_at       timestamptz not null default now()
);

create index if not exists posts_status_published_at_idx on public.posts (status, published_at desc);
create index if not exists items_post_id_idx             on public.items (post_id);
create index if not exists item_tags_tag_id_idx          on public.item_tags (tag_id);
create index if not exists post_authors_profile_id_idx   on public.post_authors (profile_id);

-- ----- Helper functions (SECURITY DEFINER so they bypass RLS = no recursion) --
-- "Can write news": the can_edit_news flag, the legacy 'editor' role, or admin.
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('editor','admin') or can_edit_news
       from public.profiles where id = auth.uid()),
    false);
$$;

-- "Can READ member data" (roster + pledge tracker): the can_view_members flag
-- or admin. Read-only by design — profile writes stay own-row-or-admin.
create or replace function public.is_member_viewer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' or can_view_members
       from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false);
$$;

-- Paid-up member (or staff). Gate future member-only content (e.g. CME) on
-- this, the same way posts/tags gate on is_editor()/is_admin().
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select membership_status = 'active' or role in ('editor','admin')
       from public.profiles where id = auth.uid()),
    false);
$$;

-- True when the given profile may be attached as a news co-author (same criteria
-- as is_editor(), but for an arbitrary id). SECURITY DEFINER so INSERT policies
-- on post_authors can validate without opening profiles SELECT to all editors.
create or replace function public.profile_is_news_editor(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('editor','admin') or can_edit_news
       from public.profiles where id = p_id),
    false);
$$;

-- ----- Triggers ---------------------------------------------------------------
-- Merge a member_import row (pre-Stripe Google Form sign-up) into a profile,
-- matched by email. Fills profile fields; membership is granted ONLY for rows
-- explicitly marked activate=true (payment confirmed outside Stripe), with a
-- renewal date of sign-up date + pledged term. Normal path: profile pre-fills,
-- member pays via /join, Stripe webhook sets the membership. SECURITY DEFINER:
-- runs with auth.uid() null, so guard_profile_role lets it write membership.
create or replace function public.claim_member_import(p_profile_id uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare m public.member_import%rowtype;
begin
  select * into m from public.member_import
   where email = lower(p_email) and claimed_at is null;
  if not found then return; end if;

  update public.profiles set
    full_name   = coalesce(nullif(btrim(concat(m.first_name, ' ', m.last_name)), ''), full_name),
    state       = coalesce(m.state, state),
    credentials = coalesce(m.credentials, credentials),
    phone       = coalesce(m.phone, phone),
    sms_opt_in  = (m.sms_opt_in or sms_opt_in),
    membership_tier = case
      when m.activate and m.membership_tier is not null and membership_status is null
      then m.membership_tier else membership_tier end,
    renews_on = case
      when m.activate and m.membership_tier is not null and membership_status is null
      then m.member_since + make_interval(years => m.membership_years) else renews_on end,
    membership_status = case
      when m.activate and m.membership_tier is not null and membership_status is null
      then 'active' else membership_status end
  where id = p_profile_id;

  update public.member_import set claimed_at = now() where email = lower(p_email);
end; $$;

-- Create a profile row automatically the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  -- Grandfather pre-Stripe sign-ups (no-op when there's no matching import row).
  perform public.claim_member_import(new.id, new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Audit trail for member-data governance: permission changes (written by the
-- trigger below) and roster CSV exports (written by the members page).
create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid,             -- who did it (null = SQL editor / service role)
  actor_email  text,
  action       text not null,    -- 'permissions_changed' | 'member_csv_export'
  target_email text,             -- whose permissions changed (if applicable)
  detail       jsonb             -- changed fields / export row count+filter
);

-- Log any change to the permission columns, with old -> new values.
-- SECURITY DEFINER so the insert bypasses audit_log RLS.
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

drop trigger if exists profiles_log_permission_change on public.profiles;
create trigger profiles_log_permission_change
  after update on public.profiles
  for each row execute function public.log_permission_change();

-- Block non-admins from changing a profile's role OR its membership/billing
-- fields (prevents self-promotion and self-granting a paid membership).
-- Regular users can still edit their own name/phone. auth.uid() is null for the
-- SQL editor / service role, so trusted backends (you setting the first admin,
-- and the future Stripe webhook writing membership status) are allowed through.
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

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Keep posts.updated_at fresh.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ----- Row-Level Security -----------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.tags      enable row level security;
alter table public.items     enable row level security;
alter table public.item_tags enable row level security;
alter table public.favorites enable row level security;
-- member_import: contains contact info. Admins may read it (pledge tracking on
-- /editor/members); nobody writes via the API — only the SQL editor, service
-- role, and SECURITY DEFINER functions.
alter table public.member_import enable row level security;
-- donations: a donor may read their OWN gifts (dashboard history); the donor-
-- management group (can_view_members) and admins may read ALL for cultivation.
-- No write policies — only the Stripe webhook (service role) inserts.
alter table public.donations enable row level security;

drop policy if exists donations_select on public.donations;
create policy donations_select on public.donations
  for select using (
    auth.uid() = user_id or public.is_admin() or public.is_member_viewer()
  );

drop policy if exists member_import_select on public.member_import;
create policy member_import_select on public.member_import
  for select using ( public.is_admin() or public.is_member_viewer() );

-- audit_log: admins read; signed-in users may append rows about THEMSELVES
-- (the members page logs its own CSV exports); no update/delete via the API.
alter table public.audit_log enable row level security;

drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log
  for select using ( public.is_admin() );

drop policy if exists audit_log_insert on public.audit_log;
create policy audit_log_insert on public.audit_log
  for insert with check ( actor_id = auth.uid() );

-- profiles: read own row, or all rows for admins and member-viewers (roster);
-- update stays own-or-admin (role/membership/permission columns guarded above)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ( auth.uid() = id or public.is_admin() or public.is_member_viewer() );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using ( auth.uid() = id or public.is_admin() )
              with check ( auth.uid() = id or public.is_admin() );

-- posts: anyone reads published; editors read all + write
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select using ( status = 'published' or public.is_editor() );

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert with check ( public.is_editor() );

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update using ( public.is_editor() ) with check ( public.is_editor() );

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete using ( public.is_editor() );

-- tags: everyone reads; only admins manage the vocabulary
drop policy if exists tags_select on public.tags;
create policy tags_select on public.tags for select using ( true );

drop policy if exists tags_insert on public.tags;
create policy tags_insert on public.tags for insert with check ( public.is_admin() );

drop policy if exists tags_update on public.tags;
create policy tags_update on public.tags for update using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists tags_delete on public.tags;
create policy tags_delete on public.tags for delete using ( public.is_admin() );

-- items: public reads key points of PUBLISHED posts; editors read all + write
drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select using (
    public.is_editor()
    or exists (select 1 from public.posts p where p.id = items.post_id and p.status = 'published')
  );

drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert with check ( public.is_editor() );

drop policy if exists items_update on public.items;
create policy items_update on public.items for update using ( public.is_editor() ) with check ( public.is_editor() );

drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete using ( public.is_editor() );

-- item_tags: public reads links for published posts; editors write
drop policy if exists item_tags_select on public.item_tags;
create policy item_tags_select on public.item_tags
  for select using (
    public.is_editor()
    or exists (
      select 1 from public.items i
      join public.posts p on p.id = i.post_id
      where i.id = item_tags.item_id and p.status = 'published'
    )
  );

drop policy if exists item_tags_insert on public.item_tags;
create policy item_tags_insert on public.item_tags for insert with check ( public.is_editor() );

drop policy if exists item_tags_delete on public.item_tags;
create policy item_tags_delete on public.item_tags for delete using ( public.is_editor() );

-- post_authors: public reads links for published posts; editors read all + write.
-- Inserts/updates must target a news-editor profile (profile_is_news_editor).
alter table public.post_authors enable row level security;

drop policy if exists post_authors_select on public.post_authors;
create policy post_authors_select on public.post_authors
  for select using (
    public.is_editor()
    or exists (select 1 from public.posts p where p.id = post_authors.post_id and p.status = 'published')
  );

drop policy if exists post_authors_insert on public.post_authors;
create policy post_authors_insert on public.post_authors
  for insert with check (
    public.is_editor() and public.profile_is_news_editor(profile_id)
  );

drop policy if exists post_authors_update on public.post_authors;
create policy post_authors_update on public.post_authors
  for update using ( public.is_editor() )
  with check ( public.is_editor() and public.profile_is_news_editor(profile_id) );

drop policy if exists post_authors_delete on public.post_authors;
create policy post_authors_delete on public.post_authors
  for delete using ( public.is_editor() );

-- favorites: strictly own rows; can only save posts that are published
drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select using ( auth.uid() = user_id );

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete using ( auth.uid() = user_id );

-- ----- Storage bucket for cover images ---------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists post_images_read on storage.objects;
create policy post_images_read on storage.objects
  for select using ( bucket_id = 'post-images' );

drop policy if exists post_images_insert on storage.objects;
create policy post_images_insert on storage.objects
  for insert with check ( bucket_id = 'post-images' and public.is_editor() );

drop policy if exists post_images_update on storage.objects;
create policy post_images_update on storage.objects
  for update using ( bucket_id = 'post-images' and public.is_editor() );

drop policy if exists post_images_delete on storage.objects;
create policy post_images_delete on storage.objects
  for delete using ( bucket_id = 'post-images' and public.is_editor() );

-- ----- Seed: starter tag vocabulary (edit freely later in /editor/tags) -------
-- Remove the retired "Treatment & Recovery" tag (replaced by "Psychosocial").
delete from public.tags where slug = 'treatment-recovery';

insert into public.tags (name, short_label, slug) values
  ('Buprenorphine',                'Bup',        'buprenorphine'),
  ('Methadone',                    'Methadone',  'methadone'),
  ('Naltrexone',                   'Naltrexone', 'naltrexone'),
  ('Opioid Use Disorder',          'OUD',        'opioid-use-disorder'),
  ('Alcohol Use Disorder',         'AUD',        'alcohol-use-disorder'),
  ('Stimulant Use Disorder',       'StUD',       'stimulant-use-disorder'),
  ('Methamphetamine Use Disorder', 'MUD',        'methamphetamine-use-disorder'),
  ('Cocaine Use Disorder',         'CUD',        'cocaine-use-disorder'),
  ('Kratom Use Disorder',          'KUD',        'kratom-use-disorder'),
  ('Stimulants',                   'Stimulants', 'stimulants'),
  ('Harm Reduction',               'Harm Rdx',   'harm-reduction'),
  ('Overdose Prevention',          'OD',         'overdose-prevention'),
  ('Psychosocial',                 'Psychosocial','psychosocial'),
  ('Pain Management',              'Pain',       'pain-management'),
  ('Mental Health',                'Mental Hlth','mental-health'),
  ('Adolescents',                  'Teens',      'adolescents'),
  ('Pregnancy & Perinatal',        'Perinatal',  'pregnancy-perinatal'),
  ('Policy & Regulation',          'Policy',     'policy-regulation'),
  ('Research',                     'Research',   'research')
on conflict (slug) do update
  set name = excluded.name,
      short_label = excluded.short_label;

-- ============================================================================
-- AFTER your first Google login (Phase 4), make yourself an admin by running:
--   update public.profiles set role = 'admin' where email = 'luftig@gmail.com';
-- ============================================================================

-- ============================================================================
-- Research-database upgrade (2026-07-07)
-- Everything below is additive + idempotent. Standalone runnable copy:
-- supabase/migrations/2026-07-07-research-db.sql
--
--   1. Original-source citation fields on posts (journal/outlet, URL, date)
--   2. Full-text search (generated tsvector columns + GIN indexes)
--   3. RPCs shared by web + future mobile apps:
--        search_key_points(q)        - FTS over Key Points
--        search_posts(q)             - FTS over articles
--        key_points_for_tags(slugs)  - points carrying ALL of the given keywords
--        related_posts(id, n)        - posts ranked by shared keywords
--        keyword_counts()            - published point count per keyword
--
-- All RPCs are SECURITY INVOKER (RLS applies) AND filter status='published'
-- explicitly, per the "public aggregates never rely on RLS alone" invariant.
-- ============================================================================

-- ----- 1. Original-source citation ---------------------------------------------
-- Where the story/study actually came from; posts.published_at is when WE
-- posted it. Nullable: original SAMPA content has no external source, and
-- posts published before this upgrade predate the fields.
alter table public.posts add column if not exists source_url          text;
alter table public.posts add column if not exists source_name         text;
alter table public.posts add column if not exists source_published_at date;

-- ----- 2. Full-text search -------------------------------------------------------
alter table public.items add column if not exists fts tsvector
  generated always as (to_tsvector('english', content)) stored;
create index if not exists items_fts_idx on public.items using gin (fts);

-- Posts index title + excerpt + tag-stripped body.
alter table public.posts add column if not exists fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' ||
      regexp_replace(coalesce(body_html, ''), '<[^>]+>', ' ', 'g'))
  ) stored;
create index if not exists posts_fts_idx on public.posts using gin (fts);

-- ----- 3. RPCs -------------------------------------------------------------------
create or replace function public.search_key_points(q text)
returns table (
  item_id uuid, content text, post_id uuid, post_title text, post_slug text,
  published_at timestamptz, source_name text, source_url text,
  source_published_at date, rank real
) language sql stable set search_path = public as $$
  select i.id, i.content, p.id, p.title, p.slug, p.published_at,
         p.source_name, p.source_url, p.source_published_at,
         ts_rank(i.fts, websearch_to_tsquery('english', q))
    from public.items i
    join public.posts p on p.id = i.post_id
   where p.status = 'published'  -- explicit: never leak drafts, even to editors
     and i.fts @@ websearch_to_tsquery('english', q)
   order by ts_rank(i.fts, websearch_to_tsquery('english', q)) desc,
            p.published_at desc
   limit 50;
$$;

create or replace function public.search_posts(q text)
returns table (
  id uuid, title text, slug text, excerpt text, cover_image_url text,
  published_at timestamptz, source_name text, rank real
) language sql stable set search_path = public as $$
  select p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.published_at,
         p.source_name,
         ts_rank(p.fts, websearch_to_tsquery('english', q))
    from public.posts p
   where p.status = 'published'
     and p.fts @@ websearch_to_tsquery('english', q)
   order by ts_rank(p.fts, websearch_to_tsquery('english', q)) desc,
            p.published_at desc
   limit 25;
$$;

-- Key Points carrying ALL of the given keyword slugs (AND semantics).
create or replace function public.key_points_for_tags(tag_slugs text[])
returns table (
  item_id uuid, content text, post_id uuid, post_title text, post_slug text,
  published_at timestamptz, source_name text, source_url text,
  source_published_at date
) language sql stable set search_path = public as $$
  select i.id, i.content, p.id, p.title, p.slug, p.published_at,
         p.source_name, p.source_url, p.source_published_at
    from public.items i
    join public.posts p on p.id = i.post_id
   where cardinality(tag_slugs) > 0
     and p.status = 'published'
     and (
       select count(distinct t.id)
         from public.item_tags it
         join public.tags t on t.id = it.tag_id
        where it.item_id = i.id
          and t.slug = any(tag_slugs)
     ) = cardinality(tag_slugs)
   order by p.published_at desc, i.sort_order;
$$;

-- Published posts sharing keywords with the given post, most-overlapping first.
create or replace function public.related_posts(for_post_id uuid, max_results int default 4)
returns table (
  id uuid, title text, slug text, excerpt text, cover_image_url text,
  published_at timestamptz, shared_keywords bigint
) language sql stable set search_path = public as $$
  select p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.published_at,
         count(distinct it_other.tag_id) as shared_keywords
    from public.items i_src
    join public.item_tags it_src   on it_src.item_id = i_src.id
    join public.item_tags it_other on it_other.tag_id = it_src.tag_id
    join public.items i_other      on i_other.id = it_other.item_id
                                  and i_other.post_id <> i_src.post_id
    join public.posts p            on p.id = i_other.post_id
                                  and p.status = 'published'
   where i_src.post_id = for_post_id
   group by p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.published_at
   order by count(distinct it_other.tag_id) desc, p.published_at desc
   limit max_results;
$$;

-- Published Key-Point count per keyword (replaces client-side aggregation, so
-- web and future mobile apps stay consistent).
create or replace function public.keyword_counts()
returns table (id uuid, name text, short_label text, slug text, points bigint)
language sql stable set search_path = public as $$
  select t.id, t.name, t.short_label, t.slug, count(it.item_id) as points
    from public.tags t
    join public.item_tags it on it.tag_id = t.id
    join public.items i      on i.id = it.item_id
    join public.posts p      on p.id = i.post_id and p.status = 'published'
   group by t.id, t.name, t.short_label, t.slug
   order by count(it.item_id) desc, t.name;
$$;

-- ----- Member networking directory ------------------------------------------
-- Peer profiles for active members. SECURITY DEFINER so results bypass the
-- tight profiles SELECT RLS (own / admin / member-viewer only) while still
-- returning a hard allowlist of columns. NEVER expand profiles SELECT RLS to
-- "all active members" — that would leak billing, NPI, flags, etc.
-- Viewer: is_active_member(). Targets: membership_status='active' AND
-- directory_visible. Email/phone null when the owner did not share them.

-- Drop first when return shape or arg list changes (create or replace cannot
-- alter OUT cols; new arity needs the old signature dropped).
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

-- ---------------------------------------------------------------------------
-- Mobile push notifications (added 2026-07: app Phase 4)
-- ---------------------------------------------------------------------------

-- Per-member push preference (self-editable, like newsletter_opt_in; the
-- guard_profile_role trigger doesn't cover it deliberately).
alter table public.profiles add column if not exists push_opt_in boolean not null default true;

-- One row per (user, device token). The app upserts on sign-in/registration;
-- api/send-push.js (service role, bypasses RLS) reads all opted-in tokens and
-- prunes tokens Expo reports as DeviceNotRegistered.
create table if not exists public.device_tokens (
  user_id         uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null check (char_length(expo_push_token) <= 200),
  platform        text not null default 'ios' check (platform in ('ios','android')),
  updated_at      timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

alter table public.device_tokens enable row level security;

-- Own rows only. UPDATE is required for the app's upsert to refresh updated_at.
drop policy if exists device_tokens_select on public.device_tokens;
create policy device_tokens_select on public.device_tokens
  for select using ( auth.uid() = user_id );

drop policy if exists device_tokens_insert on public.device_tokens;
create policy device_tokens_insert on public.device_tokens
  for insert with check ( auth.uid() = user_id );

drop policy if exists device_tokens_update on public.device_tokens;
create policy device_tokens_update on public.device_tokens
  for update using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

drop policy if exists device_tokens_delete on public.device_tokens;
create policy device_tokens_delete on public.device_tokens
  for delete using ( auth.uid() = user_id );

-- ============================================================================
-- Post co-authors (2026-07-15)
-- Standalone runnable copy: supabase/migrations/2026-07-15-post-authors.sql
--
--   post_authors M2M (ordered) + profile_is_news_editor() + list_news_editors()
--   + backfill from posts.author_id. posts.author_id / author_name stay as the
--   denormalized primary + byline for public/mobile reads.
-- ============================================================================

-- Editors-only roster for the PostEditor co-author picker. SECURITY DEFINER so
-- we never widen profiles SELECT RLS (own / admin / member-viewer only). Caller
-- must be an editor; returns a hard allowlist of columns.
create or replace function public.list_news_editors()
returns table (
  id uuid,
  full_name text,
  email text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_editor() then
    return;
  end if;

  return query
  select
    p.id,
    coalesce(nullif(btrim(p.full_name), ''), p.email) as full_name,
    p.email
  from public.profiles p
  where p.role in ('editor', 'admin') or p.can_edit_news
  order by coalesce(nullif(btrim(p.full_name), ''), p.email);
end;
$$;

-- One-time backfill: existing single-author posts become a one-row author list.
insert into public.post_authors (post_id, profile_id, sort_order, display_name)
select p.id, p.author_id, 0, p.author_name
  from public.posts p
 where p.author_id is not null
on conflict do nothing;

-- ============================================================================
-- Member comments + emoji reactions on news (2026-07-15)
-- Standalone runnable copy: supabase/migrations/2026-07-15-member-comments.sql
--
--   Flat text comments (soft-delete) + one emoji reaction per member per post.
--   Public read on published posts; write gated by is_active_member().
--   author_name denormalized — does NOT widen profiles SELECT RLS.
-- ============================================================================

create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  author_name text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

alter table public.post_comments add column if not exists body text;
alter table public.post_comments add column if not exists author_name text not null default '';
alter table public.post_comments add column if not exists created_at timestamptz not null default now();
alter table public.post_comments add column if not exists updated_at timestamptz not null default now();
alter table public.post_comments add column if not exists deleted_at timestamptz;

alter table public.post_comments drop constraint if exists post_comments_body_len;
alter table public.post_comments
  add constraint post_comments_body_len
  check (char_length(btrim(body)) between 1 and 500);

create index if not exists post_comments_post_id_idx
  on public.post_comments (post_id, created_at desc)
  where deleted_at is null;

create index if not exists post_comments_user_id_idx
  on public.post_comments (user_id);

create table if not exists public.post_reactions (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.post_reactions add column if not exists emoji text;
alter table public.post_reactions add column if not exists created_at timestamptz not null default now();

alter table public.post_reactions drop constraint if exists post_reactions_emoji_check;
alter table public.post_reactions
  add constraint post_reactions_emoji_check
  check (emoji in ('thumbs_up', 'celebrate', 'insight', 'heart', 'clap'));

create index if not exists post_reactions_post_id_idx
  on public.post_reactions (post_id);

create or replace function public.stamp_comment_author()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if tg_op = 'UPDATE' then
    -- Never reassign post/user/byline/created_at.
    new.post_id := old.post_id;
    new.user_id := old.user_id;
    new.author_name := old.author_name;
    new.created_at := old.created_at;

    if auth.uid() is distinct from old.user_id then
      -- Staff: soft-delete only (cannot rewrite someone else's text).
      if not public.is_editor() then
        raise exception 'not allowed';
      end if;
      new.body := old.body;
      if new.deleted_at is null then
        raise exception 'editors may only remove comments';
      end if;
    else
      -- Owner: edit body and/or soft-delete.
      new.body := btrim(new.body);
    end if;

    new.updated_at := now();
    return new;
  end if;

  -- INSERT: force identity + stamp denormalized byline.
  new.user_id := auth.uid();
  select coalesce(nullif(btrim(full_name), ''), email)
    into n from public.profiles where id = auth.uid();
  new.author_name := coalesce(n, 'Member');
  new.body := btrim(new.body);
  return new;
end;
$$;

drop trigger if exists stamp_comment_author on public.post_comments;
create trigger stamp_comment_author
  before insert or update on public.post_comments
  for each row execute function public.stamp_comment_author();

create or replace function public.stamp_reaction_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists stamp_reaction_user on public.post_reactions;
create trigger stamp_reaction_user
  before insert or update on public.post_reactions
  for each row execute function public.stamp_reaction_user();

alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;

drop policy if exists post_comments_select on public.post_comments;
create policy post_comments_select on public.post_comments
  for select using (
    public.is_editor()
    or (
      deleted_at is null
      and exists (
        select 1 from public.posts p
        where p.id = post_comments.post_id and p.status = 'published'
      )
    )
  );

drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert on public.post_comments
  for insert with check (
    public.is_active_member()
    and auth.uid() = user_id
    and deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists post_comments_update on public.post_comments;
create policy post_comments_update on public.post_comments
  for update using (
    auth.uid() = user_id or public.is_editor()
  )
  with check (
    auth.uid() = user_id or public.is_editor()
  );

drop policy if exists post_comments_delete on public.post_comments;
create policy post_comments_delete on public.post_comments
  for delete using (
    auth.uid() = user_id or public.is_editor()
  );

drop policy if exists post_reactions_select on public.post_reactions;
create policy post_reactions_select on public.post_reactions
  for select using (
    public.is_editor()
    or exists (
      select 1 from public.posts p
      where p.id = post_reactions.post_id and p.status = 'published'
    )
  );

drop policy if exists post_reactions_insert on public.post_reactions;
create policy post_reactions_insert on public.post_reactions
  for insert with check (
    public.is_active_member()
    and auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists post_reactions_update on public.post_reactions;
create policy post_reactions_update on public.post_reactions
  for update using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id and public.is_active_member() );

drop policy if exists post_reactions_delete on public.post_reactions;
create policy post_reactions_delete on public.post_reactions
  for delete using ( auth.uid() = user_id );
