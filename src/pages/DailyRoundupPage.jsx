import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NewsletterSignup from '../components/NewsletterSignup';
import DailyItemList from '../components/DailyItemList';
import FeaturedLead from '../components/FeaturedLead';
import { formatRoundupDate } from '../lib/dailyNewsLoad.js';

// Presentational daily issue. DailyRoundup owns the catalog, the date gate,
// and page meta. previewFeature is a dev-only fixture for screenshots.
export function DailyRoundupPage({ date, resolution, catalog, previewFeature = null }) {
  const roundup = resolution.roundup;
  const onDatedPage = Boolean(date);
  const isLatest = roundup && catalog[0]?.date === roundup.date;
  const feature = previewFeature || roundup?.feature || null;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <p className="mb-4 font-data text-sm font-bold uppercase tracking-widest text-primary-text">
          SAMPA News
        </p>
        {roundup ? (
          <>
            <h1 className="mb-3 font-drama text-4xl font-bold md:text-5xl">
              {roundup.title}
            </h1>
            <p className="mb-3 text-lg text-text/70">{formatRoundupDate(roundup.date)}</p>
            <p className="mb-10 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text/60">
              {onDatedPage ? (
                <span>Permanent page for this issue.</span>
              ) : (
                <Link
                  to={`/news/daily/${roundup.date}`}
                  className="font-semibold text-primary-text hover:underline"
                >
                  Permanent link for {formatRoundupDate(roundup.date)}
                </Link>
              )}
              {!isLatest && (
                <Link to="/news/daily" className="font-semibold text-primary-text hover:underline">
                  Latest issue
                </Link>
              )}
              <Link to="/news" className="font-semibold text-primary-text hover:underline">
                All news
              </Link>
            </p>
            <FeaturedLead feature={feature} />
            <DailyItemList items={roundup.items} />
          </>
        ) : (
          <>
            <h1 className="mb-4 font-drama text-4xl font-bold md:text-5xl">
              Addiction Daily Roundup
            </h1>
            <p className="text-lg text-text/70">The first issue is on the way.</p>
          </>
        )}

        <div className="mt-14">
          <NewsletterSignup variant="card" preset="daily" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
