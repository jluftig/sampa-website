import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { roundups } from '../lib/dailyNews';
import { collectPostTags } from '../lib/tags';
import PostCard from './PostCard';

const latestRoundup = roundups[0] || null;

export default function NewsTeaser() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(Boolean(latestRoundup));

  useEffect(() => {
    if (latestRoundup) return undefined;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, cover_image_url, published_at, items(item_tags(tags(name, short_label, slug)))')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);
      if (!active) return;
      setPosts((data || []).map((p) => ({ ...p, tags: collectPostTags(p) })));
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  return (
    <section id="news" className="scroll-mt-32 py-24 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-5xl font-drama font-bold text-text mb-3">
          Daily News
        </h2>
        <p className="text-xs font-data uppercase tracking-wider text-accent font-semibold mb-6">
          New
        </p>
        <p className="text-xl text-text/70 max-w-2xl mb-12">
          Original daily coverage of addiction medicine — the developments that matter for your patients and your practice.
        </p>

        {latestRoundup && (
          <ol className="text-left w-full max-w-3xl space-y-4 mb-12 list-decimal pl-6">
            {latestRoundup.items.map((item) => (
              <li key={item.url} className="text-base md:text-lg leading-relaxed">
                <span className="font-semibold">{item.headline}</span>
                {` (${item.outlet}, ${item.date}). `}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-text font-semibold underline underline-offset-2"
                >
                  Source
                </a>
              </li>
            ))}
          </ol>
        )}

        {!latestRoundup && loaded && posts.length === 0 && (
          <p className="text-text/50 mb-12">Our first issue is coming soon.</p>
        )}

        {!latestRoundup && posts.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 w-full mb-12">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {latestRoundup && (
            <Link
              to="/news/daily"
              className="whitespace-nowrap px-8 py-3 rounded-full bg-accent text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
            >
              Read today&apos;s roundup
            </Link>
          )}
          <Link
            to="/news"
            className="whitespace-nowrap px-8 py-3 rounded-full border border-primary/20 hover:bg-primary-text hover:text-white font-semibold transition-colors"
          >
            View all news
          </Link>
        </div>
      </div>
    </section>
  );
}
