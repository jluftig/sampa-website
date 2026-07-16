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

**Last updated:** 2026-07-15 (mobile: Phase 4 push shipped + configured; TestFlight build 1 in beta review, build 2 building)

**Doc roles (one board — not three sources of truth):**

| Doc | Role |
|-----|------|
| **This file (`STATUS.md`)** | **Only product board** — live / in flight / blocked / next / backlog |
| **`HANDOFF.md`** | Human **how-to** — not a second backlog |
| **`PARK-*.md`** | Thin **agent sticky note** (resume phrase + next 1–4 steps + links here) |
| **Specs / dated reviews** | How it works / findings snapshot — open work stays on this board |
| **`CLAUDE.md` / `AGENTS.md`** | Architecture + this workflow for agents |

**Write path:** state change → **STATUS first** → HANDOFF only if procedure changed → PARK only if track still mid-flight (slim) → specs only if design/findings changed.  
If the same “what’s next” list appears in three files, **keep STATUS and delete the extras**.  
**GitHub `main`** — source of truth across laptop + Mac Studio; pull → work → push.

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. Shared Supabase DB (prod + preview).

- **Marketing site** — homepage, about/sections, privacy & terms (effective
  **July 11, 2026**; member directory fully disclosed; self-published for a small
  nonprofit — no outside counsel). **Homepage copy (2026-07-14):** outcomes for
  individuals/communities first; daily news + member networking as live offers;
  education/CME not the front pitch.
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

---

## In flight (branches / local work)

- **`feature/post-coauthors`** — multi-author news posts (ordered `post_authors`,
  editor-only picker, denormalized `author_name` byline). Migration:
  `supabase/migrations/2026-07-15-post-authors.sql` (run before merge). Article
  page only for v1; mobile keeps reading `author_name`.
- **Mobile app — TestFlight rollout** (`mobile/` on main; PRs #22 #43 #44 #45 all
  merged; every feature device-verified on Josh's iPhone). Built: news/Key Points/
  keywords/search/saved, auth (Apple + Google + email code via Brevo, Face ID lock,
  encrypted sessions), member area + account deletion, **member directory**, real
  logo + app icon/splash, **push notifications (fully configured — publish → phones)**,
  Sentry (dormant, needs DSN). **Now:** TestFlight build 1 waiting for Apple beta
  review ("SAMPA Board" external group ready); build 2 (adds push + foreground
  refresh) building/uploading. **Remaining:** invite board when review clears; Sentry
  account + `EXPO_PUBLIC_SENTRY_DSN`; delete-account E2E test (throwaway account —
  endpoint is live); SAMPA D-U-N-S → convert Apple account Individual → org before
  public App Store launch; App Store submission (Phase 5); Android later (same
  codebase); bup tool port after the CA Bridge permission hold lifts.
- **`feature/bup-dosing-tool`** — buprenorphine dosing + COWS calculator with anonymous
  usage analytics (`tool_events`). Built but **on launch hold** (clinical content).
- **Member comments on news** — **Not started (parked 2026-07-15).** Members comment on articles; design TBD (RLS, visibility, moderation). Thin resume: [`PARK-member-comments.md`](PARK-member-comments.md). Resume phrase: *Resume SAMPA member comments*.
- **Pre-membership security review** — **Parked mid-stream (2026-07-12 evening).**
  Code/schema health check written: [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md).
  Thin resume: [`PARK-security-review.md`](PARK-security-review.md).
  **Done this pass:** OAuth **published**; single-board STATUS/HANDOFF/PARK hygiene.
  **Next P0 when resumed:** Vercel Production Stripe/webhook/Supabase elevated keys;
  E2E join → webhook → directory; non-member blocked; no self-admin.
  Resume phrase: *Resume SAMPA security review*.
- **News scout → auto-draft pipeline (Hermes / Egg)** — **Operational / park for
  monitoring (2026-07-12 evening).** Daily cron **6:00 AM PT, 7 days/week** (job
  `1f55242ea122`): scout → up to **3 OA-preferred drafts** → editor briefing + menu
  on Telegram → human Publish only (**never auto-publish**). Insert path:
  `scripts/run-insert-draft.sh` + profile skill `sampa-news-pipeline`. Style guides:
  article H2 structure, agency covers + stock library, prior-art rules.
  Thin resume: [`PARK-news-pipeline.md`](PARK-news-pipeline.md).
  Resume phrase: *Resume SAMPA news pipeline* (tuning/bugs only unless reopened).
  **Agency covers:** prefer Hermes `image_gen.provider: xai` (SuperGrok / Grok Imagine
  edit) with dual-talon gold PNG as reference — see backlog item marked done 2026-07-14.

---

## Blocked / waiting on the outside world

- **501(c)(3) determination letter** (IRS, pending). Until it arrives: keep the
  “not yet tax-deductible” disclosure on `/donate`; Google for Nonprofits can’t
  be applied for.
- **Privileged-access agreement** (staff roster) — still informal; formal board
  adoption optional when the board wants a signed policy track.

---

## Next up (prioritized product backlog)

### Config / ops (do soon)

- [x] Directory-related Supabase migrations applied (member-directory, profile-organizations, directory-contact) — 2026-07-11.
- [x] News draft pipeline secrets + insert script + daily cron (6am PT 7d) on Hermes Egg profile — 2026-07-12.
- [ ] **Pre-membership security P0** (remaining) — Vercel Production env + Stripe
  live webhook + E2E membership path; see [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md)
  / [`PARK-security-review.md`](PARK-security-review.md).
- [x] Publish Google OAuth consent screen — operator-confirmed **2026-07-12** (not Testing).
- [ ] Email platform — recommend **Brevo + Supabase sync** to the board (July 2026);
  interim consumer Google Group until 501(c)(3) unlocks Google for Nonprofits.
  **Head start done 2026-07-15:** Brevo account exists, `addictionpas.org` domain
  authenticated (DKIM/DMARC at Porkbun), and Supabase **auth emails** already send
  via Brevo SMTP from no-reply@addictionpas.org. Campaign side still pending board.
- [ ] **Sentry account** (free) + `EXPO_PUBLIC_SENTRY_DSN` in mobile/.env.local and the
  EAS build env — turns on mobile crash reporting (code already merged, dormant).
- [ ] **SAMPA D-U-N-S number** (free, developer.apple.com/enroll/duns-lookup) → convert
  the Apple Developer account Individual → SAMPA organization **before public App
  Store launch** (publisher shows "SAMPA"; unlocks nonprofit fee waiver post-501(c)(3)).
- [ ] **Mobile delete-account E2E test** with a throwaway account (endpoint live).
- [ ] Optional: board skim of privacy/terms (already emailed informally about the directory).

### Product — news pipeline

- [x] **Agency cover image-to-image / reference pathway** — **done 2026-07-14.**
  Hermes Egg `image_gen.provider: xai` (Grok Imagine / SuperGrok OAuth) supports
  edit via `grok-imagine-image-quality` with the dual-talon gold PNG as
  `image_url` (`docs/assets/cover-agency-reference-dual-talon-7oh.png`). Proven
  with lockup **MOUD** → resized 1600×900 → Supabase `post-images` → draft
  `cover_image_url` on DEA final-rule post
  (`a6bde566-7040-440e-a33b-168bf44b2fb2`). **Not FAL_KEY / SuperGrok:** FAL is a
  separate account; Nous FAL proxy still 403s `…/klein/9b/edit` — leave FAL as
  optional later. **Default for agency covers:** xAI img2img + house master
  prompt; QA (no emblem text, both talons, exact lockup); text-to-image fallback
  if xAI edit fails. Caption pattern: *Editorial illustration: stylized dual-talon
  emblem and [LOCKUP]; not an official seal.*

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

- **iOS/Android launch** — TestFlight beta review in progress (see In flight); after
  board testing: App Store submission (screenshots, description, category) under the
  converted SAMPA org account; then Android/Play from the same codebase. No in-app
  membership sales — see `CLAUDE.md` mobile section.
- **Bup dosing tool** — launch decision after clinical review hold is lifted.

---

## Recently shipped (newest first)

- 2026-07-15 · **TestFlight submission + push fully configured** — build 1 uploaded &
  submitted for beta review ("SAMPA Board" external group, review notes, test info);
  PUSH_WEBHOOK_SECRET set in Vercel + `push-on-publish` Supabase webhook created →
  publishing a post now notifies opted-in devices end-to-end; build 2 (push + APNs key
  + foreground refresh) kicked off. Apple Developer enrollment complete (Individual).
- 2026-07-15 · **Mobile push notifications + crash reporting** (PR #45): device_tokens
  + push_opt_in (SQL applied), api/send-push.js (DB-webhook triggered, secret-authed,
  self-healing tokens), in-app alerts toggle + tap-to-article; Sentry armed by env var.
- 2026-07-15 · **Mobile foreground profile refresh** (PR #44): membership paid on the
  website appears in the app on next foreground (closes the join-flow seam).
- 2026-07-15 · **Mobile member directory + app identity** (PR #43): Members tab +
  member profiles calling the self-gating `member_directory*` RPCs (search, state
  filter, tappable shared contact); tab order News/Keywords/Saved/Members/Account;
  real SAMPA logo in-app (theme-aware SVG); app icon + splash (light/dark) + Android
  adaptive icons generated from the logo — TestFlight-ready identity.
- 2026-07-15 · **Mobile app Phases 0–3 merged** (PR #22): Expo iOS/Android app in
  `mobile/` — news/Key Points/keywords/search/saved, auth (Apple + Google + email OTP
  via Brevo SMTP, Face ID lock, encrypted sessions), member area + in-app account
  deletion (`api/delete-account.js`, the sole website change). All device-verified on
  a physical iPhone via EAS dev build.
- 2026-07-12 · **Single-board doc hygiene** — STATUS = only product board; HANDOFF how-to; PARK sticky notes; workflow in AGENTS.md + CLAUDE.md.
- 2026-07-12 · **Google OAuth consent published** (operator-confirmed; docs/STATUS/security review updated off Testing).
- 2026-07-12 · **Security review doc** pre-membership (`SECURITY-REVIEW-2026-07-12.md`);
  news pipeline operational (Hermes cron, insert scripts, H2 + agency cover + stock + prior-art docs).
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

---

## Doc map (humans vs agents)

| Audience | Start here | Then |
| --- | --- | --- |
| Human operator | [HANDOFF.md](HANDOFF.md) (how) | **This file** for “what’s happening now”; [member-area-setup.md](member-area-setup.md) for one-time Stripe/OAuth config |
| AI agent | [CLAUDE.md](../CLAUDE.md) via [AGENTS.md](../AGENTS.md) | **This file** before planning; update **this file** on state change (single board) |
| Mid-flight agent track | This file → In flight | Thin [PARK-*.md](.) sticky note + linked specs — **not** a second backlog |
| Pre-membership security (deep) | [SECURITY-REVIEW-2026-07-12.md](SECURITY-REVIEW-2026-07-12.md) | Open P0 on **this board**; resume sticky [PARK-security-review.md](PARK-security-review.md) |
| News scout / draft pipeline | Specs + cron (see In flight) | Sticky [PARK-news-pipeline.md](PARK-news-pipeline.md); *Resume SAMPA news pipeline* |
| Product history / original plan | [news-blog-plan.md](news-blog-plan.md) | Historical; **STATUS** supersedes “what’s next” |
