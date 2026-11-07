import { patronLineItem, priceIdFor } from './tiers.js';

// Shape of a Stripe Checkout Session for /join. auto_renew defaults on.
// Off keeps today's Price and stamps auto_renew=false on the subscription.
// This SDK's Checkout subscription_data does not accept cancel_at_period_end.
// The webhook sets that flag with subscriptions.update after payment.
// active means Stripe reported the subscription active or trialing. This
// product does not sell trials, so active is a completed membership.
// past_due also stores Stripe incomplete and unpaid. canceled also stores
// incomplete_expired. Those two profile values are not proof that a
// membership charge ever succeeded. priorPaid is the paid-invoice lookup:
// true, false, or null when the lookup did not answer.
export function isPaidMembershipInvoice(invoice) {
  if (!invoice || invoice.status !== 'paid') return false;
  const meta = {
    ...(invoice.parent?.subscription_details?.metadata || {}),
    ...(invoice.subscription_details?.metadata || {}),
    ...(invoice.metadata || {}),
  };
  if (meta.type === 'donation' || meta.addon === 'patron_upgrade') return false;
  return Boolean(
    meta.tier
    || meta.conversion === 'new_membership'
    || meta.conversion === 'renewal'
    || invoice.billing_reason === 'subscription_create'
    || invoice.billing_reason === 'subscription_cycle',
  );
}

export function priorPaidFromInvoiceList(list) {
  if (!list || !Array.isArray(list.data)) return null;
  if (list.data.some(isPaidMembershipInvoice)) return true;
  if (list.has_more) return null;
  return false;
}

export function membershipConversionKind(profile, { priorPaid } = {}) {
  const status = profile?.membership_status;
  if (!status) return 'new_membership';
  if (status === 'active') return 'renewal';
  if (status !== 'past_due' && status !== 'canceled') return 'new_membership';
  if (priorPaid === true) return 'renewal';
  if (priorPaid === false) return 'new_membership';
  return null;
}

export function checkoutSuccessUrl(origin) {
  const success = new URL('/join', origin);
  success.searchParams.set('step', 'checkout');
  success.searchParams.set('checkout', 'success');
  // Stripe replaces this token. URLSearchParams would encode the braces.
  return `${success.toString()}&session_id={CHECKOUT_SESSION_ID}`;
}

export function buildCheckoutSessionParams({
  userId,
  email,
  customerId,
  tier,
  duration,
  wantPatron = false,
  autoRenew = true,
  origin,
  conversion,
}) {
  const price = priceIdFor(tier, duration);
  if (!price) return { error: `Unknown or unconfigured tier/term: ${tier} / ${duration}` };

  const isLifetime = duration === 'lifetime';
  const renews = autoRenew !== false && !isLifetime;
  const metadata = {
    supabase_user_id: userId,
    tier,
    duration: String(duration),
    auto_renew: renews ? 'true' : 'false',
    ...(wantPatron ? { patron: 'true' } : {}),
    ...(conversion === 'new_membership' || conversion === 'renewal' ? { conversion } : {}),
  };
  const line_items = [{ price, quantity: 1 }];
  if (wantPatron) line_items.push(patronLineItem(duration));

  const cancel = new URL('/join', origin);
  cancel.searchParams.set('step', 'checkout');
  cancel.searchParams.set('checkout', 'canceled');
  cancel.searchParams.set('tier', tier);
  if (duration !== 1) cancel.searchParams.set('term', String(duration));
  cancel.searchParams.set('patron', wantPatron ? '1' : '0');
  if (!renews && !isLifetime) cancel.searchParams.set('auto', '0');

  return {
    price,
    params: {
      mode: isLifetime ? 'payment' : 'subscription',
      line_items,
      client_reference_id: userId,
      ...(customerId ? { customer: customerId } : { customer_email: email }),
      ...(isLifetime && !customerId ? { customer_creation: 'always' } : {}),
      metadata,
      ...(isLifetime ? {} : { subscription_data: { metadata } }),
      allow_promotion_codes: true,
      success_url: checkoutSuccessUrl(origin),
      cancel_url: cancel.toString(),
    },
  };
}

// Active auto-renew and lifetime members cannot start another subscription.
export function duplicateMembershipBlock(profile) {
  if (!profile || profile.membership_status !== 'active') return null;
  if (!profile.renews_on) return 'lifetime';
  if (!profile.cancel_at_period_end) return 'active_autorenew';
  return null;
}
