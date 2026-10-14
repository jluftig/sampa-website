import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useAuthGate } from './useAuthGate';
import Navbar from './Navbar';
import Footer from './Footer';

function Shell({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function BoardDashboardDenied() {
  const { canAccessMemberDirectory } = useAuth();
  return (
    <Shell>
      <h1 className="text-3xl font-drama font-bold mb-4">Board dashboard</h1>
      <p className="text-text/60 max-w-md mx-auto mb-8">
        This dashboard is for administrators, board members, and committee chairs.
      </p>
      {canAccessMemberDirectory && (
        <Link
          to="/board"
          className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
        >
          Back to board meetings
        </Link>
      )}
    </Shell>
  );
}

export default function RequireBoardDashboard({ children }) {
  const { canViewBoardDashboard } = useAuth();
  const { checking, loginTo } = useAuthGate();

  if (checking) {
    return (
      <Shell>
        <p className="text-text/50 font-data">Checking access…</p>
      </Shell>
    );
  }

  if (loginTo) {
    return <Navigate to={loginTo} replace />;
  }

  if (!canViewBoardDashboard) {
    return <BoardDashboardDenied />;
  }

  return children;
}
