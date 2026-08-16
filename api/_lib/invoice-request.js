// Parse + validate a public employer/institutional invoice request.
// Amounts and allowed (tier, duration) pairs come from api/_lib/tiers.js —
// never trust the client's price or a free-typed tier name.

import { TIER_DURATIONS, TIER_NAMES, publishedAmount } from './tiers.js';

export const PAYMENT_OPTIONS = ['single', 'auto_renew'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  name: 120,
  credentials: 80,
  email: 254,
  phone: 40,
  employer: 200,
  billingName: 120,
  billingEmail: 254,
  billingPhone: 40,
  street: 200,
  street2: 200,
  city: 100,
  state: 80,
  zip: 20,
  country: 80,
  notes: 2000,
};

function trim(value, max, { preserveNewlines = false } = {}) {
  let s = String(value ?? '');
  if (preserveNewlines) {
    s = s.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  } else {
    s = s.replace(/\s+/g, ' ').trim();
  }
  if (!s) return '';
  return s.slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDuration(raw) {
  if (raw === 'lifetime') return 'lifetime';
  const n = Number(raw);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

export function durationLabel(duration) {
  if (duration === 'lifetime') return 'Lifetime';
  return duration === 1 ? '1 year' : `${duration} years`;
}

export function paymentOptionLabel(option, duration) {
  if (option === 'auto_renew') {
    if (duration === 1) return 'Auto-renew until cancelled (billed each year)';
    return `Auto-renew until cancelled (billed every ${duration} years)`;
  }
  if (duration === 'lifetime') return 'Lifetime (one-time payment)';
  if (duration === 1) return 'Pay for a single year';
  return `Single payment for a ${duration}-year term`;
}

export function parseInvoiceRequest(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Please complete the form and try again.' };
  }

  // Honeypot — bots fill hidden fields; humans leave these empty.
  if (body.company || body.website) {
    return { honeypot: true };
  }

  const name = trim(body.name, LIMITS.name);
  const credentials = trim(body.credentials, LIMITS.credentials);
  const email = trim(body.email, LIMITS.email).toLowerCase();
  const phone = trim(body.phone, LIMITS.phone);
  const employer = trim(body.employer, LIMITS.employer);
  const billingDifferent = body.billingDifferent === true || body.billingDifferent === 'true';
  const billingName = trim(body.billingName, LIMITS.billingName);
  const billingEmail = trim(body.billingEmail, LIMITS.billingEmail).toLowerCase();
  const billingPhone = trim(body.billingPhone, LIMITS.billingPhone);
  const street = trim(body.street, LIMITS.street);
  const street2 = trim(body.street2, LIMITS.street2);
  const city = trim(body.city, LIMITS.city);
  const state = trim(body.state, LIMITS.state);
  const zip = trim(body.zip, LIMITS.zip);
  const country = trim(body.country, LIMITS.country) || 'United States';
  const notes = trim(body.notes, LIMITS.notes, { preserveNewlines: true });
  const tier = trim(body.tier, 32).toLowerCase();
  const duration = parseDuration(body.duration);
  const paymentOption = trim(body.paymentOption, 32);

  if (!name) return { error: 'Please enter your name.' };
  if (!email || !EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' };
  if (!employer) return { error: 'Please enter your employer or institution.' };
  if (!street || !city || !state || !zip) {
    return { error: 'Please enter the billing address (street, city, state, and ZIP).' };
  }
  if (!TIER_DURATIONS[tier]) return { error: 'Please choose a membership level.' };
  if (duration == null || !TIER_DURATIONS[tier].includes(duration)) {
    return { error: 'Please choose a term that is available for that membership level.' };
  }
  if (!PAYMENT_OPTIONS.includes(paymentOption)) {
    return { error: 'Please choose how the invoice should be written: a single payment, or auto-renew until cancelled.' };
  }
  if (duration === 'lifetime' && paymentOption !== 'single') {
    return { error: 'Lifetime membership is a one-time payment, not an auto-renewing term.' };
  }
  if (billingDifferent) {
    if (!billingName) return { error: 'Please enter the billing contact\'s name.' };
    if (!billingEmail || !EMAIL_RE.test(billingEmail)) {
      return { error: 'Please enter a valid billing-contact email.' };
    }
  }

  const amount = publishedAmount(tier, duration);
  const tierName = TIER_NAMES[tier];

  return {
    ok: true,
    data: {
      name,
      credentials,
      email,
      phone,
      employer,
      billingDifferent,
      billingName: billingDifferent ? billingName : '',
      billingEmail: billingDifferent ? billingEmail : '',
      billingPhone: billingDifferent ? billingPhone : '',
      street,
      street2,
      city,
      state,
      zip,
      country,
      notes,
      tier,
      tierName,
      duration,
      paymentOption,
      amount,
    },
  };
}

function row(label, value) {
  if (!value) return '';
  const html = escapeHtml(value).replace(/\n/g, '<br>');
  return `<tr>
    <td style="padding:8px 12px 8px 0; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#5c5c5c; width:180px; vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#1a1a1a;">${html}</td>
  </tr>`;
}

function addressBlock(data) {
  const lines = [data.street, data.street2, `${data.city}, ${data.state} ${data.zip}`, data.country]
    .filter(Boolean)
    .join('\n');
  return lines;
}

export function staffEmailSubject(data) {
  return `Invoice request: ${data.name} · ${data.tierName} · ${data.employer}`;
}

export function staffEmailHtml(data) {
  const amount = data.amount != null ? `$${data.amount}` : 'See published dues';
  const billing = data.billingDifferent
    ? `${data.billingName} <${data.billingEmail}>${data.billingPhone ? ` · ${data.billingPhone}` : ''}`
    : 'Same as requester';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>SAMPA invoice request</title></head>
<body style="margin:0; padding:0; background:#F4F4F2;">
  <div style="max-width:640px; margin:0 auto; padding:28px 16px 40px;">
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; color:#8B2FC9; text-align:center;">
      MEMBERSHIP INVOICE REQUEST
    </p>
    <h1 style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; color:#1a1a1a; text-align:center;">
      ${escapeHtml(data.name)} asked for a SAMPA invoice
    </h1>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; color:#444; line-height:1.5;">
      This is a request for staff to send a SAMPA invoice — not a Stripe charge
      and not an automatic invoice. Reply to the requester (or the billing
      contact) with the invoice. Published dues below are from the live
      membership table; confirm the amount on the invoice you send.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; background:#fff; border-radius:12px; padding:8px 20px;">
      ${row('Requester', data.name)}
      ${row('Credentials', data.credentials)}
      ${row('Requester email', data.email)}
      ${row('Requester phone', data.phone)}
      ${row('Employer / institution', data.employer)}
      ${row('Billing contact', billing)}
      ${row('Billing address', addressBlock(data))}
      ${row('Membership level', data.tierName)}
      ${row('Term', durationLabel(data.duration))}
      ${row('Invoice arrangement', paymentOptionLabel(data.paymentOption, data.duration))}
      ${row('Published dues', amount)}
      ${row('Notes', data.notes)}
    </table>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:#777; margin-top:20px;">
      SAMPA, Inc. · 501(c)(3) · EIN 42-2288772
    </p>
  </div>
</body>
</html>`;
}

export function requesterEmailSubject() {
  return 'We received your SAMPA invoice request';
}

export function requesterEmailHtml(data) {
  const billingLine = data.billingDifferent
    ? `We will send the invoice to ${escapeHtml(data.billingName)} at ${escapeHtml(data.billingEmail)}.`
    : `We will send the invoice to ${escapeHtml(data.email)}.`;
  const amount = data.amount != null ? `$${data.amount}` : 'the published dues for that level';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>SAMPA invoice request received</title></head>
<body style="margin:0; padding:0; background:#F4F4F2;">
  <div style="max-width:640px; margin:0 auto; padding:28px 16px 40px;">
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; color:#8B2FC9; text-align:center;">
      SAMPA MEMBERSHIP
    </p>
    <h1 style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; color:#1a1a1a;">
      We have your invoice request
    </h1>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; color:#333; line-height:1.55;">
      Hello ${escapeHtml(data.name.split(' ')[0] || data.name)},
    </p>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; color:#333; line-height:1.55;">
      Thank you. A SAMPA staff member will email an invoice you can share with
      your employer — you have not been charged. ${billingLine}
    </p>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; color:#333; line-height:1.55;">
      You asked for <strong>${escapeHtml(data.tierName)}</strong>,
      ${escapeHtml(durationLabel(data.duration))},
      ${escapeHtml(paymentOptionLabel(data.paymentOption, data.duration).toLowerCase())}.
      Published dues for that selection are ${escapeHtml(amount)}. Staff will
      confirm the amount on the invoice.
    </p>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; color:#333; line-height:1.55;">
      Questions? Reply to this email or write
      <a href="mailto:treasurer@addictionpas.org">treasurer@addictionpas.org</a>.
    </p>
    <p style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:#777; margin-top:28px;">
      SAMPA, Inc. is a 501(c)(3) nonprofit organization. EIN: 42-2288772.
    </p>
  </div>
</body>
</html>`;
}
