// Pure redirect decisions for Login + route guards. Kept free of React so
// scripts/verify-auth-redirect-cycle.mjs can walk the graph and fail on a loop.
//
// Invariant: a stable auth snapshot must reach a terminal page (login form,
// dashboard/editor, or a guard's in-place "not authorized" view). Never
// bounce /editor/members ↔ /login.

import { postAuthPath, safeNext, signedInHomePath } from './memberHome.js';

export { postAuthPath, safeNext, signedInHomePath };

export function parseAppLocation(raw) {
  const value = typeof raw === 'string' ? raw : locationKey(raw);
  const noHash = value.split('#')[0];
  const q = noHash.indexOf('?');
  if (q < 0) return { pathname: noHash || '/', search: '' };
  return { pathname: noHash.slice(0, q) || '/', search: noHash.slice(q) };
}

export function locationKey(location) {
  if (typeof location === 'string') return location || '/';
  return `${location?.pathname || '/'}${location?.search || ''}`;
}

function nextFromSearch(search = '') {
  const q = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(q).get('next');
}

function isGuardedPath(pathname) {
  return pathname === '/dashboard'
    || pathname === '/members'
    || pathname.startsWith('/members/')
    || pathname === '/editor'
    || pathname.startsWith('/editor/');
}

// Guard → /login. Two cases stay on "Checking access…" instead of navigating:
// a half-hydrated session (user still set, profiles row not usable), and a
// session that drops to null after this page already had a user. The second
// case is the privileged-viewer loop: Login honors next=/editor/members, so
// one trip to /login comes straight back. Cold signed-out visits still leave
// immediately. An intentional sign-out leaves immediately.
// How long that null hold lasts. Covers refreshSessionWithRetry (three
// attempts, ~1s of backoff).
export const AUTH_NULL_HOLD_MS = 2000;

export function shouldLeaveForLogin({
  sessionUsable,
  user,
  hadSession = false,
  intentionalSignOut = false,
  holdExpired = false,
} = {}) {
  if (sessionUsable) return false;
  if (user) return false;
  if (intentionalSignOut) return true;
  if (hadSession && !holdExpired) return false;
  return true;
}

export function guardLoginPath({ pathname, search = '', halfSession = false } = {}) {
  if (halfSession) return null;
  const next = safeNext(`${pathname || ''}${search || ''}`);
  if (!next) return '/login';
  return `/login?next=${encodeURIComponent(next)}`;
}

export function loginAuthedDestination({ profile, rawNext } = {}) {
  const dest = postAuthPath(profile, rawNext);
  const path = String(dest || '').split('?')[0];
  if (!dest || path === '/login') return signedInHomePath(profile);
  return dest;
}

export function decideAuthRedirect(location, auth = {}) {
  const { pathname, search } = parseAppLocation(location);
  if (auth.loading) return null;

  if (pathname === '/login') {
    if (!auth.sessionUsable) return null;
    return loginAuthedDestination({
      profile: auth.profile,
      rawNext: nextFromSearch(search),
    });
  }

  if (isGuardedPath(pathname) && !auth.sessionUsable) {
    return guardLoginPath({
      pathname,
      search,
      halfSession: !!auth.halfSession,
    }) || null;
  }

  return null;
}

export function walkAuthRedirects(start, authOrFactory, { maxHops = 12 } = {}) {
  const hops = [];
  let loc = locationKey(start);
  for (let i = 0; i < maxHops; i += 1) {
    if (hops.includes(loc)) {
      return { cycle: true, hops: [...hops, loc], stuckAt: loc };
    }
    hops.push(loc);
    const auth = typeof authOrFactory === 'function' ? authOrFactory(i, loc) : authOrFactory;
    const next = decideAuthRedirect(loc, auth);
    if (!next || next === loc) {
      return { cycle: false, hops, stuckAt: loc };
    }
    loc = next;
  }
  return { cycle: true, hops, stuckAt: loc };
}
