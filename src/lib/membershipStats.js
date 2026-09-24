export const HEADCOUNT_MONTHS = 12;

export function monthKeys(now = new Date(), count = HEADCOUNT_MONTHS) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    keys.push(date.toISOString().slice(0, 7));
  }
  return keys;
}

function monthRange(key) {
  const [year, month] = key.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function classifyMember(profile) {
  if (profile?.membership_status !== 'active') return null;
  const tier = profile.membership_tier || 'unknown';
  const years = Number(profile.membership_years);
  if (profile.renews_on && Number.isFinite(years) && years > 0) {
    const end = new Date(profile.renews_on);
    if (Number.isNaN(end.getTime())) return { kind: 'point', tier };
    const start = new Date(end.getTime());
    start.setUTCFullYear(start.getUTCFullYear() - years);
    return { kind: 'term', tier, start, end };
  }
  return { kind: 'point', tier };
}

export function shapeMembershipStats(profiles, now = new Date()) {
  const rows = (Array.isArray(profiles) ? profiles : [])
    .map(classifyMember)
    .filter(Boolean);
  const keys = monthKeys(now);
  const currentKey = keys[keys.length - 1];
  const series = keys.map((month) => {
    const range = monthRange(month);
    const active = rows.filter((row) => {
      if (row.kind === 'point') return month === currentKey;
      return row.start < range.end && row.end > range.start;
    }).length;
    return { month, active };
  });
  const tiers = new Map();
  for (const row of rows) tiers.set(row.tier, (tiers.get(row.tier) || 0) + 1);
  const tierCounts = [...tiers.entries()]
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count || a.tier.localeCompare(b.tier));
  return {
    method: 'current_term',
    activeNow: rows.length,
    placed: rows.filter((row) => row.kind === 'term').length,
    pointOnly: rows.filter((row) => row.kind === 'point').length,
    series,
    tiers: tierCounts,
    periods: {
      joins: null,
      renewals: null,
      lapses: null,
    },
  };
}
