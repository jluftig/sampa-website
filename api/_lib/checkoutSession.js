import { patronLineItem, priceIdFor } from './tiers.js';

// Shape of a Stripe Checkout Session for /join. auto_renew defaults on.
// Off keeps today's Price and stamps auto_renew=false on the subscription.
// This SDK's Checkout subscription_data does not accept cancel_at_period_end.
// The webhook sets that flag with subscriptions.update after payment.
export function membershipConversionKind(profile) {
  return profile?.membership_status ? 'renewal' : 'new_membership';
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
