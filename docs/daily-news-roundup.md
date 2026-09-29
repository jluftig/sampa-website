# Daily roundup

Weekday addiction news on the site is a JSON file, not a Supabase post.

`content/daily-news/YYYY-MM-DD.json` holds that day's five items. `src/lib/dailyNews.js` loads the folder with `import.meta.glob` at build time, drops a file that fails the schema, and sorts newest first. `/news/daily` renders the latest file. `/news/daily/:date` renders one day. The homepage Daily News section uses the same catalog.

Publishing is a content-only commit that adds the next file to `main`. Vercel redeploys. No database write, no CMS, and no new secret. Application code does not belong in that commit. The schema lives in `content/daily-news/README.md`.

The daily email list is separate. `/news/daily` posts `list: "daily"` to the existing `api/newsletter-signup.js` function. That string maps to `BREVO_LIST_DAILY_NEWS`. Sending the email itself is a later ticket.

Preview only until Website QA is green and Josh approves a screenshot.
