#!/usr/bin/env node
// Assert T41 Josh live Patron copy on Join / invoice / dashboard / Stripe.
import { readFileSync } from 'node:fs';
import {
  MEMBERSHIP_TIERS,
  PATRON_ADDON_BLURB,
  canAddPatron,
  patronUpgradeDuration,
} from '../src/lib/membership.js';
import { directoryBadgeLabels } from '../src/lib/directoryBadges.js';

const JOSH_PATRON_SENTENCE =
  'Additional support for SAMPA, a Patron badge to flex on your directory listing, and our genuine gratitude.';

const fellow = MEMBERSHIP_TIERS.find((t) => t.key === 'fellow');
const certified = MEMBERSHIP_TIERS.find((t) => t.key === 'sustaining');

const fail = (msg) => {
  console.error(`verify-patron-copy: ${msg}`);
  process.exit(1);
};

if (!fellow?.desc.includes('NCCPA certification + AAPA member')) fail('Fellow lost eligibility line');
if (!fellow.desc.toLowerCase().includes('patron badge')) fail('Fellow card must mention Patron directory badge');
if (fellow.desc.length > 180) fail('Fellow desc is turning into a wall of text');

if (!certified?.desc.includes('not an AAPA member')) fail('Certified PA lost eligibility vs Fellow');
if (!certified.desc.includes('AAPA members belong on Fellow')) fail('Certified PA must still point AAPA members to Fellow');
if (/this is not extra support/i.test(certified.desc)) fail('Certified PA still has leftover disclaimer');
if (certified.secondaryLabel !== 'Sustaining rate') fail('Quiet Sustaining rate line must stay');
if (certified.name !== 'Certified PA (not AAPA)') fail('Do not revive Sustaining as the public card name');

if (PATRON_ADDON_BLURB !== JOSH_PATRON_SENTENCE) {
  fail('PATRON_ADDON_BLURB must be Josh’s exact sentence — do not rewrite');
}
if (!/additional support/i.test(PATRON_ADDON_BLURB)) fail('Patron blurb must say additional support');
if (!/flex/i.test(PATRON_ADDON_BLURB)) fail('Patron blurb must say flex');
if (!/gratitude/i.test(PATRON_ADDON_BLURB)) fail('Patron blurb must say gratitude');

const joinSrc = readFileSync('src/pages/Join.jsx', 'utf8');
if (!joinSrc.includes('Patron — {PATRON_ADDON_BLURB}')) {
  fail('Join must keep the Patron label, then Josh’s sentence');
}

const invoiceSrc = readFileSync('src/pages/JoinInvoice.jsx', 'utf8');
if (!invoiceSrc.includes('PATRON_ADDON_BLURB')) {
  fail('/join/invoice must show Josh’s Patron sentence');
}

const dashSrc = readFileSync('src/pages/Dashboard.jsx', 'utf8');
if (!dashSrc.includes('PATRON_ADDON_BLURB')) {
  fail('dashboard Add Patron must show Josh’s Patron sentence');
}

const tiersSrc = readFileSync('api/_lib/tiers.js', 'utf8');
const stripeHits = tiersSrc.split(JOSH_PATRON_SENTENCE).length - 1;
if (stripeHits < 2) {
  fail('patronLineItem and patronOneTimeLineItem descriptions must be Josh’s exact sentence');
}

const src = [
  'src/lib/membership.js',
  'src/pages/Join.jsx',
  'src/pages/JoinInvoice.jsx',
  'src/pages/Dashboard.jsx',
  'api/_lib/tiers.js',
].map((p) => readFileSync(p, 'utf8')).join('\n');
if (/this is not extra support/i.test(src)) fail('leftover “This is not extra support.” still in Join surfaces');
if (/same membership, no extra benefits/i.test(src)) fail('leftover “same membership, no extra benefits” still in Join surfaces');
if (/no extra membership benefits beyond the badge/i.test(src)) {
  fail('leftover “No extra membership benefits beyond the badge.” still in Join surfaces');
}

if (directoryBadgeLabels({}).length !== 0) fail('no badges when neither flag is set');
if (JSON.stringify(directoryBadgeLabels({ is_board: true })) !== '["Board"]') fail('Board-only');
if (JSON.stringify(directoryBadgeLabels({ patron: true })) !== '["Patron"]') fail('Patron-only');
if (JSON.stringify(directoryBadgeLabels({ is_board: true, patron: true })) !== '["Board","Patron"]') {
  fail('Board + Patron together');
}
if (directoryBadgeLabels({ membership_tier: 'patron' }).length !== 0) {
  fail('Patron must never be inferred from membership_tier');
}

if (canAddPatron({ membership_status: 'active', patron: false, stripe_customer_id: 'cus_x' }) !== true) {
  fail('active non-patron with Stripe should see Add Patron');
}
if (canAddPatron({ membership_status: 'active', patron: true, stripe_customer_id: 'cus_x' })) {
  fail('already Patron must hide Add Patron');
}
if (canAddPatron({ membership_status: 'canceled', patron: false, stripe_customer_id: 'cus_x' })) {
  fail('non-active must hide Add Patron');
}
if (canAddPatron({ membership_status: 'active', patron: false, stripe_customer_id: null })) {
  fail('no Stripe customer must hide Add Patron');
}
if (patronUpgradeDuration({ membership_status: 'active', renews_on: null }) !== 'lifetime') {
  fail('lifetime upgrade duration');
}
if (patronUpgradeDuration({ membership_status: 'active', renews_on: '2027-01-01', membership_years: 3 }) !== 3) {
  fail('term upgrade duration uses membership_years');
}

console.log('verify-patron-copy: ok');
