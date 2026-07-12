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

1. Hermes host secrets (not git): service role + Josh `author_id` UUID  
2. Draft-only insert (`posts` + `items` + `item_tags`)  
3. Dry-run → review in `/editor`  
4. Cron + Telegram notify  
5. Update STATUS when live  

---

## Done (pointer)

Design + improved scout prompt + local Studio clone/env/dev verified — details were captured 2026-07-11/12; product status lives in **STATUS.md**.

---

## Blockers

- Service role not on Hermes host yet (anon key cannot insert posts)  
- Author UUID not stored in host env yet  

---

*Thin resume stub only. If this file grows into a roadmap, fold it back into STATUS.md.*
