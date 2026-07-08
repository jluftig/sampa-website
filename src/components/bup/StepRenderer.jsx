import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, TriangleAlert, ListChecks, Info, ArrowRight } from 'lucide-react';

// Renderers for the non-interactive protocol step kinds (dose / alert / note /
// checklist / table). Interactive kinds (question / reassess / multiselect)
// are rendered by ProtocolFlow via QuestionCard. New step kinds added to the
// data layer get a renderer here — nothing else changes.

function DoseStep({ step }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border-2 border-primary/30 p-6 md:p-7">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
          <Pill className="w-4 h-4" />
        </span>
        <span className="font-data text-xs uppercase tracking-wider text-primary font-semibold">
          {step.label}
        </span>
      </div>
      <p className="text-xl md:text-2xl font-bold">
        {step.dose}
        {step.range && <span className="text-base font-semibold text-text/60"> ({step.range})</span>}
      </p>
      {step.detail && <p className="text-sm text-text/70 mt-2">{step.detail}</p>}
    </section>
  );
}

// The palette has no danger color — stock Tailwind red is deliberate here.
function AlertBlock({ step }) {
  return (
    <section className="bg-red-50 rounded-3xl border-2 border-red-200 p-6 md:p-7" role="alert">
      <div className="flex items-center gap-2 mb-2">
        <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
        <h3 className="font-bold text-red-700">{step.title}</h3>
      </div>
      {step.intro && <p className="text-sm text-red-900/80 mb-2">{step.intro}</p>}
      <ul className="space-y-1.5">
        {step.items.map((item) => (
          <li key={item} className="text-sm font-medium text-red-900 flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoteBlock({ step }) {
  return (
    <section className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 flex items-start gap-3">
      <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-text/80">{step.text}</p>
    </section>
  );
}

function ChecklistBlock({ step }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-5 h-5 text-primary shrink-0" />
        <h3 className="font-bold text-lg">{step.title}</h3>
      </div>
      <ul className="space-y-2.5">
        {step.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-text/80">
            <span
              className="mt-0.5 inline-block w-4 h-4 rounded border-2 border-primary/40 shrink-0"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
      {step.linkTo && (
        <Link
          to={`/tools/bup/${step.linkTo.protocol}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-4"
        >
          {step.linkTo.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </section>
  );
}

function TableBlock({ step }) {
  // `bare` renders without the card wrapper — for tables nested inside
  // another card (ramp picker, full-agonist alternatives).
  const Wrapper = step.bare ? 'div' : 'section';
  return (
    <Wrapper className={step.bare ? '' : 'bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7'}>
      {step.title && <h3 className="font-bold text-lg mb-3">{step.title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-primary/15">
              {step.columns.map((col) => (
                <th key={col} className="py-2 pr-4 font-data text-xs uppercase tracking-wider text-text/50">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.rows.map((row, i) => (
              <tr key={i} className="border-b border-primary/5 last:border-0 align-top">
                {row.map((cell, j) => (
                  <td key={j} className={`py-2.5 pr-4 ${j === 0 ? 'font-semibold' : 'text-text/80'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {step.footnote && <p className="text-xs text-text/50 mt-3">{step.footnote}</p>}
    </Wrapper>
  );
}

export default function StepRenderer({ step }) {
  switch (step.kind) {
    case 'dose':
      return <DoseStep step={step} />;
    case 'alert':
      return <AlertBlock step={step} />;
    case 'note':
      return <NoteBlock step={step} />;
    case 'checklist':
      return <ChecklistBlock step={step} />;
    case 'table':
      return <TableBlock step={step} />;
    default:
      return null;
  }
}
