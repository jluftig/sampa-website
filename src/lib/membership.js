// Single source of truth for membership tiers, shared by the homepage
// Membership section and the /join flow. `key` is what we store in
// profiles.membership_tier and what the checkout endpoint maps to a Stripe
// Price id (api/_lib/tiers.js) — keep the three in sync.
export const MEMBERSHIP_TIERS = [
  { key: 'fellow',     name: 'Fellow',            price: '$50', desc: 'NCCPA certification + AAPA member', highlight: true },
  { key: 'sustaining', name: 'Sustaining Member', price: '$75', desc: 'NCCPA certification, not an AAPA member' },
  { key: 'associate',  name: 'Associate Member',  price: '$40', desc: 'Non-PA, but wishes to support SAMPA' },
  { key: 'legacy',     name: 'Legacy Member',     price: '$25', desc: 'Expired NCCPA certification and/or retired' },
  { key: 'student',    name: 'Student Member',    price: '$10', desc: 'For currently enrolled PA students.' },
  { key: 'prepa',      name: 'Pre-PA Member',     price: '$5',  desc: 'For prospective students interested in the PA profession' },
];

export function tierByKey(key) {
  return MEMBERSHIP_TIERS.find((t) => t.key === key) || null;
}
