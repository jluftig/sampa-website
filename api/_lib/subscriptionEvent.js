// Which Stripe subscription event is allowed to rewrite the member's row.
// A renewal can overlap the old term. The newest membership subscription wins.
// Donation subscriptions never count.

export function subscriptionEventApplies(eventSubscription, otherActive = []) {
  if (!eventSubscription || eventSubscription.metadata?.type === 'donation') return false;
  const pool = [
    eventSubscription,
    ...otherActive.filter((sub) => (
      sub
      && sub.id !== eventSubscription.id
      && sub.metadata?.type !== 'donation'
    )),
  ];
  const newest = pool.reduce((best, sub) => (
    (sub.created || 0) > (best.created || 0) ? sub : best
  ));
  return newest.id === eventSubscription.id;
}

// Live subscription, not the event snapshot. A late snapshot from before
// cancel_at_period_end was set must not turn auto-renew back on. A portal
// resume is the live object, so checkout metadata does not force it off again.
export function subscriptionUpdateSource({ eventSubscription, freshSubscription }) {
  return freshSubscription || eventSubscription;
}

export function cancelAtPeriodEndFromStripe(subscription) {
  return subscription?.cancel_at_period_end === true || Boolean(subscription?.cancel_at);
}
