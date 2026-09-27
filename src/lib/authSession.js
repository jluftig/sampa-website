// Session-event policy for AuthContext. Supabase emits TOKEN_REFRESHED /
// SIGNED_OUT with a null session when a background refresh fails (common on
// mobile radio blips and after the tab was frozen on Stripe Checkout).
// Treat those as a recoverable gap: retry refresh before signing the user out.

const KEEP_ON_NULL = new Set(['TOKEN_REFRESHED', 'USER_UPDATED']);

export function isCheckoutReturnSearch(search = '') {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  return params.get('checkout') === 'success' || params.get('status') === 'success';
}

export function isAuthCallbackSearch(search = '') {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  return params.has('code') || params.has('token_hash') || params.get('type') === 'magiclink';
}

// Don't treat a null INITIAL_SESSION as signed-out until getSession() has
// also settled — the listener can fire first and bounce RequireAuth to /login.
export function shouldHoldAuthReady({ event, session, getSessionDone } = {}) {
  return event === 'INITIAL_SESSION' && !session && !getSessionDone;
}

export function shouldRetryAuthRecovery({
  event,
  session,
  previous,
  intentionalSignOut,
  search = '',
} = {}) {
  if (intentionalSignOut) return false;
  if (session) return false;
  // Only retry SIGNED_OUT when we still had a session to recover. A second
  // SIGNED_OUT after a held-session clear (previous already null) is what
  // re-hydrated a dead cookie and bounced /editor/members ↔ /login.
  if (event === 'SIGNED_OUT') return !!previous;
  if (KEEP_ON_NULL.has(event)) return true;
  if (event === 'INITIAL_SESSION') {
    if (previous) return false;
    return isCheckoutReturnSearch(search) || isAuthCallbackSearch(search);
  }
  return false;
}

export function nextSessionFromAuthEvent({ event, incoming, previous, intentionalSignOut } = {}) {
  if (intentionalSignOut) return incoming ?? null;
  if (incoming) return incoming;
  if (event === 'SIGNED_IN') return incoming ?? previous ?? null;
  if (KEEP_ON_NULL.has(event) && previous) return previous;
  if (event === 'SIGNED_OUT' && previous) return previous; // hold until retry finishes
  if (event === 'INITIAL_SESSION' && previous) return previous;
  return incoming ?? null;
}

const ACCESS_TOKEN_SKEW_MS = 15_000;

function base64UrlDecode(part) {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const raw = (typeof atob === 'function' ? atob : (s) => Buffer.from(s, 'base64').toString('binary'))(padded + pad);
  return raw;
}

export function sessionExpiresAtSec(session) {
  if (typeof session?.expires_at === 'number' && Number.isFinite(session.expires_at)) {
    return session.expires_at;
  }
  const token = session?.access_token;
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// True when the access token is past exp (with a small skew). A held React
// session after T46 SIGNED_OUT / TOKEN_REFRESHED can still have user.email
// while this is true — do not treat that as signed-in.
export function isAccessTokenExpired(session, nowMs = Date.now(), skewMs = ACCESS_TOKEN_SKEW_MS) {
  const exp = sessionExpiresAtSec(session);
  if (exp == null) return false;
  return exp * 1000 <= nowMs + skewMs;
}

export function isAuthFailureMessage(message) {
  if (!message) return false;
  const m = String(message).toLowerCase();
  return /jwt|expired|invalid token|not authenticated|unauthorized|401/.test(m);
}

// A session is usable for Member Login / membership UI only when we have a
// live access token AND the matching profiles row. user.email from a JWT
// (or a held session) is not enough — that is how Josh saw "signed in as
// luftig@gmail.com" with no membership until Command-R.
export function isSessionUsable(session, profile, nowMs = Date.now()) {
  if (!session?.user) return false;
  if (isAccessTokenExpired(session, nowMs)) return false;
  return !!profile;
}

// After a profile fetch comes back empty, decide whether this is a dead
// held/cookie session (clear + send to /login) vs a real missing row.
export function shouldClearHeldSession({
  session,
  liveSession,
  profile,
  profileError,
  nowMs = Date.now(),
} = {}) {
  if (profile) return false;
  if (!session?.user) return false;
  if (isAccessTokenExpired(session, nowMs)) return true;
  if (isAuthFailureMessage(profileError)) return true;
  if (!liveSession) return true;
  if (isAccessTokenExpired(liveSession, nowMs)) return true;
  return false;
}

function usableSession(session, nowMs) {
  if (!session) return null;
  return isAccessTokenExpired(session, nowMs) ? null : session;
}

export async function refreshSessionWithRetry(auth, { attempts = 3, delayMs = 250, sleep = defaultSleep, nowMs = Date.now() } = {}) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const { data, error } = await auth.refreshSession();
      const next = usableSession(data?.session, nowMs);
      if (next) return { session: next, error: null };
      lastError = error || lastError;
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) await sleep(delayMs * 2 ** i);
  }
  try {
    const { data } = await auth.getSession();
    const next = usableSession(data?.session, nowMs);
    if (next) return { session: next, error: null };
    if (data?.session) lastError = lastError || new Error('session expired');
  } catch (err) {
    lastError = lastError || err;
  }
  return { session: null, error: lastError };
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const AUTH_SEARCH_KEYS = ['code', 'token', 'token_hash', 'error', 'error_description', 'error_code'];

export function stripAuthCallbackParams(href) {
  const url = new URL(href, 'https://www.addictionpas.org');
  let changed = false;
  const hadCode = url.searchParams.has('code') || url.searchParams.has('token_hash');
  for (const key of AUTH_SEARCH_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (hadCode && (url.searchParams.get('type') === 'magiclink' || url.searchParams.get('type') === 'signup' || url.searchParams.get('type') === 'recovery' || url.searchParams.get('type') === 'email')) {
    url.searchParams.delete('type');
    changed = true;
  }
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hash.includes('access_token') || hash.includes('refresh_token')) {
    url.hash = '';
    changed = true;
  }
  if (!changed) return null;
  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
}
