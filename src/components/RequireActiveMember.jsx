import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useAuthGate } from './useAuthGate';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for member-benefit routes (networking directory, Board meetings, future
// CME): signed-in active members and staff (editors/admins). Matches SQL
// is_active_member(). Non-members stay on this page and are pointed at /join.
// Signed-out visitors go to /login. useAuthGate holds a half-hydrated or
// just-dropped session on "Checking access…" so the page does not bounce.
// Optional `deniedCopy` customizes the denial paragraph.
const DIRECTORY_DENIED =
  'The member directory is a benefit of active SAMPA membership. Join to network with other physician associates in addiction medicine.';

export default function RequireActiveMember({
  children,
  deniedCopy = DIRECTORY_DENIED,
}) {
  const { canAccessMemberDirectory } = useAuth();
  const { checking, loginTo } = useAuthGate();

  if (checking) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <p className="text-text/50 font-data">Checking access…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (loginTo) {
    return <Navigate to={loginTo} replace />;
  }

  if (!canAccessMemberDirectory) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Members only</h1>
          <p className="text-text/60 max-w-md mx-auto mb-8">
            {deniedCopy}
          </p>
          <Link
            to="/join"
            className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            Become a member
          </Link>
          <p className="text-text/40 text-xs mt-6">
            Already a member? Check that you&apos;re signed in with the same
            email you used to join, or open your{' '}
            <Link to="/dashboard" className="underline hover:text-primary-text">
              dashboard
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
