# Handoff → Egg (Studio) — activate T5 Brevo DOI

**From:** Cursor (laptop) + Josh  
**To:** Egg (Hermes) on Mac Studio  
**Date:** 2026-08-07  
**Goal:** Turn on live double opt-in for the public **SAMPA Updates** signup chip (code already on `main`).

**Board:** [`STATUS.md`](STATUS.md) — T5 is **Done** (PR #62) with ops still needed.  
**Do not** re-claim T5. This is ops finish-work, not a new product task.  
**Related:** T3 still yours (campaigns / first send). Do **not** mass-send.  
**Secrets:** Hermes egg `.env` only — never commit keys.

---

## Clean session paste

> Activate T5 Brevo DOI. Read `docs/HANDOFF-egg-2026-08-07-t5-doi.md` and `docs/email/setup-checklist.md` §5. Public signup UI is live on www (PR #62) but returns 503 until Vercel has `BREVO_API_KEY`, `BREVO_LIST_UPDATES=3`, `BREVO_DOI_TEMPLATE_ID`. You already have the API key + list ids in Hermes egg `.env`. Create DOI template in Brevo, set Production env on Vercel, redeploy, smoke-test. Update STATUS Done notes when live. No mass send.

---

## 1. First actions

```bash
cd ~/Projects/sampa-website && git pull --ff-only
# Confirm T5 row in STATUS Done mentions PR #62 + ops activate
```

What Cursor shipped (already merged):

| Piece | Where |
|-------|--------|
| Signup chip above footer | `src/components/NewsletterSignup.jsx` + `Footer.jsx` |
| API | `api/newsletter-signup.js` → `POST /contacts/doubleOptinConfirmation` |
| Confirm page | `/newsletter-confirmed` |
| Privacy | Updates + Brevo disclosure |
| Docs | `docs/email/setup-checklist.md` §5 · `docs/architecture/email-brevo.md` |

Without env, API returns **503** “temporarily unavailable” (by design).

---

## 2. What you already have (reuse — don’t regenerate unless missing)

From Hermes egg env (`~/.hermes/profiles/egg/.env`) and T3 work:

| Item | Value / source |
|------|----------------|
| `BREVO_API_KEY` | Already in egg `.env` (campaign API key — **not** Supabase SMTP) |
| `BREVO_LIST_UPDATES` | **3** (SAMPA Updates) |
| `BREVO_LIST_TEST` | **8** (Josh only) |
| Sender | `info@addictionpas.org` active |
| Domain | Authenticated + verified |

Verify quickly:

```bash
cd ~/Projects/sampa-website
scripts/run-brevo.sh account
scripts/run-brevo.sh lists
# Confirm Updates = 3
```

Copy the API key **out of egg `.env` into Vercel** (same key is fine). Site Production does not read Hermes `.env`.

---

## 3. Create Brevo DOI template (human + Egg in UI)

Josh + Egg in Brevo dashboard:

1. Brevo → **Campaigns → Templates** (or Email → Templates).
2. Create a **Double opt-in** template (not a normal marketing campaign).
3. Body must include confirm link: **`{{ params.DOIurl }}`**  
   Example CTA: “Confirm your subscription” → URL = `{{ params.DOIurl }}`.
4. From: **SAMPA** `<info@addictionpas.org>`.
5. Tone: short, nonprofit, no membership required; name **SAMPA Updates**.
6. Save → note numeric **template id** (URL or template details).

Optional brand assets already live:

- Logo: `https://www.addictionpas.org/email/sampa-logo.png`
- Colors: teal `#0F766E` / `#36A79C`, purple `#8513C1`

---

## 4. Set Vercel Production env

Project: **sampa-website** (www.addictionpas.org).  
Environment: **Production** (add Preview too if you want branch previews to DOI-test).

| Name | Value |
|------|--------|
| `BREVO_API_KEY` | from egg `.env` (`xkeysib-…`) |
| `BREVO_LIST_UPDATES` | `3` |
| `BREVO_DOI_TEMPLATE_ID` | *(id from step 3)* |

Optional:

```bash
BREVO_DOI_REDIRECT_URL=https://www.addictionpas.org/newsletter-confirmed
```

If unset, API defaults to `{request origin}/newsletter-confirmed`.

**Redeploy Production** after saving env (env is build/runtime for serverless — redeploy required).

If `vercel` CLI is logged in on Studio:

```bash
# example — use dashboard if easier
vercel env add BREVO_API_KEY production
vercel env add BREVO_LIST_UPDATES production   # 3
vercel env add BREVO_DOI_TEMPLATE_ID production
vercel --prod   # or trigger Redeploy in UI
```

Also put `BREVO_DOI_TEMPLATE_ID` in Hermes egg `.env` for local smoke via `vercel dev` later (optional).

---

## 5. Smoke test (required before calling it live)

1. Open https://www.addictionpas.org → scroll to **SAMPA Updates** chip.
2. Submit a **throwaway** address Josh controls (not a blast list).
3. UI: “Check your inbox for a confirmation link…”.
4. Inbox: Brevo DOI email → click confirm.
5. Land on https://www.addictionpas.org/newsletter-confirmed.
6. Brevo → Contacts: email on **SAMPA Updates**, attr `SOURCE=public_signup`.

If 503 after redeploy: check all three env names/spelling, template id &gt; 0, Redeploy completed, function logs on Vercel for `newsletter-signup`.

---

## 6. Close the loop on STATUS (after smoke passes)

Edit `docs/STATUS.md`:

- T5 **Done** notes → add “DOI live 2026-08-0X; Vercel env + template id N”.
- Next up checkbox for newsletter already `[x]` — leave; trim “Activate DOI…” wording if fully live.
- `docs/email/setup-checklist.md` backlog: check off public footer signup if accurate.
- Thin note in [`PARK-brevo-email.md`](PARK-brevo-email.md): T5 DOI activated (or still blocked).

```bash
git pull
# edit STATUS (+ PARK if needed)
git add docs/STATUS.md docs/PARK-brevo-email.md docs/email/setup-checklist.md
git commit -m "docs: T5 Brevo DOI activated on Production"
git push origin main
```

**Do not** invent a new Task ID for this ops finish unless Josh wants one.

---

## 7. Out of scope

- Weekly #01 production send (T3 — Josh gate).
- Member welcome/renewal enable (`BREVO_MEMBER_EMAILS_ENABLED` — T16).
- Member `newsletter_opt_in` sync.
- Multi-topic lists / preference center.
- Mass send / `sendNow`.

---

## Pointers

| Doc | Why |
|-----|-----|
| [`email/setup-checklist.md`](email/setup-checklist.md) §5 | Canonical DOI + env steps |
| [`architecture/email-brevo.md`](architecture/email-brevo.md) | Lists + consent model |
| [`PARK-brevo-email.md`](PARK-brevo-email.md) | T3 sticky (your ongoing Brevo claim) |
| `api/newsletter-signup.js` | Exact Brevo request shape |

**Conflict rule:** pull `main` first. Cursor won’t touch Brevo secrets; you own env + template with Josh.
