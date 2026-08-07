# PARK — SAMPA email / Brevo campaigns

**Status:** Active 2026-08-07 (T3 · egg) — API live; lists + Test seeded; first draft **campaign id 2** test-sent. **Blocker:** activate/verify sender `info@addictionpas.org` (still inactive; draft used `admin@` temporarily). Site lists email **in development**.  
**Resume phrase:** `Resume SAMPA Brevo email`  
**Board:** [`STATUS.md`](STATUS.md) · Task **T3**  
**How:** [`architecture/email-brevo.md`](architecture/email-brevo.md)  
**Repo skill:** [`.claude/skills/sampa-email/SKILL.md`](../.claude/skills/sampa-email/SKILL.md)  
**Hermes skill:** `sampa-brevo-campaigns`  
**Clone:** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website` · branch **`main`**

---

## Goal

Programmatic **draft + test** Brevo campaigns; multi-list prefs; Google Group Landing A; first send = site + membership. Flip site copy to **Live** only when lists + first real sends work. Never auto mass-send.

---

## Done

- Architecture, CLI (`scripts/run-brevo.sh`), templates, repo + Hermes skills  
- Locked lists/from/prefs/weekly 5:30 PT schedule-after-approve / Landing A  
- Ad Grants site live; member email described as **in development** on www  
- **2026-08-07:** `BREVO_API_KEY` live (account `admin@addictionpas.org`, free 300 credits)  
- Lists created + env ids: Announcements **3**, Weekly News **4**, Policy **5**, Jobs **6**, CME **7**, Test **8**  
- Custom attrs: `MEMBER_STATUS`, `IS_BOARD`, `STATE`, `SOURCE`, `LEGACY_MEMBER`  
- Test contacts: `luftig@gmail.com`, `kelsey@addictionpas.org`, `admin@addictionpas.org`  
- Sender `info@` **registered** (id 2) but **`active: false`** — needs Brevo UI verify  
- Draft campaign **id 2** (site-membership-launch, recipients Test) — **sendTest** to Josh + Kelsey OK  
  - Temporary From: `admin@` until `info@` active  
- Free plan: campaign **tags not allowed** — CLI defaults omit tag (`--with-tag` for paid)

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

1. **Josh (Brevo UI):** Senders → verify/activate **`info@addictionpas.org`** (check inbox/spam for confirm; domain DNS if prompted)  
2. Preference center covering the five public lists; paste URL into setup checklist  
3. Re-draft (or update campaign 2) with From `info@` → re-test  
4. Google Group CSV → Landing A import  
5. Human approve → send/schedule first real campaign (not agent sendNow unless explicit)  
6. Then: site copy Live if accurate; member sync; public DOI signup later  

---

## Out of scope unless asked

News pipeline, bup tool, mobile App Store, particle hero.

---

## Clean session paste

> Resume SAMPA Brevo email. Read docs/PARK-brevo-email.md and docs/architecture/email-brevo.md and .claude/skills/sampa-email/SKILL.md. Site currently lists email as in development. Draft+test only. No mass send without explicit instruction.
