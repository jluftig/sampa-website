import React from 'react';
import { Link } from 'react-router-dom';

// Optional lead card on a daily issue. The issue JSON supplies title, teaser,
// href, and byline. The numbered stories stay below this card.
export default function FeaturedLead({ feature }) {
  if (!feature?.title || !feature?.href) return null;
  return (
    <Link
      to={feature.href}
      className="group mb-10 block rounded-4xl border border-primary/15 bg-white p-6 shadow-sm transition-all hover:shadow-lg md:p-8"
      data-testid="featured-lead"
    >
      <div className="mb-3 font-data text-xs font-bold uppercase tracking-widest text-primary-text">
        Feature
      </div>
      <h2 className="font-drama text-2xl font-bold leading-tight transition-colors group-hover:text-primary-text md:text-3xl">
        {feature.title}
      </h2>
      {feature.teaser && (
        <p className="mt-3 text-lg leading-relaxed text-text/80">{feature.teaser}</p>
      )}
      {feature.byline && (
        <p className="mt-4 text-sm text-text/60">{feature.byline}</p>
      )}
      <span className="mt-4 inline-block font-semibold text-primary-text">
        Read the feature
      </span>
    </Link>
  );
}
