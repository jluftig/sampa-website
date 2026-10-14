// Regression for the 2026-10-05 report: after the daily roundup launched, the
// Aug/Sep daily news posts were not reachable from the News tab path. /news is
// now one feed (earlier posts + roundups, newest first) behind one nav item.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import {
  buildNewsFeed,
  countByMonth,
  feedWithMonthHeadings,
  postDayKey,
} from '../src/lib/newsFeed.js';
import { collectRoundups } from '../src/lib/dailyNewsLoad.js';

const read = (path) => readFileSync(path, 'utf8');

function post(slug, publishedAt) {
  return { id: slug, slug, title: slug, published_at: publishedAt };
}

function roundup(date) {
  return {
    date,
    title: 'Addiction Daily Roundup',
    items: [{ headline: `Item for ${date}`, outlet: 'Outlet', date: 'Oct 1', summary: 'S.', url: 'https://example.com' }],
  };
}

function seedRoundups() {
  const modules = {};
  for (const name of readdirSync('content/daily-news')) {
    if (!name.endsWith('.json')) continue;
    modules[`/content/daily-news/${name}`] = JSON.parse(read(`content/daily-news/${name}`));
  }
  return collectRoundups(modules, () => {});
}

test('feed keeps every earlier post and every roundup, newest first', () => {
  const posts = [
    post('sept-24-post', '2026-09-24T16:00:00Z'),
    post('sept-6-post', '2026-09-06T16:00:00Z'),
    post('aug-30-post', '2026-08-30T16:00:00Z'),
    post('aug-2-post', '2026-08-02T16:00:00Z'),
  ];
  const roundups = [roundup('2026-10-05'), roundup('2026-10-02'), roundup('2026-10-01'), roundup('2026-09-29')];
  const feed = buildNewsFeed(posts, roundups);
  assert.deepEqual(
    feed.map((e) => (e.kind === 'post' ? e.post.slug : e.roundup.date)),
    ['2026-10-05', '2026-10-02', '2026-10-01', '2026-09-29', 'sept-24-post', 'sept-6-post', 'aug-30-post', 'aug-2-post'],
  );
  assert.deepEqual(countByMonth(feed), { '2026-10': 3, '2026-09': 3, '2026-08': 2 });
});

test('post days use Pacific time, so a late-evening PT post stays on its day', () => {
  assert.equal(postDayKey('2026-09-25T04:30:00Z'), '2026-09-24');
  assert.equal(postDayKey(null), '');
});

test('month headings run continuously from roundups into earlier posts', () => {
  const feed = buildNewsFeed(
    [post('sep-post', '2026-09-20T16:00:00Z'), post('aug-post', '2026-08-20T16:00:00Z')],
    [roundup('2026-10-01'), roundup('2026-09-30')],
  );
  const labels = feedWithMonthHeadings(feed).filter((r) => r.type === 'month').map((r) => r.label);
  assert.deepEqual(labels, ['October 2026', 'September 2026', 'August 2026']);
});

test('every published roundup file shows in the feed', () => {
  const seeds = seedRoundups();
  assert.ok(seeds.length >= 1);
  const feed = buildNewsFeed([], seeds);
  assert.equal(feed.length, seeds.length);
});

test('/news renders the combined feed with the daily signup form', () => {
  const src = read('src/pages/News.jsx');
  assert.match(src, /buildNewsFeed\(posts, roundups\)/);
  assert.match(src, /useDailyRoundups\(\)/);
  assert.match(src, /<PostCard /);
  assert.match(src, /<RoundupCard /);
  assert.match(src, /<NewsletterSignup variant="card" list="daily" \/>/);
  // Earlier posts still link to their existing /news/:slug pages.
  assert.match(read('src/components/PostCard.jsx'), /to=\{`\/news\/\$\{post\.slug\}`\}/);
  assert.match(read('src/components/RoundupCard.jsx'), /to=\{`\/news\/daily\/\$\{roundup\.date\}`\}/);
});

test('nav has a single News item per menu and no separate Daily Roundup entry', () => {
  const nav = read('src/components/Navbar.jsx');
  assert.equal((nav.match(/to="\/news"/g) || []).length, 2, 'one News link for desktop, one for mobile');
  assert.doesNotMatch(nav, /\/news\/daily/);
  assert.doesNotMatch(nav, /Daily Roundup/);
  for (const block of nav.match(/<Link to="\/news"[\s\S]*?<\/Link>/g)) {
    const inner = block.slice(0, -'</Link>'.length);
    assert.equal(inner.slice(inner.lastIndexOf('>') + 1).trim(), 'News', 'label is just "News"');
    assert.doesNotMatch(inner, /<span/, 'no badge inside the News link');
  }
});

test('/news/daily still works and the old archive path lands on /news', () => {
  const app = read('src/App.jsx');
  assert.match(app, /path="\/news\/daily" element=\{<DailyRoundup \/>\}/);
  assert.match(app, /path="\/news\/daily\/:date" element=\{<DailyRoundup \/>\}/);
  assert.match(app, /path="\/news\/daily\/archive" element=\{<Navigate to="\/news" replace \/>\}/);
  assert.match(app, /path="\/news\/:slug" element=\{<PostView \/>\}/);
  assert.doesNotMatch(read('src/pages/DailyRoundup.jsx'), /\/news\/daily\/archive/);
});
