const RECENT_LIMIT = 5;

function monthKeyFromDate(isoDate) {
  return String(isoDate).slice(0, 7);
}

function shiftMonth(key, delta) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

function monthsFrom(startKey, endKey) {
  const keys = [];
  let key = startKey;
  while (key && endKey && key <= endKey && keys.length < 240) {
    keys.push(key);
    key = shiftMonth(key, 1);
  }
  return keys;
}

export function filedDateOf(doc) {
  const raw = String(doc?.submittedAt || doc?.publishedAt || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return { date: raw.slice(0, 10), yearOnly: false };
  }
  if (/^\d{4}$/.test(raw)) {
    return { date: `${raw}-01-01`, yearOnly: true };
  }
  return null;
}

export function shapePolicyImpact(documents, now = new Date()) {
  const rows = (Array.isArray(documents) ? documents : []).map((doc) => {
    const filed = filedDateOf(doc);
    return {
      slug: doc?.slug || '',
      title: doc?.title || 'Policy item',
      href: doc?.slug ? `/policy/${doc.slug}` : '/policy',
      date: filed?.date || null,
      yearOnly: Boolean(filed?.yearOnly),
    };
  });
  const dated = rows
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
  const nowKey = now.toISOString().slice(0, 7);
  const startKey = dated[0] ? monthKeyFromDate(dated[0].date) : null;
  const lastKey = dated.length ? monthKeyFromDate(dated[dated.length - 1].date) : null;
  const endKey = startKey ? (lastKey > nowKey ? lastKey : nowKey) : null;
  const counts = new Map();
  for (const row of dated) {
    const key = monthKeyFromDate(row.date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let running = 0;
  const monthly = startKey
    ? monthsFrom(startKey, endKey).map((month) => {
      const count = counts.get(month) || 0;
      running += count;
      return { month, count, total: running };
    })
    : [];
  const recent = [...dated].reverse().slice(0, RECENT_LIMIT);
  return {
    source: 'policyDocuments',
    total: dated.length,
    undated: rows.length - dated.length,
    yearOnly: dated.some((row) => row.yearOnly),
    chartsReady: dated.length >= 2,
    monthly: monthly.map(({ month, count }) => ({ month, count })),
    cumulative: monthly.map(({ month, total }) => ({ month, total })),
    recent,
  };
}
