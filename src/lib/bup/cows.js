// Clinical Opiate Withdrawal Scale (COWS) — Wesson & Ling, J Psychoactive
// Drugs 35(2), 2003. Pure data + scoring, zero React imports.
//
// `objective: true` marks the answer grades that count as OBJECTIVE signs of
// withdrawal. The reference is the validated Objective Opiate Withdrawal Scale
// (OOWS; Handelsman et al. 1987), whose 13 rater-observed signs include
// restlessness ("frequent changes of position"), tremor, muscle twitches, and
// yawning (">1 yawn") — plus the CA Bridge Quick Start list (large pupils,
// yawning, runny nose & tearing, sweating, vomiting, diarrhea,
// gooseflesh/piloerection, tachycardia). A grade is flagged only where the
// finding is observable to the rater rather than pure self-report. Each flag is
// a SAMPA-reviewed clinical judgment — tuning a threshold is a one-line edit.
// Bone/joint aches (arthralgia) stay unflagged: the pain itself is subjective
// and is not an OOWS observable sign.

export const COWS = {
  version: '1.1.0', // 1.1.0: objective-sign flags aligned to OOWS (restlessness, tremor, yawning≥2, anxiety g4)
  source: {
    title: 'Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS)',
    citation: 'J Psychoactive Drugs. 2003;35(2):253–259',
  },

  // The bup tool's own branching condition (distinct from the severity bands):
  startCondition: 'The Quick Start protocols use COWS ≥ 8 with ≥ 2 objective signs as the start threshold.',

  items: [
    {
      key: 'pulse',
      label: 'Resting pulse rate (beats/minute)',
      help: 'Measured after the patient is sitting or lying for one minute.',
      options: [
        { points: 0, label: 'Pulse rate 80 or below' },
        { points: 1, label: 'Pulse rate 81–100' },
        { points: 2, label: 'Pulse rate 101–120', objective: true },
        { points: 4, label: 'Pulse rate greater than 120', objective: true },
      ],
    },
    {
      key: 'sweating',
      label: 'Sweating',
      help: 'Over the past half hour, not accounted for by room temperature or patient activity.',
      options: [
        { points: 0, label: 'No report of chills or flushing' },
        { points: 1, label: 'Subjective report of chills or flushing' },
        { points: 2, label: 'Flushed or observable moistness on face', objective: true },
        { points: 3, label: 'Beads of sweat on brow or face', objective: true },
        { points: 4, label: 'Sweat streaming off face', objective: true },
      ],
    },
    {
      key: 'restlessness',
      label: 'Restlessness',
      help: 'Observation during assessment.',
      options: [
        { points: 0, label: 'Able to sit still' },
        // Grade 1 is self-report ("reports difficulty… but is able"); grades 3
        // and 5 are the observable OOWS "frequent changes of position".
        { points: 1, label: 'Reports difficulty sitting still, but is able to do so' },
        { points: 3, label: 'Frequent shifting or extraneous movements of legs/arms', objective: true },
        { points: 5, label: 'Unable to sit still for more than a few seconds', objective: true },
      ],
    },
    {
      key: 'pupils',
      label: 'Pupil size',
      options: [
        { points: 0, label: 'Pupils pinned or normal size for room light' },
        { points: 1, label: 'Pupils possibly larger than normal for room light' },
        { points: 2, label: 'Pupils moderately dilated', objective: true },
        { points: 5, label: 'Pupils so dilated that only the rim of the iris is visible', objective: true },
      ],
    },
    {
      key: 'aches',
      label: 'Bone or joint aches',
      help: 'If the patient was having pain previously, score only the additional component attributed to opioid withdrawal.',
      options: [
        { points: 0, label: 'Not present' },
        { points: 1, label: 'Mild diffuse discomfort' },
        { points: 2, label: 'Patient reports severe diffuse aching of joints/muscles' },
        { points: 4, label: 'Patient is rubbing joints or muscles and is unable to sit still because of discomfort' },
      ],
    },
    {
      key: 'rhinorrhea',
      label: 'Runny nose or tearing',
      help: 'Not accounted for by cold symptoms or allergies.',
      options: [
        { points: 0, label: 'Not present' },
        { points: 1, label: 'Nasal stuffiness or unusually moist eyes' },
        { points: 2, label: 'Nose running or tearing', objective: true },
        { points: 4, label: 'Nose constantly running or tears streaming down cheeks', objective: true },
      ],
    },
    {
      key: 'gi',
      label: 'GI upset',
      help: 'Over the last half hour.',
      options: [
        { points: 0, label: 'No GI symptoms' },
        { points: 1, label: 'Stomach cramps' },
        { points: 2, label: 'Nausea or loose stool' },
        { points: 3, label: 'Vomiting or diarrhea', objective: true },
        { points: 5, label: 'Multiple episodes of diarrhea or vomiting', objective: true },
      ],
    },
    {
      key: 'tremor',
      label: 'Tremor',
      help: 'Observation of outstretched hands.',
      options: [
        { points: 0, label: 'No tremor' },
        // Grade 1 is explicitly "felt, but not observed" — not objective.
        // Grades 2 and 4 are observable tremor / muscle twitching (OOWS items 6 & 11).
        { points: 1, label: 'Tremor can be felt, but not observed' },
        { points: 2, label: 'Slight tremor observable', objective: true },
        { points: 4, label: 'Gross tremor or muscle twitching', objective: true },
      ],
    },
    {
      key: 'yawning',
      label: 'Yawning',
      help: 'Observation during assessment.',
      options: [
        { points: 0, label: 'No yawning' },
        // OOWS counts ">1 yawn" as an objective sign, so grade 1 (once or twice) is flagged.
        { points: 1, label: 'Yawning once or twice during assessment', objective: true },
        { points: 2, label: 'Yawning three or more times during assessment', objective: true },
        { points: 4, label: 'Yawning several times per minute', objective: true },
      ],
    },
    {
      key: 'anxiety',
      label: 'Anxiety or irritability',
      options: [
        { points: 0, label: 'None' },
        { points: 1, label: 'Patient reports increasing irritability or anxiousness' },
        { points: 2, label: 'Patient obviously irritable or anxious' },
        // Anxiety is an OOWS objective sign, but the softest and rater-dependent;
        // only grade 4 (observable behavioral disruption of the assessment) is flagged.
        { points: 4, label: 'Patient so irritable or anxious that participation in the assessment is difficult', objective: true },
      ],
    },
    {
      key: 'gooseflesh',
      label: 'Gooseflesh skin',
      options: [
        { points: 0, label: 'Skin is smooth' },
        { points: 3, label: 'Piloerection of skin can be felt, or hairs standing up on arms', objective: true },
        { points: 5, label: 'Prominent piloerection', objective: true },
      ],
    },
  ],

  // Standard Wesson & Ling interpretation (distinct from the protocols' own
  // COWS ≥ 8 + ≥ 2 objective signs start condition — never conflate the two).
  bands: [
    { min: 0, max: 4, key: 'minimal', label: 'Below the mild range' },
    { min: 5, max: 12, key: 'mild', label: 'Mild withdrawal' },
    { min: 13, max: 24, key: 'moderate', label: 'Moderate withdrawal' },
    { min: 25, max: 36, key: 'modSevere', label: 'Moderately severe withdrawal' },
    { min: 37, max: 48, key: 'severe', label: 'Severe withdrawal' },
  ],
};

export function cowsBand(total) {
  return COWS.bands.find((b) => total >= b.min && total <= b.max) || COWS.bands[COWS.bands.length - 1];
}

// selections: map of item key → option INDEX (not points). Unanswered items
// count as 0, MD-Calc style — `complete` says whether all 11 were scored.
export function scoreCows(selections) {
  let total = 0;
  let answeredCount = 0;
  let objectiveCount = 0;
  const objectiveLabels = [];

  for (const item of COWS.items) {
    const idx = selections?.[item.key];
    const option = idx === undefined ? undefined : item.options[idx];
    if (!option) continue;
    answeredCount += 1;
    total += option.points;
    if (option.objective) {
      objectiveCount += 1;
      objectiveLabels.push(item.label);
    }
  }

  return {
    total,
    answeredCount,
    complete: answeredCount === COWS.items.length,
    band: cowsBand(total),
    objectiveCount,
    objectiveLabels,
  };
}

function timeLabel(epochMs) {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// entries: chronological [{ takenAt, total, band, objectiveCount, selections }]
// (the shape cowsSession.js stores). EHR-paste-safe plain text: the
// timestamped series, then the full 11-item breakdown of the newest score.
export function cowsSeriesText(entries, now = new Date()) {
  const lines = [
    'COWS SCORE SERIES (Clinical Opiate Withdrawal Scale)',
    `Recorded with the SAMPA Bup Dosing Tool — ${now.toLocaleString()}`,
    '',
  ];

  entries.forEach((entry, i) => {
    lines.push(
      `${i + 1}. ${new Date(entry.takenAt).toLocaleString()} — COWS ${entry.total} (${cowsBand(entry.total).label.toLowerCase()}) — ${entry.objectiveCount} objective sign${entry.objectiveCount === 1 ? '' : 's'}`
    );
  });

  const latest = entries[entries.length - 1];
  if (latest?.selections) {
    lines.push('', `Latest score detail (${timeLabel(latest.takenAt)}):`);
    for (const item of COWS.items) {
      const idx = latest.selections[item.key];
      const option = idx === undefined ? undefined : item.options[idx];
      lines.push(
        option
          ? `- ${item.label}: ${option.label} (${option.points}${option.objective ? ', objective' : ''})`
          : `- ${item.label}: not scored (0)`
      );
    }
  }

  lines.push(
    '',
    'Decision support only — does not replace clinical judgment.',
    `Scale: ${COWS.source.title}. ${COWS.source.citation}.`
  );
  return lines.join('\n');
}
