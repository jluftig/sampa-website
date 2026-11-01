import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  chooseDonorProfile,
  donationIsSuccessful,
  donorBadgeVisible,
  nextDonatedAt,
} from '../api/_lib/donorBadge.js';
import { directoryBadgeLabels } from '../src/lib/directoryBadges.js';

const NOW = new Date('2026-11-01T12:00:00.000Z');

test('Donor sits next to Patron, and a missing flag adds nothing', () => {
  assert.deepEqual(directoryBadgeLabels({ patron: true, donor: true }), ['Patron', 'Donor']);
  assert.deepEqual(
    directoryBadgeLabels({ is_board: true, patron: true, donor: true }),
    ['Board', 'Patron', 'Donor'],
  );
  assert.deepEqual(directoryBadgeLabels({ donor: true }), ['Donor']);
  assert.deepEqual(directoryBadgeLabels({ patron: true }), ['Patron']);
  assert.deepEqual(directoryBadgeLabels({}), []);
  assert.deepEqual(directoryBadgeLabels({ donated_at: NOW.toISOString() }), []);
});

test('the badge covers the last 12 calendar months, including the boundary', () => {
  const edge = new Date(NOW.getTime());
  edge.setMonth(edge.getMonth() - 12);
  assert.equal(donorBadgeVisible(edge.toISOString(), NOW), true);
  assert.equal(donorBadgeVisible(new Date(edge.getTime() - 1).toISOString(), NOW), false);
  assert.equal(donorBadgeVisible(null, NOW), false);
  assert.equal(donorBadgeVisible('not-a-date', NOW), false);
});

test('a later gift moves donated_at forward and an older retry does not', () => {
  assert.equal(nextDonatedAt(null, '2026-01-01T00:00:00.000Z'), '2026-01-01T00:00:00.000Z');
  assert.equal(
    nextDonatedAt('2026-06-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
    '2026-06-01T00:00:00.000Z',
  );
  assert.equal(
    nextDonatedAt('2026-01-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
    '2026-06-01T00:00:00.000Z',
  );
  assert.equal(nextDonatedAt(null, null), null);
});

test('only a positive succeeded payment counts', () => {
  assert.equal(donationIsSuccessful({ amount: 2500, status: 'succeeded', paymentStatus: 'paid' }), true);
  assert.equal(donationIsSuccessful({ amount: 2500, status: 'succeeded' }), true);
  assert.equal(donationIsSuccessful({ amount: 0, status: 'succeeded', paymentStatus: 'paid' }), false);
  assert.equal(donationIsSuccessful({ amount: 2500, status: 'succeeded', paymentStatus: 'unpaid' }), false);
  assert.equal(donationIsSuccessful({ amount: 2500, status: 'failed' }), false);
});

test('user id wins, then a unique customer, then a unique email', () => {
  const profiles = [
    { id: 'a', stripe_customer_id: 'cus_a', email: 'a@example.org' },
    { id: 'b', stripe_customer_id: 'cus_b', email: 'shared@example.org' },
    { id: 'c', stripe_customer_id: null, email: 'shared@example.org' },
    { id: 'd', stripe_customer_id: 'cus_d', email: 'd@example.org' },
  ];
  assert.equal(
    chooseDonorProfile(profiles, { userId: 'a', email: 'd@example.org' }),
    'a',
  );
  assert.equal(chooseDonorProfile(profiles, { userId: 'missing', email: 'd@example.org' }), null);
  assert.equal(chooseDonorProfile(profiles, { stripeCustomerId: 'cus_d' }), 'd');
  assert.equal(
    chooseDonorProfile(
      [
        { id: 'b', stripe_customer_id: 'cus_same', email: 'b@example.org' },
        { id: 'c', stripe_customer_id: 'cus_same', email: 'only@example.org' },
      ],
      { stripeCustomerId: 'cus_same', email: 'only@example.org' },
    ),
    null,
  );
  assert.equal(chooseDonorProfile(profiles, { email: '  D@Example.org ' }), 'd');
  assert.equal(chooseDonorProfile(profiles, { email: 'shared@example.org' }), null);
  assert.equal(chooseDonorProfile(profiles, {}), null);
});

test('the webhook stamps donated_at only on donation events, and SQL hides the timestamp', () => {
  const webhook = readFileSync('api/stripe-webhook.js', 'utf8');
  const donationStart = webhook.indexOf("if (session.metadata?.type === 'donation')");
  const membershipStart = webhook.indexOf('const userId = session.client_reference_id');
  assert.ok(donationStart > 0 && membershipStart > donationStart);
  const donationBranch = webhook.slice(donationStart, membershipStart);
  assert.match(donationBranch, /stampDonatedAt/);
  assert.doesNotMatch(webhook.slice(membershipStart, webhook.indexOf("case 'customer.subscription.updated'")), /stampDonatedAt/);
  assert.match(webhook, /stampDonatedAt/);
  const invoiceBranch = webhook.slice(webhook.indexOf("if (meta.type === 'donation')"));
  assert.match(invoiceBranch, /stampDonatedAt/);

  const migration = readFileSync('supabase/migrations/2026-11-01-donor-directory-badge.sql', 'utf8');
  assert.match(migration, /donated_at timestamptz/);
  assert.match(migration, /new\.donated_at/);
  assert.equal((migration.match(/\) = 1/g) || []).length, 2);
  assert.equal((migration.match(/interval '12 months'/g) || []).length, 2);
  assert.doesNotMatch(migration, /select[\s\S]*donated_at,/);
  const schema = readFileSync('supabase/schema.sql', 'utf8');
  assert.match(schema, /new\.donated_at\s+is distinct from old\.donated_at/);
  assert.equal((schema.match(/interval '12 months'/g) || []).length, 2);
});
