// Tracks the signed-in Supabase session and matching profile row (which holds the
// user's role/capabilities and membership status). Ported from the web app's
// AuthContext; the difference is native sign-in (Google/Apple/email) and a
// deep-link listener that finishes email-link / OAuth sessions.

import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { createSessionFromUrl, sendEmailLink, signInWithApple, signInWithGoogle } from './auth';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

type Profile = Record<string, any> | null;

type AuthValue = {
  session: Session | null;
  user: Session['user'] | null;
  profile: Profile;
  role: string | null;
  isEditor: boolean;
  canViewMembers: boolean;
  isAdmin: boolean;
  isActiveMember: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<unknown>;
  signInWithApple: () => Promise<unknown>;
  sendEmailLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  // Watch the auth session.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAuthReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Finish sign-in when the app is opened via a deep link (email magic link, or an
  // OAuth redirect that landed outside the in-app browser). Idempotent: a URL with
  // no auth payload resolves to null; a spent code throws and is ignored.
  const url = Linking.useURL();
  useEffect(() => {
    if (!url) return;
    createSessionFromUrl(url).catch(() => {
      /* not an auth link, or already consumed */
    });
  }, [url]);

  // Load the profile only when the signed-in USER changes (not on every token
  // refresh) — same reasoning as the web app.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    setProfileReady(false);
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!active) return;
      setProfile(data);
      setProfileReady(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data);
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const role = profile?.role ?? null;
  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    // Capabilities are independent flags, not a ladder (matches the web app).
    isEditor: role === 'editor' || role === 'admin' || !!profile?.can_edit_news,
    canViewMembers: role === 'admin' || !!profile?.can_view_members,
    isAdmin: role === 'admin',
    isActiveMember: profile?.membership_status === 'active',
    loading: !authReady || (!!session?.user && !profileReady),
    signInWithGoogle,
    signInWithApple,
    sendEmailLink,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
