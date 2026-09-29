import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, beforeEach, test } from 'node:test';
import { collectRoundups, formatRoundupDate } from '../src/lib/dailyNewsLoad.js';
import { POST } from '../api/newsletter-signup.js';
import { GET as shareGet } from '../api/share.js';

const ENV_KEYS = [
  'BREVO_API_KEY',
  'SENDINBLUE_API_KEY',
  'BREVO_LIST_UPDATES',
  'BREVO_LIST_DAILY_NEWS',
  'BREVO_DOI_TEMPLATE_ID',
  'BREVO_DOI_TEMPLATE_ID_DAILY',
  'BREVO_DOI_REDIRECT_URL',
];

const savedEnv = {};
let savedFetch;

function item(overrides = {}) {
  return {
    headline: 'Headline',
    outlet: 'Outlet',
    date: 'Sep 28',
    summary: 'Two sentences. A third.',
    url: 'https://example.com/story',
    ...overrides,
  };
}

function file(date, items = [item()]) {
  return { date, title: 'Addiction Daily Roundup', items };
}

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  savedFetch = globalThis.fetch;
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_LIST_UPDATES = '3';
  process.env.BREVO_DOI_TEMPLATE_ID = '13';
  delete process.env.BREVO_LIST_DAILY_NEWS;
  delete process.env.BREVO_DOI_TEMPLATE_ID_DAILY;
  delete process.env.BREVO_DOI_REDIRECT_URL;
  delete process.env.SENDINBLUE_API_KEY;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  globalThis.fetch = savedFetch;
});

function post(body, url = 'https://preview.example.test/api/newsletter-signup') {
  return POST(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

function captureFetch(status = 201, payload = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (status === 204) return new Response(null, { status });
    return new Response(JSON.stringify(payload), { status });
  };
  return calls;
}

test('collectRoundups keeps a valid file, skips a bad file, and sorts newest first', () => {
  const warnings = [];
  const eight = Array.from({ length: 8 }, (_, index) =>
    item({ url: `https://example.com/${index}` }),
  );
  const roundups = collectRoundups(
    {
      '/content/daily-news/2026-09-28.json': file('2026-09-28', [
        item({ url: 'https://example.com/older' }),
      ]),
      '/content/daily-news/2026-09-29.json': file('2026-09-29', [
        item({ headline: 'Kept', url: 'https://example.com/kept' }),
      ]),
      '/content/daily-news/2026-09-30.json': file('2026-09-01', [item()]),
      '/content/daily-news/notes.json': file('2026-09-29', [item()]),
      '/content/daily-news/2026-09-27.json': file('2026-09-27', [
        item({ url: 'http://example.com/insecure' }),
      ]),
      '/content/daily-news/2026-09-26.json': file('2026-09-26', []),
      '/content/daily-news/2026-09-25.json': file('2026-09-25', eight),
      '/content/daily-news/2026-09-24.json': file('2026-09-24', [
        item({ headline: '  ' }),
      ]),
    },
    (message) => warnings.push(message),
  );

  assert.deepEqual(
    roundups.map((roundup) => roundup.date),
    ['2026-09-29', '2026-09-28'],
  );
  assert.equal(roundups[0].items[0].headline, 'Kept');
  assert.equal(roundups[0].items[0].url, 'https://example.com/kept');
  assert.equal(warnings.length, 6);
  assert.ok(warnings.some((message) => message.includes('2026-09-30.json') && message.includes('filename')));
  assert.ok(warnings.some((message) => message.includes('notes.json')));
  assert.ok(warnings.some((message) => message.includes('2026-09-27.json')));
  assert.ok(warnings.some((message) => message.includes('2026-09-26.json')));
  assert.ok(warnings.some((message) => message.includes('2026-09-25.json')));
  assert.ok(warnings.some((message) => message.includes('2026-09-24.json')));
});

test('seed file for 2026-09-29 loads with the published source URLs', () => {
  const seed = JSON.parse(readFileSync('content/daily-news/2026-09-29.json', 'utf8'));
  const warnings = [];
  const roundups = collectRoundups(
    { '/content/daily-news/2026-09-29.json': seed },
    (message) => warnings.push(message),
  );
  assert.equal(warnings.length, 0);
  assert.equal(roundups.length, 1);
  assert.equal(formatRoundupDate(roundups[0].date), 'Tuesday, September 29, 2026');
  assert.deepEqual(
    roundups[0].items.map((entry) => entry.url),
    [
      'https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2854606',
      'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2854496',
      'https://today.ucsd.edu/story/one-in-nine-older-adults-who-use-cannabis-meet-criteria-for-cannabis-use-disorder',
      'https://www.aha.org/news/headline/2026-09-28-hrsa-awards-nearly-90-million-addiction-recovery-services-rural-areas',
      'https://www.cdc.gov/mmwr/volumes/75/wr/mm7533a2.htm',
    ],
  );
});

test('daily signup returns 503 when BREVO_LIST_DAILY_NEWS is unset', async () => {
  const calls = captureFetch();
  const res = await post({ email: 'reader@example.com', list: 'daily' });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), {
    error: 'Daily email signup is coming soon. Please check back.',
  });
  assert.equal(calls.length, 0);
});

test('daily signup maps list daily server-side and ignores a client list id', async () => {
  process.env.BREVO_LIST_DAILY_NEWS = '77';
  process.env.BREVO_DOI_TEMPLATE_ID_DAILY = '21';
  const calls = captureFetch(204);
  const res = await post({
    email: 'Reader@Example.com',
    list: 'daily',
    listId: 42,
    includeListIds: [42],
  });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
  assert.deepEqual(calls[0].body, {
    email: 'reader@example.com',
    includeListIds: [77],
    templateId: 21,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed?list=daily',
    attributes: { SOURCE: 'daily_roundup_signup' },
  });
});

test('a numeric list value stays on SAMPA Updates', async () => {
  process.env.BREVO_LIST_DAILY_NEWS = '77';
  process.env.BREVO_DOI_REDIRECT_URL = 'https://www.addictionpas.org/newsletter-confirmed';
  const calls = captureFetch();
  const res = await post({ email: 'reader@example.com', list: 77, listId: 77 });
  assert.equal(res.status, 200);
  assert.deepEqual(calls[0].body.includeListIds, [3]);
  assert.equal(calls[0].body.templateId, 13);
  assert.equal(calls[0].body.attributes.SOURCE, 'public_signup');
  assert.equal(
    calls[0].body.redirectionUrl,
    'https://www.addictionpas.org/newsletter-confirmed',
  );
});

test('default signup path is unchanged when list is omitted', async () => {
  const calls = captureFetch();
  const res = await post({ email: 'reader@example.com', company: '' });
  assert.equal(res.status, 200);
  assert.deepEqual(calls[0].body, {
    email: 'reader@example.com',
    includeListIds: [3],
    templateId: 13,
    redirectionUrl: 'https://preview.example.test/newsletter-confirmed',
    attributes: { SOURCE: 'public_signup' },
  });
});

test('a filled honeypot pretends to succeed and does not call Brevo', async () => {
  const calls = captureFetch();
  const res = await post({ email: 'bot@example.com', company: 'Acme', list: 'daily' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, pending: true });
  assert.equal(calls.length, 0);
});

test('duplicate Brevo contacts still look like a fresh signup', async () => {
  const calls = captureFetch(400, { code: 'duplicate_parameter', message: 'Contact already exist' });
  const res = await post({ email: 'reader@example.com' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, pending: true });
  assert.equal(calls.length, 1);
});

test('share slug daily is a 200 SAMPA Daily Roundup page', async () => {
  globalThis.fetch = async () => {
    throw new Error('supabase should not be called for the daily slug');
  };
  const res = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=daily'));
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<title>SAMPA Daily Roundup<\/title>/);
  assert.match(html, /href="https:\/\/www\.addictionpas\.org\/news\/daily"/);
});

test('api stays at the Hobby plan limit of 12 functions', () => {
  const functions = readdirSync('api').filter((name) => name.endsWith('.js'));
  assert.equal(functions.length, 12);
  assert.ok(functions.includes('newsletter-signup.js'));
});
