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
  agendaListTitle,
  recordListTitle,
  nextStandingBoardDates,
  secondWednesday,
} from '../src/data/boardMeetings.js';

const fail = (msg) => {
  console.error(`verify-board-meetings: ${msg}`);
  process.exit(1);
};

if (BOARD_HUB.title !== 'Board meetings') fail('Hub title must stay Board meetings');
if (!/active SAMPA membership/i.test(BOARD_HUB.oneLiner)) {
  fail('Hub one-liner must say this is an active-membership benefit');
}
if (!/second Wednesday/i.test(BOARD_HUB.cadence)) fail('Cadence must state the 2nd-Wednesday rule');
if (!/8:00 PM ET/i.test(BOARD_HUB.cadence)) fail('Cadence must state 8:00 PM ET');
if (!/named invite list/i.test(BOARD_HUB.cadence)) fail('Cadence must say join links stay on the named invite list');
if (!/after the Board approves/i.test(BOARD_HUB.recordsIntro || '')) {
  fail('Records intro must say minutes post after Board approval');
}
if (BOARD_HUB.observerEmail !== 'info@addictionpas.org') {
  fail('Observer email must be info@addictionpas.org');
}
if (!/info@addictionpas\.org/.test(BOARD_HUB.scheduleObserver || '')) {
  fail('Schedule observer blurb must use info@addictionpas.org');
}
if (!/Q2 2027/.test(BOARD_HUB.scheduleAnnual || '')) {
  fail('Annual Membership Meeting must be TBD, Q2 2027');
}
if (!/Executive-session/i.test(BOARD_HUB.scheduleObserver || '')) {
  fail('Observer blurb must say executive session is closed');
}

const meetings = listBoardMeetings();
const slugs = meetings.map((m) => m.slug);
if (slugs[0] !== '2026-09') fail('List must be newest first (September 2026)');

const required = [
  '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04',
  '2026-03', '2026-02', '2026-01', '2026-annual',
  '2025-10', '2025-09', '2025-08', '2025-07', '2025-06', '2025-02',
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

const sep = getBoardMeeting('2026-09');
if (sep.status !== 'upcoming') fail('September 2026 must be upcoming');
if (!hasFullBody(sep.agenda)) fail('September 2026 agenda must have full posted HTML');
if (sep.minutes.status !== 'not_yet') fail('September 2026 minutes are not posted yet');
if (hasFullBody(sep.minutes)) fail('September 2026 minutes must stay empty');
if (!sep.agenda.bodyHtml.includes('Motion to Approve ASIO')) fail('September agenda missing ASIO motion');
if (!sep.agenda.bodyHtml.includes('October 14, 2026')) fail('September agenda must name the next meeting');
if (!sep.agenda.bodyHtml.includes('Newsletter Sub Committee')) fail('September agenda missing Newsletter Sub Committee');

const aug = getBoardMeeting('2026-08');
if (!hasFullBody(aug.agenda)) fail('August 2026 agenda must have full posted HTML');
if (!hasFullBody(aug.minutes)) fail('August 2026 minutes must have full posted HTML');
if (!aug.agenda.bodyHtml.includes('September 9, 2026')) fail('August agenda must name the next meeting');
if (!aug.minutes.bodyHtml.includes('Elections and Vacancies')) fail('August minutes missing Elections and Vacancies');
if (!aug.minutes.bodyHtml.includes('ASIO')) fail('August minutes missing ASIO vacancy');
if (!aug.minutes.bodyHtml.includes('Conflict of Interest')) fail('August minutes missing COI policy');

const postedAgendas2026 = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
for (const slug of postedAgendas2026) {
  const m = getBoardMeeting(slug);
  if (!hasFullBody(m.agenda)) fail(`${slug} agenda must be posted HTML`);
}

const postedMinutes2026 = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
for (const slug of postedMinutes2026) {
  const m = getBoardMeeting(slug);
  if (!hasFullBody(m.minutes)) fail(`${slug} minutes must be posted HTML`);
}

const jan = getBoardMeeting('2026-01');
if (jan.date !== '2026-01-14') fail('January 2026 date must be January 14');
if (!jan.minutes.bodyHtml.includes('Treasurer')) fail('January minutes missing Treasurer seating');

const feb = getBoardMeeting('2026-02');
if (feb.date !== '2026-02-11') fail('February 2026 date must be February 11');
if (!feb.minutes.bodyHtml.includes('Addiction Medicine CAQ')) fail('February minutes missing CAQ approval');

const mar = getBoardMeeting('2026-03');
if (mar.date !== '2026-03-11') fail('March 2026 date must be March 11');
if (!mar.minutes.bodyHtml.includes('501(c)(3)')) fail('March minutes missing 501(c)(3) motion');
if (/transcript link/i.test(mar.minutes.bodyHtml) === false) fail('March minutes should record the no-transcript-link edit');

const apr = getBoardMeeting('2026-04');
if (apr.date !== '2026-04-08') fail('April 2026 date must be April 8');
if (!apr.agenda.bodyHtml.includes('May 17, 2026')) fail('April agenda must name the hybrid next meeting');
if (!apr.minutes.bodyHtml.includes('501(c)(3)')) fail('April minutes missing 501(c)(3) motion');
if (!apr.minutes.bodyHtml.includes('Wyoming')) fail('April minutes must name Wyoming incorporation');

const may = getBoardMeeting('2026-05');
if (may.date !== '2026-05-17') fail('May 2026 date must be May 17');
if (may.format !== 'hybrid') fail('May 2026 must be hybrid');
if (!/Room 278/.test(may.location || '')) fail('May 2026 location must include Room 278');
if (!may.agenda.bodyHtml.includes('AAPA New Orleans')) fail('May agenda must name AAPA New Orleans');
if (!may.minutes.bodyHtml.includes('6:28')) fail('May minutes must include call-to-order time');

const jun = getBoardMeeting('2026-06');
if (jun.date !== '2026-06-10') fail('June 2026 date must be June 10');
if (!jun.minutes.bodyHtml.includes('Wyoming')) fail('June minutes missing Wyoming bylaws approval');

for (const slug of ['2025-02', '2025-06', '2025-07', '2025-08', '2025-09']) {
  const m = getBoardMeeting(slug);
  if (!hasFullBody(m.minutes)) fail(`${slug} minutes must be posted HTML`);
  if (m.era !== 'spaam') fail(`${slug} must be labeled SPAAM / early SAMPA`);
}

const oct25 = getBoardMeeting('2025-10');
if (!hasFullBody(oct25.agenda)) fail('October 2025 agenda must be posted HTML');
if (oct25.minutes.status !== 'not_yet') fail('October 2025 minutes are not posted');
if (oct25.era !== 'spaam') fail('October 2025 must be labeled SPAAM / early SAMPA');
if (!/SPAAM/i.test(getBoardMeeting('2025-02').minutes.bodyHtml)) fail('February 2025 notes must say SPAAM');

if (!hasListedDoc(getBoardMeeting('2026-annual').agenda)) {
  fail('Annual 2026 materials must be listed');
}
if (hasFullBody(getBoardMeeting('2026-annual').agenda) || hasFullBody(getBoardMeeting('2026-annual').minutes)) {
  fail('2026 annual PDF should stay on file until the body is pasted');
}

const leftoverOnFile = meetings.filter((m) => (
  (m.agenda.status === 'on_file' || m.minutes.status === 'on_file') && m.slug !== '2026-annual'
));
if (leftoverOnFile.length) {
  fail(`Unexpected on_file stubs: ${leftoverOnFile.map((m) => m.slug).join(', ')}`);
}

if (upcomingMeetings(meetings)[0]?.slug !== '2026-09') {
  fail('Next upcoming meeting should be September 2026');
}
if (meetingsWithAgenda(meetings).length < 9) fail('2026 agendas should all be listed');
if (meetingsWithMinutes(meetings).length < 10) fail('Minutes list is too thin');

if (isoDate(secondWednesday(2026, 9)) !== '2026-09-09') fail('Sep 2026 second Wednesday is the 9th');
if (isoDate(secondWednesday(2026, 10)) !== '2026-10-14') fail('Oct 2026 second Wednesday is the 14th');
const standing = nextStandingBoardDates(2, new Date(2026, 8, 3), meetings);
if (standing[0]?.date !== '2026-09-09' || standing[0]?.slug !== '2026-09') {
  fail('Next standing date from Sep 3 2026 should be the seeded Sep 9 meeting');
}
if (standing[1]?.date !== '2026-10-14' || standing[1]?.slug) {
  fail('Second standing date is Oct 14 2026 with no empty Oct stub');
}
if (agendaListTitle(getBoardMeeting('2026-09')) !== 'September 9, 2026 Board Meeting') {
  fail('Agenda list titles must be date + Board Meeting');
}
if (!recordListTitle(getBoardMeeting('2026-08')).includes('Virtual BOD')) {
  fail('Records list titles must use AAPA-style Virtual BOD');
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const seedSrc = readFileSync('src/data/boardMeetings.js', 'utf8');
if (/zoom\.us/i.test(seedSrc) || /pwd=/i.test(seedSrc) || /passcode\s*[:=]/i.test(seedSrc) || /meeting[\s-]?id\s*[:=]/i.test(seedSrc)) {
  fail('Do not paste Zoom join URLs, meeting IDs, or passcodes');
}
if (/coming soon/i.test(seedSrc)) fail('Do not leave coming-soon copy for listed months');

const viewSrc = readFileSync('src/pages/BoardMeetingView.jsx', 'utf8');
if (!viewSrc.includes('dangerouslySetInnerHTML')) fail('Meeting view must render seed HTML');
if (!viewSrc.includes('DOMPurify')) fail('Meeting HTML must be sanitized');

const hubSrc = readFileSync('src/pages/BoardMeetings.jsx', 'utf8');
if (!hubSrc.includes('meetingsWithAgenda')) fail('Hub must list agendas from seed');
if (!hubSrc.includes('meetingsWithMinutes')) fail('Hub must list minutes from seed');
if (!hubSrc.includes('role="tablist"')) fail('Hub must use Agendas / Records / Schedule tabs');
if (!hubSrc.includes("id: 'agendas'") || !hubSrc.includes("id: 'records'") || !hubSrc.includes("id: 'schedule'")) {
  fail('Hub tabs must be Agendas, Records, and Schedule');
}
if (!hubSrc.includes('nextStandingBoardDates')) fail('Schedule must use the 2nd-Wednesday standing dates, not a full archive table');
if (!hubSrc.includes('Annual Membership Meeting')) fail('Schedule must list the Annual Membership Meeting separately');
if (hubSrc.includes('SAMPA Board meeting schedule, newest first')) {
  fail('Do not keep the full-history schedule laundry list');
}
if (/year filter|workingYear filter/i.test(hubSrc)) fail('Do not add a year filter on the hub');

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
