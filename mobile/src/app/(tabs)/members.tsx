import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { US_STATES } from 'sampa-shared/usStates';

import { AuthButton } from '@/components/auth-button';
import { MemberCard } from '@/components/member-card';
import { ScreenScaffold } from '@/components/screen-scaffold';
import { SelectField } from '@/components/select-field';
import { Wordmark } from '@/components/wordmark';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import { fetchMemberDirectory } from '@/lib/directory';

const ALL_STATES = 'All states';

export default function MembersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading, isActiveMember, isEditor, isAdmin } = useAuth();
  // Mirrors the SQL is_active_member() helper the RPC enforces server-side.
  const canAccess = isActiveMember || isEditor || isAdmin;

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: people = [], status, refetch, isRefetching } = useQuery({
    queryKey: ['directory', debounced, stateFilter],
    queryFn: () => fetchMemberDirectory(debounced, stateFilter),
    enabled: !!user && canAccess,
  });

  // Session restoring on cold start → don't flash the signed-out state.
  if (loading) {
    return (
      <ScreenScaffold title="Members" icon={Users}>
        <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.four }} />
      </ScreenScaffold>
    );
  }

  // Signed out → sign-in prompt.
  if (!user) {
    return (
      <ScreenScaffold
        title="Members"
        subtitle="The SAMPA member directory — find and connect with addiction medicine PAs across the country. Sign in to browse."
        icon={Users}>
        <AuthButton label="Go to sign in" variant="primary" onPress={() => router.push('/account')} />
      </ScreenScaffold>
    );
  }

  // Signed in but not an active member → join pitch.
  if (!canAccess) {
    return (
      <ScreenScaffold
        title="Members"
        subtitle="The member directory is a benefit of active SAMPA membership — find and connect with addiction medicine PAs across the country."
        icon={Users}>
        <AuthButton
          label="Join SAMPA on the website"
          variant="primary"
          onPress={() => router.push('/account')}
        />
      </ScreenScaffold>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <MemberCard person={item} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.tint} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Wordmark size={20} />
              <Text style={[styles.title, { color: theme.text }]}>Members</Text>
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Search color={theme.textSecondary} size={18} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, organization, city…"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
              <SelectField
                label="State"
                value={stateFilter || ALL_STATES}
                options={[ALL_STATES, ...US_STATES]}
                onChange={(v) => setStateFilter(v === ALL_STATES ? '' : v)}
              />
              {status === 'success' ? (
                <Text style={[styles.count, { color: theme.textSecondary }]}>
                  {people.length} member{people.length === 1 ? '' : 's'}
                  {debounced || stateFilter ? ' matching' : ''}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            status === 'pending' ? (
              <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.five }} />
            ) : status === 'error' ? (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                Couldn’t load the directory. Pull down to try again.
              </Text>
            ) : (
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                No members match — try a different search or state.
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
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.three },
  title: { fontFamily: Fonts.serifBold, fontSize: 34, lineHeight: 40 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 46,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, height: '100%' },
  count: { fontFamily: Fonts.mono, fontSize: 12 },
  muted: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', marginTop: Spacing.five },
});
