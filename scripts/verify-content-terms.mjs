import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasErrors, lintRepo, lintSource, loadConfig } from './content-terms.mjs';

const config = loadConfig();

function errors(file, source, rules = config) {
  return lintSource(file, source, rules).filter((finding) => finding.severity !== 'advisory');
}

function ruleIds(file, source, rules = config) {
  return lintSource(file, source, rules).map((finding) => finding.rule);
}

test('flags MAT in JSX text and points at the line', () => {
  const source = [
    'export function Card() {',
    '  return (',
    '    <p>',
    '      access to MOUD and MAT today',
    '    </p>',
    '  );',
    '}',
  ].join('\n');
  const hits = errors('Card.jsx', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].rule, 'mat');
  assert.equal(hits[0].line, 4);
  assert.match(hits[0].message, /MOUD/);
  assert.match(hits[0].message, /MAUD/);
  assert.match(hits[0].message, /medications for addiction treatment/);
});

test('skips comments, identifiers, import paths, and URLs', () => {
  const source = `
    // MAT in a comment, plus substance abuse and bupe
    /* addict and BUP */
    const MAT = 1;
    const id = 'mat-act';
    import thing from './MAT-module';
    const href = "https://example.com/opioid-abuse-map";
    const slug = "drug-abuse-paper";
    export function Card() {
      return <a href="https://example.com/MAT">medications for addiction treatment</a>;
    }
  `;
  assert.deepEqual(errors('Card.jsx', source), []);
});

test('flags a displayed string and allows XR BUP, lowercase bup, and buprenorphine', () => {
  const source = `
    export const slogan = "XR BUP";
    export const dose = "start bup today, then buprenorphine";
    export const wrong = "order BUP and bupe and Bup";
  `;
  const hits = errors('merch.js', source);
  assert.deepEqual(hits.map((hit) => hit.match), ['BUP', 'bupe', 'Bup']);
  assert.ok(hits.every((hit) => hit.message.includes('bup')));
});

test('flags stigmatizing language and keeps person-first wording, addiction, and child abuse', () => {
  const source = `
    export const bad = "an addict and an abuser had a clean urine and tested dirty. drug users and fentanyl users";
    export const good = "addiction treatment for people who use fentanyl. child abuse is a different sense. abuse the site.";
  `;
  const hits = errors('voice.js', source);
  assert.deepEqual(hits.map((hit) => hit.rule), [
    'stigmatizing-addict',
    'stigmatizing-abuser',
    'clean-dirty-test',
    'clean-dirty-test',
    'substance-users',
    'substance-users',
  ]);
});

test('allows SAMHSA and NIDA proper names and still flags a bare phrase', () => {
  const source = `
    export const name = "Substance Abuse and Mental Health Services Administration";
    export const nida = "National Institute on Drug Abuse";
    export const journal = "Substance Abuse Treatment, Prevention, and Policy";
    export const bare = "substance abuse in the lede";
  `;
  const hits = errors('names.js', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].rule, 'substance-or-drug-abuse');
  assert.equal(hits[0].match.toLowerCase(), 'substance abuse');
});

test('MAT Act is the statute name, and a longer word is not covered by that phrase', () => {
  const statute = `export const title = "Waiver elimination (MAT Act)";\n`;
  assert.deepEqual(errors('resources.js', statute), []);
  const longer = `export const title = "MAT Action plan";\n`;
  const hits = errors('plan.js', longer);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].rule, 'mat');
  assert.equal(hits[0].match, 'MAT');
});

test('a lone lowercase banned word is still copy', () => {
  const source = `
    export const label = "bupe";
    export const who = "addict";
    export const slug = "mat-act";
  `;
  const hits = errors('labels.js', source);
  assert.deepEqual(hits.map((hit) => `${hit.rule}:${hit.match}`), [
    'bup-case:bupe',
    'stigmatizing-addict:addict',
  ]);
});

test('prior-auth PA is advisory and does not fail; PA-C and PA billing stay quiet', () => {
  const source = `
    export const clinician = "PA-C and PAs and PA billing";
    export const auth = "PA required before the fill";
  `;
  const findings = lintSource('pa.jsx', source, config);
  assert.equal(hasErrors(findings), false);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'prior-auth-pa');
  assert.equal(findings[0].severity, 'advisory');
  assert.match(findings[0].message, /prior auth/);
});

test('inline ignore and file ignore', () => {
  const nextLine = [
    'export function Card() {',
    '  return (',
    '    <p>',
    '      {/* content-terms-ignore-next-line: mat */}',
    '      The source said MAT once',
    '    </p>',
    '  );',
    '}',
  ].join('\n');
  assert.deepEqual(errors('quote.jsx', nextLine), []);

  const sameLine = `export const x = "BUP"; // content-terms-ignore: bup-case\n`;
  assert.deepEqual(ruleIds('one.js', sameLine), []);

  const file = `// content-terms-ignore-file\nexport const x = "MAT and BUP and an addict";\n`;
  assert.deepEqual(errors('off.js', file), []);

  const selective = `// content-terms-ignore-next-line: mat\nexport const x = "MAT and BUP";\n`;
  assert.deepEqual(ruleIds('sel.js', selective), ['bup-case']);
});

test('per-file allowlist lets a quoted line pass', () => {
  const local = {
    rules: config.rules,
    allowlist: [{ file: 'quote.json', rule: 'mat', contains: 'the paper said MAT', reason: 'direct quote' }],
  };
  const source = JSON.stringify({ summary: 'the paper said MAT in 2019' });
  assert.deepEqual(errors('quote.json', source, local), []);
  assert.equal(errors('other.json', source, local).length, 1);
});

test('JSON scans summaries and skips url fields and slugs', () => {
  const source = JSON.stringify({
    id: 'mat-act',
    url: 'https://example.com/substance-abuse',
    summary: 'Clinicians still wrote MAT in the headline.',
  });
  const hits = errors('issue.json', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].rule, 'mat');
  assert.match(hits[0].excerpt, /headline/);
});

test('markdown skips fences, inline code, and link targets', () => {
  const source = [
    '```',
    'const word = "MAT";',
    '```',
    '',
    'See [MOUD](https://example.com/MAT) and `BUP` in code.',
    '',
    'The lede said MAT.',
  ].join('\n');
  const hits = errors('note.md', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 7);
});

test('HTML scans visible text and alt, not href or style or script', () => {
  const source = [
    '<style>.mat { color: red; }</style>',
    '<script>const x = "MAT";</script>',
    '<a href="https://example.com/MAT">medications for addiction treatment</a>',
    '<img alt="BUP bottle" src="/bup.png">',
    '<p>people who use fentanyl</p>',
  ].join('\n');
  const hits = errors('mail.html', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].rule, 'bup-case');
  assert.equal(hits[0].line, 4);
});

test('a character-class regex does not swallow the next string', () => {
  const source = "const x = value.replace(/[.*+?^${}()|[\\]\\\\]/g, 'MAT');\n";
  const hits = errors('re.js', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].match, 'MAT');
});

test('object keys and regex literals are not copy', () => {
  const source = `
    const row = { MAT: 1, "BUP": 2 };
    const re = /["']MAT["']/;
    row.label = "still MAT";
  `;
  const hits = errors('code.js', source);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].match, 'MAT');
  assert.match(hits[0].excerpt, /still MAT/);
});

test('the site copy currently open for lint has no errors', () => {
  const result = lintRepo(process.cwd(), config);
  const errorsOnly = result.findings.filter((finding) => finding.severity !== 'advisory');
  assert.deepEqual(errorsOnly, [], JSON.stringify(errorsOnly, null, 2));
  assert.ok(result.files > 50);
});

test('Membership and the practice-resources card still say the intended words', () => {
  const membership = readFileSync('src/components/Membership.jsx', 'utf8');
  assert.match(membership, /medications for addiction treatment/);
  assert.doesNotMatch(membership, /\bMAT\b/);
  const resources = readFileSync('src/data/practiceResources.js', 'utf8');
  assert.match(resources, /Waiver elimination \(MAT Act\)/);
});
