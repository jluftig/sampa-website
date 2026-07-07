import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

// The signed-in user's saved post ids, plus an optimistic toggle. RLS limits
// reads/writes to the user's own rows, and inserts to published posts.
export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setIds(new Set());
      setReady(true);
      return;
    }
    setReady(false);
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('post_id')
        .eq('user_id', userId);
      if (!active) return;
      setIds(new Set((data || []).map((row) => row.post_id)));
      setReady(true);
    })();
    return () => { active = false; };
  }, [userId]);

  const toggle = useCallback(
    async (postId) => {
      if (!userId) return false;
      const wasSaved = ids.has(postId);
      setIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(postId) : next.add(postId);
        return next;
      });
      const { error } = wasSaved
        ? await supabase.from('favorites').delete().eq('user_id', userId).eq('post_id', postId)
        : await supabase.from('favorites').insert({ user_id: userId, post_id: postId });
      if (error) {
        // Revert the optimistic flip.
        setIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(postId) : next.delete(postId);
          return next;
        });
        return wasSaved;
      }
      return !wasSaved;
    },
    [userId, ids]
  );

  return { favoriteIds: ids, ready, toggle };
}
