import React from 'react';
import { useAuth } from '../lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Placeholder editor dashboard. The post list + editor UI arrive in Phase 5;
// for now this confirms login and role are working end to end.
export default function Editor() {
  const { profile, signOut } = useAuth();

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24">
        <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10">
          <div className="text-primary font-bold font-data tracking-widest text-xs mb-3 uppercase">
            Editor Dashboard
          </div>
          <h1 className="text-3xl font-drama font-bold mb-4">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-text/60 mb-2">
            Signed in as <span className="font-semibold">{profile?.email}</span>
          </p>
          <p className="text-text/60 mb-8">
            Your role: <span className="font-data font-semibold text-primary">{profile?.role}</span>
          </p>

          <p className="text-text/50 mb-8">
            Post creation and publishing tools are coming in the next phase.
          </p>

          <button
            onClick={signOut}
            className="px-5 py-2.5 rounded-full border border-primary/20 font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
