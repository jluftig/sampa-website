// Profile organizations: members may list one or more employers, each with
// name, practice setting, city, and state. Stored as profiles.organizations
// (jsonb array).
//
// Personal profile fields are separate: full_name, credentials, npi, state
// (profiles.state — home/membership state; often pre-filled from member_import).
// Denormalized org columns for admin roster/CSV:
//   organization, city, practice_setting  ← from organizations[0]
// profiles.state is NEVER overwritten from an org entry.

export function emptyOrganization() {
  return { name: '', city: '', state: '', practice_setting: '' };
}

/** Normalize a profile (or directory row) into a form-ready org list. Always ≥1. */
export function organizationsFromProfile(profile) {
  const raw = profile?.organizations;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((o) => ({
      name: o?.name || '',
      city: o?.city || '',
      state: o?.state || '',
      practice_setting: o?.practice_setting || '',
    }));
  }
  // Legacy single-org columns. Do NOT copy personal profiles.state into the org
  // row — that field is the member's home/membership state.
  if (profile?.organization || profile?.city || profile?.practice_setting) {
    return [
      {
        name: profile.organization || '',
        city: profile.city || '',
        state: '',
        practice_setting: profile.practice_setting || '',
      },
    ];
  }
  return [emptyOrganization()];
}

/** Trim and drop fully-empty entries. Safe to persist as jsonb. */
export function sanitizeOrganizations(list) {
  return (list || [])
    .map((o) => ({
      name: (o.name || '').trim(),
      city: (o.city || '').trim() || null,
      state: (o.state || '').trim() || null,
      practice_setting: (o.practice_setting || '').trim() || null,
    }))
    .filter((o) => o.name || o.city || o.state || o.practice_setting)
    .map((o) => ({
      name: o.name || '',
      city: o.city,
      state: o.state,
      practice_setting: o.practice_setting,
    }));
}

/**
 * Denormalized primary org columns for admin roster/CSV.
 * Does not include personal state (profiles.state).
 */
export function primaryOrgFields(organizations) {
  const primary = organizations[0] || {};
  return {
    organization: primary.name || null,
    city: primary.city || null,
    practice_setting: primary.practice_setting || null,
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
    (o) => o.name || o.city || o.state || o.practice_setting
  );
  return orgs;
}
