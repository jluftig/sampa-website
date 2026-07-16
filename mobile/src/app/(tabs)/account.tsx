import { tierByKey } from 'sampa-shared/membership';
import { formatDateOnly } from 'sampa-shared/format';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Bell,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  LogOut,
  Pencil,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { ScreenScaffold } from '@/components/screen-scaffold';
import { SignInCard } from '@/components/sign-in-card';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { registerForPush } from '@/lib/push';
import { supabase } from '@/lib/supabaseClient';
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
  const router = useRouter();
  const { user, profile, loading, isActiveMember, signOut, refreshProfile } = useAuth();

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState('Face ID');
  const [requireBio, setRequireBio] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // App Store guideline 5.1.1(v): apps with sign-in must offer in-app account
  // deletion. The endpoint (api/delete-account.js) cancels any active Stripe
  // subscription, then deletes the auth user (cascades profile + favorites).
  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your SAMPA account, professional profile, and saved articles. Any active membership subscription is canceled so you will not be billed again. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiPost('/api/delete-account');
              await signOut().catch(() => {}); // server side is already gone
            } catch (e: any) {
              Alert.alert(
                'Could not delete your account',
                e?.message ?? 'Please try again, or contact SAMPA through the website.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

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

  // "New article notifications": the profile's push_opt_in is what the server
  // filters on; enabling also registers this device's token (may show the OS
  // permission prompt the first time).
  const pushOn = profile?.push_opt_in !== false;
  const togglePush = async (value: boolean) => {
    if (!user) return;
    await supabase.from('profiles').update({ push_opt_in: value }).eq('id', user.id);
    await refreshProfile();
    if (value) {
      const registered = await registerForPush(user.id);
      if (!registered && Device.isDevice) {
        Alert.alert(
          'Notifications are blocked',
          'To get new-article alerts, allow notifications for SAMPA in your iPhone Settings.'
        );
      }
    }
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
      <Pressable
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [
          styles.card,
          styles.rowBetween,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
        ]}>
        <View style={styles.rowLeft}>
          <Pencil color={theme.tint} size={18} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Edit professional profile</Text>
        </View>
        <ChevronRight color={theme.textSecondary} size={18} />
      </Pressable>

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

      {/* Member content (future CME home; structure gated on isActiveMember) */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
          MEMBER CONTENT
        </ThemedText>
        <View style={[styles.card, styles.rowLeft, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <GraduationCap color={isActiveMember ? theme.tint : theme.textSecondary} size={20} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.flexText}>
            {isActiveMember
              ? 'CME and member resources are coming to the app — as an active member, you’ll have access the day they launch.'
              : 'CME and member resources are coming to the app. Join SAMPA to access them when they launch.'}
          </ThemedText>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
          NOTIFICATIONS
        </ThemedText>
        <View style={[styles.card, styles.rowBetween, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.rowLeft}>
            <Bell color={theme.tint} size={20} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>New article alerts</Text>
          </View>
          <Switch
            value={pushOn}
            onValueChange={togglePush}
            trackColor={{ true: theme.tint, false: theme.border }}
          />
        </View>
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

      {/* Danger zone — required by App Store 5.1.1(v) */}
      <Pressable onPress={confirmDelete} disabled={deleting} style={styles.deleteRow}>
        <Text style={[styles.deleteText, { color: theme.accent, opacity: deleting ? 0.5 : 1 }]}>
          {deleting ? 'Deleting account…' : 'Delete account'}
        </Text>
      </Pressable>
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
  flexText: { flex: 1 },
  deleteRow: { alignItems: 'center', paddingVertical: Spacing.two },
  deleteText: { fontFamily: Fonts.medium, fontSize: 14 },
});
