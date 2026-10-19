import React, { useId, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiPost } from '../lib/api';

const CHOICES = [
  { key: 'daily', label: 'Daily News Roundup' },
  { key: 'weekly', label: 'Weekly Newsletter' },
  { key: 'topic', label: 'Weekly Topic Roundup' },
];

export default function Subscriptions() {
  const baseId = useId();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selected, setSelected] = useState({ daily: false, weekly: false, topic: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost('/api/newsletter-signup', {
        email,
        company: honeypot,
        lists: {
          daily: selected.daily,
          weekly: selected.weekly,
          topic: selected.topic,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Subscription update failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 pt-32 pb-24">
        <h1 className="text-3xl md:text-4xl font-drama font-bold mb-4">
          Manage subscriptions
        </h1>
        <p className="text-text/70 mb-4 leading-relaxed">
          People can choose the SAMPA emails they want. No membership required.
        </p>
        <p className="text-text/70 mb-8 leading-relaxed">
          Checked lists are subscribed, and unchecked lists are removed. New lists send a confirmation email before messages start. We do not show what is already on file.
        </p>

        {done ? (
          <p className="text-text leading-relaxed" role="status">
            Your choices were received. If you asked to join a list, check your inbox for a confirmation link before messages start.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${baseId}-email`} className="text-sm font-semibold">
                Email
              </label>
              <input
                id={`${baseId}-email`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                className="rounded-full border border-primary/20 bg-background px-5 py-3 text-base text-text placeholder:text-text/40 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
              />
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Lists</legend>
              {CHOICES.map((choice) => {
                const id = `${baseId}-${choice.key}`;
                return (
                  <label key={choice.key} htmlFor={id} className="flex items-center gap-3 text-base">
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

            <input
              id="company"
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="self-start rounded-full bg-accent text-white px-7 py-3 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Update subscriptions'}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
