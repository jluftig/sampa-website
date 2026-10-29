import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../components/useDailyMeta';
import { topicPage } from '../lib/topicRoundup';
import NotFound from './NotFound';
import NewsletterSignup from '../components/NewsletterSignup';

const DESCRIPTION = 'This issue of SAMPA Emerging Practice Monthly: a new outpatient case series, a systematic review, inpatient approaches and a cautionary case on moving people from methadone to long-acting injectable bup.';
const SOURCE_LINK = 'text-primary-text font-semibold underline underline-offset-2';

function readingGroups(entries) {
  const groups = [];
  for (const entry of entries) {
    const label = entry.section || '';
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, entries: [entry] });
    else last.entries.push(entry);
  }
  return groups;
}

function SourceCard({ item, index }) {
  const centerpiece = index === 0;
  return (
    <article className={centerpiece
      ? 'rounded-2xl border-l-4 border-primary bg-primary/5 px-5 py-5 mb-6'
      : 'border-b border-primary/10 pb-6 mb-6'}
    >
      {centerpiece ? (
        <p className="text-xs font-bold tracking-widest uppercase text-accent mb-2">This month’s centerpiece</p>
      ) : null}
      <p className="text-xs font-bold tracking-wide uppercase text-text/40 mb-2">
        {`${index + 1} · ${item.outlet} · ${item.date}`}
      </p>
      <h2 className={`${centerpiece ? 'text-2xl' : 'text-xl'} font-bold leading-snug mb-3`}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary-text hover:underline">
          {item.headline}
        </a>
      </h2>
      <p className="text-text/80 leading-relaxed mb-3">{item.summary}</p>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={SOURCE_LINK}>
        Read the source →
      </a>
    </article>
  );
}

export function TopicRoundupPage({ date, modules }) {
  const page = topicPage(date, modules);
  const issue = page.status === 'issue' ? page.issue : null;

  let title = null;
  let path = null;
  let robots = null;
  if (page.status === 'not-found') {
    robots = 'noindex';
  } else if (page.status === 'empty') {
    title = 'SAMPA Emerging Practice Monthly';
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
            {issue.kicker ? (
              <p className="text-xs font-bold tracking-widest uppercase text-accent mb-4">{issue.kicker}</p>
            ) : null}
            <div className="rounded-3xl bg-primary-text text-white px-6 py-7 mb-10">
              <h1 className="text-3xl md:text-4xl font-drama font-bold mb-4">{issue.headline || issue.title}</h1>
              {issue.summary ? (
                <p className="text-white/85 leading-relaxed">{issue.summary}</p>
              ) : null}
            </div>
            <p className="text-sm text-text/60 mb-8 flex flex-wrap gap-x-4 gap-y-2">
              <Link to={issue.path} className="text-primary-text font-semibold hover:underline">
                Permanent link
              </Link>
              {!issue.isLatest ? (
                <Link to="/news/topic" className="text-primary-text font-semibold hover:underline">
                  Latest issue
                </Link>
              ) : null}
              <Link to="/news" className="text-primary-text font-semibold hover:underline">
                All news
              </Link>
            </p>
            <p className="text-xs font-bold tracking-widest uppercase text-accent mb-4">Sources</p>
            {issue.items.map((item, index) => (
              <SourceCard key={item.url} item={item} index={index} />
            ))}
            {issue.furtherReading.length > 0 ? (
              <div className="mt-10">
                <h2 className="text-xs font-bold tracking-widest uppercase text-accent mb-4">Further reading</h2>
                {readingGroups(issue.furtherReading).map((group) => (
                  <div key={group.label || 'reading'} className="mb-6">
                    {group.label ? (
                      <h3 className="text-sm font-bold text-text/60 mb-3">{group.label}</h3>
                    ) : null}
                    <ul className="space-y-2 text-base leading-relaxed text-text/80 list-disc pl-5">
                      {group.entries.map((entry) => (
                        <li key={entry.href}>
                          {`${entry.author.endsWith('.') ? entry.author : `${entry.author}.`} (${entry.year}). `}
                          <a href={entry.href} target="_blank" rel="noopener noreferrer" className="text-primary-text underline underline-offset-2">
                            {entry.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
            {issue.consideredSkipped.length > 0 ? (
              <>
                <h2 className="mt-10 text-sm font-data font-semibold uppercase tracking-widest text-text/50">Considered and skipped</h2>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-text/60">
                  {issue.consideredSkipped.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {issue.notes.length > 0 ? (
              <div className="mt-8 space-y-3 text-sm leading-relaxed text-text/60">
                {issue.notes.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
            <p className="mt-8 font-semibold">The SAMPA news desk</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-drama font-bold mb-4">
              SAMPA Emerging Practice Monthly
            </h1>
            <p className="text-lg text-text/70">The first SAMPA Emerging Practice Monthly is on the way.</p>
          </>
        )}

        <div className="mt-14">
          <NewsletterSignup variant="card" preset="topic" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
