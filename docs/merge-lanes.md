# Merge lanes

The `merge-lane` job reads a pull request file list and writes one lane. Josh merges.

## Lanes

`tier-0` is one of these file sets.

- `content/daily-news/YYYY-MM-DD.json` alone, or that file plus `public/sitemap.xml`. The date is a real calendar date. It equals the `YYYY-MM-DD` in a head branch named `daily-news/YYYY-MM-DD` or `daily-news/YYYY-MM-DD-fix`, or it equals today in America/Los_Angeles. One daily JSON file.
- `docs/STATUS.md` and no other file.

`needs-josh` is every other file list. The job passes and writes that lane.

The job fails when the head branch starts with `daily-news/` and the files are not the daily set above. Extra files, more than one daily JSON file, and a date that matches neither the branch date nor today in America/Los_Angeles fail the job.

## How to read the lane

The workflow file is `.github/workflows/merge-lane.yml`. The job name is `merge-lane`.

The job summary starts with `lane: tier-0` or `lane: needs-josh`, then lists each changed file.

The job posts a commit status on the pull request head SHA. The context is `merge-lane`. The description starts with `tier-0` or `needs-josh`. A failed daily branch posts a description that starts with `fail`, and the job exits non-zero.

Read the status.

```
GET /repos/jluftig/sampa-website/commits/<sha>/status
```

Use the status whose `context` is `merge-lane`. The first word of `description` is the lane.

Read the check run.

```
GET /repos/jluftig/sampa-website/commits/<sha>/check-runs?check_name=merge-lane
```

`output.title` starts with the same word. `conclusion` is `success` for `tier-0` and for `needs-josh`. `conclusion` is `failure` when a `daily-news/` branch misses the daily set.

`GITHUB_TOKEN` needs `statuses: write` and `checks: write`. A pull request from this repository grants both. A fork pull request does not, and the status post fails the job.

The classifier in the job is `scripts/merge-lane.mjs` from the pull request head. A pull request that edits that script or this workflow is `needs-josh` when the branch does not start with `daily-news/`.

## Branch protection for main

An admin sets these on `main`. This repository change does not apply them.

Require these checks. The names are the GitHub Actions check-run `name` values on pull request 198, head `d24e495e3a4c500a0609bc74ba664edddf323203`, plus `merge-lane`.

- `content-terms`
- `donor-badge`
- `join-flow`
- `membership-conversion`
- `nav`
- `news`
- `offline`
- `policy-work`
- `subscriptions`
- `merge-lane`

Leave `Cursor Bugbot` off the required list.

Block force pushes.

Allow admin bypass.

These also ran on that pull request. They stay off this required list.

- `Cursor Bugbot`
- `Vercel Preview Comments`
- `Vercel – sampa-website`
- `Vercel – sampa-website-deploy`

The two Vercel names are commit-status contexts on merge commit `4ef47d9881193d3916d4562a2b154abffecbd8cb`. `Vercel Preview Comments` is a check run on the pull request head.
