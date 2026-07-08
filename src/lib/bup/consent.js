// Per-device acceptance of the bup tool's clinician disclaimer.
// Bump the key suffix (v1 → v2) to re-gate everyone after a material copy change.
const KEY = 'sampa:bupTerms:v1';

export function hasAcceptedBupTerms() {
  try {
    return Boolean(JSON.parse(localStorage.getItem(KEY))?.acceptedAt);
  } catch {
    return false;
  }
}

export function acceptBupTerms() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ acceptedAt: Date.now() }));
  } catch {
    // Storage unavailable (private mode, quota) — the gate falls back to
    // React state for the session and simply re-asks next visit.
  }
}
