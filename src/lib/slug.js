// Turn a title into a URL-friendly slug, e.g. "Buprenorphine Access!" -> "buprenorphine-access".
export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop punctuation
    .replace(/\s+/g, '-')          // spaces -> dashes
    .replace(/-+/g, '-')           // collapse repeats
    .replace(/^-|-$/g, '');        // trim leading/trailing dashes
}

// Auto-generated slug with a year-month suffix, e.g. "buprenorphine-access-2026-07".
// Returns '' when the title produces no slug (so we don't get a bare "-2026-07").
export function slugifyWithDate(str, date = new Date()) {
  const base = slugify(str);
  if (!base) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${base}-${y}-${m}`;
}
