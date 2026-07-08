import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, UserCheck, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { apiPost } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Public donation page — no account required (anyone in the US can give).
// Signed-in gifts are linked to the profile; guests give with just an email
// that Stripe collects. Payment runs through the same Stripe account as dues,
// via /api/create-donation-session. Deductibility is disclosed as pending the
// IRS 501(c)(3) determination.
const PRESETS = [25, 50, 100, 250];

export default function Donate() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status'); // 'success' | 'canceled'

  const [frequency, setFrequency] = useState('once'); // 'once' | 'monthly'
  const [preset, setPreset] = useState(50);           // selected chip, or 'custom'
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const amount = preset === 'custom' ? parseFloat(custom) : preset;
  const amountValid = Number.isFinite(amount) && amount >= 1 && amount <= 50000;

  const donate = async () => {
    setError(null);
    if (!amountValid) {
      setError('Please enter an amount between $1 and $50,000.');
      return;
    }
    setBusy(true);
    try {
      const { url } = await apiPost('/api/create-donation-session', {
        amount,
        frequency,
      });
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-6 font-data uppercase tracking-wider">
            Support better care
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            Better care for substance use disorder
          </h1>
          <p className="text-lg text-text/70">
            Your gift helps physician associates deliver evidence-based, compassionate
            care to people with substance use disorder — expanding access to treatment
            and improving health outcomes in communities across the country.
          </p>
        </header>

        {status === 'success' ? (
          <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="w-8 h-8 fill-primary/20" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Thank you for supporting better care 💛</h2>
            <p className="text-text/70 text-sm mb-6">
              Your gift helps physician associates expand access to treatment for people
              with substance use disorder. A receipt is on its way by email.
              {user ? (
                <> You can see your giving history on your{' '}
                  <Link to="/dashboard" className="text-primary font-semibold hover:underline">dashboard</Link>.</>
              ) : null}
            </p>
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Give again
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8">
            {status === 'canceled' && (
              <div className="bg-text/5 border border-text/10 rounded-2xl p-4 mb-6 text-center text-sm text-text/70">
                Checkout was canceled — no charge was made. Whenever you're ready.
              </div>
            )}

            {/* Account status — make the signed-in vs. guest choice explicit, so a
                member never accidentally gives as a guest and then sees an empty
                donation history. Gifts link to an account by user id, not email. */}
            {user ? (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 text-sm">
                <UserCheck className="w-5 h-5 text-primary shrink-0" />
                <span className="text-text/80">
                  Signed in as <strong className="text-text">{user.email}</strong> — this gift
                  will be saved to your account and shown on your dashboard.
                </span>
              </div>
            ) : (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 text-sm">
                <p className="text-text/80 mb-3">
                  <strong className="text-text">SAMPA member?</strong> Sign in first so this
                  donation is saved to your account and appears in your dashboard. Otherwise
                  it's recorded as a guest gift and won't be linked to your login.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Link
                    to="/login?next=/donate"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <LogIn className="w-4 h-4" /> Sign in
                  </Link>
                  <span className="text-text/50 text-xs">or continue below to donate as a guest.</span>
                </div>
              </div>
            )}

            {/* Frequency */}
            <div className="flex gap-2 p-1 bg-primary/5 rounded-full mb-8" role="radiogroup" aria-label="Donation frequency">
              {[
                { key: 'once', label: 'One-time' },
                { key: 'monthly', label: 'Monthly' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  role="radio"
                  aria-checked={frequency === opt.key}
                  onClick={() => setFrequency(opt.key)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    frequency === opt.key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-text/60 hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Amount presets */}
            <label className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-3">
              Amount {frequency === 'monthly' && <span className="normal-case tracking-normal">(per month)</span>}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  onClick={() => { setPreset(val); setError(null); }}
                  className={`py-3 rounded-2xl border text-lg font-bold font-sans transition-colors ${
                    preset === val
                      ? 'bg-primary border-primary text-white'
                      : 'border-primary/20 text-text hover:border-primary'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-colors ${
                preset === 'custom' ? 'border-primary' : 'border-primary/20'
              }`}
            >
              <span className="text-text/50 font-bold">$</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                placeholder="Other amount"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setPreset('custom'); setError(null); }}
                onFocus={() => setPreset('custom')}
                className="w-full bg-transparent focus:outline-none text-lg font-semibold"
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <button
              onClick={donate}
              disabled={busy || !amountValid}
              className="block w-full mt-6 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {busy
                ? 'Opening checkout…'
                : amountValid
                  ? `Donate $${amount}${frequency === 'monthly' ? '/mo' : ''}`
                  : 'Enter an amount'}
            </button>

            {/* Tax-deductibility disclosure (pending IRS determination) */}
            <div className="mt-6 bg-accent/5 border border-accent/20 rounded-2xl p-4 text-xs text-text/70 leading-relaxed">
              <strong className="text-text/80">Tax status:</strong> SAMPA's
              application for 501(c)(3) tax-exempt status is pending with the IRS.
              If approved, contributions are expected to be deductible retroactive
              to SAMPA's formation — but until the determination is issued we
              cannot guarantee deductibility. Please keep your emailed receipt and
              consult your tax advisor.
            </div>

            <p className="text-center text-text/40 text-xs mt-6">
              Payments are processed securely by Stripe — SAMPA never sees or
              stores your card details. Monthly gifts continue until you cancel,
              which you can do anytime from the link in your receipt.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
