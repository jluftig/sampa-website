import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';
import { patronOneTimeLineItem } from './_lib/tiers.js';

// POST → { url } of a Stripe Checkout session that only adds Patron.
// Existing active members only. Join still owns first-time Patron.
// Never a membership_tier. Never type=donation.
//
// Payment mode (one-time for the current term / lifetime +$25). After pay,
// the webhook writes profiles.patron and, for term members, attaches the
// matching-term recurring item to the existing membership subscription
// (proration none) so renewals keep the badge charge.
export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('membership_status, patron, stripe_customer_id, membership_years, renews_on, membership_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.patron) return json({ error: 'Patron is already on this membership' }, 400);
    if (profile?.membership_status !== 'active') {
      return json({ error: 'Patron is available after you have an active membership' }, 400);
    }
    if (!profile?.stripe_customer_id) {
      return json({ error: 'Online billing is not set up on this account yet' }, 400);
    }

    const duration =
      profile.membership_status === 'active' && !profile.renews_on
        ? 'lifetime'
        : Number(profile.membership_years) >= 1
          ? Number(profile.membership_years)
          : 1;
    const origin = requestSiteOrigin(request);
    const metadata = {
      supabase_user_id: user.id,
      addon: 'patron_upgrade',
      patron: 'true',
      duration: String(duration),
      // Keep the real tier for logs only. Webhook must not treat this as a
      // new membership checkout (no welcome, no status rewrite).
      ...(profile.membership_tier ? { tier: profile.membership_tier } : {}),
    };

    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      customer: profile.stripe_customer_id,
      line_items: [patronOneTimeLineItem(duration)],
      client_reference_id: user.id,
      metadata,
      success_url: `${origin}/dashboard?checkout=success&addon=patron`,
      cancel_url: `${origin}/dashboard`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('add-patron:', err);
    return json({ error: 'Could not start Patron checkout' }, 500);
  }
}
