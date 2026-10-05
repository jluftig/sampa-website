import { annotateRoundups } from './dailyNewsArchive.js';
import { collectRoundups, formatRoundupDate } from './dailyNewsLoad.js';

const modules = import.meta.glob('/content/daily-news/*.json', { eager: true });

export const roundupRecords = collectRoundups(modules);
export const roundups = annotateRoundups(roundupRecords);

export function roundupByDate(date) {
  return roundups.find((roundup) => roundup.date === date) || null;
}

export { formatRoundupDate };
