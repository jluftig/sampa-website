// Buprenorphine Self-Start — PATIENT-FACING handout: guidance for patients
// starting buprenorphine outside of hospitals or clinics.
// Transcribed from the CA Bridge patient material "Buprenorphine Self-Start"
// (rev. 12.1.25). Plain patient language throughout — this page is the
// deliberate exception to the tool's clinician-language rule.

export const SELF_START = {
  key: 'self-start',
  slug: 'self-start',
  title: 'Buprenorphine Self-Start',
  shortTitle: 'Self-Start',
  audience: 'Patient handout',
  blurb: 'Guidance for patients starting buprenorphine outside of hospitals or clinics.',
  patientFacing: true,
  version: '1.0.0',
  source: {
    title: 'CA Bridge patient material — Buprenorphine Self-Start',
    revised: 'December 2025',
    url: null, // public CA Bridge PDF URL — confirm before launch
  },
  intro: 'Guidance for patients starting buprenorphine outside of hospitals or clinics.',

  steps: [
    'Plan to take a day off and have a place to rest.',
    'Stop using and wait until you feel very sick from withdrawals (at least 12 hours is best; if using fentanyl it may take a few days).',
    'Dose one or two 8 mg tablets or strips UNDER your tongue (total dose of 8–16 mg).',
    'Repeat dose (another 8–16 mg) in an hour to feel well.',
    'The next day, take 16–32 mg (2–4 tablets or films) at one time.',
  ],
  stepsFootnote: 'Place each dose under your tongue (sublingual) and let it dissolve.',

  sections: [
    {
      heading: 'If you have started bup before:',
      items: [
        'If it went well, that’s great! Just do that again.',
        'If it was difficult, talk with your care team to figure out what happened and find ways to make it better this time. You may need a different dosing plan than what is listed here.',
      ],
    },
    {
      heading: 'If you have never started bup before:',
      items: [
        'Gather your support team and if possible take a “day off.”',
        'You are going to want space to rest. Don’t drive.',
        'Using cocaine, meth, alcohol, or pills makes starting bup harder — and mixing in alcohol or benzos can be dangerous.',
      ],
    },
    {
      heading: 'If you use a small amount: (for example, 5 “Norco 10’s” a day)',
      items: [
        'Consider a low dose: start with 4 mg and stop at 8 mg total.',
        'WARNING: Withdrawal will continue if you don’t take enough bup.',
      ],
    },
    {
      heading:
        'If you use a medium to large amount: (for example, injecting 2 g heroin a day or smoking 1 g fentanyl a day)',
      items: [
        'Consider a high dose: start with a first dose of 16 mg.',
        'The effects of bup max out at around 24–32 mg.',
        'WARNING: Too much bup can make you feel sick and sleepy.',
      ],
    },
  ],

  help: {
    banner: 'Not going well? Have questions? Contact your Substance Use Navigator for help!',
    fillIn: 'Call or text your Substance Use Navigator for help at',
  },
};
