import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRoundups, isRealIsoDate, roundupFromEntry } from '../src/lib/dailyNewsLoad.js';

export const DAILY_NEWS_DIR = fileURLToPath(new URL('../content/daily-news/', import.meta.url));
const ITEM_FIELDS = ['headline', 'outlet', 'date', 'summary'];
const FEATURE_FIELDS = ['title', 'teaser', 'href', 'byline'];

function fileNameOf(filename) {
  return String(filename).split('/').pop();
}

function blank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function featureIssues(name, feature) {
  if (!feature || typeof feature !== 'object' || Array.isArray(feature)) {
    return [`${name}: feature must be an object with title, teaser, href, and byline`];
  }
  const missing = FEATURE_FIELDS.filter((field) => blank(feature[field]));
  if (missing.length > 0) {
    return [`${name}: feature needs ${missing.join(', ')}`];
  }
  const href = feature.href.trim();
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('..')) {
    return [`${name}: feature href must be a site path`];
  }
  return [];
}

function itemIssues(name, items) {
  const issues = [];
  const seen = new Set();
  items.forEach((item, index) => {
    const label = `item ${index + 1}`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      issues.push(`${name}: ${label} is not an object`);
      return;
    }
    for (const field of ITEM_FIELDS) {
      if (blank(item[field])) issues.push(`${name}: ${label} is missing ${field}`);
    }
    if (blank(item.url)) {
      issues.push(`${name}: ${label} is missing url`);
      return;
    }
    const url = item.url.trim();
    if (!url.startsWith('https://')) {
      issues.push(`${name}: ${label} url must start with https://`);
    }
    if (seen.has(url)) issues.push(`${name}: duplicate item url ${url}`);
    else seen.add(url);
  });
  return issues;
}

export function issuesForFile(filename, text) {
  const name = fileNameOf(filename);
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return [`${name}: not valid JSON (${error.message})`];
  }

  const issues = [];
  const stem = name.replace(/\.json$/i, '');
  if (!isRealIsoDate(stem)) {
    issues.push(`${name}: filename is not YYYY-MM-DD`);
  } else if (!data || typeof data !== 'object' || Array.isArray(data)) {
    issues.push(`${name}: file is not an object`);
  } else {
    if (data.date !== stem) issues.push(`${name}: date does not match filename`);
    if (blank(data.title)) issues.push(`${name}: title must be a non-empty string`);
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 7) {
      issues.push(`${name}: items must be an array of 1 to 7`);
    } else {
      issues.push(...itemIssues(name, data.items));
    }
    if (data.feature != null) issues.push(...featureIssues(name, data.feature));
  }

  const entry = roundupFromEntry(`/content/daily-news/${name}`, data);
  if (!entry.ok && issues.length === 0) issues.push(`${name}: ${entry.reason}`);
  if (entry.warning && !issues.some((issue) => issue.includes(entry.warning))) {
    issues.push(`${name}: ${entry.warning}`);
  }
  return issues;
}

export function issuesInDirectory(dir) {
  let names;
  try {
    names = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  } catch (error) {
    return [`${dir}: cannot read directory (${error.message})`];
  }

  const issues = [];
  const modules = {};
  for (const name of names) {
    const text = readFileSync(join(dir, name), 'utf8');
    issues.push(...issuesForFile(name, text));
    try {
      modules[`/content/daily-news/${name}`] = JSON.parse(text);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }

  const roundups = collectRoundups(modules, () => {});
  const loaded = new Set(roundups.map((roundup) => `${roundup.date}.json`));
  for (const path of Object.keys(modules)) {
    const name = path.split('/').pop();
    if (!loaded.has(name) && !issues.some((issue) => issue.startsWith(`${name}:`))) {
      issues.push(`${name}: loader skipped this file`);
    }
  }
  return issues;
}

function main() {
  const issues = issuesInDirectory(DAILY_NEWS_DIR);
  if (issues.length === 0) {
    const count = readdirSync(DAILY_NEWS_DIR).filter((name) => name.endsWith('.json')).length;
    console.log(`daily news content ok (${count} files)`);
    return;
  }
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
}

function runningThisFile() {
  if (!process.argv[1]) return false;
  return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (runningThisFile()) main();
