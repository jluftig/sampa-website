#!/usr/bin/env node
// Dry-run list of active Sustaining members for a possible shift to
// Fellow + Patron. Patron is NOT a membership_tier.
//
// Lists honor-system `aapa_member` when the column exists, plus weak
// credentials signals (DFAAPA / FAAPA / AAPA). Does NOT classify anyone
// as accidental. Josh reviews the list. Never auto-apply.
//
// Default: read-only list. Never writes Supabase or Stripe.
//
// Usage (read-only — operator machine, not CI):
//   SUPABASE_URL=https://….supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=… \
//   node scripts/patron-sustaining-shift.mjs
//
// Optional Stripe enrichment (still GET-only — lists subscription ids/prices):
//   STRIPE_SECRET_KEY=sk_test_… node scripts/patron-sustaining-shift.mjs
//
// Apply is gated and will not run in CI / Vercel / preview. Even with
// --apply + SUSTAINING_SHIFT_APPLY=YES it only PRINTS the intended Stripe
// + SQL steps. Live Stripe writes stay commented out. Josh reviews first.
//
// Do not point this at production unless Josh asked for the list.

import { createClient } from '@supabase/supabase-js';

const APPLY_FLAG = process.argv.includes('--apply');
const APPLY_ENV = process.env.SUSTAINING_SHIFT_APPLY === 'YES';
const IN_AUTOMATED = Boolean(
  process.env.CI || process.env.VERCEL || process.env.VERCEL_ENV
);

const SELECT_COLS = [
  'id',
  'email',
  'full_name',
  'credentials',
  'membership_tier',
  'membership_status',
  'membership_years',
  'renews_on',
  'stripe_customer_id',
  'patron',
  'aapa_member',
].join(', ');

// Signals only — not a decision. aapa_member is honor-system, not verified.
function aapaSignals(row) {
  const hits = [];
  if (row.aapa_member === true) hits.push('aapa_member=true');
  if (row.aapa_member === false) hits.push('aapa_member=false');
  const text = row.credentials || '';
  if (/\bDFAAPA\b/i.test(text)) hits.push('DFAAPA');
  if (/\bFAAPA\b/i.test(text) && !/\bDFAAPA\b/i.test(text)) hits.push('FAAPA');
  if (/\bAAPA\b/i.test(text)) hits.push('AAPA-in-credentials');
  return hits;
}

function priceGap(years) {
  // Sustaining vs Fellow+Patron (+$25 × years). Happy path is 1 year: $75 = $75.
  const sustaining = { 1: 75, 2: 135, 3: 185 };
  const fellowPlusPatron = { 1: 75, 2: 140, 3: 200 };
  const y = years === 2 || years === 3 ? years : 1;
  const delta = fellowPlusPatron[y] - sustaining[y];
  return { sustaining: sustaining[y], fellowPlusPatron: fellowPlusPatron[y], delta };
}

function refuseApply(reason) {
  console.error(`APPLY REFUSED: ${reason}`);
  process.exit(2);
}

if (APPLY_FLAG) {
  if (IN_AUTOMATED) refuseApply('CI / Vercel / preview — apply is disabled');
  if (!APPLY_ENV) {
    refuseApply('pass --apply and SUSTAINING_SHIFT_APPLY=YES only after Josh reviews the list');
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Read-only list needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Do not run against production unless Josh asked for this list.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let { data: rows, error } = await admin
  .from('profiles')
  .select(SELECT_COLS)
  .eq('membership_tier', 'sustaining')
  .eq('membership_status', 'active')
  .order('email', { ascending: true });

if (error && /aapa_member|patron/i.test(error.message || '')) {
  ({ data: rows, error } = await admin
    .from('profiles')
    .select(SELECT_COLS.replace(', patron, aapa_member', ''))
    .eq('membership_tier', 'sustaining')
    .eq('membership_status', 'active')
    .order('email', { ascending: true }));
}

if (error) {
  console.error('Supabase list failed:', error.message);
  process.exit(1);
}

const members = rows || [];
console.log(`Active sustaining members: ${members.length}`);
console.log('aapa_member is honor-system (not verified). Signals are not a shift decision.\n');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = (await import('stripe')).default;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

const listed = [];
for (const p of members) {
  const signals = aapaSignals(p);
  const years = p.membership_years || 1;
  const gap = priceGap(years);
  const entry = {
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    credentials: p.credentials || '',
    membership_tier: p.membership_tier,
    membership_years: p.membership_years,
    renews_on: p.renews_on,
    stripe_customer_id: p.stripe_customer_id,
    patron: p.patron === true,
    aapa_member: p.aapa_member ?? null,
    aapa_signals: signals,
    same_total_happy_path: gap.delta === 0,
    price_note:
      gap.delta === 0
        ? `1yr happy path: Sustaining $${gap.sustaining} → Fellow+Patron $${gap.fellowPlusPatron}`
        : `${years}yr gap: Sustaining $${gap.sustaining} vs Fellow+Patron $${gap.fellowPlusPatron} (delta $${gap.delta}) — Josh must decide`,
    stripe_subscription_id: null,
    stripe_price_ids: [],
  };

  if (stripe && p.stripe_customer_id) {
    const subs = await stripe.subscriptions.list({
      customer: p.stripe_customer_id,
      status: 'all',
      limit: 10,
    });
    const active = subs.data.filter((s) => ['active', 'trialing', 'past_due'].includes(s.status));
    entry.stripe_subscription_id = active[0]?.id || subs.data[0]?.id || null;
    entry.stripe_price_ids = (active[0] || subs.data[0])?.items?.data?.map((i) => i.price?.id) || [];
  }

  listed.push(entry);
  console.log(JSON.stringify(entry, null, 2));
  console.log('---');
}

console.log('\nReview: only shift people Josh confirms were the accidental extra-support click.');
console.log('Legitimate non-AAPA PAs stay on key `sustaining` (public name PA Member).');
console.log('Happy path same-total is 1-year $75 → Fellow $50 + Patron $25. Multi-year has a gap.');

if (!APPLY_FLAG) {
  console.log('\nNo writes. Apply is a separate gated path and is not run from preview/CI.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// APPLY PATH — gated above. Prints intended Stripe + SQL. Does not execute
// Stripe writes. Live apply waits for Josh.
// ---------------------------------------------------------------------------
console.log('\n=== APPLY PLAN (printed only — Stripe writes are commented out) ===\n');
console.log(`Stripe mode hint: ${(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live') ? 'LIVE KEY PRESENT — refusing writes' : 'test or unset'}`);

if ((process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live')) {
  refuseApply('live Stripe key in env — this script never writes live Stripe');
}

const happy = listed.filter((e) => e.same_total_happy_path);
const needsDecision = listed.filter((e) => !e.same_total_happy_path);
console.log(`Would consider (1yr same-total only): ${happy.length}`);
console.log(`Needs Josh price decision (2yr/3yr gap): ${needsDecision.length}`);

for (const e of happy) {
  printStripeSwapPlan(e);
}

console.log('\nSQL that would run AFTER a successful Stripe swap (not executed):');
console.log(`-- update public.profiles`);
console.log(`--   set membership_tier = 'fellow', patron = true`);
console.log(`--   where id in (${happy.map((e) => `'${e.id}'`).join(', ') || '/* none */'})`);
console.log(`--   and membership_tier = 'sustaining' and membership_status = 'active';`);

/*
 * LIVE STRIPE WRITES — KEEP COMMENTED. Never uncomment in preview/CI.
 *
 * For each 1-year accidental Sustaining subscription (Josh-approved ids only):
 *
 * 1) Ensure a reusable Patron price (once per Stripe mode):
 *    const product = await stripe.products.create({
 *      name: 'SAMPA Patron add-on',
 *      metadata: { sampa_addon: 'patron' },
 *    });
 *    const patronPrice = await stripe.prices.create({
 *      product: product.id,
 *      currency: 'usd',
 *      unit_amount: 2500,
 *      recurring: { interval: 'year', interval_count: 1 },
 *      lookup_key: 'sampa_patron_1y',
 *      nickname: 'Patron +$25/yr',
 *    });
 *
 * 2) Swap the Sustaining subscription item onto Fellow, no proration:
 *    const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] });
 *    const sustainingItem = sub.items.data.find((i) => i.price.id === process.env.STRIPE_PRICE_SUSTAINING_1Y);
 *    await stripe.subscriptionItems.update(sustainingItem.id, {
 *      price: process.env.STRIPE_PRICE_FELLOW_1Y,
 *      proration_behavior: 'none',
 *    });
 *
 * 3) Add the $25 Patron extra, no proration (same $75 total):
 *    await stripe.subscriptionItems.create({
 *      subscription: subId,
 *      price: patronPrice.id, // subscription items need a Price id, not price_data
 *      proration_behavior: 'none',
 *    });
 *
 * 4) Stamp metadata so the webhook writes fellow + patron, never tier=patron:
 *    await stripe.subscriptions.update(subId, {
 *      metadata: { ...sub.metadata, tier: 'fellow', patron: 'true' },
 *      proration_behavior: 'none',
 *    });
 *
 * 5) Then SQL (service role / SQL Editor), only for Josh-approved ids:
 *    update public.profiles
 *      set membership_tier = 'fellow', patron = true
 *      where id = '<id>'
 *        and membership_tier = 'sustaining'
 *        and membership_status = 'active';
 *
 * proration_behavior: 'none' = no mid-cycle charge or refund. Next invoice is
 * Fellow $50 + Patron $25 = $75, matching what they already pay.
 */

function printStripeSwapPlan(entry) {
  console.log(`\n# ${entry.email}  ${entry.id}`);
  console.log(`# customer=${entry.stripe_customer_id || 'MISSING'}  sub=${entry.stripe_subscription_id || 'unknown'}`);
  console.log('# 1. subscriptionItems.update(sustainingItem, { price: FELLOW_1Y, proration_behavior: "none" })');
  console.log('# 2. subscriptionItems.create({ subscription, price: PATRON_1Y ($25), proration_behavior: "none" })');
  console.log('# 3. subscriptions.update({ metadata: { tier: "fellow", patron: "true" }, proration_behavior: "none" })');
  console.log('# 4. SQL: membership_tier=fellow, patron=true  -- not executed');
}
