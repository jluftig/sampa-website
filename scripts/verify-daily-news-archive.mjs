import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { GET as shareGet } from '../api/share.js';
import {
  annotateRoundups,
  applyTagDecision,
  archivePage,
  buildSuggestionQueue,
  dailyCanonicalUrl,
  dailyNewsTitle,
  dailySitemapPaths,
  dispatchSuggestedTagNotice,
  matchTags,
  monthIndex,
  resolveDailyDate,
  visibleArchive,
  withMonthHeadings,
} from '../src/lib/dailyNewsArchive.js';
import { collectRoundups } from '../src/lib/dailyNewsLoad.js';
import { DAILY_VOCABULARY } from '../src/lib/dailyNewsVocabulary.js';

function item(overrides = {}) {
  return {
    headline: 'Headline about something specific',
    outlet: 'Outlet',
    date: 'Sep 28',
    summary: 'Two sentences about the finding. A third with context.',
    url: 'https://example.com/story',
    ...overrides,
  };
}

function roundup(date, items) {
  return { date, title: 'Addiction Daily Roundup', items };
}

function loadSeedRoundups() {
  const modules = {};
  for (const name of readdirSync('content/daily-news')) {
    if (!name.endsWith('.json')) continue;
    modules[`/content/daily-news/${name}`] = JSON.parse(
      readFileSync(`content/daily-news/${name}`, 'utf8'),
    );
  }
  return collectRoundups(modules, () => {});
}

test('keyword rules tag buprenorphine, naloxone, and policy without a model call', () => {
  const tags = matchTags(item({
    headline: 'Medicaid patients get less buprenorphine after acute opioid encounters',
    summary: 'Only 14% filled buprenorphine and 3.8% filled naloxone within 30 days.',
    outlet: 'Journal of General Internal Medicine',
  }));
  assert.deepEqual(tags.map((tag) => tag.slug), ['buprenorphine', 'naloxone', 'policy']);
});

test('bup matches as its own word and bupe is not a vocabulary term', () => {
  const tags = matchTags(item({
    headline: 'Start bup in the emergency department',
    summary: 'A short bridge protocol.',
  }));
  assert.deepEqual(tags.map((tag) => tag.slug), ['buprenorphine']);
  const blob = JSON.stringify(DAILY_VOCABULARY).toLowerCase();
  assert.equal(blob.includes('bupe'), false);
});

test('an item with no vocabulary keyword produces a stubbed suggestion and no email send', () => {
  const annotated = annotateRoundups([
    roundup('2026-10-02', [item({
      headline: 'Medetomidine withdrawal is driving ICU-level care',
      summary: 'Hospital teams should plan for alpha-2 withdrawal protocols.',
      url: 'https://example.com/medetomidine',
    })]),
  ]);
  assert.deepEqual(annotated[0].items[0].tags, []);
  assert.equal(annotated[0].items[0].suggestion.slug, 'medetomidine');

  let senderCalled = false;
  const queue = buildSuggestionQueue(annotated);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].slug, 'medetomidine');
  assert.equal(queue[0].notice.sent, false);
  assert.equal(queue[0].notice.status, 'stubbed');
  assert.equal(queue[0].notice.to, 'Josh');
  assert.match(queue[0].notice.subject, /medetomidine/);

  const dispatched = dispatchSuggestedTagNotice(queue[0].notice, () => {
    senderCalled = true;
  });
  assert.equal(senderCalled, false);
  assert.equal(dispatched.sent, false);
});

test('approving a suggestion removes it from the queue and tags the item', () => {
  const records = [
    roundup('2026-09-29', [item({
      headline: 'NOHARM trial',
      summary: 'It cut in-hospital opioids and discharge prescriptions.',
      url: 'https://example.com/noharm',
    })]),
  ];
  const before = annotateRoundups(records);
  const queue = buildSuggestionQueue(before);
  assert.equal(queue[0].slug, 'opioid');

  const decisions = applyTagDecision(
    { approved: [], dismissed: [] },
    { type: 'approve', slug: queue[0].slug, label: queue[0].label },
  );
  const vocabulary = [
    ...DAILY_VOCABULARY,
    ...decisions.approved,
  ];
  const after = annotateRoundups(records, vocabulary);
  assert.deepEqual(after[0].items[0].tags.map((tag) => tag.slug), ['opioid']);
  assert.deepEqual(buildSuggestionQueue(after, decisions), []);
});

test('dismiss hides a suggestion without tagging the item', () => {
  const annotated = annotateRoundups([
    roundup('2026-09-29', [item({
      headline: 'One in nine older adult cannabis users meet criteria for cannabis use disorder',
      summary: 'Most cases are mild.',
      url: 'https://example.com/cannabis',
    })]),
  ]);
  const decisions = applyTagDecision(
    { approved: [], dismissed: [] },
    { type: 'dismiss', slug: 'cannabis', label: 'cannabis' },
  );
  assert.deepEqual(buildSuggestionQueue(annotated, decisions), []);
  assert.deepEqual(annotated[0].items[0].tags, []);
});

test('published roundups tag known items and queue the unmatched ones', () => {
  const annotated = annotateRoundups(loadSeedRoundups());
  const byHeadline = new Map(
    annotated.flatMap((roundup) => roundup.items.map((entry) => [entry.headline, entry])),
  );
  assert.deepEqual(
    byHeadline.get('Black and Hispanic Medicaid patients get less buprenorphine after acute opioid encounters')
      .tags.map((tag) => tag.slug),
    ['buprenorphine', 'naloxone', 'policy'],
  );
  assert.equal(
    byHeadline.get('Medetomidine withdrawal is driving ICU-level care').suggestion.slug,
    'medetomidine',
  );
  const queue = buildSuggestionQueue(annotated);
  assert.deepEqual(
    queue.map((entry) => entry.slug).sort(),
    ['cannabis', 'medetomidine', 'opioid'],
  );
  assert.equal(queue.find((entry) => entry.slug === 'opioid').items.length, 2);
  assert.ok(queue.every((entry) => entry.notice.sent === false));
});

test('date route resolves a real issue, the latest alias, and a 404 with no redirect', () => {
  const catalog = [
    roundup('2026-09-30', [item()]),
    roundup('2026-09-29', [item({ url: 'https://example.com/older' })]),
  ];
  assert.equal(resolveDailyDate(undefined, catalog).status, 'latest');
  assert.equal(resolveDailyDate(undefined, catalog).roundup.date, '2026-09-30');
  assert.equal(resolveDailyDate('2026-09-29', catalog).status, 'ok');
  const missing = resolveDailyDate('2026-10-02', catalog);
  assert.equal(missing.status, 'not-found');
  assert.equal(missing.roundup, null);
  assert.equal(missing.redirect, undefined);
  assert.equal(resolveDailyDate('2026-02-31', catalog).status, 'not-found');
  assert.equal(resolveDailyDate('archive', catalog).status, 'not-found');
  assert.equal(resolveDailyDate('not-a-date', catalog).status, 'not-found');
});

test('dated pages use a stable title and canonical URL', () => {
  assert.equal(dailyNewsTitle('2026-10-02'), 'Daily News – Oct 2, 2026 | SAMPA');
  assert.equal(
    dailyCanonicalUrl('2026-10-02'),
    'https://www.addictionpas.org/news/daily/2026-10-02',
  );
  assert.equal(
    dailyCanonicalUrl('2026-09-30', 'https://preview.example.test'),
    'https://preview.example.test/news/daily/2026-09-30',
  );
});

test('archive list is newest first, grouped by month headings, and pages onward', () => {
  const catalog = [
    roundup('2026-10-02', [item()]),
    roundup('2026-09-30', [item({ url: 'https://example.com/b' })]),
    roundup('2026-09-29', [item({ url: 'https://example.com/c' })]),
  ];
  assert.deepEqual(monthIndex(catalog), {
    '2026-10': ['2026-10-02'],
    '2026-09': ['2026-09-30', '2026-09-29'],
  });
  const first = visibleArchive(catalog, 1, 1);
  assert.deepEqual(first.items.map((entry) => entry.date), ['2026-10-02']);
  assert.equal(first.hasMore, true);
  const more = visibleArchive(catalog, first.nextShown, 1);
  assert.deepEqual(more.items.map((entry) => entry.date), ['2026-10-02', '2026-09-30']);
  const rows = withMonthHeadings(more.items);
  assert.deepEqual(
    rows.filter((row) => row.type === 'month').map((row) => row.label),
    ['October 2026', 'September 2026'],
  );
  const pageTwo = archivePage(catalog, 2, 1);
  assert.deepEqual(pageTwo.items.map((entry) => entry.date), ['2026-09-30']);
  assert.equal(pageTwo.hasMore, true);
  const paths = dailySitemapPaths(catalog);
  assert.ok(paths.includes('/news/daily/2026-10-02'));
  assert.equal(paths.includes('/news/daily/2026-10'), false);
  assert.equal(paths.includes('/news/daily/2026-09'), false);
});

test('sitemap lists dated roundup pages and not month bins', () => {
  const xml = readFileSync('public/sitemap.xml', 'utf8');
  assert.match(xml, /https:\/\/www\.addictionpas\.org\/news\/daily\/2026-09-30/);
  assert.match(xml, /https:\/\/www\.addictionpas\.org\/news\/daily\/2026-09-29/);
  assert.match(xml, /https:\/\/www\.addictionpas\.org\/news\/daily\/archive/);
  assert.doesNotMatch(xml, /\/news\/daily\/2026-09</);
  assert.doesNotMatch(xml, /\/news\/daily\/2026-10</);
});

test('router keeps archive and tag paths ahead of the dated page, and unknown dates render NotFound', () => {
  const app = readFileSync('src/App.jsx', 'utf8');
  const archiveAt = app.indexOf('path="/news/daily/archive"');
  const tagAt = app.indexOf('path="/news/daily/tag/:slug"');
  const dateAt = app.indexOf('path="/news/daily/:date"');
  assert.ok(archiveAt > -1 && tagAt > archiveAt && dateAt > tagAt);
  const roundup = readFileSync('src/pages/DailyRoundup.jsx', 'utf8');
  assert.match(roundup, /resolveDailyDate/);
  assert.match(roundup, /status === 'not-found'\) return <NotFound/);
  assert.doesNotMatch(roundup, /<Navigate/);
  const editorAt = app.indexOf('path="/editor/daily-tags"');
  const editorIdAt = app.indexOf('path="/editor/:id"');
  assert.ok(editorAt > -1 && editorAt < editorIdAt);
});

test('share serves a dated roundup and 404s an unknown date', async () => {
  const found = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=daily&date=2026-09-30'));
  assert.equal(found.status, 200);
  const html = await found.text();
  assert.match(html, /Daily News – Sep 30, 2026 \| SAMPA/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.addictionpas\.org\/news\/daily\/2026-09-30"/);

  const missing = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=daily&date=2026-10-02'));
  assert.equal(missing.status, 404);

  const bogus = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=daily&date=nope'));
  assert.equal(bogus.status, 404);
});
