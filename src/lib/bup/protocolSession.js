// Per-tab persistence for a protocol flow's in-progress answer sequence, keyed
// by protocol slug, so leaving a protocol page (e.g., to score COWS) and coming
// back restores where you were. Same "clean tab = clean patient" rule as the
// chooser (chooserSession.js) and COWS series; "Start over" clears one protocol.
// Checklist ticks (discharge bundles, etc.) live in a sibling key so they can
// update without rewriting the answer sequence.
const keyFor = (slug) => `sampa:bup:protocol:${slug}`;
const checksKeyFor = (slug) => `sampa:bup:protocol-checks:${slug}`;
const inMemory = {};
const inMemoryChecks = {};

export function readProtocolAnswers(slug) {
  if (!slug) return [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(keyFor(slug)));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return inMemory[slug] ?? [];
  }
}

export function writeProtocolAnswers(slug, answerSeq) {
  if (!slug) return;
  try {
    sessionStorage.setItem(keyFor(slug), JSON.stringify(answerSeq));
  } catch {
    inMemory[slug] = answerSeq;
  }
}

// Map of stepId → sorted unique item indices that are checked.
export function readProtocolChecks(slug) {
  if (!slug) return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(checksKeyFor(slug)));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return inMemoryChecks[slug] ?? {};
  }
}

export function writeProtocolChecks(slug, checks) {
  if (!slug) return;
  try {
    sessionStorage.setItem(checksKeyFor(slug), JSON.stringify(checks));
  } catch {
    inMemoryChecks[slug] = checks;
  }
}

export function clearProtocolAnswers(slug) {
  if (!slug) return;
  try {
    sessionStorage.removeItem(keyFor(slug));
    sessionStorage.removeItem(checksKeyFor(slug));
  } catch {
    /* ignore */
  }
  delete inMemory[slug];
  delete inMemoryChecks[slug];
}
