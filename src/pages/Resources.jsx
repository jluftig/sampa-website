import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  RESOURCES_HUB,
  SAMPA_RESOURCES,
  EXTERNAL_RESOURCES,
  START_STEPS,
} from '../data/practiceResources';

function OriginChip({ origin }) {
  const isSampa = origin === 'sampa';
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold font-data uppercase tracking-wider ${
        isSampa
          ? 'bg-primary/10 text-primary-text'
          : 'bg-accent/10 text-accent'
      }`}
    >
      {isSampa ? 'SAMPA' : 'External'}
    </span>
  );
}

function ResourceCard({ item }) {
  const isExternal = Boolean(item.external);
  const className =
    'group flex flex-col bg-white rounded-4xl border border-primary/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 h-full';
  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <OriginChip origin={item.origin} />
        {item.source && (
          <span className="text-sm text-text/50 font-data">{item.source}</span>
        )}
      </div>
      <h3 className="text-xl md:text-2xl font-drama font-bold text-text group-hover:text-primary-text transition-colors mb-3 leading-snug">
        {item.title}
      </h3>
      <p className="text-text/70 leading-relaxed mb-6">{item.blurb}</p>
      <div className="mt-auto flex flex-wrap items-center gap-4 text-sm text-text/50">
        {item.asOf && <span>{item.asOf}</span>}
        <span className="inline-flex items-center gap-1.5 text-primary-text font-semibold group-hover:underline">
          {item.cta || 'Open'}
          {isExternal ? (
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          )}
        </span>
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {inner}
    </Link>
  );
}

export default function Resources() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="max-w-3xl mb-16 md:mb-20">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="text-primary-text font-bold font-data tracking-widest text-sm uppercase">
              {RESOURCES_HUB.eyebrow}
            </div>
            <span className="text-xs font-data uppercase tracking-wider text-accent font-semibold">
              New
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Start with the{' '}
            <span className="font-drama font-semibold">patient in front of you</span>
          </h1>
          <p className="text-xl text-text/70 leading-relaxed">
            {RESOURCES_HUB.oneLiner}
          </p>
        </header>

        <section className="mb-16 md:mb-20" aria-labelledby="start-heading">
          <h2 id="start-heading" className="text-2xl md:text-3xl font-drama font-bold mb-4">
            If you are new to addiction medicine
          </h2>
          <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
            You do not need an OTP job to start. Read, ask a peer, then open a
            national source — in that order. Every PA who sees patients already
            meets this work.
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {START_STEPS.map((step) => {
              const className =
                'flex flex-col bg-white rounded-4xl border border-primary/10 p-8 h-full hover:border-primary/30 hover:shadow-md transition-all';
              const body = (
                <>
                  <span className="text-xs font-data uppercase tracking-widest text-accent font-semibold mb-3">
                    {step.n}
                  </span>
                  <h3 className="text-xl font-drama font-bold text-text mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-text/70 leading-relaxed mb-6 flex-1">
                    {step.body}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-primary-text font-semibold">
                    {step.cta}
                    {step.external ? (
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </span>
                </>
              );
              return (
                <li key={step.n}>
                  {step.external ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {body}
                    </a>
                  ) : (
                    <Link to={step.href} className={className}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mb-16 md:mb-20" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="text-2xl md:text-3xl font-drama font-bold mb-4">
            Wherever you already practice
          </h2>
          <p className="text-lg text-text/70 leading-relaxed max-w-3xl">
            {RESOURCES_HUB.settingsIntro}
          </p>
        </section>

        <section className="mb-16 md:mb-20" aria-labelledby="sampa-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 id="sampa-heading" className="text-2xl md:text-3xl font-drama font-bold mb-2">
                From SAMPA
              </h2>
              <p className="text-lg text-text/70 leading-relaxed max-w-3xl">
                Our own live work — news, Key Points, comments, and the peer
                directory. Fresh pages, not a restatement of the homepage.
              </p>
            </div>
            <OriginChip origin="sampa" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAMPA_RESOURCES.map((item) => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mb-16 md:mb-20" aria-labelledby="external-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 id="external-heading" className="text-2xl md:text-3xl font-drama font-bold mb-2">
                Public clinical and public-health sources
              </h2>
              <p className="text-lg text-text/70 leading-relaxed max-w-3xl">
                Established agencies and societies. SAMPA did not write these.
                We list them because a PA treating addiction would open them.
                Check the date on the source.
              </p>
            </div>
            <OriginChip origin="external" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EXTERNAL_RESOURCES.map((item) => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section
          className="mb-16 md:mb-20 rounded-3xl border border-primary/15 bg-primary/5 p-8 md:p-10"
          aria-labelledby="building-heading"
        >
          <h2 id="building-heading" className="text-2xl font-drama font-bold mb-3">
            Still in development
          </h2>
          <p className="text-text/75 leading-relaxed max-w-3xl">
            {RESOURCES_HUB.stillBuilding}
          </p>
        </section>

        <p className="text-sm text-text/45 max-w-2xl leading-relaxed">
          {RESOURCES_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
