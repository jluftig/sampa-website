---
name: verify-sampa-website
description: "Drive the SAMPA website (Vite + React) and prove public pages, Member Login, and Board nav. Use when a change touches the marketing site, header, login routing, or My SAMPA, or when /create-verification-skill output needs a rerun."
disable-model-invocation: true
---

# Verify the SAMPA website

Primary surface is the public website in this repo. The Expo app under `mobile/` is a separate surface. `api/` does not run under Vite.

Read `features/README.md` before driving. One feature file is the recipe. A proof that only hits one entry point is incomplete when the map lists others.

## Launch

From the repo root, with Node 22 (the My SAMPA workflow uses Node 22):

```bash
npm ci
npm run test:board-nav
npm run test:member-login
npm run build
```

`npm run build` runs `prebuild`, which rewrites `public/sitemap.xml`. If that file is the only build dirt and the task is not the sitemap, restore it with `git checkout -- public/sitemap.xml`.

The dev server reads env at startup. If `.env.local` is missing, copy `.env.example` to `.env.local` and remember that this run created it. Do not overwrite an existing `.env.local`. Do not commit either file.

Start one server on a free port. `4173` is the verification port when `5173` might already be in use.

```bash
PORT=4173 npm run dev -- --host 127.0.0.1 --strictPort
```

Ready when the log prints `Local:   http://127.0.0.1:4173/`. Record the shell and the `node` pid listening on that port. Teardown is in Cleanup.

Two servers can run if each has its own `PORT`. They share one Supabase project when `.env.local` holds real keys, so stay read-only. Do not sign in, do not submit a newsletter form, and do not start a second server against a session someone else is using.

The node test scripts do not bind a port. They can run next to the dev server.

## Doctor

Run this before the first drive, and again after a drive that did something unexpected.

1. `curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:4173/` prints `200`.
2. The HTML `<title>` text matches the `<title>` in `index.html`.
3. The process listening on `4173` is the `node` pid this run started. If it is not, stop and do not drive that process.
4. Open `/` in a browser. The run is worth a UI drive when the page shows a link named `Member Login` with `href="/login"` and a link named `Board` with `href="/board"`. It is not worth a UI drive when the page is the Vite overlay `Missing Supabase environment variables. Copy .env.example to .env.local and fill in your values.` The node suites can still run in that case. Create the scaffolding env file from Launch, restart Vite, and run Doctor again.

## Drive

Prefer the repo's node suites for routing and nav. Use the browser for pages.

```bash
npm run test:board-nav
npm run test:member-login
```

`npm run test:my-sampa` runs both. That is what `.github/workflows/my-sampa.yml` runs. Pass means the TAP summary has `# fail 0` and the process exit code is 0. A `MODULE_TYPELESS_PACKAGE_JSON` warning on stdout is not a failure.

Browser routes, after Doctor passes:

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/login`
- `http://127.0.0.1:4173/about`
- `http://127.0.0.1:4173/news`

Use the feature file for the pass you are proving. Do not click `Continue with Google`, `Send link`, `Subscribe`, or `Submit`.

## Evidence

Save proof under `artifacts/verify-sampa-website/` at the repo root. That directory is gitignored. Cleanup must leave it in place.

For a node suite, save the command, the exit code, and the TAP lines that start with `# tests` and `# fail`.

For a page, save the URL, the visible heading, the `Member Login` and `Board` hrefs, and a screenshot. Capture the action and the resulting state. A screenshot of only the final screen is not enough when the claim is about a link target.

The node suites render the real header and login helpers. They are not a test-only endpoint. The browser path loads the Vite app a visitor loads. Placeholder values from `.env.example` get past the import check and render public chrome plus the dated roundups bundled in the repo. They do not prove live Supabase reads or writes. When `.env.local` has real keys, still do not mutate data.

## Cleanup

Stop the Vite process this run started. Send Ctrl-C to that shell, or kill the recorded pid. Do not kill a process by name.

If this run created `.env.local` by copying `.env.example`, delete that file. Leave a pre-existing `.env.local` alone.

If this run started a browser for screenshots, stop that browser pid. Use a throwaway `--user-data-dir` so you do not share a profile with another browser.

Do not delete `artifacts/verify-sampa-website/`.

## Helpers

This skill does not ship a helper script. The commands above are the interface.
