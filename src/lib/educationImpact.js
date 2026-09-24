export const CME_PLACEHOLDER = {
  id: 'cme',
  label: 'CME / webinars',
  note: 'Coming when CME product is live',
};

export const JOBS_PLACEHOLDER = {
  id: 'jobs',
  label: 'Jobs board',
  note: 'Coming when jobs board is live',
};

function monthKey(iso) {
  return String(iso).slice(0, 7);
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

export function shapeDatedOutput(dates, now = new Date()) {
  const dated = (Array.isArray(dates) ? dates : [])
    .map((value) => String(value || '').slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();
  const nowKey = now.toISOString().slice(0, 7);
  const startKey = dated[0] ? monthKey(dated[0]) : null;
  const lastKey = dated.length ? monthKey(dated[dated.length - 1]) : null;
  const endKey = startKey ? (lastKey > nowKey ? lastKey : nowKey) : null;
  const counts = new Map();
  for (const value of dated) {
    const key = monthKey(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let running = 0;
  const series = startKey
    ? monthsFrom(startKey, endKey).map((month) => {
      const count = counts.get(month) || 0;
      running += count;
      return { month, count, total: running };
    })
    : [];
  return {
    total: dated.length,
    chartsReady: dated.length >= 2,
    monthly: series.map(({ month, count }) => ({ month, count })),
    cumulative: series.map(({ month, total }) => ({ month, total })),
  };
}

export function shapeEducationImpact({ articles = [], issues = [] } = {}, now = new Date()) {
  const publishedAt = (Array.isArray(articles) ? articles : []).map((row) => row?.publishedAt || row?.published_at);
  const sentAt = (Array.isArray(issues) ? issues : []).map((row) => row?.sentAt);
  return {
    news: shapeDatedOutput(publishedAt, now),
    weekly: shapeDatedOutput(sentAt, now),
    cme: { ...CME_PLACEHOLDER },
  };
}
