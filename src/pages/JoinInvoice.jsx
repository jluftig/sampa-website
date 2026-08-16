import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import {
  MEMBERSHIP_TIERS,
  durationsForTier,
  durationLabel,
  publishedDues,
  tierByKey,
} from '../lib/membership';
import { organizationsFromProfile } from '../lib/organizations';
import { US_STATES } from '../lib/usStates';
import { apiPost } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FIELD =
  'w-full px-4 py-2.5 rounded-2xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white disabled:opacity-60';
const LABEL =
  'block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2';

function emptyForm(seed = {}) {
  return {
    name: seed.name || '',
    credentials: seed.credentials || '',
    email: seed.email || '',
    phone: seed.phone || '',
    employer: seed.employer || '',
    billingDifferent: false,
    billingName: '',
    billingEmail: '',
    billingPhone: '',
    street: '',
    street2: '',
    city: seed.city || '',
    state: seed.state || '',
    zip: '',
    country: 'United States',
    tier: seed.tier || '',
    duration: seed.duration ?? 1,
    paymentOption: '',
    notes: '',
    company: '',
  };
}

export default function JoinInvoice() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const tierFromQuery = tierByKey(searchParams.get('tier'));

  const [form, setForm] = useState(() =>
    emptyForm({ tier: tierFromQuery?.key || '', duration: 1 }),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    if (!user && !profile && !tierFromQuery) return;
    const org = profile ? organizationsFromProfile(profile)[0] : null;
    setForm((prev) => ({
      ...prev,
      name: prev.name || profile?.full_name || '',
      credentials: prev.credentials || profile?.credentials || '',
      email: prev.email || user?.email || '',
      phone: prev.phone || profile?.phone || '',
      employer: prev.employer || org?.name || '',
      city: prev.city || org?.city || '',
      state: prev.state || org?.state || profile?.state || '',
      tier: prev.tier || tierFromQuery?.key || '',
    }));
    setSeeded(true);
  }, [user, profile, tierFromQuery, seeded]);

  const selectedTier = tierByKey(form.tier);
  const termChoices = useMemo(
    () => (selectedTier ? durationsForTier(selectedTier) : [1, 2, 3]),
    [selectedTier],
  );

  useEffect(() => {
    if (!selectedTier) return;
    if (!termChoices.includes(form.duration)) {
      setForm((prev) => ({ ...prev, duration: 1 }));
    }
  }, [selectedTier, termChoices, form.duration]);

  useEffect(() => {
    if (form.duration === 'lifetime' && form.paymentOption === 'auto_renew') {
      setForm((prev) => ({ ...prev, paymentOption: 'single' }));
    }
  }, [form.duration, form.paymentOption]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const amount = publishedDues(selectedTier, form.duration);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost('/api/request-membership-invoice', {
        ...form,
        duration: form.duration,
        billingDifferent: form.billingDifferent,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'We could not send the request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-4 font-data uppercase tracking-wider">
            Employer invoice
          </div>
          <p className="text-xs font-data tracking-wide text-text/45 mb-4">
            <Link to="/#membership" className="hover:text-primary-text underline-offset-2 hover:underline">
              Membership options
            </Link>
            <span className="mx-2 text-text/25">→</span>
            <Link to="/join" className="hover:text-primary-text underline-offset-2 hover:underline">
              Confirm &amp; pay
            </Link>
            <span className="mx-2 text-text/25">→</span>
            <span className="text-text/70">Request an invoice</span>
          </p>
          <h1 className="text-4xl md:text-5xl font-drama font-bold mb-6">
            Request an employer invoice
          </h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            If your hospital, university, or practice needs an invoice before it
            can reimburse your dues, use this form. You will not be charged here.
            A SAMPA staff member will email an invoice you can share with your
            billing office.
          </p>
        </header>

        {done ? (
          <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Request received</h2>
            <p className="text-text/70 text-sm mb-4 leading-relaxed">
              Staff will send a SAMPA invoice — this is not an instant checkout
              and your card has not been charged. We also emailed a short
              confirmation to {form.email}
              {form.billingDifferent && form.billingEmail
                ? ` and ${form.billingEmail}`
                : ''}
              .
            </p>
            <p className="text-text/60 text-sm mb-8 leading-relaxed">
              SAMPA, Inc. is a 501(c)(3) nonprofit (EIN 42-2288772). That
              identity will appear on the invoice staff send.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/join"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Back to membership
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setForm((prev) => ({ ...prev, notes: '', company: '' }));
                }}
                className="px-6 py-3 rounded-full border-2 border-primary-text text-primary-text font-bold text-sm hover:bg-primary-text/5 transition-colors"
              >
                Send another request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="relative bg-white rounded-4xl shadow-sm border border-primary/10 p-6 md:p-8 space-y-8">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-text/75 leading-relaxed">
              Invoices can be written two ways: <strong>pay for a single year</strong>,
              or <strong>auto-renew until cancelled</strong>. Choose the
              arrangement your employer needs. Neither is preferred.
            </div>

            <fieldset className="space-y-4">
              <legend className="text-sm font-bold mb-1">About you</legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="inv-name" className={LABEL}>Name</label>
                  <input
                    id="inv-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="inv-cred" className={LABEL}>Credentials (if any)</label>
                  <input
                    id="inv-cred"
                    type="text"
                    autoComplete="off"
                    placeholder="PA-C, CAQ-Psychiatry"
                    value={form.credentials}
                    onChange={(e) => setField('credentials', e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="inv-email" className={LABEL}>Email</label>
                  <input
                    id="inv-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="inv-phone" className={LABEL}>Phone (optional)</label>
                  <input
                    id="inv-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className={FIELD}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-bold mb-1">Employer and billing</legend>
              <div>
                <label htmlFor="inv-employer" className={LABEL}>Employer / institution</label>
                <input
                  id="inv-employer"
                  type="text"
                  required
                  autoComplete="organization"
                  value={form.employer}
                  onChange={(e) => setField('employer', e.target.value)}
                  className={FIELD}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-text/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.billingDifferent}
                  onChange={(e) => setField('billingDifferent', e.target.checked)}
                  className="mt-1"
                />
                <span>Billing contact is different from me</span>
              </label>

              {form.billingDifferent && (
                <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-primary/15 bg-primary/[0.02] p-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="inv-bname" className={LABEL}>Billing contact name</label>
                    <input
                      id="inv-bname"
                      type="text"
                      required={form.billingDifferent}
                      value={form.billingName}
                      onChange={(e) => setField('billingName', e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label htmlFor="inv-bemail" className={LABEL}>Billing contact email</label>
                    <input
                      id="inv-bemail"
                      type="email"
                      required={form.billingDifferent}
                      value={form.billingEmail}
                      onChange={(e) => setField('billingEmail', e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label htmlFor="inv-bphone" className={LABEL}>Billing contact phone (optional)</label>
                    <input
                      id="inv-bphone"
                      type="tel"
                      value={form.billingPhone}
                      onChange={(e) => setField('billingPhone', e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="inv-street" className={LABEL}>Street address</label>
                <input
                  id="inv-street"
                  type="text"
                  required
                  autoComplete="street-address"
                  value={form.street}
                  onChange={(e) => setField('street', e.target.value)}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="inv-street2" className={LABEL}>Address line 2 (optional)</label>
                <input
                  id="inv-street2"
                  type="text"
                  autoComplete="address-line2"
                  value={form.street2}
                  onChange={(e) => setField('street2', e.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inv-city" className={LABEL}>City</label>
                  <input
                    id="inv-city"
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="inv-state" className={LABEL}>State</label>
                  <select
                    id="inv-state"
                    required
                    value={form.state}
                    onChange={(e) => setField('state', e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-zip" className={LABEL}>ZIP</label>
                  <input
                    id="inv-zip"
                    type="text"
                    required
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={(e) => setField('zip', e.target.value)}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="inv-country" className={LABEL}>Country</label>
                  <input
                    id="inv-country"
                    type="text"
                    required
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(e) => setField('country', e.target.value)}
                    className={FIELD}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-bold mb-1">Membership</legend>
              <div>
                <label htmlFor="inv-tier" className={LABEL}>Membership level</label>
                <select
                  id="inv-tier"
                  required
                  value={form.tier}
                  onChange={(e) => setField('tier', e.target.value)}
                  className={FIELD}
                >
                  <option value="">Select…</option>
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <option key={tier.key} value={tier.key}>
                      {tier.name} — {tier.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={`${LABEL} mb-3`} id="inv-term-label">Term</p>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-labelledby="inv-term-label"
                >
                  {termChoices.map((d) => {
                    const active = form.duration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setField('duration', d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-data font-semibold border transition-colors ${
                          active
                            ? 'bg-primary-text border-primary-text text-white'
                            : 'border-primary/20 text-text/60 hover:border-primary'
                        }`}
                      >
                        {durationLabel(d)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-text/45 mt-2">
                  One year is the usual request. Longer terms are available on
                  most levels; Legacy members may also request a lifetime invoice.
                </p>
              </div>

              <div>
                <p className={`${LABEL} mb-3`} id="inv-pay-label">How should we write the invoice?</p>
                <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-labelledby="inv-pay-label">
                  {[
                    {
                      key: 'single',
                      title: 'Pay for a single year',
                      body: form.duration === 1 || form.duration === 'lifetime'
                        ? 'One payment covering the term you selected. Membership does not auto-renew.'
                        : `One payment covering the ${form.duration}-year term you selected. Membership does not auto-renew.`,
                    },
                    {
                      key: 'auto_renew',
                      title: 'Auto-renew until cancelled',
                      body: 'Membership continues and is invoiced again at the end of the term until cancelled.',
                      disabled: form.duration === 'lifetime',
                    },
                  ].map((opt) => {
                    const active = form.paymentOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={opt.disabled}
                        onClick={() => setField('paymentOption', opt.key)}
                        className={`text-left p-4 rounded-2xl border transition-colors disabled:opacity-40 ${
                          active
                            ? 'border-primary-text bg-primary/5'
                            : 'border-primary/15 hover:border-primary/40'
                        }`}
                      >
                        <span className="block font-semibold text-sm mb-1">{opt.title}</span>
                        <span className="block text-xs text-text/60 leading-relaxed">{opt.body}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedTier && amount != null && (
                <p className="text-sm text-text/70">
                  Published dues for this selection:{' '}
                  <strong className="text-text">${amount}</strong>
                  {form.duration === 'lifetime' ? ' once' : form.duration === 1 ? ' / year' : ` / ${form.duration} years`}
                  . Staff will confirm the amount on the invoice they send.
                </p>
              )}
            </fieldset>

            <div>
              <label htmlFor="inv-notes" className={LABEL}>Notes for staff (optional)</label>
              <textarea
                id="inv-notes"
                rows={4}
                maxLength={2000}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="PO number, cost center, who should be copied, or anything else your billing office needs."
                className={`${FIELD} rounded-2xl min-h-[6rem]`}
              />
            </div>

            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.company}
              onChange={(e) => setField('company', e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {error && (
              <p className="text-red-600 text-sm" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {busy ? 'Sending request…' : 'Send invoice request'}
            </button>

            <p className="text-center text-text/40 text-xs leading-relaxed">
              Prefer to pay by card now?{' '}
              <Link to="/join" className="underline hover:text-primary-text">Continue on the join page</Link>
              . By sending this request you agree to our{' '}
              <Link to="/terms" className="underline hover:text-primary-text">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="underline hover:text-primary-text">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
