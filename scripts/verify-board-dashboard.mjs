import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GET } from '../api/newsletter-stats.js';
import { handleBoardNumbers } from '../api/_lib/boardNumbers.js';
import { handleFinanceStats } from '../api/_lib/finance-stats.js';
import { handleSubscriberSnapshot } from '../api/_lib/subscriberSnapshotJob.js';
import { loadBoardDashboardProfile } from '../api/_lib/boardDashboardAccess.js';
import { canViewBoardDashboard } from '../src/lib/memberRoster.js';
import { postAuthPath } from '../src/lib/memberHome.js';
import {
  listGrowthSeries,
  snapshotRecord,
  snapshotsForList,
} from '../src/lib/newsletterStats.js';
import { manualRelayBalance } from '../src/data/relayBalance.js';

const NOW = new Date('2026-10-08T13:15:00.000Z');

function request(path, headers = {}) {
  return new Request(`https://www.addictionpas.org${path}`, { headers });
}

async function read(res) {
  return { status: res.status, body: await res.json() };
}

describe('canViewBoardDashboard', () => {
  it('allows admin, board, and committee chair, and refuses roster-only members', () => {
    assert.equal(canViewBoardDashboard({ role: 'admin' }), true);
    assert.equal(canViewBoardDashboard({ role: 'member', is_board: true }), true);
    assert.equal(canViewBoardDashboard({ role: 'member', is_committee_chair: true }), true);
    assert.equal(canViewBoardDashboard({ role: 'member', can_view_members: true, membership_status: 'active' }), false);
    assert.equal(canViewBoardDashboard({ role: 'member', is_membership_committee: true }), false);
    assert.equal(canViewBoardDashboard(null), false);
  });
});

describe('signed-in members stay on /board/dashboard', () => {
  it('does not send an active member home from the dashboard path', () => {
    const member = { role: 'member', membership_status: 'active' };
    assert.equal(postAuthPath(member, '/board/dashboard'), '/board/dashboard');
  });
});

describe('GET finance and board-numbers', () => {
  it('returns 403 for an active member and finance for a chair', async () => {
    const member = await read(await GET(request('/api/newsletter-stats?section=finance'), {
      requireUser: async () => ({ id: 'member' }),
      loadViewerProfile: async () => ({ role: 'member', membership_status: 'active' }),
      env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
      listTransactions: async () => {
        throw new Error('should not list');
      },
    }));
    assert.equal(member.status, 403);
    assert.equal(member.body.error, 'Not authorized');
    assert.equal(member.body.relay, undefined);

    const chair = await read(await GET(request('/api/newsletter-stats?section=finance'), {
      requireUser: async () => ({ id: 'chair' }),
      loadViewerProfile: async () => ({ role: 'member', is_committee_chair: true }),
      env: { STRIPE_SECRET_KEY: 'sk_test_secret' },
      now: NOW,
      listTransactions: async () => ([
        { type: 'charge', amount: 2500, fee: 100, currency: 'usd', created: Math.floor(NOW.getTime() / 1000) },
      ]),
    }));
    assert.equal(chair.status, 200);
    assert.equal(chair.body.revenueCents, 2500);
    assert.deepEqual(chair.body.relay, manualRelayBalance);
    assert.equal(JSON.stringify(chair.body).includes('sk_test_secret'), false);
  });

  it('returns aggregate counts to an active member and hides names', async () => {
    const denied = await read(await handleBoardNumbers(request('/api/newsletter-stats?section=board-numbers'), {
      requireUser: async () => ({ id: 'guest' }),
      loadMemberProfile: async () => ({ role: 'member', membership_status: 'canceled' }),
      loadMembershipRows: async () => {
        throw new Error('should not load');
      },
    }));
    assert.equal(denied.status, 403);
    assert.equal(denied.body.error, 'Not authorized');

    const allowed = await read(await GET(request('/api/newsletter-stats?section=board-numbers'), {
      requireUser: async () => ({ id: 'member' }),
      loadMemberProfile: async () => ({ role: 'member', membership_status: 'active' }),
      loadMembershipRows: async () => ([
        { membership_status: 'active', membership_tier: 'fellow', email: 'hidden@example.com' },
        { membership_status: 'canceled', email: 'other@example.com' },
      ]),
      env: {
        BREVO_API_KEY: 'secret-brevo-key',
        BREVO_LIST_UPDATES: '3',
        BREVO_LIST_DAILY_NEWS: '15',
      },
      brevoGet: async (_key, path) => (
        path.endsWith('/15')
          ? { name: 'SAMPA Daily Roundup', totalSubscribers: 3 }
          : { name: 'SAMPA Updates', totalSubscribers: 120 }
      ),
    }));
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.activeMembers, 1);
    assert.deepEqual(allowed.body.weekly, { listId: 3, subscribers: 120 });
    assert.deepEqual(allowed.body.daily, { listId: 15, subscribers: 3 });
    assert.equal(allowed.body.revenueCents, undefined);
    assert.equal(JSON.stringify(allowed.body).includes('hidden@example.com'), false);
    assert.equal(JSON.stringify(allowed.body).includes('secret-brevo-key'), false);
  });
});

describe('subscriber snapshot job', () => {
  it('is idempotent per UTC day and stores both lists', async () => {
    const store = new Map();
    async function upsertSnapshots(rows) {
      for (const row of rows) store.set(`${row.snapshot_date}:${row.list_id}`, { ...row });
      return rows;
    }
    const deps = {
      env: {
        CRON_SECRET: 'cron-secret',
        BREVO_API_KEY: 'secret-brevo-key',
      },
      now: NOW,
      upsertSnapshots,
      brevoGet: async (_key, path) => (
        path.endsWith('/15')
          ? { totalSubscribers: 3, uniqueSubscribers: 2 }
          : { totalSubscribers: 100, uniqueSubscribers: 90 }
      ),
    };
    const headers = { authorization: 'Bearer cron-secret' };
    const first = await read(await handleSubscriberSnapshot(
      request('/api/newsletter-stats?section=subscriber-snapshot', headers),
      deps,
    ));
    deps.brevoGet = async (_key, path) => (
      path.endsWith('/15')
        ? { totalSubscribers: 4, uniqueSubscribers: 4 }
        : { totalSubscribers: 101, uniqueSubscribers: 91 }
    );
    const second = await read(await handleSubscriberSnapshot(
      request('/api/newsletter-stats?section=subscriber-snapshot', headers),
      deps,
    ));
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(first.body.date, '2026-10-08');
    assert.equal(store.size, 2);
    assert.equal(store.get('2026-10-08:3').total_subscribers, 101);
    assert.equal(store.get('2026-10-08:3').unique_subscribers, 91);
    assert.equal(store.get('2026-10-08:15').total_subscribers, 4);
    assert.equal(JSON.stringify(second.body).includes('secret-brevo-key'), false);
    assert.equal(JSON.stringify(second.body).includes('cron-secret'), false);

    const nextDay = await read(await handleSubscriberSnapshot(
      request('/api/newsletter-stats?section=subscriber-snapshot', headers),
      { ...deps, now: new Date('2026-10-09T13:15:00.000Z') },
    ));
    assert.equal(nextDay.status, 200);
    assert.equal(store.size, 4);
  });

  it('refuses a missing or wrong cron secret', async () => {
    const missing = await read(await GET(request('/api/newsletter-stats?section=subscriber-snapshot'), {
      env: { BREVO_API_KEY: 'secret-brevo-key' },
      upsertSnapshots: async () => {
        throw new Error('should not write');
      },
    }));
    assert.equal(missing.status, 503);
    assert.equal(missing.body.error, 'not_configured');

    const wrong = await read(await handleSubscriberSnapshot(
      request('/api/newsletter-stats?section=subscriber-snapshot', { authorization: 'Bearer nope' }),
      {
        env: { CRON_SECRET: 'cron-secret', BREVO_API_KEY: 'secret-brevo-key' },
        upsertSnapshots: async () => {
          throw new Error('should not write');
        },
      },
    ));
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.error, 'Not authorized');
  });
});

describe('list growth', () => {
  it('plots campaign recipients before the first snapshot and snapshots after', () => {
    const rows = [
      { snapshot_date: '2026-10-08', list_id: 3, total_subscribers: 10, unique_subscribers: 9 },
      { snapshot_date: '2026-10-08', list_id: 15, total_subscribers: 2, unique_subscribers: 2 },
    ];
    const daily = snapshotsForList(rows, 15);
    assert.equal(daily.length, 1);
    assert.equal(daily[0].total, 2);
    const growth = listGrowthSeries(
      [{ id: 9, sentAt: '2026-09-01T15:00:00.000Z', recipients: 1 }],
      daily,
    );
    assert.equal(growth.source, 'mixed');
    assert.equal(growth.snapshotStart, '2026-10-08');
    assert.deepEqual(growth.points.map((point) => [point.kind, point.total]), [['sent', 1], ['snapshot', 2]]);
    assert.match(growth.note, /2026-10-08/);
    assert.match(growth.note, /campaign recipient counts/);

    const none = listGrowthSeries(
      [{ id: 9, sentAt: '2026-09-01T15:00:00.000Z', recipients: 1 }],
      [],
    );
    assert.equal(none.source, 'sent');
    assert.match(none.note, /No subscriber snapshots yet/);
    assert.equal(snapshotRecord('2026-10-08', 15, { totalSubscribers: 4 }).unique_subscribers, 4);
  });
});

describe('chair flag storage', () => {
  it('falls back when the chair column is not migrated yet', async () => {
    const calls = [];
    const profile = await loadBoardDashboardProfile('user-1', {
      queryProfiles: async (columns) => {
        calls.push(columns);
        if (columns.includes('is_committee_chair')) {
          return { data: null, error: { message: 'column profiles.is_committee_chair does not exist' } };
        }
        return { data: { role: 'admin', is_board: false }, error: null };
      },
    });
    assert.equal(profile.role, 'admin');
    assert.deepEqual(calls, ['role, is_board, is_committee_chair', 'role, is_board']);
  });

  it('guards and audits the chair flag and keeps the dashboard route stable', () => {
    const schema = readFileSync('supabase/schema.sql', 'utf8');
    const migration = readFileSync('supabase/migrations/2026-10-08-committee-chair-subscriber-snapshots.sql', 'utf8');
    const people = readFileSync('src/pages/AdminPeople.jsx', 'utf8');
    const app = readFileSync('src/App.jsx', 'utf8');
    const gate = readFileSync('src/components/RequireBoardDashboard.jsx', 'utf8');
    const roster = readFileSync('src/pages/AdminMembers.jsx', 'utf8');
    const hub = readFileSync('src/pages/BoardMeetings.jsx', 'utf8');

    assert.match(schema, /is_committee_chair boolean not null default false/);
    assert.match(schema, /new\.is_committee_chair is distinct from old\.is_committee_chair/);
    assert.match(schema, /subscriber_snapshots/);
    assert.match(migration, /primary key \(snapshot_date, list_id\)/);
    assert.match(migration, /is_committee_chair/);
    assert.match(people, /Committee chair/);
    assert.match(people, /is_committee_chair: next\.committeeChair/);
    assert.match(people, /disabled=\{disabled\}/);
    const dashboardAt = app.indexOf('path="/board/dashboard"');
    const slugAt = app.indexOf('path="/board/:slug"');
    assert.ok(dashboardAt > 0 && dashboardAt < slugAt);
    assert.equal((gate.match(/<Navigate/g) || []).length, 1);
    assert.match(gate, /if \(loginTo\)/);
    assert.match(gate, /This dashboard is for administrators, board members, and committee chairs/);
    assert.doesNotMatch(roster, /<OrgDashboard/);
    assert.match(hub, /<BoardNumbers/);
  });
});
