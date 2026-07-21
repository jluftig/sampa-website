# SAMPA Website

Website and member platform for **SAMPA — the Society of Addiction Medicine
Physician Associates**: [www.addictionpas.org](https://www.addictionpas.org)

A single-page React app with a News/blog + research-grade "Key Points" database,
a member area with Stripe membership payments, a member networking directory,
public donations, and an Expo mobile app on the same backend.

**Stack:** Vite + React 18 + Tailwind · Supabase (Postgres/Auth/Storage) ·
Stripe via Vercel serverless functions (`api/`) · hosted on Vercel
(`main` → production, every branch → preview URL).

## Read this first

| If you are… | Read |
| --- | --- |
| Checking what's live / blocked / next | **[docs/STATUS.md](docs/STATUS.md)** |
| An AI agent working on the code | **[CLAUDE.md](CLAUDE.md)** (via [AGENTS.md](AGENTS.md)) → [docs/architecture/](docs/architecture/) as needed |
| A human taking over cold | [docs/HANDOFF.md](docs/HANDOFF.md) (thin — or ask an agent to walk STATUS + CLAUDE) |
| One-time Stripe/auth configuration | [docs/member-area-setup.md](docs/member-area-setup.md) |
| Mobile setup | [docs/mobile-app-setup.md](docs/mobile-app-setup.md) |

**After code deploys that add SQL:** run the matching file under
`supabase/migrations/` in the Supabase SQL Editor (shared DB for prod + preview).
See STATUS for the current migration checklist.

## Local development

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Requires a `.env.local` (gitignored) with `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` — without them the app renders a blank page.
The `api/` functions don't run under `npm run dev`; test those on a Vercel
preview deployment.

`npm run build` makes a production build; `npm run preview` serves it.
There is no test suite or linter.

## House rules

- User-facing copy always says **"physician associates"**, never "physician
  assistants".
- Database changes go through `supabase/schema.sql` (the source of truth) — see
  CLAUDE.md before touching anything security-related (RLS is the real
  authorization boundary).
