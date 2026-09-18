import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { canViewSiteTraffic } from '../lib/siteTraffic';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for the member roster (/editor/members): admins, can_view_members,
// Board, or Membership Committee. Site traffic lives at the top of this page
// (board/committee only). Roster data is still RLS-enforced; viewers can't
// write member records even if the UI were bypassed.
export default function RequireMemberViewer({ children }) {
  const { loading, sessionUsable, canViewMembers, profile } = useAuth();
  const location = useLocation();
  const canOpen = canViewMembers || canViewSiteTraffic(profile);

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

  if (!sessionUsable) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!canOpen) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Members-area access required</h1>
          <p className="text-text/60 max-w-md mx-auto">
            Viewing the member roster is limited to administrators, people
            with the &quot;view members&quot; permission, Board, and
            Membership Committee. If you should have access, ask an
            administrator to grant it.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
