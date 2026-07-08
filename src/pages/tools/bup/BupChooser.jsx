import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Placeholder protocol list — replaced by the interactive chooser
// (QuestionCard flow + ResultPanel) in the next phase.
const PROTOCOL_LINKS = [
  { to: '/tools/bup/quick-start', label: 'Buprenorphine (Bup) Quick Start' },
  { to: '/tools/bup/low-dose', label: 'Bup Low Dose with Opioid Continuation (Inpatient)' },
  { to: '/tools/bup/dti', label: 'Direct-to-Inject (DTI) Buprenorphine' },
  { to: '/tools/bup/od-reversal', label: 'Starting Bup After Opioid Overdose Reversal' },
  { to: '/tools/bup/self-start', label: 'Buprenorphine Self-Start (Patient Handout)' },
];

export default function BupChooser() {
  return (
    <div>
      <header className="text-center mb-12 max-w-3xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          Clinical decision support
        </div>
        <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
          Choosing a buprenorphine start strategy
        </h1>
        <p className="text-lg text-text/70">
          For ED and inpatient clinicians: answer a few questions to find the right
          buprenorphine start protocol, then dose it step by step.
        </p>
      </header>

      <div className="max-w-3xl mx-auto grid gap-4">
        {PROTOCOL_LINKS.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="bg-white rounded-2xl shadow-sm border border-primary/10 p-6 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
          >
            <span className="font-semibold">{p.label}</span>
            <ArrowRight className="w-5 h-5 text-primary shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
