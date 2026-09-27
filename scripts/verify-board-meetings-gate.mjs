import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isActiveMemberAccess } from '../src/lib/memberHome.js';
import { boardAccessStatus, handleBoardMeetings } from '../api/_lib/boardMeetingsHandler.js';
import { GET, isBoardMeetingsRequest } from '../api/newsletter-stats.js';

const PHRASE = 'Motion to Approve ASIO';

function request(url, token) {
  return new Request(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

async function read(res) {
  return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
}

describe('board access matches is_active_member', () => {
  it('rejects a missing user and a signed-in non-member', () => {
    assert.equal(boardAccessStatus(null, null), 401);
    assert.equal(boardAccessStatus({ id: 'u1' }, null), 403);
    assert.equal(boardAccessStatus({ id: 'u1' }, { role: 'member', membership_status: null }), 403);
    assert.equal(boardAccessStatus({ id: 'u1' }, { role: 'member', membership_status: 'past_due' }), 403);
    assert.equal(isActiveMemberAccess({ role: 'member', is_board: true }), false);
  });

  it('allows an active member, an editor, and an admin', () => {
    assert.equal(boardAccessStatus({ id: 'u1' }, { membership_status: 'active', role: 'member' }), 200);
    assert.equal(boardAccessStatus({ id: 'u1' }, { membership_status: 'canceled', role: 'editor' }), 200);
    assert.equal(boardAccessStatus({ id: 'u1' }, { role: 'admin' }), 200);
  });
});

describe('GET /api/board-meetings', () => {
  const today = new Date(2026, 8, 27, 12, 0, 0);

  function depsFor(user, profile) {
    return {
      today,
      requireUser: async () => user,
      loadProfile: async () => profile,
    };
  }

  it('returns 401 and no minutes text when signed out', async () => {
    const res = await read(await handleBoardMeetings(
      request('https://www.addictionpas.org/api/board-meetings'),
      depsFor(null, null),
    ));
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Sign in required');
    assert.equal(JSON.stringify(res.body).includes(PHRASE), false);
    assert.equal(res.cache, 'private, no-store');
  });

  it('returns 403 and no minutes text for a signed-in non-member', async () => {
    const res = await read(await handleBoardMeetings(
      request('https://www.addictionpas.org/api/board-meetings?slug=2026-09', 'token'),
      depsFor({ id: 'u1' }, { role: 'member', membership_status: null, is_board: true }),
    ));
    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'Active membership required');
    assert.equal(JSON.stringify(res.body).includes(PHRASE), false);
  });

  it('returns the September agenda to an active member and marks that meeting past', async () => {
    const res = await read(await handleBoardMeetings(
      request('https://www.addictionpas.org/api/board-meetings?slug=2026-09', 'token'),
      depsFor({ id: 'u1' }, { membership_status: 'active', role: 'member' }),
    ));
    assert.equal(res.status, 200);
    assert.equal(res.body.meeting.status, 'completed');
    assert.equal(res.body.meeting.agenda.bodyHtml.includes(PHRASE), true);
    assert.equal(res.body.meeting.minutes.bodyHtml, null);
    assert.equal(res.body.meeting.agenda.bodyHtml.includes('Jordan Vold'), false);
  });

  it('omits bodies from the catalog and includes them on a minutes slug', async () => {
    const deps = depsFor({ id: 'u1' }, { role: 'editor', membership_status: null });
    const list = await read(await handleBoardMeetings(
      request('https://www.addictionpas.org/api/board-meetings', 'token'),
      deps,
    ));
    assert.equal(list.status, 200);
    assert.equal(JSON.stringify(list.body).includes(PHRASE), false);
    assert.equal(list.body.meetings.find((meeting) => meeting.slug === '2026-09').status, 'completed');
    const april = await read(await handleBoardMeetings(
      request('https://www.addictionpas.org/api/board-meetings?slug=2026-04', 'token'),
      deps,
    ));
    assert.equal(april.status, 200);
    assert.equal(april.body.meeting.minutes.bodyHtml.includes('Jordan Vold'), true);
    assert.equal(april.body.meeting.minutes.bodyHtml.includes('Tasha Seliski'), true);
    assert.equal(/Jordan Void|Tasha Selinski/.test(april.body.meeting.minutes.bodyHtml), false);
  });

  it('routes the board section before the roster gate', async () => {
    assert.equal(isBoardMeetingsRequest(request('https://www.addictionpas.org/api/newsletter-stats?section=board')), true);
    assert.equal(isBoardMeetingsRequest(request('https://www.addictionpas.org/api/board-meetings?slug=2026-04')), true);
    const res = await read(await GET(
      request('https://www.addictionpas.org/api/newsletter-stats?section=board&slug=2026-09'),
      depsFor(null, null),
    ));
    assert.equal(res.status, 401);
    assert.equal(JSON.stringify(res.body).includes(PHRASE), false);
  });
});
