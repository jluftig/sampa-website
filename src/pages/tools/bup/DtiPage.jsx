import React from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, ArrowRight } from 'lucide-react';
import { DTI } from '../../../lib/bup/protocols/dti';
import ProtocolShell from '../../../components/bup/ProtocolShell';
import ProtocolFlow from '../../../components/bup/ProtocolFlow';
import StepRenderer from '../../../components/bup/StepRenderer';

export default function DtiPage() {
  const { returnPrecautions, monthlyRoutes, formulations, precipitated, outpatientAdjuncts } = DTI;

  return (
    <ProtocolShell protocol={DTI}>
      <ProtocolFlow flow={DTI.flow} />

      <div className="mt-10 space-y-6">
        {/* Return precautions */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-3">{returnPrecautions.heading}</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {returnPrecautions.items.map((item) => (
              <li key={item} className="text-sm text-text/80">
                {item}
              </li>
            ))}
          </ol>
        </section>

        {/* Routes to monthly */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-1">{monthlyRoutes.heading}</h2>
          <p className="text-sm text-text/60 mb-4">{monthlyRoutes.intro}</p>
          <StepRenderer
            step={{ kind: 'table', bare: true, columns: monthlyRoutes.columns, rows: monthlyRoutes.rows }}
          />
        </section>

        {/* Formulations */}
        <StepRenderer
          step={{
            kind: 'table',
            title: formulations.heading,
            columns: formulations.columns,
            rows: formulations.rows,
          }}
        />

        {/* Precipitated withdrawal */}
        <section className="bg-red-50 rounded-3xl border-2 border-red-200 p-6 md:p-7">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
            <h2 className="font-bold text-red-700">{precipitated.title}</h2>
          </div>
          <p className="text-sm text-red-900/80 mb-2">{precipitated.intro}</p>
          <ul className="space-y-1.5 mb-3">
            {precipitated.items.map((item) => (
              <li key={item} className="text-sm font-medium text-red-900 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to={`/tools/bup/${precipitated.linkTo.protocol}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline"
          >
            {precipitated.linkTo.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Outpatient symptom-targeted adjuncts */}
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <h2 className="font-bold text-lg mb-4">{outpatientAdjuncts.heading}</h2>
          <div className="space-y-4">
            {outpatientAdjuncts.groups.map((g) => (
              <div key={g.group}>
                <h3 className="font-data text-xs uppercase tracking-wider text-text/50 mb-1.5">
                  {g.group}
                </h3>
                <ul className="space-y-1.5">
                  {g.items.map((item) => (
                    <li key={item} className="text-sm text-text/80 flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProtocolShell>
  );
}
