import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../components/useDailyMeta';
import { formatRoundupDate, roundupRecords } from '../lib/dailyNews';
import {
  ARCHIVE_PAGE_SIZE,
  visibleArchive,
  withMonthHeadings,
} from '../lib/dailyNewsArchive';

export default function DailyArchive() {
  const [shown, setShown] = useState(ARCHIVE_PAGE_SIZE);
  const page = visibleArchive(roundupRecords, shown, ARCHIVE_PAGE_SIZE);
  const rows = withMonthHeadings(page.items);
  usePageMeta({
    title: 'Daily News archive | SAMPA',
    path: '/news/daily/archive',
    description: 'Past SAMPA daily addiction-medicine roundups, newest first.',
  });

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <p className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
          SAMPA News
        </p>
        <h1 className="text-4xl md:text-5xl font-drama font-bold mb-3">Daily News archive</h1>
        <p className="text-lg text-text/70 mb-10">
          Every published roundup, newest first.
          {' '}
          <Link to="/news/daily" className="text-primary-text font-semibold hover:underline">
            Latest issue
          </Link>
        </p>

        {page.total === 0 && (
          <p className="text-text/70">No issues yet.</p>
        )}

        <div className="space-y-3">
          {rows.map((row) => row.type === 'month' ? (
            <h2
              key={`month-${row.key}`}
              className="pt-6 first:pt-0 text-sm font-data font-semibold uppercase tracking-widest text-text/50 border-b border-primary/15 pb-2"
            >
              {row.label}
            </h2>
          ) : (
            <article key={row.issue.date} className="bg-white rounded-3xl border border-primary/10 px-5 py-4">
              <Link
                to={`/news/daily/${row.issue.date}`}
                className="text-primary-text font-semibold hover:underline text-lg"
              >
                {formatRoundupDate(row.issue.date)}
              </Link>
              <p className="text-text/70 mt-1">{row.issue.title}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-sm text-text/60 font-data">
            Showing {page.shown} of {page.total} issues
          </p>
          {page.hasMore && (
            <button
              type="button"
              onClick={() => setShown(page.nextShown)}
              className="bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
            >
              Load earlier issues
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
