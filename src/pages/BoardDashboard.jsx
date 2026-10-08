import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrgDashboard from '../components/OrgDashboard';

export default function BoardDashboard() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <Link to="/board" className="text-primary-text font-data text-sm font-semibold hover:underline">
          ← Board meetings
        </Link>
        <h1 className="text-3xl md:text-4xl font-drama font-bold mt-4 mb-6">Board dashboard</h1>
        <OrgDashboard />
      </main>
      <Footer />
    </div>
  );
}
