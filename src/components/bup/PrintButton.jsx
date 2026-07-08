import React from 'react';
import { Printer } from 'lucide-react';
import { logToolEvent } from '../../lib/toolAnalytics';

export default function PrintButton({ label = 'Print' }) {
  return (
    <button
      type="button"
      onClick={() => {
        logToolEvent({ event: 'summary_printed' });
        window.print();
      }}
      className="inline-flex items-center gap-2 border-2 border-primary/30 text-text/70 rounded-full px-5 py-2.5 text-sm font-semibold hover:border-primary/60 hover:text-primary transition-colors print:hidden"
    >
      <Printer className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
