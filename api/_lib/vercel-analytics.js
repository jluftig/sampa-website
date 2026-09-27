import { analyticsConfigFromEnv } from '../../src/lib/siteTraffic.js';

const VISITS = 'https://api.vercel.com/v1/query/web-analytics/visits';

export { analyticsConfigFromEnv };

export function buildVisitsUrl({
  projectId,
  teamId,
  mode = 'count',
  since,
  until,
  by,
  limit,
  filter,
}) {
  const path = mode === 'aggregate' ? 'aggregate' : 'count';
  const url = new URL(`${VISITS}/${path}`);
  url.searchParams.set('projectId', projectId);
  if (teamId) url.searchParams.set('teamId', teamId);
  if (since) url.searchParams.set('since', since);
  if (until) url.searchParams.set('until', until);
  if (by) {
    for (const dim of Array.isArray(by) ? by : [by]) {
      url.searchParams.append('by', dim);
    }
  }
  if (limit) url.searchParams.set('limit', String(limit));
  if (filter) url.searchParams.set('filter', filter);
  return url;
}

export async function queryVisits({
  token,
  projectId,
  teamId,
  mode = 'count',
  since,
  until,
  by,
  limit,
  filter,
}) {
  const url = buildVisitsUrl({
    projectId, teamId, mode, since, until, by, limit, filter,
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      body?.error?.message || body?.message || `Vercel Analytics ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
