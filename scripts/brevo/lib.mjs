/**
 * Shared Brevo REST helpers for SAMPA campaign scripts.
 * Base: https://api.brevo.com/v3  Auth header: api-key
 */
const BASE = 'https://api.brevo.com/v3';

export function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

export function getApiKey() {
  const key = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!key) {
    die(
      'Missing BREVO_API_KEY (Hermes egg .env). Do not use the Supabase SMTP key.',
    );
  }
  return key;
}

export function senderFromEnv() {
  return {
    name: process.env.BREVO_SENDER_NAME || 'SAMPA',
    email: process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
  };
}

export function replyToFromEnv() {
  return process.env.BREVO_REPLY_TO || process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org';
}

/** Map logical list keys → env var list IDs */
export const LIST_ENV = {
  // v1 product: one catch-all marketing list + Test
  updates: 'BREVO_LIST_UPDATES',
  newsletter: 'BREVO_LIST_UPDATES', // alias
  announcements: 'BREVO_LIST_UPDATES', // legacy alias (pre–catch-all)
  test: 'BREVO_LIST_TEST',
  // Reserved lists exist in Brevo but are not v1 product surfaces:
  // weekly_news / policy / jobs / cme — keep env optional for later
  weekly_news: 'BREVO_LIST_WEEKLY_NEWS',
  policy: 'BREVO_LIST_POLICY',
  jobs: 'BREVO_LIST_JOBS',
  cme: 'BREVO_LIST_CME',
};

export function resolveListIds(keys) {
  const ids = [];
  for (const k of keys) {
    const envName = LIST_ENV[k] || LIST_ENV[k.replace(/-/g, '_')];
    if (!envName) die(`Unknown list key: ${k}. Known: ${Object.keys(LIST_ENV).join(', ')}`);
    const raw = process.env[envName];
    if (!raw) die(`Missing env ${envName} for list key "${k}". Create list in Brevo and set id.`);
    const id = Number(raw);
    if (!Number.isFinite(id)) die(`${envName} must be numeric list id, got: ${raw}`);
    ids.push(id);
  }
  return ids;
}

export async function brevo(method, path, body) {
  const headers = {
    accept: 'application/json',
    'api-key': getApiKey(),
  };
  const init = { method, headers };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const err = new Error(
      `Brevo ${method} ${path} → ${res.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
