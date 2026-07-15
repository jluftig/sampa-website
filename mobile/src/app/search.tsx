import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatDate } from 'sampa-shared/format';

import { KeyPointCard } from '@/components/key-point-card';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchAll, type SearchPointRow, type SearchPostRow } from '@/lib/content';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<SearchPostRow[]>([]);
  const [points, setPoints] = useState<SearchPointRow[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const reqId = useRef(0);

  // Debounced search.
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setPosts([]);
      setPoints([]);
      setState('idle');
      return;
    }
    setState('loading');
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const { posts, points } = await searchAll(query);
        if (id !== reqId.current) return; // a newer query superseded this one
        setPosts(posts);
        setPoints(points);
        setState('done');
      } catch {
        if (id === reqId.current) setState('error');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const total = posts.length + points.length;

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.searchWrap}>
        <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <SearchIcon color={theme.textSecondary} size={18} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search news and key points…"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: theme.text }]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {state === 'loading' ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.four }} />
        ) : state === 'error' ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Search failed. Try again.</Text>
        ) : state === 'done' && total === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>No results for “{q.trim()}”.</Text>
        ) : null}

        {posts.length ? (
          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>ARTICLES</Text>
            {posts.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/news/${p.slug}`)}
                style={({ pressed }) => [
                  styles.postRow,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text style={[styles.postMeta, { color: theme.tint }]}>
                  {[formatDate(p.published_at), p.source_name].filter(Boolean).join(' · ').toUpperCase()}
                </Text>
                <Text style={[styles.postTitle, { color: theme.text }]}>{p.title}</Text>
                {p.excerpt ? (
                  <Text style={[styles.postExcerpt, { color: theme.textSecondary }]} numberOfLines={2}>
                    {p.excerpt}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {points.length ? (
          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>KEY POINTS</Text>
            {points.map((pt) => (
              <KeyPointCard
                key={pt.item_id}
                content={pt.content}
                from={{ title: pt.post_title, slug: pt.post_slug, published_at: pt.published_at }}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchWrap: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 16 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: { gap: Spacing.two },
  eyebrow: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1 },
  postRow: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: 4 },
  postMeta: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  postTitle: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 21 },
  postExcerpt: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 19 },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', marginTop: Spacing.four },
});
