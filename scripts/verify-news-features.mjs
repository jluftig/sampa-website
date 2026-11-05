import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/lib/authState.js';
import { collectRoundups } from '../src/lib/dailyNewsLoad.js';
import { buildNewsFeed } from '../src/lib/newsFeed.js';
import {
  FEATURE_LISTINGS,
  FOUNDERS_FEATURE_TITLE,
  collectFeatures,
  devAsOfDay,
  devPreviewFeature,
  featureBodyUrl,
  featureSharePreview,
  featureSitemapPaths,
  isFeatureVisible,
  pacificCalendarDay,
  previewLeadFromFeature,
  visibleFeatures,
} from '../src/lib/newsFeatures.js';
import { GET as shareGet } from '../api/share.js';
import FeaturedLead from '../src/components/FeaturedLead.jsx';
import { DailyRoundupPage } from '../src/pages/DailyRoundupPage.jsx';
import { FeatureArticlePage } from '../src/pages/FeatureArticlePage.jsx';

const seedPath = '/content/features/founders-jim-anderson-shani-wilson.json';
const seed = JSON.parse(readFileSync(new URL(`..${seedPath}`, import.meta.url), 'utf8'));
const modules = { [seedPath]: seed };
const beforePublish = new Date('2026-11-10T07:59:59.000Z');
const onPublish = new Date('2026-11-10T08:00:00.000Z');
const BYLINE = 'Kerith Hartmann, PA-C, Advocacy, Success, and Impact Officer, SAMPA';
const ESSAY_SENTENCE = 'I checked in with both of them to learn what brought them to this work';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CURL = 'curl/8.7.1';
const FACEBOOK = 'facebookexternalhit/1.1';
const FEATURE_URL = 'https://www.addictionpas.org/news/features/founders-jim-anderson-shani-wilson';

function featureRequest(ua, when, part) {
  const url = new URL('https://www.addictionpas.org/api/share');
  url.searchParams.set('slug', 'feature');
  url.searchParams.set('feature', 'founders-jim-anderson-shani-wilson');
  if (part) url.searchParams.set('part', part);
  return shareGet(new Request(url, { headers: { 'user-agent': ua } }), when);
}

function render(node) {
  const auth = {
    loading: false,
    user: null,
    profile: null,
    signOut() {},
  };
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    null,
    createElement(AuthContext.Provider, { value: auth }, node),
  ));
}

function article(now, asOfDay = null) {
  return render(createElement(FeatureArticlePage, {
    slug: 'founders-jim-anderson-shani-wilson',
    modules,
    now,
    asOfDay,
  }));
}

function roundup(feature) {
  return {
    date: '2026-11-05',
    title: 'Addiction Daily Roundup',
    items: [{
      headline: 'A weekday study',
      outlet: 'JAMA',
      date: 'Nov 4',
      summary: 'Short summary.',
      url: 'https://example.com/study',
    }],
    feature,
  };
}

test('publish gate uses the America/Los_Angeles calendar day', () => {
  assert.equal(pacificCalendarDay(beforePublish), '2026-11-09');
  assert.equal(pacificCalendarDay(onPublish), '2026-11-10');
  const [feature] = collectFeatures(modules, () => {});
  assert.equal(isFeatureVisible(feature, beforePublish), false);
  assert.equal(isFeatureVisible(feature, onPublish), true);
  assert.equal(isFeatureVisible(feature, new Date('2026-11-11T20:00:00.000Z')), true);
  assert.deepEqual(visibleFeatures([feature], beforePublish), []);
  assert.equal(visibleFeatures([feature], onPublish).length, 1);
  assert.deepEqual(featureSitemapPaths([feature], beforePublish), []);
  assert.deepEqual(featureSitemapPaths([feature], onPublish), [
    '/news/features/founders-jim-anderson-shani-wilson',
  ]);
});

test('production ignores ?asOf= and dev can force the publish day', () => {
  assert.equal(devAsOfDay('?asOf=2026-11-10', false), null);
  assert.equal(devAsOfDay('?asOf=2026-11-10', true), '2026-11-10');
  assert.equal(devAsOfDay('?asOf=not-a-date', true), null);
  const [feature] = collectFeatures(modules, () => {});
  assert.equal(isFeatureVisible(feature, beforePublish, devAsOfDay('?asOf=2026-11-10', false)), false);
  assert.equal(isFeatureVisible(feature, beforePublish, devAsOfDay('?asOf=2026-11-10', true)), true);
  assert.equal(devPreviewFeature('?previewFeature=1', false, { title: 'x' }), null);
  assert.equal(devPreviewFeature('', true, previewLeadFromFeature(feature)), null);
  const preview = devPreviewFeature('?previewFeature=1', true, previewLeadFromFeature(feature));
  assert.equal(preview.href, '/news/features/founders-jim-anderson-shani-wilson?asOf=2026-11-10');
});

test('founders article keeps Kerith Hartmann\'s text, title, and byline', () => {
  const warnings = [];
  const [feature] = collectFeatures(modules, (message) => warnings.push(message));
  assert.deepEqual(warnings, []);
  assert.equal(feature.title, FOUNDERS_FEATURE_TITLE);
  assert.equal(FOUNDERS_FEATURE_TITLE, 'Founders Feature: Jim Anderson and Shani Wilson');
  assert.equal(feature.title.includes('\u2014'), false);
  assert.equal(feature.byline, BYLINE);
  assert.equal(FEATURE_LISTINGS[0].title, feature.title);
  assert.equal(FEATURE_LISTINGS[0].description, feature.description);
  assert.equal(FEATURE_LISTINGS[0].byline, feature.byline);
  assert.equal(FEATURE_LISTINGS[0].publishedOn, feature.publishedOn);
  assert.equal(readFileSync(new URL('../src/pages/News.jsx', import.meta.url), 'utf8').includes('newsFeatureCatalog'), false);
  assert.equal(readFileSync(new URL('../src/pages/DailyRoundup.jsx', import.meta.url), 'utf8').includes('newsFeatureCatalog'), false);
  assert.equal(feature.publishedOn, '2026-11-10');
  assert.equal(feature.path, '/news/features/founders-jim-anderson-shani-wilson');
  assert.equal(feature.paragraphs.length, 14);
  assert.equal(
    feature.description,
    'When Jim Anderson started in SAMPA, formerly (and fondly) called SPAAM, it was little more than a spark of an idea.',
  );
  assert.equal(feature.paragraphs[0].startsWith(feature.description), true);
  assert.match(feature.paragraphs[3], /medication\.\u201d  After he died/);
  assert.match(feature.paragraphs[5], /practice \u2013 the loss/);
  assert.match(feature.paragraphs[5], /\(Mattick et al\., 2009\)/);
  assert.match(feature.paragraphs[6], /\(Ali et al\., 2017\)/);
  assert.match(feature.paragraphs[6], /\(Human Rights Watch, 2009\)/);
  assert.match(feature.paragraphs[9], /\(McLellan et al\., 2000\)/);
  assert.match(feature.paragraphs[12], /field\.  \u201cThere has been great change/);
  assert.deepEqual(feature.signature, [
    'Kerith Hartmann, PA-C',
    'Advocacy, Success, and Impact Officer',
    'Society of Addiction Medicine PAs (SAMPA)',
  ]);
  assert.deepEqual(feature.references.map((reference) => reference.url), [
    'https://doi.org/10.1007/s11414-016-9538-3',
    'https://www.hrw.org/node/235658',
    'https://doi.org/10.1002/14651858.CD002209.pub2',
    'https://doi.org/10.1001/jama.284.13.1689',
  ]);
  assert.match(feature.references[3].text, /O\u2019Brien/);
  assert.equal(JSON.stringify(feature).includes('\u2014'), false);
});

test('the article route is a 404 before Nov 10 and the essay after', () => {
  const hidden = article(beforePublish);
  assert.match(hidden, /Page not found/);
  assert.equal(hidden.includes(FOUNDERS_FEATURE_TITLE), false);
  assert.equal(hidden.includes('Mattick et al'), false);

  const shown = article(onPublish);
  assert.match(shown, new RegExp(FOUNDERS_FEATURE_TITLE));
  assert.match(shown, /Kerith Hartmann, PA-C, Advocacy, Success, and Impact Officer, SAMPA/);
  assert.match(shown, /Tuesday, November 10, 2026/);
  assert.match(shown, /Mattick et al\., 2009/);
  assert.match(shown, /data-testid="feature-references"/);
  const references = shown.slice(shown.indexOf('data-testid="feature-references"'));
  assert.equal(references.includes('<ol'), false);
  assert.equal(references.includes('<ul'), false);
  assert.match(references, /indent-0/);
  assert.match(references, /href="https:\/\/doi.org\/10.1001\/jama.284.13.1689"/);
  assert.match(references, /href="https:\/\/www.hrw.org\/node\/235658"/);
  assert.match(shown, /medication\.\u201d  After he died/);

  const forced = article(beforePublish, '2026-11-10');
  assert.match(forced, new RegExp(FOUNDERS_FEATURE_TITLE));
});

test('a daily issue renders the feature card above the stories', () => {
  const feature = {
    title: FOUNDERS_FEATURE_TITLE,
    teaser: seed.description,
    href: '/news/features/founders-jim-anderson-shani-wilson',
    byline: BYLINE,
  };
  const issue = roundup(feature);
  const html = render(createElement(DailyRoundupPage, {
    date: '2026-11-05',
    resolution: { status: 'dated', roundup: issue },
    catalog: [issue],
  }));
  const cardAt = html.indexOf('data-testid="featured-lead"');
  const listAt = html.indexOf('<ol');
  assert.ok(cardAt > -1 && listAt > cardAt);
  assert.match(html, new RegExp(FOUNDERS_FEATURE_TITLE));
  assert.match(html, /href="\/news\/features\/founders-jim-anderson-shani-wilson"/);
  assert.match(html, new RegExp(BYLINE));
  assert.match(html, /Read the feature/);
  assert.match(html, /A weekday study/);

  const plain = roundup(null);
  const without = render(createElement(DailyRoundupPage, {
    date: '2026-11-05',
    resolution: { status: 'dated', roundup: plain },
    catalog: [plain],
  }));
  assert.equal(without.includes('data-testid="featured-lead"'), false);
  assert.match(without, /A weekday study/);

  const card = render(createElement(FeaturedLead, { feature }));
  assert.match(card, /data-testid="featured-lead"/);
  assert.match(card, /Read the feature/);
});

test('a broken feature is dropped and the daily items still load', () => {
  const warnings = [];
  const roundups = collectRoundups({
    '/content/daily-news/2026-11-10.json': {
      date: '2026-11-10',
      title: 'Addiction Daily Roundup',
      feature: { title: 'Missing the rest' },
      items: [{
        headline: 'Kept',
        outlet: 'JAMA',
        date: 'Nov 10',
        summary: 'Still here.',
        url: 'https://example.com/kept',
      }],
    },
  }, (message) => warnings.push(message));
  assert.equal(roundups.length, 1);
  assert.equal(roundups[0].feature, null);
  assert.equal(roundups[0].items[0].headline, 'Kept');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /feature needs title, teaser, href, and byline/);
});

test('a published feature leads the news index on its day', () => {
  const [feature] = collectFeatures(modules, () => {});
  const feed = buildNewsFeed(
    [{ id: 'post', slug: 'same-day-post', title: 'Post', published_at: '2026-11-10T20:00:00Z' }],
    [{ date: '2026-11-10', title: 'Addiction Daily Roundup', items: [] }],
    visibleFeatures([feature], onPublish),
  );
  assert.deepEqual(feed.map((entry) => entry.kind), ['feature', 'roundup', 'post']);
  assert.deepEqual(
    buildNewsFeed([], [], visibleFeatures([feature], beforePublish)).map((entry) => entry.kind),
    [],
  );
});

test('a non-date share context does not crash the feature preview', async () => {
  const res = await shareGet(
    new Request('https://www.addictionpas.org/api/share?slug=feature&feature=founders-jim-anderson-shani-wilson'),
    { waitUntil() {} },
  );
  assert.notEqual(res.status, 500);
  if (pacificCalendarDay(new Date()) < '2026-11-10') {
    assert.equal(res.status, 404);
    assert.equal((await res.text()).includes(FOUNDERS_FEATURE_TITLE), false);
  }
});

test('every user agent gets 404 before Nov 10 PT and the shell or share card after', async () => {
  for (const ua of [CURL, GOOGLEBOT]) {
    const hidden = await featureRequest(ua, beforePublish);
    assert.equal(hidden.status, 404, ua);
    assert.equal(hidden.headers.get('cache-control'), 'no-store', ua);
    assert.equal(hidden.headers.get('x-robots-tag'), 'noindex', ua);
    const text = await hidden.text();
    assert.match(text, /<div id="root"><\/div>/, ua);
    assert.equal(text.includes(ESSAY_SENTENCE), false, ua);
  }

  const botHidden = await featureRequest(FACEBOOK, beforePublish);
  assert.equal(botHidden.status, 404);
  const botText = await botHidden.text();
  assert.equal(botText.includes('<div id="root">'), false);
  assert.equal(botText.includes(ESSAY_SENTENCE), false);

  for (const ua of [CURL, GOOGLEBOT]) {
    const shown = await featureRequest(ua, onPublish);
    assert.equal(shown.status, 200, ua);
    const html = await shown.text();
    assert.match(html, /<div id="root"><\/div>/);
    assert.equal(html.includes(ESSAY_SENTENCE), false);
  }

  const card = await featureRequest(FACEBOOK, onPublish);
  assert.equal(card.status, 200);
  const html = await card.text();
  assert.match(html, /<title>Founders Feature: Jim Anderson and Shani Wilson \| SAMPA<\/title>/);
  assert.match(html, /property="og:title" content="Founders Feature: Jim Anderson and Shani Wilson \| SAMPA"/);
  assert.match(html, /property="og:description" content="When Jim Anderson started in SAMPA, formerly \(and fondly\) called SPAAM, it was little more than a spark of an idea\."/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.addictionpas\.org\/news\/features\/founders-jim-anderson-shani-wilson"/);
  assert.equal(html.includes(ESSAY_SENTENCE), false);
  assert.equal(featureSharePreview(modules, 'founders-jim-anderson-shani-wilson', beforePublish), null);
  assert.equal(FEATURE_URL.endsWith('/news/features/founders-jim-anderson-shani-wilson'), true);
});

test('the essay body endpoint is 404 before the publish day and 200 after', async () => {
  const hidden = await featureRequest(CURL, beforePublish, 'body');
  assert.equal(hidden.status, 404);
  const hiddenBody = await hidden.text();
  assert.equal(hiddenBody.includes(ESSAY_SENTENCE), false);
  assert.equal(hiddenBody.includes('<div id="root">'), false);

  const google = await featureRequest(GOOGLEBOT, beforePublish, 'body');
  assert.equal(google.status, 404);

  const shown = await featureRequest(CURL, onPublish, 'body');
  assert.equal(shown.status, 200);
  assert.match(shown.headers.get('content-type'), /application\/json/);
  const body = await shown.json();
  assert.equal(body.paragraphs.some((paragraph) => paragraph.includes(ESSAY_SENTENCE)), true);
  assert.equal(body.references.length, 4);

  const page = readFileSync(new URL('../src/pages/FeatureArticle.jsx', import.meta.url), 'utf8');
  assert.match(page, /featureBodyUrl\(slug\)/);
  assert.equal(page.includes('newsFeatureCatalog'), false);
  assert.equal(page.includes('import.meta.glob'), false);
  assert.equal(featureBodyUrl('founders-jim-anderson-shani-wilson'), '/api/share?slug=feature&feature=founders-jim-anderson-shani-wilson&part=body');
});

test('built client assets do not contain the essay', { timeout: 120000 }, () => {
  execFileSync('npx', ['vite', 'build'], { stdio: 'pipe' });
  const dir = join(process.cwd(), 'dist', 'assets');
  const files = readdirSync(dir).filter((name) => name.endsWith('.js'));
  assert.ok(files.length > 0);
  for (const name of files) {
    const source = readFileSync(join(dir, name), 'utf8');
    assert.equal(source.includes(ESSAY_SENTENCE), false, name);
    assert.equal(source.includes('newsFeatureCatalog'), false, name);
  }
});

test('the feature route is registered ahead of the post slug, and every user agent rewrites to share', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const featureAt = app.indexOf('path="/news/features/:slug"');
  const postAt = app.indexOf('path="/news/:slug"');
  assert.ok(featureAt > -1 && featureAt < postAt);
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const rule = vercel.rewrites.find((entry) => entry.source === '/news/features/:slug');
  assert.equal(rule.destination, '/api/share?slug=feature&feature=:slug');
  assert.equal(rule.has, undefined);
  assert.equal(existsSync(new URL('../content/daily-news/2026-11-10.json', import.meta.url)), false);
  assert.equal(existsSync(new URL('../src/lib/newsFeatureCatalog.js', import.meta.url)), false);
});
