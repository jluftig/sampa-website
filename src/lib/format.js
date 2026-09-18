// Format a timestamp like "March 14, 2026". Returns '' for empty values.
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format a date-only value like "2026-03-14" (e.g. posts.source_published_at).
// new Date('YYYY-MM-DD') parses as UTC midnight, which formatDate would render
// as the PREVIOUS day in US timezones — so build the Date from local parts.
export function formatDateOnly(value) {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return formatDate(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// "Josh Luftig" + "PA-C" → "Josh Luftig, PA-C". Does not double if the name
// already ends with that credential string.
export function formatAuthorByline(fullName, credentials) {
  const name = String(fullName || '').trim();
  const cred = String(credentials || '').trim();
  if (!name) return cred;
  if (!cred) return name;
  const n = name.toLowerCase();
  const c = cred.toLowerCase();
  if (n === c) return name;
  if (n.endsWith(`, ${c}`) || n.endsWith(` ${c}`)) return name;
  return `${name}, ${cred}`;
}

// Join author display names for the denormalized posts.author_name byline
// ("A", "A and B", "A, B, and C"). Empty / blank names are skipped.
export function formatAuthorNames(names) {
  const list = (names || []).map((n) => String(n || '').trim()).filter(Boolean);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}
