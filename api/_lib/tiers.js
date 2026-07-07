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

export function priceIdFor(tier, duration) {
  const allowed = TIER_DURATIONS[tier];
  if (!allowed || !allowed.includes(duration)) return null;
  const suffix = duration === 'lifetime' ? 'LIFETIME' : `${duration}Y`;
  return process.env[`STRIPE_PRICE_${tier.toUpperCase()}_${suffix}`] || null;
}
