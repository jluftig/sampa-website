import { json, requireUser, supabaseAdmin } from './clients.js';
import { resolveEmailLists, shapeEmailPreferences } from '../../src/lib/emailLists.js';

const BREVO_BASE = 'https://api.brevo.com/v3';

function prefsJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

function apiKeyFrom(env) {
  return env.BREVO_API_KEY || env.SENDINBLUE_API_KEY || '';
}

async function brevo(fetchImpl, apiKey, method, path, body) {
  const res = await fetchImpl(`${BREVO_BASE}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

export async function readBrevoContact(fetchImpl, apiKey, email) {
  const res = await brevo(
    fetchImpl,
    apiKey,
    'GET',
    `/contacts/${encodeURIComponent(email)}`,
  );
  if (res.status === 404) return { listIds: [], emailBlacklisted: false };
  if (!res.ok) {
    const err = new Error('Brevo contact read failed');
    err.status = res.status;
    throw err;
  }
  const listIds = Array.isArray(res.data?.listIds)
    ? res.data.listIds.map(Number).filter((id) => Number.isFinite(id))
    : [];
  return { listIds, emailBlacklisted: Boolean(res.data?.emailBlacklisted) };
}

async function removeFromList(fetchImpl, apiKey, listId, email) {
  const res = await brevo(
    fetchImpl,
    apiKey,
    'POST',
    `/contacts/lists/${listId}/contacts/remove`,
    { emails: [email] },
  );
  if (res.ok || res.status === 404) return;
  const err = new Error('Brevo list remove failed');
  err.status = res.status;
  throw err;
}

async function upsertContact(fetchImpl, apiKey, email, extra) {
  const res = await brevo(fetchImpl, apiKey, 'POST', '/contacts', {
    email,
    updateEnabled: true,
    ...extra,
  });
  if (res.ok) return;
  const err = new Error('Brevo contact update failed');
  err.status = res.status;
  throw err;
}

// A footer unsubscribe sets emailBlacklisted and leaves listIds in place.
// Clearing that flag without unlinking would resume every list they were on.
export async function applyListChange({ fetchImpl, apiKey, email, listId, on, contact }) {
  if (!on) {
    await removeFromList(fetchImpl, apiKey, listId, email);
    return;
  }
  if (contact.emailBlacklisted) {
    for (const id of contact.listIds) {
      await removeFromList(fetchImpl, apiKey, id, email);
    }
    await upsertContact(fetchImpl, apiKey, email, {
      emailBlacklisted: false,
      listIds: [listId],
    });
    return;
  }
  await upsertContact(fetchImpl, apiKey, email, { listIds: [listId] });
}

async function defaultUpdateNewsletterOptIn(userId, on) {
  const admin = supabaseAdmin();
  const { error } = await admin
    .from('profiles')
    .update({ newsletter_opt_in: on })
    .eq('id', userId);
  if (error) throw error;
}

export async function handleEmailPreferences(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const env = deps.env || process.env;
  const fetchImpl = deps.fetchImpl || fetch;
  const updateNewsletterOptIn = deps.updateNewsletterOptIn || defaultUpdateNewsletterOptIn;

  try {
    const user = await requireViewer(request);
    if (!user) return prefsJson({ error: 'Sign in required' }, 401);

    const email = String(user.email || '').trim().toLowerCase();
    if (!email) return prefsJson({ error: 'Your account has no email address.' }, 400);

    const apiKey = apiKeyFrom(env);
    if (!apiKey) return prefsJson({ error: 'Email choices are temporarily unavailable.' }, 503);

    const lists = resolveEmailLists(env);
    const method = (request.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const contact = await readBrevoContact(fetchImpl, apiKey, email);
      return prefsJson(shapeEmailPreferences({ lists, ...contact }));
    }

    if (method !== 'POST') return prefsJson({ error: 'Not found' }, 404);

    const body = await request.json().catch(() => ({}));
    const list = lists.find((item) => item.key === body.key);
    if (!list) return prefsJson({ error: 'Unknown email list.' }, 400);
    if (!list.configured) return prefsJson({ error: 'That email is not available yet.' }, 503);
    if (typeof body.on !== 'boolean') return prefsJson({ error: 'Choose on or off.' }, 400);

    const contact = await readBrevoContact(fetchImpl, apiKey, email);
    if (list.profileFlag === 'newsletter_opt_in' && body.on === false) {
      await updateNewsletterOptIn(user.id, false);
    }
    await applyListChange({
      fetchImpl,
      apiKey,
      email,
      listId: list.listId,
      on: body.on,
      contact,
    });
    if (list.profileFlag === 'newsletter_opt_in' && body.on === true) {
      await updateNewsletterOptIn(user.id, true);
    }
    const next = await readBrevoContact(fetchImpl, apiKey, email);
    return prefsJson(shapeEmailPreferences({ lists, ...next }));
  } catch (err) {
    console.error('email-preferences:', err?.status || err?.message || err);
    const method = (request.method || 'GET').toUpperCase();
    const failure = method === 'GET'
      ? 'Could not load your email choices. Please try again.'
      : 'Could not update your email choices. Please try again.';
    return prefsJson({ error: failure }, 502);
  }
}
