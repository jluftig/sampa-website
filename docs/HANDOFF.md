# SAMPA website — human hand-off

_Last updated: 2026-08-03_

This file is a **thin front door** for a human taking over cold. It is **not** the
system manual and **not** the product board.

Live site: **https://www.addictionpas.org**  
Repo: **https://github.com/jluftig/sampa-website**

---

## What to read (sources of truth)

| Need | Document |
|------|----------|
| What’s live, blocked, next | **[STATUS.md](STATUS.md)** |
| How the system is built / must not break | **[CLAUDE.md](../CLAUDE.md)** (+ [architecture/](architecture/) as needed) |
| One-time Stripe / Google / env setup | [member-area-setup.md](member-area-setup.md) |
| Mobile auth / push / TestFlight setup | [mobile-app-setup.md](mobile-app-setup.md) |

Everything else (permissions detail, Stripe flows, RLS, mobile behavior, publish UX)
lives in those docs and the code. Prefer **one board (STATUS)** and **one architecture
entry (CLAUDE)** over maintaining a second prose manual here.

---

## Fastest path: have an AI walk you through it

In Cursor, Claude Code, Codex, Hermes, ChatGPT-with-repo, etc.:

> Read `docs/STATUS.md` and `CLAUDE.md` (and `docs/architecture/` if needed). Then
> explain how this site works in plain English: what it is, the three services
> (Vercel, Supabase, Stripe/Google), who can do what, how news gets published, how
> membership and donations work, and anything currently blocked. Point me at the
> dashboards I’ll use day to day. Ask me what role I have if it matters.

Then ask follow-ups (“how do I add an editor?”, “why is donate unavailable?”).  
An agent with repo access can always rebuild a full operator guide from STATUS +
CLAUDE + code — that’s intentional so we don’t maintain three copies.

---

## Accounts to keep recoverable (bus factor)

Make sure a trusted second person can access or recover:

- GitHub `jluftig/sampa-website`
- Vercel project (www.addictionpas.org)
- Supabase project `sampa-website` (+ DB password from project creation)
- Google Cloud project used for OAuth
- Domain **addictionpas.org** at Porkbun (DNS, email auth records)
- Stripe account (live + test mode awareness)
- Apple Developer (Individual today → org after D-U-N-S; see STATUS)
- Expo / EAS (`jluftig`)
- Brevo (auth SMTP `no-reply@` live; marketing campaigns via `info@` → Kelsey — see STATUS / PARK-brevo-email)

Losing these is the main non-code risk. Product/engineering truth is in git + STATUS.

---

## Day-to-day dashboards (no prose tutorial)

| Job | Where |
|-----|--------|
| Edit / publish news | Site → Member Login → Editor dashboard |
| Permissions / roster | `/editor/people`, `/editor/members` |
| Hosting / rollbacks | Vercel → Deployments |
| Database / auth / SQL | Supabase dashboard |
| Money | Stripe Dashboard (Test/Live toggle matters) |
| Marketing email (Brevo) | Brevo dashboard; ops notes [PARK-brevo-email.md](PARK-brevo-email.md) / [architecture/email-brevo.md](architecture/email-brevo.md) |
| What’s in flight | [STATUS.md](STATUS.md) |

If something looks broken: ask an agent with the repo open, or check STATUS + recent
Vercel deploys + Supabase auth logs. Historical long-form troubleshooting lived in
git history of this file before the 2026-07-21 diet.
