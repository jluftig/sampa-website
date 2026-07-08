import { useRouter } from 'expo-router';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { useFavorites } from '@/lib/useFavorites';

/**
 * Save-for-later toggle. Signed-out readers are sent to the Account tab to sign
 * in (saves sync with the website via the shared `favorites` table).
 */
export function SaveButton({ postId }: { postId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { favoriteIds, ready, toggle } = useFavorites();
  const saved = favoriteIds.has(postId);

  const onPress = () => {
    if (!user) {
      router.push('/account');
      return;
    }
    toggle(postId);
  };

  const color = saved ? theme.tint : theme.textSecondary;
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <Pressable onPress={onPress} disabled={!!user && !ready} hitSlop={8} style={styles.row}>
      <Icon color={color} size={18} strokeWidth={2.25} />
      <Text style={[styles.label, { color }]}>{saved ? 'Saved' : 'Save'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontFamily: Fonts.semibold, fontSize: 14 },
});
