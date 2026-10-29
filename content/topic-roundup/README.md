# Topic roundup files

The page title for an issue is its `title`. No. 1 is `SAMPA Emerging Practice Monthly No. 1 (October 2026)`. Describe the list as a monthly look at an emerging addiction practice. The issue is not tied to a weekday.

Filename: `YYYY-MM-DD.json`.

- `date`: the same ISO date as the filename
- `title`: non-empty heading, for example `SAMPA Emerging Practice Monthly No. 1 (October 2026)`
- `items`: five objects, in authored order, each with trimmed `headline`, `outlet`, `date`, `summary`, and an https `url`
- `furtherReading`: array of objects with trimmed `author`, `title`, `doi`, an https `url`, and `year` (a number or a 4-digit string)
- `consideredSkipped`: array of non-empty strings (an empty array is valid)
- `notes`: array of non-empty strings (an empty array is valid)
- `draft`: optional `true` or `false`. Absent means not draft

When `draft` is true, the page banner is `Draft - pending clinical review`.

This folder is not read by the daily news glob, the sitemap writer, or `api/share.js`.
