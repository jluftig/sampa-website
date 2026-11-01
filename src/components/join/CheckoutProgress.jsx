import React from 'react';
import { CHECKOUT_PHASES } from '../../lib/joinFlow';

export default function CheckoutProgress({ phase }) {
  const current = phase === 'confirmation' ? 'confirmation' : phase === 'payment' ? 'payment' : 'review';
  const index = CHECKOUT_PHASES.findIndex((item) => item.id === current);
  return (
    <ol aria-label="Checkout progress" className="mb-6 flex gap-2">
      {CHECKOUT_PHASES.map((item, i) => {
        const state = i < index ? 'done' : i === index ? 'current' : 'upcoming';
        return (
          <li
            key={item.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`min-h-12 flex-1 rounded-full border px-2 py-2 text-center text-xs font-semibold ${
              state === 'current'
                ? 'border-accent bg-accent text-white'
                : state === 'done'
                  ? 'border-accent/40 bg-accent/10 text-primary-text'
                  : 'border-text/15 text-text/40'
            }`}
          >
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}
