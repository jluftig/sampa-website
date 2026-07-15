// The signed-in user's saved post ids, as a SINGLE shared store (provider) with
// an optimistic toggle. On the website each page load refetches, so a per-hook
// copy is fine there; in a native stack navigator screens stay mounted, so
// per-component copies drift (e.g. unsaving in an article wouldn't update the
// Saved tab). Same `favorites` table as the web → saves sync across platforms.
// RLS limits reads/writes to the user's own rows and inserts to published posts.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

type FavoritesValue = {
  favoriteIds: Set<string>;
  ready: boolean;
  toggle: (postId: string) => Promise<boolean>;
  /** Refetch from the server (e.g. on Saved-tab focus, to pick up website-side changes). */
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('favorites').select('post_id').eq('user_id', userId);
    setIds(new Set((data || []).map((row: any) => row.post_id)));
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIds(new Set());
      setReady(true);
      return;
    }
    setReady(false);
    refresh();
  }, [userId, refresh]);

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

  return (
    <FavoritesContext.Provider value={{ favoriteIds: ids, ready, toggle, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
