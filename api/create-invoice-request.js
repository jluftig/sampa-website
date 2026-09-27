import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';
import { priceIdFor, patronDollars, TIER_DURATIONS } from './_lib/tiers.js';
import {
  assertOpenablePdf,
  buildInvoiceModel,
  generateInvoiceDocx,
  generateInvoicePdf,
} from './_lib/invoice-document.js';
import { notifyInvoiceRequest } from './_lib/invoice-notify.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanLine(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanMultiline(value, max) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .slice(0, max);
}

function parseDuration(raw, tierKey) {
  const allowed = TIER_DURATIONS[tierKey];
  if (!allowed) return null;
  if (raw === 'lifetime') return allowed.includes('lifetime') ? 'lifetime' : null;
  const n = Number(raw);
  return allowed.includes(n) ? n : null;
}

function invoiceNumber() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SAMPA-INV-${day}-${rand}`;
}

async function patronPriceId(stripe, duration) {
  const dollars = patronDollars(duration);
  const isLifetime = duration === 'lifetime';
  const years = isLifetime ? 1 : Number(duration) || 1;
  const lookup_key = isLifetime ? 'sampa_patron_lifetime' : `sampa_patron_${years}y`;
  const existing = await stripe.prices.list({ lookup_keys: [lookup_key], limit: 1 });
  if (existing.data[0]?.id) return existing.data[0].id;
  const created = await stripe.prices.create({
    currency: 'usd',
    unit_amount: dollars * 100,
    lookup_key,
    transfer_lookup_key: true,
    product_data: {
      name: 'Patron add-on',
      metadata: { sampa_addon: 'patron' },
    },
    ...(isLifetime ? {} : { recurring: { interval: 'year', interval_count: years } }),
  });
  return created.id;
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required so we can attach this membership when the invoice is paid.' }, 401);

    const body = await request.json().catch(() => ({}));
    if (body.website || body.company) return json({ ok: true });

    const admin = supabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('membership_status, aapa_member')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.membership_status === 'active') {
      return json({ error: 'You already have an active membership. Use the dashboard billing portal instead.' }, 400);
    }

    const tier = cleanLine(body.tier, 40);
    const duration = parseDuration(body.duration, tier);
    const wantPatron = body.patron === true;
    const price = priceIdFor(tier, duration);
    if (!price) return json({ error: `Unknown or unconfigured tier/term: ${tier} / ${body.duration}` }, 400);

    const memberName = cleanLine(body.memberName, 200);
    const memberEmail = cleanLine(body.memberEmail, 254).toLowerCase();
    const credentials = cleanLine(body.credentials, 80);
    const employer = cleanLine(body.employer, 200);
    const apName = cleanLine(body.apName, 200);
    const apEmail = cleanLine(body.apEmail, 254).toLowerCase();
    const billingAddress = cleanMultiline(body.billingAddress, 500);
    const poNumber = cleanLine(body.poNumber, 80);
    const aapaMember = body.aapa === true ? true : body.aapa === false ? false : null;

    if (!memberName || !employer || !apName || !billingAddress) {
      return json({ error: 'Please fill in member name, employer, AP contact, and billing address.' }, 400);
    }
    if (!EMAIL_RE.test(memberEmail) || !EMAIL_RE.test(apEmail)) {
      return json({ error: 'Please enter valid member and AP email addresses.' }, 400);
    }

    const number = invoiceNumber();
    const stripe = stripeClient();
    const isLifetime = duration === 'lifetime';
    const metadata = {
      supabase_user_id: user.id,
      tier,
      duration: String(duration),
      invoice_number: number,
      ...(wantPatron ? { patron: 'true' } : {}),
    };

    const line_items = [{ price, quantity: 1 }];
    if (wantPatron) {
      line_items.push({ price: await patronPriceId(stripe, duration), quantity: 1 });
    }

    const origin = requestSiteOrigin(request);
    const paymentLink = await stripe.paymentLinks.create({
      line_items,
      metadata,
      ...(isLifetime
        ? { payment_intent_data: { metadata } }
        : { subscription_data: { metadata } }),
      after_completion: {
        type: 'redirect',
        redirect: { url: `${origin}/dashboard?checkout=success` },
      },
      allow_promotion_codes: true,
    });

    const model = buildInvoiceModel({
      invoiceNumber: number,
      memberName,
      memberEmail,
      credentials,
      employer,
      apName,
      apEmail,
      billingAddress,
      poNumber,
      tier,
      duration,
      patron: wantPatron,
      aapaMember,
      payUrl: paymentLink.url,
    });
    if (!model) return json({ error: 'Could not price that membership.' }, 400);

    const pdfBytes = await generateInvoicePdf(model);
    assertOpenablePdf(pdfBytes);
    const docxBytes = await generateInvoiceDocx(model);

    const row = {
      user_id: user.id,
      invoice_number: number,
      member_name: memberName,
      member_email: memberEmail,
      credentials: credentials || null,
      employer,
      ap_name: apName,
      ap_email: apEmail,
      billing_address: billingAddress,
      po_number: poNumber || null,
      tier,
      duration: String(duration),
      aapa_member: aapaMember,
      patron: wantPatron,
      amount_cents: model.amountDollars * 100,
      stripe_payment_link_id: paymentLink.id,
      stripe_payment_url: paymentLink.url,
      status: 'requested',
    };

    const { error: insertError } = await admin.from('membership_invoice_requests').insert(row);
    if (insertError) {
      console.error('create-invoice-request: store failed (run 2026-08-25-invoice-requests.sql):', insertError.message);
    }

    if (typeof aapaMember === 'boolean') {
      const { error: aapaError } = await admin
        .from('profiles')
        .update({ aapa_member: aapaMember })
        .eq('id', user.id);
      if (aapaError && !/aapa_member/i.test(aapaError.message || '')) {
        console.warn('create-invoice-request: could not save AAPA answer:', aapaError.message);
      }
    }

    let notified = false;
    try {
      await notifyInvoiceRequest({ model, pdfBytes, docxBytes });
      notified = true;
    } catch (err) {
      console.error('create-invoice-request: internal notify failed:', err.message || err);
    }

    return json({
      ok: true,
      invoiceNumber: number,
      stored: !insertError,
      notified,
    });
  } catch (err) {
    console.error('create-invoice-request:', err);
    return json({ error: 'Could not create the invoice request' }, 500);
  }
}
