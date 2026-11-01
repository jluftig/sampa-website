// Peer-directory chips. Patron is a boolean add-on, never a membership_tier.
// Donor is the directory RPC's 12-month flag, not a raw donated_at timestamp.
export function directoryBadgeLabels(person) {
  const labels = [];
  if (person?.is_board) labels.push('Board');
  if (person?.patron) labels.push('Patron');
  if (person?.donor) labels.push('Donor');
  return labels;
}
