export const UPDATES_LIST_ID = 3;
export const TEST_LIST_ID = 8;
export const MAKEUP_LIST_ID = 13;
export const RECENT_ISSUE_LIMIT = 12;
export const WEEKLY_NAME = /SAMPA Weekly.*(Issue\s*#?\d+)/i;
export const WEEKLY_SUBJECT_PREFIX = 'SAMPA Weekly:';
export const SUBSCRIBER_SNAPSHOTS = [];

export function brevoConfigFromEnv(env = {}) {
  const apiKey = env.BREVO_API_KEY || env.SENDINBLUE_API_KEY || '';
  const listId = Number(env.BREVO_LIST_UPDATES);
  const testListId = Number(env.BREVO_LIST_TEST);
  return {
    apiKey,
    listId: Number.isFinite(listId) && listId > 0 ? listId : UPDATES_LIST_ID,
    testListId: Number.isFinite(testListId) && testListId > 0 ? testListId : TEST_LIST_ID,
    configured: Boolean(apiKey),
  };
}

export function listIdsFromRecipients(recipients) {
  const lists = recipients?.lists || recipients?.listIds || [];
  if (!Array.isArray(lists)) return [];
  return lists
    .map((item) => (typeof item === 'number' ? item : Number(item?.id)))
    .filter((id) => Number.isFinite(id));
}

export function globalStatsOf(campaign) {
  const stats = campaign?.statistics;
  if (stats?.globalStats && typeof stats.globalStats === 'object') return stats.globalStats;
  if (stats && (stats.sent != null || stats.delivered != null)) return stats;
  return {};
}

export function ratePercent(part, whole) {
  const n = Number(part);
  const d = Number(whole);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return null;
  return Math.round((n / d) * 1000) / 10;
}

export function capRate(rate) {
  if (rate == null || !Number.isFinite(Number(rate))) return null;
  return Math.min(100, Number(rate));
}

export function listCampaignStats(campaign, listId = UPDATES_LIST_ID) {
  const rows = campaign?.statistics?.campaignStats;
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => Number(row?.listId) === Number(listId)) || null;
}

// Reach omits a test send. The campaign stays in Brevo.
// A send is a test when the name or subject contains "test" (any case),
// or when recipients include the Brevo test list.
// Brevo's testSent flag means a preview was sent, including before a real issue, so it does not count.
export function isTestCampaign(campaign, options = {}) {
  if (!campaign) return false;
  const name = String(campaign.name || '');
  const subject = String(campaign.subject || '');
  if (name.toLowerCase().includes('test') || subject.toLowerCase().includes('test')) return true;
  const testListId = Number(options.testListId ?? TEST_LIST_ID);
  if (!Number.isFinite(testListId) || testListId <= 0) return false;
  return listIdsFromRecipients(campaign.recipients).includes(testListId);
}

export function isWeeklyIssue(campaign, options = {}) {
  const updatesListId = options.updatesListId ?? UPDATES_LIST_ID;
  const makeupListId = options.makeupListId ?? MAKEUP_LIST_ID;
  if (!campaign || String(campaign.status || '').toLowerCase() !== 'sent') return false;
  if (isTestCampaign(campaign, options)) return false;
  const name = String(campaign.name || '');
  if (/makeup/i.test(name)) return false;
  const lists = listIdsFromRecipients(campaign.recipients);
  if (!lists.includes(updatesListId)) return false;
  if (lists.includes(makeupListId)) return false;
  const subject = String(campaign.subject || '').trim();
  return WEEKLY_NAME.test(name) || subject.startsWith(WEEKLY_SUBJECT_PREFIX);
}

function countOf(row, key) {
  const n = Number(row?.[key]);
  return Number.isFinite(n) ? n : 0;
}

export function displayIssueName(name) {
  const raw = String(name || '').trim();
  let cleaned = raw;
  let previous;
  do {
    previous = cleaned;
    cleaned = cleaned.replace(/\s*\([^()]*\)/g, ' ');
  } while (cleaned !== previous);
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || raw;
}

export function toWeeklyIssue(campaign, options = {}) {
  const listId = options.updatesListId ?? UPDATES_LIST_ID;
  const listStats = listCampaignStats(campaign, listId);
  const global = globalStatsOf(campaign);
  const stats = listStats || global;
  const recipients = countOf(stats, 'sent');
  const delivered = countOf(stats, 'delivered');
  const uniqueOpens = countOf(stats, 'uniqueViews') || countOf(stats, 'uniqueOpens');
  const uniqueClicks = countOf(stats, 'uniqueClicks');
  const clickers = listStats && Number.isFinite(Number(listStats.clickers))
    ? Number(listStats.clickers)
    : (Number.isFinite(Number(global.clickers)) ? Number(global.clickers) : null);
  const denom = delivered > 0 ? delivered : recipients;
  const opensRate = Number(global.opensRate);
  const openRate = Number.isFinite(opensRate)
    ? capRate(Math.round(opensRate * 10) / 10)
    : ratePercent(uniqueOpens, denom);
  const clickBase = clickers == null ? uniqueClicks : clickers;
  return {
    id: campaign.id,
    name: campaign.name || `Campaign ${campaign.id}`,
    sentAt: campaign.sentDate || campaign.scheduledAt || null,
    recipients,
    delivered,
    uniqueOpens,
    uniqueClicks,
    clickers,
    openRate,
    clickRate: capRate(ratePercent(clickBase, denom)),
    statsSource: listStats ? 'campaignStats' : 'globalStats',
  };
}

export function selectWeeklyIssues(campaigns, options = {}) {
  const limit = options.limit ?? RECENT_ISSUE_LIMIT;
  return (Array.isArray(campaigns) ? campaigns : [])
    .filter((campaign) => isWeeklyIssue(campaign, options))
    .map((campaign) => toWeeklyIssue(campaign, options))
    .sort((a, b) => String(b.sentAt || '').localeCompare(String(a.sentAt || '')))
    .slice(0, limit);
}

export function topClickedLinks(linksStats, limit = 5) {
  if (!linksStats || typeof linksStats !== 'object' || Array.isArray(linksStats)) return [];
  return Object.entries(linksStats)
    .map(([url, clicks]) => ({ url: String(url), clicks: Number(clicks) || 0 }))
    .filter((row) => row.url && row.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || a.url.localeCompare(b.url))
    .slice(0, limit);
}

export function articleRef(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  let pathname = raw;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'addictionpas.org') return null;
    pathname = parsed.pathname;
  } catch {
    if (!pathname.startsWith('/')) return null;
  }
  const news = pathname.match(/^\/news\/([^/]+)\/?$/);
  if (news) {
    const slug = decodeURIComponent(news[1]);
    return { kind: 'news', slug, path: `/news/${slug}` };
  }
  const policy = pathname.match(/^\/policy\/([^/]+)\/?$/);
  if (policy) {
    const slug = decodeURIComponent(policy[1]);
    return { kind: 'policy', slug, path: `/policy/${slug}` };
  }
  return null;
}

export function articleClicks(linkGroups) {
  const byPath = new Map();
  for (const group of Array.isArray(linkGroups) ? linkGroups : []) {
    for (const link of group?.links || []) {
      const ref = articleRef(link.url);
      if (!ref) continue;
      const prev = byPath.get(ref.path) || { ...ref, url: link.url, clicks: 0 };
      prev.clicks += Number(link.clicks) || 0;
      byPath.set(ref.path, prev);
    }
  }
  return [...byPath.values()]
    .filter((row) => row.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || a.path.localeCompare(b.path));
}

export function listSizeSeries(issues, snapshots = SUBSCRIBER_SNAPSHOTS) {
  const snaps = (Array.isArray(snapshots) ? snapshots : [])
    .filter((row) => row?.date)
    .map((row) => ({
      date: String(row.date),
      total: Number(row.totalSubscribers) || 0,
      unique: row.uniqueSubscribers == null ? null : Number(row.uniqueSubscribers) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (snaps.length) return { source: 'snapshot', points: snaps };
  const points = [...(Array.isArray(issues) ? issues : [])]
    .filter((issue) => issue?.sentAt)
    .sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)))
    .map((issue) => ({
      date: issue.sentAt,
      total: Number(issue.recipients) || 0,
      issueId: issue.id,
    }));
  return { source: 'sent', points };
}

export function shapeNewsletterStats({
  subscribers,
  listId,
  listName,
  issues,
  topLinks,
  subscriberSnapshots,
}) {
  const list = Array.isArray(issues) ? issues : [];
  const links = Array.isArray(topLinks) ? topLinks : [];
  return {
    listId,
    listName: listName || 'SAMPA Updates',
    subscribers: Number(subscribers) || 0,
    latest: list[0] || null,
    issues: list,
    topLinks: links,
    articles: articleClicks(links),
    listSize: listSizeSeries(list, subscriberSnapshots),
    empty: list.length === 0,
  };
}
