import { SAMPA_EIN, SAMPA_LEGAL_NAME } from './invoice-document.js';

const BREVO = 'https://api.brevo.com/v3/smtp/email';
const INTERNAL_TO = [
  { email: 'josh@addictionpas.org', name: 'Josh Luftig' },
  { email: 'admin@addictionpas.org', name: 'SAMPA admin' },
];

function apiKey() {
  return process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '';
}

function sender() {
  return {
    name: process.env.BREVO_SENDER_NAME || 'SAMPA',
    email: process.env.BREVO_SENDER_EMAIL || 'info@addictionpas.org',
  };
}

function fieldLines(model) {
  return [
    `${SAMPA_LEGAL_NAME} invoice request (internal only — do not forward to the member or AP from this API).`,
    'Chief of Staff drafts the outbound invoice separately (admin@ draft + send chip).',
    '',
    `Invoice: ${model.invoiceNumber}`,
    `Member: ${model.memberName}${model.credentials ? `, ${model.credentials}` : ''}`,
    `Member email: ${model.memberEmail}`,
    `Employer: ${model.employer}`,
    `AP: ${model.apName} <${model.apEmail}>`,
    `Billing address: ${model.billingAddress.replace(/\n/g, ', ')}`,
    model.poNumber ? `PO: ${model.poNumber}` : 'PO: (none)',
    `Tier: ${model.tierName} (${model.tierKey})`,
    `Term: ${model.termStatement}`,
    `Patron: ${model.patron ? `yes (+$${model.patronDollars})` : 'no'}`,
    typeof model.aapaMember === 'boolean' ? `AAPA (honor system): ${model.aapaMember ? 'Yes' : 'No'}` : null,
    `Amount: $${model.amountDollars}.00 USD`,
    `Pay link: ${model.payUrl}`,
    `EIN ${SAMPA_EIN}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function notifyInvoiceRequest({ model, pdfBytes, docxBytes }) {
  const key = apiKey();
  if (!key) {
    throw new Error('BREVO_API_KEY is not set');
  }

  const textContent = fieldLines(model);
  const safeName = String(model.memberName || 'member')
    .replace(/[^\w.\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'member';

  const res = await fetch(BREVO, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': key,
    },
    body: JSON.stringify({
      sender: sender(),
      to: INTERNAL_TO,
      subject: `SAMPA invoice request: ${model.memberName}`,
      textContent,
      attachment: [
        {
          name: `${model.invoiceNumber}-${safeName}.pdf`,
          content: Buffer.from(pdfBytes).toString('base64'),
        },
        {
          name: `${model.invoiceNumber}-${safeName}.docx`,
          content: Buffer.from(docxBytes).toString('base64'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Brevo invoice notify failed (${res.status}): ${detail.slice(0, 400)}`);
  }
  return res.json().catch(() => ({ ok: true }));
}
