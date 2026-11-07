import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { GET } from '../api/create-checkout-session.js';
import {
  buildCheckoutSessionParams,
  checkoutSuccessUrl,
  membershipConversionKind,
} from '../api/_lib/checkoutSession.js';
import {
  classifyCheckoutSession,
  publicReceipt,
} from '../api/_lib/membershipReceipt.js';
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
    assert.equal(membershipConversionKind({ membership_status: 'canceled' }), 'renewal');
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
        payload: { tagId: EXISTING_GOOGLE_ADS_TAG_ID, label: 'FutureLabel1', transactionId: 'cs_test_preview001', value: 50, currency: 'USD' },
        hostname,
      }).mounted, false);
      assert.equal(doc.elements.length, 0);
    }
  });

  it('sends one conversion for a paid new membership and ignores a repeat', () => {
    const storage = memoryStore();
    const doc = fakeDocument();
    const first = reportVerifiedMembershipConversion({
      confirmation: { sendConversion: true },
      receipt,
      config,
      hostname: 'www.addictionpas.org',
      click: { gclid: 'Cj0KCQjwtestclickid' },
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
    rememberAdsClickFromLocation(
      { hostname: 'www.addictionpas.org', protocol: 'https:', search: `?gclid=${gclid}` },
      { cookieHeader: '', writeCookie: (line) => captured.push(line) },
    );
    assert.match(captured[0], new RegExp(ADS_CLICK_COOKIE));
    const loginNext = '/login?next=%2Fjoin%3Fstep%3Dcheckout';
    assert.doesNotMatch(loginNext, /gclid/);
    assert.equal(readAdsClick(captured[0].split(';')[0]).gclid, gclid);
    const success = checkoutSuccessUrl('https://www.addictionpas.org');
    assert.doesNotMatch(success, /gclid/);
    assert.equal(readAdsClick(captured[0].split(';')[0]).gclid, gclid);
  });
});
