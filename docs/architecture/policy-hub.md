# Policy hub — framing and levers

Product framing for public `/policy` (+ `/policy/:slug`).  
UI seed: `src/data/policyDocuments.js` (`POLICY_HUB`, `POLICY_LEVERS`,
`POLICY_COMMENT_PRIORITIES`, `POLICY_TYPES`).  
Board status: `docs/STATUS.md`.

## What this is

SAMPA’s **Policy hub**—where the society **will publish** its public voice for
expanding access to medications for addiction treatment (MAT)—including
buprenorphine, methadone, naltrexone, and other medications for opioid use
disorder (MOUD), especially in rural and underserved communities.

**Honest scope today:** the first published artifact is the July 2026 HHS RFI
public comment. Most levers and document types are **roadmap / intent**, not a
claim that SAMPA already operates across every lever. Site copy must stay in
future/intent tense for the levers table and type taxonomy (“How we will…”,
“What we will publish”). The **Roadmap from our first comment** section on
`/policy` surfaces priorities taken from that HHS submission.

**Nav label stays “Policy.”** Outcome-forward copy; instruments underneath.
Do **not** rename the product to “Public comment hub” (too narrow) or lead with
“Advocacy” on the public site (501(c)(3) / Ad Grants optics). Internal/board
language may still say advocacy.

**Not:** News/Key Points, CME, electoral/partisan campaign activity.

## Naming decisions (2026-08-04)

| Option | Verdict |
|--------|---------|
| Public comment hub | Reject — comments are one tactic |
| Advocacy (nav lead) | Avoid on public site; OK internally |
| Access projects | Good outcome language; weak as library name |
| **Policy** (keep) | Keep nav + `/policy`; reframe hub around access |
| Access & policy / Practice & policy | Optional future rename if “Policy” still feels narrow |

## Document types (instruments)

| Type | Role |
|------|------|
| **Position** | Standing stance (quality, workforce, payment, access) |
| **Public comment** | Federal/state RFI or rulemaking response |
| **Statement** | Time-bound leadership statement |

Later (when needed): campaigns, toolkits, coalition letters—still under this hub
unless volume forces a CMS/`policy_documents` table (see STATUS backlog).

## Access levers (roadmap)

To expand buprenorphine / MOUD / MAT access, SAMPA **will** work across several
levers—not only federal dockets. Keep in sync with `POLICY_LEVERS` in
`src/data/policyDocuments.js` (rendered on `/policy`).

| Lever | Examples (from HHS RFI + follow-on) | Planned artifact |
|-------|--------------------------------------|------------------|
| Federal rulemaking | HHS/SAMHSA/DEA/CMS RFIs; permanent SUD telehealth with practitioner-neutral language; 42 CFR Part 8 OTP practitioner implementation | Public comments |
| State practice law | Scope/supervision; stranded DATA-waiver / X-waiver references; MOUD-specific PA barriers; state OTP / methadone alignment with Part 8 | Positions, board letters, model language, coalitions |
| Payment | Medicaid MOUD pay parity; prior auth; Medicare differentials; PA billing for Collaborative Care / BHI | Letters, positions, payer comments |
| Systems / employers | Low-barrier / same-day MOUD; clinic protocols; peer recovery with prescribing; rural specialty backup | Toolkits, positions, member education |
| Workforce & professional voice | PA recognition in HRSA/NHSC & HHS projections; MATE Act / stigma education; peer recovery culture; joint society statements | Statements, coalitions, comments |
| Evidence → standards | Outcome measures including prescriber type; near-real-time MOUD access dashboards; workforce-visible claims data | Positions + research briefs |

## Mapping: first public comment → roadmap

Source: *Response to the HHS RFI on the Chronic Disease of Addiction* (submitted
2026-07-05; FR Doc. 2026-11602). Central thesis: **workforce message**—federal
barriers to PA buprenorphine largely fell, but patient-level access lags because
of state scope, payment differentials, and unfinished telehealth rulemaking.

| HHS RFI recommendation cluster | Roadmap home |
|--------------------------------|--------------|
| Scale MOUD (bup, methadone, naltrexone); low-barrier / telehealth delivery; rural PA/NP access evidence (CARA) | Federal + Systems; priorities list |
| Permanent SUD telehealth; practitioner-neutral special registration before Dec 2026 cliff | Federal rulemaking |
| Federal–state MOUD alignment; repeal stranded waiver language & MOUD-specific PA barriers | State practice law |
| Fully implement Part 8 OTP practitioner provisions; state methadone / OTP alignment | Federal + State |
| MATE Act clinical stigma education; peer recovery support alongside MOUD | Workforce & professional voice + Systems |
| Recognize/recruit PAs in NHSC / HRSA workforce programs; addiction CAQ visibility (public home: `/caq`) | Workforce & professional voice |
| Medicaid pay parity; PA participation in CoCM/BHI billing; Medicare differential | Payment |
| Prescriber-type outcome measures; near-real-time MOUD access dashboards / learning system | Evidence → standards |

`POLICY_COMMENT_PRIORITIES` on `/policy` is the short public list of these
clusters. Document `themes` on the HHS entry should stay aligned with the same
clusters.

## Implementation notes

- PDFs live under `public/files/policy/` (not `/policy/…pdf`) so they do not collide
  with the SPA route `/policy/:slug`.
- 501(c)(3) disclaimer stays on hub + detail pages: educational / public-health
  mission; no political campaign activity.
- First published artifact is an HHS public comment; empty Position/Statement
  slots are intentional so the first item does not redefine the whole category.

## Policy ops (adjacent track)

Opportunity sensing, comment windows, and influence workflow are **not** the news
pipeline. Decisions + park sticky: [`docs/PARK-policy-ops.md`](../PARK-policy-ops.md)
(*Resume SAMPA policy ops*). Grill R1 locked 2026-08-10.
