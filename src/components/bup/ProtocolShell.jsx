import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, ExternalLink } from 'lucide-react';
import { TOOL } from '../../lib/bup/meta';

// Shared frame for the five protocol pages: back link, header, optional
// guardrail banner, eligibility card, the page's own content (flow +
// protocol-specific extras), generic info sections + adjuncts, methadone
// note, and the version/source footer. Pages stay thin; content lives in
// the protocol data modules.

function EligibilityCard({ eligibility }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7 mb-8">
      <h2 className="font-bold text-lg mb-3">{eligibility.heading}</h2>
      <ul className="space-y-2">
        {eligibility.criteria.map((c) => (
          <li key={c} className="flex items-start gap-2.5 text-sm text-text/80">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdjunctsCard({ adjuncts }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <h2 className="font-bold text-lg mb-1">{adjuncts.heading}</h2>
      {adjuncts.caveat && <p className="text-sm font-semibold text-accent mb-4">{adjuncts.caveat}</p>}
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
        {adjuncts.items.map((item) => (
          <div key={item.drug} className="flex flex-col">
            <dt className="font-data text-xs uppercase tracking-wider text-text/50">{item.group}</dt>
            <dd className="text-sm font-medium">{item.drug}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function InfoSection({ section }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
      <h2 className="font-bold text-lg mb-3">{section.heading}</h2>
      <ul className="space-y-2">
        {section.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-text/80">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProtocolShell({ protocol, guardrail, children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/tools/bup"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors mb-8 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to protocol chooser
      </Link>

      <header className="mb-8">
        <div className="w-fit px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-5 font-data uppercase tracking-wider">
          {protocol.audience}
        </div>
        <h1 className="text-3xl md:text-5xl font-drama font-bold mb-4 leading-tight">
          {protocol.title}
        </h1>
        {protocol.intro && <p className="text-text/70">{protocol.intro}</p>}
      </header>

      {guardrail && (
        <div
          className="bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 mb-8 flex items-start gap-3"
          role="alert"
        >
          <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-red-900">{guardrail}</p>
        </div>
      )}

      {protocol.eligibility && <EligibilityCard eligibility={protocol.eligibility} />}

      {children}

      <div className="mt-10 space-y-6">
        {protocol.adjuncts && <AdjunctsCard adjuncts={protocol.adjuncts} />}
        {protocol.infoSections?.map((section) => (
          <InfoSection key={section.heading} section={section} />
        ))}
      </div>

      <p className="text-xs text-text/50 border-t border-primary/10 mt-10 pt-5">{TOOL.methadoneNote}</p>

      <p className="font-data text-xs text-text/40 mt-4">
        {TOOL.shortName} v{TOOL.version} · Protocol content v{protocol.version} · Adapted from{' '}
        {protocol.source.title}, revised {protocol.source.revised}
        {protocol.source.url && (
          <>
            {' · '}
            <a
              href={protocol.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View source PDF
              <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </p>
    </div>
  );
}
