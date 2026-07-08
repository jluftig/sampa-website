import { type LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenScaffoldProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Small badge shown under the header, e.g. "Coming soon". */
  badge?: string;
  children?: ReactNode;
  showWordmark?: boolean;
};

/**
 * Shared branded shell for a tab screen: safe-area, optional wordmark, a serif
 * title with a tinted icon, an optional subtitle/badge, and a content slot.
 * Phase 0 uses it for placeholder screens; later phases drop real content in.
 */
export function ScreenScaffold({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  showWordmark = true,
}: ScreenScaffoldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {showWordmark && (
            <View style={styles.wordmarkRow}>
              <Wordmark size={20} />
            </View>
          )}

          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: theme.backgroundSelected }]}>
              <Icon color={theme.tint} size={26} strokeWidth={2.25} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? (
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
            {badge ? (
              <View style={[styles.badge, { borderColor: theme.tint }]}>
                <Text style={[styles.badgeText, { color: theme.tint }]}>{badge}</Text>
              </View>
            ) : null}
          </View>

          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  wordmarkRow: { alignItems: 'flex-start' },
  header: { gap: Spacing.three, alignItems: 'flex-start' },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: { fontSize: 16, lineHeight: 24 },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  badgeText: { fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 0.5 },
});
