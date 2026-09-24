#!/usr/bin/env node
// Membership headcount derivation and finance auth for the roster dashboard.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTtlCache } from '../api/_lib/ttl-cache.js';
import { handleMembershipStats } from '../api/membership-stats.js';
import { handleFinanceStats } from '../api/finance-stats.js';
import { canViewFinance } from '../src/lib/memberRoster.js';
import { shapeMembershipStats } from '../src/lib/membershipStats.js';
import { shapeFinanceStats } from '../src/lib/financeStats.js';

const NOW = new Date('2026-09-24T12:00:00.000Z');

function monthActive(stats, month) {
  return stats.series.find((point) => point.month === month)?.active;
}

describe('membership headcount derivation', () => {
  const profiles = [
    {
      membership_status: 'active',
      membership_tier: 'fellow',
      membership_years: 1,
      renews_on: '2027-01-15T00:00:00.000Z',
      email: 'fellow@example.com',
      created_at: '2020-01-01T00:00:00.000Z',
    },
    {
      membership_status: 'active',
      membership_tier: 'legacy',
      membership_years: null,
      renews_on: null,
    },
    {
      membership_status: 'active',
      membership_tier: 'fellow',
      membership_years: null,
      renews_on: '2026-06-01T00:00:00.000Z',
    },
    {
      membership_status: 'active',
      membership_tier: 'student',
      membership_years: null,
      renews_on: null,
      created_at: '2020-01-01T00:00:00.000Z',
    },
    {
      membership_status: 'canceled',
      membership_tier: 'fellow',
      membership_years: 3,
      renews_on: '2027-01-01T00:00:00.000Z',
    },
    {
      membership_status: 'past_due',
      membership_tier: 'fellow',
      membership_years: 1,
      renews_on: '2026-12-01T00:00:00.000Z',
    },
  ];

  it('counts current-term overlap and keeps unplaced actives in the latest month only', () => {
    const stats = shapeMembershipStats(profiles, NOW);
    assert.equal(stats.method, 'current_term');
    assert.equal(stats.activeNow, 4);
    assert.equal(stats.placed, 1);
    assert.equal(stats.pointOnly, 3);
    assert.deepEqual(stats.periods, { joins: null, renewals: null, lapses: null });
    assert.equal(monthActive(stats, '2025-10'), 0);
    assert.equal(monthActive(stats, '2025-12'), 0);
    assert.equal(monthActive(stats, '2026-01'), 1);
    assert.equal(monthActive(stats, '2026-08'), 1);
    assert.equal(monthActive(stats, '2026-09'), 4);
    assert.deepEqual(stats.tiers, [
      { tier: 'fellow', count: 2 },
      { tier: 'legacy', count: 1 },
      { tier: 'student', count: 1 },
    ]);
    assert.equal(JSON.stringify(stats).includes('fellow@example.com'), false);
    assert.equal(JSON.stringify(stats).includes('created_at'), false);
  });

  it('does not count the month a term ends on when renews_on is the month start', () => {
    const stats = shapeMembershipStats([
      {
        membership_status: 'active',
        membership_tier: 'fellow',
        membership_years: 1,
        renews_on: '2026-09-01T00:00:00.000Z',
      },
    ], NOW);
    assert.equal(monthActive(stats, '2026-08'), 1);
    assert.equal(monthActive(stats, '2026-09'), 0);
    assert.equal(stats.activeNow, 1);
  });
});

describe('finance shaping', () => {
  it('sums in-window usd charges and payments and skips payouts, other currencies, and older rows', () => {
    const september = Math.floor(Date.parse('2026-09-15T00:00:00.000Z') / 1000);
    const older = Math.floor(Date.parse('2024-01-15T00:00:00.000Z') / 1000);
    const stats = shapeFinanceStats([
      { type: 'charge', amount: 5000, fee: 175, currency: 'usd', created: september },
      { type: 'payment', amount: 2000, fee: 60, currency: 'usd', created: september },
      { type: 'refund', amount: -5000, fee: 0, currency: 'usd', created: september },
      { type: 'payment_refund', amount: -200, fee: 0, currency: 'usd', created: september },
      { type: 'payout', amount: -4000, fee: 0, currency: 'usd', created: september },
      { type: 'transfer', amount: -1000, fee: 0, currency: 'usd', created: september },
      { type: 'charge', amount: 9999, fee: 100, currency: 'eur', created: september },
      { type: 'stripe_fee', amount: -50, fee: 0, currency: 'usd', created: september },
      { type: 'charge', amount: 8000, fee: 200, currency: 'usd', created: older },
    ], NOW);
    assert.equal(stats.revenueCents, 7000);
    assert.equal(stats.refundCents, 5200);
    assert.equal(stats.feeCents, 175 + 60 + 50);
    assert.equal(stats.netCents, 7000 - 5200 - 285);
    assert.equal(stats.empty, false);
    const septemberRow = stats.series.find((point) => point.month === '2026-09');
    assert.equal(septemberRow.revenueCents, 7000);
    assert.equal(septemberRow.netCents, stats.netCents);
    assert.equal(stats.series.find((point) => point.month === '2025-10').revenueCents, 0);
  });
});

describe('GET /api/membership-stats', () => {
  const req = () => new Request('https://www.addictionpas.org/api/membership-stats');

  async function read(res) {
    return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
  }

  const rows = [
    {
      membership_status: 'active',
      membership_tier: 'fellow',
      membership_years: 1,
      renews_on: '2027-01-15T00:00:00.000Z',
      email: 'hidden@example.com',
    },
  ];

  it('rejects anonymous callers and non-roster profiles', async () => {
    const anon = await read(await handleMembershipStats(req(), {
      requireUser: async () => null,
      now: NOW,
    }));
    assert.equal(anon.status, 401);
    assert.equal(anon.body.error, 'Sign in required');
    assert.equal(anon.cache, 'private, no-store');

    const member = await read(await handleMembershipStats(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ role: 'member', is_board: true }),
      loadMembershipRows: async () => rows,
      now: NOW,
      cache: createTtlCache(),
    }));
    assert.equal(member.status, 403);
    assert.equal(member.body.error, 'Not authorized');
  });

  it('returns aggregates for a roster viewer and caches the month', async () => {
    let loads = 0;
    const deps = {
      requireUser: async () => ({ id: 'viewer' }),
      loadViewerProfile: async () => ({ role: 'member', can_view_members: true }),
      loadMembershipRows: async () => {
        loads += 1;
        return rows;
      },
      now: NOW,
      cache: createTtlCache(),
    };
    const first = await read(await handleMembershipStats(req(), deps));
    const second = await read(await handleMembershipStats(req(), deps));
    assert.equal(first.status, 200);
    assert.equal(first.cache, 'private, max-age=300');
    assert.equal(first.body.method, 'current_term');
    assert.equal(first.body.activeNow, 1);
    assert.equal(JSON.stringify(first.body).includes('hidden@example.com'), false);
    assert.equal(second.body.activeNow, 1);
    assert.equal(loads, 1);
  });
});

describe('GET /api/finance-stats', () => {
  const req = () => new Request('https://www.addictionpas.org/api/finance-stats');

  async function read(res) {
    return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
  }

  it('keeps finance to administrators', () => {
    assert.equal(canViewFinance({ role: 'admin' }), true);
    assert.equal(canViewFinance({ role: 'member', can_view_members: true, is_board: true }), false);
    assert.equal(canViewFinance({ role: 'member', is_board: true }), false);
    assert.equal(canViewFinance(null), false);
  });

  it('rejects anonymous, non-roster, and roster non-admins before Stripe', async () => {
    const anon = await read(await handleFinanceStats(req(), {
      requireUser: async () => null,
      now: NOW,
    }));
    assert.equal(anon.status, 401);
    assert.equal(anon.body.error, 'Sign in required');

    const member = await read(await handleFinanceStats(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ role: 'member' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
      now: NOW,
      cache: createTtlCache(),
    }));
    assert.equal(member.status, 403);
    assert.equal(member.body.error, 'Not authorized');

    const roster = await read(await handleFinanceStats(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ role: 'member', can_view_members: true, is_board: true }),
      env: {},
      listTransactions: async () => {
        throw new Error('should not list');
      },
      now: NOW,
      cache: createTtlCache(),
    }));
    assert.equal(roster.status, 403);
    assert.equal(roster.body.error, 'finance_restricted');
    assert.equal(roster.body.message, 'Finance totals are limited to administrators.');
  });

  it('returns not_configured when STRIPE_SECRET_KEY is missing', async () => {
    const res = await read(await handleFinanceStats(req(), {
      requireUser: async () => ({ id: 'admin' }),
      loadViewerProfile: async () => ({ role: 'admin' }),
      env: {},
      now: NOW,
      cache: createTtlCache(),
    }));
    assert.equal(res.status, 503);
    assert.equal(res.body.error, 'not_configured');
    assert.equal(res.body.message, 'Finances not configured.');
    assert.equal(res.cache, 'private, no-store');
  });

  it('returns stripe totals for an admin and caches them', async () => {
    let hits = 0;
    let seenKey = null;
    const september = Math.floor(Date.parse('2026-09-15T00:00:00.000Z') / 1000);
    const deps = {
      requireUser: async () => ({ id: 'admin' }),
      loadViewerProfile: async () => ({ role: 'admin' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
      now: NOW,
      cache: createTtlCache(),
      listTransactions: async (since, key) => {
        hits += 1;
        seenKey = key;
        assert.equal(since, Math.floor(Date.parse('2025-10-01T00:00:00.000Z') / 1000));
        return [
          { type: 'charge', amount: 5000, fee: 175, currency: 'usd', created: september },
          { type: 'refund', amount: -5000, fee: 0, currency: 'usd', created: september },
          { type: 'payout', amount: -4000, fee: 0, currency: 'usd', created: september },
          { type: 'charge', amount: 9999, fee: 0, currency: 'eur', created: september },
        ];
      },
    };
    const first = await read(await handleFinanceStats(req(), deps));
    const second = await read(await handleFinanceStats(req(), deps));
    assert.equal(first.status, 200);
    assert.equal(first.cache, 'private, max-age=300');
    assert.equal(first.body.revenueCents, 5000);
    assert.equal(first.body.refundCents, 5000);
    assert.equal(first.body.feeCents, 175);
    assert.equal(first.body.netCents, -175);
    assert.equal(second.body.netCents, -175);
    assert.equal(hits, 1);
    assert.equal(seenKey, 'sk_test_secret');
    assert.equal(JSON.stringify(first.body).includes('sk_test_secret'), false);
  });
});
