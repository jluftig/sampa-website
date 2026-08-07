import { useRouter } from 'expo-router';
import { Mail, MapPin, Phone } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { displayOrganizations, formatOrgLocation } from 'sampa-shared/organizations';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DirectoryMember } from '@/lib/directory';
import { PersonPracticeSettings } from '@/components/practice-setting-chips';

/** Directory list card — mirrors the website's MemberCard (src/pages/MemberDirectory.jsx). */
export function MemberCard({ person }: { person: DirectoryMember }) {
  const theme = useTheme();
  const router = useRouter();

  const name = person.full_name || 'SAMPA member';
  const orgs = displayOrganizations(person);
  const primary = orgs[0];
  const extraCount = Math.max(0, orgs.length - 1);
  // Prefer employer location on the card; fall back to personal/home state.
  const location = (primary ? formatOrgLocation(primary) : '') || person.state || '';

  return (
    <Pressable
      onPress={() => router.push(`/members/${person.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.headerRow}>
        <Text style={[styles.name, { color: theme.text }]}>
          {name}
          {person.credentials ? (
            <Text style={[styles.credentials, { color: theme.textSecondary }]}>
              {'  '}{person.credentials}
            </Text>
          ) : null}
        </Text>
        {person.is_board ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.badgeText, { color: theme.tint }]}>BOARD</Text>
          </View>
        ) : null}
      </View>

      {primary?.name ? (
        <Text style={[styles.line, { color: theme.textSecondary }]}>
          {primary.name}
          {extraCount > 0 ? ` · +${extraCount} more` : ''}
        </Text>
      ) : null}
      {primary?.role ? (
        <Text style={[styles.line, { color: theme.textSecondary }]}>{primary.role}</Text>
      ) : null}
      {location ? (
        <View style={styles.iconRow}>
          <MapPin color={theme.textSecondary} size={13} />
          <Text style={[styles.lineFaint, { color: theme.textSecondary }]}>{location}</Text>
        </View>
      ) : null}
      <PersonPracticeSettings person={person} style={{ marginTop: 6 }} />

      {person.email || person.phone ? (
        <View style={[styles.contactRow, { borderTopColor: theme.border }]}>
          {person.email ? (
            <View style={styles.iconRow}>
              <Mail color={theme.tint} size={13} />
              <Text style={[styles.contactText, { color: theme.textSecondary }]}>Email shared</Text>
            </View>
          ) : null}
          {person.phone ? (
            <View style={styles.iconRow}>
              <Phone color={theme.tint} size={13} />
              <Text style={[styles.contactText, { color: theme.textSecondary }]}>Phone shared</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: 2,
  },
  name: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 23, flex: 1 },
  credentials: { fontFamily: Fonts.sans, fontSize: 13 },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  badgeText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },
  line: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  lineFaint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  contactText: { fontFamily: Fonts.medium, fontSize: 12 },
});
