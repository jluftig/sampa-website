import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import SearchBox from '../components/SearchBox';
import KeyPointActions from '../components/KeyPointActions';

// /search?q=… — full-text search across Key Points and articles (Postgres FTS
// via the search_key_points / search_posts RPCs), plus keyword-name matches.
// Published content only — the RPCs filter status='published' explicitly.
export default function Search() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();

  const [status, setStatus] = useState(q ? 'loading' : 'idle'); // idle | loading | ready | unavailable | error
  const [points, setPoints] = useState([]);
  const [posts, setPosts] = useState([]);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    if (!q) { setStatus('idle'); setPoints([]); setPosts([]); setKeywords([]); return; }
    let active = true;
    (async () => {
      setStatus('loading');
      // Keyword-name matches use ilike (commas/parens would break the .or syntax).
      const safe = q.replace(/[,()]/g, ' ').trim();
      const [pointsRes, postsRes, tagsRes] = await Promise.all([
        supabase.rpc('search_key_points', { q }),
        supabase.rpc('search_posts', { q }),
        safe
          ? supabase
              .from('tags')
              .select('id, name, short_label, slug')
              .or(`name.ilike.%${safe}%,short_label.ilike.%${safe}%`)
              .limit(10)
          : Promise.resolve({ data: [] }),
      ]);
      if (!active) return;

      // Both RPCs missing → the research-db migration hasn't been applied yet.
      if (pointsRes.error && postsRes.error) { setStatus('unavailable'); return; }

      setPoints(
        (pointsRes.data || []).map((r) => ({
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
        }))
      );
      setPosts(postsRes.data || []);
      setKeywords(tagsRes.data || []);
      setStatus('ready');
    })();
    return () => { active = false; };
  }, [q]);

  const nothingFound =
    status === 'ready' && points.length === 0 && posts.length === 0 && keywords.length === 0;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-12">
          <div className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
            Search
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-8">Search the news database</h1>
          <div className="max-w-xl mx-auto">
            <SearchBox key={q} initial={q} autoFocus />
          </div>
          <div className="mt-6">
            <Link to="/keywords" className="text-primary-text font-semibold hover:underline">
              Browse by keyword instead →
            </Link>
          </div>
        </header>

        {status === 'idle' && (
          <p className="text-center text-text/50">
            Search every article and key point — try a drug name, policy, or study topic.
          </p>
        )}

        {status === 'loading' && <p className="text-center text-text/50 font-data">Searching…</p>}

        {status === 'unavailable' && (
          <div className="text-center bg-white rounded-4xl border border-primary/10 p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Search isn’t available yet</h2>
            <p className="text-text/60">
              Please try again soon, or <Link to="/keywords" className="text-primary-text font-semibold hover:underline">browse by keyword</Link>.
            </p>
          </div>
        )}

        {nothingFound && (
          <div className="text-center bg-white rounded-4xl border border-primary/10 p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">No matches for “{q}”</h2>
            <p className="text-text/60">
              Try a different phrasing, or <Link to="/keywords" className="text-primary-text font-semibold hover:underline">browse by keyword</Link>.
            </p>
          </div>
        )}

        {status === 'ready' && keywords.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-data font-semibold text-text/40 uppercase tracking-widest mb-3 text-center">
              Matching keywords
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {keywords.map((t) => (
                <Link
                  key={t.slug}
                  to={`/keywords/${t.slug}`}
                  title={t.name}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-white font-semibold hover:bg-primary-text hover:text-white hover:border-primary-text transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {status === 'ready' && points.length > 0 && (
          <section className="mb-14 max-w-3xl mx-auto">
            <h2 className="font-drama italic text-2xl md:text-3xl font-bold mb-6">
              Key Points <span className="text-text/40 text-lg font-sans not-italic">({points.length})</span>
            </h2>
            <ul className="space-y-4">
              {points.map((point) => (
                <li key={point.id} className="bg-white rounded-2xl border border-primary/10 p-5">
                  <p className="text-text/90">{point.content}</p>
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
          </section>
        )}

        {status === 'ready' && posts.length > 0 && (
          <section>
            <h2 className="font-drama italic text-2xl md:text-3xl font-bold mb-6">
              Articles <span className="text-text/40 text-lg font-sans not-italic">({posts.length})</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
