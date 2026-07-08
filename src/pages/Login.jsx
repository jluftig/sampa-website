import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Only follow in-app paths — never an absolute URL from the query string.
function safeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [linkState, setLinkState] = useState('idle'); // idle | sending | sent | error

  // Already signed in? Continue to wherever they were headed.
  if (!loading && user) {
    return <Navigate to={next} replace />;
  }

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLinkState('sending');
    const { error } = await signInWithEmail(email.trim(), next);
    setLinkState(error ? 'error' : 'sent');
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-40 pb-24">
        <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10 text-center">
          <div className="text-primary font-bold font-data tracking-widest text-xs mb-4 uppercase">
            Member Access
          </div>
          <h1 className="text-2xl md:text-3xl font-drama font-bold mb-3">Sign in</h1>
          <p className="text-text/60 mb-8">
            Members sign in to save news articles, manage their membership and
            CME, and update their profile.
          </p>

          <button
            onClick={() => signInWithGoogle(next)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-full border border-primary/20 font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6 text-text/30 text-xs font-data uppercase tracking-widest">
            <span className="flex-1 border-t border-primary/10"></span>
            or
            <span className="flex-1 border-t border-primary/10"></span>
          </div>

          {linkState === 'sent' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-sm text-text/80">
              <Mail className="w-5 h-5 mx-auto mb-2 text-primary" />
              <strong>Check your email.</strong> We sent a sign-in link to{' '}
              <span className="font-semibold">{email}</span> — click it and
              you'll be signed in here automatically.
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="text-left">
              <label htmlFor="login-email" className="block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2">
                Email me a sign-in link
              </label>
              <div className="flex gap-2">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 px-4 py-3 rounded-full border border-primary/20 focus:outline-none focus:border-primary text-sm"
                />
                <button
                  type="submit"
                  disabled={linkState === 'sending'}
                  className="px-5 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                >
                  {linkState === 'sending' ? 'Sending…' : 'Send link'}
                </button>
              </div>
              {linkState === 'error' && (
                <p className="text-red-500 text-xs mt-2">
                  Couldn't send the link — check the address and try again.
                </p>
              )}
            </form>
          )}

          <p className="text-text/40 text-xs mt-6">
            No password needed — use your Google account or a one-time email link.
            By signing in you agree to our{' '}
            <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
