// Local-storage draft persistence for the post editor, so in-progress work
// survives an accidental reload, crash, tab close, or navigation. Keyed per
// post ('new' for a new post, the post id when editing).

const PREFIX = 'sampa:draft:';

export function draftKeyFor(id) {
  return `${PREFIX}${id || 'new'}`;
}

export function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* storage full/unavailable — ignore */
  }
}

export function clearDraft(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// Canonical string of the editable fields — used to detect real changes vs. the
// saved version (ignores volatile bits like a key point's local id).
export function draftSignature(f) {
  return JSON.stringify({
    title: (f?.title || '').trim(),
    slug: (f?.slug || '').trim(),
    excerpt: (f?.excerpt || '').trim(),
    bodyHtml: f?.bodyHtml || '',
    coverImageUrl: f?.coverImageUrl || '',
    coverImageCaption: (f?.coverImageCaption || '').trim(),
    keyPoints: (f?.keyPoints || []).map((k) => ({
      content: (k.content || '').trim(),
      tagIds: [...(k.tagIds || [])].sort(),
    })),
  });
}

export function draftHasContent(f) {
  if (!f) return false;
  const plain = (f.bodyHtml || '').replace(/<[^>]*>/g, '').trim();
  return Boolean(
    (f.title || '').trim() ||
    (f.excerpt || '').trim() ||
    plain ||
    (f.keyPoints || []).some((k) => (k.content || '').trim())
  );
}
