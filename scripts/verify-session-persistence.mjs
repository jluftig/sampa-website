#!/usr/bin/env node
// Session continuity: canonical www origin, cookie backup when localStorage
// is missing, auth-event recovery, checkout return URLs, guest donate stays open.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PRODUCTION_ORIGIN,
  canonicalOrigin,
  clientSiteOrigin,
  requestSiteOrigin,
  apexRedirectUrl,
} from '../src/lib/siteUrl.js';
import {
  cookieDomainForHost,
  cookieWritePlan,
  createAuthStorage,
  readChunkedCookie,
  AUTH_COOKIE_CHUNK_SIZE,
} from '../src/lib/authStorage.js';
import {
  isCheckoutReturnSearch,
  isAuthCallbackSearch,
  shouldRetryAuthRecovery,
  shouldHoldAuthReady,
  nextSessionFromAuthEvent,
  refreshSessionWithRetry,
  stripAuthCallbackParams,
} from '../src/lib/authSession.js';

const session = { access_token: 'tok', user: { id: 'u1', email: 'vic@example.com' } };

describe('canonical origin', () => {
  it('maps apex and www to https://www.addictionpas.org', () => {
    assert.equal(canonicalOrigin('https://addictionpas.org'), PRODUCTION_ORIGIN);
    assert.equal(canonicalOrigin('http://addictionpas.org'), PRODUCTION_ORIGIN);
    assert.equal(canonicalOrigin('https://www.addictionpas.org'), PRODUCTION_ORIGIN);
    assert.equal(canonicalOrigin('https://addictionpas.org/join'), PRODUCTION_ORIGIN);
  });

  it('leaves preview and localhost alone', () => {
    assert.equal(canonicalOrigin('https://sampa-website.vercel.app'), 'https://sampa-website.vercel.app');
    assert.equal(canonicalOrigin('http://localhost:5173'), 'http://localhost:5173');
  });

  it('clientSiteOrigin canonicalizes the current window', () => {
    assert.equal(clientSiteOrigin({ origin: 'https://addictionpas.org' }), PRODUCTION_ORIGIN);
    assert.equal(clientSiteOrigin({ origin: 'http://localhost:5173' }), 'http://localhost:5173');
  });

  it('requestSiteOrigin prefers x-forwarded-host and canonicalizes apex', () => {
    const request = {
      url: 'https://sampa-website.vercel.app/api/create-checkout-session',
      headers: new Map([
        ['x-forwarded-host', 'addictionpas.org'],
        ['x-forwarded-proto', 'https'],
        ['host', 'sampa-website.vercel.app'],
      ]),
    };
    request.headers.get = Map.prototype.get.bind(request.headers);
    assert.equal(requestSiteOrigin(request), PRODUCTION_ORIGIN);
  });

  it('apexRedirectUrl only rewrites addictionpas.org', () => {
    assert.equal(
      apexRedirectUrl({ hostname: 'addictionpas.org', href: 'https://addictionpas.org/donate?x=1' }),
      'https://www.addictionpas.org/donate?x=1',
    );
    assert.equal(apexRedirectUrl({ hostname: 'www.addictionpas.org', href: 'https://www.addictionpas.org/' }), null);
    assert.equal(apexRedirectUrl({ hostname: 'localhost', href: 'http://localhost:5173/' }), null);
  });
});

describe('auth storage backup', () => {
  it('uses a shared Domain cookie on production hosts only', () => {
    assert.equal(cookieDomainForHost('www.addictionpas.org'), '.addictionpas.org');
    assert.equal(cookieDomainForHost('addictionpas.org'), '.addictionpas.org');
    assert.equal(cookieDomainForHost('localhost'), null);
    assert.equal(cookieDomainForHost('sampa-website.vercel.app'), null);
  });

  it('reads localStorage first and falls back to cookies', () => {
    const ls = new Map([['sb-auth', '{"from":"ls"}']]);
    const storage = createAuthStorage({
      localStorage: {
        getItem: (k) => ls.get(k) ?? null,
        setItem: (k, v) => ls.set(k, v),
        removeItem: (k) => ls.delete(k),
      },
      getCookie: () => 'sb-auth=' + encodeURIComponent('{"from":"cookie"}'),
      setCookie: () => {},
      getLocation: () => ({ hostname: 'www.addictionpas.org', protocol: 'https:' }),
    });
    assert.equal(storage.getItem('sb-auth'), '{"from":"ls"}');

    const emptyLs = new Map();
    const cookieOnly = createAuthStorage({
      localStorage: {
        getItem: (k) => emptyLs.get(k) ?? null,
        setItem: (k, v) => emptyLs.set(k, v),
        removeItem: (k) => emptyLs.delete(k),
      },
      getCookie: () => 'sb-auth=' + encodeURIComponent('{"from":"cookie"}'),
      setCookie: () => {},
      getLocation: () => ({ hostname: 'www.addictionpas.org', protocol: 'https:' }),
    });
    assert.equal(cookieOnly.getItem('sb-auth'), '{"from":"cookie"}');
    assert.equal(emptyLs.get('sb-auth'), '{"from":"cookie"}');
  });

  it('still returns a session when localStorage throws (Safari / in-memory fallback)', () => {
    const lines = [];
    const storage = createAuthStorage({
      localStorage: {
        getItem: () => { throw new Error('SecurityError'); },
        setItem: () => { throw new Error('SecurityError'); },
        removeItem: () => { throw new Error('SecurityError'); },
      },
      getCookie: () => lines.filter((l) => !l.includes('Max-Age=0')).map((l) => l.split(';')[0]).join('; '),
      setCookie: (line) => { lines.push(line); },
      getLocation: () => ({ hostname: 'www.addictionpas.org', protocol: 'https:' }),
    });
    storage.setItem('sb-auth', '{"access_token":"tok"}');
    assert.equal(storage.getItem('sb-auth'), '{"access_token":"tok"}');
    const written = lines.join('\n');
    assert.match(written, /Domain=\.addictionpas\.org/);
    assert.match(written, /SameSite=Lax/);
    assert.match(written, /Secure/);
  });

  it('chunks oversized values and reassembles them', () => {
    const big = 'x'.repeat(AUTH_COOKIE_CHUNK_SIZE + 50);
    const writes = cookieWritePlan('sb-auth', big, { hostname: 'localhost', secure: false });
    assert.ok(writes.some((w) => w.startsWith('sb-auth.0=')));
    assert.ok(writes.some((w) => w.startsWith('sb-auth.1=')));
    const header = writes
      .filter((w) => !w.includes('Max-Age=0'))
      .map((w) => w.split(';')[0])
      .join('; ');
    assert.equal(readChunkedCookie('sb-auth', header), big);
  });
});

describe('auth event recovery', () => {
  it('detects checkout return and magic-link callbacks', () => {
    assert.equal(isCheckoutReturnSearch('?checkout=success'), true);
    assert.equal(isCheckoutReturnSearch('?status=success'), true);
    assert.equal(isCheckoutReturnSearch('?checkout=canceled'), false);
    assert.equal(isAuthCallbackSearch('?code=abc&next=/join'), true);
    assert.equal(isAuthCallbackSearch('?tier=fellow'), false);
  });

  it('keeps the last session across a null TOKEN_REFRESHED / SIGNED_OUT', () => {
    assert.deepEqual(
      nextSessionFromAuthEvent({ event: 'TOKEN_REFRESHED', incoming: null, previous: session }),
      session,
    );
    assert.deepEqual(
      nextSessionFromAuthEvent({ event: 'SIGNED_OUT', incoming: null, previous: session }),
      session,
    );
    assert.equal(
      nextSessionFromAuthEvent({
        event: 'SIGNED_OUT',
        incoming: null,
        previous: session,
        intentionalSignOut: true,
      }),
      null,
    );
  });

  it('does not mark auth ready on a null INITIAL_SESSION before getSession settles', () => {
    assert.equal(shouldHoldAuthReady({ event: 'INITIAL_SESSION', session: null, getSessionDone: false }), true);
    assert.equal(shouldHoldAuthReady({ event: 'INITIAL_SESSION', session: null, getSessionDone: true }), false);
    assert.equal(shouldHoldAuthReady({ event: 'INITIAL_SESSION', session, getSessionDone: false }), false);
    assert.equal(shouldHoldAuthReady({ event: 'SIGNED_OUT', session: null, getSessionDone: false }), false);
  });

  it('retries refresh on transient gaps, not on a normal cold start', () => {
    assert.equal(shouldRetryAuthRecovery({ event: 'TOKEN_REFRESHED', session: null, previous: session }), true);
    assert.equal(shouldRetryAuthRecovery({ event: 'SIGNED_OUT', session: null, previous: session }), true);
    assert.equal(shouldRetryAuthRecovery({
      event: 'SIGNED_OUT',
      session: null,
      previous: session,
      intentionalSignOut: true,
    }), false);
    assert.equal(shouldRetryAuthRecovery({ event: 'INITIAL_SESSION', session: null, previous: null, search: '' }), false);
    assert.equal(shouldRetryAuthRecovery({
      event: 'INITIAL_SESSION',
      session: null,
      previous: null,
      search: '?checkout=success',
    }), true);
  });

  it('retries refreshSession before giving up', async () => {
    let calls = 0;
    const auth = {
      refreshSession: async () => {
        calls += 1;
        if (calls < 3) return { data: { session: null }, error: new Error('blip') };
        return { data: { session }, error: null };
      },
      getSession: async () => ({ data: { session: null } }),
    };
    const result = await refreshSessionWithRetry(auth, { attempts: 3, delayMs: 1, sleep: async () => {} });
    assert.equal(calls, 3);
    assert.equal(result.session, session);
  });

  it('strips PKCE code without dropping join / checkout query params', () => {
    const next = stripAuthCallbackParams(
      'https://www.addictionpas.org/join?tier=fellow&code=abc&type=magiclink&patron=1',
    );
    assert.equal(next, '/join?tier=fellow&patron=1');
    assert.equal(stripAuthCallbackParams('https://www.addictionpas.org/donate?status=success'), null);
  });
});

describe('source contracts', () => {
  const checkout = readFileSync('api/create-checkout-session.js', 'utf8');
  const donate = readFileSync('api/create-donation-session.js', 'utf8');
  const authCtx = readFileSync('src/lib/AuthContext.jsx', 'utf8');
  const client = readFileSync('src/lib/supabaseClient.js', 'utf8');
  const vercel = readFileSync('vercel.json', 'utf8');

  it('membership and donation Stripe URLs use requestSiteOrigin', () => {
    assert.match(checkout, /requestSiteOrigin\(request\)/);
    assert.match(donate, /requestSiteOrigin\(request\)/);
    assert.match(checkout, /success_url: `\$\{origin\}\/dashboard\?checkout=success`/);
    assert.match(donate, /success_url: `\$\{origin\}\/donate\?status=success`/);
  });

  it('guest donate stays unauthenticated', () => {
    assert.doesNotMatch(donate, /requireUser/);
    assert.match(donate, /PUBLIC endpoint/);
  });

  it('client persists auth and canonicalizes sign-in redirects', () => {
    assert.match(client, /createAuthStorage/);
    assert.match(client, /persistSession: true/);
    assert.match(authCtx, /refreshSessionWithRetry/);
    assert.match(authCtx, /clientSiteOrigin\(\)/);
    assert.match(authCtx, /intentionalSignOutRef/);
  });

  it('apex host redirects to www', () => {
    assert.match(vercel, /addictionpas\.org/);
    assert.match(vercel, /www\.addictionpas\.org\/:path\*/);
  });
});
