import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { MEMBERSHIP_TIERS, tierByKey, savingsPercent, durationsForTier, durationLabel } from '../lib/membership';
import { apiPost } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Join flow, account-first: sign in (1 click) → pick a tier + term → Stripe
// Checkout. Checkout is created server-side with the user's id as
// client_reference_id, so the webhook can activate the right profile without
// email matching. Terms: 1/2/3-year auto-renewing subscriptions (multi-year
// at a discount), plus a one-time Lifetime option on Legacy.
export default function Join() {
  const { user, loading, profile, isActiveMember } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('checkout') === 'canceled';

  // Selected term per tier card, defaulting to 1 year.
  const [terms, setTerms] = useState({});
  const [busyTier, setBusyTier] = useState(null);
  const [error, setError] = useState(null);

  const termFor = (tier) => terms[tier.key] ?? 1;

  const selectTier = async (tierKey) => {
    setError(null);
    const duration = terms[tierKey] ?? 1;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/join?tier=${tierKey}`)}`);
      return;
    }
    setBusyTier(tierKey);
    try {
      const { url } = await apiPost('/api/create-checkout-session', { tier: tierKey, duration });
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setBusyTier(null);
    }
  };

  const currentTier = tierByKey(profile?.membership_tier);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-6 font-data uppercase tracking-wider">
            Membership
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">Join SAMPA</h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            {user
              ? 'Pick the membership level that fits your career stage — payment is handled securely by Stripe.'
              : 'Two quick steps: sign in (one click, no password), then pick your membership level.'}
          </p>
          {user && !isActiveMember && (
            <p className="text-text/40 text-xs mt-4 max-w-xl mx-auto">
              You're signed in as <strong className="text-text/60">{user.email}</strong>.
              Already a member under a different email? Sign out from your{' '}
              <Link to="/dashboard" className="underline hover:text-primary">dashboard</Link>{' '}
              and sign back in with that address instead of paying again.
            </p>
          )}
        </header>

        {canceled && (
          <div className="max-w-2xl mx-auto bg-text/5 border border-text/10 rounded-2xl p-5 mb-10 text-center text-sm text-text/70">
            Checkout was canceled — no charge was made. Pick a tier whenever you're ready.
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-5 mb-10 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {user && profile?.sms_opt_in && !isActiveMember && (
          <div className="max-w-2xl mx-auto bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-10 text-center text-sm text-text/80">
            You're signed up for SAMPA text updates — enter code{' '}
            <strong className="font-data tracking-wider">SAMPATEXT5</strong> at checkout
            for 5% off your dues.
          </div>
        )}

        {isActiveMember && (
          <div className="max-w-2xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-10 text-center">
            <p className="font-semibold text-primary mb-1">
              You're already an active member{currentTier ? ` (${currentTier.name})` : ''}. 🎉
            </p>
            <p className="text-sm text-text/70">
              To change tiers, update your card, or cancel, use the billing portal on your{' '}
              <Link to="/dashboard" className="text-primary font-semibold hover:underline">dashboard</Link>{' '}
              — starting a second checkout here would create a duplicate subscription.
            </p>
          </div>
        )}

        {/* Multi-year discount callout (mirrors the homepage) */}
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-3xl p-6 mb-12 flex items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-full text-primary shrink-0 shadow-sm">
            <Star className="w-6 h-6 fill-primary/10" />
          </div>
          <p className="text-text/80 text-sm">
            <strong>Multi-year discounts:</strong> save ~10% on a 2-year term and up
            to ~20% on 3 years — pick your term on the card below. Memberships
            auto-renew at the end of the term and are easy to cancel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => {
            const duration = termFor(tier);
            const isLifetime = duration === 'lifetime';
            const price = isLifetime ? tier.lifetime : tier.prices[duration];
            const savings = !isLifetime ? savingsPercent(tier, duration) : 0;
            return (
              <div
                key={tier.key}
                className={`${tier.highlight ? 'bg-text text-white border-accent shadow-2xl' : 'bg-white border-primary/10 text-text'} p-8 rounded-4xl border shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
              >
                {tier.highlight && (
                  <div className="absolute top-6 -right-10 w-40 text-center bg-accent rotate-45 py-1 text-xs font-bold font-data tracking-wider uppercase shadow-md text-white">
                    Featured
                  </div>
                )}
                <div className="relative z-10">
                  <h3 className="text-xl tracking-tight font-bold mb-2">{tier.name}</h3>
                  <p className={`${tier.highlight ? 'text-white/70' : 'text-text/60'} text-sm mb-5 h-10`}>{tier.desc}</p>

                  {/* Term picker */}
                  <div className="flex flex-wrap gap-1.5 mb-5" role="radiogroup" aria-label={`${tier.name} term`}>
                    {durationsForTier(tier).map((d) => {
                      const active = duration === d;
                      const pct = d !== 'lifetime' ? savingsPercent(tier, d) : 0;
                      return (
                        <button
                          key={d}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setTerms({ ...terms, [tier.key]: d })}
                          className={`px-3 py-1.5 rounded-full text-xs font-data font-semibold border transition-colors ${
                            active
                              ? tier.highlight
                                ? 'bg-accent border-accent text-white'
                                : 'bg-primary border-primary text-white'
                              : tier.highlight
                                ? 'border-white/30 text-white/70 hover:border-white'
                                : 'border-primary/20 text-text/60 hover:border-primary'
                          }`}
                        >
                          {durationLabel(d)}
                          {pct > 0 && ` · −${pct}%`}
                        </button>
                      );
                    })}
                  </div>

                  <div className={`text-4xl font-bold font-sans mb-2 ${tier.highlight ? 'text-white' : 'text-primary'}`}>
                    ${price}
                    <span className={`text-lg font-normal ${tier.highlight ? 'text-white/50' : 'text-text/50'}`}>
                      {isLifetime ? ' once' : duration === 1 ? '/yr' : ` / ${duration} yrs`}
                    </span>
                  </div>
                  <p className={`text-xs mb-6 h-4 ${tier.highlight ? 'text-white/50' : 'text-text/40'}`}>
                    {isLifetime
                      ? 'One payment, member for life.'
                      : savings > 0
                        ? `Saves ${savings}% vs. paying annually.`
                        : ''}
                  </p>
                </div>
                <button
                  onClick={() => selectTier(tier.key)}
                  disabled={loading || busyTier !== null || isActiveMember}
                  className={`block text-center w-full py-3.5 rounded-full font-bold transition-colors relative z-10 disabled:opacity-50 ${tier.highlight ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg' : 'border-2 border-primary text-primary hover:bg-primary/5'}`}
                >
                  {busyTier === tier.key
                    ? 'Opening checkout…'
                    : user
                      ? 'Continue to payment'
                      : 'Sign in to join'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-text/40 text-xs mt-10 max-w-xl mx-auto">
          Payments are processed by Stripe — SAMPA never sees or stores your card
          details. You'll get a receipt by email, and you can manage billing anytime
          from your dashboard. Multi-year terms renew at the end of the term until
          canceled. By joining you agree to our{' '}
          <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link> and{' '}
          <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
