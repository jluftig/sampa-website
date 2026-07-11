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

**Last updated:** 2026-07-11 (directory stack + privacy/terms on main; confirm SQL applied)

---

## Live in production — www.addictionpas.org

Code is on `main` and auto-deploys via Vercel. **Directory / multi-org / alternate
directory email need the Supabase migrations below** if not already run on the
shared DB (prod + preview share one project).

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

### Action required (shared Supabase DB — prod + preview)

Confirm these have been run in the **Supabase SQL Editor** (order matters; safe to
re-run if unsure — migrations are additive/idempotent):

1. `supabase/migrations/2026-07-10-member-directory.sql` — directory columns + RPCs +
   `is_board` guard/audit. Without this, `/members` degrades to “not available yet”.
2. `supabase/migrations/2026-07-10-profile-organizations.sql` — multi-employer
   `organizations` jsonb + city; directory RPC shape. Code on `main` (PR #39).
3. `supabase/migrations/2026-07-10-directory-contact.sql` — `directory_use_account_contact`,
   `directory_email`, `directory_phone` + RPC contact resolution.

**Smoke check after SQL:** active member opens Directory; can save 2+ orgs with role
and bare domain website; can uncheck “use account contact” and set a work email;
Privacy/Terms pages load with July 11 effective date.

---

## In flight (branches / local work)

- **`feature/mobile-app`** — Expo/React Native (`mobile/` worktree). Phases 1–3: news,
  Key Points, keywords, search, saved articles, member area, email OTP. **Draft PR
  #22 — not merged.** Directory screens not built yet (web RPCs are reusable).
- **`feature/bup-dosing-tool`** — buprenorphine dosing + COWS calculator with anonymous
  usage analytics (`tool_events`). Built but **on launch hold** (clinical content).

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

---

## Next up (prioritized product backlog)

### Config / ops (do soon)

- [ ] Confirm all three directory-related Supabase migrations applied (see above).
- [ ] Publish Google OAuth consent screen when ready for open membership.
- [ ] Email platform — recommend **Brevo + Supabase sync** to the board (July 2026);
  interim consumer Google Group until 501(c)(3) unlocks Google for Nonprofits.
- [ ] Optional: board skim of privacy/terms (already emailed informally about the directory).

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

- **CME content for members** — gate SELECT on existing `is_active_member()`.
- **Board privileges** — `is_board` is badge-only today; decide board-only surfaces.
- **In-app messaging / introductions** — not built; v1 uses mailto/tel only.

### Product — platforms

- **iOS/Android launch** — merge `feature/mobile-app`, then app-store work (Sign in
  with Apple; no in-app membership sales — see `CLAUDE.md` mobile section).
- **Bup dosing tool** — launch decision after clinical review hold is lifted.

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

---

## Doc map (humans vs agents)

| Audience | Start here | Then |
| --- | --- | --- |
| Human operator | [HANDOFF.md](HANDOFF.md) | This file for “what’s happening now”; [member-area-setup.md](member-area-setup.md) for Stripe/OAuth |
| AI agent | [CLAUDE.md](../CLAUDE.md) (via [AGENTS.md](../AGENTS.md)) | This file before planning work; update this file when finishing significant work |
| Product history / original plan | [news-blog-plan.md](news-blog-plan.md) | Historical; STATUS supersedes “what’s next” |
