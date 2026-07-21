# PARK — Bup dosing tool (COWS / protocol UX)

**Board of record:** [`STATUS.md`](STATUS.md) — launch hold + branch live there; this is a sticky only.  
**Resume phrase:** `Resume SAMPA bup dosing tool`  
**Branch:** `feature/bup-dosing-tool` (tip includes 2026-07-14 UX session)  
**Worktree (Studio):** `~/Projects/sampa-website-bup`  
**Remote:** `jluftig/sampa-website`  
**Product code not on `main`** — clinical content still on launch hold; this PARK + STATUS backlog live on **main** so ideas aren’t stranded only on the feature branch.

> Sticky + deferred capture. Short “Next” list only for the active launch track.
> New product ideas go under **Deferred / v2** and a one-line pointer on STATUS.
> State changes (launch, merge, hold lift) → STATUS first.

---

## Goal (one line)

Ship-ready clinician UX on the built bup + COWS tool; hold merge until clinical review says go.

---

## Done this pass (2026-07-14) — don’t redo

- COWS score panel: outline **Back** CTA under Record score; returns to **origin** page (protocol or chooser), not always chooser (`cowsNav.js`)
- Protocol checklists (e.g. discharge bundle): real checkboxes; **Copy for EHR** includes **only checked** items
- Quick Start eligibility: **Adjuvant medications** + **Bup dosing tips** as tap-to-toggle support buttons (not hold; not permanent footer cards). Rx notes stay as footer card. Print still dumps support content.

---

## Next (max short list) — launch track

1. Walk preview / local: Quick Start full path + COWS round-trip + EHR paste QA  
2. Any more UX nits Josh flags on this branch  
3. Clinical launch decision still gates merge to `main` (see STATUS)  
4. Before public launch: Bridge attribution + baseline CDS disclaimer (may land with v1, not only v2)

---

## Deferred / v2 (do not lose)

Captured 2026-07-21 brainstorm. Not blocking launch hold; implement after or with clinical OK.

### 1. Additional practice settings

Today’s tool is oriented to ED / hospital-style Bridge quick-start paths. Add (or deepen) settings:

| Setting | Notes / intent |
|--------|----------------|
| **EMS** | Prehospital / field initiation pathways; different constraints than ED |
| **Perinatal** | Pregnancy / postpartum-specific guidance and safety framing |
| **Perioperative** | Peri-op hold/restart / acute pain + OUD context |
| **Outpatient clinic** | Office-based starts and follow-up (not ED discharge-centric) |

Open design: separate protocol chooser entries vs. setting filter that remaps the same algorithms; each setting may need its own checklist + EHR summary block.

### 2. Disclaimers (UI + EHR paste)

**Intent:** Standard medical decision-support framing — tool supports, does not replace, clinical judgment; not medical advice.

**Where (recommended):**

- Persistent short line on the tool chrome (footer or near primary actions)
- **Always** appended (or prefixed) to **Copy for EHR** / printable summaries so the chart paste carries the caveat
- Optional first-visit / “About this tool” expanded legal text (link to full disclaimer)

**Must-cover themes (draft; counsel/clinical review before final copy):**

- For use by licensed healthcare professionals only (not lay/patient self-management)
- **Clinical decision support** — informs judgment; does **not** substitute for examination, diagnosis, or treatment decisions
- **Not medical advice**; not a certified medical device (if that remains accurate for how we ship)
- Outputs may be incomplete/outdated; protocols change — verify against current practice and primary sources
- SAMPA / tool authors not liable for care decisions made using the tool

**EHR paste example shape (placeholder — rewrite with clinical/legal review):**

> SAMPA buprenorphine decision-support summary — for clinician use only. This output is a decision-support aid adapted from published protocols; it is not medical advice and does not replace independent clinical judgment, local policy, or the treating clinician’s assessment of the individual patient.

### 3. Source credit — Bridge Center / Public Health Institute

- Algorithm and pathways **adapted from** CA Bridge / Bridge to Treatment protocols (a program of the **Public Health Institute**).
- Public-facing credit should name both **CA Bridge / Bridge to Treatment** and **Public Health Institute** where accurate.
- Bridge materials often require **proper attribution** when distributed (confirm current language on bridgetotreatment.org / PHI distribution notes before launch).
- Confirm with Bridge/PHI contacts as part of the existing **permission / launch hold** track — attribution is not a substitute for permission.

**Suggested credit line (placeholder):**

> Dosing pathways adapted from CA Bridge (Bridge to Treatment) buprenorphine quick-start protocols, a program of the Public Health Institute. This tool is not affiliated with or endorsed by CA Bridge or PHI unless separately agreed.

### 4. Framing research — MDCalc & similar CDS tools

Use as **tone/placement** reference, not legal copy-paste.

**MDCalc** ([disclaimer](https://www.mdcalc.com/disclaimer), calculator “pearls”/advice blocks):

- **Audience:** healthcare professionals only; not for laypersons
- **Role:** guide to **inform clinical judgment**; not a replacement for experienced judgment
- **Not medical advice**; not certified as a medical device
- **No substitute** for clinical judgment, diagnosis, or treatment by a licensed professional
- **No warranty** of error-free / complete / current content; user waives reliance claims
- **Per-tool clinical caveats** on calculators (e.g. Wells): “meant to support clinical decision-making, **not dictate management**”; apply after H&P; critical actions when scores conflict with bedside concern
- Plain-English + formal legal layers (good split: short UI line + full disclaimer page)

**Patterns to mirror in SAMPA tool:**

| Pattern | Apply how |
|--------|-----------|
| Clinician-only audience | Onboarding / footer; block patient-facing marketing tone |
| Support ≠ dictate | Near score/dose outputs and in EHR paste |
| Judgment-over-score | If COWS/protocol conflicts with bedside assessment, clinician wins — say so |
| Layered disclaimer | Short always-visible + full legal page/section |
| Source/evidence context | Bridge attribution + link to primary protocol pages where allowed |

**Other peers to skim when drafting final copy:** ASAM materials, hospital CDS footers, UpToDate-style “not a substitute for clinical judgment” language — same themes, different length.

### 5. Implementation sketch (when building)

1. Draft disclaimer strings in one module (web; shared with mobile later if ported)  
2. Wire into **Copy for EHR** template(s) + print  
3. Add Bridge/PHI credit block on tool about / footer  
4. Practice-setting IA + content with clinical author  
5. Legal/clinical sign-off before production  

---

## Out of scope unless asked

- News pipeline · security pre-membership · homepage marketing  
- Mobile port of bup tool (STATUS: after CA Bridge permission hold lifts)

---

## Resume paste

> Resume SAMPA bup dosing tool. Branch `feature/bup-dosing-tool`, worktree `~/Projects/sampa-website-bup`. Read `docs/PARK-bup-dosing-tool.md` and the Bup item on `docs/STATUS.md`. STATUS is board; launch hold remains. Continue UX/clinical polish only — do not merge to main without launch decision. Deferred v2 (practice settings, EHR disclaimers, Bridge credit) is captured in the PARK; pick it up deliberately, don’t invent a second backlog.
