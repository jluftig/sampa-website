import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { decideAuthRedirect } from '../src/lib/authRedirect.js';
import {
  expectedRewrites,
  matchRoute,
  pathMatches,
  routeRedirects,
  routes,
} from '../src/lib/routeManifest.js';
import { buildSitemapXml } from './write-daily-sitemap.mjs';

const signedOut = { loading: false, sessionUsable: false, halfSession: false, profile: null };

function samplePath(pattern) {
  return pattern.replace(/:year\b/g, '2026').replace(/:[A-Za-z]+/g, 'example');
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(path);
  }
  return out;
}

function linkedPaths(source) {
  const found = [];
  const pattern = /(?:\b(?:to|href)\s*=\s*|\bto\s*:\s*)(['"])(\/[^'"]*)\1/g;
  for (const match of source.matchAll(pattern)) {
    const path = match[2].split('?')[0].split('#')[0] || '/';
    if (path.startsWith('//')) continue;
    found.push(path);
  }
  return found;
}

test('vercel rewrites match the route manifest', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.deepEqual(config.rewrites, expectedRewrites());
});

test('vercel redirects include every manifest redirect and no extra page redirect', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const expected = routeRedirects();
  for (const redirect of expected) {
    const found = config.redirects.find((rule) => rule.source === redirect.source);
    assert.ok(found, redirect.source);
    assert.equal(found.destination, redirect.destination);
    assert.equal(found.permanent, redirect.permanent);
  }
  for (const rule of config.redirects) {
    if (rule.source === '/store' || rule.source === '/merch') continue;
    if ((rule.has || []).some((cond) => cond.type === 'host')) continue;
    assert.ok(
      expected.some((redirect) => redirect.source === rule.source),
      `vercel redirect ${rule.source} is not in the route manifest`,
    );
  }
});

test('committed sitemap matches the manifest', () => {
  assert.equal(readFileSync('public/sitemap.xml', 'utf8'), buildSitemapXml());
});

test('no route is shadowed by an earlier pattern', () => {
  for (const route of routes) {
    if (route.path === '*') continue;
    const concrete = samplePath(route.path);
    const winner = routes.find((candidate) => candidate.path !== '*' && pathMatches(candidate.path, concrete));
    assert.equal(winner.path, route.path, `${route.path} is shadowed by ${winner?.path}`);
  }
});

test('a manifest redirect lands on a real route', () => {
  for (const redirect of routeRedirects()) {
    assert.ok(matchRoute(redirect.destination), redirect.destination);
  }
});

test('every gated route sends a signed-out visitor to login', () => {
  const gated = routes.filter((route) => route.gate);
  assert.ok(gated.length > 0);
  for (const route of gated) {
    const path = samplePath(route.path);
    const dest = decideAuthRedirect(path, signedOut);
    assert.equal(typeof dest, 'string', route.path);
    assert.equal(dest.startsWith('/login'), true, `${route.path} -> ${dest}`);
  }
});

test('App renders the manifest and does not declare its own paths', () => {
  const app = readFileSync('src/App.jsx', 'utf8');
  assert.match(app, /from '\.\/lib\/routeManifest'/);
  assert.equal(app.includes('path="'), false);
  for (const route of routes) {
    if (route.redirect) continue;
    assert.match(app, new RegExp(`\\b${route.page}:`), route.page);
    if (route.gate) assert.match(app, new RegExp(`\\b${route.gate}\\b`), route.gate);
  }
});

test('in-app links point at a declared route', () => {
  const misses = [];
  for (const file of walk('src')) {
    const source = readFileSync(file, 'utf8');
    for (const path of linkedPaths(source)) {
      if (!matchRoute(path)) misses.push(`${file} -> ${path}`);
    }
  }
  assert.deepEqual(misses, []);
});

test('route paths are unique', () => {
  const paths = routes.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length);
});
