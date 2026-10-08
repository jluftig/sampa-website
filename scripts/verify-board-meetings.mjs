#!/usr/bin/env node
// Assert T45 Board meeting pages: real Drive-backed seed, member gate, no Zoom secrets.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { BOARD_HUB } from '../src/data/boardHub.js';
import {
  agendaListTitle,
  hasFullBody,
  hasListedDoc,
  nextStandingBoardDates,
  recordListTitle,
  recordsEmptyCopy,
  secondWednesday,
} from '../src/data/boardSchedule.js';
import {
  meetingsWithAgenda,
  meetingsWithMinutes,
  memberMeeting,
  publicMeeting,
  upcomingMeetings,
  withEffectiveStatus,
} from '../api/_lib/boardMeetings.js';

const fail = (msg) => {
  console.error(`verify-board-meetings: ${msg}`);
  process.exit(1);
};

if (BOARD_HUB.title !== 'Board of Directors Meetings and Meeting Records') {
  fail('Hub title must match the AAPA-style full title');
}
for (const gone of ['eyebrow', 'oneLiner', 'cadence', 'agendasIntro', 'scheduleStanding', 'scheduleAnnual', 'scheduleObserver', 'hubObserverNote', 'disclaimer']) {
  if (BOARD_HUB[gone] != null) fail(`BOARD_HUB.${gone} must be deleted`);
}
if (!/Standard Code of Parliamentary Procedure/.test(BOARD_HUB.recordsIntro || '')) {
  fail('Records intro must follow the AAPA parliamentary-procedure wording');
}
if (!/retained online for one year/.test(BOARD_HUB.recordsIntro || '')) {
  fail('Records intro must say minutes are retained online for one year');
}
if (!/monthly virtual meetings/.test(BOARD_HUB.scheduleIntro || '')) {
  fail('Schedule intro must say monthly virtual meetings');
}
if (BOARD_HUB.observerEmail !== 'info@addictionpas.org') {
  fail('Observer email must be info@addictionpas.org');
}
if (!BOARD_HUB.scheduleIntro.includes('info@addictionpas.org')) {
  fail('Schedule intro must tell members to contact info@addictionpas.org');
}
if (/named roster|all-member blast|join links|executive.session|source of truth/i.test(`${BOARD_HUB.recordsIntro} ${BOARD_HUB.scheduleIntro}`)) {
  fail('Hub copy must stay sparse — no extra access-policy essays');
}

const FIXTURE = withEffectiveStatus([
  {
    slug: '2026-09',
    title: 'September fixture',
    date: '2026-09-09',
    time: '8 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    agenda: { status: 'posted', bodyHtml: '<p>Fixture agenda</p>' },
    minutes: { status: 'not_yet', bodyHtml: null },
  },
  {
    slug: '2026-08',
    title: 'August fixture',
    date: '2026-08-12',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    agenda: { status: 'posted', bodyHtml: '<p>Fixture agenda</p>' },
    minutes: { status: 'posted', bodyHtml: '<p>Fixture minutes</p>' },
  },
], new Date(2026, 8, 27, 12, 0, 0));
const meetings = FIXTURE;

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

const asOf = new Date(2026, 8, 27, 12, 0, 0);
const sep = meetings.find((meeting) => meeting.slug === '2026-09');
const aug = meetings.find((meeting) => meeting.slug === '2026-08');
if (sep.status !== 'completed') fail('September fixture must be completed');
if (!hasFullBody(sep.agenda)) fail('Posted fixture agenda must count as a full body');
if (hasFullBody(sep.minutes)) fail('not_yet fixture minutes must not count as a full body');
if (!hasFullBody(aug.minutes)) fail('Posted fixture minutes must count as a full body');
const listed = publicMeeting(sep, asOf);
if (listed.agenda?.bodyHtml || listed.minutes?.bodyHtml) {
  fail('Public catalog must omit agenda and minutes HTML');
}
const full = memberMeeting(sep, asOf);
if (!full.agenda.bodyHtml.includes('Fixture agenda')) fail('Member payload keeps the agenda body');
if (full.minutes.bodyHtml) fail('Empty minutes stay empty on the member payload');
if (meetingsWithAgenda(meetings).length !== 2) fail('Both fixture agendas are listed');
if (meetingsWithMinutes(meetings).length !== 1) fail('Only the posted fixture minutes are listed');

if (isoDate(secondWednesday(2026, 9)) !== '2026-09-09') fail('Sep 2026 second Wednesday is the 9th');
if (isoDate(secondWednesday(2026, 10)) !== '2026-10-14') fail('Oct 2026 second Wednesday is the 14th');
const standing = nextStandingBoardDates(2, new Date(2026, 8, 3), meetings);
if (standing[0]?.date !== '2026-09-09' || standing[0]?.slug !== '2026-09') {
  fail('Next standing date from Sep 3 2026 should be the seeded Sep 9 meeting');
}
if (standing[1]?.date !== '2026-10-14' || standing[1]?.slug) {
  fail('Second standing date is Oct 14 2026 with no empty Oct stub');
}
const standingAfter = nextStandingBoardDates(2, asOf, meetings);
if (standingAfter.some((row) => row.date === '2026-09-09')) {
  fail('Schedule on 2026-09-27 must not list September 9 as upcoming');
}
if (standingAfter[0]?.date !== '2026-10-14') {
  fail('Next standing date on 2026-09-27 is October 14, 2026');
}
if (recordsEmptyCopy(meetingsWithMinutes(meetings)) !== null) {
  fail('Empty-state copy must not appear when minutes exist');
}
if (recordsEmptyCopy([]) !== 'No approved minutes yet.') {
  fail('Empty minutes list uses the real empty state');
}
if (agendaListTitle(sep) !== 'September 9, 2026 Board Meeting') {
  fail('Agenda list titles must be date + Board Meeting');
}
if (!recordListTitle(aug).includes('Virtual BOD')) {
  fail('Records list titles must use AAPA-style Virtual BOD');
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const seedSrc = readFileSync('api/_lib/boardMeetings.js', 'utf8');
if (/zoom\.us/i.test(seedSrc) || /pwd=/i.test(seedSrc) || /passcode\s*[:=]/i.test(seedSrc) || /meeting[\s-]?id\s*[:=]/i.test(seedSrc)) {
  fail('Do not paste Zoom join URLs, meeting IDs, or passcodes');
}
if (/coming soon/i.test(seedSrc)) fail('Do not leave coming-soon copy for listed months');

const viewSrc = readFileSync('src/pages/BoardMeetingView.jsx', 'utf8');
if (!viewSrc.includes('dangerouslySetInnerHTML')) fail('Meeting view must render seed HTML');
if (!viewSrc.includes('DOMPurify')) fail('Meeting HTML must be sanitized');
if (!viewSrc.includes('/api/board-meetings?slug=')) fail('Meeting view must load the body from the API');

const hubSrc = readFileSync('src/pages/BoardMeetings.jsx', 'utf8');
if (!hubSrc.includes('hasListedDoc')) fail('Hub must list agendas and minutes from the catalog');
if (!hubSrc.includes('/api/board-meetings')) fail('Hub must load meetings from the API');
if (!hubSrc.includes('role="tablist"')) fail('Hub must use the three AAPA-style tabs');
if (!hubSrc.includes('Board Meeting Agendas') || !hubSrc.includes('Board Meeting Records') || !hubSrc.includes('Board Meeting Schedule')) {
  fail('Tab labels must be Board Meeting Agendas / Records / Schedule');
}
if (!hubSrc.includes('nextStandingBoardDates')) fail('Schedule must use the 2nd-Wednesday standing dates, not a full archive table');
if (!hubSrc.includes('Annual Membership Meeting: TBD, Q2 2027')) {
  fail('Schedule must list Annual Membership Meeting as its own TBD Q2 2027 row');
}
if (!hubSrc.includes('every second Wednesday, 8:00 PM ET, virtual')) {
  fail('Schedule must include the standing 2nd-Wednesday row');
}
if (!hubSrc.includes('mailto:')) fail('Schedule intro must mailto info@addictionpas.org');
if (/named roster|all-member blast|join links|executive.session|source of truth|Member area|on file until pasted/i.test(hubSrc)) {
  fail('Hub UI must not render extra policy essays');
}
if (hubSrc.includes('SAMPA Board meeting schedule, newest first')) {
  fail('Do not keep the full-history schedule laundry list');
}
if (/year filter|workingYear filter/i.test(hubSrc)) fail('Do not add a year filter on the hub');
if (/Nothing is posted yet/i.test(hubSrc) || /nothing is posted/i.test(hubSrc)) {
  fail('Records copy must not say nothing is posted');
}
if (!hubSrc.includes('recordsEmptyCopy')) fail('Empty state must go through recordsEmptyCopy');
const rowLine = hubSrc.split('\n').find((line) => line.includes('const rowClass'));
if (!rowLine || /hover:/.test(rowLine)) fail('Non-clickable rows must not use hover affordance');
if ((hubSrc.match(/hover:border-primary\/30/g) || []).length !== 1) {
  fail('Hover affordance belongs on clickable rows only');
}

if (/disclaimer|executive.session|join links|on file until pasted/i.test(viewSrc)) {
  fail('Meeting detail must be title + agenda/minutes body only');
}

const leaders = readFileSync('src/data/leadership.js', 'utf8');
if (!leaders.includes("'Membership co-chair'")) fail('Josh and Clarissa must be Membership co-chairs');
if (!leaders.includes("'Finance co-chair'")) fail('Josh and Jonathan must be Finance co-chairs');
if (leaders.includes("'Membership chair'") || leaders.includes("'Finance chair'")) {
  fail('Membership and Finance must not list a single chair');
}
const schema = readFileSync('supabase/schema.sql', 'utf8');
if (!schema.includes('for select using ( public.is_active_member() )')) {
  fail('Board meetings stay readable by active members');
}
if (!schema.includes('for select using ( public.can_view_board_dashboard() )')) {
  fail('Relay balances stay on the board dashboard gate');
}
if (!schema.includes('for insert with check ( public.is_admin() )')) {
  fail('Writing records stays admin-only');
}
const recordsPage = readFileSync('src/pages/AdminRecords.jsx', 'utf8');
if (!recordsPage.includes('relay_balances') || !recordsPage.includes('board_meetings')) {
  fail('Admin records page must edit both tables');
}

const appSrc = readFileSync('src/App.jsx', 'utf8');
if (!appSrc.includes('path="/editor/records"')) fail('App must declare /editor/records');
if (appSrc.indexOf('path="/editor/records"') > appSrc.indexOf('path="/editor/:id"')) {
  fail('/editor/records must be registered before the post editor');
}
if (!appSrc.includes('path="/board"')) fail('App must declare /board');
if (!appSrc.includes('path="/board/:slug"')) fail('App must declare /board/:slug');
if ((appSrc.match(/deniedCopy="Board meeting agendas and minutes/g) || []).length < 2) {
  fail('Both board routes must use Board-specific RequireActiveMember copy');
}

const guardSrc = readFileSync('src/components/RequireActiveMember.jsx', 'utf8');
if (!guardSrc.includes('canAccessMemberDirectory')) fail('Board reuses RequireActiveMember / is_active_member');
if (!guardSrc.includes('useAuthGate')) fail('Member gate must keep the session-hold redirect behavior');

const navSrc = readFileSync('src/components/Navbar.jsx', 'utf8');
if ((navSrc.match(/to="\/board"/g) || []).length < 2) fail('Navbar needs desktop + mobile Board links');

const dashSrc = readFileSync('src/pages/Dashboard.jsx', 'utf8');
if (!dashSrc.includes('to="/board"')) fail('Dashboard must link Board meetings');

const LEAKS = [
  'SEPTEMBER_2026_AGENDA_HTML',
  ['24', '57', '00'].join(''),
  'relayBalance',
];

function walkSrc(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'seed-private') continue;
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) walkSrc(path, acc);
    else if (/\.(js|jsx|css|html|svg|json)$/.test(name)) acc.push(path);
  }
  return acc;
}

for (const file of [...walkSrc('src'), ...walkSrc('api'), ...walkSrc('supabase'), ...walkSrc('docs'), 'scripts/seed-private-records.mjs']) {
  const text = readFileSync(file, 'utf8');
  for (const phrase of LEAKS) {
    if (text.includes(phrase)) fail(`${file} still contains minutes text: ${phrase}`);
  }
}

console.log('verify-board-meetings: ok');
