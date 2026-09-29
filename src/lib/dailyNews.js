import { collectRoundups, formatRoundupDate } from './dailyNewsLoad.js';

const modules = import.meta.glob('/content/daily-news/*.json', { eager: true });

export const roundups = collectRoundups(modules);

export function roundupByDate(date) {
  return roundups.find((roundup) => roundup.date === date) || null;
}

export { formatRoundupDate };
