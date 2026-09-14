import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { clientSiteOrigin } from './siteUrl';
import {
  isAccessTokenExpired,
  isCheckoutReturnSearch,
  isSessionUsable,
  nextSessionFromAuthEvent,
  refreshSessionWithRetry,
  shouldClearHeldSession,
  shouldHoldAuthReady,
  shouldRetryAuthRecovery,
  stripAuthCallbackParams,
} from './authSession';
import { isEditorProfile } from './memberHome';

const AuthContext = createContext(null);

function currentSearch() {
  try { return window.location.search || ''; } catch { return ''; }
}

function cleanAuthCallbackUrl() {
  try {
    const next = stripAuthCallbackParams(window.location.href);
    if (next) window.history.replaceState({}, '', next);
  } catch { /* ignore */ }
}

// Tracks the signed-in Supabase session and the matching profile row (which
// holds the user's role). Authentication (who you are) comes from the session;
// authorization (what you can do) comes from profile.role.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [authReady, setAuthReady] = useState(false);     // session has been checked
  const [profileReady, setProfileReady] = useState(false); // profile fetch settled
  const [recovering, setRecovering] = useState(() => (
    isCheckoutReturnSearch(currentSearch())
  ));
  const sessionRef = useRef(null);
  const intentionalSignOutRef = useRef(false);
  const recoverInFlightRef = useRef(false);

  sessionRef.current = session;

  const applySession = useCallback((next) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const recoverSession = useCallback(async () => {
    if (intentionalSignOutRef.current || recoverInFlightRef.current) return;
    recoverInFlightRef.current = true;
    setRecovering(true);
    try {
      const { session: recovered } = await refreshSessionWithRetry(supabase.auth);
      if (intentionalSignOutRef.current) return;
      if (recovered) {
        applySession(recovered);
      } else {
        applySession(null);
      }
    } finally {
      recoverInFlightRef.current = false;
      setRecovering(false);
      setAuthReady(true);
    }
  }, [applySession]);

  // Watch the auth session.
  useEffect(() => {
    let active = true;
    let getSessionDone = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      getSessionDone = true;
      const initial = data.session;
      if (initial && isAccessTokenExpired(initial)) {
        recoverSession();
        return;
      }
      applySession(initial);
      cleanAuthCallbackUrl();
      if (!initial && shouldRetryAuthRecovery({
        event: 'INITIAL_SESSION',
        session: null,
        previous: sessionRef.current,
        intentionalSignOut: intentionalSignOutRef.current,
        search: currentSearch(),
      })) {
        recoverSession();
        return;
      }
      setAuthReady(true);
      setRecovering(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!active) return;
      if (shouldHoldAuthReady({ event, session: sess, getSessionDone })) {
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        cleanAuthCallbackUrl();
      }
      const previous = sessionRef.current;
      const next = nextSessionFromAuthEvent({
        event,
        incoming: sess,
        previous,
        intentionalSignOut: intentionalSignOutRef.current,
      });
      applySession(next);
      if (shouldRetryAuthRecovery({
        event,
        session: sess,
        previous,
        intentionalSignOut: intentionalSignOutRef.current,
        search: currentSearch(),
      })) {
        recoverSession();
        return;
      }
      if (event === 'SIGNED_OUT' && intentionalSignOutRef.current) {
        intentionalSignOutRef.current = false;
      }
      setAuthReady(true);
      setRecovering(false);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [applySession, recoverSession]);

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
      setProfileError(null);
      setProfileReady(true);
      return;
    }
    setProfileReady(false);
    setProfileError(null);
    (async () => {
      const first = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!active) return;
      if (first.data) {
        setProfile(first.data);
        setProfileError(null);
        setProfileReady(true);
        return;
      }

      // Session claims a user (email still readable from the JWT) but we
      // could not read their profiles row. That is the stale-cookie /
      // T46-held-session case: refresh once, then drop the session so
      // Member Login and /dashboard go through /login instead of the
      // "no membership yet" upsell.
      const { data: liveWrap } = await supabase.auth.getSession();
      const liveSession = liveWrap?.session ?? null;
      if (!shouldClearHeldSession({
        session: sessionRef.current,
        liveSession,
        profile: first.data,
        profileError: first.error?.message,
      })) {
        setProfile(null);
        setProfileError(first.error?.message ?? null);
        setProfileReady(true);
        return;
      }

      const { session: recovered } = await refreshSessionWithRetry(supabase.auth);
      if (!active) return;
      if (recovered) {
        applySession(recovered);
        const second = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recovered.user?.id ?? userId)
          .maybeSingle();
        if (!active) return;
        if (second.data) {
          setProfile(second.data);
          setProfileError(null);
          setProfileReady(true);
          return;
        }
      }

      intentionalSignOutRef.current = true;
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
      if (!active) return;
      applySession(null);
      setProfile(null);
      setProfileError(first.error?.message ?? 'session expired');
      setProfileReady(true);
    })();
    return () => { active = false; };
  }, [userId, applySession]);

  // Re-fetch the profile without flipping `loading` (so route guards don't
  // remount) — used after profile edits and after Stripe checkout returns.
  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);
    setProfileError(error?.message ?? null);
  }, [userId]);

  // `next` is an in-app path to land on after auth completes. Both flows
  // redirect through Supabase, so the URL must be covered by the allowlist in
  // Supabase Auth → URL Configuration. Always www in production so storage
  // isn't split across apex / www.
  // Default `/login` (not `/dashboard`) so Login can send editors to /editor
  // once the profile is known. Callers with an explicit next (e.g. /join)
  // still pass it through.
  const signInWithGoogle = (next = '/login') =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${clientSiteOrigin()}${next}` },
    });

  const signInWithEmail = (email, next = '/login') =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${clientSiteOrigin()}${next}` },
    });

  const signOut = () => {
    intentionalSignOutRef.current = true;
    return supabase.auth.signOut();
  };

  const role = profile?.role ?? null;
  const isAdmin = role === 'admin';
  const isEditor = isEditorProfile(profile);
  // Paid membership only — used by /join to block duplicate checkouts.
  const isActiveMember = profile?.membership_status === 'active';
  // Matches SQL is_active_member(): paid members + staff (editors/admins).
  const canAccessMemberDirectory = isActiveMember || role === 'editor' || isAdmin;
  // A just-expired token is still usable while recoverSession is in flight
  // (T46: don't bounce a checkout return to /login on a radio blip).
  // A session with no profiles row is never usable — that is the stale
  // cookie / held-session upsell bug.
  const sessionUsable = isSessionUsable(session, profile)
    || (!!profile && recovering && !!session?.user);
  const value = {
    session,
    user: session?.user ?? null,
    profile,
    profileError,
    role,
    // Capabilities are checkboxes, not a ladder — people can hold several.
    // The legacy 'editor' role still implies news editing; admins imply all.
    // is_board is explicit only (admin ≠ board unless checked).
    isEditor,
    canViewMembers: isAdmin || !!profile?.can_view_members,
    isAdmin,
    isBoard: !!profile?.is_board,
    isActiveMember,
    canAccessMemberDirectory,
    sessionUsable,
    // True until we know both the session and (if signed in) the profile.
    // Stay "loading" while a refresh retry is in flight so RequireAuth does
    // not bounce a returning checkout to /login.
    loading: !authReady || recovering || (!!session?.user && !profileReady),
    signInWithGoogle,
    signInWithEmail,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
