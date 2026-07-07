import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookmarkX, CreditCard, PenSquare, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { tierByKey } from '../lib/membership';
import { US_STATES } from '../lib/usStates';
import { apiPost } from '../lib/api';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STATUS_BADGES = {
  active:   { label: 'Active',            cls: 'bg-green-500/10 text-green-700 border-green-500/20' },
  past_due: { label: 'Payment past due',  cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  canceled: { label: 'Canceled',          cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const PROFILE_FIELDS = [
  { key: 'full_name',        label: 'Full name',        placeholder: 'Jane Doe, PA-C' },
  { key: 'credentials',      label: 'Credentials',      placeholder: 'PA-C, CAQ-Psychiatry' },
  { key: 'npi',              label: 'NPI number',       placeholder: '10 digits (optional)' },
  { key: 'organization',     label: 'Organization / employer', placeholder: 'Where you practice' },
  { key: 'practice_setting', label: 'Practice setting', placeholder: 'e.g. OTP, FQHC, hospital, private practice' },
  { key: 'state',            label: 'State',            type: 'select', options: US_STATES },
  { key: 'phone',            label: 'Mobile phone',     placeholder: 'For text updates (optional)' },
];

export default function Dashboard() {
  const { user, profile, isEditor, canViewMembers, refreshProfile, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const justPaid = searchParams.get('checkout') === 'success';

  // ---- membership -----------------------------------------------------------
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState(null);

  // The webhook usually lands within seconds of checkout; re-fetch the profile
  // a few times so the new status appears without a manual reload.
  useEffect(() => {
    if (!justPaid) return;
    refreshProfile();
    const timers = [3000, 8000].map((ms) => setTimeout(refreshProfile, ms));
    return () => timers.forEach(clearTimeout);
  }, [justPaid, refreshProfile]);

  const openBillingPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { url } = await apiPost('/api/create-portal-session');
      window.location.assign(url);
    } catch (err) {
      setPortalError(err.message);
      setPortalBusy(false);
    }
  };

  // ---- saved articles ---------------------------------------------------------
  const [saved, setSaved] = useState(null); // null = loading
  useEffect(() => {
    let active = true;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('post_id, created_at, posts(id, title, slug, excerpt, published_at, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      // RLS hides drafts from members, but be explicit like every public list.
      setSaved((data || []).filter((f) => f.posts && f.posts.status === 'published'));
    })();
    return () => { active = false; };
  }, [user?.id]);

  const removeSaved = async (postId) => {
    setSaved((prev) => prev.filter((f) => f.post_id !== postId));
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('post_id', postId);
  };

  // ---- profile form -----------------------------------------------------------
  const [form, setForm] = useState(null);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  useEffect(() => {
    if (profile && form === null) {
      setForm({
        full_name: profile.full_name || '',
        credentials: profile.credentials || '',
        npi: profile.npi || '',
        organization: profile.organization || '',
        practice_setting: profile.practice_setting || '',
        state: profile.state || '',
        phone: profile.phone || '',
        newsletter_opt_in: profile.newsletter_opt_in ?? true,
        sms_opt_in: profile.sms_opt_in ?? false,
      });
    }
  }, [profile, form]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.sms_opt_in && !form.phone.trim()) {
      setSaveState('needsPhone');
      return;
    }
    setSaveState('saving');
    const { error } = await supabase
      .from('profiles')
      .update({
        ...form,
        onboarded_at: profile.onboarded_at || new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      setSaveState('error');
      return;
    }
    await refreshProfile();
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const badge = STATUS_BADGES[profile?.membership_status] || null;
  const tier = tierByKey(profile?.membership_tier);
  const needsOnboarding = profile && !profile.onboarded_at;
  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-primary font-bold font-data tracking-widest text-xs mb-3 uppercase">
              Member Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-drama font-bold">
              {firstName ? `Welcome, ${firstName}` : 'Welcome'}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {isEditor && (
              <Link to="/editor" className="flex items-center gap-1.5 text-primary font-semibold hover:underline">
                <PenSquare className="w-4 h-4" /> Editor dashboard
              </Link>
            )}
            {canViewMembers && (
              <Link to="/editor/members" className="flex items-center gap-1.5 text-primary font-semibold hover:underline">
                <Users className="w-4 h-4" /> Members
              </Link>
            )}
            <button onClick={signOut} className="text-text/50 hover:text-text font-semibold">
              Sign out
            </button>
          </div>
        </header>

        {justPaid && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 mb-8 text-sm text-green-800">
            <strong>Thanks for joining SAMPA!</strong> Your payment went through —
            your membership status below updates automatically (it can take a
            few seconds).{' '}
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Membership */}
        <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h2 className="text-xl font-bold">Membership</h2>
            {badge && (
              <span className={`px-3 py-1 rounded-full border text-xs font-data font-semibold uppercase tracking-wider ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>

          {profile?.membership_status ? (
            <>
              <p className="text-text/70 text-sm mb-6">
                {tier ? `${tier.name} membership` : 'SAMPA membership'}
                {profile.membership_status === 'active' && !profile.renews_on
                  ? ' — lifetime, no renewal needed'
                  : ''}
                {profile.renews_on && profile.membership_status === 'active'
                  ? profile.cancel_at_period_end
                    ? ` — canceled; member benefits end ${formatDate(profile.renews_on)}. Changed your mind? You can resume in the billing portal.`
                    : ` — renews ${formatDate(profile.renews_on)}`
                  : ''}
                {profile.membership_status === 'past_due'
                  ? ' — please update your payment method to keep your membership active.'
                  : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                {profile.stripe_customer_id && (
                  <button
                    onClick={openBillingPortal}
                    disabled={portalBusy}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    {portalBusy ? 'Opening…' : 'Manage billing'}
                  </button>
                )}
                {profile.membership_status === 'canceled' && (
                  <Link
                    to="/join"
                    className="px-5 py-2.5 rounded-full border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
                  >
                    Rejoin
                  </Link>
                )}
              </div>
              {portalError && <p className="text-red-500 text-xs mt-3">{portalError}</p>}
              <p className="text-text/40 text-xs mt-4">
                {profile.stripe_customer_id
                  ? 'Card updates, tier changes, cancellation, and receipts are all handled securely in the Stripe billing portal.'
                  : 'Your membership was imported from our sign-up records. Online billing will be available when you renew.'}
              </p>
            </>
          ) : (
            <>
              <p className="text-text/70 text-sm mb-6">
                You have an account but no membership yet. Join to support PA
                addiction medicine — and to unlock member benefits as they launch
                (CME content is coming).
              </p>
              <Link
                to="/join"
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Become a member
              </Link>
              <p className="text-text/40 text-xs mt-4">
                Expecting to see a membership here? You're signed in as{' '}
                <strong className="text-text/60">{profile?.email || user?.email}</strong> — if
                you joined SAMPA using a different email address, sign out (top of
                this page) and sign back in with that one, or{' '}
                <a
                  href="https://forms.gle/YqYYRVE9z2nCYdNz5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  contact us
                </a>{' '}
                and we'll connect your accounts.
              </p>
            </>
          )}
        </section>

        {/* Profile */}
        <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
          <h2 className="text-xl font-bold mb-2">Your profile</h2>
          {needsOnboarding && (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 text-sm text-text/80">
              <strong>Complete your profile</strong> — this replaces the old
              sign-up form and helps SAMPA understand its membership. Takes about
              a minute; everything except your name is optional.
            </div>
          )}

          {form && (
            <form onSubmit={saveProfile}>
              <div className="grid md:grid-cols-2 gap-5">
                {PROFILE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`pf-${f.key}`} className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                      {f.label}
                    </label>
                    {f.type === 'select' ? (
                      <select
                        id={`pf-${f.key}`}
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                      >
                        <option value="">Select…</option>
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`pf-${f.key}`}
                        type="text"
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 mt-6 text-sm text-text/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.newsletter_opt_in}
                  onChange={(e) => setForm({ ...form, newsletter_opt_in: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                Send me the SAMPA newsletter and member updates
              </label>

              <label className="flex items-start gap-3 mt-4 text-sm text-text/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sms_opt_in}
                  onChange={(e) => setForm({ ...form, sms_opt_in: e.target.checked })}
                  className="w-4 h-4 accent-primary mt-0.5"
                />
                <span>
                  Send me SAMPA text updates at the mobile number above.
                  <span className="block text-xs text-text/40 mt-0.5">
                    Message and data rates may apply. Reply STOP at any time to opt out.
                  </span>
                </span>
              </label>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  disabled={saveState === 'saving'}
                  className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saveState === 'saving' ? 'Saving…' : 'Save profile'}
                </button>
                {saveState === 'saved' && <span className="text-green-700 text-sm font-semibold">Saved ✓</span>}
                {saveState === 'error' && <span className="text-red-500 text-sm">Couldn't save — try again.</span>}
                {saveState === 'needsPhone' && <span className="text-red-500 text-sm">Add a mobile phone number to receive text updates.</span>}
              </div>
            </form>
          )}
          <p className="text-text/40 text-xs mt-4">
            Signed in as {profile?.email || user?.email}. Your role and membership
            status can only be changed by SAMPA administrators.
          </p>
        </section>

        {/* Saved articles */}
        <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8">
          <h2 className="text-xl font-bold mb-6">Saved articles</h2>

          {saved === null && <p className="text-text/50 font-data text-sm">Loading…</p>}

          {saved?.length === 0 && (
            <p className="text-text/60 text-sm">
              Nothing saved yet. Look for the <strong>Save</strong> button on any{' '}
              <Link to="/news" className="text-primary font-semibold hover:underline">news article</Link>{' '}
              to keep it here for later.
            </p>
          )}

          {saved?.length > 0 && (
            <ul className="divide-y divide-primary/10">
              {saved.map((fav) => (
                <li key={fav.post_id} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/news/${fav.posts.slug}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {fav.posts.title}
                    </Link>
                    <div className="text-xs text-text/50 font-data mt-1">
                      {formatDate(fav.posts.published_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSaved(fav.post_id)}
                    title="Remove from saved"
                    className="text-text/30 hover:text-red-500 transition-colors shrink-0 p-1"
                  >
                    <BookmarkX className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
