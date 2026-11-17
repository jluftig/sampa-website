import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { walkAuthRedirects } from '../src/lib/authRedirect.js';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const signedOut = { loading: false, sessionUsable: false, halfSession: false, profile: null };
const halfSession = { loading: false, sessionUsable: false, halfSession: true, profile: null };
const loading = { loading: true, sessionUsable: false, halfSession: false, profile: null };
const signedIn = {
  loading: false,
  sessionUsable: true,
  halfSession: false,
  profile: { role: 'member', membership_status: 'active' },
};

function gatedRoutes(appSource) {
  const blocks = appSource.match(/<Route\b[\s\S]*?(?:\/>|<\/Route>)/g) || [];
  const routes = [];
  for (const block of blocks) {
    const gate = block.match(/<(Require[A-Z][A-Za-z]*)\b/);
    if (!gate) continue;
    const path = block.match(/\spath="([^"]+)"/);
    assert.ok(path, 'a gated route is missing path="..."');
    routes.push({ path: path[1], gate: gate[1] });
  }
  return routes;
}

function samplePath(pattern) {
  return pattern.replace(/:year\b/g, '2026').replace(/:[A-Za-z]+/g, 'example');
}

const routes = gatedRoutes(source);
const requireTags = source.match(/<Require[A-Z][A-Za-z]*/g) || [];

describe('App.jsx gates are visible to the redirect walker', () => {
  it('parses one route per Require* wrapper', () => {
    assert.ok(routes.length > 0);
    assert.equal(routes.length, requireTags.length);
    const paths = routes.map((route) => route.path);
    assert.ok(paths.includes('/survey/:year'));
    assert.ok(paths.includes('/dashboard/emails'));
    assert.equal(new Set(paths).size, paths.length);
  });

  it('leaves a public page where it is', () => {
    const walk = walkAuthRedirects('/about', signedOut);
    assert.equal(walk.cycle, false);
    assert.equal(walk.stuckAt, '/about');
    assert.equal(walkAuthRedirects('/', signedOut).stuckAt, '/');
  });

  for (const route of routes) {
    const path = samplePath(route.path);
    const login = `/login?next=${encodeURIComponent(path)}`;

    it(`${route.gate} ${route.path} sends a signed-out visitor to login once`, () => {
      const walk = walkAuthRedirects(path, signedOut);
      assert.equal(walk.cycle, false, walk.hops.join(' → '));
      assert.equal(walk.stuckAt, login);
      assert.equal(walkAuthRedirects(login, signedOut).stuckAt, login);
    });

    it(`${route.gate} ${route.path} holds a half-hydrated or loading session on the page`, () => {
      const held = walkAuthRedirects(path, halfSession);
      assert.equal(held.cycle, false, held.hops.join(' → '));
      assert.equal(held.stuckAt, path);
      const pending = walkAuthRedirects(path, loading);
      assert.equal(pending.cycle, false, pending.hops.join(' → '));
      assert.equal(pending.stuckAt, path);
    });

    it(`${route.gate} ${route.path} does not bounce a usable session`, () => {
      const walk = walkAuthRedirects(path, signedIn);
      assert.equal(walk.cycle, false, walk.hops.join(' → '));
      assert.equal(walk.stuckAt, path);
    });
  }
});
