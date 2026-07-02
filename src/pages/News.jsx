import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { collectPostTags } from '../lib/tags';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, cover_image_url, author_name, published_at, items(item_tags(tags(name, short_label, slug)))')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (!active) return;
      if (error) setError(error.message);
      else setPosts((data || []).map((p) => ({ ...p, tags: collectPostTags(p) })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-16">
          <div className="text-primary font-bold font-data tracking-widest text-sm mb-4 uppercase">
            SAMPA News
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            Addiction Medicine News
          </h1>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Curated research, policy, and practice updates for addiction medicine PAs —
            published twice a month.
          </p>
          <Link to="/keywords" className="inline-block mt-6 text-primary font-semibold hover:underline">
            Browse by keyword →
          </Link>
        </header>

        {loading && (
          <p className="text-center text-text/50 font-data">Loading…</p>
        )}

        {error && (
          <p className="text-center text-red-500">Couldn’t load news: {error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center bg-white rounded-4xl border border-primary/10 p-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">No news yet</h2>
            <p className="text-text/60">Our first issue is on the way — check back soon.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
