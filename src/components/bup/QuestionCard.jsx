import React from 'react';
import { Check } from 'lucide-react';

// One decision node rendered as a card with stacked full-width answer buttons
// (clinical labels are long — segmented pills don't fit them). Answered cards
// stay on screen; tapping a different option rewinds the flow from that node
// (the walker in lib/bup/flow.js re-derives everything downstream).
//
// `multiselect` nodes render checkbox-style rows plus an explicit
// "None of these apply" action: [] (explicit none) and undefined (unanswered)
// route differently, so none must be a deliberate tap, not a default.
export default function QuestionCard({ node, value, onAnswer, step }) {
  const isMulti = node.kind === 'multiselect';
  const selected = isMulti ? (Array.isArray(value) ? value : null) : value;

  const toggleMulti = (optValue) => {
    const current = selected ?? [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];
    onAnswer(next);
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-data text-xs text-primary font-semibold shrink-0">{step}</span>
        <div>
          <h3 className="font-semibold text-lg leading-snug">{node.prompt}</h3>
          {node.help && <p className="text-sm text-text/60 mt-1">{node.help}</p>}
        </div>
      </div>

      <div className="grid gap-2.5" role={isMulti ? 'group' : 'radiogroup'} aria-label={node.prompt}>
        {node.options.map((opt) => {
          const isSelected = isMulti ? (selected ?? []).includes(opt.value) : selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role={isMulti ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              onClick={() => (isMulti ? toggleMulti(opt.value) : onAnswer(opt.value))}
              className={`w-full text-left border-2 rounded-2xl px-4 py-3 transition-colors flex items-start gap-3 ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/10 bg-white hover:border-primary/40'
              }`}
            >
              <span
                className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 shrink-0 border-2 ${
                  isMulti ? 'rounded-md' : 'rounded-full'
                } ${isSelected ? 'border-primary bg-primary text-white' : 'border-primary/30'}`}
                aria-hidden="true"
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </span>
              <span className="text-sm md:text-base font-medium">{opt.label}</span>
            </button>
          );
        })}

        {isMulti && (
          <button
            type="button"
            onClick={() => onAnswer([])}
            className={`w-full text-left border-2 rounded-2xl px-4 py-3 transition-colors font-medium text-sm md:text-base ${
              selected !== null && selected.length === 0
                ? 'border-primary bg-primary/10'
                : 'border-dashed border-primary/30 bg-white hover:border-primary/60'
            }`}
          >
            {node.noneLabel}
          </button>
        )}
      </div>
    </section>
  );
}
