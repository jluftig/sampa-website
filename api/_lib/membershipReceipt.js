const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;

export function emptyReceipt(outcome = 'unknown') {
  return { outcome, transactionId: null, value: null, currency: null };
}

export function isCheckoutSessionId(value) {
  return SESSION_ID.test(value || '');
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
    const cents = session.amount_total;
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
