# CLAUDE.md — AI/LLM Hand-off & Architecture Reference

Machine-oriented reference for working on the SAMPA website. Optimized for an agent
picking up this repo cold. Human-oriented operations guide: `docs/HANDOFF.md`.
Original build plan/decisions: `docs/news-blog-plan.md`. Original design brief: `GEMINI.md`.

Last updated: 2026-07-06.

## What this project is

Marketing site for SAMPA (Society for Addiction Medicine PAs) **plus** a News/blog
subsystem with editor authentication and a keyword-searchable "Key Points" database,
**plus** a member area (dashboard, saved articles, profile onboarding) with Stripe
membership payments. Single-page React app; DB/auth/storage are Supabase; Stripe runs
through Vercel serverless functions in `api/`.

## Stack & hosting

- **Frontend:** Vite + React 18, React Router v6 (`BrowserRouter`), Tailwind CSS.
- **Libs:** `@supabase/supabase-js` (DB/auth/storage), `@tiptap/*` (rich-text editor,
  editor-only), `dompurify` (sanitize post HTML on render), `gsap` (homepage animation),
  `lucide-react` (icons), `stripe` (SERVER-side only, imported only from `api/`).
- **Backend:** Supabase project ref `xbzzawjnphpnexwfjtif` (Postgres + Auth + Storage)
  + Vercel serverless functions in `api/` (Stripe checkout / portal / webhook).
- **Auth:** Google OAuth + email magic link (Supabase providers). Google consent screen
  currently in **Testing** mode → only whitelisted "test users" can sign in. Publish
  before opening to members. One-time config steps: `docs/member-area-setup.md`.
- **Payments:** Stripe annual subscriptions, sign-in-first: `/join` →
  `/api/create-checkout-session` (stamps `client_reference_id` = Supabase user id) →
  Stripe Checkout → `/api/stripe-webhook` writes membership columns on `profiles`.
  The Stripe↔Supabase link is the user id, NEVER email matching. Stripe = source of
  truth for billing; the app renders only from Supabase. Billing self-service = Stripe
  Customer Portal via `/api/create-portal-session` (we build no payment UI).
- **Hosting:** Vercel. `main` → production (www.addictionpas.org). Every branch → preview URL.
- **Repo:** GitHub `jluftig/sampa-website`.

## Commands

- `npm run dev` — Vite dev server (default port 5173; `.claude/launch.json` uses 5174 for previews).
- `npm run build` — production build. `npm run preview` — serve the build.
- No test suite or linter configured.

## Environment variables

**Client (build-time, `import.meta.env`, inlined by Vite, safe to expose — RLS enforces
security):**
- `VITE_SUPABASE_URL` = `https://xbzzawjnphpnexwfjtif.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`

Local: `.env.local` (gitignored). Prod/preview: Vercel → Settings → Environment Variables
(set for Production AND Preview). Missing vars → `supabaseClient.js` throws at import → blank
page.

**Server (Vercel env vars WITHOUT the VITE_ prefix; read via `process.env` in `api/` only —
NEVER client-side, never in a VITE_ var):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (+ optional `SUPABASE_URL`; falls back to `VITE_SUPABASE_URL`)
- `STRIPE_PRICE_FELLOW|SUSTAINING|ASSOCIATE|LEGACY|STUDENT|PREPA` — Stripe Price ids per
  membership tier (mapping in `api/_lib/tiers.js`; tier keys in `src/lib/membership.js`)

## Repo map

```
api/                        Vercel serverless functions (Web-handler signature: export POST)
  _lib/clients.js           stripeClient(), supabaseAdmin() (service role), requireUser(JWT), json()
  _lib/tiers.js             tier key -> STRIPE_PRICE_* env mapping
  create-checkout-session.js POST {tier} -> {url}; JWT required; client_reference_id = user id
  create-portal-session.js  POST -> {url} of Stripe Customer Portal; JWT required
  stripe-webhook.js         Stripe events -> membership columns on profiles (ONLY writer)
src/
  main.jsx                  BrowserRouter > AuthProvider > App
  App.jsx                   Routes (lazy-loaded except Home); catch-all NotFound
  lib/
    supabaseClient.js       single shared Supabase client
    AuthContext.jsx         session + profile; useAuth() -> {user, profile, role, isEditor, isAdmin, isActiveMember, loading, signInWithGoogle(next), signInWithEmail(email,next), signOut, refreshProfile}
    membership.js           MEMBERSHIP_TIERS (tier keys/names/prices) — keep in sync with api/_lib/tiers.js
    api.js                  apiPost(path, body) — calls /api/* with the Supabase JWT
    useFavorites.js         saved-post ids + optimistic toggle for the signed-in user
    tags.js                 collectPostTags(post) — dedupe a post's keywords from nested items
    slug.js                 slugify()
    format.js               formatDate()
  components/
    RequireEditor.jsx       route guard; prop adminOnly restricts to admins
    RequireAuth.jsx         route guard: any signed-in user (member area)
    Navbar.jsx Footer.jsx   nav; section links are /#anchor so they work off-home
    RichTextEditor.jsx      TipTap wrapper (bold/italic/H2/H3/lists/quote/link)
    LegalPage.jsx           shared shell for /privacy and /terms
    PostCard.jsx TagChip.jsx NewsTeaser.jsx ScrollToTop.jsx Membership.jsx
  pages/
    Home.jsx                marketing homepage (was App) + NewsTeaser + Membership section
    News.jsx                /news — published post list
    PostView.jsx            /news/:slug — article (DOMPurify) + Key Points + Save button
    Tags.jsx                /keywords — keyword index w/ counts
    TagView.jsx             /keywords/:slug — key points for a keyword (not articles)
    Login.jsx               /login — Google OAuth + email magic link; ?next= return path
    Join.jsx                /join — tier picker -> Stripe Checkout (sign-in-first)
    Dashboard.jsx           /dashboard — membership status/billing, profile form, saved articles
    Privacy.jsx Terms.jsx   /privacy, /terms — static legal pages (drafts, pending counsel review)
    EditorDashboard.jsx     /editor — post list + admin links
    PostEditor.jsx          /editor/new, /editor/:id — post + Key Points editor
    AdminTags.jsx           /editor/keywords (adminOnly) — manage keyword vocabulary
    AdminPeople.jsx         /editor/people (adminOnly) — assign roles
    NotFound.jsx            catch-all 404
supabase/
  schema.sql                SOURCE OF TRUTH for tables, RLS, functions, triggers, seed
  sample-post.sql           optional demo fixture
docs/                       HANDOFF.md (humans), member-area-setup.md (one-time config), news-blog-plan.md
vercel.json                 SPA rewrite: all non-/api paths -> /index.html
```

## Routes

Public: `/`, `/news`, `/news/:slug`, `/keywords`, `/keywords/:slug`, `/login`, `/join`,
`/privacy`, `/terms` (static legal pages, LegalPage shell).
Member (RequireAuth — any signed-in user): `/dashboard`.
Editor (RequireEditor): `/editor`, `/editor/new`, `/editor/:id`.
Admin (RequireEditor adminOnly): `/editor/keywords`, `/editor/people`.
`*` → NotFound. Route order: `/editor/keywords` and `/editor/people` are declared before
`/editor/:id` so they aren't captured as an id.
`/login` honors `?next=<in-app path>` (sanitized: must start with `/`, not `//`); guards
redirect to `/login?next=...` so users return where they were headed.

## Data model (see supabase/schema.sql for exact DDL)

- `profiles` — PK `id` → `auth.users(id)`. `email, full_name, phone, role`; professional
  profile (self-editable, dashboard onboarding form): `credentials, npi, organization,
  practice_setting, newsletter_opt_in, onboarded_at`; membership/billing (webhook-written,
  guarded): `stripe_customer_id, membership_tier (tier key from src/lib/membership.js),
  membership_status ('active'|'past_due'|'canceled'), renews_on`. `role` is enum
  `user_role` = member|editor|admin (default member).
- `posts` — `id, title, slug (unique), excerpt, body_html, cover_image_url,
  cover_image_caption, author_id, author_name (denormalized), status` (enum post_status
  draft|published), `published_at, created_at, updated_at`.
- `tags` — `id, name, short_label, slug (unique)`. (UI term: "keyword".)
- `items` — Key Points: `id, post_id (FK posts), content (text), sort_order`.
- `item_tags` — M2M: `(item_id, tag_id)` composite PK.
- `favorites` — saved news posts: `(user_id, post_id)` composite PK, `created_at`.
- Storage bucket `post-images` (public read) for cover images.

## Security model (RLS) — INVARIANTS, do not weaken

RLS is the ONLY real authorization boundary. Client checks are UX only. Helpers
`is_editor()` / `is_admin()` / `is_active_member()` are SECURITY DEFINER (bypass RLS → no
recursion), `search_path=public`. Gate future member-only content (CME) on
`is_active_member()` (true for membership_status='active' OR editors/admins).

- **posts/items/item_tags SELECT:** public sees `status='published'`; editors/admins see all
  (incl. drafts). items/item_tags gate on their parent post being published.
- **posts/items/item_tags write (INS/UPD/DEL):** `is_editor()` only.
- **tags SELECT:** public. **tags write:** `is_admin()` only.
- **profiles SELECT:** own row or admin. **profiles UPDATE:** own row or admin.
- **favorites:** SELECT/DELETE own rows only; INSERT own rows AND only for published posts.
- **Privilege-escalation guard:** `guard_profile_role()` BEFORE UPDATE trigger blocks a
  non-admin from changing `role` OR any membership/billing column
  (`membership_status, membership_tier, stripe_customer_id, renews_on`). Bypass only when
  `auth.uid() IS NULL` = trusted server-side (SQL editor / service_role / the Stripe
  webhook). This is why members can safely edit name/phone/professional fields but cannot
  grant themselves a role or membership. `api/stripe-webhook.js` (service role) is the ONLY
  writer of the membership columns.
- **`/api` endpoints:** `create-checkout-session` / `create-portal-session` require a valid
  Supabase JWT (`Authorization: Bearer`) verified server-side via `auth.getUser()`;
  `stripe-webhook` requires a valid Stripe signature (`STRIPE_WEBHOOK_SECRET`).
- **Profile creation:** `handle_new_user()` trigger (SECURITY DEFINER) inserts a `member`
  row on `auth.users` insert; role is NEVER taken from user-controlled signup metadata.
- **First admin** is bootstrapped manually (SQL editor, where `auth.uid()` is null).

Security review (2026-07-02): no exploitable findings; XSS sink (`PostView` body_html) is
DOMPurify-sanitized and only editor-writable.

## Conventions & gotchas (READ before editing)

1. **Terminology split:** UI/URLs say **"keyword"** (`/keywords`, "Manage keywords"); the
   DB/code say **"tag"** (`tags`, `item_tags`, `TagChip`, `collectPostTags`). Keep it this way.
2. **Public pages must explicitly filter `status='published'`** — do NOT rely on RLS alone.
   Editors/admins can read drafts, so `Tags.jsx` and `TagView.jsx` add `.eq('posts.status',
   'published')`. (A prior bug leaked drafts into keyword pages for logged-in admins; fixed
   by explicit filtering. Apply the same rule to any new public aggregate.)
3. **Vite inlines env at build**; changing Vercel env vars requires a redeploy.
4. **SPA rewrite** (`vercel.json`) is required — without it deep links / the OAuth redirect
   to `/editor` 404 on Vercel.
5. **Key Points save = replace-all:** `PostEditor` deletes all `items` for the post then
   re-inserts (cascades `item_tags`). Fine at this scale; not diff-based.
6. **Tag slugs are immutable** in the UI (permanent URL identifier); only name/short_label edit.
7. **RichTextEditor is uncontrolled after mount** — parent loads post data before rendering it
   (`initialContent`), so there's no content-sync loop.
8. **Post pages filter to published** even for editors (PostView returns notfound for drafts).
9. Route-level `React.lazy` keeps TipTap/DOMPurify out of the public homepage bundle.
10. DB migrations: edit `supabase/schema.sql` (idempotent — `create ... if not exists`,
    `create or replace`, `add column if not exists`) AND give the user the exact snippet to
    run in the Supabase SQL editor. There is ONE shared Supabase DB across prod+preview.
    Do NOT tell the user to re-run the whole `schema.sql` casually — its tag seed is an
    upsert that would overwrite admin-customized keyword labels.
11. **Membership tier keys** live in three places that must stay in sync:
    `src/lib/membership.js` (UI), `api/_lib/tiers.js` (env mapping), and the
    `STRIPE_PRICE_*` Vercel env vars. `profiles.membership_tier` stores the key.
12. **`api/` functions can't run under `npm run dev`** (Vite doesn't serve them). Test on a
    Vercel preview deployment (or `vercel dev`). Client code should surface API errors
    gracefully for this reason.
13. **AuthContext fetches `profiles` with `select('*')`** so the client tolerates a DB
    that hasn't had the latest additive migration yet — don't list new columns there.

## Rollback & recovery

- **Branch deletion is lossless.** Merged commits persist in `main`; branches are pointers.
  Recreate any branch with `git checkout -b <name> <sha>`. Deleting merged branches does not
  impair reverting.
- **Production emergency (fastest):** Vercel dashboard → Deployments → Promote a prior
  deployment (Instant Rollback). No git/DB change. Last pre-News-blog commit: `7887071`.
- **Undo in git (safe, no history rewrite):** `git revert -m 1 <merge-sha>` then push to `main`
  (Vercel auto-deploys). Revert multiple newest-first. Re-apply a reverted feature via
  `git revert <revert-sha>` (revert-the-revert); a plain re-merge won't re-add it. Do NOT
  `git reset --hard` + force-push `main`.
- **CODE AND DB ROLL BACK SEPARATELY — critical.** `git revert` / Vercel rollback do NOT touch
  Supabase. Migrations here are additive + idempotent, so rolling code back is safe (unused
  columns ignored). Deploying code that expects an unapplied migration breaks → always apply
  DB migrations before dependent code. Destructive DB changes require a compensating SQL
  migration or a Supabase backup restore, not a code revert.
- Reference merges: PR#1 `9a8c74f` (feature), PR#2 `898200d` (draft-filter fix), PR#3 `ceb226b` (docs).

## Member area & Stripe (BUILT 2026-07-06 — needs one-time config to go live)

Implemented: `/join` checkout flow, `/dashboard` (membership status + billing portal +
profile onboarding form + saved articles), Google + magic-link login, favorites, the three
`api/` functions. The old Google Form for member sign-up is retired from membership CTAs.
**Non-negotiable design decisions (do not regress):**
- Sign-in-first: checkout is only reachable signed in; the Supabase user id rides in
  `client_reference_id` + subscription metadata. NEVER link Stripe↔Supabase by email.
- Stripe collects ONLY payment data (card, name-on-card, billing address). Identity comes
  from OAuth; professional details from the dashboard form. No Stripe custom fields.
- Members join/renew/cancel through Stripe-hosted surfaces (Checkout, Customer Portal).
  We never build card UI, never store card data.
- `/join` blocks starting a second checkout for an already-active member (would create a
  duplicate subscription) — tier changes go through the Customer Portal.
Remaining config (Stripe products/prices, webhook, Vercel env vars, consent-screen publish,
Supabase redirect allowlist) + test plan: **`docs/member-area-setup.md`**.

## Future: iOS/Android apps (planned — architecture already accounts for this)

- Mobile apps talk to the SAME Supabase project (RLS is the boundary — that's why client
  checks stay UX-only) and the SAME `/api` endpoints (JWT auth via `Authorization: Bearer`,
  no cookies — deliberately mobile-friendly).
- **Do NOT sell memberships inside the iOS app** (Apple IAP would take 30% and forbid our
  Stripe checkout in-app). The app reads `membership_status` from `profiles`
  ("multiplatform services" rule) and sends people to the website to join/renew.
- **Sign in with Apple is required** on iOS once Google login is offered there (guideline
  4.8). Enable the Apple provider in Supabase then; identities auto-link by verified email.
  Apple "Hide My Email" relays are harmless because Stripe↔Supabase links by user id.
- OAuth deep-link/custom-scheme redirect config happens in Supabase when the app ships.

### Extension checklist
- Any new user-writable table/column: add RLS + extend `guard_profile_role` (or equivalent)
  if it must not be self-set.
- New member-only content (CME): gate SELECT policies on `is_active_member()`.
- Keep the "public pages filter published explicitly" and "keyword=tag terminology" rules.

## Do / Don't

- DO enforce authorization in SQL/RLS; treat client code as untrusted.
- DO keep `supabase/schema.sql` the single source of truth and idempotent.
- DO verify observable changes via the preview workflow before claiming done.
- DON'T expose the service_role key client-side. DON'T weaken RLS to "make a query work."
- DON'T rely on RLS alone for public-facing aggregates (editors can read drafts).
- DON'T rename DB `tags`→`keywords` (UI-only term); DON'T make tag slugs editable.
