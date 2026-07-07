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

// "Member canceled but stays active until the paid term ends." Older API
// versions signal this via cancel_at_period_end; newer ones may only set the
// cancel_at timestamp — accept either.
function willCancel(subscription) {
  return subscription.cancel_at_period_end === true || Boolean(subscription.cancel_at);
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
        if (!userId) break;

        let update;
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          update = {
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || subscription.metadata?.tier || null,
            membership_status: membershipStatus(subscription.status),
            renews_on: renewsOn(subscription),
            cancel_at_period_end: willCancel(subscription),
          };
        } else if (session.mode === 'payment' && session.metadata?.duration === 'lifetime') {
          // Lifetime membership (Legacy): one-time payment, never expires.
          update = {
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || null,
            membership_status: 'active',
            renews_on: null,
            cancel_at_period_end: false,
          };
        } else {
          break; // some other one-time payment (e.g. future donations) — not membership
        }

        const { error } = await admin.from('profiles').update(update).eq('id', userId);
        if (error) throw error;
        break;
      }

      // Renewals, payment failures, tier changes via the portal, cancellations.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;
        const matchCol = userId ? 'id' : 'stripe_customer_id';
        const matchVal = userId || subscription.customer;

        // An active lifetime membership (renews_on is null) outranks any
        // leftover subscription — e.g. someone who upgraded to lifetime while
        // an old annual term was still running. Don't let that subscription's
        // later cancellation/renewal events downgrade or overwrite it.
        const { data: current } = await admin
          .from('profiles')
          .select('membership_status, renews_on')
          .eq(matchCol, matchVal)
          .maybeSingle();
        if (current?.membership_status === 'active' && current.renews_on === null) break;

        const update = {
          membership_status: membershipStatus(subscription.status),
          renews_on: renewsOn(subscription),
          cancel_at_period_end:
            event.type !== 'customer.subscription.deleted' && willCancel(subscription),
        };
        if (subscription.metadata?.tier) update.membership_tier = subscription.metadata.tier;

        const { data: updated, error } = await admin
          .from('profiles')
          .update(update)
          .eq(matchCol, matchVal)
          .select('id');
        if (error) throw error;
        // A zero-row match is silent data loss — make it visible in the logs.
        if (!updated?.length) {
          console.error(`stripe-webhook: ${event.type}: no profile matched ${matchCol}=${matchVal}`);
        }
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
