// Site-wide announcements. Add a row to reuse this for the next one.
//
// endsAt is an instant with an explicit offset. America/Los_Angeles is
// UTC-7 (PDT) through the first Sunday in November and UTC-8 (PST) after.
// The browser compares that instant to its clock, so a cached bundle still
// expires on time. Do not gate this on a rebuild or an HTML cache header.

export const GIVEAWAY_ID = 'psych-congress-pa-institute-2026';

// Active through 2026-10-01 23:59 America/Los_Angeles. The next local
// instant (2026-10-02 00:00 PDT) is closed.
export const GIVEAWAY_ENDS_AT = '2026-10-01T23:59:59.999-07:00';

export const ANNOUNCEMENTS = [
  {
    id: GIVEAWAY_ID,
    endsAt: GIVEAWAY_ENDS_AT,
    href: '/giveaway',
    message:
      'Win a free Psych Congress PA Institute registration (Orlando, Dec 4–6). Enter on Instagram by Oct 1.',
    linkLabel: 'How to enter',
  },
];

export function announcementById(id) {
  return ANNOUNCEMENTS.find((item) => item.id === id) ?? null;
}

export function isAnnouncementOpen(announcement, now = new Date()) {
  if (!announcement) return false;
  const ends = Date.parse(announcement.endsAt);
  if (Number.isNaN(ends)) return false;
  return now.getTime() <= ends;
}

export function openAnnouncements(now = new Date()) {
  return ANNOUNCEMENTS.filter((item) => isAnnouncementOpen(item, now));
}
