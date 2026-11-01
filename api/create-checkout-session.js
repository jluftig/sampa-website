import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';
import { buildCheckoutSessionParams, duplicateMembershipBlock } from './_lib/checkoutSession.js';

// POST { tier, duration, patron?, auto_renew? } → { url } of a Stripe Checkout session.
// auto_renew defaults true. false keeps the same Price and sets cancel_at_period_end.
// duration: 1 | 2 | 3 (years; a subscription billed every N years) or
// 'lifetime' (one-time payment, Legacy only). Optional `patron: true` adds a
// matching-term price_data line item (+$25 × term years; lifetime +$25 once)
// — not a seventh tier, not a required STRIPE_PRICE_* env, never written as
// membership_tier. Sign-in first: the Supabase user id rides along as
// client_reference_id and metadata, so the webhook can update exactly the
// right profiles row — the Stripe↔Supabase link is never inferred from email.
export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const body = await request.json().catch(() => ({}));
    const tier = body.tier;
    const duration = body.duration === 'lifetime' ? 'lifetime' : Number(body.duration) || 1;
    const wantPatron = body.patron === true;
    const autoRenew = body.auto_renew !== false;

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('stripe_customer_id, membership_status, renews_on, cancel_at_period_end')
      .eq('id', user.id)
      .maybeSingle();

    const block = duplicateMembershipBlock(profile);
    if (block) {
      return json({
        error: 'You already have an active membership. Manage billing from your dashboard instead of starting another subscription.',
      }, 409);
    }

    const built = buildCheckoutSessionParams({
      userId: user.id,
      email: user.email,
      customerId: profile?.stripe_customer_id,
      tier,
      duration,
      wantPatron,
      autoRenew,
      origin: requestSiteOrigin(request),
    });
    if (built.error) return json({ error: built.error }, 400);

    const session = await stripeClient().checkout.sessions.create(built.params);

    return json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err);
    return json({ error: 'Could not start checkout' }, 500);
  }
}
