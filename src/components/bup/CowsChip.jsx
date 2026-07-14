import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ChevronDown, Trash2, RotateCcw } from 'lucide-react';
import { cowsBand, cowsSeriesText } from '../../lib/bup/cows';
import { cowsLinkProps } from '../../lib/bup/cowsNav';
import { useCows } from './CowsContext';
import CopySummaryButton from './CopySummaryButton';

function timeLabel(epochMs) {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Floating chip showing the latest recorded COWS score on every bup-tool page
// (hidden on the calculator itself, and until a score exists). Expands into
// the series panel with Re-score / Copy / Clear.
export default function CowsChip() {
  const { entries, latest, clear } = useCows();
  const location = useLocation();
  const cowsLink = cowsLinkProps(location.pathname);
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!latest || location.pathname.endsWith('/cows')) return null;

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end print:hidden">
      {open && (
        <div className="mb-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl shadow-xl border border-primary/20 p-5">
          <p className="font-data text-xs uppercase tracking-wider text-text/50 mb-3">
            COWS series (this tab)
          </p>
          <ol className="space-y-2 mb-4">
            {entries.map((entry, i) => (
              <li key={entry.takenAt} className="text-sm flex items-baseline gap-2.5">
                <span className="font-data text-xs text-text/40 shrink-0">{i + 1}.</span>
                <span className="font-semibold">COWS {entry.total}</span>
                <span className="text-text/60 truncate">{cowsBand(entry.total).label.toLowerCase()}</span>
                <span className="text-text/50 ml-auto font-data text-xs shrink-0">
                  {timeLabel(entry.takenAt)}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Link
              {...cowsLink}
              onClick={() => {
                cowsLink.onClick?.();
                setOpen(false);
              }}
              className="inline-flex items-center gap-1.5 border-2 border-primary text-primary rounded-full px-4 py-2 text-sm font-semibold hover:bg-primary/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-score
            </Link>
            <CopySummaryButton getText={() => cowsSeriesText(entries)} label="Copy series" />
            <button
              type="button"
              onClick={() => {
                if (confirmClear) {
                  clear();
                  setOpen(false);
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 3000);
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 transition-colors ${
                confirmClear
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-primary/30 text-text/70 hover:border-red-300 hover:text-red-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmClear ? 'Tap again' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg bg-white/95 backdrop-blur-md border-2 border-primary/30 text-sm font-semibold hover:border-primary/60 transition-colors"
      >
        <Activity className="w-4 h-4 text-primary" />
        <span>
          COWS {latest.total} · {timeLabel(latest.takenAt)}
          {latest.objectiveCount >= 2 && (
            <span className="text-accent"> · {latest.objectiveCount} obj</span>
          )}
        </span>
        {open && <ChevronDown className="w-4 h-4 text-text/50" />}
      </button>
    </div>
  );
}
