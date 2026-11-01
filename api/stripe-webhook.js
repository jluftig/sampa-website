import { stripeClient, supabaseAdmin, json } from './_lib/clients.js';
import { profileCancelAtPeriodEnd, stripeShouldForceCancelAtPeriodEnd } from './_lib/autoRenew.js';
import {
  cancelAtPeriodEndFromStripe,
  subscriptionEventApplies,
  subscriptionUpdateSource,
} from './_lib/subscriptionEvent.js';
import { patronLineItem, subscriptionHasPatronItem } from './_lib/tiers.js';
import {
  chargeIsFullyRefunded,
  chooseDonorProfile,
  donatedAtFromGifts,
  donationIsSuccessful,
  donorMatchFields,
  giftMatchesProfile,
  isoFromStripeUnix,
  nextDonatedAt,
  normalizeEmail,
  paymentIdsFromInvoice,
} from './_lib/donorBadge.js';
import {
  memberEmailsEnabled,
  profileForEmail,
  sendMemberLifecycleEmail,
  addMemberToUpdatesList,
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
  try {
    const profile = await profileForEmail(admin, userId);
    if (!profile?.email) {
      console.warn(`stripe-webhook: member ${kind} email skipped — no email for user ${userId}`);
      return;
    }
    if (memberEmailsEnabled()) {
      const result = await sendMemberLifecycleEmail(kind, {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      console.log(`stripe-webhook: member ${kind} email`, result);
    }
    if (kind === 'welcome' || kind === 'renewal') {
      const sync = await addMemberToUpdatesList({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        newsletterOptIn: profile.newsletterOptIn,
        source: 'membership',
      });
      console.log(`stripe-webhook: member Updates sync`, sync);
    }
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
  return cancelAtPeriodEndFromStripe(subscription);
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

// Load candidate profiles in match order. A user id never falls through.
// A customer with any rows does not fall through to email. Zero customer rows do.
async function loadDonorCandidates(admin, { userId, stripeCustomerId, email }) {
  const columns = 'id, stripe_customer_id, email';
  if (userId) {
    const { data, error } = await admin.from('profiles').select(columns).eq('id', userId).maybeSingle();
    if (error) throw error;
    return data ? [data] : [];
  }
  if (stripeCustomerId) {
    const { data, error } = await admin.from('profiles').select(columns).eq('stripe_customer_id', stripeCustomerId);
    if (error) throw error;
    if (data?.length) return data;
  }
  const needle = normalizeEmail(email);
  if (!needle) return [];
  const pattern = needle.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  const { data, error } = await admin.from('profiles').select(columns).ilike('email', pattern);
  if (error) throw error;
  return data || [];
}

const DONATION_COLUMNS = 'id, user_id, donor_email, stripe_customer_id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, status, amount, created_at';

// Move profiles.donated_at forward to this gift. Does not touch membership columns.
// The donation row uses snake_case. donorMatchFields maps those names.
async function stampDonatedAt(admin, fields) {
  const match = donorMatchFields(fields);
  if (!donationIsSuccessful(match)) return;
  const profileId = chooseDonorProfile(await loadDonorCandidates(admin, match), match);
  if (!profileId) {
    console.warn('stripe-webhook: donation matched no single profile');
    return;
  }
  const { data: row, error } = await admin.from('profiles').select('donated_at').eq('id', profileId).maybeSingle();
  if (error) throw error;
  const next = nextDonatedAt(row?.donated_at, match.paidAt);
  if (!next) return;
  if (row?.donated_at && new Date(row.donated_at).getTime() === new Date(next).getTime()) return;
  const { error: updateError } = await admin.from('profiles').update({ donated_at: next }).eq('id', profileId);
  if (updateError) throw updateError;
}

async function findDonation(admin, { paymentIntentId, chargeId, invoiceId }) {
  const lookups = [
    [paymentIntentId, 'stripe_payment_intent_id'],
    [chargeId, 'stripe_charge_id'],
    [invoiceId, 'stripe_invoice_id'],
  ];
  for (const [value, column] of lookups) {
    if (!value) continue;
    const { data, error } = await admin
      .from('donations')
      .select(DONATION_COLUMNS)
      .eq(column, value)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

// Charge.invoice is not on the Charge object. The invoice id comes from the
// Invoice Payment list for this PaymentIntent, after a charge is reduced to
// its PaymentIntent.
async function invoiceIdForPayment(stripe, { paymentIntentId, chargeId }) {
  if (!stripe?.invoicePayments?.list) return null;
  let intentId = paymentIntentId || null;
  if (!intentId && chargeId && stripe.charges?.retrieve) {
    const charge = await stripe.charges.retrieve(chargeId);
    intentId = idOf(charge?.payment_intent);
  }
  if (!intentId) return null;
  const listed = await stripe.invoicePayments.list({
    payment: { type: 'payment_intent', payment_intent: intentId },
    limit: 1,
  });
  return idOf(listed?.data?.[0]?.invoice);
}

async function loadCharge(stripe, { paymentIntentId, chargeId }) {
  if (!stripe) return null;
  if (chargeId && stripe.charges?.retrieve) {
    return stripe.charges.retrieve(chargeId);
  }
  if (paymentIntentId && stripe.paymentIntents?.retrieve) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
    if (intent?.latest_charge && typeof intent.latest_charge === 'object') return intent.latest_charge;
    if (typeof intent?.latest_charge === 'string' && stripe.charges?.retrieve) {
      return stripe.charges.retrieve(intent.latest_charge);
    }
  }
  return null;
}

async function donationsTouchingProfile(admin, profile) {
  const found = new Map();
  const take = (rows) => {
    for (const row of rows || []) {
      if (row?.id) found.set(row.id, row);
    }
  };
  const byUser = await admin.from('donations').select(DONATION_COLUMNS).eq('user_id', profile.id);
  if (byUser.error) throw byUser.error;
  take(byUser.data);
  if (profile.stripe_customer_id) {
    const byCustomer = await admin.from('donations').select(DONATION_COLUMNS).eq('stripe_customer_id', profile.stripe_customer_id);
    if (byCustomer.error) throw byCustomer.error;
    take(byCustomer.data);
  }
  const email = normalizeEmail(profile.email);
  if (email) {
    const pattern = email.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const byEmail = await admin.from('donations').select(DONATION_COLUMNS).ilike('donor_email', pattern);
    if (byEmail.error) throw byEmail.error;
    take(byEmail.data);
  }
  return [...found.values()];
}

// A refund or a dispute drops that gift. donated_at becomes the latest
// remaining succeeded gift inside 12 months, or null when none remain.
// A charge that is not in donations is a membership payment and is ignored.
async function reverseDonation(admin, stripe, { paymentIntentId, chargeId, status, now = new Date() }) {
  let donation = await findDonation(admin, { paymentIntentId, chargeId });
  if (!donation) {
    const invoiceId = await invoiceIdForPayment(stripe, { paymentIntentId, chargeId });
    donation = await findDonation(admin, { invoiceId });
  }
  if (!donation) return null;
  const { error } = await admin.from('donations').update({ status }).eq('id', donation.id);
  if (error) throw error;
  const match = donorMatchFields(donation);
  const profileId = chooseDonorProfile(await loadDonorCandidates(admin, match), match);
  if (!profileId) return null;
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, stripe_customer_id, email')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;
  const gifts = (await donationsTouchingProfile(admin, profile)).filter((gift) => giftMatchesProfile(gift, profile));
  const next = donatedAtFromGifts(gifts, now);
  const { error: updateError } = await admin.from('profiles').update({ donated_at: next }).eq('id', profileId);
  if (updateError) throw updateError;
  return { profileId, donatedAt: next };
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
    await handleStripeEvent(event, { stripe, admin });
  } catch (err) {
    console.error(`stripe-webhook: ${event.type} handler failed:`, err);
    return new Response('Webhook handler failed', { status: 500 }); // Stripe retries
  }

  return json({ received: true });
}

export async function handleStripeEvent(event, { stripe, admin }) {
  switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Donations are a separate flow — record the gift, never membership.
        // One-time gifts are captured here; recurring gifts are captured per
        // cycle by invoice.paid (including the first), so skip subscription mode.
        if (session.metadata?.type === 'donation') {
          if (session.mode === 'payment') {
            const paymentIntentId = idOf(session.payment_intent);
            const paidAt = isoFromStripeUnix(session.created);
            const charge = await loadCharge(stripe, { paymentIntentId });
            const fullyRefunded = chargeIsFullyRefunded(charge);
            const donationRow = {
              user_id: session.client_reference_id || session.metadata?.supabase_user_id || null,
              donor_email: session.customer_details?.email || session.customer_email || null,
              donor_name: session.customer_details?.name || null,
              amount: session.amount_total,
              currency: session.currency || 'usd',
              frequency: 'once',
              status: fullyRefunded ? 'refunded' : 'succeeded',
              stripe_customer_id: idOf(session.customer),
              stripe_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId,
              stripe_charge_id: charge?.id || null,
              created_at: paidAt,
            };
            await recordDonation(admin, donationRow);
            if (fullyRefunded) {
              await reverseDonation(admin, stripe, {
                paymentIntentId,
                chargeId: charge?.id || null,
                status: 'refunded',
              });
            } else {
              await stampDonatedAt(admin, {
                ...donationRow,
                paymentStatus: session.payment_status,
                paidAt,
              });
              await maybeDonationThanks(admin, donationRow);
            }
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
          let subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price.product'],
          });
          if (stripeShouldForceCancelAtPeriodEnd({
            mode: session.mode,
            metadata: session.metadata,
            subscriptionWillCancel: willCancel(subscription),
          })) {
            subscription = await stripe.subscriptions.update(session.subscription, {
              cancel_at_period_end: true,
            });
          }
          update = {
            stripe_customer_id: session.customer,
            membership_tier: session.metadata?.tier || subscription.metadata?.tier || null,
            membership_status: membershipStatus(subscription.status),
            renews_on: renewsOn(subscription),
            cancel_at_period_end: profileCancelAtPeriodEnd({
              mode: session.mode,
              metadata: session.metadata,
              subscriptionWillCancel: willCancel(subscription),
            }),
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

        let live = subscription;
        if (event.type === 'customer.subscription.updated') {
          live = subscriptionUpdateSource({
            eventSubscription: subscription,
            freshSubscription: await stripe.subscriptions.retrieve(subscription.id, {
              expand: ['items.data.price.product'],
            }),
          });
        }

        const customerId = typeof live.customer === 'string' ? live.customer : live.customer?.id;
        if (!customerId) {
          throw new Error('stripe-webhook: subscription event has no customer');
        }
        const listed = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 100,
        });
        if (listed.has_more) {
          throw new Error('stripe-webhook: subscription list was truncated');
        }
        // A second checkout can overlap a term that is already ending. The
        // leftover subscription's later cancel must not erase the new row.
        // A failed or incomplete list throws above so Stripe retries. An empty
        // successful list still means this event is the only subscription.
        if (!subscriptionEventApplies(live, listed.data || [], { listOk: true })) break;

        const update = {
          membership_status: membershipStatus(live.status),
          renews_on: renewsOn(live),
          cancel_at_period_end:
            event.type !== 'customer.subscription.deleted' && willCancel(live),
          membership_years: termYears(live),
        };
        if (live.metadata?.tier) update.membership_tier = live.metadata.tier;
        const patronFlag = patronFromMetadata(live.metadata);
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
          const ids = paymentIdsFromInvoice(invoice);
          const paidAt = isoFromStripeUnix(invoice.status_transitions?.paid_at || invoice.created);
          const charge = await loadCharge(stripe, ids);
          const fullyRefunded = chargeIsFullyRefunded(charge);
          const donationRow = {
            user_id: meta.supabase_user_id || null,
            donor_email: invoice.customer_email || null,
            donor_name: invoice.customer_name || null,
            amount: invoice.amount_paid,
            currency: invoice.currency || 'usd',
            frequency: 'monthly',
            status: fullyRefunded ? 'refunded' : 'succeeded',
            stripe_customer_id: idOf(invoice.customer),
            stripe_subscription_id: idOf(subDetails?.subscription) || idOf(invoice.subscription),
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: ids.paymentIntentId,
            stripe_charge_id: charge?.id || ids.chargeId,
            created_at: paidAt,
          };
          await recordDonation(admin, donationRow);
          if (fullyRefunded) {
            await reverseDonation(admin, stripe, {
              paymentIntentId: donationRow.stripe_payment_intent_id,
              chargeId: donationRow.stripe_charge_id,
              status: 'refunded',
            });
          } else {
            await stampDonatedAt(admin, {
              ...donationRow,
              paidAt,
            });
            await maybeDonationThanks(admin, donationRow);
          }
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

      // A fully refunded or disputed gift leaves the Donor window. A partial
      // refund does not. Membership charges have no donations row, so they
      // do not change donated_at. The invoice is resolved from the PaymentIntent,
      // never from charge.invoice.
      case 'charge.refunded': {
        const charge = event.data.object;
        if (!chargeIsFullyRefunded(charge)) break;
        await reverseDonation(admin, stripe, {
          paymentIntentId: idOf(charge.payment_intent),
          chargeId: charge.id,
          status: 'refunded',
        });
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object;
        await reverseDonation(admin, stripe, {
          paymentIntentId: idOf(dispute.payment_intent),
          chargeId: idOf(dispute.charge),
          status: 'disputed',
        });
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object;
        if (dispute.status !== 'won') break;
        await reverseDonation(admin, stripe, {
          paymentIntentId: idOf(dispute.payment_intent),
          chargeId: idOf(dispute.charge),
          status: 'succeeded',
        });
        break;
      }

      default:
        break; // Not a subscribed event type — acknowledge and ignore.
  }
}
