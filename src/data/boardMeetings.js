/**
 * SAMPA Board meeting agendas + minutes — member-area seed.
 *
 * Source: Kala’s Board Meetings Drive (Agenda/2026, Minutes/2026, Minutes/2025).
 * Render HTML from this module (policy-hub pattern). PDFs optional later under
 * `public/files/board/`. Client gate is UX only — do not put confidential
 * drafts in `public/` until there is an authenticated file route.
 *
 * Do not paste Zoom join URLs, meeting IDs, or passcodes.
 * Location is Virtual unless a meeting is hybrid (May 2026 AAPA).
 * `is_board` stays badge-only; pages are gated on `is_active_member()`.
 */

export const BOARD_HUB = {
  eyebrow: 'Member area',
  title: 'Board meetings',
  workingYear: '2025–2026',
  oneLiner:
    'Board meeting agendas and approved minutes — a benefit of active SAMPA membership.',
  cadence:
    'The Board meets every second Wednesday at 8:00 PM ET, virtually. Join links are sent only to the named invite list for that meeting and are not posted here.',
  agendasIntro:
    'Date and meeting type. Open a meeting for the posted agenda.',
  recordsIntro:
    'Minutes and action summaries are posted after the Board approves them. 2025 records are labeled SPAAM / early SAMPA.',
  scheduleStanding:
    'Standing Board meetings are every second Wednesday at 8:00 PM ET, virtually. The cadence is the source of truth — dates below are the next one or two second Wednesdays for orientation.',
  scheduleAnnual:
    'The Annual Membership Meeting is listed separately. It is the standing invitation for all members (not every monthly Board meeting). Date: TBD, Q2 2027.',
  scheduleObserver:
    'The SAMPA Board of Directors meets monthly, virtually. Monthly Board Zoom is a named roster (voting Board and chairs), not an all-member blast. Active members interested in attending as a member observer can email info@addictionpas.org to request to be added for a specific meeting. Join links are sent only to the named invite list for that meeting and are not posted here. Executive-session and other closed portions are not open to observers. The Annual Membership Meeting remains the standing invitation for all members.',
  observerEmail: 'info@addictionpas.org',
  hubObserverNote:
    'Active members may request to observe a monthly Board meeting. Email info@addictionpas.org — details on the Schedule tab.',
  disclaimer:
    'These pages are for active SAMPA members. Executive-session material is not published. Join links are not posted on this page.',
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

const ON_FILE_ANNUAL =
  '<p>Annual Board meeting materials on file (<em>SAMPA Annual BOD Meeting.pdf</em>).</p>';

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

const AUGUST_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>August 12, 2026 · 8 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>July 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws and Policies; Certification; Education; Finance; Membership (incl. Newsletter Sub Committee)</li>
<li>Business Items — AAPA HOD Events (Shani); Extended Leave Coverage (Kala/Shani); website, news, Brevo, organizational email, Workspace, and job board (Josh); COI Disclaimer (Deanna)</li>
<li>Open Forum</li>
<li>Next Meeting — September 9, 2026</li>
<li>Adjournment</li>
</ol>
`.trim();

const JUNE_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>June 10, 2026 · 8 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>May 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws and Policy; Certification; Education; Financial; Membership</li>
<li>Business Items — AAPA Recap (Shani); Future Communication (Clarissa/Kala); ASAM/ACMT Drug Testing statement (Tasha/Cheryl); PCSS-MAUD collaboration (Deanna); AMERSA PA SIG (Tasha)</li>
<li>Elections</li>
<li>Open Forum</li>
<li>Next Meeting — July 8, 2026</li>
<li>Adjournment</li>
</ol>
`.trim();

const JUNE_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>June 10, 2026 · 8:00–9:22 PM ET · Virtual</p>
<p><strong>Present:</strong> Shani Wilson, Jordan Vold, Kala Klug, Josh Luftig, Tasha Seliski, Clarissa Peterson, Deanna Najera, Arianna Campbell, Kerith Hartmann, Megan Zawacki. General: Aliya Pasik.</p>
<p><strong>Absent:</strong> Cheryl Vanderford, Debra Newman, Kelsy Ruggiero.</p>
<h3>Call to Order</h3>
<p>The meeting ran 8:00–9:22 PM ET.</p>
<h3>Approval of May 2026 Minutes</h3>
<p>May 2026 minutes were approved.</p>
<h3>Certification</h3>
<p>Specialty Advisory Group expected late summer or fall. Blueprint work expected early 2027.</p>
<h3>Education</h3>
<p>Long-acting injectable sessions; Speakers Bureau; the committee is seeking a co-chair.</p>
<h3>Finance</h3>
<p>About 15 members. About $1,000 in dues and about $400 in donations. Bank account in place. Stripe work in progress. Merchandise about $70.</p>
<h3>Policy and bylaws</h3>
<p>Bylaws as written 6/10/2026, Wyoming, were approved. Organizational structure and Conflict of Interest remain under review before approval.</p>
<h3>Elections</h3>
<p>Email ballot for President-Elect, Treasurer, Secretary, Directors-at-Large, and Chief Delegate.</p>
<h3>Adjournment</h3>
<p>Adjourned 9:22 PM ET.</p>
`.trim();

const MAY_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>May 17, 2026 · 6–7 PM CT · Hybrid — AAPA New Orleans, Level 2, Room 278 + Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>April 2026 Meeting Minutes</li>
<li>Committee Highlights — Certification; Education; Financial; Membership; Policy</li>
<li>Open Board Positions</li>
<li>Discussion</li>
<li>Next Meeting — June 10, 2026, Virtual</li>
<li>Adjournment</li>
</ol>
`.trim();

const MAY_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>May 17, 2026 · 6:28–7:04 PM CT · Hybrid — AAPA New Orleans, Level 2, Room 278 + Virtual</p>
<p><strong>Board present:</strong> Shani Wilson, Kala Klug, Josh Luftig, Tasha Selinski, Deanna Najera, Megan Zawacki, Arianna Campbell, Cheryl Vanderford.</p>
<p><strong>General members present:</strong> Olivia Sawh, Ruth McDowell, Jennifer Clemente-Metz, Kari Hoover, Bernard Stuetz, Edward Traverso, Mercedes Dodge.</p>
<p><strong>Board absent:</strong> Jordan Vold, Clarissa Peterson, Kerith Hartmann, Debra Newman, Kelsy Ruggiero. Quorum met.</p>
<h3>Call to Order</h3>
<p>The meeting was called to order at 6:28 PM CT.</p>
<h3>Approval of April 2026 Minutes</h3>
<p>April 2026 minutes were approved.</p>
<h3>Discussion</h3>
<p>Teach addiction medicine to PAs who are not addiction specialists. Perioperative MOUD and pain; possible letter to a surgery organization. Inpatient consult and outpatient clinic models. Outreach to specialty organizations on substance use disorder.</p>
<h3>Adjournment</h3>
<p>Adjourned 7:04 PM CT.</p>
`.trim();

const APRIL_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>April 8, 2026 · 8–9 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>March 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaw and Policy; Certification; Education; Financial (update); Membership</li>
<li>Business Items — Approval of Board Members (Shani); Dues (Josh); Gifts (Josh); AAPA 2026 (Kala); Awards (Shani)</li>
<li>Open Forum</li>
<li>Next Meeting — May 17, 2026, hybrid, AAPA New Orleans Room 278 + Virtual</li>
<li>Adjournment</li>
</ol>
`.trim();

const MARCH_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>March 11, 2026 · 8–9 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>February 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws (update); Certification; Education; Financial; Membership</li>
<li>Business Items — AAPA Conference room / AA (Shani); ASAM Associate Member Community (Kala)</li>
<li>Open Forum</li>
<li>Next Meeting — April 8, 2026</li>
<li>Adjournment</li>
</ol>
`.trim();

const MARCH_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>March 11, 2026 · Virtual</p>
<p><strong>Present:</strong> Shani Wilson, Jordan Vold, Kala Klug, Josh Luftig, Cheryl Vanderford, Tasha Selinski, Clarissa Peterson, Deanna Najera, Arianna Campbell, Kerith Hartmann, Debra Newman.</p>
<p><strong>Absent:</strong> Kelsy Ruggiero, Megan Zawacki.</p>
<h3>Approval of February 2026 Minutes</h3>
<p>February minutes were approved with edits: do not include a transcript link; remove vacation and Steelers notes; add roll call.</p>
<h3>Bylaws</h3>
<p>Listserv survey by the end of March.</p>
<h3>Certification</h3>
<p>CAQ announced. A 10–12 PA subcommittee is forming.</p>
<h3>Education</h3>
<p>Shani to speak for the LGBT PA Caucus.</p>
<h3>Finance — motions approved</h3>
<ol>
<li>Incorporate as a 501(c)(3), not a 501(c)(6).</li>
<li>Incorporate in Wisconsin or Delaware as SAMPA Inc.</li>
<li>Josh to file Articles, obtain an EIN, and open a Relay checking account with two signatories; reimbursements at or under $500.</li>
</ol>
<h3>Annual meeting</h3>
<p>Annual Board meeting at AAPA, Sunday May 17, 6–7 PM.</p>
<h3>Liaisons</h3>
<p>Arianna Campbell approved as ASAM Liaison. Tasha Selinski approved as AMERSA Liaison.</p>
`.trim();

const FEBRUARY_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>February 11, 2026 · 8–9 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>January 2026 Meeting Minutes</li>
<li>Committee Reports — Bylaws; Certification (update); Education; Financial; Membership</li>
<li>Business Items — Approve Mission (Clarissa); Recruitment Flyer (Clarissa); Bylaws (Jordan); ATF Policy (Shani); Board Work Deadlines (Shani)</li>
<li>Open Forum</li>
<li>Next Meeting — March 11, 2026</li>
<li>Adjournment</li>
</ol>
`.trim();

const FEBRUARY_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>February 11, 2026 · about 7:07 PM Central · Virtual</p>
<p><strong>Present:</strong> Shani Wilson, Jordan Vold, Kala Klug, Josh Luftig, Cheryl Vanderford, Tasha Seliski, Clarissa Peterson, Deanna Najera, Arianna Campbell, Kerith Hartmann, Kelsy Ruggiero, Olivia Sawh.</p>
<p><strong>Absent:</strong> Megan Zawacki, Debra Newman.</p>
<h3>Approval of January 2026 Minutes</h3>
<p>January minutes were approved.</p>
<h3>Bylaws</h3>
<p>Draft Board-approved, pending attorney review within 12 months if funds allow. Send to the membership for ratification. Ten percent membership vote threshold.</p>
<h3>Certification</h3>
<p>NCCPA approved an Addiction Medicine CAQ.</p>
<h3>Education</h3>
<p>LGBTQ+ caucus OUD session planned for March/April.</p>
<h3>Finance and operations</h3>
<p>Domain and organizational email. 501(c)(6) discussed (later became 501(c)(3)). Printful, job board, newsletter, and Stripe.</p>
<h3>Membership</h3>
<p>Membership expanded. Use “people,” not “patients,” in outreach copy.</p>
`.trim();

const JANUARY_2026_AGENDA_HTML = `
<p><strong>SAMPA Board of Directors Meeting Agenda</strong></p>
<p>January 14, 2026 · 8–9 PM ET · Virtual</p>
<ol>
<li>Welcome/Call to Order</li>
<li>Attendance</li>
<li>November 2025 Meeting Minutes</li>
<li>Committee Reports — Bylaws; Certification; Education; Membership</li>
<li>New Business — Board Position Updates (Shani); PayPal (Shani); Zoom Business Account (Kala); 2025 CO Outreach &amp; Advocacy Awards (Deanna); CO Update Form AAPA (Clarissa); Mission Statement (Clarissa)</li>
<li>Open Forum</li>
<li>Next Meeting — February 11, 2026</li>
<li>Adjournment</li>
</ol>
`.trim();

const JANUARY_2026_MINUTES_HTML = `
<p><strong>SAMPA Board of Directors Meeting Minutes</strong></p>
<p>January 14, 2026 · 7:03–8:06 PM Central · Virtual · Regular meeting</p>
<p><strong>Present:</strong> Shani Wilson, PA-C; Kala Klug; Clarissa Peterson; Jordan Void; Josh Luftig; Megan Zawaki; Ariana (late).</p>
<p><strong>Absent with notice:</strong> Tasha Selinski; Cheryl Vanderford (family emergency).</p>
<h3>Call to Order</h3>
<p>The meeting ran 7:03–8:06 PM Central.</p>
<h3>November 2025 minutes</h3>
<p>November 2025 retreat minutes were deferred.</p>
<h3>Bylaws</h3>
<p>Near final. Async review over about 1.5 weeks.</p>
<h3>Education</h3>
<p>NCCPA CAQ outreach.</p>
<h3>Communications</h3>
<p>SAMPA email and social.</p>
<h3>Finance and board seats</h3>
<p>Josh Luftig was unanimously seated as Treasurer. A Financial Committee was formed. A technology / domain subcommittee was discussed.</p>
<h3>Mission</h3>
<p>Mission statement draft in progress.</p>
<h3>Open Forum</h3>
<p>SAMHSA funding cuts. AAPA award deadline January 31.</p>
<h3>Adjournment</h3>
<p>Adjourned 8:06 PM Central.</p>
`.trim();

const OCTOBER_2025_AGENDA_HTML = `
<p><strong>SPAAM / early SAMPA Meeting Agenda</strong></p>
<p>October 8, 2025 · Virtual</p>
<ol>
<li>Attendance</li>
<li>Approve September 2025 minutes</li>
<li>Retreat items</li>
<li>Open Forum</li>
<li>Next Meeting — November 2025</li>
</ol>
`.trim();

const SEPTEMBER_2025_MINUTES_HTML = `
<p><strong>SPAAM / early SAMPA Meeting Minutes</strong></p>
<p>September 10, 2025 · 6:05–7:10 · Virtual</p>
<p><strong>Present:</strong> Shani Wilson, Jordan Void, Cheryl Vanderford, Kala Klug, Clarissa Peterson, Arianna Campbell, Kerith Hartmann, Jim Anderson, Bernie.</p>
<p><strong>Absent:</strong> Tasha Selinski.</p>
<h3>Discussion</h3>
<p>Education, membership, certification, finance, rebrand, and retreat planning.</p>
`.trim();

const AUGUST_2025_MINUTES_HTML = `
<p><strong>SPAAM / early SAMPA Meeting Minutes</strong></p>
<p>August 25, 2025 · 7:05–8:00 · Virtual</p>
<h3>Discussion</h3>
<p>AAPA engagement. No dues yet. Retreat planning. Conflict of Interest draft. President-Elect speaker-bureau disclosure discussion.</p>
`.trim();

const JULY_2025_MINUTES_HTML = `
<p><strong>SPAAM / early SAMPA Meeting Minutes</strong></p>
<p>July 2025 · 7:05–8:00 PM CST · Virtual</p>
<p>First official general membership meeting.</p>
<h3>Committees</h3>
<p>Education: Kala and Natasha. Membership: Carrie and Clarissa. Bylaws: Deanna, Jordan, and Shani.</p>
<h3>Finance</h3>
<p>Treasurer search; Vic Holmes as mentor.</p>
<h3>Retreat</h3>
<p>Target September 2025.</p>
`.trim();

const JUNE_2025_MINUTES_HTML = `
<p><strong>SPAAM / early SAMPA Meeting Minutes</strong></p>
<p>June 11, 2025 · 6:01–about 7:37 PM CST · Virtual · Shani Wilson, Acting President</p>
<h3>AAPA 2025</h3>
<p>Resolutions discussion. Sober social: about 70–80 people across 14 organizations.</p>
<h3>Committees</h3>
<p>Education, Membership, Communications, Finance, Advocacy, and Bylaws.</p>
<h3>Education</h3>
<p>Co-chairs Kayla and Natasha. PCSS / AAPA CME.</p>
<h3>Action items</h3>
<p>Retreat; Treasurer; History (Jim); dues.</p>
`.trim();

const FEBRUARY_2025_NOTES_HTML = `
<p><strong>SPAAM Committee Meeting Notes</strong></p>
<p>February 2, 2025 · Historical SPAAM / early SAMPA record (committee notes, not a formal Board template)</p>
<p>Notes from Bernie Spaetz and Shani Wilson. Posted as an early organizational record.</p>
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
 * @property {'spaam'} [era]
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
    time: '8 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: AUGUST_2026_AGENDA_HTML }),
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
    date: '2026-06-10',
    time: '8:00–9:22 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: JUNE_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: JUNE_2026_MINUTES_HTML }),
  },
  {
    slug: '2026-05',
    title: 'May 2026 Board meeting',
    date: '2026-05-17',
    time: '6–7 PM CT',
    kind: 'regular',
    format: 'hybrid',
    location: 'AAPA New Orleans · Level 2, Room 278 + Virtual',
    status: 'completed',
    summary: 'Hybrid meeting at AAPA New Orleans (Room 278) and virtual.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: MAY_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: MAY_2026_MINUTES_HTML }),
  },
  {
    slug: '2026-04',
    title: 'April 2026 Board meeting',
    date: '2026-04-08',
    time: '8–9 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: APRIL_2026_AGENDA_HTML }),
    minutes: minutesDoc({
      status: 'posted',
      bodyHtml: APRIL_2026_MINUTES_HTML,
    }),
  },
  {
    slug: '2026-03',
    title: 'March 2026 Board meeting',
    date: '2026-03-11',
    time: '8–9 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: MARCH_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: MARCH_2026_MINUTES_HTML }),
  },
  {
    slug: '2026-02',
    title: 'February 2026 Board meeting',
    date: '2026-02-11',
    time: '8–9 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: FEBRUARY_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: FEBRUARY_2026_MINUTES_HTML }),
  },
  {
    slug: '2026-01',
    title: 'January 2026 Board meeting',
    date: '2026-01-14',
    time: '8–9 PM ET',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    status: 'completed',
    summary: 'Monthly virtual meeting. Agenda and minutes posted.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: JANUARY_2026_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: JANUARY_2026_MINUTES_HTML }),
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
    slug: '2025-10',
    title: 'October 2025 meeting (SPAAM / early SAMPA)',
    date: '2025-10-08',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'Historical SPAAM / early SAMPA agenda.',
    agenda: agendaDoc({ status: 'posted', bodyHtml: OCTOBER_2025_AGENDA_HTML }),
    minutes: minutesDoc({ status: 'not_yet' }),
  },
  {
    slug: '2025-09',
    title: 'September 2025 meeting (SPAAM / early SAMPA)',
    date: '2025-09-10',
    time: '6:05–7:10',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'Historical SPAAM / early SAMPA minutes.',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: SEPTEMBER_2025_MINUTES_HTML }),
  },
  {
    slug: '2025-08',
    title: 'August 2025 meeting (SPAAM / early SAMPA)',
    date: '2025-08-25',
    time: '7:05–8:00',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'Historical SPAAM / early SAMPA minutes.',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: AUGUST_2025_MINUTES_HTML }),
  },
  {
    slug: '2025-07',
    title: 'July 2025 meeting (SPAAM / early SAMPA)',
    date: null,
    dateLabel: 'July 2025',
    time: '7:05–8:00 PM CST',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'First official general membership meeting. Historical SPAAM / early SAMPA.',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: JULY_2025_MINUTES_HTML }),
  },
  {
    slug: '2025-06',
    title: 'June 2025 meeting (SPAAM / early SAMPA)',
    date: '2025-06-11',
    time: '6:01–about 7:37 PM CST',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'Shani Wilson, Acting President. Historical SPAAM / early SAMPA.',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({ status: 'posted', bodyHtml: JUNE_2025_MINUTES_HTML }),
  },
  {
    slug: '2025-02',
    title: 'February 2025 SPAAM committee notes',
    date: '2025-02-02',
    kind: 'regular',
    format: 'virtual',
    location: 'Virtual',
    era: 'spaam',
    status: 'completed',
    summary: 'SPAAM committee notes (Bernie Spaetz, Shani Wilson) — early historical record, not a formal Board template.',
    agenda: agendaDoc({ status: 'not_yet' }),
    minutes: minutesDoc({
      status: 'posted',
      bodyHtml: FEBRUARY_2025_NOTES_HTML,
      label: 'Committee notes',
    }),
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

function dateLabelFromIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return iso || '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function meetingWhenLabel(meeting) {
  if (meeting?.date) return dateLabelFromIso(meeting.date);
  return meeting?.dateLabel || 'Date to be announced';
}

/** Agenda-list title, AAPA-style (“September 9, 2026 Board Meeting”). */
export function agendaListTitle(meeting) {
  const when = meetingWhenLabel(meeting);
  if (meeting?.era === 'spaam') {
    return meeting.slug === '2025-02'
      ? `${when} SPAAM Committee Meeting`
      : `${when} SPAAM / Early SAMPA Meeting`;
  }
  if (meeting?.kind === 'annual') return `${when} Annual Board Meeting`;
  if (meeting?.kind === 'special') return `${when} Special Board Meeting`;
  return `${when} Board Meeting`;
}

/** Record-list type, AAPA-style (Virtual BOD / In Person / Special / Annual). */
export function recordTypeLabel(meeting) {
  if (meeting?.era === 'spaam') {
    return meeting.slug === '2025-02' ? 'SPAAM committee notes' : 'SPAAM / early SAMPA';
  }
  if (meeting?.kind === 'annual') return 'Annual record';
  if (meeting?.kind === 'special') return 'Special';
  if (meeting?.format === 'in-person') return 'In Person';
  if (meeting?.format === 'hybrid') return 'Hybrid BOD';
  return 'Virtual BOD';
}

export function recordListTitle(meeting) {
  return `${meetingWhenLabel(meeting)} ${recordTypeLabel(meeting)}`;
}

/** Second Wednesday of a calendar month (local date). month is 1–12. */
export function secondWednesday(year, month) {
  const first = new Date(year, month - 1, 1);
  const firstWed = 1 + ((3 - first.getDay() + 7) % 7);
  return new Date(year, month - 1, firstWed + 7);
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Next standing Board dates from the 2nd-Wednesday / 8:00 PM ET rule.
 * Does not invent a long forward calendar — default is the next two.
 */
export function nextStandingBoardDates(count = 2, from = new Date(), meetings = BOARD_MEETINGS) {
  const out = [];
  let year = from.getFullYear();
  let month = from.getMonth() + 1;
  while (out.length < count) {
    const day = secondWednesday(year, month);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
    if (end >= from) {
      const date = isoDate(day);
      const seeded = meetings.find((m) => m.date === date) || null;
      out.push({
        date,
        dateLabel: dateLabelFromIso(date),
        time: '8:00 PM ET',
        location: 'Virtual',
        slug: seeded?.slug || null,
      });
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
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
