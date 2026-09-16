import { requireUser, supabaseAdmin, json } from './_lib/clients.js';
import { analyticsConfigFromEnv, queryVisits } from './_lib/vercel-analytics.js';
import {
  TOP_PATH_LIMIT,
  canViewSiteTraffic,
  normalizeTopPaths,
  normalizeVisitCount,
  parseTrafficRange,
  shapeSiteTraffic,
  trafficWindow,
} from '../src/lib/siteTraffic.js';

// GET /api/site-traffic?range=7|30
// Board or Membership Committee only. Proxies Vercel Web Analytics (aggregates,
// no PII). Token stays on the server.

function trafficJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

async function loadViewerProfile(userId) {
  const admin = supabaseAdmin();
  const full = await admin
    .from('profiles')
    .select('is_board, is_membership_committee')
    .eq('id', userId)
    .maybeSingle();
  if (!full.error) return full.data;

  // Migration not applied yet — fall back to is_board only.
  const boardOnly = await admin
    .from('profiles')
    .select('is_board')
    .eq('id', userId)
    .maybeSingle();
  return boardOnly.data;
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    if (!user) return trafficJson({ error: 'Sign in required' }, 401);

    const profile = await loadViewerProfile(user.id);
    if (!canViewSiteTraffic(profile)) {
      return trafficJson({ error: 'Not authorized' }, 403);
    }

    const cfg = analyticsConfigFromEnv(process.env);
    if (!cfg.configured) {
      return trafficJson({
        error: 'not_configured',
        message: 'Vercel Web Analytics token is not set on this deployment.',
      }, 503);
    }

    const url = new URL(request.url);
    const range = parseTrafficRange(url.searchParams.get('range'));
    const window = trafficWindow(range);

    const [countPayload, pathsPayload] = await Promise.all([
      queryVisits({
        token: cfg.token,
        projectId: cfg.projectId,
        teamId: cfg.teamId,
        mode: 'count',
        since: window.since,
        until: window.until,
      }),
      queryVisits({
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
