import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyMergeLane,
  isRealDate,
  renderSummary,
  statusDescription,
  todayInLosAngeles,
} from './merge-lane.mjs';

const today = '2026-11-28';

function classify(files, branch, day = today) {
  return classifyMergeLane({ files, branch, today: day });
}

test('two-file daily is tier-0', () => {
  const result = classify([
    'public/sitemap.xml',
    'content/daily-news/2026-11-27.json',
  ], 'daily-news/2026-11-27');
  assert.equal(result.lane, 'tier-0');
  assert.equal(result.ok, true);
  assert.deepEqual(result.files, [
    'content/daily-news/2026-11-27.json',
    'public/sitemap.xml',
  ]);
  assert.match(renderSummary(result), /^lane: tier-0\n/);
  assert.match(renderSummary(result), /content\/daily-news\/2026-11-27\.json/);
  assert.match(renderSummary(result), /public\/sitemap\.xml/);
  assert.match(statusDescription(result), /^tier-0/);
});

test('one-file same-day fix on a -fix branch is tier-0', () => {
  const result = classify(
    ['content/daily-news/2026-11-27.json'],
    'daily-news/2026-11-27-fix',
  );
  assert.equal(result.lane, 'tier-0');
  assert.equal(result.ok, true);
  assert.match(renderSummary(result), /^lane: tier-0\n/);
  assert.match(statusDescription(result), /^tier-0/);
});

test('STATUS-only is tier-0', () => {
  const result = classify(['docs/STATUS.md'], 'cursor/status-note');
  assert.equal(result.lane, 'tier-0');
  assert.equal(result.ok, true);
  assert.match(renderSummary(result), /^lane: tier-0\n/);
  assert.match(statusDescription(result), /^tier-0/);
});

test('STATUS plus another file is needs-josh', () => {
  const result = classify(
    ['docs/STATUS.md', 'README.md'],
    'cursor/status-note',
  );
  assert.equal(result.lane, 'needs-josh');
  assert.equal(result.ok, true);
  assert.match(renderSummary(result), /^lane: needs-josh\n/);
  assert.match(statusDescription(result), /^needs-josh/);
});

test('daily branch with an extra file fails', () => {
  const result = classify([
    'content/daily-news/2026-11-27.json',
    'src/pages/Home.jsx',
  ], 'daily-news/2026-11-27');
  assert.equal(result.lane, 'fail');
  assert.equal(result.ok, false);
  assert.match(renderSummary(result), /^fail: daily-news branch is outside the tier-0 allow-list\n/);
  assert.match(statusDescription(result), /^fail/);
  assert.doesNotMatch(statusDescription(result), /^(tier-0|needs-josh)/);
});

test('daily date mismatch fails', () => {
  const result = classify(
    ['content/daily-news/2026-11-26.json'],
    'daily-news/2026-11-27',
  );
  assert.equal(result.lane, 'fail');
  assert.equal(result.ok, false);
  assert.match(statusDescription(result), /^fail/);
});

test('a normal feature PR is needs-josh', () => {
  const result = classify(['src/pages/Home.jsx'], 'cursor/member-header');
  assert.equal(result.lane, 'needs-josh');
  assert.equal(result.ok, true);
  assert.match(renderSummary(result), /^lane: needs-josh\n/);
  assert.match(statusDescription(result), /^needs-josh/);
});

test('two daily JSONs fail', () => {
  const result = classify([
    'content/daily-news/2026-11-27.json',
    'content/daily-news/2026-11-26.json',
  ], 'daily-news/2026-11-27');
  assert.equal(result.lane, 'fail');
  assert.equal(result.ok, false);
});

test('a daily file dated today is tier-0 on a feature branch', () => {
  const result = classify(
    ['content/daily-news/2026-11-28.json'],
    'cursor/member-header',
  );
  assert.equal(result.lane, 'tier-0');
  assert.equal(result.ok, true);
});

test('a stale daily file on a feature branch is needs-josh', () => {
  const result = classify(
    ['content/daily-news/2026-11-27.json'],
    'cursor/member-header',
  );
  assert.equal(result.lane, 'needs-josh');
  assert.equal(result.ok, true);
});

test('today overrides a different daily-news branch date', () => {
  const result = classify(
    ['content/daily-news/2026-11-28.json'],
    'daily-news/2026-11-27',
  );
  assert.equal(result.lane, 'tier-0');
  assert.equal(result.ok, true);
});

test('an invalid calendar date on a daily-news branch fails', () => {
  assert.equal(isRealDate('2026-11-31'), false);
  const result = classify(
    ['content/daily-news/2026-11-31.json'],
    'daily-news/2026-11-31',
  );
  assert.equal(result.lane, 'fail');
  assert.equal(result.ok, false);
});

test('STATUS-only on a daily-news branch fails', () => {
  const result = classify(['docs/STATUS.md'], 'daily-news/2026-11-27');
  assert.equal(result.lane, 'fail');
  assert.equal(result.ok, false);
});

test('Los Angeles today uses the calendar date west of UTC', () => {
  assert.equal(todayInLosAngeles(new Date('2026-11-28T07:30:00Z')), '2026-11-27');
  assert.equal(todayInLosAngeles(new Date('2026-11-28T08:30:00Z')), '2026-11-28');
});

test('status descriptions stay within the GitHub limit', () => {
  const result = classify(
    Array.from({ length: 20 }, (_, index) => `src/file-${index}.jsx`),
    'cursor/member-header',
  );
  assert.ok(statusDescription(result).length <= 140);
  assert.match(statusDescription(result), /^needs-josh/);
});
