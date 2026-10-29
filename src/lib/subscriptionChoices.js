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
