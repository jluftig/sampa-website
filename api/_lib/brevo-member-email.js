/**
 * Brevo transactional email for member welcome / renewal.
 * Gated by BREVO_MEMBER_EMAILS_ENABLED=true (off by default).
 * Uses POST /smtp/email (transactional), not marketing campaigns.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://api.brevo.com/v3';
const __dirname = dirname(fileURLToPath(import.meta.url));

export function memberEmailsEnabled() {
  const v = (process.env.BREVO_MEMBER_EMAILS_ENABLED || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function apiKey() {
  const key = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set');
  return key;
}

function sender() {
  return {
    name: process.env.BREVO_SENDER_NAME || 'SAMPA',
    email: process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
  };
}

function loadTemplate(name) {
  const path = join(__dirname, 'email-templates', name);
  return readFileSync(path, 'utf8');
}

/** Simple {{params.KEY}} and bare {{params.KEY}} replacement for local HTML. */
export function renderTemplate(html, params = {}) {
  let out = html;
  for (const [k, v] of Object.entries(params)) {
    const val = v == null || v === '' ? '' : String(v);
    out = out.split(`{{params.${k}}}`).join(val);
  }
  // leftover empty firstname → "there"
  out = out.replace(/Hello\s+,/g, 'Hello there,');
  out = out.replace(/Hello\s+<\/p>/g, 'Hello there,</p>');
  return out;
}

async function brevoPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey(),
    },
    body: JSON.stringify(body),
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
  if (!res.ok) {
    const err = new Error(`Brevo POST ${path} → ${res.status}: ${JSON.stringify(data)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * @param {'welcome'|'renewal'} kind
 * @param {{ email: string, firstName?: string, lastName?: string }} to
 * @param {{ force?: boolean }} [opts] force=true bypasses enable gate (CLI test only)
 */
export async function sendMemberLifecycleEmail(kind, to, opts = {}) {
  if (!opts.force && !memberEmailsEnabled()) {
    return { skipped: true, reason: 'BREVO_MEMBER_EMAILS_ENABLED is not true' };
  }
  if (!to?.email) {
    return { skipped: true, reason: 'no email' };
  }

  const firstName = (to.firstName || '').trim() || 'there';
  const templates = {
    welcome: {
      file: 'member-welcome.html',
      subject: 'Welcome to SAMPA — your membership is active',
      tags: ['member-welcome'],
    },
    renewal: {
      file: 'member-renewal.html',
      subject: 'Thank you for renewing your SAMPA membership',
      tags: ['member-renewal'],
    },
  };
  const spec = templates[kind];
  if (!spec) throw new Error(`Unknown member email kind: ${kind}`);

  const html = renderTemplate(loadTemplate(spec.file), {
    FIRSTNAME: firstName === 'there' ? 'there' : firstName,
  });

  // Prefer real name in greeting when we have it
  const htmlFinal =
    firstName === 'there'
      ? html.replace(/Hello there,/g, 'Hello,')
      : html;

  const payload = {
    sender: sender(),
    replyTo: {
      email: process.env.BREVO_REPLY_TO || process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
      name: 'SAMPA',
    },
    to: [{ email: to.email, name: [to.firstName, to.lastName].filter(Boolean).join(' ') || undefined }],
    subject: spec.subject,
    htmlContent: htmlFinal,
    tags: spec.tags,
  };

  const data = await brevoPost('/smtp/email', payload);
  return { skipped: false, messageId: data?.messageId || null, kind, to: to.email };
}

/**
 * Load profile display fields for email after membership write.
 */
export async function profileForEmail(admin, userId) {
  if (!userId) return null;
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('brevo-member-email: profile load failed', error.message);
    return null;
  }
  if (!data) return null;

  let email = data.email || null;
  // Prefer auth email if profile email empty
  if (!email) {
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId);
      email = authData?.user?.email || null;
    } catch (e) {
      console.error('brevo-member-email: auth email lookup failed', e.message);
    }
  }

  let firstName = '';
  let lastName = '';
  if (data.full_name) {
    const parts = String(data.full_name).trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  return { email, firstName, lastName, id: data.id };
}
