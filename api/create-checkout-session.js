import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { priceIdFor, patronLineItem } from './_lib/tiers.js';

// POST { tier, duration, patron? } → { url } of a Stripe Checkout session.
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
    const price = priceIdFor(tier, duration);
    if (!price) return json({ error: `Unknown or unconfigured tier/term: ${tier} / ${duration}` }, 400);

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const isLifetime = duration === 'lifetime';
    const metadata = {
      supabase_user_id: user.id,
      tier,
      duration: String(duration),
      // Never set type=donation here — that would skip the membership write.
      // patron is an add-on flag only; webhook writes `tier`, not this.
      ...(wantPatron ? { patron: 'true' } : {}),
    };
    const origin = new URL(request.url).origin;
    const line_items = [{ price, quantity: 1 }];
    if (wantPatron) line_items.push(patronLineItem(duration));

    const cancel = new URL('/join', origin);
    cancel.searchParams.set('checkout', 'canceled');
    cancel.searchParams.set('tier', tier);
    if (wantPatron) cancel.searchParams.set('patron', '1');

    const session = await stripeClient().checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      line_items,
      client_reference_id: user.id,
      // Reuse the Stripe customer on renewals/tier changes; otherwise prefill
      // their account email so Checkout is one screen of card details.
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email }),
      // Payment mode doesn't create a customer by default; we want one so the
      // billing portal (receipts, saved card) works for lifetime members too.
      ...(isLifetime && !profile?.stripe_customer_id ? { customer_creation: 'always' } : {}),
      metadata,
      ...(isLifetime ? {} : { subscription_data: { metadata } }),
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: cancel.toString(),
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err);
    return json({ error: 'Could not start checkout' }, 500);
  }
}
