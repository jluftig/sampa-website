import { stripeClient, supabaseAdmin, json } from './_lib/clients.js';

// Stripe → Supabase sync (the ONLY writer of the membership columns on
// profiles). Stripe is the source of truth for billing; this copies the
// relevant facts onto the member's row, keyed by the Supabase user id that
// checkout stamped into client_reference_id / subscription metadata.

function membershipStatus(subscriptionStatus) {
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') return 'active';
  if (['past_due', 'unpaid', 'incomplete'].includes(subscriptionStatus)) return 'past_due';
  return 'canceled';
}

// Stripe API versions ≥ 2025-03-31 moved current_period_end onto the
// subscription items; support both shapes.
function renewsOn(subscription) {
  const end =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

export async function POST(request) {
  const stripe = stripeClient();
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('stripe-webhook: signature verification failed:', err.message);
    return new Response('Invalid signature', { status: 400 });
  }

  const admin = supabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.supabase_user_id;
        if (!userId || session.mode !== 'subscription') break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const { error } = await admin
          .from('profiles')
          .update({
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || subscription.metadata?.tier || null,
            membership_status: membershipStatus(subscription.status),
            renews_on: renewsOn(subscription),
          })
          .eq('id', userId);
        if (error) throw error;
        break;
      }

      // Renewals, payment failures, tier changes via the portal, cancellations.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;

        const update = {
          membership_status: membershipStatus(subscription.status),
          renews_on: renewsOn(subscription),
        };
        if (subscription.metadata?.tier) update.membership_tier = subscription.metadata.tier;

        const query = admin.from('profiles').update(update);
        const { error } = userId
          ? await query.eq('id', userId)
          : await query.eq('stripe_customer_id', subscription.customer);
        if (error) throw error;
        break;
      }

      default:
        break; // Not a subscribed event type — acknowledge and ignore.
    }
  } catch (err) {
    console.error(`stripe-webhook: ${event.type} handler failed:`, err);
    return new Response('Webhook handler failed', { status: 500 }); // Stripe retries
  }

  return json({ received: true });
}
