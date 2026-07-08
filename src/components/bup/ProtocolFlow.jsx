import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { evaluateSequence, isInteractiveStep } from '../../lib/bup/flow';
import QuestionCard from './QuestionCard';
import StepRenderer from './StepRenderer';

// Stateful runner for a protocol's step graph. Answers live in an ordered
// sequence (protocol flows can loop — the same reassess step may be visited
// several times, each visit its own card). Re-answering an earlier card
// truncates the sequence there, so everything downstream re-derives.
// No timers, no timestamps, no persistence — nothing patient-related is stored.
export default function ProtocolFlow({ flow }) {
  const [answerSeq, setAnswerSeq] = useState([]);
  const result = useMemo(() => evaluateSequence(flow, answerSeq), [flow, answerSeq]);

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
          value={undefined}
          onAnswer={(value) =>
            setAnswerSeq((prev) => [...prev, { stepId: result.currentStepId, value }])
          }
        />
      )}

      {answerSeq.length > 0 && (
        <button
          type="button"
          onClick={() => setAnswerSeq([])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors px-2 py-1"
        >
          <RotateCcw className="w-4 h-4" />
          Start over
        </button>
      )}
    </div>
  );
}
