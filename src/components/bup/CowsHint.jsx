import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { cowsBand } from '../../lib/bup/cows';
import { cowsLinkProps } from '../../lib/bup/cowsNav';
import { useCows } from './CowsContext';

// Small row shown on COWS-relevant question cards: surfaces the latest
// recorded score as a HINT (the clinician still answers the question — the
// bands embed conditions a number alone can't decide), or offers the
// calculator when no score exists. Never required.
export default function CowsHint() {
  const { latest } = useCows();
  const location = useLocation();
  const cowsLink = cowsLinkProps(location.pathname);

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2.5 text-sm">
      <Activity className="w-4 h-4 text-accent shrink-0" />
      {latest ? (
        <span className="text-text/80">
          Latest calculated COWS:{' '}
          <span className="font-semibold">
            {latest.total} ({cowsBand(latest.total).label.toLowerCase()})
          </span>
          {' · '}
          {new Date(latest.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          {latest.objectiveCount >= 2 && (
            <span className="text-accent font-semibold"> · ≥ 2 objective signs</span>
          )}
        </span>
      ) : (
        <span className="text-text/70">Not sure? Score it with the COWS calculator.</span>
      )}
      <Link
        {...cowsLink}
        className="ml-auto inline-flex items-center gap-1 font-semibold text-accent hover:underline shrink-0"
      >
        {latest ? 'Re-score' : 'Open'}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
