#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NEEDLES = [
  'Brian Dautch',
  'Jennifer Kolb',
  '1SQWwYdfgSkxT8VYASlPZ4s4v-yGHdGBa',
  '1d7vJlcLmm7go7S7WvWhXMbl06qBkejRTlDFk7Ut3B5o',
  'Confirm the Google Doc matches the published HHS comment.',
  'Keep this drug-testing statement separate from the correctional-settings comment on /policy.',
  'Record the submission date and who received it. The sheet left both blank.',
  'Confirm whether this row is the published HRSA psychedelic RFI comment.',
  'ouid=104595662487774707106',
];

function filesUnder(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...filesUnder(path));
    else if (/\.(js|css|html|map)$/.test(name)) found.push(path);
  }
  return found;
}

const root = new URL('../dist', import.meta.url).pathname;
let files;
try {
  files = filesUnder(root);
} catch (err) {
  console.error(`dist is missing (${err.code || err.message}). Run npm run build first.`);
  process.exit(1);
}

const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const needle of NEEDLES) {
    if (text.includes(needle)) hits.push(`${file} contains ${needle}`);
  }
}

if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}

console.log(`scanned ${files.length} built files; policy-work internal cards are absent`);
