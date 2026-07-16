// Feature flags — temporary operational toggles.
//
// DONATIONS: flip DONATIONS_ENABLED to true and redeploy to restore Stripe
// checkout. Keep api/create-donation-session.js in sync (same constant name
// at top of that file) so the API cannot create Checkout sessions while off.
//
// 2026-07-14: temporarily disabled (ops). Restore = true + deploy.

export const DONATIONS_ENABLED = false;
