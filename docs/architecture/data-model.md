# Data model (summary)

Exact DDL: `supabase/schema.sql`. Do not weaken RLS — see `security-rls.md`.

## Core tables

### `profiles`
- PK `id` → `auth.users(id)`
- Identity: `email`, `full_name`, `phone`, `role`
- Account contact: `phone`, `newsletter_opt_in`, `sms_opt_in` (`email` = sign-in)
- Professional / directory: `credentials`, `npi`, `state`; `organizations` jsonb
  `{name, role, city, state, practice_settings[], practice_setting_other,
  practice_setting (legacy), website}`; denormalized
  `organization`, `practice_setting`, `city` from `organizations[0]` for roster/CSV
  (practice_setting denorm prefers joined labels from `practice_settings` slugs).
  Curated slugs live in `src/lib/practiceSettings.js`. Directory OR-filter via
  `member_directory(..., settings_filter text[])`.
  (personal `state` never overwritten from an org)
- Directory privacy: `directory_visible` (default true), `share_email` (true),
  `share_phone` (false), `directory_use_account_contact`, `directory_email`,
  `directory_phone`; `onboarded_at`
- Peer contact **only** via `member_directory*` RPCs — never by opening profiles SELECT
- Membership (webhook-written, guarded): `stripe_customer_id`, `membership_tier`,
  `membership_status` (`active`|`past_due`|`canceled`), `renews_on` (null + active = lifetime),
  `cancel_at_period_end`, `membership_years` (1/2/3 or null), `patron` (boolean, default
  false — extra support add-on, **never** a tier key; no AAPA column on profiles)
- `role` enum `user_role` = member|editor|admin (default member; `editor` legacy — UI
  normalizes to member + flags)
- Capability flags (admin-set, combinable): `can_edit_news`, `can_view_members`, `is_board`
  (Board independent of Admin)
- `privileged_terms_accepted_at` — roster confidentiality click-accept (self-settable)

### Content
- `posts` — title, slug, excerpt, body_html, cover, author_id/author_name (denormalized from
  `post_authors`), status draft|published, published_at, source_* citation fields, `fts`
- `post_authors` — ordered co-authors; `list_news_editors()` for picker
- `tags` — UI term **keyword**; slug immutable in UI
- `items` — Key Points; **ids are permanent share targets** `/news/<slug>#point-<id>`
- `item_tags` — M2M
- `favorites` — saved posts per user
- `post_comments` / `post_reactions` — member discussion; denormalized `author_name`;
  soft-delete comments; emoji set in `src/lib/comments.js`

### Money & ops
- `donations` — gifts only; webhook-written; no client write policy
- `audit_log` — permissions_changed + member_csv_export
- `member_import` — pledge tracking; no client writes

## RPCs (prefer over ad-hoc client joins)
`search_key_points`, `search_posts`, `key_points_for_tags`, `related_posts`,
`keyword_counts`, `list_news_editors`, `member_directory`, `member_directory_profile`

Storage: public-read bucket `post-images` for covers.
