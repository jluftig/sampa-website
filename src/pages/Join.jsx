import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JoinCheckoutStep from '../components/join/JoinCheckoutStep';
import JoinMembershipStep from '../components/join/JoinMembershipStep';
import JoinProfileStep from '../components/join/JoinProfileStep';
import JoinStepper from '../components/join/JoinStepper';
import JoinSupportStep from '../components/join/JoinSupportStep';
import { useAuth } from '../lib/AuthContext';
import { apiPost } from '../lib/api';
import {
  checkoutBlock,
  joinCart,
  JOIN_DRAFT_KEY,
  joinSearchParams,
  nextStepAfterProfile,
  parseJoinQuery,
  preselectedTier,
} from '../lib/joinFlow';
import {
  emptyProfileForm,
  profileCardsStartCollapsed,
  profileWritePatch,
  sanitizeProfileForm,
  validateProfile,
} from '../lib/joinProfile';
import { supabase } from '../lib/supabaseClient';

const NEW_PROFILE_COLUMNS = [
  'career_stage', 'nccpa_id', 'home_city', 'licensed_states', 'primary_practice_setting',
  'years_as_pa', 'years_addiction', 'addiction_pct_bucket', 'practice_model',
  'prescribes_moud', 'prescribes_other', 'telehealth_addiction', 'telehealth_states',
  'focus_areas', 'mentor_open', 'mentor_visible', 'profile_confirmed_at',
];

function readDraft() {
  try {
    const raw = sessionStorage.getItem(JOIN_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveProfilePatch(userId, patch) {
  let { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (!error) return null;
  const msg = error.message || '';
  const missing = error.code === 'PGRST204' || NEW_PROFILE_COLUMNS.some((key) => msg.includes(key));
  if (!missing) return error;
  const fallback = { ...patch };
  for (const key of NEW_PROFILE_COLUMNS) delete fallback[key];
  if (!Object.keys(fallback).length) return null;
  ({ error } = await supabase.from('profiles').update(fallback).eq('id', userId));
  return error;
}

export function JoinFlow({ mode = 'join', preview = null }) {
  const auth = useAuth();
  const user = preview?.user ?? auth.user;
  const profile = preview?.profile ?? auth.profile;
  const loading = preview ? false : auth.loading;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseJoinQuery(searchParams.toString(), { pathname: mode === 'renew' ? '/renew' : '/join' });
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState(null);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (form || loading) return;
    const email = user?.email || profile?.email || '';
    const base = emptyProfileForm(profile, email);
    const draft = preview ? null : readDraft();
    if (draft && typeof draft === 'object') {
      setForm({ ...base, ...draft, email: email || draft.email || '' });
      if (user) sessionStorage.removeItem(JOIN_DRAFT_KEY);
    } else {
      setForm(base);
    }
  }, [form, loading, preview, profile, user]);

  useEffect(() => {
    if (!form || query.tier) return;
    if (query.step !== 'membership' && query.step !== 'checkout') return;
    const suggested = preselectedTier(profile, {
      aapa: query.aapa ?? form.aapa_member,
      careerStage: form.career_stage,
    });
    if (!suggested) return;
    const next = joinSearchParams({ ...query, tier: suggested, aapa: query.aapa ?? form.aapa_member }, searchParams);
    setSearchParams(next, { replace: true });
  }, [form, profile, query, setSearchParams]);

  useEffect(() => {
    if (query.phase !== 'confirmation' || preview) return undefined;
    setWaited(false);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      auth.refreshProfile?.();
      if (n >= 15) {
        window.clearInterval(id);
        setWaited(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [auth.refreshProfile, preview, query.phase]);

  const cart = useMemo(() => joinCart({
    tier: query.tier,
    term: query.term,
    patron: query.patron,
    autoRenew: query.autoRenew,
  }), [query.tier, query.term, query.patron, query.autoRenew]);

  const go = (partial, replace = false) => {
    const next = { ...query, canceled: false, ...partial };
    setSearchParams(joinSearchParams(next, searchParams), { replace });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const basePath = mode === 'renew' ? '/renew' : '/join';

  const requireSignIn = (step) => {
    sessionStorage.setItem(JOIN_DRAFT_KEY, JSON.stringify(form));
    const next = `${basePath}?${joinSearchParams({ ...query, step }, searchParams).toString()}`;
    navigate(`/login?next=${encodeURIComponent(next)}`);
  };

  const renewing = mode === 'renew' || Boolean(profile?.membership_status);
  const collapsed = !forceOpen && profileCardsStartCollapsed({ mode, profile });
  const continueProfile = async () => {
    const found = validateProfile(form, { renewConfirm: renewing && collapsed });
    setErrors(found);
    setShowErrors(true);
    if (Object.keys(found).length) {
      setForceOpen(true);
      return;
    }
    if (!user) {
      requireSignIn('profile');
      return;
    }
    if (!preview) {
      const sanitized = sanitizeProfileForm(form);
      const patch = profileWritePatch(profile, sanitized, new Date().toISOString());
      const error = await saveProfilePatch(user.id, patch);
      if (error) {
        setPayError(error.message || 'Could not save your profile.');
        return;
      }
      auth.refreshProfile?.();
    }
    go(nextStepAfterProfile({ mode, profile, form }));
  };

  const continueMembership = () => {
    if (cart.needsAapa && query.aapa == null && !checkoutBlock(profile)) {
      setPayError('Please tell us whether you are a current AAPA member. We do not verify this with AAPA.');
      return;
    }
    if (!query.tier) {
      setPayError('Choose a membership level.');
      return;
    }
    setPayError(null);
    if (!user) {
      requireSignIn('membership');
      return;
    }
    go({ step: 'support' });
  };

  const pay = async () => {
    if (checkoutBlock(profile) || !query.tier) return;
    if (!user) {
      requireSignIn('checkout');
      return;
    }
    setPayError(null);
    setBusy(true);
    go({ step: 'checkout', phase: 'payment' });
    if (preview) return;
    try {
      const { url } = await apiPost('/api/create-checkout-session', {
        tier: query.tier,
        duration: query.term,
        auto_renew: cart.autoRenew,
        ...(query.patron ? { patron: true } : {}),
      });
      window.location.assign(url);
    } catch (err) {
      setBusy(false);
      setPayError(err.message);
      go({ step: 'checkout', phase: 'review' }, true);
    }
  };

  const invoiceQuery = new URLSearchParams({
    ...(query.tier ? { tier: query.tier } : {}),
    ...(query.term ? { term: String(query.term) } : {}),
    ...(query.patron ? { patron: '1' } : {}),
    ...(query.aapa === true ? { aapa: '1' } : {}),
    ...(query.aapa === false ? { aapa: '0' } : {}),
  }).toString();

  const bar = (() => {
    if (query.step === 'profile') {
      return { primary: collapsed ? 'Looks right — continue' : 'Continue', onPrimary: continueProfile };
    }
    if (query.step === 'membership') {
      return { back: () => go({ step: 'profile' }), primary: 'Continue', onPrimary: continueMembership };
    }
    if (query.step === 'support') {
      return {
        back: () => go({ step: 'membership' }),
        primary: 'Continue',
        onPrimary: () => go({ step: 'checkout', phase: 'review' }),
        skip: () => go({ step: 'checkout', phase: 'review', patron: false }),
      };
    }
    if (query.phase === 'review') {
      return {
        back: () => go({ step: 'support' }),
        primary: checkoutBlock(profile) ? 'Back to profile' : 'Continue to payment',
        onPrimary: checkoutBlock(profile) ? () => go({ step: 'profile' }) : pay,
      };
    }
    if (query.phase === 'payment') {
      return { back: () => go({ step: 'checkout', phase: 'review' }, true), primary: busy ? 'Opening checkout…' : 'Continue to payment', onPrimary: pay };
    }
    return null;
  })();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />
      <div className="pt-24">
        <JoinStepper stepId={query.step} onStep={(step) => go({ step, phase: 'review' })} />
        <main className="mx-auto max-w-3xl px-4 pb-32 pt-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold md:text-4xl">{mode === 'renew' ? 'Renew SAMPA' : 'Join SAMPA'}</h1>
            {query.step === 'profile' && (
              <p className="mt-2 text-sm text-text/70">
                {user ? `Signed in as ${user.email}.` : 'You can look at dues before you sign in.'}
                {' '}
                {!user && (
                  <button type="button" className="min-h-12 font-semibold text-primary-text underline" onClick={() => go({ step: 'membership' })}>
                    See dues
                  </button>
                )}
              </p>
            )}
          </header>
          {loading || !form ? (
            <p>Loading your profile…</p>
          ) : (
            <>
              {query.step === 'profile' && (
                <JoinProfileStep
                  key={collapsed ? 'closed' : 'open'}
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  showErrors={showErrors}
                  collapsed={collapsed}
                  promptCareerStage={renewing && collapsed && !form.career_stage}
                />
              )}
              {query.step === 'membership' && (
                <JoinMembershipStep
                  profile={profile}
                  tier={query.tier}
                  term={query.term}
                  aapa={query.aapa ?? form.aapa_member}
                  autoRenew={query.autoRenew}
                  error={payError}
                  onTier={(tier) => go({ tier, aapa: query.aapa ?? form.aapa_member }, true)}
                  onTerm={(tier, term) => go({ tier, term }, true)}
                  onAapa={(aapa) => {
                    setForm((prev) => ({ ...prev, aapa_member: aapa }));
                    const keep = profile?.membership_tier;
                    if (!preview && user && typeof aapa === 'boolean') {
                      supabase.from('profiles').update({ aapa_member: aapa }).eq('id', user.id)
                        .then(() => auth.refreshProfile?.());
                    }
                    go({
                      aapa,
                      tier: keep || preselectedTier(null, { aapa, careerStage: form.career_stage }) || query.tier,
                    }, true);
                  }}
                  onAutoRenew={(autoRenew) => go({ autoRenew }, true)}
                />
              )}
              {query.step === 'support' && (
                <JoinSupportStep patron={query.patron} term={query.term} onPatron={(patron) => go({ patron }, true)} />
              )}
              {query.step === 'checkout' && (
                <JoinCheckoutStep
                  phase={query.phase}
                  canceled={query.canceled}
                  cart={cart}
                  profile={profile}
                  smsOptIn={form.sms_opt_in}
                  busy={busy}
                  error={payError}
                  confirmed={preview ? true : waited || profile?.membership_status === 'active'}
                  waiting={preview ? false : !waited}
                  greeting={mode === 'renew' ? 'Renewed' : 'Welcome'}
                  onEditMembership={() => go({ step: 'membership' })}
                  onEditSupport={() => go({ step: 'support' })}
                  invoiceQuery={invoiceQuery}
                />
              )}
            </>
          )}
          <p className="mt-8 text-center text-xs text-text/45">
            By continuing you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </main>
        <Footer />
        <div className="h-24" aria-hidden="true" />
      </div>
      {bar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2">
            {bar.back && (
              <button type="button" className="min-h-12 flex-1 rounded-full border border-primary/20 font-semibold" onClick={bar.back}>Back</button>
            )}
            {bar.skip && (
              <button type="button" className="min-h-12 flex-1 rounded-full border border-primary/20 font-semibold" onClick={bar.skip}>Skip</button>
            )}
            <button type="button" className="min-h-12 flex-[2] rounded-full bg-primary-text font-bold text-white disabled:opacity-50" disabled={busy} onClick={bar.onPrimary}>
              {bar.primary}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Join() {
  const { pathname } = useLocation();
  return <JoinFlow mode={pathname === '/renew' ? 'renew' : 'join'} />;
}
