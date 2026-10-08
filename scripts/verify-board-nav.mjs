import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { boardNavItem, visibleBoardTabs } from '../src/lib/boardNav.js';
import { memberBenefitSignInNote, rosterBackLink } from '../src/lib/memberHome.js';
import MemberRosterLink from '../src/components/MemberRosterLink.jsx';

const activeMember = { role: 'member', membership_status: 'active' };
const boardOnly = { role: 'member', membership_status: 'canceled', is_board: true };
const chairOnly = { role: 'member', membership_status: null, is_committee_chair: true };
const chairMember = {
  role: 'member',
  membership_status: 'active',
  is_committee_chair: true,
};
const admin = { role: 'admin' };
const rosterOnly = { role: 'member', can_view_members: true };
const editorRoster = { role: 'editor', can_view_members: true };

function html(node) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, node));
}

function roster(profile) {
  return html(createElement(MemberRosterLink, { profile }));
}

describe('board tab visibility', () => {
  it('hides the strip for a signed-out visitor', () => {
    assert.deepEqual(visibleBoardTabs(null), []);
  });

  it('hides the strip for an active member who cannot open the dashboard', () => {
    assert.deepEqual(visibleBoardTabs(activeMember), []);
  });

  it('hides the strip for a board member who is not an active member', () => {
    assert.deepEqual(visibleBoardTabs(boardOnly), []);
  });

  it('hides the strip for a chair who is not an active member', () => {
    assert.deepEqual(visibleBoardTabs(chairOnly), []);
  });

  it('shows Meetings & records and Dashboard for a chair who is an active member', () => {
    assert.deepEqual(visibleBoardTabs(chairMember), [
      { id: 'meetings', label: 'Meetings & records', to: '/board' },
      { id: 'dashboard', label: 'Dashboard', to: '/board/dashboard' },
    ]);
  });

  it('shows Meetings & records and Dashboard for an admin', () => {
    assert.deepEqual(visibleBoardTabs(admin), [
      { id: 'meetings', label: 'Meetings & records', to: '/board' },
      { id: 'dashboard', label: 'Dashboard', to: '/board/dashboard' },
    ]);
  });

  it('shows both tabs for an active board member', () => {
    assert.deepEqual(visibleBoardTabs({
      role: 'member',
      membership_status: 'active',
      is_board: true,
    }), [
      { id: 'meetings', label: 'Meetings & records', to: '/board' },
      { id: 'dashboard', label: 'Dashboard', to: '/board/dashboard' },
    ]);
  });
});

describe('navbar Board link', () => {
  it('sends a signed-out visitor to /board', () => {
    assert.deepEqual(boardNavItem({ phase: 'signed-out', profile: null }), {
      label: 'Board',
      to: '/board',
    });
  });

  it('hides Board while auth is still loading', () => {
    assert.equal(boardNavItem({ phase: 'loading', profile: null }), null);
  });

  it('hides Board from a signed-in non-member', () => {
    assert.equal(boardNavItem({
      phase: 'signed-in',
      profile: { role: 'member', membership_status: 'canceled' },
    }), null);
  });

  it('sends an active member to /board', () => {
    assert.deepEqual(boardNavItem({ phase: 'signed-in', profile: activeMember }), {
      label: 'Board',
      to: '/board',
    });
  });

  it('sends a board member without membership to the dashboard', () => {
    assert.deepEqual(boardNavItem({ phase: 'signed-in', profile: boardOnly }), {
      label: 'Board',
      to: '/board/dashboard',
    });
  });

  it('sends a chair without membership to the dashboard', () => {
    assert.deepEqual(boardNavItem({ phase: 'signed-in', profile: chairOnly }), {
      label: 'Board',
      to: '/board/dashboard',
    });
  });

  it('sends an admin to /board', () => {
    assert.deepEqual(boardNavItem({ phase: 'signed-in', profile: admin }), {
      label: 'Board',
      to: '/board',
    });
  });

  it('sends an active board member to meetings, not the dashboard', () => {
    assert.deepEqual(boardNavItem({
      phase: 'signed-in',
      profile: { role: 'member', membership_status: 'active', is_board: true },
    }), {
      label: 'Board',
      to: '/board',
    });
  });
});

describe('roster link on the membership card', () => {
  it('shows Open member roster for an admin and a roster viewer', () => {
    const adminHtml = roster(admin);
    assert.match(adminHtml, /Open member roster →/);
    assert.match(adminHtml, /href="\/editor\/members"/);

    const rosterHtml = roster(rosterOnly);
    assert.match(rosterHtml, /Open member roster →/);
  });

  it('hides the roster link from a board member who cannot view members', () => {
    assert.equal(roster(boardOnly), '');
    assert.equal(roster(activeMember), '');
    assert.equal(roster(null), '');
  });
});

describe('roster back link', () => {
  it('sends an editor back to the editor and a roster-only viewer to their account', () => {
    assert.deepEqual(rosterBackLink(editorRoster), { to: '/editor', label: '← Editor' });
    assert.deepEqual(rosterBackLink(admin), { to: '/editor', label: '← Editor' });
    assert.deepEqual(rosterBackLink(rosterOnly), { to: '/dashboard', label: '← My account' });
  });
});

describe('login note for member areas', () => {
  it('explains Board when next is /board', () => {
    assert.equal(
      memberBenefitSignInNote('/board'),
      'Board records are a member benefit. Sign in to continue.',
    );
  });

  it('explains the same line for /members and a board dashboard return', () => {
    const line = 'Board records are a member benefit. Sign in to continue.';
    assert.equal(memberBenefitSignInNote('/members'), line);
    assert.equal(memberBenefitSignInNote('/members/abc'), line);
    assert.equal(memberBenefitSignInNote('/board/dashboard'), line);
  });

  it('stays quiet for other destinations', () => {
    assert.equal(memberBenefitSignInNote('/news'), null);
    assert.equal(memberBenefitSignInNote('/dashboard'), null);
    assert.equal(memberBenefitSignInNote(null), null);
  });
});
