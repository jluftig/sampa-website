# PARK — Newsletter scout inbox (Yale + Workspace)

**Status:** Parked 2026-07-22 — design agreed; mailbox not wired yet.  
**Resume phrase:** `Resume SAMPA newsletter scout`  
**Board:** [`STATUS.md`](STATUS.md)  
**Related:** news pipeline cron (live) — [`PARK-news-pipeline.md`](PARK-news-pipeline.md)

---

## Goal

Feed Yale Program in Addiction Medicine (and later ASAM/etc.) newsletters into the daily SAMPA news **scout** lane — draft menu only, never auto-publish.

---

## Agreed design

- **Do not** connect Egg to Josh’s full personal inbox.  
- **Do** use **Google Workspace** (already set up) dedicated mailbox.  
- Default address to create: **`newsdesk@addictionpas.org`** (or `scout@` / `newsletter@` if Josh prefers).  
- Flow: subscribe desk address to lists ± auto-forward filters from Josh → IMAP (Himalaya on Studio) → daily cron scout.  
- Secrets: app password / OAuth on Studio only; never git.

---

## Next (ordered)

1. Josh: Workspace Admin → create user **`newsdesk@addictionpas.org`** (preferred) + 2FA  
2. Josh: confirm **app passwords** allowed (or note blocked → OAuth path)  
3. Josh: subscribe desk to Yale PAAM / addiction medicine newsletter  
4. Optional: Gmail filters on Josh’s account → forward matching Yale mail to newsdesk  
5. Egg: Himalaya config for that mailbox only; test list/read  
6. Egg: patch `sampa-news-pipeline` scout step (last 24–48h inbox → candidates → prior-art/OA rules)  
7. Egg: first dry-run morning brief shows **Inbox lane**  

---

## Out of scope unless asked

Member comments, cover art, security OAuth publish for membership.

---

## Clean session paste

> Resume SAMPA newsletter scout. Read docs/PARK-newsletter-scout.md. Dedicated Workspace newsdesk@ only — not full personal inbox. Wire Himalaya + cron scout lane after mailbox exists.
