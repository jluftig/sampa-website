// Profile organizations: members may list one or more employers, each with
// name, role (title at that org), practice settings, city, state, and optional
// website. Stored as profiles.organizations (jsonb array).
//
// Personal profile fields are separate: full_name, credentials, npi, state
// (profiles.state — home/membership state; often pre-filled from member_import).
// Denormalized org columns for admin roster/CSV:
//   organization, city, practice_setting  ← from organizations[0]
// profiles.state is NEVER overwritten from an org entry.
// Note: org.role is the job title at that employer — not profiles.role (admin flag).

import {
  formatPracticeSettingLabels,
  sanitizePracticeSettingSlugs,
} from './practiceSettings.js';

export function emptyOrganization() {
  return {
    name: '',
    role: '',
    city: '',
    state: '',
    practice_settings: [],
    practice_setting_other: '',
    practice_setting: '',
    website: '',
  };
}

/** Normalize a typed website to an absolute URL (adds https:// if bare). */
export function normalizeWebsite(raw) {
  const s = (raw || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  // Reject anything that looks like a scheme we don't want (javascript:, data:, …).
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  return `https://${s}`;
}

/** Host-ish label for display links (drops protocol and trailing slash). */
export function formatWebsiteLabel(url) {
  if (!url) return '';
  try {
    const u = new URL(normalizeWebsite(url) || url);
    return (u.host + u.pathname).replace(/\/$/, '') || u.host;
  } catch {
    return String(url).replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

function normalizeOrgRow(o) {
  const settings = sanitizePracticeSettingSlugs(o?.practice_settings);
  const other = settings.includes('other')
    ? (o?.practice_setting_other || '').trim()
    : '';
  return {
    name: o?.name || '',
    role: o?.role || '',
    city: o?.city || '',
    state: o?.state || '',
    practice_settings: settings,
    practice_setting_other: other,
    // Legacy free-text retained for display fallback until member re-saves.
    practice_setting: o?.practice_setting || '',
    website: o?.website || '',
  };
}

/** Normalize a profile (or directory row) into a form-ready org list. Always ≥1. */
export function organizationsFromProfile(profile) {
  const raw = profile?.organizations;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((o) => normalizeOrgRow(o));
  }
  // Legacy single-org columns. Do NOT copy personal profiles.state into the org
  // row — that field is the member's home/membership state.
  if (profile?.organization || profile?.city || profile?.practice_setting) {
    return [
      normalizeOrgRow({
        name: profile.organization || '',
        role: '',
        city: profile.city || '',
        state: '',
        practice_settings: [],
        practice_setting_other: '',
        practice_setting: profile.practice_setting || '',
        website: '',
      }),
    ];
  }
  return [emptyOrganization()];
}

/** Trim and drop fully-empty entries. Safe to persist as jsonb. */
export function sanitizeOrganizations(list) {
  return (list || [])
    .map((o) => {
      const practice_settings = sanitizePracticeSettingSlugs(o.practice_settings);
      const practice_setting_other = practice_settings.includes('other')
        ? (o.practice_setting_other || '').trim() || null
        : null;
      // Prefer structured labels for denorm/CSV; keep legacy string if no slugs yet.
      const fromSlugs = formatPracticeSettingLabels(practice_settings);
      const practice_setting =
        fromSlugs || (o.practice_setting || '').trim() || null;

      return {
        name: (o.name || '').trim(),
        role: (o.role || '').trim() || null,
        city: (o.city || '').trim() || null,
        state: (o.state || '').trim() || null,
        practice_settings,
        practice_setting_other,
        practice_setting,
        website: normalizeWebsite(o.website),
      };
    })
    .filter(
      (o) =>
        o.name ||
        o.role ||
        o.city ||
        o.state ||
        o.practice_settings.length ||
        o.practice_setting ||
        o.website
    )
    .map((o) => ({
      name: o.name || '',
      role: o.role,
      city: o.city,
      state: o.state,
      practice_settings: o.practice_settings,
      practice_setting_other: o.practice_setting_other,
      practice_setting: o.practice_setting,
      website: o.website,
    }));
}

/**
 * Denormalized primary org columns for admin roster/CSV.
 * Does not include personal state (profiles.state).
 */
export function primaryOrgFields(organizations) {
  const primary = organizations[0] || {};
  const fromSlugs = formatPracticeSettingLabels(primary.practice_settings);
  return {
    organization: primary.name || null,
    city: primary.city || null,
    practice_setting: fromSlugs || primary.practice_setting || null,
  };
}

/** "City, State" or whichever half is present. */
export function formatOrgLocation(org) {
  if (!org) return '';
  return [org.city, org.state].filter(Boolean).join(', ');
}

/**
 * Orgs for display from a directory/profile row (handles legacy-only rows
 * when the RPC hasn't been recreated yet).
 */
export function displayOrganizations(person) {
  const orgs = organizationsFromProfile(person).filter(
    (o) =>
      o.name ||
      o.role ||
      o.city ||
      o.state ||
      (o.practice_settings && o.practice_settings.length) ||
      o.practice_setting ||
      o.website
  );
  return orgs;
}

/** Legacy free-text line when no structured chips exist yet. */
export function legacyPracticeSettingText(person) {
  const orgs = displayOrganizations(person);
  for (const o of orgs) {
    if (o.practice_settings?.length) return '';
  }
  for (const o of orgs) {
    if (o.practice_setting) return o.practice_setting;
  }
  return (person?.practice_setting || '').trim();
}
