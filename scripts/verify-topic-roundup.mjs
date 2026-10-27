import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync, readdirSync } from 'node:fs';
import { AuthContext } from '../src/lib/authState.js';
import { topicPage } from '../src/lib/topicRoundup.js';
import { TopicRoundupPage } from '../src/pages/TopicRoundupPage.jsx';
import { GET as shareGet, topicSharePreview } from '../api/share.js';

const seedPath = '/content/topic-roundup/2026-10-19.json';
const seed = JSON.parse(readFileSync(new URL(`..${seedPath}`, import.meta.url), 'utf8'));

const tremontiLead = 'Tremonti et al. Patient Experience of Withdrawal During Methadone\u2013Buprenorphine Transfer: A Prospective Cohort Study (2026). ';
const aboudLead = 'Aboud and Albert. Buprenorphine initiation in fentanyl use (2026). ';

function renderTopic(date, modules) {
  const auth = {
    loading: false,
    user: null,
    profile: null,
    signOut() {},
  };
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    null,
    createElement(
      AuthContext.Provider,
      { value: auth },
      createElement(TopicRoundupPage, { date, modules }),
    ),
  ));
}

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('topic roundup seed', () => {
  it('keeps the 2026-10-19 draft as the issue', () => {
    const warnings = [];
    const modules = { [seedPath]: seed };
    const page = topicPage(undefined, modules, (message) => warnings.push(message));
    const wrapped = topicPage(undefined, { [seedPath]: { default: seed } }, (message) => warnings.push(message));

    assert.deepEqual(warnings, []);
    assert.equal(page.status, 'issue');
    assert.equal(page.issue.date, '2026-10-19');
    assert.equal(page.issue.weekday, 'Monday, October 19, 2026');
    assert.equal(page.issue.banner, 'Draft - pending clinical review');
    assert.equal(page.issue.isLatest, true);
    assert.equal(page.issue.path, '/news/topic/2026-10-19');
    assert.equal(page.issue.items.length, 5);
    assert.equal(page.issue.furtherReading.length, 14);
    assert.deepEqual(page.issue.items, seed.items.map((item) => ({
      headline: item.headline.trim(),
      outlet: item.outlet.trim(),
      date: item.date.trim(),
      summary: item.summary.trim(),
      url: item.url.trim(),
    })));

    const tremonti = page.issue.furtherReading.find((row) => row.doi === '10.1111/dar.70211');
    const aboud = page.issue.furtherReading.find((row) => row.doi === '10.46747/cfp.7209529');
    assert.equal(tremonti.lead, tremontiLead);
    assert.equal(tremonti.href, 'https://doi.org/10.1111/dar.70211');
    assert.equal(tremonti.doi, '10.1111/dar.70211');
    assert.equal(aboud.lead, aboudLead);
    for (const row of page.issue.furtherReading) {
      assert.equal(row.lead.includes('et al..'), false);
    }
    assert.equal(wrapped.issue.furtherReading[1].lead, tremontiLead);

    const stringYear = {
      ...seed,
      furtherReading: seed.furtherReading.map((entry, index) => (
        index === 1 ? { ...entry, year: '2026' } : entry
      )),
    };
    const yearPage = topicPage(undefined, { [seedPath]: stringYear }, (message) => warnings.push(message));
    assert.equal(yearPage.issue.furtherReading[1].lead, tremontiLead);

    const published = { ...seed };
    delete published.draft;
    const absent = topicPage(undefined, { [seedPath]: published }, (message) => warnings.push(message));
    assert.equal(absent.issue.banner, null);
    assert.equal(topicPage(null, modules).status, 'issue');
    assert.equal(topicPage('', modules).status, 'issue');
    assert.deepEqual(topicPage('2026-01-02', modules), { status: 'not-found' });
    assert.deepEqual(warnings, []);
  });

  it('renders the draft issue with sources, dois, and footnotes', () => {
    const markup = renderTopic(undefined, { [seedPath]: seed });
    for (const item of seed.items) {
      assert.ok(markup.includes(item.headline));
    }
    for (const entry of seed.furtherReading) {
      assert.match(markup, new RegExp(`>${entry.doi.replaceAll('.', '\\.')}<`));
    }
    assert.match(markup, /Considered and skipped/);
    assert.match(markup, /Notes and caveats/);
    assert.match(markup, /role="status"/);
    assert.match(markup, /Draft - pending clinical review/);
    assert.equal(markup.includes('et al..'), false);
    assert.doesNotMatch(markup, /<a\b[^>]*>Buprenorphine initiation in fentanyl use<\/a>/);
    assert.match(markup, /Aboud and Albert\. Buprenorphine initiation in fentanyl use \(2026\)\. /);
    assert.match(markup, />Source<\/a>/);
  });
});

describe('skipped and missing issues', () => {
  it('skips a 4-item file and serves the older valid issue', () => {
    const olderDate = '2026-10-09';
    const newerDate = '2026-10-23';
    const newerPath = `/content/topic-roundup/${newerDate}.json`;
    const warnings = [];
    const modules = {
      [newerPath]: { ...seed, date: newerDate, items: seed.items.slice(0, 4) },
      [`/content/topic-roundup/${olderDate}.json`]: { ...seed, date: olderDate },
    };
    const latest = topicPage(undefined, modules, (message) => warnings.push(message));

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /2026-10-23\.json/);
    assert.equal(latest.status, 'issue');
    assert.equal(latest.issue.date, olderDate);
    assert.equal(latest.issue.isLatest, true);
    assert.deepEqual(topicPage(newerDate, modules, () => {}), { status: 'not-found' });
  });

  it('treats archive as not found', () => {
    const modules = { [seedPath]: seed };
    assert.deepEqual(topicPage('archive', modules), { status: 'not-found' });
    const markup = renderTopic('archive', modules);
    assert.match(markup, /Page not found/);
    assert.equal(markup.includes(seed.title), false);
  });

  it('shows the empty page when no issue is kept', () => {
    const warnings = [];
    assert.deepEqual(topicPage(undefined, {}, (message) => warnings.push(message)), { status: 'empty' });
    assert.deepEqual(warnings, []);
    const markup = renderTopic(undefined, {});
    assert.match(markup, /<h1[^>]*>\s*Weekly Topic Roundup\s*<\/h1>/);
    assert.match(markup, /The first Weekly Topic Roundup is on the way\./);
    assert.equal(markup.includes('Draft - pending clinical review'), false);
  });

  it('hides the banner when draft is false and keeps one period after et al', () => {
    const modules = { [seedPath]: { ...seed, draft: false } };
    const page = topicPage('2026-10-19', modules, () => {});
    assert.equal(page.issue.banner, null);
    const markup = renderTopic('2026-10-19', modules);
    assert.equal(markup.includes('Draft - pending clinical review'), false);
    assert.match(markup, /Tremonti et al\. Patient Experience of Withdrawal During Methadone\u2013Buprenorphine Transfer/);
    assert.equal(markup.includes('et al..'), false);
  });
});

describe('topic routes stay out of the daily catalog', () => {
  it('registers the topic routes before the news slug', () => {
    const app = source('src/App.jsx');
    const news = source('src/pages/News.jsx');
    const topic = app.indexOf('path="/news/topic"');
    const dated = app.indexOf('path="/news/topic/:date"');
    const slug = app.indexOf('path="/news/:slug"');
    assert.ok(topic !== -1 && dated !== -1 && slug !== -1);
    assert.ok(topic < slug);
    assert.ok(dated < slug);
    assert.match(news, /to="\/news\/topic"/);
    assert.match(news, /Weekly Topic Roundup →/);
    assert.equal(news.includes('/subscriptions'), false);
    const page = source('src/pages/TopicRoundupPage.jsx');
    assert.match(page, /path = `\/news\/topic\/\$\{issue\.date\}`;/);
    assert.equal(/dated \?[^\n]*\/news\/topic/.test(page), false);
    assert.match(
      source('src/lib/topicRoundupCatalog.js'),
      /import\.meta\.glob\('\/content\/topic-roundup\/\*\.json', \{ eager: true \}\)/,
    );
    assert.equal(source('src/pages/TopicRoundupPage.jsx').includes('import.meta.glob'), false);
    assert.equal(source('src/lib/topicRoundup.js').includes('import.meta.glob'), false);

    for (const path of [
      'src/lib/dailyNews.js',
      'src/lib/newsFeed.js',
      'src/pages/Home.jsx',
      'scripts/write-daily-sitemap.mjs',
    ]) {
      const text = source(path);
      assert.equal(text.includes('topic-roundup'), false, path);
      assert.equal(text.includes('topicRoundup'), false, path);
    }
  });

  it('unfurls /news/topic for crawlers and 404s an unknown topic date', async () => {
    let fetches = 0;
    const previous = globalThis.fetch;
    globalThis.fetch = async () => {
      fetches += 1;
      throw new Error('supabase should not be called for the topic slug');
    };
    try {
      const res = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=topic'));
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.equal(html.includes(`<title>${seed.title}</title>`), true);
      assert.equal(html.includes('A Weekly Topic Roundup from SAMPA.'), true);
      assert.equal(html.includes('name="robots" content="noindex"'), true);
      assert.equal(
        html.includes('rel="canonical" href="https://www.addictionpas.org/news/topic/2026-10-19"'),
        true,
      );
      assert.equal(fetches, 0);

      const missing = await shareGet(new Request('https://www.addictionpas.org/api/share?slug=topic&date=1999-01-01'));
      assert.equal(missing.status, 404);
      assert.equal(fetches, 0);
    } finally {
      globalThis.fetch = previous;
    }

    const rules = JSON.parse(source('vercel.json')).rewrites;
    const dated = rules.find((rule) => rule.source === '/news/topic/:date(\\d{4}-\\d{2}-\\d{2})');
    assert.equal(dated.destination, '/api/share?slug=topic&date=:date');
    const functions = readdirSync(new URL('../api', import.meta.url)).filter((name) => name.endsWith('.js'));
    assert.equal(functions.length, 12);
  });

  it('keeps noindex off a published topic issue and on a draft', () => {
    const published = topicSharePreview(
      { [seedPath]: { ...seed, draft: false } },
      '',
    );
    assert.equal(published.robots, null);
    assert.equal(published.title, seed.title);
    assert.equal(published.path, '/news/topic/2026-10-19');
    const draft = topicSharePreview({ [seedPath]: { ...seed, draft: true } }, '2026-10-19');
    assert.equal(draft.robots, 'noindex');
  });
});
