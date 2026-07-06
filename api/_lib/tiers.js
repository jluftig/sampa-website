// Membership tier keys — must match src/lib/membership.js. Each tier maps to
// a Stripe Price id supplied via env vars so prices can change in Stripe (or
// point at test prices on previews) without a code change.
export const TIER_PRICE_ENV = {
  fellow: 'STRIPE_PRICE_FELLOW',
  sustaining: 'STRIPE_PRICE_SUSTAINING',
  associate: 'STRIPE_PRICE_ASSOCIATE',
  legacy: 'STRIPE_PRICE_LEGACY',
  student: 'STRIPE_PRICE_STUDENT',
  prepa: 'STRIPE_PRICE_PREPA',
};

export function priceIdForTier(tier) {
  const envName = TIER_PRICE_ENV[tier];
  return envName ? process.env[envName] || null : null;
}
