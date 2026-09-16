// Site-traffic dashboard helpers. Aggregate visitors/pageviews only — no PII.
// Gate: Board or Membership Committee. Admin is not implied (same as is_board).

export const TRAFFIC_RANGES = [7, 30];
export const TOP_PATH_LIMIT = 5;

export function canViewSiteTraffic(profile) {
  return !!(profile?.is_board || profile?.is_membership_committee);
}

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
