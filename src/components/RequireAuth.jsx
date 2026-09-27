import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthGate } from './useAuthGate';
import Navbar from './Navbar';
import Footer from './Footer';

// Gate for member routes: any signed-in user qualifies (no role required).
// Signed-out visitors are sent to /login and returned here afterwards.
export default function RequireAuth({ children }) {
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

  return children;
}
