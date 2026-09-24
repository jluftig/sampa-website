import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { canViewPolicyWork } from '../lib/policyWorkAccess';
import { useAuthGate } from './useAuthGate';
import Navbar from './Navbar';
import Footer from './Footer';

export default function RequirePolicyWork({ children }) {
  const { profile } = useAuth();
  const { checking, loginTo } = useAuthGate();
  const canOpen = canViewPolicyWork(profile);

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

  if (!canOpen) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-40 pb-24 text-center">
          <p className="font-data text-xs tracking-widest uppercase text-text/40 mb-2">403</p>
          <h1 className="text-3xl font-drama font-bold mb-4">Policy committee access required</h1>
          <p className="text-text/60 max-w-md mx-auto">
            This tracker is for administrators, people with view-members access,
            and board members. News-editor access and the Membership Committee
            hat do not include it.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
