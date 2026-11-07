import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { GET, POST } from '../api/create-checkout-session.js';
import {
  buildCheckoutSessionParams,
  checkoutSuccessUrl,
  membershipConversionKind,
  priorPaidFromInvoiceList,
} from '../api/_lib/checkoutSession.js';
import {
  classifyCheckoutSession,
  membershipAmountCents,
  publicReceipt,
} from '../api/_lib/membershipReceipt.js';
import { adsConsentCookieLines, effectiveAdsConsent, readAdsConsent } from '../src/lib/adsConsent.js';
import {
  ADS_CLICK_COOKIE,
  clickCookieWrites,
  clickIdsFromSearch,
  readAdsClick,
  rememberAdsClickFromLocation,
} from '../src/lib/adsClick.js';
import { checkoutConfirmation } from '../src/lib/checkoutConfirmation.js';
import {
  ADS_FRAME_PATH,
  EXISTING_GOOGLE_ADS_TAG_ID,
  EXISTING_GTM_CONTAINER_ID,
  adsConfigFromEnv,
  mountConversionFrame,
  planMembershipConversion,
  reportVerifiedMembershipConversion,
} from '../src/lib/membershipConversion.js';
import { apexRedirectUrl } from '../src/lib/siteUrl.js';
import JoinCheckoutStep from '../src/components/join/JoinCheckoutStep.jsx';

const PAID_NEW = {
  id: 'cs_test_newmember01',
  status: 'complete',
  payment_status: 'paid',
  currency: 'usd',
  amount_total: 5000,
  mode: 'subscription',
  client_reference_id: 'user-a',
  customer_email: 'ada@example.org',
  customer_details: { name: 'Ada Lovelace', email: 'ada@example.org' },
  metadata: { conversion: 'new_membership', tier: 'fellow', supabase_user_id: 'user-a' },
};

function receiptFor(session, userId = 'user-a') {
  return publicReceipt(classifyCheckoutSession(session, userId));
}

function memoryStore() {
  const ids = new Set();
  return { read: () => ids, add: (id) => ids.add(id) };
}

function fakeDocument() {
  const elements = [];
  return {
    elements,
    body: { appendChild(el) { elements.push(el); } },
    createElement() {
      return {
        attrs: {},
        style: {},
        listeners: {},
        setAttribute(key, value) { this.attrs[key] = value; },
        addEventListener(name, fn) { this.listeners[name] = fn; },
        contentWindow: {
          posted: [],
          postMessage(data, origin) { this.posted.push({ data, origin }); },
        },
      };
    },
  };
}

function renderStep(props) {
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(JoinCheckoutStep, {
      phase: 'confirmation',
      cart: { total: 50 },
      profile: null,
      greeting: 'Welcome',
      signInHref: '/login?next=%2Fjoin',
      ...props,
    })));
}

describe('forged checkout success', () => {
  it('does not treat a timer or an already-active profile as payment', () => {
    const join = readFileSync(new URL('../src/pages/Join.jsx', import.meta.url), 'utf8');
    assert.doesNotMatch(join, /waited \|\| profile\?\.membership_status === 'active'/);
    assert.equal(checkoutConfirmation({
      phase: 'confirmation',
      receiptStatus: 'ready',
      receipt: { outcome: 'unknown', transactionId: null, value: null, currency: null },
      profileStatus: null,
      arrivalStatus: null,
    }).claimPayment, false);
    assert.equal(checkoutConfirmation({
      phase: 'confirmation',
      receiptStatus: 'ready',
      receipt: { outcome: 'unknown', transactionId: null, value: null, currency: null },
      profileStatus: 'active',
      arrivalStatus: 'active',
    }).screen, 'unconfirmed');
  });

  it('shows that the payment was not confirmed', () => {
    const html = renderStep({ screen: 'unconfirmed' });
    assert.match(html, /We could not confirm this payment/);
    assert.doesNotMatch(html, /Payment received/);
    assert.doesNotMatch(html, /member survey/);
  });
});

describe('checkout receipt', () => {
  const base = {
    userId: 'user-a',
    email: 'ada@example.org',
    customerId: null,
    tier: 'fellow',
    duration: 1,
    origin: 'https://www.addictionpas.org',
  };

  it('puts the Stripe session id on the success URL and stamps a new membership', () => {
    process.env.STRIPE_PRICE_FELLOW_1Y = 'price_fellow_1y';
    const { params } = buildCheckoutSessionParams({ ...base, conversion: 'new_membership' });
    assert.equal(params.success_url, checkoutSuccessUrl(base.origin));
    assert.match(params.success_url, /session_id=\{CHECKOUT_SESSION_ID\}/);
    assert.doesNotMatch(params.success_url, /gclid|gbraid|wbraid|@/);
    assert.equal(params.metadata.conversion, 'new_membership');
    assert.equal(membershipConversionKind(null), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'canceled' }, { priorPaid: true }), 'renewal');
    assert.equal(membershipConversionKind({ membership_status: 'canceled' }, { priorPaid: false }), 'new_membership');
  });

  it('accepts a paid new membership for the signed-in user', () => {
    const body = receiptFor(PAID_NEW);
    assert.equal(body.outcome, 'new_membership');
    assert.equal(body.transactionId, PAID_NEW.id);
    assert.equal(body.value, 50);
    assert.equal(body.currency, 'USD');
    assert.doesNotMatch(JSON.stringify(body), /ada@|Ada|Lovelace/);
    const html = renderStep({
      screen: 'active',
      profile: { membership_status: 'active', renews_on: '2027-11-07' },
    });
    assert.match(html, /Welcome/);
    assert.match(html, /Through/);
  });

  it('keeps payment received while the webhook has not activated membership yet', () => {
    const view = checkoutConfirmation({
      phase: 'confirmation',
      receiptStatus: 'ready',
      receipt: receiptFor(PAID_NEW),
      profileStatus: null,
      arrivalStatus: null,
    });
    assert.equal(view.screen, 'paid_waiting');
    assert.equal(view.claimPayment, true);
    assert.equal(view.sendConversion, true);
    const html = renderStep({ screen: 'paid_waiting' });
    assert.match(html, /Payment received/);
    assert.match(html, /usually takes a few seconds/);
  });

  it('does not confirm an unpaid, canceled, or failed session', () => {
    const unpaid = receiptFor({ ...PAID_NEW, id: 'cs_test_unpaid0001', status: 'complete', payment_status: 'unpaid' });
    assert.equal(unpaid.outcome, 'unpaid');
    assert.equal(checkoutConfirmation({
      phase: 'confirmation',
      receiptStatus: 'ready',
      receipt: unpaid,
      profileStatus: null,
      arrivalStatus: null,
    }).claimPayment, false);
    assert.equal(checkoutConfirmation({
      phase: 'review',
      receiptStatus: 'idle',
      receipt: null,
      profileStatus: null,
      arrivalStatus: undefined,
    }).screen, 'checkout');
    const html = renderStep({ phase: 'review', canceled: true, screen: 'checkout' });
    assert.match(html, /Checkout was canceled/);
    assert.doesNotMatch(html, /Payment received/);
  });

  it('hides another member\'s checkout', () => {
    const classified = classifyCheckoutSession(PAID_NEW, 'user-b');
    assert.equal(classified.outcome, 'forbidden');
    const body = publicReceipt(classified);
    assert.deepEqual(body, { outcome: 'unknown', transactionId: null, value: null, currency: null });
    assert.doesNotMatch(JSON.stringify(body), /ada@|Ada|5000|cs_test/);
  });

  it('does not report renewals, Patron upgrades, or donations', () => {
    const renewal = receiptFor({
      ...PAID_NEW,
      id: 'cs_test_renewal001',
      metadata: { conversion: 'renewal', tier: 'fellow' },
    });
    assert.equal(renewal.outcome, 'renewal');
    assert.equal(renewal.value, null);
    const patron = receiptFor({
      ...PAID_NEW,
      id: 'cs_test_patron0001',
      mode: 'payment',
      metadata: { addon: 'patron_upgrade', conversion: 'new_membership' },
    });
    assert.equal(patron.outcome, 'patron');
    const donation = receiptFor({
      ...PAID_NEW,
      id: 'cs_test_donate0001',
      mode: 'payment',
      metadata: { type: 'donation', conversion: 'new_membership' },
    });
    assert.equal(donation.outcome, 'donation');
    for (const receipt of [renewal, patron, donation]) {
      assert.equal(planMembershipConversion({
        receipt,
        config: adsConfigFromEnv({ VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL: 'FutureLabel1' }),
        hostname: 'www.addictionpas.org',
        sentIds: new Set(),
      }).send, false);
    }
  });

  it('serves the receipt only to the signed-in owner', async () => {
    let retrieved = 0;
    const denied = await GET(new Request('https://www.addictionpas.org/api/create-checkout-session?session_id=cs_test_newmember01'), {
      requireUser: async () => null,
      retrieve: async () => { retrieved += 1; return PAID_NEW; },
    });
    assert.equal(denied.status, 401);
    assert.equal(retrieved, 0);

    const forged = await GET(new Request('https://www.addictionpas.org/api/create-checkout-session?session_id=success'), {
      requireUser: async () => ({ id: 'user-a' }),
      retrieve: async () => { throw new Error('should not retrieve a forged id'); },
    });
    assert.deepEqual(await forged.json(), { outcome: 'unknown', transactionId: null, value: null, currency: null });

    const wrong = await GET(new Request('https://www.addictionpas.org/api/create-checkout-session?session_id=cs_test_newmember01'), {
      requireUser: async () => ({ id: 'user-b', email: 'other@example.org' }),
      retrieve: async () => PAID_NEW,
    });
    assert.deepEqual(await wrong.json(), { outcome: 'unknown', transactionId: null, value: null, currency: null });

    const paid = await GET(new Request('https://www.addictionpas.org/api/create-checkout-session?session_id=cs_test_newmember01'), {
      requireUser: async () => ({ id: 'user-a', email: 'ada@example.org' }),
      retrieve: async () => PAID_NEW,
    });
    assert.deepEqual(await paid.json(), {
      outcome: 'new_membership',
      transactionId: 'cs_test_newmember01',
      value: 50,
      currency: 'USD',
    });
  });
});

describe('ads conversion', () => {
  const labelEnv = { VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL: 'FutureLabel1' };
  const config = adsConfigFromEnv(labelEnv);
  const receipt = receiptFor(PAID_NEW);

  it('fails closed when the conversion label is absent, even with the live tag id', () => {
    const absent = adsConfigFromEnv({});
    assert.equal(absent.tagId, EXISTING_GOOGLE_ADS_TAG_ID);
    assert.equal(absent.containerId, EXISTING_GTM_CONTAINER_ID);
    assert.equal(absent.label, null);
    assert.equal(absent.configured, false);
    const plan = planMembershipConversion({
      receipt,
      config: absent,
      hostname: 'www.addictionpas.org',
      sentIds: new Set(),
    });
    assert.equal(plan.send, false);
    assert.equal(plan.reason, 'unconfigured');
    const doc = fakeDocument();
    assert.equal(mountConversionFrame({
      document: doc,
      payload: { tagId: EXISTING_GOOGLE_ADS_TAG_ID, label: '', transactionId: receipt.transactionId, value: 50, currency: 'USD' },
      hostname: 'www.addictionpas.org',
    }).mounted, false);
    assert.equal(doc.elements.length, 0);
  });

  it('does not send from a preview host when production config is present', () => {
    for (const hostname of ['sampa-website-git-preview.vercel.app', 'localhost', 'addictionpas.org']) {
      const plan = planMembershipConversion({
        receipt,
        config,
        hostname,
        sentIds: new Set(),
      });
      assert.equal(plan.send, false);
      assert.equal(plan.reason, 'off_host');
      const doc = fakeDocument();
      assert.equal(mountConversionFrame({
        document: doc,
        payload: { tagId: EXISTING_GOOGLE_ADS_TAG_ID, label: 'FutureLabel1', transactionId: 'cs_test_preview001', value: 50, currency: 'USD', consent: 'granted', optOut: false },
        hostname,
        consent: { choice: 'granted', adStorage: 'granted', optOut: false },
      }).mounted, false);
      assert.equal(doc.elements.length, 0);
    }
    assert.equal(planMembershipConversion({
      receipt,
      config,
      hostname: 'www.addictionpas.org',
      sentIds: new Set(),
      consent: effectiveAdsConsent({ choice: 'granted', adStorage: 'granted', optOut: false }, true),
    }).reason, 'opt_out');
  });

  it('sends one conversion for a paid new membership and ignores a repeat', () => {
    const storage = memoryStore();
    const doc = fakeDocument();
    const granted = { choice: 'granted', adStorage: 'granted', optOut: false };
    const first = reportVerifiedMembershipConversion({
      confirmation: { sendConversion: true },
      receipt,
      config,
      hostname: 'www.addictionpas.org',
      click: { gclid: 'Cj0KCQjwtestclickid' },
      consent: granted,
      storage,
      document: doc,
    });
    assert.equal(first.send, true);
    assert.equal(first.payload.transactionId, PAID_NEW.id);
    assert.equal(first.payload.value, 50);
    assert.equal(first.payload.gclid, 'Cj0KCQjwtestclickid');
    assert.doesNotMatch(JSON.stringify(first.payload), /@|Ada|email/);
    assert.equal(doc.elements.length, 1);
    const frame = doc.elements[0];
    assert.equal(frame.attrs.sandbox, 'allow-scripts');
    assert.doesNotMatch(frame.attrs.sandbox, /allow-same-origin/);
    assert.equal(frame.attrs.src, ADS_FRAME_PATH);
    frame.listeners.load();
    assert.equal(frame.contentWindow.posted[0].data.payload.transactionId, PAID_NEW.id);
    const second = reportVerifiedMembershipConversion({
      confirmation: { sendConversion: true },
      receipt,
      config,
      hostname: 'www.addictionpas.org',
      consent: granted,
      storage,
      document: fakeDocument(),
    });
    assert.equal(second.send, false);
    assert.equal(second.reason, 'duplicate');
  });

  it('uses the existing tag once and does not add the container snippet', () => {
    const frame = readFileSync(new URL('../public/membership-conversion.html', import.meta.url), 'utf8');
    const join = readFileSync(new URL('../src/pages/Join.jsx', import.meta.url), 'utf8');
    const webhook = readFileSync(new URL('../api/stripe-webhook.js', import.meta.url), 'utf8');
    assert.match(frame, /AW-18372431189/);
    assert.match(frame, /payload\.optOut === true \|\| payload\.consent !== 'granted'/);
    assert.match(frame, /ad_storage: 'denied'/);
    assert.match(frame, /ad_user_data: 'denied'/);
    assert.match(frame, /allow_enhanced_conversions: false/);
    assert.match(frame, /event\.origin !== PARENT/);
    assert.equal(frame.includes('gtm.js'), false);
    assert.equal(join.includes('googletagmanager.com'), false);
    assert.equal(webhook.includes('googletagmanager'), false);
    assert.equal(webhook.includes('gtag'), false);
    const other = adsConfigFromEnv({
      VITE_GOOGLE_ADS_TAG_ID: 'AW-9999999999',
      VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL: 'FutureLabel1',
    });
    assert.equal(other.configured, false);
  });
});

describe('click attribution', () => {
  it('keeps a click id across apex, www, login, and the Stripe return', () => {
    const gclid = 'Cj0KCQjwtestclickid';
    assert.equal(clickIdsFromSearch(`?gclid=${gclid}`).gclid, gclid);
    assert.deepEqual(clickIdsFromSearch('?gclid=ada@example.org'), {});
    const writes = clickCookieWrites({ gclid }, { hostname: 'addictionpas.org', secure: true });
    assert.match(writes[0], /Domain=\.addictionpas\.org/);
    assert.match(writes[0], new RegExp(ADS_CLICK_COOKIE));
    const wwwWrites = clickCookieWrites({ gclid }, { hostname: 'www.addictionpas.org', secure: true });
    assert.match(wwwWrites[0], /Domain=\.addictionpas\.org/);
    const header = writes[0].split(';')[0];
    assert.equal(readAdsClick(header).gclid, gclid);
    assert.equal(
      apexRedirectUrl({ hostname: 'addictionpas.org', href: `https://addictionpas.org/join?gclid=${gclid}` }),
      `https://www.addictionpas.org/join?gclid=${gclid}`,
    );
    const captured = [];
    const blocked = rememberAdsClickFromLocation(
      { hostname: 'www.addictionpas.org', protocol: 'https:', search: `?gclid=${gclid}` },
      { cookieHeader: '', consent: { choice: 'unset', adStorage: 'denied', optOut: false }, writeCookie: (line) => captured.push(line) },
    );
    assert.equal(blocked.wrote, false);
    assert.equal(captured.length, 0);
    const loginNext = '/login?next=%2Fjoin%3Fstep%3Dcheckout';
    assert.doesNotMatch(loginNext, /gclid/);
    const success = checkoutSuccessUrl('https://www.addictionpas.org');
    assert.doesNotMatch(success, /gclid/);
    const allowed = [];
    rememberAdsClickFromLocation(
      { hostname: 'www.addictionpas.org', protocol: 'https:', search: `?gclid=${gclid}` },
      {
        cookieHeader: '',
        consent: { choice: 'granted', adStorage: 'granted', optOut: false, gpc: false },
        gpc: false,
        writeCookie: (line) => allowed.push(line),
      },
    );
    assert.equal(readAdsClick(allowed[0].split(';')[0]).gclid, gclid);
    const cleared = [];
    const removed = rememberAdsClickFromLocation(
      { hostname: 'www.addictionpas.org', protocol: 'https:', search: `?gclid=${gclid}` },
      {
        cookieHeader: allowed[0].split(';')[0],
        consent: effectiveAdsConsent({ choice: 'granted', adStorage: 'granted', optOut: false }, '1'),
        gpc: '1',
        writeCookie: (line) => cleared.push(line),
      },
    );
    assert.equal(removed.cleared, true);
    assert.equal(cleared.some((line) => line.includes(gclid)), false);
    assert.equal(cleared.some((line) => line.includes('Max-Age=0')), true);
  });
});

function pricedLine(cents, name, meta = {}) {
  return {
    amount_total: cents,
    description: name,
    price: { metadata: meta, product: { name, metadata: meta } },
  };
}

describe('membership amount', () => {
  it('counts discounted membership dues and leaves Patron and donations out', () => {
    const mixed = {
      ...PAID_NEW,
      id: 'cs_test_mixed00001',
      amount_total: 7000,
      metadata: { ...PAID_NEW.metadata, patron: 'true' },
      line_items: {
        data: [
          pricedLine(4500, 'Fellow membership'),
          pricedLine(2500, 'Patron add-on', { sampa_addon: 'patron' }),
        ],
      },
    };
    assert.equal(membershipAmountCents(mixed), 4500);
    assert.equal(receiptFor(mixed).value, 45);
    assert.notEqual(receiptFor(mixed).value, 70);

    const withGift = {
      ...PAID_NEW,
      id: 'cs_test_gift000001',
      amount_total: 6000,
      line_items: {
        data: [
          pricedLine(5000, 'Fellow membership'),
          pricedLine(1000, 'Donation', { type: 'donation' }),
        ],
      },
    };
    assert.equal(receiptFor(withGift).value, 50);

    const bundledWithoutLines = {
      ...PAID_NEW,
      id: 'cs_test_nolines001',
      amount_total: 7500,
      metadata: { ...PAID_NEW.metadata, patron: 'true' },
    };
    assert.equal(membershipAmountCents(bundledWithoutLines), null);
    assert.equal(receiptFor(bundledWithoutLines).value, null);
    assert.equal(planMembershipConversion({
      receipt: receiptFor(bundledWithoutLines),
      config: adsConfigFromEnv({ VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL: 'FutureLabel1' }),
      hostname: 'www.addictionpas.org',
      sentIds: new Set(),
      consent: { choice: 'granted', adStorage: 'granted', optOut: false },
    }).send, false);
  });
});

describe('first-payment status', () => {
  it('does not treat a past_due profile as a completed membership without a paid invoice', () => {
    assert.equal(membershipConversionKind(null), 'new_membership');
    assert.equal(membershipConversionKind({}), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: '' }), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'incomplete' }), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'incomplete_expired' }), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'unpaid' }), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'trialing' }), 'new_membership');
    assert.equal(membershipConversionKind({ membership_status: 'active' }), 'renewal');
    assert.equal(membershipConversionKind({ membership_status: 'past_due' }), null);
    assert.equal(membershipConversionKind({ membership_status: 'canceled' }), null);

    const paidMembership = {
      status: 'paid',
      amount_paid: 5000,
      billing_reason: 'subscription_create',
      metadata: { tier: 'fellow', conversion: 'new_membership' },
    };
    const donation = {
      status: 'paid',
      amount_paid: 2500,
      billing_reason: 'subscription_cycle',
      metadata: { type: 'donation' },
    };
    const pastDue = { membership_status: 'past_due', stripe_customer_id: 'cus_test' };
    assert.equal(membershipConversionKind(pastDue, {
      priorPaid: priorPaidFromInvoiceList({ data: [], has_more: false }),
    }), 'new_membership');
    assert.equal(membershipConversionKind(pastDue, {
      priorPaid: priorPaidFromInvoiceList({ data: [donation], has_more: false }),
    }), 'new_membership');
    assert.equal(membershipConversionKind(pastDue, {
      priorPaid: priorPaidFromInvoiceList({ data: [paidMembership], has_more: false }),
    }), 'renewal');
    assert.equal(membershipConversionKind(pastDue, {
      priorPaid: priorPaidFromInvoiceList({ data: [donation], has_more: true }),
    }), null);

    process.env.STRIPE_PRICE_FELLOW_1Y = 'price_fellow_1y';
    const retry = buildCheckoutSessionParams({
      userId: 'user-a',
      email: 'ada@example.org',
      customerId: 'cus_test',
      tier: 'fellow',
      duration: 1,
      origin: 'https://www.addictionpas.org',
      conversion: membershipConversionKind(pastDue, { priorPaid: false }),
    });
    assert.equal(retry.params.metadata.conversion, 'new_membership');
    const unproven = buildCheckoutSessionParams({
      userId: 'user-a',
      email: 'ada@example.org',
      customerId: 'cus_test',
      tier: 'fellow',
      duration: 1,
      origin: 'https://www.addictionpas.org',
      conversion: membershipConversionKind(pastDue, { priorPaid: null }),
    });
    assert.equal(unproven.params.metadata.conversion, undefined);
  });
});

describe('checkout handler history', () => {
  it('does not stamp a new membership when past_due or canceled has no Stripe customer', async () => {
    process.env.STRIPE_PRICE_FELLOW_1Y = 'price_fellow_1y';
    for (const membership_status of ['past_due', 'canceled']) {
      let listed = 0;
      const created = [];
      const response = await POST(new Request('https://www.addictionpas.org/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-host': 'www.addictionpas.org',
          'x-forwarded-proto': 'https',
        },
        body: JSON.stringify({ tier: 'fellow', duration: 1 }),
      }), {
        requireUser: async () => ({ id: 'user-a', email: 'ada@example.org' }),
        loadProfile: async () => ({
          membership_status,
          stripe_customer_id: null,
          renews_on: null,
          cancel_at_period_end: false,
        }),
        listInvoices: async () => { listed += 1; return { data: [], has_more: false }; },
        createSession: async (params) => {
          created.push(params);
          return { url: 'https://checkout.stripe.test/c' };
        },
      });
      assert.equal(response.status, 200);
      assert.equal(listed, 0);
      assert.equal(created.length, 1);
      assert.equal(created[0].metadata.conversion, undefined);
      assert.notEqual(created[0].metadata.conversion, 'new_membership');
    }
  });
});

describe('employer invoices', () => {
  it('does not carry a checkout session id, so no conversion is emitted', () => {
    const source = readFileSync(new URL('../api/create-invoice-request.js', import.meta.url), 'utf8');
    assert.match(source, /\/dashboard\?checkout=success/);
    assert.doesNotMatch(source, /CHECKOUT_SESSION_ID/);
    assert.doesNotMatch(source, /session_id=/);
  });
});

describe('consent', () => {
  const granted = { choice: 'granted', adStorage: 'granted', optOut: false };
  const config = adsConfigFromEnv({ VITE_GOOGLE_ADS_NEW_MEMBERSHIP_LABEL: 'FutureLabel1' });
  const receipt = receiptFor(PAID_NEW);

  it('stays denied until an explicit allow, and an opt-out wins', () => {
    const unset = readAdsConsent('');
    assert.equal(unset.adStorage, 'denied');
    assert.equal(unset.optOut, false);
    assert.equal(planMembershipConversion({
      receipt, config, hostname: 'www.addictionpas.org', sentIds: new Set(), consent: unset,
    }).reason, 'consent');

    const deniedHeader = adsConsentCookieLines('denied', {
      hostname: 'www.addictionpas.org',
      secure: true,
    })[0].split(';')[0];
    const optedOut = readAdsConsent(deniedHeader);
    assert.equal(optedOut.optOut, true);
    assert.equal(planMembershipConversion({
      receipt, config, hostname: 'www.addictionpas.org', sentIds: new Set(), consent: optedOut,
    }).reason, 'opt_out');

    const allowedHeader = adsConsentCookieLines('granted', {
      hostname: 'www.addictionpas.org',
      secure: true,
    })[0].split(';')[0];
    const allowed = readAdsConsent(allowedHeader);
    assert.deepEqual(allowed, granted);
    const doc = fakeDocument();
    assert.equal(mountConversionFrame({
      document: doc,
      payload: { tagId: EXISTING_GOOGLE_ADS_TAG_ID, label: 'FutureLabel1', transactionId: 'cs_test_consent001', value: 50, currency: 'USD', consent: 'granted', optOut: false },
      hostname: 'www.addictionpas.org',
      consent: optedOut,
    }).mounted, false);
    assert.equal(doc.elements.length, 0);
  });

  it('does not mount a frame for a preview host even when consent is granted', () => {
    const doc = fakeDocument();
    assert.equal(mountConversionFrame({
      document: doc,
      payload: { tagId: EXISTING_GOOGLE_ADS_TAG_ID, label: 'FutureLabel1', transactionId: 'cs_test_consent002', value: 50, currency: 'USD', consent: 'granted', optOut: false },
      hostname: 'sampa-website-git-preview.vercel.app',
      consent: granted,
    }).reason, 'off_host');
    assert.equal(doc.elements.length, 0);
  });
});

function loadFrame() {
  const html = readFileSync(new URL('../public/membership-conversion.html', import.meta.url), 'utf8');
  const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const box = { scripts: [], fetches: [], cookies: [], listeners: {} };
  const location = { href: 'https://www.addictionpas.org/membership-conversion.html' };
  const sandbox = {
    JSON, URL, Date, Math, isFinite, encodeURIComponent,
  };
  sandbox.window = {
    addEventListener(type, fn) { box.listeners[type] = fn; },
    location,
    dataLayer: [],
  };
  sandbox.document = {
    head: { appendChild(el) { box.scripts.push(el); } },
    createElement() { return { async: false, src: '' }; },
    set cookie(value) { box.cookies.push(String(value)); },
    get cookie() { return box.cookies.join('; '); },
  };
  sandbox.history = {
    replaceState(_state, _title, next) { location.href = String(next); },
  };
  sandbox.fetch = (...args) => {
    box.fetches.push(args);
    return Promise.resolve({ ok: true });
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(code, sandbox);
  return { box, sandbox, location };
}

function frameMessage(payload) {
  return {
    origin: 'https://www.addictionpas.org',
    data: { source: 'sampa-membership-conversion', payload },
  };
}

function conversionCalls(dataLayer) {
  return dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion');
}

describe('opaque frame network', () => {
  const hit = {
    tagId: EXISTING_GOOGLE_ADS_TAG_ID,
    label: 'FutureLabel1',
    transactionId: 'cs_test_frame00001',
    value: 45,
    currency: 'USD',
    consent: 'granted',
    optOut: false,
    gclid: 'Cj0KCQjwtestclickid',
    gbraid: 'gbraidtestvalue1',
    wbraid: 'wbraidtestvalue1',
  };

  it('attributes the click, sends one hit, and keeps contact data out', () => {
    const { box, sandbox, location } = loadFrame();
    sandbox.window.dispatch = box.listeners.message;
    box.listeners.message(frameMessage(hit));
    box.listeners.message(frameMessage(hit));
    assert.equal(box.scripts.length, 1);
    assert.equal(box.fetches.length, 0);
    assert.equal(box.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(EXISTING_GOOGLE_ADS_TAG_ID)}`);
    assert.equal(box.scripts[0].src.includes('gtm.js'), false);
    assert.match(location.href, /gclid=Cj0KCQjwtestclickid/);
    assert.match(box.cookies.join('\n'), /_gcl_aw=GCL\.\d+\.Cj0KCQjwtestclickid/);
    const events = conversionCalls(sandbox.window.dataLayer);
    assert.equal(events.length, 1);
    assert.equal(events[0][2].transaction_id, hit.transactionId);
    assert.equal(events[0][2].value, 45);
    assert.equal(events[0][2].gclid, hit.gclid);
    assert.equal(events[0][2].gbraid, hit.gbraid);
    assert.equal(events[0][2].wbraid, hit.wbraid);
    const packed = JSON.stringify(sandbox.window.dataLayer);
    assert.equal(packed.includes('"user_data"'), false);
    assert.equal(packed.includes('email'), false);
    assert.equal(packed.includes('@'), false);
    assert.equal(packed.includes('allow_enhanced_conversions":true'), false);
    assert.match(packed, /allow_enhanced_conversions":false/);
    const consentUpdates = sandbox.window.dataLayer.filter((entry) => entry[0] === 'consent');
    assert.equal(consentUpdates[0][1], 'default');
    assert.equal(consentUpdates[0][2].ad_storage, 'denied');
    assert.equal(consentUpdates[0][2].ad_user_data, 'denied');
    assert.equal(consentUpdates[1][2].ad_storage, 'granted');
    assert.equal(consentUpdates[1][2].ad_user_data, 'denied');
    assert.equal(consentUpdates[1][2].ad_personalization, 'denied');
  });

  it('makes no network call without consent or after an opt-out', () => {
    for (const payload of [
      { ...hit, consent: undefined, optOut: false },
      { ...hit, consent: 'granted', optOut: true },
      { ...hit, consent: 'denied', optOut: true },
      { ...hit, consent: 'granted', optOut: false, gpc: true },
      { ...hit, email: 'ada@example.org' },
    ]) {
      const { box, sandbox } = loadFrame();
      box.listeners.message(frameMessage(payload));
      assert.equal(box.scripts.length, 0);
      assert.equal(box.fetches.length, 0);
      assert.equal(box.cookies.length, 0);
      assert.equal(sandbox.window.dataLayer.length, 0);
    }
  });

  it('rejects a message from another origin', () => {
    const { box } = loadFrame();
    box.listeners.message({
      origin: 'https://evil.example',
      data: { source: 'sampa-membership-conversion', payload: hit },
    });
    assert.equal(box.scripts.length, 0);
    assert.equal(box.fetches.length, 0);
  });
});

describe('CI', () => {
  it('runs the membership conversion suite in the only workflow', () => {
    const workflow = readFileSync(new URL('../.github/workflows/my-sampa.yml', import.meta.url), 'utf8');
    assert.match(workflow, /npm run test:membership-conversion/);
    const checkout = readFileSync(new URL('../api/create-checkout-session.js', import.meta.url), 'utf8');
    assert.match(checkout, /expand:\s*\['line_items/);
  });
});
