// Content data layer for News / Key Points / keywords / search.
//
// Every query mirrors the website's (src/pages/News.jsx, PostView.jsx, Tags.jsx,
// TagView.jsx) — critically, each PUBLIC read filters `status = 'published'`
// EXPLICITLY (never RLS alone: editors can read drafts). The aggregations and
// search run as SECURITY-safe Postgres RPCs shared with the website.

import { collectPostTags, type SharedTag } from 'sampa-shared/tags';

import { supabase } from './supabaseClient';

export type Tag = SharedTag;

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
  tags: Tag[];
};

export type KeyPoint = {
  id: string;
  content: string;
  sort_order?: number;
  item_tags?: { tags: Tag }[];
};

export type PostFull = Record<string, any>;

export type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  shared_keywords: number;
};

export type KeywordCount = {
  id: string;
  name: string;
  short_label: string | null;
  slug: string;
  count: number;
};

export type KeyPointRow = {
  id: string;
  content: string;
  post: { title: string; slug: string; published_at: string | null };
  tags: Tag[];
};

/** Published posts, newest first, each with its deduped keyword set. */
export async function fetchPublishedPosts(): Promise<PostSummary[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, excerpt, cover_image_url, author_name, published_at, items(item_tags(tags(name, short_label, slug)))'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({ ...p, tags: collectPostTags(p) }));
}

/** Published posts for a set of ids (used by the Saved tab), newest first. */
export async function fetchPostsByIds(ids: string[]): Promise<PostSummary[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, excerpt, cover_image_url, author_name, published_at, items(item_tags(tags(name, short_label, slug)))'
    )
    .in('id', ids)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({ ...p, tags: collectPostTags(p) }));
}

/** A single published post + its Key Points (with tags) + related posts. post is null if not found. */
export async function fetchPost(slug: string): Promise<{
  post: PostFull | null;
  items: KeyPoint[];
  related: RelatedPost[];
}> {
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!post) return { post: null, items: [], related: [] };

  const { data: items } = await supabase
    .from('items')
    .select('id, content, sort_order, item_tags(tags(name, short_label, slug))')
    .eq('post_id', post.id)
    .order('sort_order', { ascending: true });

  // Related posts: best-effort (RPC ships with the research-db migration).
  let related: RelatedPost[] = [];
  const { data: rel, error: relErr } = await supabase.rpc('related_posts', {
    for_post_id: post.id,
    max_results: 4,
  });
  if (!relErr) related = (rel || []) as RelatedPost[];

  // Supabase types the embedded `tags` as an array, but a to-one join returns a
  // single object at runtime — cast through unknown.
  return { post, items: (items || []) as unknown as KeyPoint[], related };
}

/** Published Key-Point count per keyword, most-used first (keyword_counts RPC). */
export async function fetchKeywordCounts(): Promise<KeywordCount[]> {
  const { data, error } = await supabase.rpc('keyword_counts');
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    short_label: t.short_label,
    slug: t.slug,
    count: Number(t.points),
  }));
}

/** Key Points carrying a single keyword (published only), with per-point tags. */
export async function fetchKeyPointsForTag(slug: string): Promise<{
  tag: Tag | null;
  points: KeyPointRow[];
}> {
  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, short_label, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (!tag) return { tag: null, points: [] };

  const { data, error } = await supabase
    .from('items')
    .select('id, content, item_tags!inner(tag_id), posts!inner(title, slug, published_at, status)')
    .eq('item_tags.tag_id', tag.id)
    .eq('posts.status', 'published')
    .order('published_at', { ascending: false, referencedTable: 'posts' });
  if (error) throw error;

  const rows = (data || []).map((r: any) => ({ id: r.id, content: r.content, post: r.posts }));
  if (!rows.length) return { tag, points: [] };

  // Each point's full keyword set (for chips).
  const { data: links } = await supabase
    .from('item_tags')
    .select('item_id, tags(name, short_label, slug)')
    .in(
      'item_id',
      rows.map((r) => r.id)
    );
  const byItem = new Map<string, Tag[]>();
  (links || []).forEach((l: any) => {
    if (!l.tags) return;
    if (!byItem.has(l.item_id)) byItem.set(l.item_id, []);
    byItem.get(l.item_id)!.push(l.tags);
  });

  return {
    tag,
    points: rows.map((r) => ({ ...r, tags: byItem.get(r.id) || [] })),
  };
}

export type SearchPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  source_name: string | null;
};

export type SearchPointRow = {
  item_id: string;
  content: string;
  post_title: string;
  post_slug: string;
  published_at: string | null;
};

/** Full-text search across posts and key points (published only). */
export async function searchAll(q: string): Promise<{
  posts: SearchPostRow[];
  points: SearchPointRow[];
}> {
  const query = q.trim();
  if (!query) return { posts: [], points: [] };
  const [postsRes, pointsRes] = await Promise.all([
    supabase.rpc('search_posts', { q: query }),
    supabase.rpc('search_key_points', { q: query }),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (pointsRes.error) throw pointsRes.error;
  return {
    posts: (postsRes.data || []) as SearchPostRow[],
    points: (pointsRes.data || []) as SearchPointRow[],
  };
}
