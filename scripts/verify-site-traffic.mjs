#!/usr/bin/env node
// T53: Site traffic gate, Analytics env, and dashboard/People wiring.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  analyticsConfigFromEnv,
  canViewSiteTraffic,
  normalizeTopPaths,
  normalizeVisitCount,
  parseTrafficRange,
  shapeSiteTraffic,
  TRACKING_STARTED_NOTE,
  trafficWindow,
} from '../src/lib/siteTraffic.js';
import { buildVisitsUrl } from '../api/_lib/vercel-analytics.js';
import { handleSiteTraffic } from '../api/site-traffic.js';

describe('canViewSiteTraffic', () => {
  it('allows board or membership committee only', () => {
    assert.equal(canViewSiteTraffic({ is_board: true }), true);
    assert.equal(canViewSiteTraffic({ is_membership_committee: true }), true);
    assert.equal(canViewSiteTraffic({ is_board: true, is_membership_committee: true }), true);
    assert.equal(canViewSiteTraffic({ role: 'admin' }), false);
    assert.equal(canViewSiteTraffic({ can_view_members: true }), false);
    assert.equal(canViewSiteTraffic({ is_board: false, is_membership_committee: false }), false);
    assert.equal(canViewSiteTraffic(null), false);
  });
});

describe('range + window', () => {
  it('parses 7 vs 30 and ignores other values', () => {
    assert.equal(parseTrafficRange('7'), 7);
    assert.equal(parseTrafficRange('30'), 30);
    assert.equal(parseTrafficRange(30), 30);
    assert.equal(parseTrafficRange('90'), 7);
    assert.equal(parseTrafficRange(undefined), 7);
  });

  it('builds an ISO window of the requested length', () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    const week = trafficWindow(7, now);
    assert.equal(week.range, 7);
    assert.equal(week.until, '2026-09-16T12:00:00.000Z');
    assert.equal(week.since, '2026-09-09T12:00:00.000Z');
    const month = trafficWindow('30', now);
    assert.equal(month.range, 30);
    assert.equal(month.since, '2026-08-17T12:00:00.000Z');
  });
});

describe('Analytics env + response shaping', () => {
  it('requires token + project id; team id is optional', () => {
    assert.equal(analyticsConfigFromEnv({}).configured, false);
    assert.equal(analyticsConfigFromEnv({
      VERCEL_WEB_ANALYTICS_TOKEN: 'tok',
    }).configured, false);
    const cfg = analyticsConfigFromEnv({
      VERCEL_WEB_ANALYTICS_TOKEN: 'tok',
      VERCEL_PROJECT_ID: 'prj_1',
      VERCEL_ORG_ID: 'team_1',
    });
    assert.equal(cfg.configured, true);
    assert.equal(cfg.projectId, 'prj_1');
    assert.equal(cfg.teamId, 'team_1');
    const override = analyticsConfigFromEnv({
      VERCEL_WEB_ANALYTICS_TOKEN: 'tok',
      VERCEL_PROJECT_ID: 'prj_system',
      VERCEL_WEB_ANALYTICS_PROJECT_ID: 'prj_explicit',
      VERCEL_WEB_ANALYTICS_TEAM_ID: 'team_explicit',
    });
    assert.equal(override.projectId, 'prj_explicit');
    assert.equal(override.teamId, 'team_explicit');
  });

  it('normalizes count + top paths and drops Others', () => {
    assert.deepEqual(normalizeVisitCount({ data: { visitors: 12, pageviews: 40 } }), {
      visitors: 12,
      pageviews: 40,
    });
    const paths = normalizeTopPaths({
      data: [
        { requestPath: '/', pageviews: 20, visitors: 10 },
        { requestPath: 'Others', pageviews: 3, visitors: 2 },
        { requestPath: '/news', pageviews: 8, visitors: 6 },
      ],
    });
    assert.deepEqual(paths, [
      { path: '/', pageviews: 20, visitors: 10 },
      { path: '/news', pageviews: 8, visitors: 6 },
    ]);
    const shaped = shapeSiteTraffic({
      range: 7,
      window: { since: 'a', until: 'b' },
      count: { visitors: 0, pageviews: 0 },
      paths: [],
    });
    assert.equal(shaped.empty, true);
  });
});

describe('Vercel visits URL', () => {
  it('builds count and path-aggregate query strings', () => {
    const count = buildVisitsUrl({
      projectId: 'prj_1',
      teamId: 'team_1',
      mode: 'count',
      since: '2026-09-09T00:00:00.000Z',
      until: '2026-09-16T00:00:00.000Z',
    });
    assert.equal(count.pathname, '/v1/query/web-analytics/visits/count');
    assert.equal(count.searchParams.get('projectId'), 'prj_1');
    assert.equal(count.searchParams.get('teamId'), 'team_1');

    const paths = buildVisitsUrl({
      projectId: 'prj_1',
      mode: 'aggregate',
      by: ['requestPath'],
      limit: 5,
      filter: "environment eq 'production'",
    });
    assert.equal(paths.pathname, '/v1/query/web-analytics/visits/aggregate');
    assert.equal(paths.searchParams.get('by'), 'requestPath');
    assert.equal(paths.searchParams.get('limit'), '5');
    assert.equal(paths.searchParams.get('filter'), "environment eq 'production'");
  });
});

describe('GET /api/site-traffic authZ', () => {
  const req = (range = '7') => new Request(`https://www.addictionpas.org/api/site-traffic?range=${range}`);

  async function read(res) {
    return { status: res.status, body: await res.json() };
  }

  it('rejects anonymous, non-board members, and missing token', async () => {
    const anon = await read(await handleSiteTraffic(req(), {
      requireUser: async () => null,
    }));
    assert.equal(anon.status, 401);

    const member = await read(await handleSiteTraffic(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ is_board: false, is_membership_committee: false }),
    }));
    assert.equal(member.status, 403);

    const noToken = await read(await handleSiteTraffic(req(), {
      requireUser: async () => ({ id: 'u1' }),
      loadViewerProfile: async () => ({ is_board: true }),
      env: {},
    }));
    assert.equal(noToken.status, 503);
    assert.equal(noToken.body.error, 'not_configured');
  });

  it('returns aggregates for a board viewer without exposing the token', async () => {
    const calls = [];
    const res = await handleSiteTraffic(req('30'), {
      requireUser: async () => ({ id: 'board' }),
      loadViewerProfile: async () => ({ is_membership_committee: true }),
      env: {
        VERCEL_WEB_ANALYTICS_TOKEN: 'secret-token',
        VERCEL_PROJECT_ID: 'prj_1',
        VERCEL_ORG_ID: 'team_1',
      },
      now: new Date('2026-09-16T12:00:00.000Z'),
      queryVisits: async (args) => {
        calls.push(args);
        if (args.mode === 'count') {
          return { data: { visitors: 9, pageviews: 21 } };
        }
        return {
          data: [
            { requestPath: '/', pageviews: 12, visitors: 7 },
            { requestPath: '/about', pageviews: 4, visitors: 3 },
          ],
        };
      },
    });
    const { status, body } = await read(res);
    assert.equal(status, 200);
    assert.equal(body.range, 30);
    assert.equal(body.visitors, 9);
    assert.equal(body.pageviews, 21);
    assert.equal(body.paths[0].path, '/');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].token, 'secret-token');
    assert.equal(JSON.stringify(body).includes('secret-token'), false);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
  });
});

describe('wiring', () => {
  it('keeps the column, guard, People checkbox, and dashboard card', () => {
    const schema = readFileSync('supabase/schema.sql', 'utf8');
    const migration = readFileSync('supabase/migrations/2026-09-16-membership-committee.sql', 'utf8');
    const people = readFileSync('src/pages/AdminPeople.jsx', 'utf8');
    const dashboard = readFileSync('src/pages/Dashboard.jsx', 'utf8');
    const card = readFileSync('src/components/SiteTrafficCard.jsx', 'utf8');
    const api = readFileSync('api/site-traffic.js', 'utf8');
    const claude = readFileSync('CLAUDE.md', 'utf8');

    assert.match(schema, /is_membership_committee boolean not null default false/);
    assert.match(schema, /new\.is_membership_committee is distinct from old\.is_membership_committee/);
    assert.match(migration, /add column if not exists is_membership_committee/);
    assert.match(people, /Membership Committee/);
    assert.match(people, /is_membership_committee/);
    assert.match(dashboard, /SiteTrafficCard/);
    assert.match(dashboard, /canViewSiteTraffic/);
    assert.match(card, /export function SiteTrafficPanel/);
    assert.match(card, /apiGet\(`\/api\/site-traffic\?range=\$\{range\}`\)/);
    assert.equal(TRACKING_STARTED_NOTE, 'Tracking started on September 16, 2026.');
    const noteIdx = card.indexOf('{TRACKING_STARTED_NOTE}');
    const loadingIdx = card.indexOf('{loading &&');
    assert.ok(noteIdx > 0 && noteIdx < loadingIdx, 'start-date note must render whenever the card is shown');
    assert.match(api, /canViewSiteTraffic/);
    assert.match(api, /queryVisits/);
    assert.match(claude, /VERCEL_WEB_ANALYTICS_TOKEN/);
  });
});
