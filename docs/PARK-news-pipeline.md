# PARK — SAMPA news scout + auto-draft pipeline

**Resume phrase:** `Resume SAMPA news pipeline`  
**Board of record:** [`STATUS.md`](STATUS.md) (in flight — do not maintain a second backlog here)  
**Scout spec:** [`sampa-news-scout-prompt.md`](sampa-news-scout-prompt.md)  
**Post skill:** `../.claude/skills/sampa-post/SKILL.md`  
**Clone (Studio):** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website`

---

## Goal (one line)

Scout → sampa-post → Supabase **draft** under Josh → he Publishes. Never auto-publish.

---

## Next (ordered)

1. ~~Hermes host secrets~~ — ✅ set (`SAMPA_SUPABASE_SECRET_KEY` sb_secret + author UUID)
2. ~~Draft-only insert script~~ — ✅ `scripts/insert-sampa-draft.mjs`
3. ~~Smoke-test insert~~ — ✅ 2026-07-12 draft `2c264b56-4b31-40ac-89b2-61cf7ed09194`  
   (`pipeline-smoke-test-delete-me-2026-07`) — **Josh: open in editor, confirm, then delete**
4. Wire scout → sampa-post → insert (Hermes skill) + Telegram notify
5. Cron after one real article dry-run
6. Update STATUS when pipeline is operational  

---

## Done (pointer)

Design + improved scout prompt + local Studio clone/env/dev verified — details were captured 2026-07-11/12; product status lives in **STATUS.md**.

---

## Blockers

- Service role not on Hermes host yet (anon key cannot insert posts)  
- Author UUID not stored in host env yet  

---

*Thin resume stub only. If this file grows into a roadmap, fold it back into STATUS.md.*
