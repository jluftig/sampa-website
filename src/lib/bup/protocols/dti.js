// Direct-to-Inject (DTI) Buprenorphine — weekly long-acting injectable XR bup
// without a sublingual lead-in.
// Transcribed from the CA Bridge / Bridge Center PDF "Emergency Department
// Direct-to-Inject (DTI) Buprenorphine" (May 2026, 4 pages: standard practice,
// emerging practice in no/low withdrawal, routes to monthly, adjuncts +
// formulations).

export const DTI = {
  key: 'dti',
  slug: 'dti',
  title: 'Direct-to-Inject (DTI) Buprenorphine',
  shortTitle: 'DTI',
  audience: 'ED and clinic',
  blurb: 'Weekly XR bup injection without a sublingual lead-in.',
  version: '1.0.0',
  source: {
    title: 'CA Bridge / Bridge Center — Emergency Department Direct-to-Inject (DTI) Buprenorphine',
    revised: 'May 2026',
    url: null, // public CA Bridge PDF URL — confirm before launch
  },
  intro:
    'Initiates weekly long-acting injectable buprenorphine (XR bup) without a sublingual lead-in for patients with OUD. COWS and time since last opioid use determine readiness for XR bup dosing.',

  eligibility: {
    heading: 'Before dosing',
    criteria: [
      'The only absolute contraindication is a true buprenorphine allergy, which is exceedingly rare.',
      'DTI bup is OK in pregnancy and breastfeeding.',
      'Starting bup may be delayed or modified with complicating factors: altered mental status, delirium, or intoxication; long-term methadone maintenance.',
    ],
  },

  flow: {
    start: 'q_interested',
    steps: {
      q_interested: {
        kind: 'question',
        prompt: 'OUD and interested in long-acting injectable bup?',
        options: [
          { value: 'yes', label: 'Yes — wants the injectable', next: 'q_cows' },
          { value: 'no', label: 'No — prefers SL', next: 'note_sl' },
        ],
      },

      note_sl: {
        kind: 'checklist',
        title: 'Use an SL bup protocol instead',
        items: [
          'Moderate–severe withdrawal (COWS ≥ 8 + 2 objective signs): high-dose start per Bup Quick Start.',
          'No or minimal withdrawal, being admitted: Bup Low Dose with Opioid Continuation (Inpatient).',
        ],
        linkTo: { to: '/tools/bup', label: 'Back to the protocol chooser' },
      },

      q_cows: {
        kind: 'question',
        prompt: 'COWS ≥ 4 AND last opioid use > 6 hours ago?',
        options: [
          { value: 'yes', label: 'Yes — both', next: 'dose24' },
          { value: 'no', label: 'No — COWS < 4 (no or low withdrawal)', next: 'q_emerging' },
        ],
      },

      dose24: {
        kind: 'dose',
        label: 'XR bup — weekly',
        dose: 'XR bup 24 mg weekly',
        detail: 'The recommended starting protocol for most EDs and new programs.',
        next: 'discharge',
      },

      q_emerging: {
        kind: 'question',
        prompt: 'COWS < 4 — choose an approach.',
        help: 'Dosing XR bup in no or low withdrawal is an emerging practice for ED and clinic settings.',
        options: [
          {
            value: 'emerging',
            label: 'Emerging practice: XR bup 8 mg weekly (first dose in no/low withdrawal)',
            next: 'dose8',
          },
          {
            value: 'sl',
            label: 'Use an established SL pathway instead',
            next: 'note_sl',
          },
        ],
      },

      dose8: {
        kind: 'dose',
        label: 'XR bup — weekly · emerging practice',
        dose: 'XR bup 8 mg weekly',
        next: 'discharge',
      },

      discharge: {
        kind: 'checklist',
        title: 'Discharge with return precautions',
        items: [
          'Follow up with outpatient within 3–5 days for the next dose. XR bup requires the same timely follow-up engagement and ongoing support after discharge as other formulations.',
          'Reassure patients that plasma levels will continue to rise for 24 hours.',
          'Consider avoiding supplemental SL bup in the first 24 hours to decrease the risk of precipitated withdrawal.',
          'If breakthrough withdrawal symptoms persist after 24 hours, consider SL bup 8 mg TID PRN.',
        ],
      },
    },
  },

  returnPrecautions: {
    heading: 'Return precautions (review with the patient)',
    items: [
      'Overshoot: sedation, nausea, headache.',
      'Undershoot: progressing or under-treated withdrawal.',
      'Buprenorphine-induced (precipitated) withdrawal.',
      'Injection site: a bump is OK; red, warm, or tender is not OK.',
    ],
  },

  monthlyRoutes: {
    heading: 'Routes to XR bup monthly (emerging practice)',
    intro:
      'Supports patients who receive their 1st dose in the ED or clinic and their 2nd dose in a clinic setting.',
    columns: ['First dose', 'Interval', 'Then'],
    rows: [
      ['XR bup 24 mg weekly injection', '1–5 days', 'XR bup 128 mg OR 300 mg monthly injection'],
      ['XR bup 8 mg weekly injection', '1–3 days', 'XR bup 128 mg OR 300 mg monthly injection'],
    ],
  },

  formulations: {
    heading: 'Available formulations of long-acting injectable bup (XR bup)',
    columns: ['Formulation', 'US brand', 'Doses', 'Tmax', 'Mean half-life'],
    rows: [
      ['XR bup weekly (50 mg/mL)', 'Brixadi Weekly', '8, 16, 24, 32 mg (pre-filled syringe)', '24 h', '5 d'],
      ['XR bup monthly (356 mg/mL)', 'Brixadi Monthly', '64, 96, 128 mg (pre-filled syringe)', '6–10 h', '19–25 d'],
      ['XR bup monthly (200 mg/mL)', 'Sublocade', '300 mg, 100 mg (pre-filled syringe)', '24 h', '45–60 d'],
    ],
  },

  precipitated: {
    title: 'Bup-precipitated withdrawal (abrupt COWS increase of > 5)',
    intro:
      'Sudden, severe worsening of withdrawal symptoms soon after bup administration. Manage per the Quick Start precipitated-withdrawal arm:',
    items: [
      'Bup 16 mg SL AND lorazepam 2 mg PO; reassess q30 minutes and repeat bup 16 mg SL.',
      'Escalate with monitoring: ketamine 0.3 mg/kg IV slow push q15 minutes and/or infusion, or fentanyl 200 mcg IV q10 minutes.',
      'For refractory precipitated withdrawal not responding to bup / fentanyl / ketamine, consider dexmedetomidine — typically higher dosing, e.g., starting at 1–1.5 mcg/kg/hr and titrating up as needed.',
    ],
    linkTo: { protocol: 'quick-start', label: 'Open the Quick Start rescue arm' },
  },

  outpatientAdjuncts: {
    heading: 'Symptom-targeted treatments for breakthrough withdrawal during XR initiation',
    groups: [
      {
        group: 'Restlessness, sweating, tachycardia',
        items: [
          'Clonidine 0.1–0.3 mg q6–8h PRN sweating/racing heart/chills/hot flashes/anxiety, #28 (onset 30–60 min)',
          'Lofexidine 0.18 mg 3–4 tabs q6h PRN sweating/chills/anxiety, #112 (onset 30–60 min)',
          'Tizanidine 4 mg q6h PRN muscle aches/restlessness/anxiety, #28 (onset 30–60 min)',
          'Guanfacine ER 4 mg daily PRN anxiety/restlessness/sweating, #7 (onset 2–4 hrs)',
          'Ketamine 16 mg troche (or 16 mg/mL syrup) 8–16 mg SL q8–12h PRN withdrawal symptoms, max 48 mg/day, #8 troches (or 8 mL)',
        ],
      },
      {
        group: 'Nausea / vomiting',
        items: [
          'Ondansetron 4 mg 1–2 ODT q6h PRN nausea/vomiting, max 6 tabs/24h, #28',
          'Metoclopramide 5 mg 1–2 PO q6h PRN nausea/vomiting, max 9 tabs/24h, #42',
        ],
      },
      {
        group: 'Diarrhea',
        items: [
          'Loperamide 2 mg q8h PRN diarrhea, #21',
          'Dicyclomine 10 mg 1–2 q6h PRN diarrhea/abdominal cramping, #40',
        ],
      },
      {
        group: 'General anxiety',
        items: [
          'Gabapentin 600–800 mg q8h PRN anxiety, #21',
          'Baclofen 10 mg q8h PRN muscle cramps, #21',
          'Hydroxyzine 25 mg 1–2 q6h PRN anxiety/agitation/insomnia, #50',
        ],
      },
      {
        group: 'Insomnia',
        items: [
          'Quetiapine 50 mg q8h PRN anxiety/insomnia, #21',
          'Trazodone 50–100 mg qHS PRN insomnia, #20',
        ],
      },
      {
        group: 'Pain, muscle aches',
        items: [
          'Ibuprofen 400 mg 1–2 q6h PRN pain, #40',
          'Acetaminophen 500 mg 1–2 q6h PRN pain, #40',
        ],
      },
      {
        group: 'Restlessness',
        items: ['Pramipexole 0.25 mg 1–2 q8h PRN restless legs, #21'],
      },
    ],
  },
};
