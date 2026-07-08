import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DisclaimerGate from '../../components/bup/DisclaimerGate';
import WarmlineBlock from '../../components/bup/WarmlineBlock';
import AttributionBlock from '../../components/bup/AttributionBlock';
import BupChooser from './bup/BupChooser';
import QuickStartPage from './bup/QuickStartPage';
import LowDosePage from './bup/LowDosePage';
import DtiPage from './bup/DtiPage';
import OdReversalPage from './bup/OdReversalPage';
import SelfStartPage from './bup/SelfStartPage';

// Single lazy entry for the whole bup tool: App.jsx code-splits at
// /tools/bup/*, and everything below here (pages + clinical data modules)
// ships as one chunk so chooser → protocol taps never wait on a second fetch.
// The shared layout puts every route — including deep links — behind the
// one-time clinician DisclaimerGate.
export default function BupTool() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-16">
        <DisclaimerGate>
          <Routes>
            <Route index element={<BupChooser />} />
            <Route path="quick-start" element={<QuickStartPage />} />
            <Route path="low-dose" element={<LowDosePage />} />
            <Route path="dti" element={<DtiPage />} />
            <Route path="od-reversal" element={<OdReversalPage />} />
            <Route path="self-start" element={<SelfStartPage />} />
            <Route path="*" element={<Navigate to="/tools/bup" replace />} />
          </Routes>
        </DisclaimerGate>

        <div className="mt-16 space-y-8 print:hidden">
          <WarmlineBlock />
          <AttributionBlock />
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
