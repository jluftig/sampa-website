# Security model (RLS) — invariants

RLS is the **only** real authorization boundary. Client checks are UX only.

Helpers (SECURITY DEFINER, `search_path=public`):  
`is_editor()` · `is_admin()` · `is_member_viewer()` · `is_active_member()`

Gate future member-only content (e.g. CME) on `is_active_member()`  
(`membership_status='active'` OR editors/admins).

**Board meetings (T45):** `/board` + `/board/:slug` use the same client gate as
the directory (`RequireActiveMember` / `canAccessMemberDirectory` /
`isActiveMemberAccess`). That check is UX only. Agenda and minutes HTML live in
`public.board_meetings` and are returned by `GET /api/board-meetings`
(rewritten to `newsletter-stats?section=board`, so it does not add a 13th
serverless function). The handler calls `requireUser` and allows the response
only when `isActiveMemberAccess` matches SQL `is_active_member()`
(`membership_status = 'active'` OR role `editor`/`admin`). Otherwise 401 or
403, with `cache-control: private, no-store`. Do not import the bodies module
from `src/`. `is_board` is still the directory badge, and together with
`is_committee_chair` it opens `/board/dashboard` (including finances). Meeting
bodies stay on `is_active_member()`. PDFs dropped in
`public/files/board/` are reachable by URL if someone knows the path; do not
put confidential drafts there until there is an authenticated file route.

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
| membership_invoice_requests | SELECT admin or member-viewer; **no** client writes — `create-invoice-request` service role only |

## Privilege escalation

`guard_profile_role()` BEFORE UPDATE blocks non-admins from changing `role` or any
membership/billing column (including `patron`, `is_board`, `is_membership_committee`, `is_committee_chair`).
Bypass only when `auth.uid() IS NULL`
(SQL editor / service_role / Stripe webhook). `aapa_member` is self-writable (honor
system; not verified) and is not in that guard.

**`api/stripe-webhook.js` (service role) is the ONLY writer of membership columns.**

## `/api` auth

| Endpoint | Auth |
|----------|------|
| checkout / portal / delete-account / create-invoice-request | Valid Supabase JWT |
| site-traffic | Valid Supabase JWT **and** `canViewBoardDashboard` (`admin` or `is_board` or `is_committee_chair`) |
| newsletter-stats | Valid Supabase JWT **and** `canViewBoardDashboard`. Read-only Brevo (`BREVO_API_KEY` server-side). Weekly list 3 and Daily list 15 |
| newsletter-stats?section=email-preferences | Valid Supabase JWT for the signed-in member (same check as delete-account). GET reads that member's Brevo `listIds`. POST adds or removes one of the SAMPA Weekly Newsletter (3), the SAMPA Daily News Roundup (15), or the SAMPA Monthly Topic Roundup (`BREVO_LIST_TOPIC`). It does not send a campaign. A footer unsubscribe stays `emailBlacklisted`. Turning one list on after that clears the blacklist, keeps the other non-Updates lists, and leaves the SAMPA Weekly Newsletter off unless that switch was the one turned on. `newsletter_opt_in` matches Updates membership after that path. |
| newsletter-stats?section=membership | Valid Supabase JWT **and** `canViewBoardDashboard`. Aggregates only (no emails) |
| newsletter-stats?section=finance | Valid Supabase JWT **and** `canViewBoardDashboard` (same gate as the dashboard, not admin-only). Read-only Stripe balance transactions (`STRIPE_SECRET_KEY` server-side) |
| newsletter-stats?section=board-numbers | Valid Supabase JWT **and** `is_active_member()` (`isActiveMemberAccess`). Active member count plus Weekly and Daily subscriber totals only |
| newsletter-stats?section=subscriber-snapshot | `Authorization: Bearer CRON_SECRET` (Vercel cron). Upserts one snapshot row per list per UTC day. No user session |
| newsletter-stats?section=policy-work | Valid Supabase JWT **and** `canViewPolicyWork` (`role = admin` or `is_board`). `can_view_members` and `is_committee_chair` get 403. Reads `POLICY_WORK_INTERNAL` (server env, JSON keyed by item id, including `owner`). Missing or invalid JSON logs a warning and returns `internalDetailsUnavailable` with no internal fields. `cache-control: private, no-store`. Same function as newsletter-stats. Not in the client bundle or the repo |
| create-donation-session | Public; optional JWT to link profile; amount validated server-side ($1–$50k) |
| stripe-webhook | Stripe signature (`STRIPE_WEBHOOK_SECRET`) |
| send-push | `x-push-secret` = `PUSH_WEBHOOK_SECRET` |

## Bootstrap

- `handle_new_user()` inserts `member` on signup; role never from user metadata  
- First admin: manual SQL editor (`auth.uid()` null)  
- XSS: `PostView` body_html DOMPurify-sanitized; editor-writable only  

Dated review: `docs/SECURITY-REVIEW-2026-07-12.md` (findings snapshot — open work on STATUS).
