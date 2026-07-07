import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBox from '../components/SearchBox';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      // Key-point count per keyword across PUBLISHED posts only. The RPC does
      // the aggregation in the database (shared with future mobile apps) and
      // filters published explicitly, so logged-in editors/admins see the same
      // public counts as anonymous visitors.
      const { data: rpcData, error: rpcErr } = await supabase.rpc('keyword_counts');
      if (!active) return;
      if (!rpcErr) {
        setTags((rpcData || []).map((t) => ({ ...t, count: Number(t.points) })));
        setLoading(false);
        return;
      }

      // Fallback (pre-migration): aggregate client-side, same explicit filter.
      const { data, error } = await supabase
        .from('items')
        .select('item_tags(tags(id, name, short_label, slug)), posts!inner(status)')
        .eq('posts.status', 'published');
      if (!active) return;
      if (error) { setError(error.message); setLoading(false); return; }

      const bySlug = new Map();
      (data || []).forEach((item) => {
        (item.item_tags || []).forEach((link) => {
          const t = link.tags;
          if (!t) return;
          const existing = bySlug.get(t.slug) || { ...t, count: 0 };
          existing.count += 1;
          bySlug.set(t.slug, existing);
        });
      });
      const withCounts = Array.from(bySlug.values())
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      setTags(withCounts);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-14">
          <div className="text-primary font-bold font-data tracking-widest text-sm mb-4 uppercase">
            Browse by Keyword
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">Explore by keyword</h1>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Pick a keyword to see each relevant post across all issues — then refine with a
            second keyword to drill into an intersection.
          </p>
          <div className="max-w-md mx-auto mt-8">
            <SearchBox placeholder="Or search all news and key points…" />
          </div>
          <Link to="/news" className="inline-block mt-6 text-primary font-semibold hover:underline">
            ← Back to all news
          </Link>
        </header>

        {loading && <p className="text-center text-text/50 font-data">Loading…</p>}
        {error && <p className="text-center text-red-500">Couldn’t load tags: {error}</p>}

        {!loading && !error && tags.length === 0 && (
          <div className="text-center bg-white rounded-4xl border border-primary/10 p-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">No keywords yet</h2>
            <p className="text-text/60">Once posts with key points are published, keywords will appear here.</p>
          </div>
        )}

        {!loading && tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                to={`/keywords/${tag.slug}`}
                title={tag.name}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-white hover:bg-primary hover:text-white hover:border-primary transition-colors"
              >
                <span className="font-semibold">{tag.name}</span>
                <span className="text-xs font-data px-1.5 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
