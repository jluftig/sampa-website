# SAMPA News Blog + Auth Foundation — Build Plan

_Last updated: 2026-06-28_

## Goal

A News/blog page on the SAMPA site where **everyone can read**, but only a **few approved
editors can publish** (target cadence: ~twice a month, addiction-related news). Built on a
foundation that extends to a **full member database + member dashboard** and **Stripe
membership payments** later, with **no rework**.

## Decisions locked in

- **Backend:** Supabase (hosted Postgres + Auth + Storage), free tier. Single source of truth.
- **Login:** Google only for launch ("Continue with Google"). Magic link / other methods can be
  toggled on later with no rework.
- **Permissions:** role-based (`member` → `editor` → `admin`) enforced by Postgres Row-Level
  Security, not just UI.
- **Editor:** rich-text WYSIWYG (TipTap). Cover image per post. Draft → Publish workflow.
- **Content model:** **hybrid** — each post has a readable article **plus** a structured list of
  taggable **Key Points**. Tags are a controlled vocabulary (managed list). A site-wide
  **Browse by Tag** page pulls every matching key point across all posts. **Built in the first
  pass** (not deferred).
- **Scope now:** public News pages + editor login/publishing + item-level tagging. Member-ready
  foundation.
- **Schema now includes membership/billing fields** (empty until Stripe is wired up) to avoid a
  later migration.
- **Hosting:** Vercel.
- **Terminology:** user-facing label is **"keyword"** (and public URLs are `/keywords`).
  The database keeps internal names `tags` / `item_tags` / `tag_id` — never shown to users.

## Architecture

```
Reader (public)                 Editor (Google login)
     │                                │
     ▼                                ▼
        React site on Vercel
                 │
                 ▼
            Supabase (one database)
   ┌─────────────┬──────────────┬─────────────┐
   │  Auth       │  Database    │  Storage     │
   │ (Google)    │ (Postgres)   │ (post images)│
   └─────────────┴──────────────┴─────────────┘
        + Row-Level Security (permission rules)

Later: Stripe → webhook → Vercel serverless function → updates Supabase membership fields.
The site only ever READS from Supabase. Stripe feeds Supabase one-directionally.
```

## Routing (new — adds React Router)

| Route | Who | What |
|---|---|---|
| `/` | Public | Existing homepage + a "Latest News" teaser section |
| `/news` | Public | List of published posts |
| `/news/:slug` | Public | Single full article + its Key Points (shareable) |
| `/tags` | Public | Browse all tags |
| `/tags/:slug` | Public | A list of the individual **key points** carrying that tag, across all posts — NOT a list of articles. Each result shows the point text + a small "from [post] · date" link back to its source article for context. |
| `/login` | Public | Continue with Google |
| `/editor` | Editors | Dashboard: list/create/edit, publish/unpublish |
| `/editor/new`, `/editor/:id` | Editors | Post editor (article + Key Points + tag assignment) |
| `/editor/tags` | Admins | Manage the controlled tag vocabulary |

Navbar "News" link changes `#news` → `/news`. Add `vercel.json` rewrite so deep links work.

## Data model

**`profiles`** (one row per person who signs in)
- `id` (→ auth user), `email`, `full_name`, `phone`
- `role`: `member` (default) | `editor` | `admin`
- Membership/billing (empty until Stripe): `stripe_customer_id`, `membership_tier`,
  `membership_status`, `renews_on`

**`posts`**
- `title`, `slug` (unique), `excerpt`, `body_html`, `cover_image_url`
- `author_name` (denormalized so public reads never touch `profiles`)
- `status`: `draft` | `published`, `published_at`, `created_at`, `updated_at`

**`tags`** (controlled vocabulary, managed by admins)
- `id`, `name`, `slug` (unique)

**`items`** (one row per Key Point — these are the first-class, searchable bullets)
- `id`, `post_id` (FK → posts), `content` (text/html), `sort_order`

**`item_tags`** (many-to-many: items ↔ tags)
- `item_id` (FK → items), `tag_id` (FK → tags) — composite PK

**Storage:** `post-images` bucket (public read).

## Permission rules (Row-Level Security)

- **Posts read:** anyone can read `status = 'published'`; editors/admins also see drafts.
- **Posts write/delete:** `editor` or `admin` only.
- **Items / item_tags:** publicly readable when their post is published; write/delete `editor` or
  `admin` only. (Browse-by-Tag must only surface key points from published posts.)
- **Tags:** publicly readable; create/edit/delete `admin` only (keeps the vocabulary clean).
- **Profile role changes:** `admin` only; users **cannot change their own role**.
- First admin is set by hand in Supabase (no admin exists yet to promote you).

## You-set-up checklist (guided)

1. Create free Supabase project.
2. Create Google OAuth credentials (Google Cloud Console) → paste into Supabase.
3. Run provided SQL (tables + RLS + triggers).
4. Make yourself the first admin (one line of SQL).
5. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to local `.env` and Vercel.

## Editor experience

Login with Google → `/editor` → New Post → write the article in the rich-text editor → add
**Key Points** (each point gets one or more tags from the managed list) → Save Draft or Publish
(goes live instantly, no redeploy) → edit/unpublish anytime. Admins manage the tag vocabulary at
`/editor/tags`.

## New dependencies

`@supabase/supabase-js`, `react-router-dom`, `@tiptap/react` + `@tiptap/starter-kit`, `dompurify`.

## Build sequence

- **Phase 0** — External setup (Supabase + Google + keys) — _with you_
- **Phase 1** — Routing + Supabase client + env scaffolding
- **Phase 2** — Schema & RLS (SQL): posts, tags, items, item_tags, profiles + empty membership fields
- **Phase 3** — Public read path: `/news`, `/news/:slug` (article + key points), homepage teaser
- **Phase 4** — Auth: login, Google, session, editors-only route guard
- **Phase 5** — Write path: editor dashboard, post editor, image upload, draft/publish
- **Phase 6** — Tagging: Key Points editor + tag assignment, admin tag management (`/editor/tags`)
- **Phase 7** — Browse by Tag: `/tags` and `/tags/:slug` (key points across all published posts)
- **Phase 8** — Deploy config (`vercel.json`) + end-to-end test on Vercel

## Future phases (foundation already supports)

- **FIRST STEP — publish the Google OAuth consent screen.** Google login is currently in
  "Testing" mode, so only whitelisted test users can sign in. Before opening login to members,
  publish the consent screen (Google Cloud Console → OAuth consent screen → Publish app). We
  only request basic email/profile scopes, so this does **not** trigger Google's lengthy
  sensitive-scope verification. Do this before the member dashboard/login work below.
- **Membership via Stripe:** tier chips → Stripe Checkout/Payment Links collect name/email/phone
  → Stripe webhook → Vercel serverless function → upsert membership into Supabase (keyed by
  email + `stripe_customer_id`). Link payment→login by matching email at Google sign-in.
  Use Stripe Customer Portal for self-serve billing.
- **Member dashboard:** enable magic-link login, add `/dashboard` guarded by `role = 'member'`.
- **Migrate existing Google Form members:** one-time CSV import into Supabase.
- **Bulletproof payment↔account link (optional):** login-first checkout tagging the Stripe
  session with the Supabase user id.
