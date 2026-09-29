import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NewsletterSignup from '../components/NewsletterSignup';
import { formatRoundupDate, roundupByDate, roundups } from '../lib/dailyNews';

function RoundupItems({ roundup }) {
  return (
    <ol className="list-decimal pl-6 space-y-6 text-lg leading-relaxed text-text/85">
      {roundup.items.map((item) => (
        <li key={item.url}>
          <strong className="text-text">{item.headline}</strong>
          {` (${item.outlet}, ${item.date}). `}
          {item.summary}{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text font-semibold underline underline-offset-2"
          >
            Source
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function DailyRoundup() {
  const { date } = useParams();
  const roundup = date ? roundupByDate(date) : roundups[0] || null;
  const others = roundups.filter((entry) => entry.date !== roundup?.date);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <p className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
          SAMPA News
        </p>
        {roundup ? (
          <>
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-3">
              {roundup.title}
            </h1>
            <p className="text-lg text-text/70 mb-10">{formatRoundupDate(roundup.date)}</p>
            <RoundupItems roundup={roundup} />
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-4">
              Addiction Daily Roundup
            </h1>
            <p className="text-lg text-text/70 mb-6">No roundup for that date.</p>
            {date && (
              <Link to="/news/daily" className="text-primary-text font-semibold hover:underline">
                Back to the latest roundup
              </Link>
            )}
          </>
        )}

        <div className="mt-14">
          <NewsletterSignup variant="card" list="daily" />
        </div>

        {others.length > 0 && (
          <nav className="mt-14" aria-label="Earlier roundups">
            <h2 className="text-2xl font-drama font-bold mb-4">Earlier roundups</h2>
            <ul className="space-y-2">
              {others.map((entry) => (
                <li key={entry.date}>
                  <Link
                    to={`/news/daily/${entry.date}`}
                    className="text-primary-text font-semibold hover:underline"
                  >
                    {formatRoundupDate(entry.date)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}
