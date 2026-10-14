# Issue tracker: GitHub

Specs and tickets for this repo live as GitHub issues on `jluftig/sampa-website`. Use the `gh` CLI (or the GitHub connector the agent has).

`docs/STATUS.md` stays the only product board: a spec issue gets one STATUS Tasks row that links it.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open --json number,title,labels` with `--label` / `--state` filters.
- **Comment**: `gh issue comment <number> --body "..."`
- **Labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: issues close when the PR that fixes them merges (`Closes #n` in the PR body). Josh merges; agents do not close issues by hand.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
