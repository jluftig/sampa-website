// Peer-directory chips. Patron is a boolean add-on, never a membership_tier.
export function directoryBadgeLabels(person) {
  const labels = [];
  if (person?.is_board) labels.push('Board');
  if (person?.patron) labels.push('Patron');
  return labels;
}
