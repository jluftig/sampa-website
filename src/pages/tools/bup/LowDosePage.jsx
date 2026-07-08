import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LOW_DOSE } from '../../../lib/bup/protocols/lowDose';
import ProtocolShell from '../../../components/bup/ProtocolShell';
import StepRenderer from '../../../components/bup/StepRenderer';

// Low Dose is a day-by-day ramp + troubleshooting reference, not a Q&A loop —
// the interactivity here is the ramp-schedule picker.
export default function LowDosePage() {
  const [rampKey, setRampKey] = useState(LOW_DOSE.ramps[0].key);
  const ramp = LOW_DOSE.ramps.find((r) => r.key === rampKey);
  const { fullAgonist, troubleshooting, altFormulations } = LOW_DOSE;

  return (
    <ProtocolShell protocol={LOW_DOSE} guardrail={LOW_DOSE.guardrail}>
      <div className="space-y-6">
        {/* Full-agonist principle — the load-bearing idea of this protocol */}
        <section className="bg-white rounded-3xl shadow-sm border-2 border-primary/30 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-2">{fullAgonist.heading}</h2>
          <p className="text-sm text-text/80 mb-4">{fullAgonist.principle}</p>
          <p className="font-data text-xs uppercase tracking-wider text-text/50 mb-2">
            {fullAgonist.exampleHeading}
          </p>
          <ul className="space-y-1.5 mb-4">
            {fullAgonist.example.map((line) => (
              <li key={line} className="text-sm font-medium flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <StepRenderer
            step={{
              kind: 'table',
              bare: true,
              title: 'Alternative full-agonist opioids',
              columns: fullAgonist.alternatives.columns,
              rows: fullAgonist.alternatives.rows,
              footnote: fullAgonist.alternatives.footnote,
            }}
          />
        </section>

        {/* Ramp schedule picker */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-4">Low-dose bup initiation schedule</h2>
          <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Ramp schedule">
            {LOW_DOSE.ramps.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={r.key === rampKey}
                onClick={() => setRampKey(r.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                  r.key === rampKey
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-primary/15 text-text/70 hover:border-primary/40'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-text/60 mb-4">{ramp.description}</p>
          <StepRenderer step={{ kind: 'table', bare: true, columns: ramp.columns, rows: ramp.rows }} />
        </section>

        {/* Troubleshooting */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-4">{troubleshooting.heading}</h2>
          <div className="space-y-4">
            {troubleshooting.items.map((item) => (
              <div key={item.problem} className="border-l-2 border-primary/30 pl-4">
                <h3 className="font-semibold text-sm mb-1">{item.problem}</h3>
                <p className="text-sm text-text/70">{item.action}</p>
                {item.escalateTo && (
                  <Link
                    to={`/tools/bup/${item.escalateTo.protocol}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-1.5"
                  >
                    {item.escalateTo.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Alternative formulations */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-2">{altFormulations.title}</h2>
          <p className="text-sm text-text/60 mb-4">{altFormulations.intro}</p>
          <StepRenderer
            step={{
              kind: 'table',
              bare: true,
              columns: altFormulations.columns,
              rows: altFormulations.rows,
              footnote: altFormulations.footnote,
            }}
          />
        </section>
      </div>
    </ProtocolShell>
  );
}
