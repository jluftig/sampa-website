import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { priceIdForTier } from './_lib/tiers.js';

// POST { tier } → { url } of a Stripe Checkout session (annual subscription).
// Sign-in first: the Supabase user id rides along as client_reference_id and
// metadata, so the webhook can update exactly the right profiles row — the
// Stripe↔Supabase link is never inferred from email.
export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const { tier } = await request.json().catch(() => ({}));
    const price = priceIdForTier(tier);
    if (!price) return json({ error: `Unknown or unconfigured tier: ${tier}` }, 400);

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const origin = new URL(request.url).origin;
    const session = await stripeClient().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      // Reuse the Stripe customer on renewals/tier changes; otherwise prefill
      // their account email so Checkout is one screen of card details.
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email }),
      metadata: { supabase_user_id: user.id, tier },
      subscription_data: { metadata: { supabase_user_id: user.id, tier } },
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/join?checkout=canceled`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err);
    return json({ error: 'Could not start checkout' }, 500);
  }
}
