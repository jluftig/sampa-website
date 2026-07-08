import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A tappable search bar that opens the Search screen. */
export function SearchTrigger({ placeholder = 'Search news and key points…' }: { placeholder?: string }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/search')}
      style={({ pressed }) => [
        styles.bar,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Search color={theme.textSecondary} size={18} />
      <Text style={[styles.text, { color: theme.textSecondary }]} numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 46,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  text: { fontFamily: Fonts.sans, fontSize: 15, flex: 1 },
});
