# PARK — SAMPA Policy Ops (tracker + voice)

**Status:** Parked 2026-08-10 after Grill Round 1.  
**Resume phrase:** `Resume SAMPA policy ops`  
**Board:** [`STATUS.md`](STATUS.md) · Task **T19** (Todo)  
**Related:** [`architecture/policy-hub.md`](architecture/policy-hub.md) · `/policy` levers = domains  
**Not:** daily news pipeline replacement · partisan campaign work  

---

## Destination (one line)

**By Nov 2026:** SAMPA rarely misses a high-priority federal (and selected state) window that touches PA/MOUD access, converts several into signed hub artifacts, and shows open windows on `/policy` — measured by submit/co-sign rate on high-priority windows.

---

## Locked decisions — Grill Round 1 (Josh 2026-08-10)

| # | Question | Choice | Meaning |
|---|----------|--------|---------|
| **Q1** | 90-day primary win | **A + B + C** | (A) Never miss federal windows that touch PA/MOUD access · (B) Ship 2–3 more SAMPA-signed artifacts on `/policy` · (C) Public tracker members can see — **all three**; if capacity tight, A+B first, C still in scope |
| **Q2** | News vs policy | **C** Hybrid | News = major national / exceptional only · Tracker holds the rest · rare dual-post |
| **Q3** | Geography | **B** | Federal first + **selective** PA-relevant state (scope/OTP/payment) — not 50-state grind |
| **Q4** | PA written out of policy | **A** | **Core filter** on every opportunity (practitioner-neutral checklist). Patient-access story, not a public brand war |
| **Q5** | Who acts when window opens | **A then C** | **Now:** Egg drafts → Josh edits → PE/board light touch → submit. **In parallel:** recruit standing policy chair/volunteer for sustainability past PE year |
| **Q6** | Public product v1 | **B** | “Open comment windows” section on `/policy` (**table**, not Gantt). No full Congress/state timeline yet |
| **Q7** | Monthly success metric | **A** | % of **high-priority** open windows where SAMPA submitted or co-signed (influence, not doc volume) |

---

## Architecture (locked direction — not built yet)

Three jobs (keep separate):

1. **Sense** — dockets, bills, comment windows, selected state fights  
2. **Choose** — score vs domains + PA/patient access + capacity  
3. **Speak** — comments/positions/statements on `/policy` (+ optional member alert)

| Surface | Owns |
|---------|------|
| **News pipeline** | Exceptional national storytelling only (Q2C) |
| **Policy Ops tracker** | Continuous opportunities + deadlines + “can we comment?” + domain tags |
| **`/policy` hub** | Institutional voice + **Open windows** table (Q6B) + published artifacts |

501(c)(3): educational / public-health voice. No candidate/campaign activity. “Advocacy” OK internal; public site stays Policy / access.

---

## Out of scope (v1)

- Full legislative Gantt (Congress + 50 states)  
- Replacing news cron with policy menu  
- AAPA-style profession campaign as public brand  
- Autopilot filing without Josh/board gate  

---

## Next when resumed (Round 2 — no build until charted)

1. Name data model: opportunity object fields (source, domain, deadline, stage, PA-filter score, owner, docket URL)  
2. Scout sources (federal register / regulations.gov / selected state) — minimum viable  
3. STATUS tickets vs wayfinder map (private org layer vs sampa-website)  
4. Brevo: optional “policy window” alert later — not blocking v1 tracker  
5. Wayfinder map + decision tickets only after Round 2  

**No code** until Josh confirms Round 2 / shared build plan.

---

## Clean session paste

> Resume SAMPA policy ops. Read docs/PARK-policy-ops.md. Grill R1 locked (Q1 A+B+C, Q2C, Q3B, Q4A, Q5 A→C, Q6B, Q7A). Destination: miss fewer high-priority windows, ship hub artifacts, open-windows table on /policy. Round 2 next — no build yet.
