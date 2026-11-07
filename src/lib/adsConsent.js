import { cookieWritePlan, readChunkedCookie } from './authStorage.js';

export const ADS_CONSENT_COOKIE = 'sampa_ads_consent';
const MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function readAdsConsent(cookieHeader = '') {
  const value = readChunkedCookie(ADS_CONSENT_COOKIE, cookieHeader || '');
  if (value === 'granted') return { choice: 'granted', adStorage: 'granted', optOut: false };
  if (value === 'denied') return { choice: 'denied', adStorage: 'denied', optOut: true };
  return { choice: 'unset', adStorage: 'denied', optOut: false };
}

export function adsConsentCookieLines(choice, { hostname, secure } = {}) {
  const value = choice === 'granted' ? 'granted' : 'denied';
  return cookieWritePlan(ADS_CONSENT_COOKIE, value, { hostname, secure, maxAge: MAX_AGE_SEC });
}

export function consentAllowsAds(consent) {
  return consent?.optOut !== true && consent?.adStorage === 'granted' && consent?.choice === 'granted';
}
