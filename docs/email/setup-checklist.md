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

Create (or confirm) these exact conceptual lists:

| Env key suffix | Suggested Brevo name |
|----------------|----------------------|
| ANNOUNCEMENTS | SAMPA Announcements |
| WEEKLY_NEWS | SAMPA Weekly News |
| POLICY | SAMPA Policy & positions |
| JOBS | SAMPA Jobs & opportunities |
| CME | SAMPA Events & CME |
| TEST | SAMPA Test |

Add Josh + Kelsey emails to **SAMPA Test** only.

```bash
cd ~/Projects/sampa-website
scripts/run-brevo.sh account
scripts/run-brevo.sh lists
```

## 4. Preference center

1. Brevo → Contacts → Settings → **Subscription forms / Preference page** (wording varies by UI).  
2. Enable multi-list preference center covering the five public lists.  
3. Ensure campaign footers include preference + unsubscribe (Brevo default footers OK for v1).  
4. Paste the public preference URL here when known:

```
PREFERENCE_CENTER_URL=
```

## 5. Double opt-in (public)

- Public forms (when built): use Brevo DOI / double opt-in templates.  
- Members: verified via site auth; still honor list prefs.  
- Legacy Google Group: **Landing A** — see `google-group-import.md`.

## 6. Smoke test

```bash
scripts/run-brevo.sh account
scripts/run-brevo.sh campaign-draft --validate-only --file docs/email/templates/site-membership-launch.json
# after key + lists:
scripts/run-brevo.sh campaign-draft --file docs/email/templates/site-membership-launch.json
scripts/run-brevo.sh campaign-test --id <campaignId> --email you@...,kelsey@addictionpas.org
```

Mass send only with explicit approval + `campaign-send --i-understand-send-to-production`.

## 7. Backlog (do not block v1)

- [ ] Exit interview after full unsubscribe  
- [ ] Site `/email-preferences` (optional; Brevo center is enough first)  
- [ ] Privacy policy multi-list + Brevo disclosure update  
- [ ] Public footer signup  
- [ ] Automated member sync cron  
- [ ] Weekly digest auto-draft cron (still human schedule at Mon 5:30 PT)  
