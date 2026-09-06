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
  if (event === 'SIGNED_OUT') return true;
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

export async function refreshSessionWithRetry(auth, { attempts = 3, delayMs = 250, sleep = defaultSleep } = {}) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const { data, error } = await auth.refreshSession();
      if (data?.session) return { session: data.session, error: null };
      lastError = error || lastError;
    } catch (err) {
      lastError = err;
    }
    if (i < attempts - 1) await sleep(delayMs * 2 ** i);
  }
  try {
    const { data } = await auth.getSession();
    if (data?.session) return { session: data.session, error: null };
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
