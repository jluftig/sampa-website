# PARK — SAMPA news scout + auto-draft pipeline

**Status:** Parked 2026-07-12 evening — pipeline **operational** (cron daily 6am PT).  
**Resume phrase:** `Resume SAMPA news pipeline`  
**Active next track:** Website security review pre-membership recruitment  
**Agency cover style:** [`cover-style-agency-announcements.md`](cover-style-agency-announcements.md)  
**Scout spec:** [`sampa-news-scout-prompt.md`](sampa-news-scout-prompt.md)  
**Post skill:** `../.claude/skills/sampa-post/SKILL.md`  
**Clone (Studio):** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website`

---

## Goal (one line)

Scout → sampa-post → Supabase **draft** under Josh → he Publishes. Never auto-publish.

---

## Next (ordered)

1. ~~Hermes host secrets~~ — ✅  
2. ~~Draft-only insert script~~ — ✅ `scripts/insert-sampa-draft.mjs` + `scripts/run-insert-draft.sh`  
3. ~~Smoke-test insert~~ — ✅ (delete smoke test if still present)  
4. ~~Hermes skill~~ — ✅ profile skill `sampa-news-pipeline`  
5. ~~First real draft via pipeline~~ — ✅ 2026-07-12 DEA 7-OH post  
   - Draft: https://www.addictionpas.org/editor/5799bb1f-eee5-4491-b67a-c630d1ad9893  
   - **Josh: review, edit, Publish or delete**  
6. Cron: **daily ~3 draft menu** (OA-preferred, distinct topics); Josh selects what to publish  
7. Update STATUS when cron is live and stable  

---

## Done (pointer)

Design + improved scout prompt + local Studio clone/env/dev verified — details were captured 2026-07-11/12; product status lives in **STATUS.md**.

---

## Blockers

- Service role not on Hermes host yet (anon key cannot insert posts)  
- Author UUID not stored in host env yet  

---

*Thin resume stub only. If this file grows into a roadmap, fold it back into STATUS.md.*
