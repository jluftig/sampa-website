import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { apiPost } from '../lib/api';

// Public signup → Brevo DOI → SAMPA Updates. No membership required.
// Banner variant: large rounded chip above the footer (Bridge-style prominence).
export default function NewsletterSignup({ variant = 'banner' }) {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost('/api/newsletter-signup', {
        email,
        company: honeypot,
      });
      setDone(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'banner') {
    return (
      <section
        id="updates-signup"
        aria-labelledby="newsletter-heading"
        className="scroll-mt-32 bg-background px-4 py-12 md:py-16"
      >
        <div className="max-w-6xl mx-auto bg-primary-text text-white rounded-[2rem] md:rounded-[2.75rem] px-6 py-10 sm:px-10 sm:py-12 md:px-14 md:py-14 shadow-xl shadow-primary-text/15">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/15 mb-5">
                <Mail className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2
                id="newsletter-heading"
                className="text-3xl md:text-4xl font-drama font-bold tracking-tight mb-4"
              >
                SAMPA Updates
              </h2>
              <p className="text-white/85 text-base md:text-lg leading-relaxed mb-3">
                A weekly email with what’s new in addiction-medicine practice,
                society news, and the policy changes that affect your patients.
                No membership required.
              </p>
              <p className="text-white/60 text-sm italic leading-relaxed">
                We respect your privacy and will not share your email.
              </p>
            </div>

            <div>
              {done ? (
                <p
                  className="text-lg text-white leading-relaxed bg-white/10 rounded-3xl px-6 py-8"
                  role="status"
                >
                  Check your inbox for a confirmation link. You won’t be added
                  until you confirm.
                </p>
              ) : (
                <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
                  <label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-white/90"
                  >
                    Email
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id={inputId}
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      disabled={busy}
                      className="flex-1 min-w-0 rounded-full bg-white border-0 px-5 py-3.5 text-base text-text placeholder:text-text/40 focus:outline-none focus:ring-4 focus:ring-white/35 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      className="absolute -left-[9999px] h-0 w-0 opacity-0"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="shrink-0 rounded-full bg-white text-primary-text px-7 py-3.5 text-base font-bold hover:bg-white/90 transition-colors disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-white/35"
                    >
                      {busy ? 'Sending…' : 'Subscribe'}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-200" role="alert">
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-white/55 leading-relaxed">
                    We’ll email a confirmation link (double opt-in). You’re joining
                    the SAMPA Updates list via Brevo. See our{' '}
                    <Link
                      to="/privacy"
                      className="underline underline-offset-2 hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Compact fallback (unused on site today; kept for optional embeds)
  return (
    <div className="w-full max-w-md">
      <p className="text-white font-semibold text-sm mb-1">SAMPA Updates</p>
      <p className="text-white/55 text-xs mb-3 leading-relaxed">
        News and organizational updates by email. No membership required.
      </p>
      {done ? (
        <p className="text-sm text-white/80 leading-relaxed" role="status">
          Check your inbox for a confirmation link. You won’t be added until you
          confirm.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="relative flex flex-col gap-2">
          <label htmlFor={`${inputId}-compact`} className="sr-only">
            Email address
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id={`${inputId}-compact`}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              className="flex-1 min-w-0 rounded-full bg-white/10 border border-white/25 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 rounded-full bg-white text-text px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Subscribe'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-300" role="alert">
              {error}
            </p>
          )}
          <p className="text-[11px] text-white/40 leading-relaxed">
            Double opt-in via Brevo.{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-white/70">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
