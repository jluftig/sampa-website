-- ============================================================================
-- Research-database upgrade (2026-07-07)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). This is the standalone copy of the
-- section appended to supabase/schema.sql (which stays the source of truth).
-- Run BEFORE merging the code that depends on it (source fields, search, etc.).
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
