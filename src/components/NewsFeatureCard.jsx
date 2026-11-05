import React from 'react';
import { Link } from 'react-router-dom';
import { formatRoundupDate } from '../lib/dailyNewsLoad.js';

// A feature article in the combined /news feed. Same card shape as a roundup.
export default function NewsFeatureCard({ feature }) {
  return (
    <Link
      to={feature.path}
      className="group flex flex-col overflow-hidden rounded-4xl border border-primary/10 bg-white text-left shadow-sm transition-all hover:shadow-lg"
      data-feed-kind="feature"
    >
      <div className="bg-primary-text px-6 py-5 text-white md:px-8">
        <div className="font-data text-xs font-bold uppercase tracking-widest text-white/80">
          Feature
        </div>
        <div className="mt-1 text-lg font-semibold">{formatRoundupDate(feature.publishedOn)}</div>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3 className="mb-3 text-xl font-bold tracking-tight transition-colors group-hover:text-primary-text md:text-2xl">
          {feature.title}
        </h3>
        {feature.description && (
          <p className="line-clamp-4 text-text/70">{feature.description}</p>
        )}
        {feature.byline && (
          <p className="mt-4 text-sm text-text/60">{feature.byline}</p>
        )}
        <span className="mt-5 text-sm font-semibold text-primary-text">
          Read the feature
        </span>
      </div>
    </Link>
  );
}
