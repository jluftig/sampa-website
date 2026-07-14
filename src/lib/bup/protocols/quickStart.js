// Buprenorphine (Bup) Quick Start — high-dose SL initiation in moderate–severe
// withdrawal (ED or inpatient; "Emergency Department" removed from the title
// per planned CA Bridge revision).
// Transcribed from the CA Bridge PDF "Emergency Department Buprenorphine (Bup)
// Quick Start" (May 2025) — the PDF is the source of truth for every dose.
// A content revision = edit this data + bump `version`; components don't change.

export const QUICK_START = {
  key: 'quick-start',
  slug: 'quick-start',
  title: 'Buprenorphine (Bup) Quick Start',
  shortTitle: 'Quick Start',
  audience: 'ED and inpatient',
  blurb: 'High-dose SL initiation in moderate–severe withdrawal.',
  version: '1.0.0',
  source: {
    title: 'CA Bridge — Emergency Department Buprenorphine (Bup) Quick Start',
    revised: 'May 2025',
    url: null, // public CA Bridge PDF URL — confirm before launch
  },
  intro:
    'Connect with your patient: accurate diagnosis and treatment requires trust, collaboration, and shared decision making.',

  eligibility: {
    heading: 'Confirm withdrawal before the first dose',
    criteria: [
      'At least two clear objective signs not attributable to something else: large pupils, yawning, runny nose and tearing, sweating, vomiting, diarrhea, gooseflesh/piloerection, tachycardia.',
      'Confirm with the patient that they feel “bad” withdrawal and feel ready to start bup. If they feel their withdrawal is mild, it is likely too soon.',
      'As needed, use the COWS (Clinical Opioid Withdrawal Scale). Start if COWS ≥ 8 with ≥ 2 objective signs.',
      'Withdrawal sufficient to start bup typically occurs 24–36 hours after decreased/stopped use, but can vary from 6–72 hours. Methadone withdrawal commonly takes longer.',
    ],
  },

  flow: {
    start: 'q_withdrawal',
    steps: {
      q_withdrawal: {
        kind: 'question',
        prompt: 'Is the patient in opioid withdrawal?',
        help: 'See “Confirm withdrawal before the first dose” above.',
        options: [
          { value: 'yes', label: 'Yes — withdrawal confirmed', next: 'dose1' },
          { value: 'no', label: 'No — not yet in withdrawal', next: 'selfDirected' },
        ],
      },

      selfDirected: {
        kind: 'checklist',
        title: 'Rx self-directed start',
        items: [
          'Wait for severe withdrawal, then start with 8–24+ mg SL.',
          'Prescribe per the Discharge bundle (below).',
          'Give the Buprenorphine Self-Start patient handout.',
        ],
        linkTo: { protocol: 'self-start', label: 'Open the Self-Start handout' },
      },

      dose1: {
        kind: 'dose',
        label: 'First dose',
        dose: 'Buprenorphine 16 mg SL',
        range: 'range 8–24+ mg',
        detail:
          'Heavy dependence/tolerance (e.g., fentanyl) may need higher doses; low dependence/tolerance may do well with lower doses. Respect patient preference.',
        next: 'reassess1',
      },

      reassess1: {
        kind: 'reassess',
        timing: 'Reassess in 30–60 minutes',
        prompt: 'Withdrawal improved?',
        options: [
          { value: 'improved', label: 'Yes — improved', next: 'dose2' },
          { value: 'notImproved', label: 'No improvement, or worse', next: 'differential' },
        ],
      },

      dose2: {
        kind: 'dose',
        label: 'Second dose',
        dose: 'Additional 8–24+ mg SL bup',
        next: 'discharge',
      },

      differential: {
        kind: 'question',
        prompt: 'No improvement or worse — what best fits the picture?',
        options: [
          {
            value: 'worseningWithdrawal',
            label: 'Worsening untreated withdrawal (common) — occurs with lower starting doses and heavy tolerance',
            next: 'moreBup',
          },
          {
            value: 'otherSubstance',
            label: 'Other substance intoxication or withdrawal',
            next: 'note_otherSubstance',
          },
          {
            value: 'sideEffects',
            label: 'Bup side-effects (e.g., nausea or headache)',
            next: 'note_sideEffects',
          },
          {
            value: 'medicalIllness',
            label: 'Medical illness',
            next: 'note_medicalIllness',
          },
          {
            value: 'precipitated',
            label: 'Sudden and significant worsening soon after bup (rare) — precipitated withdrawal',
            next: 'rescue',
          },
        ],
      },

      moreBup: {
        kind: 'dose',
        label: 'More bup',
        dose: 'Additional 8–16 mg SL bup',
        detail: 'Worsening untreated withdrawal improves with more bup.',
        next: 'reassess1',
      },

      note_otherSubstance: {
        kind: 'note',
        text: 'Continue bup and manage the additional syndromes.',
        next: 'reassess1',
      },

      note_sideEffects: {
        kind: 'note',
        text: 'Continue bup and treat side-effects with supportive medications.',
        next: 'reassess1',
      },

      note_medicalIllness: {
        kind: 'note',
        text: 'Continue bup and manage the underlying condition.',
        next: 'reassess1',
      },

      rescue: {
        kind: 'alert',
        title: 'Precipitated withdrawal — act quickly',
        items: ['Bup 16 mg SL AND lorazepam 2 mg PO.'],
        next: 'rescueReassess1',
      },

      rescueReassess1: {
        kind: 'reassess',
        timing: 'Reassess in 30 minutes',
        prompt: 'Symptoms improved?',
        options: [
          { value: 'yes', label: 'Yes — improved', next: 'rescueResolved' },
          { value: 'no', label: 'No', next: 'rescueDose2' },
        ],
      },

      rescueDose2: {
        kind: 'dose',
        label: 'Repeat bup',
        dose: 'Buprenorphine 16 mg SL',
        next: 'rescueReassess2',
      },

      rescueReassess2: {
        kind: 'reassess',
        timing: 'Reassess in 30 minutes',
        prompt: 'Continued severe withdrawal?',
        options: [
          { value: 'yes', label: 'Yes — still severe', next: 'rescueEscalate' },
          { value: 'no', label: 'No — improving', next: 'rescueResolved' },
        ],
      },

      rescueEscalate: {
        kind: 'alert',
        title: 'Escalate level of care',
        intro:
          'Manage potential moderate to deep sedation, including cardiac, pulse oximetry, and end-tidal CO₂ monitoring:',
        items: [
          'Ketamine 0.3 mg/kg IV slow push q15 minutes and/or infusion.',
          'Fentanyl 200 mcg IV q10 minutes. Total dose of > 2,000 mcg has been reported.',
        ],
        next: 'rescueResolved',
      },

      rescueResolved: {
        kind: 'note',
        text: 'After clinical resolution, observe and discharge with bup Rx and/or XR bup.',
        next: 'discharge',
      },

      discharge: {
        kind: 'checklist',
        title: 'Discharge bundle',
        items: [
          'Prescribe at least a 2-week supply of 16–32 mg SL bup per day.',
          'Example 2-week order: buprenorphine/naloxone 8/2 mg film — 1 film SL TID, #42, 1 refill. Notes to pharmacy: OK to substitute tablets or monoproduct. ICD-10 F11.20.',
          'Dispense/distribute naloxone in-hand.',
        ],
      },
    },
  },

  adjuncts: {
    heading: 'Adjuvant medications',
    caveat: 'OK, but should not delay or replace bup. Use sparingly with appropriate caution.',
    items: [
      { group: 'Benzodiazepines', drug: 'Lorazepam 2 mg PO/IV' },
      { group: 'Antipsychotics', drug: 'Olanzapine 5 mg PO/IM' },
      { group: 'Alpha-agonists', drug: 'Clonidine 0.1–0.3 mg PO' },
      { group: 'D2/D3 agonists', drug: 'Pramipexole 0.25 mg PO' },
      { group: 'Gabapentinoids', drug: 'Pregabalin 150 mg PO' },
    ],
  },

  infoSections: [
    {
      heading: 'Bup dosing tips',
      // Hold-to-peek chip on the eligibility card (not a permanent footer block).
      supportChip: true,
      items: [
        'Respect patient preference. Shared decision making, flexibility, and collaboration are essential.',
        'Heavy dependence/tolerance (e.g., fentanyl) may need higher doses of bup.',
        'Low dependence/tolerance may do well with lower doses of bup.',
        'Starting bup may be delayed or modified with complicating factors: altered mental status, delirium, or intoxication; severe acute pain, trauma, or planned surgery; severe medical illness; long-term methadone maintenance.',
      ],
    },
    {
      heading: 'Bup Rx notes',
      items: [
        'The X-waiver program has ended. Only a DEA license is needed to prescribe (schedule III).',
        'Either bup or bup/nx SL films or tabs are OK.',
        'Bup monoproduct or bup/nx is OK in pregnancy.',
      ],
    },
  ],
};
