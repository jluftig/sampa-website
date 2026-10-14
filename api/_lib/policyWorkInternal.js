const HHS_PACKET = 'https://docs.google.com/document/d/1SQWwYdfgSkxT8VYASlPZ4s4v-yGHdGBa/edit?usp=share_link&ouid=104595662487774707106&rtpof=true&sd=true';
const ASAM_PACKET = 'https://docs.google.com/document/d/1d7vJlcLmm7go7S7WvWhXMbl06qBkejRTlDFk7Ut3B5o/edit?usp=sharing';

const ITEMS = [
  {
    id: 'php-2026-1',
    submittedTo: 'Brian Dautch of AAPA',
    packetUrl: HHS_PACKET,
    notes: {
      'match-published': 'Confirm the Google Doc matches the published HHS comment.',
    },
  },
  {
    id: 'php-2026-2',
    submittedTo: 'Jennifer Kolb of AAPA',
    packetUrl: ASAM_PACKET,
    notes: {
      'separate-correctional': 'Keep this drug-testing statement separate from the correctional-settings comment on /policy.',
    },
  },
  {
    id: 'php-2026-3',
    submittedTo: '',
    packetUrl: null,
    notes: {
      'fill-sheet': 'Record the submission date and who received it. The sheet left both blank.',
      'match-published': 'Confirm whether this row is the published HRSA psychedelic RFI comment.',
    },
  },
];

export function listPolicyWorkInternal() {
  return ITEMS.map((item) => ({
    id: item.id,
    submittedTo: item.submittedTo,
    packetUrl: item.packetUrl,
    notes: { ...item.notes },
  }));
}
