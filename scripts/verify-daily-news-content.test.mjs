import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { collectRoundups, roundupFromEntry } from '../src/lib/dailyNewsLoad.js';
import { DAILY_NEWS_DIR, issuesForFile, issuesInDirectory } from './verify-daily-news-content.mjs';

function goodFile(overrides = {}) {
  return {
    date: '2026-09-29',
    title: 'Addiction Daily Roundup',
    items: [
      {
        headline: 'Headline',
        outlet: 'Outlet',
        date: 'Sep 28',
        summary: 'Two sentences about the study.',
        url: 'https://example.com/story',
      },
    ],
    ...overrides,
  };
}

test('a good roundup file passes', () => {
  const issues = issuesForFile('2026-09-29.json', JSON.stringify(goodFile()));
  assert.deepEqual(issues, []);
});

test('a good roundup file with a feature passes', () => {
  const file = goodFile({
    feature: {
      title: 'Founders Feature',
      teaser: 'A short teaser for the essay.',
      href: '/news/features/founders-jim-anderson-shani-wilson',
      byline: 'Kerith Hartmann, PA-C',
    },
  });
  assert.deepEqual(issuesForFile('2026-09-29.json', JSON.stringify(file)), []);
});

test('a date that does not match the filename fails', () => {
  const issues = issuesForFile(
    '2026-09-29.json',
    JSON.stringify(goodFile({ date: '2026-09-01' })),
  );
  assert.deepEqual(issues, ['2026-09-29.json: date does not match filename']);
});

test('a missing headline fails', () => {
  const file = goodFile();
  delete file.items[0].headline;
  const issues = issuesForFile('2026-09-29.json', JSON.stringify(file));
  assert.ok(issues.some((issue) => issue.includes('item 1 is missing headline')));
});

test('an http source link fails', () => {
  const file = goodFile();
  file.items[0].url = 'http://example.com/story';
  const issues = issuesForFile('2026-09-29.json', JSON.stringify(file));
  assert.ok(issues.some((issue) => issue.includes('url must start with https://')));
});

test('unparseable JSON fails', () => {
  const issues = issuesForFile('2026-09-29.json', '{');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /^2026-09-29\.json: not valid JSON \(/);
});

test('duplicate item urls fail even though the loader keeps the file', () => {
  const file = goodFile();
  file.items.push({ ...file.items[0], headline: 'Same link, second headline' });
  const issues = issuesForFile('2026-09-29.json', JSON.stringify(file));
  assert.ok(issues.some((issue) => issue === '2026-09-29.json: duplicate item url https://example.com/story'));
  const warnings = [];
  const roundups = collectRoundups(
    { '/content/daily-news/2026-09-29.json': file },
    (message) => warnings.push(message),
  );
  assert.equal(roundups.length, 1);
  assert.deepEqual(warnings, []);
});

test('a broken feature fails even though the loader still publishes the items', () => {
  const file = goodFile({
    feature: {
      title: 'Founders Feature',
      teaser: 'A short teaser.',
      href: 'https://example.com/off-site',
      byline: 'Kerith Hartmann, PA-C',
    },
  });
  const issues = issuesForFile('2026-09-29.json', JSON.stringify(file));
  assert.ok(issues.some((issue) => issue.includes('feature href must be a site path')));
  const warnings = [];
  const roundups = collectRoundups(
    { '/content/daily-news/2026-09-29.json': file },
    (message) => warnings.push(message),
  );
  assert.equal(roundups.length, 1);
  assert.equal(roundups[0].feature, null);
  assert.equal(warnings.length, 1);
});

test('a directory reports only the file the loader would skip', () => {
  const dir = mkdtempSync(join(tmpdir(), 'daily-news-'));
  writeFileSync(join(dir, '2026-09-29.json'), JSON.stringify(goodFile()));
  writeFileSync(
    join(dir, '2026-09-30.json'),
    JSON.stringify(goodFile({ date: '2026-09-01' })),
  );
  const issues = issuesInDirectory(dir);
  assert.deepEqual(issues, ['2026-09-30.json: date does not match filename']);
  const entry = roundupFromEntry(
    '/content/daily-news/2026-09-30.json',
    goodFile({ date: '2026-09-01' }),
  );
  assert.equal(entry.ok, false);
});

test('every content/daily-news file passes', () => {
  const names = readdirSync(DAILY_NEWS_DIR).filter((name) => name.endsWith('.json'));
  assert.ok(names.length > 0);
  const issues = issuesInDirectory(DAILY_NEWS_DIR);
  assert.deepEqual(issues, [], issues.join('\n'));
});
