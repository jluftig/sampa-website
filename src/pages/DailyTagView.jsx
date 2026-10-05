import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../components/useDailyMeta';
import { formatRoundupDate } from '../lib/dailyNews';
import { vocabularyEntry, vocabularyForDecisions, readTagDecisions } from '../lib/dailyNewsArchive';
import { useDailyRoundups } from '../lib/useDailyRoundups';
import NotFound from './NotFound';

function activeVocabulary() {
  if (typeof window === 'undefined') return vocabularyForDecisions(null);
  return vocabularyForDecisions(readTagDecisions(window.localStorage));
}

export default function DailyTagView() {
  const { slug = '' } = useParams();
  const catalog = useDailyRoundups();
  const entry = vocabularyEntry(slug, activeVocabulary());
  usePageMeta({
    title: entry ? `Daily News \u2013 ${entry.label} | SAMPA` : null,
    path: entry ? `/news/daily/tag/${entry.slug}` : null,
    description: entry ? `Daily roundup items tagged ${entry.label}.` : null,
  });

  if (!entry) return <NotFound />;

  const matches = [];
  for (const roundup of catalog) {
    for (const item of roundup.items) {
      if (item.tags?.some((tag) => tag.slug === entry.slug)) {
        matches.push({ roundup, item });
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <p className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
          SAMPA News
        </p>
        <h1 className="text-4xl md:text-5xl font-drama font-bold mb-3">{entry.label}</h1>
        <p className="text-lg text-text/70 mb-10">
          Items from the daily roundup with this keyword.
          {' '}
          <Link to="/news" className="text-primary-text font-semibold hover:underline">
            All news
          </Link>
        </p>

        {matches.length === 0 && (
          <p className="text-text/70">No items tagged {entry.label} yet.</p>
        )}

        <ul className="space-y-4">
          {matches.map(({ roundup, item }) => (
            <li key={item.url} className="bg-white rounded-3xl border border-primary/10 px-5 py-4">
              <Link
                to={`/news/daily/${roundup.date}`}
                className="text-sm font-data text-primary-text font-semibold hover:underline"
              >
                {formatRoundupDate(roundup.date)}
              </Link>
              <p className="font-semibold mt-1">{item.headline}</p>
              <p className="text-text/75 mt-2">{item.summary}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-primary-text font-semibold underline underline-offset-2"
              >
                Source
              </a>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  );
}
