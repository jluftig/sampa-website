# PARK — SAMPA email / Brevo campaigns

**Status:** Active 2026-08-07 (T3 · egg) — catch-all list model; branded template; Test = Josh only. **Blocker:** activate sender `info@` (drafts may use `admin@` From until then). Site email still **in development**.  
**Resume phrase:** `Resume SAMPA Brevo email`  
**Board:** [`STATUS.md`](STATUS.md) · Task **T3**  
**How:** [`architecture/email-brevo.md`](architecture/email-brevo.md)  
**Repo skill:** [`.claude/skills/sampa-email/SKILL.md`](../.claude/skills/sampa-email/SKILL.md)  
**Hermes skill:** `sampa-brevo-campaigns`  
**Clone:** `~/Projects/sampa-website` · branch **`main`**

---

## Goal

Programmatic **draft + test** Brevo campaigns; **one catch-all Updates list**; Google Group Landing A; first send = site + membership. Flip site copy to **Live** only when first real sends work. Never auto mass-send.

---

## Locked decisions (2026-08-07)

| Topic | Choice |
|-------|--------|
| Lists | **SAMPA Updates** (catch-all) + **SAMPA Test**. Topic lists reserved, not product. |
| Test roster | **`luftig@gmail.com` only** (for now) |
| From | SAMPA `info@addictionpas.org` once **active** in Brevo |
| `info@` nature | Google Workspace **group alias** — OK for From/Reply-To; routes handlers without a paid seat |
| Reply-To early | **`info@`** (replies welcome while list is small) |
| Reply-To later | **`no-reply@`** + Contact us form (scale / spam control) |
| Brand | Logo `public/email/sampa-logo.png` + teal/purple site colors in HTML templates |
| Agent | Draft + test only unless explicit send |

---

## Done

- API key, six lists created (product = Updates **3** + Test **8**), attrs  
- Test list = Josh only  
- Branded HTML pack `docs/email/templates/site-membership-launch.*`  
- CLI: free-plan no tags; FIRSTNAME map; `updates` list key  

---

## Next

1. Josh: activate **`info@`** sender in Brevo UI  
2. Confirm branded test in gmail (logo loads after deploy)  
3. Landing A Google Group import → Updates  
4. Human approve → send first real campaign  
5. Later: site Live copy; member sync; DOI form; optional Reply-To flip  

---

## Clean session paste

> Resume SAMPA Brevo email. Catch-all Updates + Test (Josh). Reply-To info@ early. Draft+test only.
