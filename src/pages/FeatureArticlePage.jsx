import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../components/useDailyMeta';
import { formatRoundupDate } from '../lib/dailyNewsLoad.js';
import {
  collectFeatures,
  featureBySlug,
  isFeatureVisible,
} from '../lib/newsFeatures.js';
import NotFound from './NotFound';

export function FeatureArticlePage({
  slug,
  modules,
  now = new Date(),
  asOfDay = null,
}) {
  const feature = featureBySlug(collectFeatures(modules, () => {}), slug);
  const visible = isFeatureVisible(feature, now, asOfDay);
  usePageMeta({
    title: visible ? `${feature.title} | SAMPA` : null,
    path: visible ? feature.path : null,
    description: visible ? feature.description : null,
    robots: visible ? null : 'noindex',
  });

  if (!visible) return <NotFound />;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
        <Link to="/news" className="font-data text-sm font-semibold text-primary-text hover:underline">
          ← All news
        </Link>

        <article className="mt-8" data-testid="feature-article">
          <header className="mb-10">
            <p className="mb-4 font-data text-xs font-bold uppercase tracking-widest text-primary-text">
              {formatRoundupDate(feature.publishedOn)}
            </p>
            <h1 className="font-drama text-3xl font-bold leading-tight md:text-5xl">
              {feature.title}
            </h1>
            <p className="mt-4 text-lg text-text/70">{feature.byline}</p>
          </header>

          <div className="space-y-6 text-lg leading-relaxed text-text/90">
            {feature.paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 space-y-1 text-lg leading-relaxed">
            {feature.signature.map((line) => (
              <p key={line} className="whitespace-pre-wrap">{line}</p>
            ))}
          </div>

          <section className="mt-12" data-testid="feature-references">
            <h2 className="mb-4 text-2xl font-bold">References</h2>
            <div className="space-y-4 text-left">
              {feature.references.map((reference) => (
                <p key={reference.url} className="m-0 ml-0 pl-0 indent-0 text-left">
                  {reference.text}{' '}
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words font-semibold text-primary-text underline underline-offset-2"
                  >
                    {reference.url}
                  </a>
                </p>
              ))}
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
