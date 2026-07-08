import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Eye, RotateCcw, TriangleAlert, Trash2 } from 'lucide-react';
import { COWS, scoreCows, cowsBand, cowsSeriesText } from '../../../lib/bup/cows';
import { useCows } from '../../../components/bup/CowsContext';
import CopySummaryButton from '../../../components/bup/CopySummaryButton';

function timeLabel(epochMs) {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// One COWS item: stacked answer buttons, each showing its point value; the
// grades that count as objective signs carry an "OBJ" badge (text + tint, not
// color alone).
function CowsItemCard({ item, index, selectedIdx, onSelect }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-data text-xs text-primary font-semibold shrink-0">{index + 1}</span>
        <h3 className="font-semibold text-lg leading-snug">{item.label}</h3>
      </div>
      {item.help && <p className="text-sm text-text/60 mb-3 ml-6">{item.help}</p>}
      {!item.help && <div className="mb-3" />}

      <div className="grid gap-2" role="radiogroup" aria-label={item.label}>
        {item.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(isSelected ? undefined : idx)}
              className={`w-full text-left border-2 rounded-2xl px-4 py-2.5 transition-colors flex items-center gap-3 ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/10 bg-white hover:border-primary/40'
              }`}
            >
              <span
                className={`font-data text-xs font-bold w-7 h-7 inline-flex items-center justify-center rounded-full shrink-0 ${
                  isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}
                aria-hidden="true"
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : opt.points}
              </span>
              <span className="text-sm font-medium flex-1">{opt.label}</span>
              {opt.objective && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-data font-bold uppercase tracking-wider shrink-0">
                  <Eye className="w-3 h-3" />
                  Obj
                </span>
              )}
              {isSelected && (
                <span className="font-data text-xs font-bold text-primary shrink-0">+{opt.points}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScorePanelBody({ result, entries, canRecord, onRecord, onRescore, onClear, hasSelections }) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="bg-white rounded-3xl shadow-md border-2 border-primary/30 p-6 md:p-7">
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <p className="font-data text-xs uppercase tracking-wider text-text/50 mb-1">COWS score</p>
          <p className="text-4xl font-bold leading-none">{result.total}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-primary">{result.band.label}</p>
          <p className="font-data text-xs text-text/50">{result.answeredCount} of {COWS.items.length} scored</p>
        </div>
      </div>

      <p className="text-sm text-text/70 mt-3">
        {result.objectiveCount} objective sign{result.objectiveCount === 1 ? '' : 's'} present
        {result.objectiveCount > 0 && (
          <span className="text-text/50"> — {result.objectiveLabels.join(', ').toLowerCase()}</span>
        )}
      </p>

      <div aria-live="polite">
        {result.objectiveCount >= 2 && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl px-4 py-3 mt-3 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-accent">
              ≥ 2 objective signs present — with COWS ≥ 8 this meets the Quick Start start condition.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          disabled={!canRecord}
          onClick={onRecord}
          className="btn-magnetic bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Record score — {timeLabel(Date.now())}</span>
        </button>
        {hasSelections && entries.length > 0 && (
          <button
            type="button"
            onClick={onRescore}
            className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors w-full"
          >
            <RotateCcw className="w-4 h-4" />
            Start re-score (keeps the series)
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="border-t border-primary/10 mt-6 pt-5">
          <p className="font-data text-xs uppercase tracking-wider text-text/50 mb-3">Recorded series</p>
          <ol className="space-y-2 mb-4">
            {entries.map((entry, i) => (
              <li key={entry.takenAt} className="text-sm flex items-baseline gap-3">
                <span className="font-data text-xs text-text/40 shrink-0">{i + 1}.</span>
                <span className="font-semibold">COWS {entry.total}</span>
                <span className="text-text/60">{cowsBand(entry.total).label.toLowerCase()}</span>
                <span className="text-text/50 ml-auto font-data text-xs">{timeLabel(entry.takenAt)}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <CopySummaryButton getText={() => cowsSeriesText(entries)} label="Copy series for EHR" />
            <button
              type="button"
              onClick={() => {
                if (confirmClear) {
                  onClear();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 3000);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border-2 transition-colors ${
                confirmClear
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-primary/30 text-text/70 hover:border-red-300 hover:text-red-700'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmClear ? 'Tap again to clear all scores' : 'Clear scores'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CowsCalculatorPage() {
  const { entries, record, clear } = useCows();
  const [selections, setSelections] = useState({});
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => scoreCows(selections), [selections]);

  const hasSelections = Object.values(selections).some((v) => v !== undefined);

  const panelProps = {
    result,
    entries,
    canRecord: result.answeredCount > 0,
    hasSelections,
    onRecord: () => record(selections),
    onRescore: () => setSelections({}),
    onClear: clear,
  };

  return (
    <div>
      <Link
        to="/tools/bup"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors mb-8 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to protocol chooser
      </Link>

      <header className="mb-10 max-w-3xl">
        <div className="w-fit px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-5 font-data uppercase tracking-wider">
          Calculator · optional
        </div>
        <h1 className="text-3xl md:text-5xl font-drama font-bold mb-4 leading-tight">
          COWS — Clinical Opiate Withdrawal Scale
        </h1>
        <p className="text-text/70">
          A formal score is never required — clinical gestalt is fine, especially in obvious severe
          withdrawal. Recorded scores stay visible throughout the tool (this tab only) and can be
          re-scored at reassessment and copied into the EHR as a timestamped series.
        </p>
        <p className="text-sm text-text/50 mt-2">{COWS.startCondition}</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-4 pb-28 lg:pb-0">
          {COWS.items.map((item, i) => (
            <CowsItemCard
              key={item.key}
              item={item}
              index={i}
              selectedIdx={selections[item.key]}
              onSelect={(idx) =>
                setSelections((prev) => ({ ...prev, [item.key]: idx }))
              }
            />
          ))}
        </div>

        {/* Desktop: sticky panel */}
        <div className="lg:col-span-2 hidden lg:block lg:sticky lg:top-28" aria-live="polite">
          <ScorePanelBody {...panelProps} />
        </div>
      </div>

      {/* Mobile: fixed bottom bar, expandable */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 print:hidden" aria-live="polite">
        {expanded && (
          <div className="mb-2 max-h-[70vh] overflow-y-auto rounded-3xl shadow-xl">
            <ScorePanelBody {...panelProps} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-3 rounded-full px-5 py-3.5 shadow-lg border bg-gradient-to-r from-primary to-accent text-white border-transparent text-left"
        >
          <span className="text-sm font-semibold truncate">
            COWS {result.total} · {result.band.label}
            {result.objectiveCount > 0 && ` · ${result.objectiveCount} obj`}
          </span>
          {expanded ? <ChevronDown className="w-5 h-5 shrink-0" /> : <ChevronUp className="w-5 h-5 shrink-0" />}
        </button>
      </div>

      <p className="font-data text-xs text-text/40 mt-12">
        {COWS.source.title}. {COWS.source.citation}. Scale content is in the public clinical domain;
        severity bands per the original publication.
      </p>
    </div>
  );
}
