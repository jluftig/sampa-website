import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { collectPostTags } from '../lib/tags';
import { buildNewsFeed, feedWithMonthHeadings } from '../lib/newsFeed';
import { useDailyRoundups } from '../lib/useDailyRoundups';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import RoundupCard from '../components/RoundupCard';
import NewsletterSignup from '../components/NewsletterSignup';
import SearchBox from '../components/SearchBox';

// /news is the single news feed: the earlier daily news posts and articles
// (Supabase `posts`) and the weekday roundups (content/daily-news) together,
// newest first, grouped by month.
export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const roundups = useDailyRoundups();

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

  const rows = useMemo(
    () => feedWithMonthHeadings(buildNewsFeed(posts, roundups)),
    [posts, roundups],
  );

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-12">
          <div className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
            SAMPA News
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            Addiction Medicine News
          </h1>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Daily research, policy, and practice updates for addiction medicine PAs, newest first.
          </p>
          <div className="max-w-md mx-auto mt-8">
            <SearchBox />
          </div>
          <Link to="/keywords" className="inline-block mt-6 text-primary-text font-semibold hover:underline">
            Browse by keyword →
          </Link>
        </header>

        <div className="max-w-3xl mx-auto mb-14">
          <NewsletterSignup variant="card" list="daily" />
        </div>

        {error && (
          <p className="text-center text-red-500 mb-8">Couldn’t load earlier news posts: {error}</p>
        )}

        {rows.length === 0 && !loading && (
          <div className="text-center bg-white rounded-4xl border border-primary/10 p-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">No news yet</h2>
            <p className="text-text/60">Our first issue is on the way — check back soon.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="news-feed">
            {rows.map((row) => {
              if (row.type === 'month') {
                return (
                  <h2
                    key={row.key}
                    className="col-span-full pt-6 first:pt-0 text-sm font-data font-semibold uppercase tracking-widest text-text/50 border-b border-primary/15 pb-2"
                  >
                    {row.label}
                  </h2>
                );
              }
              const { entry } = row;
              return entry.kind === 'roundup'
                ? <RoundupCard key={row.key} roundup={entry.roundup} />
                : <PostCard key={row.key} post={entry.post} />;
            })}
          </div>
        )}

        {loading && (
          <p className="text-center text-text/50 font-data mt-10">Loading earlier news…</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
