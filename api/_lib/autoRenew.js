// Profile flag written from a join checkout. auto_renew=false wins even when
// the Subscription object has not caught up yet. The webhook then tells
// Stripe to set cancel_at_period_end so the paid term does not renew.

export function profileCancelAtPeriodEnd({ mode, metadata, subscriptionWillCancel }) {
  if (mode !== 'subscription') return false;
  if (metadata?.auto_renew === 'false') return true;
  return subscriptionWillCancel === true;
}

export function stripeShouldForceCancelAtPeriodEnd({ mode, metadata, subscriptionWillCancel }) {
  return mode === 'subscription'
    && metadata?.auto_renew === 'false'
    && subscriptionWillCancel !== true;
}
