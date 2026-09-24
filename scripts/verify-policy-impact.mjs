#!/usr/bin/env node
// Impact charts use listPolicyDocuments(), the same module as /policy.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listPolicyDocuments } from '../src/data/policyDocuments.js';
import { educationCount, shapeEducationImpact } from '../src/lib/educationImpact.js';
import { filedDateOf, shapePolicyImpact } from '../src/lib/policyImpact.js';

const NOW = new Date('2026-09-24T12:00:00.000Z');

describe('policy hub filings', () => {
  it('charts the dated items on the public policy hub', () => {
    const docs = listPolicyDocuments();
    const stats = shapePolicyImpact(docs, NOW);
    assert.equal(stats.source, 'policyDocuments');
    assert.equal(stats.total, 4);
    assert.equal(stats.undated, 0);
    assert.equal(stats.yearOnly, false);
    assert.equal(stats.chartsReady, true);
    assert.deepEqual(stats.monthly, [
      { month: '2026-07', count: 1 },
      { month: '2026-08', count: 2 },
      { month: '2026-09', count: 1 },
    ]);
    assert.deepEqual(stats.cumulative.map((point) => point.total), [1, 3, 4]);
    assert.deepEqual(stats.recent.map((item) => item.slug), [
      'cms-pfs-cy-2027-1848-p',
      'asam-correctional-settings-2026',
      'hrsa-rfi-psychedelic-therapies-2026',
      'hhs-rfi-chronic-disease-addiction-2026',
    ]);
    assert.equal(stats.recent[0].date, '2026-09-14');
    assert.equal(stats.recent[0].href, '/policy/cms-pfs-cy-2027-1848-p');
    assert.equal(stats.recent[0].title.includes('CMS-1848-P'), true);
  });
});

describe('filing date rules', () => {
  it('prefers the submission date and counts a year-only date in January', () => {
    assert.deepEqual(
      filedDateOf({ submittedAt: '2026-09-14', publishedAt: '2026-01-01' }),
      { date: '2026-09-14', yearOnly: false },
    );
    assert.deepEqual(filedDateOf({ publishedAt: '2024' }), {
      date: '2024-01-01',
      yearOnly: true,
    });
    const stats = shapePolicyImpact([
      { slug: 'year', title: 'Year only', submittedAt: '2025' },
      { slug: 'full', title: 'Full date', submittedAt: '2026-03-02' },
    ], NOW);
    assert.equal(stats.yearOnly, true);
    assert.equal(stats.chartsReady, true);
    assert.equal(stats.monthly.find((point) => point.month === '2025-01').count, 1);
    assert.equal(stats.monthly.find((point) => point.month === '2026-03').count, 1);
    assert.equal(stats.cumulative.at(-1).total, 2);
    assert.equal(stats.recent[1].yearOnly, true);
  });

  it('fills empty months and hides charts until two dated items exist', () => {
    const gapped = shapePolicyImpact([
      { slug: 'a', title: 'A', submittedAt: '2026-07-05' },
      { slug: 'b', title: 'B', submittedAt: '2026-09-14' },
    ], NOW);
    assert.deepEqual(gapped.monthly.map((point) => point.count), [1, 0, 1]);
    assert.deepEqual(gapped.cumulative.map((point) => point.total), [1, 1, 2]);

    const one = shapePolicyImpact([
      { slug: 'only', title: 'Only filing', submittedAt: '2026-07-05' },
    ], NOW);
    assert.equal(one.total, 1);
    assert.equal(one.chartsReady, false);
    assert.equal(one.recent.length, 1);
    assert.equal(one.monthly.length, 3);

    const none = shapePolicyImpact([], NOW);
    assert.equal(none.total, 0);
    assert.equal(none.chartsReady, false);
    assert.deepEqual(none.recent, []);
    assert.deepEqual(none.monthly, []);
  });
});

describe('education under impact', () => {
  it('counts real sources and leaves CME and jobs unlabeled by a number', () => {
    const shaped = shapeEducationImpact({ publishedNews: 12, weeklyIssues: 5 });
    assert.equal(shaped.news, 12);
    assert.equal(shaped.weeklyIssues, 5);
    assert.equal(educationCount(0), 0);
    assert.equal(educationCount(null), null);
    assert.equal(educationCount(''), null);
    assert.equal(shapeEducationImpact({}).news, null);
    assert.equal(shapeEducationImpact({}).weeklyIssues, null);
    assert.deepEqual(shaped.placeholders.map((row) => row.note), ['Not connected', 'Not connected']);
    assert.equal(shaped.placeholders.some((row) => Object.hasOwn(row, 'count')), false);
  });

  it('nests Education inside the Impact panel', () => {
    const dashboard = readFileSync('src/components/OrgDashboard.jsx', 'utf8');
    const panel = dashboard.slice(
      dashboard.indexOf('export function ImpactPanel'),
      dashboard.indexOf('function ImpactSection'),
    );
    const page = dashboard.slice(dashboard.indexOf('export default function OrgDashboard'));
    assert.match(panel, /<h3[^>]*>\s*Policy\s*<\/h3>/);
    assert.match(panel, /Education/);
    assert.match(panel, /News articles published/);
    assert.match(panel, /Weekly issues sent/);
    assert.match(panel, /not connected yet/);
    assert.match(panel, /EDUCATION_PLACEHOLDERS/);
    assert.match(dashboard, /\.eq\('status', 'published'\)/);
    assert.match(page, /<ImpactSection \/>/);
    assert.doesNotMatch(page, /Education/);
  });
});

describe('dashboard wiring', () => {
  it('reads the policy hub module and does not keep a second filing list', () => {
    const dashboard = readFileSync('src/components/OrgDashboard.jsx', 'utf8');
    assert.match(dashboard, /listPolicyDocuments/);
    assert.match(dashboard, /ImpactPanel/);
    assert.match(dashboard, /<ImpactSection \/>/);
    assert.doesNotMatch(dashboard, /cms-pfs-cy-2027|hhs-rfi-chronic-disease/);
  });
});
