import { supabaseAdmin, json } from './_lib/clients.js';

// POST → push "new article" notifications to opted-in mobile devices via the
// Expo Push API. Two callers, both authenticated by a shared secret header
// (x-push-secret === PUSH_WEBHOOK_SECRET env var — NOT a user JWT):
//
//   1. Supabase Database Webhook on public.posts (INSERT/UPDATE) — fires on
//      every write; we act only when a post BECOMES published (insert as
//      published, or update crossing into published), so edits to an already-
//      published post never re-notify.
//   2. Manual: { "slug": "<post-slug>" } — re-send for a published post
//      (useful for testing; use sparingly, it notifies every opted-in device).
//
// Design notes: reads tokens with the service role (RLS bypass) joined to
// profiles.push_opt_in; chunks of 100 per Expo API rules; tokens Expo reports
// as DeviceNotRegistered are deleted so the table self-heals.
export async function POST(request) {
  try {
    const secret = process.env.PUSH_WEBHOOK_SECRET;
    if (!secret) return json({ error: 'Push not configured' }, 503);
    if (request.headers.get('x-push-secret') !== secret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const payload = await request.json().catch(() => null);
    if (!payload) return json({ error: 'Bad request' }, 400);

    const admin = supabaseAdmin();

    // Resolve the post that should trigger a notification.
    let post = null;
    if (payload.slug) {
      const { data } = await admin
        .from('posts')
        .select('id, title, slug, excerpt, status')
        .eq('slug', payload.slug)
        .eq('status', 'published')
        .maybeSingle();
      post = data;
      if (!post) return json({ error: 'No published post with that slug' }, 404);
    } else if (payload.record) {
      const record = payload.record;
      const was = payload.old_record?.status ?? null;
      const becamePublished = record.status === 'published' && was !== 'published';
      if (!becamePublished) return json({ ok: true, skipped: 'not newly published' });
      post = record;
    } else {
      return json({ error: 'Expected a Supabase webhook payload or { slug }' }, 400);
    }

    // Opted-in device tokens (service role sees all rows).
    const { data: rows, error: tokensErr } = await admin
      .from('device_tokens')
      .select('expo_push_token, user_id, profiles!inner(push_opt_in)')
      .eq('profiles.push_opt_in', true);
    if (tokensErr) throw tokensErr;

    const tokens = [...new Set((rows || []).map((r) => r.expo_push_token))];
    if (!tokens.length) return json({ ok: true, sent: 0 });

    // Expo Push API: max 100 messages per request.
    const messages = tokens.map((to) => ({
      to,
      title: 'New from SAMPA',
      body: post.title,
      data: { slug: post.slug },
      sound: 'default',
    }));

    const dead = [];
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      const body = await res.json().catch(() => null);
      const tickets = body?.data || [];
      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') sent += 1;
        else if (ticket.details?.error === 'DeviceNotRegistered') {
          dead.push(chunk[idx].to);
        }
      });
    }

    // Self-heal: drop tokens for uninstalled/expired devices.
    if (dead.length) {
      await admin.from('device_tokens').delete().in('expo_push_token', dead);
    }

    return json({ ok: true, sent, pruned: dead.length });
  } catch (err) {
    console.error('send-push:', err);
    return json({ error: 'Push send failed' }, 500);
  }
}
