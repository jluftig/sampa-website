# Daily roundup

Weekday addiction news on the site is a JSON file, not a Supabase post.

`content/daily-news/YYYY-MM-DD.json` holds that day's five items. `src/lib/dailyNews.js` loads the folder with `import.meta.glob` at build time, drops a file that fails the schema, and sorts newest first. `/news/daily` renders the latest file and links to its permanent URL. Its canonical URL, in the browser and in crawler previews, is that latest dated page. `/news/daily/YYYY-MM-DD` renders one day. A date with no file renders the site 404 and a `noindex` robots meta. The homepage Daily News section uses the same catalog.

`/news/daily/archive` is the reader list: newest first, month headings inside that one list, and a load-more control. There are no weekly or monthly archive pages. `monthIndex()` in `src/lib/dailyNewsArchive.js` is the back-end grouping used for queries and the sitemap, not a route. Crawler previews rewrite only real `YYYY-MM-DD` dates to `api/share`, plus `/news/daily/archive` to its own preview. `archive` and `/news/daily/tag/:slug` are not dates.

Each item is tagged with `src/lib/dailyNewsVocabulary.js` by keyword and synonym rules. Chips link to `/news/daily/tag/:slug`. An item that matches nothing becomes a suggested keyword on `/editor/daily-tags` (admins only). Approve and dismiss stay in that browser. The email notice on each card is stubbed and is not sent.

Publishing a new issue is still a content-only commit that adds the next file. Vercel redeploys. `npm run sitemap:daily` (also the production prebuild) rewrites `public/sitemap.xml` so the new dated URL is listed. No database write, no CMS, and no new secret. The schema lives in `content/daily-news/README.md`.

The daily email list is separate. `/news/daily` posts `list: "daily"` to the existing `api/newsletter-signup.js` function. That string maps to `BREVO_LIST_DAILY_NEWS`. Sending the email itself is a later ticket.

Feature articles at `/news` and `/news/:slug` are unchanged.

Preview only until Website QA is green and Josh approves a screenshot.
