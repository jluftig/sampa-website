import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatDate, formatDateOnly } from 'sampa-shared/format';

import { ArticleBody } from '@/components/article-body';
import { KeyPointCard } from '@/components/key-point-card';
import { SaveButton } from '@/components/save-button';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchPost, type KeyPoint, type PostFull, type RelatedPost } from '@/lib/content';

function tagsForPoint(item: KeyPoint) {
  return (item.item_tags || []).map((l) => l.tags).filter(Boolean);
}

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [post, setPost] = useState<PostFull | null>(null);
  const [items, setItems] = useState<KeyPoint[]>([]);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      setStatus('loading');
      try {
        const { post, items, related } = await fetchPost(String(slug));
        if (!active) return;
        if (!post) {
          setStatus('notfound');
          return;
        }
        setPost(post);
        setItems(items);
        setRelated(related);
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
  if (status !== 'ready' || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>
          {status === 'notfound' ? 'Post not found' : 'Something went wrong'}
        </Text>
      </View>
    );
  }

  const meta = [formatDate(post.published_at), post.author_name].filter(Boolean).join(' · ');

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: theme.tint }]}>{meta.toUpperCase()}</Text>
        <SaveButton postId={post.id} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>

      {post.source_name || post.source_url ? (
        <Text style={[styles.source, { color: theme.textSecondary }]}>
          Source: {post.source_name || post.source_url}
          {post.source_published_at ? ` · ${formatDateOnly(post.source_published_at)}` : ''}
        </Text>
      ) : null}

      {post.cover_image_url ? (
        <Image source={{ uri: post.cover_image_url }} style={styles.cover} contentFit="cover" transition={150} />
      ) : null}
      {post.cover_image_caption ? (
        <Text style={[styles.caption, { color: theme.textSecondary }]}>{post.cover_image_caption}</Text>
      ) : null}

      {post.body_html ? <ArticleBody html={post.body_html} /> : null}

      {items.length ? (
        <View style={styles.section}>
          <Text style={[styles.h2, { color: theme.text }]}>Key Points</Text>
          {items.map((item) => (
            <KeyPointCard key={item.id} content={item.content} tags={tagsForPoint(item)} />
          ))}
        </View>
      ) : null}

      {related.length ? (
        <View style={styles.section}>
          <Text style={[styles.h2, { color: theme.text }]}>Related news</Text>
          {related.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/news/${r.slug}`)}
              style={({ pressed }) => [
                styles.related,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[styles.relatedMeta, { color: theme.tint }]}>
                {formatDate(r.published_at)} · {r.shared_keywords} shared keyword
                {Number(r.shared_keywords) === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.relatedTitle, { color: theme.text }]}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: Fonts.serifBold, fontSize: 22 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  meta: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 0.5, flexShrink: 1 },
  title: { fontFamily: Fonts.serifBold, fontSize: 30, lineHeight: 38, marginBottom: Spacing.two },
  source: { fontFamily: Fonts.sans, fontSize: 13, marginBottom: Spacing.three },
  cover: { width: '100%', height: 210, borderRadius: Radius.lg, marginBottom: Spacing.two },
  caption: { fontFamily: Fonts.sans, fontSize: 13, fontStyle: 'italic', marginBottom: Spacing.three },
  section: { marginTop: Spacing.four, gap: Spacing.three },
  h2: { fontFamily: Fonts.serifBold, fontSize: 24 },
  related: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: 4 },
  relatedMeta: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  relatedTitle: { fontFamily: Fonts.semibold, fontSize: 16 },
});
