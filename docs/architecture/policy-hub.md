# Policy hub — framing and levers

Product framing for public `/policy` (+ `/policy/:slug`).  
UI seed: `src/data/policyDocuments.js` (`POLICY_HUB`, `POLICY_LEVERS`, `POLICY_TYPES`).  
Board status: `docs/STATUS.md`.

## What this is

SAMPA’s **public voice for expanding access** to medications for addiction
treatment (MAT)—including buprenorphine and other medications for opioid use
disorder (MOUD)—so physician associates can deliver high-quality care.

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

## Access levers

To expand buprenorphine / MOUD / MAT access for substance use disorders, SAMPA
touches several levers—not only federal dockets. Keep this table in sync with
`POLICY_LEVERS` in `src/data/policyDocuments.js` (rendered on `/policy`).

| Lever | Examples | Typical artifact |
|-------|----------|------------------|
| Federal rulemaking | HHS/SAMHSA/DEA/CMS RFIs, telehealth, OTP rules | Public comments |
| State practice law | Scope, supervision, PA OTP authority | Positions, board letters, model language, coalitions |
| Payment | Medicaid, prior auth, team-based billing | Letters, positions, payer comments |
| Systems / employers | Credentialing, formulary, clinic protocols | Toolkits, positions, member education |
| Professional voice | Joint ASAM/AAPA letters, stigma, workforce programs | Statements, coalitions |
| Evidence → standards | Outcomes by prescriber type, quality measures | Positions + research briefs |

## Implementation notes

- PDFs live under `public/files/policy/` (not `/policy/…pdf`) so they do not collide
  with the SPA route `/policy/:slug`.
- 501(c)(3) disclaimer stays on hub + detail pages: educational / public-health
  mission; no political campaign activity.
- First published artifact is an HHS public comment; empty Position/Statement
  slots are intentional so the first item does not redefine the whole category.
