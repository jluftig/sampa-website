// Supabase persistSession writes the JWT bundle to Web Storage. On iOS Safari
// / in-app browsers / after a long Stripe hop, localStorage can throw or the
// SDK falls back to memory — the next full load then looks signed-out.
//
// This adapter:
//   1. Prefers localStorage (same as the SDK default).
//   2. Mirrors into first-party cookies (chunked; SameSite=Lax so Stripe
//      return navigations still see them).
//   3. Uses Domain=.addictionpas.org on prod so apex and www share the
//      session instead of splitting it.
//   4. Never throws — a storage failure must not take down createClient.

import { isProductionHost } from './siteUrl.js';

export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 60; // 60 days
export const AUTH_COOKIE_CHUNK_SIZE = 3500;

export function cookieDomainForHost(hostname) {
  return isProductionHost(hostname) ? '.addictionpas.org' : null;
}

function splitChunks(value, size = AUTH_COOKIE_CHUNK_SIZE) {
  if (value.length <= size) return [value];
  const chunks = [];
  for (let i = 0; i < value.length; i += size) {
    chunks.push(value.slice(i, i + size));
  }
  return chunks;
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const name = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

export function readChunkedCookie(key, cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  if (Object.prototype.hasOwnProperty.call(cookies, key)) return cookies[key];
  const pieces = [];
  for (let i = 0; ; i += 1) {
    const name = `${key}.${i}`;
    if (!Object.prototype.hasOwnProperty.call(cookies, name)) break;
    pieces.push(cookies[name]);
  }
  return pieces.length ? pieces.join('') : null;
}

export function cookieWritePlan(key, value, { hostname, secure, maxAge = AUTH_COOKIE_MAX_AGE_SEC } = {}) {
  const domain = hostname ? cookieDomainForHost(hostname) : null;
  const attrs = ['Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (secure) attrs.push('Secure');
  if (domain) attrs.push(`Domain=${domain}`);
  const suffix = attrs.join('; ');

  const writes = [];
  if (value == null) {
    writes.push(`${key}=; Path=/; SameSite=Lax; Max-Age=0`);
    if (domain) writes.push(`${key}=; Path=/; SameSite=Lax; Max-Age=0; Domain=${domain}`);
    for (let i = 0; i < 8; i += 1) {
      writes.push(`${key}.${i}=; Path=/; SameSite=Lax; Max-Age=0`);
      if (domain) writes.push(`${key}.${i}=; Path=/; SameSite=Lax; Max-Age=0; Domain=${domain}`);
    }
    return writes;
  }

  const chunks = splitChunks(value);
  if (chunks.length === 1) {
    writes.push(`${key}=${encodeURIComponent(chunks[0])}; ${suffix}`);
    for (let i = 0; i < 8; i += 1) {
      writes.push(`${key}.${i}=; Path=/; SameSite=Lax; Max-Age=0${domain ? `; Domain=${domain}` : ''}`);
    }
    return writes;
  }

  writes.push(`${key}=; Path=/; SameSite=Lax; Max-Age=0${domain ? `; Domain=${domain}` : ''}`);
  chunks.forEach((chunk, i) => {
    writes.push(`${key}.${i}=${encodeURIComponent(chunk)}; ${suffix}`);
  });
  for (let i = chunks.length; i < 8; i += 1) {
    writes.push(`${key}.${i}=; Path=/; SameSite=Lax; Max-Age=0${domain ? `; Domain=${domain}` : ''}`);
  }
  return writes;
}

export function createAuthStorage(deps = {}) {
  const memory = new Map();
  const localStorage = deps.localStorage;
  const getCookie = deps.getCookie || (() => {
    try { return globalThis.document?.cookie ?? ''; } catch { return ''; }
  });
  const setCookie = deps.setCookie || ((line) => {
    try { globalThis.document.cookie = line; } catch { /* ignore */ }
  });
  const getLocation = deps.getLocation || (() => {
    try { return globalThis.location; } catch { return null; }
  });

  const writeCookies = (key, value) => {
    const loc = getLocation();
    const hostname = loc?.hostname || '';
    const secure = loc?.protocol === 'https:';
    for (const line of cookieWritePlan(key, value, { hostname, secure })) {
      setCookie(line);
    }
  };

  return {
    getItem(key) {
      try {
        const fromLs = localStorage?.getItem?.(key);
        if (fromLs) return fromLs;
      } catch { /* Safari / quota / private mode */ }
      try {
        const fromCookie = readChunkedCookie(key, getCookie());
        if (fromCookie) {
          try { localStorage?.setItem?.(key, fromCookie); } catch { /* still have cookie */ }
          return fromCookie;
        }
      } catch { /* ignore */ }
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, value);
      try { localStorage?.setItem?.(key, value); } catch { /* cookie + memory still hold it */ }
      writeCookies(key, value);
    },
    removeItem(key) {
      memory.delete(key);
      try { localStorage?.removeItem?.(key); } catch { /* ignore */ }
      writeCookies(key, null);
    },
  };
}
