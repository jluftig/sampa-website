-- ===========================================================================
-- list_news_editors() returns credentials for news bylines (2026-09-18)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). DROP is required because the return
-- type gains a column (CREATE OR REPLACE cannot change OUT columns).
--
-- News bylines are denormalized posts.author_name / post_authors.display_name.
-- The editor picker used full_name only, so saves wrote "Josh Luftig" without
-- PA-C. This RPC change lets the picker append profiles.credentials.
-- ===========================================================================

drop function if exists public.list_news_editors();

create or replace function public.list_news_editors()
returns table (
  id uuid,
  full_name text,
  email text,
  credentials text
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
    p.email,
    nullif(btrim(p.credentials), '') as credentials
  from public.profiles p
  where p.role in ('editor', 'admin') or p.can_edit_news
  order by coalesce(nullif(btrim(p.full_name), ''), p.email);
end;
$$;
