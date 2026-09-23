#!/usr/bin/env node
// T56: /editor/members must never bounce against /login (Shani Wilson reload loop).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  decideAuthRedirect,
  guardLoginPath,
  loginAuthedDestination,
  shouldLeaveForLogin,
  walkAuthRedirects,
} from '../src/lib/authRedirect.js';
import {
  postAuthPath,
  safeNext,
  signedInHomePath,
} from '../src/lib/memberHome.js';
import { shouldRetryAuthRecovery } from '../src/lib/authSession.js';
import { canViewMemberRoster } from '../src/lib/memberRoster.js';

const president = {
  role: 'member',
  is_board: true,
  email: 'shani@addictionpas.org',
  membership_status: 'active',
};
const editor = { role: 'editor', membership_status: 'active' };
const member = { role: 'member', membership_status: 'active' };
const viewer = { role: 'member', can_view_members: true, membership_status: 'active' };
const admin = { role: 'admin', can_edit_news: true, membership_status: 'active' };

const signedOut = { loading: false, sessionUsable: false, halfSession: false, profile: null };
const halfSession = { loading: false, sessionUsable: false, halfSession: true, profile: null };
const loading = { loading: true, sessionUsable: false, halfSession: false, profile: null };

function authed(profile) {
  return { loading: false, sessionUsable: true, halfSession: false, profile };
}

describe('roster gate stays board-hat-blind', () => {
  it('does not grant /editor/members via board or committee hats', () => {
    assert.equal(canViewMemberRoster(president), false);
    assert.equal(canViewMemberRoster({ is_membership_committee: true }), false);
    assert.equal(canViewMemberRoster(viewer), true);
    assert.equal(canViewMemberRoster(admin), true);
  });
});

describe('postAuthPath refuses a roster next the profile cannot keep', () => {
  it('sends a signed-in president/editor/member home instead of /editor/members', () => {
    assert.equal(postAuthPath(president, '/editor/members'), '/dashboard');
    assert.equal(postAuthPath(editor, '/editor/members'), '/editor');
    assert.equal(postAuthPath(member, '/editor/members'), '/dashboard');
    assert.equal(signedInHomePath(editor), '/editor');
  });

  it('honors /editor/members for admin and can_view_members', () => {
    assert.equal(postAuthPath(admin, '/editor/members'), '/editor/members');
    assert.equal(postAuthPath(viewer, '/editor/members'), '/editor/members');
    assert.equal(loginAuthedDestination({
      profile: viewer,
      rawNext: '/editor/members',
    }), '/editor/members');
  });

  it('strips PKCE params and rejects nested /login nexts', () => {
    assert.equal(safeNext('/editor/members?code=abc'), '/editor/members');
    assert.equal(safeNext('/login?next=/editor/members'), null);
    assert.equal(guardLoginPath({
      pathname: '/editor/members',
      search: '?code=pkce-replay',
    }), '/login?next=%2Feditor%2Fmembers');
  });
});

describe('redirect graph has no cycle', () => {
  it('signed-out /editor/members lands on login and stays', () => {
    const walk = walkAuthRedirects('/editor/members', signedOut);
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/login?next=%2Feditor%2Fmembers');
    assert.equal(decideAuthRedirect(walk.stuckAt, signedOut), null);
  });

  it('signed-in member without can_view_members stays on a stable unauthorized roster URL', () => {
    const walk = walkAuthRedirects('/editor/members', authed(president));
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/editor/members');
    assert.equal(decideAuthRedirect('/editor/members', authed(member)), null);
  });

  it('signed-in roster viewer stays on /editor/members', () => {
    const walk = walkAuthRedirects('/editor/members', authed(viewer));
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/editor/members');
    assert.equal(walkAuthRedirects('/editor/members', authed(admin)).stuckAt, '/editor/members');
  });

  it('stale session without a profiles row stays on the roster (no login bounce)', () => {
    const walk = walkAuthRedirects('/editor/members', halfSession);
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/editor/members');
    assert.equal(guardLoginPath({
      pathname: '/editor/members',
      search: '',
      halfSession: true,
    }), null);
  });

  it('does not cycle when sessionUsable flickers on the roster URL', () => {
    const walk = walkAuthRedirects('/editor/members', (i) => (
      i % 2 === 0 ? halfSession : authed(president)
    ));
    assert.equal(walk.cycle, false, `cycled: ${walk.hops.join(' → ')}`);
    assert.equal(walk.stuckAt, '/editor/members');
  });

  it('signed-out roster then signed-in president lands on dashboard, not back on the roster', () => {
    let signedIn = false;
    const walk = walkAuthRedirects('/editor/members', (_i, loc) => {
      if (loc.startsWith('/login')) signedIn = true;
      return signedIn ? authed(president) : signedOut;
    });
    assert.equal(walk.cycle, false, `cycled: ${walk.hops.join(' → ')}`);
    assert.deepEqual(walk.hops, ['/editor/members', '/login?next=%2Feditor%2Fmembers', '/dashboard']);
    assert.equal(walk.stuckAt, '/dashboard');
  });

  it('Login with next=/editor/members does not send a non-viewer back to the roster', () => {
    assert.equal(
      decideAuthRedirect('/login?next=%2Feditor%2Fmembers', authed(president)),
      '/dashboard',
    );
    assert.equal(
      decideAuthRedirect('/login?next=%2Feditor%2Fmembers', authed(editor)),
      '/editor',
    );
    const walk = walkAuthRedirects('/login?next=%2Feditor%2Fmembers', authed(president));
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/dashboard');
  });

  it('homepage is never part of an auth bounce', () => {
    assert.equal(decideAuthRedirect('/', signedOut), null);
    assert.equal(decideAuthRedirect('/', authed(president)), null);
    assert.equal(decideAuthRedirect('/', halfSession), null);
    assert.equal(decideAuthRedirect('/', loading), null);
    assert.equal(walkAuthRedirects('/', halfSession).cycle, false);
  });
});

function walkRosterGate(events) {
  let url = '/editor/members';
  let hadSession = false;
  const hops = [url];
  for (const auth of events) {
    if (auth.user) hadSession = true;
    if (url.startsWith('/editor/members')) {
      const leave = shouldLeaveForLogin({
        sessionUsable: auth.sessionUsable,
        user: auth.user,
        hadSession,
        intentionalSignOut: !!auth.intentionalSignOut,
        holdExpired: !!auth.holdExpired,
      });
      if (leave) url = '/login?next=%2Feditor%2Fmembers';
    } else if (url.startsWith('/login')) {
      const dest = decideAuthRedirect(url, auth);
      if (dest) url = dest;
    }
    hops.push(url);
  }
  let sawLogin = false;
  let returnedToRoster = false;
  let leftAgain = false;
  for (const hop of hops) {
    if (hop.startsWith('/login')) {
      if (returnedToRoster) leftAgain = true;
      sawLogin = true;
    } else if (hop === '/editor/members' && sawLogin) {
      returnedToRoster = true;
    }
  }
  return { cycle: leftAgain, hops, stuckAt: url };
}

describe('privileged roster session drop does not bounce through login', () => {
  const viewerUser = { id: 'shani' };
  const onRoster = {
    loading: false,
    sessionUsable: true,
    halfSession: false,
    profile: viewer,
    user: viewerUser,
  };
  const dropped = {
    loading: false,
    sessionUsable: false,
    halfSession: false,
    profile: null,
    user: null,
  };

  it('holds the roster while a privileged session is gone and not yet expired', () => {
    assert.equal(shouldLeaveForLogin({
      sessionUsable: false,
      user: null,
      hadSession: true,
      intentionalSignOut: false,
      holdExpired: false,
    }), false);
    const walk = walkRosterGate([onRoster, dropped, onRoster, dropped, onRoster]);
    assert.equal(walk.cycle, false, walk.hops.join(' → '));
    assert.equal(walk.stuckAt, '/editor/members');
    assert.equal(walk.hops.includes('/login?next=%2Feditor%2Fmembers'), false);
  });

  it('sends a cold signed-out visit to login once, then back to the roster after sign-in', () => {
    assert.equal(shouldLeaveForLogin({
      sessionUsable: false,
      user: null,
      hadSession: false,
      intentionalSignOut: false,
      holdExpired: false,
    }), true);
    const walk = walkRosterGate([dropped, dropped, onRoster, onRoster]);
    assert.equal(walk.cycle, false, walk.hops.join(' → '));
    assert.deepEqual(walk.hops, [
      '/editor/members',
      '/login?next=%2Feditor%2Fmembers',
      '/login?next=%2Feditor%2Fmembers',
      '/editor/members',
      '/editor/members',
    ]);
  });

  it('leaves for login after the hold expires, and on an intentional sign-out immediately', () => {
    assert.equal(shouldLeaveForLogin({
      sessionUsable: false,
      user: null,
      hadSession: true,
      intentionalSignOut: false,
      holdExpired: true,
    }), true);
    assert.equal(shouldLeaveForLogin({
      sessionUsable: false,
      user: null,
      hadSession: true,
      intentionalSignOut: true,
      holdExpired: false,
    }), true);
    const walk = walkRosterGate([
      onRoster,
      { ...dropped, holdExpired: true },
      dropped,
    ]);
    assert.equal(walk.cycle, false, walk.hops.join(' → '));
    assert.equal(walk.stuckAt, '/login?next=%2Feditor%2Fmembers');
  });
});

describe('held-session recovery does not re-enter after a clear', () => {
  it('does not retry SIGNED_OUT when there is no previous session', () => {
    assert.equal(shouldRetryAuthRecovery({
      event: 'SIGNED_OUT',
      session: null,
      previous: null,
    }), false);
    assert.equal(shouldRetryAuthRecovery({
      event: 'SIGNED_OUT',
      session: null,
      previous: { user: { id: '1' } },
    }), true);
  });
});

describe('wiring', () => {
  it('Login and roster guard use the shared redirect helpers', () => {
    const login = readFileSync(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
    const roster = readFileSync(new URL('../src/components/RequireMemberViewer.jsx', import.meta.url), 'utf8');
    assert.match(login, /decideAuthRedirect/);
    assert.match(roster, /guardLoginPath/);
    assert.match(roster, /!sessionUsable && !!user/);
    assert.match(roster, /canViewMemberRoster/);
    assert.doesNotMatch(roster, /is_board|is_membership_committee/);
  });
});
