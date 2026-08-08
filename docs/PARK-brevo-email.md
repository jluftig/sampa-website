# PARK — SAMPA email / Brevo campaigns

**Status:** Active 2026-08-07 (**T3 · egg** — claimed In Progress on STATUS).  
Infra + Weekly #01 draft path **done**; first production audience/send **not** done.  
Site still lists member email **In development**.  
**Resume phrase:** `Resume SAMPA Brevo email`  
**Board:** [`STATUS.md`](STATUS.md) · Task **T3**  
**How:** [`architecture/email-brevo.md`](architecture/email-brevo.md)  
**Repo skill:** [`.claude/skills/sampa-email/SKILL.md`](../.claude/skills/sampa-email/SKILL.md)  
**Hermes skill:** `sampa-brevo-campaigns`  
**Clone:** `~/Projects/sampa-website` · branch **`main`** · secrets: Hermes egg `.env` only

---

## Goal

Programmatic **draft + test** Brevo campaigns; **one catch-all Updates list**; Google Group Landing A; first send = Weekly / site+membership launch. Flip site copy to **Live** only after real sends. Never auto mass-send.

---

## Locked decisions (2026-08-07)

| Topic | Choice |
|-------|--------|
| Lists | **SAMPA Updates** (catch-all, id **3**) + **SAMPA Test** (id **8**). Topic lists 4–7 reserved, not product. |
| Test roster | **`luftig@gmail.com` only** (for now) |
| From | SAMPA **`info@addictionpas.org`** (active) |
| `info@` nature | Google Workspace **group alias** — OK for From/Reply-To |
| Reply-To early | **`info@`** |
| Reply-To later | **`no-reply@`** + Contact us form (scale) |
| Brand | Logo `public/email/sampa-logo.png`; branded links **`em.addictionpas.org`** |
| Domain auth | **Authenticated + verified** in Brevo (Porkbun SPF/DKIM/DMARC + em CNAMEs) |
| Agent | Draft + test only unless explicit send |

---

## Done

- **2026-08-07:** Imported **120** cleaned contacts → **SAMPA Updates** (id 3); attrs `SOURCE=google_group_legacy`, `LEGACY_MEMBER=true`. CSV cleaned locally under `docs/email/imports/` (**gitignored**). **No production send.**

- `BREVO_API_KEY` + list env ids in Hermes egg `.env`  
- Domain auth (SPF `include:_spf.google.com include:spf.brevo.com`, DKIM, DMARC, `em` / `r.em` / `img.em`)  
- Senders `info@` + `admin@` active  
- Catch-all Updates + Test; custom attrs  
- CLI: free-plan no tags; FIRSTNAME; `updates` key  
- **SAMPA Weekly Issue 01** HTML + JSON; draft+test through campaign **#5** (From info@)  

---

## Related task T16 (egg)

Welcome + renewal transactional templates live; webhook wired; **BREVO_MEMBER_EMAILS_ENABLED** off until Josh OK. CLI: `member-email-test`.

## Next (ordered)

1. ~~Google Group / contacts CSV → **SAMPA Updates**~~ — **done 2026-08-07** (120 unique; SOURCE=google_group_legacy; **no send**)  
2. Final Weekly #01 polish if needed (logo v3 live)  
3. **Josh gate:** explicit approve → first production send of Weekly #01 to **Updates** only (never agent `sendNow` without “send campaign N”)  
4. Flip site copy to Live for member email **only if** accurate after first real send  
5. Later: member `newsletter_opt_in` sync; public DOI form (T5); Reply-To flip  

---

## Laptop / other-agent note

- **Owner = egg** on STATUS Tasks T3 — pull `main` before editing; do not re-claim.  
- Secrets stay off git (Hermes `.env`).  
- Do not mass-send.

---

## Clean session paste

> Resume SAMPA Brevo email. Read docs/PARK-brevo-email.md + docs/STATUS.md T3. Catch-all Updates + Test (Josh). Domain auth done. Draft+test only.
