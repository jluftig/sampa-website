import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

function FullPage({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">{children}</main>
      <Footer />
    </div>
  );
}

// Gate for editor-only routes. Authentication is checked first (must be signed
// in), then authorization (role must be editor or admin). Pass adminOnly to
// further restrict to admins (e.g. tag management).
export default function RequireEditor({ children, adminOnly = false }) {
  const { loading, user, isEditor, isAdmin } = useAuth();

  if (loading) {
    return <FullPage><p className="text-text/50 font-data">Checking access…</p></FullPage>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isEditor) {
    return (
      <FullPage>
        <h1 className="text-3xl font-drama font-bold mb-4">You're signed in, but not an editor</h1>
        <p className="text-text/60 max-w-md mx-auto">
          This area is limited to approved editors. If you should have access, ask an
          administrator to grant you the editor role.
        </p>
      </FullPage>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <FullPage>
        <h1 className="text-3xl font-drama font-bold mb-4">Admins only</h1>
        <p className="text-text/60 max-w-md mx-auto">
          Managing the tag vocabulary is limited to administrators.
        </p>
      </FullPage>
    );
  }

  return children;
}
