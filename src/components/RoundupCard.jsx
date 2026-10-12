import React from 'react';
import { Link } from 'react-router-dom';
import { formatRoundupDate } from '../lib/dailyNews';

// A daily roundup in the combined /news feed. Same card shape as PostCard so
// the roundups read as the next posts in the same daily stream.
export default function RoundupCard({ roundup }) {
  const items = roundup.items || [];
  return (
    <Link
      to={`/news/daily/${roundup.date}`}
      className="group flex flex-col bg-white rounded-4xl shadow-sm border border-primary/10 overflow-hidden hover:shadow-lg transition-all text-left"
      data-feed-kind="roundup"
    >
      <div className="bg-primary-text text-white px-6 md:px-8 py-5">
        <div className="font-data font-bold tracking-widest text-xs uppercase text-white/80">
          Daily Roundup
        </div>
        <div className="text-lg font-semibold mt-1">{formatRoundupDate(roundup.date)}</div>
      </div>
      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3 group-hover:text-primary-text transition-colors">
          {roundup.title}
        </h3>
        <ul className="space-y-2 text-text/70 text-sm leading-snug list-disc pl-5">
          {items.slice(0, 5).map((item) => (
            <li key={item.url}>{item.headline}</li>
          ))}
        </ul>
        <span className="mt-5 text-primary-text font-semibold text-sm">
          Read all {items.length} items →
        </span>
      </div>
    </Link>
  );
}
