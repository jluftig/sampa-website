/**
 * SAMPA Board meeting agendas + minutes — member-area seed.
 *
 * Source: Kala’s Board Meetings Drive (Agenda/2026, Minutes/2026, Minutes/2025).
 * Render HTML from this module (policy-hub pattern). PDFs optional later under
 * `public/files/board/`. Client gate is UX only — do not put confidential
 * drafts in `public/` until there is an authenticated file route.
 *
 * Do not paste Zoom join URLs or passcodes. Location stays “Virtual”.
 * `is_board` stays badge-only; pages are gated on `is_active_member()`.
 */

export const BOARD_HUB = {
  eyebrow: 'Member area',
  title: 'Board meetings',
  workingYear: '2025–2026',
  oneLiner:
    'Board meeting agendas and approved minutes — a benefit of active SAMPA membership.',
  cadence:
    'The Board meets monthly, virtually. Agendas and approved minutes are posted here for members. Join links stay on the calendar invite, not on this page.',
  disclaimer:
    'These pages are for active SAMPA members. Executive-session material is not published. Virtual meetings: see your calendar invite for the join link. Full text for on-file months will be pasted from the Board Meetings Drive.',
};

export const MEETING_KINDS = {
  regular: { key: 'regular', label: 'Monthly meeting' },
  annual: { key: 'annual', label: 'Annual meeting' },
  special: { key: 'special', label: 'Special meeting' },
  virtual: { key: 'virtual', label: 'Virtual meeting' },
};

export const MEETING_STATUSES = {
  upcoming: { key: 'upcoming', label: 'Upcoming' },
  scheduled: { key: 'scheduled', label: 'Scheduled' },
  completed: { key: 'completed', label: 'Held' },
  cancelled: { key: 'cancelled', label: 'Cancelled' },
};

export const DOC_STATUSES = {
  posted: { key: 'posted', label: 'Posted' },
  on_file: { key: 'on_file', label: 'On file' },
  pending: { key: 'pending', label: 'Pending' },
  not_yet: { key: 'not_yet', label: 'Not yet posted' },
};

const ON_FILE_AGENDA =
  '<p>Agenda on file in the Board Meetings Drive (Kala Agenda/2026). Full text will be added here when it is pasted.</p>';
const ON_FILE_MINUTES =
  '<p>Minutes on file in the Board Meetings Drive. Full text will be added here when it is pasted.</p>';
const ON_FILE_MINUTES_2025 =
  '<p>Minutes on file in Minutes/2025. Full text will be added here when it is pasted.</p>';
const ON_FILE_ANNUAL =
  '<p>Annual Board meeting materials on file (<em>SAMPA Annual BOD Meeting.pdf</em>). Full text will be added here when it is pasted.</p>';

const JULY_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>July 8, 2026 · 8 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>June 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws and Policies; Certification; Education; Finance; Membership</li>
<li>Business Items — Election Updates (Deanna); Website Updates (Josh)</li>
<li>Open Forum</li>
<li>Next Meeting — August 12, 2026, 8 PM ET, Virtual</li>
<li>Adjournment</li>
</ol>
`.trim();

const JULY_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>July 2026 · Virtual · Chair: Shani Wilson, President</p>
<p><strong>Present:</strong> Shani Wilson, Arianna Campbell, Kala Klug, Deanna Najera, Kerith Hartmann, Josh Luftig, Clarissa Peterson, Jonathan Cohen, Tasha Selinski, Harrison Keyes, Cheryl Vanderford, Olivia Sawh</p>
<p><strong>Absent:</strong> Jordan Vold, Megan Zawacki, Debra Newman, Kelsy Ruggiero, Edward Traverso, Eric Bergersen, Lamont Scott, Danielle Schmeling</p>
<h3>Call to Order</h3>
<p>President Shani Wilson called the meeting to order and welcomed returning and newly appointed Board members. Members introduced themselves and provided professional backgrounds.</p>
<h3>Approval of June 2026 Minutes</h3>
<p>The June 2026 minutes were reviewed. Motion and second; unanimously approved.</p>
<h3>Bylaws</h3>
<p>Progress on conflict of interest, elections, vacancies, and governance. The Board discussed Directors-at-Large versus ASIO.</p>
<p><strong>Motion approved:</strong> Beginning with the July 2027 leadership cycle, ASIO remains elected; Directors-at-Large become appointed, non-voting; bylaws amended accordingly. Conflict of interest and Elections/Vacancies policies were tabled.</p>
<h3>Certification</h3>
<p>NCCPA advisory continues; no major updates.</p>
<h3>Education</h3>
<p>Meeting rescheduled; no formal report.</p>
<h3>Finance</h3>
<p>Stripe, online memberships, recurring dues, donations, and the integrated membership database are live.</p>
<h3>Membership</h3>
<p>New members, recruitment, newsletter, benefits, social, and a member survey.</p>
<h3>Business</h3>
<p>Josh demonstrated website enhancements (news, resources, member portal, membership management, donations, communications).</p>
<h3>Open Forum</h3>
<p>Onboarding, committee assignments, governance documents, budget policies, advocacy, AAPA HOD, research collaboration, website content, and education programming.</p>
<h3>Action Items</h3>
<ul>
<li>Update bylaws</li>
<li>Continue governance policies</li>
<li>Finalize conflict of interest and Elections/Vacancies policies</li>
<li>Continue website work</li>
<li>Expand membership and newsletter</li>
<li>Finalize onboarding materials</li>
</ul>
<h3>Adjournment</h3>
<p>Motion, second, and unanimous adjournment.</p>
<p>Respectfully submitted: Shani Wilson, PA-C, President; Kala Klug, Secretary</p>
`.trim();

function agendaDoc({ status, bodyHtml, label = 'Meeting agenda' }) {
  return { status, label, bodyHtml: bodyHtml || null, pdfUrl: null };
}

function minutesDoc({ status, bodyHtml, label = 'Approved minutes', approvedAt = null }) {
  return { status, label, bodyHtml: bodyHtml || null, pdfUrl: null, approvedAt };
}

/**
 * @typedef {object} BoardDoc
 * @property {'posted'|'on_file'|'pending'|'not_yet'} status
 * @property {string|null} [bodyHtml]
 * @property {string|null} [pdfUrl]
 * @property {string|null} [label]
 * @property {string|null} [approvedAt]
 */

/**
 * @typedef {object} BoardMeeting
 * @property {string} slug
 * @property {string} title
 * @property {string|null} date
 * @property {string} [dateLabel]
 * @property {string|null} [time]
 * @property {'regular'|'annual'|'special'|'virtual'} kind
 * @property {'virtual'|'in-person'|'hybrid'} format
 * @property {string|null} [location]
 * @property {'upcoming'|'scheduled'|'completed'|'cancelled'} status
 * @property {string} [summary]
 * @property {BoardDoc} agenda
 * @property {BoardDoc} minutes
 */

/** Newest first. */
const BOARD_MEETINGS = [
  {
    slug: '2026-09',
    title: 'September 2026 Board meeting',
    date: '2026-09-09',
    time: '8 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'upcoming',
    summary: 'Monthly virtual meeting. Agenda on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'not_yet' }),
  },
  {
    slug: '2026-08',
    title: 'August 2026 Board meeting',
    date: '2026-08-12',
    time: '8 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda on file (August.docx). Minutes not posted yet.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'not_yet' }),
  },
  {
    slug: '2026-07',
    title: 'July 2026 Board meeting',
    date: '2026-07-08',
    time: '8 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Chair: Shani Wilson, President.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: JULY_2026_AGENDA_HTML }),
    minutes: minutesDoc({
      status: 'posted',
      bodyHtml: JULY_2026_MINUTES_HTML,
      approvedAt: '2026-08-12',
    }),
  },
  {
    slug: '2026-06',
    title: 'June 2026 Board meeting',
    date: null,
    dateLabel: 'June 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-05',
    title: 'May 2026 Board meeting',
    date: null,
    dateLabel: 'May 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-04',
    title: 'April 2026 Board meeting',
    date: null,
    dateLabel: 'April 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-03',
    title: 'March 2026 Board meeting',
    date: null,
    dateLabel: 'March 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-02',
    title: 'February 2026 Board meeting',
    date: null,
    dateLabel: 'February 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-01',
    title: 'January 2026 Board meeting',
    date: null,
    dateLabel: 'January 2026',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES }),
  },
  {
    slug: '2026-annual',
    title: '2026 Annual Board meeting',
    date: null,
    dateLabel: '2026',
    kind: 'annual',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Annual Board meeting materials on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_ANNUAL, label: 'Annual materials' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_ANNUAL, label: 'Annual record' }),
  },
  {
    slug: '2025-09',
    title: 'September 2025 Board meeting',
    date: null,
    dateLabel: 'September 2025',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Minutes on file (Minutes/2025).',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES_2025 }),
  },
  {
    slug: '2025-08',
    title: 'August 2025 Board meeting',
    date: null,
    dateLabel: 'August 2025',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Minutes on file (Minutes/2025).',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES_2025 }),
  },
  {
    slug: '2025-07',
    title: 'July 2025 Board meeting',
    date: null,
    dateLabel: 'July 2025',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Minutes on file (Minutes/2025).',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES_2025 }),
  },
  {
    slug: '2025-06',
    title: 'June 2025 Board meeting',
    date: null,
    dateLabel: 'June 2025',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Minutes on file (Minutes/2025).',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES_2025 }),
  },
  {
    slug: '2025-02',
    title: 'February 2025 Board meeting',
    date: null,
    dateLabel: 'February 2025',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Minutes on file (Minutes/2025).',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'on_file', bodyHtml: ON_FILE_MINUTES_2025 }),
  },
];

export function listBoardMeetings() {
  return BOARD_MEETINGS.slice();
}

export function getBoardMeeting(slug) {
  if (!slug) return null;
  return BOARD_MEETINGS.find((m) => m.slug === slug) || null;
}

export function kindLabel(kind) {
  return MEETING_KINDS[kind]?.label || 'Meeting';
}

export function meetingStatusLabel(status) {
  return MEETING_STATUSES[status]?.label || status;
}

export function docStatusLabel(status) {
  return DOC_STATUSES[status]?.label || status;
}

export function upcomingMeetings(meetings = BOARD_MEETINGS) {
  return meetings.filter((m) => m.status === 'upcoming' || m.status === 'scheduled');
}

export function completedMeetings(meetings = BOARD_MEETINGS) {
  return meetings.filter((m) => m.status === 'completed');
}

export function meetingsWithAgenda(meetings = BOARD_MEETINGS) {
  return meetings.filter((m) => hasListedDoc(m.agenda));
}

export function meetingsWithMinutes(meetings = BOARD_MEETINGS) {
  return meetings.filter((m) => hasListedDoc(m.minutes));
}

export function hasPostedDoc(doc) {
  return Boolean(doc && (doc.bodyHtml || doc.pdfUrl) && (doc.status === 'posted' || doc.status === 'on_file'));
}

export function hasListedDoc(doc) {
  return Boolean(doc && (doc.status === 'posted' || doc.status === 'on_file'));
}

export function hasFullBody(doc) {
  return Boolean(doc?.status === 'posted' && doc.bodyHtml);
}
