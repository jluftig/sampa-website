import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tag } from '@/lib/content';

/** A tappable keyword pill. Defaults to opening that keyword's page. */
export function TagChip({ tag, onPress }: { tag: Tag; onPress?: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const handle = onPress ?? (() => router.push(`/keywords/${tag.slug}`));
  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text style={[styles.text, { color: theme.tint }]} numberOfLines={1}>
        {tag.short_label || tag.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: { fontFamily: Fonts.medium, fontSize: 12 },
});
