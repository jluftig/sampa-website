import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';
import { requestSiteOrigin } from './_lib/siteUrl.js';
import {
  buildCheckoutSessionParams,
  duplicateMembershipBlock,
  membershipConversionKind,
  priorPaidFromInvoiceList,
} from './_lib/checkoutSession.js';
import { classifyCheckoutSession, emptyReceipt, isCheckoutSessionId, publicReceipt } from './_lib/membershipReceipt.js';

// POST { tier, duration, patron?, auto_renew? } → { url } of a Stripe Checkout session.
// auto_renew defaults true. false keeps the same Price and sets cancel_at_period_end.
// duration: 1 | 2 | 3 (years; a subscription billed every N years) or
// 'lifetime' (one-time payment, Legacy only). Optional `patron: true` adds a
// matching-term price_data line item (+$25 × term years; lifetime +$25 once)
// — not a seventh tier, not a required STRIPE_PRICE_* env, never written as
// membership_tier. Sign-in first: the Supabase user id rides along as
// client_reference_id and metadata, so the webhook can update exactly the
// right profiles row — the Stripe↔Supabase link is never inferred from email.
export async function GET(request, deps = {}) {
  const require = deps.requireUser || requireUser;
  const user = await require(request);
  if (!user) return json(emptyReceipt('unknown'), 401);

  let sessionId = '';
  try {
    sessionId = new URL(request.url).searchParams.get('session_id') || '';
  } catch {
    sessionId = '';
  }
  if (!isCheckoutSessionId(sessionId)) return json(emptyReceipt('unknown'));

  try {
    const retrieve = deps.retrieve || ((id) => stripeClient().checkout.sessions.retrieve(id, {
      expand: ['line_items.data.price.product'],
    }));
    const session = await retrieve(sessionId);
    return json(publicReceipt(classifyCheckoutSession(session, user.id)));
  } catch {
    return json(emptyReceipt('unknown'));
  }
}

export async function POST(request, deps = {}) {
  try {
    const require = deps.requireUser || requireUser;
    const user = await require(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const body = await request.json().catch(() => ({}));
    const tier = body.tier;
    const duration = body.duration === 'lifetime' ? 'lifetime' : Number(body.duration) || 1;
    const wantPatron = body.patron === true;
    const autoRenew = body.auto_renew !== false;

    const loadProfile = deps.loadProfile || (async (userId) => {
      const { data: profile } = await supabaseAdmin()
        .from('profiles')
        .select('stripe_customer_id, membership_status, renews_on, cancel_at_period_end')
        .eq('id', userId)
        .maybeSingle();
      return profile;
    });
    const profile = await loadProfile(user.id);

    const block = duplicateMembershipBlock(profile);
    if (block) {
      return json({
        error: 'You already have an active membership. Manage billing from your dashboard instead of starting another subscription.',
      }, 409);
    }

    const listInvoices = deps.listInvoices || (async (customerId) => {
      const list = await stripeClient().invoices.list({
        customer: customerId,
        status: 'paid',
        limit: 100,
      });
      return list;
    });
    let priorPaid;
    const needsPaidProof = profile?.membership_status === 'past_due' || profile?.membership_status === 'canceled';
    if (!needsPaidProof) priorPaid = undefined;
    // No customer id means the paid-invoice lookup cannot run. That is unknown
    // history, not proof the person never paid, so the session gets no
    // new-membership stamp.
    else if (!profile?.stripe_customer_id) priorPaid = null;
    else {
      try {
        priorPaid = priorPaidFromInvoiceList(await listInvoices(profile.stripe_customer_id));
      } catch {
        priorPaid = null;
      }
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
      conversion: membershipConversionKind(profile, { priorPaid }),
    });
    if (built.error) return json({ error: built.error }, 400);

    const createSession = deps.createSession || ((params) => stripeClient().checkout.sessions.create(params));
    const session = await createSession(built.params);

    return json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err);
    return json({ error: 'Could not start checkout' }, 500);
  }
}
