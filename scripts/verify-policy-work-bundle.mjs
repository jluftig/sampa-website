#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DATA_FILE = 'api/_lib/policyWorkInternal.js';
if (existsSync(new URL(`../${DATA_FILE}`, import.meta.url))) {
  console.error(`${DATA_FILE} must not be in the repo`);
  process.exit(1);
}

function filesUnder(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...filesUnder(path));
    else if (/\.(js|jsx|css|html|json|md|mjs)$/.test(name)) found.push(path);
  }
  return found;
}

function collectStrings(value, out) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length >= 8) out.add(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, out));
  }
}

const artifactPath = process.env.POLICY_WORK_INTERNAL_FILE
  || '/opt/cursor/artifacts/policy-work-internal.json';

const roots = ['src', 'api', 'scripts', 'docs', 'dist'];
const files = [];
for (const root of roots) {
  const path = new URL(`../${root}`, import.meta.url).pathname;
  if (!existsSync(path)) {
    if (root === 'dist') {
      console.error('dist is missing. Run npm run build first.');
      process.exit(1);
    }
    continue;
  }
  files.push(...filesUnder(path));
}

if (!existsSync(artifactPath)) {
  console.log(`scanned ${files.length} files; no policy-work internal artifact to compare`);
  process.exit(0);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(artifactPath, 'utf8'));
} catch (err) {
  console.error(`could not read ${artifactPath}: ${err.message}`);
  process.exit(1);
}

const needles = new Set();
collectStrings(parsed, needles);
const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (text.includes(needle)) hits.push(file);
  }
}

if (hits.length) {
  console.error(`policy-work internal values appear in ${[...new Set(hits)].length} files`);
  process.exit(1);
}

console.log(`scanned ${files.length} files against ${needles.size} internal strings; none present`);
