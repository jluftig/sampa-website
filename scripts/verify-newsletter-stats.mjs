#!/usr/bin/env node
// T57: weekly-issue filter and /api/newsletter-stats roster gate.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTtlCache } from '../api/_lib/ttl-cache.js';
import { loadSentCampaigns } from '../api/_lib/brevo-readonly.js';
import { handleNewsletterStats } from '../api/newsletter-stats.js';
import {
  articleClicks,
  brevoConfigFromEnv,
  capRate,
  isWeeklyIssue,
  ratePercent,
  selectWeeklyIssues,
  shapeNewsletterStats,
} from '../src/lib/newsletterStats.js';

const weekly01 = {
  id: 23,
  name: 'SAMPA Weekly Issue #01',
  status: 'sent',
  type: 'classic',
  sentDate: '2026-08-25T15:00:00.000Z',
  recipients: { lists: [3] },
  statistics: {
    globalStats: { sent: 130, delivered: 127, uniqueViews: 76, uniqueClicks: 9 },
  },
};

const catchUp = {
  id: 24,
  name: 'Catch-up send',
  status: 'sent',
  type: 'classic',
  sentDate: '2026-08-26T15:00:00.000Z',
  recipients: { lists: [3] },
  statistics: {
    globalStats: { sent: 10, delivered: 10, uniqueViews: 4, uniqueClicks: 1 },
  },
};

const weekly02 = {
  id: 25,
  name: 'SAMPA Weekly Issue #02',
  status: 'sent',
  type: 'classic',
  sentDate: '2026-09-02T15:00:00.000Z',
  recipients: { lists: [3] },
  statistics: {
    globalStats: { sent: 140, delivered: 136, uniqueViews: 80, uniqueClicks: 11 },
  },
};

const testList = {
  id: 99,
  name: 'SAMPA Weekly test',
  status: 'sent',
  type: 'classic',
  sentDate: '2026-09-01T15:00:00.000Z',
  recipients: { lists: [8] },
  statistics: {
    globalStats: { sent: 200, delivered: 200, uniqueViews: 100, uniqueClicks: 10 },
  },
};

describe('weekly issue filter', () => {
  it('keeps list-3 weeklies, including a TEST name on list 3, and drops makeup', () => {
    assert.equal(isWeeklyIssue(weekly01), true);
    assert.equal(isWeeklyIssue(weekly02), true);
    assert.equal(isWeeklyIssue(catchUp), false);
    assert.equal(isWeeklyIssue(testList), false);
    assert.equal(isWeeklyIssue({ ...weekly01, status: 'draft' }), false);
    assert.equal(isWeeklyIssue({ ...weekly01, status: 'queued' }), false);
    assert.equal(isWeeklyIssue({
      ...weekly01,
      statistics: { globalStats: { sent: 10, delivered: 10, uniqueViews: 4, uniqueClicks: 1 } },
    }), true);
    assert.equal(isWeeklyIssue({
      ...weekly01,
      id: 30,
      name: 'SAMPA Weekly Issue #04 (TEST)',
      subject: 'SAMPA Weekly Issue #04',
    }), true);
    assert.equal(isWeeklyIssue({
      ...weekly02,
      id: 31,
      name: 'SAMPA Weekly Issue #04 makeup',
      recipients: { lists: [3] },
    }), false);
    assert.equal(isWeeklyIssue({
      ...weekly02,
      id: 32,
      name: 'SAMPA Weekly Issue #06',
      recipients: { lists: [3, 13] },
    }), false);
    assert.equal(isWeeklyIssue({
      ...weekly01,
      id: 33,
      name: 'SAMPA Weekly Issue #05',
      subject: 'This week in addiction medicine',
    }), true);
    const inflated = selectWeeklyIssues([{
      ...weekly01,
      statistics: { globalStats: { sent: 130, delivered: 127, uniqueViews: 76, uniqueClicks: 200 } },
    }]);
    assert.equal(inflated[0].uniqueClicks, 200);
    assert.equal(inflated[0].clickRate, 100);
    assert.equal(capRate(157.5), 100);
    assert.equal(capRate(7.1), 7.1);

    const issues = selectWeeklyIssues([testList, catchUp, weekly01, weekly02]);
    assert.deepEqual(issues.map((issue) => issue.id), [25, 23]);
    assert.equal(issues[1].recipients, 130);
    assert.equal(issues[1].delivered, 127);
    assert.equal(issues[1].uniqueOpens, 76);
    assert.equal(issues[1].uniqueClicks, 9);
    assert.equal(issues[1].openRate, 59.8);
    assert.equal(issues[1].clickRate, 7.1);
    assert.equal(ratePercent(76, 127), 59.8);

    const shaped = shapeNewsletterStats({
      subscribers: 145,
      listId: 3,
      listName: 'SAMPA Updates',
      issues,
    });
    assert.equal(shaped.subscribers, 145);
    assert.equal(shaped.latest.id, 25);
    assert.equal(shaped.empty, false);
  });

  it('accepts list objects and ignores a missing key', () => {
    const withObjects = {
      ...weekly01,
      recipients: { lists: [{ id: 3, name: 'SAMPA Updates' }] },
    };
    assert.equal(isWeeklyIssue(withObjects), true);
    assert.equal(brevoConfigFromEnv({}).configured, false);
    assert.equal(brevoConfigFromEnv({ BREVO_API_KEY: 'key', BREVO_LIST_UPDATES: '3' }).listId, 3);
    assert.equal(brevoConfigFromEnv({ SENDINBLUE_API_KEY: 'key' }).configured, true);
  });
});

describe('Brevo campaign paging', () => {
  it('follows count and stops after the last page', async () => {
    const paths = [];
    const campaigns = await loadSentCampaigns('secret-key', async (_key, path) => {
      paths.push(path);
      if (path.includes('offset=0')) {
        return { count: 3, campaigns: [{ id: 1 }, { id: 2 }] };
      }
      return { count: 3, campaigns: [{ id: 3 }] };
    });
    assert.deepEqual(campaigns.map((row) => row.id), [1, 2, 3]);
    assert.equal(paths.length, 2);
    assert.match(paths[0], /status=sent/);
    assert.match(paths[0], /statistics=globalStats/);
    assert.equal(paths[0].includes('type=classic'), false);
    assert.match(paths[1], /offset=2/);
    assert.equal(paths[0].includes('secret-key'), false);
  });
});

describe('GET /api/newsletter-stats', () => {
  const req = () => new Request('https://www.addictionpas.org/api/newsletter-stats');

  async function read(res) {
    return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
  }

  const viewerEnv = {
    BREVO_API_KEY: 'secret-brevo-key',
    BREVO_LIST_UPDATES: '3',
  };

  function brevoGet(_key, path) {
    if (path.startsWith('/contacts/lists/')) {
      return { id: 3, name: 'SAMPA Updates', totalSubscribers: 145 };
    }
    if (path.includes('linksStats')) {
      if (path.includes('/emailCampaigns/25')) {
        return {
          statistics: {
            linksStats: {
              'https://www.addictionpas.org/news/example': 6,
              'https://www.addictionpas.org/join': 2,
            },
          },
        };
      }
      throw new Error('links unavailable');
    }
    return {
      count: 5,
      campaigns: [
        weekly01,
        catchUp,
        weekly02,
        testList,
        {
          ...weekly02,
          id: 30,
          name: 'SAMPA Weekly Issue #04 (TEST)',
          subject: 'SAMPA Weekly Issue #04 (TEST)',
          sentDate: '2026-09-20T15:00:00.000Z',
          statistics: {
            globalStats: { sent: 130, delivered: 120, uniqueViews: 10, uniqueClicks: 400 },
          },
        },
      ],
    };
  }

  it('rejects anonymous callers and non-roster profiles', async () => {
    const anon = await read(await handleNewsletterStats(req(), {
      requireUser: async () => null,
    }));
    assert.equal(anon.status, 401);
    assert.equal(anon.body.error, 'Sign in required');
    assert.equal(anon.cache, 'private, no-store');

    const member = await read(await handleNewsletterStats(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ role: 'member' }),
      env: viewerEnv,
      brevoGet,
    }));
    assert.equal(member.status, 403);

    const boardOnly = await read(await handleNewsletterStats(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ role: 'member', is_board: true, is_membership_committee: true }),
      env: viewerEnv,
      brevoGet,
    }));
    assert.equal(boardOnly.status, 403);
    assert.equal(boardOnly.body.error, 'Not authorized');
  });

  it('returns not_configured when BREVO_API_KEY is missing', async () => {
    const res = await read(await handleNewsletterStats(req(), {
      requireUser: async () => ({ id: 'viewer' }),
      loadViewerProfile: async () => ({ can_view_members: true }),
      env: {},
      brevoGet,
    }));
    assert.equal(res.status, 503);
    assert.equal(res.body.error, 'not_configured');
    assert.equal(res.body.message, 'Newsletter stats not configured.');
  });

  it('returns list size and weekly issues for a roster viewer', async () => {
    const calls = [];
    const res = await read(await handleNewsletterStats(req(), {
      requireUser: async () => ({ id: 'viewer' }),
      loadViewerProfile: async () => ({ role: 'member', can_view_members: true }),
      env: viewerEnv,
      cache: createTtlCache(),
      brevoGet: async (key, path) => {
        calls.push({ key, path });
        return brevoGet(key, path);
      },
    }));
    assert.equal(res.status, 200);
    assert.equal(res.cache, 'private, max-age=300');
    assert.equal(res.body.subscribers, 145);
    assert.equal(res.body.listName, 'SAMPA Updates');
    assert.equal(res.body.latest.id, 30);
    assert.deepEqual(res.body.issues.map((issue) => issue.id), [30, 25, 23]);
    assert.equal(res.body.issues[0].name, 'SAMPA Weekly Issue #04 (TEST)');
    assert.equal(res.body.issues[0].clickRate, 100);
    assert.equal(res.body.issues[2].openRate, 59.8);
    assert.equal(res.body.listSize.source, 'sent');
    assert.deepEqual(articleClicks(res.body.topLinks).map((row) => row.path), ['/news/example']);
    assert.deepEqual(res.body.articles.map((row) => row.path), ['/news/example']);
    assert.equal(res.body.topLinks[0].id, 25);
    assert.equal(JSON.stringify(res.body).includes('secret-brevo-key'), false);
    assert.equal(calls.length, 5);
    assert.ok(calls.every((call) => call.key === 'secret-brevo-key'));
    const paths = calls.map((call) => call.path);
    assert.ok(paths.some((path) => path === '/contacts/lists/3'));
    assert.ok(paths.some((path) => path.startsWith('/emailCampaigns?')));
  });

  it('serves a second roster read from the short cache', async () => {
    const cache = createTtlCache();
    let hits = 0;
    const deps = {
      requireUser: async () => ({ id: 'admin' }),
      loadViewerProfile: async () => ({ role: 'admin' }),
      env: viewerEnv,
      cache,
      brevoGet: async (key, path) => {
        hits += 1;
        return brevoGet(key, path);
      },
    };
    const first = await read(await handleNewsletterStats(req(), deps));
    const second = await read(await handleNewsletterStats(req(), deps));
    assert.equal(first.status, 200);
    assert.equal(second.body.latest.id, 30);
    assert.equal(hits, 5);
  });
});
