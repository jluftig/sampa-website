export const BOARD_HUB = {
  title: 'Board of Directors Meetings and Meeting Records',
  recordsIntro:
    'The SAMPA Board of Directors publishes meeting minutes and summary of actions. Per The Standard Code of Parliamentary Procedure, 5th Ed., these records are posted following BOD approval, which typically occurs at the next scheduled meeting or conference call. Minutes are retained online for one year.',
  scheduleIntro:
    'The SAMPA Board of Directors conducts monthly virtual meetings. The regular meeting schedule is listed below. SAMPA members interested in attending as a member observer can contact info@addictionpas.org, the President (president@addictionpas.org), or the Secretary (secretary@addictionpas.org) for more information.',
  observerEmails: [
    'info@addictionpas.org',
    'president@addictionpas.org',
    'secretary@addictionpas.org',
  ],
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function observerCopyParts(text) {
  const emails = [...BOARD_HUB.observerEmails].sort((a, b) => b.length - a.length);
  const source = String(text || '');
  if (emails.length === 0) return [{ type: 'text', value: source }];
  const pattern = new RegExp(`(${emails.map(escapeRegExp).join('|')})`, 'g');
  return source.split(pattern).filter((part) => part !== '').map((part) => (
    emails.includes(part) ? { type: 'email', value: part } : { type: 'text', value: part }
  ));
}
