import { json } from './_lib/clients.js';
import { sendSmtpEmail } from './_lib/brevo-member-email.js';
import {
  parseInvoiceRequest,
  requesterEmailHtml,
  requesterEmailSubject,
  staffEmailHtml,
  staffEmailSubject,
} from './_lib/invoice-request.js';

// POST public employer / institutional invoice request.
// Sends a transactional Brevo email (POST /smtp/email) to the treasurer,
// with a copy Josh can see. Not a marketing campaign. Not Stripe Invoicing.
// From is SAMPA / info@ — never a personal mailbox.

const DEFAULT_TO = 'treasurer@addictionpas.org';
const DEFAULT_CC = 'josh@addictionpas.org';

function parseAddressList(raw, fallback) {
  const source = raw == null || String(raw).trim() === '' ? fallback : raw;
  return String(source)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email }));
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = parseInvoiceRequest(body);

    if (parsed.honeypot) {
      return json({ ok: true });
    }
    if (parsed.error) {
      return json({ error: parsed.error }, 400);
    }

    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (!apiKey) {
      console.error('request-membership-invoice: BREVO_API_KEY is not set');
      return json(
        {
          error:
            'We could not send the request right now. Email treasurer@addictionpas.org with the same details and we will send a SAMPA invoice.',
        },
        503,
      );
    }

    const data = parsed.data;
    const to = parseAddressList(process.env.INVOICE_REQUEST_TO, DEFAULT_TO);
    const cc = parseAddressList(process.env.INVOICE_REQUEST_CC, DEFAULT_CC).filter(
      (row) => !to.some((t) => t.email === row.email),
    );

    if (!to.length) {
      console.error('request-membership-invoice: no staff destination');
      return json(
        {
          error:
            'We could not send the request right now. Email treasurer@addictionpas.org with the same details and we will send a SAMPA invoice.',
        },
        503,
      );
    }

    await sendSmtpEmail({
      to,
      cc,
      replyTo: {
        email: data.billingDifferent && data.billingEmail ? data.billingEmail : data.email,
        name: data.billingDifferent && data.billingName ? data.billingName : data.name,
      },
      subject: staffEmailSubject(data),
      htmlContent: staffEmailHtml(data),
      tags: ['membership-invoice-request'],
    });

    const confirmTo = [{ email: data.email, name: data.name }];
    if (data.billingDifferent && data.billingEmail && data.billingEmail !== data.email) {
      confirmTo.push({ email: data.billingEmail, name: data.billingName });
    }

    try {
      await sendSmtpEmail({
        to: confirmTo,
        replyTo: { email: DEFAULT_TO, name: 'SAMPA Treasurer' },
        subject: requesterEmailSubject(),
        htmlContent: requesterEmailHtml(data),
        tags: ['membership-invoice-request-confirm'],
      });
    } catch (err) {
      // Staff already has the request — do not fail the visitor for a confirm miss.
      console.error('request-membership-invoice: confirmation email failed', err);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('request-membership-invoice:', err);
    return json(
      {
        error:
          'We could not send the request right now. Email treasurer@addictionpas.org with the same details and we will send a SAMPA invoice.',
      },
      502,
    );
  }
}
