# Feature articles

One JSON file per article. The filename is the slug: `content/features/<slug>.json`.

The public route is `/news/features/<slug>`. A file is listed on `/news` and the route renders the article only on or after `publishedOn`, using the calendar day in America/Los_Angeles. Before that day the route is the site 404, crawler previews are HTTP 404, and `/news` does not link it.

`?asOf=YYYY-MM-DD` moves that clock for local `npm run dev` screenshots only. Production builds ignore it.

The founders title lives in one constant, `FOUNDERS_FEATURE_TITLE` in `src/lib/newsFeatures.js`. The article body is Kerith Hartmann's text, unchanged.

A daily issue can lead with the article by adding the optional `feature` object documented in `content/daily-news/README.md`.
