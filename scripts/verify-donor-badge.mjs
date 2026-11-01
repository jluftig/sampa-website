import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  chooseDonorProfile,
  donatedAtFromGifts,
  donationIsSuccessful,
  donorBadgeVisible,
  donorMatchFields,
  nextDonatedAt,
} from '../api/_lib/donorBadge.js';
import { handleStripeEvent } from '../api/stripe-webhook.js';
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
  assert.match(readFileSync('api/stripe-webhook.js', 'utf8'), /donorMatchFields/);
  assert.match(webhook, /case 'charge\.refunded'/);
  assert.match(webhook, /case 'charge\.dispute\.created'/);
});

test('the donor migration keeps the join-flow directory functions and adds donor', () => {
  const join = readFileSync('supabase/migrations/2026-11-01-join-flow-profile.sql', 'utf8');
  const donor = readFileSync('supabase/migrations/2026-11-01-donor-directory-badge.sql', 'utf8');
  assert.match(donor, /Paste order/);
  assert.match(donor, /2026-11-01-join-flow-profile\.sql/);
  for (const name of ['member_directory(', 'member_directory_profile(']) {
    const marker = `create or replace function public.${name}`;
    const slice = (text) => {
      const start = text.indexOf(marker);
      const end = text.indexOf('$$;', start);
      return text.slice(start, end + 3);
    };
    const withoutDonor = slice(donor)
      .split('\n')
      .filter((line) => !line.includes('donor boolean') && !line.includes("interval '12 months'"))
      .map((line) => line.trimEnd())
      .join('\n');
    const base = slice(join).split('\n').map((line) => line.trimEnd()).join('\n');
    assert.equal(withoutDonor, base, `${name} must stay the PR #162 body plus donor`);
  }
});

function memoryAdmin({ profiles = [], donations = [] } = {}) {
  const state = {
    profiles: profiles.map((row) => ({ ...row })),
    donations: donations.map((row) => ({ ...row })),
  };
  const match = (row, filters) => filters.every((filter) => {
    const value = row[filter.col];
    if (filter.type === 'eq') return value === filter.val;
    const needle = String(filter.val).replace(/\\/g, '').toLowerCase();
    return String(value || '').toLowerCase() === needle;
  });
  return {
    state,
    from(table) {
      const rows = table === 'profiles' ? state.profiles : state.donations;
      const query = { op: 'select', filters: [], patch: null };
      const run = () => rows.filter((row) => match(row, query.filters));
      const api = {
        select() { query.op = 'select'; return api; },
        update(patch) { query.op = 'update'; query.patch = patch; return api; },
        upsert(row) {
          state.donations.push({
            id: row.id || `don-${state.donations.length + 1}`,
            created_at: row.created_at || new Date().toISOString(),
            ...row,
          });
          return Promise.resolve({ error: null });
        },
        eq(col, val) { query.filters.push({ type: 'eq', col, val }); return api; },
        ilike(col, val) { query.filters.push({ type: 'ilike', col, val }); return api; },
        maybeSingle() {
          const found = run();
          return Promise.resolve({ data: found[0] || null, error: null });
        },
        then(resolve, reject) {
          try {
            const found = run();
            if (query.op === 'update') {
              for (const row of found) Object.assign(row, query.patch);
            }
            resolve({ data: found, error: null });
          } catch (err) {
            reject(err);
          }
        },
      };
      return api;
    },
  };
}

test('a donation checkout stamps donated_at using the donation row field names', async () => {
  process.env.BREVO_MEMBER_EMAILS_ENABLED = 'false';
  const paidAt = new Date('2026-10-01T00:00:00.000Z');
  const admin = memoryAdmin({
    profiles: [{
      id: 'member-1',
      stripe_customer_id: 'cus_member',
      email: 'Member@Example.org',
      donated_at: null,
    }],
  });
  await handleStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_gift',
        mode: 'payment',
        metadata: { type: 'donation' },
        client_reference_id: 'member-1',
        customer_details: { email: 'Member@Example.org', name: 'Member' },
        amount_total: 2500,
        currency: 'usd',
        payment_status: 'paid',
        customer: 'cus_member',
        payment_intent: 'pi_gift',
        created: paidAt.getTime() / 1000,
      },
    },
  }, { stripe: null, admin });
  assert.equal(admin.state.profiles[0].donated_at, paidAt.toISOString());
});

test('a refund or dispute recomputes donated_at from gifts still succeeded', async () => {
  process.env.BREVO_MEMBER_EMAILS_ENABLED = 'false';
  const now = new Date();
  const recent = new Date(now);
  recent.setMonth(recent.getMonth() - 1);
  const earlier = new Date(now);
  earlier.setMonth(earlier.getMonth() - 3);
  const stale = new Date(now);
  stale.setMonth(stale.getMonth() - 14);
  const profile = {
    id: 'member-1',
    stripe_customer_id: 'cus_member',
    email: 'member@example.org',
    donated_at: recent.toISOString(),
  };
  const admin = memoryAdmin({
    profiles: [profile],
    donations: [
      {
        id: 'new-gift',
        user_id: 'member-1',
        donor_email: 'member@example.org',
        stripe_customer_id: 'cus_member',
        stripe_payment_intent_id: 'pi_new',
        status: 'succeeded',
        amount: 5000,
        created_at: recent.toISOString(),
      },
      {
        id: 'old-gift',
        user_id: 'member-1',
        donor_email: 'member@example.org',
        stripe_customer_id: 'cus_member',
        stripe_payment_intent_id: 'pi_old',
        status: 'succeeded',
        amount: 2000,
        created_at: earlier.toISOString(),
      },
      {
        id: 'stale-gift',
        user_id: 'member-1',
        donor_email: 'member@example.org',
        stripe_customer_id: 'cus_member',
        stripe_payment_intent_id: 'pi_stale',
        status: 'succeeded',
        amount: 1000,
        created_at: stale.toISOString(),
      },
    ],
  });
  await handleStripeEvent({
    type: 'charge.refunded',
    data: { object: { payment_intent: 'pi_new', amount_refunded: 5000, amount: 5000, refunded: true } },
  }, { stripe: null, admin });
  assert.equal(admin.state.donations.find((row) => row.id === 'new-gift').status, 'refunded');
  assert.equal(admin.state.profiles[0].donated_at, earlier.toISOString());

  await handleStripeEvent({
    type: 'charge.refunded',
    data: { object: { payment_intent: 'pi_old', amount_refunded: 2000, amount: 2000, refunded: true } },
  }, { stripe: null, admin });
  assert.equal(admin.state.profiles[0].donated_at, null);

  const monthAdmin = memoryAdmin({
    profiles: [{ ...profile, donated_at: recent.toISOString() }],
    donations: [{
      id: 'month-gift',
      user_id: 'member-1',
      donor_email: 'member@example.org',
      stripe_customer_id: 'cus_member',
      stripe_invoice_id: 'in_month',
      status: 'succeeded',
      amount: 1000,
      created_at: recent.toISOString(),
    }],
  });
  let retrieved = 0;
  await handleStripeEvent({
    type: 'charge.dispute.created',
    data: { object: { charge: 'ch_month', payment_intent: null } },
  }, {
    stripe: {
      charges: {
        async retrieve(id) {
          retrieved += 1;
          assert.equal(id, 'ch_month');
          return { payment_intent: 'pi_month', invoice: 'in_month' };
        },
      },
    },
    admin: monthAdmin,
  });
  assert.equal(retrieved, 1);
  assert.equal(monthAdmin.state.donations[0].status, 'disputed');
  assert.equal(monthAdmin.state.profiles[0].donated_at, null);
});

test('a membership refund does not clear donated_at', async () => {
  const kept = new Date('2026-09-01T00:00:00.000Z').toISOString();
  const admin = memoryAdmin({
    profiles: [{
      id: 'member-1',
      stripe_customer_id: 'cus_member',
      email: 'member@example.org',
      donated_at: kept,
    }],
    donations: [],
  });
  await handleStripeEvent({
    type: 'charge.refunded',
    data: { object: { payment_intent: 'pi_dues', amount_refunded: 5000, amount: 5000, refunded: true } },
  }, { stripe: null, admin });
  assert.equal(admin.state.profiles[0].donated_at, kept);
});

test('snake_case donation rows map onto the matcher', () => {
  assert.deepEqual(donorMatchFields({
    user_id: 'member-1',
    stripe_customer_id: 'cus_1',
    donor_email: 'a@example.org',
    amount: 2500,
    status: 'succeeded',
    created_at: '2026-10-01T00:00:00.000Z',
  }), {
    userId: 'member-1',
    stripeCustomerId: 'cus_1',
    email: 'a@example.org',
    amount: 2500,
    status: 'succeeded',
    paymentStatus: undefined,
    paidAt: '2026-10-01T00:00:00.000Z',
  });
  const now = new Date('2026-11-01T00:00:00.000Z');
  assert.equal(donatedAtFromGifts([
    { status: 'refunded', amount: 1000, created_at: '2026-10-01T00:00:00.000Z' },
    { status: 'disputed', amount: 1000, created_at: '2026-10-02T00:00:00.000Z' },
    { status: 'succeeded', amount: 1000, created_at: '2026-08-01T00:00:00.000Z' },
    { status: 'succeeded', amount: 1000, created_at: '2024-01-01T00:00:00.000Z' },
  ], now), '2026-08-01T00:00:00.000Z');
  assert.equal(donatedAtFromGifts([
    { status: 'refunded', amount: 1000, created_at: '2026-10-01T00:00:00.000Z' },
  ], now), null);
});
