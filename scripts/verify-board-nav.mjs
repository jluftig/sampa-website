import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { boardNavItem, visibleBoardTabs } from '../src/lib/boardNav.js';
import { memberBenefitSignInNote, rosterBackLink } from '../src/lib/memberHome.js';
import { joinCta, mySampaItems, showMySampa } from '../src/lib/mySampa.js';
import { AuthContext } from '../src/lib/authState.js';
import MemberRosterLink from '../src/components/MemberRosterLink.jsx';
import Navbar from '../src/components/Navbar.jsx';
import { MY_SAMPA_CASES } from './my-sampa-cases.mjs';

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
  const records = {
    text: 'Board records are a member benefit. Sign in to continue.',
    showJoin: true,
  };
  const directory = {
    text: 'The member directory is a member benefit. Sign in to continue.',
    showJoin: true,
  };
  const dashboard = {
    text: 'Board members and committee chairs: sign in to view the dashboard.',
    showJoin: false,
  };

  it('keeps the records line for /board and a meeting', () => {
    assert.deepEqual(memberBenefitSignInNote('/board'), records);
    assert.deepEqual(memberBenefitSignInNote('/board/2026-09'), records);
    assert.deepEqual(memberBenefitSignInNote('/board?from=nav'), records);
  });

  it('uses the directory line for /members', () => {
    assert.deepEqual(memberBenefitSignInNote('/members'), directory);
    assert.deepEqual(memberBenefitSignInNote('/members/abc'), directory);
    assert.deepEqual(memberBenefitSignInNote('/members/abc?x=1'), directory);
  });

  it('uses the dashboard line without a join link', () => {
    assert.deepEqual(memberBenefitSignInNote('/board/dashboard'), dashboard);
    assert.deepEqual(memberBenefitSignInNote('/board/dashboard#top'), dashboard);
  });

  it('stays quiet for other destinations', () => {
    assert.equal(memberBenefitSignInNote('/news'), null);
    assert.equal(memberBenefitSignInNote('/dashboard'), null);
    assert.equal(memberBenefitSignInNote('/membership'), null);
    assert.equal(memberBenefitSignInNote(null), null);
  });
});

describe('My SAMPA menu and the Join CTA', () => {
  for (const row of MY_SAMPA_CASES) {
    it(`${row.name}: menu items and Join, Renew, or neither`, () => {
      assert.equal(showMySampa(row.viewer), row.mySampa);
      assert.deepEqual(mySampaItems(row.viewer), row.items);
      assert.deepEqual(joinCta(row.viewer), row.cta);
    });
  }

  it('Sign out is a menu action, and the header calls the intentional signOut', () => {
    const signedIn = MY_SAMPA_CASES.find((row) => row.name === 'active');
    const signOut = mySampaItems(signedIn.viewer).find((item) => item.label === 'Sign out');
    assert.equal(signOut.action, 'sign-out');
    assert.equal(signOut.to, undefined);

    const navbar = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
    assert.match(navbar, /signOut\(\)/);
    assert.doesNotMatch(navbar, /supabase/);
  });
});

function navbarHtml(viewer) {
  const auth = {
    ...viewer,
    signOut() {},
  };
  return html(createElement(
    AuthContext.Provider,
    { value: auth },
    createElement(Navbar),
  ));
}

function topBar(markup) {
  const at = markup.indexOf('My SAMPA');
  return at === -1 ? markup : markup.slice(0, at);
}

describe('Navbar render', () => {
  for (const row of MY_SAMPA_CASES) {
    it(`${row.name}: Join, Renew, or My SAMPA, and Directory and Board leave the top bar when signed in`, () => {
      const markup = navbarHtml(row.viewer);
      assert.match(markup, />Membership</);

      if (row.mySampa) {
        assert.match(markup, /My SAMPA/);
        assert.doesNotMatch(markup, /Member Login/);
        assert.doesNotMatch(topBar(markup), /Directory/);
        assert.doesNotMatch(topBar(markup), />Board</);
      } else {
        assert.match(markup, /Member Login/);
        assert.doesNotMatch(markup, /My SAMPA/);
      }

      if (row.cta?.label === 'Join') {
        assert.match(markup, />Join</);
        assert.doesNotMatch(markup, />Renew</);
      } else if (row.cta?.label === 'Renew') {
        assert.match(markup, />Renew</);
        assert.doesNotMatch(markup, />Join</);
      } else {
        assert.doesNotMatch(markup, />Join</);
        assert.doesNotMatch(markup, />Renew</);
      }

      if (!row.mySampa && row.name !== 'loading') {
        assert.match(markup, /href="\/board"/);
        assert.match(markup, />Board</);
      }
      if (row.name === 'loading') {
        assert.doesNotMatch(markup, />Board</);
        assert.doesNotMatch(markup, /Directory/);
      }
    });
  }

  it('past_due Renew goes to the dashboard, and canceled Renew stays on checkout', () => {
    const pastDue = navbarHtml(MY_SAMPA_CASES.find((row) => row.name === 'past_due').viewer);
    const canceled = navbarHtml(MY_SAMPA_CASES.find((row) => row.name === 'canceled').viewer);
    assert.match(pastDue, /href="\/dashboard"[^>]*>\s*<span>Renew<\/span>/);
    assert.doesNotMatch(pastDue, /href="\/join"[^>]*>\s*<span>Renew<\/span>/);
    assert.match(canceled, /href="\/join"[^>]*>\s*<span>Renew<\/span>/);

    const navbar = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
    const spots = navbar.match(/<HeaderCta\b[^/]*\/>/g) || [];
    assert.equal(spots.length, 2);
    for (const spot of spots) {
      assert.match(spot, /cta=\{cta\}/);
      assert.doesNotMatch(spot, /\bto=/);
    }
    assert.match(navbar, /to=\{cta\.to\}/);
  });
});
