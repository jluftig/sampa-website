import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';

// POST → { url } of a Stripe Customer Portal session, where members update
// their card, switch tiers, cancel, and download invoices. We never build
// payment UI ourselves.
export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return json({ error: 'No billing account yet — join first' }, 400);
    }

    const origin = requestSiteOrigin(request);
    const session = await stripeClient().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('create-portal-session:', err);
    return json({ error: 'Could not open the billing portal' }, 500);
  }
}
