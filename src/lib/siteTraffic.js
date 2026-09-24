import { canViewMemberRoster } from './memberRoster.js';

export { canViewMemberRoster };
export const canViewSiteTraffic = canViewMemberRoster;

export const TRAFFIC_RANGES = [7, 30];
export const TOP_PATH_LIMIT = 10;
export const TRAFFIC_CACHE_MS = 5 * 60 * 1000;
// Vercel Web Analytics has no backfill — counts start when tracking was enabled.
export const TRACKING_STARTED_NOTE = 'Tracking started on September 16, 2026.';
export const TRACKING_STARTED_AT = '2026-09-16T00:00:00.000Z';

export function parseTrafficRange(value) {
  return value === '30' || value === 30 ? 30 : 7;
}

// A 403/503 stays on the card. Refetch only when the range changes or there
// is no failed attempt for this range yet. Do not key a refetch on the error
// object — that retries forever.
export function shouldRequestTraffic({ stats, range, failedRange } = {}) {
  if (stats) return false;
  if (failedRange != null && failedRange === range) return false;
  return true;
}

export function trafficWindow(days, now = new Date()) {
  const range = parseTrafficRange(days);
  const until = new Date(now);
  const since = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
  return {
    range,
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

export function analyticsConfigFromEnv(env = {}) {
  const token = env.VERCEL_WEB_ANALYTICS_TOKEN || '';
  const projectId = env.VERCEL_WEB_ANALYTICS_PROJECT_ID || env.VERCEL_PROJECT_ID || '';
  const teamId = env.VERCEL_WEB_ANALYTICS_TEAM_ID || env.VERCEL_ORG_ID || '';
  return {
    token,
    projectId,
    teamId,
    configured: Boolean(token && projectId),
  };
}

export function normalizeVisitCount(payload) {
  const data = payload?.data && !Array.isArray(payload.data) ? payload.data : {};
  return {
    visitors: Number(data.visitors) || 0,
    pageviews: Number(data.pageviews) || 0,
  };
}

export function normalizeTopPaths(payload, limit = TOP_PATH_LIMIT) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row) => ({
      path: row.requestPath || row.route || row.path || '',
      pageviews: Number(row.pageviews) || 0,
      visitors: Number(row.visitors) || 0,
    }))
    .filter((row) => row.path && row.path !== 'Others')
    .slice(0, limit);
}

export function seriesSince(sinceIso, floor = TRACKING_STARTED_AT) {
  return sinceIso < floor ? floor : sinceIso;
}

export function normalizeDailySeries(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row) => {
      const date = String(row.timestamp || row.day || row.key || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      return {
        date,
        visitors: Number(row.visitors) || 0,
        pageviews: Number(row.pageviews) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function fillDailySeries(points, sinceIso, untilIso) {
  const byDate = new Map((points || []).map((point) => [point.date, point]));
  const start = new Date(sinceIso);
  const end = new Date(untilIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const out = [];
  while (cursor <= last && out.length < 120) {
    const date = cursor.toISOString().slice(0, 10);
    out.push(byDate.get(date) || { date, visitors: 0, pageviews: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function shapeSiteTraffic({ range, window, count, paths, series }) {
  const visitors = Number(count?.visitors) || 0;
  const pageviews = Number(count?.pageviews) || 0;
  return {
    range,
    since: window.since,
    until: window.until,
    visitors,
    pageviews,
    paths: Array.isArray(paths) ? paths : [],
    series: Array.isArray(series) ? series : [],
    empty: visitors === 0 && pageviews === 0,
  };
}
