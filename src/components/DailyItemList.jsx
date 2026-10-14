import React from 'react';
import { Link } from 'react-router-dom';

export default function DailyItemList({ items }) {
  return (
    <ol className="list-decimal pl-6 space-y-6 text-lg leading-relaxed text-text/85">
      {items.map((item) => (
        <li key={item.url}>
          <strong className="text-text">{item.headline}</strong>
          {` (${item.outlet}, ${item.date}). `}
          {item.summary}{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text font-semibold underline underline-offset-2"
          >
            Source
          </a>
          {item.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  to={`/news/daily/tag/${tag.slug}`}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm font-semibold text-primary-text hover:bg-primary-text hover:text-white"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
