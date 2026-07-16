import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useFavorites } from '../lib/useFavorites';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TagChip from '../components/TagChip';
import KeyPointActions from '../components/KeyPointActions';
import PostComments from '../components/PostComments';
import { formatDate, formatDateOnly } from '../lib/format';
import { postUrl } from '../lib/cite';
import { shareOrCopy } from '../lib/share';

// Save-for-later control shown in the article header. Signed-out readers get
// a link into the login flow that returns them to this article.
function SaveButton({ post }) {
  const { user } = useAuth();
  const { favoriteIds, ready, toggle } = useFavorites();

  if (!user) {
    return (
      <Link
        to={`/login?next=${encodeURIComponent(`/news/${post.slug}`)}`}
        className="flex items-center gap-1.5 text-sm font-semibold text-text/50 hover:text-primary-text transition-colors"
      >
        <Bookmark className="w-4 h-4" /> Save
      </Link>
    );
  }

  const saved = favoriteIds.has(post.id);
  return (
    <button
      onClick={() => toggle(post.id)}
      disabled={!ready}
      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${saved ? 'text-primary-text' : 'text-text/50 hover:text-primary-text'}`}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

// Share the article: native share sheet on mobile, copy-link elsewhere.
function ShareButton({ post }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const result = await shareOrCopy({
      title: post.title,
      text: post.excerpt || '',
      url: postUrl(post.slug),
    });
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <button
      onClick={onShare}
      className="flex items-center gap-1.5 text-sm font-semibold text-text/50 hover:text-primary-text transition-colors"
    >
      <Share2 className="w-4 h-4" />
      {copied ? 'Link copied!' : 'Share'}
    </button>
  );
}

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function PostView() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const [post, setPost] = useState(null);
  const [items, setItems] = useState([]);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  // Deep link to one key point: /news/<slug>#point-<item id>
  const targetPointId = hash.startsWith('#point-') ? hash.slice('#point-'.length) : null;

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

      // Related posts, ranked by shared keywords. Best-effort: the RPC ships
      // with the research-db migration, so just hide the section on error.
      const { data: rel, error: relErr } = await supabase
        .rpc('related_posts', { for_post_id: postData.id, max_results: 4 });
      if (active && !relErr) setRelated(rel || []);
    })();
    return () => { active = false; };
  }, [slug]);

  // Once the key points are on the page, scroll a deep-linked one into view.
  // Images above the point finish loading after first paint and shift the
  // layout, so keep re-centering while the page height settles (max 3s) —
  // unless the reader scrolls on their own, which cancels the follow-up.
  // Instant (not smooth): a shared link should land on the point, and some
  // browsers silently drop long smooth scrolls.
  useEffect(() => {
    if (!targetPointId || status !== 'ready') return;
    let cancelled = false;
    const scroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`point-${targetPointId}`);
      if (el) el.scrollIntoView({ block: 'center' });
    };
    const cancel = () => { cancelled = true; };
    window.addEventListener('wheel', cancel, { once: true, passive: true });
    window.addEventListener('touchmove', cancel, { once: true, passive: true });
    scroll();
    const ro = new ResizeObserver(scroll);
    ro.observe(document.body);
    const stop = setTimeout(() => ro.disconnect(), 8000);
    return () => {
      cancelled = true;
      clearTimeout(stop);
      ro.disconnect();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    };
  }, [targetPointId, status]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link to="/news" className="text-primary-text font-data text-sm font-semibold hover:underline">
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
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-primary-text font-bold font-data tracking-widest text-xs uppercase">
                  {formatDate(post.published_at)}
                  {post.author_name ? ` · ${post.author_name}` : ''}
                </div>
                <div className="flex items-center gap-4">
                  <ShareButton post={post} />
                  <SaveButton post={post} />
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight">
                {post.title}
              </h1>
              {(post.source_name || post.source_url) && (
                <p className="text-sm text-text/60 mt-4 font-data">
                  Source:{' '}
                  {post.source_url ? (
                    <a
                      href={post.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-text font-semibold hover:underline"
                    >
                      {post.source_name || sourceHost(post.source_url)} ↗
                    </a>
                  ) : (
                    <span className="font-semibold">{post.source_name}</span>
                  )}
                  {post.source_published_at ? ` · ${formatDateOnly(post.source_published_at)}` : ''}
                </p>
              )}
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
                className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary-text"
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
                      id={`point-${item.id}`}
                      className={`bg-white rounded-2xl border p-5 scroll-mt-32 transition-shadow ${
                        item.id === targetPointId
                          ? 'border-primary/60 ring-2 ring-primary/30'
                          : 'border-primary/10'
                      }`}
                    >
                      <p className="text-text/90">{item.content}</p>
                      {item.item_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.item_tags.map((link, i) => (
                            <TagChip key={i} tag={link.tags} />
                          ))}
                        </div>
                      )}
                      <KeyPointActions point={item} post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <PostComments postId={post.id} postSlug={post.slug} />

            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="font-drama italic text-2xl md:text-3xl font-bold mb-6">
                  Related news
                </h2>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/news/${r.slug}`}
                        className="group block h-full bg-white rounded-2xl border border-primary/10 p-5 hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div className="text-primary-text font-bold font-data tracking-widest text-[10px] uppercase mb-2">
                          {formatDate(r.published_at)} · {r.shared_keywords} shared keyword
                          {Number(r.shared_keywords) === 1 ? '' : 's'}
                        </div>
                        <div className="font-bold group-hover:text-primary-text transition-colors">
                          {r.title}
                        </div>
                      </Link>
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
