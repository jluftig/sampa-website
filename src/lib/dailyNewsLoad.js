const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ITEM_FIELDS = ['headline', 'outlet', 'date', 'summary', 'url'];

export function isRealIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function dateFromPath(path) {
  const base = String(path).split('/').pop() || '';
  return base.replace(/\.json$/i, '');
}

function payloadOf(mod) {
  if (mod && typeof mod === 'object' && mod.default && typeof mod.default === 'object') {
    return mod.default;
  }
  return mod;
}

function textField(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseItem(item) {
  if (!item || typeof item !== 'object') return null;
  const parsed = {};
  for (const field of ITEM_FIELDS) {
    const value = textField(item[field]);
    if (!value) return null;
    parsed[field] = value;
  }
  if (!parsed.url.startsWith('https://')) return null;
  return parsed;
}

export function roundupFromEntry(path, mod) {
  const filenameDate = dateFromPath(path);
  if (!isRealIsoDate(filenameDate)) {
    return { ok: false, reason: 'filename is not YYYY-MM-DD' };
  }
  const data = payloadOf(mod);
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'file is not an object' };
  }
  if (data.date !== filenameDate) {
    return { ok: false, reason: 'date does not match filename' };
  }
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 7) {
    return { ok: false, reason: 'items must be an array of 1 to 7' };
  }
  const items = [];
  for (const item of data.items) {
    const parsed = parseItem(item);
    if (!parsed) {
      return { ok: false, reason: 'an item is missing headline, outlet, date, summary, or an https URL' };
    }
    items.push(parsed);
  }
  const title = textField(data.title) || 'Addiction Daily Roundup';
  const featureResult = parseFeature(data.feature);
  if (!featureResult.ok) {
    return {
      ok: true,
      roundup: { date: filenameDate, title, items, feature: null },
      warning: featureResult.reason,
    };
  }
  return {
    ok: true,
    roundup: { date: filenameDate, title, items, feature: featureResult.feature },
  };
}

function parseFeature(feature) {
  if (feature == null) return { ok: true, feature: null };
  if (!feature || typeof feature !== 'object' || Array.isArray(feature)) {
    return { ok: false, reason: 'feature must be an object with title, teaser, href, and byline' };
  }
  const title = textField(feature.title);
  const teaser = textField(feature.teaser);
  const href = textField(feature.href);
  const byline = textField(feature.byline);
  if (!title || !teaser || !href || !byline) {
    return { ok: false, reason: 'feature needs title, teaser, href, and byline' };
  }
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('..')) {
    return { ok: false, reason: 'feature href must be a site path' };
  }
  return { ok: true, feature: { title, teaser, href, byline } };
}

export function collectRoundups(modules, warn = console.warn) {
  const roundups = [];
  for (const [path, mod] of Object.entries(modules || {})) {
    const result = roundupFromEntry(path, mod);
    if (!result.ok) {
      warn(`daily-news: skipping ${path}: ${result.reason}`);
      continue;
    }
    if (result.warning) warn(`daily-news: ${path}: ${result.warning}`);
    roundups.push(result.roundup);
  }
  roundups.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return roundups;
}

export function formatRoundupDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
