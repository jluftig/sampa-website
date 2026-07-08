// Bup Low Dose with Opioid Continuation (Inpatient) — 3-day low-dose bup
// ramp with full-agonist opioids continued and maximized throughout.
// Transcribed from the CA Bridge PDF "Buprenorphine (Bup) Hospital Start:
// Low-Dose Bup Initiation with Opioid Continuation" (January 2026).
//
// FIRM GUARDRAIL (SAMPA clinical review): this is NEVER an outpatient or
// discharge pathway — full-agonist opioids cannot be prescribed outpatient
// for OUD. The ED may initiate it only for patients being admitted.
//
// Editorial deviation from the source PDF, per SAMPA guardrail 2 (no
// acute-care methadone→bup transition pathway): the 8-day ramp is presented
// as an extended schedule for slower up-titration, without the PDF's
// "high-dose methadone transition" framing. Flagged for clinical review.

export const LOW_DOSE = {
  key: 'low-dose',
  slug: 'low-dose',
  title: 'Bup Low Dose with Opioid Continuation (Inpatient)',
  shortTitle: 'Low Dose',
  audience: 'Inpatient (may start in ED when admission is planned)',
  blurb: 'Three-day low-dose bup ramp with full-agonist opioids continued throughout.',
  version: '1.0.0',
  source: {
    title:
      'CA Bridge — Buprenorphine (Bup) Hospital Start: Low-Dose Bup Initiation with Opioid Continuation',
    revised: 'January 2026',
    url: null, // public CA Bridge PDF URL — confirm before launch
  },
  intro:
    'Maximize pain control and withdrawal treatment with opioid analgesics throughout bup initiation. No need to wait for withdrawal.',

  guardrail:
    'Inpatient-only pathway — never an outpatient or discharge plan. Full-agonist opioids cannot be prescribed for outpatient use in OUD; a discharged patient would be left to illicit opioids. The ED may initiate this protocol only for patients being admitted.',

  fullAgonist: {
    heading: 'Opioid continuation — continue and MAXIMIZE throughout',
    principle:
      'Do not aim to decrease the full agonist during bup up-titration. Simultaneous bup up-titration and full-agonist weaning may abruptly reduce total opioid activation, causing pain and withdrawal. The aim is to safely maximize full-agonist opioids for comfort and to prevent treatment disengagement (e.g., leaving AMA).',
    exampleHeading: 'Example regimen (assumes very high opioid tolerance — tailor with clinical judgment)',
    example: [
      'Morphine ER 30–60 mg PO q8h scheduled',
      'Morphine IR 15–30 mg PO q4h PRN',
      'Morphine 10–20 mg IV q4h PRN',
    ],
    alternatives: {
      columns: ['Instead of…', 'Alternatives'],
      rows: [
        ['Morphine ER 60 mg PO q8h', 'Oxycodone ER 40 mg PO q8h, or methadone 10 mg PO q8h'],
        ['Morphine IR 30 mg PO q4h PRN', 'Oxycodone IR 20 mg PO q4h PRN, or hydromorphone 6–8 mg PO q4h PRN'],
        ['Morphine 20 mg IV q4h PRN', 'Hydromorphone 4 mg IV q4h PRN, or fentanyl 200 mcg IV q4h PRN'],
      ],
      footnote:
        'Combine opioids with a multimodal analgesic strategy for optimized comfort and pain control (e.g., NSAIDs, ketamine, regional anesthesia).',
    },
  },

  ramps: [
    {
      key: 'standard',
      label: '3-day (standard)',
      description: 'The standard rapid up-titration for most admitted patients.',
      columns: ['Day', 'Bup dosing'],
      rows: [
        ['Day 1', 'Bup 0.5 mg SL q3h × 8 doses (q4h × 6 doses is OK)'],
        ['Day 2', 'Bup 1 mg SL q3h × 8 doses (q4h × 6 doses is OK)'],
        ['Day 3', 'Bup 8 mg SL TID, or injectable XR bup (e.g., 300 mg SQ)'],
      ],
    },
    {
      key: 'fiveDay',
      label: '5-day',
      description: 'A gentler ramp when the rapid 3-day schedule is not appropriate.',
      columns: ['Day', 'Bup dosing'],
      rows: [
        ['Days 1–2', 'Bup 0.5 mg SL q6h for 8 doses'],
        ['Days 3–4', 'Bup 1 mg SL q6h for 8 doses'],
        ['Day 5', 'Bup 8 mg SL TID, or injectable XR bup'],
      ],
    },
    {
      key: 'eightDay',
      label: '8-day (extended)',
      description:
        'An extended ramp for patients needing the slowest up-titration. Extend any schedule by lengthening the dose interval (q4h, q6h, q8h+) and/or increasing the number of doses at each step before advancing.',
      columns: ['Day', 'Bup dosing'],
      rows: [
        ['Day 1', 'Bup 0.5 mg (¼ of 2 mg strip) SL once'],
        ['Day 2', 'Bup 0.5 mg SL BID'],
        ['Day 3', 'Bup 1 mg (½ of 2 mg strip) SL BID'],
        ['Day 4', 'Bup 2 mg SL BID'],
        ['Day 5', 'Bup 3 mg (1½ of 2 mg strip) SL BID'],
        ['Day 6', 'Bup 4 mg SL BID'],
        ['Day 7', 'Bup 6 mg (3 of 2 mg strip) SL BID'],
        ['Day 8', 'Bup 8 mg SL TID, or injectable XR bup'],
      ],
    },
  ],

  altFormulations: {
    title: 'Alternative bup formulations',
    intro:
      'If bup 0.5 mg SL (quartering a 2 mg SL film) is a pharmacy barrier, most patients will tolerate bup 1 mg SL, or use an alternative that approximates a bup 0.5 mg SL dose:',
    columns: ['Formulation', 'Dose ≈ bup 0.5 mg SL'],
    rows: [
      ['Bup IV', '~0.15 mg IV'],
      ['Bup buccal film*', '300 mcg'],
      ['Bup oral (PO)', 'Swallowing a bup 2 mg SL tablet (absorption is variable; estimate 0.5–0.8 mg SL)'],
      ['Bup transdermal patch*', '20 mcg/hr ≈ bup 0.5 mg SL over 24 hrs'],
    ],
    footnote: '* FDA-approved for pain management only.',
  },

  troubleshooting: {
    heading: 'Troubleshooting when pain and withdrawal increase',
    items: [
      {
        problem: 'Is the full-agonist opioid dose too low?',
        action:
          'If a patient displays worsening pain and withdrawal after bup administration, additional full-agonist opioid is the FIRST-LINE treatment. Consider rapid up-titration of the short-acting PRN opioid and increase the scheduled long-acting opioid as indicated.',
      },
      {
        problem: 'Is the rate of bup increase too rapid?',
        action:
          'Bup dosing can be paused for 2–4 hours then restarted, and/or the up-titration can be lengthened to five, eight, or more days by decreasing the bup dose and/or increasing the dose interval.',
      },
      {
        problem: 'Is multimodal analgesia optimized?',
        action:
          'Consider NSAIDs, gabapentinoids, and ketamine. Particularly, ketamine (bolus 0.3 mg/kg IV over 15 minutes, or infusion 0.3–0.5 mg/kg/h) may reduce pain and discomfort.',
      },
      {
        problem: 'Are adjuvant treatments of withdrawal optimized?',
        action:
          'Consider symptom-targeted clonidine 0.1–0.3 mg PO, pramipexole (D2/D3 agonist) 0.25 mg PO, ondansetron 4 mg PO, and/or lorazepam 1–2 mg PO (or equivalent).',
      },
      {
        problem: 'Should high-dose bup be started?',
        action:
          'When severe and/or precipitated withdrawal develops, consider transition to high-dose bup.',
        escalateTo: { protocol: 'quick-start', label: 'Open Bup Quick Start' },
      },
    ],
  },

  infoSections: [
    {
      heading: 'Bup dosing and frequency notes',
      items: [
        'SL film doses are a guide for conversion to your preferred bup formulation.',
        'It is OK to hold doses for sleep — continue dosing when awake.',
        'If nursing capacity limits q3h intervals, increasing to q4h or q6h is generally well tolerated.',
        'Most patients will tolerate 1–2 missed doses per step.',
      ],
    },
  ],
};
