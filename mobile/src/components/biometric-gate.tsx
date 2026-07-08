// Optional biometric (Face ID / Touch ID) app lock, layered ON TOP of the
// persisted Supabase session — it never replaces auth, it only gates opening
// the app.
//
// Behavior (each point fixes a bug from the first version of this file):
// - Cold start with an existing session + lock enabled → locked. The decision
//   is made exactly ONCE, after auth restores the session; signing in later in
//   the same run must NOT lock (the user just authenticated).
// - While that decision is pending for lock-enabled users, an opaque cover
//   prevents content flashing before the lock lands. Users without the lock
//   see no cover beyond the pref read (a few ms).
// - Locks on 'background' only — NOT 'inactive', which iOS also fires for
//   Notification Center, the app switcher, and the Face ID prompt itself.
// - Subscribes to preference changes, so flipping the Account toggle applies
//   immediately (no stale-pref window before the next foreground).
// - Re-prompts on return to foreground while locked; concurrent prompts are
//   guarded by an in-flight ref.

import { Lock, LogOut } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/wordmark';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import {
  authenticateBiometric,
  getBiometricPref,
  isBiometricAvailable,
  subscribeBiometricPref,
} from '@/lib/biometrics';

type PrefState = { pref: boolean; available: boolean };

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useAuth();
  const theme = useTheme();

  const [prefState, setPrefState] = useState<PrefState | null>(null); // null = reading
  const [locked, setLocked] = useState(false);
  const [decided, setDecided] = useState(false); // the one-shot cold-start decision
  const [authing, setAuthing] = useState(false);
  const authingRef = useRef(false);

  const enabled = !!prefState?.pref && !!prefState?.available;

  // Read pref + hardware once; stay subscribed to toggle changes.
  useEffect(() => {
    let active = true;
    (async () => {
      const [pref, available] = await Promise.all([getBiometricPref(), isBiometricAvailable()]);
      if (active) setPrefState({ pref, available });
    })();
    const unsubscribe = subscribeBiometricPref((pref) =>
      setPrefState((s) => (s ? { ...s, pref } : s))
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Cold-start decision, exactly once, after auth has restored any session.
  useEffect(() => {
    if (decided || !prefState || loading) return;
    if (enabled && session) setLocked(true);
    setDecided(true);
  }, [decided, prefState, loading, enabled, session]);

  // Signed out → never locked.
  useEffect(() => {
    if (!session) setLocked(false);
  }, [session]);

  const unlock = useCallback(async () => {
    if (authingRef.current) return;
    authingRef.current = true;
    setAuthing(true);
    try {
      const ok = await authenticateBiometric();
      if (ok) setLocked(false);
    } finally {
      authingRef.current = false;
      setAuthing(false);
    }
  }, []);

  // Lock on background; re-prompt on foreground while locked. Refs keep the
  // single listener current without re-subscribing.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const hasSessionRef = useRef(!!session);
  hasSessionRef.current = !!session;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        if (enabledRef.current && hasSessionRef.current) setLocked(true);
      } else if (state === 'active' && lockedRef.current) {
        unlock();
      }
    });
    return () => sub.remove();
  }, [unlock]);

  // Auto-prompt when we first become locked (cold start / backgrounding).
  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  // Opaque cover while deciding: always during the (ms-fast) pref read; for
  // lock-enabled users, until the cold-start decision lands.
  const covering = !decided && (!prefState || (prefState.pref && prefState.available));

  return (
    <View style={styles.fill}>
      {children}
      {covering ? (
        <View style={[styles.overlay, { backgroundColor: theme.background }]} />
      ) : locked ? (
        <View style={[styles.overlay, styles.lockScreen, { backgroundColor: theme.background }]}>
          <Wordmark size={24} />
          <View style={[styles.iconBadge, { backgroundColor: theme.backgroundSelected }]}>
            <Lock color={theme.tint} size={28} strokeWidth={2.25} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>SAMPA is locked</Text>
          <Pressable
            onPress={unlock}
            disabled={authing}
            style={({ pressed }) => [
              styles.unlockBtn,
              { backgroundColor: theme.tint, opacity: pressed || authing ? 0.85 : 1 },
            ]}>
            <Text style={styles.unlockText}>{authing ? 'Unlocking…' : 'Unlock'}</Text>
          </Pressable>
          <Pressable onPress={signOut} style={styles.signOutRow}>
            <LogOut color={theme.textSecondary} size={16} />
            <Text style={[styles.signOutText, { color: theme.textSecondary }]}>Sign out instead</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Fonts.serifBold, fontSize: 24 },
  unlockBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    minWidth: 200,
    alignItems: 'center',
  },
  unlockText: { fontFamily: Fonts.semibold, fontSize: 16, color: '#FFFFFF' },
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signOutText: { fontFamily: Fonts.medium, fontSize: 14 },
});
