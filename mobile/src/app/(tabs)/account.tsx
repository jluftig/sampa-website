import { MEMBERSHIP_TIERS } from 'sampa-shared/membership';
import { User } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenScaffold } from '@/components/screen-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AccountScreen() {
  const theme = useTheme();

  return (
    <ScreenScaffold
      title="Account"
      subtitle="Sign in to see your membership, edit your profile, and read your saved articles."
      icon={User}
      badge="SIGN-IN COMING IN PHASE 1">
      {/* Phase 0 smoke test: these tiers are imported from the web app's shared
          src/lib/membership.js via the `sampa-shared` symlinked package — proof
          the shared-code wiring works. Phase 3 replaces this with the real
          member area. */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
          MEMBERSHIP TIERS
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {MEMBERSHIP_TIERS.map((tier, i) => (
            <View
              key={tier.key}
              style={[
                styles.row,
                i < MEMBERSHIP_TIERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.tierName, { color: theme.text }]}>{tier.name}</Text>
                <ThemedText type="small" themeColor="textSecondary">
                  {tier.desc}
                </ThemedText>
              </View>
              <Text style={[styles.price, { color: theme.tint }]}>${tier.prices[1]}/yr</Text>
            </View>
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Joining and renewing happens on the website — this screen will show your status.
        </ThemedText>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, width: '100%' },
  eyebrow: { fontFamily: Fonts.mono, letterSpacing: 0.5 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  tierName: { fontFamily: Fonts.semibold, fontSize: 16 },
  price: { fontFamily: Fonts.bold, fontSize: 15 },
});
