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

**Last updated:** 2026-07-10 (member networking directory + Board capability)

## Live in production — www.addictionpas.org

- **Marketing site** — homepage, about/sections, privacy & terms (⚠️ legal pages are
  drafts pending counsel review).
- **News/blog + Key Points research database** — editor dashboard, keyword browse and
  intersections, full-text search, per-claim share links and citations, social-preview
  cards. Posts are drafted via the `/sampa-post` skill.
- **Member area + Stripe memberships** — Google/magic-link sign-in, `/join` checkout,
  `/dashboard` (billing portal, profile onboarding, saved articles), tiered
  multi-year pricing, admin roster with pledge tracking and CSV export.
- **Donations** — public `/donate` page (one-time + monthly), separate `donations`
  ledger in Supabase, donor column on the admin roster.
- **Merch store** — nav/footer links + `/store` redirect to the Printful storefront.

## In flight (work on unmerged branches)

- **Member networking directory + Board flag** — `/members` peer directory (opt-out
  listing, share email/phone controls on dashboard), `is_board` capability (badge +
  AdminPeople checkbox; privileges TBD). Code ready; **requires running**
  `supabase/migrations/2026-07-10-member-directory.sql` in the Supabase SQL editor
  before the directory works in prod/preview. Separate from staff roster
  (`/editor/members`).
- **`feature/mobile-app`** — Expo/React Native app (lives in `mobile/` on that
  branch, shares web `src/lib` code). Phases 1–3 done: news, Key Points, keywords,
  search, saved articles, member area (profile editing, account deletion, CME slot),
  email OTP sign-in verified end-to-end. Not merged; checked out in a git worktree.
- **`feature/bup-dosing-tool`** — buprenorphine dosing tool + COWS calculator with
  anonymous usage analytics (`tool_events`). Built, but **on launch hold** (clinical
  content — see that branch's CLAUDE.md notes before touching).

## Blocked / waiting on the outside world

- **501(c)(3) determination letter** (IRS, pending). Until it arrives: keep the
  "not yet tax-deductible" disclosure on `/donate`, and Google for Nonprofits can't
  be applied for.
- **Google OAuth consent screen is in Testing mode** — only whitelisted test users
  can sign in with Google. Must be published before opening membership broadly
  (steps in `docs/member-area-setup.md`).
- **Legal pages** (`/privacy`, `/terms`) — drafts awaiting attorney review.

## Next up

- **Apply member-directory migration** — run
  `supabase/migrations/2026-07-10-member-directory.sql` once in Supabase SQL
  editor (shared DB for prod + preview).
- **Email platform** — recommend Brevo + Supabase sync to the board (July 2026);
  interim consumer Google Group until the 501(c)(3) letter unlocks Google for
  Nonprofits.
- **CME content for members** — gate on the existing `is_active_member()` rule.
- **Board privileges** — `is_board` flag is in place; decide what board-only
  surfaces need (beyond the directory badge).
- **iOS/Android launch** — merge `feature/mobile-app`, then app-store work
  (Sign in with Apple, no in-app membership sales — see CLAUDE.md mobile section).
  Directory RPCs are mobile-ready once the app adds `/members` screens.

## Recently shipped (newest first)

- 2026-07-10 · Member networking directory (`/members`, privacy toggles, directory
  RPCs) + Board capability flag (`is_board`) — code complete; DB migration must
  be applied before go-live.
- 2026-07-10 · WCAG AA text contrast: new `primary-text` teal token swept across all
  functional text/buttons/chips (PR #34). Project docs layer added: this file,
  `AGENTS.md`, `README.md`.
- 2026-07-09 · Donor column on the members roster (PR #33) + donations documented in
  the handoff guide (PR #32).
- 2026-07-08 · Merch store links to Printful (PR #31); source citations hyperlink
  only the DOI (PR #30).
- 2026-07-07 · Purchased-term tracking on roster/pledges; privileged-access
  agreement + audit log; checkbox permissions; `/sampa-post` skill improvements.
- 2026-07-06 · Member area + Stripe memberships built; donations built.
