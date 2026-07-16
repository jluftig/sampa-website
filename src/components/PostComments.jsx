import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { formatDate } from '../lib/format';
import {
  MAX_COMMENT_LENGTH,
  REACTIONS,
  normalizeCommentBody,
  summarizeReactions,
} from '../lib/comments';

/**
 * Member discussion on a published article: emoji reactions + brief comments.
 * Read: anyone. Write: active members / staff (matches SQL is_active_member()).
 */
export default function PostComments({ postId, postSlug }) {
  const { user, isEditor, canAccessMemberDirectory, loading: authLoading } = useAuth();
  const canWrite = !!user && canAccessMemberDirectory;

  const [comments, setComments] = useState([]);
  const [reactionRows, setReactionRows] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | unavailable
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reactBusy, setReactBusy] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    const [cRes, rRes] = await Promise.all([
      supabase
        .from('post_comments')
        .select('id, user_id, body, author_name, created_at, updated_at')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('post_reactions')
        .select('user_id, emoji')
        .eq('post_id', postId),
    ]);
    // Graceful degrade if migration not applied yet (gotcha 14).
    if (cRes.error || rRes.error) {
      setStatus('unavailable');
      return;
    }
    setComments(cRes.data || []);
    setReactionRows(rRes.data || []);
    setStatus('ready');
  }, [postId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');
      await load();
      if (!active) return;
    })();
    return () => { active = false; };
  }, [load]);

  const { counts, mine } = summarizeReactions(reactionRows, user?.id);

  async function toggleReaction(key) {
    if (!canWrite || !user || reactBusy) return;
    setReactBusy(true);
    setError(null);
    try {
      if (mine === key) {
        const { error: err } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (err) throw err;
      } else if (mine) {
        const { error: err } = await supabase
          .from('post_reactions')
          .update({ emoji: key })
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, emoji: key });
        if (err) throw err;
      }
      await load();
    } catch (e) {
      setError(e?.message || 'Could not save your reaction.');
    } finally {
      setReactBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!canWrite || !user || busy) return;
    const normalized = normalizeCommentBody(body);
    if (!normalized.ok) {
      setError(normalized.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        body: normalized.body,
      });
      if (err) throw err;
      setBody('');
      await load();
    } catch (e) {
      setError(e?.message || 'Could not post your comment.');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditBody(c.body);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody('');
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!user || !editingId || busy) return;
    const normalized = normalizeCommentBody(editBody);
    if (!normalized.ok) {
      setError(normalized.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('post_comments')
        .update({ body: normalized.body })
        .eq('id', editingId)
        .eq('user_id', user.id);
      if (err) throw err;
      cancelEdit();
      await load();
    } catch (err) {
      setError(err?.message || 'Could not update the comment.');
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(id) {
    if (!user || busy) return;
    if (!window.confirm('Remove this comment?')) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('post_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw err;
      if (editingId === id) cancelEdit();
      await load();
    } catch (e) {
      setError(e?.message || 'Could not remove the comment.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'unavailable') return null;
  if (status === 'loading' || authLoading) {
    return (
      <section className="mt-16">
        <h2 className="font-drama italic text-2xl md:text-3xl font-bold mb-6">
          Member discussion
        </h2>
        <p className="text-text/50 font-data text-sm">Loading…</p>
      </section>
    );
  }

  const loginNext = `/login?next=${encodeURIComponent(`/news/${postSlug}`)}`;

  return (
    <section className="mt-16" aria-labelledby="member-discussion">
      <h2 id="member-discussion" className="font-drama italic text-2xl md:text-3xl font-bold mb-2">
        Member discussion
      </h2>
      <p className="text-text/60 text-sm mb-6">
        Brief reactions and comments from SAMPA members.
      </p>

      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Reactions">
        {REACTIONS.map((r) => {
          const count = counts[r.key] || 0;
          const selected = mine === r.key;
          const Tag = canWrite ? 'button' : 'div';
          return (
            <Tag
              key={r.key}
              type={canWrite ? 'button' : undefined}
              onClick={canWrite ? () => toggleReaction(r.key) : undefined}
              disabled={canWrite ? reactBusy : undefined}
              title={r.label}
              aria-label={`${r.label}${count ? `, ${count}` : ''}${selected ? ', selected' : ''}`}
              aria-pressed={canWrite ? selected : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? 'border-primary/50 bg-primary/10 text-text'
                  : 'border-primary/10 bg-white text-text/80'
              } ${canWrite ? 'hover:border-primary/40 cursor-pointer disabled:opacity-50' : ''}`}
            >
              <span aria-hidden="true">{r.glyph}</span>
              {count > 0 && (
                <span className="font-data text-xs font-semibold text-text/60">{count}</span>
              )}
            </Tag>
          );
        })}
      </div>

      {comments.length === 0 ? (
        <p className="text-text/50 text-sm mb-6">No comments yet. Be the first to share a thought.</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {comments.map((c) => {
            const isOwn = user && c.user_id === user.id;
            const canRemove = isOwn || isEditor;
            const isEditing = editingId === c.id;
            const edited =
              c.updated_at &&
              c.created_at &&
              new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 2000;
            return (
              <li key={c.id} className="border-t border-primary/10 pt-4">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="text-sm">
                    <span className="font-semibold text-text">{c.author_name || 'Member'}</span>
                    <span className="text-text/40 font-data text-xs ml-2">
                      {formatDate(c.created_at)}
                      {edited ? ' · edited' : ''}
                    </span>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-3 shrink-0">
                      {isOwn && (
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          disabled={busy}
                          className="text-xs font-data text-text/40 hover:text-primary-text transition-colors disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => removeComment(c.id)}
                          disabled={busy}
                          className="text-xs font-data text-text/40 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <form onSubmit={saveEdit} className="space-y-2 mt-2">
                    <label htmlFor={`edit-comment-${c.id}`} className="sr-only">
                      Edit comment
                    </label>
                    <textarea
                      id={`edit-comment-${c.id}`}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={3}
                      className="w-full rounded-2xl border border-primary/15 bg-white px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/40 resize-y min-h-[5rem]"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-data text-text/40">
                        {editBody.trim().length}/{MAX_COMMENT_LENGTH}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={busy}
                          className="text-xs font-data text-text/50 hover:text-text transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={busy || !editBody.trim()}
                          className="rounded-full bg-primary text-white font-semibold text-sm px-4 py-1.5 hover:bg-primary-text transition-colors disabled:opacity-50"
                        >
                          {busy ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <p className="text-text/90 leading-relaxed">{c.body}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>
      )}

      {!user ? (
        <p className="text-sm text-text/60">
          <Link to={loginNext} className="text-primary-text font-semibold hover:underline">
            Sign in
          </Link>
          {' '}as a member to react or comment.
        </p>
      ) : !canWrite ? (
        <p className="text-sm text-text/60">
          Active membership is required to join the discussion.{' '}
          <Link to="/join" className="text-primary-text font-semibold hover:underline">
            Join SAMPA
          </Link>
        </p>
      ) : (
        <form onSubmit={submitComment} className="space-y-3">
          <label htmlFor="member-comment" className="sr-only">
            Your comment
          </label>
          <textarea
            id="member-comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder="Share a brief thought…"
            className="w-full rounded-2xl border border-primary/15 bg-white px-4 py-3 text-sm text-text placeholder:text-text/35 focus:outline-none focus:border-primary/40 resize-y min-h-[5rem]"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-data text-text/40">
              {body.trim().length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="rounded-full bg-primary text-white font-semibold text-sm px-5 py-2 hover:bg-primary-text transition-colors disabled:opacity-50"
            >
              {busy ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
