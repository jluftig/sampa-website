import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { CHOOSER, evaluateChooser } from '../../../lib/bup/chooser';
import { PROTOCOLS } from '../../../lib/bup/protocols';
import QuestionCard from '../../../components/bup/QuestionCard';
import ResultPanel from '../../../components/bup/ResultPanel';
import PrintSummary from '../../../components/bup/PrintSummary';
import CowsHint from '../../../components/bup/CowsHint';
import { logToolEvent } from '../../../lib/toolAnalytics';
import {
  readChooserAnswers,
  writeChooserAnswers,
  clearChooserAnswers,
} from '../../../lib/bup/chooserSession';

export default function BupChooser() {
  // Answers persist per tab so leaving (e.g., to score COWS) and returning
  // restores progress; "Start over" clears the store.
  const [answers, setAnswers] = useState(readChooserAnswers);
  const result = useMemo(() => evaluateChooser(answers), [answers]);

  useEffect(() => {
    writeChooserAnswers(answers);
  }, [answers]);

  // Which pathways clinicians actually reach — logged once per outcome per
  // visit (rewind + re-answer to a different outcome logs the new one too).
  useEffect(() => {
    if (!result.outcome) return;
    logToolEvent({
      event: 'outcome_reached',
      outcomeKey: result.outcome.outcomeKey,
      answers: result.path.map(({ nodeId, value }) => ({ nodeId, value })),
      oncePerSession: true,
    });
  }, [result]);

  // Cards shown = every answered node on the active path + the next
  // unanswered one. Changing an earlier answer rewinds automatically: the
  // evaluator re-walks from the start, so off-path answers just stop showing.
  const visibleNodeIds = [
    ...result.path.map((entry) => entry.nodeId),
    ...(result.currentNodeId ? [result.currentNodeId] : []),
  ];

  return (
    <div>
      {/* What actually prints: an order-set-style summary of this session */}
      <PrintSummary result={result} />

      <header className="text-center mb-12 max-w-3xl mx-auto print:hidden">
        <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          Clinical decision support
        </div>
        <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
          Choosing a buprenorphine start strategy
        </h1>
        <p className="text-lg text-text/70">{CHOOSER.entry}</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-8 items-start print:hidden">
        <div className="lg:col-span-3 space-y-4 pb-24 lg:pb-0">
          {visibleNodeIds.map((nodeId, i) => (
            <QuestionCard
              key={nodeId}
              step={`Q${i + 1}`}
              node={CHOOSER.nodes[nodeId]}
              hint={CHOOSER.nodes[nodeId].cowsHint ? <CowsHint /> : undefined}
              value={answers[nodeId]}
              onAnswer={(value) => setAnswers((prev) => ({ ...prev, [nodeId]: value }))}
            />
          ))}

          {Object.keys(answers).length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearChooserAnswers();
                setAnswers({});
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors px-2 py-1"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          )}
        </div>

        {/* self-stretch lets the sticky result panel travel the full height of
            the questions column instead of collapsing under `items-start`. */}
        <div className="lg:col-span-2 lg:self-stretch">
          <ResultPanel result={result} />
        </div>
      </div>

      <section className="mt-20 max-w-3xl mx-auto print:hidden">
        <h2 className="text-2xl font-drama font-bold mb-6 text-center">
          Know which protocol you need?
        </h2>
        <div className="grid gap-4">
          {PROTOCOLS.map((p) => (
            <Link
              key={p.slug}
              to={`/tools/bup/${p.slug}`}
              className="bg-white rounded-2xl shadow-sm border border-primary/10 p-5 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
            >
              <span>
                <span className="font-semibold text-sm md:text-base block">
                  {p.title}
                  {p.patientFacing && <span className="text-text/50 font-normal"> (patient handout)</span>}
                </span>
                <span className="text-sm text-text/60">{p.blurb}</span>
              </span>
              <ArrowRight className="w-5 h-5 text-primary shrink-0" />
            </Link>
          ))}
          <Link
            to="/tools/bup/cows"
            className="bg-white rounded-2xl shadow-sm border border-accent/20 p-5 flex items-center justify-between gap-4 hover:border-accent/50 transition-colors"
          >
            <span>
              <span className="font-semibold text-sm md:text-base block">
                COWS calculator <span className="text-text/50 font-normal">(optional)</span>
              </span>
              <span className="text-sm text-text/60">
                Score withdrawal severity — result stays visible as you work through the tool.
              </span>
            </span>
            <ArrowRight className="w-5 h-5 text-accent shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
