import {
  agendaListTitle,
  effectiveStatus,
  hasListedDoc,
  recordListTitle,
} from '../../src/data/boardSchedule.js';

/**
 * Shape board meeting rows. The agenda and minutes text lives in
 * public.board_meetings, not in this file. Do not import a minutes
 * archive from src/.
 */

export function meetingFromRow(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    date: row.meeting_date || null,
    dateLabel: row.date_label || null,
    time: row.time_label || null,
    kind: row.kind,
    format: row.format,
    location: row.location || null,
    era: row.era || null,
    status: row.status,
    summary: row.summary || null,
    agenda: {
      status: row.agenda_status,
      label: row.agenda_label || null,
      bodyHtml: row.agenda_html || null,
      pdfUrl: row.agenda_pdf_url || null,
    },
    minutes: {
      status: row.minutes_status,
      label: row.minutes_label || null,
      bodyHtml: row.minutes_html || null,
      pdfUrl: row.minutes_pdf_url || null,
      approvedAt: row.minutes_approved_on || null,
    },
  };
}

export function withEffectiveStatus(meetings, today = new Date()) {
  return (meetings || []).map((meeting) => ({
    ...meeting,
    status: effectiveStatus(meeting, today),
  }));
}

export function upcomingMeetings(meetings, today = new Date()) {
  return (meetings || []).filter((meeting) => {
    const status = effectiveStatus(meeting, today);
    return status === 'upcoming' || status === 'scheduled';
  });
}

export function completedMeetings(meetings, today = new Date()) {
  return (meetings || []).filter((meeting) => effectiveStatus(meeting, today) === 'completed');
}

export function meetingsWithAgenda(meetings) {
  return (meetings || []).filter((meeting) => hasListedDoc(meeting.agenda));
}

export function meetingsWithMinutes(meetings) {
  return (meetings || []).filter((meeting) => hasListedDoc(meeting.minutes));
}

function publicDoc(doc) {
  if (!doc) return null;
  return {
    status: doc.status,
    label: doc.label || null,
    pdfUrl: doc.pdfUrl || null,
    approvedAt: doc.approvedAt || null,
  };
}

export function publicMeeting(meeting, today = new Date()) {
  const presented = {
    ...meeting,
    status: effectiveStatus(meeting, today),
  };
  return {
    slug: presented.slug,
    title: presented.title,
    date: presented.date,
    dateLabel: presented.dateLabel || null,
    time: presented.time || null,
    kind: presented.kind,
    format: presented.format,
    location: presented.location || null,
    era: presented.era || null,
    status: presented.status,
    agendaListTitle: agendaListTitle(presented),
    recordListTitle: recordListTitle(presented),
    agenda: publicDoc(presented.agenda),
    minutes: publicDoc(presented.minutes),
  };
}

export function memberMeeting(meeting, today = new Date()) {
  const listed = publicMeeting(meeting, today);
  return {
    ...listed,
    agenda: { ...listed.agenda, bodyHtml: meeting.agenda?.bodyHtml || null },
    minutes: { ...listed.minutes, bodyHtml: meeting.minutes?.bodyHtml || null },
  };
}
