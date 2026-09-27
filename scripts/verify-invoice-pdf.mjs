#!/usr/bin/env node
// Assert the employer-invoice PDF is a real openable %PDF (not HTML/SVG renamed).
// UK mail could not open the SVG invoice we sent Cheryl Vanderford in Aug 2026.
import { PDFDocument } from 'pdf-lib';
import {
  assertOpenablePdf,
  buildInvoiceModel,
  extractPdfVisibleText,
  generateInvoiceDocx,
  generateInvoicePdf,
} from '../api/_lib/invoice-document.js';
import { invoiceTotalDollars, tierByKey } from '../src/lib/membership.js';

const model = buildInvoiceModel({
  invoiceNumber: 'SAMPA-INV-20260825-VERIFY',
  issuedOn: '2026-08-25',
  memberName: 'Cheryl Vanderford',
  memberEmail: 'cheryl.vanderford@uky.edu',
  credentials: 'PA-C',
  employer: 'University of Kentucky',
  apName: 'UK Accounts Payable',
  apEmail: 'ap@uky.edu',
  billingAddress: '800 Rose Street\nLexington, KY 40536',
  poNumber: 'PO-UK-1048',
  tier: 'fellow',
  duration: 1,
  patron: true,
  aapaMember: true,
  payUrl: 'https://buy.stripe.com/test_sampa_invoice_verify',
});

if (!model) {
  console.error('verify-invoice-pdf: could not build sample model');
  process.exit(1);
}

const bytes = await generateInvoicePdf(model);
assertOpenablePdf(bytes);

const loaded = await PDFDocument.load(bytes, { updateMetadata: false });
if (loaded.getPageCount() < 1) {
  console.error('verify-invoice-pdf: PDF has no pages');
  process.exit(1);
}

const latin = extractPdfVisibleText(bytes);
const required = [
  'SAMPA, Inc.',
  '42-2288772',
  'Cheryl Vanderford',
  'University of Kentucky',
  'auto-renewing until canceled',
  'https://buy.stripe.com/test_sampa_invoice_verify',
];
for (const needle of required) {
  if (!latin.includes(needle)) {
    console.error(`verify-invoice-pdf: missing ${JSON.stringify(needle)}`);
    process.exit(1);
  }
}

const lifetime = buildInvoiceModel({
  invoiceNumber: 'SAMPA-INV-20260825-LIFE',
  issuedOn: '2026-08-25',
  memberName: 'Cheryl Vanderford',
  memberEmail: 'cheryl.vanderford@uky.edu',
  employer: 'University of Kentucky',
  apName: 'UK Accounts Payable',
  apEmail: 'ap@uky.edu',
  billingAddress: '800 Rose Street\nLexington, KY 40536',
  tier: 'legacy',
  duration: 'lifetime',
  patron: false,
  payUrl: 'https://buy.stripe.com/test_sampa_invoice_verify',
});
if (!lifetime || lifetime.termStatement.includes('auto-renewing')) {
  console.error('verify-invoice-pdf: lifetime must not be described as auto-renewing');
  process.exit(1);
}
if (!lifetime.termStatement.includes('does not auto-renew')) {
  console.error('verify-invoice-pdf: lifetime must state it does not auto-renew');
  process.exit(1);
}
if (!model.termStatement.includes('auto-renewing until canceled')) {
  console.error('verify-invoice-pdf: term-year invoices must state auto-renew at equal weight');
  process.exit(1);
}

const fellow = tierByKey('fellow');
if (invoiceTotalDollars(fellow, 1, true) !== 75) {
  console.error('verify-invoice-pdf: Fellow 1yr + Patron should be $75');
  process.exit(1);
}

const docx = await generateInvoiceDocx(model);
if (Buffer.from(docx).subarray(0, 2).toString('latin1') !== 'PK') {
  console.error('verify-invoice-pdf: docx is not a ZIP/OOXML file');
  process.exit(1);
}

let rejected = false;
try {
  assertOpenablePdf(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
} catch {
  rejected = true;
}
if (!rejected) {
  console.error('verify-invoice-pdf: SVG-as-PDF should have been rejected');
  process.exit(1);
}

console.log(`verify-invoice-pdf: ok (${bytes.byteLength} bytes, ${loaded.getPageCount()} page, %PDF no-SVG; docx ${docx.byteLength} bytes)`);
