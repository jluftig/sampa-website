# Project Status — living document

> **What this is:** the one place to check "where is everything right now?" — what's
> live, what's being built, what's blocked, what's next. It complements (never
> duplicates) the reference docs: how the system *works* lives in `CLAUDE.md` (agents)
> and `docs/HANDOFF.md` (humans).
>
> **How to keep it alive:** whenever significant work finishes — a feature merges, a
> config milestone lands, a decision is made — update the relevant section and the
> date below. AI agents are instructed (in `CLAUDE.md` / `AGENTS.md`) to do this at
> the end of a work session; humans should too. Use absolute dates, never "last week".
> Delete items instead of letting stale ones pile up — git history remembers.

**Last updated:** 2026-07-11 (bup dosing tool session: Micro–Macro, chooser polish, STATUS sync)

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. Shared Supabase DB (prod + preview).

- **Marketing site** — homepage, about/sections, privacy & terms (effective
  **July 11, 2026**; member directory fully disclosed; self-published for a small
  nonprofit — no outside counsel).
- **News/blog + Key Points research database** — editor dashboard, keyword browse and
  intersections, full-text search, per-claim share links and citations, social-preview
  cards. Posts are drafted via the `/sampa-post` skill.
- **Member area + Stripe memberships** — Google/magic-link sign-in, `/join` checkout,
  `/dashboard` (billing portal; **account contact** for SAMPA vs **directory profile**
  for peers; multi-org employers with role/city/state/website; optional directory
  email/phone; saved articles), tiered multi-year pricing, admin roster with pledge
  tracking and CSV export.
- **Member networking directory** — `/members` list + `/members/:id` for **active
  members** (staff can browse too). Opt-out listing; email share default on / phone
  off; account or directory-specific contact. Peer data only via `member_directory*`
  RPCs (profiles SELECT RLS is **not** opened to all members). Separate from the
  staff roster at `/editor/members`.
- **Board capability** — `is_board` flag (People & permissions checkbox + directory
  badge). Further board-only privileges not built yet.
- **Donations** — public `/donate` page (one-time + monthly), separate `donations`
  ledger in Supabase, donor column on the admin roster.
- **Merch store** — nav/footer links + `/store` redirect to the Printful storefront.

### DB migrations applied (2026-07-11)

Operator confirmed the directory stack SQL was run in Supabase (shared DB). For
reference, these three files were applied (safe to re-run if a future env is blank):

1. `supabase/migrations/2026-07-10-member-directory.sql`
2. `supabase/migrations/2026-07-10-profile-organizations.sql`
3. `supabase/migrations/2026-07-10-directory-contact.sql`

No further directory migrations pending.

**Bup tool analytics migration** (`supabase/migrations/2026-07-08-tool-events.sql`) lives
on the bup feature branch only — apply before or with any deploy of the tool to an
environment that should log `tool_events`. Not required for production until launch.

---

## In flight (branches / local work)

### Buprenorphine dosing tool — **built on branch; not on `main`; launch hold**

**Resume phrase (agent sticky):** *Resume SAMPA bup dosing tool* → [`PARK-bup-dosing-tool.md`](PARK-bup-dosing-tool.md)  
**Worktree (Studio):** `~/Projects/sampa-website-bup`

**Branches (unified tip — interchangeable names):**

| Branch | Notes |
| --- | --- |
| `feature/bup-dosing-tool` | Primary feature line |
| `feature/bup-micro-macro` | Same commit as parent after merge/fast-forward (2026-07-11) |

**Route:** `/tools/bup/*` (preview deploys of either branch). **Not live** on
www.addictionpas.org until merged to `main` **and** launch hold is lifted.

**Clinical / legal hold:** CA Bridge / Public Health Institute permission and final
attribution wording for interactive adaptation of Bridge algorithms. Placeholder only
in `src/lib/bup/meta.js` (`TOOL.attribution`). Do **not** merge to `main` for public
launch until that is confirmed. Clinical brief: `docs/bup-dosing-tool-brief.md`.

#### What’s implemented (as of 2026-07-11; UX polish 2026-07-14)

- **Scaffold** — disclaimer gate, nav, nested routes, MD-Calc-style chooser + sticky
  result panel, print + copy-to-EHR summaries, warmline + attribution blocks.
- **Meta-algorithm (chooser)** — OD reversal → setting (**ED vs inpatient** only;
  disposition is the next question) → COWS bands → injectable preference → outcomes.
  - COWS ≥ 8 → Quick Start  
  - COWS 4–7 or **COWS &lt; 4**, declines injectable → **dual card** (“Both options are
    appropriate”): Adjuncts → Quick Start when severe **or** 1-Day Micro–Macro  
  - Wants injectable → DTI 24 mg (COWS 4–7) / DTI 8 mg emerging (COWS &lt; 4)  
  - ED + being admitted → Low Dose handoff; inpatient default Low Dose with Quick Start
    backups  
- **Protocols (interactive dosing screens)**  
  - Quick Start, Low Dose with Opioid Continuation (inpatient), DTI, After OD Reversal,
    Self-Start (patient handout), **1-Day Micro–Macro Start**  
  - Micro–Macro source: Bridge site example June 2025  
    (https://bridgetotreatment.org/resource/starting-buprenorphine-with-microdosing-and-cross-tapering/)  
  - **Low Dose → discharge conversion** when admission is cancelled (escape hatch +
    `?from=low-dose` banner)  
- **COWS calculator** — optional scoring, per-tab series, objective-sign flags (OOWS-
  aligned), references footnote; never auto-answers the chooser. **2026-07-14:** back
  CTA under Record score returns to the **page that opened COWS** (protocol or chooser).  
- **Per-tab persistence** — chooser progress + protocol in-progress answers
  (sessionStorage; no PHI).  
- **Checklists / EHR (2026-07-14)** — checklist items (e.g. discharge bundle) are
  clickable; **Copy for EHR** includes only **checked** items.  
- **Quick Start support (2026-07-14)** — Adjuvant medications + Bup dosing tips as
  **tap-to-toggle** buttons on the eligibility card (not permanent page-bottom cards).  
- **Analytics** — anonymous `tool_events` + fire-and-forget logger.  
- **Guardrails encoded** — Low Dose never outpatient; no acute methadone→bup pathway;
  “imminent discharge” wording (never the p-adverb clinicians confuse with precipitated
  withdrawal).

#### Next on this tool (planned — next session)

- [ ] Walk Vercel preview / local: full Quick Start + COWS return + EHR paste QA  
- [ ] **Bridge source links on algorithm pages** — do **not** change the chooser or
  calculators for this. When the clinician opens a **protocol / algorithm page**
  (Quick Start, Low Dose, Micro–Macro, DTI, OD Reversal, Self-Start, etc.), show a
  **prominent link or button near the top** that opens the corresponding source
  document on **bridgetotreatment.org** (or the official PDF/resource URL for that
  algorithm). Each protocol already has `source: { title, revised, url }` in
  `src/lib/bup/protocols/*` — fill in correct public URLs and surface them in
  `ProtocolShell` (or equivalent) so “view the Bridge algorithm” is one tap from the
  interactive screen. Micro–Macro already has a resource URL; other protocols still
  have `url: null` placeholders.

#### Still later / launch path

- [ ] Confirm CA Bridge permission + final attribution copy → lift launch hold.  
- [ ] Apply `tool_events` migration on the shared Supabase if not already.  
- [ ] Clinical review pass; merge to `main` only when ready for public clinicians.  
- [ ] Optional: Micro–Macro-specific patient handout variant (Self-Start is generic today).

### Other in-flight

- **`feature/mobile-app`** — Expo/React Native (`mobile/` worktree). Phases 1–3: news,
  Key Points, keywords, search, saved articles, member area, email OTP. **Draft PR
  #22 — not merged.** Directory screens not built yet (web RPCs are reusable).

---

## Blocked / waiting on the outside world

- **501(c)(3) determination letter** (IRS, pending). Until it arrives: keep the
  “not yet tax-deductible” disclosure on `/donate`; Google for Nonprofits can’t
  be applied for.
- **Google OAuth consent screen is in Testing mode** — only whitelisted test users
  can sign in with Google. Must be published before opening membership broadly
  (steps in `docs/member-area-setup.md`).
- **Privileged-access agreement** (staff roster) — still informal; formal board
  adoption optional when the board wants a signed policy track.
- **Bup tool public launch** — blocked on CA Bridge / PHI permission for interactive
  adaptation of Bridge clinical content (see In flight).

---

## Next up (prioritized product backlog)

### Immediate (next coding session)

- [ ] **Bup tool: Bridge source links on protocol pages** — see planned item under
  “Buprenorphine dosing tool” above. Primary next feature for
  `feature/bup-dosing-tool` / `feature/bup-micro-macro`.

### Config / ops (do soon)

- [x] Directory-related Supabase migrations applied (member-directory, profile-organizations, directory-contact) — 2026-07-11.
- [ ] Publish Google OAuth consent screen when ready for open membership.
- [ ] Email platform — recommend **Brevo + Supabase sync** to the board (July 2026);
  interim consumer Google Group until 501(c)(3) unlocks Google for Nonprofits.
- [ ] Optional: board skim of privacy/terms (already emailed informally about the directory).

### Product — site polish / marketing

- [ ] **Footer social links** — Instagram (and eventually Twitter/X) icons/links in
  the site footer so visitors can find SAMPA’s social accounts. Need final
  profile URLs when ready; X can wait until the account exists. Touch
  `src/components/Footer.jsx` (and optionally nav).
- [ ] **Newsletter signup without membership** — public way to subscribe (footer
  and/or homepage/donate-adjacent) for people who are not SAMPA members and
  need not create a full account. Today newsletter opt-in is only on the
  member dashboard after sign-in. Design notes when building:
  - Email capture form → store list (likely Brevo or whatever email platform
    the board picks; see ops backlog) with double opt-in if required.
  - Privacy: disclose what the newsletter is; link to `/privacy`; do not
    create a paid membership or force Google login.
  - Optional: if they later join, merge/link the same email to their profile
    `newsletter_opt_in` without double-subscribing.

### Product — member directory / networking (v2 ideas)

Deferred from the first directory ship:

- **Profile photos / avatars** — Storage upload; opt-in; not public.
- **Short bio** — free-text “about me.”
- **LinkedIn / personal website URLs** (org websites already ship on multi-org profile).
- **Richer filters** — practice setting, credentials, board-only, specialty keywords.
- **Rate limits / anti-scrape** if harvest becomes a problem (Terms already forbid
  commercial use / bulk export of directory data).
- **Mobile directory** — screens on `feature/mobile-app` calling existing RPCs.

### Product — membership & content

- **Policy page (and possibly Research)** — public area similar in spirit to News
  for SAMPA policy work: positions we’re taking, issues we’re advocating for,
  published documents, white papers, and related materials. Open design choices:
  - **One combined “Policy & research” hub** vs **separate `/policy` and
    `/research` routes** (decide when first content is ready).
  - Content model: re-use the posts stack with a type/channel (e.g. `policy` /
    `research`) vs a dedicated table; PDF/file attachments for formal docs.
  - Editor workflow (who can publish policy vs news), nav/footer links, and
    optional social-preview cards for shareable policy pieces.
  - Keep distinct from News/Key Points (news is clinical/industry updates;
    policy is organizational positions and formal documents).
- **CME content for members** — gate SELECT on existing `is_active_member()`.
- **Board privileges** — `is_board` is badge-only today; decide board-only surfaces.
- **In-app messaging / introductions** — not built; v1 uses mailto/tel only.

### Product — platforms

- **iOS/Android launch** — merge `feature/mobile-app`, then app-store work (Sign in
  with Apple; no in-app membership sales — see `CLAUDE.md` mobile section).
- **Bup dosing tool public launch** — after Bridge source links + clinical review +
  CA Bridge permission hold lifted; then merge to `main`.

---

## Recently shipped (newest first)

- 2026-07-11 · Privacy + Terms for member directory (PR #40); Terms spacing fix;
  join/homepage mention directory as a member benefit. Effective date July 11, 2026.
- 2026-07-10 · **Multi-org profile + directory contact** (PR #39): multiple employers
  (role, city, state, website; bare domains OK); account vs directory contact;
  optional work email for peers. Migrations: `profile-organizations` +
  `directory-contact` (after member-directory SQL).
- 2026-07-10 · **Member networking directory** + Board capability (PR #37).
- 2026-07-10 · Nav CTA “Join” (PR #38); homepage donate simplified (PR #36).
- 2026-07-10 · WCAG AA `primary-text` teal (PR #34); project docs layer.
- 2026-07-09 · Donor column on roster (PR #33); donations in handoff (PR #32).
- 2026-07-08 · Merch store (PR #31); DOI-only source links (PR #30).
- 2026-07-07 · Purchased-term tracking; privileged-access agreement + audit log;
  checkbox permissions; `/sampa-post` skill improvements.
- 2026-07-06 · Member area + Stripe memberships; donations.

_Note: bup dosing tool work is **in flight on feature branches**, not production-shipped.
See “In flight” above for the 2026-07-11 capability list._

---

## Doc map (humans vs agents)

| Audience | Start here | Then |
| --- | --- | --- |
| Human operator | [HANDOFF.md](HANDOFF.md) | This file for “what’s happening now”; [member-area-setup.md](member-area-setup.md) for Stripe/OAuth |
| AI agent | [CLAUDE.md](../CLAUDE.md) (via [AGENTS.md](../AGENTS.md)) | This file before planning work; update this file when finishing significant work |
| Product history / original plan | [news-blog-plan.md](news-blog-plan.md) | Historical; STATUS supersedes “what’s next” |
| Bup tool clinical brief | [bup-dosing-tool-brief.md](bup-dosing-tool-brief.md) | Decision tree + guardrails; STATUS tracks build state |
