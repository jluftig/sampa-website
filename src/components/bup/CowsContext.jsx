import React, { createContext, useCallback, useContext, useState } from 'react';
import { scoreCows } from '../../lib/bup/cows';
import { readCowsEntries, addCowsEntry, clearCowsEntries } from '../../lib/bup/cowsSession';
import { logToolEvent } from '../../lib/toolAnalytics';

// Shares the recorded COWS series across every bup-tool page (chip, chooser
// hint, reassess hints, EHR summaries) so recording or clearing a score
// re-renders them all. Backed by sessionStorage — per tab, per patient.
const CowsContext = createContext(null);

export function CowsProvider({ children }) {
  const [entries, setEntries] = useState(readCowsEntries);

  const record = useCallback((selections) => {
    const result = scoreCows(selections);
    const entry = {
      takenAt: Date.now(),
      total: result.total,
      band: result.band.key,
      objectiveCount: result.objectiveCount,
      selections,
    };
    setEntries(addCowsEntry(entry));
    logToolEvent({
      event: 'cows_scored',
      answers: { total: result.total, objectiveCount: result.objectiveCount },
    });
    return entry;
  }, []);

  const clear = useCallback(() => setEntries(clearCowsEntries()), []);

  return (
    <CowsContext.Provider
      value={{ entries, latest: entries[entries.length - 1] ?? null, record, clear }}
    >
      {children}
    </CowsContext.Provider>
  );
}

// Null-safe: components render sensibly even if mounted outside the provider.
export function useCows() {
  return useContext(CowsContext) ?? { entries: [], latest: null, record: () => null, clear: () => {} };
}
