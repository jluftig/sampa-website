import React from 'react';
import { Phone } from 'lucide-react';
import { TOOL } from '../../lib/bup/meta';

// "Call the warmline" card — clinician-to-clinician consultation line that
// appears on the source CA Bridge algorithms.
export default function WarmlineBlock() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
        <Phone className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold mb-1">
          Questions about a specific patient?{' '}
          <a href={`tel:${TOOL.warmline.tel}`} className="text-primary hover:underline whitespace-nowrap">
            {TOOL.warmline.label}
          </a>
        </p>
        <p className="text-sm text-text/70">{TOOL.warmline.blurb}</p>
      </div>
    </div>
  );
}
