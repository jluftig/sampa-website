# PARK — SAMPA security review (pre-membership)

**Status:** Active track for next session (parked from news-pipeline thread 2026-07-12).  
**Resume phrase:** `Resume SAMPA security review`  
**Board:** [`STATUS.md`](STATUS.md)  
**Full review:** [`SECURITY-REVIEW-2026-07-12.md`](SECURITY-REVIEW-2026-07-12.md)  
**Clone:** `~/Projects/sampa-website` · **Remote:** `jluftig/sampa-website`

---

## Goal (one line)

Verify site is safe to recruit members broadly: legal pages OK, backend not leaking, architecture sound; close P0 ops gaps.

---

## Next (ordered)

1. Read `docs/SECURITY-REVIEW-2026-07-12.md` + security sections in AGENTS.md/CLAUDE.md  
2. **P0:** Publish Google OAuth (or magic-link-only launch) — `docs/member-area-setup.md`  
3. **P0:** Verify Vercel Production env (Stripe live, webhook secret/events, Supabase elevated key server-only)  
4. **P0:** E2E membership: signup → pay → webhook → active → `/members`; non-member blocked; no self-admin  
5. **P1 as prioritized:** donate rate limit, directory defaults, optional counsel, light RLS tests  

---

## Out of scope unless asked

- News pipeline / cron (`Resume SAMPA news pipeline`)

---

## Clean session paste

Use the long start prompt from the security-review Telegram thread, or:

> Resume SAMPA security review. Read docs/SECURITY-REVIEW-2026-07-12.md and docs/PARK-security-review.md. Execute P0 checklist only first. Not the news pipeline.
