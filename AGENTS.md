# Instructions for AI agents

**Read [CLAUDE.md](CLAUDE.md) before changing anything.** It is the canonical
machine-oriented entry point — invariants, gotchas, and pointers into
`docs/architecture/`. This file exists so non-Claude agents find the same path;
do not duplicate architecture here.

## Single board — do not invent a second roadmap

| Doc | Role | Update when… |
|-----|------|----------------|
| **[docs/STATUS.md](docs/STATUS.md)** | **Only product board** | State changes |
| **[CLAUDE.md](CLAUDE.md)** + **[docs/architecture/](docs/architecture/)** | How the system works / must not break | Code or security model changes |
| **[docs/HANDOFF.md](docs/HANDOFF.md)** | Thin human front door + bus-factor accounts | Account list or “start here” path changes — **not** a second manual |
| **docs/PARK-\*.md** | Mid-flight stickies | Track still active; delete when shipped |
| Setup / news prompts | One-time ops or production recipes | That subsystem’s procedure changes |
| **docs/archive/** | Historical only | Almost never |

**Write path:** STATUS first → CLAUDE/architecture if design/security changed → slim PARK if mid-flight → HANDOFF only for bus-factor/front-door edits.

**Don’t** copy STATUS backlog into HANDOFF or PARK.  
**Do** load the relevant `docs/architecture/*.md` file when editing that area (don’t require the whole monologue in context).

**DB migrations:** after writing/updating `supabase/migrations/`, `pbcopy < path` and tell the user it’s ready for the Supabase SQL Editor — gotcha 10 in `CLAUDE.md`.

## Cursor Cloud specific instructions

Dependencies (web root + `mobile/`) are installed by the startup update script (`npm install` in both). Node 22 is available; the project pins no version but Supabase deps expect Node 20+.

- **Two npm packages, one repo:** the web app (repo root) and the Expo app (`mobile/`) each have their own `package.json`/lockfile and must be installed separately. `mobile/` consumes the web app's `src/lib` via the `sampa-shared` `file:../src/lib` dependency, materialized as a symlink at `mobile/node_modules/sampa-shared` — never delete `src/lib/package.json`.
- **Env files are required and gitignored.** Both apps read Supabase creds from a local `.env.local` that is NOT committed. If missing, the web app throws "Missing Supabase environment variables" and renders a blank page. The values are the publishable (`sb_publishable_…`) anon key + project URL, which are browser-safe (RLS is the real boundary) and are literally shipped in the production bundle at `https://www.addictionpas.org`. Recreate them if absent:
  - `/.env.local`: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  - `/mobile/.env.local`: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same two values)
  - The URL is `https://xbzzawjnphpnexwfjtif.supabase.co`; if the publishable key ever rotates, re-derive it by grepping `sb_publishable_` out of the production JS bundle linked from `https://www.addictionpas.org`.
- **Dev connects to the SHARED PRODUCTION Supabase.** There is no local DB/container — local dev reads and writes the real prod+preview database. Prefer read-only browsing for smoke tests; do NOT casually create accounts, submit checkout/donation forms, or write test rows.
- **Run commands** (already in READMEs/`CLAUDE.md`): web `npm run dev` (Vite on 5173; honors `PORT`, and `.claude/launch.json` uses 5174 `--strictPort`); `npm run build` / `npm run preview`. Mobile: `npm run start` (Expo/Metro 8081), `npm test` (vitest), `npm run typecheck` (tsc), `npm run lint` (expo lint).
- **The web app has no test suite or linter.** Only `mobile/` has tests/typecheck/lint. As of this setup, `mobile` `npm test` (11 passing) and `npm run typecheck` are green, but `npm run lint` reports pre-existing errors (mostly `react-hooks/set-state-in-effect` in `AuthContext.tsx`/`favorites.tsx`) unrelated to environment setup — a lint failure there is not caused by your changes.
- **The `api/` serverless functions do NOT run under `npm run dev`/Vite.** Exercise Stripe checkout/portal/webhook, donations, account-deletion, push, and OG-share only on a Vercel preview or `vercel dev` (needs server-only secrets: `STRIPE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `PUSH_WEBHOOK_SECRET` — never `VITE_`/`EXPO_PUBLIC_`).
