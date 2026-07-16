import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  MAX_COMMENT_LENGTH,
  REACTIONS,
  normalizeCommentBody,
  summarizeReactions,
} from 'sampa-shared/comments';
import { formatDate } from 'sampa-shared/format';

import { AuthButton } from '@/components/auth-button';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/AuthContext';
import {
  fetchPostComments,
  fetchPostReactions,
  insertComment,
  softDeleteComment,
  setReaction,
  updateComment,
} from '@/lib/comments';

const WEBSITE = 'https://www.addictionpas.org';

type Props = {
  postId: string;
};

/**
 * Member discussion on a published article — emoji reactions + brief comments.
 * Mirrors the website PostComments component.
 */
export function PostDiscussion({ postId }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, isEditor, isAdmin, canAccessMemberDirectory, loading: authLoading } = useAuth();
  const canWrite = !!user && canAccessMemberDirectory;

  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => fetchPostComments(postId),
  });
  const reactionsQuery = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: () => fetchPostReactions(postId),
  });

  const unavailable =
    (commentsQuery.isSuccess && commentsQuery.data === null) ||
    (reactionsQuery.isSuccess && reactionsQuery.data === null);

  const comments = commentsQuery.data ?? [];
  const reactionRows = reactionsQuery.data ?? [];
  const { counts, mine } = useMemo(
    () => summarizeReactions(reactionRows, user?.id),
    [reactionRows, user?.id],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] });
  };

  const reactMutation = useMutation({
    mutationFn: (key: string) => setReaction(postId, user!.id, key, mine),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (e: any) => setError(e?.message || 'Could not save your reaction.'),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => insertComment(postId, user!.id, text),
    onSuccess: () => {
      setBody('');
      setError(null);
      invalidate();
    },
    onError: (e: any) => setError(e?.message || 'Could not post your comment.'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      updateComment(id, user!.id, text),
    onSuccess: () => {
      setEditingId(null);
      setEditBody('');
      setError(null);
      invalidate();
    },
    onError: (e: any) => setError(e?.message || 'Could not update the comment.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteComment(id),
    onSuccess: (_data, id) => {
      if (editingId === id) {
        setEditingId(null);
        setEditBody('');
      }
      setError(null);
      invalidate();
    },
    onError: (e: any) => setError(e?.message || 'Could not remove the comment.'),
  });

  if (unavailable) return null;

  const loading =
    authLoading ||
    ((commentsQuery.isPending || reactionsQuery.isPending) &&
      !commentsQuery.isSuccess &&
      !reactionsQuery.isSuccess);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.h2, { color: theme.text }]}>Member discussion</Text>
        <ActivityIndicator color={theme.tint} style={{ marginTop: Spacing.two }} />
      </View>
    );
  }

  const busy = commentMutation.isPending || editMutation.isPending || deleteMutation.isPending;

  const onRemove = (id: string) => {
    Alert.alert('Remove comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const onSubmit = () => {
    const normalized = normalizeCommentBody(body);
    if (!normalized.ok) {
      setError(normalized.error);
      return;
    }
    commentMutation.mutate(normalized.body);
  };

  const onSaveEdit = () => {
    if (!editingId) return;
    const normalized = normalizeCommentBody(editBody);
    if (!normalized.ok) {
      setError(normalized.error);
      return;
    }
    editMutation.mutate({ id: editingId, text: normalized.body });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.h2, { color: theme.text }]}>Member discussion</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        Brief reactions and comments from SAMPA members.
      </Text>

      <View style={styles.reactionRow}>
        {REACTIONS.map((r) => {
          const count = counts[r.key] || 0;
          const selected = mine === r.key;
          return (
            <Pressable
              key={r.key}
              disabled={!canWrite || reactMutation.isPending}
              onPress={() => canWrite && reactMutation.mutate(r.key)}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}${count ? `, ${count}` : ''}`}
              accessibilityState={{ selected, disabled: !canWrite }}
              style={({ pressed }) => [
                styles.reactionChip,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: selected ? theme.tint : theme.border,
                  opacity: pressed && canWrite ? 0.85 : canWrite ? 1 : 0.95,
                },
              ]}>
              <Text style={styles.glyph}>{r.glyph}</Text>
              {count > 0 ? (
                <Text style={[styles.count, { color: theme.textSecondary }]}>{count}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {comments.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          No comments yet. Be the first to share a thought.
        </Text>
      ) : (
        <View style={styles.list}>
          {comments.map((c) => {
            const isOwn = !!user && c.user_id === user.id;
            const canRemove = isOwn || isEditor || isAdmin;
            const isEditing = editingId === c.id;
            const edited =
              c.updated_at &&
              c.created_at &&
              new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 2000;
            return (
              <View key={c.id} style={[styles.comment, { borderTopColor: theme.border }]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.author, { color: theme.text }]}>
                      {c.author_name || 'Member'}
                    </Text>
                    <Text style={[styles.date, { color: theme.textSecondary }]}>
                      {formatDate(c.created_at)}
                      {edited ? ' · edited' : ''}
                    </Text>
                  </View>
                  {!isEditing ? (
                    <View style={styles.actions}>
                      {isOwn ? (
                        <Pressable
                          onPress={() => {
                            setEditingId(c.id);
                            setEditBody(c.body);
                            setError(null);
                          }}
                          hitSlop={8}
                          disabled={busy}>
                          <Text style={[styles.action, { color: theme.textSecondary }]}>Edit</Text>
                        </Pressable>
                      ) : null}
                      {canRemove ? (
                        <Pressable onPress={() => onRemove(c.id)} hitSlop={8} disabled={busy}>
                          <Text style={[styles.action, { color: theme.textSecondary }]}>Remove</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                {isEditing ? (
                  <View style={styles.editBox}>
                    <TextInput
                      value={editBody}
                      onChangeText={setEditBody}
                      maxLength={MAX_COMMENT_LENGTH}
                      multiline
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                    <View style={styles.composerRow}>
                      <Text style={[styles.counter, { color: theme.textSecondary }]}>
                        {editBody.trim().length}/{MAX_COMMENT_LENGTH}
                      </Text>
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => {
                            setEditingId(null);
                            setEditBody('');
                          }}
                          disabled={busy}
                          hitSlop={8}>
                          <Text style={[styles.action, { color: theme.textSecondary }]}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={onSaveEdit}
                          disabled={busy || !editBody.trim()}
                          style={({ pressed }) => [
                            styles.submit,
                            {
                              backgroundColor: theme.tint,
                              opacity: busy || !editBody.trim() ? 0.5 : pressed ? 0.85 : 1,
                            },
                          ]}>
                          <Text style={styles.submitLabel}>
                            {editMutation.isPending ? 'Saving…' : 'Save'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.body, { color: theme.text }]}>{c.body}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!user ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Sign in as a member to react or comment — open the Account tab.
        </Text>
      ) : !canWrite ? (
        <View style={styles.joinBox}>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Active membership is required to join the discussion.
          </Text>
          <AuthButton
            label="Join SAMPA on the website"
            variant="primary"
            onPress={() => WebBrowser.openBrowserAsync(`${WEBSITE}/join`)}
          />
        </View>
      ) : (
        <View style={styles.composer}>
          <TextInput
            value={body}
            onChangeText={setBody}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            placeholder="Share a brief thought…"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />
          <View style={styles.composerRow}>
            <Text style={[styles.counter, { color: theme.textSecondary }]}>
              {body.trim().length}/{MAX_COMMENT_LENGTH}
            </Text>
            <Pressable
              onPress={onSubmit}
              disabled={commentMutation.isPending || !body.trim()}
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: theme.tint,
                  opacity: commentMutation.isPending || !body.trim() ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={styles.submitLabel}>
                {commentMutation.isPending ? 'Posting…' : 'Post comment'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.four, gap: Spacing.two },
  h2: { fontFamily: Fonts.serifBold, fontSize: 24 },
  sub: { fontFamily: Fonts.sans, fontSize: 14, marginBottom: Spacing.one },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  glyph: { fontSize: 16 },
  count: { fontFamily: Fonts.mono, fontSize: 11 },
  empty: { fontFamily: Fonts.sans, fontSize: 14, marginBottom: Spacing.two },
  list: { gap: 0 },
  comment: { borderTopWidth: 1, paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: 4 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, flex: 1 },
  author: { fontFamily: Fonts.semibold, fontSize: 14 },
  date: { fontFamily: Fonts.mono, fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  action: { fontFamily: Fonts.mono, fontSize: 11 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  editBox: { gap: Spacing.two, marginTop: Spacing.one },
  error: { fontFamily: Fonts.sans, fontSize: 13, color: '#C62828', marginTop: Spacing.one },
  hint: { fontFamily: Fonts.sans, fontSize: 14, marginTop: Spacing.one },
  joinBox: { gap: Spacing.two, marginTop: Spacing.one },
  composer: { gap: Spacing.two, marginTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 88,
    fontFamily: Fonts.sans,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  composerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontFamily: Fonts.mono, fontSize: 11 },
  submit: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  submitLabel: { fontFamily: Fonts.semibold, fontSize: 14, color: '#fff' },
});
