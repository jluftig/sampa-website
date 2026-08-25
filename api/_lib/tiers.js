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

// Optional Patron add-on — not a tier, never a required STRIPE_PRICE_* env.
// Keep in sync with src/lib/membership.js patronDollars.
// +$25 per year of the selected term; lifetime +$25 once.
export const PATRON_DOLLARS_PER_YEAR = 25;

export function patronDollars(duration) {
  if (duration === 'lifetime') return PATRON_DOLLARS_PER_YEAR;
  const years = Number(duration);
  if (!Number.isFinite(years) || years < 1) return PATRON_DOLLARS_PER_YEAR;
  return PATRON_DOLLARS_PER_YEAR * years;
}

export function patronLineItem(duration) {
  const dollars = patronDollars(duration);
  const isLifetime = duration === 'lifetime';
  const years = isLifetime ? 1 : Number(duration) || 1;
  return {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: dollars * 100,
      product_data: {
        name: 'Patron add-on',
        description: 'Same membership, no extra benefits. Just more support for SAMPA.',
        metadata: { sampa_addon: 'patron' },
      },
      // Matching-term so renewals keep Fellow+$25 (= $75/yr). Lifetime is one-time.
      ...(isLifetime ? {} : { recurring: { interval: 'year', interval_count: years } }),
    },
  };
}
