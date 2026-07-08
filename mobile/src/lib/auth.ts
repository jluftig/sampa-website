// Native sign-in helpers for Supabase auth on Expo.
//
// The web app authenticates by redirecting through Supabase to a same-origin URL
// (window.location). Native has no browser origin, so we:
//   - Google / magic link: open an in-app browser (expo-web-browser) and hand the
//     returned deep-link URL to `createSessionFromUrl`, which finishes the session.
//   - Sign in with Apple: fully native (no browser) via an identity token exchanged
//     with Supabase — required by Apple once Google login is offered (App Store 4.8).
// The Stripe<->Supabase link is by user id, never email, so Apple "Hide My Email"
// relays are harmless (per the web repo's CLAUDE.md).

import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabaseClient';

// The deep link Supabase redirects back to. Must be added to Supabase Auth →
// URL Configuration → Redirect URLs (see docs/mobile-app-setup.md). Computed
// lazily (not at module load) so Expo's Node-based web prerender doesn't evaluate
// browser-only APIs during static export.
let cachedRedirectTo: string | null = null;
export function getRedirectTo(): string {
  if (cachedRedirectTo == null) {
    // Lets the in-app browser hand control back to the app after auth (web/native).
    WebBrowser.maybeCompleteAuthSession();
    cachedRedirectTo = makeRedirectUri({ scheme: 'sampa', path: 'auth-callback' });
  }
  return cachedRedirectTo;
}

// Parse both `?query` and `#fragment` params from a redirect URL (PKCE returns a
// `code` in the query; the implicit fallback returns tokens in the fragment).
function parseUrlParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const grab = (s: string | undefined) => {
    if (!s) return;
    for (const pair of s.split('&')) {
      const [k, v] = pair.split('=');
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  };
  const q = url.indexOf('?');
  const h = url.indexOf('#');
  if (q >= 0) grab(url.slice(q + 1, h >= 0 ? h : undefined));
  if (h >= 0) grab(url.slice(h + 1));
  return out;
}

/**
 * Turn a redirect/deep-link URL into an authenticated Supabase session.
 * Returns the session, or null if the URL carried no auth payload.
 */
export async function createSessionFromUrl(url: string) {
  const params = parseUrlParams(url);
  if (params.error) {
    throw new Error(params.error_description || params.error);
  }
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }
  return null;
}

/** Google OAuth via an in-app browser session. Resolves once signed in (or null if dismissed). */
export async function signInWithGoogle() {
  const redirectTo = getRedirectTo();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    return createSessionFromUrl(result.url);
  }
  return null; // user dismissed / cancelled
}

/** Send a passwordless email link. Tapping it deep-links back into the app (handled in AuthContext). */
export async function sendEmailLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: getRedirectTo() },
  });
  if (error) throw error;
}

/** Whether Sign in with Apple is offered on this device (iOS 13+). */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Native Sign in with Apple → Supabase session. Throws AppleAuthentication ERR_REQUEST_CANCELED if dismissed. */
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only provides the name on the FIRST authorization. If we got one and the
  // profile has none yet, backfill it (best-effort; ignore failures).
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName && data.user) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .maybeSingle();
      if (prof && !prof.full_name) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
      }
    } catch {
      // non-fatal
    }
  }
  return data.session;
}
