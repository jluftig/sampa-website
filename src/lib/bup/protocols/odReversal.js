// Starting Buprenorphine Immediately After Reversal of Opioid Overdose with
// Naloxone ("ODNaloxoneBup").
// Transcribed from the CA Bridge PDF of the same name (January 2026, incl.
// explainer pages). Based on Herring et al. 2019, Am J Emerg Med.

export const OD_REVERSAL = {
  key: 'od-reversal',
  slug: 'od-reversal',
  title: 'Starting Buprenorphine Immediately After Reversal of Opioid Overdose with Naloxone',
  shortTitle: 'After OD Reversal',
  audience: 'ED',
  blurb: 'Rapid bup initiation right after a short-acting opioid overdose is reversed.',
  version: '1.0.0',
  source: {
    title:
      'CA Bridge — Starting Buprenorphine Immediately After Reversal of Opioid Overdose with Naloxone',
    revised: 'January 2026',
    url: null, // public CA Bridge PDF URL — confirm before launch
  },
  intro:
    'For heroin or fentanyl (or other short-acting opioid) overdose reversed with naloxone. Based on Herring et al. (2019), rapid induction onto sublingual buprenorphine after opioid overdose with successful linkage to treatment.',

  flow: {
    start: 'exclusions',
    steps: {
      exclusions: {
        kind: 'multiselect',
        prompt: 'Are any patient exclusion criteria present?',
        options: [
          { value: 'sedative', label: 'Benzodiazepine, other sedative, or intoxicant suspected' },
          {
            value: 'ams',
            label: 'Altered mental status, depressed level of consciousness, or delirium',
          },
          {
            value: 'consent',
            label: 'Unable to comprehend potential risks and benefits for any reason',
          },
          {
            value: 'illness',
            label:
              'Severe medical illness present or suspected, such as sepsis, respiratory distress, or organ failure',
          },
          { value: 'methadone', label: 'Report of methadone use' },
          {
            value: 'notCandidate',
            label: 'Not a candidate for buprenorphine maintenance treatment for any reason',
          },
        ],
        noneLabel: 'No to all',
        anyNext: 'supportive',
        noneNext: 'q_awake',
      },

      q_awake: {
        kind: 'question',
        prompt: 'Is the patient awake with signs of opioid withdrawal (i.e., COWS > 4)?',
        options: [
          { value: 'yes', label: 'Yes', next: 'q_agreeable' },
          { value: 'no', label: 'No', next: 'supportive' },
        ],
      },

      q_agreeable: {
        kind: 'question',
        prompt: 'Is the patient agreeable to treatment with buprenorphine?',
        options: [
          { value: 'yes', label: 'Yes', next: 'dose16' },
          { value: 'no', label: 'No', next: 'supportive' },
        ],
      },

      supportive: {
        kind: 'checklist',
        title: 'Provide supportive care, observe, and re-evaluate',
        items: [
          'Manage the underlying issue (co-ingestion, medical illness, mental status).',
          'Re-evaluate readiness for buprenorphine as the clinical picture evolves.',
          'Patients on methadone should be supported to continue methadone treatment — overdose is not an indication to switch to buprenorphine, and switching may disrupt care.',
        ],
      },

      dose16: {
        kind: 'dose',
        label: 'Buprenorphine',
        dose: '16 mg SL buprenorphine',
        detail:
          'Administered as a single dose or in divided doses over 1–2 hours. Start with 0.3 mg IV if unable to tolerate SL.',
        next: 'observe',
      },

      observe: {
        kind: 'checklist',
        title: 'Observe in the ED (typically 2 hours)',
        items: [
          'Observe until the patient shows no clinical signs of excessive sedation or withdrawal.',
          'OK to administer additional doses of bup, up to 32 mg total.',
          'Engage, use motivational interviewing, and link to ongoing care.',
        ],
      },
    },
  },

  bePrepared: {
    title: 'Be prepared — two “worst case” adverse events',
    intro:
      'Neither has been reported with this protocol to date, but any ED should be prepared to manage both:',
    items: [
      'Additive sedation with respiratory depression: reverse buprenorphine with high-dose naloxone (2–3 mg IV push followed by a 4 mg/hr infusion).',
      'Precipitated withdrawal: treat with an empirically titrated multimodal approach — benzodiazepines, alpha-2 agonists (clonidine, dexmedetomidine, lofexidine), high-affinity full-agonist opioids (hydromorphone), ketamine, and dopamine antagonists (e.g., metoclopramide or haloperidol).',
    ],
  },

  infoSections: [
    {
      heading: 'Why this works',
      items: [
        'After naloxone reverses an overdose, buprenorphine (with ~6-fold higher mu-opioid receptor affinity than naloxone) displaces naloxone and is experienced as stabilization or withdrawal relief.',
        'Once bound, buprenorphine’s high-affinity, longer-acting receptor occupancy helps prevent return of full-agonist toxicity even if high concentrations of the overdose opioid remain in circulation.',
      ],
    },
  ],
};
