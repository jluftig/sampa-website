import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TagChip from '../components/TagChip';
import { formatDate } from '../lib/format';

export default function PostView() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');

      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (!active) return;
      if (postErr) { setStatus('error'); return; }
      if (!postData) { setStatus('notfound'); return; }
      setPost(postData);

      // Key Points + their tags (nested join through item_tags).
      const { data: itemData } = await supabase
        .from('items')
        .select('id, content, sort_order, item_tags(tags(name, short_label, slug))')
        .eq('post_id', postData.id)
        .order('sort_order', { ascending: true });
      if (!active) return;
      setItems(itemData || []);
      setStatus('ready');
    })();
    return () => { active = false; };
  }, [slug]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link to="/news" className="text-primary font-data text-sm font-semibold hover:underline">
          ← All news
        </Link>

        {status === 'loading' && (
          <p className="text-center text-text/50 font-data mt-16">Loading…</p>
        )}

        {status === 'error' && (
          <p className="text-center text-red-500 mt-16">Something went wrong loading this post.</p>
        )}

        {status === 'notfound' && (
          <div className="text-center mt-16">
            <h1 className="text-3xl font-bold mb-3">Post not found</h1>
            <p className="text-text/60">It may have been unpublished or the link is incorrect.</p>
          </div>
        )}

        {status === 'ready' && post && (
          <article className="mt-8">
            <header className="mb-10">
              <div className="text-primary font-bold font-data tracking-widest text-xs mb-4 uppercase">
                {formatDate(post.published_at)}
                {post.author_name ? ` · ${post.author_name}` : ''}
              </div>
              <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight">
                {post.title}
              </h1>
            </header>

            {post.cover_image_url && (
              <figure className="mb-10">
                <img
                  src={post.cover_image_url}
                  alt=""
                  className="w-full rounded-4xl object-cover"
                />
                {post.cover_image_caption && (
                  <figcaption className="text-sm text-text/50 italic mt-3 px-2">
                    {post.cover_image_caption}
                  </figcaption>
                )}
              </figure>
            )}

            {post.body_html && (
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body_html) }}
              />
            )}

            {items.length > 0 && (
              <section className="mt-16">
                <h2 className="font-drama italic text-2xl md:text-3xl font-bold mb-6">
                  Key Points
                </h2>
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="bg-white rounded-2xl border border-primary/10 p-5"
                    >
                      <p className="text-text/90">{item.content}</p>
                      {item.item_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.item_tags.map((link, i) => (
                            <TagChip key={i} tag={link.tags} />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
