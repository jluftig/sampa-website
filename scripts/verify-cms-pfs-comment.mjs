#!/usr/bin/env node
// Assert T51 CMS CY 2027 PFS public comment on the Policy hub.
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = readFileSync(join(root, 'src/data/policyDocuments.js'), 'utf8');
const pdfRel = 'public/files/policy/cms-pfs-cy-2027-1848-p.pdf';

const fail = (msg) => {
  console.error(`verify-cms-pfs-comment: ${msg}`);
  process.exit(1);
};

const must = (haystack, needle, label) => {
  if (!haystack.includes(needle)) fail(`${label} must include ${JSON.stringify(needle)}`);
};

must(seed, "slug: 'cms-pfs-cy-2027-1848-p'", 'policyDocuments.js');
must(seed, "type: 'comment'", 'policyDocuments.js');
must(seed, 'CMS-1848-P', 'policyDocuments.js');
must(seed, 'Centers for Medicare & Medicaid Services (CMS)', 'policyDocuments.js');
must(seed, 'CMS-2026-2377-0002', 'policyDocuments.js');
must(
  seed,
  'href="https://www.regulations.gov/document/CMS-2026-2377-0002"',
  'policyDocuments.js'
);
must(seed, '>Document ID CMS-2026-2377-0002</a>', 'policyDocuments.js');
must(seed, 'mu1-xtr9-b3nv', 'policyDocuments.js');
must(seed, "submittedAt: '2026-09-14'", 'policyDocuments.js');
must(seed, "publishedAt: '2026-09-14'", 'policyDocuments.js');
must(seed, "pdfUrl: '/files/policy/cms-pfs-cy-2027-1848-p.pdf'", 'policyDocuments.js');
must(seed, 'onBehalfOfMembers: true', 'policyDocuments.js');
must(seed, 'Quality ID 305', 'policyDocuments.js');
must(seed, 'GSMAS', 'policyDocuments.js');
must(seed, 'G2211', 'policyDocuments.js');
must(seed, 'policy@addictionpas.org', 'policyDocuments.js');
must(seed, 'Public Health Policy Committee', 'policyDocuments.js');
must(
  seed,
  'to CMS on the CY 2027 Medicare Physician Fee Schedule',
  'POLICY_HUB.oneLiner'
);
must(seed, 'to HHS on the chronic disease of addiction', 'POLICY_HUB.oneLiner');
must(seed, 'to HRSA on the safe rollout of emerging psychedelic therapies', 'POLICY_HUB.oneLiner');
must(seed, 'to ASAM on correctional settings and reentry standards', 'POLICY_HUB.oneLiner');
must(
  seed,
  'over time will publish positions, statements, and related materials',
  'POLICY_HUB.oneLiner'
);
must(seed, 'CY 2027 PFS (SBIRT, SUD shared medical appointments, visit-complexity, Quality ID 305)', 'POLICY_LEVERS');

const cmsBlock = seed.split("slug: 'cms-pfs-cy-2027-1848-p'")[1]?.split("slug: '")[0] || '';
if (cmsBlock.includes('lineComments')) {
  fail('CMS entry must not define lineComments');
}
for (const leftover of [
  'The letter is dated',
  'Signed by Shani Wilson',
  'Natasha Seliski',
  'Arianna Campbell',
]) {
  if (cmsBlock.includes(leftover)) {
    fail(`CMS bodyHtml must not restate ${JSON.stringify(leftover)}`);
  }
}
if (!cmsBlock.includes('Questions go to the SAMPA Public Health Policy Committee at policy@addictionpas.org')) {
  fail('CMS close should match the HRSA/ASAM committee + policy@ line');
}

const view = readFileSync(join(root, 'src/pages/PolicyView.jsx'), 'utf8');
must(view, 'dangerouslySetInnerHTML', 'PolicyView.jsx');
if (!view.includes('doc.docket') || !view.includes('DOMPurify.sanitize(doc.docket')) {
  fail('PolicyView must sanitize docket HTML so the regulations.gov citation can render');
}

const slugs = [...seed.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
if (slugs[0] !== 'cms-pfs-cy-2027-1848-p') {
  fail(`DOCUMENTS should list CMS first (got ${slugs[0]})`);
}

const pdfPath = join(root, pdfRel);
let stat;
try {
  stat = statSync(pdfPath);
} catch {
  fail(`missing ${pdfRel}`);
}
if (stat.size < 20_000 || stat.size > 500_000) {
  fail(`${pdfRel} size ${stat.size} is outside 20KB–500KB`);
}
const pdf = readFileSync(pdfPath);
if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) fail('PDF missing %PDF- header');
const loaded = await PDFDocument.load(pdf);
const pages = loaded.getPageCount();
if (pages < 3 || pages > 6) fail(`${pdfRel} should be 3–6 pages (got ${pages})`);
const title = loaded.getTitle() || '';
if (!title.includes('CMS-1848-P')) fail(`PDF title must name CMS-1848-P (got ${title})`);

console.log('verify-cms-pfs-comment: ok');
