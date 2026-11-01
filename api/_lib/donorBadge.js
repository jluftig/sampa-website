// Donor directory badge. Webhook-only stamp of the latest successful /donate gift.
// Membership checkout still matches on the Supabase user id. Email and Stripe
// customer matching here is for gifts only, and only when that match is unique.

export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function isoFromStripeUnix(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString();
}

// Donation rows use user_id, stripe_customer_id, and donor_email.
// The matcher uses userId, stripeCustomerId, and email. Accept both.
export function donorMatchFields(fields = {}) {
  return {
    userId: fields.userId ?? fields.user_id ?? null,
    stripeCustomerId: fields.stripeCustomerId ?? fields.stripe_customer_id ?? null,
    email: fields.email ?? fields.donor_email ?? null,
    amount: fields.amount,
    status: fields.status,
    paymentStatus: fields.paymentStatus ?? fields.payment_status,
    paidAt: fields.paidAt ?? fields.paid_at ?? fields.created_at ?? null,
  };
}

// amount is cents. paymentStatus is omitted for invoice.paid, which is already paid.
export function donationIsSuccessful(fields = {}) {
  const { amount, status, paymentStatus } = donorMatchFields(fields);
  const cents = Number(amount);
  if (!Number.isFinite(cents) || cents <= 0) return false;
  if (status && status !== 'succeeded') return false;
  if (paymentStatus && paymentStatus !== 'paid') return false;
  return true;
}

// Keep the later timestamp. A retry of an older event does not move the badge back.
export function nextDonatedAt(current, paidAt) {
  const paid = paidAt ? new Date(paidAt) : null;
  if (!paid || Number.isNaN(paid.getTime())) {
    if (!current) return null;
    const cur = new Date(current);
    return Number.isNaN(cur.getTime()) ? null : cur.toISOString();
  }
  if (!current) return paid.toISOString();
  const cur = new Date(current);
  if (Number.isNaN(cur.getTime()) || paid > cur) return paid.toISOString();
  return cur.toISOString();
}

// Calendar months, same window as `now() - interval '12 months'` in the directory RPC.
export function donorBadgeVisible(donatedAt, now = new Date()) {
  if (!donatedAt) return false;
  const paid = new Date(donatedAt);
  const at = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(paid.getTime()) || Number.isNaN(at.getTime())) return false;
  const cutoff = new Date(at.getTime());
  cutoff.setMonth(cutoff.getMonth() - 12);
  return paid.getTime() >= cutoff.getTime();
}

// profiles are { id, stripe_customer_id, email }.
// A supplied user id never falls through to another person.
// Two profiles on one customer or one email is not a match.
export function chooseDonorProfile(profiles, { userId, stripeCustomerId, email } = {}) {
  const rows = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
  if (userId) {
    const hit = rows.find((p) => p.id === userId);
    return hit ? hit.id : null;
  }
  if (stripeCustomerId) {
    const hits = rows.filter((p) => p.stripe_customer_id === stripeCustomerId);
    if (hits.length === 1) return hits[0].id;
    if (hits.length > 1) return null;
  }
  const needle = normalizeEmail(email);
  if (!needle) return null;
  const hits = rows.filter((p) => normalizeEmail(p.email) === needle);
  if (hits.length === 1) return hits[0].id;
  return null;
}

function stripeId(value) {
  return typeof value === 'string' ? value : value?.id ?? null;
}

// A gift supports this profile when the account id matches, or the Stripe
// customer matches, or the donor email matches. A gift already tied to a
// different account does not count, even if the email is the same.
export function giftMatchesProfile(gift, profile) {
  if (!gift || !profile) return false;
  const fields = donorMatchFields(gift);
  if (fields.userId && fields.userId !== profile.id) return false;
  if (fields.userId && fields.userId === profile.id) return true;
  if (fields.stripeCustomerId && fields.stripeCustomerId === profile.stripe_customer_id) return true;
  const email = normalizeEmail(fields.email);
  return !!email && email === normalizeEmail(profile.email);
}

// Invoice payments carry the PaymentIntent and Charge. Charge.invoice is not
// a field we can trust, so callers store these ids on the donation row.
export function paymentIdsFromInvoice(invoice) {
  let paymentIntentId = stripeId(invoice?.payment_intent);
  let chargeId = stripeId(invoice?.charge);
  for (const payment of invoice?.payments?.data || []) {
    const pay = payment?.payment;
    if (!pay) continue;
    if (!paymentIntentId) paymentIntentId = stripeId(pay.payment_intent);
    if (!chargeId) chargeId = stripeId(pay.charge);
    const intent = pay.payment_intent;
    if (intent && typeof intent === 'object') {
      paymentIntentId = paymentIntentId || intent.id || null;
      chargeId = chargeId || stripeId(intent.latest_charge);
    }
  }
  return { paymentIntentId, chargeId };
}

// A partial refund leaves the gift counted. Only a full refund removes it.
export function chargeIsFullyRefunded(charge) {
  if (!charge) return false;
  const amount = Number(charge.amount);
  const refunded = Number(charge.amount_refunded);
  if (Number.isFinite(amount) && amount > 0 && Number.isFinite(refunded)) {
    return refunded >= amount;
  }
  return charge.refunded === true;
}

// Latest succeeded gift still inside the 12-month window. Refunded and disputed
// rows are not succeeded, so they drop out. No remaining gift returns null.
export function donatedAtFromGifts(gifts, now = new Date()) {
  let latest = null;
  for (const gift of gifts || []) {
    const fields = donorMatchFields(gift);
    if (!donationIsSuccessful(fields)) continue;
    if (!donorBadgeVisible(fields.paidAt, now)) continue;
    latest = nextDonatedAt(latest, fields.paidAt);
  }
  return latest;
}
