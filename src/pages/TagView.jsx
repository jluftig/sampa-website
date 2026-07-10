import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TagChip from '../components/TagChip';
import KeyPointActions from '../components/KeyPointActions';

// Canonical URL for a keyword combination: first slug is the path, the rest
// ride in ?and= (so single-keyword URLs stay stable/shareable).
function keywordsUrl(slugs) {
  const [first, ...rest] = slugs;
  if (!first) return '/keywords';
  return `/keywords/${first}${rest.length ? `?and=${rest.join(',')}` : ''}`;
}

export default function TagView() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // /keywords/buprenorphine?and=pregnancy-perinatal → AND of all listed keywords.
  const andSlugs = (searchParams.get('and') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== slug);
  const activeSlugs = [slug, ...Array.from(new Set(andSlugs))];
  const activeKey = activeSlugs.join(',');

  const [tags, setTags] = useState([]);     // active tag records, in URL order
  const [points, setPoints] = useState([]); // { id, content, post, tags[] }
  const [refine, setRefine] = useState([]); // co-occurring { tag, count }
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');

      const { data: tagData, error: tagErr } = await supabase
        .from('tags')
        .select('id, name, short_label, slug')
        .in('slug', activeSlugs);
      if (!active) return;
      if (tagErr) { setStatus('error'); return; }
      const bySlug = new Map((tagData || []).map((t) => [t.slug, t]));
      if (!bySlug.has(slug)) { setStatus('notfound'); return; }
      const activeTags = activeSlugs.filter((s) => bySlug.has(s)).map((s) => bySlug.get(s));
      setTags(activeTags);

      // 1) The key points. Single keyword uses a plain embedded query; a
      //    combination uses the key_points_for_tags RPC (AND semantics).
      //    Both paths return published posts only — filtered explicitly, never
      //    via RLS alone (editors can read drafts).
      let rows;
      if (activeTags.length === 1) {
        const { data, error } = await supabase
          .from('items')
          .select('id, content, item_tags!inner(tag_id), posts!inner(*)')
          .eq('item_tags.tag_id', activeTags[0].id)
          .eq('posts.status', 'published')
          .order('published_at', { ascending: false, referencedTable: 'posts' });
        if (error) { if (active) setStatus('error'); return; }
        rows = (data || []).map((r) => ({ id: r.id, content: r.content, post: r.posts }));
      } else {
        const { data, error } = await supabase
          .rpc('key_points_for_tags', { tag_slugs: activeTags.map((t) => t.slug) });
        if (error) { if (active) setStatus('error'); return; }
        rows = (data || []).map((r) => ({
          id: r.item_id,
          content: r.content,
          post: {
            title: r.post_title,
            slug: r.post_slug,
            published_at: r.published_at,
            source_name: r.source_name,
            source_url: r.source_url,
            source_published_at: r.source_published_at,
          },
        }));
      }
      if (!active) return;

      // 2) Every keyword on those points → per-point chips + "Refine" counts
      //    (co-occurring keywords = one-click drill-down to an intersection).
      const tagsByItem = new Map();
      const counts = new Map();
      if (rows.length) {
        const { data: links } = await supabase
          .from('item_tags')
          .select('item_id, tags(id, name, short_label, slug)')
          .in('item_id', rows.map((r) => r.id));
        (links || []).forEach((l) => {
          if (!l.tags) return;
          if (!tagsByItem.has(l.item_id)) tagsByItem.set(l.item_id, []);
          tagsByItem.get(l.item_id).push(l.tags);
          if (!activeSlugs.includes(l.tags.slug)) {
            const c = counts.get(l.tags.slug) || { tag: l.tags, count: 0 };
            c.count += 1;
            counts.set(l.tags.slug, c);
          }
        });
      }
      if (!active) return;

      setPoints(rows.map((r) => ({ ...r, tags: tagsByItem.get(r.id) || [] })));
      setRefine(
        Array.from(counts.values())
          .sort((a, b) => b.count - a.count || a.tag.name.localeCompare(b.tag.name))
      );
      setStatus('ready');
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  function removeKeyword(s) {
    navigate(keywordsUrl(activeSlugs.filter((x) => x !== s)));
  }
  function addKeyword(s) {
    navigate(keywordsUrl([...activeSlugs, s]));
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link to="/keywords" className="text-primary-text font-data text-sm font-semibold hover:underline">
          ← All keywords
        </Link>

        {status === 'loading' && <p className="text-center text-text/50 font-data mt-16">Loading…</p>}
        {status === 'error' && <p className="text-center text-red-500 mt-16">Something went wrong.</p>}

        {status === 'notfound' && (
          <div className="text-center mt-16">
            <h1 className="text-3xl font-bold mb-3">Keyword not found</h1>
            <p className="text-text/60">That keyword doesn’t exist.</p>
          </div>
        )}

        {status === 'ready' && tags.length > 0 && (
          <>
            <header className="mt-6 mb-10">
              <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-3 uppercase">
                {tags.length > 1 ? 'Keyword intersection' : 'Keyword'}
              </div>
              <h1 className="text-3xl md:text-5xl font-drama font-bold">
                {tags.map((t) => t.name).join(' + ')}
              </h1>
              {tags.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => removeKeyword(t.slug)}
                      title={`Remove ${t.name}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-primary-text text-white hover:opacity-80 transition-opacity"
                    >
                      {t.name}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-text/60 mt-3">
                {points.length} key point{points.length === 1 ? '' : 's'}
                {tags.length > 1 ? ' matching all of these keywords' : ' across all published news'}.
              </p>
            </header>

            {refine.length > 0 && (
              <div className="mb-10">
                <div className="text-xs font-data font-semibold text-text/40 uppercase tracking-widest mb-3">
                  Refine — these key points are also tagged:
                </div>
                <div className="flex flex-wrap gap-2">
                  {refine.map(({ tag, count }) => (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => addKeyword(tag.slug)}
                      title={`Only key points also tagged ${tag.name}`}
                      className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-primary/20 bg-white font-semibold hover:bg-primary-text hover:text-white hover:border-primary-text transition-colors"
                    >
                      {tag.name}
                      <span className="text-xs font-data px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-text group-hover:bg-white/20 group-hover:text-white">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {points.length === 0 ? (
              <div className="text-center bg-white rounded-4xl border border-primary/10 p-12">
                <p className="text-text/60">
                  {tags.length > 1
                    ? 'No published key points carry all of these keywords.'
                    : 'No published key points use this tag yet.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {points.map((point) => (
                  <li key={point.id} className="bg-white rounded-2xl border border-primary/10 p-5">
                    <p className="text-text/90">{point.content}</p>
                    {point.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {point.tags.map((t) => (
                          <TagChip key={t.slug} tag={t} />
                        ))}
                      </div>
                    )}
                    <Link
                      to={`/news/${point.post.slug}#point-${point.id}`}
                      className="inline-block mt-3 text-sm text-primary-text font-semibold hover:underline"
                    >
                      from “{point.post.title}” · {formatDate(point.post.published_at)}
                    </Link>
                    <KeyPointActions point={point} post={point.post} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
