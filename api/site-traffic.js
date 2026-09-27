import { requireUser, supabaseAdmin, json } from './_lib/clients.js';
import { createTtlCache } from './_lib/ttl-cache.js';
import { analyticsConfigFromEnv, queryVisits } from './_lib/vercel-analytics.js';
import {
  TOP_PATH_LIMIT,
  TRAFFIC_CACHE_MS,
  canViewMemberRoster,
  fillDailySeries,
  normalizeDailySeries,
  normalizeTopPaths,
  normalizeVisitCount,
  parseTrafficRange,
  seriesSince,
  shapeSiteTraffic,
  trafficWindow,
} from '../src/lib/siteTraffic.js';

const trafficCache = createTtlCache();

function trafficJson(body, status = 200) {
  const cacheControl = status === 200 ? 'private, max-age=300' : 'private, no-store';
  return json(body, status, { 'cache-control': cacheControl });
}

async function loadViewerProfile(userId) {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from('profiles')
    .select('role, can_view_members')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function handleSiteTraffic(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadViewerProfile;
  const env = deps.env || process.env;
  const query = deps.queryVisits || queryVisits;
  const now = deps.now || new Date();
  const cache = deps.cache || trafficCache;

  try {
    const user = await requireViewer(request);
    if (!user) return trafficJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewMemberRoster(profile)) {
      return trafficJson({ error: 'Not authorized' }, 403);
    }

    const cfg = analyticsConfigFromEnv(env);
    if (!cfg.configured) {
      return trafficJson({
        error: 'not_configured',
        message: 'Vercel Web Analytics token is not set on this deployment.',
      }, 503);
    }

    const url = new URL(request.url);
    const range = parseTrafficRange(url.searchParams.get('range'));
    const window = trafficWindow(range, now);
    const cacheKey = `traffic:${range}:${window.since}:${window.until}`;
    const cached = cache.get(cacheKey);
    if (cached) return trafficJson(cached);

    const daySince = seriesSince(window.since);
    const shared = {
      token: cfg.token,
      projectId: cfg.projectId,
      teamId: cfg.teamId,
    };
    const [countPayload, pathsPayload, seriesPayload] = await Promise.all([
      query({
        ...shared,
        mode: 'count',
        since: window.since,
        until: window.until,
      }),
      query({
        ...shared,
        mode: 'aggregate',
        since: window.since,
        until: window.until,
        by: ['requestPath'],
        limit: TOP_PATH_LIMIT,
        filter: "environment eq 'production'",
      }),
      query({
        ...shared,
        mode: 'aggregate',
        since: daySince,
        until: window.until,
        by: ['day'],
        filter: "environment eq 'production'",
      }),
    ]);

    const body = shapeSiteTraffic({
      range,
      window,
      count: normalizeVisitCount(countPayload),
      paths: normalizeTopPaths(pathsPayload),
      series: fillDailySeries(normalizeDailySeries(seriesPayload), daySince, window.until),
    });
    cache.set(cacheKey, body, TRAFFIC_CACHE_MS);
    return trafficJson(body);
  } catch (err) {
    console.error('site-traffic:', err);
    return trafficJson({
      error: 'analytics_error',
      message: 'Could not load site traffic right now.',
    }, 502);
  }
}

export async function GET(request) {
  return handleSiteTraffic(request);
}
