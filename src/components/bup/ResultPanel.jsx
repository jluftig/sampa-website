import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CircleDashed } from 'lucide-react';
import { chooserSummaryText } from '../../lib/bup/summary';
import OutcomeCard from './OutcomeCard';
import CopySummaryButton from './CopySummaryButton';
import PrintButton from './PrintButton';

function PanelBody({ result }) {
  const { path, outcome } = result;

  if (outcome) {
    return (
      <div>
        <OutcomeCard outcome={outcome} />
        <div className="flex flex-wrap gap-3 mt-4">
          <CopySummaryButton getText={() => chooserSummaryText(result)} />
          <PrintButton label="Print summary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-data font-semibold uppercase tracking-wider mb-3">
        <CircleDashed className="w-3.5 h-3.5" />
        In progress
      </div>
      <p className="text-sm text-text/70 mb-4">
        {path.length === 0
          ? 'Answer the questions and the recommended start strategy appears here.'
          : 'Keep answering — the recommendation updates as you go.'}
      </p>
      {path.length > 0 && (
        <ol className="space-y-2">
          {path.map((entry) => (
            <li key={entry.nodeId} className="text-sm">
              <span className="text-text/50">{entry.prompt}</span>{' '}
              <span className="font-semibold">{entry.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// The always-visible running result. Desktop: sticky side column. Mobile: a
// fixed bottom bar with a one-line status that expands into the full card
// (the question column needs pb-24 lg:pb-0 so the bar never covers content).
export default function ResultPanel({ result }) {
  const [expanded, setExpanded] = useState(false);
  const { outcome, path } = result;

  const statusLine = outcome
    ? outcome.title
    : path.length === 0
      ? 'Recommendation appears here'
      : 'Keep answering…';

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block lg:sticky lg:top-28" aria-live="polite">
        <PanelBody result={result} />
      </div>

      {/* Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3" aria-live="polite">
        {expanded && (
          <div className="mb-2 max-h-[70vh] overflow-y-auto rounded-3xl shadow-xl">
            <PanelBody result={result} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={`w-full flex items-center justify-between gap-3 rounded-full px-5 py-3.5 shadow-lg border text-left ${
            outcome
              ? 'bg-gradient-to-r from-primary to-accent text-white border-transparent'
              : 'bg-white/95 backdrop-blur-md border-primary/20 text-text'
          }`}
        >
          <span className="text-sm font-semibold truncate">
            {outcome ? `Recommended: ${statusLine}` : statusLine}
          </span>
          {expanded ? (
            <ChevronDown className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronUp className="w-5 h-5 shrink-0" />
          )}
        </button>
      </div>
    </>
  );
}
