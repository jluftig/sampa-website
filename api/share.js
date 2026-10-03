// GET /api/share?slug=<post slug> — server-rendered Open Graph / Twitter meta
// for social crawlers. Link previews (iMessage, Facebook, LinkedIn, Slack, …)
// don't run JavaScript, so the SPA would give every article the same generic
// preview; vercel.json rewrites /news/:slug here for crawler user-agents only,
// humans keep getting the SPA. Public data only: the query uses the
// publishable anon key and filters status=published explicitly.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dailyNewsTitle } from '../src/lib/dailyNewsArchive.js';
import { roundupFromEntry } from '../src/lib/dailyNewsLoad.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

function publishedRoundup(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  let raw;
  try {
    raw = readFileSync(join(process.cwd(), 'content', 'daily-news', `${date}.json`), 'utf8');
  } catch {
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = roundupFromEntry(`/content/daily-news/${date}.json`, data);
  return result.ok ? result.roundup : null;
}

export async function GET(request) {
  const reqUrl = new URL(request.url);
  const slug = reqUrl.searchParams.get('slug') || '';
  const date = reqUrl.searchParams.get('date') || '';
  const isDaily = slug === 'daily';
  const dated = isDaily && date ? publishedRoundup(date) : null;
  if (isDaily && date && !dated) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  const canonical = dated
    ? `${reqUrl.origin}/news/daily/${dated.date}`
    : isDaily
      ? `${reqUrl.origin}/news/daily`
      : `${reqUrl.origin}/news/${encodeURIComponent(slug)}`;

  const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  let post = null;
  if (slug && !isDaily && supaUrl && anonKey) {
    try {
      const res = await fetch(
        `${supaUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published` +
          `&select=title,excerpt,cover_image_url,published_at,author_name,source_name`,
        { headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` } }
      );
      if (res.ok) post = (await res.json())[0] || null;
    } catch {
      /* fall through to generic meta */
    }
  }

  const title = dated
    ? dailyNewsTitle(dated.date)
    : isDaily
      ? 'SAMPA Daily Roundup'
      : post
        ? post.title
        : 'SAMPA News';
  const description = isDaily
    ? 'Five short addiction-medicine items, published each weekday by SAMPA.'
    : post?.excerpt ||
      'Addiction medicine news for PAs — Society of Addiction Medicine Physician Associates.';
  const image = post?.cover_image_url || '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="canonical" href="${esc(canonical)}">
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="SAMPA — Society of Addiction Medicine Physician Associates">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
${post?.published_at ? `<meta property="article:published_time" content="${esc(post.published_at)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
</head>
<body>
<p><a href="${esc(canonical)}">${esc(title)}</a></p>
</body>
</html>`;

  return new Response(html, {
    status: post || dated || (isDaily && !date) ? 200 : 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cache at the edge; a re-published post refreshes within 5 minutes.
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
