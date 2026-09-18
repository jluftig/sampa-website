import { canViewMemberRoster } from './memberRoster.js';

// Site-traffic helpers. Aggregate visitors/pageviews only — no PII.
// Gate matches the member roster: canViewMemberRoster (admin or can_view_members).

export { canViewMemberRoster };
export const canViewSiteTraffic = canViewMemberRoster;

export const TRAFFIC_RANGES = [7, 30];
export const TOP_PATH_LIMIT = 5;
// Vercel Web Analytics has no backfill — counts start when tracking was enabled.
export const TRACKING_STARTED_NOTE = 'Tracking started on September 16, 2026.';

export function parseTrafficRange(value) {
  return value === '30' || value === 30 ? 30 : 7;
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

export function shapeSiteTraffic({ range, window, count, paths }) {
  const visitors = Number(count?.visitors) || 0;
  const pageviews = Number(count?.pageviews) || 0;
  return {
    range,
    since: window.since,
    until: window.until,
    visitors,
    pageviews,
    paths: Array.isArray(paths) ? paths : [],
    empty: visitors === 0 && pageviews === 0,
  };
}
