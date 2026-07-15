import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate } from 'sampa-shared/format';

import { TagChip } from '@/components/tag-chip';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PostSummary } from '@/lib/content';

/** A news post preview card: cover, date · author, title, excerpt, keyword chips. */
export function PostCard({ post }: { post: PostSummary }) {
  const theme = useTheme();
  const router = useRouter();
  const meta = [formatDate(post.published_at), post.author_name].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/news/${post.slug}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}>
      {post.cover_image_url ? (
        <Image
          source={{ uri: post.cover_image_url }}
          style={styles.cover}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      <View style={styles.body}>
        {meta ? <Text style={[styles.meta, { color: theme.tint }]}>{meta.toUpperCase()}</Text> : null}
        <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
        {post.excerpt ? (
          <Text style={[styles.excerpt, { color: theme.textSecondary }]} numberOfLines={3}>
            {post.excerpt}
          </Text>
        ) : null}
        {post.tags.length ? (
          <View style={styles.tags}>
            {post.tags.slice(0, 4).map((t) => (
              <TagChip key={t.slug} tag={t} />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  cover: { width: '100%', height: 176 },
  body: { padding: Spacing.three, gap: Spacing.two },
  meta: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 0.5 },
  title: { fontFamily: Fonts.serifBold, fontSize: 20, lineHeight: 26 },
  excerpt: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 2 },
});
