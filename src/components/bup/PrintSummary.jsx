import React from 'react';
import { TOOL } from '../../lib/bup/meta';
import { protocolBySlug } from '../../lib/bup/protocols';

// Order-set-style summary of the chooser session, rendered ONLY when printing
// (the interactive grid is print:hidden; this is what comes out of the
// printer). Same data the copy-for-EHR text is built from.
export default function PrintSummary({ result }) {
  const { path, outcome } = result;
  const protocol = outcome?.protocol ? protocolBySlug(outcome.protocol) : null;

  return (
    <div className="hidden print:block text-text">
      <h1 className="text-2xl font-bold mb-1">Buprenorphine start — decision support summary</h1>
      <p className="text-sm mb-6">
        {TOOL.name} v{TOOL.version} · Printed {new Date().toLocaleString()}
      </p>

      <h2 className="text-lg font-bold border-b border-text/30 pb-1 mb-3">Inputs</h2>
      <table className="w-full text-sm mb-6">
        <tbody>
          {path.map((entry) => (
            <tr key={entry.nodeId}>
              <td className="py-1 pr-6 align-top">{entry.prompt}</td>
              <td className="py-1 font-semibold align-top">{entry.label}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-bold border-b border-text/30 pb-1 mb-3">
        {outcome?.variant === 'dual' ? 'Two appropriate options (decide with the patient)' : 'Recommendation'}
      </h2>
      {!outcome ? (
        <p className="text-sm mb-6">Incomplete — not all questions answered.</p>
      ) : outcome.variant === 'dual' ? (
        <ol className="text-sm mb-6 space-y-2 list-decimal list-inside">
          {outcome.dualOptions.map((opt) => (
            <li key={opt.protocol}>
              <span className="font-semibold">{opt.title}.</span> {opt.summary}
            </li>
          ))}
        </ol>
      ) : (
        <div className="text-sm mb-6">
          <p className="font-bold text-base mb-1">{outcome.title}</p>
          {outcome.headline && <p className="font-semibold mb-1">{outcome.headline}</p>}
          {outcome.notes?.map((note) => (
            <p key={note} className="mb-1">
              {note}
            </p>
          ))}
          {outcome.checklist && (
            <ul className="mt-2 space-y-1">
              {outcome.checklist.map((item) => (
                <li key={item}>☐ {item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs mb-1">{TOOL.methadoneNote}</p>
      <p className="text-xs mb-1">
        Decision support only — does not replace clinical judgment.
        {protocol && ` Source: ${protocol.source.title} (rev. ${protocol.source.revised}).`}
      </p>
      <p className="text-xs">{TOOL.attribution.body}</p>
    </div>
  );
}
