# Email / Brevo architecture

How SAMPA marketing email works. **Board:** [`../STATUS.md`](../STATUS.md).  
**Ops sticky:** [`../PARK-brevo-email.md`](../PARK-brevo-email.md).  
**Agent skill (repo):** [`.claude/skills/sampa-email/SKILL.md`](../../.claude/skills/sampa-email/SKILL.md).

## Where this lives (repo decision)

**Canonical home = this git repo (`sampa-website`).** Not a separate `sampa-email` repo and not a parent monorepo (yet).

| Why keep it here | Why not a sibling repo |
|------------------|------------------------|
| Weekly digest reads **published posts** in Supabase | Extra remote to sync laptop ↔ Studio |
| Member sync uses **`profiles.newsletter_opt_in`** | Splits one STATUS board into two |
| Public signup + privacy live on the **site** | Duplicates domain/sender/brand rules |
| Same secrets pattern as news insert (`scripts/` + Hermes `.env`) | Premature until email is a separate product team |

Optional later: a parent `sampa/` folder that *contains* this clone is fine as a local convenience — **git root stays `sampa-website`**. Promote a monorepo only if a second deployable product needs its own CI and access control.

**Runtime secrets** stay out of git: Hermes `~/.hermes/profiles/egg/.env` (and Vercel if API routes send mail later).

## Providers

| Path | Provider | Address |
|------|----------|---------|
| Auth magic links / codes | Brevo **SMTP** → Supabase | `no-reply@addictionpas.org` |
| Marketing campaigns | Brevo **REST API** | From: **SAMPA** `<info@addictionpas.org>` (Google Workspace **group alias** — routes to whoever handles info; not a paid mailbox) |

Domain `addictionpas.org` must be authenticated in Brevo (DKIM/DMARC). Register **`info@` as a sender** and wait until **active** before production From.  
Use a dedicated **`BREVO_API_KEY`** (API), not the SMTP key used by Supabase.

Docs: [developers.brevo.com](https://developers.brevo.com/) · base `https://api.brevo.com/v3` · header `api-key: ***`

## Standing lists (v1 — catch-all)

| List key | Brevo name | Who | Notes |
|----------|------------|-----|--------|
| `updates` | **SAMPA Weekly Newsletter** | Public + members | **Single catch-all** marketing list |
| `test` | SAMPA Test | Josh (expand later) | Every campaign: test here first |

Aliases for CLI: `newsletter`, `announcements` → same as `updates`.  
Env: `BREVO_LIST_UPDATES`, `BREVO_LIST_TEST`.

**Reserved in Brevo (not product yet):** Weekly News, Policy, Jobs, CME (ids 4–7). Do not attach on import/sync until multi-topic prefs reopen.

**No board/internal marketing list required for v1** — use **Test** for QA.

## From / Reply-To

| Phase | From | Reply-To | Why |
|-------|------|----------|-----|
| **Early (now)** | SAMPA `info@` | **`info@`** (group alias) | People can ask questions while list is small; group routes handlers |
| **Later (scale)** | SAMPA `info@` | **`no-reply@`** or none + footer **Contact us** form | Control spam; structured intake |
| Auth (always) | — | SMTP `no-reply@` | Magic links only — not marketing |

## Audiences & consent

```
Public signup (site, later)
  → double opt-in (DOI)
  → SAMPA Weekly Newsletter

Member (Supabase) with newsletter_opt_in = true
  → SAMPA Weekly Newsletter

Google Group legacy (~130)
  → import Brevo only (not auth.users)
  → SOURCE=google_group_legacy
  → Landing A: stay-or-unsub / confirm before treating as opted Updates
  → first major CTA: new site + membership

Unsubscribe
  → email footer remains a one-click full exit (`emailBlacklisted`)
  → signed-in `/dashboard/emails` adds or removes one list
  → exit interview = backlog (never block unsub)
```

**Source of truth**

| Concern | System |
|---------|--------|
| Who receives marketing mail | **Brevo** list membership. SAMPA Weekly Newsletter (list 3), SAMPA Daily News Roundup (list 15), SAMPA Monthly Topic Roundup (`BREVO_LIST_TOPIC`) |
| Who has a site account / paid membership | **Supabase** (+ Stripe) |
| Legacy interest without an account | **Brevo** (optional future `email_prospects` table only if staff need in-app roster) |

Do **not** bulk-create Supabase auth users for the Google Group.

## Brand in email

- Logo PNG: `public/email/sampa-logo.png` → live `https://www.addictionpas.org/email/sampa-logo.png`  
- Colors: teal `#0F766E` / `#36A79C`, purple `#8513C1`, soft ground `#F4F7F5`  
- Templates under `docs/email/templates/`

## Agent / automation safety

Same spirit as the news pipeline:

1. **Default:** create **draft** campaigns + **sendTest** only.  
2. **Mass send / schedule:** only when a human says so (or hits Send/Schedule in Brevo UI).  
3. Scripts refuse `sendNow` without `--i-understand-send-to-production`.  
4. Weekly News: draft → approve → **human schedules** for Monday 5:30 AM PT (not autopilot).  
5. Digest content = **`status=published`** posts only — never drafts.  
6. Never commit API keys. Never use publishable Supabase keys for member sync.

## Pipeline (logical)

```
Content (MD/HTML or weekly digest JSON from published posts)
  → branded HTML template
  → POST /emailCampaigns  (draft; recipients = list ids)
  → POST .../sendTest     (Test list or explicit emails)
  → human approve
  → schedule in Brevo UI  OR  explicit agent send/schedule command
```

Contact sync (separate):

```
Supabase profiles (opt-in members)
  → upsert POST /contacts  (updateEnabled)
  → listIds Announcements + Weekly News
```

## Scripts

| Entry | Role |
|-------|------|
| `scripts/run-brevo.sh` | Load `BREVO_*` (+ optional SAMPA_*) from Hermes `.env`, run CLI |
| `scripts/brevo/cli.mjs` | Subcommands: `account`, `lists`, `setup-check`, `campaign-draft`, `campaign-test`, `campaign-get`, `contact-upsert`, `import-csv-plan` |

## Site surfaces

- **Public signup (T5):** footer form → `api/newsletter-signup.js` → Brevo DOI →
  **SAMPA Weekly Newsletter** only. Confirm page: `/newsletter-confirmed`.
  Env: `BREVO_API_KEY`, `BREVO_LIST_UPDATES` (production list id 3), `BREVO_DOI_TEMPLATE_ID` (production template id 13).
- **Daily roundup signup (T64):** form on `/news/daily` still posts `list: "daily"`.
  The handler maps that string to `BREVO_LIST_DAILY_NEWS` (production list id 15).
  Template `BREVO_DOI_TEMPLATE_ID_DAILY` (production id 35). If that template is unset, this form falls back to `BREVO_DOI_TEMPLATE_ID`.
  Confirm page: `/newsletter-confirmed?list=daily`. Attribute `SOURCE=daily_roundup_signup`.
  Unset list env returns 503 with "Daily email signup is coming soon." A missing `list`
  field still writes the SAMPA Weekly Newsletter only. The client cannot send a numeric list id.
- **Manage subscriptions:** `/subscriptions` posts `{ email, lists: { daily, weekly, topic } }`
  to the same `POST /api/newsletter-signup` handler. Checked lists are double opt-in.
  A body with every list false returns 400 `Choose at least one newsletter.` and does not call Brevo.
  Unchecked lists on a request that also checks at least one list are never removed on that request. If the address is on any unchecked
  list (private Brevo lookup), the handler emails it a signed link that expires in 24 hours
  (`/subscriptions?confirm=<token>`, HMAC with `SUBSCRIPTION_TOKEN_SECRET`, or a key derived
  from `BREVO_API_KEY` when that is unset). The page then needs a button click, which posts
  `{ confirm }` and removes only the signed lists. Responses are the same whether or not the
  address is on a list. Removal emails are limited to 3 per address per hour (per instance).
  Each list is tried on its own. A partial failure returns 502 with `failed` list keys.
  List env vars and the Vercel values: `BREVO_LIST_DAILY_NEWS` 15, `BREVO_LIST_UPDATES` 3, `BREVO_LIST_TOPIC` 18.
  Template env vars and the Vercel values: daily `BREVO_DOI_TEMPLATE_ID_DAILY` 35 (no fallback to the weekly template), weekly `BREVO_DOI_TEMPLATE_ID` 13, topic `BREVO_DOI_TEMPLATE_TOPIC` (59 in Vercel, template currently inactive in Brevo).
  When `BREVO_DOI_TEMPLATE_TOPIC` is unset, the handler logs `newsletter-signup: BREVO_DOI_TEMPLATE_TOPIC is unset` and does not call Brevo for that list, so no topic contact is written. The page still returns success and says SAMPA Monthly Topic Roundup signup is not open yet (`notOpen: ["topic"]`).
  When the topic template id is set, the handler sends double opt-in with that template. A Brevo error, including an inactive template, is a failure for that list and does not count as a written subscription.
  Manage confirm redirects are set in site code and ignore `BREVO_DOI_REDIRECT_URL`: daily `${origin}/newsletter-confirmed?list=daily`, weekly `${origin}/newsletter-confirmed?list=weekly`, topic `${origin}/newsletter-confirmed?list=topic`.
  The topic confirm page button goes to `/news`. `/news/topic` is the SAMPA Monthly Topic Roundup route in PR #146, and this PR does not register it.
  `BREVO_API_KEY` must be set in Vercel server env and must never be a `VITE_` var.
- Privacy: names the three member lists and Brevo. Per-list switches live at `/dashboard/emails`. The email footer remains the full exit. Link `/privacy`.
- Member choices: `/dashboard/emails` reads Brevo `listIds` and adds or removes
  one list. `newsletter_opt_in` mirrors the SAMPA Weekly Newsletter so a renewal does not
  re-add someone who turned that list off. After a footer unsubscribe, turning
  one list on clears the blacklist and keeps the other non-Updates lists.
  The SAMPA Weekly Newsletter stays off unless that switch is the one turned on, and
  `newsletter_opt_in` follows that result. The SAMPA Monthly Topic Roundup uses
  `BREVO_LIST_TOPIC` (no numeric fallback, same name as the subscriptions page).
  Public list choices for people without an account are `/subscriptions`.

## Related

- Auth SMTP notes: `docs/mobile-app-setup.md`  
- Member `newsletter_opt_in`: `docs/architecture/data-model.md`  
- News drafts (not email): Hermes skill `sampa-news-pipeline` / repo `sampa-post`  


## Member welcome + renewal (T16)

Transactional (not marketing campaign blast):

| Kind | Trigger | Gate |
|------|---------|------|
| **Welcome** | `checkout.session.completed` membership → `membership_status=active` | `BREVO_API_KEY` on Vercel (live; kill-switch `=false`) |
| **Renewal** | `invoice.paid` / `invoice.payment_succeeded` with `billing_reason=subscription_cycle` (not donations) | same |
| **Donation thanks** | One-time: `checkout.session.completed` + `metadata.type=donation` + `mode=payment`. Monthly: `invoice.paid` when donation subscription | same |

Implementation: `api/_lib/brevo-member-email.js` + HTML under `api/_lib/email-templates/`.  
Webhook failures to send email are **logged only** — membership write never fails because of Brevo.

CLI test (bypasses gate with force):

```bash
scripts/run-brevo.sh member-email-test --kind welcome --email you@example.com --fname Josh
scripts/run-brevo.sh member-email-test --kind renewal --email you@example.com --fname Josh
scripts/run-brevo.sh member-email-test --kind donation --email you@example.com --fname Josh --amount-cents 5000 --frequency once
```

**Default:** **LIVE** when `BREVO_API_KEY` is set. Kill-switch: `BREVO_MEMBER_EMAILS_ENABLED=false`.
