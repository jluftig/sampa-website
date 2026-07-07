import { formatDate, formatDateOnly } from './format';

// Canonical share URLs. These are permanent identifiers — key point ids are
// stable across edits (PostEditor syncs by id instead of replace-all), and the
// same paths will back universal links in the mobile apps.
export function postUrl(slug) {
  return `${window.location.origin}/news/${slug}`;
}

export function pointUrl(slug, itemId) {
  return `${postUrl(slug)}#point-${itemId}`;
}

// Slide-deck-ready citation for one Key Point:
//   "claim text"
//   — Journal of X, March 3, 2026 (https://doi.org/...)
//   via SAMPA, April 1, 2026: https://www.addictionpas.org/news/slug#point-id
// The middle line is omitted for posts without an external source (original
// SAMPA content, or posts published before source fields existed).
export function pointCitation(point, post) {
  const lines = [`"${point.content}"`];
  if (post.source_name || post.source_url) {
    const date = post.source_published_at ? formatDateOnly(post.source_published_at) : '';
    lines.push(
      `— ${post.source_name || 'Original source'}` +
      (date ? `, ${date}` : '') +
      (post.source_url ? ` (${post.source_url})` : '')
    );
  }
  const posted = formatDate(post.published_at);
  lines.push(`via SAMPA${posted ? `, ${posted}` : ''}: ${pointUrl(post.slug, point.id)}`);
  return lines.join('\n');
}
