// Canonical public origin for auth redirects, Stripe return URLs, and
// session cookies. Apex and www are different browser origins — a session
// stored on one is invisible on the other. Production always uses www.

export const PRODUCTION_HOST = 'www.addictionpas.org';
export const PRODUCTION_ORIGIN = `https://${PRODUCTION_HOST}`;
export const APEX_HOST = 'addictionpas.org';

export function isProductionHost(hostname) {
  return hostname === PRODUCTION_HOST || hostname === APEX_HOST;
}

export function canonicalOrigin(raw) {
  if (raw == null || raw === '') return PRODUCTION_ORIGIN;
  try {
    const url = new URL(String(raw));
    if (isProductionHost(url.hostname)) return PRODUCTION_ORIGIN;
    return url.origin;
  } catch {
    const trimmed = String(raw).trim().replace(/\/$/, '');
    if (trimmed === `https://${APEX_HOST}` || trimmed === `http://${APEX_HOST}`) {
      return PRODUCTION_ORIGIN;
    }
    return trimmed || PRODUCTION_ORIGIN;
  }
}

// Browser: map apex → www so OAuth / magic-link redirects share storage.
export function clientSiteOrigin(locationLike = globalThis.location) {
  const origin = locationLike?.origin;
  return origin ? canonicalOrigin(origin) : PRODUCTION_ORIGIN;
}

// Vercel/request: prefer forwarded host (the public Host) over request.url,
// which can be the deployment hostname rather than www.
export function requestSiteOrigin(request) {
  const forwardedHost = firstHeader(request, 'x-forwarded-host');
  const host = forwardedHost || firstHeader(request, 'host');
  const proto = firstHeader(request, 'x-forwarded-proto') || 'https';
  if (host) return canonicalOrigin(`${proto}://${host}`);
  try {
    return canonicalOrigin(new URL(request.url).origin);
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

function firstHeader(request, name) {
  const raw = request?.headers?.get?.(name);
  if (!raw) return '';
  return raw.split(',')[0].trim();
}

export function apexRedirectUrl(locationLike = globalThis.location) {
  if (!locationLike || locationLike.hostname !== APEX_HOST) return null;
  const next = new URL(locationLike.href);
  next.hostname = PRODUCTION_HOST;
  next.protocol = 'https:';
  return next.toString();
}
