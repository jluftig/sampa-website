# PARK — SAMPA email / Brevo campaigns

**Status:** In flight — architecture + scripts scaffolded 2026-08-03; Brevo list/sender setup + API key + Google Group import still operator steps.  
**Resume phrase:** `Resume SAMPA Brevo email`  
**Board:** [`STATUS.md`](STATUS.md)  
**How:** [`architecture/email-brevo.md`](architecture/email-brevo.md)  
**Repo skill:** [`.claude/skills/sampa-email/SKILL.md`](../.claude/skills/sampa-email/SKILL.md)  
**Hermes skill:** `sampa-brevo-email`  
**Clone:** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website`

---

## Goal

Programmatic **draft + test** email campaigns via Brevo; multi-list prefs; legacy Google Group → confirm-prefs; first real send = **new site + membership**. Never auto mass-send.

---

## Decisions (locked)

- Lists: Announcements, Weekly News, Policy, Jobs, CME, **Test**
- From: SAMPA `info@addictionpas.org` → Kelsey
- Public: DOI; prefs via Brevo preference center; exit interview = backlog
- Members opt-in → Announcements + Weekly News
- Weekly News: Mon **5:30 AM PT** — **schedule after approving draft**
- Google Group: **Landing A** (confirm prefs)
- Agent: draft + test only unless explicit send

---

## Next (ordered)

1. Josh: create **`BREVO_API_KEY`** (API, not SMTP) → Hermes egg `.env`  
2. Josh/Kelsey: confirm **`info@`** sender verified in Brevo; seed **Test** list (Josh + Kelsey)  
3. Egg: `scripts/run-brevo.sh lists` / create lists if missing; write list IDs to env  
4. Egg: enable Brevo **preference center**; note URL in `docs/email/setup-checklist.md`  
5. Export Google Group CSV → clean → import plan (`docs/email/google-group-import.md`)  
6. Draft **confirm-prefs + site/membership** campaign → test → human schedule/send  
7. Later: member sync job; public signup form; privacy copy; weekly digest draft recipe  

---

## Out of scope unless asked

News site publish pipeline, bup tool, mobile TestFlight.

---

## Clean session paste

> Resume SAMPA Brevo email. Read docs/PARK-brevo-email.md and docs/architecture/email-brevo.md and .claude/skills/sampa-email/SKILL.md. Draft+test only. No mass send without explicit instruction.
