import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { KeyPointCard } from '@/components/key-point-card';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchKeyPointsForTag } from '@/lib/content';

export default function KeywordScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data, status } = useQuery({
    queryKey: ['keyword', slug],
    queryFn: () => fetchKeyPointsForTag(String(slug)),
    enabled: !!slug,
  });
  const tag = data?.tag ?? null;
  const points = data?.points ?? [];

  if (status === 'pending') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }
  if (status === 'error' || !tag) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>
          {status === 'error' ? 'Something went wrong' : 'Keyword not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <FlatList
        data={points}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <KeyPointCard content={item.content} tags={item.tags} from={item.post} />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.tint }]}>KEYWORD</Text>
            <Text style={[styles.title, { color: theme.text }]}>{tag?.name}</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {points.length} key point{points.length === 1 ? '' : 's'} across all published news
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            No published key points use this keyword yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: Fonts.serifBold, fontSize: 22 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.one, marginBottom: Spacing.one },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1 },
  title: { fontFamily: Fonts.serifBold, fontSize: 30, lineHeight: 36 },
  count: { fontFamily: Fonts.sans, fontSize: 14 },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', marginTop: Spacing.five },
});
