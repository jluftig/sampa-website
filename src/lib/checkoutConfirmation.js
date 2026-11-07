// What the join confirmation screen is allowed to claim.
// A query string and a timer are not payment. An already-active membership
// is not this checkout. A paid Stripe receipt is. A profile that becomes
// active during this visit still covers a return URL minted before session
// ids existed, and that path does not report an ad conversion.

export function checkoutConfirmation({
  phase,
  receiptStatus,
  receipt,
  profileStatus,
  arrivalStatus,
}) {
  const idle = {
    screen: 'checkout',
    claimPayment: false,
    claimActive: false,
    sendConversion: false,
  };
  if (phase !== 'confirmation') return idle;
  if (receiptStatus === 'signed_out') {
    return { screen: 'sign_in', claimPayment: false, claimActive: false, sendConversion: false };
  }
  if (receiptStatus === 'idle' || receiptStatus === 'loading' || arrivalStatus === undefined) {
    return { screen: 'waiting', claimPayment: false, claimActive: false, sendConversion: false };
  }

  const outcome = receipt?.outcome;
  const paidMembership = outcome === 'new_membership' || outcome === 'renewal';
  if (paidMembership) {
    const active = profileStatus === 'active';
    return {
      screen: active ? 'active' : 'paid_waiting',
      claimPayment: true,
      claimActive: active,
      sendConversion: outcome === 'new_membership' && Boolean(receipt?.transactionId),
    };
  }

  const legacyReturn = !receipt?.transactionId && (outcome === 'unknown' || outcome == null);
  const becameActive = arrivalStatus !== 'active' && profileStatus === 'active';
  if (legacyReturn && becameActive) {
    return { screen: 'active', claimPayment: true, claimActive: true, sendConversion: false };
  }
  return { screen: 'unconfirmed', claimPayment: false, claimActive: false, sendConversion: false };
}

export function previewConfirmation(phase, profile) {
  if (phase !== 'confirmation') {
    return { screen: 'checkout', claimPayment: false, claimActive: false, sendConversion: false };
  }
  const active = profile?.membership_status === 'active';
  return {
    screen: active ? 'active' : 'paid_waiting',
    claimPayment: true,
    claimActive: active,
    sendConversion: false,
  };
}
