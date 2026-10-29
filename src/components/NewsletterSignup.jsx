import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { apiPost } from '../lib/api';
import { SUBSCRIPTION_CHOICES, selectedLists } from '../lib/subscriptionChoices';

const NAMES = Object.fromEntries(SUBSCRIPTION_CHOICES.map((choice) => [choice.key, choice.label]));

function names(keys) {
  return (keys || []).map((key) => NAMES[key]).filter(Boolean).join(', ');
}

function ListChecks({ selected, setSelected, busy, baseId, onDark }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`text-sm font-semibold ${onDark ? 'text-white/90' : ''}`}>
        Emails
      </legend>
      {SUBSCRIPTION_CHOICES.map((choice) => {
        const id = `${baseId}-${choice.key}`;
        return (
          <label key={choice.key} htmlFor={id} className="flex items-center gap-3 text-sm">
            <input
              id={id}
              type="checkbox"
              name={choice.key}
              checked={selected[choice.key]}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelected((current) => ({ ...current, [choice.key]: checked }));
              }}
              disabled={busy}
            />
            {choice.label}
          </label>
        );
      })}
    </fieldset>
  );
}

function ManageLink({ onDark }) {
  return (
    <p className={`text-sm ${onDark ? 'text-white/70' : 'text-text/60'}`}>
      <Link
        to="/subscriptions"
        className={`underline underline-offset-2 ${onDark ? 'hover:text-white' : 'hover:text-text'}`}
      >
        Manage all email choices
      </Link>
    </p>
  );
}

export default function NewsletterSignup({ variant = 'banner', preset = 'weekly' }) {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selected, setSelected] = useState(() => selectedLists(preset));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!Object.values(selected).some(Boolean)) {
      setError('Choose at least one newsletter.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const data = await apiPost('/api/newsletter-signup', {
        email,
        company: honeypot,
        lists: {
          daily: selected.daily,
          weekly: selected.weekly,
          topic: selected.topic,
        },
      });
      setDone({
        sentDoi: Boolean(data.sentDoi),
        notOpen: data.notOpen || [],
      });
      setEmail('');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const status = done ? (
    <div className="leading-relaxed flex flex-col gap-3" role="status">
      <p>
        {done.sentDoi
          ? 'Check your inbox for a confirmation link. You won’t be added until you confirm.'
          : 'Your choices were received.'}
      </p>
      {done.notOpen.length ? (
        <p>{names(done.notOpen)} signup is not open yet, so we did not sign you up for it.</p>
      ) : null}
    </div>
  ) : null;

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
                Choose your SAMPA emails
              </h2>
              <p className="text-white/85 text-base md:text-lg leading-relaxed mb-3">
                Pick the SAMPA Weekly Newsletter, the SAMPA Daily News Roundup, the SAMPA Emerging Practice Monthly, or any combination.
                No membership required.
              </p>
              <p className="text-white/60 text-sm italic leading-relaxed">
                We respect your privacy and will not share your email.
              </p>
            </div>

            <div>
              {status ? (
                <div className="text-lg text-white leading-relaxed bg-white/10 rounded-3xl px-6 py-8">
                  {status}
                </div>
              ) : (
                <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
                  <label htmlFor={inputId} className="text-sm font-semibold text-white/90">
                    Email
                  </label>
                  <input
                    id={inputId}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    disabled={busy}
                    className="min-w-0 rounded-full bg-white border-0 px-5 py-3.5 text-base text-text placeholder:text-text/40 focus:outline-none focus:ring-4 focus:ring-white/35 disabled:opacity-60"
                  />
                  <ListChecks
                    selected={selected}
                    setSelected={(next) => {
                      setError(null);
                      setSelected(next);
                    }}
                    busy={busy}
                    baseId={inputId}
                    onDark
                  />
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  />
                  {error && (
                    <p className="text-sm text-red-200" role="alert">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="self-start shrink-0 rounded-full bg-white text-primary-text px-7 py-3.5 text-base font-bold hover:bg-white/90 transition-colors disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-white/35"
                  >
                    {busy ? 'Sending…' : 'Subscribe'}
                  </button>
                  <p className="text-xs text-white/55 leading-relaxed">
                    We’ll email a confirmation link (double opt-in). See our{' '}
                    <Link to="/privacy" className="underline underline-offset-2 hover:text-white">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-4 px-2">
          <ManageLink onDark={false} />
        </div>
      </section>
    );
  }

  if (variant === 'card') {
    const headingId = `${inputId}-heading`;
    const heading = NAMES[preset] || 'Choose your SAMPA emails';
    return (
      <section aria-labelledby={headingId}>
        <div className="bg-white rounded-3xl border border-primary/10 px-6 py-8 shadow-sm">
          <h2 id={headingId} className="text-2xl font-drama font-bold mb-2">
            {heading}
          </h2>
          <p className="text-text/70 mb-6 leading-relaxed">
            Choose any combination. No membership required.
          </p>
          {status ? (
            <div className="text-text">{status}</div>
          ) : (
            <form onSubmit={onSubmit} className="relative flex flex-col gap-3">
              <label htmlFor={`${inputId}-card`} className="text-sm font-semibold">
                Email
              </label>
              <input
                id={`${inputId}-card`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                disabled={busy}
                className="min-w-0 rounded-full border border-primary/20 bg-background px-5 py-3 text-base text-text placeholder:text-text/40 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
              />
              <ListChecks
                selected={selected}
                setSelected={(next) => {
                  setError(null);
                  setSelected(next);
                }}
                busy={busy}
                baseId={`${inputId}-card`}
              />
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              {error && (
                <p className="text-sm text-red-600" role="alert">{error}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="self-start shrink-0 rounded-full bg-accent text-white px-7 py-3 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Subscribe'}
              </button>
              <p className="text-xs text-text/55 leading-relaxed">
                We’ll email a confirmation link (double opt-in). See our{' '}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-text">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
        <div className="mt-3 px-1">
          <ManageLink />
        </div>
      </section>
    );
  }

  return null;
}
