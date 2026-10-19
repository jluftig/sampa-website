import { json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';
import { subscriptionLists } from './_lib/subscriptionLists.js';

// POST { email, list? } → Brevo double opt-in for one list.
// POST { email, lists: { daily, weekly, topic } } → manage those three lists.
// list "daily" maps server-side to BREVO_LIST_DAILY_NEWS. Any other list
// value, including a numeric id, stays on SAMPA Updates. The client never
// chooses a Brevo list id.
//
// Vercel env (server): BREVO_API_KEY, BREVO_LIST_UPDATES, BREVO_DOI_TEMPLATE_ID
// Daily form: BREVO_LIST_DAILY_NEWS, optional BREVO_DOI_TEMPLATE_ID_DAILY
// Manage: BREVO_LIST_TOPIC, optional BREVO_DOI_TEMPLATE_TOPIC
// Optional: BREVO_DOI_REDIRECT_URL (defaults to /newsletter-confirmed on this origin)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREVO_BASE = 'https://api.brevo.com/v3';
const DAILY_LIST = 'daily';
const DAILY_MISSING = 'Daily email signup is coming soon. Please check back.';
const UNAVAILABLE = 'Newsletter signup is temporarily unavailable. Please try again later.';
const EMAIL_ERROR = 'Please enter a valid email address.';
const MANAGE_LISTS = 'Choose the lists to update.';
const MANAGE_RATE = 'Please try again in a moment.';
const MANAGE_UNAVAILABLE = 'Subscription updates are temporarily unavailable. Please try again later.';
const MANAGE_FAILED = 'We could not update subscriptions right now. Please try again in a moment.';
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
  return /not found|does not exist|invalid/i.test(blob);
}

function confirmedUrl(origin, entry) {
  const base = `${origin}/newsletter-confirmed`;
  return entry.redirectQuery ? `${base}?${entry.redirectQuery}` : base;
}

async function manageSubscriptions(request, body) {
  if (body.company || body.website) {
    return json({ ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) return json({ error: EMAIL_ERROR }, 400);

  const choices = listChoices(body.lists);
  if (!choices) return json({ error: MANAGE_LISTS }, 400);

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

  for (const entry of resolved) {
    if (choices[entry.key] && entry.templateOptional && !entry.templateId) {
      console.warn(
        `TODO: set ${entry.templateEnv}. The Weekly Topic Roundup double opt-in email cannot be sent until that template id is set in Vercel.`,
      );
    }
  }

  const origin = requestSiteOrigin(request);
  try {
    for (const entry of resolved) {
      if (choices[entry.key]) {
        if (!entry.templateId) continue;
        const res = await postBrevo(apiKey, `${BREVO_BASE}/contacts/doubleOptinConfirmation`, {
          email,
          includeListIds: [entry.listId],
          templateId: entry.templateId,
          redirectionUrl: confirmedUrl(origin, entry),
          attributes: { SOURCE: entry.source },
        });
        if (!(await doiAccepted(res))) {
          console.error('newsletter-signup: manage DOI failed', res.status);
          return json({ error: MANAGE_FAILED }, 502);
        }
      } else {
        const res = await postBrevo(
          apiKey,
          `${BREVO_BASE}/contacts/lists/${entry.listId}/contacts/remove`,
          { emails: [email] },
        );
        if (!(await removeAccepted(res))) {
          console.error('newsletter-signup: manage remove failed', res.status);
          return json({ error: MANAGE_FAILED }, 502);
        }
      }
    }
  } catch (err) {
    console.error('newsletter-signup: manage failed', err?.message || err);
    return json({ error: MANAGE_FAILED }, 502);
  }

  return json({ ok: true });
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
    if (isPlainObject(body.lists)) return await manageSubscriptions(request, body);
    return await signup(request, body);
  } catch (err) {
    console.error('newsletter-signup:', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
