# Brevo setup checklist (SAMPA)

Operator steps in the Brevo UI + env. Architecture: [`../architecture/email-brevo.md`](../architecture/email-brevo.md).

## 1. API key

1. Brevo → SMTP & API → API Keys → **Generate** (full access or email+contacts as needed).  
2. Name it `hermes-sampa-campaigns` (or similar).  
3. Put in Hermes egg env only (never git):

```bash
# ~/.hermes/profiles/egg/.env
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=info@addictionpas.org
BREVO_SENDER_NAME=SAMPA
BREVO_REPLY_TO=info@addictionpas.org
```

Optional after lists exist:

```bash
BREVO_LIST_ANNOUNCEMENTS=   # numeric id
BREVO_LIST_WEEKLY_NEWS=
BREVO_LIST_POLICY=
BREVO_LIST_JOBS=
BREVO_LIST_CME=
BREVO_LIST_TEST=
```

**Do not** reuse the Supabase SMTP key as `BREVO_API_KEY`.

## 2. Sender

- From: **SAMPA** / `info@addictionpas.org`  
- Inbox: alias → `kelsey@addictionpas.org`  
- Auth path stays `no-reply@` via SMTP  

In Brevo: Senders → add/verify `info@` if not already listed under authenticated domain.

## 3. Lists

**v1 product:** one catch-all + Test.

| Env | Brevo name | Role |
|-----|------------|------|
| `BREVO_LIST_UPDATES` | SAMPA Updates | Catch-all marketing |
| `BREVO_LIST_TEST` | SAMPA Test | Josh only (expand later) |

Topic lists (Weekly News / Policy / Jobs / CME) may exist in Brevo as **reserved** — do not use for v1 signup or sync.

Add Josh email to **SAMPA Test** only.

```bash
cd ~/Projects/sampa-website
scripts/run-brevo.sh account
scripts/run-brevo.sh lists
```

## 4. Preference center

- **v1 (single list):** global unsubscribe in campaign footer is enough.  
- Multi-list preference center only if topic lists ship later.  
- Paste public preference URL here if you enable one anyway:

```
PREFERENCE_CENTER_URL=
```

## 5. Double opt-in (public) — T5

Site form: footer → `POST /api/newsletter-signup` → Brevo
`POST /contacts/doubleOptinConfirmation` → **SAMPA Updates** only.
Confirm redirect: `/newsletter-confirmed`.

1. Brevo → Campaigns → Templates → create a **Double opt-in** template
   (must include `{{ params.DOIurl }}` for the confirm link).  
2. Note the numeric **template id**.  
3. Vercel **Production** (and Preview if you want) server env:

```bash
BREVO_API_KEY=xkeysib-...          # same campaign API key as Hermes (not SMTP)
BREVO_LIST_UPDATES=3               # SAMPA Updates
BREVO_DOI_TEMPLATE_ID=13            # SAMPA Updates DOI (created 2026-08-07)
# optional:
# BREVO_DOI_REDIRECT_URL=https://www.addictionpas.org/newsletter-confirmed
```

4. Smoke: submit footer form with a throwaway address → confirm email → land on
   `/newsletter-confirmed` → contact on Updates with `SOURCE=public_signup`.

- Members: verified via site auth (dashboard opt-in → sync later).  
- Legacy Google Group: **Landing A** — see `google-group-import.md`.

## 6. Smoke test

```bash
scripts/run-brevo.sh account
scripts/run-brevo.sh campaign-draft --validate-only --file docs/email/templates/site-membership-launch.json
# after key + lists + active info@ sender:
scripts/run-brevo.sh campaign-draft --file docs/email/templates/site-membership-launch.json
scripts/run-brevo.sh campaign-test --id <campaignId> --email luftig@gmail.com
```

Mass send only with explicit approval + `campaign-send --i-understand-send-to-production`.

## 7. Backlog (do not block v1)

- [ ] Exit interview after full unsubscribe  
- [ ] Reply-To flip to no-reply + Contact us form (scale)  
- [ ] Site `/email-preferences` (optional)  
- [ ] Privacy policy Brevo disclosure update  
- [x] Public footer signup (T5 — code live; DOI template id 13; needs Vercel env + redeploy) 
- [ ] Automated member sync cron  
- [ ] Topic lists / multi-list prefs if volume grows  
- [ ] Weekly digest auto-draft (still human approve)  
