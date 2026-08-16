# PARK — SAMPA news scout + auto-draft pipeline

**Status:** Parked 2026-07-12 evening — pipeline **operational** (cron daily **6:00 AM PT**, 7 days/week).  
**Resume phrase:** `Resume SAMPA news pipeline`  
**Board of record:** [`STATUS.md`](STATUS.md)  
**Security track (separate session):** [`PARK-security-review.md`](PARK-security-review.md)  

**Specs:** scout [`sampa-news-scout-prompt.md`](sampa-news-scout-prompt.md) · structure [`news-article-structure.md`](news-article-structure.md) · prior art [`news-prior-art-and-updates.md`](news-prior-art-and-updates.md) · agency covers [`cover-style-agency-announcements.md`](cover-style-agency-announcements.md) · stock `docs/assets/stock/`  
**Post skill:** `../.claude/skills/sampa-post/SKILL.md`  
**Hermes skill:** profile `sampa-news-pipeline`  
**Clone (Studio):** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website`  
**Cron job id:** `1f55242ea122` (SAMPA daily news draft menu)

---

## Goal (one line)

Scout → write once (PA H2 baked in) → **internal QC vs source** → Supabase **draft** under Josh → Telegram **editor briefing + menu** → he Publishes. Never auto-publish. No Dunk / cover critic loop unless Josh asks (2026-08-15).

---

## Next (when resumed — tuning only)

1. ~~Secrets + insert + skill + first draft + cron~~ — ✅ 2026-07-12  
2. Monitor first few cron runs (quality, OA preference, 3-draft cap, briefing tone)  
3. Optional: pause/change schedule; cover automation polish  
4. Keep STATUS in sync if cron is paused or redesigned  

---

## Blockers

None for daily operation. Studio must stay awake enough for Hermes gateway (display sleep OK).

---

## Hard rules (don’t regress)

- `status=draft` only; never auto-publish  
- Prefer open-access primaries for auto-drafts  
- Prior art: new / update / duplicate  
- H2 body structure; one-shot covers A/B/C + vision QA (no R1/R2 loop); dual-talon only for scheduling/enforcement (no real seals)  
- **PA / PAs** (never “physician assistants”); PA H2 is judgment + one Monday change, not the Screening/Counseling/MOUD stencil  
- Internal QC before insert: every claim in the primary (`docs/news-article-structure.md` § One-shot)  
