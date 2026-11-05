# Feature articles

One JSON file per article. The filename is the slug: `content/features/<slug>.json`.

The public route is `/news/features/<slug>`. Vercel rewrites that path, for every user agent, to `api/share`. Before `publishedOn` (America/Los_Angeles calendar day) the response is HTTP 404. On that day, browsers receive the SPA shell and social crawlers receive the share card. `/news` lists the article on the same day.

The essay itself is not in the client bundle. The page fetches `/api/share?slug=feature&feature=<slug>&part=body` after the gate opens. That response is HTTP 404 before the publish day and the essay JSON after it. Card fields (title, teaser, byline, href) stay in `FEATURE_LISTINGS`.

The founders title lives in one constant, `FOUNDERS_FEATURE_TITLE` in `src/lib/newsFeatures.js`. The article body is Kerith Hartmann's text, unchanged.

A daily issue can lead with the article by adding the optional `feature` object documented in `content/daily-news/README.md`.
