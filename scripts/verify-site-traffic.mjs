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
  trafficWindow,
} from '../src/lib/siteTraffic.js';

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

describe('wiring', () => {
  it('keeps the column, guard, People checkbox, and dashboard card', () => {
    const schema = readFileSync('supabase/schema.sql', 'utf8');
    const migration = readFileSync('supabase/migrations/2026-09-16-membership-committee.sql', 'utf8');
    const people = readFileSync('src/pages/AdminPeople.jsx', 'utf8');
    const dashboard = readFileSync('src/pages/Dashboard.jsx', 'utf8');
    const api = readFileSync('api/site-traffic.js', 'utf8');
    const claude = readFileSync('CLAUDE.md', 'utf8');

    assert.match(schema, /is_membership_committee boolean not null default false/);
    assert.match(schema, /new\.is_membership_committee is distinct from old\.is_membership_committee/);
    assert.match(migration, /add column if not exists is_membership_committee/);
    assert.match(people, /Membership Committee/);
    assert.match(people, /is_membership_committee/);
    assert.match(dashboard, /SiteTrafficCard/);
    assert.match(dashboard, /canViewSiteTraffic/);
    assert.match(api, /canViewSiteTraffic/);
    assert.match(api, /queryVisits/);
    assert.match(claude, /VERCEL_WEB_ANALYTICS_TOKEN/);
  });
});
