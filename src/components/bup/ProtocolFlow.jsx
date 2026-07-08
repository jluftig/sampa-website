import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { evaluateSequence, isInteractiveStep } from '../../lib/bup/flow';
import { protocolSummaryText } from '../../lib/bup/summary';
import QuestionCard from './QuestionCard';
import StepRenderer from './StepRenderer';
import CopySummaryButton from './CopySummaryButton';
import CowsHint from './CowsHint';
import { useCows } from './CowsContext';

// Reassess steps are natural re-scoring moments; data can also opt any step
// in with `cowsHint: true` (e.g., DTI's COWS-band question).
function hintFor(step) {
  return step.kind === 'reassess' || step.cowsHint ? <CowsHint /> : undefined;
}

// Stateful runner for a protocol's step graph. Answers live in an ordered
// sequence (protocol flows can loop — the same reassess step may be visited
// several times, each visit its own card). Re-answering an earlier card
// truncates the sequence there, so everything downstream re-derives.
// No timers, no timestamps, no persistence — nothing patient-related is stored.
export default function ProtocolFlow({ flow, protocol }) {
  const [answerSeq, setAnswerSeq] = useState([]);
  const result = useMemo(() => evaluateSequence(flow, answerSeq), [flow, answerSeq]);
  const { entries: cowsEntries } = useCows();

  const currentStep = result.currentStepId ? flow.steps[result.currentStepId] : null;

  return (
    <div className="space-y-4">
      {result.path.map((entry, i) => {
        const key = `${i}-${entry.stepId}`;
        if (isInteractiveStep(entry.step)) {
          return (
            <QuestionCard
              key={key}
              node={entry.step}
              timing={entry.step.timing}
              hint={hintFor(entry.step)}
              value={entry.answer}
              onAnswer={(value) =>
                setAnswerSeq((prev) => [
                  ...prev.slice(0, entry.answerIndex),
                  { stepId: entry.stepId, value },
                ])
              }
            />
          );
        }
        return <StepRenderer key={key} step={entry.step} />;
      })}

      {currentStep && (
        <QuestionCard
          node={currentStep}
          timing={currentStep.timing}
          hint={hintFor(currentStep)}
          value={undefined}
          onAnswer={(value) =>
            setAnswerSeq((prev) => [...prev, { stepId: result.currentStepId, value }])
          }
        />
      )}

      {answerSeq.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {protocol && (
            <CopySummaryButton getText={() => protocolSummaryText(protocol, result, new Date(), cowsEntries)} />
          )}
          <button
            type="button"
            onClick={() => setAnswerSeq([])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors px-2 py-1"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
