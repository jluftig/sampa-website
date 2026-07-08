// Tool-wide constants for the buprenorphine dosing tool.
// Pure data, zero React imports — this module (like everything in src/lib/bup/)
// must stay framework-agnostic so a future mobile app can reuse it verbatim.
// All non-protocol user-facing copy lives here so a text change never touches JSX.

export const TOOL = {
  key: 'bup',
  name: 'SAMPA Buprenorphine Dosing Tool',
  shortName: 'Bup Tool',
  version: '1.0.0',

  // National Clinician Consultation Center substance use warmline — appears on
  // the source CA Bridge algorithms.
  warmline: {
    label: '1-844-ASK-NCCC',
    tel: '+18442756222',
    blurb:
      'Free clinician-to-clinician consultation on substance use care from the National Clinician Consultation Center.',
  },

  // PLACEHOLDER — final wording pending CA Bridge / Public Health Institute
  // permission for an interactive adaptation (CC BY-NC-ND 4.0 source content).
  // This object is the ONLY place attribution text lives. Do not merge this
  // tool to main until the wording is confirmed.
  attribution: {
    heading: 'Adapted from CA Bridge',
    body:
      'Clinical algorithms adapted from CA Bridge / Bridge Center (Public Health Institute) protocols. CC BY-NC-ND 4.0. Attribution and permission language pending confirmation with CA Bridge.',
  },

  // One-time acceptance gate shown before any tool content (per device).
  disclaimer: {
    badge: 'For clinicians',
    heading: 'Decision support only',
    paragraphs: [
      'This tool is an educational reference for clinicians, adapted from CA Bridge protocols. It does not replace clinical judgment, institutional protocols, or specialist consultation, and it is not a substitute for the full source documents. Verify all doses independently.',
      'Nothing here establishes a provider–patient relationship. For case-specific guidance, call the National Clinician Consultation Center warmline: 1-844-ASK-NCCC.',
      'This tool collects no patient information. Do not enter protected health information.',
    ],
    agreePrefix: 'By continuing you agree to SAMPA’s',
    agreeLinkLabel: 'Terms of Use',
    acceptLabel: 'I understand — continue',
  },
};
