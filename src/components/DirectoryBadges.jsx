import React from 'react';
import { directoryBadgeLabels } from '../lib/directoryBadges';

const SIZE = {
  sm: 'px-2.5 py-0.5',
  md: 'px-3 py-1',
};

// Board + Patron chips on the peer directory. Patron is never a membership_tier.
export function DirectoryBadges({ person, size = 'sm', className = '' }) {
  const labels = directoryBadgeLabels(person);
  if (labels.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 shrink-0 ${className}`}>
      {labels.map((label) => (
        <span
          key={label}
          className={`${SIZE[size] || SIZE.sm} rounded-full bg-primary-text/10 text-primary-text text-xs font-data font-semibold uppercase tracking-wider`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
