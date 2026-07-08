// Per-tab storage for recorded COWS scores. sessionStorage on purpose:
// scores survive paging around the tool and reloads, and vanish when the tab
// closes — a clean tab is a clean patient. Nothing identifies the patient.
const KEY = 'sampa:bup:cows';
let inMemory = [];

export function readCowsEntries() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return inMemory;
  }
}

// entry: { takenAt, total, band (key), objectiveCount, selections }
export function addCowsEntry(entry) {
  const next = [...readCowsEntries(), entry];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    inMemory = next;
  }
  return next;
}

export function clearCowsEntries() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  inMemory = [];
  return [];
}
