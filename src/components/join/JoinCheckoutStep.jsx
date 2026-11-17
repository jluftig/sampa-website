import React from 'react';
import { Link } from 'react-router-dom';
import CheckoutProgress from './CheckoutProgress';
import { formatDateOnly } from '../../lib/format';
import { checkoutBlock } from '../../lib/joinFlow';

export default function JoinCheckoutStep({
  phase,
  canceled,
  cart,
  profile,
  smsOptIn,
  busy,
  error,
  screen,
  signInHref,
  greeting = 'Welcome',
  onEditMembership,
  onEditSupport,
  invoiceQuery,
}) {
  const block = checkoutBlock(profile);
  const through = profile?.renews_on ? formatDateOnly(profile.renews_on) : '';
  const renewed = profile?.membership_status === 'active';

  return (
    <div>
      <CheckoutProgress phase={phase} />
      {canceled && phase === 'review' && (
        <p className="mb-4 rounded-2xl border border-text/10 bg-text/5 px-4 py-3 text-sm">Checkout was canceled — no charge was made.</p>
      )}
      {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {phase === 'confirmation' ? (
        <section className="rounded-3xl border border-primary/10 bg-white p-5">
          {screen === 'sign_in' ? (
            <>
              <h2 className="text-2xl font-bold">Sign in to confirm your payment</h2>
              <p className="mt-2 text-sm text-text/70">This page does not treat the link itself as proof of payment.</p>
              <Link to={signInHref || '/login'} className="mt-4 inline-flex min-h-12 items-center font-semibold text-primary-text">Sign in</Link>
            </>
          ) : screen === 'unconfirmed' ? (
            <>
              <h2 className="text-2xl font-bold">We could not confirm this payment</h2>
              <p className="mt-2 text-sm text-text/70">Nothing was recorded from this page. If Stripe charged you, the receipt is in your email. You can also check your account after you sign in.</p>
              <Link to="/dashboard" className="mt-4 inline-flex min-h-12 items-center font-semibold text-primary-text">Go to my account</Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">
                {screen === 'waiting' ? 'Confirming your payment…' : renewed ? greeting : 'Payment received'}
              </h2>
              {through && renewed && <p className="mt-2 text-text/70">Through {through}.</p>}
              {!through && renewed && screen === 'active' && <p className="mt-2 text-text/70">Your membership is active.</p>}
              {screen === 'waiting' || screen === 'paid_waiting' ? (
                <p className="mt-2 text-sm text-text/60">This usually takes a few seconds. You can leave this page.</p>
              ) : null}
              <p className="mt-3 text-sm text-text/60">Stripe emails your receipt. SAMPA never sees your card.</p>
              <Link to="/survey/2026" className="mt-5 block rounded-3xl border border-accent/30 bg-accent/5 p-4">
                <span className="block font-bold">2-minute 2026 member survey</span>
                <span className="mt-1 block text-sm text-text/70">Optional. It does not affect your membership.</span>
              </Link>
              <Link to="/dashboard" className="mt-4 inline-flex min-h-12 items-center font-semibold text-primary-text">Go to my account</Link>
            </>
          )}
        </section>
      ) : phase === 'payment' ? (
        <section className="rounded-3xl border border-primary/10 bg-white p-5">
          <h2 className="text-xl font-bold">Payment</h2>
          <p className="mt-2 text-sm text-text/70">{busy ? 'Opening secure checkout…' : 'Stripe Checkout is ready.'}</p>
        </section>
      ) : (
        <section className="rounded-3xl border border-primary/10 bg-white p-5">
          <h2 className="text-xl font-bold">Review</h2>
          {block ? (
            <div className="mt-4 text-sm">
              <p>{block === 'lifetime' ? 'Your lifetime membership is already active.' : 'You’re all set. Auto-renew is already on.'}</p>
              <p className="mt-3">
                <Link to="/dashboard" className="font-semibold text-primary-text underline">Open billing on your dashboard</Link>
              </p>
            </div>
          ) : cart?.total == null ? (
            <p className="mt-4 text-sm">Choose a membership to see the total.</p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt>{cart.tierName} · {cart.termLabel}</dt>
                <dd>${cart.dues}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Auto-renew</dt>
                <dd>{cart.autoRenew ? 'Yes' : 'No'}</dd>
              </div>
              {cart.patron && (
                <div className="flex justify-between gap-4">
                  <dt>Patron</dt>
                  <dd>${cart.patronAmount}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-primary/10 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>${cart.total}</dd>
              </div>
            </dl>
          )}
          {smsOptIn && !block && (
            <p className="mt-4 text-sm">You’re signed up for SAMPA text updates. Enter code <strong className="font-mono">SAMPATEXT5</strong> at checkout for 5% off your dues.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <button type="button" className="min-h-12 font-semibold text-primary-text underline" onClick={onEditMembership}>Edit membership</button>
            <button type="button" className="min-h-12 font-semibold text-primary-text underline" onClick={onEditSupport}>Edit support</button>
          </div>
          {!block && (
            <p className="mt-2 text-sm">
              <Link to={`/join/invoice?${invoiceQuery}`} className="text-text/60 underline">Need an invoice for your employer?</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
