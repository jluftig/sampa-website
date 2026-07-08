import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { KeyPointCard } from '@/components/key-point-card';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchKeyPointsForTag, type KeyPointRow, type Tag } from '@/lib/content';

export default function KeywordScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [tag, setTag] = useState<Tag | null>(null);
  const [points, setPoints] = useState<KeyPointRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');
      try {
        const { tag, points } = await fetchKeyPointsForTag(String(slug));
        if (!active) return;
        if (!tag) {
          setStatus('notfound');
          return;
        }
        setTag(tag);
        setPoints(points);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }
  if (status === 'notfound' || status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>
          {status === 'notfound' ? 'Keyword not found' : 'Something went wrong'}
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
