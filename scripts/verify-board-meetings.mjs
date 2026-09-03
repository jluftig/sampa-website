#!/usr/bin/env node
// Assert T45 Board meeting pages: seed shape, member gate, routes, entry points.
import { readFileSync } from 'node:fs';
import {
  BOARD_HUB,
  STANDING_AGENDA_ITEMS,
  listBoardMeetings,
  getBoardMeeting,
  upcomingMeetings,
  completedMeetings,
  hasPostedDoc,
} from '../src/data/boardMeetings.js';

const fail = (msg) => {
  console.error(`verify-board-meetings: ${msg}`);
  process.exit(1);
};

if (BOARD_HUB.title !== 'Board meetings') fail('Hub title must stay Board meetings');
if (!/active SAMPA membership/i.test(BOARD_HUB.oneLiner)) {
  fail('Hub one-liner must say this is an active-membership benefit');
}
if (!/quarterly/i.test(BOARD_HUB.cadence)) fail('Cadence must mention quarterly meetings');
if (STANDING_AGENDA_ITEMS.length < 5) fail('Standing outline is too thin');

const meetings = listBoardMeetings();
if (meetings.length < 4) fail('Need a full quarterly seed year');
const slugs = new Set();
for (const m of meetings) {
  if (!m.slug || !m.title || !m.kind || !m.status) fail(`Meeting missing required fields: ${m.slug || '?'}`);
  if (slugs.has(m.slug)) fail(`Duplicate slug ${m.slug}`);
  slugs.add(m.slug);
  if (!m.agenda || !m.minutes) fail(`${m.slug} must have agenda + minutes objects`);
  if (!['posted', 'pending', 'not_yet'].includes(m.agenda.status)) {
    fail(`${m.slug} agenda status invalid`);
  }
  if (!['posted', 'pending', 'not_yet'].includes(m.minutes.status)) {
    fail(`${m.slug} minutes status invalid`);
  }
  if (m.agenda.status === 'posted' && !m.agenda.pdfUrl) fail(`${m.slug} posted agenda needs pdfUrl`);
  if (m.minutes.status === 'posted' && !m.minutes.pdfUrl) fail(`${m.slug} posted minutes need pdfUrl`);
}

if (!getBoardMeeting('2026-fall')) fail('Fall 2026 seed meeting missing');
if (getBoardMeeting('not-a-meeting')) fail('Unknown slug must return null');
if (upcomingMeetings(meetings).length === 0) fail('Seed year should have upcoming/scheduled meetings');
if (completedMeetings(meetings).some((m) => hasPostedDoc(m.minutes) === undefined)) {
  fail('hasPostedDoc must be defined for completed minutes');
}

const appSrc = readFileSync('src/App.jsx', 'utf8');
if (!appSrc.includes('path="/board"')) fail('App must declare /board');
if (!appSrc.includes('path="/board/:slug"')) fail('App must declare /board/:slug');
if (!appSrc.includes('BoardMeetings')) fail('App must lazy-load BoardMeetings');
if (!appSrc.includes('BoardMeetingView')) fail('App must lazy-load BoardMeetingView');
if ((appSrc.match(/deniedCopy="Board meeting agendas and minutes/g) || []).length < 2) {
  fail('Both board routes must use Board-specific RequireActiveMember copy');
}

const guardSrc = readFileSync('src/components/RequireActiveMember.jsx', 'utf8');
if (!guardSrc.includes('canAccessMemberDirectory')) fail('Board reuses RequireActiveMember / is_active_member');
if (!guardSrc.includes('deniedCopy')) fail('RequireActiveMember must accept deniedCopy');

const navSrc = readFileSync('src/components/Navbar.jsx', 'utf8');
if (!navSrc.includes('to="/board"')) fail('Navbar must link /board for members');
if ((navSrc.match(/to="\/board"/g) || []).length < 2) fail('Navbar needs desktop + mobile Board links');

const dashSrc = readFileSync('src/pages/Dashboard.jsx', 'utf8');
if (!dashSrc.includes('to="/board"')) fail('Dashboard must link Board meetings');
if (!dashSrc.includes('Board meetings')) fail('Dashboard link label should be Board meetings');

const rosterSrc = readFileSync('src/components/LeadershipRoster.jsx', 'utf8');
if (!rosterSrc.includes('to="/board"')) fail('About leadership must tease member Board records');
if (!rosterSrc.includes('Members only')) fail('Leadership teaser must say Members only');

const aboutSrc = readFileSync('src/pages/About.jsx', 'utf8');
if (!aboutSrc.includes('Board meeting records')) {
  fail('About join copy should mention Board meeting records');
}

const repoMap = readFileSync('docs/architecture/repo-map.md', 'utf8');
if (!repoMap.includes('`/board`')) fail('repo-map must list /board');

const rls = readFileSync('docs/architecture/security-rls.md', 'utf8');
if (!rls.includes('is_board')) fail('security-rls must record the gating choice');

console.log('verify-board-meetings: ok');
