// One combined /news feed: the older CMS news posts (Supabase `posts`) and the
// weekday roundups (content/daily-news/*.json), newest first. The roundup is
// the continuation of the earlier daily posts, so both live in one list.

const PT_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// "2026-09-24T17:03:00Z" -> "2026-09-24" in Pacific time.
export function postDayKey(publishedAt) {
  if (!publishedAt) return '';
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return '';
  return PT_DAY.format(date);
}

export function buildNewsFeed(posts = [], roundups = []) {
  const entries = [];
  for (const post of posts || []) {
    if (!post || !post.slug) continue;
    entries.push({
      kind: 'post',
      key: `post-${post.id ?? post.slug}`,
      day: postDayKey(post.published_at),
      at: post.published_at || '',
      post,
    });
  }
  for (const roundup of roundups || []) {
    if (!roundup || !roundup.date) continue;
    entries.push({
      kind: 'roundup',
      key: `roundup-${roundup.date}`,
      day: roundup.date,
      at: `${roundup.date}T23:59:59`,
      roundup,
    });
  }
  entries.sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? 1 : -1;
    // Same day: the roundup leads, then posts newest first.
    if (a.kind !== b.kind) return a.kind === 'roundup' ? -1 : 1;
    return a.at < b.at ? 1 : a.at > b.at ? -1 : 0;
  });
  return entries;
}

export function monthLabel(dayKey) {
  const [year, month] = String(dayKey).split('-').map(Number);
  if (!year || !month) return 'Earlier';
  return MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)));
}

// Insert a month heading row before the first entry of each month.
export function feedWithMonthHeadings(entries = []) {
  const rows = [];
  let current = null;
  for (const entry of entries) {
    const month = String(entry.day).slice(0, 7) || 'unknown';
    if (month !== current) {
      current = month;
      rows.push({ type: 'month', key: `month-${month}`, label: monthLabel(entry.day) });
    }
    rows.push({ type: 'entry', key: entry.key, entry });
  }
  return rows;
}

export function countByMonth(entries = []) {
  const counts = {};
  for (const entry of entries) {
    const month = String(entry.day).slice(0, 7) || 'unknown';
    counts[month] = (counts[month] || 0) + 1;
  }
  return counts;
}
