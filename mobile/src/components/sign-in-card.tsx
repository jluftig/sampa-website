import * as AppleAuthentication from 'expo-apple-authentication';
import { Mail, MailCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { isAppleAuthAvailable } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Signed-out sign-in options: Apple (iOS), Google, and passwordless email.
 * Email flow: we send a 6-digit code (plus a sign-in link as fallback); the
 * user types the code here — no reliance on tappable links, which corporate
 * mail scanners often prefetch and invalidate.
 */
export function SignInCard() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { signInWithGoogle, signInWithApple, sendEmailCode, verifyEmailCode } = useAuth();

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<null | 'google' | 'apple' | 'email' | 'verify'>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
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
      await sendEmailCode(email);
      setSentTo(email.trim());
      setCode('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not send the code.');
    } finally {
      setBusy(null);
    }
  };

  const onVerify = async () => {
    setError(null);
    if (!sentTo || code.trim().length < 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setBusy('verify');
    try {
      await verifyEmailCode(sentTo, code);
      // Success → onAuthStateChange flips the app to signed-in.
    } catch (e: any) {
      setError(e?.message ?? 'That code didn’t work. Check it and try again.');
    } finally {
      setBusy(null);
    }
  };

  // Code-entry step.
  if (sentTo) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.sentHeader}>
          <MailCheck color={theme.tint} size={22} />
          <Text style={[styles.sentTitle, { color: theme.text }]}>Check your email</Text>
        </View>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We emailed a 6-digit code to {sentTo}. Enter it below (or tap the link in the email on
          this device).
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          style={[
            styles.input,
            styles.codeInput,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          ]}
        />
        <AuthButton label="Verify code" variant="primary" onPress={onVerify} loading={busy === 'verify'} />
        <AuthButton
          label="Use a different email"
          onPress={() => {
            setSentTo(null);
            setCode('');
            setError(null);
          }}
        />
        {error ? <Text style={[styles.error, { color: theme.accent }]}>{error}</Text> : null}
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
            label="Email me a sign-in code"
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
  codeInput: { fontFamily: Fonts.mono, fontSize: 22, letterSpacing: 8, textAlign: 'center' },
  sentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sentTitle: { fontFamily: Fonts.semibold, fontSize: 18 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  error: { fontFamily: Fonts.medium, fontSize: 14 },
});
