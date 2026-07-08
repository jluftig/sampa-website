// The signed-in user's saved post ids + an optimistic toggle. Ported verbatim
// from the web app's src/lib/useFavorites.js — same `favorites` table, so saves
// made in the app show up on the website and vice versa. RLS limits reads/writes
// to the user's own rows and inserts to published posts.

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState<Set<string>>(() => new Set());
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
      const { data } = await supabase.from('favorites').select('post_id').eq('user_id', userId);
      if (!active) return;
      setIds(new Set((data || []).map((row: any) => row.post_id)));
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const toggle = useCallback(
    async (postId: string) => {
      if (!userId) return false;
      const wasSaved = ids.has(postId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(postId);
        else next.add(postId);
        return next;
      });
      const { error } = wasSaved
        ? await supabase.from('favorites').delete().eq('user_id', userId).eq('post_id', postId)
        : await supabase.from('favorites').insert({ user_id: userId, post_id: postId });
      if (error) {
        // Revert the optimistic flip.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(postId);
          else next.delete(postId);
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
