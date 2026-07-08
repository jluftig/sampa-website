import { tierByKey } from 'sampa-shared/membership';
import { formatDateOnly } from 'sampa-shared/format';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { ScreenScaffold } from '@/components/screen-scaffold';
import { SignInCard } from '@/components/sign-in-card';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import {
  getBiometricLabel,
  getBiometricPref,
  isBiometricAvailable,
  setBiometricPref,
} from '@/lib/biometrics';

const WEBSITE = 'https://www.addictionpas.org';

// One-line membership summary from the profile row (webhook-written columns).
function membershipSummary(profile: Record<string, any> | null) {
  const status = profile?.membership_status;
  if (status === 'active') {
    if (!profile?.renews_on) return 'Lifetime member';
    const date = formatDateOnly(profile.renews_on);
    return profile.cancel_at_period_end ? `Active until ${date}` : `Renews ${date}`;
  }
  if (status === 'past_due') return 'Payment past due';
  if (status === 'canceled') return 'Membership canceled';
  return 'Not a member yet';
}

export default function AccountScreen() {
  const theme = useTheme();
  const { user, profile, loading, isActiveMember, signOut } = useAuth();

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState('Face ID');
  const [requireBio, setRequireBio] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await isBiometricAvailable();
      setBioAvailable(avail);
      if (avail) {
        setBioLabel(await getBiometricLabel());
        setRequireBio(await getBiometricPref());
      }
    })();
  }, [user]);

  const toggleBio = async (value: boolean) => {
    setRequireBio(value);
    await setBiometricPref(value);
  };

  // Signed out → sign-in options.
  if (!user) {
    return (
      <ScreenScaffold
        title="Account"
        subtitle="Sign in to see your membership, save articles, and manage your profile."
        icon={User}>
        <SignInCard />
      </ScreenScaffold>
    );
  }

  // Signed in but profile still loading.
  if (loading) {
    return (
      <ScreenScaffold title="Account" icon={User}>
        <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.four }} />
      </ScreenScaffold>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Member';
  const email = profile?.email || user.email || '';
  const tier = tierByKey(profile?.membership_tier || '');

  return (
    <ScreenScaffold title="Account" icon={User}>
      {/* Identity */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
        {email ? (
          <ThemedText type="small" themeColor="textSecondary">
            {email}
          </ThemedText>
        ) : null}
      </View>

      {/* Membership status (read-only; managed on the website) */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
          MEMBERSHIP
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.tier, { color: theme.text }]}>{tier?.name || 'No plan'}</Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isActiveMember ? theme.backgroundSelected : 'transparent', borderColor: theme.border },
              ]}>
              <Text style={[styles.statusText, { color: isActiveMember ? theme.tint : theme.textSecondary }]}>
                {membershipSummary(profile)}
              </Text>
            </View>
          </View>
        </View>
        <AuthButton
          label={isActiveMember ? 'Manage membership on the website' : 'Join SAMPA on the website'}
          icon={ExternalLink}
          onPress={() => WebBrowser.openBrowserAsync(`${WEBSITE}/${isActiveMember ? 'dashboard' : 'join'}`)}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Joining and renewing happen on the website.
        </ThemedText>
      </View>

      {/* Security */}
      {bioAvailable ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
            SECURITY
          </ThemedText>
          <View style={[styles.card, styles.rowBetween, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <ShieldCheck color={theme.tint} size={20} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Require {bioLabel} to open</Text>
            </View>
            <Switch
              value={requireBio}
              onValueChange={toggleBio}
              trackColor={{ true: theme.tint, false: theme.border }}
            />
          </View>
        </View>
      ) : null}

      {/* Sign out */}
      <AuthButton label="Sign out" icon={LogOut} onPress={signOut} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, width: '100%' },
  eyebrow: { fontFamily: Fonts.mono, letterSpacing: 0.5 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    width: '100%',
  },
  name: { fontFamily: Fonts.serifBold, fontSize: 22 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  tier: { fontFamily: Fonts.semibold, fontSize: 16 },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  statusText: { fontFamily: Fonts.mono, fontSize: 12 },
  settingLabel: { fontFamily: Fonts.medium, fontSize: 15 },
});
