/**
 * Brevo transactional email: member welcome / renewal + donation thanks.
 * LIVE by default when BREVO_API_KEY is set.
 * Kill-switch only: BREVO_MEMBER_EMAILS_ENABLED=false (or BREVO_TRANSACTIONAL_EMAILS_ENABLED=false).
 * Uses POST /smtp/email (transactional), not marketing campaigns.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://api.brevo.com/v3';
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * On unless explicitly disabled. Still requires BREVO_API_KEY at send time.
 */
export function memberEmailsEnabled() {
  const keys = [
    process.env.BREVO_MEMBER_EMAILS_ENABLED,
    process.env.BREVO_TRANSACTIONAL_EMAILS_ENABLED,
  ];
  // If either is explicitly off → kill-switch
  for (const v of keys) {
    if (v == null || v === '') continue;
    const s = String(v).toLowerCase();
    if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
  }
  return true;
}

/** @deprecated use memberEmailsEnabled — same gate */
export const transactionalEmailsEnabled = memberEmailsEnabled;

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

/** Simple {{params.KEY}} replacement for local HTML. */
export function renderTemplate(html, params = {}) {
  let out = html;
  for (const [k, v] of Object.entries(params)) {
    const val = v == null ? '' : String(v);
    out = out.split(`{{params.${k}}}`).join(val);
  }
  out = out.replace(/Hello\s+,/g, 'Hello there,');
  out = out.replace(/Hello\s+<\/p>/g, 'Hello there,</p>');
  return out;
}

/** Format Stripe amount (cents) + currency for display. */
export function formatMoney(amountCents, currency = 'usd') {
  const cents = Number(amountCents);
  if (!Number.isFinite(cents)) return '';
  const cur = (currency || 'usd').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur.length === 3 ? cur : 'USD',
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function splitName(full) {
  const s = (full || '').trim();
  if (!s) return { firstName: '', lastName: '' };
  const parts = s.split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
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
 * Generic transactional send (POST /smtp/email). Not a marketing campaign.
 * From is always SAMPA / info@ — never a personal mailbox.
 *
 * @param {{
 *   to: { email: string, name?: string }[],
 *   cc?: { email: string, name?: string }[],
 *   replyTo?: { email: string, name?: string },
 *   subject: string,
 *   htmlContent: string,
 *   tags?: string[],
 * }} opts
 */
export async function sendSmtpEmail(opts) {
  const to = (opts.to || []).filter((r) => r?.email);
  if (!to.length) throw new Error('sendSmtpEmail: at least one to[] address is required');
  const payload = {
    sender: sender(),
    to,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    tags: opts.tags || [],
  };
  const cc = (opts.cc || []).filter((r) => r?.email);
  if (cc.length) payload.cc = cc;
  if (opts.replyTo?.email) {
    payload.replyTo = {
      email: opts.replyTo.email,
      name: opts.replyTo.name || undefined,
    };
  }
  const data = await brevoPost('/smtp/email', payload);
  return { messageId: data?.messageId || null };
}

/**
 * @param {'welcome'|'renewal'|'donation'} kind
 * @param {{ email: string, firstName?: string, lastName?: string, amountCents?: number, currency?: string, frequency?: string }} to
 * @param {{ force?: boolean }} [opts]
 */
export async function sendMemberLifecycleEmail(kind, to, opts = {}) {
  if (!opts.force && !memberEmailsEnabled()) {
    return {
      skipped: true,
      reason: 'BREVO_MEMBER_EMAILS_ENABLED / BREVO_TRANSACTIONAL_EMAILS_ENABLED is false (kill-switch)',
    };
  }
  if (!to?.email) {
    return { skipped: true, reason: 'no email' };
  }

  const firstName = (to.firstName || '').trim() || 'there';
  const amountStr = formatMoney(to.amountCents, to.currency);
  const freq = (to.frequency || 'once').toLowerCase();
  const isMonthly = freq === 'monthly' || freq === 'month' || freq === 'recurring';

  const templates = {
    welcome: {
      file: 'member-welcome.html',
      subject: 'Welcome to SAMPA — your membership is active',
      tags: ['member-welcome'],
      params: { FIRSTNAME: firstName === 'there' ? 'there' : firstName },
    },
    renewal: {
      file: 'member-renewal.html',
      subject: 'Thank you for renewing your SAMPA membership',
      tags: ['member-renewal'],
      params: { FIRSTNAME: firstName === 'there' ? 'there' : firstName },
    },
    donation: {
      file: 'donation-thanks.html',
      subject: amountStr
        ? `Thank you for your ${amountStr} gift to SAMPA`
        : 'Thank you for your gift to SAMPA',
      tags: ['donation-thanks'],
      params: {
        FIRSTNAME: firstName === 'there' ? 'there' : firstName,
        AMOUNT: amountStr || 'your gift',
        FREQUENCY_LABEL: isMonthly ? 'Monthly recurring gift' : 'One-time gift',
        FREQUENCY_PHRASE: isMonthly ? ' (monthly)' : '',
      },
    },
  };

  const spec = templates[kind];
  if (!spec) throw new Error(`Unknown lifecycle email kind: ${kind}`);

  let html = renderTemplate(loadTemplate(spec.file), spec.params);
  if (firstName === 'there') {
    html = html.replace(/Hello there,/g, 'Hello,');
  }

  const payload = {
    sender: sender(),
    replyTo: {
      email: process.env.BREVO_REPLY_TO || process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
      name: 'SAMPA',
    },
    to: [
      {
        email: to.email,
        name: [to.firstName, to.lastName].filter(Boolean).join(' ') || undefined,
      },
    ],
    subject: spec.subject,
    htmlContent: html,
    tags: spec.tags,
  };

  const data = await brevoPost('/smtp/email', payload);
  return { skipped: false, messageId: data?.messageId || null, kind, to: to.email };
}

/** @deprecated alias — same as sendMemberLifecycleEmail('donation', ...) */
export async function sendDonationThanksEmail(to, opts = {}) {
  return sendMemberLifecycleEmail('donation', to, opts);
}

export function donorFromStripeFields({ email, name, userId } = {}) {
  const { firstName, lastName } = splitName(name);
  return { email: email || null, firstName, lastName, userId: userId || null };
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
