import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { roundupRecords } from '../lib/dailyNews';
import {
  annotateRoundups,
  applyTagDecision,
  buildSuggestionQueue,
  readTagDecisions,
  vocabularyForDecisions,
  writeTagDecisions,
} from '../lib/dailyNewsArchive';
import { DAILY_VOCABULARY } from '../lib/dailyNewsVocabulary';

function loadDecisions() {
  if (typeof window === 'undefined') return { approved: [], dismissed: [] };
  return readTagDecisions(window.localStorage);
}

export default function SuggestedDailyTags() {
  const [decisions, setDecisions] = useState(loadDecisions);
  const vocabulary = vocabularyForDecisions(decisions);
  const queue = useMemo(
    () => buildSuggestionQueue(annotateRoundups(roundupRecords, vocabulary), decisions),
    [vocabulary, decisions],
  );

  function commit(next) {
    writeTagDecisions(window.localStorage, next);
    setDecisions(next);
  }

  function approve(entry) {
    commit(applyTagDecision(decisions, { type: 'approve', slug: entry.slug, label: entry.label }));
  }

  function dismiss(entry) {
    commit(applyTagDecision(decisions, { type: 'dismiss', slug: entry.slug, label: entry.label }));
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <p className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
          Admin
        </p>
        <h1 className="text-4xl md:text-5xl font-drama font-bold mb-3">Suggested tags</h1>
        <p className="text-lg text-text/70 mb-4">
          Roundup items that matched none of the keyword list. Approve adds the keyword in this browser. Dismiss hides it.
        </p>
        <p className="text-sm bg-white border border-primary/15 rounded-2xl px-4 py-3 mb-10 text-text/80">
          Email to Josh is stubbed. Nothing is sent. Each card shows the notice that would have gone out.
        </p>

        {queue.length === 0 && (
          <p className="text-text/70 mb-10">No suggested keywords right now. Every current item matched the vocabulary, or the rest were approved or dismissed in this browser.</p>
        )}

        <ul className="space-y-6">
          {queue.map((entry) => (
            <li key={entry.slug} className="bg-white rounded-3xl border border-primary/10 p-5">
              <h2 className="text-2xl font-drama font-bold">{entry.label}</h2>
              <p className="text-sm font-data text-text/50 mt-1">{entry.slug}</p>
              <p className="text-sm font-semibold text-primary-text mt-3">
                Notification stubbed — no email sent
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-text/75 font-sans bg-background rounded-2xl px-3 py-3">
                {`To: ${entry.notice.to}\nSubject: ${entry.notice.subject}\n\n${entry.notice.body}`}
              </pre>
              <ul className="mt-4 space-y-2">
                {entry.items.map((item) => (
                  <li key={item.url}>
                    <Link to={`/news/daily/${item.date}`} className="text-primary-text font-semibold hover:underline">
                      {item.date}
                    </Link>
                    <span className="text-text/80">{` — ${item.headline}`}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => approve(entry)}
                  className="bg-accent text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(entry)}
                  className="px-4 py-2 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary-text hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-14">
          <h2 className="text-2xl font-drama font-bold mb-3">Vocabulary</h2>
          <ul className="flex flex-wrap gap-2">
            {DAILY_VOCABULARY.map((entry) => (
              <li key={entry.slug} className="rounded-full border border-primary/20 bg-white px-3 py-1 text-sm">
                {entry.label}
              </li>
            ))}
            {decisions.approved.map((entry) => (
              <li key={entry.slug} className="rounded-full border border-accent/30 bg-white px-3 py-1 text-sm">
                {entry.label} (approved here)
              </li>
            ))}
          </ul>
          <p className="text-sm text-text/60 mt-4">
            Approval is stored in this browser only. Adding the keyword to the shared vocabulary is a follow-up edit in the repo. No message leaves the site.
          </p>
          <Link to="/editor" className="inline-block mt-4 text-primary-text font-semibold hover:underline">
            Back to the editor
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
