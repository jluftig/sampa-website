// Curated practice-setting vocabulary for member directory profiles.
// Stored as slug arrays on profiles.organizations[].practice_settings.
// Soft tint classes (Tailwind) match news keyword pill shell; mobile maps hex separately.
// Keep this module DOM-free — imported as sampa-shared/practiceSettings from mobile.

export const PRACTICE_SETTINGS = [
  { slug: 'ed', label: 'ED', chipClass: 'bg-rose-500/10 text-rose-800' },
  { slug: 'bridge', label: 'Bridge clinic', chipClass: 'bg-orange-500/10 text-orange-800' },
  { slug: 'community_clinic', label: 'Community clinic', chipClass: 'bg-primary/10 text-primary-text' },
  { slug: 'fqhc', label: 'FQHC', chipClass: 'bg-teal-700/10 text-teal-900' },
  { slug: 'otp', label: 'OTP', chipClass: 'bg-amber-500/10 text-amber-800' },
  { slug: 'street_medicine', label: 'Street medicine', chipClass: 'bg-sky-600/10 text-sky-900' },
  {
    slug: 'mobile_integrated_health',
    label: 'Mobile integrated health',
    chipClass: 'bg-violet-500/10 text-violet-800',
  },
  { slug: 'telehealth', label: 'Telehealth', chipClass: 'bg-cyan-500/10 text-cyan-800' },
  { slug: 'hospital', label: 'Hospital', chipClass: 'bg-slate-500/10 text-slate-700' },
  {
    slug: 'private_practice',
    label: 'Private practice',
    chipClass: 'bg-purple-500/10 text-purple-800',
  },
  { slug: 'residential', label: 'Residential', chipClass: 'bg-indigo-500/10 text-indigo-800' },
  { slug: 'corrections', label: 'Corrections', chipClass: 'bg-red-800/10 text-red-900' },
  { slug: 'academic', label: 'Academic', chipClass: 'bg-yellow-600/10 text-yellow-900' },
  { slug: 'urban', label: 'Urban', chipClass: 'bg-blue-500/10 text-blue-800' },
  { slug: 'rural', label: 'Rural', chipClass: 'bg-lime-600/10 text-lime-900' },
  { slug: 'va', label: 'VA', chipClass: 'bg-blue-900/10 text-blue-950' },
  { slug: 'other', label: 'Other', chipClass: 'bg-slate-400/15 text-slate-600' },
];

const BY_SLUG = Object.fromEntries(PRACTICE_SETTINGS.map((s) => [s.slug, s]));
const SLUG_ORDER = PRACTICE_SETTINGS.map((s) => s.slug);
const SLUG_SET = new Set(SLUG_ORDER);

export function isPracticeSettingSlug(slug) {
  return SLUG_SET.has(slug);
}

export function formatPracticeSettingLabel(slug) {
  return BY_SLUG[slug]?.label || slug;
}

export function practiceSettingChipClass(slug) {
  return BY_SLUG[slug]?.chipClass || 'bg-slate-400/15 text-slate-600';
}

/** Validate + dedupe + preserve enum order. */
export function sanitizePracticeSettingSlugs(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const slug of SLUG_ORDER) {
    if (raw.includes(slug) && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/** Human-readable join for denorm CSV / legacy practice_setting column. */
export function formatPracticeSettingLabels(slugs) {
  const clean = sanitizePracticeSettingSlugs(slugs);
  if (!clean.length) return null;
  return clean.map(formatPracticeSettingLabel).join(', ');
}

/**
 * Ordered unique slugs across a person's organizations (and legacy single
 * practice_setting string only when no structured slugs exist — callers that
 * want chips-only should check length of structured first).
 */
export function collectPracticeSettings(personOrOrgs) {
  const orgs = Array.isArray(personOrOrgs)
    ? personOrOrgs
    : personOrOrgs?.organizations;
  const seen = new Set();
  if (Array.isArray(orgs)) {
    for (const o of orgs) {
      for (const slug of sanitizePracticeSettingSlugs(o?.practice_settings)) {
        seen.add(slug);
      }
    }
  }
  return SLUG_ORDER.filter((s) => seen.has(s));
}

/** Hex tints for React Native (mirrors Tailwind soft fills). */
export const PRACTICE_SETTING_MOBILE_COLORS = {
  ed: { bg: '#FFF1F2', text: '#9F1239' },
  bridge: { bg: '#FFF7ED', text: '#9A3412' },
  community_clinic: { bg: '#E6F5F3', text: '#0F766E' },
  fqhc: { bg: '#F0FDFA', text: '#134E4A' },
  otp: { bg: '#FFFBEB', text: '#92400E' },
  street_medicine: { bg: '#F0F9FF', text: '#0C4A6E' },
  mobile_integrated_health: { bg: '#F5F3FF', text: '#5B21B6' },
  telehealth: { bg: '#ECFEFF', text: '#155E75' },
  hospital: { bg: '#F8FAFC', text: '#334155' },
  private_practice: { bg: '#FAF5FF', text: '#6B21A8' },
  residential: { bg: '#EEF2FF', text: '#3730A3' },
  corrections: { bg: '#FEF2F2', text: '#7F1D1D' },
  academic: { bg: '#FEFCE8', text: '#713F12' },
  urban: { bg: '#EFF6FF', text: '#1E40AF' },
  rural: { bg: '#F7FEE7', text: '#3F6212' },
  va: { bg: '#EFF6FF', text: '#172554' },
  other: { bg: '#F1F5F9', text: '#475569' },
};

export function practiceSettingMobileColors(slug) {
  return PRACTICE_SETTING_MOBILE_COLORS[slug] || PRACTICE_SETTING_MOBILE_COLORS.other;
}
