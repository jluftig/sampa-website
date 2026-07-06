import { supabase } from './supabaseClient';

// Call one of our Vercel serverless endpoints (/api/*) with the signed-in
// user's Supabase JWT. The endpoints verify the token server-side — the same
// contract a future mobile app will use.
export async function apiPost(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(session?.access_token
        ? { authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
