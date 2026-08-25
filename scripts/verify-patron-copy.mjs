#!/usr/bin/env node
// Assert T40 Join / invoice / directory-badge copy. No leftover Sustaining disclaimer.
import { readFileSync } from 'node:fs';
import { MEMBERSHIP_TIERS, PATRON_ADDON_BLURB } from '../src/lib/membership.js';
import { directoryBadgeLabels } from '../src/lib/directoryBadges.js';

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

if (!/patron badge/i.test(PATRON_ADDON_BLURB)) fail('Patron blurb must mention the directory badge');
if (!/no extra membership benefits beyond the badge/i.test(PATRON_ADDON_BLURB)) {
  fail('Patron blurb must say no extra membership benefits beyond the badge');
}

const src = [
  'src/lib/membership.js',
  'src/pages/Join.jsx',
  'src/pages/JoinInvoice.jsx',
  'api/_lib/tiers.js',
].map((p) => readFileSync(p, 'utf8')).join('\n');
if (/this is not extra support/i.test(src)) fail('leftover “This is not extra support.” still in Join surfaces');
if (/same membership, no extra benefits/i.test(src)) fail('leftover “same membership, no extra benefits” still in Join surfaces');

if (directoryBadgeLabels({}).length !== 0) fail('no badges when neither flag is set');
if (JSON.stringify(directoryBadgeLabels({ is_board: true })) !== '["Board"]') fail('Board-only');
if (JSON.stringify(directoryBadgeLabels({ patron: true })) !== '["Patron"]') fail('Patron-only');
if (JSON.stringify(directoryBadgeLabels({ is_board: true, patron: true })) !== '["Board","Patron"]') {
  fail('Board + Patron together');
}
if (directoryBadgeLabels({ membership_tier: 'patron' }).length !== 0) {
  fail('Patron must never be inferred from membership_tier');
}

console.log('verify-patron-copy: ok');
