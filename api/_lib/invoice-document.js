import { inflateSync } from 'node:zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import {
  durationLabel,
  invoiceTotalDollars,
  patronDollars,
  tierByKey,
} from '../../src/lib/membership.js';

export const SAMPA_EIN = '42-2288772';
export const SAMPA_LEGAL_NAME = 'SAMPA, Inc.';

const TEXT = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);

export function termStatement(duration) {
  if (duration === 'lifetime') {
    return 'Lifetime — one-time payment; does not auto-renew.';
  }
  const years = Number(duration) || 1;
  const label = years === 1 ? '1 year' : `${years} years`;
  return `${label} — auto-renewing until canceled.`;
}

export function buildInvoiceModel(input) {
  const tier = tierByKey(input.tier);
  const duration = input.duration === 'lifetime' ? 'lifetime' : Number(input.duration);
  const wantPatron = input.patron === true;
  const total = invoiceTotalDollars(tier, duration, wantPatron);
  if (!tier || total == null) return null;

  return {
    invoiceNumber: input.invoiceNumber,
    issuedOn: input.issuedOn || new Date().toISOString().slice(0, 10),
    memberName: input.memberName,
    memberEmail: input.memberEmail,
    credentials: input.credentials || '',
    employer: input.employer,
    apName: input.apName,
    apEmail: input.apEmail,
    billingAddress: input.billingAddress,
    poNumber: input.poNumber || '',
    tierKey: tier.key,
    tierName: tier.name,
    duration,
    durationLabel: durationLabel(duration),
    termStatement: termStatement(duration),
    patron: wantPatron,
    patronDollars: wantPatron ? patronDollars(duration) : 0,
    amountDollars: total,
    payUrl: input.payUrl,
    aapaMember: input.aapaMember,
  };
}

function wrap(font, text, size, maxWidth) {
  const source = String(text || '');
  if (!source) return [];
  const words = source.split(/\s+/);
  const lines = [];
  let current = '';
  const pushLong = (word) => {
    let chunk = '';
    for (const ch of word) {
      const trial = chunk + ch;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        chunk = trial;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  };
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) > maxWidth) pushLong(word);
      else current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function line(page, font, text, x, y, size = 11, color = TEXT) {
  page.drawText(text, { x, y, size, font, color });
  return y - size - 4;
}

/**
 * Real PDF (PDF operators + built-in Helvetica). No SVG, no webfonts, no HTML.
 */
export async function generateInvoicePdf(model) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${model.invoiceNumber} — ${SAMPA_LEGAL_NAME}`);
  pdf.setAuthor(SAMPA_LEGAL_NAME);
  pdf.setCreator('SAMPA membership invoice');

  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = 468;
  let y = 742;

  y = line(page, bold, SAMPA_LEGAL_NAME, 72, y, 16);
  y = line(page, regular, 'Society of Addiction Medicine Physician Associates', 72, y, 10, MUTED);
  y = line(page, regular, `EIN ${SAMPA_EIN}`, 72, y, 10, MUTED);
  y = line(page, regular, 'www.addictionpas.org', 72, y, 10, MUTED);
  y -= 10;
  y = line(page, bold, 'Membership invoice', 72, y, 14);
  y = line(page, regular, `Invoice ${model.invoiceNumber}`, 72, y, 11);
  y = line(page, regular, `Date ${model.issuedOn}`, 72, y, 11);
  y -= 12;

  y = line(page, bold, 'Member', 72, y, 12);
  const memberLine = model.credentials
    ? `${model.memberName}, ${model.credentials}`
    : model.memberName;
  for (const row of wrap(regular, memberLine, 11, maxWidth)) y = line(page, regular, row, 72, y);
  y = line(page, regular, model.memberEmail, 72, y);
  if (typeof model.aapaMember === 'boolean') {
    y = line(page, regular, `AAPA member (honor system): ${model.aapaMember ? 'Yes' : 'No'}`, 72, y);
  }
  y -= 10;

  y = line(page, bold, 'Employer / accounts payable', 72, y, 12);
  for (const row of wrap(regular, model.employer, 11, maxWidth)) y = line(page, regular, row, 72, y);
  y = line(page, regular, model.apName, 72, y);
  y = line(page, regular, model.apEmail, 72, y);
  for (const addr of String(model.billingAddress || '').split(/\n/)) {
    for (const row of wrap(regular, addr, 11, maxWidth)) y = line(page, regular, row, 72, y);
  }
  if (model.poNumber) y = line(page, regular, `PO ${model.poNumber}`, 72, y);
  y -= 10;

  y = line(page, bold, 'Membership', 72, y, 12);
  y = line(page, regular, `Level: ${model.tierName}`, 72, y);
  y = line(page, regular, `Term: ${model.termStatement}`, 72, y);
  if (model.patron) {
    y = line(page, regular, `Patron add-on: yes (+$${model.patronDollars})`, 72, y);
  } else {
    y = line(page, regular, 'Patron add-on: no', 72, y);
  }
  y -= 8;
  y = line(page, bold, `Amount due: $${model.amountDollars}.00 USD`, 72, y, 13);
  y -= 10;

  y = line(page, bold, 'Payment', 72, y, 12);
  for (const row of wrap(regular, 'This invoice does not charge a card and does not activate membership. Membership starts when this invoice is paid.', 10, maxWidth)) {
    y = line(page, regular, row, 72, y, 10);
  }
  y -= 4;
  y = line(page, regular, 'Pay this invoice (Stripe):', 72, y, 11);
  for (const row of wrap(regular, model.payUrl, 10, maxWidth)) {
    y = line(page, regular, row, 72, y, 10);
  }
  y -= 16;
  for (const row of wrap(regular, `${SAMPA_LEGAL_NAME} is a 501(c)(3) nonprofit organization. EIN ${SAMPA_EIN}.`, 9, maxWidth)) {
    y = line(page, regular, row, 72, y, 9, MUTED);
  }

  return pdf.save();
}

export async function generateInvoiceDocx(model) {
  const aapa =
    typeof model.aapaMember === 'boolean'
      ? `AAPA member (honor system): ${model.aapaMember ? 'Yes' : 'No'}`
      : null;
  const blocks = [
    [SAMPA_LEGAL_NAME, true],
    ['Society of Addiction Medicine Physician Associates', false],
    [`EIN ${SAMPA_EIN}`, false],
    ['www.addictionpas.org', false],
    ['', false],
    ['Membership invoice', true],
    [`Invoice ${model.invoiceNumber}`, false],
    [`Date ${model.issuedOn}`, false],
    ['', false],
    ['Member', true],
    [model.credentials ? `${model.memberName}, ${model.credentials}` : model.memberName, false],
    [model.memberEmail, false],
    ...(aapa ? [[aapa, false]] : []),
    ['', false],
    ['Employer / accounts payable', true],
    [model.employer, false],
    [model.apName, false],
    [model.apEmail, false],
    [model.billingAddress, false],
    ...(model.poNumber ? [[`PO ${model.poNumber}`, false]] : []),
    ['', false],
    ['Membership', true],
    [`Level: ${model.tierName}`, false],
    [`Term: ${model.termStatement}`, false],
    [model.patron ? `Patron add-on: yes (+$${model.patronDollars})` : 'Patron add-on: no', false],
    [`Amount due: $${model.amountDollars}.00 USD`, true],
    ['', false],
    ['This invoice does not charge a card and does not activate membership. Membership starts when this invoice is paid.', false],
    ['Pay this invoice (Stripe):', false],
    [model.payUrl, false],
  ];

  const doc = new Document({
    creator: SAMPA_LEGAL_NAME,
    title: `${model.invoiceNumber} — ${SAMPA_LEGAL_NAME}`,
    sections: [
      {
        children: blocks.map(
          ([text, bold]) =>
            new Paragraph({
              children: [new TextRun({ text: text || ' ', bold: Boolean(bold), font: 'Calibri', size: bold ? 24 : 22 })],
              spacing: { after: 80 },
            })
        ),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

function inflatedPdfStreams(bytes) {
  const latin = Buffer.from(bytes).toString('latin1');
  const chunks = [];
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = re.exec(latin))) {
    let raw = Buffer.from(match[1], 'latin1');
    while (raw.length && (raw[raw.length - 1] === 10 || raw[raw.length - 1] === 13)) {
      raw = raw.subarray(0, -1);
    }
    try {
      chunks.push(inflateSync(raw).toString('latin1'));
    } catch {
      chunks.push(raw.toString('latin1'));
    }
  }
  return chunks.join('\n');
}

export function extractPdfVisibleText(bytes) {
  const combined = inflatedPdfStreams(bytes);
  const texts = [];
  const hexRe = /<([0-9A-Fa-f]+)>/g;
  let match;
  while ((match = hexRe.exec(combined))) {
    if (match[1].length % 2 === 0) texts.push(Buffer.from(match[1], 'hex').toString('latin1'));
  }
  const litRe = /\((?:\\.|[^\\)])*\)/g;
  while ((match = litRe.exec(combined))) {
    texts.push(match[0].slice(1, -1).replace(/\\(.)/g, '$1'));
  }
  return texts.join('\n');
}

export function assertOpenablePdf(bytes) {
  const buf = Buffer.from(bytes);
  const head = buf.subarray(0, 8).toString('latin1');
  if (!head.startsWith('%PDF-')) {
    throw new Error(`Not a PDF: header is ${JSON.stringify(head)}`);
  }
  const asText = buf.toString('latin1');
  if (!asText.includes('%%EOF')) {
    throw new Error('PDF is missing %%EOF');
  }
  const lowered = asText.toLowerCase();
  if (lowered.includes('<svg') || lowered.includes('image/svg') || lowered.includes('<html')) {
    throw new Error('PDF contains SVG or HTML — university mail cannot open those');
  }
  const inflated = inflatedPdfStreams(bytes);
  if (!inflated.includes('/Subtype /Type1') || !inflated.includes('/BaseFont /Helvetica')) {
    throw new Error('PDF must use built-in Helvetica Type1 — no webfonts');
  }
  return true;
}
