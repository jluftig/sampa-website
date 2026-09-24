#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canViewPolicyWork } from '../src/lib/policyWorkAccess.js';
import { canViewMemberRoster } from '../src/lib/memberRoster.js';
import {
  postAuthPath,
  signedInHomePath,
} from '../src/lib/memberHome.js';
import {
  decideAuthRedirect,
  guardLoginPath,
  walkAuthRedirects,
} from '../src/lib/authRedirect.js';
import {
  hardScreenPasses,
  listPolicyWorkItems,
  mergePolicyWorkOverlay,
  parsePolicyWorkOverlay,
  policyWorkOverlayFromEdits,
  policyWorkTimeline,
  upcomingPolicyWorkDeadlines,
} from '../src/data/policyWork.js';

const president = {
  role: 'member',
  is_board: true,
  membership_status: 'active',
};
const editor = { role: 'editor', membership_status: 'active' };
const member = { role: 'member', membership_status: 'active' };
const viewer = { role: 'member', can_view_members: true, membership_status: 'active' };
const admin = { role: 'admin', membership_status: 'active' };
const committee = { role: 'member', is_membership_committee: true, membership_status: 'active' };

const signedOut = { loading: false, sessionUsable: false, halfSession: false, profile: null };
const halfSession = { loading: false, sessionUsable: false, halfSession: true, profile: null };

function authed(profile) {
  return { loading: false, sessionUsable: true, halfSession: false, profile };
}

describe('canViewPolicyWork', () => {
  it('allows admin, view-members, and board, and refuses the other hats', () => {
    assert.equal(canViewPolicyWork(admin), true);
    assert.equal(canViewPolicyWork(viewer), true);
    assert.equal(canViewPolicyWork(president), true);
    assert.equal(canViewPolicyWork(editor), false);
    assert.equal(canViewPolicyWork(member), false);
    assert.equal(canViewPolicyWork(committee), false);
    assert.equal(canViewPolicyWork(null), false);
    assert.equal(canViewPolicyWork({ can_edit_news: true }), false);
    assert.equal(canViewMemberRoster(president), false);
  });
});

describe('postAuthPath for /editor/policy', () => {
  it('keeps a board member on the tracker and sends everyone else home', () => {
    assert.equal(postAuthPath(president, '/editor/policy'), '/editor/policy');
    assert.equal(postAuthPath(admin, '/editor/policy'), '/editor/policy');
    assert.equal(postAuthPath(viewer, '/editor/policy'), '/editor/policy');
    assert.equal(postAuthPath(member, '/editor/policy'), '/dashboard');
    assert.equal(postAuthPath(editor, '/editor/policy'), '/editor');
    assert.equal(postAuthPath(committee, '/editor/policy'), '/dashboard');
    assert.equal(postAuthPath(president, '/editor/members'), '/dashboard');
    assert.equal(signedInHomePath(president), '/dashboard');
  });
});

describe('redirect graph for /editor/policy', () => {
  it('sends a signed-out visit to login and stays there', () => {
    const walk = walkAuthRedirects('/editor/policy', signedOut);
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/login?next=%2Feditor%2Fpolicy');
    assert.equal(decideAuthRedirect(walk.stuckAt, signedOut), null);
    assert.equal(guardLoginPath({ pathname: '/editor/policy', search: '' }), '/login?next=%2Feditor%2Fpolicy');
  });

  it('returns a signed-in board member to the tracker and then stays', () => {
    const toLogin = decideAuthRedirect('/editor/policy', signedOut);
    assert.equal(toLogin, '/login?next=%2Feditor%2Fpolicy');
    const back = decideAuthRedirect(toLogin, authed(president));
    assert.equal(back, '/editor/policy');
    assert.equal(decideAuthRedirect(back, authed(president)), null);
    assert.equal(decideAuthRedirect('/editor/policy', authed(editor)), null);
  });

  it('sends a signed-in member home instead of back to the tracker', () => {
    let signedIn = false;
    const walk = walkAuthRedirects('/editor/policy', (_i, loc) => {
      if (loc.startsWith('/login')) signedIn = true;
      return signedIn ? authed(member) : signedOut;
    });
    assert.equal(walk.cycle, false, walk.hops.join(' → '));
    assert.deepEqual(walk.hops, [
      '/editor/policy',
      '/login?next=%2Feditor%2Fpolicy',
      '/dashboard',
    ]);
  });

  it('holds a half-hydrated session on the tracker URL', () => {
    const walk = walkAuthRedirects('/editor/policy', halfSession);
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/editor/policy');
    const flicker = walkAuthRedirects('/editor/policy', (i) => (
      i % 2 === 0 ? halfSession : authed(member)
    ));
    assert.equal(flicker.cycle, false, flicker.hops.join(' → '));
    assert.equal(flicker.stuckAt, '/editor/policy');
  });

  it('does not pull the homepage or login into the tracker', () => {
    assert.equal(decideAuthRedirect('/', signedOut), null);
    assert.equal(decideAuthRedirect('/login', signedOut), null);
    assert.equal(decideAuthRedirect('/', authed(president)), null);
  });
});

describe('policy work seed', () => {
  it('lists the three sheet rows and no blank template rows', () => {
    const items = listPolicyWorkItems();
    assert.deepEqual(items.map((item) => item.responseNumber), [1, 2, 3]);
    assert.equal(items[0].organization, 'HHS');
    assert.equal(items[0].title, 'Comment on Chronic Disease of Addiction');
    assert.equal(items[0].status, 'filed');
    assert.equal(items[0].submittedAt, '2026-07-05');
    assert.equal(items[0].submittedTo, 'Brian Dautch of AAPA');
    assert.equal(
      items[0].packetUrl,
      'https://docs.google.com/document/d/1SQWwYdfgSkxT8VYASlPZ4s4v-yGHdGBa/edit?usp=share_link&ouid=104595662487774707106&rtpof=true&sd=true',
    );
    assert.equal(items[0].publicPath, '/policy/hhs-rfi-chronic-disease-addiction-2026');
    assert.equal(items[1].organization, 'ASAM');
    assert.equal(items[1].status, 'filed');
    assert.equal(items[1].submittedAt, '2026-06-29');
    assert.equal(items[1].submittedTo, 'Jennifer Kolb of AAPA');
    assert.equal(items[1].publicPath, null);
    assert.equal(
      items[1].packetUrl,
      'https://docs.google.com/document/d/1d7vJlcLmm7go7S7WvWhXMbl06qBkejRTlDFk7Ut3B5o/edit?usp=sharing',
    );
    assert.equal(items[2].organization, 'HRSA');
    assert.equal(items[2].status, 'screening');
    assert.equal(items[2].submittedAt, null);
    assert.equal(items[2].submittedTo, '');
    assert.equal(items[2].packetUrl, null);
    assert.equal(items[2].criteria.priority_pa_org, false);
    assert.equal(items[2].punchList.length, 2);
  });

  it('passes the hard screen only for addiction-and-PA or a priority PA organization', () => {
    const items = listPolicyWorkItems();
    assert.equal(hardScreenPasses(items[0].criteria), true);
    assert.equal(hardScreenPasses(items[2].criteria), true);
    assert.equal(hardScreenPasses({
      addiction_related: false,
      affects_pas: true,
      priority_pa_org: false,
    }), false);
    assert.equal(hardScreenPasses({
      addiction_related: true,
      affects_pas: false,
      priority_pa_org: false,
    }), false);
    assert.equal(hardScreenPasses({
      addiction_related: false,
      affects_pas: false,
      priority_pa_org: true,
    }), true);
  });

  it('shows submitted dates on the strip and no open dues in the seed', () => {
    const items = listPolicyWorkItems();
    assert.deepEqual(upcomingPolicyWorkDeadlines(items, '2026-09-24'), []);
    const strip = policyWorkTimeline(items);
    assert.deepEqual(strip.map((row) => [row.organization, row.kind, row.date]), [
      ['ASAM', 'submitted', '2026-06-29'],
      ['HHS', 'submitted', '2026-07-05'],
      ['HRSA', 'undated', null],
    ]);
  });
});

describe('browser overlay', () => {
  it('applies a valid patch and ignores a bad status and unknown criterion', () => {
    const seed = listPolicyWorkItems();
    const merged = mergePolicyWorkOverlay(seed, {
      'php-2026-3': {
        status: 'drafting',
        owner: '  Deanna  ',
        dueDate: '2026-10-01',
        criteria: { priority_pa_org: true, not_a_criterion: true },
        punchDone: { 'fill-sheet': true },
      },
      'php-2026-1': { status: 'nope' },
    });
    assert.equal(merged[2].status, 'drafting');
    assert.equal(merged[2].owner, 'Deanna');
    assert.equal(merged[2].dueDate, '2026-10-01');
    assert.equal(merged[2].criteria.priority_pa_org, true);
    assert.equal(merged[2].criteria.not_a_criterion, undefined);
    assert.equal(merged[2].punchList[0].done, true);
    assert.equal(merged[2].punchList[1].done, false);
    assert.equal(merged[0].status, 'filed');
    assert.deepEqual(
      upcomingPolicyWorkDeadlines(merged, '2026-09-24').map((item) => item.id),
      ['php-2026-3'],
    );
  });

  it('round-trips an edit and drops garbage storage', () => {
    const seed = listPolicyWorkItems();
    const edited = seed.map((item) => (
      item.id === 'php-2026-2'
        ? { ...item, status: 'chairs_review', punchList: item.punchList.map((row) => ({ ...row, done: true })) }
        : item
    ));
    const overlay = policyWorkOverlayFromEdits(seed, edited);
    assert.deepEqual(overlay, {
      'php-2026-2': {
        status: 'chairs_review',
        punchDone: { 'separate-correctional': true },
      },
    });
    const again = mergePolicyWorkOverlay(seed, overlay);
    assert.equal(again[1].status, 'chairs_review');
    assert.equal(again[1].punchList[0].done, true);
    assert.equal(again[0].status, 'filed');
    assert.deepEqual(parsePolicyWorkOverlay('not json'), {});
    assert.deepEqual(parsePolicyWorkOverlay('[]'), {});
    assert.deepEqual(parsePolicyWorkOverlay(null), {});
  });
});

describe('route wiring', () => {
  it('registers /editor/policy before /editor/:id and gates it', () => {
    const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
    const policyAt = app.indexOf('path="/editor/policy"');
    const idAt = app.indexOf('path="/editor/:id"');
    assert.ok(policyAt > 0);
    assert.ok(idAt > policyAt);
    assert.match(app, /RequirePolicyWork/);
    const guard = readFileSync(new URL('../src/components/RequirePolicyWork.jsx', import.meta.url), 'utf8');
    assert.match(guard, /useAuthGate/);
    assert.match(guard, /canViewPolicyWork/);
    assert.match(guard, /Checking access/);
    assert.doesNotMatch(guard, /is_membership_committee|is_board/);
    const page = readFileSync(new URL('../src/pages/PolicyWorkHub.jsx', import.meta.url), 'utf8');
    assert.match(page, /listPolicyWorkItems/);
    assert.match(page, /Punch list/);
    assert.doesNotMatch(
      readFileSync(new URL('../src/pages/Policy.jsx', import.meta.url), 'utf8'),
      /policyWork/,
    );
  });
});
