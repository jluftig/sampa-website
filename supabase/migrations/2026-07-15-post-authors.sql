-- ============================================================================
-- Post co-authors (2026-07-15)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). This is the standalone copy of the
-- section folded into supabase/schema.sql (which stays the source of truth).
-- Run BEFORE merging the code that depends on it (PostEditor co-author picker).
--
--   1. post_authors join table (ordered co-authors; linked profiles only)
--   2. profile_is_news_editor(id) — validates inserts without widening profiles RLS
--   3. list_news_editors() — editor-only picker roster (SECURITY DEFINER)
--   4. Backfill from posts.author_id
--
-- posts.author_id / author_name stay as denormalized primary + byline so public
-- pages and the mobile app keep working with no client join.
-- ============================================================================

-- ----- 1. Table + index --------------------------------------------------------
create table if not exists public.post_authors (
  post_id      uuid not null references public.posts(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  sort_order   int  not null default 0,
  display_name text,
  primary key (post_id, profile_id)
);

alter table public.post_authors add column if not exists display_name text;

create index if not exists post_authors_profile_id_idx on public.post_authors (profile_id);

-- ----- 2. Helpers --------------------------------------------------------------
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

-- ----- 3. RLS ------------------------------------------------------------------
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

-- ----- 4. Backfill -------------------------------------------------------------
insert into public.post_authors (post_id, profile_id, sort_order, display_name)
select p.id, p.author_id, 0, p.author_name
  from public.posts p
 where p.author_id is not null
on conflict do nothing;
