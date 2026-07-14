import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, ExternalLink } from 'lucide-react';
import { TOOL } from '../../lib/bup/meta';
import { logToolEvent } from '../../lib/toolAnalytics';
import PrintButton from './PrintButton';
import HoldPeekChip from './HoldPeekChip';

// Shared frame for the five protocol pages: back link, header, optional
// guardrail banner, eligibility card (with hold-to-peek support chips for
// adjuncts / dosing tips), the page's own content (flow + protocol-specific
// extras), remaining info sections, methadone note, and the version/source
// footer. Pages stay thin; content lives in the protocol data modules.

function EligibilityCard({ eligibility, adjuncts, supportSections = [] }) {
  const hasSupport = Boolean(adjuncts) || supportSections.length > 0;

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

      {hasSupport && (
        <div className="mt-5 pt-4 border-t border-primary/10">
          <p className="font-data text-[11px] uppercase tracking-wider text-text/45 mb-2.5">
            Optional support — press and hold to peek
          </p>
          <div className="flex flex-wrap gap-2">
            {adjuncts && (
              <HoldPeekChip label={adjuncts.heading} title={adjuncts.heading}>
                {adjuncts.caveat && (
                  <p className="text-sm font-semibold text-accent mb-2">{adjuncts.caveat}</p>
                )}
                <dl className="grid gap-2.5">
                  {adjuncts.items.map((item) => (
                    <div key={item.drug}>
                      <dt className="font-data text-[10px] uppercase tracking-wider text-text/50">
                        {item.group}
                      </dt>
                      <dd className="text-sm font-medium text-text">{item.drug}</dd>
                    </div>
                  ))}
                </dl>
              </HoldPeekChip>
            )}
            {supportSections.map((section) => (
              <HoldPeekChip key={section.heading} label={section.heading} title={section.heading}>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text/80">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </HoldPeekChip>
            ))}
          </div>
        </div>
      )}
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
  const location = useLocation();

  // Which protocols get opened, and whether via the chooser or directly
  // (bookmark / grid). outcome_key holds the protocol slug for easy grouping.
  useEffect(() => {
    logToolEvent({
      event: 'protocol_viewed',
      outcomeKey: protocol.slug,
      answers: { referrer: location.state?.from === 'chooser' ? 'chooser' : 'direct' },
    });
  }, [protocol.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Support content lives as hold-to-peek chips on the eligibility card when
  // that card exists (Quick Start path). Remaining info sections stay below.
  const supportSections =
    protocol.infoSections?.filter((s) => s.supportChip) ?? [];
  const footerSections =
    protocol.infoSections?.filter((s) => !s.supportChip) ?? [];
  const adjunctsInEligibility = Boolean(protocol.eligibility && protocol.adjuncts);

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
        {!protocol.patientFacing && (
          <div className="mt-5">
            <PrintButton label="Print this page" />
          </div>
        )}
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

      {protocol.eligibility && (
        <EligibilityCard
          eligibility={protocol.eligibility}
          adjuncts={adjunctsInEligibility ? protocol.adjuncts : null}
          supportSections={supportSections}
        />
      )}

      {children}

      {footerSections.length > 0 && (
        <div className="mt-10 space-y-6">
          {footerSections.map((section) => (
            <InfoSection key={section.heading} section={section} />
          ))}
        </div>
      )}

      {/* Print still needs adjuncts/tips visible even when on-screen they're peek chips */}
      {adjunctsInEligibility && protocol.adjuncts && (
        <div className="hidden print:block mt-10">
          <section className="border border-black/20 rounded-lg p-4">
            <h2 className="font-bold text-base mb-1">{protocol.adjuncts.heading}</h2>
            {protocol.adjuncts.caveat && (
              <p className="text-sm font-semibold mb-3">{protocol.adjuncts.caveat}</p>
            )}
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {protocol.adjuncts.items.map((item) => (
                <div key={item.drug}>
                  <dt className="text-xs uppercase tracking-wider text-black/50">{item.group}</dt>
                  <dd className="font-medium">{item.drug}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
      {supportSections.length > 0 && (
        <div className="hidden print:block mt-6 space-y-4">
          {supportSections.map((section) => (
            <section key={section.heading} className="border border-black/20 rounded-lg p-4">
              <h2 className="font-bold text-base mb-2">{section.heading}</h2>
              <ul className="space-y-1.5 text-sm">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Protocols without eligibility still show full adjuncts card on screen */}
      {!adjunctsInEligibility && protocol.adjuncts && (
        <div className="mt-10">
          <section className="bg-white rounded-3xl shadow-sm border border-primary/10 p-6 md:p-7">
            <h2 className="font-bold text-lg mb-1">{protocol.adjuncts.heading}</h2>
            {protocol.adjuncts.caveat && (
              <p className="text-sm font-semibold text-accent mb-4">{protocol.adjuncts.caveat}</p>
            )}
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {protocol.adjuncts.items.map((item) => (
                <div key={item.drug} className="flex flex-col">
                  <dt className="font-data text-xs uppercase tracking-wider text-text/50">{item.group}</dt>
                  <dd className="text-sm font-medium">{item.drug}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

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
