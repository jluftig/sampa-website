import Stripe from 'stripe';
import { requireUser, supabaseAdmin, json } from './_lib/clients.js';
import { createTtlCache } from './_lib/ttl-cache.js';
import { canViewFinance, canViewMemberRoster } from '../src/lib/memberRoster.js';
import { financeConfigFromEnv, shapeFinanceStats } from '../src/lib/financeStats.js';
import { monthKeys } from '../src/lib/membershipStats.js';

const CACHE_MS = 5 * 60 * 1000;
const financeCache = createTtlCache();

function financeJson(body, status = 200) {
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

async function listStripeTransactions(sinceUnix, key) {
  const stripe = new Stripe(key);
  const rows = [];
  let startingAfter;
  for (let page = 0; page < 10; page += 1) {
    const res = await stripe.balanceTransactions.list({
      limit: 100,
      created: { gte: sinceUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    const batch = res.data || [];
    rows.push(...batch);
    if (!res.has_more || !batch.length) break;
    startingAfter = batch[batch.length - 1].id;
  }
  return rows;
}

export async function handleFinanceStats(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadViewerProfile;
  const env = deps.env || process.env;
  const now = deps.now || new Date();
  const cache = deps.cache || financeCache;
  const listTransactions = deps.listTransactions || listStripeTransactions;

  try {
    const user = await requireViewer(request);
    if (!user) return financeJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewMemberRoster(profile)) {
      return financeJson({ error: 'Not authorized' }, 403);
    }
    if (!canViewFinance(profile)) {
      return financeJson({
        error: 'finance_restricted',
        message: 'Finance totals are limited to administrators.',
      }, 403);
    }

    const cfg = financeConfigFromEnv(env);
    if (!cfg.configured) {
      return financeJson({
        error: 'not_configured',
        message: 'Finances not configured.',
      }, 503);
    }

    const cacheKey = `finance:${now.toISOString().slice(0, 7)}`;
    const cached = cache.get(cacheKey);
    if (cached) return financeJson(cached);

    const since = new Date(`${monthKeys(now)[0]}-01T00:00:00.000Z`);
    const transactions = await listTransactions(Math.floor(since.getTime() / 1000), cfg.key);
    const body = shapeFinanceStats(transactions, now);
    cache.set(cacheKey, body, CACHE_MS);
    return financeJson(body);
  } catch (err) {
    console.error('finance-stats:', err?.statusCode || err?.message || err);
    return financeJson({
      error: 'finance_error',
      message: 'Could not load finance stats right now.',
    }, 502);
  }
}

export async function GET(request) {
  return handleFinanceStats(request);
}
