import React, { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiPost } from '../lib/api';

const CHOICES = [
  { key: 'daily', label: 'SAMPA Daily News Roundup' },
  { key: 'weekly', label: 'SAMPA Weekly Newsletter' },
  { key: 'topic', label: 'SAMPA Monthly Topic Roundup' },
];

const LABELS = Object.fromEntries(CHOICES.map((choice) => [choice.key, choice.label]));

function names(keys) {
  return (keys || []).map((key) => LABELS[key]).filter(Boolean).join(', ');
}

// The token payload is signed server-side; reading the list names here is
// display only. The server verifies the signature before removing anything.
function tokenLists(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
    return (payload.l || []).filter((key) => LABELS[key]);
  } catch {
    return [];
  }
}

function ConfirmRemoval({ token }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [removed, setRemoved] = useState(null);
  const lists = tokenLists(token);

  const onConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await apiPost('/api/newsletter-signup', { confirm: token });
      setRemoved(data.removed || []);
    } catch (err) {
      const failed = err.data?.failed;
      setError(
        failed?.length
          ? `We could not remove: ${names(failed)}. ${names(err.data.removed) ? `Removed: ${names(err.data.removed)}. ` : ''}Please select Confirm again to retry.`
          : err.message || 'Subscription update failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (removed) {
    return (
      <p className="text-text leading-relaxed" role="status">
        Done. This address will no longer receive: {names(removed) || 'the lists you chose'}.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text/70 leading-relaxed">
        Confirm that you want to stop receiving {lists.length ? names(lists) : 'the SAMPA emails you chose'}. Nothing changes until you confirm.
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="self-start rounded-full bg-accent text-white px-7 py-3 text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Confirm and stop these emails'}
      </button>
    </div>
  );
}

export default function Subscriptions() {
  const [params] = useSearchParams();
  const confirmToken = params.get('confirm');
  const baseId = useId();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [selected, setSelected] = useState({ daily: false, weekly: false, topic: false });
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
        asked: Object.keys(selected).filter((key) => !selected[key]).length > 0,
      });
    } catch (err) {
      const failed = err.data?.failed;
      setError(
        failed?.length
          ? `We could not save: ${names(failed)}. Your other choices were received, so only retry the ones listed.`
          : err.message || 'Subscription update failed. Please try again.',
      );
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
          Checked lists send a confirmation email before messages start. For unchecked lists, we email the address a link to confirm before anything is removed, so nobody can change an address that is not theirs. We do not show what is already on file.
        </p>

        {confirmToken ? (
          <ConfirmRemoval token={confirmToken} />
        ) : done ? (
          <div className="text-text leading-relaxed flex flex-col gap-3" role="status">
            {done.sentDoi ? (
              <p>Your choices were received. Check your inbox for a confirmation link for the lists you chose before messages start.</p>
            ) : (
              <p>Your choices were received.</p>
            )}
            {done.notOpen.length ? (
              <p>{names(done.notOpen)} signup is not open yet, so we did not sign you up for it. Please check back later.</p>
            ) : null}
            {done.asked ? (
              <p>If this address is on any list you left unchecked, we sent an email with a link to confirm removing it. Nothing is removed until that link is used.</p>
            ) : null}
          </div>
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
                        if (checked) setError(null);
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
