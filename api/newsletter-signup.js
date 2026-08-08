import { json } from './_lib/clients.js';

// POST { email } → Brevo double opt-in → SAMPA Updates (catch-all).
// Public endpoint — no account required. Contact is only added to the list
// after the subscriber confirms via the Brevo DOI email.
//
// Vercel env (server): BREVO_API_KEY, BREVO_LIST_UPDATES, BREVO_DOI_TEMPLATE_ID
// Optional: BREVO_DOI_REDIRECT_URL (defaults to /newsletter-confirmed on this origin)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREVO_BASE = 'https://api.brevo.com/v3';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Honeypot — bots fill hidden fields; humans leave this empty.
    if (body.company || body.website) {
      return json({ ok: true, pending: true });
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    const listId = Number(process.env.BREVO_LIST_UPDATES);
    const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
    if (
      !apiKey ||
      !Number.isFinite(listId) ||
      listId <= 0 ||
      !Number.isFinite(templateId) ||
      templateId <= 0
    ) {
      console.error(
        'newsletter-signup: missing BREVO_API_KEY, BREVO_LIST_UPDATES, or BREVO_DOI_TEMPLATE_ID',
      );
      return json(
        { error: 'Newsletter signup is temporarily unavailable. Please try again later.' },
        503,
      );
    }

    const origin = new URL(request.url).origin;
    const redirectionUrl =
      process.env.BREVO_DOI_REDIRECT_URL || `${origin}/newsletter-confirmed`;

    const res = await fetch(`${BREVO_BASE}/contacts/doubleOptinConfirmation`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId,
        redirectionUrl,
        attributes: {
          SOURCE: 'public_signup',
        },
      }),
    });

    // 201 created / 204 updated — both mean DOI email was (re)sent.
    if (res.status === 201 || res.status === 204) {
      return json({ ok: true, pending: true });
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
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
  } catch (err) {
    console.error('newsletter-signup:', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
