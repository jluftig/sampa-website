import { requireUser, supabaseAdmin, json } from './clients.js';
import { isActiveMemberAccess } from '../../src/lib/memberHome.js';
import { shapeMembershipStats } from '../../src/lib/membershipStats.js';
import { brevoConfigFromEnv } from '../../src/lib/newsletterStats.js';
import { brevoGet } from './brevo-readonly.js';
import { loadMembershipRows } from './membership-stats.js';

function numbersJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

async function loadMemberProfile(userId) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('membership_status, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function readListCount(get, apiKey, listId) {
  try {
    const list = await get(apiKey, `/contacts/lists/${listId}`);
    const total = Number(list?.totalSubscribers);
    return {
      listId,
      name: list?.name || null,
      subscribers: Number.isFinite(total) ? total : null,
    };
  } catch (err) {
    console.error('board-numbers list:', listId, err?.status || err?.message || err);
    return { listId, name: null, subscribers: null };
  }
}

export async function handleBoardNumbers(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadMemberProfile || loadMemberProfile;
  const loadRows = deps.loadMembershipRows || loadMembershipRows;
  const env = deps.env || process.env;
  const get = deps.brevoGet || brevoGet;
  const now = deps.now || new Date();

  try {
    const user = await requireViewer(request);
    if (!user) return numbersJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!isActiveMemberAccess(profile)) {
      return numbersJson({ error: 'Not authorized' }, 403);
    }

    const rows = await loadRows();
    const activeMembers = shapeMembershipStats(rows, now).activeNow;
    const cfg = brevoConfigFromEnv(env);
    if (!cfg.configured) {
      return numbersJson({
        activeMembers,
        weekly: { listId: cfg.listId, subscribers: null },
        daily: { listId: cfg.dailyListId, subscribers: null },
      });
    }

    const [weekly, daily] = await Promise.all([
      readListCount(get, cfg.apiKey, cfg.listId),
      readListCount(get, cfg.apiKey, cfg.dailyListId),
    ]);
    return numbersJson({
      activeMembers,
      weekly: { listId: cfg.listId, subscribers: weekly.subscribers },
      daily: { listId: cfg.dailyListId, subscribers: daily.subscribers },
    });
  } catch (err) {
    console.error('board-numbers:', err?.message || err);
    return numbersJson({
      error: 'numbers_error',
      message: 'Could not load member numbers right now.',
    }, 502);
  }
}
