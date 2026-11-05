import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GET, POST } from '../api/newsletter-stats.js';
import { handleFinanceStats } from '../api/_lib/finance-stats.js';
import { handleMembershipStats } from '../api/_lib/membership-stats.js';
import { handleNewsletterStats } from '../api/newsletter-stats.js';
import { FinancePanel, MembershipPanel } from '../src/components/OrgDashboard.jsx';
import { NewsletterPanel } from '../src/components/SiteTrafficCard.jsx';

const NOW = new Date('2026-09-24T12:00:00.000Z');
const CHARGE_AT = Math.floor(Date.parse('2026-09-15T00:00:00.000Z') / 1000);

function request(path, init) {
  return new Request(`https://www.addictionpas.org${path}`, init);
}

function platformContext(extra = {}) {
  return {
    ...extra,
    cache: {
      get: async () => undefined,
      set: async () => {},
    },
    waitUntil: () => {},
  };
}

async function read(res) {
  return { status: res.status, body: await res.json() };
}

function assertUnsigned(result, label) {
  assert.notDeepEqual(result.body, {}, `${label} returned {}`);
  assert.equal(result.status, 401, `${label} status`);
  assert.equal(result.body.error, 'Sign in required');
}

const admin = {
  requireUser: async () => ({ id: 'admin', email: 'admin@example.com' }),
  loadViewerProfile: async () => ({ role: 'admin' }),
  now: NOW,
};

const memberRow = {
  membership_status: 'active',
  membership_tier: 'fellow',
  membership_years: 1,
  renews_on: '2027-01-15T00:00:00.000Z',
};

describe('exported newsletter-stats handlers ignore the Vercel request context', () => {
  it('GET membership, finance, and newsletter do not return {}', async () => {
    const membership = await read(await GET(
      request('/api/newsletter-stats?section=membership'),
      platformContext({
        ...admin,
        loadMembershipRows: async () => [memberRow],
      }),
    ));
    assertUnsigned(membership, 'membership');

    const finance = await read(await GET(
      request('/api/newsletter-stats?section=finance'),
      platformContext({
        ...admin,
        env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
        loadRelay: async () => ({ source: 'Relay', amountCents: 100000, updatedOn: '2026-01-15' }),
        listTransactions: async () => ([
          { type: 'charge', amount: 2500, fee: 100, currency: 'usd', created: CHARGE_AT },
        ]),
      }),
    ));
    assertUnsigned(finance, 'finance');

    const newsletter = await read(await GET(
      request('/api/newsletter-stats'),
      platformContext({
        ...admin,
        env: { BREVO_API_KEY: 'secret-brevo-key', BREVO_LIST_UPDATES: '3' },
        loadSnapshots: async () => [],
        brevoGet: async (_key, path) => (
          path.startsWith('/contacts/lists/')
            ? { id: 3, name: 'SAMPA Weekly Newsletter', totalSubscribers: 145 }
            : { campaigns: [] }
        ),
      }),
    ));
    assertUnsigned(newsletter, 'newsletter');
  });

  it('POST email-preferences does not treat the platform context as deps', async () => {
    const result = await read(await POST(
      request('/api/newsletter-stats?section=email-preferences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: 'updates', on: true }),
      }),
      platformContext({
        ...admin,
        env: {
          BREVO_API_KEY: 'test-key',
          BREVO_LIST_UPDATES: '3',
          BREVO_LIST_DAILY_NEWS: '15',
          BREVO_LIST_TOPIC: '42',
        },
        fetchImpl: async () => new Response(JSON.stringify({
          listIds: [3],
          emailBlacklisted: false,
        }), { status: 200 }),
        updateNewsletterOptIn: async () => {},
      }),
    ));
    assertUnsigned(result, 'email-preferences');
  });
});

describe('section handlers ignore a thenable cache entry', () => {
  it('membership still counts the active row', async () => {
    const result = await read(await handleMembershipStats(
      request('/api/newsletter-stats?section=membership'),
      platformContext({
        ...admin,
        loadMembershipRows: async () => [memberRow],
      }),
    ));
    assert.equal(result.status, 200);
    assert.notDeepEqual(result.body, {});
    assert.equal(result.body.activeNow, 1);
    assert.equal(result.body.method, 'current_term');
  });

  it('finance still sums the Stripe charge', async () => {
    const result = await read(await handleFinanceStats(
      request('/api/newsletter-stats?section=finance'),
      platformContext({
        ...admin,
        env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
        loadRelay: async () => null,
        listTransactions: async () => ([
          { type: 'charge', amount: 2500, fee: 100, currency: 'usd', created: CHARGE_AT },
        ]),
      }),
    ));
    assert.equal(result.status, 200);
    assert.notDeepEqual(result.body, {});
    assert.equal(result.body.revenueCents, 2500);
    assert.equal(result.body.feeCents, 100);
    assert.equal(result.body.refundCents, 0);
  });

  it('newsletter still returns the list size', async () => {
    const result = await read(await handleNewsletterStats(
      request('/api/newsletter-stats'),
      platformContext({
        ...admin,
        env: { BREVO_API_KEY: 'secret-brevo-key', BREVO_LIST_UPDATES: '3' },
        loadSnapshots: async () => [],
        brevoGet: async (_key, path) => (
          path.startsWith('/contacts/lists/')
            ? { id: 3, name: 'SAMPA Weekly Newsletter', totalSubscribers: 145 }
            : { campaigns: [] }
        ),
      }),
    ));
    assert.equal(result.status, 200);
    assert.notDeepEqual(result.body, {});
    assert.equal(result.body.subscribers, 145);
    assert.ok(Array.isArray(result.body.issues));
  });
});

function markup(Component, props) {
  return renderToStaticMarkup(createElement(Component, props));
}

describe('dashboard sections treat an empty object as a load error', () => {
  it('membership does not render Active now 0', () => {
    const html = markup(MembershipPanel, {
      loading: false,
      error: null,
      stats: {},
      profile: null,
    });
    assert.match(html, /Couldn.+t load membership/);
    assert.doesNotMatch(html, /Active now/);
    assert.doesNotMatch(html, /No active members in this window/);
  });

  it('finance does not render $0.00 revenue, fees, and refunds', () => {
    const html = markup(FinancePanel, { loading: false, error: null, stats: {} });
    assert.match(html, /Couldn.+t load finance/);
    assert.doesNotMatch(html, /Revenue/);
    assert.doesNotMatch(html, /\$0\.00/);
  });

  it('newsletter does not render an empty chart', () => {
    const html = markup(NewsletterPanel, { loading: false, error: null, stats: {} });
    assert.match(html, /Couldn.+t load newsletter/);
    assert.doesNotMatch(html, /Open rate by issue/);
    assert.doesNotMatch(html, /No weekly issues yet/);
  });

  it('a real zero still renders', () => {
    const membership = markup(MembershipPanel, {
      loading: false,
      error: null,
      stats: { activeNow: 0, series: [{ month: '2026-09', active: 0 }], tiers: [] },
      profile: null,
    });
    assert.match(membership, /Active now/);
    assert.match(membership, /No active members in this window/);
    assert.doesNotMatch(membership, /Couldn.+t load membership/);

    const finance = markup(FinancePanel, {
      loading: false,
      error: null,
      stats: {
        revenueCents: 0,
        feeCents: 0,
        refundCents: 0,
        netCents: 0,
        series: [],
        empty: true,
      },
    });
    assert.match(finance, /\$0\.00/);
    assert.doesNotMatch(finance, /Couldn.+t load finance/);
  });
});
