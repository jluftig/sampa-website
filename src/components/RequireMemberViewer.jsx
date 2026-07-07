import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for the member roster (/editor/members): admins and anyone with the
// can_view_members capability. Read-only access — RLS enforces that viewers
// can't write member data even if the UI were bypassed.
export default function RequireMemberViewer({ children }) {
  const { loading, user, canViewMembers } = useAuth();
  const location = useLocation();

  if (loading) {
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

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!canViewMembers) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Members-area access required</h1>
          <p className="text-text/60 max-w-md mx-auto">
            Viewing the member roster is limited to administrators and board
            members with the "view members" permission. If you should have
            access, ask an administrator to grant it.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
