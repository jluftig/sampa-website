import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { guardLoginPath } from '../lib/authRedirect';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for member routes: any signed-in user qualifies (no role required).
// Signed-out visitors are sent to /login and returned here afterwards.
export default function RequireAuth({ children }) {
  const { loading, sessionUsable, user } = useAuth();
  const location = useLocation();

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

  return children;
}
