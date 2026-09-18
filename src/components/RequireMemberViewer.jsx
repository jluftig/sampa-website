import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { guardLoginPath } from '../lib/authRedirect';
import { canViewMemberRoster } from '../lib/memberRoster';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for the member roster (/editor/members): same helper as Site traffic —
// admin or can_view_members. Read-only roster — RLS still blocks writes.
export default function RequireMemberViewer({ children }) {
  const { loading, sessionUsable, profile, user } = useAuth();
  const location = useLocation();
  const canOpen = canViewMemberRoster(profile);

  if (loading || (!sessionUsable && !!user)) {
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

  if (!sessionUsable) {
    return (
      <Navigate
        to={guardLoginPath({
          pathname: location.pathname,
          search: location.search,
        })}
        replace
      />
    );
  }

  if (!canOpen) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Members-area access required</h1>
          <p className="text-text/60 max-w-md mx-auto">
            Viewing the member roster is limited to administrators and people
            with the &quot;view members&quot; permission. If you should have
            access, ask an administrator to grant it.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
