#!/usr/bin/env node
// ASAM Behavioral Addictions Volume comment on /policy.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import lineComments from '../src/data/asam-behavioral-addictions-line-comments-2026.json' with { type: 'json' };
import {
  formatCitationCapsule,
  getPolicyDocument,
  listPolicyDocuments,
  POLICY_HUB,
} from '../src/data/policyDocuments.js';

const SLUG = 'asam-behavioral-addictions-framework-2026';
const COMMENT_SHA256 = '9e3152498a31a636239712d697d033f9e7b05b60114aad2090e9400fb1de6192';

describe('ASAM behavioral addictions comment', () => {
  it('resolves the published hub entry with 32 verbatim line comments', () => {
    const raw = readFileSync(
      'src/data/asam-behavioral-addictions-line-comments-2026.json',
    );
    assert.equal(createHash('sha256').update(raw).digest('hex'), COMMENT_SHA256);

    const doc = getPolicyDocument(SLUG);
    assert.ok(doc);
    assert.equal(doc.type, 'comment');
    assert.equal(doc.agency, 'American Society of Addiction Medicine (ASAM)');
    assert.equal(
      doc.docket,
      'Framework for the Behavioral Addictions Volume · The ASAM Criteria, Fourth Edition, Volume 4',
    );
    assert.equal(doc.submittedAt, '2026-11-20');
    assert.equal(doc.publishedAt, '2026-11-24');
    assert.equal(doc.pdfUrl, '/files/policy/asam-behavioral-addictions-framework-2026.pdf');
    assert.equal(doc.onBehalfOfMembers, true);
    assert.equal(doc.themes.length, 7);
    assert.match(doc.title, /Behavioral Addictions Volume/);
    assert.match(doc.bodyHtml, /Josh Luftig, PA-C/);
    assert.match(doc.bodyHtml, /policy@addictionpas\.org/);
    assert.match(doc.bodyHtml, /www\.asam\.org\/asam-criteria\/behavioral-addictions/);
    assert.equal(doc.lineComments.length, 32);
    assert.deepEqual(doc.lineComments, lineComments);

    const listed = listPolicyDocuments();
    assert.equal(listed[0].slug, SLUG);
    assert.equal(listed.filter((item) => item.slug === SLUG).length, 1);
  });

  it('labels page 0 line 0 as General and keeps shared Dimension 4 locators distinct', () => {
    assert.equal(formatCitationCapsule(0, 0), 'General');
    assert.equal(formatCitationCapsule(1, 4), '[P1 L4]');
    assert.equal(formatCitationCapsule(15, 10), '[P15 L10]');
    assert.equal(formatCitationCapsule(12, 0), '[P12 L0]');

    const doc = getPolicyDocument(SLUG);
    const general = doc.lineComments.filter((item) => item.page === 0 && item.line === 0);
    assert.equal(general.length, 5);
    assert.deepEqual(
      general.map((item) => item.title),
      [
        'General: harm reduction principle',
        'General: name evidence-based treatments',
        'General: telehealth at outpatient and IOP levels',
        'General: coverage without treatment-failure or co-occurring SUD rules',
        'General: groups with higher risk and less access',
      ],
    );

    const dimension4 = doc.lineComments.filter((item) => item.page === 15 && item.line === 10);
    assert.equal(dimension4.length, 2);
    assert.notEqual(dimension4[0].title, dimension4[1].title);
    assert.equal(formatCitationCapsule(dimension4[0].page, dimension4[0].line), '[P15 L10]');
    assert.match(dimension4[1].comment, /financial harm/);

    const withRevision = doc.lineComments.filter((item) => item.revision);
    assert.equal(withRevision.length, 7);
    assert.match(doc.lineComments[0].comment, /physician associates \(PAs\)/);
    assert.match(doc.lineComments[2].revision, /sweepstakes-style gambling platforms/);
    assert.match(doc.lineComments[28].comment, /naltrexone/);
  });

  it('names the new comment in the hub sentence and keeps CMS last', () => {
    const sentence = POLICY_HUB.oneLiner;
    const clause = 'to ASAM on the Behavioral Addictions Volume of The ASAM Criteria, Fourth Edition,';
    assert.match(sentence, /to ASAM on correctional settings and reentry standards, to ASAM on the Behavioral Addictions Volume/);
    const at = sentence.indexOf(clause);
    const cms = sentence.indexOf('and to CMS on the CY 2027 Medicare Physician Fee Schedule');
    assert.ok(at > 0);
    assert.ok(cms > at);
  });

  it('publishes a PDF whose title names the volume', async () => {
    const pdf = readFileSync('public/files/policy/asam-behavioral-addictions-framework-2026.pdf');
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    const loaded = await PDFDocument.load(pdf);
    assert.ok(loaded.getPageCount() >= 6);
    assert.match(loaded.getTitle() || '', /Behavioral Addictions Volume/);
  });
});
