import { requireUser, supabaseAdmin, json } from './_lib/clients.js';
import { createTtlCache } from './_lib/ttl-cache.js';
import { brevoGet, loadSentCampaigns } from './_lib/brevo-readonly.js';
import { canViewMemberRoster } from '../src/lib/memberRoster.js';
import {
  brevoConfigFromEnv,
  selectWeeklyIssues,
  shapeNewsletterStats,
  topClickedLinks,
} from '../src/lib/newsletterStats.js';

const CACHE_MS = 5 * 60 * 1000;
const newsletterCache = createTtlCache();

function newsletterJson(body, status = 200) {
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

export async function handleNewsletterStats(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadViewerProfile;
  const env = deps.env || process.env;
  const get = deps.brevoGet || brevoGet;
  const cache = deps.cache || newsletterCache;

  try {
    const user = await requireViewer(request);
    if (!user) return newsletterJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewMemberRoster(profile)) {
      return newsletterJson({ error: 'Not authorized' }, 403);
    }

    const cfg = brevoConfigFromEnv(env);
    if (!cfg.configured) {
      return newsletterJson({
        error: 'not_configured',
        message: 'Newsletter stats not configured.',
      }, 503);
    }

    const cacheKey = `newsletter:${cfg.listId}`;
    const cached = cache.get(cacheKey);
    if (cached) return newsletterJson(cached);

    const [list, campaigns] = await Promise.all([
      get(cfg.apiKey, `/contacts/lists/${cfg.listId}`),
      loadSentCampaigns(cfg.apiKey, get),
    ]);

    const issues = selectWeeklyIssues(campaigns, {
      updatesListId: cfg.listId,
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

export async function GET(request) {
  return handleNewsletterStats(request);
}
