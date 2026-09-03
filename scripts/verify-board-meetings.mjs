#!/usr/bin/env node
// Assert T45 Board meeting pages: real Drive-backed seed, member gate, no Zoom secrets.
import { readFileSync } from 'node:fs';
import {
  BOARD_HUB,
  listBoardMeetings,
  getBoardMeeting,
  upcomingMeetings,
  meetingsWithAgenda,
  meetingsWithMinutes,
  hasFullBody,
  hasListedDoc,
} from '../src/data/boardMeetings.js';

const fail = (msg) => {
  console.error(`verify-board-meetings: ${msg}`);
  process.exit(1);
};

if (BOARD_HUB.title !== 'Board meetings') fail('Hub title must stay Board meetings');
if (!/active SAMPA membership/i.test(BOARD_HUB.oneLiner)) {
  fail('Hub one-liner must say this is an active-membership benefit');
}
if (!/monthly/i.test(BOARD_HUB.cadence)) fail('Cadence must mention monthly meetings');
if (!/calendar invite/i.test(BOARD_HUB.cadence)) fail('Cadence must point join links at the calendar invite');

const meetings = listBoardMeetings();
const slugs = meetings.map((m) => m.slug);
if (slugs[0] !== '2026-09') fail('List must be newest first (September 2026)');

const required = [
  '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04',
  '2026-03', '2026-02', '2026-01', '2026-annual',
  '2025-09', '2025-08', '2025-07', '2025-06', '2025-02',
];
for (const slug of required) {
  if (!getBoardMeeting(slug)) fail(`Missing meeting ${slug}`);
}
if (getBoardMeeting('2026-fall')) fail('Placeholder 2026-fall must be gone');
if (getBoardMeeting('not-a-meeting')) fail('Unknown slug must return null');

const seen = new Set();
for (const m of meetings) {
  if (!m.slug || !m.title || !m.kind || !m.status) fail(`Meeting missing required fields: ${m.slug || '?'}`);
  if (seen.has(m.slug)) fail(`Duplicate slug ${m.slug}`);
  seen.add(m.slug);
  if (!m.agenda || !m.minutes) fail(`${m.slug} must have agenda + minutes objects`);
  const ok = ['posted', 'on_file', 'pending', 'not_yet'];
  if (!ok.includes(m.agenda.status)) fail(`${m.slug} agenda status invalid`);
  if (!ok.includes(m.minutes.status)) fail(`${m.slug} minutes status invalid`);
}

const july = getBoardMeeting('2026-07');
if (!hasFullBody(july.agenda)) fail('July 2026 agenda must have full posted HTML');
if (!hasFullBody(july.minutes)) fail('July 2026 minutes must have full posted HTML');
if (!july.agenda.bodyHtml.includes('July 8, 2026')) fail('July agenda must name July 8, 2026');
if (!july.agenda.bodyHtml.includes('Election Updates')) fail('July agenda missing business items');
if (!july.minutes.bodyHtml.includes('Shani Wilson')) fail('July minutes must name the chair');
if (!july.minutes.bodyHtml.includes('Directors-at-Large')) fail('July minutes missing ASIO motion');
if (!july.minutes.bodyHtml.includes('Kala Klug')) fail('July minutes must credit the secretary');

const stubAgendas = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-08', '2026-09'];
for (const slug of stubAgendas) {
  const m = getBoardMeeting(slug);
  if (!hasListedDoc(m.agenda)) fail(`${slug} agenda must be listed (on file or posted)`);
  if (hasFullBody(m.agenda)) fail(`${slug} agenda should stay a stub until CoS pastes`);
  if (!/on file/i.test(m.agenda.bodyHtml || '')) fail(`${slug} agenda stub must say on file`);
}

const stubMinutes2026 = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
for (const slug of stubMinutes2026) {
  const m = getBoardMeeting(slug);
  if (!hasListedDoc(m.minutes)) fail(`${slug} minutes must be on file`);
  if (hasFullBody(m.minutes)) fail(`${slug} minutes should stay a stub until CoS pastes`);
}

if (getBoardMeeting('2026-08').minutes.status !== 'not_yet') {
  fail('August 2026 minutes are not posted yet');
}
if (getBoardMeeting('2026-09').minutes.status !== 'not_yet') {
  fail('September 2026 minutes are not posted yet');
}

for (const slug of ['2025-02', '2025-06', '2025-07', '2025-08', '2025-09']) {
  const m = getBoardMeeting(slug);
  if (!hasListedDoc(m.minutes)) fail(`${slug} minutes must be listed as available`);
}

if (!hasListedDoc(getBoardMeeting('2026-annual').agenda)) {
  fail('Annual 2026 materials must be listed');
}

if (upcomingMeetings(meetings)[0]?.slug !== '2026-09') {
  fail('Next upcoming meeting should be September 2026');
}
if (meetingsWithAgenda(meetings).length < 9) fail('2026 agendas should all be listed');
if (meetingsWithMinutes(meetings).length < 10) fail('Minutes list is too thin');

const seedSrc = readFileSync('src/data/boardMeetings.js', 'utf8');
if (/zoom\.us/i.test(seedSrc) || /pwd=/i.test(seedSrc)) {
  fail('Do not paste Zoom join URLs or passcodes');
}
if (/coming soon/i.test(seedSrc)) fail('Do not leave coming-soon copy for listed months');

const viewSrc = readFileSync('src/pages/BoardMeetingView.jsx', 'utf8');
if (!viewSrc.includes('dangerouslySetInnerHTML')) fail('Meeting view must render seed HTML');
if (!viewSrc.includes('DOMPurify')) fail('Meeting HTML must be sanitized');

const hubSrc = readFileSync('src/pages/BoardMeetings.jsx', 'utf8');
if (!hubSrc.includes('meetingsWithAgenda')) fail('Hub must list agendas from seed');
if (!hubSrc.includes('meetingsWithMinutes')) fail('Hub must list minutes from seed');

const appSrc = readFileSync('src/App.jsx', 'utf8');
if (!appSrc.includes('path="/board"')) fail('App must declare /board');
if (!appSrc.includes('path="/board/:slug"')) fail('App must declare /board/:slug');
if ((appSrc.match(/deniedCopy="Board meeting agendas and minutes/g) || []).length < 2) {
  fail('Both board routes must use Board-specific RequireActiveMember copy');
}

const guardSrc = readFileSync('src/components/RequireActiveMember.jsx', 'utf8');
if (!guardSrc.includes('canAccessMemberDirectory')) fail('Board reuses RequireActiveMember / is_active_member');

const navSrc = readFileSync('src/components/Navbar.jsx', 'utf8');
if ((navSrc.match(/to="\/board"/g) || []).length < 2) fail('Navbar needs desktop + mobile Board links');

const dashSrc = readFileSync('src/pages/Dashboard.jsx', 'utf8');
if (!dashSrc.includes('to="/board"')) fail('Dashboard must link Board meetings');

console.log('verify-board-meetings: ok');
