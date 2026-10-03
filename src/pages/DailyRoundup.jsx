import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NewsletterSignup from '../components/NewsletterSignup';
import DailyItemList from '../components/DailyItemList';
import { usePageMeta } from '../components/useDailyMeta';
import { formatRoundupDate } from '../lib/dailyNews';
import { dailyNewsTitle, dailyPageRobots, resolveDailyDate } from '../lib/dailyNewsArchive';
import { useDailyRoundups } from '../lib/useDailyRoundups';
import NotFound from './NotFound';

const DESCRIPTION = 'Five short addiction-medicine items, published each weekday by SAMPA.';

export default function DailyRoundup() {
  const { date } = useParams();
  const catalog = useDailyRoundups();
  const resolution = resolveDailyDate(date, catalog);
  const roundup = resolution.roundup;
  const title = roundup ? dailyNewsTitle(roundup.date) : null;
  usePageMeta({
    title: resolution.status === 'not-found' ? null : title,
    path: resolution.status === 'not-found' || !roundup ? null : `/news/daily/${roundup.date}`,
    description: resolution.status === 'not-found' ? null : DESCRIPTION,
    robots: dailyPageRobots(resolution.status),
  });

  if (resolution.status === 'not-found') return <NotFound />;

  const onDatedPage = Boolean(date);
  const isLatest = roundup && catalog[0]?.date === roundup.date;

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
            <p className="text-lg text-text/70 mb-3">{formatRoundupDate(roundup.date)}</p>
            <p className="text-sm text-text/60 mb-10 flex flex-wrap gap-x-4 gap-y-2">
              {onDatedPage ? (
                <span>Permanent page for this issue.</span>
              ) : (
                <Link
                  to={`/news/daily/${roundup.date}`}
                  className="text-primary-text font-semibold hover:underline"
                >
                  Permanent link for {formatRoundupDate(roundup.date)}
                </Link>
              )}
              {!isLatest && (
                <Link to="/news/daily" className="text-primary-text font-semibold hover:underline">
                  Latest issue
                </Link>
              )}
              <Link to="/news/daily/archive" className="text-primary-text font-semibold hover:underline">
                All issues
              </Link>
            </p>
            <DailyItemList items={roundup.items} />
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-4">
              Addiction Daily Roundup
            </h1>
            <p className="text-lg text-text/70">The first issue is on the way.</p>
          </>
        )}

        <div className="mt-14">
          <NewsletterSignup variant="card" list="daily" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
