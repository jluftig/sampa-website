import { stripeClient, supabaseAdmin, json } from './_lib/clients.js';
import { patronLineItem, subscriptionHasPatronItem } from './_lib/tiers.js';
import {
  memberEmailsEnabled,
  profileForEmail,
  sendMemberLifecycleEmail,
  donorFromStripeFields,
} from './_lib/brevo-member-email.js';

// Stripe → Supabase sync (the ONLY writer of the membership columns on
// profiles). Stripe is the source of truth for billing; this copies the
// relevant facts onto the member's row, keyed by the Supabase user id that
// checkout stamped into client_reference_id / subscription metadata.
//
// Optional Brevo transactional emails (welcome / renewal / donation thanks):
// LIVE by default when BREVO_API_KEY is set. Kill-switch:
// BREVO_MEMBER_EMAILS_ENABLED=false. Failures are logged only — never fail
// the webhook (DB write always wins).

async function maybeMemberEmail(kind, admin, userId) {
  if (!memberEmailsEnabled()) return;
  try {
    const profile = await profileForEmail(admin, userId);
    if (!profile?.email) {
      console.warn(`stripe-webhook: member ${kind} email skipped — no email for user ${userId}`);
      return;
    }
    const result = await sendMemberLifecycleEmail(kind, {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
    console.log(`stripe-webhook: member ${kind} email`, result);
  } catch (err) {
    console.error(`stripe-webhook: member ${kind} email failed:`, err.message || err);
  }
}

async function maybeDonationThanks(admin, row) {
  if (!memberEmailsEnabled()) return;
  try {
    let email = row.donor_email || null;
    let firstName = '';
    let lastName = '';
    const fromStripe = donorFromStripeFields({
      email: row.donor_email,
      name: row.donor_name,
    });
    firstName = fromStripe.firstName;
    lastName = fromStripe.lastName;

    // Prefer profile name/email when logged-in donor
    if (row.user_id && admin) {
      const profile = await profileForEmail(admin, row.user_id);
      if (profile?.email) email = email || profile.email;
      if (profile?.firstName) {
        firstName = firstName || profile.firstName;
        lastName = lastName || profile.lastName;
      }
    }

    if (!email) {
      console.warn('stripe-webhook: donation thanks skipped — no donor email');
      return;
    }

    const result = await sendMemberLifecycleEmail('donation', {
      email,
      firstName,
      lastName,
      amountCents: row.amount,
      currency: row.currency || 'usd',
      frequency: row.frequency || 'once',
    });
    console.log('stripe-webhook: donation thanks email', result);
  } catch (err) {
    console.error('stripe-webhook: donation thanks email failed:', err.message || err);
  }
}

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

// Purchased term length in years, read from the price the subscription is
// actually on (interval_count of a yearly price) — robust to portal plan
// switches, where checkout metadata would go stale.
function termYears(subscription) {
  const items = subscription.items?.data || [];
  const membershipItem = items.find((item) => {
    const product = item.price?.product;
    const name = typeof product === 'object' && product?.name ? product.name : '';
    return !/patron add-on/i.test(name);
  }) || items[0];
  const recurring = membershipItem?.price?.recurring;
  return recurring?.interval === 'year' ? recurring.interval_count ?? 1 : null;
}

function patronFromMetadata(meta) {
  if (!meta) return undefined;
  if (meta.patron === 'true') return true;
  if (meta.patron === 'false') return false;
  return undefined;
}

// Shared DB is live before this migration is pasted. If `patron` is missing,
// still write the membership columns so checkout cannot fail open.
async function updateProfileMembership(admin, matchCol, matchVal, update) {
  let result = await admin.from('profiles').update(update).eq(matchCol, matchVal).select('id');
  if (result.error && update.patron !== undefined && /patron/i.test(result.error.message || '')) {
    const { patron: _ignored, ...rest } = update;
    result = await admin.from('profiles').update(rest).eq(matchCol, matchVal).select('id');
  }
  if (result.error) throw result.error;
  return result.data;
}

function idOf(v) {
  return typeof v === 'string' ? v : v?.id ?? null;
}

// After an existing member pays the dashboard Patron upgrade, attach the
// matching-term recurring item to their current membership subscription so
// renewals keep the charge. Do not prorate — they just paid the current term.
async function attachPatronRecurringItem(stripe, customerId, duration) {
  if (!customerId || duration === 'lifetime') return;
  const years = Number(duration);
  const term = Number.isFinite(years) && years >= 1 ? years : 1;
  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 20,
    expand: ['data.items.data.price.product'],
  });
  const sub = listed.data.find((s) => s.metadata?.type !== 'donation');
  if (!sub) return;

  if (!subscriptionHasPatronItem(sub)) {
    const line = patronLineItem(term);
    await stripe.subscriptionItems.create({
      subscription: sub.id,
      price_data: line.price_data,
      quantity: 1,
      proration_behavior: 'none',
    });
  }

  await stripe.subscriptions.update(sub.id, {
    metadata: { ...sub.metadata, patron: 'true' },
  });
}

// Insert a donation, ignoring duplicates so Stripe's event retries are safe.
// One-time gifts conflict on stripe_session_id; recurring cycles on
// stripe_invoice_id (both unique). Donations NEVER touch the membership columns.
async function recordDonation(admin, row) {
  const onConflict = row.stripe_invoice_id ? 'stripe_invoice_id' : 'stripe_session_id';
  const { error } = await admin
    .from('donations')
    .upsert(row, { onConflict, ignoreDuplicates: true });
  if (error) throw error;
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

        // Donations are a separate flow — record the gift, never membership.
        // One-time gifts are captured here; recurring gifts are captured per
        // cycle by invoice.paid (including the first), so skip subscription mode.
        if (session.metadata?.type === 'donation') {
          if (session.mode === 'payment') {
            const donationRow = {
              user_id: session.client_reference_id || session.metadata?.supabase_user_id || null,
              donor_email: session.customer_details?.email || session.customer_email || null,
              donor_name: session.customer_details?.name || null,
              amount: session.amount_total,
              currency: session.currency || 'usd',
              frequency: 'once',
              status: 'succeeded',
              stripe_customer_id: idOf(session.customer),
              stripe_session_id: session.id,
              stripe_payment_intent_id: idOf(session.payment_intent),
            };
            await recordDonation(admin, donationRow);
            await maybeDonationThanks(admin, donationRow);
          }
          break;
        }

        // Checkout from /join and Payment Links from /join/invoice both stamp
        // supabase_user_id (+ tier / duration / patron) so this is one path.
        const userId = session.client_reference_id || session.metadata?.supabase_user_id;
        if (!userId) break;

        // Dashboard Patron upgrade: write the flag only. Do not rewrite tier /
        // status / years and do not send a welcome email.
        if (session.metadata?.addon === 'patron_upgrade') {
          if (session.payment_status && session.payment_status !== 'paid') break;
          await updateProfileMembership(admin, 'id', userId, { patron: true });
          try {
            await attachPatronRecurringItem(
              stripe,
              idOf(session.customer),
              session.metadata.duration
            );
          } catch (err) {
            console.error('stripe-webhook: attach patron item failed:', err.message || err);
          }
          break;
        }

        let update;
        // membership_tier comes only from metadata.tier (fellow / sustaining / …).
        // metadata.patron is an add-on flag and must never be stored as a tier.
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price.product'],
          });
          update = {
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || subscription.metadata?.tier || null,
            membership_status: membershipStatus(subscription.status),
            renews_on: renewsOn(subscription),
            cancel_at_period_end: willCancel(subscription),
            membership_years: termYears(subscription),
            patron: patronFromMetadata(session.metadata) ?? patronFromMetadata(subscription.metadata) ?? false,
          };
        } else if (session.mode === 'payment' && session.metadata?.duration === 'lifetime') {
          // Lifetime membership (Legacy): one-time payment, never expires.
          update = {
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || null,
            membership_status: 'active',
            renews_on: null,
            cancel_at_period_end: false,
            membership_years: null, // lifetime — no term
            patron: patronFromMetadata(session.metadata) ?? false,
          };
        } else {
          break; // some other one-time payment (e.g. future donations) — not membership
        }

        await updateProfileMembership(admin, 'id', userId, update);
        // New paid membership (subscription or lifetime) → welcome once.
        // Renewals are handled on invoice.paid (billing_reason=subscription_cycle).
        if (update.membership_status === 'active') {
          await maybeMemberEmail('welcome', admin, userId);
        }
        break;
      }

      // Renewals, payment failures, tier changes via the portal, cancellations.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Recurring donations are subscriptions too — never let their lifecycle
        // events touch the membership columns.
        if (subscription.metadata?.type === 'donation') break;
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
          membership_years: termYears(subscription),
        };
        if (subscription.metadata?.tier) update.membership_tier = subscription.metadata.tier;
        const patronFlag = patronFromMetadata(subscription.metadata);
        if (patronFlag !== undefined) update.patron = patronFlag;

        const updated = await updateProfileMembership(admin, matchCol, matchVal, update);
        // A zero-row match is silent data loss — make it visible in the logs.
        if (!updated?.length) {
          console.error(`stripe-webhook: ${event.type}: no profile matched ${matchCol}=${matchVal}`);
        }
        break;
      }

      // Recurring donations: one row per successful monthly charge. Membership
      // renewals also fire this — send renewal email only for membership
      // subscription_cycle (not the first invoice after checkout).
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subDetails = invoice.parent?.subscription_details;
        const meta = subDetails?.metadata || invoice.subscription_details?.metadata || {};

        if (meta.type === 'donation') {
          const donationRow = {
            user_id: meta.supabase_user_id || null,
            donor_email: invoice.customer_email || null,
            donor_name: invoice.customer_name || null,
            amount: invoice.amount_paid,
            currency: invoice.currency || 'usd',
            frequency: 'monthly',
            status: 'succeeded',
            stripe_customer_id: idOf(invoice.customer),
            stripe_subscription_id: idOf(subDetails?.subscription) || idOf(invoice.subscription),
            stripe_invoice_id: invoice.id,
          };
          await recordDonation(admin, donationRow);
          await maybeDonationThanks(admin, donationRow);
          break;
        }

        // Membership renewal thank-you (not first invoice — that pairs with checkout welcome).
        const reason = invoice.billing_reason;
        if (reason === 'subscription_cycle') {
          const userId = meta.supabase_user_id || null;
          if (userId) {
            await maybeMemberEmail('renewal', admin, userId);
          } else if (invoice.customer) {
            const { data: row } = await admin
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', idOf(invoice.customer))
              .maybeSingle();
            if (row?.id) await maybeMemberEmail('renewal', admin, row.id);
          }
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
