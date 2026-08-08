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
| `updates` | **SAMPA Updates** | Public + members | **Single catch-all** marketing list |
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
  → SAMPA Updates

Member (Supabase) with newsletter_opt_in = true
  → SAMPA Updates

Google Group legacy (~130)
  → import Brevo only (not auth.users)
  → SOURCE=google_group_legacy
  → Landing A: stay-or-unsub / confirm before treating as opted Updates
  → first major CTA: new site + membership

Unsubscribe
  → always one-click full exit
  → multi-list preference center = later (single list now)
  → exit interview = backlog (never block unsub)
```

**Source of truth**

| Concern | System |
|---------|--------|
| Who receives marketing mail | **Brevo** Updates list + attributes |
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

## Site surfaces (product backlog — see STATUS)

- Public multi-list signup + DOI  
- Dashboard: multi-list prefs or deep link to Brevo preference center  
- Privacy copy: name lists + Brevo as provider  
- Footer signup without membership  

## Related

- Auth SMTP notes: `docs/mobile-app-setup.md`  
- Member `newsletter_opt_in`: `docs/architecture/data-model.md`  
- News drafts (not email): Hermes skill `sampa-news-pipeline` / repo `sampa-post`  


## Member welcome + renewal (T16)

Transactional (not marketing campaign blast):

| Kind | Trigger | Gate |
|------|---------|------|
| **Welcome** | `checkout.session.completed` membership → `membership_status=active` | `BREVO_MEMBER_EMAILS_ENABLED=true` on Vercel |
| **Renewal** | `invoice.paid` / `invoice.payment_succeeded` with `billing_reason=subscription_cycle` (not donations) | same |

Implementation: `api/_lib/brevo-member-email.js` + HTML under `api/_lib/email-templates/`.  
Webhook failures to send email are **logged only** — membership write never fails because of Brevo.

CLI test (bypasses gate with force):

```bash
scripts/run-brevo.sh member-email-test --kind welcome --email you@example.com --fname Josh
scripts/run-brevo.sh member-email-test --kind renewal --email you@example.com --fname Josh
```

**Default:** gate **off**. Josh enables on Vercel after approving templates.
