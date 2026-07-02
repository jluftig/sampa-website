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
