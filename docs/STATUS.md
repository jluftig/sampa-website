# Project Status — living document

> **What this is:** the one place to check "where is everything right now?" — what's
> live, what's being built, what's blocked, what's next. It complements (never
> duplicates) the reference docs: how the system *works* lives in `CLAUDE.md` +
> `docs/architecture/` (agents). Humans start at thin `docs/HANDOFF.md` or ask an
> agent to walk STATUS + CLAUDE.
>
> **How to keep it alive:** whenever significant work finishes — a feature merges, a
> config milestone lands, a decision is made — update the relevant section and the
> date below. AI agents are instructed (in `CLAUDE.md` / `AGENTS.md`) to do this at
> the end of a work session; humans should too. Use absolute dates, never "last week".
> Delete items instead of letting stale ones pile up — git history remembers.

**Last updated:** 2026-08-25 (T35 follow-up — Sustaining-card copy on PR #85; do not merge yet; T36 parked)

**Doc roles (one board — not three sources of truth):**

| Doc | Role |
|-----|------|
| **This file (`STATUS.md`)** | **Only product board** — live / in flight / blocked / next / backlog **+ Tasks claim tables** |
| **`CLAUDE.md` + `docs/architecture/`** | How the system works / must not break |
| **`HANDOFF.md`** | Thin human front door + bus-factor accounts — not a second manual |
| **`PARK-*.md`** | Thin **agent sticky note** (resume phrase + next 1–4 steps + links here) |
| **Specs / dated reviews** | How it works / findings snapshot — open work stays on this board |
| **`docs/archive/`** | Historical only |

**Write path:** state change → **STATUS first** → CLAUDE/architecture if design/security changed → PARK only if track still mid-flight (slim) → HANDOFF only if bus-factor/front-door changed.  
If the same “what’s next” list appears in three files, **keep STATUS and delete the extras**.  
**GitHub `main`** — source of truth across laptop + Mac Studio; pull → work → **push**.  
**No third coordination file** — claim work in **Tasks** below (not a parallel kanban repo).

---

## Tasks (claim board — Hermes Egg ↔ Cursor laptop ↔ Josh)

Single place to **grab work** so Studio and laptop don’t double-edit.  
**Roadmap / ideas** still live in **Next up** and **In flight** below — promote a row here when someone will actually execute soon.

**Owners:** `egg` (Hermes/Studio) · `cursor` (laptop Cursor) · `josh` (human) · `either` (unclaimed)

### Todo

| ID | Task | Owner | Notes |
|----|------|-------|-------|
| T32 | Practice resources public /resources | either | Preview-only draft PR #75. Not on live site. About still treats practice resources as in-development. Preview only; do not merge until Josh reviews Vercel. |
| T33 | Employer / institutional membership invoice (/membership) | either | **Parked preview-only** draft PR #73. Live onboarding is T35 (`/join` only — no catalog page). `/membership` 404s on main. Do not reuse T24 (news one-shot, already Done). Do not merge #73 as the join path. Invoice stays a later side door. |
| T36 | Sustaining accident cleanup (Fellow + Patron) | either | **Parked.** People who picked Sustaining thinking it was extra support. Shift those members to `fellow` + `patron` flag + Stripe item. Needs AAPA signal or a short list review. Do not run until Josh says. Not in T35 / PR #85. |
| T19 | Policy ops tracker + open windows (hub) | either | Grill R1 locked 2026-08-10. [`PARK-policy-ops.md`](PARK-policy-ops.md) · *Resume SAMPA policy ops*. No build until Round 2. |
| T1 | Confirm 2026-07-15 SQL in prod (post-authors + member-comments) | either | Supabase SQL Editor; idempotent |
| T2 | Pre-membership security P0 (Vercel Stripe/webhook/keys + E2E join) | either | [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md) · *Resume SAMPA security review* |
| T6 | News cover pipeline polish (daily cron covers) | egg | *Resume SAMPA news pipeline*; dual-talon rules in news skill |
| T7 | Mobile: Sentry DSN + delete-account E2E | either | Ops; code mostly shipped |
| T8 | D-U-N-S → Apple org conversion (before public App Store) | josh | External / Apple |

### Deferred

Parked claims — **not** Todo. Claim only when reactivation criteria in Notes are met; then move to **In Progress** as usual.

| ID | Task | Owner | Notes |
|----|------|-------|-------|
| T13 | **Deferred · Wayfinder only:** `/setup-matt-pocock-skills` (GitHub Issues wiring) | either | **Why (2026-08-05):** Matt’s issue tracker (`to-tickets` / `to-spec` / `wayfinder`) would publish a second backlog alongside **STATUS Tasks** — violates single-board. Claimed then unclaimed mid-setup after choosing GitHub. **When to reactivate:** only for a **foggy multi-session** project where Josh explicitly wants a Wayfinder decision map (not routine STATUS todos). **How:** claim this row → run `/setup-matt-pocock-skills` → GitHub Issues OK *only* as Wayfinder map/children; STATUS Tasks stay Egg↔Cursor claims. **Do not** use for day-to-day product/ops work. `triage` skill not installed; skip triage labels unless that changes. |

### In Progress

| ID | Task | Owner | Started | Notes |
|----|------|-------|---------|-------|
| T35 | Frictionless Join onboarding | cursor | 2026-08-25 | **PR #85 already on Production.** Follow-up copy (this branch — **do not merge yet**): Sustaining display name → **Certified PA (not AAPA)** + quiet “Sustaining rate”; Fellow eligibility first (AAPA members start here / NCCPA + AAPA). Keys/prices unchanged. T36 parked. Do not merge #73. |
| T3 | Brevo email — campaigns + first real send path | egg | 2026-08-07 | **Claimed egg.** Lifecycle welcome/renewal/donation + DOI **LIVE**. Weekly blast **not** approved — needs explicit `send campaign N`. Clean draft **#19** (no TEST) — ⚠ **stale**: templates changed in PRs #66/#68/#69 (2026-08-12); rebuild from file **on Studio/Hermes** (laptop has no BREVO key). Sign-off Shani Wilson President (PR #67). Weekly #01 email copy stays here — draft PR #83 is preview-only, no production send (do not open a separate ticket). |
| T16 | Member welcome + renewal + donation thanks (Brevo) | egg | 2026-08-07 | **Claimed egg · LIVE path.** Needs `BREVO_API_KEY` on Vercel Production + redeploy. Kill-switch only: `BREVO_MEMBER_EMAILS_ENABLED=false`. Note: T4 adds merch/store links to welcome/renewal (email social icons pulled 2026-08-12) — files read at send time, no Brevo action. |

### Done (last 5 only — older = git history)

| ID | Task | Owner | Done | Notes |
|----|------|-------|------|-------|
| T29 | Jonathan Baker About card from 2026-08-19 form | cursor | 2026-08-25 | **Merged PR #79 → Production.** Baker form card live. Photo still existing `jonathan-baker.jpg`. |
| T31 | Close leftover PRs #71 and #63 | cursor | 2026-08-25 | **Closed, not merged.** #71 superseded by live `/about#leadership` (T23/PR #77). #63 is a stale Aug 9 board-agenda markdown, not a site feature. Do not reopen. |
| T30 | Public-site click-through fixes (2026-08-21 night pass) | cursor | 2026-08-21 | **Merged PR #80 → Production.** Josh walked the Vercel preview and said ship. Eric Bergersen “board-certified PA”; `/join` intro 10–13% / 17–20% matching stored prices; sticky-header hash offset; home SAMHSA citation by survey name. |
| T28 | Josh About bio: naloxone doses 1.15 million | cursor | 2026-08-19 | **Merged PR #78 → Production.** Josh Luftig public bio: more than **1.15 million** doses at no cost (was 600,000). Copy-only; `src/data/leadership.js` `josh-luftig`. |

### Task workflow (agents + humans)

1. **`git pull`** on the machine you’re using (always before claim or code).
2. **Claim:** pick a **Todo** row → set **Owner** to `egg` / `cursor` / `josh` → move that row to **In Progress** with **Started** = today’s date (`YYYY-MM-DD`) → **commit + push STATUS** *before* heavy work (so the other side sees the claim).
3. **Work** on that task only (use PARK/spec linked in Notes). Don’t start a second claimed task without releasing or finishing the first unless Josh says parallel OK.
4. **Update:** if blocked or notes change, edit the In Progress row → commit+push.
5. **Complete:** move row to **Done** with **Done** date; keep **Done** to **5 rows max** (delete oldest); clear related PARK if track fully shipped; commit+push.
6. **Release / unclaim:** if stopping mid-flight, either leave In Progress with an honest Notes line *or* move back to Todo with Owner `either` — then push.
7. **Never** invent `TASKS.md` / a second board. **Never** claim only in chat.

**Conflict rule:** if two claims race, **first push to `origin/main` wins**; the other pulls, yields, picks another ID.

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. Shared Supabase DB (prod + preview).

- **Marketing site** — homepage, dedicated **`/about`** page, privacy & terms
  (effective **July 11, 2026**; member directory fully disclosed; self-published
  for a small nonprofit — no outside counsel). **Ad Grants pass (2026-08-04):**
  501(c)(3) + EIN prominent on hero/about; mission + programs (live news/directory;
  in-development practice resources, CME, job board, and Addiction Medicine CAQ card → `/caq`);
  Join/Donate CTAs in hero; nav About → `/about`, Programs → `/#programs`,
  CAQ → `/caq` (T26, 2026-08-16). Homepage CAQ card + membership line (T27, 2026-08-17).
- **Homepage hero (2026-08-04)** — **static** wordmark + nonprofit line + Join/Donate
  CTAs for Ad Grants PageSpeed. Particle “Assembly” effect (PR #49) parked until
  after approval; scroll cue retained. Earlier: scroll cue (PR #50), news icon
  removed (PR #51).
- **News/blog + Key Points research database** — editor dashboard, keyword browse and
  intersections, full-text search, per-claim share links and citations, social-preview
  cards. Posts are drafted via the `/sampa-post` skill.
- **Ordered co-authors on news posts** (PR #47) — `post_authors` + editor picker;
  article byline uses ordered authors. Migration file:
  `supabase/migrations/2026-07-15-post-authors.sql` (also folded into `schema.sql`).
- **Member discussion on news** (PR #48) — flat comments + emoji reactions on web and
  mobile. Public read on published posts; write gated by `is_active_member()`.
  Migration file: `supabase/migrations/2026-07-15-member-comments.sql`.
  **Deferred:** discussion notifications (see backlog).
- **Member area + Stripe memberships** — Google/magic-link sign-in, one-page `/join`
  checkout (honor-system AAPA yes/no; optional Patron +$25/year
  add-on — T35 / PR #85; Sustaining-card copy follow-up in preview),
  `/dashboard` (billing portal; **account contact** for SAMPA vs **directory profile**
  for peers; multi-org employers with role/city/state/website; optional directory
  email/phone; saved articles), tiered multi-year pricing, admin roster with pledge
  tracking and CSV export.
- **Member networking directory** — `/members` list + `/members/:id` for **active
  members** (staff can browse too). Opt-out listing; email share default on / phone
  off; account or directory-specific contact. Peer data only via `member_directory*`
  RPCs (profiles SELECT RLS is **not** opened to all members). Separate from the
  staff roster at `/editor/members`. **Practice settings (2026-08-07):** curated
  multi-select per employer (soft color chips on list/detail; OR-filter on
  `/members` via live `member_directory(..., settings_filter)`); legacy free-text
  fallback until re-save.
- **Board capability** — `is_board` flag (People & permissions checkbox + directory
  badge). Further board-only privileges not built yet.
- **Donations** — public `/donate` page (one-time + monthly), separate `donations`
  ledger in Supabase, donor column on the admin roster.
  **ON (2026-07-21):** restored after IRS 501(c)(3) determination for SAMPA, Inc.
  (EIN 42-2288772). `DONATIONS_ENABLED = true` in `src/lib/features.js` **and**
  `api/create-donation-session.js`. Donate page shows tax-deductible boilerplate.
- **Merch store** — nav/footer links + `/store` redirect to the Printful storefront. Welcome email has a merch card; renewal links the store (T4, 2026-08-10).
- **Policy hub** — public `/policy` + `/policy/:slug`. **Framing:** where SAMPA
  **will publish** its public voice for **access** to MAT/MOUD—not a “comments only”
  archive and not nav-labeled “Advocacy.” Nav stays **Policy**. Honest scope today:
  two public comments (HHS **2026-07-05**; HRSA psychedelic-therapies **2026-08-11**,
  91 FR 43103); levers table + Position/Statement
  types are **roadmap / intent** (“How we will improve access”, “What we will publish”).
  `/policy` also shows **Roadmap from our first comment** priorities seeded by that
  HHS RFI (telehealth, state/OTP alignment, workforce, payment, stigma/peers, data).
  Seed: `src/data/policyDocuments.js` + PDF in `public/files/policy/`. Deep dive:
  [`docs/architecture/policy-hub.md`](architecture/policy-hub.md). CMS/table deferred.
  Distinct from News/Key Points.
- **Mobile app code on main** — Expo app in `mobile/` (PRs #22, #43–#45); see In flight
  for TestFlight / App Store rollout status (not a “messy branch” — shipped code,
  external rollout still open).

### DB migrations applied (directory stack, 2026-07-11)

Operator confirmed the directory stack SQL was run in Supabase (shared DB):

1. `supabase/migrations/2026-07-10-member-directory.sql`
2. `supabase/migrations/2026-07-10-profile-organizations.sql`
3. `supabase/migrations/2026-07-10-directory-contact.sql`
4. `supabase/migrations/2026-08-07-practice-settings-directory.sql` — applied **2026-08-07** (`settings_filter` on `member_directory`)
5. `supabase/migrations/2026-08-25-patron-addon.sql` + `2026-08-25-aapa-member.sql` — applied **2026-08-25** (Josh; `profiles.patron`, `profiles.aapa_member`, `guard_profile_role`) before PR #85 merge

### DB migrations to verify (code already on main)

If co-authors or comments misbehave in prod, re-run (idempotent) in Supabase SQL Editor:

1. `supabase/migrations/2026-07-15-post-authors.sql`
2. `supabase/migrations/2026-07-15-member-comments.sql`

Push/device_tokens SQL was applied for mobile push (2026-07-15).

---

## In flight (branches / active tracks)

- **Mobile app — TestFlight / App Store path** (`mobile/` on main; not a separate
  long-lived feature branch anymore). Built and device-verified: news/Key Points/
  keywords/search/saved, auth (Apple + Google + email code via Brevo, Face ID,
  encrypted sessions), member area + account deletion, member directory, app identity,
  **push notifications** (publish → phones), Sentry (dormant until DSN).
  **Now:** TestFlight external group / board invite path; remaining ops below.
  **Not blocked by code mess** — waiting on Apple/org/ops items.
- **`feature/bup-dosing-tool`** — buprenorphine dosing + COWS calculator with anonymous
  usage analytics (`tool_events`). Built; **clinical launch hold** (do not merge to
  `main` until review says go). Worktree on Studio: `~/Projects/sampa-website-bup`.
  Sticky (on main): [`PARK-bup-dosing-tool.md`](PARK-bup-dosing-tool.md). Resume:
  *Resume SAMPA bup dosing tool*. Post-launch / v2 ideas (practice settings, EHR
  disclaimers, Bridge attribution) live in that PARK — do not lose.
  Older `feature/bup-micro-macro` is fully superseded by this branch (safe to delete).
- **Pre-membership security review** — **Parked mid-stream (2026-07-12).**
  Code/schema health check: [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md).
  Thin resume: [`PARK-security-review.md`](PARK-security-review.md).
  **Done:** OAuth **published** (2026-07-12); single-board STATUS/HANDOFF/PARK hygiene.
  **Next P0 when resumed:** Vercel Production Stripe/webhook/Supabase elevated keys;
  E2E join → webhook → directory; non-member blocked; no self-admin.
  Resume: *Resume SAMPA security review*.
- **News scout → auto-draft pipeline (Hermes / Egg)** — **Operational · one-shot as of 2026-08-15.**
  Daily cron **6:00 AM PT, 7 days/week** (job `1f55242ea122`): scout → write once
  (PA H2 baked in) → **internal QC vs primary** → up to **3** OA-preferred drafts →
  editor briefing + menu on Telegram → human Publish only (**never auto-publish**).
  Covers: A/B/C once + vision QA; no Dunk / R1/R2 critic loop unless Josh asks.
  Recipe: [`news-article-structure.md`](news-article-structure.md) § One-shot.
  Sticky: [`PARK-news-pipeline.md`](PARK-news-pipeline.md).
  Resume: *Resume SAMPA news pipeline*. **Voice trial ON** (merged PR #72). Revert: `revert news voice`.
- **Email / Brevo campaigns (Hermes + repo)** — **Active 2026-08-07 (T3 · egg).**
  **Done this session:** `BREVO_API_KEY`; domain **authenticated + verified** (Porkbun DNS:
  SPF + DKIM + DMARC + `em` branded links); From/Reply-To **`info@`** (Workspace group
  alias; active); catch-all list **SAMPA Updates** (id 3) + **SAMPA Test** (id 8, Josh only);
  topic lists reserved unused; branded **SAMPA Weekly Issue 01** template
  (`docs/email/templates/site-membership-launch.*` + logo `public/email/sampa-logo.png`);
  draft+test campaigns through **#5** (From info@ → `luftig@gmail.com`). CLI free-plan
  tag omit + FIRSTNAME map. Decisions locked in PARK + architecture.
  **Import:** 120 contacts on **SAMPA Updates** (2026-08-07; no send). **Still open:** human approve first real send of Weekly #01;
  site copy for member email is **Live** (PR #68 merged 2026-08-12).
  Sticky: [`PARK-brevo-email.md`](PARK-brevo-email.md). How:
  [`architecture/email-brevo.md`](architecture/email-brevo.md).
  Resume: *Resume SAMPA Brevo email*. **Draft+test only** — no mass send without explicit Josh.
- **Leftover preview PRs (2026-08-25 review)** — still open, do not merge until Josh reviews: **#75** (T32 `/resources`), **#73** (T33 `/membership` + employer invoice — parked), **#83** (T3 Weekly #01 email copy; no production send). **#85** is on Production (T35 join polish); Sustaining-card copy follow-up is on the same branch — **do not merge** until Josh reviews the preview. **#79** merged (**T29** Done). **#71** and **#63** closed, not merged (**T31** Done). Live site has `/about#leadership` (full 2026–27 roster) and `/join`; no `/leadership`, `/resources`, or `/membership` routes on `main`.

---

## Blocked / waiting on the outside world

- **501(c)(3) determination letter** — **granted 2026-07-21** (SAMPA, Inc.;
  EIN 42-2288772). Donations restored with tax-deductible disclosure on `/donate`.
  Still unlocks: Google for Nonprofits application; Apple nonprofit fee waiver
  after org conversion.
- **Privileged-access agreement** (staff roster) — still informal; formal board
  adoption optional when the board wants a signed policy track.
- **Bup dosing tool clinical review** — code ready on branch; launch hold until
  content/clinical sign-off.
- **Mobile public launch deps** — Apple org conversion (D-U-N-S), TestFlight/board
  validation, App Store assets; Sentry account optional but recommended.

---

## Next up (prioritized product backlog)

### Config / ops (do soon)

- [x] Directory-related Supabase migrations applied (member-directory, profile-organizations, directory-contact) — 2026-07-11.
- [x] News draft pipeline secrets + insert script + daily cron (6am PT 7d) on Hermes Egg profile — 2026-07-12.
- [x] Publish Google OAuth consent screen — operator-confirmed **2026-07-12** (not Testing).
- [ ] **Confirm 2026-07-15 SQL in prod** — post-authors + member-comments (if not already run).
- [ ] **Pre-membership security P0** (remaining) — Vercel Production env + Stripe
  live webhook + E2E membership path; see [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md)
  / [`PARK-security-review.md`](PARK-security-review.md).
- [ ] **Email / Brevo (T3 · egg in progress)** — **infra done** 2026-08-07 (API key, domain
  auth SPF/DKIM/DMARC + `em` brand, info@ From, Updates+Test lists, Weekly #01 draft+test).
  **Still need:** human first production send; site copy flip In development → **Live**
  done in PR #68 (launch day 2026-08-12). Later: member sync. Public DOI signup UI shipped (T5) — activate
  with DOI template + Vercel `BREVO_*`. See [`PARK-brevo-email.md`](PARK-brevo-email.md).
  **Also live:** Supabase auth SMTP via `no-reply@addictionpas.org` (separate from campaigns).
- [ ] **Sentry account** (free) + `EXPO_PUBLIC_SENTRY_DSN` in mobile/.env.local and the
  EAS build env — turns on mobile crash reporting (code already merged, dormant).
- [ ] **SAMPA D-U-N-S number** (free, developer.apple.com/enroll/duns-lookup) → convert
  the Apple Developer account Individual → SAMPA organization **before public App
  Store launch** (publisher shows "SAMPA"; nonprofit fee waiver available with 501(c)(3)).
- [ ] **Mobile delete-account E2E test** with a throwaway account (endpoint live).
- [ ] Optional: board skim of privacy/terms (already emailed informally about the directory).
- [x] **Restore donations** — both `DONATIONS_ENABLED` flags `true` + 501(c)(3) copy (2026-07-21).

### Product — news pipeline

- [x] **Agency cover image-to-image / reference pathway** — **done 2026-07-14.**
  Hermes Egg `image_gen.provider: xai` (Grok Imagine / SuperGrok OAuth) supports
  edit via `grok-imagine-image-quality` with the dual-talon gold PNG as
  `image_url` (`docs/assets/cover-agency-reference-dual-talon-7oh.png`). **Default
  for agency covers:** xAI img2img + house master prompt; QA (no emblem text, both
  talons, exact lockup); text-to-image fallback if xAI edit fails. Caption pattern:
  *Editorial illustration: stylized dual-talon emblem and [LOCKUP]; not an official seal.*
  Dual-talon for scheduling/enforcement-type stories — not grants/stats.

### Product — site polish / marketing

- [x] **Night click-through fixes (T30)** — 2026-08-21. PR #80. Eric Bergersen house-voice PA; `/join` intro 10–13% / 17–20%; hash targets clear the sticky header; home SAMHSA citation is the survey name.
- [x] **About / Leadership section (T23)** — 2026-08-19. PR #77. `/about#leadership` live; About nav New badge. Kerith form bio + form headshot. **T28 (2026-08-19, PR #78):** Josh Luftig bio naloxone line is more than **1.15 million** doses. **2026-08-25:** Josh confirmed the live roster is current; leftover `/leadership` draft PR #71 closed, not merged (T31).
- [x] **Jonathan Baker About card (T29)** — 2026-08-25. PR #79. Form bio + PA-C + LinkedIn live. Photo still existing `jonathan-baker.jpg`.
- [ ] **Frictionless Join onboarding (T35)** — PR #85 on Production. Follow-up copy (do not merge yet): Sustaining card → **Certified PA (not AAPA)** + quiet “Sustaining rate”; Fellow eligibility first. Keys/prices unchanged.
- [ ] **Sustaining accident cleanup (T36)** — parked. Fellow + `patron` + Stripe item for people who picked Sustaining as extra support. Do not run until Josh says.
- [ ] **Practice resources `/resources` (T32)** — preview-only PR #75; do not merge until Josh reviews Vercel.
- [ ] **Employer / institutional membership invoice (T33)** — parked preview-only PR #73 (`/membership`); live onboarding is T35 `/join`; do not merge #73 as the join path.
- [x] **Homepage CAQ card + membership line (T27)** — 2026-08-17. PR #76. In-development card → `/caq`; one careful membership line on home + `/join`.
- [x] **Addiction Medicine CAQ page (T26)** — 2026-08-16. Public `/caq` live (PR #74). NCCPA development approved after SAMPA proposal; exam not open.

- [x] **Footer social links** (**T4**) — 2026-08-10. IG + FB icons in site footer
  (`Footer.jsx`, lucide icons). Email-footer icons pulled 2026-08-12 (socials
  not ready to promote; gray PNGs staged in `public/email/` for later). DOI
  template 13 deliberately excluded (single-purpose). X/Twitter still waits on an account.
- [x] **Newsletter signup without membership** (**T5**) — PR #62 (2026-08-07).
  Prominent chip above footer → Brevo DOI → **SAMPA Updates**. Activate DOI with
  Brevo template + Vercel `BREVO_*` ([`email/setup-checklist.md`](email/setup-checklist.md) §5).
- [ ] **Member welcome + renewal emails** (**T16**) — Brevo automation/templates
  triggered from Stripe webhook on new active membership and renewal. Same brand
  system as Weekly #01. Content: mission, live programs, member how-to, building
  next, CTAs. Draft+test; Josh approves before live triggers.
- [ ] **Member ↔ Brevo sync** — `newsletter_opt_in` → **Updates**; dashboard toggle
  or deep link later.
- [ ] **Weekly News email automation** — draft from published posts; human approves;
  schedule after approve (not autopilot until policy changes).

### Product — member directory / networking (v2 ideas)

Deferred from the first directory ship:

- **Profile photos / avatars** — Storage upload; opt-in; not public.
- **Short bio** — free-text “about me.”
- **LinkedIn / personal website URLs** (org websites already ship on multi-org profile).
- **Richer filters** — credentials, board-only, specialty keywords (practice-setting OR-filter ships with T15).
- **Officer / committee pills** — directory badges similar to Board for officers (President, President-elect, Secretary, Treasurer, Director at large, Student director at large, ASIO) and committees (Membership, Finance, Bylaws, Policy, Education, Credentialing). Admin assign UI + capability model TBD; not in T15.
- **Rate limits / anti-scrape** if harvest becomes a problem (Terms already forbid
  commercial use / bulk export of directory data).

### Product — membership & content

- **Discussion notifications (deferred)** — after member comments see real use:
  notify opted-in members (Expo push and/or Brevo email) when someone comments on
  a post they saved — not every reaction. Prefer quiet defaults + an in-app /
  dashboard toggle.
- **Policy CMS / research library (deferred)** — Policy hub MVP + access framing
  shipped 2026-08-04 (static module + PDF + levers table on `/policy`; see
  [`architecture/policy-hub.md`](architecture/policy-hub.md)). When HRSA/ATF and more
  Finals arrive: `policy_documents` table + Storage PDFs + editor permission;
  optional separate `/research` later. Keep distinct from News/Key Points. Do not
  shrink the hub to comments-only as corpus grows.
- **CME content for members** — gate SELECT on existing `is_active_member()`.
- **Board privileges** — `is_board` is badge-only today; decide board-only surfaces.
- **In-app messaging / introductions** — not built; v1 uses mailto/tel only.

### Product — platforms

- **iOS/Android launch** — TestFlight / board testing; then App Store under converted
  SAMPA org account; Android/Play later from same codebase. No in-app membership
  sales — see `docs/architecture/mobile.md`.
- **Bup dosing tool** — launch decision after clinical review hold is lifted.
  **v2 / post-launch backlog** (detail in
  [`PARK-bup-dosing-tool.md`](PARK-bup-dosing-tool.md) § Deferred):
  - Additional practice settings: **EMS**, **perinatal**, **perioperative**,
    **outpatient clinic** (beyond current ED/hospital-oriented paths).
  - **EHR copy disclaimers** — every “Copy for EHR” / pasteable summary should
    include standard CDS language: decision-support only; not medical advice;
    does not replace clinical judgment; for licensed clinicians.
  - **Source credit** — algorithm adapted from **CA Bridge / Bridge to Treatment
    (Public Health Institute)** protocols; confirm attribution wording + any
    distribution requirements before public launch.
  - **Framing research** — MDCalc and peer CDS tools for disclaimer placement
    and tone (draft notes in the PARK).

---

## Recently shipped (newest first)

- 2026-08-25 · **Frictionless Join onboarding (T35)** — PR #85. One-page `/join`; PA Member display name; AAPA yes/no; Patron +$25 add-on. Production SQL applied before merge.
- 2026-08-25 · **Jonathan Baker About card (T29)** — PR #79. Form bio + PA-C + LinkedIn; photo still existing `jonathan-baker.jpg`.
- 2026-08-21 · **Public-site click-through fixes (T30)** — PR #80. Eric Bergersen “board-certified PA”; `/join` + homepage multi-year intro 10–13% / 17–20%; `scroll-padding-top` so `#leadership` / `#programs` clear the floating nav; home SAMHSA source labeled by survey name.
- 2026-08-17 · **Homepage CAQ card + membership line (T27)** — PR #76. In-development CAQ card on homepage programs row links to live `/caq`. Membership copy on home + `/join`: members stay in the loop as the CAQ takes shape.
- 2026-08-16 · **Addiction Medicine CAQ page (T26)** — PR #74. Public `/caq` (nav, footer, About). NCCPA approved **development** after a SAMPA proposal; exam not open; dates/eligibility/fees unpublished. NCCPA issues the CAQ.
- 2026-08-07 · **Public newsletter signup (T5)** — PR #62. Large **SAMPA Updates**
  chip above footer sitewide; `api/newsletter-signup.js` → Brevo DOI → Updates
  list; `/newsletter-confirmed`; Privacy names Updates + Brevo. Live DOI needs
  Vercel env + Brevo DOI template.
- 2026-08-07 · **Brevo domain + campaign path (T3 partial)** — `addictionpas.org`
  authenticated in Brevo (SPF + domain DKIM + DMARC; branded `em.` links); senders
  `info@` + `admin@` active; catch-all **SAMPA Updates** + Test; **SAMPA Weekly
  Issue 01** branded HTML tested From info@ (draft only). Full track still In Progress
  until Landing A + first real send — see Tasks **T3** + [`PARK-brevo-email.md`](PARK-brevo-email.md).
- 2026-08-07 · **Practice settings on directory profiles** — curated multi-select
  per employer (`practice_settings` in org jsonb); soft color chips on web +
  mobile directory; OR-filter on `/members`; Other + optional note; legacy
  free-text fallback. Migration
  `supabase/migrations/2026-08-07-practice-settings-directory.sql` applied in prod.
- 2026-08-04 · **Policy hub intent copy** — levers/types framed as will/roadmap
  (not present-tense claims across unfinished levers); homepage/About/Membership
  aligned. See [`architecture/policy-hub.md`](architecture/policy-hub.md).
- 2026-08-04 · **Policy hub access framing** — hub copy + `/policy` levers table
  (federal / state / payment / systems / professional voice / evidence→standards);
  Position/Statement empty slots; keep nav **Policy** (reject “comment hub” /
  public “Advocacy” lead). Canonical write-up:
  [`architecture/policy-hub.md`](architecture/policy-hub.md).
- 2026-08-04 · **Policy hub MVP** — `/policy` + `/policy/:slug`; types Position /
  Public comment / Statement; HHS RFI public comment (PDF + summary/themes);
  501(c)(3)-safe framing; nav/footer + membership value mention. Content module
  `src/data/policyDocuments.js` (CMS deferred).
- 2026-08-04 · **Ad Grants website policy pass** — static hero (particle effect
  parked); `/about` with mission, 501(c)(3)/EIN, live + in-development programs
  (member email listed as rolling out, not live); homepage reorder
  (mission → programs → news → membership); Programs nav; Join/Donate CTAs
  restored on hero. Re-submit Google Ad Grants activation after deploy to
  www.addictionpas.org.
- 2026-07-21 · **501(c)(3) granted + donations restored** — SAMPA, Inc. EIN
  42-2288772; both `DONATIONS_ENABLED` flags on; tax-deductible boilerplate on
  `/donate`; pending copy cleared on footer, homepage donate CTA, dashboard,
  Privacy, Terms.
- 2026-07-21 · **Bup tool v2 backlog captured** — practice settings (EMS/perinatal/
  perioperative/outpatient), EHR CDS disclaimers, Bridge/PHI attribution, MDCalc
  framing notes in [`PARK-bup-dosing-tool.md`](PARK-bup-dosing-tool.md); STATUS
  board updated. Launch hold unchanged.
- 2026-07-21 · **Docs diet** — CLAUDE split into `docs/architecture/*` (under ~6k entry);
  HANDOFF thinned to front door + bus-factor accounts; GEMINI + news-blog-plan → `docs/archive/`.
- 2026-07-21 · **Repo hygiene** — STATUS catch-up after PRs #49–#51; OAuth truth; pruned merged branches.
- 2026-07-21 · **Homepage Daily News icon removed** (PR #51); **Hero scroll cue** (PR #50).
- 2026-07-19 · **Assembly hero** (PR #49) — particles assemble SAMPA wordmark; mission-
  derived copy; donations remain temp-off flag from same window.
- 2026-07-16 · **Member discussion on news** (PR #48): comments + emoji reactions (web + mobile).
- 2026-07-16 · **Ordered co-authors for news posts** (PR #47).
- 2026-07-16 · **Docs sweep: mobile status current** (PR #46).
- 2026-07-15 · **TestFlight submission + push fully configured** — build path +
  PUSH_WEBHOOK_SECRET + `push-on-publish` webhook; publish notifies opted-in devices.
- 2026-07-15 · **Mobile push + crash reporting shell** (PR #45); foreground profile
  refresh (PR #44); member directory + app identity (PR #43); Phases 0–3 (PR #22).
- 2026-07-14 · Donations temp kill-switch (`DONATIONS_ENABLED`); agency cover img2img pathway.
- 2026-07-12 · Single-board doc hygiene; Google OAuth published; security review doc;
  news pipeline operational.
- 2026-07-11 · Privacy + Terms for member directory (PR #40).
- 2026-07-10 · Multi-org profile + directory contact (PR #39); member networking
  directory + Board capability (PR #37).

---

## Doc map (humans vs agents)

| Audience | Start here | Then |
| --- | --- | --- |
| Human operator | [HANDOFF.md](HANDOFF.md) (thin) or ask an AI to walk STATUS + CLAUDE | **This file** for “what’s happening now”; setup runbooks for one-time config |
| AI agent | [CLAUDE.md](../CLAUDE.md) via [AGENTS.md](../AGENTS.md) | **This file** before planning; [architecture/](architecture/) when editing that area |
| Mid-flight agent track | This file → In flight | Thin [PARK-*.md](.) sticky note + linked specs — **not** a second backlog |
| Pre-membership security (deep) | [SECURITY-REVIEW-2026-07-12.md](SECURITY-REVIEW-2026-07-12.md) | Open P0 on **this board**; resume sticky [PARK-security-review.md](PARK-security-review.md) |
| News scout / draft pipeline | Specs + cron (see In flight) | Sticky [PARK-news-pipeline.md](PARK-news-pipeline.md); *Resume SAMPA news pipeline* |
| Bup / COWS tool | This file → In flight + backlog | Sticky [PARK-bup-dosing-tool.md](PARK-bup-dosing-tool.md) (v2 deferred); branch `feature/bup-dosing-tool`; *Resume SAMPA bup dosing tool* |
| Product history / original plan | [archive/news-blog-plan.md](archive/news-blog-plan.md) | Historical; **STATUS** supersedes “what’s next” |
| Original design brief | [archive/GEMINI.md](archive/GEMINI.md) | Historical bootstrap only |
