// Single source of truth for membership tiers and pricing, per the board's
// "SAMPA Membership & Donor Tiers 2026" document. Shared by the homepage
// Membership section and the /join flow. `key` is what we store in
// profiles.membership_tier and what the checkout endpoint maps to a Stripe
// Price id (api/_lib/tiers.js) — keep tier keys AND duration grids in sync
// with api/_lib/tiers.js and the STRIPE_PRICE_* env vars.
//
// `prices` is keyed by term length in years; a missing duration means that
// tier can't buy it (Student/Pre-PA cap at 2 years). `lifetime` is a one-time
// payment (Legacy only). Multi-year terms are Stripe subscriptions billed
// every N years (auto-renewing), at 10–13% (2yr) / 17–20% (3yr) discounts.
export const MEMBERSHIP_TIERS = [
  {
    key: 'fellow',
    name: 'Fellow',
    desc: 'NCCPA certification + AAPA member',
    highlight: true,
    prices: { 1: 50, 2: 90, 3: 125 },
  },
  {
    key: 'sustaining',
    name: 'Sustaining Member',
    desc: 'NCCPA certification, not an AAPA member',
    prices: { 1: 75, 2: 135, 3: 185 },
  },
  {
    key: 'associate',
    name: 'Associate Member',
    desc: 'Non-PA, but wishes to support SAMPA',
    prices: { 1: 40, 2: 70, 3: 100 },
  },
  {
    key: 'legacy',
    name: 'Legacy Member',
    desc: 'Expired NCCPA certification and/or retired',
    prices: { 1: 25, 2: 45, 3: 60 },
    lifetime: 125,
  },
  {
    key: 'student',
    name: 'Student Member',
    desc: 'For currently enrolled PA students.',
    prices: { 1: 10, 2: 18 },
  },
  {
    key: 'prepa',
    name: 'Pre-PA Member',
    desc: 'For prospective students interested in the PA profession',
    prices: { 1: 5, 2: 9 },
  },
];

export function tierByKey(key) {
  return MEMBERSHIP_TIERS.find((t) => t.key === key) || null;
}

// "Save 10%" label math: compare the multi-year price to N annual payments.
export function savingsPercent(tier, years) {
  const multi = tier.prices[years];
  const annual = tier.prices[1];
  if (!multi || !annual || years < 2) return 0;
  return Math.round((1 - multi / (annual * years)) * 100);
}

// Durations a tier offers, in display order: [1, 2, 3?, 'lifetime'?]
export function durationsForTier(tier) {
  const years = Object.keys(tier.prices).map(Number).sort();
  return tier.lifetime ? [...years, 'lifetime'] : years;
}

export function durationLabel(duration) {
  if (duration === 'lifetime') return 'Lifetime';
  return duration === 1 ? '1 year' : `${duration} years`;
}
