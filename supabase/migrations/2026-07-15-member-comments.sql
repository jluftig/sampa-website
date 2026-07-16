-- ============================================================================
-- Member comments + emoji reactions on news (2026-07-15)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent (safe to re-run). Folded into supabase/schema.sql.
--
--   1. post_comments — brief text comments (flat; soft-delete)
--   2. post_reactions — one emoji reaction per member per post
--   3. RLS: public read on published posts; write = is_active_member()
--   4. Triggers stamp author_name / force user_id; soft-delete helpers
--
-- Does NOT widen profiles SELECT — author_name is denormalized on insert.
-- ============================================================================

-- Allowed reaction keys (keep in sync with src/lib/comments.js).
-- thumbs_up | celebrate | insight | heart | clap

-- ----- 1. post_comments --------------------------------------------------------
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

-- Brief comments only (1–500 chars after trim). Enforced on insert/update.
alter table public.post_comments drop constraint if exists post_comments_body_len;
alter table public.post_comments
  add constraint post_comments_body_len
  check (char_length(btrim(body)) between 1 and 500);

create index if not exists post_comments_post_id_idx
  on public.post_comments (post_id, created_at desc)
  where deleted_at is null;

create index if not exists post_comments_user_id_idx
  on public.post_comments (user_id);

-- ----- 2. post_reactions -------------------------------------------------------
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

-- ----- 3. Triggers -------------------------------------------------------------
-- Stamp author_name from the profile and force user_id = auth.uid().
-- SECURITY DEFINER so we can read the profile without opening SELECT RLS.
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

-- Force reaction user_id = auth.uid().
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

-- ----- 4. RLS ------------------------------------------------------------------
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;

-- Comments: public may read non-deleted rows on published posts; editors see all
-- (incl. soft-deleted) for moderation.
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

-- Own body edit or soft-delete; editors may soft-delete any.
drop policy if exists post_comments_update on public.post_comments;
create policy post_comments_update on public.post_comments
  for update using (
    auth.uid() = user_id or public.is_editor()
  )
  with check (
    auth.uid() = user_id or public.is_editor()
  );

-- Hard delete: own or editor (prefer soft-delete from the app).
drop policy if exists post_comments_delete on public.post_comments;
create policy post_comments_delete on public.post_comments
  for delete using (
    auth.uid() = user_id or public.is_editor()
  );

-- Reactions: public read on published posts (clients aggregate counts; user_id
-- alone is not personally identifying without a profiles join we don't open).
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
