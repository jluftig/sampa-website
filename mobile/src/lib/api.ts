// Call the website's Vercel serverless functions (/api/*) with the signed-in
// user's Supabase JWT — the same contract the web app uses (src/lib/api.js),
// except native needs an absolute base URL. The endpoints verify the JWT
// server-side (api/_lib/clients.js requireUser).

import { supabase } from './supabaseClient';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://www.addictionpas.org').replace(/\/$/, '');

export async function apiPost<T = any>(path: string, body?: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in required.');

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response (e.g. platform error page) — fall through
  }
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload as T;
}
