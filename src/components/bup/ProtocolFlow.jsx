import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { evaluateSequence, isInteractiveStep } from '../../lib/bup/flow';
import { protocolSummaryText } from '../../lib/bup/summary';
import {
  readProtocolAnswers,
  writeProtocolAnswers,
  clearProtocolAnswers,
  readProtocolChecks,
  writeProtocolChecks,
} from '../../lib/bup/protocolSession';
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

function toggleIndex(list = [], index) {
  const set = new Set(list);
  if (set.has(index)) set.delete(index);
  else set.add(index);
  return [...set].sort((a, b) => a - b);
}

// Stateful runner for a protocol's step graph. Answers live in an ordered
// sequence (protocol flows can loop — the same reassess step may be visited
// several times, each visit its own card). Re-answering an earlier card
// truncates the sequence there, so everything downstream re-derives.
// Progress persists per tab (keyed by protocol slug) so leaving — e.g. to
// score COWS — and coming back restores it; "Start over" clears it. Checklist
// ticks (discharge bundle, etc.) are stored separately and feed Copy for EHR.
// No timers, timestamps, or patient identifiers are stored.
export default function ProtocolFlow({ flow, protocol }) {
  const slug = protocol?.slug;
  const [answerSeq, setAnswerSeq] = useState(() => readProtocolAnswers(slug));
  const [checklistChecks, setChecklistChecks] = useState(() => readProtocolChecks(slug));
  const result = useMemo(() => evaluateSequence(flow, answerSeq), [flow, answerSeq]);
  const { entries: cowsEntries } = useCows();

  useEffect(() => {
    writeProtocolAnswers(slug, answerSeq);
  }, [slug, answerSeq]);

  useEffect(() => {
    writeProtocolChecks(slug, checklistChecks);
  }, [slug, checklistChecks]);

  const currentStep = result.currentStepId ? flow.steps[result.currentStepId] : null;

  const toggleCheck = (stepId, itemIndex) => {
    setChecklistChecks((prev) => ({
      ...prev,
      [stepId]: toggleIndex(prev[stepId], itemIndex),
    }));
  };

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
        return (
          <StepRenderer
            key={key}
            step={entry.step}
            stepId={entry.stepId}
            checkedIndices={checklistChecks[entry.stepId] || []}
            onToggleCheck={
              entry.step.kind === 'checklist'
                ? (itemIndex) => toggleCheck(entry.stepId, itemIndex)
                : undefined
            }
          />
        );
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
            <CopySummaryButton
              getText={() =>
                protocolSummaryText(protocol, result, new Date(), cowsEntries, checklistChecks)
              }
            />
          )}
          <button
            type="button"
            onClick={() => {
              clearProtocolAnswers(slug);
              setAnswerSeq([]);
              setChecklistChecks({});
            }}
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
