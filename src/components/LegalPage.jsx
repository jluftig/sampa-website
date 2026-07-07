import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

// Shared shell for legal pages (/privacy, /terms): consistent typography and
// an "effective date" line, with the content passed as children.
export default function LegalPage({ label, title, effectiveDate, children }) {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-12">
          <div className="text-primary font-bold font-data tracking-widest text-xs mb-4 uppercase">
            {label}
          </div>
          <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-4">
            {title}
          </h1>
          <p className="text-text/50 text-sm font-data">Effective {effectiveDate}</p>
        </header>

        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-p:text-text/80 prose-li:text-text/80">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
