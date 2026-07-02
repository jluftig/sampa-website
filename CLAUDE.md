# CLAUDE.md — AI/LLM Hand-off & Architecture Reference

Machine-oriented reference for working on the SAMPA website. Optimized for an agent
picking up this repo cold. Human-oriented operations guide: `docs/HANDOFF.md`.
Original build plan/decisions: `docs/news-blog-plan.md`. Original design brief: `GEMINI.md`.

Last updated: 2026-07-02.

## What this project is

Marketing site for SAMPA (Society for Addiction Medicine PAs) **plus** a News/blog
subsystem with editor authentication and a keyword-searchable "Key Points" database.
Single-page React app; all backend concerns (DB, auth, storage) are Supabase.

## Stack & hosting

- **Frontend:** Vite + React 18, React Router v6 (`BrowserRouter`), Tailwind CSS.
- **Libs:** `@supabase/supabase-js` (DB/auth/storage), `@tiptap/*` (rich-text editor,
  editor-only), `dompurify` (sanitize post HTML on render), `gsap` (homepage animation),
  `lucide-react` (icons).
- **Backend:** Supabase project ref `xbzzawjnphpnexwfjtif` (Postgres + Auth + Storage).
- **Auth:** Google OAuth only (Supabase provider). Consent screen currently in **Testing**
  mode → only whitelisted Google "test users" can sign in. Publish before opening to members.
- **Hosting:** Vercel. `main` → production (www.addictionpas.org). Every branch → preview URL.
- **Repo:** GitHub `jluftig/sampa-website`.

## Commands

- `npm run dev` — Vite dev server (default port 5173; `.claude/launch.json` uses 5174 for previews).
- `npm run build` — production build. `npm run preview` — serve the build.
- No test suite or linter configured.

## Environment variables

Both are build-time (`import.meta.env`, inlined by Vite) and **safe to expose** (publishable
key; RLS enforces security):
- `VITE_SUPABASE_URL` = `https://xbzzawjnphpnexwfjtif.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_...`

Local: `.env.local` (gitignored). Prod/preview: Vercel → Settings → Environment Variables
(set for Production AND Preview). Missing vars → `supabaseClient.js` throws at import → blank
page. **Never** put the Supabase `service_role`/secret key in any `VITE_` var or client code.

## Repo map

```
src/
  main.jsx                  BrowserRouter > AuthProvider > App
  App.jsx                   Routes (lazy-loaded except Home); catch-all NotFound
  lib/
    supabaseClient.js       single shared Supabase client
    AuthContext.jsx         session + profile(role); useAuth() -> {user, profile, role, isEditor, isAdmin, loading, signInWithGoogle, signOut}
    tags.js                 collectPostTags(post) — dedupe a post's keywords from nested items
    slug.js                 slugify()
    format.js               formatDate()
  components/
    RequireEditor.jsx       route guard; prop adminOnly restricts to admins
    Navbar.jsx Footer.jsx   nav; section links are /#anchor so they work off-home
    RichTextEditor.jsx      TipTap wrapper (bold/italic/H2/H3/lists/quote/link)
    PostCard.jsx TagChip.jsx NewsTeaser.jsx ScrollToTop.jsx
  pages/
    Home.jsx                marketing homepage (was App) + NewsTeaser
    News.jsx                /news — published post list
    PostView.jsx            /news/:slug — article (DOMPurify) + Key Points
    Tags.jsx                /keywords — keyword index w/ counts
    TagView.jsx             /keywords/:slug — key points for a keyword (not articles)
    Login.jsx               /login — Continue with Google
    EditorDashboard.jsx     /editor — post list + admin links
    PostEditor.jsx          /editor/new, /editor/:id — post + Key Points editor
    AdminTags.jsx           /editor/keywords (adminOnly) — manage keyword vocabulary
    AdminPeople.jsx         /editor/people (adminOnly) — assign roles
    NotFound.jsx            catch-all 404
supabase/
  schema.sql                SOURCE OF TRUTH for tables, RLS, functions, triggers, seed
  sample-post.sql           optional demo fixture
docs/                       HANDOFF.md (humans), news-blog-plan.md (plan)
vercel.json                 SPA rewrite: all paths -> /index.html
```

## Routes

Public: `/`, `/news`, `/news/:slug`, `/keywords`, `/keywords/:slug`, `/login`.
Editor (RequireEditor): `/editor`, `/editor/new`, `/editor/:id`.
Admin (RequireEditor adminOnly): `/editor/keywords`, `/editor/people`.
`*` → NotFound. Route order: `/editor/keywords` and `/editor/people` are declared before
`/editor/:id` so they aren't captured as an id.

## Data model (see supabase/schema.sql for exact DDL)

- `profiles` — PK `id` → `auth.users(id)`. `email, full_name, phone, role`, plus
  membership/billing (reserved, empty until Stripe): `stripe_customer_id, membership_tier,
  membership_status, renews_on`. `role` is enum `user_role` = member|editor|admin (default member).
- `posts` — `id, title, slug (unique), excerpt, body_html, cover_image_url,
  cover_image_caption, author_id, author_name (denormalized), status` (enum post_status
  draft|published), `published_at, created_at, updated_at`.
- `tags` — `id, name, short_label, slug (unique)`. (UI term: "keyword".)
- `items` — Key Points: `id, post_id (FK posts), content (text), sort_order`.
- `item_tags` — M2M: `(item_id, tag_id)` composite PK.
- Storage bucket `post-images` (public read) for cover images.

## Security model (RLS) — INVARIANTS, do not weaken

RLS is the ONLY real authorization boundary. Client checks are UX only. Helpers
`is_editor()` / `is_admin()` are SECURITY DEFINER (bypass RLS → no recursion), `search_path=public`.

- **posts/items/item_tags SELECT:** public sees `status='published'`; editors/admins see all
  (incl. drafts). items/item_tags gate on their parent post being published.
- **posts/items/item_tags write (INS/UPD/DEL):** `is_editor()` only.
- **tags SELECT:** public. **tags write:** `is_admin()` only.
- **profiles SELECT:** own row or admin. **profiles UPDATE:** own row or admin.
- **Privilege-escalation guard:** `guard_profile_role()` BEFORE UPDATE trigger blocks a
  non-admin from changing `role` OR any membership/billing column
  (`membership_status, membership_tier, stripe_customer_id, renews_on`). Bypass only when
  `auth.uid() IS NULL` = trusted server-side (SQL editor / service_role / future Stripe
  webhook). This is why members can safely edit name/phone but not grant themselves access.
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

## Future architecture (planned — foundation already supports)

### Stripe membership payments
- Membership tier chips → Stripe Checkout / Payment Links (collect name, email, phone, card).
- **Stripe = source of truth for billing; Supabase = source of truth for identity/app data.**
- Sync is one-directional: Stripe webhook → a **Vercel serverless function** (`/api/*`, to be
  added) → upsert into `profiles` (`stripe_customer_id, membership_tier, membership_status,
  renews_on`). The app only reads Supabase, never queries Stripe at render.
- Webhook runs with the **service_role** key (server-side only) → `auth.uid()` is null →
  passes `guard_profile_role`, so it can write membership columns that users cannot.
- Payment↔account link: by email initially; harden later with Stripe Checkout
  `client_reference_id`/metadata = Supabase user id.
- Never store card data (PCI stays with Stripe). Store only IDs + status.

### New-member onboarding
- Replaces the current Google Form. Collects professional profile: name, credentials, NPI,
  organization, practice setting, contact/comms prefs. Store on `profiles` (or a companion
  `member_profiles` table if it grows). Profile row already auto-created at first login.

### Member login + dashboard + profile
- Enable Supabase magic-link (email OTP) provider alongside Google; publish the Google
  consent screen (basic scopes → no lengthy verification).
- New `/dashboard` route guarded by authenticated session (role `member`+). Reads membership
  status/renewal from `profiles`. Profile edit page updates safe fields only (name/phone) —
  the role/membership guard already blocks self-escalation.
- Billing self-service: link to **Stripe Customer Portal** (hosted) rather than building
  payment UI.

### Extension checklist for the above
- Add serverless functions under `/api` (Vercel) for Stripe webhooks / Checkout session
  creation; store Stripe secret + webhook signing secret as Vercel server env vars (NOT VITE_).
- Any new user-writable table/column: add RLS + extend `guard_profile_role` (or equivalent)
  if it must not be self-set.
- Keep the "public pages filter published explicitly" and "keyword=tag terminology" rules.

## Do / Don't

- DO enforce authorization in SQL/RLS; treat client code as untrusted.
- DO keep `supabase/schema.sql` the single source of truth and idempotent.
- DO verify observable changes via the preview workflow before claiming done.
- DON'T expose the service_role key client-side. DON'T weaken RLS to "make a query work."
- DON'T rely on RLS alone for public-facing aggregates (editors can read drafts).
- DON'T rename DB `tags`→`keywords` (UI-only term); DON'T make tag slugs editable.
