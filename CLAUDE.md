# CLAUDE.md — AI/LLM Hand-off & Architecture Reference

Machine-oriented reference for working on the SAMPA website. Optimized for an agent
picking up this repo cold. Human-oriented operations guide: `docs/HANDOFF.md`.
Living project status (what's live / in flight / blocked / next): `docs/STATUS.md` —
**update it when you finish significant work** (feature merged, config milestone,
decision made). Original build plan/decisions: `docs/news-blog-plan.md`. Original
design brief: `GEMINI.md`. `AGENTS.md` is a pointer here for non-Claude agents.

Last updated: 2026-07-15 (mobile app complete through Phase 4 — push live, TestFlight in
beta review; docs sweep).

## What this project is

Marketing site for SAMPA (Society of Addiction Medicine Physician Associates — say
"physician associates", never "physician assistants", in all user-facing copy)
**plus** a News/blog subsystem with editor authentication and a research-grade
"Key Points" database (keyword browse + intersections, Postgres full-text search,
per-claim share links and copyable citations, original-source provenance),
**plus** a member area (dashboard, saved articles, profile onboarding, directory
privacy) with Stripe membership payments, **plus** a peer **member networking
directory** (`/members`, active members only; opt-out listing; Board badge via
`is_board`). Single-page React app; DB/auth/storage are Supabase; Stripe +
social-preview rendering run through Vercel serverless functions in `api/`.

**Where things stand right now** (live / blocked / backlog including avatars, CME,
board tools, mobile): always read and update `docs/STATUS.md`. Do not invent a
second roadmap.

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
- `STRIPE_PRICE_<TIER>_<1Y|2Y|3Y|LIFETIME>` — one Stripe Price id per tier+term
  (17 total; grid in `api/_lib/tiers.js`, prices in `src/lib/membership.js`). Multi-year
  terms are subscriptions billed every N years; LIFETIME (legacy only) is a one-time price.

## Repo map

```
api/                        Vercel serverless functions (Web-handler signature: export POST)
  _lib/clients.js           stripeClient(), supabaseAdmin() (service role), requireUser(JWT), json()
  _lib/tiers.js             tier key -> STRIPE_PRICE_* env mapping
  create-checkout-session.js POST {tier} -> {url}; JWT required; client_reference_id = user id
  create-donation-session.js POST {amount,frequency} -> {url}; NO auth (public donate);
                            metadata.type='donation' keeps gifts OUT of membership columns
  create-portal-session.js  POST -> {url} of Stripe Customer Portal; JWT required
  delete-account.js         POST; JWT required. Cancels the user's Stripe subscriptions
                            FIRST (aborts on failure), then auth.admin.deleteUser (profile +
                            favorites cascade; posts.author_id SET NULL). App Store 5.1.1(v).
  send-push.js              POST; auth = x-push-secret header (PUSH_WEBHOOK_SECRET env, NOT
                            a JWT). Called by the Supabase DB webhook "push-on-publish" on
                            posts INSERT/UPDATE; acts only when a post BECOMES published →
                            Expo Push to device_tokens joined on profiles.push_opt_in;
                            prunes DeviceNotRegistered tokens. Manual re-send: {slug}.
  stripe-webhook.js         Stripe events -> membership columns on profiles (ONLY writer) +
                            donations table (one-time: checkout.session.completed; recurring
                            cycles: invoice.paid). type='donation' segregates the two flows.
  share.js                  GET ?slug= -> OG/Twitter meta HTML for social crawlers (anon key, published only)
src/
  main.jsx                  BrowserRouter > AuthProvider > App
  App.jsx                   Routes (lazy-loaded except Home); catch-all NotFound
  lib/
    supabaseClient.js       single shared Supabase client
    AuthContext.jsx         session + profile; useAuth() -> {user, profile, role, isEditor, isAdmin, isBoard, isActiveMember, canAccessMemberDirectory, canViewMembers, loading, signInWithGoogle(next), signInWithEmail(email,next), signOut, refreshProfile}
    membership.js           MEMBERSHIP_TIERS (tier keys/names/prices) — keep in sync with api/_lib/tiers.js
    api.js                  apiPost(path, body) — calls /api/* with the Supabase JWT
    useFavorites.js         saved-post ids + optimistic toggle for the signed-in user
    tags.js                 collectPostTags(post) — dedupe a post's keywords from nested items
    slug.js                 slugify()
    format.js               formatDate(), formatDateOnly() (date-only, no TZ off-by-one)
    cite.js                 postUrl()/pointUrl() (permanent share URLs) + pointCitation() (copyable citation)
    share.js                copyText(), canNativeShare(), shareOrCopy() (Web Share API w/ clipboard fallback)
  components/
    RequireEditor.jsx       route guard; prop adminOnly restricts to admins
    RequireAuth.jsx         route guard: any signed-in user (member area)
    RequireActiveMember.jsx route guard: active membership or staff (directory / future CME)
    RequireMemberViewer.jsx route guard: can_view_members capability or admin
    Navbar.jsx Footer.jsx   nav; section links are /#anchor so they work off-home
    RichTextEditor.jsx      TipTap wrapper (bold/italic/H2/H3/lists/quote/link)
    LegalPage.jsx           shared shell for /privacy and /terms
    KeyPointActions.jsx     copy-citation / copy-link / native-share row on a Key Point card
    SearchBox.jsx           small form that routes to /search?q=…
    PostCard.jsx TagChip.jsx NewsTeaser.jsx ScrollToTop.jsx Membership.jsx AuthorPicker.jsx
      (ordered co-author chips for PostEditor)
  pages/
    Home.jsx                marketing homepage (was App) + NewsTeaser + Membership section
    News.jsx                /news — published post list + search box
    PostView.jsx            /news/:slug — article (DOMPurify) + Key Points (#point-<id> anchors,
                            share/cite actions) + source line + Related news + Save/Share buttons
    Tags.jsx                /keywords — keyword index w/ counts (keyword_counts RPC, client fallback)
    TagView.jsx             /keywords/:slug — key points for keyword(s); ?and=slug2 = intersection;
                            "Refine" chips (co-occurring keywords) drill down
    Search.jsx              /search?q= — FTS over key points + articles (search_* RPCs) + keyword matches
    Login.jsx               /login — Google OAuth + email magic link; ?next= return path
    Join.jsx                /join — tier picker -> Stripe Checkout (sign-in-first)
    Donate.jsx              /donate — PUBLIC donation page (one-time/monthly, preset+custom
                            amounts) -> Stripe Checkout; pending-501(c)(3) deductibility disclosure
    Dashboard.jsx           /dashboard — membership status/billing, profile form, directory
                            privacy toggles, saved articles
    MemberDirectory.jsx     /members — peer networking directory (active members only)
    MemberProfile.jsx       /members/:id — one member's shared networking profile
    Privacy.jsx Terms.jsx   /privacy, /terms — static legal pages (drafts, pending counsel review)
    EditorDashboard.jsx     /editor — post list + admin links
    PostEditor.jsx          /editor/new, /editor/:id — post + Key Points editor
    AdminTags.jsx           /editor/keywords (adminOnly) — manage keyword vocabulary
    AdminPeople.jsx         /editor/people (adminOnly) — checkbox permissions per person
    AdminMembers.jsx        /editor/members (RequireMemberViewer) — staff roster, pledge tracker,
                            counts, CSV (NOT the peer directory)
    NotFound.jsx            catch-all 404
supabase/
  schema.sql                SOURCE OF TRUTH for tables, RLS, functions, triggers, seed
  migrations/               standalone per-change snippets (already folded into schema.sql)
  sample-post.sql           optional demo fixture
docs/                       HANDOFF.md (humans), STATUS.md (living status — keep updated),
                            member-area-setup.md (one-time config), news-blog-plan.md,
                            mobile-app-setup.md (mobile auth config + dev builds)
mobile/                     Expo (React Native) iOS/Android app — SEPARATE build, same Supabase.
                            See "Mobile app" section below + mobile/AGENTS.md before editing.
vercel.json                 SPA rewrite: all non-/api paths -> /index.html; crawler UAs on
                            /news/:slug -> /api/share (per-article social previews)
```

## Routes

Public: `/`, `/news`, `/news/:slug` (`#point-<item id>` deep-links/highlights one Key
Point), `/keywords`, `/keywords/:slug` (`?and=slug2,slug3` = keyword intersection),
`/search?q=`, `/login`, `/join`, `/donate` (public donation page — no sign-in required),
`/privacy`, `/terms` (static legal pages, LegalPage shell).
Member (RequireAuth — any signed-in user): `/dashboard`.
Active member (RequireActiveMember — paid active or staff): `/members`, `/members/:id`
(peer networking directory; separate from the staff roster).
Editor (RequireEditor): `/editor`, `/editor/new`, `/editor/:id`.
Admin (RequireEditor adminOnly): `/editor/keywords`, `/editor/people`.
Member-viewer (RequireMemberViewer — can_view_members capability or admin): `/editor/members`.
`*` → NotFound. Route order: `/editor/keywords`, `/editor/people`, and `/editor/members`
are declared before `/editor/:id` so they aren't captured as an id.
`/login` honors `?next=<in-app path>` (sanitized: must start with `/`, not `//`); guards
redirect to `/login?next=...` so users return where they were headed.

## Data model (see supabase/schema.sql for exact DDL)

- `profiles` — PK `id` → `auth.users(id)`. `email, full_name, phone, role`; professional
  profile (self-editable, dashboard onboarding form): account contact for SAMPA
  (`phone`, `newsletter_opt_in`, `sms_opt_in`; `email` is sign-in identity);
  directory professional fields `credentials, npi, state` (home/membership
  state — often pre-filled from member_import) + `organizations` jsonb
  `{name, role, city, state, practice_setting, website}`; denormalized
  `organization, practice_setting, city` from `organizations[0]` for admin
  roster/CSV — personal `state` never overwritten from an org;
  directory privacy/contact: `directory_visible`, `share_email`, `share_phone`,
  `directory_use_account_contact` (default true), `directory_email`,
  `directory_phone` (overrides when not using account contact — e.g. work
  inbox for peers); `onboarded_at`;
  membership/billing (webhook-written, guarded): `stripe_customer_id, membership_tier
  (tier key from src/lib/membership.js), membership_status
  ('active'|'past_due'|'canceled'), renews_on` (null renews_on + active = lifetime),
  `cancel_at_period_end` (true = still active but won't renew; renews_on is the END date),
  `membership_years` (purchased term 1/2/3 from the subscription price's interval_count;
  null = lifetime or pre-term-tracking data).
  `role` is enum `user_role` = member|editor|admin (default member; 'editor' is a LEGACY
  value — the People & permissions UI normalizes it to member + flag on first edit).
  Capability flags (admin-set, guarded, combinable): `can_edit_news` (news writing),
  `can_view_members` (read-only staff roster/pledges), `is_board` (board member —
  directory badge; further privileges TBD). Admin role implies news + member-viewer
  operational access; **Board is independent** (admin ≠ board unless checked).
  Directory privacy (self-editable, opt-out model): `directory_visible` (default true),
  `share_email` (default true), `share_phone` (default false). Peer contact data is
  **never** exposed by broadening profiles SELECT RLS — only via
  `member_directory` / `member_directory_profile` SECURITY DEFINER RPCs (column
  allowlist; viewer must be `is_active_member()`; targets must be active + visible).
  `privileged_terms_accepted_at` — click-accept timestamp for the Confidentiality &
  Acceptable Use Agreement (PrivilegedAccessAgreement.jsx); /editor/members refuses to
  render until set. Deliberately self-settable (accepting grants nothing by itself).
- `audit_log` — governance trail: 'permissions_changed' rows written by the
  log_permission_change() trigger (old→new in detail jsonb), 'member_csv_export' rows
  written by AdminMembers. SELECT is_admin(); INSERT only rows with actor_id = self.
- `posts` — `id, title, slug (unique), excerpt, body_html, cover_image_url,
  cover_image_caption, author_id, author_name (denormalized byline), status` (enum
  post_status draft|published), `published_at, created_at, updated_at`; original-source
  citation (nullable): `source_url, source_name, source_published_at (date)` —
  published_at is when WE posted, source_published_at is when the SOURCE did; `fts`
  (generated tsvector over title+excerpt+tag-stripped body, GIN-indexed).
  `author_id` / `author_name` are denormalized from `post_authors` on save (primary =
  first in order; byline = joined display names) so public/mobile reads never join
  profiles.
- `post_authors` — ordered co-authors: `(post_id, profile_id)` composite PK,
  `sort_order`, `display_name` (denormalized). Linked news-editor profiles only
  (`profile_is_news_editor`). SELECT: public for published posts, editors see all;
  write: `is_editor()`. Picker roster: `list_news_editors()` (SECURITY DEFINER,
  editor-gated, allowlisted columns).
- `tags` — `id, name, short_label, slug (unique)`. (UI term: "keyword".)
- `items` — Key Points: `id, post_id (FK posts), content (text), sort_order`; `fts`
  (generated tsvector over content, GIN-indexed). **Item ids are permanent share targets**
  (`/news/<slug>#point-<id>`) — see gotcha 5.
- `item_tags` — M2M: `(item_id, tag_id)` composite PK.
- `favorites` — saved news posts: `(user_id, post_id)` composite PK, `created_at`.
- `donations` — gifts (separate from dues). `id, user_id (FK profiles, NULLABLE = anonymous),
  donor_email, donor_name, amount (cents), currency, frequency ('once'|'monthly'), status,
  stripe_customer_id, stripe_session_id (one-time), stripe_subscription_id + stripe_invoice_id
  (recurring cycles), stripe_payment_intent_id, created_at`. Webhook-written ONLY (no client
  write policy). SELECT: own rows OR is_member_viewer()/is_admin(). Unique on session_id and
  invoice_id → webhook retries are idempotent.
- **RPCs** (SECURITY INVOKER + explicit `status='published'` filter; shared by web and
  future mobile apps — put cross-client read logic here, not in React):
  `search_key_points(q)`, `search_posts(q)` (websearch_to_tsquery + ts_rank),
  `key_points_for_tags(tag_slugs text[])` (AND semantics), `related_posts(for_post_id,
  max_results)` (ranked by shared keywords), `keyword_counts()`,
  `list_news_editors()` (editor-only co-author picker roster),
  `member_directory(search, state_filter)` and `member_directory_profile(member_id)`
  (SECURITY DEFINER peer directory; allowlisted columns only; null email/phone when
  not shared).
- Storage bucket `post-images` (public read) for cover images.

## Security model (RLS) — INVARIANTS, do not weaken

RLS is the ONLY real authorization boundary. Client checks are UX only. Helpers
`is_editor()` (can_edit_news flag OR legacy editor role OR admin) / `is_admin()` /
`is_member_viewer()` (can_view_members flag OR admin) / `is_active_member()` are
SECURITY DEFINER (bypass RLS → no recursion), `search_path=public`. Gate future
member-only content (CME) on `is_active_member()` (true for membership_status='active'
OR editors/admins).

- **posts/items/item_tags/post_authors SELECT:** public sees `status='published'`;
  editors/admins see all (incl. drafts). items/item_tags/post_authors gate on their
  parent post being published.
- **posts/items/item_tags/post_authors write (INS/UPD/DEL):** `is_editor()` only;
  post_authors inserts also require `profile_is_news_editor(profile_id)`.
- **tags SELECT:** public. **tags write:** `is_admin()` only.
- **profiles SELECT:** own row, admin, or member-viewer (read-only staff roster access).
  Do **not** open SELECT to all active members for networking — use
  `member_directory*` RPCs instead. **profiles UPDATE:** own row or admin —
  member-viewers cannot write; members may self-edit directory privacy columns.
- **favorites:** SELECT/DELETE own rows only; INSERT own rows AND only for published posts.
- **member_import:** SELECT `is_admin()` or `is_member_viewer()` (pledge tracking on
  /editor/members); NO write policies — writes happen server-side only (SQL editor /
  SECURITY DEFINER claim).
- **donations:** SELECT own rows (`auth.uid() = user_id`) OR `is_admin()`/`is_member_viewer()`
  (donor management); NO write policies — only `stripe-webhook.js` (service role) inserts.
- **Privilege-escalation guard:** `guard_profile_role()` BEFORE UPDATE trigger blocks a
  non-admin from changing `role` OR any membership/billing column
  (`membership_status, membership_tier, stripe_customer_id, renews_on`). Bypass only when
  `auth.uid() IS NULL` = trusted server-side (SQL editor / service_role / the Stripe
  webhook). This is why members can safely edit name/phone/professional fields but cannot
  grant themselves a role or membership. `api/stripe-webhook.js` (service role) is the ONLY
  writer of the membership columns.
- **`/api` endpoints:** `create-checkout-session` / `create-portal-session` require a valid
  Supabase JWT (`Authorization: Bearer`) verified server-side via `auth.getUser()`;
  `create-donation-session` is PUBLIC (donating needs no account) — JWT is optional and only
  used to link a gift to a profile; the amount is validated server-side ($1–$50k), never trusted
  from the client. `stripe-webhook` requires a valid Stripe signature (`STRIPE_WEBHOOK_SECRET`).
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
5. **Key Points save is diff-based BY DESIGN — do not "simplify" it to replace-all.**
   `PostEditor` updates/inserts/deletes items by id and syncs `item_tags` per item, so a
   point's `items.id` survives edits. Ids are public share targets
   (`/news/<slug>#point-<id>`, copied citations, future mobile deep links); replace-all
   would break every previously shared claim link on each save. Same reason the slug
   warning shows on published posts — slugs and point ids are permanent identifiers.
6. **Tag slugs are immutable** in the UI (permanent URL identifier); only name/short_label edit.
7. **RichTextEditor is uncontrolled after mount** — parent loads post data before rendering it
   (`initialContent`), so there's no content-sync loop.
8. **Post pages filter to published** even for editors (PostView returns notfound for drafts).
9. Route-level `React.lazy` keeps TipTap/DOMPurify out of the public homepage bundle.
10. DB migrations: edit `supabase/schema.sql` (idempotent — `create ... if not exists`,
    `create or replace`, `add column if not exists`) AND write a standalone file under
    `supabase/migrations/` for the operator to run. There is ONE shared Supabase DB
    across prod+preview. Do NOT tell the user to re-run the whole `schema.sql`
    casually — its tag seed is an upsert that would overwrite admin-customized
    keyword labels.
    **Clipboard handoff (required):** whenever you create or update a migration the
    user may need to run, **immediately copy it to the system clipboard** on macOS
    with `pbcopy < supabase/migrations/<file>.sql` (or `pbcopy < path`), then tell
    them it is on the clipboard and ready to paste into the Supabase SQL Editor.
    Do this proactively — do not wait for them to ask `pbcopy …`. If several
    migrations must run in order, copy the **next** one they should run (or say so
    when multiple remain) and name the file(s) clearly.
11. **Membership tier keys AND term durations** live in three places that must stay in
    sync: `src/lib/membership.js` (UI: prices grid + lifetime), `api/_lib/tiers.js`
    (TIER_DURATIONS + env mapping — this copy authorizes checkouts), and the
    `STRIPE_PRICE_<TIER>_<TERM>` Vercel env vars. `profiles.membership_tier` stores the
    tier key. Student/Pre-PA cap at 2-year terms; Legacy has a one-time lifetime option
    (webhook stores it as membership_status='active' with renews_on=null — an active
    profile with null renews_on means lifetime, and subscription events never downgrade it).
12. **`api/` functions can't run under `npm run dev`** (Vite doesn't serve them). Test on a
    Vercel preview deployment (or `vercel dev`). Client code should surface API errors
    gracefully for this reason.
13. **AuthContext fetches `profiles` with `select('*')`** so the client tolerates a DB
    that hasn't had the latest additive migration yet — don't list new columns there.
14. **New-RPC callers degrade gracefully:** pages calling the research-db RPCs treat an
    RPC error as "feature not available yet" (Tags falls back to client aggregation,
    PostView hides Related news, Search shows an "unavailable" card) so code can deploy
    ahead of — but should not; see gotcha 10 — the migration. Keep this pattern for new RPCs.
15. **New public RPCs/views must filter `status='published'` inside the SQL** (gotcha 2
    applies in the DB too — SECURITY INVOKER means an editor's session would otherwise
    surface drafts through an aggregate).
16. **Social previews:** `vercel.json` rewrites crawler user-agents on `/news/:slug` to
    `api/share.js` (OG meta). New public content types that get shared need the same
    treatment; browsers must NEVER be routed there (bot UA list only).

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

## Future work (pointer — details in docs/STATUS.md)

Do not treat this section as the living backlog; **`docs/STATUS.md`** is. High-level
themes agents may be asked to implement:

- **Directory v2:** avatars (Storage), short bio, LinkedIn/website, richer filters;
  keep peer data on allowlisted RPCs — never open `profiles` SELECT to all members.
- **Board privileges:** `is_board` is badge-only today; future gates should use the
  flag (and/or admin), not a new exclusive role ladder.
- **CME / member-only content:** gate on `is_active_member()`.
- **Mobile:** see the "Mobile app" section below; reuse `member_directory*` RPCs for any
  in-app directory.
- **Ops:** OAuth consent publish, 501(c)(3), email platform (Brevo), legal review.

## Mobile app (mobile/)

Standalone Expo (React Native) iOS/Android app; NOT a webview. Separate build from the
website (Vite/Vercel never touch `mobile/`), same Supabase project. Read `mobile/AGENTS.md`
before editing app code. Status: Phases 0–4 complete and **device-verified** — tab shell +
brand identity (real logo, icon, splash), auth (Apple/Google/email-code via Brevo SMTP,
Face ID lock, encrypted sessions), News/Key Points/keywords/search/saved, member area +
account deletion, member directory, and push notifications (publish → opted-in phones,
fully configured). Sentry merged but dormant until EXPO_PUBLIC_SENTRY_DSN is set. In
TestFlight beta review; remaining = board rollout + App Store submission (Phase 5) — see
docs/STATUS.md for the live checklist.

- **Shared code:** the app imports the pure-JS modules in `src/lib/` (membership.js, tags.js,
  slug.js, format.js, usStates.js) as the npm package **`sampa-shared`** — a `file:../src/lib`
  dependency (marker: `src/lib/package.json`, inert for the web build). npm materializes it as
  a symlink in `mobile/node_modules`; Metro follows it (`unstable_enableSymlinks` +
  repo-root watchFolder in `mobile/metro.config.js`). Do NOT copy these modules into the app
  (drift — see rule 11), do NOT delete `src/lib/package.json`, and keep those modules free of
  DOM/Vite-specific code (`window`, `import.meta.env`).
- Mobile talks to the SAME Supabase (RLS is the boundary — client checks stay UX-only) and,
  later, the same `/api` endpoints (JWT via `Authorization: Bearer`, no cookies).
- **Do NOT sell memberships inside the iOS app** (Apple IAP would take 30% and forbid our
  Stripe checkout in-app). The app reads `membership_status` from `profiles`
  ("multiplatform services" rule) and sends people to the website to join/renew
  (system browser).
- **Sign in with Apple is required** on iOS alongside Google (guideline 4.8) — built and
  device-verified; identities auto-link by verified email. "Hide My Email" relays are
  harmless because Stripe↔Supabase links by user id. Deep-link scheme `sampa://`
  (allowlisted in Supabase); auth flows are PKCE.
- **Public reads in the app must filter `status='published'` explicitly** (same rule 2 as
  the website) — `mobile/src/lib/content.ts` mirrors the web queries/RPCs.
- **In-app account deletion** (App Store 5.1.1(v)) is built: `api/delete-account.js`
  (cancels Stripe subscriptions first, then deletes the auth user).
- Any future in-app member directory: call `member_directory` / `member_directory_profile`
  RPCs (do not select peer rows from `profiles` directly).
- One-time auth/dashboard config + dev-build instructions: `docs/mobile-app-setup.md`.

### Extension checklist
- Any new user-writable table/column: add RLS + extend `guard_profile_role` (or equivalent)
  if it must not be self-set.
- New member-only content (CME): gate SELECT policies on `is_active_member()`.
- New peer-visible profile fields: extend directory RPCs allowlist + privacy toggles;
  never broaden profiles SELECT RLS for networking.
- Keep the "public pages filter published explicitly" and "keyword=tag terminology" rules.

## Do / Don't

- DO enforce authorization in SQL/RLS; treat client code as untrusted.
- DO keep `supabase/schema.sql` the single source of truth and idempotent.
- DO `pbcopy` new/updated migration SQL onto the clipboard and tell the user it is
  ready for the Supabase SQL Editor (gotcha 10).
- DO verify observable changes via the preview workflow before claiming done.
- DO update `docs/STATUS.md` when finishing significant work — it is the living
  status doc humans and agents rely on across handoffs.
- DON'T expose the service_role key client-side. DON'T weaken RLS to "make a query work."
- DON'T rely on RLS alone for public-facing aggregates (editors can read drafts).
- DON'T rename DB `tags`→`keywords` (UI-only term); DON'T make tag slugs editable.
