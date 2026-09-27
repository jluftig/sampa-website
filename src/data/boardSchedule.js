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

export function kindLabel(kind) {
  return MEETING_KINDS[kind]?.label || 'Meeting';
}

export function meetingStatusLabel(status) {
  return MEETING_STATUSES[status]?.label || status;
}

export function docStatusLabel(status) {
  return DOC_STATUSES[status]?.label || status;
}

export function dateLabelFromIso(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!match) return iso || '';
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function meetingWhenLabel(meeting) {
  if (meeting?.date) return dateLabelFromIso(meeting.date);
  return meeting?.dateLabel || 'Date to be announced';
}

export function agendaListTitle(meeting) {
  const when = meetingWhenLabel(meeting);
  if (meeting?.era === 'spaam') return `${when} SPAAM Meeting`;
  if (meeting?.kind === 'annual') return `${when} Annual Board Meeting`;
  if (meeting?.kind === 'special') return `${when} Special Board Meeting`;
  return `${when} Board Meeting`;
}

export function recordTypeLabel(meeting) {
  if (meeting?.era === 'spaam') return 'SPAAM';
  if (meeting?.kind === 'annual') return 'Annual record';
  if (meeting?.kind === 'special') return 'Special';
  if (meeting?.format === 'in-person') return 'In Person';
  if (meeting?.format === 'hybrid') return 'Hybrid BOD';
  return 'Virtual BOD';
}

export function recordListTitle(meeting) {
  return `${meetingWhenLabel(meeting)} ${recordTypeLabel(meeting)}`;
}

export function secondWednesday(year, month) {
  const first = new Date(year, month - 1, 1);
  const firstWed = 1 + ((3 - first.getDay() + 7) % 7);
  return new Date(year, month - 1, firstWed + 7);
}

function isoDate(day) {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function nextStandingBoardDates(count = 2, from = new Date(), meetings = []) {
  const out = [];
  let year = from.getFullYear();
  let month = from.getMonth() + 1;
  while (out.length < count) {
    const day = secondWednesday(year, month);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
    if (end >= from) {
      const date = isoDate(day);
      const seeded = meetings.find((meeting) => meeting.date === date) || null;
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

export function effectiveStatus(meeting, today = new Date()) {
  if (!meeting) return null;
  if (meeting.status === 'cancelled') return 'cancelled';
  if (meeting.date && (meeting.status === 'upcoming' || meeting.status === 'scheduled')) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(meeting.date);
    if (match) {
      const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59);
      if (end < today) return 'completed';
    }
  }
  return meeting.status;
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

export function recordsEmptyCopy(records) {
  if (!records || records.length > 0) return null;
  return 'No approved minutes yet.';
}
