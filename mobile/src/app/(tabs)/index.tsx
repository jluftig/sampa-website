import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { SearchTrigger } from '@/components/search-bar';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchPublishedPosts } from '@/lib/content';

export default function NewsScreen() {
  const theme = useTheme();
  const { data: posts = [], status, refetch, isRefetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPublishedPosts,
  });

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
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.tint} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Wordmark size={20} />
              <Text style={[styles.title, { color: theme.text }]}>News</Text>
              <SearchTrigger />
            </View>
          }
          ListEmptyComponent={
            status === 'pending' ? (
              <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
            ) : status === 'error' ? (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                Couldn’t load the news. Pull down to try again.
              </Text>
            ) : (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                No news yet — our first issue is on the way.
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
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', marginTop: Spacing.five },
});
