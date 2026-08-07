import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { Globe, Mail, MapPin, Phone } from 'lucide-react-native';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { displayOrganizations, formatOrgLocation, formatWebsiteLabel } from 'sampa-shared/organizations';
import { sanitizePracticeSettingSlugs } from 'sampa-shared/practiceSettings';

import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchMemberProfile } from '@/lib/directory';
import {
  PersonPracticeSettings,
  PracticeSettingChips,
} from '@/components/practice-setting-chips';

export default function MemberProfileScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: person, status } = useQuery({
    queryKey: ['member', id],
    queryFn: () => fetchMemberProfile(String(id)),
    enabled: !!id,
  });

  if (status === 'pending') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }
  if (status === 'error' || !person) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.muted, { color: theme.textSecondary }]}>
          {status === 'error'
            ? 'Something went wrong loading this member.'
            : 'This member profile isn’t available.'}
        </Text>
      </View>
    );
  }

  const orgs = displayOrganizations(person);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Identity */}
      <View style={styles.headerRow}>
        <Text style={[styles.name, { color: theme.text }]}>
          {person.full_name || 'SAMPA member'}
        </Text>
        {person.is_board ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.badgeText, { color: theme.tint }]}>BOARD</Text>
          </View>
        ) : null}
      </View>
      {person.credentials ? (
        <Text style={[styles.credentials, { color: theme.textSecondary }]}>{person.credentials}</Text>
      ) : null}
      {person.state ? (
        <View style={styles.iconRow}>
          <MapPin color={theme.textSecondary} size={14} />
          <Text style={[styles.faint, { color: theme.textSecondary }]}>{person.state}</Text>
        </View>
      ) : null}

      <PersonPracticeSettings person={person} style={{ marginTop: Spacing.two }} />

      {/* Contact (only fields this member chose to share) */}
      {person.email || person.phone ? (
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>CONTACT</Text>
          {person.email ? (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${person.email}`).catch(() => {})}
              style={({ pressed }) => [
                styles.contactRow,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
              ]}>
              <Mail color={theme.tint} size={18} />
              <Text style={[styles.contactText, { color: theme.text }]}>{person.email}</Text>
            </Pressable>
          ) : null}
          {person.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${person.phone}`).catch(() => {})}
              style={({ pressed }) => [
                styles.contactRow,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
              ]}>
              <Phone color={theme.tint} size={18} />
              <Text style={[styles.contactText, { color: theme.text }]}>{person.phone}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Organizations */}
      {orgs.length ? (
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            {orgs.length === 1 ? 'ORGANIZATION' : 'ORGANIZATIONS'}
          </Text>
          {orgs.map((org, i) => {
            const location = formatOrgLocation(org);
            const settings = sanitizePracticeSettingSlugs(org.practice_settings);
            return (
              <View
                key={i}
                style={[styles.orgCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                {org.name ? (
                  <Text style={[styles.orgName, { color: theme.text }]}>{org.name}</Text>
                ) : null}
                {org.role ? (
                  <Text style={[styles.line, { color: theme.textSecondary }]}>{org.role}</Text>
                ) : null}
                {settings.length ? (
                  <View style={{ gap: 4, marginTop: 2 }}>
                    <PracticeSettingChips slugs={settings} />
                    {settings.includes('other') && org.practice_setting_other ? (
                      <Text style={[styles.faint, { color: theme.textSecondary }]}>
                        {org.practice_setting_other}
                      </Text>
                    ) : null}
                  </View>
                ) : org.practice_setting ? (
                  <Text style={[styles.faint, { color: theme.textSecondary }]}>
                    {org.practice_setting}
                  </Text>
                ) : null}
                {location ? (
                  <View style={styles.iconRow}>
                    <MapPin color={theme.textSecondary} size={13} />
                    <Text style={[styles.faint, { color: theme.textSecondary }]}>{location}</Text>
                  </View>
                ) : null}
                {org.website ? (
                  <Pressable
                    onPress={() => WebBrowser.openBrowserAsync(org.website!).catch(() => {})}
                    style={styles.iconRow}>
                    <Globe color={theme.tint} size={13} />
                    <Text style={[styles.link, { color: theme.tint }]}>
                      {formatWebsiteLabel(org.website)}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center' },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  name: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 34, flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 4 },
  badgeText: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1 },
  credentials: { fontFamily: Fonts.medium, fontSize: 15 },
  section: { gap: Spacing.two, marginTop: Spacing.three },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 0.5 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  contactText: { fontFamily: Fonts.medium, fontSize: 15, flex: 1 },
  orgCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, gap: 3 },
  orgName: { fontFamily: Fonts.semibold, fontSize: 16 },
  line: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  faint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  link: { fontFamily: Fonts.medium, fontSize: 13 },
});
