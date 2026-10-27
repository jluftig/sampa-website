import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGet, apiPost } from '../lib/api';

const PATH = '/api/newsletter-stats?section=email-preferences';

export function EmailChoiceList({
  lists,
  emailBlacklisted,
  pendingKey,
  error,
  saved,
  onToggle,
}) {
  return (
    <div>
      {emailBlacklisted && (
        <p className="text-sm text-text/70 mb-6 bg-accent/5 border border-accent/20 rounded-2xl p-4">
          You used an unsubscribe link in a SAMPA email, so none of these lists
          are sending. Turning a list on brings back the other lists you had
          chosen. SAMPA Updates stays off until you turn that switch on.
        </p>
      )}
      <ul className="space-y-4">
        {lists.map((list) => {
          const pending = pendingKey === list.key;
          return (
            <li key={list.key} className="bg-white rounded-4xl border border-primary/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold font-sans tracking-tight">{list.name}</h2>
                  <p className="text-text/70 text-sm mt-1">{list.description}</p>
                  {!list.configured && (
                    <p className="text-xs text-text/40 mt-2">This email is not available yet.</p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={list.subscribed}
                  aria-label={list.name}
                  disabled={!list.configured || Boolean(pendingKey)}
                  onClick={() => onToggle(list)}
                  className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    list.subscribed ? 'bg-primary-text' : 'bg-primary/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                      list.subscribed ? 'translate-x-5' : ''
                    }`}
                  />
                  <span className="sr-only">{pending ? 'Saving' : list.subscribed ? 'On' : 'Off'}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-primary-text mt-4" role="status">Saved</p>
      )}
      {!emailBlacklisted && (
        <p className="text-xs text-text/40 mt-6">
          Each switch changes that list only. The unsubscribe link in a SAMPA email stops all of them.
        </p>
      )}
    </div>
  );
}

export default function EmailChoices() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [pendingKey, setPendingKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    let active = true;
    apiGet(PATH)
      .then((data) => {
        if (active) setState(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load your email choices.');
      });
    return () => { active = false; };
  }, []);

  async function onToggle(list) {
    if (!list.configured || pendingKey) return;
    setPendingKey(list.key);
    setError('');
    setSaved(false);
    try {
      const next = await apiPost(PATH, { key: list.key, on: !list.subscribed });
      setState(next);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not update that email.');
    } finally {
      setPendingKey('');
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-32 pb-24">
        <p className="text-xs font-data uppercase tracking-widest text-primary-text font-bold mb-3">
          My account
        </p>
        <h1 className="text-3xl font-sans tracking-tight font-bold mb-3">
          Choose which SAMPA emails you get
        </h1>
        <p className="text-text/70 mb-8">
          These switches update immediately.{' '}
          <Link to="/dashboard" className="font-semibold text-primary-text hover:underline">
            Back to My account
          </Link>
        </p>
        {!state && !error && <p className="text-text/50 font-data text-sm">Loading your lists…</p>}
        {state && (
          <EmailChoiceList
            lists={state.lists || []}
            emailBlacklisted={Boolean(state.emailBlacklisted)}
            pendingKey={pendingKey}
            error={error}
            saved={saved}
            onToggle={onToggle}
          />
        )}
        {!state && error && <p className="text-red-600 text-sm">{error}</p>}
      </main>
      <Footer />
    </div>
  );
}
