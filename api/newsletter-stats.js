import { requireUser, json } from './_lib/clients.js';
import { createTtlCache } from './_lib/ttl-cache.js';
import { brevoGet, loadSentCampaigns } from './_lib/brevo-readonly.js';
import { handleMembershipStats } from './_lib/membership-stats.js';
import { handleFinanceStats } from './_lib/finance-stats.js';
import { handleBoardMeetings } from './_lib/boardMeetingsHandler.js';
import { canViewBoardDashboard } from '../src/lib/memberRoster.js';
import { loadBoardDashboardProfile } from './_lib/boardDashboardAccess.js';
import { handleBoardNumbers } from './_lib/boardNumbers.js';
import { handleSubscriberSnapshot } from './_lib/subscriberSnapshotJob.js';
import {
  brevoConfigFromEnv,
  selectDailySends,
  selectWeeklyIssues,
  shapeNewsletterStats,
  snapshotsForList,
  topClickedLinks,
} from '../src/lib/newsletterStats.js';
import { loadSubscriberSnapshots } from './_lib/subscriberSnapshots.js';

const CACHE_MS = 5 * 60 * 1000;
const newsletterCache = createTtlCache();

function newsletterJson(body, status = 200) {
  const cacheControl = status === 200 ? 'private, max-age=300' : 'private, no-store';
  return json(body, status, { 'cache-control': cacheControl });
}

async function loadViewerProfile(userId) {
  return loadBoardDashboardProfile(userId);
}

async function safeLoadSnapshots(loadSnapshots) {
  if (loadSnapshots) return loadSnapshots();
  try {
    return await loadSubscriberSnapshots();
  } catch (err) {
    const message = err?.message || '';
    if (/SUPABASE_|subscriber_snapshots|schema cache/i.test(message)) return [];
    throw err;
  }
}

export async function handleNewsletterStats(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadViewerProfile;
  const env = deps.env || process.env;
  const get = deps.brevoGet || brevoGet;
  const cache = deps.cache || newsletterCache;
  const loadSnaps = () => safeLoadSnapshots(deps.loadSnapshots);

  try {
    const user = await requireViewer(request);
    if (!user) return newsletterJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewBoardDashboard(profile)) {
      return newsletterJson({ error: 'Not authorized' }, 403);
    }

    const cfg = brevoConfigFromEnv(env);
    if (!cfg.configured) {
      return newsletterJson({
        error: 'not_configured',
        message: 'Newsletter stats not configured.',
      }, 503);
    }

    const cacheKey = `newsletter:${cfg.listId}:${cfg.dailyListId}`;
    const cached = cache.get(cacheKey);
    if (cached) return newsletterJson(cached);

    const [list, dailyList, campaigns, snapshots] = await Promise.all([
      get(cfg.apiKey, `/contacts/lists/${cfg.listId}`),
      Promise.resolve(get(cfg.apiKey, `/contacts/lists/${cfg.dailyListId}`)).catch((err) => {
        console.error('newsletter-stats daily list:', err?.status || err?.message || err);
        return null;
      }),
      loadSentCampaigns(cfg.apiKey, get),
      loadSnaps(),
    ]);

    const issues = selectWeeklyIssues(campaigns, {
      updatesListId: cfg.listId,
      testListId: cfg.testListId,
    });
    const dailyIssues = selectDailySends(campaigns, {
      dailyListId: cfg.dailyListId,
      testListId: cfg.testListId,
    });
    const topLinks = [];
    for (const issue of issues.slice(0, 3)) {
      try {
        const detail = await get(
          cfg.apiKey,
          `/emailCampaigns/${issue.id}?statistics=linksStats&excludeHtmlContent=true`,
        );
        const links = topClickedLinks(detail?.statistics?.linksStats);
        if (links.length) topLinks.push({ id: issue.id, name: issue.name, links });
      } catch (err) {
        console.error('newsletter-stats links:', issue.id, err?.status || err?.message || err);
      }
    }
    const body = shapeNewsletterStats({
      subscribers: list?.totalSubscribers,
      listId: cfg.listId,
      listName: list?.name,
      issues,
      topLinks,
      subscriberSnapshots: snapshotsForList(snapshots, cfg.listId),
      daily: {
        subscribers: dailyList ? dailyList.totalSubscribers : null,
        listId: cfg.dailyListId,
        listName: dailyList?.name || 'SAMPA Daily Roundup',
        issues: dailyIssues,
        subscriberSnapshots: snapshotsForList(snapshots, cfg.dailyListId),
      },
    });
    cache.set(cacheKey, body, CACHE_MS);
    return newsletterJson(body);
  } catch (err) {
    console.error('newsletter-stats:', err?.status || err?.message || err);
    return newsletterJson({
      error: 'newsletter_error',
      message: 'Could not load newsletter stats right now.',
    }, 502);
  }
}

export function isBoardMeetingsRequest(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('section') === 'board') return true;
  return url.pathname === '/api/board-meetings' || url.pathname.endsWith('/board-meetings');
}

export async function GET(request, deps) {
  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  if (section === 'membership') return handleMembershipStats(request, deps);
  if (section === 'finance') return handleFinanceStats(request, deps);
  if (section === 'board-numbers') return handleBoardNumbers(request, deps);
  if (section === 'subscriber-snapshot') return handleSubscriberSnapshot(request, deps);
  if (isBoardMeetingsRequest(request)) return handleBoardMeetings(request, deps);
  return handleNewsletterStats(request, deps);
}
