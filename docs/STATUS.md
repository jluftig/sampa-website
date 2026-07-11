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

**Last updated:** 2026-07-10 (PR #39 multi-org + directory contact merged)

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. **Some features still need a one-time
Supabase SQL migration** before they work end-to-end (see *Action required* below).

- **Marketing site** — homepage, about/sections, privacy & terms (⚠️ legal pages are
  drafts pending counsel review).
- **News/blog + Key Points research database** — editor dashboard, keyword browse and
  intersections, full-text search, per-claim share links and citations, social-preview
  cards. Posts are drafted via the `/sampa-post` skill.
- **Member area + Stripe memberships** — Google/magic-link sign-in, `/join` checkout,
  `/dashboard` (billing portal, profile onboarding, multi-org directory profile,
  account vs directory contact, saved articles), tiered multi-year pricing, admin
  roster with pledge tracking and CSV export. **Needs org + directory-contact SQL**
  (below) for full multi-org / alternate work email.
- **Member networking directory** — `/members` list + `/members/:id` profiles for
  **active members** (staff can browse too). Opt-out listing; share email/phone
  (account or directory-specific). Peer data only via `member_directory*` RPCs
  (profiles SELECT RLS is **not** opened to all members). Separate from the staff
  roster at `/editor/members`. **Needs DB migrations** (below).
- **Board capability** — `is_board` flag (People & permissions checkbox + directory
  badge). Further board-only privileges not built yet.
- **Donations** — public `/donate` page (one-time + monthly), separate `donations`
  ledger in Supabase, donor column on the admin roster.
- **Merch store** — nav/footer links + `/store` redirect to the Printful storefront.

### Action required (shared Supabase DB — prod + preview)

Apply these in the **Supabase SQL Editor** if not already run (order matters):

1. `supabase/migrations/2026-07-10-member-directory.sql` — directory columns + RPCs +
   `is_board` guard/audit. Without this, `/members` degrades to “not available yet”
   and directory privacy toggles may fail to save.
2. `supabase/migrations/2026-07-10-profile-organizations.sql` — multi-employer profile
   + city; updates directory RPCs. Run **after** (1). Code is on `main` (PR #39).
3. `supabase/migrations/2026-07-10-directory-contact.sql` — separate directory
   email/phone from account contact (`directory_use_account_contact`,
   `directory_email`, `directory_phone`). Run after (1)–(2).

Confirm after run: directory loads for an active member; Board checkbox appears in
People & permissions; dashboard can save multiple organizations with city/state;
directory can show a work email while sign-in stays personal.

---

## In flight (branches / local work)

- **`feature/mobile-app`** — Expo/React Native app (`mobile/` worktree). Phases 1–3:
  news, Key Points, keywords, search, saved articles, member area (profile editing,
  account deletion, CME slot), email OTP sign-in verified end-to-end. **Not merged.**
  Directory screens not built yet (web RPCs are reusable).
- **`feature/bup-dosing-tool`** — buprenorphine dosing tool + COWS calculator with
  anonymous usage analytics (`tool_events`). Built but **on launch hold** (clinical
  content — see that branch’s notes before touching).

---

## Blocked / waiting on the outside world

- **501(c)(3) determination letter** (IRS, pending). Until it arrives: keep the
  “not yet tax-deductible” disclosure on `/donate`; Google for Nonprofits can’t
  be applied for.
- **Google OAuth consent screen is in Testing mode** — only whitelisted test users
  can sign in with Google. Must be published before opening membership broadly
  (steps in `docs/member-area-setup.md`).
- **Legal pages** (`/privacy`, `/terms`) + privileged-access agreement — drafts
  awaiting attorney review / formal board adoption.

---

## Next up (prioritized product backlog)

### Config / ops (do soon)

- [ ] Apply **member-directory** migration in Supabase (if not done).
- [ ] Apply **profile-organizations** + **directory-contact** migrations (PR #39 code is merged).
- [ ] Publish Google OAuth consent screen when ready for open membership.
- [ ] Email platform — recommend **Brevo + Supabase sync** to the board (July 2026);
  interim consumer Google Group until 501(c)(3) unlocks Google for Nonprofits.
- [ ] Counsel review of privacy/terms + directory sharing defaults (opt-out listing,
  email shared by default when listed).

### Product — member directory / networking (v2 ideas)

These were explicitly deferred from the first directory ship:

- **Profile photos / avatars** — upload to Supabase Storage; show on directory cards
  and detail pages (opt-in; not public).
- **Short bio** — free-text “about me” for networking context.
- **LinkedIn / website URLs** — optional fields; same privacy model as contact.
- **Richer filters** — practice setting, credentials, board-only filter, keyword
  interests if we add specialty tags later.
- **Rate limits / anti-scrape** if email harvest becomes a problem (no CSV for
  ordinary members; Terms should forbid commercial use of directory data).
- **Mobile directory** — screens on `feature/mobile-app` calling existing RPCs.

### Product — membership & content

- **CME content for members** — gate SELECT on existing `is_active_member()`.
- **Board privileges** — `is_board` is only a badge today; decide board-only
  surfaces (documents, votes, private pages, etc.).
- **In-app messaging / introductions** — not built; v1 uses mailto/tel only.

### Product — platforms

- **iOS/Android launch** — merge `feature/mobile-app`, then app-store work (Sign in
  with Apple; no in-app membership sales — see `CLAUDE.md` mobile section).
- **Bup dosing tool** — launch decision after clinical review hold is lifted.

---

## Recently shipped (newest first)

- 2026-07-10 · **Multi-organization profile + directory contact** — PR #39: multiple
  employers (role, city, state, website); account contact vs directory profile;
  optional work email for peers. Migrations: `profile-organizations` +
  `directory-contact` (after member-directory SQL).
- 2026-07-10 · **Member networking directory** (`/members`, privacy toggles,
  `member_directory*` RPCs) + **Board** capability (`is_board`) — PR #37. DB
  migration must be applied for full function.
- 2026-07-10 · Nav CTA shortened to “Join” (PR #38); homepage donate section
  simplified (PR #36).
- 2026-07-10 · WCAG AA text contrast: `primary-text` teal token (PR #34). Project
  docs layer: this file, `AGENTS.md`, `README.md`.
- 2026-07-09 · Donor column on the members roster (PR #33) + donations in handoff
  (PR #32).
- 2026-07-08 · Merch store links to Printful (PR #31); source citations hyperlink
  only the DOI (PR #30).
- 2026-07-07 · Purchased-term tracking on roster/pledges; privileged-access
  agreement + audit log; checkbox permissions; `/sampa-post` skill improvements.
- 2026-07-06 · Member area + Stripe memberships built; donations built.

---

## Doc map (humans vs agents)

| Audience | Start here | Then |
| --- | --- | --- |
| Human operator | [HANDOFF.md](HANDOFF.md) | This file for “what’s happening now”; [member-area-setup.md](member-area-setup.md) for Stripe/OAuth |
| AI agent | [CLAUDE.md](../CLAUDE.md) (via [AGENTS.md](../AGENTS.md)) | This file before planning work; update this file when finishing significant work |
| Product history / original plan | [news-blog-plan.md](news-blog-plan.md) | Historical; STATUS supersedes “what’s next” |
