import { isRealIsoDate } from './dailyNewsLoad.js';
import { DAILY_VOCABULARY } from './dailyNewsVocabulary.js';

export const ARCHIVE_PAGE_SIZE = 10;
export const TAG_DECISION_STORAGE_KEY = 'sampa.dailyTagDecisions';
export const EMPTY_TAG_DECISIONS = { approved: [], dismissed: [] };

const PRODUCTION_ORIGIN = 'https://www.addictionpas.org';
const RESERVED_DATE_SLUGS = new Set(['archive', 'tag']);
const MEDICAL_SUFFIX = /(?:ine|one|oids?|ate|caine|amine|pam|done|xone|phine|mide|pine|zine|olol|ium)$/;

const STOPWORDS = new Set(
  `a an the and or of for to in on with from by at as into over after before during without within across among per via versus vs
get gets got new news one two three four five six seven eight nine ten
more most many some any other such than then that this these those their its it they them he she his her our your
was were are is be been being have has had not but if when who which while about
study studies trial trials report reports data found show shows showed said says
patient patients hospital hospitals hospitalist hospitalists care health medical clinical treatment
use used using user users older adult adults year years day days
linked higher lower risk risks first last next short practical playbook`
    .split(/\s+/)
    .filter(Boolean),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function textMatchesPattern(text, pattern) {
  const normalized = String(pattern || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return false;
  const body = escapeRegExp(normalized).replace(/ /g, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${body}s?(?=$|[^a-z0-9])`, 'i').test(String(text || ''));
}

export function itemSearchText(item) {
  return [item?.headline, item?.summary, item?.outlet].filter(Boolean).join('\n');
}

export function mergeVocabulary(base = DAILY_VOCABULARY, approved = []) {
  const extras = [];
  const seen = new Set(base.map((entry) => entry.slug));
  for (const entry of approved || []) {
    const slug = String(entry?.slug || '').trim().toLowerCase();
    const label = String(entry?.label || '').trim();
    if (!slug || !label || seen.has(slug)) continue;
    const patterns = Array.isArray(entry.patterns) && entry.patterns.length
      ? entry.patterns.map((pattern) => String(pattern).trim()).filter(Boolean)
      : [label];
    extras.push({ slug, label, patterns });
    seen.add(slug);
  }
  return [...base, ...extras];
}

export function vocabularyForDecisions(decisions) {
  return mergeVocabulary(DAILY_VOCABULARY, decisions?.approved || []);
}

export function matchTags(item, vocabulary = DAILY_VOCABULARY) {
  const text = itemSearchText(item);
  const tags = [];
  for (const entry of vocabulary) {
    if ((entry.patterns || []).some((pattern) => textMatchesPattern(text, pattern))) {
      tags.push({ slug: entry.slug, label: entry.label });
    }
  }
  return tags;
}

function canonicalToken(token) {
  if (token.endsWith('s')) {
    const stem = token.slice(0, -1);
    if (stem.length >= 5 && MEDICAL_SUFFIX.test(stem)) return stem;
  }
  return token;
}

function contentTokens(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 5 && /[a-z]/.test(token) && !STOPWORDS.has(token))
    .map(canonicalToken);
}

function knownTerms(vocabulary) {
  const known = new Set();
  for (const entry of vocabulary) {
    known.add(entry.slug);
    known.add(String(entry.label || '').toLowerCase());
    for (const pattern of entry.patterns || []) known.add(String(pattern).toLowerCase());
  }
  return known;
}

export function suggestKeyword(item, vocabulary = DAILY_VOCABULARY) {
  const known = knownTerms(vocabulary);
  const scored = new Map();

  function consider(token, score, fromHeadline) {
    if (!token || known.has(token) || STOPWORDS.has(token)) return;
    const current = scored.get(token) || {
      slug: token,
      label: token,
      score: 0,
      headline: false,
    };
    current.score += score;
    current.headline = current.headline || fromHeadline;
    scored.set(token, current);
  }

  for (const token of contentTokens(item?.headline)) {
    consider(token, 4 + (MEDICAL_SUFFIX.test(token) ? 5 : 0), true);
  }
  for (const token of contentTokens(item?.summary)) {
    consider(token, 1 + (MEDICAL_SUFFIX.test(token) ? 5 : 0), false);
  }

  const ranked = [...scored.values()].sort((a, b) =>
    b.score - a.score || Number(b.headline) - Number(a.headline) || a.slug.localeCompare(b.slug));
  if (ranked.length) {
    const winner = ranked[0];
    return { slug: winner.slug, label: winner.label };
  }

  const fallback = contentTokens(`${item?.headline || ''} topic`).find((token) => !known.has(token));
  return { slug: fallback || 'topic', label: fallback || 'topic' };
}

export function annotateRoundups(roundups, vocabulary = DAILY_VOCABULARY) {
  return (roundups || []).map((roundup) => ({
    ...roundup,
    items: (roundup.items || []).map((item) => {
      const tags = matchTags(item, vocabulary);
      return {
        ...item,
        tags,
        suggestion: tags.length ? null : suggestKeyword(item, vocabulary),
      };
    }),
  }));
}

export function buildSuggestedTagNotice({ label, slug, headline, date }) {
  return {
    channel: 'email',
    status: 'stubbed',
    sent: false,
    to: 'Josh',
    subject: `Suggested daily-news keyword: ${label}`,
    body: [
      'A daily roundup item matched none of the vocabulary keywords.',
      `Suggested keyword: ${label} (${slug}).`,
      headline ? `Item: ${headline}` : '',
      date ? `Issue: ${date}` : '',
      'Approve it on Suggested tags to add it in this browser.',
      'No email was sent.',
    ].filter(Boolean).join('\n'),
  };
}

// Stubbed on purpose. `sender` is accepted so tests can prove it is never called.
export function dispatchSuggestedTagNotice(notice, sender) {
  void sender;
  return { ...notice, status: 'stubbed', sent: false };
}

export function buildSuggestionQueue(roundups, decisions = EMPTY_TAG_DECISIONS) {
  const hidden = new Set([
    ...(decisions?.dismissed || []),
    ...(decisions?.approved || []).map((entry) => entry.slug),
  ]);
  const grouped = new Map();
  for (const roundup of roundups || []) {
    for (const item of roundup.items || []) {
      if (item.tags?.length) continue;
      const suggestion = item.suggestion;
      if (!suggestion?.slug || hidden.has(suggestion.slug)) continue;
      const current = grouped.get(suggestion.slug) || {
        slug: suggestion.slug,
        label: suggestion.label,
        items: [],
      };
      current.items.push({
        date: roundup.date,
        headline: item.headline,
        url: item.url,
      });
      grouped.set(suggestion.slug, current);
    }
  }
  return [...grouped.values()].map((entry) => ({
    ...entry,
    notice: dispatchSuggestedTagNotice(buildSuggestedTagNotice({
      label: entry.label,
      slug: entry.slug,
      headline: entry.items[0]?.headline,
      date: entry.items[0]?.date,
    })),
  }));
}

export function applyTagDecision(decisions, action) {
  const approved = [...(decisions?.approved || [])];
  let dismissed = [...(decisions?.dismissed || [])];
  const slug = String(action?.slug || '').trim().toLowerCase();
  if (!slug) return { approved, dismissed };

  if (action.type === 'approve') {
    dismissed = dismissed.filter((entry) => entry !== slug);
    if (!approved.some((entry) => entry.slug === slug)) {
      const label = String(action.label || slug).trim() || slug;
      approved.push({ slug, label, patterns: [label] });
    }
  } else if (action.type === 'dismiss') {
    const nextApproved = approved.filter((entry) => entry.slug !== slug);
    if (!dismissed.includes(slug)) dismissed.push(slug);
    return { approved: nextApproved, dismissed };
  }
  return { approved, dismissed };
}

export function readTagDecisions(storage) {
  if (!storage?.getItem) return { ...EMPTY_TAG_DECISIONS, approved: [], dismissed: [] };
  try {
    const parsed = JSON.parse(storage.getItem(TAG_DECISION_STORAGE_KEY) || '');
    return {
      approved: Array.isArray(parsed?.approved) ? parsed.approved : [],
      dismissed: Array.isArray(parsed?.dismissed) ? parsed.dismissed : [],
    };
  } catch {
    return { approved: [], dismissed: [] };
  }
}

export function writeTagDecisions(storage, decisions) {
  storage.setItem(TAG_DECISION_STORAGE_KEY, JSON.stringify({
    approved: decisions?.approved || [],
    dismissed: decisions?.dismissed || [],
  }));
}

export function dailyNewsTitle(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const label = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return `Daily News \u2013 ${label} | SAMPA`;
}

export function dailyCanonicalUrl(isoDate, origin = PRODUCTION_ORIGIN) {
  const base = String(origin || PRODUCTION_ORIGIN).replace(/\/$/, '');
  return `${base}/news/daily/${isoDate}`;
}

export function dailyPageRobots(status) {
  return status === 'not-found' ? 'noindex' : null;
}

export function resolveDailyDate(date, roundups) {
  if (date == null || date === '') {
    return { status: 'latest', roundup: roundups?.[0] || null };
  }
  if (RESERVED_DATE_SLUGS.has(date) || !isRealIsoDate(date)) {
    return { status: 'not-found', roundup: null };
  }
  const roundup = (roundups || []).find((entry) => entry.date === date) || null;
  if (!roundup) return { status: 'not-found', roundup: null };
  return { status: 'ok', roundup };
}

export function monthKey(isoDate) {
  return String(isoDate || '').slice(0, 7);
}

export function monthLabel(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function monthIndex(roundups) {
  const index = {};
  for (const roundup of roundups || []) {
    const key = monthKey(roundup.date);
    if (!key) continue;
    if (!index[key]) index[key] = [];
    index[key].push(roundup.date);
  }
  return index;
}

export function withMonthHeadings(items) {
  const rows = [];
  let previous = null;
  for (const issue of items || []) {
    const key = monthKey(issue.date);
    if (key !== previous) {
      rows.push({ type: 'month', key, label: monthLabel(issue.date) });
      previous = key;
    }
    rows.push({ type: 'issue', key: issue.date, issue });
  }
  return rows;
}

export function visibleArchive(roundups, shown, pageSize = ARCHIVE_PAGE_SIZE) {
  const total = roundups?.length || 0;
  const size = Math.max(1, pageSize);
  const count = Math.max(0, Math.min(total, shown));
  const items = (roundups || []).slice(0, count);
  return {
    items,
    shown: items.length,
    total,
    pageSize: size,
    hasMore: count < total,
    nextShown: Math.min(total, count + size),
  };
}

export function archivePage(roundups, page = 1, pageSize = ARCHIVE_PAGE_SIZE) {
  const size = Math.max(1, pageSize);
  const index = Math.max(1, page);
  const start = (index - 1) * size;
  const items = (roundups || []).slice(start, start + size);
  const total = roundups?.length || 0;
  return {
    items,
    page: index,
    pageSize: size,
    total,
    pageCount: Math.max(1, Math.ceil(total / size) || 1),
    hasMore: start + size < total,
  };
}

export function dailySitemapPaths(roundups) {
  const dates = [];
  const seen = new Set();
  for (const roundup of roundups || []) {
    if (!roundup?.date || seen.has(roundup.date)) continue;
    seen.add(roundup.date);
    dates.push(roundup.date);
  }
  return [
    '/',
    '/news',
    '/news/daily',
    '/news/daily/archive',
    ...dates.map((date) => `/news/daily/${date}`),
  ];
}

export function vocabularyEntry(slug, vocabulary = DAILY_VOCABULARY) {
  return vocabulary.find((entry) => entry.slug === slug) || null;
}
