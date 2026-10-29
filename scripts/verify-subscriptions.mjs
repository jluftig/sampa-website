import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, test } from 'node:test';
import { POST } from '../api/newsletter-signup.js';

const ENV_KEYS = [
  'BREVO_API_KEY',
  'SENDINBLUE_API_KEY',
  'BREVO_LIST_DAILY_NEWS',
  'BREVO_LIST_UPDATES',
  'BREVO_LIST_TOPIC',
  'BREVO_DOI_TEMPLATE_ID_DAILY',
  'BREVO_DOI_TEMPLATE_ID',
  'BREVO_DOI_TEMPLATE_TOPIC',
  'BREVO_DOI_TEMPLATE_DAILY',
  'BREVO_LIST_DAILY',
  'BREVO_LIST_WEEKLY',
  'BREVO_DOI_REDIRECT_URL',
  'SUBSCRIPTION_TOKEN_SECRET',
];

const savedEnv = {};
let savedFetch;
let ipCounter = 0;

const UNAVAILABLE = 'Subscription updates are temporarily unavailable. Please try again later.';
const PARTIAL = 'Some choices could not be saved. Please try again in a moment.';
const INVALID_LINK = 'That confirmation link is invalid or has expired. Please start again from Manage subscriptions.';

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  savedFetch = globalThis.fetch;
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_LIST_DAILY_NEWS = '15';
  process.env.BREVO_LIST_UPDATES = '3';
  process.env.BREVO_LIST_TOPIC = '18';
  process.env.BREVO_DOI_TEMPLATE_ID_DAILY = '35';
  process.env.BREVO_DOI_TEMPLATE_ID = '13';
  delete process.env.BREVO_DOI_TEMPLATE_TOPIC;
  delete process.env.BREVO_DOI_TEMPLATE_DAILY;
  delete process.env.BREVO_LIST_DAILY;
  delete process.env.BREVO_LIST_WEEKLY;
  delete process.env.SENDINBLUE_API_KEY;
  delete process.env.BREVO_DOI_REDIRECT_URL;
  delete process.env.SUBSCRIPTION_TOKEN_SECRET;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  globalThis.fetch = savedFetch;
});

function nextIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function post(body, ip = nextIp()) {
  const headers = { 'content-type': 'application/json' };
  if (ip) headers['x-forwarded-for'] = ip;
  return POST(new Request('https://preview.example.test/api/newsletter-signup', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }));
}

let emailCounter = 0;
let lastEmail = '';
// Fresh address per call so the per-address email throttle never carries over.
function manageBody(lists, email) {
  if (!email) {
    emailCounter += 1;
    email = `Reader${emailCounter}@Example.com`;
  }
  lastEmail = email.toLowerCase();
  return { email, lists };
}

function captureFetch(status = 201, payload = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({
      url: String(url),
      body,
      apiKey: init?.headers?.['api-key'],
    });
    const result = typeof status === 'function'
      ? status(String(url), body)
      : { status, payload };
    const code = result.status ?? 201;
    if (code === 204) return new Response(null, { status: code });
    return new Response(JSON.stringify(result.payload ?? {}), {
      status: code,
      headers: { 'content-type': 'application/json' },
    });
  };
  return calls;
}

const DOI = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
const SMTP = 'https://api.brevo.com/v3/smtp/email';
const CONTACT_PREFIX = 'https://api.brevo.com/v3/contacts/';

// Default Brevo: DOI/remove/smtp succeed, and the contact is on lists 15, 3 and 18.
function brevo(overrides = {}, listIds = [15, 3, 18]) {
  return captureFetch((url, body) => {
    for (const [match, result] of Object.entries(overrides)) {
      if (url.includes(match)) return typeof result === 'function' ? result(url, body) : result;
    }
    if (url.startsWith(CONTACT_PREFIX) && !url.slice(CONTACT_PREFIX.length).includes('/') && !url.endsWith('doubleOptinConfirmation')) return { status: 200, payload: { listIds } };
    return { status: url.includes('/remove') || url.includes('doubleOptin') ? 204 : 201 };
  });
}

function removalLink(calls) {
  const mail = calls.find((call) => call.url === SMTP);
  assert.ok(mail, 'a confirmation email was sent');
  const match = mail.body.textContent.match(/Confirm: (\S+)/);
  const url = new URL(match[1]);
  return { mail, token: url.searchParams.get('confirm'), url };
}

test('checked lists start DOI and unchecked lists are never removed on the first request', async () => {
  const calls = brevo();
  const res = await post(manageBody({ daily: true, weekly: true, topic: false }));
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.deepEqual(payload, { ok: true, notOpen: [], sentDoi: true });
  assert.equal(calls.some((call) => call.url.includes('/contacts/remove')), false);
  const dois = calls.filter((call) => call.url === DOI);
  assert.equal(dois.length, 2);
  assert.deepEqual(dois[0].body, {
    email: lastEmail,
    includeListIds: [15],
    templateId: 35,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed?list=daily',
    attributes: { SOURCE: 'manage_daily' },
  });
  assert.deepEqual(dois[1].body.includeListIds, [3]);
  assert.equal(dois[1].body.redirectionUrl, 'https://preview.example.test/newsletter-confirmed?list=weekly');
  assert.equal(calls.filter((call) => call.url === SMTP).length, 1);
});

test('unchecked lists email a signed link to the address and remove nothing', async () => {
  const calls = brevo();
  const res = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.equal(res.status, 200);
  const { mail, token, url } = removalLink(calls);
  assert.deepEqual(mail.body.to, [{ email: lastEmail }]);
  // Untrusted hosts never appear in the emailed removal link.
  assert.equal(url.origin + url.pathname, 'https://www.addictionpas.org/subscriptions');
  assert.ok(token.includes('.'));
  assert.match(mail.body.textContent, /Daily News Roundup/);
  assert.match(mail.body.textContent, /Weekly Topic Roundup/);
  assert.equal(mail.body.textContent.includes('Weekly Newsletter'), false);
  assert.equal(calls.some((call) => call.url.includes('/contacts/remove')), false);
});

test('the response is identical whether or not the address is on a list', async () => {
  const onList = brevo({}, [15]);
  const a = await post(manageBody({ daily: false, weekly: true, topic: true }));
  const bodyA = await a.json();
  assert.equal(onList.filter((call) => call.url === SMTP).length, 1);

  const notOnList = brevo({}, []);
  const b = await post(manageBody({ daily: false, weekly: true, topic: true }, 'other@example.com'));
  const bodyB = await b.json();
  const notFound = brevo({ '/contacts/other': { status: 404, payload: {} } });
  const c = await post(manageBody({ daily: false, weekly: true, topic: true }, 'other@example.com'));
  assert.equal(notOnList.some((call) => call.url === SMTP), false);
  assert.equal(notFound.some((call) => call.url === SMTP), false);
  assert.equal(a.status, b.status);
  assert.deepEqual(bodyA, bodyB);
  assert.deepEqual(bodyA, await c.json());
});

test('the removal email is throttled per address without changing the response', async () => {
  const calls = brevo();
  const email = 'throttle@example.com';
  for (let i = 0; i < 5; i += 1) {
    const res = await post(manageBody({ daily: false, weekly: true, topic: true }, email));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, notOpen: ['topic'], sentDoi: true });
  }
  assert.equal(calls.filter((call) => call.url === SMTP).length, 3);
});

test('confirming the emailed link removes only the signed lists', async () => {
  const sent = brevo();
  await post(manageBody({ daily: false, weekly: true, topic: false }));
  const { token } = removalLink(sent);
  const confirmedEmail = lastEmail;

  const calls = brevo();
  const res = await post({ confirm: token });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, removed: ['daily', 'topic'] });
  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.brevo.com/v3/contacts/lists/15/contacts/remove',
    'https://api.brevo.com/v3/contacts/lists/18/contacts/remove',
  ]);
  assert.deepEqual(calls[0].body, { emails: [confirmedEmail] });
});

test('tampered, expired, and malformed confirm tokens remove nothing', async () => {
  const sent = brevo();
  await post(manageBody({ daily: false, weekly: true, topic: true }));
  const { token } = removalLink(sent);
  const [payload, sig] = token.split('.');

  const forged = Buffer.from(JSON.stringify({ e: 'victim@example.com', l: ['daily'], x: Date.now() + 1e6 })).toString('base64url');
  const key = createHmac('sha256', 'test-key').update('sampa-subscription-removal-v1').digest('hex');
  const expired = Buffer.from(JSON.stringify({ e: lastEmail, l: ['daily'], x: Date.now() - 1000 })).toString('base64url');
  const expiredSig = createHmac('sha256', key).update(expired).digest('base64url');
  const cases = [
    `${forged}.${sig}`,
    `${payload}.${sig.slice(0, -2)}AA`,
    `${expired}.${expiredSig}`,
    payload,
    'garbage',
    '',
  ];
  const calls = brevo();
  for (const bad of cases) {
    const res = await post({ confirm: bad });
    assert.equal(res.status, 400, bad);
    assert.deepEqual(await res.json(), { error: INVALID_LINK });
  }
  assert.equal(calls.length, 0);
});

test('a token signed with the explicit secret is rejected after the secret changes', async () => {
  process.env.SUBSCRIPTION_TOKEN_SECRET = 'secret-one';
  const sent = brevo();
  await post(manageBody({ daily: false, weekly: true, topic: true }));
  const { token } = removalLink(sent);
  process.env.SUBSCRIPTION_TOKEN_SECRET = 'secret-two';
  const calls = brevo();
  const res = await post({ confirm: token });
  assert.equal(res.status, 400);
  assert.equal(calls.length, 0);
});

test('a checked topic list without a template is reported as not open and not sent', async () => {
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(' '));
  try {
    const calls = brevo();
    const res = await post(manageBody({ daily: false, weekly: true, topic: true }));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, notOpen: ['topic'], sentDoi: true });
    assert.equal(calls.some((call) => call.body?.includeListIds?.[0] === 18), false);
    assert.equal(calls.some((call) => call.url === DOI && call.body?.includeListIds?.includes(18)), false);
    assert.match(logs.join('\n'), /newsletter-signup: BREVO_DOI_TEMPLATE_TOPIC is unset; no contact was written/);
  } finally {
    console.error = original;
  }
});

test('only an unopened topic checked writes no contact and sends no mail', async () => {
  const calls = brevo({}, []);
  const res = await post(manageBody({ daily: false, weekly: false, topic: true }));
  assert.deepEqual(await res.json(), { ok: true, notOpen: ['topic'], sentDoi: false });
  assert.equal(calls.some((call) => call.url === DOI || call.url === SMTP || call.url.includes('/remove')), false);
  assert.equal(calls.some((call) => call.body?.includeListIds?.includes(18)), false);
});

test('three checked lists send the site confirm URLs and ignore other env names', async () => {
  process.env.BREVO_DOI_TEMPLATE_TOPIC = '59';
  process.env.BREVO_DOI_REDIRECT_URL = 'https://evil.example/override';
  process.env.BREVO_DOI_TEMPLATE_DAILY = '99';
  process.env.BREVO_LIST_DAILY = '99';
  process.env.BREVO_LIST_WEEKLY = '99';
  const calls = brevo({}, []);
  const res = await post(manageBody({ daily: true, weekly: true, topic: true }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, notOpen: [], sentDoi: true });
  const dois = calls.filter((call) => call.url === DOI);
  const byList = Object.fromEntries(dois.map((call) => [call.body.includeListIds[0], call.body]));
  assert.equal(dois.length, 3);
  assert.equal(byList[15].templateId, 35);
  assert.equal(byList[15].redirectionUrl, 'https://preview.example.test/newsletter-confirmed?list=daily');
  assert.equal(byList[3].templateId, 13);
  assert.equal(byList[3].redirectionUrl, 'https://preview.example.test/newsletter-confirmed?list=weekly');
  assert.equal(byList[18].templateId, 59);
  assert.equal(byList[18].redirectionUrl, 'https://preview.example.test/newsletter-confirmed?list=topic');
  assert.equal(calls.some((call) => JSON.stringify(call.body).includes('evil.example')), false);
  assert.equal(calls.some((call) => call.body?.includeListIds?.includes(99)), false);
});

test('a checked topic list sends DOI with the topic template and redirect', async () => {
  process.env.BREVO_DOI_TEMPLATE_TOPIC = '40';
  const calls = brevo({}, []);
  const res = await post(manageBody({ daily: false, weekly: false, topic: true }));
  assert.deepEqual(await res.json(), { ok: true, notOpen: [], sentDoi: true });
  const topic = calls.find((call) => call.url === DOI);
  assert.equal(topic.body.templateId, 40);
  assert.deepEqual(topic.body.includeListIds, [18]);
  assert.equal(topic.body.attributes.SOURCE, 'manage_topic');
  assert.equal(topic.body.redirectionUrl, 'https://preview.example.test/newsletter-confirmed?list=topic');
});

test('a partial DOI failure still tries every list and reports which failed', async () => {
  const calls = brevo({
    '"x"': { status: 204 },
  });
  const seen = [];
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    seen.push({ url: String(url), body });
    if (String(url) === DOI && body.includeListIds[0] === 15) {
      return new Response(JSON.stringify({ message: 'boom' }), { status: 500 });
    }
    return new Response(null, { status: 204 });
  };
  const res = await post(manageBody({ daily: true, weekly: true, topic: false }));
  assert.equal(res.status, 502);
  const payload = await res.json();
  assert.deepEqual(payload, { ok: false, error: PARTIAL, failed: ['daily'], notOpen: [], sentDoi: true });
  assert.equal(seen.filter((call) => call.url === DOI).length, 2);
  assert.equal(calls.length, 0);
});

test('a thrown network error on one list does not stop the others', async () => {
  const seen = [];
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    seen.push({ url: String(url), body });
    if (String(url) === DOI && body.includeListIds[0] === 15) throw new Error('network down');
    return new Response(null, { status: 204 });
  };
  const res = await post(manageBody({ daily: true, weekly: true, topic: false }));
  assert.equal(res.status, 502);
  assert.deepEqual((await res.json()).failed, ['daily']);
  assert.equal(seen.filter((call) => call.url === DOI).length, 2);
});

test('a partial removal failure on confirm reports what was and was not removed', async () => {
  const sent = brevo();
  await post(manageBody({ daily: false, weekly: true, topic: false }));
  const { token } = removalLink(sent);
  const calls = brevo({ '/lists/15/': { status: 500, payload: { message: 'down' } } });
  const res = await post({ confirm: token });
  assert.equal(res.status, 502);
  assert.deepEqual(await res.json(), { ok: false, error: PARTIAL, removed: ['topic'], failed: ['daily'] });
  assert.equal(calls.length, 2);
});

test('removal 404 and "not on list" 400 count as removed, but invalid_parameter does not', async () => {
  const sent = brevo();
  await post(manageBody({ daily: false, weekly: true, topic: false }));
  const { token } = removalLink(sent);

  brevo({ '/remove': { status: 404, payload: {} } });
  assert.equal((await post({ confirm: token })).status, 200);

  brevo({ '/remove': { status: 400, payload: { code: 'invalid_parameter', message: 'Contact already removed from list and/or does not exist' } } });
  assert.equal((await post({ confirm: token })).status, 200);

  brevo({ '/remove': { status: 400, payload: { code: 'invalid_parameter', message: 'Invalid emails parameter' } } });
  const bad = await post({ confirm: token });
  assert.equal(bad.status, 502);
  assert.deepEqual((await bad.json()).failed, ['daily', 'topic']);
});

test('DOI 204 and a duplicate DOI still count as sent', async () => {
  const created = brevo({}, []);
  const createdRes = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.deepEqual(await createdRes.json(), { ok: true, notOpen: [], sentDoi: true });
  assert.equal(created.filter((call) => call.url === DOI).length, 1);

  brevo({ [DOI]: { status: 400, payload: { code: 'duplicate_parameter', message: 'Contact already exist' } } }, []);
  const duplicateRes = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.equal(duplicateRes.status, 200);
});

test('honeypot company or website returns ok and does not call Brevo', async () => {
  for (const extra of [{ company: 'Acme' }, { website: 'https://spam.example' }]) {
    const calls = captureFetch();
    const res = await post({
      email: 'bot@example.com',
      lists: { daily: true, weekly: true, topic: true },
      ...extra,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(calls.length, 0);
  }
});

test('an invalid email is rejected before Brevo', async () => {
  const calls = captureFetch();
  const res = await post(manageBody({ daily: true, weekly: false, topic: false }, 'not-an-email'));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Please enter a valid email address.' });
  assert.equal(calls.length, 0);
});

test('no checked list is rejected and does not email a removal', async () => {
  const calls = captureFetch();
  const res = await post(manageBody({ daily: false, weekly: false, topic: false }));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Choose at least one newsletter.' });
  assert.equal(calls.length, 0);
});

test('non-boolean list choices are rejected before Brevo', async () => {
  const calls = captureFetch();
  const cases = [
    { daily: 'true', weekly: false, topic: false },
    { daily: true, weekly: false },
    { daily: 1, weekly: false, topic: false },
  ];
  for (const lists of cases) {
    const res = await post(manageBody(lists));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Choose the lists to update.' });
  }
  assert.equal(calls.length, 0);
});

test('a missing API key returns 503 and does not call Brevo', async () => {
  delete process.env.BREVO_API_KEY;
  delete process.env.SENDINBLUE_API_KEY;
  const calls = captureFetch();
  const res = await post(manageBody({ daily: true, weekly: true, topic: true }));
  assert.equal(res.status, 503);
  const payload = await res.json();
  assert.deepEqual(payload, { error: UNAVAILABLE });
  assert.equal(JSON.stringify(payload).includes('reader@example.com'), false);
  assert.equal(calls.length, 0);
});

test('a missing list id returns 503 without the email or env name', async () => {
  delete process.env.BREVO_LIST_TOPIC;
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.map(String).join(' '));
  try {
    const calls = captureFetch();
    const res = await post(manageBody({ daily: true, weekly: false, topic: false }));
    assert.equal(res.status, 503);
    const payload = await res.json();
    assert.deepEqual(payload, { error: UNAVAILABLE });
    assert.equal(JSON.stringify(payload).includes('BREVO_LIST_TOPIC'), false);
    assert.match(errors.join('\n'), /BREVO_LIST_TOPIC/);
    assert.equal(calls.length, 0);
  } finally {
    console.error = original;
  }
});

test('manage daily does not fall back to the updates template', async () => {
  delete process.env.BREVO_DOI_TEMPLATE_ID_DAILY;
  const calls = captureFetch();
  const res = await post(manageBody({ daily: true, weekly: false, topic: false }));
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: UNAVAILABLE });
  assert.equal(calls.length, 0);
});

test('a Brevo failure returns a generic 502 that names no email', async () => {
  captureFetch(500, { message: 'reader@example.com exploded' });
  const res = await post(manageBody({ daily: true, weekly: false, topic: true }));
  assert.equal(res.status, 502);
  const payload = await res.json();
  assert.equal(payload.error, PARTIAL);
  assert.equal(JSON.stringify(payload).includes('reader@example.com'), false);
});

test('the ninth manage request from one IP is limited and signup is not', async () => {
  const ip = '198.51.100.90';
  const calls = brevo({}, []);
  const signup = await post({ email: 'reader@example.com', list: 'daily' }, ip);
  assert.equal(signup.status, 200);
  assert.deepEqual(await signup.json(), { ok: true, pending: true });
  assert.equal(calls[0].body.attributes.SOURCE, 'daily_roundup_signup');

  const body = manageBody({ daily: true, weekly: false, topic: false }, 'reader@example.com');
  for (let i = 0; i < 8; i += 1) {
    const res = await post(body, ip);
    assert.equal(res.status, 200);
  }
  const before = calls.length;
  const limited = await post(body, ip);
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: 'Please try again in a moment.' });
  assert.equal(calls.length, before);

  const again = await post({ email: 'reader@example.com', list: 'daily' }, ip);
  assert.equal(again.status, 200);
  assert.equal(calls.length, before + 1);
});

test('a body without lists still starts updates double opt-in', async () => {
  const calls = captureFetch();
  const res = await post({ email: 'reader@example.com' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, pending: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, DOI);
  assert.deepEqual(calls[0].body, {
    email: 'reader@example.com',
    includeListIds: [3],
    templateId: 13,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed',
    attributes: { SOURCE: 'public_signup' },
  });
});

test('the subscriptions page names the three lists and the removal warning', () => {
  const page = readFileSync(new URL('../src/pages/Subscriptions.jsx', import.meta.url), 'utf8');
  assert.match(page, /Daily News Roundup/);
  assert.match(page, /Weekly Newsletter/);
  assert.match(page, /Weekly Topic Roundup/);
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const route = app.indexOf('path="/subscriptions"');
  const catchAll = app.indexOf('path="*"');
  assert.ok(route !== -1 && catchAll !== -1 && route < catchAll);
});
