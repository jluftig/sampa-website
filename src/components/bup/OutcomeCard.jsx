import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import { TOOL } from '../../lib/bup/meta';

function ProtocolCta({ protocol, children }) {
  return (
    <Link
      to={`/tools/bup/${protocol}`}
      state={{ from: 'chooser' }}
      className="btn-magnetic bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md inline-flex items-center gap-2"
    >
      <span>{children}</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

// A chooser recommendation. `variant: 'dual'` (the ED COWS 4–7,
// declines-injectable fork) renders BOTH valid options side by side —
// the algorithm genuinely leaves that call to shared decision-making.
export default function OutcomeCard({ outcome }) {
  return (
    <div className="bg-white rounded-3xl shadow-md border-2 border-primary/30 p-6 md:p-7">
      <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-data font-semibold uppercase tracking-wider mb-3">
        {outcome.badge}
      </div>
      <h3 className="text-xl md:text-2xl font-drama font-bold leading-snug mb-2">{outcome.title}</h3>

      {outcome.headline && (
        <p className="text-lg font-semibold text-primary mb-3">{outcome.headline}</p>
      )}

      {outcome.notes?.map((note) => (
        <p key={note} className="text-sm text-text/70 mb-2">
          {note}
        </p>
      ))}

      {outcome.checklist && (
        <ul className="mt-3 mb-2 space-y-1.5">
          {outcome.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text/80">
              <ListChecks className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {outcome.variant === 'dual' ? (
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          {outcome.dualOptions.map((opt) => (
            <div key={opt.protocol} className="border border-primary/15 bg-primary/5 rounded-2xl p-5 flex flex-col">
              <h4 className="font-semibold mb-2 leading-snug">{opt.title}</h4>
              <p className="text-sm text-text/70 mb-4 flex-1">{opt.summary}</p>
              <ProtocolCta protocol={opt.protocol}>Open dosing</ProtocolCta>
            </div>
          ))}
        </div>
      ) : (
        outcome.protocol && (
          <div className="mt-4">
            <ProtocolCta protocol={outcome.protocol}>Open dosing</ProtocolCta>
          </div>
        )
      )}

      <p className="text-xs text-text/50 border-t border-primary/10 mt-5 pt-4">{TOOL.methadoneNote}</p>
    </div>
  );
}
