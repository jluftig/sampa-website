export const UPDATES_LIST_ID = 3;
export const TEST_LIST_ID = 8;
export const MIN_WEEKLY_SENT = 40;
export const RECENT_ISSUE_LIMIT = 8;

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

export function isWeeklyIssue(campaign, options = {}) {
  const updatesListId = options.updatesListId ?? UPDATES_LIST_ID;
  const minSent = options.minSent ?? MIN_WEEKLY_SENT;
  if (!campaign || String(campaign.status || '').toLowerCase() !== 'sent') return false;
  if (campaign.type && campaign.type !== 'classic') return false;
  const lists = listIdsFromRecipients(campaign.recipients);
  if (!lists.includes(updatesListId)) return false;
  const sent = Number(globalStatsOf(campaign).sent) || 0;
  return sent >= minSent;
}

export function toWeeklyIssue(campaign) {
  const stats = globalStatsOf(campaign);
  const recipients = Number(stats.sent) || 0;
  const delivered = Number(stats.delivered) || 0;
  const uniqueOpens = Number(stats.uniqueViews ?? stats.uniqueOpens) || 0;
  const uniqueClicks = Number(stats.uniqueClicks) || 0;
  const denom = delivered > 0 ? delivered : recipients;
  return {
    id: campaign.id,
    name: campaign.name || `Campaign ${campaign.id}`,
    sentAt: campaign.sentDate || campaign.scheduledAt || null,
    recipients,
    delivered,
    uniqueOpens,
    uniqueClicks,
    openRate: ratePercent(uniqueOpens, denom),
    clickRate: ratePercent(uniqueClicks, denom),
  };
}

export function selectWeeklyIssues(campaigns, options = {}) {
  const limit = options.limit ?? RECENT_ISSUE_LIMIT;
  return (Array.isArray(campaigns) ? campaigns : [])
    .filter((campaign) => isWeeklyIssue(campaign, options))
    .map(toWeeklyIssue)
    .sort((a, b) => String(b.sentAt || '').localeCompare(String(a.sentAt || '')))
    .slice(0, limit);
}

export function shapeNewsletterStats({
  subscribers,
  listId,
  listName,
  issues,
}) {
  const list = Array.isArray(issues) ? issues : [];
  return {
    listId,
    listName: listName || 'SAMPA Updates',
    subscribers: Number(subscribers) || 0,
    latest: list[0] || null,
    issues: list,
    empty: list.length === 0,
  };
}
