// Single shared Supabase client for the mobile app (database, auth, storage).
//
// Web parity note: the web app reads Vite's `import.meta.env.VITE_SUPABASE_*`;
// on native we read Expo's `process.env.EXPO_PUBLIC_SUPABASE_*` (same values —
// the anon/publishable key is RLS-safe to ship). Sessions persist to
// AsyncStorage, and we disable URL-based session detection (that's a web-only
// OAuth-callback mechanism; native uses deep links instead — wired up in Phase 1).

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn loudly rather than hard-crash, so the app still boots during setup.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the values.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the auth token while the app is foregrounded; pause it in the
// background (Supabase's recommended React Native pattern).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
