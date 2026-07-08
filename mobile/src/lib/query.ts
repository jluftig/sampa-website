// TanStack Query setup: the app's server-state layer.
//
// Why Query on mobile (vs. the website's per-page useEffect fetching): phones
// keep the app alive for days, so screens need stale-while-revalidate — show
// cached content instantly, refresh in the background, refetch when the app
// foregrounds, and support pull-to-refresh. The AsyncStorage persister also
// restores the cache across cold starts (content appears immediately offline
// or on slow networks), which is the groundwork for Phase 4 offline reading.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

const DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // fresh for 1 min; then background-refetch on use
      gcTime: 7 * DAY, // keep cached data long enough to be useful offline
      retry: 2,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'sampa.queryCache',
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: 7 * DAY, // must not exceed gcTime
};

/** Drive Query's focus-refetching from AppState (the RN equivalent of window focus). */
export function useQueryFocusManager() {
  useEffect(() => {
    if (Platform.OS === 'web') return; // web handles focus natively
    const sub = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => sub.remove();
  }, []);
}
