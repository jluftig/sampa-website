import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

// Tracks the signed-in Supabase session and the matching profile row (which
// holds the user's role). Authentication (who you are) comes from the session;
// authorization (what you can do) comes from profile.role.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);     // session has been checked
  const [profileReady, setProfileReady] = useState(false); // profile fetch settled

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
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load the profile (role) only when the signed-in USER changes — not on every
  // session object change. Supabase emits a new session on each background token
  // refresh (and on tab refocus); keying this effect on the user id means those
  // refreshes don't re-trigger the fetch, don't flip `loading`, and therefore
  // don't cause RequireEditor to unmount/remount the editor (which would wipe an
  // in-progress post).
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
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .maybeSingle();
      if (!active) return;
      setProfile(data);
      setProfileReady(true);
    })();
    return () => { active = false; };
  }, [userId]);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/editor` },
    });

  const signOut = () => supabase.auth.signOut();

  const role = profile?.role ?? null;
  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    isEditor: role === 'editor' || role === 'admin',
    isAdmin: role === 'admin',
    // True until we know both the session and (if signed in) the profile.
    loading: !authReady || (!!session?.user && !profileReady),
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
