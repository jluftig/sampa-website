import { stripeClient, supabaseAdmin, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';

// POST { amount, frequency, email? } → { url } of a Stripe Checkout session.
// amount is in DOLLARS (we convert to cents); frequency is 'once' | 'monthly'.
//
// PUBLIC endpoint — unlike membership checkout, donating does NOT require an
// account (anyone in the US can give). If a Supabase JWT rides along we link the
// gift to that profile; otherwise it's an anonymous gift keyed only by the email
// Stripe collects. The load-bearing signal is metadata.type='donation', which
// keeps these payments OUT of the membership columns in the webhook.
//
// Kill-switch — keep in sync with src/lib/features.js DONATIONS_ENABLED.
// false = no Checkout sessions.
const DONATIONS_ENABLED = true;

const MIN_CENTS = 100;         // $1 floor
const MAX_CENTS = 5_000_000;   // $50,000 ceiling (typo/fraud sanity check)

export async function POST(request) {
  try {
    if (!DONATIONS_ENABLED) {
      return json({ error: 'Donations are temporarily unavailable. Please try again later.' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    const frequency = body.frequency === 'monthly' ? 'monthly' : 'once';
    const amount = Math.round(Number(body.amount) * 100); // dollars → cents
    if (!Number.isFinite(amount) || amount < MIN_CENTS || amount > MAX_CENTS) {
      return json({ error: 'Please enter a donation amount between $1 and $50,000.' }, 400);
    }

    // Optional signed-in user (donations don't require an account).
    let user = null;
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const { data } = await supabaseAdmin().auth.getUser(authHeader.slice(7));
      user = data?.user ?? null;
    }

    // Reuse the member's Stripe customer when we know it, so recurring gifts land
    // in the same billing portal as their dues.
    let stripeCustomerId = null;
    if (user) {
      const { data: profile } = await supabaseAdmin()
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();
      stripeCustomerId = profile?.stripe_customer_id ?? null;
    }

    const isMonthly = frequency === 'monthly';
    const metadata = {
      type: 'donation',
      frequency,
      ...(user ? { supabase_user_id: user.id } : {}),
    };
    const email = ((body.email || user?.email) ?? '').trim() || null;
    const origin = requestSiteOrigin(request);

    const session = await stripeClient().checkout.sessions.create({
      mode: isMonthly ? 'subscription' : 'payment',
      submit_type: 'donate',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
          product_data: {
            name: isMonthly ? 'Monthly donation to SAMPA' : 'Donation to SAMPA',
          },
        },
      }],
      metadata,
      // Stamp the subscription too, so recurring-cycle invoices carry the flag.
      ...(isMonthly ? { subscription_data: { metadata } } : {}),
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : email
          ? { customer_email: email }
          : {}),
      // One-time gift from a guest: still create a customer so we keep a stable
      // donor record and they can get receipts. (Subscriptions always create one.)
      ...(!isMonthly && !stripeCustomerId ? { customer_creation: 'always' } : {}),
      ...(user ? { client_reference_id: user.id } : {}),
      success_url: `${origin}/donate?status=success`,
      cancel_url: `${origin}/donate?status=canceled`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-donation-session:', err);
    return json({ error: 'Could not start the donation checkout' }, 500);
  }
}
