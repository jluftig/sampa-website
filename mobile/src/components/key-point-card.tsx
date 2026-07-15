import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { formatDate } from 'sampa-shared/format';

import { TagChip } from '@/components/tag-chip';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tag } from '@/lib/content';

/**
 * A single Key Point: its text, keyword chips, and (when shown outside its own
 * article, e.g. keyword pages or search) a link back to the source article.
 */
export function KeyPointCard({
  content,
  tags = [],
  from,
}: {
  content: string;
  tags?: Tag[];
  from?: { title: string; slug: string; published_at?: string | null };
}) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={[styles.content, { color: theme.text }]}>{content}</Text>
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((t) => (
            <TagChip key={t.slug} tag={t} />
          ))}
        </View>
      ) : null}
      {from ? (
        <Text
          onPress={() => router.push(`/news/${from.slug}`)}
          style={[styles.from, { color: theme.tint }]}>
          from “{from.title}”{from.published_at ? ` · ${formatDate(from.published_at)}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  content: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  from: { fontFamily: Fonts.semibold, fontSize: 14, marginTop: 2 },
});
