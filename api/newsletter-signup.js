import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from './_lib/clients.js';
import { PRODUCTION_ORIGIN, requestSiteOrigin } from './_lib/siteUrl.js';
import { subscriptionLists } from './_lib/subscriptionLists.js';

// POST { email, list? } → Brevo double opt-in for one list.
// POST { email, lists: { daily, weekly, topic } } → manage those three lists.
// list "daily" maps server-side to BREVO_LIST_DAILY_NEWS. Any other list
// value, including a numeric id, stays on SAMPA Updates. The client never
// chooses a Brevo list id.
//
// Vercel env (server): BREVO_API_KEY, BREVO_LIST_UPDATES, BREVO_DOI_TEMPLATE_ID
// Daily form: BREVO_LIST_DAILY_NEWS, optional BREVO_DOI_TEMPLATE_ID_DAILY
// Manage lists: BREVO_LIST_DAILY_NEWS, BREVO_LIST_UPDATES, BREVO_LIST_TOPIC.
// Manage templates: BREVO_DOI_TEMPLATE_ID_DAILY, BREVO_DOI_TEMPLATE_ID,
// BREVO_DOI_TEMPLATE_TOPIC. Topic writes nothing when its template id is unset.
// Manage redirects come from site code, not BREVO_DOI_REDIRECT_URL:
// daily /newsletter-confirmed?list=daily, weekly /newsletter-confirmed?list=weekly,
// topic /newsletter-confirmed?list=topic.
// Removals need a confirmed email link. Token key is SUBSCRIPTION_TOKEN_SECRET
// (or a key derived from BREVO_API_KEY). Optional BREVO_SENDER_NAME / BREVO_SENDER_EMAIL.
// The single-list footer form still honors BREVO_DOI_REDIRECT_URL for weekly.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREVO_BASE = 'https://api.brevo.com/v3';
const DAILY_LIST = 'daily';
const DAILY_MISSING = 'Daily email signup is coming soon. Please check back.';
const UNAVAILABLE = 'Newsletter signup is temporarily unavailable. Please try again later.';
const EMAIL_ERROR = 'Please enter a valid email address.';
const MANAGE_LISTS = 'Choose the lists to update.';
const CHOOSE_ONE = 'Choose at least one newsletter.';
const MANAGE_RATE = 'Please try again in a moment.';
const MANAGE_UNAVAILABLE = 'Subscription updates are temporarily unavailable. Please try again later.';
const MANAGE_FAILED = 'We could not update subscriptions right now. Please try again in a moment.';
const MANAGE_PARTIAL = 'Some choices could not be saved. Please try again in a moment.';
const CONFIRM_INVALID = 'That confirmation link is invalid or has expired. Please start again from Manage subscriptions.';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_MAX = 3;
const emailHits = new Map();
const MANAGE_WINDOW_MS = 10 * 60 * 1000;
const MANAGE_MAX = 8;
const manageHits = new Map();

function updatesTarget(origin) {
  return {
    listId: Number(process.env.BREVO_LIST_UPDATES),
    templateId: Number(process.env.BREVO_DOI_TEMPLATE_ID),
    source: 'public_signup',
    redirectionUrl: process.env.BREVO_DOI_REDIRECT_URL || `${origin}/newsletter-confirmed`,
    missingLog: 'newsletter-signup: missing BREVO_API_KEY, BREVO_LIST_UPDATES, or BREVO_DOI_TEMPLATE_ID',
  };
}

function dailyTarget(origin) {
  const listId = Number(process.env.BREVO_LIST_DAILY_NEWS);
  return {
    listId,
    listMissing: !Number.isFinite(listId) || listId <= 0,
    templateId: Number(process.env.BREVO_DOI_TEMPLATE_ID_DAILY || process.env.BREVO_DOI_TEMPLATE_ID),
    source: 'daily_roundup_signup',
    redirectionUrl: `${origin}/newsletter-confirmed?list=daily`,
    missingLog: 'newsletter-signup: missing BREVO_API_KEY, BREVO_LIST_DAILY_NEWS, or a DOI template id',
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

function positiveId(raw) {
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

function clientIp(request) {
  const forwarded = request.headers?.get?.('x-forwarded-for') || '';
  const first = String(forwarded).split(',')[0].trim();
  return first || 'unknown';
}

function manageRateLimited(ip, now = Date.now()) {
  const fresh = (manageHits.get(ip) || []).filter((stamp) => now - stamp < MANAGE_WINDOW_MS);
  if (fresh.length >= MANAGE_MAX) {
    if (fresh.length) manageHits.set(ip, fresh);
    else manageHits.delete(ip);
    return true;
  }
  fresh.push(now);
  manageHits.set(ip, fresh);
  return false;
}

function listChoices(lists) {
  const choices = {};
  for (const entry of subscriptionLists) {
    const value = lists[entry.key];
    if (typeof value !== 'boolean') return null;
    choices[entry.key] = value;
  }
  return choices;
}

async function postBrevo(apiKey, url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
}

async function readBody(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { text, data };
}

async function doiAccepted(res) {
  if (res.status === 201 || res.status === 204) return true;
  const { text, data } = await readBody(res);
  const blob = `${text}\n${JSON.stringify(data || {})}`;
  return res.status === 400 && (/duplicate|already|exist/i.test(blob) || data?.code === 'duplicate_parameter');
}

async function removeAccepted(res) {
  if (res.status === 200 || res.status === 201 || res.status === 204 || res.status === 404) return true;
  if (res.status !== 400) return false;
  const { text, data } = await readBody(res);
  const blob = `${text}\n${JSON.stringify(data || {})}`;
  // Only "the address is not on that list / not a contact" counts as removed.
  // A generic 400 (for example invalid_parameter for a bad payload) is a failure.
  return /already removed|does not exist|not found|not (?:in|part of|on) (?:the |this )?list/i.test(blob);
}

function confirmedUrl(origin, entry) {
  const base = `${origin}/newsletter-confirmed`;
  return entry.redirectQuery ? `${base}?${entry.redirectQuery}` : base;
}

// ---- Removal confirmation (ownership check) ---------------------------
// A removal never happens on the first request. The address gets an email
// with a signed, expiring link; only the click on that link removes lists.
// The token is stateless (HMAC), so no new storage or api/ function is needed.

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function tokenSecret() {
  const explicit = process.env.SUBSCRIPTION_TOKEN_SECRET;
  if (explicit) return explicit;
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) return null;
  // Derived key: the Brevo key itself is never exposed by the token.
  return createHmac('sha256', apiKey).update('sampa-subscription-removal-v1').digest('hex');
}

function signRemoval(email, keys, now = Date.now()) {
  const secret = tokenSecret();
  if (!secret) return null;
  const payload = b64url(JSON.stringify({ e: email, l: keys, x: now + TOKEN_TTL_MS }));
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyRemoval(token, now = Date.now()) {
  const secret = tokenSecret();
  if (!secret || typeof token !== 'string' || token.length > 2000) return null;
  const [payload, sig, extra] = token.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!data || typeof data.e !== 'string' || !Array.isArray(data.l) || !(data.x > now)) return null;
  const keys = data.l.filter((key) => subscriptionLists.some((entry) => entry.key === key));
  const email = normalizeEmail(data.e);
  if (!email || !keys.length) return null;
  return { email, keys };
}

function emailThrottled(email, now = Date.now()) {
  const fresh = (emailHits.get(email) || []).filter((stamp) => now - stamp < EMAIL_WINDOW_MS);
  if (fresh.length >= EMAIL_MAX) {
    emailHits.set(email, fresh);
    return true;
  }
  fresh.push(now);
  emailHits.set(email, fresh);
  return false;
}

async function onAnyList(apiKey, email, listIds) {
  // Private lookup: used only to avoid emailing people who are not on a list.
  // The response to the caller is identical either way.
  try {
    const res = await fetch(`${BREVO_BASE}/contacts/${encodeURIComponent(email)}`, {
      headers: { accept: 'application/json', 'api-key': apiKey },
    });
    if (res.status === 404) return false;
    if (!res.ok) return true; // unknown: err toward sending the (harmless) confirmation
    const { data } = await readBody(res);
    const ids = Array.isArray(data?.listIds) ? data.listIds.map(Number) : [];
    return listIds.some((id) => ids.includes(id));
  } catch {
    return true;
  }
}

// The emailed link carries a removal token, so it must never point at a host
// taken blindly from request headers. Only production, Vercel previews, and
// localhost are trusted; anything else falls back to production.
function removalOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (url.origin === PRODUCTION_ORIGIN) return PRODUCTION_ORIGIN;
    if (url.protocol === 'https:' && host.endsWith('.vercel.app')) return url.origin;
    if (host === 'localhost' || host === '127.0.0.1') return url.origin;
  } catch {
    // fall through
  }
  return PRODUCTION_ORIGIN;
}

async function sendRemovalEmail(apiKey, email, entries, origin) {
  const token = signRemoval(email, entries.map((entry) => entry.key));
  if (!token) return false;
  const link = `${removalOrigin(origin)}/subscriptions?confirm=${encodeURIComponent(token)}`;
  const names = entries.map((entry) => entry.label);
  const items = names.map((name) => `<li>${name}</li>`).join('');
  const res = await postBrevo(apiKey, `${BREVO_BASE}/smtp/email`, {
    sender: {
      name: process.env.BREVO_SENDER_NAME || 'SAMPA',
      email: process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
    },
    to: [{ email }],
    subject: 'Confirm your SAMPA email changes',
    htmlContent:
      `<p>Someone asked to stop these SAMPA emails for this address:</p><ul>${items}</ul>` +
      `<p><a href="${link}">Confirm and stop these emails</a></p>` +
      '<p>This link expires in 24 hours. If you did not ask for this, ignore this email and nothing changes.</p>',
    textContent:
      `Someone asked to stop these SAMPA emails for this address: ${names.join(', ')}.\n\n` +
      `Confirm: ${link}\n\nThis link expires in 24 hours. If you did not ask for this, ignore this email and nothing changes.`,
  });
  return res.ok;
}

function outcome(results) {
  const failed = results.filter((r) => r.status === 'failed').map((r) => r.key);
  const notOpen = results.filter((r) => r.status === 'not_open').map((r) => r.key);
  const handled = results.filter((r) => r.status === 'ok').map((r) => r.key);
  return { failed, notOpen, handled };
}

async function confirmRemoval(request, body) {
  if (manageRateLimited(`confirm:${clientIp(request)}`)) {
    return json({ error: MANAGE_RATE }, 429);
  }
  const verified = verifyRemoval(body.confirm);
  if (!verified) return json({ error: CONFIRM_INVALID }, 400);
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) {
    console.error('newsletter-signup: missing BREVO_API_KEY');
    return json({ error: MANAGE_UNAVAILABLE }, 503);
  }
  const results = [];
  for (const entry of subscriptionLists.filter((item) => verified.keys.includes(item.key))) {
    const listId = positiveId(process.env[entry.listEnv]);
    if (!listId) {
      console.error(`newsletter-signup: missing ${entry.listEnv}`);
      results.push({ key: entry.key, status: 'failed' });
      continue;
    }
    try {
      const res = await postBrevo(apiKey, `${BREVO_BASE}/contacts/lists/${listId}/contacts/remove`, {
        emails: [verified.email],
      });
      if (await removeAccepted(res)) results.push({ key: entry.key, status: 'ok' });
      else {
        console.error('newsletter-signup: confirm remove failed', entry.key, res.status);
        results.push({ key: entry.key, status: 'failed' });
      }
    } catch (err) {
      console.error('newsletter-signup: confirm remove failed', entry.key, err?.message || err);
      results.push({ key: entry.key, status: 'failed' });
    }
  }
  const { failed, handled } = outcome(results);
  if (failed.length) {
    return json({ ok: false, error: MANAGE_PARTIAL, removed: handled, failed }, 502);
  }
  return json({ ok: true, removed: handled });
}

async function manageSubscriptions(request, body) {
  if (body.company || body.website) {
    return json({ ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) return json({ error: EMAIL_ERROR }, 400);

  const choices = listChoices(body.lists);
  if (!choices) return json({ error: MANAGE_LISTS }, 400);
  if (!Object.values(choices).some(Boolean)) return json({ error: CHOOSE_ONE }, 400);

  if (manageRateLimited(clientIp(request))) {
    return json({ error: MANAGE_RATE }, 429);
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) {
    console.error('newsletter-signup: missing BREVO_API_KEY');
    return json({ error: MANAGE_UNAVAILABLE }, 503);
  }

  const resolved = subscriptionLists.map((entry) => ({
    ...entry,
    listId: positiveId(process.env[entry.listEnv]),
    templateId: positiveId(process.env[entry.templateEnv]),
  }));
  const missingLists = resolved.filter((entry) => !entry.listId).map((entry) => entry.listEnv);
  if (missingLists.length) {
    console.error(`newsletter-signup: missing ${missingLists.join(', ')}`);
    return json({ error: MANAGE_UNAVAILABLE }, 503);
  }

  const missingTemplate = resolved.find((entry) => (
    choices[entry.key] && !entry.templateOptional && !entry.templateId
  ));
  if (missingTemplate) {
    console.error(`newsletter-signup: missing ${missingTemplate.templateEnv}`);
    return json({ error: MANAGE_UNAVAILABLE }, 503);
  }

  const origin = requestSiteOrigin(request);
  const results = [];

  // 1) Checked lists: Brevo double opt-in. Each list is attempted on its own.
  for (const entry of resolved.filter((item) => choices[item.key])) {
    if (!entry.templateId) {
      console.error(
        `newsletter-signup: ${entry.templateEnv} is unset; no contact was written and no double opt-in email was sent`,
      );
      results.push({ key: entry.key, status: 'not_open' });
      continue;
    }
    try {
      const res = await postBrevo(apiKey, `${BREVO_BASE}/contacts/doubleOptinConfirmation`, {
        email,
        includeListIds: [entry.listId],
        templateId: entry.templateId,
        redirectionUrl: confirmedUrl(origin, entry),
        attributes: { SOURCE: entry.source },
      });
      if (await doiAccepted(res)) results.push({ key: entry.key, status: 'ok' });
      else {
        console.error('newsletter-signup: manage DOI failed', entry.key, res.status);
        results.push({ key: entry.key, status: 'failed' });
      }
    } catch (err) {
      console.error('newsletter-signup: manage DOI failed', entry.key, err?.message || err);
      results.push({ key: entry.key, status: 'failed' });
    }
  }

  // 2) Unchecked lists: never removed here. One confirmation email to the
  // address; removal happens only when its link is confirmed.
  const unchecked = resolved.filter((item) => !choices[item.key]);
  if (unchecked.length) {
    try {
      if (emailThrottled(email)) {
        // Same answer as a sent email. Nothing is revealed.
        unchecked.forEach((entry) => results.push({ key: entry.key, status: 'ok' }));
      } else if (!tokenSecret()) {
        unchecked.forEach((entry) => results.push({ key: entry.key, status: 'failed' }));
      } else if (!(await onAnyList(apiKey, email, unchecked.map((entry) => entry.listId)))) {
        unchecked.forEach((entry) => results.push({ key: entry.key, status: 'ok' }));
      } else {
        const sent = await sendRemovalEmail(apiKey, email, unchecked, origin);
        if (!sent) console.error('newsletter-signup: removal confirmation email failed');
        unchecked.forEach((entry) => results.push({ key: entry.key, status: sent ? 'ok' : 'failed' }));
      }
    } catch (err) {
      console.error('newsletter-signup: removal confirmation failed', err?.message || err);
      unchecked.forEach((entry) => results.push({ key: entry.key, status: 'failed' }));
    }
  }

  const { failed, notOpen } = outcome(results);
  const sentDoi = results.some((r) => r.status === 'ok' && choices[r.key]);
  if (failed.length) {
    return json({ ok: false, error: MANAGE_PARTIAL, failed, notOpen, sentDoi }, 502);
  }
  return json({ ok: true, notOpen, sentDoi });
}

async function signup(request, body) {
  // Honeypot — bots fill hidden fields; humans leave this empty.
  if (body.company || body.website) {
    return json({ ok: true, pending: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) return json({ error: EMAIL_ERROR }, 400);

  const origin = requestSiteOrigin(request);
  const target = body.list === DAILY_LIST ? dailyTarget(origin) : updatesTarget(origin);
  if (target.listMissing) {
    return json({ error: DAILY_MISSING }, 503);
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const { listId, templateId } = target;
  if (
    !apiKey ||
    !Number.isFinite(listId) ||
    listId <= 0 ||
    !Number.isFinite(templateId) ||
    templateId <= 0
  ) {
    console.error(target.missingLog);
    return json({ error: UNAVAILABLE }, 503);
  }

  const res = await postBrevo(apiKey, `${BREVO_BASE}/contacts/doubleOptinConfirmation`, {
    email,
    includeListIds: [listId],
    templateId,
    redirectionUrl: target.redirectionUrl,
    attributes: {
      SOURCE: target.source,
    },
  });

  // 201 created / 204 updated — both mean DOI email was (re)sent.
  if (res.status === 201 || res.status === 204) {
    return json({ ok: true, pending: true });
  }

  const { data } = await readBody(res);
  console.error('newsletter-signup: Brevo error', res.status, data);

  // Do not leak list membership — same UX as a fresh DOI send.
  const blob = JSON.stringify(data || {});
  if (
    res.status === 400 &&
    (/duplicate|already|exist/i.test(blob) || data?.code === 'duplicate_parameter')
  ) {
    return json({ ok: true, pending: true });
  }

  return json(
    { error: 'We could not start signup right now. Please try again in a moment.' },
    502,
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.confirm === 'string') return await confirmRemoval(request, body);
    if (isPlainObject(body.lists)) return await manageSubscriptions(request, body);
    return await signup(request, body);
  } catch (err) {
    console.error('newsletter-signup:', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
