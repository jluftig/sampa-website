# PARK — SAMPA email / Brevo campaigns

**Status:** Parked 2026-08-04 — scaffold + product decisions locked; site lists email **in development** (Ad Grants honesty). PR #56 merged.  
**Resume phrase:** `Resume SAMPA Brevo email`  
**Board:** [`STATUS.md`](STATUS.md)  
**How:** [`architecture/email-brevo.md`](architecture/email-brevo.md)  
**Repo skill:** [`.claude/skills/sampa-email/SKILL.md`](../.claude/skills/sampa-email/SKILL.md)  
**Hermes skill:** `sampa-brevo-email`  
**Clone:** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website` · branch **`main`**

---

## Goal

Programmatic **draft + test** Brevo campaigns; multi-list prefs; Google Group Landing A; first send = site + membership. Flip site copy to **Live** only when lists + first real sends work. Never auto mass-send.

---

## Done

- Architecture, CLI (`scripts/run-brevo.sh`), templates, repo + Hermes skills  
- Locked lists/from/prefs/weekly 5:30 PT schedule-after-approve / Landing A  
- Ad Grants site live; member email described as **in development** on www  

---

## Decisions (locked)

- Lists: Announcements, Weekly News, Policy, Jobs, CME, **Test**  
- From: SAMPA `info@` → Kelsey; auth stays `no-reply@`  
- Public DOI; Brevo pref center; exit interview = backlog  
- Members opt-in → Announcements + Weekly News  
- Agent: draft + test only unless explicit send  
- Git home = **this repo** (not a sibling email project)  

---

## Next (ordered)

1. Josh: `BREVO_API_KEY` → Hermes egg `.env`  
2. `info@` sender + **Test** list (Josh + Kelsey)  
3. Create lists; set `BREVO_LIST_*`; preference center URL  
4. Google Group CSV → Landing A import  
5. Draft/test confirm-prefs + site/membership campaign → human send  
6. Then: site copy Live if accurate; member sync; public DOI signup later  

---

## Out of scope unless asked

News pipeline, bup tool, mobile App Store, particle hero.

---

## Clean session paste

> Resume SAMPA Brevo email. Read docs/PARK-brevo-email.md and docs/architecture/email-brevo.md and .claude/skills/sampa-email/SKILL.md. Site currently lists email as in development. Draft+test only. No mass send without explicit instruction.
