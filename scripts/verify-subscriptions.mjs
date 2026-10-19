import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  'BREVO_DOI_REDIRECT_URL',
];

const savedEnv = {};
let savedFetch;
let ipCounter = 0;

const UNAVAILABLE = 'Subscription updates are temporarily unavailable. Please try again later.';
const FAILED = 'We could not update subscriptions right now. Please try again in a moment.';

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
  delete process.env.SENDINBLUE_API_KEY;
  delete process.env.BREVO_DOI_REDIRECT_URL;
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

function manageBody(lists, email = 'Reader@Example.com') {
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

test('checked daily and weekly subscribe, and unchecked topic is removed', async () => {
  const calls = captureFetch();
  const res = await post(manageBody({ daily: true, weekly: true, topic: false }));
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.deepEqual(payload, { ok: true });
  assert.equal(JSON.stringify(payload).includes('reader@example.com'), false);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].apiKey, 'test-key');
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
  assert.deepEqual(calls[0].body, {
    email: 'reader@example.com',
    includeListIds: [15],
    templateId: 35,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed?list=daily',
    attributes: { SOURCE: 'manage_daily' },
  });
  assert.equal(calls[1].url, 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
  assert.deepEqual(calls[1].body, {
    email: 'reader@example.com',
    includeListIds: [3],
    templateId: 13,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed',
    attributes: { SOURCE: 'manage_weekly' },
  });
  assert.equal(calls[2].url, 'https://api.brevo.com/v3/contacts/lists/18/contacts/remove');
  assert.deepEqual(calls[2].body, { emails: ['reader@example.com'] });
});

test('a checked topic list without a template does not send topic DOI', async () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    const calls = captureFetch();
    const res = await post(manageBody({ daily: true, weekly: false, topic: true }));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(calls.filter((call) => call.url.includes('doubleOptinConfirmation')).length, 1);
    assert.equal(calls.some((call) => call.body?.includeListIds?.[0] === 18), false);
    assert.equal(calls.some((call) => call.url.endsWith('/lists/18/contacts/remove')), false);
    const warning = warnings.join('\n');
    assert.match(warning, /TODO: set BREVO_DOI_TEMPLATE_TOPIC/);
    assert.match(warning, /Weekly Topic Roundup double opt-in email cannot be sent until that template id is set in Vercel/);
  } finally {
    console.warn = original;
  }
});

test('a checked topic list sends DOI with the topic template and redirect', async () => {
  process.env.BREVO_DOI_TEMPLATE_TOPIC = '40';
  const calls = captureFetch();
  const res = await post(manageBody({ daily: false, weekly: false, topic: true }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  const topic = calls.find((call) => call.url.includes('doubleOptinConfirmation'));
  assert.ok(topic);
  assert.equal(topic.body.templateId, 40);
  assert.deepEqual(topic.body.includeListIds, [18]);
  assert.equal(topic.body.attributes.SOURCE, 'manage_topic');
  assert.equal(
    topic.body.redirectionUrl,
    'https://preview.example.test/newsletter-confirmed?list=topic',
  );
});

test('unchecking all three lists removes them and does not send DOI', async () => {
  const calls = captureFetch();
  const res = await post(manageBody({ daily: false, weekly: false, topic: false }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.filter((call) => call.url.includes('doubleOptinConfirmation')).length, 0);
  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.brevo.com/v3/contacts/lists/15/contacts/remove',
    'https://api.brevo.com/v3/contacts/lists/3/contacts/remove',
    'https://api.brevo.com/v3/contacts/lists/18/contacts/remove',
  ]);
});

test('a remove 404 still returns ok', async () => {
  const calls = captureFetch(404);
  const res = await post(manageBody({ daily: false, weekly: false, topic: false }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 3);
});

test('a remove 400 for an unknown address still returns ok', async () => {
  const calls = captureFetch(400, { message: 'Contact does not exist' });
  const res = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 3);
});

test('DOI 204 and a duplicate DOI still return ok', async () => {
  const created = captureFetch(204);
  const createdRes = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.equal(createdRes.status, 200);
  assert.deepEqual(await createdRes.json(), { ok: true });
  assert.equal(created.filter((call) => call.url.includes('doubleOptinConfirmation')).length, 1);

  const duplicate = captureFetch((url) => (
    url.includes('doubleOptinConfirmation')
      ? { status: 400, payload: { code: 'duplicate_parameter', message: 'Contact already exist' } }
      : { status: 204 }
  ));
  const duplicateRes = await post(manageBody({ daily: false, weekly: true, topic: false }));
  assert.equal(duplicateRes.status, 200);
  assert.deepEqual(await duplicateRes.json(), { ok: true });
  assert.equal(duplicate.length, 3);
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
    const res = await post(manageBody({ daily: false, weekly: false, topic: false }));
    assert.equal(res.status, 503);
    const payload = await res.json();
    assert.deepEqual(payload, { error: UNAVAILABLE });
    assert.equal(JSON.stringify(payload).includes('reader@example.com'), false);
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

test('a Brevo failure returns a generic 502', async () => {
  const calls = captureFetch(500, { message: 'reader@example.com exploded', list: 'topic' });
  const res = await post(manageBody({ daily: true, weekly: false, topic: false }));
  assert.equal(res.status, 502);
  const payload = await res.json();
  assert.deepEqual(payload, { error: FAILED });
  assert.equal(JSON.stringify(payload).includes('reader@example.com'), false);
  assert.equal(JSON.stringify(payload).includes('topic'), false);
  assert.equal(calls.length, 1);
});

test('the ninth manage request from one IP is limited and signup is not', async () => {
  const ip = '198.51.100.90';
  const calls = captureFetch();
  const signup = await post({ email: 'reader@example.com', list: 'daily' }, ip);
  assert.equal(signup.status, 200);
  assert.deepEqual(await signup.json(), { ok: true, pending: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.attributes.SOURCE, 'daily_roundup_signup');

  const body = manageBody({ daily: false, weekly: false, topic: false }, 'reader@example.com');
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
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
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
  assert.match(page, /unchecked lists are removed/);
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const route = app.indexOf('path="/subscriptions"');
  const catchAll = app.indexOf('path="*"');
  assert.ok(route !== -1 && catchAll !== -1 && route < catchAll);
});
