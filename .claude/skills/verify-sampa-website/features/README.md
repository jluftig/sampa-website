# SAMPA website verification map

This directory is the maintained source for verifying the user-facing website. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Install with `npm ci` from the repo root on Node 22.
- The dev server for UI drives is `PORT=4173 npm run dev -- --host 127.0.0.1 --strictPort`.
- Ready when the log prints `Local:   http://127.0.0.1:4173/`.
- `.env.local` exists. If it did not, this run copied `.env.example` to `.env.local` before starting Vite and will delete that copy in cleanup.
- Doctor has passed for this process. The listener on port `4173` is the server this run started.
- Never drive a server this run did not start.

## Driving conventions

- Start every recipe from the signed-out baseline unless its preconditions say otherwise.
- Prefer the link text `Member Login` and `Board` over coordinates.
- Treat every command as literal.
- Node suites are `npm run test:board-nav` and `npm run test:member-login`.
- Do not sign in and do not submit a form.
- Keep proof files. Cleanup removes the server and a scaffolding `.env.local` only.

## Proof and skip reporting

- Capture the command or the click and the resulting state.
- Node proof is the exit code and the TAP `# fail` line.
- Page proof is the URL, the heading, the link href, and a screenshot under `artifacts/verify-sampa-website/`.
- Record the feature id and the entry point with every artifact.
- Report an unreachable path with the URL tried and the missing precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the SAMPA checks` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Public pages](./public-pages.md) covers the home page, sign-in page, about page, and news page.
- [Member Login](./member-login.md) covers where the header and footer send a signed-out visitor, and the node suite for the other account states.
- [Board and My SAMPA](./board-nav.md) covers the signed-out Board link and the node suite for the signed-in menu.
