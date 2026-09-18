import { requireUser, supabaseAdmin, json } from './_lib/clients.js';
import { analyticsConfigFromEnv, queryVisits } from './_lib/vercel-analytics.js';
import {
  TOP_PATH_LIMIT,
  canViewMemberRoster,
  normalizeTopPaths,
  normalizeVisitCount,
  parseTrafficRange,
  shapeSiteTraffic,
  trafficWindow,
} from '../src/lib/siteTraffic.js';

// GET /api/site-traffic?range=7|30
// Same gate as /editor/members: canViewMemberRoster (admin or can_view_members).
// Proxies Vercel Web Analytics (aggregates, no PII). Token stays on the server.

function trafficJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
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

    const [countPayload, pathsPayload] = await Promise.all([
      query({
        token: cfg.token,
        projectId: cfg.projectId,
        teamId: cfg.teamId,
        mode: 'count',
        since: window.since,
        until: window.until,
      }),
      query({
        token: cfg.token,
        projectId: cfg.projectId,
        teamId: cfg.teamId,
        mode: 'aggregate',
        since: window.since,
        until: window.until,
        by: ['requestPath'],
        limit: TOP_PATH_LIMIT,
        filter: "environment eq 'production'",
      }),
    ]);

    return trafficJson(shapeSiteTraffic({
      range,
      window,
      count: normalizeVisitCount(countPayload),
      paths: normalizeTopPaths(pathsPayload),
    }));
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
