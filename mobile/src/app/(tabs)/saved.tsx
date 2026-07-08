import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { PostCard } from '@/components/post-card';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { fetchPostsByIds, type PostSummary } from '@/lib/content';
import { supabase } from '@/lib/supabaseClient';

export default function SavedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Reload saved posts every time the tab is focused, so a save/unsave made in
  // an article (or on the website) is reflected here.
  const load = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      const { data } = await supabase.from('favorites').select('post_id').eq('user_id', userId);
      const ids = (data || []).map((r: any) => r.post_id);
      setPosts(await fetchPostsByIds(ids));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId, load])
  );

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

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={Header}
          ListEmptyComponent={
            status === 'loading' ? (
              <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
            ) : status === 'error' ? (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>Couldn’t load your saved articles.</Text>
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
