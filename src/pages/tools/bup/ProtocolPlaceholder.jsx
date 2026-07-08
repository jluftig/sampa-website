import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Temporary stand-in while the interactive protocol screens are built out;
// each page replaces this with its real content module + renderer.
export default function ProtocolPlaceholder({ title }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/tools/bup"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text/60 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to protocol chooser
      </Link>
      <div className="w-fit px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 font-data uppercase tracking-wider">
        Bup Dosing Tool
      </div>
      <h1 className="text-3xl md:text-5xl font-drama font-bold mb-6">{title}</h1>
      <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8">
        <p className="text-text/70">
          The interactive version of this protocol is being built. It will appear here.
        </p>
      </div>
    </div>
  );
}
