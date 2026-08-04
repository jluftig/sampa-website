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
| Marketing campaigns | Brevo **REST API** | From: **SAMPA** `<info@addictionpas.org>` (alias → Kelsey `kelsey@addictionpas.org`) |

Domain `addictionpas.org` is already authenticated in Brevo (DKIM/DMARC). Register **`info@` as a sender** before first campaign send.  
Use a dedicated **`BREVO_API_KEY`** (API), not the SMTP key used by Supabase.

Docs: [developers.brevo.com](https://developers.brevo.com/) · base `https://api.brevo.com/v3` · header `api-key: …`

## Standing lists (v1)

| List key | Brevo name (suggested) | Who | Notes |
|----------|------------------------|-----|--------|
| `announcements` | SAMPA Announcements | Public + members | Org news, elections, site/features |
| `weekly_news` | SAMPA Weekly News | Public + members | Mon **5:30 AM PT** target after human approve |
| `policy` | SAMPA Policy & positions | Opt-in | Position papers, advocacy |
| `jobs` | SAMPA Jobs & opportunities | Opt-in | Jobs, fellowships |
| `cme` | SAMPA Events & CME | Opt-in | Webinars, CME, live events |
| `test` | SAMPA Test | Josh, Kelsey, QA only | Every campaign: test here first |

Store numeric list IDs in env once created: `BREVO_LIST_ANNOUNCEMENTS`, etc. (see `scripts/brevo`).

**No board/internal marketing list required for v1** — use **Test** for QA. A private board list can be added later for non-public ops mail (do not mix with public lists).

## Audiences & consent

```
Public signup (site, later)
  → double opt-in (DOI)
  → chosen lists only

Member (Supabase) with newsletter_opt_in = true
  → Announcements + Weekly News
  → Policy / Jobs / CME still opt-in via prefs

Google Group legacy (~130)
  → import Brevo only (not auth.users)
  → SOURCE=google_group_legacy
  → Landing A: confirm-prefs email before full multi-list placement
  → first major CTA: new site + membership

Unsubscribe
  → always one-click full exit
  → preference center for “only news / only announcements / …”
  → exit interview = backlog (never block unsub)
```

**Source of truth**

| Concern | System |
|---------|--------|
| Who receives which marketing mail | **Brevo** lists + attributes |
| Who has a site account / paid membership | **Supabase** (+ Stripe) |
| Legacy interest without an account | **Brevo** (optional future `email_prospects` table only if staff need in-app roster) |

Do **not** bulk-create Supabase auth users for the Google Group.

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
