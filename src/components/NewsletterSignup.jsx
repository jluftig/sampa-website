import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../lib/api';

// Public footer signup → Brevo DOI → SAMPA Updates. No membership required.
export default function NewsletterSignup({ variant = 'footer' }) {
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

  const isFooter = variant === 'footer';

  return (
    <div className={isFooter ? 'w-full max-w-md' : 'w-full max-w-lg'}>
      <p
        className={
          isFooter
            ? 'text-white font-semibold text-sm mb-1'
            : 'text-text font-semibold text-sm mb-1'
        }
      >
        SAMPA Updates
      </p>
      <p
        className={
          isFooter
            ? 'text-white/55 text-xs mb-3 leading-relaxed'
            : 'text-text/60 text-xs mb-3 leading-relaxed'
        }
      >
        News and organizational updates by email. No membership required.
      </p>

      {done ? (
        <p
          className={
            isFooter
              ? 'text-sm text-white/80 leading-relaxed'
              : 'text-sm text-text/80 leading-relaxed'
          }
          role="status"
        >
          Check your inbox for a confirmation link. You won’t be added until you
          confirm.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="relative flex flex-col gap-2">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="newsletter-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              className={
                isFooter
                  ? 'flex-1 min-w-0 rounded-full bg-white/10 border border-white/25 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40'
                  : 'flex-1 min-w-0 rounded-full bg-white border border-primary/20 px-4 py-2.5 text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-primary/30'
              }
            />
            {/* Honeypot — leave empty */}
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
              className={
                isFooter
                  ? 'shrink-0 rounded-full bg-white text-text px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-60'
                  : 'shrink-0 rounded-full bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60'
              }
            >
              {busy ? 'Sending…' : 'Subscribe'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-300" role="alert">
              {error}
            </p>
          )}
          <p
            className={
              isFooter
                ? 'text-[11px] text-white/40 leading-relaxed'
                : 'text-[11px] text-text/45 leading-relaxed'
            }
          >
            We’ll email a confirmation link (double opt-in). You’re joining the{' '}
            <strong className={isFooter ? 'text-white/55' : 'text-text/60'}>
              SAMPA Updates
            </strong>{' '}
            list via Brevo. See our{' '}
            <Link
              to="/privacy"
              className={
                isFooter
                  ? 'underline underline-offset-2 hover:text-white/70'
                  : 'underline underline-offset-2 hover:text-text/70'
              }
            >
              Privacy Policy
            </Link>
            . Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  );
}
