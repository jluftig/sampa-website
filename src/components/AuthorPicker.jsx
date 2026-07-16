import React from 'react';

/**
 * Ordered co-author list for the post editor.
 * authors: [{ profileId, fullName }]
 * editors: [{ id, full_name, email }] from list_news_editors()
 * First in the list is the primary author (posts.author_id).
 */
export default function AuthorPicker({ authors, editors, onChange }) {
  const selectedIds = new Set((authors || []).map((a) => a.profileId));
  const available = (editors || []).filter((e) => !selectedIds.has(e.id));

  function move(index, delta) {
    const next = [...authors];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(profileId) {
    if (authors.length <= 1) return;
    onChange(authors.filter((a) => a.profileId !== profileId));
  }

  function add(e) {
    const id = e.target.value;
    e.target.value = '';
    if (!id) return;
    const ed = editors.find((x) => x.id === id);
    if (!ed) return;
    onChange([...authors, { profileId: ed.id, fullName: ed.full_name }]);
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        Authors <span className="text-red-500">*</span>{' '}
        <span className="text-text/40 font-normal">— news editors only; first is primary</span>
      </label>
      <p className="text-text/50 text-xs mb-3">
        The byline on the article page is built from this list. Reorder with the arrows.
      </p>

      <ul className="space-y-2">
        {authors.map((a, idx) => (
          <li
            key={a.profileId}
            className="flex flex-wrap items-center gap-2 bg-white border border-primary/10 rounded-xl px-3 py-2"
          >
            <span className="font-data text-text/30 text-xs w-4">{idx + 1}</span>
            <span className="flex-1 text-sm font-semibold min-w-0 truncate">
              {a.fullName}
              {idx === 0 && (
                <span className="ml-2 text-xs font-normal text-text/40">Primary</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="px-2 py-1 text-xs font-semibold rounded-lg border border-primary/15 text-primary disabled:opacity-30 hover:bg-primary/5"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === authors.length - 1}
                className="px-2 py-1 text-xs font-semibold rounded-lg border border-primary/15 text-primary disabled:opacity-30 hover:bg-primary/5"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(a.profileId)}
                disabled={authors.length <= 1}
                className="px-2 py-1 text-xs font-semibold text-red-500 disabled:opacity-30 hover:underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {available.length > 0 ? (
        <select
          defaultValue=""
          onChange={add}
          className="mt-3 w-full px-3 py-2.5 rounded-xl border border-primary/20 focus:outline-none focus:border-primary bg-white text-sm"
        >
          <option value="">+ Add co-author…</option>
          {available.map((ed) => (
            <option key={ed.id} value={ed.id}>
              {ed.full_name}{ed.email && ed.full_name !== ed.email ? ` (${ed.email})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-3 text-text/40 text-xs">
          {editors.length === 0
            ? 'No news editors found — grant “Publish news” under People & permissions.'
            : 'All news editors are already on this post.'}
        </p>
      )}
    </div>
  );
}
