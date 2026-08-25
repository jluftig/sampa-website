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
    // Eligibility first on home + /join cards — AAPA members were skipping it.
    lede: 'AAPA members start here',
    desc: 'NCCPA certification + AAPA member. Optional Patron add-on puts a Patron badge on your directory listing.',
    highlight: true,
    prices: { 1: 50, 2: 90, 3: 125 },
  },
  {
    // Stripe / profiles key stays `sustaining`. Public name is the eligibility
    // label so AAPA members do not read this as extra support.
    key: 'sustaining',
    name: 'Certified PA (not AAPA)',
    secondaryLabel: 'Sustaining rate',
    desc: 'The NCCPA-certified rate if you are not an AAPA member. AAPA members belong on Fellow.',
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

// Optional Patron add-on on /join — not a membership tier. Server charges the
// same math (api/_lib/tiers.js patronDollars). +$25 per year of the selected
// term (Fellow $50 + Patron $25 = $75). Legacy lifetime
// is +$25 once.
// Directory-badge reward — not extra membership benefits, never a membership_tier.
export const PATRON_ADDON_BLURB =
  'adds a Patron badge on your directory listing. No extra membership benefits beyond the badge.';

export const PATRON_DOLLARS_PER_YEAR = 25;

export function patronDollars(duration) {
  if (duration === 'lifetime') return PATRON_DOLLARS_PER_YEAR;
  const years = Number(duration);
  if (!Number.isFinite(years) || years < 1) return PATRON_DOLLARS_PER_YEAR;
  return PATRON_DOLLARS_PER_YEAR * years;
}

// PA-path tiers ask the honor-system AAPA question on /join. Student / Pre-PA /
// Associate skip it. Yes → suggest Fellow; No → suggest Certified PA (sustaining).
export const PA_PATH_TIER_KEYS = ['fellow', 'sustaining', 'legacy'];

export function isPaPathTier(key) {
  return PA_PATH_TIER_KEYS.includes(key);
}

export function suggestedTierForAapa(isAapaMember) {
  return isAapaMember ? 'fellow' : 'sustaining';
}

export function parseAapaParam(value) {
  if (value === '1' || value === 'yes' || value === 'true') return true;
  if (value === '0' || value === 'no' || value === 'false') return false;
  return null;
}

// Employer-invoice helpers (T38). Duration comes from /join as 1 | 2 | 3 | 'lifetime'.
export function parseDurationParam(raw, tier) {
  if (!tier) return null;
  const allowed = durationsForTier(tier);
  if (raw === 'lifetime' || raw === 'Lifetime') {
    return allowed.includes('lifetime') ? 'lifetime' : null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return allowed.includes(n) ? n : null;
}

export function tierAmountDollars(tier, duration) {
  if (!tier) return null;
  if (duration === 'lifetime') {
    return Number.isFinite(tier.lifetime) ? tier.lifetime : null;
  }
  const amount = tier.prices?.[duration];
  return Number.isFinite(amount) ? amount : null;
}

export function invoiceTotalDollars(tier, duration, wantPatron) {
  const base = tierAmountDollars(tier, duration);
  if (base == null) return null;
  return base + (wantPatron ? patronDollars(duration) : 0);
}
