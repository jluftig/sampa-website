const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

export function emptyReceipt(outcome = 'unknown') {
  return { outcome, transactionId: null, value: null, currency: null };
}

export function isCheckoutSessionId(value) {
  return SESSION_ID.test(value || '');
}

function productOf(line) {
  const product = line?.price?.product;
  return product && typeof product === 'object' ? product : null;
}

function isPatronLine(line) {
  const product = productOf(line);
  const name = product?.name || line?.description || '';
  const meta = { ...(line?.price?.metadata || {}), ...(product?.metadata || {}) };
  return meta.sampa_addon === 'patron' || /patron add-on/i.test(name);
}

function isDonationLine(line) {
  const product = productOf(line);
  const meta = { ...(line?.price?.metadata || {}), ...(product?.metadata || {}), ...(line?.metadata || {}) };
  const name = product?.name || line?.description || '';
  return meta.type === 'donation' || /donation/i.test(name);
}

// Membership dues actually charged on this session. Patron and donation
// lines are left out. A bundled Patron checkout with no line items does not
// fall back to amount_total, because that total includes the add-on.
export function membershipAmountCents(session) {
  const lines = session?.line_items?.data;
  if (Array.isArray(lines) && lines.length) {
    let sum = 0;
    let sawMembership = false;
    for (const line of lines) {
      if (isPatronLine(line) || isDonationLine(line)) continue;
      if (!Number.isInteger(line?.amount_total) || line.amount_total < 0) return null;
      sum += line.amount_total;
      sawMembership = true;
    }
    return sawMembership ? sum : null;
  }
  const meta = session?.metadata || {};
  if (meta.patron === 'true' || meta.addon === 'patron_upgrade' || meta.type === 'donation') return null;
  return Number.isInteger(session?.amount_total) && session.amount_total >= 0 ? session.amount_total : null;
}

// Classify a Stripe Checkout Session for the signed-in user.
// Donation and Patron are matched before the membership stamp so a confused
// metadata mix cannot be reported as a new membership.
export function classifyCheckoutSession(session, userId) {
  if (!session || !userId) return emptyReceipt('unknown');
  const owner = session.client_reference_id || session.metadata?.supabase_user_id || '';
  if (!owner || owner !== userId) return emptyReceipt('forbidden');

  const meta = session.metadata || {};
  let kind = 'unknown';
  if (meta.type === 'donation') kind = 'donation';
  else if (meta.addon === 'patron_upgrade') kind = 'patron';
  else if (meta.conversion === 'new_membership') kind = 'new_membership';
  else if (meta.conversion === 'renewal' || meta.tier) kind = 'renewal';

  const paid = session.status === 'complete' && session.payment_status === 'paid';
  if (!paid) {
    return {
      outcome: 'unpaid',
      transactionId: isCheckoutSessionId(session.id) ? session.id : null,
      value: null,
      currency: null,
    };
  }

  if (kind === 'new_membership') {
    const usd = String(session.currency || '').toLowerCase() === 'usd';
    const cents = membershipAmountCents(session);
    const value = usd && Number.isInteger(cents) && cents >= 0 ? cents / 100 : null;
    return {
      outcome: 'new_membership',
      transactionId: session.id,
      value,
      currency: value == null ? null : 'USD',
    };
  }

  if (kind === 'renewal' || kind === 'patron' || kind === 'donation') {
    return {
      outcome: kind,
      transactionId: isCheckoutSessionId(session.id) ? session.id : null,
      value: null,
      currency: null,
    };
  }
  return emptyReceipt('unknown');
}

// Wire shape. A session that belongs to someone else looks the same as a
// missing session, and neither includes the payer's name, email, or amount.
export function publicReceipt(classified) {
  if (!classified || classified.outcome === 'forbidden' || classified.outcome === 'unknown') {
    return emptyReceipt('unknown');
  }
  return {
    outcome: classified.outcome,
    transactionId: classified.transactionId || null,
    value: classified.outcome === 'new_membership' ? classified.value : null,
    currency: classified.outcome === 'new_membership' ? classified.currency : null,
  };
}
