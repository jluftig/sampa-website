# Buprenorphine Dosing Tool — Project Brief (Handoff)

Written 2026-07-07 by Claude Code from the "Algorithm Choice Algorithm" session, as the
clinical-content handoff for building a new section of the SAMPA site. An agent picking
this up should read this file fully before entering plan mode — it contains the decision
logic and dosing content the tool must encode, plus firm clinical guardrails from Josh.

## The product

An interactive clinical decision-support tool that helps ED and inpatient clinicians
choose a buprenorphine (bup) start strategy and dose it correctly. Modeled on the
interaction pattern of MD-Calc (e.g., https://www.mdcalc.com/calc/104/centor-score-modified-mcisaac-strep-pharyngitis)
— tap-through clinical inputs with an always-visible running result — because clinicians
already know that pattern. Visually it must NOT read as an MD-Calc clone; it should sit
inside SAMPA's existing design language (Tailwind, existing components).

- **Phase 1:** a section of this website (new route(s) in the SPA).
- **Later:** iOS app, then Android. → Architectural implication: keep ALL clinical logic
  (the decision tree, dose schedules, thresholds, copy) in plain framework-agnostic
  TypeScript/JS modules + JSON-like data structures, decoupled from React components, so
  it can be reused in React Native / exposed via an API without a rewrite. Also plan for
  content versioning — the source algorithms carry dated revisions (May 2025 / Jan 2026 /
  May 2026) and get updated; each protocol's version + date should live in data, not be
  scattered through JSX.

## What it encodes

Two layers:

1. **The meta-algorithm ("which protocol?")** — routes the clinician to the right
   protocol from a few inputs (see Decision logic below). A reviewed draft of this exists:
   - Web draft: `.../00 Algorithm Choice Algorithm/Bup-Algorithm-Chooser-DRAFT.html`
   - Print draft: `.../00 Algorithm Choice Algorithm/Bup-Algorithm-Chooser-DRAFT.pdf`
2. **The individual protocols ("how do I dose it?")** — interactive versions of each
   CA Bridge algorithm with dose amounts, timing, reassessment steps, adjuncts, and
   troubleshooting (content summarized below; PDFs are the source of truth).

### Source documents (source of truth — re-read before implementing dosing screens)

All in Google Drive:
`/Users/joshualuftig/Library/CloudStorage/GoogleDrive-luftig@gmail.com/My Drive/00 BRIDGE/00 Current Bridge Projects/00 Algorithm Choice Algorithm/`

- `Bup-Quick-Start.pdf` (May 2025)
- `Bup-Low-Dose-with-Opioid-Continuation.pdf` (Jan 2026)
- `DTI.pdf` (May 2026, 4 pages incl. emerging practice + XR formulation table)
- `Bup-After-OD-Reversal.pdf` (Jan 2026, incl. explainer pages)
- `CA-Bridge_PATIENT-MATERIAL_Buprenorphine_Self-Start.pdf` (patient handout)
- Microdosing / Micro–Macro (site example, June 2025):  
  https://bridgetotreatment.org/resource/starting-buprenorphine-with-microdosing-and-cross-tapering/  
  PDF: `CA_BRIDGE_SITE-EXAMPLE_Starting-Buprenorphine-with-Microdosing-and-Cross-Tapering_June_2025.pdf`  
  **Tool encodes only the 1-Day Micro–Macro arm** as a discharge-safe pathway. The PDF’s
  3-/7-day full-agonist cross-tapers are not outpatient paths in this tool (see guardrail 1;
  inpatient full-agonist ramps stay on Low Dose).

Planned title updates (use these names in the tool):
- "Buprenorphine (Bup) Quick Start" — "Emergency Department" is being **removed** from
  the title; it applies to ED and inpatient.
- "Bup Low Dose with Opioid Continuation (Inpatient)".

## Decision logic (the meta-algorithm — reviewed and approved by Josh)

Entry: patient with OUD, candidate for and interested in buprenorphine.

1. **Opioid overdose just reversed with naloxone?**
   - YES → **After OD Reversal** protocol.
   - NO → 2.
2. **Setting?**
   - **ED, anticipated discharge:**
     - Being admitted instead? → start **Low Dose with Opioid Continuation (Inpatient)**
       in the ED, hand off to admitting team.
     - Otherwise assess withdrawal (COWS):
       - **COWS ≥ 8 + 2 objective signs (severe):** → **Quick Start** (16 mg SL, range
         8–24+ mg). May add XR bup (DTI) after SL stabilization if patient wants injectable.
       - **COWS 4–7 (and last use > 6 h):**
         - Wants long-acting injectable → **DTI** (XR bup 24 mg weekly).
         - Declines injectable → both options valid (confirmed): treat symptoms with
           adjuncts (e.g., clonidine) and use **Quick Start** if COWS reaches ≥ 8 before
           discharge, OR discharge on the micro-dose + Self-Start plan (below).
       - **COWS < 4 (no/minimal withdrawal):**
         - Wants injectable → **DTI Emerging Practice** (XR bup 8 mg weekly).
         - Declines injectable → both options valid (same dual as COWS 4–7): treat
           symptoms with adjuncts and use **Quick Start** if COWS reaches ≥ 8 before
           discharge, **OR** **1-Day Micro–Macro Start** (micro lead-in now → 16 mg SL
           when moderate–severe withdrawal develops + Self-Start handout).
   - **Inpatient / being admitted:**
     - **Default for most admitted patients** (especially with acute pain / full-agonist
       analgesic needs): **Low Dose with Opioid Continuation (Inpatient)**.
     - **Escape hatch if disposition flips to discharge** after Low Dose was chosen or
       started (admission cancelled): convert to **1-Day Micro–Macro** — never send home
       on full-agonist continuation. Stop outpatient full agonists; keep/start micro;
       macro 16 mg when sick enough.
     - **Backup = Quick Start**, when any of:
       1. Bup-precipitated withdrawal develops during the low-dose ramp → go directly
          to Quick Start.
       2. Imminent discharge — not enough hospital days left for the ~3-day ramp
          (e.g., OUD identified late in the stay).
       3. Already in severe withdrawal (COWS ≥ 8) when OUD identified, no full agonist
          on board.
       4. Patient preference — wants fastest route to therapeutic dose, or declines
          full-agonist continuation.
       5. High risk of self-directed (AMA) discharge.
       6. Full-agonist opioids not feasible (institutional/pharmacy/clinician barriers,
          or ramp repeatedly interrupted: NPO, procedures, missed doses).

## Protocol content summaries (dosing layer)

**Quick Start** (high-dose SL, ED or inpatient): confirm withdrawal (COWS ≥ 8 with ≥ 2
objective signs; typically 24–36 h after last use, range 6–72 h; longer for methadone).
16 mg SL (range 8–24+); reassess 30–60 min; if improved → 2nd dose 8–24+ mg → discharge.
If not improved: usually worsening untreated withdrawal → more bup (8–16 mg). Discharge
Rx ≥ 2-week supply of 16–32 mg/day (example: bup/nx 8/2 mg film 1 SL TID #42, 1 refill);
naloxone in hand. Precipitated-withdrawal arm: act quickly — 16 mg SL + lorazepam 2 mg PO,
reassess q30 min, repeat 16 mg; escalate to ketamine (0.3 mg/kg IV) / fentanyl 200 mcg IV
q10 min with monitoring. Adjuvants (never delay/replace bup): lorazepam, olanzapine,
clonidine, pramipexole, pregabalin.

**Low Dose with Opioid Continuation (Inpatient)**: 3-day bundle — full-agonist opioids
continued and MAXIMIZED throughout (never wean during up-titration; example: morphine ER
30–60 mg PO q8h + morphine IR 15–30 mg PO q4h PRN + morphine 10–20 mg IV q4h PRN;
alternatives: oxycodone, methadone 10 mg q8h, hydromorphone, fentanyl). Bup: Day 1
0.5 mg SL q3h ×8; Day 2 1 mg SL q3h ×8; Day 3 8 mg SL TID or XR bup (e.g., 300 mg SQ).
Alternative 5-day and 8-day ramps (8-day for high-dose methadone transitions ≥100 mg —
but see guardrail 2). Alternative formulations approximating 0.5 mg SL: 0.15 mg IV,
buccal 300 mcg, TD patch 20 mcg/h. Troubleshooting: worsening pain/withdrawal → MORE
full agonist first; too-rapid ramp → pause 2–4 h or lengthen; severe/precipitated
withdrawal → convert to Quick Start.

**DTI (Direct-to-Inject)**: OUD + interested in injectable. COWS ≥ 4 AND last use > 6 h
→ XR bup 24 mg weekly. COWS < 4 (emerging practice) → XR bup 8 mg weekly. Routes to
monthly (emerging): weekly dose then 128 mg or 300 mg monthly after 1–5 days. Discharge
with return precautions (overshoot sedation; undershoot withdrawal; precipitated
withdrawal; injection-site infection signs); outpatient follow-up 3–5 days. Plasma
levels rise for 24 h — consider avoiding supplemental SL bup in first 24 h; after 24 h,
SL bup 8 mg TID PRN for breakthrough. Only absolute contraindication: true bup allergy.
OK in pregnancy/breastfeeding. Formulations: Brixadi weekly (8/16/24/32 mg), Brixadi
monthly (64/96/128 mg), Sublocade (100/300 mg). Extensive symptom-targeted outpatient
adjunct list on DTI p.4.

**After OD Reversal**: heroin/fentanyl (short-acting) OD reversed with naloxone.
Exclusions (any → supportive care, observe, re-evaluate): sedative/intoxicant
co-ingestion suspected; altered mental status; unable to consent; severe medical
illness; methadone use; not a bup-maintenance candidate. If awake with withdrawal
(COWS > 4) and agreeable → 16 mg SL bup (single or divided over 1–2 h; 0.3 mg IV if
can't tolerate SL). Observe ~2 h until no excessive sedation or withdrawal; additional
bup up to 32 mg OK; link to ongoing care.

**1-Day Micro–Macro Start** (ED / discharge; CA Bridge site example June 2025): for low
or no withdrawal when discharge is expected. Preferred: place 2×20 mcg/hr TD patches
(do not wait for withdrawal) + prescribe 8 mg SL PRN. If patches unavailable: stop full
opioids, do not wait for withdrawal, micro SL 0.5 mg q3h (~4 mg/day) OR swallow 2 mg
q3h (~6 mg/day). Wait until moderate–severe withdrawal (COWS ≥ 8 or ≥7/10 by patient);
often 6–12 h, sometimes 24–72 h — keep microdosing until then. Macro: **16 mg SL in one
dose**. Also the **conversion path** when Low Dose for planned admission is aborted by
discharge. Not a substitute for Low Dose inpatient full-agonist continuation. Patient
leaf: Self-Start handout.

**Self-Start (patient handout)**: patient-facing; take a day off → wait for bad
withdrawal (≥12 h, longer for fentanyl) → 8–16 mg SL → repeat in 1 h → next day
16–32 mg once. Low-use patients: start 4 mg, stop at 8 mg.

## Clinical guardrails (firm — from Josh; override anything a source PDF might imply)

1. **Low Dose with Opioid Continuation is NEVER an outpatient/discharge pathway.**
   Full-agonist opioids cannot be prescribed outpatient for OUD; a discharged patient
   would have to use illicit fentanyl (major overdose risk). The ED may only initiate
   it for patients being admitted.
2. **Methadone maintenance patients: continue methadone.** No acute-care methadone→bup
   transition pathway in the tool. Transitions are planned outpatient with the
   patient's methadone program over time.
3. **Never use the word "precipitously"** (clinicians confuse it with precipitated
   withdrawal). Say "imminent discharge."
4. The tool is clinician-facing: simple but clinical language throughout.

## Product/legal notes for the planning session

- **Licensing/attribution:** the source algorithms are CA Bridge / Bridge Center
  (Public Health Institute) content under CC BY-NC-ND 4.0. Josh works with BRIDGE, but
  an interactive adaptation is arguably a derivative — confirm with Josh what
  permission/attribution/co-branding applies before shipping publicly.
- **Disclaimer:** clinical decision-support tools need a prominent "does not replace
  clinical judgment" disclaimer and probably a terms-of-use gate; MD-Calc's pattern is
  a good reference. Not a medical device claim — keep it educational/reference framing.
- **MD-Calc-style interaction, not design:** question-by-question segmented inputs,
  running result panel, "next steps / evidence" tabs are the familiar parts to keep.
  Visual design should come from SAMPA's existing Tailwind system.
- Consider: printable/exportable result summary (order-set-style), links out to the
  source PDFs, a "call the warmline" block (1-844-ASK-NCCC appears on the algorithms),
  and analytics on pathway usage.
- Content freshness: algorithms are revised periodically — design the data layer so a
  protocol update is a data edit + version bump, not a UI rewrite.

## Suggested kickoff (new session in this repo)

> Read docs/bup-dosing-tool-brief.md. I want to build the buprenorphine dosing tool it
> describes as a new section of this site. Enter plan mode and ask me questions before
> proposing the architecture.
