import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import { GET, POST } from '../api/newsletter-stats.js';
import { handleEmailPreferences } from '../api/_lib/email-preferences.js';
import { resolveEmailLists, shapeEmailPreferences } from '../src/lib/emailLists.js';

const ENV = {
  BREVO_API_KEY: 'test-key',
  BREVO_LIST_UPDATES: '3',
  BREVO_LIST_DAILY_NEWS: '15',
  BREVO_LIST_WEEKLY_TOPIC: '42',
};

function request(method, body) {
  return new Request(
    'https://www.addictionpas.org/api/newsletter-stats?section=email-preferences',
    {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
}

function stubFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({
      url,
      method: init.method || 'GET',
      body: init.body ? JSON.parse(init.body) : null,
      apiKey: init.headers?.['api-key'],
    });
    return handler(calls.at(-1));
  };
  return { fetchImpl, calls };
}

function jsonResponse(status, body) {
  if (status === 204) return new Response(null, { status: 204 });
  return new Response(body == null ? '' : JSON.stringify(body), { status });
}

function memberDeps(extra = {}) {
  const flags = [];
  return {
    flags,
    requireUser: async () => ({ id: 'user-1', email: 'Member@Example.com' }),
    loadViewerProfile: async () => {
      throw new Error('staff gate');
    },
    env: ENV,
    updateNewsletterOptIn: async (userId, on) => {
      flags.push({ userId, on });
    },
    ...extra,
  };
}

describe('email list registry', () => {
  it('resolves Updates, Daily, and the topic env var', () => {
    const lists = resolveEmailLists(ENV);
    assert.deepEqual(
      lists.map((list) => [list.key, list.listId, list.configured]),
      [
        ['updates', 3, true],
        ['daily', 15, true],
        ['weekly_topic', 42, true],
      ],
    );
  });

  it('does not guess a Weekly News list id', () => {
    const topic = resolveEmailLists({}).find((list) => list.key === 'weekly_topic');
    assert.equal(topic.listId, null);
    assert.equal(topic.configured, false);
  });

  it('hides every list when Brevo has blacklisted the contact', () => {
    const shaped = shapeEmailPreferences({
      lists: resolveEmailLists(ENV),
      listIds: [3, 15, 42],
      emailBlacklisted: true,
    });
    assert.equal(shaped.emailBlacklisted, true);
    assert.deepEqual(shaped.lists.map((list) => list.subscribed), [false, false, false]);
    assert.equal(JSON.stringify(shaped).includes('listId'), false);
  });
});

describe('email preferences API', () => {
  it('requires a signed-in member and does not call Brevo', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(500, {}));
    const res = await handleEmailPreferences(request('GET'), {
      requireUser: async () => null,
      env: ENV,
      fetchImpl,
    });
    assert.equal(res.status, 401);
    assert.equal(calls.length, 0);
  });

  it('reads listIds and skips the staff gate', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(200, {
      listIds: [3, 42],
      emailBlacklisted: false,
    }));
    const res = await GET(request('GET'), {
      ...memberDeps(),
      fetchImpl,
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'GET');
    assert.match(calls[0].url, /\/contacts\/member%40example.com$/);
    assert.equal(calls[0].apiKey, 'test-key');
    assert.deepEqual(body.lists.map((list) => [list.key, list.subscribed]), [
      ['updates', true],
      ['daily', false],
      ['weekly_topic', true],
    ]);
    assert.equal(JSON.stringify(body).includes('test-key'), false);
    assert.equal(calls.some((call) => call.url.includes('emailCampaigns')), false);
  });

  it('treats a missing contact as all lists off', async () => {
    const { fetchImpl } = stubFetch(() => jsonResponse(404, { message: 'missing' }));
    const res = await handleEmailPreferences(request('GET'), {
      ...memberDeps(),
      fetchImpl,
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body.lists.map((list) => list.subscribed), [false, false, false]);
  });

  it('adds only the list that was turned on and mirrors Updates onto the profile', async () => {
    const order = [];
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/contacts')) order.push('brevo');
      if (call.method === 'GET') return jsonResponse(200, { listIds: [], emailBlacklisted: false });
      return jsonResponse(204, {});
    });
    const deps = { ...memberDeps(), fetchImpl };
    const recordFlag = deps.updateNewsletterOptIn;
    deps.updateNewsletterOptIn = async (userId, on) => {
      order.push('flag');
      return recordFlag(userId, on);
    };
    const res = await POST(request('POST', { key: 'updates', on: true }), deps);
    assert.equal(res.status, 200);
    const write = calls.find((call) => call.method === 'POST' && call.url.endsWith('/contacts'));
    assert.deepEqual(write.body.listIds, [3]);
    assert.equal(write.body.email, 'member@example.com');
    assert.equal(write.body.updateEnabled, true);
    assert.equal(Object.hasOwn(write.body, 'emailBlacklisted'), false);
    assert.deepEqual(deps.flags, [{ userId: 'user-1', on: true }]);
    assert.deepEqual(order, ['brevo', 'flag']);
    assert.equal(calls.some((call) => call.url.includes('/contacts/remove')), false);
    assert.equal(calls.some((call) => call.url.includes('emailCampaigns')), false);
  });

  it('clears the Updates mirror before the Brevo remove', async () => {
    const order = [];
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.url.includes('/contacts/remove')) order.push('brevo');
      if (call.method === 'GET') return jsonResponse(200, { listIds: [3], emailBlacklisted: false });
      return jsonResponse(201, {});
    });
    const deps = { ...memberDeps(), fetchImpl };
    const recordFlag = deps.updateNewsletterOptIn;
    deps.updateNewsletterOptIn = async (userId, on) => {
      order.push('flag');
      return recordFlag(userId, on);
    };
    const res = await handleEmailPreferences(request('POST', { key: 'updates', on: false }), deps);
    assert.equal(res.status, 200);
    assert.deepEqual(order, ['flag', 'brevo']);
    assert.deepEqual(deps.flags, [{ userId: 'user-1', on: false }]);
    const removes = calls.filter((call) => call.url.includes('/contacts/remove'));
    assert.equal(removes.length, 1);
    assert.match(removes[0].url, /\/contacts\/lists\/3\/contacts\/remove$/);
  });

  it('removes only the list that was turned off', async () => {
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.method === 'GET') return jsonResponse(200, { listIds: [3, 15], emailBlacklisted: false });
      return jsonResponse(201, {});
    });
    const deps = { ...memberDeps(), fetchImpl };
    const res = await handleEmailPreferences(request('POST', { key: 'daily', on: false }), deps);
    assert.equal(res.status, 200);
    const removes = calls.filter((call) => call.url.includes('/contacts/remove'));
    assert.equal(removes.length, 1);
    assert.match(removes[0].url, /\/contacts\/lists\/15\/contacts\/remove$/);
    assert.deepEqual(removes[0].body, { emails: ['member@example.com'] });
    assert.equal(deps.flags.length, 0);
    assert.equal(calls.some((call) => call.url.endsWith('/contacts') && call.method === 'POST'), false);
  });

  it('after a footer unsubscribe, a non-Updates list clears the Updates mirror', async () => {
    const order = [];
    let reads = 0;
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.url.includes('/contacts/remove')) order.push('brevo');
      if (call.method === 'GET') {
        reads += 1;
        if (reads === 1) {
          return jsonResponse(200, { listIds: [3, 15], emailBlacklisted: true });
        }
        return jsonResponse(200, { listIds: [15], emailBlacklisted: false });
      }
      return jsonResponse(204, {});
    });
    const deps = { ...memberDeps(), fetchImpl };
    const recordFlag = deps.updateNewsletterOptIn;
    deps.updateNewsletterOptIn = async (userId, on) => {
      order.push('flag');
      return recordFlag(userId, on);
    };
    const res = await handleEmailPreferences(request('POST', { key: 'daily', on: true }), deps);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.emailBlacklisted, false);
    assert.deepEqual(body.lists.map((list) => list.subscribed), [false, true, false]);
    const removed = calls
      .filter((call) => call.url.includes('/contacts/remove'))
      .map((call) => call.url.match(/lists\/(\d+)/)[1]);
    assert.deepEqual(removed, ['3']);
    const write = calls.find((call) => call.method === 'POST' && call.url.endsWith('/contacts'));
    assert.equal(write.body.emailBlacklisted, false);
    assert.deepEqual(write.body.listIds, [15]);
    assert.deepEqual(deps.flags, [{ userId: 'user-1', on: false }]);
    assert.deepEqual(order, ['flag', 'brevo']);
  });

  it('after a footer unsubscribe, turning one list on keeps the other non-Updates lists', async () => {
    let reads = 0;
    const { fetchImpl, calls } = stubFetch((call) => {
      if (call.method === 'GET') {
        reads += 1;
        if (reads === 1) {
          return jsonResponse(200, { listIds: [3, 15, 99], emailBlacklisted: true });
        }
        return jsonResponse(200, { listIds: [15, 99, 42], emailBlacklisted: false });
      }
      return jsonResponse(204, {});
    });
    const deps = { ...memberDeps(), fetchImpl };
    const res = await handleEmailPreferences(
      request('POST', { key: 'weekly_topic', on: true }),
      { ...deps, fetchImpl },
    );
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body.lists.map((list) => list.subscribed), [false, true, true]);
    const removed = calls
      .filter((call) => call.url.includes('/contacts/remove'))
      .map((call) => call.url.match(/lists\/(\d+)/)[1]);
    assert.deepEqual(removed, ['3']);
    const write = calls.find((call) => call.method === 'POST' && call.url.endsWith('/contacts'));
    assert.equal(write.body.emailBlacklisted, false);
    assert.deepEqual(write.body.listIds, [15, 99, 42]);
    assert.deepEqual(deps.flags, [{ userId: 'user-1', on: false }]);
  });

  it('refuses the topic list when its env var is unset and does not call Brevo', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(500, {}));
    const res = await handleEmailPreferences(request('POST', { key: 'weekly_topic', on: true }), {
      ...memberDeps(),
      env: { BREVO_API_KEY: 'test-key', BREVO_LIST_UPDATES: '3', BREVO_LIST_DAILY_NEWS: '15' },
      fetchImpl,
    });
    const body = await res.json();
    assert.equal(res.status, 503);
    assert.equal(body.error, 'That email is not available yet.');
    assert.equal(calls.length, 0);
  });

  it('rejects a caller-supplied list id', async () => {
    const { fetchImpl, calls } = stubFetch(() => jsonResponse(200, { listIds: [] }));
    const res = await handleEmailPreferences(request('POST', { key: '7', on: true, listId: 7 }), {
      ...memberDeps(),
      fetchImpl,
    });
    assert.equal(res.status, 400);
    assert.equal(calls.length, 0);
  });

  it('keeps the Hobby plan at 12 API files', () => {
    const functions = readdirSync('api').filter((name) => name.endsWith('.js'));
    assert.equal(functions.length, 12);
    assert.equal(functions.includes('email-preferences.js'), false);
  });
});
