import * as AppleAuthentication from 'expo-apple-authentication';
import { CheckCircle2, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { isAppleAuthAvailable } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Signed-out sign-in options: Apple (iOS), Google, and passwordless email link. */
export function SignInCard() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { signInWithGoogle, signInWithApple, sendEmailLink } = useAuth();

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<null | 'google' | 'apple' | 'email'>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const onGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const onApple = async () => {
    setError(null);
    setBusy('apple');
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        setError(e?.message ?? 'Apple sign-in failed.');
      }
    } finally {
      setBusy(null);
    }
  };

  const onSendEmail = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy('email');
    try {
      await sendEmailLink(email);
      setSentTo(email.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Could not send the link.');
    } finally {
      setBusy(null);
    }
  };

  if (sentTo) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.sentHeader}>
          <CheckCircle2 color={theme.tint} size={22} />
          <Text style={[styles.sentTitle, { color: theme.text }]}>Check your email</Text>
        </View>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We sent a sign-in link to {sentTo}. Open it on this device to finish signing in.
        </Text>
        <AuthButton label="Use a different email" onPress={() => setSentTo(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={Radius.md}
          style={styles.appleButton}
          onPress={onApple}
        />
      ) : null}

      <AuthButton
        label="Continue with Google"
        onPress={onGoogle}
        loading={busy === 'google'}
        disabled={busy !== null && busy !== 'google'}
      />

      {!emailOpen ? (
        <AuthButton label="Continue with email" icon={Mail} onPress={() => setEmailOpen(true)} />
      ) : (
        <View style={styles.emailGroup}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
            ]}
          />
          <AuthButton
            label="Email me a sign-in link"
            variant="primary"
            onPress={onSendEmail}
            loading={busy === 'email'}
          />
        </View>
      )}

      {error ? <Text style={[styles.error, { color: theme.accent }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
  },
  appleButton: { height: 52, width: '100%' },
  emailGroup: { gap: Spacing.three },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  sentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sentTitle: { fontFamily: Fonts.semibold, fontSize: 18 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  error: { fontFamily: Fonts.medium, fontSize: 14 },
});
