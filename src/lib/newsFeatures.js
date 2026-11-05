import { isRealIsoDate } from './dailyNewsLoad.js';

// One place to change the founders article title.
export const FOUNDERS_FEATURE_TITLE = 'Founders Feature: Jim Anderson and Shani Wilson';

export const FEATURE_TIME_ZONE = 'America/Los_Angeles';

const TITLE_BY_SLUG = {
  'founders-jim-anderson-shani-wilson': FOUNDERS_FEATURE_TITLE,
};

// Listing fields only. The essay body stays in content/features and is loaded
// on the article route after the publish day, so /news does not ship it early.
export const FEATURE_LISTINGS = [
  {
    slug: 'founders-jim-anderson-shani-wilson',
    title: FOUNDERS_FEATURE_TITLE,
    path: '/news/features/founders-jim-anderson-shani-wilson',
    publishedOn: '2026-11-10',
    byline: 'Kerith Hartmann, PA-C, Advocacy, Success, and Impact Officer, SAMPA',
    description:
      'When Jim Anderson started in SAMPA, formerly (and fondly) called SPAAM, it was little more than a spark of an idea.',
  },
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

function slugFromPath(path) {
  const base = String(path).split('/').pop() || '';
  return base.replace(/\.json$/i, '');
}

export function featurePath(slug) {
  return `/news/features/${slug}`;
}

export function pacificCalendarDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FEATURE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// Dev-only clock override. Production builds pass dev=false and ignore ?asOf=.
export function devAsOfDay(search = '', dev = false) {
  if (!dev) return null;
  const raw = String(search || '');
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  const value = params.get('asOf');
  return isRealIsoDate(value) ? value : null;
}

export function isFeatureVisible(feature, now = new Date(), asOfDay = null) {
  if (!feature || !isRealIsoDate(feature.publishedOn)) return false;
  const day = asOfDay || pacificCalendarDay(now);
  return day >= feature.publishedOn;
}

function parseReference(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const text = textField(entry.text);
  const url = textField(entry.url);
  if (!text || !url || !url.startsWith('https://')) return null;
  return { text, url };
}

export function featureFromEntry(path, mod) {
  const filenameSlug = slugFromPath(path);
  if (!SLUG.test(filenameSlug)) {
    return { ok: false, reason: 'filename is not a slug' };
  }
  const data = payloadOf(mod);
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'file is not an object' };
  }
  if (data.slug !== filenameSlug) {
    return { ok: false, reason: 'slug does not match filename' };
  }
  if (!isRealIsoDate(data.publishedOn)) {
    return { ok: false, reason: 'publishedOn is not YYYY-MM-DD' };
  }
  const byline = textField(data.byline);
  const description = textField(data.description);
  if (!byline || !description) {
    return { ok: false, reason: 'byline and description are required' };
  }
  if (!Array.isArray(data.paragraphs) || data.paragraphs.length < 1) {
    return { ok: false, reason: 'paragraphs must be a non-empty array' };
  }
  const paragraphs = [];
  for (const paragraph of data.paragraphs) {
    const value = textField(paragraph);
    if (!value) return { ok: false, reason: 'a paragraph is empty' };
    paragraphs.push(value);
  }
  if (!Array.isArray(data.signature) || data.signature.length < 1) {
    return { ok: false, reason: 'signature must be a non-empty array' };
  }
  const signature = [];
  for (const line of data.signature) {
    const value = textField(line);
    if (!value) return { ok: false, reason: 'a signature line is empty' };
    signature.push(value);
  }
  if (!Array.isArray(data.references) || data.references.length < 1) {
    return { ok: false, reason: 'references must be a non-empty array' };
  }
  const references = [];
  for (const entry of data.references) {
    const parsed = parseReference(entry);
    if (!parsed) return { ok: false, reason: 'a reference is missing text or an https URL' };
    references.push(parsed);
  }
  const title = TITLE_BY_SLUG[filenameSlug] || textField(data.title);
  if (!title) return { ok: false, reason: 'title is missing' };
  return {
    ok: true,
    feature: {
      slug: filenameSlug,
      title,
      path: featurePath(filenameSlug),
      publishedOn: data.publishedOn,
      byline,
      description,
      paragraphs,
      signature,
      references,
    },
  };
}

export function collectFeatures(modules, warn = console.warn) {
  const features = [];
  for (const [path, mod] of Object.entries(modules || {})) {
    const result = featureFromEntry(path, mod);
    if (!result.ok) {
      warn(`news-features: skipping ${path}: ${result.reason}`);
      continue;
    }
    features.push(result.feature);
  }
  features.sort((a, b) => (a.publishedOn < b.publishedOn ? 1 : a.publishedOn > b.publishedOn ? -1 : 0));
  return features;
}

export function visibleFeatures(features, now = new Date(), asOfDay = null) {
  return (features || []).filter((feature) => isFeatureVisible(feature, now, asOfDay));
}

export function featureBySlug(features, slug) {
  return (features || []).find((feature) => feature.slug === slug) || null;
}

// Dev screenshot fixture. The daily pipeline writes href without ?asOf=.
export function previewLeadFromFeature(feature) {
  if (!feature) return null;
  return {
    title: feature.title,
    teaser: feature.description,
    href: `${feature.path}?asOf=${feature.publishedOn}`,
    byline: feature.byline,
  };
}

export function devPreviewFeature(search = '', dev = false, sample = null) {
  if (!dev || !sample) return null;
  const raw = String(search || '');
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  return params.get('previewFeature') === '1' ? sample : null;
}

export function featureSitemapPaths(features, now = new Date()) {
  return visibleFeatures(features, now).map((feature) => feature.path);
}

export function featureSharePreview(modules, slug, now = new Date()) {
  if (!slug || !SLUG.test(slug)) return null;
  const feature = featureBySlug(collectFeatures(modules, () => {}), slug);
  if (!feature || !isFeatureVisible(feature, now)) return null;
  return {
    title: `${feature.title} | SAMPA`,
    description: feature.description,
    path: feature.path,
  };
}
