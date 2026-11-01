import React from 'react';
import { Check, CreditCard, HeartHandshake, UserRound } from 'lucide-react';
import { JOIN_STEPS, canOpenStep, stepIndex } from '../../lib/joinFlow';

function IdCardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M14 10h4" />
      <path d="M14 14h4" />
      <path d="M6.2 15.2a2.4 2.4 0 0 1 3.6 0" />
    </svg>
  );
}

const ICONS = {
  profile: UserRound,
  membership: IdCardIcon,
  support: HeartHandshake,
  checkout: CreditCard,
};

export default function JoinStepper({ stepId, onStep }) {
  const current = stepIndex(stepId);
  const fill = JOIN_STEPS.length === 1 ? 0 : (current / (JOIN_STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Join progress" className="sticky top-16 z-40 border-b border-primary/10 bg-background/95 backdrop-blur">
      <ol className="relative mx-auto flex max-w-3xl items-start gap-1 px-3 py-2">
        <span className="pointer-events-none absolute left-8 right-8 top-5 h-0.5 bg-text/10" aria-hidden="true">
          <span className="block h-full bg-accent" style={{ width: `${fill}%` }} />
        </span>
        {JOIN_STEPS.map((step) => {
          const Icon = ICONS[step.id];
          const index = stepIndex(step.id);
          const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
          const labelClass = state === 'current'
            ? 'mt-1 block text-[11px] font-bold text-text'
            : 'mt-1 hidden text-[11px] font-semibold text-text/50 min-[375px]:block';
          const circle = state === 'upcoming'
            ? 'border-text/25 bg-background text-text/40'
            : 'border-accent bg-accent text-white';
          const body = (
            <>
              <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${circle}`}>
                {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={labelClass}>{step.label}</span>
            </>
          );
          return (
            <li key={step.id} className="flex min-w-0 flex-1 justify-center">
              {state === 'upcoming' || !canOpenStep(step.id, stepId) ? (
                <span className="flex min-h-12 flex-col items-center" aria-disabled="true">
                  {body}
                </span>
              ) : (
                <button
                  type="button"
                  className="flex min-h-12 flex-col items-center"
                  aria-current={state === 'current' ? 'step' : undefined}
                  aria-label={step.label}
                  onClick={() => onStep(step.id)}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
