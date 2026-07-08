import React, { useEffect, useRef, useState } from 'react';
import { ClipboardCopy, Check } from 'lucide-react';
import { copyText } from '../../lib/share';

// "Copy for EHR" button — getText is a thunk so the summary is generated at
// click time (with the answers as they stand right then).
export default function CopySummaryButton({ getText, label = 'Copy for EHR' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(getText());
        if (ok) {
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        }
      }}
      className="inline-flex items-center gap-2 border-2 border-primary text-primary rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors print:hidden"
    >
      {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
      <span>{copied ? 'Copied ✓' : label}</span>
    </button>
  );
}
