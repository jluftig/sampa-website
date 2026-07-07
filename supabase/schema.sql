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
  author_id       uuid references public.profiles(id) on delete set null,
  author_name     text,                       -- denormalized: public reads never touch profiles
  status          public.post_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Add cover_image_caption if the table already existed from an earlier run.
alter table public.posts add column if not exists cover_image_caption text;

-- Professional profile fields (member-editable via the dashboard onboarding
-- form; these replace the old Google Form). Membership/billing columns above
-- stay locked down by guard_profile_role().
alter table public.profiles add column if not exists credentials       text;
alter table public.profiles add column if not exists npi               text;
alter table public.profiles add column if not exists organization      text;
alter table public.profiles add column if not exists practice_setting  text;
alter table public.profiles add column if not exists state             text;
alter table public.profiles add column if not exists newsletter_opt_in boolean not null default true;
alter table public.profiles add column if not exists sms_opt_in        boolean not null default false;
alter table public.profiles add column if not exists onboarded_at      timestamptz;
-- True when a member canceled but their paid term hasn't ended yet: the
-- membership stays active and renews_on becomes the END date, not a renewal.
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;

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

-- ----- Helper functions (SECURITY DEFINER so they bypass RLS = no recursion) --
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('editor','admin') from public.profiles where id = auth.uid()),
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
-- member_import: RLS on with deliberately NO policies — contains contact info;
-- only the SQL editor, service role, and SECURITY DEFINER functions can read it.
alter table public.member_import enable row level security;

-- profiles: read own (or admin reads all); update own (role column guarded above)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ( auth.uid() = id or public.is_admin() );

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
