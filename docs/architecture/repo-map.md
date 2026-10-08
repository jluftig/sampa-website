# Repo map & routes

Deep dive for agents. Invariants and gotchas stay in root `CLAUDE.md`.  
Source of truth for DDL: `supabase/schema.sql`.

## Tree

```
api/                        Vercel serverless functions (Web-handler signature: export POST)
  _lib/clients.js           stripeClient(), supabaseAdmin() (service role), requireUser(JWT), json()
  _lib/tiers.js             tier key -> STRIPE_PRICE_* env mapping
  _lib/siteUrl.js           requestSiteOrigin() → www in production
  create-checkout-session.js POST {tier, duration, patron?} -> {url}; JWT required;
                            client_reference_id = user id. `patron: true` adds a
                            matching-term price_data line item (+$25 × years);
                            metadata.tier stays the real membership key.
  create-invoice-request.js  POST employer invoice (JWT); stores row, Stripe Payment
                            Link with same metadata as checkout, no-SVG PDF; emails
                            josh@ + admin@ only. Does not charge or activate.
  create-donation-session.js POST {amount,frequency} -> {url}; NO auth (public donate);
                            metadata.type='donation' keeps gifts OUT of membership columns
  create-portal-session.js  POST -> {url} of Stripe Customer Portal; JWT required
  add-patron.js             POST -> {url} of Checkout to add Patron on an existing
                            active membership (dashboard only; hidden if already
                            patron). metadata.addon=patron_upgrade.
  delete-account.js         POST; JWT required. Cancels Stripe subscriptions FIRST (aborts on
                            failure), then auth.admin.deleteUser (profile + favorites cascade;
                            posts.author_id SET NULL). App Store 5.1.1(v).
  send-push.js              POST; auth = x-push-secret header (PUSH_WEBHOOK_SECRET env, NOT a
                            JWT). Supabase DB webhook "push-on-publish" on posts INSERT/UPDATE;
                            only when a post BECOMES published → Expo Push; prunes dead tokens.
                            Manual re-send: {slug}.
  stripe-webhook.js         Stripe events → membership columns on profiles (ONLY writer) +
                            donations table. type='donation' segregates gift vs dues flows.
  share.js                  GET ?slug= → OG/Twitter meta HTML for social crawlers (anon key,
                            published only)
  site-traffic.js           GET ?range=7|30 → visitors/pageviews + top paths + daily series; JWT +
                            canViewBoardDashboard (admin, is_board, or is_committee_chair);
                            proxies Vercel Web Analytics (`VERCEL_WEB_ANALYTICS_TOKEN`)
  newsletter-stats.js       GET → Weekly (list 3) and Daily (list 15) subscriber counts,
                            weekly issue stats, and growth from subscriber_snapshots;
                            JWT + canViewBoardDashboard. Read-only Brevo (`BREVO_API_KEY`).
                            `?section=membership`, `?section=finance`, `?section=board-numbers`,
                            `?section=subscriber-snapshot`, and `?section=board`
                            share this function (Hobby plan allows 12 functions).
                            Finance uses the same dashboard gate. Board-numbers is
                            active members only and returns aggregates. The snapshot
                            section is the daily cron (`CRON_SECRET`). Board
                            agendas/minutes (`public.board_meetings`) require
                            `is_active_member()` and are also reached at `/api/board-meetings`
                            via vercel.json rewrite. Handlers live in `api/_lib/`.
src/
  main.jsx                  BrowserRouter > AuthProvider > App
  App.jsx                   Routes (lazy-loaded except Home); catch-all NotFound
  lib/
    supabaseClient.js       single shared Supabase client (auth storage backup)
    AuthContext.jsx         session + profile; useAuth(); refresh retry
    siteUrl.js              canonical www origin (auth + Stripe return)
    authStorage.js          localStorage + cookie session mirror
    authSession.js          transient-null recovery + callback URL cleanup
    membership.js           MEMBERSHIP_TIERS — keep in sync with api/_lib/tiers.js
    memberRoster.js         canViewMemberRoster — /editor/members; canViewBoardDashboard — /board/dashboard and finances
    siteTraffic.js          range/window + Analytics shaping; re-exports roster gate
    newsletterStats.js      Weekly list 3 and Daily list 15 filters, rates, and snapshot growth series
    policyImpact.js         monthly + cumulative filing counts from listPolicyDocuments()
    educationImpact.js      published-news and issues-sent series; CME and jobs are placeholders
    membershipStats.js      current-term headcount series (not a stored snapshot)
    financeStats.js         Stripe balance-transaction shaping (usd, in-window)
    api.js                  apiGet / apiPost — /api/* with Supabase JWT
    comments.js             REACTIONS + normalizeCommentBody (shared with mobile)
    useFavorites.js         saved-post ids + optimistic toggle
    tags.js                 collectPostTags(post)
    dailyNews.js            build-time catalog of content/daily-news/*.json (newest first)
    dailyNewsArchive.js     dated-route resolver, archive paging, month index, keyword tags
    slug.js format.js cite.js share.js
  components/               guards (Require*), Navbar, Footer, PostComments, AuthorPicker, …
  data/
    policyDocuments.js      Policy hub seed + POLICY_LEVERS (see architecture/policy-hub.md)
    boardSchedule.js        Meeting labels and standing second-Wednesday dates
    leadership.js           About-page leadership roster (preview; not a CMS)
  pages/                    Home, About, News, PostView, Policy, PolicyView, Tags, TagView, Search,
                            Login, Join, JoinInvoice, Donate, About, Caq, Dashboard, MemberDirectory,
                            MemberProfile, BoardMeetings, BoardMeetingView, Privacy, Terms,
                            EditorDashboard, PostEditor,
                            AdminTags, AdminPeople, AdminMembers, DailyArchive, DailyTagView,
                            SuggestedDailyTags
public/
  files/policy/             Official Policy PDFs (e.g. HHS RFI comment)
  files/board/              Board agenda / minutes PDFs (drop files; wire paths in boardMeetings.js)
supabase/
  schema.sql                SOURCE OF TRUTH (tables, RLS, functions, triggers, seed)
  migrations/               standalone per-change snippets (folded into schema.sql)
docs/                       STATUS (board), HANDOFF (thin human front door), architecture/*,
                            setup runbooks, news pipeline prompts, PARK-* stickies,
                            email/ (Brevo playbooks + templates; imports/ gitignored CSVs)
scripts/
  insert-sampa-draft.mjs    News draft insert (status=draft only)
  run-insert-draft.sh       Load SAMPA_* from Hermes .env → insert
  brevo/cli.mjs             Brevo REST CLI (draft+test; gated send)
  run-brevo.sh              Load BREVO_* from Hermes .env → brevo CLI
.claude/skills/
  sampa-post/               News post generator (repo agents)
  sampa-email/              Brevo campaigns (repo agents)
mobile/                     Expo iOS/Android — separate build, same Supabase (see architecture/mobile.md)
vercel.json                 SPA rewrite; apex→www; crawler UAs on /news/:slug, /news/daily/archive, and /news/daily/YYYY-MM-DD only → /api/share
```

Marketing email architecture: **`docs/architecture/email-brevo.md`**.

## Routes

| Audience | Paths |
|----------|--------|
| Public | `/`, `/about` (`#leadership`), `/caq`, `/giveaway` (temporary; expires with `GIVEAWAY_ENDS_AT`), `/news`, `/news/daily`, `/news/daily/archive`, `/news/daily/tag/:slug`, `/news/daily/:date` (JSON roundup; archive and tag routes before `:date`; static segments before `/news/:slug`), `/news/:slug` (`#point-<item id>`), `/policy`, `/policy/:slug`, `/keywords`, `/keywords/:slug` (`?and=` intersection), `/search?q=`, `/login`, `/join`, `/join/invoice`, `/donate`, `/privacy`, `/terms`, `/newsletter-confirmed` (`?list=daily` for the roundup list) |
| Signed-in | `/dashboard` |
| Active member or staff | `/members`, `/members/:id` (peer directory — not staff roster); `/board` (AAPA-sparse Agendas / Records / Schedule, plus aggregate member numbers), `/board/:slug` (agenda + minutes — `RequireActiveMember`, not `is_board`) |
| Admin, board, or committee chair | `/board/dashboard` (org dashboard, finances included — `canViewBoardDashboard`) |
| Editor | `/editor`, `/editor/new`, `/editor/:id` |
| Admin | `/editor/keywords`, `/editor/people`, `/editor/daily-tags` (suggested roundup keywords; email stubbed) |
| Member-viewer or admin | `/editor/members` (staff roster only; `canViewMemberRoster`) |

Declare `/editor/keywords`, `/editor/people`, `/editor/members`, `/editor/daily-tags` **before** `/editor/:id`.
Declare `/news/daily/archive` and `/news/daily/tag/:slug` **before** `/news/daily/:date`.  
`/login?next=` must be an in-app path starting with `/` (not `//`).

**Member Login** (header/footer): signed-out → `/login` (no next). After auth with no next, editors/admins/`can_edit_news` → `/editor`; everyone else → `/dashboard`. An explicit `next` is honored. A held/expired session that still has `user.email` but no `profiles` row is treated as signed-out (do not show the join upsell). Membership and editor flags are read from **this** auth user’s `profiles` row (id = Supabase user id), never by email. A second Google login is a second profile.
