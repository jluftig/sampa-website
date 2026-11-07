import { cookieWritePlan, readChunkedCookie } from './authStorage.js';
import { consentAllowsAds, effectiveAdsConsent, globalPrivacyControlEnabled } from './adsConsent.js';

export const ADS_CLICK_COOKIE = 'sampa_ads_click';
export const ADS_CLICK_MAX_AGE_SEC = 60 * 60 * 24 * 90;
const CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'];
const CLICK_RE = /^[\w-]{1,200}$/;

export function clickIdsFromSearch(search = '') {
  const params = new URLSearchParams(String(search).replace(/^\?/, ''));
  const out = {};
  for (const key of CLICK_KEYS) {
    const value = params.get(key);
    if (value && CLICK_RE.test(value)) out[key] = value;
  }
  return out;
}

export function serializeClickIds(ids) {
  const params = new URLSearchParams();
  for (const key of CLICK_KEYS) {
    if (ids?.[key] && CLICK_RE.test(ids[key])) params.set(key, ids[key]);
  }
  return params.toString();
}

export function parseClickCookie(raw) {
  if (!raw) return {};
  return clickIdsFromSearch(raw);
}

export function mergeClickIds(existing, incoming) {
  const next = {};
  for (const key of CLICK_KEYS) {
    if (existing?.[key] && CLICK_RE.test(existing[key])) next[key] = existing[key];
    if (incoming?.[key] && CLICK_RE.test(incoming[key])) next[key] = incoming[key];
  }
  return next;
}

export function clickCookieWrites(ids, { hostname, secure } = {}) {
  const value = serializeClickIds(ids);
  if (!value) return [];
  return cookieWritePlan(ADS_CLICK_COOKIE, value, {
    hostname,
    secure,
    maxAge: ADS_CLICK_MAX_AGE_SEC,
  });
}

export function readAdsClick(cookieHeader) {
  return parseClickCookie(readChunkedCookie(ADS_CLICK_COOKIE, cookieHeader || ''));
}

function writeLines(lines, deps) {
  const write = deps.writeCookie;
  if (write) {
    for (const line of lines) write(line);
    return;
  }
  if (typeof document !== 'undefined') {
    for (const line of lines) {
      try { document.cookie = line; } catch { /* a blocked cookie must not break the page */ }
    }
  }
}

export function adsClickStorageAllowed({ consent, gpc } = {}) {
  const effective = consent?.gpc === true || consent?.optOut === true
    ? consent
    : effectiveAdsConsent(consent, gpc);
  if (globalPrivacyControlEnabled(gpc) || effective?.gpc === true) return false;
  return consentAllowsAds(effective);
}

export function rememberAdsClickFromLocation(locationLike, deps = {}) {
  const header = deps.cookieHeader || '';
  const allowed = adsClickStorageAllowed({ consent: deps.consent, gpc: deps.gpc });
  const hostname = locationLike?.hostname;
  const secure = locationLike?.protocol === 'https:';
  if (!allowed) {
    const stored = readChunkedCookie(ADS_CLICK_COOKIE, header);
    if (stored == null) return { wrote: false, cleared: false, ids: {} };
    const clears = cookieWritePlan(ADS_CLICK_COOKIE, null, { hostname, secure });
    writeLines(clears, deps);
    return { wrote: false, cleared: true, ids: {} };
  }
  const incoming = clickIdsFromSearch(locationLike?.search || '');
  if (!Object.keys(incoming).length) return { wrote: false, cleared: false, ids: readAdsClick(header) };
  const ids = mergeClickIds(readAdsClick(header), incoming);
  const writes = clickCookieWrites(ids, { hostname, secure });
  writeLines(writes, deps);
  return { wrote: writes.length > 0, cleared: false, ids };
}
