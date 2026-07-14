// Navigation helpers for the COWS calculator: remember where the clinician
// opened it from (protocol page or chooser) so "Back" returns them there
// instead of always dumping them on the protocol chooser.
// Pure data / sessionStorage — no React.

import { PROTOCOLS } from './protocols';

export const COWS_PATH = '/tools/bup/cows';
export const CHOOSER_PATH = '/tools/bup';

const RETURN_STORAGE_KEY = 'sampa.bup.cowsReturnTo';

// Short labels for the back CTA (full protocol titles are long for a button).
const SLUG_BACK_LABEL = {
  'quick-start': 'Back to Quick Start',
  'low-dose': 'Back to Low Dose',
  'micro-macro': 'Back to 1-Day Micro–Macro',
  dti: 'Back to DTI',
  'od-reversal': 'Back to OD Reversal',
  'self-start': 'Back to Self-Start',
};

function normalizeBupPath(path) {
  if (typeof path !== 'string') return null;
  // Only allow in-tool paths — never external or parent escapes.
  if (!path.startsWith('/tools/bup')) return null;
  if (path.includes('://') || path.includes('..')) return null;
  // Strip query/hash; trailing slash → canonical.
  const bare = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/tools/bup';
  if (!bare.startsWith('/tools/bup')) return null;
  // Don't return-to the calculator itself.
  if (bare === COWS_PATH) return null;
  return bare;
}

/** React Router Link props for opening the calculator from a bup-tool page. */
export function cowsLinkProps(fromPathname) {
  const returnTo = normalizeBupPath(fromPathname) || CHOOSER_PATH;
  return {
    to: COWS_PATH,
    state: { returnTo },
    onClick: () => {
      try {
        sessionStorage.setItem(RETURN_STORAGE_KEY, returnTo);
      } catch {
        /* private mode / quota — location.state alone still works for SPA hops */
      }
    },
  };
}

/**
 * Resolve where "Back" should go on the COWS page.
 * Prefer live location.state (this navigation), then sessionStorage (refresh),
 * then the protocol chooser.
 */
export function readCowsReturnTo(locationState) {
  const fromState = normalizeBupPath(locationState?.returnTo);
  if (fromState) {
    try {
      sessionStorage.setItem(RETURN_STORAGE_KEY, fromState);
    } catch {
      /* ignore */
    }
    return fromState;
  }
  try {
    const stored = normalizeBupPath(sessionStorage.getItem(RETURN_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return CHOOSER_PATH;
}

/** Button/link label for the return target. */
export function cowsReturnLabel(returnTo) {
  const path = normalizeBupPath(returnTo) || CHOOSER_PATH;
  if (path === CHOOSER_PATH) return 'Back to protocol chooser';

  const slug = path.slice('/tools/bup/'.length);
  if (SLUG_BACK_LABEL[slug]) return SLUG_BACK_LABEL[slug];

  const protocol = PROTOCOLS.find((p) => p.slug === slug);
  if (protocol?.title) return `Back to ${protocol.title}`;

  return 'Back';
}
