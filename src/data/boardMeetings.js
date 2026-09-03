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
  agendasIntro:
    'Date and meeting type. Posted agendas are on the meeting page. On-file months are in the Board Meetings Drive until the full text is pasted here.',
  recordsIntro:
    'Minutes and action summaries are posted after the Board approves them. Posted months have full text on the meeting page. On-file months stay listed until the body is pasted from the Board Meetings Drive.',
  scheduleIntro:
    'Date, time, and location. Virtual meetings: the join link stays on the calendar invite, not on this page.',
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

const SEPTEMBER_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>September 9, 2026 · 8 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>Motion to Approve ASIO</li>
<li>August 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws and Policies; Certification; Education; Finance; Membership (incl. Newsletter Sub Committee)</li>
<li>Business Items — Change in monthly meeting time (Kerith); Meeting invites for SAMPA general member (Shani/Josh/Kala); Zoom recording, transcript, AI notes, and recap (Shani/Josh/Kala)</li>
<li>Open Forum</li>
<li>Next Meeting — October 14, 2026, 8 PM ET, Virtual</li>
<li>Adjournment</li>
</ol>
`.trim();

const AUGUST_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>August 2026 · 7:00–8:00 PM CST · Virtual · Presiding: Shani Wilson, PA-C, President</p>
<p><strong>Present:</strong> Shani Wilson, Kala Klug, Josh Luftig, Tasha Seliski, Clarissa Peterson, Deanna Najera, Arianna Campbell, Eric Bergersen, Edward Traverso, Harrison Keyes, Jonathan Cohen, Kerith Hartmann</p>
<p><strong>Absent:</strong> No board members were absent.</p>
<h3>Call to Order</h3>
<p>President Shani Wilson called the meeting to order at 7:07 PM CST after confirming quorum. She welcomed Board members and acknowledged committee progress over the previous two months.</p>
<h3>Approval of July 2026 Minutes</h3>
<p>Corrections to the roll call were incorporated. Motion to approve the July 2026 minutes with the submitted corrections. Approved; no nays or abstentions.</p>
<h3>Bylaws — Organizational structure</h3>
<p>SAMPA currently has four standing committees. Temporary ad hoc committees and work groups do not need to be formally incorporated into the organizational structure unless they become permanent standing committees.</p>
<p><strong>Motion:</strong> Approve the current organizational structure as presented. Second: Kala Klug. Approved; no nays or abstentions.</p>
<h3>Elections and Vacancies / ASIO vacancy</h3>
<p>ASIO is an elected, voting position and is needed for AAPA constituent-organization diversity representation. The Board discussed a special election and a process if a special election does not produce a candidate.</p>
<p>The Elections and Vacancies Policy was amended: if, after a second election, the position remains vacant, the Board shall appoint an appropriate individual to fulfill the duties of the vacant position for the remainder of the term by majority vote. The amendment was approved, with the President abstaining. The Board then adopted the Elections and Vacancies Policy as amended.</p>
<h3>Conflict of Interest Policy</h3>
<p>Discussion covered financial disclosures, paid speaking engagements, honoraria, ownership interests, relationships with ineligible companies (ACCME), and outside leadership roles with decision-making authority, governance oversight, fiduciary responsibility, or substantial organizational influence. Routine professional honoraria should be distinguished from financial relationships that could create a conflict.</p>
<p>The policy was amended to include disclosure of relationships with ineligible companies as defined by ACCME standards, and to clarify outside organizational responsibilities. Motion to adopt as amended. Approved; no nays or abstentions. Other policies were deferred.</p>
<h3>Certification</h3>
<p>Arianna Sampson Campbell reported that the first NCCPA Specialty Advisory Group meeting is expected in September. SAMPA continues to coordinate timelines and documentation. A list of interested PAs is maintained for possible blueprint development and examination writing. Phases: Specialty Advisory Group → blueprint → exam writing. The advisory group is expected to be primarily virtual; later phases may be in person. Advocacy remains focused on a CAQ pathway without unnecessary barriers to practice. No Board action.</p>
<h3>Education</h3>
<p>President Wilson reported work on a SAMPA Speakers Bureau and an eligibility rubric. Topics in development include foundational addiction medicine, medications for substance use disorders, pharmacology and substance effects, family dynamics, social justice, and introductory education for students and PAs newer to addiction medicine. Partnerships with AAPA constituent and specialty organizations are planned. A possible AAPA/ASAM collaborative grant for speaker honoraria will be explored. The committee voted not to meet in December 2026. The President intends to identify a co-chair or successor.</p>
<h3>Finance</h3>
<p>SAMPA has accumulated more than $1,000, primarily through memberships and donations. Additional revenue is expected from a membership email campaign. A reimbursement-policy draft will go to Bylaws and Policies (recordkeeping, protection of sensitive information, multiple reimbursement methods, dual review). 501(c)(3) status has been approved. Nonprofit pricing through TechSoup and other vendors (including meeting software and Google Workspace) is underway. The Board discussed store proceeds due to SAMPA.</p>
<h3>Membership</h3>
<p>Josh Luftig has joined as co-chair. Public email is triaged. Automated welcome, renewal, and donation emails are live. A weekly newsletter via Brevo will include SAMPA news, website updates, education, PA and addiction-medicine news, recruitment, and announcements. The Board asked that the store link appear in future newsletters.</p>
<h3>Website and technology</h3>
<p>New functions include member profiles, directory, search, news and policy, discussion, automated communications, membership management, and donations. SAMPA is migrating to addictionpas.org email and SAMPA-controlled Google Workspace so organizational documents are not held under personal accounts.</p>
<h3>AAPA conference</h3>
<p>The Board discussed securing an exhibit booth, costs, and a possible conference work group for logistics, member engagement, materials, staffing, and programming.</p>
<h3>Action Items</h3>
<ul>
<li>Implement the approved Elections and Vacancies Policy</li>
<li>Begin the process to fill the vacant ASIO position</li>
<li>Incorporate approved amendments into the Conflict of Interest Policy</li>
<li>Continue tracking bylaw inconsistencies</li>
<li>Continue the Speakers Bureau; solicit educational topics and speakers</li>
<li>Identify an Education Committee co-chair or successor</li>
<li>Investigate the possible AAPA/ASAM grant</li>
<li>Forward the reimbursement-policy draft to Bylaws and Policies</li>
<li>Continue nonprofit pricing and technology infrastructure</li>
<li>Follow up on store proceeds</li>
<li>Board members to submit or update bios and headshots</li>
<li>Continue Drive migration and organizational email addresses</li>
<li>Begin AAPA conference planning</li>
</ul>
<h3>Adjournment</h3>
<p>The scheduled meeting period ended at 8:00 PM CST.</p>
<p>Respectfully submitted: Shani Wilson, PA-C, President; Kala Klug, Secretary</p>
`.trim();

const APRIL_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>April 8, 2026 · 7:09–8:12 PM CT · Virtual</p>
<p><strong>Present:</strong> Shani Wilson, Jordan Void (Vold), Kala Klug, Josh Luftig, Tasha Selinski, Clarissa Peterson, Deanna Najera, Arianna Campbell, Kerith Hartmann</p>
<p><strong>Absent:</strong> Cheryl Vanderford, Kelsy Ruggiero, Megan Zawacki, Debra Newman. Quorum met.</p>
<h3>Call to Order</h3>
<p>The meeting was called to order at 7:09 PM CT. February 2026 minutes were approved.</p>
<h3>Treasurer</h3>
<p>Extensive discussion of 501(c)(3) versus 501(c)(6).</p>
<p><strong>Motion:</strong> Incorporate as a 501(c)(3) in Wyoming. Seconded. Carried unanimously.</p>
<h3>Bylaws and policy</h3>
<p>Bylaws are under revision for 501(c)(3) status. Policy development is ongoing. Fundraising logistics before determination, and an expense-reimbursement process, are action items.</p>
<h3>Certification</h3>
<p>NCCPA CAQ / Specialty Advisory Group / blueprint work continues.</p>
<h3>Education</h3>
<p>LGBTQ Caucus session; future methadone and long-acting injectable panels.</p>
<h3>Membership and outreach</h3>
<p>Pins and stickers; social media.</p>
<h3>Events</h3>
<p>AAPA Conference; sober-event co-host.</p>
<h3>Leadership</h3>
<p>President-Elect is not transitioning to President; a future election for President-Elect.</p>
<h3>Open discussion</h3>
<p>Track accomplishments; external collaboration.</p>
<h3>Adjournment</h3>
<p>Adjourned about 8:12 PM CT.</p>
`.trim();

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
    summary: 'Monthly virtual meeting. Agenda posted. Minutes not yet.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: SEPTEMBER_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'not_yet' }),
  },
  {
    slug: '2026-08',
    title: 'August 2026 Board meeting',
    date: '2026-08-12',
    time: '7:00–8:00 PM CST',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Minutes posted (August.docx was filed under Agenda/2026). Agenda text not yet pasted.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({
      status: 'posted',
      bodyHtml: AUGUST_2026_MINUTES_HTML,
    }),
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
    date: '2026-04-08',
    time: '7:09–8:12 PM CT',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Minutes posted. Agenda on file.',
    agenda: agendaDoc({ status: 'on_file', bodyHtml: ON_FILE_AGENDA }),
    minutes: minutesDoc({
      status: 'posted',
      bodyHtml: APRIL_2026_MINUTES_HTML,
    }),
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

/** Record-list type, AAPA-style (Virtual BOD / In Person / Special / Annual). */
export function recordTypeLabel(meeting) {
  if (meeting?.kind === 'annual') return 'Annual record';
  if (meeting?.kind === 'special') return 'Special meeting record';
  if (meeting?.format === 'in-person') return 'In-person minutes';
  if (meeting?.format === 'hybrid') return 'Hybrid meeting minutes';
  return 'Virtual monthly minutes';
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
