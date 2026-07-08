import React from 'react';
import { TOOL } from '../../lib/bup/meta';

// Renders TOOL.attribution verbatim — the final CA Bridge attribution /
// co-branding wording is a data edit in src/lib/bup/meta.js, never a JSX change.
export default function AttributionBlock() {
  return (
    <div className="border-t border-primary/10 pt-6">
      <p className="font-data text-xs uppercase tracking-wider text-text/50 mb-2">
        {TOOL.attribution.heading}
      </p>
      <p className="text-sm text-text/60 max-w-2xl">{TOOL.attribution.body}</p>
    </div>
  );
}
