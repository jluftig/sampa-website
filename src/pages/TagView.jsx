import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TagView() {
  const { slug } = useParams();
  const [tag, setTag] = useState(null);
  const [points, setPoints] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');

      const { data: tagData, error: tagErr } = await supabase
        .from('tags')
        .select('id, name, short_label, slug')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      if (tagErr) { setStatus('error'); return; }
      if (!tagData) { setStatus('notfound'); return; }
      setTag(tagData);

      // Individual key points carrying this tag, from published posts only
      // (enforced by RLS). Each links back to its source post.
      const { data: itemData, error: itemErr } = await supabase
        .from('items')
        .select('id, content, item_tags!inner(tag_id), posts!inner(title, slug, published_at)')
        .eq('item_tags.tag_id', tagData.id)
        .order('published_at', { ascending: false, referencedTable: 'posts' });
      if (!active) return;
      if (itemErr) { setStatus('error'); return; }
      setPoints(itemData || []);
      setStatus('ready');
    })();
    return () => { active = false; };
  }, [slug]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link to="/tags" className="text-primary font-data text-sm font-semibold hover:underline">
          ← All tags
        </Link>

        {status === 'loading' && <p className="text-center text-text/50 font-data mt-16">Loading…</p>}
        {status === 'error' && <p className="text-center text-red-500 mt-16">Something went wrong.</p>}

        {status === 'notfound' && (
          <div className="text-center mt-16">
            <h1 className="text-3xl font-bold mb-3">Tag not found</h1>
            <p className="text-text/60">That topic doesn’t exist.</p>
          </div>
        )}

        {status === 'ready' && tag && (
          <>
            <header className="mt-6 mb-10">
              <div className="text-primary font-bold font-data tracking-widest text-xs mb-3 uppercase">
                Topic
              </div>
              <h1 className="text-3xl md:text-5xl font-drama font-bold">{tag.name}</h1>
              <p className="text-text/60 mt-3">
                {points.length} key point{points.length === 1 ? '' : 's'} across all published news.
              </p>
            </header>

            {points.length === 0 ? (
              <div className="text-center bg-white rounded-4xl border border-primary/10 p-12">
                <p className="text-text/60">No published key points use this tag yet.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {points.map((point) => (
                  <li key={point.id} className="bg-white rounded-2xl border border-primary/10 p-5">
                    <p className="text-text/90">{point.content}</p>
                    <Link
                      to={`/news/${point.posts.slug}`}
                      className="inline-block mt-3 text-sm text-primary font-semibold hover:underline"
                    >
                      from “{point.posts.title}” · {formatDate(point.posts.published_at)}
                    </Link>
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
