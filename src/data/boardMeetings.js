/**
 * SAMPA Board meeting agendas + minutes — member-area seed.
 *
 * AAPA pattern: this year’s schedule, agendas, and meeting records live in
 * the member-only area (not a public archive). SAMPA mirrors that on
 * `/board` + `/board/:slug`, gated like the directory (`is_active_member()`).
 *
 * MVP: curated module (same idea as `policyDocuments.js`). Add a real PDF
 * under `public/files/board/` and set `agenda.pdfUrl` / `minutes.pdfUrl`.
 * Client gate is UX only — do not put confidential drafts in `public/`
 * until there is an authenticated file route. `is_board` stays badge-only.
 */

export const BOARD_HUB = {
  eyebrow: 'Member area',
  title: 'Board meetings',
  workingYear: '2026–2027',
  oneLiner:
    'This year’s Board meeting schedule, agendas, and approved minutes — a benefit of active SAMPA membership.',
  cadence:
    'The Board meets at least quarterly, with virtual meetings as needed. Agendas are posted when they are ready. Minutes are posted after the Board approves them.',
  disclaimer:
    'These pages are for active SAMPA members. Executive-session material is not published. Dates and documents will be filled in as the Board confirms them.',
};

/** Regular quarterly cadence for the working year. Special/virtual rows can be appended. */
export const MEETING_KINDS = {
  regular: { key: 'regular', label: 'Quarterly meeting' },
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
  pending: { key: 'pending', label: 'Pending' },
  not_yet: { key: 'not_yet', label: 'Not yet posted' },
};

/**
 * Standing outline shown when a meeting has no agenda PDF yet.
 * Generic governance headings only — not a claim that any item is on a real agenda.
 */
export const STANDING_AGENDA_ITEMS = [
  'Call to order and conflict-of-interest reminder',
  'Approval of previous meeting records',
  'Consent agenda',
  'President and officer reports',
  'Committee reports',
  'Unfinished and new business',
  'Adjournment',
];

/**
 * @typedef {object} BoardDoc
 * @property {'posted'|'pending'|'not_yet'} status
 * @property {string|null} [pdfUrl]   Site-relative path under /files/board/
 * @property {string|null} [label]
 * @property {string|null} [approvedAt] ISO date (minutes only)
 */

/**
 * @typedef {object} BoardMeeting
 * @property {string} slug
 * @property {string} title
 * @property {string|null} date          ISO date-only when confirmed
 * @property {string|null} [endDate]
 * @property {string} [dateLabel]        Used when `date` is null
 * @property {'regular'|'special'|'virtual'} kind
 * @property {'virtual'|'in-person'|'hybrid'} format
 * @property {string|null} [location]
 * @property {'upcoming'|'scheduled'|'completed'|'cancelled'} status
 * @property {string} [summary]
 * @property {BoardDoc} agenda
 * @property {BoardDoc} minutes
 * @property {{ label: string, pdfUrl: string }[]} [records]
 */

/** @type {BoardMeeting[]} */
const BOARD_MEETINGS = [
  {
    slug: '2026-fall',
    title: 'Fall 2026 Board meeting',
    date: null,
    dateLabel: 'Date to be announced',
    kind: 'regular',
    format: 'virtual',
    location: null,
    status: 'upcoming',
    summary:
      'First quarterly meeting of the 2026–2027 working year. Agenda will be posted here when it is ready.',
    agenda: { status: 'pending', pdfUrl: null, label: 'Meeting agenda' },
    minutes: { status: 'not_yet', pdfUrl: null, label: 'Approved minutes' },
    records: [],
  },
  {
    slug: '2027-winter',
    title: 'Winter 2027 Board meeting',
    date: null,
    dateLabel: 'Date to be announced',
    kind: 'regular',
    format: 'virtual',
    location: null,
    status: 'scheduled',
    summary: 'Second quarterly meeting. Virtual, with a special meeting added if needed.',
    agenda: { status: 'not_yet', pdfUrl: null, label: 'Meeting agenda' },
    minutes: { status: 'not_yet', pdfUrl: null, label: 'Approved minutes' },
    records: [],
  },
  {
    slug: '2027-spring',
    title: 'Spring 2027 Board meeting',
    date: null,
    dateLabel: 'Date to be announced',
    kind: 'regular',
    format: 'virtual',
    location: null,
    status: 'scheduled',
    summary: 'Third quarterly meeting of the working year.',
    agenda: { status: 'not_yet', pdfUrl: null, label: 'Meeting agenda' },
    minutes: { status: 'not_yet', pdfUrl: null, label: 'Approved minutes' },
    records: [],
  },
  {
    slug: '2027-summer',
    title: 'Summer 2027 Board meeting',
    date: null,
    dateLabel: 'Date to be announced',
    kind: 'regular',
    format: 'hybrid',
    location: null,
    status: 'scheduled',
    summary:
      'Fourth quarterly meeting. Format (in-person, virtual, or hybrid) will be confirmed with the agenda.',
    agenda: { status: 'not_yet', pdfUrl: null, label: 'Meeting agenda' },
    minutes: { status: 'not_yet', pdfUrl: null, label: 'Approved minutes' },
    records: [],
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

export function hasPostedDoc(doc) {
  return Boolean(doc?.status === 'posted' && doc.pdfUrl);
}
