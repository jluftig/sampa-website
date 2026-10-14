import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { apiPost } from '../lib/api';

export default function NewsletterSignup({ variant = 'banner', list }) {
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
        ...(list ? { list } : {}),
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

  if (variant === 'card') {
    const headingId = `${inputId}-heading`;
    const daily = list === 'daily';
    return (
      <section
        aria-labelledby={headingId}
        className="bg-white rounded-3xl border border-primary/10 px-6 py-8 shadow-sm"
      >
        <h2 id={headingId} className="text-2xl font-drama font-bold mb-2">
          {daily ? 'Get the daily roundup by email' : 'SAMPA Updates'}
        </h2>
        <p className="text-text/70 mb-6 leading-relaxed">
          {daily
            ? 'Five short items, each weekday. No membership required.'
            : 'News and organizational updates by email. No membership required.'}
        </p>
        {done ? (
          <p className="text-text leading-relaxed" role="status">
            Check your inbox for a confirmation link. You won’t be added until you
            confirm.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative flex flex-col gap-3">
            <label htmlFor={`${inputId}-card`} className="text-sm font-semibold">
              Email
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id={`${inputId}-card`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={busy}
                className="flex-1 min-w-0 rounded-full border border-primary/20 bg-background px-5 py-3 text-base text-text placeholder:text-text/40 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
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
                className="shrink-0 rounded-full bg-accent text-white px-7 py-3 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Submit'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-text/55 leading-relaxed">
              We’ll email a confirmation link (double opt-in). See our{' '}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-text">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}
      </section>
    );
  }

  return null;
}
