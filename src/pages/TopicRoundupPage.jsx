import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../components/useDailyMeta';
import { topicPage } from '../lib/topicRoundup';
import NotFound from './NotFound';

const DESCRIPTION = 'A Weekly Topic Roundup from SAMPA.';
const FOOTNOTE_HEADING = 'mt-10 text-sm font-data font-semibold uppercase tracking-widest text-text/50';
const SOURCE_LINK = 'text-primary-text font-semibold underline underline-offset-2';

export function TopicRoundupPage({ date, modules }) {
  const page = topicPage(date, modules);
  const issue = page.status === 'issue' ? page.issue : null;
  const dated = Boolean(date);

  let title = null;
  let path = null;
  let robots = null;
  if (page.status === 'not-found') {
    robots = 'noindex';
  } else if (page.status === 'empty') {
    title = 'Weekly Topic Roundup';
    path = '/news/topic';
  } else if (issue) {
    title = issue.title;
    path = `/news/topic/${issue.date}`;
    robots = issue.banner ? 'noindex' : null;
  }

  usePageMeta({
    title,
    path,
    description: DESCRIPTION,
    robots,
  });

  if (page.status === 'not-found') return <NotFound />;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <p className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
          SAMPA News
        </p>
        {issue ? (
          <>
            {issue.banner ? (
              <p
                role="status"
                className="mb-6 rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-text"
              >
                {issue.banner}
              </p>
            ) : null}
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-3">{issue.title}</h1>
            <p className="text-lg text-text/70 mb-3">{issue.weekday}</p>
            <p className="text-sm text-text/60 mb-10 flex flex-wrap gap-x-4 gap-y-2">
              {dated ? (
                <span>Permanent page for this issue.</span>
              ) : (
                <Link to={issue.path} className="text-primary-text font-semibold hover:underline">
                  Permanent link for {issue.weekday}
                </Link>
              )}
              {!issue.isLatest ? (
                <Link to="/news/topic" className="text-primary-text font-semibold hover:underline">
                  Latest issue
                </Link>
              ) : null}
              <Link to="/news" className="text-primary-text font-semibold hover:underline">
                All news
              </Link>
            </p>
            <ol className="list-decimal pl-6 space-y-6 text-lg leading-relaxed text-text/85">
              {issue.items.map((item) => (
                <li key={item.url}>
                  <strong className="text-text">{item.headline}</strong>
                  {` (${item.outlet}, ${item.date}). `}
                  {item.summary}
                  {' '}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={SOURCE_LINK}
                  >
                    Source
                  </a>
                </li>
              ))}
            </ol>
            {issue.furtherReading.length > 0 ? (
              <>
                <h2 className="mt-14 mb-4 text-2xl font-drama font-bold">Further reading</h2>
                <div className="space-y-4 text-base leading-relaxed text-text/80">
                  {issue.furtherReading.map((entry) => (
                    <p key={entry.href}>
                      {entry.lead}
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={SOURCE_LINK}
                      >
                        {entry.doi}
                      </a>
                    </p>
                  ))}
                </div>
              </>
            ) : null}
            {issue.consideredSkipped.length > 0 ? (
              <>
                <h2 className={FOOTNOTE_HEADING}>Considered and skipped</h2>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-text/60">
                  {issue.consideredSkipped.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {issue.notes.length > 0 ? (
              <>
                <h2 className={FOOTNOTE_HEADING}>Notes and caveats</h2>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-text/60">
                  {issue.notes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-4">
              Weekly Topic Roundup
            </h1>
            <p className="text-lg text-text/70">The first Weekly Topic Roundup is on the way.</p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
