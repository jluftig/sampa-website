# Daily roundup files

One JSON file per day. The site loads every `YYYY-MM-DD.json` in this folder at build time.

```json
{
  "date": "2026-09-29",
  "title": "Addiction Daily Roundup",
  "items": [
    {
      "headline": "...",
      "outlet": "...",
      "date": "Sep 28",
      "summary": "2 to 3 plain sentences.",
      "url": "https://..."
    }
  ]
}
```

Rules:

- `date` matches the filename (`YYYY-MM-DD.json`).
- `items` holds 1 to 7 objects. Each object has `headline`, `outlet`, `date`, `summary`, and an `https://` `url`.
- A file that fails those checks is skipped. The build still succeeds.
- Commits that only add or replace a file in this folder stay content-only. No application code in those commits.
- Keywords are not stored in the file. The site tags each item from a fixed vocabulary when it renders.
