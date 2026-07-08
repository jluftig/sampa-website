// The meta-algorithm: which buprenorphine start protocol fits this patient?
// Decision logic and wording follow the reviewed CA Bridge chooser draft
// (approved by SAMPA clinical review) — see docs/bup-dosing-tool-brief.md.
// A content revision here is a data edit + version bump; no component changes.
//
// Terminology guardrail: a discharge that comes too soon is always "imminent
// discharge" — never the p-adverb clinicians confuse with precipitated
// withdrawal (see docs/bup-dosing-tool-brief.md guardrail 3).

import { evaluateFlow } from './flow';

export const CHOOSER = {
  version: '1.0.0',
  revisedDate: '2026-07',
  entry: 'Patient with opioid use disorder, candidate for and interested in buprenorphine.',
  start: 'odReversed',
  nodes: {
    odReversed: {
      kind: 'question',
      prompt: 'Opioid overdose just reversed with naloxone?',
      options: [
        { value: 'yes', label: 'Yes', next: 'out_odReversal' },
        { value: 'no', label: 'No', next: 'setting' },
      ],
    },

    setting: {
      kind: 'question',
      prompt: 'What setting is the patient in?',
      options: [
        { value: 'ed', label: 'Emergency department — anticipated discharge', next: 'edAdmitted' },
        { value: 'inpatient', label: 'Inpatient / being admitted', next: 'inptBackup' },
      ],
    },

    edAdmitted: {
      kind: 'question',
      prompt: 'Is the patient being admitted to the hospital?',
      options: [
        { value: 'yes', label: 'Yes — being admitted', next: 'out_lowDoseHandoff' },
        { value: 'no', label: 'No — discharge anticipated', next: 'cows' },
      ],
    },

    cows: {
      kind: 'question',
      cowsHint: true, // surfaces the optional COWS calculator + latest recorded score
      prompt: 'Assess withdrawal severity — COWS score?',
      options: [
        {
          value: 'severe',
          label: 'COWS ≥ 8 with ≥ 2 objective signs (moderate–severe withdrawal)',
          next: 'out_quickStart',
        },
        {
          value: 'moderate',
          label: 'COWS 4–7 and last opioid use > 6 hours ago',
          next: 'injMod',
        },
        {
          value: 'minimal',
          label: 'COWS < 4 — no or minimal withdrawal',
          next: 'injMin',
        },
      ],
    },

    injMod: {
      kind: 'question',
      prompt: 'Does the patient want a long-acting injectable?',
      options: [
        { value: 'yes', label: 'Yes — wants injectable', next: 'out_dti24' },
        { value: 'no', label: 'No — prefers SL / declines injection', next: 'out_edModDual' },
      ],
    },

    injMin: {
      kind: 'question',
      prompt: 'Does the patient want a long-acting injectable?',
      options: [
        { value: 'yes', label: 'Yes — wants injectable', next: 'out_dti8' },
        { value: 'no', label: 'No — prefers SL / declines injection', next: 'out_microMacro' },
      ],
    },

    inptBackup: {
      kind: 'multiselect',
      prompt: 'Do any of the following apply?',
      help: 'If none apply, Low Dose with Opioid Continuation is the default for most admitted patients.',
      options: [
        {
          value: 'precipitated',
          label: 'Bup-precipitated withdrawal developed during the low-dose ramp',
        },
        {
          value: 'imminentDischarge',
          label: 'Imminent discharge — not enough hospital days left for the ~3-day ramp (e.g., OUD identified late in the stay)',
        },
        {
          value: 'severeWithdrawal',
          label: 'Already in severe withdrawal (COWS ≥ 8) when OUD identified, no full agonist on board',
        },
        {
          value: 'preference',
          label: 'Patient preference — wants the fastest route to a therapeutic dose, or declines full-agonist continuation',
        },
        {
          value: 'amaRisk',
          label: 'High risk of self-directed (AMA) discharge',
        },
        {
          value: 'agonistNotFeasible',
          label: 'Full-agonist opioids not feasible — institutional, pharmacy, or clinician barriers, or the ramp is repeatedly interrupted (NPO, procedures, missed doses)',
        },
      ],
      noneLabel: 'None of these apply',
      anyNext: 'out_quickStartInpt',
      noneNext: 'out_lowDose',
    },

    // ------------------------------------------------------------------
    // Outcomes. `outcomeKey` is the stable analytics identifier; `protocol`
    // is the slug of the dosing screen the outcome links to.
    // ------------------------------------------------------------------

    out_odReversal: {
      kind: 'outcome',
      outcomeKey: 'od-reversal',
      protocol: 'od-reversal',
      badge: 'Use algorithm',
      title: 'Starting Buprenorphine Immediately After Reversal of Opioid Overdose with Naloxone',
      notes: [
        'Awake, COWS > 4, no exclusion criteria (sedative co-ingestion, altered mental status, severe illness, methadone use) → 16 mg SL bup, observe ~2 hours.',
      ],
    },

    out_lowDoseHandoff: {
      kind: 'outcome',
      outcomeKey: 'ed-lowdose-handoff',
      protocol: 'low-dose',
      badge: 'Use algorithm',
      title: 'Start Bup Low Dose with Opioid Continuation (Inpatient) in the ED',
      notes: [
        'Begin the protocol in the ED and hand off to the admitting team.',
        'This is an inpatient-only pathway — never a discharge plan. Full-agonist opioids cannot be prescribed for outpatient use in OUD.',
      ],
    },

    out_quickStart: {
      kind: 'outcome',
      outcomeKey: 'ed-quick-start',
      protocol: 'quick-start',
      badge: 'Use algorithm',
      title: 'Buprenorphine (Bup) Quick Start',
      headline: '16 mg SL (range 8–24+ mg)',
      notes: [
        'High-dose SL start. May add XR bup (DTI) after SL stabilization if the patient wants a long-acting injectable.',
      ],
    },

    out_dti24: {
      kind: 'outcome',
      outcomeKey: 'ed-dti-24',
      protocol: 'dti',
      badge: 'Use algorithm',
      title: 'Direct-to-Inject (DTI) Buprenorphine',
      headline: 'XR bup 24 mg weekly',
      notes: ['No SL lead-in.'],
    },

    out_edModDual: {
      kind: 'outcome',
      outcomeKey: 'ed-cows4-7-both-valid',
      variant: 'dual',
      badge: 'Both options are appropriate',
      title: 'Decide with the patient',
      dualOptions: [
        {
          protocol: 'quick-start',
          title: 'Adjuncts, then Quick Start when severe',
          summary:
            'Treat symptoms with adjuncts (e.g., clonidine) and use Quick Start if COWS reaches ≥ 8 before discharge.',
        },
        {
          protocol: 'self-start',
          title: 'Micro-dose + Self-Start discharge plan',
          summary:
            'Micro-dose bup in the ED, prescribe adjuncts + bup, and discharge with the Buprenorphine Self-Start patient handout.',
        },
      ],
    },

    out_dti8: {
      kind: 'outcome',
      outcomeKey: 'ed-dti-8',
      protocol: 'dti',
      badge: 'Use algorithm — emerging practice',
      title: 'DTI Buprenorphine — Emerging Practice (first dose in no/low withdrawal)',
      headline: 'XR bup 8 mg weekly',
    },

    out_microMacro: {
      kind: 'outcome',
      outcomeKey: 'ed-micro-macro',
      protocol: 'self-start',
      badge: 'Micro-dose + Self-Start',
      title: 'Micro-dose bup in the ED → home Quick Start',
      checklist: [
        'Micro-dose bup in the ED',
        'Adjunct Rx (e.g., clonidine)',
        'Bup discharge Rx',
        'Buprenorphine Self-Start patient handout',
      ],
      notes: [
        'The patient does their own quick start at home once in severe withdrawal (typically the next morning).',
      ],
    },

    out_quickStartInpt: {
      kind: 'outcome',
      outcomeKey: 'inpt-quick-start',
      protocol: 'quick-start',
      badge: 'Backup — use algorithm',
      title: 'Buprenorphine (Bup) Quick Start',
      notes: [
        'High-dose SL start once withdrawal is at least moderate–severe (COWS ≥ 8 with 2 objective signs).',
      ],
    },

    out_lowDose: {
      kind: 'outcome',
      outcomeKey: 'inpt-low-dose',
      protocol: 'low-dose',
      badge: 'Default for most admitted patients',
      title: 'Bup Low Dose with Opioid Continuation (Inpatient)',
      notes: [
        'Preferred inpatient strategy, especially with acute pain or ongoing full-agonist analgesic needs. Three-day low-dose bup ramp with full-agonist opioids continued throughout; no need to wait for withdrawal.',
      ],
    },
  },
};

// answers: map of nodeId → value (string, or string[] for the multiselect).
// Returns { path, currentNodeId, outcome, complete } — see flow.js.
export function evaluateChooser(answers) {
  return evaluateFlow(CHOOSER, answers);
}
