import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Route } from 'lucide-react';
import { MICRO_MACRO } from '../../../lib/bup/protocols/microMacro';
import ProtocolShell from '../../../components/bup/ProtocolShell';
import ProtocolFlow from '../../../components/bup/ProtocolFlow';

export default function MicroMacroPage() {
  const [params] = useSearchParams();
  const fromLowDose = params.get('from') === 'low-dose';
  const { conversionBanner, avoid, pharmacyNotes } = MICRO_MACRO;

  return (
    <ProtocolShell protocol={MICRO_MACRO} guardrail={MICRO_MACRO.guardrail}>
      {fromLowDose && (
        <div
          className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3"
          role="status"
        >
          <Route className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-950 mb-1">{conversionBanner.title}</p>
            <p className="text-sm text-amber-950/90">{conversionBanner.body}</p>
            <p className="text-sm text-amber-900/80 mt-2">
              In the flow below, choose “Was starting (or on) Low Dose…” so the conversion checklist is recorded
              in the copy-to-EHR summary.
            </p>
          </div>
        </div>
      )}

      <ProtocolFlow flow={MICRO_MACRO.flow} protocol={MICRO_MACRO} />

      <div className="mt-10 space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-3">{avoid.heading}</h2>
          <ul className="space-y-2">
            {avoid.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-text/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
            <Link
              to="/tools/bup/quick-start"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Open Quick Start
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/tools/bup/low-dose"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Open Low Dose (inpatient)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/tools/bup/dti"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Open DTI
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-3">{pharmacyNotes.heading}</h2>
          <ul className="space-y-2">
            {pharmacyNotes.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-text/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ProtocolShell>
  );
}
