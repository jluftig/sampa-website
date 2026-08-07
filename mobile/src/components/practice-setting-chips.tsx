import { StyleSheet, Text, View } from 'react-native';
import {
  collectPracticeSettings,
  formatPracticeSettingLabel,
  practiceSettingMobileColors,
  sanitizePracticeSettingSlugs,
} from 'sampa-shared/practiceSettings';
import { legacyPracticeSettingText } from 'sampa-shared/organizations';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DirectoryMember } from '@/lib/directory';

/** Soft color-coded practice-setting pills (mirrors web PracticeSettingChips). */
export function PracticeSettingChips({
  slugs,
  style,
}: {
  slugs: string[];
  style?: object;
}) {
  const clean = sanitizePracticeSettingSlugs(slugs);
  if (!clean.length) return null;
  return (
    <View style={[styles.row, style]}>
      {clean.map((slug) => {
        const colors = practiceSettingMobileColors(slug);
        return (
          <View key={slug} style={[styles.chip, { backgroundColor: colors.bg }]}>
            <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
              {formatPracticeSettingLabel(slug)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Union chips for a directory person, or legacy muted text. */
export function PersonPracticeSettings({
  person,
  style,
}: {
  person: DirectoryMember;
  style?: object;
}) {
  const theme = useTheme();
  const slugs = collectPracticeSettings(person);
  if (slugs.length) {
    return <PracticeSettingChips slugs={slugs} style={style} />;
  }
  const legacy = legacyPracticeSettingText(person);
  if (!legacy) return null;
  return (
    <Text style={[styles.legacy, { color: theme.textSecondary }, style]}>{legacy}</Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { fontFamily: Fonts.mono, fontSize: 11 },
  legacy: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
});
