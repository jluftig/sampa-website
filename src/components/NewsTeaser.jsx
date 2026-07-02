import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { collectPostTags } from '../lib/tags';
import PostCard from './PostCard';

// Homepage "Latest News" section — shows the three most recent published posts
// and links through to the full /news page.
export default function NewsTeaser() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
    <section id="news" className="py-24 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Newspaper className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-3xl md:text-5xl font-drama font-bold text-text mb-6">
          Latest News
        </h2>
        <p className="text-xl text-text/70 max-w-2xl mb-12">
          Twice-monthly updates on addiction medicine research, policy, and practice.
        </p>

        {loaded && posts.length === 0 && (
          <p className="text-text/50 mb-12">Our first issue is coming soon.</p>
        )}

        {posts.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 w-full mb-12">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <Link
          to="/news"
          className="whitespace-nowrap px-8 py-3 rounded-full border border-primary/20 hover:bg-primary hover:text-white font-semibold transition-colors"
        >
          View all news
        </Link>
      </div>
    </section>
  );
}
