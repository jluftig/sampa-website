// Per-tab persistence for a protocol flow's in-progress answer sequence, keyed
// by protocol slug, so leaving a protocol page (e.g., to score COWS) and coming
// back restores where you were. Same "clean tab = clean patient" rule as the
// chooser (chooserSession.js) and COWS series; "Start over" clears one protocol.
const keyFor = (slug) => `sampa:bup:protocol:${slug}`;
const inMemory = {};

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

export function clearProtocolAnswers(slug) {
  if (!slug) return;
  try {
    sessionStorage.removeItem(keyFor(slug));
  } catch {
    /* ignore */
  }
  delete inMemory[slug];
}
