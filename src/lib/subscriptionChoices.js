export const SUBSCRIPTION_CHOICES = [
  { key: 'daily', label: 'SAMPA Daily News Roundup' },
  { key: 'weekly', label: 'SAMPA Weekly Newsletter' },
  { key: 'topic', label: 'SAMPA Emerging Practice Monthly' },
];

export function signupPreset(pathname) {
  if (pathname.startsWith('/news/topic')) return 'topic';
  if (pathname === '/news' || pathname.startsWith('/news/daily')) return 'daily';
  return 'weekly';
}

export function selectedLists(preset) {
  return {
    daily: preset === 'daily',
    weekly: preset === 'weekly',
    topic: preset === 'topic',
  };
}

export function checkedOnly(selected) {
  const lists = {};
  for (const choice of SUBSCRIPTION_CHOICES) {
    if (selected?.[choice.key] === true) lists[choice.key] = true;
  }
  return lists;
}
