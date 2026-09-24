export const EDUCATION_PLACEHOLDERS = [
  { id: 'cme', label: 'CME', note: 'Not connected' },
  { id: 'jobs', label: 'Job board', note: 'Not connected' },
];

export function educationCount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function shapeEducationImpact({ publishedNews, weeklyIssues } = {}) {
  return {
    news: educationCount(publishedNews),
    weeklyIssues: educationCount(weeklyIssues),
    placeholders: EDUCATION_PLACEHOLDERS.map((row) => ({ ...row })),
  };
}
