import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookmarkX, CreditCard, Heart, PenSquare, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { canAddPatron, patronDollars, patronUpgradeDuration, PATRON_ADDON_BLURB, tierByKey } from '../lib/membership';
import { US_STATES } from '../lib/usStates';
import {
  emptyOrganization,
  organizationsFromProfile,
  primaryOrgFields,
  sanitizeOrganizations,
} from '../lib/organizations';
import { apiPost } from '../lib/api';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DonateLink from '../components/DonateLink';
import { PracticeSettingPicker } from '../components/PracticeSettingChips';

const STATUS_BADGES = {
  active:   { label: 'Active',            cls: 'bg-green-500/10 text-green-700 border-green-500/20' },
  past_due: { label: 'Payment past due',  cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  canceled: { label: 'Canceled',          cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

// Directory professional fields (shown to peers when listed). Separate from
// account contact (email/phone for SAMPA) and from per-organization employers.
// profiles.state is home/membership state — often pre-filled from member_import.
const DIRECTORY_IDENTITY_FIELDS = [
  { key: 'full_name',   label: 'Full name',    placeholder: 'Jane Doe, PA-C' },
  { key: 'credentials', label: 'Credentials',  placeholder: 'PA-C, CAQ-Psychiatry' },
  { key: 'npi',         label: 'NPI number',   placeholder: '10 digits (optional)' },
  { key: 'state',       label: 'State',        type: 'select', options: US_STATES },
];

export default function Dashboard() {
  const { user, profile, isEditor, canViewMembers, canAccessMemberDirectory, refreshProfile, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const justPaid = searchParams.get('checkout') === 'success';

  // ---- membership -----------------------------------------------------------
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState(null);
  const [patronBusy, setPatronBusy] = useState(false);
  const [patronError, setPatronError] = useState(null);

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

  const startPatronUpgrade = async () => {
    setPatronBusy(true);
    setPatronError(null);
    try {
      const { url } = await apiPost('/api/add-patron');
      window.location.assign(url);
    } catch (err) {
      setPatronError(err.message);
      setPatronBusy(false);
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

  // ---- donations (own gifts; RLS scopes the query to this user) --------------
  const [donations, setDonations] = useState(null); // null = loading
  useEffect(() => {
    let active = true;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('donations')
        .select('id, amount, currency, frequency, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      setDonations(data || []);
    })();
    return () => { active = false; };
  }, [user?.id]);

  // ---- profile form -----------------------------------------------------------
  const [form, setForm] = useState(null);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  useEffect(() => {
    if (profile && form === null) {
      setForm({
        // Account contact (SAMPA) — email is sign-in identity, not editable here.
        phone: profile.phone || '',
        newsletter_opt_in: profile.newsletter_opt_in ?? true,
        sms_opt_in: profile.sms_opt_in ?? false,
        // Directory professional identity
        full_name: profile.full_name || '',
        credentials: profile.credentials || '',
        npi: profile.npi || '',
        state: profile.state || '',
        organizations: organizationsFromProfile(profile),
        // Directory listing + contact (may differ from account email/phone)
        directory_visible: profile.directory_visible ?? true,
        directory_use_account_contact: profile.directory_use_account_contact ?? true,
        directory_email: profile.directory_email || '',
        directory_phone: profile.directory_phone || '',
        share_email: profile.share_email ?? true,
        share_phone: profile.share_phone ?? false,
        aapa_member: typeof profile.aapa_member === 'boolean' ? profile.aapa_member : null,
      });
    }
  }, [profile, form]);

  const updateOrganization = (index, field, value) => {
    setForm((prev) => {
      const organizations = prev.organizations.map((org, i) =>
        i === index ? { ...org, [field]: value } : org
      );
      return { ...prev, organizations };
    });
  };

  const addOrganization = () => {
    setForm((prev) => ({
      ...prev,
      organizations: [...prev.organizations, emptyOrganization()],
    }));
  };

  const removeOrganization = (index) => {
    setForm((prev) => {
      // Keep at least one row so the form always shows an org block.
      if (prev.organizations.length <= 1) {
        return { ...prev, organizations: [emptyOrganization()] };
      }
      return {
        ...prev,
        organizations: prev.organizations.filter((_, i) => i !== index),
      };
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.sms_opt_in && !form.phone.trim()) {
      setSaveState('needsPhone');
      return;
    }
    if (
      form.directory_visible
      && form.share_email
      && !form.directory_use_account_contact
      && !form.directory_email.trim()
    ) {
      setSaveState('needsDirectoryEmail');
      return;
    }
    setSaveState('saving');
    const organizations = sanitizeOrganizations(form.organizations);
    const { organizations: _drop, ...rest } = form;
    const payload = {
      ...rest,
      state: form.state || null,
      phone: form.phone || null,
      directory_email: form.directory_email.trim() || null,
      directory_phone: form.directory_phone.trim() || null,
      organizations,
      ...primaryOrgFields(organizations),
      onboarded_at: profile.onboarded_at || new Date().toISOString(),
    };
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);
    if (error) {
      // Strip newer columns and retry so older DBs still accept the form.
      const msg = error.message || '';
      const missingCol =
        error.code === 'PGRST204'
        || /organizations|city|directory_use_account_contact|directory_email|directory_phone|aapa_member/i.test(msg);
      if (missingCol) {
        const primary = primaryOrgFields(organizations);
        const base = {
          full_name: form.full_name,
          credentials: form.credentials,
          npi: form.npi,
          state: form.state || null,
          phone: form.phone || null,
          newsletter_opt_in: form.newsletter_opt_in,
          sms_opt_in: form.sms_opt_in,
          directory_visible: form.directory_visible,
          share_email: form.share_email,
          share_phone: form.share_phone,
          organization: primary.organization,
          practice_setting: primary.practice_setting,
          onboarded_at: profile.onboarded_at || new Date().toISOString(),
        };
        // Try with multi-org + directory contact, then progressively fewer columns.
        const attempts = [
          {
            ...base,
            city: primary.city,
            organizations,
            directory_use_account_contact: form.directory_use_account_contact,
            directory_email: form.directory_email.trim() || null,
            directory_phone: form.directory_phone.trim() || null,
          },
          {
            ...base,
            city: primary.city,
            organizations,
          },
          base,
        ];
        let ok = false;
        for (const attempt of attempts) {
          const { error: retryError } = await supabase
            .from('profiles')
            .update(attempt)
            .eq('id', user.id);
          if (!retryError) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          setSaveState('error');
          return;
        }
      } else {
        setSaveState('error');
        return;
      }
    }
    setForm((prev) => ({
      ...prev,
      organizations: organizations.length ? organizations.map((o) => ({
        name: o.name || '',
        role: o.role || '',
        city: o.city || '',
        state: o.state || '',
        practice_settings: o.practice_settings || [],
        practice_setting_other: o.practice_setting_other || '',
        practice_setting: o.practice_setting || '',
        website: o.website || '',
      })) : [emptyOrganization()],
    }));
    await refreshProfile();
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const accountEmail = profile?.email || user?.email || '';

  const badge = STATUS_BADGES[profile?.membership_status] || null;
  const tier = tierByKey(profile?.membership_tier);
  const showPatronUpgrade = canAddPatron(profile);
  const patronDuration = showPatronUpgrade ? patronUpgradeDuration(profile) : null;
  const needsOnboarding = profile && !profile.onboarded_at;
  const firstName = (profile?.full_name || '').split(' ')[0];

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-3 uppercase">
              Member Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-drama font-bold">
              {firstName ? `Welcome, ${firstName}` : 'Welcome'}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {isEditor && (
              <Link to="/editor" className="flex items-center gap-1.5 text-primary-text font-semibold hover:underline">
                <PenSquare className="w-4 h-4" /> Editor dashboard
              </Link>
            )}
            {canAccessMemberDirectory && (
              <Link to="/members" className="flex items-center gap-1.5 text-primary-text font-semibold hover:underline">
                <Users className="w-4 h-4" /> Directory
              </Link>
            )}
            {canViewMembers && (
              <Link to="/editor/members" className="flex items-center gap-1.5 text-primary-text font-semibold hover:underline">
                <Users className="w-4 h-4" /> Roster
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
                {profile.patron ? ' · Patron' : ''}
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-text text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    {portalBusy ? 'Opening…' : 'Manage billing'}
                  </button>
                )}
                {profile.membership_status === 'canceled' && (
                  <Link
                    to="/join"
                    className="px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-bold hover:bg-primary-text/5 transition-colors"
                  >
                    Rejoin
                  </Link>
                )}
              </div>
              {portalError && <p className="text-red-500 text-xs mt-3">{portalError}</p>}
              {showPatronUpgrade && (
                <div className="mt-5 pt-5 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={startPatronUpgrade}
                    disabled={patronBusy}
                    className="px-5 py-2.5 rounded-full border border-primary/25 text-primary-text text-sm font-semibold hover:bg-primary-text/5 transition-colors disabled:opacity-50"
                  >
                    {patronBusy ? 'Opening…' : 'Add Patron'}
                  </button>
                  <p className="text-text/50 text-xs mt-2 max-w-md">
                    Patron badge — {PATRON_ADDON_BLURB} Adds ${patronDollars(patronDuration)}
                    {patronDuration === 'lifetime'
                      ? ' once'
                      : patronDuration === 1
                        ? ' for this year'
                        : ` for your ${patronDuration}-year term`}.
                  </p>
                  {patronError && <p className="text-red-500 text-xs mt-2">{patronError}</p>}
                </div>
              )}
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
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
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
                  className="underline hover:text-primary-text"
                >
                  contact us
                </a>{' '}
                and we'll connect your accounts.
              </p>
            </>
          )}
        </section>

        {/* Profile — account contact (SAMPA) + directory profile (peers) */}
        <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
          <h2 className="text-xl font-bold mb-2">Your profile</h2>
          {needsOnboarding && (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 text-sm text-text/80">
              <strong>Complete your profile</strong> — account contact is for
              SAMPA only; the directory section is what other members see when
              you choose to be listed. Everything except your name is optional.
            </div>
          )}

          {form && (
            <form onSubmit={saveProfile}>
              {/* ---- 1. Account contact (SAMPA ops only) ---- */}
              <div className="mb-10">
                <h3 className="text-sm font-bold mb-1">Account contact</h3>
                <p className="text-text/50 text-xs mb-4 max-w-xl">
                  How SAMPA reaches you about your membership or account — not
                  shown to other members unless you choose to share it in the
                  directory below.
                </p>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                      Email (sign-in)
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-2xl border border-primary/10 bg-primary/[0.03] text-sm text-text/80">
                      {accountEmail || '—'}
                    </div>
                    <p className="text-text/40 text-xs mt-1.5">
                      From your Google or magic-link sign-in. Contact us if you
                      need to change the account email.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="pf-phone" className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                      Mobile phone
                    </label>
                    <input
                      id="pf-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="For text updates (optional)"
                      className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 mt-5 text-sm text-text/70 cursor-pointer">
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
                    Send me SAMPA text updates at this mobile number.
                    <span className="block text-xs text-text/40 mt-0.5">
                      Message and data rates may apply. Reply STOP at any time to opt out.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mb-10">
                <h3 className="text-sm font-bold mb-1">AAPA membership</h3>
                <p className="text-text/50 text-xs mb-4 max-w-xl">
                  Honor system — we do not verify with AAPA. This helps us put you on the right dues.
                  Optional; you can save the rest of your profile without answering.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aapa_member: true })}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                      form.aapa_member === true
                        ? 'bg-primary-text border-primary-text text-white'
                        : 'border-primary-text text-primary-text hover:bg-primary-text/5'
                    }`}
                  >
                    Yes, current AAPA member
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, aapa_member: false })}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                      form.aapa_member === false
                        ? 'bg-primary-text border-primary-text text-white'
                        : 'border-primary-text text-primary-text hover:bg-primary-text/5'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* ---- 2. Directory profile (peer networking) ---- */}
              <div className="pt-8 border-t border-primary/10">
                <h3 className="text-sm font-bold mb-1">Directory profile</h3>
                <p className="text-text/50 text-xs mb-4 max-w-xl">
                  What other active SAMPA members see when you appear in the
                  networking directory — not the public website. You can use your
                  account contact above, or enter a different email/phone for
                  peers (for example a work inbox).
                </p>

                <label className="flex items-start gap-3 text-sm text-text/70 cursor-pointer mb-6">
                  <input
                    type="checkbox"
                    checked={form.directory_visible}
                    onChange={(e) => setForm({ ...form, directory_visible: e.target.checked })}
                    className="w-4 h-4 accent-primary mt-0.5"
                  />
                  <span>
                    Show me in the member directory
                    <span className="block text-xs text-text/40 mt-0.5">
                      Uncheck to hide your listing entirely. You can change this anytime.
                    </span>
                  </span>
                </label>

                <div className={form.directory_visible ? '' : 'opacity-40 pointer-events-none'}>
                  <div className="grid md:grid-cols-2 gap-5">
                    {DIRECTORY_IDENTITY_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label htmlFor={`pf-${f.key}`} className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                          {f.label}
                        </label>
                        {f.type === 'select' ? (
                          <select
                            id={`pf-${f.key}`}
                            value={form[f.key]}
                            disabled={!form.directory_visible}
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
                            disabled={!form.directory_visible}
                            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>

              {/* Organizations / employers — default one; add more as needed */}
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-sm font-bold">Organizations / employers</h3>
                  <p className="text-text/50 text-xs mt-1 max-w-xl">
                    Listed on your directory profile. Each entry has its own
                    organization name, role/title, practice setting, city, state,
                    and optional website.
                  </p>
                </div>

                <div className="space-y-5">
                  {form.organizations.map((org, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-primary/15 bg-primary/[0.02] p-5"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-xs font-data font-semibold uppercase tracking-wider text-text/45">
                          {form.organizations.length === 1
                            ? 'Organization'
                            : `Organization ${index + 1}`}
                        </span>
                        {form.organizations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOrganization(index)}
                            className="flex items-center gap-1 text-xs text-text/40 hover:text-red-500 transition-colors font-semibold"
                            aria-label={`Remove organization ${index + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`pf-org-name-${index}`}
                            className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                          >
                            Organization / employer
                          </label>
                          <input
                            id={`pf-org-name-${index}`}
                            type="text"
                            value={org.name}
                            onChange={(e) => updateOrganization(index, 'name', e.target.value)}
                            placeholder="e.g. Highland Hospital, Bridge, SAMPA"
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`pf-org-role-${index}`}
                            className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                          >
                            Your role / title
                          </label>
                          <input
                            id={`pf-org-role-${index}`}
                            type="text"
                            value={org.role}
                            onChange={(e) => updateOrganization(index, 'role', e.target.value)}
                            placeholder="e.g. Co-Founder and Director of Clinical Innovation"
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                            Practice settings
                          </div>
                          <p className="text-text/40 text-xs mb-2">
                            Click all that apply for this employer.
                          </p>
                          <PracticeSettingPicker
                            selected={org.practice_settings || []}
                            onChange={(next) => updateOrganization(index, 'practice_settings', next)}
                            otherNote={org.practice_setting_other || ''}
                            onOtherNoteChange={(v) =>
                              updateOrganization(index, 'practice_setting_other', v)
                            }
                          />
                          {org.practice_setting && !(org.practice_settings || []).length && (
                            <p className="text-text/40 text-xs mt-2">
                              Previous free-text: {org.practice_setting}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`pf-org-website-${index}`}
                            className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                          >
                            Website <span className="normal-case font-normal tracking-normal">(optional)</span>
                          </label>
                          <input
                            id={`pf-org-website-${index}`}
                            type="text"
                            inputMode="url"
                            autoComplete="url"
                            value={org.website}
                            onChange={(e) => updateOrganization(index, 'website', e.target.value)}
                            placeholder="bridgetotreatment.org or https://…"
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                          />
                          <p className="text-text/40 text-xs mt-1.5">
                            Domain only is fine — we add https:// when you save.
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor={`pf-org-city-${index}`}
                            className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                          >
                            City
                          </label>
                          <input
                            id={`pf-org-city-${index}`}
                            type="text"
                            value={org.city}
                            onChange={(e) => updateOrganization(index, 'city', e.target.value)}
                            placeholder="City"
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`pf-org-state-${index}`}
                            className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                          >
                            State
                          </label>
                          <select
                            id={`pf-org-state-${index}`}
                            value={org.state}
                            onChange={(e) => updateOrganization(index, 'state', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                          >
                            <option value="">Select…</option>
                            {US_STATES.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addOrganization}
                  disabled={!form.directory_visible}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add additional organization
                </button>
              </div>

              {/* Directory contact: account info or custom */}
              <div className="mt-8 pt-6 border-t border-primary/10">
                <h4 className="text-sm font-bold mb-1">Contact for other members</h4>
                <p className="text-text/50 text-xs mb-4 max-w-xl">
                  Peers use this to network with you. You can reuse your account
                  email and phone, or enter different ones (for example a work
                  email if you sign in with a personal Gmail).
                </p>

                <label className="flex items-start gap-3 text-sm text-text/70 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={form.directory_use_account_contact}
                    disabled={!form.directory_visible}
                    onChange={(e) => setForm({
                      ...form,
                      directory_use_account_contact: e.target.checked,
                    })}
                    className="w-4 h-4 accent-primary mt-0.5"
                  />
                  <span>
                    Use my account contact info in the directory
                    <span className="block text-xs text-text/40 mt-0.5">
                      {accountEmail || 'Account email'}
                      {form.phone ? ` · ${form.phone}` : ' · no mobile number yet'}
                    </span>
                  </span>
                </label>

                {!form.directory_use_account_contact && (
                  <div className="grid md:grid-cols-2 gap-5 mb-5 ml-0 sm:ml-7">
                    <div>
                      <label
                        htmlFor="pf-directory-email"
                        className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                      >
                        Directory email
                      </label>
                      <input
                        id="pf-directory-email"
                        type="email"
                        autoComplete="email"
                        value={form.directory_email}
                        disabled={!form.directory_visible}
                        onChange={(e) => setForm({ ...form, directory_email: e.target.value })}
                        placeholder="you@work.org"
                        className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                      />
                      <p className="text-text/40 text-xs mt-1.5">
                        Shown to members instead of your sign-in email.
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="pf-directory-phone"
                        className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2"
                      >
                        Directory phone <span className="normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        id="pf-directory-phone"
                        type="tel"
                        value={form.directory_phone}
                        disabled={!form.directory_visible}
                        onChange={(e) => setForm({ ...form, directory_phone: e.target.value })}
                        placeholder="Work or preferred mobile"
                        className="w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 ml-0 sm:ml-7">
                  <label className="flex items-start gap-3 text-sm text-text/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.share_email}
                      disabled={!form.directory_visible}
                      onChange={(e) => setForm({ ...form, share_email: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5"
                    />
                    <span>
                      Share my email with other members
                      <span className="block text-xs text-text/40 mt-0.5">
                        {form.directory_use_account_contact
                          ? (accountEmail || 'Your account email')
                          : (form.directory_email.trim() || 'Enter a directory email above')}
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-text/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.share_phone}
                      disabled={!form.directory_visible}
                      onChange={(e) => setForm({ ...form, share_phone: e.target.checked })}
                      className="w-4 h-4 accent-primary mt-0.5"
                    />
                    <span>
                      Share my phone with other members
                      <span className="block text-xs text-text/40 mt-0.5">
                        {form.directory_use_account_contact
                          ? (form.phone ? form.phone : 'Add a mobile number under account contact first')
                          : (form.directory_phone.trim() || 'Optional — add a directory phone above')}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  type="submit"
                  disabled={saveState === 'saving'}
                  className="px-6 py-2.5 rounded-full bg-primary-text text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saveState === 'saving' ? 'Saving…' : 'Save profile'}
                </button>
                {saveState === 'saved' && <span className="text-green-700 text-sm font-semibold">Saved ✓</span>}
                {saveState === 'error' && <span className="text-red-500 text-sm">Couldn't save — try again.</span>}
                {saveState === 'needsPhone' && <span className="text-red-500 text-sm">Add a mobile phone number to receive text updates.</span>}
                {saveState === 'needsDirectoryEmail' && (
                  <span className="text-red-500 text-sm">
                    Add a directory email, or turn on “Use my account contact info”.
                  </span>
                )}
              </div>
            </form>
          )}
          <p className="text-text/40 text-xs mt-4">
            Signed in as {accountEmail || '…'}. Your role and membership
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
              <Link to="/news" className="text-primary-text font-semibold hover:underline">news article</Link>{' '}
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
                      className="font-semibold hover:text-primary-text transition-colors"
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

        {/* Donations */}
        <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold">Your donations</h2>
            <DonateLink
              className="flex items-center gap-1.5 text-primary-text font-semibold text-sm hover:underline"
            >
              <Heart className="w-4 h-4" /> Make a donation
            </DonateLink>
          </div>

          {donations === null && <p className="text-text/50 font-data text-sm">Loading…</p>}

          {donations?.length === 0 && (
            <p className="text-text/60 text-sm">
              No donations yet. Gifts are separate from your membership dues —{' '}
              <DonateLink className="text-primary-text font-semibold hover:underline">donate here</DonateLink>{' '}
              to support SAMPA's mission.
            </p>
          )}

          {donations?.length > 0 && (
            <ul className="divide-y divide-primary/10">
              {donations.map((d) => (
                <li key={d.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">
                      ${(d.amount / 100).toFixed(2)}
                      <span className="text-text/40 font-normal text-sm">
                        {d.frequency === 'monthly' ? ' · monthly' : ' · one-time'}
                      </span>
                    </div>
                    <div className="text-xs text-text/50 font-data mt-1">{formatDate(d.created_at)}</div>
                  </div>
                  <span className="text-xs text-text/40 font-data uppercase tracking-wider">
                    {(d.currency || 'usd').toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-text/40 text-xs mt-6">
            SAMPA, Inc. is a 501(c)(3) nonprofit (EIN 42-2288772). Contributions
            are tax-deductible to the extent allowed by law — keep your emailed
            receipts and consult your tax advisor.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
