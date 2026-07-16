# PARK — SAMPA member comments

**Status:** Built on `feature/member-comments` (2026-07-15) — awaiting migration run + merge.  
**Resume phrase:** `Resume SAMPA member comments`  
**Board:** [`STATUS.md`](STATUS.md)  
**Clone:** `~/Projects/sampa-website`

---

## Goal

Active members can react and comment on news articles (web + mobile).

---

## Shipped design

- **Writers:** `is_active_member()` (paid active + staff)
- **Readers:** public on published posts
- **Shape:** flat comments (no threads) + one emoji reaction per member per post
- **Emojis:** thumbs_up 👍, celebrate 🎉, insight ‼️, heart ❤️, clap 👏
- **Moderation:** edit/soft-delete own; editors soft-delete only (cannot rewrite others’ text)
- **Privacy:** `author_name` denormalized on insert — profiles SELECT not widened

## Next

1. Run `supabase/migrations/2026-07-15-member-comments.sql` in Supabase SQL Editor
2. Preview / device-check web + mobile
3. Merge PR → delete this PARK (or slim to “live”)

## Deferred (do not lose)

- **Discussion notifications** — after comments see real use: push/email when someone
  comments on a post you saved (not every reaction). Opt-in; reuse Expo push + Brevo.
  Tracked on [`STATUS.md`](STATUS.md) backlog.

## Out of scope unless asked

Threading, reporting, members-only visibility.
