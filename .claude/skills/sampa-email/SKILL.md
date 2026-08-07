---
name: sampa-email
description: >-
  Use when working on SAMPA marketing email via Brevo: lists, campaigns, Google
  Group import (Landing A), member list sync, weekly news digest email, or
  site/membership launch mail. Draft + test only unless user explicitly approves
  send. Resume: Resume SAMPA Brevo email.
version: 1.0.0
argument-hint: "[draft campaign | import google group | weekly digest | setup]"
---

# SAMPA Email (Brevo)

## Overview

Marketing email for SAMPA lives **in this repo** (`sampa-website`), not a sibling
project. Auth magic-links already use Brevo SMTP (`no-reply@`). Campaigns use the
**REST API** from **SAMPA `<info@addictionpas.org>`** (Google Workspace **group
alias** for inbound routing — not a paid mailbox).

**Board:** `docs/STATUS.md`  
**Architecture:** `docs/architecture/email-brevo.md`  
**Sticky:** `docs/PARK-brevo-email.md`  
**Setup:** `docs/email/setup-checklist.md`  
**CLI:** `scripts/run-brevo.sh` → `scripts/brevo/cli.mjs`

## When to Use

- Resume / build / send-test SAMPA Brevo campaigns  
- Google Group → Brevo migration  
- Catch-all updates / future weekly digest email  
- Public signup or member `newsletter_opt_in` sync design  
- First campaign: new site + membership  

**Don't use for:** Supabase auth email template copy only; site news *article* drafting (`sampa-post` / news pipeline).

## Hard rules

1. **Draft + test default.** Never mass-send unless Josh says so (or uses Brevo UI).  
2. CLI `campaign-send` requires `--i-understand-send-to-production`.  
3. Secrets: `BREVO_API_KEY` in Hermes `.env` — never git; never reuse SMTP key.  
4. Google Group: **Landing A** — see `docs/email/google-group-import.md`.  
5. User-facing copy: **PA/PAs**; never “physician assistants.”  
6. **v1 = one catch-all list** (`updates` / SAMPA Updates). Topic multi-list deferred.  
7. **Reply-To early = `info@`**; later may flip to no-reply + Contact form.

## Lists (v1)

| Key | Purpose |
|-----|---------|
| `updates` | **Catch-all** marketing (aliases: `newsletter`, `announcements`) |
| `test` | Josh QA only (expand later) |

Env: `BREVO_LIST_UPDATES`, `BREVO_LIST_TEST`.  
Reserved (not product): weekly_news / policy / jobs / cme still exist in Brevo.  
Members with `newsletter_opt_in` → **Updates** only (when sync built). Public signup = **DOI**.

## Commands

```bash
cd ~/Projects/sampa-website   # or laptop clone path

scripts/run-brevo.sh help
scripts/run-brevo.sh setup-check
scripts/run-brevo.sh account          # needs BREVO_API_KEY
scripts/run-brevo.sh lists

# Validate first-campaign pack (no API)
scripts/run-brevo.sh campaign-draft \
  --validate-only \
  --file docs/email/templates/site-membership-launch.json

# Create draft in Brevo (needs key + list ids or numeric listIds in JSON)
scripts/run-brevo.sh campaign-draft \
  --file docs/email/templates/site-membership-launch.json

scripts/run-brevo.sh campaign-test --id <ID> --email josh@...,kelsey@addictionpas.org
# Mass send ONLY after explicit approval:
# scripts/run-brevo.sh campaign-send --id <ID> --i-understand-send-to-production
```

## First campaign workflow

1. Confirm `info@` sender + Test list contacts in Brevo.  
2. Draft from `docs/email/templates/site-membership-launch.*` → **test** list only.  
3. `campaign-test` to Josh + Kelsey.  
4. Import Google Group (Landing A) — no silent 5-list attach.  
5. Human approves → schedule/send in Brevo **or** gated CLI send.  
6. Prefer center link live in footer before production send.

## Weekly digest (later automation)

1. Query Supabase published posts since last send.  
2. Build HTML (title, blurb, link per post).  
3. `campaign-draft` to `weekly_news` (or test first).  
4. Human approves → schedule Monday 5:30 AM PT.  
5. Empty week → no send (or draft “skip” for human kill).

## Exit interview

**Backlog only** — never block unsubscribe. Track on STATUS when implementing.

## Verification

- [ ] `setup-check` / `account` OK when key present  
- [ ] Campaign created as **draft** (not sent)  
- [ ] Test went only to intended addresses  
- [ ] No API keys in git; CSV imports gitignored under `docs/email/imports/`  
- [ ] STATUS/PARK updated on state change  

## Related paths

- `docs/architecture/email-brevo.md`  
- `docs/email/google-group-import.md`  
- `docs/email/setup-checklist.md`  
- Hermes skill (Egg): `sampa-brevo-email` (points here)  
