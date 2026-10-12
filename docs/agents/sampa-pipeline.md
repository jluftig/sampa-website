# SAMPA ship rules for the workflow skills

These override any step in `implement`, `implement-spec`, `to-tickets`, or `pr` that would merge, mark ready, or close work on its own.

- **Claim first.** Executable work starts with a row in `docs/STATUS.md` → `## Tasks` (see AGENTS.md). Specs and tickets do not replace STATUS; link the issue numbers from the STATUS row.
- **Preview PR only.** One branch + PR against `main`, kept **draft** until checks exist. Never merge, never enable auto-merge, never squash-merge. "Merge" steps inside `implement-spec` mean merging ticket branches into *your own integration branch* only.
- **Website QA** reviews the Vercel preview and returns GREEN/RED. **Josh merges** after QA is green and he has seen screenshots.
- **Bugs:** reproduce first, add a regression test that fails before the fix, note in the PR how you saw it fail.
- **Before/after screenshots** in the PR body for any user-visible change (the `pr` skill's Evidence section).
- **Tests:** there is no single test suite. Use the `npm run test:*` scripts (`scripts/verify-*.mjs`) and `npm run build`; add a `verify-*` script for new behavior.
- **Migrations:** follow CLAUDE.md gotcha 10. The operator (Josh) runs SQL; say so in the PR.
- **Plain language** in anything Josh reads (grill rounds, PR summaries, ticket titles).
