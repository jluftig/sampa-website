// Membership tier keys and allowed term durations — must match
// src/lib/membership.js (the client copy drives the UI; this copy is what
// actually authorizes a checkout, so never trust the client's duration).
//
// Each (tier, duration) maps to a Stripe Price id via env vars:
//   1/2/3-year terms -> recurring prices billed every N years
//     (Stripe: interval "year", interval_count N), e.g. STRIPE_PRICE_FELLOW_2Y
//   lifetime         -> one-time price, e.g. STRIPE_PRICE_LEGACY_LIFETIME
export const TIER_DURATIONS = {
  fellow: [1, 2, 3],
  sustaining: [1, 2, 3],
  associate: [1, 2, 3],
  legacy: [1, 2, 3, 'lifetime'],
  student: [1, 2],
  prepa: [1, 2],
};

// Published dues — must match src/lib/membership.js. Used on invoice-request
// staff email so the amount is not taken from the client.
export const TIER_PRICES = {
  fellow: { 1: 50, 2: 90, 3: 125 },
  sustaining: { 1: 75, 2: 135, 3: 185 },
  associate: { 1: 40, 2: 70, 3: 100 },
  legacy: { 1: 25, 2: 45, 3: 60, lifetime: 125 },
  student: { 1: 10, 2: 18 },
  prepa: { 1: 5, 2: 9 },
};

export const TIER_NAMES = {
  fellow: 'Fellow',
  sustaining: 'Sustaining Member',
  associate: 'Associate Member',
  legacy: 'Legacy Member',
  student: 'Student Member',
  prepa: 'Pre-PA Member',
};

export function publishedAmount(tier, duration) {
  const row = TIER_PRICES[tier];
  if (!row) return null;
  const amount = row[duration];
  return Number.isFinite(amount) ? amount : null;
}

export function priceIdFor(tier, duration) {
  const allowed = TIER_DURATIONS[tier];
  if (!allowed || !allowed.includes(duration)) return null;
  const suffix = duration === 'lifetime' ? 'LIFETIME' : `${duration}Y`;
  return process.env[`STRIPE_PRICE_${tier.toUpperCase()}_${suffix}`] || null;
}
