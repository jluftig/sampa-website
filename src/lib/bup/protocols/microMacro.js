// 1-Day Micro–Macro Start — ED / discharge pathway for patients in low or no
// withdrawal who need a micro lead-in, then a planned high-dose (macro) jump
// once moderate–severe withdrawal develops.
//
// Source: CA Bridge site example "Starting Buprenorphine with Microdosing and
// Cross Tapering" (June 2025) — ZSFG / Highland examples. Bridge labels this
// as independent site practice, not a formally recommended best-practice
// algorithm. Resource page + PDF:
//   https://bridgetotreatment.org/resource/starting-buprenorphine-with-microdosing-and-cross-tapering/
//   https://bridgetotreatment.org/wp-content/uploads/CA_BRIDGE_SITE-EXAMPLE_Starting-Buprenorphine-with-Microdosing-and-Cross-Tapering_June_2025.pdf
//
// Scope (SAMPA): only the 1-Day Micro–Macro arm is encoded here. The PDF's
// 3-day and 7-day SL cross-tapers that CONTINUE full agonists are NOT a
// discharge pathway in this tool — full-agonist continuation for OUD stays
// on the inpatient Low Dose protocol (see guardrail 1 in the project brief).
//
// Also the escape hatch when Low Dose was started for a planned admission
// and disposition flips to discharge — cannot send home on full-agonist
// continuation.

export const MICRO_MACRO = {
  key: 'micro-macro',
  slug: 'micro-macro',
  title: '1-Day Micro–Macro Start',
  shortTitle: 'Micro–Macro',
  audience: 'ED and discharge (including conversion from aborted admission)',
  blurb:
    'Micro-dose lead-in without waiting for withdrawal, then 16 mg SL once moderate–severe withdrawal develops.',
  version: '1.0.0',
  source: {
    title:
      'CA Bridge site example — Starting Buprenorphine with Microdosing and Cross Tapering (1-Day Micro–Macro Start)',
    revised: 'June 2025',
    url: 'https://bridgetotreatment.org/resource/starting-buprenorphine-with-microdosing-and-cross-tapering/',
  },
  intro:
    'For patients with low or no withdrawal who will leave acute care before they are ready for a standard high-dose start. Start a very low (micro) bup dose now without waiting for withdrawal; when moderate–severe withdrawal develops, give a single 16 mg SL (macro) dose. Preferred micro: two 20 mcg/hr transdermal patches. Also the conversion path when Low Dose with Opioid Continuation was started for admission and the plan changes to discharge.',

  guardrail:
    'Not an inpatient full-agonist continuation plan. If the patient is being admitted and needs full-agonist opioids continued, use Low Dose with Opioid Continuation instead. Never discharge a patient on a prescribed full-agonist regimen for OUD. Site-example content (June 2025) — verify doses against institutional protocols and clinical judgment.',

  // Shown when opened from Low Dose with ?from=low-dose
  conversionBanner: {
    title: 'Converting from Low Dose — admission cancelled / discharge planned',
    body:
      'You cannot continue Low Dose with Opioid Continuation as an outpatient plan. Stop full-agonist continuation for home use, keep or start a micro bup lead-in, and complete Micro–Macro (macro 16 mg SL when moderate–severe withdrawal develops). Document the disposition change in the chart.',
  },

  eligibility: {
    heading: 'When to consider Micro–Macro',
    criteria: [
      'ED (or other acute care) with anticipated discharge, and the patient is not yet in moderate–severe withdrawal.',
      'Patient wants sublingual bup and declines (or is not a candidate for) long-acting injectable at this visit.',
      'Prior difficulty starting bup, daily fentanyl use where a slower lead-in is preferred, or shared decision for microdosing over a same-day high-dose start.',
      'Escape hatch: Low Dose with Opioid Continuation was started because admission was planned, and the plan has changed to discharge.',
    ],
  },

  avoid: {
    heading: 'When to avoid or choose another pathway',
    items: [
      'Already in significant withdrawal (COWS ≥ 8 with objective signs) — use Quick Start (or take the macro 16 mg SL now if micro lead-in is already in place).',
      'Patient prefers a rapid high-dose start and meets withdrawal criteria — Quick Start.',
      'Wants long-acting injectable — DTI pathway.',
      'Being admitted with ongoing full-agonist needs — Low Dose with Opioid Continuation (inpatient).',
      'Difficulties with health literacy, medication adherence, or inability to self-dose frequently enough (e.g., some carceral or housing settings) — prefer observed Quick Start or true admission when feasible.',
      'Most patients still benefit from routine higher-dose starts when withdrawal criteria are met; microdosing can delay induction to a therapeutic dose.',
    ],
  },

  flow: {
    start: 'q_context',
    steps: {
      q_context: {
        kind: 'question',
        cowsHint: true,
        prompt: 'What best describes this patient right now?',
        options: [
          {
            value: 'deNovo',
            label: 'Low or no withdrawal — starting Micro–Macro for ED / discharge',
            next: 'q_patches',
          },
          {
            value: 'conversion',
            label:
              'Was starting (or on) Low Dose for a planned admission — plan changed to discharge',
            next: 'conversion_steps',
          },
          {
            value: 'alreadySick',
            label:
              'Already moderate–severe withdrawal (COWS ≥ 8 or patient severity ≥ 7/10) — ready for macro dose',
            next: 'macro16',
          },
        ],
      },

      conversion_steps: {
        kind: 'checklist',
        title: 'Conversion from Low Dose — before Micro–Macro',
        items: [
          'Stop the inpatient full-agonist continuation plan for home use. Do not prescribe full agonists outpatient for OUD.',
          'Do not send the patient home on the multi-day Low Dose ramp.',
          'If micro bup is already running (e.g., Day 1 0.5 mg SL q3h, or a 20 mcg/hr patch), continue that micro occupancy — do not restart from zero unnecessarily.',
          'If the patient is already in moderate–severe withdrawal, skip further waiting and give the macro 16 mg SL now (or open Quick Start).',
          'Chart: converted from Low Dose with Opioid Continuation due to discharge instead of admission.',
        ],
        next: 'q_patches',
      },

      q_patches: {
        kind: 'question',
        prompt: 'Are 20 mcg/hr transdermal buprenorphine patches available?',
        help: 'Preferred micro lead-in when patches are on formulary. Non-SL formulations are often labeled for pain only — follow institutional rules.',
        options: [
          { value: 'yes', label: 'Yes — patches available', next: 'patch_arm' },
          { value: 'no', label: 'No — patches not available', next: 'no_patch_arm' },
        ],
      },

      patch_arm: {
        kind: 'dose',
        label: 'Micro lead-in (preferred)',
        dose: 'Place 2 × 20 mcg/hr transdermal buprenorphine patches',
        detail:
          'Do not wait for withdrawal. Prescribe buprenorphine 8 mg SL film/tablet as needed. Keep patches on while waiting for moderate–severe withdrawal.',
        next: 'wait_criteria',
      },

      no_patch_arm: {
        kind: 'checklist',
        title: 'Micro lead-in without patches',
        items: [
          'Stop full opioids (no outpatient full-agonist continuation for OUD).',
          'Do not wait for withdrawal before starting micro bup.',
          'Start a very low dose of buprenorphine — choose one arm below.',
          '0.5 mg (¼ of a 2 mg strip) SL buprenorphine q3 hours (~4 mg total daily dose), OR',
          'Swallow 2 mg SL buprenorphine q3 hours (~6 mg total daily dose) if cutting films is not feasible.',
        ],
        next: 'wait_criteria',
      },

      wait_criteria: {
        kind: 'checklist',
        title: 'Wait until moderate–severe withdrawal',
        items: [
          'Target: patient reports feeling sick from withdrawals — COWS ≥ 8, or ≥ 7/10 severity by patient report.',
          'Timing is often 6–12 hours, but can be much longer depending on the person and the opioids used.',
          'Some patients may wait 24–72 hours (especially after fentanyl).',
          'Patient should stay abstinent from full agonists and keep microdosing — patches on, or continue swallowing/taking micro SL q3h — until they feel sick from withdrawal.',
        ],
        next: 'q_disposition',
      },

      q_disposition: {
        kind: 'question',
        cowsHint: true,
        prompt: 'Where is the patient in this process?',
        options: [
          {
            value: 'sickInEd',
            label: 'Still in the ED / facility and now meets moderate–severe withdrawal',
            next: 'macro16',
          },
          {
            value: 'discharging',
            label: 'Discharging now — will complete macro at home when sick enough',
            next: 'discharge_home',
          },
          {
            value: 'stillWaiting',
            label: 'Still waiting — not yet sick enough (remain micro-dosing)',
            next: 'keep_micro',
          },
        ],
      },

      keep_micro: {
        kind: 'note',
        text:
          'Continue micro lead-in (patches or micro SL). Reassess; when COWS ≥ 8 or severity ≥ 7/10, give 16 mg SL in one dose. If discharging before then, use the home-completion discharge bundle.',
        next: 'q_disposition',
      },

      macro16: {
        kind: 'dose',
        label: 'Macro dose',
        dose: 'Buprenorphine 16 mg SL in one dose',
        detail:
          'Once withdrawal has become intolerable (COWS ≥ 8 or patient severity ≥ 7/10). If precipitated or severe symptoms after dosing, manage as in Quick Start rescue and call the warmline as needed.',
        next: 'discharge_after_macro',
      },

      discharge_after_macro: {
        kind: 'checklist',
        title: 'After macro dose — discharge / linkage',
        items: [
          'Observe until clinically stable if still in the facility.',
          'Discharge Rx for ongoing bup (typical maintenance target ≥ 16 mg/day; ≥ 2-week supply when possible).',
          'Naloxone in hand; adjuncts for residual symptoms as indicated (e.g., clonidine).',
          'Link to ongoing care; return precautions for oversedation, withdrawal, or distress.',
        ],
        linkTo: { protocol: 'quick-start', label: 'Open Quick Start (if more high-dose titration needed)' },
      },

      discharge_home: {
        kind: 'checklist',
        title: 'Discharge — home Micro–Macro completion',
        items: [
          'Continue micro lead-in at home (patches on, or micro SL / swallowed 2 mg q3h as started).',
          'When moderate–severe withdrawal develops (feel very sick; COWS ≥ 8 or ≥ 7/10), take 16 mg SL bup in one dose.',
          'Prescribe bup for micro continuation and the planned macro / maintenance doses; adjunct Rx (e.g., clonidine) as appropriate.',
          'Naloxone in hand; return precautions and linkage to ongoing care.',
          'Give the Buprenorphine Self-Start patient handout (and reinforce the micro → macro plan in plain language).',
        ],
        linkTo: { protocol: 'self-start', label: 'Open the Self-Start patient handout' },
      },
    },
  },

  pharmacyNotes: {
    heading: 'Pharmacy notes',
    items: [
      'Choose a micro arm based on formulary and whether films may be cut.',
      'Non-sublingual / transdermal products may only be orderable under a pain indication at some sites.',
      'Rough equivalence: 20 mcg/hr patch is less than 1 mg SL buprenorphine over 24 hours; two 20 mcg/hr patches approximate a low micro lead-in.',
      'Alternative approximations to ~0.5 mg SL used elsewhere: buccal ~225–300 mcg; swallowing a 2 mg SL tablet has variable absorption.',
    ],
  },

  infoSections: [
    {
      heading: 'Relationship to other protocols',
      items: [
        'Quick Start: use when the patient already meets moderate–severe withdrawal criteria for a same-visit high-dose start.',
        'Low Dose with Opioid Continuation: inpatient only, full agonists continued and maximized — never a discharge plan. If admission is cancelled, convert here (Micro–Macro).',
        'Self-Start: patient-facing handout for completing a start outside the hospital; attach it to the Micro–Macro discharge bundle.',
        'DTI: for patients who want long-acting injectable instead of an SL micro–macro plan.',
      ],
    },
    {
      heading: 'Source framing',
      items: [
        'Adapted from a CA Bridge site example (June 2025) sharing practices used at selected hospitals. Bridge notes it is not formally recommending these as best practices.',
        'In most cases, routine higher-dose protocols are preferable when the patient is ready; microdosing is for limited circumstances.',
        'Avoid prolonged microdosing — underdosing bup and delaying a therapeutic dose increases treatment-failure risk.',
      ],
    },
  ],
};
