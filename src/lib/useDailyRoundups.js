import { useEffect, useMemo, useState } from 'react';
import { roundupRecords } from './dailyNews';
import {
  annotateRoundups,
  readTagDecisions,
  vocabularyForDecisions,
} from './dailyNewsArchive';
import { DAILY_VOCABULARY } from './dailyNewsVocabulary';

export function useDailyRoundups() {
  const [vocabulary, setVocabulary] = useState(DAILY_VOCABULARY);

  useEffect(() => {
    const decisions = readTagDecisions(window.localStorage);
    if (!decisions.approved.length) return;
    setVocabulary(vocabularyForDecisions(decisions));
  }, []);

  return useMemo(
    () => annotateRoundups(roundupRecords, vocabulary),
    [vocabulary],
  );
}
