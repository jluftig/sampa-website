# CLAUDE.md — AI/LLM architecture reference

Machine-oriented entry point for agents on the SAMPA website.  
**Board (what’s live / next):** [`docs/STATUS.md`](docs/STATUS.md) — update on state change.  
**Human front door:** [`docs/HANDOFF.md`](docs/HANDOFF.md) (thin — prefers agent walkthrough).  
**Deep dives:** [`docs/architecture/`](docs/architecture/).  
`AGENTS.md` points here for non-Claude agents.

Last updated: 2026-07-21 (docs diet — split architecture; slim HANDOFF).

## What this project is

Marketing site for **SAMPA** (Society of Addiction Medicine **Physician Associates** —
never “physician assistants” in user-facing copy) **plus** News/blog + Key Points research
DB, member area (Stripe), peer member directory, public donations, and an Expo mobile app
sharing the same Supabase project.

Stack: Vite + React 18 + Tailwind · Supabase · Stripe via Vercel `api/` · Vercel hosting  
(`main` → www.addictionpas.org; every branch → preview).

Repo: `jluftig/sampa-website`. Supabase ref: `xbzzawjnphpnexwfjtif`.

## Doc map (single board)

| Doc | Role |
|-----|------|
| **`docs/STATUS.md`** | **Only product board** |
| **`CLAUDE.md`** (this file) | Invariants, gotchas, short map — load first |
| **`docs/architecture/*`** | Repo map, data model, RLS, Stripe, mobile |
| **`docs/HANDOFF.md`** | Thin human front door + bus-factor accounts |
| **`docs/PARK-*.md`** | Mid-flight stickies only |
| Setup runbooks | `member-area-setup.md`, `mobile-app-setup.md` |
| News production | scout/post/cover prompts under `docs/` |
| Archive | `docs/archive/` (GEMINI bootstrap, original news plan) |

**Write path:** STATUS first → architecture/CLAUDE if design/security changed → PARK only if mid-flight → HANDOFF only if bus-factor/accounts list changed.

## Commands

- `npm run dev` — Vite :5173 (`.claude/launch.json` may use 5174)
- `npm run build` / `npm run preview`
- No test suite or linter configured
- `api/` does **not** run under Vite — use Vercel preview or `vercel dev`

## Environment

**Client (Vite, safe to expose — RLS is the boundary):**  
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`sb_publishable_…`)  
Local: `.env.local`. Missing → blank page.

**Server (Vercel only, never `VITE_`):**  
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (or Secret key),  
optional `SUPABASE_URL`, `STRIPE_PRICE_<TIER>_<1Y|2Y|3Y|LIFETIME>`, `PUSH_WEBHOOK_SECRET`

## Short map

| Path | Job |
|------|-----|
| `api/` | Checkout, portal, webhook, donate session, delete-account, send-push, share OG |
| `src/lib/` | Supabase client, auth context, membership tiers, comments (shared w/ mobile) |
| `src/pages/` | Public, member, editor, admin routes |
| `supabase/schema.sql` | **DDL + RLS source of truth** |
| `mobile/` | Expo app — see `docs/architecture/mobile.md` + `mobile/AGENTS.md` |

Full tree + routes: **`docs/architecture/repo-map.md`**.

## Security (do not weaken)

- **RLS is the only real authz boundary.** Client checks = UX only.
- Peer directory via **`member_directory*` RPCs only** — never open `profiles` SELECT to all members.
- **`guard_profile_role`** blocks self-grant of role/membership; webhook is sole membership writer.
- Public aggregates must filter **`status='published'`** in app **and** in SQL RPCs (editors can see drafts via RLS).
- No service_role / elevated key in client or `VITE_*`.

Detail: **`docs/architecture/security-rls.md`**.  
Data shapes: **`docs/architecture/data-model.md`**.  
Stripe/membership/donations: **`docs/architecture/member-stripe.md`**.

## Conventions & gotchas (read before editing)

1. **Terminology:** UI/URLs = **keyword**; DB/code = **tag**. Keep the split.
2. **Public pages filter `published` explicitly** — do not rely on RLS alone (admin draft leak bug history).
3. **Vite inlines env at build** — Vercel env changes need redeploy.
4. **`vercel.json` SPA rewrite** required or deep links / OAuth return 404.
5. **Key Points save is diff-by-id** — never replace-all; `items.id` are permanent `#point-` share targets.
6. **Tag slugs immutable** in UI.
7. **RichTextEditor uncontrolled after mount** — load data before mount (`initialContent`).
8. **PostView** hides drafts even from editors (notfound).
9. **React.lazy** keeps TipTap/DOMPurify off the public homepage bundle.
10. **Migrations:** edit idempotent `schema.sql` **and** add `supabase/migrations/…`. One shared DB prod+preview. **Do not** casually re-run full schema seed (overwrites keyword labels). **Clipboard:** `pbcopy < supabase/migrations/<file>.sql` and tell the operator it’s ready for SQL Editor.
11. **Tier keys** sync three ways: `src/lib/membership.js`, `api/_lib/tiers.js`, `STRIPE_PRICE_*` env.
12. **AuthContext** uses `select('*')` on profiles — tolerate additive migrations.
13. **New RPCs** degrade gracefully if missing; still prefer migrate-before-code.
14. **Social previews:** crawler UA rewrite to `api/share.js` only — never browsers.
15. **Mobile shared lib:** `sampa-shared` → `src/lib`; no DOM/Vite-only code there.
16. **No IAP** for memberships on iOS — website checkout only.

## Rollback (short)

- Deleting merged branches is lossless.  
- Prod emergency: Vercel → prior deployment (Instant Rollback).  
- Git: `git revert` on `main`, never force-push rewrite.  
- **Code and DB roll back separately** — additive migrations; apply SQL before dependent code.

## Do / Don’t

- DO enforce authz in SQL/RLS; treat client as untrusted.  
- DO keep `schema.sql` idempotent source of truth.  
- DO `pbcopy` migrations; update **STATUS** when work ships.  
- DO load architecture docs when editing that subsystem.  
- DON’T expose elevated keys client-side or weaken RLS “to make a query work.”  
- DON’T rename DB `tags`→`keywords` or make tag slugs editable.  
- DON’T invent a second roadmap outside STATUS.
