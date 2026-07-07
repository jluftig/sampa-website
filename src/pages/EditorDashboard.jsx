import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function EditorDashboard() {
  const { profile, signOut, isAdmin, canViewMembers } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, status, published_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) setError(error.message);
    else setPosts(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(post) {
    setBusyId(post.id);
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    const patch = { status: nextStatus };
    // Stamp the publish date the first time it goes live.
    if (nextStatus === 'published' && !post.published_at) {
      patch.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from('posts').update(patch).eq('id', post.id);
    if (error) setError(error.message);
    await load();
    setBusyId(null);
  }

  async function remove(post) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusyId(post.id);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) setError(error.message);
    await load();
    setBusyId(null);
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-40 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-primary font-bold font-data tracking-widest text-xs mb-2 uppercase">
              Editor Dashboard
            </div>
            <h1 className="text-3xl font-drama font-bold">Your posts</h1>
            <p className="text-text/50 text-sm mt-1">
              Signed in as {profile?.email} · <span className="font-data text-primary">{profile?.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/editor/new"
              className="bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
            >
              + New Post
            </Link>
            {isAdmin && (
              <Link
                to="/editor/keywords"
                className="px-4 py-2.5 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                Manage keywords
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/editor/people"
                className="px-4 py-2.5 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                People & permissions
              </Link>
            )}
            {canViewMembers && (
              <Link
                to="/editor/members"
                className="px-4 py-2.5 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                Members
              </Link>
            )}
            <button
              onClick={signOut}
              className="px-4 py-2.5 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-text/50 font-data">Loading…</p>}

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-4xl border border-primary/10 p-12 text-center">
            <h2 className="text-xl font-bold mb-2">No posts yet</h2>
            <p className="text-text/60 mb-6">Create your first news post to get started.</p>
            <Link to="/editor/new" className="text-primary font-semibold hover:underline">
              + New Post
            </Link>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="bg-white rounded-4xl border border-primary/10 divide-y divide-primary/10 overflow-hidden">
            {posts.map((post) => (
              <div key={post.id} className="flex flex-wrap items-center gap-4 p-5">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-data font-semibold px-2 py-0.5 rounded-full ${
                        post.status === 'published'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-text/10 text-text/60'
                      }`}
                    >
                      {post.status}
                    </span>
                    <h3 className="font-bold truncate">{post.title}</h3>
                  </div>
                  <p className="text-text/40 text-xs mt-1 font-data">
                    {post.status === 'published' && post.published_at
                      ? `Published ${formatDate(post.published_at)}`
                      : `Edited ${formatDate(post.updated_at)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <Link
                      to={`/news/${post.slug}`}
                      className="text-sm font-semibold text-text/60 hover:text-primary px-3 py-1.5"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    to={`/editor/${post.id}`}
                    className="text-sm font-semibold text-primary hover:underline px-3 py-1.5"
                  >
                    Edit
                  </Link>
                  <button
                    disabled={busyId === post.id}
                    onClick={() => togglePublish(post)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    disabled={busyId === post.id}
                    onClick={() => remove(post)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
