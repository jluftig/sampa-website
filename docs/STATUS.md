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

**Last updated:** 2026-08-04 (Ad Grants website policy pass — static hero, /about, programs)

**Doc roles (one board — not three sources of truth):**

| Doc | Role |
|-----|------|
| **This file (`STATUS.md`)** | **Only product board** — live / in flight / blocked / next / backlog |
| **`CLAUDE.md` + `docs/architecture/`** | How the system works / must not break |
| **`HANDOFF.md`** | Thin human front door + bus-factor accounts — not a second manual |
| **`PARK-*.md`** | Thin **agent sticky note** (resume phrase + next 1–4 steps + links here) |
| **Specs / dated reviews** | How it works / findings snapshot — open work stays on this board |
| **`docs/archive/`** | Historical only |

**Write path:** state change → **STATUS first** → CLAUDE/architecture if design/security changed → PARK only if track still mid-flight (slim) → HANDOFF only if bus-factor/front-door changed.  
If the same “what’s next” list appears in three files, **keep STATUS and delete the extras**.  
**GitHub `main`** — source of truth across laptop + Mac Studio; pull → work → push.

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. Shared Supabase DB (prod + preview).

- **Marketing site** — homepage, dedicated **`/about`** page, privacy & terms
  (effective **July 11, 2026**; member directory fully disclosed; self-published
  for a small nonprofit — no outside counsel). **Ad Grants pass (2026-08-04):**
  501(c)(3) + EIN prominent on hero/about; mission + programs (live news/directory;
  in-development member email, practice resources, CME, job board — no empty landing pages);
  Join/Donate CTAs in hero; nav About → `/about`, Programs → `/#programs`.
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
  **ON (2026-07-21):** restored after IRS 501(c)(3) determination for SAMPA, Inc.
  (EIN 42-2288772). `DONATIONS_ENABLED = true` in `src/lib/features.js` **and**
  `api/create-donation-session.js`. Donate page shows tax-deductible boilerplate.
- **Merch store** — nav/footer links + `/store` redirect to the Printful storefront.
- **Mobile app code on main** — Expo app in `mobile/` (PRs #22, #43–#45); see In flight
  for TestFlight / App Store rollout status (not a “messy branch” — shipped code,
  external rollout still open).

### DB migrations applied (directory stack, 2026-07-11)

Operator confirmed the directory stack SQL was run in Supabase (shared DB):

1. `supabase/migrations/2026-07-10-member-directory.sql`
2. `supabase/migrations/2026-07-10-profile-organizations.sql`
3. `supabase/migrations/2026-07-10-directory-contact.sql`

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
- **News scout → auto-draft pipeline (Hermes / Egg)** — **Operational.**
  Daily cron **6:00 AM PT, 7 days/week** (job `1f55242ea122`): scout → up to **3**
  OA-preferred drafts → editor briefing + menu on Telegram → human Publish only
  (**never auto-publish**). Sticky: [`PARK-news-pipeline.md`](PARK-news-pipeline.md).
  Resume: *Resume SAMPA news pipeline* (tuning/bugs only unless reopened).
- **Email / Brevo campaigns (Hermes + repo)** — **Scaffolded 2026-08-03; not sending yet.**
  Lives **in this repo** (not a sibling project): architecture
  [`architecture/email-brevo.md`](architecture/email-brevo.md), sticky
  [`PARK-brevo-email.md`](PARK-brevo-email.md), CLI `scripts/run-brevo.sh`,
  repo skill `.claude/skills/sampa-email/`, Hermes skill `sampa-brevo-email`.
  **Lists (v1):** Announcements, Weekly News, Policy, Jobs, CME, Test.
  **From:** SAMPA `info@addictionpas.org` → Kelsey. Auth stays `no-reply@` SMTP.
  **Agent:** draft + test only; mass send only on explicit approve or Brevo UI.
  **Weekly News:** Mon **5:30 AM PT** after human approves draft (schedule, not autopilot).
  **Google Group ~130:** Landing **A** (confirm prefs) — see
  [`email/google-group-import.md`](email/google-group-import.md).
  **First campaign:** new site + membership (`docs/email/templates/site-membership-launch.*`).
  **Next:** API key in Hermes `.env`, create lists + pref center, Test seed, import, test send.
  Resume: *Resume SAMPA Brevo email*.

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
- [ ] **Email / Brevo campaigns (in flight)** — decisions locked; scaffold in repo
  2026-08-03. Still need: `BREVO_API_KEY`, lists + preference center, Test contacts,
  Google Group Landing A import, first site/membership campaign test→send.
  See In flight + [`PARK-brevo-email.md`](PARK-brevo-email.md).
  **Already live:** domain auth + Supabase auth SMTP via `no-reply@addictionpas.org`.
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

- [ ] **Footer social links** — Instagram (and eventually Twitter/X) icons/links in
  the site footer so visitors can find SAMPA’s social accounts. Need final
  profile URLs when ready; X can wait until the account exists. Touch
  `src/components/Footer.jsx` (and optionally nav).
- [ ] **Newsletter signup without membership** — public multi-list signup (footer
  and/or homepage) → **Brevo DOI**; lists: Announcements / Weekly News / Policy /
  Jobs / CME. Privacy: name lists + Brevo; link `/privacy`. No forced membership.
  Prefer center for topic picks; full unsub always. **Exit interview after full
  unsub = backlog** (never block unsub). Merge with member account later by email.
- [ ] **Member ↔ Brevo sync** — `newsletter_opt_in` → Announcements + Weekly News;
  finer prefs via Brevo/center; dashboard multi-toggle or deep link later.
- [ ] **Weekly News email automation** — draft from published posts; human approves;
  schedule Mon 5:30 AM PT (not autopilot until policy changes).

### Product — member directory / networking (v2 ideas)

Deferred from the first directory ship:

- **Profile photos / avatars** — Storage upload; opt-in; not public.
- **Short bio** — free-text “about me.”
- **LinkedIn / personal website URLs** (org websites already ship on multi-org profile).
- **Richer filters** — practice setting, credentials, board-only, specialty keywords.
- **Rate limits / anti-scrape** if harvest becomes a problem (Terms already forbid
  commercial use / bulk export of directory data).

### Product — membership & content

- **Discussion notifications (deferred)** — after member comments see real use:
  notify opted-in members (Expo push and/or Brevo email) when someone comments on
  a post they saved — not every reaction. Prefer quiet defaults + an in-app /
  dashboard toggle.
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
