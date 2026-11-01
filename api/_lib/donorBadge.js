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

// A gift counts for this profile only. A user id never falls through to someone else.
export function giftMatchesProfile(gift, profile) {
  if (!gift || !profile) return false;
  const fields = donorMatchFields(gift);
  if (fields.userId) return fields.userId === profile.id;
  if (fields.stripeCustomerId) return fields.stripeCustomerId === profile.stripe_customer_id;
  const email = normalizeEmail(fields.email);
  return !!email && email === normalizeEmail(profile.email);
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
