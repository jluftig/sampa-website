# Security model (RLS) — invariants

RLS is the **only** real authorization boundary. Client checks are UX only.

Helpers (SECURITY DEFINER, `search_path=public`):  
`is_editor()` · `is_admin()` · `is_member_viewer()` · `is_active_member()`

Gate future member-only content (e.g. CME) on `is_active_member()`  
(`membership_status='active'` OR editors/admins).

## Table rules (summary)

| Area | Rule |
|------|------|
| posts / items / item_tags / post_authors SELECT | Public sees `published` only; editors see all. Children gate on parent post. |
| Same, writes | `is_editor()`; post_authors also `profile_is_news_editor(profile_id)` |
| tags | SELECT public; write admin only |
| profiles SELECT | Own row, admin, or member-viewer. **Never** open to all members for networking |
| profiles UPDATE | Own or admin; member-viewers cannot write |
| Peer directory | `member_directory` / `member_directory_profile` SECURITY DEFINER allowlists only |
| favorites | Own rows; INSERT only for published posts |
| comments / reactions | Public read on published; write `is_active_member()`; soft-delete rules; denormalized bylines |
| member_import | SELECT admin or member-viewer; no client writes |
| donations | SELECT own or staff viewers; **no** client writes — webhook only |

## Privilege escalation

`guard_profile_role()` BEFORE UPDATE blocks non-admins from changing `role` or any
membership/billing column (including `patron`). Bypass only when `auth.uid() IS NULL`
(SQL editor / service_role / Stripe webhook). `aapa_member` is self-writable (honor
system; not verified) and is not in that guard.

**`api/stripe-webhook.js` (service role) is the ONLY writer of membership columns.**

## `/api` auth

| Endpoint | Auth |
|----------|------|
| checkout / portal / delete-account | Valid Supabase JWT |
| create-donation-session | Public; optional JWT to link profile; amount validated server-side ($1–$50k) |
| stripe-webhook | Stripe signature (`STRIPE_WEBHOOK_SECRET`) |
| send-push | `x-push-secret` = `PUSH_WEBHOOK_SECRET` |

## Bootstrap

- `handle_new_user()` inserts `member` on signup; role never from user metadata  
- First admin: manual SQL editor (`auth.uid()` null)  
- XSS: `PostView` body_html DOMPurify-sanitized; editor-writable only  

Dated review: `docs/SECURITY-REVIEW-2026-07-12.md` (findings snapshot — open work on STATUS).
