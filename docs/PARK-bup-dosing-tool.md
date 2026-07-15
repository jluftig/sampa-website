# PARK — Bup dosing tool (COWS / protocol UX)

**Board of record:** [`STATUS.md`](STATUS.md) — launch hold + branch live there; this is a sticky only.  
**Resume phrase:** `Resume SAMPA bup dosing tool`  
**Branch:** `feature/bup-dosing-tool` (tip includes 2026-07-14 UX session)  
**Worktree (Studio):** `~/Projects/sampa-website-bup`  
**Remote:** `jluftig/sampa-website`  
**Not on `main`** — clinical content still on launch hold.

> Sticky note only. Do not grow into a backlog. State changes → STATUS first.

---

## Goal (one line)

Ship-ready clinician UX on the built bup + COWS tool; hold merge until clinical review says go.

---

## Done this pass (2026-07-14) — don’t redo

- COWS score panel: outline **Back** CTA under Record score; returns to **origin** page (protocol or chooser), not always chooser (`cowsNav.js`)
- Protocol checklists (e.g. discharge bundle): real checkboxes; **Copy for EHR** includes **only checked** items
- Quick Start eligibility: **Adjuvant medications** + **Bup dosing tips** as tap-to-toggle support buttons (not hold; not permanent footer cards). Rx notes stay as footer card. Print still dumps support content.

---

## Next (max short list)

1. Walk preview / local: Quick Start full path + COWS round-trip + EHR paste QA  
2. Any more UX nits Josh flags on this branch  
3. Clinical launch decision still gates merge to `main` (see STATUS)

---

## Out of scope unless asked

- News pipeline · security pre-membership · homepage marketing · mobile app

---

## Resume paste

> Resume SAMPA bup dosing tool. Branch `feature/bup-dosing-tool`, worktree `~/Projects/sampa-website-bup`. Read `docs/PARK-bup-dosing-tool.md`. STATUS is board; launch hold remains. Continue UX/clinical polish only — do not merge to main without launch decision.
