import { supabase } from './supabaseClient';

export type PostComment = {
  id: string;
  user_id: string;
  body: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

export type PostReaction = {
  user_id: string;
  emoji: string;
};

/** Returns null when the table/migration is not available yet (gotcha 14). */
export async function fetchPostComments(postId: string): Promise<PostComment[] | null> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, user_id, body, author_name, created_at, updated_at')
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) {
    // Relation missing / permission — treat as feature not ready.
    if (/relation|does not exist|permission|schema cache/i.test(error.message)) return null;
    throw error;
  }
  return data || [];
}

export async function fetchPostReactions(postId: string): Promise<PostReaction[] | null> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('user_id, emoji')
    .eq('post_id', postId);
  if (error) {
    if (/relation|does not exist|permission|schema cache/i.test(error.message)) return null;
    throw error;
  }
  return data || [];
}

export async function insertComment(postId: string, userId: string, body: string) {
  const { error } = await supabase.from('post_comments').insert({
    post_id: postId,
    user_id: userId,
    body,
  });
  if (error) throw error;
}

export async function softDeleteComment(id: string) {
  const { error } = await supabase
    .from('post_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateComment(id: string, userId: string, body: string) {
  const { error } = await supabase
    .from('post_comments')
    .update({ body })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Toggle / change the caller's single reaction on a post. */
export async function setReaction(
  postId: string,
  userId: string,
  emoji: string,
  current: string | null,
) {
  if (current === emoji) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }
  if (current) {
    const { error } = await supabase
      .from('post_reactions')
      .update({ emoji })
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('post_reactions')
    .insert({ post_id: postId, user_id: userId, emoji });
  if (error) throw error;
}
