// Per-tab persistence for the chooser's in-progress answers, so leaving the
// chooser (e.g., to score COWS) and coming back restores where you were.
// sessionStorage on purpose — same "clean tab = clean patient" rule as the
// recorded COWS series (cowsSession.js); "Start over" clears it.
const KEY = 'sampa:bup:chooser';
let inMemory = {};

export function readChooserAnswers() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return inMemory;
  }
}

export function writeChooserAnswers(answers) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    inMemory = answers;
  }
}

export function clearChooserAnswers() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  inMemory = {};
}
