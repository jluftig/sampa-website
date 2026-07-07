import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Server-side only. STRIPE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY live in
// Vercel server env vars — never in VITE_* vars or client code.

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

// Service-role client: bypasses RLS, and guard_profile_role() lets it through
// (auth.uid() is null server-side), so it can write the membership columns
// that signed-in users cannot.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Resolve the signed-in Supabase user from "Authorization: Bearer <jwt>".
export async function requireUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  return error ? null : data.user;
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
