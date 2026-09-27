import { requireUser, supabaseAdmin, json } from './clients.js';
import { createTtlCache } from './ttl-cache.js';
import { canViewMemberRoster } from '../../src/lib/memberRoster.js';
import { shapeMembershipStats } from '../../src/lib/membershipStats.js';

const CACHE_MS = 5 * 60 * 1000;
const membershipCache = createTtlCache();

function membershipJson(body, status = 200) {
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

async function loadMembershipRows() {
  const admin = supabaseAdmin();
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from < 10000; from += pageSize) {
    const { data, error } = await admin
      .from('profiles')
      .select('membership_status, membership_tier, membership_years, renews_on')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function handleMembershipStats(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadViewerProfile;
  const loadRows = deps.loadMembershipRows || loadMembershipRows;
  const now = deps.now || new Date();
  const cache = deps.cache || membershipCache;

  try {
    const user = await requireViewer(request);
    if (!user) return membershipJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewMemberRoster(profile)) {
      return membershipJson({ error: 'Not authorized' }, 403);
    }

    const cacheKey = `membership:${now.toISOString().slice(0, 7)}`;
    const cached = cache.get(cacheKey);
    if (cached) return membershipJson(cached);

    const rows = await loadRows();
    const body = shapeMembershipStats(rows, now);
    cache.set(cacheKey, body, CACHE_MS);
    return membershipJson(body);
  } catch (err) {
    console.error('membership-stats:', err?.message || err);
    return membershipJson({
      error: 'membership_error',
      message: 'Could not load membership stats right now.',
    }, 502);
  }
}
