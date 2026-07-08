import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { PostCard } from '@/components/post-card';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { fetchPostsByIds } from '@/lib/content';
import { useFavorites } from '@/lib/favorites';

export default function SavedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { favoriteIds, ready, refresh } = useFavorites();

  // Sorted ids in the key → saving/unsaving anywhere in the app updates this
  // screen reactively; `refresh()` on focus picks up website-side changes too.
  const ids = [...favoriteIds].sort();
  const { data: posts = [], status, refetch, isRefetching } = useQuery({
    queryKey: ['saved-posts', ids],
    queryFn: () => fetchPostsByIds(ids),
    enabled: !!user && ready,
  });

  useFocusEffect(
    useCallback(() => {
      if (user) refresh();
    }, [user, refresh])
  );

  const onPullRefresh = useCallback(async () => {
    await Promise.all([refresh(), refetch()]);
  }, [refresh, refetch]);

  const Header = (
    <View style={styles.header}>
      <Wordmark size={20} />
      <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
    </View>
  );

  // Signed out → prompt to sign in.
  if (!user) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
          <View style={styles.content}>
            {Header}
            <Text style={[styles.muted, { color: theme.textSecondary }]}>
              Save articles to read later. Sign in to start your reading list — it syncs with the
              website.
            </Text>
            <AuthButton label="Go to sign in" variant="primary" onPress={() => router.push('/account')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const loading = !ready || (status === 'pending' && ids.length > 0);

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onPullRefresh} tintColor={theme.tint} />
          }
          ListHeaderComponent={Header}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
            ) : status === 'error' ? (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                Couldn’t load your saved articles. Pull down to try again.
              </Text>
            ) : (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                No saved articles yet. Tap “Save” on any article to add it here.
              </Text>
            )
          }
        />
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
  header: { gap: Spacing.three },
  title: { fontFamily: Fonts.serifBold, fontSize: 34, lineHeight: 40 },
  muted: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22, marginTop: Spacing.two },
});
