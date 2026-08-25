import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { MEMBERSHIP_TIERS, tierByKey, savingsPercent, durationsForTier, durationLabel, patronDollars, isPaPathTier, suggestedTierForAapa, parseAapaParam } from '../lib/membership';
import { apiPost } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Join flow, one page: pick a tier and term, one-click sign-in, then Stripe
// Checkout. Homepage `#membership` is a scroll tease only — not a required
// first step. `?tier=` from homepage cards is honored: that card is highlighted
// and scrolled into view. Checkout is created server-side with the user's id as
// client_reference_id so the webhook can activate the right profile without
// email matching. Terms: 1/2/3-year auto-renewing subscriptions (multi-year
// at a discount), plus a one-time Lifetime option on Legacy.
// Optional Patron add-on (+$25 × term years) appears after a real tier is
// selected — default off, not a seventh card, never a membership_tier.
// Honor-system AAPA yes/no for PA-path tiers (fellow / sustaining / legacy)
// suggests Fellow vs Certified PA (not AAPA); we do not verify with AAPA.
export default function Join() {
  const { user, loading, profile, isActiveMember } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canceled = searchParams.get('checkout') === 'canceled';
  const tierFromQuery = tierByKey(searchParams.get('tier'));

  // Which tier is the "current choice" for visual focus.
  const [focusedKey, setFocusedKey] = useState(tierFromQuery?.key ?? null);
  const focusedTier = tierByKey(focusedKey) || tierFromQuery;

  // Selected term per tier card, defaulting to 1 year.
  const [terms, setTerms] = useState({});
  const [busyTier, setBusyTier] = useState(null);
  const [error, setError] = useState(null);
  const cardRefs = useRef({});
  const didScrollFor = useRef(null);

  // Keep focus in sync if the URL changes (e.g. back/forward, login return).
  useEffect(() => {
    if (tierFromQuery?.key) setFocusedKey(tierFromQuery.key);
  }, [tierFromQuery?.key]);

  // Scroll the preselected tier into view once per inbound query value.
  useEffect(() => {
    if (!tierFromQuery?.key) return;
    if (didScrollFor.current === tierFromQuery.key) return;
    const el = cardRefs.current[tierFromQuery.key];
    if (!el) return;
    didScrollFor.current = tierFromQuery.key;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => window.clearTimeout(t);
  }, [tierFromQuery?.key]);

  const termFor = (tier) => terms[tier.key] ?? 1;

  const wantPatron = searchParams.get('patron') === '1';
  const aapaFromQuery = parseAapaParam(searchParams.get('aapa'));
  const [aapaAnswer, setAapaAnswer] = useState(
    aapaFromQuery ?? (typeof profile?.aapa_member === 'boolean' ? profile.aapa_member : null)
  );
  const showAapaQuestion = !isActiveMember && (!focusedKey || isPaPathTier(focusedKey));
  const aapaRef = useRef(null);
  const didInitAapa = useRef(false);

  const focusTier = (tierKey) => {
    setFocusedKey(tierKey);
    const next = new URLSearchParams(searchParams);
    next.set('tier', tierKey);
    setSearchParams(next, { replace: true });
  };

  const setWantPatron = (on) => {
    const next = new URLSearchParams(searchParams);
    if (on) next.set('patron', '1');
    else next.delete('patron');
    setSearchParams(next, { replace: true });
  };

  const persistAapaMember = async (value) => {
    if (!user || typeof value !== 'boolean') return;
    const { error: writeError } = await supabase
      .from('profiles')
      .update({ aapa_member: value })
      .eq('id', user.id);
    if (writeError && !/aapa_member/i.test(writeError.message || '')) {
      console.warn('Could not save AAPA answer:', writeError.message);
    }
  };

  const answerAapa = (isAapaMember) => {
    setAapaAnswer(isAapaMember);
    const next = new URLSearchParams(searchParams);
    next.set('aapa', isAapaMember ? '1' : '0');
    const suggested = suggestedTierForAapa(isAapaMember);
    next.set('tier', suggested);
    setFocusedKey(suggested);
    setSearchParams(next, { replace: true });
    persistAapaMember(isAapaMember);
  };

  // URL ?aapa= wins; else hydrate from the signed-in profile once.
  useEffect(() => {
    if (aapaFromQuery !== null) {
      setAapaAnswer(aapaFromQuery);
      return;
    }
    if (didInitAapa.current) return;
    if (typeof profile?.aapa_member !== 'boolean') return;
    didInitAapa.current = true;
    setAapaAnswer(profile.aapa_member);
    if (!searchParams.get('tier')) {
      const suggested = suggestedTierForAapa(profile.aapa_member);
      setFocusedKey(suggested);
      const next = new URLSearchParams(searchParams);
      next.set('tier', suggested);
      next.set('aapa', profile.aapa_member ? '1' : '0');
      setSearchParams(next, { replace: true });
    }
  }, [aapaFromQuery, profile?.aapa_member, searchParams, setSearchParams]);

  useEffect(() => {
    if (user && typeof aapaAnswer === 'boolean') persistAapaMember(aapaAnswer);
  }, [user?.id]); // persist when sign-in lands; answer may already be in the URL

  const joinQuery = (tierKey) => {
    const params = new URLSearchParams();
    params.set('tier', tierKey);
    if (wantPatron) params.set('patron', '1');
    if (typeof aapaAnswer === 'boolean') params.set('aapa', aapaAnswer ? '1' : '0');
    return `/join?${params.toString()}`;
  };

  const selectTier = async (tierKey) => {
    setError(null);
    focusTier(tierKey);
    if (isPaPathTier(tierKey) && aapaAnswer === null) {
      setError('Please tell us whether you are a current AAPA member — it helps us put you on the right dues. We do not verify this with AAPA.');
      aapaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const duration = terms[tierKey] ?? 1;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(joinQuery(tierKey))}`);
      return;
    }
    setBusyTier(tierKey);
    try {
      await persistAapaMember(aapaAnswer);
      const { url } = await apiPost('/api/create-checkout-session', {
        tier: tierKey,
        duration,
        ...(wantPatron ? { patron: true } : {}),
      });
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setBusyTier(null);
    }
  };

  const currentTier = tierByKey(profile?.membership_tier);

  const pageTitle = focusedTier
    ? `Join as ${focusedTier.name}`
    : 'Join SAMPA';

  const headerSub = (() => {
    if (isActiveMember) {
      return 'You already have an active membership. Manage billing from your dashboard rather than starting a new checkout here.';
    }
    if (focusedTier) {
      return user
        ? `${focusedTier.name} is selected. Pick a term below, then continue to secure payment via Stripe. Need a different level? Select another card.`
        : `${focusedTier.name} is selected. Sign in (one click, no password), then choose a term and pay. Need a different level? Select another card.`;
    }
    return user
      ? 'Choose the level that fits your career stage, pick a term, then continue to secure payment via Stripe.'
      : 'Choose your level, sign in (one click, no password), pick a term, then pay. Active membership opens the member directory today — and backs SAMPA’s voice for your patients’ access to quality care and MOUD.';
  })();

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-4 font-data uppercase tracking-wider">
            Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-drama font-bold mb-6">{pageTitle}</h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">{headerSub}</p>
          {!isActiveMember && (
            <p className="text-text/60 text-sm mt-4 max-w-xl mx-auto">
              Members stay in the loop as the{' '}
              <Link to="/caq" className="text-primary-text font-semibold hover:underline">
                Addiction Medicine CAQ
              </Link>
              {' '}takes shape.
            </p>
          )}
          {user && !isActiveMember && (
            <p className="text-text/40 text-xs mt-4 max-w-xl mx-auto">
              You're signed in as <strong className="text-text/60">{user.email}</strong>.
              Already a member under a different email? Sign out from your{' '}
              <Link to="/dashboard" className="underline hover:text-primary-text">dashboard</Link>{' '}
              and sign back in with that address instead of paying again.
            </p>
          )}
        </header>

        {canceled && (
          <div className="max-w-2xl mx-auto bg-text/5 border border-text/10 rounded-2xl p-5 mb-10 text-center text-sm text-text/70">
            Checkout was canceled — no charge was made. Pick a tier and term whenever you're ready.
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
            <p className="font-semibold text-primary-text mb-1">
              You're already an active member{currentTier ? ` (${currentTier.name})` : ''}. 🎉
            </p>
            <p className="text-sm text-text/70">
              To change tiers, update your card, or cancel, use the billing portal on your{' '}
              <Link to="/dashboard" className="text-primary-text font-semibold hover:underline">dashboard</Link>{' '}
              — starting a second checkout here would create a duplicate subscription.
            </p>
          </div>
        )}

        {/* Multi-year detail lives on Join (homepage only teases it) */}
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-3xl p-6 mb-12 flex items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-full text-primary shrink-0 shadow-sm">
            <Star className="w-6 h-6 fill-primary/10" />
          </div>
          <p className="text-text/80 text-sm">
            <strong>Choose your term on the card:</strong> save 10–13% on 2 years and
            17–20% on 3 years. Memberships auto-renew at the end of the term and are easy to cancel.
            <span className="block mt-1 text-xs text-text/50">
              Student and Pre-PA cap at 2 years. Legacy members can choose a one-time lifetime option.
            </span>
          </p>
        </div>

        {showAapaQuestion && (
          <div
            ref={aapaRef}
            className="max-w-3xl mx-auto bg-white border border-primary/15 rounded-3xl p-6 mb-12 text-center"
          >
            <p className="font-semibold text-text mb-1">Are you a current AAPA member?</p>
            <p className="text-sm text-text/60 mb-5 max-w-xl mx-auto">
              Honor system — we do not verify with AAPA. This helps us put you on the right dues.
              You can still pick a different card.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => answerAapa(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors ${
                  aapaAnswer === true
                    ? 'bg-primary-text border-primary-text text-white'
                    : 'border-primary-text text-primary-text hover:bg-primary-text/5'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => answerAapa(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors ${
                  aapaAnswer === false
                    ? 'bg-primary-text border-primary-text text-white'
                    : 'border-primary-text text-primary-text hover:bg-primary-text/5'
                }`}
              >
                No
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => {
            const duration = termFor(tier);
            const isLifetime = duration === 'lifetime';
            const price = isLifetime ? tier.lifetime : tier.prices[duration];
            const savings = !isLifetime ? savingsPercent(tier, duration) : 0;
            const isFocused = focusedKey === tier.key;
            const isDimmed = focusedKey && !isFocused;
            const darkCard = isFocused || (!focusedKey && tier.highlight);

            return (
              <div
                key={tier.key}
                ref={(el) => {
                  if (el) cardRefs.current[tier.key] = el;
                }}
                onClick={() => focusTier(tier.key)}
                className={`${
                  isFocused
                    ? 'bg-text text-white border-accent shadow-2xl ring-2 ring-accent ring-offset-2 ring-offset-background'
                    : tier.highlight
                      ? 'bg-text text-white border-accent shadow-xl'
                      : 'bg-white border-primary/10 text-text'
                } ${isDimmed ? 'opacity-70 hover:opacity-100' : ''} p-8 rounded-4xl border shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer`}
              >
                {isFocused && (
                  <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold font-data tracking-wider uppercase">
                    Your selection
                  </div>
                )}
                {!isFocused && tier.highlight && (
                  <div className="absolute top-6 -right-10 w-40 text-center bg-accent rotate-45 py-1 text-xs font-bold font-data tracking-wider uppercase shadow-md text-white">
                    Featured
                  </div>
                )}
                <div className={`relative z-10 ${isFocused ? 'mt-4' : ''}`}>
                  {tier.lede && (
                    <p className={`text-xs font-semibold mb-1.5 ${darkCard ? 'text-white/85' : 'text-primary-text'}`}>
                      {tier.lede}
                    </p>
                  )}
                  <h3 className={`text-xl tracking-tight font-bold ${tier.secondaryLabel ? 'mb-1' : 'mb-2'}`}>{tier.name}</h3>
                  {tier.secondaryLabel && (
                    <p className={`text-[11px] font-data tracking-wide mb-2 ${darkCard ? 'text-white/45' : 'text-text/40'}`}>
                      {tier.secondaryLabel}
                    </p>
                  )}
                  <p className={`${darkCard ? 'text-white/70' : 'text-text/60'} text-sm mb-5 min-h-10`}>
                    {tier.desc}
                  </p>

                  <div
                    className="flex flex-wrap gap-1.5 mb-5"
                    role="radiogroup"
                    aria-label={`${tier.name} term`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {durationsForTier(tier).map((d) => {
                      const active = duration === d;
                      const pct = d !== 'lifetime' ? savingsPercent(tier, d) : 0;
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            focusTier(tier.key);
                            setTerms({ ...terms, [tier.key]: d });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-data font-semibold border transition-colors ${
                            active
                              ? darkCard
                                ? 'bg-accent border-accent text-white'
                                : 'bg-primary-text border-primary-text text-white'
                              : darkCard
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

                  <div className={`text-4xl font-bold font-sans mb-2 ${darkCard ? 'text-white' : 'text-primary-text'}`}>
                    ${price}
                    <span className={`text-lg font-normal ${darkCard ? 'text-white/50' : 'text-text/50'}`}>
                      {isLifetime ? ' once' : duration === 1 ? '/yr' : ` / ${duration} yrs`}
                    </span>
                  </div>
                  <p className={`text-xs mb-6 h-4 ${darkCard ? 'text-white/50' : 'text-text/40'}`}>
                    {isLifetime
                      ? 'One payment, member for life.'
                      : savings > 0
                        ? `Saves ${savings}% vs. paying annually.`
                        : ''}
                  </p>
                </div>
                {isFocused && !isActiveMember && (
                  <label
                    className={`flex items-start gap-3 mb-4 relative z-10 text-left cursor-pointer ${
                      darkCard ? 'text-white/85' : 'text-text/80'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={wantPatron}
                      onChange={(e) => setWantPatron(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-primary/30 accent-accent"
                    />
                    <span className="text-xs leading-relaxed">
                      Patron — same membership, no extra benefits. Just more support for SAMPA.
                      <span className={`block mt-1 ${darkCard ? 'text-white/55' : 'text-text/50'}`}>
                        Adds ${patronDollars(duration)}
                        {isLifetime ? ' once' : duration === 1 ? ' for this year' : ` for this ${duration}-year term`}.
                      </span>
                    </span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectTier(tier.key);
                  }}
                  disabled={loading || busyTier !== null || isActiveMember}
                  className={`block text-center w-full py-3.5 rounded-full font-bold transition-colors relative z-10 disabled:opacity-50 ${
                    darkCard
                      ? 'bg-gradient-to-r from-primary-text to-accent text-white hover:shadow-lg'
                      : 'border-2 border-primary-text text-primary-text hover:bg-primary-text/5'
                  }`}
                >
                  {busyTier === tier.key
                    ? 'Opening checkout…'
                    : user
                      ? isFocused
                        ? 'Continue to payment'
                        : `Continue with ${tier.name}`
                      : isFocused
                        ? 'Sign in to join'
                        : `Sign in · ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {focusedTier && !isActiveMember && (
          <p className="text-center text-sm mt-8">
            <Link
              to={`/join/invoice?${new URLSearchParams({
                tier: focusedTier.key,
                term: String(termFor(focusedTier)),
                ...(wantPatron ? { patron: '1' } : {}),
                ...(typeof aapaAnswer === 'boolean' ? { aapa: aapaAnswer ? '1' : '0' } : {}),
              }).toString()}`}
              className="text-text/45 hover:text-primary-text underline underline-offset-4 decoration-text/25 hover:decoration-primary-text"
            >
              Need an invoice for your employer?
            </Link>
          </p>
        )}

        <p className="text-center text-text/40 text-xs mt-10 max-w-xl mx-auto">
          Payments are processed by Stripe — SAMPA never sees or stores your card
          details. You'll get a receipt by email, and you can manage billing anytime
          from your dashboard. Multi-year terms renew at the end of the term until
          canceled. By joining you agree to our{' '}
          <Link to="/terms" className="underline hover:text-primary-text">Terms of Service</Link> and{' '}
          <Link to="/privacy" className="underline hover:text-primary-text">Privacy Policy</Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
