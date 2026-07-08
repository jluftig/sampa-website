// Wraps the app in an optional biometric lock. When the user has enabled "require
// Face ID" AND is signed in, the app locks whenever it goes to the background and
// requires a biometric unlock to reopen. Signing in during a session does NOT lock
// (the user just authenticated); only backgrounding or a cold start with an
// existing session locks.

import { LogOut, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '@/components/wordmark';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { authenticateBiometric, getBiometricPref, isBiometricAvailable } from '@/lib/biometrics';

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const theme = useTheme();

  const [enabled, setEnabled] = useState(false); // pref AND hardware available
  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);
  const mounted = useRef(false);

  // Read the preference on mount (and lock immediately on a cold start that
  // already has a session), then keep it fresh whenever the app foregrounds.
  const refreshEnabled = useCallback(async () => {
    const [pref, avail] = await Promise.all([getBiometricPref(), isBiometricAvailable()]);
    const on = pref && avail;
    setEnabled(on);
    return on;
  }, []);

  useEffect(() => {
    (async () => {
      const on = await refreshEnabled();
      if (on && session) setLocked(true);
      mounted.current = true;
    })();
  }, [refreshEnabled, session]);

  // Clear the lock the moment we're signed out.
  useEffect(() => {
    if (!session) setLocked(false);
  }, [session]);

  // Lock on background; refresh the preference on return to foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (enabled && session) setLocked(true);
      } else if (state === 'active') {
        refreshEnabled();
      }
    });
    return () => sub.remove();
  }, [enabled, session, refreshEnabled]);

  const unlock = useCallback(async () => {
    setAuthing(true);
    try {
      const ok = await authenticateBiometric();
      if (ok) setLocked(false);
    } finally {
      setAuthing(false);
    }
  }, []);

  // Auto-prompt as soon as we become locked.
  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  return (
    <View style={styles.fill}>
      {children}
      {locked ? (
        <View style={[styles.overlay, { backgroundColor: theme.background }]}>
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
