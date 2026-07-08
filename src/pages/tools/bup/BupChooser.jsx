import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { CHOOSER, evaluateChooser } from '../../../lib/bup/chooser';
import QuestionCard from '../../../components/bup/QuestionCard';
import ResultPanel from '../../../components/bup/ResultPanel';

// Direct access for clinicians who already know their protocol — the chooser
// is never a required detour. (Slugs are permanent identifiers.)
const PROTOCOL_LINKS = [
  { to: '/tools/bup/quick-start', label: 'Buprenorphine (Bup) Quick Start' },
  { to: '/tools/bup/low-dose', label: 'Bup Low Dose with Opioid Continuation (Inpatient)' },
  { to: '/tools/bup/dti', label: 'Direct-to-Inject (DTI) Buprenorphine' },
  { to: '/tools/bup/od-reversal', label: 'Starting Bup After Opioid Overdose Reversal' },
  { to: '/tools/bup/self-start', label: 'Buprenorphine Self-Start (Patient Handout)' },
];

export default function BupChooser() {
  const [answers, setAnswers] = useState({});
  const result = useMemo(() => evaluateChooser(answers), [answers]);

  // Cards shown = every answered node on the active path + the next
  // unanswered one. Changing an earlier answer rewinds automatically: the
  // evaluator re-walks from the start, so off-path answers just stop showing.
  const visibleNodeIds = [
    ...result.path.map((entry) => entry.nodeId),
    ...(result.currentNodeId ? [result.currentNodeId] : []),
  ];

  return (
    <div>
      <header className="text-center mb-12 max-w-3xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          Clinical decision support
        </div>
        <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
          Choosing a buprenorphine start strategy
        </h1>
        <p className="text-lg text-text/70">{CHOOSER.entry}</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-4 pb-24 lg:pb-0">
          {visibleNodeIds.map((nodeId, i) => (
            <QuestionCard
              key={nodeId}
              step={`Q${i + 1}`}
              node={CHOOSER.nodes[nodeId]}
              value={answers[nodeId]}
              onAnswer={(value) => setAnswers((prev) => ({ ...prev, [nodeId]: value }))}
            />
          ))}

          {Object.keys(answers).length > 0 && (
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors px-2 py-1"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
          <ResultPanel result={result} />
        </div>
      </div>

      <section className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-drama font-bold mb-6 text-center">
          Know which protocol you need?
        </h2>
        <div className="grid gap-4">
          {PROTOCOL_LINKS.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="bg-white rounded-2xl shadow-sm border border-primary/10 p-5 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
            >
              <span className="font-semibold text-sm md:text-base">{p.label}</span>
              <ArrowRight className="w-5 h-5 text-primary shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
