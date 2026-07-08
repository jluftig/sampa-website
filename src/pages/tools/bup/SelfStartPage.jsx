import React from 'react';
import { Printer, Stethoscope } from 'lucide-react';
import { SELF_START } from '../../../lib/bup/protocols/selfStart';
import ProtocolShell from '../../../components/bup/ProtocolShell';

// Patient-facing handout — plain patient language by design (the deliberate
// exception to the tool's clinician-language rule), laid out print-first so
// a clinician can hand it to the patient on paper.
export default function SelfStartPage() {
  return (
    <ProtocolShell protocol={SELF_START}>
      <div
        className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 mb-8 flex items-start gap-3 print:hidden"
      >
        <Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-text/80">
          For clinicians: this is patient material, written in plain language. Print it and fill
          in your program’s Substance Use Navigator (or equivalent) contact before handing it to
          the patient.
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="btn-magnetic bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-full text-sm font-semibold shadow-md inline-flex items-center gap-2 mb-8 print:hidden"
      >
        <Printer className="w-4 h-4" />
        <span>Print this handout</span>
      </button>

      <div className="space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
          <ol className="space-y-4">
            {SELF_START.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-base font-medium pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-text/60 mt-5">{SELF_START.stepsFootnote}</p>
        </section>

        {SELF_START.sections.map((section) => (
          <section
            key={section.heading}
            className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7"
          >
            <h2 className="font-bold text-lg mb-3 text-primary">{section.heading}</h2>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base">
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span className={item.startsWith('WARNING:') ? 'font-semibold' : ''}>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="bg-gradient-to-r from-primary to-accent text-white rounded-3xl p-6 md:p-7">
          <p className="font-bold text-lg mb-4">{SELF_START.help.banner}</p>
          <p className="text-sm">
            {SELF_START.help.fillIn}{' '}
            <span
              className="inline-block align-bottom border-b-2 border-white/70 w-56"
              aria-label="write your navigator's phone number here"
            >
              &nbsp;
            </span>
          </p>
        </section>
      </div>
    </ProtocolShell>
  );
}
