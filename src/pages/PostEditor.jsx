import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { slugify, slugifyWithDate } from '../lib/slug';
import { draftKeyFor, readDraft, writeDraft, clearDraft, draftSignature, draftHasContent } from '../lib/draft';
import RichTextEditor from '../components/RichTextEditor';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PostEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageCaption, setCoverImageCaption] = useState('');
  const [currentStatus, setCurrentStatus] = useState('draft');
  const [publishedAt, setPublishedAt] = useState(null);

  // Key Points: each is { localId, content, tagIds[] }.
  const [keyPoints, setKeyPoints] = useState([]);
  const [allTags, setAllTags] = useState([]);

  // --- Local draft auto-save (survives reloads / crashes / tab close) ---
  const draftKey = draftKeyFor(id);
  const [captured] = useState(() => readDraft(draftKey)); // draft present at mount, if any
  const [recoverable, setRecoverable] = useState(null);   // captured draft worth offering to restore
  const [hydrated, setHydrated] = useState(!isEditing);   // gate autosave until initial data loaded
  const [editorNonce, setEditorNonce] = useState(0);      // bump to remount the uncontrolled rich-text editor
  const loadedSigRef = useRef(draftSignature({}));        // signature of the saved/loaded content

  // Load the controlled tag vocabulary (for the chip pickers).
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('tags').select('id, name, short_label, slug').order('name');
      if (active) setAllTags(data || []);
    })();
    return () => { active = false; };
  }, []);

  // Load the post (and its Key Points) when editing.
  useEffect(() => {
    if (!isEditing) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      if (error || !data) { setError('Could not load this post.'); setLoading(false); return; }
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setSlugTouched(true);
      setExcerpt(data.excerpt || '');
      setBodyHtml(data.body_html || '');
      setCoverImageUrl(data.cover_image_url || '');
      setCoverImageCaption(data.cover_image_caption || '');
      setCurrentStatus(data.status);
      setPublishedAt(data.published_at);

      const { data: itemData } = await supabase
        .from('items')
        .select('id, content, sort_order, item_tags(tag_id)')
        .eq('post_id', id)
        .order('sort_order');
      if (!active) return;
      const loadedKeyPoints = (itemData || []).map((it) => ({
        localId: crypto.randomUUID(),
        content: it.content,
        tagIds: (it.item_tags || []).map((t) => t.tag_id),
      }));
      setKeyPoints(loadedKeyPoints);

      // Baseline signature of the saved post; offer to restore the local draft
      // only if it actually differs from what's saved.
      loadedSigRef.current = draftSignature({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        bodyHtml: data.body_html || '',
        coverImageUrl: data.cover_image_url || '',
        coverImageCaption: data.cover_image_caption || '',
        keyPoints: loadedKeyPoints,
      });
      if (captured && draftHasContent(captured.data) &&
          draftSignature(captured.data) !== loadedSigRef.current) {
        setRecoverable(captured);
      } else if (captured) {
        clearDraft(draftKey); // stale or identical to saved — clean it up
      }
      setHydrated(true);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id, isEditing]);

  // New post: offer to restore any draft captured at mount.
  useEffect(() => {
    if (isEditing) return;
    if (captured && draftHasContent(captured.data)) setRecoverable(captured);
    else if (captured) clearDraft(draftKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save the in-progress post to local storage as it changes (debounced).
  useEffect(() => {
    if (!hydrated) return;
    const fields = { title, slug, slugTouched, excerpt, bodyHtml, coverImageUrl, coverImageCaption, keyPoints };
    const t = setTimeout(() => {
      if (draftHasContent(fields) && draftSignature(fields) !== loadedSigRef.current) {
        writeDraft(draftKey, fields);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [hydrated, title, slug, slugTouched, excerpt, bodyHtml, coverImageUrl, coverImageCaption, keyPoints, draftKey]);

  function addKeyPoint() {
    setKeyPoints((prev) => [...prev, { localId: crypto.randomUUID(), content: '', tagIds: [] }]);
  }
  function updateKeyPoint(localId, content) {
    setKeyPoints((prev) => prev.map((k) => (k.localId === localId ? { ...k, content } : k)));
  }
  function removeKeyPoint(localId) {
    setKeyPoints((prev) => prev.filter((k) => k.localId !== localId));
  }
  function toggleTag(localId, tagId) {
    setKeyPoints((prev) => prev.map((k) => {
      if (k.localId !== localId) return k;
      const has = k.tagIds.includes(tagId);
      return { ...k, tagIds: has ? k.tagIds.filter((t) => t !== tagId) : [...k.tagIds, tagId] };
    }));
  }

  // Keep slug in sync with the title until the editor edits the slug by hand.
  // Auto-slugs get a year-month suffix, e.g. "buprenorphine-access-2026-07".
  function onTitleChange(value) {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyWithDate(value));
  }

  async function onCoverSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('post-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) {
      setError(`Image upload failed: ${upErr.message}`);
    } else {
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      setCoverImageUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function restoreDraft() {
    const d = recoverable?.data;
    if (!d) return;
    setTitle(d.title || '');
    setSlug(d.slug || '');
    setSlugTouched(d.slugTouched ?? true);
    setExcerpt(d.excerpt || '');
    setCoverImageUrl(d.coverImageUrl || '');
    setCoverImageCaption(d.coverImageCaption || '');
    setKeyPoints((d.keyPoints || []).map((k) => ({
      localId: crypto.randomUUID(),
      content: k.content || '',
      tagIds: k.tagIds || [],
    })));
    setBodyHtml(d.bodyHtml || '');
    setEditorNonce((n) => n + 1); // remount the uncontrolled editor so it shows restored HTML
    setRecoverable(null);
  }

  function discardDraft() {
    clearDraft(draftKey);
    setRecoverable(null);
  }

  async function save(targetStatus) {
    // --- Required-field validation ---
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!slug.trim()) { setError('Please add a URL slug.'); return; }
    if (!keyPoints.some((k) => k.content.trim())) {
      setError('Add at least one Key Point.');
      return;
    }
    const untaggedPos = keyPoints.findIndex((k) => k.content.trim() && k.tagIds.length === 0);
    if (untaggedPos !== -1) {
      setError(`Key Point ${untaggedPos + 1} needs at least one keyword.`);
      return;
    }

    setSaving(true);
    setError(null);

    // Excerpt is optional; if blank, derive a preview from the article body,
    // falling back to the first Key Point, so news cards never look bare.
    const plainBody = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const firstPoint = keyPoints.find((k) => k.content.trim())?.content.trim() || '';
    const excerptSource = excerpt.trim() || plainBody || firstPoint;
    const derivedExcerpt = excerptSource
      ? (excerptSource.length > 200 ? `${excerptSource.slice(0, 200).trimEnd()}…` : excerptSource)
      : null;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: derivedExcerpt,
      body_html: bodyHtml,
      cover_image_url: coverImageUrl || null,
      cover_image_caption: coverImageCaption.trim() || null,
      author_id: user.id,
      author_name: profile?.full_name || profile?.email,
      status: targetStatus,
    };
    // Stamp publish date the first time it goes live.
    if (targetStatus === 'published' && !publishedAt) {
      payload.published_at = new Date().toISOString();
    }

    const postErrMsg = (err) =>
      err.code === '23505'
        ? 'That URL slug is already used by another post — change it and try again.'
        : err.message;

    // 1) Save the post itself, capturing its id (needed to link Key Points).
    let postId = id;
    if (isEditing) {
      const { error: postErr } = await supabase.from('posts').update(payload).eq('id', id);
      if (postErr) { setError(postErrMsg(postErr)); setSaving(false); return; }
    } else {
      const { data, error: postErr } = await supabase
        .from('posts').insert(payload).select('id').single();
      if (postErr) { setError(postErrMsg(postErr)); setSaving(false); return; }
      postId = data.id;
    }

    // 2) Sync Key Points. Replace-all is simple and reliable at this scale;
    //    deleting an item cascades to its item_tags automatically.
    const { error: delErr } = await supabase.from('items').delete().eq('post_id', postId);
    if (delErr) { setError(delErr.message); setSaving(false); return; }

    let order = 0;
    for (const kp of keyPoints) {
      if (!kp.content.trim()) continue;
      const { data: itemRow, error: itemErr } = await supabase
        .from('items')
        .insert({ post_id: postId, content: kp.content.trim(), sort_order: order++ })
        .select('id').single();
      if (itemErr) { setError(itemErr.message); setSaving(false); return; }
      if (kp.tagIds.length) {
        const { error: tagErr } = await supabase
          .from('item_tags')
          .insert(kp.tagIds.map((tag_id) => ({ item_id: itemRow.id, tag_id })));
        if (tagErr) { setError(tagErr.message); setSaving(false); return; }
      }
    }

    clearDraft(draftKey); // work is persisted to the DB now
    navigate('/editor');
  }

  const isPublished = currentStatus === 'published';

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>

        <h1 className="text-3xl font-drama font-bold mt-4 mb-8">
          {isEditing ? 'Edit post' : 'New post'}
        </h1>

        {loading ? (
          <p className="text-text/50 font-data">Loading…</p>
        ) : (
          <div className="space-y-6">
            {recoverable && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-amber-900">
                  <strong>Unsaved draft found.</strong> You have work from an earlier session that
                  wasn't saved. Restore it?
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={restoreDraft}
                    className="px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-semibold hover:opacity-90">
                    Restore it
                  </button>
                  <button type="button" onClick={discardDraft}
                    className="px-4 py-2 rounded-full border border-amber-300 text-amber-900 text-sm font-semibold hover:bg-amber-100">
                    Discard
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-text/40"><span className="text-red-500">*</span> Required</p>

            <div>
              <label className="block text-sm font-semibold mb-2">Title <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Headline of the post"
                className="w-full px-4 py-3 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                URL slug <span className="text-red-500">*</span> <span className="text-text/40 font-normal">— the link will be /news/{slug || '…'}</span>
              </label>
              <input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                placeholder="buprenorphine-access-2026"
                className="w-full px-4 py-3 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary bg-white font-data text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Excerpt <span className="text-text/40 font-normal">(optional) — shown on news cards; if blank, we'll use the start of your article.</span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="One or two sentences summarizing the post."
                className="w-full px-4 py-3 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary bg-white resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cover image <span className="text-text/40 font-normal">(optional)</span></label>
              {coverImageUrl && (
                <div className="mb-3">
                  <img src={coverImageUrl} alt="" className="w-full max-h-56 object-cover rounded-2xl" />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="text-red-500 text-sm font-semibold mt-2 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" onChange={onCoverSelected} disabled={uploading}
                className="block text-sm text-text/70 file:mr-4 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20" />
              {uploading && <p className="text-text/50 text-sm mt-2 font-data">Uploading…</p>}

              {coverImageUrl && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold mb-1 text-text/60">
                    Caption / citation <span className="font-normal text-text/40">— optional; shown under the image (e.g. figure source)</span>
                  </label>
                  <textarea
                    value={coverImageCaption}
                    onChange={(e) => setCoverImageCaption(e.target.value)}
                    rows={2}
                    placeholder="Figure 1. Adapted from Smith et al., JAMA. 2025;333(2):101–110."
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary bg-white text-sm resize-y"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Article <span className="text-text/40 font-normal">(optional)</span></label>
              <RichTextEditor key={editorNonce} initialContent={bodyHtml} onChange={setBodyHtml} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Key Points <span className="text-red-500">*</span> <span className="text-text/40 font-normal">— at least one required, each with at least one keyword</span>
              </label>
              <p className="text-text/50 text-sm mb-4">
                Each point is individually searchable by its keywords across all posts. Write each as
                a standalone statement (it should make sense on its own in a keyword search), then add
                keywords.
              </p>

              <div className="space-y-4">
                {keyPoints.map((kp, idx) => (
                  <div key={kp.localId} className="bg-white border border-primary/10 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-data text-text/30 text-sm pt-2.5">{idx + 1}</span>
                      <textarea
                        value={kp.content}
                        onChange={(e) => updateKeyPoint(kp.localId, e.target.value)}
                        rows={2}
                        placeholder="A self-contained key takeaway…"
                        className="flex-1 px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary resize-y"
                      />
                      <button type="button" onClick={() => removeKeyPoint(kp.localId)}
                        className="text-red-500 text-sm font-semibold pt-2.5 hover:underline">
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pl-7">
                      {allTags.length === 0 && (
                        <span className="text-text/40 text-xs">No keywords yet — add some under Manage keywords.</span>
                      )}
                      {allTags.map((tag) => {
                        const selected = kp.tagIds.includes(tag.id);
                        return (
                          <button type="button" key={tag.id} title={tag.name}
                            onClick={() => toggleTag(kp.localId, tag.id)}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-data font-semibold transition-colors ${
                              selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}>
                            {tag.short_label || tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addKeyPoint}
                className="mt-4 text-primary font-semibold hover:underline">
                + Add Key Point
              </button>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <p className="text-text/40 text-xs">
              Your work is auto-saved in this browser as you type, so you won't lose it if the page
              reloads. Publishing or saving stores it permanently.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isPublished ? (
                <>
                  <button onClick={() => save('published')} disabled={saving}
                    className="bg-accent text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button onClick={() => save('draft')} disabled={saving}
                    className="px-6 py-3 rounded-full border border-primary/20 font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
                    Unpublish
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => save('published')} disabled={saving}
                    className="bg-accent text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
                    {saving ? 'Saving…' : 'Publish'}
                  </button>
                  <button onClick={() => save('draft')} disabled={saving}
                    className="px-6 py-3 rounded-full border border-primary/20 font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
                    Save draft
                  </button>
                </>
              )}
              <Link to="/editor" className="text-text/50 font-semibold px-3 hover:text-text">Cancel</Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
