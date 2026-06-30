import React from 'react';
import { Link } from 'react-router-dom';

// Compact tag chip. Shows the short label (e.g. "OUD") inside posts; the full
// name (e.g. "Opioid Use Disorder") appears on hover and on the tag page.
export default function TagChip({ tag }) {
  if (!tag) return null;
  return (
    <Link
      to={`/tags/${tag.slug}`}
      title={tag.name}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-data font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
    >
      {tag.short_label || tag.name}
    </Link>
  );
}
