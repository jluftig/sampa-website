#!/usr/bin/env node
// One-shot Stripe setup for SAMPA membership dues: creates the 6 products and
// 17 prices (grid per docs/member-area-setup.md §3.1 / src/lib/membership.js),
// optionally the webhook endpoint, and prints the env vars to paste into
// Vercel. Contains no secrets; the key comes from the environment.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-bootstrap.mjs \
//     [--webhook-url https://<site>/api/stripe-webhook]
//
// Run once with a TEST key (paste output into Vercel's Preview env) and once
// with the LIVE key (into Production). Idempotent: products are matched by
// metadata.sampa_tier and prices by lookup_key, so re-running never
// duplicates — it just re-prints the existing ids.
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY first, e.g.:');
  console.error('  STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-bootstrap.mjs');
  process.exit(1);
}
const stripe = new Stripe(key);
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';

const urlFlag = process.argv.indexOf('--webhook-url');
const webhookUrl = urlFlag > -1 ? process.argv[urlFlag + 1] : null;

// Amounts in cents. Keep in sync with src/lib/membership.js.
const TIERS = [
  { key: 'fellow',     name: 'SAMPA Fellow Membership',     years: { 1: 5000, 2: 9000, 3: 12500 } },
  { key: 'sustaining', name: 'SAMPA Sustaining Membership', years: { 1: 7500, 2: 13500, 3: 18500 } },
  { key: 'associate',  name: 'SAMPA Associate Membership',  years: { 1: 4000, 2: 7000, 3: 10000 } },
  { key: 'legacy',     name: 'SAMPA Legacy Membership',     years: { 1: 2500, 2: 4500, 3: 6000 }, lifetime: 12500 },
  { key: 'student',    name: 'SAMPA Student Membership',    years: { 1: 1000, 2: 1800 } },
  { key: 'prepa',      name: 'SAMPA Pre-PA Membership',     years: { 1: 500, 2: 900 } },
];

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

async function ensureProduct(tier, existingProducts) {
  const found = existingProducts.find((p) => p.metadata?.sampa_tier === tier.key);
  if (found) return found;
  return stripe.products.create({ name: tier.name, metadata: { sampa_tier: tier.key } });
}

async function ensurePrice(product, tier, duration, amountCents) {
  const isLifetime = duration === 'lifetime';
  const lookupKey = `sampa_${tier.key}_${isLifetime ? 'lifetime' : `${duration}y`}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: amountCents,
    lookup_key: lookupKey,
    nickname: isLifetime ? 'Lifetime (one-time)' : `${duration}-year term`,
    ...(isLifetime ? {} : { recurring: { interval: 'year', interval_count: duration } }),
  });
}

const envLines = [];
console.log(`\nStripe mode: ${mode}\n`);

const existingProducts = (await stripe.products.list({ limit: 100, active: true })).data;

for (const tier of TIERS) {
  const product = await ensureProduct(tier, existingProducts);
  for (const [duration, amount] of Object.entries(tier.years)) {
    const price = await ensurePrice(product, tier, Number(duration), amount);
    envLines.push(`STRIPE_PRICE_${tier.key.toUpperCase()}_${duration}Y=${price.id}`);
    console.log(`✓ ${tier.name} — ${duration}-year $${amount / 100} (${price.id})`);
  }
  if (tier.lifetime) {
    const price = await ensurePrice(product, tier, 'lifetime', tier.lifetime);
    envLines.push(`STRIPE_PRICE_${tier.key.toUpperCase()}_LIFETIME=${price.id}`);
    console.log(`✓ ${tier.name} — lifetime $${tier.lifetime / 100} (${price.id})`);
  }
}

// Board-approved 5% dues discount for SMS opt-ins, as a promotion code so it
// can be deactivated or replaced (Stripe dashboard → Products → Coupons)
// without a deploy. duration 'once' = the discount applies to the checkout's
// first invoice (i.e. the whole first term); renewals bill at full price.
const SMS_PROMO_CODE = 'SAMPATEXT5';
const SMS_COUPON_NAME = 'SMS updates dues discount (5%)';
const smsExisting = await stripe.promotionCodes.list({ code: SMS_PROMO_CODE, limit: 1 });
if (smsExisting.data[0]) {
  console.log(`\n✓ Promo code ${SMS_PROMO_CODE} already exists (${smsExisting.data[0].active ? 'active' : 'INACTIVE'})`);
} else {
  // Reuse a matching coupon from a prior partial run rather than piling up dupes.
  const coupons = await stripe.coupons.list({ limit: 100 });
  const coupon =
    coupons.data.find((c) => c.name === SMS_COUPON_NAME && c.valid) ||
    (await stripe.coupons.create({ percent_off: 5, duration: 'once', name: SMS_COUPON_NAME }));
  // API versions ≥ 2025 attach the coupon via a promotion object.
  await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code: SMS_PROMO_CODE,
  });
  console.log(`\n✓ Created promo code ${SMS_PROMO_CODE} — 5% off the first membership term`);
}

if (webhookUrl) {
  const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data;
  const found = existing.find((w) => w.url === webhookUrl);
  if (found) {
    console.log(`\n✓ Webhook already exists for ${webhookUrl} (${found.id}).`);
    console.log('  Stripe only reveals the signing secret at creation — copy it from');
    console.log('  the dashboard (Developers → Webhooks), or delete the endpoint and re-run.');
  } else {
    const wh = await stripe.webhookEndpoints.create({ url: webhookUrl, enabled_events: WEBHOOK_EVENTS });
    console.log(`\n✓ Webhook created: ${webhookUrl}`);
    envLines.push(`STRIPE_WEBHOOK_SECRET=${wh.secret}`);
  }
}

envLines.push(`STRIPE_SECRET_KEY=${key.slice(0, 11)}...  <- paste your full key here`);

console.log(`\n──── Paste into Vercel → Settings → Environment Variables (${mode === 'LIVE' ? 'Production' : 'Preview'}) ────\n`);
console.log(envLines.join('\n'));
console.log(`\n(Also add SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API.)`);
console.log(`Manual step left in the Stripe dashboard (${mode} mode): Settings → Billing →`);
console.log(`Customer portal → enable it, and allow switching between the six membership products.\n`);
