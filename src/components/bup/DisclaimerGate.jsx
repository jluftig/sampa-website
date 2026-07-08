import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { TOOL } from '../../lib/bup/meta';
import { hasAcceptedBupTerms, acceptBupTerms } from '../../lib/bup/consent';

// One-time (per device) clinician disclaimer gate. Every /tools/bup* route
// renders through this, so deep links are gated too; acceptance is a state
// flip — no redirect — so a bookmarked protocol page opens exactly where the
// clinician was headed. Tool content is not rendered (not just hidden)
// until accepted.
export default function DisclaimerGate({ children }) {
  const [accepted, setAccepted] = useState(hasAcceptedBupTerms);

  if (accepted) return children;

  const d = TOOL.disclaimer;
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          <Stethoscope className="w-3.5 h-3.5" />
          {d.badge}
        </div>
        <h2 className="text-2xl md:text-3xl font-drama font-bold mb-4">{d.heading}</h2>
        {d.paragraphs.map((p) => (
          <p key={p} className="text-sm text-text/70 mb-3">
            {p}
          </p>
        ))}
        <p className="text-sm text-text/70 mb-8">
          {d.agreePrefix}{' '}
          <Link to="/terms" className="text-primary font-semibold hover:underline">
            {d.agreeLinkLabel}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            acceptBupTerms();
            setAccepted(true);
          }}
          className="btn-magnetic bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-full font-semibold shadow-md w-full"
        >
          <span>{d.acceptLabel}</span>
        </button>
      </div>
    </div>
  );
}
