import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchTrigger } from '@/components/search-bar';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchKeywordCounts } from '@/lib/content';

export default function KeywordsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: tags = [], status, refetch, isRefetching } = useQuery({
    queryKey: ['keywords'],
    queryFn: fetchKeywordCounts,
  });

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.tint} />
          }>
          <Wordmark size={20} />
          <Text style={[styles.title, { color: theme.text }]}>Keywords</Text>
          <SearchTrigger placeholder="Search all news and key points…" />

          {status === 'pending' ? (
            <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
          ) : status === 'error' ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>
              Couldn’t load keywords. Pull down to try again.
            </Text>
          ) : tags.length === 0 ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>
              Keywords appear once posts with key points are published.
            </Text>
          ) : (
            <View style={styles.chips}>
              {tags.map((tag) => (
                <Pressable
                  key={tag.slug}
                  onPress={() => router.push(`/keywords/${tag.slug}`)}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <Text style={[styles.chipName, { color: theme.text }]}>
                    {tag.short_label || tag.name}
                  </Text>
                  <View style={[styles.count, { backgroundColor: theme.backgroundSelected }]}>
                    <Text style={[styles.countText, { color: theme.tint }]}>{tag.count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { fontFamily: Fonts.serifBold, fontSize: 34, lineHeight: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.two,
  },
  chipName: { fontFamily: Fonts.semibold, fontSize: 15 },
  count: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  countText: { fontFamily: Fonts.mono, fontSize: 12 },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', marginTop: Spacing.five },
});
